"use client";

import type {
  DisclosureContentProps,
  DisclosureRootProps,
  DisclosureTriggerProps,
} from "@heroui/react";
import type {ComponentPropsWithRef, ReactElement, ReactNode} from "react";

import {Button, Disclosure} from "@heroui/react";
import {Children, Fragment, cloneElement, createContext, isValidElement, use, useMemo} from "react";
import {cx} from "tailwind-variants";

import {composeTwRenderProps} from "../../utils";
import {CodeBlock} from "../code-block";
import {TextShimmer} from "../text-shimmer";

import {
  ChatToolCompleteIcon,
  ChatToolErrorIcon,
  ChatToolRequiresActionIcon,
  ChatToolRunningIcon,
} from "./chat-tool-icons";
import {chatToolVariants} from "./chat-tool.styles";

/* -------------------------------------------------------------------------------------------------
 * Types & constants
 * -----------------------------------------------------------------------------------------------*/
type ChatToolState =
  "input-streaming" | "input-available" | "output-available" | "output-error" | "requires-action";

/** Label rendered before the tool name in preset mode. */
const DEFAULT_TRIGGER_PREFIX: Record<ChatToolState, string> = {
  "input-available": "Running tool:",
  "input-streaming": "Running tool:",
  "output-available": "Used tool:",
  "output-error": "Failed tool:",
  "requires-action": "Approval needed:",
};

/** States whose card starts open when `defaultExpanded` is not given. */
const OPEN_BY_DEFAULT = new Set<ChatToolState>([
  "input-streaming",
  "input-available",
  "output-error",
  "requires-action",
]);

const isActiveState = (state?: ChatToolState) =>
  state === "input-streaming" || state === "input-available";

/**
 * Serialises a tool payload for the JSON code block. Strings are shown as they are (partial JSON
 * while streaming, plain text results); everything else goes through `JSON.stringify`.
 */
function formatPayload(value: unknown, space?: number): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, space) ?? String(value);
  } catch {
    // Circular structures, BigInt ...
    return String(value);
  }
}

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ChatToolContext = {
  isActive: boolean;
  isExpandable: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  slots: ReturnType<typeof chatToolVariants>;
  state?: ChatToolState;
  toolName?: string;
};

const ChatToolContext = createContext<ChatToolContext>({
  isActive: false,
  isExpandable: true,
  slots: chatToolVariants(),
});

/* -------------------------------------------------------------------------------------------------
 * Trigger
 * OSS Disclosure.Heading + Disclosure.Trigger. The children sit in `.chat-tool__trigger-label`
 * (wrapped in a Text Shimmer while the tool is streaming or running) and the chevron is only
 * rendered when the card has something to expand; otherwise the trigger is disabled.
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolTriggerProps extends Omit<DisclosureTriggerProps, "children"> {
  children?: ReactNode;
}

const ChatToolTrigger = ({children, className, isDisabled, ...rest}: ChatToolTriggerProps) => {
  const {isActive, isExpandable, slots} = use(ChatToolContext);

  return (
    <Disclosure.Heading>
      <Disclosure.Trigger
        data-expandable={isExpandable ? undefined : "false"}
        data-slot="chat-tool-trigger"
        isDisabled={isExpandable ? isDisabled : true}
        {...rest}
        className={composeTwRenderProps(className, slots.trigger())}
      >
        <span className={slots.triggerLabel()}>
          {isActive ? <TextShimmer>{children}</TextShimmer> : children}
        </span>
        {isExpandable ? <Disclosure.Indicator className={slots.indicator()} /> : null}
      </Disclosure.Trigger>
    </Disclosure.Heading>
  );
};

ChatToolTrigger.displayName = "HeroUI.ChatTool.Trigger";

/* -------------------------------------------------------------------------------------------------
 * StatusIcon
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolStatusIconProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /** Custom icon element. It receives the `.chat-tool__status-icon` classes of the current state. */
  children?: ReactElement<{className?: string}>;
  /** Overrides the state of the surrounding ChatTool. */
  state?: ChatToolState;
}

const DefaultStatusIcon = ({state, ...props}: {className: string; state?: ChatToolState}) => {
  const iconProps = {...props, "data-slot": "chat-tool-status-icon"};

  switch (state) {
    case "output-available":
      return <ChatToolCompleteIcon {...iconProps} />;
    case "output-error":
      return <ChatToolErrorIcon {...iconProps} />;
    case "requires-action":
      return <ChatToolRequiresActionIcon {...iconProps} />;
    default:
      return <ChatToolRunningIcon {...iconProps} />;
  }
};

const ChatToolStatusIcon = ({
  children,
  className,
  state: stateProp,
  ...rest
}: ChatToolStatusIconProps) => {
  const context = use(ChatToolContext);
  const state = stateProp ?? context.state;
  const iconClassName =
    stateProp === undefined ? context.slots.statusIcon() : chatToolVariants({state}).statusIcon();

  return (
    <span className={context.slots.status({className})} data-slot="chat-tool-status" {...rest}>
      {isValidElement(children) ? (
        cloneElement(children as ReactElement<{className?: string; "data-slot"?: string}>, {
          className: cx(iconClassName, children.props.className),
          "data-slot": "chat-tool-status-icon",
        })
      ) : (
        <DefaultStatusIcon className={iconClassName} state={state} />
      )}
    </span>
  );
};

ChatToolStatusIcon.displayName = "HeroUI.ChatTool.StatusIcon";

/* -------------------------------------------------------------------------------------------------
 * Content
 * OSS Disclosure.Content + Disclosure.Body, with the padded `.chat-tool__content-body` column.
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolContentProps extends Omit<DisclosureContentProps, "children"> {
  children?: ReactNode;
}

const ChatToolContent = ({children, className, ...rest}: ChatToolContentProps) => {
  const {slots} = use(ChatToolContext);

  return (
    <Disclosure.Content
      data-slot="chat-tool-content"
      {...rest}
      className={composeTwRenderProps(className, slots.content())}
    >
      <Disclosure.Body>
        <div className={slots.contentBody()}>{children}</div>
      </Disclosure.Body>
    </Disclosure.Content>
  );
};

ChatToolContent.displayName = "HeroUI.ChatTool.Content";

/* -------------------------------------------------------------------------------------------------
 * Args / Result (JSON code blocks)
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolArgsProps extends ComponentPropsWithRef<"div"> {
  /** Tool input, rendered as indented JSON. */
  input?: unknown;
  /** Preformatted input text (e.g. partial JSON while streaming). Wins over `input`. */
  argsText?: string;
  /** Section label rendered above the code (uppercase, muted). */
  label?: ReactNode;
  /** Shiki language of the code block. */
  language?: string;
}

const ChatToolArgs = ({
  argsText,
  children,
  className,
  input,
  label,
  language = "json",
  ...rest
}: ChatToolArgsProps) => {
  const {slots} = use(ChatToolContext);
  const code = argsText ?? formatPayload(input, 2);

  return (
    <div className={slots.args({className})} data-slot="chat-tool-args" {...rest}>
      {label != null ? <div className={slots.argsLabel()}>{label}</div> : null}
      {children ??
        (code ? (
          <CodeBlock>
            <CodeBlock.Code code={code} language={language} />
          </CodeBlock>
        ) : null)}
    </div>
  );
};

ChatToolArgs.displayName = "HeroUI.ChatTool.Args";

interface ChatToolResultProps extends ComponentPropsWithRef<"div"> {
  /** Tool output, rendered as indented JSON (strings are shown as they are). */
  value?: unknown;
  /** Section label rendered above the code (uppercase, muted). */
  label?: ReactNode;
  /** Shiki language of the code block. */
  language?: string;
}

const ChatToolResult = ({
  children,
  className,
  label,
  language = "json",
  value,
  ...rest
}: ChatToolResultProps) => {
  const {slots} = use(ChatToolContext);
  const code = formatPayload(value, 2);

  return (
    <div className={slots.result({className})} data-slot="chat-tool-result" {...rest}>
      {label != null ? <div className={slots.resultLabel()}>{label}</div> : null}
      {children ??
        (code ? (
          <CodeBlock>
            <CodeBlock.Code code={code} language={language} />
          </CodeBlock>
        ) : null)}
    </div>
  );
};

ChatToolResult.displayName = "HeroUI.ChatTool.Result";

/* -------------------------------------------------------------------------------------------------
 * Error
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolErrorProps extends ComponentPropsWithRef<"div"> {
  /** Error details. */
  errorText?: string;
  /** Section label rendered above the error (uppercase, muted). */
  label?: ReactNode;
}

const ChatToolError = ({children, className, errorText, label, ...rest}: ChatToolErrorProps) => {
  const {slots} = use(ChatToolContext);

  return (
    <div className={slots.error({className})} data-slot="chat-tool-error" {...rest}>
      {label != null ? <div className={slots.errorLabel()}>{label}</div> : null}
      {children ?? errorText}
    </div>
  );
};

ChatToolError.displayName = "HeroUI.ChatTool.Error";

/* -------------------------------------------------------------------------------------------------
 * Approval
 * Only rendered while the tool waits for confirmation (`requires-action`, or outside a stated card).
 * Without children it renders the preset Reject (secondary) / Approve (primary) actions.
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolApprovalActionsProps extends ComponentPropsWithRef<"div"> {}

const ChatToolApprovalActions = ({className, ...rest}: ChatToolApprovalActionsProps) => {
  const {slots} = use(ChatToolContext);

  return (
    <div
      className={slots.approvalActions({className})}
      data-slot="chat-tool-approval-actions"
      {...rest}
    />
  );
};

ChatToolApprovalActions.displayName = "HeroUI.ChatTool.ApprovalActions";

interface ChatToolApprovalProps extends ComponentPropsWithRef<"div"> {
  /** Called by the preset approve action. Defaults to the ChatTool `onApprove`. */
  onApprove?: () => void;
  /** Called by the preset reject action. Defaults to the ChatTool `onReject`. */
  onReject?: () => void;
  /** Label of the preset approve action. */
  approveLabel?: ReactNode;
  /** Label of the preset reject action. */
  rejectLabel?: ReactNode;
}

const ChatToolApproval = ({
  approveLabel = "Approve",
  children,
  className,
  onApprove,
  onReject,
  rejectLabel = "Reject",
  ...rest
}: ChatToolApprovalProps) => {
  const context = use(ChatToolContext);

  if (context.state !== undefined && context.state !== "requires-action") return null;

  const handleApprove = onApprove ?? context.onApprove;
  const handleReject = onReject ?? context.onReject;

  return (
    <div className={context.slots.approval({className})} data-slot="chat-tool-approval" {...rest}>
      {children ?? (
        <ChatToolApprovalActions>
          <Button
            data-slot="chat-tool-reject"
            size="sm"
            variant="secondary"
            onPress={() => handleReject?.()}
          >
            {rejectLabel}
          </Button>
          <Button
            data-slot="chat-tool-approve"
            size="sm"
            variant="primary"
            onPress={() => handleApprove?.()}
          >
            {approveLabel}
          </Button>
        </ChatToolApprovalActions>
      )}
    </div>
  );
};

ChatToolApproval.displayName = "HeroUI.ChatTool.Approval";

/* -------------------------------------------------------------------------------------------------
 * Meta (tool call id row)
 * -----------------------------------------------------------------------------------------------*/
interface ChatToolMetaProps extends ComponentPropsWithRef<"div"> {}

const ChatToolMeta = ({className, ...rest}: ChatToolMetaProps) => {
  const {slots} = use(ChatToolContext);

  return <div className={slots.meta({className})} data-slot="chat-tool-meta" {...rest} />;
};

ChatToolMeta.displayName = "HeroUI.ChatTool.Meta";

/* -------------------------------------------------------------------------------------------------
 * Root
 * OSS Disclosure root. Without children it renders the preset card (status icon + prefixed tool
 * name, then args / result / error / approval / meta from the data props).
 * -----------------------------------------------------------------------------------------------*/
/** True when `children` holds a ChatTool.Content (directly or inside fragments). */
function hasContentChild(children: ReactNode): boolean {
  let found = false;

  Children.forEach(children, (child) => {
    if (found || !isValidElement(child)) return;
    if (child.type === ChatToolContent) {
      found = true;
    } else if (child.type === Fragment) {
      found = hasContentChild((child.props as {children?: ReactNode}).children);
    }
  });

  return found;
}

interface ChatToolRootProps extends Omit<DisclosureRootProps, "children"> {
  /** Custom trigger / content. Leave empty to render the preset card from the data props. */
  children?: ReactNode;
  /** Tool display name. */
  toolName?: string;
  /** Tool state. */
  state?: ChatToolState;
  /** Label rendered before `toolName` in preset mode (defaults to a label for the state). */
  triggerPrefix?: ReactNode;
  /** Tool input rendered as JSON in preset mode. */
  input?: unknown;
  /** Tool output rendered as JSON in preset mode. */
  output?: unknown;
  /** Preformatted tool input text, useful while streaming partial JSON. */
  argsText?: string;
  /** Error details rendered for the `output-error` state. */
  errorText?: string;
  /** Called by the preset approval action in `requires-action` state. */
  onApprove?: () => void;
  /** Called by the preset rejection action in `requires-action` state. */
  onReject?: () => void;
  /** Label of the preset approve action. */
  approveLabel?: ReactNode;
  /** Label of the preset reject action. */
  rejectLabel?: ReactNode;
  /** Tool call id, rendered in a meta row at the end of the preset content. */
  toolCallId?: string;
  /** Overrides whether the card can expand (inferred from the data / a ChatTool.Content child). */
  isExpandable?: boolean;
}

const ChatToolRoot = ({
  approveLabel,
  argsText,
  children,
  className,
  defaultExpanded,
  errorText,
  input,
  isExpandable: isExpandableProp,
  onApprove,
  onReject,
  output,
  rejectLabel,
  state,
  toolCallId,
  toolName,
  triggerPrefix,
  ...rest
}: ChatToolRootProps) => {
  const isPreset = children === undefined || children === null;

  const hasArgs = argsText !== undefined || input !== undefined;
  const hasResult = output !== undefined;
  const hasError = state === "output-error" && Boolean(errorText);
  const hasApproval = state === "requires-action";
  const hasMeta = Boolean(toolCallId);

  const isExpandable =
    isExpandableProp ??
    (isPreset
      ? hasArgs || hasResult || hasError || hasApproval || hasMeta
      : hasContentChild(children));
  const isActive = isActiveState(state);

  const slots = useMemo(() => chatToolVariants({state}), [state]);
  const contextValue = useMemo<ChatToolContext>(
    () => ({isActive, isExpandable, onApprove, onReject, slots, state, toolName}),
    [isActive, isExpandable, onApprove, onReject, slots, state, toolName],
  );

  const prefix = triggerPrefix ?? (state ? DEFAULT_TRIGGER_PREFIX[state] : null);

  return (
    <ChatToolContext value={contextValue}>
      <Disclosure
        data-active={isActive ? "true" : undefined}
        data-expandable={isExpandable ? "true" : undefined}
        data-slot="chat-tool"
        data-state={state}
        defaultExpanded={defaultExpanded ?? (state ? OPEN_BY_DEFAULT.has(state) : false)}
        {...rest}
        className={composeTwRenderProps(className, slots.base())}
      >
        {isPreset ? (
          <>
            <ChatToolTrigger>
              <ChatToolStatusIcon />
              <span className={slots.triggerLabel()}>
                {prefix}
                {prefix != null && toolName ? " " : null}
                {toolName ? <span className={slots.triggerName()}>{toolName}</span> : null}
              </span>
            </ChatToolTrigger>
            {isExpandable ? (
              <ChatToolContent>
                {hasArgs ? <ChatToolArgs argsText={argsText ?? formatPayload(input)} /> : null}
                {hasResult ? <ChatToolResult value={output} /> : null}
                {hasError ? <ChatToolError errorText={errorText} /> : null}
                {hasApproval ? (
                  <ChatToolApproval approveLabel={approveLabel} rejectLabel={rejectLabel} />
                ) : null}
                {hasMeta ? <ChatToolMeta>{toolCallId}</ChatToolMeta> : null}
              </ChatToolContent>
            ) : null}
          </>
        ) : (
          children
        )}
      </Disclosure>
    </ChatToolContext>
  );
};

ChatToolRoot.displayName = "HeroUI.ChatTool";

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  ChatToolState,
  ChatToolRootProps,
  ChatToolTriggerProps,
  ChatToolStatusIconProps,
  ChatToolContentProps,
  ChatToolArgsProps,
  ChatToolResultProps,
  ChatToolErrorProps,
  ChatToolApprovalProps,
  ChatToolApprovalActionsProps,
  ChatToolMetaProps,
};
