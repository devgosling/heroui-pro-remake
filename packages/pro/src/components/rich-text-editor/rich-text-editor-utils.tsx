"use client";

import type {ReactElement, ReactNode} from "react";

import {Tooltip} from "@heroui/react";

/**
 * Wraps a control in an OSS Tooltip when tooltip content is provided. Toolbar tooltips open
 * without the global hover delay (like the original), so scanning the toolbar labels is instant.
 */
function withTooltip(control: ReactElement, tooltip: ReactNode) {
  if (tooltip === undefined || tooltip === null || tooltip === false) return control;

  return (
    <Tooltip delay={0}>
      {control}
      <Tooltip.Content>{tooltip}</Tooltip.Content>
    </Tooltip>
  );
}

/** Adds `https://` to bare hosts (`example.com`) and keeps explicit schemes, anchors and paths. */
function normalizeLinkHref(raw: string): string {
  const href = raw.trim();

  if (!href) return href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || /^[/#?]/.test(href)) return href;

  return `https://${href}`;
}

/**
 * Case-insensitive filter for suggestion items: matches the title or any keyword.
 * Returns every item for an empty query.
 */
function filterRichTextEditorSuggestionItems<TItem extends {title: string; keywords?: string[]}>(
  items: TItem[],
  query: string,
): TItem[] {
  const needle = query.trim().toLowerCase();

  if (!needle) return items;

  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      (item.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(needle)),
  );
}

export {filterRichTextEditorSuggestionItems, normalizeLinkHref, withTooltip};
