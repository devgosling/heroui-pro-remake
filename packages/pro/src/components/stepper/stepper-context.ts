"use client";

import type {stepperVariants} from "./stepper.styles";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type StepperStatus = "inactive" | "active" | "complete";

type StepperOrientation = "horizontal" | "vertical";

type StepperSize = "sm" | "md" | "lg";

/** Per-step state exposed by `useStepperStep` and to render-function children. */
interface StepperStepState {
  /** Zero-based step index. */
  index: number;
  /** Current step status. */
  status: StepperStatus;
  /** Whether this is the last step. */
  isLast: boolean;
}

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
type StepperContext = {
  slots: ReturnType<typeof stepperVariants>;
  orientation: StepperOrientation;
  size: StepperSize;
  currentStep: number;
  isInteractive: boolean;
  onStepPress: (index: number) => void;
};

const StepperContext = createContext<StepperContext | null>(null);

/** Index of a direct `Stepper` child, provided by the root. */
type StepperItemContext = {index: number; count: number};

const StepperItemContext = createContext<StepperItemContext>({count: 1, index: 0});

const StepperStepContext = createContext<StepperStepState | null>(null);

function useStepperContext() {
  return use(StepperContext);
}

/** Step state for internal parts; falls back to an inactive first step outside `Stepper.Step`. */
function useStepState(): StepperStepState {
  return use(StepperStepContext) ?? {index: 0, isLast: false, status: "inactive"};
}

/**
 * Access the per-step context (`index`, `status`, `isLast`) from any descendant of `Stepper.Step`.
 */
function useStepperStep(): StepperStepState {
  const context = use(StepperStepContext);

  if (!context) {
    throw new Error("useStepperStep must be used within a <Stepper.Step> component.");
  }

  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  StepperContext,
  StepperItemContext,
  StepperStepContext,
  useStepperContext,
  useStepState,
  useStepperStep,
};

export type {StepperStepState, StepperStatus, StepperOrientation, StepperSize};
