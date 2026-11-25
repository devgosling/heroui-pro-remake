"use client";

import type {
  StepperOrientation,
  StepperSize,
  StepperStatus,
  StepperStepState,
} from "./stepper-context";
import type {StepperVariants} from "./stepper.styles";
import type {CSSProperties, ComponentPropsWithRef, ReactElement, ReactNode} from "react";

import {Children, Fragment, isValidElement, use, useCallback, useMemo, useState} from "react";

import {
  StepperContext,
  StepperItemContext,
  StepperStepContext,
  useStepState,
  useStepperContext,
} from "./stepper-context";
import {stepperVariants} from "./stepper.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type StepperRenderChildren = ReactNode | ((state: StepperStepState) => ReactNode);

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/

/**
 * Flattens children (arrays and fragments) into keyed nodes. Fragment keys are prefixed so nodes
 * coming from different fragments never collide.
 */
function flattenChildren(children: ReactNode, prefix = ""): Array<{key: string; node: ReactNode}> {
  const result: Array<{key: string; node: ReactNode}> = [];

  Children.toArray(children).forEach((child, position) => {
    const key = `${prefix}${isValidElement(child) && child.key != null ? child.key : position}`;

    if (isValidElement(child) && child.type === Fragment) {
      const {children: fragmentChildren} = child.props as {children?: ReactNode};

      result.push(...flattenChildren(fragmentChildren, `${key}:`));

      return;
    }

    result.push({key, node: child});
  });

  return result;
}

function resolveRenderChildren(children: StepperRenderChildren, state: StepperStepState) {
  return typeof children === "function" ? children(state) : children;
}

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;

  return Math.min(1, Math.max(0, value));
}

const defaultSlots = stepperVariants();

/* -------------------------------------------------------------------------------------------------
 * Default checkmark (stroke drawn in via CSS on mount / when a step completes)
 * -----------------------------------------------------------------------------------------------*/
const StepperDefaultCheckmark = () => (
  <svg
    aria-hidden="true"
    data-slot="stepper-default-checkmark"
    fill="none"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2.5}
    viewBox="0 0 17 18"
  >
    <polyline points="1 9 7 14 15 4" />
  </svg>
);

/* -------------------------------------------------------------------------------------------------
 * Stepper Root
 * -----------------------------------------------------------------------------------------------*/
interface StepperRootProps extends Omit<ComponentPropsWithRef<"ol">, "children">, StepperVariants {
  /** The current active step index (controlled). */
  currentStep?: number;
  /** The initial step index (uncontrolled). @default 0 */
  defaultStep?: number;
  /** Called when a step is clicked. Providing it makes the steps interactive. */
  onStepChange?: (step: number) => void;
  /** Stepper steps. */
  children?: ReactNode;
}

const StepperRoot = ({
  "aria-label": ariaLabel = "Progress",
  children,
  className,
  currentStep,
  defaultStep = 0,
  onStepChange,
  orientation = "horizontal",
  size = "md",
  ...rest
}: StepperRootProps) => {
  const isControlled = currentStep !== undefined;
  const [uncontrolledStep, setUncontrolledStep] = useState(defaultStep);
  const activeStep = isControlled ? currentStep : uncontrolledStep;
  const isInteractive = onStepChange !== undefined;

  const slots = useMemo(() => stepperVariants({orientation, size}), [orientation, size]);

  const onStepPress = useCallback(
    (index: number) => {
      if (!isControlled) setUncontrolledStep(index);
      onStepChange?.(index);
    },
    [isControlled, onStepChange],
  );

  const contextValue = useMemo<StepperContext>(
    () => ({
      currentStep: activeStep,
      isInteractive,
      onStepPress,
      orientation,
      size,
      slots,
    }),
    [activeStep, isInteractive, onStepPress, orientation, size, slots],
  );

  const items = flattenChildren(children);

  return (
    <StepperContext value={contextValue}>
      <ol {...rest} aria-label={ariaLabel} className={slots.base({className})} data-slot="stepper">
        {items.map(({key, node}, index) => (
          <StepperItemContext key={key} value={{count: items.length, index}}>
            {node}
          </StepperItemContext>
        ))}
      </ol>
    </StepperContext>
  );
};

StepperRoot.displayName = "HeroUI.Stepper";

/* -------------------------------------------------------------------------------------------------
 * Stepper Step
 * -----------------------------------------------------------------------------------------------*/
interface StepperStepProps extends Omit<ComponentPropsWithRef<"li">, "children"> {
  /**
   * Step content (Indicator, Content, Separator, ...). Can be a function that receives the step
   * state (`index`, `status`, `isLast`).
   */
  children?: StepperRenderChildren;
}

const StepperStep = ({children, className, ...rest}: StepperStepProps) => {
  const stepper = useStepperContext();
  const {count, index} = use(StepperItemContext);

  const slots = stepper?.slots ?? defaultSlots;
  const currentStep = stepper?.currentStep ?? 0;
  const isInteractive = stepper?.isInteractive ?? false;
  const onStepPress = stepper?.onStepPress;

  const status: StepperStatus =
    index < currentStep ? "complete" : index === currentStep ? "active" : "inactive";
  const isLast = index === count - 1;

  const stepState = useMemo<StepperStepState>(
    () => ({index, isLast, status}),
    [index, isLast, status],
  );

  // The separator lives outside the (clickable) step button; everything else goes inside it.
  const inner: ReactElement[] = [];
  const outer: ReactElement[] = [];

  for (const {key, node} of flattenChildren(resolveRenderChildren(children, stepState))) {
    const isSeparator = isValidElement(node) && node.type === StepperSeparator;

    (isSeparator ? outer : inner).push(<Fragment key={key}>{node}</Fragment>);
  }

  const buttonProps = {
    "aria-current": status === "active" ? ("step" as const) : undefined,
    className: slots.stepButton(),
    "data-slot": "stepper-step-button",
  };

  return (
    <StepperStepContext value={stepState}>
      <li
        {...rest}
        className={slots.step({className})}
        data-index={index}
        data-slot="stepper-step"
        data-status={status}
      >
        {isInteractive ? (
          <button
            {...buttonProps}
            data-clickable="true"
            type="button"
            onClick={() => onStepPress?.(index)}
          >
            {inner}
          </button>
        ) : (
          <div {...buttonProps}>{inner}</div>
        )}
        {outer}
      </li>
    </StepperStepContext>
  );
};

StepperStep.displayName = "HeroUI.Stepper.Step";

/* -------------------------------------------------------------------------------------------------
 * Stepper Indicator
 * -----------------------------------------------------------------------------------------------*/
interface StepperIndicatorProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /**
   * Custom content overriding the default number / checkmark. Can be a function that receives the
   * step state; returning `undefined` (or omitting children) keeps the default content.
   */
  children?: StepperRenderChildren;
}

const StepperIndicator = ({children, className, ...rest}: StepperIndicatorProps) => {
  const stepper = useStepperContext();
  const stepState = useStepState();
  const slots = stepper?.slots ?? defaultSlots;

  const customContent = resolveRenderChildren(children, stepState);

  const content =
    customContent !== undefined ? (
      customContent
    ) : stepState.status === "complete" ? (
      <StepperIcon>
        <StepperDefaultCheckmark />
      </StepperIcon>
    ) : (
      <span>{stepState.index + 1}</span>
    );

  return (
    <span
      {...rest}
      className={slots.indicator({className})}
      data-slot="stepper-indicator"
      data-status={stepState.status}
    >
      {content}
    </span>
  );
};

StepperIndicator.displayName = "HeroUI.Stepper.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Stepper Content / Title / Description / Icon
 * -----------------------------------------------------------------------------------------------*/
interface StepperContentProps extends ComponentPropsWithRef<"span"> {}

const StepperContent = ({className, ...rest}: StepperContentProps) => {
  const slots = useStepperContext()?.slots ?? defaultSlots;

  return <span {...rest} className={slots.content({className})} data-slot="stepper-content" />;
};

StepperContent.displayName = "HeroUI.Stepper.Content";

interface StepperTitleProps extends ComponentPropsWithRef<"span"> {}

const StepperTitle = ({className, ...rest}: StepperTitleProps) => {
  const slots = useStepperContext()?.slots ?? defaultSlots;

  return <span {...rest} className={slots.title({className})} data-slot="stepper-title" />;
};

StepperTitle.displayName = "HeroUI.Stepper.Title";

interface StepperDescriptionProps extends ComponentPropsWithRef<"span"> {}

const StepperDescription = ({className, ...rest}: StepperDescriptionProps) => {
  const slots = useStepperContext()?.slots ?? defaultSlots;

  return (
    <span {...rest} className={slots.description({className})} data-slot="stepper-description" />
  );
};

StepperDescription.displayName = "HeroUI.Stepper.Description";

interface StepperIconProps extends ComponentPropsWithRef<"span"> {}

const StepperIcon = ({className, ...rest}: StepperIconProps) => {
  const slots = useStepperContext()?.slots ?? defaultSlots;

  return <span {...rest} className={slots.icon({className})} data-slot="stepper-icon" />;
};

StepperIcon.displayName = "HeroUI.Stepper.Icon";

/* -------------------------------------------------------------------------------------------------
 * Stepper Separator
 * -----------------------------------------------------------------------------------------------*/
interface StepperSeparatorProps extends ComponentPropsWithRef<"div"> {
  /** Explicit progress value (0-1). Auto-computed from `currentStep` when omitted. */
  progress?: number;
  /** Force rendering even on the last step. @default false */
  force?: boolean;
}

const StepperSeparator = ({className, force = false, progress, ...rest}: StepperSeparatorProps) => {
  const stepper = useStepperContext();
  const {isLast, status} = useStepState();
  const slots = stepper?.slots ?? defaultSlots;

  if (isLast && !force) return null;

  const value = clampProgress(progress ?? (status === "complete" ? 1 : 0));

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={slots.separator({className})}
      data-slot="stepper-separator"
    >
      <div
        className={slots.separatorTrack()}
        data-complete={value >= 1 ? "true" : undefined}
        data-slot="stepper-separator-track"
      >
        <div
          className={slots.separatorFill()}
          data-slot="stepper-separator-fill"
          style={{"--stepper-separator-progress": value} as CSSProperties}
        />
      </div>
    </div>
  );
};

StepperSeparator.displayName = "HeroUI.Stepper.Separator";

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  StepperRootProps,
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
};
