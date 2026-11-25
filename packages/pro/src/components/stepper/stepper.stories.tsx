import type {StepperStatus} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {CSSProperties} from "react";

import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {Stepper, useStepperStep} from "./index";

const meta = {
  argTypes: {
    currentStep: {control: {min: 0, type: "number"}},
    defaultStep: {control: {min: 0, type: "number"}},
    orientation: {control: {type: "select"}, options: ["horizontal", "vertical"]},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: Stepper,
  parameters: {layout: "centered"},
  title: "Pro/Navigation/Stepper",
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story data (own content)
 * -----------------------------------------------------------------------------------------------*/
const checkoutSteps = ["Basket", "Delivery", "Checkout", "Receipt"];

const setupSteps = [
  {description: "Create your login", title: "Sign up"},
  {description: "Tell us about you", title: "Details"},
  {description: "Pick your defaults", title: "Preferences"},
  {description: "Check and submit", title: "Finish"},
];

const iconSteps = [
  {description: "Start your journey", icon: "gravity-ui:house-fill", title: "Welcome"},
  {description: "Name and avatar", icon: "gravity-ui:person-fill", title: "Profile"},
  {description: "Message settings", icon: "gravity-ui:comment-fill", title: "Inbox"},
  {description: "Go live", icon: "gravity-ui:heart-fill", title: "Launch"},
];

const noop = () => {};

const statusOf = (index: number, current: number): StepperStatus =>
  index < current ? "complete" : index === current ? "active" : "inactive";

/** Iconify renders `1em` by default; Pro icons carry explicit 16/24 px sizes that drive the 55% rule. */
const StepIcon = ({icon, size = 16}: {icon: string; size?: number}) => (
  <Icon height={size} icon={icon} width={size} />
);

const renderSimpleSteps = (titles: string[]) =>
  titles.map((title) => (
    <Stepper.Step key={title}>
      <Stepper.Indicator />
      <Stepper.Content>
        <Stepper.Title>{title}</Stepper.Title>
      </Stepper.Content>
      <Stepper.Separator />
    </Stepper.Step>
  ));

const renderDescribedSteps = () =>
  setupSteps.map((step) => (
    <Stepper.Step key={step.title}>
      <Stepper.Indicator />
      <Stepper.Content>
        <Stepper.Title>{step.title}</Stepper.Title>
        <Stepper.Description>{step.description}</Stepper.Description>
      </Stepper.Content>
      <Stepper.Separator />
    </Stepper.Step>
  ));

const Label = ({children, uppercase}: {children: React.ReactNode; uppercase?: boolean}) => (
  <span
    className={
      uppercase
        ? "text-xs font-medium tracking-wider text-muted uppercase"
        : "text-xs font-medium text-muted"
    }
  >
    {children}
  </span>
);

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {defaultStep: 1, onStepChange: noop, orientation: "horizontal", size: "md"},
  render: (args) => (
    <div className="w-[500px]">
      <Stepper {...args}>{renderSimpleSteps(checkoutSteps)}</Stepper>
    </div>
  ),
};

const trackingEvents = [
  {description: "Shipping label printed", time: "Apr 14, 09:20 AM", title: "Label Created"},
  {description: "Collected at the Rotterdam hub", time: "Apr 15, 01:05 PM", title: "Picked Up"},
  {
    description: "Left the sorting center in Utrecht",
    time: "Apr 16, 06:40 AM",
    title: "On the Way",
  },
  {description: "Pending", time: "--", title: "Out for Delivery"},
  {description: "Pending", time: "--", title: "Delivered"},
];

export const PackageTracking: Story = {
  render: () => {
    const current = 2;

    return (
      <div className="w-[420px] rounded-2xl bg-surface p-6 shadow-surface">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-muted">Order #NW-305512</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: "color-mix(in oklch, var(--color-accent) 12%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            On its way
          </span>
        </div>
        <h2 className="text-[22px] leading-tight font-bold text-foreground">Arriving Thursday</h2>
        <p className="mb-5 text-sm text-muted">Expected before 8:00 PM</p>
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-surface-secondary px-3.5 py-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-surface text-muted">
            <Icon height={16} icon="gravity-ui:box" width={16} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold text-foreground">Northwind Freight</span>
            <span className="text-xs text-muted">REF: NW 552 0918 KQ</span>
          </div>
          <Button
            isIconOnly
            aria-label="Copy reference"
            className="text-muted"
            size="sm"
            variant="ghost"
          >
            <Icon height={16} icon="gravity-ui:copy" width={16} />
          </Button>
        </div>
        <Stepper className="px-1" currentStep={current} orientation="vertical">
          {trackingEvents.map((event, index) => {
            const status = statusOf(index, current);
            const isActive = status === "active";

            return (
              <Stepper.Step key={event.title}>
                <Stepper.Indicator>
                  {/* complete: default checkmark, active: dot, inactive: empty ring */}
                  {isActive ? (
                    <Stepper.Icon>
                      <StepIcon icon="gravity-ui:circle-fill" />
                    </Stepper.Icon>
                  ) : status === "inactive" ? null : undefined}
                </Stepper.Indicator>
                <Stepper.Content className="flex-1">
                  <Stepper.Title
                    style={isActive ? {color: "var(--stepper-active-color)"} : undefined}
                  >
                    {event.title}
                  </Stepper.Title>
                  <Stepper.Description>{event.description}</Stepper.Description>
                </Stepper.Content>
                <span
                  style={isActive ? {color: "var(--stepper-active-color)"} : undefined}
                  className={
                    isActive
                      ? "shrink-0 text-right text-[11px] font-medium whitespace-nowrap"
                      : "shrink-0 text-right text-[11px] whitespace-nowrap text-muted"
                  }
                >
                  {event.time}
                </span>
                <Stepper.Separator progress={isActive ? 0.4 : undefined} />
              </Stepper.Step>
            );
          })}
        </Stepper>
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" size="sm" variant="primary">
            <Icon height={16} icon="gravity-ui:map-pin" width={16} />
            Follow on Map
          </Button>
          <Button className="flex-1" size="sm" variant="outline">
            <Icon height={16} icon="gravity-ui:headphones" width={16} />
            Contact
          </Button>
        </div>
      </div>
    );
  },
};

const onboardingSteps = [
  {
    description: "Your space is live. Bring in teammates whenever you like.",
    icon: "gravity-ui:person-fill",
    title: "Workspace ready",
  },
  {
    description: "Hook up the tools you already use so data flows both ways.",
    icon: "gravity-ui:layers",
    title: "Connect your apps",
  },
  {
    description: "Kick off a first board and invite people to collaborate.",
    icon: "gravity-ui:rocket",
    title: "Start a board",
  },
];

export const OnboardingTimeline: Story = {
  render: () => (
    <div className="w-[340px]">
      <h3 className="mb-5 text-lg font-bold text-foreground">Welcome aboard</h3>
      <Stepper currentStep={1} orientation="vertical" size="lg">
        {onboardingSteps.map((step) => (
          <Stepper.Step key={step.title}>
            <Stepper.Indicator>
              <Stepper.Icon>
                <StepIcon icon={step.icon} />
              </Stepper.Icon>
            </Stepper.Indicator>
            <Stepper.Content>
              <Stepper.Title>{step.title}</Stepper.Title>
              <Stepper.Description>{step.description}</Stepper.Description>
            </Stepper.Content>
            <Stepper.Separator />
          </Stepper.Step>
        ))}
      </Stepper>
    </div>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <div className="w-[600px]">
      <Stepper defaultStep={1} onStepChange={noop}>
        {renderDescribedSteps()}
      </Stepper>
    </div>
  ),
};

const renderIconSteps = () =>
  iconSteps.map((step) => (
    <Stepper.Step key={step.title}>
      <Stepper.Indicator>
        <Stepper.Icon>
          <StepIcon icon={step.icon} size={24} />
        </Stepper.Icon>
      </Stepper.Indicator>
      <Stepper.Content>
        <Stepper.Title>{step.title}</Stepper.Title>
        <Stepper.Description>{step.description}</Stepper.Description>
      </Stepper.Content>
      <Stepper.Separator />
    </Stepper.Step>
  ));

export const WithIcons: Story = {
  render: () => (
    <div className="w-[600px]">
      <Stepper defaultStep={1} onStepChange={noop}>
        {renderIconSteps()}
      </Stepper>
    </div>
  ),
};

const BulletIndicator = () => (
  <Stepper.Indicator>
    <Stepper.Icon>
      <StepIcon icon="gravity-ui:circle-fill" />
    </Stepper.Icon>
  </Stepper.Indicator>
);

export const BulletSteps: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="w-[500px]">
        <Stepper defaultStep={1} onStepChange={noop}>
          {checkoutSteps.map((title) => (
            <Stepper.Step key={title}>
              <BulletIndicator />
              <Stepper.Content>
                <Stepper.Title>{title}</Stepper.Title>
              </Stepper.Content>
              <Stepper.Separator />
            </Stepper.Step>
          ))}
        </Stepper>
      </div>
      <div className="w-[280px]">
        <Stepper defaultStep={1} orientation="vertical" onStepChange={noop}>
          {setupSteps.map((step) => (
            <Stepper.Step key={step.title}>
              <BulletIndicator />
              <Stepper.Content>
                <Stepper.Title>{step.title}</Stepper.Title>
                <Stepper.Description>{step.description}</Stepper.Description>
              </Stepper.Content>
              <Stepper.Separator />
            </Stepper.Step>
          ))}
        </Stepper>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="w-[320px]">
      <Stepper defaultStep={1} orientation="vertical" onStepChange={noop}>
        {renderDescribedSteps()}
      </Stepper>
    </div>
  ),
};

export const VerticalWithIcons: Story = {
  render: () => (
    <div className="w-[320px]">
      <Stepper defaultStep={2} orientation="vertical" onStepChange={noop}>
        {renderIconSteps()}
      </Stepper>
    </div>
  ),
};

const sizes = ["sm", "md", "lg"] as const;

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <Label uppercase>{size}</Label>
          <div className="w-[500px]">
            <Stepper currentStep={1} size={size}>
              {renderSimpleSteps(checkoutSteps)}
            </Stepper>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const VerticalSizes: Story = {
  render: () => (
    <div className="flex items-start gap-12">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <Label uppercase>{size}</Label>
          <Stepper currentStep={1} orientation="vertical" size={size}>
            {renderDescribedSteps()}
          </Stepper>
        </div>
      ))}
    </div>
  ),
};

const colorThemes: Array<{label: string; style?: CSSProperties}> = [
  {label: "Accent (default)"},
  {
    label: "Success",
    style: {
      "--stepper-active-color": "var(--color-success)",
      "--stepper-complete-color": "var(--color-success)",
      "--stepper-complete-fg": "var(--color-success-foreground)",
    } as CSSProperties,
  },
  {
    label: "Danger",
    style: {
      "--stepper-active-color": "var(--color-danger)",
      "--stepper-complete-color": "var(--color-danger)",
      "--stepper-complete-fg": "var(--color-danger-foreground)",
    } as CSSProperties,
  },
  {
    label: "Warning",
    style: {
      "--stepper-active-color": "var(--color-warning)",
      "--stepper-complete-color": "var(--color-warning)",
      "--stepper-complete-fg": "var(--color-warning-foreground)",
    } as CSSProperties,
  },
  {
    label: "Inverted",
    style: {
      "--stepper-active-color": "var(--color-foreground)",
      "--stepper-complete-color": "var(--color-foreground)",
      "--stepper-complete-fg": "var(--color-background)",
      "--stepper-inactive-border": "var(--color-foreground)",
      "--stepper-inactive-fg": "var(--color-foreground)",
    } as CSSProperties,
  },
];

export const CustomColor: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {colorThemes.map((theme) => (
        <div key={theme.label} className="flex flex-col gap-1.5">
          <Label>{theme.label}</Label>
          <div className="w-[500px]">
            <Stepper currentStep={2} style={theme.style}>
              {renderSimpleSteps(checkoutSteps)}
            </Stepper>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const CustomColorVertical: Story = {
  render: () => (
    <div className="flex gap-10">
      {colorThemes
        .filter((theme) => theme.label !== "Warning")
        .map((theme) => (
          <div key={theme.label} className="flex flex-col gap-1.5">
            <Label>{theme.label === "Accent (default)" ? "Accent" : theme.label}</Label>
            <Stepper currentStep={2} orientation="vertical" style={theme.style}>
              {renderDescribedSteps()}
            </Stepper>
          </div>
        ))}
    </div>
  ),
};

const trialSteps = [
  {
    description: "Every Pro feature unlocks right away, no card on file.",
    icon: "gravity-ui:star-fill",
    title: "Right now",
  },
  {
    description: "A heads-up lands in your inbox before the trial ends.",
    icon: "gravity-ui:bell-fill",
    title: "On day 25",
  },
  {
    description: "Billing begins automatically. Cancel any time before that.",
    icon: "gravity-ui:credit-card",
    title: "On day 30",
  },
];

export const FreeTrialTimeline: Story = {
  render: () => (
    <div className="w-[340px]">
      <h3 className="mb-5 text-lg font-bold text-foreground">How your 30-day trial works</h3>
      <Stepper
        currentStep={0}
        orientation="vertical"
        size="lg"
        style={
          {
            "--stepper-active-color": "var(--color-foreground)",
            "--stepper-inactive-border": "var(--color-border)",
          } as CSSProperties
        }
      >
        {trialSteps.map((step) => (
          <Stepper.Step key={step.title}>
            <Stepper.Indicator>
              <Stepper.Icon>
                <StepIcon icon={step.icon} size={24} />
              </Stepper.Icon>
            </Stepper.Indicator>
            <Stepper.Content>
              <Stepper.Title>{step.title}</Stepper.Title>
              <Stepper.Description>{step.description}</Stepper.Description>
            </Stepper.Content>
            <Stepper.Separator />
          </Stepper.Step>
        ))}
      </Stepper>
    </div>
  ),
};

export const DisplayOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="w-[500px]">
        <Stepper currentStep={2}>{renderSimpleSteps(checkoutSteps)}</Stepper>
      </div>
      <div className="w-[280px]">
        <Stepper currentStep={2} orientation="vertical">
          {renderDescribedSteps()}
        </Stepper>
      </div>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [step, setStep] = React.useState(0);
    const last = setupSteps.length - 1;

    return (
      <div className="flex w-[600px] flex-col gap-6">
        <Stepper currentStep={step} onStepChange={setStep}>
          {renderDescribedSteps()}
        </Stepper>
        <div className="flex items-center justify-between">
          <Button
            isDisabled={step === 0}
            size="sm"
            variant="outline"
            onPress={() => setStep((value) => Math.max(0, value - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted">
            Step {step + 1} of {setupSteps.length}
          </span>
          <Button
            isDisabled={step === last}
            size="sm"
            variant="primary"
            onPress={() => setStep((value) => Math.min(last, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

export const ControlledVertical: Story = {
  // The demo spans the full width (w-full) and starts at the left edge, like the Pro demo page
  parameters: {layout: "padded"},
  render: () => {
    const [step, setStep] = React.useState(0);
    const last = setupSteps.length - 1;
    const active = setupSteps[step]!;

    return (
      <div className="flex w-full gap-8">
        <div className="w-[200px]">
          <Stepper currentStep={step} orientation="vertical" onStepChange={setStep}>
            {renderDescribedSteps()}
          </Stepper>
        </div>
        <div className="flex w-[400px] flex-col gap-4">
          <div className="rounded-xl bg-surface p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-semibold text-foreground">{active.title}</h3>
            <p className="text-sm text-muted">{active.description}</p>
          </div>
          <div className="flex gap-3">
            <Button
              isDisabled={step === 0}
              size="sm"
              variant="outline"
              onPress={() => setStep((value) => Math.max(0, value - 1))}
            >
              Back
            </Button>
            <Button
              isDisabled={step === last}
              size="sm"
              variant="primary"
              onPress={() => setStep((value) => Math.min(last, value + 1))}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

const CompletedIndicator = () => (
  <Stepper.Indicator>
    {({status}) =>
      status === "complete" ? (
        <Stepper.Icon>
          <StepIcon icon="gravity-ui:circle-check-fill" />
        </Stepper.Icon>
      ) : undefined
    }
  </Stepper.Indicator>
);

export const CustomCompletedIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="w-[500px]">
        <Stepper defaultStep={2} onStepChange={noop}>
          {checkoutSteps.map((title) => (
            <Stepper.Step key={title}>
              <CompletedIndicator />
              <Stepper.Content>
                <Stepper.Title>{title}</Stepper.Title>
              </Stepper.Content>
              <Stepper.Separator />
            </Stepper.Step>
          ))}
        </Stepper>
      </div>
      <div className="w-[280px]">
        <Stepper defaultStep={2} orientation="vertical" onStepChange={noop}>
          {setupSteps.map((step) => (
            <Stepper.Step key={step.title}>
              <CompletedIndicator />
              <Stepper.Content>
                <Stepper.Title>{step.title}</Stepper.Title>
                <Stepper.Description>{step.description}</Stepper.Description>
              </Stepper.Content>
              <Stepper.Separator />
            </Stepper.Step>
          ))}
        </Stepper>
      </div>
    </div>
  ),
};

export const RenderFunction: Story = {
  render: () => (
    <div className="w-[280px]">
      <Stepper defaultStep={1} orientation="vertical" onStepChange={noop}>
        {setupSteps.map((step) => (
          <Stepper.Step key={step.title}>
            {({status}) => (
              <>
                <Stepper.Indicator>
                  <Stepper.Icon>
                    <StepIcon
                      icon={
                        status === "complete"
                          ? "gravity-ui:circle-check-fill"
                          : "gravity-ui:circle-fill"
                      }
                    />
                  </Stepper.Icon>
                </Stepper.Indicator>
                <Stepper.Content>
                  <Stepper.Title>{step.title}</Stepper.Title>
                  <Stepper.Description>{step.description}</Stepper.Description>
                </Stepper.Content>
                <Stepper.Separator />
              </>
            )}
          </Stepper.Step>
        ))}
      </Stepper>
    </div>
  ),
};

/** Swaps between an outline and a filled glyph based on the step status (via `useStepperStep`). */
const StatusIcon = ({filled, outline}: {filled: string; outline: string}) => {
  const {status} = useStepperStep();

  return (
    <Stepper.Icon>
      <StepIcon icon={status === "complete" ? filled : outline} />
    </Stepper.Icon>
  );
};

const dynamicSteps = [
  {filled: "gravity-ui:star-fill", outline: "gravity-ui:star", title: "Draft"},
  {filled: "gravity-ui:bell-fill", outline: "gravity-ui:bell", title: "Review"},
  {filled: "gravity-ui:thumbs-up-fill", outline: "gravity-ui:thumbs-up", title: "Publish"},
];

export const DynamicIcon: Story = {
  render: () => (
    <div className="w-[500px]">
      <Stepper defaultStep={1} onStepChange={noop}>
        {dynamicSteps.map((step) => (
          <Stepper.Step key={step.title}>
            <Stepper.Indicator>
              <StatusIcon filled={step.filled} outline={step.outline} />
            </Stepper.Indicator>
            <Stepper.Content>
              <Stepper.Title>{step.title}</Stepper.Title>
            </Stepper.Content>
            <Stepper.Separator />
          </Stepper.Step>
        ))}
      </Stepper>
    </div>
  ),
};
