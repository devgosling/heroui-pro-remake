import type {ComponentProps} from "react";

import {
  KanbanCard,
  KanbanCardList,
  KanbanColumn,
  KanbanColumnActions,
  KanbanColumnBody,
  KanbanColumnCount,
  KanbanColumnHeader,
  KanbanColumnIndicator,
  KanbanColumnTitle,
  KanbanDragHandle,
  KanbanDropIndicator,
  KanbanRoot,
  KanbanScrollShadow,
} from "./kanban";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Kanban = Object.assign(KanbanRoot, {
  Card: KanbanCard,
  CardList: KanbanCardList,
  Column: KanbanColumn,
  ColumnActions: KanbanColumnActions,
  ColumnBody: KanbanColumnBody,
  ColumnCount: KanbanColumnCount,
  ColumnHeader: KanbanColumnHeader,
  ColumnIndicator: KanbanColumnIndicator,
  ColumnTitle: KanbanColumnTitle,
  DragHandle: KanbanDragHandle,
  DropIndicator: KanbanDropIndicator,
  Root: KanbanRoot,
  ScrollShadow: KanbanScrollShadow,
});

export type Kanban = {
  Props: ComponentProps<typeof KanbanRoot>;
  RootProps: ComponentProps<typeof KanbanRoot>;
  ColumnProps: ComponentProps<typeof KanbanColumn>;
  ColumnBodyProps: ComponentProps<typeof KanbanColumnBody>;
  ColumnHeaderProps: ComponentProps<typeof KanbanColumnHeader>;
  ColumnActionsProps: ComponentProps<typeof KanbanColumnActions>;
  ColumnIndicatorProps: ComponentProps<typeof KanbanColumnIndicator>;
  ColumnTitleProps: ComponentProps<typeof KanbanColumnTitle>;
  ColumnCountProps: ComponentProps<typeof KanbanColumnCount>;
  ScrollShadowProps: ComponentProps<typeof KanbanScrollShadow>;
  CardListProps: ComponentProps<typeof KanbanCardList>;
  CardProps: ComponentProps<typeof KanbanCard>;
  DropIndicatorProps: ComponentProps<typeof KanbanDropIndicator>;
  DragHandleProps: ComponentProps<typeof KanbanDragHandle>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
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
} from "./kanban";

export type {
  KanbanSize,
  KanbanRootProps,
  KanbanRootProps as KanbanProps,
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
} from "./kanban";

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export {useKanban, useKanbanColumn, useKanbanCardPlaceholder} from "./use-kanban";

export type {
  KanbanItemKey,
  UseKanbanOptions,
  UseKanbanReturn,
  UseKanbanColumnOptions,
  UseKanbanColumnReturn,
  UseKanbanCardPlaceholderOptions,
  UseKanbanCardPlaceholderReturn,
} from "./use-kanban";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {kanbanVariants, type KanbanVariants} from "./kanban.styles";
