"use client";

import type {FABLayoutState} from "./fab-context";
import type {
  FABAutoAlign,
  FABAutoPlacement,
  FABInsets,
  FABItemsAppearance,
  FABProgressAnimation,
} from "./fab-utils";
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
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {useLocale} from "react-aria/I18nProvider";
import {mergeProps} from "react-aria/mergeProps";
import {DismissButton, Overlay as OverlayPrimitive} from "react-aria/Overlay";
import {ariaHideOutside} from "react-aria/private/overlays/ariaHideOutside";
import {useButton} from "react-aria/useButton";
import {useFocusRing} from "react-aria/useFocusRing";
import {useHover} from "react-aria/useHover";
import {useOverlay} from "react-aria/useOverlay";
import {usePress} from "react-aria/usePress";
import {usePreventScroll} from "react-aria/usePreventScroll";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {useMergedRef, useResolvedClassName} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {
  FABContext,
  FABItemIndexContext,
  FABPortalContext,
  isSameLayout,
  useFABContext,
  useFABLayout,
} from "./fab-context";
import {
  animateProgress,
  computeContentPosition,
  createValueStore,
  getItemStagger,
  getViewportRectangle,
  isLastItemNearest,
  prefersReducedMotion,
  resolveAlign,
  resolvePlacement,
  toLayoutRectangle,
} from "./fab-utils";
import {fabVariants} from "./fab.styles";

/* -------------------------------------------------------------------------------------------------
 * Shared types
 * -----------------------------------------------------------------------------------------------*/
type CSSVariables = CSSProperties & Record<`--${string}`, string | number>;

/** `false` / `"disabled"` turn a part's progress-driven styles off. */
type DisabledAnimation = boolean | "disabled";

const isAnimationOff = (animation: unknown) => animation === false || animation === "disabled";

const ITEM_SELECTOR = '[data-slot="fab-item"]:not([disabled])';

const scheduleFrame = (callback: () => void): (() => void) => {
  if (typeof requestAnimationFrame === "undefined") {
    callback();

    return () => {};
  }

  const frame = requestAnimationFrame(callback);

  return () => cancelAnimationFrame(frame);
};

/* -------------------------------------------------------------------------------------------------
 * FAB Root
 * -----------------------------------------------------------------------------------------------*/
export type FABRootAnimation =
  | DisabledAnimation
  | "disable-all"
  | {
      /**
       * Driver of the open/close progress.
       * @default spring {mass: 3, stiffness: 1200, damping: 135} (measured from the Native demo;
       * the Native docs list damping 90)
       */
      progress?: FABProgressAnimation;
      /** Item stagger (staggered appearance only). */
      stagger?: {
        /**
         * Fraction of the progress range each item's animation occupies, clamped to (0, 1].
         * @default 0.5
         */
        itemWindow?: number;
      };
    };

interface FABRootProps extends ComponentPropsWithRef<"div"> {
  /** Side of the trigger on which the content opens. @default "auto" */
  placement?: FABAutoPlacement;
  /** Alignment along the perpendicular axis. @default "auto" */
  align?: FABAutoAlign;
  /** Appearing mode for the items. @default "staggered" */
  itemsAppearance?: FABItemsAppearance;
  /** Whether the FAB is open (controlled). */
  isOpen?: boolean;
  /** Default open state (uncontrolled). */
  isDefaultOpen?: boolean;
  /** Whether the FAB is disabled. */
  isDisabled?: boolean;
  /** Called when the open state changes. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Progress driver, stagger and disable-all cascade. */
  animation?: FABRootAnimation;
  /**
   * Haptic feedback when the FAB opens via a press. Defaults to the nearest `HapticsProvider`
   * (enabled when there is none).
   */
  isHapticFeedbackEnabled?: boolean;
}

const FABRoot = ({
  align = "auto",
  animation,
  children,
  className,
  isDefaultOpen,
  isDisabled = false,
  isHapticFeedbackEnabled,
  isOpen: isOpenProp,
  itemsAppearance = "staggered",
  onOpenChange,
  placement = "auto",
  ref,
  ...rest
}: FABRootProps) => {
  const slots = useMemo(() => fabVariants(), []);
  const id = useId();
  const {direction} = useLocale();
  const isRTL = direction === "rtl";
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(isDefaultOpen ?? false);
  const isOpen = isOpenProp ?? uncontrolledOpen;

  const [progressStore] = useState(() => createValueStore(isOpen ? 1 : 0));
  const [portalContainerStore] = useState(() => createValueStore<Element | null>(null));
  const [layoutStore] = useState(() =>
    createValueStore<FABLayoutState>(
      {
        align: align === "auto" ? "end" : align,
        contentLayout: null,
        placement: placement === "auto" ? "top" : placement,
        triggerPosition: null,
      },
      isSameLayout,
    ),
  );

  // The portal stays mounted while the close animation plays.
  const [previousOpen, setPreviousOpen] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  if (previousOpen !== isOpen) {
    setPreviousOpen(isOpen);
    setIsExiting(!isOpen);
  }

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === isOpen || (next && isDisabled)) return;
      if (isOpenProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isDisabled, isOpen, isOpenProp, onOpenChange],
  );

  const isAllAnimationsDisabled = animation === "disable-all";
  const isProgressAnimationOff = isAllAnimationsDisabled || isAnimationOff(animation);
  const progressAnimation = typeof animation === "object" ? animation.progress : undefined;
  const itemWindow = (typeof animation === "object" && animation.stagger?.itemWindow) || 0.5;

  /* ---------------------------------------------------------------- progress driver */
  const runProgress = useEffectEvent((open: boolean): (() => void) | undefined => {
    const current = progressStore.get();
    const finishClose = () => {
      progressStore.set(0);
      setIsExiting(false);
    };

    if (!open && (current <= 0 || current >= 2)) return scheduleFrame(finishClose);

    // Re-opening mid-close (or closing mid-open) continues from the mirrored position.
    const from = open ? (current > 1 ? 2 - current : current) : current < 1 ? 2 - current : current;
    const to = open ? 1 : 2;

    if (from === to) return open ? undefined : scheduleFrame(finishClose);

    if (isProgressAnimationOff || prefersReducedMotion(rootRef.current)) {
      progressStore.set(to);

      return open ? undefined : scheduleFrame(finishClose);
    }

    return animateProgress(
      from,
      to,
      progressAnimation,
      // Clamp per phase so a spring overshoot never bleeds into the other phase.
      (value) => progressStore.set(Math.min(Math.max(value, open ? 0 : 1), open ? 1 : 2)),
      open ? undefined : finishClose,
    );
  });

  // Layout effect: the first frame of an open already paints the portal at progress 0.
  useLayoutEffect(() => runProgress(isOpen), [isOpen]);

  // Expose the progress as a CSS custom property (drives the trigger rotation).
  useIsomorphicLayoutEffect(() => {
    const element = rootRef.current;

    if (!element) return;

    const write = () => element.style.setProperty("--fab-progress", String(progressStore.get()));

    write();

    return progressStore.subscribe(write);
  }, [progressStore]);

  /* ---------------------------------------------------------------- trigger measurement */
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const trigger = triggerRef.current;

      if (!trigger) return;

      const container = portalContainerStore.get();
      const bounds = container
        ? toLayoutRectangle(container.getBoundingClientRect())
        : getViewportRectangle();
      const triggerPosition = toLayoutRectangle(trigger.getBoundingClientRect());
      const resolvedPlacement = resolvePlacement(placement, triggerPosition, bounds);

      layoutStore.set({
        ...layoutStore.get(),
        align: resolveAlign(align, resolvedPlacement, triggerPosition, bounds, isRTL),
        placement: resolvedPlacement,
        triggerPosition,
      });
    };

    measure();
    window.addEventListener("resize", measure);

    const unsubscribe = portalContainerStore.subscribe(measure);

    return () => {
      unsubscribe();
      window.removeEventListener("resize", measure);
    };
  }, [align, isRTL, layoutStore, placement, portalContainerStore]);

  const layout = useSyncExternalStore(layoutStore.subscribe, layoutStore.get, layoutStore.get);

  const contextValue = useMemo(
    () => ({
      align,
      contentId: `${id}-content`,
      id,
      isAllAnimationsDisabled,
      isDisabled,
      isExiting,
      isHapticFeedbackEnabled,
      isOpen,
      isRTL,
      itemWindow,
      itemsAppearance,
      layoutStore,
      onOpenChange: setOpen,
      placement,
      portalContainerStore,
      progressStore,
      slots,
      triggerId: `${id}-trigger`,
      triggerRef,
    }),
    [
      align,
      id,
      isAllAnimationsDisabled,
      isDisabled,
      isExiting,
      isHapticFeedbackEnabled,
      isOpen,
      isRTL,
      itemWindow,
      itemsAppearance,
      layoutStore,
      placement,
      portalContainerStore,
      progressStore,
      setOpen,
      slots,
    ],
  );

  return (
    <FABContext value={contextValue}>
      <div
        ref={mergedRef}
        className={slots.base({className})}
        data-align={layout.align}
        data-disabled={isDisabled ? "true" : undefined}
        data-open={isOpen ? "true" : undefined}
        data-placement={layout.placement}
        data-slot="fab"
        {...rest}
      >
        {children}
      </div>
    </FABContext>
  );
};

FABRoot.displayName = "HeroUI.FAB";

/* -------------------------------------------------------------------------------------------------
 * FAB Trigger
 * -----------------------------------------------------------------------------------------------*/
export type FABTriggerAnimation =
  | DisabledAnimation
  | {
      /** Rotation (degrees) of the trigger content for [idle, open, close]. @default [0, 45, 0] */
      rotate?: {value?: [number, number, number]};
    };

type FABTriggerSlots = "container" | "contentContainer";

/** The trigger element, extended with imperative `open()` / `close()` (Native `FABTriggerRef`). */
export type FABTriggerRef = HTMLButtonElement & {open: () => void; close: () => void};

interface FABTriggerProps extends Omit<
  ComponentPropsWithRef<typeof ButtonPrimitive>,
  "children" | "className" | "style" | "ref"
> {
  /** Trigger content (typically an icon). Rotates with the shared progress. */
  children?: ReactNode;
  className?: string;
  /** Additional classes for the trigger slots. */
  classNames?: Partial<Record<FABTriggerSlots, string>>;
  style?: CSSProperties;
  /** Additional styles for the trigger slots. */
  styles?: Partial<Record<FABTriggerSlots, CSSProperties>>;
  /** Content rotation. */
  animation?: FABTriggerAnimation;
  /** Whether the progress-driven rotation is applied. @default true */
  isAnimatedStyleActive?: boolean;
  ref?: Ref<FABTriggerRef>;
}

const FABTrigger = ({
  animation,
  "aria-label": ariaLabel,
  children,
  className,
  classNames,
  isAnimatedStyleActive = true,
  isDisabled,
  onPress,
  ref,
  style,
  styles,
  ...rest
}: FABTriggerProps) => {
  const context = useFABContext("FAB.Trigger");
  const {isOpen, onOpenChange, slots} = context;
  const {haptic} = useHaptics(context.isHapticFeedbackEnabled);
  const localRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergedRef<HTMLButtonElement>(localRef, context.triggerRef);

  useImperativeHandle(ref, () => {
    const element = localRef.current as FABTriggerRef;

    element.open = () => onOpenChange(true);
    element.close = () => onOpenChange(false);

    return element;
  }, [onOpenChange]);

  const handlePress = (event: PressEvent) => {
    onPress?.(event);
    if (!isOpen) haptic("light");
    onOpenChange(!isOpen);
  };

  const isStatic =
    !isAnimatedStyleActive || isAnimationOff(animation) || context.isAllAnimationsDisabled;
  const rotate = typeof animation === "object" ? animation.rotate?.value : undefined;

  const resolvedStyle = useMemo<CSSVariables | undefined>(() => {
    const merged: CSSVariables = {...style, ...styles?.container};

    if (rotate) {
      merged["--fab-trigger-rotate-idle"] = rotate[0];
      merged["--fab-trigger-rotate-open"] = rotate[1];
      merged["--fab-trigger-rotate-close"] = rotate[2];
    }

    return Object.keys(merged).length ? merged : undefined;
  }, [rotate, style, styles?.container]);

  const resolvedClassName = useResolvedClassName(
    classNames?.container ? `${classNames.container} ${className ?? ""}`.trim() : className,
    slots.trigger(),
  );

  return (
    <ButtonPrimitive
      {...rest}
      ref={mergedRef}
      aria-controls={isOpen ? context.contentId : undefined}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-label={ariaLabel ?? (rest["aria-labelledby"] ? undefined : "Actions")}
      className={resolvedClassName}
      data-open={isOpen ? "true" : undefined}
      data-slot="fab-trigger"
      id={rest.id ?? context.triggerId}
      isDisabled={isDisabled || context.isDisabled}
      style={resolvedStyle}
      onPress={handlePress}
    >
      <span
        className={slots.triggerContent({className: classNames?.contentContainer})}
        data-animated={isStatic ? "false" : undefined}
        data-slot="fab-trigger-content"
        style={styles?.contentContainer}
      >
        {children}
      </span>
    </ButtonPrimitive>
  );
};

FABTrigger.displayName = "HeroUI.FAB.Trigger";

/* -------------------------------------------------------------------------------------------------
 * FAB Portal
 * -----------------------------------------------------------------------------------------------*/
interface FABPortalProps extends ComponentPropsWithRef<"div"> {
  /**
   * Element to render the layer into (Native `hostName`). The layer covers this element
   * (`absolute inset-0`, so give it `position: relative`) and auto placement resolves against it.
   * @default document.body (the layer is fixed to the viewport)
   */
  container?: Element | null;
  /** Keep the layer mounted while the FAB is closed. */
  forceMount?: true;
}

const FABPortal = ({children, className, container, forceMount, ref, ...rest}: FABPortalProps) => {
  const context = useFABContext("FAB.Portal");
  const {isExiting, isOpen, portalContainerStore, progressStore, slots, triggerRef} = context;
  const layerRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, layerRef);
  const isMounted = isOpen || isExiting || !!forceMount;
  const isIdle = !isOpen && !isExiting;

  useIsomorphicLayoutEffect(() => {
    portalContainerStore.set(container ?? null);
  }, [container, portalContainerStore]);

  // The layer is outside the root's DOM, so it gets its own copy of the progress variable.
  useIsomorphicLayoutEffect(() => {
    const element = layerRef.current;

    if (!isMounted || !element) return;

    const write = () => element.style.setProperty("--fab-progress", String(progressStore.get()));

    write();

    return progressStore.subscribe(write);
  }, [isMounted, progressStore]);

  // Closing while focus is inside (Escape, item press): hand focus back to the trigger right away.
  useEffect(() => {
    if (isOpen) return;

    const layer = layerRef.current;

    if (layer && document.activeElement && layer.contains(document.activeElement)) {
      triggerRef.current?.focus({preventScroll: true});
    }
  }, [isOpen, triggerRef]);

  const portalContextValue = useMemo(() => ({layerRef}), []);

  if (!isMounted) return null;

  return (
    <OverlayPrimitive
      isExiting={!isOpen}
      portalContainer={container ?? undefined}
      shouldContainFocus={isOpen}
    >
      <div
        ref={mergedRef}
        className={slots.portal({className})}
        data-contained={container ? "true" : undefined}
        data-exiting={isExiting ? "true" : undefined}
        data-open={isOpen ? "true" : undefined}
        data-slot="fab-portal"
        inert={isIdle || undefined}
        {...rest}
      >
        <FABPortalContext value={portalContextValue}>{children}</FABPortalContext>
      </div>
    </OverlayPrimitive>
  );
};

FABPortal.displayName = "HeroUI.FAB.Portal";

/* -------------------------------------------------------------------------------------------------
 * FAB Overlay
 * -----------------------------------------------------------------------------------------------*/
export type FABOverlayAnimation =
  | DisabledAnimation
  | {
      /** Overlay opacity for [idle, open, close]. @default [0, 1, 0] */
      opacity?: {value?: [number, number, number]};
    };

export interface FABOverlayBlurViewProps {
  /** Maximum blur intensity (0-100), reached when the FAB is open. @default 50 */
  intensity?: number;
  /** Tint mixed into the blurred backdrop. @default "default" (theme background) */
  tint?: "default" | "light" | "dark" | "none";
}

interface FABOverlayProps
  extends Omit<ComponentPropsWithRef<"div">, "children" | "onClick">, PressEvents {
  /** Whether pressing the overlay closes the FAB. @default true */
  closeOnPress?: boolean;
  /** `"blur"` renders an animated backdrop blur instead of the dimming layer. @default "default" */
  variant?: "default" | "blur";
  /** Blur options for the `"blur"` variant. */
  blurViewProps?: FABOverlayBlurViewProps;
  /** Overlay opacity animation. */
  animation?: FABOverlayAnimation;
  /**
   * Whether the progress-driven opacity is applied.
   * @default true for "default", false for "blur" (the blur animates its intensity instead)
   */
  isAnimatedStyleActive?: boolean;
}

const FABOverlay = ({
  animation,
  blurViewProps,
  className,
  closeOnPress = true,
  isAnimatedStyleActive,
  onPress,
  onPressChange,
  onPressEnd,
  onPressStart,
  onPressUp,
  ref,
  style,
  variant = "default",
  ...rest
}: FABOverlayProps) => {
  const context = useFABContext("FAB.Overlay");
  const {isOpen, onOpenChange} = context;
  const isBlur = variant === "blur";
  const isStatic =
    !(isAnimatedStyleActive ?? !isBlur) ||
    isAnimationOff(animation) ||
    context.isAllAnimationsDisabled;
  const opacity = typeof animation === "object" ? animation.opacity?.value : undefined;
  const intensity = blurViewProps?.intensity;

  usePreventScroll({isDisabled: !isOpen});

  const {pressProps} = usePress({
    isDisabled: !isOpen,
    onPress: (event) => {
      onPress?.(event);
      if (closeOnPress) onOpenChange(false);
    },
    onPressChange,
    onPressEnd,
    onPressStart,
    onPressUp,
  });

  const resolvedStyle = useMemo<CSSVariables | undefined>(() => {
    const merged: CSSVariables = {...style};

    if (opacity) {
      merged["--fab-overlay-opacity-idle"] = opacity[0];
      merged["--fab-overlay-opacity-open"] = opacity[1];
      merged["--fab-overlay-opacity-close"] = opacity[2];
    }
    if (intensity !== undefined) merged["--fab-overlay-blur-intensity"] = intensity;

    return Object.keys(merged).length ? merged : undefined;
  }, [intensity, opacity, style]);

  return (
    <div
      {...mergeProps(rest, pressProps)}
      ref={ref}
      aria-hidden="true"
      className={context.slots.overlay({className, overlayVariant: variant})}
      data-animated={isStatic ? "false" : undefined}
      data-slot="fab-overlay"
      data-tint={isBlur ? (blurViewProps?.tint ?? "default") : undefined}
      data-variant={variant}
      style={resolvedStyle}
    />
  );
};

FABOverlay.displayName = "HeroUI.FAB.Overlay";

/* -------------------------------------------------------------------------------------------------
 * FAB Content
 * -----------------------------------------------------------------------------------------------*/
interface FABContentProps extends ComponentPropsWithRef<"div"> {
  /** Gap between the trigger and the content in px. @default 12 */
  offset?: number;
  /** Offset along the alignment axis in px (towards the inside for start / end). @default 0 */
  alignOffset?: number;
  /** Edge insets of the portal layer respected when positioning. @default 12 on every side */
  insets?: FABInsets;
  /** Shift the content to stay inside the insets. @default true */
  avoidCollisions?: boolean;
  /** Skip writing the computed `left` / `top` (position the content yourself). @default false */
  disablePositioningStyle?: boolean;
}

const FABContent = ({
  alignOffset = 0,
  avoidCollisions = true,
  children,
  className,
  disablePositioningStyle = false,
  insets,
  offset = 12,
  ref,
  ...rest
}: FABContentProps) => {
  const context = useFABContext("FAB.Content");
  const portal = use(FABPortalContext);

  if (!portal) throw new Error("<FAB.Content> must be used within <FAB.Portal>.");

  const {isOpen, isRTL, layoutStore, onOpenChange, slots, triggerRef} = context;
  const {layerRef} = portal;
  const contentRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, contentRef);
  const layout = useFABLayout(context);
  const insetTop = insets?.top ?? 12;
  const insetRight = insets?.right ?? 12;
  const insetBottom = insets?.bottom ?? 12;
  const insetLeft = insets?.left ?? 12;
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Escape closes the FAB (only the top-most overlay reacts).
  const {overlayProps} = useOverlay(
    {isDismissable: false, isKeyboardDismissDisabled: false, isOpen, onClose: close},
    contentRef,
  );

  /* ---------------------------------------------------------------- positioning */
  useIsomorphicLayoutEffect(() => {
    const update = () => {
      const content = contentRef.current;
      const layer = layerRef.current;
      const trigger = triggerRef.current;

      if (!content || !layer || !trigger) return;

      const bounds = toLayoutRectangle(layer.getBoundingClientRect());
      const triggerPosition = toLayoutRectangle(trigger.getBoundingClientRect());
      const placement = resolvePlacement(context.placement, triggerPosition, bounds);
      const align = resolveAlign(context.align, placement, triggerPosition, bounds, isRTL);
      const size = {height: content.offsetHeight, width: content.offsetWidth};
      const {left, top} = computeContentPosition({
        align,
        alignOffset,
        avoidCollisions,
        bounds,
        insets: {bottom: insetBottom, left: insetLeft, right: insetRight, top: insetTop},
        isRTL,
        offset,
        placement,
        size,
        trigger: triggerPosition,
      });

      if (!disablePositioningStyle) {
        content.style.left = `${left}px`;
        content.style.top = `${top}px`;
      }

      layoutStore.set({
        align,
        contentLayout: {height: size.height, width: size.width, x: left, y: top},
        placement,
        triggerPosition,
      });
    };

    update();

    if (!isOpen) return;

    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => update());

    if (contentRef.current) observer?.observe(contentRef.current);
    if (triggerRef.current) observer?.observe(triggerRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, {capture: true, passive: true});

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, {capture: true});
    };
  }, [
    alignOffset,
    avoidCollisions,
    context.align,
    context.placement,
    disablePositioningStyle,
    insetBottom,
    insetLeft,
    insetRight,
    insetTop,
    isOpen,
    isRTL,
    layerRef,
    layoutStore,
    offset,
    triggerRef,
  ]);

  /* ---------------------------------------------------------------- a11y while open */
  useEffect(() => {
    if (!isOpen) return;

    // Move focus into the menu so Escape and the arrow keys work right away.
    contentRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus({preventScroll: true});

    const targets = [layerRef.current, triggerRef.current].filter(
      (element): element is HTMLDivElement | HTMLButtonElement => !!element,
    );

    return targets.length ? ariaHideOutside(targets) : undefined;
  }, [isOpen, layerRef, triggerRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

    if (!items.length) return;

    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;

    if (event.key === "ArrowDown") next = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp") next = items[(index - 1 + items.length) % items.length];
    else if (event.key === "Home") next = items[0];
    else if (event.key === "End") next = items[items.length - 1];
    else return;

    event.preventDefault();
    next?.focus();
  };

  const elements = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const count = elements.length;

  return (
    <>
      <DismissButton onDismiss={close} />
      <div
        {...mergeProps(rest, overlayProps, {onKeyDown: handleKeyDown})}
        ref={mergedRef}
        aria-labelledby={rest["aria-label"] ? undefined : context.triggerId}
        aria-orientation="vertical"
        className={slots.content({className})}
        data-align={layout.align}
        data-placement={layout.placement}
        data-slot="fab-content"
        id={context.contentId}
        role="menu"
      >
        {elements.map((child, index) => (
          <FABItemIndexContext key={child.key ?? index} value={{count, index}}>
            {child}
          </FABItemIndexContext>
        ))}
      </div>
      <DismissButton onDismiss={close} />
    </>
  );
};

FABContent.displayName = "HeroUI.FAB.Content";

/* -------------------------------------------------------------------------------------------------
 * FAB Item
 * -----------------------------------------------------------------------------------------------*/
export type FABItemAnimation =
  | DisabledAnimation
  | {
      /** Distance in px the item travels from the trigger direction. @default 16 */
      translate?: {value?: number};
      /** Scale for the [hidden, visible] states. @default [0.9, 1] */
      scale?: {value?: [number, number]};
    };

interface FABItemProps
  extends Omit<ComponentPropsWithRef<"button">, "children" | "disabled" | "onClick">, PressEvents {
  /** Item content. Strings and numbers are wrapped in `FAB.ItemLabel` automatically. */
  children?: ReactNode;
  /** Whether pressing the item closes the FAB. @default true */
  closeOnPress?: boolean;
  /** Whether the item is disabled. */
  isDisabled?: boolean;
  /**
   * Background layer behind the content. `undefined` renders the theme default (none in the
   * default theme), a node replaces it, `null` removes it.
   */
  background?: ReactNode;
  /** Appearing motion. */
  animation?: FABItemAnimation;
  /** Whether the progress-driven styles are applied. @default true */
  isAnimatedStyleActive?: boolean;
}

const FABItem = ({
  animation,
  background,
  children,
  className,
  closeOnPress = true,
  isAnimatedStyleActive = true,
  isDisabled,
  onPress,
  onPressChange,
  onPressEnd,
  onPressStart,
  onPressUp,
  ref,
  style,
  ...rest
}: FABItemProps) => {
  const context = useFABContext("FAB.Item");
  const {count, index} = use(FABItemIndexContext);
  const layout = useFABLayout(context);
  const localRef = useRef<HTMLButtonElement>(null);
  const mergedRef = useMergedRef(ref, localRef);
  const {onOpenChange, slots} = context;

  const {buttonProps, isPressed} = useButton(
    {
      elementType: "button",
      isDisabled,
      onPress: (event) => {
        onPress?.(event);
        if (closeOnPress) onOpenChange(false);
      },
      onPressChange,
      onPressEnd,
      onPressStart,
      onPressUp,
    },
    localRef,
  );
  const {hoverProps, isHovered} = useHover({isDisabled});
  const {focusProps, isFocusVisible} = useFocusRing();

  const isStatic =
    !isAnimatedStyleActive || isAnimationOff(animation) || context.isAllAnimationsDisabled;
  const translate = typeof animation === "object" ? animation.translate?.value : undefined;
  const scale = typeof animation === "object" ? animation.scale?.value : undefined;
  const stagger = getItemStagger({
    appearance: context.itemsAppearance,
    count,
    index,
    itemWindow: context.itemWindow,
    lastIsNearest: isLastItemNearest(layout.placement, layout.align),
  });

  const resolvedStyle: CSSVariables = {
    "--fab-item-close-start": stagger.closeStart,
    "--fab-item-open-start": stagger.openStart,
    "--fab-item-window": stagger.window,
    ...(translate === undefined ? null : {"--fab-item-translate": translate}),
    ...(scale ? {"--fab-item-scale-from": scale[0], "--fab-item-scale-to": scale[1]} : null),
    ...style,
  };

  const content = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <FABItemLabel>{child}</FABItemLabel>
    ) : (
      child
    ),
  );

  return (
    <button
      {...mergeProps(rest, buttonProps, hoverProps, focusProps)}
      ref={mergedRef}
      className={slots.item({className})}
      data-animated={isStatic ? "false" : undefined}
      data-disabled={isDisabled ? "true" : undefined}
      data-focus-visible={isFocusVisible ? "true" : undefined}
      data-hovered={isHovered ? "true" : undefined}
      data-pressed={isPressed ? "true" : undefined}
      data-slot="fab-item"
      role="menuitem"
      style={resolvedStyle}
    >
      {background}
      {content}
    </button>
  );
};

FABItem.displayName = "HeroUI.FAB.Item";

/* -------------------------------------------------------------------------------------------------
 * FAB ItemBackground
 * -----------------------------------------------------------------------------------------------*/
interface FABItemBackgroundProps extends ComponentPropsWithRef<"div"> {}

const fallbackSlots = fabVariants();

const FABItemBackground = ({className, ...rest}: FABItemBackgroundProps) => {
  const slots = use(FABContext)?.slots ?? fallbackSlots;

  return (
    <div
      aria-hidden="true"
      className={slots.itemBackground({className})}
      data-slot="fab-item-background"
      {...rest}
    />
  );
};

FABItemBackground.displayName = "HeroUI.FAB.ItemBackground";

/* -------------------------------------------------------------------------------------------------
 * FAB ItemLabel
 * -----------------------------------------------------------------------------------------------*/
interface FABItemLabelProps extends ComponentPropsWithRef<"span"> {}

const FABItemLabel = ({className, ...rest}: FABItemLabelProps) => {
  const slots = use(FABContext)?.slots ?? fallbackSlots;

  return <span className={slots.itemLabel({className})} data-slot="fab-item-label" {...rest} />;
};

FABItemLabel.displayName = "HeroUI.FAB.ItemLabel";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  FABRoot,
  FABTrigger,
  FABPortal,
  FABOverlay,
  FABContent,
  FABItem,
  FABItemBackground,
  FABItemLabel,
};

export type {
  FABRootProps,
  FABTriggerProps,
  FABPortalProps,
  FABOverlayProps,
  FABContentProps,
  FABItemProps,
  FABItemBackgroundProps,
  FABItemLabelProps,
};
