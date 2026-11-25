"use client";

import type {
  PromptInputContextValue,
  PromptInputLayout,
  PromptInputSize,
  PromptInputStatus,
  PromptInputVariant,
} from "./prompt-input-context";
import type {ButtonProps, TextAreaProps} from "@heroui/react";
import type {
  CSSProperties,
  ChangeEvent,
  ComponentPropsWithRef,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";

import {Button, Spinner, TextArea, Tooltip} from "@heroui/react";
import {Children, use, useCallback, useLayoutEffect, useMemo, useRef, useState} from "react";

import {mergeRefs, useResolvedClassName} from "../../utils";

import {PromptInputContext, useButtonSize, usePromptInputContext} from "./prompt-input-context";
import {PromptInputErrorIcon, PromptInputSendIcon, PromptInputStopIcon} from "./prompt-input-icons";
import {measureOverflow, resolveMaxHeight} from "./prompt-input-utils";
import {promptInputVariants} from "./prompt-input.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const DEFAULT_PLACEHOLDER = "What do you want to know?";

/** Elements that keep their own click behaviour inside the shell. */
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, label, [contenteditable="true"], [role="button"], [role="menuitem"], [role="option"], [data-slot="prompt-input-toolbar"]';

/* -------------------------------------------------------------------------------------------------
 * Prompt Input Root
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputRootProps extends Omit<
  ComponentPropsWithRef<"div">,
  "onSubmit" | "defaultValue" | "onChange"
> {
  /** Controlled input value. */
  value?: string;
  /** Initial input value (uncontrolled). */
  defaultValue?: string;
  /** Called when the text changes. */
  onValueChange?: (value: string) => void;
  /** Called when submit is requested (Enter or the send button). */
  onSubmit?: () => void;
  /** Called by the send button in stoppable states (`submitted`, `streaming`). */
  onStop?: () => void;
  /** Composer run state. @default "ready" */
  status?: PromptInputStatus;
  /** Disable composer controls. @default false */
  isDisabled?: boolean;
  /** Disable the text input while `submitted` / `streaming`. @default true */
  lockInputOnRun?: boolean;
  /** Max input height, also exposed as `--prompt-input-max-height`. @default 240 */
  maxHeight?: number | string;
  /** Composer size. @default "md" */
  size?: PromptInputSize;
  /** Surface styling variant. @default "primary" */
  variant?: PromptInputVariant;
  /** Composer layout and toolbar placement. @default "stacked" */
  layout?: PromptInputLayout;
}

const PromptInputRoot = ({
  children,
  className,
  defaultValue = "",
  isDisabled = false,
  layout = "stacked",
  lockInputOnRun = true,
  maxHeight = 240,
  onStop,
  onSubmit,
  onValueChange,
  size = "md",
  status = "ready",
  style,
  value: valueProp,
  variant = "primary",
  ...rest
}: PromptInputRootProps) => {
  const slots = useMemo(
    () => promptInputVariants({layout, size, variant}),
    [layout, size, variant],
  );
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const inputRef = useRef<HTMLElement | null>(null);

  const isControlled = valueProp !== undefined;
  const textValue = isControlled ? valueProp : internalValue;
  const value = tokenValue ?? textValue;
  const isEmpty = value.length === 0;
  const isRunning = status === "submitted" || status === "streaming";
  const isInputDisabled = isDisabled || (lockInputOnRun && isRunning);

  // The multi-line form is sticky: it only collapses back once the prompt is empty again.
  if (isEmpty && isOverflowing) setIsOverflowing(false);

  const isExpanded = layout !== "stacked" && isOverflowing && !isEmpty;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const reportOverflow = useCallback((overflowing: boolean) => {
    if (overflowing) setIsOverflowing(true);
  }, []);

  const submit = useCallback(
    ({allowWhileRunning = false}: {allowWhileRunning?: boolean} = {}) => {
      if (isDisabled) return false;
      if (isRunning && !allowWhileRunning) return false;
      if (value.trim().length === 0) return false;

      onSubmit?.();

      // Uncontrolled text prompts reset themselves; token prompts are cleared through their state.
      if (!isControlled && tokenValue === null) setInternalValue("");

      return true;
    },
    [isControlled, isDisabled, isRunning, onSubmit, tokenValue, value],
  );

  const stop = useCallback(() => {
    if (isDisabled) return;
    onStop?.();
  }, [isDisabled, onStop]);

  const contextValue = useMemo<PromptInputContextValue>(
    () => ({
      inputRef,
      isDisabled,
      isExpanded,
      isInputDisabled,
      isRunning,
      layout,
      maxHeight,
      reportOverflow,
      setTokenValue,
      setValue,
      size,
      slots,
      status,
      stop,
      submit,
      value,
      variant,
    }),
    [
      isDisabled,
      isExpanded,
      isInputDisabled,
      isRunning,
      layout,
      maxHeight,
      reportOverflow,
      setValue,
      size,
      slots,
      status,
      stop,
      submit,
      value,
      variant,
    ],
  );

  const rootStyle = {
    "--prompt-input-max-height": typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
    ...style,
  } as CSSProperties;

  return (
    <PromptInputContext value={contextValue}>
      <div
        className={slots.base({className})}
        data-layout={layout}
        data-slot="prompt-input"
        data-status={status}
        data-variant={variant}
        style={rootStyle}
        {...rest}
        data-disabled={isDisabled ? "true" : undefined}
        data-expanded={isExpanded ? "true" : undefined}
        data-pending={isRunning ? "true" : undefined}
      >
        {children}
      </div>
    </PromptInputContext>
  );
};

PromptInputRoot.displayName = "HeroUI.PromptInput";

/* -------------------------------------------------------------------------------------------------
 * Shell (composer surface; clicking empty space focuses the input)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputShellProps extends ComponentPropsWithRef<"div"> {}

const PromptInputShell = ({className, onClick, ...rest}: PromptInputShellProps) => {
  const {inputRef, isInputDisabled, slots} = usePromptInputContext("PromptInput.Shell");

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || isInputDisabled) return;

      const target = event.target as Element | null;

      if (target?.closest(INTERACTIVE_SELECTOR)) return;
      // Keep an active text selection (e.g. a drag that ended outside the input).
      if (window.getSelection()?.toString()) return;

      inputRef.current?.focus();
    },
    [inputRef, isInputDisabled, onClick],
  );

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- pointer-only convenience that focuses the input on empty-space clicks; keyboard users tab straight to the input, so the surface needs no role or key handler
    <div
      className={slots.shell({className})}
      data-slot="prompt-input-shell"
      onClick={handleClick}
      {...rest}
    />
  );
};

PromptInputShell.displayName = "HeroUI.PromptInput.Shell";

/* -------------------------------------------------------------------------------------------------
 * Content (attachments + input)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputContentProps extends ComponentPropsWithRef<"div"> {}

const PromptInputContent = ({className, ...rest}: PromptInputContentProps) => {
  const {slots} = usePromptInputContext("PromptInput.Content");

  return <div className={slots.content({className})} data-slot="prompt-input-content" {...rest} />;
};

PromptInputContent.displayName = "HeroUI.PromptInput.Content";

/* -------------------------------------------------------------------------------------------------
 * Attachments (preview row; renders nothing without children)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputAttachmentsProps extends ComponentPropsWithRef<"div"> {}

const PromptInputAttachments = ({children, className, ...rest}: PromptInputAttachmentsProps) => {
  const {slots} = usePromptInputContext("PromptInput.Attachments");

  if (Children.toArray(children).length === 0) return null;

  return (
    <div className={slots.attachments({className})} data-slot="prompt-input-attachments" {...rest}>
      {children}
    </div>
  );
};

PromptInputAttachments.displayName = "HeroUI.PromptInput.Attachments";

/* -------------------------------------------------------------------------------------------------
 * TextArea (OSS TextArea with autosize, Enter to submit, Shift+Enter for a newline)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputTextAreaProps extends Omit<TextAreaProps, "value" | "defaultValue"> {
  /** Disable automatic height adjustment. @default false */
  disableAutosize?: boolean;
  /** Let Enter submit while the composer is `submitted` / `streaming`. @default false */
  allowSubmitWhileRunning?: boolean;
}

const PromptInputTextArea = ({
  allowSubmitWhileRunning = false,
  "aria-label": ariaLabel = "Message input",
  className,
  disableAutosize = false,
  disabled,
  fullWidth = true,
  onChange,
  onKeyDown,
  placeholder = DEFAULT_PLACEHOLDER,
  ref,
  rows = 1,
  ...rest
}: PromptInputTextAreaProps) => {
  const {
    inputRef,
    isExpanded,
    isInputDisabled,
    layout,
    maxHeight,
    reportOverflow,
    setValue,
    slots,
    submit,
    value,
  } = usePromptInputContext("PromptInput.TextArea");
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, localRef, inputRef), [ref, inputRef]);
  const resolvedClassName = useResolvedClassName(className, slots.textarea());

  const resize = useCallback(() => {
    const element = localRef.current;

    if (!element) return;

    const previousHeight = element.style.height;
    const previousTransition = element.style.transition;

    // Measure the natural height without animating the intermediate `auto` value.
    element.style.transition = "none";
    element.style.height = "auto";

    const scrollHeight = element.scrollHeight;

    if (layout !== "stacked" && !isExpanded) {
      reportOverflow(measureOverflow(element, scrollHeight, element.value));
    }

    if (disableAutosize) {
      element.style.height = previousHeight;
      element.style.transition = previousTransition;

      return;
    }

    const nextHeight = `${Math.min(scrollHeight, resolveMaxHeight(element, maxHeight))}px`;

    // Restore the previous height, commit it, then apply the new one so `height` transitions.
    element.style.height = previousHeight;
    void element.offsetHeight;
    element.style.transition = previousTransition;
    element.style.height = nextHeight;
  }, [disableAutosize, isExpanded, layout, maxHeight, reportOverflow]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  // Re-measure when the available width changes (wrapping depends on it).
  useLayoutEffect(() => {
    const element = localRef.current;

    if (!element || typeof ResizeObserver === "undefined") return;

    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === width) return;
      width = element.clientWidth;
      resize();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [resize]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(event);
      if (!event.defaultPrevented) setValue(event.target.value);
    },
    [onChange, setValue],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== "Enter" || event.shiftKey) return;
      // Never submit while an IME composition is being confirmed.
      if (event.nativeEvent.isComposing || event.keyCode === 229) return;

      event.preventDefault();
      submit({allowWhileRunning: allowSubmitWhileRunning});
    },
    [allowSubmitWhileRunning, onKeyDown, submit],
  );

  return (
    <TextArea
      ref={mergedRef}
      aria-label={ariaLabel}
      className={resolvedClassName}
      data-slot="prompt-input-textarea"
      disabled={disabled ?? isInputDisabled}
      fullWidth={fullWidth}
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
};

PromptInputTextArea.displayName = "HeroUI.PromptInput.TextArea";

/* -------------------------------------------------------------------------------------------------
 * Toolbar
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputToolbarProps extends ComponentPropsWithRef<"div"> {}

const PromptInputToolbar = ({className, ...rest}: PromptInputToolbarProps) => {
  const {slots} = usePromptInputContext("PromptInput.Toolbar");

  return <div className={slots.toolbar({className})} data-slot="prompt-input-toolbar" {...rest} />;
};

PromptInputToolbar.displayName = "HeroUI.PromptInput.Toolbar";

interface PromptInputToolbarStartProps extends ComponentPropsWithRef<"div"> {}

const PromptInputToolbarStart = ({className, ...rest}: PromptInputToolbarStartProps) => {
  const {slots} = usePromptInputContext("PromptInput.ToolbarStart");

  return (
    <div
      className={slots.toolbarStart({className})}
      data-slot="prompt-input-toolbar-start"
      {...rest}
    />
  );
};

PromptInputToolbarStart.displayName = "HeroUI.PromptInput.ToolbarStart";

interface PromptInputToolbarEndProps extends ComponentPropsWithRef<"div"> {}

const PromptInputToolbarEnd = ({className, ...rest}: PromptInputToolbarEndProps) => {
  const {slots} = usePromptInputContext("PromptInput.ToolbarEnd");

  return (
    <div className={slots.toolbarEnd({className})} data-slot="prompt-input-toolbar-end" {...rest} />
  );
};

PromptInputToolbarEnd.displayName = "HeroUI.PromptInput.ToolbarEnd";

/* -------------------------------------------------------------------------------------------------
 * Action (toolbar icon button with an optional tooltip)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputActionProps extends ButtonProps {
  /** Optional tooltip content. */
  tooltip?: ReactNode;
}

const PromptInputAction = ({
  isDisabled,
  isIconOnly = true,
  size,
  tooltip,
  variant,
  ...rest
}: PromptInputActionProps) => {
  const context = use(PromptInputContext);
  const buttonSize = useButtonSize();
  // On the secondary (default-coloured) surface a tertiary fill would disappear.
  const defaultVariant = context?.variant === "secondary" ? "outline" : "tertiary";

  const button = (
    <Button
      data-slot="prompt-input-action"
      isDisabled={isDisabled ?? context?.isDisabled}
      isIconOnly={isIconOnly}
      size={size ?? buttonSize}
      variant={variant ?? defaultVariant}
      {...rest}
    />
  );

  if (tooltip === undefined || tooltip === null || tooltip === false) return button;

  // Toolbar tooltips open as soon as the action is hovered (the close delay keeps the theme value).
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger>{button}</Tooltip.Trigger>
      <Tooltip.Content>{tooltip}</Tooltip.Content>
    </Tooltip>
  );
};

PromptInputAction.displayName = "HeroUI.PromptInput.Action";

/* -------------------------------------------------------------------------------------------------
 * Send (send / loading / stop / error, driven by `status`)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputSendProps extends ButtonProps {}

const SEND_LABELS: Record<PromptInputStatus, string> = {
  error: "Send message",
  ready: "Send message",
  streaming: "Stop",
  submitted: "Stop",
};

const PromptInputSend = ({
  "aria-label": ariaLabel,
  children,
  className,
  isDisabled,
  isIconOnly = true,
  onPress,
  size,
  variant = "primary",
  ...rest
}: PromptInputSendProps) => {
  const {
    isDisabled: isComposerDisabled,
    slots,
    status,
    stop,
    submit,
    value,
  } = usePromptInputContext("PromptInput.Send");
  const buttonSize = useButtonSize();
  const resolvedClassName = useResolvedClassName(className, slots.send());

  const isStoppable = status === "submitted" || status === "streaming";
  const canSubmit = value.trim().length > 0;

  const handlePress = useCallback<NonNullable<ButtonProps["onPress"]>>(
    (event) => {
      onPress?.(event);
      if (isStoppable) stop();
      else submit();
    },
    [isStoppable, onPress, stop, submit],
  );

  const defaultIcon =
    status === "submitted" ? (
      <Spinner color="current" size="sm" />
    ) : status === "streaming" ? (
      <PromptInputStopIcon className={slots.sendIcon()} height="1em" width="1em" />
    ) : status === "error" ? (
      <PromptInputErrorIcon className={slots.sendIcon()} />
    ) : (
      <PromptInputSendIcon className={slots.sendIcon()} />
    );

  return (
    <Button
      aria-label={ariaLabel ?? SEND_LABELS[status]}
      className={resolvedClassName}
      data-slot="prompt-input-send"
      data-status={status}
      isDisabled={isDisabled ?? (isComposerDisabled || (!isStoppable && !canSubmit))}
      isIconOnly={isIconOnly}
      size={size ?? buttonSize}
      variant={variant}
      onPress={handlePress}
      {...rest}
    >
      {children ?? defaultIcon}
    </Button>
  );
};

PromptInputSend.displayName = "HeroUI.PromptInput.Send";

/* -------------------------------------------------------------------------------------------------
 * Footer
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputFooterProps extends ComponentPropsWithRef<"p"> {}

const PromptInputFooter = ({className, ...rest}: PromptInputFooterProps) => {
  const {slots} = usePromptInputContext("PromptInput.Footer");

  return <p className={slots.footer({className})} data-slot="prompt-input-footer" {...rest} />;
};

PromptInputFooter.displayName = "HeroUI.PromptInput.Footer";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PromptInputRoot,
  PromptInputShell,
  PromptInputContent,
  PromptInputAttachments,
  PromptInputTextArea,
  PromptInputToolbar,
  PromptInputToolbarStart,
  PromptInputToolbarEnd,
  PromptInputAction,
  PromptInputSend,
  PromptInputFooter,
};

export type {
  PromptInputRootProps,
  PromptInputShellProps,
  PromptInputContentProps,
  PromptInputAttachmentsProps,
  PromptInputTextAreaProps,
  PromptInputToolbarProps,
  PromptInputToolbarStartProps,
  PromptInputToolbarEndProps,
  PromptInputActionProps,
  PromptInputSendProps,
  PromptInputFooterProps,
};
