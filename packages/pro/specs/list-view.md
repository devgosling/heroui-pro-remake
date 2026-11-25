# List View — clean-room implementation spec

Slug: `list-view` · Docs: https://heroui.pro/docs/react/components/list-view · Category: Data Display
Storybook title: `Pro/DataDisplay/ListView` · Import (Pro): `import {ListView} from "@heroui-pro/react";` (root export)

Sources: public docs text, server-rendered DOM of the 5 public demo pages (light + dark), the CSSOM
rules that mention `list-view`, computed styles, and runtime probing (mouse clicks, arrow keys,
selection toggling, ActionBar mount). I also read the React Aria Components (RAC) 1.22.1 GridList,
Virtualizer and ListLayout code in `node_modules` to tell RAC behaviour apart from Pro behaviour.
I did not open the paywalled example source.

---

## 1. Purpose

"A single-column interactive list with keyboard navigation, selection, and accessible item actions -
built on RAC GridList." It has typeahead, `none` / `single` / `multiple` selection with automatic
checkboxes, disabled rows, row actions (`onAction` / `href`), an empty state and optional
virtualization.

---

## 2. Anatomy

```tsx
<ListView aria-label="Files" selectionMode="multiple">     // RAC GridList (inside RAC FocusScope)
  <ListView.Item id="report" textValue="report.pdf">        // RAC GridListItem (role=row)
    {/* auto: <div role=gridcell style="display:contents"> (RAC) */}
    {/* auto: <div.list-view__selection-cell><Checkbox slot="selection"/></div> when selection is on */}
    <ListView.ItemContent>
      <svg/>                                                 // any icon, 16px muted
      <div className="flex min-w-0 flex-col">                // user wrapper (from the demos)
        <ListView.Title>report.pdf</ListView.Title>
        <ListView.Description>2.4 MB</ListView.Description> // optional
      </div>
    </ListView.ItemContent>
    <ListView.ItemAction>…</ListView.ItemAction>             // optional
  </ListView.Item>
</ListView>
```

| Part | Element | `data-slot` | BEM class | Primitive |
|---|---|---|---|---|
| `ListView` | `div role=grid` (`aria-multiselectable` in multiple mode, `data-rac`, `data-layout="stack"`, `data-orientation="vertical"`, `tabindex`) | `list-view` | `list-view list-view--{primary\|secondary}` | RAC `GridList` |
| `ListView.Item` | `div role=row` (`aria-label` = textValue, `aria-selected`, `data-key`, `data-selection-mode`, `data-react-aria-pressable` when selectable) | `list-view-item` | `list-view__item` (no modifier) | RAC `GridListItem` |
| gridcell | `div role=gridcell aria-colindex=1 style="display: contents"` | – | – | RAC |
| selection cell (auto) | `div` | `list-view-selection-cell` | `list-view__selection-cell` | – |
| checkbox (auto) | OSS `Checkbox` → `div.checkbox.checkbox--secondary[slot=selection]` > `label.checkbox__content` > visually hidden `input[aria-label=Select]` + `span.checkbox__control` > `span.checkbox__indicator` | `checkbox` … | OSS | RAC `CheckboxField` (selection slot from GridListItem) |
| `ListView.ItemContent` | `div` | `list-view-item-content` | `list-view__item-content` | – |
| `ListView.Title` | `span` | `list-view-title` | `list-view__title` | – |
| `ListView.Description` | `span` (no id, no `slot`) | `list-view-description` | `list-view__description` | – |
| `ListView.ItemAction` | `div` | `list-view-item-action` | `list-view__item-action` | – |
| empty state (auto, CSS only) | `div` | `list-view-empty-state` | `list-view__empty-state` | wraps `renderEmptyState()` |
| load more (CSS only) | `div role=row` | `list-view-load-more` | `list-view__load-more` | RAC `GridListLoadMoreItem` |

Observations
- Checkbox variant depends on the list variant: **primary list → `checkbox--secondary`** (gray box),
  **secondary list → `checkbox--primary`** (white box with a shadow). It is a checkbox in `single`
  mode too (no radio).
- `selectionMode="none"`: no selection cell, no `aria-selected`, no `data-selection-mode`, no
  `data-react-aria-pressable`; the content starts at the row padding.
- Disabled row: `aria-disabled="true" data-disabled="true"`, no `tabindex`, no `aria-selected`; the
  checkbox gets `data-disabled` and a `disabled` input. (All of this is RAC.)
- The `<template>` + `data-focus-scope-start/end` spans around the grid come from RAC (collection
  builder + `FocusScope`).
- The root keeps the RAC default attributes; Pro adds only `data-slot` and the classes. `data-virtualized`
  appears in Pro CSS (`.list-view--primary[data-virtualized]`), so the root carries it when
  virtualized.

---

## 3. API (docs)

### `ListView` — extends RAC `GridListProps<T>`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `aria-label` | `string` | – | required |
| `variant` | `"primary" \| "secondary"` | `"primary"` | |
| `selectionMode` | `"none" \| "single" \| "multiple"` | `"none"` | RAC |
| `selectedKeys` / `defaultSelectedKeys` / `onSelectionChange` | `Selection` | – | RAC |
| `selectionBehavior` | `"toggle" \| "replace"` | `"toggle"` | RAC |
| `items` | `Iterable<T>` | – | RAC dynamic collection |
| `disabledKeys` | `Iterable<Key>` | – | RAC |
| `onAction` | `(key: Key) => void` | – | RAC |
| `renderEmptyState` | `() => ReactNode` | – | wrapped in `.list-view__empty-state` |
| `virtualized` | `boolean` | `false` | RAC `Virtualizer` + `ListLayout` |
| `rowHeight` | `number` | `48` | "Estimated row height" → `ListLayout` `estimatedRowHeight` |
| `className` | `string` | – | |
| `children` | `ReactNode \| (item: T) => ReactNode` | – | |

### `ListView.Item` — extends RAC `GridListItemProps`
`id`, `textValue`, `isDisabled`, `href`, `children`, `className` (+ every RAC item prop: `onAction`,
`value`, render-function children/className …).

### `ListView.ItemContent` / `ListView.ItemAction` — `div` · `ListView.Title` / `ListView.Description` — `span`
`children`, `className` (+ native attributes).

---

## 4. Styling (CSSOM, all in `@layer components`)

| Selector | Declarations (Tailwind-ish) |
|---|---|
| `.list-view` | `relative w-full min-h-0 outline-none` |
| `.list-view--primary` | `bg-surface-secondary p-1`, `border-radius: calc(var(--radius) * 2.5)` (20px) |
| `.list-view--primary[data-virtualized]` | `overflow: hidden` |
| `.list-view__item` | `flex items-center gap-3 px-4 py-3 text-sm outline-none` tap-highlight transparent, `cursor: var(--cursor-interactive)` |
| `.list-view__item:focus-visible, [data-focus-visible=true]` | `outline-none; box-shadow: inset 0 0 0 2px var(--color-focus)` |
| `.list-view__item:disabled, [aria-disabled=true]` | status-disabled (`opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none`) |
| `.list-view__item[data-dragging=true]` | `opacity: .5` |
| `.list-view--primary .list-view__item` | `bg-surface border-b border-separator-tertiary/50` |
| `… :last-child` | `border-b-0` |
| `@media (hover:hover)` `… :hover, [data-hovered=true]` | `bg-surface/40` |
| `… [data-selected=true]` | `bg-surface/10` (wins over hover: same specificity, later) |
| `.list-view--primary:not([data-virtualized]) .list-view__item:first-child` | top radii `calc(var(--radius) * 2)` (16px) |
| `… :last-child` | bottom radii 16px |
| `.list-view--secondary .list-view__item` | `border-b border-separator-tertiary/50 bg-transparent`; `:last-child` `border-b-0` |
| hover (secondary) | `bg-default/50` |
| selected (secondary) | `bg-accent-soft`; selected + hover → `bg-accent-soft-hover` |
| `.list-view__selection-cell` | `flex shrink-0 items-center` |
| `.list-view__item-content` | `flex min-w-0 flex-1 items-center gap-3` |
| `.list-view__item-content svg` | `size-4 shrink-0 text-muted` |
| `.list-view__title` | `truncate text-sm font-medium text-foreground` |
| `.list-view__description` | `mt-0.5 truncate text-xs text-muted` |
| `.list-view__item-action` | `ms-auto shrink-0 ps-2` |
| `.list-view__empty-state` | `flex items-center justify-center px-4 py-8` |
| `.list-view__load-more` | `flex items-center justify-center py-3` |

No transitions or animations on any list-view part (computed `transition: all 0s`). The only motion is
the OSS checkbox (`background-color/border-color .2s`, checkmark stroke).

### Measured (default demo, light, `max-w-md` wrapper 384px wide)
- Root: padding 4, radius 20, bg `--surface-secondary`. Height 385 for 6 rows.
- Row with description: 63px (12 + 20 + 2 + 16 + 12 + 1px border); last row 62px. Title-only row 45px / 44px.
- Selection cell 16×16 at row padding-left 16; content starts 12px after it; icon 16×16 muted;
  text column starts 12px after the icon.
- Title 14/20 medium foreground; description 12/16 muted, 2px top margin.
- Disabled-items demo: trailing lock icon `size-3.5 text-muted` inside ItemAction (22×14 incl. 8px ps).
- Dark: same tokens (`--surface` rows on `--surface-secondary` tray, separator-tertiary/50 hairlines).

---

## 5. Behaviour (all RAC GridList)

- Click / Space toggles selection (`selectionBehavior="toggle"`), also in `single` mode (clicking the
  selected row clears it). Arrow keys move focus row by row; focus ring only for keyboard
  (`data-focus-visible`). Typeahead uses `textValue` (row `aria-label`).
- `selectionMode="none"`: rows are focusable, no checkbox; RAC sets no `data-hovered` (only `:hover` styles apply).
- Disabled rows are skipped by keyboard navigation and are not selectable.
- With Action Bar demo: the Pro ActionBar (`.action-bar` > OSS `Toolbar`) is mounted while
  `selectedKeys.size > 0`; the clear button resets the selection.

---

## 6. Demos → stories

| Pro demo | Story | Content |
|---|---|---|
| `list-view-default` | `Default` | primary, multiple, 6 folder/file rows with title + description, `w-full max-w-md` |
| `list-view-with-actions` | `WithActionBar` | 8 rows, controlled selection + ActionBar (count chip, 3 ghost actions, separator, danger action, separator, clear) |
| `list-view-secondary` | `Secondary` | secondary variant, 5 rows |
| `list-view-selection-modes` | `SelectionModes` | 3 columns (`flex max-w-3xl flex-col gap-8 sm:flex-row`): None / Single / Multiple with "None selected" / "N selected" |
| `list-view-disabled-items` | `DisabledItems` | 6 title-only rows, `disabledKeys={["3","5"]}`, lock icon in ItemAction |
| – (extra) | `EmptyState`, `Virtualized`, `LoadMore` | documented `renderEmptyState` / `virtualized` + `rowHeight`; the CSS-only load-more row |

Story frame mirrors the demo page: `flex min-h-screen items-center justify-center p-6`.

---

## 7. Implementation notes / deviations

- Parts and classes exactly as rendered; `ListView.Item` prepends the selection cell through
  `composeRenderProps` whenever `selectionMode !== "none"` (docs: "Selection checkboxes are rendered
  automatically when selection is enabled"). Plain-string children keep working as `textValue`.
- Focus selector uses the HeroUI pattern `:focus-visible:not([data-focused]), [data-focus-visible="true"]`
  (Pro: bare `:focus-visible`); disabled uses `[data-disabled], [aria-disabled]` (Pro: `:disabled, [aria-disabled]`).
- Virtualized mode (no Pro demo exists): RAC puts each virtual row in its own absolutely positioned
  wrapper and sizes rows from the scroll element's `clientWidth` (padding included). I move the tray
  inset from CSS padding into `ListLayout` `padding` (4px for primary) and guard the `:last-child`
  border removal with `:not([data-virtualized])`, so virtual rows keep their hairlines and gutters.
- Extra part `ListView.LoadMore` (RAC `GridListLoadMoreItem`, default child OSS `Spinner size="sm"`),
  inferred from the `.list-view__load-more` rule; not in the docs API tables.
- `ListViewSelectionCell` is exported as a named component (not on the compound) for custom rows.
- The `:last-child` rules (Pro's) do not match the last real row while a `LoadMore` sentinel is
  rendered after it.

### Independent review (second pass)
- Measured all 5 Pro demos against the stories in light and dark mode: row heights (63/62, 45/44), padding,
  gaps, radii (20 tray / 16 rows), hairline colour, surface / surface-secondary, muted icon and text,
  checkbox variant per list variant, hover (`surface/40`, `default/50`), selected (`surface/10`,
  `accent-soft`), selected + hover (`accent-soft-hover`), keyboard focus ring (inset 2px `--focus`),
  disabled row (opacity .5, `not-allowed`, nested checkbox opacity .5) and the ActionBar markup. They are
  identical after colour normalisation. Keyboard behaviour also matches: Tab into the row, Space toggles,
  End / Shift+Arrow extends the range, Escape clears, and in single mode a click on the selected row clears it.
- Theme check: `--radius: 1rem` gives a 40px tray and 32px end rows, `--accent` drives the secondary
  selection and the focus ring, and `--font-sans` reaches the title and description.
- Pro CSSOM detail: the radius rules are guarded with `:not([data-virtualized])`, but the
  `:last-child { border-bottom-width: 0 }` rules are not. In a virtualized Pro list every row sits alone in its
  RAC wrapper, so Pro presumably drops every divider there. We keep the dividers instead (see the deviation
  above). There is no Pro demo to confirm either behaviour.
- The LoadMore story unmounts `ListView.LoadMore` once every page is loaded, so the sentinel no longer
  blocks the `:last-child` end styles on the final row.

## 8. Dependencies

`@heroui/react` (Checkbox, Spinner; stories: Button, Chip, Separator), `react-aria-components`
(GridList, Virtualizer/ListLayout, composeRenderProps), Pro `ActionBar` (story only). No heavy peer →
root export allowed.
