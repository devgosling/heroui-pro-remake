import type {Meta, StoryObj} from "@storybook/react";

import React from "react";

import {ChatLoader} from "./index";

const SIZES = ["sm", "md", "lg"] as const;

const meta = {
  argTypes: {
    label: {control: "text"},
    size: {control: {type: "select"}, options: SIZES},
  },
  component: ChatLoader.Skeleton,
  parameters: {layout: "centered"},
  title: "Pro/AI/ChatLoader",
} satisfies Meta<typeof ChatLoader.Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Pro demo `chat-loader-default`: the three deprecated loaders with a caption, then the skeleton. */
export const Default: Story = {
  args: {size: "md"},
  render: ({label, size}) => (
    <div className="flex w-[420px] flex-col gap-8">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Typing</span>
        <ChatLoader.Dots size={size} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Breathing</span>
        <ChatLoader.Pulse size={size} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Spinning</span>
        <ChatLoader.Spinner size={size} />
      </div>
      <ChatLoader.Skeleton label={label} size={size} />
    </div>
  ),
};

/* Every part in sm / md / lg. */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-8">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col gap-3">
          <div className="flex items-center gap-6">
            <code className="w-6 text-xs text-muted">{size}</code>
            <ChatLoader.Dots size={size} />
            <ChatLoader.Pulse size={size} />
            <ChatLoader.Spinner size={size} />
          </div>
          <ChatLoader.Skeleton size={size} />
        </div>
      ))}
    </div>
  ),
};

/* A labelled skeleton is a status region, as in the Chat Message "loading" demo. */
export const WithLabel: Story = {
  args: {label: "Drafting a reply"},
  render: (args) => (
    <div className="w-[420px]">
      <ChatLoader.Skeleton {...args} />
    </div>
  ),
};

/* Custom skeletons built from the primitives. */
export const Composition: Story = {
  args: {size: "md"},
  render: ({size}) => (
    <div className="flex w-[420px] flex-col gap-8">
      {/* Assistant reply without an avatar: two lines */}
      <ChatLoader.Skeleton label="Summarising the thread" size={size}>
        <ChatLoader.SkeletonBlock>
          <ChatLoader.SkeletonLine />
          <ChatLoader.SkeletonLine />
        </ChatLoader.SkeletonBlock>
      </ChatLoader.Skeleton>

      {/* Longer reply: avatar and five lines with custom widths */}
      <ChatLoader.Skeleton size={size}>
        <ChatLoader.SkeletonAvatar />
        <ChatLoader.SkeletonBlock>
          <ChatLoader.SkeletonLine />
          <ChatLoader.SkeletonLine className="w-full" />
          <ChatLoader.SkeletonLine className="w-[92%]" />
          <ChatLoader.SkeletonLine className="w-[78%]" />
          <ChatLoader.SkeletonLine className="w-2/5" />
        </ChatLoader.SkeletonBlock>
      </ChatLoader.Skeleton>

      {/* Labelled deprecated loaders announce their label once */}
      <div className="flex items-center gap-6">
        <ChatLoader.Dots label="Assistant is typing" />
        <ChatLoader.Pulse label="Listening" />
        <ChatLoader.Spinner label="Uploading attachment" />
      </div>
    </div>
  ),
};
