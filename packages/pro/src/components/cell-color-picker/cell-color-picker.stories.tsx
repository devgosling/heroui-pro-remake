import type {Color} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";

import {
  ColorArea,
  ColorField,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
  parseColor,
} from "@heroui/react";
import React, {useState} from "react";

import {CellColorPicker} from "./index";

const meta: Meta<typeof CellColorPicker> = {
  argTypes: {
    variant: {control: {type: "select"}, options: ["default", "secondary"]},
  },
  component: CellColorPicker,
  parameters: {layout: "centered"},
  title: "Pro/Forms/CellColorPicker",
};

export default meta;

type Story = StoryObj<typeof CellColorPicker>;

/* Popover body shared by most demos: saturation/brightness area + hue slider */
const AreaAndHue = () => (
  <>
    <ColorArea
      aria-label="Color area"
      className="max-w-full"
      colorSpace="hsb"
      xChannel="saturation"
      yChannel="brightness"
    >
      <ColorArea.Thumb />
    </ColorArea>
    <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
      <Label>Hue</Label>
      <ColorSlider.Output className="text-muted" />
      <ColorSlider.Track>
        <ColorSlider.Thumb />
      </ColorSlider.Track>
    </ColorSlider>
  </>
);

const tokens = [
  {id: "primary", label: "Primary", value: "#6366F1"},
  {id: "warning", label: "Warning", value: "#F59E0B"},
  {id: "info", label: "Info", value: "#0EA5E9"},
];

/* Docs "Usage": a stack of default cells */
export const SettingsGroup: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      {tokens.map((token) => (
        <CellColorPicker key={token.id} {...args} defaultValue={token.value}>
          <CellColorPicker.Trigger>
            <CellColorPicker.Label>{token.label}</CellColorPicker.Label>
            <CellColorPicker.ValueDisplay />
            <CellColorPicker.Swatch />
          </CellColorPicker.Trigger>
          <CellColorPicker.Popover>
            <AreaAndHue />
          </CellColorPicker.Popover>
        </CellColorPicker>
      ))}
    </div>
  ),
};

const palette = [
  "#64748B", // slate-500
  "#DC2626", // red-600
  "#D97706", // amber-600
  "#65A30D", // lime-600
  "#0D9488", // teal-600
  "#6366F1", // indigo-500
  "#A855F7", // purple-500
  "#DB2777", // pink-600
  "#78716C", // stone-500
];

export const WithPresets: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellColorPicker {...args} defaultValue="#6366F1">
        <CellColorPicker.Trigger>
          <CellColorPicker.Label>Highlight</CellColorPicker.Label>
          <CellColorPicker.ValueDisplay />
          <CellColorPicker.Swatch />
        </CellColorPicker.Trigger>
        <CellColorPicker.Popover>
          <ColorSwatchPicker aria-label="Preset colors" className="justify-center pt-2" size="xs">
            {palette.map((preset) => (
              <ColorSwatchPicker.Item key={preset} color={preset}>
                <ColorSwatchPicker.Swatch />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
          <AreaAndHue />
          <ColorField aria-label="Hex code">
            <ColorField.Group variant="secondary">
              <ColorField.Prefix>
                <ColorSwatch size="xs" />
              </ColorField.Prefix>
              <ColorField.Input />
            </ColorField.Group>
          </ColorField>
        </CellColorPicker.Popover>
      </CellColorPicker>
    </div>
  ),
};

export const Basic: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellColorPicker {...args} defaultValue="#10B981">
        <CellColorPicker.Trigger>
          <CellColorPicker.Label>Theme color</CellColorPicker.Label>
          <CellColorPicker.ValueDisplay />
          <CellColorPicker.Swatch />
        </CellColorPicker.Trigger>
        <CellColorPicker.Popover>
          <AreaAndHue />
        </CellColorPicker.Popover>
      </CellColorPicker>
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-3">
      {(["default", "secondary"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{variant}</span>
          <CellColorPicker {...args} defaultValue="#10B981" variant={variant}>
            <CellColorPicker.Trigger>
              <CellColorPicker.Label>Theme color</CellColorPicker.Label>
              <CellColorPicker.ValueDisplay />
              <CellColorPicker.Swatch />
            </CellColorPicker.Trigger>
            <CellColorPicker.Popover>
              <AreaAndHue />
            </CellColorPicker.Popover>
          </CellColorPicker>
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellColorPicker {...args} defaultValue="#10B981">
        <CellColorPicker.Trigger isDisabled>
          <CellColorPicker.Label>Theme color</CellColorPicker.Label>
          <CellColorPicker.ValueDisplay />
          <CellColorPicker.Swatch />
        </CellColorPicker.Trigger>
        <CellColorPicker.Popover>
          <AreaAndHue />
        </CellColorPicker.Popover>
      </CellColorPicker>
    </div>
  ),
};

const ControlledDemo = (args: Story["args"]) => {
  const [color, setColor] = useState<Color>(() => parseColor("#10B981"));

  return (
    <div className="flex w-[252px] flex-col gap-2">
      <CellColorPicker {...args} value={color} onChange={setColor}>
        <CellColorPicker.Trigger>
          <CellColorPicker.Label>Theme color</CellColorPicker.Label>
          <CellColorPicker.ValueDisplay />
          <CellColorPicker.Swatch />
        </CellColorPicker.Trigger>
        <CellColorPicker.Popover>
          <AreaAndHue />
        </CellColorPicker.Popover>
      </CellColorPicker>
      <p className="px-1 text-sm text-muted">Current: {color.toString("hex")}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};
