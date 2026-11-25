import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const numberPadVariants = tv({
  slots: {
    backspace: "number-pad__backspace",
    backspaceIcon: "number-pad__backspace-icon",
    base: "number-pad",
    key: "number-pad__key",
    keyBackground: "number-pad__key-background",
    keyLabel: "number-pad__key-label",
    row: "number-pad__row",
    spacer: "number-pad__spacer",
  },
});

export type NumberPadVariants = VariantProps<typeof numberPadVariants>;
