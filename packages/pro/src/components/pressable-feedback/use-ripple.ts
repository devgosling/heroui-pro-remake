"use client";

/**
 * Ripple engine for `PressableFeedback.Ripple`.
 *
 * The press geometry and interaction state machine are a React port of Material Web's
 * `md-ripple` (https://github.com/material-components/material-web, ripple/internal/ripple.ts),
 * Copyright 2022 Google LLC, licensed under Apache-2.0, tuned to the HeroUI Pro feel:
 * a short linear grow (`duration`, 150ms by default), the press layer held for
 * `minimumPressDuration` after release, and presses on nested interactive elements ignored.
 *
 * The ripple attaches to its parent element (the "host"), so it can be dropped into any pressable
 * (`<Button>`, a card, a list row ...) without a wrapper. Hover/press state is written straight to
 * the surface's data attributes to avoid re-renders.
 */
import type {RefObject} from "react";

import {useEffect} from "react";

const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 12;
const SOFT_EDGE_MINIMUM_SIZE = 75;
const SOFT_EDGE_CONTAINER_RATIO = 0.35;
const TOUCH_DELAY_MS = 150;
const NESTED_INTERACTIVE = "button, a, input, select, textarea, [role='button']";

const enum Phase {
  /** No interaction in progress. */
  Inactive,
  /** Touch down received, waiting to know whether it is a scroll/swipe. */
  TouchDelay,
  /** Touch has been deemed a press. */
  Holding,
  /** Pointer released, waiting for the click that finishes the press. */
  WaitingForClick,
}

export interface UseRippleOptions {
  /** Grow animation duration in ms. */
  duration: number;
  /** Time in ms the pressed layer stays visible after the press ends. */
  minimumPressDuration: number;
  /** Disables all ripple interaction. */
  isDisabled?: boolean;
}

const isHostDisabled = (host: HTMLElement) =>
  host.matches(":disabled, [aria-disabled='true'], [data-disabled='true']");

const prefersReducedMotion = (host: HTMLElement) =>
  !!host.closest("[data-reduce-motion='true']") ||
  (typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const setFlag = (element: HTMLElement, name: "data-hovered" | "data-pressed", on: boolean) => {
  if (on) element.setAttribute(name, "true");
  else element.removeAttribute(name);
};

export function useRipple(
  containerRef: RefObject<HTMLElement | null>,
  surfaceRef: RefObject<HTMLElement | null>,
  {duration, isDisabled, minimumPressDuration}: UseRippleOptions,
) {
  useEffect(() => {
    const container = containerRef.current;
    const surface = surfaceRef.current;
    const host = container?.parentElement;

    if (!container || !surface || !host || isDisabled) return;

    // Forced colors hides the ripple entirely (see CSS), so skip all work.
    const forcedColors =
      typeof window.matchMedia === "function" ? window.matchMedia("(forced-colors: active)") : null;

    let phase: Phase = Phase.Inactive;
    let startEvent: PointerEvent | undefined;
    let growAnimation: Animation | undefined;
    let touchTimer: ReturnType<typeof setTimeout> | undefined;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;

    /** Ignore presses that belong to an interactive element nested inside the host. */
    const isNestedInteractive = (event: Event) => {
      const target = event.target;

      if (!(target instanceof Element)) return false;
      const match = target.closest(NESTED_INTERACTIVE);

      return !!match && match !== host && host.contains(match);
    };

    const startPress = (position?: {clientX: number; clientY: number}) => {
      clearTimeout(releaseTimer);
      growAnimation?.cancel();

      const rect = container.getBoundingClientRect();
      const zoom = (container as HTMLElement & {currentCSSZoom?: number}).currentCSSZoom ?? 1;
      const width = rect.width / zoom;
      const height = rect.height / zoom;
      const maxDim = Math.max(width, height);
      const softEdgeSize = Math.max(SOFT_EDGE_CONTAINER_RATIO * maxDim, SOFT_EDGE_MINIMUM_SIZE);
      const initialSize = Math.max(1, Math.floor(maxDim * INITIAL_ORIGIN_SCALE));
      const maxRadius = Math.hypot(width, height) + PADDING;
      const scale = (maxRadius + softEdgeSize) / initialSize;

      // Grows from the pointer and settles centred in the host (centred start without a pointer).
      const start = position
        ? {x: (position.clientX - rect.left) / zoom, y: (position.clientY - rect.top) / zoom}
        : {x: (width - initialSize) / 2, y: (height - initialSize) / 2};
      const end = {x: (width - initialSize) / 2, y: (height - initialSize) / 2};
      const size = `${initialSize}px`;

      if (typeof surface.animate === "function") {
        growAnimation = surface.animate(
          {
            height: [size, size],
            // Pin to the physical top-left so the translate maths also holds in RTL.
            left: [0, 0],
            top: [0, 0],
            transform: prefersReducedMotion(host)
              ? [
                  `translate(${end.x}px, ${end.y}px) scale(${scale})`,
                  `translate(${end.x}px, ${end.y}px) scale(${scale})`,
                ]
              : [
                  `translate(${start.x}px, ${start.y}px) scale(1)`,
                  `translate(${end.x}px, ${end.y}px) scale(${scale})`,
                ],
            width: [size, size],
          },
          {duration, fill: "forwards", pseudoElement: "::after"},
        );
      }

      setFlag(surface, "data-pressed", true);
    };

    const endPress = () => {
      startEvent = undefined;
      phase = Phase.Inactive;

      const animation = growAnimation;

      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        // A newer press owns the pressed state.
        if (growAnimation !== animation) return;
        setFlag(surface, "data-pressed", false);
      }, minimumPressDuration);
    };

    const isTouch = (event: PointerEvent) => event.pointerType === "touch";

    const shouldReact = (event: PointerEvent) => {
      if (forcedColors?.matches || !event.isPrimary || isHostDisabled(host)) return false;
      if (startEvent && startEvent.pointerId !== event.pointerId) return false;
      if (event.type === "pointerenter" || event.type === "pointerleave") return !isTouch(event);

      return isTouch(event) || event.buttons === 1;
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (!shouldReact(event)) return;
      setFlag(surface, "data-hovered", true);
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (!shouldReact(event)) return;
      setFlag(surface, "data-hovered", false);
      // Release a held mouse or pen press that moves outside the host.
      if (phase !== Phase.Inactive) endPress();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!shouldReact(event) || isNestedInteractive(event)) return;
      startEvent = event;

      if (!isTouch(event)) {
        phase = Phase.WaitingForClick;
        startPress(event);

        return;
      }

      // Delay touch feedback so scrolls and swipes don't flash a ripple.
      phase = Phase.TouchDelay;
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        if (phase !== Phase.TouchDelay) return;
        phase = Phase.Holding;
        startPress(event);
      }, TOUCH_DELAY_MS);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!shouldReact(event)) return;

      if (phase === Phase.Holding) {
        phase = Phase.WaitingForClick;

        return;
      }

      if (phase === Phase.TouchDelay) {
        phase = Phase.WaitingForClick;
        startPress(startEvent);
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!shouldReact(event)) return;
      endPress();
    };

    const onClick = (event: MouseEvent) => {
      if (forcedColors?.matches || isHostDisabled(host) || isNestedInteractive(event)) return;

      if (phase === Phase.WaitingForClick) {
        endPress();

        return;
      }

      if (phase === Phase.Inactive) {
        // Click without a pointer press (keyboard on a native button, element.click()): centred ripple.
        startPress();
        endPress();
      }
    };

    const onContextMenu = () => {
      if (phase !== Phase.Inactive) endPress();
    };

    const listeners = [
      ["pointerenter", onPointerEnter],
      ["pointerleave", onPointerLeave],
      ["pointerdown", onPointerDown],
      ["pointerup", onPointerUp],
      ["pointercancel", onPointerCancel],
      ["click", onClick],
      ["contextmenu", onContextMenu],
    ] as const;

    for (const [type, listener] of listeners) {
      host.addEventListener(type, listener as EventListener);
    }

    return () => {
      for (const [type, listener] of listeners) {
        host.removeEventListener(type, listener as EventListener);
      }
      clearTimeout(touchTimer);
      clearTimeout(releaseTimer);
      growAnimation?.cancel();
      setFlag(surface, "data-hovered", false);
      setFlag(surface, "data-pressed", false);
    };
  }, [containerRef, surfaceRef, duration, isDisabled, minimumPressDuration]);
}
