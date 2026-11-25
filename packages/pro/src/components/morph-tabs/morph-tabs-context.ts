"use client";

import type {morphTabsVariants} from "./morph-tabs.styles";
import type {ReactNode} from "react";

import {createContext, use, useSyncExternalStore} from "react";

/* -------------------------------------------------------------------------------------------------
 * Progress (web stand-in for the Native Reanimated SharedValue)
 * -----------------------------------------------------------------------------------------------*/

/**
 * Continuous pager position in page units (0 = first page, 1.5 = halfway between the 2nd and 3rd).
 * It changes every animation frame without re-rendering React; read `.value` in event handlers,
 * subscribe for imperative updates or use `useMorphTabsProgress()` for a reactive number.
 */
export interface MorphTabsProgress {
  /** Current pager position (same as `get()`). */
  readonly value: number;
  /** Returns the current pager position. */
  get: () => number;
  /** Calls `listener` on every position change; returns an unsubscribe function. */
  subscribe: (listener: (value: number) => void) => () => void;
}

/** CSS custom property that carries the pager position on the root element. */
export const MORPH_TABS_PROGRESS_VAR = "--morph-tabs-progress";

export class MorphTabsProgressStore implements MorphTabsProgress {
  private current: number;
  private element: HTMLElement | null = null;
  private readonly listeners = new Set<(value: number) => void>();

  constructor(initial: number) {
    this.current = initial;
  }

  get value() {
    return this.current;
  }

  get = () => this.current;

  subscribe = (listener: (value: number) => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Moves the pager: writes the CSS custom property and notifies subscribers. */
  set(value: number) {
    if (value === this.current) return;
    this.current = value;
    this.element?.style.setProperty(MORPH_TABS_PROGRESS_VAR, String(value));
    this.listeners.forEach((listener) => listener(value));
  }

  /** Element (the MorphTabs root) that receives `--morph-tabs-progress`. */
  attach(element: HTMLElement | null) {
    this.element = element;
    element?.style.setProperty(MORPH_TABS_PROGRESS_VAR, String(this.current));
  }
}

/* -------------------------------------------------------------------------------------------------
 * Public context (useMorphTabs)
 * -----------------------------------------------------------------------------------------------*/
export interface MorphTabsContextValue {
  /** Selected page value (falls back to the first page). */
  value: string | undefined;
  /** Page values in pager order. */
  values: string[];
  /** Page index of `value` (-1 before any page registers). */
  selectedIndex: number;
  /** Continuous pager position, updated every frame during swipes and slides. */
  progress: MorphTabsProgress;
  /** Selects a page. `animated` defaults to the pager's `isPageAnimationEnabled`. */
  goTo: (value: string, animated?: boolean) => void;
  /** Page index of a value (-1 when unknown). */
  getIndex: (value: string) => number;
  /** Whether a page's content renders (always true unless `lazy`). */
  isMounted: (value: string) => boolean;
}

export const MorphTabsContext = createContext<MorphTabsContextValue | null>(null);

/**
 * Accesses the MorphTabs state. Must be used within a `MorphTabs` component.
 */
export const useMorphTabs = (): MorphTabsContextValue => {
  const context = use(MorphTabsContext);

  if (!context) {
    throw new Error("useMorphTabs must be used within a <MorphTabs> component.");
  }

  return context;
};

/**
 * Reactive pager position (page units). Re-renders the calling component on every frame of a
 * swipe or slide, so prefer CSS (`--morph-tabs-progress`) or `useMorphTabs().progress` for
 * per-frame visuals.
 */
export const useMorphTabsProgress = (): number => {
  const {progress} = useMorphTabs();

  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
};

/* -------------------------------------------------------------------------------------------------
 * Trigger context (useMorphTabsTrigger)
 * -----------------------------------------------------------------------------------------------*/
export interface MorphTabsTriggerContextValue {
  /** The trigger's page value. */
  value: string;
  /** Page index (-1 when no MorphTabs.Content matches). */
  index: number;
  /** Whether this trigger's page is selected. */
  isSelected: boolean;
  /** Whether the trigger is disabled. */
  isDisabled: boolean;
}

export const MorphTabsTriggerContext = createContext<MorphTabsTriggerContextValue | null>(null);

/**
 * Accesses the enclosing trigger's state. Must be used within a `MorphTabs.Trigger`.
 */
export const useMorphTabsTrigger = (): MorphTabsTriggerContextValue => {
  const context = use(MorphTabsTriggerContext);

  if (!context) {
    throw new Error("useMorphTabsTrigger must be used within a <MorphTabs.Trigger> component.");
  }

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Internal context (root <-> parts)
 * -----------------------------------------------------------------------------------------------*/
export type MorphTabsSelectSource = "press" | "keyboard" | "swipe" | "wheel" | "program";

export interface MorphTabsPagerConfig {
  isPageAnimationEnabled: boolean;
}

export interface MorphTabsInternalContextValue {
  slots: ReturnType<typeof morphTabsVariants>;
  /** `animation="disable-all"` on the root. */
  isAnimationDisabled: boolean;
  /** Text direction of the current locale. */
  direction: "ltr" | "rtl";
  getTriggerId: (value: string) => string;
  getContentId: (value: string) => string;
  /** Selects a page and plays the haptic when the change comes from the user. */
  select: (value: string, source: MorphTabsSelectSource, animated?: boolean) => void;
  /** Selects the page `delta` pages away from the selected one. */
  step: (delta: number, source: MorphTabsSelectSource) => void;
  /** Selects the page at `index`. */
  goToIndex: (index: number, animated?: boolean) => void;
  /** Called by the Pager with the values of its pages (in order). */
  registerValues: (values: string[] | null) => void;
  /** Root `renderLazyPlaceholder`. */
  renderLazyPlaceholder?: (value: string) => ReactNode;
  /** Called by the Pager with its animation settings. */
  setPagerConfig: (config: MorphTabsPagerConfig) => void;
  /** Gesture API used by the Pager. */
  drag: {
    getPosition: () => number;
    getPageCount: () => number;
    /** Stops a running slide so a new touch can catch the page. */
    stop: () => void;
    isAnimating: () => boolean;
    start: () => void;
    move: (position: number) => void;
    end: (target: number, velocity: number, onSettled?: () => void) => void;
  };
}

export const MorphTabsInternalContext = createContext<MorphTabsInternalContextValue | null>(null);
