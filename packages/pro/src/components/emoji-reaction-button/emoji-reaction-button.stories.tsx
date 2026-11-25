import type {Meta, StoryObj} from "@storybook/react";

import React from "react";

import {EmojiReactionButton} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: EmojiReactionButton,
  parameters: {layout: "centered"},
  title: "Pro/Feedback/EmojiReactionButton",
} satisfies Meta<typeof EmojiReactionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Default - a row of reactions; toggling one adds or removes your own reaction from its count
 * -----------------------------------------------------------------------------------------------*/
const initialReactions = [
  {count: 24, emoji: "🔥", isSelected: true},
  {count: 2, emoji: "👀", isSelected: false},
  {count: 4, emoji: "💯", isSelected: false},
  {count: 7, emoji: "🙌", isSelected: false},
  {count: 1, emoji: "✨", isSelected: false},
];

const ReactionRow = (props: EmojiReactionButton["RootProps"]) => {
  const [reactions, setReactions] = React.useState(initialReactions);

  const toggle = (emoji: string, isSelected: boolean) =>
    setReactions((current) =>
      current.map((reaction) =>
        reaction.emoji === emoji
          ? {...reaction, count: reaction.count + (isSelected ? 1 : -1), isSelected}
          : reaction,
      ),
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {reactions.map((reaction) => (
        <EmojiReactionButton
          key={reaction.emoji}
          {...props}
          isSelected={reaction.isSelected}
          onChange={(isSelected) => toggle(reaction.emoji, isSelected)}
        >
          <EmojiReactionButton.Emoji>{reaction.emoji}</EmojiReactionButton.Emoji>
          <EmojiReactionButton.Count>{reaction.count}</EmojiReactionButton.Count>
        </EmojiReactionButton>
      ))}
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ReactionRow {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Sizes
 * -----------------------------------------------------------------------------------------------*/
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <span className="w-8 text-xs font-medium text-muted">{size}</span>
          <div className="flex items-center gap-2">
            <EmojiReactionButton isSelected size={size}>
              <EmojiReactionButton.Emoji>🔥</EmojiReactionButton.Emoji>
              <EmojiReactionButton.Count>7</EmojiReactionButton.Count>
            </EmojiReactionButton>
            <EmojiReactionButton size={size}>
              <EmojiReactionButton.Emoji>👏</EmojiReactionButton.Emoji>
              <EmojiReactionButton.Count>3</EmojiReactionButton.Count>
            </EmojiReactionButton>
            <EmojiReactionButton size={size}>
              <EmojiReactionButton.Emoji>🤔</EmojiReactionButton.Emoji>
              <EmojiReactionButton.Count>1</EmojiReactionButton.Count>
            </EmojiReactionButton>
          </div>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <EmojiReactionButton isDisabled isSelected>
        <EmojiReactionButton.Emoji>🎯</EmojiReactionButton.Emoji>
        <EmojiReactionButton.Count>18</EmojiReactionButton.Count>
      </EmojiReactionButton>
      <EmojiReactionButton isDisabled>
        <EmojiReactionButton.Emoji>👋</EmojiReactionButton.Emoji>
        <EmojiReactionButton.Count>4</EmojiReactionButton.Count>
      </EmojiReactionButton>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Read-only
 * -----------------------------------------------------------------------------------------------*/
export const ReadOnly: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <EmojiReactionButton isReadOnly isSelected>
        <EmojiReactionButton.Emoji>⭐</EmojiReactionButton.Emoji>
        <EmojiReactionButton.Count>15</EmojiReactionButton.Count>
      </EmojiReactionButton>
      <EmojiReactionButton isReadOnly>
        <EmojiReactionButton.Emoji>💬</EmojiReactionButton.Emoji>
        <EmojiReactionButton.Count>6</EmojiReactionButton.Count>
      </EmojiReactionButton>
    </div>
  ),
};
