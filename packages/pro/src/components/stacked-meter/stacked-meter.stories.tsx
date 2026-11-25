import type {StackedMeterSegmentData} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button} from "@heroui/react";
import React from "react";

import {StackedMeter} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Demo data
 * -----------------------------------------------------------------------------------------------*/
const LANGUAGES: StackedMeterSegmentData[] = [
  {id: "ts", label: "TypeScript", value: 58.7},
  {id: "rust", label: "Rust", value: 18.9},
  {id: "python", label: "Python", value: 11.2},
  {id: "css", label: "CSS", value: 7.6},
  {id: "shell", label: "Shell", value: 3.6},
];

const TICKETS: StackedMeterSegmentData[] = [
  {color: "success", id: "resolved", label: "Resolved", value: 21},
  {color: "warning", id: "pending", label: "Pending", value: 7},
  {color: "danger", id: "escalated", label: "Escalated", value: 3},
  {color: "default", id: "unassigned", label: "Unassigned", value: 8},
  {colorClassName: "bg-[#8b5cf6]", id: "waiting", label: "Waiting", value: 4},
];

const STORAGE: StackedMeterSegmentData[] = [
  {id: "photos", label: "Photos", value: 42.6},
  {id: "apps", label: "Apps", value: 23.1},
  {id: "system", label: "System", value: 14.2},
  {id: "messages", label: "Messages", value: 9.8},
];

const CHANGED_FILES: StackedMeterSegmentData[] = [
  {id: "components", label: "Components", value: 42},
  {id: "tests", label: "Tests", value: 18},
  {id: "stories", label: "Stories", value: 11},
  {id: "docs", label: "Docs", value: 6},
];

const REPOSITORY: StackedMeterSegmentData[] = [
  {colorClassName: "bg-[#00add8]", id: "go", label: "Go", value: 81.5},
  {colorClassName: "bg-[#e34c26]", id: "html", label: "HTML", value: 12.3},
  {colorClassName: "bg-[#427819]", id: "make", label: "Makefile", value: 6.2},
];

/* -------------------------------------------------------------------------------------------------
 * Layout helpers
 * -----------------------------------------------------------------------------------------------*/

/** Width of the Native demo screen's content (402dp phone minus 2 x 20dp padding). */
const Column = ({children}: {children: ReactNode}) => (
  <div className="w-[362px] max-w-full">{children}</div>
);

/** Phone-sized screen, like the Native demo app. */
const PhoneScreen = ({children}: {children: ReactNode}) => (
  <div className="relative flex h-[720px] w-[min(390px,calc(100vw-2rem))] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-separator bg-background px-5">
    {children}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    animation: {control: {type: "select"}, options: [undefined, "disable-all"]},
    isDisabled: {control: "boolean"},
    maxValue: {control: {type: "number"}},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: StackedMeter,
  parameters: {layout: "centered"},
  title: "Pro/Charts/StackedMeter",
} satisfies Meta<typeof StackedMeter>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories (one per docs usage example + the Example section)
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {segments: LANGUAGES, size: "md"},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>
        <StackedMeter.Label>Languages</StackedMeter.Label>
        <StackedMeter.Track />
        <StackedMeter.Legend />
      </StackedMeter>
    </Column>
  ),
};

export const StringChildren: Story = {
  args: {segments: LANGUAGES},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>Repository languages</StackedMeter>
    </Column>
  ),
};

export const Sizes: Story = {
  args: {segments: LANGUAGES},
  render: (args) => (
    <Column>
      <div className="flex flex-col gap-8">
        <StackedMeter {...args} size="sm">
          Small
        </StackedMeter>
        <StackedMeter {...args} size="md">
          Medium
        </StackedMeter>
        <StackedMeter {...args} size="lg">
          Large
        </StackedMeter>
      </div>
    </Column>
  ),
};

export const Colors: Story = {
  // The Native demo shows this variant with the large track.
  args: {formatOptions: {style: "decimal"}, segments: TICKETS, size: "lg"},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>Support tickets</StackedMeter>
    </Column>
  ),
};

export const Capacity: Story = {
  args: {
    formatOptions: {maximumFractionDigits: 1, style: "unit", unit: "gigabyte"},
    maxValue: 128,
    segments: STORAGE,
  },
  render: (args) => (
    <Column>
      <StackedMeter {...args}>iPhone storage</StackedMeter>
    </Column>
  ),
};

export const CustomLegend: Story = {
  args: {segments: CHANGED_FILES},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>
        <StackedMeter.Track />
        <StackedMeter.Legend className="flex-col items-stretch gap-y-3">
          {(segment) => (
            <StackedMeter.LegendItem className="justify-between">
              <div className="flex items-center gap-2">
                <StackedMeter.LegendIndicator />
                <StackedMeter.LegendLabel />
              </div>
              <StackedMeter.LegendValue>{segment.value} files</StackedMeter.LegendValue>
            </StackedMeter.LegendItem>
          )}
        </StackedMeter.Legend>
      </StackedMeter>
    </Column>
  ),
};

export const TrackOnly: Story = {
  args: {"aria-label": "Languages", segments: LANGUAGES},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>
        <StackedMeter.Track />
      </StackedMeter>
    </Column>
  ),
};

export const Disabled: Story = {
  args: {isDisabled: true, segments: LANGUAGES},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>Languages</StackedMeter>
    </Column>
  ),
};

export const RenderFunctionChildren: Story = {
  args: {segments: LANGUAGES},
  render: (args) => (
    <Column>
      <StackedMeter {...args}>
        {({segments, summaryText, total}) => (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">
                {segments.length} languages
              </span>
              <span className="text-xs text-muted tabular-nums">Total {total.toFixed(1)}</span>
            </div>
            <StackedMeter.Track />
            <p className="text-sm text-muted">{summaryText}</p>
          </>
        )}
      </StackedMeter>
    </Column>
  ),
};

export const Example: Story = {
  args: {segments: REPOSITORY},
  parameters: {layout: "centered"},
  render: (args) => (
    <PhoneScreen>
      <div className="w-80 max-w-full">
        <StackedMeter {...args}>
          <StackedMeter.Label>Languages</StackedMeter.Label>
          <StackedMeter.Track />
          <StackedMeter.Legend />
        </StackedMeter>
      </div>
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Extra: value changes animate the shares (300 ms ease-in-out, like Native withTiming)
 * -----------------------------------------------------------------------------------------------*/
const randomize = (segments: StackedMeterSegmentData[]) =>
  segments.map((segment) => ({...segment, value: Math.round(Math.random() * 400) / 10 + 2}));

const AnimatedValuesDemo = (props: Omit<StackedMeter["Props"], "segments">) => {
  const [segments, setSegments] = React.useState(LANGUAGES);

  return (
    <Column>
      <div className="flex flex-col gap-6">
        <StackedMeter {...props} segments={segments}>
          Languages
        </StackedMeter>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => setSegments(randomize(LANGUAGES))}>
            Shuffle values
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setSegments(LANGUAGES)}>
            Reset
          </Button>
        </div>
      </div>
    </Column>
  );
};

export const AnimatedValues: Story = {
  args: {segments: LANGUAGES},
  render: ({segments: _segments, ...args}) => <AnimatedValuesDemo {...args} />,
};
