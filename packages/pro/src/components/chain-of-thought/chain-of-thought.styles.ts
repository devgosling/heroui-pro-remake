import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const chainOfThoughtVariants = tv({
  slots: {
    base: "chain-of-thought",
    step: "chain-of-thought__step",
    stepBody: "chain-of-thought__step-body",
    stepCheck: "chain-of-thought__step-check",
    stepCross: "chain-of-thought__step-cross",
    stepDescription: "chain-of-thought__step-description",
    stepGlyph: "chain-of-thought__step-glyph",
    stepIndicator: "chain-of-thought__step-indicator",
    stepMark: "chain-of-thought__step-mark",
    stepStatus: "chain-of-thought__step-status",
    stepTitle: "chain-of-thought__step-title",
  },
});

export type ChainOfThoughtVariants = VariantProps<typeof chainOfThoughtVariants>;
