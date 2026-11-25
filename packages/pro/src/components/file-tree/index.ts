import type {ComponentProps} from "react";

import {
  FileTreeHeader,
  FileTreeIndicator,
  FileTreeItem,
  FileTreeRoot,
  FileTreeSection,
} from "./file-tree";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const FileTree = Object.assign(FileTreeRoot, {
  Header: FileTreeHeader,
  Indicator: FileTreeIndicator,
  Item: FileTreeItem,
  Root: FileTreeRoot,
  Section: FileTreeSection,
});

export type FileTree = {
  Props: ComponentProps<typeof FileTreeRoot>;
  RootProps: ComponentProps<typeof FileTreeRoot>;
  ItemProps: ComponentProps<typeof FileTreeItem>;
  IndicatorProps: ComponentProps<typeof FileTreeIndicator>;
  SectionProps: ComponentProps<typeof FileTreeSection>;
  HeaderProps: ComponentProps<typeof FileTreeHeader>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  FileTreeRoot,
  FileTreeItem,
  FileTreeIndicator,
  FileTreeSection,
  FileTreeHeader,
  FileTreeContext,
} from "./file-tree";

export type {
  FileTreeRootProps,
  FileTreeRootProps as FileTreeProps,
  FileTreeItemProps,
  FileTreeItemRenderProps,
  FileTreeIndicatorProps,
  FileTreeSectionProps,
  FileTreeHeaderProps,
} from "./file-tree";

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export {useFileTree, useFileTreeDrag} from "./use-file-tree";

export type {
  FileTreeNode,
  FileTreeDropPosition,
  FileTreeDragItem,
  UseFileTreeOptions,
  UseFileTreeResult,
  UseFileTreeDragOptions,
} from "./use-file-tree";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {fileTreeVariants, type FileTreeVariants} from "./file-tree.styles";
