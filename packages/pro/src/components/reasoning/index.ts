import type {ComponentProps} from "react";

import {
  ReasoningContent,
  ReasoningDuration,
  ReasoningIndicator,
  ReasoningLabel,
  ReasoningLoader,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "./reasoning";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Reasoning = Object.assign(ReasoningRoot, {
  Content: ReasoningContent,
  Duration: ReasoningDuration,
  Indicator: ReasoningIndicator,
  Label: ReasoningLabel,
  Loader: ReasoningLoader,
  Root: ReasoningRoot,
  Text: ReasoningText,
  Trigger: ReasoningTrigger,
});

export type Reasoning = {
  Props: ComponentProps<typeof ReasoningRoot>;
  RootProps: ComponentProps<typeof ReasoningRoot>;
  TriggerProps: ComponentProps<typeof ReasoningTrigger>;
  LoaderProps: ComponentProps<typeof ReasoningLoader>;
  LabelProps: ComponentProps<typeof ReasoningLabel>;
  DurationProps: ComponentProps<typeof ReasoningDuration>;
  IndicatorProps: ComponentProps<typeof ReasoningIndicator>;
  ContentProps: ComponentProps<typeof ReasoningContent>;
  TextProps: ComponentProps<typeof ReasoningText>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ReasoningRoot,
  ReasoningTrigger,
  ReasoningLoader,
  ReasoningLabel,
  ReasoningDuration,
  ReasoningIndicator,
  ReasoningContent,
  ReasoningText,
  ReasoningContext,
} from "./reasoning";

export type {
  ReasoningStatus,
  ReasoningRootProps,
  ReasoningRootProps as ReasoningProps,
  ReasoningTriggerProps,
  ReasoningLoaderProps,
  ReasoningLabelProps,
  ReasoningLabelRenderProps,
  ReasoningDurationProps,
  ReasoningIndicatorProps,
  ReasoningContentProps,
  ReasoningTextProps,
} from "./reasoning";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {reasoningVariants, type ReasoningVariants} from "./reasoning.styles";
