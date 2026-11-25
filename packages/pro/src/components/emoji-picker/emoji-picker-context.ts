"use client";

import type {EmojiPickerVariants, emojiPickerVariants} from "./emoji-picker.styles";
import type {Key} from "@heroui/react";
import type {RefObject} from "react";

import {createContext, use, useMemo} from "react";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
export type EmojiPickerSize = NonNullable<EmojiPickerVariants["size"]>;

/** What a mounted `EmojiPicker.Grid` exposes to the root (and through it to custom parts). */
export interface EmojiPickerGridApi {
  scrollToKey: (key: Key) => boolean;
  getCategoryKey: (category: string) => Key | undefined;
}

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
export interface EmojiPickerContextValue {
  size: EmojiPickerSize;
  slots: ReturnType<typeof emojiPickerVariants>;
  /** Skin tone applied by the built-in grid (`undefined` until a skin tone picker sets it). */
  skinTone: string | undefined;
  setSkinTone: (tone: string) => void;
  /** Recently picked emoji, most recent first. */
  recent: string[];
  /** The recent emoji a `showRecent` grid shows: a snapshot taken when the picker opens. */
  gridRecent: string[];
  addRecent: (emoji: string) => void;
  clearRecent: () => void;
  /** Registers the visible grid; returns the unregister function. */
  registerGrid: (api: EmojiPickerGridApi) => () => void;
  /** Scrolls the grid so the item with the given key is in the top row. */
  scrollToKey: (key: Key) => boolean;
  /** Scrolls the grid so the category's first emoji is in the top row. */
  scrollToCategory: (category: string) => boolean;
}

export const EmojiPickerContext = createContext<EmojiPickerContextValue | null>(null);

/** `true` inside `EmojiPicker.Popover` (the search field then takes focus on open). */
export const EmojiPickerPopoverContext = createContext(false);

export interface EmojiPickerContentContextValue {
  inputRef: RefObject<HTMLInputElement | null>;
}

export const EmojiPickerContentContext = createContext<EmojiPickerContentContextValue | null>(null);

export interface EmojiPickerSkinToneContextValue {
  value: string;
  select: (tone: string) => void;
}

export const EmojiPickerSkinToneContext = createContext<EmojiPickerSkinToneContextValue | null>(
  null,
);

/* -------------------------------------------------------------------------------------------------
 * useEmojiPicker
 * -----------------------------------------------------------------------------------------------*/
/**
 * Picker state for custom parts such as a category navigation in `EmojiPicker.Footer`:
 * skin tone, recent emoji and grid scrolling.
 */
export function useEmojiPicker() {
  const context = use(EmojiPickerContext);

  if (!context) throw new Error("useEmojiPicker must be used inside <EmojiPicker>.");

  const {clearRecent, recent, scrollToCategory, scrollToKey, setSkinTone, size, skinTone} = context;

  return useMemo(
    () => ({
      clearRecent,
      recent,
      scrollToCategory,
      scrollToKey,
      setSkinTone,
      size,
      skinTone: skinTone ?? "default",
    }),
    [clearRecent, recent, scrollToCategory, scrollToKey, setSkinTone, size, skinTone],
  );
}
