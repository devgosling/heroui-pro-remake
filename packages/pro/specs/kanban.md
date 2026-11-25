# Kanban — clean-room implementation spec

Slug: `kanban` · Docs: https://heroui.pro/docs/react/components/kanban · Storybook title: `Pro/DataDisplay/Kanban`
Import (Pro): `import {Kanban, useKanban, useKanbanCardPlaceholder, useKanbanColumn} from "@heroui-pro/react";`

Sources: the public docs text, the rendered DOM / CSSOM / computed styles of the four public demo
pages (light + dark), runtime probing (mouse drag through the browser, synthetic HTML5 drag events,
keyboard, MutationObserver timings of the card motion), and the RAC 1.22 sources in this repo to tell
RAC internals apart from Pro code. The paywalled example source was not opened.

---

## 1. Purpose

A drag-and-drop board. Columns are RAC `GridList`s that share one `useListData` list. Cards are
`GridListItem`s, so you can drag them by pointer, keyboard (with a drag handle) and screen reader,
within a column and across columns. Cards glide to new positions with a spring layout animation.

## 2. Anatomy

```tsx
const kanban = useKanban({initialItems, getColumn, setColumn});
const {renderDropIndicator} = useKanbanCardPlaceholder({
  renderIndicator: (target) => <Kanban.DropIndicator target={target} />, // optional
});
const {items, dragAndDropHooks} = useKanbanColumn(kanban, "todo", {renderDropIndicator});

<Kanban>                                   // OSS ScrollShadow orientation="horizontal"
  <Kanban.Column>                          // <section>
    <Kanban.ColumnHeader>                  // <header>
      <Kanban.ColumnIndicator />           // <span> dot (empty) or icon box
      <Kanban.ColumnTitle>To do</Kanban.ColumnTitle>   // <h3>
      <Kanban.ColumnCount>{items.length}</Kanban.ColumnCount>  // <span>
      <Kanban.ColumnActions>…</Kanban.ColumnActions>   // <div>, hover reveal
    </Kanban.ColumnHeader>
    <Kanban.ColumnBody>                    // <div> tinted rounded container
      <Kanban.ScrollShadow className="max-h-[600px]">  // OSS ScrollShadow vertical (optional)
        <Kanban.CardList aria-label="To do" dragAndDropHooks={dragAndDropHooks} items={items}>
          {(item) => (
            <Kanban.Card textValue={item.title}>   // RAC GridListItem
              <Kanban.DragHandle />               // optional, RAC Button slot="drag"
              …
            </Kanban.Card>
          )}
        </Kanban.CardList>
      </Kanban.ScrollShadow>
      <div className="p-2"><Button fullWidth variant="outline">Add a task</Button></div>
    </Kanban.ColumnBody>
  </Kanban.Column>
</Kanban>
```

Rendered DOM (default demo, the `data-rac`, `id` and `aria-*` noise is trimmed):

```html
<div class="scroll-shadow scroll-shadow--horizontal scroll-shadow--fade kanban kanban--md"
     data-slot="kanban" data-orientation="horizontal" data-scroll-shadow-mode="auto" …>
  <section class="kanban__column" data-slot="kanban-column">
    <header class="kanban__column-header" data-slot="kanban-column-header">
      <span class="kanban__column-indicator text-success" data-slot="kanban-column-indicator"><svg/></span>
      <h3 class="kanban__column-title" data-slot="kanban-column-title">Open</h3>
      <span class="kanban__column-count" data-slot="kanban-column-count">4</span>
      <div class="kanban__column-actions" data-slot="kanban-column-actions">
        <button class="button button--icon-only button--sm button--ghost" aria-label="Add task">…
        <button class="button button--icon-only button--sm button--ghost" aria-haspopup="true" aria-label="More options">…
    <div class="kanban__column-body" data-slot="kanban-column-body">
      <div class="scroll-shadow scroll-shadow--vertical scroll-shadow--fade kanban__scroll-shadow max-h-[600px]"
           data-slot="kanban-scroll-shadow">
        <template/><span data-focus-scope-start hidden/>          <!-- RAC GridList internals -->
        <div class="kanban__card-list kanban__card-list--md" data-slot="kanban-card-list" role="grid"
             data-layout="stack" data-orientation="vertical" [data-empty] [data-focus-visible] [data-drop-target]>
          <div class="kanban__card kanban__card--md" data-slot="kanban-card" role="row" data-key="1"
               draggable="true" data-allows-dragging="true" [data-dragging] [data-hovered] [data-focused] [data-focus-visible] [data-selected]>
            <div role="gridcell" style="display: contents;">
              <div class="kanban__card-content kanban__card-content--md" data-slot="kanban-card-content">…</div>
        <span data-focus-scope-end hidden/>
      <div class="p-2"><button class="button button--full-width button--md button--outline">…Add a task</button></div>
```

- Size reaches the list, the card and the content through context: `kanban__card-list--{size}`,
  `kanban__card--{size}` and `kanban__card-content--{size}` (all three sizes are emitted, including md).
- The `<template>` and the focus-scope `<span>`s come from RAC (`CollectionBuilder` / `GridList`'s `FocusScope`).
- The drop indicator row has **no** `data-slot` (RAC's GridList drop indicator only forwards
  className/style): `<div class="kanban__drop-indicator" role="row" data-drop-target="true"><div role="gridcell"><div role="button" aria-roledescription="drop indicator" …/></div></div>`.
  Without a custom indicator RAC renders `class="react-aria-DropIndicator"` (0 px tall line).

## 3. API (docs)

| Part | Element / primitive | Props |
|---|---|---|
| `Kanban` | OSS `ScrollShadow` (horizontal) | `size?: "sm" \| "md" \| "lg"` (default `md`) + all ScrollShadow props except `size` |
| `Kanban.Column` | `<section>` | DOM props |
| `Kanban.ColumnBody` | `<div>` | DOM props |
| `Kanban.ColumnHeader` | `<header>` | DOM props |
| `Kanban.ColumnActions` | `<div>` | DOM props |
| `Kanban.ColumnIndicator` | `<span>` | DOM props (dot when empty, icon box with children) |
| `Kanban.ColumnTitle` | `<h3>` | DOM props |
| `Kanban.ColumnCount` | `<span>` | DOM props |
| `Kanban.CardList` | RAC `GridList` | `selectionMode` (default `"none"`), `renderEmptyState`, all GridList props |
| `Kanban.Card` | RAC `GridListItem` | `textValue`, `children` (node or render function), all GridListItem props |
| `Kanban.DropIndicator` | RAC `DropIndicator` | `height?: number` (px) + all DropIndicator props |
| `Kanban.DragHandle` | RAC `Button` `slot="drag"` | all RAC Button props |
| `Kanban.ScrollShadow` | OSS `ScrollShadow` (vertical) | all ScrollShadow props |

Hooks:

- `useKanban({initialItems, getColumn, setColumn, dragType = "kanban-item-id", getKey = item => item.id})`
  returns `{list, addItem, removeItem, moveItem, updateItem, getColumn, setColumn, dragType}`.
- `useKanbanColumn(kanban, column, {renderDropIndicator?})` returns `{items, dragAndDropHooks}`.
- `useKanbanCardPlaceholder({renderIndicator?})` returns `{renderDropIndicator}`. It measures the
  dragged card and writes its height as `--kanban-drop-height`.

Observed drag data: types `["kanban-item-id", "text/plain", "application/vnd.react-aria.items+json"]`.

## 4. Styling (CSSOM, all in `@layer components`)

| Selector | Values (mapped to tokens) |
|---|---|
| `.kanban` | `display:grid; grid-auto-flow:column; grid-auto-columns:minmax(var(--kanban-column-min-width),1fr); gap:var(--kanban-column-gap); scroll-snap-type:x mandatory; overflow-x:auto; --ring-offset-width:0px; --kanban-column-min-width:280px; --kanban-column-gap:16px; --kanban-column-height:480px` |
| `.kanban--sm / --md / --lg` | 240px/12px · 280px/16px · 320px/20px |
| `.kanban__column` | `flex flex-col gap-2 snap-center; min-width: var(--kanban-column-min-width)` |
| `.kanban__column-body` | `flex flex-1 flex-col bg-default/40 min-h-[100px]; border-radius: calc(var(--radius-2xl) + var(--radius-sm))` (20px) |
| `.kanban__column-header` | `flex items-center gap-2 px-1 py-1.5` (48px tall with sm icon buttons) |
| `.kanban__column-actions` | `ms-auto flex shrink-0 items-center gap-0.5 opacity-0; transition: opacity .15s` (ease); visible on `@media (hover:hover) .kanban__column-header:hover`, `:focus-within`, `:has([aria-expanded=true])`, `:has([data-open])` |
| `.kanban__column-indicator` | `shrink-0`; `:empty` → `size-2.5 rounded-full bg-default`; `:not(:empty)` → `flex items-center justify-center text-muted`, `svg size-4` |
| `.kanban__column-title` | `m-0 text-sm font-semibold text-foreground` |
| `.kanban__column-count` | `text-xs font-medium text-muted` |
| `.kanban__scroll-shadow` | `mb-3 flex flex-1 flex-col; border-radius: calc(var(--radius) * 1.5)` |
| `.kanban__card-list` | `flex flex-1 flex-col gap-2 p-2 pb-4 min-h-full outline-none`; `[data-focus-visible]` focus ring; `[data-empty]` centred |
| `.kanban__card-list .react-aria-DropIndicator[data-drop-target]` | `outline: 1px solid accent/40; border-radius: 1px` |
| `.kanban__drop-indicator[data-drop-target]` | `shrink-0 border border-separator; radius calc(var(--radius)*1.5); height: var(--kanban-drop-height, 2.5rem); transition: height .15s ease-out` |
| `.kanban__empty` | `flex items-center justify-center py-8 text-center text-sm text-muted` |
| `.kanban__card` | `relative select-none outline-none no-highlight; radius calc(var(--radius)*1.5); cursor: var(--cursor-interactive); transition: opacity .2s` |
| `.kanban__card` focus-visible | focus ring (2px) with `--tw-ring-color: var(--color-separator)`; pointer focus shows no ring |
| `.kanban__card` disabled / `[data-dragging]` | `status-disabled` / `opacity: .5` |
| `.kanban__card-content` | `flex flex-col overflow-hidden bg-overlay; radius calc(var(--radius)*1.5); transition: box-shadow .15s` |
| `.kanban__card-content--sm / md / lg` | `gap-1.5 p-2 text-xs` · `gap-2 p-3 text-sm` · `gap-3 p-4 text-base` |
| `.kanban__card:hover > .kanban__card-content` (hover media) | `shadow-sm` (see deviations: never matches) |
| `.kanban__card[data-selected=true] > .kanban__card-content` | `bg-accent-soft` (never matches either) |
| `.kanban__drag-handle` | `sr-only` + `flex shrink-0 items-center justify-center border-none bg-transparent text-base leading-none text-muted outline-none`; on its own focus → `not-sr-only` + focus ring; `.kanban__card[data-focus-visible=true] .kanban__drag-handle` → `not-sr-only` |

Reduced motion: every transition is dropped under `prefers-reduced-motion` / `[data-reduce-motion]`.
Theme tokens only: light `--overlay` white cards on `--default`/40, dark the same tokens (verified in both themes).

Default demo metrics (light, 1x): column 280×724, header 48, body 668 (scroll shadow 600 + 12 margin + footer 56),
card list padding 8/8/16, gap 8, card radius 12, content padding 12 / gap 8 / 14px text.

## 5. Behaviour and timings

- **Pointer drag**: native HTML5 DnD (RAC `useDrag`). The source card keeps its slot at opacity .5.
  With the placeholder hook, `--kanban-drop-height: <card height>px` is set as an inline style on
  `<html>` at drag start and removed at drag end. The target slot is a bordered box of that height.
- **Drop targets**: only `before` / `after` item positions (no `onItemDrop`). A drop on the list root
  (empty column, or keyboard "Drop on") appends to the column. Reorder inside a column uses `moveBefore` / `moveAfter`.
  A cross-column drop changes the item's column with `setColumn`, then positions it.
- **Keyboard**: RAC GridList items use `hasDragButton: true`, so keyboard and screen-reader drags need
  `Kanban.DragHandle`. Tab to a card (the handle appears), press ArrowRight to reach the handle, press Enter
  to start, use Tab or the arrows to choose a target, then press Enter to drop or Escape to cancel. Without a handle RAC logs a dev
  warning (the Pro demos have no handle, so it happens there too).
- **Layout animation**: Pro wraps the content in a Motion `layout` element. Probing shows a spring on
  `transform: translate3d(x, y, 0) scale(sx, sy)` with `transform-origin: 50% 50%`. A 157px move gives
  157.25 → 109.9 (40ms) → 60.0 (73ms) → 27.4 (107ms) → 5.1 (157ms) → −0.9 (225ms) → 0 (~360ms), which is
  about 0.6% overshoot (ζ ≈ 0.85, ωn ≈ 24.9 → stiffness ≈ 620, damping ≈ 42). It runs whenever a card is
  re-rendered at a new place, for example when a drop indicator appears, moves or goes away, when a card leaves or
  joins the column, or when a scrollbar appears and changes the width (`scale(1.039, 1)`).
- Column actions fade with `opacity .15s`. The drop placeholder animates height in 150ms (ease-out) when its
  height variable changes.

## 6. Demos → stories

| Pro demo | Story | Notes |
|---|---|---|
| `kanban-default` | `Default` | 3 columns, icon indicators (`text-success/warning/danger`), "Add task" (OSS Modal with title + description), "More options" (OSS Dropdown: *Column → Clear all tasks*, *Move all to → …*), `Kanban.ScrollShadow max-h-[600px]`, outline "Add a task" footer, cards with optional image / description (`Text slot="description"`) / chips / progress / avatars / counters, placeholder indicator |
| `kanban-notion-board` | `NotionBoard` | root `hideScrollBar`, `visibility="none"`, `items-start overflow-visible` in a `w-full pr-3` wrapper; sticky tinted headers (`bg-{tone}/8`, pill `bg-{tone}/15`, dot indicator), tinted body `rounded-t-none`, list `pt-0 pb-2`, "New task" footer; placeholder indicator |
| `kanban-project-board` | `ProjectBoard` | 5 columns, dot indicators (`bg-default/accent/warning/danger/success`), `max-h-[480px]` scroll shadow, no footer, RAC default line indicator; done titles `line-through` |
| `kanban-sizes` | `Sizes` | `sm` / `md` / `lg` boards, 2 columns each, dot indicators |
| — | `KeyboardDragAndDrop` | extra: `Kanban.DragHandle`, `renderEmptyState` |

## 7. Implementation notes

- Root and `Kanban.ScrollShadow` reuse the OSS `ScrollShadow`. `CardList` / `Card` / `DropIndicator` /
  `DragHandle` are RAC primitives. Stories use OSS Button, Chip, Avatar, ProgressBar, Dropdown, Modal and TextField.
- The layout animation does not use Motion. A small class component (`getSnapshotBeforeUpdate`, which has no hook
  equivalent) records the content box before each commit. After the commit it compares that box with the row's new box
  and plays a Web Animations FLIP. The keyframes are sampled from the fitted spring at 60 fps over 380ms. The row never
  moves, so hit-testing and drop-target math stay on the real layout.
- `useKanbanColumn` publishes drag start and end on a module-level bus. `useKanbanCardPlaceholder` subscribes to it, measures
  `[data-slot=kanban-card][data-key=…]` and writes the variable. This covers pointer, keyboard and virtual drags.
- `moveItem` updates the item in place (`setColumn`), so it keeps its place in the board order. Verified on the Pro
  default demo: *Move all to → In Progress* on `Open [1,2,4,7]` + `In Progress [3,5]` gives `In Progress [1,2,3,4,5,7]`
  (interleaved by board order, not appended). `addItem` appends (a new task lands at the end of its column).
- Stories wrap each Pro demo in `DemoPage` (`flex min-h-screen items-center justify-center p-6`). This is the same row flex
  container the Pro demo pages use, so boards size the same way. A board is as wide as its max-content, capped by the
  page. The Sizes stack is at least as wide as its widest board's min-content (660px), and it overflows narrow pages
  just as Pro does.
- Default demo card content: the label row and the avatar/counter row only render when they have content (a task added
  through the modal shows only the title and an empty description). Counter icons are `size-3.5`.

### Review measurements (light, 447px viewport, same tab for both)

- Metrics match for root, column, header, indicator, title, count, actions, body, scroll shadow, list, card and content in all
  four demos and all three sizes. Colours resolve to the same tokens in light and dark.
- Placeholder: `kanban__drop-indicator` `border 1px separator`, radius 12px, height = dragged card (149.25px), `height .15s ease-out`.
  The RAC line indicator in Project Board is `0px` tall with a `1px` accent/40 outline. Both are identical to Pro.
- Spring, per-frame comparison (card below a new placeholder, 157.3px move). Pro: −157.3 (t0) → −143.9 (+32ms) →
  −94.1 (+66) → −49.4 (+99) → −20.8 (+132) → −6.8 (+166) → −1.0 (+199) → +1.0 peak (+250) → 0 (+366).
  Remake: −146.4 → −96.8 → −50.5 → −21.4 → −6.7 → −0.7 → +1.1 → 0 (same curve to within about 10ms of phase).
  Least-squares fits of three Pro runs give k 565–625 and c 40–43, so 620/42 sits inside the measured spread.

## 8. Deviations / caveats

- The hover shadow and the selected background are documented, but they never paint in Pro. The selectors use the child
  combinator (`.kanban__card > .kanban__card-content`), while RAC puts a `display: contents` gridcell in
  between (verified: a hovered card computes `box-shadow: none`). The selectors are kept verbatim, so the remake renders the same.
- The size modifiers `kanban--md` and `kanban__card-content--md` are empty, and the base classes carry the md values (repo
  convention). Pro repeats the values in the `--md` rules. The computed result is the same.
- No `motion` dependency. The spring is approximated, not bit-identical.
- Keyboard focus ring on a card: Pro draws a 2px outside ring (box-shadow, `--color-separator`) on the row. The remake
  draws a 2px `--separator` outline inset on the content box. This was an intentional later change, marked "keep it" in
  `kanban.css`: an outside ring is clipped by vertical column scrollers and covered by sticky column headers.
- Scrollbars: Pro demos show native scrollbars (10px). Storybook uses overlay scrollbars, so Pro cards are 254px wide
  in a scrolling column, and the remake's cards are 264px wide.
