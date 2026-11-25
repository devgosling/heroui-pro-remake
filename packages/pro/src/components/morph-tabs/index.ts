import type {ComponentProps} from "react";

import {
  MorphTabsContent,
  MorphTabsIcon,
  MorphTabsLabel,
  MorphTabsList,
  MorphTabsPager,
  MorphTabsRoot,
  MorphTabsTrigger,
  MorphTabsTriggerBackground,
} from "./morph-tabs";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const MorphTabs = Object.assign(MorphTabsRoot, {
  Content: MorphTabsContent,
  Icon: MorphTabsIcon,
  Label: MorphTabsLabel,
  List: MorphTabsList,
  Pager: MorphTabsPager,
  Root: MorphTabsRoot,
  Trigger: MorphTabsTrigger,
  TriggerBackground: MorphTabsTriggerBackground,
});

export type MorphTabs = {
  Props: ComponentProps<typeof MorphTabsRoot>;
  RootProps: ComponentProps<typeof MorphTabsRoot>;
  ListProps: ComponentProps<typeof MorphTabsList>;
  TriggerProps: ComponentProps<typeof MorphTabsTrigger>;
  TriggerBackgroundProps: ComponentProps<typeof MorphTabsTriggerBackground>;
  IconProps: ComponentProps<typeof MorphTabsIcon>;
  LabelProps: ComponentProps<typeof MorphTabsLabel>;
  PagerProps: ComponentProps<typeof MorphTabsPager>;
  ContentProps: ComponentProps<typeof MorphTabsContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  MorphTabsRoot,
  MorphTabsList,
  MorphTabsTrigger,
  MorphTabsTriggerBackground,
  MorphTabsIcon,
  MorphTabsLabel,
  MorphTabsPager,
  MorphTabsContent,
} from "./morph-tabs";

export type {
  MorphTabsRootProps,
  MorphTabsRootProps as MorphTabsProps,
  MorphTabsRootRef,
  MorphTabsListProps,
  MorphTabsTriggerProps,
  MorphTabsTriggerRenderProps,
  MorphTabsTriggerAnimation,
  MorphTabsTriggerBackgroundProps,
  MorphTabsIconProps,
  MorphTabsIconAnimation,
  MorphTabsLabelProps,
  MorphTabsLabelSlots,
  MorphTabsLabelAnimation,
  MorphTabsAnimationTuple,
  MorphTabsPagerProps,
  MorphTabsPagerRef,
  MorphTabsContentProps,
} from "./morph-tabs";

/* -------------------------------------------------------------------------------------------------
 * Hooks & context
 * -----------------------------------------------------------------------------------------------*/
export {
  MorphTabsContext,
  MorphTabsTriggerContext,
  useMorphTabs,
  useMorphTabsProgress,
  useMorphTabsTrigger,
} from "./morph-tabs-context";

export type {
  MorphTabsContextValue,
  MorphTabsProgress,
  MorphTabsTriggerContextValue,
} from "./morph-tabs-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {morphTabsVariants, type MorphTabsVariants} from "./morph-tabs.styles";
