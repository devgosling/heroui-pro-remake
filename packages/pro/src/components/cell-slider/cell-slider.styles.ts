import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * Cell Slider slots. Every part also keeps the OSS `slider__*` class (added by the OSS Slider
 * parts it wraps), so the `cell-slider__*` classes only carry the cell-specific overrides.
 * Only the track gets a variant modifier; the root has none.
 */
export const cellSliderVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    base: "cell-slider",
    fill: "cell-slider__fill",
    label: "cell-slider__label",
    output: "cell-slider__output",
    thumb: "cell-slider__thumb",
    track: "cell-slider__track",
  },
  variants: {
    variant: {
      default: {
        track: "cell-slider__track--default",
      },
      secondary: {
        track: "cell-slider__track--secondary",
      },
    },
  },
});

export type CellSliderVariants = VariantProps<typeof cellSliderVariants>;
