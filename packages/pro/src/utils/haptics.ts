"use client";

/**
 * Web haptics for touch devices.
 *
 * - Android / Chromium: the Vibration API (`navigator.vibrate`) with a short pattern per feedback type.
 * - iOS Safari (no Vibration API): toggling a hidden `<input type="checkbox" switch>` makes iOS 18+
 *   play its system selection haptic. One toggle is one tick, so patterns become 1-3 ticks.
 * - Everywhere else (desktop, older iOS) the call is a silent no-op.
 *
 * Browsers only allow haptics during or shortly after a user interaction (pointer, key, touch).
 * Components call `triggerHaptic` from their gesture handlers, which satisfies that requirement.
 */

export type HapticFeedbackType =
  "selection" | "light" | "soft" | "medium" | "rigid" | "heavy" | "success" | "warning" | "error";

const VIBRATION_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  error: [20, 50, 20, 50, 28],
  heavy: 28,
  light: 10,
  medium: 18,
  rigid: 22,
  selection: 8,
  soft: 12,
  success: [12, 60, 18],
  warning: [18, 80, 18],
};

const IOS_TICKS: Record<HapticFeedbackType, number> = {
  error: 3,
  heavy: 1,
  light: 1,
  medium: 1,
  rigid: 1,
  selection: 1,
  soft: 1,
  success: 2,
  warning: 2,
};

/** Gap between iOS ticks of a multi-tick pattern (ms). */
const IOS_TICK_GAP = 70;

let globallyEnabled = true;
let switchLabel: HTMLLabelElement | null = null;

const canVibrate = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const isAppleTouchDevice = (): boolean => {
  if (typeof navigator === "undefined") return false;

  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const getSwitchLabel = (): HTMLLabelElement | null => {
  if (typeof document === "undefined" || !document.body) return null;
  if (switchLabel?.isConnected) return switchLabel;

  const label = document.createElement("label");
  const input = document.createElement("input");

  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  label.setAttribute("aria-hidden", "true");
  label.setAttribute("data-haptics", "");
  label.style.cssText =
    "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;clip-path:inset(50%);";
  label.appendChild(input);
  document.body.appendChild(label);
  switchLabel = label;

  return label;
};

/** True when the current device can produce some form of haptic feedback. */
export const isHapticsSupported = (): boolean => canVibrate() || isAppleTouchDevice();

/** Globally turns haptics on or off (e.g. from an app setting). Defaults to on. */
export const setHapticsEnabled = (enabled: boolean): void => {
  globallyEnabled = enabled;
};

export const isHapticsEnabled = (): boolean => globallyEnabled;

/**
 * Plays a short haptic for `type`. Safe to call anywhere: it does nothing during SSR, on
 * unsupported devices or when haptics are globally disabled.
 */
export const triggerHaptic = (type: HapticFeedbackType = "selection"): void => {
  if (!globallyEnabled) return;

  try {
    if (canVibrate()) {
      navigator.vibrate(VIBRATION_PATTERNS[type]);

      return;
    }

    if (!isAppleTouchDevice()) return;

    const label = getSwitchLabel();

    if (!label) return;

    label.click();
    for (let tick = 1; tick < IOS_TICKS[type]; tick++) {
      window.setTimeout(() => label.click(), tick * IOS_TICK_GAP);
    }
  } catch {
    // Haptics are a progressive enhancement; never let them break an interaction.
  }
};
