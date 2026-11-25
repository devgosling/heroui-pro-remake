import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const markdownVariants = tv({
  slots: {
    base: "markdown",
    block: "markdown__block",
    codeLanguage: "markdown__code-language",
    inlineCode: "markdown__inline-code",
  },
});

export type MarkdownVariants = VariantProps<typeof markdownVariants>;
