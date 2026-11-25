import type {ComponentProps} from "react";

import {
  ChatToolApproval,
  ChatToolApprovalActions,
  ChatToolArgs,
  ChatToolContent,
  ChatToolError,
  ChatToolMeta,
  ChatToolResult,
  ChatToolRoot,
  ChatToolStatusIcon,
  ChatToolTrigger,
} from "./chat-tool";
import {ChatToolGroupContent, ChatToolGroupRoot, ChatToolGroupTrigger} from "./chat-tool-group";

/* -------------------------------------------------------------------------------------------------
 * Compound Components
 * Subpath-only export (`@heroui/pro/chat-tool`): Args / Result render a CodeBlock, which depends on
 * the optional `shiki` peer.
 * -----------------------------------------------------------------------------------------------*/
export const ChatTool = Object.assign(ChatToolRoot, {
  Approval: ChatToolApproval,
  ApprovalActions: ChatToolApprovalActions,
  Args: ChatToolArgs,
  Content: ChatToolContent,
  Error: ChatToolError,
  Meta: ChatToolMeta,
  Result: ChatToolResult,
  Root: ChatToolRoot,
  StatusIcon: ChatToolStatusIcon,
  Trigger: ChatToolTrigger,
});

export type ChatTool = {
  Props: ComponentProps<typeof ChatToolRoot>;
  RootProps: ComponentProps<typeof ChatToolRoot>;
  TriggerProps: ComponentProps<typeof ChatToolTrigger>;
  StatusIconProps: ComponentProps<typeof ChatToolStatusIcon>;
  ContentProps: ComponentProps<typeof ChatToolContent>;
  ArgsProps: ComponentProps<typeof ChatToolArgs>;
  ResultProps: ComponentProps<typeof ChatToolResult>;
  ErrorProps: ComponentProps<typeof ChatToolError>;
  ApprovalProps: ComponentProps<typeof ChatToolApproval>;
  ApprovalActionsProps: ComponentProps<typeof ChatToolApprovalActions>;
  MetaProps: ComponentProps<typeof ChatToolMeta>;
};

export const ChatToolGroup = Object.assign(ChatToolGroupRoot, {
  Content: ChatToolGroupContent,
  Root: ChatToolGroupRoot,
  Trigger: ChatToolGroupTrigger,
});

export type ChatToolGroup = {
  Props: ComponentProps<typeof ChatToolGroupRoot>;
  RootProps: ComponentProps<typeof ChatToolGroupRoot>;
  TriggerProps: ComponentProps<typeof ChatToolGroupTrigger>;
  ContentProps: ComponentProps<typeof ChatToolGroupContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatToolRoot,
  ChatToolTrigger,
  ChatToolStatusIcon,
  ChatToolContent,
  ChatToolArgs,
  ChatToolResult,
  ChatToolError,
  ChatToolApproval,
  ChatToolApprovalActions,
  ChatToolMeta,
  ChatToolContext,
} from "./chat-tool";

export {ChatToolGroupRoot, ChatToolGroupTrigger, ChatToolGroupContent} from "./chat-tool-group";

export type {
  ChatToolState,
  ChatToolRootProps,
  ChatToolRootProps as ChatToolProps,
  ChatToolTriggerProps,
  ChatToolStatusIconProps,
  ChatToolContentProps,
  ChatToolArgsProps,
  ChatToolResultProps,
  ChatToolErrorProps,
  ChatToolApprovalProps,
  ChatToolApprovalActionsProps,
  ChatToolMetaProps,
} from "./chat-tool";

export type {
  ChatToolGroupRootProps,
  ChatToolGroupRootProps as ChatToolGroupProps,
  ChatToolGroupTriggerProps,
  ChatToolGroupContentProps,
} from "./chat-tool-group";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  chatToolVariants,
  chatToolGroupVariants,
  type ChatToolVariants,
  type ChatToolGroupVariants,
} from "./chat-tool.styles";
