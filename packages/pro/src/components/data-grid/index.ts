import type {DataGridProps} from "./data-grid";

import {DataGrid as DataGridRoot} from "./data-grid";

/* -------------------------------------------------------------------------------------------------
 * Component
 * -----------------------------------------------------------------------------------------------*/
export const DataGrid = Object.assign(DataGridRoot, {
  Root: DataGridRoot,
});

export type DataGrid = {
  Props: DataGridProps<object>;
  RootProps: DataGridProps<object>;
};

/* -------------------------------------------------------------------------------------------------
 * Named exports
 * -----------------------------------------------------------------------------------------------*/
export {DataGridRoot};

export type {
  DataGridProps,
  DataGridProps as DataGridRootProps,
  DataGridColumn,
  DataGridReorderEvent,
  DataGridSelection,
  DataGridSortDescriptor,
  DataGridSortDirection,
  DataGridColumnSize,
} from "./data-grid";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dataGridVariants, type DataGridVariants} from "./data-grid.styles";
