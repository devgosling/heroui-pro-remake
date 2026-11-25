import type {ApprovalCardQuestion, ApprovalCardSubmitResult} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Avatar, Checkbox, Chip, Kbd, Label} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useEffect, useState} from "react";

import {ApprovalCard} from "./index";

const deployQuestions: ApprovalCardQuestion[] = [
  {
    id: "region",
    options: [
      {description: "Closest to most of your customers", id: "frankfurt", label: "Frankfurt"},
      {description: "Cheapest egress for the public API", id: "virginia", label: "Virginia"},
      {description: "Lowest latency for the mobile team", id: "singapore", label: "Singapore"},
    ],
    title: "Where should the app run?",
  },
  {
    id: "checks",
    options: [
      {description: "Roughly two minutes on every push", id: "unit", label: "Unit tests"},
      {description: "Catches broken imports before review", id: "types", label: "Type check"},
      {description: "Screenshots of every changed screen", id: "visual", label: "Visual diff"},
    ],
    selectionMode: "multiple",
    title: "What runs before each deploy?",
  },
  {
    allowCustom: true,
    id: "recovery",
    options: [
      {description: "Restore the last healthy release", id: "rollback", label: "Roll back"},
      {description: "Keep the release, hold new traffic", id: "pause", label: "Pause traffic"},
      {description: "Leave the call to whoever is on duty", id: "page", label: "Page on-call"},
    ],
    title: "How should a failed deploy recover?",
  },
];

const meta = {
  argTypes: {
    variant: {
      control: {type: "select"},
      options: ["transparent", "default", "secondary", "tertiary"],
    },
  },
  args: {
    questions: deployQuestions,
    variant: "default",
  },
  component: ApprovalCard,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ApprovalCard",
} satisfies Meta<typeof ApprovalCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
const DemoPage = ({children}: {children: React.ReactNode}) => (
  <div className="flex min-h-screen items-center justify-center p-6">{children}</div>
);

const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
const DefaultDemo = ({
  questions,
  variant,
}: Pick<ApprovalCard["Props"], "questions" | "variant">) => {
  const [status, setStatus] = useState<string | null>(null);

  if (status) return <p className="text-sm text-muted">{status}</p>;

  return (
    <ApprovalCard
      className="w-full max-w-100"
      questions={questions}
      variant={variant}
      onDismiss={() => setStatus("Dismissed. Nothing gets deployed.")}
      onSubmit={({answers, skipped}: ApprovalCardSubmitResult) =>
        setStatus(
          `${pluralize(Object.keys(answers).length, "answer")} sent, ${skipped.length} left open.`,
        )
      }
    />
  );
};

export const Default: Story = {
  render: (args) => (
    <DemoPage>
      <DefaultDemo questions={args.questions} variant={args.variant} />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom approval (one confirmation question, custom layout)
 * -----------------------------------------------------------------------------------------------*/
const orderQuestion: ApprovalCardQuestion[] = [{id: "order", title: "Order 12 desk chairs"}];

const CustomApprovalDemo = ({variant}: {variant?: ApprovalCard["Props"]["variant"]}) => {
  const [status, setStatus] = useState<string | null>(null);
  const [alwaysAllow, setAlwaysAllow] = useState(false);
  const subtitleId = React.useId();
  const totalId = React.useId();

  if (status) return <p className="text-sm text-muted">{status}</p>;

  const decline = () => setStatus("Declined. No order was placed.");

  return (
    <ApprovalCard
      aria-describedby={`${subtitleId} ${totalId}`}
      className="@container w-full max-w-120"
      questions={orderQuestion}
      variant={variant}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        decline();
      }}
      onSubmit={({answers}) => {
        if ("order" in answers) {
          setStatus(
            alwaysAllow
              ? "Ordered. Orders under $3,000 now go through without asking."
              : "Ordered. The confirmation went to the office channel.",
          );
        } else {
          decline();
        }
      }}
    >
      <ApprovalCard.Header className="items-center">
        <Avatar className="size-14 outline -outline-offset-1 outline-foreground/10 [--avatar-radius:calc(min(32px,var(--radius-3xl))-var(--spacing)*4)]">
          <Avatar.Fallback className="bg-accent-soft text-accent-soft-foreground">
            <Icon className="size-7" icon="gravity-ui:box" />
          </Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ApprovalCard.Title />
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted" id={subtitleId}>
            <span>Ergo Works Office</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Icon aria-hidden="true" className="size-3.5" icon="gravity-ui:star-fill" />
              4.7
            </span>
          </p>
        </div>
      </ApprovalCard.Header>
      <ApprovalCard.Content className="gap-6 px-2 pt-4 pb-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 @sm:grid-cols-4">
          {[
            ["Delivery", "Tue, Mar 4"],
            ["Desk area", "Office 3B"],
            ["Quantity", "12 chairs"],
            ["Color", "Graphite"],
          ].map(([term, detail]) => (
            <div key={term} className="flex flex-col gap-1">
              <dt className="text-xs text-muted">{term}</dt>
              <dd className="text-sm text-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col items-start gap-3">
          <dl className="flex w-full flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">$219 × 12 chairs</dt>
              <dd className="text-foreground tabular-nums">$2,628.00</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Shipping and tax</dt>
              <dd className="text-foreground tabular-nums">$236.52</dd>
            </div>
            <div className="flex justify-between gap-4 font-medium text-foreground" id={totalId}>
              <dt>Total</dt>
              <dd className="tabular-nums">$2,864.52</dd>
            </div>
          </dl>
          <Chip color="success" size="sm" variant="soft">
            Free returns for 30 days
          </Chip>
        </div>
      </ApprovalCard.Content>
      <ApprovalCard.Footer className="flex-wrap">
        <Checkbox isSelected={alwaysAllow} variant="secondary" onChange={setAlwaysAllow}>
          <Checkbox.Content className="gap-2">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label className="text-xs font-normal text-muted">Always allow under $3,000</Label>
          </Checkbox.Content>
        </Checkbox>
        <ApprovalCard.Actions>
          <ApprovalCard.Skip className="h-8 not-pointer-coarse:pe-1.5" variant="tertiary">
            Decline
            <Kbd
              aria-hidden="true"
              className="h-5 min-w-5 rounded-[calc(var(--radius-3xl)-var(--spacing)*1.5)] bg-current/10 px-1 text-xs leading-none text-(--button-fg) inset-ring inset-ring-current/6 *:text-current/70 pointer-coarse:hidden"
            >
              <Kbd.Abbr keyValue="escape" />
            </Kbd>
          </ApprovalCard.Skip>
          <ApprovalCard.Continue className="h-8 not-pointer-coarse:pe-1.5">
            Order
            <Kbd
              aria-hidden="true"
              className="h-5 min-w-5 rounded-[calc(var(--radius-3xl)-var(--spacing)*1.5)] bg-current/16 px-1 text-xs leading-none text-(--button-fg) inset-ring inset-ring-current/6 *:text-current/70 pointer-coarse:hidden"
            >
              <Kbd.Abbr keyValue="command" />
              <Kbd.Abbr keyValue="enter" />
            </Kbd>
          </ApprovalCard.Continue>
        </ApprovalCard.Actions>
      </ApprovalCard.Footer>
    </ApprovalCard>
  );
};

export const CustomApproval: Story = {
  render: (args) => (
    <DemoPage>
      <CustomApprovalDemo variant={args.variant} />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With AI SDK (simulated `ask_user` tool part: input-streaming -> input-available -> output)
 * -----------------------------------------------------------------------------------------------*/
type ToolPartState = "input-streaming" | "input-available" | "output-available" | "output-error";

const tripQuestions: ApprovalCardQuestion[] = [
  {
    id: "Which hotel should I book?",
    options: [
      {
        description: "Rooftop pool, 4 min to the tram, $210 a night",
        id: "Casa Alfama",
        label: "Casa Alfama",
      },
      {
        description: "Quiet street near the river, $165 a night",
        id: "Rio Suites",
        label: "Rio Suites",
      },
      {
        description: "Hostel private room, $90 a night",
        id: "Baixa Rooms",
        label: "Baixa Rooms",
      },
    ],
    title: "Which hotel should I book?",
  },
  {
    allowCustom: true,
    id: "Anything else to arrange?",
    options: [
      {description: "Keep the room until 2 PM, $25", id: "Late checkout", label: "Late checkout"},
      {
        description: "A car waiting at arrivals, $40",
        id: "Airport transfer",
        label: "Airport transfer",
      },
      {description: "Served on the terrace, $18 a day", id: "Breakfast", label: "Breakfast"},
    ],
    selectionMode: "multiple",
    title: "Anything else to arrange?",
  },
];

const WithAISDKDemo = ({variant}: {variant?: ApprovalCard["Props"]["variant"]}) => {
  const [state, setState] = useState<ToolPartState>("input-streaming");
  const [result, setResult] = useState<ApprovalCardSubmitResult | null>(null);
  const [reply, setReply] = useState<string | null>(null);

  // The tool input streams in first; the card renders once the part reaches input-available.
  useEffect(() => {
    const timer = setTimeout(() => setState("input-available"), 600);

    return () => clearTimeout(timer);
  }, []);

  // After the output is in, the run resumes and the assistant continues.
  useEffect(() => {
    if (state !== "output-available" && state !== "output-error") return;

    const hotel = result?.answers[tripQuestions[0]!.id]?.selected[0];
    const timer = setTimeout(
      () =>
        setReply(
          state === "output-error"
            ? "Okay, I'll leave the booking to you."
            : hotel
              ? `Booking ${hotel} for Friday to Sunday now.`
              : "No hotel picked, so I'll keep looking.",
        ),
      600,
    );

    return () => clearTimeout(timer);
  }, [result, state]);

  return (
    <div className="flex w-full max-w-100 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Plan a weekend in Lisbon for two</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm">I found three hotels. Two quick questions first.</p>
        {state === "input-available" ? (
          <ApprovalCard
            questions={tripQuestions}
            variant={variant}
            onDismiss={() => setState("output-error")}
            onSubmit={(submitResult) => {
              setResult(submitResult);
              setState("output-available");
            }}
          />
        ) : null}
        {state === "output-available" && result ? (
          <p className="text-sm text-muted">
            Answered {Object.keys(result.answers).length} of {tripQuestions.length} questions
          </p>
        ) : null}
        {state === "output-error" ? <p className="text-sm text-muted">Dismissed</p> : null}
        {reply ? <p className="text-sm">{reply}</p> : null}
      </div>
    </div>
  );
};

export const WithAISDK: Story = {
  name: "With AI SDK",
  render: (args) => (
    <DemoPage>
      <WithAISDKDemo variant={args.variant} />
    </DemoPage>
  ),
};
