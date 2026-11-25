import type {Key} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";

import {ListBox} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {CellSelect} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    variant: {control: {type: "select"}, options: ["default", "secondary"]},
  },
  component: CellSelect,
  parameters: {layout: "centered"},
  title: "Pro/Forms/CellSelect",
} satisfies Meta<typeof CellSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

type Option = {id: string; label: string};

const OptionList = ({options}: {options: Option[]}) => (
  <ListBox>
    {options.map((option) => (
      <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
        {option.label}
        <ListBox.ItemIndicator />
      </ListBox.Item>
    ))}
  </ListBox>
);

/* -------------------------------------------------------------------------------------------------
 * Settings group (docs "Usage")
 * -----------------------------------------------------------------------------------------------*/
const preferences: {defaultValue: string; id: string; label: string; options: Option[]}[] = [
  {
    defaultValue: "home",
    id: "start-page",
    label: "Start page",
    options: [
      {id: "home", label: "Home"},
      {id: "inbox", label: "Inbox"},
      {id: "projects", label: "Projects"},
    ],
  },
  {
    defaultValue: "utc",
    id: "time-zone",
    label: "Time zone",
    options: [
      {id: "utc", label: "UTC"},
      {id: "cet", label: "CET"},
      {id: "pst", label: "PST"},
    ],
  },
  {
    defaultValue: "cozy",
    id: "density",
    label: "Density",
    options: [
      {id: "compact", label: "Compact"},
      {id: "cozy", label: "Cozy"},
      {id: "roomy", label: "Roomy"},
    ],
  },
];

export const SettingsGroup: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      {preferences.map((item) => (
        <CellSelect
          key={item.id}
          {...args}
          aria-label={item.label}
          defaultValue={item.defaultValue}
        >
          <CellSelect.Trigger>
            <CellSelect.Label>{item.label}</CellSelect.Label>
            <CellSelect.Value />
            <CellSelect.Indicator />
          </CellSelect.Trigger>
          <CellSelect.Popover>
            <OptionList options={item.options} />
          </CellSelect.Popover>
        </CellSelect>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Font family: custom Value content (name + sample glyphs), no Indicator
 * -----------------------------------------------------------------------------------------------*/
const typefaces: Option[] = [
  {id: "geist", label: "Geist"},
  {id: "manrope", label: "Manrope"},
  {id: "lora", label: "Lora"},
  {id: "fira-code", label: "Fira Code"},
];

const TypefaceValue = () => (
  <CellSelect.Value>
    {({selectedText}) => (
      <span className="flex items-center justify-end gap-1.5 text-end">
        {selectedText}
        <span className="text-sm font-medium text-foreground">Aa</span>
      </span>
    )}
  </CellSelect.Value>
);

export const FontFamily: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-2">
      <span className="text-sm text-muted">Typography</span>
      <CellSelect {...args} aria-label="Title typeface" defaultValue="geist">
        <CellSelect.Trigger>
          <CellSelect.Label>Titles</CellSelect.Label>
          <TypefaceValue />
        </CellSelect.Trigger>
        <CellSelect.Popover>
          <OptionList options={typefaces} />
        </CellSelect.Popover>
      </CellSelect>
      <CellSelect {...args} aria-label="Body typeface" defaultValue="geist" variant="secondary">
        <CellSelect.Trigger>
          <CellSelect.Label>Body text</CellSelect.Label>
          <TypefaceValue />
        </CellSelect.Trigger>
        <CellSelect.Popover>
          <OptionList options={typefaces} />
        </CellSelect.Popover>
      </CellSelect>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Basic
 * -----------------------------------------------------------------------------------------------*/
const weekStarts: Option[] = [
  {id: "monday", label: "Monday"},
  {id: "sunday", label: "Sunday"},
  {id: "saturday", label: "Saturday"},
];

export const Basic: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellSelect {...args} aria-label="Week starts on" defaultValue="monday">
        <CellSelect.Trigger>
          <CellSelect.Label>Week starts on</CellSelect.Label>
          <CellSelect.Value />
          <CellSelect.Indicator />
        </CellSelect.Trigger>
        <CellSelect.Popover>
          <OptionList options={weekStarts} />
        </CellSelect.Popover>
      </CellSelect>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
const currencies: Option[] = [
  {id: "usd", label: "USD"},
  {id: "eur", label: "EUR"},
  {id: "jpy", label: "JPY"},
];

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-[252px] flex-col gap-3">
      {(["default", "secondary"] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{variant}</span>
          <CellSelect {...args} aria-label="Currency" defaultValue="usd" variant={variant}>
            <CellSelect.Trigger>
              <CellSelect.Label>Currency</CellSelect.Label>
              <CellSelect.Value />
              <CellSelect.Indicator />
            </CellSelect.Trigger>
            <CellSelect.Popover>
              <OptionList options={currencies} />
            </CellSelect.Popover>
          </CellSelect>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
const regions: Option[] = [
  {id: "eu", label: "Europe"},
  {id: "us", label: "Americas"},
  {id: "apac", label: "Asia Pacific"},
];

export const Disabled: Story = {
  args: {isDisabled: true},
  render: (args) => (
    <div className="w-[252px]">
      <CellSelect {...args} aria-label="Data region" defaultValue="eu">
        <CellSelect.Trigger>
          <CellSelect.Label>Data region</CellSelect.Label>
          <CellSelect.Value />
          <CellSelect.Indicator />
        </CellSelect.Trigger>
        <CellSelect.Popover>
          <OptionList options={regions} />
        </CellSelect.Popover>
      </CellSelect>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
const sortOrders: Option[] = [
  {id: "recent", label: "Most recent"},
  {id: "oldest", label: "Oldest first"},
  {id: "name", label: "Name"},
];

const ControlledExample = (args: Story["args"]) => {
  const [sortOrder, setSortOrder] = React.useState<Key | null>("recent");
  const selectedLabel = sortOrders.find((order) => order.id === sortOrder)?.label ?? "None";

  return (
    <div className="flex w-[252px] flex-col gap-2">
      <CellSelect {...args} aria-label="Sort by" value={sortOrder} onChange={setSortOrder}>
        <CellSelect.Trigger>
          <CellSelect.Label>Sort by</CellSelect.Label>
          <CellSelect.Value />
          <CellSelect.Indicator />
        </CellSelect.Trigger>
        <CellSelect.Popover>
          <OptionList options={sortOrders} />
        </CellSelect.Popover>
      </CellSelect>
      <p className="px-1 text-sm text-muted">Selected: {selectedLabel}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Custom value: the selected item's icon replaces the Indicator
 * -----------------------------------------------------------------------------------------------*/
const views = [
  {icon: "gravity-ui:layout-columns-3", id: "board", label: "Board"},
  {icon: "gravity-ui:list-ul", id: "list", label: "List"},
  {icon: "gravity-ui:calendar", id: "calendar", label: "Calendar"},
];

export const CustomValue: Story = {
  render: (args) => (
    <div className="w-[252px]">
      <CellSelect {...args} aria-label="Default view" defaultValue="board">
        <CellSelect.Trigger>
          <CellSelect.Label>View</CellSelect.Label>
          <CellSelect.Value>
            {({selectedText}) => {
              const view = views.find((item) => item.label === selectedText);

              return (
                <span className="flex items-center justify-end gap-1.5 text-end">
                  {selectedText}
                  {view ? (
                    <span className="text-muted">
                      <Icon height={16} icon={view.icon} width={16} />
                    </span>
                  ) : null}
                </span>
              );
            }}
          </CellSelect.Value>
        </CellSelect.Trigger>
        <CellSelect.Popover>
          <ListBox>
            {views.map((view) => (
              <ListBox.Item key={view.id} id={view.id} textValue={view.label}>
                <Icon height={16} icon={view.icon} width={16} />
                {view.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </CellSelect.Popover>
      </CellSelect>
    </div>
  ),
};
