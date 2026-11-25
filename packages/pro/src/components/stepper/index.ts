import type {ComponentProps} from "react";

import {
  StepperContent,
  StepperDescription,
  StepperIcon,
  StepperIndicator,
  StepperRoot,
  StepperSeparator,
  StepperStep,
  StepperTitle,
} from "./stepper";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Stepper = Object.assign(StepperRoot, {
  Content: StepperContent,
  Description: StepperDescription,
  Icon: StepperIcon,
  Indicator: StepperIndicator,
  Root: StepperRoot,
  Separator: StepperSeparator,
  Step: StepperStep,
  Title: StepperTitle,
});

export type Stepper = {
  Props: ComponentProps<typeof StepperRoot>;
  RootProps: ComponentProps<typeof StepperRoot>;
  StepProps: ComponentProps<typeof StepperStep>;
  IndicatorProps: ComponentProps<typeof StepperIndicator>;
  ContentProps: ComponentProps<typeof StepperContent>;
  TitleProps: ComponentProps<typeof StepperTitle>;
  DescriptionProps: ComponentProps<typeof StepperDescription>;
  IconProps: ComponentProps<typeof StepperIcon>;
  SeparatorProps: ComponentProps<typeof StepperSeparator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  StepperRoot,
  StepperStep,
  StepperIndicator,
  StepperContent,
  StepperTitle,
  StepperDescription,
  StepperIcon,
  StepperSeparator,
} from "./stepper";

export {StepperContext, StepperStepContext, useStepperStep} from "./stepper-context";

export type {
  StepperRootProps,
  StepperRootProps as StepperProps,
  StepperStepProps,
  StepperIndicatorProps,
  StepperContentProps,
  StepperTitleProps,
  StepperDescriptionProps,
  StepperIconProps,
  StepperSeparatorProps,
  StepperStepState,
  StepperStatus,
  StepperOrientation,
  StepperSize,
} from "./stepper";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {stepperVariants, type StepperVariants} from "./stepper.styles";
