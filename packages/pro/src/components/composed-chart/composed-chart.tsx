"use client";

import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {useMemo} from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Line,
  ComposedChart as RechartsComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {ChartTooltipContent} from "../chart-tooltip";

import {composedChartVariants} from "./composed-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/** One chart row: a category field plus one numeric (or string) field per series. */
type ComposedChartDatum = Record<string, number | string | null | undefined>;

interface ComposedChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

type RechartsComposedChartProps = ComponentProps<typeof RechartsComposedChart>;

interface ComposedChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart data: array of objects with numeric/string fields for each series. */
  data: ComposedChartDatum[];
  /**
   * Chart height in pixels.
   * @default 300
   */
  height?: number;
  /**
   * Chart width in pixels or as a percentage string.
   * @default "100%"
   */
  width?: number | `${number}%`;
  /**
   * Recharts margin around the plot area. Partial values are merged with the default.
   * @default {top: 8, right: 8, bottom: 0, left: 0}
   */
  margin?: ComposedChartMargin;
  /**
   * Recharts children: `ComposedChart.Bar`, `ComposedChart.Line`, `ComposedChart.Area`,
   * `ComposedChart.XAxis`, `ComposedChart.YAxis`, `ComposedChart.Grid`, `ComposedChart.Tooltip`
   * (or any other Recharts cartesian child such as `ReferenceLine`, `Legend`, `Brush`).
   */
  children?: ReactNode;
  /**
   * Extra props forwarded to the underlying Recharts `ComposedChart`
   * (e.g. `barGap`, `barCategoryGap`, `stackOffset`, `syncId`, `layout`, `accessibilityLayer`).
   */
  chartProps?: Omit<RechartsComposedChartProps, "children" | "data" | "margin" | "ref">;
}

const DEFAULT_MARGIN: Required<ComposedChartMargin> = {bottom: 0, left: 0, right: 8, top: 8};

/* -------------------------------------------------------------------------------------------------
 * Root
 * A `.composed-chart` div (which themes the Recharts internals with HeroUI tokens from CSS)
 * wrapping a ResponsiveContainer + Recharts ComposedChart.
 * -----------------------------------------------------------------------------------------------*/
const ComposedChartRoot = ({
  chartProps,
  children,
  className,
  data,
  height = 300,
  margin,
  width = "100%",
  ...rest
}: ComposedChartRootProps) => {
  const resolvedMargin = useMemo(
    () => (margin ? {...DEFAULT_MARGIN, ...margin} : DEFAULT_MARGIN),
    [margin],
  );

  return (
    <div className={composedChartVariants({className})} data-slot="composed-chart" {...rest}>
      <ResponsiveContainer height={height} minWidth={0} width={width}>
        <RechartsComposedChart {...chartProps} data={data} margin={resolvedMargin}>
          {children}
        </RechartsComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

ComposedChartRoot.displayName = "HeroUI.ComposedChart";

/* -------------------------------------------------------------------------------------------------
 * Re-exported Recharts parts
 * These are the Recharts components themselves (not wrappers): every Recharts prop works, and
 * Recharts keeps recognising them as chart children. Colours are passed per series, typically
 * with the accent-derived palette tokens (`fill="var(--chart-3)"`, `stroke="var(--chart-1)"`).
 * -----------------------------------------------------------------------------------------------*/
const ComposedChartBar = Bar;
const ComposedChartLine = Line;
const ComposedChartArea = Area;
const ComposedChartXAxis = XAxis;
const ComposedChartYAxis = YAxis;
const ComposedChartGrid = CartesianGrid;
const ComposedChartTooltip = Tooltip;

/** Pre-built tooltip renderer: pass as the `content` prop of `ComposedChart.Tooltip`. */
const ComposedChartTooltipContent = ChartTooltipContent;

type ComposedChartBarProps = ComponentProps<typeof Bar>;
type ComposedChartLineProps = ComponentProps<typeof Line>;
type ComposedChartAreaProps = ComponentProps<typeof Area>;
type ComposedChartXAxisProps = ComponentProps<typeof XAxis>;
type ComposedChartYAxisProps = ComponentProps<typeof YAxis>;
type ComposedChartGridProps = ComponentProps<typeof CartesianGrid>;
type ComposedChartTooltipProps = ComponentProps<typeof Tooltip>;
type ComposedChartTooltipContentProps = ComponentProps<typeof ChartTooltipContent>;

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  ComposedChartDatum,
  ComposedChartMargin,
  ComposedChartRootProps,
  ComposedChartBarProps,
  ComposedChartLineProps,
  ComposedChartAreaProps,
  ComposedChartXAxisProps,
  ComposedChartYAxisProps,
  ComposedChartGridProps,
  ComposedChartTooltipProps,
  ComposedChartTooltipContentProps,
};
