import type {ComponentProps} from "react";

import {
  ChatLoaderDots,
  ChatLoaderPulse,
  ChatLoaderSkeleton,
  ChatLoaderSkeletonAvatar,
  ChatLoaderSkeletonBlock,
  ChatLoaderSkeletonLine,
  ChatLoaderSpinner,
} from "./chat-loader";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 *
 * Chat Loader has no root element: it is a namespace of parts. `Skeleton` and its primitives are the
 * current API; `Dots`, `Pulse` and `Spinner` are deprecated in favour of `Loader`.
 * -----------------------------------------------------------------------------------------------*/
export const ChatLoader = {
  /** @deprecated Use `<Loader variant="dots" className="text-muted" />` instead. */
  Dots: ChatLoaderDots,
  /** @deprecated Use `<Loader variant="pulse" />` instead. */
  Pulse: ChatLoaderPulse,
  Skeleton: ChatLoaderSkeleton,
  SkeletonAvatar: ChatLoaderSkeletonAvatar,
  SkeletonBlock: ChatLoaderSkeletonBlock,
  SkeletonLine: ChatLoaderSkeletonLine,
  /** @deprecated Use `<Loader variant="ring" />` instead (`size="md"` becomes `size="lg"`). */
  Spinner: ChatLoaderSpinner,
};

export type ChatLoader = {
  SkeletonProps: ComponentProps<typeof ChatLoaderSkeleton>;
  SkeletonAvatarProps: ComponentProps<typeof ChatLoaderSkeletonAvatar>;
  SkeletonBlockProps: ComponentProps<typeof ChatLoaderSkeletonBlock>;
  SkeletonLineProps: ComponentProps<typeof ChatLoaderSkeletonLine>;
  DotsProps: ComponentProps<typeof ChatLoaderDots>;
  PulseProps: ComponentProps<typeof ChatLoaderPulse>;
  SpinnerProps: ComponentProps<typeof ChatLoaderSpinner>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./chat-loader";

export type {
  ChatLoaderSize,
  ChatLoaderSkeletonProps,
  ChatLoaderSkeletonAvatarProps,
  ChatLoaderSkeletonBlockProps,
  ChatLoaderSkeletonLineProps,
  ChatLoaderDotsProps,
  ChatLoaderPulseProps,
  ChatLoaderSpinnerProps,
} from "./chat-loader";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {chatLoaderVariants, type ChatLoaderVariants} from "./chat-loader.styles";
