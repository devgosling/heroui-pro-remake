import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * Chat List View renders on top of the List View base classes (`list-view`, `list-view--secondary`,
 * `list-view__*`, owned by `css/components/list-view.css`) and adds its own `chat-list-view*`
 * classes, in the same order as the Pro DOM.
 */
export const chatListViewVariants = tv({
  defaultVariants: {
    density: "comfortable",
  },
  slots: {
    base: "list-view list-view--secondary chat-list-view",
    emptyState: "list-view__empty-state",
    icon: "chat-list-view__icon",
    item: "list-view__item",
    itemContent: "list-view__item-content",
    meta: "list-view__item-action chat-list-view__meta",
    preview: "list-view__description chat-list-view__preview",
    text: "chat-list-view__text",
    title: "list-view__title chat-list-view__title",
  },
  variants: {
    density: {
      comfortable: {base: "chat-list-view--comfortable"},
      compact: {base: "chat-list-view--compact"},
    },
  },
});

export type ChatListViewVariants = VariantProps<typeof chatListViewVariants>;
