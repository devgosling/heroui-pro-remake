import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* -------------------------------------------------------------------------------------------------
 * ChatSource - a single citation chip with an optional hover preview
 * -----------------------------------------------------------------------------------------------*/
export const chatSourceVariants = tv({
  slots: {
    base: "chat-source",
    documentIcon: "chat-source__document-icon",
    icon: "chat-source__icon",
    iconFallback: "chat-source__icon-fallback",
    preview: "chat-source__preview",
    previewDescription: "chat-source__preview-description",
    previewDomain: "chat-source__preview-domain",
    previewHeader: "chat-source__preview-header",
    previewLink: "chat-source__preview-link",
    previewTitle: "chat-source__preview-title",
    title: "chat-source__title",
    trigger: "chat-source__trigger chat-source__trigger-link",
  },
});

export type ChatSourceVariants = VariantProps<typeof chatSourceVariants>;

/* -------------------------------------------------------------------------------------------------
 * ChatSources - a disclosure that folds many sources behind a trigger
 * -----------------------------------------------------------------------------------------------*/
export const chatSourcesVariants = tv({
  slots: {
    base: "chat-sources",
    content: "chat-sources__content",
    contentBody: "chat-sources__content-body",
    indicator: "chat-sources__indicator",
    list: "chat-sources__list",
    toggle: "chat-sources__toggle",
    toggleHiddenText: "chat-sources__toggle-hidden-text",
    trigger: "chat-sources__trigger",
    triggerLabel: "chat-sources__trigger-label",
  },
});

export type ChatSourcesVariants = VariantProps<typeof chatSourcesVariants>;
