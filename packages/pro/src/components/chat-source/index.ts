import type {ComponentProps} from "react";

import {
  ChatSourceIcon,
  ChatSourcePreview,
  ChatSourceRoot,
  ChatSourceTitle,
  ChatSourceTrigger,
} from "./chat-source";
import {
  ChatSourcesContent,
  ChatSourcesList,
  ChatSourcesRoot,
  ChatSourcesTrigger,
} from "./chat-sources";

/* -------------------------------------------------------------------------------------------------
 * Compound Components
 * -----------------------------------------------------------------------------------------------*/
export const ChatSource = Object.assign(ChatSourceRoot, {
  Icon: ChatSourceIcon,
  Preview: ChatSourcePreview,
  Root: ChatSourceRoot,
  Title: ChatSourceTitle,
  Trigger: ChatSourceTrigger,
});

export type ChatSource = {
  Props: ComponentProps<typeof ChatSourceRoot>;
  RootProps: ComponentProps<typeof ChatSourceRoot>;
  TriggerProps: ComponentProps<typeof ChatSourceTrigger>;
  IconProps: ComponentProps<typeof ChatSourceIcon>;
  TitleProps: ComponentProps<typeof ChatSourceTitle>;
  PreviewProps: ComponentProps<typeof ChatSourcePreview>;
};

export const ChatSources = Object.assign(ChatSourcesRoot, {
  Content: ChatSourcesContent,
  List: ChatSourcesList,
  Root: ChatSourcesRoot,
  Trigger: ChatSourcesTrigger,
});

export type ChatSources = {
  Props: ComponentProps<typeof ChatSourcesRoot>;
  RootProps: ComponentProps<typeof ChatSourcesRoot>;
  TriggerProps: ComponentProps<typeof ChatSourcesTrigger>;
  ContentProps: ComponentProps<typeof ChatSourcesContent>;
  ListProps: ComponentProps<typeof ChatSourcesList>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatSourceRoot,
  ChatSourceTrigger,
  ChatSourceIcon,
  ChatSourceTitle,
  ChatSourcePreview,
  ChatSourceContext,
} from "./chat-source";

export {
  ChatSourcesRoot,
  ChatSourcesTrigger,
  ChatSourcesContent,
  ChatSourcesList,
  ChatSourcesContext,
} from "./chat-sources";

export type {
  ChatSourceRootProps,
  ChatSourceRootProps as ChatSourceProps,
  ChatSourceTriggerProps,
  ChatSourceIconProps,
  ChatSourceTitleProps,
  ChatSourcePreviewProps,
  ChatSourceType,
} from "./chat-source";

export type {
  ChatSourcesRootProps,
  ChatSourcesRootProps as ChatSourcesProps,
  ChatSourcesTriggerProps,
  ChatSourcesContentProps,
  ChatSourcesListProps,
  ChatSourcesToggleState,
} from "./chat-sources";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  chatSourceVariants,
  chatSourcesVariants,
  type ChatSourceVariants,
  type ChatSourcesVariants,
} from "./chat-source.styles";
