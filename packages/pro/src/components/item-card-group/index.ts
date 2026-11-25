import type {ComponentProps} from "react";

import {
  ItemCardGroupDescription,
  ItemCardGroupHeader,
  ItemCardGroupRoot,
  ItemCardGroupTitle,
} from "./item-card-group";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Root-safe: ItemCardGroup only styles `[data-slot="item-card"]` children (no heavy peers).
 * -----------------------------------------------------------------------------------------------*/
export const ItemCardGroup = Object.assign(ItemCardGroupRoot, {
  Description: ItemCardGroupDescription,
  Header: ItemCardGroupHeader,
  Root: ItemCardGroupRoot,
  Title: ItemCardGroupTitle,
});

export type ItemCardGroup = {
  Props: ComponentProps<typeof ItemCardGroupRoot>;
  RootProps: ComponentProps<typeof ItemCardGroupRoot>;
  HeaderProps: ComponentProps<typeof ItemCardGroupHeader>;
  TitleProps: ComponentProps<typeof ItemCardGroupTitle>;
  DescriptionProps: ComponentProps<typeof ItemCardGroupDescription>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ItemCardGroupRoot,
  ItemCardGroupHeader,
  ItemCardGroupTitle,
  ItemCardGroupDescription,
} from "./item-card-group";

export {ItemCardGroupContext, useItemCardGroupContext} from "./item-card-group-context";

export type {
  ItemCardGroupColumns,
  ItemCardGroupLayout,
  ItemCardGroupVariant,
  ItemCardGroupRootProps,
  ItemCardGroupRootProps as ItemCardGroupProps,
  ItemCardGroupHeaderProps,
  ItemCardGroupTitleProps,
  ItemCardGroupDescriptionProps,
} from "./item-card-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {itemCardGroupVariants, type ItemCardGroupVariants} from "./item-card-group.styles";
