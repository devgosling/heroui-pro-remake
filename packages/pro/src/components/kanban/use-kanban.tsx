"use client";

import type {Key} from "@heroui/react";
import type {JSX} from "react";
import type {
  DragAndDropHooks,
  DropItem,
  DropTarget,
  ItemDropTarget,
} from "react-aria-components/useDragAndDrop";
import type {ListData} from "react-aria-components/useListData";

import {useCallback, useEffect, useMemo} from "react";
import {isTextDropItem, useDragAndDrop} from "react-aria-components/useDragAndDrop";
import {useListData} from "react-aria-components/useListData";

import {KanbanDropIndicator} from "./kanban";

type KanbanItemKey = string | number;

/* -------------------------------------------------------------------------------------------------
 * Drag lifecycle bus
 * -------------------------------------------------------------------------------------------------
 * Columns announce drag start / end here so `useKanbanCardPlaceholder` can size the placeholder
 * from the dragged card. It works for pointer, keyboard and screen-reader drags alike, since all of
 * them go through RAC's `onDragStart` / `onDragEnd`.
 * -----------------------------------------------------------------------------------------------*/
type KanbanDragListener = {
  onDragEnd: () => void;
  onDragStart: (keys: Set<Key>) => void;
};

const dragListeners = new Set<KanbanDragListener>();

const DROP_HEIGHT_VAR = "--kanban-drop-height";

function findCardElement(key: Key): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const cards = document.querySelectorAll<HTMLElement>('[data-slot="kanban-card"][data-key]');

  for (const card of cards) {
    if (card.dataset["key"] === String(key)) return card;
  }

  return null;
}

/* -------------------------------------------------------------------------------------------------
 * useKanban
 * -----------------------------------------------------------------------------------------------*/
interface UseKanbanOptions<T> {
  /** Items to populate the board with. */
  initialItems: T[];
  /** Returns the column identifier of an item. */
  getColumn: (item: T) => string;
  /** Returns a copy of the item assigned to another column. */
  setColumn: (item: T, column: string) => T;
  /**
   * Custom MIME-like drag type used to transfer item keys between columns.
   * @default "kanban-item-id"
   */
  dragType?: string;
  /**
   * Derives the unique key of an item.
   * @default (item) => item.id
   */
  getKey?: (item: T) => KanbanItemKey;
}

interface UseKanbanReturn<T> {
  /** The underlying RAC ListData, for advanced operations. */
  list: ListData<T>;
  /** Appends an item to the board. */
  addItem: (item: T) => void;
  /** Removes an item by key. */
  removeItem: (key: KanbanItemKey) => void;
  /** Moves an item to another column. It keeps its place in the board order. */
  moveItem: (key: KanbanItemKey, toColumn: string) => void;
  /** Replaces an item by key. */
  updateItem: (key: KanbanItemKey, item: T) => void;
  /** Returns the column of an item. */
  getColumn: (item: T) => string;
  /** Returns a copy of the item assigned to another column. */
  setColumn: (item: T, column: string) => T;
  /** The drag type used to transfer keys between columns. */
  dragType: string;
}

const defaultGetKey = <T,>(item: T): KanbanItemKey => (item as {id: KanbanItemKey}).id;

function useKanban<T extends object>({
  dragType = "kanban-item-id",
  getColumn,
  getKey = defaultGetKey,
  initialItems,
  setColumn,
}: UseKanbanOptions<T>): UseKanbanReturn<T> {
  const list = useListData<T>({getKey, initialItems});

  const addItem = useCallback((item: T) => list.append(item), [list]);

  const removeItem = useCallback((key: KanbanItemKey) => list.remove(key), [list]);

  const updateItem = useCallback((key: KanbanItemKey, item: T) => list.update(key, item), [list]);

  const moveItem = useCallback(
    (key: KanbanItemKey, toColumn: string) => {
      // The item keeps its place in the board order, so items moved into a column interleave with
      // the cards already there by that order (they are not appended to the end of the column).
      list.update(key, (item) => (getColumn(item) === toColumn ? item : setColumn(item, toColumn)));
    },
    [getColumn, list, setColumn],
  );

  return {
    addItem,
    dragType,
    getColumn,
    list,
    moveItem,
    removeItem,
    setColumn,
    updateItem,
  };
}

/* -------------------------------------------------------------------------------------------------
 * useKanbanColumn
 * -----------------------------------------------------------------------------------------------*/
interface UseKanbanColumnOptions {
  /** Overrides the drop indicator rendering (see `useKanbanCardPlaceholder`). */
  renderDropIndicator?: (target: DropTarget) => JSX.Element;
}

interface UseKanbanColumnReturn<T> {
  /** Items of this column, in board order. */
  items: T[];
  /** Pass to `Kanban.CardList` as `dragAndDropHooks`. */
  dragAndDropHooks: DragAndDropHooks<T>;
}

function useKanbanColumn<T extends object>(
  kanban: UseKanbanReturn<T>,
  column: string,
  options: UseKanbanColumnOptions = {},
): UseKanbanColumnReturn<T> {
  const {dragType, getColumn, list, setColumn} = kanban;
  const {renderDropIndicator} = options;

  const items = useMemo(
    () => list.items.filter((item) => getColumn(item) === column),
    [list.items, getColumn, column],
  );

  /** Reads the dragged keys back, keeping only keys that belong to this board. */
  const readKeys = useCallback(
    async (dropItems: DropItem[]) => {
      const values = await Promise.all(
        dropItems
          .filter(isTextDropItem)
          .filter((item) => item.types.has(dragType))
          .map((item) => item.getText(dragType)),
      );
      const keys: Key[] = [];

      for (const value of values) {
        try {
          const key = JSON.parse(value) as Key;

          if (list.getItem(key) !== undefined) keys.push(key);
        } catch {
          // Not a key written by this board.
        }
      }

      return keys;
    },
    [dragType, list],
  );

  const assignColumn = useCallback(
    (keys: Key[]) => {
      for (const key of keys) {
        list.update(key, (item) => (getColumn(item) === column ? item : setColumn(item, column)));
      }
    },
    [column, getColumn, list, setColumn],
  );

  const placeAt = useCallback(
    (target: ItemDropTarget, keys: Key[]) => {
      if (keys.length === 0) return;
      if (target.dropPosition === "before") list.moveBefore(target.key, keys);
      else list.moveAfter(target.key, keys);
    },
    [list],
  );

  const {dragAndDropHooks} = useDragAndDrop<T>({
    acceptedDragTypes: [dragType],
    getDropOperation: () => "move",
    getItems: (keys) =>
      [...keys].map((key) => ({
        [dragType]: JSON.stringify(key),
        "text/plain": String(key),
      })),
    onDragEnd: () => dragListeners.forEach((listener) => listener.onDragEnd()),
    onDragStart: (event) => dragListeners.forEach((listener) => listener.onDragStart(event.keys)),
    onInsert: async (event) => {
      const keys = await readKeys(event.items);

      assignColumn(keys);
      placeAt(event.target, keys);
    },
    onReorder: (event) => placeAt(event.target, [...event.keys]),
    // Dropped on the list itself (an empty column): append to the end of this column.
    onRootDrop: async (event) => {
      const keys = await readKeys(event.items);
      const moved = keys.flatMap((key) => {
        const item = list.getItem(key);

        return item ? [getColumn(item) === column ? item : setColumn(item, column)] : [];
      });

      if (moved.length === 0) return;
      list.remove(...keys);
      list.append(...moved);
    },
    renderDropIndicator,
  });

  return {dragAndDropHooks, items};
}

/* -------------------------------------------------------------------------------------------------
 * useKanbanCardPlaceholder
 * -----------------------------------------------------------------------------------------------*/
interface UseKanbanCardPlaceholderOptions {
  /** Renders the drop indicator for a target. Defaults to `<Kanban.DropIndicator target />`. */
  renderIndicator?: (target: DropTarget) => JSX.Element;
}

interface UseKanbanCardPlaceholderReturn {
  /** Pass to `useKanbanColumn` options. */
  renderDropIndicator: (target: DropTarget) => JSX.Element;
}

/**
 * Measures the dragged card and exposes its height as `--kanban-drop-height` on the document
 * element for the duration of the drag, so `Kanban.DropIndicator` renders a card-sized slot.
 */
function useKanbanCardPlaceholder({
  renderIndicator,
}: UseKanbanCardPlaceholderOptions = {}): UseKanbanCardPlaceholderReturn {
  useEffect(() => {
    const listener: KanbanDragListener = {
      onDragEnd: () => {
        const root = document.documentElement;

        root.style.removeProperty(DROP_HEIGHT_VAR);
        if (root.getAttribute("style") === "") root.removeAttribute("style");
      },
      onDragStart: (keys) => {
        const [firstKey] = keys;
        const card = firstKey === undefined ? null : findCardElement(firstKey);

        if (!card) return;

        document.documentElement.style.setProperty(
          DROP_HEIGHT_VAR,
          `${card.getBoundingClientRect().height}px`,
        );
      },
    };

    dragListeners.add(listener);

    return () => {
      dragListeners.delete(listener);
    };
  }, []);

  const renderDropIndicator = useCallback(
    (target: DropTarget) =>
      renderIndicator ? renderIndicator(target) : <KanbanDropIndicator target={target} />,
    [renderIndicator],
  );

  return {renderDropIndicator};
}

export {useKanban, useKanbanColumn, useKanbanCardPlaceholder};

export type {
  KanbanItemKey,
  UseKanbanOptions,
  UseKanbanReturn,
  UseKanbanColumnOptions,
  UseKanbanColumnReturn,
  UseKanbanCardPlaceholderOptions,
  UseKanbanCardPlaceholderReturn,
};
