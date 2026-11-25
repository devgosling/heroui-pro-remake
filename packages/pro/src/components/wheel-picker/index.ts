import type {ComponentProps} from "react";

import {
  WheelPickerIndicator,
  WheelPickerIndicatorBackground,
  WheelPickerItem,
  WheelPickerItemLabel,
  WheelPickerMask,
  WheelPickerRoot,
} from "./wheel-picker";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const WheelPicker = Object.assign(WheelPickerRoot, {
  Indicator: WheelPickerIndicator,
  IndicatorBackground: WheelPickerIndicatorBackground,
  Item: WheelPickerItem,
  ItemLabel: WheelPickerItemLabel,
  Mask: WheelPickerMask,
  Root: WheelPickerRoot,
});

export type WheelPicker = {
  Props: ComponentProps<typeof WheelPickerRoot>;
  RootProps: ComponentProps<typeof WheelPickerRoot>;
  ItemProps: ComponentProps<typeof WheelPickerItem>;
  ItemLabelProps: ComponentProps<typeof WheelPickerItemLabel>;
  IndicatorProps: ComponentProps<typeof WheelPickerIndicator>;
  IndicatorBackgroundProps: ComponentProps<typeof WheelPickerIndicatorBackground>;
  MaskProps: ComponentProps<typeof WheelPickerMask>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  WheelPickerRoot,
  WheelPickerItem,
  WheelPickerItemLabel,
  WheelPickerIndicator,
  WheelPickerIndicatorBackground,
  WheelPickerMask,
} from "./wheel-picker";

export type {
  WheelPickerRootProps,
  WheelPickerRootProps as WheelPickerProps,
  WheelPickerItemProps,
  WheelPickerItemLabelProps,
  WheelPickerIndicatorProps,
  WheelPickerIndicatorBackgroundProps,
  WheelPickerMaskProps,
  WheelPickerRootAnimation,
  WheelPickerRootRef,
  WheelPickerImperativeMethods,
  WheelPickerRenderItem,
  WheelPickerRenderItemInfo,
  WheelPickerIndicatorSlots,
  WheelPickerMaskSlots,
} from "./wheel-picker";

/* -------------------------------------------------------------------------------------------------
 * Hooks & contexts
 * -----------------------------------------------------------------------------------------------*/
export {
  useWheelPicker,
  useWheelPickerItem,
  WheelPickerContext,
  WheelPickerItemContext,
  WheelPickerGroupContext,
} from "./wheel-picker-context";

export type {
  WheelPickerOption,
  WheelPickerLiveValue,
  WheelPickerContextValue,
  WheelPickerItemRenderProps,
  WheelPickerResolvedAnimationConfig,
  WheelPickerRootSlots,
  WheelPickerScrollToIndexParams,
  WheelPickerScrollToValueOptions,
  WheelPickerGroupContextValue,
} from "./wheel-picker-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {wheelPickerVariants, type WheelPickerVariants} from "./wheel-picker.styles";
