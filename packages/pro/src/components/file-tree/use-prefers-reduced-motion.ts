"use client";

import {useSyncExternalStore} from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether the user prefers reduced motion. Like Pro, the tree then renders flat rows (no motion
 * sections), exactly as with the `reduceMotion` prop. The server snapshot renders sections.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => typeof window !== "undefined" && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}
