"use client";

import type {sidebarVariants} from "./sidebar.styles";

import {createContext, use, useEffect, useRef, useSyncExternalStore} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
export type SidebarSide = "left" | "right";
export type SidebarVariant = "sidebar" | "floating" | "inset";
export type SidebarCollapsible = "icon" | "offcanvas" | "none";
export type SidebarState = "expanded" | "collapsed";

/** Public value returned by `useSidebar()`. */
export interface UseSidebarReturn {
  /** Current desktop open/expanded state. */
  isOpen: boolean;
  /** Set the desktop open state. */
  setOpen: (open: boolean) => void;
  /** Whether the viewport is below Tailwind's `md` breakpoint (`width < 48rem`). */
  isMobile: boolean;
  /** Current mobile sheet open state (independent from desktop). */
  isMobileOpen: boolean;
  /** Set the mobile sheet open state. */
  setMobileOpen: (open: boolean) => void;
  /** Toggle the sidebar (desktop or mobile depending on the viewport). */
  toggleSidebar: () => void;
  /** Which side the sidebar is on. */
  side: SidebarSide;
  /** Current visual variant. */
  variant: SidebarVariant;
  /** Current collapse behavior. */
  collapsible: SidebarCollapsible;
  /** Resolved desktop state (`"expanded"` whenever `collapsible="none"`). */
  state: SidebarState;
}

/** Which way the icon rail is animating right now (`null` once the width transition is over). */
export type SidebarRailPhase = "collapsing" | "expanding" | null;

/** Length of the panel width transition (`--sidebar-duration`). */
export const SIDEBAR_RAIL_DURATION = 200;

export interface SidebarContextValue extends UseSidebarReturn {
  /** Disables nested `Sidebar.Menu` expand/collapse animations. */
  reduceMotion: boolean;
  slots: ReturnType<typeof sidebarVariants>;
}

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
export const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Internal: the icon rail phase, set for `SIDEBAR_RAIL_DURATION` ms after the desktop state flips.
 * Kept apart from `SidebarContext` so its reset only re-renders rows that have submenus.
 */
export const SidebarRailContext = createContext<SidebarRailPhase>(null);

/** Set by `Sidebar.Mobile` so descendants know they live inside the mobile sheet. */
export const SidebarMobileContext = createContext<{isInMobile: boolean; close: () => void}>({
  close: () => {},
  isInMobile: false,
});

/** Inherited menu settings (`Sidebar.Group` -> `Sidebar.Menu` -> `Sidebar.MenuItem`). */
export const SidebarMenuSettingsContext = createContext<{
  closeMobileOnAction?: boolean;
  reduceMotion?: boolean;
}>({});

/** Internal hook, throws a descriptive error outside `Sidebar.Provider`. */
export function useSidebarContext(): SidebarContextValue {
  const context = use(SidebarContext);

  if (!context) {
    throw new Error("Sidebar components must be rendered within <Sidebar.Provider>.");
  }

  return context;
}

/** Programmatic sidebar control. Must be used within `Sidebar.Provider`. */
export function useSidebar(): UseSidebarReturn {
  const {
    collapsible,
    isMobile,
    isMobileOpen,
    isOpen,
    setMobileOpen,
    setOpen,
    side,
    state,
    toggleSidebar,
    variant,
  } = useSidebarContext();

  return {
    collapsible,
    isMobile,
    isMobileOpen,
    isOpen,
    setMobileOpen,
    setOpen,
    side,
    state,
    toggleSidebar,
    variant,
  };
}

/* -------------------------------------------------------------------------------------------------
 * Mobile breakpoint (below Tailwind's `md`, i.e. `width < 48rem`)
 * -----------------------------------------------------------------------------------------------*/
const MOBILE_QUERY = "(width < 48rem)";

function subscribeToMobileQuery(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const query = window.matchMedia(MOBILE_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

function getMobileSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia?.(MOBILE_QUERY).matches;
}

const getServerMobileSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribeToMobileQuery, getMobileSnapshot, getServerMobileSnapshot);
}

/* -------------------------------------------------------------------------------------------------
 * Persisted state (`sidebar_state` cookie, written while uncontrolled)
 * -----------------------------------------------------------------------------------------------*/
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function writeSidebarCookie(open: boolean) {
  if (typeof document === "undefined") return;

  try {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  } catch {
    // Cookies can be blocked (sandboxed iframes, privacy settings); the state still works.
  }
}

/* -------------------------------------------------------------------------------------------------
 * Keyboard shortcut (`"mod+b"` by default)
 * -----------------------------------------------------------------------------------------------*/
type ParsedShortcut = {
  alt: boolean;
  ctrl: boolean;
  key: string;
  meta: boolean;
  mod: boolean;
  shift: boolean;
};

export function parseShortcut(combo: string): ParsedShortcut | null {
  // Split on "+" but keep a trailing "+" as the key itself (e.g. "mod++").
  const parts = combo
    .toLowerCase()
    .split(/\+(?!$)/)
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts.pop();

  if (!key) return null;

  const modifiers = new Set(parts);

  return {
    alt: modifiers.has("alt") || modifiers.has("option"),
    ctrl: modifiers.has("ctrl") || modifiers.has("control"),
    key,
    meta: modifiers.has("meta") || modifiers.has("cmd") || modifiers.has("command"),
    mod: modifiers.has("mod"),
    shift: modifiers.has("shift"),
  };
}

const CODE_ALIASES: Record<string, string> = {
  ",": "Comma",
  "-": "Minus",
  ".": "Period",
  "/": "Slash",
  ";": "Semicolon",
  "=": "Equal",
  "[": "BracketLeft",
  "\\": "Backslash",
  "]": "BracketRight",
  "`": "Backquote",
};

function matchesKey(event: KeyboardEvent, key: string) {
  if (event.key?.toLowerCase() === key) return true;

  // Fall back to the physical key so Option/Alt combos on macOS (which change `event.key`) match.
  if (/^[a-z]$/.test(key)) return event.code === `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return event.code === `Digit${key}`;

  return CODE_ALIASES[key] !== undefined && event.code === CODE_ALIASES[key];
}

export function matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut) {
  if (!matchesKey(event, shortcut.key)) return false;
  if (event.shiftKey !== shortcut.shift || event.altKey !== shortcut.alt) return false;

  if (shortcut.mod) {
    // `mod` is Cmd on macOS and Ctrl elsewhere; either modifier is accepted.
    if (!event.metaKey && !event.ctrlKey) return false;
    if (shortcut.ctrl && !event.ctrlKey) return false;
    if (shortcut.meta && !event.metaKey) return false;

    return true;
  }

  return event.ctrlKey === shortcut.ctrl && event.metaKey === shortcut.meta;
}

export function useSidebarShortcut(
  toggleShortcut: string | false | null | undefined,
  onToggle: () => void,
) {
  const handlerRef = useRef(onToggle);

  useEffect(() => {
    handlerRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    if (!toggleShortcut || typeof window === "undefined") return;

    const shortcut = parseShortcut(toggleShortcut);

    if (!shortcut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (!matchesShortcut(event, shortcut)) return;

      event.preventDefault();
      handlerRef.current();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleShortcut]);
}

/* -------------------------------------------------------------------------------------------------
 * Reduced motion helpers
 * -----------------------------------------------------------------------------------------------*/
export function prefersReducedMotion(element?: Element | null) {
  if (typeof window === "undefined") return true;
  if (element?.closest('[data-reduce-motion="true"]')) return true;

  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
