"use client";

import type {ComponentPropsWithRef, ReactNode} from "react";
import type {StackOffsetType, SyncMethod} from "recharts";

import {useMemo} from "react";
import {BarChart as RechartsBarChart, ResponsiveContainer} from "recharts";

import {barChartVariants} from "./bar-chart.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/** One data point: a category plus one numeric field per series. `null` renders no bar. */
type BarChartDatum = Record<string, number | string | null | undefined>;

/** `"vertical"` draws horizontal bars (categories on the Y axis). */
type BarChartLayout = "horizontal" | "vertical";

interface BarChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

const DEFAULT_MARGIN: BarChartMargin = {bottom: 0, left: 0, right: 8, top: 8};

/* -------------------------------------------------------------------------------------------------
 * Root
 * `div.bar-chart` > Recharts `ResponsiveContainer` > Recharts `BarChart`. Axes, grid, bars and the
 * tooltip are the re-exported Recharts components; the theming lives in `bar-chart.css`.
 * -----------------------------------------------------------------------------------------------*/
interface BarChartRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Chart data: array of objects with numeric/string fields for each series. */
  data?: ReadonlyArray<BarChartDatum>;
  /** Chart height in pixels. */
  height?: number;
  /** Chart width in pixels or percentage string. */
  width?: number | `${number}%`;
  /** Bar layout direction. Use `"vertical"` for horizontal bar charts. */
  layout?: BarChartLayout;
  /** Recharts margin around the chart area. */
  margin?: BarChartMargin;
  /** Recharts child components (`BarChart.Bar`, `BarChart.XAxis`, ...). */
  children?: ReactNode;
  /** Gap between two bar categories (number in px or percentage string). Recharts default `"10%"`. */
  barCategoryGap?: number | string;
  /** Gap between two bars of the same category. Recharts default `4`. */
  barGap?: number | string;
  /** Fixed size of every bar (can also be set per `BarChart.Bar`). */
  barSize?: number | string;
  /** Maximum size of every bar. */
  maxBarSize?: number;
  /** d3-shape offset used for stacked bars. */
  stackOffset?: StackOffsetType;
  /** Renders stacked bars right to left (SVG layering only). */
  reverseStackOrder?: boolean;
  /** Synchronises the tooltip with other charts sharing this id. */
  syncId?: number | string;
  /** How synchronised charts are matched. */
  syncMethod?: SyncMethod;
}

const BarChartRoot = ({
  barCategoryGap,
  barGap,
  barSize,
  children,
  className,
  data,
  height = 300,
  layout = "horizontal",
  margin = DEFAULT_MARGIN,
  maxBarSize,
  reverseStackOrder,
  stackOffset,
  syncId,
  syncMethod,
  width = "100%",
  ...rest
}: BarChartRootProps) => {
  const styles = useMemo(() => barChartVariants({className}), [className]);

  return (
    <div className={styles} data-slot="bar-chart" {...rest}>
      <ResponsiveContainer height={height} minWidth={0} width={width}>
        <RechartsBarChart
          barCategoryGap={barCategoryGap}
          barGap={barGap}
          barSize={barSize}
          data={data}
          layout={layout}
          margin={margin}
          maxBarSize={maxBarSize}
          reverseStackOrder={reverseStackOrder}
          stackOffset={stackOffset}
          syncId={syncId}
          syncMethod={syncMethod}
        >
          {children}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

BarChartRoot.displayName = "HeroUI.BarChart";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {BarChartRoot};

export type {BarChartRootProps, BarChartDatum, BarChartLayout, BarChartMargin};
