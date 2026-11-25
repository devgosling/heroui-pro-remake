import type {ComponentProps} from "react";

import {
  RadioButtonGroupIndicator,
  RadioButtonGroupItem,
  RadioButtonGroupItemContent,
  RadioButtonGroupItemIcon,
  RadioButtonGroupRoot,
} from "./radio-button-group";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const RadioButtonGroup = Object.assign(RadioButtonGroupRoot, {
  Indicator: RadioButtonGroupIndicator,
  Item: RadioButtonGroupItem,
  ItemContent: RadioButtonGroupItemContent,
  ItemIcon: RadioButtonGroupItemIcon,
  Root: RadioButtonGroupRoot,
});

export type RadioButtonGroup = {
  Props: ComponentProps<typeof RadioButtonGroupRoot>;
  RootProps: ComponentProps<typeof RadioButtonGroupRoot>;
  ItemProps: ComponentProps<typeof RadioButtonGroupItem>;
  IndicatorProps: ComponentProps<typeof RadioButtonGroupIndicator>;
  ItemContentProps: ComponentProps<typeof RadioButtonGroupItemContent>;
  ItemIconProps: ComponentProps<typeof RadioButtonGroupItemIcon>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  RadioButtonGroupRoot,
  RadioButtonGroupItem,
  RadioButtonGroupIndicator,
  RadioButtonGroupItemContent,
  RadioButtonGroupItemIcon,
  RadioButtonGroupContext,
} from "./radio-button-group";

export type {
  RadioButtonGroupRootProps,
  RadioButtonGroupRootProps as RadioButtonGroupProps,
  RadioButtonGroupItemProps,
  RadioButtonGroupIndicatorProps,
  RadioButtonGroupItemContentProps,
  RadioButtonGroupItemIconProps,
} from "./radio-button-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radioButtonGroupVariants, type RadioButtonGroupVariants} from "./radio-button-group.styles";
