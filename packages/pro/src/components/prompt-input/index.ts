import type {ComponentProps} from "react";

import {
  PromptInputAction,
  PromptInputAttachments,
  PromptInputContent,
  PromptInputFooter,
  PromptInputRoot,
  PromptInputSend,
  PromptInputShell,
  PromptInputTextArea,
  PromptInputToolbar,
  PromptInputToolbarEnd,
  PromptInputToolbarStart,
} from "./prompt-input";
import {
  PromptInputQueueItem,
  PromptInputQueueItemAction,
  PromptInputQueueItemActions,
  PromptInputQueueItemAttachments,
  PromptInputQueueItemAttachmentsOverflow,
  PromptInputQueueItemBody,
  PromptInputQueueItemContent,
  PromptInputQueueItemDescription,
  PromptInputQueueItemHandle,
  PromptInputQueueItemIcon,
  PromptInputQueueItemMore,
  PromptInputQueueItemRemove,
  PromptInputQueueList,
  PromptInputQueueRoot,
} from "./prompt-input-queue";
import {
  PromptInputToken,
  PromptInputTokenInput,
  PromptInputTokenSuggestions,
  PromptInputTokens,
} from "./prompt-input-tokens";

/* -------------------------------------------------------------------------------------------------
 * Compound Components
 * -----------------------------------------------------------------------------------------------*/
const PromptInputQueueItemCompound = Object.assign(PromptInputQueueItem, {
  Action: PromptInputQueueItemAction,
  Actions: PromptInputQueueItemActions,
  Attachments: PromptInputQueueItemAttachments,
  AttachmentsOverflow: PromptInputQueueItemAttachmentsOverflow,
  Body: PromptInputQueueItemBody,
  Content: PromptInputQueueItemContent,
  Description: PromptInputQueueItemDescription,
  Handle: PromptInputQueueItemHandle,
  Icon: PromptInputQueueItemIcon,
  More: PromptInputQueueItemMore,
  Remove: PromptInputQueueItemRemove,
});

export const PromptInputQueue = Object.assign(PromptInputQueueRoot, {
  Item: PromptInputQueueItemCompound,
  List: PromptInputQueueList,
  Root: PromptInputQueueRoot,
});

export const PromptInput = Object.assign(PromptInputRoot, {
  Action: PromptInputAction,
  Attachments: PromptInputAttachments,
  Content: PromptInputContent,
  Footer: PromptInputFooter,
  Queue: PromptInputQueue,
  Root: PromptInputRoot,
  Send: PromptInputSend,
  Shell: PromptInputShell,
  TextArea: PromptInputTextArea,
  Token: PromptInputToken,
  TokenInput: PromptInputTokenInput,
  TokenSuggestions: PromptInputTokenSuggestions,
  Tokens: PromptInputTokens,
  Toolbar: PromptInputToolbar,
  ToolbarEnd: PromptInputToolbarEnd,
  ToolbarStart: PromptInputToolbarStart,
});

export type PromptInput = {
  Props: ComponentProps<typeof PromptInputRoot>;
  RootProps: ComponentProps<typeof PromptInputRoot>;
  ShellProps: ComponentProps<typeof PromptInputShell>;
  ContentProps: ComponentProps<typeof PromptInputContent>;
  AttachmentsProps: ComponentProps<typeof PromptInputAttachments>;
  TextAreaProps: ComponentProps<typeof PromptInputTextArea>;
  TokenInputProps: ComponentProps<typeof PromptInputTokenInput>;
  TokensProps: ComponentProps<typeof PromptInputTokens>;
  TokenSuggestionsProps: ComponentProps<typeof PromptInputTokenSuggestions>;
  TokenProps: ComponentProps<typeof PromptInputToken>;
  ToolbarProps: ComponentProps<typeof PromptInputToolbar>;
  ToolbarStartProps: ComponentProps<typeof PromptInputToolbarStart>;
  ToolbarEndProps: ComponentProps<typeof PromptInputToolbarEnd>;
  ActionProps: ComponentProps<typeof PromptInputAction>;
  SendProps: ComponentProps<typeof PromptInputSend>;
  FooterProps: ComponentProps<typeof PromptInputFooter>;
  QueueProps: ComponentProps<typeof PromptInputQueueRoot>;
  QueueListProps: ComponentProps<typeof PromptInputQueueList>;
  QueueItemProps: ComponentProps<typeof PromptInputQueueItem>;
  QueueItemHandleProps: ComponentProps<typeof PromptInputQueueItemHandle>;
  QueueItemBodyProps: ComponentProps<typeof PromptInputQueueItemBody>;
  QueueItemIconProps: ComponentProps<typeof PromptInputQueueItemIcon>;
  QueueItemContentProps: ComponentProps<typeof PromptInputQueueItemContent>;
  QueueItemDescriptionProps: ComponentProps<typeof PromptInputQueueItemDescription>;
  QueueItemAttachmentsProps: ComponentProps<typeof PromptInputQueueItemAttachments>;
  QueueItemAttachmentsOverflowProps: ComponentProps<typeof PromptInputQueueItemAttachmentsOverflow>;
  QueueItemActionsProps: ComponentProps<typeof PromptInputQueueItemActions>;
  QueueItemRemoveProps: ComponentProps<typeof PromptInputQueueItemRemove>;
  QueueItemMoreProps: ComponentProps<typeof PromptInputQueueItemMore>;
  QueueItemActionProps: ComponentProps<typeof PromptInputQueueItemAction>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  PromptInputRoot,
  PromptInputShell,
  PromptInputContent,
  PromptInputAttachments,
  PromptInputTextArea,
  PromptInputToolbar,
  PromptInputToolbarStart,
  PromptInputToolbarEnd,
  PromptInputAction,
  PromptInputSend,
  PromptInputFooter,
} from "./prompt-input";

export {
  PromptInputQueueRoot,
  PromptInputQueueList,
  PromptInputQueueItem,
  PromptInputQueueItemHandle,
  PromptInputQueueItemBody,
  PromptInputQueueItemIcon,
  PromptInputQueueItemContent,
  PromptInputQueueItemDescription,
  PromptInputQueueItemAttachments,
  PromptInputQueueItemAttachmentsOverflow,
  PromptInputQueueItemActions,
  PromptInputQueueItemRemove,
  PromptInputQueueItemMore,
  PromptInputQueueItemAction,
} from "./prompt-input-queue";

export {
  PromptInputTokens,
  PromptInputToken,
  PromptInputTokenInput,
  PromptInputTokenSuggestions,
  TokenFieldValue,
} from "./prompt-input-tokens";

export {usePromptInputTokens} from "./use-prompt-input-tokens";

export {PromptInputContext} from "./prompt-input-context";

export type {
  PromptInputRootProps,
  PromptInputRootProps as PromptInputProps,
  PromptInputShellProps,
  PromptInputContentProps,
  PromptInputAttachmentsProps,
  PromptInputTextAreaProps,
  PromptInputToolbarProps,
  PromptInputToolbarStartProps,
  PromptInputToolbarEndProps,
  PromptInputActionProps,
  PromptInputSendProps,
  PromptInputFooterProps,
} from "./prompt-input";

export type {
  PromptInputQueueProps,
  PromptInputQueueListProps,
  PromptInputQueueItemProps,
  PromptInputQueueItemHandleProps,
  PromptInputQueueItemBodyProps,
  PromptInputQueueItemIconProps,
  PromptInputQueueItemContentProps,
  PromptInputQueueItemDescriptionProps,
  PromptInputQueueItemAttachmentsProps,
  PromptInputQueueItemAttachmentsOverflowProps,
  PromptInputQueueItemActionsProps,
  PromptInputQueueItemRemoveProps,
  PromptInputQueueItemMoreProps,
  PromptInputQueueItemActionProps,
} from "./prompt-input-queue";

export type {
  UsePromptInputTokensOptions,
  PromptInputTokenInsertOptions,
  PromptInputTokenState,
} from "./use-prompt-input-tokens";

export type {
  PromptInputTokensProps,
  PromptInputTokenProps,
  PromptInputTokenInputProps,
  PromptInputTokenSuggestionsProps,
} from "./prompt-input-tokens";

export type {
  PromptInputContextValue,
  PromptInputLayout,
  PromptInputSize,
  PromptInputStatus,
  PromptInputVariant,
} from "./prompt-input-context";

export type {
  Position as TokenFieldPosition,
  TokenFieldSegment,
  TokenSegment,
} from "react-aria-components/TokenField";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  promptInputVariants,
  promptInputQueueVariants,
  type PromptInputVariants,
} from "./prompt-input.styles";
