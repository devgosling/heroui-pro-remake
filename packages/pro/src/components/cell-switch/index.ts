import type {ComponentProps} from "react";

import {CellSwitchControl, CellSwitchLabel, CellSwitchRoot, CellSwitchTrigger} from "./cell-switch";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CellSwitch = Object.assign(CellSwitchRoot, {
  Control: CellSwitchControl,
  Label: CellSwitchLabel,
  Root: CellSwitchRoot,
  Trigger: CellSwitchTrigger,
});

export type CellSwitch = {
  Props: ComponentProps<typeof CellSwitchRoot>;
  RootProps: ComponentProps<typeof CellSwitchRoot>;
  TriggerProps: ComponentProps<typeof CellSwitchTrigger>;
  LabelProps: ComponentProps<typeof CellSwitchLabel>;
  ControlProps: ComponentProps<typeof CellSwitchControl>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  CellSwitchRoot,
  CellSwitchTrigger,
  CellSwitchLabel,
  CellSwitchControl,
  CellSwitchContext,
} from "./cell-switch";

export type {
  CellSwitchRootProps,
  CellSwitchRootProps as CellSwitchProps,
  CellSwitchTriggerProps,
  CellSwitchLabelProps,
  CellSwitchControlProps,
} from "./cell-switch";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {cellSwitchVariants, type CellSwitchVariants} from "./cell-switch.styles";
