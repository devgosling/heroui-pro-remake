"use client";

import type {ChatConversationContextValue} from "./chat-conversation-context";
import type {ChatConversationScrollBehavior} from "./use-stick-to-bottom";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Button, Tooltip} from "@heroui/react";
import {useCallback, useLayoutEffect, useMemo, useRef} from "react";

import {composeTwRenderProps, useMergedRef} from "../../utils";

import {ChatConversationContext, useChatConversationContext} from "./chat-conversation-context";
import {chatConversationVariants} from "./chat-conversation.styles";
import {useStickToBottom} from "./use-stick-to-bottom";

/** The parts carry no variants, so every part resolves its classes from one static set. */
const slots = chatConversationVariants();

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface ChatConversationRootProps extends ComponentPropsWithRef<"div"> {
  /**
   * Scroll behaviour on mount.
   * @default "smooth"
   */
  initial?: ChatConversationScrollBehavior;
  /**
   * Scroll behaviour when the content grows at the bottom while the view follows it.
   * @default "smooth"
   */
  resize?: ChatConversationScrollBehavior;
}

/**
 * A stick-to-bottom scroll viewport (`role="log"`, a polite live region). The view follows new
 * content until the user scrolls up, and follows again once they scroll back to the bottom.
 */
const ChatConversationRoot = ({
  children,
  className,
  initial = "smooth",
  ref,
  resize = "smooth",
  ...rest
}: ChatConversationRootProps) => {
  const {hasOverflow, isAtBottom, scrollRef, scrollToBottom} = useStickToBottom({
    initial,
    resize,
  });
  const mergedRef = useMergedRef(ref, scrollRef);

  // Like a Modal dialog: the viewport takes focus without becoming a tab stop or showing a ring.
  const focusViewport = useCallback(() => {
    const element = scrollRef.current;

    if (!element) return;

    if (!element.hasAttribute("tabindex")) {
      element.setAttribute("tabindex", "-1");
      element.addEventListener("blur", () => element.removeAttribute("tabindex"), {once: true});
    }

    element.focus({preventScroll: true});
  }, [scrollRef]);

  const contextValue = useMemo<ChatConversationContextValue>(
    () => ({focusViewport, hasOverflow, isAtBottom, scrollToBottom}),
    [focusViewport, hasOverflow, isAtBottom, scrollToBottom],
  );

  return (
    <ChatConversationContext value={contextValue}>
      <div
        ref={mergedRef}
        className={slots.base({className})}
        data-slot="chat-conversation"
        role="log"
        {...rest}
      >
        {children}
      </div>
    </ChatConversationContext>
  );
};

ChatConversationRoot.displayName = "HeroUI.ChatConversation";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
interface ChatConversationContentProps extends ComponentPropsWithRef<"div"> {}

/** The message column. It centres itself: set its width with a class such as `max-w-[714px]`. */
const ChatConversationContent = ({className, ...rest}: ChatConversationContentProps) => (
  <div className={slots.content({className})} data-slot="chat-conversation-content" {...rest} />
);

ChatConversationContent.displayName = "HeroUI.ChatConversation.Content";

/* -------------------------------------------------------------------------------------------------
 * Scroll button
 * -----------------------------------------------------------------------------------------------*/
/*
 * Chevron path from Gravity UI Icons (https://github.com/gravity-ui/icons), chevron-down,
 * MIT License, Copyright (c) 2022 YANDEX LLC.
 */
const ChevronDownIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M2.97 5.47a.75.75 0 0 1 1.06 0L8 9.44l3.97-3.97a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

type ButtonProps = ComponentPropsWithRef<typeof Button>;

interface ChatConversationScrollButtonProps extends ButtonProps {
  /**
   * Accessible name of the icon button.
   * @default "Scroll to bottom"
   */
  "aria-label"?: string;
  /** Tooltip shown on hover and focus. */
  tooltip?: ReactNode;
}

/**
 * A jump-to-bottom icon button pinned to the bottom of the viewport. It shows only while the view
 * is scrolled away from the bottom; while hidden it is disabled and hidden from screen readers.
 * Your `onPress` runs as well as the scroll.
 */
const ChatConversationScrollButton = ({
  "aria-label": ariaLabel = "Scroll to bottom",
  children,
  className,
  isDisabled,
  isIconOnly = true,
  onPress,
  size = "sm",
  tooltip,
  variant = "secondary",
  ...rest
}: ChatConversationScrollButtonProps) => {
  const {focusViewport, isAtBottom, scrollToBottom} = useChatConversationContext(
    "ChatConversation.ScrollButton",
  );
  const isHidden = isAtBottom;

  const containerRef = useRef<HTMLDivElement>(null);
  const isKeyboardPressRef = useRef(false);

  const handlePress = useCallback<NonNullable<ButtonProps["onPress"]>>(
    (event) => {
      onPress?.(event);
      isKeyboardPressRef.current = event.pointerType === "keyboard";
      scrollToBottom();
    },
    [onPress, scrollToBottom],
  );

  // The button hides (and is disabled) once the view reaches the bottom. After a keyboard press,
  // focus would fall back to the document, so it moves to the conversation instead.
  useLayoutEffect(() => {
    if (!isHidden || !isKeyboardPressRef.current) return;

    isKeyboardPressRef.current = false;

    const active = document.activeElement;
    const hasLostFocus = !active || active === document.body;

    if (hasLostFocus || containerRef.current?.contains(active)) focusViewport();
  }, [focusViewport, isHidden]);

  const button = (
    <Button
      data-slot="chat-conversation-scroll-button"
      {...rest}
      aria-label={ariaLabel}
      className={composeTwRenderProps(className, slots.scrollButton())}
      isDisabled={isHidden || isDisabled}
      isIconOnly={isIconOnly}
      size={size}
      variant={variant}
      onPress={handlePress}
    >
      {children ?? <ChevronDownIcon />}
    </Button>
  );

  const hasTooltip = tooltip !== undefined && tooltip !== null && tooltip !== false;

  return (
    <div
      ref={containerRef}
      aria-hidden={isHidden ? true : undefined}
      className={slots.scrollButtonContainer()}
      data-slot="chat-conversation-scroll-button-container"
      data-state={isHidden ? "hidden" : "visible"}
    >
      {hasTooltip ? (
        // Shown without the usual warm-up delay, like the other chat icon actions.
        <Tooltip delay={0} isDisabled={isHidden}>
          <Tooltip.Trigger>{button}</Tooltip.Trigger>
          <Tooltip.Content>{tooltip}</Tooltip.Content>
        </Tooltip>
      ) : (
        button
      )}
    </div>
  );
};

ChatConversationScrollButton.displayName = "HeroUI.ChatConversation.ScrollButton";

/* -------------------------------------------------------------------------------------------------
 * Scroll anchor (deprecated)
 * -----------------------------------------------------------------------------------------------*/
interface ChatConversationScrollAnchorProps extends Omit<
  ComponentPropsWithRef<"div">,
  "children"
> {}

/**
 * @deprecated Remove it: the conversation sticks to the bottom on its own. Call `scrollToBottom`
 * from `useChatConversation` to scroll. Renders an empty, hidden div.
 */
const ChatConversationScrollAnchor = ({className, ...rest}: ChatConversationScrollAnchorProps) => (
  <div
    aria-hidden="true"
    className={slots.scrollAnchor({className})}
    data-slot="chat-conversation-scroll-anchor"
    {...rest}
  />
);

ChatConversationScrollAnchor.displayName = "HeroUI.ChatConversation.ScrollAnchor";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatConversationRoot,
  ChatConversationContent,
  ChatConversationScrollButton,
  ChatConversationScrollAnchor,
};

export type {
  ChatConversationRootProps,
  ChatConversationContentProps,
  ChatConversationScrollButtonProps,
  ChatConversationScrollAnchorProps,
};
