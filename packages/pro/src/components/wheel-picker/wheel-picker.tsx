"use client";

import type {
  WheelPickerItemRenderProps,
  WheelPickerLiveValue,
  WheelPickerOption,
  WheelPickerResolvedAnimationConfig,
  WheelPickerRootSlots,
  WheelPickerScrollToIndexParams,
  WheelPickerScrollToValueOptions,
} from "./wheel-picker-context";
import type {WheelPickerMotionSource} from "./wheel-picker-engine";
import type {CSSProperties, ComponentPropsWithRef, ReactNode, Ref} from "react";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {
  memo,
  use,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusRing} from "react-aria/useFocusRing";
import {cx} from "tailwind-variants";

import {useHaptics} from "../../utils/use-haptics";

import {
  WheelPickerContext,
  WheelPickerGroupContext,
  WheelPickerInternalContext,
  WheelPickerItemContext,
} from "./wheel-picker-context";
import {WheelPickerEngine} from "./wheel-picker-engine";
import {wheelPickerVariants} from "./wheel-picker.styles";

/* -------------------------------------------------------------------------------------------------
 * Constants & helpers
 * -----------------------------------------------------------------------------------------------*/
const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_COUNT = 5;
const DEFAULT_OPACITY: [number, number] = [0.5, 1];
const DEFAULT_SCALE: [number, number] = [0.85, 1];
const DEFAULT_LABEL_COLOR: [string, string] = [
  "var(--foreground)",
  "var(--accent-soft-foreground)",
];
/** Minimum gap between two selection ticks, so fast flings do not buzz continuously (ms). */
const HAPTIC_THROTTLE = 35;

const slots = wheelPickerVariants();

/** `visibleCount` must be odd so one row sits on the indicator; even values round up. */
const toOddCount = (count: number) => {
  const whole = Math.max(1, Math.round(count));

  return whole % 2 === 0 ? whole + 1 : whole;
};

const defaultKeyExtractor = (item: WheelPickerOption<unknown>, index: number) => {
  const {value} = item;

  return value === null || (typeof value !== "object" && typeof value !== "function")
    ? `${String(value)}:${index}`
    : String(index);
};

/** Stable copy of a style object (inline literals would otherwise re-render every row). */
const useStableStyle = (style: CSSProperties | undefined) => {
  const key = style ? JSON.stringify(style) : "";

  return useMemo<CSSProperties | undefined>(
    () => (key ? (JSON.parse(key) as CSSProperties) : undefined),
    [key],
  );
};

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/**
 * Per-row animation: `false` / `"disabled"` turns off the fade, scale and label colour (rows snap),
 * `"disable-all"` also makes every scroll settle instantly, `true` / `undefined` uses the defaults,
 * an object customises the `[edge, center]` ranges.
 */
type WheelPickerRootAnimation =
  | boolean
  | "disabled"
  | "disable-all"
  | {
      /** `[edge, center]` opacity. @default [0.5, 1] */
      opacity?: {value?: [number, number]};
      /** `[edge, center]` scale. @default [0.85, 1] */
      scale?: {value?: [number, number]};
      /**
       * `[edge, center]` label colour (any CSS colour, theme variables included). Interpolated
       * inside the half-row selection band only. @default ["var(--foreground)", "var(--accent-soft-foreground)"]
       */
      labelColor?: {value?: [string, string]};
    };

interface WheelPickerImperativeMethods {
  /** Scrolls the wheel so the given index becomes the selected row. */
  scrollToIndex: (params: WheelPickerScrollToIndexParams) => void;
  /** Scrolls to the row whose value matches (`Object.is`); a no-op when it is not in `items`. */
  scrollToValue: (value: unknown, options?: WheelPickerScrollToValueOptions) => void;
}

/** The root `<div>` with the imperative methods attached. */
type WheelPickerRootRef = HTMLDivElement & WheelPickerImperativeMethods;

interface WheelPickerRenderItemInfo<T> extends Omit<WheelPickerItemRenderProps<T>, "item"> {
  /** The option being rendered. */
  item: WheelPickerOption<T>;
  /** Resolved row height used by layout and animation math. */
  itemHeight: number;
  /** Scroll offset in pixels (read with `get()`; does not re-render). */
  scrollY: WheelPickerLiveValue;
}

type WheelPickerRenderItem<T> = (info: WheelPickerRenderItemInfo<T>) => ReactNode;

interface WheelPickerRootProps<T = unknown> extends Omit<
  ComponentPropsWithRef<"div">,
  "children" | "defaultValue" | "ref"
> {
  /** Compound parts. When omitted, a default `WheelPicker.Indicator` is rendered (not in a group). */
  children?: ReactNode;
  /** List of `{value, label}` rows rendered by the wheel. */
  items: ReadonlyArray<WheelPickerOption<T>>;
  /** Pixel height of a single row (inherited from a `WheelPickerGroup`). @default 44 */
  itemHeight?: number;
  /** Number of visible rows; must be odd (inherited from a `WheelPickerGroup`). @default 5 */
  visibleCount?: number;
  /** Controlled selected value. */
  value?: T;
  /** Initial value when uncontrolled. */
  defaultValue?: T;
  /** Identifies the wheel inside a `WheelPickerGroup` (reads / writes its value via the group). */
  name?: string;
  /** Disables interaction. The wheel still renders the current selection. @default false */
  isDisabled?: boolean;
  /** Additional classes for individual root slots. */
  classNames?: Partial<Record<WheelPickerRootSlots, string>>;
  /** Inline styles for individual root slots. */
  styles?: Partial<Record<WheelPickerRootSlots, CSSProperties>>;
  /** Custom row renderer. Wrap the row in `WheelPicker.Item` to keep sizing and tap-to-focus. */
  renderItem?: WheelPickerRenderItem<T>;
  /** Row key. Defaults to `${value}:${index}` for primitives and `String(index)` otherwise. */
  keyExtractor?: (item: WheelPickerOption<T>, index: number) => string;
  /**
   * Fires when the selected row changes: while scrolling (every row that crosses the indicator),
   * on tap-to-focus, keyboard, and imperative `scrollToIndex` / `scrollToValue`.
   */
  onValueChange?: (value: T) => void;
  /** Per-row opacity / scale / label colour animation. */
  animation?: WheelPickerRootAnimation;
  /**
   * Play a selection tick when a row crosses the indicator. Defaults to the nearest
   * `HapticsProvider` (on by default).
   */
  isHapticFeedbackEnabled?: boolean;
  /** The root element, extended with `scrollToIndex` and `scrollToValue`. */
  ref?: Ref<WheelPickerRootRef>;
}

/* -------------------------------------------------------------------------------------------------
 * Row (internal): provides the item context and subscribes to the scroll offset
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerRowProps {
  engine: WheelPickerEngine;
  index: number;
  isSelected: boolean;
  item: WheelPickerOption<unknown>;
  itemHeight: number;
  /** Distance (rows) from which a row counts as "far" and stops updating. */
  limit: number;
  renderItem?: WheelPickerRenderItem<unknown>;
  scrollY: WheelPickerLiveValue;
}

const WheelPickerRow = memo(function WheelPickerRow({
  engine,
  index,
  isSelected,
  item,
  itemHeight,
  limit,
  renderItem,
  scrollY,
}: WheelPickerRowProps) {
  // Only rows near the viewport see their distance change, so only they re-render per frame.
  const getDistance = useCallback(() => {
    const distance = Math.abs(index - engine.getOffset());

    return distance >= limit ? limit : Math.round(distance * 1000) / 1000;
  }, [engine, index, limit]);
  const absDistance = useSyncExternalStore(engine.subscribe, getDistance, getDistance);

  const context = useMemo<WheelPickerItemRenderProps>(
    () => ({absDistance, index, isSelected, item}),
    [absDistance, index, isSelected, item],
  );

  return (
    <WheelPickerItemContext value={context}>
      {renderItem ? (
        renderItem({absDistance, index, isSelected, item, itemHeight, scrollY})
      ) : (
        <WheelPickerItem />
      )}
    </WheelPickerItemContext>
  );
});

/* -------------------------------------------------------------------------------------------------
 * WheelPicker Root
 * -----------------------------------------------------------------------------------------------*/
function WheelPickerRoot<T = unknown>({
  animation,
  children,
  className,
  classNames,
  defaultValue,
  isDisabled: isDisabledProp = false,
  isHapticFeedbackEnabled,
  itemHeight: itemHeightProp = DEFAULT_ITEM_HEIGHT,
  items,
  keyExtractor,
  name,
  onValueChange,
  ref,
  renderItem,
  style,
  styles,
  value: valueProp,
  visibleCount: visibleCountProp = DEFAULT_VISIBLE_COUNT,
  ...rest
}: WheelPickerRootProps<T>) {
  const group = use(WheelPickerGroupContext);
  const isInsideGroup = group !== null && name !== undefined;
  const itemHeight = Math.max(1, group?.itemHeight ?? itemHeightProp);
  const visibleCount = toOddCount(group?.visibleCount ?? visibleCountProp);
  const isDisabled = isDisabledProp || !!group?.isDisabled;
  const isControlled = valueProp !== undefined;

  /* ----- animation config ----- */
  const isAnimationObject = typeof animation === "object" && animation !== null;
  const isMotionDisabled = animation === "disable-all" || !!group?.isAnimationDisabled;
  const isItemAnimationDisabled =
    animation === false || animation === "disabled" || isMotionDisabled;
  const [opacityEdge, opacityCenter] =
    (isAnimationObject && animation.opacity?.value) || DEFAULT_OPACITY;
  const [scaleEdge, scaleCenter] = (isAnimationObject && animation.scale?.value) || DEFAULT_SCALE;
  const customLabelColor = isAnimationObject ? animation.labelColor?.value : undefined;
  const [labelColorEdge, labelColorCenter] = customLabelColor ?? DEFAULT_LABEL_COLOR;
  const resolvedAnimation = useMemo<WheelPickerResolvedAnimationConfig>(
    () => ({
      labelColor: [labelColorEdge, labelColorCenter],
      opacity: [opacityEdge, opacityCenter],
      scale: [scaleEdge, scaleCenter],
    }),
    [labelColorCenter, labelColorEdge, opacityCenter, opacityEdge, scaleCenter, scaleEdge],
  );

  /* ----- value ----- */
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const currentValue: unknown = isInsideGroup
    ? group.getValue(name)
    : isControlled
      ? valueProp
      : internalValue;
  const valueIndex = useMemo(
    () => items.findIndex((item) => Object.is(item.value, currentValue)),
    [currentValue, items],
  );
  const count = items.length;
  // Last row the wheel selected, used while the value is missing from `items`.
  const [fallbackIndex, setFallbackIndex] = useState(() => Math.max(0, valueIndex));
  const selectedIndex =
    count === 0 ? -1 : valueIndex >= 0 ? valueIndex : Math.min(fallbackIndex, count - 1);

  const [engine] = useState(() => new WheelPickerEngine(Math.max(0, valueIndex)));
  const [mount] = useState(() => {
    const index = Math.max(0, valueIndex);

    return {index, progress: count > 1 ? index / (count - 1) : 0};
  });

  /* ----- commits (selection changes) ----- */
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const lastTickRef = useRef(0);
  const latestRef = useRef({group, haptic, isControlled, isDisabled, items, name, onValueChange});

  useIsomorphicLayoutEffect(() => {
    latestRef.current = {group, haptic, isControlled, isDisabled, items, name, onValueChange};
  });

  const handleCommit = useCallback((index: number, source: WheelPickerMotionSource) => {
    const latest = latestRef.current;
    const item = latest.items[index];

    if (!item) return;

    // One selection tick per row that crosses the indicator (and per key press / tap). The
    // callback runs synchronously inside the pointer / key / click handler that moved the row.
    if (source !== "programmatic") {
      const now = performance.now();

      if (now - lastTickRef.current >= HAPTIC_THROTTLE) {
        lastTickRef.current = now;
        latest.haptic("selection");
      }
    }

    setFallbackIndex(index);
    if (latest.group && latest.name !== undefined) latest.group.setValue(latest.name, item.value);
    else if (!latest.isControlled) setInternalValue(() => item.value);
    latest.onValueChange?.(item.value);
  }, []);

  const handleMotionChange = useCallback((isMoving: boolean) => {
    const {group: latestGroup, name: latestName} = latestRef.current;

    latestGroup?.notifyScrollState(isMoving, latestName);
  }, []);

  const labels = useMemo(() => items.map((item) => item.label), [items]);

  useIsomorphicLayoutEffect(() => {
    engine.setHandlers({onCommit: handleCommit, onMotionChange: handleMotionChange});
    engine.configure({count, isDisabled, isMotionDisabled, itemHeight, labels, visibleCount});
  }, [
    count,
    engine,
    handleCommit,
    handleMotionChange,
    isDisabled,
    isMotionDisabled,
    itemHeight,
    labels,
    visibleCount,
  ]);

  // External value updates (controlled value, group values, items that moved) scroll the wheel
  // without reporting the value back.
  useIsomorphicLayoutEffect(() => {
    if (valueIndex < 0 || valueIndex === engine.committedIndex) return;
    engine.scrollToIndex(valueIndex, {source: "external"});
  }, [engine, valueIndex]);

  /* ----- DOM ----- */
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rootRef.current;

    if (!element) return;

    return engine.attach(element);
  }, [engine]);

  const scrollToIndex = useCallback(
    ({animated = true, index}: WheelPickerScrollToIndexParams) => {
      engine.scrollToIndex(index, {animated, source: "programmatic"});
    },
    [engine],
  );

  const scrollToValue = useCallback(
    (target: unknown, options?: WheelPickerScrollToValueOptions) => {
      const index = latestRef.current.items.findIndex((item) => Object.is(item.value, target));

      if (index < 0) return;
      engine.scrollToIndex(index, {animated: options?.animated ?? true, source: "programmatic"});
    },
    [engine],
  );

  useImperativeHandle(
    ref,
    () => Object.assign(rootRef.current as HTMLDivElement, {scrollToIndex, scrollToValue}),
    [scrollToIndex, scrollToValue],
  );

  const focusIndex = useCallback(
    (index: number) => {
      if (latestRef.current.isDisabled) return;
      engine.scrollToIndex(index, {source: "tap"});
    },
    [engine],
  );

  /* ----- contexts ----- */
  const id = useId();
  const getItemId = useCallback((index: number) => `${id}-option-${index}`, [id]);
  const scrollY = useMemo<WheelPickerLiveValue>(
    () => ({get: () => engine.getOffset() * itemHeight, subscribe: engine.subscribe}),
    [engine, itemHeight],
  );

  const contextValue = useMemo(
    () => ({
      isDisabled,
      isInsideGroup,
      isItemAnimationDisabled,
      itemHeight,
      resolvedAnimation,
      scrollToIndex,
      scrollY,
      visibleCount,
    }),
    [
      isDisabled,
      isInsideGroup,
      isItemAnimationDisabled,
      itemHeight,
      resolvedAnimation,
      scrollToIndex,
      scrollY,
      visibleCount,
    ],
  );

  const itemStyle = useStableStyle(styles?.item);
  const itemLabelStyle = useStableStyle(styles?.itemLabel);
  const itemClassName = classNames?.item;
  const itemLabelClassName = classNames?.itemLabel;
  const internalContextValue = useMemo(
    () => ({
      classNames: {item: itemClassName, itemLabel: itemLabelClassName},
      engine,
      focusIndex,
      getItemId,
      slots,
      styles: {item: itemStyle, itemLabel: itemLabelStyle},
    }),
    [engine, focusIndex, getItemId, itemClassName, itemLabelClassName, itemLabelStyle, itemStyle],
  );

  const {focusProps, isFocusVisible} = useFocusRing();

  const rootStyle = {
    "--wheel-picker-item-height": `${itemHeight}px`,
    // Mount position only: afterwards the engine writes the offset straight to the element.
    "--wheel-picker-offset": mount.index,
    "--wheel-picker-progress": mount.progress,
    "--wheel-picker-visible-count": visibleCount,
    ...(isAnimationObject && animation.opacity?.value
      ? {"--wheel-picker-opacity-center": opacityCenter, "--wheel-picker-opacity-edge": opacityEdge}
      : null),
    ...(isAnimationObject && animation.scale?.value
      ? {"--wheel-picker-scale-center": scaleCenter, "--wheel-picker-scale-edge": scaleEdge}
      : null),
    ...(customLabelColor
      ? {
          "--wheel-picker-label-color-center": labelColorCenter,
          "--wheel-picker-label-color-edge": labelColorEdge,
        }
      : null),
    ...styles?.container,
    ...style,
  } as CSSProperties;

  const rowLimit = (visibleCount + 1) / 2;
  const extractKey = (keyExtractor ?? defaultKeyExtractor) as (
    item: WheelPickerOption<unknown>,
    index: number,
  ) => string;
  const hasChildren = children !== undefined && children !== null;

  return (
    <WheelPickerContext value={contextValue}>
      <WheelPickerInternalContext value={internalContextValue}>
        <div
          {...mergeProps(rest, focusProps)}
          ref={rootRef}
          aria-activedescendant={selectedIndex >= 0 ? getItemId(selectedIndex) : undefined}
          aria-disabled={isDisabled || undefined}
          className={cx(slots.base(), classNames?.container, className)}
          data-disabled={isDisabled || undefined}
          data-focus-visible={isFocusVisible || undefined}
          data-in-group={group ? true : undefined}
          data-item-animation={isItemAnimationDisabled ? "disabled" : undefined}
          data-slot="wheel-picker"
          role="listbox"
          style={rootStyle}
          tabIndex={isDisabled ? -1 : 0}
        >
          <div
            className={slots.content({className: classNames?.contentContainer})}
            data-slot="wheel-picker-content"
            role="presentation"
            style={styles?.contentContainer}
          >
            {items.map((item, index) => (
              <WheelPickerRow
                key={extractKey(item, index)}
                engine={engine}
                index={index}
                isSelected={index === selectedIndex}
                item={item}
                itemHeight={itemHeight}
                limit={rowLimit}
                renderItem={renderItem as WheelPickerRenderItem<unknown> | undefined}
                scrollY={scrollY}
              />
            ))}
          </div>
          {hasChildren ? children : group ? null : <WheelPickerIndicator />}
        </div>
      </WheelPickerInternalContext>
    </WheelPickerContext>
  );
}

WheelPickerRoot.displayName = "HeroUI.WheelPicker";

/* -------------------------------------------------------------------------------------------------
 * WheelPicker Item
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerItemProps extends ComponentPropsWithRef<"div"> {
  /** Custom row content. Defaults to `WheelPicker.ItemLabel` with the option's label. */
  children?: ReactNode;
}

/**
 * Animated row values, applied inline so (like Native) `className` utilities cannot override the
 * fade / scale / label colour; `style` (merged last) and the `animation` prop can.
 */
const ANIMATED_ITEM_STYLE = {
  opacity: "var(--wheel-picker-item-opacity)",
  scale: "var(--wheel-picker-item-scale)",
} as const;
const ANIMATED_LABEL_STYLE = {color: "var(--wheel-picker-label-color)"} as const;

const WheelPickerItem = ({children, className, onClick, style, ...rest}: WheelPickerItemProps) => {
  const internal = use(WheelPickerInternalContext);
  const picker = use(WheelPickerContext);
  const row = use(WheelPickerItemContext);

  if (!internal || !row) {
    throw new Error(
      "WheelPicker.Item must be rendered by a WheelPicker (default row or renderItem).",
    );
  }

  const {index, isSelected, item} = row;
  const animatedStyle = picker?.isItemAnimationDisabled ? null : ANIMATED_ITEM_STYLE;

  return (
    // Options are not tab stops: the listbox root owns focus (aria-activedescendant) and the
    // keyboard; a click (pointer tap or a screen reader activation) focuses the row.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
    <div
      {...rest}
      aria-selected={isSelected}
      className={slots.item({className: cx(internal.classNames?.item, className)})}
      data-index={index}
      data-selected={isSelected || undefined}
      data-slot="wheel-picker-item"
      id={internal.getItemId(index)}
      role="option"
      style={
        {
          "--wheel-picker-index": index,
          ...internal.styles?.item,
          ...animatedStyle,
          ...style,
        } as CSSProperties
      }
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) internal.focusIndex(index);
      }}
    >
      {children ?? <WheelPickerItemLabel>{item.label}</WheelPickerItemLabel>}
    </div>
  );
};

WheelPickerItem.displayName = "HeroUI.WheelPicker.Item";

/* -------------------------------------------------------------------------------------------------
 * WheelPicker ItemLabel
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerItemLabelProps extends ComponentPropsWithRef<"span"> {}

const WheelPickerItemLabel = ({className, style, ...rest}: WheelPickerItemLabelProps) => {
  const internal = use(WheelPickerInternalContext);
  const picker = use(WheelPickerContext);
  // The animated label colour beats `text-*` classes (Native behaviour); inline styles still win.
  const animatedStyle = picker && !picker.isItemAnimationDisabled ? ANIMATED_LABEL_STYLE : null;

  return (
    <span
      {...rest}
      className={slots.itemLabel({className: cx(internal?.classNames?.itemLabel, className)})}
      data-slot="wheel-picker-item-label"
      style={
        animatedStyle || internal?.styles?.itemLabel || style
          ? {...animatedStyle, ...internal?.styles?.itemLabel, ...style}
          : undefined
      }
    />
  );
};

WheelPickerItemLabel.displayName = "HeroUI.WheelPicker.ItemLabel";

/* -------------------------------------------------------------------------------------------------
 * Layout shared by the overlays (a WheelPicker root, or a WheelPickerGroup for shared overlays)
 * -----------------------------------------------------------------------------------------------*/
const useOverlayLayout = () => {
  const picker = use(WheelPickerContext);
  const group = use(WheelPickerGroupContext);

  return {
    itemHeight: picker?.itemHeight ?? group?.itemHeight ?? DEFAULT_ITEM_HEIGHT,
    visibleCount: toOddCount(picker?.visibleCount ?? group?.visibleCount ?? DEFAULT_VISIBLE_COUNT),
  };
};

/* -------------------------------------------------------------------------------------------------
 * WheelPicker IndicatorBackground
 * -----------------------------------------------------------------------------------------------*/
interface WheelPickerIndicatorBackgroundProps extends ComponentPropsWithRef<"div"> {}

const WheelPickerIndicatorBackground = ({
  className,
  ...rest
}: WheelPickerIndicatorBackgroundProps) => (
  <div
    aria-hidden="true"
    className={slots.indicatorBackground({className})}
    data-slot="wheel-picker-indicator-background"
    {...rest}
  />
);

WheelPickerIndicatorBackground.displayName = "HeroUI.WheelPicker.IndicatorBackground";

/* -------------------------------------------------------------------------------------------------
 * WheelPicker Indicator
 * -----------------------------------------------------------------------------------------------*/
type WheelPickerIndicatorSlots = "wrapper" | "highlight";

interface WheelPickerIndicatorProps extends ComponentPropsWithRef<"div"> {
  /** Decorative content rendered inside the highlight (patterns, gradients, icons). */
  children?: ReactNode;
  /** Additional classes for individual indicator slots. */
  classNames?: Partial<Record<WheelPickerIndicatorSlots, string>>;
  /** Inline styles for individual indicator slots. */
  styles?: Partial<Record<WheelPickerIndicatorSlots, CSSProperties>>;
  /**
   * Layer behind the highlight's content. `undefined` renders the themable default
   * (`.wheel-picker__indicator-background`, empty in the default theme), a node replaces it,
   * `null` removes it.
   */
  background?: ReactNode;
}

const WheelPickerIndicator = ({
  background,
  children,
  className,
  classNames,
  style,
  styles,
  ...rest
}: WheelPickerIndicatorProps) => {
  const {itemHeight, visibleCount} = useOverlayLayout();

  return (
    <div
      aria-hidden="true"
      className={slots.indicator({className: cx(classNames?.wrapper, className)})}
      data-slot="wheel-picker-indicator"
      style={
        {
          "--wheel-picker-item-height": `${itemHeight}px`,
          "--wheel-picker-visible-count": visibleCount,
          ...styles?.wrapper,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <div
        className={slots.indicatorHighlight({className: classNames?.highlight})}
        data-slot="wheel-picker-indicator-highlight"
        style={styles?.highlight}
      >
        {background === null ? null : (
          <WheelPickerIndicatorBackground>{background}</WheelPickerIndicatorBackground>
        )}
        {children}
      </div>
    </div>
  );
};

WheelPickerIndicator.displayName = "HeroUI.WheelPicker.Indicator";

/* -------------------------------------------------------------------------------------------------
 * WheelPicker Mask
 * -----------------------------------------------------------------------------------------------*/
type WheelPickerMaskSlots = "top" | "bottom";

interface WheelPickerMaskProps extends Omit<ComponentPropsWithRef<"div">, "children" | "color"> {
  /** Solid colour the fades start from (any CSS colour). @default "var(--background)" */
  color?: string;
  /**
   * Height of each fade. A number is pixels; a percentage scales the default fade height
   * (`(visibleCount - 1) / 4 * itemHeight`); any other string is used as a CSS length.
   * @default "100%"
   */
  height?: number | string;
  /** Additional classes for individual mask slots. */
  classNames?: Partial<Record<WheelPickerMaskSlots, string>>;
  /** Inline styles for individual mask slots. */
  styles?: Partial<Record<WheelPickerMaskSlots, CSSProperties>>;
}

const WheelPickerMask = ({
  className,
  classNames,
  color,
  height = "100%",
  style,
  styles,
  ...rest
}: WheelPickerMaskProps) => {
  const {itemHeight, visibleCount} = useOverlayLayout();
  const defaultHeight = ((visibleCount - 1) / 4) * itemHeight;
  const percentage = typeof height === "string" ? /^(-?\d*\.?\d+)%$/.exec(height.trim()) : null;
  const resolvedHeight =
    typeof height === "number"
      ? `${height}px`
      : percentage
        ? `${(defaultHeight * Number(percentage[1])) / 100}px`
        : height;

  return (
    <div
      aria-hidden="true"
      className={slots.mask()}
      data-slot="wheel-picker-mask"
      style={
        {
          "--wheel-picker-mask-height": resolvedHeight,
          ...(color ? {"--wheel-picker-mask-color": color} : null),
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <div
        className={slots.maskTop({className: cx(className, classNames?.top)})}
        data-slot="wheel-picker-mask-top"
        style={styles?.top}
      />
      <div
        className={slots.maskBottom({className: cx(className, classNames?.bottom)})}
        data-slot="wheel-picker-mask-bottom"
        style={styles?.bottom}
      />
    </div>
  );
};

WheelPickerMask.displayName = "HeroUI.WheelPicker.Mask";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  WheelPickerRoot,
  WheelPickerItem,
  WheelPickerItemLabel,
  WheelPickerIndicator,
  WheelPickerIndicatorBackground,
  WheelPickerMask,
};

export type {
  WheelPickerRootProps,
  WheelPickerItemProps,
  WheelPickerItemLabelProps,
  WheelPickerIndicatorProps,
  WheelPickerIndicatorBackgroundProps,
  WheelPickerMaskProps,
  WheelPickerRootAnimation,
  WheelPickerRootRef,
  WheelPickerImperativeMethods,
  WheelPickerRenderItem,
  WheelPickerRenderItemInfo,
  WheelPickerIndicatorSlots,
  WheelPickerMaskSlots,
};
