"use client";

import type {HapticFeedbackType} from "./haptics";

import {createContext, useCallback, useContext} from "react";

import {triggerHaptic} from "./haptics";

export interface HapticsContextValue {
  /** Whether components below play haptic feedback by default. */
  isEnabled: boolean;
}

export const HapticsContext = createContext<HapticsContextValue>({isEnabled: true});

/**
 * Returns a stable `haptic(type)` function for a component.
 *
 * `isEnabledProp` is the component's own `isHapticFeedbackEnabled` prop; when it is undefined the
 * nearest `HapticsProvider` decides (default: enabled).
 */
export const useHaptics = (isEnabledProp?: boolean) => {
  const {isEnabled: contextEnabled} = useContext(HapticsContext);
  const isEnabled = isEnabledProp ?? contextEnabled;

  const haptic = useCallback(
    (type: HapticFeedbackType = "selection") => {
      if (isEnabled) triggerHaptic(type);
    },
    [isEnabled],
  );

  return {haptic, isEnabled};
};
