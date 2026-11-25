"use client";

import type {ChatConversationScrollBehavior} from "./use-stick-to-bottom";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
interface ChatConversationContextValue {
  /** Whether the content is taller than the view. */
  hasOverflow: boolean;
  /** Whether the view is at the bottom. */
  isAtBottom: boolean;
  /** Scrolls to the bottom and follows new content again. `behavior` defaults to `smooth`. */
  scrollToBottom: (behavior?: ChatConversationScrollBehavior) => void;
  /** Moves focus to the viewport without an outline (a temporary `tabindex="-1"`). */
  focusViewport: () => void;
}

const ChatConversationContext = createContext<ChatConversationContextValue | null>(null);

function useChatConversationContext(consumer: string) {
  const context = use(ChatConversationContext);

  if (!context) throw new Error(`${consumer} must be used within a ChatConversation.`);

  return context;
}

/* -------------------------------------------------------------------------------------------------
 * useChatConversation
 * -----------------------------------------------------------------------------------------------*/
interface UseChatConversationReturn {
  /** Whether the content is taller than the view. */
  hasOverflow: boolean;
  /** Whether the view is at the bottom. */
  isAtBottom: boolean;
  /** Scrolls to the bottom and follows new content again. `behavior` defaults to `smooth`. */
  scrollToBottom: (behavior?: ChatConversationScrollBehavior) => void;
}

/** Reads the scroll state of the enclosing ChatConversation. Throws outside one. */
function useChatConversation(): UseChatConversationReturn {
  const {hasOverflow, isAtBottom, scrollToBottom} =
    useChatConversationContext("useChatConversation");

  return {hasOverflow, isAtBottom, scrollToBottom};
}

export {ChatConversationContext, useChatConversationContext, useChatConversation};

export type {ChatConversationContextValue, UseChatConversationReturn};
