import type {ComponentProps} from "react";

import {ChatMessageActions, ChatMessageActionsAction} from "../chat-message-actions";

import {
  ChatMessageAssistant,
  ChatMessageAvatar,
  ChatMessageBody,
  ChatMessageBubble,
  ChatMessageContent,
  ChatMessageMedia,
  ChatMessageUser,
} from "./chat-message";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Chat Message has no root of its own: a turn is either `ChatMessage.User` or
 * `ChatMessage.Assistant`. `Actions` / `Action` are the Chat Message Actions component (with its
 * Copy, ThumbsUp, ThumbsDown, Regenerate and More presets); prefer importing ChatMessageActions.
 * -----------------------------------------------------------------------------------------------*/
export const ChatMessage = {
  Action: ChatMessageActionsAction,
  Actions: ChatMessageActions,
  Assistant: ChatMessageAssistant,
  Avatar: ChatMessageAvatar,
  Body: ChatMessageBody,
  Bubble: ChatMessageBubble,
  Content: ChatMessageContent,
  Media: ChatMessageMedia,
  User: ChatMessageUser,
};

export type ChatMessage = {
  UserProps: ComponentProps<typeof ChatMessageUser>;
  AssistantProps: ComponentProps<typeof ChatMessageAssistant>;
  AvatarProps: ComponentProps<typeof ChatMessageAvatar>;
  BodyProps: ComponentProps<typeof ChatMessageBody>;
  BubbleProps: ComponentProps<typeof ChatMessageBubble>;
  ContentProps: ComponentProps<typeof ChatMessageContent>;
  MediaProps: ComponentProps<typeof ChatMessageMedia>;
  ActionsProps: ComponentProps<typeof ChatMessageActions>;
  ActionProps: ComponentProps<typeof ChatMessageActionsAction>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatMessageUser,
  ChatMessageAssistant,
  ChatMessageAvatar,
  ChatMessageBody,
  ChatMessageBubble,
  ChatMessageContent,
  ChatMessageMedia,
} from "./chat-message";

export type {
  ChatMessageUserProps,
  ChatMessageAssistantProps,
  ChatMessageAvatarProps,
  ChatMessageBodyProps,
  ChatMessageBubbleProps,
  ChatMessageContentProps,
  ChatMessageMediaProps,
} from "./chat-message";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {chatMessageVariants, type ChatMessageVariants} from "./chat-message.styles";
