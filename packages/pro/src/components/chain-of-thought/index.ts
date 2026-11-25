import type {ComponentProps} from "react";

import {
  ChainOfThoughtContent,
  ChainOfThoughtRoot,
  ChainOfThoughtStep,
  ChainOfThoughtStepDescription,
  ChainOfThoughtStepTitle,
  ChainOfThoughtSteps,
  ChainOfThoughtTrigger,
} from "./chain-of-thought";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
// `Content`, `Steps` and `Trigger` are the deprecated beta parts (see chain-of-thought.tsx).
export const ChainOfThought = Object.assign(ChainOfThoughtRoot, {
  Content: ChainOfThoughtContent,
  Root: ChainOfThoughtRoot,
  Step: ChainOfThoughtStep,
  StepDescription: ChainOfThoughtStepDescription,
  StepTitle: ChainOfThoughtStepTitle,
  Steps: ChainOfThoughtSteps,
  Trigger: ChainOfThoughtTrigger,
});

export type ChainOfThought = {
  Props: ComponentProps<typeof ChainOfThoughtRoot>;
  RootProps: ComponentProps<typeof ChainOfThoughtRoot>;
  StepProps: ComponentProps<typeof ChainOfThoughtStep>;
  StepTitleProps: ComponentProps<typeof ChainOfThoughtStepTitle>;
  StepDescriptionProps: ComponentProps<typeof ChainOfThoughtStepDescription>;
  /** @deprecated */
  StepsProps: ComponentProps<typeof ChainOfThoughtSteps>;
  /** @deprecated */
  TriggerProps: ComponentProps<typeof ChainOfThoughtTrigger>;
  /** @deprecated */
  ContentProps: ComponentProps<typeof ChainOfThoughtContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ChainOfThoughtRoot,
  ChainOfThoughtStep,
  ChainOfThoughtStepTitle,
  ChainOfThoughtStepDescription,
  ChainOfThoughtSteps,
  ChainOfThoughtTrigger,
  ChainOfThoughtContent,
  ChainOfThoughtContext,
} from "./chain-of-thought";

export type {
  ChainOfThoughtRootProps,
  ChainOfThoughtRootProps as ChainOfThoughtProps,
  ChainOfThoughtStepProps,
  ChainOfThoughtStepTitleProps,
  ChainOfThoughtStepDescriptionProps,
  ChainOfThoughtStepsProps,
  ChainOfThoughtTriggerProps,
  ChainOfThoughtContentProps,
  ChainOfThoughtStatus,
  ChainOfThoughtStatusLabel,
  ChainOfThoughtStepStatus,
  ChainOfThoughtStepDisplayStatus,
  ChainOfThoughtStepStatusLabelRenderProps,
  ChainOfThoughtStepIndicatorRenderProps,
} from "./chain-of-thought";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {chainOfThoughtVariants, type ChainOfThoughtVariants} from "./chain-of-thought.styles";
