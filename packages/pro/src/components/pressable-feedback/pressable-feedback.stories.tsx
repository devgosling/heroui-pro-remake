import type {Meta, StoryObj} from "@storybook/react";

import {Avatar, Button, Card} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {ItemCard} from "../item-card";

import {PressableFeedback} from "./index";

const meta = {
  component: PressableFeedback,
  parameters: {layout: "centered"},
  title: "Pro/Feedback/PressableFeedback",
} satisfies Meta<typeof PressableFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

const variants = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
  "danger-soft",
] as const;

const Hint = ({children}: {children: React.ReactNode}) => (
  <p className="text-xs text-muted">{children}</p>
);

/* -------------------------------------------------------------------------------------------------
 * Ripple / Highlight on regular Buttons
 * -----------------------------------------------------------------------------------------------*/
const ButtonRows = ({layer}: {layer: "ripple" | "highlight"}) => {
  const Layer = layer === "ripple" ? PressableFeedback.Ripple : PressableFeedback.Highlight;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            <Layer />
            {variant.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary">
          <Layer />
          <Icon icon="gravity-ui:magnifier" />
          Search
        </Button>
        <Button variant="secondary">
          <Layer />
          <Icon icon="gravity-ui:person-plus" />
          Invite
        </Button>
        <Button variant="tertiary">
          <Layer />
          <Icon icon="gravity-ui:envelope" />
          Message
        </Button>
        <Button variant="danger">
          <Layer />
          <Icon icon="gravity-ui:trash-bin" />
          Remove
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button isIconOnly aria-label="More" variant="tertiary">
          <Layer />
          <Icon icon="gravity-ui:ellipsis" />
        </Button>
        <Button isIconOnly aria-label="Settings" variant="secondary">
          <Layer />
          <Icon icon="gravity-ui:gear" />
        </Button>
        <Button isIconOnly aria-label="Delete" variant="danger">
          <Layer />
          <Icon icon="gravity-ui:trash-bin" />
        </Button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Usage (default): ripple on regular buttons
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {(["primary", "secondary", "tertiary", "outline", "ghost", "danger"] as const).map(
          (variant) => (
            <Button key={variant} variant={variant}>
              <PressableFeedback.Ripple />
              {variant.replace(/^\w/, (c) => c.toUpperCase())}
            </Button>
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:magnifier" />
          Search
        </Button>
        <Button variant="secondary">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:person-plus" />
          Add Member
        </Button>
        <Button variant="tertiary">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:envelope" />
          Email
        </Button>
        <Button variant="danger">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:trash-bin" />
          Delete
        </Button>
      </div>
      <div className="flex gap-3">
        <Button isIconOnly aria-label="More" variant="tertiary">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:ellipsis" />
        </Button>
        <Button isIconOnly aria-label="Settings" variant="secondary">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:gear" />
        </Button>
        <Button isIconOnly aria-label="Delete" variant="danger">
          <PressableFeedback.Ripple />
          <Icon icon="gravity-ui:trash-bin" />
        </Button>
      </div>
    </div>
  ),
};

export const WithRipple: Story = {
  render: () => <ButtonRows layer="ripple" />,
};

export const WithHighlight: Story = {
  render: () => <ButtonRows layer="highlight" />,
};

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
export const Root: Story = {
  render: () => (
    <PressableFeedback className="rounded-2xl bg-surface p-4 text-start shadow-surface">
      <PressableFeedback.Ripple />
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-muted" icon="gravity-ui:folder" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">Project files</span>
          <span className="text-xs text-muted">24 items, updated today</span>
        </div>
      </div>
    </PressableFeedback>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Pressable cards
 * -----------------------------------------------------------------------------------------------*/
export const PressableCards: Story = {
  render: () => (
    <div className="grid w-[500px] grid-cols-12 gap-4">
      <Card className="relative col-span-12 h-[220px] overflow-hidden bg-gradient-to-br from-amber-200 via-orange-200 to-rose-300">
        <PressableFeedback.Ripple className="z-1" />
        <Card.Header className="z-10">
          <Card.Title className="text-xs font-semibold tracking-wide text-black/70">
            ORBIT
          </Card.Title>
          <Card.Description className="text-sm font-medium text-black/50">
            Smart desk lamp
          </Card.Description>
        </Card.Header>
        <Card.Footer className="z-10 mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-black/70">Coming in spring</span>
            <span className="text-xs text-black/50">Join the waitlist</span>
          </div>
          <Button className="bg-white text-black" size="sm" variant="tertiary">
            <PressableFeedback.Ripple />
            Join
          </Button>
        </Card.Footer>
      </Card>
      {[
        {color: "text-rose-200", members: "214 members", name: "Night Owls"},
        {color: "text-sky-300", members: "87 members", name: "Pixel Pushers"},
      ].map((group) => (
        <Card key={group.name} className="col-span-6 cursor-pointer gap-2 overflow-hidden">
          <PressableFeedback.Ripple className={group.color} />
          <Avatar className="size-14 rounded-xl">
            <Avatar.Fallback className="rounded-xl">{group.name.slice(0, 2)}</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm leading-4 font-medium">{group.name}</span>
            <span className="text-xs text-muted">{group.members}</span>
          </div>
        </Card>
      ))}
      {["Design systems meetup", "Weekend game jam"].map((title, index) => (
        <Card
          key={title}
          className="col-span-12 cursor-pointer flex-row gap-3 overflow-hidden p-2"
          variant="transparent"
        >
          <PressableFeedback.Highlight />
          <div className="size-20 shrink-0 rounded-xl bg-gradient-to-br from-violet-300 to-indigo-400" />
          <div className="flex flex-col justify-center">
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-muted">
              {index === 0 ? "Today, 7:00 PM" : "Sat, 10:00 AM"}
            </span>
          </div>
        </Card>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Comparison
 * -----------------------------------------------------------------------------------------------*/
export const Comparison: Story = {
  render: () => {
    const overlay = {
      outline: "bg-danger text-danger-foreground",
      primary: "bg-accent text-accent-foreground",
      secondary: "bg-accent-soft text-accent-soft-foreground",
    } as const;
    const buttons = ["primary", "secondary", "outline"] as const;
    const label = (v: string) => v.replace(/^\w/, (c) => c.toUpperCase());

    return (
      <div className="flex flex-col gap-6">
        {(["Ripple", "Highlight", "Hold Confirm", "Progress Feedback"] as const).map((kind) => (
          <div key={kind}>
            <span className="mb-2 block text-xs font-medium text-muted">{kind}</span>
            <div className="flex gap-3">
              {buttons.map((variant) => (
                <Button key={variant} variant={variant}>
                  {kind === "Ripple" && <PressableFeedback.Ripple />}
                  {kind === "Highlight" && <PressableFeedback.Highlight />}
                  {kind === "Hold Confirm" && (
                    <PressableFeedback.HoldConfirm className={overlay[variant]}>
                      {label(variant)}
                    </PressableFeedback.HoldConfirm>
                  )}
                  {kind === "Progress Feedback" && (
                    <PressableFeedback.ProgressFeedback className={overlay[variant]}>
                      {label(variant)}
                    </PressableFeedback.ProgressFeedback>
                  )}
                  {label(variant)}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Hold confirm
 * -----------------------------------------------------------------------------------------------*/
export const WithHoldConfirm: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Hint>Press and hold a button to reveal the confirmation.</Hint>
      <div className="flex flex-wrap gap-3">
        <Button variant="danger-soft">
          <PressableFeedback.HoldConfirm className="bg-danger text-danger-foreground">
            <Icon icon="gravity-ui:trash-bin" />
            Hold to Remove
          </PressableFeedback.HoldConfirm>
          <Icon icon="gravity-ui:trash-bin" />
          Hold to Remove
        </Button>
        <Button variant="secondary">
          <PressableFeedback.HoldConfirm className="bg-accent-soft text-accent-soft-foreground">
            <Icon icon="gravity-ui:arrow-rotate-left" />
            Hold to Reset
          </PressableFeedback.HoldConfirm>
          <Icon icon="gravity-ui:arrow-rotate-left" />
          Hold to Reset
        </Button>
        <Button variant="tertiary">
          <PressableFeedback.HoldConfirm className="bg-accent text-accent-foreground">
            <Icon icon="gravity-ui:check" />
            Published!
          </PressableFeedback.HoldConfirm>
          <Icon icon="gravity-ui:paper-plane" />
          Hold to Publish
        </Button>
      </div>
      <div className="flex gap-3">
        <Button isIconOnly aria-label="Hold to remove" variant="danger-soft">
          <PressableFeedback.HoldConfirm className="bg-danger text-danger-foreground" sweep="up">
            <Icon icon="gravity-ui:trash-bin" />
          </PressableFeedback.HoldConfirm>
          <Icon icon="gravity-ui:trash-bin" />
        </Button>
        <Button isIconOnly aria-label="Hold to reset" variant="secondary">
          <PressableFeedback.HoldConfirm className="bg-accent text-accent-foreground">
            <Icon icon="gravity-ui:arrow-rotate-left" />
          </PressableFeedback.HoldConfirm>
          <Icon icon="gravity-ui:arrow-rotate-left" />
        </Button>
      </div>
    </div>
  ),
};

export const HoldConfirmDurations: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Hint>Hold durations: fast (800ms), default (2s), slow (4s).</Hint>
      <div className="flex gap-3">
        {[
          {duration: 800, label: "Fast (800ms)"},
          {duration: 2000, label: "Default (2s)"},
          {duration: 4000, label: "Slow (4s)"},
        ].map(({duration, label}) => (
          <Button key={label} variant="danger-soft">
            <PressableFeedback.HoldConfirm
              className="bg-danger text-danger-foreground"
              duration={duration}
            >
              <Icon icon="gravity-ui:trash-bin" />
              {label}
            </PressableFeedback.HoldConfirm>
            <Icon icon="gravity-ui:trash-bin" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  ),
};

export const HoldConfirmSweep: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Hint>The reveal can sweep in four directions: right, left, down, up.</Hint>
      <div className="flex gap-3">
        {(["right", "left", "down", "up"] as const).map((sweep) => (
          <Button key={sweep} variant="danger-soft">
            <PressableFeedback.HoldConfirm
              className="bg-danger text-danger-foreground"
              sweep={sweep}
            >
              <Icon icon="gravity-ui:trash-bin" />
              Sweep {sweep}
            </PressableFeedback.HoldConfirm>
            <Icon icon="gravity-ui:trash-bin" />
            Sweep {sweep}
          </Button>
        ))}
      </div>
    </div>
  ),
};

export const HoldConfirmCallback: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="danger-soft">
          <PressableFeedback.HoldConfirm
            className="bg-danger text-danger-foreground"
            onComplete={() => setCount((c) => c + 1)}
          >
            <Icon icon="gravity-ui:trash-bin" />
            Hold to Remove
          </PressableFeedback.HoldConfirm>
          <Icon icon="gravity-ui:trash-bin" />
          Hold to Remove
        </Button>
        <p className="text-xs text-muted">
          Confirmed: <strong>{count}</strong>
        </p>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Progress feedback
 * -----------------------------------------------------------------------------------------------*/
export const WithProgressFeedback: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Hint>Click once and the overlay sweeps in automatically.</Hint>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary">
          <PressableFeedback.ProgressFeedback className="bg-accent text-accent-foreground">
            Ordering...
          </PressableFeedback.ProgressFeedback>
          <Icon icon="gravity-ui:shopping-cart" />
          Order Now
        </Button>
        <Button variant="secondary">
          <PressableFeedback.ProgressFeedback className="bg-accent text-accent-foreground">
            <Icon icon="gravity-ui:arrow-up-from-square" />
            Uploaded!
          </PressableFeedback.ProgressFeedback>
          <Icon icon="gravity-ui:arrow-up-from-square" />
          Upload
        </Button>
        <Button variant="tertiary">
          <PressableFeedback.ProgressFeedback className="bg-accent text-accent-foreground">
            <Icon icon="gravity-ui:bookmark" />
            Saved!
          </PressableFeedback.ProgressFeedback>
          <Icon icon="gravity-ui:bookmark" />
          Save
        </Button>
      </div>
    </div>
  ),
};

export const ProgressFeedbackDurations: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Hint>Different progress durations: fast (800ms), default (2s), slow (4s).</Hint>
      <div className="flex flex-wrap gap-3">
        {[
          {duration: 800, label: "Fast (800ms)"},
          {duration: 2000, label: "Default (2s)"},
          {duration: 4000, label: "Slow (4s)"},
        ].map(({duration, label}) => (
          <Button key={label} variant="secondary">
            <PressableFeedback.ProgressFeedback
              className="bg-accent text-accent-foreground"
              duration={duration}
            >
              <Icon icon="gravity-ui:paper-plane" />
              {label}
            </PressableFeedback.ProgressFeedback>
            <Icon icon="gravity-ui:paper-plane" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  ),
};

export const ProgressFeedbackSweep: Story = {
  render: () => (
    <div className="flex gap-3">
      {(["right", "left", "down", "up"] as const).map((sweep) => (
        <Button key={sweep} variant="secondary">
          <PressableFeedback.ProgressFeedback
            className="bg-accent text-accent-foreground"
            sweep={sweep}
          >
            Sweep {sweep}
          </PressableFeedback.ProgressFeedback>
          Sweep {sweep}
        </Button>
      ))}
    </div>
  ),
};

export const ProgressFeedbackNoReset: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <Hint>With autoReset=false the overlay stays revealed after completing.</Hint>
      <div className="flex gap-3">
        <Button variant="danger-soft">
          <PressableFeedback.ProgressFeedback
            autoReset={false}
            className="bg-danger text-danger-foreground"
          >
            <Icon icon="gravity-ui:trash-bin" />
            Workspace Archived
          </PressableFeedback.ProgressFeedback>
          <Icon icon="gravity-ui:trash-bin" />
          Archive Workspace
        </Button>
      </div>
    </div>
  ),
};

export const ProgressFeedbackCallback: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="secondary">
          <PressableFeedback.ProgressFeedback
            className="bg-accent text-accent-foreground"
            onComplete={() => setCount((c) => c + 1)}
          >
            <Icon icon="gravity-ui:paper-plane" />
            Send
          </PressableFeedback.ProgressFeedback>
          <Icon icon="gravity-ui:paper-plane" />
          Send
        </Button>
        <p className="text-xs text-muted">
          Sent: <strong>{count}</strong>
        </p>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Standalone layers on a non-Button host (Item Card rendered as a native button)
 * -----------------------------------------------------------------------------------------------*/
const renderButton = (props: React.JSX.IntrinsicElements["button"]) => (
  <button {...props} type="button" />
);

const ProfileCard = ({layer}: {layer: "ripple" | "highlight"}) => (
  <div className="w-[500px]">
    <ItemCard<"button">
      className="relative w-full cursor-pointer overflow-hidden"
      render={renderButton}
    >
      {layer === "ripple" ? <PressableFeedback.Ripple /> : <PressableFeedback.Highlight />}
      <ItemCard.Icon>
        <Icon icon="gravity-ui:person" />
      </ItemCard.Icon>
      <ItemCard.Content>
        <ItemCard.Title>Profile</ItemCard.Title>
        <ItemCard.Description>Update your personal information</ItemCard.Description>
      </ItemCard.Content>
      <ItemCard.Action>
        <Icon className="size-4 text-muted rtl:-scale-x-100" icon="gravity-ui:chevron-right" />
      </ItemCard.Action>
    </ItemCard>
  </div>
);

export const StandaloneHighlight: Story = {
  render: () => <ProfileCard layer="highlight" />,
};

export const StandaloneRipple: Story = {
  render: () => <ProfileCard layer="ripple" />,
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button isDisabled variant="primary">
          <PressableFeedback.Ripple />
          Disabled Ripple
        </Button>
        <Button isDisabled variant="secondary">
          <PressableFeedback.Highlight />
          Disabled Highlight
        </Button>
      </div>
      <div className="flex gap-3">
        <Button isDisabled variant="danger-soft">
          <PressableFeedback.HoldConfirm className="bg-danger text-danger-foreground">
            Disabled Hold
          </PressableFeedback.HoldConfirm>
          Disabled Hold
        </Button>
        <Button isDisabled variant="secondary">
          <PressableFeedback.ProgressFeedback className="bg-accent-soft text-accent-soft-foreground">
            Disabled Progress
          </PressableFeedback.ProgressFeedback>
          Disabled Progress
        </Button>
      </div>
    </div>
  ),
};
