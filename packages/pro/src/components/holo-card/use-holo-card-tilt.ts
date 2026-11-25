"use client";

import type {HoloCardSpring} from "./use-spring-values";
import type {PointerEvent as ReactPointerEvent, RefObject} from "react";

import {useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore} from "react";

import {resolveSpring, useSpringValues} from "./use-spring-values";

/* -------------------------------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------------------------*/
export const HOLO_CARD_DEFAULT_MAX_TILT = 100 / 7; // ~14.29deg at the card edge
const FOLLOW_SPRING = {damping: 28, mass: 1, stiffness: 180};
const SETTLE_SPRING = {damping: 22, mass: 1, stiffness: 120};
// Content drift in px per degree of tilt at parallaxStrength 1.
const PARALLAX_PER_DEGREE = 1 / 18;
// The holographic texture only travels across the middle band of its background.
const BACKGROUND_X = {factor: 0.26, from: 37};
const BACKGROUND_Y = {factor: 0.34, from: 33};

// Every value is its own spring, so each one comes to rest on its own thresholds.
const REST = {
  backgroundX: 50,
  backgroundY: 50,
  opacity: 0,
  pointerX: 50,
  pointerY: 50,
  rotateX: 0,
  rotateY: 0,
  scale: 1,
};

type TiltValues = typeof REST;

/* -------------------------------------------------------------------------------------------------
 * prefers-reduced-motion
 * -----------------------------------------------------------------------------------------------*/
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(REDUCED_MOTION_QUERY);

  media.addEventListener("change", callback);

  return () => media.removeEventListener("change", callback);
}

const getReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches;

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number, precision: number) => {
  const factor = 10 ** precision;

  return Math.round(value * factor) / factor;
};
// Compact CSS numbers: 6 significant digits like the browser serializes them, never "-0".
const num = (value: number) => `${Number(value.toPrecision(6)) || 0}`;

function rotateTransform(rotateX: number, rotateY: number) {
  const parts: string[] = [];

  if (rotateX) parts.push(`rotateX(${num(rotateX)}deg)`);
  if (rotateY) parts.push(`rotateY(${num(rotateY)}deg)`);

  return parts.length ? parts.join(" ") : "none";
}

function translateTransform(x: number, y: number) {
  return x || y ? `translateX(${num(x)}px) translateY(${num(y)}px)` : "none";
}

/* -------------------------------------------------------------------------------------------------
 * Tilt hook
 * -----------------------------------------------------------------------------------------------*/
interface UseHoloCardTiltOptions {
  rootRef: RefObject<HTMLDivElement | null>;
  rotatorRef: RefObject<HTMLDivElement | null>;
  activateOnHover: boolean;
  tiltOnTouch: boolean;
  isInteractive: boolean;
  isDisabled: boolean;
  maxTilt: number;
  hoverScale: number;
  parallaxStrength: number;
  spring?: HoloCardSpring;
  settleSpring?: HoloCardSpring;
}

export function useHoloCardTilt({
  activateOnHover,
  hoverScale,
  isDisabled,
  isInteractive,
  maxTilt,
  parallaxStrength,
  rootRef,
  rotatorRef,
  settleSpring,
  spring,
  tiltOnTouch,
}: UseHoloCardTiltOptions) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isEnabled = isInteractive && !isDisabled;
  const isTracking = isEnabled && !prefersReducedMotion;
  // `activateOnHover` cards wake on mouse enter and go back to sleep once the settle spring rests.
  const [isAwake, setIsAwake] = useState(false);

  // Turning `activateOnHover` off puts the card back to sleep (adjusted during render, not in an
  // effect), so re-enabling it later starts asleep. `isAwake` is ignored while it is off.
  if (!activateOnHover && isAwake) setIsAwake(false);

  const isActive = isTracking && (!activateOnHover || isAwake);
  const tiltsOnTouch = isEnabled && tiltOnTouch && !activateOnHover;

  const contentsRef = useRef(new Set<HTMLElement>());
  const isLeavingRef = useRef(false);
  const optionsRef = useRef({
    activateOnHover,
    followSpring: resolveSpring(spring, FOLLOW_SPRING),
    hoverScale,
    isTracking,
    maxTilt,
    parallaxStrength,
    restSpring: resolveSpring(settleSpring, SETTLE_SPRING),
    tiltsOnTouch,
  });

  useLayoutEffect(() => {
    optionsRef.current = {
      activateOnHover,
      followSpring: resolveSpring(spring, FOLLOW_SPRING),
      hoverScale,
      isTracking,
      maxTilt,
      parallaxStrength,
      restSpring: resolveSpring(settleSpring, SETTLE_SPRING),
      tiltsOnTouch,
    };
  });

  /* Writes one frame: read-only CSS variables + scale on the root, tilt on the rotator and the
   * counter-drift on every parallax content layer. */
  const writeFrame = useCallback(
    (values: TiltValues) => {
      const root = rootRef.current;

      if (!root) return;
      const {rotateX, rotateY} = values;
      const {style} = root;

      style.setProperty("--holo-card-background-x", `${values.backgroundX}%`);
      style.setProperty("--holo-card-background-y", `${values.backgroundY}%`);
      style.setProperty("--holo-card-opacity", `${values.opacity}`);
      style.setProperty("--holo-card-pointer-x", `${values.pointerX}%`);
      style.setProperty("--holo-card-pointer-y", `${values.pointerY}%`);
      style.transform = values.scale === 1 ? "none" : `scale(${num(values.scale)})`;

      if (rotatorRef.current)
        rotatorRef.current.style.transform = rotateTransform(rotateX, rotateY);

      // The content drift is derived from the tilt, so it rests together with it.
      const drift = optionsRef.current.parallaxStrength * PARALLAX_PER_DEGREE;
      const contentTransform = translateTransform(rotateY * drift, -rotateX * drift);

      contentsRef.current.forEach((element) => {
        element.style.transform = contentTransform;
      });
    },
    [rootRef, rotatorRef],
  );

  const handleRest = useCallback(() => {
    if (!isLeavingRef.current) return;
    isLeavingRef.current = false;
    if (optionsRef.current.activateOnHover) setIsAwake(false);
  }, []);

  const {animateTo, get, set} = useSpringValues<keyof TiltValues>(REST, writeFrame, handleRest);

  // Resting values are written on mount, and again whenever the card stops tracking.
  useLayoutEffect(() => {
    isLeavingRef.current = false;
    set(REST);
  }, [isTracking, set]);

  /** Registers a parallax content layer; returns its cleanup. */
  const registerContent = useCallback(
    (element: HTMLElement) => {
      contentsRef.current.add(element);
      writeFrame(get());

      return () => {
        contentsRef.current.delete(element);
      };
    },
    [get, writeFrame],
  );

  /* ---------------------------------------------------------------------------------------------
   * Pointer handlers
   * -------------------------------------------------------------------------------------------*/
  const accepts = (event: ReactPointerEvent) => {
    const options = optionsRef.current;

    if (!options.isTracking) return false;
    if (event.pointerType === "mouse") return true;

    // Touch and pen only tilt cards that reserve horizontal drags for it.
    return options.tiltsOnTouch;
  };

  const track = (event: ReactPointerEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    const surface = root.querySelector<HTMLElement>("[data-slot='holo-card-surface']");
    const rect = root.getBoundingClientRect();
    const {followSpring, hoverScale: scale, maxTilt: tilt} = optionsRef.current;
    // Layout size of the card; the root rect only adds the hover scale (around its center).
    const width = surface?.offsetWidth || rect.width;
    const height = surface?.offsetHeight || rect.height;
    const ratio = root.offsetWidth ? rect.width / root.offsetWidth / get().scale : 1;
    const left = rect.left + rect.width / 2 - (width * ratio) / 2;
    const top = rect.top + rect.height / 2 - (height * ratio) / 2;
    const pointerX = round(clamp(((event.clientX - left) / (width * ratio)) * 100, 0, 100), 3);
    const pointerY = round(clamp(((event.clientY - top) / (height * ratio)) * 100, 0, 100), 3);

    isLeavingRef.current = false;
    animateTo(
      {
        backgroundX: BACKGROUND_X.from + pointerX * BACKGROUND_X.factor,
        backgroundY: BACKGROUND_Y.from + pointerY * BACKGROUND_Y.factor,
        opacity: 1,
        pointerX,
        pointerY,
        // Tilt toward the pointer: the edge under it dips away from the viewer.
        rotateX: round(((pointerY - 50) / 50) * tilt, 3),
        rotateY: round((-(pointerX - 50) / 50) * tilt, 3),
        scale,
      },
      followSpring,
    );
  };

  const settle = () => {
    isLeavingRef.current = true;
    animateTo(REST, optionsRef.current.restSpring);
  };

  // Entering only wakes an `activateOnHover` card; tracking starts with the first move.
  const onPointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!accepts(event)) return;
    if (optionsRef.current.activateOnHover && event.pointerType === "mouse") setIsAwake(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!accepts(event)) return;
    if (optionsRef.current.activateOnHover && event.pointerType === "mouse") setIsAwake(true);
    track(event);
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!optionsRef.current.isTracking) return;
    if (event.pointerType !== "mouse" && !optionsRef.current.tiltsOnTouch) return;
    settle();
  };

  return {
    handlers: {
      onPointerCancel: onPointerLeave,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
    },
    isActive,
    registerContent,
    tiltsOnTouch,
  };
}
