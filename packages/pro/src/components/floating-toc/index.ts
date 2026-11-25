import type {ComponentProps} from "react";

import {
  FloatingTocBar,
  FloatingTocContent,
  FloatingTocItem,
  FloatingTocRoot,
  FloatingTocTrigger,
} from "./floating-toc";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const FloatingToc = Object.assign(FloatingTocRoot, {
  Bar: FloatingTocBar,
  Content: FloatingTocContent,
  Item: FloatingTocItem,
  Root: FloatingTocRoot,
  Trigger: FloatingTocTrigger,
});

export type FloatingToc = {
  Props: ComponentProps<typeof FloatingTocRoot>;
  RootProps: ComponentProps<typeof FloatingTocRoot>;
  TriggerProps: ComponentProps<typeof FloatingTocTrigger>;
  BarProps: ComponentProps<typeof FloatingTocBar>;
  ContentProps: ComponentProps<typeof FloatingTocContent>;
  ItemProps: ComponentProps<typeof FloatingTocItem>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  FloatingTocRoot,
  FloatingTocTrigger,
  FloatingTocBar,
  FloatingTocContent,
  FloatingTocItem,
  FloatingTocContext,
} from "./floating-toc";

export type {
  FloatingTocPlacement,
  FloatingTocTriggerMode,
  FloatingTocRootProps,
  FloatingTocRootProps as FloatingTocProps,
  FloatingTocTriggerProps,
  FloatingTocBarProps,
  FloatingTocContentProps,
  FloatingTocItemProps,
} from "./floating-toc";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {floatingTocVariants, type FloatingTocVariants} from "./floating-toc.styles";
