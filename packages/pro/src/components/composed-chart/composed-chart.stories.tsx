import type {ComposedChartDatum} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Card} from "@heroui/react";
import React from "react";

import {ComposedChart} from "./index";

const meta = {
  argTypes: {
    data: {control: "object"},
    height: {control: {max: 480, min: 160, step: 10, type: "range"}},
    margin: {control: "object"},
    width: {control: "text"},
  },
  component: ComposedChart,
  decorators: [
    (Story) => (
      <div className="flex w-full justify-center p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {layout: "fullscreen"},
  title: "Pro/Charts/ComposedChart",
} satisfies Meta<typeof ComposedChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers (story chrome: card header with a small colour legend)
 * -----------------------------------------------------------------------------------------------*/
type LegendEntry = {color: string; label: string};

const Legend = ({dotSize = "size-3", items}: {dotSize?: string; items: LegendEntry[]}) => (
  <div className="flex items-center gap-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-1.5">
        <span className={`${dotSize} rounded-full`} style={{backgroundColor: item.color}} />
        <span className="text-xs text-muted">{item.label}</span>
      </div>
    ))}
  </div>
);

const thousands = (value: number) => (value === 0 ? "0" : `${Math.round(value / 1000)}k`);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const byMonth = <T extends Record<string, number>>(rows: T[]): ComposedChartDatum[] =>
  rows.map((row, index) => ({month: months[index] ?? "", ...row}));

/* -------------------------------------------------------------------------------------------------
 * Default - bars (left axis) + line (right axis)
 * -----------------------------------------------------------------------------------------------*/
const salesData = byMonth([
  {sales: 3800, units: 310},
  {sales: 5200, units: 425},
  {sales: 4600, units: 360},
  {sales: 6900, units: 505},
  {sales: 5800, units: 470},
  {sales: 8100, units: 590},
  {sales: 7400, units: 545},
  {sales: 8800, units: 660},
  {sales: 8300, units: 615},
  {sales: 9900, units: 730},
  {sales: 9500, units: 690},
  {sales: 11200, units: 805},
]);

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export const Default: Story = {
  args: {data: salesData, height: 260},
  render: (args) => (
    <Card className="w-full rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Sales &amp; Units</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Sales"},
            {color: "var(--chart-1)", label: "Units"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <ComposedChart {...args}>
          <ComposedChart.Grid vertical={false} />
          <ComposedChart.XAxis dataKey="month" tickMargin={8} />
          <ComposedChart.YAxis
            tickFormatter={(value: number) => `$${value / 1000}k`}
            width={40}
            yAxisId="left"
          />
          <ComposedChart.YAxis orientation="right" width={40} yAxisId="right" />
          <ComposedChart.Bar
            barSize={16}
            dataKey="sales"
            fill="var(--chart-3)"
            name="Sales"
            radius={[4, 4, 0, 0]}
            yAxisId="left"
          />
          <ComposedChart.Line
            dataKey="units"
            dot={false}
            name="Units"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
            yAxisId="right"
          />
          <ComposedChart.Tooltip
            content={
              <ComposedChart.TooltipContent
                valueFormatter={(value, item) =>
                  item.dataKey === "sales"
                    ? currency.format(Number(value))
                    : Number(value).toLocaleString("en-US")
                }
              />
            }
          />
        </ComposedChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Stacked Bar With Line - four stacked series + a percentage line on a second axis
 * -----------------------------------------------------------------------------------------------*/
const ticketData: ComposedChartDatum[] = [
  {chat: 380, date: "Feb 2", email: 2300, phone: 110, resolved: 88, social: 60},
  {chat: 260, date: "Feb 3", email: 1300, phone: 80, resolved: 81, social: 45},
  {chat: 450, date: "Feb 4", email: 3100, phone: 130, resolved: 77, social: 70},
  {chat: 1150, date: "Feb 5", email: 12700, phone: 310, resolved: 71, social: 200},
  {chat: 1050, date: "Feb 6", email: 12000, phone: 280, resolved: 68, social: 180},
  {chat: 240, date: "Feb 7", email: 860, phone: 55, resolved: 63, social: 30},
  {chat: 180, date: "Feb 8", email: 580, phone: 40, resolved: 60, social: 20},
  {chat: 130, date: "Feb 9", email: 420, phone: 30, resolved: 57, social: 15},
  {chat: 110, date: "Feb 12", email: 280, phone: 25, resolved: 55, social: 10},
  {chat: 640, date: "Feb 15", email: 4900, phone: 210, resolved: 58, social: 90},
  {chat: 900, date: "Feb 18", email: 8100, phone: 260, resolved: 62, social: 150},
  {chat: 560, date: "Feb 21", email: 2950, phone: 160, resolved: 66, social: 80},
  {chat: 1000, date: "Feb 24", email: 10300, phone: 330, resolved: 70, social: 190},
  {chat: 1450, date: "Feb 27", email: 21400, phone: 510, resolved: 74, social: 280},
  {chat: 1200, date: "Mar 1", email: 16800, phone: 420, resolved: 79, social: 240},
];

const compact = new Intl.NumberFormat("en-US", {maximumFractionDigits: 0, notation: "compact"});

export const StackedBarWithLine: Story = {
  args: {data: ticketData, height: 300},
  render: (args) => (
    <Card className="w-full max-w-[700px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Support Volume by Channel</Card.Title>
        <Legend
          dotSize="size-2.5"
          items={[
            {color: "var(--chart-4)", label: "Email"},
            {color: "var(--chart-2)", label: "Chat"},
            {color: "var(--chart-3)", label: "Phone"},
            {color: "var(--chart-1)", label: "Social"},
            {color: "var(--muted)", label: "Resolved %"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <ComposedChart {...args}>
          <ComposedChart.Grid vertical={false} />
          <ComposedChart.XAxis dataKey="date" tickMargin={8} />
          <ComposedChart.YAxis
            tickFormatter={(value: number) => compact.format(value)}
            width={35}
            yAxisId="left"
          />
          <ComposedChart.YAxis
            domain={[0, 100]}
            orientation="right"
            tickFormatter={(value: number) => `${value}%`}
            width={40}
            yAxisId="right"
          />
          <ComposedChart.Bar
            barSize={20}
            dataKey="email"
            fill="var(--chart-4)"
            name="Email"
            radius={0}
            stackId="channels"
            yAxisId="left"
          />
          <ComposedChart.Bar
            barSize={20}
            dataKey="chat"
            fill="var(--chart-2)"
            name="Chat"
            radius={0}
            stackId="channels"
            yAxisId="left"
          />
          <ComposedChart.Bar
            barSize={20}
            dataKey="phone"
            fill="var(--chart-3)"
            name="Phone"
            radius={0}
            stackId="channels"
            yAxisId="left"
          />
          <ComposedChart.Bar
            barSize={20}
            dataKey="social"
            fill="var(--chart-1)"
            name="Social"
            radius={[4, 4, 0, 0]}
            stackId="channels"
            yAxisId="left"
          />
          <ComposedChart.Line
            dataKey="resolved"
            dot={false}
            name="Resolved %"
            stroke="var(--muted)"
            strokeWidth={1.5}
            type="monotone"
            yAxisId="right"
          />
          <ComposedChart.Tooltip content={<ComposedChart.TooltipContent indicator="line" />} />
        </ComposedChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Area With Line - gradient area + dashed target line on one axis
 * -----------------------------------------------------------------------------------------------*/
const downloadsData = byMonth([
  {downloads: 9400, goal: 12000},
  {downloads: 14100, goal: 13000},
  {downloads: 11800, goal: 14000},
  {downloads: 18600, goal: 15000},
  {downloads: 15900, goal: 16000},
  {downloads: 22300, goal: 17000},
  {downloads: 20100, goal: 18000},
  {downloads: 25800, goal: 19000},
  {downloads: 23400, goal: 20000},
  {downloads: 28700, goal: 21000},
  {downloads: 26900, goal: 22000},
  {downloads: 31500, goal: 23000},
]);

export const AreaWithLine: Story = {
  args: {data: downloadsData, height: 260},
  render: (args) => (
    <Card className="w-full max-w-[560px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Downloads vs Goal</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Downloads"},
            {color: "var(--chart-1)", label: "Goal"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <ComposedChart {...args}>
          <defs>
            <linearGradient id="composed-downloads-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ComposedChart.Grid vertical={false} />
          <ComposedChart.XAxis dataKey="month" tickMargin={8} />
          <ComposedChart.YAxis tickFormatter={thousands} width={30} />
          <ComposedChart.Area
            dataKey="downloads"
            fill="url(#composed-downloads-gradient)"
            name="Downloads"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <ComposedChart.Line
            dataKey="goal"
            dot={false}
            name="Goal"
            stroke="var(--chart-1)"
            strokeDasharray="6 3"
            strokeWidth={2}
            type="monotone"
          />
          <ComposedChart.Tooltip content={<ComposedChart.TooltipContent />} />
        </ComposedChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Bar With Area - bars (left axis) + filled rate area outlined by a line (right axis)
 * -----------------------------------------------------------------------------------------------*/
const visitsData = byMonth([
  {conversion: 2.4, visits: 38000},
  {conversion: 2.9, visits: 44000},
  {conversion: 2.6, visits: 41000},
  {conversion: 3.3, visits: 53000},
  {conversion: 3.1, visits: 50000},
  {conversion: 3.8, visits: 62000},
  {conversion: 3.6, visits: 59000},
  {conversion: 4.1, visits: 68000},
  {conversion: 3.9, visits: 66000},
  {conversion: 4.5, visits: 76000},
  {conversion: 4.3, visits: 73000},
  {conversion: 4.9, visits: 84000},
]);

export const BarWithArea: Story = {
  args: {data: visitsData, height: 260},
  render: (args) => (
    <Card className="w-full max-w-[560px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Visits &amp; Conversion</Card.Title>
        <Legend
          items={[
            {color: "var(--chart-3)", label: "Visits"},
            {color: "var(--chart-4)", label: "Conversion %"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <ComposedChart {...args}>
          <defs>
            <linearGradient id="composed-conversion-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ComposedChart.Grid vertical={false} />
          <ComposedChart.XAxis dataKey="month" tickMargin={8} />
          <ComposedChart.YAxis tickFormatter={thousands} width={35} yAxisId="left" />
          <ComposedChart.YAxis
            orientation="right"
            tickFormatter={(value: number) => `${value}%`}
            width={35}
            yAxisId="right"
          />
          <ComposedChart.Area
            dataKey="conversion"
            fill="url(#composed-conversion-gradient)"
            name="Conversion"
            stroke="none"
            type="monotone"
            yAxisId="right"
          />
          <ComposedChart.Bar
            barSize={16}
            dataKey="visits"
            fill="var(--chart-3)"
            name="Visits"
            radius={[4, 4, 0, 0]}
            yAxisId="left"
          />
          <ComposedChart.Line
            dataKey="conversion"
            dot={false}
            stroke="var(--chart-4)"
            strokeWidth={2}
            type="monotone"
            yAxisId="right"
          />
          <ComposedChart.Tooltip content={<ComposedChart.TooltipContent />} />
        </ComposedChart>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Multi Type - area + bars (left axis) and a dotted line (right axis)
 * -----------------------------------------------------------------------------------------------*/
const storeData = byMonth([
  {orders: 2900, returns: 44, visitors: 7600},
  {orders: 4200, returns: 39, visitors: 10900},
  {orders: 3500, returns: 41, visitors: 9100},
  {orders: 5300, returns: 36, visitors: 13800},
  {orders: 4600, returns: 37, visitors: 11700},
  {orders: 6400, returns: 33, visitors: 16900},
  {orders: 5800, returns: 34, visitors: 15200},
  {orders: 7000, returns: 30, visitors: 18800},
  {orders: 6700, returns: 31, visitors: 17600},
  {orders: 7900, returns: 28, visitors: 20900},
  {orders: 7500, returns: 29, visitors: 20100},
  {orders: 8800, returns: 26, visitors: 23400},
]);

export const MultiType: Story = {
  args: {data: storeData, height: 280},
  render: (args) => (
    <Card className="w-full max-w-[620px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Store Performance</Card.Title>
        <Legend
          dotSize="size-2.5"
          items={[
            {color: "var(--chart-3)", label: "Visitors"},
            {color: "var(--chart-4)", label: "Orders"},
            {color: "var(--chart-1)", label: "Return Rate"},
          ]}
        />
      </Card.Header>
      <Card.Content>
        <ComposedChart {...args}>
          <defs>
            <linearGradient id="composed-visitors-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <ComposedChart.Grid vertical={false} />
          <ComposedChart.XAxis dataKey="month" tickMargin={8} />
          <ComposedChart.YAxis tickFormatter={thousands} width={30} yAxisId="left" />
          <ComposedChart.YAxis
            orientation="right"
            tickFormatter={(value: number) => `${value}%`}
            width={35}
            yAxisId="right"
          />
          <ComposedChart.Area
            dataKey="visitors"
            fill="url(#composed-visitors-gradient)"
            name="Visitors"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
            yAxisId="left"
          />
          <ComposedChart.Bar
            barSize={14}
            dataKey="orders"
            fill="var(--chart-4)"
            name="Orders"
            radius={[4, 4, 0, 0]}
            yAxisId="left"
          />
          <ComposedChart.Line
            dataKey="returns"
            dot={{fill: "var(--chart-1)", r: 3, strokeWidth: 0}}
            name="Return Rate"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
            yAxisId="right"
          />
          <ComposedChart.Tooltip content={<ComposedChart.TooltipContent indicator="line" />} />
        </ComposedChart>
      </Card.Content>
    </Card>
  ),
};
