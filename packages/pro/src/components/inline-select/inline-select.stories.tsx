import type {Key} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";

import {ListBox} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {InlineSelect} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
  },
  component: InlineSelect,
  parameters: {layout: "centered"},
  title: "Pro/Forms/InlineSelect",
} satisfies Meta<typeof InlineSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
const sortOrders = [
  {id: "newest", label: "Newest"},
  {id: "oldest", label: "Oldest"},
  {id: "popular", label: "Most popular"},
  {id: "trending", label: "Trending"},
];

export const Default: Story = {
  args: {"aria-label": "Sort by", defaultValue: "newest"},
  render: (args) => (
    <InlineSelect {...args}>
      <InlineSelect.Trigger>
        <InlineSelect.Value />
        <InlineSelect.Indicator />
      </InlineSelect.Trigger>
      <InlineSelect.Popover className="w-[140px]">
        <ListBox>
          {sortOrders.map((order) => (
            <ListBox.Item key={order.id} id={order.id} textValue={order.label}>
              {order.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </InlineSelect.Popover>
    </InlineSelect>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Team switcher
 * -----------------------------------------------------------------------------------------------*/
const workspaces = [
  {color: "bg-emerald-600", id: "orbit-analytics", initial: "O", name: "Orbit Analytics"},
  {color: "bg-sky-600", id: "cobalt-systems", initial: "C", name: "Cobalt Systems"},
  {color: "bg-rose-600", id: "juniper-works", initial: "J", name: "Juniper Works"},
];

const WorkspaceAvatar = ({color, initial}: {color: string; initial: string}) => (
  <div className={`${color} flex size-5 shrink-0 items-center justify-center rounded`}>
    <span className="text-[10px] font-bold text-white">{initial}</span>
  </div>
);

const BrandMark = () => (
  <svg className="size-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3.5 19.5 7.75v8.5L12 20.5l-7.5-4.25v-8.5L12 3.5Zm0 4.25L8.25 9.875v4.25L12 16.25l3.75-2.125v-4.25L12 7.75Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const TeamSwitcherDemo = () => {
  const [workspaceId, setWorkspaceId] = React.useState<Key | null>("orbit-analytics");
  const current = workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0]!;

  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-lg font-light text-border">/</span>
      <InlineSelect aria-label="Workspace" value={workspaceId} onChange={setWorkspaceId}>
        <InlineSelect.Trigger className="gap-2">
          <WorkspaceAvatar color={current.color} initial={current.initial} />
          <span className="text-sm font-medium">{current.name}</span>
          <InlineSelect.Indicator />
        </InlineSelect.Trigger>
        <InlineSelect.Popover className="w-[200px]">
          <ListBox>
            {workspaces.map((workspace) => (
              <ListBox.Item key={workspace.id} id={workspace.id} textValue={workspace.name}>
                <WorkspaceAvatar color={workspace.color} initial={workspace.initial} />
                {workspace.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </InlineSelect.Popover>
      </InlineSelect>
    </div>
  );
};

export const TeamSwitcher: Story = {
  render: () => <TeamSwitcherDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Placements
 * -----------------------------------------------------------------------------------------------*/
type Placement = NonNullable<InlineSelect["PopoverProps"]["placement"]>;

const placements: {id: Placement; label: string}[] = [
  {id: "bottom", label: "Bottom"},
  {id: "bottom start", label: "Bottom start"},
  {id: "bottom end", label: "Bottom end (default)"},
  {id: "top", label: "Top"},
  {id: "top start", label: "Top start"},
  {id: "top end", label: "Top end"},
  {id: "left", label: "Left"},
  {id: "left top", label: "Left top"},
  {id: "left bottom", label: "Left bottom"},
  {id: "right", label: "Right"},
  {id: "right top", label: "Right top"},
  {id: "right bottom", label: "Right bottom"},
];

const PlacementsDemo = () => {
  const [placement, setPlacement] = React.useState<Placement>("bottom end");

  return (
    // Fills the canvas height so `top*` placements have room above the trigger
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center px-10">
      <InlineSelect
        aria-label="Popover placement"
        value={placement}
        onChange={(key) => {
          if (key != null) setPlacement(key as Placement);
        }}
      >
        <InlineSelect.Trigger>
          <InlineSelect.Value />
          <InlineSelect.Indicator />
        </InlineSelect.Trigger>
        <InlineSelect.Popover placement={placement}>
          <ListBox>
            {placements.map((option) => (
              <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </InlineSelect.Popover>
      </InlineSelect>
    </div>
  );
};

export const Placements: Story = {
  render: () => <PlacementsDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Multi select
 * -----------------------------------------------------------------------------------------------*/
const subscriptions = [
  {id: "digest", label: "Weekly Digest"},
  {id: "security", label: "Security Alerts"},
  {id: "updates", label: "Product Updates"},
];

export const MultiSelect: Story = {
  render: () => (
    <InlineSelect
      aria-label="Email subscriptions"
      defaultValue={["digest", "updates"]}
      selectionMode="multiple"
    >
      <InlineSelect.Trigger>
        <InlineSelect.Value />
        <InlineSelect.Indicator />
      </InlineSelect.Trigger>
      <InlineSelect.Popover className="w-48 max-w-48 min-w-48">
        <ListBox>
          {subscriptions.map((subscription) => (
            <ListBox.Item key={subscription.id} id={subscription.id} textValue={subscription.label}>
              {subscription.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </InlineSelect.Popover>
    </InlineSelect>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom indicator
 * -----------------------------------------------------------------------------------------------*/
const accessLevels = [
  {id: "guest", label: "Guest"},
  {id: "member", label: "Member"},
  {id: "owner", label: "Owner"},
];

export const CustomIndicator: Story = {
  render: () => (
    <InlineSelect aria-label="Access level" defaultValue="member">
      <InlineSelect.Trigger>
        <InlineSelect.Value />
        <InlineSelect.Indicator>
          <Icon icon="gravity-ui:chevron-right" />
        </InlineSelect.Indicator>
      </InlineSelect.Trigger>
      <InlineSelect.Popover className="w-[124px]">
        <ListBox>
          {accessLevels.map((level) => (
            <ListBox.Item key={level.id} id={level.id} textValue={level.label}>
              {level.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </InlineSelect.Popover>
    </InlineSelect>
  ),
};
