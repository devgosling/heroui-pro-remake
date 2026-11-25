import type {ComponentProps} from "react";

import {
  FABContent,
  FABItem,
  FABItemBackground,
  FABItemLabel,
  FABOverlay,
  FABPortal,
  FABRoot,
  FABTrigger,
} from "./fab";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const FAB = Object.assign(FABRoot, {
  Content: FABContent,
  Item: FABItem,
  ItemBackground: FABItemBackground,
  ItemLabel: FABItemLabel,
  Overlay: FABOverlay,
  Portal: FABPortal,
  Root: FABRoot,
  Trigger: FABTrigger,
});

export type FAB = {
  Props: ComponentProps<typeof FABRoot>;
  RootProps: ComponentProps<typeof FABRoot>;
  TriggerProps: ComponentProps<typeof FABTrigger>;
  PortalProps: ComponentProps<typeof FABPortal>;
  OverlayProps: ComponentProps<typeof FABOverlay>;
  ContentProps: ComponentProps<typeof FABContent>;
  ItemProps: ComponentProps<typeof FABItem>;
  ItemBackgroundProps: ComponentProps<typeof FABItemBackground>;
  ItemLabelProps: ComponentProps<typeof FABItemLabel>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  FABRoot,
  FABTrigger,
  FABPortal,
  FABOverlay,
  FABContent,
  FABItem,
  FABItemBackground,
  FABItemLabel,
} from "./fab";

export type {
  FABRootProps,
  FABRootProps as FABProps,
  FABTriggerProps,
  FABPortalProps,
  FABOverlayProps,
  FABContentProps,
  FABItemProps,
  FABItemBackgroundProps,
  FABItemLabelProps,
  FABRootAnimation,
  FABTriggerAnimation,
  FABTriggerRef,
  FABOverlayAnimation,
  FABOverlayBlurViewProps,
  FABItemAnimation,
} from "./fab";

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export {useFAB, useFABAnimation, FABContext} from "./fab-context";

export type {UseFABReturn, UseFABAnimationReturn, FABContextValue} from "./fab-context";

export type {
  FABPlacement,
  FABAlign,
  FABAutoPlacement,
  FABAutoAlign,
  FABItemsAppearance,
  FABInsets,
  FABLayoutRectangle,
  FABSpringConfig,
  FABTimingConfig,
  FABProgressAnimation,
} from "./fab-utils";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {fabVariants, type FABVariants} from "./fab.styles";
