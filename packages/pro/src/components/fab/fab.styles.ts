import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const fabVariants = tv({
  defaultVariants: {
    overlayVariant: "default",
  },
  slots: {
    base: "fab",
    content: "fab__content",
    item: "fab__item",
    itemBackground: "fab__item-background",
    itemLabel: "fab__item-label",
    overlay: "fab__overlay",
    portal: "fab__portal",
    trigger: "fab__trigger",
    triggerContent: "fab__trigger-content",
  },
  variants: {
    overlayVariant: {
      blur: {overlay: "fab__overlay--blur"},
      default: {},
    },
  },
});

export type FABVariants = VariantProps<typeof fabVariants>;
