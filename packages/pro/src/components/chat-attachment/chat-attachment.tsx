"use client";

import type {
  ChatAttachmentFileKind,
  ChatAttachmentMediaType,
  ChatAttachmentVariant,
} from "./chat-attachment.utils";
import type {CloseButtonProps} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {CloseButton} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {useResolvedClassName} from "../../utils";

import {ChatAttachmentFileIcon} from "./chat-attachment-icons";
import {chatAttachmentGroupVariants, chatAttachmentVariants} from "./chat-attachment.styles";
import {
  formatChatAttachmentSize,
  inferChatAttachmentFileKind,
  inferChatAttachmentMediaType,
} from "./chat-attachment.utils";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ChatAttachmentContext = {
  /** Icon kind inferred from `mimeType` / `name`. */
  fileKind: ChatAttachmentFileKind;
  /** Resolved media type (prop or inferred). */
  mediaType: ChatAttachmentMediaType;
  mimeType?: string;
  name?: string;
  size?: number;
  slots: ReturnType<typeof chatAttachmentVariants>;
  src?: string;
  /** `media` for image/video thumbnails with a `src`, `file` for the horizontal card. */
  variant: ChatAttachmentVariant;
};

const ChatAttachmentContext = createContext<ChatAttachmentContext>({
  fileKind: "file",
  mediaType: "unknown",
  slots: chatAttachmentVariants(),
  variant: "file",
});

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentRootProps extends ComponentPropsWithRef<"div"> {
  /** Attachment media type. Inferred from `mimeType` (or the image/video/audio extension of `name`). */
  mediaType?: ChatAttachmentMediaType;
  /** MIME type used to infer the media type and the file-type icon. */
  mimeType?: string;
  /** Attachment file name (also used to infer the icon by extension). */
  name?: string;
  /** File size in bytes, formatted for display. */
  size?: number;
  /** Preview URL for image or video attachments. */
  src?: string;
  /** Custom attachment content. Defaults to `Preview` + `Info`. */
  children?: ReactNode;
}

const ChatAttachmentRoot = ({
  children,
  className,
  mediaType: mediaTypeProp,
  mimeType,
  name,
  size,
  src,
  ...rest
}: ChatAttachmentRootProps) => {
  const fileKind = inferChatAttachmentFileKind(mimeType, name);
  const mediaType = mediaTypeProp ?? inferChatAttachmentMediaType(mimeType, name);
  const variant: ChatAttachmentVariant =
    (mediaType === "image" || mediaType === "video") && src ? "media" : "file";

  const slots = useMemo(() => chatAttachmentVariants(), []);
  const contextValue = useMemo<ChatAttachmentContext>(
    () => ({fileKind, mediaType, mimeType, name, size, slots, src, variant}),
    [fileKind, mediaType, mimeType, name, size, slots, src, variant],
  );

  return (
    <ChatAttachmentContext value={contextValue}>
      <div
        className={slots.base({className})}
        data-media-type={mediaType}
        data-slot="chat-attachment"
        data-variant={variant}
        title={name}
        {...rest}
      >
        {children ?? (
          <>
            <ChatAttachmentPreview />
            <ChatAttachmentInfo />
          </>
        )}
      </div>
    </ChatAttachmentContext>
  );
};

ChatAttachmentRoot.displayName = "HeroUI.ChatAttachment";

/* -------------------------------------------------------------------------------------------------
 * Preview
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentPreviewProps extends ComponentPropsWithRef<"div"> {
  /** Replaces the default preview (image, video or file-type icon). */
  children?: ReactNode;
}

const ChatAttachmentPreview = ({children, className, ...rest}: ChatAttachmentPreviewProps) => {
  const {mediaType, name, slots, src, variant} = use(ChatAttachmentContext);

  let content: ReactNode = children;

  if (content === undefined) {
    if (variant === "media" && mediaType === "image") {
      content = (
        <img
          alt={name ?? ""}
          className={slots.previewImage()}
          data-slot="chat-attachment-preview-image"
          src={src}
        />
      );
    } else if (variant === "media" && mediaType === "video") {
      content = (
        <video
          muted
          playsInline
          aria-label={name}
          className={slots.previewVideo()}
          data-slot="chat-attachment-preview-video"
          preload="metadata"
          src={src}
        />
      );
    } else {
      content = <ChatAttachmentIcon />;
    }
  }

  return (
    <div className={slots.preview({className})} data-slot="chat-attachment-preview" {...rest}>
      {content}
    </div>
  );
};

ChatAttachmentPreview.displayName = "HeroUI.ChatAttachment.Preview";

/* -------------------------------------------------------------------------------------------------
 * Icon
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentIconProps extends ComponentPropsWithRef<"span"> {
  /** Overrides the inferred file-type icon. */
  children?: ReactNode;
}

const ChatAttachmentIcon = ({children, className, ...rest}: ChatAttachmentIconProps) => {
  const {fileKind, slots} = use(ChatAttachmentContext);

  return (
    <span className={slots.icon({className})} data-slot="chat-attachment-icon" {...rest}>
      {children ?? <ChatAttachmentFileIcon kind={fileKind} />}
    </span>
  );
};

ChatAttachmentIcon.displayName = "HeroUI.ChatAttachment.Icon";

/* -------------------------------------------------------------------------------------------------
 * Info
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentInfoProps extends ComponentPropsWithRef<"div"> {
  /** Defaults to `ChatAttachment.Name` + `ChatAttachment.Size`. */
  children?: ReactNode;
}

const ChatAttachmentInfo = ({children, className, ...rest}: ChatAttachmentInfoProps) => {
  const {slots} = use(ChatAttachmentContext);

  return (
    <div className={slots.info({className})} data-slot="chat-attachment-info" {...rest}>
      {children ?? (
        <>
          <ChatAttachmentName />
          <ChatAttachmentSize />
        </>
      )}
    </div>
  );
};

ChatAttachmentInfo.displayName = "HeroUI.ChatAttachment.Info";

/* -------------------------------------------------------------------------------------------------
 * Name
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentNameProps extends ComponentPropsWithRef<"span"> {
  /** Defaults to the attachment `name`. */
  children?: ReactNode;
}

const ChatAttachmentName = ({children, className, ...rest}: ChatAttachmentNameProps) => {
  const {name, slots} = use(ChatAttachmentContext);

  return (
    <span className={slots.name({className})} data-slot="chat-attachment-name" {...rest}>
      {children ?? name}
    </span>
  );
};

ChatAttachmentName.displayName = "HeroUI.ChatAttachment.Name";

/* -------------------------------------------------------------------------------------------------
 * Size
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentSizeProps extends ComponentPropsWithRef<"span"> {
  /** Defaults to the formatted `size` (bytes). Nothing renders when neither is available. */
  children?: ReactNode;
}

const ChatAttachmentSize = ({children, className, ...rest}: ChatAttachmentSizeProps) => {
  const {size, slots} = use(ChatAttachmentContext);
  const content = children ?? formatChatAttachmentSize(size);

  if (content == null || content === false || content === "") return null;

  return (
    <span className={slots.size({className})} data-slot="chat-attachment-size" {...rest}>
      {content}
    </span>
  );
};

ChatAttachmentSize.displayName = "HeroUI.ChatAttachment.Size";

/* -------------------------------------------------------------------------------------------------
 * Remove (OSS CloseButton)
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentRemoveProps extends CloseButtonProps {}

const ChatAttachmentRemove = ({className, ...rest}: ChatAttachmentRemoveProps) => {
  const {slots} = use(ChatAttachmentContext);
  const resolvedClassName = useResolvedClassName(className, slots.remove());

  return (
    <CloseButton
      aria-label="Remove attachment"
      {...rest}
      className={resolvedClassName}
      data-slot="chat-attachment-remove"
    />
  );
};

ChatAttachmentRemove.displayName = "HeroUI.ChatAttachment.Remove";

/* -------------------------------------------------------------------------------------------------
 * Group
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentGroupProps extends ComponentPropsWithRef<"div"> {}

const ChatAttachmentGroup = ({className, ...rest}: ChatAttachmentGroupProps) => (
  <div
    className={chatAttachmentGroupVariants({className})}
    data-slot="chat-attachment-group"
    {...rest}
  />
);

ChatAttachmentGroup.displayName = "HeroUI.ChatAttachmentGroup";

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  ChatAttachmentRootProps,
  ChatAttachmentPreviewProps,
  ChatAttachmentIconProps,
  ChatAttachmentInfoProps,
  ChatAttachmentNameProps,
  ChatAttachmentSizeProps,
  ChatAttachmentRemoveProps,
  ChatAttachmentGroupProps,
};
