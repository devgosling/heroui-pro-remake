# Floating TOC: clean-room implementation spec

Slug: `floating-toc` · Docs: https://heroui.pro/docs/react/components/floating-toc · Category: Data display
Import (Pro): `import {FloatingToc} from "@heroui-pro/react";` (root export, no heavy peers)
Storybook title (remake): `Pro/DataDisplay/FloatingTOC`

Sources: the public docs text (anatomy, API tables, styling reference); the rendered DOM, the CSSOM
and computed styles of the 10 public demo pages (light and dark); runtime probing with real pointer
and keyboard input plus MutationObserver timelines; the installed react-aria 3.53 /
react-aria-components 1.22 sources (to see which behaviour comes from RAC `Popover`); the OSS HeroUI
source in this repo. I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A column of thin horizontal bars (one per section) that sits at the edge of a page. Hovering,
focusing or pressing it opens a floating panel listing the sections. The active section is drawn as
a longer accent-coloured bar and as an accent-coloured entry.

The component does **not** track scrolling itself: `active` is a plain prop on `Bar` and `Item`.
None of the 10 demos scroll-spies either: entries set the active state on click, nothing more
(checked by scrolling the in-page demos with rendering enabled).

## 2. Anatomy

```tsx
<FloatingToc>                                   // provider, renders no DOM
  <FloatingToc.Trigger aria-label="Table of contents">   // <span role="button">
    <FloatingToc.Bar active />                  // <span>, line drawn with ::after
    <FloatingToc.Bar level={2} />
  </FloatingToc.Trigger>
  <FloatingToc.Content>                         // RAC Popover, non-modal, portalled
    <FloatingToc.Item active>Overview</FloatingToc.Item>   // native <button>
    <FloatingToc.Item level={2}>Install</FloatingToc.Item>
  </FloatingToc.Content>
</FloatingToc>
```

| Part | Element | `data-slot` | BEM class | Attributes seen in Pro |
|---|---|---|---|---|
| Root | none | none | none | context only |
| Trigger | `<span>` | `floating-toc-trigger` | `floating-toc__trigger` | `role="button" tabindex="0" aria-expanded="true\|false" data-placement="left\|right"` + user `aria-label`. No `aria-haspopup`, no `aria-controls`, no `data-focus-visible` (the ring comes from `:focus-visible`). |
| Bar | `<span>` | `floating-toc-bar` | `floating-toc__bar` | `data-active="true"` only when active; `style="--floating-toc-level:N"` only for nested levels; no `aria-hidden`, no `data-level`. |
| Content | `<div>` inside RAC's portal `<div style="display:contents">` | `floating-toc-content` | `floating-toc__content` | `data-rac dir="ltr" data-placement="left\|right\|…"`, `data-entering`/`data-exiting`; inline position style from RAC (`position:absolute; z-index:100000; max-height:…; --trigger-anchor-point; --trigger-width; top; right\|left`). **No** `role`, no `tabindex`, no underlay, one visually hidden RAC `DismissButton` at the end, FocusScope markers around the portal: this is `isNonModal` (checked against RAC `Popover.mjs`). User `className` is appended (`floating-toc__content w-72 overflow-hidden !p-0`). |
| Item | `<button type="button">` | `floating-toc-item` | `floating-toc__item` | `data-active="true"` when active, `style="--floating-toc-level: N;"` for nested levels. Plain native button: hovering or pressing adds **no** `data-hovered` / `data-pressed`. |

## 3. API (docs)

### FloatingToc (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `placement` | `'left' \| 'right'` | `'right'` | Side of the page. Sets `data-placement` on the trigger and the default content placement (opposite side). |
| `triggerMode` | `'hover' \| 'press'` | `'hover'` | See behaviour. |
| `open` | `boolean` | – | Controlled. |
| `defaultOpen` | `boolean` | – | Uncontrolled initial state. |
| `onOpenChange` | `(open: boolean) => void` | – | |
| `openDelay` | `number` | `200` | ms after pointer enter. `0` opens at once. |
| `closeDelay` | `number` | `300` | ms after pointer / focus leaves. `0` closes at once. |
| `children` | `ReactNode` | – | Trigger and Content. |

### FloatingToc.Trigger
Native `span` attributes (e.g. `aria-label`, `className`).

### FloatingToc.Bar
| Prop | Type | Notes |
|---|---|---|
| `active` | `boolean` | Current section. |
| `level` | `number` | Depth, 1 = top level; deeper levels draw shorter bars. |

### FloatingToc.Content
RAC `Popover` props except `isOpen` and `triggerRef`, plus:
| Prop | Type | Default | Notes |
|---|---|---|---|
| `offset` | `number` | `8` | Distance from the trigger. |
| `placement` | `Placement` | derived | Overrides the root-derived placement (`left` for a right TOC, `right` for a left TOC). |

### FloatingToc.Item
Native `button` attributes plus `active?: boolean` and `level?: number` (indent).

## 4. Styling (Pro CSSOM, `@layer components`, rewritten as Tailwind)

CSS variables (declared on the trigger, except the indent which lives on the content):

| Variable | Default | Use |
|---|---|---|
| `--floating-toc-bar-width` | `16px` | idle bar length |
| `--floating-toc-bar-active-width` | `24px` | active bar length, also the fixed width of every bar slot |
| `--floating-toc-bar-height` | `2px` | idle thickness |
| `--floating-toc-bar-active-height` | `2px` | active thickness, also the slot height (undocumented but present) |
| `--floating-toc-bar-level-step` | `3px` | shortening per level |
| `--floating-toc-bar-gap` | `12px` | gap between bars |
| `--floating-toc-item-indent` | `0.75rem` | extra inline-start padding per level (on `.floating-toc__content`) |
| `--floating-toc-level` | (inline) | set by Bar / Item for level > 1 |

### `.floating-toc__trigger`
`display:inline-flex; flex-direction:column; align-items:flex-end; gap:var(--floating-toc-bar-gap); padding:var(--spacing)` (p-1), `outline:none`, tap highlight transparent, `cursor:var(--cursor-interactive)`.
`[data-placement="left"]` → `align-items:flex-start`. Focus: `:focus-visible:not([data-focused]), [data-focus-visible="true"]` → OSS focus ring (2px `--focus` ring over a `--ring-offset-width` offset in `--background`), no radius on the trigger.
Measured: 6 bars → 32×80, 5 bars → 32×66, 19 bars → 32×262, 20 bars → 32×276.

### `.floating-toc__bar`
Slot: `display:flex; align-items:center; justify-content:flex-end; width:var(--floating-toc-bar-active-width); height:var(--floating-toc-bar-active-height)`; `[data-placement="left"] > .floating-toc__bar` → `justify-content:flex-start`.
`::after`: `content:""; display:block; border-radius:calc(var(--radius)*.5)` (rounded-sm = 4px), `background:var(--border)`, `transition: all .15s` (default Tailwind easing `cubic-bezier(.4,0,.2,1)`), `width: calc(var(--floating-toc-bar-width) - (var(--floating-toc-level,1) - 1) * var(--floating-toc-bar-level-step))`, `height: var(--floating-toc-bar-height)`.
`[data-active="true"]::after`: `background:var(--accent)`, width `calc(active-width - (level-1)*step)`, height `active-height`.
Widths measured: level 1 → 16px (active 24px), level 2 → 13px, level 3 → 10px (active 18px).

### `.floating-toc__content`
`border-radius:calc(var(--radius)*2)` (16px), `background:var(--overlay)`, `box-shadow:var(--overlay-shadow)` (Tailwind shadow stack), `outline:none`, `scrollbar-width/color/gutter: var(--scrollbar-*)` (= OSS `scrollbar` utility), `padding:calc(var(--spacing)*1.5)` (6px), `overscroll-behavior:contain`, `max-height:min(60vh,400px)` (RAC's inline `max-height` wins when set), `overflow-y:auto`, `--floating-toc-item-indent:.75rem`.
Animation (tw-animate-css `enter` / `exit` keyframes):
- `[data-entering="true"]`: `animation: enter .15s var(--ease-out)`, `--tw-enter-opacity:0; --tw-enter-scale:.97`
- `[data-exiting="true"]`: `animation: exit .1s var(--ease-out)`, `--tw-exit-opacity:0; --tw-exit-scale:.97`
- slide on enter, 1 spacing unit from the trigger side: `bottom` → `translate-y:-4px`, `top` → `+4px`, `left` → `translate-x:+4px`, `right` → `-4px`
- `will-change: opacity, transform` while animating; motion-reduce → `animation:none`
- No `transform-origin` (scales from the centre).
Measured (right TOC, 6 items "Overview…Troubleshooting"): content 143.4×204, right edge 8px left of the trigger, vertically centred on it.

### `.floating-toc__item`
`position:relative; display:flex; align-items:center; width:100%; border-radius:calc(var(--radius)*1)` (8px), `padding-block:calc(var(--spacing)*1.5)` (6px), `padding-inline: calc(var(--spacing)*3)` with `padding-inline-start: calc(.75rem + (var(--floating-toc-level,1) - 1) * var(--floating-toc-item-indent))`, `text-align:start; font-size:var(--text-sm); line-height:20px; white-space:nowrap; color:var(--muted); user-select:none; outline:none; cursor:var(--cursor-interactive)`. Height 32px. No transition.
States: `@media (hover:hover)` `:hover, [data-hovered="true"]` → `bg var(--default)`; `[data-focused="true"]` → `bg var(--default)` (for RAC collection items, see Virtualized); `:active, [data-pressed="true"]` → `bg var(--default-hover)`; focus-visible → OSS focus ring; `:disabled, [aria-disabled="true"]` → `opacity:var(--disabled-opacity); cursor:var(--cursor-disabled); pointer-events:none`; `[data-active="true"]` → `color:var(--accent)`.
Indent measured: level 1 → 12px, 2 → 24px, 3 → 36px.

### Dark mode
No dark-specific rules: everything resolves through tokens (`--border`, `--accent`, `--overlay`, `--overlay-shadow` = inset 1px white/30 in dark, `--default`, `--muted`).

## 5. Behaviour (measured)

Hover mode (`triggerMode="hover"`):
- pointer enters trigger → opens after `openDelay` (measured 208ms; `0` → ~9ms).
- pointer leaves trigger → closes after `closeDelay` (measured 302ms) unless the pointer enters the content first (content `pointerenter` cancels the timer; content `pointerleave` re-arms it). Pointer leave closes even while an item has focus.
- focus on trigger (keyboard, programmatic or mouse-down) → opens **immediately**. Blur → closes after `closeDelay` (306ms), unless focus moves into the content.
- mouse click on the trigger only opens (a click on an open trigger keeps it open).
- Enter / Space on the trigger toggle. Escape on the trigger closes.
- Tab from the trigger reaches the first item (the portal is the last thing in `<body>`); arrow keys do nothing.
- Item click: no automatic close (the demo just sets the active entry).
Press mode (`triggerMode="press"`): hover and focus do nothing; click, Enter, Space toggle; outside clicks do **not** close (non-modal popover); item clicks do not close; Escape closes. Clicking the trigger while an item has focus closes it once (no close-and-reopen flash), so the trigger is excluded from the popover's blur/outside handling.
Closing while focus is inside the content: focus moves to the trigger **first** (`focusout item → focusin trigger → aria-expanded=false`), and that focus does not re-open a hover-mode TOC. Same for Escape inside the content.
Animation timeline: `data-entering` for ~140ms, `data-exiting` for ~90–100ms, then unmount.
Inherited from RAC `Popover isNonModal`: no scroll lock, no `inert`, no outside-press dismissal, Escape inside closes, moving focus out to another element closes, and scrolling an ancestor scroll container of the trigger closes it (`useCloseOnScroll`).
Positioning: RAC flips to the other side when there is no room (Controlled demo opened to the right of a right TOC).

## 6. Demos (all 10)

| # | Demo | URL | Structure |
|---|---|---|---|
| 1 | Usage / Default | `/docs/react/demos/floating-toc-default` | `div.px-10.py-24`; right TOC, 6 flat entries, first active. |
| 2 | In Page Context | `…-in-page-context` | `div.relative.h-[420px].w-[640px].overflow-hidden.rounded-xl.border.border-border` > scroll `div.h-full.overflow-auto.p-8.pr-16` with 5 `div.mb-10.last:mb-0` (`h2.text-base.font-semibold` + `text-accent` when active, `p.text-muted.mt-2.text-sm.leading-relaxed`); trigger in `div.absolute.top-1/2.right-3.-translate-y-1/2`. Item click sets the active section. |
| 3 | Hierarchical | `…-hierarchical` | `div.px-10.py-10`; 19 entries, levels 1/2/3, a level-3 entry active; content starts with the same `span.text-muted.mb-1.block.px-3.py-1.text-[10px].font-semibold.tracking-wider.uppercase` heading as Press Mode. |
| 4 | Left Placement | `…-left-placement` | `placement="left"`, 6 flat entries; content opens to the right. |
| 5 | Left Aligned Bars | `…-left-aligned-bars` | Identical DOM to Left Placement (`placement="left"` aligns bars to the start). |
| 6 | Press Mode | `…-press-mode` | `div.px-10.py-10`; `triggerMode="press" placement="left"`, hierarchical entries, first active; content starts with `span.text-muted.mb-1.block.px-3.py-1.text-[10px].font-semibold.tracking-wider.uppercase` heading. |
| 7 | Press Mode In Page | `…-press-mode-in-page` | 640×520 box, scroll `p-8 pl-16`, 6 top-level sections, trigger `absolute top-1/2 left-3 -translate-y-1/2`, press + left, hierarchical bars; the heading of the active entry's top-level section is accent. |
| 8 | Custom Delays | `…-custom-delays` | `div.flex.items-center.gap-12.px-10.py-24` with 3 `div.flex.flex-col.items-center.gap-3` columns: `span.text-muted.text-xs` label + TOC with 0/0, 200/300, 600/500 delays. The three TOCs share one active entry: clicking an item in any of them moves the active bar/item in all three. |
| 9 | Controlled | `…-controlled` | `div.mb-6.flex.items-center.gap-3` with OSS `Button size="sm" variant="outline"` ("Open/Close …") and `span.text-muted.inline-block.w-24.text-sm` "State: <strong>open/closed</strong>"; TOC with `open` / `onOpenChange`. |
| 10 | Virtualized | `…-virtualized` | `div.px-10.py-10`; press mode; 112 entries (levels 1–3) but only the 20 top-level ones get bars; `Content className="w-72 overflow-hidden !p-0"`, heading `span.text-muted.block.px-3.pt-2.5.pb-1.text-[10px]…` "Contents (N items)", then RAC `Virtualizer` (`ListLayout`, rowHeight 32, padding 6) + `ListBox aria-label className="block h-[320px] overflow-auto outline-none"` with single selection, items are RAC `ListBoxItem className="floating-toc__item"` carrying `data-active` and the level style (so `data-hovered` / `data-focused` / `data-pressed` come from RAC). |

## 7. Implementation notes (remake)

- Root: context provider (no DOM) with controlled/uncontrolled state, one hover-intent timer, trigger
  and content refs, and a "restoring focus" flag.
- Trigger: plain `<span role="button" tabIndex={0}>`; react-aria `useHover` (ignores emulated mouse
  events after touch) for hover intent; native `focus` / `blur` / `click` / `keydown` handlers.
- Content: RAC `Popover` with `isNonModal`, `triggerRef`, `offset=8`, derived placement,
  `dir` from `useLocale`, `shouldCloseOnInteractOutside` that ignores the trigger, pointer enter/leave
  for hover mode.
- Closing with focus inside the content focuses the trigger first, with the flag set so the
  trigger's focus handler does not re-open.
- Item / Bar: plain elements, `data-active`, `--floating-toc-level` only when `level > 1`.
- CSS authored with `@apply` + OSS tokens/utilities (`status-focused`, `status-disabled`,
  `scrollbar`, tw-animate `animate-in/out`).

## 8. Deviations

- Item indent base uses `calc(var(--spacing) * 3 + …)` instead of the literal `.75rem`, so it follows
  `--spacing` like the end padding does (identical with the default spacing).
- Stories: the In Page Context story adds a real scroll-spy (click scrolls the section into view,
  scrolling updates the active entry); Press Mode In Page scrolls the section into view on click.
  The Pro demos only set the active entry on click. The component itself is unchanged.
- Virtualized story keeps `data-active` in sync with the selection (the Pro demo leaves a stale
  `data-active` on the first item because the virtualized items are not re-rendered).

## 9. Dependencies

`react-aria-components` (Popover; ListBox + Virtualizer in the story only), `react-aria`
(`useHover`, `mergeProps`, `useLocale`), OSS `@heroui/react` `Button` (Controlled story only).
No heavy optional peers → root export is fine.
