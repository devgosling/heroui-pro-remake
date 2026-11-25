import type {Meta, StoryObj} from "@storybook/react";
import type {CSSProperties, ReactNode} from "react";

import {Icon} from "@iconify/react";

import {HoloCard} from "./index";

const meta = {
  argTypes: {
    activateOnHover: {control: "boolean"},
    gradient: {control: "text"},
    hoverScale: {control: {max: 1.2, min: 1, step: 0.01, type: "range"}},
    isDisabled: {control: "boolean"},
    isInteractive: {control: "boolean"},
    maxTilt: {control: {max: 30, min: 0, step: 0.5, type: "range"}},
    parallaxStrength: {control: {max: 40, min: 0, step: 1, type: "range"}},
    patternSize: {control: "text"},
    patternSrc: {control: "text"},
    shineOpacity: {control: {max: 1, min: 0, step: 0.05, type: "range"}},
    tiltOnTouch: {control: "boolean"},
  },
  component: HoloCard,
  parameters: {layout: "centered"},
  title: "Pro/DataDisplay/HoloCard",
} satisfies Meta<typeof HoloCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Card geometry is set through the documented CSS variables. */
const size = (width: number, height: number, radius: number, bleed: number) =>
  ({
    "--holo-card-bleed": `${bleed}px`,
    "--holo-card-height": `${height}px`,
    "--holo-card-radius": `${radius}px`,
    "--holo-card-width": `${width}px`,
  }) as CSSProperties;

/** Rotator > Frame > Surface, the three required layers. */
const CardBody = ({children}: {children: ReactNode}) => (
  <HoloCard.Rotator>
    <HoloCard.Frame>
      <HoloCard.Surface>{children}</HoloCard.Surface>
    </HoloCard.Frame>
  </HoloCard.Rotator>
);

/** Contactless symbol: three concentric arcs (drawn for this story). */
const ContactlessIcon = () => (
  <svg
    aria-hidden="true"
    className="size-5 text-white/35"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeWidth="1.6"
    viewBox="0 0 24 24"
  >
    <path d="M7.5 8.5a5 5 0 0 1 0 7" />
    <path d="M11 6.5a8.5 8.5 0 0 1 0 11" />
    <path d="M14.5 4.5a12 12 0 0 1 0 15" />
    <path d="M18 3a15 15 0 0 1 0 18" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Default
 * -----------------------------------------------------------------------------------------------*/
export const Default: Story = {
  render: (args) => (
    <HoloCard {...args}>
      <CardBody>
        <HoloCard.Inset />
        <HoloCard.Pattern />
        <HoloCard.Content className="flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-white">Prism Pass</span>
            <span className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Tilt to reveal the foil
            </span>
          </div>
        </HoloCard.Content>
        <HoloCard.Shine />
      </CardBody>
    </HoloCard>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Membership card
 * -----------------------------------------------------------------------------------------------*/
export const MembershipCard: Story = {
  render: (args) => (
    <HoloCard
      gradient="linear-gradient(150deg, rgb(52, 46, 58) 0%, rgb(38, 35, 44) 40%, rgb(25, 25, 33) 75%, rgb(16, 17, 26) 100%)"
      {...args}
    >
      <CardBody>
        <HoloCard.Inset />
        <HoloCard.Pattern />
        <HoloCard.Content className="justify-center pt-12">
          <Icon className="size-6 text-white/40 mix-blend-soft-light" icon="gravity-ui:star" />
        </HoloCard.Content>
        <HoloCard.Content className="flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">Ava Lindqvist</span>
          <span className="text-[10px] font-medium text-white/40">Founding member since 2024</span>
        </HoloCard.Content>
        <HoloCard.Content className="items-end justify-center pb-10">
          <div className="flex w-[220px] justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-white/30">Since</span>
              <span className="text-sm font-semibold text-white/40">Jan 4, 2024</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium text-white/30">Pass</span>
              <span className="text-sm font-semibold text-white/40">#0412</span>
            </div>
          </div>
        </HoloCard.Content>
        <HoloCard.Shine />
      </CardBody>
    </HoloCard>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Credit card (landscape, ISO/IEC 7810 ID-1 proportions)
 * -----------------------------------------------------------------------------------------------*/
export const CreditCard: Story = {
  render: (args) => (
    <HoloCard
      gradient="linear-gradient(135deg, rgb(44, 52, 58) 0%, rgb(31, 38, 44) 45%, rgb(18, 23, 29) 100%)"
      style={size(380, 240, 16, 28)}
      {...args}
    >
      <CardBody>
        <HoloCard.Inset />
        <HoloCard.Pattern />
        <HoloCard.Content className="flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-white/80">Northwind</span>
              <span className="text-[10px] font-medium tracking-widest text-white/35">
                Graphite
              </span>
            </div>
            <ContactlessIcon />
          </div>
          <div className="flex flex-col gap-3.5">
            <div
              aria-hidden="true"
              className="relative h-7 w-9 overflow-clip rounded-[5px] bg-gradient-to-br from-zinc-100/80 via-zinc-400/70 to-zinc-200/70"
            >
              <div className="absolute inset-x-0 top-1/3 h-px bg-black/20" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-black/20" />
              <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-black/20" />
            </div>
            <span className="font-mono text-lg tracking-[0.18em] text-white/85">
              <span aria-hidden="true">•••• •••• •••• </span>
              <span className="sr-only">Card number ending in </span>
              8136
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-white/30">Card holder</span>
              <span className="text-sm font-semibold text-white/70">Ava Lindqvist</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium text-white/30">Valid thru</span>
              <span className="text-sm font-semibold text-white/70 tabular-nums">11/30</span>
            </div>
          </div>
        </HoloCard.Content>
        <HoloCard.Shine />
      </CardBody>
    </HoloCard>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Custom gradient
 * -----------------------------------------------------------------------------------------------*/
const gradients = [
  {
    gradient:
      "linear-gradient(140deg, rgb(249, 115, 22) 0%, rgb(204, 84, 20) 30%, rgb(150, 56, 18) 66%, rgb(96, 32, 14) 100%)",
    name: "Ember",
  },
  {
    gradient:
      "linear-gradient(140deg, rgb(236, 72, 153) 0%, rgb(190, 50, 122) 30%, rgb(140, 32, 92) 66%, rgb(92, 18, 62) 100%)",
    name: "Orchid",
  },
  {
    gradient:
      "linear-gradient(140deg, rgb(20, 184, 166) 0%, rgb(15, 140, 128) 30%, rgb(10, 98, 92) 66%, rgb(6, 58, 56) 100%)",
    name: "Lagoon",
  },
];

export const CustomGradient: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {gradients.map(({gradient, name}) => (
        <HoloCard key={name} gradient={gradient} style={size(150, 225, 16, 20)} {...args}>
          <CardBody>
            <HoloCard.Inset />
            <HoloCard.Content className="items-center justify-center">
              <span className="text-xl font-semibold text-white">{name}</span>
            </HoloCard.Content>
            <HoloCard.Shine />
          </CardBody>
        </HoloCard>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * With pattern
 * -----------------------------------------------------------------------------------------------*/
const patterns = [
  {
    name: "Pinpoint",
    pattern:
      "radial-gradient(circle at center, rgb(255 255 255 / 0.9) 0 2px, rgb(0 0 0 / 0.55) 2.5px 100%)",
    patternSize: "14px 14px",
  },
  {
    name: "Weave",
    pattern:
      "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.8) 0px, rgb(130 130 130 / 0.3) 3px, rgb(0 0 0 / 0.65) 6px), repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.35) 0px, transparent 3px, rgb(0 0 0 / 0.35) 6px)",
    patternSize: "auto",
  },
];

export const WithPattern: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {patterns.map(({name, pattern, patternSize}) => (
        <HoloCard
          key={name}
          patternSize={patternSize}
          patternSrc={pattern}
          style={size(215, 320, 18, 22)}
          {...args}
        >
          <CardBody>
            <HoloCard.Inset />
            <HoloCard.Pattern />
            <HoloCard.Content className="items-end justify-center pb-8">
              <span className="text-[10px] font-medium tracking-widest text-white/50 uppercase">
                {name}
              </span>
            </HoloCard.Content>
            <HoloCard.Shine />
          </CardBody>
        </HoloCard>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Image gallery (image only)
 * -----------------------------------------------------------------------------------------------*/
const artworks = [
  {alt: "Arcade cabinet glowing in a dark room", seed: 11},
  {alt: "Retro handheld console on a desk", seed: 14},
  {alt: "Racing game scene at dusk", seed: 19},
];

export const ImageGallery: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center">
      {artworks.map(({alt, seed}) => (
        <HoloCard key={seed} style={size(210, 294, 14, 24)} {...args}>
          <CardBody>
            <HoloCard.Image
              alt={alt}
              src={`https://img.heroui.chat/image/game?w=420&h=588&u=${seed}`}
            />
            <HoloCard.Pattern />
            <HoloCard.Shine />
          </CardBody>
        </HoloCard>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Static
 * -----------------------------------------------------------------------------------------------*/
export const Static: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {[
        {isInteractive: true, label: "Tilting"},
        {isInteractive: false, label: "Frozen"},
      ].map(({isInteractive, label}) => (
        <HoloCard
          key={label}
          isInteractive={isInteractive}
          style={size(200, 300, 16, 20)}
          {...args}
        >
          <CardBody>
            <HoloCard.Inset />
            <HoloCard.Content className="items-center justify-center">
              <span className="text-lg font-semibold text-white">{label}</span>
            </HoloCard.Content>
            <HoloCard.Shine />
          </CardBody>
        </HoloCard>
      ))}
    </div>
  ),
};

/* -------------------------------------------------------------------------------------------------
 * Card grid (activateOnHover)
 * -----------------------------------------------------------------------------------------------*/
const collection = Array.from({length: 16}, (_, index) => index + 21);

export const CardGrid: Story = {
  parameters: {layout: "padded"},
  render: (args) => (
    <div className="flex flex-wrap justify-center">
      {collection.map((seed, index) => (
        <HoloCard
          key={seed}
          activateOnHover
          hoverScale={1.04}
          maxTilt={8}
          shineOpacity={0.55}
          style={size(120, 168, 10, 14)}
          {...args}
        >
          <CardBody>
            <HoloCard.Image
              alt={`Trading card ${index + 1}`}
              loading="lazy"
              src={`https://img.heroui.chat/image/game?w=300&h=420&u=${seed}`}
            />
            <HoloCard.Shine />
          </CardBody>
        </HoloCard>
      ))}
    </div>
  ),
};
