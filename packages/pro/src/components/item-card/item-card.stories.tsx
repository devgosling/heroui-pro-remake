import type {Meta, StoryObj} from "@storybook/react";
import type {CSSProperties, JSX, ReactNode} from "react";

import {Button, Chip, Dropdown, Label, ListBox, Switch, Tooltip} from "@heroui/react";
import {Icon} from "@iconify/react";

import {InlineSelect} from "../inline-select";
import {PressableFeedback} from "../pressable-feedback";

import {ItemCard} from "./index";

const variants = ["default", "secondary", "tertiary", "outline", "transparent"] as const;

const meta = {
  argTypes: {
    variant: {
      control: "select",
      description: "Visual style variant",
      options: variants,
      table: {defaultValue: {summary: "default"}},
    },
  },
  args: {
    variant: "default",
  },
  component: ItemCard,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/ItemCard",
} satisfies Meta<typeof ItemCard>;

export default meta;

type Story = StoryObj<typeof meta>;
type Variant = (typeof variants)[number];

/* -------------------------------------------------------------------------------------------------
 * Story helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
const Chevron = () => (
  <Icon className="size-4 text-muted rtl:-scale-x-100" icon="gravity-ui:chevron-right" />
);

type PickerOption = {id: string; label: string};

const pickerItems = (options: PickerOption[]) =>
  options.map((option) => (
    <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
      {option.label}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  ));

// Pro demo pages set `text-foreground` on <body>; the frame does the same for inherited text.
const Frame = ({children, className}: {children: ReactNode; className?: string}) => (
  <div className={`text-foreground ${className ?? "w-[500px] rounded-2xl p-6"}`}>{children}</div>
);

// `render` swaps the default div for a native button (keeps every class and data-slot).
const renderButton = (props: JSX.IntrinsicElements["button"]) => (
  <button {...props} type="button" />
);

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        <ItemCard.Icon>
          <Icon icon="gravity-ui:clock" />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Time zone</ItemCard.Title>
          <ItemCard.Description>Used for reminders and calendar events</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <Button size="sm" variant="outline">
            UTC+01:00
            <Icon className="size-3.5 rtl:-scale-x-100" icon="gravity-ui:circle-chevron-right" />
          </Button>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Wallet card
 * -----------------------------------------------------------------------------------------------*/
export const WalletCard: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        {/* Only the emoji size is overridden: on the Pro demo page the icon tile keeps its 36px
            rounded-square default look (see specs/item-card.md, "Wallet Card"). */}
        <ItemCard.Icon className="text-lg">
          <span>🚀</span>
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Orbit Savings</ItemCard.Title>
          <ItemCard.Description>0x4F2a...b81C</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">$128.40</p>
              <p className="text-xs text-muted">0.064 ETH</p>
            </div>
            <Dropdown>
              <Button isIconOnly aria-label="Vault actions" size="sm" variant="ghost">
                <Icon className="size-4" icon="gravity-ui:ellipsis-vertical" />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu>
                  <Dropdown.Item id="copy" textValue="Copy address">
                    <Icon className="size-4 text-muted" icon="gravity-ui:copy" />
                    <Label>Copy address</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="explorer" textValue="Open in explorer">
                    <Icon
                      className="size-4 text-muted"
                      icon="gravity-ui:arrow-up-right-from-square"
                    />
                    <Label>Open in explorer</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="rename" textValue="Rename">
                    <Icon className="size-4 text-muted" icon="gravity-ui:pencil" />
                    <Label>Rename</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Device list
 * -----------------------------------------------------------------------------------------------*/
const devices = [
  {current: true, icon: "gravity-ui:display", name: "Studio Display", seen: "Seen: just now"},
  {icon: "gravity-ui:tv", name: "Living Room TV", seen: "Seen: 5 hours ago"},
  {icon: "gravity-ui:smartphone", name: "Pixel 8", seen: "Seen: 2 weeks ago"},
];

export const DeviceList: Story = {
  render: ({variant}) => (
    <Frame className="w-[500px] space-y-2 rounded-2xl p-6">
      {devices.map((device) => (
        <ItemCard key={device.name} variant={variant}>
          <ItemCard.Icon>
            <Icon icon={device.icon} />
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>{device.name}</ItemCard.Title>
            <ItemCard.Description>{device.seen}</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            {device.current ? (
              <Chip color="success" size="sm" variant="soft">
                Online
              </Chip>
            ) : (
              <Button size="sm" variant="outline">
                Sign out
              </Button>
            )}
          </ItemCard.Action>
        </ItemCard>
      ))}
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
const variantRows: Array<{description: string; icon: string; variant: Variant}> = [
  {description: "Raised surface with a soft shadow", icon: "gravity-ui:square", variant: "default"},
  {description: "Secondary surface, flat", icon: "gravity-ui:layers", variant: "secondary"},
  {
    description: "Tertiary surface, flat",
    icon: "gravity-ui:layers-3-diagonal",
    variant: "tertiary",
  },
  {
    description: "Hairline border on a clear background",
    icon: "gravity-ui:square-dashed",
    variant: "outline",
  },
  {
    description: "Blends into the page, no chrome",
    icon: "gravity-ui:eye-slash",
    variant: "transparent",
  },
];

export const Variants: Story = {
  // Every variant is shown at once, so the control is hidden here.
  argTypes: {variant: {table: {disable: true}}},
  render: () => (
    <Frame className="w-[500px] space-y-3 p-6">
      {variantRows.map((row) => (
        <ItemCard key={row.variant} variant={row.variant}>
          <ItemCard.Icon>
            <Icon icon={row.icon} />
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>{row.variant.replace(/^\w/, (c) => c.toUpperCase())}</ItemCard.Title>
            <ItemCard.Description>{row.description}</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            <Chevron />
          </ItemCard.Action>
        </ItemCard>
      ))}
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Without icon
 * -----------------------------------------------------------------------------------------------*/
export const WithoutIcon: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        <ItemCard.Content>
          <ItemCard.Title>Leave workspace</ItemCard.Title>
          <ItemCard.Description>You will lose access to every shared project</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <Button size="sm" variant="danger-soft">
            Leave
          </Button>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Title only
 * -----------------------------------------------------------------------------------------------*/
export const TitleOnly: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        <ItemCard.Icon>
          <Icon icon="gravity-ui:bell" />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Notifications</ItemCard.Title>
        </ItemCard.Content>
        <ItemCard.Action>
          <Chevron />
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With switch
 * -----------------------------------------------------------------------------------------------*/
export const WithSwitch: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        <ItemCard.Icon>
          <Icon icon="gravity-ui:arrows-rotate-right" />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Auto updates</ItemCard.Title>
          <ItemCard.Description>Install new versions in the background</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <Switch aria-label="Toggle auto updates">
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With select
 * -----------------------------------------------------------------------------------------------*/
export const WithSelect: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        <ItemCard.Icon>
          <Icon icon="gravity-ui:circle-dollar" />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Currency</ItemCard.Title>
          <ItemCard.Description>Shown on invoices and reports</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <InlineSelect aria-label="Currency" defaultValue="eur">
            <InlineSelect.Trigger>
              <InlineSelect.Value />
              <InlineSelect.Indicator />
            </InlineSelect.Trigger>
            <InlineSelect.Popover>
              <ListBox>
                {pickerItems([
                  {id: "usd", label: "US Dollar"},
                  {id: "eur", label: "Euro"},
                  {id: "gbp", label: "British Pound"},
                  {id: "chf", label: "Swiss Franc"},
                ])}
              </ListBox>
            </InlineSelect.Popover>
          </InlineSelect>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With multi select
 * -----------------------------------------------------------------------------------------------*/
export const WithMultiSelect: Story = {
  render: ({variant}) => (
    <Frame>
      <ItemCard variant={variant}>
        <ItemCard.Icon>
          <Icon icon="gravity-ui:envelope" />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Weekly digest</ItemCard.Title>
          <ItemCard.Description>Pick where summaries are delivered</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          {/* Same value cap as the Pro demo: the joined "A and B" value truncates at 8rem */}
          <InlineSelect
            aria-label="Weekly digest channels"
            defaultValue={["email", "sms"]}
            selectionMode="multiple"
            style={{"--inline-select-value-max-width": "8rem"} as CSSProperties}
          >
            <InlineSelect.Trigger>
              <InlineSelect.Value />
              <InlineSelect.Indicator />
            </InlineSelect.Trigger>
            <InlineSelect.Popover>
              <ListBox selectionMode="multiple">
                {pickerItems([
                  {id: "email", label: "Email"},
                  {id: "sms", label: "Text message"},
                  {id: "slack", label: "Slack"},
                ])}
              </ListBox>
            </InlineSelect.Popover>
          </InlineSelect>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Vertical stack
 * -----------------------------------------------------------------------------------------------*/
const stackRows = [
  {
    description: "Plans, invoices and payment methods",
    icon: "gravity-ui:credit-card",
    title: "Billing",
  },
  {
    description: "Connect the tools your team uses",
    icon: "gravity-ui:plug-connection",
    title: "Integrations",
  },
  {description: "Control what others can see", icon: "gravity-ui:shield-check", title: "Privacy"},
];

export const VerticalStack: Story = {
  render: ({variant}) => (
    <Frame className="w-[500px] space-y-2 rounded-2xl p-6">
      {stackRows.map((row) => (
        <ItemCard key={row.title} variant={variant}>
          <ItemCard.Icon>
            <Icon icon={row.icon} />
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>{row.title}</ItemCard.Title>
            <ItemCard.Description>{row.description}</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            <Chevron />
          </ItemCard.Action>
        </ItemCard>
      ))}
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Email setting
 * -----------------------------------------------------------------------------------------------*/
export const EmailSetting: Story = {
  render: ({variant}) => (
    <Frame className="w-[600px] rounded-2xl p-6">
      <ItemCard variant={variant}>
        <ItemCard.Content>
          <ItemCard.Title>
            sam.rivera@acme.dev
            <Chip className="ml-2 align-middle" size="sm" variant="soft">
              Default
            </Chip>
          </ItemCard.Title>
          <ItemCard.Description>
            Receipts and security alerts are delivered to this inbox.
          </ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <Tooltip delay={300}>
            <Tooltip.Trigger>
              <Dropdown>
                <Button isIconOnly aria-label="Email options" size="sm" variant="outline">
                  <Icon className="size-4" icon="gravity-ui:ellipsis" />
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu>
                    <Dropdown.Item id="verify" textValue="Resend verification">
                      <Label>Resend verification</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="edit" textValue="Change address">
                      <Label>Change address</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="remove" textValue="Remove" variant="danger">
                      <Label>Remove</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </Tooltip.Trigger>
            <Tooltip.Content>More options</Tooltip.Content>
          </Tooltip>
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Pressable (native button host + Pressable Feedback layers)
 * -----------------------------------------------------------------------------------------------*/
export const Pressable: Story = {
  render: ({variant}) => (
    <Frame className="w-[500px] space-y-4 rounded-2xl p-6">
      <ItemCard<"button">
        className="relative w-full cursor-pointer overflow-hidden"
        render={renderButton}
        variant={variant}
      >
        <PressableFeedback.Highlight />
        <ItemCard.Icon>
          <Icon icon="gravity-ui:bell" />
        </ItemCard.Icon>
        <ItemCard.Content>
          <ItemCard.Title>Notifications</ItemCard.Title>
          <ItemCard.Description>Choose what you get alerted about</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <Chevron />
        </ItemCard.Action>
      </ItemCard>
      <ItemCard<"button">
        className="relative w-full cursor-pointer overflow-hidden"
        render={renderButton}
        variant={variant}
      >
        <PressableFeedback.Ripple />
        <ItemCard.Icon>
          <Icon icon="gravity-ui:plug-connection" />
        </ItemCard.Icon>
        <ItemCard.Content className="w-full flex-1">
          <ItemCard.Title>Connected apps</ItemCard.Title>
          <ItemCard.Description>Review which apps can access your data</ItemCard.Description>
        </ItemCard.Content>
        <ItemCard.Action>
          <Chevron />
        </ItemCard.Action>
      </ItemCard>
    </Frame>
  ),
};
