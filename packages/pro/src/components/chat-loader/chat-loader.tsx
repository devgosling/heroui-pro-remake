"use client";

import type {ChatLoaderVariants} from "./chat-loader.styles";
import type {ComponentPropsWithRef} from "react";

import {Spinner} from "@heroui/react";
import {createContext, use, useMemo} from "react";

import {chatLoaderVariants} from "./chat-loader.styles";

type ChatLoaderSize = NonNullable<ChatLoaderVariants["size"]>;

type ChatLoaderSlots = ReturnType<typeof chatLoaderVariants>;

/* -------------------------------------------------------------------------------------------------
 * Skeleton Context
 *
 * `ChatLoader.Skeleton` shares its size with the avatar and line primitives rendered inside it.
 * Outside a skeleton the primitives fall back to `md` and still keep their own `className`.
 * -----------------------------------------------------------------------------------------------*/
type ChatLoaderSkeletonContext = {
  size: ChatLoaderSize;
  slots: ChatLoaderSlots;
};

const defaultSlots = chatLoaderVariants();

const ChatLoaderSkeletonContext = createContext<ChatLoaderSkeletonContext>({
  size: "md",
  slots: defaultSlots,
});

/** Slots for a skeleton primitive: the skeleton's ones, or fresh ones when `size` overrides it. */
function useSkeletonSlots(size: ChatLoaderSize | undefined): ChatLoaderSlots {
  const context = use(ChatLoaderSkeletonContext);
  const overridden = size !== undefined && size !== context.size;

  return useMemo(
    () => (overridden ? chatLoaderVariants({size}) : context.slots),
    [overridden, size, context.slots],
  );
}

/* -------------------------------------------------------------------------------------------------
 * Skeleton
 * -----------------------------------------------------------------------------------------------*/
interface ChatLoaderSkeletonProps extends ComponentPropsWithRef<"div"> {
  /**
   * Status text announced while the skeleton shows. When set, the skeleton becomes a
   * `role="status"` region named by this text.
   */
  label?: string;
  /** Avatar and line size. @default "md" */
  size?: ChatLoaderSize;
}

const ChatLoaderSkeleton = ({
  children,
  className,
  label,
  size,
  ...rest
}: ChatLoaderSkeletonProps) => {
  const resolvedSize: ChatLoaderSize = size ?? "md";
  const slots = useMemo(() => chatLoaderVariants({size: resolvedSize}), [resolvedSize]);
  const contextValue = useMemo<ChatLoaderSkeletonContext>(
    () => ({size: resolvedSize, slots}),
    [resolvedSize, slots],
  );

  const hasChildren = children !== undefined && children !== null;
  const name = label || undefined;

  return (
    <ChatLoaderSkeletonContext value={contextValue}>
      <div
        aria-busy="true"
        aria-label={name}
        role={name ? "status" : undefined}
        {...rest}
        className={slots.skeleton({className})}
        data-slot="chat-loader-skeleton"
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <ChatLoaderSkeletonAvatar />
            <ChatLoaderSkeletonBlock>
              <ChatLoaderSkeletonLine />
              <ChatLoaderSkeletonLine />
              <ChatLoaderSkeletonLine />
            </ChatLoaderSkeletonBlock>
          </>
        )}
      </div>
    </ChatLoaderSkeletonContext>
  );
};

ChatLoaderSkeleton.displayName = "HeroUI.ChatLoader.Skeleton";

/* -------------------------------------------------------------------------------------------------
 * Skeleton Avatar
 * -----------------------------------------------------------------------------------------------*/
interface ChatLoaderSkeletonAvatarProps extends ComponentPropsWithRef<"div"> {
  /** Overrides the size inherited from `ChatLoader.Skeleton`. */
  size?: ChatLoaderSize;
}

const ChatLoaderSkeletonAvatar = ({className, size, ...rest}: ChatLoaderSkeletonAvatarProps) => {
  const slots = useSkeletonSlots(size);

  return (
    <div
      {...rest}
      className={slots.skeletonAvatar({className})}
      data-slot="chat-loader-skeleton-avatar"
    />
  );
};

ChatLoaderSkeletonAvatar.displayName = "HeroUI.ChatLoader.SkeletonAvatar";

/* -------------------------------------------------------------------------------------------------
 * Skeleton Block (column of lines)
 * -----------------------------------------------------------------------------------------------*/
interface ChatLoaderSkeletonBlockProps extends ComponentPropsWithRef<"div"> {}

const ChatLoaderSkeletonBlock = ({className, ...rest}: ChatLoaderSkeletonBlockProps) => {
  const {slots} = use(ChatLoaderSkeletonContext);

  return (
    <div
      {...rest}
      className={slots.skeletonBlock({className})}
      data-slot="chat-loader-skeleton-block"
    />
  );
};

ChatLoaderSkeletonBlock.displayName = "HeroUI.ChatLoader.SkeletonBlock";

/* -------------------------------------------------------------------------------------------------
 * Skeleton Line
 * -----------------------------------------------------------------------------------------------*/
interface ChatLoaderSkeletonLineProps extends ComponentPropsWithRef<"div"> {
  /** Overrides the size inherited from `ChatLoader.Skeleton`. */
  size?: ChatLoaderSize;
}

const ChatLoaderSkeletonLine = ({className, size, ...rest}: ChatLoaderSkeletonLineProps) => {
  const slots = useSkeletonSlots(size);

  return (
    <div
      {...rest}
      className={slots.skeletonLine({className})}
      data-slot="chat-loader-skeleton-line"
    />
  );
};

ChatLoaderSkeletonLine.displayName = "HeroUI.ChatLoader.SkeletonLine";

/* -------------------------------------------------------------------------------------------------
 * Deprecated loaders (Dots, Pulse, Spinner)
 *
 * Without a `label` they are decorative (`aria-hidden`). With one they become a `role="status"`
 * region that holds the label as visually hidden text, so it is announced exactly once.
 * -----------------------------------------------------------------------------------------------*/
interface ChatLoaderIndicatorProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /** Screen-reader status text. Omit it for a decorative loader. */
  label?: string;
  /** Loader size. @default "md" */
  size?: ChatLoaderSize;
}

function getStatusProps(label: string | undefined) {
  return label ? {role: "status" as const} : {"aria-hidden": true as const};
}

const ChatLoaderLabel = ({label, slots}: {label: string | undefined; slots: ChatLoaderSlots}) =>
  label ? (
    <span className={slots.label()} data-slot="chat-loader-label">
      {label}
    </span>
  ) : null;

/* Dots ----------------------------------------------------------------------------------------- */
interface ChatLoaderDotsProps extends ChatLoaderIndicatorProps {}

/** @deprecated Use `<Loader variant="dots" className="text-muted" />` instead. */
const ChatLoaderDots = ({className, label, size, ...rest}: ChatLoaderDotsProps) => {
  const slots = useMemo(() => chatLoaderVariants({size}), [size]);
  const name = label || undefined;

  return (
    <span
      {...getStatusProps(name)}
      {...rest}
      className={slots.dots({className})}
      data-slot="chat-loader-dots"
    >
      <span className={slots.dot()} data-slot="chat-loader-dot" />
      <span className={slots.dot()} data-slot="chat-loader-dot" />
      <span className={slots.dot()} data-slot="chat-loader-dot" />
      <ChatLoaderLabel label={name} slots={slots} />
    </span>
  );
};

ChatLoaderDots.displayName = "HeroUI.ChatLoader.Dots";

/* Pulse ---------------------------------------------------------------------------------------- */
interface ChatLoaderPulseProps extends ChatLoaderIndicatorProps {}

/** @deprecated Use `<Loader variant="pulse" />` instead. */
const ChatLoaderPulse = ({className, label, size, ...rest}: ChatLoaderPulseProps) => {
  const slots = useMemo(() => chatLoaderVariants({size}), [size]);
  const name = label || undefined;

  return (
    <span
      {...getStatusProps(name)}
      {...rest}
      className={slots.pulse({className})}
      data-slot="chat-loader-pulse"
    >
      <ChatLoaderLabel label={name} slots={slots} />
    </span>
  );
};

ChatLoaderPulse.displayName = "HeroUI.ChatLoader.Pulse";

/* Spinner (OSS Spinner: sm 16px, md 24px, lg 32px) -------------------------------------------- */
interface ChatLoaderSpinnerProps extends ChatLoaderIndicatorProps {}

/** @deprecated Use `<Loader variant="ring" />` instead (`size="md"` becomes `size="lg"`). */
const ChatLoaderSpinner = ({className, label, size, ...rest}: ChatLoaderSpinnerProps) => {
  const slots = useMemo(() => chatLoaderVariants({size}), [size]);
  const name = label || undefined;

  return (
    <span
      {...getStatusProps(name)}
      {...rest}
      className={slots.spinner({className})}
      data-slot="chat-loader-spinner"
    >
      {/* The wrapper owns the status; the OSS spinner's own status role stays hidden. */}
      <Spinner aria-hidden="true" color="accent" size={size ?? "md"} />
      <ChatLoaderLabel label={name} slots={slots} />
    </span>
  );
};

ChatLoaderSpinner.displayName = "HeroUI.ChatLoader.Spinner";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatLoaderSkeleton,
  ChatLoaderSkeletonAvatar,
  ChatLoaderSkeletonBlock,
  ChatLoaderSkeletonLine,
  ChatLoaderDots,
  ChatLoaderPulse,
  ChatLoaderSpinner,
  ChatLoaderSkeletonContext,
};

export type {
  ChatLoaderSize,
  ChatLoaderSkeletonProps,
  ChatLoaderSkeletonAvatarProps,
  ChatLoaderSkeletonBlockProps,
  ChatLoaderSkeletonLineProps,
  ChatLoaderDotsProps,
  ChatLoaderPulseProps,
  ChatLoaderSpinnerProps,
};
