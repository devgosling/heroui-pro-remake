import type {LoaderVariant} from "./loader-drawings";
import type {Meta, StoryObj} from "@storybook/react";

import React from "react";

import {TextShimmer} from "../text-shimmer";

import {Loader} from "./index";

const VARIANTS: LoaderVariant[] = [
  "ring",
  "classic",
  "dots",
  "pulse",
  "scan",
  "grid",
  "shuffle",
  "wave",
  "sparkle",
  "atom",
  "morph",
  "helix",
  "twist",
  "infinity",
];

const meta = {
  argTypes: {
    color: {
      control: {type: "select"},
      options: ["accent", "current", "success", "warning", "danger"],
    },
    label: {control: "text"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
    variant: {control: {type: "select"}, options: VARIANTS},
  },
  component: Loader,
  parameters: {layout: "centered"},
  title: "Pro/AI/Loader",
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

// Hidden status text per variant (what a screen reader announces).
const STATUS: Record<LoaderVariant, string> = {
  atom: "Weighing options",
  classic: "Syncing",
  dots: "Getting ready",
  grid: "Running the pipeline",
  helix: "Mapping dependencies",
  infinity: "Thinking it over",
  morph: "Sketching an outline",
  pulse: "Waiting for a reply",
  ring: "Loading",
  scan: "Scanning a document",
  shuffle: "Sorting results",
  sparkle: "Generating",
  twist: "Crunching numbers",
  wave: "Transcribing",
};

export const Default: Story = {
  args: {color: "accent", size: "lg"},
  render: (args) => (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-7">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col items-center gap-2">
          <Loader aria-label={STATUS[variant]} {...args} variant={variant} />
          <code className="text-xs text-muted">{variant}</code>
        </div>
      ))}
    </div>
  ),
};

const LABELS: Array<[LoaderVariant, string]> = [
  ["classic", "Pulling the latest changes"],
  ["scan", "Scanning invoice-0420.pdf"],
  ["grid", "Step 2 of 4: indexing"],
  ["shuffle", "Sorting your inbox"],
  ["wave", "Transcribing audio"],
  ["sparkle", "Writing a first draft"],
  ["atom", "Comparing three approaches"],
  ["morph", "Outlining the essay"],
  ["helix", "Tracing the call graph"],
  ["twist", "Crunching the numbers"],
];

export const WithLabel: Story = {
  args: {size: "sm"},
  render: (args) => (
    <div className="flex flex-col gap-3">
      {LABELS.map(([variant, label]) => (
        <Loader key={variant} {...args} label={label} variant={variant} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  args: {variant: "grid"},
  render: (args) => (
    <div className="flex items-end gap-8">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Loader {...args} size={size} />
          <code className="text-xs text-muted">{size}</code>
        </div>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  args: {size: "lg", variant: "classic"},
  render: (args) => (
    <div className="flex items-end gap-8">
      {(["accent", "current", "success", "warning", "danger"] as const).map((color) => (
        <div key={color} className="flex flex-col items-center gap-2">
          <Loader {...args} color={color} />
          <code className="text-xs text-muted">{color}</code>
        </div>
      ))}
    </div>
  ),
};

export const Composition: Story = {
  args: {size: "sm", variant: "infinity"},
  render: (args) => (
    <Loader {...args}>
      <Loader.Indicator />
      <Loader.Label>
        <TextShimmer>Pondering</TextShimmer>
      </Loader.Label>
    </Loader>
  ),
};
