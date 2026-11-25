"use client";

import type {CommandVariants} from "./command.styles";
import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";
import type {AutocompleteProps} from "react-aria-components/Autocomplete";
import type {DialogRenderProps, OverlayTriggerState} from "react-aria-components/Dialog";
import type {MenuItemRenderProps} from "react-aria-components/Menu";

import {CloseButton} from "@heroui/react";
import {Children, createContext, isValidElement, use, useCallback, useMemo, useState} from "react";
import {Autocomplete as AutocompletePrimitive, useFilter} from "react-aria-components/Autocomplete";
import {Collection as CollectionPrimitive} from "react-aria-components/Collection";
import {Dialog as DialogPrimitive, OverlayTriggerStateContext} from "react-aria-components/Dialog";
import {Header as HeaderPrimitive} from "react-aria-components/Header";
import {Input as InputPrimitive} from "react-aria-components/Input";
import {
  MenuItem as MenuItemPrimitive,
  Menu as MenuPrimitive,
  MenuSection as MenuSectionPrimitive,
} from "react-aria-components/Menu";
import {
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
} from "react-aria-components/Modal";
import {SearchField as SearchFieldPrimitive} from "react-aria-components/SearchField";
import {Separator as SeparatorPrimitive} from "react-aria-components/Separator";

import {useResolvedClassName} from "../../utils";

import {commandVariants} from "./command.styles";

/* -------------------------------------------------------------------------------------------------
 * Defaults (observed on the Pro demos)
 * -----------------------------------------------------------------------------------------------*/
const DEFAULT_DIALOG_LABEL = "Command palette";
const DEFAULT_INPUT_LABEL = "Search commands";
const DEFAULT_INPUT_PLACEHOLDER = "Search commands...";
const DEFAULT_LIST_LABEL = "Suggestions";

/* -------------------------------------------------------------------------------------------------
 * Command Context
 * -----------------------------------------------------------------------------------------------*/
type CommandContext = {
  slots: ReturnType<typeof commandVariants>;
};

const CommandContext = createContext<CommandContext>({slots: commandVariants()});

const useCommandSlots = () => use(CommandContext).slots;

/* -------------------------------------------------------------------------------------------------
 * Command Root
 * -----------------------------------------------------------------------------------------------*/
interface CommandRootProps {
  /** Content of the command palette (usually a `Command.Backdrop`, optionally a trigger). */
  children?: ReactNode;
  /**
   * Whether the palette is open (controlled). Optional: the open state can also be passed straight
   * to `Command.Backdrop` (`isOpen` / `onOpenChange`), which is what the Pro demos do.
   */
  isOpen?: boolean;
  /** Whether the palette is open by default (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (isOpen: boolean) => void;
}

const CommandRoot = ({
  children,
  defaultOpen,
  isOpen: isOpenProp,
  onOpenChange,
}: CommandRootProps) => {
  const contextValue = useMemo<CommandContext>(() => ({slots: commandVariants()}), []);
  const parentState = use(OverlayTriggerStateContext);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : uncontrolledOpen;
  // Without own open-state props, an enclosing RAC DialogTrigger keeps driving the palette.
  const ownsState =
    isControlled || defaultOpen !== undefined || onOpenChange !== undefined || !parentState;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setUncontrolledOpen(value);
      if (value !== isOpen) onOpenChange?.(value);
    },
    [isControlled, isOpen, onOpenChange],
  );

  // Read by `Command.Backdrop` (RAC ModalOverlay falls back to this context when it gets no
  // `isOpen` / `defaultOpen` of its own). Deliberately NOT a RAC DialogTrigger: that would also
  // provide the root menu trigger state, and RAC Menu would then close the palette on every action.
  const ownState = useMemo<OverlayTriggerState>(
    () => ({
      close: () => setOpen(false),
      isOpen,
      open: () => setOpen(true),
      point: null,
      setOpen,
      setPoint: () => {},
      toggle: () => setOpen(!isOpen),
    }),
    [isOpen, setOpen],
  );

  return (
    <CommandContext value={contextValue}>
      <OverlayTriggerStateContext value={ownsState ? ownState : parentState}>
        {children}
      </OverlayTriggerStateContext>
    </CommandContext>
  );
};

CommandRoot.displayName = "HeroUI.Command";

/* -------------------------------------------------------------------------------------------------
 * Command Backdrop
 * -----------------------------------------------------------------------------------------------*/
interface CommandBackdropProps extends ComponentPropsWithRef<typeof ModalOverlayPrimitive> {
  /**
   * Backdrop visual style.
   * @default "opaque"
   */
  variant?: CommandVariants["variant"];
  /**
   * Whether clicking the backdrop closes the palette.
   * @default true
   */
  isDismissable?: boolean;
}

const CommandBackdrop = ({
  className,
  isDismissable = true,
  variant,
  ...rest
}: CommandBackdropProps) => {
  const slots = useMemo(() => commandVariants({variant}), [variant]);
  const resolvedClassName = useResolvedClassName(className, slots.backdrop());

  return (
    <ModalOverlayPrimitive
      {...rest}
      className={resolvedClassName}
      data-slot="command-backdrop"
      isDismissable={isDismissable}
    />
  );
};

CommandBackdrop.displayName = "HeroUI.Command.Backdrop";

/* -------------------------------------------------------------------------------------------------
 * Command Container
 * -----------------------------------------------------------------------------------------------*/
interface CommandContainerProps extends ComponentPropsWithRef<typeof ModalPrimitive> {
  /**
   * Size of the command dialog.
   * @default "md"
   */
  size?: CommandVariants["size"];
}

const CommandContainer = ({children, className, size, ...rest}: CommandContainerProps) => {
  const {slots: contextSlots} = use(CommandContext);
  const sizeSlots = useMemo(() => commandVariants({size}), [size]);
  const resolvedClassName = useResolvedClassName(className, contextSlots.container());
  const contextValue = useMemo<CommandContext>(
    () => ({slots: {...contextSlots, dialog: sizeSlots.dialog}}),
    [contextSlots, sizeSlots],
  );

  return (
    <ModalPrimitive {...rest} className={resolvedClassName} data-slot="command-container">
      {(renderProps) => (
        <CommandContext value={contextValue}>
          {typeof children === "function" ? children(renderProps) : children}
        </CommandContext>
      )}
    </ModalPrimitive>
  );
};

CommandContainer.displayName = "HeroUI.Command.Container";

/* -------------------------------------------------------------------------------------------------
 * Command Dialog (RAC Dialog + internal RAC Autocomplete)
 * -----------------------------------------------------------------------------------------------*/
interface CommandDialogProps extends Omit<
  ComponentPropsWithRef<typeof DialogPrimitive>,
  "children"
> {
  /** Content of the palette. A function receives the RAC Dialog render props (`close`). */
  children?: ReactNode | ((opts: DialogRenderProps) => ReactNode);
  /** Default search input value (uncontrolled). */
  defaultInputValue?: string;
  /** Search input value (controlled). */
  inputValue?: string;
  /** Called when the search input changes. */
  onInputChange?: (value: string) => void;
  /**
   * Custom filter function. Defaults to a case- and accent-insensitive "contains" match
   * (`useFilter({sensitivity: "base"}).contains`).
   */
  filter?: AutocompleteProps<object>["filter"];
  /**
   * Whether to keep the first item from being focused automatically after the list is filtered.
   * @default false
   */
  disableAutoFocusFirst?: boolean;
}

const CommandDialog = ({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  defaultInputValue,
  disableAutoFocusFirst,
  filter,
  inputValue,
  onInputChange,
  ...rest
}: CommandDialogProps) => {
  const slots = useCommandSlots();
  const {contains} = useFilter({sensitivity: "base"});

  return (
    <DialogPrimitive
      {...rest}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : DEFAULT_DIALOG_LABEL)}
      aria-labelledby={ariaLabelledBy}
      className={slots.dialog({className})}
      data-slot="command-dialog"
    >
      {(renderProps) => (
        <AutocompletePrimitive
          defaultInputValue={defaultInputValue}
          disableAutoFocusFirst={disableAutoFocusFirst}
          filter={filter ?? contains}
          inputValue={inputValue}
          onInputChange={onInputChange}
        >
          {typeof children === "function" ? children(renderProps) : children}
        </AutocompletePrimitive>
      )}
    </DialogPrimitive>
  );
};

CommandDialog.displayName = "HeroUI.Command.Dialog";

/* -------------------------------------------------------------------------------------------------
 * Command Header
 * -----------------------------------------------------------------------------------------------*/
interface CommandHeaderProps extends ComponentPropsWithRef<"div"> {}

const CommandHeader = ({className, ...rest}: CommandHeaderProps) => {
  const slots = useCommandSlots();

  return <div className={slots.header({className})} data-slot="command-header" {...rest} />;
};

CommandHeader.displayName = "HeroUI.Command.Header";

/* -------------------------------------------------------------------------------------------------
 * Command InputGroup (RAC SearchField)
 * -----------------------------------------------------------------------------------------------*/
interface CommandInputGroupProps extends ComponentPropsWithRef<typeof SearchFieldPrimitive> {
  /**
   * Whether the input is focused when the palette opens.
   * @default true
   */
  autoFocus?: boolean;
}

const CommandInputGroupRoot = ({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  autoFocus = true,
  className,
  ...rest
}: CommandInputGroupProps) => {
  const slots = useCommandSlots();
  const resolvedClassName = useResolvedClassName(className, slots.inputGroup());

  return (
    <SearchFieldPrimitive
      {...rest}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : DEFAULT_INPUT_LABEL)}
      aria-labelledby={ariaLabelledBy}
      autoFocus={autoFocus}
      className={resolvedClassName}
      data-slot="command-input-group"
    />
  );
};

CommandInputGroupRoot.displayName = "HeroUI.Command.InputGroup";

/* -------------------------------------------------------------------------------------------------
 * Command InputGroup Prefix
 * -----------------------------------------------------------------------------------------------*/
interface CommandInputGroupPrefixProps extends ComponentPropsWithRef<"div"> {}

const CommandInputGroupPrefix = ({className, ...rest}: CommandInputGroupPrefixProps) => {
  const slots = useCommandSlots();

  return (
    <div
      className={slots.inputGroupPrefix({className})}
      data-slot="command-input-group-prefix"
      {...rest}
    />
  );
};

CommandInputGroupPrefix.displayName = "HeroUI.Command.InputGroup.Prefix";

/* -------------------------------------------------------------------------------------------------
 * Command InputGroup Input (RAC Input - no BEM class, styled through its data-slot)
 * -----------------------------------------------------------------------------------------------*/
interface CommandInputGroupInputProps extends ComponentPropsWithRef<typeof InputPrimitive> {
  /**
   * Placeholder text.
   * @default "Search commands..."
   */
  placeholder?: string;
}

const CommandInputGroupInput = ({
  placeholder = DEFAULT_INPUT_PLACEHOLDER,
  ...rest
}: CommandInputGroupInputProps) => (
  <InputPrimitive {...rest} data-slot="command-input-group-input" placeholder={placeholder} />
);

CommandInputGroupInput.displayName = "HeroUI.Command.InputGroup.Input";

/* -------------------------------------------------------------------------------------------------
 * Command InputGroup Suffix
 * -----------------------------------------------------------------------------------------------*/
interface CommandInputGroupSuffixProps extends ComponentPropsWithRef<"div"> {}

const CommandInputGroupSuffix = ({className, ...rest}: CommandInputGroupSuffixProps) => {
  const slots = useCommandSlots();

  return (
    <div
      className={slots.inputGroupSuffix({className})}
      data-slot="command-input-group-suffix"
      {...rest}
    />
  );
};

CommandInputGroupSuffix.displayName = "HeroUI.Command.InputGroup.Suffix";

/* -------------------------------------------------------------------------------------------------
 * Command InputGroup ClearButton (HeroUI CloseButton wired to the SearchField clear slot)
 * -----------------------------------------------------------------------------------------------*/
interface CommandInputGroupClearButtonProps extends ComponentProps<typeof CloseButton> {}

const CommandInputGroupClearButton = ({className, ...rest}: CommandInputGroupClearButtonProps) => {
  const slots = useCommandSlots();
  const resolvedClassName = useResolvedClassName(className, slots.inputGroupClearButton());

  return (
    <CloseButton
      // RAC SearchField fills in the press handler, `aria-label="Clear search"` and tabIndex=-1.
      slot="clear"
      {...rest}
      className={resolvedClassName}
      data-slot="command-input-group-clear-button"
    />
  );
};

CommandInputGroupClearButton.displayName = "HeroUI.Command.InputGroup.ClearButton";

/* -------------------------------------------------------------------------------------------------
 * Command List (RAC Menu)
 * -----------------------------------------------------------------------------------------------*/
type CommandListProps<T extends object = object> = ComponentPropsWithRef<typeof MenuPrimitive<T>>;

function CommandList<T extends object = object>({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  renderEmptyState,
  ...rest
}: CommandListProps<T>) {
  const slots = useCommandSlots();
  const resolvedClassName = useResolvedClassName(className, slots.list());

  const renderEmpty = useMemo(
    () =>
      renderEmptyState
        ? () => (
            <div className={slots.empty()} data-slot="command-empty">
              {renderEmptyState()}
            </div>
          )
        : undefined,
    [renderEmptyState, slots],
  );

  return (
    <MenuPrimitive<T>
      {...rest}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : DEFAULT_LIST_LABEL)}
      aria-labelledby={ariaLabelledBy}
      className={resolvedClassName}
      data-slot="command-list"
      renderEmptyState={renderEmpty}
    />
  );
}

CommandList.displayName = "HeroUI.Command.List";

/* -------------------------------------------------------------------------------------------------
 * Command Item (RAC MenuItem)
 * -----------------------------------------------------------------------------------------------*/
/** Plain text of a React tree (keyboard hints excluded), used when no `textValue` is given. */
const getTextValue = (node: ReactNode): string => {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextValue).join(" ");
  if (!isValidElement<{children?: ReactNode}>(node)) return "";

  const {type} = node;
  const name = typeof type === "string" ? type : (type as {displayName?: string}).displayName;

  if (name === "kbd" || name?.startsWith("HeroUI.Kbd")) return "";

  return Children.toArray(node.props.children).map(getTextValue).join(" ");
};

type CommandItemProps<T extends object = object> = ComponentPropsWithRef<
  typeof MenuItemPrimitive<T>
>;

function CommandItem<T extends object = object>({
  children,
  className,
  textValue,
  ...rest
}: CommandItemProps<T>) {
  const slots = useCommandSlots();
  const resolvedClassName = useResolvedClassName(className, slots.item());

  const resolvedTextValue = useMemo(() => {
    if (textValue !== undefined || typeof children === "function") return textValue;
    if (typeof children === "string") return undefined;

    const text = getTextValue(children as ReactNode)
      .replace(/\s+/g, " ")
      .trim();

    return text || undefined;
  }, [children, textValue]);

  return (
    <MenuItemPrimitive<T>
      {...rest}
      className={resolvedClassName}
      data-slot="command-item"
      textValue={resolvedTextValue}
    >
      {children as ReactNode | ((values: MenuItemRenderProps) => ReactNode)}
    </MenuItemPrimitive>
  );
}

CommandItem.displayName = "HeroUI.Command.Item";

/* -------------------------------------------------------------------------------------------------
 * Command Group (RAC MenuSection + RAC Header)
 * -----------------------------------------------------------------------------------------------*/
interface CommandGroupProps<T extends object = object> extends ComponentPropsWithRef<
  typeof MenuSectionPrimitive<T>
> {
  /** Heading label for the group. */
  heading?: ReactNode;
}

function CommandGroup<T extends object = object>({
  children,
  className,
  heading,
  items,
  ...rest
}: CommandGroupProps<T>) {
  const slots = useCommandSlots();

  return (
    <MenuSectionPrimitive<T>
      {...rest}
      className={slots.group({className})}
      data-slot="command-group"
    >
      {heading != null && (
        <HeaderPrimitive className={slots.groupHeading()} data-slot="command-group-heading">
          {heading}
        </HeaderPrimitive>
      )}
      <CollectionPrimitive items={items}>{children}</CollectionPrimitive>
    </MenuSectionPrimitive>
  );
}

CommandGroup.displayName = "HeroUI.Command.Group";

/* -------------------------------------------------------------------------------------------------
 * Command Separator (RAC Separator)
 * -----------------------------------------------------------------------------------------------*/
interface CommandSeparatorProps extends ComponentPropsWithRef<typeof SeparatorPrimitive> {}

const CommandSeparator = ({className, ...rest}: CommandSeparatorProps) => {
  const slots = useCommandSlots();

  return (
    <SeparatorPrimitive
      {...rest}
      className={slots.separator({className})}
      data-slot="command-separator"
    />
  );
};

CommandSeparator.displayName = "HeroUI.Command.Separator";

/* -------------------------------------------------------------------------------------------------
 * Command Footer
 * -----------------------------------------------------------------------------------------------*/
interface CommandFooterProps extends ComponentPropsWithRef<"div"> {}

const CommandFooter = ({className, ...rest}: CommandFooterProps) => {
  const slots = useCommandSlots();

  return <div className={slots.footer({className})} data-slot="command-footer" {...rest} />;
};

CommandFooter.displayName = "HeroUI.Command.Footer";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CommandRoot,
  CommandBackdrop,
  CommandContainer,
  CommandDialog,
  CommandHeader,
  CommandInputGroupRoot,
  CommandInputGroupPrefix,
  CommandInputGroupInput,
  CommandInputGroupSuffix,
  CommandInputGroupClearButton,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandSeparator,
  CommandFooter,
  CommandContext,
};

export type {
  CommandRootProps,
  CommandBackdropProps,
  CommandContainerProps,
  CommandDialogProps,
  CommandHeaderProps,
  CommandInputGroupProps,
  CommandInputGroupPrefixProps,
  CommandInputGroupInputProps,
  CommandInputGroupSuffixProps,
  CommandInputGroupClearButtonProps,
  CommandListProps,
  CommandItemProps,
  CommandGroupProps,
  CommandSeparatorProps,
  CommandFooterProps,
};
