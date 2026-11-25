import type {Meta, StoryObj} from "@storybook/react";

import {Chip, Description, Label} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {NumberValue} from "../number-value";
import {PressableFeedback} from "../pressable-feedback";

import {RadioButtonGroup} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    layout: {control: {type: "select"}, options: ["flex", "grid"]},
    orientation: {control: {type: "select"}, options: ["vertical", "horizontal"]},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: RadioButtonGroup,
  decorators: [
    /* Same frame as the Pro demo pages: centred, 24px padding, so `w-full` demos fill the width */
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {layout: "fullscreen"},
  title: "Pro/Forms/RadioButtonGroup",
} satisfies Meta<typeof RadioButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared data
 * -----------------------------------------------------------------------------------------------*/
const CheckIcon = () => <Icon icon="gravity-ui:circle-check-fill" />;

const tiers = [
  {description: "For hobby sites and side projects", id: "hobby", price: 7},
  {description: "For shipping teams that need more seats", id: "team", price: 19},
  {description: "For companies with audit requirements", id: "company", price: 49},
];

const MonthlyPrice = ({className, value}: {className?: string; value: number}) => (
  <NumberValue
    className={className ?? "mt-2 text-sm font-semibold"}
    currency="USD"
    maximumFractionDigits={0}
    style="currency"
    value={value}
  >
    <NumberValue.Suffix>
      <span className="text-xs font-normal text-muted">/mo</span>
    </NumberValue.Suffix>
  </NumberValue>
);

const TierItems = ({indicator = true}: {indicator?: boolean}) => (
  <>
    {tiers.map((tier) => (
      <RadioButtonGroup.Item key={tier.id} value={tier.id}>
        {indicator ? <RadioButtonGroup.Indicator /> : null}
        <RadioButtonGroup.ItemContent>
          <Label className="capitalize">{tier.id}</Label>
          <Description>{tier.description}</Description>
          <MonthlyPrice value={tier.price} />
        </RadioButtonGroup.ItemContent>
      </RadioButtonGroup.Item>
    ))}
  </>
);

const shippingOptions = [
  {description: "Arrives in 5-8 business days", id: "economy", label: "Economy", price: 4},
  {description: "Arrives in 2-3 business days", id: "priority", label: "Priority", price: 12},
  {description: "Arrives the next morning", id: "overnight", label: "Overnight", price: 29},
];

const ShippingItems = () => (
  <>
    {shippingOptions.map((option) => (
      <RadioButtonGroup.Item key={option.id} value={option.id}>
        <RadioButtonGroup.Indicator />
        <RadioButtonGroup.ItemContent>
          <div className="flex flex-col gap-1">
            <Label>{option.label}</Label>
            <Description>{option.description}</Description>
          </div>
          <NumberValue
            className="mt-2 text-sm font-semibold"
            currency="USD"
            minimumFractionDigits={2}
            style="currency"
            value={option.price}
          />
        </RadioButtonGroup.ItemContent>
      </RadioButtonGroup.Item>
    ))}
  </>
);

/* Brand-neutral payment marks drawn for these stories (24x24) */
const CardMarkIcon = () => (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <rect fill="#2563eb" height={14} rx={2.5} width={20} x={2} y={5} />
    <rect fill="#93c5fd" height={2.5} width={20} x={2} y={8.5} />
    <rect fill="#ffffff" height={2} rx={1} width={6} x={5} y={14} />
  </svg>
);

const DebitMarkIcon = () => (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <rect fill="#0f766e" height={14} rx={2.5} width={20} x={2} y={5} />
    <path d="M14 9.5h5v5h-5z" fill="#fbbf24" />
    <rect fill="#ccfbf1" height={2} rx={1} width={7} x={5} y={14} />
  </svg>
);

const WalletMarkIcon = () => (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3H6.5" stroke="#7c3aed" strokeWidth={1.5} />
    <rect fill="#7c3aed" height={12} rx={2.5} width={18} x={3} y={7} />
    <circle cx={16.5} cy={13} fill="#ede9fe" r={1.5} />
  </svg>
);

const paymentMethods = [
  {description: "Expires 04/2027", icon: CardMarkIcon, id: "card-4471", label: "**** 4471"},
  {description: "Expires 11/2029", icon: DebitMarkIcon, id: "card-9052", label: "**** 9052"},
  {description: "Pay from your balance", icon: WalletMarkIcon, id: "wallet", label: "Wallet"},
];

const PaymentItems = ({align}: {align: "items-start" | "items-center"}) => (
  <>
    {paymentMethods.map(({description, icon: MarkIcon, id, label}) => (
      <RadioButtonGroup.Item key={id} value={id}>
        <RadioButtonGroup.ItemContent className={`flex-row ${align} gap-4`}>
          <RadioButtonGroup.ItemIcon>
            <MarkIcon />
          </RadioButtonGroup.ItemIcon>
          <div className="flex flex-col gap-0.5">
            <Label>{label}</Label>
            <Description>{description}</Description>
          </div>
        </RadioButtonGroup.ItemContent>
      </RadioButtonGroup.Item>
    ))}
  </>
);

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <RadioButtonGroup
      {...args}
      className="w-[min(360px,calc(100vw-2rem))]"
      defaultValue="team"
      name="tier"
    >
      <Label>Pick a tier</Label>
      <Description>You can switch tiers at any time</Description>
      <TierItems />
    </RadioButtonGroup>
  ),
};

export const DeliveryAndPayment: Story = {
  render: () => (
    <div className="flex w-full max-w-lg flex-col items-center gap-10">
      <section className="flex w-full flex-col gap-4">
        <RadioButtonGroup
          className="grid-cols-1 sm:grid-cols-3"
          defaultValue="priority"
          layout="grid"
          name="shipping"
          variant="secondary"
        >
          <Label className="col-span-full">Shipping speed</Label>
          <ShippingItems />
        </RadioButtonGroup>
      </section>
      <section className="flex w-full flex-col gap-4">
        <RadioButtonGroup
          className="grid-cols-1 sm:grid-cols-2"
          defaultValue="card-4471"
          layout="grid"
          name="payment"
          variant="secondary"
        >
          <Label className="col-span-full">Pay with</Label>
          <PaymentItems align="items-start" />
        </RadioButtonGroup>
      </section>
    </div>
  ),
};

export const SubscriptionPlans: Story = {
  render: () => {
    const brand = "#8b5cf6";
    const plans = [
      {
        description: "Charged USD 59.99 every year (US$ 5.00/month)",
        id: "yearly",
        label: "Yearly",
      },
      {
        badge: "Best value",
        description: "Charged USD 89.99 every year (US$ 7.50/month)",
        id: "yearly-plus",
        label: "Yearly + Cloud Sync",
      },
    ];

    return (
      <RadioButtonGroup
        aria-label="Billing plan"
        className="w-[min(400px,calc(100vw-2rem))]"
        defaultValue="yearly"
        name="billing-plan"
      >
        {plans.map((plan) => (
          <RadioButtonGroup.Item
            key={plan.id}
            className="border-none ring-transparent transition-colors duration-150 data-[selected=true]:bg-foreground"
            value={plan.id}
          >
            {({isSelected}) => (
              <>
                <PressableFeedback.Ripple />
                <RadioButtonGroup.Indicator className="top-1/2 -translate-y-1/2">
                  <Icon icon="gravity-ui:circle-check-fill" style={{color: brand}} />
                </RadioButtonGroup.Indicator>
                <RadioButtonGroup.ItemContent>
                  {plan.badge ? (
                    <Chip
                      className="absolute -top-1.5 -left-1 w-fit text-white"
                      size="sm"
                      style={{background: brand}}
                    >
                      {plan.badge}
                    </Chip>
                  ) : null}
                  <Label
                    className={
                      isSelected ? "text-xl font-bold text-background" : "text-xl font-bold"
                    }
                  >
                    {plan.label}
                  </Label>
                  <Description className={isSelected ? "mt-1 text-background/70" : "mt-1"}>
                    {plan.description}
                  </Description>
                </RadioButtonGroup.ItemContent>
              </>
            )}
          </RadioButtonGroup.Item>
        ))}
      </RadioButtonGroup>
    );
  },
};

export const GridLayout: Story = {
  args: {layout: "grid", variant: "secondary"},
  render: (args) => (
    <RadioButtonGroup
      {...args}
      className="w-full max-w-2xl grid-cols-1 sm:grid-cols-3"
      defaultValue="priority"
      name="shipping-grid"
    >
      <Label className="col-span-full">Shipping speed</Label>
      <ShippingItems />
    </RadioButtonGroup>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <RadioButtonGroup
      className="w-full max-w-2xl grid-cols-1 sm:grid-cols-2"
      defaultValue="card-4471"
      layout="grid"
      name="payment-icons"
      variant="secondary"
    >
      <Label className="col-span-full">Pay with</Label>
      <PaymentItems align="items-center" />
    </RadioButtonGroup>
  ),
};

export const IconCards: Story = {
  render: () => {
    const plans = [
      {
        badge: "Recommended",
        description: "For indie developers launching their first product.",
        icon: "gravity-ui:cube",
        id: "launch",
        label: "Launch",
        price: 9,
      },
      {
        description: "For product squads iterating every week.",
        icon: "gravity-ui:thunderbolt",
        id: "momentum",
        label: "Momentum",
        price: 24,
      },
      {
        description: "For organisations with several product lines.",
        icon: "gravity-ui:layers",
        id: "portfolio",
        label: "Portfolio",
        price: 69,
      },
      {
        description: "Priority support, SSO and regional data residency.",
        icon: "gravity-ui:shield-check",
        id: "assured",
        label: "Assured",
        price: 179,
      },
      {
        description: "Private cloud, named engineers and bespoke terms.",
        icon: "gravity-ui:crown-diamond",
        id: "summit",
        label: "Summit",
        price: 349,
      },
    ];

    return (
      <RadioButtonGroup
        className="w-[min(520px,calc(100vw-2rem))]"
        defaultValue="launch"
        name="workspace-tier"
      >
        <Label>Select a workspace tier</Label>
        {plans.map((plan) => (
          <RadioButtonGroup.Item key={plan.id} className="bg-default" value={plan.id}>
            <RadioButtonGroup.Indicator>
              <CheckIcon />
            </RadioButtonGroup.Indicator>
            <RadioButtonGroup.ItemContent>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-surface shadow-surface">
                  <Icon height={16} icon={plan.icon} width={16} />
                </span>
                <div className="flex gap-2">
                  <Label className="text-sm font-semibold">{plan.label}</Label>
                  {plan.badge ? (
                    <Chip color="success" size="sm" variant="soft">
                      {plan.badge}
                    </Chip>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <NumberValue
                  className="text-2xl font-bold"
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={plan.price}
                >
                  <NumberValue.Suffix>
                    <span className="text-sm font-normal text-muted"> per month</span>
                  </NumberValue.Suffix>
                </NumberValue>
              </div>
              <Description className="mt-1">{plan.description}</Description>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
        ))}
      </RadioButtonGroup>
    );
  },
};

export const WithRipple: Story = {
  render: () => {
    const zones = [
      {code: "ca-central-1", description: "Data stays inside Canada", id: "ca", label: "Canada"},
      {code: "eu-north-1", description: "Nordic data centres", id: "nordics", label: "Nordics"},
      {code: "sa-east-1", description: "Closest to South America", id: "brazil", label: "Brazil"},
    ];

    return (
      <RadioButtonGroup
        className="w-full max-w-2xl grid-cols-1 sm:grid-cols-3"
        defaultValue="ca"
        layout="grid"
        name="hosting-zone"
        variant="secondary"
      >
        <Label className="col-span-full">Hosting zone</Label>
        {zones.map((zone) => (
          <RadioButtonGroup.Item key={zone.id} value={zone.id}>
            <PressableFeedback.Ripple className="text-muted/50" />
            <RadioButtonGroup.Indicator />
            <RadioButtonGroup.ItemContent>
              <Label>{zone.label}</Label>
              <Description>{zone.description}</Description>
              <span className="mt-2 font-mono text-xs text-muted">{zone.code}</span>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
        ))}
      </RadioButtonGroup>
    );
  },
};

export const DisabledGroup: Story = {
  render: () => (
    <RadioButtonGroup
      isDisabled
      className="w-[min(360px,calc(100vw-2rem))]"
      defaultValue="team"
      name="tier-disabled"
      variant="secondary"
    >
      <Label>Pick a tier</Label>
      <Description>Only workspace owners can change the tier.</Description>
      <TierItems />
    </RadioButtonGroup>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = React.useState("team");

    return (
      <div className="flex w-[min(360px,calc(100vw-2rem))] flex-col gap-4">
        <RadioButtonGroup
          name="tier-controlled"
          value={selected}
          variant="secondary"
          onChange={setSelected}
        >
          <Label>Pick a tier</Label>
          <Description>You can switch tiers at any time</Description>
          <TierItems />
        </RadioButtonGroup>
        <p className="text-sm text-muted">
          Selected: <span className="font-medium text-foreground">{selected}</span>
        </p>
      </div>
    );
  },
};

export const CustomIndicator: Story = {
  render: () => {
    const audiences = [
      {count: 438, description: "Last campaign went out yesterday", id: "subscribers"},
      {count: 3150, description: "Last campaign went out 3 weeks ago", id: "past buyers"},
      {count: 1975, description: "Last campaign went out 6 days ago", id: "beta testers"},
    ];

    return (
      <RadioButtonGroup
        className="w-full max-w-2xl grid-cols-1 sm:grid-cols-3"
        defaultValue="subscribers"
        layout="grid"
        name="audience"
        variant="secondary"
      >
        <Label className="col-span-full">Choose an audience</Label>
        {audiences.map((audience) => (
          <RadioButtonGroup.Item key={audience.id} value={audience.id}>
            <RadioButtonGroup.Indicator>
              <CheckIcon />
            </RadioButtonGroup.Indicator>
            <RadioButtonGroup.ItemContent>
              <Label className="capitalize">{audience.id}</Label>
              <Description>{audience.description}</Description>
              <NumberValue className="mt-3 text-sm font-semibold" value={audience.count}>
                <NumberValue.Suffix>
                  <span className="text-xs font-normal text-muted"> contacts</span>
                </NumberValue.Suffix>
              </NumberValue>
            </RadioButtonGroup.ItemContent>
          </RadioButtonGroup.Item>
        ))}
      </RadioButtonGroup>
    );
  },
};

export const NoIndicator: Story = {
  render: () => (
    <RadioButtonGroup
      className="w-[min(360px,calc(100vw-2rem))]"
      defaultValue="team"
      name="tier-plain"
    >
      <Label>Pick a tier</Label>
      <TierItems indicator={false} />
    </RadioButtonGroup>
  ),
};

export const RenderPropChildren: Story = {
  render: () => (
    <RadioButtonGroup
      className="w-[min(360px,calc(100vw-2rem))]"
      defaultValue="team"
      name="tier-render"
      variant="secondary"
    >
      <Label>Pick a tier</Label>
      {tiers.map((tier) => (
        <RadioButtonGroup.Item key={tier.id} value={tier.id}>
          {({isSelected}) => (
            <>
              <RadioButtonGroup.Indicator />
              <RadioButtonGroup.ItemContent>
                <Label className="capitalize">{tier.id}</Label>
                <Description>{tier.description}</Description>
                <MonthlyPrice
                  value={tier.price}
                  className={
                    isSelected
                      ? "mt-2 text-sm font-semibold text-accent"
                      : "mt-2 text-sm font-semibold"
                  }
                />
              </RadioButtonGroup.ItemContent>
            </>
          )}
        </RadioButtonGroup.Item>
      ))}
    </RadioButtonGroup>
  ),
};
