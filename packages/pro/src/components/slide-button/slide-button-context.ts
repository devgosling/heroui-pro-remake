"use client";

import type {
  SlideButtonMetrics,
  SlideButtonSpringConfig,
  SlideButtonStore,
} from "./slide-button-store";
import type {slideButtonVariants} from "./slide-button.styles";

import {createContext, use, useSyncExternalStore} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
export type SlideButtonVariant = "default" | "accent" | "success" | "danger";

/**
 * Root animation configuration.
 * - `false` / `"disabled"`: disable the root (reset) animation only
 * - `"disable-all"`: disable every animation, including the thumb snap
 * - `true` / `undefined`: default springs
 * - object: custom reset spring
 */
export type SlideButtonRootAnimation =
  | boolean
  | "disabled"
  | "disable-all"
  | {
      /** Spring used by the reset and auto-reset animation. @default {damping: 120, stiffness: 900, mass: 4} */
      resetSpringConfig?: SlideButtonSpringConfig;
    };

/**
 * Thumb animation configuration.
 * - `false` / `"disabled"`: snap without animation
 * - `true` / `undefined`: default spring
 * - object: custom snap spring
 */
export type SlideButtonThumbAnimation =
  | boolean
  | "disabled"
  | {
      /** Spring used by the snap-back and snap-to-end animation. @default {damping: 120, stiffness: 900, mass: 4} */
      springConfig?: SlideButtonSpringConfig;
    };

/** State passed to render-function children of `SlideButton`. */
export interface SlideButtonRenderProps extends SlideButtonMetrics {
  /** Current progress (0 = start, 1 = end). Updates on every frame while the thumb moves. */
  progress: number;
  /** Whether the slide action has been completed. */
  isCompleted: boolean;
  /** Whether the component is disabled. */
  isDisabled: boolean;
  /** Visual variant applied to the component. */
  variant: SlideButtonVariant;
}

/** Value returned by `useSlideButton()`. */
export interface UseSlideButtonReturn extends SlideButtonRenderProps {
  /** Progress threshold (0-1) at which releasing the thumb completes the action. */
  completionThreshold: number;
  /** Programmatically reset the slider to the start position. */
  reset: () => void;
}

/* -------------------------------------------------------------------------------------------------
 * Internal context (shared by the compound parts)
 * -----------------------------------------------------------------------------------------------*/
export interface SlideButtonActions {
  /** Stops a running animation and marks the thumb as dragged. */
  beginDrag: () => void;
  /** Moves the thumb while dragging. */
  setProgress: (progress: number) => void;
  /** Ends a drag: completes when past the threshold, otherwise springs back. */
  endDrag: (velocity: number) => void;
  /** Ends a drag without completing (pointer cancelled, page scrolled). */
  cancelDrag: (velocity: number) => void;
  /** Completes the action (keyboard / screen reader activation). */
  complete: () => void;
  /** Resets the slider to the start position. */
  reset: () => void;
  /** Registers the thumb's animation configuration. */
  setThumbAnimation: (animation: SlideButtonThumbAnimation | undefined) => void;
}

export interface SlideButtonContextValue {
  slots: ReturnType<typeof slideButtonVariants>;
  store: SlideButtonStore;
  actions: SlideButtonActions;
  variant: SlideButtonVariant;
  isCompleted: boolean;
  isDisabled: boolean;
  isDragging: boolean;
  completionThreshold: number;
  /** Id of the underlay content; names the thumb for assistive technology. */
  underlayId: string;
}

export const SlideButtonContext = createContext<SlideButtonContextValue | null>(null);

export const useSlideButtonContext = (part: string): SlideButtonContextValue => {
  const context = use(SlideButtonContext);

  if (!context) {
    throw new Error(`<SlideButton.${part}> must be rendered inside <SlideButton>.`);
  }

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Public hook
 * -----------------------------------------------------------------------------------------------*/

/**
 * Reads the state of the surrounding `SlideButton`. Must be used within a `SlideButton`.
 *
 * `progress` is a plain number that updates on every animation frame, so the calling component
 * re-renders while the thumb moves. For pure styling prefer the `--slide-button-progress` CSS
 * custom property on the root, which updates without re-rendering.
 */
export const useSlideButton = (): UseSlideButtonReturn => {
  const context = use(SlideButtonContext);

  if (!context) {
    throw new Error("useSlideButton must be used within a <SlideButton> component.");
  }

  const {completionThreshold, isCompleted, isDisabled, store, variant} = context;
  const progress = useSyncExternalStore(store.subscribe, store.getProgress, store.getProgress);
  const metrics = useSyncExternalStore(store.subscribe, store.getMetrics, store.getMetrics);

  return {
    ...metrics,
    completionThreshold,
    isCompleted,
    isDisabled,
    progress,
    reset: context.actions.reset,
    variant,
  };
};
