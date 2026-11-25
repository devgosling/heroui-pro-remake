import type {Meta, StoryObj} from "@storybook/react";
import type {ComponentProps} from "react";

import {Avatar, Button, Link} from "@heroui/react";
import React from "react";

import {HoverCard} from "./index";

type Placement = NonNullable<HoverCard["ContentProps"]["placement"]>;

type HoverCardStoryArgs = HoverCard["RootProps"] & {
  /** Placement of `HoverCard.Content`. */
  placement?: Placement;
  /** Distance between the card and the trigger. */
  offset?: number;
  /** Renders a `HoverCard.Arrow`. */
  showArrow?: boolean;
};

const meta = {
  argTypes: {
    closeDelay: {control: {min: 0, step: 50, type: "number"}},
    defaultOpen: {control: "boolean"},
    isDisabled: {control: "boolean"},
    offset: {control: {min: 0, step: 1, type: "number"}},
    openDelay: {control: {min: 0, step: 50, type: "number"}},
    placement: {
      control: {type: "select"},
      options: [
        "top",
        "bottom",
        "left",
        "right",
        "top start",
        "top end",
        "bottom start",
        "bottom end",
      ],
    },
    showArrow: {control: "boolean"},
  },
  component: HoverCard,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/HoverCard",
} satisfies Meta<HoverCardStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story content
 * -----------------------------------------------------------------------------------------------*/
const ASSETS = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com";

const profile = {
  avatar: `${ASSETS}/avatars/blue.jpg`,
  bio: "Open-source tooling for design engineers.",
  followers: "24.6K",
  following: "128",
  handle: "@northwind_labs",
  name: "Northwind Labs",
  tagline: "Shipping something new every week",
  url: "https://example.com/northwind-labs",
};

const article = {
  description: "Muted palettes, generous whitespace and calm, rounded shapes.",
  image: `${ASSETS}/docs/demo1.jpg`,
  title: "Soft Minimalism",
  url: "https://example.com/soft-minimalism",
};

const ProfilePreview = () => (
  <>
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <Avatar.Image alt={profile.name} src={profile.avatar} />
        <Avatar.Fallback>NL</Avatar.Fallback>
      </Avatar>
      <div className="flex flex-col items-start justify-center">
        <span className="text-sm leading-4 font-semibold">{profile.name}</span>
        <span className="text-sm tracking-tight text-muted">{profile.handle}</span>
      </div>
    </div>
    <p className="mt-3 pl-px text-sm font-medium">
      {profile.bio}&nbsp;
      <br />
      <span aria-label="sparkles" role="img">
        ✨
      </span>
      &nbsp;{profile.tagline}
    </p>
    <div className="mt-3 flex gap-2">
      <div className="flex gap-1">
        <p className="text-sm font-semibold">{profile.following}</p>
        <p className="text-sm text-muted">Following</p>
      </div>
      <div className="flex gap-1">
        <p className="text-sm font-semibold">{profile.followers}</p>
        <p className="text-sm text-muted">Followers</p>
      </div>
    </div>
  </>
);

const ArticlePreview = () => (
  <>
    <img
      alt={`${article.title} design style`}
      className="h-36 w-full rounded-t-2xl object-cover"
      src={article.image}
    />
    <div className="p-4">
      <p className="text-sm font-semibold">{article.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{article.description}</p>
    </div>
  </>
);

const ProfileLink = () => (
  <Link className="underline" href={profile.url} target="_blank">
    {profile.handle}
  </Link>
);

/* -------------------------------------------------------------------------------------------------
 * Stories
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {closeDelay: 300, isDisabled: false, openDelay: 700, placement: "top", showArrow: false},
  render: ({offset, placement, showArrow, ...args}) => (
    <div className="px-10 py-24">
      <p className="text-sm leading-8">
        Follow{" "}
        <HoverCard {...args}>
          <HoverCard.Trigger>
            <ProfileLink />
          </HoverCard.Trigger>
          <HoverCard.Content aria-label="Profile preview" offset={offset} placement={placement}>
            {showArrow ? <HoverCard.Arrow /> : null}
            <ProfilePreview />
          </HoverCard.Content>
        </HoverCard>{" "}
        for weekly component deep dives.
      </p>
    </div>
  ),
};

export const WithArrow: Story = {
  render: () => (
    <div className="px-10 py-24">
      <p className="text-sm leading-8">
        Point at{" "}
        <HoverCard>
          <HoverCard.Trigger>
            <ProfileLink />
          </HoverCard.Trigger>
          <HoverCard.Content aria-label="Profile preview">
            <HoverCard.Arrow />
            <ProfilePreview />
          </HoverCard.Content>
        </HoverCard>{" "}
        to reveal a card that points back at it.
      </p>
    </div>
  ),
};

const placements: Array<{label: string; placement: Placement}> = [
  {label: "Top", placement: "top"},
  {label: "Left", placement: "left"},
  {label: "Right", placement: "right"},
  {label: "Bottom", placement: "bottom"},
];

export const Placements: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="my-2 text-sm text-muted">Hover a button</div>
      {placements.map(({label, placement}) => (
        <HoverCard key={placement}>
          <HoverCard.Trigger>
            <Button className="w-full" variant="outline">
              {label}
            </Button>
          </HoverCard.Trigger>
          <HoverCard.Content aria-label={`Profile preview (${label})`} placement={placement}>
            <HoverCard.Arrow />
            <ProfilePreview />
          </HoverCard.Content>
        </HoverCard>
      ))}
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <div className="px-10 py-24">
      <p className="text-sm leading-8">
        Read our notes on the{" "}
        <HoverCard>
          <HoverCard.Trigger>
            <Link className="underline" href={article.url} target="_blank">
              {article.title}
            </Link>
          </HoverCard.Trigger>
          <HoverCard.Content aria-label={`${article.title} preview`} className="w-72 p-0">
            <HoverCard.Arrow />
            <ArticlePreview />
          </HoverCard.Content>
        </HoverCard>{" "}
        design style.
      </p>
    </div>
  ),
};

const delays: Array<{closeDelay: number; label: string; openDelay: number}> = [
  {closeDelay: 0, label: "No delay", openDelay: 0},
  {closeDelay: 300, label: "Default (700 / 300)", openDelay: 700},
  {closeDelay: 500, label: "Slow (1000 / 500)", openDelay: 1000},
];

export const CustomDelays: Story = {
  render: () => (
    <div className="flex items-center gap-6 px-10 py-24">
      {delays.map(({closeDelay, label, openDelay}) => (
        <HoverCard key={label} closeDelay={closeDelay} openDelay={openDelay}>
          <HoverCard.Trigger>
            <Button variant="outline">{label}</Button>
          </HoverCard.Trigger>
          <HoverCard.Content aria-label={`${article.title} preview`} className="w-72 p-0">
            <HoverCard.Arrow />
            <ArticlePreview />
          </HoverCard.Content>
        </HoverCard>
      ))}
    </div>
  ),
};

const ControlledExample = (props: Omit<ComponentProps<typeof HoverCard>, "children">) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="px-10 py-24">
      <div className="mb-4 flex items-center gap-2">
        <Button size="sm" variant="outline" onPress={() => setIsOpen((open) => !open)}>
          {isOpen ? "Hide" : "Show"} preview
        </Button>
        <span className="text-[13px] opacity-60">
          State: <strong>{isOpen ? "open" : "closed"}</strong>
        </span>
      </div>
      <p className="text-sm leading-8">
        This preview is controlled:{" "}
        <HoverCard {...props} open={isOpen} onOpenChange={setIsOpen}>
          <HoverCard.Trigger>
            <ProfileLink />
          </HoverCard.Trigger>
          <HoverCard.Content aria-label="Profile preview">
            <HoverCard.Arrow />
            <ProfilePreview />
          </HoverCard.Content>
        </HoverCard>
      </p>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledExample />,
};
