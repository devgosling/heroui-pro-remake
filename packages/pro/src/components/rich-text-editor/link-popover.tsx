"use client";

import type {ButtonProps, InputProps, PopoverProps} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Button, Input, Popover} from "@heroui/react";
import {createContext, use, useCallback, useMemo, useState} from "react";

import {useResolvedClassName} from "../../utils";

import {IconLink} from "./icons";
import {useRichTextEditorContext, useRichTextEditorState} from "./rich-text-editor-context";
import {normalizeLinkHref, withTooltip} from "./rich-text-editor-utils";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover Context
 * -----------------------------------------------------------------------------------------------*/
type LinkPopoverContextValue = {
  href: string;
  setHref: (href: string) => void;
  isLinkActive: boolean;
  close: () => void;
};

const LinkPopoverContext = createContext<LinkPopoverContextValue>({
  close: () => {},
  href: "",
  isLinkActive: false,
  setHref: () => {},
});

/* -------------------------------------------------------------------------------------------------
 * LinkPopover Root
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverProps extends Omit<PopoverProps, "children"> {
  children?: ReactNode;
}

const RichTextEditorLinkPopoverRoot = ({
  children,
  defaultOpen,
  isOpen: isOpenProp,
  onOpenChange,
  ...rest
}: RichTextEditorLinkPopoverProps) => {
  const {editor} = useRichTextEditorContext();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const [href, setHref] = useState("");
  const isOpen = isOpenProp ?? uncontrolledOpen;

  const isLinkActive =
    useRichTextEditorState(({editor: instance}) => instance.isActive("link")) ?? false;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Seed the input with the link under the selection each time the popover opens.
      if (open) setHref((editor?.getAttributes("link")["href"] as string | undefined) ?? "");
      if (isOpenProp === undefined) setUncontrolledOpen(open);
      onOpenChange?.(open);
    },
    [editor, isOpenProp, onOpenChange],
  );

  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  const contextValue = useMemo(
    () => ({close, href, isLinkActive, setHref}),
    [close, href, isLinkActive],
  );

  return (
    <LinkPopoverContext value={contextValue}>
      <Popover isOpen={isOpen} onOpenChange={handleOpenChange} {...rest}>
        {children}
      </Popover>
    </LinkPopoverContext>
  );
};

RichTextEditorLinkPopoverRoot.displayName = "HeroUI.RichTextEditor.LinkPopover";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover Trigger
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverTriggerProps extends ButtonProps {
  /** Optional tooltip content. */
  tooltip?: ReactNode;
}

const RichTextEditorLinkPopoverTrigger = ({
  "aria-label": ariaLabel = "Link",
  children,
  className,
  isDisabled: isDisabledProp,
  tooltip,
  ...rest
}: RichTextEditorLinkPopoverTriggerProps) => {
  const {editor, isDisabled, isReadOnly, slots} = useRichTextEditorContext();
  const {isLinkActive} = use(LinkPopoverContext);
  const resolvedClassName = useResolvedClassName(
    className,
    `${slots.toolbarButton()} ${slots.linkPopoverTrigger()}`,
  );

  const control = (
    <Button
      isIconOnly
      aria-label={ariaLabel}
      className={resolvedClassName}
      data-active={isLinkActive ? "true" : undefined}
      data-slot="rich-text-editor-link-popover-trigger"
      isDisabled={isDisabledProp || isDisabled || isReadOnly || !editor}
      size="sm"
      variant="ghost"
      {...rest}
    >
      {children ?? <IconLink />}
    </Button>
  );

  return withTooltip(control, tooltip);
};

RichTextEditorLinkPopoverTrigger.displayName = "HeroUI.RichTextEditor.LinkPopover.Trigger";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover Content
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverContentProps extends Omit<
  ComponentPropsWithRef<typeof Popover.Content>,
  "children"
> {
  children?: ReactNode;
  /** Props for the dialog body that wraps the children. */
  dialogProps?: Omit<ComponentPropsWithRef<typeof Popover.Dialog>, "children">;
  /** Whether to render the popover arrow. @default true */
  showArrow?: boolean;
}

const RichTextEditorLinkPopoverContent = ({
  children,
  className,
  dialogProps,
  placement = "bottom",
  showArrow = true,
  ...rest
}: RichTextEditorLinkPopoverContentProps) => {
  const {slots} = useRichTextEditorContext();
  const resolvedClassName = useResolvedClassName(className, slots.linkPopover());

  return (
    <Popover.Content
      className={resolvedClassName}
      data-slot="rich-text-editor-link-popover"
      placement={placement}
      {...rest}
    >
      {showArrow ? <Popover.Arrow /> : null}
      <Popover.Dialog
        {...dialogProps}
        data-slot="rich-text-editor-link-popover-content"
        className={slots.linkPopoverContent({
          className: typeof dialogProps?.className === "string" ? dialogProps.className : undefined,
        })}
      >
        {children}
      </Popover.Dialog>
    </Popover.Content>
  );
};

RichTextEditorLinkPopoverContent.displayName = "HeroUI.RichTextEditor.LinkPopover.Content";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover Input
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverInputProps extends InputProps {}

const RichTextEditorLinkPopoverInput = ({
  "aria-label": ariaLabel = "Link URL",
  className,
  onChange,
  placeholder = "https://example.com",
  ...rest
}: RichTextEditorLinkPopoverInputProps) => {
  const {slots} = useRichTextEditorContext();
  const {href, setHref} = use(LinkPopoverContext);
  const resolvedClassName = useResolvedClassName(className, slots.linkInput());

  return (
    <Input
      fullWidth
      aria-label={ariaLabel}
      className={resolvedClassName}
      data-slot="rich-text-editor-link-input"
      placeholder={placeholder}
      value={href}
      variant="secondary"
      onChange={(event) => {
        setHref(event.target.value);
        onChange?.(event);
      }}
      {...rest}
    />
  );
};

RichTextEditorLinkPopoverInput.displayName = "HeroUI.RichTextEditor.LinkPopover.Input";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover Actions
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverActionsProps extends ComponentPropsWithRef<"div"> {}

const RichTextEditorLinkPopoverActions = ({
  children,
  className,
  ...rest
}: RichTextEditorLinkPopoverActionsProps) => {
  const {slots} = useRichTextEditorContext();

  return (
    <div
      className={slots.linkPopoverActions({className})}
      data-slot="rich-text-editor-link-popover-actions"
      {...rest}
    >
      {children}
    </div>
  );
};

RichTextEditorLinkPopoverActions.displayName = "HeroUI.RichTextEditor.LinkPopover.Actions";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover UnsetButton
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverUnsetButtonProps extends ButtonProps {}

const RichTextEditorLinkPopoverUnsetButton = ({
  children,
  isDisabled: isDisabledProp,
  onPress,
  ...rest
}: RichTextEditorLinkPopoverUnsetButtonProps) => {
  const {editor, isDisabled, isReadOnly} = useRichTextEditorContext();
  const {close, isLinkActive} = use(LinkPopoverContext);

  return (
    <Button
      data-slot="rich-text-editor-link-unset-button"
      isDisabled={isDisabledProp || isDisabled || isReadOnly || !editor || !isLinkActive}
      size="sm"
      variant="tertiary"
      onPress={(event) => {
        editor?.chain().focus().extendMarkRange("link").unsetLink().run();
        close();
        onPress?.(event);
      }}
      {...rest}
    >
      {children ?? "Remove"}
    </Button>
  );
};

RichTextEditorLinkPopoverUnsetButton.displayName = "HeroUI.RichTextEditor.LinkPopover.UnsetButton";

/* -------------------------------------------------------------------------------------------------
 * LinkPopover ApplyButton
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorLinkPopoverApplyButtonProps extends ButtonProps {}

const RichTextEditorLinkPopoverApplyButton = ({
  children,
  isDisabled: isDisabledProp,
  onPress,
  ...rest
}: RichTextEditorLinkPopoverApplyButtonProps) => {
  const {editor, isDisabled, isReadOnly} = useRichTextEditorContext();
  const {close, href} = use(LinkPopoverContext);
  const normalized = normalizeLinkHref(href);

  return (
    <Button
      data-slot="rich-text-editor-link-apply-button"
      isDisabled={isDisabledProp || isDisabled || isReadOnly || !editor || !normalized}
      size="sm"
      variant="primary"
      onPress={(event) => {
        if (editor && normalized) {
          // Like the original: with a collapsed caret outside a link this stores the link mark, so
          // the next typed text becomes the link; inside a link it updates the whole link.
          editor.chain().focus().extendMarkRange("link").setLink({href: normalized}).run();
        }
        close();
        onPress?.(event);
      }}
      {...rest}
    >
      {children ?? "Apply"}
    </Button>
  );
};

RichTextEditorLinkPopoverApplyButton.displayName = "HeroUI.RichTextEditor.LinkPopover.ApplyButton";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  RichTextEditorLinkPopoverRoot,
  RichTextEditorLinkPopoverTrigger,
  RichTextEditorLinkPopoverContent,
  RichTextEditorLinkPopoverInput,
  RichTextEditorLinkPopoverActions,
  RichTextEditorLinkPopoverUnsetButton,
  RichTextEditorLinkPopoverApplyButton,
};

export type {
  RichTextEditorLinkPopoverProps,
  RichTextEditorLinkPopoverTriggerProps,
  RichTextEditorLinkPopoverContentProps,
  RichTextEditorLinkPopoverInputProps,
  RichTextEditorLinkPopoverActionsProps,
  RichTextEditorLinkPopoverUnsetButtonProps,
  RichTextEditorLinkPopoverApplyButtonProps,
};
