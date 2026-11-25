"use client";

import type {
  SwipeEngine,
  SwipeableRowOpenSide,
  SwipeableRowRailsState,
  SwipeableRowSide,
  SwipeableRowTransitionOptions,
} from "./swipeable-row-engine";
import type {swipeableRowVariants} from "./swipeable-row.styles";

import {createContext, use, useSyncExternalStore} from "react";

export type SwipeableRowVariant = "standalone" | "inline";
export type SwipeableRowActionVariant = "default" | "accent" | "success" | "danger";

export interface SwipeableRowControls {
  /** Opens a logical rail. Ignored for a side without actions or while disabled. */
  open: (side: SwipeableRowSide, options?: SwipeableRowTransitionOptions) => void;
  /** Closes the row. */
  close: (options?: SwipeableRowTransitionOptions) => void;
  /** Immediately clears gesture and animation state and jumps closed. */
  reset: () => void;
}

export interface SwipeableRowContextValue extends SwipeableRowControls {
  engine: SwipeEngine;
  slots: ReturnType<typeof swipeableRowVariants>;
  openSide: SwipeableRowOpenSide;
  variant: SwipeableRowVariant;
  isDisabled: boolean;
  /** Which rails are mounted with at least one action. */
  rails: SwipeableRowRailsState;
  /** Disables descendant animations (root `animation="disable-all"`). */
  isAnimationDisabledForAll: boolean;
  labels: {openStart: string; openEnd: string; close: string};
  /** Opens a rail and moves focus to its first action (keyboard / screen reader path). */
  openAndFocus: (side: SwipeableRowSide) => void;
  /** Closes the row and moves focus back to the content. */
  closeAndFocusContent: () => void;
}

export const SwipeableRowContext = createContext<SwipeableRowContextValue | null>(null);

export interface SwipeableRowActionsContextValue {
  side: SwipeableRowSide;
}

export const SwipeableRowActionsContext = createContext<SwipeableRowActionsContextValue>({
  side: "end",
});

export interface SwipeableRowActionContextValue {
  variant: SwipeableRowActionVariant;
}

export const SwipeableRowActionContext = createContext<SwipeableRowActionContextValue>({
  variant: "default",
});

export const useSwipeableRowContext = (part: string) => {
  const context = use(SwipeableRowContext);

  if (!context) throw new Error(`${part} must be rendered inside <SwipeableRow>.`);

  return context;
};

/** Subscribes to the live gesture values (re-renders every animation frame while moving). */
export const useSwipeableRowSnapshot = (engine: SwipeEngine) =>
  useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

export interface UseSwipeableRowReturn extends SwipeableRowControls {
  /** Current logical open rail. */
  openSide: SwipeableRowOpenSide;
  /** Layout treatment of the row. */
  variant: SwipeableRowVariant;
  /** Whether row interaction is disabled. */
  isDisabled: boolean;
  /** Logical horizontal translation in px: positive reveals start, negative reveals end. */
  translation: number;
  /** Start rail reveal progress (0..1). */
  startProgress: number;
  /** End rail reveal progress (0..1). */
  endProgress: number;
}

/**
 * Reads the enclosing row state and controls from a descendant of `SwipeableRow`.
 * The numeric values are live: the calling component re-renders while the row moves.
 */
export const useSwipeableRow = (): UseSwipeableRowReturn => {
  const context = useSwipeableRowContext("useSwipeableRow");
  const snapshot = useSwipeableRowSnapshot(context.engine);

  return {
    close: context.close,
    endProgress: snapshot.endProgress,
    isDisabled: context.isDisabled,
    open: context.open,
    openSide: context.openSide,
    reset: context.reset,
    startProgress: snapshot.startProgress,
    translation: snapshot.translation,
    variant: context.variant,
  };
};
