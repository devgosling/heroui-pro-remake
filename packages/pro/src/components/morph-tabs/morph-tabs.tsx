"use client";

import type {
  MorphTabsContextValue,
  MorphTabsInternalContextValue,
  MorphTabsPagerConfig,
  MorphTabsSelectSource,
  MorphTabsTriggerContextValue,
} from "./morph-tabs-context";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
} from "react";
import type {PressEvents} from "react-aria/usePress";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {
  Children,
  Fragment,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {useLocale} from "react-aria/I18nProvider";
import {mergeProps} from "react-aria/mergeProps";
import {useFocusRing} from "react-aria/useFocusRing";
import {useHover} from "react-aria/useHover";
import {usePress} from "react-aria/usePress";

import {useMergedRef} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {
  MORPH_TABS_PROGRESS_VAR,
  MorphTabsContext,
  MorphTabsInternalContext,
  MorphTabsProgressStore,
  MorphTabsTriggerContext,
  useMorphTabs,
} from "./morph-tabs-context";
import {PagerAnimator, getSlideDuration} from "./morph-tabs-motion";
import {morphTabsVariants} from "./morph-tabs.styles";
import {useMorphTabsPager} from "./use-morph-tabs-pager";

/* -------------------------------------------------------------------------------------------------
 * Shared types
 * -----------------------------------------------------------------------------------------------*/

/** `[inactive, active]` values, interpolated against the pager position. */
type MorphTabsAnimationTuple = [number, number];

/**
 * - `false` / `"disabled"`: snap to the selected state
 * - `true` / `undefined`: follow the pager position
 * - object: custom `[inactive, active]` values
 */
type MorphTabsTriggerAnimation =
  | boolean
  | "disabled"
  | {
      /** flex-grow `[inactive, active]`. @default [0, 1] */
      flexGrow?: {value?: MorphTabsAnimationTuple};
    };

type MorphTabsIconAnimation =
  | boolean
  | "disabled"
  | {
      /** opacity `[inactive, active]`. @default [0.5, 1] */
      opacity?: {value?: MorphTabsAnimationTuple};
    };

type MorphTabsLabelAnimation =
  | boolean
  | "disabled"
  | {
      /** opacity `[inactive, active]`. @default [0, 1] */
      opacity?: {value?: MorphTabsAnimationTuple};
    };

type MorphStyle = CSSProperties & Record<`--${string}`, string | number | undefined>;

const EMPTY_VALUES: string[] = [];

const isSnapAnimation = (animation: unknown) => animation === false || animation === "disabled";

const prefersReducedMotion = (element: Element | null) => {
  if (typeof window === "undefined") return false;
  if (element?.closest('[data-reduce-motion="true"]')) return true;

  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
};

/** Turns a page value into something safe for `id` / `aria-controls` (no spaces). */
const toIdPart = (value: string) =>
  value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(36)}`);

const sameValues = (a: string[] | null, b: string[] | null) =>
  a === b || (!!a && !!b && a.length === b.length && a.every((value, index) => value === b[index]));

const TABBABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

const useInternalContext = (part: string): MorphTabsInternalContextValue => {
  const context = use(MorphTabsInternalContext);

  if (!context) throw new Error(`<${part}> must be used within a <MorphTabs> component.`);

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Content (one page)
 * -----------------------------------------------------------------------------------------------*/
interface MorphTabsContentProps extends ComponentPropsWithRef<"div"> {
  /** Value identifying this page, matched against trigger values. */
  value: string;
}

const MorphTabsContent = ({children, className, ref, value, ...rest}: MorphTabsContentProps) => {
  const {getContentId, getTriggerId, renderLazyPlaceholder, slots} =
    useInternalContext("MorphTabs.Content");
  const {isMounted, value: selectedValue} = useMorphTabs();
  const {focusProps, isFocusVisible} = useFocusRing();
  const elementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const isSelected = selectedValue === value;
  const isPageMounted = isMounted(value);
  const hasOwnTabIndex = rest.tabIndex !== undefined;

  // WAI-ARIA: the selected panel is a tab stop only when it has no tabbable content of its own.
  useIsomorphicLayoutEffect(() => {
    const element = elementRef.current;

    if (!element || hasOwnTabIndex) return;
    if (isSelected && !element.querySelector(TABBABLE)) element.setAttribute("tabindex", "0");
    else element.removeAttribute("tabindex");
  });

  return (
    <div
      {...mergeProps(rest, focusProps)}
      ref={mergedRef}
      aria-labelledby={getTriggerId(value)}
      className={slots.content({className})}
      data-focus-visible={isFocusVisible || undefined}
      data-lazy-placeholder={!isPageMounted || undefined}
      data-selected={isSelected || undefined}
      data-slot="morph-tabs-content"
      data-value={value}
      id={getContentId(value)}
      inert={!isSelected}
      role="tabpanel"
    >
      {isPageMounted ? children : renderLazyPlaceholder?.(value)}
    </div>
  );
};

MorphTabsContent.displayName = "HeroUI.MorphTabs.Content";

type ContentElement = ReactElement<MorphTabsContentProps>;

const isContentElement = (node: unknown): node is ContentElement =>
  isValidElement(node) && node.type === MorphTabsContent;

/* -------------------------------------------------------------------------------------------------
 * Pager
 * -----------------------------------------------------------------------------------------------*/
type MorphTabsPagerRef = HTMLDivElement & {
  /** Selects the page at `index` with the slide animation. */
  setPage: (index: number) => void;
  /** Selects the page at `index` without animation. */
  setPageWithoutAnimation: (index: number) => void;
};

interface MorphTabsPagerProps extends Omit<ComponentPropsWithRef<"div">, "ref"> {
  ref?: Ref<MorphTabsPagerRef>;
  /** Pages. Only direct MorphTabs.Content children are rendered. */
  children?: ReactNode;
  /** Whether the user can swipe (touch / mouse drag / trackpad) between pages. @default true */
  swipeEnabled?: boolean;
  /** Whether trigger presses and value changes slide to the target page. @default true */
  isPageAnimationEnabled?: boolean;
  /** Whether the pages rubber-band when dragged past the first / last page. @default false */
  overdrag?: boolean;
  /** Blur a focused text field inside the pager when a drag starts. @default "on-drag" */
  keyboardDismissMode?: "none" | "on-drag";
  /** Called when the user starts dragging. */
  onSwipeStart?: () => void;
  /** Called when the pager settles after a drag. */
  onSwipeEnd?: () => void;
}

const collectPages = (children: ReactNode): ContentElement[] => {
  const pages: ContentElement[] = [];

  Children.forEach(children, (child) => {
    if (isContentElement(child)) pages.push(child);
    else if (isValidElement<{children?: ReactNode}>(child) && child.type === Fragment) {
      pages.push(...collectPages(child.props.children));
    }
  });

  return pages;
};

const MorphTabsPager = ({
  children,
  className,
  isPageAnimationEnabled = true,
  keyboardDismissMode = "on-drag",
  onSwipeEnd,
  onSwipeStart,
  overdrag = false,
  ref,
  swipeEnabled = true,
  ...rest
}: MorphTabsPagerProps) => {
  const internal = useInternalContext("MorphTabs.Pager");
  const {goToIndex, registerValues, setPagerConfig, slots} = internal;
  const pages = useMemo(() => collectPages(children), [children]);
  const pageValues = useMemo(() => pages.map((page) => page.props.value), [pages]);
  const pagerRef = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    registerValues(pageValues);
  }, [pageValues, registerValues]);

  useIsomorphicLayoutEffect(() => () => registerValues(null), [registerValues]);

  useIsomorphicLayoutEffect(() => {
    setPagerConfig({isPageAnimationEnabled});
  }, [isPageAnimationEnabled, setPagerConfig]);

  const localRef = useCallback(
    (node: HTMLDivElement | null) => {
      pagerRef.current = node;
      if (node) {
        Object.assign(node, {
          setPage: (index: number) => goToIndex(index, true),
          setPageWithoutAnimation: (index: number) => goToIndex(index, false),
        });
      }
    },
    [goToIndex],
  );
  const mergedRef = useMergedRef(ref as Ref<HTMLDivElement> | undefined, localRef);

  const gestureProps = useMorphTabsPager({
    internal,
    keyboardDismissMode,
    onSwipeEnd,
    onSwipeStart,
    overdrag,
    pagerRef,
    swipeEnabled,
  });

  return (
    <div
      {...mergeProps(rest, gestureProps)}
      ref={mergedRef}
      className={slots.pager({className})}
      data-slot="morph-tabs-pager"
      data-swipe-enabled={swipeEnabled ? "true" : "false"}
    >
      <div className={slots.track()} data-slot="morph-tabs-track">
        {pages}
      </div>
    </div>
  );
};

MorphTabsPager.displayName = "HeroUI.MorphTabs.Pager";

/* -------------------------------------------------------------------------------------------------
 * List (tablist)
 * -----------------------------------------------------------------------------------------------*/
interface MorphTabsListProps extends ComponentPropsWithRef<"div"> {}

const MorphTabsList = ({className, ...rest}: MorphTabsListProps) => {
  const {slots} = useInternalContext("MorphTabs.List");

  return (
    <div
      aria-orientation="horizontal"
      role="tablist"
      {...rest}
      className={slots.list({className})}
      data-slot="morph-tabs-list"
    />
  );
};

/**
 * Arrow keys / Home / End move focus between the tabs of the same tablist and return the newly
 * focused tab (automatic activation selects it). Disabled tabs are skipped.
 */
const focusSiblingTab = (
  event: ReactKeyboardEvent<HTMLElement>,
  direction: "ltr" | "rtl",
): HTMLElement | undefined => {
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined;

  const target = event.currentTarget;
  const list = target.closest('[role="tablist"]');

  if (!list) return undefined;

  const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
    (tab) =>
      tab.closest('[role="tablist"]') === list && tab.getAttribute("aria-disabled") !== "true",
  );

  if (!tabs.length) return undefined;

  const current = tabs.indexOf(target);
  // Follow the direction that is actually rendered (dir attribute), falling back to the locale.
  const isRTL =
    typeof window === "undefined"
      ? direction === "rtl"
      : window.getComputedStyle(list).direction === "rtl";
  const nextKey = isRTL ? "ArrowLeft" : "ArrowRight";
  const previousKey = isRTL ? "ArrowRight" : "ArrowLeft";
  let next: HTMLElement | undefined;

  switch (event.key) {
    case nextKey:
      next = tabs[(current + 1) % tabs.length];
      break;
    case previousKey:
      next = tabs[current <= 0 ? tabs.length - 1 : current - 1];
      break;
    case "Home":
      next = tabs[0];
      break;
    case "End":
      next = tabs[tabs.length - 1];
      break;
    default:
      return undefined;
  }

  event.preventDefault();
  next?.focus();

  return next;
};

MorphTabsList.displayName = "HeroUI.MorphTabs.List";

/* -------------------------------------------------------------------------------------------------
 * TriggerBackground
 * -----------------------------------------------------------------------------------------------*/
interface MorphTabsTriggerBackgroundProps extends ComponentPropsWithRef<"span"> {}

const MorphTabsTriggerBackground = ({className, ...rest}: MorphTabsTriggerBackgroundProps) => {
  const internal = use(MorphTabsInternalContext);

  return (
    <span
      aria-hidden="true"
      className={internal?.slots.triggerBackground({className}) ?? className}
      data-slot="morph-tabs-trigger-background"
      {...rest}
    />
  );
};

MorphTabsTriggerBackground.displayName = "HeroUI.MorphTabs.TriggerBackground";

/* -------------------------------------------------------------------------------------------------
 * Trigger (tab pill)
 * -----------------------------------------------------------------------------------------------*/
interface MorphTabsTriggerRenderProps {
  /** Whether this trigger's page is selected. */
  isSelected: boolean;
  /** The trigger's page value. */
  value: string;
  /** Page index (-1 when no MorphTabs.Content matches). */
  index: number;
  /** Whether the trigger is disabled. */
  isDisabled: boolean;
  /** Whether the trigger is being pressed (web). */
  isPressed: boolean;
  /** Whether a mouse hovers the trigger (web). */
  isHovered: boolean;
  /** Whether the trigger has keyboard focus (web). */
  isFocusVisible: boolean;
}

interface MorphTabsTriggerProps
  extends
    Omit<
      ComponentPropsWithRef<"button">,
      "children" | "value" | "disabled" | "type" | keyof PressEvents
    >,
    PressEvents {
  /** Value of the MorphTabs.Content page this trigger selects. */
  value: string;
  /** Trigger content, or a render function receiving the trigger state. */
  children?: ReactNode | ((props: MorphTabsTriggerRenderProps) => ReactNode);
  /** Whether the trigger is disabled (the page can still be reached by swiping). @default false */
  isDisabled?: boolean;
  /** Background layer behind the pill: `undefined` = default, node = replacement, `null` = none. */
  background?: ReactNode | null;
  /** Animation configuration for the pill morph. */
  animation?: MorphTabsTriggerAnimation;
  /** When false, the morph flex-grow is not applied. @default true */
  isAnimatedStyleActive?: boolean;
}

const MorphTabsTrigger = ({
  animation,
  background,
  children,
  className,
  isAnimatedStyleActive = true,
  isDisabled = false,
  onKeyDown,
  onPress,
  onPressChange,
  onPressEnd,
  onPressStart,
  onPressUp,
  style,
  value,
  ...rest
}: MorphTabsTriggerProps) => {
  const {direction, getContentId, getTriggerId, isAnimationDisabled, select, slots} =
    useInternalContext("MorphTabs.Trigger");
  const {getIndex, value: selectedValue} = useMorphTabs();
  const index = getIndex(value);
  const isSelected = selectedValue === value;

  const {isPressed, pressProps} = usePress({
    isDisabled,
    onPress: (event) => {
      select(value, event.pointerType === "keyboard" ? "keyboard" : "press");
      onPress?.(event);
    },
    onPressChange,
    onPressEnd,
    onPressStart,
    onPressUp,
  });
  const {hoverProps, isHovered} = useHover({isDisabled});
  const {focusProps, isFocusVisible, isFocused} = useFocusRing();

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const next = focusSiblingTab(event, direction);
    const nextValue = next?.getAttribute("data-value");

    if (nextValue != null) select(nextValue, "keyboard");
  };

  const isSnap = isAnimationDisabled || isSnapAnimation(animation);
  const flexGrow = typeof animation === "object" ? animation.flexGrow?.value : undefined;

  const triggerContext = useMemo<MorphTabsTriggerContextValue>(
    () => ({index, isDisabled, isSelected, value}),
    [index, isDisabled, isSelected, value],
  );

  const resolvedChildren =
    typeof children === "function"
      ? children({index, isDisabled, isFocusVisible, isHovered, isPressed, isSelected, value})
      : children;

  const morphStyle: MorphStyle = {
    "--morph-tabs-index": index,
    "--morph-tabs-trigger-selected": isSelected ? 1 : 0,
    ...(flexGrow
      ? {
          "--morph-tabs-trigger-grow-from": flexGrow[0],
          "--morph-tabs-trigger-grow-to": flexGrow[1],
        }
      : null),
    ...style,
  };

  return (
    <button
      {...mergeProps(rest, {onKeyDown: handleKeyDown}, pressProps, hoverProps, focusProps)}
      aria-controls={index >= 0 ? getContentId(value) : undefined}
      aria-disabled={isDisabled || undefined}
      aria-selected={isSelected}
      className={slots.trigger({className})}
      data-animated-style={isAnimatedStyleActive ? undefined : "false"}
      data-disabled={isDisabled || undefined}
      data-focus-visible={isFocusVisible || undefined}
      data-focused={isFocused || undefined}
      data-hovered={isHovered || undefined}
      data-morph={isSnap ? "snap" : undefined}
      data-pressed={isPressed || undefined}
      data-selected={isSelected || undefined}
      data-slot="morph-tabs-trigger"
      data-value={value}
      id={getTriggerId(value)}
      role="tab"
      style={morphStyle}
      tabIndex={isSelected ? 0 : -1}
      type="button"
    >
      {background === undefined ? <MorphTabsTriggerBackground /> : background}
      <MorphTabsTriggerContext value={triggerContext}>{resolvedChildren}</MorphTabsTriggerContext>
    </button>
  );
};

MorphTabsTrigger.displayName = "HeroUI.MorphTabs.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Icon
 * -----------------------------------------------------------------------------------------------*/
interface MorphTabsIconProps extends ComponentPropsWithRef<"span"> {
  /** Opacity morph. @default { opacity: { value: [0.5, 1] } } */
  animation?: MorphTabsIconAnimation;
  /** When false, the morph opacity is not applied. @default true */
  isAnimatedStyleActive?: boolean;
}

const MorphTabsIcon = ({
  animation,
  children,
  className,
  isAnimatedStyleActive = true,
  style,
  ...rest
}: MorphTabsIconProps) => {
  const {isAnimationDisabled, slots} = useInternalContext("MorphTabs.Icon");
  const opacity = typeof animation === "object" ? animation.opacity?.value : undefined;
  const iconStyle: MorphStyle = {
    ...(opacity
      ? {
          "--morph-tabs-icon-opacity-from": opacity[0],
          "--morph-tabs-icon-opacity-to": opacity[1],
        }
      : null),
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      {...rest}
      className={slots.icon({className})}
      data-animated-style={isAnimatedStyleActive ? undefined : "false"}
      data-morph={isAnimationDisabled || isSnapAnimation(animation) ? "snap" : undefined}
      data-slot="morph-tabs-icon"
      style={iconStyle}
    >
      {children}
    </span>
  );
};

MorphTabsIcon.displayName = "HeroUI.MorphTabs.Icon";

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/
interface MorphTabsLabelSlots {
  /** Clipping container whose max-width grows from 0 to the label width. */
  container?: string;
  /** The label text. */
  text?: string;
}

interface MorphTabsLabelProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /** Label text. */
  children?: ReactNode;
  /** Additional CSS classes for individual slots (`className` targets the text). */
  classNames?: MorphTabsLabelSlots;
  /** Styles for individual slots. */
  styles?: {container?: CSSProperties; text?: CSSProperties};
  /** Maximum number of lines. @default 1 */
  numberOfLines?: number;
  /**
   * How overflowing text is cut while the pill is narrower than the label. On the web `head` and
   * `middle` fall back to `tail`. @default "clip"
   */
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  /** Opacity morph. @default { opacity: { value: [0, 1] } } */
  animation?: MorphTabsLabelAnimation;
  /** When false, the label is always fully shown. @default true */
  isAnimatedStyleActive?: boolean;
}

const MorphTabsLabel = ({
  animation,
  children,
  className,
  classNames,
  ellipsizeMode = "clip",
  isAnimatedStyleActive = true,
  numberOfLines = 1,
  ref,
  style,
  styles,
  ...rest
}: MorphTabsLabelProps) => {
  const {isAnimationDisabled, slots} = useInternalContext("MorphTabs.Label");
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRef(ref, textRef);

  // Measure the natural label width (incl. the gap to the icon) that the container grows to. It is
  // written straight to the container (no React render) and re-measured whenever the text box
  // resizes, e.g. after a web font loads or the theme's --font-sans changes.
  useIsomorphicLayoutEffect(() => {
    const text = textRef.current;
    const container = containerRef.current;

    if (!text || !container) return;

    let measured = -1;
    const measure = () => {
      const width = Math.max(text.offsetWidth, text.scrollWidth) + 1;

      if (width === measured) return;
      measured = width;
      container.style.setProperty("--morph-tabs-label-width", `${width}px`);
    };

    measure();

    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);

    observer?.observe(text);
    fonts?.addEventListener?.("loadingdone", measure);

    return () => {
      observer?.disconnect();
      fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, [children, ellipsizeMode, numberOfLines]);

  const opacity = typeof animation === "object" ? animation.opacity?.value : undefined;
  const containerStyle: MorphStyle = {
    ...(opacity
      ? {
          "--morph-tabs-label-opacity-from": opacity[0],
          "--morph-tabs-label-opacity-to": opacity[1],
        }
      : null),
    ...styles?.container,
  };
  const textStyle: MorphStyle = {
    ...(numberOfLines > 1 ? {"--morph-tabs-label-lines": numberOfLines} : null),
    ...styles?.text,
    ...style,
  };

  return (
    <span
      ref={containerRef}
      className={slots.label({className: classNames?.container})}
      data-animated-style={isAnimatedStyleActive ? undefined : "false"}
      data-morph={isAnimationDisabled || isSnapAnimation(animation) ? "snap" : undefined}
      data-slot="morph-tabs-label"
      style={containerStyle}
    >
      <span
        {...rest}
        ref={mergedRef}
        className={slots.labelText({className: [classNames?.text, className]})}
        data-ellipsize={ellipsizeMode === "clip" ? "clip" : "tail"}
        data-multiline={numberOfLines > 1 || undefined}
        data-slot="morph-tabs-label-text"
        style={textStyle}
      >
        {children}
      </span>
    </span>
  );
};

MorphTabsLabel.displayName = "HeroUI.MorphTabs.Label";

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
type MorphTabsRootRef = HTMLDivElement & {
  /** Selects a page. `animated` defaults to the pager's `isPageAnimationEnabled`. */
  goTo: (value: string, animated?: boolean) => void;
};

interface MorphTabsRootProps extends Omit<
  ComponentPropsWithRef<"div">,
  "ref" | "defaultValue" | "onChange"
> {
  ref?: Ref<MorphTabsRootRef>;
  /** Compound children, typically MorphTabs.List and MorphTabs.Pager in any order. */
  children?: ReactNode;
  /** Selected page value (controlled). */
  value?: string;
  /** Initially selected page value (uncontrolled). Falls back to the first page. */
  defaultValue?: string;
  /** Called when the selected page changes (tap, swipe, keyboard or goTo). */
  onValueChange?: (value: string) => void;
  /** Whether pages mount only when first shown. @default false */
  lazy?: boolean;
  /** Rendered in place of a lazy page's content until it mounts. */
  renderLazyPlaceholder?: (value: string) => ReactNode;
  /** `"disable-all"` snaps the pills to the selected state and switches pages without the slide. */
  animation?: "disable-all";
  /**
   * Whether a selection haptic plays when a swipe, press or arrow key changes the page.
   * Defaults to the nearest `HapticsProvider` (enabled).
   */
  isHapticFeedbackEnabled?: boolean;
}

/** Finds the page values of a Pager that is a direct child (or inside fragments) of the root. */
const findPageValues = (children: ReactNode): string[] | null => {
  let found: string[] | null = null;

  Children.forEach(children, (child) => {
    if (found || !isValidElement<{children?: ReactNode}>(child)) return;
    if (child.type === MorphTabsPager) {
      found = collectPages(child.props.children).map((page) => page.props.value);
    } else if (child.type === Fragment) {
      found = findPageValues(child.props.children);
    }
  });

  return found;
};

interface LatestState {
  values: string[];
  value: string | undefined;
  selectedIndex: number;
  isControlled: boolean;
  isAnimationDisabled: boolean;
  lazy: boolean;
  onValueChange?: (value: string) => void;
  haptic: (type?: "selection") => void;
}

const MorphTabsRoot = ({
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
  ...rest
}: MorphTabsRootProps) => {
  const slots = useMemo(() => morphTabsVariants(), []);
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const {direction} = useLocale();
  const baseId = useId();
  const isAnimationDisabled = animation === "disable-all";

  /* ---- pages ---- */
  const staticValues = useMemo(() => findPageValues(children), [children]);
  const [registeredValues, setRegisteredValues] = useState<string[] | null>(null);
  const values = registeredValues ?? staticValues ?? EMPTY_VALUES;

  /* ---- selection ---- */
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = (isControlled ? valueProp : uncontrolledValue) ?? values[0];
  const selectedIndex = value === undefined ? -1 : values.indexOf(value);
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  /* ---- lazy pages: the selected page always mounts, visited pages stay mounted ---- */
  const [mounted, setMounted] = useState<ReadonlySet<string>>(
    () => new Set(value === undefined ? [] : [value]),
  );

  if (lazy && value !== undefined && !mounted.has(value)) {
    setMounted(new Set(mounted).add(value));
  }

  /* ---- pager position ---- */
  const [initialPosition] = useState(() => Math.max(0, selectedIndex));
  const [progress] = useState(() => new MorphTabsProgressStore(initialPosition));
  const [animator] = useState(
    () => new PagerAnimator(progress.get, (position) => progress.set(position)),
  );
  const rootElementRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef(initialPosition);
  const draggingRef = useRef(false);
  const pagerConfigRef = useRef<MorphTabsPagerConfig>({isPageAnimationEnabled: true});
  const previousIndexRef = useRef(selectedIndex);
  const latestRef = useRef<LatestState>({
    haptic,
    isAnimationDisabled,
    isControlled,
    lazy,
    onValueChange,
    selectedIndex,
    value,
    values,
  });

  const engine = useMemo(() => {
    const resolveAnimated = (animated?: boolean) =>
      (animated ??
        (!latestRef.current.isAnimationDisabled &&
          pagerConfigRef.current.isPageAnimationEnabled)) &&
      !prefersReducedMotion(rootElementRef.current);

    const markMounted = (pageValues: Array<string | undefined>) => {
      if (!latestRef.current.lazy) return;
      setMounted((previous) => {
        let next = previous;

        for (const pageValue of pageValues) {
          if (pageValue === undefined || next.has(pageValue)) continue;
          if (next === previous) next = new Set(previous);
          (next as Set<string>).add(pageValue);
        }

        return next;
      });
    };

    // Brings the pager back to the selected page when a slide ends on another one
    // (e.g. a controlled parent rejected the change).
    const reconcile = () => {
      const {selectedIndex: index} = latestRef.current;

      if (draggingRef.current || animator.isAnimating || index < 0) return;
      if (targetRef.current !== index) moveTo(index, resolveAnimated());
    };

    const moveTo = (index: number, animated: boolean) => {
      targetRef.current = index;
      const from = progress.get();

      if (!animated) {
        animator.stop();
        progress.set(index);

        return;
      }
      animator.tween(index, getSlideDuration(Math.abs(index - from)), reconcile);
    };

    /** Updates the selection; returns true when it changed. */
    const commit = (next: string, source: MorphTabsSelectSource) => {
      const latest = latestRef.current;

      if (next === latest.value) return false;
      // Haptics only for user gestures; must run synchronously inside the event handler.
      if (source === "press" || source === "keyboard" || source === "swipe") {
        latest.haptic("selection");
      }
      latestRef.current = {...latest, selectedIndex: latest.values.indexOf(next), value: next};
      if (latest.isControlled) forceRender();
      else setUncontrolledValue(next);
      latest.onValueChange?.(next);

      return true;
    };

    const select = (next: string, source: MorphTabsSelectSource, animated?: boolean) => {
      const index = latestRef.current.values.indexOf(next);

      if (index < 0) return;
      markMounted([next]);
      commit(next, source);
      moveTo(index, resolveAnimated(animated));
    };

    const step = (delta: number, source: MorphTabsSelectSource) => {
      const {selectedIndex: index, values: pageValues} = latestRef.current;
      const base = index >= 0 ? index : Math.round(progress.get());
      const next = pageValues[Math.min(pageValues.length - 1, Math.max(0, base + delta))];

      if (next !== undefined) select(next, source);
    };

    const goToIndex = (index: number, animated?: boolean) => {
      const next = latestRef.current.values[index];

      if (next !== undefined) select(next, "program", animated);
    };

    const drag: MorphTabsInternalContextValue["drag"] = {
      end: (target, velocity, onSettled) => {
        draggingRef.current = false;
        const {values: pageValues} = latestRef.current;
        const next = pageValues[target];

        if (next !== undefined) {
          markMounted([next]);
          commit(next, "swipe");
        }
        targetRef.current = target;

        const settle = () => {
          onSettled?.();
          reconcile();
        };

        if (prefersReducedMotion(rootElementRef.current)) {
          animator.stop();
          progress.set(target);
          settle();

          return;
        }
        animator.spring(target, velocity, settle, {
          max: Math.max(0, pageValues.length - 1),
          min: 0,
        });
      },
      getPageCount: () => latestRef.current.values.length,
      getPosition: progress.get,
      isAnimating: () => animator.isAnimating,
      move: (position) => progress.set(position),
      start: () => {
        animator.stop();
        draggingRef.current = true;
        const position = progress.get();
        const pageValues = latestRef.current.values;

        // Both neighbours mount as soon as a drag starts.
        markMounted([
          pageValues[Math.floor(position) - 1],
          pageValues[Math.floor(position)],
          pageValues[Math.ceil(position)],
          pageValues[Math.ceil(position) + 1],
        ]);
      },
      stop: () => animator.stop(),
    };

    return {drag, goToIndex, moveTo, resolveAnimated, select, step};
  }, [animator, progress]);

  // Keep the latest props for the event handlers and follow external value changes.
  useIsomorphicLayoutEffect(() => {
    latestRef.current = {
      haptic,
      isAnimationDisabled,
      isControlled,
      lazy,
      onValueChange,
      selectedIndex,
      value,
      values,
    };

    const previousIndex = previousIndexRef.current;

    previousIndexRef.current = selectedIndex;
    if (selectedIndex < 0 || draggingRef.current || animator.isAnimating) return;
    if (targetRef.current !== selectedIndex) {
      // First registration jumps; later changes (controlled value, goTo) slide.
      engine.moveTo(selectedIndex, previousIndex >= 0 && engine.resolveAnimated());
    }
  });

  useEffect(() => () => animator.stop(), [animator]);

  const goTo = useCallback(
    (next: string, animated?: boolean) => engine.select(next, "program", animated),
    [engine],
  );

  const registerValues = useCallback((next: string[] | null) => {
    setRegisteredValues((previous) => (sameValues(previous, next) ? previous : next));
  }, []);

  const setPagerConfig = useCallback((config: MorphTabsPagerConfig) => {
    pagerConfigRef.current = config;
  }, []);

  const localRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootElementRef.current = node;
      progress.attach(node);
      if (node) Object.assign(node, {goTo});
    },
    [goTo, progress],
  );
  const mergedRef = useMergedRef(ref as Ref<HTMLDivElement> | undefined, localRef);

  const getIndex = useCallback((pageValue: string) => values.indexOf(pageValue), [values]);
  const isMounted = useCallback(
    (pageValue: string) => !lazy || pageValue === value || mounted.has(pageValue),
    [lazy, mounted, value],
  );

  const contextValue = useMemo<MorphTabsContextValue>(
    () => ({getIndex, goTo, isMounted, progress, selectedIndex, value, values}),
    [getIndex, goTo, isMounted, progress, selectedIndex, value, values],
  );

  const internalValue = useMemo<MorphTabsInternalContextValue>(
    () => ({
      direction,
      drag: engine.drag,
      getContentId: (pageValue) => `${baseId}-content-${toIdPart(pageValue)}`,
      getTriggerId: (pageValue) => `${baseId}-trigger-${toIdPart(pageValue)}`,
      goToIndex: engine.goToIndex,
      isAnimationDisabled,
      registerValues,
      renderLazyPlaceholder,
      select: engine.select,
      setPagerConfig,
      slots,
      step: engine.step,
    }),
    [
      baseId,
      direction,
      engine,
      isAnimationDisabled,
      registerValues,
      renderLazyPlaceholder,
      setPagerConfig,
      slots,
    ],
  );

  const rootStyle: MorphStyle = {[MORPH_TABS_PROGRESS_VAR]: initialPosition, ...style};

  return (
    <MorphTabsInternalContext value={internalValue}>
      <MorphTabsContext value={contextValue}>
        <div
          {...rest}
          ref={mergedRef}
          className={slots.base({className})}
          data-animation={animation}
          data-slot="morph-tabs"
          style={rootStyle}
        >
          {children}
        </div>
      </MorphTabsContext>
    </MorphTabsInternalContext>
  );
};

MorphTabsRoot.displayName = "HeroUI.MorphTabs";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  MorphTabsRoot,
  MorphTabsList,
  MorphTabsTrigger,
  MorphTabsTriggerBackground,
  MorphTabsIcon,
  MorphTabsLabel,
  MorphTabsPager,
  MorphTabsContent,
};

export type {
  MorphTabsRootProps,
  MorphTabsRootRef,
  MorphTabsListProps,
  MorphTabsTriggerProps,
  MorphTabsTriggerRenderProps,
  MorphTabsTriggerAnimation,
  MorphTabsTriggerBackgroundProps,
  MorphTabsIconProps,
  MorphTabsIconAnimation,
  MorphTabsLabelProps,
  MorphTabsLabelSlots,
  MorphTabsLabelAnimation,
  MorphTabsAnimationTuple,
  MorphTabsPagerProps,
  MorphTabsPagerRef,
  MorphTabsContentProps,
};
