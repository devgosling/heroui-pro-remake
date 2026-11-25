import type {Meta, StoryObj} from "@storybook/react";
import type {CSSProperties, ReactNode} from "react";

import {
  Avatar,
  Breadcrumbs,
  Button,
  Chip,
  Disclosure,
  DisclosureGroup,
  Dropdown,
  Kbd,
  SearchField,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {KPI} from "../kpi";
import {Navbar} from "../navbar";
import {PressableFeedback} from "../pressable-feedback";
import {Segment} from "../segment";
import {Sidebar} from "../sidebar";

import {AppLayout} from "./index";

const meta = {
  argTypes: {
    asideMobile: {control: {type: "select"}, options: ["hidden", "sheet"]},
    asideToggleShortcut: {control: "text"},
    defaultAsideOpen: {control: "boolean"},
    defaultSidebarOpen: {control: "boolean"},
    reduceMotion: {control: "boolean"},
    scrollMode: {control: {type: "select"}, options: ["page", "content"]},
    sidebarCollapsible: {control: {type: "select"}, options: ["icon", "offcanvas", "none"]},
    sidebarSide: {control: {type: "select"}, options: ["left", "right"]},
    sidebarVariant: {control: {type: "select"}, options: ["sidebar", "floating", "inset"]},
    toggleShortcut: {control: "text"},
  },
  component: AppLayout,
  parameters: {layout: "fullscreen"},
  title: "Pro/Navigation/AppLayout",
} satisfies Meta<typeof AppLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared story helpers
 * -----------------------------------------------------------------------------------------------*/
const AVATAR_A = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg";
const AVATAR_B = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg";
const AVATAR_C = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg";

type NavItem = {
  chip?: ReactNode;
  children?: NavItem[];
  current?: boolean;
  icon?: ReactNode;
  id: string;
  label: string;
  muted?: boolean;
};

const icon = (name: string) => <Icon icon={`gravity-ui:${name}`} />;

const renderItems = (items: NavItem[], options: {trigger?: boolean} = {}): ReactNode =>
  items.map((item) => (
    <Sidebar.MenuItem
      key={item.id}
      href={item.children ? undefined : "#"}
      id={item.id}
      isCurrent={item.current}
    >
      {item.icon ? <Sidebar.MenuIcon>{item.icon}</Sidebar.MenuIcon> : null}
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

const CountChip = ({children}: {children: ReactNode}) => (
  <span className="text-xs text-muted">{children}</span>
);

const ShortcutKbd = ({
  children,
  className = "text-xs",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <Kbd className={className}>
    <Kbd.Abbr keyValue="command" />
    <Kbd.Content>{children}</Kbd.Content>
  </Kbd>
);

const BrandHeader = ({
  className = "bg-accent",
  labelled = true,
  letter,
  name,
}: {
  className?: string;
  labelled?: boolean;
  letter: string;
  name: string;
}) => (
  <Sidebar.Header>
    <div className="flex items-center gap-3 px-1 py-2">
      <div className={`flex size-6 shrink-0 items-center justify-center rounded-md ${className}`}>
        <span className="text-sm font-bold text-white">{letter}</span>
      </div>
      <span
        className="text-sm font-semibold text-foreground"
        data-sidebar={labelled ? "label" : undefined}
      >
        {name}
      </span>
    </div>
  </Sidebar.Header>
);

/** `sidebar` prop: the desktop panel plus the mobile sheet with the same body. */
const withMobile = (
  body: (isMobile: boolean) => ReactNode,
  options: {rail?: boolean; style?: CSSProperties} = {},
) => (
  <>
    <Sidebar style={options.style}>
      {body(false)}
      {options.rail ? <Sidebar.Rail /> : null}
    </Sidebar>
    <Sidebar.Mobile>{body(true)}</Sidebar.Mobile>
  </>
);

type Crumb = {href?: string; icon?: string; label: string; wide?: boolean};

const Crumbs = ({items}: {items: Crumb[]}) => (
  <Breadcrumbs className="min-w-0">
    {items.map((crumb, index) => {
      const isLast = index === items.length - 1;
      const parentClassName = crumb.wide
        ? "min-w-0 text-muted hidden md:flex"
        : "min-w-0 text-muted";

      return (
        <Breadcrumbs.Item
          key={crumb.label}
          className={isLast ? "min-w-0 font-semibold" : parentClassName}
          href={isLast ? undefined : (crumb.href ?? "#")}
        >
          <span className="flex min-w-0 items-center gap-2 overflow-hidden">
            {crumb.icon ? <Icon className="size-4" icon={`gravity-ui:${crumb.icon}`} /> : null}
            <span className="truncate">{crumb.label}</span>
          </span>
        </Breadcrumbs.Item>
      );
    })}
  </Breadcrumbs>
);

const IconItem = ({label, name}: {label: string; name: string}) => (
  <Navbar.Item aria-label={label}>
    <Icon className="size-4" icon={`gravity-ui:${name}`} />
  </Navbar.Item>
);

const InitialsAvatar = ({initials}: {initials: ReactNode}) => (
  <Avatar className="size-6" color="success" variant="soft">
    <Avatar.Fallback className="text-xs font-semibold">{initials}</Avatar.Fallback>
  </Avatar>
);

const PhotoAvatar = ({
  className = "size-6",
  name,
  src,
}: {
  className?: string;
  name: string;
  src: string;
}) => (
  <Avatar className={className}>
    <Avatar.Image alt={name} src={src} />
    <Avatar.Fallback>{name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
  </Avatar>
);

const AccountMenu = ({avatar}: {avatar: ReactNode}) => (
  <Dropdown>
    <Button isIconOnly aria-label="Account menu" variant="ghost">
      {avatar}
    </Button>
    <Dropdown.Popover placement="bottom end">
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

/** The navbar used by most demos: toggles, a breadcrumb trail and icon actions. */
const AppNavbar = ({actions, crumbs}: {actions?: ReactNode; crumbs?: Crumb[]}) => (
  <Navbar maxWidth="full">
    <Navbar.Header>
      <AppLayout.MenuToggle />
      <Sidebar.Trigger />
      {crumbs ? <Crumbs items={crumbs} /> : null}
      <Navbar.Spacer />
      <Navbar.Content>
        {actions ?? (
          <>
            <IconItem label="Search" name="magnifier" />
            <IconItem label="Notifications" name="bell" />
            <Navbar.Separator />
            <AccountMenu avatar={<InitialsAvatar initials="MR" />} />
          </>
        )}
      </Navbar.Content>
    </Navbar.Header>
  </Navbar>
);

const PageIntro = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="p-6">
    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
    <p className="mt-2 text-sm text-muted">{children}</p>
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Default (Usage)
 * -----------------------------------------------------------------------------------------------*/
const usageNav: NavItem[] = [
  {current: true, icon: icon("house"), id: "home", label: "Home"},
  {
    children: [
      {id: "reports-summary", label: "Summary"},
      {id: "reports-revenue", label: "Revenue"},
      {id: "reports-retention", label: "Retention"},
    ],
    icon: icon("chart-column"),
    id: "reports",
    label: "Reports",
  },
  {chip: <NewChip />, icon: icon("list-check"), id: "tasks", label: "Tasks"},
  {
    children: [
      {id: "preferences-profile", label: "Profile"},
      {id: "preferences-billing", label: "Billing"},
    ],
    icon: icon("gear"),
    id: "preferences",
    label: "Preferences",
  },
];

const UsageSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader letter="O" name="Orbit" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Workspace" defaultExpandedKeys={["reports"]}>
          {renderItems(usageNav, {trigger: isMobile})}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Account links">
        {renderItems([
          {icon: icon("circle-question"), id: "support", label: "Support center"},
          {icon: icon("arrow-right-from-square"), id: "sign-out", label: "Sign out"},
        ])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const Default: Story = {
  render: (args) => (
    <AppLayout
      {...args}
      navbar={<AppNavbar crumbs={[{icon: "house", label: "Home"}]} />}
      sidebar={withMobile(UsageSidebarBody, {rail: true})}
    >
      <PageIntro title="Home">
        The sidebar spans the whole viewport height, while the navbar and the page content share the
        column on its right. Narrow the window below 768px to move the sidebar into a sheet.
      </PageIntro>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Inset Dashboard
 * -----------------------------------------------------------------------------------------------*/
const series = (values: number[]) => values.map((value, index) => ({index, value}));

const lessons = [
  {date: "3d", plays: "9,312", title: "Sketching interfaces by hand", tutor: "Mira Lind"},
  {date: "5d", plays: "6,045", title: "Color systems that scale", tutor: "Otis Baker"},
  {date: "1w", plays: "14,870", title: "Motion with purpose", tutor: "Ines Duarte"},
  {date: "2w", plays: "3,208", title: "Typography for small screens", tutor: "Rae Collins"},
];

const InsetDashboardSidebarBody = (isMobile: boolean) => (
  <>
    <Sidebar.Header>
      <Dropdown>
        <Dropdown.Trigger className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left outline-none hover:bg-default">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft">
            <Icon className="size-3.5 text-accent" icon="gravity-ui:graduation-cap" />
          </div>
          <span className="text-sm font-semibold text-foreground" data-sidebar="label">
            Pixel Academy
          </span>
          <Icon
            className="ml-auto size-3.5 text-muted"
            data-sidebar="label"
            icon="gravity-ui:chevrons-expand-vertical"
          />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom start">
          <Dropdown.Menu aria-label="Workspaces">
            <Dropdown.Item id="academy">Pixel Academy</Dropdown.Item>
            <Dropdown.Item id="studio">Pixel Studio</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Sidebar.Header>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Shortcuts">
          {renderItems([
            {icon: icon("magnifier"), id: "find", label: "Find"},
            {chip: <CountChip>7</CountChip>, icon: icon("tray"), id: "inbox", label: "Inbox"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Separator />
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Course navigation">
          {renderItems(
            [
              {current: true, icon: icon("house"), id: "overview", label: "Overview"},
              {icon: icon("play"), id: "lessons", label: "Lessons"},
              {icon: icon("persons"), id: "students", label: "Students"},
              {icon: icon("chart-column"), id: "insights", label: "Insights"},
              {icon: icon("megaphone"), id: "promotions", label: "Promotions"},
              {icon: icon("gear"), id: "settings", label: "Settings"},
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Scheduled lessons</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Scheduled lessons">
          {renderItems(
            lessons.map((lesson) => ({id: `next-${lesson.title}`, label: lesson.title})),
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Resources">
        {renderItems([
          {icon: icon("circle-question"), id: "help", label: "Help desk"},
          {icon: icon("sparkles"), id: "changelog", label: "Release notes"},
        ])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const InsetDashboard: Story = {
  args: {sidebarCollapsible: "offcanvas", sidebarVariant: "inset"},
  render: (args) => (
    <AppLayout
      {...args}
      sidebar={withMobile(InsetDashboardSidebarBody)}
      navbar={
        <Navbar maxWidth="full">
          <Navbar.Header>
            <AppLayout.MenuToggle />
            <Sidebar.Trigger />
            <Crumbs items={[{icon: "house", label: "Overview"}]} />
            <Navbar.Spacer />
            <Dropdown>
              <Dropdown.Trigger className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-2 text-left outline-none hover:bg-default">
                <span className="hidden text-sm font-medium text-foreground sm:inline">
                  Theo Brandt
                </span>
                <PhotoAvatar name="Theo Brandt" src={AVATAR_C} />
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu aria-label="Account">
                  <Dropdown.Item id="profile">Profile</Dropdown.Item>
                  <Dropdown.Item id="billing">Billing</Dropdown.Item>
                  <Dropdown.Item id="sign-out">Sign out</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </Navbar.Header>
        </Navbar>
      }
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KPI>
            <KPI.Header>
              <KPI.Title>Lesson views</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              <KPI.Value value={52_740} />
              <KPI.Trend trend="up">+9%</KPI.Trend>
            </KPI.Content>
            <KPI.Chart
              color="var(--color-accent)"
              data={series([20, 22, 21, 25, 24, 28, 27, 31, 30, 34, 33, 37])}
            />
          </KPI>
          <KPI>
            <KPI.Header>
              <KPI.Title>Enrolled students</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              <KPI.Value value={1_962} />
              <KPI.Trend trend="up">+4%</KPI.Trend>
            </KPI.Content>
            <KPI.Chart
              color="var(--color-success)"
              data={series([40, 41, 41, 42, 41, 43, 42, 43, 44, 44, 45, 45])}
            />
          </KPI>
          <KPI>
            <KPI.Header>
              <KPI.Title>Lessons published</KPI.Title>
            </KPI.Header>
            <KPI.Content>
              <KPI.Value value={36} />
              <KPI.Trend trend="neutral">3 drafts</KPI.Trend>
            </KPI.Content>
            <KPI.Chart
              color="var(--color-muted)"
              data={series([12, 12, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16])}
            />
          </KPI>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-surface">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent lessons</h2>
            <Button size="sm" variant="tertiary">
              See all
            </Button>
          </div>
          <ul className="-mx-3 flex flex-col gap-0.5">
            {lessons.map((lesson) => (
              <li key={lesson.title}>
                <PressableFeedback
                  aria-label={`Open ${lesson.title}`}
                  className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left"
                >
                  <PressableFeedback.Ripple className="text-muted" />
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent">
                      <Icon className="size-4" icon="gravity-ui:play" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                      <span className="text-xs text-muted">Tutor · {lesson.tutor}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {lesson.plays}
                    </span>
                    <span className="text-xs text-muted tabular-nums">{lesson.date}</span>
                  </div>
                </PressableFeedback>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Docs Site
 * -----------------------------------------------------------------------------------------------*/
type DocsSection = {icon: string; items: string[]; label: string};

const docsSections: DocsSection[] = [
  {
    icon: "rocket",
    items: ["Welcome", "Setup", "Folder layout", "IDE plugins", "First steps"],
    label: "Basics",
  },
  {
    icon: "palette",
    items: ["Tokens", "Palette", "Type scale", "Grid", "Themes", "Inclusive design"],
    label: "Styling",
  },
];

const docsComponents: NavItem[] = [
  {
    children: [
      {id: "buttons-button", label: "Button"},
      {id: "buttons-group", label: "Button Group"},
    ],
    id: "buttons",
    label: "Buttons",
  },
  {
    children: [
      {id: "forms-input", label: "Input"},
      {id: "forms-select", label: "Select"},
      {
        chip: (
          <Chip color="accent" size="sm" variant="soft">
            Beta
          </Chip>
        ),
        id: "forms-autocomplete",
        label: "Autocomplete",
      },
      {id: "forms-checkbox", label: "Checkbox"},
      {id: "forms-radio", label: "Radio"},
      {id: "forms-toggle", label: "Toggle"},
      {id: "forms-range", label: "Range"},
    ],
    id: "forms",
    label: "Forms",
  },
  {children: [{id: "display-table", label: "Table"}], id: "display", label: "Display"},
  {children: [{id: "status-alert", label: "Alert"}], id: "status", label: "Status"},
  {children: [{id: "menus-tabs", label: "Tabs"}], id: "menus", label: "Menus"},
  {children: [{id: "layers-dialog", label: "Dialog"}], id: "layers", label: "Layers"},
];

const docsTail: DocsSection[] = [
  {
    icon: "code",
    items: ["useBreakpoint", "useToggle", "useClipboard", "useDebounce", "useTimeout"],
    label: "Utilities",
  },
  {
    icon: "book-open",
    items: ["Custom themes", "Extending styles", "SSR", "Upgrading", "Unit tests"],
    label: "Recipes",
  },
];

const DocsGroup = ({first, section}: {first?: boolean; section: DocsSection}) => (
  <Sidebar.Group>
    <Sidebar.GroupLabel className="flex items-center gap-2">
      <Icon className="size-3.5" icon={`gravity-ui:${section.icon}`} />
      {section.label}
    </Sidebar.GroupLabel>
    <Sidebar.Menu aria-label={section.label}>
      {renderItems(
        section.items.map((item, index) => ({
          current: first && index === 0,
          id: `${section.label}-${item}`,
          label: item,
        })),
      )}
    </Sidebar.Menu>
  </Sidebar.Group>
);

const DocsSidebarBody = (isMobile: boolean) => (
  <>
    <Sidebar.Header>
      <div className="flex items-center gap-3 px-1 py-2">
        <Icon className="size-5 text-foreground" icon="gravity-ui:layers-3-diagonal" />
        <div className="flex flex-col">
          <span className="text-sm leading-tight font-semibold text-foreground">Lattice Docs</span>
          <span className="text-xs leading-tight text-muted">v2.4 Preview</span>
        </div>
      </div>
    </Sidebar.Header>
    <Sidebar.Content>
      {docsSections.map((section, index) => (
        <DocsGroup key={section.label} first={index === 0} section={section} />
      ))}
      <Sidebar.Group>
        <Sidebar.GroupLabel className="flex items-center gap-2">
          <Icon className="size-3.5" icon="gravity-ui:cube" />
          Components
        </Sidebar.GroupLabel>
        <Sidebar.Menu
          aria-label="Components"
          defaultExpandedKeys={["forms"]}
          showGuideLines="hover"
        >
          {renderItems(docsComponents, {trigger: true})}
        </Sidebar.Menu>
      </Sidebar.Group>
      {docsTail.map((section) => (
        <DocsGroup key={section.label} section={section} />
      ))}
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Footer links">
        {renderItems(
          [
            {chip: <NewChip />, icon: icon("list-ul"), id: "releases", label: "Releases"},
            {icon: icon("logo-github"), id: "source", label: "Source code"},
            {icon: icon("life-ring"), id: "community", label: "Community"},
          ],
          {trigger: isMobile},
        )}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const DocsSite: Story = {
  args: {sidebarCollapsible: "offcanvas"},
  render: (args) => (
    <AppLayout
      {...args}
      sidebar={withMobile(DocsSidebarBody, {rail: true})}
      navbar={
        <Navbar maxWidth="full">
          <Navbar.Header>
            <AppLayout.MenuToggle />
            <Sidebar.Trigger />
            <Navbar.Spacer />
            <SearchField
              aria-label="Search the docs"
              className="w-[200px]"
              name="docs-search"
              variant="secondary"
            >
              <SearchField.Group className="h-8">
                <SearchField.SearchIcon />
                <SearchField.Input className="w-16" placeholder="Find a topic…" />
                <ShortcutKbd className="pointer-events-none mr-1.5 text-xs">K</ShortcutKbd>
              </SearchField.Group>
            </SearchField>
            <Navbar.Spacer />
            <Navbar.Content>
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
        </Navbar>
      }
    >
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-accent" icon="gravity-ui:rocket" />
          <span className="text-xs font-medium tracking-wider text-muted uppercase">Basics</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Welcome</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Lattice is a small design system for product teams. It ships accessible primitives, theme
          tokens and layout building blocks that work the same in every framework you use.
        </p>
        <h2 className="mt-8 text-lg font-semibold text-foreground">Highlights</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
          <li>Keyboard and screen reader support out of the box</li>
          <li>One token set for colors, spacing and radii</li>
          <li>Composable parts instead of configuration objects</li>
          <li>Light and dark themes</li>
          <li>Works with server rendering</li>
        </ul>
      </div>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Collapsible / Offcanvas / Inset / Floating (same sidebar, different collapse modes and looks)
 * -----------------------------------------------------------------------------------------------*/
const simpleNav = (children: string[]): NavItem[] => [
  {current: true, icon: icon("house"), id: "home", label: "Home"},
  {
    children: children.map((label) => ({id: `reports-${label}`, label})),
    icon: icon("chart-column"),
    id: "reports",
    label: "Reports",
  },
  {chip: <NewChip />, icon: icon("list-check"), id: "tasks", label: "Tasks"},
  {icon: icon("gear"), id: "preferences", label: "Preferences"},
];

const simpleSidebarBody = (children: string[]) => {
  const Body = (isMobile: boolean) => (
    <>
      <BrandHeader letter="O" name="Orbit" />
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label="Workspace" defaultExpandedKeys={["reports"]}>
            {renderItems(simpleNav(children), {trigger: isMobile})}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Menu aria-label="Help">
          {renderItems([{icon: icon("circle-question"), id: "support", label: "Support"}])}
        </Sidebar.Menu>
      </Sidebar.Footer>
    </>
  );

  return Body;
};

const homeNavbar = <AppNavbar crumbs={[{icon: "house", label: "Home"}]} />;

export const Collapsible: Story = {
  args: {sidebarCollapsible: "icon"},
  render: (args) => (
    <AppLayout
      {...args}
      navbar={homeNavbar}
      sidebar={withMobile(simpleSidebarBody(["Summary", "Revenue", "Retention"]), {rail: true})}
    >
      <PageIntro title="Home">
        Press the sidebar trigger or the rail on the sidebar edge to shrink it to an icon rail.
        Cmd+B (Ctrl+B on Windows and Linux) does the same.
      </PageIntro>
    </AppLayout>
  ),
};

export const Offcanvas: Story = {
  args: {sidebarCollapsible: "offcanvas"},
  render: (args) => (
    <AppLayout
      {...args}
      navbar={homeNavbar}
      sidebar={withMobile(simpleSidebarBody(["Summary", "Revenue"]))}
    >
      <PageIntro title="Home">
        In offcanvas mode the collapsed sidebar slides out of view completely, so the page content
        can use the whole width of the window.
      </PageIntro>
    </AppLayout>
  ),
};

export const InsetSidebar: Story = {
  args: {sidebarVariant: "inset"},
  render: (args) => (
    <AppLayout
      {...args}
      sidebar={withMobile(simpleSidebarBody(["Summary", "Revenue"]), {rail: true})}
      navbar={
        <AppNavbar
          crumbs={[{icon: "house", label: "Home"}]}
          actions={
            <>
              <IconItem label="Search" name="magnifier" />
              <IconItem label="Notifications" name="bell" />
              <Navbar.Separator />
              <AccountMenu avatar={<PhotoAvatar name="Ada Moreno" src={AVATAR_C} />} />
            </>
          }
        />
      }
    >
      <PageIntro title="Home">
        This layout uses the inset sidebar look: the panel blends into the page background.
      </PageIntro>
    </AppLayout>
  ),
};

export const FloatingSidebar: Story = {
  args: {sidebarVariant: "floating"},
  render: (args) => (
    <AppLayout
      {...args}
      navbar={homeNavbar}
      sidebar={withMobile(simpleSidebarBody(["Summary", "Revenue"]), {rail: true})}
    >
      <PageIntro title="Home">
        The floating sidebar is a rounded card with a shadow, set slightly apart from the window
        edge.
      </PageIntro>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Content Scroll Mode
 * -----------------------------------------------------------------------------------------------*/
const scrollSections = ["Summary", "Events", "History", "Numbers", "Comments"];

const ScrollSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader letter="O" name="Orbit" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Workspace">
          {renderItems(
            [
              {icon: icon("house"), id: "home", label: "Home"},
              {icon: icon("chart-column"), id: "reports", label: "Reports"},
              {icon: icon("bell"), id: "alerts", label: "Alerts"},
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

const ShellFooter = ({children}: {children: ReactNode}) => (
  <div className="flex items-center justify-between border-t border-border bg-background px-4 py-2">
    <span className="text-xs text-muted">{children}</span>
    <span className="text-xs text-muted tabular-nums">build 2.4.0-rc.7</span>
  </div>
);

const shellActions = (withHelp: boolean) => (
  <>
    <IconItem label="Search" name="magnifier" />
    <IconItem label="Notifications" name="bell" />
    {withHelp ? (
      <Button isIconOnly aria-label="Help" variant="ghost">
        <Icon className="size-4" icon="gravity-ui:circle-question" />
      </Button>
    ) : null}
    <Button isIconOnly aria-label="Account" variant="ghost">
      <InitialsAvatar
        initials={withHelp ? "MR" : <Icon className="size-3.5" icon="gravity-ui:person" />}
      />
    </Button>
  </>
);

export const ContentScroll: Story = {
  args: {scrollMode: "content"},
  render: (args) => (
    <AppLayout
      {...args}
      footer={<ShellFooter>Pinned footer row</ShellFooter>}
      navbar={<AppNavbar actions={shellActions(false)} />}
      sidebar={withMobile(ScrollSidebarBody)}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
        <div className="sticky top-0 z-10 rounded-xl border border-border bg-surface p-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">Sections</p>
          <div className="flex flex-wrap gap-2">
            {scrollSections.map((section) => (
              <Button
                key={section}
                size="sm"
                variant="tertiary"
                onPress={() =>
                  document
                    .getElementById(`scroll-${section.toLowerCase()}`)
                    ?.scrollIntoView({behavior: "smooth", block: "start"})
                }
              >
                {section}
              </Button>
            ))}
          </div>
        </div>
        {scrollSections.map((section) => (
          <section key={section} className="scroll-mt-24" id={`scroll-${section.toLowerCase()}`}>
            <h2 className="text-xl font-semibold text-foreground">{section}</h2>
            <div className="mt-3 grid gap-3">
              {Array.from({length: 8}, (_, index) => (
                <article key={index} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-medium text-foreground">
                    {section} entry {index + 1}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    With <code>scrollMode=&quot;content&quot;</code> only this column scrolls; the
                    sidebar, navbar and footer stay where they are.
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Aside
 * -----------------------------------------------------------------------------------------------*/
const Dot = ({color}: {color: string}) => (
  <span className="size-2 rounded-full" style={{backgroundColor: `var(--color-${color})`}} />
);

const InboxSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader letter="D" name="Desk" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Desk">
          {renderItems(
            [
              {
                chip: <CountChip>5</CountChip>,
                icon: icon("tray"),
                id: "mine",
                label: "Assigned to me",
              },
              {
                chip: <CountChip>21</CountChip>,
                current: true,
                icon: icon("envelope"),
                id: "all",
                label: "Everything",
              },
              {icon: icon("pencil"), id: "drafts", label: "Started by me"},
              {
                chip: <CountChip>8</CountChip>,
                icon: icon("circle-question"),
                id: "open",
                label: "Waiting",
              },
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Queues</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Queues">
          {renderItems([
            {icon: <Dot color="success" />, id: "queue-onboarding", label: "Onboarding"},
            {icon: <Dot color="danger" />, id: "queue-escalations", label: "Escalations"},
            {icon: <Dot color="accent" />, id: "queue-partners", label: "Partners"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Footer links">
        {renderItems([
          {icon: icon("chart-column"), id: "reports", label: "Reports"},
          {icon: icon("circle-question"), id: "help", label: "Help desk"},
        ])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

type Message = {fromAgent?: boolean; text: string};

const thread: Message[] = [
  {text: "Hi! The invoice for October still shows the old company address."},
  {
    fromAgent: true,
    text: "Thanks for letting us know, Lea. I can see the change on your profile, let me regenerate the invoice for you.",
  },
  {text: "Perfect, thank you!"},
  {
    fromAgent: true,
    text: "Done. The corrected invoice is now in your billing history and a copy is on its way to your inbox.",
  },
];

const PropertyRow = ({children, label}: {children: ReactNode; label: string}) => (
  <div className="flex min-h-[28px] items-center justify-between gap-4">
    <span className="text-sm text-muted">{label}</span>
    <div className="flex items-center justify-end">{children}</div>
  </div>
);

const DetailSection = ({
  children,
  id,
  isExpanded,
  title,
}: {
  children: ReactNode;
  id: string;
  isExpanded: boolean;
  title: string;
}) => (
  <Disclosure id={id}>
    <Disclosure.Heading>
      <Button
        className="h-8 w-full justify-between border-none px-3"
        slot="trigger"
        variant={isExpanded ? "secondary" : "tertiary"}
      >
        <span className="text-sm font-medium">{title}</span>
        <Disclosure.Indicator className="text-muted" />
      </Button>
    </Disclosure.Heading>
    <Disclosure.Content>
      <Disclosure.Body className="pt-2">{children}</Disclosure.Body>
    </Disclosure.Content>
  </Disclosure>
);

const KeyValues = ({rows}: {rows: Array<[string, string]>}) => (
  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 pr-1 pb-3 pl-3 text-sm">
    {rows.map(([key, value]) => (
      <React.Fragment key={key}>
        <span className="text-muted">{key}</span>
        <span className="min-w-0 truncate font-medium text-foreground">{value}</span>
      </React.Fragment>
    ))}
  </div>
);

const TicketDetails = () => {
  const [expanded, setExpanded] = React.useState<Set<string | number>>(new Set(["customer"]));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-foreground">Ticket details</h2>
      </header>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-3 px-1 py-2">
          <PropertyRow label="Owner">
            <span className="flex items-center gap-2">
              <PhotoAvatar className="size-5" name="Sam Okafor" src={AVATAR_C} />
              <span className="text-sm font-medium text-foreground">Sam Okafor</span>
            </span>
          </PropertyRow>
          <PropertyRow label="Queue">
            <span className="text-sm font-medium text-foreground">Billing</span>
          </PropertyRow>
          <PropertyRow label="Urgency">
            <span className="text-sm font-medium text-foreground">Low</span>
          </PropertyRow>
          <PropertyRow label="State">
            <Chip color="success" size="sm" variant="soft">
              Active
            </Chip>
          </PropertyRow>
          <PropertyRow label="Labels">
            <div className="flex flex-wrap justify-end gap-1.5">
              <Chip size="sm" variant="soft">
                Invoice
              </Chip>
              <Chip color="accent" size="sm" variant="soft">
                VIP
              </Chip>
            </div>
          </PropertyRow>
        </div>
        <DisclosureGroup
          className="mt-2 flex flex-col gap-2"
          expandedKeys={expanded}
          onExpandedChange={setExpanded}
        >
          <DetailSection id="customer" isExpanded={expanded.has("customer")} title="Customer">
            <KeyValues
              rows={[
                ["Name", "Lea Novak"],
                ["Company", "Fernway"],
                ["Plan", "Team"],
                ["Email", "lea.novak@example.com"],
              ]}
            />
          </DetailSection>
          <DetailSection id="history" isExpanded={expanded.has("history")} title="Earlier tickets">
            <ul className="flex flex-col gap-2 pr-1 pb-3 pl-3 text-sm">
              <li className="truncate text-foreground">Card declined at renewal</li>
              <li className="truncate text-foreground">Adding a second workspace</li>
              <li className="truncate text-foreground">VAT number on receipts</li>
            </ul>
          </DetailSection>
          <DetailSection id="account" isExpanded={expanded.has("account")} title="Account">
            <KeyValues
              rows={[
                ["Seats", "24"],
                ["Region", "EU"],
                ["Since", "2021"],
              ]}
            />
          </DetailSection>
        </DisclosureGroup>
      </div>
      <footer className="flex flex-col gap-1.5 border-t border-border px-4 py-3">
        <Button fullWidth size="sm" variant="primary">
          Resolve ticket
        </Button>
        <Button fullWidth size="sm" variant="secondary">
          Remind me later
        </Button>
      </footer>
    </div>
  );
};

const Conversation = () => (
  <div className="flex flex-col gap-6 px-6 py-8">
    <header className="flex items-center gap-3">
      <PhotoAvatar className="size-10" name="Lea Novak" src={AVATAR_A} />
      <div className="flex flex-col gap-0.5">
        <h1 className="text-base leading-tight font-semibold text-foreground">Lea Novak</h1>
        <p className="text-xs text-muted tabular-nums">Chat · 2 days ago</p>
      </div>
    </header>
    <div className="flex flex-col gap-6">
      {thread.map((message, index) => (
        <div
          key={index}
          className={
            message.fromAgent ? "flex flex-row-reverse items-end gap-2" : "flex items-end gap-2"
          }
        >
          <Avatar size="sm">
            <Avatar.Image
              alt={message.fromAgent ? "Sam Okafor" : "Lea Novak"}
              src={message.fromAgent ? AVATAR_B : AVATAR_A}
            />
            <Avatar.Fallback>{message.fromAgent ? "SO" : "LN"}</Avatar.Fallback>
          </Avatar>
          <div
            className={`flex max-w-md flex-col gap-1 ${message.fromAgent ? "items-end" : "items-start"}`}
          >
            <div
              className={`rounded-2xl px-3.5 py-2 text-foreground ${message.fromAgent ? "bg-surface-tertiary" : "bg-surface"}`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
            <p className="px-1 text-xs text-muted tabular-nums">2d</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const WithAside: Story = {
  render: (args) => (
    <AppLayout
      {...args}
      aside={<TicketDetails />}
      sidebar={withMobile(InboxSidebarBody, {rail: true})}
      navbar={
        <AppNavbar
          crumbs={[{icon: "envelope", label: "Everything"}]}
          actions={
            <>
              <IconItem label="Search" name="magnifier" />
              <AccountMenu avatar={<InitialsAvatar initials="SO" />} />
              <AppLayout.AsideTrigger closedTooltip="Show details" openTooltip="Hide details" />
            </>
          }
        />
      }
    >
      <Conversation />
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Mobile Aside Sheet (docs section without a live demo: asideMobile="sheet" + AppLayout.MobileAside)
 * -----------------------------------------------------------------------------------------------*/
export const MobileAsideSheet: Story = {
  args: {asideMobile: "sheet"},
  render: (args) => (
    <AppLayout
      {...args}
      aside={<TicketDetails />}
      sidebar={withMobile(InboxSidebarBody, {rail: true})}
      navbar={
        <AppNavbar
          crumbs={[{icon: "envelope", label: "Everything"}]}
          actions={
            <>
              <IconItem label="Search" name="magnifier" />
              <AppLayout.AsideTrigger closedTooltip="Show details" openTooltip="Hide details" />
            </>
          }
        />
      }
    >
      <AppLayout.MobileAside>
        <div className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold text-foreground">Ticket details</h2>
          <PropertyRow label="Owner">
            <span className="text-sm font-medium text-foreground">Sam Okafor</span>
          </PropertyRow>
          <PropertyRow label="State">
            <Chip color="success" size="sm" variant="soft">
              Active
            </Chip>
          </PropertyRow>
        </div>
      </AppLayout.MobileAside>
      <Conversation />
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With Breadcrumbs
 * -----------------------------------------------------------------------------------------------*/
const BreadcrumbsSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader letter="MK" name="Marketing Kit" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Project">
          {renderItems(
            [
              {icon: icon("house"), id: "summary", label: "Summary"},
              {current: true, icon: icon("layout-columns"), id: "templates", label: "Templates"},
              {icon: icon("palette"), id: "brand", label: "Brand assets"},
              {icon: icon("text-align-left"), id: "copy", label: "Copy library"},
              {icon: icon("list-ul"), id: "history", label: "History"},
              {icon: icon("gear"), id: "settings", label: "Settings"},
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Separator />
      <Sidebar.Group>
        <Sidebar.GroupLabel>Teams</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Teams">
          {renderItems([
            {icon: icon("folder"), id: "team-campaigns", label: "Campaigns"},
            {icon: icon("folder"), id: "team-social", label: "Social"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Help">
        {renderItems([{icon: icon("circle-question"), id: "support", label: "Support"}])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const WithBreadcrumbs: Story = {
  render: (args) => (
    <AppLayout
      {...args}
      sidebar={withMobile(BreadcrumbsSidebarBody, {rail: true})}
      navbar={
        <AppNavbar
          actions={
            <>
              <IconItem label="Search" name="magnifier" />
              <IconItem label="Notifications" name="bell" />
              <Navbar.Separator />
              <AccountMenu avatar={<PhotoAvatar name="Ada Moreno" src={AVATAR_C} />} />
            </>
          }
          crumbs={[
            {label: "Workspace"},
            {label: "Clients", wide: true},
            {label: "Marketing Kit", wide: true},
            {icon: "layout-columns", label: "Templates"},
          ]}
        />
      }
    >
      <PageIntro title="Templates">
        A breadcrumb trail in the navbar mirrors how deep the current page sits. The middle levels
        are hidden on small screens so the current page always stays readable.
      </PageIntro>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Toolbar and Footer
 * -----------------------------------------------------------------------------------------------*/
const ToolbarSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader letter="O" name="Orbit" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Workspace">
          {renderItems(
            [
              {current: true, icon: icon("house"), id: "home", label: "Home"},
              {icon: icon("chart-column"), id: "reports", label: "Reports"},
              {icon: icon("gear"), id: "preferences", label: "Preferences"},
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const ToolbarAndFooter: Story = {
  args: {scrollMode: "content"},
  render: (args) => (
    <AppLayout
      {...args}
      footer={<ShellFooter>Footer slot · always visible</ShellFooter>}
      navbar={<AppNavbar actions={shellActions(true)} crumbs={[{icon: "house", label: "Home"}]} />}
      sidebar={withMobile(ToolbarSidebarBody)}
      toolbar={
        <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2">
          <Segment aria-label="Layout" defaultSelectedKey="table">
            <Segment.Item id="table">Table</Segment.Item>
            <Segment.Item id="kanban">Kanban</Segment.Item>
            <Segment.Item id="timeline">Timeline</Segment.Item>
          </Segment>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-foreground">Toolbar and footer</h1>
        <p className="max-w-prose text-sm text-muted">
          The <code>toolbar</code> prop adds a second sticky row under the navbar, and{" "}
          <code>footer</code> pins a row to the bottom of the column. Together with{" "}
          <code>scrollMode=&quot;content&quot;</code> only the content area scrolls.
        </p>
        <div className="grid gap-3">
          {Array.from({length: 30}, (_, index) => (
            <div key={index} className="rounded-md border border-border p-4">
              <p className="font-medium text-foreground">Row {index + 1}</p>
              <p className="text-sm text-muted">Scroll here: the toolbar and footer stay put.</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Complex
 * -----------------------------------------------------------------------------------------------*/
const COMPACT = {"--spacing": "0.2rem"} as CSSProperties;

const ComplexSidebarBody = (isMobile: boolean) => (
  <>
    <Sidebar.Header>
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-600">
            <span className="text-sm font-bold text-white">Q</span>
          </div>
          <span className="text-sm font-semibold text-foreground" data-sidebar="label">
            Quill Works
          </span>
        </div>
        <div className="flex items-center" data-sidebar="label">
          <button
            aria-label="Compose"
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
          {renderItems([
            {icon: icon("sparkles"), id: "new-run", label: "New run"},
            {
              chip: <ShortcutKbd>K</ShortcutKbd>,
              icon: icon("magnifier"),
              id: "find",
              label: "Find",
            },
            {current: true, icon: icon("house"), id: "home", label: "Home"},
            {
              chip: (
                <Chip color="accent" size="sm" variant="soft">
                  5
                </Chip>
              ),
              icon: icon("envelope"),
              id: "inbox",
              label: "Inbox",
            },
            {icon: icon("calendar"), id: "calendar", label: "Calendar"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Recent runs</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Recent runs">
          {renderItems(
            [
              "Split the billing service",
              "Fix flaky checkout test",
              "Draft release notes",
              "Triage issue #913",
            ].map((label) => ({icon: icon("sparkles"), id: `run-${label}`, label})),
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>
          <span className="flex items-center gap-2">
            Assistants
            <Chip size="sm" variant="soft">
              Preview
            </Chip>
          </span>
        </Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Assistants">
          {renderItems([
            {icon: icon("code"), id: "assistant-builder", label: "Builder"},
            {icon: icon("book-open"), id: "assistant-auditor", label: "Auditor"},
            {icon: icon("file-text"), id: "assistant-scribe", label: "Scribe"},
            {icon: icon("plus"), id: "assistant-new", label: "New assistant", muted: true},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Spaces</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Spaces" defaultExpandedKeys={["space-studio"]}>
          {renderItems(
            [
              {
                children: [
                  {icon: icon("house"), id: "studio-home", label: "Home"},
                  {icon: icon("square-check"), id: "studio-todo", label: "To-dos"},
                  {icon: icon("folder"), id: "studio-work", label: "Work"},
                  {icon: icon("flag"), id: "studio-goals", label: "Goals"},
                  {current: true, icon: icon("chart-column"), id: "studio-plan", label: "Plan"},
                  {icon: icon("layout-columns"), id: "studio-board", label: "Board"},
                ],
                icon: icon("house"),
                id: "space-studio",
                label: "Studio",
              },
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
      <Sidebar.Separator />
      <Sidebar.Group>
        <Sidebar.GroupLabel>Tools</Sidebar.GroupLabel>
        <Sidebar.Menu aria-label="Tools">
          {renderItems([
            {icon: icon("file-text"), id: "tool-notes", label: "Notes"},
            {icon: icon("calendar"), id: "tool-agenda", label: "Agenda"},
          ])}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Separator />
    <Sidebar.Footer className="gap-0">
      <div className="flex items-center justify-center gap-2 px-2 py-2">
        <Button
          className="flex h-9 flex-1 gap-2 bg-surface text-sm text-muted shadow-surface"
          size="sm"
          variant="tertiary"
        >
          <Icon className="size-4" icon="gravity-ui:sparkles" />
          <span>New run</span>
          <ShortcutKbd>N</ShortcutKbd>
        </Button>
        <Button isIconOnly aria-label="New note" size="sm" variant="tertiary">
          <Icon className="size-4" icon="gravity-ui:pencil-to-square" />
        </Button>
      </div>
      <div className="px-2 pb-2">
        <Dropdown>
          <Dropdown.Trigger className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left outline-none hover:bg-default">
            <Avatar size="sm">
              <Avatar.Image alt="Noa Lindqvist" src={AVATAR_B} />
              <Avatar.Fallback>NL</Avatar.Fallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground" data-sidebar="label">
              Noa Lindqvist
            </span>
            <Icon
              className="ml-auto size-3 text-muted"
              data-sidebar="label"
              icon="gravity-ui:chevron-down"
            />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="top start">
            <Dropdown.Menu aria-label="Account">
              <Dropdown.Item id="profile">Profile</Dropdown.Item>
              <Dropdown.Item id="sign-out">Sign out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </Sidebar.Footer>
  </>
);

export const Complex: Story = {
  render: (args) => (
    <AppLayout
      {...args}
      sidebar={withMobile(ComplexSidebarBody, {rail: true, style: COMPACT})}
      navbar={
        <AppNavbar
          crumbs={[{icon: "chart-column", label: "Plan"}]}
          actions={
            <>
              <IconItem label="Search" name="magnifier" />
              <IconItem label="Notifications" name="bell" />
              <Navbar.Separator />
              <AccountMenu avatar={<PhotoAvatar name="Noa Lindqvist" src={AVATAR_B} />} />
            </>
          }
        />
      }
    >
      <PageIntro title="Plan">
        Everything at once: a dense agent-style sidebar with several groups, chips, a nested space
        and an account menu, next to a navbar with breadcrumbs and actions.
      </PageIntro>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Resizable Sidebar
 * -----------------------------------------------------------------------------------------------*/
const ResizableSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader letter="O" name="Orbit" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Workspace">
          {renderItems(
            [
              {current: true, icon: icon("house"), id: "home", label: "Home"},
              {icon: icon("chart-column"), id: "reports", label: "Reports"},
              {chip: <NewChip />, icon: icon("list-check"), id: "tasks", label: "Tasks"},
              {icon: icon("gear"), id: "preferences", label: "Preferences"},
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
      <Sidebar.Menu aria-label="Account links">
        {renderItems([
          {icon: icon("circle-question"), id: "support", label: "Support"},
          {icon: icon("arrow-right-from-square"), id: "sign-out", label: "Sign out"},
        ])}
      </Sidebar.Menu>
    </Sidebar.Footer>
  </>
);

export const ResizableSidebar: Story = {
  args: {
    resizableAutoSaveId: "storybook-app-layout:resizable-sidebar",
    sidebarCollapsible: "offcanvas",
    sidebarDefaultSize: "280px",
    sidebarMaxSize: "420px",
    sidebarMinSize: "220px",
    sidebarResizable: true,
    sidebarResizeBehavior: "preserve-pixel-size",
  },
  render: (args) => (
    <AppLayout
      {...args}
      navbar={<AppNavbar actions={shellActions(false)} crumbs={[{icon: "house", label: "Home"}]} />}
      sidebar={withMobile(ResizableSidebarBody)}
    >
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-foreground">Resizable sidebar</h1>
        <p className="max-w-prose text-sm text-muted">
          Drag the line between the sidebar and the page to change its width, or drag it past the
          minimum to close the sidebar. The width survives a reload thanks to{" "}
          <code>resizableAutoSaveId</code>.
        </p>
      </div>
    </AppLayout>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Resizable Sidebar and Aside
 * -----------------------------------------------------------------------------------------------*/
const ResizableAsideSidebarBody = (isMobile: boolean) => (
  <>
    <BrandHeader labelled={false} letter="D" name="Desk" />
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.Menu aria-label="Desk">
          {renderItems(
            [
              {current: true, icon: icon("envelope"), id: "inbox", label: "Inbox"},
              {icon: icon("house"), id: "home", label: "Home"},
            ],
            {trigger: isMobile},
          )}
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
  </>
);

export const ResizableAside: Story = {
  args: {
    asideDefaultSize: "320px",
    asideMaxSize: "420px",
    asideMinSize: "260px",
    asideResizable: true,
    asideResizeBehavior: "preserve-pixel-size",
    asideToggleShortcut: "mod+.",
    resizableAutoSaveId: "storybook-app-layout:resizable-aside",
    sidebarCollapsible: "offcanvas",
    sidebarDefaultSize: "260px",
    sidebarMaxSize: "380px",
    sidebarMinSize: "220px",
    sidebarResizable: true,
    sidebarResizeBehavior: "preserve-pixel-size",
  },
  render: (args) => (
    <AppLayout
      {...args}
      sidebar={withMobile(ResizableAsideSidebarBody)}
      aside={
        <div className="flex h-full flex-col">
          <header className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>
          </header>
          <div className="flex flex-col gap-3 px-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">State</span>
              <Chip color="success" size="sm" variant="soft">
                Active
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Urgency</span>
              <span className="text-foreground">Low</span>
            </div>
          </div>
        </div>
      }
      navbar={
        <AppNavbar
          crumbs={[{icon: "envelope", label: "Inbox"}]}
          actions={
            <>
              {shellActions(true)}
              <AppLayout.AsideTrigger closedTooltip="Show summary" openTooltip="Hide summary" />
            </>
          }
        />
      }
    >
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-foreground">Resizable aside</h1>
        <p className="max-w-prose text-sm text-muted">
          Both side panels can be resized. Open or close the summary with the button in the top
          right corner or with <kbd>⌘</kbd> <kbd>.</kbd> (Ctrl+. on Windows and Linux).
        </p>
      </div>
    </AppLayout>
  ),
};
