import type {ComponentProps} from "react";

import {
  MorphButtonCollapsedContent,
  MorphButtonExpandedContent,
  MorphButtonRoot,
} from "./morph-button";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const MorphButton = Object.assign(MorphButtonRoot, {
  CollapsedContent: MorphButtonCollapsedContent,
  ExpandedContent: MorphButtonExpandedContent,
  Root: MorphButtonRoot,
});

export type MorphButton = {
  Props: ComponentProps<typeof MorphButtonRoot>;
  RootProps: ComponentProps<typeof MorphButtonRoot>;
  CollapsedContentProps: ComponentProps<typeof MorphButtonCollapsedContent>;
  ExpandedContentProps: ComponentProps<typeof MorphButtonExpandedContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  MorphButtonRoot,
  MorphButtonCollapsedContent,
  MorphButtonExpandedContent,
} from "./morph-button";

export type {
  MorphButtonRootProps,
  MorphButtonRootProps as MorphButtonProps,
  MorphButtonCollapsedContentProps,
  MorphButtonExpandedContentProps,
  MorphButtonRootAnimation,
  MorphButtonRootSlots,
  MorphButtonRootStyles,
} from "./morph-button";

/* -------------------------------------------------------------------------------------------------
 * Hooks, context and types
 * -----------------------------------------------------------------------------------------------*/
export {MorphButtonContext, useMorphButton} from "./morph-button-context";

export type {
  MorphButtonContextValue,
  MorphButtonDirection,
  MorphButtonVariant,
} from "./morph-button-context";

export {DEFAULT_MORPH_SPRING_CONFIG} from "./morph-button-spring";

export type {MorphButtonAnimatedValue, MorphButtonSpringConfig} from "./morph-button-spring";

export type {
  MorphButtonContentAnimation,
  MorphButtonContentAnimationConfig,
  MorphButtonTimingConfig,
} from "./use-morph-button";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {morphButtonVariants, type MorphButtonVariants} from "./morph-button.styles";
