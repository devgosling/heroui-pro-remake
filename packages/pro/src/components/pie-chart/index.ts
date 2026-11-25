import type {ComponentProps} from "react";

import {
  PieChartCell,
  PieChartLabel,
  PieChartPie,
  PieChartRoot,
  PieChartTooltip,
  PieChartTooltipContent,
} from "./pie-chart";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/pie-chart`) because it depends on the optional `recharts` peer.
 * -----------------------------------------------------------------------------------------------*/
export const PieChart = Object.assign(PieChartRoot, {
  Cell: PieChartCell,
  Label: PieChartLabel,
  Pie: PieChartPie,
  Root: PieChartRoot,
  Tooltip: PieChartTooltip,
  TooltipContent: PieChartTooltipContent,
});

export type PieChart = {
  Props: ComponentProps<typeof PieChartRoot>;
  RootProps: ComponentProps<typeof PieChartRoot>;
  PieProps: ComponentProps<typeof PieChartPie>;
  CellProps: ComponentProps<typeof PieChartCell>;
  LabelProps: ComponentProps<typeof PieChartLabel>;
  TooltipProps: ComponentProps<typeof PieChartTooltip>;
  TooltipContentProps: ComponentProps<typeof PieChartTooltipContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  PieChartRoot,
  PieChartPie,
  PieChartCell,
  PieChartLabel,
  PieChartTooltip,
  PieChartTooltipContent,
} from "./pie-chart";

export type {
  PieChartRootProps,
  PieChartRootProps as PieChartProps,
  PieChartPieProps,
  PieChartCellProps,
  PieChartLabelProps,
  PieChartTooltipProps,
  PieChartTooltipContentProps,
} from "./pie-chart";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {pieChartVariants, type PieChartVariants} from "./pie-chart.styles";
