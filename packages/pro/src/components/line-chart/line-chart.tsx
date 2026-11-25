"use client";

import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {ChartTooltipContent} from "../chart-tooltip";

import {lineChartVariants} from "./line-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type LineChartDatum = Record<string, number | string | null | undefined>;

interface LineChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

type RechartsLineChartProps = ComponentProps<typeof RechartsLineChart>;

interface LineChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart data: one object per category with a numeric/string field per series. */
  data: LineChartDatum[];
  /** Chart height in pixels. */
  height?: number;
  /** Chart width in pixels or as a percentage string. */
  width?: number | `${number}%`;
  /** Recharts margin around the plot area. Missing sides fall back to the defaults. */
  margin?: LineChartMargin;
  /** Recharts children (`LineChart.Line`, `LineChart.XAxis`, `LineChart.Tooltip`, ...). */
  children?: ReactNode;
  /**
   * Extra props forwarded to the underlying Recharts `LineChart`
   * (e.g. `syncId`, `layout`, `accessibilityLayer`, `onClick`).
   */
  chartProps?: Omit<RechartsLineChartProps, "children" | "data" | "margin" | "ref">;
}

const DEFAULT_MARGIN: Required<LineChartMargin> = {bottom: 0, left: 0, right: 8, top: 8};

/* -------------------------------------------------------------------------------------------------
 * Root
 * ResponsiveContainer + Recharts LineChart inside a `.line-chart` root that themes the Recharts
 * internals (axis ticks, grid, tooltip cursor, active dot, focus ring) with HeroUI tokens.
 * -----------------------------------------------------------------------------------------------*/
const LineChartRoot = ({
  chartProps,
  children,
  className,
  data,
  height = 300,
  margin,
  width = "100%",
  ...rest
}: LineChartRootProps) => {
  const resolvedMargin = margin ? {...DEFAULT_MARGIN, ...margin} : DEFAULT_MARGIN;

  return (
    <div className={lineChartVariants({className})} data-slot="line-chart" {...rest}>
      <ResponsiveContainer height={height} minWidth={0} width={width}>
        <RechartsLineChart {...chartProps} data={data} margin={resolvedMargin}>
          {children}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

LineChartRoot.displayName = "HeroUI.LineChart";

/* -------------------------------------------------------------------------------------------------
 * Re-exported Recharts parts
 * These are the Recharts components themselves (not wrappers), so the full Recharts API applies
 * and Recharts keeps recognising them as chart children.
 * -----------------------------------------------------------------------------------------------*/
const LineChartLine = Line;
const LineChartXAxis = XAxis;
const LineChartYAxis = YAxis;
const LineChartGrid = CartesianGrid;
const LineChartTooltip = Tooltip;

/** Pre-built tooltip renderer: pass as the `content` prop of `LineChart.Tooltip`. */
const LineChartTooltipContent = ChartTooltipContent;

type LineChartLineProps = ComponentProps<typeof Line>;
type LineChartXAxisProps = ComponentProps<typeof XAxis>;
type LineChartYAxisProps = ComponentProps<typeof YAxis>;
type LineChartGridProps = ComponentProps<typeof CartesianGrid>;
type LineChartTooltipProps = ComponentProps<typeof Tooltip>;
type LineChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent>;

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  LineChartRoot,
  LineChartLine,
  LineChartXAxis,
  LineChartYAxis,
  LineChartGrid,
  LineChartTooltip,
  LineChartTooltipContent,
};

export type {
  LineChartDatum,
  LineChartMargin,
  LineChartRootProps,
  LineChartLineProps,
  LineChartXAxisProps,
  LineChartYAxisProps,
  LineChartGridProps,
  LineChartTooltipProps,
  LineChartTooltipContentProps,
};
