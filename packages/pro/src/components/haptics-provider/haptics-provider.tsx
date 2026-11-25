"use client";

import type {ReactNode} from "react";

import {useMemo} from "react";

import {HapticsContext} from "../../utils/use-haptics";

export interface HapticsProviderProps {
  children?: ReactNode;
  /**
   * Whether components below play haptic feedback (vibration on Android, system ticks on iOS 18+).
   * A component's own `isHapticFeedbackEnabled` prop wins over this value.
   * @default true
   */
  isEnabled?: boolean;
}

/**
 * Sets the default haptic feedback for all HeroUI Pro gesture components below it
 * (SlideButton, WheelPicker, SwipeableRow, NumberPad, ...).
 */
export const HapticsProvider = ({children, isEnabled = true}: HapticsProviderProps) => {
  const value = useMemo(() => ({isEnabled}), [isEnabled]);

  return <HapticsContext value={value}>{children}</HapticsContext>;
};

HapticsProvider.displayName = "HeroUI.HapticsProvider";
