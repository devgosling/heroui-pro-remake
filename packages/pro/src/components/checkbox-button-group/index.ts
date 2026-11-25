import type {ComponentProps} from "react";

import {
  CheckboxButtonGroupIndicator,
  CheckboxButtonGroupItem,
  CheckboxButtonGroupItemContent,
  CheckboxButtonGroupItemIcon,
  CheckboxButtonGroupRoot,
} from "./checkbox-button-group";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CheckboxButtonGroup = Object.assign(CheckboxButtonGroupRoot, {
  Indicator: CheckboxButtonGroupIndicator,
  Item: CheckboxButtonGroupItem,
  ItemContent: CheckboxButtonGroupItemContent,
  ItemIcon: CheckboxButtonGroupItemIcon,
  Root: CheckboxButtonGroupRoot,
});

export type CheckboxButtonGroup = {
  Props: ComponentProps<typeof CheckboxButtonGroupRoot>;
  RootProps: ComponentProps<typeof CheckboxButtonGroupRoot>;
  ItemProps: ComponentProps<typeof CheckboxButtonGroupItem>;
  IndicatorProps: ComponentProps<typeof CheckboxButtonGroupIndicator>;
  ItemContentProps: ComponentProps<typeof CheckboxButtonGroupItemContent>;
  ItemIconProps: ComponentProps<typeof CheckboxButtonGroupItemIcon>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CheckboxButtonGroupRoot,
  CheckboxButtonGroupItem,
  CheckboxButtonGroupIndicator,
  CheckboxButtonGroupItemContent,
  CheckboxButtonGroupItemIcon,
  CheckboxButtonGroupContext,
} from "./checkbox-button-group";

export type {
  CheckboxButtonGroupRootProps,
  CheckboxButtonGroupRootProps as CheckboxButtonGroupProps,
  CheckboxButtonGroupItemProps,
  CheckboxButtonGroupIndicatorProps,
  CheckboxButtonGroupItemContentProps,
  CheckboxButtonGroupItemIconProps,
} from "./checkbox-button-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  checkboxButtonGroupVariants,
  type CheckboxButtonGroupVariants,
} from "./checkbox-button-group.styles";
