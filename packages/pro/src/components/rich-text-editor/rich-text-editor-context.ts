"use client";

import type {RichTextEditorVariants} from "./rich-text-editor.styles";
import type {Editor} from "@tiptap/react";

import {useEditorState} from "@tiptap/react";
import {createContext, use} from "react";

import {richTextEditorVariants} from "./rich-text-editor.styles";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
type RichTextEditorContextValue = {
  /** The Tiptap editor instance (`null` until it has mounted on the client). */
  editor: Editor | null;
  isDisabled: boolean;
  isReadOnly: boolean;
  maxLength?: number;
  variant: NonNullable<RichTextEditorVariants["variant"]>;
  slots: ReturnType<typeof richTextEditorVariants>;
};

const RichTextEditorContext = createContext<RichTextEditorContextValue | null>(null);

const FALLBACK_SLOTS = richTextEditorVariants();

/** Internal: the full context, with safe fallbacks when a part is rendered outside the root. */
const useRichTextEditorContext = (): RichTextEditorContextValue =>
  use(RichTextEditorContext) ?? {
    editor: null,
    isDisabled: false,
    isReadOnly: false,
    slots: FALLBACK_SLOTS,
    variant: "primary",
  };

/* -------------------------------------------------------------------------------------------------
 * Public hooks
 * -----------------------------------------------------------------------------------------------*/
interface UseRichTextEditorReturn {
  /** The Tiptap editor instance of the nearest `RichTextEditor` (`null` before mount). */
  editor: Editor | null;
  /** Whether the editor is disabled. */
  isDisabled: boolean;
  /** Whether the editor is read-only (focusable, not editable). */
  isReadOnly: boolean;
  /** The character limit used by `RichTextEditor.CharacterCount`. */
  maxLength?: number;
}

/** Returns the editor instance and its state flags from the nearest `RichTextEditor`. */
function useRichTextEditor(): UseRichTextEditorReturn {
  const {editor, isDisabled, isReadOnly, maxLength} = useRichTextEditorContext();

  return {editor, isDisabled, isReadOnly, maxLength};
}

/** Snapshot passed to `useRichTextEditorState` selectors (same shape as Tiptap's `useEditorState`). */
interface RichTextEditorStateSnapshot {
  editor: Editor;
  /** Number of transactions applied since the editor was created. */
  transactionNumber: number;
}

/**
 * Subscribes to a slice of the editor state. The component only re-renders when the selected value
 * changes (compared with `equalityFn`, deep equality by default), not on every transaction.
 * The selector is not called while the editor has not mounted yet; the hook returns `null` then.
 */
function useRichTextEditorState<TSelected>(
  selector: (snapshot: RichTextEditorStateSnapshot) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected | null) => boolean,
): TSelected | null {
  const {editor} = useRichTextEditorContext();

  return useEditorState<TSelected | null>({
    editor,
    equalityFn: equalityFn as ((a: TSelected | null, b: TSelected | null) => boolean) | undefined,
    selector: ({editor: instance, transactionNumber}) =>
      instance ? selector({editor: instance, transactionNumber}) : null,
  });
}

export {RichTextEditorContext, useRichTextEditor, useRichTextEditorContext, useRichTextEditorState};

export type {RichTextEditorContextValue, RichTextEditorStateSnapshot, UseRichTextEditorReturn};
