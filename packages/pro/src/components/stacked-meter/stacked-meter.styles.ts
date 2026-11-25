import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const stackedMeterVariants = tv({
  defaultVariants: {
    color: "chart-1",
    size: "md",
  },
  slots: {
    base: "stacked-meter",
    label: "stacked-meter__label",
    legend: "stacked-meter__legend",
    legendIndicator: "stacked-meter__legend-indicator",
    legendItem: "stacked-meter__legend-item",
    legendLabel: "stacked-meter__legend-label",
    legendValue: "stacked-meter__legend-value",
    remainder: "stacked-meter__remainder",
    segment: "stacked-meter__segment",
    track: "stacked-meter__track",
    trackBackground: "stacked-meter__track-background",
  },
  variants: {
    /** Per-segment colour; applied to the segment and its legend indicator. */
    color: {
      accent: {
        legendIndicator: "stacked-meter__legend-indicator--accent",
        segment: "stacked-meter__segment--accent",
      },
      "chart-1": {
        legendIndicator: "stacked-meter__legend-indicator--chart-1",
        segment: "stacked-meter__segment--chart-1",
      },
      "chart-2": {
        legendIndicator: "stacked-meter__legend-indicator--chart-2",
        segment: "stacked-meter__segment--chart-2",
      },
      "chart-3": {
        legendIndicator: "stacked-meter__legend-indicator--chart-3",
        segment: "stacked-meter__segment--chart-3",
      },
      "chart-4": {
        legendIndicator: "stacked-meter__legend-indicator--chart-4",
        segment: "stacked-meter__segment--chart-4",
      },
      "chart-5": {
        legendIndicator: "stacked-meter__legend-indicator--chart-5",
        segment: "stacked-meter__segment--chart-5",
      },
      danger: {
        legendIndicator: "stacked-meter__legend-indicator--danger",
        segment: "stacked-meter__segment--danger",
      },
      default: {
        legendIndicator: "stacked-meter__legend-indicator--default",
        segment: "stacked-meter__segment--default",
      },
      success: {
        legendIndicator: "stacked-meter__legend-indicator--success",
        segment: "stacked-meter__segment--success",
      },
      warning: {
        legendIndicator: "stacked-meter__legend-indicator--warning",
        segment: "stacked-meter__segment--warning",
      },
    },
    size: {
      lg: {base: "stacked-meter--lg", track: "stacked-meter__track--lg"},
      md: {base: "stacked-meter--md", track: "stacked-meter__track--md"},
      sm: {base: "stacked-meter--sm", track: "stacked-meter__track--sm"},
    },
  },
});

export type StackedMeterVariants = Omit<VariantProps<typeof stackedMeterVariants>, "color">;
