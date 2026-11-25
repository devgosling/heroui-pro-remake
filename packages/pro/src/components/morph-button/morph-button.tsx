"use client";

import type {
  MorphButtonContextValue,
  MorphButtonDirection,
  MorphButtonInternalContextValue,
  MorphButtonVariant,
} from "./morph-button-context";
import type {MorphButtonSpringConfig, MorphSize} from "./morph-button-spring";
import type {MorphButtonContentAnimation} from "./use-morph-button";
import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import {mergeProps} from "react-aria/mergeProps";
import {DismissButton} from "react-aria/Overlay";
import {useKeyboard} from "react-aria/useKeyboard";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {composeRenderProps} from "react-aria-components/composeRenderProps";
import {cx} from "tailwind-variants";

import {useMergedRef, useResolvedClassName} from "../../utils";
import {useHaptics} from "../../utils/use-haptics";

import {
  MorphButtonContext,
  MorphButtonInternalContext,
  useMorphButtonInternal,
} from "./morph-button-context";
import {
  DEFAULT_MORPH_SPRING_CONFIG,
  createMorphSpring,
  prefersReducedMotion,
} from "./morph-button-spring";
import {morphButtonVariants} from "./morph-button.styles";
import {getContentAnimationStyle, useControllableOpen, useElementSize} from "./use-morph-button";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

/**
 * Animation of the root (surface morph):
 * - `false` / `"disabled"`: the surface snaps, the content parts still cross-fade
 * - `"disable-all"`: every transition snaps, including the content parts
 * - `true` / `undefined`: default spring
 * - object: custom spring
 */
type MorphButtonRootAnimation =
  | boolean
  | "disabled"
  | "disable-all"
  | {
      /** Spring used when morphing the surface between the collapsed and expanded sizes. */
      morphSpringConfig?: MorphButtonSpringConfig;
    };

interface MorphButtonRootSlots {
  /** Root container: the collapsed-size footprint you position. */
  container?: string;
  /** The morphing surface. Its size and position are animated and cannot be set via className. */
  surface?: string;
}

interface MorphButtonRootStyles {
  container?: CSSProperties;
  surface?: CSSProperties;
}

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='radio']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='slider']",
  "[role='spinbutton']",
  "[role='textbox']",
  "[data-morph-button-ignore-press]",
].join(",");

const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const sameSize = (a: MorphSize | null, b: MorphSize) =>
  !!a && Math.abs(a.width - b.width) < 0.25 && Math.abs(a.height - b.height) < 0.25;

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface MorphButtonRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Compound children, typically `MorphButton.CollapsedContent` and `MorphButton.ExpandedContent`. */
  children?: ReactNode;
  /**
   * Logical direction the surface grows toward when expanding. The opposite edge / corner stays
   * pinned to the collapsed button.
   * @default "top"
   */
  direction?: MorphButtonDirection;
  /**
   * Surface color scheme: `primary` is a high-contrast inverted surface for floating buttons over
   * app content, `secondary` reads clearly on a surface card.
   * @default "primary"
   */
  variant?: MorphButtonVariant;
  /** Whether the button is expanded (controlled). */
  isOpen?: boolean;
  /**
   * Whether the button is expanded initially (uncontrolled).
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Whether the toggle interaction is disabled.
   * @default false
   */
  isDisabled?: boolean;
  /** Called when the open state changes (or a press requests a toggle in controlled mode). */
  onOpenChange?: (isOpen: boolean) => void;
  /** Animation configuration for the surface morph. */
  animation?: MorphButtonRootAnimation;
  /** Additional CSS classes for individual slots. */
  classNames?: MorphButtonRootSlots;
  /** Inline styles for individual slots. */
  styles?: MorphButtonRootStyles;
  /**
   * Plays a light haptic when a press expands the button. Defaults to the nearest
   * `HapticsProvider` (enabled).
   */
  isHapticFeedbackEnabled?: boolean;
}

const MorphButtonRoot = ({
  animation,
  children,
  className,
  classNames,
  defaultOpen = false,
  direction = "top",
  isDisabled = false,
  isHapticFeedbackEnabled,
  isOpen: isOpenProp,
  onOpenChange,
  ref,
  style,
  styles,
  variant = "primary",
  ...rest
}: MorphButtonRootProps) => {
  const [isOpen, setOpen] = useControllableOpen(isOpenProp, defaultOpen, onOpenChange);
  const {haptic} = useHaptics(isHapticFeedbackEnabled);
  const slots = useMemo(() => morphButtonVariants({direction, variant}), [direction, variant]);

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const panelId = `${baseId}-panel`;

  /* ----- Measurement ---------------------------------------------------------------------------*/
  const [collapsedSize, setCollapsedSizeState] = useState<MorphSize | null>(null);
  const [expandedSize, setExpandedSizeState] = useState<MorphSize | null>(null);

  const setCollapsedSize = useCallback((size: MorphSize) => {
    setCollapsedSizeState((previous) => (sameSize(previous, size) ? previous : size));
  }, []);
  const setExpandedSize = useCallback((size: MorphSize) => {
    setExpandedSizeState((previous) => (sameSize(previous, size) ? previous : size));
  }, []);

  /* ----- Surface spring ------------------------------------------------------------------------*/
  const [spring] = useState(createMorphSpring);
  const {surfaceHeight, surfaceWidth} = spring;

  const isAllAnimationDisabled = animation === "disable-all";
  const isRootAnimated = !(
    animation === false ||
    animation === "disabled" ||
    isAllAnimationDisabled
  );
  const springConfig = typeof animation === "object" ? animation.morphSpringConfig : undefined;
  const damping = springConfig?.damping ?? DEFAULT_MORPH_SPRING_CONFIG.damping;
  const stiffness = springConfig?.stiffness ?? DEFAULT_MORPH_SPRING_CONFIG.stiffness;
  const mass = springConfig?.mass ?? DEFAULT_MORPH_SPRING_CONFIG.mass;
  const overshootClamping =
    springConfig?.overshootClamping ?? DEFAULT_MORPH_SPRING_CONFIG.overshootClamping;
  const restDisplacementThreshold =
    springConfig?.restDisplacementThreshold ??
    DEFAULT_MORPH_SPRING_CONFIG.restDisplacementThreshold;
  const restSpeedThreshold =
    springConfig?.restSpeedThreshold ?? DEFAULT_MORPH_SPRING_CONFIG.restSpeedThreshold;

  useIsomorphicLayoutEffect(() => {
    const target = isOpen ? (expandedSize ?? collapsedSize) : collapsedSize;

    if (!target) return;

    const element = rootRef.current;

    spring.set(
      {collapsed: collapsedSize, expanded: expandedSize, isOpen, target},
      isRootAnimated && !prefersReducedMotion(element),
      {
        damping,
        mass,
        overshootClamping,
        restDisplacementThreshold,
        restSpeedThreshold,
        stiffness,
      },
      element,
    );
  }, [
    collapsedSize,
    damping,
    expandedSize,
    isOpen,
    isRootAnimated,
    mass,
    overshootClamping,
    restDisplacementThreshold,
    restSpeedThreshold,
    spring,
    stiffness,
  ]);

  useEffect(() => () => spring.stop(), [spring]);

  /* ----- Actions -------------------------------------------------------------------------------*/
  const open = useCallback(() => setOpen(true), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  const pressTrigger = useCallback(() => {
    if (isDisabled) return;
    // Called from the press handler, so the haptic still counts as part of the user gesture.
    if (!isOpen) haptic("light");
    setOpen(!isOpen);
  }, [haptic, isDisabled, isOpen, setOpen]);

  const closeByUser = useCallback(() => {
    if (!isDisabled) setOpen(false);
  }, [isDisabled, setOpen]);

  /* ----- Context -------------------------------------------------------------------------------*/
  const contextValue = useMemo<MorphButtonContextValue>(
    () => ({
      close,
      collapsedHeight: collapsedSize?.height ?? 0,
      collapsedWidth: collapsedSize?.width ?? 0,
      direction,
      expandedHeight: expandedSize?.height ?? 0,
      expandedWidth: expandedSize?.width ?? 0,
      isDisabled,
      isOpen,
      open,
      surfaceHeight,
      surfaceWidth,
      toggle,
      variant,
    }),
    [
      close,
      collapsedSize,
      direction,
      expandedSize,
      isDisabled,
      isOpen,
      open,
      surfaceHeight,
      surfaceWidth,
      toggle,
      variant,
    ],
  );

  const internalValue = useMemo<MorphButtonInternalContextValue>(
    () => ({
      close: closeByUser,
      isAllAnimationDisabled,
      isDisabled,
      isOpen,
      panelId,
      pressTrigger,
      setCollapsedSize,
      setExpandedSize,
      slots,
      triggerId,
      triggerRef,
    }),
    [
      closeByUser,
      isAllAnimationDisabled,
      isDisabled,
      isOpen,
      panelId,
      pressTrigger,
      setCollapsedSize,
      setExpandedSize,
      slots,
      triggerId,
    ],
  );

  return (
    <MorphButtonContext value={contextValue}>
      <MorphButtonInternalContext value={internalValue}>
        <div
          {...rest}
          ref={mergedRef}
          className={slots.base({className: cx(classNames?.container, className)})}
          data-direction={direction}
          data-disabled={isDisabled ? "true" : undefined}
          data-open={isOpen ? "true" : "false"}
          data-slot="morph-button"
          data-variant={variant}
          style={styles?.container || style ? {...styles?.container, ...style} : undefined}
        >
          <span
            aria-hidden="true"
            className={slots.surface({className: classNames?.surface})}
            data-slot="morph-button-surface"
            style={styles?.surface}
          />
          {children}
        </div>
      </MorphButtonInternalContext>
    </MorphButtonContext>
  );
};

MorphButtonRoot.displayName = "HeroUI.MorphButton";

/* -------------------------------------------------------------------------------------------------
 * Collapsed content (the in-flow trigger)
 * -----------------------------------------------------------------------------------------------*/
interface MorphButtonCollapsedContentProps extends Omit<
  ComponentPropsWithRef<typeof ButtonPrimitive>,
  "slot" | "isDisabled"
> {
  /** Animation of the cross-fade and scale (`[closed, open]` = `[1, 0]` / `[1, 0.96]`, 200ms). */
  animation?: MorphButtonContentAnimation;
  /**
   * When false, the animated opacity / scale styles are not applied.
   * @default true
   */
  isAnimatedStyleActive?: boolean;
}

const MorphButtonCollapsedContent = ({
  animation,
  className,
  isAnimatedStyleActive = true,
  onPress,
  ref,
  style,
  ...rest
}: MorphButtonCollapsedContentProps) => {
  const {
    isAllAnimationDisabled,
    isDisabled,
    isOpen,
    panelId,
    pressTrigger,
    setCollapsedSize,
    slots,
    triggerId,
    triggerRef,
  } = useMorphButtonInternal("CollapsedContent");
  const mergedRef = useMergedRef(ref, triggerRef);
  const resolvedClassName = useResolvedClassName(className, slots.collapsedContent());

  useElementSize(triggerRef, setCollapsedSize);

  const animatedStyle = getContentAnimationStyle({
    animation,
    hideWhenClosed: false,
    isActive: isAnimatedStyleActive,
    isAllAnimationDisabled,
    isOpen,
    kind: "collapsed",
  });
  const resolvedStyle = animatedStyle
    ? composeRenderProps(style, (userStyle) => ({...userStyle, ...animatedStyle}))
    : style;

  return (
    <ButtonPrimitive
      {...rest}
      ref={mergedRef}
      aria-controls={panelId}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className={resolvedClassName}
      data-open={isOpen ? "true" : "false"}
      data-slot="morph-button-collapsed-content"
      id={triggerId}
      // While expanded the collapsed content is faded out: keep it out of focus and hit testing.
      inert={isOpen}
      isDisabled={isDisabled}
      style={resolvedStyle}
      onPress={(event) => {
        onPress?.(event);
        pressTrigger();
      }}
    />
  );
};

MorphButtonCollapsedContent.displayName = "HeroUI.MorphButton.CollapsedContent";

/* -------------------------------------------------------------------------------------------------
 * Expanded content (non-modal dialog panel)
 * -----------------------------------------------------------------------------------------------*/
interface MorphButtonExpandedContentProps extends ComponentPropsWithRef<"div"> {
  /** Animation of the cross-fade and scale (`[closed, open]` = `[0, 1]` / `[0.97, 1]`, 200ms). */
  animation?: MorphButtonContentAnimation;
  /**
   * When false, the animated opacity / scale / visibility styles are not applied.
   * @default true
   */
  isAnimatedStyleActive?: boolean;
}

const MorphButtonExpandedContent = ({
  animation,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  isAnimatedStyleActive = true,
  ref,
  style,
  ...rest
}: MorphButtonExpandedContentProps) => {
  const {
    close,
    isAllAnimationDisabled,
    isDisabled,
    isOpen,
    panelId,
    setExpandedSize,
    slots,
    triggerId,
    triggerRef,
  } = useMorphButtonInternal("ExpandedContent");
  const viewportRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, panelRef);

  useElementSize(panelRef, setExpandedSize);

  /* ----- Escape closes (keyboard alternative to tapping the surface) ---------------------------*/
  const {keyboardProps} = useKeyboard({
    onKeyDown: (event) => {
      if (event.key === "Escape" && isOpen && !isDisabled) {
        event.preventDefault();
        close();

        return;
      }
      event.continuePropagation();
    },
  });

  /* ----- Tapping the surface (outside interactive children) toggles, as on Native ------------*/
  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || !isOpen || isDisabled) return;

    // Only presses that also started on the open panel count. This ignores the click that
    // finishes the opening tap on touch devices, which can be retargeted to the panel.
    let pressStartedInside = false;

    const onPointerDown = (event: PointerEvent) => {
      pressStartedInside = event.isPrimary && event.button === 0;
    };
    const onClick = (event: MouseEvent) => {
      const startedInside = pressStartedInside;

      pressStartedInside = false;
      if (!startedInside || event.defaultPrevented) return;

      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest(INTERACTIVE_SELECTOR);

      if (interactive && viewport.contains(interactive)) return;
      // Selecting text inside the panel is not a tap.
      if (window.getSelection?.()?.toString()) return;

      close();
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("click", onClick);

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("click", onClick);
    };
  }, [close, isDisabled, isOpen]);

  /* ----- Focus: move into the panel on open, back to the trigger on close ---------------------*/
  const wasOpenRef = useRef(isOpen);

  useIsomorphicLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;

    wasOpenRef.current = isOpen;
    if (wasOpen === isOpen) return;

    const panel = panelRef.current;

    if (!panel) return;

    if (isOpen) {
      const first = Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).find(
        (element) => !element.closest("[inert]") && element.getClientRects().length > 0,
      );

      (first ?? panel).focus({preventScroll: true});

      return;
    }

    const active = document.activeElement;

    if (active && active !== document.body && panel.contains(active)) {
      triggerRef.current?.focus({preventScroll: true});
    }
  }, [isOpen, triggerRef]);

  const animatedStyle = getContentAnimationStyle({
    animation,
    hideWhenClosed: true,
    isActive: isAnimatedStyleActive,
    isAllAnimationDisabled,
    isOpen,
    kind: "expanded",
  });

  return (
    <div
      ref={viewportRef}
      className={slots.expanded()}
      data-open={isOpen ? "true" : "false"}
      data-slot="morph-button-expanded"
    >
      <div
        {...mergeProps(rest, keyboardProps)}
        ref={mergedRef}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : triggerId)}
        className={slots.expandedContent({className})}
        data-open={isOpen ? "true" : "false"}
        data-slot="morph-button-expanded-content"
        id={panelId}
        inert={!isOpen}
        role="dialog"
        style={animatedStyle ? {...style, ...animatedStyle} : style}
        tabIndex={-1}
      >
        {children}
        {isOpen && !isDisabled ? <DismissButton onDismiss={close} /> : null}
      </div>
    </div>
  );
};

MorphButtonExpandedContent.displayName = "HeroUI.MorphButton.ExpandedContent";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MorphButtonRoot, MorphButtonCollapsedContent, MorphButtonExpandedContent};

export type {
  MorphButtonRootProps,
  MorphButtonCollapsedContentProps,
  MorphButtonExpandedContentProps,
  MorphButtonRootAnimation,
  MorphButtonRootSlots,
  MorphButtonRootStyles,
};
