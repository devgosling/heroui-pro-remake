import type {MorphButtonDirection} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import {Button, Separator, ToggleButton} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useState} from "react";

import {MorphButton, useMorphButton} from "./index";

const DIRECTIONS: MorphButtonDirection[] = [
  "top",
  "top-end",
  "end",
  "bottom-end",
  "bottom",
  "bottom-start",
  "start",
  "top-start",
];

const meta = {
  argTypes: {
    defaultOpen: {control: "boolean"},
    direction: {control: {type: "select"}, options: DIRECTIONS},
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {
      control: "boolean",
      description: "Light haptic when a press expands the button (touch devices).",
    },
    variant: {control: {type: "select"}, options: ["primary", "secondary"]},
  },
  component: MorphButton,
  parameters: {layout: "centered"},
  title: "Pro/Buttons/MorphButton",
} satisfies Meta<typeof MorphButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Shared demo pieces
 * -----------------------------------------------------------------------------------------------*/

/** Phone-sized screen, like the Native demo recordings. */
const PhoneFrame = ({children, title}: {children: React.ReactNode; title: string}) => (
  <div className="relative flex h-[720px] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[2.5rem] border border-separator bg-background">
    <div className="flex h-14 shrink-0 items-end justify-center pb-2 text-sm font-semibold text-foreground">
      {title}
    </div>
    {children}
  </div>
);

/** Closes the button from inside the panel through the `useMorphButton` hook. */
const PanelCloseButton = ({label = "Close"}: {label?: string}) => {
  const {close} = useMorphButton();

  return (
    <Button
      isIconOnly
      aria-label={label}
      className="size-8 bg-current/10 text-current"
      size="sm"
      variant="tertiary"
      onPress={close}
    >
      <Icon icon="gravity-ui:xmark" />
    </Button>
  );
};

/** Mini player content, used by several stories. Colors follow the surface (`currentColor`). */
const PlayerCollapsed = () => (
  <MorphButton.CollapsedContent>
    <Icon icon="gravity-ui:music-note" />
    <span>Now playing</span>
  </MorphButton.CollapsedContent>
);

const PlayerExpanded = ({className = "w-72"}: {className?: string}) => {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <MorphButton.ExpandedContent aria-label="Now playing" className={className}>
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" icon="gravity-ui:music-note" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">Harbor Lights</span>
          <span className="truncate text-xs text-current/60">The Quiet Engines</span>
        </div>
        <PanelCloseButton />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-current/15">
          <div className="h-full w-2/5 rounded-full bg-current" />
        </div>
        <div className="flex justify-between text-xs text-current/60 tabular-nums">
          <span>1:24</span>
          <span>3:41</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Button
          isIconOnly
          aria-label="Previous track"
          className="bg-transparent text-current"
          variant="tertiary"
        >
          <Icon icon="gravity-ui:backward-step" />
        </Button>
        <Button
          isIconOnly
          aria-label={isPlaying ? "Pause" : "Play"}
          className="bg-current/10 text-current"
          variant="tertiary"
          onPress={() => setIsPlaying((value) => !value)}
        >
          <Icon icon={isPlaying ? "gravity-ui:pause-fill" : "gravity-ui:play-fill"} />
        </Button>
        <Button
          isIconOnly
          aria-label="Next track"
          className="bg-transparent text-current"
          variant="tertiary"
        >
          <Icon icon="gravity-ui:forward-step" />
        </Button>
      </div>
    </MorphButton.ExpandedContent>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Basic usage
 * -----------------------------------------------------------------------------------------------*/
export const BasicUsage: Story = {
  args: {direction: "top", isHapticFeedbackEnabled: true, variant: "primary"},
  render: (args) => (
    <div className="flex h-[380px] w-[340px] items-end justify-center pb-4">
      <MorphButton {...args}>
        <PlayerCollapsed />
        <PlayerExpanded />
      </MorphButton>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
const FilterPanel = () => (
  <>
    <MorphButton.CollapsedContent>
      <Icon icon="gravity-ui:sliders" />
      <span>Filters</span>
      <span className="rounded-full bg-accent px-1.5 text-xs leading-5 text-accent-foreground">
        3
      </span>
    </MorphButton.CollapsedContent>
    <MorphButton.ExpandedContent aria-label="Filters" className="w-64">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">Filters</span>
        <PanelCloseButton label="Close filters" />
      </div>
      <div className="flex flex-wrap gap-2">
        {["Open now", "Outdoor seating", "Under $20", "Vegan", "Wi-Fi"].map((label, index) => (
          <span
            key={label}
            className={
              index < 3
                ? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                : "rounded-full bg-current/10 px-3 py-1 text-xs font-medium"
            }
          >
            {label}
          </span>
        ))}
      </div>
    </MorphButton.ExpandedContent>
  </>
);

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-[260px] w-[300px] items-end justify-center rounded-3xl bg-background pb-6">
          <MorphButton variant="primary">
            <FilterPanel />
          </MorphButton>
        </div>
        <span className="text-xs text-muted">primary - floating over app content</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-[260px] w-[300px] items-end justify-center rounded-3xl bg-surface pb-6 shadow-surface">
          <MorphButton variant="secondary">
            <FilterPanel />
          </MorphButton>
        </div>
        <span className="text-xs text-muted">secondary - on a surface card</span>
      </div>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Directions
 * -----------------------------------------------------------------------------------------------*/

/** Where each button sits inside its grid cell so its panel grows into the free space. */
const CELL_PLACEMENT: Record<MorphButtonDirection, string> = {
  bottom: "items-start justify-center",
  "bottom-end": "items-start justify-start",
  "bottom-start": "items-start justify-end",
  end: "items-center justify-start",
  start: "items-center justify-end",
  top: "items-end justify-center",
  "top-end": "items-end justify-start",
  "top-start": "items-end justify-end",
};

/** Grid order (row by row) so every panel grows away from the center. */
const GRID: Array<MorphButtonDirection | null> = [
  "top-start",
  "top",
  "top-end",
  "start",
  null,
  "end",
  "bottom-start",
  "bottom",
  "bottom-end",
];

export const Directions: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(3,240px)] grid-rows-[repeat(3,180px)] gap-3">
      {GRID.map((direction, index) =>
        direction ? (
          <div
            key={direction}
            className={`flex rounded-2xl border border-dashed border-separator p-3 ${CELL_PLACEMENT[direction]}`}
          >
            <MorphButton direction={direction}>
              <MorphButton.CollapsedContent className="h-9 px-3.5 text-xs">
                {direction}
              </MorphButton.CollapsedContent>
              <MorphButton.ExpandedContent aria-label={direction} className="w-40 gap-1 p-4">
                <span className="text-sm font-semibold">{direction}</span>
                <span className="text-xs text-current/70">
                  Grows this way; the opposite edge stays pinned.
                </span>
              </MorphButton.ExpandedContent>
            </MorphButton>
          </div>
        ) : (
          <div
            key={`center-${index}`}
            className="flex items-center justify-center text-center text-xs text-muted"
          >
            Tap a button to see which way it grows
          </div>
        ),
      )}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Positioning (floating at the bottom of a screen)
 * -----------------------------------------------------------------------------------------------*/
const INBOX = [
  {from: "Mara Lindqvist", subject: "Venue shortlist for the offsite", time: "9:41"},
  {from: "Build Bot", subject: "Nightly build passed (214 checks)", time: "8:12"},
  {from: "Theo Nakamura", subject: "Re: Q3 roadmap review notes", time: "Yesterday"},
  {from: "Priya Raman", subject: "Updated invoice for October", time: "Yesterday"},
  {from: "Studio Weekly", subject: "Five layout ideas for small teams", time: "Mon"},
  {from: "Jonas Brandt", subject: "Photos from Saturday's hike", time: "Sun"},
  {from: "Ines Duarte", subject: "Can we move our call to 3pm?", time: "Sat"},
];

export const Positioning: Story = {
  parameters: {layout: "centered"},
  render: () => (
    <PhoneFrame title="Inbox">
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="flex flex-col divide-y divide-separator rounded-3xl bg-surface px-4">
          {INBOX.map((mail) => (
            <div key={mail.subject} className="flex flex-col gap-0.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-foreground">{mail.from}</span>
                <span className="shrink-0 text-xs text-muted">{mail.time}</span>
              </div>
              <span className="truncate text-sm text-muted">{mail.subject}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <MorphButton direction="top">
          <MorphButton.CollapsedContent>
            <Icon icon="gravity-ui:pencil" />
            <span>Compose</span>
          </MorphButton.CollapsedContent>
          <MorphButton.ExpandedContent aria-label="Create" className="w-72">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Create</span>
              <PanelCloseButton />
            </div>
            {[
              {icon: "gravity-ui:envelope", label: "New message"},
              {icon: "gravity-ui:calendar", label: "Meeting invite"},
              {icon: "gravity-ui:file-text", label: "Shared note"},
            ].map((item) => (
              <Button
                key={item.label}
                fullWidth
                className="justify-start bg-current/10 text-current"
                variant="tertiary"
              >
                <Icon icon={item.icon} />
                {item.label}
              </Button>
            ))}
          </MorphButton.ExpandedContent>
        </MorphButton>
      </div>
    </PhoneFrame>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Panel width (explicit width, height re-measured when the content changes)
 * -----------------------------------------------------------------------------------------------*/
const ACTIVITY = [
  {text: "Lena approved the design review", time: "2m"},
  {text: "Deploy to staging finished", time: "14m"},
  {text: "Omar commented on Pricing v2", time: "1h"},
  {text: "Weekly report is ready", time: "3h"},
  {text: "Two new members joined Design", time: "5h"},
];

const ActivityPanel = () => {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? ACTIVITY : ACTIVITY.slice(0, 2);

  return (
    <MorphButton.ExpandedContent aria-label="Activity" className="w-80">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">Activity</span>
        <PanelCloseButton label="Close activity" />
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.text} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-current/80">{item.text}</span>
            <span className="shrink-0 text-xs text-current/50">{item.time}</span>
          </li>
        ))}
      </ul>
      <Button
        fullWidth
        className="bg-current/10 text-current"
        size="sm"
        variant="tertiary"
        onPress={() => setShowAll((value) => !value)}
      >
        {showAll ? "Show less" : `Show all ${ACTIVITY.length}`}
      </Button>
    </MorphButton.ExpandedContent>
  );
};

export const PanelWidth: Story = {
  render: () => (
    <div className="flex h-[420px] w-[380px] items-end justify-center pb-4">
      <MorphButton>
        <MorphButton.CollapsedContent>
          <Icon icon="gravity-ui:bell" />
          <span>Activity</span>
          <span className="size-2 rounded-full bg-danger" />
        </MorphButton.CollapsedContent>
        <ActivityPanel />
      </MorphButton>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
export const Controlled: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-[300px] w-[340px] items-end justify-center pb-4">
          <MorphButton isOpen={isOpen} onOpenChange={setIsOpen}>
            <MorphButton.CollapsedContent>
              <Icon icon="gravity-ui:cloud" />
              <span>Storage</span>
            </MorphButton.CollapsedContent>
            <MorphButton.ExpandedContent aria-label="Storage" className="w-72">
              <span className="text-base font-semibold">Storage</span>
              <div className="h-2 overflow-hidden rounded-full bg-current/15">
                <div className="h-full w-[68%] rounded-full bg-accent" />
              </div>
              <span className="text-sm text-current/70">68 GB of 100 GB used</span>
              <Button
                fullWidth
                className="bg-current/10 text-current"
                size="sm"
                variant="tertiary"
                onPress={() => setIsOpen(false)}
              >
                Done
              </Button>
            </MorphButton.ExpandedContent>
          </MorphButton>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
            Open
          </Button>
          <Button size="sm" variant="secondary" onPress={() => setIsOpen(false)}>
            Close
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setIsOpen((value) => !value)}>
            Toggle
          </Button>
        </div>
        <span className="text-xs text-muted">isOpen: {String(isOpen)}</span>
      </div>
    );
  },
};

/* -------------------------------------------------------------------------------------------------
 * Disabled
 * -----------------------------------------------------------------------------------------------*/
export const Disabled: Story = {
  render: () => (
    <div className="flex h-[200px] w-[300px] items-end justify-center pb-4">
      <MorphButton isDisabled>
        <MorphButton.CollapsedContent>
          <Icon icon="gravity-ui:lock" />
          <span>Checkout unavailable</span>
        </MorphButton.CollapsedContent>
        <MorphButton.ExpandedContent aria-label="Checkout" className="w-64">
          <span className="text-sm">This panel cannot be opened.</span>
        </MorphButton.ExpandedContent>
      </MorphButton>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom morph spring
 * -----------------------------------------------------------------------------------------------*/
const SpringDemo = ({
  animation,
  caption,
  label,
}: {
  animation?: React.ComponentProps<typeof MorphButton>["animation"];
  caption: string;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-3">
    <div className="flex h-[260px] w-[220px] items-end justify-center pb-2">
      <MorphButton animation={animation}>
        <MorphButton.CollapsedContent>
          <Icon icon="gravity-ui:thunderbolt" />
          <span>{label}</span>
        </MorphButton.CollapsedContent>
        <MorphButton.ExpandedContent aria-label={label} className="w-52">
          <span className="text-base font-semibold">{label}</span>
          <span className="text-sm text-current/70">
            Tap the panel to collapse it again and compare the motion.
          </span>
        </MorphButton.ExpandedContent>
      </MorphButton>
    </div>
    <code className="text-xs text-muted">{caption}</code>
  </div>
);

export const CustomMorphSpring: Story = {
  render: () => (
    <div className="flex flex-wrap items-end justify-center gap-6">
      <SpringDemo caption="default (25 / 300 / 0.8)" label="Default" />
      <SpringDemo
        animation={{morphSpringConfig: {damping: 30, stiffness: 400}}}
        caption="damping 30, stiffness 400"
        label="Snappy"
      />
      <SpringDemo
        animation={{morphSpringConfig: {damping: 10, stiffness: 180}}}
        caption="damping 10, stiffness 180"
        label="Bouncy"
      />
      <SpringDemo animation="disable-all" caption='animation="disable-all"' label="Instant" />
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example: bag summary floating over a product list
 * -----------------------------------------------------------------------------------------------*/
interface Product {
  id: string;
  name: string;
  line: string;
  price: number;
  originalPrice?: number;
  tint: string;
}

const PRODUCTS: Product[] = [
  {
    id: "aero",
    line: "Classics",
    name: "Aero Court",
    originalPrice: 120,
    price: 96,
    tint: "text-accent",
  },
  {id: "field", line: "Women's Running", name: "Field Runner", price: 110, tint: "text-foreground"},
  {id: "harbor", line: "Classics", name: "Harbor Low", price: 124, tint: "text-warning"},
  {
    id: "metro",
    line: "Lifestyle",
    name: "Metro 70",
    originalPrice: 105,
    price: 89,
    tint: "text-muted",
  },
  {id: "summit", line: "Outdoor", name: "Summit Trail", price: 138, tint: "text-success"},
  {id: "pace", line: "Running", name: "Pace Knit", price: 102, tint: "text-danger"},
];

const formatPrice = (value: number) => `$${value}`;

/** Simple sneaker silhouette (own drawing). */
const SneakerArt = ({className}: {className: string}) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 64 32">
    <path
      d="M5 22.5c0-3.4 1.3-6.6 3.6-9l5.2-5.3a3 3 0 0 1 4.3 0l2.6 2.6a9 9 0 0 0 6.4 2.7h6.1c6 0 11.8 1.8 16.6 5.2l5.6 4c1.6 1.1 2.6 3 2.6 5V28H5z"
      fill="currentColor"
    />
    <path d="M5 26h52.6V28a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.45" />
    <path
      d="M20 13.5l3 3M24.5 12.5l3 3M29 13l2.5 2.5"
      stroke="var(--surface)"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
);

const CartExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bag, setBag] = useState<Record<string, number>>({aero: 1});
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(["field", "pace"]));

  const lines = PRODUCTS.filter((product) => bag[product.id]);
  const count = lines.reduce((sum, product) => sum + (bag[product.id] ?? 0), 0);
  const subtotal = lines.reduce((sum, product) => sum + product.price * (bag[product.id] ?? 0), 0);

  const addToBag = (id: string) =>
    setBag((current) => ({...current, [id]: (current[id] ?? 0) + 1}));
  const toggleFavorite = (id: string, isSelected: boolean) =>
    setFavorites((current) => {
      const next = new Set(current);

      if (isSelected) next.add(id);
      else next.delete(id);

      return next;
    });

  return (
    <PhoneFrame title="Sneakers">
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <ul className="flex flex-col gap-4 rounded-3xl bg-surface p-4">
          {PRODUCTS.map((product) => (
            <li key={product.id} className="flex gap-3">
              <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-default">
                <SneakerArt className={`w-14 ${product.tint}`} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-base font-medium text-foreground">
                    {product.name}
                  </span>
                  <ToggleButton
                    isIconOnly
                    aria-label={`Favorite ${product.name}`}
                    className="-me-2 -mt-1 size-7 bg-transparent"
                    isSelected={favorites.has(product.id)}
                    size="sm"
                    variant="ghost"
                    onChange={(isSelected) => toggleFavorite(product.id, isSelected)}
                  >
                    {({isSelected}) => (
                      <Icon
                        className={isSelected ? "text-danger" : "text-muted"}
                        icon={isSelected ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
                      />
                    )}
                  </ToggleButton>
                </div>
                <span className="text-xs text-muted">{product.line}</span>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm">
                    <span className={product.originalPrice ? "text-danger" : "text-foreground"}>
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice ? (
                      <span className="ms-1.5 text-muted line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    ) : null}
                  </span>
                  <Button
                    className="-me-2 h-7 px-2 text-xs"
                    size="sm"
                    variant="ghost"
                    onPress={() => addToBag(product.id)}
                  >
                    Add to bag
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <MorphButton direction="top" isOpen={isOpen} onOpenChange={setIsOpen}>
          <MorphButton.CollapsedContent>
            <Icon icon="gravity-ui:shopping-bag" />
            <span className="text-sm font-medium text-background">
              {count} {count === 1 ? "product" : "products"} in bag
            </span>
            <span className="rounded-2xl bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-foreground">
              View
            </span>
          </MorphButton.CollapsedContent>
          <MorphButton.ExpandedContent aria-label="Order summary" className="w-80">
            <span className="text-base font-semibold text-background">Order summary</span>
            <ul className="flex flex-col gap-2">
              {lines.map((product) => (
                <li key={product.id} className="flex items-center justify-between">
                  <span className="text-sm text-background/70">
                    {bag[product.id]} × {product.name}
                  </span>
                  <span className="text-sm font-medium text-background">
                    {formatPrice(product.price * (bag[product.id] ?? 0))}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="bg-background/15" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-background">Subtotal</span>
              <span className="text-base font-semibold text-background">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex-1 bg-background/10 text-background"
                variant="tertiary"
                onPress={() => setIsOpen(false)}
              >
                Keep shopping
              </Button>
              <Button className="flex-1 bg-background text-foreground" variant="tertiary">
                Buy now
              </Button>
            </div>
          </MorphButton.ExpandedContent>
        </MorphButton>
      </div>
    </PhoneFrame>
  );
};

export const Example: Story = {
  render: () => <CartExample />,
};
