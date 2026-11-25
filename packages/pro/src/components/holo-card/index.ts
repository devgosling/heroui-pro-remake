import type {ComponentProps} from "react";

import {
  HoloCardContent,
  HoloCardFrame,
  HoloCardImage,
  HoloCardInset,
  HoloCardPattern,
  HoloCardRoot,
  HoloCardRotator,
  HoloCardShine,
  HoloCardShinePattern,
  HoloCardSurface,
} from "./holo-card";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const HoloCard = Object.assign(HoloCardRoot, {
  Content: HoloCardContent,
  Frame: HoloCardFrame,
  Image: HoloCardImage,
  Inset: HoloCardInset,
  Pattern: HoloCardPattern,
  Root: HoloCardRoot,
  Rotator: HoloCardRotator,
  Shine: HoloCardShine,
  ShinePattern: HoloCardShinePattern,
  Surface: HoloCardSurface,
});

export type HoloCard = {
  Props: ComponentProps<typeof HoloCardRoot>;
  RootProps: ComponentProps<typeof HoloCardRoot>;
  RotatorProps: ComponentProps<typeof HoloCardRotator>;
  FrameProps: ComponentProps<typeof HoloCardFrame>;
  SurfaceProps: ComponentProps<typeof HoloCardSurface>;
  ImageProps: ComponentProps<typeof HoloCardImage>;
  InsetProps: ComponentProps<typeof HoloCardInset>;
  PatternProps: ComponentProps<typeof HoloCardPattern>;
  ContentProps: ComponentProps<typeof HoloCardContent>;
  ShineProps: ComponentProps<typeof HoloCardShine>;
  ShinePatternProps: ComponentProps<typeof HoloCardShinePattern>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  HoloCardRoot,
  HoloCardRotator,
  HoloCardFrame,
  HoloCardSurface,
  HoloCardImage,
  HoloCardInset,
  HoloCardPattern,
  HoloCardContent,
  HoloCardShine,
  HoloCardShinePattern,
  HoloCardContext,
} from "./holo-card";

export type {
  HoloCardRootProps,
  HoloCardRootProps as HoloCardProps,
  HoloCardRotatorProps,
  HoloCardFrameProps,
  HoloCardSurfaceProps,
  HoloCardImageProps,
  HoloCardInsetProps,
  HoloCardPatternProps,
  HoloCardContentProps,
  HoloCardShineProps,
  HoloCardShinePatternProps,
} from "./holo-card";

export type {HoloCardSpring} from "./use-spring-values";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {holoCardVariants, type HoloCardVariants} from "./holo-card.styles";
