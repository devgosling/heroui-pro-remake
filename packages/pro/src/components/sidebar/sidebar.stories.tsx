import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Avatar, Breadcrumbs, Button, Chip, Dropdown, Kbd, Tooltip} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {Command} from "../command";
import {Segment} from "../segment";

import {Sidebar, useSidebarPages} from "./index";

const meta = {
  argTypes: {
    collapsible: {control: {type: "select"}, options: ["icon", "offcanvas", "none"]},
    defaultOpen: {control: "boolean"},
    reduceMotion: {control: "boolean"},
    side: {control: {type: "select"}, options: ["left", "right"]},
    toggleShortcut: {control: "text"},
    variant: {control: {type: "select"}, options: ["sidebar", "floating", "inset"]},
  },
  component: Sidebar.Provider,
  parameters: {layout: "fullscreen"},
  title: "Pro/Navigation/Sidebar",
} satisfies Meta<typeof Sidebar.Provider>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared story helpers
 * -----------------------------------------------------------------------------------------------*/
const COMPACT = {"--spacing": "0.2rem"} as React.CSSProperties;

/*
 * Custom header / footer content follows the icon rail with the arbitrary variant
 * `[.sidebar[data-collapsible=icon][data-state=collapsed]_&]:…` (it never matches inside the mobile
 * sheet) plus a 200ms transition, so nothing jumps or disappears at once.
 */

/** Folds away (height + fade) while the desktop panel collapses to its icon rail, and back. */
const RailFold = ({children, className = ""}: {children: ReactNode; className?: string}) => (
  <div
    className={`grid grid-rows-[1fr] transition-[grid-template-rows,margin,opacity,visibility] duration-200 motion-reduce:transition-none [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:invisible [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:grid-rows-[0fr] [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:opacity-0 ${className}`}
  >
    {/* The padding / negative margin pair keeps focus rings visible inside the clipping box. */}
    <div className="-m-1 min-h-0 overflow-hidden p-1">{children}</div>
  </div>
);

/**
 * Shrinks to nothing (and fades) on the rail. `data-sidebar="label"` brings the fade / max-width
 * animation; the 2px padding / negative margin pair keeps the child's focus ring unclipped.
 */
const RailShrink = ({children}: {children: ReactNode}) => (
  <div className="-m-0.5 flex min-w-0 flex-1 p-0.5" data-sidebar="label">
    {children}
  </div>
);

/** A footer row with a wide button that shrinks away on the rail and an icon button that stays. */
const RailButtonRow = ({children}: {children: ReactNode}) => (
  <div className="flex items-center gap-2 px-2 py-2 transition-[gap,padding] duration-200 motion-reduce:transition-none [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:gap-0 [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:px-[calc(0.5rem-var(--spacing)*1.5)]">
    {children}
  </div>
);

const Logo = ({className, letter}: {className: string; letter: string}) => (
  <div className={`flex size-6 shrink-0 items-center justify-center rounded-md ${className}`}>
    <span className="text-sm font-bold text-white">{letter}</span>
  </div>
);

const BrandHeader = ({
  className = "bg-accent",
  letter,
  name,
}: {
  className?: string;
  letter: string;
  name: string;
}) => (
  <Sidebar.Header>
    <div className="flex items-center gap-3 px-1 py-2">
      <Logo className={className} letter={letter} />
      <span className="text-sm font-semibold text-foreground" data-sidebar="label">
        {name}
      </span>
    </div>
  </Sidebar.Header>
);

type Crumb = {icon?: string; label: string};

const MainHeader = ({crumbs}: {crumbs: Crumb[]}) => (
  <div className="flex items-center gap-3 p-4">
    <Sidebar.Trigger />
    <Breadcrumbs className="min-w-0">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <Breadcrumbs.Item
            key={crumb.label}
            className={isLast ? "min-w-0 font-semibold" : "min-w-0 text-muted"}
            href={isLast ? undefined : "#"}
          >
            <span className="flex min-w-0 items-center gap-2 overflow-hidden">
              {crumb.icon ? <Icon className="size-4" icon={crumb.icon} /> : null}
              <span className="truncate">{crumb.label}</span>
            </span>
          </Breadcrumbs.Item>
        );
      })}
    </Breadcrumbs>
  </div>
);

const MainBody = ({children}: {children: ReactNode}) => (
  <div className="p-6">
    <p className="text-muted">{children}</p>
  </div>
);

const MoreActions = ({label}: {label: string}) => (
  <Sidebar.MenuActions>
    <Dropdown>
      <Sidebar.MenuAction aria-label={`More actions for ${label}`}>
        <Icon className="size-4" icon="gravity-ui:ellipsis" />
      </Sidebar.MenuAction>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu aria-label={`${label} actions`}>
          <Dropdown.Item id="rename" textValue="Rename">
            <Icon className="size-4 text-muted" icon="gravity-ui:pencil" />
            Rename
          </Dropdown.Item>
          <Dropdown.Item id="duplicate" textValue="Duplicate">
            <Icon className="size-4 text-muted" icon="gravity-ui:copy" />
            Duplicate
          </Dropdown.Item>
          <Dropdown.Item className="text-danger" id="delete" textValue="Delete">
            <Icon className="size-4" icon="gravity-ui:trash-bin" />
            Delete
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  </Sidebar.MenuActions>
);

type NavItem = {
  chip?: ReactNode;
  children?: NavItem[];
  current?: boolean;
  href?: string;
  icon?: string;
  id: string;
  label: string;
  muted?: boolean;
  withActions?: boolean;
};

const renderItems = (items: NavItem[], options: {trigger?: boolean} = {}): ReactNode =>
  items.map((item) => (
    <Sidebar.MenuItem
      key={item.id}
      // Parents toggle their submenu; muted "add" rows are plain (non-link) rows, like in Pro.
      href={item.children || item.muted ? undefined : (item.href ?? "#")}
      id={item.id}
      isCurrent={item.current}
    >
      {item.icon ? (
        <Sidebar.MenuIcon>
          <Icon icon={item.icon} />
        </Sidebar.MenuIcon>
      ) : null}
      <Sidebar.MenuLabel className={item.muted ? "text-muted" : undefined}>
        {item.label}
        {item.children ? (
          options.trigger ? (
            <Sidebar.MenuTrigger>
              <Sidebar.MenuIndicator />
            </Sidebar.MenuTrigger>
          ) : (
            <Sidebar.MenuIndicator />
          )
        ) : null}
      </Sidebar.MenuLabel>
      {item.chip ? <Sidebar.MenuChip>{item.chip}</Sidebar.MenuChip> : null}
      {item.withActions ? <MoreActions label={item.label} /> : null}
      {item.children ? (
        <Sidebar.Submenu>{renderItems(item.children, options)}</Sidebar.Submenu>
      ) : null}
    </Sidebar.MenuItem>
  ));

const NewChip = ({children = "New"}: {children?: ReactNode}) => (
  <Chip color="success" size="sm" variant="soft">
    {children}
  </Chip>
);

const ShortcutKbd = ({
  children,
  className,
  keyValue = "command",
}: {
  className?: string;
  keyValue?: "command";
  children: ReactNode;
}) => (
  <Kbd className={className ?? "text-xs"}>
    <Kbd.Abbr keyValue={keyValue} />
    <Kbd.Content>{children}</Kbd.Content>
  </Kbd>
);

const TimeChip = ({children}: {children: ReactNode}) => (
  <span className="text-[10px] leading-none text-muted">{children}</span>
);

const UserMenuTrigger = ({
  avatar,
  className = "px-2",
  name,
  subtitle,
}: {
  avatar: ReactNode;
  className?: string;
  name: string;
  subtitle?: string;
}) => (
  <Dropdown>
    <Dropdown.Trigger
      className={`flex w-full items-center gap-2 rounded-xl py-1.5 text-left transition-[padding,background-color] duration-200 outline-none hover:bg-default motion-reduce:transition-none [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:px-[calc(0.5rem-var(--spacing)*1.5)] ${className}`}
    >
      {avatar}
      {subtitle ? (
        <div className="flex min-w-0 flex-col" data-sidebar="label">
          <span className="truncate text-sm leading-tight font-medium text-foreground">{name}</span>
          <span className="truncate text-xs leading-tight text-muted">{subtitle}</span>
        </div>
      ) : (
        <span className="text-sm font-medium text-foreground" data-sidebar="label">
          {name}
        </span>
      )}
      <Icon
        className="ml-auto size-3 text-muted"
        data-sidebar="label"
        icon="gravity-ui:chevrons-expand-vertical"
      />
    </Dropdown.Trigger>
    <Dropdown.Popover placement="top start">
      <Dropdown.Menu aria-label="Account">
        <Dropdown.Item id="profile" textValue="Profile">
          <Icon className="size-4 text-muted" icon="gravity-ui:person" />
          Profile
        </Dropdown.Item>
        <Dropdown.Item id="preferences" textValue="Preferences">
          <Icon className="size-4 text-muted" icon="gravity-ui:gear" />
          Preferences
        </Dropdown.Item>
        <Dropdown.Item id="sign-out" textValue="Sign out">
          <Icon className="size-4 text-muted" icon="gravity-ui:arrow-right-from-square" />
          Sign out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown.Popover>
  </Dropdown>
);

const UserAvatar = ({name, src}: {name: string; src: string}) => (
  <Avatar size="sm">
    <Avatar.Image alt={name} src={src} />
    <Avatar.Fallback>{name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
  </Avatar>
);

const AVATAR_A = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg";
const AVATAR_B = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg";
const AVATAR_C = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/red.jpg";

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
const defaultNav: NavItem[] = [
  {current: true, icon: "gravity-ui:house", id: "home", label: "Home"},
  {
    children: [
      {id: "insights-summary", label: "Summary", withActions: true},
      {id: "insights-funnels", label: "Funnels", withActions: true},
      {id: "insights-cohorts", label: "Cohorts", withActions: true},
    ],
    icon: "gravity-ui:chart-column",
    id: "insights",
    label: "Insights",
  },
  {chip: <NewChip />, icon: "gravity-ui:list-check", id: "projects", label: "Projects"},
  {
    children: [
      {id: "preferences-account", label: "Account"},
      {id: "preferences-billing", label: "Billing"},
      {id: "preferences-members", label: "Members"},
    ],
    icon: "gravity-ui:gear",
    id: "preferences",
    label: "Preferences",
  },
];

const DefaultSidebarBody = ({isMobile = false}: {isMobile?: boolean}) => (
  <>
    <BrandHeader letter="N" name="Northwind" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Workspace" defaultExpandedKeys={["insights"]}>
          {renderItems(defaultNav, {trigger: isMobile})}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Account links">
        {renderItems([
          {icon: "gravity-ui:circle-question", id: "support", label: "Support center"},
          {icon: "gravity-ui:arrow-right-from-square", id: "sign-out", label: "Sign out"},
        ])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const Default: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <DefaultSidebarBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <DefaultSidebarBody isMobile />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Home"}]} />
        <MainBody>
          Primary content area. Narrow the window below 768px to open the sidebar as a sheet.
        </MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Complex
 * -----------------------------------------------------------------------------------------------*/
const complexSections = [
  {icon: "gravity-ui:house", id: "home", label: "Home"},
  {icon: "gravity-ui:calendar", id: "calls", label: "Calls"},
  {icon: "gravity-ui:sparkles", id: "assistant", label: "Assistant"},
  {icon: "gravity-ui:tray", id: "inbox", label: "Inbox"},
];

const ComplexHeaderSegment = () => {
  const [selected, setSelected] = React.useState<React.Key>("home");

  return (
    <Segment
      aria-label="Sections"
      className="bg-transparent p-0 [&_.segment\_\_indicator]:bg-default [&_.segment\_\_indicator]:shadow-none"
      selectedKey={selected as string}
      size="sm"
      onSelectionChange={setSelected}
    >
      {complexSections.map((section) => (
        <Segment.Item
          key={section.id}
          aria-label={section.label}
          className="w-auto"
          id={section.id}
        >
          {({isSelected}) => (
            <>
              <Icon className="size-4" icon={section.icon} />
              <span
                className="inline-grid transition-all duration-200 ease-out motion-reduce:transition-none"
                style={{
                  gridTemplateColumns: isSelected ? "1fr" : "0fr",
                  opacity: isSelected ? 1 : 0,
                }}
              >
                <span className="overflow-hidden">{section.label}</span>
              </span>
            </>
          )}
        </Segment.Item>
      ))}
    </Segment>
  );
};

const teamspaceChildren: NavItem[] = [
  {icon: "gravity-ui:house", id: "ts-overview", label: "Overview", withActions: true},
  {icon: "gravity-ui:list-check", id: "ts-tasks", label: "Open tasks", withActions: true},
  {icon: "gravity-ui:folder", id: "ts-projects", label: "Projects", withActions: true},
  {icon: "gravity-ui:layers", id: "ts-milestones", label: "Milestones", withActions: true},
  {
    current: true,
    icon: "gravity-ui:chart-line",
    id: "ts-timeline",
    label: "Timeline",
    withActions: true,
  },
  {icon: "gravity-ui:layout-columns-3", id: "ts-board", label: "Delivery board", withActions: true},
  {icon: "gravity-ui:code-fork", id: "ts-releases", label: "Releases", withActions: true},
  {icon: "gravity-ui:flag", id: "ts-goals", label: "Quarter goals", withActions: true},
  {icon: "gravity-ui:archive", id: "ts-archive", label: "Archive", withActions: true},
  {icon: "gravity-ui:book-open", id: "ts-handbook", label: "Handbook", withActions: true},
];

const ComplexSidebarBody = () => {
  // Like the Pro demo, the section switcher and the wide "New chat" button leave the rail; here they
  // fold / shrink away with the panel instead of disappearing at once.
  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-3">
            <Logo className="bg-amber-700" letter="O" />
            <span className="text-sm font-semibold text-foreground" data-sidebar="label">
              Orbit Studio
            </span>
          </div>
          <div className="flex items-center" data-sidebar="label">
            <button
              aria-label="New page"
              className="flex items-center gap-0.5 rounded-md p-1 text-foreground hover:bg-default"
              type="button"
            >
              <Icon className="size-4" icon="gravity-ui:pencil-to-square" />
              <Icon className="size-3 text-muted" icon="gravity-ui:chevron-down" />
            </button>
          </div>
        </div>
        <RailFold className="[.sidebar[data-collapsible=icon][data-state=collapsed]_&]:-mt-2">
          <ComplexHeaderSegment />
        </RailFold>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group className="[&>.sidebar\_\_group-label]:capitalize">
          <Sidebar.GroupLabel className="capitalize">Recent</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Recent">
            {renderItems([
              {icon: "gravity-ui:file-text", id: "recent-brief", label: "Launch brief"},
              {icon: "gravity-ui:file-text", id: "recent-pricing", label: "Pricing experiments"},
              {icon: "gravity-ui:file-text", id: "recent-hiring", label: "Hiring plan"},
              {icon: "gravity-ui:file-text", id: "recent-tokens", label: "Design tokens"},
              {icon: "gravity-ui:file-text", id: "recent-retro", label: "Sprint retro"},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Starred</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Starred">
            {renderItems([
              {icon: "gravity-ui:book-open", id: "starred-guides", label: "Guides"},
              {icon: "gravity-ui:list-check", id: "starred-todo", label: "My checklist"},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>
            <span className="flex items-center gap-2">
              Assistants
              <Chip size="sm" variant="soft">
                Beta
              </Chip>
            </span>
          </Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Assistants">
            {renderItems([
              {icon: "gravity-ui:face-robot", id: "assistant-me", label: "Personal"},
              {icon: "gravity-ui:plus", id: "assistant-add", label: "Create new", muted: true},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>
            <span className="flex flex-1 items-center justify-between">
              Teamspaces
              <Dropdown>
                <Dropdown.Trigger
                  aria-label="Teamspace actions"
                  className="-mr-1 flex size-6 items-center justify-center rounded-md text-muted hover:bg-default"
                >
                  <Icon className="size-4" icon="gravity-ui:ellipsis" />
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu aria-label="Teamspace actions">
                    <Dropdown.Item id="new-teamspace">New teamspace</Dropdown.Item>
                    <Dropdown.Item id="browse">Browse teamspaces</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </span>
          </Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Teamspaces" defaultExpandedKeys={["orbit-hq"]}>
            {renderItems([
              {
                children: teamspaceChildren,
                icon: "gravity-ui:planet-earth",
                id: "orbit-hq",
                label: "Orbit HQ",
              },
              {icon: "gravity-ui:code", id: "ts-platform", label: "Platform", withActions: true},
              {
                chip: <Icon className="size-3 text-muted" icon="gravity-ui:lock" />,
                icon: "gravity-ui:chart-pie",
                id: "ts-finance",
                label: "Finance",
                withActions: true,
              },
              {icon: "gravity-ui:target", id: "ts-growth", label: "Growth", withActions: true},
              {
                icon: "gravity-ui:file-text",
                id: "ts-research",
                label: "Research",
                withActions: true,
              },
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Separator />
        <Sidebar.Group>
          <Sidebar.GroupLabel>Shared</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Shared">
            {renderItems([{icon: "gravity-ui:persons", id: "shared-planning", label: "Planning"}])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Apps</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Apps">
            {renderItems([
              {icon: "gravity-ui:envelope", id: "app-mail", label: "Orbit Mail"},
              {icon: "gravity-ui:calendar", id: "app-calendar", label: "Orbit Calendar"},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Separator />
      <Sidebar.Footer>
        <Sidebar.Menu aria-label="Utilities">
          {renderItems([
            {icon: "gravity-ui:layers", id: "util-templates", label: "Templates"},
            {icon: "gravity-ui:list-check", id: "util-tasks", label: "My tasks"},
            {icon: "gravity-ui:cubes-3", id: "util-integrations", label: "Integrations"},
            {icon: "gravity-ui:circle-question", id: "util-help", label: "Help"},
            {icon: "gravity-ui:trash-bin", id: "util-trash", label: "Trash"},
          ])}
        </Sidebar.Menu>
        <RailButtonRow>
          <RailShrink>
            <Button
              className="flex h-10 w-full gap-2 bg-surface text-sm text-muted shadow-surface"
              size="sm"
              variant="tertiary"
            >
              <Icon className="size-4" icon="gravity-ui:comment" />
              <span>New chat</span>
              <ShortcutKbd>N</ShortcutKbd>
            </Button>
          </RailShrink>
          <Button isIconOnly aria-label="Compose" className="shrink-0" size="sm" variant="tertiary">
            <Icon className="size-4 text-muted" icon="gravity-ui:pencil" />
          </Button>
        </RailButtonRow>
      </Sidebar.Footer>
    </>
  );
};

export const Complex: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar style={COMPACT}>
        <ComplexSidebarBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <ComplexSidebarBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:chart-line", label: "Timeline"}]} />
        <div className="p-6">
          <p className="text-muted">
            A dense sidebar: the whole layout is tightened by overriding{" "}
            <code className="rounded bg-default px-1 py-0.5 text-xs">--spacing: 0.2rem</code> on the
            panel.
          </p>
        </div>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Compact With User Menu
 * -----------------------------------------------------------------------------------------------*/
const CompactUserMenuBody = () => (
  <>
    <BrandHeader className="bg-green-600" letter="L" name="Lumen Labs" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Main navigation">
          <Sidebar.MenuItem id="search">
            <Sidebar.MenuIcon>
              <Icon icon="gravity-ui:magnifier" />
            </Sidebar.MenuIcon>
            <Sidebar.MenuLabel>Search</Sidebar.MenuLabel>
            <Sidebar.MenuChip>
              <ShortcutKbd>K</ShortcutKbd>
            </Sidebar.MenuChip>
          </Sidebar.MenuItem>
          {renderItems([
            {current: true, icon: "gravity-ui:house", id: "home", label: "Home"},
            {icon: "gravity-ui:bell", id: "updates", label: "Updates"},
            {icon: "gravity-ui:compass", id: "discover", label: "Discover"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Collections</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Collections" defaultExpandedKeys={["reading-list"]}>
          {renderItems([
            {
              children: [
                {icon: "gravity-ui:file-text", id: "rl-articles", label: "Saved articles"},
                {icon: "gravity-ui:picture", id: "rl-moodboard", label: "Moodboard"},
                {icon: "gravity-ui:bookmark", id: "rl-bookmarks", label: "Bookmarks"},
              ],
              icon: "gravity-ui:book-open",
              id: "reading-list",
              label: "Reading list",
            },
            {icon: "gravity-ui:persons", id: "research-team", label: "Research team"},
          ])}
          <Sidebar.MenuItem id="add-collection">
            <Sidebar.MenuIcon>
              <Icon icon="gravity-ui:plus" />
            </Sidebar.MenuIcon>
            <Sidebar.MenuLabel className="text-muted">New collection</Sidebar.MenuLabel>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Separator />
    <Sidebar.Footer className="px-2 pt-0 pb-2">
      <UserMenuTrigger avatar={<UserAvatar name="Maya Chen" src={AVATAR_A} />} name="Maya" />
    </Sidebar.Footer>
  </>
);

export const CompactWithUserMenu: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar style={COMPACT}>
        <CompactUserMenuBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <CompactUserMenuBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Home"}]} />
        <div className="p-6">
          <p className="text-muted">
            Compact navigation with an account menu in the footer, tightened with{" "}
            <code className="rounded bg-default px-1 py-0.5 text-xs">--spacing: 0.2rem</code>.
          </p>
        </div>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Inset Variant
 * -----------------------------------------------------------------------------------------------*/
const WorkspaceHeader = ({name, plan}: {name: string; plan: string}) => (
  <Sidebar.Header>
    <div className="flex items-center gap-3 px-1 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
        <Icon className="size-4 text-background" icon="gravity-ui:cube" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm leading-tight font-semibold text-foreground">{name}</span>
        <span className="text-xs leading-tight text-muted">{plan}</span>
      </div>
    </div>
  </Sidebar.Header>
);

const InsetBody = () => (
  <>
    <WorkspaceHeader name="Acorn Systems" plan="Business" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Build</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Build">
          {renderItems([
            {icon: "gravity-ui:terminal", id: "console", label: "Console"},
            {icon: "gravity-ui:cubes-3", id: "deployments", label: "Deployments"},
            {icon: "gravity-ui:book-open", id: "guides", label: "Guides"},
            {icon: "gravity-ui:gear", id: "config", label: "Configuration"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Separator />
      <Sidebar.Group>
        <Sidebar.GroupLabel>Workspaces</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Workspaces">
          {renderItems([
            {icon: "gravity-ui:palette", id: "brand-studio", label: "Brand Studio"},
            {icon: "gravity-ui:chart-pie", id: "revenue-ops", label: "Revenue Ops"},
            {icon: "gravity-ui:planet-earth", id: "field-trips", label: "Field Trips"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const InsetVariant: Story = {
  args: {collapsible: "offcanvas", variant: "inset"},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <InsetBody />
      </Sidebar>
      <Sidebar.Mobile>
        <InsetBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader
          crumbs={[
            {icon: "gravity-ui:terminal", label: "Getting started"},
            {label: "Environments"},
          ]}
        />
        <div className="grid gap-4 p-4 pt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-surface p-6" />
            <div className="rounded-xl border bg-surface p-6" />
            <div className="rounded-xl border bg-surface p-6" />
          </div>
          <div className="min-h-[50vh] rounded-xl border bg-surface p-6" />
        </div>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Floating Variant
 * -----------------------------------------------------------------------------------------------*/
const simpleNav: NavItem[] = [
  {icon: "gravity-ui:house", id: "overview", label: "Overview"},
  {icon: "gravity-ui:receipt", id: "invoices", label: "Invoices"},
  {icon: "gravity-ui:list-check", id: "tasks", label: "Tasks"},
  {icon: "gravity-ui:chart-column", id: "reports", label: "Reports"},
  {icon: "gravity-ui:persons", id: "people", label: "People"},
  {icon: "gravity-ui:gear", id: "settings", label: "Settings"},
];

const FloatingBody = () => (
  <>
    <BrandHeader letter="P" name="Parcel" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Navigation">{renderItems(simpleNav)}</Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const FloatingVariant: Story = {
  args: {collapsible: "offcanvas", variant: "floating"},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <FloatingBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <FloatingBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Overview"}]} />
        <MainBody>A detached panel with rounded corners and an elevated shadow.</MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Right Side
 * -----------------------------------------------------------------------------------------------*/
export const RightSide: Story = {
  args: {side: "right"},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Home"}]} />
        <MainBody>
          The panel is docked on the right. Below 768px the sheet slides in from the right edge.
        </MainBody>
      </Sidebar.Main>
      <Sidebar>
        <DefaultSidebarBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <DefaultSidebarBody isMobile />
      </Sidebar.Mobile>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Collapsible
 * -----------------------------------------------------------------------------------------------*/
const collapsibleNav: NavItem[] = [
  {current: true, icon: "gravity-ui:house", id: "overview", label: "Overview"},
  {icon: "gravity-ui:receipt", id: "invoices", label: "Invoices"},
  {chip: <NewChip />, icon: "gravity-ui:list-check", id: "tasks", label: "Tasks"},
  {icon: "gravity-ui:chart-column", id: "reports", label: "Reports"},
  {icon: "gravity-ui:persons", id: "people", label: "People"},
  {icon: "gravity-ui:gear", id: "settings", label: "Settings"},
];

const CollapsibleBody = () => (
  <>
    <BrandHeader letter="P" name="Parcel" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Navigation">{renderItems(collapsibleNav)}</Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const Collapsible: Story = {
  args: {collapsible: "icon"},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <CollapsibleBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <CollapsibleBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Overview"}]} />
        <MainBody>
          Use the rail edge or the trigger to collapse the panel to icons. Ctrl+B (⌘B on macOS)
          toggles it too.
        </MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Icon Only
 * -----------------------------------------------------------------------------------------------*/
const IconRailItem = ({icon, id, label}: {icon: string; id: string; label: string}) => (
  <Sidebar.MenuItem
    aria-label={label}
    href="#"
    id={id}
    textValue={label}
    tooltipProps={{content: label}}
  >
    <Sidebar.MenuItemContent className="justify-center gap-0 p-2.5">
      <Sidebar.MenuIcon>
        <Icon icon={icon} />
      </Sidebar.MenuIcon>
    </Sidebar.MenuItemContent>
  </Sidebar.MenuItem>
);

export const IconOnly: Story = {
  args: {collapsible: "none"},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar className="[--sidebar-width:56px]">
        <Sidebar.Header className="items-center justify-center p-0 py-4">
          <Avatar className="size-8 shrink-0">
            <Avatar.Image alt="Theo Park" src={AVATAR_B} />
            <Avatar.Fallback>TP</Avatar.Fallback>
          </Avatar>
        </Sidebar.Header>
        <Sidebar.Content className="items-center justify-center px-1.5">
          <Sidebar.Group>
            <Sidebar.Menu aria-label="Navigation" className="items-center gap-1">
              {simpleNav.map((item) => (
                <IconRailItem key={item.id} icon={item.icon!} id={item.id} label={item.label} />
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer className="items-center justify-center p-0 py-4">
          <Sidebar.Menu aria-label="Footer actions" className="items-center gap-1">
            <IconRailItem icon="gravity-ui:circle-question" id="support" label="Support" />
          </Sidebar.Menu>
        </Sidebar.Footer>
      </Sidebar>
      <Sidebar.Main>
        <div className="flex flex-col px-10 py-6">
          <h1 className="text-lg font-semibold text-foreground">Overview</h1>
          <p className="text-muted">A permanently narrow rail; hover an icon to see its name.</p>
        </div>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Groups
 * -----------------------------------------------------------------------------------------------*/
const GroupsBody = () => (
  <>
    <BrandHeader letter="P" name="Parcel" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Operations</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Operations">
          {renderItems([
            {icon: "gravity-ui:house", id: "overview", label: "Overview"},
            {icon: "gravity-ui:chart-line", id: "metrics", label: "Metrics"},
            {icon: "gravity-ui:shopping-cart", id: "orders", label: "Orders"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Separator />
      <Sidebar.Group>
        <Sidebar.GroupLabel>Account</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Account">
          {renderItems([
            {icon: "gravity-ui:gear", id: "general", label: "General"},
            {icon: "gravity-ui:persons", id: "members", label: "Members"},
            {icon: "gravity-ui:bell", id: "alerts", label: "Alerts"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const WithGroups: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <GroupsBody />
      </Sidebar>
      <Sidebar.Mobile>
        <GroupsBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Overview"}]} />
        <MainBody>Content area</MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Collapsible Groups
 * -----------------------------------------------------------------------------------------------*/
const docsSections = [
  {children: ["Installation", "Project setup", "Editor support"], title: "Introduction"},
  {
    children: ["Layouts", "Server actions", "Streaming", "Middleware", "Images", "Deploying"],
    title: "Guides",
  },
  {children: ["Components", "Hooks", "Utilities"], title: "Reference"},
];

const DocsBody = () => (
  <>
    <Sidebar.Header>
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent">
          <span className="text-xs font-bold text-white">K</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm leading-tight font-semibold text-foreground">Kit Docs</span>
          <span className="text-xs leading-tight text-muted">v2.4.1</span>
        </div>
      </div>
    </Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Menu
        aria-label="Docs navigation"
        defaultExpandedKeys={["Guides"]}
        showGuideLines="hover"
      >
        {docsSections.map((section) => (
          <Sidebar.MenuSection key={section.title}>
            <Sidebar.MenuHeader>{section.title}</Sidebar.MenuHeader>
            <Sidebar.MenuItem id={section.title}>
              <Sidebar.MenuLabel>
                {section.title}
                <Sidebar.MenuTrigger>
                  <Sidebar.MenuIndicator />
                </Sidebar.MenuTrigger>
              </Sidebar.MenuLabel>
              <Sidebar.Submenu>
                {section.children.map((child) => (
                  <Sidebar.MenuItem
                    key={child}
                    href="#"
                    id={`${section.title}-${child}`}
                    isCurrent={child === "Server actions"}
                  >
                    <Sidebar.MenuLabel>{child}</Sidebar.MenuLabel>
                    <MoreActions label={child} />
                  </Sidebar.MenuItem>
                ))}
              </Sidebar.Submenu>
            </Sidebar.MenuItem>
          </Sidebar.MenuSection>
        ))}
      </Sidebar.Menu>
    </Sidebar.Content>
  </>
);

export const CollapsibleGroups: Story = {
  args: {collapsible: "offcanvas"},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <DocsBody />
      </Sidebar>
      <Sidebar.Mobile>
        <DocsBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader
          crumbs={[{icon: "gravity-ui:book-open", label: "Guides"}, {label: "Server actions"}]}
        />
        <MainBody>Article content. Hide the navigation with the trigger button.</MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Avatar
 * -----------------------------------------------------------------------------------------------*/
const AvatarBody = () => (
  <>
    <Sidebar.Header>
      {/* A 32px avatar sits centred on the rail without the row's `px-1`. */}
      <div className="flex items-center gap-3 px-1 py-2 transition-[padding] duration-200 group-data-[collapsible=icon]:group-data-[state=collapsed]:px-0 motion-reduce:transition-none">
        <Avatar className="size-8 shrink-0">
          <Avatar.Image alt="Theo Park" src={AVATAR_B} />
          <Avatar.Fallback>TP</Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-col" data-sidebar="label">
          <span className="text-sm leading-tight font-medium text-foreground">Theo Park</span>
          <span className="text-xs leading-tight text-muted">theo@parcel.dev</span>
        </div>
      </div>
    </Sidebar.Header>
    <Sidebar.Separator />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Navigation">{renderItems(collapsibleNav)}</Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Separator />
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Account links">
        {renderItems([
          {icon: "gravity-ui:circle-question", id: "support", label: "Support center"},
          {icon: "gravity-ui:arrow-right-from-square", id: "sign-out", label: "Sign out"},
        ])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const WithAvatar: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar className="group">
        <AvatarBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <AvatarBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Overview"}]} />
        <MainBody>Content area</MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Pages
 * -----------------------------------------------------------------------------------------------*/
const subPages = [
  {
    icon: "gravity-ui:house",
    items: [
      {current: true, icon: "gravity-ui:file-text", id: "digest", label: "Digest"},
      {icon: "gravity-ui:clock", id: "timeline", label: "Timeline"},
    ],
    label: "Home",
    value: "home",
  },
  {
    icon: "gravity-ui:chart-column",
    items: [
      {current: true, icon: "gravity-ui:chart-line", id: "trends", label: "Trends"},
      {icon: "gravity-ui:globe", id: "regions", label: "Regions"},
    ],
    label: "Insights",
    value: "insights",
  },
  {
    icon: "gravity-ui:gear",
    items: [
      {current: true, icon: "gravity-ui:person", id: "profile", label: "Profile"},
      {icon: "gravity-ui:persons", id: "members", label: "Members"},
      {icon: "gravity-ui:credit-card", id: "plan", label: "Plan"},
    ],
    label: "Settings",
    value: "settings",
  },
];

const PagesRootMenu = () => {
  const {setActiveValue} = useSidebarPages();

  return (
    <Sidebar.Group>
      <Sidebar.Menu aria-label="Main navigation">
        {subPages.map((page) => (
          <Sidebar.MenuItem
            key={page.value}
            id={page.value}
            onAction={() => setActiveValue(page.value)}
          >
            <Sidebar.MenuIcon>
              <Icon icon={page.icon} />
            </Sidebar.MenuIcon>
            <Sidebar.MenuLabel>{page.label}</Sidebar.MenuLabel>
          </Sidebar.MenuItem>
        ))}
      </Sidebar.Menu>
    </Sidebar.Group>
  );
};

const PagesSubMenu = ({page}: {page: (typeof subPages)[number]}) => {
  const {setActiveValue} = useSidebarPages();

  return (
    <Sidebar.Group>
      <Sidebar.Menu aria-label={`${page.label} navigation`}>
        <Sidebar.MenuItem
          aria-label="Back to main menu"
          closeMobileOnAction={false}
          id={`${page.value}-back`}
          onAction={() => setActiveValue("main")}
        >
          <Sidebar.MenuIcon>
            <Icon icon="gravity-ui:arrow-left" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuLabel>Back</Sidebar.MenuLabel>
        </Sidebar.MenuItem>
        <Sidebar.Separator />
        {renderItems(page.items)}
      </Sidebar.Menu>
    </Sidebar.Group>
  );
};

const PagesBody = () => (
  <>
    <BrandHeader letter="N" name="Northwind" />
    <Sidebar.Content>
      <Sidebar.Pages defaultValue="main">
        <Sidebar.Page value="main">
          <PagesRootMenu />
        </Sidebar.Page>
        {subPages.map((page) => (
          <Sidebar.Page key={page.value} value={page.value}>
            <PagesSubMenu page={page} />
          </Sidebar.Page>
        ))}
      </Sidebar.Pages>
    </Sidebar.Content>
  </>
);

export const Pages: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <PagesBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <PagesBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <div className="flex items-center gap-3 p-4">
          <Sidebar.Trigger />
          <span className="text-sm font-semibold">Workspace</span>
        </div>
        <div className="p-6">
          <p className="text-muted">
            Choose <strong>Home</strong>, <strong>Insights</strong> or <strong>Settings</strong> to
            slide to its page, then <strong>Back</strong> to return. Each page keeps its state while
            hidden.
          </p>
        </div>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Meeting Notes
 * -----------------------------------------------------------------------------------------------*/
const MEETING_STYLE = {
  "--radius": "0.2rem",
  "--spacing": "0.2rem",
  "--text-sm": "0.80rem",
  "--text-xs": "0.70rem",
} as React.CSSProperties;

type PaletteEntry = {avatar?: string; detail?: string; icon?: string; label: string};

const paletteGroups: Array<{items: PaletteEntry[]; title: string}> = [
  {
    items: [
      {icon: "gravity-ui:person", label: "Personal"},
      {icon: "gravity-ui:folder", label: "Product guild"},
    ],
    title: "Folders",
  },
  {
    items: [
      {detail: "harbor.co", icon: "gravity-ui:briefcase", label: "Harbor & Co"},
      {detail: "mosaic.app", icon: "gravity-ui:briefcase", label: "Mosaic"},
      {detail: "tandem.io", icon: "gravity-ui:briefcase", label: "Tandem"},
      {detail: "vela.dev", icon: "gravity-ui:briefcase", label: "Vela"},
    ],
    title: "Companies",
  },
  {
    items: [
      {avatar: "bg-rose-500", detail: "dana@mosaic.app", label: "Dana Ruiz"},
      {avatar: "bg-emerald-500", detail: "felix@vela.dev", label: "Felix Moreau"},
    ],
    title: "People",
  },
];

/** Search palette of the Meeting Notes story, built with the Pro Command component. */
const CommandPalette = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => (
  <Command>
    <Command.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Command.Container>
        <Command.Dialog>
          <Command.InputGroup>
            <Command.InputGroup.Input placeholder="Search people, folders or companies" />
            <Command.InputGroup.ClearButton />
            <Command.InputGroup.Suffix>
              <Kbd className="text-xs">
                <Kbd.Content>Esc</Kbd.Content>
              </Kbd>
            </Command.InputGroup.Suffix>
          </Command.InputGroup>
          <Command.List>
            {paletteGroups.map((group) => (
              <Command.Group key={group.title} heading={group.title}>
                {group.items.map((item) => (
                  <Command.Item key={item.label} textValue={item.label}>
                    {item.avatar ? (
                      <div
                        className={`flex size-6 items-center justify-center rounded-full ${item.avatar}`}
                      >
                        <span className="text-xs font-bold text-white">{item.label[0]}</span>
                      </div>
                    ) : (
                      <Icon icon={item.icon!} />
                    )}
                    <span>{item.label}</span>
                    {item.detail ? <span className="text-sm text-muted">{item.detail}</span> : null}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command.Dialog>
      </Command.Container>
    </Command.Backdrop>
  </Command>
);

const MeetingNotesBody = ({onSearch}: {onSearch: () => void}) => (
  <>
    <Sidebar.Content className="pt-3">
      <Sidebar.Group>
        <div className="pb-2">
          <Button
            className="w-full justify-start gap-2 text-sm text-muted"
            size="sm"
            variant="outline"
            onPress={onSearch}
          >
            <Icon className="size-3.5" icon="gravity-ui:magnifier" />
            <span className="flex-1 text-left text-xs">Search</span>
            <ShortcutKbd className="bg-transparent text-xs leading-none">K</ShortcutKbd>
          </Button>
        </div>
        <Sidebar.Menu aria-label="Main navigation" defaultExpandedKeys={["threads"]}>
          {renderItems([
            {current: true, icon: "gravity-ui:house", id: "home", label: "Home"},
            {icon: "gravity-ui:persons", id: "shared", label: "Shared with me"},
            {
              children: [
                {
                  chip: <TimeChip>2m</TimeChip>,
                  id: "t-kickoff",
                  label: "Kickoff notes for the Q3 la...",
                },
                {chip: <TimeChip>18m</TimeChip>, id: "t-pricing", label: "Pricing page review"},
                {chip: <TimeChip>2h</TimeChip>, id: "t-onboarding", label: "Onboarding flow audit"},
                {chip: <TimeChip>5h</TimeChip>, id: "t-hiring", label: "Hiring sync follow-ups"},
              ],
              icon: "gravity-ui:comment",
              id: "threads",
              label: "Threads",
            },
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Folders</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Folders" defaultExpandedKeys={["my-notes"]}>
          {renderItems([
            {
              children: [{icon: "gravity-ui:person", id: "personal", label: "Personal"}],
              icon: "gravity-ui:folder",
              id: "my-notes",
              label: "My notes",
            },
          ])}
          <Sidebar.MenuItem href="#" id="product-guild">
            <Sidebar.MenuIcon>
              <div className="flex size-4 items-center justify-center rounded bg-indigo-600">
                <Icon className="size-2.5 text-white" icon="gravity-ui:star-fill" />
              </div>
            </Sidebar.MenuIcon>
            <Sidebar.MenuLabel>Product guild</Sidebar.MenuLabel>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem id="add-folder">
            <Sidebar.MenuIcon>
              <Icon icon="gravity-ui:plus" />
            </Sidebar.MenuIcon>
            <Sidebar.MenuLabel className="text-muted">New folder</Sidebar.MenuLabel>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer className="gap-0 px-2 pb-2">
      <div className="flex items-center gap-0.5 py-1 text-muted">
        <Button isIconOnly aria-label="Notes" size="sm" variant="ghost">
          <Icon icon="gravity-ui:file-text" />
        </Button>
        <Button isIconOnly aria-label="Contacts" size="sm" variant="ghost">
          <Icon icon="gravity-ui:person" />
        </Button>
        <Button isIconOnly aria-label="Groups" size="sm" variant="ghost">
          <Icon icon="gravity-ui:persons" />
        </Button>
      </div>
      <Sidebar.Separator />
      <div>
        <UserMenuTrigger
          className="gap-2.5 px-1.5"
          name="Nadia"
          avatar={
            <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-black">
              <Icon className="size-3/5 text-white" icon="gravity-ui:sparkles" />
            </div>
          }
        />
      </div>
    </Sidebar.Footer>
  </>
);

const MeetingNotesDemo = (args: Sidebar["ProviderProps"]) => {
  const [isPaletteOpen, setPaletteOpen] = React.useState(false);
  const openPalette = () => setPaletteOpen(true);

  // Cmd/Ctrl+K opens the search palette, like the Pro demo.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Sidebar.Provider {...args}>
      <Sidebar style={MEETING_STYLE}>
        <MeetingNotesBody onSearch={openPalette} />
      </Sidebar>
      <Sidebar.Mobile>
        <MeetingNotesBody onSearch={openPalette} />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:house", label: "Home"}]} />
        <MainBody>
          A notes workspace with search, folders and an account menu. The panel uses offcanvas
          collapse.
        </MainBody>
      </Sidebar.Main>
      <CommandPalette isOpen={isPaletteOpen} onOpenChange={setPaletteOpen} />
    </Sidebar.Provider>
  );
};

export const MeetingNotes: Story = {
  args: {collapsible: "offcanvas"},
  render: (args) => <MeetingNotesDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Agent Hub
 * -----------------------------------------------------------------------------------------------*/
const AgentHubBody = () => {
  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-600">
              <Icon className="size-3.5 text-white" icon="gravity-ui:face-robot" />
            </div>
            <span className="text-sm font-semibold text-foreground" data-sidebar="label">
              Relay
            </span>
          </div>
          <div className="flex items-center" data-sidebar="label">
            <button
              aria-label="New agent"
              className="flex items-center gap-0.5 rounded-md p-1 text-foreground hover:bg-default"
              type="button"
            >
              <Icon className="size-4" icon="gravity-ui:pencil-to-square" />
            </button>
          </div>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label="Main navigation">
            {renderItems([{icon: "gravity-ui:square-plus", id: "new-agent", label: "New agent"}])}
            <Sidebar.MenuItem id="search">
              <Sidebar.MenuIcon>
                <Icon icon="gravity-ui:magnifier" />
              </Sidebar.MenuIcon>
              <Sidebar.MenuLabel>Search</Sidebar.MenuLabel>
              <Sidebar.MenuChip>
                <ShortcutKbd>K</ShortcutKbd>
              </Sidebar.MenuChip>
            </Sidebar.MenuItem>
            {renderItems([
              {current: true, icon: "gravity-ui:house", id: "home", label: "Home"},
              {icon: "gravity-ui:bell", id: "activity", label: "Activity"},
              {icon: "gravity-ui:shopping-bag", id: "store", label: "Agent store"},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Recent chats</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Recent chats">
            {renderItems([
              {
                icon: "gravity-ui:comment",
                id: "c-cache",
                label: "Speed up cache warmup",
                withActions: true,
              },
              {
                icon: "gravity-ui:comment",
                id: "c-webhooks",
                label: "Retry failed webhooks",
                withActions: true,
              },
              {
                icon: "gravity-ui:comment",
                id: "c-changelog",
                label: "Draft the changelog",
                withActions: true,
              },
              {
                icon: "gravity-ui:comment",
                id: "c-review",
                label: "Review PR #1290",
                withActions: true,
              },
              {
                icon: "gravity-ui:comment",
                id: "c-schema",
                label: "Plan schema migration",
                withActions: true,
              },
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>
            <span className="flex items-center gap-2">
              Agents
              <Chip size="sm" variant="soft">
                Beta
              </Chip>
            </span>
          </Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Agents">
            {renderItems([
              {icon: "gravity-ui:code", id: "a-builder", label: "Builder"},
              {icon: "gravity-ui:eye", id: "a-critic", label: "Critic"},
              {icon: "gravity-ui:pencil", id: "a-editor", label: "Editor"},
              {icon: "gravity-ui:plus", id: "a-add", label: "Add agent", muted: true},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.GroupLabel>
            <span className="flex flex-1 items-center justify-between">
              Workspaces
              <Dropdown>
                <Dropdown.Trigger
                  aria-label="Workspace actions"
                  className="-mr-1 flex size-6 items-center justify-center rounded-md text-muted hover:bg-default"
                >
                  <Icon className="size-4" icon="gravity-ui:ellipsis" />
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu aria-label="Workspace actions">
                    <Dropdown.Item id="new-workspace">New workspace</Dropdown.Item>
                    <Dropdown.Item id="manage">Manage workspaces</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </span>
          </Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Workspaces" defaultExpandedKeys={["ws-mine"]}>
            {renderItems([
              {
                children: [
                  {
                    current: true,
                    icon: "gravity-ui:code",
                    id: "ws-api",
                    label: "Payments API",
                    withActions: true,
                  },
                  {
                    icon: "gravity-ui:smartphone",
                    id: "ws-ios",
                    label: "iOS client",
                    withActions: true,
                  },
                  {
                    icon: "gravity-ui:list-check",
                    id: "ws-board",
                    label: "Roadmap",
                    withActions: true,
                  },
                ],
                icon: "gravity-ui:person",
                id: "ws-mine",
                label: "Mine",
              },
              {
                children: [
                  {
                    icon: "gravity-ui:globe",
                    id: "ws-site",
                    label: "Marketing site",
                    withActions: true,
                  },
                ],
                icon: "gravity-ui:persons",
                id: "ws-shared",
                label: "Shared",
              },
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
        <Sidebar.Separator />
        <Sidebar.Group>
          <Sidebar.GroupLabel>Apps</Sidebar.GroupLabel>
          <Sidebar.Menu aria-label="Apps">
            {renderItems([
              {icon: "gravity-ui:file-text", id: "app-docs", label: "Docs"},
              {icon: "gravity-ui:calendar", id: "app-calendar", label: "Calendar"},
            ])}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Separator />
      <Sidebar.Footer className="gap-0">
        <RailButtonRow>
          <RailShrink>
            <Button
              className="flex h-9 w-full gap-2 bg-surface text-sm text-muted shadow-surface"
              size="sm"
              variant="tertiary"
            >
              <Icon className="size-4" icon="gravity-ui:comment" />
              <span>New chat</span>
              <ShortcutKbd>N</ShortcutKbd>
            </Button>
          </RailShrink>
          <Button isIconOnly aria-label="Compose" className="shrink-0" size="sm" variant="tertiary">
            <Icon className="size-4 text-muted" icon="gravity-ui:pencil" />
          </Button>
        </RailButtonRow>
        <div className="px-2 pb-2 transition-[padding] duration-200 motion-reduce:transition-none [.sidebar[data-collapsible=icon][data-state=collapsed]_&]:px-0">
          <UserMenuTrigger avatar={<UserAvatar name="Owen Blake" src={AVATAR_C} />} name="Owen" />
        </div>
      </Sidebar.Footer>
    </>
  );
};

export const AgentHub: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar style={COMPACT}>
        <AgentHubBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <AgentHubBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:code", label: "Payments API"}]} />
        <MainBody>
          An agent-centric layout: dense spacing, workspaces with nested projects, recent chats and
          an account menu.
        </MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Agent Workspace
 * -----------------------------------------------------------------------------------------------*/
type Task = {age?: string; label: string; running?: boolean};

const repositories: Array<{name: string; tasks: Task[]}> = [
  {
    name: "tidewave/core",
    tasks: [
      {age: "now", label: "Rename billing account fields", running: true},
      {age: "9m", label: "Keyboard shortcuts for the ed..."},
      {age: "41m", label: "Group by owner in task view"},
      {age: "2h", label: "Clearer sync error messages", running: true},
      {label: "Migrate to the new auth hook"},
      {label: "Stabilize snapshot tests"},
      {age: "11h", label: "Find the flaky e2e culprit"},
    ],
  },
  {
    name: "tidewave/web",
    tasks: [
      {age: "1h", label: "Responsive pricing tables", running: true},
      {age: "4h", label: "Automatic preview deploys", running: true},
      {label: "Speed up local dev server"},
      {age: "2d", label: "Audit image loading on docs"},
      {label: "Localized landing pages"},
    ],
  },
  {
    name: "tidewave/admin",
    tasks: [
      {age: "6h", label: "Natural language search page", running: true},
      {label: "Retry policy for background jobs"},
      {label: "Usage chart for admins only"},
    ],
  },
];

const TaskStatus = ({running}: {running?: boolean}) =>
  running ? (
    <Icon icon="gravity-ui:circle-dashed" />
  ) : (
    <span className="flex size-4 items-center justify-center">
      <span className="size-1.5 rounded-full" style={{backgroundColor: "var(--color-muted)"}} />
    </span>
  );

const WorkspaceBody = () => (
  <>
    <Sidebar.Header>
      <Sidebar.Menu aria-label="Top actions" className="px-1 py-2">
        <Sidebar.MenuItem id="new-task">
          <Sidebar.MenuIcon>
            <Icon icon="gravity-ui:square-plus" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuLabel>New task</Sidebar.MenuLabel>
          <Sidebar.MenuChip>
            <ShortcutKbd>N</ShortcutKbd>
          </Sidebar.MenuChip>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem isCurrent href="#" id="catalog">
          <Sidebar.MenuIcon>
            <Icon icon="gravity-ui:shopping-bag" />
          </Sidebar.MenuIcon>
          <Sidebar.MenuLabel>Catalog</Sidebar.MenuLabel>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>
    <Sidebar.Content>
      {repositories.map((repo) => (
        <Sidebar.Group key={repo.name}>
          <Sidebar.GroupLabel>
            <span className="flex flex-1 items-center justify-between">
              {repo.name}
              <Tooltip>
                <Tooltip.Trigger>
                  <button
                    aria-label={`New task in ${repo.name}`}
                    className="-mr-1 flex size-5 items-center justify-center rounded-md text-muted hover:bg-default"
                    type="button"
                  >
                    <Icon className="size-3.5" icon="gravity-ui:plus" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>New task</Tooltip.Content>
              </Tooltip>
            </span>
          </Sidebar.GroupLabel>
          <Sidebar.Menu aria-label={repo.name}>
            {repo.tasks.map((task) => (
              <Sidebar.MenuItem key={task.label} href="#" id={`${repo.name}-${task.label}`}>
                <Sidebar.MenuIcon>
                  <TaskStatus running={task.running} />
                </Sidebar.MenuIcon>
                <Sidebar.MenuLabel>{task.label}</Sidebar.MenuLabel>
                {task.age ? (
                  <Sidebar.MenuChip>
                    <TimeChip>{task.age}</TimeChip>
                  </Sidebar.MenuChip>
                ) : null}
                <Sidebar.MenuActions>
                  <Sidebar.MenuAction aria-label={`Archive ${task.label}`}>
                    <Icon className="size-3.5" icon="gravity-ui:archive" />
                  </Sidebar.MenuAction>
                  <Sidebar.MenuAction aria-label={`Delete ${task.label}`}>
                    <Icon className="size-3.5" icon="gravity-ui:trash-bin" />
                  </Sidebar.MenuAction>
                </Sidebar.MenuActions>
              </Sidebar.MenuItem>
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
      ))}
    </Sidebar.Content>
    <Sidebar.Footer className="px-2 pt-0 pb-2">
      <Dropdown>
        <Dropdown.Trigger className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none hover:bg-default">
          <UserAvatar name="Lena Ortiz" src={AVATAR_A} />
          <div className="flex min-w-0 flex-col" data-sidebar="label">
            <span className="truncate text-sm leading-tight font-medium text-foreground">
              Lena Ortiz
            </span>
            <span className="truncate text-xs leading-tight text-muted">Tidewave</span>
          </div>
          <div className="ml-auto flex items-center gap-1" data-sidebar="label">
            <span className="flex size-6 items-center justify-center rounded-md text-muted hover:text-foreground">
              <Icon className="size-3.5" icon="gravity-ui:gear" />
            </span>
          </div>
        </Dropdown.Trigger>
        <Dropdown.Popover placement="top start">
          <Dropdown.Menu aria-label="Account">
            <Dropdown.Item id="settings">Settings</Dropdown.Item>
            <Dropdown.Item id="sign-out">Sign out</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Sidebar.Footer>
  </>
);

export const AgentWorkspace: Story = {
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar style={COMPACT}>
        <WorkspaceBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <WorkspaceBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader crumbs={[{icon: "gravity-ui:code", label: "tidewave/core"}]} />
        <MainBody>
          Agent tasks grouped by repository, in the style of AI coding tools. Hover a task to
          archive or delete it.
        </MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Reduced Motion
 * -----------------------------------------------------------------------------------------------*/
const reducedNav: NavItem[] = [
  {current: true, icon: "gravity-ui:house", id: "overview", label: "Overview"},
  {
    children: [
      {id: "insights-trends", label: "Trends"},
      {id: "insights-reports", label: "Reports"},
      {id: "insights-exports", label: "Exports"},
    ],
    icon: "gravity-ui:chart-column",
    id: "insights",
    label: "Insights",
  },
  {chip: <NewChip />, icon: "gravity-ui:list-check", id: "tasks", label: "Tasks"},
  {
    children: [
      {id: "settings-general", label: "General"},
      {id: "settings-security", label: "Security"},
    ],
    icon: "gravity-ui:gear",
    id: "settings",
    label: "Settings",
  },
];

const ReducedMotionBody = () => (
  <>
    <BrandHeader letter="P" name="Parcel" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Navigation" defaultExpandedKeys={["insights"]}>
          {renderItems(reducedNav)}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const ReducedMotion: Story = {
  args: {reduceMotion: true},
  render: (args) => (
    <Sidebar.Provider {...args}>
      <Sidebar>
        <ReducedMotionBody />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <ReducedMotionBody />
      </Sidebar.Mobile>
      <Sidebar.Main>
        <MainHeader
          crumbs={[{icon: "gravity-ui:chart-column", label: "Insights"}, {label: "Reports"}]}
        />
        <MainBody>
          <code className="rounded bg-default px-1 py-0.5 text-xs">reduceMotion</code> is on, so
          nested sections open and close instantly.
        </MainBody>
      </Sidebar.Main>
    </Sidebar.Provider>
  ),
};
