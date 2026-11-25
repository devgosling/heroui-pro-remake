"use client";

import type {
  DisclosureContentProps,
  DisclosureRootProps,
  DisclosureTriggerProps,
} from "@heroui/react";
import type {ReactNode} from "react";

import {Disclosure} from "@heroui/react";

import {composeTwRenderProps} from "../../utils";

import {chatToolGroupVariants} from "./chat-tool.styles";

// The group has no variants, so every instance can share the slot functions.
const slots = chatToolGroupVariants();

/* -------------------------------------------------------------------------------------------------
 * Root
 * OSS Disclosure root that wraps consecutive ChatTool cards.
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolGroupRootProps extends DisclosureRootProps {}

const ChatToolGroupRoot = ({className, ...rest}: ChatToolGroupRootProps) => (
  <Disclosure
    data-slot="chat-tool-group"
    {...rest}
    className={composeTwRenderProps(className, slots.base())}
  />
);

ChatToolGroupRoot.displayName = "HeroUI.ChatToolGroup";

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolGroupTriggerProps extends Omit<DisclosureTriggerProps, "children"> {
  children?: ReactNode;
}

const ChatToolGroupTrigger = ({children, className, ...rest}: ChatToolGroupTriggerProps) => (
  <Disclosure.Heading>
    <Disclosure.Trigger
      data-slot="chat-tool-group-trigger"
      {...rest}
      className={composeTwRenderProps(className, slots.trigger())}
    >
      <span className={slots.triggerLabel()}>{children}</span>
      <Disclosure.Indicator className={slots.indicator()} />
    </Disclosure.Trigger>
  </Disclosure.Heading>
);

ChatToolGroupTrigger.displayName = "HeroUI.ChatToolGroup.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolGroupContentProps extends Omit<DisclosureContentProps, "children"> {
  children?: ReactNode;
}

const ChatToolGroupContent = ({children, className, ...rest}: ChatToolGroupContentProps) => (
  <Disclosure.Content
    data-slot="chat-tool-group-content"
    {...rest}
    className={composeTwRenderProps(className, slots.content())}
  >
    <Disclosure.Body>
      <div className={slots.contentBody()}>{children}</div>
    </Disclosure.Body>
  </Disclosure.Content>
);

ChatToolGroupContent.displayName = "HeroUI.ChatToolGroup.Content";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ChatToolGroupRoot, ChatToolGroupTrigger, ChatToolGroupContent};

export type {ChatToolGroupRootProps, ChatToolGroupTriggerProps, ChatToolGroupContentProps};
