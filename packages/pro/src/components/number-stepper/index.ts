import type {ComponentProps} from "react";

import {
  NumberStepperDecrementButton,
  NumberStepperGroup,
  NumberStepperIncrementButton,
  NumberStepperRoot,
  NumberStepperValue,
} from "./number-stepper";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * Subpath-only export (`@heroui/pro/number-stepper`) because it depends on `@number-flow/react`.
 * -----------------------------------------------------------------------------------------------*/
export const NumberStepper = Object.assign(NumberStepperRoot, {
  DecrementButton: NumberStepperDecrementButton,
  Group: NumberStepperGroup,
  IncrementButton: NumberStepperIncrementButton,
  Root: NumberStepperRoot,
  Value: NumberStepperValue,
});

export type NumberStepper = {
  Props: ComponentProps<typeof NumberStepperRoot>;
  RootProps: ComponentProps<typeof NumberStepperRoot>;
  GroupProps: ComponentProps<typeof NumberStepperGroup>;
  ValueProps: ComponentProps<typeof NumberStepperValue>;
  DecrementButtonProps: ComponentProps<typeof NumberStepperDecrementButton>;
  IncrementButtonProps: ComponentProps<typeof NumberStepperIncrementButton>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberStepperRoot,
  NumberStepperGroup,
  NumberStepperValue,
  NumberStepperDecrementButton,
  NumberStepperIncrementButton,
  NumberStepperContext,
} from "./number-stepper";

export type {
  NumberStepperRootProps,
  NumberStepperRootProps as NumberStepperProps,
  NumberStepperGroupProps,
  NumberStepperValueProps,
  NumberStepperValueRenderProps,
  NumberStepperButtonProps,
} from "./number-stepper";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {numberStepperVariants, type NumberStepperVariants} from "./number-stepper.styles";
