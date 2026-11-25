import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const chatMessageActionsVariants = tv({
  slots: {
    /** Icon-only ghost button (OSS `.button` classes come from HeroUI `Button`). */
    action: "chat-message__action",
    /** The root carries the Chat Message element class too, as Pro renders it. */
    base: "chat-message__actions chat-message-actions",
    /** Copy preset: wrapper around the copy / copied icon that animates the swap. */
    copyIconMotion: "chat-message-actions__copy-icon-motion",
    icon: "chat-message-actions__icon",
  },
});

export type ChatMessageActionsVariants = VariantProps<typeof chatMessageActionsVariants>;
