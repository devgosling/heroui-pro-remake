import type {Meta, StoryObj} from "@storybook/react";

import {Button, ProgressCircle, Table} from "@heroui/react";
import React from "react";

import {AreaChart} from "../area-chart";
import {BarChart} from "../bar-chart";
import {KPI} from "../kpi";
import {KPIGroup} from "../kpi-group";
import {LineChart} from "../line-chart";
import {PieChart} from "../pie-chart";
import {TrendChip} from "../trend-chip";

import {Widget} from "./index";

const meta = {
  argTypes: {
    className: {control: "text"},
  },
  component: Widget,
  /*
   * Recharts measures axis labels once and caches the widths. Wait for the theme font, so the
   * first measurement uses it rather than the system fallback; otherwise the axes get too many
   * ticks and the last label is clipped.
   */
  loaders: [
    async () => {
      try {
        await document.fonts.load(`10px ${getComputedStyle(document.body).fontFamily}`);
      } catch {
        // Font loading is best effort; the story still renders with the fallback font.
      }

      return {};
    },
  ],
  parameters: {layout: "fullscreen"},
  title: "Pro/DataDisplay/Widget",
} satisfies Meta<typeof Widget>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
/** Mirrors the demo page frame: content centred with a 24px gutter. */
const DemoFrame = ({children}: {children: React.ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6">{children}</div>
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic pseudo-random sequence (mulberry32), so every load renders the same chart. */
const seeded = (seed: number) => {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** One row per day of a 30-day month, keyed by ISO date (`2026-04-01`). */
const dailyRows = (month: number, build: (day: number) => Record<string, number>) =>
  Array.from({length: 30}, (_, index) => ({
    date: `2026-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
    ...build(index),
  }));

/** Axis label for an ISO date: `2026-04-14` -> `04/14` (the tooltip keeps the full date). */
const monthDay = (value: string) => value.slice(5).replace("-", "/");

const thousands = (value: number) => (value === 0 ? "0" : `${Math.round(value / 1000)}k`);
/** Grouping separators in the viewer's locale. */
const withSeparators = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString() : String(value ?? "");

/* -------------------------------------------------------------------------------------------------
 * Default (line chart with a two-entry legend)
 * -----------------------------------------------------------------------------------------------*/
const apiCalls = (() => {
  const random = seeded(17);

  return dailyRows(4, (day) => ({
    reads: Math.round(52000 + day * 1900 + (random() - 0.5) * 30000),
    writes: Math.round(21000 + day * 650 + (random() - 0.5) * 14000),
  }));
})();

export const Default: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[520px]">
        <Widget.Header>
          <Widget.Title>API Calls</Widget.Title>
          <Widget.Legend>
            <Widget.LegendItem color="var(--chart-4)">Reads</Widget.LegendItem>
            <Widget.LegendItem color="var(--chart-1)">Writes</Widget.LegendItem>
          </Widget.Legend>
        </Widget.Header>
        <Widget.Content>
          <LineChart data={apiCalls} height={220}>
            <LineChart.Grid vertical={false} />
            <LineChart.XAxis dataKey="date" tickFormatter={monthDay} tickMargin={8} />
            <LineChart.YAxis tickCount={5} tickFormatter={thousands} width={40} />
            <LineChart.Line
              dataKey="reads"
              dot={false}
              name="Reads"
              stroke="var(--chart-4)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Line
              dataKey="writes"
              dot={false}
              name="Writes"
              stroke="var(--chart-1)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Tooltip
              content={<LineChart.TooltipContent valueFormatter={withSeparators} />}
            />
          </LineChart>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Dashboard grid (stats row, area, line and bar widgets)
 * -----------------------------------------------------------------------------------------------*/
const overviewStats = [
  {change: "9.8%", label: "Bookings", trend: "up" as const, value: "$184K"},
  {change: "6.1%", label: "Check-ins", trend: "up" as const, value: "2,947"},
  {change: "2.7%", label: "Guests", trend: "up" as const, value: "6,315"},
  {change: "0.9%", label: "Cancellations", trend: "down" as const, value: "4.6%"},
];

const bookingsByMonth = MONTHS.map((month, index) => ({
  bookings: [4100, 5200, 4700, 6300, 5800, 7400, 6900, 8600, 8100, 9400, 10200, 11300][index]!,
  month,
}));

const channelsByMonth = MONTHS.slice(0, 6).map((month, index) => ({
  direct: [3100, 4300, 5200, 6800, 7600, 9100][index]!,
  month,
  partner: [1800, 2600, 3900, 4400, 5900, 6700][index]!,
}));

const nightsByMonth = MONTHS.map((month, index) => ({
  month,
  nights: [24, 31, 28, 39, 44, 52, 57, 49, 41, 36, 29, 47][index]!,
}));

export const DashboardGrid: Story = {
  render: (args) => (
    <DemoFrame>
      <div className="grid w-full max-w-[960px] grid-cols-1 gap-3 sm:grid-cols-2">
        <Widget {...args} className="sm:col-span-2">
          <Widget.Header>
            <Widget.Title>Summary</Widget.Title>
          </Widget.Header>
          <Widget.Content className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {overviewStats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-foreground">{stat.value}</span>
                  <TrendChip size="sm" trend={stat.trend}>
                    {stat.change}
                  </TrendChip>
                </div>
              </div>
            ))}
          </Widget.Content>
        </Widget>

        <Widget {...args}>
          <Widget.Header>
            <Widget.Title>Bookings</Widget.Title>
            <TrendChip size="sm" trend="up" variant="tertiary">
              9.8%
            </TrendChip>
          </Widget.Header>
          <Widget.Content>
            <AreaChart data={bookingsByMonth} height={180}>
              <defs>
                <linearGradient id="widget-bookings-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <AreaChart.Grid vertical={false} />
              <AreaChart.XAxis dataKey="month" tickMargin={8} />
              <AreaChart.YAxis tickFormatter={(value: number) => `$${value / 1000}k`} width={40} />
              {/* No `name` and no value formatter: the tooltip shows the data key and raw value, as in Pro. */}
              <AreaChart.Area
                dataKey="bookings"
                fill="url(#widget-bookings-fill)"
                stroke="var(--chart-3)"
                strokeWidth={2}
                type="monotone"
              />
              <AreaChart.Tooltip content={<AreaChart.TooltipContent />} />
            </AreaChart>
          </Widget.Content>
        </Widget>

        <Widget {...args}>
          <Widget.Header>
            <Widget.Title>Channels</Widget.Title>
            <Widget.Legend>
              <Widget.LegendItem color="var(--chart-3)">Direct</Widget.LegendItem>
              <Widget.LegendItem color="var(--chart-1)">Partner</Widget.LegendItem>
            </Widget.Legend>
          </Widget.Header>
          <Widget.Content>
            <LineChart data={channelsByMonth} height={180}>
              <LineChart.Grid vertical={false} />
              <LineChart.XAxis dataKey="month" tickMargin={8} />
              <LineChart.YAxis tickFormatter={thousands} width={30} />
              <LineChart.Line
                dataKey="direct"
                dot={false}
                name="Direct"
                stroke="var(--chart-3)"
                strokeWidth={2}
                type="monotone"
              />
              <LineChart.Line
                dataKey="partner"
                dot={false}
                name="Partner"
                stroke="var(--chart-1)"
                strokeWidth={2}
                type="monotone"
              />
              <LineChart.Tooltip content={<LineChart.TooltipContent />} />
            </LineChart>
          </Widget.Content>
        </Widget>

        <Widget {...args} className="sm:col-span-2">
          <Widget.Header>
            <Widget.Title>Nights Booked</Widget.Title>
            <Widget.Description>Average per room, Jan to Dec 2025</Widget.Description>
          </Widget.Header>
          <Widget.Content>
            {/* Fixed 20px pill bars; Recharts narrows them to 90% of the band when it gets tighter. */}
            <BarChart data={nightsByMonth} height={180}>
              <BarChart.Grid vertical={false} />
              <BarChart.XAxis dataKey="month" tickMargin={8} />
              <BarChart.YAxis width={30} />
              <BarChart.Bar
                barSize={20}
                dataKey="nights"
                fill="var(--accent)"
                name="Nights"
                radius={10}
              />
              <BarChart.Tooltip
                content={<BarChart.TooltipContent valueFormatter={(value) => `${value} nights`} />}
              />
            </BarChart>
          </Widget.Content>
        </Widget>
      </div>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With KPIs (KPIGroup with inline sparklines)
 * -----------------------------------------------------------------------------------------------*/
/** Twelve points per sparkline; the area starts at 0, so the values keep a visible swing. */
const sparkline = (values: number[]) => values.map((value) => ({value}));

const kpiMetrics = [
  {
    color: "var(--color-accent)",
    data: sparkline([21, 24, 23, 27, 26, 31, 29, 34, 37, 36, 41, 45]),
    format: {currency: "USD", maximumFractionDigits: 0, style: "currency"} as const,
    suffix: "past 30d",
    title: "Gross Volume",
    trend: "up" as const,
    trendValue: "4.1%",
    value: 512780,
  },
  {
    color: "var(--color-danger)",
    data: sparkline([44, 42, 43, 39, 40, 36, 37, 33, 31, 32, 29, 27]),
    format: {maximumFractionDigits: 1, minimumFractionDigits: 1, style: "percent"} as const,
    suffix: "vs prior 7d",
    title: "Churn Rate",
    trend: "down" as const,
    trendValue: "2.6%",
    value: 0.187,
  },
  {
    color: "var(--color-success)",
    data: sparkline([19, 22, 21, 25, 28, 26, 30, 33, 32, 37, 40, 43]),
    format: {maximumFractionDigits: 0, notation: "compact"} as const,
    suffix: "this quarter",
    title: "Subscribers",
    trend: "up" as const,
    trendValue: "12.4%",
    value: 64000,
  },
];

export const WithKPIs: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[900px]">
        <Widget.Header>
          <Widget.Title>Business Health</Widget.Title>
          <Widget.Description>Rolling 30 days</Widget.Description>
        </Widget.Header>
        <Widget.Content>
          <KPIGroup className="bg-transparent shadow-none">
            {kpiMetrics.map((metric, index) => (
              <React.Fragment key={metric.title}>
                {index > 0 && <KPIGroup.Separator />}
                <KPI>
                  <KPI.Header>
                    <KPI.Title>{metric.title}</KPI.Title>
                  </KPI.Header>
                  <KPI.Content className="grid-cols-[1fr_1fr] items-end">
                    <div className="flex flex-col gap-1">
                      <KPI.Value {...metric.format} className="text-3xl" value={metric.value} />
                      <TrendChip trend={metric.trend} variant="tertiary">
                        {metric.trendValue}
                        <TrendChip.Suffix>{metric.suffix}</TrendChip.Suffix>
                      </TrendChip>
                    </div>
                    <KPI.Chart
                      color={metric.color}
                      data={metric.data}
                      height={60}
                      strokeWidth={1.5}
                    />
                  </KPI.Content>
                </KPI>
              </React.Fragment>
            ))}
          </KPIGroup>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With line chart
 * -----------------------------------------------------------------------------------------------*/
const signupsByMonth = MONTHS.map((month, index) => ({
  email: [2100, 6400, 9800, 8700, 11200, 12600, 10400, 14300, 13100, 16900, 15200, 19800][index]!,
  month,
  social: [1200, 3100, 5400, 7900, 6800, 9300, 11800, 10600, 12900, 12100, 14700, 17600][index]!,
}));

export const WithLineChart: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[520px]">
        <Widget.Header>
          <Widget.Title>Signups by Channel</Widget.Title>
          <Widget.Legend>
            <Widget.LegendItem color="var(--chart-3)">Email</Widget.LegendItem>
            <Widget.LegendItem color="var(--chart-1)">Social</Widget.LegendItem>
          </Widget.Legend>
        </Widget.Header>
        <Widget.Content>
          <LineChart data={signupsByMonth} height={200}>
            <LineChart.Grid vertical={false} />
            <LineChart.XAxis dataKey="month" tickMargin={8} />
            <LineChart.YAxis tickFormatter={thousands} width={30} />
            <LineChart.Line
              dataKey="email"
              dot={false}
              name="Email"
              stroke="var(--chart-3)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Line
              dataKey="social"
              dot={false}
              name="Social"
              stroke="var(--chart-1)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Tooltip
              content={<LineChart.TooltipContent valueFormatter={withSeparators} />}
            />
          </LineChart>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With bar chart (30 daily bars)
 * -----------------------------------------------------------------------------------------------*/
const deploysByDay = (() => {
  const random = seeded(42);

  return dailyRows(6, (day) => ({
    builds: Math.round(760 + Math.sin(day / 2.5) * 360 + (random() - 0.5) * 640),
  }));
})();

export const WithBarChart: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[520px]">
        <Widget.Header>
          <Widget.Title>Builds per Day</Widget.Title>
          <Widget.Legend>
            <Widget.LegendItem color="var(--chart-3)">Builds</Widget.LegendItem>
          </Widget.Legend>
        </Widget.Header>
        <Widget.Content>
          <BarChart data={deploysByDay} height={220}>
            <BarChart.Grid vertical={false} />
            <BarChart.XAxis dataKey="date" tickFormatter={monthDay} tickMargin={8} />
            <BarChart.YAxis width={40} />
            <BarChart.Bar
              dataKey="builds"
              fill="var(--chart-3)"
              name="Builds"
              radius={[2, 2, 0, 0]}
            />
            <BarChart.Tooltip
              content={<BarChart.TooltipContent valueFormatter={withSeparators} />}
            />
          </BarChart>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With pie chart (legend below the chart, inside the content)
 * -----------------------------------------------------------------------------------------------*/
const deviceShare = [
  {color: "var(--chart-4)", name: "Desktop", value: 58},
  {color: "var(--chart-3)", name: "Mobile", value: 27},
  {color: "var(--chart-2)", name: "Tablet", value: 9},
  {color: "var(--chart-1)", name: "TV", value: 6},
];

export const WithPieChart: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[360px]">
        <Widget.Header>
          <Widget.Title>Sessions by Device</Widget.Title>
        </Widget.Header>
        <Widget.Content className="flex flex-col items-center gap-4">
          <PieChart height={200}>
            <PieChart.Pie data={deviceShare} dataKey="value" nameKey="name" outerRadius={80}>
              {deviceShare.map((item) => (
                <PieChart.Cell key={item.name} fill={item.color} />
              ))}
            </PieChart.Pie>
            <PieChart.Tooltip
              content={<PieChart.TooltipContent valueFormatter={(value) => `${value}%`} />}
            />
          </PieChart>
          <Widget.Legend className="flex-wrap justify-center">
            {deviceShare.map((item) => (
              <Widget.LegendItem key={item.name} color={item.color}>
                {item.name}
              </Widget.LegendItem>
            ))}
          </Widget.Legend>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With table (secondary Table, Widget.Content provides the surface)
 * -----------------------------------------------------------------------------------------------*/
const crew = [
  {email: "ines@northwind.io", name: "Ines Laurent", role: "Designer", status: "Active"},
  {email: "omar@northwind.io", name: "Omar Haddad", role: "Engineer", status: "Active"},
  {email: "lena@northwind.io", name: "Lena Fischer", role: "Researcher", status: "Away"},
  {email: "tomas@northwind.io", name: "Tomas Rivera", role: "Producer", status: "Active"},
];

export const WithTable: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[640px]">
        <Widget.Header>
          <Widget.Title>Project Crew</Widget.Title>
          <Widget.Description>{crew.length} people</Widget.Description>
        </Widget.Header>
        <Widget.Content className="p-0">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Project crew">
                <Table.Header className="sr-only">
                  <Table.Column isRowHeader>Name</Table.Column>
                  <Table.Column>Role</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Email</Table.Column>
                </Table.Header>
                <Table.Body>
                  {crew.map((person, index) => (
                    <Table.Row
                      key={person.email}
                      className={index === crew.length - 1 ? "[&_td]:border-b-0" : undefined}
                    >
                      <Table.Cell>{person.name}</Table.Cell>
                      <Table.Cell>{person.role}</Table.Cell>
                      <Table.Cell>{person.status}</Table.Cell>
                      <Table.Cell>{person.email}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Usage summary (ProgressCircle rows, custom column header in place of Widget.Header)
 * -----------------------------------------------------------------------------------------------*/
const usage = [
  {amount: "41.7K", color: "default" as const, label: "Storage Reads", percent: 41},
  {amount: "12.4 GB", color: "accent" as const, label: "Bandwidth", percent: 58},
  {amount: "3.2M", color: "accent" as const, label: "Function Invocations", percent: 24},
  {amount: "$86.20", color: "accent" as const, label: "Monthly Cost", percent: 69},
];

export const UsageSummary: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[520px]">
        <div className="grid grid-cols-[5fr_2fr] items-center px-5 py-2">
          <span className="text-xs font-medium text-muted">Resource</span>
          <span className="text-xs font-medium text-muted">Used</span>
        </div>
        <Widget.Content className="flex flex-col gap-0 p-0">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Resource usage">
                <Table.Header className="sr-only">
                  <Table.Column isRowHeader className="bg-transparent">
                    Resource
                  </Table.Column>
                  <Table.Column className="bg-transparent">Used</Table.Column>
                </Table.Header>
                <Table.Body>
                  {usage.map((item, index) => (
                    <Table.Row
                      key={item.label}
                      className={index === usage.length - 1 ? "[&_td]:border-b-0" : undefined}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <ProgressCircle
                            aria-label={`${item.label} usage`}
                            color={item.color}
                            size="sm"
                            value={item.percent}
                          >
                            <ProgressCircle.Track>
                              <ProgressCircle.TrackCircle />
                              <ProgressCircle.FillCircle />
                            </ProgressCircle.Track>
                          </ProgressCircle>
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm font-semibold text-foreground">{item.amount}</span>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Widget.Content>
      </Widget>
    </DemoFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With footer (not a Pro demo: covers `Widget.Footer` and the root `render` prop)
 * -----------------------------------------------------------------------------------------------*/
const queues = [
  {jobs: 128, name: "Thumbnails"},
  {jobs: 42, name: "Emails"},
  {jobs: 7, name: "Exports"},
];

export const WithFooter: Story = {
  render: (args) => (
    <DemoFrame>
      <Widget {...args} className="w-full max-w-[360px]" render={(props) => <section {...props} />}>
        <Widget.Header>
          <Widget.Title>Job Queues</Widget.Title>
          <Widget.Description>Live</Widget.Description>
        </Widget.Header>
        <Widget.Content className="flex flex-col gap-3">
          {queues.map((queue) => (
            <div key={queue.name} className="flex items-center justify-between text-sm">
              <span className="text-muted">{queue.name}</span>
              <span className="font-semibold text-foreground">{queue.jobs}</span>
            </div>
          ))}
        </Widget.Content>
        <Widget.Footer className="justify-between">
          <span className="text-xs text-muted">Refreshed a minute ago</span>
          <Button size="sm" variant="tertiary">
            View all
          </Button>
        </Widget.Footer>
      </Widget>
    </DemoFrame>
  ),
};
