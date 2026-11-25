"use client";

import type {CollectionRenderer} from "react-aria-components/CollectionBuilder";

import {FileTreeLevel} from "./file-tree-motion";

/* -------------------------------------------------------------------------------------------------
 * Collection renderer
 * Groups the rows of every expanded item into a motion section (see `FileTreeLevel`).
 * -----------------------------------------------------------------------------------------------*/
export const FileTreeCollectionRenderer: CollectionRenderer = {
  CollectionBranch: ({collection, parent, renderDropIndicator}) => (
    <FileTreeLevel
      collection={collection}
      firstKey={parent.firstChildKey}
      renderDropIndicator={renderDropIndicator}
    />
  ),
  CollectionRoot: ({collection, renderDropIndicator}) => (
    <FileTreeLevel
      collection={collection}
      firstKey={collection.getFirstKey()}
      renderDropIndicator={renderDropIndicator}
    />
  ),
};
