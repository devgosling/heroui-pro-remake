import type {Key} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";
import type {TooltipContentProps} from "recharts";

import {Card, Chip} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {ChartTooltip} from "../chart-tooltip";
import {KPI} from "../kpi";
import {Segment} from "../segment";
import {TrendChip} from "../trend-chip";

import {LineChart} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Shared data helpers
 * -----------------------------------------------------------------------------------------------*/
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Zips per-series value arrays into Recharts rows keyed by month. */
const byMonth = (series: Record<string, number[]>) =>
  MONTHS.map((month, index) => {
    const row: Record<string, number | string> = {month};

    for (const [key, values] of Object.entries(series)) row[key] = values[index] ?? 0;

    return row;
  });

/** Deterministic pseudo-random walk (mulberry32), so stories render identically on every load. */
const randomWalk = (seed: number, points: number, start: number, drift: number, noise: number) => {
  let state = seed;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const values: number[] = [];
  let value = start;

  for (let index = 0; index < points; index++) {
    values.push(Math.round(value * 100) / 100);
    value += drift + (random() - 0.5) * noise;
  }

  return values.map((value) => ({value}));
};

/** Single-series rows (`{value}`) for the axis-less sparklines. */
const toPoints = (values: number[]) => values.map((value) => ({value}));

const compactThousands = (value: number) => (value === 0 ? "0" : `${value / 1000}k`);
const roundedThousands = (value: number) => (value === 0 ? "0" : `${Math.round(value / 1000)}k`);
const dollarThousands = (value: number) => `$${value / 1000}k`;
const withSeparators = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString("en-US") : String(value ?? "");
const asDollars = (value: unknown) =>
  typeof value === "number" ? `$${value.toLocaleString("en-US")}` : String(value ?? "");

/* -------------------------------------------------------------------------------------------------
 * Legend (plain markup, as in the Pro demos)
 * -----------------------------------------------------------------------------------------------*/
type LegendEntry = {color: string; label: string; dashed?: boolean};

const Legend = ({items}: {items: LegendEntry[]}) => (
  <div className="flex items-center gap-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-1.5">
        {item.dashed ? (
          <span
            className="h-0 w-3 rounded-full border-t-2 border-dashed"
            style={{borderColor: item.color}}
          />
        ) : (
          <span className="size-3 rounded-full" style={{backgroundColor: item.color}} />
        )}
        <span className="text-xs text-muted">{item.label}</span>
      </div>
    ))}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const storeVisits = byMonth({
  inStore: [1300, 9100, 10600, 12200, 7400, 8300, 10900, 9300, 4800, 10700, 16600, 8400],
  online: [2400, 12800, 7200, 11900, 13100, 7600, 16900, 16400, 18700, 15900, 19400, 13600],
});

const meta = {
  argTypes: {
    height: {control: {max: 480, min: 80, step: 10, type: "range"}},
    width: {control: "text"},
  },
  args: {data: storeVisits, height: 180},
  component: LineChart,
  parameters: {layout: "centered"},
  title: "Pro/Charts/LineChart",
} satisfies Meta<typeof LineChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Default (two linear series, axes, grid and tooltip inside a card)
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <Card className="w-[520px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Store Visits</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Online"},
            {color: "var(--chart-1)", label: "In-store"},
          ]}
        />
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">184,392</span>
          <span className="text-xs text-muted">Visits</span>
        </div>
        <LineChart {...args}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={compactThousands} width={30} />
          <LineChart.Line
            dataKey="online"
            dot={false}
            name="Online"
            stroke="var(--chart-3)"
            strokeWidth={2}
          />
          <LineChart.Line
            dataKey="inStore"
            dot={false}
            name="In-store"
            stroke="var(--chart-1)"
            strokeWidth={2}
          />
          <LineChart.Tooltip
            content={<LineChart.TooltipContent valueFormatter={withSeparators} />}
          />
        </LineChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Portfolio (bare monotone line driven by a range Segment)
 * -----------------------------------------------------------------------------------------------*/
/* Point counts follow the Pro demo (15 points per range, 10 for the short week range). */
const PORTFOLIO_RANGES = [
  {change: "+$84.10 (0.37%)", data: randomWalk(11, 15, 22610, 6, 70), id: "1D", label: "1D"},
  {change: "+$412.56 (1.82%)", data: randomWalk(23, 10, 22180, 45, 200), id: "5D", label: "5D"},
  {change: "+$1,086.40 (4.95%)", data: randomWalk(7, 15, 21500, 80, 420), id: "1M", label: "1M"},
  {change: "+$2,904.18 (14.6%)", data: randomWalk(41, 15, 19700, 200, 1000), id: "6M", label: "6M"},
  {
    change: "+$3,518.70 (18.3%)",
    data: randomWalk(5, 15, 19100, 240, 1300),
    id: "YTD",
    label: "YTD",
  },
  {change: "+$9,742.25 (73.4%)", data: randomWalk(19, 15, 12900, 660, 2400), id: "5Y", label: "5Y"},
];

/** Fits the Y range to the data with equal head and foot room, so the line fills the card. */
const paddedDomain = ([min, max]: readonly [number, number]): [number, number] => {
  const room = (max - min) * 0.137;

  return [min - room, max + room];
};

export const Portfolio: Story = {
  render: () => {
    const [range, setRange] = React.useState<Key>("1M");
    const active = PORTFOLIO_RANGES.find((item) => item.id === range) ?? PORTFOLIO_RANGES[2]!;

    return (
      <Card className="w-[520px] rounded-2xl">
        <Card.Header className="flex-row items-start justify-between pb-0">
          <div className="flex flex-col gap-3">
            <Card.Title className="text-base">Investments</Card.Title>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted">Account value</span>
              <span className="text-2xl font-semibold text-foreground">$22,694.37</span>
              {/* Pro renders the gain in the literal Tailwind green, not the success token. */}
              <span className="text-xs font-medium text-green-500">{active.change}</span>
            </div>
          </div>
          <Segment
            aria-label="Time range"
            selectedKey={range}
            size="sm"
            onSelectionChange={setRange}
          >
            {PORTFOLIO_RANGES.map((item) => (
              <Segment.Item key={item.id} id={item.id}>
                {item.label}
              </Segment.Item>
            ))}
          </Segment>
        </Card.Header>
        <Card.Content>
          <LineChart
            data={active.data}
            height={182}
            margin={{bottom: 0, left: 0, right: 0, top: 4}}
          >
            <LineChart.YAxis hide domain={paddedDomain} />
            <LineChart.Line
              dataKey="value"
              dot={false}
              stroke="var(--chart-3)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </Card.Content>
      </Card>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Traffic Source (same layout as Default with another data set)
 * -----------------------------------------------------------------------------------------------*/
const signups = byMonth({
  newsletter: [900, 6200, 8400, 7100, 9800, 11600, 10200, 13900, 12300, 15800, 14400, 17900],
  webinar: [400, 3100, 5600, 9300, 6800, 7200, 9900, 8700, 11200, 9600, 12900, 11800],
});

export const TrafficSource: Story = {
  render: () => (
    <Card className="w-[520px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Signup Channels</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Newsletter"},
            {color: "var(--chart-1)", label: "Webinar"},
          ]}
        />
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">96,240</span>
          <span className="text-xs text-muted">Signups</span>
        </div>
        <LineChart data={signups} height={180}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={compactThousands} width={30} />
          <LineChart.Line
            dataKey="newsletter"
            dot={false}
            name="Newsletter"
            stroke="var(--chart-3)"
            strokeWidth={2}
          />
          <LineChart.Line
            dataKey="webinar"
            dot={false}
            name="Webinar"
            stroke="var(--chart-1)"
            strokeWidth={2}
          />
          <LineChart.Tooltip
            content={<LineChart.TooltipContent valueFormatter={withSeparators} />}
          />
        </LineChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Multi Line Chart Colors (four series on the --chart-1..4 palette, line indicators)
 * -----------------------------------------------------------------------------------------------*/
const channels = byMonth({
  email: [700, 1300, 2400, 2900, 2600, 3500, 4300, 3900, 4700, 5200, 5800, 6400],
  partners: [500, 1000, 1600, 1500, 2300, 2100, 2800, 3300, 3100, 3800, 4200, 4600],
  search: [2600, 5400, 7900, 7200, 9400, 8300, 11800, 10900, 12600, 13400, 12900, 14800],
  social: [1200, 3000, 4800, 5900, 4100, 5300, 6900, 8200, 7600, 9100, 10400, 9800],
});

export const MultiLineChartColors: Story = {
  render: () => (
    <Card className="w-[600px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Acquisition</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-4)", label: "Search"},
            {color: "var(--chart-3)", label: "Social"},
            {color: "var(--chart-2)", label: "Email"},
            {color: "var(--chart-1)", label: "Partners"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <LineChart data={channels} height={240}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={compactThousands} width={30} />
          {[
            {color: "var(--chart-4)", key: "search", name: "Search"},
            {color: "var(--chart-3)", key: "social", name: "Social"},
            {color: "var(--chart-2)", key: "email", name: "Email"},
            {color: "var(--chart-1)", key: "partners", name: "Partners"},
          ].map((series) => (
            <LineChart.Line
              key={series.key}
              dataKey={series.key}
              dot={false}
              name={series.name}
              stroke={series.color}
              strokeWidth={2}
              type="monotone"
            />
          ))}
          <LineChart.Tooltip content={<LineChart.TooltipContent indicator="line" />} />
        </LineChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Dots (filled data points and a larger active dot)
 * -----------------------------------------------------------------------------------------------*/
const bookings = byMonth({
  bookings: [3100, 4900, 4100, 6300, 5200, 7600, 6700, 8100, 7400, 9300, 8800, 10900],
});

export const WithDots: Story = {
  render: () => (
    <Card className="w-[520px] rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Monthly Bookings</Card.Title>
      </Card.Header>
      <Card.Content>
        <LineChart data={bookings} height={200}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={dollarThousands} width={40} />
          <LineChart.Line
            activeDot={{r: 5}}
            dataKey="bookings"
            dot={{fill: "var(--chart-3)", r: 3, strokeWidth: 0}}
            name="Bookings"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Tooltip content={<LineChart.TooltipContent valueFormatter={asDollars} />} />
        </LineChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Dashed Comparison (dashed forecast line behind the actual series)
 * -----------------------------------------------------------------------------------------------*/
const forecast = byMonth({
  booked: [3100, 4900, 4100, 6300, 5200, 7600, 6700, 8100, 7400, 9300, 8800, 10900],
  forecast: [4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500],
});

export const DashedComparison: Story = {
  render: () => (
    <Card className="w-[520px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Booked vs Forecast</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Booked"},
            {color: "var(--chart-2)", dashed: true, label: "Forecast"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <LineChart data={forecast} height={200}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={dollarThousands} width={40} />
          <LineChart.Line
            dataKey="forecast"
            dot={false}
            name="Forecast"
            stroke="var(--chart-2)"
            strokeDasharray="5 5"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Line
            dataKey="booked"
            dot={false}
            name="Booked"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Tooltip content={<LineChart.TooltipContent valueFormatter={asDollars} />} />
        </LineChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Sparkline (tiny axis-less charts)
 * -----------------------------------------------------------------------------------------------*/
/* 12 points per sparkline (one per month), like the Pro demo. */
const SPARKLINES = [
  {
    color: "var(--color-success)",
    data: toPoints([18, 21, 19, 24, 23, 27, 29, 28, 32, 35, 33, 37]),
    label: "Orders",
  },
  {
    color: "var(--color-danger)",
    data: toPoints([36, 33, 34, 30, 31, 28, 26, 27, 24, 22, 23, 20]),
    label: "Refunds",
  },
  {
    color: "var(--chart-3)",
    data: toPoints([22, 25, 23, 27, 30, 28, 33, 31, 35, 38, 36, 41]),
    label: "Visitors",
  },
];

export const Sparkline: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {SPARKLINES.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{item.label}</span>
          <div className="w-[120px]">
            <LineChart data={item.data} height={40} margin={{bottom: 0, left: 0, right: 0, top: 2}}>
              <LineChart.Line
                dataKey="value"
                dot={false}
                stroke={item.color}
                strokeWidth={1.5}
                type="monotone"
              />
            </LineChart>
          </div>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * KPI With Chart (Pro KPI cards with an inline trend line)
 * -----------------------------------------------------------------------------------------------*/
const KPI_ITEMS = [
  {
    color: "var(--chart-3)",
    data: toPoints([42, 48, 45, 53, 51, 58, 62, 60, 67, 71, 69, 76]),
    format: {currency: "USD", maximumFractionDigits: 0, style: "currency" as const},
    suffix: "past month",
    title: "Gross Volume",
    trend: "up" as const,
    trendValue: "4.1%",
    value: 96310,
  },
  {
    color: "var(--color-danger)",
    data: toPoints([61, 57, 59, 53, 55, 50, 47, 49, 44, 41, 43, 38]),
    format: {maximumFractionDigits: 1, style: "percent" as const},
    suffix: "vs prior week",
    title: "Cart Abandonment",
    trend: "down" as const,
    trendValue: "2.7%",
    value: 0.284,
  },
  {
    color: "var(--color-success)",
    data: toPoints([30, 34, 33, 38, 36, 41, 45, 43, 49, 52, 50, 56]),
    format: {},
    suffix: "last 7 days",
    title: "Trial Starts",
    trend: "up" as const,
    trendValue: "1.8%",
    value: 2087,
  },
];

export const KPIWithChart: Story = {
  render: () => (
    <div className="grid w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {KPI_ITEMS.map((item) => (
        <KPI key={item.title}>
          <KPI.Header>
            <KPI.Title>{item.title}</KPI.Title>
          </KPI.Header>
          <KPI.Content className="grid-cols-[1fr_1fr] items-end">
            <div className="flex flex-col gap-1">
              <KPI.Value className="text-3xl" value={item.value} {...item.format} />
              <TrendChip trend={item.trend} variant="tertiary">
                {item.trendValue}
                <TrendChip.Suffix>{item.suffix}</TrendChip.Suffix>
              </TrendChip>
            </div>
            <LineChart data={item.data} height={70} margin={{bottom: 0, left: 0, right: 0, top: 4}}>
              <LineChart.Line
                dataKey="value"
                dot={false}
                stroke={item.color}
                strokeWidth={1.5}
                type="monotone"
              />
            </LineChart>
          </KPI.Content>
        </KPI>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Stats With Chart (stat cards above a chart card)
 * -----------------------------------------------------------------------------------------------*/
const STATS = [
  {color: "success" as const, icon: "gravity-ui:arrow-up", label: "Income", value: "$184,920"},
  {color: "danger" as const, icon: "gravity-ui:arrow-down", label: "Spend", value: "$31,446"},
  {color: "success" as const, icon: "gravity-ui:arrow-up", label: "Orders", value: "1,206"},
];

const income = byMonth({
  income: [3100, 4900, 4100, 6300, 5200, 7600, 6700, 8100, 7400, 9300, 8800, 10900],
});

export const StatsWithChart: Story = {
  render: () => (
    <div className="flex w-[700px] flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {STATS.map((stat) => (
          <Card key={stat.label} className="gap-1 rounded-2xl">
            <Card.Header>
              <Card.Description className="text-sm font-medium">{stat.label}</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-row items-center gap-2">
              <span className="flex-1 text-2xl font-semibold text-foreground">{stat.value}</span>
              <Chip color={stat.color} size="sm" variant="soft">
                <Icon className="size-3" icon={stat.icon} />
                2.6%
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl">
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className="text-base">Income by Month</Card.Title>
          <Legend items={[{color: "var(--chart-3)", label: "Income"}]} />
        </Card.Header>
        <Card.Content>
          <LineChart data={income} height={200}>
            <LineChart.Grid vertical={false} />
            <LineChart.XAxis dataKey="month" tickMargin={8} />
            <LineChart.YAxis tickFormatter={dollarThousands} width={40} />
            <LineChart.Line
              dataKey="income"
              dot={false}
              name="Income"
              stroke="var(--chart-3)"
              strokeWidth={2}
              type="monotone"
            />
            <LineChart.Tooltip content={<LineChart.TooltipContent valueFormatter={asDollars} />} />
          </LineChart>
        </Card.Content>
      </Card>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Custom Tooltip (composed ChartTooltip parts plus a summary row)
 * -----------------------------------------------------------------------------------------------*/
const pageViews = byMonth({
  desktop: [3200, 14900, 8100, 13600, 15100, 8900, 11400, 7300, 12800, 17600, 21300, 14200],
  mobile: [1100, 9600, 11800, 14100, 9200, 10400, 13900, 9800, 5600, 12600, 17200, 8600],
});

const PageViewsTooltip = ({active, label, payload}: TooltipContentProps) => {
  if (!active || !payload?.length) return null;

  const combined = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

  return (
    <ChartTooltip indicator="line">
      <ChartTooltip.Header>{label}</ChartTooltip.Header>
      {payload.map((entry) => (
        <ChartTooltip.Item key={String(entry.dataKey)}>
          <ChartTooltip.Indicator color={entry.color} />
          <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
          <ChartTooltip.Value>{withSeparators(entry.value)}</ChartTooltip.Value>
        </ChartTooltip.Item>
      ))}
      <div className="mt-1 flex items-center justify-between border-t border-separator pt-1.5">
        <span className="text-xs font-medium text-muted">Combined</span>
        <span className="text-xs font-semibold text-foreground">{withSeparators(combined)}</span>
      </div>
    </ChartTooltip>
  );
};

export const WithCustomTooltip: Story = {
  render: () => (
    <Card className="w-[520px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Page Views</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Desktop"},
            {color: "var(--chart-2)", label: "Mobile"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <LineChart data={pageViews} height={200}>
          <LineChart.Grid vertical={false} />
          <LineChart.XAxis dataKey="month" tickMargin={8} />
          <LineChart.YAxis tickFormatter={roundedThousands} width={30} />
          <LineChart.Line
            dataKey="desktop"
            dot={false}
            name="Desktop"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Line
            dataKey="mobile"
            dot={false}
            name="Mobile"
            stroke="var(--chart-2)"
            strokeWidth={2}
            type="monotone"
          />
          <LineChart.Tooltip content={PageViewsTooltip} />
        </LineChart>
      </Card.Content>
    </Card>
  ),
};
