"use client";

import type {ComponentPropsWithRef, ReactElement} from "react";

import {cloneElement, isValidElement} from "react";
import {cx} from "tailwind-variants";

import {chatMessageActionsVariants} from "./chat-message-actions.styles";

/*
 * Preset icon paths are taken from Gravity UI Icons (https://github.com/gravity-ui/icons),
 * MIT License, Copyright (c) 2022 YANDEX LLC: copy, check, thumbs-up, thumbs-down,
 * arrows-rotate-left and ellipsis (16x16 grid, single even-odd path each).
 */
const PATHS = {
  copied:
    "M13.488 3.43a.75.75 0 0 1 .081 1.058l-6 7a.75.75 0 0 1-1.1.042l-3.5-3.5A.75.75 0 0 1 4.03 6.97l2.928 2.927 5.473-6.385a.75.75 0 0 1 1.057-.081",
  copy: "M12 2.5H8A1.5 1.5 0 0 0 6.5 4v1H8a3 3 0 0 1 3 3v1.5h1A1.5 1.5 0 0 0 13.5 8V4A1.5 1.5 0 0 0 12 2.5M11 11h1a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v1H4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3zM4 6.5h4A1.5 1.5 0 0 1 9.5 8v4A1.5 1.5 0 0 1 8 13.5H4A1.5 1.5 0 0 1 2.5 12V8A1.5 1.5 0 0 1 4 6.5",
  menu: "M3 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0",
  regenerate:
    "M8 1.5a6.5 6.5 0 0 1 6.445 5.649.75.75 0 1 1-1.488.194A5.001 5.001 0 0 0 4.43 4.5h1.32a.75.75 0 0 1 0 1.5h-3A.75.75 0 0 1 2 5.25v-3a.75.75 0 1 1 1.5 0v1.06A6.48 6.48 0 0 1 8 1.5m5.25 13a.75.75 0 0 0 .75-.75v-3a.75.75 0 0 0-.75-.75h-3a.75.75 0 1 0 0 1.5h1.32a5.001 5.001 0 0 1-8.528-2.843.75.75 0 1 0-1.487.194 6.501 6.501 0 0 0 10.945 3.84v1.059c0 .414.336.75.75.75",
  "thumbs-down":
    "m12 9-2.94 5.041a1.932 1.932 0 0 1-3.56-1.378l.25-1.163.321-1.5h-2.94a2 2 0 0 1-1.927-2.535l.879-3.162A4 4 0 0 1 6.404 1.4L11.5 2zM6.229 2.89l3.863.455.379 5.3-2.708 4.64a.432.432 0 0 1-.796-.308l.571-2.663.389-1.814H3.13a.5.5 0 0 1-.482-.634l.879-3.162a2.5 2.5 0 0 1 2.7-1.814m7.023 5.663a.75.75 0 1 0 1.496-.106l-.5-7a.75.75 0 0 0-1.496.106z",
  "thumbs-up":
    "m4 7 2.94-5.041a1.932 1.932 0 0 1 3.56 1.378L10.25 4.5 9.93 6h2.94a2 2 0 0 1 1.927 2.535l-.879 3.162A4 4 0 0 1 9.596 14.6L4.5 14zm5.771 6.11-3.863-.455-.379-5.3 2.708-4.64a.432.432 0 0 1 .796.308l-.571 2.663L8.073 7.5h4.796a.5.5 0 0 1 .482.634l-.879 3.162a2.5 2.5 0 0 1-2.7 1.814M2.748 7.447a.75.75 0 1 0-1.496.106l.5 7a.75.75 0 0 0 1.496-.106z",
} as const;

type PresetIconName = keyof typeof PATHS;

const iconClassName = chatMessageActionsVariants().icon();

/* -------------------------------------------------------------------------------------------------
 * Preset icon factory
 * -----------------------------------------------------------------------------------------------*/
interface ChatMessageActionsIconProps extends Omit<ComponentPropsWithRef<"svg">, "children"> {
  /**
   * A custom icon element (usually an `<svg>`) that replaces the preset glyph. It keeps its own
   * props and receives the icon class and `data-slot`, so the swap stays styleable.
   */
  children?: ReactElement<{className?: string}>;
}

function createPresetIcon(name: PresetIconName, displayName: string) {
  const slot = `chat-message-actions-${name}-icon`;

  const PresetIcon = ({children, className, ...rest}: ChatMessageActionsIconProps) => {
    if (isValidElement<{className?: string}>(children)) {
      return cloneElement(children, {
        ...rest,
        className: cx(iconClassName, children.props.className, className),
        "data-slot": slot,
      } as Record<string, unknown>);
    }

    return (
      <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height="16"
        viewBox="0 0 16 16"
        width="16"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
        className={cx(iconClassName, className)}
        data-slot={slot}
      >
        <path clipRule="evenodd" d={PATHS[name]} fill="currentColor" fillRule="evenodd" />
      </svg>
    );
  };

  PresetIcon.displayName = displayName;

  return PresetIcon;
}

/* -------------------------------------------------------------------------------------------------
 * Preset icons
 * -----------------------------------------------------------------------------------------------*/
const ChatMessageActionsCopyIcon = createPresetIcon("copy", "HeroUI.ChatMessageActions.CopyIcon");

const ChatMessageActionsCopiedIcon = createPresetIcon(
  "copied",
  "HeroUI.ChatMessageActions.CopiedIcon",
);

const ChatMessageActionsThumbsUpIcon = createPresetIcon(
  "thumbs-up",
  "HeroUI.ChatMessageActions.ThumbsUpIcon",
);

const ChatMessageActionsThumbsDownIcon = createPresetIcon(
  "thumbs-down",
  "HeroUI.ChatMessageActions.ThumbsDownIcon",
);

const ChatMessageActionsRegenerateIcon = createPresetIcon(
  "regenerate",
  "HeroUI.ChatMessageActions.RegenerateIcon",
);

const ChatMessageActionsMenuIcon = createPresetIcon("menu", "HeroUI.ChatMessageActions.MenuIcon");

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatMessageActionsCopyIcon,
  ChatMessageActionsCopiedIcon,
  ChatMessageActionsThumbsUpIcon,
  ChatMessageActionsThumbsDownIcon,
  ChatMessageActionsRegenerateIcon,
  ChatMessageActionsMenuIcon,
};

export type {ChatMessageActionsIconProps};
