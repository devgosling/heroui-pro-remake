"use client";

import {useLayoutEffect, useRef, useState} from "react";

/**
 * Keeps the action bar mounted while its exit transition runs.
 *
 * - Opening mounts the bar immediately; the enter transition comes from `@starting-style` in CSS.
 * - Closing keeps it mounted with `isExiting` (rendered as `data-exiting="true"`), waits for the
 *   element's running transitions to finish, then unmounts it.
 * - Re-opening during the exit drops `data-exiting`, so CSS reverses from the current value and
 *   the pending unmount is cancelled.
 * - Without running transitions (e.g. reduced motion) the bar unmounts right away.
 */
export function useActionBarPresence<T extends HTMLElement>(isOpen: boolean) {
  const ref = useRef<T>(null);
  const [isPresent, setIsPresent] = useState(isOpen);

  // Derived state update during render: mount as soon as `isOpen` turns true.
  if (isOpen && !isPresent) setIsPresent(true);

  const isExiting = isPresent && !isOpen;

  useLayoutEffect(() => {
    if (!isExiting) return;

    const node = ref.current;

    if (!node || typeof node.getAnimations !== "function") {
      setIsPresent(false);

      return;
    }

    let isCancelled = false;

    // `getAnimations()` flushes pending style changes, so the exit transitions started by
    // `data-exiting="true"` are already part of the list here.
    const animations = node.getAnimations();

    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!isCancelled) setIsPresent(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [isExiting]);

  return {isExiting, isPresent, ref};
}
