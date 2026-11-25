import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const codeBlockVariants = tv({
  slots: {
    base: "code-block",
    code: "code-block__code",
    copyButton: "code-block__copy-button",
    copyButtonIconMotion: "code-block__copy-button-icon-motion",
    header: "code-block__header",
  },
});

export type CodeBlockVariants = VariantProps<typeof codeBlockVariants>;
