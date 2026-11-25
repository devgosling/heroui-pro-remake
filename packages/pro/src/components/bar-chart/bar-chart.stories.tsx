import type {Meta, StoryObj} from "@storybook/react";
import type {TooltipContentType} from "recharts";

import {Card, Chip} from "@heroui/react";
import React from "react";

import {ChartTooltip} from "../chart-tooltip";
import {KPI} from "../kpi";
import {TrendChip} from "../trend-chip";

import {BarChart} from "./index";

const meta = {
  argTypes: {
    height: {control: {max: 480, min: 120, step: 10, type: "range"}},
    layout: {control: {type: "select"}, options: ["horizontal", "vertical"]},
    width: {control: "text"},
  },
  component: BarChart,
  parameters: {layout: "centered"},
  title: "Pro/Charts/BarChart",
} satisfies Meta<typeof BarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const Frame = ({children}: {children: React.ReactNode}) => (
  <div className="flex w-[480px] max-w-full justify-center">{children}</div>
);

const LegendItem = ({
  color,
  label,
  swatch = "size-3",
}: {
  color: string;
  label: string;
  swatch?: string;
}) => (
  <div className="flex items-center gap-1.5">
    <span className={`${swatch} rounded-full`} style={{backgroundColor: color}} />
    <span className="text-xs text-muted">{label}</span>
  </div>
);

const toNumber = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0));

const formatCurrency = (value: unknown) => `$${toNumber(value).toLocaleString("en-US")}`;

const formatThousands = (value: number) => `$${(value / 1000).toFixed(0)}k`;

/* -------------------------------------------------------------------------------------------------
 * Data
 * -----------------------------------------------------------------------------------------------*/
const monthlyShipments = [
  {month: "Jan", parcels: 24},
  {month: "Feb", parcels: 31},
  {month: "Mar", parcels: 27},
  {month: "Apr", parcels: 42},
  {month: "May", parcels: 36},
  {month: "Jun", parcels: 48},
  {month: "Jul", parcels: 44},
  {month: "Aug", parcels: 51},
  {month: "Sep", parcels: 46},
  {month: "Oct", parcels: 58},
  {month: "Nov", parcels: 49},
  {month: "Dec", parcels: 55},
];

const regionalSales = [
  {central: 3100, month: "Jan", north: 4600, south: 3300},
  {central: 3500, month: "Feb", north: 5900, south: 4400},
  {central: 3400, month: "Mar", north: 4900, south: 3700},
  {central: 4700, month: "Apr", north: 6800, south: 5600},
  {central: 3900, month: "May", north: 6400, south: 5100},
  {central: 5400, month: "Jun", north: 8900, south: 5800},
];

const tierRevenue = [
  {basic: 3800, plus: 9200, quarter: "Q1", team: 10500},
  {basic: 5200, plus: 9800, quarter: "Q2", team: 13800},
  {basic: 6600, plus: 12400, quarter: "Q3", team: 16200},
  {basic: 7400, plus: 12900, quarter: "Q4", team: 20600},
];

const topCategories = [
  {category: "Sneakers", sold: 1830},
  {category: "Jackets", sold: 1540},
  {category: "Beanies", sold: 1210},
  {category: "Totes", sold: 980},
  {category: "Socks", sold: 760},
];

const dailySteps = [
  {day: "Mon", jog: 2300, run: 2100, walk: 1400},
  {day: "Tue", jog: 2900, run: 2600, walk: 1100},
  {day: "Wed", jog: 2100, run: 1700, walk: 1900},
  {day: "Thu", jog: 2600, run: 2000, walk: 1300},
  {day: "Fri", jog: 2400, run: 2300, walk: 1700},
  {day: "Sat", jog: 1800, run: 1500, walk: 2200},
  {day: "Sun", jog: 3100, run: 2200, walk: 1600},
];

const weeklySignups = [
  {current: 138, day: "Mon", previous: 104},
  {current: 171, day: "Tue", previous: 152},
  {current: 149, day: "Wed", previous: 163},
  {current: 214, day: "Thu", previous: 137},
  {current: 188, day: "Fri", previous: 171},
  {current: 96, day: "Sat", previous: 88},
  {current: 72, day: "Sun", previous: 79},
];

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {height: 200, layout: "horizontal"},
  render: (args) => (
    <Frame>
      <Card className="w-full max-w-[480px] rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div>
            <Card.Title className="text-base">Orders Shipped</Card.Title>
            <Card.Description className="text-xs text-muted">
              Parcels dispatched per month
            </Card.Description>
          </div>
          <Chip color="success" size="sm" variant="soft">
            <svg
              aria-hidden="true"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            9.4%
          </Chip>
        </Card.Header>
        <Card.Content>
          <BarChart {...args} data={monthlyShipments}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="month" tickMargin={8} />
            <BarChart.YAxis width={30} />
            <BarChart.Bar barSize={16} dataKey="parcels" fill="var(--accent)" radius={8} />
            <BarChart.Tooltip
              content={<BarChart.TooltipContent valueFormatter={(value) => `${value} parcels`} />}
            />
          </BarChart>
        </Card.Content>
      </Card>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Grouped
 * -----------------------------------------------------------------------------------------------*/
export const Grouped: Story = {
  render: () => (
    <Frame>
      <Card className="w-full max-w-[480px] rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className="text-base">Sales by Region</Card.Title>
          <div className="flex items-center gap-3">
            <LegendItem color="var(--chart-3)" label="North" />
            <LegendItem color="var(--chart-2)" label="Central" />
            <LegendItem color="var(--chart-1)" label="South" />
          </div>
        </Card.Header>
        <Card.Content>
          <BarChart data={regionalSales} height={220}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="month" tickMargin={8} />
            <BarChart.YAxis tickFormatter={formatThousands} width={40} />
            <BarChart.Bar
              barSize={10}
              dataKey="north"
              fill="var(--chart-3)"
              name="North"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Bar
              barSize={10}
              dataKey="central"
              fill="var(--chart-2)"
              name="Central"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Bar
              barSize={10}
              dataKey="south"
              fill="var(--chart-1)"
              name="South"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Tooltip
              content={<BarChart.TooltipContent valueFormatter={formatCurrency} />}
            />
          </BarChart>
        </Card.Content>
      </Card>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Stacked
 * -----------------------------------------------------------------------------------------------*/
export const Stacked: Story = {
  render: () => (
    <Frame>
      <Card className="w-full max-w-[480px] rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className="text-base">Revenue by Tier</Card.Title>
          <div className="flex items-center gap-3">
            <LegendItem color="var(--chart-4)" label="Team" />
            <LegendItem color="var(--chart-3)" label="Plus" />
            <LegendItem color="var(--chart-1)" label="Basic" />
          </div>
        </Card.Header>
        <Card.Content>
          <BarChart data={tierRevenue} height={220}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="quarter" tickMargin={8} />
            <BarChart.YAxis tickFormatter={formatThousands} width={40} />
            <BarChart.Bar
              barSize={32}
              dataKey="basic"
              fill="var(--chart-1)"
              name="Basic"
              stackId="revenue"
            />
            <BarChart.Bar
              barSize={32}
              dataKey="plus"
              fill="var(--chart-3)"
              name="Plus"
              stackId="revenue"
            />
            <BarChart.Bar
              barSize={32}
              dataKey="team"
              fill="var(--chart-4)"
              name="Team"
              radius={[4, 4, 0, 0]}
              stackId="revenue"
            />
            <BarChart.Tooltip
              content={<BarChart.TooltipContent indicator="line" valueFormatter={formatCurrency} />}
            />
          </BarChart>
        </Card.Content>
      </Card>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Horizontal
 * -----------------------------------------------------------------------------------------------*/
export const Horizontal: Story = {
  render: () => (
    <Frame>
      <Card className="w-full max-w-[420px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Best Sellers</Card.Title>
          <Card.Description className="text-xs text-muted">Items sold this season</Card.Description>
        </Card.Header>
        <Card.Content>
          <BarChart data={topCategories} height={220} layout="vertical">
            <BarChart.XAxis tickMargin={4} type="number" />
            <BarChart.YAxis dataKey="category" tickMargin={4} type="category" width={60} />
            <BarChart.Bar
              barSize={14}
              dataKey="sold"
              fill="var(--chart-3)"
              name="Items"
              radius={[0, 7, 7, 0]}
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        </Card.Content>
      </Card>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Horizontal Stacked
 * -----------------------------------------------------------------------------------------------*/
export const HorizontalStacked: Story = {
  render: () => (
    <Frame>
      <Card className="w-full max-w-[480px] rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div>
            <Card.Title className="text-base">Avg. Daily Steps</Card.Title>
            <div className="mt-1 text-2xl font-bold text-foreground">
              6,100/8,000 <span className="text-sm font-normal text-muted">steps</span>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          <BarChart
            data={dailySteps}
            height={280}
            layout="vertical"
            margin={{bottom: 0, left: 0, right: 0, top: 0}}
          >
            <BarChart.XAxis hide type="number" />
            <BarChart.YAxis dataKey="day" tickMargin={8} type="category" width={36} />
            <BarChart.Bar
              barSize={18}
              dataKey="walk"
              fill="var(--chart-1)"
              name="Walk"
              radius={[4, 0, 0, 4]}
              stackId="steps"
            />
            <BarChart.Bar
              barSize={18}
              dataKey="jog"
              fill="var(--chart-2)"
              name="Jog"
              stackId="steps"
            />
            <BarChart.Bar
              barSize={18}
              dataKey="run"
              fill="var(--chart-4)"
              name="Run"
              radius={[0, 4, 4, 0]}
              stackId="steps"
            />
            <BarChart.Tooltip
              content={
                <BarChart.TooltipContent
                  indicator="line"
                  valueFormatter={(value) => `${toNumber(value).toLocaleString("en-US")} steps`}
                />
              }
            />
          </BarChart>
          <div className="flex items-center justify-center gap-4">
            <LegendItem color="var(--chart-1)" label="Walk" swatch="size-2.5" />
            <LegendItem color="var(--chart-2)" label="Jog" swatch="size-2.5" />
            <LegendItem color="var(--chart-4)" label="Run" swatch="size-2.5" />
          </div>
        </Card.Content>
      </Card>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Comparison
 * -----------------------------------------------------------------------------------------------*/
export const Comparison: Story = {
  render: () => (
    <Frame>
      <Card className="w-full max-w-[480px] rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <div>
            <Card.Title className="text-base">Daily Signups</Card.Title>
            <Card.Description className="text-xs text-muted">
              Current vs previous week
            </Card.Description>
          </div>
          <div className="flex items-center gap-3">
            <LegendItem color="var(--chart-3)" label="Current" />
            <LegendItem color="var(--chart-1)" label="Previous" />
          </div>
        </Card.Header>
        <Card.Content>
          <BarChart data={weeklySignups} height={200}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="day" tickMargin={8} />
            <BarChart.YAxis width={30} />
            <BarChart.Bar
              barSize={12}
              dataKey="current"
              fill="var(--chart-3)"
              name="Current"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Bar
              barSize={12}
              dataKey="previous"
              fill="var(--chart-1)"
              name="Previous"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        </Card.Content>
      </Card>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * KPI With Bar Chart
 * -----------------------------------------------------------------------------------------------*/
export const KPIWithBarChart: Story = {
  name: "KPI With Bar Chart",
  render: () => (
    <Frame>
      <KPI className="w-full max-w-[400px]">
        <KPI.Header>
          <KPI.Title>Monthly Bookings</KPI.Title>
        </KPI.Header>
        <KPI.Content className="flex flex-col gap-3">
          <div className="flex gap-3 self-start">
            <KPI.Value className="text-3xl" value={312} />
            <TrendChip trend="up" variant="tertiary">
              4.1%
              <TrendChip.Suffix>last 30d</TrendChip.Suffix>
            </TrendChip>
          </div>
          <BarChart data={monthlyShipments} height={160}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="month" tickMargin={8} />
            <BarChart.Bar barSize={16} dataKey="parcels" fill="var(--accent)" radius={8} />
            <BarChart.Tooltip content={<BarChart.TooltipContent />} />
          </BarChart>
        </KPI.Content>
      </KPI>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom Tooltip
 * -----------------------------------------------------------------------------------------------*/
const RegionTooltip: TooltipContentType = ({active, label, payload}) => {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, entry) => sum + toNumber(entry.value), 0);

  return (
    <ChartTooltip>
      <ChartTooltip.Header>{label}</ChartTooltip.Header>
      {payload.map((entry) => (
        <ChartTooltip.Item key={String(entry.dataKey)}>
          <ChartTooltip.Indicator color={entry.color} />
          <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
          <ChartTooltip.Value>{formatCurrency(entry.value)}</ChartTooltip.Value>
        </ChartTooltip.Item>
      ))}
      <div className="mt-1 flex items-center justify-between border-t border-separator pt-1.5">
        <span className="text-xs font-medium text-muted">Total</span>
        <span className="text-xs font-semibold text-foreground">{formatCurrency(total)}</span>
      </div>
    </ChartTooltip>
  );
};

export const CustomTooltip: Story = {
  render: () => (
    <Frame>
      <Card className="w-full max-w-[480px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Sales by Region</Card.Title>
        </Card.Header>
        <Card.Content>
          <BarChart data={regionalSales} height={220}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="month" tickMargin={8} />
            <BarChart.YAxis tickFormatter={formatThousands} width={40} />
            <BarChart.Bar
              barSize={10}
              dataKey="north"
              fill="var(--chart-3)"
              name="North"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Bar
              barSize={10}
              dataKey="central"
              fill="var(--chart-2)"
              name="Central"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Bar
              barSize={10}
              dataKey="south"
              fill="var(--chart-1)"
              name="South"
              radius={[4, 4, 0, 0]}
            />
            <BarChart.Tooltip content={RegionTooltip} />
          </BarChart>
        </Card.Content>
      </Card>
    </Frame>
  ),
};
