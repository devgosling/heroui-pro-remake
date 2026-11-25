import type {Meta, StoryObj} from "@storybook/react";
import type {TooltipContentProps} from "recharts";

import {Card} from "@heroui/react";
import React, {useId} from "react";

import {ChartTooltip} from "../chart-tooltip";
import {KPI} from "../kpi";
import {TrendChip} from "../trend-chip";

import {AreaChart} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Data
 * -----------------------------------------------------------------------------------------------*/
const netRevenue = [
  {month: "Jan", revenue: 3100},
  {month: "Feb", revenue: 4600},
  {month: "Mar", revenue: 4100},
  {month: "Apr", revenue: 6300},
  {month: "May", revenue: 5400},
  {month: "Jun", revenue: 7700},
  {month: "Jul", revenue: 6900},
  {month: "Aug", revenue: 8800},
  {month: "Sep", revenue: 8100},
  {month: "Oct", revenue: 9900},
  {month: "Nov", revenue: 9300},
  {month: "Dec", revenue: 11200},
];

const deviceVisits = [
  {desktop: 2600, mobile: 1300, month: "Jan"},
  {desktop: 4400, mobile: 2700, month: "Feb"},
  {desktop: 7200, mobile: 4300, month: "Mar"},
  {desktop: 6100, mobile: 5600, month: "Apr"},
  {desktop: 8900, mobile: 3800, month: "May"},
  {desktop: 7400, mobile: 5100, month: "Jun"},
  {desktop: 9600, mobile: 6900, month: "Jul"},
  {desktop: 8300, mobile: 6200, month: "Aug"},
  {desktop: 11400, mobile: 7100, month: "Sep"},
  {desktop: 12800, mobile: 9400, month: "Oct"},
  {desktop: 15100, mobile: 9900, month: "Nov"},
  {desktop: 14200, mobile: 8700, month: "Dec"},
];

const channelMix = [
  {email: 600, month: "Jan", search: 2200, social: 1100, video: 900},
  {email: 900, month: "Feb", search: 3600, social: 1700, video: 1300},
  {email: 1300, month: "Mar", search: 5900, social: 2600, video: 2100},
  {email: 1600, month: "Apr", search: 5100, social: 2900, video: 2400},
  {email: 1900, month: "May", search: 6800, social: 3500, video: 2700},
  {email: 2200, month: "Jun", search: 7600, social: 4100, video: 3000},
  {email: 2400, month: "Jul", search: 8300, social: 4600, video: 3400},
  {email: 2300, month: "Aug", search: 9100, social: 5200, video: 3900},
  {email: 2700, month: "Sep", search: 10200, social: 5600, video: 4200},
  {email: 3100, month: "Oct", search: 11800, social: 6300, video: 4700},
  {email: 3300, month: "Nov", search: 12600, social: 6800, video: 5100},
  {email: 3600, month: "Dec", search: 13900, social: 7400, video: 5500},
];

const rising = [12, 18, 15, 24, 21, 27, 25, 31, 29, 36, 34, 41].map((value) => ({value}));
const falling = [40, 36, 38, 31, 33, 28, 30, 24, 25, 19, 21, 15].map((value) => ({value}));
const steady = [22, 26, 23, 29, 27, 25, 31, 28, 33, 30, 35, 34].map((value) => ({value}));

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const toNumber = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));

const formatThousands = (value: number) => (value === 0 ? "0" : `${value / 1000}k`);

const formatDollarThousands = (value: number) => `$${value / 1000}k`;

/** Same frame as the Pro demo pages: centred, full width, 24px padding (40px from `sm`). */
const DemoFrame = ({children}: {children: React.ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10">{children}</div>
);

const LegendItem = ({color, label}: {color: string; label: string}) => (
  <div className="flex items-center gap-1.5">
    <span className="size-3 rounded-full" style={{backgroundColor: color}} />
    <span className="text-xs text-muted">{label}</span>
  </div>
);

/** Vertical gradient used under every area: strong at the line, almost transparent at the base. */
const AreaGradient = ({
  color,
  from = 0.2,
  id,
  to = 0.02,
}: {
  color: string;
  from?: number;
  id: string;
  to?: number;
}) => (
  <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
    <stop offset="0%" stopColor={color} stopOpacity={from} />
    <stop offset="100%" stopColor={color} stopOpacity={to} />
  </linearGradient>
);

/** `useId` output is not a valid url(#id) fragment everywhere; keep it to safe characters. */
const useGradientId = (name: string) => `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    height: {control: {max: 480, min: 120, step: 10, type: "range"}},
    width: {control: "text"},
  },
  args: {data: netRevenue, height: 200},
  component: AreaChart,
  decorators: [
    (Story) => (
      <DemoFrame>
        <Story />
      </DemoFrame>
    ),
  ],
  parameters: {layout: "fullscreen"},
  title: "Pro/Charts/AreaChart",
} satisfies Meta<typeof AreaChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
const DefaultDemo = (args: AreaChart["Props"]) => {
  const fillId = useGradientId("net-revenue-fill");

  return (
    <Card className="w-full max-w-[520px] rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Net Revenue</Card.Title>
      </Card.Header>
      <Card.Content>
        <AreaChart {...args}>
          <defs>
            <AreaGradient color="var(--chart-3)" id={fillId} />
          </defs>
          <AreaChart.Grid vertical={false} />
          <AreaChart.XAxis dataKey="month" tickMargin={8} />
          <AreaChart.YAxis tickFormatter={formatDollarThousands} width={40} />
          <AreaChart.Tooltip
            content={
              <AreaChart.TooltipContent
                valueFormatter={(value) => `$${toNumber(value).toLocaleString("en-US")}`}
              />
            }
          />
          <AreaChart.Area
            dataKey="revenue"
            fill={`url(#${fillId})`}
            name="Net revenue"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </Card.Content>
    </Card>
  );
};

export const Default: Story = {
  render: (args) => <DefaultDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Multi Area
 * -----------------------------------------------------------------------------------------------*/
const MultiAreaDemo = () => {
  const desktopId = useGradientId("desktop-fill");
  const mobileId = useGradientId("mobile-fill");

  return (
    <Card className="w-full max-w-[520px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Visits by Device</Card.Title>
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-3)" label="Desktop" />
          <LegendItem color="var(--chart-1)" label="Mobile" />
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">184,920</span>
          <span className="text-xs text-muted">Visits</span>
        </div>
        <AreaChart data={deviceVisits} height={200}>
          <defs>
            <AreaGradient color="var(--chart-3)" id={desktopId} />
            <AreaGradient color="var(--chart-1)" id={mobileId} />
          </defs>
          <AreaChart.Grid vertical={false} />
          <AreaChart.XAxis dataKey="month" tickMargin={8} />
          <AreaChart.YAxis tickFormatter={formatThousands} width={30} />
          <AreaChart.Tooltip content={<AreaChart.TooltipContent />} />
          <AreaChart.Area
            dataKey="desktop"
            fill={`url(#${desktopId})`}
            name="Desktop"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <AreaChart.Area
            dataKey="mobile"
            fill={`url(#${mobileId})`}
            name="Mobile"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </Card.Content>
    </Card>
  );
};

export const MultiArea: Story = {
  render: () => <MultiAreaDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Stacked
 * -----------------------------------------------------------------------------------------------*/
const stackedSeries = [
  {color: "var(--chart-4)", key: "search", label: "Search"},
  {color: "var(--chart-3)", key: "social", label: "Social"},
  {color: "var(--chart-2)", key: "video", label: "Video"},
  {color: "var(--chart-1)", key: "email", label: "Email"},
] as const;

const StackedDemo = () => {
  const baseId = useGradientId("stacked");

  return (
    <Card className="w-full max-w-[600px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Acquisition Channels</Card.Title>
        <div className="flex items-center gap-3">
          {stackedSeries.map((series) => (
            <LegendItem key={series.key} color={series.color} label={series.label} />
          ))}
        </div>
      </Card.Header>
      <Card.Content>
        <AreaChart data={channelMix} height={240}>
          <defs>
            {stackedSeries.map((series) => (
              <AreaGradient
                key={series.key}
                color={series.color}
                from={0.4}
                id={`${baseId}-${series.key}`}
                to={0.1}
              />
            ))}
          </defs>
          <AreaChart.Grid vertical={false} />
          <AreaChart.XAxis dataKey="month" tickMargin={8} />
          <AreaChart.YAxis tickFormatter={formatThousands} width={30} />
          <AreaChart.Tooltip content={<AreaChart.TooltipContent indicator="line" />} />
          {stackedSeries.map((series) => (
            <AreaChart.Area
              key={series.key}
              dataKey={series.key}
              fill={`url(#${baseId}-${series.key})`}
              name={series.label}
              stackId="channels"
              stroke={series.color}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </AreaChart>
      </Card.Content>
    </Card>
  );
};

export const Stacked: Story = {
  render: () => <StackedDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Sparkline
 * -----------------------------------------------------------------------------------------------*/
const SparklineItem = ({
  color,
  data,
  label,
}: {
  color: string;
  data: Array<{value: number}>;
  label: string;
}) => {
  const fillId = useGradientId("sparkline-fill");

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <div>
        <AreaChart data={data} height={48} margin={{bottom: 0, left: 0, right: 0, top: 2}}>
          <defs>
            <AreaGradient color={color} id={fillId} />
          </defs>
          <AreaChart.Area
            dataKey="value"
            fill={`url(#${fillId})`}
            stroke={color}
            strokeWidth={1.5}
            type="monotone"
          />
        </AreaChart>
      </div>
    </div>
  );
};

export const Sparkline: Story = {
  render: () => (
    <div className="flex w-full items-center gap-6">
      <SparklineItem color="var(--color-success)" data={rising} label="Orders" />
      <SparklineItem color="var(--color-danger)" data={falling} label="Refunds" />
      <SparklineItem color="var(--chart-3)" data={steady} label="Sessions" />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * KPI With Area Chart
 * -----------------------------------------------------------------------------------------------*/
const KPIArea = ({color, data}: {color: string; data: Array<{value: number}>}) => {
  const fillId = useGradientId("kpi-area-fill");

  return (
    <div className="min-w-0">
      <AreaChart data={data} height={70} margin={{bottom: 0, left: 0, right: 0, top: 4}}>
        <defs>
          <AreaGradient color={color} id={fillId} />
        </defs>
        <AreaChart.Area
          dataKey="value"
          fill={`url(#${fillId})`}
          stroke={color}
          strokeWidth={1.5}
          type="monotone"
        />
      </AreaChart>
    </div>
  );
};

export const KPIWithAreaChart: Story = {
  name: "KPI With Area Chart",
  render: () => (
    <div className="grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <KPI>
        <KPI.Header>
          <KPI.Title>Gross Bookings</KPI.Title>
        </KPI.Header>
        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
          <div className="flex flex-col gap-1">
            <KPI.Value
              className="text-3xl"
              currency="USD"
              maximumFractionDigits={0}
              style="currency"
              value={164280}
            />
            <TrendChip size="sm" trend="up" variant="tertiary">
              4.8%
              <TrendChip.Suffix>past 30d</TrendChip.Suffix>
            </TrendChip>
          </div>
          <KPIArea color="var(--chart-3)" data={steady} />
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Cart Abandonment</KPI.Title>
        </KPI.Header>
        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
          <div className="flex flex-col gap-1">
            <KPI.Value
              className="text-3xl"
              maximumFractionDigits={1}
              style="percent"
              value={0.371}
            />
            <TrendChip size="sm" trend="down" variant="tertiary">
              2.6%
              <TrendChip.Suffix>vs last wk</TrendChip.Suffix>
            </TrendChip>
          </div>
          <KPIArea color="var(--color-danger)" data={falling} />
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Subscribers</KPI.Title>
        </KPI.Header>
        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
          <div className="flex flex-col gap-1">
            <KPI.Value className="text-3xl" notation="compact" value={71400} />
            <TrendChip size="sm" trend="up" variant="tertiary">
              12.4%
              <TrendChip.Suffix>last month</TrendChip.Suffix>
            </TrendChip>
          </div>
          <KPIArea color="var(--color-success)" data={rising} />
        </KPI.Content>
      </KPI>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom Tooltip
 * -----------------------------------------------------------------------------------------------*/
const TooltipWithTotal = ({active, label, payload}: TooltipContentProps) => {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, item) => sum + toNumber(item.value), 0);

  return (
    <ChartTooltip indicator="line">
      <ChartTooltip.Header>{label}</ChartTooltip.Header>
      {payload.map((item) => (
        <ChartTooltip.Item key={String(item.dataKey)}>
          <ChartTooltip.Indicator color={item.color} />
          <ChartTooltip.Label>{item.name}</ChartTooltip.Label>
          <ChartTooltip.Value>{toNumber(item.value).toLocaleString("en-US")}</ChartTooltip.Value>
        </ChartTooltip.Item>
      ))}
      <div className="mt-1 flex items-center justify-between border-t border-separator pt-1.5">
        <span className="text-xs font-medium text-muted">All devices</span>
        <span className="text-xs font-semibold text-foreground">
          {total.toLocaleString("en-US")}
        </span>
      </div>
    </ChartTooltip>
  );
};

const CustomTooltipDemo = () => {
  const desktopId = useGradientId("custom-desktop");
  const mobileId = useGradientId("custom-mobile");

  return (
    <Card className="w-full max-w-[520px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Visitors</Card.Title>
        <div className="flex items-center gap-3">
          <LegendItem color="var(--chart-3)" label="Desktop" />
          <LegendItem color="var(--chart-1)" label="Mobile" />
        </div>
      </Card.Header>
      <Card.Content>
        <AreaChart data={deviceVisits} height={200}>
          <defs>
            <AreaGradient color="var(--chart-3)" id={desktopId} />
            <AreaGradient color="var(--chart-1)" id={mobileId} />
          </defs>
          <AreaChart.Grid vertical={false} />
          <AreaChart.XAxis dataKey="month" tickMargin={8} />
          <AreaChart.YAxis tickFormatter={formatThousands} width={30} />
          <AreaChart.Tooltip content={TooltipWithTotal} />
          <AreaChart.Area
            dataKey="desktop"
            fill={`url(#${desktopId})`}
            name="Desktop"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <AreaChart.Area
            dataKey="mobile"
            fill={`url(#${mobileId})`}
            name="Mobile"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </Card.Content>
    </Card>
  );
};

export const CustomTooltip: Story = {
  render: () => <CustomTooltipDemo />,
};
