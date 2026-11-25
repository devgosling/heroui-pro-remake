import type {Meta, StoryObj} from "@storybook/react";
import type {JSX, ReactElement, ReactNode} from "react";

import {Button, Dropdown, Label, ListBox, Separator, Switch, Tooltip} from "@heroui/react";
import {Icon} from "@iconify/react";
import {Fragment} from "react";

import {InlineSelect} from "../inline-select";
import {ItemCard} from "../item-card";
import {PressableFeedback} from "../pressable-feedback";

import {ItemCardGroup} from "./index";

const variants = ["default", "secondary", "tertiary", "outline", "transparent"] as const;

const meta = {
  argTypes: {
    columns: {
      control: "inline-radio",
      description: 'Grid column count, used when `layout` is `"grid"`',
      options: [2, 3],
      table: {defaultValue: {summary: "2"}},
    },
    layout: {
      control: "inline-radio",
      description: "Layout mode",
      options: ["list", "grid"],
      table: {defaultValue: {summary: "list"}},
    },
    variant: {
      control: "select",
      description: "Visual style",
      options: variants,
      table: {defaultValue: {summary: "default"}},
    },
  },
  args: {
    layout: "list",
    variant: "default",
  },
  component: ItemCardGroup,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/ItemCardGroup",
} satisfies Meta<typeof ItemCardGroup>;

export default meta;

type Story = StoryObj<typeof meta>;
type Variant = (typeof variants)[number];

/* -------------------------------------------------------------------------------------------------
 * Story helpers (not exported)
 * -----------------------------------------------------------------------------------------------*/
const Chevron = () => (
  <Icon className="size-4 text-muted rtl:-scale-x-100" icon="gravity-ui:chevron-right" />
);

// Pro demo pages set `text-foreground` on <body>; the frame does the same for inherited text.
const Frame = ({children, className}: {children: ReactNode; className: string}) => (
  <div className={`text-foreground ${className}`}>{children}</div>
);

// `render` swaps the item card's div for a native button (keeps every class and data-slot).
const renderButton = (props: JSX.IntrinsicElements["button"]) => (
  <button {...props} type="button" />
);

/*
 * Pressable rows in the Pro demos also carry `hover:bg-default/20 active:bg-default-hover/50`, but
 * on the Pro docs site an unlayered copy of `.item-card-group > [data-slot=item-card]` keeps the
 * row background transparent, so only the ripple is visible. The stories leave those two utilities
 * out to show the same result (see specs/item-card-group.md, deviations).
 */
const pressableRowClassName = "relative w-full cursor-pointer overflow-hidden transition-colors";

type Row = {description?: string; icon: string; title: string};

const PressableRow = ({description, icon, title}: Row) => (
  <ItemCard<"button"> className={pressableRowClassName} render={renderButton}>
    <PressableFeedback.Ripple />
    <ItemCard.Icon>
      <Icon icon={icon} />
    </ItemCard.Icon>
    <ItemCard.Content>
      <ItemCard.Title>{title}</ItemCard.Title>
      {description ? <ItemCard.Description>{description}</ItemCard.Description> : null}
    </ItemCard.Content>
    <ItemCard.Action>
      <Chevron />
    </ItemCard.Action>
  </ItemCard>
);

/** Renders the rows with an OSS `Separator` between each pair. */
const withSeparators = (rows: ReactElement[]) =>
  rows.map((row, index) => (
    <Fragment key={row.key}>
      {index > 0 ? <Separator /> : null}
      {row}
    </Fragment>
  ));

const LabeledSwitch = ({label}: {label: string}) => (
  <Switch aria-label={label}>
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Content>
  </Switch>
);

/* -------------------------------------------------------------------------------------------------
 * Developer settings (docs "Usage" demo): nested groups, header actions, pressable rows
 * -----------------------------------------------------------------------------------------------*/
const ArrowIcon = () => <Icon className="size-3" icon="gravity-ui:arrow-up-right" />;

export const DeveloperSettings: Story = {
  // The outer groups are transparent sections and the inner ones default surfaces.
  argTypes: {
    columns: {table: {disable: true}},
    layout: {table: {disable: true}},
    variant: {table: {disable: true}},
  },
  render: () => (
    <Frame className="flex w-[600px] flex-col gap-6 p-6">
      <ItemCardGroup variant="transparent">
        {/* Pro also passes `px-1.5` here; the Pro page keeps the 16px header inset (see spec). */}
        <ItemCardGroup.Header className="mb-1 flex items-center justify-between">
          <ItemCardGroup.Title>Package Registries</ItemCardGroup.Title>
          <Dropdown>
            <Button size="sm" variant="outline">
              Add Registry
              <Icon className="size-3" icon="gravity-ui:chevron-down" />
            </Button>
            <Dropdown.Popover className="min-w-[180px]">
              <Dropdown.Menu>
                <Dropdown.Item id="self-hosted" textValue="Self-hosted registry">
                  <Icon className="size-4" icon="gravity-ui:server" />
                  <Label>Self-hosted registry</Label>
                </Dropdown.Item>
                <Dropdown.Item id="mirror" textValue="Private mirror">
                  <Icon className="size-4" icon="gravity-ui:database" />
                  <Label>Private mirror</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </ItemCardGroup.Header>
        <ItemCardGroup className="overflow-hidden">
          {withSeparators([
            <ItemCard key="docker">
              <ItemCard.Icon>
                <Icon icon="gravity-ui:logo-docker" />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>Docker Hub</ItemCard.Title>
                <ItemCard.Description className="max-w-xs">
                  Signed in as @orbit-builds, pushing images for 4 projects in team orbit-labs
                </ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <Button size="sm" variant="outline">
                  Manage
                  <ArrowIcon />
                </Button>
              </ItemCard.Action>
            </ItemCard>,
            <ItemCard key="python">
              <ItemCard.Icon>
                <Icon icon="gravity-ui:logo-python" />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>PyPI</ItemCard.Title>
                <ItemCard.Description className="max-w-xs">
                  Publish wheels and source archives straight from tagged releases
                </ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <Button size="sm" variant="outline">
                  Connect
                  <ArrowIcon />
                </Button>
              </ItemCard.Action>
            </ItemCard>,
            <PressableRow
              key="self-hosted"
              description="Point builds at a registry running on your own servers"
              icon="gravity-ui:server"
              title="Self-hosted registry"
            />,
            <PressableRow
              key="mirror"
              description="Cache upstream packages behind your firewall"
              icon="gravity-ui:database"
              title="Private mirror"
            />,
          ])}
        </ItemCardGroup>
      </ItemCardGroup>
      <ItemCardGroup variant="transparent">
        <ItemCardGroup.Header className="mb-1">
          <ItemCardGroup.Title>Alerts</ItemCardGroup.Title>
        </ItemCardGroup.Header>
        <ItemCardGroup className="overflow-hidden">
          {withSeparators([
            <ItemCard key="telegram">
              <ItemCard.Icon>
                <Icon icon="gravity-ui:logo-telegram" />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>Telegram</ItemCard.Title>
                <ItemCard.Description>Post failed builds to a team chat</ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <Button size="sm" variant="outline">
                  Connect
                  <ArrowIcon />
                </Button>
              </ItemCard.Action>
            </ItemCard>,
            <ItemCard key="webhook">
              <ItemCard.Icon>
                <Icon icon="gravity-ui:logo-webhook" />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>Webhooks</ItemCard.Title>
                <ItemCard.Description>
                  Send every deployment event to an HTTPS endpoint
                </ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <Button size="sm" variant="outline">
                  Connect
                  <ArrowIcon />
                </Button>
              </ItemCard.Action>
            </ItemCard>,
          ])}
        </ItemCardGroup>
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Linked accounts: 3-column grid, linked check or a tooltip'd link button
 * -----------------------------------------------------------------------------------------------*/
const accounts = [
  {email: "mila@northwind.io", icon: "gravity-ui:logo-figma", linked: true, name: "Figma"},
  {icon: "gravity-ui:logo-telegram", linked: false, name: "Telegram"},
  {icon: "gravity-ui:logo-docker", linked: false, name: "Docker"},
  {icon: "gravity-ui:logo-microsoft-office", linked: true, name: "Microsoft"},
  {icon: "gravity-ui:logo-stack-overflow", linked: false, name: "Stack Overflow"},
];

export const LinkedAccounts: Story = {
  args: {columns: 3, layout: "grid"},
  render: (args) => (
    <ItemCardGroup {...args} className="text-foreground">
      {accounts.map((account) => (
        <ItemCard key={account.name}>
          <ItemCard.Icon className="bg-default text-foreground">
            <span className="text-sm font-bold">
              <Icon icon={account.icon} />
            </span>
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>{account.name}</ItemCard.Title>
            <ItemCard.Description>
              {account.linked ? (account.email ?? "Linked") : "Not linked"}
            </ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            {account.linked ? (
              <Icon className="size-5 text-success" icon="gravity-ui:circle-check" />
            ) : (
              <Tooltip delay={300}>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    aria-label={`Link ${account.name}`}
                    size="sm"
                    variant="secondary"
                  >
                    <Icon className="size-4" icon="gravity-ui:link" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content placement="top">Link {account.name}</Tooltip.Content>
              </Tooltip>
            )}
          </ItemCard.Action>
        </ItemCard>
      ))}
    </ItemCardGroup>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Wallet list: balances and an actions menu per row
 * -----------------------------------------------------------------------------------------------*/
const wallets = [
  {address: "0x7A1c...3e90", amount: "$0.00", emoji: "🐙", name: "Treasury", token: "0.0 ETH"},
  {
    address: "0xB4f2...91dA",
    amount: "$12.50",
    emoji: "🌵",
    name: "0xB4f2...91dA",
    token: "0.005 ETH",
  },
  {address: "0x0e6D...c27F", amount: "$214.88", emoji: "🎈", name: "Payroll", token: "0.12 ETH"},
  {address: "0x55aB...0b13", amount: "$0.00", emoji: "🦉", name: "Ana's Vault", token: "0.0 ETH"},
];

const WalletMenu = () => (
  <Dropdown>
    <Button isIconOnly aria-label="Wallet actions" size="sm" variant="ghost">
      <Icon className="size-4" icon="gravity-ui:ellipsis-vertical" />
    </Button>
    <Dropdown.Popover className="min-w-[200px]" placement="bottom end">
      <Dropdown.Menu>
        <Dropdown.Item id="rename" textValue="Rename Wallet">
          <Icon className="size-4" icon="gravity-ui:pencil" />
          <Label>Rename Wallet</Label>
        </Dropdown.Item>
        <Dropdown.Item id="receive" textValue="Receive">
          <Icon className="size-4" icon="gravity-ui:arrow-down-to-line" />
          <Label>Receive</Label>
        </Dropdown.Item>
        <Dropdown.Item id="history" textValue="Open History">
          <Icon className="size-4" icon="gravity-ui:clock" />
          <Label className="flex flex-1 items-center justify-between">
            Open History
            <Icon className="size-3 text-muted" icon="gravity-ui:arrow-up-right-from-square" />
          </Label>
        </Dropdown.Item>
        <Dropdown.Item id="primary" textValue="Make Primary">
          <Icon className="size-4" icon="gravity-ui:star" />
          <Label>Make Primary</Label>
        </Dropdown.Item>
        <Dropdown.Item id="copy" textValue="Copy Address">
          <Icon className="size-4" icon="gravity-ui:copy" />
          <Label>Copy Address</Label>
        </Dropdown.Item>
        <Dropdown.Item id="qr" textValue="Show QR Code">
          <Icon className="size-4" icon="gravity-ui:qr-code" />
          <Label>Show QR Code</Label>
        </Dropdown.Item>
        <Separator />
        <Dropdown.Item id="delete" textValue="Delete Wallet">
          <Icon className="size-4 text-danger" icon="gravity-ui:trash-bin" />
          <Label className="text-danger">Delete Wallet</Label>
        </Dropdown.Item>
        <Dropdown.Item id="backup" textValue="Back Up Wallet">
          <Icon className="size-4" icon="gravity-ui:arrow-up-from-line" />
          <Label>Back Up Wallet</Label>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

export const WalletList: Story = {
  render: (args) => (
    <ItemCardGroup {...args} className="w-[500px] text-foreground">
      {withSeparators(
        wallets.map((wallet) => (
          <ItemCard key={wallet.address}>
            {/* Only the emoji size is overridden: on the Pro page the icon keeps its default
                36px tile (see specs/item-card-group.md, deviations). */}
            <ItemCard.Icon className="text-lg">
              <span>{wallet.emoji}</span>
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>{wallet.name}</ItemCard.Title>
              <ItemCard.Description>{wallet.address}</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{wallet.amount}</p>
                  <p className="text-xs text-muted">{wallet.token}</p>
                </div>
                <WalletMenu />
              </div>
            </ItemCard.Action>
          </ItemCard>
        )),
      )}
    </ItemCardGroup>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Variants: one list group per variant, pressable rows
 * -----------------------------------------------------------------------------------------------*/
const variantSections: Array<{description: string; rows: [Row, Row]; variant: Variant}> = [
  {
    description: "Raised surface with a soft shadow",
    rows: [
      {description: "Name, avatar and bio", icon: "gravity-ui:person", title: "Account"},
      {description: "Sessions and sign-in methods", icon: "gravity-ui:key", title: "Access"},
    ],
    variant: "default",
  },
  {
    description: "Secondary surface without shadow",
    rows: [
      {description: "Formats for dates and numbers", icon: "gravity-ui:globe", title: "Region"},
      {description: "Colors and density", icon: "gravity-ui:palette", title: "Display"},
    ],
    variant: "secondary",
  },
  {
    description: "Tertiary surface without shadow",
    rows: [
      {description: "Back up files every night", icon: "gravity-ui:cloud", title: "Backups"},
      {description: "Switch to the dark palette", icon: "gravity-ui:moon", title: "Night theme"},
    ],
    variant: "tertiary",
  },
  {
    description: "Clear background with a border",
    rows: [
      {
        description: "Phones, tablets and laptops",
        icon: "gravity-ui:smartphone",
        title: "Hardware",
      },
      {description: "Who can see your activity", icon: "gravity-ui:shield", title: "Visibility"},
    ],
    variant: "outline",
  },
  {
    description: "No surface, border or shadow",
    rows: [
      {description: "Digest and mention alerts", icon: "gravity-ui:bell", title: "Alerts"},
      {description: "Working hours and holidays", icon: "gravity-ui:calendar", title: "Schedule"},
    ],
    variant: "transparent",
  },
];

export const Variants: Story = {
  // Every variant is shown at once, so the variant control is hidden here.
  argTypes: {
    columns: {table: {disable: true}},
    variant: {table: {disable: true}},
  },
  /*
   * The frame is `w-full max-w-[500px]`: in the centered layout its shrink-to-fit parent would
   * size it to the rows' content (~340px). The Pro page centers it at the top of a padded, full
   * width container instead, so it grows to 500px; the wrapper below does the same.
   */
  parameters: {layout: "fullscreen"},
  render: ({layout}) => (
    <div className="flex justify-center p-6">
      <Frame className="flex w-full max-w-[500px] flex-col gap-6 p-6">
        {variantSections.map((section) => (
          <ItemCardGroup
            key={section.variant}
            className="overflow-hidden"
            layout={layout}
            variant={section.variant}
          >
            <ItemCardGroup.Header>
              <ItemCardGroup.Title>
                {section.variant.replace(/^\w/, (c) => c.toUpperCase())}
              </ItemCardGroup.Title>
              <ItemCardGroup.Description>{section.description}</ItemCardGroup.Description>
            </ItemCardGroup.Header>
            {withSeparators(section.rows.map((row) => <PressableRow key={row.title} {...row} />))}
          </ItemCardGroup>
        ))}
      </Frame>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * List: rows with outline buttons, split by separators
 * -----------------------------------------------------------------------------------------------*/
const listRows = [
  {action: "Edit", description: "Name, photo and contact details", icon: "gravity-ui:person"},
  {action: "Review", description: "Devices and recent sign-ins", icon: "gravity-ui:shield-check"},
  {action: "Upgrade", description: "Space used by your files", icon: "gravity-ui:database"},
];

const listTitles = ["Personal details", "Sign-in activity", "Storage"];

export const List: Story = {
  render: (args) => (
    <ItemCardGroup {...args} className="w-[500px] text-foreground">
      {withSeparators(
        listRows.map((row, index) => (
          <ItemCard key={row.icon}>
            <ItemCard.Icon>
              <Icon icon={row.icon} />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>{listTitles[index]}</ItemCard.Title>
              <ItemCard.Description>{row.description}</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Button size="sm" variant="outline">
                {row.action}
              </Button>
            </ItemCard.Action>
          </ItemCard>
        )),
      )}
    </ItemCardGroup>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Grid (2 columns by default)
 * -----------------------------------------------------------------------------------------------*/
const gridRows: Row[] = [
  {description: "Plans & invoices", icon: "gravity-ui:credit-card", title: "Billing"},
  {description: "Members & roles", icon: "gravity-ui:persons", title: "Team"},
  {description: "Email & push", icon: "gravity-ui:bell", title: "Alerts"},
  {description: "Keys & webhooks", icon: "gravity-ui:key", title: "API"},
];

export const Grid: Story = {
  args: {layout: "grid"},
  render: (args) => (
    <Frame className="w-[600px] rounded-2xl p-6">
      <ItemCardGroup {...args}>
        {gridRows.map((row) => (
          <ItemCard key={row.title}>
            <ItemCard.Icon>
              <Icon icon={row.icon} />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>{row.title}</ItemCard.Title>
              <ItemCard.Description>{row.description}</ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
        ))}
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Grid with three columns and a header spanning the row
 * -----------------------------------------------------------------------------------------------*/
const locations: Row[] = [
  {description: "Main office", icon: "gravity-ui:house", title: "Lisbon"},
  {description: "Opened in May", icon: "gravity-ui:map-pin", title: "Porto"},
  {description: "Remote hub", icon: "gravity-ui:globe", title: "Madeira"},
];

export const GridThreeColumns: Story = {
  args: {columns: 3, layout: "grid"},
  render: (args) => (
    <Frame className="w-[720px] rounded-2xl p-6">
      <ItemCardGroup {...args}>
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Locations</ItemCardGroup.Title>
          <ItemCardGroup.Description>Offices your team can book desks in</ItemCardGroup.Description>
        </ItemCardGroup.Header>
        {locations.map((row) => (
          <ItemCard key={row.title}>
            <ItemCard.Icon>
              <Icon icon={row.icon} />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>{row.title}</ItemCard.Title>
              <ItemCard.Description>{row.description}</ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
        ))}
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With header (no separators between the rows)
 * -----------------------------------------------------------------------------------------------*/
export const WithHeader: Story = {
  render: (args) => (
    <Frame className="w-[500px] rounded-2xl p-6">
      <ItemCardGroup {...args}>
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Workspace</ItemCardGroup.Title>
          <ItemCardGroup.Description>Defaults applied to new projects</ItemCardGroup.Description>
        </ItemCardGroup.Header>
        <ItemCard>
          <ItemCard.Icon>
            <Icon icon="gravity-ui:clock" />
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>Time zone</ItemCard.Title>
            <ItemCard.Description>Used for due dates and reminders</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            <Button size="sm" variant="outline">
              UTC+1
            </Button>
          </ItemCard.Action>
        </ItemCard>
        <ItemCard>
          <ItemCard.Icon>
            <Icon icon="gravity-ui:calendar" />
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>Week start</ItemCard.Title>
            <ItemCard.Description>First column of the calendar</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            <Button size="sm" variant="outline">
              Monday
            </Button>
          </ItemCard.Action>
        </ItemCard>
        <ItemCard>
          <ItemCard.Icon>
            <Icon icon="gravity-ui:eye" />
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>Public by default</ItemCard.Title>
            <ItemCard.Description>Share new projects with everyone</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            <LabeledSwitch label="Public by default" />
          </ItemCard.Action>
        </ItemCard>
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Multiple sections: stacked groups with title-only headers
 * -----------------------------------------------------------------------------------------------*/
export const MultipleSections: Story = {
  render: (args) => (
    <Frame className="flex w-[500px] flex-col gap-6 rounded-2xl p-6">
      <ItemCardGroup {...args}>
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Billing</ItemCardGroup.Title>
        </ItemCardGroup.Header>
        {withSeparators([
          <ItemCard key="plan">
            <ItemCard.Icon>
              <Icon icon="gravity-ui:credit-card" />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Plan</ItemCard.Title>
              <ItemCard.Description>Compare tiers and change your plan</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Chevron />
            </ItemCard.Action>
          </ItemCard>,
          <ItemCard key="invoices">
            <ItemCard.Icon>
              <Icon icon="gravity-ui:file-text" />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Invoices</ItemCard.Title>
              <ItemCard.Description>Download receipts for past months</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Chevron />
            </ItemCard.Action>
          </ItemCard>,
        ])}
      </ItemCardGroup>
      <ItemCardGroup {...args}>
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Editor</ItemCardGroup.Title>
        </ItemCardGroup.Header>
        {withSeparators([
          <ItemCard key="font">
            <ItemCard.Icon>
              <Icon icon="gravity-ui:text" />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Font size</ItemCard.Title>
              <ItemCard.Description>Text size in the code editor</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Button size="sm" variant="outline">
                14 px
              </Button>
            </ItemCard.Action>
          </ItemCard>,
          <ItemCard key="wrap">
            <ItemCard.Icon>
              <Icon icon="gravity-ui:arrow-uturn-ccw-left" />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Word wrap</ItemCard.Title>
              <ItemCard.Description>Break long lines at the viewport edge</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <LabeledSwitch label="Word wrap" />
            </ItemCard.Action>
          </ItemCard>,
        ])}
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Pressable: rows rendered as native buttons with a ripple
 * -----------------------------------------------------------------------------------------------*/
const pressableRows: Row[] = [
  {description: "Cards, bank accounts and wallets", icon: "gravity-ui:wallet", title: "Payments"},
  {description: "Addresses for orders", icon: "gravity-ui:map-pin", title: "Shipping"},
  {
    description: "Linked apps and services",
    icon: "gravity-ui:plug-connection",
    title: "Connections",
  },
];

export const Pressable: Story = {
  render: (args) => (
    <Frame className="w-[500px] rounded-2xl p-6">
      <ItemCardGroup {...args} className="overflow-hidden">
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Store</ItemCardGroup.Title>
          <ItemCardGroup.Description>
            Payment, delivery and connected service settings
          </ItemCardGroup.Description>
        </ItemCardGroup.Header>
        {withSeparators(pressableRows.map((row) => <PressableRow key={row.title} {...row} />))}
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Notification preferences: title-only rows with a multi-select Inline Select
 * -----------------------------------------------------------------------------------------------*/
const channelOptions = [
  {id: "email", label: "Email"},
  {id: "sms", label: "SMS"},
  {id: "push", label: "Push Notification"},
];

const notificationRows = [
  {channels: ["email", "push"], icon: "gravity-ui:at", options: channelOptions, title: "Mentions"},
  {
    channels: ["email"],
    icon: "gravity-ui:comment",
    options: channelOptions.filter((option) => option.id !== "sms"),
    title: "Comment Replies",
  },
  {
    channels: ["email", "push"],
    icon: "gravity-ui:person-plus",
    options: channelOptions.filter((option) => option.id !== "sms"),
    title: "New Followers",
  },
];

export const NotificationPreferences: Story = {
  render: (args) => (
    <Frame className="w-[550px] rounded-2xl p-6">
      <ItemCardGroup {...args}>
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Notification Channels</ItemCardGroup.Title>
          <ItemCardGroup.Description>
            Pick where each kind of activity reaches you
          </ItemCardGroup.Description>
        </ItemCardGroup.Header>
        {withSeparators(
          notificationRows.map((row) => (
            <ItemCard key={row.title}>
              <ItemCard.Icon>
                <Icon icon={row.icon} />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>{row.title}</ItemCard.Title>
              </ItemCard.Content>
              <ItemCard.Action>
                <InlineSelect
                  aria-label={row.title}
                  defaultValue={row.channels}
                  selectionMode="multiple"
                >
                  <InlineSelect.Trigger>
                    <InlineSelect.Value />
                    <InlineSelect.Indicator />
                  </InlineSelect.Trigger>
                  <InlineSelect.Popover>
                    <ListBox selectionMode="multiple">
                      {row.options.map((option) => (
                        <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                          {option.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </InlineSelect.Popover>
                </InlineSelect>
              </ItemCard.Action>
            </ItemCard>
          )),
        )}
      </ItemCardGroup>
    </Frame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Permission levels: transparent group, single-select Inline Select per row
 * -----------------------------------------------------------------------------------------------*/
const permissionRows = [
  {
    description: "Boards, cards and comments",
    icon: "gravity-ui:layout-cells",
    options: ["Read", "Write", "Admin"],
    title: "Projects",
    value: "Write",
  },
  {
    description: "Exports and dashboards",
    icon: "gravity-ui:chart-column",
    options: ["Hidden", "Read", "Admin"],
    title: "Reports",
    value: "Read",
  },
  {
    description: "Invites and role changes",
    icon: "gravity-ui:persons",
    options: ["Hidden", "Read", "Admin"],
    title: "People",
    value: "Hidden",
  },
];

export const PermissionLevels: Story = {
  args: {variant: "transparent"},
  render: (args) => (
    <Frame className="w-[500px] rounded-2xl p-6">
      <ItemCardGroup {...args}>
        <ItemCardGroup.Header>
          <ItemCardGroup.Title>Access</ItemCardGroup.Title>
          <ItemCardGroup.Description>Set what guests can do in each area</ItemCardGroup.Description>
        </ItemCardGroup.Header>
        {permissionRows.map((row) => (
          <ItemCard key={row.title}>
            <ItemCard.Icon>
              <Icon icon={row.icon} />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>{row.title}</ItemCard.Title>
              <ItemCard.Description>{row.description}</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <InlineSelect aria-label={`${row.title} access`} defaultValue={row.value}>
                <InlineSelect.Trigger>
                  <InlineSelect.Value />
                  <InlineSelect.Indicator />
                </InlineSelect.Trigger>
                <InlineSelect.Popover>
                  <ListBox>
                    {row.options.map((option) => (
                      <ListBox.Item key={option} id={option} textValue={option}>
                        {option}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </InlineSelect.Popover>
              </InlineSelect>
            </ItemCard.Action>
          </ItemCard>
        ))}
      </ItemCardGroup>
    </Frame>
  ),
};
