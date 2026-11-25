import type {Meta, StoryObj} from "@storybook/react";
import type {FormEvent} from "react";

import {Button, Description, FieldError, Label} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useState} from "react";

import {NativeSelect} from "./index";

const meta = {
  argTypes: {
    fullWidth: {control: "boolean"},
    isInvalid: {control: "boolean"},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: NativeSelect,
  parameters: {layout: "centered"},
  title: "Pro/Forms/NativeSelect",
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

const plans = [
  {label: "Free", value: "free"},
  {label: "Starter", value: "starter"},
  {label: "Team", value: "team"},
  {label: "Enterprise", value: "enterprise"},
];

const PlanOptions = () => (
  <>
    <NativeSelect.Option value="">Choose a plan</NativeSelect.Option>
    {plans.map((plan) => (
      <NativeSelect.Option key={plan.value} value={plan.value}>
        {plan.label}
      </NativeSelect.Option>
    ))}
  </>
);

/* Docs "Usage": no label, the wrapper caps the width */
export const Default: Story = {
  render: (args) => (
    <div className="w-[220px] max-w-full">
      <NativeSelect {...args} className="w-full">
        <NativeSelect.Trigger aria-label="Plan">
          <PlanOptions />
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
    </div>
  ),
};

const regions = [
  {
    label: "South America",
    options: [
      {label: "Argentina", value: "ar"},
      {label: "Brazil", value: "br"},
      {label: "Chile", value: "cl"},
    ],
  },
  {
    label: "Northern Europe",
    options: [
      {label: "Denmark", value: "dk"},
      {label: "Finland", value: "fi"},
      {label: "Norway", value: "no"},
    ],
  },
  {
    label: "Oceania",
    options: [
      {label: "Australia", value: "au"},
      {label: "Fiji", value: "fj"},
      {label: "New Zealand", value: "nz"},
    ],
  },
];

const FormExampleDemo = () => {
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(Object.fromEntries(new FormData(event.currentTarget)));
  };

  return (
    <form className="flex w-[300px] flex-col gap-4" onSubmit={handleSubmit}>
      <NativeSelect fullWidth>
        <Label>Shipping region</Label>
        <NativeSelect.Trigger required name="region">
          <NativeSelect.Option value="">Choose a region</NativeSelect.Option>
          {regions.map((group) => (
            <NativeSelect.OptGroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <NativeSelect.Option key={option.value} value={option.value}>
                  {option.label}
                </NativeSelect.Option>
              ))}
            </NativeSelect.OptGroup>
          ))}
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
      <NativeSelect fullWidth>
        <Label>Workspace access</Label>
        <NativeSelect.Trigger required name="access">
          <NativeSelect.Option value="">Choose an access level</NativeSelect.Option>
          <NativeSelect.Option value="owner">Owner</NativeSelect.Option>
          <NativeSelect.Option value="member">Member</NativeSelect.Option>
          <NativeSelect.Option value="guest">Guest</NativeSelect.Option>
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
        <Description>Decides what the invitee can change</Description>
      </NativeSelect>
      <Button size="lg" type="submit">
        Send invite
      </Button>
      {submitted ? (
        <pre className="rounded-lg bg-surface p-3 text-xs text-muted">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : null}
    </form>
  );
};

export const FormExample: Story = {
  render: () => <FormExampleDemo />,
};

const languages = [
  {label: "English", value: "en"},
  {label: "Deutsch", value: "de"},
  {label: "Español", value: "es"},
  {label: "日本語", value: "ja"},
];

const LanguageField = () => (
  <div className="w-[220px]">
    <NativeSelect fullWidth>
      <Label>Language</Label>
      <NativeSelect.Trigger name="language">
        <NativeSelect.Option value="">Select a language</NativeSelect.Option>
        {languages.map((language) => (
          <NativeSelect.Option key={language.value} value={language.value}>
            {language.label}
          </NativeSelect.Option>
        ))}
        <NativeSelect.Indicator />
      </NativeSelect.Trigger>
      <Description>Used for emails and notifications</Description>
    </NativeSelect>
  </div>
);

export const WithLabel: Story = {
  render: () => <LanguageField />,
};

export const WithDescription: Story = {
  render: () => <LanguageField />,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {(["primary", "secondary"] as const).map((variant) => (
        <div key={variant} className="flex w-[220px] flex-col gap-2">
          <span className="text-xs text-muted">{variant}</span>
          <NativeSelect className="w-full" variant={variant}>
            <NativeSelect.Trigger aria-label={`Plan (${variant})`}>
              <PlanOptions />
              <NativeSelect.Indicator />
            </NativeSelect.Trigger>
          </NativeSelect>
        </div>
      ))}
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <NativeSelect fullWidth>
        <Label>Billing cycle</Label>
        <NativeSelect.Trigger name="cycle">
          <NativeSelect.Option value="">Select a cycle</NativeSelect.Option>
          <NativeSelect.Option value="monthly">Monthly</NativeSelect.Option>
          <NativeSelect.Option value="quarterly">Quarterly</NativeSelect.Option>
          <NativeSelect.Option value="yearly">Yearly</NativeSelect.Option>
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
    </div>
  ),
};

const timezones = [
  {
    label: "Americas",
    options: [
      {label: "Los Angeles", value: "america-la"},
      {label: "Chicago", value: "america-chicago"},
      {label: "Bogotá", value: "america-bogota"},
    ],
  },
  {
    label: "Europe",
    options: [
      {label: "Lisbon", value: "europe-lisbon"},
      {label: "Berlin", value: "europe-berlin"},
      {label: "Helsinki", value: "europe-helsinki"},
    ],
  },
  {
    label: "Asia Pacific",
    options: [
      {label: "Singapore", value: "asia-singapore"},
      {label: "Tokyo", value: "asia-tokyo"},
      {label: "Auckland (Pacific)", value: "pacific-auckland"},
    ],
  },
];

/* No width class on the root: the select sizes itself to its longest option */
export const WithGroups: Story = {
  render: () => (
    <div className="w-[220px]">
      <NativeSelect>
        <NativeSelect.Trigger aria-label="Time zone">
          <NativeSelect.Option value="">Select time zone</NativeSelect.Option>
          {timezones.map((group) => (
            <NativeSelect.OptGroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <NativeSelect.Option key={option.value} value={option.value}>
                  {option.label}
                </NativeSelect.Option>
              ))}
            </NativeSelect.OptGroup>
          ))}
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
    </div>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <div className="w-[220px]">
      <NativeSelect fullWidth>
        <Label>Delivery slot</Label>
        <NativeSelect.Trigger name="slot">
          <NativeSelect.Option value="">Select a slot</NativeSelect.Option>
          <NativeSelect.Option value="morning">Morning</NativeSelect.Option>
          <NativeSelect.Option disabled value="noon">
            Noon (fully booked)
          </NativeSelect.Option>
          <NativeSelect.Option value="afternoon">Afternoon</NativeSelect.Option>
          <NativeSelect.Option disabled value="evening">
            Evening (fully booked)
          </NativeSelect.Option>
          <NativeSelect.Option value="night">Night</NativeSelect.Option>
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
    </div>
  ),
};

export const DisabledSelect: Story = {
  render: () => (
    <div className="w-[220px]">
      <NativeSelect fullWidth>
        <Label>Plan</Label>
        <NativeSelect.Trigger disabled defaultValue="team" name="plan">
          <PlanOptions />
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
    </div>
  ),
};

export const InvalidState: Story = {
  render: () => (
    <div className="w-[220px]">
      <NativeSelect isInvalid className="w-full" validationErrors={["Choose a shipping speed"]}>
        <Label>Shipping speed</Label>
        <NativeSelect.Trigger name="speed">
          <NativeSelect.Option value="">Select a speed</NativeSelect.Option>
          <NativeSelect.Option value="economy">Economy</NativeSelect.Option>
          <NativeSelect.Option value="standard">Standard</NativeSelect.Option>
          <NativeSelect.Option value="express">Express</NativeSelect.Option>
          <NativeSelect.Option value="overnight">Overnight</NativeSelect.Option>
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
        <FieldError />
      </NativeSelect>
    </div>
  ),
};

const sizes = [
  {label: "Extra small", value: "xs"},
  {label: "Small", value: "s"},
  {label: "Medium", value: "m"},
  {label: "Large", value: "l"},
  {label: "Extra large", value: "xl"},
];

const ControlledDemo = () => {
  const [size, setSize] = useState("m");
  const selected = sizes.find((item) => item.value === size)?.label ?? "None";

  return (
    <div className="w-[220px] space-y-2">
      <NativeSelect fullWidth>
        <Label>T-shirt size (controlled)</Label>
        <NativeSelect.Trigger
          name="size"
          value={size}
          onChange={(event) => setSize(event.target.value)}
        >
          <NativeSelect.Option value="">Select a size</NativeSelect.Option>
          {sizes.map((item) => (
            <NativeSelect.Option key={item.value} value={item.value}>
              {item.label}
            </NativeSelect.Option>
          ))}
          <NativeSelect.Indicator />
        </NativeSelect.Trigger>
      </NativeSelect>
      <p className="text-sm text-muted">Selected: {selected}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

export const CustomIndicator: Story = {
  render: () => (
    <div className="w-[220px]">
      <NativeSelect fullWidth>
        <Label>Sort by</Label>
        <NativeSelect.Trigger name="sort">
          <NativeSelect.Option value="">Select an order</NativeSelect.Option>
          <NativeSelect.Option value="newest">Newest first</NativeSelect.Option>
          <NativeSelect.Option value="oldest">Oldest first</NativeSelect.Option>
          <NativeSelect.Option value="popular">Most popular</NativeSelect.Option>
          <NativeSelect.Option value="price">Lowest price</NativeSelect.Option>
          <NativeSelect.Indicator>
            <Icon icon="gravity-ui:chevrons-expand-vertical" />
          </NativeSelect.Indicator>
        </NativeSelect.Trigger>
      </NativeSelect>
    </div>
  ),
};
