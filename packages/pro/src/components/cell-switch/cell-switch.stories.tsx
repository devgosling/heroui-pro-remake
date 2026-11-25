import type {Meta, StoryObj} from "@storybook/react";

import {Chip} from "@heroui/react";
import React, {useState} from "react";

import {CellSwitch} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    variant: {control: {type: "select"}, options: ["default", "secondary"]},
  },
  component: CellSwitch,
  parameters: {layout: "centered"},
  title: "Pro/Forms/CellSwitch",
} satisfies Meta<typeof CellSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

const preferences = [
  {defaultSelected: true, id: "autosave", label: "Auto-save"},
  {defaultSelected: false, id: "spellcheck", label: "Spell check"},
  {defaultSelected: true, id: "shortcuts", label: "Keyboard shortcuts"},
];

/* Docs "Usage": a stack of default cells */
export const SettingsGroup: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      {preferences.map((item) => (
        <CellSwitch
          key={item.id}
          {...args}
          aria-label={item.label}
          defaultSelected={item.defaultSelected}
        >
          <CellSwitch.Trigger>
            <CellSwitch.Label>{item.label}</CellSwitch.Label>
            <CellSwitch.Control />
          </CellSwitch.Trigger>
        </CellSwitch>
      ))}
    </div>
  ),
};

export const FeatureAnnouncement: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <CellSwitch
        {...args}
        aria-label="Enable focus mode"
        className="relative h-auto rounded-xl border border-border"
      >
        <CellSwitch.Trigger className="h-auto bg-transparent py-2 shadow-none">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-1 text-sm font-semibold">
              Enable focus mode
              <Chip className="h-4 px-0.5 text-[10px]" color="accent" size="sm" variant="soft">
                Beta
              </Chip>
            </span>
            <span className="text-xs font-normal text-wrap text-muted">
              Mute notifications and hide badges while you work.
            </span>
          </div>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
    </div>
  ),
};

export const SecondaryGroup: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      <CellSwitch {...args} defaultSelected aria-label="Push alerts">
        <CellSwitch.Trigger>
          <CellSwitch.Label>Push alerts</CellSwitch.Label>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
      <CellSwitch {...args} aria-label="Weekly digest">
        <CellSwitch.Trigger>
          <CellSwitch.Label>Weekly digest</CellSwitch.Label>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
    </div>
  ),
};

export const Basic: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellSwitch {...args} defaultSelected aria-label="Dark mode">
        <CellSwitch.Trigger>
          <CellSwitch.Label>Dark mode</CellSwitch.Label>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-3">
      {(["default", "secondary"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{variant}</span>
          <CellSwitch {...args} defaultSelected aria-label="Dark mode" variant={variant}>
            <CellSwitch.Trigger>
              <CellSwitch.Label>Dark mode</CellSwitch.Label>
              <CellSwitch.Control />
            </CellSwitch.Trigger>
          </CellSwitch>
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      <CellSwitch {...args} defaultSelected isDisabled aria-label="Dark mode">
        <CellSwitch.Trigger>
          <CellSwitch.Label>Dark mode</CellSwitch.Label>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
      <CellSwitch {...args} isDisabled aria-label="Dark mode">
        <CellSwitch.Trigger>
          <CellSwitch.Label>Dark mode</CellSwitch.Label>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
    </div>
  ),
};

const ControlledDemo = (args: Story["args"]) => {
  const [isSelected, setIsSelected] = useState(true);

  return (
    <div className="flex w-[252px] flex-col gap-2">
      <CellSwitch {...args} aria-label="Dark mode" isSelected={isSelected} onChange={setIsSelected}>
        <CellSwitch.Trigger>
          <CellSwitch.Label>Dark mode</CellSwitch.Label>
          <CellSwitch.Control />
        </CellSwitch.Trigger>
      </CellSwitch>
      <p className="px-1 text-sm text-muted">Dark mode: {isSelected ? "On" : "Off"}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};
