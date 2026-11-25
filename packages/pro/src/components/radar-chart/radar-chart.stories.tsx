import type {Meta, StoryObj} from "@storybook/react";

import {Card} from "@heroui/react";
import React from "react";

import {RadarChart} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Data (story content is our own; structure mirrors the Pro demos)
 * -----------------------------------------------------------------------------------------------*/
const attributes = [
  {attribute: "Pace", rating: 81},
  {attribute: "Shooting", rating: 94},
  {attribute: "Passing", rating: 70},
  {attribute: "Dribbling", rating: 88},
  {attribute: "Defense", rating: 58},
  {attribute: "Physical", rating: 66},
];

const qualityScores = [
  {metric: "Accuracy", score: 90},
  {metric: "Latency", score: 76},
  {metric: "Coverage", score: 84},
  {metric: "Uptime", score: 97},
  {metric: "Cost", score: 62},
  {metric: "Support", score: 71},
];

const readiness = [
  {actual: 72, area: "Docs", planned: 85},
  {actual: 91, area: "Tests", planned: 80},
  {actual: 64, area: "A11y", planned: 75},
  {actual: 83, area: "Perf", planned: 70},
  {actual: 77, area: "Security", planned: 90},
  {actual: 58, area: "i18n", planned: 65},
];

const traffic = [
  {month: "Jul", organic: 70, paid: 52, referral: 38},
  {month: "Aug", organic: 78, paid: 60, referral: 42},
  {month: "Sep", organic: 84, paid: 57, referral: 49},
  {month: "Oct", organic: 76, paid: 66, referral: 45},
  {month: "Nov", organic: 90, paid: 71, referral: 53},
  {month: "Dec", organic: 86, paid: 63, referral: 58},
];

const vendors = [
  {criterion: "Price", vendorX: 82, vendorY: 68},
  {criterion: "Quality", vendorX: 74, vendorY: 89},
  {criterion: "Support", vendorX: 91, vendorY: 72},
  {criterion: "Delivery", vendorX: 66, vendorY: 80},
  {criterion: "Flexibility", vendorX: 78, vendorY: 61},
  {criterion: "Security", vendorX: 70, vendorY: 93},
];

/* -------------------------------------------------------------------------------------------------
 * Story helpers
 * -----------------------------------------------------------------------------------------------*/
/**
 * Vertex dots of the filled demos. The Pro demos render them with the polygon's 15% fill opacity
 * (older Recharts let dots inherit it); the Recharts 3.11 used here paints dots opaque unless
 * `fillOpacity` is given, so it is set explicitly to keep the same look.
 */
const seriesDot = {fillOpacity: 0.15, r: 3, strokeWidth: 0};

type LegendItem = {color: string; label: string};

const Legend = ({items}: {items: LegendItem[]}) => (
  <div className="flex items-center gap-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-1.5">
        <span className="size-3 rounded-full" style={{backgroundColor: item.color}} />
        <span className="text-xs text-muted">{item.label}</span>
      </div>
    ))}
  </div>
);

const ChartCard = ({
  children,
  className,
  legend,
  title,
}: {
  children: React.ReactNode;
  className: string;
  legend?: LegendItem[];
  title: string;
}) => (
  <Card className={`${className} rounded-2xl`}>
    <Card.Header className={legend ? "flex-row items-center justify-between" : undefined}>
      <Card.Title className="text-base">{title}</Card.Title>
      {legend ? <Legend items={legend} /> : null}
    </Card.Header>
    <Card.Content className="flex flex-col items-center">{children}</Card.Content>
  </Card>
);

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    height: {control: {max: 480, min: 160, step: 10, type: "range"}},
    width: {control: "text"},
  },
  args: {data: attributes},
  component: RadarChart,
  parameters: {layout: "centered"},
  title: "Pro/Charts/RadarChart",
} satisfies Meta<typeof RadarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories (one per Pro demo)
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {data: attributes, height: 280},
  render: (args) => (
    <ChartCard className="w-[420px]" title="Player Attributes">
      <RadarChart {...args}>
        <RadarChart.Grid />
        <RadarChart.AngleAxis dataKey="attribute" />
        <RadarChart.Radar
          dataKey="rating"
          dot={seriesDot}
          fill="var(--chart-3)"
          fillOpacity={0.15}
          name="Rating"
          stroke="var(--chart-3)"
          strokeWidth={2}
        />
        <RadarChart.Tooltip content={<RadarChart.TooltipContent />} />
      </RadarChart>
    </ChartCard>
  ),
};

export const DotsOnly: Story = {
  render: () => (
    <ChartCard className="w-[420px]" title="Quality Scores">
      <RadarChart data={qualityScores} height={280}>
        <RadarChart.Grid />
        <RadarChart.AngleAxis dataKey="metric" />
        <RadarChart.Radar
          dataKey="score"
          dot={{fill: "var(--chart-3)", r: 4, strokeWidth: 0}}
          fill="none"
          name="Score"
          stroke="var(--chart-3)"
          strokeWidth={2}
        />
        <RadarChart.Tooltip content={<RadarChart.TooltipContent />} />
      </RadarChart>
    </ChartCard>
  ),
};

export const WithRadiusAxis: Story = {
  render: () => (
    <ChartCard
      className="w-[460px]"
      title="Release Readiness"
      legend={[
        {color: "var(--chart-4)", label: "Actual"},
        {color: "var(--chart-1)", label: "Planned"},
      ]}
    >
      <RadarChart data={readiness}>
        <RadarChart.Grid />
        <RadarChart.AngleAxis dataKey="area" />
        <RadarChart.RadiusAxis angle={90} />
        <RadarChart.Radar
          dataKey="actual"
          dot={seriesDot}
          fill="var(--chart-4)"
          fillOpacity={0.15}
          name="Actual"
          stroke="var(--chart-4)"
          strokeWidth={2}
        />
        <RadarChart.Radar
          dataKey="planned"
          dot={seriesDot}
          fill="var(--chart-1)"
          fillOpacity={0.15}
          name="Planned"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
        <RadarChart.Tooltip content={<RadarChart.TooltipContent />} />
      </RadarChart>
    </ChartCard>
  ),
};

export const MultiSeries: Story = {
  render: () => (
    <ChartCard
      className="w-[480px]"
      title="Traffic Sources"
      legend={[
        {color: "var(--chart-4)", label: "Organic"},
        {color: "var(--chart-3)", label: "Paid"},
        {color: "var(--chart-1)", label: "Referral"},
      ]}
    >
      <RadarChart data={traffic}>
        <RadarChart.Grid />
        <RadarChart.AngleAxis dataKey="month" />
        <RadarChart.Radar
          dataKey="organic"
          fill="var(--chart-4)"
          fillOpacity={0.1}
          name="Organic"
          stroke="var(--chart-4)"
          strokeWidth={2}
        />
        <RadarChart.Radar
          dataKey="paid"
          fill="var(--chart-3)"
          fillOpacity={0.1}
          name="Paid"
          stroke="var(--chart-3)"
          strokeWidth={2}
        />
        <RadarChart.Radar
          dataKey="referral"
          fill="var(--chart-1)"
          fillOpacity={0.1}
          name="Referral"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
        <RadarChart.Tooltip content={<RadarChart.TooltipContent />} />
      </RadarChart>
    </ChartCard>
  ),
};

export const Comparison: Story = {
  render: () => (
    <ChartCard
      className="w-[460px]"
      title="Vendor Comparison"
      legend={[
        {color: "var(--chart-3)", label: "Vendor X"},
        {color: "var(--chart-1)", label: "Vendor Y"},
      ]}
    >
      <RadarChart data={vendors}>
        <RadarChart.Grid />
        <RadarChart.AngleAxis dataKey="criterion" />
        <RadarChart.Radar
          dataKey="vendorX"
          dot={seriesDot}
          fill="var(--chart-3)"
          fillOpacity={0.15}
          name="Vendor X"
          stroke="var(--chart-3)"
          strokeWidth={2}
        />
        <RadarChart.Radar
          dataKey="vendorY"
          dot={seriesDot}
          fill="var(--chart-1)"
          fillOpacity={0.15}
          name="Vendor Y"
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
        <RadarChart.Tooltip content={<RadarChart.TooltipContent />} />
      </RadarChart>
    </ChartCard>
  ),
};
