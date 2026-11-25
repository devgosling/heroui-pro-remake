"use client";

import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {createContext, use, useMemo} from "react";

import {chartTooltipVariants} from "./chart-tooltip.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * Structural subset of what Recharts passes to a tooltip `content` element. Kept local so this
 * component never imports `recharts` (it is safe to export from the package root).
 * -----------------------------------------------------------------------------------------------*/
type ChartTooltipIndicatorShape = "dot" | "line";

type ChartTooltipValueType = number | string | ReadonlyArray<number | string>;

interface ChartTooltipPayloadItem {
  name?: string | number;
  value?: ChartTooltipValueType;
  dataKey?: string | number | ((obj: unknown) => unknown);
  color?: string;
  stroke?: string;
  fill?: string;
  /** Recharts marks entries that must not be listed with `type: "none"`. */
  type?: string;
  payload?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ChartTooltipContext = {
  indicator: ChartTooltipIndicatorShape;
  slots: ReturnType<typeof chartTooltipVariants>;
};

const ChartTooltipContext = createContext<ChartTooltipContext>({
  indicator: "dot",
  slots: chartTooltipVariants(),
});

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipRootProps extends ComponentPropsWithRef<"div"> {
  /** Controls visibility. When `false`, nothing is rendered. */
  active?: boolean;
  /** Shape of the colour indicator next to each series name. */
  indicator?: ChartTooltipIndicatorShape;
}

const ChartTooltipRoot = ({
  active = true,
  children,
  className,
  indicator = "dot",
  ...rest
}: ChartTooltipRootProps) => {
  const slots = useMemo(() => chartTooltipVariants({indicator}), [indicator]);
  const contextValue = useMemo(() => ({indicator, slots}), [indicator, slots]);

  if (!active) return null;

  return (
    <ChartTooltipContext value={contextValue}>
      <div className={slots.base({className})} data-slot="chart-tooltip" {...rest}>
        {children}
      </div>
    </ChartTooltipContext>
  );
};

ChartTooltipRoot.displayName = "HeroUI.ChartTooltip";

/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipHeaderProps extends ComponentPropsWithRef<"div"> {}

const ChartTooltipHeader = ({className, ...rest}: ChartTooltipHeaderProps) => {
  const {slots} = use(ChartTooltipContext);

  return <div className={slots.header({className})} data-slot="chart-tooltip-header" {...rest} />;
};

ChartTooltipHeader.displayName = "HeroUI.ChartTooltip.Header";

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipItemProps extends ComponentPropsWithRef<"div"> {}

const ChartTooltipItem = ({className, ...rest}: ChartTooltipItemProps) => {
  const {slots} = use(ChartTooltipContext);

  return <div className={slots.item({className})} data-slot="chart-tooltip-item" {...rest} />;
};

ChartTooltipItem.displayName = "HeroUI.ChartTooltip.Item";

/* -------------------------------------------------------------------------------------------------
 * Indicator
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipIndicatorProps extends Omit<ComponentPropsWithRef<"span">, "color"> {
  /** CSS colour used as the indicator background (e.g. `var(--chart-3)`). */
  color?: string;
}

const ChartTooltipIndicator = ({className, color, style, ...rest}: ChartTooltipIndicatorProps) => {
  const {slots} = use(ChartTooltipContext);
  const resolvedStyle = useMemo<CSSProperties | undefined>(
    () => (color ? {backgroundColor: color, ...style} : style),
    [color, style],
  );

  return (
    <span
      className={slots.indicator({className})}
      data-slot="chart-tooltip-indicator"
      style={resolvedStyle}
      {...rest}
    />
  );
};

ChartTooltipIndicator.displayName = "HeroUI.ChartTooltip.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipLabelProps extends ComponentPropsWithRef<"span"> {}

const ChartTooltipLabel = ({className, ...rest}: ChartTooltipLabelProps) => {
  const {slots} = use(ChartTooltipContext);

  return <span className={slots.label({className})} data-slot="chart-tooltip-label" {...rest} />;
};

ChartTooltipLabel.displayName = "HeroUI.ChartTooltip.Label";

/* -------------------------------------------------------------------------------------------------
 * Value
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipValueProps extends ComponentPropsWithRef<"span"> {}

const ChartTooltipValue = ({className, ...rest}: ChartTooltipValueProps) => {
  const {slots} = use(ChartTooltipContext);

  return <span className={slots.value({className})} data-slot="chart-tooltip-value" {...rest} />;
};

ChartTooltipValue.displayName = "HeroUI.ChartTooltip.Value";

/* -------------------------------------------------------------------------------------------------
 * Content (auto-renders the Recharts payload)
 * -----------------------------------------------------------------------------------------------*/
interface ChartTooltipContentProps {
  /** Provided by Recharts: whether the tooltip is active. */
  active?: boolean;
  /** Provided by Recharts: the series entries of the hovered data point. */
  payload?: ReadonlyArray<ChartTooltipPayloadItem>;
  /** Provided by Recharts: the axis label of the hovered data point. */
  label?: string | number;
  /** Hides the header row. */
  hideHeader?: boolean;
  /** Shape of the colour indicator. */
  indicator?: ChartTooltipIndicatorShape;
  /** Formats the header label. Also receives the payload (e.g. to read the hovered datum). */
  labelFormatter?: (
    label: string | number | undefined,
    payload: ReadonlyArray<ChartTooltipPayloadItem>,
  ) => ReactNode;
  /** Formats each series value. Also receives the payload entry. */
  valueFormatter?: (
    value: ChartTooltipValueType | undefined,
    item: ChartTooltipPayloadItem,
  ) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Gradients (`url(#id)`) cannot be used as a background colour. */
const isUsableColor = (color: unknown): color is string =>
  typeof color === "string" && color !== "" && !color.startsWith("url(");

const resolveItemColor = (item: ChartTooltipPayloadItem) =>
  [item.color, item.stroke, item.fill, item.payload?.["fill"], item.payload?.["color"]].find(
    isUsableColor,
  );

const resolveItemName = (item: ChartTooltipPayloadItem) => {
  if (item.name !== undefined && item.name !== null && item.name !== "") return item.name;
  if (typeof item.dataKey === "string" || typeof item.dataKey === "number") return item.dataKey;

  return "";
};

const isRenderable = (node: ReactNode) => node !== undefined && node !== null && node !== "";

const ChartTooltipContent = ({
  active,
  className,
  hideHeader = false,
  indicator = "dot",
  label,
  labelFormatter,
  payload,
  style,
  valueFormatter,
}: ChartTooltipContentProps) => {
  const items = payload?.filter((item) => item.type !== "none") ?? [];

  if (!active || items.length === 0) return null;

  const header = labelFormatter ? labelFormatter(label, items) : label;

  return (
    <ChartTooltipRoot className={className} indicator={indicator} style={style}>
      {!hideHeader && isRenderable(header) ? (
        <ChartTooltipHeader>{header}</ChartTooltipHeader>
      ) : null}
      {items.map((item, index) => (
        <ChartTooltipItem key={`${String(resolveItemName(item))}-${index}`}>
          <ChartTooltipIndicator color={resolveItemColor(item)} />
          <ChartTooltipLabel>{resolveItemName(item)}</ChartTooltipLabel>
          <ChartTooltipValue>
            {valueFormatter ? valueFormatter(item.value, item) : String(item.value ?? "")}
          </ChartTooltipValue>
        </ChartTooltipItem>
      ))}
    </ChartTooltipRoot>
  );
};

ChartTooltipContent.displayName = "HeroUI.ChartTooltip.Content";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChartTooltipContext,
  ChartTooltipRoot,
  ChartTooltipHeader,
  ChartTooltipItem,
  ChartTooltipIndicator,
  ChartTooltipLabel,
  ChartTooltipValue,
  ChartTooltipContent,
};

export type {
  ChartTooltipIndicatorShape,
  ChartTooltipValueType,
  ChartTooltipPayloadItem,
  ChartTooltipRootProps,
  ChartTooltipHeaderProps,
  ChartTooltipItemProps,
  ChartTooltipIndicatorProps,
  ChartTooltipLabelProps,
  ChartTooltipValueProps,
  ChartTooltipContentProps,
};
