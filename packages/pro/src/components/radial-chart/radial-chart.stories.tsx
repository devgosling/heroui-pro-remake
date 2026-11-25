import type {Meta, StoryObj} from "@storybook/react";

import {Card} from "@heroui/react";
import React from "react";

import {RadialChart} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Data (story content is our own; structure mirrors the Pro demos)
 * -----------------------------------------------------------------------------------------------*/
const habitData = [
  {fill: "var(--chart-4)", name: "Reading", value: 410},
  {fill: "var(--chart-3)", name: "Workouts", value: 620},
  {fill: "var(--chart-2)", name: "Meditation", value: 505},
];

const habitSummary = [
  {label: "Reading", value: "4.1/7 hours"},
  {label: "Workouts", value: "4/5 sessions"},
  {label: "Meditation", value: "38/60 min"},
];

const storageData = [
  {fill: "var(--chart-4)", name: "Photos", value: 36},
  {fill: "var(--chart-3)", name: "Backups", value: 24},
  {fill: "var(--chart-2)", name: "Apps", value: 14},
];

const kpiGauges = [
  {color: "var(--chart-4)", max: 100, title: "Uptime", value: 82},
  {color: "var(--chart-3)", max: 4.2, title: "Retention", value: 2.73},
  {color: "var(--chart-2)", max: 100, title: "Churn", value: 22},
  {color: "var(--color-danger)", max: 100, title: "Disk", value: 88},
];

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    barSize: {control: {max: 40, min: 2, step: 1, type: "range"}},
    endAngle: {control: {max: 360, min: -360, step: 5, type: "range"}},
    height: {control: {max: 400, min: 80, step: 10, type: "range"}},
    innerRadius: {control: "text"},
    outerRadius: {control: "text"},
    startAngle: {control: {max: 360, min: -360, step: 5, type: "range"}},
    width: {control: "number"},
  },
  args: {
    barSize: 10,
    data: habitData,
    endAngle: -270,
    height: 200,
    innerRadius: "40%",
    outerRadius: "100%",
    startAngle: 90,
    width: 200,
  },
  component: RadialChart,
  parameters: {layout: "centered"},
  title: "Pro/Charts/RadialChart",
} satisfies Meta<typeof RadialChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <Card className="w-[380px] rounded-2xl">
      <Card.Header>
        <Card.Title className="text-base">Weekly Habits</Card.Title>
      </Card.Header>
      <Card.Content className="flex items-center gap-4">
        <div className="flex flex-1 flex-col gap-2 self-start">
          {habitSummary.map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className="text-xs text-muted">{item.label}</span>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="relative shrink-0">
          <RadialChart {...args}>
            <RadialChart.Bar background cornerRadius={5} dataKey="value">
              {args.data.map((entry) => (
                <RadialChart.Cell key={String(entry["name"])} fill={String(entry["fill"])} />
              ))}
            </RadialChart.Bar>
            <RadialChart.Tooltip content={<RadialChart.TooltipContent />} />
          </RadialChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted">Workouts</span>
            <span className="text-sm font-semibold text-foreground">4 sessions</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  ),
};

export const Gauge: Story = {
  render: () => {
    const max = 2400;
    const data = [{fill: "var(--chart-3)", name: "Requests", value: 1530}];

    return (
      <Card className="w-[280px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Throughput</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col items-center">
          <div className="relative">
            <RadialChart
              data={data}
              endAngle={-45}
              height={200}
              innerRadius="70%"
              outerRadius="90%"
              startAngle={225}
              width={200}
            >
              <RadialChart.AngleAxis domain={[0, max]} tick={false} type="number" />
              <RadialChart.Bar background cornerRadius={5} dataKey="value" fill="var(--chart-3)" />
              <RadialChart.Tooltip content={<RadialChart.TooltipContent />} />
            </RadialChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-muted">Requests / min</span>
              <span className="text-xl font-bold text-foreground">{max.toLocaleString()}</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  },
};

export const ProgressRing: Story = {
  render: () => {
    const goal = 5000;
    const saved = 3150;
    const percent = Math.round((saved / goal) * 100);
    // The ring holds the raw amount; the angle axis domain is the goal
    const data = [{fill: "var(--chart-3)", name: "Saved", value: saved}];

    return (
      <Card className="w-[300px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Savings Goal</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col items-center gap-3">
          <div className="relative">
            <RadialChart
              barSize={12}
              data={data}
              height={200}
              innerRadius="86%"
              outerRadius="100%"
              width={200}
            >
              <RadialChart.AngleAxis domain={[0, goal]} tick={false} type="number" />
              <RadialChart.Bar background cornerRadius={6} dataKey="value" fill="var(--chart-3)" />
              <RadialChart.Tooltip
                content={
                  <RadialChart.TooltipContent
                    valueFormatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                }
              />
            </RadialChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{percent}%</span>
              <span className="text-xs text-muted">
                ${saved.toLocaleString()} / ${goal.toLocaleString()}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  },
};

export const GaugeGrid: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-2 gap-3 lg:grid-cols-4">
      {kpiGauges.map((gauge) => (
        <Card key={gauge.title} className="rounded-2xl">
          <Card.Header className="pb-0">
            <Card.Title className="text-xs font-medium text-muted">{gauge.title}</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col items-center">
            <div className="relative">
              <RadialChart
                barSize={8}
                data={[{fill: gauge.color, name: gauge.title, value: gauge.value}]}
                endAngle={-45}
                height={120}
                innerRadius="70%"
                outerRadius="90%"
                startAngle={225}
                width={120}
              >
                <RadialChart.AngleAxis domain={[0, gauge.max]} tick={false} type="number" />
                <RadialChart.Bar background cornerRadius={4} dataKey="value" fill={gauge.color} />
                <RadialChart.Tooltip content={<RadialChart.TooltipContent />} />
              </RadialChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">
                  {Math.round((gauge.value / gauge.max) * 100)}%
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  ),
};

export const WithLegend: Story = {
  render: () => {
    const used = storageData.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <Card className="w-[400px] rounded-2xl">
        <Card.Header>
          <Card.Title className="text-base">Cloud Storage</Card.Title>
          <Card.Description className="text-xs text-muted">
            {used} GB of 100 GB used
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex items-center gap-6">
          <div className="relative shrink-0">
            <RadialChart
              data={storageData}
              height={180}
              innerRadius="40%"
              outerRadius="100%"
              width={180}
            >
              <RadialChart.Bar background cornerRadius={5} dataKey="value">
                {storageData.map((entry) => (
                  <RadialChart.Cell key={entry.name} fill={entry.fill} />
                ))}
              </RadialChart.Bar>
              <RadialChart.Tooltip
                content={<RadialChart.TooltipContent valueFormatter={(value) => `${value} GB`} />}
              />
            </RadialChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{used}</span>
              <span className="text-xs text-muted">GB used</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {storageData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{backgroundColor: entry.fill}}
                />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm text-foreground">{entry.name}</span>
                  <span className="text-sm font-semibold text-foreground">{entry.value} GB</span>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    );
  },
};
