"use client";

import type {MorphTabsInternalContextValue} from "./morph-tabs-context";
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";

import {useEffect, useRef} from "react";

/** Distance (px) a pointer has to travel before the pager decides between swipe and scroll. */
const SLOP = 8;
/** Release velocity (pages per second) that flips to the neighbouring page regardless of distance. */
const FLING_VELOCITY = 0.5;
/** Window (ms) of pointer samples used to estimate the release velocity. */
const VELOCITY_WINDOW = 100;
/** A finger that rested this long (ms) before lifting releases with zero velocity. */
const REST_TIMEOUT = 60;
/** Horizontal wheel distance (px) that turns one page on trackpads. */
const WHEEL_THRESHOLD = 40;
/** Pause (ms) that ends a trackpad wheel gesture (including its inertia tail). */
const WHEEL_IDLE = 180;

/** iOS-like resistance when dragging past the first / last page (`overdrag`). */
const rubberBand = (overflow: number) => (0.55 * overflow) / (1 + 0.55 * overflow);

const isTextEntry = (element: Element) =>
  element instanceof HTMLInputElement ||
  element instanceof HTMLTextAreaElement ||
  (element instanceof HTMLElement && element.isContentEditable);

/** Writing direction actually rendered (dir attribute / CSS), falling back to the locale. */
const getDirection = (element: Element | null, fallback: "ltr" | "rtl") => {
  if (!element || typeof window === "undefined") return fallback;

  return window.getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";
};

interface PointerSample {
  position: number;
  time: number;
}

interface GestureState {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  startPosition: number;
  isDragging: boolean;
  isRTL: boolean;
  samples: PointerSample[];
  /** The native `pointerdown`, checked later to see whether page content claimed the pointer. */
  downEvent: PointerEvent;
}

/**
 * Whether page content owns this pointer, so a horizontal move must not turn into a swipe:
 * a control that prevented the default `pointerdown` (React Aria `useMove`: sliders, color areas,
 * ...), a native range input, or a mouse drag that selects text inside a text field.
 */
const isClaimedByContent = (gesture: GestureState) => {
  const {downEvent} = gesture;
  const target = downEvent.target instanceof Element ? downEvent.target : null;

  if (downEvent.defaultPrevented) return true;
  if (target?.closest('input[type="range"]')) return true;

  return gesture.pointerType === "mouse" && !!target && isTextEntry(target);
};

const getVelocity = (samples: PointerSample[], now: number) => {
  const recent = samples.filter((sample) => now - sample.time <= VELOCITY_WINDOW);
  const first = recent[0];
  const last = recent[recent.length - 1];

  if (!first || !last || first === last || now - last.time > REST_TIMEOUT) return 0;

  const elapsed = (last.time - first.time) / 1000;

  return elapsed > 0 ? (last.position - first.position) / elapsed : 0;
};

export interface UseMorphTabsPagerOptions {
  pagerRef: RefObject<HTMLDivElement | null>;
  internal: MorphTabsInternalContextValue;
  swipeEnabled: boolean;
  overdrag: boolean;
  keyboardDismissMode: "none" | "on-drag";
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

/**
 * Pointer-driven pager gesture (touch, pen and mouse) plus trackpad swipes.
 *
 * The pager follows the finger 1:1; vertical movement is left to the browser (the pager sets
 * `touch-action: pan-y`). On release the target page is decided from the release velocity and the
 * position, synchronously inside `pointerup`, so the selection haptic plays during the gesture.
 */
export const useMorphTabsPager = ({
  internal,
  keyboardDismissMode,
  onSwipeEnd,
  onSwipeStart,
  overdrag,
  pagerRef,
  swipeEnabled,
}: UseMorphTabsPagerOptions) => {
  const gestureRef = useRef<GestureState | null>(null);
  const suppressClickRef = useRef(false);
  const {direction, drag, step} = internal;

  const setDraggingAttribute = (isDragging: boolean) => {
    const pager = pagerRef.current;
    const root = pager?.closest<HTMLElement>('[data-slot="morph-tabs"]');

    for (const element of [pager, root]) {
      if (!element) continue;
      if (isDragging) element.setAttribute("data-dragging", "true");
      else element.removeAttribute("data-dragging");
    }
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, gesture: GestureState) => {
    gesture.isDragging = true;
    try {
      event.currentTarget.setPointerCapture(gesture.pointerId);
    } catch {
      // The pointer may already be gone (e.g. a synthetic event); dragging still works.
    }
    drag.start();
    setDraggingAttribute(true);

    const pager = pagerRef.current;
    const active = typeof document === "undefined" ? null : document.activeElement;

    if (
      keyboardDismissMode === "on-drag" &&
      active &&
      pager?.contains(active) &&
      isTextEntry(active)
    ) {
      (active as HTMLElement).blur();
    }
    if (gesture.pointerType === "mouse") window.getSelection()?.removeAllRanges();
    onSwipeStart?.();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false;
    if (!swipeEnabled || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    // A touch while the pager is still sliding catches the page where it is.
    const caught = drag.isAnimating();

    if (caught) drag.stop();

    const gesture: GestureState = {
      downEvent: event.nativeEvent,
      isDragging: false,
      isRTL: getDirection(event.currentTarget, direction) === "rtl",
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      samples: [{position: drag.getPosition(), time: event.timeStamp}],
      startPosition: drag.getPosition(),
      startX: event.clientX,
      startY: event.clientY,
    };

    gestureRef.current = gesture;
    if (caught) beginDrag(event, gesture);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    if (!gesture.isDragging) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        // Vertical intent: let the page scroll.
        gestureRef.current = null;

        return;
      }
      if (isClaimedByContent(gesture)) {
        gestureRef.current = null;

        return;
      }
      beginDrag(event, gesture);
    }

    const width = pagerRef.current?.clientWidth || 1;
    const sign = gesture.isRTL ? -1 : 1;
    const max = Math.max(0, drag.getPageCount() - 1);
    let position = gesture.startPosition - (sign * dx) / width;

    if (position < 0) position = overdrag ? -rubberBand(-position) : 0;
    else if (position > max) position = overdrag ? max + rubberBand(position - max) : max;

    drag.move(position);
    gesture.samples.push({position, time: event.timeStamp});
    if (gesture.samples.length > 12) gesture.samples.shift();
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>, isCancelled: boolean) => {
    const gesture = gestureRef.current;

    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gestureRef.current = null;
    if (!gesture.isDragging) return;

    try {
      if (event.currentTarget.hasPointerCapture(gesture.pointerId)) {
        event.currentTarget.releasePointerCapture(gesture.pointerId);
      }
    } catch {
      // Already released.
    }
    setDraggingAttribute(false);
    suppressClickRef.current = true;

    const velocity = isCancelled ? 0 : getVelocity(gesture.samples, event.timeStamp);
    const position = drag.getPosition();
    const count = drag.getPageCount();
    const base = Math.round(gesture.startPosition);
    let target = Math.round(position);

    if (velocity >= FLING_VELOCITY) target = Math.floor(position) + 1;
    else if (velocity <= -FLING_VELOCITY) target = Math.ceil(position) - 1;

    // One page per swipe, like a native pager.
    target = Math.min(Math.min(count - 1, base + 1), Math.max(Math.max(0, base - 1), target));

    drag.end(target, velocity, onSwipeEnd);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => finish(event, false);
  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => finish(event, true);

  // Touch pointers are implicitly captured by the touched child; moving the capture to the pager
  // makes that child fire a bubbling `lostpointercapture`, which must not end the drag.
  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) finish(event, true);
  };

  // A mouse drag must not end in a click on the page content.
  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  // Native image / link dragging would steal the pointer from the swipe.
  const onDragStart = (event: ReactDragEvent<HTMLDivElement>) => {
    if (swipeEnabled) event.preventDefault();
  };

  // Trackpad: one page per horizontal two-finger swipe. Needs a non-passive listener.
  useEffect(() => {
    const pager = pagerRef.current;

    if (!pager || !swipeEnabled) return;

    let accumulated = 0;
    let isLocked = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        accumulated = 0;
        isLocked = false;
      }, WHEEL_IDLE);

      if (isLocked || gestureRef.current?.isDragging) return;
      accumulated += event.deltaX * (getDirection(pager, direction) === "rtl" ? -1 : 1);

      if (Math.abs(accumulated) >= WHEEL_THRESHOLD) {
        isLocked = true;
        step(accumulated > 0 ? 1 : -1, "wheel");
      }
    };

    pager.addEventListener("wheel", onWheel, {passive: false});

    return () => {
      clearTimeout(idleTimer);
      pager.removeEventListener("wheel", onWheel);
    };
  }, [direction, pagerRef, step, swipeEnabled]);

  // Capture phase: pressable page content (React Aria buttons, checkboxes, ...) stops the
  // propagation of `pointerdown`, so bubbling handlers would never see a swipe that starts on it.
  // Listening while capturing lets the pager track every pointer; once a drag starts the pointer is
  // captured by the pager, which makes React Aria cancel the inner press (the release happens
  // outside its target) and the click that follows is swallowed by `onClickCapture`.
  return {
    onClickCapture,
    onDragStartCapture: onDragStart,
    onLostPointerCapture,
    onPointerCancelCapture: onPointerCancel,
    onPointerDownCapture: onPointerDown,
    onPointerMoveCapture: onPointerMove,
    onPointerUpCapture: onPointerUp,
  };
};
