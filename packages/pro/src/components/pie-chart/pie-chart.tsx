"use client";

import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {
  Cell,
  Label,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {ChartTooltipContent} from "../chart-tooltip";

import {pieChartVariants} from "./pie-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type RechartsPieChartProps = ComponentProps<typeof RechartsPieChart>;

interface PieChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart height in pixels. */
  height?: number;
  /**
   * Chart width in pixels or as a percentage string. A number renders a fixed-size chart, a
   * percentage renders a `ResponsiveContainer` that follows the root's width.
   */
  width?: number | `${number}%`;
  /** Recharts children (`PieChart.Pie`, `PieChart.Tooltip`, ...). */
  children?: ReactNode;
  /**
   * Extra props forwarded to the underlying Recharts `PieChart`
   * (e.g. `margin`, `onClick`, `accessibilityLayer`).
   */
  chartProps?: Omit<RechartsPieChartProps, "children" | "height" | "ref" | "width">;
}

/* -------------------------------------------------------------------------------------------------
 * Root
 * A `.pie-chart` div that themes the Recharts internals (sectors, labels, tooltip, focus ring) with
 * HeroUI tokens, wrapping either a fixed-size Recharts `PieChart` (numeric width) or a
 * `ResponsiveContainer` (percentage width).
 * -----------------------------------------------------------------------------------------------*/
const PieChartRoot = ({
  chartProps,
  children,
  className,
  height = 300,
  width = "100%",
  ...rest
}: PieChartRootProps) => {
  return (
    <div className={pieChartVariants({className})} data-slot="pie-chart" {...rest}>
      {typeof width === "number" ? (
        <RechartsPieChart {...chartProps} height={height} width={width}>
          {children}
        </RechartsPieChart>
      ) : (
        <ResponsiveContainer height={height} minWidth={0} width={width}>
          <RechartsPieChart {...chartProps}>{children}</RechartsPieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

PieChartRoot.displayName = "HeroUI.PieChart";

/* -------------------------------------------------------------------------------------------------
 * Re-exported Recharts parts
 * They are the Recharts components themselves (not wrappers), so every Recharts prop works and
 * Recharts keeps recognising them as chart children.
 * -----------------------------------------------------------------------------------------------*/
const PieChartPie = Pie;
const PieChartCell = Cell;
const PieChartLabel = Label;
const PieChartTooltip = Tooltip;

/** Pre-built tooltip renderer: pass as the `content` prop of `PieChart.Tooltip`. */
const PieChartTooltipContent = ChartTooltipContent;

type PieChartPieProps = ComponentProps<typeof Pie>;
type PieChartCellProps = ComponentProps<typeof Cell>;
type PieChartLabelProps = ComponentProps<typeof Label>;
type PieChartTooltipProps = ComponentProps<typeof Tooltip>;
type PieChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent>;

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PieChartRoot,
  PieChartPie,
  PieChartCell,
  PieChartLabel,
  PieChartTooltip,
  PieChartTooltipContent,
};

export type {
  PieChartRootProps,
  PieChartPieProps,
  PieChartCellProps,
  PieChartLabelProps,
  PieChartTooltipProps,
  PieChartTooltipContentProps,
};
