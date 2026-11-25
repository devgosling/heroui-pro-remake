"use client";

import type {ReasoningContentProps, ReasoningRootProps, ReasoningTriggerProps} from "../reasoning";
import type {ComponentPropsWithRef, ReactNode, RefObject} from "react";

import {
  Children,
  createContext,
  isValidElement,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {Loader} from "../loader";
import {ReasoningContent, ReasoningContext, ReasoningRoot, ReasoningTrigger} from "../reasoning";

import {chainOfThoughtVariants} from "./chain-of-thought.styles";

// The parts have no variants, so the slot functions can be shared by every instance.
const slots = chainOfThoughtVariants();

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/** Run status of a step list (the status of the enclosing Reasoning). */
type ChainOfThoughtStatus = "streaming" | "complete" | "stopped" | "error";

/** Status passed to `ChainOfThought.Step`. */
type ChainOfThoughtStepStatus = "complete" | "active" | "pending" | "error";

/** Status a step is shown with: an active step of a stopped / failed run reads as `interrupted`. */
type ChainOfThoughtStepDisplayStatus = ChainOfThoughtStepStatus | "interrupted";

interface ChainOfThoughtStepStatusLabelRenderProps {
  /** Display status of the step. */
  status: ChainOfThoughtStepDisplayStatus;
  /** Built-in English text for that status. */
  defaultLabel: string;
}

interface ChainOfThoughtStepIndicatorRenderProps {
  /** Display status of the step; `undefined` for a step without a status. */
  status?: ChainOfThoughtStepDisplayStatus;
}

type ChainOfThoughtStatusLabel = (
  renderProps: ChainOfThoughtStepStatusLabelRenderProps,
) => ReactNode;

const DEFAULT_STATUS_LABELS: Record<ChainOfThoughtStepDisplayStatus, string> = {
  active: "In progress",
  complete: "Completed",
  error: "Failed",
  interrupted: "Didn't finish",
  pending: "Not started",
};

/**
 * Display status of a step inside a run. `null` means the step is not rendered: once a run stopped
 * or failed, pending steps will never start, so they are dropped and the active one is interrupted.
 */
function getStepDisplayStatus(
  status: ChainOfThoughtStepStatus | undefined,
  runStatus: ChainOfThoughtStatus | undefined,
): ChainOfThoughtStepDisplayStatus | undefined | null {
  if (runStatus === "stopped" || runStatus === "error") {
    if (status === "active") return "interrupted";
    if (status === "pending") return null;
  }

  return status;
}

/** True when a custom status label rendered nothing, so the built-in text is kept. */
function isEmptyNode(node: ReactNode) {
  return node === undefined || node === null || node === false || node === "";
}

/* -------------------------------------------------------------------------------------------------
 * Context
 *
 * A list takes its run status from its own `status` prop, else from `ChainOfThoughtContext` (set by
 * the deprecated beta root, or by an app that passes a status / label renderer down), else from the
 * enclosing Reasoning ("complete" outside one). The list hands its resolved values to its own steps
 * through an internal context, so a list nested in step content resolves its own.
 * -----------------------------------------------------------------------------------------------*/
type ChainOfThoughtContext = {
  status?: ChainOfThoughtStatus;
  statusLabel?: ChainOfThoughtStatusLabel;
};

const ChainOfThoughtContext = createContext<ChainOfThoughtContext>({});

type ChainOfThoughtListContext = {
  status: ChainOfThoughtStatus;
  statusLabel?: ChainOfThoughtStatusLabel;
};

const ChainOfThoughtListContext = createContext<ChainOfThoughtListContext>({status: "complete"});

/* -------------------------------------------------------------------------------------------------
 * Chain Of Thought List (the `ol`)
 * -----------------------------------------------------------------------------------------------*/
interface ChainOfThoughtListProps extends Omit<ComponentPropsWithRef<"ol">, "className"> {
  /**
   * Run status. Defaults to the enclosing Reasoning status, or `"complete"` outside one.
   */
  status?: ChainOfThoughtStatus;
  /**
   * Visually hidden status text read before each step. An empty result keeps the built-in text.
   */
  statusLabel?: ChainOfThoughtStatusLabel;
  className?: string;
}

const ChainOfThoughtList = ({
  children,
  className,
  status,
  statusLabel,
  ...rest
}: ChainOfThoughtListProps) => {
  const inherited = use(ChainOfThoughtContext);
  const reasoning = use(ReasoningContext);
  const resolvedStatus = status ?? inherited.status ?? reasoning.status;
  const resolvedStatusLabel = statusLabel ?? inherited.statusLabel;

  const contextValue = useMemo<ChainOfThoughtListContext>(
    () => ({status: resolvedStatus, statusLabel: resolvedStatusLabel}),
    [resolvedStatus, resolvedStatusLabel],
  );

  return (
    <ChainOfThoughtListContext value={contextValue}>
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- `list-style: none` drops the implicit list role in WebKit/VoiceOver, so it is restated */}
      <ol
        {...rest}
        className={slots.base({className})}
        data-slot="chain-of-thought"
        data-status={resolvedStatus}
        // `list-style: none` drops the list role in WebKit, so it is set explicitly
        role="list"
      >
        {children}
      </ol>
    </ChainOfThoughtListContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Chain Of Thought Root
 * -----------------------------------------------------------------------------------------------*/
interface ChainOfThoughtRootProps extends Omit<ChainOfThoughtListProps, "className"> {
  /**
   * Additional classes. A function is only accepted by the deprecated beta root (it receives the
   * Disclosure render props).
   */
  className?: ReasoningRootProps["className"];
  /** @deprecated Use `status="streaming"` on Reasoning. */
  isStreaming?: boolean;
  /** @deprecated Use `defaultExpanded` on Reasoning. */
  defaultExpanded?: boolean;
  /** @deprecated Use `isExpanded` on Reasoning. */
  isExpanded?: boolean;
  /** @deprecated Use `onExpandedChange` on Reasoning. */
  onExpandedChange?: (isExpanded: boolean) => void;
  /** @deprecated Use `isDisabled` on Reasoning. */
  isDisabled?: boolean;
}

const ChainOfThoughtRoot = ({
  className,
  defaultExpanded,
  isDisabled,
  isExpanded,
  isStreaming,
  onExpandedChange,
  ...rest
}: ChainOfThoughtRootProps) => {
  const isLegacy =
    isStreaming !== undefined ||
    defaultExpanded !== undefined ||
    isExpanded !== undefined ||
    onExpandedChange !== undefined ||
    isDisabled !== undefined ||
    typeof className === "function" ||
    hasLegacyChild(rest.children);

  if (isLegacy) {
    return (
      <ChainOfThoughtLegacyRoot
        {...rest}
        className={className}
        defaultExpanded={defaultExpanded}
        isDisabled={isDisabled}
        isExpanded={isExpanded}
        isStreaming={isStreaming}
        onExpandedChange={onExpandedChange}
      />
    );
  }

  return <ChainOfThoughtList {...rest} className={className as string | undefined} />;
};

ChainOfThoughtRoot.displayName = "HeroUI.ChainOfThought";

/* -------------------------------------------------------------------------------------------------
 * Step indicator helpers
 * -----------------------------------------------------------------------------------------------*/
const glyphClass = (glyph: "none" | ChainOfThoughtStepDisplayStatus) =>
  `${slots.stepGlyph()} chain-of-thought__step-glyph--${glyph}`;

const StepCheck = () => (
  <svg
    aria-hidden="true"
    className={slots.stepCheck()}
    data-slot="chain-of-thought-check"
    fill="none"
    viewBox="0 0 10 10"
  >
    <path d="M2.5 5.25 4.25 7 7.5 3.25" stroke="currentColor" />
  </svg>
);

const StepCross = () => (
  <svg
    aria-hidden="true"
    className={slots.stepCross()}
    data-slot="chain-of-thought-cross"
    fill="none"
    viewBox="0 0 10 10"
  >
    <path d="M3 3 7 7M7 3 3 7" stroke="currentColor" />
  </svg>
);

/**
 * Keeps the active ring mounted while the active glyph fades out, then unmounts it so finished
 * steps do not keep a spinning SVG around. Waits for the glyph's own opacity transition; without a
 * running transition (reduced motion, hidden glyph) it unmounts on the next microtask.
 */
function useActiveLoaderPresence(isActive: boolean, glyphRef: RefObject<HTMLElement | null>) {
  const [wasActive, setWasActive] = useState(isActive);
  const [isLeaving, setIsLeaving] = useState(false);

  if (wasActive !== isActive) {
    setWasActive(isActive);
    setIsLeaving(!isActive);
  }

  useEffect(() => {
    if (!isLeaving) return;

    let isCancelled = false;
    const glyph = glyphRef.current;
    const animations =
      glyph && typeof glyph.getAnimations === "function" ? glyph.getAnimations() : [];

    Promise.all(animations.map((animation) => animation.finished))
      .catch(() => undefined)
      .then(() => {
        if (!isCancelled) setIsLeaving(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [glyphRef, isLeaving]);

  return isActive || isLeaving;
}

/* -------------------------------------------------------------------------------------------------
 * Chain Of Thought Step
 * -----------------------------------------------------------------------------------------------*/
interface ChainOfThoughtStepProps extends ComponentPropsWithRef<"li"> {
  /**
   * Step status. Without it, the step shows a neutral dot and has no hidden status text.
   */
  status?: ChainOfThoughtStepStatus;
  /**
   * A node replaces the complete check and keeps its disc; a function draws the whole mark for
   * every status and also receives `interrupted`.
   */
  indicator?: ReactNode | ((renderProps: ChainOfThoughtStepIndicatorRenderProps) => ReactNode);
  /** @deprecated Use a `ChainOfThought.StepTitle` child. */
  label?: ReactNode;
}

const ChainOfThoughtStep = ({
  children,
  className,
  indicator,
  label,
  status,
  ...rest
}: ChainOfThoughtStepProps) => {
  const {status: runStatus, statusLabel} = use(ChainOfThoughtListContext);
  const displayStatus = getStepDisplayStatus(status, runStatus);

  const activeGlyphRef = useRef<HTMLSpanElement>(null);
  const isLoaderMounted = useActiveLoaderPresence(displayStatus === "active", activeGlyphRef);

  // Pending steps of a stopped / failed run are dropped (an empty list is hidden by CSS).
  if (displayStatus === null) return null;

  let statusText: ReactNode = null;

  if (displayStatus !== undefined) {
    const defaultLabel = DEFAULT_STATUS_LABELS[displayStatus];
    const customLabel = statusLabel?.({defaultLabel, status: displayStatus});

    statusText = isEmptyNode(customLabel) ? defaultLabel : customLabel;
  }

  const mark =
    typeof indicator === "function" ? (
      indicator({status: displayStatus})
    ) : (
      <>
        <span className={glyphClass("none")} />
        <span className={glyphClass("complete")}>
          {indicator === undefined || indicator === null ? <StepCheck /> : indicator}
        </span>
        <span ref={activeGlyphRef} className={glyphClass("active")}>
          {isLoaderMounted ? (
            <Loader aria-hidden="true" color="accent" size="sm" variant="ring" />
          ) : null}
        </span>
        <span className={glyphClass("error")}>
          <StepCross />
        </span>
        <span className={glyphClass("interrupted")} />
        <svg
          aria-hidden="true"
          className={glyphClass("pending")}
          data-slot="chain-of-thought-pending"
          fill="none"
          viewBox="0 0 18 18"
        >
          {/* pathLength 20 + dasharray 1 draws ten even dashes */}
          <circle cx="9" cy="9" pathLength="20" r="6.25" stroke="currentColor" />
        </svg>
      </>
    );

  return (
    <li
      aria-current={displayStatus === "active" ? "step" : undefined}
      {...rest}
      className={slots.step({className})}
      data-slot="chain-of-thought-step"
      data-status={displayStatus}
    >
      <span
        aria-hidden="true"
        className={slots.stepIndicator()}
        data-slot="chain-of-thought-step-indicator"
        data-status={displayStatus}
      >
        <span className={slots.stepMark()} data-slot="chain-of-thought-step-mark">
          {mark}
        </span>
      </span>
      <div className={slots.stepBody()} data-slot="chain-of-thought-step-body">
        {statusText !== null ? (
          <span className={slots.stepStatus()} data-slot="chain-of-thought-step-status">
            {statusText}
          </span>
        ) : null}
        {label !== undefined && label !== null ? (
          <ChainOfThoughtStepTitle>{label}</ChainOfThoughtStepTitle>
        ) : null}
        {children}
      </div>
    </li>
  );
};

ChainOfThoughtStep.displayName = "HeroUI.ChainOfThought.Step";

/* -------------------------------------------------------------------------------------------------
 * Chain Of Thought Step Title
 * -----------------------------------------------------------------------------------------------*/
interface ChainOfThoughtStepTitleProps extends ComponentPropsWithRef<"div"> {}

const ChainOfThoughtStepTitle = ({children, className, ...rest}: ChainOfThoughtStepTitleProps) => (
  <div {...rest} className={slots.stepTitle({className})} data-slot="chain-of-thought-step-title">
    {children}
  </div>
);

ChainOfThoughtStepTitle.displayName = "HeroUI.ChainOfThought.StepTitle";

/* -------------------------------------------------------------------------------------------------
 * Chain Of Thought Step Description
 * -----------------------------------------------------------------------------------------------*/
interface ChainOfThoughtStepDescriptionProps extends ComponentPropsWithRef<"div"> {}

const ChainOfThoughtStepDescription = ({
  children,
  className,
  ...rest
}: ChainOfThoughtStepDescriptionProps) => (
  <div
    {...rest}
    className={slots.stepDescription({className})}
    data-slot="chain-of-thought-step-description"
  >
    {children}
  </div>
);

ChainOfThoughtStepDescription.displayName = "HeroUI.ChainOfThought.StepDescription";

/* -------------------------------------------------------------------------------------------------
 * Deprecated beta API
 *
 * In beta, ChainOfThought was itself the disclosure (Trigger + Content + Steps). A deprecated prop
 * or a direct Trigger / Content / Steps child renders a Reasoning in place of the list; the other
 * beta Disclosure props go to that Reasoning, and root `status` / `statusLabel` reach every list
 * inside it unless a list sets its own.
 * -----------------------------------------------------------------------------------------------*/

/** @deprecated Render `ChainOfThought` itself (the step list). */
interface ChainOfThoughtStepsProps extends ChainOfThoughtListProps {}

/** @deprecated Render `ChainOfThought` itself and put `ChainOfThought.Step` directly inside it. */
const ChainOfThoughtSteps = (props: ChainOfThoughtStepsProps) => <ChainOfThoughtList {...props} />;

ChainOfThoughtSteps.displayName = "HeroUI.ChainOfThought.Steps";

/** @deprecated Use `Reasoning.Trigger`. */
interface ChainOfThoughtTriggerProps extends ReasoningTriggerProps {}

/** @deprecated Use `Reasoning.Trigger`. */
const ChainOfThoughtTrigger = (props: ChainOfThoughtTriggerProps) => (
  <ReasoningTrigger {...props} />
);

ChainOfThoughtTrigger.displayName = "HeroUI.ChainOfThought.Trigger";

/** @deprecated Use `Reasoning.Content`. */
interface ChainOfThoughtContentProps extends ReasoningContentProps {}

/** @deprecated Use `Reasoning.Content`. */
const ChainOfThoughtContent = (props: ChainOfThoughtContentProps) => (
  <ReasoningContent {...props} />
);

ChainOfThoughtContent.displayName = "HeroUI.ChainOfThought.Content";

function hasLegacyChild(children: ReactNode) {
  return Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      (child.type === ChainOfThoughtTrigger ||
        child.type === ChainOfThoughtContent ||
        child.type === ChainOfThoughtSteps),
  );
}

interface ChainOfThoughtLegacyRootProps extends Omit<ChainOfThoughtRootProps, "ref"> {}

/** The beta root: a Reasoning that takes the beta Disclosure props and passes its status down. */
const ChainOfThoughtLegacyRoot = ({
  children,
  className,
  defaultExpanded,
  id,
  isDisabled,
  isExpanded,
  isStreaming,
  onExpandedChange,
  slot,
  status,
  statusLabel,
  style,
}: ChainOfThoughtLegacyRootProps) => {
  const resolvedStatus = status ?? (isStreaming ? "streaming" : "complete");

  // The Reasoning below carries the status too; the context also passes the label renderer down.
  const contextValue = useMemo<ChainOfThoughtContext>(
    () => ({status: resolvedStatus, statusLabel}),
    [resolvedStatus, statusLabel],
  );

  return (
    <ChainOfThoughtContext value={contextValue}>
      <ReasoningRoot
        className={className}
        defaultExpanded={defaultExpanded}
        id={id}
        isDisabled={isDisabled}
        isExpanded={isExpanded}
        slot={slot}
        status={resolvedStatus}
        style={style}
        onExpandedChange={onExpandedChange}
      >
        {children}
      </ReasoningRoot>
    </ChainOfThoughtContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};

export type {
  ChainOfThoughtRootProps,
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
};
