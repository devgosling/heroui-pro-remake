"use client";

import type {ComponentPropsWithRef, ReactNode} from "react";

import {Button, Tooltip} from "@heroui/react";
import {useCallback, useEffect, useRef, useState} from "react";

import {composeTwRenderProps} from "../../utils";

import {
  ChatMessageActionsCopiedIcon,
  ChatMessageActionsCopyIcon,
  ChatMessageActionsMenuIcon,
  ChatMessageActionsRegenerateIcon,
  ChatMessageActionsThumbsDownIcon,
  ChatMessageActionsThumbsUpIcon,
} from "./chat-message-actions-icons";
import {chatMessageActionsVariants} from "./chat-message-actions.styles";

/** The parts carry no variants, so every part resolves its classes from one static set. */
const slots = chatMessageActionsVariants();

/** How long the copy preset shows its "copied" check before it swaps back (ms). */
const COPIED_DURATION = 2000;

/** Length of the copy / copied icon swap; matches the CSS keyframes (ms). */
const ICON_SWAP_DURATION = 300;

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageActionsRootProps extends ComponentPropsWithRef<"div"> {}

const ChatMessageActionsRoot = ({className, ...rest}: ChatMessageActionsRootProps) => (
  <div className={slots.base({className})} data-slot="chat-message-actions" {...rest} />
);

ChatMessageActionsRoot.displayName = "HeroUI.ChatMessageActions";

/* -------------------------------------------------------------------------------------------------
 * Action (OSS icon-only ghost Button, optionally wrapped in an OSS Tooltip)
 * -----------------------------------------------------------------------------------------------*/
type ButtonProps = ComponentPropsWithRef<typeof Button>;

interface ChatMessageActionsActionProps extends ButtonProps {
  /** Tooltip shown on hover and focus. Usually the same text as `aria-label`. */
  tooltip?: ReactNode;
}

const ChatMessageActionsAction = ({
  className,
  isIconOnly = true,
  size = "sm",
  tooltip,
  variant = "ghost",
  ...rest
}: ChatMessageActionsActionProps) => {
  const button = (
    <Button
      data-slot="chat-message-action"
      {...rest}
      className={composeTwRenderProps(className, slots.action())}
      isIconOnly={isIconOnly}
      size={size}
      variant={variant}
    />
  );

  if (tooltip === undefined || tooltip === null || tooltip === false) return button;

  // Icon actions are small and sit next to each other, so the label shows without the usual
  // warm-up delay. The close delay keeps the OSS default.
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger>{button}</Tooltip.Trigger>
      <Tooltip.Content>{tooltip}</Tooltip.Content>
    </Tooltip>
  );
};

ChatMessageActionsAction.displayName = "HeroUI.ChatMessageActions.Action";

/* -------------------------------------------------------------------------------------------------
 * Preset actions (default icon + default accessible name)
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageActionsPresetProps extends ChatMessageActionsActionProps {}

// Each preset is declared as its own component (rather than built by a factory) so Fast Refresh
// can tell that this module only exports components.
const ChatMessageActionsThumbsUp = ({
  "aria-label": ariaLabel = "Good response",
  children,
  ...rest
}: ChatMessageActionsPresetProps) => (
  <ChatMessageActionsAction aria-label={ariaLabel} {...rest}>
    {children ?? <ChatMessageActionsThumbsUpIcon />}
  </ChatMessageActionsAction>
);

ChatMessageActionsThumbsUp.displayName = "HeroUI.ChatMessageActions.ThumbsUp";

const ChatMessageActionsThumbsDown = ({
  "aria-label": ariaLabel = "Bad response",
  children,
  ...rest
}: ChatMessageActionsPresetProps) => (
  <ChatMessageActionsAction aria-label={ariaLabel} {...rest}>
    {children ?? <ChatMessageActionsThumbsDownIcon />}
  </ChatMessageActionsAction>
);

ChatMessageActionsThumbsDown.displayName = "HeroUI.ChatMessageActions.ThumbsDown";

const ChatMessageActionsRegenerate = ({
  "aria-label": ariaLabel = "Regenerate",
  children,
  ...rest
}: ChatMessageActionsPresetProps) => (
  <ChatMessageActionsAction aria-label={ariaLabel} {...rest}>
    {children ?? <ChatMessageActionsRegenerateIcon />}
  </ChatMessageActionsAction>
);

ChatMessageActionsRegenerate.displayName = "HeroUI.ChatMessageActions.Regenerate";

const ChatMessageActionsMore = ({
  "aria-label": ariaLabel = "More actions",
  children,
  ...rest
}: ChatMessageActionsPresetProps) => (
  <ChatMessageActionsAction aria-label={ariaLabel} {...rest}>
    {children ?? <ChatMessageActionsMenuIcon />}
  </ChatMessageActionsAction>
);

ChatMessageActionsMore.displayName = "HeroUI.ChatMessageActions.More";

/* -------------------------------------------------------------------------------------------------
 * Copy icon swap (blur + scale cross-fade between the copy and the copied icon)
 * -----------------------------------------------------------------------------------------------*/
type IconLayer = {
  id: number;
  isCopied: boolean;
  phase: "idle" | "entering" | "exiting";
};

interface CopyIconSwapProps {
  copiedIcon: ReactNode;
  icon: ReactNode;
  isCopied: boolean;
}

const CopyIconSwap = ({copiedIcon, icon, isCopied}: CopyIconSwapProps) => {
  const [layers, setLayers] = useState<IconLayer[]>(() => [{id: 0, isCopied, phase: "idle"}]);
  const [shownCopied, setShownCopied] = useState(isCopied);

  // Derive the layers while rendering: the outgoing icon stays mounted (absolutely positioned) for
  // the exit animation and the incoming one animates in. The first render never animates.
  if (shownCopied !== isCopied) {
    setShownCopied(isCopied);
    setLayers((current) => {
      const nextId = (current[current.length - 1]?.id ?? 0) + 1;
      const outgoing = current
        .filter((layer) => layer.phase !== "exiting")
        .map((layer) => ({...layer, phase: "exiting" as const}));

      return [...outgoing, {id: nextId, isCopied, phase: "entering"}];
    });
  }

  const isAnimating = layers.some((layer) => layer.phase !== "idle");

  useEffect(() => {
    if (!isAnimating) return;

    const timeout = setTimeout(() => {
      setLayers((current) =>
        current
          .filter((layer) => layer.phase !== "exiting")
          .map((layer) => ({...layer, phase: "idle" as const})),
      );
    }, ICON_SWAP_DURATION);

    return () => clearTimeout(timeout);
  }, [isAnimating, layers]);

  return layers.map((layer) => (
    <span
      key={layer.id}
      className={slots.copyIconMotion()}
      data-entering={layer.phase === "entering" || undefined}
      data-exiting={layer.phase === "exiting" || undefined}
      data-slot="chat-message-actions-copy-icon-motion"
    >
      {layer.isCopied ? copiedIcon : icon}
    </span>
  ));
};

/* -------------------------------------------------------------------------------------------------
 * Copy (preset action with a copied state)
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageActionsCopyProps extends Omit<
  ChatMessageActionsActionProps,
  "children" | "value"
> {
  /**
   * Text written to the clipboard on press. Pass a function to read it lazily (for example
   * from a streamed message). Without it the action only shows its copied state, so you can
   * copy in `onCopy` / `onPress` yourself.
   */
  value?: string | (() => string);
  /** Called after a press, with the copied text when `value` is set. */
  onCopy?: (value: string | undefined) => void;
  /** How long the copied icon stays visible, in milliseconds. @default 2000 */
  copiedDuration?: number;
  /** Icon shown at rest. @default <ChatMessageActions.CopyIcon /> */
  children?: ReactNode;
  /** Icon shown after copying. @default <ChatMessageActions.CopiedIcon /> */
  copiedIcon?: ReactNode;
}

const ChatMessageActionsCopy = ({
  "aria-label": ariaLabel = "Copy",
  children,
  copiedDuration = COPIED_DURATION,
  copiedIcon,
  onCopy,
  onPress,
  value,
  ...rest
}: ChatMessageActionsCopyProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const timeouts = timeoutRef;

    return () => clearTimeout(timeouts.current);
  }, []);

  const handlePress = useCallback<NonNullable<ButtonProps["onPress"]>>(
    (event) => {
      onPress?.(event);

      const text = typeof value === "function" ? value() : value;

      if (text !== undefined && typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {
          // Clipboard access can be denied (insecure context, permissions); the copied state is
          // still shown so the press gives feedback, and `onCopy` lets the app handle it.
        });
      }

      onCopy?.(text);
      setIsCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsCopied(false), copiedDuration);
    },
    [copiedDuration, onCopy, onPress, value],
  );

  return (
    <ChatMessageActionsAction aria-label={ariaLabel} onPress={handlePress} {...rest}>
      <CopyIconSwap
        copiedIcon={copiedIcon ?? <ChatMessageActionsCopiedIcon />}
        icon={children ?? <ChatMessageActionsCopyIcon />}
        isCopied={isCopied}
      />
    </ChatMessageActionsAction>
  );
};

ChatMessageActionsCopy.displayName = "HeroUI.ChatMessageActions.Copy";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatMessageActionsRoot,
  ChatMessageActionsAction,
  ChatMessageActionsCopy,
  ChatMessageActionsThumbsUp,
  ChatMessageActionsThumbsDown,
  ChatMessageActionsRegenerate,
  ChatMessageActionsMore,
};

export type {
  ChatMessageActionsRootProps,
  ChatMessageActionsActionProps,
  ChatMessageActionsPresetProps,
  ChatMessageActionsCopyProps,
};
