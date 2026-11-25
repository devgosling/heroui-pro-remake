import type {Meta, StoryObj} from "@storybook/react";

import React from "react";

import {TextShimmer} from "./index";

const meta = {
  argTypes: {
    children: {control: {type: "text"}, description: "Text content"},
    className: {
      control: {type: "text"},
      description: "Additional classes, including colour and text size utilities",
    },
  },
  args: {
    children: "Reasoning...",
  },
  component: TextShimmer,
  parameters: {layout: "centered"},
  title: "Pro/AI/TextShimmer",
} satisfies Meta<typeof TextShimmer>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Pro demo "default": two short status labels stacked in a small-text column. */
export const Default: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4 text-sm text-foreground">
      <TextShimmer {...args} />
      <TextShimmer>Searching the knowledge base...</TextShimmer>
    </div>
  ),
};

/* Docs "Color" section: the shimmer follows `currentColor`, so text colour utilities apply. */
export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm text-foreground">
      <TextShimmer className="text-muted">Planning next steps...</TextShimmer>
      <TextShimmer className="text-accent">Calling tools...</TextShimmer>
      <TextShimmer className="text-success">Writing summary...</TextShimmer>
      <TextShimmer className="text-lg font-medium">Drafting answer...</TextShimmer>
    </div>
  ),
};
