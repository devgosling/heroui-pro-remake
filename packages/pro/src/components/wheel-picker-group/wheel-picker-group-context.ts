"use client";

import type {WheelPickerGroupContextValue} from "../wheel-picker/wheel-picker-context";

import {use} from "react";

import {WheelPickerGroupContext} from "../wheel-picker/wheel-picker-context";

/* -------------------------------------------------------------------------------------------------
 * Shared types
 * -----------------------------------------------------------------------------------------------*/

/**
 * Values record exchanged with the group through `values`, `defaultValues`, `onValuesChange` and
 * `onValuesCommit`: one entry per nested wheel, keyed by the wheel's `name`. The value type is
 * `unknown` so wheels of different types can share one record.
 */
export type WheelPickerGroupValues = Record<string, unknown>;

/**
 * The group has no animated styles of its own: `"disable-all"` cascades to every nested wheel (rows
 * stop fading / scaling and every scroll settles instantly), `undefined` keeps the defaults.
 */
export type WheelPickerGroupRootAnimation = "disable-all" | undefined;

export type WheelPickerGroupIndicatorSlots = "wrapper" | "highlight";

export type WheelPickerGroupMaskSlots = "top" | "bottom";

/* -------------------------------------------------------------------------------------------------
 * Hook
 * -----------------------------------------------------------------------------------------------*/

/**
 * Hook to access the WheelPickerGroup context (shared layout, the values record and the scroll
 * state of the nested wheels). Must be used within a `WheelPickerGroup`.
 */
export const useWheelPickerGroup = (): WheelPickerGroupContextValue => {
  const context = use(WheelPickerGroupContext);

  if (!context) {
    throw new Error("useWheelPickerGroup must be used within a WheelPickerGroup component.");
  }

  return context;
};
