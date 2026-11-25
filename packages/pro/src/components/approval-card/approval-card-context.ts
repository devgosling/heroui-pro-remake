"use client";

import type {approvalCardVariants} from "./approval-card.styles";
import type {RefObject} from "react";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardOptionItem {
  /** Unique id of the option inside its question, used in `ApprovalCardAnswer.selected`. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional muted line under the label. */
  description?: string;
}

interface ApprovalCardQuestion {
  /** Unique id, used as the key in `ApprovalCardValue`. */
  id: string;
  /** Question shown in the header. */
  title: string;
  /**
   * Options in order; keys 1 to 9 pick them. Without options or `allowCustom`, the question is a
   * confirmation that Continue approves and Skip declines.
   */
  options?: ApprovalCardOptionItem[];
  /** Pick one option or several. @default "single" */
  selectionMode?: "single" | "multiple";
  /** Shows a text field for an answer that isn't listed. @default false */
  allowCustom?: boolean;
  /** Shows Skip. @default true */
  allowSkip?: boolean;
}

interface ApprovalCardAnswer {
  /** Picked option ids. */
  selected: string[];
  /** Typed answer. */
  custom?: string;
}

type ApprovalCardValue = Record<string, ApprovalCardAnswer>;

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
interface ApprovalCardContextValue {
  slots: ReturnType<typeof approvalCardVariants>;
  questions: ApprovalCardQuestion[];
  /** The shown question. */
  question: ApprovalCardQuestion | undefined;
  /** 0-based index of the shown question. */
  step: number;
  total: number;
  isLastStep: boolean;
  value: ApprovalCardValue;
  /** True after the first question change; plays the enter transition on swapped parts. */
  isSwapped: boolean;
  canContinue: boolean;
  skippedCount: number;
  titleId: string;
  stepsId: string;
  hasTitle: boolean;
  hasSteps: boolean;
  registerTitle: (id: string) => () => void;
  registerSteps: () => () => void;
  /** Question id whose step should take focus after the next render. */
  stepFocusRef: RefObject<string | null>;
  isQuestionAnswered: (question: ApprovalCardQuestion) => boolean;
  setSelected: (selected: string[]) => void;
  setCustom: (custom: string) => void;
  goToStep: (index: number, options?: {focusStep?: boolean}) => void;
  submitStep: () => void;
  skipStep: () => void;
  dismiss: () => void;
}

const ApprovalCardContext = createContext<ApprovalCardContextValue | null>(null);

function useApprovalCardContext(part: string): ApprovalCardContextValue {
  const context = use(ApprovalCardContext);

  if (!context) throw new Error(`<ApprovalCard.${part}> must be rendered inside <ApprovalCard>.`);

  return context;
}

export {ApprovalCardContext, useApprovalCardContext};

export type {
  ApprovalCardOptionItem,
  ApprovalCardQuestion,
  ApprovalCardAnswer,
  ApprovalCardValue,
  ApprovalCardContextValue,
};
