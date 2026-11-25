import type {ComponentProps} from "react";

import {
  SwipeableTabsContent,
  SwipeableTabsIndicator,
  SwipeableTabsLabel,
  SwipeableTabsList,
  SwipeableTabsListBackground,
  SwipeableTabsPager,
  SwipeableTabsRoot,
  SwipeableTabsScrollView,
  SwipeableTabsSeparator,
  SwipeableTabsTrigger,
} from "./swipeable-tabs";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SwipeableTabs = Object.assign(SwipeableTabsRoot, {
  Content: SwipeableTabsContent,
  Indicator: SwipeableTabsIndicator,
  Label: SwipeableTabsLabel,
  List: SwipeableTabsList,
  ListBackground: SwipeableTabsListBackground,
  Pager: SwipeableTabsPager,
  Root: SwipeableTabsRoot,
  ScrollView: SwipeableTabsScrollView,
  Separator: SwipeableTabsSeparator,
  Trigger: SwipeableTabsTrigger,
});

export type SwipeableTabs = {
  Props: ComponentProps<typeof SwipeableTabsRoot>;
  RootProps: ComponentProps<typeof SwipeableTabsRoot>;
  ListProps: ComponentProps<typeof SwipeableTabsList>;
  ListBackgroundProps: ComponentProps<typeof SwipeableTabsListBackground>;
  ScrollViewProps: ComponentProps<typeof SwipeableTabsScrollView>;
  TriggerProps: ComponentProps<typeof SwipeableTabsTrigger>;
  LabelProps: ComponentProps<typeof SwipeableTabsLabel>;
  SeparatorProps: ComponentProps<typeof SwipeableTabsSeparator>;
  IndicatorProps: ComponentProps<typeof SwipeableTabsIndicator>;
  PagerProps: ComponentProps<typeof SwipeableTabsPager>;
  ContentProps: ComponentProps<typeof SwipeableTabsContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  SwipeableTabsRoot,
  SwipeableTabsList,
  SwipeableTabsListBackground,
  SwipeableTabsScrollView,
  SwipeableTabsTrigger,
  SwipeableTabsLabel,
  SwipeableTabsSeparator,
  SwipeableTabsIndicator,
  SwipeableTabsPager,
  SwipeableTabsContent,
} from "./swipeable-tabs";

export type {
  SwipeableTabsRootProps,
  SwipeableTabsRootProps as SwipeableTabsProps,
  SwipeableTabsRootRef,
  SwipeableTabsListProps,
  SwipeableTabsListBackgroundProps,
  SwipeableTabsScrollViewProps,
  SwipeableTabsTriggerProps,
  SwipeableTabsTriggerRenderProps,
  SwipeableTabsLabelProps,
  SwipeableTabsSeparatorProps,
  SwipeableTabsSeparatorAnimation,
  SwipeableTabsSeparatorAnimationConfig,
  SwipeableTabsIndicatorProps,
  SwipeableTabsPagerProps,
  SwipeableTabsPagerRef,
  SwipeableTabsContentProps,
} from "./swipeable-tabs";

/* -------------------------------------------------------------------------------------------------
 * Hooks & Context
 * -----------------------------------------------------------------------------------------------*/
export {
  SwipeableTabsContext,
  SwipeableTabsTriggerContext,
  useSwipeableTabs,
  useSwipeableTabsMeasurements,
  useSwipeableTabsTrigger,
} from "./swipeable-tabs-context";

export type {
  SwipeableTabsContextValue,
  SwipeableTabsMeasurement,
  SwipeableTabsMeasurements,
  SwipeableTabsTriggerContextValue,
  SwipeableTabsVariant,
  UseSwipeableTabsMeasurementsReturn,
  UseSwipeableTabsReturn,
} from "./swipeable-tabs-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {swipeableTabsVariants, type SwipeableTabsVariants} from "./swipeable-tabs.styles";
