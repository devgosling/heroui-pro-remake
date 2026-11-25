import type {Meta, StoryObj} from "@storybook/react";

import {Card} from "@heroui/react";
import React from "react";

import {PieChart} from "./index";

const meta = {
  argTypes: {
    height: {control: {max: 480, min: 120, step: 10, type: "range"}},
    width: {control: "text"},
  },
  component: PieChart,
  parameters: {layout: "centered"},
  title: "Pro/Charts/PieChart",
} satisfies Meta<typeof PieChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
type Slice = {name: string; value: number; color: string};

const PALETTE = ["var(--chart-4)", "var(--chart-3)", "var(--chart-2)", "var(--chart-1)"];

const withColors = (items: Array<Omit<Slice, "color">>): Slice[] =>
  items.map((item, index) => ({...item, color: PALETTE[index % PALETTE.length]!}));

const sum = (items: Slice[]) => items.reduce((total, item) => total + item.value, 0);

const formatNumber = (value: unknown) =>
  typeof value === "number" ? value.toLocaleString("en-US") : String(value ?? "");

/** Rounded, slightly overlapping ring segments shared by every donut demo. */
const DONUT_PROPS = {
  cornerRadius: 12,
  innerRadius: "68%",
  paddingAngle: -20,
  strokeWidth: 0,
} as const;

const Dot = ({className = "size-2.5", color}: {className?: string; color: string}) => (
  <span className={`${className} rounded-full`} style={{backgroundColor: color}} />
);

const InlineLegend = ({items, render}: {items: Slice[]; render?: (item: Slice) => string}) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
    {items.map((item) => (
      <div key={item.name} className="flex items-center gap-1.5">
        <Dot color={item.color} />
        <span className="text-xs text-muted">{render ? render(item) : item.name}</span>
      </div>
    ))}
  </div>
);

const CenterContent = ({children}: {children: React.ReactNode}) => (
  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
    {children}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
const osShare = withColors([
  {name: "Android", value: 48},
  {name: "iOS", value: 27},
  {name: "Windows", value: 15},
  {name: "Linux", value: 10},
]);

export const Default: Story = {
  args: {height: 220},
  render: (args) => (
    <Card className="w-[360px] rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Operating Systems</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col items-center gap-4">
        <PieChart {...args}>
          <PieChart.Pie data={osShare} dataKey="value" nameKey="name" outerRadius={90}>
            {osShare.map((item) => (
              <PieChart.Cell key={item.name} fill={item.color} />
            ))}
          </PieChart.Pie>
          <PieChart.Tooltip content={<PieChart.TooltipContent />} />
        </PieChart>
        <InlineLegend items={osShare} />
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Donut
 * -----------------------------------------------------------------------------------------------*/
const leadChannels = withColors([
  {name: "Email", value: 3900},
  {name: "Paid Ads", value: 2600},
  {name: "Events", value: 1700},
  {name: "Partners", value: 1200},
]);

export const Donut: Story = {
  render: () => (
    <Card className="w-[360px] rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Lead Channels</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col items-center gap-4">
        <PieChart height={220}>
          <PieChart.Pie {...DONUT_PROPS} data={leadChannels} dataKey="value" nameKey="name">
            {leadChannels.map((item) => (
              <PieChart.Cell key={item.name} fill={item.color} />
            ))}
          </PieChart.Pie>
          <PieChart.Tooltip
            content={<PieChart.TooltipContent valueFormatter={(value) => formatNumber(value)} />}
          />
        </PieChart>
        <InlineLegend
          items={leadChannels}
          render={(item) => `${item.name} (${formatNumber(item.value)})`}
        />
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Donut with label
 * -----------------------------------------------------------------------------------------------*/
const photoLibrary = withColors([
  {name: "Photos", value: 38},
  {name: "Videos", value: 26},
  {name: "Backups", value: 14},
  {name: "Other", value: 8},
]);

export const DonutWithLabel: Story = {
  render: () => {
    const used = sum(photoLibrary);

    return (
      <Card className="w-[360px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Photo Library</Card.Title>
          <Card.Description className="text-xs text-muted">
            {used} GB of 128 GB used
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col items-center gap-4">
          <div className="relative">
            <PieChart height={220} width={220}>
              <PieChart.Pie {...DONUT_PROPS} data={photoLibrary} dataKey="value" nameKey="name">
                {photoLibrary.map((item) => (
                  <PieChart.Cell key={item.name} fill={item.color} />
                ))}
              </PieChart.Pie>
              <PieChart.Tooltip
                content={<PieChart.TooltipContent valueFormatter={(value) => `${value} GB`} />}
              />
            </PieChart>
            <CenterContent>
              <span className="text-2xl font-bold text-foreground">{used}</span>
              <span className="text-xs text-muted">GB used</span>
            </CenterContent>
          </div>
          <InlineLegend items={photoLibrary} render={(item) => `${item.name} (${item.value} GB)`} />
        </Card.Content>
      </Card>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Donut with content
 * -----------------------------------------------------------------------------------------------*/
const sessions = withColors([
  {name: "Web", value: 3100},
  {name: "iOS", value: 1400},
  {name: "Android", value: 700},
]);

export const DonutWithContent: Story = {
  render: () => {
    const total = sum(sessions);

    return (
      <Card className="w-[360px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Active Sessions</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col items-center gap-4">
          <div className="relative">
            <PieChart height={240} width={240}>
              <PieChart.Pie {...DONUT_PROPS} data={sessions} dataKey="value" nameKey="name">
                {sessions.map((item) => (
                  <PieChart.Cell key={item.name} fill={item.color} />
                ))}
              </PieChart.Pie>
              <PieChart.Tooltip content={<PieChart.TooltipContent />} />
            </PieChart>
            <CenterContent>
              <span className="text-3xl font-bold text-foreground">
                {new Intl.NumberFormat("en-US", {
                  maximumFractionDigits: 1,
                  notation: "compact",
                }).format(total)}
              </span>
              <span className="text-sm text-muted">Sessions</span>
            </CenterContent>
          </div>
          <div className="flex flex-col gap-2">
            {sessions.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <Dot className="size-3 shrink-0" color={item.color} />
                <span className="w-16 text-sm text-foreground">{item.name}</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatNumber(item.value)}
                </span>
                <span className="text-xs text-muted">
                  ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Nested donut
 * -----------------------------------------------------------------------------------------------*/
const ticketsLastWeek = withColors([
  {name: "Billing", value: 1200},
  {name: "Technical", value: 2300},
  {name: "Account", value: 900},
  {name: "Other", value: 600},
]);

const ticketsThisWeek = withColors([
  {name: "Billing", value: 1500},
  {name: "Technical", value: 2100},
  {name: "Account", value: 1100},
  {name: "Other", value: 700},
]);

export const NestedDonut: Story = {
  render: () => (
    <Card className="w-[400px] rounded-2xl">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Tickets: This Week vs Last</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col items-center gap-4">
        <PieChart height={240}>
          <PieChart.Pie
            {...DONUT_PROPS}
            data={ticketsLastWeek}
            dataKey="value"
            innerRadius="34%"
            nameKey="name"
            outerRadius="46%"
          >
            {ticketsLastWeek.map((item) => (
              <PieChart.Cell key={item.name} fill={item.color} />
            ))}
          </PieChart.Pie>
          <PieChart.Pie
            {...DONUT_PROPS}
            data={ticketsThisWeek}
            dataKey="value"
            innerRadius="56%"
            nameKey="name"
            outerRadius="68%"
          >
            {ticketsThisWeek.map((item) => (
              <PieChart.Cell key={item.name} fill={item.color} />
            ))}
          </PieChart.Pie>
          <PieChart.Tooltip
            content={<PieChart.TooltipContent valueFormatter={(value) => formatNumber(value)} />}
          />
        </PieChart>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {ticketsThisWeek.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <Dot color={item.color} />
                <span className="text-xs text-muted">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted/30" />
            <span>Last week (inner)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-muted" />
            <span>This week (outer)</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With breakdown
 * -----------------------------------------------------------------------------------------------*/
const seats = withColors([
  {name: "Engineering", value: 410},
  {name: "Sales", value: 260},
  {name: "Support", value: 190},
]);

export const WithBreakdown: Story = {
  render: () => {
    const total = sum(seats);

    return (
      <Card className="w-[460px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Seats by Team</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-row items-center gap-6">
          <div className="relative shrink-0">
            <PieChart height={180} width={180}>
              <PieChart.Pie {...DONUT_PROPS} data={seats} dataKey="value" nameKey="name">
                {seats.map((item) => (
                  <PieChart.Cell key={item.name} fill={item.color} />
                ))}
              </PieChart.Pie>
              <PieChart.Tooltip content={<PieChart.TooltipContent />} />
            </PieChart>
            <CenterContent>
              <span className="text-xl font-bold text-foreground">{formatNumber(total)}</span>
              <span className="text-[10px] text-muted">Seats</span>
            </CenterContent>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {seats.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <Dot className="size-3 shrink-0" color={item.color} />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatNumber(item.value)}
                    </span>
                    <span className="text-xs text-muted">
                      ({((item.value / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Custom tooltip
 * -----------------------------------------------------------------------------------------------*/
const searchShare = withColors([
  {name: "Google", value: 71},
  {name: "Bing", value: 14},
  {name: "Yandex", value: 8},
  {name: "Other", value: 7},
]);

export const CustomTooltip: Story = {
  render: () => {
    const total = sum(searchShare);

    return (
      <Card className="w-[360px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Search Engine Share</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col items-center gap-4">
          <PieChart height={220}>
            <PieChart.Pie data={searchShare} dataKey="value" nameKey="name" outerRadius={90}>
              {searchShare.map((item) => (
                <PieChart.Cell key={item.name} fill={item.color} />
              ))}
            </PieChart.Pie>
            <PieChart.Tooltip
              content={
                <PieChart.TooltipContent
                  valueFormatter={(value) => `${((Number(value) / total) * 100).toFixed(1)}%`}
                />
              }
            />
          </PieChart>
          <InlineLegend items={searchShare} />
        </Card.Content>
      </Card>
    );
  },
};
