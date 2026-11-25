import type {ComponentProps} from "react";

import {ActionBarContent, ActionBarPrefix, ActionBarRoot, ActionBarSuffix} from "./action-bar";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ActionBar = Object.assign(ActionBarRoot, {
  Content: ActionBarContent,
  Prefix: ActionBarPrefix,
  Root: ActionBarRoot,
  Suffix: ActionBarSuffix,
});

export type ActionBar = {
  Props: ComponentProps<typeof ActionBarRoot>;
  RootProps: ComponentProps<typeof ActionBarRoot>;
  PrefixProps: ComponentProps<typeof ActionBarPrefix>;
  ContentProps: ComponentProps<typeof ActionBarContent>;
  SuffixProps: ComponentProps<typeof ActionBarSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ActionBarRoot,
  ActionBarPrefix,
  ActionBarContent,
  ActionBarSuffix,
  ActionBarContext,
} from "./action-bar";

export type {
  ActionBarRootProps,
  ActionBarRootProps as ActionBarProps,
  ActionBarPrefixProps,
  ActionBarContentProps,
  ActionBarSuffixProps,
} from "./action-bar";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {actionBarVariants, type ActionBarVariants} from "./action-bar.styles";
