"use client";

import type {ChatMessageVariants} from "./chat-message.styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Avatar, Card} from "@heroui/react";

import {chatMessageVariants} from "./chat-message.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * Every part is a plain element: the layout lives in chat-message.css, so a part works on its own
 * and inside any composition (grouped turns, a custom avatar, a card turn, ...).
 * -----------------------------------------------------------------------------------------------*/
const slots = chatMessageVariants();

/* -------------------------------------------------------------------------------------------------
 * User
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageUserProps extends ComponentPropsWithRef<"div"> {}

/** The user's turn: a full-width column that aligns its bubble to the end. */
const ChatMessageUser = ({className, ...rest}: ChatMessageUserProps) => (
  <div className={slots.user({className})} data-slot="chat-message-user" {...rest} />
);

ChatMessageUser.displayName = "HeroUI.ChatMessage.User";

/* -------------------------------------------------------------------------------------------------
 * Assistant
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageAssistantProps extends ComponentPropsWithRef<"div"> {
  /**
   * `card` places the whole turn on a Card surface (reasoning, answer, separator, sources).
   * @default "default"
   */
  variant?: NonNullable<ChatMessageVariants["variant"]>;
}

/** The assistant's turn: an avatar + body row, or a Card surface with `variant="card"`. */
const ChatMessageAssistant = ({
  children,
  className,
  variant = "default",
  ...rest
}: ChatMessageAssistantProps) => {
  const assistantClassName = chatMessageVariants({variant}).assistant({className});

  if (variant === "card") {
    // The OSS Card gives the surface (`.card.card--default`); our classes follow its own.
    return (
      <Card
        className={assistantClassName}
        data-slot="chat-message-assistant"
        data-variant={variant}
        {...rest}
      >
        {children}
      </Card>
    );
  }

  return (
    <div
      className={assistantClassName}
      data-slot="chat-message-assistant"
      data-variant={variant}
      {...rest}
    >
      {children}
    </div>
  );
};

ChatMessageAssistant.displayName = "HeroUI.ChatMessage.Assistant";

/* -------------------------------------------------------------------------------------------------
 * Avatar
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageAvatarProps extends ComponentPropsWithRef<"div"> {
  /** Alternative text for the `src` image. */
  alt?: string;
  /** Image URL. */
  src?: string;
  /** Text shown without an image (or while it loads), such as initials. */
  fallback?: ReactNode;
  /**
   * When `false`, renders a same-size spacer (hidden from screen readers) so grouped messages
   * stay aligned with the first one.
   * @default true
   */
  show?: boolean;
  /** Custom avatar. Replaces the built-in small HeroUI Avatar built from `src` / `fallback`. */
  children?: ReactNode;
}

/** A small HeroUI Avatar pinned to the top of the assistant row. */
const ChatMessageAvatar = ({
  alt,
  children,
  className,
  fallback,
  show = true,
  src,
  ...rest
}: ChatMessageAvatarProps) => {
  if (!show) {
    return (
      <div
        aria-hidden="true"
        className={slots.avatarSpacer({className})}
        data-slot="chat-message-avatar-spacer"
        {...rest}
      />
    );
  }

  return (
    <div className={slots.avatar({className})} data-slot="chat-message-avatar" {...rest}>
      {children ?? (
        <Avatar size="sm">
          {src ? <Avatar.Image alt={alt} src={src} /> : null}
          {fallback !== undefined && fallback !== null ? (
            <Avatar.Fallback>{fallback}</Avatar.Fallback>
          ) : null}
        </Avatar>
      )}
    </div>
  );
};

ChatMessageAvatar.displayName = "HeroUI.ChatMessage.Avatar";

/* -------------------------------------------------------------------------------------------------
 * Body
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageBodyProps extends ComponentPropsWithRef<"div"> {}

/** The assistant's content column (content, media, actions). */
const ChatMessageBody = ({className, ...rest}: ChatMessageBodyProps) => (
  <div className={slots.body({className})} data-slot="chat-message-body" {...rest} />
);

ChatMessageBody.displayName = "HeroUI.ChatMessage.Body";

/* -------------------------------------------------------------------------------------------------
 * Bubble
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageBubbleProps extends ComponentPropsWithRef<"div"> {}

/** The user's message bubble. */
const ChatMessageBubble = ({className, ...rest}: ChatMessageBubbleProps) => (
  <div className={slots.bubble({className})} data-slot="chat-message-bubble" {...rest} />
);

ChatMessageBubble.displayName = "HeroUI.ChatMessage.Bubble";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageContentProps extends ComponentPropsWithRef<"div"> {}

/** Message text (plain text or a Markdown block). */
const ChatMessageContent = ({className, ...rest}: ChatMessageContentProps) => (
  <div className={slots.content({className})} data-slot="chat-message-content" {...rest} />
);

ChatMessageContent.displayName = "HeroUI.ChatMessage.Content";

/* -------------------------------------------------------------------------------------------------
 * Media
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageMediaProps extends ComponentPropsWithRef<"div"> {}

/** A column for images, charts or attachments. */
const ChatMessageMedia = ({className, ...rest}: ChatMessageMediaProps) => (
  <div className={slots.media({className})} data-slot="chat-message-media" {...rest} />
);

ChatMessageMedia.displayName = "HeroUI.ChatMessage.Media";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatMessageUser,
  ChatMessageAssistant,
  ChatMessageAvatar,
  ChatMessageBody,
  ChatMessageBubble,
  ChatMessageContent,
  ChatMessageMedia,
};

export type {
  ChatMessageUserProps,
  ChatMessageAssistantProps,
  ChatMessageAvatarProps,
  ChatMessageBodyProps,
  ChatMessageBubbleProps,
  ChatMessageContentProps,
  ChatMessageMediaProps,
};
