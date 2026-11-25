# Loader (`loader`) - clean-room implementation spec

Slug: `loader` · Docs: https://heroui.pro/docs/react/components/loader · Storybook title: `Pro/AI/Loader`
Import (remake): `import {Loader} from "@heroui/pro"` (root export, no optional peers). Used by Chat Loader.

Sources (observed 2026-11-24): the public docs page text; the server-rendered DOM of the four public demo
pages (`/docs/react/demos/loader-{default,with-label,sizes,composition}?theme=light|dark`); the demo page
stylesheet rules (CSSOM, `@layer components`); computed styles; and the runtime animations (`getAnimations()`,
paused at fixed times). The built-in browser pane had no free tab for most of this session, so the live
checks ran in a local headless Edge (playwright-core from the repo) against the same public pages and our
Storybook. I did not open or try to get around the paywalled example source or any JS chunk.

---

## 1. Purpose

An animated status indicator for general loading and AI work, such as reading a file or reasoning. It comes
in 14 drawings (`variant`), 3 sizes and the Spinner colour palette. It can show a visible label, or a
hidden "Loading" text for screen readers.

## 2. Anatomy

```tsx
<Loader variant="ring" size="md" color="accent" label="Reading a file" />

<Loader variant="infinity" size="sm">          // custom composition
  <Loader.Indicator />                          // default drawing of `variant`, or custom SVG children
  <Loader.Label>                                // visible status text
    <TextShimmer>Thinking</TextShimmer>
  </Loader.Label>
</Loader>
```

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `Loader` (root) | `<span role="status">` (HeroUI `dom.span`, `render` prop) | `loader` | `loader loader--{color} [loader--sm\|loader--lg]` | `data-variant`, `data-size` (always set, `md` too). Pro renders **no** `loader--md` class. Attribute order in Pro: class, data-size, data-slot, data-variant, role. |
| `Loader.Indicator` | `<svg aria-hidden="true" focusable="false" viewBox=…>` | `loader-indicator` | `loader__indicator loader__indicator--{variant}` | children replace the drawing (pass a matching `viewBox`). |
| `Loader.Label` | `<span>` | `loader-label` | `loader__label` | visible status text. |
| fallback (automatic) | `<span>` | `loader-fallback` | `loader__fallback` | sr-only text = `aria-label ?? "Loading"`; rendered only when there is no label. |

Rules derived from the demos:
- Without a label: the root has **no** `aria-label` attribute; the fallback span carries the text. The default
  demo passes `aria-label="Fetching"` etc. and the fallback reads `Fetching`.
- With `label`: `Loader.Label` is rendered after the indicator, no fallback; `aria-label` (if passed) names the root.
- `children` replaces the default indicator + label (`label` is ignored).
- The fallback is dropped when a `Loader.Label` is a direct child (or inside a fragment). That works in server
  markup. Labels nested deeper register through context after mount, so the fallback is removed on the client.

## 3. API (docs)

### `Loader`
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `ring \| classic \| dots \| pulse \| scan \| grid \| shuffle \| wave \| sparkle \| atom \| morph \| helix \| twist \| infinity` | `"ring"` | Indicator style |
| `size` | `sm \| md \| lg` | `"md"` | 16 / 20 / 24px (`infinity` is 1.5x wide). Spinner sm ≈ Loader sm, Spinner md ≈ Loader lg |
| `color` | `accent \| current \| success \| warning \| danger` | `"accent"` | Indicator colour (Spinner palette) |
| `label` | `string` | - | Visible text in `Loader.Label`; ignored when `children` is set |
| `aria-label` | `string` | `"Loading"` | Hidden status text without a label; names the root with one |
| `children` | `ReactNode` | - | Custom mix of `Loader.Indicator` and `Loader.Label` |
| `className` | `string` | - | Extra classes, including text colour utilities |

The root also accepts the HeroUI `dom.span` render props (`render`) and the native span props.

### `Loader.Indicator`
Hidden from screen readers; stops on a still frame under reduced motion; native `svg` props.
`children`: SVG content replacing the default drawing (set `viewBox` to match).

### `Loader.Label`
Visible status text replacing the hidden "Loading" text; native `span` props. The root's `label` is ignored
when `children` is set, so a composed `Loader.Label` always shows its own children.

### CSS classes / data attributes / variables (docs)
- Base: `.loader`, `.loader__indicator`, `.loader__label`, `.loader__fallback`
- Size: `.loader--sm`, `.loader--lg` (md is the default and has no class)
- Variant: `.loader__indicator--{variant}`
- Colour: `.loader--accent`, `--current`, `--success`, `--warning`, `--danger`
- `[data-variant]`, `[data-size]` on `.loader`
- `--loader-size` (indicator size), `--loader-radius` (corner rounding of scan / grid / shuffle, `calc(var(--radius) / 8)`)
- A text colour utility on the root overrides the indicator colour; the label stays muted.

### Accessibility (docs)
Keep the loader mounted and update its `label` to announce new work; pass `aria-hidden` when a parent already
announces the status (e.g. a pending button); one loader per region. No keyboard interaction.

## 4. Styling (CSSOM, `@layer components`)

| Selector | Declarations |
|---|---|
| `.loader` | `display:inline-flex; align-items:center; gap:calc(var(--spacing)*2)` (8px); `vertical-align:middle; --loader-size:1.25rem; --loader-radius:calc(var(--radius)/8)` |
| `.loader--sm` / `.loader--lg` | `--loader-size: 1rem` / `1.5rem` |
| `.loader--accent/danger/success/warning` | `color: var(--accent/--danger/--success/--warning)`; `.loader--current { color: inherit }` |
| `.loader__indicator` | `width/height: var(--loader-size); flex-shrink:0; overflow:visible` |
| `.loader__indicator--infinity` | `width: calc(var(--loader-size) * 1.5)` |
| `.loader__label` | `text-sm` (14px / 20px), `color: var(--muted)`, `overflow-wrap:anywhere` |
| `.loader__fallback` | Tailwind `sr-only` |
| `.loader__track` | `opacity:.2` |
| `.loader__sparkle-star, __atom-ring, __wave-bar, __dots-dot, __pulse-dot` | `transform-box:fill-box; transform-origin:50%` |
| reduced motion | `@media (prefers-reduced-motion: reduce) { .loader__indicator, .loader__indicator * { animation:none } }` |

Measured: root height = 20px with a label (label line-height) for sm; indicator 16/20/24px; infinity 24/30/36px wide.
Light accent `lab(54.53 3.32 -66.53)` = our `oklch(.6204 .195 253.83)`; muted light `lab(47.87 1.41 -4.99)` / dark
`lab(65.65 1.53 -5.42)` = our zinc muted tokens (same colours, the Pro site stylesheet is compiled to lab()).

## 5. Drawings and animations

Pro writes every animation as one long cycle (16-24s) that repeats a short cycle N times, for example ring `24s`
`rotate(10800deg)` = 30 turns. The remake authors the **short cycle** with the same keyframe offsets, easings
and delays. Paused at identical times, both render the same frames (section 7).

| Variant | viewBox | Drawing | Animation (short cycle) |
|---|---|---|---|
| ring | `0 0 24 24` | stroke 2.5: track circle r10 + arc `M22 12A10 10 0 0 1 11.71 22` (round cap) | whole SVG `rotate(360deg)` 0.8s linear |
| classic | `-12 -12 24 24` | 12 rects 5.76×1.92 rx .96 at x 6.02, `rotate(i*30)` | opacity 1 → .15, 1.2s linear, delay `i*100ms - 1.2s` |
| dots | `0 0 24 24` | 3 circles, CSS `r:3px; cx:calc(12px + (i-1)*9px)`, opacity .7 | 1.2s ease-in-out: 0/80/100% .35 + scale .85, 40% 1 + scale 1; delay `i*120ms - 1.2s` |
| pulse | `0 0 24 24` | circle r4.8, opacity .7 | 1.4s ease-in-out: .45/scale .92 ↔ 1/scale 1 |
| scan | `0 0 24 24` | track rect 18×18 at 3 (stroke 2, `rx: calc(--loader-radius*4)`), line `M7.5 12L16.5 12` stroke 2.5 | translateY -5.5 ↔ 5.5px, 1.8s cubic-bezier(.45,0,.55,1) |
| grid | `0 0 16 16` | 3×3 cells 4×4 at 0/6/12, `rx: --loader-radius`, static opacity by diagonal `[1,.85,.55,.3,.15]` | 640ms ease: 0% .12, 20% .58, 55% .12; delay `diag*120ms - 640ms` |
| shuffle | `0 0 24 24` | 3 tiles 9×9 at (2,2), `rx: --loader-radius*2.5`, `transform: translate(var(--_rest))` (0,0 / 11,0 / 11,11), static opacity .4/.4/1 | 3.6s cubic-bezier(.65,0,.35,1), delay `i*-1.2s`: hold .51s, 180ms move to the next corner while brightening to 1, fade to .4 by 0.9s; clockwise (0,0)→(11,0)→(11,11)→(0,11) |
| wave | `0 0 24 24` | 5 bars 2.4×24 rx 1.2 at x=i*5.4; resting `opacity: .4429 + i*.1393`, `scaleY(.4 + i*.15)` | 0.9s ease-in-out .35/scaleY .3 ↔ 1/scaleY 1; delay `i*180ms - 900ms` |
| sparkle | `0 0 21 21` | 5 four-point stars (cx, cy, r): (10.5,9.66,7) (3.78,4.62,3.85) (17.22,5.46,3.15) (16.38,15.96,3.85) (4.62,16.38,2.8); control points at r/12 and 5r/12; opacity .525 | 1.4s ease-in-out: 0% 0/scale 0, 40% .75/1, 60% .675/.8; delay `i*196ms - 1.4s` |
| atom | `0 0 16 16` | stroke .8: circle r7.6 + 3 orbit circles in `rotate(90/-30/30 8 8)`, resting `scaleY(.5)` | 600ms: scale(1) → scaleY(.12) at 46.172% (cubic-bezier(.157,0,.418,.027)), hold to 53.828%, back (cubic-bezier(.582,.973,.843,1)); delay `i*-200ms` |
| morph | `0 0 16 16` | 18 dots r.68 on a circle r5.67 (from the top, clockwise); `--_triangle` / `--_square` offsets. The triangle has corners (8,2.78) (13.65,12.655) (2.35,12.655) with 6 dots per side; the square has half-size 4.72 with dots spaced evenly from the top centre | group: `fill-opacity:.9`, scale .95 ↔ 1.05, 3.317s cubic-bezier(.37,0,.63,1); dots 3.317s cubic-bezier(.335,0,.665,1): circle until 20.293%, triangle 33.341-53.627%, square 66.682-86.968% |
| helix | `0 0 20 20` | `--_lift:.2955px`. 17 ghost dots (rows y 3.167…16.833, screen radius .3, phases spread by the golden ratio .381964, near/far opacity table) + 3 strands × 6 rows (y 16.594 - 2.3234·row, screen radius .498 + .0228·row, phase `.900432 - .48·row - strand/3`). Each row is a unit circle scaled by `7.6·√(1-((y-10)/7.2604)²)` | orbit translateX -1 ↔ 1 (5.712s), depth near (lift, near-scale, near-opacity) ↔ far (5.712s, starting in front), weave scale .925 ↔ 1.075 around (10,10) (2.856s, phase `.601884 - .04·row - strand/3`); all cubic-bezier(.37,0,.63,1); per-element delays inline |
| twist | `0 0 20 20` | sphere R 8.2 seen from 20.05° above (`squash .34294`, `--_unsquash 2.916`): 5 latitude slabs (-90/-45/0/45/90°, 1/8/12/8/1 dots, first dot at 71.09°). depth z = (y·cos t + Y·sin t)/R; r = .5426 + .318z; opacity = .65 + .27z; rest = .86·opacity; settle = .8645·opacity; `--_turned-*` = the same values a quarter turn later | slab `rotate(90deg)` and back; dots counter-rotate, scale to `--_turned-scale` and flash. 2.769s cubic-bezier(.33,1,.68,1), delay `slab*215ms` (positive). Keyframes at 5.4528 / 7.7648 / 38.8232 / 38.824 / 44.276 / 46.588% |
| infinity | `7 0 42 28` | stroke 2.75: figure-eight track `M28 14C33 5 47 5 47 14C47 23 33 23 28 14C23 5 9 5 9 14C9 23 23 23 28 14Z` + 6 comet capsules (line ±.93, round cap) | x: 1.2s 28 → 46.9 → 28 → 9.1px (from centre cubic-bezier(.465,.333,.716,1.016), from the edges (.285,-.015,.527,.658)), delay `i*-22ms - 11ms`; y: 0.6s 7.31 → 20.69px at 45.668% ((.416,-.013,.584,1.013) / (.42,.03,.582,.972)), delay `i*-22ms - 448ms`; turn: 1.2s -56.83° → 90° (24.084%) → 236.08° (48%, linear) → 236.83° (50%) → 90° (74.084%) → -56.08° (98%, linear) → -56.83°, delay `i*-22ms` |

Still frames (reduced motion = `animation:none`): the SVG attributes (opacities, the rest transforms, the comet
transforms laid along the curve from the crossing point, helix dots at their t=0 orbit position computed as
x = -cos, depth = sin of the orbit angle) and the resting CSS of wave / atom / shuffle / twist.

## 6. Demos (4 public variants) → stories

| Pro demo | Content | Story |
|---|---|---|
| `loader-default` | `grid grid-cols-3 gap-6 sm:grid-cols-7`, each cell `flex flex-col items-center gap-2`: 14 loaders `size="lg"` with an `aria-label` + `<code class="text-muted text-xs">variant</code>` | `pro-ai-loader--default` |
| `loader-with-label` | `flex flex-col gap-3`: `size="sm"` + `label` for classic, scan, grid, shuffle, wave, sparkle, atom, morph, helix, twist | `pro-ai-loader--with-label` |
| `loader-sizes` | `flex items-end gap-8`: grid variant sm / md / lg with `<code>` captions | `pro-ai-loader--sizes` |
| `loader-composition` | `size="sm" variant="infinity"` with `Loader.Indicator` + `Loader.Label` holding a `TextShimmer` | `pro-ai-loader--composition` |
| (docs "Colors" section, no demo) | - | `pro-ai-loader--colors` (extra) |

## 7. Verification

- Animated frames: every animation on both pages was paused at T = 0, 250, 700, 1300, 3333, 5000, 9876, 15000,
  23500 and 26000ms (default demo) and at several times for with-label / sizes / composition. Then each drawing
  part was compared (bounding box relative to the indicator, computed opacity). All parts match (≤ 0.15px,
  ≤ 0.02 opacity). The one exception is a classic bar sampled exactly on an iteration boundary
  (floating point, 1 vs .15 for one instant).
- Reduced motion (`prefers-reduced-motion: reduce`): still frames identical.
- Root / indicator / label / fallback computed styles match in light and dark (colours are the same tokens; Pro's
  stylesheet prints them as `lab()`).

## 8. Dependencies / deviations

- No new dependencies. Stories use `TextShimmer` from `../text-shimmer`.
- Deviation: the animations use the short cycle durations instead of Pro's 16-24s multi-cycle keyframes.
  The motion is the same.
- Deviation: the drawing geometry is generated from fitted formulas (morph, helix, twist) plus small observed
  tables (helix lighting, sparkle stars, infinity still frame). Rounding can differ by ±0.001 in some
  attributes (for example the morph square corner dot by 0.01 user units). This cannot be seen.
- The helix depth animation starts in front (near) and its delay is shifted by a quarter period. Pro starts at the
  middle with split easing curves. The motion is the same.
- Internal `--_mid-*` custom properties of the helix are not emitted (only used by Pro's long cycle).
- Reduced motion uses the HeroUI `motion-reduce` variant (like the OSS Spinner), so besides
  `prefers-reduced-motion: reduce` it also honours an explicit `data-reduce-motion="true"` ancestor. Pro's
  stylesheet only has the media query.

Review (2026-11-25): re-measured independently against all four public demos (light + dark). Server markup
is identical apart from the helix depth delays / `--_mid-*` and morph offsets that differ by 0.01 user units.
Paused frames at 16+ times (indicators magnified to 160-200px) match within 0.25px and 0.003 opacity; element
screenshots at 2x DPR differ by at most 12/255 on single anti-aliased pixels. Theme overrides (`--radius`,
`--accent`, `--font-sans`) change scan / grid / shuffle corner radii, colour and label font the same way as on
the Pro pages.

## Appendix: CSSOM (reference only, Pro stylesheet, `@layer components`)

```css
.loader {align-items:center;gap:calc(var(--spacing) * 2);vertical-align:middle;--loader-size:1.25rem;--loader-radius:calc(var(--radius) / 8);display:inline-flex}
.loader--sm {--loader-size:1rem}
.loader--lg {--loader-size:1.5rem}
.loader--current {color:inherit}
.loader--accent {color:var(--accent)}
.loader--danger {color:var(--danger)}
.loader--success {color:var(--success)}
.loader--warning {color:var(--warning)}
.loader__indicator {width:var(--loader-size);height:var(--loader-size);flex-shrink:0;overflow:visible}
.loader__label {font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height));color:var(--muted);overflow-wrap:anywhere}
.loader__fallback {clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}
.loader__track {opacity:.2}
.loader__sparkle-star,.loader__atom-ring,.loader__wave-bar,.loader__dots-dot,.loader__pulse-dot {transform-origin:50%;transform-box:fill-box}
.loader__indicator--scan .loader__track {rx:calc(var(--loader-radius) * 4)}
.loader__indicator--ring {animation:24s linear infinite loader-ring-spin}            /* to { rotate(10800deg) } */
.loader__scan-line {animation:21.6s cubic-bezier(.45,0,.55,1) infinite loader-scan-sweep}   /* 12 cycles */
.loader__grid-cell {rx:var(--loader-radius);animation:16s infinite loader-grid-wave;animation-delay:calc(var(--_index) * .12s - .64s)}  /* 25 cycles */
.loader__sparkle-star {animation:21s ease-in-out infinite loader-sparkle-twinkle;animation-delay:calc(var(--_index) * .196s - 1.4s)}   /* 15 cycles */
.loader__infinity-x,.loader__infinity-y,.loader__infinity-comet {animation-duration:24s;animation-iteration-count:infinite}  /* 20 / 40 / 20 cycles */
.loader__infinity-x {animation-name:loader-infinity-swing;animation-delay:calc(var(--_index) * -22ms - 11ms)}
.loader__infinity-y {animation-name:loader-infinity-bob;animation-delay:calc(var(--_index) * -22ms - .448s)}
.loader__infinity-comet {animation-name:loader-infinity-turn;animation-delay:calc(var(--_index) * -22ms)}
.loader__atom-ring {animation:24s linear infinite loader-atom-flip;animation-delay:calc(var(--_index) * -200ms);transform:scaleY(.5)}  /* 40 cycles */
.loader__morph-dots {transform-origin:50%;fill-opacity:.9;animation:23.219s cubic-bezier(.37,0,.63,1) infinite loader-morph-breath}  /* 7 cycles */
.loader__morph-dot {animation:23.219s cubic-bezier(.335,0,.665,1) infinite loader-morph-shape}
.loader__helix-weave,.loader__helix-orbit,.loader__helix-dot {animation-duration:22.848s;animation-timing-function:cubic-bezier(.37,0,.63,1);animation-iteration-count:infinite}  /* weave 8, orbit/depth 4 cycles */
.loader__twist-slab,.loader__twist-dot {animation-duration:22.152s;animation-timing-function:cubic-bezier(.33,1,.68,1);animation-iteration-count:infinite;animation-delay:calc(var(--_index) * .215s)}  /* 8 cycles */
.loader__twist-dot {transform:scale(1, var(--_unsquash));opacity:var(--_rest-opacity);animation-name:loader-twist-depth}
.loader__classic-bar {animation:24s linear infinite loader-classic-fade;animation-delay:calc(var(--_index) * .1s - 1.2s)}  /* 20 cycles */
.loader__wave-bar {opacity:calc(.4429 + var(--_index) * .1393);transform:scaleY(calc(.4 + var(--_index) * .15));animation:18s ease-in-out infinite loader-wave-rise;animation-delay:calc(var(--_index) * .18s - .9s)}  /* 20 cycles */
.loader__shuffle-tile {rx:calc(var(--loader-radius) * 2.5);transform:translate(var(--_rest));animation:21.6s cubic-bezier(.65,0,.35,1) infinite loader-shuffle-slide;animation-delay:calc(var(--_index) * -1200ms)}  /* 6 cycles */
.loader__dots-dot {r:3px;cx:calc(12px + (var(--_index) - 1) * 9px);animation:24s ease-in-out infinite loader-dots-bounce;animation-delay:calc(var(--_index) * .12s - 1.2s)}  /* 20 cycles */
.loader__pulse-dot {animation:21s ease-in-out infinite loader-pulse-breath}  /* 15 cycles */
@media (prefers-reduced-motion:reduce) { .loader__indicator,.loader__indicator * {animation:none} }
```
The keyframe bodies are summarised per short cycle in section 5. They were reduced from the repeated offsets of
the long cycles (offset ÷ cycle length).
