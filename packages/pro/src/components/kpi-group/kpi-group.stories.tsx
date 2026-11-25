import type {Meta, StoryObj} from "@storybook/react";

import React from "react";

import {KPI} from "../kpi";

import {KPIGroup} from "./index";

const meta = {
  argTypes: {
    orientation: {control: {type: "select"}, options: ["horizontal", "vertical"]},
  },
  component: KPIGroup,
  parameters: {layout: "fullscreen"},
  title: "Pro/DataDisplay/KPIGroup",
} satisfies Meta<typeof KPIGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mirrors the demo page frame: content centred with a 24px gutter. */
const DemoFrame = ({children}: {children: React.ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6">{children}</div>
);

type Metric = {
  title: string;
  value: number;
  format?: Omit<KPI["ValueProps"], "value" | "children">;
  previous?: string;
  trend: "up" | "down" | "neutral";
  change: string;
};

const percent: Metric["format"] = {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "percent",
};

const audienceMetrics: Metric[] = [
  {change: "9%", previous: "from 44,231", title: "Active Readers", trend: "up", value: 48215},
  {
    change: "1.37%",
    format: percent,
    previous: "from 60.05%",
    title: "Avg. Read Rate",
    trend: "up",
    value: 0.6142,
  },
  {
    change: "0.42%",
    format: percent,
    previous: "from 3.28%",
    title: "Unsubscribe Rate",
    trend: "down",
    value: 0.0286,
  },
];

const financeMetrics: Metric[] = [
  {
    change: "+5.2%",
    format: {currency: "USD", maximumFractionDigits: 0, style: "currency"},
    title: "Bookings",
    trend: "up",
    value: 184260,
  },
  {
    change: "-2.4%",
    format: {currency: "USD", maximumFractionDigits: 0, style: "currency"},
    title: "Refunds",
    trend: "down",
    value: 19874,
  },
  {
    change: "+6.8%",
    format: {currency: "USD", maximumFractionDigits: 0, style: "currency"},
    title: "Net Income",
    trend: "up",
    value: 164386,
  },
];

const MetricCard = ({metric, withPrevious}: {metric: Metric; withPrevious?: boolean}) => {
  const value = <KPI.Value {...metric.format} value={metric.value} />;

  return (
    <KPI>
      <KPI.Header>
        <KPI.Title>{metric.title}</KPI.Title>
      </KPI.Header>
      <KPI.Content>
        {withPrevious ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            {value}
            <span className="text-sm text-muted">{metric.previous}</span>
          </div>
        ) : (
          value
        )}
        <KPI.Trend trend={metric.trend}>{metric.change}</KPI.Trend>
      </KPI.Content>
    </KPI>
  );
};

export const Horizontal: Story = {
  args: {orientation: "horizontal"},
  render: (args) => (
    <DemoFrame>
      <div className="w-[900px] rounded-2xl p-6">
        <KPIGroup {...args}>
          {audienceMetrics.map((metric, index) => (
            <React.Fragment key={metric.title}>
              {index > 0 && <KPIGroup.Separator />}
              <MetricCard metric={metric} />
            </React.Fragment>
          ))}
        </KPIGroup>
      </div>
    </DemoFrame>
  ),
};

export const Vertical: Story = {
  args: {orientation: "vertical"},
  render: (args) => (
    <DemoFrame>
      <div className="flex w-[400px] items-center justify-center rounded-2xl p-6">
        <KPIGroup {...args}>
          {financeMetrics.map((metric, index) => (
            <React.Fragment key={metric.title}>
              {index > 0 && <KPIGroup.Separator />}
              <MetricCard metric={metric} />
            </React.Fragment>
          ))}
        </KPIGroup>
      </div>
    </DemoFrame>
  ),
};

/**
 * A "from <previous value>" suffix next to each value. Below the `sm` breakpoint the row
 * stacks into a column and the separators turn into inset horizontal lines.
 */
export const WithFromSuffix: Story = {
  args: {orientation: "horizontal"},
  render: (args) => (
    <DemoFrame>
      <div className="w-full max-w-[900px] min-w-fit">
        <KPIGroup {...args} className="max-sm:flex-col">
          {audienceMetrics.map((metric, index) => (
            <React.Fragment key={metric.title}>
              {index > 0 && (
                <KPIGroup.Separator className="max-sm:mx-4 max-sm:my-0 max-sm:h-px max-sm:w-auto" />
              )}
              <MetricCard withPrevious metric={metric} />
            </React.Fragment>
          ))}
        </KPIGroup>
      </div>
    </DemoFrame>
  ),
};
