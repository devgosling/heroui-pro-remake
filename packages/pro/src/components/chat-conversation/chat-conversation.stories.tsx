import type {PromptInputStatus} from "../prompt-input";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {useCallback, useEffect, useRef, useState} from "react";

import {ChainOfThought} from "../chain-of-thought";
import {ChatMessage} from "../chat-message";
import {ChatMessageActions} from "../chat-message-actions";
import {Markdown} from "../markdown";
import {PromptInput} from "../prompt-input";
import {Reasoning} from "../reasoning";

import {ChatConversation, useChatConversation} from "./index";

const meta = {
  argTypes: {
    className: {control: "text"},
    initial: {
      control: "inline-radio",
      description: "Scroll behavior on mount",
      options: ["smooth", "instant"],
    },
    resize: {
      control: "inline-radio",
      description: "Scroll behavior when content grows at the bottom",
      options: ["smooth", "instant"],
    },
  },
  args: {
    initial: "smooth",
    resize: "smooth",
  },
  component: ChatConversation,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChatConversation",
} satisfies Meta<typeof ChatConversation>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * Like the Pro demo pages: the conversation is centred in the page with a 24px / 40px gutter.
 * -----------------------------------------------------------------------------------------------*/
const DemoPage = ({children}: {children: ReactNode}) => (
  <div className="flex min-h-screen w-full items-center justify-center p-6 sm:p-10">{children}</div>
);

const contentClassName = "max-w-[714px] gap-8 px-4 py-8";

const UserTurn = ({children}: {children: ReactNode}) => (
  <ChatMessage.User>
    <ChatMessage.Bubble>
      <ChatMessage.Content>{children}</ChatMessage.Content>
    </ChatMessage.Bubble>
  </ChatMessage.User>
);

const AssistantTurn = ({
  actions,
  children,
  reply,
}: {
  actions?: boolean;
  children?: ReactNode;
  reply: string;
}) => (
  <ChatMessage.Assistant>
    <ChatMessage.Avatar alt="Assistant" fallback="AI" />
    <ChatMessage.Body>
      {children}
      <ChatMessage.Content>
        <Markdown>{reply}</Markdown>
      </ChatMessage.Content>
      {actions ? (
        <ChatMessageActions>
          <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" value={reply} />
          <ChatMessageActions.Regenerate aria-label="Regenerate" tooltip="Regenerate" />
        </ChatMessageActions>
      ) : null}
    </ChatMessage.Body>
  </ChatMessage.Assistant>
);

/* -------------------------------------------------------------------------------------------------
 * Default - a fixed-height conversation that starts at the newest message
 * -----------------------------------------------------------------------------------------------*/
const threadTurns = [
  {
    question: "Why does my chat jump while a reply is streaming?",
    reply:
      "The view stays pinned to the newest line while tokens keep arriving.\n\nScroll up a little and the pinning stops, so the passage you are reading stays exactly where you left it.",
  },
  {
    question: "How do I get back to the newest reply?",
    reply:
      "Return to the end of the thread and following resumes on its own. The jump button does the same with a single click.",
  },
  {
    question: "Can replies contain rich formatting?",
    reply:
      "Sure. The thread handles content of any height:\n\n- Tables, quotes and code samples\n- Tool calls and thinking steps\n- Charts, files and images",
  },
];

const ThreadTurn = ({question, reply}: {question: string; reply: string}) => (
  <>
    <UserTurn>{question}</UserTurn>
    <AssistantTurn reply={reply} />
  </>
);

const Thread = () =>
  threadTurns.map((turn) => (
    <ThreadTurn key={turn.question} question={turn.question} reply={turn.reply} />
  ));

export const Default: Story = {
  render: (args) => (
    <DemoPage>
      <ChatConversation aria-label="Conversation" className="h-[520px]" {...args}>
        <ChatConversation.Content className={contentClassName}>
          <Thread />
        </ChatConversation.Content>
      </ChatConversation>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Full Chat - conversation + composer; aria-busy while the mocked reply streams
 * -----------------------------------------------------------------------------------------------*/
type Message =
  | {id: string; role: "user"; text: string}
  | {id: string; reasoning?: boolean; role: "assistant"; text: string};

const initialMessages: Message[] = [
  {id: "m1", role: "user", text: "Design an onboarding checklist for new team members."},
  {
    id: "m2",
    reasoning: true,
    role: "assistant",
    text: "Here is an **onboarding checklist** split into accounts, people, and a first project.\n\n- Accounts for email, chat, and the code repository\n- Intro meetings with the team lead and a buddy\n- A small starter task with a review on day three",
  },
  {id: "m3", role: "user", text: "Make a shorter version for contractors on short projects."},
  {
    id: "m4",
    role: "assistant",
    text: "For contractors, I would keep only the access steps, one intro call, and the starter task, and drop the buddy program. The checklist can share the same template with optional sections switched off.",
  },
];

const mockReply = "This is a canned reply from the demo assistant, shown after a short pause.";

const PlanningTrace = () => (
  <Reasoning defaultExpanded duration="5s" status="complete">
    <Reasoning.Trigger />
    <Reasoning.Content>
      <ChainOfThought>
        <ChainOfThought.Step status="complete">
          <ChainOfThought.StepTitle>Collected the steps</ChainOfThought.StepTitle>
          <ChainOfThought.StepDescription>
            Grouped accounts, introductions, and a first task into three onboarding stages.
          </ChainOfThought.StepDescription>
        </ChainOfThought.Step>
        <ChainOfThought.Step status="complete">
          <ChainOfThought.StepTitle>Ordered by first week</ChainOfThought.StepTitle>
          <ChainOfThought.StepDescription>
            Put the blocking access requests first so day one is not spent waiting.
          </ChainOfThought.StepDescription>
        </ChainOfThought.Step>
      </ChainOfThought>
    </Reasoning.Content>
  </Reasoning>
);

const FullChatDemo = (args: ChatConversation["Props"]) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<PromptInputStatus>("ready");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  const stop = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
    setStatus("ready");
  }, []);

  const submit = useCallback(() => {
    const text = value.trim();

    if (!text) return;

    setMessages((current) => [...current, {id: `u${Date.now()}`, role: "user", text}]);
    setValue("");
    setStatus("submitted");

    timers.current = [
      window.setTimeout(() => setStatus("streaming"), 300),
      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          {id: `a${Date.now()}`, role: "assistant", text: mockReply},
        ]);
        setStatus("ready");
      }, 1200),
    ];
  }, [value]);

  return (
    <div className="flex h-[640px] w-full flex-col">
      <ChatConversation aria-busy={status === "streaming"} aria-label="Conversation" {...args}>
        <ChatConversation.Content className={contentClassName}>
          {messages.map((message) =>
            message.role === "user" ? (
              <UserTurn key={message.id}>{message.text}</UserTurn>
            ) : (
              <AssistantTurn key={message.id} actions reply={message.text}>
                {message.reasoning ? <PlanningTrace /> : null}
              </AssistantTurn>
            ),
          )}
        </ChatConversation.Content>
      </ChatConversation>
      <div className="mx-auto w-full max-w-[714px] shrink-0 px-4 pt-3 pb-4">
        <PromptInput
          status={status}
          value={value}
          onStop={stop}
          onSubmit={submit}
          onValueChange={setValue}
        >
          <PromptInput.Shell>
            <PromptInput.Content>
              <PromptInput.TextArea placeholder="Ask a follow-up question" />
            </PromptInput.Content>
            <PromptInput.Toolbar>
              <PromptInput.ToolbarEnd>
                <PromptInput.Send />
              </PromptInput.ToolbarEnd>
            </PromptInput.Toolbar>
          </PromptInput.Shell>
          <PromptInput.Footer>Replies are generated and can be wrong.</PromptInput.Footer>
        </PromptInput>
      </div>
    </div>
  );
};

export const FullChat: Story = {
  render: (args) => (
    <DemoPage>
      <FullChatDemo {...args} />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Scroll Button - a jump-to-bottom control while the view is scrolled away from the bottom
 * -----------------------------------------------------------------------------------------------*/
export const ScrollButton: Story = {
  render: (args) => (
    <DemoPage>
      <ChatConversation aria-label="Conversation" className="h-[520px]" {...args}>
        <ChatConversation.Content className={contentClassName}>
          <Thread />
        </ChatConversation.Content>
        <ChatConversation.ScrollButton tooltip="Scroll to bottom" />
      </ChatConversation>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Scroll to Bottom on Send (docs recipe, no Pro demo) - useChatConversation brings back a reader
 * who scrolled up as soon as they send a message
 * -----------------------------------------------------------------------------------------------*/
const ScrollOnSend = ({lastMessage}: {lastMessage?: Message}) => {
  const {scrollToBottom} = useChatConversation();

  useEffect(() => {
    if (lastMessage?.role === "user") scrollToBottom();
  }, [lastMessage, scrollToBottom]);

  return null;
};

const ScrollToBottomOnSendDemo = (args: ChatConversation["Props"]) => {
  const [messages, setMessages] = useState<Message[]>(() =>
    threadTurns.flatMap((turn, index) => [
      {id: `u${index}`, role: "user" as const, text: turn.question},
      {id: `a${index}`, role: "assistant" as const, text: turn.reply},
    ]),
  );
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();

    if (!text) return;

    setMessages((current) => [...current, {id: `u${Date.now()}`, role: "user", text}]);
    setValue("");
  };

  return (
    <div className="flex h-[640px] w-full flex-col">
      <ChatConversation aria-label="Conversation" {...args}>
        <ChatConversation.Content className={contentClassName}>
          {messages.map((message) =>
            message.role === "user" ? (
              <UserTurn key={message.id}>{message.text}</UserTurn>
            ) : (
              <AssistantTurn key={message.id} reply={message.text} />
            ),
          )}
        </ChatConversation.Content>
        <ChatConversation.ScrollButton tooltip="Scroll to bottom" />
        <ScrollOnSend lastMessage={messages.at(-1)} />
      </ChatConversation>
      <div className="mx-auto w-full max-w-[714px] shrink-0 px-4 pt-3 pb-4">
        <PromptInput value={value} onSubmit={submit} onValueChange={setValue}>
          <PromptInput.Shell>
            <PromptInput.Content>
              <PromptInput.TextArea placeholder="Scroll up, then send a message" />
            </PromptInput.Content>
            <PromptInput.Toolbar>
              <PromptInput.ToolbarEnd>
                <PromptInput.Send />
              </PromptInput.ToolbarEnd>
            </PromptInput.Toolbar>
          </PromptInput.Shell>
        </PromptInput>
      </div>
    </div>
  );
};

export const ScrollToBottomOnSend: Story = {
  render: (args) => (
    <DemoPage>
      <ScrollToBottomOnSendDemo {...args} />
    </DemoPage>
  ),
};
