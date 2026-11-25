import type {MorphTabsRootRef} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Avatar, Button, Checkbox, Chip, Label, ProgressCircle, Spinner} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useRef, useState} from "react";

import {MorphTabs, useMorphTabsProgress} from "./index";

const AVATAR = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg";

/* -------------------------------------------------------------------------------------------------
 * Story helpers (phone-sized screen like the Native demo)
 * -----------------------------------------------------------------------------------------------*/
const PhoneFrame = ({
  children,
  height = 720,
  title,
}: {
  children: ReactNode;
  height?: number;
  title: string;
}) => (
  <div
    className="relative flex w-[402px] max-w-full flex-col overflow-hidden rounded-[44px] border border-separator bg-background shadow-overlay"
    style={{height}}
  >
    <div className="flex h-14 shrink-0 items-end justify-center pb-2 text-sm font-semibold text-foreground">
      {title}
    </div>
    {children}
  </div>
);

const Card = ({children, className = ""}: {children: ReactNode; className?: string}) => (
  <div className={`rounded-3xl bg-surface p-4 shadow-surface ${className}`}>{children}</div>
);

const SectionTitle = ({children}: {children: ReactNode}) => (
  <h3 className="px-1 text-sm font-semibold text-foreground">{children}</h3>
);

const ListRow = ({
  icon,
  meta,
  subtitle,
  title,
}: {
  icon: string;
  meta?: string;
  subtitle: string;
  title: string;
}) => (
  <li className="flex items-center gap-3 py-2.5">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-default text-foreground">
      <Icon className="size-4" icon={icon} />
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-sm font-medium text-foreground">{title}</span>
      <span className="truncate text-xs text-muted">{subtitle}</span>
    </span>
    {meta ? <span className="shrink-0 text-xs text-muted">{meta}</span> : null}
  </li>
);

const HomePage = () => (
  <div className="flex flex-col gap-4 p-4">
    <div className="grid grid-cols-2 gap-3">
      {[
        {caption: "Focus time today", icon: "gravity-ui:clock", value: "3h 20m"},
        {caption: "Tasks completed", icon: "gravity-ui:circle-check", value: "12 / 18"},
      ].map((stat) => (
        <Card key={stat.caption} className="flex flex-col gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-default">
            <Icon className="size-4 text-foreground" icon={stat.icon} />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted">{stat.caption}</span>
          </span>
        </Card>
      ))}
    </div>
    <Card className="py-1.5">
      <ul className="divide-y divide-separator">
        <ListRow
          icon="gravity-ui:file-text"
          meta="9:41"
          subtitle="Edited by Mia"
          title="Launch checklist"
        />
        <ListRow
          icon="gravity-ui:persons"
          meta="Yesterday"
          subtitle="6 members"
          title="Design review"
        />
        <ListRow icon="gravity-ui:bookmark" meta="Mon" subtitle="Saved link" title="Grid systems" />
      </ul>
    </Card>
    <SectionTitle>Pinned</SectionTitle>
    <Card className="py-1.5">
      <ul className="divide-y divide-separator">
        <ListRow icon="gravity-ui:star" subtitle="Weekly ritual" title="Plan the week" />
        <ListRow icon="gravity-ui:bell" subtitle="Every day at 8:00" title="Morning digest" />
      </ul>
    </Card>
  </div>
);

const todayTasks = ["Reply to Noah", "Book the train", "Water the plants", "Stretch for 10 min"];

const TodayPage = () => (
  <div className="flex flex-col gap-4 p-4">
    <Card className="flex items-center gap-4">
      <ProgressCircle aria-label="Daily progress" size="lg" value={62}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-foreground">5 of 8 done</span>
        <span className="text-xs text-muted">Keep going, you are ahead of yesterday.</span>
      </div>
    </Card>
    <div className="flex gap-2 overflow-x-auto">
      {["All", "Work", "Home", "Errands"].map((filter, index) => (
        <Chip key={filter} color={index === 0 ? "accent" : "default"} variant="soft">
          {filter}
        </Chip>
      ))}
    </div>
    <Card className="flex flex-col gap-3">
      {todayTasks.map((task, index) => (
        <Checkbox key={task} defaultSelected={index === 0} variant="secondary">
          <Checkbox.Content className="gap-3">
            <Checkbox.Control className="rounded-full">
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label className="font-normal">{task}</Label>
          </Checkbox.Content>
        </Checkbox>
      ))}
    </Card>
  </div>
);

const upcoming = [
  {items: ["Dentist at 10:30", "Send invoices"], title: "Tomorrow"},
  {items: ["Quarterly report", "Pick up the bike", "Call grandma"], title: "This week"},
  {items: ["Renew passport", "Plan the summer trip"], title: "Later"},
];

const UpcomingPage = () => (
  <div className="flex flex-col gap-3 p-4">
    {upcoming.map((section) => (
      <section key={section.title} className="flex flex-col gap-2">
        <SectionTitle>{section.title}</SectionTitle>
        <Card className="flex flex-col gap-3">
          {section.items.map((item) => (
            <Checkbox key={item} variant="secondary">
              <Checkbox.Content className="gap-3">
                <Checkbox.Control className="rounded-full">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label className="font-normal">{item}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </Card>
      </section>
    ))}
  </div>
);

const notes = [
  {text: "Oat milk, lemons, basil, coffee beans", title: "Groceries"},
  {text: "Pricing page needs a yearly toggle", title: "Product ideas"},
  {text: "Lisbon in May? Check flights", title: "Trips"},
  {text: "Ask about the parking spot", title: "Landlord"},
  {text: "The Overstory, Piranesi", title: "Books"},
  {text: "Sourdough: feed starter at 9", title: "Baking"},
];

const NotesPage = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {notes.map((note) => (
      <Card key={note.title} className="flex min-h-28 flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">{note.title}</span>
        <span className="text-xs text-muted">{note.text}</span>
      </Card>
    ))}
  </div>
);

const SimplePage = ({children}: {children: ReactNode}) => (
  <div className="flex flex-col gap-3 p-4">
    <Card>
      <p className="text-sm text-muted">{children}</p>
    </Card>
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    animation: {
      control: {type: "select"},
      description: '"disable-all" snaps the pills and switches pages without the slide',
      options: [undefined, "disable-all"],
    },
    isHapticFeedbackEnabled: {
      control: "boolean",
      description: "Selection haptic when a swipe, press or arrow key changes the page",
    },
    lazy: {control: "boolean"},
  },
  component: MorphTabs,
  parameters: {layout: "centered"},
  title: "Pro/Navigation/MorphTabs",
} satisfies Meta<typeof MorphTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Basic usage
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {animation: undefined, defaultValue: "home", isHapticFeedbackEnabled: true, lazy: false},
  render: (args) => (
    <PhoneFrame height={640} title="Basic usage">
      <MorphTabs {...args} className="min-h-0 flex-1">
        <MorphTabs.List aria-label="Sections">
          <MorphTabs.Trigger value="home">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:house" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Home</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="today">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:calendar" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Today</MorphTabs.Label>
          </MorphTabs.Trigger>
        </MorphTabs.List>
        <MorphTabs.Pager>
          <MorphTabs.Content value="home">
            <HomePage />
          </MorphTabs.Content>
          <MorphTabs.Content value="today">
            <TodayPage />
          </MorphTabs.Content>
        </MorphTabs.Pager>
      </MorphTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Extra header content
 * -----------------------------------------------------------------------------------------------*/
export const ExtraHeaderContent: Story = {
  render: (args) => (
    <PhoneFrame height={640} title="Extra header content">
      <MorphTabs {...args} className="min-h-0 flex-1" defaultValue="home">
        <MorphTabs.List aria-label="Sections">
          <Avatar className="size-10.5 shrink-0">
            <Avatar.Image alt="Your profile" src={AVATAR} />
            <Avatar.Fallback>MK</Avatar.Fallback>
          </Avatar>
          <MorphTabs.Trigger value="home">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:house" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Home</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="today">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:sun" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Today</MorphTabs.Label>
          </MorphTabs.Trigger>
        </MorphTabs.List>
        <MorphTabs.Pager>
          <MorphTabs.Content value="home">
            <HomePage />
          </MorphTabs.Content>
          <MorphTabs.Content value="today">
            <TodayPage />
          </MorphTabs.Content>
        </MorphTabs.Pager>
      </MorphTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
const sections = [
  {icon: "gravity-ui:house", label: "Home", value: "home"},
  {icon: "gravity-ui:sun", label: "Today", value: "today"},
  {icon: "gravity-ui:calendar", label: "Upcoming", value: "upcoming"},
] as const;

const sectionPages: Record<string, ReactNode> = {
  home: <HomePage />,
  notes: <NotesPage />,
  today: <TodayPage />,
  upcoming: <UpcomingPage />,
};

const ControlledDemo = (args: Story["args"]) => {
  const [tab, setTab] = useState("today");

  return (
    <div className="flex flex-col items-center gap-4">
      <PhoneFrame height={600} title="Controlled">
        <MorphTabs {...args} className="min-h-0 flex-1" value={tab} onValueChange={setTab}>
          <MorphTabs.List aria-label="Sections">
            {sections.map((section) => (
              <MorphTabs.Trigger key={section.value} value={section.value}>
                <MorphTabs.Icon>
                  <Icon icon={section.icon} />
                </MorphTabs.Icon>
                <MorphTabs.Label>{section.label}</MorphTabs.Label>
              </MorphTabs.Trigger>
            ))}
          </MorphTabs.List>
          <MorphTabs.Pager>
            {sections.map((section) => (
              <MorphTabs.Content key={section.value} value={section.value}>
                {sectionPages[section.value]}
              </MorphTabs.Content>
            ))}
          </MorphTabs.Pager>
        </MorphTabs>
      </PhoneFrame>
      <div className="flex items-center gap-2">
        {sections.map((section) => (
          <Button
            key={section.value}
            size="sm"
            variant={tab === section.value ? "primary" : "secondary"}
            onPress={() => setTab(section.value)}
          >
            {section.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted">
        Selected: <span className="font-medium text-foreground">{tab}</span>
      </p>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Imperative navigation
 * -----------------------------------------------------------------------------------------------*/
const ImperativeDemo = (args: Story["args"]) => {
  const tabsRef = useRef<MorphTabsRootRef>(null);

  return (
    <div className="flex flex-col items-center gap-4">
      <PhoneFrame height={600} title="Imperative navigation">
        <MorphTabs {...args} ref={tabsRef} className="min-h-0 flex-1" defaultValue="home">
          <MorphTabs.List aria-label="Sections">
            {[...sections, {icon: "gravity-ui:square-article", label: "Notes", value: "notes"}].map(
              (section) => (
                <MorphTabs.Trigger key={section.value} value={section.value}>
                  <MorphTabs.Icon>
                    <Icon icon={section.icon} />
                  </MorphTabs.Icon>
                  <MorphTabs.Label>{section.label}</MorphTabs.Label>
                </MorphTabs.Trigger>
              ),
            )}
          </MorphTabs.List>
          <MorphTabs.Pager>
            {["home", "today", "upcoming", "notes"].map((value) => (
              <MorphTabs.Content key={value} value={value}>
                {sectionPages[value]}
              </MorphTabs.Content>
            ))}
          </MorphTabs.Pager>
        </MorphTabs>
      </PhoneFrame>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" variant="secondary" onPress={() => tabsRef.current?.goTo("notes", false)}>
          goTo(&quot;notes&quot;, false)
        </Button>
        <Button size="sm" variant="secondary" onPress={() => tabsRef.current?.goTo("home")}>
          goTo(&quot;home&quot;)
        </Button>
      </div>
    </div>
  );
};

export const ImperativeNavigation: Story = {
  render: (args) => <ImperativeDemo {...args} />,
};

/* -------------------------------------------------------------------------------------------------
 * Lazy pages
 * -----------------------------------------------------------------------------------------------*/
const MountStamp = ({name}: {name: string}) => {
  const [mountedAt] = useState(() => new Date().toLocaleTimeString());

  return (
    <SimplePage>
      {name} mounted at {mountedAt}. Unvisited pages show a spinner until you open them or start a
      swipe next to them.
    </SimplePage>
  );
};

export const LazyPages: Story = {
  args: {lazy: true},
  render: (args) => (
    <PhoneFrame height={560} title="Lazy pages">
      <MorphTabs
        {...args}
        className="min-h-0 flex-1"
        defaultValue="home"
        renderLazyPlaceholder={() => (
          <div className="flex h-full min-h-40 items-center justify-center">
            <Spinner />
          </div>
        )}
      >
        <MorphTabs.List aria-label="Sections">
          {[...sections, {icon: "gravity-ui:square-article", label: "Notes", value: "notes"}].map(
            (section) => (
              <MorphTabs.Trigger key={section.value} value={section.value}>
                <MorphTabs.Icon>
                  <Icon icon={section.icon} />
                </MorphTabs.Icon>
                <MorphTabs.Label>{section.label}</MorphTabs.Label>
              </MorphTabs.Trigger>
            ),
          )}
        </MorphTabs.List>
        <MorphTabs.Pager>
          {["Home", "Today", "Upcoming", "Notes"].map((name) => (
            <MorphTabs.Content key={name} value={name.toLowerCase()}>
              <MountStamp name={name} />
            </MorphTabs.Content>
          ))}
        </MorphTabs.Pager>
      </MorphTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * List below the pager
 * -----------------------------------------------------------------------------------------------*/
export const ListBelowThePager: Story = {
  render: (args) => (
    <PhoneFrame height={680} title="List below the pager">
      <MorphTabs {...args} className="min-h-0 flex-1" defaultValue="home">
        <MorphTabs.Pager>
          <MorphTabs.Content value="home">
            <HomePage />
          </MorphTabs.Content>
          <MorphTabs.Content value="today">
            <TodayPage />
          </MorphTabs.Content>
          <MorphTabs.Content value="notes">
            <NotesPage />
          </MorphTabs.Content>
        </MorphTabs.Pager>
        <MorphTabs.List aria-label="Sections" className="pt-2 pb-6">
          <MorphTabs.Trigger value="home">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:house" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Home</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="today">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:sun" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Today</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="notes">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:square-article" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Notes</MorphTabs.Label>
          </MorphTabs.Trigger>
        </MorphTabs.List>
      </MorphTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Pager behavior
 * -----------------------------------------------------------------------------------------------*/
export const PagerBehavior: Story = {
  render: (args) => (
    <PhoneFrame height={560} title="Pager behavior">
      <MorphTabs {...args} className="min-h-0 flex-1" defaultValue="home">
        <MorphTabs.List aria-label="Sections">
          {sections.map((section) => (
            <MorphTabs.Trigger key={section.value} value={section.value}>
              <MorphTabs.Icon>
                <Icon icon={section.icon} />
              </MorphTabs.Icon>
              <MorphTabs.Label>{section.label}</MorphTabs.Label>
            </MorphTabs.Trigger>
          ))}
        </MorphTabs.List>
        <MorphTabs.Pager isPageAnimationEnabled={false} swipeEnabled={false}>
          {sections.map((section) => (
            <MorphTabs.Content key={section.value} value={section.value}>
              <SimplePage>
                {section.label}: swiping is off and pages switch without the slide. Use the tabs (or
                the arrow keys) to move between pages.
              </SimplePage>
            </MorphTabs.Content>
          ))}
        </MorphTabs.Pager>
      </MorphTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Render function
 * -----------------------------------------------------------------------------------------------*/
const filledSections = [
  {fill: "gravity-ui:house-fill", icon: "gravity-ui:house", label: "Home", value: "home"},
  {fill: "gravity-ui:bell-fill", icon: "gravity-ui:bell", label: "Inbox", value: "inbox"},
  {fill: "gravity-ui:bookmark-fill", icon: "gravity-ui:bookmark", label: "Saved", value: "saved"},
  {fill: "gravity-ui:person-fill", icon: "gravity-ui:person", label: "Profile", value: "profile"},
];

export const RenderFunction: Story = {
  render: (args) => (
    <PhoneFrame height={560} title="Render function">
      <MorphTabs {...args} className="min-h-0 flex-1" defaultValue="home">
        <MorphTabs.List aria-label="Sections">
          {filledSections.map((section) => (
            <MorphTabs.Trigger key={section.value} value={section.value}>
              {({isSelected}) => (
                <>
                  <MorphTabs.Icon>
                    <Icon icon={isSelected ? section.fill : section.icon} />
                  </MorphTabs.Icon>
                  <MorphTabs.Label>{section.label}</MorphTabs.Label>
                </>
              )}
            </MorphTabs.Trigger>
          ))}
        </MorphTabs.List>
        <MorphTabs.Pager>
          {filledSections.map((section) => (
            <MorphTabs.Content key={section.value} value={section.value}>
              <SimplePage>The selected tab swaps its outline icon for the filled one.</SimplePage>
            </MorphTabs.Content>
          ))}
        </MorphTabs.Pager>
      </MorphTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom morph
 * -----------------------------------------------------------------------------------------------*/
const PositionReadout = () => {
  const position = useMorphTabsProgress();

  return (
    <p className="px-5 pb-4 text-xs text-muted tabular-nums">
      Pager position: {position.toFixed(2)}
    </p>
  );
};

export const CustomMorph: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <PhoneFrame height={520} title="Custom morph">
        <MorphTabs {...args} className="min-h-0 flex-1" defaultValue="home">
          <MorphTabs.List aria-label="Sections">
            <MorphTabs.Trigger animation={{flexGrow: {value: [0, 2]}}} value="home">
              <MorphTabs.Icon animation={{opacity: {value: [0.35, 1]}}}>
                <Icon icon="gravity-ui:house" />
              </MorphTabs.Icon>
              <MorphTabs.Label>Home</MorphTabs.Label>
            </MorphTabs.Trigger>
            <MorphTabs.Trigger value="today">
              <MorphTabs.Icon animation={{opacity: {value: [0.35, 1]}}}>
                <Icon icon="gravity-ui:sun" />
              </MorphTabs.Icon>
              <MorphTabs.Label>Today</MorphTabs.Label>
            </MorphTabs.Trigger>
            <MorphTabs.Trigger animation={false} value="notes">
              <MorphTabs.Icon animation={{opacity: {value: [0.35, 1]}}}>
                <Icon icon="gravity-ui:square-article" />
              </MorphTabs.Icon>
              <MorphTabs.Label>Notes</MorphTabs.Label>
            </MorphTabs.Trigger>
          </MorphTabs.List>
          <PositionReadout />
          <MorphTabs.Pager>
            <MorphTabs.Content value="home">
              <SimplePage>Home grows twice as wide and inactive icons dim to 35 %.</SimplePage>
            </MorphTabs.Content>
            <MorphTabs.Content value="today">
              <SimplePage>Today uses the default morph.</SimplePage>
            </MorphTabs.Content>
            <MorphTabs.Content value="notes">
              <SimplePage>Notes snaps its width (animation=false) instead of following.</SimplePage>
            </MorphTabs.Content>
          </MorphTabs.Pager>
        </MorphTabs>
      </PhoneFrame>
      <PhoneFrame height={520} title='animation="disable-all"'>
        <MorphTabs animation="disable-all" className="min-h-0 flex-1" defaultValue="home">
          <MorphTabs.List aria-label="Sections">
            {sections.map((section) => (
              <MorphTabs.Trigger key={section.value} value={section.value}>
                <MorphTabs.Icon>
                  <Icon icon={section.icon} />
                </MorphTabs.Icon>
                <MorphTabs.Label>{section.label}</MorphTabs.Label>
              </MorphTabs.Trigger>
            ))}
          </MorphTabs.List>
          <MorphTabs.Pager>
            {sections.map((section) => (
              <MorphTabs.Content key={section.value} value={section.value}>
                <SimplePage>
                  Pills snap to the selected state; pages switch without the slide.
                </SimplePage>
              </MorphTabs.Content>
            ))}
          </MorphTabs.Pager>
        </MorphTabs>
      </PhoneFrame>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example (docs Example section: avatar + four tabs, controlled and lazy)
 * -----------------------------------------------------------------------------------------------*/
const ExampleDemo = (args: Story["args"]) => {
  const [tab, setTab] = useState("home");

  return (
    <PhoneFrame title="Planner">
      <MorphTabs {...args} lazy className="min-h-0 flex-1" value={tab} onValueChange={setTab}>
        <MorphTabs.List aria-label="Planner sections">
          <Avatar className="size-10.5 shrink-0">
            <Avatar.Image alt="Your profile" src={AVATAR} />
            <Avatar.Fallback>MK</Avatar.Fallback>
          </Avatar>
          <MorphTabs.Trigger value="home">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:house" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Home</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="today">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:sun" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Today</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="upcoming">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:calendar" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Upcoming</MorphTabs.Label>
          </MorphTabs.Trigger>
          <MorphTabs.Trigger value="notes">
            <MorphTabs.Icon>
              <Icon icon="gravity-ui:square-article" />
            </MorphTabs.Icon>
            <MorphTabs.Label>Notes</MorphTabs.Label>
          </MorphTabs.Trigger>
        </MorphTabs.List>
        <MorphTabs.Pager>
          <MorphTabs.Content value="home">
            <HomePage />
          </MorphTabs.Content>
          <MorphTabs.Content value="today">
            <TodayPage />
          </MorphTabs.Content>
          <MorphTabs.Content value="upcoming">
            <UpcomingPage />
          </MorphTabs.Content>
          <MorphTabs.Content value="notes">
            <NotesPage />
          </MorphTabs.Content>
        </MorphTabs.Pager>
      </MorphTabs>
    </PhoneFrame>
  );
};

export const Example: Story = {
  render: (args) => <ExampleDemo {...args} />,
};
