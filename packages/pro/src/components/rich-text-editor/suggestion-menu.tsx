"use client";

import type {Editor, Range} from "@tiptap/react";
import type {SuggestionProps} from "@tiptap/suggestion";
import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {ListBox} from "@heroui/react";
import {PluginKey} from "@tiptap/pm/state";
import {Suggestion, exitSuggestion} from "@tiptap/suggestion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useId as useReactId,
  useRef,
  useState,
} from "react";
import {useId} from "react-aria/useId";
import {createPortal} from "react-dom";

import {useRichTextEditorContext} from "./rich-text-editor-context";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
interface RichTextEditorSuggestionCommandProps {
  editor: Editor;
  /** Document range of the trigger character plus the typed query. */
  range: Range;
}

/** Item shape rendered by the default suggestion menu. */
interface RichTextEditorSuggestionItem {
  /** Row title (also used for filtering and as the accessible text). */
  title: string;
  /** Secondary line under the title. */
  description?: ReactNode;
  /** Leading icon. */
  icon?: ReactNode;
  /** Extra search terms used by `filterRichTextEditorSuggestionItems`. */
  keywords?: string[];
  /** Runs when the item is selected. Usually deletes `range` and inserts content. */
  command?: (props: RichTextEditorSuggestionCommandProps) => void;
}

interface RichTextEditorSuggestionSelectProps<TItem> extends RichTextEditorSuggestionCommandProps {
  item: TItem;
}

interface RichTextEditorSuggestionMenuRenderProps<TItem> {
  editor: Editor;
  /** Items returned by the `items` loader for the current query. */
  items: TItem[];
  /** Text typed after the trigger character. */
  query: string;
  range: Range;
  /** Whether an async `items` loader is pending. */
  isLoading: boolean;
  /** Index of the row targeted by the arrow keys. */
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  /** Runs the selection for an item and closes the menu. */
  select: (item: TItem) => void;
  /** Closes the menu without selecting. */
  close: () => void;
}

interface RichTextEditorSuggestionMenuProps<TItem = RichTextEditorSuggestionItem> {
  /** Trigger character. @default "/" */
  char?: string;
  /** Suggestion item loader. */
  items: (props: {query: string; editor: Editor}) => TItem[] | Promise<TItem[]>;
  /** Custom renderer for complete menu control (ARIA wiring is then up to you). */
  children?: (props: RichTextEditorSuggestionMenuRenderProps<TItem>) => ReactNode;
  /** Selection handler for custom item shapes (replaces calling `item.command`). */
  onSelect?: (props: RichTextEditorSuggestionSelectProps<TItem>) => void;
  /** Stable ProseMirror plugin key. */
  pluginKey?: string | PluginKey;
  /** Allows spaces in the query. @default false */
  allowSpaces?: boolean;
  /** Prefixes allowed before the trigger. @default [" "] */
  allowedPrefixes?: string[] | null;
  /** Restricts matches to the start of a line. @default false */
  startOfLine?: boolean;
  /** Max menu height in pixels. @default 384 */
  maxHeight?: number;
  /** Accessible name of the default list. @default "Suggestions" */
  "aria-label"?: string;
  /** Default menu content when no item matches. @default "No results" */
  emptyContent?: ReactNode;
  /** Extra classes for the menu container. */
  className?: string;
  /** Extra styles for the menu container (position is managed by the menu). */
  style?: CSSProperties;
}

type ActiveSuggestion<TItem> = {
  items: TItem[];
  query: string;
  range: Range;
  isLoading: boolean;
  clientRect: SuggestionProps<TItem, TItem>["clientRect"];
  command: (item: TItem) => void;
};

/** Gap between the trigger text and the menu. */
const MENU_OFFSET = 8;

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const getItemKey = (item: unknown, index: number) => {
  const title =
    typeof item === "object" && item !== null && "title" in item
      ? String((item as {title: unknown}).title)
      : "item";

  return `${title}-${index}`;
};

/** Mirrors the option id scheme of React Aria's listbox (`<listId>-option-<key without spaces>`). */
const getOptionId = (listboxId: string, key: string) =>
  `${listboxId}-option-${key.replace(/\s*/g, "")}`;

/* -------------------------------------------------------------------------------------------------
 * RichTextEditor SuggestionMenu
 * -----------------------------------------------------------------------------------------------*/
function RichTextEditorSuggestionMenu<TItem = RichTextEditorSuggestionItem>({
  allowSpaces = false,
  allowedPrefixes = [" "],
  "aria-label": ariaLabel = "Suggestions",
  char = "/",
  children,
  className,
  emptyContent = "No results",
  items,
  maxHeight = 384,
  onSelect,
  pluginKey,
  startOfLine = false,
  style,
}: RichTextEditorSuggestionMenuProps<TItem>) {
  const {editor, slots} = useRichTextEditorContext();
  const autoKey = useReactId();
  const listboxId = useId();

  const [active, setActive] = useState<ActiveSuggestion<TItem> | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<{left: number; top: number} | null>(null);

  const itemsRef = useRef(items);
  const onSelectRef = useRef(onSelect);
  const activeRef = useRef(active);
  const highlightedRef = useRef(highlightedIndex);
  const prefixesRef = useRef(allowedPrefixes);
  const pluginKeyRef = useRef<PluginKey | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pointerHighlightRef = useRef(false);

  useLayoutEffect(() => {
    itemsRef.current = items;
    onSelectRef.current = onSelect;
    activeRef.current = active;
    highlightedRef.current = highlightedIndex;
    prefixesRef.current = allowedPrefixes;
  });

  const prefixesKey = allowedPrefixes === null ? "\u0000null" : allowedPrefixes.join("\u0000");
  const decorationClass = slots.suggestionDecoration();

  const updatePosition = useCallback((suggestion: ActiveSuggestion<TItem> | null) => {
    const rect = suggestion?.clientRect?.();

    setPosition(rect ? {left: rect.left, top: rect.bottom + MENU_OFFSET} : null);
  }, []);

  /* Register the Tiptap suggestion plugin -------------------------------------------------------*/
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const key =
      typeof pluginKey === "object"
        ? pluginKey
        : new PluginKey(pluginKey ?? `rich-text-editor-suggestion-${autoKey}`);

    pluginKeyRef.current = key;

    const sync = (props: SuggestionProps<TItem, TItem>, isStart: boolean) => {
      const previous = activeRef.current;
      const next: ActiveSuggestion<TItem> = {
        clientRect: props.clientRect,
        command: props.command,
        isLoading: props.loading,
        items: props.items,
        query: props.query,
        range: props.range,
      };

      activeRef.current = next;
      setActive(next);
      updatePosition(next);

      if (isStart || previous?.query !== props.query) {
        highlightedRef.current = 0;
        setHighlightedIndex(0);
      } else if (highlightedRef.current > Math.max(props.items.length - 1, 0)) {
        highlightedRef.current = Math.max(props.items.length - 1, 0);
        setHighlightedIndex(highlightedRef.current);
      }
    };

    const plugin = Suggestion<TItem, TItem>({
      allowSpaces,
      allowedPrefixes: prefixesRef.current,
      char,
      command: ({editor: instance, props: item, range}) => {
        const handler = onSelectRef.current;

        if (handler) handler({editor: instance, item, range});
        else (item as RichTextEditorSuggestionItem).command?.({editor: instance, range});
      },
      decorationClass,
      editor,
      items: ({editor: instance, query}) => itemsRef.current({editor: instance, query}),
      pluginKey: key,
      render: () => ({
        onExit: () => {
          activeRef.current = null;
          setActive(null);
          setPosition(null);
        },
        onKeyDown: ({event}) => {
          const current = activeRef.current;

          if (!current) return false;

          const count = current.items.length;

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (count > 0) {
              const delta = event.key === "ArrowDown" ? 1 : -1;
              const next = Math.min(Math.max(highlightedRef.current + delta, 0), count - 1);

              highlightedRef.current = next;
              setHighlightedIndex(next);
            }

            return true;
          }

          if (event.key === "Enter") {
            const item = current.items[highlightedRef.current];

            if (item === undefined) return false;
            current.command(item);

            return true;
          }

          return false;
        },
        onStart: (props) => sync(props, true),
        onUpdate: (props) => sync(props, false),
      }),
      startOfLine,
    });

    // Prepend so Enter / arrow keys reach the menu before the default keymaps (split block, lists).
    editor.registerPlugin(plugin, (next, plugins) => [next, ...plugins]);

    return () => {
      if (!editor.isDestroyed) editor.unregisterPlugin(key);
      pluginKeyRef.current = null;
    };
    // `prefixesKey` stands in for the `allowedPrefixes` array identity.
  }, [
    editor,
    pluginKey,
    autoKey,
    char,
    allowSpaces,
    prefixesKey,
    startOfLine,
    decorationClass,
    updatePosition,
  ]);

  /* Keep the menu anchored while the page scrolls or resizes ------------------------------------*/
  const isOpen = active !== null;

  useEffect(() => {
    if (!isOpen) return;

    const handle = () => updatePosition(activeRef.current);

    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);

    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [isOpen, updatePosition]);

  /* Keys and ARIA wiring for the default list ---------------------------------------------------*/
  const keyedItems = useMemo(
    () => (active?.items ?? []).map((item, index) => ({item, key: getItemKey(item, index)})),
    [active?.items],
  );

  const highlightedKey = keyedItems[highlightedIndex]?.key;
  const usesDefaultList = !children;

  // Keep the highlighted row visible inside the scrollable list (nearest edge, like the original).
  // Rows highlighted by the pointer are already under it, so only keyboard / query changes scroll.
  useLayoutEffect(() => {
    const list = listRef.current;

    if (pointerHighlightRef.current) {
      pointerHighlightRef.current = false;

      return;
    }
    if (!list || !highlightedKey) return;

    const option = list.ownerDocument.getElementById(getOptionId(listboxId, highlightedKey));

    if (!option || !list.contains(option)) return;

    const listRect = list.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();
    const top = listRect.top + list.clientTop;
    const bottom = top + list.clientHeight;

    if (optionRect.top < top) list.scrollTop -= top - optionRect.top;
    else if (optionRect.bottom > bottom) list.scrollTop += optionRect.bottom - bottom;
  }, [highlightedKey, listboxId]);

  useEffect(() => {
    const dom = editor && !editor.isDestroyed ? editor.view.dom : null;

    if (!dom || !isOpen || !usesDefaultList) return;

    dom.setAttribute("aria-autocomplete", "list");
    dom.setAttribute("aria-controls", listboxId);

    if (highlightedKey)
      dom.setAttribute("aria-activedescendant", getOptionId(listboxId, highlightedKey));
    else dom.removeAttribute("aria-activedescendant");

    return () => {
      dom.removeAttribute("aria-autocomplete");
      dom.removeAttribute("aria-controls");
      dom.removeAttribute("aria-activedescendant");
    };
  }, [editor, highlightedKey, isOpen, listboxId, usesDefaultList]);

  const select = useCallback((item: TItem) => activeRef.current?.command(item), []);

  const close = useCallback(() => {
    if (editor && !editor.isDestroyed && pluginKeyRef.current) {
      exitSuggestion(editor.view, pluginKeyRef.current);
    }
  }, [editor]);

  if (!editor || !active || !position || typeof document === "undefined") return null;

  const content = children ? (
    // eslint-disable-next-line react-hooks/refs -- `select` and `close` only read refs when the render prop invokes them from event handlers, never while rendering.
    children({
      close,
      editor,
      highlightedIndex,
      isLoading: active.isLoading,
      items: active.items,
      query: active.query,
      range: active.range,
      select,
      setHighlightedIndex,
    })
  ) : (
    <ListBox
      ref={listRef}
      aria-label={ariaLabel}
      className={slots.suggestionMenuList()}
      data-slot="rich-text-editor-suggestion-menu-list"
      // Rows render from the highlight state, so it must invalidate React Aria's item cache.
      dependencies={[highlightedIndex]}
      id={listboxId}
      items={keyedItems}
      renderEmptyState={() => (
        <div
          className={slots.suggestionMenuEmpty()}
          data-slot="rich-text-editor-suggestion-menu-empty"
        >
          {emptyContent}
        </div>
      )}
      onAction={(key) => {
        const entry = keyedItems.find((candidate) => candidate.key === key);

        if (entry) select(entry.item);
      }}
    >
      {({item, key}) => {
        const data = item as RichTextEditorSuggestionItem;
        const index = keyedItems.findIndex((candidate) => candidate.key === key);
        const isHighlighted = index === highlightedIndex;

        return (
          <ListBox.Item
            className={slots.suggestionMenuItem()}
            data-highlighted={isHighlighted ? "true" : undefined}
            data-slot="rich-text-editor-suggestion-menu-item"
            id={key}
            textValue={data.title}
            render={(domProps) => (
              <div
                {...(domProps as ComponentPropsWithRef<"div">)}
                aria-selected={isHighlighted ? "true" : undefined}
              />
            )}
            onHoverStart={() => {
              if (highlightedRef.current === index) return;
              pointerHighlightRef.current = true;
              highlightedRef.current = index;
              setHighlightedIndex(index);
            }}
          >
            {data.icon ? (
              <span
                className={slots.suggestionMenuIcon()}
                data-slot="rich-text-editor-suggestion-menu-icon"
              >
                {data.icon}
              </span>
            ) : null}
            <span
              className={slots.suggestionMenuItemContent()}
              data-slot="rich-text-editor-suggestion-menu-item-content"
            >
              <span
                className={slots.suggestionMenuTitle()}
                data-slot="rich-text-editor-suggestion-menu-title"
              >
                {data.title}
              </span>
              {data.description ? (
                <span
                  className={slots.suggestionMenuDescription()}
                  data-slot="rich-text-editor-suggestion-menu-description"
                >
                  {data.description}
                </span>
              ) : null}
            </span>
          </ListBox.Item>
        );
      }}
    </ListBox>
  );

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mousedown is only prevented to keep the caret in the editor; the menu is driven by the editor's keyboard handling and the listbox, and the DOM mirrors the original.
    <div
      className={slots.suggestionMenu({className})}
      data-react-aria-top-layer=""
      data-slot="rich-text-editor-suggestion-menu"
      style={{
        ...style,
        left: position.left,
        maxHeight,
        position: "fixed",
        top: position.top,
        zIndex: "var(--z-index-overlay)",
      }}
      // Keep the caret (and focus) in the editor while the pointer interacts with the menu.
      onMouseDown={(event) => event.preventDefault()}
    >
      {content}
    </div>,
    document.body,
  );
}

RichTextEditorSuggestionMenu.displayName = "HeroUI.RichTextEditor.SuggestionMenu";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {RichTextEditorSuggestionMenu};

export type {
  RichTextEditorSuggestionItem,
  RichTextEditorSuggestionCommandProps,
  RichTextEditorSuggestionSelectProps,
  RichTextEditorSuggestionMenuProps,
  RichTextEditorSuggestionMenuRenderProps,
};
