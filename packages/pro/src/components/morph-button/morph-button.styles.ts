import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const morphButtonVariants = tv({
  defaultVariants: {
    direction: "top",
    variant: "primary",
  },
  slots: {
    base: "morph-button",
    collapsedContent: "morph-button__collapsed-content",
    expanded: "morph-button__expanded",
    expandedContent: "morph-button__expanded-content",
    surface: "morph-button__surface",
  },
  variants: {
    direction: {
      bottom: {base: "morph-button--bottom"},
      "bottom-end": {base: "morph-button--bottom-end"},
      "bottom-start": {base: "morph-button--bottom-start"},
      end: {base: "morph-button--end"},
      start: {base: "morph-button--start"},
      top: {base: "morph-button--top"},
      "top-end": {base: "morph-button--top-end"},
      "top-start": {base: "morph-button--top-start"},
    },
    variant: {
      primary: {base: "morph-button--primary"},
      secondary: {base: "morph-button--secondary"},
    },
  },
});

export type MorphButtonVariants = VariantProps<typeof morphButtonVariants>;
