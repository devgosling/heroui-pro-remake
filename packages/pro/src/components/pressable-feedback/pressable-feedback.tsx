"use client";

import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {useEffect, useMemo, useRef, useState} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {useMergedRef, useResolvedClassName} from "../../utils";

import {pressableFeedbackVariants} from "./pressable-feedback.styles";
import {useParentActivate, useParentHold} from "./use-parent-press";
import {useRipple} from "./use-ripple";

type Sweep = "right" | "left" | "down" | "up";

// Parts can be used standalone inside any host, so they read the BEM classes directly.
const slots = pressableFeedbackVariants();

/* -------------------------------------------------------------------------------------------------
 * Root - an unstyled pressable (RAC Button) that hosts the feedback layers
 * -----------------------------------------------------------------------------------------------*/
interface PressableFeedbackRootProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const PressableFeedbackRoot = ({children, className, ...rest}: PressableFeedbackRootProps) => {
  const resolvedClassName = useResolvedClassName(className, slots.base());

  return (
    <ButtonPrimitive {...rest} className={resolvedClassName} data-slot="pressable-feedback">
      {children}
    </ButtonPrimitive>
  );
};

PressableFeedbackRoot.displayName = "HeroUI.PressableFeedback";

/* -------------------------------------------------------------------------------------------------
 * Highlight - pure CSS state layer driven by the parent's hover / press state
 * -----------------------------------------------------------------------------------------------*/
interface PressableFeedbackHighlightProps extends ComponentPropsWithRef<"div"> {}

const PressableFeedbackHighlight = ({className, ...rest}: PressableFeedbackHighlightProps) => (
  <div
    aria-hidden="true"
    className={slots.highlight({className})}
    data-slot="pressable-feedback-highlight"
    {...rest}
  />
);

PressableFeedbackHighlight.displayName = "HeroUI.PressableFeedback.Highlight";

/* -------------------------------------------------------------------------------------------------
 * Ripple - Material 3 style press wave
 * -----------------------------------------------------------------------------------------------*/
interface PressableFeedbackRippleProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Duration in ms of the ripple grow animation. @default 150 */
  duration?: number;
  /** Opacity of the hover layer. @default 0.08 */
  hoverOpacity?: number;
  /** Opacity of the pressed wave. @default 0.12 */
  pressedOpacity?: number;
  /** Time in ms the pressed wave stays after the press ends. @default 225 */
  minimumPressDuration?: number;
  /** Disables the ripple. */
  isDisabled?: boolean;
}

const PressableFeedbackRipple = ({
  className,
  duration = 150,
  hoverOpacity,
  isDisabled,
  minimumPressDuration = 225,
  pressedOpacity,
  ref,
  style,
  ...rest
}: PressableFeedbackRippleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, containerRef);

  useRipple(containerRef, surfaceRef, {duration, isDisabled, minimumPressDuration});

  // Only write custom properties that differ from the CSS defaults.
  const resolvedStyle = useMemo(() => {
    const vars: Record<string, string | number> = {};

    if (hoverOpacity !== undefined)
      vars["--pressable-feedback-ripple-hover-opacity"] = hoverOpacity;
    if (pressedOpacity !== undefined)
      vars["--pressable-feedback-ripple-pressed-opacity"] = pressedOpacity;

    return Object.keys(vars).length ? ({...vars, ...style} as CSSProperties) : style;
  }, [hoverOpacity, pressedOpacity, style]);

  return (
    <div
      ref={mergedRef}
      aria-disabled={isDisabled ? "true" : undefined}
      aria-hidden="true"
      className={slots.ripple({className})}
      style={resolvedStyle}
      {...rest}
    >
      <div ref={surfaceRef} className={slots.rippleSurface()} />
    </div>
  );
};

PressableFeedbackRipple.displayName = "HeroUI.PressableFeedback.Ripple";

/* -------------------------------------------------------------------------------------------------
 * HoldConfirm - press and hold to reveal (clip-path sweep)
 * -----------------------------------------------------------------------------------------------*/
interface PressableFeedbackHoldConfirmProps extends ComponentPropsWithRef<"div"> {
  /** Hold duration in ms before the action is confirmed. @default 2000 */
  duration?: number;
  /** Duration in ms of the snap-back on release. @default 200 */
  releaseDuration?: number;
  /** Edge the reveal sweeps toward. @default "right" */
  sweep?: Sweep;
  /** Snap the overlay back once the hold completes. @default true */
  resetOnComplete?: boolean;
  /** Disables the overlay. */
  isDisabled?: boolean;
  /** Fired when the hold reaches the full duration. */
  onComplete?: () => void;
  /** Overlay content shown during the reveal. */
  children?: ReactNode;
}

const PressableFeedbackHoldConfirm = ({
  className,
  duration = 2000,
  isDisabled,
  onComplete,
  ref,
  releaseDuration = 200,
  resetOnComplete = true,
  style,
  sweep = "right",
  ...rest
}: PressableFeedbackHoldConfirmProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useParentHold(localRef, {
    isDisabled,
    onHoldEnd: () => {
      clearTimeout(timerRef.current);
      setIsHolding(false);
    },
    onHoldStart: () => {
      if (isComplete) return;
      clearTimeout(timerRef.current);
      setIsHolding(true);
      timerRef.current = setTimeout(() => {
        // With reset the overlay snaps back right away, even if the press is still held.
        setIsHolding(false);
        if (!resetOnComplete) setIsComplete(true);
        onComplete?.();
      }, duration);
    },
  });

  return (
    <div
      ref={mergedRef}
      aria-hidden="true"
      className={slots.holdConfirm({className})}
      data-complete={isComplete ? "true" : undefined}
      data-holding={isHolding ? "true" : undefined}
      data-slot="pressable-feedback-hold-confirm"
      data-sweep={sweep}
      style={
        {
          "--pressable-feedback-hold-confirm-duration": `${duration}ms`,
          "--pressable-feedback-hold-confirm-release-duration": `${releaseDuration}ms`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  );
};

PressableFeedbackHoldConfirm.displayName = "HeroUI.PressableFeedback.HoldConfirm";

/* -------------------------------------------------------------------------------------------------
 * ProgressFeedback - click once, the overlay sweeps in automatically
 * -----------------------------------------------------------------------------------------------*/
interface PressableFeedbackProgressFeedbackProps extends ComponentPropsWithRef<"div"> {
  /** Progress duration in ms before the action is confirmed. @default 2000 */
  duration?: number;
  /** Duration in ms of the snap-back on reset. @default 300 */
  releaseDuration?: number;
  /** Edge the reveal sweeps toward. @default "right" */
  sweep?: Sweep;
  /** Reset automatically after completing. @default true */
  autoReset?: boolean;
  /** Delay in ms before resetting after completion. @default 1500 */
  resetDelay?: number;
  /** Disables the overlay. */
  isDisabled?: boolean;
  /** Fired when the progress reaches the full duration. */
  onComplete?: () => void;
  /** Fired when the overlay resets back to idle. */
  onReset?: () => void;
  /** Overlay content shown during the reveal. */
  children?: ReactNode;
}

const PressableFeedbackProgressFeedback = ({
  autoReset = true,
  className,
  duration = 2000,
  isDisabled,
  onComplete,
  onReset,
  ref,
  releaseDuration = 300,
  resetDelay = 1500,
  style,
  sweep = "right",
  ...rest
}: PressableFeedbackProgressFeedbackProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const [phase, setPhase] = useState<"idle" | "progressing" | "complete">("idle");
  const phaseRef = useRef(phase);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  useParentActivate(
    localRef,
    () => {
      // Presses while progressing or complete are ignored.
      if (phaseRef.current !== "idle") return;
      phaseRef.current = "progressing";
      setPhase("progressing");

      timersRef.current.push(
        setTimeout(() => {
          phaseRef.current = "complete";
          setPhase("complete");
          onComplete?.();

          if (!autoReset) return;
          timersRef.current.push(
            setTimeout(() => {
              phaseRef.current = "idle";
              setPhase("idle");
              onReset?.();
            }, resetDelay),
          );
        }, duration),
      );
    },
    isDisabled,
  );

  return (
    <div
      ref={mergedRef}
      aria-hidden="true"
      className={slots.progressFeedback({className})}
      data-complete={phase === "complete" ? "true" : undefined}
      data-progressing={phase === "progressing" ? "true" : undefined}
      data-slot="pressable-feedback-progress-feedback"
      data-sweep={sweep}
      style={
        {
          "--pressable-feedback-progress-feedback-duration": `${duration}ms`,
          "--pressable-feedback-progress-feedback-release-duration": `${releaseDuration}ms`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    />
  );
};

PressableFeedbackProgressFeedback.displayName = "HeroUI.PressableFeedback.ProgressFeedback";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  PressableFeedbackRoot,
  PressableFeedbackHighlight,
  PressableFeedbackRipple,
  PressableFeedbackHoldConfirm,
  PressableFeedbackProgressFeedback,
};

export type {
  Sweep as PressableFeedbackSweep,
  PressableFeedbackRootProps,
  PressableFeedbackHighlightProps,
  PressableFeedbackRippleProps,
  PressableFeedbackHoldConfirmProps,
  PressableFeedbackProgressFeedbackProps,
};
