import type {ComponentProps} from "react";

import {
  SwipeableRowAction,
  SwipeableRowActionLabel,
  SwipeableRowActions,
  SwipeableRowContent,
  SwipeableRowContentBackground,
  SwipeableRowRoot,
} from "./swipeable-row";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SwipeableRow = Object.assign(SwipeableRowRoot, {
  Action: SwipeableRowAction,
  ActionLabel: SwipeableRowActionLabel,
  Actions: SwipeableRowActions,
  Content: SwipeableRowContent,
  ContentBackground: SwipeableRowContentBackground,
  Root: SwipeableRowRoot,
});

export type SwipeableRow = {
  Props: ComponentProps<typeof SwipeableRowRoot>;
  RootProps: ComponentProps<typeof SwipeableRowRoot>;
  ActionsProps: ComponentProps<typeof SwipeableRowActions>;
  ContentProps: ComponentProps<typeof SwipeableRowContent>;
  ContentBackgroundProps: ComponentProps<typeof SwipeableRowContentBackground>;
  ActionProps: ComponentProps<typeof SwipeableRowAction>;
  ActionLabelProps: ComponentProps<typeof SwipeableRowActionLabel>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SwipeableRowRoot,
  SwipeableRowActions,
  SwipeableRowContent,
  SwipeableRowContentBackground,
  SwipeableRowAction,
  SwipeableRowActionLabel,
} from "./swipeable-row";

export type {
  SwipeableRowRootRef,
  SwipeableRowRootProps,
  SwipeableRowRootProps as SwipeableRowProps,
  SwipeableRowRootAnimation,
  SwipeableRowRootAnimationConfig,
  SwipeableRowActionsProps,
  SwipeableRowActionsRenderProps,
  SwipeableRowContentProps,
  SwipeableRowContentBackgroundProps,
  SwipeableRowActionProps,
  SwipeableRowActionAnimation,
  SwipeableRowActionAnimationConfig,
  SwipeableRowActionLabelProps,
} from "./swipeable-row";

/* -------------------------------------------------------------------------------------------------
 * Hook, context and types
 * -----------------------------------------------------------------------------------------------*/
export {useSwipeableRow, SwipeableRowContext} from "./swipeable-row-context";

export type {
  UseSwipeableRowReturn,
  SwipeableRowControls,
  SwipeableRowVariant,
  SwipeableRowActionVariant,
} from "./swipeable-row-context";

export type {
  SwipeableRowSide,
  SwipeableRowOpenSide,
  SwipeableRowSpringConfig,
  SwipeableRowTransitionOptions,
} from "./swipeable-row-engine";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  swipeableRowVariants,
  swipeableRowActionsVariants,
  swipeableRowActionVariants,
  swipeableRowActionLabelVariants,
  type SwipeableRowVariants,
  type SwipeableRowActionsVariants,
  type SwipeableRowActionVariants,
  type SwipeableRowActionLabelVariants,
} from "./swipeable-row.styles";
