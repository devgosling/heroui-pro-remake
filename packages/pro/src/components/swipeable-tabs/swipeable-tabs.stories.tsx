import type {SwipeableTabsPagerRef, SwipeableTabsRootRef} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button, Chip, Spinner, Switch} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {SwipeableTabs, useSwipeableTabs} from "./index";

const meta = {
  argTypes: {
    animation: {control: {type: "select"}, options: [undefined, "disable-all"]},
    isHapticFeedbackEnabled: {control: "boolean"},
    lazy: {control: "boolean"},
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: SwipeableTabs,
  parameters: {layout: "centered"},
  title: "Pro/Navigation/SwipeableTabs",
} satisfies Meta<typeof SwipeableTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story helpers
 * -----------------------------------------------------------------------------------------------*/

/** Phone-sized screen, like the Native demo recordings. */
const PhoneFrame = ({
  children,
  height = 720,
  title,
}: {
  children: ReactNode;
  height?: number;
  title?: ReactNode;
}) => (
  <div
    className="relative flex w-[390px] max-w-full flex-col overflow-hidden rounded-[2.75rem] border border-separator bg-background text-foreground shadow-overlay"
    style={{height}}
  >
    {title ? (
      <div className="flex shrink-0 items-center justify-center gap-1.5 pt-6 pb-6 text-base font-semibold">
        {title}
      </div>
    ) : (
      <div className="h-6 shrink-0" />
    )}
    {children}
  </div>
);

const Bar = ({className = ""}: {className?: string}) => (
  <div className={`h-2.5 rounded-full bg-default ${className}`} />
);

const Panel = ({children, className = ""}: {children: ReactNode; className?: string}) => (
  <div className={`rounded-3xl bg-surface p-4 shadow-surface ${className}`}>{children}</div>
);

const PageText = ({children}: {children: ReactNode}) => (
  <p className="text-sm leading-6 text-muted">{children}</p>
);

/* -------------------------------------------------------------------------------------------------
 * Basic usage
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {defaultValue: "discover", isHapticFeedbackEnabled: true, lazy: false, variant: "primary"},
  render: (args) => (
    <PhoneFrame title="Basic usage">
      <SwipeableTabs {...args} className="h-full">
        <SwipeableTabs.List aria-label="Feed" className="mx-4">
          <SwipeableTabs.Indicator />
          <SwipeableTabs.Trigger value="discover">
            <SwipeableTabs.Label>Discover</SwipeableTabs.Label>
          </SwipeableTabs.Trigger>
          <SwipeableTabs.Trigger value="following">
            <SwipeableTabs.Label>Following</SwipeableTabs.Label>
          </SwipeableTabs.Trigger>
        </SwipeableTabs.List>
        <SwipeableTabs.Pager>
          <SwipeableTabs.Content value="discover">
            <div className="flex flex-col gap-3 p-4">
              <PageText>
                Swipe the page sideways or press a tab. The pill follows your finger.
              </PageText>
              {["Trail running basics", "Five minute breakfasts", "Night sky photography"].map(
                (title) => (
                  <Panel key={title}>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="mt-1 text-xs text-muted">Suggested for you</div>
                  </Panel>
                ),
              )}
            </div>
          </SwipeableTabs.Content>
          <SwipeableTabs.Content value="following">
            <div className="flex flex-col gap-3 p-4">
              {["Mara posted a new route", "Teo shared a recipe", "Ines started a series"].map(
                (title) => (
                  <Panel key={title} className="flex items-center gap-3">
                    <div className="size-9 shrink-0 rounded-full bg-default" />
                    <div className="text-sm">{title}</div>
                  </Panel>
                ),
              )}
            </div>
          </SwipeableTabs.Content>
        </SwipeableTabs.Pager>
      </SwipeableTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
const VariantScreen = ({variant}: {variant: "primary" | "secondary"}) => (
  <PhoneFrame height={420} title={variant === "primary" ? "Primary" : "Secondary"}>
    <SwipeableTabs className="h-full" defaultValue="photos" variant={variant}>
      <SwipeableTabs.List aria-label="Library" className="mx-4">
        <SwipeableTabs.Indicator />
        <SwipeableTabs.Trigger value="photos">
          <SwipeableTabs.Label>Photos</SwipeableTabs.Label>
        </SwipeableTabs.Trigger>
        <SwipeableTabs.Trigger value="albums">
          <SwipeableTabs.Label>Albums</SwipeableTabs.Label>
        </SwipeableTabs.Trigger>
        <SwipeableTabs.Trigger value="shared">
          <SwipeableTabs.Label>Shared</SwipeableTabs.Label>
        </SwipeableTabs.Trigger>
      </SwipeableTabs.List>
      <SwipeableTabs.Pager>
        {["photos", "albums", "shared"].map((page) => (
          <SwipeableTabs.Content key={page} value={page}>
            <div className="grid grid-cols-3 gap-1.5 p-4">
              {Array.from({length: page === "photos" ? 12 : page === "albums" ? 6 : 3}, (_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-default" />
              ))}
            </div>
          </SwipeableTabs.Content>
        ))}
      </SwipeableTabs.Pager>
    </SwipeableTabs>
  </PhoneFrame>
);

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-6">
      <VariantScreen variant="primary" />
      <VariantScreen variant="secondary" />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Scrollable list
 * -----------------------------------------------------------------------------------------------*/
const genres = [
  "Top picks",
  "Jazz",
  "Electronic",
  "Classical",
  "Hip-hop",
  "Ambient",
  "Folk",
  "Soul",
  "Metal",
];

export const ScrollableList: Story = {
  render: () => (
    <PhoneFrame title="Scrollable list">
      <SwipeableTabs className="h-full" defaultValue="top-picks">
        <SwipeableTabs.List aria-label="Genres" className="mx-4 self-stretch">
          <SwipeableTabs.ScrollView scrollAlign="center">
            <SwipeableTabs.Indicator />
            {genres.map((genre) => (
              <SwipeableTabs.Trigger key={genre} value={genre.toLowerCase().replace(" ", "-")}>
                <SwipeableTabs.Label>{genre}</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
            ))}
          </SwipeableTabs.ScrollView>
        </SwipeableTabs.List>
        <SwipeableTabs.Pager>
          {genres.map((genre, index) => (
            <SwipeableTabs.Content key={genre} value={genre.toLowerCase().replace(" ", "-")}>
              <div className="flex flex-col gap-2 p-4">
                {Array.from({length: 6}, (_, track) => (
                  <div key={track} className="flex items-center gap-3 rounded-2xl p-2">
                    <div className="size-11 shrink-0 rounded-xl bg-default" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {genre} mix {index + 1}.{track + 1}
                      </span>
                      <span className="text-xs text-muted">{12 + track * 3} songs</span>
                    </div>
                  </div>
                ))}
              </div>
            </SwipeableTabs.Content>
          ))}
        </SwipeableTabs.Pager>
      </SwipeableTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Separators
 * -----------------------------------------------------------------------------------------------*/
export const Separators: Story = {
  render: () => (
    <PhoneFrame height={420} title="Separators">
      <SwipeableTabs className="h-full" defaultValue="day">
        <SwipeableTabs.List aria-label="Range" className="mx-4">
          <SwipeableTabs.Indicator />
          <SwipeableTabs.Trigger value="day">
            <SwipeableTabs.Label>Day</SwipeableTabs.Label>
          </SwipeableTabs.Trigger>
          <SwipeableTabs.Separator betweenValues={["day", "week"]} />
          <SwipeableTabs.Trigger value="week">
            <SwipeableTabs.Label>Week</SwipeableTabs.Label>
          </SwipeableTabs.Trigger>
          <SwipeableTabs.Separator betweenValues={["week", "month"]} />
          <SwipeableTabs.Trigger value="month">
            <SwipeableTabs.Label>Month</SwipeableTabs.Label>
          </SwipeableTabs.Trigger>
          <SwipeableTabs.Separator betweenValues={["month", "year"]} />
          <SwipeableTabs.Trigger value="year">
            <SwipeableTabs.Label>Year</SwipeableTabs.Label>
          </SwipeableTabs.Trigger>
        </SwipeableTabs.List>
        <SwipeableTabs.Pager>
          {["day", "week", "month", "year"].map((range) => (
            <SwipeableTabs.Content key={range} value={range}>
              <div className="p-4">
                <Panel>
                  <div className="text-xs text-muted">Steps this {range}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {{day: "8,412", month: "241,930", week: "57,208", year: "2.9M"}[range]}
                  </div>
                </Panel>
              </div>
            </SwipeableTabs.Content>
          ))}
        </SwipeableTabs.Pager>
      </SwipeableTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
const stages = ["backlog", "doing", "review", "done"];

export const Controlled: Story = {
  render: () => {
    const [stage, setStage] = React.useState("doing");

    return (
      <div className="flex flex-col items-center gap-4">
        <PhoneFrame height={460} title="Controlled">
          <SwipeableTabs className="h-full" value={stage} onValueChange={setStage}>
            <SwipeableTabs.List aria-label="Board column" className="mx-4">
              <SwipeableTabs.Indicator />
              {stages.map((item) => (
                <SwipeableTabs.Trigger key={item} value={item}>
                  <SwipeableTabs.Label className="capitalize">{item}</SwipeableTabs.Label>
                </SwipeableTabs.Trigger>
              ))}
            </SwipeableTabs.List>
            <SwipeableTabs.Pager>
              {stages.map((item, index) => (
                <SwipeableTabs.Content key={item} value={item}>
                  <div className="flex flex-col gap-2 p-4">
                    {Array.from({length: 4 - index}, (_, card) => (
                      <Panel key={card} className="text-sm">
                        Card {card + 1} in <span className="capitalize">{item}</span>
                      </Panel>
                    ))}
                  </div>
                </SwipeableTabs.Content>
              ))}
            </SwipeableTabs.Pager>
          </SwipeableTabs>
        </PhoneFrame>
        <div className="flex items-center gap-2">
          <Button
            isDisabled={stages.indexOf(stage) === 0}
            size="sm"
            variant="secondary"
            onPress={() => setStage(stages[stages.indexOf(stage) - 1] ?? stage)}
          >
            Previous
          </Button>
          <span className="w-24 text-center text-sm text-muted">
            value: <span className="font-medium text-foreground">{stage}</span>
          </span>
          <Button
            isDisabled={stages.indexOf(stage) === stages.length - 1}
            size="sm"
            variant="secondary"
            onPress={() => setStage(stages[stages.indexOf(stage) + 1] ?? stage)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Imperative navigation
 * -----------------------------------------------------------------------------------------------*/
export const ImperativeNavigation: Story = {
  render: () => {
    const tabsRef = React.useRef<SwipeableTabsRootRef>(null);
    const pagerRef = React.useRef<SwipeableTabsPagerRef>(null);

    return (
      <div className="flex flex-col items-center gap-4">
        <PhoneFrame height={420} title="Imperative navigation">
          <SwipeableTabs ref={tabsRef} className="h-full" defaultValue="inbox">
            <SwipeableTabs.List aria-label="Mail" className="mx-4">
              <SwipeableTabs.Indicator />
              <SwipeableTabs.Trigger value="inbox">
                <SwipeableTabs.Label>Inbox</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
              <SwipeableTabs.Trigger value="drafts">
                <SwipeableTabs.Label>Drafts</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
              <SwipeableTabs.Trigger value="settings">
                <SwipeableTabs.Label>Settings</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
            </SwipeableTabs.List>
            <SwipeableTabs.Pager ref={pagerRef}>
              {["inbox", "drafts", "settings"].map((page) => (
                <SwipeableTabs.Content key={page} value={page}>
                  <div className="p-4">
                    <PageText>
                      This is the <span className="font-medium text-foreground">{page}</span> page.
                    </PageText>
                  </div>
                </SwipeableTabs.Content>
              ))}
            </SwipeableTabs.Pager>
          </SwipeableTabs>
        </PhoneFrame>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="secondary" onPress={() => tabsRef.current?.goTo("inbox")}>
            goTo("inbox")
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => tabsRef.current?.goTo("settings", false)}
          >
            goTo("settings", false)
          </Button>
          <Button size="sm" variant="secondary" onPress={() => pagerRef.current?.setPage(1)}>
            Pager setPage(1)
          </Button>
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Lazy pages
 * -----------------------------------------------------------------------------------------------*/
const MountLogger = ({onMount, page}: {onMount: (page: string) => void; page: string}) => {
  React.useEffect(() => onMount(page), [onMount, page]);

  return (
    <div className="p-4">
      <Panel>
        <div className="text-sm font-medium capitalize">{page}</div>
        <div className="mt-1 text-xs text-muted">Mounted the first time it was shown.</div>
      </Panel>
    </div>
  );
};

export const LazyPages: Story = {
  render: () => {
    const [mounted, setMounted] = React.useState<string[]>([]);
    const handleMount = React.useCallback(
      (page: string) =>
        setMounted((previous) => (previous.includes(page) ? previous : [...previous, page])),
      [],
    );
    const pages = ["today", "tomorrow", "weekend", "later"];

    return (
      <div className="flex flex-col items-center gap-4">
        <PhoneFrame height={420} title="Lazy pages">
          <SwipeableTabs
            lazy
            className="h-full"
            defaultValue="today"
            renderLazyPlaceholder={() => <Spinner size="sm" />}
          >
            <SwipeableTabs.List aria-label="Schedule" className="mx-4">
              <SwipeableTabs.Indicator />
              {pages.map((page) => (
                <SwipeableTabs.Trigger key={page} value={page}>
                  <SwipeableTabs.Label className="capitalize">{page}</SwipeableTabs.Label>
                </SwipeableTabs.Trigger>
              ))}
            </SwipeableTabs.List>
            <SwipeableTabs.Pager>
              {pages.map((page) => (
                <SwipeableTabs.Content key={page} value={page}>
                  <MountLogger page={page} onMount={handleMount} />
                </SwipeableTabs.Content>
              ))}
            </SwipeableTabs.Pager>
          </SwipeableTabs>
        </PhoneFrame>
        <span className="text-sm text-muted">
          Mounted: <span className="font-medium text-foreground">{mounted.join(", ")}</span>
        </span>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Pager behavior
 * -----------------------------------------------------------------------------------------------*/
export const PagerBehavior: Story = {
  render: () => {
    const [swipeEnabled, setSwipeEnabled] = React.useState(false);
    const [isPageAnimationEnabled, setPageAnimationEnabled] = React.useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <PhoneFrame height={420} title="Pager behavior">
          <SwipeableTabs className="h-full" defaultValue="summary">
            <SwipeableTabs.List aria-label="Order" className="mx-4">
              <SwipeableTabs.Indicator />
              <SwipeableTabs.Trigger value="summary">
                <SwipeableTabs.Label>Summary</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
              <SwipeableTabs.Trigger value="shipping">
                <SwipeableTabs.Label>Shipping</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
              <SwipeableTabs.Trigger value="payment">
                <SwipeableTabs.Label>Payment</SwipeableTabs.Label>
              </SwipeableTabs.Trigger>
            </SwipeableTabs.List>
            <SwipeableTabs.Pager
              isPageAnimationEnabled={isPageAnimationEnabled}
              swipeEnabled={swipeEnabled}
            >
              {["summary", "shipping", "payment"].map((page) => (
                <SwipeableTabs.Content key={page} value={page}>
                  <div className="p-4">
                    <PageText>
                      {swipeEnabled
                        ? "Swiping is on."
                        : "Swiping is off: use the tabs (or the arrow keys) to switch pages."}{" "}
                      {isPageAnimationEnabled
                        ? "Presses slide to the page."
                        : "Presses jump without the slide."}
                    </PageText>
                  </div>
                </SwipeableTabs.Content>
              ))}
            </SwipeableTabs.Pager>
          </SwipeableTabs>
        </PhoneFrame>
        <div className="flex gap-6">
          <Switch isSelected={swipeEnabled} size="sm" onChange={setSwipeEnabled}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              swipeEnabled
            </Switch.Content>
          </Switch>
          <Switch isSelected={isPageAnimationEnabled} size="sm" onChange={setPageAnimationEnabled}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              isPageAnimationEnabled
            </Switch.Content>
          </Switch>
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Indicator without swipe tracking
 * -----------------------------------------------------------------------------------------------*/
export const IndicatorWithoutSwipeTracking: Story = {
  render: () => {
    const [disableAll, setDisableAll] = React.useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <PhoneFrame height={420} title="Indicator without swipe tracking">
          <SwipeableTabs
            animation={disableAll ? "disable-all" : undefined}
            className="h-full"
            defaultValue="north"
          >
            <SwipeableTabs.List aria-label="Region" className="mx-4">
              <SwipeableTabs.Indicator animation="disabled" />
              {["north", "east", "south", "west"].map((region) => (
                <SwipeableTabs.Trigger key={region} value={region}>
                  <SwipeableTabs.Label className="capitalize">{region}</SwipeableTabs.Label>
                </SwipeableTabs.Trigger>
              ))}
            </SwipeableTabs.List>
            <SwipeableTabs.Pager>
              {["north", "east", "south", "west"].map((region) => (
                <SwipeableTabs.Content key={region} value={region}>
                  <div className="p-4">
                    <PageText>
                      The indicator snaps to the selected trigger once the{" "}
                      <span className="font-medium text-foreground">{region}</span> page settles.
                    </PageText>
                  </div>
                </SwipeableTabs.Content>
              ))}
            </SwipeableTabs.Pager>
          </SwipeableTabs>
        </PhoneFrame>
        <Switch isSelected={disableAll} size="sm" onChange={setDisableAll}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            animation="disable-all" on the root
          </Switch.Content>
        </Switch>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * useSwipeableTabs (progress hook)
 * -----------------------------------------------------------------------------------------------*/
const PageDots = () => {
  const {goTo, progress, values} = useSwipeableTabs();

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {values.map((page, index) => {
        const closeness = Math.max(0, 1 - Math.abs(progress - index));

        return (
          <button
            key={page}
            aria-label={`Go to ${page}`}
            className="h-2 rounded-full bg-accent outline-none focus-visible:ring-2 focus-visible:ring-focus"
            style={{opacity: 0.25 + closeness * 0.75, width: 8 + closeness * 16}}
            type="button"
            onClick={() => goTo(page)}
          />
        );
      })}
      <span className="ms-2 w-10 text-xs text-muted tabular-nums">{progress.toFixed(2)}</span>
    </div>
  );
};

export const ProgressHook: Story = {
  render: () => (
    <PhoneFrame height={460} title="useSwipeableTabs">
      <SwipeableTabs className="h-full" defaultValue="welcome">
        <SwipeableTabs.List aria-label="Onboarding" className="mx-4">
          <SwipeableTabs.Indicator />
          {["welcome", "sync", "privacy"].map((page) => (
            <SwipeableTabs.Trigger key={page} value={page}>
              <SwipeableTabs.Label className="capitalize">{page}</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
          ))}
        </SwipeableTabs.List>
        <SwipeableTabs.Pager>
          {[
            {icon: "gravity-ui:hand-ok", page: "welcome", text: "Glad you are here."},
            {icon: "gravity-ui:arrows-rotate-right", page: "sync", text: "Your notes follow you."},
            {icon: "gravity-ui:shield-check", page: "privacy", text: "Only you can read them."},
          ].map(({icon, page, text}) => (
            <SwipeableTabs.Content key={page} value={page}>
              <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                <Icon className="size-12 text-accent" icon={icon} />
                <span className="text-sm text-muted">{text}</span>
              </div>
            </SwipeableTabs.Content>
          ))}
        </SwipeableTabs.Pager>
        <PageDots />
      </SwipeableTabs>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example (docs): controlled + lazy account screen
 * -----------------------------------------------------------------------------------------------*/
export const Example: Story = {
  render: () => {
    const [tab, setTab] = React.useState("summary");

    return (
      <PhoneFrame title="Account">
        <SwipeableTabs lazy className="h-full" value={tab} onValueChange={setTab}>
          <SwipeableTabs.List aria-label="Account" className="mx-4">
            <SwipeableTabs.Indicator />
            <SwipeableTabs.Trigger value="summary">
              <SwipeableTabs.Label>Summary</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
            <SwipeableTabs.Trigger value="history">
              <SwipeableTabs.Label>History</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
            <SwipeableTabs.Trigger value="preferences">
              <SwipeableTabs.Label>Preferences</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
          </SwipeableTabs.List>
          <SwipeableTabs.Pager>
            <SwipeableTabs.Content value="summary">
              <div className="flex flex-col gap-4 p-4">
                <Panel>
                  <div className="text-xs text-muted">Balance</div>
                  <div className="mt-1 text-3xl font-semibold tabular-nums">$4,280.15</div>
                  <Chip className="mt-3" color="success" size="sm" variant="soft">
                    +3.2% this month
                  </Chip>
                </Panel>
                <div className="grid grid-cols-2 gap-4">
                  <Panel>
                    <div className="text-xs text-muted">Income</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">$6,900</div>
                  </Panel>
                  <Panel>
                    <div className="text-xs text-muted">Spent</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">$2,619</div>
                  </Panel>
                </div>
              </div>
            </SwipeableTabs.Content>
            <SwipeableTabs.Content value="history">
              <div className="p-4">
                <Panel className="flex flex-col divide-y divide-separator p-0">
                  {[
                    {amount: "-$42.10", label: "Groceries", when: "Today"},
                    {amount: "+$1,200.00", label: "Salary", when: "Yesterday"},
                    {amount: "-$9.99", label: "Music plan", when: "Mon"},
                    {amount: "-$64.00", label: "Train tickets", when: "Sun"},
                    {amount: "-$18.50", label: "Lunch", when: "Sat"},
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{row.label}</span>
                        <span className="text-xs text-muted">{row.when}</span>
                      </div>
                      <span className="text-sm tabular-nums">{row.amount}</span>
                    </div>
                  ))}
                </Panel>
              </div>
            </SwipeableTabs.Content>
            <SwipeableTabs.Content value="preferences">
              <p className="p-4 text-foreground">Preferences</p>
            </SwipeableTabs.Content>
          </SwipeableTabs.Pager>
        </SwipeableTabs>
      </PhoneFrame>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Planner (the Native demo screen: four skeleton pages under a primary tab list)
 * -----------------------------------------------------------------------------------------------*/
const Divider = () => <div className="h-px bg-separator" />;

const IconRow = ({wide}: {wide?: boolean}) => (
  <div className="flex items-center gap-3 py-3">
    <div className="size-9 shrink-0 rounded-xl bg-default" />
    <div className="flex flex-1 flex-col gap-2">
      <Bar className={wide ? "h-3 w-28" : "h-3 w-24"} />
      <Bar className="h-2 w-14" />
    </div>
    <Bar className="h-3 w-8" />
  </div>
);

const HomePage = () => (
  <div className="flex flex-col gap-3 p-4">
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((card) => (
        <Panel key={card} className="flex flex-col">
          <div className="size-9 rounded-full bg-default" />
          <Bar className="mt-5 h-4 w-12" />
          <Bar className="mt-2 h-2 w-24" />
        </Panel>
      ))}
    </div>
    <Panel className="flex flex-col py-1">
      <IconRow wide />
      <Divider />
      <IconRow wide />
      <Divider />
      <IconRow wide />
    </Panel>
    <Panel className="flex flex-col py-1">
      <IconRow />
      <Divider />
      <IconRow />
    </Panel>
  </div>
);

const CheckRow = ({wide}: {wide?: boolean}) => (
  <div className="flex items-center gap-3 py-3">
    <div className="size-6 shrink-0 rounded-full border-[1.5px] border-muted/30" />
    <div className="flex flex-1 flex-col gap-2">
      <Bar className={wide ? "h-3 w-52" : "h-3 w-44"} />
      <Bar className="h-2 w-24" />
    </div>
  </div>
);

const TodayPage = () => (
  <div className="flex flex-col gap-3 p-4">
    <Panel className="flex items-center gap-4 py-5">
      <div className="size-19 shrink-0 rounded-full border-[5px] border-default" />
      <div className="flex flex-1 flex-col gap-2.5">
        <Bar className="h-4 w-36" />
        <Bar className="h-2 w-full" />
        <Bar className="h-2 w-28" />
      </div>
    </Panel>
    <div className="grid grid-cols-4 gap-2">
      {[0, 1, 2, 3].map((chip) => (
        <div key={chip} className="h-9.5 rounded-2xl bg-surface shadow-surface" />
      ))}
    </div>
    <Panel className="flex flex-col py-1">
      {[0, 1, 2, 3].map((row) => (
        <React.Fragment key={row}>
          {row > 0 ? <Divider /> : null}
          <CheckRow wide={row % 2 === 0} />
        </React.Fragment>
      ))}
    </Panel>
  </div>
);

const UpcomingPage = () => (
  <div className="flex flex-col gap-3 p-4">
    {["Tomorrow", "Next week", "Someday"].map((section) => (
      <div key={section} className="flex flex-col gap-3 pb-3">
        <span className="text-base font-semibold">{section}</span>
        <Panel className="flex flex-col py-1">
          <CheckRow wide />
          <Divider />
          <CheckRow wide />
        </Panel>
      </div>
    ))}
  </div>
);

const NotesPage = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {[0, 1, 2, 3, 4, 5].map((note) => (
      <Panel key={note} className="flex h-35 flex-col gap-2.5">
        <Bar className="h-3.5 w-24" />
        <Bar className="h-2.5 w-full" />
        <Bar className="h-2.5 w-4/5" />
        <Bar className="h-2.5 w-1/2" />
      </Panel>
    ))}
  </div>
);

export const Planner: Story = {
  args: {defaultValue: "home", variant: "primary"},
  render: (args) => {
    const [variant, setVariant] = React.useState(args.variant ?? "primary");

    return (
      <PhoneFrame
        height={760}
        title={
          <>
            Planner
            <Chip color="accent" size="sm" variant="primary">
              Demo
            </Chip>
          </>
        }
      >
        <SwipeableTabs {...args} className="min-h-0 flex-1" variant={variant}>
          <SwipeableTabs.List aria-label="Planner" className="mx-4">
            <SwipeableTabs.Indicator />
            <SwipeableTabs.Trigger value="home">
              <SwipeableTabs.Label>Home</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
            <SwipeableTabs.Trigger value="today">
              <SwipeableTabs.Label>Today</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
            <SwipeableTabs.Trigger value="upcoming">
              <SwipeableTabs.Label>Upcoming</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
            <SwipeableTabs.Trigger value="notes">
              <SwipeableTabs.Label>Notes</SwipeableTabs.Label>
            </SwipeableTabs.Trigger>
          </SwipeableTabs.List>
          <SwipeableTabs.Pager>
            <SwipeableTabs.Content value="home">
              <HomePage />
            </SwipeableTabs.Content>
            <SwipeableTabs.Content value="today">
              <TodayPage />
            </SwipeableTabs.Content>
            <SwipeableTabs.Content value="upcoming">
              <UpcomingPage />
            </SwipeableTabs.Content>
            <SwipeableTabs.Content value="notes">
              <NotesPage />
            </SwipeableTabs.Content>
          </SwipeableTabs.Pager>
        </SwipeableTabs>
        <div className="flex shrink-0 items-center px-5 pt-2 pb-6">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setVariant(variant === "primary" ? "secondary" : "primary")}
          >
            <Icon icon="gravity-ui:bars" />
            <span className="capitalize">{variant}</span>
          </Button>
        </div>
      </PhoneFrame>
    );
  },
};
