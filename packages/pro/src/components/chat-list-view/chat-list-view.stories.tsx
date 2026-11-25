import type {ChatListViewProps} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Icon} from "@iconify/react";
import React from "react";

import {ChatListView} from "./index";

/** Visual / behavioural props exposed as Storybook controls. */
type ChatListViewStoryArgs = Pick<ChatListViewProps, "density" | "selectionMode">;

const meta: Meta<ChatListViewStoryArgs> = {
  argTypes: {
    density: {
      control: "select",
      description: "Row density",
      options: ["comfortable", "compact"],
      table: {defaultValue: {summary: "comfortable"}},
    },
    selectionMode: {
      control: "select",
      description: "Thread selection mode",
      options: ["none", "single", "multiple"],
      table: {defaultValue: {summary: "none"}},
    },
  },
  args: {
    density: "comfortable",
  },
  component: ChatListView as unknown as React.ComponentType<ChatListViewStoryArgs>,
  decorators: [
    // Same frame as the Pro demo pages: centered content with a 24px gutter.
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <Story />
      </div>
    ),
  ],
  title: "Pro/AI/ChatListView",
};

export default meta;

type Story = StoryObj<ChatListViewStoryArgs>;

/* -------------------------------------------------------------------------------------------------
 * Story data + helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
type Thread = {id: string; meta: string; preview: string; title: string};

const threads: Thread[] = [
  {
    id: "budget",
    meta: "35m ago",
    preview: "Break down the Q3 spend by team and region.",
    title: "Quarterly budget review",
  },
  {
    id: "onboarding",
    meta: "Yesterday",
    preview: "Write a friendly welcome email for new users.",
    title: "Onboarding email draft",
  },
  {
    id: "triage",
    meta: "Tue",
    preview: "Group these bug reports by severity.",
    title: "Bug triage notes",
  },
];

/** One conversation row: icon, title + preview column and trailing metadata. */
const ThreadRow = ({textValue, thread}: {textValue: string; thread: Thread}) => (
  <ChatListView.Item id={thread.id} textValue={textValue}>
    <ChatListView.ItemContent>
      <ChatListView.Icon>
        <Icon icon="gravity-ui:comment" />
      </ChatListView.Icon>
      <ChatListView.Text>
        <ChatListView.Title>{thread.title}</ChatListView.Title>
        <ChatListView.Preview>{thread.preview}</ChatListView.Preview>
      </ChatListView.Text>
      <ChatListView.Meta>{thread.meta}</ChatListView.Meta>
    </ChatListView.ItemContent>
  </ChatListView.Item>
);

/* -------------------------------------------------------------------------------------------------
 * Default - comfortable rows with preview and metadata
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <div className="w-[480px]">
      <ChatListView {...args} aria-label="Recent conversations">
        {threads.map((thread) => (
          <ThreadRow
            key={thread.id}
            textValue={`${thread.title} ${thread.preview}`}
            thread={thread}
          />
        ))}
      </ChatListView>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Compact - one line per thread for dense sidebars (preview and metadata are hidden)
 * -----------------------------------------------------------------------------------------------*/
export const Compact: Story = {
  args: {density: "compact"},
  render: (args) => (
    <div className="w-[280px]">
      <ChatListView {...args} aria-label="Recent conversations">
        {threads.map((thread) => (
          <ThreadRow key={thread.id} textValue={thread.title} thread={thread} />
        ))}
      </ChatListView>
    </div>
  ),
};
