import type {ComponentProps} from "react";

import {
  StackedMeterLabel,
  StackedMeterLegend,
  StackedMeterLegendIndicator,
  StackedMeterLegendItem,
  StackedMeterLegendLabel,
  StackedMeterLegendValue,
  StackedMeterRoot,
  StackedMeterSegment,
  StackedMeterTrack,
  StackedMeterTrackBackground,
} from "./stacked-meter";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const StackedMeter = Object.assign(StackedMeterRoot, {
  Label: StackedMeterLabel,
  Legend: StackedMeterLegend,
  LegendIndicator: StackedMeterLegendIndicator,
  LegendItem: StackedMeterLegendItem,
  LegendLabel: StackedMeterLegendLabel,
  LegendValue: StackedMeterLegendValue,
  Root: StackedMeterRoot,
  Segment: StackedMeterSegment,
  Track: StackedMeterTrack,
  TrackBackground: StackedMeterTrackBackground,
});

export type StackedMeter = {
  Props: ComponentProps<typeof StackedMeterRoot>;
  RootProps: ComponentProps<typeof StackedMeterRoot>;
  LabelProps: ComponentProps<typeof StackedMeterLabel>;
  TrackProps: ComponentProps<typeof StackedMeterTrack>;
  TrackBackgroundProps: ComponentProps<typeof StackedMeterTrackBackground>;
  SegmentProps: ComponentProps<typeof StackedMeterSegment>;
  LegendProps: ComponentProps<typeof StackedMeterLegend>;
  LegendItemProps: ComponentProps<typeof StackedMeterLegendItem>;
  LegendIndicatorProps: ComponentProps<typeof StackedMeterLegendIndicator>;
  LegendLabelProps: ComponentProps<typeof StackedMeterLegendLabel>;
  LegendValueProps: ComponentProps<typeof StackedMeterLegendValue>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  StackedMeterRoot,
  StackedMeterLabel,
  StackedMeterTrack,
  StackedMeterTrackBackground,
  StackedMeterSegment,
  StackedMeterLegend,
  StackedMeterLegendItem,
  StackedMeterLegendIndicator,
  StackedMeterLegendLabel,
  StackedMeterLegendValue,
} from "./stacked-meter";

export type {
  StackedMeterRootProps,
  StackedMeterRootProps as StackedMeterProps,
  StackedMeterLabelProps,
  StackedMeterTrackProps,
  StackedMeterTrackBackgroundProps,
  StackedMeterSegmentProps,
  StackedMeterLegendProps,
  StackedMeterLegendItemProps,
  StackedMeterLegendIndicatorProps,
  StackedMeterLegendLabelProps,
  StackedMeterLegendValueProps,
} from "./stacked-meter";

/* -------------------------------------------------------------------------------------------------
 * Hooks, contexts and types
 * -----------------------------------------------------------------------------------------------*/
export {
  StackedMeterContext,
  StackedMeterSegmentContext,
  useStackedMeter,
  useStackedMeterSegment,
} from "./stacked-meter-context";

export type {
  StackedMeterColor,
  StackedMeterContextValue,
  StackedMeterGrowTimingConfig,
  StackedMeterRenderProps,
  StackedMeterRootAnimation,
  StackedMeterSegment as StackedMeterSegmentData,
  StackedMeterSegmentAnimation,
  StackedMeterSegmentContextValue,
  StackedMeterSegmentState,
  StackedMeterSize,
} from "./stacked-meter-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {stackedMeterVariants, type StackedMeterVariants} from "./stacked-meter.styles";
