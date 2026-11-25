"use client";

import type {WheelPickerEngine} from "./wheel-picker-engine";
import type {wheelPickerVariants} from "./wheel-picker.styles";
import type {CSSProperties} from "react";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Shared types
 * -----------------------------------------------------------------------------------------------*/

/** Single picker entry rendered as a row in the wheel. */
export interface WheelPickerOption<T = unknown> {
  /** Unique value used for selection comparison (`Object.is`) and `scrollToValue` lookup. */
  value: T;
  /** Display label rendered by the default item renderer (also used for type-ahead). */
  label: string;
}

/**
 * Web counterpart of a Reanimated `SharedValue`: read the latest value with `get()` without
 * re-rendering, or `subscribe` to per-frame updates.
 */
export interface WheelPickerLiveValue {
  get: () => number;
  subscribe: (listener: () => void) => () => void;
}

/** Resolved `[edge, center]` ranges of the per-row interpolation. */
export interface WheelPickerResolvedAnimationConfig {
  opacity: [number, number];
  scale: [number, number];
  labelColor: [string, string];
}

export interface WheelPickerScrollToIndexParams {
  index: number;
  /** @default true */
  animated?: boolean;
}

export interface WheelPickerScrollToValueOptions {
  /** @default true */
  animated?: boolean;
}

export type WheelPickerRootSlots = "container" | "contentContainer" | "item" | "itemLabel";

/* -------------------------------------------------------------------------------------------------
 * WheelPicker root context (public: `useWheelPicker`)
 * -----------------------------------------------------------------------------------------------*/
export interface WheelPickerContextValue {
  /** Resolved row height in pixels. */
  itemHeight: number;
  /** Number of visible rows (always odd). */
  visibleCount: number;
  /** Whether the wheel is disabled. */
  isDisabled: boolean;
  /** Scroll offset in pixels (0 = first row centred). Read with `get()`; does not re-render. */
  scrollY: WheelPickerLiveValue;
  /** Whether a `WheelPickerGroup` parent provides the value. */
  isInsideGroup: boolean;
  /** Resolved `[edge, center]` opacity, scale and label colour ranges. */
  resolvedAnimation: WheelPickerResolvedAnimationConfig;
  /** Whether per-row animation is disabled (own `animation` prop or a group `disable-all`). */
  isItemAnimationDisabled: boolean;
  /** Scrolls the wheel so the given index becomes the selected row. */
  scrollToIndex: (params: WheelPickerScrollToIndexParams) => void;
}

export const WheelPickerContext = createContext<WheelPickerContextValue | null>(null);

/** Hook to access the WheelPicker root context. Must be used within a `WheelPicker`. */
export const useWheelPicker = (): WheelPickerContextValue => {
  const context = use(WheelPickerContext);

  if (!context) throw new Error("useWheelPicker must be used within a WheelPicker component.");

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Internal root context (parts only)
 * -----------------------------------------------------------------------------------------------*/
export interface WheelPickerInternalContextValue {
  slots: ReturnType<typeof wheelPickerVariants>;
  classNames?: Partial<Record<WheelPickerRootSlots, string>>;
  styles?: Partial<Record<WheelPickerRootSlots, CSSProperties>>;
  engine: WheelPickerEngine;
  getItemId: (index: number) => string;
  /** Tap-to-focus: selects the row and scrolls it onto the indicator. */
  focusIndex: (index: number) => void;
}

export const WheelPickerInternalContext = createContext<WheelPickerInternalContextValue | null>(
  null,
);

/* -------------------------------------------------------------------------------------------------
 * Row context (public: `useWheelPickerItem`)
 * -----------------------------------------------------------------------------------------------*/
export interface WheelPickerItemRenderProps<T = unknown> {
  /** The option being rendered. */
  item: WheelPickerOption<T>;
  /** Zero-based index of the option in `items`. */
  index: number;
  /** Whether the option matches the current value. */
  isSelected: boolean;
  /**
   * Absolute distance from the centre in rows (0 = centred, 0.5 = selection boundary, 1+ = a
   * full row or more away). Live while the row is near the viewport; clamped to
   * `(visibleCount + 1) / 2` further out. Also available to CSS as `--wheel-picker-distance`.
   */
  absDistance: number;
}

export const WheelPickerItemContext = createContext<WheelPickerItemRenderProps | null>(null);

/**
 * Hook to access the per-row context. Must be used within `WheelPicker.Item`,
 * `WheelPicker.ItemLabel` or anything rendered by a custom `renderItem`. The generic is erased to
 * `unknown`; cast at the call site when you need the option type.
 */
export const useWheelPickerItem = (): WheelPickerItemRenderProps => {
  const context = use(WheelPickerItemContext);

  if (!context) {
    throw new Error("useWheelPickerItem must be used within a WheelPicker.Item or renderItem.");
  }

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Group context (provided by `WheelPickerGroup`, consumed by every nested `WheelPicker`)
 * -----------------------------------------------------------------------------------------------*/
export interface WheelPickerGroupContextValue {
  /** Row height shared by the group's wheels. */
  itemHeight: number;
  /** Visible rows shared by the group's wheels (odd). */
  visibleCount: number;
  /** Whether the group as a whole is disabled. */
  isDisabled: boolean;
  /**
   * Current value of the wheel called `name`. The context value must change identity whenever the
   * values record changes, so nested wheels re-render and scroll to external updates.
   */
  getValue: (name: string) => unknown;
  /** Writes the value of the wheel called `name` (merged into the group's values record). */
  setValue: (name: string, value: unknown) => void;
  /**
   * A nested wheel started (`true`) or stopped (`false`) moving. Every wheel reports each change
   * exactly once, with its `name` as the second argument.
   */
  notifyScrollState: (isScrolling: boolean, name?: string) => void;
  /** Whether at least one wheel of the group is moving. */
  isAnyWheelScrolling: () => boolean;
  /** `animation="disable-all"` on the group: nested wheels drop their row and scroll animations. */
  isAnimationDisabled?: boolean;
}

export const WheelPickerGroupContext = createContext<WheelPickerGroupContextValue | null>(null);
