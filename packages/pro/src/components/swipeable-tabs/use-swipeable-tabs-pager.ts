"use client";

import type {PositionController} from "./swipeable-tabs-motion";
import type {RefObject} from "react";

import {useEffect, useEffectEvent} from "react";

import {isRTLElement} from "./swipeable-tabs-motion";

/** Pointer travel (px) before a gesture is classified as a horizontal drag or a vertical scroll. */
const DRAG_SLOP = 8;
/** Release velocity (pages per second) above which the swipe goes to the next page in its direction. */
const FLICK_VELOCITY = 0.4;
/** Velocity samples older than this (ms) are ignored at release. */
const VELOCITY_WINDOW = 100;
/** Horizontal wheel travel (px) that turns a page (trackpad swipe). */
const WHEEL_THRESHOLD = 50;
/** Idle time (ms) that ends a wheel gesture. */
const WHEEL_IDLE = 180;
/** Drags never start on these (text editing, sliders, explicit opt-out). */
const NO_SWIPE_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='slider'], [data-swipeable-tabs-ignore]";

export interface PagerGestureOptions {
  controller: PositionController;
  /** Swipe and wheel gestures are enabled. */
  isEnabled: boolean;
  /** Locale direction; only used to re-attach when it changes (geometry reads the DOM `dir`). */
  isRTL: boolean;
  /** Allow dragging past the first/last page with rubber-band resistance. */
  overdrag: boolean;
  pageCount: number;
  /** A horizontal drag started at page `fromIndex`. */
  onDragStart: (fromIndex: number) => void;
  /**
   * The drag moved; `nearestIndex` is the page closest to the current position (at most one page
   * away from where the drag started). Called on every move of an active drag.
   */
  onDragMove: (nearestIndex: number) => void;
  /** The finger lifted; `targetIndex` is the page to settle on (velocity in pages/s). */
  onRelease: (targetIndex: number, velocity: number) => void;
  /** A wheel / trackpad swipe asks for page `targetIndex`. */
  onWheelPage: (targetIndex: number) => void;
}

interface DragState {
  /** 1 for LTR, -1 for RTL (read at pointer down). */
  direction: number;
  /** The page the gesture started from (rounded position at pointer down). */
  fromIndex: number;
  isDragging: boolean;
  originX: number;
  originY: number;
  pageWidth: number;
  pointerId: number;
  samples: Array<{position: number; time: number}>;
  startPosition: number;
  /** The pointer landed while the pager was still animating (it "caught" the page). */
  wasAnimating: boolean;
}

/** iOS-style rubber band: distance past the edge (in pages) to visible overscroll. */
const rubberBand = (overshoot: number) => 1 - 1 / (overshoot * 0.55 + 1);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hasHorizontalScroller = (target: EventTarget | null, root: HTMLElement, delta: number) => {
  let node = target instanceof Element ? target : null;

  while (node && node !== root) {
    if (node instanceof HTMLElement && node.scrollWidth > node.clientWidth) {
      const {overflowX} = getComputedStyle(node);

      if (overflowX === "auto" || overflowX === "scroll") {
        const max = node.scrollWidth - node.clientWidth;
        const left = Math.abs(node.scrollLeft);

        if ((delta > 0 && left < max - 1) || (delta < 0 && left > 1)) return true;
      }
    }
    node = node.parentElement;
  }

  return false;
};

/**
 * Pointer (touch, mouse, pen) and trackpad gestures for the SwipeableTabs pager.
 *
 * - Horizontal drags move the pages 1:1 with the finger (`touch-action: pan-y` on the pager leaves
 *   vertical scrolling to the browser). Every move reports the nearest page (the selection follows
 *   it, like the Native label that flips once the swipe passes halfway). Release picks the next
 *   page on a flick, else the nearest page, never more than one page away from where the drag
 *   started.
 * - A pointer that lands while the pager is still sliding catches it.
 * - Clicks that end a drag are swallowed so buttons inside a page do not fire.
 * - Horizontal wheel gestures (trackpads, shift+wheel) turn one page per gesture.
 */
export function useSwipeableTabsPager(
  viewportRef: RefObject<HTMLElement | null>,
  options: PagerGestureOptions,
) {
  const {controller, isEnabled, isRTL, overdrag, pageCount} = options;

  const handleDragStart = useEffectEvent((fromIndex: number) => options.onDragStart(fromIndex));
  const handleDragMove = useEffectEvent((nearestIndex: number) => options.onDragMove(nearestIndex));
  const handleRelease = useEffectEvent((targetIndex: number, velocity: number) =>
    options.onRelease(targetIndex, velocity),
  );
  const handleWheelPage = useEffectEvent((targetIndex: number) => options.onWheelPage(targetIndex));

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || !isEnabled || pageCount < 2) return;

    const maxIndex = pageCount - 1;
    // Pages flow right-to-left in RTL, so a leftward drag moves to the previous page.
    const getDirection = () => (isRTLElement(viewport) ? -1 : 1);
    let drag: DragState | null = null;
    let suppressClick = false;
    let wheelDelta = 0;
    let wheelLocked = false;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;

    const bound = (position: number) => {
      if (position >= 0 && position <= maxIndex) return position;
      if (!overdrag) return clamp(position, 0, maxIndex);

      return position < 0 ? -rubberBand(-position) : maxIndex + rubberBand(position - maxIndex);
    };

    const release = (state: DragState, velocity: number) => {
      const position = controller.get();
      let target =
        Math.abs(velocity) > FLICK_VELOCITY
          ? velocity > 0
            ? Math.ceil(position)
            : Math.floor(position)
          : Math.round(position);

      target = clamp(target, state.fromIndex - 1, state.fromIndex + 1);
      target = clamp(target, 0, maxIndex);
      handleRelease(target, velocity);
    };

    const getVelocity = (state: DragState, now: number) => {
      const recent = state.samples.filter((sample) => now - sample.time <= VELOCITY_WINDOW);

      if (recent.length < 2) return 0;
      const first = recent[0]!;
      const last = recent[recent.length - 1]!;
      const elapsed = last.time - first.time;

      return elapsed > 0 ? ((last.position - first.position) / elapsed) * 1000 : 0;
    };

    const end = (event: PointerEvent, cancelled: boolean) => {
      const state = drag;

      if (!state || event.pointerId !== state.pointerId) return;
      drag = null;

      if (state.isDragging) {
        if (viewport.hasPointerCapture(event.pointerId)) {
          viewport.releasePointerCapture(event.pointerId);
        }
        suppressClick = !cancelled && event.pointerType === "mouse";
        release(state, cancelled ? 0 : getVelocity(state, event.timeStamp));
      } else if (state.wasAnimating) {
        // A tap that caught a sliding pager lets it settle on the nearest page.
        release(state, 0);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      suppressClick = false;
      if (drag || !event.isPrimary) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(NO_SWIPE_SELECTOR)) return;

      const wasAnimating = controller.isAnimating();
      const startPosition = controller.get();

      if (wasAnimating) controller.stop();

      drag = {
        direction: getDirection(),
        fromIndex: clamp(Math.round(startPosition), 0, maxIndex),
        isDragging: false,
        originX: event.clientX,
        originY: event.clientY,
        pageWidth: viewport.clientWidth || 1,
        pointerId: event.pointerId,
        samples: [],
        startPosition,
        wasAnimating,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = drag;

      if (!state || event.pointerId !== state.pointerId) return;

      const dx = event.clientX - state.originX;
      const dy = event.clientY - state.originY;

      if (!state.isDragging) {
        if (Math.abs(dx) < DRAG_SLOP && Math.abs(dy) < DRAG_SLOP) return;

        if (Math.abs(dy) >= Math.abs(dx)) {
          // Vertical intent: leave the gesture to the page scroller.
          drag = null;
          if (state.wasAnimating) release(state, 0);

          return;
        }

        state.isDragging = true;
        // Start tracking from here so the page does not jump by the slop distance.
        state.originX = event.clientX;
        state.originY = event.clientY;
        try {
          viewport.setPointerCapture(event.pointerId);
        } catch {
          // The pointer may already be gone (synthetic or cancelled events).
        }
        window.getSelection()?.removeAllRanges();
        handleDragStart(state.fromIndex);
      }

      const delta = ((event.clientX - state.originX) / state.pageWidth) * state.direction;
      const raw = state.startPosition - delta;

      state.samples.push({position: raw, time: event.timeStamp});
      if (state.samples.length > 20) state.samples.shift();
      controller.set(bound(raw));
      if (event.cancelable) event.preventDefault();
      // The page nearest to the finger (the Native selection flips once a swipe passes halfway).
      handleDragMove(
        clamp(
          clamp(Math.round(controller.get()), state.fromIndex - 1, state.fromIndex + 1),
          0,
          maxIndex,
        ),
      );
    };

    const onPointerUp = (event: PointerEvent) => end(event, false);
    const onPointerCancel = (event: PointerEvent) => end(event, true);
    const onLostPointerCapture = (event: PointerEvent) => {
      // Only our own capture counts: touch pointers start implicitly captured by the touched child,
      // which loses (and bubbles) that capture as soon as the pager takes it over.
      if (event.target !== viewport) return;
      if (drag?.isDragging && drag.pointerId === event.pointerId) end(event, true);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const onDragStartNative = (event: DragEvent) => {
      // Native image/link dragging would cancel the pointer stream mid-swipe.
      if (drag) event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (drag || event.ctrlKey) return;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
      const deltaX = (event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX) * scale;
      const deltaY = event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY * scale;

      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
      if (hasHorizontalScroller(event.target, viewport, deltaX)) return;

      event.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelLocked = false;
        wheelDelta = 0;
      }, WHEEL_IDLE);

      if (wheelLocked) return;
      wheelDelta += deltaX;
      if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) return;

      const current = Math.round(controller.getTarget());
      const target = clamp(current + Math.sign(wheelDelta) * getDirection(), 0, maxIndex);

      wheelLocked = true;
      wheelDelta = 0;
      if (target !== current) handleWheelPage(target);
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerCancel);
    viewport.addEventListener("lostpointercapture", onLostPointerCapture);
    viewport.addEventListener("click", onClickCapture, true);
    viewport.addEventListener("dragstart", onDragStartNative);
    viewport.addEventListener("wheel", onWheel, {passive: false});

    return () => {
      clearTimeout(wheelTimer);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerCancel);
      viewport.removeEventListener("lostpointercapture", onLostPointerCapture);
      viewport.removeEventListener("click", onClickCapture, true);
      viewport.removeEventListener("dragstart", onDragStartNative);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, [controller, isEnabled, isRTL, overdrag, pageCount, viewportRef]);
}
