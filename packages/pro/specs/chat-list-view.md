# Chat List View — clean-room implementation spec

Slug: `chat-list-view` · Docs: https://heroui.pro/docs/react/components/chat-list-view · Category: AI
Storybook (ours): `Pro/AI/ChatListView` · Pro storybook id: `pro-components-ai-chatlistview`
Import (Pro): `import {ChatListView} from "@heroui-pro/react";`

Sources used: the public docs text, the rendered DOM, CSSOM and computed styles of the two public demo
pages (light and dark), and runtime probing (pointer and keyboard). I did not open or try to get
around the paywalled example source.

---

## 1. Purpose

Thread rows for chat sidebars and conversation pickers ("recent chats"). Each row has an optional
leading icon, a title, an optional last-message preview and optional trailing metadata (date or
unread count). A `density` prop switches to a one-line compact row.

---

## 2. Anatomy

```tsx
<ChatListView aria-label="Recent chats">              // RAC GridList (List View base classes, secondary look)
  <ChatListView.Item textValue="Project planning">     // RAC GridListItem (role="row")
    <ChatListView.ItemContent>                         // div
      <ChatListView.Icon>{/* svg */}</ChatListView.Icon>   // optional
      <ChatListView.Text>
        <ChatListView.Title>Project planning</ChatListView.Title>
        <ChatListView.Preview>Last assistant reply</ChatListView.Preview>  // optional
      </ChatListView.Text>
      <ChatListView.Meta>2h</ChatListView.Meta>        // optional
    </ChatListView.ItemContent>
  </ChatListView.Item>
</ChatListView>
```

Rendered DOM (default demo, one row):

```html
<div data-slot="chat-list-view" class="list-view list-view--secondary chat-list-view chat-list-view--comfortable"
     data-rac role="grid" aria-label="Recent chats" tabindex="0" data-layout="stack" data-orientation="vertical">
  <div data-slot="chat-list-view-item" class="list-view__item" data-rac role="row" tabindex="-1"
       data-key="1" aria-label="<title> <preview>">
    <div role="gridcell" aria-colindex="1" style="display: contents;">       <!-- RAC GridListItem -->
      <div class="list-view__item-content" data-slot="chat-list-view-item-content">
        <div class="chat-list-view__icon" data-slot="chat-list-view-icon"><svg 16x16/></div>
        <div class="chat-list-view__text" data-slot="chat-list-view-text">
          <span class="list-view__title chat-list-view__title" data-slot="chat-list-view-title">…</span>
          <span class="list-view__description chat-list-view__preview" data-slot="chat-list-view-preview">…</span>
        </div>
        <div class="list-view__item-action chat-list-view__meta" data-slot="chat-list-view-meta">2h ago</div>
      </div>
    </div>
  </div>
</div>
```

| Part | Element | `data-slot` | Classes (Pro order) | Primitive |
|---|---|---|---|---|
| `ChatListView` (root) | `div[role=grid]` | `chat-list-view` | `list-view list-view--secondary chat-list-view chat-list-view--{comfortable\|compact}` | RAC `GridList` |
| `ChatListView.Item` | `div[role=row]` + RAC `gridcell` (display: contents) | `chat-list-view-item` | `list-view__item` | RAC `GridListItem` |
| `ChatListView.ItemContent` | `div` | `chat-list-view-item-content` | `list-view__item-content` | – |
| `ChatListView.Icon` | `div` | `chat-list-view-icon` | `chat-list-view__icon` | – |
| `ChatListView.Text` | `div` | `chat-list-view-text` | `chat-list-view__text` | – |
| `ChatListView.Title` | `span` | `chat-list-view-title` | `list-view__title chat-list-view__title` | – |
| `ChatListView.Preview` | `span` | `chat-list-view-preview` | `list-view__description chat-list-view__preview` | – |
| `ChatListView.Meta` | `div` | `chat-list-view-meta` | `list-view__item-action chat-list-view__meta` | – |

Notes
- Chat List View is the Pro **List View** in its `secondary` variant plus its own `chat-list-view*`
  classes. The `list-view*` classes and rules are owned by `list-view.css` (component `list-view`);
  Chat List View only reuses them.
- The `data-slot` values are the chat ones (`chat-list-view-item`, not `list-view-item`). Our
  `ListView` parts hard-code their own `data-slot`, so the remake renders RAC `GridList` /
  `GridListItem` directly with the List View class names instead of wrapping `ListView`.
- No selection cell, no `aria-selected`/`aria-multiselectable` in the demos (selectionMode none).
- The class order (`list-view list-view--secondary` + `chat-list-view …`, `list-view__title chat-list-view__title`,
  `list-view__item-action chat-list-view__meta`) is exactly what List View parts produce with an extra
  `className`, so Pro composes List View. List View prepends its selection cell (OSS `Checkbox`,
  `slot="selection"`) whenever `selectionMode !== "none"`, so the remake's `ChatListView.Item` does the
  same by reusing `ListViewSelectionCell` under a `secondary` `ListViewContext` (checkbox `primary`,
  `data-slot="list-view-selection-cell"`). The Pro demos (and their storybook stories, which ignore
  URL args) never enable selection, so this part is inferred rather than measured.
- The row `aria-label` comes from `textValue` (RAC). Default demo: `"<title> <preview>"`; compact
  demo: `"<title>"`. The docs anatomy passes `textValue` explicitly, so the remake keeps it a plain
  pass-through (string children are used as a fallback, as in our ListView).
- The `<template>` and `data-focus-scope-start/end` spans next to the root come from RAC (collection
  builder / GridList FocusScope), not from the component.

---

## 3. API (from docs)

| Part | Docs description | Remake props |
|---|---|---|
| `ChatListView` | "Root list container. Supports native div props." | All RAC `GridList` props (`aria-label`, `selectionMode`, `selectedKeys`, `onAction`, `items`, `disabledKeys`, `renderEmptyState`, `className` (string or render fn), `style`, …) + `density` + `ref` |
| `ChatListView.Item` | "Thread row. Supports native button/link composition depending on usage." | All RAC `GridListItem` props (`id`, `textValue`, `href` (link rows), `onAction`, `isDisabled`, …) + `ref` |
| `ChatListView.ItemContent` | "Row content wrapper for the icon, text, and metadata." | native `div` props |
| `ChatListView.Icon` | "Leading icon slot." | native `div` props |
| `ChatListView.Text` | "Title and preview column." | native `div` props |
| `ChatListView.Title` | "Thread title slot." | native `span` props |
| `ChatListView.Preview` | "Thread description or last-message preview slot." | native `span` props |
| `ChatListView.Meta` | "Optional metadata slot, such as date or unread counts." | native `div` props |

Root prop `density`: `"comfortable" | "compact"`, default `"comfortable"` ("Row density, from density";
classes `.chat-list-view--comfortable` / `.chat-list-view--compact`).

---

## 4. Styling

All rules live in `@layer components`. Pro CSSOM for the chat classes (authored again with `@apply`
in `css/components/chat-list-view.css`):

| Selector | Declarations | Tailwind |
|---|---|---|
| `.chat-list-view` | `width: 100%` | `w-full` |
| `.chat-list-view--comfortable` | (no rule) | default density |
| `.chat-list-view__icon` | `width/height: 4×spacing; color: var(--muted); flex-shrink: 0` | `size-4 shrink-0 text-muted` |
| `.chat-list-view__text` | `display: flex; flex-direction: column; min-width: 0` | `flex min-w-0 flex-col` |
| `.chat-list-view__title` | truncate; `text-sm`; `font-weight: medium`; `color: var(--foreground)` | `truncate text-sm font-medium text-foreground` |
| `.chat-list-view__preview` | truncate; `text-xs`; `color: var(--muted)` | `truncate text-xs text-muted` |
| `.chat-list-view__meta` | `color: var(--muted); flex-shrink: 0; margin-inline-start: auto; font-size: 11px` | `ms-auto shrink-0 text-[11px] text-muted` (11px is a literal in Pro) |
| `.chat-list-view--compact .chat-list-view__preview, .chat-list-view--compact .chat-list-view__meta` | `display: none` | `hidden` |

List View rules that apply (from `list-view.css`, owner `list-view`): `.list-view` (relative, w-full,
min-h-0, outline none); `.list-view__item` (flex, items-center, gap-3, px-4 py-3, text-sm, pointer
cursor, inset 2px `--focus` ring on focus-visible, disabled = status-disabled);
`.list-view--secondary .list-view__item` (transparent, `border-b` `separator-tertiary/50`, no border
on the last row, hover `bg-default/50` inside `@media (hover: hover)`, selected `bg-accent-soft`,
selected hover `bg-accent-soft-hover`); `.list-view__item-content` (flex, items-center, gap-3, flex-1,
min-w-0, `svg` → size-4 text-muted shrink-0); `.list-view__title` (same as chat title);
`.list-view__description` (adds `mt-0.5`); `.list-view__item-action` (ms-auto, shrink-0, `ps-2`).

The duplicated declarations don't conflict, so the order of `chat-list-view.css` and `list-view.css`
in `css/index.css` doesn't matter (Pro emits chat rules first; ours come after list-view).

### Measured (default demo, `w-[480px]` container squeezed to 419.86px by a 447px viewport)

| Element | Rect / value |
|---|---|
| row (with divider) | height 63px = 12 + 38 + 12 + 1px border; last row 62px |
| icon | 16×16 at row x + 16px, vertically centered (y + 23) |
| text column | height 38 = title 20 + preview margin 2 + preview 16 |
| title | 14px / 20px, weight 500, `--foreground` |
| preview | 12px / 16px, `--muted`, margin-top 2px |
| meta | 11px / 15.714px (inherits the row's `text-sm` line-height ratio 1.4286), `--muted`, padding-inline-start 8px |
| compact row | height 45 = 12 + 20 + 12 + 1 (preview and meta `display: none`) |

Colours: everything is token-based (`--foreground`, `--muted`, `--separator-tertiary` at 50%,
`--default` at 50% on hover, `--focus` ring). Dark mode only swaps tokens; no component-level
differences.

---

## 5. Behaviour

- Keyboard: RAC GridList. The root is the tab stop (`tabindex=0`), rows are roving (`tabindex=-1`);
  Arrow Up/Down move focus, Home/End jump, typeahead uses `textValue`. Keyboard focus sets
  `data-focused`, `data-focus-visible`, `data-focus-visible-within` → inset 2px focus ring.
- Pointer: clicking a row focuses it (`data-focused`, no ring). Without selection or actions RAC does
  not set `data-hovered`/`data-pressed`, so the hover background comes from `:hover` only.
- No transitions or animations (`getAnimations()` is empty; the row `transition` is the initial `all 0s`).
- Selection (not in the demos): `selectionMode="single" | "multiple"` adds the List View selection
  checkbox in front of the icon, `aria-selected`/`data-selected` and the `bg-accent-soft` row
  (`bg-accent-soft-hover` on hover); click/Space toggles. Try it with the `selectionMode` control.

---

## 6. Demos (Storybook exports)

| Pro demo | Story | Structure |
|---|---|---|
| `chat-list-view-default` | `Default` | `w-[480px]` container, 3 rows: comment icon, title, preview, meta (`2h ago` style); `textValue` = title + preview |
| `chat-list-view-compact` | `Compact` | `w-[280px]` container, `density="compact"`, the same rows; `textValue` = title |

Story content is our own (different thread titles, previews and dates). The demos' icon is a 16px
speech-bubble glyph; the stories use `gravity-ui:comment`.

Verification: with the Pro demo texts swapped into our story DOM (measurement only), every rect matched
exactly (root 419.86×188, rows 63/63/62, meta x 373.61, preview width 236.56; compact rows
280×45/45/44, title x 127.5). Hover background, focus ring and the keyboard attributes also matched.
Only the theme token values differ (for example the storybook `--muted` is the OSS value).
Review pass: all colours resolved to identical sRGB in light and dark (foreground 24,24,27 / 252,252,252;
muted 113,113,122 / 159,159,169; divider `separator-tertiary`/50 205,205,205,.5 / 60,60,64,.5; hover
`default`/50; focus ring 4,133,247), so the lab/oklch notation difference is cosmetic. Overriding
`--accent`, `--foreground`, `--muted` and `--font-sans` in the story reaches the ring, selection,
text and icons.

---

## 7. Dependencies

- `react-aria-components` (`GridList`, `GridListItem`), `tailwind-variants`.
- CSS: `list-view.css` (Pro List View base classes) must be loaded. It is part of `@heroui/pro/css`.
- No heavy optional peers → root export is fine.

## 8. Deviations

- Pro probably wraps its List View component; the remake renders RAC `GridList`/`GridListItem`
  directly with the same List View class names so the `chat-list-view-*` `data-slot`s are kept.
  The rendered DOM is the same.
- Selection cell behaviour is inferred from the List View composition (see Anatomy notes).
- `renderEmptyState` output is wrapped in `div.list-view__empty-state[data-slot="chat-list-view-empty-state"]`
  (same as our ListView); Pro's demos don't show an empty state.
