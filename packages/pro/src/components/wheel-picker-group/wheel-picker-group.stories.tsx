import type {WheelPickerOption} from "../wheel-picker";
import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Icon} from "@iconify/react";
import React, {useState} from "react";

import {WheelPicker, useWheelPickerItem} from "../wheel-picker";

import {WheelPickerGroup} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Demo data
 * -----------------------------------------------------------------------------------------------*/
const pad = (value: number) => String(value).padStart(2, "0");

const HOUR_ITEMS: WheelPickerOption<number>[] = Array.from({length: 24}, (_, hour) => ({
  label: `${hour} h`,
  value: hour,
}));

const MINUTE_ITEMS: WheelPickerOption<number>[] = Array.from({length: 12}, (_, index) => ({
  label: `${pad(index * 5)} min`,
  value: index * 5,
}));

const DAY_ITEMS: WheelPickerOption<string>[] = [
  {label: "Today", value: "today"},
  {label: "Tomorrow", value: "tomorrow"},
  {label: "Monday", value: "mon"},
  {label: "Tuesday", value: "tue"},
  {label: "Wednesday", value: "wed"},
  {label: "Thursday", value: "thu"},
  {label: "Friday", value: "fri"},
  {label: "Saturday", value: "sat"},
  {label: "Sunday", value: "sun"},
];

const CLOCK_ITEMS: WheelPickerOption<string>[] = Array.from({length: 32}, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const label = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

  return {label, value: label};
});

const KM_ITEMS: WheelPickerOption<number>[] = Array.from({length: 51}, (_, km) => ({
  label: String(km),
  value: km,
}));

const TENTH_ITEMS: WheelPickerOption<number>[] = Array.from({length: 10}, (_, tenth) => ({
  label: `.${tenth} km`,
  value: tenth,
}));

const PACE_MINUTE_ITEMS: WheelPickerOption<number>[] = Array.from({length: 9}, (_, index) => ({
  label: `${index + 3}′`,
  value: index + 3,
}));

const PACE_SECOND_ITEMS: WheelPickerOption<number>[] = Array.from({length: 12}, (_, index) => ({
  label: `${pad(index * 5)}″`,
  value: index * 5,
}));

const COUNT_ITEMS: WheelPickerOption<number>[] = Array.from({length: 12}, (_, index) => ({
  label: String(index + 1),
  value: index + 1,
}));

const UNIT_ITEMS: WheelPickerOption<string>[] = [
  {label: "days", value: "day"},
  {label: "weeks", value: "week"},
  {label: "months", value: "month"},
  {label: "years", value: "year"},
];

const DRINK_ITEMS: WheelPickerOption<string>[] = [
  {label: "Espresso", value: "espresso"},
  {label: "Cortado", value: "cortado"},
  {label: "Flat white", value: "flat-white"},
  {label: "Cappuccino", value: "cappuccino"},
  {label: "Latte", value: "latte"},
  {label: "Mocha", value: "mocha"},
  {label: "Cold brew", value: "cold-brew"},
];

const CUP_ITEMS: WheelPickerOption<string>[] = [
  {label: "Small", value: "S"},
  {label: "Medium", value: "M"},
  {label: "Large", value: "L"},
];

type Asset = "etfs" | "bonds" | "crypto" | "property" | "gold" | "cash";

const ASSET_ITEMS: WheelPickerOption<Asset>[] = [
  {label: "ETFs", value: "etfs"},
  {label: "Bonds", value: "bonds"},
  {label: "Crypto", value: "crypto"},
  {label: "Property", value: "property"},
  {label: "Gold", value: "gold"},
  {label: "Cash", value: "cash"},
];

const ASSET_ICONS: Record<Asset, string> = {
  bonds: "gravity-ui:shield-check",
  cash: "gravity-ui:wallet",
  crypto: "gravity-ui:cubes-3",
  etfs: "gravity-ui:chart-line",
  gold: "gravity-ui:star",
  property: "gravity-ui:house",
};

const BUDGET_ITEMS: WheelPickerOption<number>[] = [
  50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000,
].map((amount) => ({label: `$${amount}`, value: amount}));

const CURRENCY_ITEMS: WheelPickerOption<string>[] = ["EUR", "USD", "GBP", "CHF", "SEK", "AUD"].map(
  (code) => ({label: code, value: code}),
);

const CONVERT_ITEMS: WheelPickerOption<number>[] = [20, 50, 100, 250, 500, 750, 1000, 1500].map(
  (amount) => ({label: String(amount), value: amount}),
);

const labelOf = <T,>(items: WheelPickerOption<T>[], value: unknown) =>
  items.find((item) => Object.is(item.value, value))?.label ?? "–";

/* -------------------------------------------------------------------------------------------------
 * Demo helpers
 * -----------------------------------------------------------------------------------------------*/
/** Phone-sized screen, like the Native demo recordings. */
const PhoneScreen = ({children}: {children: ReactNode}) => (
  <div className="relative flex h-[720px] w-[390px] max-w-full flex-col items-center justify-center overflow-hidden rounded-[44px] bg-background px-5 ring-1 ring-separator">
    {children}
  </div>
);

const Header = ({
  caption,
  className = "text-2xl font-semibold",
  value,
}: {
  caption: string;
  className?: string;
  value: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-xs tracking-wider text-muted uppercase">{caption}</span>
    <span className={`${className} text-foreground tabular-nums`}>{value}</span>
  </div>
);

const Readout = ({children}: {children: ReactNode}) => (
  <span className="text-sm text-muted tabular-nums">{children}</span>
);

/** Icon tile for the asset column: neutral dashed frame on the selected row (like the video). */
const AssetIcon = ({value}: {value: Asset}) => {
  const {isSelected} = useWheelPickerItem();

  return (
    <span
      className={
        isSelected
          ? "grid size-7 shrink-0 place-items-center rounded-lg border border-dashed border-muted/40 text-accent"
          : "grid size-7 shrink-0 place-items-center rounded-lg border border-transparent text-accent"
      }
    >
      <Icon className="size-4" icon={ASSET_ICONS[value]} />
    </span>
  );
};

/** Decorative diagonal stripes for the custom indicator. */
const StripePattern = () => (
  <span
    aria-hidden="true"
    className="absolute inset-0"
    style={{
      backgroundImage:
        "repeating-linear-gradient(135deg, color-mix(in oklab, var(--accent) 14%, transparent) 0 2px, transparent 2px 9px)",
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
      options: [undefined, "disable-all"],
    },
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {control: "boolean"},
    itemHeight: {control: {max: 72, min: 32, step: 4, type: "number"}},
    visibleCount: {control: {type: "select"}, options: [3, 5, 7, 9]},
  },
  args: {
    "aria-label": "Timer",
  },
  component: WheelPickerGroup,
  parameters: {layout: "centered"},
  title: "Pro/Forms/WheelPickerGroup",
} satisfies Meta<typeof WheelPickerGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories (one per docs usage section, the demo video and the example)
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {
    isDisabled: false,
    isHapticFeedbackEnabled: true,
    itemHeight: 44,
    visibleCount: 5,
  },
  render: (args) => {
    const [values, setValues] = useState({hours: 1, minutes: 30});

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-[280px]">
          <WheelPickerGroup
            {...args}
            values={values}
            onValuesChange={(next) => setValues(next as typeof values)}
          >
            <WheelPicker aria-label="Hours" items={HOUR_ITEMS} name="hours" />
            <WheelPicker aria-label="Minutes" items={MINUTE_ITEMS} name="minutes" />
            <WheelPickerGroup.Indicator />
            <WheelPickerGroup.Mask />
          </WheelPickerGroup>
        </div>
        <Readout>
          Timer: {values.hours} h {pad(values.minutes)} min
        </Readout>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => {
    const [lastChange, setLastChange] = useState<Record<string, unknown> | null>(null);

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-[300px]">
          <WheelPickerGroup
            aria-label="Reminder"
            defaultValues={{day: "tomorrow", time: "09:00"}}
            onValuesChange={setLastChange}
          >
            <WheelPicker aria-label="Day" items={DAY_ITEMS} name="day" />
            <WheelPicker aria-label="Time" items={CLOCK_ITEMS} name="time" />
            <WheelPickerGroup.Indicator />
            <WheelPickerGroup.Mask />
          </WheelPickerGroup>
        </div>
        <Readout>onValuesChange: {lastChange ? JSON.stringify(lastChange) : "–"}</Readout>
      </div>
    );
  },
};

export const ItemHeightAndVisibleCount: Story = {
  render: () => (
    <div className="w-[260px]">
      <WheelPickerGroup
        aria-label="Run distance"
        defaultValues={{km: 21, tenth: 1}}
        itemHeight={56}
        visibleCount={5}
      >
        <WheelPicker aria-label="Kilometres" items={KM_ITEMS} name="km" />
        <WheelPicker aria-label="Tenths of a kilometre" items={TENTH_ITEMS} name="tenth" />
        <WheelPickerGroup.Indicator />
        <WheelPickerGroup.Mask />
      </WheelPickerGroup>
    </div>
  ),
};

export const CustomIndicator: Story = {
  render: () => (
    <div className="w-[260px]">
      <WheelPickerGroup aria-label="Target pace" defaultValues={{minutes: 5, seconds: 30}}>
        <WheelPicker aria-label="Minutes per km" items={PACE_MINUTE_ITEMS} name="minutes" />
        <WheelPicker aria-label="Seconds per km" items={PACE_SECOND_ITEMS} name="seconds" />
        <WheelPickerGroup.Indicator
          classNames={{
            highlight: "overflow-hidden border border-accent/15 bg-accent-soft",
          }}
        >
          <StripePattern />
        </WheelPickerGroup.Indicator>
        <WheelPickerGroup.Mask />
      </WheelPickerGroup>
    </div>
  ),
};

export const CustomMaskColor: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-3 rounded-3xl bg-overlay p-4 shadow-overlay">
      <span className="px-1 text-sm font-medium text-foreground">Repeat every</span>
      <WheelPickerGroup aria-label="Repeat every" defaultValues={{count: 2, unit: "week"}}>
        <WheelPicker aria-label="Interval" items={COUNT_ITEMS} name="count" />
        <WheelPicker aria-label="Unit" items={UNIT_ITEMS} name="unit" />
        <WheelPickerGroup.Indicator />
        <WheelPickerGroup.Mask color="var(--overlay)" height="75%" />
      </WheelPickerGroup>
    </div>
  ),
};

export const CommitOnRest: Story = {
  render: () => {
    const [changeCount, setChangeCount] = useState(0);
    const [commits, setCommits] = useState<string[]>([]);

    return (
      <div className="flex w-[300px] flex-col items-center gap-4">
        <WheelPickerGroup
          aria-label="Coffee order"
          defaultValues={{drink: "flat-white", size: "M"}}
          onValuesChange={() => setChangeCount((count) => count + 1)}
          onValuesCommit={(next) =>
            setCommits((list) =>
              [
                `${labelOf(CUP_ITEMS, next.size)} ${labelOf(DRINK_ITEMS, next.drink).toLowerCase()}`,
                ...list,
              ].slice(0, 4),
            )
          }
        >
          <WheelPicker aria-label="Drink" items={DRINK_ITEMS} name="drink" />
          <WheelPicker aria-label="Cup size" items={CUP_ITEMS} name="size" />
          <WheelPickerGroup.Indicator />
          <WheelPickerGroup.Mask />
        </WheelPickerGroup>
        <div className="flex w-full flex-col gap-1 rounded-2xl bg-surface p-3 text-sm shadow-surface">
          <span className="text-muted tabular-nums">onValuesChange calls: {changeCount}</span>
          <span className="font-medium text-foreground">onValuesCommit</span>
          {commits.length === 0 ? (
            <span className="text-muted">Spin a wheel and let it settle…</span>
          ) : (
            <ol aria-label="Committed orders" className="flex flex-col gap-0.5">
              {commits.map((entry, index) => (
                <li
                  key={`${entry}-${index}`}
                  className={index === 0 ? "text-foreground" : "text-muted"}
                >
                  {entry}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  },
};

export const DisableAnimations: Story = {
  render: () => (
    <div className="w-[280px]">
      <WheelPickerGroup
        animation="disable-all"
        aria-label="Timer"
        defaultValues={{hours: 0, minutes: 45}}
      >
        <WheelPicker aria-label="Hours" items={HOUR_ITEMS} name="hours" />
        <WheelPicker aria-label="Minutes" items={MINUTE_ITEMS} name="minutes" />
        <WheelPickerGroup.Indicator />
        <WheelPickerGroup.Mask />
      </WheelPickerGroup>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[280px]">
      <WheelPickerGroup isDisabled aria-label="Timer" defaultValues={{hours: 2, minutes: 15}}>
        <WheelPicker aria-label="Hours" items={HOUR_ITEMS} name="hours" />
        <WheelPicker aria-label="Minutes" items={MINUTE_ITEMS} name="minutes" />
        <WheelPickerGroup.Indicator />
        <WheelPickerGroup.Mask />
      </WheelPickerGroup>
    </div>
  ),
};

export const CustomRender: Story = {
  render: () => {
    const [values, setValues] = useState<{asset: Asset; amount: number}>({
      amount: 1000,
      asset: "bonds",
    });

    return (
      <PhoneScreen>
        <div className="flex w-full flex-col items-center gap-6">
          <Header
            caption="Invest"
            value={`$${values.amount} · ${labelOf(ASSET_ITEMS, values.asset)}`}
          />
          <div className="w-[300px]">
            <WheelPickerGroup aria-label="Investment" values={values} onValuesChange={setValues}>
              <WheelPicker
                aria-label="Asset class"
                items={ASSET_ITEMS}
                name="asset"
                renderItem={({item}) => (
                  <WheelPicker.Item className="gap-2">
                    <AssetIcon value={item.value} />
                    <WheelPicker.ItemLabel>{item.label}</WheelPicker.ItemLabel>
                  </WheelPicker.Item>
                )}
              />
              <WheelPicker aria-label="Amount" items={BUDGET_ITEMS} name="amount" />
              <WheelPickerGroup.Indicator />
              <WheelPickerGroup.Mask />
            </WheelPickerGroup>
          </div>
        </div>
      </PhoneScreen>
    );
  },
};

export const Example: Story = {
  render: () => {
    const [values, setValues] = useState({amount: 250, currency: "EUR"});

    return (
      <PhoneScreen>
        <div className="flex flex-col items-center gap-6">
          <Header
            caption="Convert"
            className="text-3xl font-bold"
            value={`${values.currency} ${values.amount}`}
          />
          <div className="w-[280px]">
            <WheelPickerGroup
              aria-label="Amount to convert"
              values={values}
              onValuesChange={setValues}
            >
              <WheelPicker aria-label="Currency" items={CURRENCY_ITEMS} name="currency" />
              <WheelPicker
                aria-label="Amount"
                classNames={{itemLabel: "tabular-nums"}}
                items={CONVERT_ITEMS}
                name="amount"
              />
              <WheelPickerGroup.Indicator />
              <WheelPickerGroup.Mask />
            </WheelPickerGroup>
          </div>
        </div>
      </PhoneScreen>
    );
  },
};
