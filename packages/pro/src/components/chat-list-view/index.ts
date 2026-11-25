import type {ComponentProps} from "react";

import {
  ChatListViewIcon,
  ChatListViewItem,
  ChatListViewItemContent,
  ChatListViewMeta,
  ChatListViewPreview,
  ChatListViewRoot,
  ChatListViewText,
  ChatListViewTitle,
} from "./chat-list-view";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ChatListView = Object.assign(ChatListViewRoot, {
  Icon: ChatListViewIcon,
  Item: ChatListViewItem,
  ItemContent: ChatListViewItemContent,
  Meta: ChatListViewMeta,
  Preview: ChatListViewPreview,
  Root: ChatListViewRoot,
  Text: ChatListViewText,
  Title: ChatListViewTitle,
});

export type ChatListView = {
  Props: ComponentProps<typeof ChatListViewRoot>;
  RootProps: ComponentProps<typeof ChatListViewRoot>;
  ItemProps: ComponentProps<typeof ChatListViewItem>;
  ItemContentProps: ComponentProps<typeof ChatListViewItemContent>;
  IconProps: ComponentProps<typeof ChatListViewIcon>;
  TextProps: ComponentProps<typeof ChatListViewText>;
  TitleProps: ComponentProps<typeof ChatListViewTitle>;
  PreviewProps: ComponentProps<typeof ChatListViewPreview>;
  MetaProps: ComponentProps<typeof ChatListViewMeta>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./chat-list-view";

export type {
  ChatListViewDensity,
  ChatListViewRootProps,
  ChatListViewRootProps as ChatListViewProps,
  ChatListViewItemProps,
  ChatListViewItemContentProps,
  ChatListViewIconProps,
  ChatListViewTextProps,
  ChatListViewTitleProps,
  ChatListViewPreviewProps,
  ChatListViewMetaProps,
} from "./chat-list-view";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {chatListViewVariants, type ChatListViewVariants} from "./chat-list-view.styles";
