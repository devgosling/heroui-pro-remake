"use client";

import type {appLayoutVariants} from "./app-layout.styles";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
export type AppLayoutScrollMode = "page" | "content";
export type AppLayoutAsideMobile = "hidden" | "sheet";

/** Public value returned by `useAppLayout()`. */
export interface UseAppLayoutReturn {
  /** Whether the aside panel is currently open (the mobile sheet below `lg` with `asideMobile="sheet"`). */
  isAsideOpen: boolean;
  /** Set the aside open state. */
  setAsideOpen: (open: boolean) => void;
  /** Toggle the aside open / closed. */
  toggleAside: () => void;
}

export interface AppLayoutContextValue extends UseAppLayoutReturn {
  /** How the aside behaves below the `lg` breakpoint. */
  asideMobile: AppLayoutAsideMobile;
  /** Whether an `aside` was passed to the layout. */
  hasAside: boolean;
  /** Whether the viewport is below Tailwind's `lg` breakpoint (`width < 64rem`). */
  isBelowLg: boolean;
  slots: ReturnType<typeof appLayoutVariants>;
}

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

/** Internal hook, throws a descriptive error outside `AppLayout`. */
export function useAppLayoutContext(component: string): AppLayoutContextValue {
  const context = use(AppLayoutContext);

  if (!context) {
    throw new Error(`<AppLayout.${component}> must be rendered within <AppLayout>.`);
  }

  return context;
}

/**
 * Reads and mutates the aside state from inside `AppLayout`'s children.
 * Returns `null` outside of an `AppLayout`. For the sidebar, use `useSidebar()`.
 */
export function useAppLayout(): UseAppLayoutReturn | null {
  const context = use(AppLayoutContext);

  if (!context) return null;

  const {isAsideOpen, setAsideOpen, toggleAside} = context;

  return {isAsideOpen, setAsideOpen, toggleAside};
}

/* -------------------------------------------------------------------------------------------------
 * Breakpoints (Tailwind `md` = 48rem, `lg` = 64rem)
 * -----------------------------------------------------------------------------------------------*/
export const MOBILE_QUERY = "(width < 48rem)";
export const BELOW_LG_QUERY = "(width < 64rem)";

const getServerSnapshot = () => false;

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};

      const list = window.matchMedia(query);

      list.addEventListener("change", onChange);

      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => typeof window !== "undefined" && !!window.matchMedia?.(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* -------------------------------------------------------------------------------------------------
 * Persisted aside state (`aside_state` cookie, written while uncontrolled)
 * -----------------------------------------------------------------------------------------------*/
export const ASIDE_COOKIE_NAME = "aside_state";
const ASIDE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function writeAsideCookie(open: boolean) {
  if (typeof document === "undefined") return;

  try {
    document.cookie = `${ASIDE_COOKIE_NAME}=${open}; path=/; max-age=${ASIDE_COOKIE_MAX_AGE}`;
  } catch {
    // Cookies can be blocked (sandboxed iframes, privacy settings); the state still works.
  }
}

/** Controlled / uncontrolled desktop aside state. Writes `aside_state` while uncontrolled. */
export function useAsideState(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const isOpenRef = useRef(isOpen);

  // eslint-disable-next-line react-hooks/refs -- latest-value ref for the stable public setter (useAppLayout().setAsideOpen); descendants may call it from their own layout effects, which run before this hook's effects, so it is assigned during render to keep the dedupe check current
  isOpenRef.current = isOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === isOpenRef.current) return;
      if (!isControlled) {
        setUncontrolledOpen(next);
        writeAsideCookie(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return [isOpen, setOpen] as const;
}

/* -------------------------------------------------------------------------------------------------
 * Keyboard shortcut (same combo syntax as `Sidebar.Provider`'s `toggleShortcut`:
 * "mod+.", "shift+?", "ctrl+alt+k"; `mod` is Cmd on macOS and Ctrl elsewhere)
 * -----------------------------------------------------------------------------------------------*/
type ParsedShortcut = {
  alt: boolean;
  ctrl: boolean;
  key: string;
  meta: boolean;
  mod: boolean;
  shift: boolean;
};

function parseShortcut(combo: string): ParsedShortcut | null {
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

/** Physical keys for punctuation, so layouts / modifiers that change `event.key` still match. */
const PUNCTUATION_CODES: Record<string, string> = {
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
  if (/^[a-z]$/.test(key)) return event.code === `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return event.code === `Digit${key}`;

  return PUNCTUATION_CODES[key] !== undefined && event.code === PUNCTUATION_CODES[key];
}

function matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut) {
  if (!matchesKey(event, shortcut.key)) return false;
  if (event.shiftKey !== shortcut.shift || event.altKey !== shortcut.alt) return false;

  if (shortcut.mod) {
    if (!event.metaKey && !event.ctrlKey) return false;
    if (shortcut.ctrl && !event.ctrlKey) return false;
    if (shortcut.meta && !event.metaKey) return false;

    return true;
  }

  return event.ctrlKey === shortcut.ctrl && event.metaKey === shortcut.meta;
}

/** Binds a global keyboard combo to `onTrigger`; `false` / `null` / `undefined` disables it. */
export function useKeyboardShortcut(
  combo: string | false | null | undefined,
  onTrigger: () => void,
) {
  const handlerRef = useRef(onTrigger);

  useEffect(() => {
    handlerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!combo || typeof window === "undefined") return;

    const shortcut = parseShortcut(combo);

    if (!shortcut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (!matchesShortcut(event, shortcut)) return;

      event.preventDefault();
      handlerRef.current();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo]);
}
