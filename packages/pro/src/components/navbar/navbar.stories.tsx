import type {Key} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";
import type {MouseEvent, ReactNode} from "react";

import {Avatar, Button, Dropdown, Kbd, Label, ListBox, SearchField, Separator} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useRef, useState} from "react";

import {InlineSelect} from "../inline-select";
import {Segment} from "../segment";

import {Navbar, useNavbar} from "./index";

const meta = {
  argTypes: {
    hideOnScroll: {control: "boolean"},
    maxWidth: {control: {type: "select"}, options: ["sm", "md", "lg", "xl", "2xl", "full"]},
    position: {control: {type: "select"}, options: ["sticky", "static", "floating"]},
    shouldBlockScroll: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: Navbar,
  parameters: {layout: "padded"},
  title: "Pro/Navigation/Navbar",
} satisfies Meta<typeof Navbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story helpers (own artwork and content)
 * -----------------------------------------------------------------------------------------------*/
function Wordmark({height = 22}: {height?: number}) {
  return (
    <svg aria-hidden="true" fill="none" height={height} viewBox="0 0 83 26" width="auto">
      <rect fill="currentColor" height="18" rx="5" width="18" x="0.5" y="4" />
      <path
        d="M5.5 17.5 9.5 9l4 8.5"
        stroke="var(--background)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <text
        fill="currentColor"
        fontFamily="inherit"
        fontSize="17"
        fontWeight="700"
        letterSpacing="-0.5"
        x="25"
        y="19.5"
      >
        acme
      </text>
    </svg>
  );
}

function BrandMark({className = "size-5"}: {className?: string}) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 34">
      <path d="M2 9.5 12 3l10 6.5v15L12 31 2 24.5z" fill="currentColor" />
      <path d="M12 3v28M2 9.5l20 15M22 9.5l-20 15" stroke="var(--background)" strokeWidth="1.5" />
    </svg>
  );
}

function Brand({height}: {height?: number}) {
  return (
    <Navbar.Brand>
      <Wordmark height={height} />
      <span className="sr-only">Acme</span>
    </Navbar.Brand>
  );
}

function NavIcon({className, icon}: {className?: string; icon: string}) {
  return <Icon className={className} data-slot="icon" height={16} icon={icon} width={16} />;
}

function AccountAvatar({initials}: {initials: string}) {
  return (
    <Avatar className="size-7">
      <Avatar.Fallback>{initials}</Avatar.Fallback>
    </Avatar>
  );
}

function Paragraphs({count, text}: {count: number; text: (index: number) => ReactNode}) {
  return (
    <div className="space-y-6 p-6">
      {Array.from({length: count}, (_, index) => (
        <div key={index} className="rounded-lg bg-surface p-4">
          <p className="text-sm text-muted">{text(index + 1)}</p>
        </div>
      ))}
    </div>
  );
}

const marketingLinks = [
  {href: "#product", label: "Product"},
  {href: "#solutions", label: "Solutions"},
  {href: "#resources", label: "Resources"},
  {href: "#plans", label: "Plans"},
];

function MarketingActions() {
  return (
    <Navbar.Content>
      <Navbar.Item aria-label="Search">
        <NavIcon icon="gravity-ui:magnifier" />
      </Navbar.Item>
      <Navbar.Item aria-label="Notifications">
        <NavIcon icon="gravity-ui:bell" />
      </Navbar.Item>
      <Navbar.Separator />
      <Navbar.Item aria-label="Account">
        <AccountAvatar initials="MK" />
      </Navbar.Item>
    </Navbar.Content>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {position: "static"},
  render: (args) => (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <Navbar {...args}>
        <Navbar.Header>
          <Brand />
          <Navbar.Spacer />
          <Navbar.Content>
            {marketingLinks.map((link) => (
              <Navbar.Item key={link.href} href={link.href} isCurrent={link.href === "#solutions"}>
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <MarketingActions />
        </Navbar.Header>
      </Navbar>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Docs site
 * -----------------------------------------------------------------------------------------------*/
const docsLinks = [
  {href: "#guides", label: "Guides"},
  {href: "#reference", label: "Reference"},
  {href: "#changelog", label: "Changelog"},
];

export const DocsSite: Story = {
  args: {position: "static"},
  render: (args) => (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <Navbar {...args}>
        <Navbar.Header>
          <Navbar.MenuToggle className="md:hidden" />
          <Brand />
          <Navbar.Content className="hidden gap-0 md:flex">
            {docsLinks.map((link) => (
              <Navbar.Item
                key={link.href}
                className="px-2"
                href={link.href}
                isCurrent={link.href === "#guides"}
              >
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <Navbar.Content className="hidden md:flex">
            <SearchField
              aria-label="Search the guides"
              className="w-[200px]"
              name="docs-search"
              variant="secondary"
            >
              <SearchField.Group className="h-8">
                <SearchField.SearchIcon />
                <SearchField.Input className="w-16" placeholder="Find a page…" />
                <Kbd className="pointer-events-none mr-1.5 text-xs">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </SearchField.Group>
            </SearchField>
            <Segment
              aria-label="Color scheme"
              className="gap-0"
              defaultSelectedKey="system"
              size="sm"
            >
              <Segment.Item aria-label="Light" className="size-[28px] px-0" id="light">
                <Icon className="size-3.5" icon="gravity-ui:sun" />
              </Segment.Item>
              <Segment.Item aria-label="Dark" className="size-[28px] px-0" id="dark">
                <Icon className="size-3.5" icon="gravity-ui:moon" />
              </Segment.Item>
              <Segment.Item aria-label="System" className="size-[28px] px-0" id="system">
                <Icon className="size-3.5" icon="gravity-ui:display" />
              </Segment.Item>
            </Segment>
          </Navbar.Content>
        </Navbar.Header>
        <Navbar.Menu>
          {docsLinks.map((link) => (
            <Navbar.MenuItem key={link.href} href={link.href} isCurrent={link.href === "#guides"}>
              {link.label}
            </Navbar.MenuItem>
          ))}
        </Navbar.Menu>
      </Navbar>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With dropdowns
 * -----------------------------------------------------------------------------------------------*/
const appLinks = [
  {href: "#overview", label: "Overview"},
  {href: "#deployments", label: "Deployments"},
  {href: "#people", label: "People"},
  {href: "#invoices", label: "Invoices"},
];

function MenuIcon({icon}: {icon: string}) {
  return <Icon className="size-4 shrink-0 text-muted" icon={icon} />;
}

function TeamAvatar({color, initials}: {color: "accent" | "warning"; initials: string}) {
  return (
    <Avatar className="size-5" variant="soft">
      <Avatar.Fallback className="text-[10px]" color={color}>
        {initials}
      </Avatar.Fallback>
    </Avatar>
  );
}

function TeamSwitcher() {
  return (
    <Dropdown>
      <Button className="gap-1.5 px-2" variant="ghost">
        <BrandMark />
        <span className="text-sm font-semibold">Acme</span>
        <Icon className="size-3.5 text-muted" icon="gravity-ui:chevron-down" />
      </Button>
      <Dropdown.Popover className="min-w-[220px]">
        <Dropdown.Menu aria-label="Switch workspace">
          <Dropdown.Item id="workspace-settings" textValue="Workspace settings">
            <MenuIcon icon="gravity-ui:gear" />
            <Label>Workspace settings</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="acme" textValue="Acme">
            <BrandMark />
            <Label>Acme</Label>
          </Dropdown.Item>
          <Dropdown.Item id="orbit" textValue="Orbit Studio">
            <TeamAvatar color="accent" initials="OS" />
            <Label>Orbit Studio</Label>
          </Dropdown.Item>
          <Dropdown.Item id="paperplane" textValue="Paperplane Co.">
            <TeamAvatar color="warning" initials="PP" />
            <Label>Paperplane Co.</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="new-workspace" textValue="New workspace">
            <MenuIcon icon="gravity-ui:plus" />
            <Label>New workspace…</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function UserMenu({
  avatar,
  className,
  label,
}: {
  avatar: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <Dropdown>
      <Button isIconOnly aria-label={label} className={className} variant="ghost">
        {avatar}
      </Button>
      <Dropdown.Popover className="min-w-[200px]">
        <Dropdown.Menu aria-label={label}>
          <Dropdown.Item id="profile" textValue="Profile">
            <MenuIcon icon="gravity-ui:person" />
            <Label>Profile</Label>
          </Dropdown.Item>
          <Dropdown.Item id="settings" textValue="Settings">
            <MenuIcon icon="gravity-ui:gear" />
            <Label>Settings</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="keys" textValue="API keys">
            <MenuIcon icon="gravity-ui:key" />
            <Label>API keys</Label>
          </Dropdown.Item>
          <Dropdown.Item id="help" textValue="Help center">
            <MenuIcon icon="gravity-ui:circle-question" />
            <Label>Help center</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="sign-out" textValue="Sign out">
            <MenuIcon icon="gravity-ui:arrow-right-from-square" />
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export const WithDropdowns: Story = {
  args: {position: "static"},
  render: (args) => (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <Navbar {...args}>
        <Navbar.Header>
          <Navbar.MenuToggle className="md:hidden" />
          <TeamSwitcher />
          <Navbar.Separator className="hidden h-4 md:block" />
          <Navbar.Content className="hidden md:flex">
            {appLinks.map((link) => (
              <Navbar.Item key={link.href} href={link.href} isCurrent={link.href === "#overview"}>
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <Navbar.Content className="hidden md:flex">
            <Navbar.Item aria-label="Help">
              <NavIcon icon="gravity-ui:circle-question" />
            </Navbar.Item>
            <Navbar.Item aria-label="Notifications">
              <NavIcon icon="gravity-ui:bell" />
            </Navbar.Item>
          </Navbar.Content>
          <UserMenu avatar={<AccountAvatar initials="RL" />} label="User menu" />
        </Navbar.Header>
        <Navbar.Menu>
          {appLinks.map((link) => (
            <Navbar.MenuItem key={link.href} href={link.href} isCurrent={link.href === "#overview"}>
              {link.label}
            </Navbar.MenuItem>
          ))}
        </Navbar.Menu>
      </Navbar>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Positioning (floating)
 * -----------------------------------------------------------------------------------------------*/
export const Floating: Story = {
  args: {maxWidth: "xl", position: "floating"},
  render: (args) => (
    <div className="relative h-[400px] w-full overflow-y-auto rounded-xl border border-border bg-background-secondary pt-2">
      <Navbar {...args}>
        <Navbar.Header>
          <Brand />
          <Navbar.Content>
            {marketingLinks.map((link) => (
              <Navbar.Item key={link.href} href={link.href} isCurrent={link.href === "#product"}>
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <MarketingActions />
        </Navbar.Header>
      </Navbar>
      <Paragraphs
        count={12}
        text={(index) => `The floating bar stays pinned with a gap to the edges. Block ${index}.`}
      />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Hide on scroll
 * -----------------------------------------------------------------------------------------------*/
function HideOnScrollDemo(args: Story["args"]) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="relative h-[400px] w-full overflow-y-auto rounded-xl border border-border"
    >
      <Navbar {...args} hideOnScroll className="border-b border-border" parentRef={scrollRef}>
        <Navbar.Header>
          <Brand />
          <Navbar.Content>
            {marketingLinks.map((link) => (
              <Navbar.Item key={link.href} href={link.href} isCurrent={link.href === "#product"}>
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <MarketingActions />
        </Navbar.Header>
      </Navbar>
      <Paragraphs
        count={20}
        text={(index) =>
          `Keep scrolling down and the bar slides away; nudge back up and it returns. Card ${index}.`
        }
      />
    </div>
  );
}

export const HideOnScroll: Story = {
  args: {position: "sticky"},
  render: (args) => <HideOnScrollDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Dashboard (breadcrumb-style selectors)
 * -----------------------------------------------------------------------------------------------*/
type Option = {id: string; label: string; detail?: string; initials?: string};

function WorkspaceAvatar({initials}: {initials: string}) {
  return (
    <Avatar className="size-5">
      <Avatar.Fallback className="text-[10px]">{initials}</Avatar.Fallback>
    </Avatar>
  );
}

/** Breadcrumb selector built with the Pro InlineSelect (same structure as the Pro demo). */
function BreadcrumbSelect({
  defaultValue,
  label,
  options,
  popoverClassName = "w-[200px]",
}: {
  defaultValue: string;
  label: string;
  options: Option[];
  popoverClassName?: string;
}) {
  const [value, setValue] = useState<Key | null>(defaultValue);
  const selected = options.find((option) => option.id === value) ?? options[0]!;
  const hasAvatar = selected.initials !== undefined;

  return (
    <InlineSelect aria-label={label} value={value} onChange={setValue}>
      <InlineSelect.Trigger className={hasAvatar ? "gap-2" : undefined}>
        {hasAvatar ? <WorkspaceAvatar initials={selected.initials!} /> : null}
        <span className="text-sm font-medium text-foreground">{selected.label}</span>
        <InlineSelect.Indicator />
      </InlineSelect.Trigger>
      <InlineSelect.Popover className={popoverClassName}>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.initials !== undefined ? (
                <WorkspaceAvatar initials={option.initials} />
              ) : null}
              {option.detail ? (
                <div className="flex flex-1 items-center justify-between gap-4 pr-6">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted tabular-nums">{option.detail}</span>
                </div>
              ) : (
                option.label
              )}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </InlineSelect.Popover>
    </InlineSelect>
  );
}

function Slash() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-border"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 16 16"
    >
      <path d="M10.5 2.5 5.5 13.5" strokeLinecap="round" />
    </svg>
  );
}

export const Dashboard: Story = {
  args: {position: "static"},
  render: (args) => (
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <Navbar {...args}>
        <Navbar.Header className="gap-2">
          <Navbar.Brand className="mr-1">
            <BrandMark />
            <span className="sr-only">Acme</span>
          </Navbar.Brand>
          <Slash />
          <BreadcrumbSelect
            defaultValue="rivera"
            label="Workspace"
            popoverClassName="w-[220px]"
            options={[
              {id: "rivera", initials: "AR", label: "rivera"},
              {id: "northwind", initials: "NW", label: "northwind"},
              {id: "lighthouse", initials: "LH", label: "lighthouse"},
            ]}
          />
          <Slash />
          <BreadcrumbSelect
            defaultValue="storefront"
            label="Project"
            options={[
              {id: "storefront", label: "storefront"},
              {id: "docs-portal", label: "docs-portal"},
              {id: "billing-api", label: "billing-api"},
              {id: "mobile-app", label: "mobile-app"},
            ]}
          />
          <Navbar.Spacer />
          <div aria-label="Usage this month" className="hidden items-center gap-1.5 md:flex">
            <span className="text-[11px] font-medium tracking-wider text-muted uppercase">
              Usage
            </span>
            <span className="text-sm font-semibold text-foreground tabular-nums">$48.20</span>
          </div>
          <Navbar.Separator className="hidden h-4 md:block" />
          <BreadcrumbSelect
            defaultValue="cet"
            label="Timezone"
            options={[
              {detail: "UTC+01:00", id: "cet", label: "CET"},
              {detail: "UTC+00:00", id: "utc", label: "UTC"},
              {detail: "UTC−05:00", id: "est", label: "EST"},
              {detail: "UTC+05:30", id: "ist", label: "IST"},
            ]}
          />
          <Navbar.Content>
            <Navbar.Item aria-label="Notifications">
              <NavIcon icon="gravity-ui:bell" />
            </Navbar.Item>
            <UserMenu
              label="Account menu"
              avatar={
                <Avatar className="size-7" variant="soft">
                  <Avatar.Fallback className="text-xs font-semibold" color="success">
                    AR
                  </Avatar.Fallback>
                </Avatar>
              }
            />
          </Navbar.Content>
        </Navbar.Header>
      </Navbar>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With menu (mobile toggle + animated dropdown)
 * -----------------------------------------------------------------------------------------------*/
const workspaceLinks = [
  {href: "#inbox", icon: "gravity-ui:tray", label: "Inbox"},
  {href: "#projects", icon: "gravity-ui:folder", label: "Projects"},
  {href: "#reports", icon: "gravity-ui:chart-column", label: "Reports"},
];

/**
 * Like the Pro demo, the items only mark themselves as current: their click handler prevents the
 * default, so the URL stays put and the open menu stays open.
 */
function WithMenuDemo(args: Story["args"]) {
  const [current, setCurrent] = useState("#inbox");
  const select = (href: string) => (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setCurrent(href);
  };

  return (
    <div className="w-full overflow-visible bg-background">
      <Navbar {...args}>
        <Navbar.Header>
          <Navbar.Brand>
            <Wordmark />
            <span className="sr-only">Acme</span>
          </Navbar.Brand>
          <Navbar.Content className="hidden sm:flex">
            {workspaceLinks.map((link) => (
              <Navbar.Item
                key={link.href}
                href={link.href}
                isCurrent={link.href === current}
                onClick={select(link.href)}
              >
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <MarketingActions />
          <Navbar.MenuToggle />
        </Navbar.Header>
        <Navbar.Menu>
          {workspaceLinks.map((link) => (
            <Navbar.MenuItem
              key={link.href}
              href={link.href}
              isCurrent={link.href === current}
              onClick={select(link.href)}
            >
              <NavIcon icon={link.icon} />
              {link.label}
            </Navbar.MenuItem>
          ))}
        </Navbar.Menu>
      </Navbar>
      <main className="flex min-h-[680px] flex-col gap-4 p-4 sm:p-6">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <span className="text-xs font-medium text-muted uppercase">Inbox</span>
          <h2 className="text-xl font-semibold text-foreground">Studio workspace</h2>
          <p className="text-sm leading-6 text-muted">
            Toggle the menu to slide the mobile navigation over this page. It fills the space below
            the bar; picking a destination only highlights it.
          </p>
        </section>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Today", "Three reviews waiting", "Design handoff, copy review and a pricing check."],
            ["Team", "Who is online", "Four people are active in the studio workspace."],
            ["Later", "Planned for Friday", "Quarterly roadmap sync with the product group."],
          ].map(([eyebrow, title, body]) => (
            <section
              key={title}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
            >
              <span className="text-xs font-medium text-muted">{eyebrow}</span>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-6 text-muted">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export const WithMenu: Story = {
  args: {defaultMenuOpen: true, position: "static"},
  render: (args) => <WithMenuDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Compact density
 * -----------------------------------------------------------------------------------------------*/
export const Compact: Story = {
  args: {height: "2.75rem", position: "static", size: "sm"},
  render: (args) => (
    <div
      className="w-full overflow-hidden rounded-xl border border-border"
      style={{"--spacing": "0.22rem"} as React.CSSProperties}
    >
      <Navbar {...args}>
        <Navbar.Header className="text-xs">
          <Brand height={16} />
          <Navbar.Spacer />
          <Navbar.Content className="hidden gap-4 md:flex">
            {[
              {href: "#discover", icon: "gravity-ui:compass", label: "Discover"},
              {href: "#schedule", icon: "gravity-ui:calendar", label: "Schedule"},
              {href: "#groups", icon: "gravity-ui:persons", label: "Groups"},
            ].map((link) => (
              <Navbar.Item
                key={link.href}
                className="gap-1.5 text-xs"
                href={link.href}
                isCurrent={link.href === "#discover"}
              >
                <NavIcon className="size-3.5" icon={link.icon} />
                {link.label}
              </Navbar.Item>
            ))}
          </Navbar.Content>
          <Navbar.Spacer />
          <span className="hidden text-xs text-muted tabular-nums md:inline">4:05 PM CET</span>
          <Navbar.Item className="gap-1.5 text-xs font-medium" href="#create">
            <NavIcon className="size-3.5" icon="gravity-ui:plus" />
            New meetup
          </Navbar.Item>
          <Navbar.Content className="gap-1">
            <Navbar.Item aria-label="Search" className="size-7">
              <NavIcon className="size-3.5" icon="gravity-ui:magnifier" />
            </Navbar.Item>
            <Navbar.Item aria-label="Notifications" className="relative size-7">
              <NavIcon className="size-3.5" icon="gravity-ui:bell" />
            </Navbar.Item>
            <UserMenu
              className="size-7"
              label="Account menu"
              avatar={
                <Avatar className="size-6" variant="soft">
                  <Avatar.Fallback className="text-[10px] font-semibold" color="accent">
                    TS
                  </Avatar.Fallback>
                </Avatar>
              }
            />
          </Navbar.Content>
        </Navbar.Header>
      </Navbar>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Programmatic control (useNavbar)
 * -----------------------------------------------------------------------------------------------*/
function MenuStatus() {
  const {isMenuOpen, setMenuOpen} = useNavbar();

  return (
    <Button
      isDisabled={!isMenuOpen}
      size="sm"
      variant="secondary"
      onPress={() => setMenuOpen(false)}
    >
      Close menu
    </Button>
  );
}

export const ProgrammaticControl: Story = {
  args: {position: "static", shouldBlockScroll: false},
  render: (args) => (
    <div className="w-full overflow-visible rounded-xl border border-border">
      <Navbar {...args}>
        <Navbar.Header>
          <Navbar.MenuToggle />
          <Brand />
          <Navbar.Spacer />
          <MenuStatus />
        </Navbar.Header>
        <Navbar.Menu>
          {workspaceLinks.map((link) => (
            <Navbar.MenuItem key={link.href} href={link.href}>
              <NavIcon icon={link.icon} />
              {link.label}
            </Navbar.MenuItem>
          ))}
        </Navbar.Menu>
      </Navbar>
    </div>
  ),
};
