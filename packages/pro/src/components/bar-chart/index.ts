import type {ChartTooltipContentProps} from "../chart-tooltip";
import type {ComponentProps} from "react";
import type {
  BarProps,
  CartesianGridProps,
  TooltipProps,
  TooltipValueType,
  XAxisProps,
  YAxisProps,
} from "recharts";

import {Bar, CartesianGrid, Tooltip, XAxis, YAxis} from "recharts";

import {ChartTooltip} from "../chart-tooltip";

import {BarChartRoot} from "./bar-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/bar-chart`) because it depends on the optional `recharts` peer.
 * Bar / XAxis / YAxis / Grid / Tooltip are the Recharts components themselves (re-exported, so
 * the whole Recharts API applies); TooltipContent is the Pro `ChartTooltip.Content` card.
 * -----------------------------------------------------------------------------------------------*/
export const BarChart = Object.assign(BarChartRoot, {
  Bar,
  Grid: CartesianGrid,
  Root: BarChartRoot,
  Tooltip,
  TooltipContent: ChartTooltip.Content,
  XAxis,
  YAxis,
});

export type BarChart = {
  Props: ComponentProps<typeof BarChartRoot>;
  RootProps: ComponentProps<typeof BarChartRoot>;
  BarProps: BarProps;
  XAxisProps: XAxisProps;
  YAxisProps: YAxisProps;
  GridProps: CartesianGridProps;
  TooltipProps: TooltipProps<TooltipValueType, number | string>;
  TooltipContentProps: ChartTooltipContentProps;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {BarChartRoot} from "./bar-chart";

export {
  Bar as BarChartBar,
  XAxis as BarChartXAxis,
  YAxis as BarChartYAxis,
  CartesianGrid as BarChartGrid,
  Tooltip as BarChartTooltip,
} from "recharts";

export {ChartTooltipContent as BarChartTooltipContent} from "../chart-tooltip";

export type {
  BarChartRootProps,
  BarChartRootProps as BarChartProps,
  BarChartDatum,
  BarChartLayout,
  BarChartMargin,
} from "./bar-chart";

export type {
  BarProps as BarChartBarProps,
  XAxisProps as BarChartXAxisProps,
  YAxisProps as BarChartYAxisProps,
  CartesianGridProps as BarChartGridProps,
  TooltipProps as BarChartTooltipProps,
} from "recharts";

export type {ChartTooltipContentProps as BarChartTooltipContentProps} from "../chart-tooltip";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {barChartVariants, type BarChartVariants} from "./bar-chart.styles";
