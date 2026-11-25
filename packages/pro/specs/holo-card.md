# Holo Card (`holo-card`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/holo-card, the rendered DOM, CSSOM,
computed styles and observed runtime behaviour (inline style sampling per animation frame, MutationObserver timestamps,
dispatched mouse / touch / pen pointer events, real mouse hovers) of the 8 public demo pages, light and dark, observed on
2026-11-24/25. No paywalled source, JS bundle, source map, "Copy prompt"/MCP/llms endpoint or Storybook code panel was
read.

## 1. Purpose

A 3D tilting card with a pointer-tracked holographic glare and texture overlay (membership cards, passes,
collectibles). The pointer position drives a spring that tilts the card, scales it up, moves a radial glare and
parallaxes a holographic texture; `HoloCard.Content` layers drift against the tilt.

## 2. Anatomy

```tsx
<HoloCard>                                   {/* .holo-card            div, owns tracking + every CSS variable */}
  <HoloCard.Rotator>                         {/* .holo-card__rotator   div, inline rotateX/rotateY */}
    <HoloCard.Frame>                         {/* .holo-card__frame     div, clip box = card + 2 * bleed */}
      <HoloCard.Surface>                     {/* .holo-card__surface   div, card body (gradient, radius, clip) */}
        <HoloCard.Image alt="" src={src} />  {/* .holo-card__image     img, optional */}
        <HoloCard.Inset />                   {/* .holo-card__inset     div, optional hairline */}
        <HoloCard.Pattern />                 {/* .holo-card__pattern   div aria-hidden, optional static texture */}
        <HoloCard.Content>...</HoloCard.Content> {/* .holo-card__content div, optional, many */}
        <HoloCard.Shine>                     {/* .holo-card__shine     div aria-hidden, optional glare */}
          <HoloCard.ShinePattern />          {/* .holo-card__shine-pattern div (default child) */}
        </HoloCard.Shine>
      </HoloCard.Surface>
    </HoloCard.Frame>
  </HoloCard.Rotator>
</HoloCard>
```

Rendered DOM (membership demo, attribute order as rendered):

```html
<div class="holo-card" data-active="true" data-slot="holo-card" data-tilt-on-touch="true"
     style="--holo-card-gradient:linear-gradient(...);--holo-card-background-x:50%;--holo-card-background-y:50%;
            --holo-card-opacity:0;--holo-card-pointer-x:50%;--holo-card-pointer-y:50%;transform:none">
  <div class="holo-card__rotator" data-slot="holo-card-rotator" style="transform:none">
    <div class="holo-card__frame" data-slot="holo-card-frame">
      <div class="holo-card__surface" data-slot="holo-card-surface">
        <div class="holo-card__inset" data-slot="holo-card-inset"></div>              <!-- no aria-hidden -->
        <div aria-hidden="true" class="holo-card__pattern" data-slot="holo-card-pattern"></div>
        <div class="holo-card__content justify-center pt-12" data-slot="holo-card-content" style="transform:none">...</div>
        <div aria-hidden="true" class="holo-card__shine" data-slot="holo-card-shine">
          <div class="holo-card__shine-pattern" data-slot="holo-card-shine-pattern"></div>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- Image: <img class="holo-card__image" data-slot="holo-card-image" draggable="false" alt="..." src="..."> -->
```

- No OSS HeroUI component is used; everything is plain DOM. Pro is built on Motion (`motion.div` for root, rotator,
  content; "Also supports ... Motion props"); this remake uses its own spring integrator (see deviations).
- Inline style order: user `style` first, then prop-driven vars (`--holo-card-gradient`, `--holo-card-pattern`,
  `--holo-card-pattern-size`, `--holo-card-shine-opacity`), then the pointer-driven values and `transform`.
- `data-active="true" | "false"` always present; `data-tilt-on-touch="true"` only when touch tilts (absent otherwise,
  never `"false"`).

## 3. API

### `HoloCard` (root)

Renders a div that owns pointer tracking and every CSS variable. Shrink-wraps the card (`display: grid; width:
fit-content`), so position it with a flex/grid parent. Every layer is optional except Rotator, Frame and Surface.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `gradient` | `string` | - | CSS background for the surface -> `--holo-card-gradient` |
| `patternSrc` | `string` | - | Texture URL -> `--holo-card-pattern: url("...")`. Remake: CSS image values (gradients, `url()`, `none`) pass through raw (the With Pattern demo writes gradients into `--holo-card-pattern`) |
| `patternSize` | `string` | - | -> `--holo-card-pattern-size` |
| `activateOnHover` | `boolean` | `false` | Flat and inert until a mouse enters; implies `tiltOnTouch={false}` |
| `tiltOnTouch` | `boolean` | `true` | Touch/pen pointers tilt the card -> `data-tilt-on-touch="true"` -> `touch-action: pan-y pinch-zoom` |
| `isInteractive` | `boolean` | `true` | `false` freezes the card flat/unlit, `data-active="false"`, no `data-tilt-on-touch` |
| `isDisabled` | `boolean` | `false` | Same effect as `isInteractive={false}` |
| `maxTilt` | `number` | `14.29` (exactly `100 / 7`; observed edge rotation 14.286deg) | Edge tilt in deg, also scales the parallax |
| `hoverScale` | `number` | `1.05` | Root `transform: scale()` while tracking |
| `shineOpacity` | `number` | `1` | -> `--holo-card-shine-opacity` |
| `spring` | `HoloCardSpring` | `{damping: 28, stiffness: 180}` (mass 1) | Follow spring |
| `settleSpring` | `HoloCardSpring` | `{damping: 22, stiffness: 120}` (mass 1) | Return spring |
| `parallaxStrength` | `number` | `10` | Content drift |
| `children`, `className` + native div attributes | | | |

`HoloCardSpring = {damping?: number; mass?: number; stiffness?: number}`, merged over the defaults.

### Parts

| Part | Props |
| --- | --- |
| `HoloCard.Rotator` | `children`, `className`, native div attributes |
| `HoloCard.Frame` | `children`, native div attributes |
| `HoloCard.Surface` | `children`, native div attributes |
| `HoloCard.Image` | `alt` (required), `src`, `draggable` (default `false`), native img attributes (demos use `loading="lazy"`) |
| `HoloCard.Inset` | native div attributes, no children |
| `HoloCard.Pattern` | native div attributes, no children |
| `HoloCard.Content` | `parallax` (default `true`), `children`, `className`, native div attributes |
| `HoloCard.Shine` | `children` (default `<HoloCard.ShinePattern />`), native div attributes |
| `HoloCard.ShinePattern` | native div attributes, no children |

## 4. Styling

CSS variables (declared on `.holo-card`):

| Variable | Default |
| --- | --- |
| `--holo-card-width` / `--holo-card-height` | `302px` / `453px` |
| `--holo-card-radius` | `20px` |
| `--holo-card-bleed` | `36px` |
| `--holo-card-perspective` | `600px` |
| `--holo-card-gradient` | `linear-gradient(140deg, #3a3730 0%, #302f2c 18%, #282829 38%, #212226 58%, #1a1b22 78%, #12131c 100%)` |
| `--holo-card-inset-color` | `#ffffff0f` (rgb(255 255 255 / .06)) |
| `--holo-card-pattern` | rainbow `repeating-linear-gradient(115deg, ... 18px)` + 1px black scanlines `repeating-linear-gradient(90deg, #0006 0 1px, transparent 1px 3px)` |
| `--holo-card-pattern-size` | `auto` |
| `--holo-card-pattern-opacity` | `.9` |
| `--holo-card-shine-pattern` | `var(--holo-card-pattern)` |
| `--holo-card-shine-opacity` | `1` |
| `--holo-card-texture-opacity` | `.1` |
| `--holo-card-content-text-shadow` | `0 4px 24px rgb(0 0 0 / calc(.55 * var(--holo-card-opacity)))` |
| read-only | `--holo-card-pointer-x/-y` (50%), `--holo-card-background-x/-y` (50%), `--holo-card-opacity` (0) |

Layers (z-index inside the surface): image 0, inset 1, pattern 2 (overlay blend, texture opacity), shine 6
(color-dodge, filter `brightness(1.25) contrast(1.1) saturate(1.2)`, opacity `opacity * shine-opacity`), content 20
(text shadow, layer `pointer-events: none`, children `auto`). Shine is a grid: `::before` white + `brightness(0)` hard
light, `::after` radial gradient at the pointer (`#b8b8b8 0%, #c7c7c730 25%, #000 90%`, luminosity, `brightness(.5)
contrast(2)`), shine pattern soft-light at pattern opacity with `background-position: calc((50% - bg-x) * 2.6 + 50%)
calc((50% - bg-y) * 3.5 + 50%)`. Surface box shadow `0 4px 16px rgb(0 0 0 / .12*opacity), 0 12px 32px rgb(0 0 0 /
.08*opacity)` with `transition: box-shadow .15s`. Rotator, frame, surface and inset carry `outline: 1px solid
transparent` (edge anti-aliasing in 3D). Inset: `inset: 8px`, radius `radius - 8px`, 1px border.

State hooks: `[data-active="true"]` adds `perspective`, `transform-style: preserve-3d` (root + rotator),
`will-change: transform` (rotator), `content-visibility: visible; will-change: opacity` (shine; hidden otherwise).
`[data-tilt-on-touch="true"]` -> `touch-action: pan-y pinch-zoom`, reset to `auto` under
`prefers-reduced-motion: reduce`.

Theme: no theme tokens are involved; the card is a self-coloured dark object, identical in light and dark (verified both
themes). Literal colours are kept exactly where Pro uses literal colours. Demo text uses `text-white/*` utilities.

## 5. Behaviour (measured)

- Tracking listeners live on the root (any point of the frame, including the bleed, tracks; leaving the root settles).
- Pointer mapping: relative to the card's layout box (surface `offsetWidth/Height` centred on the root, hover scale
  ignored): `x = clamp((clientX - left) / width * 100, 0, 100)`, rounded to 3 decimals (e.g. 100px into a 302px card
  -> `11.589%`).
- Every animated value is its own spring (8 of them): `pointerX/Y`, `backgroundX/Y`, `rotateX/Y`, `opacity`, `scale`.
  Targets on move: `pointer = (x, y)`, `background-x = 37 + x * .26`, `background-y = 33 + y * .34`,
  `rotateX = round3((y - 50) / 50 * maxTilt)`, `rotateY = round3(-(x - 50) / 50 * maxTilt)` (e.g. `7.143deg`,
  `3.733deg`), `opacity = 1`, `scale = hoverScale`; on leave / pointercancel every value returns to rest (50% / 0 / 1)
  with the settle spring. Content `translateX = rotateY * parallaxStrength / 18`, `translateY = -rotateX *
  parallaxStrength / 18` (px) is derived from the rotation springs each frame.
- Because the values are separate springs they come to rest independently. Measured on the membership demo, settle from
  (25%, 75%): background-x 484ms, rotation + content 501ms, background-y 517ms, scale 534ms, pointer 634ms, opacity
  851ms (the remake reproduces every one of these to the frame, and the mid-flight values to ~9 digits).
- Springs: follow spring is overdamped (roots -10 / -18 s^-1): progress 0.52 @ ~100ms, 0.80 @ 200ms, 0.92 @ 300ms;
  settle spring near-critical: 0.45 @ 139ms, 0.80 @ 273ms, 0.93 @ 406ms. Every pointermove restarts all 8 springs from
  their current value and velocity, with the clock starting at the event (the time since the last frame is not
  replayed). Rest thresholds are chosen per value at each restart: travel >= 5 -> snap within 0.5 at speed <= 2,
  travel < 5 (opacity, scale, small moves, `maxTilt={8}` rotation) -> within 0.005 at speed <= 0.01.
- `pointerenter` alone never tracks (the card stays flat until the first move); it only wakes an `activateOnHover` card.
- Inline transforms: root `scale(s)` or `none`, rotator `rotateX(a) rotateY(b)` (zero parts omitted) or `none`, each
  content `translateX(..px) translateY(..px)` or `none`.
- Touch/pen: `pointerdown` alone does nothing; touch/pen `pointermove` tracks when `data-tilt-on-touch`; `pointerup`
  alone keeps the tilt, the following pointerleave / pointercancel settles.
- `activateOnHover`: `data-active="false"` at rest, flips to `"true"` on mouse enter (or a mouse move), back to
  `"false"` once every spring has rested. Card grid (`maxTilt={8}`, granular rotation): rotation rests last at ~998ms,
  `data-active="false"` at ~1032ms in Pro and ~1016ms in the remake. Touch/pen ignored.
- `isInteractive={false}` / `isDisabled`: `data-active="false"`, no `data-tilt-on-touch`, events ignored.
- `prefers-reduced-motion: reduce`: card static (no tracking, `data-active="false"` in the remake); touch-action reset
  by CSS.
- No keyboard behaviour (decorative, not focusable).

## 6. Demos -> stories

| Pro demo | Story | Structure |
| --- | --- | --- |
| `holo-card-default` | `Default` | Inset, Pattern, centred Content (title text-3xl bold + 10px tracking-widest uppercase caption), Shine |
| `holo-card-membership-card` | `MembershipCard` | `gradient` prop, Inset, Pattern, 3 Content bands (icon `pt-12`, name centre, footer row `pb-10` w-[220px]), Shine |
| `holo-card-credit-card` | `CreditCard` | 380x240 r16 bleed 28, `gradient`, Content `flex-col justify-between p-6` (brand/tier + contactless, chip + masked number with sr-only text, holder/expiry) |
| `holo-card-custom-gradient` | `CustomGradient` | 3 cards 150x225 r16 bleed 20, `gap-2`, Inset + Content + Shine |
| `holo-card-with-pattern` | `WithPattern` | 2 cards 215x320 r18 bleed 22, custom pattern + size, Pattern, bottom caption `pb-8` |
| `holo-card-image-gallery` | `ImageGallery` | 3 cards 210x294 r14 bleed 24, Image (420x588 art) + Pattern + Shine |
| `holo-card-static` | `Static` | 2 cards 200x300 r16 bleed 20, second `isInteractive={false}` |
| `holo-card-card-grid` | `CardGrid` | `flex flex-wrap justify-center` (no max width), 16 cards 120x168 r10 bleed 14, `activateOnHover hoverScale={1.04} maxTilt={8} shineOpacity={0.55}`, lazy Image + Shine |

Story art uses the public `img.heroui.chat/image/game` endpoint (also used by the OSS repo) with different seeds.

## 7. Dependencies

None beyond React. Pro uses Motion for springs; the remake ships a small rAF closed-form spring integrator
(`use-spring-values.ts`), so the component is safe for the root barrel.

## 8. Deviations

- No Motion: parts accept native div attributes, not Motion props (`whileHover`, `animate`, ...).
- The resting pointer variables / `transform: none` are written by an effect after mount instead of being SSR-rendered
  inline (CSS declares the same resting values, so the first paint is identical).
- `patternSrc` also accepts CSS image values (passed through) in addition to URLs.
- The springs are a closed-form damped-oscillator integrator (`use-spring-values.ts`) instead of Motion; rest velocity is
  the exact derivative rather than Motion's 5ms backward difference (rest times identical within a frame).
- `activateOnHover` flips `data-active="false"` one frame (~16ms) earlier than Pro after the last spring rests.

## Appendix A - observed CSSOM (reference only, `@layer components`)

```css
.holo-card { transform-origin: 50% center; touch-action: auto; /* + all variables above */ width: fit-content; display: grid; }
.holo-card__rotator { transform-origin: 50% center; pointer-events: auto; display: grid; }
.holo-card__frame { width: calc(var(--holo-card-width) + var(--holo-card-bleed) * 2); height: calc(var(--holo-card-height) + var(--holo-card-bleed) * 2); grid-area: 1 / 1; position: relative; overflow: clip; }
.holo-card__surface { width: var(--holo-card-width); height: var(--holo-card-height); z-index: 1; border-radius: var(--holo-card-radius); background: var(--holo-card-gradient); box-shadow: 0 4px 16px rgb(0 0 0/calc(.12 * var(--holo-card-opacity))), 0 12px 32px rgb(0 0 0/calc(.08 * var(--holo-card-opacity))); transition: box-shadow .15s; position: absolute; top: 50%; left: 50%; overflow: clip; transform: translate(-50%, -50%); }
.holo-card__rotator, .holo-card__frame, .holo-card__surface, .holo-card__inset { outline: 1px solid transparent; }
.holo-card__image { object-fit: cover; user-select: none; z-index: 0; border-radius: inherit; width: 100%; height: 100%; position: absolute; inset: 0; }
.holo-card__inset { pointer-events: none; border: 1px solid var(--holo-card-inset-color); border-radius: calc(var(--holo-card-radius) - 8px); z-index: 1; position: absolute; inset: 8px; overflow: clip; }
.holo-card__pattern { pointer-events: none; z-index: 2; mix-blend-mode: overlay; opacity: var(--holo-card-texture-opacity); background-image: var(--holo-card-pattern); background-size: var(--holo-card-pattern-size); border-radius: inherit; background-repeat: repeat; position: absolute; inset: 0; }
.holo-card__content { pointer-events: none; z-index: 20; text-shadow: var(--holo-card-content-text-shadow); display: flex; position: absolute; inset: 0; }
.holo-card__content > * { pointer-events: auto; }
.holo-card__shine { pointer-events: none; z-index: 6; border-radius: inherit; filter: brightness(1.25) contrast(1.1) saturate(1.2); mix-blend-mode: color-dodge; opacity: calc(var(--holo-card-opacity) * var(--holo-card-shine-opacity)); content-visibility: hidden; display: grid; position: absolute; inset: 0; overflow: hidden; }
.holo-card__shine > * { grid-area: 1 / 1; }
.holo-card__shine::before, .holo-card__shine::after { content: ""; border-radius: inherit; grid-area: 1 / 1; }
.holo-card__shine::before { background-blend-mode: screen; filter: brightness(0) contrast(1.1); mix-blend-mode: hard-light; background: #fff; }
.holo-card__shine::after { background-image: radial-gradient(farthest-corner circle at var(--holo-card-pointer-x) var(--holo-card-pointer-y), #b8b8b8 0%, #c7c7c730 25%, #000 90%); mix-blend-mode: luminosity; filter: brightness(.5) contrast(2); background-position: 50%; background-size: cover; }
.holo-card__shine-pattern { z-index: 2; mix-blend-mode: soft-light; opacity: var(--holo-card-pattern-opacity); background-image: var(--holo-card-shine-pattern); background-size: var(--holo-card-pattern-size); background-repeat: repeat; background-position: calc(((50% - var(--holo-card-background-x)) * 2.6) + 50%) calc(((50% - var(--holo-card-background-y)) * 3.5) + 50%); border-radius: inherit; position: absolute; inset: 0; }
.holo-card[data-tilt-on-touch="true"] { touch-action: pan-y pinch-zoom; }
@media (prefers-reduced-motion: reduce) { .holo-card[data-tilt-on-touch="true"] { touch-action: auto; } }
.holo-card[data-active="true"] { perspective: var(--holo-card-perspective); transform-style: preserve-3d; }
.holo-card[data-active="true"] .holo-card__rotator { transform-style: preserve-3d; will-change: transform; }
.holo-card[data-active="true"] .holo-card__shine { content-visibility: visible; will-change: opacity; }
```
