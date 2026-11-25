"use client";

import type {RefObject} from "react";
import type {Position, TokenFieldSegment} from "react-aria-components/TokenField";

import {useCallback, useMemo, useRef, useState} from "react";
import {TokenFieldValue} from "react-aria-components/TokenField";

/* -------------------------------------------------------------------------------------------------
 * Trigger resolution
 * -----------------------------------------------------------------------------------------------*/
type ResolvedTrigger = {
  /** Position of the trigger's first character. */
  anchor: Position;
  /** The query typed after the trigger, up to the caret. */
  query: string;
  trigger: string;
};

const WHITESPACE = /\s/;

/** Finds the trigger the caret currently sits in (a trigger string at a word boundary). */
function resolveTrigger<T>(
  value: TokenFieldValue<T>,
  triggers: readonly string[],
  allowsSpaces: boolean,
): ResolvedTrigger | null {
  const range = value.selectedRange;

  if (!range || !range.isCollapsed) return null;

  const caret = range.current;
  const segment = value.segments[caret.index];

  if (!segment || segment.type !== "text") return null;

  const before = segment.text.slice(0, caret.offset);
  let best: (ResolvedTrigger & {start: number}) | null = null;

  for (const trigger of triggers) {
    if (!trigger) continue;

    let start = before.lastIndexOf(trigger);

    while (start >= 0) {
      const isAtBoundary = start === 0 || WHITESPACE.test(before[start - 1] ?? "");

      if (isAtBoundary) {
        const query = before.slice(start + trigger.length);
        const isValid = allowsSpaces ? !query.includes("\n") : !WHITESPACE.test(query);

        if (isValid && (!best || start > best.start)) {
          best = {anchor: {index: caret.index, offset: start}, query, start, trigger};
        }
        break;
      }
      start = start > 0 ? before.lastIndexOf(trigger, start - 1) : -1;
    }
  }

  if (!best) return null;

  return {anchor: best.anchor, query: best.query, trigger: best.trigger};
}

const anchorKey = (anchor: Position | null | undefined) =>
  anchor ? `${anchor.index}:${anchor.offset}` : null;

/* -------------------------------------------------------------------------------------------------
 * usePromptInputTokens
 * -----------------------------------------------------------------------------------------------*/
interface UsePromptInputTokensOptions<T = unknown> {
  /** Strings that open the menu at a word boundary. @default ['@', '/'] */
  triggers?: string[];
  /** Whether the query may run past the first space. @default false */
  allowsSpaces?: boolean;
  /** Initial value when uncontrolled. @default empty */
  defaultValue?: TokenFieldValue<T>;
  /** Controlled value. */
  value?: TokenFieldValue<T>;
  /** Called whenever the value changes (text, tokens or caret). */
  onChange?: (value: TokenFieldValue<T>) => void;
}

interface PromptInputTokenInsertOptions<T = unknown> {
  /** Insert a space after the token. @default true */
  appendSpace?: boolean;
  /** Arbitrary value stored on the token segment. */
  value?: T;
}

interface PromptInputTokenState<T = unknown> {
  /** The current token field value. */
  value: TokenFieldValue<T>;
  /** Replaces the value (e.g. `setValue(new TokenFieldValue([]))` to clear the prompt). */
  setValue: (value: TokenFieldValue<T>) => void;
  /** Ref to the contenteditable token input element. */
  inputRef: RefObject<HTMLDivElement | null>;
  /** Position of the active trigger (where the suggestion menu is anchored). */
  anchor: Position | null;
  /** Text typed after the active trigger. */
  query: string;
  /** The active trigger string, e.g. `"@"`. */
  trigger: string | null;
  /** Whether the suggestion menu should be shown. */
  isOpen: boolean;
  /** Replaces the active trigger and query (or inserts at the caret) with a token. Stable. */
  insertToken: (text: string, options?: PromptInputTokenInsertOptions<T>) => void;
  /** Hides the menu until the next edit or caret move. Stable. */
  close: () => void;
  /** @internal Escape: keeps the menu closed for the current trigger until the caret leaves it. */
  dismiss: () => void;
  /** @internal Focus tracking of the token input. */
  setFocused: (isFocused: boolean) => void;
}

function usePromptInputTokens<T = unknown>({
  allowsSpaces = false,
  defaultValue,
  onChange,
  triggers = ["@", "/"],
  value: valueProp,
}: UsePromptInputTokensOptions<T> = {}): PromptInputTokenState<T> {
  const [internalValue, setInternalValue] = useState<TokenFieldValue<T>>(
    () => defaultValue ?? new TokenFieldValue<T>([]),
  );
  const [isFocused, setIsFocused] = useState(false);
  const [closedValue, setClosedValue] = useState<TokenFieldValue<T> | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;
  const triggersKey = triggers.join("\u0000");

  const resolved = useMemo(
    () => resolveTrigger(value, triggersKey.split("\u0000"), allowsSpaces),
    [allowsSpaces, triggersKey, value],
  );
  const resolvedKey = anchorKey(resolved?.anchor);

  // Escape keeps the menu closed only while the caret stays in the dismissed trigger.
  if (dismissedKey !== null && dismissedKey !== resolvedKey) setDismissedKey(null);

  const isOpen =
    resolved !== null &&
    isFocused &&
    closedValue !== value &&
    (dismissedKey === null || dismissedKey !== resolvedKey);

  // Latest values for the stable callbacks below.
  const latest = useRef({isControlled, onChange, resolved, value});

  // eslint-disable-next-line react-hooks/refs -- latest-value ref for the stable callbacks below; they go to React Aria's TokenField (onChange) and user code, which may call them before an effect here could refresh it
  latest.current = {isControlled, onChange, resolved, value};

  const setValue = useCallback((next: TokenFieldValue<T>) => {
    if (!latest.current.isControlled) setInternalValue(next);
    latest.current.onChange?.(next);
  }, []);

  const close = useCallback(() => {
    setClosedValue(latest.current.value);
  }, []);

  const dismiss = useCallback(() => {
    setDismissedKey(anchorKey(latest.current.resolved?.anchor));
  }, []);

  const insertToken = useCallback(
    (
      text: string,
      {appendSpace = true, value: tokenValue}: PromptInputTokenInsertOptions<T> = {},
    ) => {
      const {resolved: active, value: current} = latest.current;
      const caret = current.selectedRange?.current ?? current.caretPosition;
      const start = active ? active.anchor : (current.selectedRange?.start ?? caret);
      const end = active ? caret : (current.selectedRange?.end ?? caret);
      const insert: TokenFieldSegment<T>[] = [{text, type: "token", value: tokenValue}];

      if (appendSpace) insert.push({text: " ", type: "text"});

      setValue(current.replaceRangeWithSegments(start, end, insert));
    },
    [setValue],
  );

  return {
    anchor: resolved?.anchor ?? null,
    close,
    dismiss,
    inputRef,
    insertToken,
    isOpen,
    query: resolved?.query ?? "",
    setFocused: setIsFocused,
    setValue,
    trigger: resolved?.trigger ?? null,
    value,
  };
}

export {usePromptInputTokens};

export type {UsePromptInputTokensOptions, PromptInputTokenInsertOptions, PromptInputTokenState};
