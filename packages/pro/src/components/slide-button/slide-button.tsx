"use client";

import type {
  SlideButtonActions,
  SlideButtonContextValue,
  SlideButtonRenderProps,
  SlideButtonRootAnimation,
  SlideButtonThumbAnimation,
  SlideButtonVariant,
} from "./slide-button-context";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from "react";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusRing} from "react-aria/useFocusRing";
import {cx} from "tailwind-variants";

import {useMergedRef} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {SlideButtonContext, useSlideButtonContext} from "./slide-button-context";
import {
  animateSpring,
  clamp01,
  createSlideButtonStore,
  prefersReducedMotion,
} from "./slide-button-store";
import {slideButtonVariants} from "./slide-button.styles";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
type SlotClassNames<Slot extends string> = Partial<Record<Slot, string>>;
type SlotStyles<Slot extends string> = Partial<Record<Slot, CSSProperties>>;

/** Slots of the root: the padded track and the inner area the thumb travels in. */
type SlideButtonRootSlots = "container" | "contentContainer";
/** Slots of Underlay/OverlayContent: the clip wrapper and the full-track-width content. */
type SlideButtonContentSlots = "container" | "contentContainer";

/**
 * Pointer events produced by assistive technology instead of a finger or mouse (TalkBack double
 * tap, iOS VoiceOver): no contact geometry. Same heuristic React Aria uses for "virtual" presses.
 */
const isVirtualPointerEvent = (event: globalThis.PointerEvent) =>
  (event.width === 0 && event.height === 0) ||
  (event.width === 1 &&
    event.height === 1 &&
    event.pressure === 0 &&
    event.detail === 0 &&
    event.pointerType === "mouse");

const isRtl = (element: Element) => window.getComputedStyle(element).direction === "rtl";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface SlideButtonRootProps extends Omit<ComponentPropsWithRef<"div">, "children" | "onReset"> {
  /** Children elements, or a render function receiving the slide state. */
  children?: ReactNode | ((props: SlideButtonRenderProps) => ReactNode);
  /** Visual variant controlling the color scheme. @default "default" */
  variant?: SlideButtonVariant;
  /** Whether the slide action has completed (controlled). */
  isCompleted?: boolean;
  /** Initial completed state (uncontrolled). @default false */
  isDefaultCompleted?: boolean;
  /** Whether the component is disabled. @default false */
  isDisabled?: boolean;
  /** Progress threshold (0-1) at which releasing the thumb triggers the action. @default 0.85 */
  completionThreshold?: number;
  /** Whether the slider automatically resets after completion. @default false */
  autoReset?: boolean;
  /** Delay in milliseconds before the auto reset. @default 1000 */
  autoResetDelay?: number;
  /**
   * Background layer behind the track content (typically a `SlideButton.ContainerBackground`).
   * The web has no theme-registered default, so `undefined` and `null` both render nothing.
   */
  background?: ReactNode;
  /** Additional CSS classes for the slots. `className` is applied to `container`. */
  classNames?: SlotClassNames<SlideButtonRootSlots>;
  /** Inline styles for the slots. `style` is applied to `container`. */
  styles?: SlotStyles<SlideButtonRootSlots>;
  /** Called when the completed state changes. */
  onCompleteChange?: (isCompleted: boolean) => void;
  /** Called when the slide action completes. */
  onComplete?: () => void;
  /** Called when the slider resets to the start (auto reset, `reset()` or controlled change). */
  onReset?: () => void;
  /** Animation configuration of the root (reset spring). */
  animation?: SlideButtonRootAnimation;
  /**
   * Whether a haptic plays when the action completes. Defaults to the nearest `HapticsProvider`
   * (enabled when there is none).
   */
  isHapticFeedbackEnabled?: boolean;
}

const SlideButtonRoot = ({
  animation,
  autoReset = false,
  autoResetDelay = 1000,
  background,
  children,
  className,
  classNames,
  completionThreshold = 0.85,
  isCompleted: isCompletedProp,
  isDefaultCompleted = false,
  isDisabled = false,
  isHapticFeedbackEnabled,
  onComplete,
  onCompleteChange,
  onReset,
  ref,
  style,
  styles,
  variant = "default",
  ...rest
}: SlideButtonRootProps) => {
  const slots = useMemo(() => slideButtonVariants({variant}), [variant]);
  const [uncontrolledCompleted, setUncontrolledCompleted] = useState(isDefaultCompleted);
  const isControlled = isCompletedProp !== undefined;
  const isCompleted = isCompletedProp ?? uncontrolledCompleted;
  const [store] = useState(() => createSlideButtonStore(isCompleted ? 1 : 0));
  const [isDragging, setIsDragging] = useState(false);
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const underlayId = useId();

  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);

  /* Animation bookkeeping ----------------------------------------------------------------------*/
  const cancelAnimationRef = useRef<(() => void) | null>(null);
  /** Where the thumb is heading (null while it follows a pointer). */
  const targetRef = useRef<number | null>(isCompleted ? 1 : 0);
  const thumbAnimationRef = useRef<SlideButtonThumbAnimation | undefined>(undefined);
  const isCompletedRef = useRef(isCompleted);
  const previousCompletedRef = useRef(isCompleted);
  /** Set by a user completion; the overlay text is announced once the completed render commits. */
  const announceRef = useRef(false);

  /** Latest props for the stable actions handed to the parts. */
  const latestRef = useRef({
    animation,
    completionThreshold,
    haptic,
    isControlled,
    onComplete,
    onCompleteChange,
  });

  useIsomorphicLayoutEffect(() => {
    latestRef.current = {
      animation,
      completionThreshold,
      haptic,
      isControlled,
      onComplete,
      onCompleteChange,
    };
    isCompletedRef.current = isCompleted;
  });

  const animateTo = useCallback(
    (to: number, kind: "thumb" | "reset", velocity = 0) => {
      cancelAnimationRef.current?.();
      cancelAnimationRef.current = null;
      targetRef.current = to;

      const from = store.getProgress();
      const rootAnimation = latestRef.current.animation;
      const thumbAnimation = thumbAnimationRef.current;
      const isOwnAnimationDisabled =
        kind === "reset"
          ? rootAnimation === false || rootAnimation === "disabled"
          : thumbAnimation === false || thumbAnimation === "disabled";

      if (
        from === to ||
        isOwnAnimationDisabled ||
        rootAnimation === "disable-all" ||
        prefersReducedMotion()
      ) {
        store.setProgress(to);

        return;
      }

      const config =
        kind === "reset"
          ? typeof rootAnimation === "object"
            ? rootAnimation.resetSpringConfig
            : undefined
          : typeof thumbAnimation === "object"
            ? thumbAnimation.springConfig
            : undefined;

      cancelAnimationRef.current = animateSpring({
        config,
        from,
        onComplete: () => {
          cancelAnimationRef.current = null;
        },
        // The thumb stops at the track ends instead of swinging past them after a fling.
        onUpdate: (value) => store.setProgress(clamp01(value)),
        overshootClamping: true,
        to,
        velocity,
      });
    },
    [store],
  );

  /** Completes the action. Runs synchronously inside the pointer / keyboard handler. */
  const complete = useCallback(
    (velocity = 0) => {
      if (isCompletedRef.current) return;

      const latest = latestRef.current;

      isCompletedRef.current = true;
      // iOS only plays haptics during a user gesture: this runs inside pointerup / keydown / click.
      latest.haptic("medium");
      announceRef.current = true;

      if (!latest.isControlled) setUncontrolledCompleted(true);
      latest.onCompleteChange?.(true);
      latest.onComplete?.();
      animateTo(1, "thumb", velocity);
    },
    [animateTo],
  );

  const reset = useCallback(() => {
    const latest = latestRef.current;
    const wasCompleted = isCompletedRef.current;

    isCompletedRef.current = false;
    announceRef.current = false;
    if (liveRef.current) liveRef.current.textContent = "";
    if (!latest.isControlled) setUncontrolledCompleted(false);
    if (wasCompleted) latest.onCompleteChange?.(false);
    animateTo(0, "reset");
  }, [animateTo]);

  const actions = useMemo<SlideButtonActions>(
    () => ({
      beginDrag: () => {
        cancelAnimationRef.current?.();
        cancelAnimationRef.current = null;
        targetRef.current = null;
        setIsDragging(true);
      },
      cancelDrag: (velocity) => {
        setIsDragging(false);
        animateTo(0, "thumb", velocity);
      },
      complete: () => complete(0),
      endDrag: (velocity) => {
        setIsDragging(false);
        if (store.getProgress() >= latestRef.current.completionThreshold) {
          complete(velocity);
        } else {
          animateTo(0, "thumb", velocity);
        }
      },
      reset,
      setProgress: store.setProgress,
      setThumbAnimation: (thumbAnimation) => {
        thumbAnimationRef.current = thumbAnimation;
      },
    }),
    [animateTo, complete, reset, store],
  );

  /* Follow external completion changes (controlled prop, reset) --------------------------------*/
  const fireReset = useEffectEvent(() => onReset?.());

  useEffect(() => {
    if (previousCompletedRef.current === isCompleted) return;
    previousCompletedRef.current = isCompleted;

    if (isCompleted) {
      if (targetRef.current !== 1) animateTo(1, "thumb");
      if (announceRef.current) {
        announceRef.current = false;
        // Read after the completed render committed, so content that switches on `isCompleted`
        // (render-function children) is announced in its final form.
        const overlay = rootRef.current?.querySelector(
          '[data-slot="slide-button-overlay-content-container"]',
        );

        if (liveRef.current) liveRef.current.textContent = overlay?.textContent?.trim() ?? "";
      }
    } else {
      if (liveRef.current) liveRef.current.textContent = "";
      if (targetRef.current !== 0 && targetRef.current !== null) animateTo(0, "reset");
      fireReset();
    }
  }, [animateTo, isCompleted]);

  /* Auto reset -----------------------------------------------------------------------------------*/
  const runAutoReset = useEffectEvent(() => reset());

  useEffect(() => {
    if (!isCompleted || !autoReset) return;

    const timeout = window.setTimeout(runAutoReset, Math.max(0, autoResetDelay));

    return () => window.clearTimeout(timeout);
  }, [autoReset, autoResetDelay, isCompleted]);

  /* Cancel a running spring on unmount ---------------------------------------------------------*/
  useEffect(
    () => () => {
      cancelAnimationRef.current?.();
    },
    [],
  );

  /* Mirror progress + thumb width into CSS custom properties (no React render per frame) ---------*/
  useIsomorphicLayoutEffect(() => {
    const element = rootRef.current;

    if (!element) return;

    const write = () => {
      const {thumbWidth} = store.getMetrics();

      element.style.setProperty("--slide-button-progress", String(store.getProgress()));
      if (thumbWidth > 0) {
        element.style.setProperty("--slide-button-thumb-width", `${thumbWidth}px`);
      }
    };

    write();

    return store.subscribe(write);
  }, [store]);

  /* Measure the track (content container) ------------------------------------------------------*/
  useIsomorphicLayoutEffect(() => {
    const element = contentRef.current;

    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      store.setMetrics({trackHeight: element.clientHeight, trackWidth: element.clientWidth});
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [store]);

  /* Render-function children re-render with the progress; plain children do not ----------------*/
  const isRenderFunction = typeof children === "function";
  const subscribe = useCallback(
    (listener: () => void) => (isRenderFunction ? store.subscribe(listener) : () => {}),
    [isRenderFunction, store],
  );
  const progress = useSyncExternalStore(subscribe, store.getProgress, store.getProgress);
  const metrics = useSyncExternalStore(subscribe, store.getMetrics, store.getMetrics);

  const contextValue = useMemo<SlideButtonContextValue>(
    () => ({
      actions,
      completionThreshold,
      isCompleted,
      isDisabled,
      isDragging,
      slots,
      store,
      underlayId,
      variant,
    }),
    [
      actions,
      completionThreshold,
      isCompleted,
      isDisabled,
      isDragging,
      slots,
      store,
      underlayId,
      variant,
    ],
  );

  const resolvedChildren =
    typeof children === "function"
      ? children({...metrics, isCompleted, isDisabled, progress, variant})
      : children;

  return (
    <SlideButtonContext value={contextValue}>
      <div
        {...rest}
        ref={mergedRef}
        className={slots.base({className: cx(classNames?.container, className)})}
        data-completed={isCompleted || undefined}
        data-disabled={isDisabled || undefined}
        data-dragging={isDragging || undefined}
        data-slot="slide-button"
        data-variant={variant}
        style={
          {
            "--slide-button-progress": progress,
            ...styles?.container,
            ...style,
          } as CSSProperties
        }
      >
        {background}
        <div
          ref={contentRef}
          className={slots.content({className: classNames?.contentContainer})}
          data-slot="slide-button-content-container"
          style={styles?.contentContainer}
        >
          {resolvedChildren}
        </div>
        {/* Announces the overlay label (e.g. "Confirmed!") when the action completes. */}
        <span ref={liveRef} aria-live="polite" className={slots.live()} role="status" />
      </div>
    </SlideButtonContext>
  );
};

SlideButtonRoot.displayName = "HeroUI.SlideButton";

/* -------------------------------------------------------------------------------------------------
 * ContainerBackground
 * -----------------------------------------------------------------------------------------------*/
interface SlideButtonContainerBackgroundProps extends ComponentPropsWithRef<"div"> {}

/** Absolute-fill layer behind the track content; pass it through the root `background` prop. */
const SlideButtonContainerBackground = ({
  children,
  className,
  ...rest
}: SlideButtonContainerBackgroundProps) => {
  const {slots} = useSlideButtonContext("ContainerBackground");

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={slots.background({className})}
      data-slot="slide-button-container-background"
    >
      {children}
    </div>
  );
};

SlideButtonContainerBackground.displayName = "HeroUI.SlideButton.ContainerBackground";

/* -------------------------------------------------------------------------------------------------
 * UnderlayContent
 * -----------------------------------------------------------------------------------------------*/
interface SlideButtonUnderlayContentProps extends ComponentPropsWithRef<"div"> {
  /** Additional CSS classes for the slots. `className` is applied to `container`. */
  classNames?: SlotClassNames<SlideButtonContentSlots>;
  /** Inline styles for the slots. `style` is applied to `container`. */
  styles?: SlotStyles<SlideButtonContentSlots>;
}

/**
 * Static content beneath the overlay. The clip wrapper is anchored to the end of the track and
 * shrinks as the thumb slides, so the content stays put and is only revealed right of the thumb.
 */
const SlideButtonUnderlayContent = ({
  children,
  className,
  classNames,
  style,
  styles,
  ...rest
}: SlideButtonUnderlayContentProps) => {
  const {slots, underlayId} = useSlideButtonContext("UnderlayContent");

  return (
    <div
      {...rest}
      aria-hidden="true"
      className={slots.underlay({className: cx(classNames?.container, className)})}
      data-slot="slide-button-underlay-content"
      style={{...styles?.container, ...style}}
    >
      <div
        className={slots.underlayContent({className: classNames?.contentContainer})}
        data-slot="slide-button-underlay-content-container"
        id={underlayId}
        style={styles?.contentContainer}
      >
        {children}
      </div>
    </div>
  );
};

SlideButtonUnderlayContent.displayName = "HeroUI.SlideButton.UnderlayContent";

/* -------------------------------------------------------------------------------------------------
 * OverlayContent
 * -----------------------------------------------------------------------------------------------*/
interface SlideButtonOverlayContentProps extends ComponentPropsWithRef<"div"> {
  /** Additional CSS classes for the slots. `className` is applied to `container`. */
  classNames?: SlotClassNames<SlideButtonContentSlots>;
  /** Inline styles for the slots. `style` is applied to `container`. */
  styles?: SlotStyles<SlideButtonContentSlots>;
}

/**
 * Progress fill. The clip wrapper grows from the start of the track up to the thumb's trailing
 * edge; its content spans the whole track and carries the variant fill color.
 */
const SlideButtonOverlayContent = ({
  children,
  className,
  classNames,
  style,
  styles,
  ...rest
}: SlideButtonOverlayContentProps) => {
  const {slots} = useSlideButtonContext("OverlayContent");

  return (
    <div
      {...rest}
      aria-hidden="true"
      className={slots.overlay({className: cx(classNames?.container, className)})}
      data-slot="slide-button-overlay-content"
      style={{...styles?.container, ...style}}
    >
      <div
        className={slots.overlayContent({className: classNames?.contentContainer})}
        data-slot="slide-button-overlay-content-container"
        style={styles?.contentContainer}
      >
        {children}
      </div>
    </div>
  );
};

SlideButtonOverlayContent.displayName = "HeroUI.SlideButton.OverlayContent";

/* -------------------------------------------------------------------------------------------------
 * Thumb
 * -----------------------------------------------------------------------------------------------*/
interface SlideButtonThumbIconProps {
  /** Icon size in px. @default 20 */
  size?: number;
  /** Icon color. Defaults to the variant's thumb foreground color. */
  color?: string;
}

const ChevronRightIcon = ({
  className,
  color,
  size,
}: SlideButtonThumbIconProps & {className?: string}) => (
  <svg
    aria-hidden="true"
    className={className}
    data-slot="slide-button-thumb-icon"
    fill="none"
    focusable="false"
    height={size ?? 20}
    style={size === undefined ? undefined : {height: size, width: size}}
    viewBox="0 0 20 20"
    width={size ?? 20}
  >
    <path
      d="M7.75 4.5 13.25 10l-5.5 5.5"
      stroke={color ?? "currentColor"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);

interface DragState {
  pointerId: number;
  startX: number;
  startProgress: number;
  /** Px the thumb can travel (track width - thumb width). */
  travel: number;
  /** 1 in LTR, -1 in RTL. */
  direction: number;
  lastProgress: number;
  lastTime: number;
  /** Smoothed velocity in progress units per second. */
  velocity: number;
}

interface SlideButtonThumbProps extends Omit<ComponentPropsWithRef<"button">, "children"> {
  /** Custom thumb content. Defaults to a chevron-right icon. */
  children?: ReactNode;
  /** Props for the default chevron icon. Ignored when `children` is provided. */
  iconProps?: SlideButtonThumbIconProps;
  /**
   * Whether the thumb applies its position transform. Set to `false` to position the thumb
   * yourself (e.g. from `--slide-button-progress`). @default true
   */
  isAnimatedStyleActive?: boolean;
  /** Animation configuration of the snap-back / snap-to-end spring. */
  animation?: SlideButtonThumbAnimation;
}

/**
 * Draggable handle. Dragging it past the completion threshold and releasing completes the action.
 * Keyboard / screen reader: Enter, Space, End or ArrowRight (ArrowLeft in RTL) complete it.
 */
const SlideButtonThumb = ({
  animation,
  children,
  className,
  iconProps,
  isAnimatedStyleActive = true,
  ref,
  ...rest
}: SlideButtonThumbProps) => {
  const {actions, isCompleted, isDisabled, isDragging, slots, store, underlayId} =
    useSlideButtonContext("Thumb");
  const thumbRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergedRef(ref, thumbRef);
  const dragRef = useRef<DragState | null>(null);
  const virtualPressRef = useRef(false);
  const {focusProps, isFocusVisible} = useFocusRing();
  const isInteractive = !isDisabled && !isCompleted;

  useIsomorphicLayoutEffect(() => {
    actions.setThumbAnimation(animation);
  }, [actions, animation]);

  useIsomorphicLayoutEffect(() => {
    const element = thumbRef.current;

    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      store.setMetrics({thumbHeight: element.offsetHeight, thumbWidth: element.offsetWidth});
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [store]);

  const finishDrag = (event: PointerEvent<HTMLButtonElement>, isCancelled: boolean) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;

    const target = event.currentTarget;

    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);

    // A pointer that rested before lifting has no momentum left.
    const velocity = (event.timeStamp - drag.lastTime) / 1000 > 0.08 ? 0 : drag.velocity;

    if (isCancelled) {
      actions.cancelDrag(velocity);
    } else {
      // Decides completion synchronously, so the completion haptic plays inside this gesture.
      actions.endDrag(velocity);
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Keyboard (Enter / Space) and screen reader activation produce clicks without a pointer
    // drag; a click that follows a real pointer press is part of the slide gesture instead.
    const isVirtual = event.detail === 0 || virtualPressRef.current;

    virtualPressRef.current = false;
    if (isVirtual && isInteractive) actions.complete();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isInteractive) return;

    const forwardKey = isRtl(event.currentTarget) ? "ArrowLeft" : "ArrowRight";

    if (event.key === "End" || event.key === forwardKey) {
      event.preventDefault();
      actions.complete();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isInteractive || dragRef.current) return;

    if (isVirtualPointerEvent(event.nativeEvent)) {
      virtualPressRef.current = true;

      return;
    }
    virtualPressRef.current = false;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const target = event.currentTarget;
    const travel = (target.parentElement?.clientWidth ?? 0) - target.offsetWidth;

    if (travel <= 0) return;

    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be gone (e.g. synthetic events); dragging still works.
    }

    const startProgress = store.getProgress();

    actions.beginDrag();
    dragRef.current = {
      direction: isRtl(target) ? -1 : 1,
      lastProgress: startProgress,
      lastTime: event.timeStamp,
      pointerId: event.pointerId,
      startProgress,
      startX: event.clientX,
      travel,
      velocity: 0,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const progress = clamp01(
      drag.startProgress + ((event.clientX - drag.startX) * drag.direction) / drag.travel,
    );
    const elapsed = (event.timeStamp - drag.lastTime) / 1000;

    if (elapsed > 0) {
      const instant = (progress - drag.lastProgress) / elapsed;

      drag.velocity = drag.velocity * 0.3 + instant * 0.7;
      drag.lastProgress = progress;
      drag.lastTime = event.timeStamp;
    }

    actions.setProgress(progress);
  };

  const domProps = mergeProps(rest, focusProps);
  const hasOwnLabel = rest["aria-label"] !== undefined || rest["aria-labelledby"] !== undefined;

  return (
    <button
      aria-labelledby={hasOwnLabel ? undefined : underlayId}
      {...domProps}
      ref={mergedRef}
      aria-disabled={isCompleted || undefined}
      className={slots.thumb({className})}
      data-animated-style={isAnimatedStyleActive ? undefined : "false"}
      data-completed={isCompleted || undefined}
      data-disabled={isDisabled || undefined}
      data-dragging={isDragging || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-slot="slide-button-thumb"
      disabled={isDisabled}
      type="button"
      onClick={(event) => {
        domProps.onClick?.(event);
        handleClick(event);
      }}
      onKeyDown={(event) => {
        domProps.onKeyDown?.(event);
        handleKeyDown(event);
      }}
      onLostPointerCapture={(event) => {
        domProps.onLostPointerCapture?.(event);
        finishDrag(event, true);
      }}
      onPointerCancel={(event) => {
        domProps.onPointerCancel?.(event);
        finishDrag(event, true);
      }}
      onPointerDown={(event) => {
        domProps.onPointerDown?.(event);
        handlePointerDown(event);
      }}
      onPointerMove={(event) => {
        domProps.onPointerMove?.(event);
        handlePointerMove(event);
      }}
      onPointerUp={(event) => {
        domProps.onPointerUp?.(event);
        finishDrag(event, false);
      }}
    >
      {children ?? <ChevronRightIcon {...iconProps} className={slots.thumbIcon()} />}
    </button>
  );
};

SlideButtonThumb.displayName = "HeroUI.SlideButton.Thumb";

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/
interface SlideButtonLabelProps extends ComponentPropsWithRef<"span"> {}

/** Text that inherits the variant color. Use inside UnderlayContent or OverlayContent. */
const SlideButtonLabel = ({children, className, ...rest}: SlideButtonLabelProps) => {
  const {slots} = useSlideButtonContext("Label");

  return (
    <span {...rest} className={slots.label({className})} data-slot="slide-button-label">
      {children}
    </span>
  );
};

SlideButtonLabel.displayName = "HeroUI.SlideButton.Label";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SlideButtonRoot,
  SlideButtonContainerBackground,
  SlideButtonUnderlayContent,
  SlideButtonOverlayContent,
  SlideButtonThumb,
  SlideButtonLabel,
};

export type {
  SlideButtonRootProps,
  SlideButtonContainerBackgroundProps,
  SlideButtonUnderlayContentProps,
  SlideButtonOverlayContentProps,
  SlideButtonThumbProps,
  SlideButtonThumbIconProps,
  SlideButtonLabelProps,
  SlideButtonRootSlots,
  SlideButtonContentSlots,
};
