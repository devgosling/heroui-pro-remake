"use client";

import type {PromptInputTokenState} from "./use-prompt-input-tokens";
import type {
  ComponentPropsWithRef,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
} from "react";
import type {AutocompleteProps} from "react-aria-components/Autocomplete";
import type {PopoverProps} from "react-aria-components/Popover";
import type {TokenInputProps, TokenProps, TokenSegment} from "react-aria-components/TokenField";

import {useCallback, useLayoutEffect, useMemo} from "react";
import {Autocomplete as AutocompletePrimitive} from "react-aria-components/Autocomplete";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";
import {
  TokenField as TokenFieldPrimitive,
  TokenFieldValue,
  TokenInput as TokenInputPrimitive,
  Token as TokenPrimitive,
  tokenFieldPositionToDOMRange,
} from "react-aria-components/TokenField";

import {mergeRefs, useResolvedClassName} from "../../utils";

import {usePromptInputContext} from "./prompt-input-context";
import {measureOverflow} from "./prompt-input-utils";

/* -------------------------------------------------------------------------------------------------
 * Tokens (React Aria Autocomplete: connects the token input to the suggestion menu)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputTokensProps<T = object> extends AutocompleteProps<T> {}

const PromptInputTokens = <T extends object = object>(props: PromptInputTokensProps<T>) => (
  <AutocompletePrimitive<T> {...props} />
);

PromptInputTokens.displayName = "HeroUI.PromptInput.Tokens";

/* -------------------------------------------------------------------------------------------------
 * Token (non-editable inline token)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputTokenProps extends TokenProps {
  ref?: ComponentPropsWithRef<"span">["ref"];
}

const PromptInputToken = ({className, ...rest}: PromptInputTokenProps) => {
  const {slots} = usePromptInputContext("PromptInput.Token");
  const resolvedClassName = useResolvedClassName(className, slots.token());

  return <TokenPrimitive className={resolvedClassName} data-slot="prompt-input-token" {...rest} />;
};

PromptInputToken.displayName = "HeroUI.PromptInput.Token";

/* -------------------------------------------------------------------------------------------------
 * TokenInput (contenteditable token field, an alternative to TextArea)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputTokenInputProps<T = unknown> extends Omit<
  TokenInputProps,
  "children" | "onKeyDown" | "onFocus" | "onBlur"
> {
  /** Token state from `usePromptInputTokens`. */
  tokens: PromptInputTokenState<T>;
  /** Renders each token segment. @default PromptInput.Token */
  children?: (segment: TokenSegment<T>) => ReactElement;
  /** Text shown while the field is empty. @default 'What do you want to know?' */
  placeholder?: string;
  /** Whether Shift+Enter inserts a newline. @default true */
  allowsNewlines?: boolean;
  /** Make the field read only. @default false */
  isReadOnly?: boolean;
  /** Defaults to the composer's disabled and run-lock state. */
  isDisabled?: boolean;
  /** Let Enter submit while the composer is `submitted` / `streaming`. @default false */
  allowSubmitWhileRunning?: boolean;
  /** Accessible label. @default 'Message input' */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onFocusChange?: (isFocused: boolean) => void;
  ref?: ComponentPropsWithRef<"div">["ref"];
}

const PromptInputTokenInput = <T,>({
  allowSubmitWhileRunning = false,
  allowsNewlines = true,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel = "Message input",
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  isDisabled,
  isReadOnly = false,
  onFocusChange,
  onKeyDown,
  placeholder = "What do you want to know?",
  ref,
  tokens,
  ...rest
}: PromptInputTokenInputProps<T>) => {
  const {
    inputRef: composerInputRef,
    isExpanded,
    isInputDisabled,
    layout,
    reportOverflow,
    setTokenValue,
    slots,
    submit,
  } = usePromptInputContext("PromptInput.TokenInput");
  const {inputRef, setFocused, setValue, value} = tokens;
  const mergedRef = useMemo(
    () => mergeRefs(ref, inputRef, composerInputRef),
    [ref, inputRef, composerInputRef],
  );
  const resolvedClassName = useResolvedClassName(className, slots.tokenInput());
  const text = value.toString();
  const isEmpty = value.segments.length === 0 || text.length === 0;

  // Publish the flattened prompt for Send and the compact layout; hand it back on unmount.
  useLayoutEffect(() => {
    setTokenValue(text);
  }, [setTokenValue, text]);
  useLayoutEffect(() => () => setTokenValue(null), [setTokenValue]);

  // Compact / inline layouts: switch to the multi-line form once the text wraps.
  useLayoutEffect(() => {
    const element = inputRef.current;

    if (!element || layout === "stacked" || isExpanded) return;
    reportOverflow(measureOverflow(element, element.scrollHeight, text));
  }, [inputRef, isExpanded, layout, reportOverflow, text]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.key === "Escape" && tokens.isOpen) {
        // Handled here so the Autocomplete does not forward it to the collection.
        event.preventDefault();
        tokens.dismiss();
      }
    },
    [onKeyDown, tokens],
  );

  const handleFocus = useCallback(() => {
    onFocusChange?.(true);
    setFocused(true);
  }, [onFocusChange, setFocused]);

  const handleBlur = useCallback(
    (event: FocusEvent<Element>) => {
      // The Autocomplete moves virtual focus into the menu with synthetic blur events, and a
      // pointer press inside the suggestion popover must not close it either.
      if (!event.nativeEvent.isTrusted) return;

      const next = event.relatedTarget as Element | null;

      if (next?.closest('[data-slot="prompt-input-token-suggestions"]')) return;
      onFocusChange?.(false);
      setFocused(false);
    },
    [onFocusChange, setFocused],
  );

  const handleSubmit = useCallback(() => {
    submit({allowWhileRunning: allowSubmitWhileRunning});
  }, [allowSubmitWhileRunning, submit]);

  const renderToken =
    children ?? ((segment: TokenSegment<T>) => <PromptInputToken>{segment.text}</PromptInputToken>);

  return (
    <TokenFieldPrimitive<TokenFieldValue<T>>
      allowsNewlines={allowsNewlines}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      isDisabled={isDisabled ?? isInputDisabled}
      isReadOnly={isReadOnly}
      value={value}
      onBlur={handleBlur}
      onChange={setValue}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onSubmit={handleSubmit}
    >
      <TokenInputPrimitive<TokenFieldValue<T>>
        ref={mergedRef}
        className={resolvedClassName}
        data-placeholder={placeholder}
        data-slot="prompt-input-token-input"
        {...rest}
        aria-placeholder={placeholder}
        data-empty={isEmpty ? "true" : undefined}
      >
        {renderToken}
      </TokenInputPrimitive>
    </TokenFieldPrimitive>
  );
};

PromptInputTokenInput.displayName = "HeroUI.PromptInput.TokenInput";

/* -------------------------------------------------------------------------------------------------
 * TokenSuggestions (popover anchored to the active trigger)
 * -----------------------------------------------------------------------------------------------*/
interface PromptInputTokenSuggestionsProps<T = unknown> extends Omit<
  PopoverProps,
  "triggerRef" | "getTargetRect"
> {
  /** Token state from `usePromptInputTokens`. */
  tokens: PromptInputTokenState<T>;
}

const PromptInputTokenSuggestions = <T,>({
  className,
  isOpen,
  onMouseDown,
  onOpenChange,
  placement = "bottom start",
  tokens,
  ...rest
}: PromptInputTokenSuggestionsProps<T>) => {
  const {slots} = usePromptInputContext("PromptInput.TokenSuggestions");
  const resolvedClassName = useResolvedClassName(className, slots.tokenSuggestions());
  const {anchor, close, inputRef, trigger} = tokens;

  const getTargetRect = useCallback(
    (target: Element) => {
      if (!anchor) return target.getBoundingClientRect();

      try {
        // Measure the trigger character itself: a collapsed range has no rect on empty lines.
        const range = tokenFieldPositionToDOMRange(target, anchor);
        const end = tokenFieldPositionToDOMRange(target, {
          index: anchor.index,
          offset: anchor.offset + (trigger?.length ?? 1),
        });

        range.setEnd(end.endContainer, end.endOffset);

        const rect = range.getBoundingClientRect();

        if (rect.width === 0 && rect.height === 0) return target.getBoundingClientRect();

        return rect;
      } catch {
        return target.getBoundingClientRect();
      }
    },
    [anchor, trigger],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
      if (!open) close();
    },
    [close, onOpenChange],
  );

  // Keep focus (and the caret) in the token input while the menu is clicked.
  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      onMouseDown?.(event);
      event.preventDefault();
    },
    [onMouseDown],
  );

  return (
    <PopoverPrimitive
      isNonModal
      className={resolvedClassName}
      data-slot="prompt-input-token-suggestions"
      getTargetRect={getTargetRect}
      isOpen={isOpen ?? tokens.isOpen}
      placement={placement}
      trigger="MenuTrigger"
      triggerRef={inputRef}
      onMouseDown={handleMouseDown}
      onOpenChange={handleOpenChange}
      {...rest}
    />
  );
};

PromptInputTokenSuggestions.displayName = "HeroUI.PromptInput.TokenSuggestions";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PromptInputTokens,
  PromptInputToken,
  PromptInputTokenInput,
  PromptInputTokenSuggestions,
  TokenFieldValue,
};

export type {
  PromptInputTokensProps,
  PromptInputTokenProps,
  PromptInputTokenInputProps,
  PromptInputTokenSuggestionsProps,
};
