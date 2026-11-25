"use client";

import type {
  SwipeableRowActionVariant,
  SwipeableRowContextValue,
  SwipeableRowControls,
  SwipeableRowVariant,
} from "./swipeable-row-context";
import type {
  SwipeableRowOpenSide,
  SwipeableRowRailsState,
  SwipeableRowSide,
  SwipeableRowSpringConfig,
  SwipeableRowTransitionOptions,
} from "./swipeable-row-engine";
import type {CSSProperties, ComponentPropsWithRef, ReactNode, Ref} from "react";
import type {ButtonProps as ButtonPrimitiveProps} from "react-aria-components/Button";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {use, useCallback, useImperativeHandle, useMemo, useRef, useState} from "react";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusRing} from "react-aria/useFocusRing";
import {useKeyboard} from "react-aria/useKeyboard";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {composeRenderProps} from "react-aria-components/composeRenderProps";

import {useMergedRef, useResolvedClassName} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {
  SwipeableRowActionContext,
  SwipeableRowActionsContext,
  SwipeableRowContext,
  useSwipeableRowContext,
  useSwipeableRowSnapshot,
} from "./swipeable-row-context";
import {createSwipeEngine} from "./swipeable-row-engine";
import {
  swipeableRowActionLabelVariants,
  swipeableRowActionVariants,
  swipeableRowActionsVariants,
  swipeableRowVariants,
} from "./swipeable-row.styles";

type PressEvent = Parameters<NonNullable<ButtonPrimitiveProps["onPress"]>>[0];

const DEFAULT_FAIL_OFFSET_Y: [number, number] = [-10, 10];
const DEFAULT_SPRING = {damping: 31, mass: 1, stiffness: 240};
const defaultSlots = swipeableRowVariants();

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** `[min, max]` keeps its sign rules; a single number `n` means `[-|n|, |n|]`. */
const normalizeFailOffset = (value: number | [number, number]): [number, number] =>
  Array.isArray(value)
    ? [Math.min(0, value[0]), Math.max(0, value[1])]
    : [-Math.abs(value), Math.abs(value)];

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
type SwipeableRowRootRef = HTMLDivElement & SwipeableRowControls;

interface SwipeableRowRootAnimationConfig {
  /** Spring used when the row settles open or closed. */
  springConfig?: SwipeableRowSpringConfig;
  /** Inline variant only: corner radius at [rest, dragged] and the travel that blends them. */
  borderRadius?: {
    /** @default [0, card radius] */
    value?: [number, number];
    /** @default 32 */
    distance?: number;
  };
  /** Disables the settle spring; `"disable-all"` also disables descendant animations. */
  state?: "disabled" | "disable-all" | boolean;
}

type SwipeableRowRootAnimation =
  SwipeableRowRootAnimationConfig | boolean | "disabled" | "disable-all";

interface SwipeableRowRootProps extends Omit<ComponentPropsWithRef<"div">, "children" | "ref"> {
  /** The root element, extended with `open`, `close` and `reset`. */
  ref?: Ref<SwipeableRowRootRef>;
  /** Compound action rails and foreground content. */
  children?: ReactNode;
  /** Controlled open rail. `null` closes the row. A side without a non-empty rail stays closed. */
  openSide?: SwipeableRowOpenSide;
  /** Initial uncontrolled open rail. @default null */
  defaultOpenSide?: SwipeableRowOpenSide;
  /** Called when the requested open rail changes. */
  onOpenSideChange?: (side: SwipeableRowOpenSide) => void;
  /** Rounded card for spaced rows, or a square list row whose corners round while dragged. */
  variant?: SwipeableRowVariant;
  /** Disables swiping and action presses. Disabling an open row closes it. @default false */
  isDisabled?: boolean;
  /** Fraction of an action rail that must be crossed before it settles open (0..1). @default 0.5 */
  openThreshold?: number;
  /** Horizontal distance in px required to start the drag. @default 10 */
  activationThreshold?: number;
  /** Vertical travel range in px that cancels the drag before it activates. @default [-10, 10] */
  failOffsetY?: number | [number, number];
  /** Ratio between pointer travel and row travel (minimum 1). @default 1 */
  friction?: number;
  /** Lets the card move past its rail and rubber-band sides without actions. @default true */
  overshoot?: boolean;
  /** Resistance while overshooting or rubber-banding (minimum 1). @default 8 */
  overshootFriction?: number;
  /** Closes an open row when its foreground content is pressed. @default true */
  closeOnContentPress?: boolean;
  /** Web: closes an open row when the user presses or focuses outside of it. @default true */
  closeOnOutsidePress?: boolean;
  /** Label of the screen-reader control that reveals the start rail. @default "Open start actions" */
  accessibilityOpenStartActionsLabel?: string;
  /** Label of the screen-reader control that reveals the end rail. @default "Open end actions" */
  accessibilityOpenEndActionsLabel?: string;
  /** Label of the screen-reader control that closes the row. @default "Close actions" */
  accessibilityCloseActionsLabel?: string;
  /** Web: horizontal two-finger trackpad swipes (wheel events) move the row. @default false */
  enableTrackpadTwoFingerGesture?: boolean;
  /** Settling spring and inline corner configuration; `"disable-all"` cascades to the actions. */
  animation?: SwipeableRowRootAnimation;
  /**
   * Plays haptic feedback when the drag crosses the open / full-swipe threshold and when a full
   * swipe runs an action. Defaults to the nearest `HapticsProvider` (enabled).
   */
  isHapticFeedbackEnabled?: boolean;
}

const SwipeableRowRoot = ({
  accessibilityCloseActionsLabel = "Close actions",
  accessibilityOpenEndActionsLabel = "Open end actions",
  accessibilityOpenStartActionsLabel = "Open start actions",
  activationThreshold = 10,
  animation,
  children,
  className,
  closeOnContentPress = true,
  closeOnOutsidePress = true,
  defaultOpenSide = null,
  enableTrackpadTwoFingerGesture = false,
  failOffsetY = DEFAULT_FAIL_OFFSET_Y,
  friction = 1,
  isDisabled = false,
  isHapticFeedbackEnabled,
  onOpenSideChange,
  openSide: openSideProp,
  openThreshold = 0.5,
  overshoot = true,
  overshootFriction = 8,
  ref,
  style,
  variant = "standalone",
  ...rest
}: SwipeableRowRootProps) => {
  const [engine] = useState(createSwipeEngine);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusRequestRef = useRef<SwipeableRowSide | null>(null);
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const [internalSide, setInternalSide] = useState<SwipeableRowOpenSide>(defaultOpenSide);
  const [rails, setRails] = useState<SwipeableRowRailsState>({end: false, start: false});
  const [settleRevision, setSettleRevision] = useState(0);

  const isControlled = openSideProp !== undefined;
  const requestedSide = isControlled ? openSideProp : internalSide;
  const openSide = !isDisabled && requestedSide && rails[requestedSide] ? requestedSide : null;

  const animationConfig = typeof animation === "object" ? animation : undefined;
  const animationState = typeof animation === "object" ? animation.state : animation;
  const isAnimationDisabledForAll = animationState === "disable-all";
  const isAnimationDisabled =
    animationState === false || animationState === "disabled" || isAnimationDisabledForAll;

  const slots = useMemo(() => swipeableRowVariants({variant}), [variant]);

  const requestOpenSide = useCallback(
    (side: SwipeableRowOpenSide) => {
      if (side !== requestedSide) {
        if (!isControlled) setInternalSide(side);
        onOpenSideChange?.(side);
      }
      // Re-sync even when nothing changed, so a rejected controlled change springs back.
      setSettleRevision((revision) => revision + 1);
    },
    [isControlled, onOpenSideChange, requestedSide],
  );

  const open = useCallback(
    (side: SwipeableRowSide, options?: SwipeableRowTransitionOptions) => {
      if (isDisabled || !engine.hasRail(side)) return;
      engine.animateToSide(side, options);
      requestOpenSide(side);
    },
    [engine, isDisabled, requestOpenSide],
  );

  const close = useCallback(
    (options?: SwipeableRowTransitionOptions) => {
      engine.animateToSide(null, options);
      requestOpenSide(null);
    },
    [engine, requestOpenSide],
  );

  const reset = useCallback(() => {
    engine.reset();
    requestOpenSide(null);
  }, [engine, requestOpenSide]);

  const openAndFocus = useCallback(
    (side: SwipeableRowSide) => {
      if (isDisabled || !engine.hasRail(side)) return;
      if (openSide === side) {
        engine.focusRail(side);

        return;
      }
      focusRequestRef.current = side;
      open(side);
    },
    [engine, isDisabled, open, openSide],
  );

  const closeAndFocusContent = useCallback(() => {
    // Focus first: the rail becomes inert once closed, which would drop focus to <body>.
    engine.focusContent();
    close();
  }, [close, engine]);

  const springConfig = animationConfig?.springConfig;
  const cornerDistance = animationConfig?.borderRadius?.distance ?? 32;

  // Push the latest props into the engine before it handles any further input.
  useIsomorphicLayoutEffect(() => {
    engine.setOptions({
      activationThreshold: Math.max(0, activationThreshold),
      closeOnContentPress,
      closeOnOutsidePress,
      cornerDistance: Math.max(0, cornerDistance),
      enableTrackpad: enableTrackpadTwoFingerGesture,
      failOffsetY: normalizeFailOffset(failOffsetY),
      friction: Math.max(1, friction),
      haptic,
      isAnimationDisabled,
      isDisabled,
      onRailsChange: setRails,
      onRequestSide: requestOpenSide,
      openThreshold: clamp01(openThreshold),
      overshoot,
      overshootFriction: Math.max(1, overshootFriction),
      spring: {
        damping: springConfig?.damping ?? DEFAULT_SPRING.damping,
        mass: springConfig?.mass ?? DEFAULT_SPRING.mass,
        stiffness: springConfig?.stiffness ?? DEFAULT_SPRING.stiffness,
      },
    });
  });

  useIsomorphicLayoutEffect(() => {
    const element = rootRef.current;

    if (!element) return;

    return engine.attach(element);
  }, [engine]);

  // Settle toward the requested side whenever it (or a release decision) changes.
  useIsomorphicLayoutEffect(() => {
    engine.setDesired(isDisabled ? null : requestedSide);

    const request = focusRequestRef.current;

    if (request && openSide === request) {
      focusRequestRef.current = null;
      engine.focusRail(request);
    }
  }, [engine, isDisabled, openSide, requestedSide, settleRevision]);

  useImperativeHandle(
    ref,
    () => Object.assign(rootRef.current as HTMLDivElement, {close, open, reset}),
    [close, open, reset],
  );

  const contextValue = useMemo<SwipeableRowContextValue>(
    () => ({
      close,
      closeAndFocusContent,
      engine,
      isAnimationDisabledForAll,
      isDisabled,
      labels: {
        close: accessibilityCloseActionsLabel,
        openEnd: accessibilityOpenEndActionsLabel,
        openStart: accessibilityOpenStartActionsLabel,
      },
      open,
      openAndFocus,
      openSide,
      rails,
      reset,
      slots,
      variant,
    }),
    [
      accessibilityCloseActionsLabel,
      accessibilityOpenEndActionsLabel,
      accessibilityOpenStartActionsLabel,
      close,
      closeAndFocusContent,
      engine,
      isAnimationDisabledForAll,
      isDisabled,
      open,
      openAndFocus,
      openSide,
      rails,
      reset,
      slots,
      variant,
    ],
  );

  const radius = variant === "inline" ? animationConfig?.borderRadius?.value : undefined;
  const resolvedStyle: CSSProperties | undefined = radius
    ? ({
        "--swipeable-row-radius-dragged": `${radius[1]}px`,
        "--swipeable-row-radius-rest": `${radius[0]}px`,
        ...style,
      } as CSSProperties)
    : style;

  return (
    <SwipeableRowContext value={contextValue}>
      <div
        {...rest}
        ref={rootRef}
        className={slots.base({className})}
        data-disabled={isDisabled ? "true" : undefined}
        data-open={openSide ? "true" : undefined}
        data-open-side={openSide ?? undefined}
        data-slot="swipeable-row"
        data-variant={variant}
        style={resolvedStyle}
      >
        {children}
      </div>
    </SwipeableRowContext>
  );
};

SwipeableRowRoot.displayName = "HeroUI.SwipeableRow";

/* -------------------------------------------------------------------------------------------------
 * Actions (rail)
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableRowActionsRenderProps {
  /** Logical edge owned by the rail. */
  side: SwipeableRowSide;
  /** Rail reveal progress, clamped 0..1. */
  progress: number;
  /** Logical row translation in px: positive reveals start, negative reveals end. */
  translation: number;
  /** Whether this rail is the settled open side. */
  isOpen: boolean;
  /** Closes the row. */
  close: SwipeableRowControls["close"];
}

interface SwipeableRowActionsProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Logical edge where the rail is anchored. */
  side: SwipeableRowSide;
  /** Action controls, or a function receiving the live reveal state. */
  children?: ReactNode | ((props: SwipeableRowActionsRenderProps) => ReactNode);
  /**
   * Web extension: dragging far past the rail runs the outermost action on release.
   * @default false
   */
  allowsFullSwipe?: boolean;
  /** Fraction of the row width the card must travel to arm a full swipe. @default 0.6 */
  fullSwipeThreshold?: number;
}

interface SwipeableRowActionsRendererProps {
  render: (props: SwipeableRowActionsRenderProps) => ReactNode;
  side: SwipeableRowSide;
}

const SwipeableRowActionsRenderer = ({render, side}: SwipeableRowActionsRendererProps) => {
  const row = useSwipeableRowContext("SwipeableRow.Actions");
  const snapshot = useSwipeableRowSnapshot(row.engine);

  return render({
    close: row.close,
    isOpen: row.openSide === side,
    progress: side === "start" ? snapshot.startProgress : snapshot.endProgress,
    side,
    translation: snapshot.translation,
  });
};

const SwipeableRowActions = ({
  allowsFullSwipe = false,
  children,
  className,
  fullSwipeThreshold = 0.6,
  ref,
  side,
  ...rest
}: SwipeableRowActionsProps) => {
  const row = useSwipeableRowContext("SwipeableRow.Actions");
  const localRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const isOpen = row.openSide === side;
  const {closeAndFocusContent, engine} = row;

  useIsomorphicLayoutEffect(() => {
    const element = localRef.current;

    if (!element) return;

    return engine.registerRail(side, element, {allowsFullSwipe, fullSwipeThreshold});
  }, [allowsFullSwipe, engine, fullSwipeThreshold, side]);

  const {keyboardProps} = useKeyboard({
    onKeyDown: (event) => {
      if (event.key === "Escape") {
        closeAndFocusContent();

        return;
      }
      // Shift+Tab from the first action goes back to the card, whatever the DOM order of the
      // rails (the docs place rails before the content, which would otherwise leave the row).
      if (
        event.key === "Tab" &&
        event.shiftKey &&
        event.target ===
          localRef.current?.querySelector("[data-slot='swipeable-row-action']:not(:disabled)")
      ) {
        event.preventDefault();
        engine.focusContent();

        return;
      }
      event.continuePropagation();
    },
  });

  const contextValue = useMemo(() => ({side}), [side]);

  return (
    <SwipeableRowActionsContext value={contextValue}>
      <div
        {...mergeProps(rest, keyboardProps)}
        ref={mergedRef}
        className={swipeableRowActionsVariants({className, side})}
        data-open={isOpen ? "true" : undefined}
        data-side={side}
        data-slot="swipeable-row-actions"
        // Covered actions stay out of the tab order and the accessibility tree until revealed.
        inert={!isOpen}
      >
        {typeof children === "function" ? (
          <SwipeableRowActionsRenderer render={children} side={side} />
        ) : (
          children
        )}
      </div>
    </SwipeableRowActionsContext>
  );
};

SwipeableRowActions.displayName = "HeroUI.SwipeableRow.Actions";

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableRowContentProps extends ComponentPropsWithRef<"div"> {
  /**
   * Layer behind the card content. `undefined` renders the default `ContentBackground`, a custom
   * node replaces it and `null` removes it.
   */
  background?: ReactNode;
}

/** Screen-reader controls that reveal and hide the rails without a swipe. */
const SwipeableRowA11yActions = () => {
  const row = useSwipeableRowContext("SwipeableRow.Content");
  const {closeAndFocusContent, labels, openAndFocus, openSide, rails, slots} = row;

  return (
    <span className={slots.a11yActions()} data-swipeable-row-a11y="">
      {rails.start && openSide !== "start" ? (
        <button tabIndex={-1} type="button" onClick={() => openAndFocus("start")}>
          {labels.openStart}
        </button>
      ) : null}
      {rails.end && openSide !== "end" ? (
        <button tabIndex={-1} type="button" onClick={() => openAndFocus("end")}>
          {labels.openEnd}
        </button>
      ) : null}
      {openSide ? (
        <button tabIndex={-1} type="button" onClick={closeAndFocusContent}>
          {labels.close}
        </button>
      ) : null}
    </span>
  );
};

const SwipeableRowContent = ({
  background,
  children,
  className,
  ref,
  ...rest
}: SwipeableRowContentProps) => {
  const row = useSwipeableRowContext("SwipeableRow.Content");
  const localRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const {close, engine, isDisabled, openAndFocus, openSide, rails, slots} = row;
  const isInteractive = (rails.start || rails.end) && !isDisabled;

  useIsomorphicLayoutEffect(() => {
    const element = localRef.current;

    if (!element) return;

    return engine.registerContent(element);
  }, [engine]);

  const {focusProps, isFocusVisible} = useFocusRing();
  const {keyboardProps} = useKeyboard({
    isDisabled: !isInteractive,
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) {
        event.continuePropagation();

        return;
      }
      if (event.key === "Escape" && openSide) {
        close();

        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const isRtl = getComputedStyle(event.currentTarget as Element).direction === "rtl";
        // The arrow moves the card: in LTR, ArrowLeft uncovers the end rail.
        const revealsEnd = (event.key === "ArrowLeft") !== isRtl;
        const target: SwipeableRowSide = revealsEnd ? "end" : "start";
        const opposite: SwipeableRowSide = revealsEnd ? "start" : "end";

        if (openSide === opposite) close();
        else if (rails[target]) openAndFocus(target);
        else event.continuePropagation();

        return;
      }
      event.continuePropagation();
    },
  });

  return (
    <div
      {...mergeProps(rest, focusProps, keyboardProps)}
      ref={mergedRef}
      aria-keyshortcuts={isInteractive ? "ArrowLeft ArrowRight Escape" : undefined}
      className={slots.content({className})}
      data-focus-visible={isFocusVisible && isInteractive ? "true" : undefined}
      data-slot="swipeable-row-content"
      // Keyboard users focus the row to reveal its actions with the arrow keys.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- intentional keyboard alternative to the swipe
      tabIndex={isInteractive ? 0 : undefined}
    >
      {background === undefined ? <SwipeableRowContentBackground /> : background}
      {children}
      {isInteractive ? <SwipeableRowA11yActions /> : null}
    </div>
  );
};

SwipeableRowContent.displayName = "HeroUI.SwipeableRow.Content";

/* -------------------------------------------------------------------------------------------------
 * ContentBackground
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableRowContentBackgroundProps extends ComponentPropsWithRef<"div"> {}

const SwipeableRowContentBackground = ({
  className,
  ...rest
}: SwipeableRowContentBackgroundProps) => {
  const row = use(SwipeableRowContext);
  const slots = row?.slots ?? defaultSlots;

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={slots.contentBackground({className})}
      data-slot="swipeable-row-content-background"
    />
  );
};

SwipeableRowContentBackground.displayName = "HeroUI.SwipeableRow.ContentBackground";

/* -------------------------------------------------------------------------------------------------
 * Action
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableRowActionAnimationConfig {
  /** Content offset in px toward the card at [hidden, fully revealed]. @default [15, 0] */
  translateX?: {value?: [number, number]};
  /** Content scale at [hidden, fully revealed]. @default [0.5, 1] */
  scale?: {value?: [number, number]};
  /** Content opacity at [hidden, fully revealed]. @default [0, 1] */
  opacity?: {value?: [number, number]};
  /** Whole-button scale while pressed; `1` turns the press feedback off. */
  pressScale?: {
    /** @default 0.95 */
    value?: number;
    /** @default {duration: 150} */
    timingConfig?: {duration?: number; easing?: string};
  };
  /** Disables the animation while keeping custom values. */
  state?: "disabled" | boolean;
}

type SwipeableRowActionAnimation = SwipeableRowActionAnimationConfig | boolean | "disabled";

interface SwipeableRowActionProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  /** Action color treatment. @default "default" */
  variant?: SwipeableRowActionVariant;
  /** Closes the enclosing row after invoking `onPress`. @default true */
  closeOnPress?: boolean;
  /** Reveal slide / zoom / fade of the content plus the press scale. `false` turns it off. */
  animation?: SwipeableRowActionAnimation;
}

const createPressEvent = (target: Element, pointerType: PressEvent["pointerType"]): PressEvent => ({
  altKey: false,
  continuePropagation: () => {},
  ctrlKey: false,
  metaKey: false,
  pointerType,
  shiftKey: false,
  target,
  type: "press",
  x: 0,
  y: 0,
});

const getAnimationVars = (config: SwipeableRowActionAnimationConfig | undefined) => {
  if (!config) return undefined;
  const vars: Record<string, string> = {};
  const {opacity, pressScale, scale, translateX} = config;

  if (translateX?.value) {
    vars["--swipeable-row-action-translate-from"] = `${translateX.value[0]}px`;
    vars["--swipeable-row-action-translate-to"] = `${translateX.value[1]}px`;
  }
  if (scale?.value) {
    vars["--swipeable-row-action-scale-from"] = `${scale.value[0]}`;
    vars["--swipeable-row-action-scale-to"] = `${scale.value[1]}`;
  }
  if (opacity?.value) {
    vars["--swipeable-row-action-opacity-from"] = `${opacity.value[0]}`;
    vars["--swipeable-row-action-opacity-to"] = `${opacity.value[1]}`;
  }
  if (pressScale?.value !== undefined) {
    vars["--swipeable-row-action-press-scale"] = `${pressScale.value}`;
  }
  if (pressScale?.timingConfig?.duration !== undefined) {
    vars["--swipeable-row-action-press-duration"] = `${pressScale.timingConfig.duration}ms`;
  }
  if (pressScale?.timingConfig?.easing) {
    vars["--swipeable-row-action-press-easing"] = pressScale.timingConfig.easing;
  }

  return Object.keys(vars).length ? (vars as CSSProperties) : undefined;
};

const SwipeableRowAction = ({
  animation,
  children,
  className,
  closeOnPress = true,
  isDisabled,
  onPress,
  ref,
  style,
  variant = "default",
  ...rest
}: SwipeableRowActionProps) => {
  const row = useSwipeableRowContext("SwipeableRow.Action");
  const {side} = use(SwipeableRowActionsContext);
  const localRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const {close, engine} = row;
  const isActionDisabled = row.isDisabled || !!isDisabled;

  const config = typeof animation === "object" ? animation : undefined;
  const state = typeof animation === "object" ? animation.state : animation;
  const isAnimated = !row.isAnimationDisabledForAll && state !== false && state !== "disabled";

  const slots = useMemo(
    () => swipeableRowActionVariants({isAnimated, variant}),
    [isAnimated, variant],
  );
  const resolvedClassName = useResolvedClassName(className, slots.base());
  const animationVars = getAnimationVars(config);
  const resolvedStyle: ButtonPrimitiveProps["style"] =
    animationVars === undefined
      ? style
      : typeof style === "function"
        ? (renderProps) => ({...animationVars, ...style(renderProps)})
        : {...animationVars, ...style};

  useIsomorphicLayoutEffect(() => {
    const element = localRef.current;

    if (!element) return;

    return engine.registerAction(side, element, {trigger: () => true});
  }, [engine, side]);

  // Keep the full-swipe handler current without re-registering the action.
  useIsomorphicLayoutEffect(() => {
    const element = localRef.current;

    if (!element) return;

    engine.updateAction(element, {
      trigger: (pointerType) => {
        if (!isActionDisabled) onPress?.(createPressEvent(element, pointerType));

        return closeOnPress;
      },
    });
  });

  const handlePress = (event: PressEvent) => {
    onPress?.(event);
    if (closeOnPress) close();
  };

  const contextValue = useMemo(() => ({variant}), [variant]);

  return (
    <SwipeableRowActionContext value={contextValue}>
      <ButtonPrimitive
        {...rest}
        ref={mergedRef}
        className={resolvedClassName}
        data-slot="swipeable-row-action"
        data-variant={variant}
        isDisabled={isActionDisabled}
        style={resolvedStyle}
        onPress={handlePress}
      >
        {composeRenderProps(children, (resolvedChildren) => (
          <span className={slots.content()} data-slot="swipeable-row-action-content">
            {typeof resolvedChildren === "string" || typeof resolvedChildren === "number" ? (
              <SwipeableRowActionLabel>{resolvedChildren}</SwipeableRowActionLabel>
            ) : (
              resolvedChildren
            )}
          </span>
        ))}
      </ButtonPrimitive>
    </SwipeableRowActionContext>
  );
};

SwipeableRowAction.displayName = "HeroUI.SwipeableRow.Action";

/* -------------------------------------------------------------------------------------------------
 * ActionLabel
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableRowActionLabelProps extends ComponentPropsWithRef<"span"> {}

const SwipeableRowActionLabel = ({className, ...rest}: SwipeableRowActionLabelProps) => {
  const {variant} = use(SwipeableRowActionContext);

  return (
    <span
      {...rest}
      className={swipeableRowActionLabelVariants({className, variant})}
      data-slot="swipeable-row-action-label"
    />
  );
};

SwipeableRowActionLabel.displayName = "HeroUI.SwipeableRow.ActionLabel";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SwipeableRowRoot,
  SwipeableRowActions,
  SwipeableRowContent,
  SwipeableRowContentBackground,
  SwipeableRowAction,
  SwipeableRowActionLabel,
};

export type {
  SwipeableRowRootRef,
  SwipeableRowRootProps,
  SwipeableRowRootAnimation,
  SwipeableRowRootAnimationConfig,
  SwipeableRowActionsProps,
  SwipeableRowActionsRenderProps,
  SwipeableRowContentProps,
  SwipeableRowContentBackgroundProps,
  SwipeableRowActionProps,
  SwipeableRowActionAnimation,
  SwipeableRowActionAnimationConfig,
  SwipeableRowActionLabelProps,
};
