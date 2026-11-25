import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const reasoningVariants = tv({
  slots: {
    base: "reasoning",
    body: "reasoning__body",
    content: "reasoning__content",
    duration: "reasoning__duration",
    heading: "reasoning__heading",
    indicator: "reasoning__indicator",
    label: "reasoning__label",
    loader: "reasoning__loader",
    text: "reasoning__text",
    trigger: "reasoning__trigger",
  },
});

export type ReasoningVariants = VariantProps<typeof reasoningVariants>;
