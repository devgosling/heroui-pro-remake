import type {Meta, StoryObj} from "@storybook/react";

import React, {useState} from "react";

import {CellSlider} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    step: {control: {type: "number"}},
    variant: {control: {type: "select"}, options: ["default", "secondary"]},
  },
  component: CellSlider,
  parameters: {layout: "centered"},
  title: "Pro/Forms/CellSlider",
} satisfies Meta<typeof CellSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Two decimals, matching a 0.01 step */
const fractionFormat: Intl.NumberFormatOptions = {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
};

type CellProps = Story["args"] & {label: string; defaultValue: number};

const FractionCell = ({defaultValue, label, ...args}: CellProps) => (
  <CellSlider
    {...args}
    aria-label={label}
    defaultValue={defaultValue}
    formatOptions={fractionFormat}
    maxValue={1}
    minValue={0}
    step={0.01}
  >
    <CellSlider.Track>
      <CellSlider.Fill />
      <CellSlider.Thumb />
      <CellSlider.Label>{label}</CellSlider.Label>
      <CellSlider.Output />
    </CellSlider.Track>
  </CellSlider>
);

const typographyGroups = [
  {
    cells: [
      {defaultValue: 0.6, label: "Line Height"},
      {defaultValue: 0.25, label: "Letter Spacing"},
    ],
    title: "Typography",
  },
  {
    cells: [
      {defaultValue: 0.4, label: "Shadow Blur"},
      {defaultValue: 0.8, label: "Surface Opacity"},
    ],
    title: "Effects",
  },
];

/* Docs "Usage": captioned groups of default cells */
export const SettingsGroup: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-4">
      {typographyGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <span className="text-sm text-muted">{group.title}</span>
          {group.cells.map((cell) => (
            <FractionCell key={cell.label} {...args} {...cell} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const SecondaryGroup: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      <FractionCell {...args} defaultValue={0.6} label="Line Height" />
      <FractionCell {...args} defaultValue={0.25} label="Letter Spacing" />
    </div>
  ),
};

export const Basic: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <FractionCell {...args} defaultValue={0.6} label="Line Height" />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-3">
      {(["default", "secondary"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{variant}</span>
          <FractionCell {...args} defaultValue={0.6} label="Line Height" variant={variant} />
        </div>
      ))}
    </div>
  ),
};

export const IntegerStep: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellSlider
        {...args}
        aria-label="Brightness"
        defaultValue={60}
        maxValue={100}
        minValue={0}
        step={1}
      >
        <CellSlider.Track>
          <CellSlider.Fill />
          <CellSlider.Thumb />
          <CellSlider.Label>Brightness</CellSlider.Label>
          <CellSlider.Output />
        </CellSlider.Track>
      </CellSlider>
    </div>
  ),
};

export const Disabled: Story = {
  args: {isDisabled: true},
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      <FractionCell {...args} defaultValue={0.6} label="Line Height" />
      <FractionCell {...args} defaultValue={0.25} label="Letter Spacing" />
    </div>
  ),
};

const ControlledDemo = (args: Story["args"]) => {
  const [value, setValue] = useState(0.6);

  return (
    <div className="flex w-[252px] flex-col gap-2">
      <CellSlider
        {...args}
        aria-label="Line Height"
        formatOptions={fractionFormat}
        maxValue={1}
        minValue={0}
        step={0.01}
        value={value}
        onChange={(next) => setValue(Array.isArray(next) ? next[0]! : next)}
      >
        <CellSlider.Track>
          <CellSlider.Fill />
          <CellSlider.Thumb />
          <CellSlider.Label>Line Height</CellSlider.Label>
          <CellSlider.Output />
        </CellSlider.Track>
      </CellSlider>
      <p className="px-1 text-sm text-muted">Line height: {value.toFixed(2)}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};
