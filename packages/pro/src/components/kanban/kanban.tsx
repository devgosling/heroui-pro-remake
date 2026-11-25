"use client";

import type {KanbanVariants} from "./kanban.styles";
import type {ScrollShadowProps} from "@heroui/react";
import type {CSSProperties, ComponentPropsWithRef, ReactNode, Ref} from "react";
import type {ButtonProps as ButtonPrimitiveProps} from "react-aria-components/Button";
import type {
  GridListItemProps as GridListItemPrimitiveProps,
  GridListProps as GridListPrimitiveProps,
  GridListRenderProps,
} from "react-aria-components/GridList";
import type {DropIndicatorProps as DropIndicatorPrimitiveProps} from "react-aria-components/useDragAndDrop";

import {ScrollShadow} from "@heroui/react";
import {createContext, use, useCallback, useMemo, useRef} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {GridList, GridListItem} from "react-aria-components/GridList";
import {DropIndicator as DropIndicatorPrimitive} from "react-aria-components/useDragAndDrop";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {KanbanLayoutAnimation} from "./kanban-layout-animation";
import {kanbanVariants} from "./kanban.styles";

type KanbanSize = NonNullable<KanbanVariants["size"]>;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type KanbanContext = {
  size: KanbanSize;
  slots: ReturnType<typeof kanbanVariants>;
};

const KanbanContext = createContext<KanbanContext>({size: "md", slots: kanbanVariants()});

/* -------------------------------------------------------------------------------------------------
 * Root (horizontal OSS ScrollShadow)
 * -----------------------------------------------------------------------------------------------*/
interface KanbanRootProps extends Omit<ScrollShadowProps, "size"> {
  /**
   * Size of the board: column width, column gap, card padding and card font size.
   * @default "md"
   */
  size?: KanbanSize;
}

const KanbanRoot = ({className, size = "md", ...rest}: KanbanRootProps) => {
  const slots = useMemo(() => kanbanVariants({size}), [size]);
  const contextValue = useMemo(() => ({size, slots}), [size, slots]);

  return (
    <KanbanContext value={contextValue}>
      <ScrollShadow
        orientation="horizontal"
        {...rest}
        className={slots.base({className})}
        data-slot="kanban"
      />
    </KanbanContext>
  );
};

KanbanRoot.displayName = "HeroUI.Kanban";

/* -------------------------------------------------------------------------------------------------
 * Column
 * -----------------------------------------------------------------------------------------------*/
interface KanbanColumnProps extends ComponentPropsWithRef<"section"> {}

const KanbanColumn = ({className, ...rest}: KanbanColumnProps) => {
  const {slots} = use(KanbanContext);

  return <section className={slots.column({className})} data-slot="kanban-column" {...rest} />;
};

KanbanColumn.displayName = "HeroUI.Kanban.Column";

/* -------------------------------------------------------------------------------------------------
 * Column body (rounded tinted container for the card list and footer actions)
 * -----------------------------------------------------------------------------------------------*/
interface KanbanColumnBodyProps extends ComponentPropsWithRef<"div"> {}

const KanbanColumnBody = ({className, ...rest}: KanbanColumnBodyProps) => {
  const {slots} = use(KanbanContext);

  return <div className={slots.columnBody({className})} data-slot="kanban-column-body" {...rest} />;
};

KanbanColumnBody.displayName = "HeroUI.Kanban.ColumnBody";

/* -------------------------------------------------------------------------------------------------
 * Column header parts
 * -----------------------------------------------------------------------------------------------*/
interface KanbanColumnHeaderProps extends ComponentPropsWithRef<"header"> {}

const KanbanColumnHeader = ({className, ...rest}: KanbanColumnHeaderProps) => {
  const {slots} = use(KanbanContext);

  return (
    <header
      className={slots.columnHeader({className})}
      data-slot="kanban-column-header"
      {...rest}
    />
  );
};

KanbanColumnHeader.displayName = "HeroUI.Kanban.ColumnHeader";

interface KanbanColumnActionsProps extends ComponentPropsWithRef<"div"> {}

const KanbanColumnActions = ({className, ...rest}: KanbanColumnActionsProps) => {
  const {slots} = use(KanbanContext);

  return (
    <div className={slots.columnActions({className})} data-slot="kanban-column-actions" {...rest} />
  );
};

KanbanColumnActions.displayName = "HeroUI.Kanban.ColumnActions";

interface KanbanColumnIndicatorProps extends ComponentPropsWithRef<"span"> {}

/** A status dot when empty, an icon container when it has children. */
const KanbanColumnIndicator = ({className, ...rest}: KanbanColumnIndicatorProps) => {
  const {slots} = use(KanbanContext);

  return (
    <span
      className={slots.columnIndicator({className})}
      data-slot="kanban-column-indicator"
      {...rest}
    />
  );
};

KanbanColumnIndicator.displayName = "HeroUI.Kanban.ColumnIndicator";

interface KanbanColumnTitleProps extends ComponentPropsWithRef<"h3"> {}

const KanbanColumnTitle = ({children, className, ...rest}: KanbanColumnTitleProps) => {
  const {slots} = use(KanbanContext);

  return (
    <h3 className={slots.columnTitle({className})} data-slot="kanban-column-title" {...rest}>
      {children}
    </h3>
  );
};

KanbanColumnTitle.displayName = "HeroUI.Kanban.ColumnTitle";

interface KanbanColumnCountProps extends ComponentPropsWithRef<"span"> {}

const KanbanColumnCount = ({className, ...rest}: KanbanColumnCountProps) => {
  const {slots} = use(KanbanContext);

  return (
    <span className={slots.columnCount({className})} data-slot="kanban-column-count" {...rest} />
  );
};

KanbanColumnCount.displayName = "HeroUI.Kanban.ColumnCount";

/* -------------------------------------------------------------------------------------------------
 * Scroll shadow (vertical OSS ScrollShadow for height-constrained columns)
 * -----------------------------------------------------------------------------------------------*/
interface KanbanScrollShadowProps extends ScrollShadowProps {}

const KanbanScrollShadow = ({className, ...rest}: KanbanScrollShadowProps) => {
  const {slots} = use(KanbanContext);

  return (
    <ScrollShadow
      orientation="vertical"
      {...rest}
      className={slots.scrollShadow({className})}
      data-slot="kanban-scroll-shadow"
    />
  );
};

KanbanScrollShadow.displayName = "HeroUI.Kanban.ScrollShadow";

/* -------------------------------------------------------------------------------------------------
 * Card list (RAC GridList)
 * -----------------------------------------------------------------------------------------------*/
interface KanbanCardListProps<T extends object> extends GridListPrimitiveProps<T> {
  ref?: Ref<HTMLDivElement>;
  /** Content shown (centred, muted) when the column has no cards. */
  renderEmptyState?: (props: GridListRenderProps) => ReactNode;
}

const KanbanCardList = <T extends object>({
  className,
  renderEmptyState,
  selectionMode = "none",
  ...rest
}: KanbanCardListProps<T>) => {
  const {slots} = use(KanbanContext);
  const resolvedClassName = useResolvedClassName(className, slots.cardList());

  const emptyState = useCallback(
    (props: GridListRenderProps) => (
      <div className={slots.empty()} data-slot="kanban-empty">
        {renderEmptyState?.(props)}
      </div>
    ),
    [renderEmptyState, slots],
  );

  return (
    <GridList<T>
      {...rest}
      className={resolvedClassName}
      data-slot="kanban-card-list"
      renderEmptyState={renderEmptyState ? emptyState : undefined}
      selectionMode={selectionMode}
    />
  );
};

KanbanCardList.displayName = "HeroUI.Kanban.CardList";

/* -------------------------------------------------------------------------------------------------
 * Card (RAC GridListItem + animated content box)
 * -----------------------------------------------------------------------------------------------*/
interface KanbanCardProps<T extends object = object> extends GridListItemPrimitiveProps<T> {
  ref?: Ref<HTMLDivElement>;
}

const KanbanCard = <T extends object = object>({
  children,
  className,
  ref,
  ...rest
}: KanbanCardProps<T>) => {
  const {slots} = use(KanbanContext);
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rowRef);
  const resolvedClassName = useResolvedClassName(className, slots.card());

  return (
    <GridListItem<T>
      {...rest}
      ref={mergedRef}
      className={resolvedClassName}
      data-slot="kanban-card"
    >
      {/* A render function so the content (and its layout animation) re-renders whenever RAC
          re-renders the row, e.g. when the drop target moves. */}
      {(renderProps) => (
        <KanbanLayoutAnimation layoutRef={rowRef} targetRef={contentRef}>
          <div ref={contentRef} className={slots.cardContent()} data-slot="kanban-card-content">
            {typeof children === "function" ? children(renderProps) : children}
          </div>
        </KanbanLayoutAnimation>
      )}
    </GridListItem>
  );
};

KanbanCard.displayName = "HeroUI.Kanban.Card";

/* -------------------------------------------------------------------------------------------------
 * Drop indicator (card-sized placeholder)
 * -----------------------------------------------------------------------------------------------*/
interface KanbanDropIndicatorProps extends DropIndicatorPrimitiveProps {
  ref?: Ref<HTMLElement>;
  /** Placeholder height in pixels. Defaults to `--kanban-drop-height` (or 2.5rem). */
  height?: number;
}

const KanbanDropIndicator = ({className, height, style, ...rest}: KanbanDropIndicatorProps) => {
  const {slots} = use(KanbanContext);
  const resolvedClassName = useResolvedClassName(className, slots.dropIndicator());

  const resolvedStyle = useMemo(
    () =>
      height === undefined
        ? style
        : composeRenderProps(
            style,
            (resolved) => ({...resolved, "--kanban-drop-height": `${height}px`}) as CSSProperties,
          ),
    [height, style],
  );

  return (
    <DropIndicatorPrimitive
      {...rest}
      className={resolvedClassName}
      data-slot="kanban-drop-indicator"
      style={resolvedStyle}
    />
  );
};

KanbanDropIndicator.displayName = "HeroUI.Kanban.DropIndicator";

/* -------------------------------------------------------------------------------------------------
 * Drag handle (RAC Button slot="drag", visually hidden until the card is keyboard focused)
 * -----------------------------------------------------------------------------------------------*/
const GripIcon = () => (
  <svg aria-hidden="true" fill="currentColor" height="1em" viewBox="0 0 16 16" width="1em">
    <circle cx="5.5" cy="3.5" r="1.25" />
    <circle cx="10.5" cy="3.5" r="1.25" />
    <circle cx="5.5" cy="8" r="1.25" />
    <circle cx="10.5" cy="8" r="1.25" />
    <circle cx="5.5" cy="12.5" r="1.25" />
    <circle cx="10.5" cy="12.5" r="1.25" />
  </svg>
);

interface KanbanDragHandleProps extends ButtonPrimitiveProps {
  ref?: Ref<HTMLButtonElement>;
}

const KanbanDragHandle = ({children, className, ...rest}: KanbanDragHandleProps) => {
  const {slots} = use(KanbanContext);
  const resolvedClassName = useResolvedClassName(className, slots.dragHandle());

  return (
    <ButtonPrimitive
      slot="drag"
      {...rest}
      className={resolvedClassName}
      data-slot="kanban-drag-handle"
    >
      {children ?? <GripIcon />}
    </ButtonPrimitive>
  );
};

KanbanDragHandle.displayName = "HeroUI.Kanban.DragHandle";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  KanbanRoot,
  KanbanColumn,
  KanbanColumnBody,
  KanbanColumnHeader,
  KanbanColumnActions,
  KanbanColumnIndicator,
  KanbanColumnTitle,
  KanbanColumnCount,
  KanbanScrollShadow,
  KanbanCardList,
  KanbanCard,
  KanbanDropIndicator,
  KanbanDragHandle,
  KanbanContext,
};

export type {
  KanbanSize,
  KanbanRootProps,
  KanbanColumnProps,
  KanbanColumnBodyProps,
  KanbanColumnHeaderProps,
  KanbanColumnActionsProps,
  KanbanColumnIndicatorProps,
  KanbanColumnTitleProps,
  KanbanColumnCountProps,
  KanbanScrollShadowProps,
  KanbanCardListProps,
  KanbanCardProps,
  KanbanDropIndicatorProps,
  KanbanDragHandleProps,
};
