import type {ComponentProps} from "react";

import {
  ApprovalCardActions,
  ApprovalCardContent,
  ApprovalCardContinue,
  ApprovalCardCustomInput,
  ApprovalCardDismiss,
  ApprovalCardFooter,
  ApprovalCardHeader,
  ApprovalCardOption,
  ApprovalCardOptions,
  ApprovalCardRoot,
  ApprovalCardSkip,
  ApprovalCardSkippedCount,
  ApprovalCardStep,
  ApprovalCardStepCount,
  ApprovalCardSteps,
  ApprovalCardTitle,
} from "./approval-card";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ApprovalCard = Object.assign(ApprovalCardRoot, {
  Actions: ApprovalCardActions,
  Content: ApprovalCardContent,
  Continue: ApprovalCardContinue,
  CustomInput: ApprovalCardCustomInput,
  Dismiss: ApprovalCardDismiss,
  Footer: ApprovalCardFooter,
  Header: ApprovalCardHeader,
  Option: ApprovalCardOption,
  Options: ApprovalCardOptions,
  Root: ApprovalCardRoot,
  Skip: ApprovalCardSkip,
  SkippedCount: ApprovalCardSkippedCount,
  Step: ApprovalCardStep,
  StepCount: ApprovalCardStepCount,
  Steps: ApprovalCardSteps,
  Title: ApprovalCardTitle,
});

export type ApprovalCard = {
  Props: ComponentProps<typeof ApprovalCardRoot>;
  RootProps: ComponentProps<typeof ApprovalCardRoot>;
  HeaderProps: ComponentProps<typeof ApprovalCardHeader>;
  TitleProps: ComponentProps<typeof ApprovalCardTitle>;
  DismissProps: ComponentProps<typeof ApprovalCardDismiss>;
  ContentProps: ComponentProps<typeof ApprovalCardContent>;
  OptionsProps: ComponentProps<typeof ApprovalCardOptions>;
  OptionProps: ComponentProps<typeof ApprovalCardOption>;
  CustomInputProps: ComponentProps<typeof ApprovalCardCustomInput>;
  FooterProps: ComponentProps<typeof ApprovalCardFooter>;
  StepsProps: ComponentProps<typeof ApprovalCardSteps>;
  StepProps: ComponentProps<typeof ApprovalCardStep>;
  StepCountProps: ComponentProps<typeof ApprovalCardStepCount>;
  SkippedCountProps: ComponentProps<typeof ApprovalCardSkippedCount>;
  ActionsProps: ComponentProps<typeof ApprovalCardActions>;
  SkipProps: ComponentProps<typeof ApprovalCardSkip>;
  ContinueProps: ComponentProps<typeof ApprovalCardContinue>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  ApprovalCardRoot,
  ApprovalCardHeader,
  ApprovalCardTitle,
  ApprovalCardDismiss,
  ApprovalCardContent,
  ApprovalCardOptions,
  ApprovalCardOption,
  ApprovalCardCustomInput,
  ApprovalCardFooter,
  ApprovalCardSteps,
  ApprovalCardStep,
  ApprovalCardStepCount,
  ApprovalCardSkippedCount,
  ApprovalCardActions,
  ApprovalCardSkip,
  ApprovalCardContinue,
} from "./approval-card";

export {ApprovalCardContext} from "./approval-card-context";

export type {
  ApprovalCardRootProps,
  ApprovalCardRootProps as ApprovalCardProps,
  ApprovalCardHeaderProps,
  ApprovalCardTitleProps,
  ApprovalCardDismissProps,
  ApprovalCardContentProps,
  ApprovalCardOptionsProps,
  ApprovalCardOptionProps,
  ApprovalCardCustomInputProps,
  ApprovalCardFooterProps,
  ApprovalCardStepsProps,
  ApprovalCardStepProps,
  ApprovalCardStepCountProps,
  ApprovalCardSkippedCountProps,
  ApprovalCardActionsProps,
  ApprovalCardSkipProps,
  ApprovalCardContinueProps,
  ApprovalCardSubmitResult,
  ApprovalCardSkippedCountRenderProps,
  ApprovalCardStepRenderProps,
  ApprovalCardStepCountRenderProps,
  ApprovalCardContinueRenderProps,
} from "./approval-card";

export type {
  ApprovalCardContextValue,
  ApprovalCardOptionItem,
  ApprovalCardQuestion,
  ApprovalCardAnswer,
  ApprovalCardValue,
} from "./approval-card-context";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {approvalCardVariants, type ApprovalCardVariants} from "./approval-card.styles";
