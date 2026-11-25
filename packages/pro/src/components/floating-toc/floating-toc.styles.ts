import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * The root renders no DOM, so there is no `base` slot. Placement is not a class modifier:
 * the trigger and the content expose it as `data-placement` and the CSS keys off that.
 */
export const floatingTocVariants = tv({
  slots: {
    bar: "floating-toc__bar",
    content: "floating-toc__content",
    item: "floating-toc__item",
    trigger: "floating-toc__trigger",
  },
});

export type FloatingTocVariants = VariantProps<typeof floatingTocVariants>;
