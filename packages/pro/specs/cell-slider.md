# Cell Slider — clean-room implementation spec

Slug: `cell-slider` · Docs: https://heroui.pro/docs/react/components/cell-slider · Category: Forms
Import (Pro): `import {CellSlider} from "@heroui-pro/react";` (root export; no heavy peers)
Storybook title (ours): `Pro/Forms/CellSlider`

Sources: the public docs text, the rendered DOM / CSSOM / computed styles of the 7 public demo pages
(`?theme=light` and `?theme=dark`), runtime probing (hover, Tab focus, arrow / Home / End / PageUp / PageDown keys,
synthetic pointer drag), the public Storybook story list (`storybook.heroui.pro/index.json`, names only) and the OSS
`Slider` in this repo (`packages/react/src/components/slider`, `packages/styles/components/slider.css`).
The paywalled example source and the Storybook code panels were not opened.

---

## 1. Purpose

A settings "cell" whose whole surface is a slider: a field-styled 36px row with the label floating at the start,
the formatted value at the end and a flat tint (the fill) growing from the start edge to the current value.
The thumb is invisible until the row is hovered, focused or dragged, when a thin 2×16px pill appears at the value.
Member of the Cell\* family (Cell Switch, Cell Select, Cell Color Picker); each is its own BEM block, there is no
shared `.cell` class (see `cell-switch.md` §4.5 for the shared "field row" recipe, reused here on the track).

---

## 2. Anatomy

```tsx
<CellSlider>                 // OSS Slider (RAC Slider) -> <div role="group">
  <CellSlider.Track>         // OSS Slider.Track (RAC SliderTrack) -> <div> - the visible cell row
    <CellSlider.Fill />      // OSS Slider.Fill -> <div> (inline left/width)
    <CellSlider.Thumb />     // OSS Slider.Thumb (RAC SliderThumb) -> <div> (+ hidden <input type="range">)
    <CellSlider.Label />     // <span>
    <CellSlider.Output />    // OSS Slider.Output (RAC SliderOutput) -> <output>
  </CellSlider.Track>
</CellSlider>
```

Rendered DOM (Basic demo, value 0.5, step 0.01):

```html
<div data-slot="cell-slider" class="slider cell-slider" data-rac role="group" id="…" aria-label="…" data-orientation="horizontal">
  <div style="position:relative;touch-action:none" class="slider__track cell-slider__track cell-slider__track--default"
       data-slot="cell-slider-track" data-fill-start="true" data-rac data-orientation="horizontal">
    <div class="slider__fill cell-slider__fill" data-slot="cell-slider-fill" style="left:0%;width:50%"></div>
    <div data-slot="cell-slider-thumb" style="position:absolute;left:50%;transform:translate(-50%, -50%);touch-action:none"
         class="slider__thumb cell-slider__thumb" data-rac>
      <div style="(VisuallyHidden)"><input tabindex="0" type="range" min="0" max="1" step="0.01" aria-valuetext="0.50" value="0.5" …></div>
    </div>
    <span class="cell-slider__label" data-slot="cell-slider-label">…</span>
    <output aria-live="off" data-slot="cell-slider-output" class="slider__output cell-slider__output" data-rac data-orientation="horizontal">0.50</output>
  </div>
</div>
```

| Part | Element | `data-slot` | BEM classes | Built on |
|---|---|---|---|---|
| `CellSlider` (root) | `div[role=group]` | `cell-slider` (overrides OSS `slider`) | `slider cell-slider` (no variant modifier) | OSS `Slider` / RAC `Slider`, `orientation="horizontal"` forced |
| `CellSlider.Track` | `div` | `cell-slider-track` | `slider__track cell-slider__track cell-slider__track--{default\|secondary}` | OSS `Slider.Track` |
| `CellSlider.Fill` | `div` | `cell-slider-fill` | `slider__fill cell-slider__fill` | OSS `Slider.Fill` |
| `CellSlider.Thumb` | `div` (+ input) | `cell-slider-thumb` | `slider__thumb cell-slider__thumb` | OSS `Slider.Thumb` |
| `CellSlider.Label` | `span` | `cell-slider-label` | `cell-slider__label` | plain span (not an RAC `Label`; no id / aria link) |
| `CellSlider.Output` | `output` | `cell-slider-output` | `slider__output cell-slider__output` | OSS `Slider.Output` (default text = formatted thumb values) |

State attributes (all from RAC / OSS, nothing Pro-specific):
- root: `data-orientation="horizontal"`, `data-disabled`
- track: `data-fill-start` (fill width > 0), `data-fill-end` (value at max), `data-hovered`, `data-disabled`, `data-orientation`
- fill: `data-disabled`
- thumb: `data-focused`, `data-focus-visible`, `data-dragging`, `data-hovered` (only when the pointer is on the 20px hit area), `data-disabled`
- output: `data-orientation`, `data-disabled`
- Every demo passes `aria-label` on the root (labels the group, and the input via `aria-labelledby`).

---

## 3. API (docs)

### `CellSlider` (root)
"The root component. Wraps HeroUI Slider with cell-style layout. Always renders in horizontal orientation."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'secondary'` | `'default'` | Visual style variant |

Also supports all HeroUI Slider props except `variant` and `orientation` (`value`, `defaultValue`, `onChange`,
`onChangeEnd`, `minValue`, `maxValue`, `step`, `formatOptions`, `isDisabled`, `name`, `aria-label`, `className`, render-fn `children`, …).

### `CellSlider.Track` — "The visible cell row serving as the slider track. Contains fill, thumb, label, and output as children." Also all `Slider.Track` props.
### `CellSlider.Fill` — "Subtle accent tint showing the current slider value." Also all `Slider.Fill` props.
### `CellSlider.Thumb` — "Transparent hit area for drag and keyboard accessibility. The visible indicator is a ::after pseudo-element (thin 3px pill)." Also all `Slider.Thumb` props. (Measured pill width is **2px**, `--cell-slider-thumb-width`.)
### `CellSlider.Label` — "Leading text label, absolutely positioned on the left." `children: ReactNode`; native span attributes.
### `CellSlider.Output` — "Value display, absolutely positioned on the right." Also all `Slider.Output` props.

### CSS classes (docs)
Base: `.cell-slider`, `.cell-slider__track`, `.cell-slider__fill`, `.cell-slider__thumb`, `.cell-slider__label`, `.cell-slider__output`.
Variant: `.cell-slider__track--default`, `.cell-slider__track--secondary` (only the track gets a modifier).
CSS variables (not in the docs, defined on `.cell-slider`): `--cell-slider-thumb-width: 2px`, `--cell-slider-thumb-height: 16px`.

---

## 4. Styling (all in `@layer components`, after the OSS slider rules)

The OSS `.slider .slider__*` (0,2,0) and `.slider[data-orientation="horizontal"] .slider__*` (0,3,0) rules still apply;
Pro overrides them with `.cell-slider .cell-slider__*` (0,2,0, later in the cascade) and
`.cell-slider[data-orientation="horizontal"] .cell-slider__*` (0,3,0).

### 4.1 Root `.cell-slider`
`--cell-slider-thumb-width: 2px; --cell-slider-thumb-height: 16px; display: block; grid-template: none; gap: 0; outline: none; -webkit-tap-highlight-color: transparent`;
horizontal: `flex-direction: row`. OSS disabled rule still fades the root (`status-disabled`).

### 4.2 Track `.cell-slider__track` (field row recipe)
- `position: relative; display: flex; align-items: center; width: 100%; height: 36px (h-9); padding-inline: 3×spacing (12px); overflow: hidden`, then a second rule pins `padding-right: 0.75rem` (literal, physical).
  With `--spacing: 0.3rem` Pro gives left 14.4px / right 12px (no visual effect, every child is absolutely positioned; mirrored anyway)
- `border-radius: var(--field-radius, radius×1.5)` (12px); `border: var(--border-width-field) solid var(--color-field-border)`; horizontal: `border-inline-width: 0` (kills the OSS 0.75rem transparent thumb gutters, so the thumb maps to the full width)
- `background: var(--field-background, var(--default))`; `color: var(--field-foreground)`; `box-shadow: var(--field-shadow)`; `cursor: var(--cursor-interactive)`; `outline: none`; no tap highlight
- `transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out)`, off under motion-reduce
- Hover (`@media (hover:hover)`; Pro: `:hover` and `[data-hovered="true"]`): `background: var(--field-hover)`, `border-color: var(--color-field-border-hover)`
- `[data-focus-visible="true"]`: focus ring + `--color-field-border-focus` + `--color-field-focus` (RAC never sets it on the track; kept for parity)
- `--secondary`: `bg-default`, `shadow-none`; hover `bg-surface-tertiary` (not `default-hover`!); focus-visible `bg-default`
- Disabled: `.cell-slider[data-disabled="true"] .cell-slider__track, .cell-slider[aria-disabled="true"] .cell-slider__track` → `status-disabled`.
  Compounds with the OSS root fade: root .5, track .5 → .25 visible.
- Measured: 252×36 inside `w-[252px]`.

### 4.3 Fill `.cell-slider__fill`
`position: absolute; inset-block: 0; left: 0; border-radius: 0; pointer-events: none; background: var(--color-default)`.
Secondary: `.cell-slider__track--secondary .cell-slider__fill` → `muted / 20%`. Inline `left`/`width` from OSS Fill (RTL: `right` — `left: 0` is then ignored because left/right/width are over-constrained).

### 4.4 Thumb `.cell-slider__thumb`
- Hit area: `position: absolute; top: 0; height: 100%; width: 1.25rem (literal 20px, does not follow --spacing; base rule says 2×thumb-width, overridden for horizontal); z-index: 2;`
  `translate: 0 50%` (cancels the RAC `translate(-50%,-50%)` vertically); `display: flex; center/center`; `background: transparent; border: none; border-radius: 0; box-shadow: none; outline: none; cursor: var(--cursor-interactive)`
- Pill `::after`: `content:""; display:block; width: var(--cell-slider-thumb-width); height: var(--cell-slider-thumb-height); border-radius: var(--radius-md)` (6px);
  `background: var(--foreground); opacity: 0; box-shadow: none; transition: opacity .15s var(--ease-smooth), transform .12s var(--ease-smooth)`.
  OSS leftovers that still apply: `position: relative; z-index: 10; --tw-shadow: var(--field-shadow)`.
- Hover row (`@media (hover:hover)`): `.cell-slider__track[data-hovered] .cell-slider__thumb:not([data-dragging])::after { opacity: .4 }` — specificity (0,4,1) beats the focus rule, so a hovered + focused pill is .4.
- `[data-focus-visible="true"]`: thumb `box-shadow: none; outline: none` (OSS z-index 10 stays); `::after` `opacity: .7`, focus ring (2px `--background` offset + 2px `--focus`, plus the inherited field shadow), `transform: scaleY(1.2)`.
- `[data-dragging="true"]`: `cursor: var(--cursor-interactive)`; `::after` `opacity: .7; transform: scaleY(1.5)` (OSS `scale: .9` still applies → effective 0.9 × 1.35).
- Reduced motion: transitions off.

### 4.5 Label / Output
- `.cell-slider__label`: `position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); z-index: 1; max-width: 60%; min-width: 0; truncate; text-align: start; text-sm; font-medium; color: var(--foreground); pointer-events: none`
- `.cell-slider__output`: `position: absolute; inset-inline-end: 12px; top: 50%; transform: translateY(-50%); z-index: 1; text-align: end; text-sm; font-normal; color: var(--muted); tabular-nums; pointer-events: none`
- Measured (Basic, light): label x=12 y=8 h=20; output right edge 12px from the end, 20px high.

### 4.6 Tokens (light / dark, measured on the demos)
| Token | Light | Dark | Used by |
|---|---|---|---|
| `--field-background` | `lab(100 0 0)` | `lab(8.34 …)` | default track |
| `--field-shadow` | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | transparent inset | default track |
| `--field-hover` | `oklab(.983 … / .92)` | mix of surface/foreground | default hover |
| `--default` | `lab(93.03 …)` | `lab(15.73 …)` | default fill, secondary track |
| `--surface-tertiary` | `lab(92.72 …)` | `lab(15.56 …)` | secondary hover |
| `--muted` 20% | `oklab(.552 … / .2)` | `oklab(.705 … / .2)` | secondary fill |
| `--muted` | `lab(47.87 …)` | `lab(65.65 …)` | output text |
| `--foreground` | `lab(8.34 …)` | `lab(98.97 …)` | label, pill |
| `--radius-md` | `calc(var(--radius) * .75)` = 6px | same | pill radius |
All exist in our theme; values only differ by lab/oklch serialisation.

---

## 5. Behaviour (identical in our build — it is the OSS Slider / RAC)

- Pointer down anywhere on the track jumps the value there and starts a drag (`data-dragging` + `data-focused` on the thumb).
  The full track width maps to the range (no gutters): +30px on a 252px track = +0.12 of a 0..1 range.
- Keyboard (thumb input, `tabindex=0`): ←/→/↑/↓ ±step, PageUp/PageDown ±10% of the range, Home/End min/max. Tab focus shows the pill with a ring.
- `onChange(number)` per change, `onChangeEnd` on release. `data-fill-end` appears at max, `data-fill-start` disappears at min.
- Disabled: input `disabled`, no pointer events; root and track each at .5 opacity; thumb cursor default.
- Output text = `state.getThumbValueLabel(0)` (RAC `formatOptions`). The decimal demos show `0.50` for 0.5, so they pass a
  2-fraction-digit `formatOptions` (or Pro derives it from `step`; not observable — see Open questions). Integer demo shows `75`.
- Motion: track colours 150ms; pill opacity 150ms, scale 120ms (`--ease-smooth` = `ease`). No keyframes.

---

## 6. Demo variants (docs order)

| # | Docs section | Demo URL (`?theme=light\|dark`) | Structure | Our story |
|---|---|---|---|---|
| 1 | Usage | https://heroui.pro/docs/react/demos/cell-slider-settings-group | `flex w-[252px] flex-col gap-4` > 2 × (`flex flex-col gap-2` > `span.text-muted.text-sm` caption + 2 default cells); values 0.5 / 0.3, range 0..1 step 0.01, 2 decimals | `SettingsGroup` |
| 2 | Secondary Group | …/cell-slider-secondary-group | `flex w-[252px] flex-col gap-2`, 2 secondary cells (0.5 / 0.3) | `SecondaryGroup` |
| 3 | Basic | …/cell-slider-default | `w-[252px]`, one default cell (0.5) | `Basic` |
| 4 | Variants | …/cell-slider-variants | `flex w-[252px] flex-col gap-3` > per variant `flex flex-col gap-1` + `span.text-muted.text-xs` caption ("default" / "secondary") + cell | `Variants` |
| 5 | Integer Step | …/cell-slider-integer-step | `w-[252px]`, one cell 0..100 step 1, value 75, output "75" | `IntegerStep` |
| 6 | Disabled | …/cell-slider-disabled | `flex w-[252px] flex-col gap-2`, 2 `isDisabled` cells | `Disabled` |
| 7 | Controlled | …/cell-slider-controlled | `flex w-[252px] flex-col gap-2`; `value`/`onChange` from `useState(0.5)`; `p.text-muted.px-1.text-sm` "Value: 0.50" below | `Controlled` |

Pro Storybook ids (names only): default, variants, controlled, settings-group, secondary-group, integer-step, disabled.

---

## 7. Dependencies

- OSS `@heroui/react`: `Slider` (Root / Track / Fill / Thumb / Output). React Aria Components through it.
- No other Pro component, no heavy peers → root export allowed.

## 8. Deviations

- Hover is keyed on `[data-hovered="true"]` only (HeroUI convention); Pro also matches `:hover`. RAC sets `data-hovered` on the track for mouse/pen, so the result is the same except for touch-emulated hover.
- Reduced motion also turns off the pill transition: Pro's `motion-reduce` inside `::after` compiles to an invalid `::after:is()` selector, so it never applies there; ours applies `motion-reduce:transition-none` on the thumb, which covers its `::after`.
- Story texts/values are our own (same structure, ranges, steps and formatting).

## 9. Open questions

- Whether Pro derives a default `formatOptions` from `step` (the decimal demos show `0.50`). Not observable from the public pages; we keep the RAC default formatting and pass `formatOptions` in the stories.

---

## Appendix A — CSSOM (Pro `cell-slider` rules, reference only; reduced-motion duplicates omitted)

```css
.cell-slider { --cell-slider-thumb-width: 2px; --cell-slider-thumb-height: 16px; outline-style: none; -webkit-tap-highlight-color: transparent; grid-template: none; gap: 0; display: block; }
.cell-slider .cell-slider__track { height: calc(var(--spacing)*9); border-radius: var(--field-radius,calc(var(--radius)*1.5)); background-color: var(--field-background,var(--default)); width:100%; padding-inline: calc(var(--spacing)*3); color: var(--field-foreground,var(--foreground)); box-shadow: …var(--field-shadow); cursor: var(--cursor-interactive); transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); border-width:1px; outline-style:none; align-items:center; display:flex; position:relative; overflow:hidden; }
.cell-slider .cell-slider__track { border-width: var(--border-width-field); border-color: var(--color-field-border); padding-right: 0.75rem; }
@media (hover:hover) { .cell-slider .cell-slider__track:hover, .cell-slider .cell-slider__track[data-hovered="true"] { background-color: var(--field-hover); border-color: var(--color-field-border-hover); } }
.cell-slider .cell-slider__track[data-focus-visible="true"] { [focus ring]; border-color: var(--color-field-border-focus); background-color: var(--color-field-focus); }
.cell-slider .cell-slider__track--secondary { box-shadow: none; background-color: var(--color-default); }
@media (hover:hover) { .cell-slider .cell-slider__track--secondary:hover, …[data-hovered="true"] { background-color: var(--color-surface-tertiary); } }
.cell-slider .cell-slider__track--secondary[data-focus-visible="true"] { background-color: var(--color-default); }
.cell-slider .cell-slider__track--secondary .cell-slider__fill { background-color: color-mix(in oklab, var(--muted) 20%, transparent); }
.cell-slider .cell-slider__fill { pointer-events:none; background-color: var(--color-default); inset-block:0; border-radius:0; position:absolute; left:0; }
.cell-slider .cell-slider__thumb { translate: 0 50%; height:100%; z-index:2; width: calc(var(--cell-slider-thumb-width)*2); box-shadow:none; cursor: var(--cursor-interactive); background: transparent; border: none; border-radius:0; outline:none; justify-content:center; align-items:center; display:flex; position:absolute; top:0; }
.cell-slider .cell-slider__thumb::after { content:""; width: var(--cell-slider-thumb-width); height: var(--cell-slider-thumb-height); border-radius: var(--radius-md); background-color: var(--color-foreground); opacity:0; box-shadow:none; transition: opacity .15s var(--ease-smooth), transform .12s var(--ease-smooth); display:block; }
.cell-slider .cell-slider__thumb[data-focus-visible="true"] { box-shadow:none; outline:none; }
.cell-slider .cell-slider__thumb[data-focus-visible="true"]::after { opacity:.7; [focus ring]; transform: scaleY(1.2); }
.cell-slider .cell-slider__thumb[data-dragging="true"] { cursor: var(--cursor-interactive); }
.cell-slider .cell-slider__thumb[data-dragging="true"]::after { opacity:.7; transform: scaleY(1.5); }
@media (hover:hover) { .cell-slider .cell-slider__track:hover .cell-slider__thumb:not([data-dragging="true"])::after, …[data-hovered="true"] … { opacity:.4; } }
.cell-slider .cell-slider__label { pointer-events:none; text-overflow:ellipsis; white-space:nowrap; text-align:start; min-width:0; max-width:60%; font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--foreground); z-index:1; inset-inline-start: calc(var(--spacing)*3); position:absolute; top:50%; overflow:hidden; transform: translateY(-50%); }
.cell-slider .cell-slider__output { pointer-events:none; text-align:end; font-size: var(--text-sm); font-weight: var(--font-weight-normal); color: var(--muted); z-index:1; font-variant-numeric: tabular-nums; inset-inline-end: calc(var(--spacing)*3); position:absolute; top:50%; transform: translateY(-50%); }
.cell-slider[data-disabled="true"] .cell-slider__track, .cell-slider[aria-disabled="true"] .cell-slider__track { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events:none; }
.cell-slider[data-orientation="horizontal"] { flex-direction: row; }
.cell-slider[data-orientation="horizontal"] .cell-slider__track { height: calc(var(--spacing)*9); border-radius: var(--field-radius,…); border-inline-width: 0; }
.cell-slider[data-orientation="horizontal"] .cell-slider__fill, .cell-slider[data-orientation="horizontal"] .cell-slider__thumb { height:100%; }
.cell-slider[data-orientation="horizontal"] .cell-slider__thumb { width: 1.25rem; top:0; }
.cell-slider[data-orientation="horizontal"] .cell-slider__thumb::after { width: var(--cell-slider-thumb-width); height: var(--cell-slider-thumb-height); }
```
