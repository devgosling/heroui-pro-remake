import type {ComponentProps} from "react";

import {
  PressableFeedbackHighlight,
  PressableFeedbackHoldConfirm,
  PressableFeedbackProgressFeedback,
  PressableFeedbackRipple,
  PressableFeedbackRoot,
} from "./pressable-feedback";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const PressableFeedback = Object.assign(PressableFeedbackRoot, {
  Highlight: PressableFeedbackHighlight,
  HoldConfirm: PressableFeedbackHoldConfirm,
  ProgressFeedback: PressableFeedbackProgressFeedback,
  Ripple: PressableFeedbackRipple,
  Root: PressableFeedbackRoot,
});

export type PressableFeedback = {
  Props: ComponentProps<typeof PressableFeedbackRoot>;
  RootProps: ComponentProps<typeof PressableFeedbackRoot>;
  HighlightProps: ComponentProps<typeof PressableFeedbackHighlight>;
  RippleProps: ComponentProps<typeof PressableFeedbackRipple>;
  HoldConfirmProps: ComponentProps<typeof PressableFeedbackHoldConfirm>;
  ProgressFeedbackProps: ComponentProps<typeof PressableFeedbackProgressFeedback>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  PressableFeedbackRoot,
  PressableFeedbackHighlight,
  PressableFeedbackRipple,
  PressableFeedbackHoldConfirm,
  PressableFeedbackProgressFeedback,
} from "./pressable-feedback";

export type {
  PressableFeedbackSweep,
  PressableFeedbackRootProps,
  PressableFeedbackRootProps as PressableFeedbackProps,
  PressableFeedbackHighlightProps,
  PressableFeedbackRippleProps,
  PressableFeedbackHoldConfirmProps,
  PressableFeedbackProgressFeedbackProps,
} from "./pressable-feedback";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  pressableFeedbackVariants,
  type PressableFeedbackVariants,
} from "./pressable-feedback.styles";
