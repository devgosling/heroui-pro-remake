import type {Meta, StoryObj} from "@storybook/react";
import type {CSSProperties} from "react";

import {Label} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";

import {Rating} from "./index";

const meta = {
  argTypes: {
    defaultValue: {control: {max: 5, min: 0, step: 1, type: "number"}},
    isDisabled: {control: "boolean"},
    isReadOnly: {control: "boolean"},
    size: {control: {type: "select"}, options: ["sm", "md", "lg"]},
  },
  component: Rating,
  parameters: {layout: "centered"},
  title: "Pro/Feedback/Rating",
} satisfies Meta<typeof Rating>;

export default meta;

type Story = StoryObj<typeof meta>;

const STARS = [1, 2, 3, 4, 5];

const RatingItems = () => (
  <>
    {STARS.map((value) => (
      <Rating.Item key={value} value={value} />
    ))}
  </>
);

/* -------------------------------------------------------------------------------------------------
 * Usage: product review breakdown (read-only, small)
 * -----------------------------------------------------------------------------------------------*/
const breakdown = [
  {label: "Comfort", value: 4.6},
  {label: "Battery life", value: 3.4},
  {label: "Sound quality", value: 5},
  {label: "Noise cancelling", value: 2.8},
];

export const ProductReview: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-4">
      {breakdown.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <span className="text-sm text-foreground">{row.label}</span>
          <div className="flex items-center gap-2">
            <Rating
              isReadOnly
              aria-label={`${row.label}: ${row.value} stars`}
              size="sm"
              value={row.value}
            >
              <RatingItems />
            </Rating>
            <span className="w-7 text-right text-xs text-muted">{row.value}</span>
          </div>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Read-only fractional values
 * -----------------------------------------------------------------------------------------------*/
const FractionalList = ({values}: {values: number[]}) => (
  <div className="flex flex-col gap-4">
    {values.map((value) => (
      <div key={value} className="flex items-center gap-3">
        <Rating isReadOnly aria-label={`${value} out of 5 stars`} value={value}>
          <RatingItems />
        </Rating>
        <span className="text-sm text-muted">{value}</span>
      </div>
    ))}
  </div>
);

export const ReadOnlyFractional: Story = {
  render: () => <FractionalList values={[1.4, 2.6, 3.5, 4.1, 4.7]} />,
};

/* -------------------------------------------------------------------------------------------------
 * Basic
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {"aria-label": "Rating", defaultValue: 2},
  render: (args) => (
    <Rating {...args}>
      <RatingItems />
    </Rating>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With label
 * -----------------------------------------------------------------------------------------------*/
export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label>How was your stay with us?</Label>
      <Rating aria-label="Stay rating">
        <RatingItems />
      </Rating>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Sizes
 * -----------------------------------------------------------------------------------------------*/
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted">{size}</span>
          <Rating aria-label={`Rating ${size}`} defaultValue={4} size={size}>
            <RatingItems />
          </Rating>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom color (via the --rating-active-color variable)
 * -----------------------------------------------------------------------------------------------*/
const colors = [
  {color: "var(--color-accent)", label: "Accent"},
  {color: "var(--color-danger)", label: "Danger"},
  {color: "var(--color-success)", label: "Success"},
];

export const CustomColor: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {colors.map((entry) => (
        <div key={entry.label} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{entry.label}</span>
          <Rating
            aria-label={`Rating ${entry.label.toLowerCase()}`}
            defaultValue={3}
            style={{"--rating-active-color": entry.color} as CSSProperties}
          >
            <RatingItems />
          </Rating>
        </div>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Read only
 * -----------------------------------------------------------------------------------------------*/
export const ReadOnly: Story = {
  render: () => <FractionalList values={[1, 2.5, 3.2, 3.9, 5]} />,
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
export const Disabled: Story = {
  render: () => (
    <Rating isDisabled aria-label="Rating" defaultValue={2}>
      <RatingItems />
    </Rating>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
const ControlledExample = () => {
  const [value, setValue] = React.useState(4);

  return (
    <div className="flex flex-col items-center gap-3">
      <Rating aria-label="Rating" value={value} onValueChange={setValue}>
        <RatingItems />
      </Rating>
      <span className="text-sm text-muted">
        {value} {value === 1 ? "star" : "stars"}
      </span>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/* -------------------------------------------------------------------------------------------------
 * Custom icons
 * -----------------------------------------------------------------------------------------------*/
export const CustomIconHeart: Story = {
  render: () => (
    <Rating aria-label="Likes" defaultValue={4} icon={<Icon icon="gravity-ui:heart-fill" />}>
      <RatingItems />
    </Rating>
  ),
};

export const CustomIconPerItem: Story = {
  render: () => (
    <Rating
      aria-label="Likes"
      defaultValue={2}
      style={{"--rating-active-color": "var(--color-danger)"} as CSSProperties}
    >
      {STARS.map((value) => (
        <Rating.Item key={value} value={value}>
          <Icon icon="gravity-ui:heart-fill" />
        </Rating.Item>
      ))}
    </Rating>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Render function
 * -----------------------------------------------------------------------------------------------*/
const RenderFunctionExample = () => {
  const [value, setValue] = React.useState(0);

  return (
    <div className="flex flex-col items-center gap-3">
      <Rating aria-label="Rating" value={value} onValueChange={setValue}>
        {STARS.map((star) => (
          <Rating.Item key={star} value={star}>
            {({isActive}) => (
              <span
                style={{
                  color: isActive ? "var(--color-warning)" : "var(--color-muted)",
                  display: "flex",
                  height: 20,
                  width: 20,
                }}
              >
                <Icon
                  height="100%"
                  icon={isActive ? "gravity-ui:star-fill" : "gravity-ui:star"}
                  width="100%"
                />
              </span>
            )}
          </Rating.Item>
        ))}
      </Rating>
      <span className="text-sm text-muted">
        {value === 0 ? "Not rated yet" : `${value} ${value === 1 ? "star" : "stars"}`}
      </span>
    </div>
  );
};

export const RenderFunction: Story = {
  render: () => <RenderFunctionExample />,
};
