"use client";

import type {
  FABAlign,
  FABAutoAlign,
  FABAutoPlacement,
  FABItemsAppearance,
  FABLayoutRectangle,
  FABPlacement,
  FABValueStore,
} from "./fab-utils";
import type {fabVariants} from "./fab.styles";
import type {RefObject} from "react";

import {createContext, use, useSyncExternalStore} from "react";

/* -------------------------------------------------------------------------------------------------
 * Layout state (measured trigger / content, resolved placement)
 * -----------------------------------------------------------------------------------------------*/
export interface FABLayoutState {
  /** Measured trigger box (viewport coordinates). */
  triggerPosition: FABLayoutRectangle | null;
  /** Measured content box (relative to the portal layer). */
  contentLayout: FABLayoutRectangle | null;
  /** Resolved content placement. */
  placement: FABPlacement;
  /** Resolved content alignment. */
  align: FABAlign;
}

const isSameRect = (a: FABLayoutRectangle | null, b: FABLayoutRectangle | null) =>
  a === b ||
  (!!a && !!b && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height);

export const isSameLayout = (a: FABLayoutState, b: FABLayoutState) =>
  a.placement === b.placement &&
  a.align === b.align &&
  isSameRect(a.triggerPosition, b.triggerPosition) &&
  isSameRect(a.contentLayout, b.contentLayout);

/* -------------------------------------------------------------------------------------------------
 * Root context
 * -----------------------------------------------------------------------------------------------*/
export interface FABContextValue {
  /** Unique id of the FAB instance. */
  id: string;
  triggerId: string;
  contentId: string;
  isOpen: boolean;
  /** True while the close animation plays (the portal stays mounted). */
  isExiting: boolean;
  isDisabled: boolean;
  onOpenChange: (isOpen: boolean) => void;
  placement: FABAutoPlacement;
  align: FABAutoAlign;
  itemsAppearance: FABItemsAppearance;
  itemWindow: number;
  /** `animation="disable-all"` on the root. */
  isAllAnimationsDisabled: boolean;
  isHapticFeedbackEnabled?: boolean;
  isRTL: boolean;
  progressStore: FABValueStore<number>;
  layoutStore: FABValueStore<FABLayoutState>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Element the portal renders into (null = document.body / viewport). */
  portalContainerStore: FABValueStore<Element | null>;
  slots: ReturnType<typeof fabVariants>;
}

export const FABContext = createContext<FABContextValue | null>(null);

export const useFABContext = (part: string): FABContextValue => {
  const context = use(FABContext);

  if (!context) throw new Error(`<${part}> must be used within <FAB>.`);

  return context;
};

/* -------------------------------------------------------------------------------------------------
 * Portal context (the layer that hosts the overlay and content)
 * -----------------------------------------------------------------------------------------------*/
export interface FABPortalContextValue {
  layerRef: RefObject<HTMLDivElement | null>;
}

export const FABPortalContext = createContext<FABPortalContextValue | null>(null);

/* -------------------------------------------------------------------------------------------------
 * Item index context (provided by FAB.Content to each child so items can stagger)
 * -----------------------------------------------------------------------------------------------*/
export interface FABItemIndexContextValue {
  index: number;
  count: number;
}

export const FABItemIndexContext = createContext<FABItemIndexContextValue>({count: 1, index: 0});

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export const useFABLayout = (context: FABContextValue): FABLayoutState =>
  useSyncExternalStore(
    context.layoutStore.subscribe,
    context.layoutStore.get,
    context.layoutStore.get,
  );

export interface UseFABReturn {
  /** Whether the FAB is currently open. */
  isOpen: boolean;
  /** Changes the open state. */
  onOpenChange: (isOpen: boolean) => void;
  /** Measured trigger box in viewport coordinates (null until measured). */
  triggerPosition: FABLayoutRectangle | null;
  /** Measured content box relative to the portal layer (null until the content was shown). */
  contentLayout: FABLayoutRectangle | null;
  /** Resolved content placement. */
  placement: FABPlacement;
  /** Resolved content alignment. */
  align: FABAlign;
  /** Unique identifier of the FAB instance (Native: `nativeID`). */
  id: string;
}

/** Access the FAB root state. Works anywhere inside `<FAB>`, including inside `FAB.Portal`. */
export const useFAB = (): UseFABReturn => {
  const context = useFABContext("useFAB");
  const layout = useFABLayout(context);

  return {
    align: layout.align,
    contentLayout: layout.contentLayout,
    id: context.id,
    isOpen: context.isOpen,
    onOpenChange: context.onOpenChange,
    placement: layout.placement,
    triggerPosition: layout.triggerPosition,
  };
};

export interface UseFABAnimationReturn {
  /**
   * Shared open/close progress: 0 = idle/closed, 1 = open, 2 = close target (resets to 0 after
   * close). The component re-renders on every animation frame while it changes.
   */
  progress: number;
  /** Reads the current progress without subscribing (no re-render). */
  getProgress: () => number;
  /** Subscribes to progress changes (e.g. to write styles imperatively). Returns an unsubscribe. */
  subscribe: (listener: () => void) => () => void;
}

/** Access the shared open/close progress to build custom progress-driven parts. */
export const useFABAnimation = (): UseFABAnimationReturn => {
  const {progressStore} = useFABContext("useFABAnimation");
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.get,
    progressStore.get,
  );

  return {getProgress: progressStore.get, progress, subscribe: progressStore.subscribe};
};
