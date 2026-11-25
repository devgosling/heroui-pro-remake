import type {ComponentProps} from "react";

import {
  ItemCardAction,
  ItemCardContent,
  ItemCardDescription,
  ItemCardIcon,
  ItemCardRoot,
  ItemCardTitle,
} from "./item-card";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ItemCard = Object.assign(ItemCardRoot, {
  Action: ItemCardAction,
  Content: ItemCardContent,
  Description: ItemCardDescription,
  Icon: ItemCardIcon,
  Root: ItemCardRoot,
  Title: ItemCardTitle,
});

export type ItemCard = {
  Props: ComponentProps<typeof ItemCardRoot>;
  RootProps: ComponentProps<typeof ItemCardRoot>;
  IconProps: ComponentProps<typeof ItemCardIcon>;
  ContentProps: ComponentProps<typeof ItemCardContent>;
  TitleProps: ComponentProps<typeof ItemCardTitle>;
  DescriptionProps: ComponentProps<typeof ItemCardDescription>;
  ActionProps: ComponentProps<typeof ItemCardAction>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ItemCardRoot,
  ItemCardIcon,
  ItemCardContent,
  ItemCardTitle,
  ItemCardDescription,
  ItemCardAction,
  ItemCardContext,
} from "./item-card";

export type {
  ItemCardRootProps,
  ItemCardRootProps as ItemCardProps,
  ItemCardIconProps,
  ItemCardContentProps,
  ItemCardTitleProps,
  ItemCardDescriptionProps,
  ItemCardActionProps,
} from "./item-card";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {itemCardVariants, type ItemCardVariants} from "./item-card.styles";
