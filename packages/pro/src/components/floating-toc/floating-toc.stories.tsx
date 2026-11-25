import type {Key} from "@heroui/react";
import type {Meta, StoryObj} from "@storybook/react";
import type {CSSProperties} from "react";

import {Button} from "@heroui/react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ListBox, ListBoxItem} from "react-aria-components/ListBox";
import {ListLayout, Virtualizer} from "react-aria-components/Virtualizer";

import {FloatingToc} from "./index";

const meta = {
  argTypes: {
    closeDelay: {control: {min: 0, step: 50, type: "number"}},
    openDelay: {control: {min: 0, step: 50, type: "number"}},
    placement: {control: {type: "inline-radio"}, options: ["right", "left"]},
    triggerMode: {control: {type: "inline-radio"}, options: ["hover", "press"]},
  },
  component: FloatingToc,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/FloatingTOC",
} satisfies Meta<typeof FloatingToc>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story data (helpers stay non-exported)
 * -----------------------------------------------------------------------------------------------*/
type Entry = {id: string; label: string; level?: number};

const flatEntries: Entry[] = [
  {id: "summary", label: "Summary"},
  {id: "requirements", label: "Requirements"},
  {id: "first-steps", label: "First steps"},
  {id: "environment", label: "Environment"},
  {id: "cli", label: "CLI commands"},
  {id: "known-issues", label: "Known issues"},
];

const nestedEntries: Entry[] = [
  {id: "philosophy", label: "Our philosophy"},
  {id: "small-parts", label: "Small parts", level: 2},
  {id: "plain-language", label: "Plain language", level: 2},
  {id: "onboarding", label: "Onboarding"},
  {id: "accounts", label: "Accounts", level: 2},
  {id: "workspace", label: "Workspace setup", level: 2},
  {id: "building-blocks", label: "Building blocks"},
  {id: "grids", label: "Grids and stacks", level: 2},
  {id: "controls", label: "Controls", level: 2},
  {id: "toggles", label: "Toggles & switches", level: 3},
  {id: "inputs", label: "Text inputs", level: 3},
  {id: "visuals", label: "Visual output", level: 2},
  {id: "lists", label: "Lists", level: 3},
  {id: "graphs", label: "Graphs", level: 3},
  {id: "styling", label: "Styling"},
  {id: "palettes", label: "Palettes", level: 2},
  {id: "night-mode", label: "Night mode", level: 2},
  {id: "recipes", label: "Recipes"},
  {id: "release-notes", label: "Release notes"},
];

const pageSections = [
  {
    body: "A quick tour of what this handbook covers, who it is written for and how the chapters build on each other. Skim it once, then jump straight to the part you need. Every chapter stands on its own, so there is no need to read them in order or to finish one before starting the next.",
    id: "welcome",
    label: "Welcome",
  },
  {
    body: "Add the package with the package manager your team already uses. Nothing else is required: styles ship with the components and pick up your theme tokens automatically. Restart the dev server afterwards so the bundler notices the new dependency and picks up the stylesheet.",
    id: "setup",
    label: "Setup",
  },
  {
    body: "Every part is a small, composable building block with predictable props. Combine them freely, override a class when you need to, and keep the defaults when you do not. Each part documents the props it accepts, the data attributes it exposes and the classes you can target from your own stylesheet.",
    id: "reference",
    label: "Reference",
  },
  {
    body: "Worked examples taken from real products: settings screens, dashboards and onboarding flows. Each one lists the parts it uses so you can lift the pattern into your own app. The examples are intentionally plain, so swapping in your own data, copy and icons takes minutes rather than hours of untangling.",
    id: "showcase",
    label: "Showcase",
  },
  {
    body: "Short answers to the questions that come up most often, from upgrading between versions to customising focus rings and supporting right-to-left layouts. If your question is not listed here, open a discussion and somebody from the team will usually reply within a day.",
    id: "questions",
    label: "Questions",
  },
];

const filler =
  "Short paragraphs keep the page easy to scan. This one only stands in for real copy so the column is tall enough to scroll and the active entry has somewhere to move to. Replace it with the real section content once the structure of the page settles down.";

/** Index of the top-level entry an entry belongs to. */
function getTopLevelIndex(entries: Entry[], index: number) {
  for (let i = index; i >= 0; i--) {
    if ((entries[i]?.level ?? 1) === 1) return i;
  }

  return 0;
}

/**
 * Scroll-spy for a scroll container: the active section is the last one whose top has passed the
 * reading line. Clicking an entry scrolls its section into view and pins it until that scroll ends.
 */
function useScrollSpy(count: number, initial = 0) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const pinnedRef = useRef(false);
  const pinTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [active, setActive] = useState(initial);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const update = () => {
      if (pinnedRef.current) return;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;

      if (atBottom) {
        setActive(count - 1);

        return;
      }
      // Reading line a third of the way down, so short final sections can still become active.
      const line = container.getBoundingClientRect().top + container.clientHeight / 3;
      let next = 0;

      sectionRefs.current.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= line) next = index;
      });
      setActive(next);
    };

    const release = () => {
      clearTimeout(pinTimerRef.current);
      pinnedRef.current = false;
    };

    container.addEventListener("scroll", update, {passive: true});
    container.addEventListener("scrollend", release);

    return () => {
      clearTimeout(pinTimerRef.current);
      container.removeEventListener("scroll", update);
      container.removeEventListener("scrollend", release);
    };
  }, [count]);

  const scrollTo = useCallback((index: number) => {
    const container = containerRef.current;
    const section = sectionRefs.current[index];

    setActive(index);
    if (!container || !section) return;

    // Keep the clicked entry active while the smooth scroll runs (released on `scrollend`, or
    // after a second when the container cannot scroll any further).
    pinnedRef.current = true;
    clearTimeout(pinTimerRef.current);
    pinTimerRef.current = setTimeout(() => (pinnedRef.current = false), 1000);

    const top =
      section.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      parseFloat(getComputedStyle(container).paddingTop);

    container.scrollTo({behavior: "smooth", top});
  }, []);

  const registerSection = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      sectionRefs.current[index] = node;
    },
    [],
  );

  return {active, containerRef, registerSection, scrollTo};
}

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: function Render(args) {
    const [active, setActive] = useState(0);

    return (
      <div className="px-10 py-24">
        <FloatingToc {...args}>
          <FloatingToc.Trigger aria-label="Table of contents">
            {flatEntries.map((entry, index) => (
              <FloatingToc.Bar key={entry.id} active={index === active} />
            ))}
          </FloatingToc.Trigger>
          <FloatingToc.Content>
            {flatEntries.map((entry, index) => (
              <FloatingToc.Item
                key={entry.id}
                active={index === active}
                onClick={() => setActive(index)}
              >
                {entry.label}
              </FloatingToc.Item>
            ))}
          </FloatingToc.Content>
        </FloatingToc>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * In page context
 * -----------------------------------------------------------------------------------------------*/
export const InPageContext: Story = {
  render: function Render() {
    const {active, containerRef, registerSection, scrollTo} = useScrollSpy(pageSections.length);

    return (
      <div className="relative h-[420px] w-[640px] overflow-hidden rounded-xl border border-border">
        <div ref={containerRef} className="h-full overflow-auto p-8 pr-16">
          {pageSections.map((section, index) => (
            <div key={section.id} ref={registerSection(index)} className="mb-10 last:mb-0">
              <h2 className={`text-base font-semibold ${index === active ? "text-accent" : ""}`}>
                {section.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          <FloatingToc>
            <FloatingToc.Trigger aria-label="Table of contents">
              {pageSections.map((section, index) => (
                <FloatingToc.Bar key={section.id} active={index === active} />
              ))}
            </FloatingToc.Trigger>
            <FloatingToc.Content>
              {pageSections.map((section, index) => (
                <FloatingToc.Item
                  key={section.id}
                  active={index === active}
                  onClick={() => scrollTo(index)}
                >
                  {section.label}
                </FloatingToc.Item>
              ))}
            </FloatingToc.Content>
          </FloatingToc>
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Hierarchical
 * -----------------------------------------------------------------------------------------------*/
function NestedToc({
  initialActive,
  placement,
  triggerMode,
  withHeading,
}: {
  initialActive: number;
  placement?: "left" | "right";
  triggerMode?: "hover" | "press";
  withHeading?: boolean;
}) {
  const [active, setActive] = useState(initialActive);

  return (
    <FloatingToc placement={placement} triggerMode={triggerMode}>
      <FloatingToc.Trigger aria-label="Table of contents">
        {nestedEntries.map((entry, index) => (
          <FloatingToc.Bar key={entry.id} active={index === active} level={entry.level} />
        ))}
      </FloatingToc.Trigger>
      <FloatingToc.Content>
        {withHeading ? (
          <span className="mb-1 block px-3 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
            On this page
          </span>
        ) : null}
        {nestedEntries.map((entry, index) => (
          <FloatingToc.Item
            key={entry.id}
            active={index === active}
            level={entry.level}
            onClick={() => setActive(index)}
          >
            {entry.label}
          </FloatingToc.Item>
        ))}
      </FloatingToc.Content>
    </FloatingToc>
  );
}

export const Hierarchical: Story = {
  render: () => (
    <div className="px-10 py-10">
      <NestedToc withHeading initialActive={9} />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Left placement / left aligned bars
 * -----------------------------------------------------------------------------------------------*/
function FlatToc({placement}: {placement?: "left" | "right"}) {
  const [active, setActive] = useState(0);

  return (
    <FloatingToc placement={placement}>
      <FloatingToc.Trigger aria-label="Table of contents">
        {flatEntries.map((entry, index) => (
          <FloatingToc.Bar key={entry.id} active={index === active} />
        ))}
      </FloatingToc.Trigger>
      <FloatingToc.Content>
        {flatEntries.map((entry, index) => (
          <FloatingToc.Item
            key={entry.id}
            active={index === active}
            onClick={() => setActive(index)}
          >
            {entry.label}
          </FloatingToc.Item>
        ))}
      </FloatingToc.Content>
    </FloatingToc>
  );
}

export const LeftPlacement: Story = {
  render: () => (
    <div className="px-10 py-24">
      <FlatToc placement="left" />
    </div>
  ),
};

export const LeftAlignedBars: Story = {
  render: () => (
    <div className="px-10 py-24">
      {/* `placement="left"` also aligns the bars to the start edge of the trigger. */}
      <FlatToc placement="left" />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Press mode
 * -----------------------------------------------------------------------------------------------*/
export const PressMode: Story = {
  render: () => (
    <div className="px-10 py-10">
      <NestedToc withHeading initialActive={0} placement="left" triggerMode="press" />
    </div>
  ),
};

export const PressModeInPage: Story = {
  render: function Render() {
    const topLevel = useMemo(
      () =>
        nestedEntries
          .map((entry, index) => ({...entry, index}))
          .filter((entry) => (entry.level ?? 1) === 1),
      [],
    );
    const [active, setActive] = useState(6);
    const activeTop = getTopLevelIndex(nestedEntries, active);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const select = (index: number) => {
      setActive(index);
      const top = getTopLevelIndex(nestedEntries, index);

      containerRef.current
        ?.querySelector<HTMLElement>(`[data-section="${nestedEntries[top]?.id}"]`)
        ?.scrollIntoView({behavior: "smooth", block: "nearest"});
    };

    return (
      <div className="relative h-[520px] w-[640px] overflow-hidden rounded-xl border border-border">
        <div ref={containerRef} className="h-full overflow-auto p-8 pl-16">
          {topLevel.map((entry) => (
            <div key={entry.id} className="mb-10 last:mb-0" data-section={entry.id}>
              <h2
                className={`text-base font-semibold ${entry.index === activeTop ? "text-accent" : ""}`}
              >
                {entry.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{filler}</p>
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-3 -translate-y-1/2">
          <FloatingToc placement="left" triggerMode="press">
            <FloatingToc.Trigger aria-label="Table of contents">
              {nestedEntries.map((entry, index) => (
                <FloatingToc.Bar key={entry.id} active={index === active} level={entry.level} />
              ))}
            </FloatingToc.Trigger>
            <FloatingToc.Content>
              <span className="mb-1 block px-3 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
                On this page
              </span>
              {nestedEntries.map((entry, index) => (
                <FloatingToc.Item
                  key={entry.id}
                  active={index === active}
                  level={entry.level}
                  onClick={() => select(index)}
                >
                  {entry.label}
                </FloatingToc.Item>
              ))}
            </FloatingToc.Content>
          </FloatingToc>
        </div>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Custom delays
 * -----------------------------------------------------------------------------------------------*/
const delayPresets = [
  {closeDelay: 0, label: "No delay", openDelay: 0},
  {closeDelay: 300, label: "Default (200 / 300)", openDelay: 200},
  {closeDelay: 500, label: "Relaxed (600 / 500)", openDelay: 600},
];

export const CustomDelays: Story = {
  render: function Render() {
    // One active entry shared by the three TOCs: picking an entry in one updates all of them.
    const [active, setActive] = useState(0);

    return (
      <div className="flex items-center gap-12 px-10 py-24">
        {delayPresets.map((preset) => (
          <div key={preset.label} className="flex flex-col items-center gap-3">
            <span className="text-xs text-muted">{preset.label}</span>
            <FloatingToc closeDelay={preset.closeDelay} openDelay={preset.openDelay}>
              <FloatingToc.Trigger aria-label="Table of contents">
                {flatEntries.map((entry, index) => (
                  <FloatingToc.Bar key={entry.id} active={index === active} />
                ))}
              </FloatingToc.Trigger>
              <FloatingToc.Content>
                {flatEntries.map((entry, index) => (
                  <FloatingToc.Item
                    key={entry.id}
                    active={index === active}
                    onClick={() => setActive(index)}
                  >
                    {entry.label}
                  </FloatingToc.Item>
                ))}
              </FloatingToc.Content>
            </FloatingToc>
          </div>
        ))}
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
export const Controlled: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    return (
      <div className="px-10 py-24">
        <div className="mb-6 flex items-center gap-3">
          <Button size="sm" variant="outline" onPress={() => setOpen((value) => !value)}>
            {open ? "Hide" : "Show"} contents
          </Button>
          <span className="inline-block w-24 text-sm text-muted">
            State: <strong>{open ? "open" : "closed"}</strong>
          </span>
        </div>
        <FloatingToc open={open} onOpenChange={setOpen}>
          <FloatingToc.Trigger aria-label="Table of contents">
            {flatEntries.map((entry, index) => (
              <FloatingToc.Bar key={entry.id} active={index === active} />
            ))}
          </FloatingToc.Trigger>
          <FloatingToc.Content>
            {flatEntries.map((entry, index) => (
              <FloatingToc.Item
                key={entry.id}
                active={index === active}
                onClick={() => setActive(index)}
              >
                {entry.label}
              </FloatingToc.Item>
            ))}
          </FloatingToc.Content>
        </FloatingToc>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Virtualized
 * -----------------------------------------------------------------------------------------------*/
const chapters = [
  "Overview",
  "Scoping",
  "Research",
  "Wireframes",
  "Prototyping",
  "Visual design",
  "Copywriting",
  "Handoff",
  "Frontend",
  "Backend",
  "Storage",
  "Queues",
  "Search",
  "Payments",
  "Notifications",
  "Analytics",
  "Experiments",
  "Support",
  "Billing",
  "Retirement",
];

const manyEntries: Entry[] = chapters.flatMap((chapter, chapterIndex) => {
  const steps = (chapterIndex % 3) + 2;
  const children: Entry[] = [];

  for (let step = 1; step <= steps; step++) {
    children.push({id: `c${chapterIndex}-s${step}`, label: `${chapter}: step ${step}`, level: 2});
    if (step % 2 === 1) {
      children.push({id: `c${chapterIndex}-s${step}-n`, label: "Checklist", level: 3});
    }
  }

  return [{id: `c${chapterIndex}`, label: chapter}, ...children];
});

const manyTopLevel = manyEntries
  .map((entry, index) => ({...entry, index}))
  .filter((entry) => (entry.level ?? 1) === 1);

const listLayoutOptions = {padding: 6, rowHeight: 32};

export const Virtualized: Story = {
  render: function Render() {
    const [activeId, setActiveId] = useState<Key>(manyEntries[0]!.id);
    const activeIndex = manyEntries.findIndex((entry) => entry.id === activeId);
    const activeTop = getTopLevelIndex(manyEntries, activeIndex);

    return (
      <div className="px-10 py-10">
        <FloatingToc triggerMode="press">
          <FloatingToc.Trigger aria-label="Table of contents">
            {manyTopLevel.map((entry) => (
              <FloatingToc.Bar key={entry.id} active={entry.index === activeTop} />
            ))}
          </FloatingToc.Trigger>
          <FloatingToc.Content className="w-72 overflow-hidden !p-0">
            <span className="block px-3 pt-2.5 pb-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
              Contents ({manyEntries.length} items)
            </span>
            <Virtualizer layout={ListLayout} layoutOptions={listLayoutOptions}>
              <ListBox
                disallowEmptySelection
                aria-label="Table of contents"
                className="block h-[320px] overflow-auto outline-none"
                dependencies={[activeId]}
                items={manyEntries}
                selectedKeys={[activeId]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const [key] = keys === "all" ? [] : keys;

                  if (key !== undefined) setActiveId(key);
                }}
              >
                {(entry) => (
                  <ListBoxItem
                    className="floating-toc__item"
                    data-active={entry.id === activeId ? "true" : undefined}
                    id={entry.id}
                    textValue={entry.label}
                    style={
                      entry.level && entry.level > 1
                        ? ({"--floating-toc-level": entry.level} as CSSProperties)
                        : undefined
                    }
                  >
                    {entry.label}
                  </ListBoxItem>
                )}
              </ListBox>
            </Virtualizer>
          </FloatingToc.Content>
        </FloatingToc>
      </div>
    );
  },
};
