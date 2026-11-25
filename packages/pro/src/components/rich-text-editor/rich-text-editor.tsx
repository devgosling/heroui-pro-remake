"use client";

import type {ActionDefinition, RichTextEditorAction, RichTextEditorCommand} from "./commands";
import type {RichTextEditorContextValue} from "./rich-text-editor-context";
import type {RichTextEditorVariants} from "./rich-text-editor.styles";
import type {ButtonProps, ToggleButtonProps, ToolbarProps} from "@heroui/react";
import type {Editor, Extensions, JSONContent, UseEditorOptions} from "@tiptap/react";
import type {ComponentPropsWithRef, ReactNode, Ref} from "react";

import {Button, Separator, ToggleButton, Toolbar} from "@heroui/react";
import {CharacterCount, Placeholder} from "@tiptap/extensions";
import {EditorContent, useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {Children, Fragment, isValidElement, useEffect, useMemo, useRef, useState} from "react";

import {useResolvedClassName} from "../../utils";

import {ACTIONS, COMMANDS} from "./commands";
import {
  RichTextEditorContext,
  useRichTextEditorContext,
  useRichTextEditorState,
} from "./rich-text-editor-context";
import {withTooltip} from "./rich-text-editor-utils";
import {richTextEditorVariants} from "./rich-text-editor.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
/** Structural equality for Tiptap JSON documents (key order independent). */
function isJSONEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    const other = b as unknown[];

    return a.length === other.length && a.every((item, index) => isJSONEqual(item, other[index]));
  }

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord).filter((key) => aRecord[key] !== undefined);
  const bKeys = Object.keys(bRecord).filter((key) => bRecord[key] !== undefined);

  return (
    aKeys.length === bKeys.length && aKeys.every((key) => isJSONEqual(aRecord[key], bRecord[key]))
  );
}

type ValueOrEditorFn<T> = T | ((editor: Editor) => T);

const resolveEditorValue = <T,>(value: ValueOrEditorFn<T> | undefined, editor: Editor) =>
  typeof value === "function" ? (value as (editor: Editor) => T)(editor) : value;

/** Button variant used by action and command buttons: tertiary on page fills, outline on overlays. */
const useCommandButtonVariant = (): ButtonProps["variant"] => {
  const {variant} = useRichTextEditorContext();

  return variant === "secondary" ? "outline" : "tertiary";
};

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor Root
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorValueDetails {
  /** The document serialized as HTML. */
  html: string;
  /** The plain-text content of the document. */
  text: string;
  /** Whether the document is empty. */
  isEmpty: boolean;
  /** Character count from the CharacterCount extension. */
  characters: number;
  /** Word count from the CharacterCount extension. */
  words: number;
  /** The editor that produced the change. */
  editor: Editor;
}

interface RichTextEditorRootProps
  extends
    Omit<ComponentPropsWithRef<"div">, "defaultValue" | "onChange" | "placeholder">,
    RichTextEditorVariants {
  /** Controlled Tiptap JSON document. */
  value?: JSONContent;
  /** Initial uncontrolled Tiptap JSON document. */
  defaultValue?: JSONContent;
  /** Called on every edit with the JSON value plus HTML, text, empty state and counts. */
  onValueChange?: (value: JSONContent, details: RichTextEditorValueDetails) => void;
  /** Placeholder text for empty content. @default "Start writing..." */
  placeholder?: string;
  /** Character limit used by the CharacterCount extension and `RichTextEditor.CharacterCount`. */
  maxLength?: number;
  /** Disables editing and every control. @default false */
  isDisabled?: boolean;
  /** Keeps the content visible but not editable. @default false */
  isReadOnly?: boolean;
  /** Additional Tiptap extensions, appended after the defaults. */
  extensions?: Extensions;
  /** Advanced Tiptap editor options (`Partial<EditorOptions>` plus Tiptap React's render flags). */
  editorOptions?: UseEditorOptions;
  /** Accessible name of the editable area (used when `aria-labelledby` is not set). @default "Rich text editor" */
  "aria-label"?: string;
  /** ID of a visible label for the editable area. */
  "aria-labelledby"?: string;
  /** ID of help or error text for the editable area. */
  "aria-describedby"?: string;
}

const RichTextEditorRoot = ({
  "aria-describedby": ariaDescribedby,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  children,
  className,
  defaultValue,
  editorOptions,
  extensions,
  isDisabled = false,
  isReadOnly = false,
  maxLength,
  onValueChange,
  placeholder = "Start writing...",
  value,
  variant = "primary",
  ...rest
}: RichTextEditorRootProps) => {
  const slots = useMemo(() => richTextEditorVariants({variant}), [variant]);
  const isEditable = !isDisabled && !isReadOnly;

  const onValueChangeRef = useRef(onValueChange);
  const placeholderRef = useRef(placeholder);
  const editorOptionsRef = useRef(editorOptions);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
    placeholderRef.current = placeholder;
    editorOptionsRef.current = editorOptions;
  });

  // The document only seeds the editor once; later `value` changes are synced below.
  const [initialContent] = useState(() => value ?? defaultValue);

  const resolvedExtensions = useMemo<Extensions>(
    () => [
      StarterKit.configure({
        heading: {levels: [1, 2, 3]},
        link: {autolink: true, enableClickSelection: false, openOnClick: false},
      }),
      // eslint-disable-next-line react-hooks/refs -- Tiptap calls this lazily while building decorations (outside render), so it reads the latest `placeholder` without recreating the editor.
      Placeholder.configure({placeholder: () => placeholderRef.current}),
      CharacterCount.configure({limit: maxLength ?? null}),
      ...(extensions ?? []),
    ],
    [extensions, maxLength],
  );

  const attributes = useMemo(() => {
    const attrs: Record<string, string> = {"aria-multiline": "true"};

    if (ariaLabelledby) attrs["aria-labelledby"] = ariaLabelledby;
    else attrs["aria-label"] = ariaLabel ?? "Rich text editor";
    if (ariaDescribedby) attrs["aria-describedby"] = ariaDescribedby;
    if (isDisabled) attrs["aria-disabled"] = "true";
    else if (isReadOnly) attrs["aria-readonly"] = "true";
    attrs["data-slot"] = "rich-text-editor-prosemirror";
    attrs["class"] = slots.prosemirror();

    return attrs;
  }, [ariaDescribedby, ariaLabel, ariaLabelledby, isDisabled, isReadOnly, slots]);

  const externalEditorProps = editorOptions?.editorProps;

  const editorProps = useMemo(
    () => ({
      ...externalEditorProps,
      attributes: {
        ...(typeof externalEditorProps?.attributes === "object"
          ? externalEditorProps.attributes
          : {}),
        ...attributes,
      },
    }),
    [attributes, externalEditorProps],
  );

  const editor = useEditor({
    ...editorOptions,
    content: initialContent,
    editable: isEditable,
    editorProps,
    extensions: resolvedExtensions,
    immediatelyRender: editorOptions?.immediatelyRender ?? false,
    onUpdate: (props) => {
      editorOptionsRef.current?.onUpdate?.(props);

      const handler = onValueChangeRef.current;

      if (!handler) return;

      const {editor: instance} = props;

      handler(instance.getJSON(), {
        characters: instance.storage.characterCount?.characters() ?? 0,
        editor: instance,
        html: instance.getHTML(),
        isEmpty: instance.isEmpty,
        text: instance.getText(),
        words: instance.storage.characterCount?.words() ?? 0,
      });
    },
    shouldRerenderOnTransaction: editorOptions?.shouldRerenderOnTransaction ?? false,
  });

  // Editable state follows `isDisabled` / `isReadOnly` without emitting an update.
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable !== isEditable) {
      editor.setEditable(isEditable, false);
    }
  }, [editor, isEditable]);

  // Seed each new editor instance through `setContent` (like the original): the caret lands at the
  // end of the document, the toolbar reflects that position before the first interaction and
  // `onValueChange` reports the initial JSON, text and counts once.
  const seededEditorRef = useRef<Editor | null>(null);

  useEffect(() => {
    // The ref guard seeds once per editor instance; later `value` changes are handled below.
    if (!editor || editor.isDestroyed || seededEditorRef.current === editor) return;

    seededEditorRef.current = editor;
    editor.commands.setContent(value ?? initialContent ?? "");
  }, [editor, initialContent, value]);

  // Controlled value: replace the document when it differs from the editor's content.
  useEffect(() => {
    if (!editor || editor.isDestroyed || value === undefined) return;
    if (isJSONEqual(editor.getJSON(), value)) return;

    editor.commands.setContent(value, {emitUpdate: false});
  }, [editor, value]);

  // Placeholder text is read lazily by the extension; refresh the decorations when it changes.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    editor.view.dispatch(editor.state.tr.setMeta("addToHistory", false));
  }, [editor, placeholder]);

  const contextValue = useMemo<RichTextEditorContextValue>(
    () => ({editor, isDisabled, isReadOnly, maxLength, slots, variant}),
    [editor, isDisabled, isReadOnly, maxLength, slots, variant],
  );

  return (
    <RichTextEditorContext value={contextValue}>
      <div
        className={slots.base({className})}
        data-disabled={isDisabled ? "true" : undefined}
        data-readonly={isReadOnly ? "true" : undefined}
        data-slot="rich-text-editor"
        data-variant={variant}
        {...rest}
      >
        {children}
      </div>
    </RichTextEditorContext>
  );
};

RichTextEditorRoot.displayName = "HeroUI.RichTextEditor";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor Shell
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorShellProps extends ComponentPropsWithRef<"div"> {}

const RichTextEditorShell = ({children, className, ...rest}: RichTextEditorShellProps) => {
  const {slots} = useRichTextEditorContext();

  return (
    <div className={slots.shell({className})} data-slot="rich-text-editor-shell" {...rest}>
      {children}
    </div>
  );
};

RichTextEditorShell.displayName = "HeroUI.RichTextEditor.Shell";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor ToolbarSeparator
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorToolbarSeparatorProps extends Omit<
  ComponentPropsWithRef<typeof Separator>,
  "orientation"
> {}

const RichTextEditorToolbarSeparator = ({
  className,
  ...rest
}: RichTextEditorToolbarSeparatorProps) => {
  const {slots} = useRichTextEditorContext();

  return (
    <Separator
      className={slots.toolbarSeparator({className})}
      data-slot="rich-text-editor-toolbar-separator"
      orientation="vertical"
      {...rest}
    />
  );
};

RichTextEditorToolbarSeparator.displayName = "HeroUI.RichTextEditor.ToolbarSeparator";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor ToolbarGroup
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorToolbarGroupProps extends ComponentPropsWithRef<"div"> {}

const RichTextEditorToolbarGroup = ({
  children,
  className,
  ...rest
}: RichTextEditorToolbarGroupProps) => {
  const {slots} = useRichTextEditorContext();

  return (
    <div
      className={slots.toolbarGroup({className})}
      data-slot="rich-text-editor-toolbar-group"
      role="group"
      {...rest}
    >
      {children}
    </div>
  );
};

RichTextEditorToolbarGroup.displayName = "HeroUI.RichTextEditor.ToolbarGroup";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor Toolbar
 * -----------------------------------------------------------------------------------------------*/
const isToolbarGroup = (node: ReactNode) =>
  isValidElement(node) && node.type === RichTextEditorToolbarGroup;

/** Inserts a vertical separator between two adjacent toolbar groups. */
function withGroupSeparators(children: ReactNode): ReactNode {
  const items = Children.toArray(children);

  return items.map((child, index) => {
    const previous = items[index - 1];

    if (index > 0 && isToolbarGroup(child) && isToolbarGroup(previous)) {
      return (
        <Fragment key={isValidElement(child) ? (child.key ?? index) : index}>
          <RichTextEditorToolbarSeparator />
          {child}
        </Fragment>
      );
    }

    return child;
  });
}

interface RichTextEditorToolbarProps extends ToolbarProps {}

const RichTextEditorToolbar = ({
  "aria-label": ariaLabel = "Editor toolbar",
  children,
  className,
  ...rest
}: RichTextEditorToolbarProps) => {
  const {slots} = useRichTextEditorContext();
  const resolvedClassName = useResolvedClassName(className, slots.toolbar());

  return (
    <Toolbar
      aria-label={ariaLabel}
      className={resolvedClassName}
      data-slot="rich-text-editor-toolbar"
      {...rest}
    >
      {typeof children === "function" ? children : withGroupSeparators(children)}
    </Toolbar>
  );
};

RichTextEditorToolbar.displayName = "HeroUI.RichTextEditor.Toolbar";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor ToggleButton
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorToggleButtonProps extends Omit<
  ToggleButtonProps,
  "isSelected" | "defaultSelected" | "onChange"
> {
  /** Formatting command toggled by the button. */
  command: RichTextEditorCommand;
  /** Optional tooltip content. */
  tooltip?: ReactNode;
}

const RichTextEditorToggleButton = ({
  "aria-label": ariaLabel,
  children,
  className,
  command,
  isDisabled: isDisabledProp,
  tooltip,
  ...rest
}: RichTextEditorToggleButtonProps) => {
  const {editor, isDisabled, isReadOnly, slots} = useRichTextEditorContext();
  const resolvedClassName = useResolvedClassName(className, slots.toolbarButton());
  const definition = COMMANDS[command];

  const state = useRichTextEditorState(({editor: instance}) => ({
    canRun: instance.isEditable && definition.canRun(instance),
    isActive: definition.isActive(instance),
  }));

  const isActive = state?.isActive ?? false;
  const isButtonDisabled =
    isDisabledProp || isDisabled || isReadOnly || !editor || !(state?.canRun ?? false);

  const control = (
    <ToggleButton
      isIconOnly
      aria-label={ariaLabel ?? definition.label}
      className={resolvedClassName}
      data-active={isActive ? "true" : undefined}
      data-command={command}
      data-slot="rich-text-editor-toggle-button"
      isDisabled={isButtonDisabled}
      isSelected={isActive}
      size="sm"
      variant="ghost"
      onChange={() => {
        if (editor) definition.run(editor);
      }}
      {...rest}
    >
      {children ?? definition.icon}
    </ToggleButton>
  );

  return withTooltip(control, tooltip);
};

RichTextEditorToggleButton.displayName = "HeroUI.RichTextEditor.ToggleButton";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor ActionButton
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorActionButtonProps extends ButtonProps {
  /** Editor action run by the button. */
  action: RichTextEditorAction;
  /** Optional tooltip content. */
  tooltip?: ReactNode;
}

const RichTextEditorActionButton = ({
  action,
  "aria-label": ariaLabel,
  children,
  className,
  isDisabled: isDisabledProp,
  onPress,
  tooltip,
  variant,
  ...rest
}: RichTextEditorActionButtonProps) => {
  const {editor, isDisabled, isReadOnly, slots} = useRichTextEditorContext();
  const resolvedClassName = useResolvedClassName(className, slots.toolbarButton());
  const defaultVariant = useCommandButtonVariant();
  const definition: ActionDefinition = ACTIONS[action];

  const canRun = useRichTextEditorState(
    ({editor: instance}) => instance.isEditable && definition.canRun(instance),
  );

  const control = (
    <Button
      isIconOnly
      aria-label={ariaLabel ?? definition.label}
      className={resolvedClassName}
      data-action={action}
      data-slot="rich-text-editor-action-button"
      isDisabled={isDisabledProp || isDisabled || isReadOnly || !editor || !canRun}
      size="sm"
      variant={variant ?? defaultVariant}
      onPress={(event) => {
        if (editor) definition.run(editor);
        onPress?.(event);
      }}
      {...rest}
    >
      {children ?? definition.icon}
    </Button>
  );

  return withTooltip(control, tooltip);
};

RichTextEditorActionButton.displayName = "HeroUI.RichTextEditor.ActionButton";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor CommandButton
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorCommandButtonProps extends Omit<ButtonProps, "onPress" | "isDisabled"> {
  /** Command to run with the current editor. */
  onCommand: (editor: Editor) => void | boolean;
  /** Active state used for styling and `aria-pressed`. */
  isActive?: ValueOrEditorFn<boolean>;
  /** Command-specific disabled state. */
  isDisabled?: ValueOrEditorFn<boolean>;
  /** Optional tooltip content. */
  tooltip?: ReactNode;
}

const RichTextEditorCommandButton = ({
  children,
  className,
  isActive: isActiveProp,
  isDisabled: isDisabledProp,
  onCommand,
  tooltip,
  variant,
  ...rest
}: RichTextEditorCommandButtonProps) => {
  const {editor, isDisabled, isReadOnly, slots} = useRichTextEditorContext();
  const resolvedClassName = useResolvedClassName(className, slots.toolbarButton());
  const defaultVariant = useCommandButtonVariant();

  const state = useRichTextEditorState(({editor: instance}) => ({
    isActive: Boolean(resolveEditorValue(isActiveProp, instance)),
    isDisabled: Boolean(resolveEditorValue(isDisabledProp, instance)),
  }));

  const hasActiveState = isActiveProp !== undefined;
  const isActive = hasActiveState && (state?.isActive ?? false);

  const control = (
    <Button
      isIconOnly
      aria-pressed={hasActiveState ? isActive : undefined}
      className={resolvedClassName}
      data-active={isActive ? "true" : undefined}
      data-slot="rich-text-editor-command-button"
      isDisabled={isDisabled || isReadOnly || !editor || (state?.isDisabled ?? false)}
      size="sm"
      variant={variant ?? defaultVariant}
      onPress={() => {
        if (editor) onCommand(editor);
      }}
      {...rest}
    >
      {children}
    </Button>
  );

  return withTooltip(control, tooltip);
};

RichTextEditorCommandButton.displayName = "HeroUI.RichTextEditor.CommandButton";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor Content
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorContentProps extends Omit<ComponentPropsWithRef<"div">, "children"> {}

const RichTextEditorContent = ({className, ref, ...rest}: RichTextEditorContentProps) => {
  const {editor, slots} = useRichTextEditorContext();

  // Tiptap creates the editor after mount (`immediatelyRender: false`), so reserve its space.
  if (!editor) {
    return (
      <div
        aria-hidden="true"
        className={slots.loading()}
        data-slot="rich-text-editor-loading"
        {...rest}
      />
    );
  }

  return (
    <EditorContent
      className={slots.content({className})}
      data-slot="rich-text-editor-content"
      editor={editor}
      innerRef={ref as Ref<HTMLDivElement> as never}
      {...rest}
    />
  );
};

RichTextEditorContent.displayName = "HeroUI.RichTextEditor.Content";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor Footer
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorFooterProps extends ComponentPropsWithRef<"div"> {}

const RichTextEditorFooter = ({children, className, ...rest}: RichTextEditorFooterProps) => {
  const {slots} = useRichTextEditorContext();

  return (
    <div className={slots.footer({className})} data-slot="rich-text-editor-footer" {...rest}>
      {children}
    </div>
  );
};

RichTextEditorFooter.displayName = "HeroUI.RichTextEditor.Footer";

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor CharacterCount
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorCharacterCountStats {
  /** Number of characters in the document. */
  characters: number;
  /** Number of words in the document. */
  words: number;
  /** The configured `maxLength`, if any. */
  maxLength?: number;
  /** Whether the document exceeds `maxLength`. */
  isOverLimit: boolean;
}

interface RichTextEditorCharacterCountProps extends Omit<
  ComponentPropsWithRef<"span">,
  "children"
> {
  /** Appends the word count to the default label. @default false */
  showWords?: boolean;
  /** Custom count rendering. */
  children?: ReactNode | ((stats: RichTextEditorCharacterCountStats) => ReactNode);
}

const RichTextEditorCharacterCount = ({
  children,
  className,
  showWords = false,
  ...rest
}: RichTextEditorCharacterCountProps) => {
  const {maxLength, slots} = useRichTextEditorContext();

  const counts = useRichTextEditorState(({editor: instance}) => ({
    characters: instance.storage.characterCount?.characters() ?? 0,
    words: instance.storage.characterCount?.words() ?? 0,
  }));

  const characters = counts?.characters ?? 0;
  const words = counts?.words ?? 0;
  const isOverLimit = maxLength !== undefined && characters > maxLength;
  const stats: RichTextEditorCharacterCountStats = {characters, isOverLimit, maxLength, words};

  let content: ReactNode;

  if (typeof children === "function") content = children(stats);
  else if (children !== undefined) content = children;
  else {
    content =
      maxLength !== undefined
        ? `${characters} / ${maxLength} characters`
        : `${characters} characters`;
    if (showWords) content += `, ${words} words`;
  }

  return (
    <span
      className={slots.characterCount({className})}
      data-over-limit={isOverLimit ? "true" : undefined}
      data-slot="rich-text-editor-character-count"
      {...rest}
    >
      {content}
    </span>
  );
};

RichTextEditorCharacterCount.displayName = "HeroUI.RichTextEditor.CharacterCount";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  RichTextEditorRoot,
  RichTextEditorShell,
  RichTextEditorToolbar,
  RichTextEditorToolbarGroup,
  RichTextEditorToolbarSeparator,
  RichTextEditorToggleButton,
  RichTextEditorActionButton,
  RichTextEditorCommandButton,
  RichTextEditorContent,
  RichTextEditorFooter,
  RichTextEditorCharacterCount,
};

export type {
  RichTextEditorRootProps,
  RichTextEditorValueDetails,
  RichTextEditorShellProps,
  RichTextEditorToolbarProps,
  RichTextEditorToolbarGroupProps,
  RichTextEditorToolbarSeparatorProps,
  RichTextEditorToggleButtonProps,
  RichTextEditorActionButtonProps,
  RichTextEditorCommandButtonProps,
  RichTextEditorContentProps,
  RichTextEditorFooterProps,
  RichTextEditorCharacterCountProps,
  RichTextEditorCharacterCountStats,
};
