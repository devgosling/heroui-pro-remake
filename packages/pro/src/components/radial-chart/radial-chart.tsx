"use client";

import type {ChartTooltipContentProps, ChartTooltipPayloadItem} from "../chart-tooltip";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {useMemo} from "react";
import {
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {ChartTooltipContent} from "../chart-tooltip";

import {radialChartVariants} from "./radial-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface RadialChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart data: array of objects. Each entry becomes a concentric ring. */
  data: Record<string, number | string>[];
  /** Chart height in pixels. */
  height?: number;
  /** Chart width in pixels or percentage string. */
  width?: number | `${number}%`;
  /** Bar (ring) thickness in pixels. */
  barSize?: number;
  /** Inner radius of the bar area (px or percentage of the available radius). */
  innerRadius?: number | string;
  /** Outer radius of the bar area (px or percentage of the available radius). */
  outerRadius?: number | string;
  /** Start angle in degrees (0 = 3 o'clock, counter-clockwise). */
  startAngle?: number;
  /** End angle in degrees. */
  endAngle?: number;
  /** Recharts children (`RadialChart.Bar`, `RadialChart.AngleAxis`, `RadialChart.Tooltip`, ...). */
  children?: ReactNode;
}

const RadialChartRoot = ({
  barSize = 10,
  children,
  className,
  data,
  endAngle = -270,
  height = 300,
  innerRadius = "30%",
  outerRadius = "80%",
  startAngle = 90,
  width = "100%",
  ...rest
}: RadialChartRootProps) => {
  return (
    <div className={radialChartVariants({className})} data-slot="radial-chart" {...rest}>
      {/* With numeric width + height Recharts skips the size-detector div and renders the chart directly */}
      <ResponsiveContainer height={height} width={width}>
        <RadialBarChart
          barSize={barSize}
          data={data}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
        >
          {children}
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

RadialChartRoot.displayName = "HeroUI.RadialChart";

/* -------------------------------------------------------------------------------------------------
 * Tooltip content
 * Recharts names every radial-bar tooltip entry after the bar's `dataKey` and labels it with the
 * ring index. A ring is a data entry, so the entry's own `name` is used as the series label and
 * the (index) header is hidden unless a `labelFormatter` asks for one.
 * -----------------------------------------------------------------------------------------------*/
type RadialChartTooltipContentProps = ChartTooltipContentProps;

const withRingName = (item: ChartTooltipPayloadItem): ChartTooltipPayloadItem => {
  const ringName = item.payload?.["name"];

  if (typeof ringName === "string" || typeof ringName === "number") {
    return ringName === "" ? item : {...item, name: ringName};
  }

  return item;
};

const RadialChartTooltipContent = ({
  hideHeader,
  labelFormatter,
  payload,
  ...rest
}: RadialChartTooltipContentProps) => {
  const items = useMemo(() => payload?.map(withRingName), [payload]);

  return (
    <ChartTooltipContent
      {...rest}
      hideHeader={hideHeader ?? !labelFormatter}
      labelFormatter={labelFormatter}
      payload={items}
    />
  );
};

RadialChartTooltipContent.displayName = "HeroUI.RadialChart.TooltipContent";

/* -------------------------------------------------------------------------------------------------
 * Re-exported Recharts parts
 * -----------------------------------------------------------------------------------------------*/
/** Recharts `RadialBar`: one ring per data entry. */
const RadialChartBar = RadialBar;
/** Recharts `Cell`: per-ring fill inside `RadialChart.Bar`. */
const RadialChartCell = Cell;
/** Recharts `PolarAngleAxis`: set a numeric `domain` to turn the rings into gauges. */
const RadialChartAngleAxis = PolarAngleAxis;
/** Recharts `Tooltip`: pass `content={<RadialChart.TooltipContent />}`. */
const RadialChartTooltip = Tooltip;

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  RadialChartRoot,
  RadialChartBar,
  RadialChartCell,
  RadialChartAngleAxis,
  RadialChartTooltip,
  RadialChartTooltipContent,
};

export type {RadialChartRootProps, RadialChartTooltipContentProps};
