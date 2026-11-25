import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * The shared overlays carry the WheelPicker classes as well as their own, so the group's band and
 * masks always look exactly like a single wheel's (themes restyle both at once).
 */
export const wheelPickerGroupVariants = tv({
  slots: {
    base: "wheel-picker-group",
    indicator: "wheel-picker__indicator wheel-picker-group__indicator",
    indicatorBackground:
      "wheel-picker__indicator-background wheel-picker-group__indicator-background",
    indicatorHighlight: "wheel-picker__indicator-highlight wheel-picker-group__indicator-highlight",
    mask: "wheel-picker__mask wheel-picker-group__mask",
    maskBottom:
      "wheel-picker__mask-fade wheel-picker__mask-fade--bottom wheel-picker-group__mask-fade wheel-picker-group__mask-fade--bottom",
    maskTop:
      "wheel-picker__mask-fade wheel-picker__mask-fade--top wheel-picker-group__mask-fade wheel-picker-group__mask-fade--top",
  },
});

export type WheelPickerGroupVariants = VariantProps<typeof wheelPickerGroupVariants>;
