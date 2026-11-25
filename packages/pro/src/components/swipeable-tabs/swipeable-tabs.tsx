"use client";

import type {
  PagerSettings,
  SwipeableTabsContextValue,
  SwipeableTabsSelectOptions,
  SwipeableTabsTriggerContextValue,
  SwipeableTabsVariant,
} from "./swipeable-tabs-context";
import type {SwipeableTabsMeasurement} from "./swipeable-tabs-motion";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  Ref,
} from "react";
import type {PressEvent, PressEvents} from "react-aria/usePress";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {
  Children,
  isValidElement,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {useLocale} from "react-aria/I18nProvider";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusRing} from "react-aria/useFocusRing";
import {useHover} from "react-aria/useHover";
import {usePress} from "react-aria/usePress";

import {useMergedRef} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {
  SwipeableTabsContext,
  SwipeableTabsTriggerContext,
  useSwipeableTabsContext,
} from "./swipeable-tabs-context";
import {
  createPositionController,
  createTriggerMeasurer,
  interpolateMeasurement,
  isRTLElement,
  prefersReducedMotion,
} from "./swipeable-tabs-motion";
import {swipeableTabsVariants} from "./swipeable-tabs.styles";
import {useSwipeableTabsPager} from "./use-swipeable-tabs-pager";

const EMPTY_VALUES: readonly string[] = [];
const EMPTY_SET: ReadonlySet<string> = new Set();
const DEFAULT_PAGER_SETTINGS: PagerSettings = {isPageAnimationEnabled: true};

const toIdPart = (value: string) => value.replace(/\s+/g, "-");

const sameValues = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const setFlag = (element: HTMLElement, name: string, on: boolean) => {
  if (on) element.setAttribute(name, "true");
  else element.removeAttribute(name);
};

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Root
 * -----------------------------------------------------------------------------------------------*/
export type SwipeableTabsRootRef = HTMLDivElement & {
  /** Selects a page. `animated` defaults to the pager's `isPageAnimationEnabled`. */
  goTo: (value: string, animated?: boolean) => void;
};

interface SwipeableTabsRootProps extends Omit<
  ComponentPropsWithRef<"div">,
  "defaultValue" | "onChange" | "ref"
> {
  /** `"disable-all"` disables all animations (children included) and switches pages without the slide. */
  animation?: "disable-all";
  /** Compound children, typically `SwipeableTabs.List` and `SwipeableTabs.Pager`. */
  children?: ReactNode;
  /** Initially selected page value (uncontrolled). Falls back to the first page. */
  defaultValue?: string;
  /**
   * Plays a selection haptic when a press or a swipe changes the tab. Defaults to the nearest
   * `HapticsProvider` (enabled when there is none).
   */
  isHapticFeedbackEnabled?: boolean;
  /** Whether pages mount only when first shown. @default false */
  lazy?: boolean;
  /** Called when the selected page changes (press, swipe, keyboard or `goTo`). */
  onValueChange?: (value: string) => void;
  /** Root element with a merged `goTo(value, animated?)` method. */
  ref?: Ref<SwipeableTabsRootRef>;
  /** Rendered in place of a lazy page's content until it mounts. */
  renderLazyPlaceholder?: (value: string) => ReactNode;
  /** Selected page value (controlled). */
  value?: string;
  /** Visual variant of the tab list. @default "primary" */
  variant?: SwipeableTabsVariant;
}

const SwipeableTabsRoot = ({
  animation,
  children,
  className,
  defaultValue,
  isHapticFeedbackEnabled,
  lazy = false,
  onValueChange,
  ref,
  renderLazyPlaceholder,
  style,
  value: valueProp,
  variant = "primary",
  ...rest
}: SwipeableTabsRootProps) => {
  const slots = useMemo(() => swipeableTabsVariants({variant}), [variant]);
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [controller] = useState(createPositionController);
  const [measurer] = useState(createTriggerMeasurer);
  const measurements = useSyncExternalStore(
    measurer.subscribe,
    measurer.getSnapshot,
    measurer.getServerSnapshot,
  );
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const isAnimationDisabled = animation === "disable-all";

  const [values, setValues] = useState<readonly string[]>(EMPTY_VALUES);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = (isControlled ? valueProp : internalValue) ?? values[0];
  const selectedIndex = value === undefined ? -1 : values.indexOf(value);

  // Lazy pages: the selected page mounts on render and every visited page stays mounted.
  const [visited, setVisited] = useState<ReadonlySet<string>>(EMPTY_SET);

  if (lazy && value !== undefined && !visited.has(value)) {
    setVisited(new Set(visited).add(value));
  }

  const pagerSettings = useRef<PagerSettings>(DEFAULT_PAGER_SETTINGS);
  const pendingAnimated = useRef<boolean | undefined>(undefined);
  const isDragging = useRef(false);
  const lastValuesKey = useRef<string | null>(null);

  const select = useCallback(
    (next: string, options?: SwipeableTabsSelectOptions) => {
      if (next === value) return;
      pendingAnimated.current = options?.animated;
      if (options?.haptic) haptic("selection");
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [haptic, isControlled, onValueChange, value],
  );

  const goTo = useCallback(
    (next: string, animated?: boolean) => select(next, {animated}),
    [select],
  );

  const registerValues = useCallback((next: readonly string[]) => {
    setValues((previous) => (sameValues(previous, next) ? previous : next));
  }, []);

  const mountValues = useCallback(
    (next: readonly string[]) => {
      if (!lazy) return;
      setVisited((previous) => {
        if (next.every((item) => previous.has(item))) return previous;
        const updated = new Set(previous);

        for (const item of next) updated.add(item);

        return updated;
      });
    },
    [lazy],
  );

  const registerPager = useCallback((settings: PagerSettings) => {
    pagerSettings.current = settings;

    return () => {
      pagerSettings.current = DEFAULT_PAGER_SETTINGS;
    };
  }, []);

  const setDragging = useCallback((dragging: boolean) => {
    isDragging.current = dragging;
    if (rootRef.current) setFlag(rootRef.current, "data-dragging", dragging);
  }, []);

  const isMounted = useCallback(
    (item: string) => !lazy || item === value || visited.has(item),
    [lazy, value, visited],
  );
  const getIndex = useCallback((item: string) => values.indexOf(item), [values]);
  const getTriggerId = useCallback((item: string) => `${baseId}-tab-${toIdPart(item)}`, [baseId]);
  const getPanelId = useCallback((item: string) => `${baseId}-page-${toIdPart(item)}`, [baseId]);

  // Expose the progress as a CSS variable on the root (fractional page index).
  useIsomorphicLayoutEffect(() => {
    const element = rootRef.current;

    if (!element) return;

    const apply = (position: number) =>
      element.style.setProperty(
        "--swipeable-tabs-progress",
        String(Math.round(position * 10000) / 10000),
      );

    apply(controller.get());

    return controller.subscribe(apply);
  }, [controller]);

  // Follow the selected value: jump on first registration, otherwise slide the pager.
  const valuesKey = values.join("\u0000");

  useIsomorphicLayoutEffect(() => {
    const animatedOverride = pendingAnimated.current;

    pendingAnimated.current = undefined;
    if (selectedIndex < 0) return;

    const valuesChanged = lastValuesKey.current !== valuesKey;

    lastValuesKey.current = valuesKey;
    if (valuesChanged) {
      controller.set(selectedIndex);

      return;
    }
    if (isDragging.current || controller.getTarget() === selectedIndex) return;

    const animated = animatedOverride ?? pagerSettings.current.isPageAnimationEnabled;

    if (!animated || isAnimationDisabled || prefersReducedMotion(rootRef.current)) {
      controller.set(selectedIndex);
    } else {
      controller.animateTo(selectedIndex, {type: "tween"});
    }
  }, [controller, isAnimationDisabled, selectedIndex, valuesKey]);

  useIsomorphicLayoutEffect(() => () => controller.stop(), [controller]);

  useImperativeHandle(
    ref,
    () => Object.assign(rootRef.current as HTMLDivElement, {goTo}) as SwipeableTabsRootRef,
    [goTo],
  );

  const contextValue = useMemo<SwipeableTabsContextValue>(
    () => ({
      baseId,
      controller,
      getIndex,
      getPanelId,
      getTriggerElement: measurer.getElement,
      getTriggerId,
      goTo,
      haptic,
      isAnimationDisabled,
      isMounted,
      measurements,
      mountValues,
      registerPager,
      registerTrigger: measurer.register,
      registerValues,
      renderLazyPlaceholder,
      select,
      selectedIndex,
      setDragging,
      setMeasurement: measurer.set,
      slots,
      value,
      values,
      variant,
    }),
    [
      baseId,
      controller,
      getIndex,
      getPanelId,
      getTriggerId,
      goTo,
      haptic,
      isAnimationDisabled,
      isMounted,
      measurements,
      measurer,
      mountValues,
      registerPager,
      registerValues,
      renderLazyPlaceholder,
      select,
      selectedIndex,
      setDragging,
      slots,
      value,
      values,
      variant,
    ],
  );

  return (
    <SwipeableTabsContext value={contextValue}>
      <div
        {...rest}
        ref={rootRef}
        className={slots.base({className})}
        data-animation={animation}
        data-reduce-motion={isAnimationDisabled ? "true" : undefined}
        data-slot="swipeable-tabs"
        data-variant={variant}
        style={{"--swipeable-tabs-page-count": values.length, ...style} as CSSProperties}
      >
        {children}
      </div>
    </SwipeableTabsContext>
  );
};

SwipeableTabsRoot.displayName = "HeroUI.SwipeableTabs";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs List
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsListProps extends ComponentPropsWithRef<"div"> {
  /**
   * Background layer rendered behind the list surface (for example a `SwipeableTabs.ListBackground`
   * with custom content). `undefined` and `null` render none: web themes register no default.
   */
  background?: ReactNode;
}

const SwipeableTabsList = ({background, children, className, ...rest}: SwipeableTabsListProps) => {
  const {slots, variant} = useSwipeableTabsContext("List");

  return (
    <div
      aria-orientation="horizontal"
      {...rest}
      className={slots.list({className})}
      data-slot="swipeable-tabs-list"
      data-variant={variant}
      role="tablist"
    >
      {background}
      {children}
    </div>
  );
};

SwipeableTabsList.displayName = "HeroUI.SwipeableTabs.List";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs ListBackground
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsListBackgroundProps extends ComponentPropsWithRef<"div"> {}

const SwipeableTabsListBackground = ({className, ...rest}: SwipeableTabsListBackgroundProps) => {
  const {slots} = useSwipeableTabsContext("ListBackground");

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={slots.listBackground({className})}
      data-slot="swipeable-tabs-list-background"
    />
  );
};

SwipeableTabsListBackground.displayName = "HeroUI.SwipeableTabs.ListBackground";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs ScrollView
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsScrollViewProps extends ComponentPropsWithRef<"div"> {
  /** Additional CSS classes for the content container (holds the indicator and triggers). */
  contentContainerClassName?: string;
  /** Where the selected trigger is scrolled to. @default "center" */
  scrollAlign?: "start" | "center" | "end" | "none";
}

const SwipeableTabsScrollView = ({
  children,
  className,
  contentContainerClassName,
  ref,
  scrollAlign = "center",
  ...rest
}: SwipeableTabsScrollViewProps) => {
  const {measurements, slots, value} = useSwipeableTabsContext("ScrollView");
  const {direction} = useLocale();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, scrollerRef);
  const hasScrolled = useRef(false);
  const box: SwipeableTabsMeasurement | undefined =
    value === undefined ? undefined : measurements[value];
  const boxX = box?.x;
  const boxWidth = box?.width;

  // Keep the selected trigger in view.
  useIsomorphicLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;

    if (scrollAlign === "none" || !scroller || !content) return;
    if (boxX === undefined || boxWidth === undefined) return;

    const max = scroller.scrollWidth - scroller.clientWidth;

    if (max <= 0) return;

    const x = content.offsetLeft + boxX;
    const inset = parseFloat(getComputedStyle(content).paddingInlineStart) || 0;
    let left =
      scrollAlign === "start"
        ? x - inset
        : scrollAlign === "end"
          ? x + boxWidth + inset - scroller.clientWidth
          : x + boxWidth / 2 - scroller.clientWidth / 2;

    left = Math.min(Math.max(left, 0), max);
    // RTL scrollers count scrollLeft from the right edge (0 to -max).
    if (isRTLElement(scroller)) left -= max;

    scroller.scrollTo({
      behavior: hasScrolled.current && !prefersReducedMotion(scroller) ? "smooth" : "auto",
      left,
    });
    hasScrolled.current = true;
  }, [boxWidth, boxX, direction, scrollAlign]);

  return (
    <div
      {...rest}
      ref={mergedRef}
      className={slots.scrollView({className})}
      data-slot="swipeable-tabs-scroll-view"
    >
      <div
        ref={contentRef}
        className={slots.scrollViewContent({className: contentContainerClassName})}
        data-slot="swipeable-tabs-scroll-view-content"
      >
        {children}
      </div>
    </div>
  );
};

SwipeableTabsScrollView.displayName = "HeroUI.SwipeableTabs.ScrollView";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Trigger
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsTriggerRenderProps {
  /** Whether the trigger is disabled. */
  isDisabled: boolean;
  /** Whether this trigger is currently selected. */
  isSelected: boolean;
  /** The value of the trigger. */
  value: string;
}

interface SwipeableTabsTriggerProps
  extends
    Omit<ComponentPropsWithRef<"button">, "children" | "disabled" | "value">,
    Pick<PressEvents, "onPress" | "onPressChange" | "onPressEnd" | "onPressStart" | "onPressUp"> {
  /** Trigger content, or a render function receiving the trigger state. */
  children?: ReactNode | ((renderProps: SwipeableTabsTriggerRenderProps) => ReactNode);
  /** Whether the trigger is disabled. @default false */
  isDisabled?: boolean;
  /** The unique value identifying this tab (matched against `SwipeableTabs.Content`). */
  value: string;
}

const NAVIGATION_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

const SwipeableTabsTrigger = ({
  children,
  className,
  isDisabled = false,
  onKeyDown,
  onPress,
  onPressChange,
  onPressEnd,
  onPressStart,
  onPressUp,
  ref,
  value,
  ...rest
}: SwipeableTabsTriggerProps) => {
  const {
    getIndex,
    getPanelId,
    getTriggerId,
    registerTrigger,
    select,
    slots,
    value: selected,
  } = useSwipeableTabsContext("Trigger");
  const elementRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const isSelected = selected === value;
  const triggerId = getTriggerId(value);

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    return registerTrigger(value, element);
  }, [registerTrigger, value]);

  const {isPressed, pressProps} = usePress({
    isDisabled,
    onPress: (event: PressEvent) => {
      // Haptics only for pointer presses; keyboard activation stays silent.
      select(value, {haptic: event.pointerType !== "keyboard" && event.pointerType !== "virtual"});
      onPress?.(event);
    },
    onPressChange,
    onPressEnd,
    onPressStart,
    onPressUp,
  });
  const {hoverProps, isHovered} = useHover({isDisabled});
  const {focusProps, isFocusVisible, isFocused} = useFocusRing();

  // Roving focus between the triggers of the surrounding tablist (automatic activation).
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !NAVIGATION_KEYS.has(event.key)) return;

    const list = event.currentTarget.closest("[role='tablist']");

    if (!list) return;

    const tabs = Array.from(list.querySelectorAll<HTMLElement>("[role='tab']")).filter(
      (tab) =>
        tab.closest("[role='tablist']") === list && tab.getAttribute("aria-disabled") !== "true",
    );
    const current = tabs.indexOf(event.currentTarget);

    if (tabs.length === 0) return;

    const forward = isRTLElement(event.currentTarget) ? "ArrowLeft" : "ArrowRight";
    let next: number;

    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else if (event.key === forward) next = current < 0 ? 0 : (current + 1) % tabs.length;
    else next = current < 0 ? tabs.length - 1 : (current - 1 + tabs.length) % tabs.length;

    const tab = tabs[next];
    const nextValue = tab?.getAttribute("data-value");

    if (!tab) return;
    event.preventDefault();
    tab.focus();
    if (nextValue != null) select(nextValue);
  };

  const triggerContext = useMemo<SwipeableTabsTriggerContextValue>(
    () => ({isDisabled, isSelected, nativeID: triggerId, value}),
    [isDisabled, isSelected, triggerId, value],
  );

  return (
    <SwipeableTabsTriggerContext value={triggerContext}>
      <button
        {...mergeProps(rest, pressProps, hoverProps, focusProps, {onKeyDown: handleKeyDown})}
        ref={mergedRef}
        aria-controls={getIndex(value) >= 0 ? getPanelId(value) : undefined}
        aria-disabled={isDisabled || undefined}
        aria-selected={isSelected}
        className={slots.trigger({className})}
        data-disabled={isDisabled || undefined}
        data-focus-visible={isFocusVisible || undefined}
        data-focused={isFocused || undefined}
        data-hovered={isHovered || undefined}
        data-pressed={isPressed || undefined}
        data-selected={isSelected || undefined}
        data-slot="swipeable-tabs-trigger"
        data-value={value}
        id={triggerId}
        role="tab"
        tabIndex={isSelected && !isDisabled ? 0 : -1}
        type="button"
      >
        {typeof children === "function" ? children({isDisabled, isSelected, value}) : children}
      </button>
    </SwipeableTabsTriggerContext>
  );
};

SwipeableTabsTrigger.displayName = "HeroUI.SwipeableTabs.Trigger";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Label
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsLabelProps extends ComponentPropsWithRef<"span"> {}

const SwipeableTabsLabel = ({className, ...rest}: SwipeableTabsLabelProps) => {
  const {slots} = useSwipeableTabsContext("Label");

  return <span {...rest} className={slots.label({className})} data-slot="swipeable-tabs-label" />;
};

SwipeableTabsLabel.displayName = "HeroUI.SwipeableTabs.Label";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Separator
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsSeparatorAnimationConfig {
  /** Opacity values `[hidden, visible]` and the fade duration. */
  opacity?: {
    timingConfig?: {duration?: number};
    value?: [number, number];
  };
  /** Disable the fade while keeping the custom values. */
  state?: "disabled" | boolean;
}

type SwipeableTabsSeparatorAnimation = boolean | "disabled" | SwipeableTabsSeparatorAnimationConfig;

interface SwipeableTabsSeparatorProps extends ComponentPropsWithRef<"div"> {
  /** Fade configuration (`false` / `"disabled"` switch instantly). */
  animation?: SwipeableTabsSeparatorAnimation;
  /** Values of the two triggers this separator sits between; it hides while either is selected. */
  betweenValues?: string[];
  /** When false, the opacity style is not applied so it can be styled freely. @default true */
  isAnimatedStyleActive?: boolean;
  /** Keep the separator visible regardless of the selected value. @default false */
  isAlwaysVisible?: boolean;
}

const SwipeableTabsSeparator = ({
  animation,
  betweenValues,
  className,
  isAlwaysVisible = false,
  isAnimatedStyleActive = true,
  style,
  ...rest
}: SwipeableTabsSeparatorProps) => {
  const {isAnimationDisabled, slots, value} = useSwipeableTabsContext("Separator");
  const config = typeof animation === "object" ? animation : undefined;
  const isFadeDisabled =
    isAnimationDisabled ||
    animation === false ||
    animation === "disabled" ||
    config?.state === false ||
    config?.state === "disabled";
  const [hiddenOpacity, visibleOpacity] = config?.opacity?.value ?? [0, 1];
  const duration = config?.opacity?.timingConfig?.duration ?? 200;
  const isVisible = isAlwaysVisible || value === undefined || !betweenValues?.includes(value);

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={slots.separator({className})}
      data-slot="swipeable-tabs-separator"
      data-visible={isVisible ? "true" : "false"}
      style={
        isAnimatedStyleActive
          ? {
              opacity: isVisible ? visibleOpacity : hiddenOpacity,
              transitionDuration: isFadeDisabled ? "0ms" : `${duration}ms`,
              ...style,
            }
          : style
      }
    />
  );
};

SwipeableTabsSeparator.displayName = "HeroUI.SwipeableTabs.Separator";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Indicator
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsIndicatorProps extends ComponentPropsWithRef<"div"> {
  /** `"disabled"` / `false` snaps to the selected trigger instead of following the swipe. */
  animation?: "disabled" | false;
  /**
   * When false, the position and size styles are not applied (style the indicator yourself).
   * @default true
   */
  isAnimatedStyleActive?: boolean;
}

const SwipeableTabsIndicator = ({
  animation,
  className,
  isAnimatedStyleActive = true,
  ref,
  ...rest
}: SwipeableTabsIndicatorProps) => {
  const {controller, isAnimationDisabled, measurements, slots, value, values} =
    useSwipeableTabsContext("Indicator");
  const elementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const followsSwipe = animation !== "disabled" && animation !== false && !isAnimationDisabled;

  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;

    if (!element) return;
    if (!isAnimatedStyleActive) {
      element.setAttribute("data-ready", "true");

      return;
    }

    const selectedBox = value === undefined ? undefined : measurements[value];
    const tracks = followsSwipe && value !== undefined && values.includes(value);

    const apply = (position: number) => {
      const box = tracks ? interpolateMeasurement(measurements, values, position) : selectedBox;

      if (!box) {
        element.setAttribute("data-ready", "false");

        return;
      }
      element.style.setProperty("--swipeable-tabs-indicator-x", `${box.x}px`);
      element.style.setProperty("--swipeable-tabs-indicator-y", `${box.y}px`);
      element.style.setProperty("--swipeable-tabs-indicator-width", `${box.width}px`);
      element.style.setProperty("--swipeable-tabs-indicator-height", `${box.height}px`);
      element.setAttribute("data-ready", "true");
    };

    apply(controller.get());
    if (!tracks) return;

    return controller.subscribe(apply);
  }, [controller, followsSwipe, isAnimatedStyleActive, measurements, value, values]);

  return (
    <div
      aria-hidden="true"
      {...rest}
      ref={mergedRef}
      className={slots.indicator({className})}
      data-slot="swipeable-tabs-indicator"
    />
  );
};

SwipeableTabsIndicator.displayName = "HeroUI.SwipeableTabs.Indicator";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Content
 * -----------------------------------------------------------------------------------------------*/
interface SwipeableTabsContentProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Page content. */
  children?: ReactNode;
  /** Value identifying this page, matched against trigger values. */
  value: string;
}

const SwipeableTabsContent = ({children, className, value, ...rest}: SwipeableTabsContentProps) => {
  const {
    getPanelId,
    getTriggerId,
    isMounted,
    renderLazyPlaceholder,
    slots,
    value: selected,
  } = useSwipeableTabsContext("Content");
  const isSelected = selected === value;
  const mounted = isMounted(value);

  return (
    <div
      {...rest}
      aria-labelledby={getTriggerId(value)}
      className={slots.content({className})}
      data-mounted={mounted ? "true" : "false"}
      data-selected={isSelected || undefined}
      data-slot="swipeable-tabs-content"
      data-value={value}
      id={getPanelId(value)}
      inert={!isSelected}
      role="tabpanel"
      tabIndex={isSelected ? 0 : -1}
    >
      {mounted ? (
        children
      ) : renderLazyPlaceholder ? (
        <div className={slots.lazyPlaceholder()} data-slot="swipeable-tabs-lazy-placeholder">
          {renderLazyPlaceholder(value)}
        </div>
      ) : null}
    </div>
  );
};

SwipeableTabsContent.displayName = "HeroUI.SwipeableTabs.Content";

/* -------------------------------------------------------------------------------------------------
 * SwipeableTabs Pager
 * -----------------------------------------------------------------------------------------------*/
/**
 * The Pager ref: the viewport element with the PagerView page methods merged in. Prefer the root
 * `value` / `goTo` so the selection stays in sync; these select the page at `index` too.
 */
export type SwipeableTabsPagerRef = HTMLDivElement & {
  /** Slides to the page at `index` (jumps with reduced motion or `animation="disable-all"`). */
  setPage: (index: number) => void;
  /** Jumps to the page at `index` without the slide. */
  setPageWithoutAnimation: (index: number) => void;
};

interface SwipeableTabsPagerProps extends Omit<ComponentPropsWithRef<"div">, "ref"> {
  /** Pages. Only direct `SwipeableTabs.Content` children are rendered. */
  children?: ReactNode;
  /** Whether trigger presses and value changes slide to the target page. @default true */
  isPageAnimationEnabled?: boolean;
  /** `"on-drag"` blurs a focused field inside the pager when a swipe starts. @default "none" */
  keyboardDismissMode?: "none" | "on-drag";
  /** Called when the pager settles after a drag. */
  onSwipeEnd?: () => void;
  /** Called when the user starts dragging. */
  onSwipeStart?: () => void;
  /** Allow dragging past the first and last page with rubber-band resistance. @default false */
  overdrag?: boolean;
  /** Viewport element with merged `setPage(index)` / `setPageWithoutAnimation(index)`. */
  ref?: Ref<SwipeableTabsPagerRef>;
  /** Whether the user can swipe between pages (touch, mouse drag, trackpad). @default true */
  swipeEnabled?: boolean;
}

type ContentElement = ReactElement<SwipeableTabsContentProps>;

const isContentElement = (child: ReactNode): child is ContentElement =>
  isValidElement(child) && child.type === SwipeableTabsContent;

const SwipeableTabsPager = ({
  children,
  className,
  isPageAnimationEnabled = true,
  keyboardDismissMode = "none",
  onSwipeEnd,
  onSwipeStart,
  overdrag = false,
  ref,
  swipeEnabled = true,
  ...rest
}: SwipeableTabsPagerProps) => {
  const {
    controller,
    isAnimationDisabled,
    mountValues,
    registerPager,
    registerValues,
    select,
    selectedIndex,
    setDragging,
    slots,
    value,
  } = useSwipeableTabsContext("Pager");
  const {direction} = useLocale();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isRTL = direction === "rtl";

  const pages = Children.toArray(children).filter(isContentElement);
  const valuesKey = pages.map((page) => String(page.props.value)).join("\u0000");
  const values = useMemo(() => (valuesKey ? valuesKey.split("\u0000") : []), [valuesKey]);

  useImperativeHandle(
    ref,
    () =>
      Object.assign(viewportRef.current as HTMLDivElement, {
        setPage: (index: number) => {
          const target = values[index];

          if (target !== undefined) select(target, {animated: true});
        },
        setPageWithoutAnimation: (index: number) => {
          const target = values[index];

          if (target !== undefined) select(target, {animated: false});
        },
      }) as SwipeableTabsPagerRef,
    [select, values],
  );

  // Initial page for the first paint (SSR included); afterwards the transform is driven imperatively.
  const [initialIndex] = useState(() =>
    Math.max(0, value === undefined ? 0 : values.indexOf(value)),
  );

  useIsomorphicLayoutEffect(() => {
    registerValues(values);
  }, [registerValues, values]);

  useIsomorphicLayoutEffect(() => () => registerValues([]), [registerValues]);

  useIsomorphicLayoutEffect(
    () => registerPager({isPageAnimationEnabled}),
    [isPageAnimationEnabled, registerPager],
  );

  // Move the track with the position (fractional page index).
  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    const offset = isRTLElement(track) ? 100 : -100;
    const apply = (position: number) => {
      track.style.transform = `translate3d(${position * offset}%, 0, 0)`;
    };

    apply(controller.get());

    return controller.subscribe(apply);
  }, [controller, isRTL]);

  const latestSelectedIndex = useRef(selectedIndex);
  /** Page index the current drag last selected (null outside a drag). */
  const dragSelectedIndex = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    latestSelectedIndex.current = selectedIndex;
  }, [selectedIndex]);

  useSwipeableTabsPager(viewportRef, {
    controller,
    isEnabled: swipeEnabled,
    isRTL,
    onDragMove: (nearestIndex) => {
      // Like Native, the selection (label colour, onValueChange) follows the page nearest to the
      // finger: it flips once the swipe passes halfway. Decided here, inside the pointermove
      // handler, so the selection haptic plays synchronously with the gesture.
      const target = values[nearestIndex];

      if (target === undefined || nearestIndex === dragSelectedIndex.current) return;
      dragSelectedIndex.current = nearestIndex;
      select(target, {haptic: true});
    },
    onDragStart: (fromIndex) => {
      dragSelectedIndex.current = selectedIndex;
      setDragging(true);
      viewportRef.current?.setAttribute("data-dragging", "true");
      mountValues(values.slice(Math.max(0, fromIndex - 1), fromIndex + 2));
      if (keyboardDismissMode === "on-drag") {
        const active = document.activeElement;

        if (active instanceof HTMLElement && viewportRef.current?.contains(active)) active.blur();
      }
      onSwipeStart?.();
    },
    onRelease: (targetIndex, velocity) => {
      const target = values[targetIndex];
      // The drag may already have selected a page that is not rendered yet.
      const currentIndex = dragSelectedIndex.current ?? selectedIndex;

      dragSelectedIndex.current = null;
      setDragging(false);
      viewportRef.current?.removeAttribute("data-dragging");
      // A flick can settle on a page the drag did not reach halfway: decide and announce it
      // synchronously inside the pointerup handler (iOS haptics).
      if (target !== undefined && targetIndex !== currentIndex) {
        select(target, {haptic: true});
      }

      const settle = () => {
        onSwipeEnd?.();
        // A controlled parent may have rejected the change: return to the selected page.
        const selectedNow = latestSelectedIndex.current;

        if (selectedNow >= 0 && selectedNow !== targetIndex) {
          controller.animateTo(selectedNow, {type: "tween"});
        }
      };

      if (isAnimationDisabled || prefersReducedMotion(viewportRef.current)) {
        controller.set(targetIndex);
        settle();
      } else {
        controller.animateTo(targetIndex, {onComplete: settle, type: "spring", velocity});
      }
    },
    onWheelPage: (targetIndex) => {
      const target = values[targetIndex];

      if (target !== undefined) select(target);
    },
    overdrag,
    pageCount: values.length,
  });

  return (
    <div
      {...rest}
      ref={viewportRef}
      className={slots.pager({className})}
      data-slot="swipeable-tabs-pager"
      data-swipe-enabled={swipeEnabled ? "true" : "false"}
    >
      <div
        ref={trackRef}
        className={slots.pagerTrack()}
        data-slot="swipeable-tabs-pager-track"
        style={{transform: `translate3d(${initialIndex * (isRTL ? 100 : -100)}%, 0, 0)`}}
      >
        {pages}
      </div>
    </div>
  );
};

SwipeableTabsPager.displayName = "HeroUI.SwipeableTabs.Pager";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SwipeableTabsRoot,
  SwipeableTabsList,
  SwipeableTabsListBackground,
  SwipeableTabsScrollView,
  SwipeableTabsTrigger,
  SwipeableTabsLabel,
  SwipeableTabsSeparator,
  SwipeableTabsIndicator,
  SwipeableTabsPager,
  SwipeableTabsContent,
};

export type {
  SwipeableTabsRootProps,
  SwipeableTabsListProps,
  SwipeableTabsListBackgroundProps,
  SwipeableTabsScrollViewProps,
  SwipeableTabsTriggerProps,
  SwipeableTabsTriggerRenderProps,
  SwipeableTabsLabelProps,
  SwipeableTabsSeparatorProps,
  SwipeableTabsSeparatorAnimation,
  SwipeableTabsSeparatorAnimationConfig,
  SwipeableTabsIndicatorProps,
  SwipeableTabsPagerProps,
  SwipeableTabsContentProps,
};
