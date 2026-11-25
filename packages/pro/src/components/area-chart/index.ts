import type {ComponentProps} from "react";

import {
  AreaChartArea,
  AreaChartGrid,
  AreaChartRoot,
  AreaChartTooltip,
  AreaChartTooltipContent,
  AreaChartXAxis,
  AreaChartYAxis,
} from "./area-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/area-chart`) because it depends on the optional `recharts` peer.
 * -----------------------------------------------------------------------------------------------*/
export const AreaChart = Object.assign(AreaChartRoot, {
  Area: AreaChartArea,
  Grid: AreaChartGrid,
  Root: AreaChartRoot,
  Tooltip: AreaChartTooltip,
  TooltipContent: AreaChartTooltipContent,
  XAxis: AreaChartXAxis,
  YAxis: AreaChartYAxis,
});

export type AreaChart = {
  Props: ComponentProps<typeof AreaChartRoot>;
  RootProps: ComponentProps<typeof AreaChartRoot>;
  AreaProps: ComponentProps<typeof AreaChartArea>;
  XAxisProps: ComponentProps<typeof AreaChartXAxis>;
  YAxisProps: ComponentProps<typeof AreaChartYAxis>;
  GridProps: ComponentProps<typeof AreaChartGrid>;
  TooltipProps: ComponentProps<typeof AreaChartTooltip>;
  TooltipContentProps: ComponentProps<typeof AreaChartTooltipContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AreaChartRoot,
  AreaChartArea,
  AreaChartXAxis,
  AreaChartYAxis,
  AreaChartGrid,
  AreaChartTooltip,
  AreaChartTooltipContent,
} from "./area-chart";

export type {
  AreaChartDatum,
  AreaChartMargin,
  AreaChartRootProps,
  AreaChartRootProps as AreaChartProps,
  AreaChartAreaProps,
  AreaChartXAxisProps,
  AreaChartYAxisProps,
  AreaChartGridProps,
  AreaChartTooltipProps,
  AreaChartTooltipContentProps,
} from "./area-chart";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {areaChartVariants, type AreaChartVariants} from "./area-chart.styles";
