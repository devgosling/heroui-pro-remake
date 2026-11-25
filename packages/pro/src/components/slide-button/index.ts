import type {ComponentProps} from "react";

import {
  SlideButtonContainerBackground,
  SlideButtonLabel,
  SlideButtonOverlayContent,
  SlideButtonRoot,
  SlideButtonThumb,
  SlideButtonUnderlayContent,
} from "./slide-button";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SlideButton = Object.assign(SlideButtonRoot, {
  ContainerBackground: SlideButtonContainerBackground,
  Label: SlideButtonLabel,
  OverlayContent: SlideButtonOverlayContent,
  Root: SlideButtonRoot,
  Thumb: SlideButtonThumb,
  UnderlayContent: SlideButtonUnderlayContent,
});

export type SlideButton = {
  Props: ComponentProps<typeof SlideButtonRoot>;
  RootProps: ComponentProps<typeof SlideButtonRoot>;
  ContainerBackgroundProps: ComponentProps<typeof SlideButtonContainerBackground>;
  UnderlayContentProps: ComponentProps<typeof SlideButtonUnderlayContent>;
  OverlayContentProps: ComponentProps<typeof SlideButtonOverlayContent>;
  ThumbProps: ComponentProps<typeof SlideButtonThumb>;
  LabelProps: ComponentProps<typeof SlideButtonLabel>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SlideButtonRoot,
  SlideButtonContainerBackground,
  SlideButtonUnderlayContent,
  SlideButtonOverlayContent,
  SlideButtonThumb,
  SlideButtonLabel,
} from "./slide-button";

export type {
  SlideButtonRootProps,
  SlideButtonRootProps as SlideButtonProps,
  SlideButtonContainerBackgroundProps,
  SlideButtonUnderlayContentProps,
  SlideButtonOverlayContentProps,
  SlideButtonThumbProps,
  SlideButtonThumbIconProps,
  SlideButtonLabelProps,
  SlideButtonRootSlots,
  SlideButtonContentSlots,
} from "./slide-button";

/* -------------------------------------------------------------------------------------------------
 * Hook, context and types
 * -----------------------------------------------------------------------------------------------*/
export {SlideButtonContext, useSlideButton} from "./slide-button-context";

export type {
  SlideButtonContextValue,
  SlideButtonRenderProps,
  SlideButtonRootAnimation,
  SlideButtonThumbAnimation,
  SlideButtonVariant,
  UseSlideButtonReturn,
} from "./slide-button-context";

export type {SlideButtonMetrics, SlideButtonSpringConfig} from "./slide-button-store";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {slideButtonVariants, type SlideButtonVariants} from "./slide-button.styles";
