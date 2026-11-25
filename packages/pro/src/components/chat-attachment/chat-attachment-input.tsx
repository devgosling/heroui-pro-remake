"use client";

import type {ButtonProps} from "@heroui/react";
import type {
  ChangeEvent,
  ComponentPropsWithRef,
  DragEvent,
  DragEventHandler,
  ReactElement,
  ReactNode,
} from "react";

import {Button} from "@heroui/react";
import {createContext, use, useCallback, useMemo, useRef, useState} from "react";

import {useMergedRef} from "../../utils";

import {ChatAttachmentPaperclipIcon} from "./chat-attachment-icons";
import {chatAttachmentInputVariants} from "./chat-attachment.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
/** Mirrors the native `accept` matching (".ext", "type/*" and exact MIME tokens). */
function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;

  const tokens = accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));

    return type === token;
  });
}

function hasFiles(event: DragEvent<HTMLElement>): boolean {
  const types = event.dataTransfer?.types;

  return types ? Array.from(types).includes("Files") : false;
}

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ChatAttachmentInputContext = {
  accept?: string;
  isDisabled: boolean;
  multiple: boolean;
  /** Opens the native file picker (no-op while disabled). */
  openFilePicker: () => void;
  /** Filters (accept / multiple) and forwards files to `onFilesSelected`. */
  selectFiles: (files: File[]) => void;
};

const ChatAttachmentInputContext = createContext<ChatAttachmentInputContext>({
  isDisabled: true,
  multiple: true,
  openFilePicker: () => {},
  selectFiles: () => {},
});

/* -------------------------------------------------------------------------------------------------
 * Root (headless: renders the hidden file input followed by its children)
 * -----------------------------------------------------------------------------------------------*/
interface ChatAttachmentInputRootProps extends Omit<
  ComponentPropsWithRef<"input">,
  "accept" | "children" | "disabled" | "multiple" | "onChange" | "type"
> {
  /** Native file input accept filter. Also applied to dropped files. */
  accept?: string;
  /** Allow multiple files. @default true */
  multiple?: boolean;
  /** Disable picker and drop behaviour. @default false */
  disabled?: boolean;
  /** Called when files are selected or dropped. */
  onFilesSelected?: (files: File[]) => void;
  /** Usually a `Trigger` and a `Dropzone`. */
  children?: ReactNode;
}

const ChatAttachmentInputRoot = ({
  accept,
  children,
  className,
  disabled = false,
  multiple = true,
  onFilesSelected,
  ref,
  ...rest
}: ChatAttachmentInputRootProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  const selectFiles = useCallback(
    (files: File[]) => {
      if (disabled) return;

      let accepted = files.filter((file) => matchesAccept(file, accept));

      if (!multiple) accepted = accepted.slice(0, 1);
      if (accepted.length > 0) onFilesSelected?.(accepted);
    },
    [accept, disabled, multiple, onFilesSelected],
  );

  const openFilePicker = useCallback(() => {
    if (disabled) return;

    inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.currentTarget.files ?? []);

      // Reset so picking the same file again still fires `change`.
      event.currentTarget.value = "";
      if (files.length > 0) selectFiles(files);
    },
    [selectFiles],
  );

  const contextValue = useMemo<ChatAttachmentInputContext>(
    () => ({accept, isDisabled: disabled, multiple, openFilePicker, selectFiles}),
    [accept, disabled, multiple, openFilePicker, selectFiles],
  );

  return (
    <ChatAttachmentInputContext value={contextValue}>
      <input
        ref={mergedRef}
        aria-hidden="true"
        className={chatAttachmentInputVariants({className})}
        {...rest}
        accept={accept}
        data-slot="chat-attachment-input-file-input"
        disabled={disabled}
        multiple={multiple}
        type="file"
        onChange={handleChange}
      />
      {children}
    </ChatAttachmentInputContext>
  );
};

ChatAttachmentInputRoot.displayName = "HeroUI.ChatAttachmentInput";

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/
/** Props handed to a custom `render` of `ChatAttachmentInput.Trigger` (HeroUI / RAC button props). */
type ChatAttachmentInputTriggerRenderProps = Omit<ButtonProps, "render"> & {
  "aria-label"?: string;
  isDisabled: boolean;
  onPress: NonNullable<ButtonProps["onPress"]>;
};

interface ChatAttachmentInputTriggerProps extends Omit<ButtonProps, "render"> {
  /**
   * Renders another button instead of the default icon button, e.g.
   * `render={(props) => <PromptInput.Action {...props} />}`.
   */
  render?: (props: ChatAttachmentInputTriggerRenderProps) => ReactElement;
}

const ChatAttachmentInputTrigger = ({
  "aria-label": ariaLabel = "Attach file",
  children,
  isDisabled,
  onPress,
  render,
  ...rest
}: ChatAttachmentInputTriggerProps) => {
  const {isDisabled: isInputDisabled, openFilePicker} = use(ChatAttachmentInputContext);

  const handlePress = useCallback<NonNullable<ButtonProps["onPress"]>>(
    (event) => {
      onPress?.(event);
      openFilePicker();
    },
    [onPress, openFilePicker],
  );

  const triggerProps: ChatAttachmentInputTriggerRenderProps = {
    ...rest,
    "aria-label": ariaLabel,
    children,
    isDisabled: Boolean(isDisabled || isInputDisabled),
    onPress: handlePress,
  };

  if (render) return render(triggerProps);

  return (
    <Button isIconOnly variant="tertiary" {...triggerProps}>
      {children ?? <ChatAttachmentPaperclipIcon />}
    </Button>
  );
};

ChatAttachmentInputTrigger.displayName = "HeroUI.ChatAttachmentInput.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Dropzone
 * -----------------------------------------------------------------------------------------------*/
/** DOM props handed to a custom `render` of `ChatAttachmentInput.Dropzone`. */
type ChatAttachmentInputDropzoneRenderProps = Omit<ComponentPropsWithRef<"div">, "ref"> & {
  "data-dragging"?: "true";
  onDragEnter: DragEventHandler<HTMLElement>;
  onDragLeave: DragEventHandler<HTMLElement>;
  onDragOver: DragEventHandler<HTMLElement>;
  onDrop: DragEventHandler<HTMLElement>;
};

interface ChatAttachmentInputDropzoneProps extends ComponentPropsWithRef<"div"> {
  /**
   * Attaches the drop behaviour to another element, e.g.
   * `render={(props) => <PromptInput.Shell {...props}>…</PromptInput.Shell>}`.
   */
  render?: (props: ChatAttachmentInputDropzoneRenderProps) => ReactElement;
}

const ChatAttachmentInputDropzone = ({
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  ref,
  render,
  ...rest
}: ChatAttachmentInputDropzoneProps) => {
  const {isDisabled, selectFiles} = use(ChatAttachmentInputContext);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback<DragEventHandler<HTMLElement>>(
    (event) => {
      onDragEnter?.(event as DragEvent<HTMLDivElement>);
      if (isDisabled || !hasFiles(event)) return;

      event.preventDefault();
      setIsDragging(true);
    },
    [isDisabled, onDragEnter],
  );

  const handleDragOver = useCallback<DragEventHandler<HTMLElement>>(
    (event) => {
      onDragOver?.(event as DragEvent<HTMLDivElement>);
      if (isDisabled || !hasFiles(event)) return;

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    },
    [isDisabled, onDragOver],
  );

  const handleDragLeave = useCallback<DragEventHandler<HTMLElement>>(
    (event) => {
      onDragLeave?.(event as DragEvent<HTMLDivElement>);
      if (isDisabled) return;

      // Like Pro, leave is always cancelled while enabled (whatever is dragged).
      event.preventDefault();

      const next = event.relatedTarget as Node | null;

      // Moving between descendants keeps the drop target active.
      if (next && event.currentTarget.contains(next)) return;
      setIsDragging(false);
    },
    [isDisabled, onDragLeave],
  );

  const handleDrop = useCallback<DragEventHandler<HTMLElement>>(
    (event) => {
      onDrop?.(event as DragEvent<HTMLDivElement>);
      setIsDragging(false);
      if (isDisabled) return;

      // Like Pro, every drop on the zone is cancelled; only files are forwarded.
      event.preventDefault();
      if (hasFiles(event)) selectFiles(Array.from(event.dataTransfer.files));
    },
    [isDisabled, onDrop, selectFiles],
  );

  const dropzoneProps: ChatAttachmentInputDropzoneRenderProps = {
    ...rest,
    "data-dragging": isDragging && !isDisabled ? "true" : undefined,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  if (render) return render(dropzoneProps);

  return <div ref={ref} data-slot="chat-attachment-input-dropzone" {...dropzoneProps} />;
};

ChatAttachmentInputDropzone.displayName = "HeroUI.ChatAttachmentInput.Dropzone";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatAttachmentInputRoot,
  ChatAttachmentInputTrigger,
  ChatAttachmentInputDropzone,
  ChatAttachmentInputContext,
};

export type {
  ChatAttachmentInputRootProps,
  ChatAttachmentInputTriggerProps,
  ChatAttachmentInputTriggerRenderProps,
  ChatAttachmentInputDropzoneProps,
  ChatAttachmentInputDropzoneRenderProps,
};
