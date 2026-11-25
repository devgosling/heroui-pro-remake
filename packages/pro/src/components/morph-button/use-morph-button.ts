"use client";

import type {MorphSize} from "./morph-button-spring";
import type {CSSProperties, RefObject} from "react";

import {useIsomorphicLayoutEffect} from "@heroui/react";
import {useCallback, useState} from "react";

/* -------------------------------------------------------------------------------------------------
 * Controlled / uncontrolled open state
 * -----------------------------------------------------------------------------------------------*/
export const useControllableOpen = (
  isOpenProp: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((isOpen: boolean) => void) | undefined,
) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === isOpen) return;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, isOpen, onOpenChange],
  );

  return [isOpen, setOpen] as const;
};

/* -------------------------------------------------------------------------------------------------
 * Natural size measurement (border box, unaffected by the scale animation)
 * -----------------------------------------------------------------------------------------------*/
const readSize = (element: HTMLElement): MorphSize => {
  // Computed width/height are layout sizes (transforms such as the content scale do not apply) and
  // keep sub-pixel precision. Preflight uses border-box sizing, so they equal the border box.
  const style = window.getComputedStyle(element);
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);

  return {
    height: Number.isFinite(height) ? height : element.offsetHeight,
    width: Number.isFinite(width) ? width : element.offsetWidth,
  };
};

export const useElementSize = (
  ref: RefObject<HTMLElement | null>,
  onSize: (size: MorphSize) => void,
) => {
  useIsomorphicLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    onSize(readSize(element));

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize?.[0];

      onSize(box ? {height: box.blockSize, width: box.inlineSize} : readSize(element));
    });

    observer.observe(element, {box: "border-box"});

    return () => observer.disconnect();
  }, [onSize, ref]);
};

/* -------------------------------------------------------------------------------------------------
 * Content cross-fade (opacity + scale)
 * -----------------------------------------------------------------------------------------------*/

/** Timing of a content transition (web counterpart of Reanimated's `WithTimingConfig`). */
export interface MorphButtonTimingConfig {
  /** Duration in ms. @default 200 */
  duration?: number;
  /** Any CSS easing function. @default var(--ease-in-out-quad) */
  easing?: string;
}

export interface MorphButtonContentAnimationConfig {
  /** Opacity values `[closed, open]`. */
  opacity?: {value?: [number, number]; timingConfig?: MorphButtonTimingConfig};
  /** Scale values `[closed, open]`. */
  scale?: {value?: [number, number]; timingConfig?: MorphButtonTimingConfig};
}

/**
 * Animation of a content part:
 * - `false` / `"disabled"`: the part snaps between its states
 * - `true` / `undefined`: default cross-fade
 * - object: custom values / timing
 */
export type MorphButtonContentAnimation = boolean | "disabled" | MorphButtonContentAnimationConfig;

const DEFAULT_DURATION = 200;

const CONTENT_DEFAULTS = {
  collapsed: {opacity: [1, 0], scale: [1, 0.96]},
  expanded: {opacity: [0, 1], scale: [0.97, 1]},
} as const;

export const getContentAnimationStyle = ({
  animation,
  hideWhenClosed,
  isActive,
  isAllAnimationDisabled,
  isOpen,
  kind,
}: {
  animation: MorphButtonContentAnimation | undefined;
  kind: "collapsed" | "expanded";
  isOpen: boolean;
  isActive: boolean;
  isAllAnimationDisabled: boolean;
  /** Hide the part (visibility) once it has faded out. */
  hideWhenClosed: boolean;
}): CSSProperties | undefined => {
  if (!isActive) return undefined;

  const isDisabled = isAllAnimationDisabled || animation === false || animation === "disabled";
  const config = typeof animation === "object" ? animation : undefined;
  const defaults = CONTENT_DEFAULTS[kind];
  const opacity = config?.opacity?.value ?? defaults.opacity;
  const scale = config?.scale?.value ?? defaults.scale;
  const opacityDuration = isDisabled
    ? 0
    : (config?.opacity?.timingConfig?.duration ?? DEFAULT_DURATION);
  const scaleDuration = isDisabled
    ? 0
    : (config?.scale?.timingConfig?.duration ?? DEFAULT_DURATION);
  // The part is "shown" while the button is open for the expanded content, closed otherwise.
  const isShown = kind === "expanded" ? isOpen : !isOpen;
  const index = isOpen ? 1 : 0;
  const style: Record<string, string | number | undefined> = {
    "--morph-button-opacity-duration": `${opacityDuration}ms`,
    "--morph-button-opacity-easing": config?.opacity?.timingConfig?.easing,
    "--morph-button-scale-duration": `${scaleDuration}ms`,
    "--morph-button-scale-easing": config?.scale?.timingConfig?.easing,
    opacity: opacity[index],
    scale: String(scale[index]),
  };

  if (hideWhenClosed) {
    // Stay visible until the fade-out finished, then drop out of hit testing and the a11y tree.
    style["--morph-button-visibility-delay"] = isShown ? "0ms" : `${opacityDuration}ms`;
    style["visibility"] = isShown ? "visible" : "hidden";
  }

  return style as CSSProperties;
};
