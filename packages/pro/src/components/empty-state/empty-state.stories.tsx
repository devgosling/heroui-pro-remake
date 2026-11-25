import type {Meta, StoryObj} from "@storybook/react";

import {Avatar, Badge, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {EmptyState} from "./index";

const sizes = ["sm", "md", "lg"] as const;

const meta = {
  argTypes: {
    size: {
      control: "select",
      description: "Padding, gap, media and title scale",
      options: sizes,
      table: {defaultValue: {summary: "md"}},
    },
  },
  args: {
    size: "md",
  },
  component: EmptyState,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/EmptyState",
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;
type Size = (typeof sizes)[number];

/* -------------------------------------------------------------------------------------------------
 * Story helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
const avatarBase = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars";

const BoardsEmptyState = ({size = "md"}: {size?: Size}) => (
  <EmptyState size={size}>
    <EmptyState.Header>
      <EmptyState.Media variant="icon">
        <Icon icon="gravity-ui:layers" />
      </EmptyState.Media>
      <EmptyState.Title>No Boards Yet</EmptyState.Title>
      <EmptyState.Description>
        You haven&apos;t set up any boards yet. Organise your work by creating your first board.
      </EmptyState.Description>
    </EmptyState.Header>
    <EmptyState.Content className="flex-row gap-2">
      <Button size={size} variant="primary">
        Create Board
      </Button>
      <Button size={size} variant="outline">
        Import Board
      </Button>
    </EmptyState.Content>
  </EmptyState>
);

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: ({size}) => (
    <div className="w-[420px]">
      <BoardsEmptyState size={size ?? "md"} />
    </div>
  ),
};

export const Outline: Story = {
  render: ({size}) => (
    <div className="w-[420px]">
      <EmptyState className="rounded-2xl border border-dashed border-border" size={size}>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon icon="gravity-ui:hard-drive" />
          </EmptyState.Media>
          <EmptyState.Title>Your Drive Is Empty</EmptyState.Title>
          <EmptyState.Description>
            Add files to your drive so you can reach them from any device.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button size="sm" variant="outline">
            Add Files
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: {controls: {exclude: ["size"]}},
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <span className="text-center text-xs text-muted">{size}</span>
          <div className="w-[300px] rounded-2xl border border-dashed border-border">
            <BoardsEmptyState size={size} />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Minimal: Story = {
  render: ({size}) => (
    <div className="w-[420px]">
      <EmptyState size={size}>
        <EmptyState.Header>
          <EmptyState.Title>Nothing to show</EmptyState.Title>
          <EmptyState.Description>
            Items will show up here as soon as they are added.
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </div>
  ),
};

export const WithAvatar: Story = {
  render: ({size}) => (
    <div className="w-[420px]">
      <EmptyState size={size}>
        <EmptyState.Header>
          <EmptyState.Media>
            <Badge.Anchor>
              <Avatar className="size-12">
                <Avatar.Image alt="Ines Kowalski" src={`${avatarBase}/green.jpg`} />
                <Avatar.Fallback>IK</Avatar.Fallback>
              </Avatar>
              <Badge
                className="right-1 bottom-0.5 size-3 min-h-3 min-w-3"
                color="danger"
                placement="bottom-right"
                size="sm"
              />
            </Badge.Anchor>
          </EmptyState.Media>
          <EmptyState.Title>Contact Unavailable</EmptyState.Title>
          <EmptyState.Description>
            This contact is away right now. Send a message and they will see it as soon as they are
            back.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="secondary">Send Message</Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  ),
};

export const WithAvatarGroup: Story = {
  render: ({size}) => (
    <div className="w-[420px]">
      <EmptyState size={size}>
        <EmptyState.Header>
          <EmptyState.Media>
            <div className="flex -space-x-2">
              {[
                {name: "Ava Moreno", src: `${avatarBase}/red.jpg`},
                {name: "Liam Baker", src: `${avatarBase}/orange.jpg`},
                {name: "Noah Fischer", src: `${avatarBase}/black.jpg`},
              ].map((person) => (
                <Avatar key={person.name} className="ring-2 ring-background">
                  <Avatar.Image alt={person.name} src={person.src} />
                </Avatar>
              ))}
            </div>
          </EmptyState.Media>
          <EmptyState.Title>No Collaborators</EmptyState.Title>
          <EmptyState.Description>
            Add teammates to work on this board together.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button size="sm" variant="primary">
            <Icon icon="gravity-ui:person-plus" />
            Add People
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  ),
};

export const WithBackground: Story = {
  render: ({size}) => (
    <div className="w-[420px]">
      <EmptyState className="rounded-2xl bg-surface-secondary" size={size}>
        <EmptyState.Header>
          <EmptyState.Media className="border bg-surface-tertiary" variant="icon">
            <Icon icon="gravity-ui:tray" />
          </EmptyState.Media>
          <EmptyState.Title>Inbox Zero</EmptyState.Title>
          <EmptyState.Description className="max-w-xs text-pretty">
            You have read everything. New messages will show up here when they arrive.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button variant="outline">Reload</Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  ),
};

export const FullHeight: Story = {
  render: ({size}) => (
    <div className="flex h-[400px] w-[500px] items-center justify-center rounded-2xl border border-dashed border-border">
      <EmptyState size={size}>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon icon="gravity-ui:magnifier" />
          </EmptyState.Media>
          <EmptyState.Title>No Matches</EmptyState.Title>
          <EmptyState.Description className="max-w-xs text-pretty">
            Nothing matches your current search. Try other keywords or remove a filter.
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <Button size="sm" variant="outline">
            Reset Filters
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </div>
  ),
};
