"use client";

import type {
  PositionController,
  SwipeableTabsMeasurement,
  SwipeableTabsMeasurements,
} from "./swipeable-tabs-motion";
import type {swipeableTabsVariants} from "./swipeable-tabs.styles";
import type {HapticFeedbackType} from "../../utils/haptics";
import type {ReactNode} from "react";

import {createContext, use, useCallback, useSyncExternalStore} from "react";

/* -------------------------------------------------------------------------------------------------
 * Root context (internal)
 * -----------------------------------------------------------------------------------------------*/
export type SwipeableTabsVariant = "primary" | "secondary";

export interface SwipeableTabsSelectOptions {
  /** Slide the pager (default: the pager's `isPageAnimationEnabled`). */
  animated?: boolean;
  /** Play the selection haptic (pointer presses and swipes). */
  haptic?: boolean;
}

export interface PagerSettings {
  isPageAnimationEnabled: boolean;
}

export interface SwipeableTabsContextValue {
  baseId: string;
  controller: PositionController;
  getIndex: (value: string) => number;
  getPanelId: (value: string) => string;
  getTriggerElement: (value: string) => HTMLElement | undefined;
  getTriggerId: (value: string) => string;
  goTo: (value: string, animated?: boolean) => void;
  haptic: (type?: HapticFeedbackType) => void;
  /** `animation="disable-all"` on the root. */
  isAnimationDisabled: boolean;
  isMounted: (value: string) => boolean;
  measurements: SwipeableTabsMeasurements;
  /** Mounts lazy pages ahead of time (both neighbours when a drag starts). */
  mountValues: (values: readonly string[]) => void;
  /** Registers the pager settings the root needs for `goTo` and value-driven slides. */
  registerPager: (settings: PagerSettings) => () => void;
  registerTrigger: (value: string, element: HTMLElement) => () => void;
  registerValues: (values: readonly string[]) => void;
  renderLazyPlaceholder?: (value: string) => ReactNode;
  select: (value: string, options?: SwipeableTabsSelectOptions) => void;
  selectedIndex: number;
  setDragging: (isDragging: boolean) => void;
  /** Overrides one trigger box until the next automatic measurement. */
  setMeasurement: (value: string, measurement: SwipeableTabsMeasurement) => void;
  slots: ReturnType<typeof swipeableTabsVariants>;
  value: string | undefined;
  values: readonly string[];
  variant: SwipeableTabsVariant;
}

export const SwipeableTabsContext = createContext<SwipeableTabsContextValue | null>(null);

export const useSwipeableTabsContext = (part: string): SwipeableTabsContextValue => {
  const context = use(SwipeableTabsContext);

  if (!context) {
    throw new Error(`SwipeableTabs.${part} must be used within <SwipeableTabs>.`);
  }

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Trigger context
 * -----------------------------------------------------------------------------------------------*/
export interface SwipeableTabsTriggerContextValue {
  /** Whether this trigger is disabled. */
  isDisabled: boolean;
  /** Whether this trigger is currently selected. */
  isSelected: boolean;
  /** Unique id of the trigger element. */
  nativeID: string;
  /** The value of this trigger. */
  value: string;
}

export const SwipeableTabsTriggerContext = createContext<SwipeableTabsTriggerContextValue | null>(
  null,
);

/* -------------------------------------------------------------------------------------------------
 * Public hooks
 * -----------------------------------------------------------------------------------------------*/
export interface UseSwipeableTabsReturn {
  /** Page index of a value (-1 when unknown). */
  getIndex: (value: string) => number;
  /** Selects a page. `animated` defaults to the pager's `isPageAnimationEnabled`. */
  goTo: (value: string, animated?: boolean) => void;
  /** Whether a page's content renders (always true unless `lazy`). */
  isMounted: (value: string) => boolean;
  /** Unique id of this SwipeableTabs instance (heroui-native `useTabs().nativeID`). */
  nativeID: string;
  /** Selects a page (heroui-native `useTabs().onValueChange`; same as `goTo(value)`). */
  onValueChange: (value: string) => void;
  /**
   * Continuous pager position (fractional page index, `1.5` = halfway between the 2nd and 3rd page).
   * Updates every frame while swiping or sliding, re-rendering the calling component.
   */
  progress: number;
  /** Page index of `value` (-1 before any page registers). */
  selectedIndex: number;
  /**
   * Subscribes to the pager position without re-rendering (for imperative per-frame work).
   * Returns the unsubscribe function.
   */
  subscribeProgress: (listener: (progress: number) => void) => () => void;
  /** Selected page value (falls back to the first page). */
  value: string | undefined;
  /** Page values in pager order. */
  values: readonly string[];
}

/**
 * Access the SwipeableTabs state. Must be used within a `SwipeableTabs` component.
 */
export const useSwipeableTabs = (): UseSwipeableTabsReturn => {
  const context = useSwipeableTabsContext("useSwipeableTabs");
  const {controller} = context;
  const progress = useSyncExternalStore(controller.subscribe, controller.get, controller.get);
  const subscribeProgress = useCallback(
    (listener: (progress: number) => void) => controller.subscribe(listener),
    [controller],
  );
  const {goTo} = context;
  const onValueChange = useCallback((value: string) => goTo(value), [goTo]);

  return {
    getIndex: context.getIndex,
    goTo,
    isMounted: context.isMounted,
    nativeID: context.baseId,
    onValueChange,
    progress,
    selectedIndex: context.selectedIndex,
    subscribeProgress,
    value: context.value,
    values: context.values,
  };
};

export interface UseSwipeableTabsMeasurementsReturn {
  /** Offset box of every trigger, keyed by value. */
  measurements: SwipeableTabsMeasurements;
  /**
   * Overrides the box of one trigger. Triggers measure themselves on the web, so this only lasts
   * until the next automatic measurement (resize of a trigger or its container).
   */
  setMeasurements: (key: string, measurements: SwipeableTabsMeasurement) => void;
  /** Visual variant of the tab list. */
  variant: SwipeableTabsVariant;
}

/**
 * Trigger measurements (web counterpart of the Native `useTabsMeasurements`).
 * Must be used within a `SwipeableTabs` component.
 */
export const useSwipeableTabsMeasurements = (): UseSwipeableTabsMeasurementsReturn => {
  const {measurements, setMeasurement, variant} = useSwipeableTabsContext(
    "useSwipeableTabsMeasurements",
  );

  return {measurements, setMeasurements: setMeasurement, variant};
};

/**
 * State of the surrounding trigger (web counterpart of the Native `useTabsTrigger`).
 * Must be used within a `SwipeableTabs.Trigger`.
 */
export const useSwipeableTabsTrigger = (): SwipeableTabsTriggerContextValue => {
  const context = use(SwipeableTabsTriggerContext);

  if (!context) {
    throw new Error("useSwipeableTabsTrigger must be used within <SwipeableTabs.Trigger>.");
  }

  return context;
};

export type {SwipeableTabsMeasurement, SwipeableTabsMeasurements};
