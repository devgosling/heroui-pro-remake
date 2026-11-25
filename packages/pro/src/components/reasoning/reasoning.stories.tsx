import type {ReasoningStatus} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Button, Spinner} from "@heroui/react";
import React, {useCallback, useEffect, useRef, useState} from "react";

import {Reasoning} from "./index";

const meta = {
  argTypes: {
    autoExpand: {
      control: "boolean",
      description: "Opens the trace when the first content streams in",
    },
    collapseDelay: {
      control: {min: 0, step: 250, type: "number"},
      description: "Milliseconds before the automatic collapse. Infinity never collapses",
    },
    defaultExpanded: {control: "boolean", description: "Initial state when uncontrolled"},
    duration: {control: "text", description: "Formatted thinking time, such as 9s"},
    status: {
      control: "select",
      description: "Run status of this block",
      options: ["streaming", "complete", "stopped", "error"],
    },
  },
  args: {
    autoExpand: true,
    collapseDelay: 1000,
  },
  component: Reasoning,
  parameters: {layout: "padded"},
  title: "Pro/AI/Reasoning",
} satisfies Meta<typeof Reasoning>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
const tripThinking =
  "The traveler wants a two-day plan in Lisbon on a small budget. I will check free museum days, then group the sights by neighborhood.";

const recipeThinking =
  "The question is how to keep sourdough from spreading in the oven. I will look at hydration first, then shaping tension, then the proofing time.";

const answerText =
  "Spend day one in Alfama and Baixa on foot, and day two in Belém, where several museums are free on Sunday mornings.";

/* -------------------------------------------------------------------------------------------------
 * Helpers (story-only stream simulation)
 * -----------------------------------------------------------------------------------------------*/
const TOKEN_PATTERN = /\S+\s*/g;

/** Formats elapsed milliseconds as whole seconds, rounded up ("3s"). */
const formatSeconds = (ms: number) => `${Math.max(1, Math.ceil(ms / 1000))}s`;

interface SimulatedStream {
  text: string;
  status: ReasoningStatus;
  duration?: string;
  stop: () => void;
}

/** Streams `source` word by word after `startDelay`, then reports `complete` with a duration. */
function useSimulatedStream(source: string, startDelay = 750, interval = 70): SimulatedStream {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ReasoningStatus>("streaming");
  const [duration, setDuration] = useState<string>();
  const startRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    const tokens = source.match(TOKEN_PATTERN) ?? [];

    startRef.current = performance.now();
    tokens.forEach((_, index) => {
      timersRef.current.push(
        setTimeout(
          () => setText(tokens.slice(0, index + 1).join("")),
          startDelay + index * interval,
        ),
      );
    });
    timersRef.current.push(
      setTimeout(
        () => {
          setDuration(formatSeconds(performance.now() - startRef.current));
          setStatus("complete");
        },
        startDelay + tokens.length * interval,
      ),
    );

    return clearTimers;
  }, [clearTimers, interval, source, startDelay]);

  const stop = useCallback(() => {
    clearTimers();
    setDuration(formatSeconds(performance.now() - startRef.current));
    setStatus("stopped");
  }, [clearTimers]);

  return {duration, status, stop, text};
}

/* -------------------------------------------------------------------------------------------------
 * Mock chat (stands in for the AI SDK `useChat` hook)
 * -----------------------------------------------------------------------------------------------*/
type MockPart =
  | {type: "reasoning"; text: string; state: "streaming" | "done"}
  | {type: "text"; text: string; state: "streaming" | "done"};

interface MockMessage {
  id: string;
  role: "user" | "assistant";
  parts: MockPart[];
  /** Saved in `onFinish`: the outcome survives a reload. */
  metadata?: {duration?: string; outcome?: ReasoningStatus};
}

/**
 * Replays an assistant message as a run of reasoning parts followed by a text part. Like the AI SDK,
 * a stop leaves the last part at `streaming`; the outcome is recorded in `onFinish` instead.
 */
function useMockChat(question: string, reasoningParts: string[], answer: string) {
  const [messages, setMessages] = useState<MockMessage[]>([
    {id: "user-1", parts: [{state: "done", text: question, type: "text"}], role: "user"},
    {id: "assistant-1", parts: [], role: "assistant"},
  ]);
  const [isRunning, setIsRunning] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startRef = useRef(0);

  const updateAssistant = useCallback((update: (message: MockMessage) => MockMessage) => {
    setMessages((current) => current.map((m) => (m.role === "assistant" ? update(m) : m)));
  }, []);

  const onFinish = useCallback(
    (outcome: ReasoningStatus) => {
      const duration = formatSeconds(performance.now() - startRef.current);

      updateAssistant((message) => ({...message, metadata: {duration, outcome}}));
      setIsRunning(false);
    },
    [updateAssistant],
  );

  useEffect(() => {
    const schedule = (delay: number, run: () => void) => {
      timersRef.current.push(setTimeout(run, delay));
    };
    let time = 1100;

    startRef.current = performance.now();

    reasoningParts.forEach((partText, partIndex) => {
      const tokens = partText.match(TOKEN_PATTERN) ?? [];

      tokens.forEach((_, index) => {
        schedule(time, () =>
          updateAssistant((message) => {
            const parts = message.parts.map((part): MockPart =>
              part.type === "reasoning" ? {...part, state: "done" as const} : part,
            );
            const text = tokens.slice(0, index + 1).join("");

            if (parts.length > partIndex) {
              parts[partIndex] = {state: "streaming", text, type: "reasoning"};
            } else {
              parts.push({state: "streaming", text, type: "reasoning"});
            }

            return {...message, parts};
          }),
        );
        time += 70;
      });
    });

    // Reasoning ends: the server sends the duration as metadata.
    schedule(time, () =>
      updateAssistant((message) => ({
        ...message,
        metadata: {duration: formatSeconds(performance.now() - startRef.current)},
        parts: message.parts.map((part) => ({...part, state: "done" as const})),
      })),
    );

    const answerTokens = answer.match(TOKEN_PATTERN) ?? [];

    time += 150;
    answerTokens.forEach((_, index) => {
      schedule(time, () =>
        updateAssistant((message) => ({
          ...message,
          parts: [
            ...message.parts.filter((part) => part.type === "reasoning"),
            {state: "streaming", text: answerTokens.slice(0, index + 1).join(""), type: "text"},
          ],
        })),
      );
      time += 60;
    });
    schedule(time, () => {
      updateAssistant((message) => ({
        ...message,
        metadata: {...message.metadata, outcome: "complete"},
        parts: message.parts.map((part) => ({...part, state: "done" as const})),
      }));
      setIsRunning(false);
    });

    const timers = timersRef.current;

    return () => timers.forEach(clearTimeout);
  }, [answer, reasoningParts, updateAssistant]);

  const stop = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    onFinish("stopped");
  }, [onFinish]);

  return {isRunning, messages, stop};
}

/** Joins a run of reasoning parts into one block and reads the state of the last part. */
function getReasoningState(message: MockMessage) {
  const reasoning = message.parts.filter((part) => part.type === "reasoning");
  const text = reasoning.map((part) => part.text).join("\n\n");
  const last = reasoning.at(-1);
  const outcome = message.metadata?.outcome;
  let status: ReasoningStatus = "streaming";

  // A stop or an error leaves the part at `streaming`, so the recorded outcome wins.
  if (outcome === "stopped" || outcome === "error") status = outcome;
  else if (outcome === "complete" || (last && last.state === "done")) status = "complete";

  return {duration: message.metadata?.duration, status, text};
}

const lisbonReasoningParts = [
  "The traveler wants a cheap two-day plan in Lisbon. The city guide lists free museum hours, so I will group the sights by neighborhood.",
];

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/

/* Pro demo "default": one block that streams, auto opens, then collapses after it completes. */
export const Default: Story = {
  render: function DefaultStory(args) {
    const {duration, status, text} = useSimulatedStream(tripThinking);

    return (
      <Reasoning {...args} duration={duration} status={status}>
        <Reasoning.Trigger />
        <Reasoning.Content>
          <Reasoning.Text>{text}</Reasoning.Text>
        </Reasoning.Content>
      </Reasoning>
    );
  },
};

/* Pro demo "status": a stopped run (collapsed, with duration) and a failed run (left open). */
export const Status: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <Reasoning {...args} duration="5s" status="stopped">
        <Reasoning.Trigger />
        <Reasoning.Content>
          <Reasoning.Text>
            The traveler wants a cheap two-day plan in Lisbon. The city guide lists free museum
            hours and
          </Reasoning.Text>
        </Reasoning.Content>
      </Reasoning>
      <Reasoning {...args} defaultExpanded status="error">
        <Reasoning.Trigger />
        <Reasoning.Content>
          <Reasoning.Text>
            The traveler wants a cheap two-day plan in Lisbon. I will check the city guide first,
            then
          </Reasoning.Text>
        </Reasoning.Content>
      </Reasoning>
    </div>
  ),
};

/* Pro demo "with-ai-sdk": reasoning parts of a chat message, a Stop button and the answer. */
export const WithAISDK: Story = {
  name: "With AI SDK",
  render: function WithAISDKStory(args) {
    const {isRunning, messages, stop} = useMockChat(
      "How do I spend two cheap days in Lisbon?",
      lisbonReasoningParts,
      answerText,
    );

    return (
      <div className="flex w-full flex-col gap-4">
        <Button
          className="self-start"
          isDisabled={!isRunning}
          size="sm"
          variant="secondary"
          onPress={stop}
        >
          Stop
        </Button>
        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex flex-col gap-2">
                {message.parts.map((part, index) => (
                  <p key={index} className="text-sm font-medium">
                    {part.text}
                  </p>
                ))}
              </div>
            );
          }

          const reasoning = getReasoningState(message);
          const answer = message.parts.find((part) => part.type === "text");

          return (
            <div key={message.id} className="flex flex-col gap-2">
              <Reasoning {...args} duration={reasoning.duration} status={reasoning.status}>
                <Reasoning.Trigger />
                <Reasoning.Content>
                  <Reasoning.Text>{reasoning.text}</Reasoning.Text>
                </Reasoning.Content>
              </Reasoning>
              {answer ? <p className="text-sm">{answer.text}</p> : null}
            </div>
          );
        })}
      </div>
    );
  },
};

/* Pro demo "custom-loader": another Loader variant, and a Spinner as a custom indicator. */
export const CustomLoader: Story = {
  render: function CustomLoaderStory(args) {
    const first = useSimulatedStream(recipeThinking);
    const second = useSimulatedStream(recipeThinking);

    return (
      <div className="flex w-full flex-col gap-6">
        <Reasoning {...args} duration={first.duration} status={first.status}>
          <Reasoning.Trigger>
            <Reasoning.Loader variant="sparkle" />
            <Reasoning.Label />
            <Reasoning.Indicator />
          </Reasoning.Trigger>
          <Reasoning.Content>
            <Reasoning.Text>{first.text}</Reasoning.Text>
          </Reasoning.Content>
        </Reasoning>
        <Reasoning {...args} duration={second.duration} status={second.status}>
          <Reasoning.Trigger>
            <Reasoning.Loader>
              <Spinner color="current" size="sm" />
            </Reasoning.Loader>
            <Reasoning.Label />
            <Reasoning.Indicator />
          </Reasoning.Trigger>
          <Reasoning.Content>
            <Reasoning.Text>{second.text}</Reasoning.Text>
          </Reasoning.Content>
        </Reasoning>
      </div>
    );
  },
};

/* Docs "History": a saved message needs no status; complete never collapses on its own. */
export const History: Story = {
  args: {duration: "9s", status: "complete"},
  render: (args) => (
    <Reasoning {...args}>
      <Reasoning.Trigger />
      <Reasoning.Content>
        <Reasoning.Text>{tripThinking}</Reasoning.Text>
      </Reasoning.Content>
    </Reasoning>
  ),
};

/* Docs "Localization": a function child replaces the complete text and places the duration. */
export const CustomLabel: Story = {
  render: function CustomLabelStory(args) {
    const {duration, status, text} = useSimulatedStream(recipeThinking);

    return (
      <Reasoning {...args} duration={duration} status={status}>
        <Reasoning.Trigger>
          <Reasoning.Loader />
          <Reasoning.Label>
            {({defaultChildren, duration: time, status: current}) =>
              current === "complete" && time ? (
                <>
                  Reasoned for <Reasoning.Duration />
                </>
              ) : (
                defaultChildren
              )
            }
          </Reasoning.Label>
          <Reasoning.Indicator />
        </Reasoning.Trigger>
        <Reasoning.Content>
          <Reasoning.Text>{text}</Reasoning.Text>
        </Reasoning.Content>
      </Reasoning>
    );
  },
};
