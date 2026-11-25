import type {ComponentProps} from "react";

import {
  ChartTooltipContent,
  ChartTooltipHeader,
  ChartTooltipIndicator,
  ChartTooltipItem,
  ChartTooltipLabel,
  ChartTooltipRoot,
  ChartTooltipValue,
} from "./chart-tooltip";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * No `recharts` import: safe to export from the package root. `ChartTooltip.Content` is the
 * element to pass to a Recharts `<Tooltip content={...} />`.
 * -----------------------------------------------------------------------------------------------*/
export const ChartTooltip = Object.assign(ChartTooltipRoot, {
  Content: ChartTooltipContent,
  Header: ChartTooltipHeader,
  Indicator: ChartTooltipIndicator,
  Item: ChartTooltipItem,
  Label: ChartTooltipLabel,
  Root: ChartTooltipRoot,
  Value: ChartTooltipValue,
});

export type ChartTooltip = {
  Props: ComponentProps<typeof ChartTooltipRoot>;
  RootProps: ComponentProps<typeof ChartTooltipRoot>;
  ContentProps: ComponentProps<typeof ChartTooltipContent>;
  HeaderProps: ComponentProps<typeof ChartTooltipHeader>;
  ItemProps: ComponentProps<typeof ChartTooltipItem>;
  IndicatorProps: ComponentProps<typeof ChartTooltipIndicator>;
  LabelProps: ComponentProps<typeof ChartTooltipLabel>;
  ValueProps: ComponentProps<typeof ChartTooltipValue>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChartTooltipRoot,
  ChartTooltipContent,
  ChartTooltipHeader,
  ChartTooltipItem,
  ChartTooltipIndicator,
  ChartTooltipLabel,
  ChartTooltipValue,
  ChartTooltipContext,
} from "./chart-tooltip";

export type {
  ChartTooltipRootProps,
  ChartTooltipRootProps as ChartTooltipProps,
  ChartTooltipContentProps,
  ChartTooltipHeaderProps,
  ChartTooltipItemProps,
  ChartTooltipIndicatorProps,
  ChartTooltipLabelProps,
  ChartTooltipValueProps,
  ChartTooltipPayloadItem,
  ChartTooltipIndicatorShape,
  ChartTooltipValueType,
} from "./chart-tooltip";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {chartTooltipVariants, type ChartTooltipVariants} from "./chart-tooltip.styles";
