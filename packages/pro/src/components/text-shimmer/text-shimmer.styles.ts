import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const textShimmerVariants = tv(
  {
    slots: {
      base: "text-shimmer",
      highlight: "text-shimmer__highlight",
      text: "text-shimmer__text",
    },
  },
  {
    // tailwind-merge reads `text-shimmer` as a text colour utility and would drop the block class as
    // soon as a consumer passes a colour such as `text-muted`, so classes are only concatenated.
    twMerge: false,
  },
);

export type TextShimmerVariants = VariantProps<typeof textShimmerVariants>;
