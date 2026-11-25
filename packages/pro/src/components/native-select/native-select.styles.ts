import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const nativeSelectVariants = tv({
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  slots: {
    base: "native-select",
    indicator: "native-select__indicator",
    select: "native-select__select",
    trigger: "native-select__trigger",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "native-select--full-width",
        trigger: "native-select__trigger--full-width",
      },
    },
    variant: {
      /* Default look: Pro renders no modifier class for it */
      primary: {},
      secondary: {
        base: "native-select--secondary",
      },
    },
  },
});

export type NativeSelectVariants = VariantProps<typeof nativeSelectVariants>;
