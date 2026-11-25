import type {ComponentProps} from "react";

import {
  ChatMessageActionsAction,
  ChatMessageActionsCopy,
  ChatMessageActionsMore,
  ChatMessageActionsRegenerate,
  ChatMessageActionsRoot,
  ChatMessageActionsThumbsDown,
  ChatMessageActionsThumbsUp,
} from "./chat-message-actions";
import {
  ChatMessageActionsCopiedIcon,
  ChatMessageActionsCopyIcon,
  ChatMessageActionsMenuIcon,
  ChatMessageActionsRegenerateIcon,
  ChatMessageActionsThumbsDownIcon,
  ChatMessageActionsThumbsUpIcon,
} from "./chat-message-actions-icons";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// Preset actions: Copy, ThumbsUp, ThumbsDown, Regenerate, More.
// Preset icons (swap them for your own icon set): *Icon.
export const ChatMessageActions = Object.assign(ChatMessageActionsRoot, {
  Action: ChatMessageActionsAction,
  CopiedIcon: ChatMessageActionsCopiedIcon,
  Copy: ChatMessageActionsCopy,
  CopyIcon: ChatMessageActionsCopyIcon,
  MenuIcon: ChatMessageActionsMenuIcon,
  More: ChatMessageActionsMore,
  Regenerate: ChatMessageActionsRegenerate,
  RegenerateIcon: ChatMessageActionsRegenerateIcon,
  Root: ChatMessageActionsRoot,
  ThumbsDown: ChatMessageActionsThumbsDown,
  ThumbsDownIcon: ChatMessageActionsThumbsDownIcon,
  ThumbsUp: ChatMessageActionsThumbsUp,
  ThumbsUpIcon: ChatMessageActionsThumbsUpIcon,
});

export type ChatMessageActions = {
  Props: ComponentProps<typeof ChatMessageActionsRoot>;
  RootProps: ComponentProps<typeof ChatMessageActionsRoot>;
  ActionProps: ComponentProps<typeof ChatMessageActionsAction>;
  CopyProps: ComponentProps<typeof ChatMessageActionsCopy>;
  PresetProps: ComponentProps<typeof ChatMessageActionsThumbsUp>;
  IconProps: ComponentProps<typeof ChatMessageActionsCopyIcon>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatMessageActionsRoot,
  ChatMessageActionsAction,
  ChatMessageActionsCopy,
  ChatMessageActionsThumbsUp,
  ChatMessageActionsThumbsDown,
  ChatMessageActionsRegenerate,
  ChatMessageActionsMore,
} from "./chat-message-actions";

export {
  ChatMessageActionsCopyIcon,
  ChatMessageActionsCopiedIcon,
  ChatMessageActionsThumbsUpIcon,
  ChatMessageActionsThumbsDownIcon,
  ChatMessageActionsRegenerateIcon,
  ChatMessageActionsMenuIcon,
} from "./chat-message-actions-icons";

export type {
  ChatMessageActionsRootProps,
  ChatMessageActionsRootProps as ChatMessageActionsProps,
  ChatMessageActionsActionProps,
  ChatMessageActionsPresetProps,
  ChatMessageActionsCopyProps,
} from "./chat-message-actions";

export type {ChatMessageActionsIconProps} from "./chat-message-actions-icons";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  chatMessageActionsVariants,
  type ChatMessageActionsVariants,
} from "./chat-message-actions.styles";
