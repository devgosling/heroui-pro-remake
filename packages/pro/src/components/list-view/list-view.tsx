"use client";

import type {ListViewVariants} from "./list-view.styles";
import type {ComponentPropsWithRef, ReactNode, Ref} from "react";
import type {
  GridListItemProps,
  GridListLoadMoreItemProps,
  GridListProps,
  GridListRenderProps,
} from "react-aria-components/GridList";

import {Checkbox, Spinner} from "@heroui/react";
import {createContext, use, useCallback, useMemo} from "react";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {GridList, GridListItem, GridListLoadMoreItem} from "react-aria-components/GridList";
import {ListLayout, Virtualizer} from "react-aria-components/Virtualizer";

import {useResolvedClassName} from "../../utils";

import {listViewVariants} from "./list-view.styles";

type ListViewVariant = NonNullable<ListViewVariants["variant"]>;

/** Inset of the primary tray (`p-1`), applied by the virtual layout when `virtualized` is on. */
const VIRTUAL_TRAY_PADDING = 4;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type ListViewContext = {
  slots: ReturnType<typeof listViewVariants>;
  variant: ListViewVariant;
};

const ListViewContext = createContext<ListViewContext>({
  slots: listViewVariants(),
  variant: "primary",
});

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface ListViewRootProps<T extends object = object>
  extends Omit<GridListProps<T>, "renderEmptyState">, ListViewVariants {
  ref?: Ref<HTMLDivElement>;
  /**
   * Visual variant. `primary` is a gray tray with white surface rows forming a card; `secondary`
   * has no tray and transparent rows divided by hairlines.
   * @default "primary"
   */
  variant?: ListViewVariant;
  /** Content shown (centered) when the list has no items. */
  renderEmptyState?: (props: GridListRenderProps) => ReactNode;
  /**
   * Render only the visible rows (React Aria `Virtualizer` + `ListLayout`). Give the list a
   * height and `overflow-auto`, or let the page scroll.
   * @default false
   */
  virtualized?: boolean;
  /**
   * Estimated row height in pixels used by the virtualizer.
   * @default 48
   */
  rowHeight?: number;
}

function ListViewRoot<T extends object = object>({
  className,
  renderEmptyState,
  rowHeight = 48,
  variant = "primary",
  virtualized = false,
  ...rest
}: ListViewRootProps<T>) {
  const slots = useMemo(() => listViewVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots, variant}), [slots, variant]);
  const resolvedClassName = useResolvedClassName(className, slots.base());
  // Virtual rows are positioned in JS, so the tray inset moves from CSS padding into the layout.
  const layoutOptions = useMemo(
    () => ({
      estimatedRowHeight: rowHeight,
      padding: variant === "primary" ? VIRTUAL_TRAY_PADDING : 0,
    }),
    [rowHeight, variant],
  );

  const emptyStateRenderer = useCallback(
    (renderProps: GridListRenderProps) => (
      <div className={slots.emptyState()} data-slot="list-view-empty-state">
        {renderEmptyState?.(renderProps)}
      </div>
    ),
    [renderEmptyState, slots],
  );

  const list = (
    <GridList<T>
      {...rest}
      className={resolvedClassName}
      data-slot="list-view"
      data-virtualized={virtualized ? "true" : undefined}
      renderEmptyState={renderEmptyState ? emptyStateRenderer : undefined}
    />
  );

  return (
    <ListViewContext value={contextValue}>
      {virtualized ? (
        <Virtualizer layout={ListLayout} layoutOptions={layoutOptions}>
          {list}
        </Virtualizer>
      ) : (
        list
      )}
    </ListViewContext>
  );
}

ListViewRoot.displayName = "HeroUI.ListView";

/* -------------------------------------------------------------------------------------------------
 * Selection cell (rendered automatically inside every item while selection is enabled)
 * -----------------------------------------------------------------------------------------------*/
interface ListViewSelectionCellProps extends ComponentPropsWithRef<"div"> {}

const ListViewSelectionCell = ({className, ...rest}: ListViewSelectionCellProps) => {
  const {slots, variant} = use(ListViewContext);

  return (
    <div
      className={slots.selectionCell({className})}
      data-slot="list-view-selection-cell"
      {...rest}
    >
      {/* GridListItem wires the `selection` slot (aria-label "Select", toggle, disabled state). */}
      <Checkbox slot="selection" variant={variant === "secondary" ? "primary" : "secondary"}>
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>
    </div>
  );
};

ListViewSelectionCell.displayName = "HeroUI.ListView.SelectionCell";

/* -------------------------------------------------------------------------------------------------
 * Item
 * -----------------------------------------------------------------------------------------------*/
interface ListViewItemProps<T extends object = object> extends GridListItemProps<T> {
  ref?: Ref<HTMLDivElement>;
}

function ListViewItem<T extends object = object>({
  children,
  className,
  textValue,
  ...rest
}: ListViewItemProps<T>) {
  const {slots} = use(ListViewContext);
  const resolvedClassName = useResolvedClassName(className, slots.item());

  return (
    <GridListItem<T>
      {...rest}
      className={resolvedClassName}
      data-slot="list-view-item"
      // Children are always wrapped in a function below, so keep the plain-string typeahead value.
      textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    >
      {composeRenderProps(children, (resolvedChildren, {selectionMode}) => (
        <>
          {selectionMode === "none" ? null : <ListViewSelectionCell />}
          {resolvedChildren}
        </>
      ))}
    </GridListItem>
  );
}

ListViewItem.displayName = "HeroUI.ListView.Item";

/* -------------------------------------------------------------------------------------------------
 * Item Content
 * -----------------------------------------------------------------------------------------------*/
interface ListViewItemContentProps extends ComponentPropsWithRef<"div"> {}

const ListViewItemContent = ({className, ...rest}: ListViewItemContentProps) => {
  const {slots} = use(ListViewContext);

  return (
    <div className={slots.itemContent({className})} data-slot="list-view-item-content" {...rest} />
  );
};

ListViewItemContent.displayName = "HeroUI.ListView.ItemContent";

/* -------------------------------------------------------------------------------------------------
 * Title
 * -----------------------------------------------------------------------------------------------*/
interface ListViewTitleProps extends ComponentPropsWithRef<"span"> {}

const ListViewTitle = ({className, ...rest}: ListViewTitleProps) => {
  const {slots} = use(ListViewContext);

  return <span className={slots.title({className})} data-slot="list-view-title" {...rest} />;
};

ListViewTitle.displayName = "HeroUI.ListView.Title";

/* -------------------------------------------------------------------------------------------------
 * Description
 * -----------------------------------------------------------------------------------------------*/
interface ListViewDescriptionProps extends ComponentPropsWithRef<"span"> {}

const ListViewDescription = ({className, ...rest}: ListViewDescriptionProps) => {
  const {slots} = use(ListViewContext);

  return (
    <span className={slots.description({className})} data-slot="list-view-description" {...rest} />
  );
};

ListViewDescription.displayName = "HeroUI.ListView.Description";

/* -------------------------------------------------------------------------------------------------
 * Item Action
 * -----------------------------------------------------------------------------------------------*/
interface ListViewItemActionProps extends ComponentPropsWithRef<"div"> {}

const ListViewItemAction = ({className, ...rest}: ListViewItemActionProps) => {
  const {slots} = use(ListViewContext);

  return (
    <div className={slots.itemAction({className})} data-slot="list-view-item-action" {...rest} />
  );
};

ListViewItemAction.displayName = "HeroUI.ListView.ItemAction";

/* -------------------------------------------------------------------------------------------------
 * Load More (infinite scrolling sentinel + loading row)
 * -----------------------------------------------------------------------------------------------*/
interface ListViewLoadMoreProps extends GridListLoadMoreItemProps {
  ref?: Ref<HTMLDivElement>;
}

const ListViewLoadMore = ({children, className, ...rest}: ListViewLoadMoreProps) => {
  const {slots} = use(ListViewContext);

  return (
    <GridListLoadMoreItem
      {...rest}
      className={slots.loadMore({className})}
      data-slot="list-view-load-more"
    >
      {children ?? <Spinner size="sm" />}
    </GridListLoadMoreItem>
  );
};

ListViewLoadMore.displayName = "HeroUI.ListView.LoadMore";

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  ListViewVariant,
  ListViewRootProps,
  ListViewItemProps,
  ListViewItemContentProps,
  ListViewTitleProps,
  ListViewDescriptionProps,
  ListViewItemActionProps,
  ListViewSelectionCellProps,
  ListViewLoadMoreProps,
};
