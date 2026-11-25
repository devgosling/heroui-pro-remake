import type {ComponentProps} from "react";

import {
  CellColorPickerLabel,
  CellColorPickerPopover,
  CellColorPickerRoot,
  CellColorPickerSwatch,
  CellColorPickerTrigger,
  CellColorPickerValueDisplay,
} from "./cell-color-picker";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CellColorPicker = Object.assign(CellColorPickerRoot, {
  Label: CellColorPickerLabel,
  Popover: CellColorPickerPopover,
  Root: CellColorPickerRoot,
  Swatch: CellColorPickerSwatch,
  Trigger: CellColorPickerTrigger,
  ValueDisplay: CellColorPickerValueDisplay,
});

export type CellColorPicker = {
  Props: ComponentProps<typeof CellColorPickerRoot>;
  RootProps: ComponentProps<typeof CellColorPickerRoot>;
  TriggerProps: ComponentProps<typeof CellColorPickerTrigger>;
  LabelProps: ComponentProps<typeof CellColorPickerLabel>;
  ValueDisplayProps: ComponentProps<typeof CellColorPickerValueDisplay>;
  SwatchProps: ComponentProps<typeof CellColorPickerSwatch>;
  PopoverProps: ComponentProps<typeof CellColorPickerPopover>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CellColorPickerRoot,
  CellColorPickerTrigger,
  CellColorPickerLabel,
  CellColorPickerValueDisplay,
  CellColorPickerSwatch,
  CellColorPickerPopover,
  CellColorPickerContext,
} from "./cell-color-picker";

export type {
  CellColorPickerRootProps,
  CellColorPickerRootProps as CellColorPickerProps,
  CellColorPickerTriggerProps,
  CellColorPickerLabelProps,
  CellColorPickerValueDisplayProps,
  CellColorPickerSwatchProps,
  CellColorPickerPopoverProps,
} from "./cell-color-picker";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {cellColorPickerVariants, type CellColorPickerVariants} from "./cell-color-picker.styles";
