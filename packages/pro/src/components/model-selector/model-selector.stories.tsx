import type {ModelSelectorEffortLevel, ModelSelectorModel} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Button, TextArea} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {ModelSelector} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Demo data (fictional providers and models, simple hand-made marks)
 * -----------------------------------------------------------------------------------------------*/
const NorthwindMark = () => (
  <svg fill="#e8704a" viewBox="0 0 16 16">
    <path d="M8 1.5c.5 0 .9.3 1.1.7l4.9 10.1c.4.8-.4 1.7-1.3 1.4L8 12l-4.7 1.7c-.9.3-1.7-.6-1.3-1.4L6.9 2.2c.2-.4.6-.7 1.1-.7Z" />
  </svg>
);

const LumenMark = () => (
  <svg fill="currentColor" viewBox="0 0 16 16">
    <path
      clipRule="evenodd"
      d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 3.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
      fillRule="evenodd"
    />
  </svg>
);

const VelaMark = () => (
  <svg fill="#4f7df3" viewBox="0 0 16 16">
    <path d="M8 .75 15.25 8 8 15.25.75 8 8 .75Zm0 4L4.75 8 8 11.25 11.25 8 8 4.75Z" />
  </svg>
);

const OrbitMark = () => (
  <svg fill="#14b8a6" viewBox="0 0 16 16">
    <path d="M8 2.5a5.5 5.5 0 1 0 5.06 3.35l1.38-.59A7 7 0 1 1 10.74 1.56l-.59 1.38A5.48 5.48 0 0 0 8 2.5Z" />
    <circle cx="12.25" cy="3.75" r="1.75" />
    <circle cx="8" cy="8" r="2.25" />
  </svg>
);

const KiteMark = () => (
  <svg fill="#a855f7" viewBox="0 0 16 16">
    <path d="M8 1 14 4.5v7L8 15l-6-3.5v-7L8 1Zm0 3.2L4.75 6.1v3.8L8 11.8l3.25-1.9V6.1L8 4.2Z" />
  </svg>
);

const low: ModelSelectorEffortLevel = {id: "low", label: "Low"};
const medium: ModelSelectorEffortLevel = {id: "medium", label: "Medium"};
const high: ModelSelectorEffortLevel = {id: "high", label: "High"};
const max: ModelSelectorEffortLevel = {
  description: "Max burns through usage faster.",
  id: "max",
  label: "Max",
  tone: "max",
};
const ultra: ModelSelectorEffortLevel = {
  description: "Ultra burns usage fastest.",
  id: "ultra",
  label: "Ultra",
  tone: "ultra",
};

const models: ModelSelectorModel[] = [
  {
    badge: "New",
    contextWindow: 1_000_000,
    defaultEffort: "high",
    description: "Deep reasoning for research and long multi-step tasks.",
    efforts: [low, medium, high, max, ultra],
    icon: <NorthwindMark />,
    id: "northwind-atlas-3",
    intelligence: 5,
    name: "Northwind Atlas 3",
    provider: "Northwind",
    shortName: "Atlas 3",
    speed: 2,
  },
  {
    contextWindow: 1_000_000,
    defaultEffort: "high",
    description: "Our strongest model for code, agents and analysis.",
    efforts: [low, medium, high, max, ultra],
    icon: <NorthwindMark />,
    id: "northwind-summit-2-5",
    intelligence: 5,
    name: "Northwind Summit 2.5",
    provider: "Northwind",
    shortName: "Summit 2.5",
    speed: 3,
  },
  {
    contextWindow: 1_000_000,
    defaultEffort: "medium",
    description: "Quick and capable for most day-to-day work.",
    efforts: [low, medium, high, max],
    icon: <NorthwindMark />,
    id: "northwind-ridge-2-5",
    intelligence: 4,
    name: "Northwind Ridge 2.5",
    provider: "Northwind",
    shortName: "Ridge 2.5",
    speed: 4,
  },
  {
    contextWindow: 400_000,
    defaultEffort: "low",
    description: "The lightest model, made for instant replies.",
    efforts: [low, medium, high],
    icon: <NorthwindMark />,
    id: "northwind-breeze-2-5",
    intelligence: 3,
    name: "Northwind Breeze 2.5",
    provider: "Northwind",
    shortName: "Breeze 2.5",
    speed: 5,
  },
  {
    contextWindow: 1_200_000,
    description: "Strong general model with a large context at a fair price.",
    icon: <LumenMark />,
    id: "lumen-prism-4",
    intelligence: 4,
    name: "Lumen Prism 4",
    provider: "Lumen",
    shortName: "Prism 4",
    speed: 3,
  },
];

const moreModels: ModelSelectorModel[] = [
  ...models,
  {
    contextWindow: 2_000_000,
    description: "Reads documents, images and video in one long context.",
    icon: <VelaMark />,
    id: "vela-horizon-pro",
    intelligence: 5,
    name: "Vela Horizon Pro",
    provider: "Vela",
    shortName: "Horizon Pro",
    speed: 3,
  },
  {
    contextWindow: 1_000_000,
    description: "Fast answers for chat and lightweight tasks.",
    icon: <VelaMark />,
    id: "vela-horizon-lite",
    intelligence: 3,
    name: "Vela Horizon Lite",
    provider: "Vela",
    shortName: "Horizon Lite",
    speed: 5,
  },
  {
    contextWindow: 256_000,
    description: "Up-to-date knowledge with a candid tone.",
    icon: <OrbitMark />,
    id: "orbit-5",
    intelligence: 4,
    name: "Orbit 5",
    provider: "Orbit Labs",
    shortName: "Orbit 5",
    speed: 4,
  },
  {
    contextWindow: 256_000,
    description: "Open weights tuned for tool use and coding.",
    icon: <KiteMark />,
    id: "kite-k4-open",
    intelligence: 4,
    name: "Kite K4 Open",
    provider: "Kite",
    shortName: "K4 Open",
    speed: 3,
  },
];

const prices: Record<string, string> = {
  "kite-k4-open": "$0.80 / $3",
  "lumen-prism-4": "$2.50 / $15",
  "northwind-atlas-3": "$10 / $50",
  "northwind-breeze-2-5": "$0.40 / $2",
  "northwind-ridge-2-5": "$2 / $12",
  "northwind-summit-2-5": "$5 / $25",
  "orbit-5": "$3 / $12",
  "vela-horizon-lite": "$0.25 / $1",
  "vela-horizon-pro": "$3.50 / $18",
};

function groupByProvider(list: ModelSelectorModel[]) {
  const groups = new Map<string, ModelSelectorModel[]>();

  for (const model of list) {
    const provider = model.provider ?? "Other";

    groups.set(provider, [...(groups.get(provider) ?? []), model]);
  }

  return [...groups.entries()];
}

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    defaultEffort: {
      control: {type: "select"},
      options: [undefined, "low", "medium", "high", "max", "ultra"],
    },
    isDisabled: {control: "boolean"},
  },
  args: {
    models,
  },
  component: ModelSelector,
  decorators: [
    (Story) => (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {layout: "fullscreen"},
  title: "Pro/AI/ModelSelector",
} satisfies Meta<typeof ModelSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/

/** Inside a chat composer toolbar, like a Prompt Input. */
export const Default: Story = {
  args: {
    defaultEffort: "ultra",
    defaultValue: "northwind-summit-2-5",
  },
  render: (args) => (
    // Stand-in for the Prompt Input composer: a textarea above a toolbar, centred on the page
    <div className="w-full max-w-[640px]">
      <div className="flex flex-col rounded-2xl bg-surface">
        <TextArea
          fullWidth
          aria-label="Message"
          className="h-14 resize-none rounded-xl border-0 bg-transparent px-3 pt-3 pb-2 shadow-none"
          placeholder="Send a message"
          rows={1}
        />
        <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-3">
          <Button isIconOnly aria-label="Attach files" variant="tertiary">
            <Icon className="size-4" icon="gravity-ui:plus" />
          </Button>
          <div className="flex items-center gap-2">
            <ModelSelector {...args} />
            <Button isIconOnly aria-label="Voice input" variant="tertiary">
              <Icon className="size-4" icon="gravity-ui:microphone" />
            </Button>
            <Button isDisabled isIconOnly aria-label="Send">
              <Icon className="size-4" icon="gravity-ui:arrow-up" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  ),
};

/** Each model brings its own levels; tones mark the levels that use more of the limit. */
export const EffortLevels: Story = {
  args: {
    defaultEffort: "max",
    defaultValue: "northwind-ridge-2-5",
  },
  render: (args) => <ModelSelector {...args} />,
};

/** Search, prices after the names, a pricing note and a wider popover. */
export const Composition: Story = {
  args: {
    defaultValue: "northwind-summit-2-5",
    models: moreModels,
  },
  render: (args) => (
    <ModelSelector {...args}>
      <ModelSelector.Trigger />
      <ModelSelector.Popover className="[--model-selector-popover-width:288px]">
        <ModelSelector.Search />
        <ModelSelector.List aria-describedby="model-selector-pricing-note">
          {groupByProvider(args.models).map(([provider, group]) => (
            <ModelSelector.Group key={provider} title={provider}>
              {group.map((model) => (
                <ModelSelector.Item key={model.id} model={model}>
                  {prices[model.id]}
                </ModelSelector.Item>
              ))}
            </ModelSelector.Group>
          ))}
        </ModelSelector.List>
        <p className="px-2 pt-1 pb-2 text-xs text-muted" id="model-selector-pricing-note">
          Price per million tokens, input / output
        </p>
        <ModelSelector.Effort />
        <ModelSelector.Detail />
      </ModelSelector.Popover>
    </ModelSelector>
  ),
};

/** The model and the level are both owned by the parent. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("northwind-summit-2-5");
    const [effort, setEffort] = React.useState("high");
    const model = args.models.find((item) => item.id === value);
    const level = model?.efforts?.find((item) => item.id === effort);

    return (
      <div className="flex flex-col items-center gap-3">
        <ModelSelector
          {...args}
          effort={effort}
          value={value}
          onChange={setValue}
          onEffortChange={setEffort}
        />
        <p className="text-sm text-muted">
          {model?.name}
          {level ? ` · ${level.label}` : null}
        </p>
      </div>
    );
  },
};

/** `Effort` without its ends row, and a `Detail` that adds the price under the built-in body. */
export const CustomParts: Story = {
  args: {
    defaultValue: "northwind-atlas-3",
    labels: {title: "Pick a model"},
  },
  render: (args) => (
    <ModelSelector {...args}>
      <ModelSelector.Trigger />
      <ModelSelector.Popover>
        <ModelSelector.List />
        <ModelSelector.Effort showOuterSparks={false}>{null}</ModelSelector.Effort>
        <ModelSelector.Detail>
          {({defaultChildren, model}) => (
            <>
              {defaultChildren}
              <p className="text-xs text-muted">{prices[model.id]} per million tokens</p>
            </>
          )}
        </ModelSelector.Detail>
      </ModelSelector.Popover>
    </ModelSelector>
  ),
};
