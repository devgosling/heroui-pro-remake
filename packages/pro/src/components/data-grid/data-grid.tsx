"use client";

import type {Key} from "@heroui/react";
import type {CSSProperties, ReactElement, ReactNode, Ref, RefObject} from "react";
import type {
  ColumnProps,
  Selection,
  SortDescriptor,
  SortDirection,
} from "react-aria-components/Table";
import type {DragAndDropHooks, DropPosition} from "react-aria-components/useDragAndDrop";

import {Button, Checkbox, Table} from "@heroui/react";
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useCollator} from "react-aria/useCollator";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {useDragAndDrop} from "react-aria-components/useDragAndDrop";
import {TableLayout, Virtualizer} from "react-aria-components/Virtualizer";
import {cx} from "tailwind-variants";

import {useMergedRef} from "../../utils";

import {GripIcon, SortChevronIcon, TreeChevronIcon} from "./data-grid-icons";
import {dataGridVariants} from "./data-grid.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type DataGridSelection = Selection;
type DataGridSortDescriptor = SortDescriptor;
type DataGridSortDirection = SortDirection;
type DataGridColumnSize = NonNullable<ColumnProps["width"]>;
type DataGridRowKey = string | number;

interface DataGridColumn<T> {
  /** Unique column ID, used as the sort key. */
  id: string;
  /** Header content, or a function that receives sort info. */
  header?: ReactNode | ((info: {sortDirection?: SortDirection}) => ReactNode);
  /** Row property read for default cell content and sorting. */
  accessorKey?: keyof T & string;
  /** Custom cell renderer. */
  cell?: (item: T, column: DataGridColumn<T>) => ReactNode;
  /** Marks the column as the row header for accessibility. */
  isRowHeader?: boolean;
  /** Enables sorting for the column. */
  allowsSorting?: boolean;
  /** Custom comparator. Defaults to locale-aware string comparison. */
  sortFn?: (a: T, b: T) => number;
  /** Enables resizing for this column when the grid allows it. */
  allowsResizing?: boolean;
  /** Initial width. Acts as controlled width when `onColumnResize` is set. */
  width?: DataGridColumnSize;
  /** Initial width for uncontrolled columns. Takes precedence over `width`. */
  defaultWidth?: DataGridColumnSize;
  /** Minimum width during resizing. */
  minWidth?: number;
  /** Maximum width during resizing. */
  maxWidth?: number;
  /** Cell text alignment. @default "start" */
  align?: "start" | "center" | "end";
  /** Extra class added to every header cell of the column. */
  headerClassName?: string;
  /** Extra class added to every body cell of the column. */
  cellClassName?: string;
  /** Keeps the column visible during horizontal scroll. Requires a numeric `width` or `minWidth`. */
  pinned?: "start" | "end";
}

interface DataGridReorderEvent<T> {
  /** Keys of the rows that were moved. */
  keys: Set<DataGridRowKey>;
  /** Row the moved rows were dropped on, and the side. */
  target: {key: DataGridRowKey; dropPosition: "before" | "after"};
  /** Full data array after the move. */
  reorderedData: T[];
}

interface DataGridProps<T extends object> {
  /** Array of row objects to display. */
  data: T[];
  /** Column definitions. */
  columns: DataGridColumn<T>[];
  /** Returns a unique key for each row. */
  getRowId: (item: T) => DataGridRowKey;

  /** Accessible name for the table. */
  "aria-label"?: string;
  /** ID of an element that names the table. */
  "aria-labelledby"?: string;
  /** ID of an element that describes the table. */
  "aria-describedby"?: string;
  /** ID of an element with a longer table description. */
  "aria-details"?: string;
  /** ID for the `role="grid"` element. */
  id?: string;

  /** Visual style passed to the underlying Table. @default "primary" */
  variant?: "primary" | "secondary";
  /** Extra class for the root wrapper. */
  className?: string;
  /** Inline styles for the root wrapper. */
  style?: CSSProperties;
  /** Extra class for the inner `<table>`. */
  contentClassName?: string;
  /** Extra class for the scroll container. */
  scrollContainerClassName?: string;
  /** Keeps the header visible inside a height-limited scroll container. @default false */
  stickyHeader?: boolean;
  /** Vertical alignment of cell content. @default "middle" */
  verticalAlign?: "top" | "middle" | "bottom";

  /** Row selection mode. @default "none" */
  selectionMode?: "none" | "single" | "multiple";
  /** Controlled selected row keys. */
  selectedKeys?: Selection;
  /** Initial selected keys for uncontrolled use. */
  defaultSelectedKeys?: Selection;
  /** Called when the selection changes. */
  onSelectionChange?: (keys: Selection) => void;
  /** Selection interaction model. @default "toggle" */
  selectionBehavior?: "toggle" | "replace";
  /** Adds a leading checkbox column for selection. @default false */
  showSelectionCheckboxes?: boolean;
  /** Keys of rows to disable. */
  disabledKeys?: Iterable<DataGridRowKey>;

  /** Controlled sort state. */
  sortDescriptor?: SortDescriptor;
  /** Initial sort state for uncontrolled use. */
  defaultSortDescriptor?: SortDescriptor;
  /** Called when sorting changes, in both controlled and uncontrolled modes. */
  onSortChange?: (descriptor: SortDescriptor) => void;

  /** Enables resizing for columns that opt in. @default false */
  allowsColumnResize?: boolean;
  /** Called during a resize. */
  onColumnResize?: (widths: Map<Key, DataGridColumnSize>) => void;
  /** Called when a resize finishes. */
  onColumnResizeEnd?: (widths: Map<Key, DataGridColumnSize>) => void;

  /** Enables built-in row drag-and-drop. Cannot be combined with `dragAndDropHooks`. */
  onReorder?: (event: DataGridReorderEvent<T>) => void;
  /** Advanced React Aria drag-and-drop hooks. Overrides `onReorder`. */
  dragAndDropHooks?: DragAndDropHooks;

  /** Called when a row is activated, such as by double-click or Enter. */
  onRowAction?: (key: Key) => void;
  /** Renders custom content when `data` is empty. */
  renderEmptyState?: () => ReactNode;

  /** Content below the table, outside the horizontal scroll area. */
  footer?: ReactNode;
  /** Extra class for the footer element. */
  footerClassName?: string;

  /** Called when the load-more sentinel scrolls into view. */
  onLoadMore?: () => void;
  /** Indicates that more data is being fetched. @default false */
  isLoadingMore?: boolean;
  /** Content shown in the load-more sentinel row. */
  loadMoreContent?: ReactNode;

  /** Renders only visible rows. Requires `rowHeight` and `headingHeight`. @default false */
  virtualized?: boolean;
  /** Fixed row height in pixels for virtualized grids. @default 42 */
  rowHeight?: number;
  /** Header row height in pixels for virtualized grids. @default 36 */
  headingHeight?: number;

  /** Returns child rows, enabling tree rows. */
  getChildren?: (item: T) => T[] | undefined;
  /** ID of the column that shows the expand/collapse chevron. */
  treeColumn?: string;
  /** Controlled set of expanded row keys. */
  expandedKeys?: Iterable<Key>;
  /** Initially expanded row keys for uncontrolled use. */
  defaultExpandedKeys?: Iterable<Key>;
  /** Called when expanded rows change. */
  onExpandedChange?: (keys: Set<Key>) => void;
  /** Extra start padding per nesting level. `0` disables it. @default 20 */
  treeIndent?: number;

  /** Ref to the root wrapper element. */
  ref?: Ref<HTMLDivElement>;
}

/* -------------------------------------------------------------------------------------------------
 * Constants & helpers
 * -----------------------------------------------------------------------------------------------*/
/** Defaults of `--data-grid-selection-column-width` / `--data-grid-drag-handle-column-width`. */
const SELECTION_COLUMN_WIDTH = 40;
const DRAG_HANDLE_COLUMN_WIDTH = 32;

type GridColumnKind = "drag" | "selection" | "data";

interface GridColumnLayout {
  kind: GridColumnKind;
  pinned?: "start" | "end";
  isEdge: boolean;
  /** Width used for pinned offsets before the header cells can be measured. */
  declaredWidth: number;
}

interface PinnedPlacement {
  pinned?: "start" | "end";
  isEdge: boolean;
  offset: number;
}

const toNumber = (size: DataGridColumnSize | undefined | null): number | undefined =>
  typeof size === "number" ? size : undefined;

function getCellValue<T>(item: T, key: (keyof T & string) | undefined): unknown {
  return key ? (item as Record<string, unknown>)[key] : undefined;
}

function renderValue(value: unknown): ReactNode {
  if (value == null || typeof value === "boolean") return value == null ? null : String(value);
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return value;
  }
  if (value instanceof Date) return value.toLocaleDateString();

  return String(value);
}

/** Sets an attribute value only when the flag is truthy so React omits it otherwise. */
const dataAttr = (flag: boolean | undefined) => (flag ? "true" : undefined);

/* -------------------------------------------------------------------------------------------------
 * Pinned columns: sticky offsets from the measured header cells (declared widths before mount)
 * -----------------------------------------------------------------------------------------------*/
function usePinnedPlacements(
  rootRef: RefObject<HTMLDivElement | null>,
  layout: GridColumnLayout[],
  enabled: boolean,
): PinnedPlacement[] {
  const [measured, setMeasured] = useState<number[] | null>(null);
  const layoutKey = layout.map((column) => `${column.kind}:${column.pinned ?? ""}`).join("|");

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!enabled || !root || typeof ResizeObserver === "undefined") return;

    let observed: HTMLElement[] = [];
    const resizeObserver = new ResizeObserver(() => measure());

    // The header row only exists once React Aria has built the collection, and column resizing
    // changes the cell widths without re-rendering the grid: observe both.
    function measure() {
      const headerRow = root!.querySelector<HTMLElement>("thead [role='row']");
      const cells = headerRow ? (Array.from(headerRow.children) as HTMLElement[]) : [];

      if (cells.length !== observed.length || cells.some((cell, i) => cell !== observed[i])) {
        resizeObserver.disconnect();
        cells.forEach((cell) => resizeObserver.observe(cell));
        observed = cells;
      }

      if (cells.length === 0) return;

      const widths = cells.map((cell) => cell.getBoundingClientRect().width);

      setMeasured((prev) =>
        prev &&
        prev.length === widths.length &&
        prev.every((w, i) => Math.abs(w - widths[i]!) < 0.5)
          ? prev
          : widths,
      );
    }

    const mutationObserver = new MutationObserver(() => measure());

    mutationObserver.observe(root, {childList: true, subtree: true});
    measure();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [rootRef, enabled, layoutKey]);

  return useMemo(() => {
    const widths = layout.map((column, index) => {
      const measuredWidth = measured && measured.length === layout.length ? measured[index] : 0;

      return measuredWidth || column.declaredWidth;
    });

    return layout.map((column, index) => {
      if (!column.pinned) return {isEdge: false, offset: 0};

      let offset = 0;

      if (column.pinned === "start") {
        for (let i = 0; i < index; i++) if (layout[i]!.pinned === "start") offset += widths[i]!;
      } else {
        for (let i = layout.length - 1; i > index; i--) {
          if (layout[i]!.pinned === "end") offset += widths[i]!;
        }
      }

      return {isEdge: column.isEdge, offset, pinned: column.pinned};
    });
  }, [layout, measured]);
}

/**
 * Tracks whether the scrolling content has moved under the start-pinned group, and whether it
 * still extends past the end-pinned group (both drive the separator lines of the edge columns).
 */
function usePinnedDetached(rootRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [state, setState] = useState({end: false, start: false});

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!enabled || !root) return;

    const candidates = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          ".table__scroll-container, .table__resizable-container, .table__content",
        ),
      );

    const compute = (element?: HTMLElement) => {
      const scroller =
        element ?? candidates().find((el) => el.scrollWidth - el.clientWidth > 1) ?? null;

      if (!scroller) {
        setState((prev) => (prev.start || prev.end ? {end: false, start: false} : prev));

        return;
      }

      const scrollLeft = Math.abs(scroller.scrollLeft);
      const next = {
        end: scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1,
        start: scrollLeft > 0,
      };

      setState((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };

    const onScroll = (event: Event) => {
      const target = event.target as HTMLElement | null;

      if (target && target !== (root as unknown) && candidates().includes(target)) {
        if (target.scrollWidth - target.clientWidth > 1) compute(target);
      }
    };

    root.addEventListener("scroll", onScroll, {capture: true, passive: true});

    // Re-evaluate when the grid or the table (column resize, rows added) changes size.
    let observedTable: Element | null = null;
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => compute());
    const observeTable = () => {
      const table = root.querySelector(".table__content");

      if (resizeObserver && table && table !== observedTable) {
        if (observedTable) resizeObserver.unobserve(observedTable);
        resizeObserver.observe(table);
        observedTable = table;
      }
    };
    const mutationObserver = new MutationObserver(observeTable);

    resizeObserver?.observe(root);
    mutationObserver.observe(root, {childList: true, subtree: true});
    observeTable();
    compute();

    return () => {
      root.removeEventListener("scroll", onScroll, {capture: true});
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [rootRef, enabled]);

  return enabled ? state : {end: false, start: false};
}

/* -------------------------------------------------------------------------------------------------
 * DataGrid
 * -----------------------------------------------------------------------------------------------*/
function DataGrid<T extends object>({
  allowsColumnResize = false,
  className,
  columns,
  contentClassName,
  data,
  defaultExpandedKeys,
  defaultSelectedKeys,
  defaultSortDescriptor,
  disabledKeys,
  dragAndDropHooks,
  expandedKeys,
  footer,
  footerClassName,
  getChildren,
  getRowId,
  headingHeight = 36,
  id,
  isLoadingMore = false,
  loadMoreContent,
  onColumnResize,
  onColumnResizeEnd,
  onExpandedChange,
  onLoadMore,
  onReorder,
  onRowAction,
  onSelectionChange,
  onSortChange,
  ref,
  renderEmptyState,
  rowHeight = 42,
  scrollContainerClassName,
  selectedKeys,
  selectionBehavior = "toggle",
  selectionMode = "none",
  showSelectionCheckboxes = false,
  sortDescriptor,
  stickyHeader = false,
  style,
  treeColumn,
  treeIndent = 20,
  variant = "primary",
  verticalAlign = "middle",
  virtualized = false,
  ...ariaProps
}: DataGridProps<T>) {
  const slots = useMemo(() => dataGridVariants(), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);
  const collator = useCollator({numeric: true, sensitivity: "base"});

  /* ---------------------------------------------------------------------------- Sorting */
  const [internalSort, setInternalSort] = useState<SortDescriptor | undefined>(
    defaultSortDescriptor,
  );
  const isSortControlled = sortDescriptor !== undefined;
  const resolvedSort = isSortControlled ? sortDescriptor : internalSort;

  const handleSortChange = useCallback(
    (descriptor: SortDescriptor) => {
      if (!isSortControlled) setInternalSort(descriptor);
      onSortChange?.(descriptor);
    },
    [isSortControlled, onSortChange],
  );

  const sortItems = useMemo(() => {
    if (isSortControlled || !resolvedSort?.column) return (items: T[]) => items;

    const column = columns.find((col) => col.id === resolvedSort.column);

    if (!column || (!column.sortFn && !column.accessorKey)) return (items: T[]) => items;

    const direction = resolvedSort.direction === "descending" ? -1 : 1;
    const compare =
      column.sortFn ??
      ((a: T, b: T) => {
        const left = getCellValue(a, column.accessorKey);
        const right = getCellValue(b, column.accessorKey);

        if (left == null || right == null) return left == null ? (right == null ? 0 : 1) : -1;
        if (typeof left === "number" && typeof right === "number") return left - right;
        if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();

        return collator.compare(String(left), String(right));
      });

    return (items: T[]) => [...items].sort((a, b) => direction * compare(a, b));
  }, [collator, columns, isSortControlled, resolvedSort]);

  const rows = useMemo(() => sortItems(data), [data, sortItems]);

  /* ---------------------------------------------------------------------------- Drag & drop */
  const latest = useRef({data, getChildren, getRowId, onReorder});

  latest.current = {data, getChildren, getRowId, onReorder};

  const {dragAndDropHooks: reorderHooks} = useDragAndDrop<T>({
    getItems: (keys) => [...keys].map((key) => ({"text/plain": String(key)})),
    onReorder: (event) => {
      const {data: current, getRowId: rowId, onReorder: handler} = latest.current;

      if (!handler) return;

      const keys = new Set([...event.keys] as DataGridRowKey[]);
      const targetKey = event.target.key as DataGridRowKey;
      const dropPosition = event.target.dropPosition as Exclude<DropPosition, "on">;
      const moving = current.filter((item) => keys.has(rowId(item)));
      const rest = current.filter((item) => !keys.has(rowId(item)));
      const targetIndex = rest.findIndex((item) => rowId(item) === targetKey);
      let reorderedData = current;

      // Only top-level rows can be re-arranged generically (children come from `getChildren`).
      if (targetIndex !== -1 && moving.length > 0) {
        reorderedData = [...rest];
        reorderedData.splice(
          dropPosition === "before" ? targetIndex : targetIndex + 1,
          0,
          ...moving,
        );
      }

      handler({keys, reorderedData, target: {dropPosition, key: targetKey}});
    },
  });

  const resolvedDndHooks = dragAndDropHooks ?? (onReorder ? reorderHooks : undefined);
  const showDragHandles = Boolean(resolvedDndHooks?.useDraggableCollectionState);
  const showCheckboxes = showSelectionCheckboxes && selectionMode !== "none";

  /* ---------------------------------------------------------------------------- Column layout */
  const hasStartPinned = !virtualized && columns.some((col) => col.pinned === "start");
  const hasEndPinned = !virtualized && columns.some((col) => col.pinned === "end");
  const hasPinned = hasStartPinned || hasEndPinned;

  const layout = useMemo<GridColumnLayout[]>(() => {
    const leading: GridColumnLayout[] = [];
    const utilityPinned = hasStartPinned ? ("start" as const) : undefined;

    if (showDragHandles) {
      leading.push({
        declaredWidth: DRAG_HANDLE_COLUMN_WIDTH,
        isEdge: false,
        kind: "drag",
        pinned: utilityPinned,
      });
    }
    if (showCheckboxes) {
      leading.push({
        declaredWidth: SELECTION_COLUMN_WIDTH,
        isEdge: false,
        kind: "selection",
        pinned: utilityPinned,
      });
    }

    const all: GridColumnLayout[] = [
      ...leading,
      ...columns.map((col) => ({
        declaredWidth: toNumber(col.defaultWidth) ?? toNumber(col.width) ?? col.minWidth ?? 0,
        isEdge: false,
        kind: "data" as const,
        pinned: virtualized ? undefined : col.pinned,
      })),
    ];

    let lastStart = -1;
    let firstEnd = -1;

    all.forEach((column, index) => {
      if (column.pinned === "start") lastStart = index;
      if (column.pinned === "end" && firstEnd === -1) firstEnd = index;
    });
    if (lastStart !== -1) all[lastStart]!.isEdge = true;
    if (firstEnd !== -1) all[firstEnd]!.isEdge = true;

    return all;
  }, [columns, hasStartPinned, showCheckboxes, showDragHandles, virtualized]);

  const placements = usePinnedPlacements(rootRef, layout, hasPinned);
  const detached = usePinnedDetached(rootRef, hasPinned);
  const leadingCount = layout.length - columns.length;

  const pinnedProps = useCallback(
    (index: number) => {
      const placement = placements[index];

      if (!placement?.pinned) return {};

      return {
        "data-pinned": placement.pinned,
        "data-pinned-edge": dataAttr(placement.isEdge),
        style: (placement.pinned === "start"
          ? {insetInlineStart: placement.offset}
          : {insetInlineEnd: placement.offset}) as CSSProperties,
      };
    },
    [placements],
  );

  const resolvedTreeColumn = getChildren
    ? (treeColumn ?? columns.find((col) => col.isRowHeader)?.id ?? columns[0]?.id)
    : undefined;
  const rowHeaderColumn = columns.find((col) => col.isRowHeader) ?? columns[0];

  /* ---------------------------------------------------------------------------- Header */
  const headerColumns = useMemo(() => {
    const result: ReactElement[] = [];

    layout.forEach((column, index) => {
      const {style: pinnedStyle, ...pinnedAttrs} = pinnedProps(index);

      if (column.kind === "drag") {
        result.push(
          <Table.Column
            key="__data-grid-drag"
            className={slots.dragHandleColumn()}
            minWidth={DRAG_HANDLE_COLUMN_WIDTH}
            style={pinnedStyle}
            width={DRAG_HANDLE_COLUMN_WIDTH}
            {...pinnedAttrs}
          />,
        );
      } else if (column.kind === "selection") {
        result.push(
          <Table.Column
            key="__data-grid-selection"
            className={slots.selectionColumn()}
            minWidth={SELECTION_COLUMN_WIDTH}
            style={pinnedStyle}
            width={SELECTION_COLUMN_WIDTH}
            {...pinnedAttrs}
          >
            {selectionMode === "multiple" ? (
              <Checkbox slot="selection">
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Content>
              </Checkbox>
            ) : null}
          </Table.Column>,
        );
      } else {
        const col = columns[index - leadingCount]!;
        const isResizable = allowsColumnResize && Boolean(col.allowsResizing);
        const widthProps =
          col.defaultWidth != null
            ? {defaultWidth: col.defaultWidth}
            : onColumnResize
              ? {width: col.width}
              : {defaultWidth: col.width};

        result.push(
          <Table.Column
            key={col.id}
            allowsSorting={col.allowsSorting}
            className={col.headerClassName}
            data-align={col.align && col.align !== "start" ? col.align : undefined}
            id={col.id}
            isRowHeader={col.isRowHeader}
            maxWidth={col.maxWidth}
            minWidth={col.minWidth}
            style={pinnedStyle}
            textValue={typeof col.header === "string" ? col.header : undefined}
            {...widthProps}
            {...pinnedAttrs}
          >
            {({allowsSorting, sortDirection}) => {
              const custom = typeof col.header === "function";
              const content = custom
                ? (col.header as (info: {sortDirection?: SortDirection}) => ReactNode)({
                    sortDirection,
                  })
                : (col.header as ReactNode);

              return (
                <>
                  {allowsSorting ? (
                    <span data-slot="data-grid-sort-header">
                      {content}
                      {!custom && sortDirection ? (
                        <SortChevronIcon
                          className={slots.sortIcon()}
                          data-direction={sortDirection}
                          data-slot="data-grid-sort-icon"
                        />
                      ) : null}
                    </span>
                  ) : (
                    content
                  )}
                  {isResizable ? <Table.ColumnResizer /> : null}
                </>
              );
            }}
          </Table.Column>,
        );
      }
    });

    return result;
  }, [
    allowsColumnResize,
    columns,
    layout,
    leadingCount,
    onColumnResize,
    pinnedProps,
    selectionMode,
    slots,
  ]);

  /* ---------------------------------------------------------------------------- Rows */
  const renderRow = useCallback(
    function renderRowItem(item: T): ReactElement {
      const rowKey = getRowId(item);
      const childItems = getChildren?.(item);
      const sortedChildren = childItems && childItems.length > 0 ? sortItems(childItems) : null;
      const headerValue = getCellValue(item, rowHeaderColumn?.accessorKey);
      const textValue =
        typeof headerValue === "string" || typeof headerValue === "number"
          ? String(headerValue)
          : undefined;

      return (
        <Table.Row id={rowKey} textValue={textValue}>
          {layout.map((column, index) => {
            const {style: pinnedStyle, ...pinnedAttrs} = pinnedProps(index);

            if (column.kind === "drag") {
              return (
                <Table.Cell
                  key="__data-grid-drag"
                  className={slots.dragHandleCell()}
                  style={pinnedStyle}
                  {...pinnedAttrs}
                >
                  <ButtonPrimitive
                    className={slots.dragHandle()}
                    data-slot="data-grid-drag-handle"
                    slot="drag"
                  >
                    <GripIcon />
                  </ButtonPrimitive>
                </Table.Cell>
              );
            }

            if (column.kind === "selection") {
              return (
                <Table.Cell
                  key="__data-grid-selection"
                  className={slots.selectionCell()}
                  style={pinnedStyle}
                  {...pinnedAttrs}
                >
                  <Checkbox slot="selection" variant="secondary">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Cell>
              );
            }

            const col = columns[index - leadingCount]!;
            const content = col.cell
              ? col.cell(item, col)
              : renderValue(getCellValue(item, col.accessorKey));
            const isTreeColumn = col.id === resolvedTreeColumn;

            return (
              <Table.Cell
                key={col.id}
                className={col.cellClassName}
                data-align={col.align && col.align !== "start" ? col.align : undefined}
                style={pinnedStyle}
                {...pinnedAttrs}
              >
                {isTreeColumn
                  ? ({hasChildItems, isExpanded, level}) => (
                      <span
                        className={slots.treeCell()}
                        data-slot="data-grid-tree-cell"
                        style={
                          treeIndent > 0 && level > 1
                            ? {paddingInlineStart: (level - 1) * treeIndent}
                            : undefined
                        }
                      >
                        {hasChildItems ? (
                          <Button
                            isIconOnly
                            aria-label={isExpanded ? "Collapse row" : "Expand row"}
                            className={slots.treeToggle()}
                            size="sm"
                            slot="chevron"
                            variant="ghost"
                          >
                            <TreeChevronIcon
                              aria-hidden="true"
                              className={slots.treeToggleIcon()}
                              data-expanded={dataAttr(isExpanded)}
                              data-slot="data-grid-tree-toggle-icon"
                            />
                          </Button>
                        ) : (
                          <span
                            aria-hidden="true"
                            className={slots.treeToggleSpacer()}
                            data-slot="data-grid-tree-toggle-spacer"
                          />
                        )}
                        <span>{content}</span>
                      </span>
                    )
                  : content}
              </Table.Cell>
            );
          })}
          {sortedChildren ? (
            <Table.Collection dependencies={[renderRowItem]} items={sortedChildren}>
              {renderRowItem}
            </Table.Collection>
          ) : null}
        </Table.Row>
      );
    },
    [
      columns,
      getChildren,
      getRowId,
      layout,
      leadingCount,
      pinnedProps,
      resolvedTreeColumn,
      rowHeaderColumn,
      slots,
      sortItems,
      treeIndent,
    ],
  );

  /* ---------------------------------------------------------------------------- Render */
  let table = (
    <Table.Content
      {...ariaProps}
      className={contentClassName}
      defaultExpandedKeys={getChildren ? defaultExpandedKeys : undefined}
      defaultSelectedKeys={defaultSelectedKeys}
      disabledKeys={disabledKeys}
      dragAndDropHooks={resolvedDndHooks}
      expandedKeys={getChildren ? expandedKeys : undefined}
      {...(id === undefined ? {} : ({id} as object))}
      selectedKeys={selectedKeys}
      selectionBehavior={selectionBehavior}
      selectionMode={selectionMode}
      sortDescriptor={resolvedSort}
      treeColumn={resolvedTreeColumn}
      onExpandedChange={getChildren ? onExpandedChange : undefined}
      onRowAction={onRowAction}
      onSelectionChange={onSelectionChange}
      onSortChange={handleSortChange}
    >
      <Table.Header className={virtualized ? slots.virtualizedHeader() : undefined}>
        {headerColumns}
      </Table.Header>
      <Table.Body
        renderEmptyState={
          renderEmptyState
            ? () => (
                <div className={slots.emptyState()} data-slot="data-grid-empty-state">
                  {renderEmptyState()}
                </div>
              )
            : undefined
        }
      >
        <Table.Collection dependencies={[renderRow]} items={rows}>
          {renderRow}
        </Table.Collection>
        {onLoadMore ? (
          <Table.LoadMore isLoading={isLoadingMore} onLoadMore={onLoadMore}>
            {loadMoreContent ? (
              <Table.LoadMoreContent>{loadMoreContent}</Table.LoadMoreContent>
            ) : null}
          </Table.LoadMore>
        ) : null}
      </Table.Body>
    </Table.Content>
  );

  if (virtualized) {
    table = (
      <Virtualizer layout={TableLayout} layoutOptions={{headingHeight, rowHeight}}>
        {table}
      </Virtualizer>
    );
  }

  if (allowsColumnResize) {
    table = (
      <Table.ResizableContainer onResize={onColumnResize} onResizeEnd={onColumnResizeEnd}>
        {table}
      </Table.ResizableContainer>
    );
  }

  return (
    <Table.Root
      ref={mergedRef}
      className={cx(slots.base(), className)}
      data-pinned-end-detached={hasEndPinned && detached.end ? "" : undefined}
      data-pinned-start-detached={hasStartPinned && detached.start ? "" : undefined}
      data-slot="data-grid"
      data-sticky-header={dataAttr(stickyHeader)}
      data-vertical-align={verticalAlign}
      style={style}
      variant={variant}
    >
      <Table.ScrollContainer className={scrollContainerClassName}>{table}</Table.ScrollContainer>
      {footer != null ? <Table.Footer className={footerClassName}>{footer}</Table.Footer> : null}
    </Table.Root>
  );
}

DataGrid.displayName = "HeroUI.DataGrid";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {DataGrid};

export type {
  DataGridProps,
  DataGridColumn,
  DataGridReorderEvent,
  DataGridSelection,
  DataGridSortDescriptor,
  DataGridSortDirection,
  DataGridColumnSize,
};
