"use client";

import type {Key} from "@heroui/react";
import type {DragAndDropOptions} from "react-aria-components/useDragAndDrop";
import type {TreeData} from "react-aria-components/useTreeData";

import {useCallback, useMemo} from "react";
import {useDragAndDrop} from "react-aria-components/useDragAndDrop";

/* -------------------------------------------------------------------------------------------------
 * useFileTree
 * -----------------------------------------------------------------------------------------------*/
interface FileTreeNode {
  id: Key;
  children?: readonly FileTreeNode[] | null;
}

interface UseFileTreeOptions<T extends FileTreeNode> {
  /** The tree data. Each node must have an `id` and optional `children`. */
  items: readonly T[];
  /**
   * Identifies leaf nodes.
   * @default (node) => !node.children || node.children.length === 0
   */
  isLeaf?: (node: T) => boolean;
}

interface UseFileTreeResult<T extends FileTreeNode> {
  /** All branch node keys, e.g. for `defaultExpandedKeys`. */
  expandableKeys: T["id"][];
  /** Keeps the leaves that match the predicate and prunes branches left without children. */
  filterTree: (predicate: (node: T) => boolean) => T[];
  /** All leaf nodes, flattened in tree order. */
  leaves: T[];
}

const defaultIsLeaf = (node: FileTreeNode) => !node.children || node.children.length === 0;

function getChildren<T extends FileTreeNode>(node: T): readonly T[] {
  return (node.children ?? []) as readonly T[];
}

function useFileTree<T extends FileTreeNode>({
  isLeaf = defaultIsLeaf,
  items,
}: UseFileTreeOptions<T>): UseFileTreeResult<T> {
  const {expandableKeys, leaves} = useMemo(() => {
    const branchKeys: T["id"][] = [];
    const leafNodes: T[] = [];

    const visit = (nodes: readonly T[]) => {
      for (const node of nodes) {
        if (isLeaf(node)) {
          leafNodes.push(node);
        } else {
          branchKeys.push(node.id);
          visit(getChildren(node));
        }
      }
    };

    visit(items);

    return {expandableKeys: branchKeys, leaves: leafNodes};
  }, [isLeaf, items]);

  const filterTree = useCallback(
    (predicate: (node: T) => boolean) => {
      const filter = (nodes: readonly T[]): T[] =>
        nodes.flatMap((node) => {
          if (isLeaf(node)) return predicate(node) ? [node] : [];

          const children = filter(getChildren(node));

          return children.length > 0 ? [{...node, children}] : [];
        });

      return filter(items);
    },
    [isLeaf, items],
  );

  return {expandableKeys, filterTree, leaves};
}

/* -------------------------------------------------------------------------------------------------
 * useFileTreeDrag
 * -----------------------------------------------------------------------------------------------*/
type FileTreeDropPosition = "before" | "after" | "on";

/** Drag data of one item, keyed by MIME type. */
type FileTreeDragItem = Record<string, string>;

interface UseFileTreeDragOptions<T extends object> extends Omit<
  DragAndDropOptions<T>,
  "getItems" | "onMove"
> {
  /** The mutable tree returned by React Aria's `useTreeData`. */
  tree: TreeData<T>;
  /**
   * Drag data for the dragged keys.
   * @default each key serialized as `text/plain`
   */
  getItems?: (keys: Set<Key>) => FileTreeDragItem[];
  /** Called after the items were moved in `tree`. */
  onMove?: (keys: Set<Key>, target: {key: Key; dropPosition: FileTreeDropPosition}) => void;
}

/** Whether `ancestorKey` is `key` itself or one of its ancestors. */
function isSelfOrAncestor<T extends object>(tree: TreeData<T>, ancestorKey: Key, key: Key) {
  let current: Key | null | undefined = key;

  while (current != null) {
    if (current === ancestorKey) return true;
    current = tree.getItem(current)?.parentKey;
  }

  return false;
}

function useFileTreeDrag<T extends object>({
  getItems,
  onMove,
  tree,
  ...options
}: UseFileTreeDragOptions<T>) {
  return useDragAndDrop<T>({
    ...options,
    getItems: (keys) =>
      getItems ? getItems(keys) : [...keys].map((key) => ({"text/plain": String(key)})),
    onMove: (event) => {
      const {keys, target} = event;

      if (target.dropPosition === "before") {
        tree.moveBefore(target.key, keys);
      } else if (target.dropPosition === "after") {
        tree.moveAfter(target.key, keys);
      } else {
        // Dropped on an item: the moved items become its last children.
        const targetNode = tree.getItem(target.key);

        if (!targetNode) return;

        let index = targetNode.children?.length ?? 0;

        for (const key of keys) {
          if (isSelfOrAncestor(tree, key, target.key)) continue;
          tree.move(key, target.key, index);
          index += 1;
        }
      }

      onMove?.(keys, {dropPosition: target.dropPosition, key: target.key});
    },
  });
}

export {useFileTree, useFileTreeDrag};

export type {
  FileTreeNode,
  FileTreeDropPosition,
  FileTreeDragItem,
  UseFileTreeOptions,
  UseFileTreeResult,
  UseFileTreeDragOptions,
};
