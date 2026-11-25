import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/**
 * The visual variant (`media` thumbnail vs `file` card) is not a prop: it is derived from the media
 * type and `src`, exposed as `data-variant` on the root and styled through that attribute.
 */
export const chatAttachmentVariants = tv({
  slots: {
    base: "chat-attachment",
    icon: "chat-attachment__icon",
    info: "chat-attachment__info",
    name: "chat-attachment__name",
    preview: "chat-attachment__preview",
    previewImage: "chat-attachment__preview-image",
    previewVideo: "chat-attachment__preview-video",
    remove: "chat-attachment__remove",
    size: "chat-attachment__size",
  },
});

export const chatAttachmentGroupVariants = tv({
  base: "chat-attachment-group",
});

export const chatAttachmentInputVariants = tv({
  base: "chat-attachment-input__file-input",
});

export type ChatAttachmentVariants = VariantProps<typeof chatAttachmentVariants>;
export type ChatAttachmentGroupVariants = VariantProps<typeof chatAttachmentGroupVariants>;
