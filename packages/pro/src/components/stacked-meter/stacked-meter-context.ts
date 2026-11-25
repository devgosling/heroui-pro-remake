"use client";

import type {stackedMeterVariants} from "./stacked-meter.styles";
import type {RefCallback} from "react";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

/** Size variants of the track. */
export type StackedMeterSize = "sm" | "md" | "lg";

/** Colour variants of segments and legend indicators. */
export type StackedMeterColor =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5";

/** One part of the whole. */
export interface StackedMeterSegment {
  /** Unique identifier, used as the React key. */
  id: string | number;
  /** Segment name, shown in the legend and used in the accessible summary. */
  label: string;
  /** Raw value. Negative and non-finite values are treated as 0. */
  value: number;
  /** Colour variant. Defaults to the next colour in the chart-1 ... chart-5 sequence. */
  color?: StackedMeterColor;
  /** Classes applied to both the segment and its legend indicator (e.g. `bg-[#3178c6]`). */
  colorClassName?: string;
}

/** A segment with its computed fields. */
export interface StackedMeterSegmentState extends Omit<StackedMeterSegment, "color"> {
  /** Position in the segments array. */
  index: number;
  /** Share of the total (0-100). */
  percentage: number;
  /** Formatted value text. */
  valueText: string;
  /** Resolved colour variant. */
  color: StackedMeterColor;
}

/** Values passed to a render function used as the root's children. */
export interface StackedMeterRenderProps {
  /** Computed state for every segment. */
  segments: StackedMeterSegmentState[];
  /** Total the percentages are computed from. */
  total: number;
  /** Combined text summary of all segments. */
  summaryText: string;
}

/**
 * Animation configuration for the root.
 * - `"disable-all"`: disables every animation, including the children's.
 * - `undefined`: default animations.
 */
export type StackedMeterRootAnimation = "disable-all" | undefined;

/** Timing of the share transition (web: CSS transition of `flex-grow`). */
export interface StackedMeterGrowTimingConfig {
  /** Duration in milliseconds. @default 300 */
  duration?: number;
  /** CSS easing function. @default ease-in-out (quad) */
  easing?: string;
}

/**
 * Animation configuration for `StackedMeter.Segment`.
 * - `false` / `"disabled"`: no share transition.
 * - `true` / `undefined`: default transition.
 * - object: custom transition timing.
 */
export type StackedMeterSegmentAnimation =
  boolean | "disabled" | {growTimingConfig?: StackedMeterGrowTimingConfig} | undefined;

/* -------------------------------------------------------------------------------------------------
 * Root context (public, returned by useStackedMeter)
 * -----------------------------------------------------------------------------------------------*/
export interface StackedMeterContextValue {
  /** Computed state for every segment, in input order. */
  segments: StackedMeterSegmentState[];
  /** Total the percentages are computed from. */
  total: number;
  /** Share (0-100) of the track left empty; 100 when there is nothing to show. */
  remainderPercentage: number;
  /** Combined text summary of all segments. */
  summaryText: string;
  /** Accessible label passed to the root (`aria-label`). */
  accessibilityLabel: string | undefined;
  /** Current size variant. */
  size: StackedMeterSize;
  /** Whether the component is disabled. */
  isDisabled: boolean;
}

export const StackedMeterContext = createContext<StackedMeterContextValue | null>(null);

/** Reads the nearest StackedMeter. Must be used within a `StackedMeter`. */
export const useStackedMeter = (): StackedMeterContextValue => {
  const context = use(StackedMeterContext);

  if (!context) {
    throw new Error("useStackedMeter must be used within a <StackedMeter> component.");
  }

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Segment context (public, returned by useStackedMeterSegment)
 * -----------------------------------------------------------------------------------------------*/
export interface StackedMeterSegmentContextValue {
  /** Computed state of the current segment. */
  segment: StackedMeterSegmentState;
}

export const StackedMeterSegmentContext = createContext<StackedMeterSegmentContextValue | null>(
  null,
);

/**
 * Reads the current segment inside a `StackedMeter.Track` / `StackedMeter.Legend` render function
 * (or their default content).
 */
export const useStackedMeterSegment = (): StackedMeterSegmentContextValue => {
  const context = use(StackedMeterSegmentContext);

  if (!context) {
    throw new Error(
      "useStackedMeterSegment must be used inside a StackedMeter.Track or StackedMeter.Legend item.",
    );
  }

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Internal context (styles + wiring between parts)
 * -----------------------------------------------------------------------------------------------*/
export interface StackedMeterInternalContextValue {
  slots?: ReturnType<typeof stackedMeterVariants>;
  /** Id generated for StackedMeter.Label. */
  labelId: string;
  /** `aria-labelledby` of the root (own prop or the mounted Label's id); the track reuses it. */
  labelledBy: string | undefined;
  /** Callback ref the label attaches so the root and track can point aria-labelledby at it. */
  labelRef: RefCallback<HTMLElement>;
  /** True when the root disables every animation (`animation="disable-all"`). */
  isAnimationDisabled: boolean;
}

export const StackedMeterInternalContext = createContext<StackedMeterInternalContextValue | null>(
  null,
);
