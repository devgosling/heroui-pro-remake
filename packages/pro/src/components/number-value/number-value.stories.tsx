import type {Meta, StoryObj} from "@storybook/react";

import React from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {NumberValue} from "./index";

const meta = {
  component: NumberValue,
  parameters: {layout: "centered"},
  title: "Pro/Feedback/NumberValue",
} satisfies Meta<typeof NumberValue>;

export default meta;

type Story = StoryObj<typeof meta>;

const Frame = ({children}: {children: React.ReactNode}) => (
  <div className="flex flex-col gap-3 rounded-2xl p-6">{children}</div>
);

const Row = ({
  children,
  label,
  width = "w-12",
}: {
  children: React.ReactNode;
  label: string;
  width?: string;
}) => (
  <div className="flex items-baseline gap-4">
    <span className={`text-xs text-muted ${width}`}>{label}</span>
    {children}
  </div>
);

const big = "text-2xl font-semibold text-foreground";

export const Default: Story = {
  args: {className: big, currency: "USD", style: "currency", value: 48210.5},
};

export const Currency: Story = {
  render: () => (
    <Frame>
      {["USD", "EUR", "JPY", "GBP", "CHF"].map((currency) => (
        <Row key={currency} label={currency}>
          <NumberValue className={big} currency={currency} style="currency" value={48210.5} />
        </Row>
      ))}
    </Frame>
  ),
};

export const Percent: Story = {
  render: () => (
    <Frame>
      {[0.047, 0.912, -0.031].map((value) => (
        <NumberValue
          key={value}
          className={big}
          maximumFractionDigits={1}
          style="percent"
          value={value}
        />
      ))}
    </Frame>
  ),
};

export const Compact: Story = {
  render: () => (
    <Frame>
      {[2_481, 73_912, 4_820_133, 12_004_998_211].map((value) => (
        <Row key={value} label={value.toLocaleString("en-US")} width="w-24">
          <NumberValue className={big} notation="compact" value={value} />
        </Row>
      ))}
    </Frame>
  ),
};

export const SignDisplay: Story = {
  render: () => (
    <Frame>
      {(["auto", "always", "exceptZero", "never"] as const).map((signDisplay) => (
        <Row key={signDisplay} label={signDisplay} width="w-24">
          <div className="flex gap-4">
            {[17, 0, -17].map((value) => (
              <NumberValue
                key={value}
                className="font-semibold text-foreground"
                signDisplay={signDisplay}
                value={value}
              />
            ))}
          </div>
        </Row>
      ))}
    </Frame>
  ),
};

export const FormatOptions: Story = {
  render: () => (
    <Frame>
      <Row label="Compact currency" width="w-32">
        <NumberValue
          className={big}
          formatOptions={{currency: "USD", notation: "compact", style: "currency"}}
          value={3_480_000}
        />
      </Row>
      <Row label="Accounting" width="w-32">
        <NumberValue
          className={big}
          formatOptions={{currency: "USD", currencySign: "accounting", style: "currency"}}
          value={-842.19}
        />
      </Row>
      <Row label="Unit" width="w-32">
        <NumberValue className={big} style="unit" unit="kilometer-per-hour" value={88} />
      </Row>
    </Frame>
  ),
};

export const WithPrefixSuffix: Story = {
  render: () => (
    <Frame>
      <NumberValue className={big} value={48210}>
        <NumberValue.Suffix>
          <span className="ml-1 text-sm font-normal text-muted">orders</span>
        </NumberValue.Suffix>
      </NumberValue>
      <NumberValue className={big} notation="compact" value={3_480_000}>
        <NumberValue.Prefix>
          <span className="mr-1 text-sm font-normal text-muted">~</span>
        </NumberValue.Prefix>
        <NumberValue.Suffix>
          <span className="ml-1 text-sm font-normal text-muted">visitors</span>
        </NumberValue.Suffix>
      </NumberValue>
      <NumberValue className={big} currency="USD" style="currency" value={19.99}>
        <NumberValue.Suffix>
          <span className="ml-1 text-sm font-normal text-muted">/seat</span>
        </NumberValue.Suffix>
      </NumberValue>
    </Frame>
  ),
};

export const TabularNums: Story = {
  render: () => (
    <div className="flex flex-col items-end gap-1 rounded-2xl p-6">
      {[48210.5, 1111.11, 90817.25, 7.4, 61234].map((value) => (
        <NumberValue
          key={value}
          className="text-xl font-semibold text-foreground"
          currency="USD"
          style="currency"
          value={value}
        />
      ))}
    </div>
  ),
};

export const Locale: Story = {
  render: () => (
    <Frame>
      <Row label="locale prop" width="w-24">
        <NumberValue
          className={big}
          currency="EUR"
          locale="de-DE"
          style="currency"
          value={48210.5}
        />
      </Row>
      <I18nProvider locale="fr-FR">
        <Row label="I18nProvider" width="w-24">
          <NumberValue className={big} currency="EUR" style="currency" value={48210.5} />
        </Row>
      </I18nProvider>
    </Frame>
  ),
};

export const RenderFunction: Story = {
  render: () => (
    <NumberValue className={big} currency="USD" style="currency" value={48210.5}>
      {(formatted) => <span className="text-accent">{formatted}</span>}
    </NumberValue>
  ),
};
