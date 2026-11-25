import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, Spinner} from "@heroui/react";
import React from "react";

import {SlideButton, useSlideButton} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Helpers (Native demos are phone screens)
 * -----------------------------------------------------------------------------------------------*/
const PhoneScreen = ({children}: {children: ReactNode}) => (
  <div className="relative flex h-[640px] w-[390px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[2.75rem] border border-separator bg-background px-5">
    <div className="flex w-full max-w-sm flex-col items-stretch gap-4">{children}</div>
  </div>
);

const StatusText = ({children}: {children: ReactNode}) => (
  <p className="min-h-5 text-center text-sm text-muted" role="status">
    {children}
  </p>
);

const meta = {
  argTypes: {
    autoReset: {control: "boolean"},
    autoResetDelay: {control: {min: 0, step: 250, type: "number"}},
    completionThreshold: {control: {max: 1, min: 0.1, step: 0.05, type: "range"}},
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {
      control: "boolean",
      description:
        "Plays one short haptic (medium) when the slide completes. Defaults to the nearest HapticsProvider (on).",
    },
    variant: {control: {type: "select"}, options: ["default", "accent", "success", "danger"]},
  },
  component: SlideButton,
  parameters: {
    // `background` is a ReactNode slot; the /background$/ color matcher must not infer a control
    controls: {exclude: ["background"]},
    layout: "centered",
  },
  title: "Pro/Buttons/SlideButton",
} satisfies Meta<typeof SlideButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Basic usage
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    autoReset: false,
    autoResetDelay: 1000,
    completionThreshold: 0.85,
    isDisabled: false,
    isHapticFeedbackEnabled: true,
    variant: "default",
  },
  render: (args) => {
    const [sentAt, setSentAt] = React.useState<string | null>(null);
    const [instance, setInstance] = React.useState(0);

    return (
      <PhoneScreen>
        <SlideButton
          key={instance}
          {...args}
          onComplete={() => setSentAt(new Date().toLocaleTimeString())}
          onReset={() => setSentAt(null)}
        >
          <SlideButton.UnderlayContent>
            <SlideButton.Label>Slide to send</SlideButton.Label>
          </SlideButton.UnderlayContent>
          <SlideButton.OverlayContent />
          <SlideButton.Thumb />
        </SlideButton>
        <StatusText>
          {sentAt ? `Sent at ${sentAt}` : "Drag the handle all the way to the end"}
        </StatusText>
        {sentAt && !args.autoReset ? (
          <Button
            className="self-center"
            size="sm"
            variant="tertiary"
            onPress={() => {
              setSentAt(null);
              setInstance((value) => value + 1);
            }}
          >
            Start over
          </Button>
        ) : null}
      </PhoneScreen>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export const Variants: Story = {
  render: () => (
    <PhoneScreen>
      <SlideButton autoReset variant="accent">
        <SlideButton.UnderlayContent>
          <SlideButton.Label>Slide to start</SlideButton.Label>
        </SlideButton.UnderlayContent>
        <SlideButton.OverlayContent>
          <SlideButton.Label>Started!</SlideButton.Label>
        </SlideButton.OverlayContent>
        <SlideButton.Thumb />
      </SlideButton>
      <SlideButton autoReset variant="success">
        <SlideButton.UnderlayContent>
          <SlideButton.Label>Slide to accept</SlideButton.Label>
        </SlideButton.UnderlayContent>
        <SlideButton.OverlayContent>
          <SlideButton.Label>Accepted!</SlideButton.Label>
        </SlideButton.OverlayContent>
        <SlideButton.Thumb />
      </SlideButton>
      <SlideButton autoReset variant="danger">
        <SlideButton.UnderlayContent>
          <SlideButton.Label>Slide to remove</SlideButton.Label>
        </SlideButton.UnderlayContent>
        <SlideButton.OverlayContent>
          <SlideButton.Label>Removed!</SlideButton.Label>
        </SlideButton.OverlayContent>
        <SlideButton.Thumb />
      </SlideButton>
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Auto reset
 * -----------------------------------------------------------------------------------------------*/
export const AutoReset: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);

    return (
      <PhoneScreen>
        <SlideButton autoReset autoResetDelay={2000} onComplete={() => setCount((n) => n + 1)}>
          <SlideButton.UnderlayContent>
            <SlideButton.Label>Slide to check in</SlideButton.Label>
          </SlideButton.UnderlayContent>
          <SlideButton.OverlayContent>
            <SlideButton.Label>Checked in!</SlideButton.Label>
          </SlideButton.OverlayContent>
          <SlideButton.Thumb />
        </SlideButton>
        <StatusText>
          {count === 0 ? "Resets 2 s after completing" : `Checked in ${count}x`}
        </StatusText>
      </PhoneScreen>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
export const Disabled: Story = {
  render: () => (
    <PhoneScreen>
      <SlideButton isDisabled>
        <SlideButton.UnderlayContent>
          <SlideButton.Label>Checkout unavailable</SlideButton.Label>
        </SlideButton.UnderlayContent>
        <SlideButton.OverlayContent />
        <SlideButton.Thumb />
      </SlideButton>
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
export const Controlled: Story = {
  render: () => {
    const [isCompleted, setIsCompleted] = React.useState(false);

    return (
      <PhoneScreen>
        <SlideButton
          autoReset
          autoResetDelay={1500}
          isCompleted={isCompleted}
          onCompleteChange={setIsCompleted}
        >
          <SlideButton.UnderlayContent>
            <SlideButton.Label>Slide to sign</SlideButton.Label>
          </SlideButton.UnderlayContent>
          <SlideButton.OverlayContent>
            <SlideButton.Label>Signed!</SlideButton.Label>
          </SlideButton.OverlayContent>
          <SlideButton.Thumb />
        </SlideButton>
        <StatusText>isCompleted: {String(isCompleted)}</StatusText>
        <Button
          className="self-center"
          size="sm"
          variant="tertiary"
          onPress={() => setIsCompleted((value) => !value)}
        >
          {isCompleted ? "Reset" : "Complete"}
        </Button>
      </PhoneScreen>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Render function children
 * -----------------------------------------------------------------------------------------------*/
export const RenderFunctionChildren: Story = {
  render: () => (
    <PhoneScreen>
      <SlideButton autoReset variant="success">
        {({isCompleted, progress}) => (
          <>
            <SlideButton.UnderlayContent>
              <SlideButton.Label style={{opacity: 1 - progress}}>
                Slide to pay · €24.00
              </SlideButton.Label>
            </SlideButton.UnderlayContent>
            <SlideButton.OverlayContent>
              <SlideButton.Label className="tabular-nums">
                {isCompleted ? "Paid!" : `${Math.round(progress * 100)}%`}
              </SlideButton.Label>
            </SlideButton.OverlayContent>
            <SlideButton.Thumb />
          </>
        )}
      </SlideButton>
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example (purchase confirmation)
 * -----------------------------------------------------------------------------------------------*/
const OrderOverlayLabel = () => {
  const {progress} = useSlideButton();

  // Fades in over the second half of the slide
  return (
    <SlideButton.Label style={{opacity: Math.min(1, Math.max(0, (progress - 0.5) / 0.5))}}>
      Ordered!
    </SlideButton.Label>
  );
};

export const PurchaseExample: Story = {
  render: () => {
    const [isOrdered, setIsOrdered] = React.useState(false);

    return (
      <PhoneScreen>
        <SlideButton
          autoReset
          autoResetDelay={2500}
          variant="success"
          onCompleteChange={setIsOrdered}
          onReset={() => setIsOrdered(false)}
        >
          <SlideButton.UnderlayContent>
            <SlideButton.Label>Slide to order · $18.50</SlideButton.Label>
          </SlideButton.UnderlayContent>
          <SlideButton.OverlayContent>
            <OrderOverlayLabel />
          </SlideButton.OverlayContent>
          <SlideButton.Thumb>
            {isOrdered ? <Spinner color="success" size="sm" /> : null}
          </SlideButton.Thumb>
        </SlideButton>
      </PhoneScreen>
    );
  },
};
