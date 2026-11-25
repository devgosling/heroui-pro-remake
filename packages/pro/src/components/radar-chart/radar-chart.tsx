"use client";

import type {ChartTooltipContentProps} from "../chart-tooltip";
import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {useMemo} from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {ChartTooltipContent} from "../chart-tooltip";

import {radarChartVariants} from "./radar-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Root
 * A themed wrapper: `.radar-chart` > Recharts `ResponsiveContainer` > Recharts `RadarChart`.
 * All the theming (tick labels, grid, focus ring, hidden cursor) lives in `radar-chart.css` and
 * targets the internal Recharts class names, so the Recharts parts below stay plain re-exports.
 * -----------------------------------------------------------------------------------------------*/
type RadarChartDatum = Record<string, number | string>;

interface RadarChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart data: an array of objects with a category key and numeric series fields. */
  data: RadarChartDatum[];
  /** Chart height in pixels. */
  height?: number;
  /** Chart width in pixels or as a percentage string. */
  width?: number | `${number}%`;
  /** Recharts child components (`RadarChart.Radar`, `RadarChart.Grid`, ...). */
  children?: ReactNode;
}

const RadarChartRoot = ({
  children,
  className,
  data,
  height = 300,
  width = "100%",
  ...rest
}: RadarChartRootProps) => {
  const slots = useMemo(() => radarChartVariants(), []);

  return (
    <div className={slots.base({className})} data-slot="radar-chart" {...rest}>
      <ResponsiveContainer height={height} width={width}>
        <RechartsRadarChart data={data}>{children}</RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

RadarChartRoot.displayName = "HeroUI.RadarChart";

/* -------------------------------------------------------------------------------------------------
 * Recharts parts (re-exported as-is, they follow the Recharts API)
 * -----------------------------------------------------------------------------------------------*/
/** Recharts `Radar`: one polygon per series. */
const RadarChartRadar = Radar;

/** Recharts `PolarGrid`: concentric polygons (or circles) and the angle spokes. */
const RadarChartGrid = PolarGrid;

/** Recharts `PolarAngleAxis`: the category labels around the chart. */
const RadarChartAngleAxis = PolarAngleAxis;

/** Recharts `PolarRadiusAxis`: the value scale along one spoke. */
const RadarChartRadiusAxis = PolarRadiusAxis;

/** Recharts `Tooltip`: pass `content={<RadarChart.TooltipContent />}` for the HeroUI card. */
const RadarChartTooltip = Tooltip;

/* -------------------------------------------------------------------------------------------------
 * Tooltip content (Pro ChartTooltip card)
 * -----------------------------------------------------------------------------------------------*/
type RadarChartTooltipContentProps = ChartTooltipContentProps;

const RadarChartTooltipContent = (props: RadarChartTooltipContentProps) => (
  <ChartTooltipContent {...props} />
);

RadarChartTooltipContent.displayName = "HeroUI.RadarChart.TooltipContent";

type RadarChartRadarProps = ComponentProps<typeof Radar>;
type RadarChartGridProps = ComponentProps<typeof PolarGrid>;
type RadarChartAngleAxisProps = ComponentProps<typeof PolarAngleAxis>;
type RadarChartRadiusAxisProps = ComponentProps<typeof PolarRadiusAxis>;
type RadarChartTooltipProps = ComponentProps<typeof Tooltip>;

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  RadarChartRoot,
  RadarChartRadar,
  RadarChartGrid,
  RadarChartAngleAxis,
  RadarChartRadiusAxis,
  RadarChartTooltip,
  RadarChartTooltipContent,
};

export type {
  RadarChartDatum,
  RadarChartRootProps,
  RadarChartRadarProps,
  RadarChartGridProps,
  RadarChartAngleAxisProps,
  RadarChartRadiusAxisProps,
  RadarChartTooltipProps,
  RadarChartTooltipContentProps,
};
