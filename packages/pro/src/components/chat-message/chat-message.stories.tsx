import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Separator} from "@heroui/react";

import {ChainOfThought} from "../chain-of-thought";
import {ChatLoader} from "../chat-loader";
import {ChatMessageActions} from "../chat-message-actions";
import {ChatSource, ChatSources} from "../chat-source";
import {Loader} from "../loader";
import {Markdown} from "../markdown";
import {Reasoning} from "../reasoning";
import {TextShimmer} from "../text-shimmer";

import {ChatMessage} from "./index";

const meta = {
  argTypes: {
    className: {control: "text"},
    variant: {
      control: "inline-radio",
      description: "`card` places the assistant turn on a Card surface",
      options: ["default", "card"],
    },
  },
  args: {
    variant: "default",
  },
  component: ChatMessage.Assistant,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChatMessage",
} satisfies Meta<typeof ChatMessage.Assistant>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * The demo page centres a conversation column capped at 714px, like the Pro demos.
 * -----------------------------------------------------------------------------------------------*/
const DemoPage = ({children}: {children: ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10">
    <div className="mx-auto flex w-full max-w-[714px] flex-col gap-8">{children}</div>
  </div>
);

const UserTurn = ({children}: {children: ReactNode}) => (
  <ChatMessage.User>
    <ChatMessage.Bubble>
      <ChatMessage.Content>{children}</ChatMessage.Content>
    </ChatMessage.Bubble>
  </ChatMessage.User>
);

/* -------------------------------------------------------------------------------------------------
 * Default - a user bubble and an assistant reply with avatar and actions
 * -----------------------------------------------------------------------------------------------*/
const defaultReply =
  "A headless table ships behaviour without markup, so your own design tokens decide every pixel.";

export const Default: Story = {
  render: (args) => (
    <DemoPage>
      <UserTurn>Why is a headless table library easier to theme than a pre-styled one?</UserTurn>
      <ChatMessage.Assistant {...args}>
        <ChatMessage.Avatar alt="Assistant" fallback="AI" />
        <ChatMessage.Body>
          <ChatMessage.Content>{defaultReply}</ChatMessage.Content>
          <ChatMessageActions>
            <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" value={defaultReply} />
            <ChatMessageActions.ThumbsUp aria-label="Good response" tooltip="Good response" />
            <ChatMessageActions.ThumbsDown aria-label="Bad response" tooltip="Bad response" />
            <ChatMessageActions.Regenerate aria-label="Regenerate" tooltip="Regenerate" />
          </ChatMessageActions>
        </ChatMessage.Body>
      </ChatMessage.Assistant>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Markdown - the reply rendered with Markdown inside ChatMessage.Content
 * -----------------------------------------------------------------------------------------------*/
const markdownReply = `Here is a tiny helper that keeps **streamed tokens** in order:

\`\`\`ts
export const appendToken = (draft: string, token: string): string => draft + token;
\`\`\`

Keep the draft in your store and hand the text to the message as it grows.`;

export const WithMarkdown: Story = {
  render: (args) => (
    <DemoPage>
      <UserTurn>How do I render a formatted reply with a code sample?</UserTurn>
      <ChatMessage.Assistant {...args}>
        <ChatMessage.Avatar alt="Assistant" fallback="AI" />
        <ChatMessage.Body>
          <ChatMessage.Content>
            <Markdown>{markdownReply}</Markdown>
          </ChatMessage.Content>
        </ChatMessage.Body>
      </ChatMessage.Assistant>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Card - a whole turn on a Card surface: reasoning, answer, separator and sources
 * -----------------------------------------------------------------------------------------------*/
export const Card: Story = {
  args: {variant: "card"},
  render: (args) => (
    <DemoPage>
      <UserTurn>What is new in React 19?</UserTurn>
      <ChatMessage.Assistant {...args}>
        <Reasoning duration="4s" status="complete">
          <Reasoning.Trigger />
          <Reasoning.Content>
            <ChainOfThought>
              <ChainOfThought.Step status="complete">
                <ChainOfThought.StepTitle>Read the release announcement</ChainOfThought.StepTitle>
              </ChainOfThought.Step>
              <ChainOfThought.Step status="complete">
                <ChainOfThought.StepTitle>
                  Compared it with the upgrade guide
                </ChainOfThought.StepTitle>
              </ChainOfThought.Step>
            </ChainOfThought>
          </Reasoning.Content>
        </Reasoning>
        <ChatMessage.Content>
          React 19 adds Actions for async transitions, the use() hook for reading promises and
          context, and lets function components take ref as a regular prop.
        </ChatMessage.Content>
        <Separator className="mt-1" />
        <ChatSources.List>
          <ChatSource href="https://react.dev/blog/2024/12/05/react-19" title="React – Blog" />
          <ChatSource
            href="https://react.dev/blog/2024/04/25/react-19-upgrade-guide"
            title="React – Upgrade"
          />
        </ChatSources.List>
      </ChatMessage.Assistant>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Loading - a shimmering status and dots while the reply streams, a skeleton before it starts
 * -----------------------------------------------------------------------------------------------*/
export const Loading: Story = {
  render: (args) => (
    <DemoPage>
      <UserTurn>How long is the train ride from Zurich to Milan?</UserTurn>
      <ChatMessage.Assistant {...args}>
        <ChatMessage.Avatar alt="Assistant" fallback="AI" />
        <ChatMessage.Body>
          <TextShimmer>Searching the timetable</TextShimmer>
          <Loader aria-hidden="true" className="text-muted" variant="dots" />
        </ChatMessage.Body>
      </ChatMessage.Assistant>
      <ChatLoader.Skeleton label="Loading response" />
    </DemoPage>
  ),
};
