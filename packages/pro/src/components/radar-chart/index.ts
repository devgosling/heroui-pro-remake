import type {ComponentProps} from "react";

import {
  RadarChartAngleAxis,
  RadarChartGrid,
  RadarChartRadar,
  RadarChartRadiusAxis,
  RadarChartRoot,
  RadarChartTooltip,
  RadarChartTooltipContent,
} from "./radar-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/radar-chart`) because it depends on `recharts`.
 * -----------------------------------------------------------------------------------------------*/
export const RadarChart = Object.assign(RadarChartRoot, {
  AngleAxis: RadarChartAngleAxis,
  Grid: RadarChartGrid,
  Radar: RadarChartRadar,
  RadiusAxis: RadarChartRadiusAxis,
  Root: RadarChartRoot,
  Tooltip: RadarChartTooltip,
  TooltipContent: RadarChartTooltipContent,
});

export type RadarChart = {
  Props: ComponentProps<typeof RadarChartRoot>;
  RootProps: ComponentProps<typeof RadarChartRoot>;
  RadarProps: ComponentProps<typeof RadarChartRadar>;
  GridProps: ComponentProps<typeof RadarChartGrid>;
  AngleAxisProps: ComponentProps<typeof RadarChartAngleAxis>;
  RadiusAxisProps: ComponentProps<typeof RadarChartRadiusAxis>;
  TooltipProps: ComponentProps<typeof RadarChartTooltip>;
  TooltipContentProps: ComponentProps<typeof RadarChartTooltipContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  RadarChartRoot,
  RadarChartRadar,
  RadarChartGrid,
  RadarChartAngleAxis,
  RadarChartRadiusAxis,
  RadarChartTooltip,
  RadarChartTooltipContent,
} from "./radar-chart";

export type {
  RadarChartDatum,
  RadarChartRootProps,
  RadarChartRootProps as RadarChartProps,
  RadarChartRadarProps,
  RadarChartGridProps,
  RadarChartAngleAxisProps,
  RadarChartRadiusAxisProps,
  RadarChartTooltipProps,
  RadarChartTooltipContentProps,
} from "./radar-chart";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radarChartVariants, type RadarChartVariants} from "./radar-chart.styles";
