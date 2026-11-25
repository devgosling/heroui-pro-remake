import type {ComponentProps} from "react";

import {
  ComposedChartArea,
  ComposedChartBar,
  ComposedChartGrid,
  ComposedChartLine,
  ComposedChartRoot,
  ComposedChartTooltip,
  ComposedChartTooltipContent,
  ComposedChartXAxis,
  ComposedChartYAxis,
} from "./composed-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/composed-chart`) because it depends on the optional
 * `recharts` peer; it is intentionally NOT re-exported from the package root.
 * -----------------------------------------------------------------------------------------------*/
export const ComposedChart = Object.assign(ComposedChartRoot, {
  Area: ComposedChartArea,
  Bar: ComposedChartBar,
  Grid: ComposedChartGrid,
  Line: ComposedChartLine,
  Root: ComposedChartRoot,
  Tooltip: ComposedChartTooltip,
  TooltipContent: ComposedChartTooltipContent,
  XAxis: ComposedChartXAxis,
  YAxis: ComposedChartYAxis,
});

export type ComposedChart = {
  Props: ComponentProps<typeof ComposedChartRoot>;
  RootProps: ComponentProps<typeof ComposedChartRoot>;
  BarProps: ComponentProps<typeof ComposedChartBar>;
  LineProps: ComponentProps<typeof ComposedChartLine>;
  AreaProps: ComponentProps<typeof ComposedChartArea>;
  XAxisProps: ComponentProps<typeof ComposedChartXAxis>;
  YAxisProps: ComponentProps<typeof ComposedChartYAxis>;
  GridProps: ComponentProps<typeof ComposedChartGrid>;
  TooltipProps: ComponentProps<typeof ComposedChartTooltip>;
  TooltipContentProps: ComponentProps<typeof ComposedChartTooltipContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ComposedChartRoot,
  ComposedChartBar,
  ComposedChartLine,
  ComposedChartArea,
  ComposedChartXAxis,
  ComposedChartYAxis,
  ComposedChartGrid,
  ComposedChartTooltip,
  ComposedChartTooltipContent,
} from "./composed-chart";

export type {
  ComposedChartDatum,
  ComposedChartMargin,
  ComposedChartRootProps,
  ComposedChartRootProps as ComposedChartProps,
  ComposedChartBarProps,
  ComposedChartLineProps,
  ComposedChartAreaProps,
  ComposedChartXAxisProps,
  ComposedChartYAxisProps,
  ComposedChartGridProps,
  ComposedChartTooltipProps,
  ComposedChartTooltipContentProps,
} from "./composed-chart";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {composedChartVariants, type ComposedChartVariants} from "./composed-chart.styles";
