"use client";

import type {promptInputVariants} from "./prompt-input.styles";
import type {RefObject} from "react";

import {createContext, use} from "react";

export type PromptInputStatus = "ready" | "submitted" | "streaming" | "error";
export type PromptInputSize = "sm" | "md" | "lg";
export type PromptInputVariant = "primary" | "secondary";
export type PromptInputLayout = "stacked" | "compact" | "inline";

export type PromptInputContextValue = {
  slots: ReturnType<typeof promptInputVariants>;
  /** The prompt text (the flattened token value while a `TokenInput` is mounted). */
  value: string;
  /** Updates the text value (controlled or internal). */
  setValue: (value: string) => void;
  /** Lets `TokenInput` publish its flattened value; `null` hands the value back to `value`. */
  setTokenValue: (value: string | null) => void;
  /** Requests a submit. Returns whether `onSubmit` was called. */
  submit: (options?: {allowWhileRunning?: boolean}) => boolean;
  /** Calls `onStop`. */
  stop: () => void;
  status: PromptInputStatus;
  /** `submitted` or `streaming`. */
  isRunning: boolean;
  isDisabled: boolean;
  /** Disabled state for the text input (composer disabled or locked while running). */
  isInputDisabled: boolean;
  size: PromptInputSize;
  variant: PromptInputVariant;
  layout: PromptInputLayout;
  /** Max input height in px (resolved from `maxHeight`). */
  maxHeight: number | string;
  /** Compact/inline layouts: whether the composer switched to its multi-line form. */
  isExpanded: boolean;
  /** Called by the input when its text no longer fits on one line. */
  reportOverflow: (overflowing: boolean) => void;
  /** The focusable input element (textarea or token input). */
  inputRef: RefObject<HTMLElement | null>;
};

export const PromptInputContext = createContext<PromptInputContextValue | null>(null);

export function usePromptInputContext(component: string): PromptInputContextValue {
  const context = use(PromptInputContext);

  if (!context) {
    throw new Error(`<${component}> must be rendered inside <PromptInput>.`);
  }

  return context;
}

/** Button size follows the composer (compact / inline layouts use small buttons). */
export function useButtonSize(): PromptInputSize {
  const context = use(PromptInputContext);

  if (!context) return "md";

  return context.layout === "stacked" ? context.size : "sm";
}
