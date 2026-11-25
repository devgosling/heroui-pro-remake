import type {ComponentProps} from "react";

import {RatingItem, RatingRoot} from "./rating";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Rating = Object.assign(RatingRoot, {
  Item: RatingItem,
  Root: RatingRoot,
});

export type Rating = {
  Props: ComponentProps<typeof RatingRoot>;
  RootProps: ComponentProps<typeof RatingRoot>;
  ItemProps: ComponentProps<typeof RatingItem>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {RatingRoot, RatingItem, RatingContext} from "./rating";

export type {
  RatingRootProps,
  RatingRootProps as RatingProps,
  RatingItemProps,
  RatingItemRenderProps,
} from "./rating";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {ratingVariants, type RatingVariants} from "./rating.styles";
