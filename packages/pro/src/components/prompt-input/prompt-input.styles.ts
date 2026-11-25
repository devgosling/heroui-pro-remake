import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const promptInputVariants = tv({
  defaultVariants: {
    layout: "stacked",
    size: "md",
    variant: "primary",
  },
  slots: {
    attachments: "prompt-input__attachments",
    base: "prompt-input",
    content: "prompt-input__content",
    footer: "prompt-input__footer",
    send: "prompt-input__send",
    sendIcon: "prompt-input__send-icon",
    shell: "prompt-input__shell",
    textarea: "prompt-input__textarea",
    token: "prompt-input__token",
    tokenInput: "prompt-input__token-input",
    tokenSuggestions: "prompt-input__token-suggestions",
    toolbar: "prompt-input__toolbar",
    toolbarEnd: "prompt-input__toolbar-end",
    toolbarStart: "prompt-input__toolbar-start",
  },
  // Key order matters: the layout modifier is emitted before the variant modifier on the shell.
  variants: {
    layout: {
      compact: {shell: "prompt-input__shell--compact"},
      inline: {shell: "prompt-input__shell--inline"},
      stacked: {},
    },
    size: {
      lg: {base: "prompt-input--lg"},
      // md is the default size: the base classes carry its styles.
      md: {},
      sm: {base: "prompt-input--sm"},
    },
    variant: {
      primary: {shell: "prompt-input__shell--primary"},
      secondary: {shell: "prompt-input__shell--secondary"},
    },
  },
});

export const promptInputQueueVariants = tv({
  slots: {
    attachments: "prompt-input__queue-item-attachments",
    attachmentsOverflow: "prompt-input__queue-item-attachments-overflow",
    base: "prompt-input__queue",
    icon: "prompt-input__queue-icon",
    item: "prompt-input__queue-item",
    itemActions: "prompt-input__queue-item-actions",
    itemBody: "prompt-input__queue-item-body",
    itemContent: "prompt-input__queue-item-content",
    itemDescription: "prompt-input__queue-item-description",
    itemHandle: "prompt-input__queue-item-handle",
    itemIcon: "prompt-input__queue-item-icon",
    list: "prompt-input__queue-list",
    listItems: "prompt-input__queue-list-items",
    steerArrow: "prompt-input__queue-steer-arrow",
  },
});

export type PromptInputVariants = VariantProps<typeof promptInputVariants>;
