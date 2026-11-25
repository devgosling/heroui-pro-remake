"use client";

import type {ChatListViewVariants} from "./chat-list-view.styles";
import type {ComponentPropsWithRef, ReactNode, Ref} from "react";
import type {
  GridListItemProps,
  GridListProps,
  GridListRenderProps,
} from "react-aria-components/GridList";

import {createContext, use, useCallback, useMemo} from "react";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {GridList, GridListItem} from "react-aria-components/GridList";

import {useResolvedClassName} from "../../utils";
import {ListViewContext, ListViewSelectionCell, listViewVariants} from "../list-view";

import {chatListViewVariants} from "./chat-list-view.styles";

type ChatListViewDensity = NonNullable<ChatListViewVariants["density"]>;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ChatListViewContext = {
  density: ChatListViewDensity;
  slots: ReturnType<typeof chatListViewVariants>;
};

const ChatListViewContext = createContext<ChatListViewContext>({
  density: "comfortable",
  slots: chatListViewVariants(),
});

/**
 * Chat List View is the List View `secondary` look, so the automatic selection cell (reused from
 * List View) must resolve the secondary slots and checkbox variant.
 */
const SECONDARY_LIST_VIEW_CONTEXT = {
  slots: listViewVariants({variant: "secondary"}),
  variant: "secondary" as const,
};

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewRootProps<T extends object = object>
  extends Omit<GridListProps<T>, "renderEmptyState">, ChatListViewVariants {
  ref?: Ref<HTMLDivElement>;
  /**
   * Row density. `comfortable` shows the title, the preview and the metadata; `compact` keeps
   * only the icon and the title for dense sidebars.
   * @default "comfortable"
   */
  density?: ChatListViewDensity;
  /** Content shown (centered) when the list has no conversations. */
  renderEmptyState?: (props: GridListRenderProps) => ReactNode;
}

function ChatListViewRoot<T extends object = object>({
  className,
  density = "comfortable",
  renderEmptyState,
  ...rest
}: ChatListViewRootProps<T>) {
  const slots = useMemo(() => chatListViewVariants({density}), [density]);
  const contextValue = useMemo(() => ({density, slots}), [density, slots]);
  const resolvedClassName = useResolvedClassName(className, slots.base());

  const emptyStateRenderer = useCallback(
    (renderProps: GridListRenderProps) => (
      <div className={slots.emptyState()} data-slot="chat-list-view-empty-state">
        {renderEmptyState?.(renderProps)}
      </div>
    ),
    [renderEmptyState, slots],
  );

  return (
    <ListViewContext value={SECONDARY_LIST_VIEW_CONTEXT}>
      <ChatListViewContext value={contextValue}>
        <GridList<T>
          {...rest}
          className={resolvedClassName}
          data-slot="chat-list-view"
          renderEmptyState={renderEmptyState ? emptyStateRenderer : undefined}
        />
      </ChatListViewContext>
    </ListViewContext>
  );
}

ChatListViewRoot.displayName = "HeroUI.ChatListView";

/* -------------------------------------------------------------------------------------------------
 * Item (thread row)
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewItemProps<T extends object = object> extends GridListItemProps<T> {
  ref?: Ref<HTMLDivElement>;
}

function ChatListViewItem<T extends object = object>({
  children,
  className,
  textValue,
  ...rest
}: ChatListViewItemProps<T>) {
  const {slots} = use(ChatListViewContext);
  const resolvedClassName = useResolvedClassName(className, slots.item());

  return (
    <GridListItem<T>
      {...rest}
      className={resolvedClassName}
      data-slot="chat-list-view-item"
      // Rows are composed from parts, so pass `textValue` for typeahead and the row's aria-label.
      textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    >
      {/* Same as List View rows: the selection checkbox is prepended while selection is enabled. */}
      {composeRenderProps(children, (resolvedChildren, {selectionMode}) => (
        <>
          {selectionMode === "none" ? null : <ListViewSelectionCell />}
          {resolvedChildren}
        </>
      ))}
    </GridListItem>
  );
}

ChatListViewItem.displayName = "HeroUI.ChatListView.Item";

/* -------------------------------------------------------------------------------------------------
 * Item Content
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewItemContentProps extends ComponentPropsWithRef<"div"> {}

const ChatListViewItemContent = ({className, ...rest}: ChatListViewItemContentProps) => {
  const {slots} = use(ChatListViewContext);

  return (
    <div
      className={slots.itemContent({className})}
      data-slot="chat-list-view-item-content"
      {...rest}
    />
  );
};

ChatListViewItemContent.displayName = "HeroUI.ChatListView.ItemContent";

/* -------------------------------------------------------------------------------------------------
 * Icon
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewIconProps extends ComponentPropsWithRef<"div"> {}

const ChatListViewIcon = ({className, ...rest}: ChatListViewIconProps) => {
  const {slots} = use(ChatListViewContext);

  return <div className={slots.icon({className})} data-slot="chat-list-view-icon" {...rest} />;
};

ChatListViewIcon.displayName = "HeroUI.ChatListView.Icon";

/* -------------------------------------------------------------------------------------------------
 * Text (title + preview column)
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewTextProps extends ComponentPropsWithRef<"div"> {}

const ChatListViewText = ({className, ...rest}: ChatListViewTextProps) => {
  const {slots} = use(ChatListViewContext);

  return <div className={slots.text({className})} data-slot="chat-list-view-text" {...rest} />;
};

ChatListViewText.displayName = "HeroUI.ChatListView.Text";

/* -------------------------------------------------------------------------------------------------
 * Title
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewTitleProps extends ComponentPropsWithRef<"span"> {}

const ChatListViewTitle = ({className, ...rest}: ChatListViewTitleProps) => {
  const {slots} = use(ChatListViewContext);

  return <span className={slots.title({className})} data-slot="chat-list-view-title" {...rest} />;
};

ChatListViewTitle.displayName = "HeroUI.ChatListView.Title";

/* -------------------------------------------------------------------------------------------------
 * Preview (last message / description)
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewPreviewProps extends ComponentPropsWithRef<"span"> {}

const ChatListViewPreview = ({className, ...rest}: ChatListViewPreviewProps) => {
  const {slots} = use(ChatListViewContext);

  return (
    <span className={slots.preview({className})} data-slot="chat-list-view-preview" {...rest} />
  );
};

ChatListViewPreview.displayName = "HeroUI.ChatListView.Preview";

/* -------------------------------------------------------------------------------------------------
 * Meta (date, unread count, ...)
 * -----------------------------------------------------------------------------------------------*/
interface ChatListViewMetaProps extends ComponentPropsWithRef<"div"> {}

const ChatListViewMeta = ({className, ...rest}: ChatListViewMetaProps) => {
  const {slots} = use(ChatListViewContext);

  return <div className={slots.meta({className})} data-slot="chat-list-view-meta" {...rest} />;
};

ChatListViewMeta.displayName = "HeroUI.ChatListView.Meta";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ChatListViewRoot,
  ChatListViewItem,
  ChatListViewItemContent,
  ChatListViewIcon,
  ChatListViewText,
  ChatListViewTitle,
  ChatListViewPreview,
  ChatListViewMeta,
  ChatListViewContext,
};

export type {
  ChatListViewDensity,
  ChatListViewRootProps,
  ChatListViewItemProps,
  ChatListViewItemContentProps,
  ChatListViewIconProps,
  ChatListViewTextProps,
  ChatListViewTitleProps,
  ChatListViewPreviewProps,
  ChatListViewMetaProps,
};
