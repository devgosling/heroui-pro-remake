"use client";

import type {HoverCardContentProps} from "../hover-card";
import type {ComponentPropsWithRef, ReactElement, ReactNode, Ref} from "react";

import {cloneElement, createContext, isValidElement, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {composeTwRenderProps} from "../../utils";
import {HoverCard} from "../hover-card";

import {chatSourceVariants} from "./chat-source.styles";

/* -------------------------------------------------------------------------------------------------
 * Constants & helpers
 * -----------------------------------------------------------------------------------------------*/
/** Hover delays of the source preview: it opens quickly and closes as soon as the pointer leaves. */
const PREVIEW_OPEN_DELAY = 150;
const PREVIEW_CLOSE_DELAY = 0;

/** Label of a source that has neither a title nor an `href`. */
const DEFAULT_TITLE = "Source";

const LINK_REL = "noopener noreferrer";
const LINK_TARGET = "_blank";

type ChatSourceType = "url" | "document";

/** `https://www.example.com/path` -> `example.com`; anything that is not an absolute URL is kept. */
const getDomain = (href?: string): string | undefined => {
  if (!href) return undefined;

  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

/* -------------------------------------------------------------------------------------------------
 * Document icon - Gravity UI "file-text" glyph
 * Gravity UI Icons, Copyright (c) YANDEX LLC, MIT License (https://github.com/gravity-ui/icons)
 * -----------------------------------------------------------------------------------------------*/
const DocumentIcon = ({className}: {className?: string}) => (
  <svg
    aria-hidden="true"
    className={className}
    data-slot="chat-source-document-icon"
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M5 13.5h6a1.5 1.5 0 0 0 1.5-1.5V7.243a1.5 1.5 0 0 0-.44-1.061L8.819 2.939a1.5 1.5 0 0 0-1.06-.439H5A1.5 1.5 0 0 0 3.5 4v8A1.5 1.5 0 0 0 5 13.5m9-6.257a3 3 0 0 0-.879-2.122L9.88 1.88A3 3 0 0 0 7.757 1H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3zM5 8.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 8.25m.75 2.25a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Chat Source Context
 * -----------------------------------------------------------------------------------------------*/
type ChatSourceContext = {
  slots: ReturnType<typeof chatSourceVariants>;
  href?: string;
  /** Explicit title of the source. */
  title?: string;
  description?: string;
  faviconUrl?: string;
  /** Domain of `href` (without `www.`). */
  domain?: string;
  sourceType: ChatSourceType;
  /** Whether the hover preview is mounted (URL source with a title/description or `enablePreview`). */
  isPreviewEnabled: boolean;
};

const ChatSourceContext = createContext<ChatSourceContext | null>(null);

const defaultSlots = chatSourceVariants();

const useChatSource = (): ChatSourceContext =>
  use(ChatSourceContext) ?? {isPreviewEnabled: false, slots: defaultSlots, sourceType: "document"};

/* -------------------------------------------------------------------------------------------------
 * Chat Source Root
 * -------------------------------------------------------------------------------------------------
 * A `<span>` that only renders inline elements, so a chip can sit inside a paragraph. URL sources
 * with a title or a description (or `enablePreview`) are wrapped in a Hover Card: the chip becomes
 * its trigger and `ChatSource.Preview` its content.
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourceRootProps extends Omit<ComponentPropsWithRef<"span">, "title"> {
  /** URL the chip links to. */
  href?: string;
  /** Label of the chip. Defaults to the domain of `href`. */
  title?: string;
  /** Text shown in the hover preview. */
  description?: string;
  /** Logo in the chip and the preview; falls back to the first letter of the title. */
  faviconUrl?: string;
  /** Link or file. @default "url" when `href` is set, otherwise "document" */
  sourceType?: ChatSourceType;
  /** Mounts the hover preview for URL sources. @default true with a title or description */
  enablePreview?: boolean;
  /** Custom composition. Defaults to `ChatSource.Trigger` and `ChatSource.Preview`. */
  children?: ReactNode;
}

const ChatSourceRoot = ({
  children,
  className,
  description,
  enablePreview,
  faviconUrl,
  href,
  sourceType: sourceTypeProp,
  title,
  ...rest
}: ChatSourceRootProps) => {
  const sourceType: ChatSourceType = sourceTypeProp ?? (href ? "url" : "document");
  const isPreviewEnabled = sourceType === "url" && (enablePreview ?? Boolean(title || description));

  const contextValue = useMemo<ChatSourceContext>(
    () => ({
      description,
      domain: getDomain(href),
      faviconUrl,
      href,
      isPreviewEnabled,
      slots: defaultSlots,
      sourceType,
      title,
    }),
    [description, faviconUrl, href, isPreviewEnabled, sourceType, title],
  );

  const content = children ?? (
    <>
      <ChatSourceTrigger />
      {isPreviewEnabled ? <ChatSourcePreview /> : null}
    </>
  );

  return (
    <ChatSourceContext value={contextValue}>
      <span
        {...rest}
        className={defaultSlots.base({className})}
        data-slot="chat-source"
        data-source-type={sourceType}
      >
        {isPreviewEnabled ? (
          <HoverCard closeDelay={PREVIEW_CLOSE_DELAY} openDelay={PREVIEW_OPEN_DELAY}>
            {content}
          </HoverCard>
        ) : (
          content
        )}
      </span>
    </ChatSourceContext>
  );
};

ChatSourceRoot.displayName = "HeroUI.ChatSource";

/* -------------------------------------------------------------------------------------------------
 * Chat Source Trigger
 * -------------------------------------------------------------------------------------------------
 * The chip: an `<a>` that opens in a new tab for URL sources, a plain `<span>` for documents.
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourceTriggerProps extends ComponentPropsWithRef<"a"> {
  /** Replaces the default icon and title. */
  children?: ReactNode;
  /**
   * Chip text, rendered when the trigger has no children.
   * @deprecated Pass `children` instead.
   */
  label?: ReactNode;
}

const ChatSourceTrigger = ({children, className, label, ref, ...rest}: ChatSourceTriggerProps) => {
  const {faviconUrl, href, isPreviewEnabled, slots, sourceType} = useChatSource();
  const classNames = slots.trigger({className});

  const content = children ?? (
    <>
      {sourceType === "document" && !faviconUrl ? (
        <DocumentIcon className={slots.documentIcon()} />
      ) : (
        <ChatSourceIcon />
      )}
      <ChatSourceTitle>{label}</ChatSourceTitle>
    </>
  );

  if (sourceType === "document") {
    return (
      <span
        {...(rest as ComponentPropsWithRef<"span">)}
        ref={ref as Ref<HTMLSpanElement>}
        className={classNames}
        data-slot="chat-source-trigger"
      >
        {content}
      </span>
    );
  }

  const link = (
    <a
      href={href}
      rel={LINK_REL}
      target={LINK_TARGET}
      {...rest}
      ref={ref}
      className={classNames}
      data-slot="chat-source-trigger"
    >
      {content}
    </a>
  );

  return isPreviewEnabled ? <HoverCard.Trigger>{link}</HoverCard.Trigger> : link;
};

ChatSourceTrigger.displayName = "HeroUI.ChatSource.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Chat Source Icon
 * -------------------------------------------------------------------------------------------------
 * A bare, decorative 16px logo: the favicon, a custom element, or the first letter of the title.
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourceIconProps extends Omit<ComponentPropsWithRef<"img">, "children"> {
  /** Overrides the source's `faviconUrl`. */
  faviconUrl?: string;
  /** Custom logo element; it receives the icon class on its root. */
  children?: ReactNode;
}

const ChatSourceIcon = ({
  children,
  className,
  faviconUrl: faviconUrlProp,
  ...rest
}: ChatSourceIconProps) => {
  const {domain, faviconUrl: sourceFaviconUrl, slots, title} = useChatSource();
  const faviconUrl = faviconUrlProp ?? sourceFaviconUrl;

  if (isValidElement<{className?: string}>(children)) {
    const element = children as ReactElement<{className?: string}>;

    return cloneElement(element, {
      "aria-hidden": true,
      className: slots.icon({className: cx(element.props.className, className)}),
      "data-slot": "chat-source-icon",
    } as Partial<{className?: string}>);
  }

  if (children != null && children !== false) {
    return (
      <span aria-hidden="true" className={slots.icon({className})} data-slot="chat-source-icon">
        {children}
      </span>
    );
  }

  if (faviconUrl) {
    return (
      <img
        alt=""
        height={16}
        width={16}
        {...rest}
        className={slots.icon({className})}
        data-slot="chat-source-icon"
        src={faviconUrl}
      />
    );
  }

  const letter = (title ?? domain ?? DEFAULT_TITLE).trim().charAt(0);

  return (
    <span
      aria-hidden="true"
      className={slots.iconFallback({className})}
      data-slot="chat-source-icon-fallback"
    >
      {letter}
    </span>
  );
};

ChatSourceIcon.displayName = "HeroUI.ChatSource.Icon";

/* -------------------------------------------------------------------------------------------------
 * Chat Source Title
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourceTitleProps extends ComponentPropsWithRef<"span"> {}

const ChatSourceTitle = ({children, className, ...rest}: ChatSourceTitleProps) => {
  const {domain, slots, title} = useChatSource();

  return (
    <span {...rest} className={slots.title({className})} data-slot="chat-source-title">
      {children ?? title ?? domain ?? DEFAULT_TITLE}
    </span>
  );
};

ChatSourceTitle.displayName = "HeroUI.ChatSource.Title";

/* -------------------------------------------------------------------------------------------------
 * Chat Source Preview
 * -------------------------------------------------------------------------------------------------
 * The hover card content. Renders nothing unless the source mounts a preview (see the root).
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourcePreviewProps extends Omit<HoverCardContentProps, "title"> {
  /** Overrides the source's title. */
  title?: ReactNode;
  /** Overrides the source's description. */
  description?: ReactNode;
}

const ChatSourcePreview = ({
  children,
  className,
  description: descriptionProp,
  title: titleProp,
  ...rest
}: ChatSourcePreviewProps) => {
  const source = useChatSource();
  const {domain, href, isPreviewEnabled, slots} = source;

  if (!isPreviewEnabled) return null;

  const title = titleProp ?? source.title;
  const description = descriptionProp ?? source.description;

  return (
    <HoverCard.Content
      data-slot="chat-source-preview"
      {...rest}
      className={composeTwRenderProps(className, slots.preview())}
    >
      {children ?? (
        <a
          className={slots.previewLink()}
          data-slot="chat-source-preview-link"
          href={href}
          rel={LINK_REL}
          target={LINK_TARGET}
        >
          <div className={slots.previewHeader()} data-slot="chat-source-preview-header">
            <ChatSourceIcon />
            <span className={slots.previewDomain()} data-slot="chat-source-preview-domain">
              {domain}
            </span>
          </div>
          {title ? (
            <div className={slots.previewTitle()} data-slot="chat-source-preview-title">
              {title}
            </div>
          ) : null}
          {description ? (
            <div className={slots.previewDescription()} data-slot="chat-source-preview-description">
              {description}
            </div>
          ) : null}
        </a>
      )}
    </HoverCard.Content>
  );
};

ChatSourcePreview.displayName = "HeroUI.ChatSource.Preview";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatSourceRoot,
  ChatSourceTrigger,
  ChatSourceIcon,
  ChatSourceTitle,
  ChatSourcePreview,
  ChatSourceContext,
};

export type {
  ChatSourceRootProps,
  ChatSourceTriggerProps,
  ChatSourceIconProps,
  ChatSourceTitleProps,
  ChatSourcePreviewProps,
  ChatSourceType,
};
