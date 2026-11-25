import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const radioButtonGroupVariants = tv({
  defaultVariants: {
    layout: "flex",
  },
  slots: {
    base: "radio-button-group",
    indicator: "radio-button-group__indicator",
    item: "radio-button-group__item",
    itemContent: "radio-button-group__item-content",
    itemIcon: "radio-button-group__item-icon",
  },
  variants: {
    layout: {
      /* Flex is the default layout: Pro renders no modifier class for it */
      flex: {},
      grid: {base: "radio-button-group--grid"},
    },
  },
});

export type RadioButtonGroupVariants = VariantProps<typeof radioButtonGroupVariants>;
