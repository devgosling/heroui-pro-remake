import type {SwipeableRowOpenSide, SwipeableRowRootRef} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, Separator} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {Fragment, useRef, useState} from "react";

import {SwipeableRow, useSwipeableRow} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Demo content
 * -----------------------------------------------------------------------------------------------*/
type Tone = "violet" | "sky" | "amber" | "mint" | "rose";

interface Message {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  tone: Tone;
  isMuted?: boolean;
}

const AVATAR_TONES: Record<Tone, string> = {
  amber: "radial-gradient(circle at 32% 28%, #fff7e0 0%, #fdba74 38%, #f97316 70%, #e11d48 100%)",
  mint: "radial-gradient(circle at 32% 28%, #ecfdf5 0%, #6ee7b7 40%, #10b981 70%, #0284c7 100%)",
  rose: "radial-gradient(circle at 32% 28%, #fff1f2 0%, #fda4af 40%, #f43f5e 72%, #9333ea 100%)",
  sky: "radial-gradient(circle at 32% 28%, #f0f9ff 0%, #93c5fd 40%, #3b82f6 70%, #7c3aed 100%)",
  violet: "radial-gradient(circle at 32% 28%, #fdf4ff 0%, #e9a8fb 38%, #c026d3 72%, #be123c 100%)",
};

const MESSAGES: Message[] = [
  {
    id: "product",
    name: "Product Sync",
    preview: "Noor: Shared the updated roadmap draft",
    time: "10:24",
    tone: "violet",
    unread: 2,
  },
  {
    id: "jonas",
    name: "Jonas Weber",
    preview: "Can we move the design review to Thursday?",
    time: "9:12",
    tone: "sky",
    unread: 1,
  },
  {
    id: "climbing",
    name: "Climbing Crew",
    preview: "Mia: Reserved the bouldering hall for Sunday",
    time: "Yesterday",
    tone: "amber",
    unread: 0,
  },
  {
    id: "elena",
    name: "Elena Ruiz",
    preview: "Got it, I will send the slides tonight",
    time: "Tue",
    tone: "mint",
    unread: 0,
  },
  {
    id: "studio",
    name: "Studio Booking",
    preview: "Your session on Friday is confirmed",
    time: "Mon",
    tone: "rose",
    unread: 0,
  },
];

const MessageRow = ({message}: {message: Message}) => (
  <div className="flex items-center gap-3 px-4 py-3.5">
    <span
      aria-hidden="true"
      className="size-12 shrink-0 rounded-full"
      style={{background: AVATAR_TONES[message.tone]}}
    />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1 truncate text-base font-medium text-foreground">
          {message.name}
          {message.isMuted ? (
            <Icon
              aria-label="Muted"
              className="size-3.5 shrink-0 text-muted"
              icon="gravity-ui:bell-slash"
            />
          ) : null}
        </span>
        <span
          className={
            message.unread ? "shrink-0 text-xs text-accent" : "shrink-0 text-xs text-muted"
          }
        >
          {message.time}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm text-muted">{message.preview}</span>
        {message.unread ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
            {message.unread}
          </span>
        ) : null}
      </div>
    </div>
  </div>
);

/** A phone-sized screen like the Native demo recordings. */
const PhoneFrame = ({children, title}: {children: ReactNode; title?: string}) => (
  <div className="relative flex h-[760px] w-[390px] max-w-full flex-col overflow-hidden rounded-[44px] border border-separator bg-background">
    <div className="flex flex-1 flex-col justify-center gap-3 overflow-y-auto px-5 py-12">
      {title ? <p className="text-center text-sm text-muted">{title}</p> : null}
      {children}
    </div>
  </div>
);

const Section = ({children, title}: {children: ReactNode; title: string}) => (
  <section className="flex flex-col gap-3">
    <p className="text-center text-sm text-muted">{title}</p>
    {children}
  </section>
);

const Hint = ({children}: {children: ReactNode}) => (
  <p className="text-center text-xs text-muted">{children}</p>
);

/** Inline rows touch, so the list draws its own inset separators. */
const RowSeparator = () => (
  <div aria-hidden="true" className="bg-surface">
    <Separator className="ms-16 w-auto" />
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    activationThreshold: {control: {max: 40, min: 0, step: 1, type: "range"}},
    closeOnContentPress: {control: "boolean"},
    closeOnOutsidePress: {control: "boolean"},
    friction: {control: {max: 4, min: 1, step: 0.25, type: "range"}},
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {
      control: "boolean",
      description: "Vibrates when the drag crosses the open threshold (touch devices only).",
    },
    openThreshold: {control: {max: 1, min: 0, step: 0.05, type: "range"}},
    overshoot: {control: "boolean"},
    overshootFriction: {control: {max: 20, min: 1, step: 1, type: "range"}},
    variant: {control: {type: "select"}, options: ["standalone", "inline"]},
  },
  component: SwipeableRow,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/SwipeableRow",
} satisfies Meta<typeof SwipeableRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories (one per docs usage section, plus the demo screen)
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {
    activationThreshold: 10,
    closeOnContentPress: true,
    closeOnOutsidePress: true,
    friction: 1,
    isDisabled: false,
    isHapticFeedbackEnabled: true,
    openThreshold: 0.5,
    overshoot: true,
    overshootFriction: 8,
    variant: "standalone",
  },
  render: (args) => {
    const [archived, setArchived] = useState(0);

    return (
      <PhoneFrame title="Swipe the card toward the start edge">
        <SwipeableRow {...args}>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action variant="accent" onPress={() => setArchived((count) => count + 1)}>
              <SwipeableRow.ActionLabel>Archive</SwipeableRow.ActionLabel>
            </SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[0]!} />
          </SwipeableRow.Content>
        </SwipeableRow>
        <Hint>{archived ? `Archived ${archived}x` : "Nothing archived yet"}</Hint>
      </PhoneFrame>
    );
  },
};

export const StartEndAndMultipleActions: Story = {
  render: () => {
    const [log, setLog] = useState("Swipe either way");

    return (
      <PhoneFrame title="Rails on both edges">
        {MESSAGES.slice(0, 3).map((message) => (
          <SwipeableRow key={message.id}>
            <SwipeableRow.Actions side="start">
              <SwipeableRow.Action
                variant="success"
                onPress={() => setLog(`Read: ${message.name}`)}
              >
                Read
              </SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Actions side="end">
              <SwipeableRow.Action
                variant="default"
                onPress={() => setLog(`Muted: ${message.name}`)}
              >
                Mute
              </SwipeableRow.Action>
              <SwipeableRow.Action
                variant="danger"
                onPress={() => setLog(`Deleted: ${message.name}`)}
              >
                Delete
              </SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Content>
              <MessageRow message={message} />
            </SwipeableRow.Content>
          </SwipeableRow>
        ))}
        <Hint>{log}</Hint>
      </PhoneFrame>
    );
  },
};

export const StandaloneAndInlineVariants: Story = {
  render: () => (
    <PhoneFrame>
      <Section title="Spaced cards">
        {MESSAGES.slice(0, 2).map((message) => (
          <SwipeableRow key={message.id}>
            <SwipeableRow.Actions side="end">
              <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Content>
              <MessageRow message={message} />
            </SwipeableRow.Content>
          </SwipeableRow>
        ))}
      </Section>
      <Section title="Gapless rows for lists">
        <div className="overflow-hidden rounded-3xl">
          {MESSAGES.slice(2, 5).map((message, index) => (
            <Fragment key={message.id}>
              {index > 0 ? <RowSeparator /> : null}
              <SwipeableRow variant="inline">
                <SwipeableRow.Actions side="end">
                  <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
                </SwipeableRow.Actions>
                <SwipeableRow.Content>
                  <MessageRow message={message} />
                </SwipeableRow.Content>
              </SwipeableRow>
            </Fragment>
          ))}
        </div>
      </Section>
      <Section title="Custom corners: [0, 16] over 48 px, and always square">
        <div className="overflow-hidden rounded-3xl">
          <SwipeableRow animation={{borderRadius: {distance: 48, value: [0, 16]}}} variant="inline">
            <SwipeableRow.Actions side="end">
              <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Content>
              <MessageRow message={MESSAGES[0]!} />
            </SwipeableRow.Content>
          </SwipeableRow>
          <RowSeparator />
          <SwipeableRow animation={{borderRadius: {value: [0, 0]}}} variant="inline">
            <SwipeableRow.Actions side="end">
              <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Content>
              <MessageRow message={MESSAGES[1]!} />
            </SwipeableRow.Content>
          </SwipeableRow>
        </div>
      </Section>
    </PhoneFrame>
  ),
};

export const ControlledState: Story = {
  render: () => {
    const [openSide, setOpenSide] = useState<SwipeableRowOpenSide>(null);

    return (
      <PhoneFrame title="openSide is stored in React state">
        <SwipeableRow openSide={openSide} onOpenSideChange={setOpenSide}>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[1]!} />
          </SwipeableRow.Content>
        </SwipeableRow>
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="secondary" onPress={() => setOpenSide("end")}>
            Open end
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setOpenSide(null)}>
            Close
          </Button>
        </div>
        <Hint>openSide: {openSide ?? "null"}</Hint>
      </PhoneFrame>
    );
  },
};

/** Reads the enclosing row through `useSwipeableRow` (re-renders while the row moves). */
const RowStatus = () => {
  const {endProgress, openSide, startProgress} = useSwipeableRow();

  return (
    <p className="-mt-1.5 px-4 pb-3 text-xs text-muted tabular-nums">
      useSwipeableRow: {openSide ?? "closed"} · start {startProgress.toFixed(2)} · end{" "}
      {endProgress.toFixed(2)}
    </p>
  );
};

export const ImperativeControls: Story = {
  render: () => {
    const rowRef = useRef<SwipeableRowRootRef>(null);

    return (
      <PhoneFrame title="open, close and reset through the ref">
        <SwipeableRow ref={rowRef}>
          <SwipeableRow.Actions side="start">
            <SwipeableRow.Action variant="accent">Pin</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action variant="default">Mute</SwipeableRow.Action>
            <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[2]!} />
            <RowStatus />
          </SwipeableRow.Content>
        </SwipeableRow>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="secondary" onPress={() => rowRef.current?.open("start")}>
            open(&quot;start&quot;)
          </Button>
          <Button size="sm" variant="secondary" onPress={() => rowRef.current?.open("end")}>
            open(&quot;end&quot;)
          </Button>
          <Button size="sm" variant="secondary" onPress={() => rowRef.current?.close()}>
            close()
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => rowRef.current?.reset()}>
            reset()
          </Button>
        </div>
      </PhoneFrame>
    );
  },
};

export const ActionBehavior: Story = {
  render: () => {
    const [isPinned, setIsPinned] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);

    return (
      <PhoneFrame>
        <Section title="Pin keeps the row open (closeOnPress={false})">
          <SwipeableRow>
            <SwipeableRow.Actions side="end">
              <SwipeableRow.Action
                closeOnPress={false}
                variant="accent"
                onPress={() => setIsPinned((value) => !value)}
              >
                <Icon icon={isPinned ? "gravity-ui:pin-slash" : "gravity-ui:pin"} />
                <SwipeableRow.ActionLabel>{isPinned ? "Unpin" : "Pin"}</SwipeableRow.ActionLabel>
              </SwipeableRow.Action>
              <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Content>
              <MessageRow
                message={{...MESSAGES[3]!, name: isPinned ? "Elena Ruiz (pinned)" : "Elena Ruiz"}}
              />
            </SwipeableRow.Content>
          </SwipeableRow>
        </Section>
        <Section title="isDisabled blocks swiping and presses">
          <SwipeableRow isDisabled={isDisabled}>
            <SwipeableRow.Actions side="end">
              <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
            </SwipeableRow.Actions>
            <SwipeableRow.Content>
              <MessageRow message={MESSAGES[4]!} />
            </SwipeableRow.Content>
          </SwipeableRow>
          <div className="flex justify-center">
            <Button size="sm" variant="secondary" onPress={() => setIsDisabled((value) => !value)}>
              {isDisabled ? "Enable row" : "Disable row"}
            </Button>
          </div>
        </Section>
      </PhoneFrame>
    );
  },
};

export const ScreenReaders: Story = {
  render: () => (
    <PhoneFrame title="Tab to the row, then use the arrow keys or Escape">
      <SwipeableRow
        accessibilityCloseActionsLabel="Dismiss actions"
        accessibilityOpenEndActionsLabel="Reveal more actions"
        accessibilityOpenStartActionsLabel="Reveal quick actions"
      >
        <SwipeableRow.Actions side="start">
          <SwipeableRow.Action variant="success">
            <Icon icon="gravity-ui:eye" />
            <SwipeableRow.ActionLabel>Read</SwipeableRow.ActionLabel>
          </SwipeableRow.Action>
        </SwipeableRow.Actions>
        <SwipeableRow.Actions side="end">
          <SwipeableRow.Action variant="default">
            <Icon icon="gravity-ui:bell" />
            <SwipeableRow.ActionLabel>Mute</SwipeableRow.ActionLabel>
          </SwipeableRow.Action>
          <SwipeableRow.Action variant="danger">
            <Icon icon="gravity-ui:trash-bin" />
            <SwipeableRow.ActionLabel>Delete</SwipeableRow.ActionLabel>
          </SwipeableRow.Action>
        </SwipeableRow.Actions>
        <SwipeableRow.Content>
          <MessageRow message={MESSAGES[1]!} />
        </SwipeableRow.Content>
      </SwipeableRow>
      <Hint>
        Screen readers also get hidden &quot;Reveal quick actions&quot;, &quot;Reveal more
        actions&quot; and &quot;Dismiss actions&quot; buttons inside the row.
      </Hint>
    </PhoneFrame>
  ),
};

const ArchiveContent = ({progress}: {progress: number}) => (
  <span
    className="flex flex-col items-center gap-1"
    style={{
      opacity: progress,
      transform: `scale(${0.8 + progress * 0.2})`,
    }}
  >
    <Icon icon="gravity-ui:archive" />
    <SwipeableRow.ActionLabel>Archive</SwipeableRow.ActionLabel>
  </span>
);

export const ActionZoom: Story = {
  render: () => (
    <PhoneFrame>
      <Section title="Default zoom: slide 15 px, scale 0.5 to 1, fade in">
        <SwipeableRow>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action variant="default">
              <Icon icon="gravity-ui:bell" />
              <SwipeableRow.ActionLabel>Mute</SwipeableRow.ActionLabel>
            </SwipeableRow.Action>
            <SwipeableRow.Action variant="danger">
              <Icon icon="gravity-ui:trash-bin" />
              <SwipeableRow.ActionLabel>Delete</SwipeableRow.ActionLabel>
            </SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[0]!} />
          </SwipeableRow.Content>
        </SwipeableRow>
      </Section>
      <Section title="Custom ranges and a static action">
        <SwipeableRow>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action animation={false}>Static</SwipeableRow.Action>
            <SwipeableRow.Action
              variant="danger"
              animation={{
                opacity: {value: [0.4, 1]},
                pressScale: {timingConfig: {duration: 100}, value: 0.9},
                scale: {value: [0.8, 1]},
                translateX: {value: [12, 0]},
              }}
            >
              Delete
            </SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[2]!} />
          </SwipeableRow.Content>
        </SwipeableRow>
      </Section>
    </PhoneFrame>
  ),
};

export const RubberBand: Story = {
  render: () => (
    <PhoneFrame>
      <Section title="overshoot (default): drag right to feel the rubber band">
        <SwipeableRow>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[3]!} />
          </SwipeableRow.Content>
        </SwipeableRow>
      </Section>
      <Section title="overshoot={false}: hard stop at the rail">
        <SwipeableRow overshoot={false}>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow message={MESSAGES[4]!} />
          </SwipeableRow.Content>
        </SwipeableRow>
      </Section>
    </PhoneFrame>
  ),
};

export const AnimatedActionContent: Story = {
  render: () => (
    <PhoneFrame title="The rail render function receives live progress">
      <SwipeableRow>
        <SwipeableRow.Actions side="end">
          {({progress}) => (
            <SwipeableRow.Action animation={false} variant="accent">
              <ArchiveContent progress={progress} />
            </SwipeableRow.Action>
          )}
        </SwipeableRow.Actions>
        <SwipeableRow.Content>
          <MessageRow message={MESSAGES[1]!} />
        </SwipeableRow.Content>
      </SwipeableRow>
    </PhoneFrame>
  ),
};

interface InboxProps {
  allowsFullSwipe?: boolean;
  title: string;
}

const Inbox = ({allowsFullSwipe = false, title}: InboxProps) => {
  const [messages, setMessages] = useState(MESSAGES.slice(0, 4));

  const update = (id: string, patch: Partial<Message>) =>
    setMessages((list) => list.map((item) => (item.id === id ? {...item, ...patch} : item)));

  return (
    <PhoneFrame title={title}>
      <div className="overflow-hidden rounded-3xl">
        {messages.map((message, index) => (
          <Fragment key={message.id}>
            {index > 0 ? <RowSeparator /> : null}
            <SwipeableRow variant="inline">
              <SwipeableRow.Actions allowsFullSwipe={allowsFullSwipe} side="start">
                <SwipeableRow.Action
                  variant="success"
                  onPress={() => update(message.id, {unread: 0})}
                >
                  <Icon icon="gravity-ui:eye" />
                  <SwipeableRow.ActionLabel>Read</SwipeableRow.ActionLabel>
                </SwipeableRow.Action>
              </SwipeableRow.Actions>
              <SwipeableRow.Actions allowsFullSwipe={allowsFullSwipe} side="end">
                <SwipeableRow.Action
                  onPress={() => update(message.id, {isMuted: !message.isMuted})}
                >
                  <Icon icon="gravity-ui:bell" />
                  <SwipeableRow.ActionLabel>Mute</SwipeableRow.ActionLabel>
                </SwipeableRow.Action>
                <SwipeableRow.Action
                  variant="danger"
                  onPress={() =>
                    setMessages((list) => list.filter((item) => item.id !== message.id))
                  }
                >
                  <Icon icon="gravity-ui:trash-bin" />
                  <SwipeableRow.ActionLabel>Delete</SwipeableRow.ActionLabel>
                </SwipeableRow.Action>
              </SwipeableRow.Actions>
              <SwipeableRow.Content>
                <MessageRow message={message} />
              </SwipeableRow.Content>
            </SwipeableRow>
          </Fragment>
        ))}
      </div>
      {messages.length < 4 ? (
        <div className="flex justify-center">
          <Button size="sm" variant="ghost" onPress={() => setMessages(MESSAGES.slice(0, 4))}>
            Restore messages
          </Button>
        </div>
      ) : null}
    </PhoneFrame>
  );
};

export const Example: Story = {
  render: () => <Inbox title="Gapless rows for lists" />,
};

export const FullSwipe: Story = {
  render: () => (
    <Inbox allowsFullSwipe title="Web extension: swipe all the way to run the outer action" />
  ),
};
