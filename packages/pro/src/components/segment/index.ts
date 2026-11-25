import type {ComponentProps} from "react";

import {SegmentItem, SegmentRoot, SegmentSeparator} from "./segment";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Segment = Object.assign(SegmentRoot, {
  Item: SegmentItem,
  Root: SegmentRoot,
  Separator: SegmentSeparator,
});

export type Segment = {
  Props: ComponentProps<typeof SegmentRoot>;
  RootProps: ComponentProps<typeof SegmentRoot>;
  ItemProps: ComponentProps<typeof SegmentItem>;
  SeparatorProps: ComponentProps<typeof SegmentSeparator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {SegmentRoot, SegmentItem, SegmentSeparator, SegmentContext} from "./segment";

export type {
  SegmentRootProps,
  SegmentRootProps as SegmentProps,
  SegmentItemProps,
  SegmentSeparatorProps,
} from "./segment";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {segmentVariants, type SegmentVariants} from "./segment.styles";
