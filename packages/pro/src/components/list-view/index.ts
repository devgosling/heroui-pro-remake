import type {ComponentProps} from "react";

import {
  ListViewDescription,
  ListViewItem,
  ListViewItemAction,
  ListViewItemContent,
  ListViewLoadMore,
  ListViewRoot,
  ListViewTitle,
} from "./list-view";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListView = Object.assign(ListViewRoot, {
  Description: ListViewDescription,
  Item: ListViewItem,
  ItemAction: ListViewItemAction,
  ItemContent: ListViewItemContent,
  LoadMore: ListViewLoadMore,
  Root: ListViewRoot,
  Title: ListViewTitle,
});

export type ListView = {
  Props: ComponentProps<typeof ListViewRoot>;
  RootProps: ComponentProps<typeof ListViewRoot>;
  ItemProps: ComponentProps<typeof ListViewItem>;
  ItemContentProps: ComponentProps<typeof ListViewItemContent>;
  TitleProps: ComponentProps<typeof ListViewTitle>;
  DescriptionProps: ComponentProps<typeof ListViewDescription>;
  ItemActionProps: ComponentProps<typeof ListViewItemAction>;
  LoadMoreProps: ComponentProps<typeof ListViewLoadMore>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ListViewRoot,
  ListViewItem,
  ListViewItemContent,
  ListViewTitle,
  ListViewDescription,
  ListViewItemAction,
  ListViewSelectionCell,
  ListViewLoadMore,
  ListViewContext,
} from "./list-view";

export type {
  ListViewVariant,
  ListViewRootProps,
  ListViewRootProps as ListViewProps,
  ListViewItemProps,
  ListViewItemContentProps,
  ListViewTitleProps,
  ListViewDescriptionProps,
  ListViewItemActionProps,
  ListViewSelectionCellProps,
  ListViewLoadMoreProps,
} from "./list-view";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listViewVariants, type ListViewVariants} from "./list-view.styles";
