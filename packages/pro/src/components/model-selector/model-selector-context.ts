"use client";

import type {modelSelectorVariants} from "./model-selector.styles";
import type {ModelSelectorLabels, ModelSelectorModel} from "./model-selector.utils";

import {createContext, useCallback, useEffect, useMemo, useRef, useState} from "react";

/* -------------------------------------------------------------------------------------------------
 * Root context
 * -----------------------------------------------------------------------------------------------*/
export type ModelSelectorContextValue = {
  slots: ReturnType<typeof modelSelectorVariants>;
  models: readonly ModelSelectorModel[];
  modelMap: ReadonlyMap<string, ModelSelectorModel>;
  labels: ModelSelectorLabels;
  /** The selected model, read by the trigger, the effort slider and the detail card. */
  selectedModel?: ModelSelectorModel;
  /** The level the selected model uses right now. */
  effort?: string;
  /** Applies a level picked on the slider. */
  setEffort: (effort: string) => void;
};

export const ModelSelectorContext = createContext<ModelSelectorContextValue | null>(null);

/* -------------------------------------------------------------------------------------------------
 * Detail card controller (lives inside the open popover, so it resets on close)
 * -----------------------------------------------------------------------------------------------*/
/** Hover intent before the card opens from a pointer hover. */
export const DETAIL_SHOW_DELAY = 300;
/** Grace period so the pointer can travel from a row to the card. */
export const DETAIL_HIDE_DELAY = 150;

export type DetailState = {
  modelId: string | null;
  isVisible: boolean;
  /** The card moves from one row to the next instead of fading in. */
  isGliding: boolean;
};

export type DetailController = {
  /** The pointer entered a row. Leaving a row for a group title or a gap keeps the card. */
  hoverStart: (id: string) => void;
  /** The pointer left the list, which ends the hover intent and hides the card. */
  listLeave: () => void;
  /** A row left the list (for example filtered out by the search). */
  rowRemoved: (id: string) => void;
  setFocusVisible: (id: string, isFocusVisible: boolean) => void;
  cardEnter: () => void;
  cardLeave: () => void;
};

const HIDDEN: DetailState = {isGliding: false, isVisible: false, modelId: null};

export function useDetailController(): [DetailState, DetailController] {
  const [state, setState] = useState<DetailState>(HIDDEN);
  const isVisibleRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  const cardHoveredRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimers = useCallback(() => {
    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);
  }, []);

  const show = useCallback((id: string) => {
    const wasVisible = isVisibleRef.current;

    isVisibleRef.current = true;
    setState((prev) => ({
      isGliding: wasVisible && (prev.isGliding || prev.modelId !== id),
      isVisible: true,
      modelId: id,
    }));
  }, []);

  const hide = useCallback(() => {
    isVisibleRef.current = false;
    setState((prev) => (prev.isVisible ? {...prev, isGliding: false, isVisible: false} : prev));
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (hoveredRef.current || focusedRef.current || cardHoveredRef.current) return;
      hide();
    }, DETAIL_HIDE_DELAY);
  }, [hide]);

  const controller = useMemo<DetailController>(
    () => ({
      cardEnter: () => {
        cardHoveredRef.current = true;
        clearTimeout(hideTimerRef.current);
      },
      cardLeave: () => {
        cardHoveredRef.current = false;
        scheduleHide();
      },
      hoverStart: (id) => {
        hoveredRef.current = id;
        clearTimers();

        if (isVisibleRef.current) {
          show(id);

          return;
        }

        showTimerRef.current = setTimeout(() => {
          if (hoveredRef.current === id) show(id);
        }, DETAIL_SHOW_DELAY);
      },
      listLeave: () => {
        hoveredRef.current = null;
        clearTimeout(showTimerRef.current);
        if (!focusedRef.current) scheduleHide();
      },
      rowRemoved: (id) => {
        if (hoveredRef.current !== id) return;
        hoveredRef.current = null;
        clearTimeout(showTimerRef.current);
      },
      setFocusVisible: (id, isFocusVisible) => {
        if (isFocusVisible) {
          focusedRef.current = id;
          clearTimers();
          show(id);

          return;
        }

        if (focusedRef.current !== id) return;
        focusedRef.current = null;

        if (hoveredRef.current && isVisibleRef.current) show(hoveredRef.current);
        else if (!hoveredRef.current) scheduleHide();
      },
    }),
    [clearTimers, scheduleHide, show],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return [state, controller];
}

/* -------------------------------------------------------------------------------------------------
 * Popover context
 * -----------------------------------------------------------------------------------------------*/
export type ModelSelectorPopoverContextValue = {
  /** `ModelSelector.Search` is composed, so the popover is wrapped in an Autocomplete. */
  hasSearch: boolean;
  query: string;
  /** Models matching the query (all models without a query). */
  matchCount: number;
  detail: DetailController;
  detailState: DetailState;
};

export const ModelSelectorPopoverContext = createContext<ModelSelectorPopoverContextValue | null>(
  null,
);
