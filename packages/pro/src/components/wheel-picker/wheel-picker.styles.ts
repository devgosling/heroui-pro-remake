import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const wheelPickerVariants = tv({
  slots: {
    base: "wheel-picker",
    content: "wheel-picker__content",
    indicator: "wheel-picker__indicator",
    indicatorBackground: "wheel-picker__indicator-background",
    indicatorHighlight: "wheel-picker__indicator-highlight",
    item: "wheel-picker__item",
    itemLabel: "wheel-picker__item-label",
    mask: "wheel-picker__mask",
    maskBottom: "wheel-picker__mask-fade wheel-picker__mask-fade--bottom",
    maskTop: "wheel-picker__mask-fade wheel-picker__mask-fade--top",
  },
});

export type WheelPickerVariants = VariantProps<typeof wheelPickerVariants>;
