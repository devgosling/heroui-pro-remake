"use client";

import type {RefObject} from "react";

import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";

/** How the viewport scrolls to the end: a native smooth scroll or a jump. */
export type ChatConversationScrollBehavior = "instant" | "smooth";

/**
 * Distance from the end (px) that still counts as "at the bottom". Measured on the Pro demos:
 * 4px from the end keeps the scroll button hidden, 5px shows it.
 */
const AT_BOTTOM_THRESHOLD = 5;

/** Window-level `useLayoutEffect` that stays silent during SSR. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function getDistanceFromBottom(element: HTMLElement) {
  return element.scrollHeight - element.clientHeight - element.scrollTop;
}

/** Vertical wheel distance in px (`deltaMode` is lines or pages in some browsers). */
function getWheelDeltaY(event: WheelEvent, element: HTMLElement) {
  if (event.deltaMode === 1) {
    return event.deltaY * (parseFloat(getComputedStyle(element).lineHeight) || 16);
  }
  if (event.deltaMode === 2) return event.deltaY * element.clientHeight;

  return event.deltaY;
}

interface UseStickToBottomOptions {
  /** Scroll behaviour on mount. */
  initial: ChatConversationScrollBehavior;
  /** Scroll behaviour when the content grows while the view follows it. */
  resize: ChatConversationScrollBehavior;
}

interface UseStickToBottomResult {
  /** Attach to the scroll viewport. */
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Whether the content is taller than the viewport. */
  hasOverflow: boolean;
  /** Whether the viewport is at the bottom (or following new content towards it). */
  isAtBottom: boolean;
  /** Scrolls to the bottom and follows new content again. */
  scrollToBottom: (behavior?: ChatConversationScrollBehavior) => void;
}

/**
 * Stick-to-bottom scrolling for a chat viewport (own implementation).
 *
 * - The view follows new content (a `ResizeObserver` on the viewport and its children) while it
 *   is "stuck" to the bottom, with a native smooth or instant scroll.
 * - Any scroll that leaves the bottom (wheel, touch, keyboard, scrollbar or script) releases it;
 *   reaching the bottom again, by any means, sticks it again and settles on the exact end with a
 *   smooth scroll (the view may have stopped up to 4px short of it).
 * - Scroll events caused by the hook's own scroll towards the end are ignored, so the view keeps
 *   counting as "at the bottom" while it catches up with streamed content. A wheel-up, a finger
 *   pulling down or any scroll that moves the view up (keyboard, scrollbar) cancels that catch-up.
 *   A wheel does not stop a native smooth scroll, so wheel-up jumps the view to where it leads.
 * - A resized viewport (while stuck) scrolls back to the end with the `resize` behaviour.
 */
export function useStickToBottom({
  initial,
  resize,
}: UseStickToBottomOptions): UseStickToBottomResult {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);

  /** Follow new content. */
  const isStuckRef = useRef(true);
  /** Our own scroll towards the end is in flight. */
  const isFollowingRef = useRef(false);

  const behaviorRef = useRef({initial, resize});

  // Read only from the effects below and observer callbacks, which all run after this one.
  useIsomorphicLayoutEffect(() => {
    behaviorRef.current = {initial, resize};
  }, [initial, resize]);

  const scrollToEnd = useCallback((behavior: ChatConversationScrollBehavior) => {
    const element = scrollRef.current;

    if (!element) return;

    const top = element.scrollHeight - element.clientHeight;

    if (top - element.scrollTop < 1) {
      isFollowingRef.current = false;

      return;
    }

    isFollowingRef.current = true;
    element.scrollTo({behavior: behavior === "smooth" ? "smooth" : "instant", top});
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ChatConversationScrollBehavior = "smooth") => {
      isStuckRef.current = true;
      scrollToEnd(behavior);
    },
    [scrollToEnd],
  );

  // Initial position, before the first paint for `instant`.
  useIsomorphicLayoutEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    setHasOverflow(element.scrollHeight - element.clientHeight > 0);
    scrollToEnd(behaviorRef.current.initial);
  }, [scrollToEnd]);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    let isFirstResize = true;
    let touchY: number | null = null;
    /** `scrollTop` at the last scroll event. */
    let lastScrollTop = element.scrollTop;

    /** The user takes over: drop our in-flight scroll so their scroll decides the state. */
    const cancelFollow = () => {
      isFollowingRef.current = false;
    };

    const onScroll = () => {
      const distance = getDistanceFromBottom(element);
      const scrollTop = element.scrollTop;

      // Our own scrolls only move down: a view that moved up was scrolled by the reader (keyboard,
      // scrollbar, touch), which also stops our native smooth scroll.
      if (scrollTop < lastScrollTop - 1) cancelFollow();
      lastScrollTop = scrollTop;

      setHasOverflow(element.scrollHeight - element.clientHeight > 0);

      if (distance < AT_BOTTOM_THRESHOLD) {
        isStuckRef.current = true;
        isFollowingRef.current = false;
        setIsAtBottom(true);

        return;
      }

      // Our own scroll towards the end: keep following.
      if (isFollowingRef.current) return;

      isStuckRef.current = false;
      setIsAtBottom(false);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY >= 0 || !isFollowingRef.current) return;

      cancelFollow();

      // A wheel does not stop a native smooth scroll (the browser usually drops the wheel's own
      // scroll meanwhile): stop it where the wheel takes the view. Our scroll only moves down, so
      // a view above its last position means the browser has already applied the wheel.
      const top = element.scrollTop;
      const isWheelApplied = top < lastScrollTop - 1;

      element.scrollTo({
        behavior: "auto",
        top: isWheelApplied ? top : top + getWheelDeltaY(event, element),
      });
    };

    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;

      // A finger moving down scrolls the content up.
      if (touchY !== null && y !== undefined && y > touchY) cancelFollow();
      touchY = y ?? touchY;
    };

    const onResize = () => {
      const overflow = element.scrollHeight - element.clientHeight;
      const isInitialObservation = isFirstResize;

      isFirstResize = false;
      setHasOverflow(overflow > 0);

      if (isStuckRef.current) {
        setIsAtBottom(true);
        // The observer reports the mount sizes once; the `initial` scroll is already on its way.
        if (isInitialObservation && isFollowingRef.current) return;
        // Taller content or a shorter viewport: back to the end.
        scrollToEnd(behaviorRef.current.resize);

        return;
      }

      setIsAtBottom(getDistanceFromBottom(element) < AT_BOTTOM_THRESHOLD);
    };

    const resizeObserver = new ResizeObserver(onResize);
    const observeChildren = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(element);
      for (const child of Array.from(element.children)) resizeObserver.observe(child);
    };

    observeChildren();

    // Children can be swapped (conditional content, a late scroll button): observe the new ones.
    const mutationObserver = new MutationObserver(observeChildren);

    mutationObserver.observe(element, {childList: true});

    element.addEventListener("scroll", onScroll, {passive: true});
    element.addEventListener("wheel", onWheel, {passive: true});
    element.addEventListener("touchstart", onTouchStart, {passive: true});
    element.addEventListener("touchmove", onTouchMove, {passive: true});

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
    };
  }, [scrollToEnd]);

  // Back at the bottom (within the threshold): settle on the exact end. Checked again on the next
  // frame, because a focus change can stop a smooth scroll (React Aria restores the scroll position
  // when the scroll button is disabled while focused).
  const wasAtBottomRef = useRef(isAtBottom);

  useEffect(() => {
    const wasAtBottom = wasAtBottomRef.current;

    wasAtBottomRef.current = isAtBottom;
    if (!isAtBottom || wasAtBottom) return;

    const settle = () => {
      if (isStuckRef.current) scrollToEnd("smooth");
    };

    settle();
    const frame = requestAnimationFrame(settle);

    return () => cancelAnimationFrame(frame);
  }, [isAtBottom, scrollToEnd]);

  return {hasOverflow, isAtBottom, scrollRef, scrollToBottom};
}
