import type {ChartTooltipPayloadItem} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import React from "react";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis} from "recharts";

import {ChartTooltip} from "./index";

const meta = {
  argTypes: {
    active: {control: "boolean"},
    indicator: {control: {type: "select"}, options: ["dot", "line"]},
  },
  component: ChartTooltip,
  parameters: {layout: "centered"},
  title: "Pro/Charts/ChartTooltip",
} satisfies Meta<typeof ChartTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Usage - manual composition
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {active: true, indicator: "dot"},
  render: (args) => (
    <ChartTooltip {...args}>
      <ChartTooltip.Header>April</ChartTooltip.Header>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color="var(--chart-3)" />
        <ChartTooltip.Label>Subscriptions</ChartTooltip.Label>
        <ChartTooltip.Value>$9,850</ChartTooltip.Value>
      </ChartTooltip.Item>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color="var(--chart-1)" />
        <ChartTooltip.Label>Refunds</ChartTooltip.Label>
        <ChartTooltip.Value>$1,320</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Auto Content - ChartTooltip.Content renders a Recharts-shaped payload
 * -----------------------------------------------------------------------------------------------*/
const signupsPayload: ChartTooltipPayloadItem[] = [
  {color: "var(--chart-3)", dataKey: "trial", name: "Trials", value: 4210},
  {color: "var(--chart-1)", dataKey: "paid", name: "Paid", value: 1385},
];

const channelPayload: ChartTooltipPayloadItem[] = [
  {color: "var(--chart-3)", dataKey: "search", name: "Search", value: 31800},
  {color: "var(--chart-2)", dataKey: "social", name: "Social", value: 12650},
  {color: "var(--chart-1)", dataKey: "email", name: "Newsletter", value: 6900},
];

export const AutoContent: Story = {
  render: () => (
    <div className="flex gap-6">
      <ChartTooltip.Content active label="September" payload={signupsPayload} />
      <ChartTooltip.Content active indicator="line" label="H2 2025" payload={channelPayload} />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Line Indicator
 * -----------------------------------------------------------------------------------------------*/
export const LineIndicator: Story = {
  render: () => (
    <ChartTooltip indicator="line">
      <ChartTooltip.Header>Week 32</ChartTooltip.Header>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color="var(--chart-3)" />
        <ChartTooltip.Label>Desktop</ChartTooltip.Label>
        <ChartTooltip.Value>27,480</ChartTooltip.Value>
      </ChartTooltip.Item>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color="var(--chart-2)" />
        <ChartTooltip.Label>Mobile</ChartTooltip.Label>
        <ChartTooltip.Value>19,060</ChartTooltip.Value>
      </ChartTooltip.Item>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color="var(--chart-1)" />
        <ChartTooltip.Label>Tablet</ChartTooltip.Label>
        <ChartTooltip.Value>2,740</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * No Header
 * -----------------------------------------------------------------------------------------------*/
export const NoHeader: Story = {
  render: () => (
    <ChartTooltip>
      <ChartTooltip.Item>
        <ChartTooltip.Indicator color="var(--chart-3)" />
        <ChartTooltip.Label>Orders</ChartTooltip.Label>
        <ChartTooltip.Value>612</ChartTooltip.Value>
      </ChartTooltip.Item>
    </ChartTooltip>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Chart Colors - the accent-derived palette tokens
 * -----------------------------------------------------------------------------------------------*/
const palette = [
  {note: "Deepest", token: "--chart-1"},
  {note: "Deep", token: "--chart-2"},
  {note: "Accent", token: "--chart-3"},
  {note: "Soft", token: "--chart-4"},
];

export const ChartColors: Story = {
  render: () => (
    <div className="flex gap-6">
      {(["dot", "line"] as const).map((indicator) => (
        <ChartTooltip key={indicator} indicator={indicator}>
          <ChartTooltip.Header>
            {indicator === "dot" ? "Chart Palette" : "Line Palette"}
          </ChartTooltip.Header>
          {palette.map(({note, token}) => (
            <ChartTooltip.Item key={token}>
              <ChartTooltip.Indicator color={`var(${token})`} />
              <ChartTooltip.Label>{token.slice(2)}</ChartTooltip.Label>
              <ChartTooltip.Value>{note}</ChartTooltip.Value>
            </ChartTooltip.Item>
          ))}
        </ChartTooltip>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Inactive - active={false} renders nothing
 * -----------------------------------------------------------------------------------------------*/
export const Inactive: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        This tooltip has active set to false, so it does not render at all:
      </p>
      <div className="flex h-16 items-center justify-center rounded-lg bg-default">
        <ChartTooltip active={false}>
          <ChartTooltip.Header>Hidden</ChartTooltip.Header>
          <ChartTooltip.Item>
            <ChartTooltip.Indicator color="var(--chart-3)" />
            <ChartTooltip.Label>Visitors</ChartTooltip.Label>
            <ChartTooltip.Value>1,024</ChartTooltip.Value>
          </ChartTooltip.Item>
        </ChartTooltip>
        <span className="text-xs text-muted">(nothing rendered here)</span>
      </div>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom Formatters - labelFormatter + valueFormatter
 * -----------------------------------------------------------------------------------------------*/
const usd = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

const longDate = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const holdingsPayload: ChartTooltipPayloadItem[] = [
  {color: "var(--chart-3)", dataKey: "fund", name: "Growth Fund", value: 18342.57},
  {color: "var(--chart-2)", dataKey: "index", name: "Index", value: 16900},
];

export const CustomFormatters: Story = {
  render: () => (
    <ChartTooltip.Content
      active
      label="2025-03-08"
      labelFormatter={(label) => longDate.format(new Date(String(label)))}
      payload={holdingsPayload}
      valueFormatter={(value) => usd.format(Number(value))}
    />
  ),
};

/* -------------------------------------------------------------------------------------------------
 * In a Recharts chart (hover or focus the chart and use the arrow keys)
 * -----------------------------------------------------------------------------------------------*/
const traffic = [
  {day: "Mon", returning: 1480, visitors: 2310},
  {day: "Tue", returning: 1720, visitors: 2840},
  {day: "Wed", returning: 1610, visitors: 2560},
  {day: "Thu", returning: 1950, visitors: 3120},
  {day: "Fri", returning: 2230, visitors: 3480},
  {day: "Sat", returning: 1390, visitors: 2190},
  {day: "Sun", returning: 1260, visitors: 1980},
];

const compact = new Intl.NumberFormat("en-US");

export const WithRecharts: Story = {
  args: {indicator: "dot"},
  render: (args) => (
    <div className="w-[480px]">
      <ResponsiveContainer height={240} width="100%">
        <AreaChart data={traffic} margin={{bottom: 0, left: 8, right: 8, top: 8}}>
          <CartesianGrid stroke="var(--separator)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="day"
            fontSize={11}
            padding={{left: 16, right: 16}}
            stroke="var(--muted)"
            tickLine={false}
          />
          <Tooltip
            cursor={{stroke: "var(--muted)", strokeDasharray: "4 4"}}
            content={
              <ChartTooltip.Content
                indicator={args.indicator}
                valueFormatter={(value) => compact.format(Number(value))}
              />
            }
          />
          <Area
            dataKey="visitors"
            fill="var(--chart-3)"
            fillOpacity={0.15}
            name="Visitors"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="returning"
            fill="var(--chart-1)"
            fillOpacity={0.15}
            name="Returning"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  ),
};
