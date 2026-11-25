import type {ComponentProps} from "react";

import {
  ChatAttachmentIcon,
  ChatAttachmentInfo,
  ChatAttachmentName,
  ChatAttachmentPreview,
  ChatAttachmentRemove,
  ChatAttachmentRoot,
  ChatAttachmentSize,
} from "./chat-attachment";
import {
  ChatAttachmentInputDropzone,
  ChatAttachmentInputRoot,
  ChatAttachmentInputTrigger,
} from "./chat-attachment-input";

/* -------------------------------------------------------------------------------------------------
 * Compound Components
 * -----------------------------------------------------------------------------------------------*/
export const ChatAttachment = Object.assign(ChatAttachmentRoot, {
  Icon: ChatAttachmentIcon,
  Info: ChatAttachmentInfo,
  Name: ChatAttachmentName,
  Preview: ChatAttachmentPreview,
  Remove: ChatAttachmentRemove,
  Root: ChatAttachmentRoot,
  Size: ChatAttachmentSize,
});

export type ChatAttachment = {
  Props: ComponentProps<typeof ChatAttachmentRoot>;
  RootProps: ComponentProps<typeof ChatAttachmentRoot>;
  PreviewProps: ComponentProps<typeof ChatAttachmentPreview>;
  IconProps: ComponentProps<typeof ChatAttachmentIcon>;
  InfoProps: ComponentProps<typeof ChatAttachmentInfo>;
  NameProps: ComponentProps<typeof ChatAttachmentName>;
  SizeProps: ComponentProps<typeof ChatAttachmentSize>;
  RemoveProps: ComponentProps<typeof ChatAttachmentRemove>;
};

export const ChatAttachmentInput = Object.assign(ChatAttachmentInputRoot, {
  Dropzone: ChatAttachmentInputDropzone,
  Root: ChatAttachmentInputRoot,
  Trigger: ChatAttachmentInputTrigger,
});

export type ChatAttachmentInput = {
  Props: ComponentProps<typeof ChatAttachmentInputRoot>;
  RootProps: ComponentProps<typeof ChatAttachmentInputRoot>;
  TriggerProps: ComponentProps<typeof ChatAttachmentInputTrigger>;
  DropzoneProps: ComponentProps<typeof ChatAttachmentInputDropzone>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatAttachmentRoot,
  ChatAttachmentPreview,
  ChatAttachmentIcon,
  ChatAttachmentInfo,
  ChatAttachmentName,
  ChatAttachmentSize,
  ChatAttachmentRemove,
  ChatAttachmentGroup,
  ChatAttachmentContext,
} from "./chat-attachment";

export {
  ChatAttachmentInputRoot,
  ChatAttachmentInputTrigger,
  ChatAttachmentInputDropzone,
  ChatAttachmentInputContext,
} from "./chat-attachment-input";

export type {
  ChatAttachmentRootProps,
  ChatAttachmentRootProps as ChatAttachmentProps,
  ChatAttachmentPreviewProps,
  ChatAttachmentIconProps,
  ChatAttachmentInfoProps,
  ChatAttachmentNameProps,
  ChatAttachmentSizeProps,
  ChatAttachmentRemoveProps,
  ChatAttachmentGroupProps,
} from "./chat-attachment";

export type {
  ChatAttachmentInputRootProps,
  ChatAttachmentInputRootProps as ChatAttachmentInputProps,
  ChatAttachmentInputTriggerProps,
  ChatAttachmentInputTriggerRenderProps,
  ChatAttachmentInputDropzoneProps,
  ChatAttachmentInputDropzoneRenderProps,
} from "./chat-attachment-input";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
export {
  formatChatAttachmentSize,
  inferChatAttachmentFileKind,
  inferChatAttachmentMediaType,
} from "./chat-attachment.utils";

export type {
  ChatAttachmentFileKind,
  ChatAttachmentMediaType,
  ChatAttachmentVariant,
} from "./chat-attachment.utils";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  chatAttachmentVariants,
  chatAttachmentGroupVariants,
  chatAttachmentInputVariants,
  type ChatAttachmentVariants,
  type ChatAttachmentGroupVariants,
} from "./chat-attachment.styles";
