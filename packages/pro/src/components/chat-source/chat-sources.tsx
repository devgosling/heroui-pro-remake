"use client";

import type {
  DisclosureContentProps,
  DisclosureRootProps,
  DisclosureTriggerProps,
} from "@heroui/react";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {Disclosure} from "@heroui/react";
import {Children, createContext, use, useCallback, useMemo, useState} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {composeTwRenderProps} from "../../utils";

import {chatSourcesVariants} from "./chat-source.styles";

/* -------------------------------------------------------------------------------------------------
 * Chat Sources Context
 * -----------------------------------------------------------------------------------------------*/
type ChatSourcesContext = {
  slots: ReturnType<typeof chatSourcesVariants>;
};

const ChatSourcesContext = createContext<ChatSourcesContext | null>(null);

const defaultSlots = chatSourcesVariants();

const useChatSourcesSlots = () => use(ChatSourcesContext)?.slots ?? defaultSlots;

/* -------------------------------------------------------------------------------------------------
 * Chat Sources Root
 * -------------------------------------------------------------------------------------------------
 * A HeroUI Disclosure. Its panel opens and closes with `isExpanded`, `defaultExpanded` and
 * `onExpandedChange`; `ChatSources.List` independently shows or hides the extra sources.
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourcesRootProps extends DisclosureRootProps {}

const ChatSourcesRoot = ({className, ...rest}: ChatSourcesRootProps) => {
  const contextValue = useMemo<ChatSourcesContext>(() => ({slots: defaultSlots}), []);

  return (
    <ChatSourcesContext value={contextValue}>
      <Disclosure
        data-slot="chat-sources"
        {...rest}
        className={composeTwRenderProps(className, defaultSlots.base())}
      />
    </ChatSourcesContext>
  );
};

ChatSourcesRoot.displayName = "HeroUI.ChatSources";

/* -------------------------------------------------------------------------------------------------
 * Chat Sources Trigger
 * -------------------------------------------------------------------------------------------------
 * A button inside a heading (with `aria-expanded`), followed by the disclosure chevron.
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourcesTriggerProps extends DisclosureTriggerProps {}

const ChatSourcesTrigger = ({children, className, ...rest}: ChatSourcesTriggerProps) => {
  const slots = useChatSourcesSlots();

  return (
    <Disclosure.Heading>
      <Disclosure.Trigger
        data-slot="chat-sources-trigger"
        {...rest}
        className={composeTwRenderProps(className, slots.trigger())}
      >
        {(renderProps) => (
          <>
            <span className={slots.triggerLabel()} data-slot="chat-sources-trigger-label">
              {typeof children === "function" ? children(renderProps) : children}
            </span>
            <Disclosure.Indicator className={slots.indicator()} />
          </>
        )}
      </Disclosure.Trigger>
    </Disclosure.Heading>
  );
};

ChatSourcesTrigger.displayName = "HeroUI.ChatSources.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Chat Sources Content
 * -----------------------------------------------------------------------------------------------*/
interface ChatSourcesContentProps extends DisclosureContentProps {}

const ChatSourcesContent = ({children, className, ...rest}: ChatSourcesContentProps) => {
  const slots = useChatSourcesSlots();

  return (
    <Disclosure.Content
      data-slot="chat-sources-content"
      {...rest}
      className={composeTwRenderProps(className, slots.content())}
    >
      <Disclosure.Body>
        <div className={slots.contentBody()} data-slot="chat-sources-content-body">
          {children as ReactNode}
        </div>
      </Disclosure.Body>
    </Disclosure.Content>
  );
};

ChatSourcesContent.displayName = "HeroUI.ChatSources.Content";

/* -------------------------------------------------------------------------------------------------
 * Chat Sources List
 * -------------------------------------------------------------------------------------------------
 * A wrapping row of sources. With `maxVisible` it shows the first sources and a "+N more" chip that
 * reveals the rest and turns into "Show less". The visible chips keep their keys while the list
 * toggles, so they stay mounted (focus and open previews survive).
 * -----------------------------------------------------------------------------------------------*/
type ChatSourcesToggleState = {
  /** Number of sources beyond `maxVisible`. */
  hiddenCount: number;
  /** Whether every source shows. */
  showAll: boolean;
};

interface ChatSourcesListProps extends ComponentPropsWithRef<"div"> {
  /** Shows this many sources, then a "+N more" chip. Rounded down; values below 0 count as 0. */
  maxVisible?: number;
  /** Whether every source shows at first. @default false */
  defaultShowAll?: boolean;
  /** Whether every source shows (controlled). */
  showAll?: boolean;
  /** Called when the chip toggles the list. */
  onShowAllChange?: (showAll: boolean) => void;
  /** Label of the chip; it is also the chip's accessible name. @default "+N more" / "Show less" */
  renderToggle?: (state: ChatSourcesToggleState) => ReactNode;
}

const ChatSourcesList = ({
  children,
  className,
  defaultShowAll = false,
  maxVisible,
  onShowAllChange,
  renderToggle,
  showAll: showAllProp,
  ...rest
}: ChatSourcesListProps) => {
  const slots = useChatSourcesSlots();
  const [uncontrolledShowAll, setUncontrolledShowAll] = useState(defaultShowAll);
  const showAll = showAllProp ?? uncontrolledShowAll;

  const setShowAll = useCallback(
    (next: boolean) => {
      if (showAllProp === undefined) setUncontrolledShowAll(next);
      onShowAllChange?.(next);
    },
    [onShowAllChange, showAllProp],
  );

  const items = Children.toArray(children);
  const limit =
    maxVisible === undefined || Number.isNaN(maxVisible)
      ? items.length
      : Math.max(0, Math.floor(maxVisible));
  const hiddenCount = Math.max(0, items.length - limit);
  const visibleItems = showAll || hiddenCount === 0 ? items : items.slice(0, limit);

  const toggleLabel = renderToggle ? (
    renderToggle({hiddenCount, showAll})
  ) : showAll ? (
    "Show less"
  ) : (
    <>
      +{hiddenCount} more
      <span className={slots.toggleHiddenText()}> sources</span>
    </>
  );

  return (
    <div {...rest} className={slots.list({className})} data-slot="chat-sources-list">
      {visibleItems}
      {hiddenCount > 0 ? (
        <ButtonPrimitive
          aria-expanded={showAll}
          className={slots.toggle()}
          data-slot="chat-sources-toggle"
          onPress={() => setShowAll(!showAll)}
        >
          {toggleLabel}
        </ButtonPrimitive>
      ) : null}
    </div>
  );
};

ChatSourcesList.displayName = "HeroUI.ChatSources.List";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatSourcesRoot,
  ChatSourcesTrigger,
  ChatSourcesContent,
  ChatSourcesList,
  ChatSourcesContext,
};

export type {
  ChatSourcesRootProps,
  ChatSourcesTriggerProps,
  ChatSourcesContentProps,
  ChatSourcesListProps,
  ChatSourcesToggleState,
};
