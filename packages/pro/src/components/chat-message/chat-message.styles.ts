import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const chatMessageVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    assistant: "chat-message--assistant",
    avatar: "chat-message__avatar",
    avatarSpacer: "chat-message__avatar-spacer",
    body: "chat-message__body",
    bubble: "chat-message__bubble",
    content: "chat-message__content",
    media: "chat-message__media",
    user: "chat-message--user",
  },
  variants: {
    variant: {
      card: {assistant: "chat-message--card"},
      // Default is the plain row: Pro renders no modifier class for it
      default: {},
    },
  },
});

export type ChatMessageVariants = VariantProps<typeof chatMessageVariants>;
