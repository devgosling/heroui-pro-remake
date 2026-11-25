"use client";

import type {
  WheelPickerGroupIndicatorSlots,
  WheelPickerGroupMaskSlots,
  WheelPickerGroupRootAnimation,
  WheelPickerGroupValues,
} from "./wheel-picker-group-context";
import type {WheelPickerGroupContextValue} from "../wheel-picker/wheel-picker-context";
import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {use, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {cx} from "tailwind-variants";

import {useMergedRef} from "../../utils/refs";
import {HapticsContext} from "../../utils/use-haptics";
import {WheelPickerGroupContext} from "../wheel-picker/wheel-picker-context";

import {wheelPickerGroupVariants} from "./wheel-picker-group.styles";

/* -------------------------------------------------------------------------------------------------
 * Constants & helpers
 * -----------------------------------------------------------------------------------------------*/
const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_COUNT = 5;
const EMPTY_VALUES: WheelPickerGroupValues = {};
const WHEEL_SELECTOR = '[data-slot="wheel-picker"]';
const GROUP_SELECTOR = '[data-slot="wheel-picker-group"]';

const slots = wheelPickerGroupVariants();

/** `visibleCount` must be odd so one row sits on the band; even values round up (like WheelPicker). */
const toOddCount = (count: number) => {
  const whole = Math.max(1, Math.round(count));

  return whole % 2 === 0 ? whole + 1 : whole;
};

/**
 * Mask height: a number is pixels, a percentage scales the default fade height, any other string is
 * used as a CSS length.
 */
const resolveMaskHeight = (height: number | string, defaultHeight: number) => {
  if (typeof height === "number") return `${height}px`;

  const percentage = /^(-?\d*\.?\d+)%$/.exec(height.trim());

  return percentage ? `${(defaultHeight * Number(percentage[1])) / 100}px` : height;
};

/* -------------------------------------------------------------------------------------------------
 * WheelPickerGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerGroupRootProps<
  V extends WheelPickerGroupValues = WheelPickerGroupValues,
> extends Omit<ComponentPropsWithRef<"div">, "children" | "defaultValue"> {
  /** `WheelPicker`s (each with a unique `name`), optionally with `Indicator` and `Mask`. */
  children?: ReactNode;
  /** Controlled values record, keyed by each nested wheel's `name`. */
  values?: V;
  /** Initial values record when uncontrolled. */
  defaultValues?: V;
  /** Pixel height of a single row, shared by every nested wheel. @default 44 */
  itemHeight?: number;
  /** Number of visible rows, shared by every nested wheel; must be odd. @default 5 */
  visibleCount?: number;
  /** Disables (and dims) the whole group. A wheel can also be disabled on its own. @default false */
  isDisabled?: boolean;
  /**
   * Fires when any wheel's value changes: live while scrolling, on tap-to-focus, keyboard and
   * imperative scrolls. Not fired for external `values` updates.
   */
  onValuesChange?: (values: V) => void;
  /** Fires exactly once after every wheel has come to rest (when a value changed since the last commit). */
  onValuesCommit?: (values: V) => void;
  /** `"disable-all"` cascades to every nested wheel: no row fade / scale, instant settles. */
  animation?: WheelPickerGroupRootAnimation;
  /**
   * Default haptics for the nested wheels (a wheel's own `isHapticFeedbackEnabled` wins). Defaults
   * to the nearest `HapticsProvider` (on by default).
   */
  isHapticFeedbackEnabled?: boolean;
}

function WheelPickerGroupRoot<V extends WheelPickerGroupValues = WheelPickerGroupValues>({
  animation,
  children,
  className,
  defaultValues,
  isDisabled = false,
  isHapticFeedbackEnabled,
  itemHeight: itemHeightProp = DEFAULT_ITEM_HEIGHT,
  onValuesChange,
  onValuesCommit,
  ref,
  style,
  values: valuesProp,
  visibleCount: visibleCountProp = DEFAULT_VISIBLE_COUNT,
  ...rest
}: WheelPickerGroupRootProps<V>) {
  const itemHeight = Math.max(1, itemHeightProp);
  const visibleCount = toOddCount(visibleCountProp);
  const isAnimationDisabled = animation === "disable-all";

  /* ----- values record ----- */
  const isControlled = valuesProp !== undefined;
  const [internalValues, setInternalValues] = useState<V>(
    () => defaultValues ?? (EMPTY_VALUES as V),
  );
  const values = isControlled ? valuesProp : internalValues;

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);
  /** Latest record, updated synchronously so wheels that commit in the same frame merge. */
  const valuesRef = useRef(values);
  /** Wheels that are currently moving (each wheel reports start and stop exactly once). */
  const movingCountRef = useRef(0);
  /** A value changed since the last `onValuesCommit`. */
  const isCommitPendingRef = useRef(false);
  const latestRef = useRef({isControlled, onValuesChange, onValuesCommit});

  useIsomorphicLayoutEffect(() => {
    latestRef.current = {isControlled, onValuesChange, onValuesCommit};
  });

  useIsomorphicLayoutEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const flushCommit = useCallback(() => {
    if (movingCountRef.current > 0 || !isCommitPendingRef.current) return;
    isCommitPendingRef.current = false;
    latestRef.current.onValuesCommit?.(valuesRef.current);
  }, []);

  const setValue = useCallback(
    (name: string, value: unknown) => {
      const latest = latestRef.current;
      const next = {...valuesRef.current, [name]: value} as V;

      valuesRef.current = next;
      isCommitPendingRef.current = true;
      if (!latest.isControlled) setInternalValues(next);
      latest.onValuesChange?.(next);
      // A change without motion (instant settle, reduced motion) commits right away; a discrete
      // step that is about to animate reports its motion synchronously and commits on rest instead.
      if (movingCountRef.current === 0) queueMicrotask(flushCommit);
    },
    [flushCommit],
  );

  const notifyScrollState = useCallback(
    (isScrolling: boolean) => {
      movingCountRef.current = Math.max(0, movingCountRef.current + (isScrolling ? 1 : -1));

      const root = rootRef.current;

      if (root) {
        if (movingCountRef.current > 0) root.setAttribute("data-scrolling", "true");
        else root.removeAttribute("data-scrolling");
      }

      if (!isScrolling) flushCommit();
    },
    [flushCommit],
  );

  const isAnyWheelScrolling = useCallback(() => movingCountRef.current > 0, []);

  const contextValue = useMemo<WheelPickerGroupContextValue>(
    () => ({
      // Reads the rendered record: the context changes identity with it, so nested wheels
      // re-render and follow external updates.
      getValue: (name: string) => (values as WheelPickerGroupValues)[name],
      isAnimationDisabled,
      isAnyWheelScrolling,
      isDisabled,
      itemHeight,
      notifyScrollState,
      setValue,
      visibleCount,
    }),
    [
      isAnimationDisabled,
      isAnyWheelScrolling,
      isDisabled,
      itemHeight,
      notifyScrollState,
      setValue,
      values,
      visibleCount,
    ],
  );

  /* ----- haptics default for the nested wheels ----- */
  const parentHaptics = use(HapticsContext);
  const isHapticsEnabled = isHapticFeedbackEnabled ?? parentHaptics.isEnabled;
  const hapticsValue = useMemo(() => ({isEnabled: isHapticsEnabled}), [isHapticsEnabled]);

  /* ----- ArrowLeft / ArrowRight move focus between the columns ----- */
  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;

      const current = event.target;

      if (!(current instanceof HTMLElement) || !current.matches(WHEEL_SELECTOR)) return;

      const wheels = Array.from(root.querySelectorAll<HTMLElement>(WHEEL_SELECTOR)).filter(
        (wheel) =>
          wheel.closest(GROUP_SELECTOR) === root && (wheel === current || wheel.tabIndex >= 0),
      );
      const index = wheels.indexOf(current);
      const isRtl = getComputedStyle(root).direction === "rtl";
      const isForward = event.key === (isRtl ? "ArrowLeft" : "ArrowRight");
      const next = index < 0 ? undefined : wheels[index + (isForward ? 1 : -1)];

      if (!next) return;
      event.preventDefault();
      next.focus();
    };

    root.addEventListener("keydown", onKeyDown);

    return () => root.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <WheelPickerGroupContext value={contextValue}>
      <HapticsContext value={hapticsValue}>
        <div
          {...rest}
          ref={mergedRef}
          aria-disabled={isDisabled || undefined}
          className={slots.base({className})}
          data-animation={isAnimationDisabled ? "disabled" : undefined}
          data-disabled={isDisabled || undefined}
          data-slot="wheel-picker-group"
          role="group"
          style={
            {
              "--wheel-picker-group-item-height": `${itemHeight}px`,
              "--wheel-picker-group-visible-count": visibleCount,
              ...style,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </HapticsContext>
    </WheelPickerGroupContext>
  );
}

WheelPickerGroupRoot.displayName = "HeroUI.WheelPickerGroup";

/* -------------------------------------------------------------------------------------------------
 * WheelPickerGroup IndicatorBackground
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerGroupIndicatorBackgroundProps extends ComponentPropsWithRef<"div"> {
  /** Custom content inside the background layer. Empty by default (themes can style it). */
  children?: ReactNode;
}

const WheelPickerGroupIndicatorBackground = ({
  className,
  ...rest
}: WheelPickerGroupIndicatorBackgroundProps) => (
  <div
    {...rest}
    aria-hidden="true"
    className={slots.indicatorBackground({className})}
    data-slot="wheel-picker-group-indicator-background"
  />
);

WheelPickerGroupIndicatorBackground.displayName = "HeroUI.WheelPickerGroup.IndicatorBackground";

/* -------------------------------------------------------------------------------------------------
 * WheelPickerGroup Indicator
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerGroupIndicatorProps extends ComponentPropsWithRef<"div"> {
  /**
   * Decorative content rendered inside the highlight (patterns, gradients, icons). Add
   * `overflow-hidden` to the highlight to clip it to the rounded corners.
   */
  children?: ReactNode;
  /** Additional classes for individual indicator slots. */
  classNames?: Partial<Record<WheelPickerGroupIndicatorSlots, string>>;
  /** Inline styles for individual indicator slots. */
  styles?: Partial<Record<WheelPickerGroupIndicatorSlots, CSSProperties>>;
  /**
   * Layer behind the highlight's content. `undefined` renders the themable default
   * `WheelPickerGroup.IndicatorBackground`, a node is rendered inside it, `null` removes it.
   */
  background?: ReactNode;
}

const WheelPickerGroupIndicator = ({
  background,
  children,
  className,
  classNames,
  style,
  styles,
  ...rest
}: WheelPickerGroupIndicatorProps) => (
  <div
    {...rest}
    aria-hidden="true"
    className={slots.indicator({className: cx(classNames?.wrapper, className)})}
    data-slot="wheel-picker-group-indicator"
    style={styles?.wrapper || style ? {...styles?.wrapper, ...style} : undefined}
  >
    <div
      className={slots.indicatorHighlight({className: classNames?.highlight})}
      data-slot="wheel-picker-group-indicator-highlight"
      style={styles?.highlight}
    >
      {background === null ? null : (
        <WheelPickerGroupIndicatorBackground>{background}</WheelPickerGroupIndicatorBackground>
      )}
      {children}
    </div>
  </div>
);

WheelPickerGroupIndicator.displayName = "HeroUI.WheelPickerGroup.Indicator";

/* -------------------------------------------------------------------------------------------------
 * WheelPickerGroup Mask
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerGroupMaskProps extends Omit<
  ComponentPropsWithRef<"div">,
  "children" | "color"
> {
  /** Solid colour the fades start from (any CSS colour). @default "var(--background)" */
  color?: string;
  /**
   * Height of each fade. A number is pixels; a percentage scales the default fade height
   * (`(visibleCount - 1) / 4 * itemHeight`); any other string is used as a CSS length.
   * @default "100%"
   */
  height?: number | string;
  /** Additional classes for individual mask slots. */
  classNames?: Partial<Record<WheelPickerGroupMaskSlots, string>>;
  /** Inline styles for individual mask slots. */
  styles?: Partial<Record<WheelPickerGroupMaskSlots, CSSProperties>>;
}

const WheelPickerGroupMask = ({
  className,
  classNames,
  color,
  height = "100%",
  style,
  styles,
  ...rest
}: WheelPickerGroupMaskProps) => {
  const group = use(WheelPickerGroupContext);
  const itemHeight = group?.itemHeight ?? DEFAULT_ITEM_HEIGHT;
  const visibleCount = group?.visibleCount ?? DEFAULT_VISIBLE_COUNT;

  return (
    <div
      {...rest}
      aria-hidden="true"
      className={slots.mask()}
      data-slot="wheel-picker-group-mask"
      style={
        {
          "--wheel-picker-mask-height": resolveMaskHeight(
            height,
            ((visibleCount - 1) / 4) * itemHeight,
          ),
          ...(color ? {"--wheel-picker-mask-color": color} : null),
          ...style,
        } as CSSProperties
      }
    >
      <div
        className={slots.maskTop({className: cx(className, classNames?.top)})}
        data-slot="wheel-picker-group-mask-top"
        style={styles?.top}
      />
      <div
        className={slots.maskBottom({className: cx(className, classNames?.bottom)})}
        data-slot="wheel-picker-group-mask-bottom"
        style={styles?.bottom}
      />
    </div>
  );
};

WheelPickerGroupMask.displayName = "HeroUI.WheelPickerGroup.Mask";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  WheelPickerGroupRoot,
  WheelPickerGroupIndicator,
  WheelPickerGroupIndicatorBackground,
  WheelPickerGroupMask,
};

export type {
  WheelPickerGroupRootProps,
  WheelPickerGroupIndicatorProps,
  WheelPickerGroupIndicatorBackgroundProps,
  WheelPickerGroupMaskProps,
};
