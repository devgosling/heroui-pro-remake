# Resizable — clean-room implementation spec

Slug: `resizable` · Docs: https://heroui.pro/docs/react/components/resizable · Category: Layout
Import (Pro): `import {Resizable} from "@heroui-pro/react/resizable";` (subpath only)
`createCookieStorage` is imported from the Pro package root (`@heroui-pro/react`).

Sources used: the public docs text, the rendered DOM and CSSOM of the 7 public demo pages (light + dark),
computed styles, runtime probing (pointer drag, hover, keyboard, double click, viewport resize, collapse
button), and the `react-resizable-panels` 4.24.1 package installed in this repo. I did not open or try to
get around the paywalled example source.

Tooling note: the shared built-in browser pane was at its tab cap for the whole session, so I ran the
live analysis in an isolated headless Microsoft Edge (Playwright from `packages/testing`, fresh profile,
no sign-in) that loaded the same public pages.

---

## 1. Purpose

Resizable panel groups (split panes) with composable separators ("handles"). Built on
`react-resizable-panels` (v4 API: `Group` / `Panel` / `Separator`) and styled with HeroUI tokens.
`AppLayout` (later wave) also uses it, so the peer is a standard (required) Pro peer.

---

## 2. Anatomy

```tsx
<Resizable>                       // rrp Group
  <Resizable.Panel />             // rrp Panel
  <Resizable.Handle>              // rrp Separator
    <Resizable.Indicator />       // optional custom grip
  </Resizable.Handle>
  <Resizable.Panel />
</Resizable>
```

| Part | Rendered element | `data-slot` | BEM class(es) | Other attributes |
|---|---|---|---|---|
| `Resizable` | `<div data-group id data-testid style="height:100%;width:100%;overflow:hidden;display:flex;flex-direction:row\|column;flex-wrap:nowrap;touch-action:pan-y\|pan-x">` | `resizable` | `resizable resizable--{horizontal\|vertical}` | `id` = `id` prop or `useId` |
| `Resizable.Panel` (outer, flex item) | `<div data-panel id data-testid style="…flex: <size> 1 0px…">` | `resizable-panel` | (none) | `data-disabled` when disabled |
| `Resizable.Panel` (inner content box) | `<div style="max-height:100%;max-width:100%;flex-grow:1;overflow:auto;touch-action:…">` | – | `resizable__panel` (+ `className`) | rrp puts `className`/`style` on this nested div |
| `Resizable.Handle` | `<div role="separator" tabindex="0" aria-orientation aria-controls aria-valuemin/max/now aria-label="Resize handle">` | `resizable-handle` | `resizable__handle resizable__handle--{horizontal\|vertical} resizable__handle--{line\|drag\|pill\|handle} resizable__handle--{primary\|secondary\|tertiary}` | `data-type`, `data-variant`, `data-separator="inactive\|hover\|active\|focus\|disabled"` (rrp) |
| `Resizable.Indicator` | `<span aria-hidden="true">` | `resizable-handle-indicator` | `resizable__handle-indicator resizable__handle-indicator--{pill\|drag}` | – |
| drag icon | `<svg viewBox="0 0 16 16" width=16 height=16 fill="currentColor">` (six dots) | `resizable-handle-indicator-icon` | `resizable__handle-indicator-icon` | – |

Notes
- Handle orientation class is the **group** orientation (`resizable__handle--horizontal` in a horizontal
  group), while rrp sets `aria-orientation` to the opposite (the line is vertical).
- No `data-orientation` attribute anywhere. The root has no `data-slot` on the inner panel div.
- Indicator rules observed in the DOM:
  - `type="line"`: no indicator (unless `withIndicator`).
  - `type="line" withIndicator`: **pill** indicator (`resizable__handle-indicator--pill`), although the docs
    prose says "drag dots". The live demo renders a 6×32 pill.
  - `type="drag"`: drag indicator with the six-dot icon.
  - `type="pill"` and `type="handle"`: pill indicator.
  - Children of `Resizable.Handle` replace the default indicator.

---

## 3. API (from docs)

### `Resizable` (group)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | |
| `autoSaveId` | `string` | – | persists sizes to storage under `react-resizable-panels:<autoSaveId>` as `{"panelId": pct}` |
| `onLayout` | `(sizes: number[]) => void` | – | fires on every layout change, including while dragging |
| `storage` | `LayoutStorage` | `localStorage` | SSR-safe persistence (`createCookieStorage()`) |
| `id` | `string` | – | required for nested groups |
| `handleRef` | `Ref<ImperativePanelGroupHandle>` | – | `getLayout()`, `setLayout()` |

### `Resizable.Panel`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `defaultSize` / `minSize` / `maxSize` / `collapsedSize` | `number \| string` | – | **numbers are percentages** (rrp v4 treats numbers as px), strings take CSS units |
| `collapsible` | `boolean` | `false` | |
| `groupResizeBehavior` | `"preserve-relative-size" \| "preserve-pixel-size"` | `"preserve-relative-size"` | |
| `id` | `string` | – | required with `autoSaveId` + `collapsible` |
| `order` | `number` | – | v2 API compatibility (render order) |
| `onCollapse` / `onExpand` | `() => void` | – | |
| `onResize` | `(panelSize: PanelSize, id?: string \| number, prevPanelSize?: PanelSize) => void` | – | rrp v4 signature |

The "Collapsible Panels" section says "Use `handleRef` for imperative collapse/expand", so the panel also
takes a `handleRef` (`collapse`, `expand`, `isCollapsed`, `getSize`, `resize`).

### `Resizable.Handle`
| Prop | Type | Default |
|---|---|---|
| `type` | `"line" \| "drag" \| "pill" \| "handle"` | `"line"` |
| `variant` | `"primary" \| "secondary" \| "tertiary"` | `"primary"` |
| `withIndicator` | `boolean` | – |
| `disabled` | `boolean` | `false` |
| `onDragging` | `(isDragging: boolean) => void` | – |

### `Resizable.Indicator`
| Prop | Type | Default |
|---|---|---|
| `type` | `"pill" \| "drag"` | `"pill"` |
| `children` | `ReactNode` | – (overrides the default affordance) |

### `createCookieStorage()`
Returns a cookie-backed `LayoutStorage`; reads fall back to `localStorage`, writes go to both the cookie and
`localStorage`. Next.js pattern: read the `react-resizable-panels:<autoSaveId>` cookie on the server, parse
the JSON (`{"sidebar":30,"main":70}`) and pass the values as `defaultSize` props.

---

## 4. Styling (observed CSSOM, all in `@layer components`)

Root variables (`.resizable`):

| Variable | Value | Token mapping used here |
|---|---|---|
| `--resizable-handle-size` | `1px` | |
| `--resizable-handle-hit-area` | `8px` | |
| `--resizable-handle-color` | `var(--color-separator)` | `var(--separator)` |
| `--resizable-handle-color-hover` | `var(--color-separator-secondary)` | `var(--separator-secondary)` |
| `--resizable-handle-color-active` | `var(--color-accent-soft)` | `var(--accent-soft)` |
| `--resizable-indicator-pill-width` | `6px` | |
| `--resizable-indicator-pill-height` | `32px` | |
| `--resizable-indicator-radius` | `var(--radius-full, 9999px)` | `9999px` |
| `--resizable-indicator-drag-radius` | `var(--radius-sm, 6px)` (= 4px with `--radius: .5rem`) | `calc(var(--radius) * 0.5)` |
| `--resizable-indicator-drag-bg` / `-bg-hover` | `var(--color-default)` / `var(--color-default-hover)` | `var(--default)` / `var(--default-hover)` |
| `--resizable-indicator-drag-fg` / `-fg-hover` | `var(--color-muted)` / `var(--color-foreground)` | `var(--muted)` / `var(--foreground)` |
| `--resizable-indicator-drag-long` / `-short` | `20px` / `13px` | |
| `--resizable-indicator-drag-icon-size` | `10px` | |
| `--resizable-transition-duration` | `.12s` | `120ms` |

The docs also list `--resizable-indicator-drag-size: 12px`, but the shipped CSS does not declare or use it
(the chip is sized by `-drag-long`/`-drag-short`, the icon by `-drag-icon-size`). Not declared here either.

Rules
- `.resizable`: `display:flex; width/height:100%; min-width/min-height:0`; `--horizontal` row, `--vertical` column.
- `.resizable__panel`: `position:relative; min-width/min-height:0; overflow:hidden` (rrp's inline `overflow:auto` wins).
- `.resizable__handle`: `position:relative; display:flex; flex:0 0 auto; align/justify center; background-color: var(--resizable-handle-color); touch-action:none; user-select:none; outline:none; tap-highlight transparent; transition: background-color var(--resizable-transition-duration) ease`.
  - `--horizontal`: `width: var(--resizable-handle-size); cursor: col-resize`; `--vertical`: `height: …; cursor: row-resize`.
  - `::before` hit area: `content:""; position:absolute; transparent`, inset `0` along the line and `(size - hit-area)/2` (= −3.5px) across it → 8px wide grab zone.
  - hover (`@media (hover:hover)`, `:hover`, `[data-separator="hover"]`, `[data-hovered="true"]`) → `--resizable-handle-color-hover`.
  - active (`[data-separator="active"]`, `:active`, `[data-pressed="true"]`) → `--resizable-handle-color-active`.
  - focus (`:focus-visible:not([data-focused])`, `[data-focus-visible="true"]`) → HeroUI focus ring (`status-focused`: 2px `--focus` ring with `--ring-offset-width` offset in `--background`).
  - disabled (`:disabled`, `[aria-disabled="true"]`, `[data-disabled]`) → `opacity: var(--disabled-opacity); pointer-events:none; cursor:default`.
  - `--primary|secondary|tertiary` set `--resizable-handle-color` to `separator`, `separator-secondary`, `separator-tertiary`.
  - `--handle`: transparent background in rest, hover and active states.
- `.resizable__handle-indicator`: `position:absolute; top/left:50%; transform: translate(-50%,-50%); z-index:1; display:flex; centred; pointer-events:none`.
- `--pill`: `6×32` (swapped in vertical handles), radius full, `background: var(--color-default)`, transition `background-color, transform` 120ms ease. Hover/active of `--pill` and `--handle` handles → `default-hover` (no change for a line handle with `withIndicator`).
- `--drag`: `inline-flex`, `13×20` (horizontal) / `20×13` (vertical), radius 4px, bg `default`, color `muted`, transition `background-color, color` 120ms ease; hover of a `--drag` handle → bg `default-hover`, color `foreground`.
- `.resizable__handle-indicator-icon`: `display:block; 10×10`.
- `@media (prefers-reduced-motion: reduce)`: `transition:none` on handle and indicators.

Dark mode: only the tokens change (`--separator` lab 12.9, `--default` lab 15.7, `--muted` lab 65.6 …). Computed
colours of the remake match Pro numerically in both themes (e.g. hover `oklab(0.8815…)`, active
`accent-soft`).

---

## 5. Behaviour (probed)

- Pointer drag: `data-separator` goes `inactive → hover → active`; rrp injects an adopted stylesheet
  `*, :hover { cursor: ew-resize !important }` while hovering/dragging (same library behaviour in the remake).
- Keyboard (rrp): Arrow Left/Right in horizontal groups, Up/Down in vertical, 5% steps; Home → min, End → max;
  Enter toggles collapse of a collapsible panel; double click resets to the default size.
- Collapsible demo: sidebar `defaultSize 25, minSize 15, collapsedSize 0` (`aria-valuemin` 0). Keyboard: 25 → 20
  → 15 → 0 (collapses). Button "Collapse sidebar" collapses instantly (no animation) and its label flips to
  "Expand sidebar"; dragging below the threshold flips it too (state is driven by `onCollapse`/`onExpand`).
- Default demo: sidebar `defaultSize="180px" minSize="140px" maxSize="260px" groupResizeBehavior="preserve-pixel-size"`
  (percentages are relative to the group size minus separators: 180/1197 = 15.038%). Shrinking the viewport
  from 1280 to 800px keeps it at 180px.
- Transitions: only `background-color 120ms ease` on the handle (`getAnimations()`).
- Pointer focus (reviewed and measured): in Pro the separator is focused on pointer down and shows the focus
  ring while dragged (`data-separator="active"` + ring), after release (`data-separator="focus"` + ring) and
  after the pointer leaves, until something else is clicked. A plain click (no move) also leaves it focused
  with the ring. rrp 4.24.1 differs in two ways: it calls `focus({focusVisible:false})` (so `:focus-visible`
  does not match), and it blurs the separator after a drag that moved. The remake matches Pro by (a) adding
  `[data-separator="focus"]` and `[data-separator="active"]:focus` to the focus-ring selectors, and (b)
  restoring focus in `Resizable.Handle` when the library blurred a separator that was focused during the
  drag (same MutationObserver as `onDragging`). Verified against the types demo in light and dark: same
  focused / ring / background in every phase.

---

## 6. Demos (one story each)

| Pro demo | Story | Structure |
|---|---|---|
| `resizable-default` | `Default` | 400px frame (`bg-background border rounded-xl`), px sidebar (preserve-pixel-size) + main, line handle |
| `resizable-vertical` | `Vertical` | vertical group, 60 / 40, both `minSize 20` |
| `resizable-types` | `HandleTypes` | 4 captioned 200px frames: line, drag, pill, handle; `bg-surface` left panel; 50/50 min 20 |
| `resizable-variants` | `Variants` | 3 captioned 180px frames on `bg-background` / `bg-surface` / `bg-surface-secondary` with `primary` / `secondary` / `tertiary` |
| `resizable-with-indicator` | `WithIndicator` | 40 (min 15, surface) / 60, `withIndicator` line handle |
| `resizable-nested` | `NestedGroups` | 500px frame; 25 (min 15) sidebar + vertical group 65 (min 20) / 35 (min 15, surface-secondary) |
| `resizable-with-collapse` | `CollapsiblePanels` | OSS `Button size="sm" variant="secondary"` toggle above a 400px frame; collapsible 25/15/0 panel driven by `handleRef` |

Extra stories for documented features without a demo: `SizeUnits`, `PersistedSizes` (`autoSaveId` + `onLayout`),
`CustomIndicator` (composed `Resizable.Indicator` + `onDragging`).

---

## 7. Dependencies

- `react-resizable-panels` 4.x (Group, Panel, Separator, types). Subpath-only export.
- `@heroui/react` `Button` (stories only), `@iconify/react` (stories only).
- No OSS HeroUI component is rendered by the component itself (the Pro DOM contains none).

---

## 8. Implementation notes / deviations

- `Resizable` maps `ref` → rrp `elementRef`, `handleRef` → `groupRef`, `onLayout` → `onLayoutChange` (values in
  panel order). Other rrp Group props (`disabled`, `defaultLayout`, `onLayoutChanged`, `resizeTargetMinimumSize`, …)
  pass through.
- `autoSaveId` uses its own SSR-safe persistence (same key/value format as rrp's `useDefaultLayout`), because
  rrp's hook defaults to `localStorage` and throws on the server.
- Numbers for `defaultSize` / `minSize` / `maxSize` / `collapsedSize` / `collapsedThreshold` become `"<n>%"`.
- `onCollapse` / `onExpand` fire on transitions only (not on mount), derived from `onResize` + `isCollapsed()`.
- `order` is accepted and ignored (rrp v4 orders panels by DOM position).
- Panel accepts both `handleRef` (Pro) and `panelRef` (rrp v4 name).
- `onDragging` observes `data-separator="active"` with a `MutationObserver`.
- `Resizable.Indicator` with custom children and no explicit `type` omits the shape modifier, so custom content is
  not boxed into the pill (Pro behaviour for that case is not observable in the demos).
- Vertical handles with a drag indicator use a horizontal (3×2) dot grid; no Pro demo shows this case.
- Focus ring on pointer down/drag and focus kept after a drag: matched to Pro on top of rrp 4.24.1, see §5.
- Pro's rrp build also sets `data-testid` (= the auto id) on group, panels and separators; rrp 4.24.1 only
  sets it for an explicit `id`. Not reproduced (test-only attribute, no visual or behavioural effect).
- `createCookieStorage()` lives in `resizable/create-cookie-storage.ts` and has no rrp runtime import, so it can be
  re-exported from the package root (Pro exports it from the root); for now it is exported from the subpath only.

---

## Appendix A — raw CSSOM (reference only, not the implementation)

```
.resizable { --resizable-handle-size: 1px; --resizable-handle-hit-area: 8px; --resizable-handle-color: var(--color-separator); --resizable-handle-color-hover: var(--color-separator-secondary); --resizable-handle-color-active: var(--color-accent-soft); --resizable-indicator-pill-width: 6px; --resizable-indicator-pill-height: 32px; --resizable-indicator-drag-radius: var(--radius-sm,6px); --resizable-indicator-drag-bg: var(--color-default); --resizable-indicator-drag-bg-hover: var(--color-default-hover); --resizable-indicator-drag-fg: var(--color-muted); --resizable-indicator-drag-fg-hover: var(--color-foreground); --resizable-indicator-drag-long: 20px; --resizable-indicator-drag-short: 13px; --resizable-indicator-drag-icon-size: 10px; --resizable-indicator-radius: var(--radius-full,9999px); --resizable-transition-duration: .12s; width: 100%; min-width: 0px; height: 100%; min-height: 0px; display: flex; }
.resizable--horizontal { flex-direction: row; }
.resizable--vertical { flex-direction: column; }
.resizable__panel { min-width: 0px; min-height: 0px; position: relative; overflow: hidden; }
.resizable__handle { outline-style: none; -webkit-tap-highlight-color: transparent; background-color: var(--resizable-handle-color); cursor: var(--cursor-interactive,col-resize); touch-action: none; user-select: none; transition: background-color var(--resizable-transition-duration) ease; flex: 0 0 auto; justify-content: center; align-items: center; display: flex; position: relative; }
.resizable__handle--horizontal { width: var(--resizable-handle-size); cursor: col-resize; }
.resizable__handle--vertical { height: var(--resizable-handle-size); cursor: row-resize; }
.resizable__handle::before { content: ""; background: 0px 0px; position: absolute; }
.resizable__handle--horizontal::before { top: 0; bottom: 0; left/right: calc((var(--resizable-handle-size) - var(--resizable-handle-hit-area)) / 2); }
.resizable__handle--vertical::before { left: 0; right: 0; top/bottom: calc((var(--resizable-handle-size) - var(--resizable-handle-hit-area)) / 2); }
.resizable__handle--primary|secondary|tertiary { --resizable-handle-color: var(--color-separator|-secondary|-tertiary); }
@media (hover: hover) { .resizable__handle:hover, [data-separator="hover"], [data-hovered="true"] { background-color: var(--resizable-handle-color-hover); } }
.resizable__handle[data-separator="active"], :active, [data-pressed="true"] { background-color: var(--resizable-handle-color-active); }
.resizable__handle:focus-visible:not([data-focused]), [data-focus-visible="true"] { focus ring (2px --focus, offset --ring-offset-width in --background) }
.resizable__handle:disabled, [aria-disabled="true"], [data-disabled] { opacity: var(--disabled-opacity); pointer-events: none; cursor: default; }
.resizable__handle-indicator { pointer-events: none; z-index: 1; justify-content: center; align-items: center; display: flex; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.resizable__handle-indicator--pill { width: var(--resizable-indicator-pill-width); height: var(--resizable-indicator-pill-height); border-radius: var(--resizable-indicator-radius); background-color: var(--color-default); transition: background-color .12s ease, transform .12s ease; }
.resizable__handle--vertical .resizable__handle-indicator--pill { width/height swapped }
@media (hover: hover) { .resizable__handle--pill|--handle (:hover, [data-separator="hover"], [data-hovered="true"]) .resizable__handle-indicator--pill { background-color: var(--color-default-hover); } }
.resizable__handle--pill|--handle ([data-separator="active"], :active) .resizable__handle-indicator--pill { background-color: var(--color-default-hover); }
.resizable__handle-indicator--drag { border-radius: var(--resizable-indicator-drag-radius); background-color: var(--resizable-indicator-drag-bg); color: var(--resizable-indicator-drag-fg); transition: background-color .12s ease, color .12s ease; display: inline-flex; centred }
.resizable__handle-indicator-icon { width/height: var(--resizable-indicator-drag-icon-size); display: block; }
.resizable__handle--horizontal .resizable__handle-indicator--drag { width: var(--resizable-indicator-drag-short); height: var(--resizable-indicator-drag-long); }
.resizable__handle--vertical .resizable__handle-indicator--drag { width: var(--resizable-indicator-drag-long); height: var(--resizable-indicator-drag-short); }
@media (hover: hover) { .resizable__handle--drag (:hover, [data-separator="hover"], [data-hovered="true"]) .resizable__handle-indicator--drag { background-color: var(--resizable-indicator-drag-bg-hover); color: var(--resizable-indicator-drag-fg-hover); } }
.resizable__handle--handle (rest, hover, active) { background-color: transparent; }
@media (prefers-reduced-motion: reduce) { .resizable__handle, .resizable__handle-indicator, …--pill, …--drag { transition: none; } }
```

## Appendix B — key metrics (1280px viewport, demo padding 40px, group 1198×398)

| Element | Pro | Remake |
|---|---|---|
| line handle | 1px wide, full height, `::before` 8px (−3.5px each side) | same |
| pill indicator | 6×32, radius 9999px, bg `default` | same |
| drag chip | 13×20, radius 4px, icon 10×10, bg `default`, fg `muted` | same |
| hover / active line | `separator-secondary` / `accent-soft` | same (numerically equal) |
| keyboard step | 5% | 5% |
| default demo sidebar | 180px (15.038%), min 140px, max 260px, pixel preserved | same |
