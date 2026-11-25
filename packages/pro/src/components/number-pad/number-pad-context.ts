"use client";

import type {numberPadVariants} from "./number-pad.styles";
import type {HapticFeedbackType} from "../../utils/haptics";
import type {CSSProperties} from "react";

import {createContext} from "react";

/* -------------------------------------------------------------------------------------------------
 * Animation types
 * -----------------------------------------------------------------------------------------------*/

/**
 * Animation configuration of the root. `"disable-all"` turns off the press animation of every key,
 * `undefined` keeps the defaults.
 */
export type NumberPadRootAnimation = "disable-all" | undefined;

export interface NumberPadKeyTimingConfig {
  /**
   * Duration of the scale transition in milliseconds.
   * @default 150
   */
  duration?: number;
  /**
   * CSS easing function of the scale transition (web replacement for a Reanimated easing).
   * @default "cubic-bezier(0.455, 0.03, 0.515, 0.955)" (ease-in-out quad)
   */
  easing?: string;
}

export interface NumberPadKeyAnimationConfig {
  /** `"disabled"` or `false` turns the animation off while keeping the custom properties. */
  state?: "disabled" | boolean;
  /** Press scale feedback. */
  scale?: {
    /**
     * Scale applied while the key is pressed.
     * @default 0.97
     */
    value?: number;
    /** Timing of the scale transition. */
    timingConfig?: NumberPadKeyTimingConfig;
  };
}

/**
 * Press feedback of a key: `false` / `"disabled"` turns it off, `true` / `undefined` uses the
 * defaults, an object customises it.
 */
export type NumberPadKeyAnimation = boolean | "disabled" | NumberPadKeyAnimationConfig | undefined;

/** Resolves a key animation into a data attribute value and CSS custom properties. */
export const resolveKeyAnimation = (
  animation: NumberPadKeyAnimation,
  isDisabledByParent: boolean,
  isAnimatedStyleActive: boolean,
): {isAnimationDisabled: boolean; style: CSSProperties | undefined} => {
  if (isDisabledByParent || !isAnimatedStyleActive || animation === false) {
    return {isAnimationDisabled: true, style: undefined};
  }
  if (animation === "disabled") return {isAnimationDisabled: true, style: undefined};
  if (animation === true || animation === undefined) {
    return {isAnimationDisabled: false, style: undefined};
  }

  const isAnimationDisabled = animation.state === "disabled" || animation.state === false;
  const scale = animation.scale?.value;
  const duration = animation.scale?.timingConfig?.duration;
  const easing = animation.scale?.timingConfig?.easing;
  const style: Record<string, string> = {};

  if (scale !== undefined) style["--number-pad-key-scale"] = String(scale);
  if (duration !== undefined) style["--number-pad-key-duration"] = `${duration}ms`;
  if (easing !== undefined) style["--number-pad-key-easing"] = easing;

  return {
    isAnimationDisabled,
    style: Object.keys(style).length ? (style as CSSProperties) : undefined,
  };
};

/* -------------------------------------------------------------------------------------------------
 * Root context
 * -----------------------------------------------------------------------------------------------*/

/** Identifies the Backspace cell in `pressedKey` (a physical Backspace key is held). */
export const NUMBER_PAD_BACKSPACE = "__number-pad-backspace__";

/** Delay before a held Backspace clears the whole value (matches React Native's long press). */
export const NUMBER_PAD_LONG_PRESS_DELAY = 500;

export interface NumberPadContextValue {
  slots?: ReturnType<typeof numberPadVariants>;
  /** Current value of the pad. */
  value: string;
  /** Maximum number of characters, if any. */
  maxLength?: number;
  /** Whether the entire pad is disabled. */
  isDisabled: boolean;
  /** Whether the root disabled every key animation (`animation="disable-all"`). */
  isAnimationDisabled: boolean;
  /** Key value currently held on a physical keyboard (shown as pressed), if any. */
  pressedKey: string | null;
  /** Plays a haptic if haptics are enabled for the pad. */
  haptic: (type?: HapticFeedbackType) => void;
  /** Whether a key press would currently change the value (not disabled, below maxLength). */
  canAppend: () => boolean;
  /** Appends a key value (respecting maxLength) and fires the callbacks. */
  appendKey: (key: string) => void;
  /** Removes the last character and fires the callbacks. */
  deleteLast: () => void;
  /** Clears the value (backspace long-press). */
  clear: () => void;
  /** Root-level `onSpacerPress`. */
  onSpacerPress?: () => void;
}

export const NumberPadContext = createContext<NumberPadContextValue | null>(null);

/* -------------------------------------------------------------------------------------------------
 * Key context (read by KeyLabel)
 * -----------------------------------------------------------------------------------------------*/
export interface NumberPadKeyContextValue {
  /** Value of the enclosing key (undefined inside Backspace / Spacer). */
  value?: string;
  isPressed: boolean;
  isDisabled: boolean;
}

export const NumberPadKeyContext = createContext<NumberPadKeyContextValue>({
  isDisabled: false,
  isPressed: false,
});
