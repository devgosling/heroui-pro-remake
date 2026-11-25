import type {Meta, StoryObj} from "@storybook/react";

import {Link} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";
import {Tooltip} from "recharts";

import {ChartTooltip} from "../chart-tooltip";
import {TrendChip} from "../trend-chip";

import {KPI} from "./index";

const meta = {
  component: KPI,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/KPI",
} satisfies Meta<typeof KPI>;

export default meta;

type Story = StoryObj<typeof meta>;

const Grid = ({children, cols = "lg:grid-cols-3"}: {children: React.ReactNode; cols?: string}) => (
  <div className={`grid w-[900px] grid-cols-1 gap-3 rounded-2xl p-6 sm:grid-cols-2 ${cols}`}>
    {children}
  </div>
);

const series = (values: Array<number | null>) => values.map((value) => ({value}));

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const Default: Story = {
  render: () => (
    <Grid cols="lg:grid-cols-4">
      <KPI>
        <KPI.Header>
          <KPI.Title>Gross Sales</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={184320} />
          <KPI.Trend trend="up">+12%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Operating Costs</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={63210} />
          <KPI.Trend trend="down">+8.4%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Net Margin</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={121110} />
          <KPI.Trend trend="neutral">0.0%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>New Signups</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value value={2318} />
          <KPI.Trend trend="up">+2.4%</KPI.Trend>
        </KPI.Content>
      </KPI>
    </Grid>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Grid>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="success">
            <Icon icon="gravity-ui:persons" />
          </KPI.Icon>
          <KPI.Title>Active Members</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value value={8412} />
          <KPI.Trend trend="up">+21%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="warning">
            <Icon icon="gravity-ui:circle-dollar" />
          </KPI.Icon>
          <KPI.Title>Refunds</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={9310} />
          <KPI.Trend trend="neutral">0.0%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="danger">
            <Icon icon="gravity-ui:tag" />
          </KPI.Icon>
          <KPI.Title>Discounts Used</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={4120} />
          <KPI.Trend trend="down">-6.1%</KPI.Trend>
        </KPI.Content>
      </KPI>
    </Grid>
  ),
};

export const WithProgress: Story = {
  render: () => (
    <Grid>
      {[
        {status: "success" as const, title: "CPU Usage", value: 0.41},
        {status: "danger" as const, title: "Disk Usage", value: 0.94},
        {status: "warning" as const, title: "Memory Usage", value: 0.72},
      ].map((item) => (
        <KPI key={item.title}>
          <KPI.Header>
            <KPI.Icon status={item.status}>
              <Icon icon="gravity-ui:cpu" />
            </KPI.Icon>
            <KPI.Title>{item.title}</KPI.Title>
          </KPI.Header>
          <KPI.Content>
            <KPI.Value style="percent" value={item.value} />
            <KPI.Progress status={item.status} value={item.value * 100} />
          </KPI.Content>
        </KPI>
      ))}
    </Grid>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Grid>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="success">
            <Icon icon="gravity-ui:shopping-cart" />
          </KPI.Icon>
          <KPI.Title>Checkout Rate</KPI.Title>
        </KPI.Header>
        <KPI.Actions />
        <KPI.Content>
          <KPI.Value maximumFractionDigits={1} style="percent" value={0.052} />
          <KPI.Trend trend="up">+0.9%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="danger">
            <Icon icon="gravity-ui:arrow-uturn-ccw-left" />
          </KPI.Icon>
          <KPI.Title>Cart Abandonment</KPI.Title>
        </KPI.Header>
        <KPI.Actions />
        <KPI.Content>
          <KPI.Value maximumFractionDigits={1} style="percent" value={0.684} />
          <KPI.Trend trend="down">-2.2%</KPI.Trend>
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="warning">
            <Icon icon="gravity-ui:stopwatch" />
          </KPI.Icon>
          <KPI.Title>Avg. Response (ms)</KPI.Title>
        </KPI.Header>
        <KPI.Actions />
        <KPI.Content>
          <KPI.Value value={412} />
          <KPI.Progress status="warning" value={41} />
        </KPI.Content>
      </KPI>
    </Grid>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Grid cols="lg:grid-cols-2">
      <KPI>
        <KPI.Header>
          <KPI.Icon status="success">
            <Icon icon="gravity-ui:envelope" />
          </KPI.Icon>
          <KPI.Title>Newsletter Readers</KPI.Title>
          <KPI.Trend className="ml-auto" trend="up">
            +318
          </KPI.Trend>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value value={52984} />
        </KPI.Content>
        <KPI.Footer>
          <Link className="text-sm" href="#">
            See audience
          </Link>
        </KPI.Footer>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="warning">
            <Icon icon="gravity-ui:receipt" />
          </KPI.Icon>
          <KPI.Title>Recurring Revenue</KPI.Title>
          <KPI.Trend className="ml-auto" trend="up">
            +9.7%
          </KPI.Trend>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={38412} />
        </KPI.Content>
        <KPI.Separator />
        <KPI.Footer>
          <Link className="text-sm" href="#">
            Open billing
          </Link>
        </KPI.Footer>
      </KPI>
    </Grid>
  ),
};

export const WithChartBottom: Story = {
  render: () => (
    <Grid>
      <KPI>
        <KPI.Header>
          <KPI.Title>Gross Sales</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" maximumFractionDigits={0} style="currency" value={184320} />
          <KPI.Trend trend="up">+4.1%</KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-success)"
          data={series([31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 51])}
        />
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Northwind (NWD)</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value currency="USD" style="currency" value={27.84} />
          <KPI.Trend trend="down">-2.7%</KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-danger)"
          data={series([42, 41, 43, 39, 38, 36, 37, 34, 33, 31, 30, 28])}
        />
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Icon status="success">
            <Icon icon="gravity-ui:persons" />
          </KPI.Icon>
          <KPI.Title>Daily Visitors</KPI.Title>
        </KPI.Header>
        <KPI.Actions />
        <KPI.Content>
          <KPI.Value notation="compact" value={74210} />
          <KPI.Trend trend="neutral">8.2%</KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-accent)"
          data={series([12, 18, 15, 22, 19, 25, 21, 27, 24, 23, 28, 26])}
          height={60}
        />
      </KPI>
    </Grid>
  ),
};

export const WithChartInline: Story = {
  render: () => (
    <Grid cols="lg:grid-cols-2">
      {[
        {
          chart: "var(--color-accent)",
          data: [21, 23, 22, 26, 25, 28, 27, 30, 29, 33, 31, 35],
          suffix: "last 30d",
          title: "Link Clicks",
          trend: "up" as const,
          trendValue: "6.2%",
          value: 3914,
        },
        {
          chart: "var(--color-danger)",
          data: [61, 58, 60, 55, 57, 52, 54, 50, 48, 49, 45, 44],
          suffix: "vs last 7d",
          title: "Exit Rate",
          trend: "down" as const,
          trendValue: "4.3%",
          value: 0.381,
        },
      ].map((item) => (
        <KPI key={item.title}>
          <KPI.Header>
            <Icon className="size-4 text-muted" icon="gravity-ui:chart-line" />
            <KPI.Title>{item.title}</KPI.Title>
          </KPI.Header>
          <KPI.Content className="grid-cols-[1fr_1fr] items-end">
            <div className="flex flex-col gap-1">
              <KPI.Value
                className="text-3xl"
                maximumFractionDigits={1}
                style={item.value < 1 ? "percent" : "decimal"}
                value={item.value}
              />
              <div className="flex items-center gap-1.5">
                <TrendChip trend={item.trend} variant="tertiary">
                  {item.trendValue}
                  <TrendChip.Suffix>{item.suffix}</TrendChip.Suffix>
                </TrendChip>
              </div>
            </div>
            <KPI.Chart color={item.chart} data={series(item.data)} height={70} />
          </KPI.Content>
        </KPI>
      ))}
    </Grid>
  ),
};

export const WithChartTooltip: Story = {
  render: () => {
    const data = [
      9100, 9800, 9500, 11200, 10900, 12600, 13100, 12800, 14200, 14900, 14600, 16300,
    ].map((value, index) => ({month: months[index]!, value}));
    const usd = new Intl.NumberFormat("en-US", {
      currency: "USD",
      maximumFractionDigits: 0,
      style: "currency",
    });

    return (
      <div className="w-[420px] p-6">
        <KPI>
          <KPI.Header>
            <KPI.Icon status="success">
              <Icon icon="gravity-ui:circle-dollar" />
            </KPI.Icon>
            <KPI.Title>Monthly Bookings</KPI.Title>
          </KPI.Header>
          <KPI.Content className="grid-cols-[1fr_1fr] items-end">
            <div className="flex flex-col gap-1">
              <KPI.Value
                className="text-3xl"
                currency="USD"
                maximumFractionDigits={0}
                style="currency"
                value={16300}
              />
              <TrendChip trend="up" variant="tertiary">
                9.4%
                <TrendChip.Suffix>last 30d</TrendChip.Suffix>
              </TrendChip>
            </div>
            <KPI.Chart
              areaProps={{name: "Bookings"}}
              color="var(--color-success)"
              data={data}
              height={70}
              strokeWidth={1.5}
              tooltip={
                <Tooltip
                  content={
                    <ChartTooltip.Content
                      labelFormatter={(_, payload) => String(payload[0]?.payload?.["month"] ?? "")}
                      valueFormatter={(value) => usd.format(Number(value))}
                    />
                  }
                />
              }
            />
          </KPI.Content>
        </KPI>
      </div>
    );
  },
};

export const HandlingGaps: Story = {
  render: () => (
    <Grid cols="lg:grid-cols-2">
      <KPI>
        <KPI.Header>
          <KPI.Title>First Reply (connectNulls)</KPI.Title>
        </KPI.Header>
        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
          <KPI.Value className="text-3xl" style="unit" unit="minute" value={14} />
          <KPI.Chart
            connectNulls
            color="var(--color-success)"
            data={series([22, 20, 24, 18, 21, null, null, 17, 19, 16, 15, 14])}
            height={70}
            strokeWidth={1.5}
          />
        </KPI.Content>
      </KPI>
      <KPI>
        <KPI.Header>
          <KPI.Title>Resolution Time (gap)</KPI.Title>
        </KPI.Header>
        <KPI.Content className="grid-cols-[1fr_1fr] items-end">
          <KPI.Value className="text-3xl" style="unit" unit="minute" value={133} />
          <KPI.Chart
            color="var(--color-accent)"
            data={series([171, 165, 180, 158, 166, null, null, 149, 152, 141, 139, 133])}
            height={70}
            strokeWidth={1.5}
          />
        </KPI.Content>
      </KPI>
    </Grid>
  ),
};

export const CustomFade: Story = {
  render: () => (
    <div className="w-[320px] p-6">
      <KPI>
        <KPI.Header>
          <KPI.Title>Wide edge fade</KPI.Title>
        </KPI.Header>
        <KPI.Content>
          <KPI.Value value={1280} />
          <KPI.Trend trend="up">+3.0%</KPI.Trend>
        </KPI.Content>
        <KPI.Chart
          color="var(--color-accent)"
          data={series([5, 7, 6, 9, 8, 11, 10, 13, 12, 15])}
          style={{"--kpi-chart-fade": "30%"} as React.CSSProperties}
        />
      </KPI>
    </div>
  ),
};
