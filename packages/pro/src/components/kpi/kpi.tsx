"use client";

import type {NumberValueFormatProps} from "../number-value";
import type {TrendChipRootProps} from "../trend-chip";
import type {ComponentProps, ComponentPropsWithRef, ReactElement, ReactNode} from "react";

import {Button, Card, ProgressBar, Separator} from "@heroui/react";
import {cloneElement, createContext, isValidElement, use, useId, useMemo} from "react";
import {Area, AreaChart, ResponsiveContainer} from "recharts";

import {useFormattedNumber} from "../number-value";
import {TrendChip} from "../trend-chip";

import {kpiVariants} from "./kpi.styles";

type KPIStatus = "success" | "warning" | "danger";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
const defaultSlots = kpiVariants();

type KPIContext = {
  slots: ReturnType<typeof kpiVariants>;
};

const KPIContext = createContext<KPIContext>({slots: defaultSlots});

/* -------------------------------------------------------------------------------------------------
 * Root (OSS Card)
 * -----------------------------------------------------------------------------------------------*/
type KPIRootProps = ComponentPropsWithRef<typeof Card>;

const KPIRoot = ({className, ...rest}: KPIRootProps) => {
  const slots = useMemo(() => kpiVariants(), []);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <KPIContext value={contextValue}>
      <Card {...(rest as KPIRootProps)} className={slots.base({className})} data-slot="kpi" />
    </KPIContext>
  );
};

KPIRoot.displayName = "HeroUI.KPI";

/* -------------------------------------------------------------------------------------------------
 * Layout parts
 * -----------------------------------------------------------------------------------------------*/
interface KPIHeaderProps extends ComponentPropsWithRef<"div"> {}

const KPIHeader = ({className, ...rest}: KPIHeaderProps) => {
  const {slots} = use(KPIContext);

  return <div className={slots.header({className})} data-slot="kpi-header" {...rest} />;
};

KPIHeader.displayName = "HeroUI.KPI.Header";

interface KPIContentProps extends ComponentPropsWithRef<"div"> {}

const KPIContent = ({className, ...rest}: KPIContentProps) => {
  const {slots} = use(KPIContext);

  return <div className={slots.content({className})} data-slot="kpi-content" {...rest} />;
};

KPIContent.displayName = "HeroUI.KPI.Content";

interface KPIFooterProps extends ComponentPropsWithRef<"div"> {}

const KPIFooter = ({className, ...rest}: KPIFooterProps) => {
  const {slots} = use(KPIContext);

  return <div className={slots.footer({className})} data-slot="kpi-footer" {...rest} />;
};

KPIFooter.displayName = "HeroUI.KPI.Footer";

/* -------------------------------------------------------------------------------------------------
 * Icon / Title / Value
 * -----------------------------------------------------------------------------------------------*/
interface KPIIconProps extends ComponentPropsWithRef<"div"> {
  /** Tints the icon background and colour. */
  status?: KPIStatus;
}

const KPIIcon = ({className, status, ...rest}: KPIIconProps) => {
  const {slots} = use(KPIContext);

  return (
    <div className={slots.icon({className})} data-slot="kpi-icon" data-status={status} {...rest} />
  );
};

KPIIcon.displayName = "HeroUI.KPI.Icon";

interface KPITitleProps extends ComponentPropsWithRef<"dt"> {}

const KPITitle = ({className, ...rest}: KPITitleProps) => {
  const {slots} = use(KPIContext);

  return <dt className={slots.title({className})} data-slot="kpi-title" {...rest} />;
};

KPITitle.displayName = "HeroUI.KPI.Title";

interface KPIValueProps
  extends Omit<ComponentPropsWithRef<"dd">, "children" | "style">, NumberValueFormatProps {
  /** The number to format. */
  value: number;
  /** Optional render function receiving the formatted string. */
  children?: (formatted: string) => ReactNode;
}

const KPIValue = ({
  children,
  className,
  currency,
  formatOptions,
  locale,
  maximumFractionDigits,
  minimumFractionDigits,
  notation,
  signDisplay,
  style,
  unit,
  value,
  ...rest
}: KPIValueProps) => {
  const {slots} = use(KPIContext);
  const formatted = useFormattedNumber(value, {
    currency,
    formatOptions,
    locale,
    maximumFractionDigits,
    minimumFractionDigits,
    notation,
    signDisplay,
    style,
    unit,
  });

  return (
    <dd className={slots.value({className})} data-slot="kpi-value" {...rest}>
      {children ? children(formatted) : formatted}
    </dd>
  );
};

KPIValue.displayName = "HeroUI.KPI.Value";

/* -------------------------------------------------------------------------------------------------
 * Trend (Pro TrendChip)
 * -----------------------------------------------------------------------------------------------*/
const KPITrend = ({className, ...rest}: TrendChipRootProps) => {
  const {slots} = use(KPIContext);

  return <TrendChip {...rest} className={slots.trend({className})} />;
};

KPITrend.displayName = "HeroUI.KPI.Trend";

/* -------------------------------------------------------------------------------------------------
 * Progress (OSS ProgressBar)
 * -----------------------------------------------------------------------------------------------*/
interface KPIProgressProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Progress from 0 to 100. */
  value: number;
  /** Bar colour. */
  status?: KPIStatus;
  "aria-label"?: string;
}

const KPIProgress = ({
  "aria-label": ariaLabel = "Progress",
  className,
  status = "success",
  value,
  ...rest
}: KPIProgressProps) => {
  const {slots} = use(KPIContext);

  return (
    <div className={slots.progress({className})} data-slot="kpi-progress" {...rest}>
      <ProgressBar aria-label={ariaLabel} color={status} size="sm" value={value}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
};

KPIProgress.displayName = "HeroUI.KPI.Progress";

/* -------------------------------------------------------------------------------------------------
 * Actions (ghost icon button, three dots by default)
 * -----------------------------------------------------------------------------------------------*/
type KPIActionsProps = ComponentPropsWithRef<typeof Button>;

const DotsIcon = () => (
  <svg aria-hidden="true" fill="currentColor" focusable="false" viewBox="0 0 16 16">
    <circle cx="8" cy="3" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
  </svg>
);

const KPIActions = ({
  "aria-label": ariaLabel = "More actions",
  children,
  ...rest
}: KPIActionsProps) => {
  const {slots} = use(KPIContext);

  return (
    <div className={slots.actions()} data-slot="kpi-actions">
      <Button isIconOnly aria-label={ariaLabel} size="sm" variant="ghost" {...rest}>
        {children ?? <DotsIcon />}
      </Button>
    </div>
  );
};

KPIActions.displayName = "HeroUI.KPI.Actions";

/* -------------------------------------------------------------------------------------------------
 * Separator (OSS Separator, edge to edge)
 * -----------------------------------------------------------------------------------------------*/
type KPISeparatorProps = ComponentPropsWithRef<typeof Separator>;

const KPISeparator = ({className, ...rest}: KPISeparatorProps) => {
  const {slots} = use(KPIContext);

  return <Separator {...rest} className={slots.separator({className})} data-slot="kpi-separator" />;
};

KPISeparator.displayName = "HeroUI.KPI.Separator";

/* -------------------------------------------------------------------------------------------------
 * Chart (Recharts sparkline)
 * -----------------------------------------------------------------------------------------------*/
interface KPIChartProps extends Omit<ComponentPropsWithRef<"div">, "color" | "children"> {
  /** Chart data. `null` values render a gap. */
  data: Record<string, number | string | null>[];
  /** Key of the Y value. */
  dataKey?: string;
  /** Stroke colour (also the gradient colour unless `fillColor` is set). */
  color?: string;
  /** Bridge `null` gaps instead of splitting the line. */
  connectNulls?: boolean;
  /** Gradient colour. */
  fillColor?: string;
  /** Chart height in px. */
  height?: number;
  /** Line width. */
  strokeWidth?: number;
  /** A Recharts `<Tooltip />` element (e.g. with `content={<ChartTooltip.Content />}`). */
  tooltip?: ReactNode;
  /** Forwarded to the Recharts `Area`; overrides the props set here. */
  areaProps?: Omit<ComponentProps<typeof Area>, "dataKey" | "ref">;
}

type TooltipContent = ReactElement | ((props: Record<string, unknown>) => ReactNode) | undefined;

const renderTooltipContent = (content: TooltipContent, props: Record<string, unknown>) => {
  if (isValidElement(content))
    return cloneElement(content as ReactElement<Record<string, unknown>>, props);
  if (typeof content === "function") return content(props);

  return null;
};

/**
 * Centres the tooltip above the hovered point and lets it escape the chart box,
 * so it is not clipped by the card or faded by the edge mask.
 */
const enhanceTooltip = (tooltip: ReactNode) => {
  if (!isValidElement<{content?: TooltipContent}>(tooltip)) return null;
  const originalContent = tooltip.props.content;

  return cloneElement(tooltip as ReactElement<Record<string, unknown>>, {
    allowEscapeViewBox: {x: true, y: true},
    content: (props: Record<string, unknown>) => (
      <div style={{transform: "translate(-50%, calc(-100% - 10px))"}}>
        {renderTooltipContent(originalContent, props)}
      </div>
    ),
    offset: 0,
  });
};

const KPIChart = ({
  areaProps,
  className,
  color = "currentColor",
  connectNulls = false,
  data,
  dataKey = "value",
  fillColor,
  height = 80,
  strokeWidth = 2,
  tooltip,
  ...rest
}: KPIChartProps) => {
  const {slots} = use(KPIContext);
  const gradientId = `kpi-chart-gradient-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const gradientColor = fillColor ?? color;
  const tooltipElement = useMemo(() => enhanceTooltip(tooltip), [tooltip]);

  return (
    <div
      className={slots.chart({className})}
      data-has-tooltip={tooltipElement ? "true" : undefined}
      data-slot="kpi-chart"
      {...rest}
    >
      <div className="area-chart" data-slot="area-chart">
        <ResponsiveContainer height={height} minWidth={0} width="100%">
          <AreaChart data={data} margin={{bottom: 0, left: 0, right: 0, top: 4}}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={gradientColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={gradientColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {tooltipElement}
            <Area
              connectNulls={connectNulls}
              dataKey={dataKey}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              stroke={color}
              strokeWidth={strokeWidth}
              type="monotone"
              {...areaProps}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

KPIChart.displayName = "HeroUI.KPI.Chart";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  KPIRoot,
  KPIHeader,
  KPIContent,
  KPIFooter,
  KPIIcon,
  KPITitle,
  KPIValue,
  KPITrend,
  KPIProgress,
  KPIActions,
  KPISeparator,
  KPIChart,
};

export type {
  KPIStatus,
  KPIRootProps,
  KPIHeaderProps,
  KPIContentProps,
  KPIFooterProps,
  KPIIconProps,
  KPITitleProps,
  KPIValueProps,
  KPIProgressProps,
  KPIActionsProps,
  KPISeparatorProps,
  KPIChartProps,
};
