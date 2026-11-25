import type {ComponentProps} from "react";

import {
  LineChartGrid,
  LineChartLine,
  LineChartRoot,
  LineChartTooltip,
  LineChartTooltipContent,
  LineChartXAxis,
  LineChartYAxis,
} from "./line-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/line-chart`) because it depends on the optional `recharts` peer.
 * -----------------------------------------------------------------------------------------------*/
export const LineChart = Object.assign(LineChartRoot, {
  Grid: LineChartGrid,
  Line: LineChartLine,
  Root: LineChartRoot,
  Tooltip: LineChartTooltip,
  TooltipContent: LineChartTooltipContent,
  XAxis: LineChartXAxis,
  YAxis: LineChartYAxis,
});

export type LineChart = {
  Props: ComponentProps<typeof LineChartRoot>;
  RootProps: ComponentProps<typeof LineChartRoot>;
  LineProps: ComponentProps<typeof LineChartLine>;
  XAxisProps: ComponentProps<typeof LineChartXAxis>;
  YAxisProps: ComponentProps<typeof LineChartYAxis>;
  GridProps: ComponentProps<typeof LineChartGrid>;
  TooltipProps: ComponentProps<typeof LineChartTooltip>;
  TooltipContentProps: ComponentProps<typeof LineChartTooltipContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  LineChartRoot,
  LineChartLine,
  LineChartXAxis,
  LineChartYAxis,
  LineChartGrid,
  LineChartTooltip,
  LineChartTooltipContent,
} from "./line-chart";

export type {
  LineChartDatum,
  LineChartMargin,
  LineChartRootProps,
  LineChartRootProps as LineChartProps,
  LineChartLineProps,
  LineChartXAxisProps,
  LineChartYAxisProps,
  LineChartGridProps,
  LineChartTooltipProps,
  LineChartTooltipContentProps,
} from "./line-chart";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {lineChartVariants, type LineChartVariants} from "./line-chart.styles";
