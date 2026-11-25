"use client";

import type {MorphButtonAnimatedValue, MorphSize} from "./morph-button-spring";
import type {morphButtonVariants} from "./morph-button.styles";
import type {RefObject} from "react";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

/** Logical direction the surface grows toward. `start` / `end` mirror in RTL. */
export type MorphButtonDirection =
  "top" | "top-end" | "end" | "bottom-end" | "bottom" | "bottom-start" | "start" | "top-start";

/** Surface color scheme. */
export type MorphButtonVariant = "primary" | "secondary";

export interface MorphButtonContextValue {
  /** Whether the button is expanded. */
  isOpen: boolean;
  /** Logical direction the surface grows toward. */
  direction: MorphButtonDirection;
  /** Visual variant applied to the surface. */
  variant: MorphButtonVariant;
  /** Whether the toggle interaction is disabled. */
  isDisabled: boolean;
  /** Measured natural width of the collapsed content (0 until measured). */
  collapsedWidth: number;
  /** Measured natural height of the collapsed content (0 until measured). */
  collapsedHeight: number;
  /** Measured natural width of the expanded content (0 until measured). */
  expandedWidth: number;
  /** Measured natural height of the expanded content (0 until measured). */
  expandedHeight: number;
  /** Current animated width of the morphing surface (read `.value`; updates every frame). */
  surfaceWidth: MorphButtonAnimatedValue;
  /** Current animated height of the morphing surface (read `.value`; updates every frame). */
  surfaceHeight: MorphButtonAnimatedValue;
  /** Programmatically expand the button. */
  open: () => void;
  /** Programmatically collapse the button. */
  close: () => void;
  /** Programmatically toggle the open state. */
  toggle: () => void;
}

/** Wiring between the root and its parts. Not part of the public API. */
export interface MorphButtonInternalContextValue {
  slots: ReturnType<typeof morphButtonVariants>;
  isOpen: boolean;
  isDisabled: boolean;
  /** Root `animation="disable-all"`: the content parts snap as well. */
  isAllAnimationDisabled: boolean;
  triggerId: string;
  panelId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  setCollapsedSize: (size: MorphSize) => void;
  setExpandedSize: (size: MorphSize) => void;
  /** Toggle requested by a press on the collapsed content (plays the expand haptic). */
  pressTrigger: () => void;
  close: () => void;
}

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
export const MorphButtonContext = createContext<MorphButtonContextValue | null>(null);

export const MorphButtonInternalContext = createContext<MorphButtonInternalContextValue | null>(
  null,
);

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/

/** Access the morph button state and actions. Must be used within a `MorphButton`. */
export const useMorphButton = (): MorphButtonContextValue => {
  const context = use(MorphButtonContext);

  if (!context) throw new Error("useMorphButton must be used within a MorphButton component.");

  return context;
};

export const useMorphButtonInternal = (part: string): MorphButtonInternalContextValue => {
  const context = use(MorphButtonInternalContext);

  if (!context) throw new Error(`MorphButton.${part} must be rendered inside a MorphButton.`);

  return context;
};
