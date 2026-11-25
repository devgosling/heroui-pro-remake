import type {Meta, StoryObj} from "@storybook/react";

import {Button, Description, Label} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {NumberStepper} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: NumberStepper,
  parameters: {layout: "centered"},
  title: "Pro/Forms/NumberStepper",
} satisfies Meta<typeof NumberStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

const Parts = () => (
  <NumberStepper.Group>
    <NumberStepper.DecrementButton />
    <NumberStepper.Value />
    <NumberStepper.IncrementButton />
  </NumberStepper.Group>
);

export const Default: Story = {
  args: {"aria-label": "Quantity", defaultValue: 1, minValue: 0},
  render: (args) => (
    <NumberStepper {...args}>
      <Parts />
    </NumberStepper>
  ),
};

export const TicketPicker: Story = {
  render: () => {
    const rows = [
      {hint: "18 years and older", title: "Adult"},
      {hint: "Students with a valid ID", title: "Student"},
      {hint: "Ages 6 to 17", title: "Youth"},
      {hint: "Under 6, free entry", title: "Child"},
    ];

    return (
      <div className="flex w-[380px] flex-col divide-y divide-separator">
        {rows.map((row) => (
          <div key={row.title} className="flex items-center justify-between py-5">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{row.title}</span>
              <span className="text-xs text-muted">{row.hint}</span>
            </div>
            <NumberStepper
              aria-label={row.title}
              defaultValue={0}
              maxValue={8}
              minValue={0}
              size="sm"
            >
              <Parts />
            </NumberStepper>
          </div>
        ))}
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: () => (
    <NumberStepper
      className="flex-col items-start gap-1.5"
      defaultValue={2}
      maxValue={6}
      minValue={1}
    >
      <Label>Seats</Label>
      <Parts />
      <Description>Up to 6 seats per booking</Description>
    </NumberStepper>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <NumberStepper aria-label={`Quantity ${size}`} defaultValue={1} size={size}>
            <Parts />
          </NumberStepper>
          <span className="text-xs text-muted">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const WithStep: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6">
      {[5, 25].map((step) => (
        <div key={step} className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted">Step: {step}</span>
          <NumberStepper
            aria-label={`Amount step ${step}`}
            defaultValue={0}
            minValue={0}
            step={step}
          >
            <Parts />
          </NumberStepper>
        </div>
      ))}
    </div>
  ),
};

export const MinMaxValues: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted">Min: 1, Max: 4</span>
        <NumberStepper aria-label="Players" defaultValue={2} maxValue={4} minValue={1}>
          <Parts />
        </NumberStepper>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted">Min: -5, Max: 5</span>
        <NumberStepper aria-label="Offset" defaultValue={0} maxValue={5} minValue={-5}>
          <Parts />
        </NumberStepper>
      </div>
    </div>
  ),
};

export const WithFormatOptions: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted">Currency (EUR)</span>
        <NumberStepper
          aria-label="Tip"
          defaultValue={5}
          formatOptions={{currency: "EUR", style: "currency"}}
          minValue={0}
        >
          <Parts />
        </NumberStepper>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted">Percentage</span>
        <NumberStepper
          aria-label="Volume"
          defaultValue={40}
          formatOptions={{style: "unit", unit: "percent"}}
          maxValue={100}
          minValue={0}
          step={10}
        >
          <Parts />
        </NumberStepper>
      </div>
    </div>
  ),
};

export const ReversedLayout: Story = {
  render: () => (
    <NumberStepper aria-label="Quantity" defaultValue={1} minValue={0}>
      <NumberStepper.Group>
        <NumberStepper.IncrementButton />
        <NumberStepper.Value />
        <NumberStepper.DecrementButton />
      </NumberStepper.Group>
    </NumberStepper>
  ),
};

export const WithCustomButtons: Story = {
  render: () => {
    const variants = ["primary", "secondary", "tertiary", "outline"] as const;

    return (
      <div className="grid grid-cols-2 gap-x-10 gap-y-4">
        {variants.map((variant) => (
          <React.Fragment key={variant}>
            <NumberStepper aria-label={`Quantity ${variant}`} defaultValue={1} minValue={0}>
              <NumberStepper.Group className="gap-3">
                <Button isIconOnly size="sm" slot="decrement" variant={variant}>
                  <Icon icon="gravity-ui:minus" />
                </Button>
                <NumberStepper.Value />
                <Button isIconOnly size="sm" slot="increment" variant={variant}>
                  <Icon icon="gravity-ui:plus" />
                </Button>
              </NumberStepper.Group>
            </NumberStepper>
            <NumberStepper
              aria-label={`Quantity ${variant} without track`}
              defaultValue={1}
              minValue={0}
            >
              <NumberStepper.Group className="gap-3 bg-transparent">
                <Button isIconOnly size="sm" slot="decrement" variant={variant}>
                  <Icon icon="gravity-ui:minus" />
                </Button>
                <NumberStepper.Value />
                <Button isIconOnly size="sm" slot="increment" variant={variant}>
                  <Icon icon="gravity-ui:plus" />
                </Button>
              </NumberStepper.Group>
            </NumberStepper>
          </React.Fragment>
        ))}
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <NumberStepper isDisabled aria-label="Quantity" defaultValue={3}>
      <Parts />
    </NumberStepper>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState(4);

    return (
      <div className="flex flex-col items-center gap-4">
        <NumberStepper aria-label="Quantity" value={value} onChange={setValue}>
          <Parts />
        </NumberStepper>
        <span className="text-sm text-muted">Value: {value}</span>
      </div>
    );
  },
};

export const CustomIcons: Story = {
  render: () => (
    <NumberStepper aria-label="Brightness" defaultValue={60} maxValue={100} minValue={0} step={10}>
      <NumberStepper.Group>
        <NumberStepper.DecrementButton>
          <Icon icon="gravity-ui:sun" />
        </NumberStepper.DecrementButton>
        <NumberStepper.Value />
        <NumberStepper.IncrementButton>
          <Icon icon="gravity-ui:sun" />
        </NumberStepper.IncrementButton>
      </NumberStepper.Group>
    </NumberStepper>
  ),
};

export const CustomValue: Story = {
  render: () => (
    <NumberStepper aria-label="Nights" defaultValue={2} minValue={0}>
      <NumberStepper.Group>
        <NumberStepper.DecrementButton />
        <NumberStepper.Value>
          {({value}) => (
            <span className="mx-2">
              {value} {value === 1 ? "night" : "nights"}
            </span>
          )}
        </NumberStepper.Value>
        <NumberStepper.IncrementButton />
      </NumberStepper.Group>
    </NumberStepper>
  ),
};
