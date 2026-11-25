import type {
  ChainOfThoughtStepDisplayStatus,
  ChainOfThoughtStepStatus,
  ChainOfThoughtStepStatusLabelRenderProps,
} from "./index";
import type {ReasoningLabelRenderProps} from "../reasoning";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Icon} from "@iconify/react";
import React, {useEffect, useState} from "react";

import {Reasoning} from "../reasoning";
import {TextShimmer} from "../text-shimmer";

import {ChainOfThought} from "./index";

const meta = {
  argTypes: {
    status: {
      control: {type: "select"},
      description: "Run status (defaults to the enclosing Reasoning status, else complete)",
      options: ["streaming", "complete", "stopped", "error"],
    },
  },
  component: ChainOfThought,
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ChainOfThought",
} satisfies Meta<typeof ChainOfThought>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const DemoPage = ({children, gap = "gap-3"}: {children: ReactNode; gap?: string}) => (
  <div className="flex min-h-screen w-full flex-col justify-center bg-background p-6 text-foreground">
    <div className={`flex w-full max-w-xl flex-col ${gap}`}>{children}</div>
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Default: a simulated agent run. A thinking block streams its text, then three tool blocks run
 * their steps one after another (every ~0.9s the active step settles and the next one starts).
 * Every phase is its own Reasoning; finished blocks stay open (`collapseDelay={Infinity}`).
 * -----------------------------------------------------------------------------------------------*/
type RunStep = {
  active: string;
  done: string;
  description?: string;
};

type RunBlock = {
  activeLabel: string;
  doneLabel: string;
  icon: string;
  steps: RunStep[];
};

const THINKING_TEXT =
  "The user wants a dark mode switch in the settings. I will look at the theme setup and the settings layout first, then add the switch next to the other appearance options.";

const RUN_BLOCKS: RunBlock[] = [
  {
    activeLabel: "Looking around",
    doneLabel: "Looked at 3 files",
    icon: "gravity-ui:file",
    steps: [
      {active: "Reading src/theme/tokens.ts", done: "Read src/theme/tokens.ts"},
      {active: "Reading src/settings/page.tsx", done: "Read src/settings/page.tsx"},
      {
        active: "Reading src/ui/switch.tsx",
        description: "Exports Switch and SwitchLabel",
        done: "Read src/ui/switch.tsx",
      },
    ],
  },
  {
    activeLabel: "Making changes",
    doneLabel: "Changed 2 files",
    icon: "gravity-ui:file",
    steps: [
      {
        active: "Creating src/settings/theme-switch.tsx",
        description: "Switch bound to the theme store",
        done: "Created src/settings/theme-switch.tsx",
      },
      {
        active: "Updating src/settings/page.tsx",
        description: "Added the switch under Appearance",
        done: "Updated src/settings/page.tsx",
      },
    ],
  },
  {
    activeLabel: "Verifying",
    doneLabel: "Verified with 2 checks",
    icon: "gravity-ui:file",
    steps: [
      {active: "Running the unit tests", description: "48 passed", done: "Ran the unit tests"},
      {
        active: "Running the formatter",
        description: "Nothing to change",
        done: "Ran the formatter",
      },
    ],
  },
];

const TICK = 90;
const TEXT_START = 1200;
const TEXT_END = 3300;
const TOOLS_START = 4100;
const STEP_DURATION = 910;
const RUN_END =
  TOOLS_START + RUN_BLOCKS.reduce((total, block) => total + block.steps.length, 0) * STEP_DURATION;
/** The tool blocks run back to back after the thinking text. */
const TIMED_RUN_BLOCKS = RUN_BLOCKS.map((block, index) => ({
  block,
  start: RUN_BLOCKS.slice(0, index).reduce(
    (total, previous) => total + previous.steps.length * STEP_DURATION,
    TOOLS_START,
  ),
}));

const useElapsed = (end: number) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      const next = performance.now() - start;

      setElapsed(next);
      if (next > end) window.clearInterval(id);
    }, TICK);

    return () => window.clearInterval(id);
  }, [end]);

  return elapsed;
};

const SimulatedRun = () => {
  const elapsed = useElapsed(RUN_END + TICK);
  const words = THINKING_TEXT.split(" ");
  const shownWords =
    elapsed < TEXT_START
      ? 0
      : Math.min(
          words.length,
          Math.ceil(((elapsed - TEXT_START) / (TEXT_END - TEXT_START)) * words.length),
        );
  const isThinking = elapsed < TOOLS_START;

  return (
    <>
      <Reasoning
        defaultExpanded
        collapseDelay={Infinity}
        duration="3s"
        status={isThinking ? "streaming" : "complete"}
      >
        <Reasoning.Trigger />
        <Reasoning.Content>
          <Reasoning.Text>{words.slice(0, shownWords).join(" ")}</Reasoning.Text>
        </Reasoning.Content>
      </Reasoning>
      {TIMED_RUN_BLOCKS.map(({block, start}) => {
        if (elapsed < start) return null;

        const startedSteps = Math.min(
          block.steps.length,
          Math.floor((elapsed - start) / STEP_DURATION) + 1,
        );
        const isRunning = elapsed < start + block.steps.length * STEP_DURATION;

        return (
          <Reasoning
            key={block.doneLabel}
            defaultExpanded
            collapseDelay={Infinity}
            status={isRunning ? "streaming" : "complete"}
          >
            <Reasoning.Trigger>
              <Reasoning.Loader />
              <Reasoning.Label>
                {({isStreaming}) =>
                  isStreaming ? <TextShimmer>{block.activeLabel}</TextShimmer> : block.doneLabel
                }
              </Reasoning.Label>
              <Reasoning.Indicator />
            </Reasoning.Trigger>
            <Reasoning.Content>
              <ChainOfThought>
                {block.steps.slice(0, startedSteps).map((step, index) => {
                  const isActive = isRunning && index === startedSteps - 1;

                  return (
                    <ChainOfThought.Step
                      key={step.done}
                      indicator={<Icon icon={block.icon} />}
                      status={isActive ? "active" : "complete"}
                    >
                      <ChainOfThought.StepTitle>
                        {isActive ? step.active : step.done}
                      </ChainOfThought.StepTitle>
                      {!isActive && step.description ? (
                        <ChainOfThought.StepDescription>
                          {step.description}
                        </ChainOfThought.StepDescription>
                      ) : null}
                    </ChainOfThought.Step>
                  );
                })}
              </ChainOfThought>
            </Reasoning.Content>
          </Reasoning>
        );
      })}
    </>
  );
};

/* Pro demo "default": a simulated agent run, one Reasoning per phase. */
export const Default: Story = {
  render: () => (
    <DemoPage>
      <SimulatedRun />
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Status
 * -----------------------------------------------------------------------------------------------*/
type StatusStep = {
  description?: string;
  status?: ChainOfThoughtStepStatus;
  title: string;
};

const STATUS_STEPS: StatusStep[] = [
  {status: "complete", title: "Read src/billing/invoice.ts"},
  {description: "invoice.test.ts: 2 failing", status: "error", title: "Ran the invoice tests"},
  {status: "active", title: "Fixing the rounding error"},
  {status: "pending", title: "Run the invoice tests again"},
];

const StatusSteps = ({steps = STATUS_STEPS}: {steps?: StatusStep[]}) => (
  <ChainOfThought>
    {steps.map((step) => (
      <ChainOfThought.Step key={step.title} status={step.status}>
        <ChainOfThought.StepTitle>{step.title}</ChainOfThought.StepTitle>
        {step.description ? (
          <ChainOfThought.StepDescription>{step.description}</ChainOfThought.StepDescription>
        ) : null}
      </ChainOfThought.Step>
    ))}
  </ChainOfThought>
);

/*
 * Pro demo "status": the same steps in a streaming run and in a stopped run. The lists take the
 * run status from their Reasoning: once it stopped, the active step reads as interrupted and the
 * pending step is hidden.
 */
export const Status: Story = {
  render: () => (
    <DemoPage gap="gap-6">
      <Reasoning defaultExpanded status="streaming">
        <Reasoning.Trigger />
        <Reasoning.Content>
          <StatusSteps />
        </Reasoning.Content>
      </Reasoning>
      <Reasoning defaultExpanded duration="7s" status="stopped">
        <Reasoning.Trigger />
        <Reasoning.Content>
          <StatusSteps />
        </Reasoning.Content>
      </Reasoning>
    </DemoPage>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Docs snippets (no live Pro demo)
 * -----------------------------------------------------------------------------------------------*/

/* Docs "History": a saved trace needs no status; the block reads as complete. */
export const History: Story = {
  render: () => (
    <DemoPage>
      <Reasoning defaultExpanded>
        <Reasoning.Trigger>
          <Reasoning.Label>Looked at 3 files</Reasoning.Label>
          <Reasoning.Indicator />
        </Reasoning.Trigger>
        <Reasoning.Content>
          <ChainOfThought>
            {["Read package.json", "Read vite.config.ts", "Read src/main.tsx"].map((title) => (
              <ChainOfThought.Step key={title} status="complete">
                <ChainOfThought.StepTitle>{title}</ChainOfThought.StepTitle>
              </ChainOfThought.Step>
            ))}
          </ChainOfThought>
        </Reasoning.Content>
      </Reasoning>
    </DemoPage>
  ),
};

const researchLabel = ({duration, isStreaming, status}: ReasoningLabelRenderProps) => {
  if (isStreaming) return <TextShimmer>Researching</TextShimmer>;
  if (status === "error") return "Couldn't finish the research";
  if (status === "stopped" && !duration) return "Stopped researching";
  if (status === "stopped") {
    return (
      <>
        Stopped after <Reasoning.Duration />
      </>
    );
  }
  if (!duration) return "Researched for a few seconds";

  return (
    <>
      Researched for <Reasoning.Duration />
    </>
  );
};

/*
 * Docs "Custom Label": a function child of `Reasoning.Label` replaces the run labels. The `status`
 * control drives the Reasoning; the list follows it.
 */
export const CustomLabel: Story = {
  args: {status: "streaming"},
  render: ({status = "complete"}) => (
    <DemoPage>
      <Reasoning
        defaultExpanded
        collapseDelay={Infinity}
        duration={status === "streaming" ? undefined : "1m 12s"}
        status={status}
      >
        <Reasoning.Trigger>
          <Reasoning.Loader />
          <Reasoning.Label>{researchLabel}</Reasoning.Label>
          <Reasoning.Indicator />
        </Reasoning.Trigger>
        <Reasoning.Content>
          <StatusSteps />
        </Reasoning.Content>
      </Reasoning>
    </DemoPage>
  ),
};

/* Docs "Custom Step Indicator": a node keeps the disc, a function draws the whole mark. */
export const CustomIndicator: Story = {
  render: () => (
    <DemoPage gap="gap-6">
      <ChainOfThought className="text-muted">
        <ChainOfThought.Step indicator={<Icon icon="gravity-ui:magnifier" />} status="complete">
          <ChainOfThought.StepTitle>Searched the changelog</ChainOfThought.StepTitle>
        </ChainOfThought.Step>
        <ChainOfThought.Step indicator={<Icon icon="gravity-ui:globe" />} status="complete">
          <ChainOfThought.StepTitle>Opened the migration guide</ChainOfThought.StepTitle>
          <ChainOfThought.StepDescription>3 breaking changes</ChainOfThought.StepDescription>
        </ChainOfThought.Step>
        <ChainOfThought.Step indicator={<Icon icon="gravity-ui:pencil" />} status="active">
          <ChainOfThought.StepTitle>Updating the imports</ChainOfThought.StepTitle>
        </ChainOfThought.Step>
      </ChainOfThought>
      <ChainOfThought className="text-muted" status="stopped">
        {(["complete", "error", "active"] as const).map((status) => (
          <ChainOfThought.Step
            key={status}
            status={status}
            indicator={({status: shown}) => (
              <span
                className={`size-2.5 rounded-full ${
                  shown === "complete"
                    ? "bg-success"
                    : shown === "error"
                      ? "bg-danger"
                      : shown === "interrupted"
                        ? "bg-warning"
                        : "bg-muted"
                }`}
              />
            )}
          >
            <ChainOfThought.StepTitle>Step drawn by a function ({status})</ChainOfThought.StepTitle>
          </ChainOfThought.Step>
        ))}
      </ChainOfThought>
    </DemoPage>
  ),
};

const STEP_STATUS_LABELS: Partial<Record<ChainOfThoughtStepDisplayStatus, string>> = {
  active: "Working on it",
  complete: "Finished",
  error: "Went wrong",
  interrupted: "Halted",
  pending: "Waiting",
};

const statusLabel = ({defaultLabel, status}: ChainOfThoughtStepStatusLabelRenderProps) =>
  STEP_STATUS_LABELS[status] ?? defaultLabel;

/* Docs "Localization": `statusLabel` replaces the visually hidden status text of every step. */
export const Localized: Story = {
  render: () => (
    <DemoPage>
      <Reasoning defaultExpanded status="streaming">
        <Reasoning.Trigger />
        <Reasoning.Content>
          <ChainOfThought statusLabel={statusLabel}>
            {STATUS_STEPS.map((step) => (
              <ChainOfThought.Step key={step.title} status={step.status}>
                <ChainOfThought.StepTitle>{step.title}</ChainOfThought.StepTitle>
              </ChainOfThought.Step>
            ))}
          </ChainOfThought>
        </Reasoning.Content>
      </Reasoning>
    </DemoPage>
  ),
};

/* Steps without a status show a neutral dot and no hidden status text. */
export const WithoutStatus: Story = {
  render: () => (
    <DemoPage>
      <ChainOfThought className="text-muted">
        <ChainOfThought.Step>
          <ChainOfThought.StepTitle>Collected the requirements</ChainOfThought.StepTitle>
        </ChainOfThought.Step>
        <ChainOfThought.Step>
          <ChainOfThought.StepTitle>Sketched the data model</ChainOfThought.StepTitle>
          <ChainOfThought.StepDescription>Users, teams and invites</ChainOfThought.StepDescription>
        </ChainOfThought.Step>
        <ChainOfThought.Step>
          <ChainOfThought.StepTitle>Wrote the first migration</ChainOfThought.StepTitle>
        </ChainOfThought.Step>
      </ChainOfThought>
    </DemoPage>
  ),
};

/* Playground: the run status comes from the `status` control (no Reasoning around the list). */
export const Playground: Story = {
  args: {status: "streaming"},
  render: (args) => (
    <DemoPage>
      <ChainOfThought {...args} className="text-muted">
        {STATUS_STEPS.map((step) => (
          <ChainOfThought.Step key={step.title} status={step.status}>
            <ChainOfThought.StepTitle>{step.title}</ChainOfThought.StepTitle>
            {step.description ? (
              <ChainOfThought.StepDescription>{step.description}</ChainOfThought.StepDescription>
            ) : null}
          </ChainOfThought.Step>
        ))}
        <ChainOfThought.Step>
          <ChainOfThought.StepTitle>Step without a status</ChainOfThought.StepTitle>
        </ChainOfThought.Step>
      </ChainOfThought>
    </DemoPage>
  ),
};

/* Deprecated beta API: the root renders a Reasoning around `Trigger` / `Content` / `Steps`. */
export const DeprecatedBeta: Story = {
  render: () => (
    <DemoPage>
      <ChainOfThought defaultExpanded isStreaming>
        <ChainOfThought.Trigger />
        <ChainOfThought.Content>
          <ChainOfThought.Steps>
            <ChainOfThought.Step label="Read README.md" status="complete" />
            <ChainOfThought.Step label="Checking the build script" status="active" />
          </ChainOfThought.Steps>
        </ChainOfThought.Content>
      </ChainOfThought>
    </DemoPage>
  ),
};
