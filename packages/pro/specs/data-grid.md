# Data Grid — clean-room implementation spec

Slug: `data-grid` · Docs: https://heroui.pro/docs/react/components/data-grid · Category: Data Display
Storybook title: `Pro/DataDisplay/DataGrid` · Import (Pro): `import {DataGrid} from "@heroui-pro/react";`

Sources: the public docs page (prose, API tables, styling reference), the server-rendered DOM of all
14 public demo pages, live DOM/CSSOM/computed styles and runtime probing of the demos (scroll,
sort, tree toggle, selection, load-more), and the OSS `Table` source in this repo
(`packages/react/src/components/table`, `packages/styles/components/table.css`).
The paywalled example source was not opened or worked around.

---

## 1. Purpose

A data-driven grid (`data` + `columns` + `getRowId`) built on the **OSS HeroUI Table**
(`Table.Root/ScrollContainer/ResizableContainer/Content/Header/Column/ColumnResizer/Body/Row/Cell/
Footer/LoadMore/LoadMoreContent/Collection`) and React Aria Components (Table, Virtualizer +
TableLayout, useDragAndDrop). Adds: client-side sorting, selection checkboxes, column resizing,
pinned (sticky) columns, drag-and-drop row reorder, tree rows, virtualization, infinite loading,
empty state, sticky header and a footer slot.

There are **no compound parts**: the whole API is the `DataGrid` props + the `DataGridColumn<T>`
definition objects.

---

## 2. Anatomy (rendered DOM)

```
div.table-root.table-root--{primary|secondary}.data-grid[data-slot=data-grid]      <- Table.Root
    [data-vertical-align=top|middle|bottom] [data-sticky-header="true"]
    [data-pinned-start-detached=""] [data-pinned-end-detached=""]
  div.table__scroll-container[data-slot=table-scroll-container] (+scrollContainerClassName)
    div.table__resizable-container                     <- only with allowsColumnResize
      (Virtualizer)                                     <- only with virtualized
      table.table__content[data-slot=table-content] (+contentClassName) role=grid|treegrid
        thead.table__header (+ .data-grid__virtualized-header when virtualized)
          tr
            th.table__column.data-grid__drag-handle-column        <- with onReorder/dragAndDropHooks
            th.table__column.data-grid__selection-column          <- with showSelectionCheckboxes
              div.checkbox.checkbox--primary[slot=selection]      (only for selectionMode=multiple)
            th.table__column[data-align][data-pinned][data-pinned-edge] style="inset-inline-*:Npx"
              <span data-slot="data-grid-sort-header">Label<svg.data-grid__sort-icon data-direction/></span>
              div.table__column-resizer                            <- column.allowsResizing
        tbody.table__body
          tr.table__row (RAC data-*: data-level, data-selected, data-expanded, ...)
            td.table__cell.data-grid__drag-handle-cell > button.data-grid__drag-handle[slot=drag] > grip svg
            td.table__cell.data-grid__selection-cell > div.checkbox.checkbox--secondary[slot=selection]
            td.table__cell[data-align][data-pinned][data-pinned-edge] (+cellClassName)
              tree column: span.data-grid__tree-cell[style=padding-inline-start:(level-1)*treeIndent]
                             button.button.button--icon-only.button--sm.button--ghost.data-grid__tree-toggle[slot=chevron]
                               svg.data-grid__tree-toggle-icon[data-expanded]
                             | span.data-grid__tree-toggle-spacer[aria-hidden]
                             span > content
          (empty)   tr > td[colspan] > div.data-grid__empty-state[data-slot=data-grid-empty-state] > renderEmptyState()
          (loading) tr[inert] sentinel; tr.table__load-more > td > div.table__load-more-content > loadMoreContent
  div.table__footer[data-slot=table-footer] (+footerClassName)                    <- footer prop
```

Observed details
- Header checkbox uses the OSS `primary` checkbox variant, body checkboxes `secondary`.
- Non-sortable headers render the label as a bare text node; sortable ones wrap it in
  `span[data-slot=data-grid-sort-header]` (no class, inline). The chevron only renders while the
  column is the sorted one (12px, rotates 180° for descending, 100ms ease-out).
- `header` as a function replaces the label and the built-in chevron.
- Pinned cells get inline `inset-inline-start/end` offsets; the selection / drag columns are pinned
  to the start too when any data column is start-pinned. `data-pinned-edge="true"` marks the last
  start-pinned and the first end-pinned column.
- Root `data-pinned-start-detached` (value `""`) is set while `scrollLeft > 0` and only when a
  start-pinned column exists; `data-pinned-end-detached` while the content has not reached the end
  edge and only when an end-pinned column exists. Detection uses whichever element scrolls
  (resizable container, scroll container or the virtualized content).
- Tree toggle: OSS `Button` (`isIconOnly size=sm variant=ghost`) with `slot="chevron"`,
  `aria-label` "Expand row" / "Collapse row"; measured 36×24 below `md`, 32×24 from `md` (the OSS
  `.button--icon-only.button--sm` width wins over `--data-grid-tree-toggle-size`, height does not).
- Drag handle: plain RAC `Button slot="drag"`, React Aria adds `style="pointer-events:none"`.
- Load more row and sentinel are the OSS `Table.LoadMore` / `Table.LoadMoreContent` DOM.
- The empty-state `td` has no `table__cell` class (React Aria renders it), so no cell padding.
- A last body row has no bottom cell border (also every virtualized row, because each row is the
  last child of its virtualizer wrapper — Pro renders it like that too).

---

## 3. API (docs)

### DataGrid props
| Prop | Type | Default |
|---|---|---|
| `data` | `T[]` | – |
| `columns` | `DataGridColumn<T>[]` | – |
| `getRowId` | `(item: T) => string \| number` | – |
| `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details` | `string` | – |
| `id` | `string` (on the `role=grid` element) | – |
| `variant` | `"primary" \| "secondary"` | `"primary"` |
| `className` / `contentClassName` / `scrollContainerClassName` | `string` | – |
| `stickyHeader` | `boolean` | `false` |
| `verticalAlign` | `"top" \| "middle" \| "bottom"` | `"middle"` |
| `selectionMode` | `"none" \| "single" \| "multiple"` | `"none"` |
| `selectedKeys` / `defaultSelectedKeys` | `Selection` | – |
| `onSelectionChange` | `(keys: Selection) => void` | – |
| `selectionBehavior` | `"toggle" \| "replace"` | `"toggle"` |
| `showSelectionCheckboxes` | `boolean` | `false` |
| `sortDescriptor` / `defaultSortDescriptor` | `SortDescriptor` | – |
| `onSortChange` | `(d: SortDescriptor) => void` (controlled and uncontrolled) | – |
| `allowsColumnResize` | `boolean` | `false` |
| `onColumnResize` / `onColumnResizeEnd` | `(widths: Map<Key, ColumnSize>) => void` | – |
| `onReorder` | `(e: DataGridReorderEvent<T>) => void` | – |
| `dragAndDropHooks` | `DragAndDropHooks` (overrides onReorder) | – |
| `onRowAction` | `(key) => void` | – |
| `renderEmptyState` | `() => ReactNode` | – |
| `footer` / `footerClassName` | `ReactNode` / `string` | – |
| `onLoadMore` / `isLoadingMore` / `loadMoreContent` | `() => void` / `boolean` (false) / `ReactNode` | – |
| `disabledKeys` | `Iterable<string \| number>` | – |
| `virtualized` / `rowHeight` / `headingHeight` | `boolean` (false) / `number` (42) / `number` (36) | – |
| `getChildren` | `(item: T) => T[] \| undefined` | – |
| `treeColumn` | `string` (defaults to first `isRowHeader` column, else first column) | – |
| `expandedKeys` / `defaultExpandedKeys` / `onExpandedChange` | `Iterable<Key>` / `(keys: Set<Key>) => void` | – |
| `treeIndent` | `number` (`0` disables) | `20` |

### DataGridColumn<T>
`id` (required, sort key), `header` (`ReactNode | ({sortDirection}) => ReactNode`), `accessorKey`,
`cell(item, column)`, `isRowHeader` (false), `allowsSorting` (false), `sortFn(a, b)`,
`allowsResizing`, `width`, `defaultWidth` (wins over width), `minWidth`, `maxWidth`,
`align` (`start|center|end`, default start), `headerClassName`, `cellClassName`,
`pinned` (`start|end`, needs a numeric width or minWidth).

Width semantics: uncontrolled initial width = `defaultWidth ?? width`; with `onColumnResize`,
`width` is controlled. The grid keeps resized widths internally otherwise.

### DataGridReorderEvent<T>
`keys: Set<string|number>`, `target: {key, dropPosition: "before" | "after"}`, `reorderedData: T[]`.

### Exported types
`DataGridSelection`, `DataGridSortDescriptor`, `DataGridSortDirection`, `DataGridColumnSize`
(+ `DataGridProps`, `DataGridColumn`, `DataGridReorderEvent`).

### Behaviour
- Uncontrolled sorting sorts client-side (accessor value, locale aware, or `sortFn`); a controlled
  `sortDescriptor` never sorts (server-side). Tree children are sorted per level.
- RAC drag-and-drop keyboard flow: Enter to grab, arrows to move, Enter to drop.
- Sticky header sticks inside the grid's scroll container (consumer gives it a height).

---

## 4. Styling (tokens)

Root custom properties: `--data-grid-selection-column-width: 40px`,
`--data-grid-drag-handle-column-width: 32px`, `--data-grid-tree-toggle-size: 24px`,
`--data-grid-tree-gap: 4px`.

| Selector | Rules |
|---|---|
| `.data-grid` | `relative w-full` + the variables |
| sticky header | `thead` `sticky top-0 z-3`; `.table__column` `bg-surface-secondary`; resizable container `overflow-visible` |
| `.data-grid__virtualized-header` | `size-full` |
| selection column / cell | `width: var(--…selection-column-width)`, `pe-0`; header `::after` removed |
| drag column / cell | `width: var(--…drag-handle-column-width)`, `px-0`; header `::after` removed |
| `.data-grid__drag-handle` | flex centered, `size-full`, `text-muted`, transparent, `cursor: grab` (`grabbing` while pressed), svg 16px, hover `text-foreground`, focus `status-focused` |
| drop indicator | `.react-aria-DropIndicator td` 2px, `[data-drop-target]` `bg-accent`; dragging row `opacity-50` |
| `.data-grid__sort-icon` | `inline-flex size-3 shrink-0`, `transition-transform 100ms ease-out`, descending `rotate-180` |
| `.data-grid__empty-state` | `flex items-center justify-center py-12 text-center text-sm text-muted` |
| vertical align | `.table__cell` `align-top/middle/bottom`; virtualized cells `flex items-start/center/end` |
| `[data-align]` | `text-end` / `text-center` |
| `[data-pinned]` | `sticky z-2`; headers `z-11 bg-surface-secondary`; cells `bg-surface`; `::after` none |
| pinned hover / selected | opaque `color-mix(in oklch, var(--color-surface) 40% / 10%, var(--color-surface-secondary))` |
| detached edge | `::after` 1px full-height `bg-separator` at the inner edge; rounded body corner removed |
| secondary variant | pinned cells `bg-background`, pinned headers `bg-surface-secondary` |
| `.data-grid__tree-cell` | `flex min-w-0 items-center gap: var(--data-grid-tree-gap)` |
| `.data-grid__tree-toggle` / spacer | `var(--data-grid-tree-toggle-size)` square, `shrink-0` |
| `.data-grid__tree-toggle-icon` | 16px `text-muted`, `transition-transform 150ms ease-out`, expanded `rotate-90`, RTL collapsed `rotate-180` |
| `.data-grid .table__row:last-child .table__cell` | `border-b-0` |

Colours come only from theme tokens (`--surface`, `--surface-secondary`, `--background`,
`--separator`, `--accent`, `--muted`, `--foreground`, `--focus`). No literal colours.

---

## 5. Demo list (all reproduced as stories)

| Pro demo | Story | Key features |
|---|---|---|
| data-grid-default (Payments) | `Default` | resize, multi-select checkboxes, uncontrolled sort, pinned end row actions, `min-w-[1400px]` |
| data-grid-users (Usage) | `Users` | `variant="secondary"`, flat data, link cell |
| data-grid-team-members | `TeamMembers` | controlled sort, selection, start+end pinned, resize, visibility, search, filters, pagination footer |
| data-grid-pinned-columns | `PinnedColumns` | dense (`--radius`/`--spacing` override), start-pinned name, footer count |
| data-grid-expandable-rows | `ExpandableRows` | `getChildren`, `treeColumn`, controlled expansion |
| data-grid-editable-cells | `EditableCells` | inline edit, select, NumberStepper, Switch |
| data-grid-drag-and-drop | `DragAndDrop` | `onReorder` |
| data-grid-servers | `Servers` | controlled sort, sparkline (Pro AreaChart), ProgressCircle, filters, visibility |
| data-grid-bulk-actions | `BulkActions` | selection + floating action bar |
| data-grid-with-footer | `WithFooter` | Pagination with summary in `footer` |
| data-grid-empty-state | `EmptyState` | `renderEmptyState` |
| data-grid-async-loading | `AsyncLoading` | `onLoadMore`, `isLoadingMore`, Spinner, `max-h-[400px]` scroll container |
| data-grid-virtualized | `Virtualized` | 1,000 rows, `rowHeight 58`, `headingHeight 37`, Segment filter |
| data-grid-sticky-header | `StickyHeader` | `stickyHeader`, `max-h-[320px]` |

---

## 6. Dependencies

OSS: `Table` (all parts), `Checkbox`, `Button`. RAC: `Button`, `Virtualizer` + `TableLayout`,
`useDragAndDrop`; react-aria `useCollator`. No heavy optional peer, so it can be a root export.
Stories additionally use OSS Avatar/Chip/Dropdown/Input/Link/Pagination/ProgressCircle/SearchField/
Separator/Spinner/Switch and Pro AreaChart, NumberStepper, Segment.

---

## 7. Deviations / notes

- Pinned offsets use the **measured** header widths (declared widths until measured). Pro uses the
  declared widths only, so with a stretched table (e.g. team-members, `min-w` larger than the sum of
  widths) its start-pinned column overlaps the selection column by a few pixels; ours does not.
- Rows get a `textValue` from the row-header accessor (when it is a string/number), so the drag
  handle is announced as "Drag <row>" instead of Pro's "Drag ".
- `data-slot` added on the drag handle (`data-grid-drag-handle`) and tree icon
  (`data-grid-tree-toggle-icon`); Pro renders them without.
- `reorderedData` only reorders top-level rows; moves inside nested tree levels pass the
  unchanged data (children come from a getter, so they cannot be rebuilt generically).
- The stories use the package's own Pro `ActionBar`, `EmptyState`, `InlineSelect`, `NumberStepper`,
  `Segment` and `AreaChart` (built in parallel); filter / sort / column menus use OSS `Dropdown`.
- Pinned-columns demo: the dense `[&_.table__cell]:py-1.5 …` classes on the grid do not take effect
  on the Pro site (cells keep `py-3` / `text-sm`, headers `py-2.5` / `text-xs`); only the `--radius`
  and `--spacing` overrides scale the grid. Our story measures the same (32px header, 40.2px rows).

## 8. Review (independent pass)

Compared against the live demos at a 447px viewport (light + dark) with the same scripts:
- Payments, team members, pinned columns, expandable rows, drag and drop, virtualized, sticky
  header, users (secondary), with footer, empty state, async loading, servers, editable cells:
  header 36px, cell paddings 16/12px (16/0 selection), colours (resolved tokens identical once
  converted to lab), pinned z-index 2/11, detached separators, edge radius reset, tree toggle
  36x24 / spacer 24x24 / 20px indent, virtualized 37px header wrapper + 58px flex rows, load-more
  row 64px with 40px content and auto-loading, sticky header (sticky/top 0/z 3).
- Drag-handle and selection columns: 32px / 40px when the table has room, shrinking to their
  content (16px / 32px) in auto table layout when the table is squeezed, exactly as in Pro.
- Pinned hover mix: Pro `oklch(0.971 0.0008 none)`, ours `oklch(0.971 0.0008 315.8)` (hue of a
  near-zero chroma; visually identical, comes from the token notation).
- Theme check: `--radius: 1rem` -> root 32px / body corners 32px; `--font-sans` and `--accent`
  propagate (all values come from tokens).
- Story fixes from the review: EmptyState gets the heading, `max-w-4xl` + `gap-4` wrapper and a
  centred column like the demo; Virtualized footer uses the demo's `flex gap-6` summary pair;
  BulkActions ActionBar gets the separator after the prefix and the `size-5` count chip.

---

## Appendix A — Pro data-grid CSSOM (reference only, not used as implementation)

```
@layer components >> .data-grid {--data-grid-selection-column-width:40px;--data-grid-drag-handle-column-width:32px;--data-grid-tree-toggle-size:24px;--data-grid-tree-gap:4px;width:100%;position:relative}
[data-slot=data-grid][data-sticky-header] .table__header {z-index:3;position:sticky;top:0}
[data-slot=data-grid][data-sticky-header] .table__column {background-color:var(--surface-secondary)}
.data-grid__virtualized-header {width:100%;height:100%}
[data-slot=data-grid][data-sticky-header] .table__resizable-container {overflow:visible}
.data-grid__selection-column {width:var(--data-grid-selection-column-width);padding-inline-end:0} ::after {content:none}
.data-grid__selection-cell {width:var(--data-grid-selection-column-width);padding-inline-end:0}
.data-grid__drag-handle-column {width:var(--data-grid-drag-handle-column-width);padding-inline:0} ::after {content:none}
.data-grid__drag-handle-cell {width:var(--data-grid-drag-handle-column-width);padding-inline:0}
.data-grid__drag-handle {cursor:grab;outline:none;tap-highlight:transparent;width:100%;height:100%;color:var(--muted);background:transparent;border:none;display:flex;justify-content:center;align-items:center;padding:0;line-height:1}
.data-grid__drag-handle svg {size 16px}; focus-visible -> 2px focus ring with background offset; @media(hover) hover -> color foreground; :active/[data-pressed] -> cursor grabbing
.data-grid .react-aria-DropIndicator {outline:none}; td {height:2px;padding:0}; [data-drop-target] td {background:var(--accent)}
[data-slot=data-grid] .table__row[data-dragging=true] {opacity:.5}
.data-grid__sort-icon {12px; transition transform .1s var(--ease-out); flex-shrink:0; display:inline-flex}; [data-direction=descending] {rotate:180deg}; motion-reduce -> none
.data-grid__empty-state {padding-block:48px;text-align:center;font-size:var(--text-sm);color:var(--muted);display:flex;justify-content:center;align-items:center}
[data-vertical-align=top|middle|bottom] .table__cell {vertical-align}; .table__body:not(tbody) [data-slot=table-cell] {display:flex;align-items:flex-start|center|flex-end}
[data-slot=data-grid] [data-align=end] {text-align:end}; [data-align=center] {text-align:center}
[data-slot=data-grid] [data-pinned] {z-index:2;position:sticky}
.table__column|selection-column|drag-handle-column[data-pinned] {z-index:11;background:var(--surface-secondary)}
.table__cell|selection-cell|drag-handle-cell[data-pinned] {background:var(--surface)}
[data-pinned]:after {content:none}
@media(hover) row:hover [data-pinned].table__cell {background: color-mix(in oklch, var(--color-surface) 40%, var(--color-surface-secondary))}
row[data-selected=true] [data-pinned].table__cell {background: color-mix(in oklch, var(--color-surface) 10%, var(--color-surface-secondary))}
[data-pinned-start-detached] [data-pinned=start][data-pinned-edge]:after {content:"";pointer-events:none;width:1px;height:100%;translate:0 0;background:var(--color-separator);inset-inline-end:0;position:absolute;top:0;bottom:0}
[data-pinned-end-detached] [data-pinned=end][data-pinned-edge]:after {… inset-inline-start:0 …}
detached first/last body rows: edge td border-radius:0
.table-root--secondary [data-pinned].table__cell {background:var(--background)}; .table-root--secondary .table__column[data-pinned] {background:var(--surface-secondary)}
.data-grid__tree-cell {align-items:center;gap:var(--data-grid-tree-gap);min-width:0;display:flex}; > span:last-child {min-width:0}
.data-grid__tree-toggle {width/height:var(--data-grid-tree-toggle-size);flex-shrink:0}
.data-grid__tree-toggle-icon {16px;color:var(--muted);transition transform .15s var(--ease-out)}; [data-expanded] {rotate:90deg}; RTL :not([data-expanded]) {rotate:180deg}
.data-grid__tree-toggle-spacer {width/height:var(--data-grid-tree-toggle-size);flex-shrink:0;display:inline-block}
(global on the Pro site) .table__row:last-child .table__cell {border-bottom-width:0}
```

## Appendix B — measured metrics (light, 447px viewport)

- Payments: header row 36px, body rows 65px (two-line customer cell), selection column 40px with
  `padding: 10px 0 10px 16px` (header) / `12px 0 12px 16px` (cell); table width = sum of widths
  (1575px) when `min-w-[1400px]` is smaller.
- Team members: columns stretched proportionally to fill `min-w-[1600px]` (40 → 43.5px …).
- Expandable rows: level-1 cell padding-start 16px, level-2 32px (OSS `--table-row-level` rule) plus
  the 20px inline indent on `.data-grid__tree-cell`; toggle 36×24, spacer 24×24; rows 49px, last 48px.
- Drag and drop: handle column collapses to its content (16px) in auto table layout.
- Virtualized: header 36px inside a 37px wrapper, rows 58px, cells `display:flex; align-items:center`,
  no row borders.
- Empty state: `.data-grid__empty-state` 352px tall in the demo (48px block padding + content).
