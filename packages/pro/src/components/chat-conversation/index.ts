import type {ComponentProps} from "react";

import {
  ChatConversationContent,
  ChatConversationRoot,
  ChatConversationScrollAnchor,
  ChatConversationScrollButton,
} from "./chat-conversation";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * `ScrollAnchor` is deprecated: the conversation sticks to the bottom on its own.
 * -----------------------------------------------------------------------------------------------*/
export const ChatConversation = Object.assign(ChatConversationRoot, {
  Content: ChatConversationContent,
  Root: ChatConversationRoot,
  ScrollAnchor: ChatConversationScrollAnchor,
  ScrollButton: ChatConversationScrollButton,
});

export type ChatConversation = {
  Props: ComponentProps<typeof ChatConversationRoot>;
  RootProps: ComponentProps<typeof ChatConversationRoot>;
  ContentProps: ComponentProps<typeof ChatConversationContent>;
  ScrollButtonProps: ComponentProps<typeof ChatConversationScrollButton>;
  /** @deprecated */
  ScrollAnchorProps: ComponentProps<typeof ChatConversationScrollAnchor>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatConversationRoot,
  ChatConversationContent,
  ChatConversationScrollButton,
  ChatConversationScrollAnchor,
} from "./chat-conversation";

export {ChatConversationContext, useChatConversation} from "./chat-conversation-context";

export type {
  ChatConversationRootProps,
  ChatConversationRootProps as ChatConversationProps,
  ChatConversationContentProps,
  ChatConversationScrollButtonProps,
  ChatConversationScrollAnchorProps,
} from "./chat-conversation";

export type {
  ChatConversationContextValue,
  UseChatConversationReturn,
} from "./chat-conversation-context";

export type {ChatConversationScrollBehavior} from "./use-stick-to-bottom";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {chatConversationVariants, type ChatConversationVariants} from "./chat-conversation.styles";
