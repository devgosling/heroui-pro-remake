import type {ComponentProps} from "react";

import {
  CellSelectIndicator,
  CellSelectLabel,
  CellSelectPopover,
  CellSelectRoot,
  CellSelectTrigger,
  CellSelectValue,
} from "./cell-select";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CellSelect = Object.assign(CellSelectRoot, {
  Indicator: CellSelectIndicator,
  Label: CellSelectLabel,
  Popover: CellSelectPopover,
  Root: CellSelectRoot,
  Trigger: CellSelectTrigger,
  Value: CellSelectValue,
});

export type CellSelect<T extends object = object> = {
  Props: ComponentProps<typeof CellSelectRoot<T>>;
  RootProps: ComponentProps<typeof CellSelectRoot<T>>;
  TriggerProps: ComponentProps<typeof CellSelectTrigger>;
  LabelProps: ComponentProps<typeof CellSelectLabel>;
  ValueProps: ComponentProps<typeof CellSelectValue>;
  IndicatorProps: ComponentProps<typeof CellSelectIndicator>;
  PopoverProps: ComponentProps<typeof CellSelectPopover>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CellSelectRoot,
  CellSelectTrigger,
  CellSelectLabel,
  CellSelectValue,
  CellSelectIndicator,
  CellSelectPopover,
  CellSelectContext,
} from "./cell-select";

export type {
  CellSelectRootProps,
  CellSelectRootProps as CellSelectProps,
  CellSelectTriggerProps,
  CellSelectLabelProps,
  CellSelectValueProps,
  CellSelectIndicatorProps,
  CellSelectPopoverProps,
} from "./cell-select";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {cellSelectVariants, type CellSelectVariants} from "./cell-select.styles";
