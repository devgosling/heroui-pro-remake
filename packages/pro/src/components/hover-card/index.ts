import type {ComponentProps} from "react";

import {HoverCardArrow, HoverCardContent, HoverCardRoot, HoverCardTrigger} from "./hover-card";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const HoverCard = Object.assign(HoverCardRoot, {
  Arrow: HoverCardArrow,
  Content: HoverCardContent,
  Root: HoverCardRoot,
  Trigger: HoverCardTrigger,
});

export type HoverCard = {
  Props: ComponentProps<typeof HoverCardRoot>;
  RootProps: ComponentProps<typeof HoverCardRoot>;
  TriggerProps: ComponentProps<typeof HoverCardTrigger>;
  ContentProps: ComponentProps<typeof HoverCardContent>;
  ArrowProps: ComponentProps<typeof HoverCardArrow>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  HoverCardRoot,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardArrow,
  HoverCardContext,
} from "./hover-card";

export type {
  HoverCardRootProps,
  HoverCardRootProps as HoverCardProps,
  HoverCardTriggerProps,
  HoverCardContentProps,
  HoverCardArrowProps,
} from "./hover-card";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {hoverCardVariants, type HoverCardVariants} from "./hover-card.styles";
