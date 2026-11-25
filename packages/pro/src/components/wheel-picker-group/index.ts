import type {ComponentProps} from "react";

import {
  WheelPickerGroupIndicator,
  WheelPickerGroupIndicatorBackground,
  WheelPickerGroupMask,
  WheelPickerGroupRoot,
} from "./wheel-picker-group";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const WheelPickerGroup = Object.assign(WheelPickerGroupRoot, {
  Indicator: WheelPickerGroupIndicator,
  IndicatorBackground: WheelPickerGroupIndicatorBackground,
  Mask: WheelPickerGroupMask,
  Root: WheelPickerGroupRoot,
});

export type WheelPickerGroup = {
  Props: ComponentProps<typeof WheelPickerGroupRoot>;
  RootProps: ComponentProps<typeof WheelPickerGroupRoot>;
  IndicatorProps: ComponentProps<typeof WheelPickerGroupIndicator>;
  IndicatorBackgroundProps: ComponentProps<typeof WheelPickerGroupIndicatorBackground>;
  MaskProps: ComponentProps<typeof WheelPickerGroupMask>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  WheelPickerGroupRoot,
  WheelPickerGroupIndicator,
  WheelPickerGroupIndicatorBackground,
  WheelPickerGroupMask,
} from "./wheel-picker-group";

export type {
  WheelPickerGroupRootProps,
  WheelPickerGroupRootProps as WheelPickerGroupProps,
  WheelPickerGroupIndicatorProps,
  WheelPickerGroupIndicatorBackgroundProps,
  WheelPickerGroupMaskProps,
} from "./wheel-picker-group";

/* -------------------------------------------------------------------------------------------------
 * Hooks & contexts
 * -----------------------------------------------------------------------------------------------*/
// `WheelPickerGroupContext` and `WheelPickerGroupContextValue` are exported by `wheel-picker`.
export {useWheelPickerGroup} from "./wheel-picker-group-context";

export type {
  WheelPickerGroupValues,
  WheelPickerGroupRootAnimation,
  WheelPickerGroupIndicatorSlots,
  WheelPickerGroupMaskSlots,
} from "./wheel-picker-group-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {wheelPickerGroupVariants, type WheelPickerGroupVariants} from "./wheel-picker-group.styles";
