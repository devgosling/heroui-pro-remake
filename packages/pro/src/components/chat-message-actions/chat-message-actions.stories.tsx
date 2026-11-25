import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Avatar} from "@heroui/react";
import {Icon} from "@iconify/react";

import {ChatMessageActions} from "./index";

const meta = {
  argTypes: {
    className: {control: "text"},
  },
  component: ChatMessageActions,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChatMessageActions",
} satisfies Meta<typeof ChatMessageActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * An assistant turn laid out like Chat Message (avatar + body column). Chat Message is a separate
 * Pro component; the `chat-message--assistant` class only enables the hover reveal of the row.
 * -----------------------------------------------------------------------------------------------*/
const DemoPage = ({children}: {children: ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10">{children}</div>
);

const AssistantTurn = ({actions, text}: {actions: ReactNode; text: ReactNode}) => (
  <div className="chat-message--assistant flex w-full flex-row items-start gap-3 py-2">
    <div className="shrink-0 self-start">
      <Avatar size="sm">
        <Avatar.Fallback>AI</Avatar.Fallback>
      </Avatar>
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="w-full text-sm leading-relaxed text-foreground">{text}</div>
      {actions}
    </div>
  </div>
);

const replyText =
  "Here is a short summary of the release notes. Hover the reply to bring the actions into full view.";

/* -------------------------------------------------------------------------------------------------
 * Default - the full preset set: copy, rating, regenerate and an overflow trigger
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <DemoPage>
      <AssistantTurn
        text={replyText}
        actions={
          <ChatMessageActions {...args}>
            <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" value={replyText} />
            <ChatMessageActions.ThumbsUp aria-label="Good response" tooltip="Good response" />
            <ChatMessageActions.ThumbsDown aria-label="Bad response" tooltip="Bad response" />
            <ChatMessageActions.Regenerate aria-label="Regenerate" tooltip="Regenerate" />
            <ChatMessageActions.More aria-label="More actions" tooltip="More actions" />
          </ChatMessageActions>
        }
      />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Minimal - only one or two actions
 * -----------------------------------------------------------------------------------------------*/
const shortReply = "Done. The draft is saved to your workspace.";

export const Minimal: Story = {
  render: (args) => (
    <DemoPage>
      <AssistantTurn
        text={shortReply}
        actions={
          <ChatMessageActions {...args}>
            <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" value={shortReply} />
            <ChatMessageActions.More aria-label="More actions" tooltip="More actions" />
          </ChatMessageActions>
        }
      />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom Icons - swap the preset glyphs through the Icon subcomponents
 * -----------------------------------------------------------------------------------------------*/
const customReply = "Presets keep working with your own glyphs.";

export const CustomIcons: Story = {
  render: (args) => (
    <DemoPage>
      <AssistantTurn
        text={customReply}
        actions={
          <ChatMessageActions {...args}>
            <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" value={customReply}>
              <ChatMessageActions.CopyIcon className="size-4 text-accent">
                <Icon icon="gravity-ui:copy-transparent" />
              </ChatMessageActions.CopyIcon>
            </ChatMessageActions.Copy>
            <ChatMessageActions.ThumbsUp aria-label="Good response" tooltip="Good response">
              <ChatMessageActions.ThumbsUpIcon className="size-4 text-success">
                <Icon icon="gravity-ui:face-smile" />
              </ChatMessageActions.ThumbsUpIcon>
            </ChatMessageActions.ThumbsUp>
          </ChatMessageActions>
        }
      />
    </DemoPage>
  ),
};
