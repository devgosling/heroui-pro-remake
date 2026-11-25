"use client";

import {createContext, use, useEffect} from "react";

import {useMediaQuery} from "../../hooks/use-media-query";

/**
 * Close triggers (Modal.CloseTrigger, AlertDialog.CloseTrigger) register with the surrounding
 * sheet presentation: an overlay that can be closed with an X can also be swiped away on mobile.
 */
export const SheetPresentationCloseContext = createContext<(() => () => void) | null>(null);

export function useRegisterSheetCloseTrigger() {
  const register = use(SheetPresentationCloseContext);

  useEffect(() => register?.(), [register]);
}

/** Below this width Modal and AlertDialog present as a bottom Sheet (Tailwind's `sm` breakpoint). */
export const SHEET_PRESENTATION_QUERY = "(max-width: 639.98px)";

/** How a dialog-like overlay presents itself on small screens. */
export type MobilePresentation = "sheet" | "dialog";

export type OverlayPresentation = "sheet" | "dialog";

export function useOverlayPresentation(
  mobilePresentation: MobilePresentation = "sheet",
): OverlayPresentation {
  const isSmallScreen = useMediaQuery(SHEET_PRESENTATION_QUERY);

  return mobilePresentation === "sheet" && isSmallScreen ? "sheet" : "dialog";
}
