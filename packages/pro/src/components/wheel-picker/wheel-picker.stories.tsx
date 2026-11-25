import type {WheelPickerOption, WheelPickerRootRef} from "./index";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useRef, useState} from "react";

import {WheelPicker, useWheelPickerItem} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Demo data
 * -----------------------------------------------------------------------------------------------*/
const CURRENT_YEAR = new Date().getFullYear();

const YEAR_ITEMS: WheelPickerOption<number>[] = Array.from({length: 70}, (_, index) => {
  const year = CURRENT_YEAR - 16 - index;

  return {label: String(year), value: year};
});

const pad = (value: number) => String(value).padStart(2, "0");

const SLOT_ITEMS: WheelPickerOption<string>[] = Array.from({length: 57}, (_, index) => {
  const minutes = 7 * 60 + index * 15;
  const label = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

  return {label, value: label};
});

const TIME_ITEMS: WheelPickerOption<string>[] = Array.from({length: 48}, (_, index) => {
  const label = `${pad(Math.floor(index / 2))}:${index % 2 ? "30" : "00"}`;

  return {label, value: label};
});

const DURATION_ITEMS: WheelPickerOption<number>[] = Array.from({length: 18}, (_, index) => {
  const minutes = (index + 1) * 5;

  return {label: `${minutes} min`, value: minutes};
});

type Category = "work" | "travel" | "fitness" | "study" | "groceries" | "music" | "home";

const CATEGORY_ITEMS: WheelPickerOption<Category>[] = [
  {label: "Work", value: "work"},
  {label: "Travel", value: "travel"},
  {label: "Fitness", value: "fitness"},
  {label: "Study", value: "study"},
  {label: "Groceries", value: "groceries"},
  {label: "Music", value: "music"},
  {label: "Home", value: "home"},
];

const CATEGORY_ICONS: Record<Category, string> = {
  fitness: "gravity-ui:heart-pulse",
  groceries: "gravity-ui:shopping-basket",
  home: "gravity-ui:house",
  music: "gravity-ui:music-note",
  study: "gravity-ui:graduation-cap",
  travel: "gravity-ui:plane",
  work: "gravity-ui:briefcase",
};

const labelOf = <T,>(items: WheelPickerOption<T>[], value: T) =>
  items.find((item) => Object.is(item.value, value))?.label ?? "";

/* -------------------------------------------------------------------------------------------------
 * Demo helpers
 * -----------------------------------------------------------------------------------------------*/
/** Phone-sized screen, like the Native demo recordings. */
const PhoneScreen = ({children}: {children: ReactNode}) => (
  <div className="relative flex h-[720px] w-[390px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[44px] bg-background px-5 ring-1 ring-separator">
    {children}
  </div>
);

const Header = ({caption, value}: {caption: string; value: ReactNode}) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-xs tracking-wider text-muted uppercase">{caption}</span>
    <span className="text-2xl font-semibold text-foreground tabular-nums">{value}</span>
  </div>
);

/** Row icon; the selected row (read from `useWheelPickerItem`) gets a dashed frame. */
const CategoryIcon = ({value}: {value: Category}) => {
  const {isSelected} = useWheelPickerItem();

  return (
    <span
      className={
        isSelected
          ? "grid size-7 place-items-center rounded-lg border border-dashed border-accent/50 text-accent-soft-foreground"
          : "grid size-7 place-items-center rounded-lg border border-transparent text-accent-soft-foreground"
      }
    >
      <Icon className="size-4" icon={CATEGORY_ICONS[value]} />
    </span>
  );
};

/** Decorative dotted pattern for the custom indicator. */
const DotPattern = () => (
  <span
    aria-hidden="true"
    className="absolute inset-0 opacity-50"
    style={{
      backgroundImage:
        "radial-gradient(color-mix(in oklab, var(--accent) 35%, transparent) 1px, transparent 1.5px)",
      backgroundSize: "10px 10px",
    }}
  />
);

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    animation: {
      control: {type: "select"},
      options: [undefined, "disabled", "disable-all"],
    },
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {control: "boolean"},
    itemHeight: {control: {max: 72, min: 32, step: 4, type: "number"}},
    visibleCount: {control: {type: "select"}, options: [3, 5, 7, 9]},
  },
  args: {
    "aria-label": "Year",
    items: YEAR_ITEMS,
  },
  component: WheelPicker,
  parameters: {layout: "centered"},
  title: "Pro/Forms/WheelPicker",
} satisfies Meta<typeof WheelPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories (one per docs usage section + the example)
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {
    isHapticFeedbackEnabled: true,
    itemHeight: 44,
    visibleCount: 5,
  },
  render: (args) => {
    const [year, setYear] = useState(1998);

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-[200px]">
          <WheelPicker {...args} value={year} onValueChange={(next) => setYear(next as number)} />
        </div>
        <span className="text-sm text-muted tabular-nums">Selected: {year}</span>
      </div>
    );
  },
};

export const WithMask: Story = {
  render: () => {
    const [year, setYear] = useState(1998);

    return (
      <div className="w-[200px]">
        <WheelPicker aria-label="Year" items={YEAR_ITEMS} value={year} onValueChange={setYear}>
          <WheelPicker.Indicator />
          <WheelPicker.Mask />
        </WheelPicker>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => {
    const [lastChange, setLastChange] = useState<number | null>(null);

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-[200px]">
          <WheelPicker
            aria-label="Year"
            defaultValue={2004}
            items={YEAR_ITEMS}
            onValueChange={setLastChange}
          />
        </div>
        <span className="text-sm text-muted tabular-nums">onValueChange: {lastChange ?? "–"}</span>
      </div>
    );
  },
};

export const ItemHeightAndVisibleCount: Story = {
  render: () => (
    <div className="w-[220px]">
      <WheelPicker
        aria-label="Delivery slot"
        defaultValue="16:45"
        itemHeight={56}
        items={SLOT_ITEMS}
        visibleCount={5}
      />
    </div>
  ),
};

export const CustomItemRender: Story = {
  render: () => {
    const [category, setCategory] = useState<Category>("fitness");

    return (
      <PhoneScreen>
        <div className="flex w-full flex-col items-center gap-6">
          <Header caption="Category" value={labelOf(CATEGORY_ITEMS, category)} />
          <div className="w-[240px]">
            <WheelPicker
              aria-label="Category"
              items={CATEGORY_ITEMS}
              value={category}
              renderItem={({item}) => (
                <WheelPicker.Item className="gap-3">
                  <CategoryIcon value={item.value} />
                  <WheelPicker.ItemLabel className="font-medium">
                    {item.label}
                  </WheelPicker.ItemLabel>
                </WheelPicker.Item>
              )}
              onValueChange={setCategory}
            >
              <WheelPicker.Indicator />
              <WheelPicker.Mask />
            </WheelPicker>
          </div>
        </div>
      </PhoneScreen>
    );
  },
};

export const CustomIndicator: Story = {
  render: () => (
    <div className="w-[220px]">
      <WheelPicker aria-label="Timer duration" defaultValue={45} items={DURATION_ITEMS}>
        <WheelPicker.Indicator
          classNames={{
            highlight: "overflow-hidden border border-accent/20 bg-accent-soft",
            wrapper: "px-2",
          }}
        >
          <DotPattern />
        </WheelPicker.Indicator>
        <WheelPicker.Mask />
      </WheelPicker>
    </div>
  ),
};

export const CustomMaskColor: Story = {
  render: () => (
    <div className="flex w-[260px] flex-col gap-3 rounded-3xl bg-overlay p-4 shadow-overlay">
      <span className="px-1 text-sm font-medium text-foreground">Wake-up time</span>
      <WheelPicker aria-label="Wake-up time" defaultValue="07:30" items={TIME_ITEMS}>
        <WheelPicker.Indicator />
        <WheelPicker.Mask color="var(--overlay)" height="75%" />
      </WheelPicker>
    </div>
  ),
};

export const CustomAnimation: Story = {
  render: () => (
    <div className="w-[220px]">
      <WheelPicker
        aria-label="Category"
        defaultValue="study"
        items={CATEGORY_ITEMS}
        animation={{
          labelColor: {value: ["var(--muted)", "var(--foreground)"]},
          opacity: {value: [0.4, 1]},
          scale: {value: [0.75, 1]},
        }}
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[200px]">
      <WheelPicker isDisabled aria-label="Year" defaultValue={1998} items={YEAR_ITEMS} />
    </div>
  ),
};

export const ProgrammaticScroll: Story = {
  render: () => {
    const ref = useRef<WheelPickerRootRef>(null);
    const [year, setYear] = useState(1998);

    return (
      <div className="flex flex-col items-center gap-5">
        <div className="w-[200px]">
          <WheelPicker
            ref={ref}
            aria-label="Year"
            items={YEAR_ITEMS}
            value={year}
            onValueChange={setYear}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="secondary" onPress={() => ref.current?.scrollToValue(2005)}>
            Scroll to 2005
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => ref.current?.scrollToIndex({animated: false, index: 0})}
          >
            First year (instant)
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() =>
              ref.current?.scrollToIndex({index: Math.floor(Math.random() * YEAR_ITEMS.length)})
            }
          >
            Random
          </Button>
        </div>
        <span className="text-sm text-muted tabular-nums">Selected: {year}</span>
      </div>
    );
  },
};

export const Example: Story = {
  render: () => {
    const [year, setYear] = useState(2006);

    return (
      <PhoneScreen>
        <div className="flex flex-col items-center gap-6">
          <Header caption="Graduation year" value={year} />
          <div className="w-[200px]">
            <WheelPicker
              aria-label="Graduation year"
              classNames={{itemLabel: "tabular-nums"}}
              items={YEAR_ITEMS}
              value={year}
              onValueChange={setYear}
            >
              <WheelPicker.Indicator />
              <WheelPicker.Mask />
            </WheelPicker>
          </div>
        </div>
      </PhoneScreen>
    );
  },
};
