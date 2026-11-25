# File Tree — clean-room implementation spec

Slug: `file-tree` · Docs: https://heroui.pro/docs/react/components/file-tree · Category: Data Display
Storybook title (remake): `Pro/DataDisplay/FileTree`
Import (Pro): `import {FileTree} from "@heroui-pro/react";`

Sources used: the public docs page text, the server-rendered DOM of the 10 public demo pages
(`/docs/react/demos/file-tree-*?theme=light|dark`), the public stylesheet rules (CSSOM) that the
demo pages load, and the OSS react-aria-components 1.22 / HeroUI sources in this repo (to tell which
DOM comes from React Aria Components (RAC) and which classes are OSS components). The paywalled
example source was not opened.

---

## 1. Purpose

A hierarchical file explorer: expand/collapse folders (animated), optional file/folder icons, indent
guide lines, three sizes, multi-selection with checkboxes, drag-and-drop reordering/moving, sections
with headers, a custom expand indicator and a `reduceMotion` switch.

---

## 2. Anatomy

```tsx
<FileTree aria-label="Files">                       // RAC Tree (role="treegrid")
  <FileTree.Section>                                // optional, RAC TreeSection
    <FileTree.Header>Project</FileTree.Header>      // optional, RAC TreeHeader
    <FileTree.Item id="src" title="src">            // RAC TreeItem + TreeItemContent
      <FileTree.Indicator />                        // optional custom chevron icon for this item
      <FileTree.Item id="index" title="index.ts" /> // nested items (or a RAC <Collection>)
    </FileTree.Item>
  </FileTree.Section>
</FileTree>
```

Rendered DOM of one row (md, level 3, inside a tree with drag + toggle selection):

```html
<div data-slot="file-tree-item" role="row" aria-level="3" aria-expanded="true"
     class="file-tree__item file-tree__item--md" style="--tree-item-level:3"
     data-expanded="true" data-has-child-items="true" data-level="3"
     data-selection-mode="multiple" data-allows-dragging="true" draggable="true">
  <div role="gridcell" aria-colindex="1" style="display:contents">
    <div class="file-tree__item-content" data-slot="file-tree-item-content">
      <!-- one guide line per ancestor level (level - 1) -->
      <div aria-hidden="true" class="file-tree__guide-line [--hover|--none]" data-slot="file-tree-guide-line"
           style="inset-inline-start:calc(var(--file-tree-item-px) + var(--file-tree-chevron-offset, 0px) + 0 * var(--file-tree-indent) + var(--file-tree-indent) / 2)"></div>
      <div aria-hidden="true" class="file-tree__guide-line" … 1 * var(--file-tree-indent) …></div>
      <!-- only when the tree allows dragging and dragIcon !== false -->
      <button slot="drag" class="file-tree__drag-handle" data-slot="file-tree-drag-handle"
              aria-label="Drag src" style="pointer-events:none"><svg …grip-vertical…/></button>
      <!-- only when selectionMode !== "none" and selectionBehavior === "toggle" -->
      <span class="file-tree__checkbox" data-slot="file-tree-checkbox">
        <div data-slot="checkbox" class="checkbox checkbox--primary" slot="selection">  <!-- OSS Checkbox -->
          <label data-slot="checkbox-content" class="checkbox__content">…hidden input…
            <span class="checkbox__control"><span class="checkbox__indicator">…</span></span>
          </label>
        </div>
      </span>
      <!-- always rendered (also for leaves: visibility hidden) -->
      <button slot="chevron" class="file-tree__chevron" tabindex="-1" aria-label="Collapse|Expand">
        <svg class="file-tree__indicator" data-slot="file-tree-indicator">…chevron-right…</svg>
      </button>
      <!-- only when the resolved icon is not null -->
      <span class="file-tree__icon" data-slot="file-tree-icon"><svg/></span>
      <span class="file-tree__label" data-slot="file-tree-label">src</span>
    </div>
  </div>
</div>
<!-- the child rows of an expanded item are wrapped (not in reduceMotion mode) -->
<div data-tree-motion-section="" role="presentation" style="height:auto;opacity:1;overflow:visible">
  …child rows (and their own motion sections)…
</div>
```

| Part | Element | `data-slot` | BEM class | Primitive |
|---|---|---|---|---|
| `FileTree` | `div[role=treegrid]` (wrapped by RAC FocusScope sentinels) | `file-tree` | `file-tree file-tree--{sm\|md\|lg}` | RAC `Tree` |
| `FileTree.Item` | `div[role=row]` | `file-tree-item` | `file-tree__item file-tree__item--{size}` | RAC `TreeItem` |
| content | `div` | `file-tree-item-content` | `file-tree__item-content` | `TreeItemContent` render |
| guide line | `div[aria-hidden]` × (level-1) | `file-tree-guide-line` | `file-tree__guide-line` + `--hover` / `--none` | — |
| drag handle | `button[slot=drag]` | `file-tree-drag-handle` | `file-tree__drag-handle` | RAC `Button` (drag slot) |
| checkbox wrapper | `span` | `file-tree-checkbox` | `file-tree__checkbox` | OSS `Checkbox` `slot="selection"` |
| chevron | `button[slot=chevron]` | *(none in Pro; remake adds `file-tree-chevron`)* | `file-tree__chevron` | RAC `Button` (chevron slot) |
| `FileTree.Indicator` | `svg` (or the custom child, classes merged in) | `file-tree-indicator` | `file-tree__indicator` | — |
| icon | `span` | `file-tree-icon` | `file-tree__icon` | — |
| label | `span` | `file-tree-label` | `file-tree__label` | — |
| `FileTree.Section` | `div[role=rowgroup]` | `file-tree-section` (remake) | `file-tree__section` | RAC `TreeSection` |
| `FileTree.Header` | header row | `file-tree-section-header` (remake) | `file-tree__section-header` | RAC `TreeHeader` |
| motion section | `div[role=presentation][data-tree-motion-section]` | — | — | own collection renderer |

Notes
- Root carries only RAC attributes: `data-rac`, `role="treegrid"`, `tabindex`, `aria-multiselectable`,
  `data-selection-mode`, `data-allows-dragging`, `data-empty`, `data-focused`, `data-focus-visible`.
  No `data-reduce-motion`, no guide-line attribute (the guide mode is a class on each guide line).
- Row attributes are RAC's: `data-expanded`, `data-has-child-items`, `data-level`, `data-selected`,
  `data-disabled`, `data-hovered`, `data-focused`, `data-focus-visible`, `data-pressed`,
  `data-selection-mode`, `data-allows-dragging`, `data-dragging`, `data-drop-target`, plus the
  default inline style `--tree-item-level`.
- `FileTree.Indicator` is declared as a child of an item; the item lifts it into its own chevron
  (only for that item — Custom Indicator demo repeats it on every folder).
- The chevron is rendered for leaves too (RAC labels it "Expand"); CSS hides it with
  `visibility:hidden` so labels stay aligned.
- Icon slot: when an item has no `icon` prop, Pro still renders an EMPTY `span.file-tree__icon` for folders
  (rows with child items) and nothing for files (Default, Multiple Selection, Dynamic Collection and
  Reduced Motion demos, both SSR and after hydration). The empty span adds one 2px flex gap before the
  label. With an `icon` prop the span is rendered when the resolved icon is not `null`/`false`.

---

## 3. API (from docs)

### `FileTree`
"The root tree container. Renders a `<div role="treegrid">` internally." Also supports all RAC Tree props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `reduceMotion` | `boolean` | `false` | Disables expand/collapse animation. The user's reduced-motion preference is still respected. |
| `showGuideLines` | `boolean \| "hover"` | `true` | `true` = always, `false` = never, `"hover"` = on tree hover only |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Item padding, font size and indent width |

### `FileTree.Item` (+ all RAC TreeItem props)

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | – | Label content. Required. (Used as `textValue` when it is a string.) |
| `icon` | `ReactNode \| ((props: FileTreeItemRenderProps) => ReactNode)` | – | Icon before the label; render fn gets `{isExpanded, hasChildItems, allowsDragging, …}` |
| `dragIcon` | `ReactNode \| false` | `<GripVertical />` | Drag handle icon when dragging is allowed; `false` hides the handle |

### `FileTree.Indicator`

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Custom icon element; replaces the default chevron |
| `className` | `string` | Additional classes |

### `FileTree.Section` / `FileTree.Header` — all RAC TreeSection / TreeHeader props.

### `useFileTree({items, isLeaf?})` → `{expandableKeys, filterTree, leaves}`
- `items: TreeNode[]` (each node has `id` and optional `children`)
- `isLeaf` default `!children || children.length === 0`
- `expandableKeys`: all branch keys (for `defaultExpandedKeys`)
- `filterTree(predicate)`: keeps matching leaves, prunes empty branches
- `leaves`: all leaves, flattened

### `useFileTreeDrag({tree, getItems?, onMove?})` → `{dragAndDropHooks}`
- wires RAC `useDragAndDrop` to a `useTreeData` tree: before/after → `moveBefore`/`moveAfter`,
  on → `move` into the target as last children; then calls `onMove(keys, {key, dropPosition})`.
- `getItems` default: each key serialized as `text/plain`.

---

## 4. Styling (observed CSSOM, mapped to tokens)

Root `.file-tree`: `scrollbar` utility, `p-1`, `outline-none`, `forced-color-adjust:none`, `flex flex-col`,
`overflow:auto`. Variables: `--file-tree-guide-color: color-mix(in srgb, currentColor 10%, transparent)`,
`--file-tree-chevron-offset: 0px` (22px when the tree has drag handles and no checkboxes).

| Size | `--file-tree-indent` | `--file-tree-item-px` | item padding | font | icon svg | row height |
|---|---|---|---|---|---|---|
| sm | `spacing*2.5` (10px) | 10px | `px-1.5 py-0.5` | `text-xs` | 14px | 24px |
| md | `spacing*3` (12px) | 12px | `px-2 py-1` | `text-sm` | 16px | 28px |
| lg | `spacing*6` (24px) | 8px | `px-2.5 py-1.5` | `text-base` | 20px | 36px |

(The base `.file-tree` rule in Pro declares 16px / 8px but `--md` always overrides it; the remake puts
the md values in the base and leaves `--md` empty.)

- Item: `relative flex items-center rounded-lg (radius×1) text-foreground outline-none`, interactive cursor.
  - hover (`@media (hover:hover)`, `:hover`/`[data-hovered=true]`, but not while the chevron is hovered): `bg-default`
  - pressed (`:active`/`[data-pressed=true]`): `bg-default-hover`
  - focus visible: focus ring (`status-focused`); disabled: `status-disabled`
  - selected: `bg-default`; adjacent selected rows lose the shared corner radii
  - `[data-dragging]`: opacity .4 · `[data-drop-target]`: `bg-accent-soft` + `outline: 2px solid accent; outline-offset:-2px`
- Item content: `flex w-full items-center gap-0.5`, `padding-inline-start: (level-1) × indent`.
- Guide line: `absolute inset-y-0 w-px pointer-events-none select-none`, bg `--file-tree-guide-color`;
  `--hover`: opacity 0 → 1 on `.file-tree:hover` (transition opacity 150ms ease); `--none`: hidden.
- Chevron: `size-5 rounded-md (radius×0.75) invisible flex center`; visible + interactive cursor with
  `[data-has-child-items]`; hover `bg-default-hover`.
- Indicator: `size-3.5 text-muted`, `transition: rotate 150ms ease`, `rotate-90` when expanded, `rtl:rotate-180`.
- Icon: `text-muted flex center shrink-0`, svg size per item size.
- Label: `flex-1 truncate px-0.5 text-foreground select-none`.
- Section: `mt-3` when not first; header: `px-3 py-1.5 text-xs font-medium text-muted select-none`.
- Drag handle: `size-5 text-muted opacity-0 cursor-grab` (grabbing while active), svg 12px,
  transition opacity 150ms; row hover → .4, handle hover → .7.
- RAC drop indicator: outline none; when target: `outline 1px solid accent`.
- Empty (`[data-empty]`): centered italic muted `text-sm`, `py-6`, `min-height:100px`.
- Dark mode: no component-specific overrides; everything follows tokens (`--default`, `--default-hover`,
  `--muted`, `--foreground`, `--accent`, `--accent-soft`, `--focus`).

---

## 5. Behaviour

- Keyboard / focus / typeahead / selection / expansion: RAC Tree (ArrowUp/Down, ArrowRight expand /
  ArrowLeft collapse, Home/End, type-to-select, Space/Enter select).
- Press on a folder row with `selectionMode="none"` toggles expansion (RAC); leaves are not pressable then
  (no `data-react-aria-pressable`), CSS `:hover` still paints the hover background.
- Expand/collapse animation: the child rows of every expanded item live in a
  `div[data-tree-motion-section]`. Entering: height 0→content and opacity 0→1; exiting: height→0 and
  opacity→0, then unmounted. Collapsed items render no section. Resting inline style
  `height:auto;opacity:1;overflow:visible` (same as Pro). `reduceMotion` uses RAC's default renderer
  (flat rows, no sections) — matches the Reduced Motion demo DOM. The OS `prefers-reduced-motion: reduce`
  setting does the same in Pro (flat rows, no sections; Pro even logs a hydration mismatch because SSR
  rendered sections) — the remake switches renderers via `useSyncExternalStore` (server snapshot = sections).
  In both cases the indicator rotation still uses its CSS transition in Pro (see deviations).
- Timings (review pass: inline-style tweens logged with a MutationObserver over 5 runs × 2 section heights,
  WAAPI animations read with `getAnimations()`, pooled least-squares fit with a per-run start offset):
  - enter opacity: WAAPI 0 → 1, 220ms `cubic-bezier(0.16,1,0.3,1)`.
  - enter height: JS tween 0 → measured `auto` height following a **critically damped spring that settles
    at 240ms** (a "duration" spring with bounce 0: `p(t) = 1 − (1 + ωt)·e^(−ωt)`, `ωT ≈ 9.2334`, i.e. 0.1 %
    left at T). Fit RMS 0.0017 (the 220ms expo-out curve the first pass used was off by ~0.2 at 50ms).
    Evidence: the same number of frames for 84px and 224px sections (time-based end, not a rest
    threshold), an exponential tail (remaining distance × ~0.58 per frame), ~0.1 % left on the last frame,
    and the first frame value (1.11213px of 103.87px) equal to the remake's spring sample at 4ms.
    The remake animates it with WAAPI keyframes sampled from that spring (61 offsets, linear between).
  - exit opacity: WAAPI 1 → 0, 100ms `cubic-bezier(0.23,1,0.32,1)`.
  - exit height: JS tween → 0, **180ms `cubic-bezier(0.4,0,1,1)`** (ease-in; fit RMS 0.0018 — ease-in-out
    200ms from the first pass is off by ~0.1), then the section unmounts.
  - Height and opacity start in the same frame. During exit Pro adds `aria-hidden="true"` and
    `pointer-events:none`; `overflow:hidden` only while animating. Indicator rotation 150ms `ease`.
- Quirk kept on purpose: the root is a flex column with `overflow:auto`, so inside a height-limited tree
  (`max-h-[420px]`) an animating section (overflow hidden ⇒ min-height 0) is flex-shrunk; Pro measures the
  target height in that state (e.g. 104px instead of 196px) and jumps to the full height at the end. The
  remake measures the same way, so the motion matches frame for frame.
- Drag and drop: RAC `useDragAndDrop` + `useTreeData`; collapsed folders auto-expand on drag hover (RAC).

---

## 6. Demos (10)

| Demo | Content / props |
|---|---|
| Default | `max-h-[420px] w-80`, monorepo tree (7 root rows), several folders expanded, no `icon` props (empty icon slot on folders) |
| PR File Review | `w-[310px]` column: OSS `SearchField` + icon-only secondary `Button` (bars-descending-align-center) opening a `Dropdown` of file extensions; tree `showGuideLines="hover"`, everything expanded (`useFileTree().expandableKeys`), filtering with `filterTree`; icons folder-open / folder / file-code / file-text |
| With Icons | `w-[300px]`, gravity icons: folder-open/folder, file-code (.ts/.tsx), code (.css), curly-brackets (.json), file-text (.md), gear (.env) |
| Sizes | 3-column grid (`sm`, `md`, `lg` captions, `text-xs text-muted`), same tree, `w-full` |
| Guide Lines | 3-column grid: `always`, `hover`, `none` |
| Multiple Selection | `w-[280px]`, `selectionMode="multiple"` (checkboxes), "Selected: …" paragraph (`text-sm text-muted`) |
| Drag And Drop | `w-[300px]`, `useTreeData` + `useFileTreeDrag`, `selectionMode="multiple"`, drag handles + checkboxes, folder/file-code icons |
| Dynamic Collection | `max-h-[380px] w-[300px]`, `items` + RAC `<Collection>` for children |
| Custom Indicator | `w-[300px]`, `FileTree.Indicator` with gravity `caret-right` on each folder |
| Reduced Motion | Default demo with `reduceMotion` |

---

## 7. Dependencies

- RAC: `Tree`, `TreeItem`, `TreeItemContent`, `TreeSection`, `TreeHeader`, `Button`, `CollectionRendererContext`,
  `DefaultCollectionRenderer`, `useDragAndDrop`, `useTreeData` (types).
- OSS HeroUI: `Checkbox` (Root/Content/Control/Indicator). Stories also use `SearchField`, `Button`,
  `Dropdown`, `Label`.
- Icons: built-in chevron (16px HeroUI chevron-right path) and a grip icon following Lucide
  `grip-vertical` (ISC, attributed). Stories use `@iconify/react` gravity-ui icons.
- No heavy optional peers → root export allowed.

---

## 8. Verification

Every story was compared with its Pro demo (light + dark) via element rects relative to the tree root
(row, guide lines, drag handle, checkbox, chevron, indicator, icon, label): identical for all 10 demos
(the Sizes / Guide Lines stories use a full-width page with 40px padding like the demo page, so the
columns are 384px wide at 1280px as on Pro). Hover, pressed,
chevron hover, selection (incl. merged radii), focus ring, drag handle opacity, drop target / drop
indicator styles, keyboard drag-and-drop results and the expand/collapse motion were compared too.

## 9. Deviations / open points

- Reduced motion: Pro's indicator only gets `animation:none` under reduced motion (the rotate
  transition still runs); the remake follows the HeroUI convention `motion-reduce:transition-none`.
  (With the `reduceMotion` prop both still rotate with the transition, as in the Pro demo.)
- Motion engine: Pro tweens the height on the main thread (inline style per frame); the remake uses
  WAAPI with the same curves, so the inline style stays `height:auto` while it animates.
- An exiting section also gets `inert` (Pro: `aria-hidden` + `pointer-events:none` only).
- The remake adds `data-slot="file-tree-chevron"` to the chevron button and slots on Section/Header
  (Pro renders none on the chevron; no demo shows Section/Header).
- Checkbox visibility rule: `selectionMode !== "none" && selectionBehavior === "toggle"` (docs: "in
  toggle selection mode").
- `useFileTreeDrag` "on" drops are accepted on any item (RAC default without `shouldAcceptItemDrop`);
  extra RAC drag options (e.g. `shouldAcceptItemDrop`, `renderDragPreview`) pass through.
