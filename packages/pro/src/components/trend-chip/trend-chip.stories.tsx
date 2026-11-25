import type {Meta, StoryObj} from "@storybook/react";

import {Icon} from "@iconify/react";
import React from "react";

import {TrendChip} from "./index";

const meta = {
  argTypes: {
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
    trend: {control: {type: "select"}, options: ["up", "down", "neutral"]},
    variant: {control: {type: "select"}, options: ["primary", "secondary", "soft", "tertiary"]},
  },
  component: TrendChip,
  parameters: {layout: "centered"},
  title: "Pro/Feedback/TrendChip",
} satisfies Meta<typeof TrendChip>;

export default meta;

type Story = StoryObj<typeof meta>;

const Trio = ({variant}: {variant?: "primary" | "secondary" | "soft" | "tertiary"}) => (
  <>
    <TrendChip trend="up" variant={variant}>
      +4.8%
    </TrendChip>
    <TrendChip trend="down" variant={variant}>
      -1.6%
    </TrendChip>
    <TrendChip trend="neutral" variant={variant}>
      0.0%
    </TrendChip>
  </>
);

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3 rounded-2xl p-6">
      <Trio />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(["primary", "secondary", "tertiary", "soft"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-20 text-xs text-muted">{variant}</span>
          <Trio variant={variant} />
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["sm", "md", "lg"] as const).map((size) => (
        <TrendChip key={size} size={size} trend="up">
          +4.8%
        </TrendChip>
      ))}
    </div>
  ),
};

export const PrefixAndSuffix: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <TrendChip trend="up">
        <TrendChip.Prefix>+€</TrendChip.Prefix>
        2,310
      </TrendChip>
      <TrendChip trend="down">
        -3.4%
        <TrendChip.Suffix>vs last quarter</TrendChip.Suffix>
      </TrendChip>
      <TrendChip trend="up">
        <TrendChip.Prefix>+</TrendChip.Prefix>
        12.0%
        <TrendChip.Suffix>YoY</TrendChip.Suffix>
      </TrendChip>
    </div>
  ),
};

export const TabularNums: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <TrendChip trend="up">+1.1%</TrendChip>
      <TrendChip trend="up">+11.8%</TrendChip>
      <TrendChip trend="down">-118.0%</TrendChip>
      <TrendChip trend="neutral">0.0%</TrendChip>
    </div>
  ),
};

export const CustomIndicator: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <TrendChip trend="up">
        <TrendChip.Indicator>
          <Icon icon="gravity-ui:arrow-up" />
        </TrendChip.Indicator>
        +4.8%
      </TrendChip>
      <TrendChip trend="down">
        <TrendChip.Indicator>
          <Icon icon="gravity-ui:arrow-down" />
        </TrendChip.Indicator>
        -1.6%
      </TrendChip>
      <TrendChip trend="up">
        <TrendChip.Indicator>
          <Icon icon="gravity-ui:rocket" />
        </TrendChip.Indicator>
        +32.0%
      </TrendChip>
      <TrendChip trend="neutral">
        <TrendChip.Indicator>
          <Icon icon="gravity-ui:pause" />
        </TrendChip.Indicator>
        0.0%
      </TrendChip>
    </div>
  ),
};
