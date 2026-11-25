import type {Meta, StoryObj} from "@storybook/react";
import type {ReactNode} from "react";

import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import React, {useState} from "react";
import {usePress} from "react-aria/usePress";

import {FAB, useFAB, useFABAnimation} from "./index";

const meta = {
  argTypes: {
    align: {control: {type: "select"}, options: ["auto", "start", "center", "end"]},
    isDisabled: {control: "boolean"},
    isHapticFeedbackEnabled: {
      control: "boolean",
      description: "Vibrates briefly (light) when the FAB opens via a press on touch devices",
    },
    itemsAppearance: {control: {type: "radio"}, options: ["staggered", "normal"]},
    placement: {
      control: {type: "select"},
      options: ["auto", "top", "bottom", "left", "right"],
    },
  },
  component: FAB,
  parameters: {layout: "centered"},
  title: "Pro/Buttons/FAB",
} satisfies Meta<typeof FAB>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------------------------------------
 * Story helpers
 * -----------------------------------------------------------------------------------------------*/
/**
 * Phone-sized screen. The FAB portal renders into it (`FAB.Portal container`), so the overlay and
 * the auto placement use the screen instead of the whole Storybook canvas.
 */
const PhoneScreen = ({
  children,
  className,
}: {
  children: (container: HTMLDivElement | null) => ReactNode;
  className?: string;
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainer}
      className={`relative h-[720px] w-[390px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[2.5rem] border border-separator bg-background shadow-overlay ${className ?? ""}`}
    >
      {children(container)}
    </div>
  );
};

const ScreenHeader = ({subtitle, title}: {title: string; subtitle?: string}) => (
  <div className="border-b border-separator px-5 pt-6 pb-3">
    <p className="text-xl font-bold text-foreground">{title}</p>
    {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
  </div>
);

const PlaceholderRows = ({count = 6}: {count?: number}) => (
  <div className="flex flex-col gap-3 p-5">
    {Array.from({length: count}, (_, index) => (
      <div
        key={index}
        className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-surface"
      >
        <div className="size-10 shrink-0 rounded-full bg-default" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="h-2.5 w-2/5 rounded-full bg-default" />
          <div className="h-2.5 w-4/5 rounded-full bg-default/70" />
        </div>
      </div>
    ))}
  </div>
);

const log = (action: string) => () => {
  // eslint-disable-next-line no-console
  console.log(action);
};

/* -------------------------------------------------------------------------------------------------
 * Basic usage
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  args: {
    align: "auto",
    isDisabled: false,
    isHapticFeedbackEnabled: true,
    itemsAppearance: "staggered",
    placement: "auto",
  },
  render: (args) => (
    <PhoneScreen>
      {(container) => (
        <>
          <ScreenHeader subtitle="Tap the button to add something" title="Notes" />
          <PlaceholderRows />
          <FAB {...args} className="absolute right-6 bottom-6">
            <FAB.Trigger aria-label="Create">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item onPress={log("new note")}>New note</FAB.Item>
                <FAB.Item onPress={log("new checklist")}>New checklist</FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Manual placement
 * -----------------------------------------------------------------------------------------------*/
export const ManualPlacement: Story = {
  render: () => (
    <PhoneScreen>
      {(container) => (
        <>
          <div className="flex h-20 items-center justify-end border-b border-separator px-5">
            <p className="text-sm font-semibold text-foreground">Projects</p>
          </div>
          <PlaceholderRows />
          <FAB align="start" className="absolute top-4 left-5" placement="bottom">
            <FAB.Trigger aria-label="Quick actions">
              <Icon icon="gravity-ui:bars" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item onPress={log("new project")}>New project</FAB.Item>
                <FAB.Item onPress={log("import")}>Import</FAB.Item>
                <FAB.Item onPress={log("settings")}>Settings</FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Items appearing mode
 * -----------------------------------------------------------------------------------------------*/
export const ItemsAppearingMode: Story = {
  render: () => (
    <PhoneScreen>
      {(container) => (
        <>
          <ScreenHeader
            subtitle='Left: itemsAppearance="normal" - right: itemWindow 0.4'
            title="Appearance"
          />
          <PlaceholderRows />
          <FAB className="absolute bottom-6 left-6" itemsAppearance="normal">
            <FAB.Trigger aria-label="Actions (normal)">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item>Upload file</FAB.Item>
                <FAB.Item>Create folder</FAB.Item>
                <FAB.Item>Scan document</FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
          <FAB animation={{stagger: {itemWindow: 0.4}}} className="absolute right-6 bottom-6">
            <FAB.Trigger aria-label="Actions (stagger 0.4)">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item>Upload file</FAB.Item>
                <FAB.Item>Create folder</FAB.Item>
                <FAB.Item>Scan document</FAB.Item>
                <FAB.Item>Record audio</FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Items with icons
 * -----------------------------------------------------------------------------------------------*/
const MapBackdrop = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 bg-surface-secondary"
    style={{
      backgroundImage:
        "linear-gradient(90deg, var(--separator) 1px, transparent 1px), linear-gradient(0deg, var(--separator) 1px, transparent 1px), radial-gradient(circle at 70% 60%, color-mix(in oklab, var(--accent) 22%, transparent) 0 18%, transparent 19%)",
      backgroundSize: "56px 56px, 56px 56px, 100% 100%",
    }}
  />
);

export const ItemsWithIcons: Story = {
  render: () => (
    <PhoneScreen>
      {(container) => (
        <>
          <MapBackdrop />
          <div className="absolute inset-x-4 top-6 flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm text-muted shadow-surface">
            <Icon className="size-4" icon="gravity-ui:magnifier" />
            Find a place
          </div>
          <FAB className="absolute bottom-6 left-6">
            <FAB.Trigger aria-label="Map tools">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item onPress={log("terrain")}>
                  <Icon icon="gravity-ui:layers" />
                  <FAB.ItemLabel>Terrain</FAB.ItemLabel>
                </FAB.Item>
                <FAB.Item onPress={log("share location")}>
                  <Icon icon="gravity-ui:map-pin" />
                  <FAB.ItemLabel>Share location</FAB.ItemLabel>
                </FAB.Item>
                <FAB.Item onPress={log("favorites")}>
                  <Icon icon="gravity-ui:star-fill" />
                  <FAB.ItemLabel>Favorites</FAB.ItemLabel>
                </FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Controlled
 * -----------------------------------------------------------------------------------------------*/
const ControlledDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PhoneScreen>
      {(container) => (
        <>
          <ScreenHeader subtitle={`isOpen: ${String(isOpen)}`} title="Controlled" />
          <div className="flex gap-2 p-5">
            <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
              Open FAB
            </Button>
            <Button size="sm" variant="tertiary" onPress={() => setIsOpen(false)}>
              Close FAB
            </Button>
          </div>
          <PlaceholderRows count={4} />
          <FAB className="absolute right-6 bottom-6" isOpen={isOpen} onOpenChange={setIsOpen}>
            <FAB.Trigger aria-label="Compose">
              <Icon icon="gravity-ui:pencil" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item>Write post</FAB.Item>
                <FAB.Item>Start poll</FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  );
};

export const Controlled: Story = {
  render: () => <ControlledDemo />,
};

/* -------------------------------------------------------------------------------------------------
 * Blur backdrop
 * -----------------------------------------------------------------------------------------------*/
const TILE_COLORS = [
  "from-rose-200 to-amber-200",
  "from-sky-300 to-cyan-200",
  "from-amber-300 to-orange-400",
  "from-violet-300 to-fuchsia-200",
  "from-emerald-200 to-teal-300",
  "from-pink-200 to-rose-300",
];

const PhotoGrid = () => (
  <div className="flex flex-col gap-1 p-5">
    <p className="text-lg font-bold text-foreground">Library</p>
    <p className="mb-3 text-xs text-muted">6 photos - 2 albums</p>
    <div className="grid grid-cols-2 gap-2">
      {TILE_COLORS.map((colors) => (
        <div
          key={colors}
          className={`aspect-square rounded-2xl bg-linear-to-br ${colors} shadow-surface`}
        />
      ))}
    </div>
  </div>
);

export const BlurBackdrop: Story = {
  render: () => (
    <PhoneScreen>
      {(container) => (
        <>
          <PhotoGrid />
          <FAB className="absolute right-6 bottom-6">
            <FAB.Trigger aria-label="Selection actions">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay blurViewProps={{intensity: 60}} variant="blur" />
              <FAB.Content>
                <FAB.Item>
                  <Icon icon="gravity-ui:arrow-shape-turn-up-right" />
                  <FAB.ItemLabel>Send to…</FAB.ItemLabel>
                </FAB.Item>
                <FAB.Item>
                  <Icon icon="gravity-ui:arrow-down-to-line" />
                  <FAB.ItemLabel>Save copies</FAB.ItemLabel>
                </FAB.Item>
                <FAB.Item className="text-danger">
                  <Icon icon="gravity-ui:trash-bin" />
                  <FAB.ItemLabel>Remove</FAB.ItemLabel>
                </FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom backdrop (built on useFAB + useFABAnimation)
 * -----------------------------------------------------------------------------------------------*/
/** Maps the [idle, open, close] = [0, 1, 2] progress to a value. */
const interpolate = (progress: number, [idle, open, close]: [number, number, number]) =>
  progress <= 1 ? idle + (open - idle) * progress : open + (close - open) * (progress - 1);

const FrostedAccentBackdrop = () => {
  const {onOpenChange} = useFAB();
  const {progress} = useFABAnimation();
  const {pressProps} = usePress({onPress: () => onOpenChange(false)});
  const blur = interpolate(progress, [0, 10, 0]);

  return (
    <div
      {...pressProps}
      aria-hidden="true"
      className="pointer-events-auto absolute inset-0 bg-accent/15"
      style={{
        backdropFilter: `blur(${blur}px)`,
        opacity: interpolate(progress, [0, 1, 0]),
        WebkitBackdropFilter: `blur(${blur}px)`,
      }}
    />
  );
};

export const CustomBackdrop: Story = {
  render: () => (
    <PhoneScreen>
      {(container) => (
        <>
          <PhotoGrid />
          <FAB className="absolute right-6 bottom-6">
            <FAB.Trigger aria-label="Album actions">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FrostedAccentBackdrop />
              <FAB.Content>
                <FAB.Item>New album</FAB.Item>
                <FAB.Item>Add photos</FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom animation configuration
 * -----------------------------------------------------------------------------------------------*/
export const CustomAnimationConfiguration: Story = {
  render: () => (
    <PhoneScreen>
      {(container) => (
        <>
          <ScreenHeader
            subtitle="Timing 400ms, 135° rotation, lighter overlay, longer item travel"
            title="Animation"
          />
          <PlaceholderRows />
          <FAB
            animation={{progress: {config: {duration: 400}, type: "timing"}}}
            className="absolute right-6 bottom-6"
          >
            <FAB.Trigger animation={{rotate: {value: [0, 135, 0]}}} aria-label="Add">
              <Icon icon="gravity-ui:plus" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay animation={{opacity: {value: [0, 0.6, 0]}}} />
              <FAB.Content>
                <FAB.Item animation={{scale: {value: [0.8, 1]}, translate: {value: 24}}}>
                  Add contact
                </FAB.Item>
                <FAB.Item animation={{scale: {value: [0.8, 1]}, translate: {value: 24}}}>
                  Add group
                </FAB.Item>
                <FAB.Item animation={{scale: {value: [0.8, 1]}, translate: {value: 24}}}>
                  Invite by link
                </FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </>
      )}
    </PhoneScreen>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Fixed to the viewport (real apps: portal into document.body)
 * -----------------------------------------------------------------------------------------------*/
export const FixedToViewport: Story = {
  parameters: {layout: "fullscreen"},
  render: () => (
    <div className="min-h-screen bg-background p-6">
      <p className="mb-4 max-w-lg text-sm text-muted">
        The FAB is fixed to the bottom-end corner of the viewport and its portal renders into
        document.body, so the overlay covers the whole page.
      </p>
      <PlaceholderRows count={10} />
      <FAB className="fixed end-6 bottom-20">
        <FAB.Trigger aria-label="Create">
          <Icon icon="gravity-ui:plus" />
        </FAB.Trigger>
        <FAB.Portal>
          <FAB.Overlay />
          <FAB.Content>
            <FAB.Item>New invoice</FAB.Item>
            <FAB.Item>New customer</FAB.Item>
            <FAB.Item>New product</FAB.Item>
          </FAB.Content>
        </FAB.Portal>
      </FAB>
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Example - mail inbox with a compose FAB
 * -----------------------------------------------------------------------------------------------*/
const MESSAGES = [
  {sender: "Ava Brooks", subject: "Sprint retro notes", time: "10:12"},
  {sender: "Northwind Energy", subject: "Your November bill is available", time: "07:58"},
  {sender: "Jonas Weber", subject: "Re: Workshop dates", time: "Yesterday"},
];

export const Example: Story = {
  render: () => (
    <PhoneScreen className="bg-surface">
      {(container) => (
        <div className="flex h-full flex-col bg-surface">
          <div className="border-b border-border px-5 pt-5 pb-3">
            <p className="text-xl font-bold text-foreground">Inbox</p>
            <p className="text-xs text-muted">3 unread messages</p>
          </div>
          <div className="flex-1">
            {MESSAGES.map((message) => (
              <div key={message.subject} className="border-b border-separator px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{message.sender}</p>
                  <p className="text-xs text-muted">{message.time}</p>
                </div>
                <p className="truncate text-xs text-foreground">{message.subject}</p>
              </div>
            ))}
          </div>
          <FAB className="absolute right-6 bottom-6">
            <FAB.Trigger aria-label="Compose">
              <Icon icon="gravity-ui:pencil" />
            </FAB.Trigger>
            <FAB.Portal container={container}>
              <FAB.Overlay />
              <FAB.Content>
                <FAB.Item onPress={log("new message")}>New message</FAB.Item>
                <FAB.Item onPress={log("new label")}>New label</FAB.Item>
                <FAB.Item onPress={log("new folder")}>
                  <Icon className="text-muted" icon="gravity-ui:folder" />
                  <FAB.ItemLabel>New folder</FAB.ItemLabel>
                </FAB.Item>
              </FAB.Content>
            </FAB.Portal>
          </FAB>
        </div>
      )}
    </PhoneScreen>
  ),
};
