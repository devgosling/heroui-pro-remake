import type {Key} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";

import {Icon} from "@iconify/react";
import React from "react";

import {Segment} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
    variant: {control: {type: "select"}, options: ["default", "ghost"]},
  },
  component: Segment,
  parameters: {layout: "centered"},
  title: "Pro/Navigation/Segment",
} satisfies Meta<typeof Segment>;

export default meta;

type Story = StoryObj<typeof meta>;

const items = [
  {id: "overview", label: "Overview"},
  {id: "activity", label: "Activity"},
  {id: "billing", label: "Billing"},
  {id: "members", label: "Members"},
];

export const Default: Story = {
  args: {"aria-label": "Workspace section", defaultSelectedKey: "overview"},
  render: (args) => (
    <Segment {...args}>
      {items.map((item) => (
        <Segment.Item key={item.id} id={item.id}>
          {item.label}
        </Segment.Item>
      ))}
    </Segment>
  ),
};

export const ThemeSwitcher: Story = {
  render: () => (
    <Segment aria-label="Color scheme" defaultSelectedKey="system" size="sm">
      <Segment.Item aria-label="Light" id="light">
        <Icon icon="gravity-ui:sun-fill" />
      </Segment.Item>
      <Segment.Item aria-label="Dark" id="dark">
        <Icon icon="gravity-ui:moon-fill" />
      </Segment.Item>
      <Segment.Item aria-label="System" id="system">
        <Icon icon="gravity-ui:display" />
      </Segment.Item>
    </Segment>
  ),
};

export const TwoItems: Story = {
  render: () => (
    <Segment aria-label="Plan interval" defaultSelectedKey="month" size="sm">
      <Segment.Item id="month">Per month</Segment.Item>
      <Segment.Item id="year">Per year</Segment.Item>
    </Segment>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <span className="text-xs text-muted">{size}</span>
          <Segment aria-label={`Section (${size})`} defaultSelectedKey="overview" size={size}>
            {items.map((item) => (
              <Segment.Item key={item.id} id={item.id}>
                {item.label}
              </Segment.Item>
            ))}
          </Segment>
        </div>
      ))}
    </div>
  ),
};

export const Ghost: Story = {
  render: () => (
    <Segment aria-label="Time range" defaultSelectedKey="30d" size="sm" variant="ghost">
      {["24H", "7D", "30D", "90D", "6M", "1Y", "MAX"].map((range) => (
        <Segment.Item key={range} id={range.toLowerCase()}>
          {range}
        </Segment.Item>
      ))}
    </Segment>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Segment aria-label="View" defaultSelectedKey="board">
      <Segment.Item id="board">
        <Icon icon="gravity-ui:layout-columns-3" />
        Board
      </Segment.Item>
      <Segment.Item id="list">
        <Icon icon="gravity-ui:list-ul" />
        List
      </Segment.Item>
      <Segment.Item id="calendar">
        <Icon icon="gravity-ui:calendar" />
        Calendar
      </Segment.Item>
      <Segment.Item id="files">
        <Icon icon="gravity-ui:folder" />
        Files
      </Segment.Item>
    </Segment>
  ),
};

export const IconExpand: Story = {
  render: () => {
    const entries = [
      {icon: "gravity-ui:house", id: "home", label: "Home"},
      {icon: "gravity-ui:magnifier", id: "search", label: "Search"},
      {icon: "gravity-ui:bell", id: "alerts", label: "Alerts"},
      {icon: "gravity-ui:person", id: "profile", label: "Profile"},
    ];

    return (
      <Segment aria-label="Navigation" defaultSelectedKey="alerts" variant="ghost">
        {entries.map((entry) => (
          <Segment.Item
            key={entry.id}
            aria-label={entry.label}
            className="w-auto"
            id={entry.id}
            style={{gap: 0}}
          >
            {({isSelected}) => (
              <>
                <Icon icon={entry.icon} />
                <span
                  className="inline-grid transition-all duration-200 ease-out motion-reduce:transition-none"
                  style={{
                    gridTemplateColumns: isSelected ? "1fr" : "0fr",
                    minWidth: 0,
                    opacity: isSelected ? 1 : 0,
                  }}
                >
                  <span
                    className="overflow-hidden whitespace-nowrap transition-[padding] duration-200 ease-out motion-reduce:transition-none"
                    style={{minWidth: 0, paddingInlineStart: isSelected ? "0.375rem" : 0}}
                  >
                    {entry.label}
                  </span>
                </span>
              </>
            )}
          </Segment.Item>
        ))}
      </Segment>
    );
  },
};

export const WithSeparators: Story = {
  render: () => (
    <Segment aria-label="Workspace section" defaultSelectedKey="activity">
      {items.map((item) => (
        <Segment.Item key={item.id} id={item.id}>
          <Segment.Separator />
          {item.label}
        </Segment.Item>
      ))}
    </Segment>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Segment isDisabled aria-label="Workspace section" defaultSelectedKey="overview">
      {items.map((item) => (
        <Segment.Item key={item.id} id={item.id}>
          {item.label}
        </Segment.Item>
      ))}
    </Segment>
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <Segment aria-label="Workspace section" defaultSelectedKey="overview">
      <Segment.Item id="overview">Overview</Segment.Item>
      <Segment.Item isDisabled id="activity">
        Activity
      </Segment.Item>
      <Segment.Item id="billing">Billing</Segment.Item>
    </Segment>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-[420px]">
      <Segment aria-label="Workspace section" className="w-full" defaultSelectedKey="overview">
        {items.slice(0, 3).map((item) => (
          <Segment.Item key={item.id} id={item.id}>
            {item.label}
          </Segment.Item>
        ))}
      </Segment>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<Key>("activity");

    return (
      <div className="flex flex-col items-start gap-4">
        <Segment
          aria-label="Workspace section"
          selectedKey={selected}
          onSelectionChange={setSelected}
        >
          {items.map((item) => (
            <Segment.Item key={item.id} id={item.id}>
              {item.label}
            </Segment.Item>
          ))}
        </Segment>
        <span className="text-sm text-muted">
          Selected: <strong className="text-foreground">{String(selected)}</strong>
        </span>
      </div>
    );
  },
};
