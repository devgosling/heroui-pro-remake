import type {ComponentProps} from "react";

import {
  RadialChartAngleAxis,
  RadialChartBar,
  RadialChartCell,
  RadialChartRoot,
  RadialChartTooltip,
  RadialChartTooltipContent,
} from "./radial-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/radial-chart`) because it depends on `recharts`.
 * -----------------------------------------------------------------------------------------------*/
export const RadialChart = Object.assign(RadialChartRoot, {
  AngleAxis: RadialChartAngleAxis,
  Bar: RadialChartBar,
  Cell: RadialChartCell,
  Root: RadialChartRoot,
  Tooltip: RadialChartTooltip,
  TooltipContent: RadialChartTooltipContent,
});

export type RadialChart = {
  Props: ComponentProps<typeof RadialChartRoot>;
  RootProps: ComponentProps<typeof RadialChartRoot>;
  BarProps: ComponentProps<typeof RadialChartBar>;
  CellProps: ComponentProps<typeof RadialChartCell>;
  AngleAxisProps: ComponentProps<typeof RadialChartAngleAxis>;
  TooltipProps: ComponentProps<typeof RadialChartTooltip>;
  TooltipContentProps: ComponentProps<typeof RadialChartTooltipContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  RadialChartRoot,
  RadialChartBar,
  RadialChartCell,
  RadialChartAngleAxis,
  RadialChartTooltip,
  RadialChartTooltipContent,
} from "./radial-chart";

export type {
  RadialChartRootProps,
  RadialChartRootProps as RadialChartProps,
  RadialChartTooltipContentProps,
} from "./radial-chart";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radialChartVariants, type RadialChartVariants} from "./radial-chart.styles";
