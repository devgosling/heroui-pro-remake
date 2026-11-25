"use client";

import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {ChartTooltipContent} from "../chart-tooltip";

import {areaChartVariants} from "./area-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type AreaChartDatum = Record<string, number | string | null | undefined>;

interface AreaChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

type RechartsAreaChartProps = ComponentProps<typeof RechartsAreaChart>;

interface AreaChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart data: one object per category with a numeric/string field per series. */
  data: AreaChartDatum[];
  /** Chart height in pixels. */
  height?: number;
  /** Chart width in pixels or as a percentage string. */
  width?: number | `${number}%`;
  /**
   * Recharts margin around the plot area. Passed through as-is, so (as in Recharts) a side left
   * out of a custom margin is 0.
   */
  margin?: AreaChartMargin;
  /** Recharts children (`AreaChart.Area`, `AreaChart.XAxis`, `AreaChart.Tooltip`, ...). */
  children?: ReactNode;
  /**
   * Extra props forwarded to the underlying Recharts `AreaChart`
   * (e.g. `stackOffset`, `syncId`, `layout`, `baseValue`, `accessibilityLayer`).
   */
  chartProps?: Omit<RechartsAreaChartProps, "children" | "data" | "margin" | "ref">;
}

const DEFAULT_MARGIN: AreaChartMargin = {bottom: 0, left: 0, right: 8, top: 8};

/* -------------------------------------------------------------------------------------------------
 * Root
 * ResponsiveContainer + Recharts AreaChart inside a `.area-chart` root that themes the Recharts
 * internals (axis ticks, grid, cursor, active dot) with HeroUI tokens.
 * -----------------------------------------------------------------------------------------------*/
const AreaChartRoot = ({
  chartProps,
  children,
  className,
  data,
  height = 300,
  margin = DEFAULT_MARGIN,
  width = "100%",
  ...rest
}: AreaChartRootProps) => {
  return (
    <div className={areaChartVariants({className})} data-slot="area-chart" {...rest}>
      <ResponsiveContainer height={height} minWidth={0} width={width}>
        <RechartsAreaChart {...chartProps} data={data} margin={margin}>
          {children}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

AreaChartRoot.displayName = "HeroUI.AreaChart";

/* -------------------------------------------------------------------------------------------------
 * Re-exported Recharts parts
 * They are the Recharts components themselves (not wrappers), so every Recharts prop works and
 * Recharts keeps recognising them as chart children.
 * -----------------------------------------------------------------------------------------------*/
const AreaChartArea = Area;
const AreaChartXAxis = XAxis;
const AreaChartYAxis = YAxis;
const AreaChartGrid = CartesianGrid;
const AreaChartTooltip = Tooltip;

/** Pre-built tooltip renderer: pass as the `content` prop of `AreaChart.Tooltip`. */
const AreaChartTooltipContent = ChartTooltipContent;

type AreaChartAreaProps = ComponentProps<typeof Area>;
type AreaChartXAxisProps = ComponentProps<typeof XAxis>;
type AreaChartYAxisProps = ComponentProps<typeof YAxis>;
type AreaChartGridProps = ComponentProps<typeof CartesianGrid>;
type AreaChartTooltipProps = ComponentProps<typeof Tooltip>;
type AreaChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent>;

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  AreaChartRoot,
  AreaChartArea,
  AreaChartXAxis,
  AreaChartYAxis,
  AreaChartGrid,
  AreaChartTooltip,
  AreaChartTooltipContent,
};

export type {
  AreaChartDatum,
  AreaChartMargin,
  AreaChartRootProps,
  AreaChartAreaProps,
  AreaChartXAxisProps,
  AreaChartYAxisProps,
  AreaChartGridProps,
  AreaChartTooltipProps,
  AreaChartTooltipContentProps,
};
