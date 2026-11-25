import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

export const chatConversationVariants = tv({
  slots: {
    /** The scroll viewport (`role="log"`). */
    base: "chat-conversation",
    /** The message column; it centres itself, so give it a max width. */
    content: "chat-conversation__content",
    /** Deprecated `ScrollAnchor`: an empty, hidden div. */
    scrollAnchor: "chat-conversation__scroll-anchor",
    /** Icon-only button (OSS `.button` classes come from HeroUI `Button`). */
    scrollButton: "chat-conversation__scroll-button",
    /** Sticky wrapper that pins the scroll button to the bottom of the viewport. */
    scrollButtonContainer: "chat-conversation__scroll-button-container",
  },
});

export type ChatConversationVariants = VariantProps<typeof chatConversationVariants>;
