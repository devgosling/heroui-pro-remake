# Text Shimmer (`text-shimmer`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/text-shimmer, the server-rendered DOM and
the CSSOM (public stylesheet rules) of the public demo page, observed on 2026-11-24. No paywalled source, JS chunk,
source map, prompt or MCP endpoint was read.

## 1. Purpose

Animated shimmer text for streaming, thinking and loading labels ("Thinking...", "Generating response..."). A highlight
band sweeps across the glyphs while the readable text stays at reduced alpha. Used as a building block by Reasoning,
Chain Of Thought, Chat Loader and Chat Tool (`.chat-tool__trigger-label > .text-shimmer`).

## 2. Anatomy

```tsx
import {TextShimmer} from "@heroui/pro";

<TextShimmer className="text-muted">Thinking...</TextShimmer>
```

Single public component (no compound parts); the two inner layers are rendered automatically.

| Part | Element | `data-slot` | BEM class | Notes |
| --- | --- | --- | --- | --- |
| Root | `<span>` (HeroUI `dom.span`, so a `render` prop is accepted) | `text-shimmer` | `.text-shimmer` + user `className` | |
| Text | `<span>` | `text-shimmer-text` | `.text-shimmer__text` | readable layer, carries `id="text-shimmer-<useId>"` |
| Highlight | `<span inert aria-hidden="true">` | `text-shimmer-highlight` | `.text-shimmer__highlight` | second copy of `children`; inline `style="--_firefox-mask:-moz-element(#<text id>)"` |

Observed DOM (attribute order as rendered by the demo, SSR):

```html
<span class="text-shimmer" data-slot="text-shimmer">
  <span class="text-shimmer__text" data-slot="text-shimmer-text" id="text-shimmer-_R_anpfiv5uivb_">Thinking...</span>
  <span inert="" aria-hidden="true" class="text-shimmer__highlight" data-slot="text-shimmer-highlight"
        style="--_firefox-mask:-moz-element(#text-shimmer-_R_anpfiv5uivb_)">Thinking...</span>
</span>
```

- No `data-*` state attributes, no role, no `aria-live` (the readable layer is plain text; the highlight is removed from
  the a11y tree via `aria-hidden` and from interaction via `inert`).
- The id is `text-shimmer-` + React `useId()`; it exists only for the Firefox `-moz-element()` mask.

## 3. API

### `TextShimmer`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Text content (rendered twice: readable layer + inert highlight copy) |
| `className` | `string` | - | Additional classes, including colour and text size utilities |

"Also supports render props from HeroUI `dom.span`" -> the root is `dom.span`, i.e. all `<span>` props plus
`render?: (props, renderProps) => ReactElement`.

### CSS variables

| Variable | Default | Description |
| --- | --- | --- |
| `--spread` | `4ch` | Width of the highlight falloff on each side of the band centre |
| `--_firefox-mask` | set inline | private; `-moz-element(#<text id>)` |

## 4. Styling (observed CSSOM, all inside `@layer components`, identical in light and dark)

### `.text-shimmer` (root)
- `--spread: 4ch`, `position: relative`, `display: inline-block`, `width: fit-content`.

### `.text-shimmer__text`
- `display: inherit; align-items: inherit; gap: inherit` (consumers can make the root `inline-flex`, e.g. Chat Tool sets
  `display:inline-flex; align-items:center; gap: calc(var(--spacing) * 2); min-width:0` on `.chat-tool__trigger-label > .text-shimmer`).
- `color: oklch(from currentColor l c h / calc(alpha * .45))` -> 45% of the inherited colour's alpha.

### `.text-shimmer__highlight`
- `position: absolute; inset: 0; overflow: clip; contain: strict; pointer-events: none`
- `display/align-items/gap: inherit`
- `-webkit-text-fill-color: transparent` (glyphs invisible, `color` stays = full `currentColor`)
- `@supports (-webkit-mask-clip: text)`: `mask-image: linear-gradient(#fff,#fff)` (+ `-webkit-` prefixed) and
  `-webkit-mask-clip: text` -> the solid mask is clipped to the element's own glyph shapes.
- `@supports (mask-image: -moz-element(#text))`: `mask-image: var(--_firefox-mask)` (Firefox masks with the rendered
  readable text element instead).

### `.text-shimmer__highlight::after` (the band)
- `content: ""; position: absolute; inset: 0; pointer-events: none; will-change: transform`
- `background: linear-gradient(90deg, transparent calc(50% - var(--spread)), currentColor 50%, transparent calc(50% + var(--spread)))`
- `animation: 2.5s infinite text-shimmer` (timing function = default `ease`, delay 0, direction normal, fill none)

### `@keyframes text-shimmer`
- `0% { translate: -100% }` -> `100% { translate: 100% }` (x only; the band layer is as wide as the text, so it enters
  fully from the left edge and exits fully past the right edge).

### Reduced motion (`@media (prefers-reduced-motion: reduce)`)
- `.text-shimmer__highlight { display: none }`
- `.text-shimmer__text { color: currentColor }` (solid text)

### Colour / tokens
- No theme token is referenced directly; everything derives from the inherited `color` (`currentColor`). In the demo
  that is `--foreground` from `body.text-foreground` (light and dark), so dark mode works through inheritance.
- Docs example: `className="text-muted"`.

### Live measurements (Chromium, demo page, light + dark)

| Item | Light | Dark |
| --- | --- | --- |
| Root (in `flex-col`, so computed `display: block`) | 69.02 x 20 ("Thinking..."), 150.42 x 20 ("Generating response..."), 14px / 20px Inter 400 | same metrics |
| Root `color` | `lab(8.34 0.61 -2.13)` (= `--foreground`) | `lab(98.97 0 0)` |
| `__text` `color` | `oklch(0.2103 0.0059 285.88 / 0.45)` | `oklch(0.9911 0 112.86 / 0.45)` |
| `__highlight` | same rect as root, `mask-image: linear-gradient(rgb(255,255,255), ...)`, `mask-clip: text`, `-webkit-text-fill-color: rgba(0,0,0,0)`, `contain: strict`, `overflow: clip` | same |
| `::after` | width = root width, height 20, `calc(50% -/+ 35.3281px)` stops (4ch at 14px Inter), `will-change: transform` | colour stop = dark foreground |
| `getAnimations()` | 1 CSSAnimation `text-shimmer` on `::after`, duration 2500, effect easing linear, keyframe easing `ease`, `translate -100% -> 100%` | same |

Demo wrapper: `div.flex.flex-col.gap-4.text-sm`, page padding 24px, `body.bg-background.text-foreground`.

## 5. Behaviour

- Pure CSS animation, no JS timers. Period 2.5 s, `ease`, infinite. The band position is `translate` only (composited).
- Content is duplicated: any interactive content inside `children` is only interactive in the readable layer (the
  highlight copy is `inert`). Screen readers read the text once.
- No keyboard behaviour, no focus, no states.

## 6. Demo variants

Docs list exactly one demo (`a[aria-label="Open in new tab"]`):

| Demo | URL | Content |
| --- | --- | --- |
| default | `/docs/react/demos/text-shimmer-default?theme=light|dark` | `div.flex.flex-col.gap-4.text-sm` with two shimmers: "Thinking..." and "Generating response..." (no className) |

Story mapping: `Default` (same structure, own labels). Extra `Colors` story illustrates the documented `className`
colour / text-size usage (docs "Color" section).

## 7. Theme / token dependencies, light vs dark

Only `currentColor`. No difference between light and dark beyond the inherited foreground colour.

## 8. Dependencies

- `@heroui/react`: `dom`, `DOMRenderProps` (root element with render prop support).
- React `useId` for the text-layer id.
- No optional peers -> root export allowed.

## 9. Deviations / notes

- Verified in Storybook (light + dark): every computed value in the table above matches (rects differ only by
  label text; colours identical once the story wrapper carries `text-foreground`, which the Pro demo gets from
  `body.text-foreground` while the Storybook body uses plain black / white).
- `textShimmerVariants` is created with `twMerge: false`: tailwind-merge treats `text-shimmer` as a text colour
  utility and dropped the block class when a consumer passed `className="text-muted"` (the documented usage).
- Reduced motion uses the HeroUI `motion-reduce:` variant, which also honours a `[data-reduce-motion="true"]` ancestor
  (verified: highlight `display: none`, 0 running animations, text solid).
- The generated id is passed through `replace(/[^\w-]/g, "")` so it is always a valid CSS id selector inside
  `-moz-element(#...)` regardless of the React `useId` format.
- CSS authored with Tailwind `@apply` where utilities exist (`relative inline-block w-fit`, `pointer-events-none
  absolute inset-0 overflow-clip contain-strict`, `will-change-transform`, `motion-reduce:*`); mask / text-fill /
  inherit / gradient declarations are plain CSS because there is no utility for them.

## Appendix A - raw CSSOM (reference only, from the demo page stylesheet)

```
@layer components {
  @keyframes text-shimmer { 0%{translate:-100%} to{translate:100%} }
  .text-shimmer { --spread:4ch; width:fit-content; display:inline-block; position:relative }
  .text-shimmer__text { display:inherit; align-items:inherit; gap:inherit; color:oklch(from currentColor l c h / calc(alpha * .45)) }
  .text-shimmer__highlight { pointer-events:none; display:inherit; align-items:inherit; gap:inherit; contain:strict;
    -webkit-text-fill-color:transparent; position:absolute; inset:0; overflow:clip }
  @supports ((-webkit-mask-clip:text)) {
    .text-shimmer__highlight { -webkit-mask-image:linear-gradient(#fff,#fff); mask-image:linear-gradient(#fff,#fff); -webkit-mask-clip:text }
  }
  @supports ((-webkit-mask-image:-moz-element(#text)) or (mask-image:-moz-element(#text))) {
    .text-shimmer__highlight { mask-image:var(--_firefox-mask) }
  }
  .text-shimmer__highlight:after { pointer-events:none; content:""; will-change:transform; position:absolute; inset:0;
    background:linear-gradient(90deg, transparent calc(50% - var(--spread)), currentColor 50%, transparent calc(50% + var(--spread)));
    animation:2.5s infinite text-shimmer }
  @media (prefers-reduced-motion:reduce) {
    .text-shimmer__highlight { display:none }
    .text-shimmer__text { color:currentColor }
  }
  /* owned by Chat Tool */
  .chat-tool__trigger-label>.text-shimmer { align-items:center; gap:calc(var(--spacing) * 2); min-width:0; display:inline-flex }
}
```
