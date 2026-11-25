import type {ComponentProps} from "react";

import {TextShimmerRoot} from "./text-shimmer";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TextShimmer = Object.assign(TextShimmerRoot, {
  Root: TextShimmerRoot,
});

export type TextShimmer = {
  Props: ComponentProps<typeof TextShimmerRoot>;
  RootProps: ComponentProps<typeof TextShimmerRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {TextShimmerRoot} from "./text-shimmer";

export type {TextShimmerRootProps, TextShimmerRootProps as TextShimmerProps} from "./text-shimmer";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {textShimmerVariants, type TextShimmerVariants} from "./text-shimmer.styles";
