import type {Meta, StoryObj} from "@storybook/react";

import {Button, Chip, Description, Label, Link} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {NumberValue} from "../number-value";
import {PressableFeedback} from "../pressable-feedback";

import {CheckboxButtonGroup} from "./index";

const meta = {
  argTypes: {
    isDisabled: {control: "boolean"},
    layout: {control: {type: "select"}, options: ["flex", "grid"]},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: CheckboxButtonGroup,
  parameters: {layout: "centered"},
  title: "Pro/Forms/CheckboxButtonGroup",
} satisfies Meta<typeof CheckboxButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared data
 * -----------------------------------------------------------------------------------------------*/
const CheckIcon = () => <Icon icon="gravity-ui:circle-check-fill" />;

const services = [
  {
    description: "Nightly snapshots kept for 30 days",
    id: "snapshots",
    label: "Snapshots",
    price: 6,
  },
  {description: "Uptime checks from 12 regions", id: "uptime", label: "Uptime checks", price: 9},
  {description: "Dedicated account manager", id: "concierge", label: "Concierge", price: 15},
];

const MonthlyPrice = ({className, value}: {className?: string; value: number}) => (
  <NumberValue
    className={className ?? "mt-2 text-sm font-semibold"}
    currency="USD"
    minimumFractionDigits={2}
    style="currency"
    value={value}
  >
    <NumberValue.Suffix>
      <span className="text-xs font-normal text-muted">/mo</span>
    </NumberValue.Suffix>
  </NumberValue>
);

const modules = [
  {description: "Live dashboards and exports", id: "insights", label: "insights"},
  {description: "Shared inbox for customer tickets", id: "helpdesk", label: "helpdesk"},
  {description: "Scheduled jobs and webhooks", id: "automation", label: "automation"},
];

const addons = [
  {description: "Point-in-time restore for every database", id: "backups"},
  {description: "Alerts as soon as latency or errors spike", id: "monitoring"},
  {description: "Full-text search across all of your records", id: "search"},
];

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {variant: "secondary"},
  render: (args) => (
    <CheckboxButtonGroup
      {...args}
      className="w-[360px]"
      defaultValue={["backups", "monitoring"]}
      name="addons"
    >
      <Label>Workspace add-ons</Label>
      <Description>Pick every add-on your team needs</Description>
      {addons.map((addon) => (
        <CheckboxButtonGroup.Item key={addon.id} value={addon.id}>
          <CheckboxButtonGroup.Indicator />
          <CheckboxButtonGroup.ItemContent>
            <Label className="capitalize">{addon.id}</Label>
            <Description>{addon.description}</Description>
          </CheckboxButtonGroup.ItemContent>
        </CheckboxButtonGroup.Item>
      ))}
    </CheckboxButtonGroup>
  ),
};

export const SubscriptionPlans: Story = {
  render: () => {
    const brand = "#2fb39a";
    const brandStrong = "#1d7f6d";
    const plans = [
      {
        daily: 0.5,
        description: "Version history, shared libraries and priority sync for creative teams.",
        id: "studio",
        label: "Studio",
        monthly: 15,
      },
      {
        daily: 0.3,
        description: "More space and faster uploads for your personal projects.",
        id: "creator",
        label: "Creator",
        monthly: 9,
      },
      {
        daily: 0.1,
        description: "Essential cloud storage to keep your files backed up.",
        id: "starter",
        label: "Starter",
        monthly: 3,
      },
    ];

    return (
      <div className="flex w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Pick a storage plan</h2>
          <p className="text-sm text-muted">
            Every plan is end-to-end encrypted.{" "}
            <Link
              className="text-sm font-semibold no-underline"
              href="#"
              style={{color: brandStrong}}
            >
              Get a free week!
            </Link>
          </p>
        </div>
        <CheckboxButtonGroup
          aria-label="Storage plan"
          className="w-full"
          defaultValue={["creator"]}
          name="storage-plan"
          style={{"--accent": brand} as React.CSSProperties}
        >
          {plans.map((plan) => (
            <CheckboxButtonGroup.Item key={plan.id} value={plan.id}>
              {({isSelected}) => (
                <>
                  <CheckboxButtonGroup.Indicator>
                    <CheckIcon />
                  </CheckboxButtonGroup.Indicator>
                  <CheckboxButtonGroup.ItemContent>
                    <Label className="text-lg font-bold">{plan.label}</Label>
                    <Description>{plan.description}</Description>
                    <p className="mt-3 text-sm">
                      <span style={isSelected ? {color: brandStrong} : undefined}>
                        <NumberValue
                          className="font-semibold"
                          currency="USD"
                          style="currency"
                          value={plan.daily}
                        >
                          <NumberValue.Suffix>/day</NumberValue.Suffix>
                        </NumberValue>
                      </span>{" "}
                      <span className="text-muted">
                        (
                        <NumberValue
                          currency="USD"
                          maximumFractionDigits={0}
                          style="currency"
                          value={plan.monthly}
                        />{" "}
                        billed monthly)
                      </span>
                    </p>
                  </CheckboxButtonGroup.ItemContent>
                </>
              )}
            </CheckboxButtonGroup.Item>
          ))}
        </CheckboxButtonGroup>
        <div className="flex w-full flex-col items-center gap-4">
          <p className="px-2 text-center text-xs text-muted">
            *Storage quotas are shared across every device linked to your account.
          </p>
          <Button
            fullWidth
            className="rounded-full text-white"
            size="lg"
            style={{background: brand}}
          >
            Start my free week
          </Button>
          <Link
            className="text-sm font-semibold no-underline"
            href="#"
            style={{color: brandStrong}}
          >
            Compare plans
          </Link>
        </div>
      </div>
    );
  },
};

export const IconCards: Story = {
  render: () => {
    const features = [
      {
        badge: "Popular",
        description: "Require a hardware key for every admin sign-in.",
        icon: "gravity-ui:key",
        id: "hardware-keys",
        label: "Hardware Keys",
      },
      {
        description: "Rotate API tokens automatically every 90 days.",
        icon: "gravity-ui:arrows-rotate-right",
        id: "token-rotation",
        label: "Token Rotation",
      },
      {
        description: "Keep a tamper-proof trail of every workspace change.",
        icon: "gravity-ui:file-text",
        id: "audit-log",
        label: "Audit Log",
      },
      {
        description: "Notify owners when a login comes from a new country.",
        icon: "gravity-ui:bell",
        id: "geo-alerts",
        label: "Geo Alerts",
      },
    ];

    return (
      <CheckboxButtonGroup
        className="w-[520px]"
        defaultValue={["hardware-keys", "token-rotation"]}
        name="access-controls"
      >
        <Label>Access controls</Label>
        {features.map((feature) => (
          <CheckboxButtonGroup.Item key={feature.id} className="bg-default" value={feature.id}>
            <CheckboxButtonGroup.Indicator>
              <CheckIcon />
            </CheckboxButtonGroup.Indicator>
            <CheckboxButtonGroup.ItemContent>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-surface shadow-surface">
                  <Icon height={16} icon={feature.icon} width={16} />
                </span>
                <div className="flex gap-2">
                  <Label className="text-sm font-semibold">{feature.label}</Label>
                  {feature.badge ? (
                    <Chip color="success" size="sm" variant="soft">
                      {feature.badge}
                    </Chip>
                  ) : null}
                </div>
              </div>
              <Description className="mt-2">{feature.description}</Description>
            </CheckboxButtonGroup.ItemContent>
          </CheckboxButtonGroup.Item>
        ))}
      </CheckboxButtonGroup>
    );
  },
};

export const GridLayout: Story = {
  args: {layout: "grid", variant: "secondary"},
  render: (args) => (
    <CheckboxButtonGroup
      {...args}
      className="w-full max-w-2xl grid-cols-3"
      defaultValue={["snapshots", "uptime"]}
      name="services"
    >
      <Label className="col-span-full">Services</Label>
      {services.map((service) => (
        <CheckboxButtonGroup.Item key={service.id} value={service.id}>
          <CheckboxButtonGroup.Indicator />
          <CheckboxButtonGroup.ItemContent>
            <div className="flex flex-col gap-1">
              <Label>{service.label}</Label>
              <Description>{service.description}</Description>
            </div>
            <MonthlyPrice value={service.price} />
          </CheckboxButtonGroup.ItemContent>
        </CheckboxButtonGroup.Item>
      ))}
    </CheckboxButtonGroup>
  ),
};

export const WithIcons: Story = {
  render: () => {
    const scopes = [
      {
        description: "Draft, review and publish articles",
        icon: "gravity-ui:pencil",
        id: "editorial",
        label: "Editorial Access",
      },
      {
        description: "Invite people and change their roles",
        icon: "gravity-ui:persons",
        id: "members",
        label: "Member Management",
      },
      {
        description: "Read traffic and revenue reports",
        icon: "gravity-ui:chart-column",
        id: "reports",
        label: "Reports Access",
      },
      {
        description: "Change billing and workspace options",
        icon: "gravity-ui:gear",
        id: "workspace",
        label: "Workspace",
      },
    ];

    return (
      <CheckboxButtonGroup
        className="w-full max-w-2xl grid-cols-2"
        defaultValue={["editorial", "reports"]}
        layout="grid"
        name="scopes"
        variant="secondary"
      >
        <Label className="col-span-full">Editor scopes</Label>
        {scopes.map((scope) => (
          <CheckboxButtonGroup.Item key={scope.id} value={scope.id}>
            <CheckboxButtonGroup.ItemContent className="flex-row items-center gap-4">
              <CheckboxButtonGroup.ItemIcon>
                <Icon height={16} icon={scope.icon} width={16} />
              </CheckboxButtonGroup.ItemIcon>
              <div className="flex flex-col gap-0.5">
                <Label>{scope.label}</Label>
                <Description>{scope.description}</Description>
              </div>
            </CheckboxButtonGroup.ItemContent>
          </CheckboxButtonGroup.Item>
        ))}
      </CheckboxButtonGroup>
    );
  },
};

export const WithRipple: Story = {
  render: () => {
    const apps = [
      {description: "Sync issues from your GitLab projects", id: "gitlab", label: "GitLab"},
      {description: "Post release notes to Discord", id: "discord", label: "Discord"},
      {description: "Mirror tasks into your Jira board", id: "jira", label: "Jira"},
    ];

    return (
      <CheckboxButtonGroup
        className="w-full max-w-2xl grid-cols-3"
        defaultValue={["gitlab"]}
        layout="grid"
        name="connected-apps"
        variant="secondary"
      >
        <Label className="col-span-full">Connected apps</Label>
        {apps.map((app) => (
          <CheckboxButtonGroup.Item key={app.id} value={app.id}>
            <PressableFeedback.Ripple />
            <CheckboxButtonGroup.Indicator />
            <CheckboxButtonGroup.ItemContent>
              <Label>{app.label}</Label>
              <Description>{app.description}</Description>
            </CheckboxButtonGroup.ItemContent>
          </CheckboxButtonGroup.Item>
        ))}
      </CheckboxButtonGroup>
    );
  },
};

export const DisabledGroup: Story = {
  render: () => (
    <CheckboxButtonGroup
      isDisabled
      className="w-[360px]"
      defaultValue={["insights"]}
      name="modules-disabled"
      variant="secondary"
    >
      <Label>Workspace modules</Label>
      <Description>Modules can only be changed by an owner.</Description>
      {modules.map((module) => (
        <CheckboxButtonGroup.Item key={module.id} value={module.id}>
          <CheckboxButtonGroup.Indicator />
          <CheckboxButtonGroup.ItemContent>
            <Label className="capitalize">{module.label}</Label>
            <Description>{module.description}</Description>
          </CheckboxButtonGroup.ItemContent>
        </CheckboxButtonGroup.Item>
      ))}
    </CheckboxButtonGroup>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(["snapshots"]);

    return (
      <div className="flex w-[360px] flex-col gap-4">
        <CheckboxButtonGroup
          name="services-controlled"
          value={selected}
          variant="secondary"
          onChange={setSelected}
        >
          <Label>Services</Label>
          <Description>Choose the services for this project</Description>
          {services.map((service) => (
            <CheckboxButtonGroup.Item key={service.id} value={service.id}>
              <CheckboxButtonGroup.Indicator />
              <CheckboxButtonGroup.ItemContent>
                <Label>{service.label}</Label>
                <Description>{service.description}</Description>
                <MonthlyPrice value={service.price} />
              </CheckboxButtonGroup.ItemContent>
            </CheckboxButtonGroup.Item>
          ))}
        </CheckboxButtonGroup>
        <p className="text-sm text-muted">
          Selected:{" "}
          <span className="font-medium text-foreground">
            {selected.length ? selected.join(", ") : "None"}
          </span>
        </p>
      </div>
    );
  },
};

export const CustomIndicator: Story = {
  render: () => {
    const digests = [
      {count: 5300, description: "Monthly roundup of new features", id: "release-notes"},
      {count: 9700, description: "Incident reports and planned downtime", id: "status-digest"},
      {count: 1800, description: "Webinars, events and community picks", id: "community"},
    ];

    return (
      <CheckboxButtonGroup
        className="w-full max-w-3xl grid-cols-3"
        defaultValue={["release-notes", "status-digest"]}
        layout="grid"
        name="digests"
        variant="secondary"
      >
        <Label className="col-span-full">Email digests</Label>
        {digests.map((digest) => (
          <CheckboxButtonGroup.Item key={digest.id} value={digest.id}>
            <CheckboxButtonGroup.Indicator>
              <CheckIcon />
            </CheckboxButtonGroup.Indicator>
            <CheckboxButtonGroup.ItemContent>
              <Label className="capitalize">{digest.id.replace("-", " ")}</Label>
              <Description>{digest.description}</Description>
              <NumberValue className="mt-3 text-sm font-semibold" value={digest.count}>
                <NumberValue.Suffix>
                  <span className="text-xs font-normal text-muted"> readers</span>
                </NumberValue.Suffix>
              </NumberValue>
            </CheckboxButtonGroup.ItemContent>
          </CheckboxButtonGroup.Item>
        ))}
      </CheckboxButtonGroup>
    );
  },
};

export const NoIndicator: Story = {
  render: () => (
    <CheckboxButtonGroup className="w-[360px]" defaultValue={["insights"]} name="modules-plain">
      <Label>Workspace modules</Label>
      {modules.map((module) => (
        <CheckboxButtonGroup.Item key={module.id} value={module.id}>
          <CheckboxButtonGroup.ItemContent>
            <Label className="capitalize">{module.label}</Label>
            <Description>{module.description}</Description>
          </CheckboxButtonGroup.ItemContent>
        </CheckboxButtonGroup.Item>
      ))}
    </CheckboxButtonGroup>
  ),
};

export const RenderPropChildren: Story = {
  render: () => (
    <CheckboxButtonGroup className="w-[360px]" name="services-render" variant="secondary">
      <Label>Services</Label>
      {services.map((service) => (
        <CheckboxButtonGroup.Item key={service.id} value={service.id}>
          {({isSelected}) => (
            <>
              <CheckboxButtonGroup.Indicator />
              <CheckboxButtonGroup.ItemContent>
                <Label>{service.label}</Label>
                <Description>{service.description}</Description>
                <NumberValue
                  currency="USD"
                  maximumFractionDigits={0}
                  style="currency"
                  value={service.price}
                  className={
                    isSelected
                      ? "mt-2 text-sm font-semibold text-accent"
                      : "mt-2 text-sm font-semibold"
                  }
                >
                  <NumberValue.Suffix>
                    <span className="text-xs font-normal text-muted">/mo</span>
                  </NumberValue.Suffix>
                </NumberValue>
              </CheckboxButtonGroup.ItemContent>
            </>
          )}
        </CheckboxButtonGroup.Item>
      ))}
    </CheckboxButtonGroup>
  ),
};
