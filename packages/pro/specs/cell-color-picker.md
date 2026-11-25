# Cell Color Picker — clean-room implementation spec

Slug: `cell-color-picker` · Docs: https://heroui.pro/docs/react/components/cell-color-picker · Category: Forms
Import (Pro): `import {CellColorPicker} from "@heroui-pro/react";` (root export; no heavy peers)
Storybook title (ours): `Pro/Forms/CellColorPicker`

Sources: the public docs text, the rendered DOM and CSSOM of the 6 public demo pages (light and dark), computed
styles and runtime probing (hover, Tab, Enter, Escape, arrow keys in the popover). I compared the result with the OSS
`ColorPicker` / `ColorSwatch` / `ColorArea` / `ColorSlider` / `ColorSwatchPicker` / `ColorField` in this repo.
I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A settings "cell" for colours: a full-width field-styled row with a leading label, the current hex value and a small
round swatch. Pressing the row opens the OSS ColorPicker popover (colour area, hue slider, optional presets and hex
field). Part of the Pro **Cell\*** family (Cell Switch, Cell Select, Cell Slider).

---

## 2. Anatomy

```tsx
<CellColorPicker>                  // OSS ColorPicker.Root -> RAC ColorPicker + DialogTrigger + div.color-picker
  <CellColorPicker.Trigger>        // RAC Button (gets DialogTrigger's ButtonContext)
    <CellColorPicker.Label />      // span
    <CellColorPicker.ValueDisplay />  // span, "#RRGGBB" from ColorPickerStateContext
    <CellColorPicker.Swatch />     // OSS ColorSwatch (colour from the RAC ColorPicker context)
  </CellColorPicker.Trigger>
  <CellColorPicker.Popover>{/* OSS ColorArea / ColorSlider / ColorSwatchPicker / ColorField … */}</CellColorPicker.Popover>
</CellColorPicker>
```

Rendered DOM (Basic demo, closed):

```html
<div class="color-picker cell-color-picker" data-slot="color-picker">
  <button data-slot="cell-color-picker-trigger" class="cell-color-picker__trigger cell-color-picker__trigger--default"
          data-rac type="button" tabindex="0" aria-expanded="false" id="…" data-react-aria-pressable="true">
    <span class="cell-color-picker__label" data-slot="cell-color-picker-label">…</span>
    <span class="cell-color-picker__value-display" data-slot="cell-color-picker-value-display">#3B82F6</span>
    <div data-slot="color-swatch" role="img" aria-roledescription="color swatch" aria-label="vibrant cyan blue"
         class="color-swatch color-swatch--circle color-swatch--md cell-color-picker__swatch" data-rac
         style="background-color:…;forced-color-adjust:none;--color-swatch-current:…"></div>
  </button>
</div>
<!-- portaled when open -->
<div data-slot="color-picker-popover" class="color-picker__popover cell-color-picker__popover" role="dialog"
     tabindex="-1" data-trigger="DialogTrigger" data-placement="bottom" aria-labelledby="<trigger id>"
     style="…--trigger-anchor-point: 248px 0px; --trigger-width: 252px; …">…children…</div>
```

| Part | Element | `data-slot` | BEM classes | Built on |
|---|---|---|---|---|
| `CellColorPicker` (root) | `div` | `color-picker` (OSS, not overridden) | `color-picker cell-color-picker` | OSS `ColorPicker.Root` |
| `.Trigger` | `button` | `cell-color-picker-trigger` | `cell-color-picker__trigger cell-color-picker__trigger--{default\|secondary}` | RAC `Button` (not OSS `ColorPicker.Trigger`: no `color-picker__trigger` class) |
| `.Label` | `span` | `cell-color-picker-label` | `cell-color-picker__label` | span |
| `.ValueDisplay` | `span` | `cell-color-picker-value-display` | `cell-color-picker__value-display` | span + `ColorPickerStateContext` |
| `.Swatch` | `div role=img` | `color-swatch` (OSS) | `color-swatch color-swatch--circle color-swatch--md cell-color-picker__swatch` | OSS `ColorSwatch` |
| `.Popover` | `div role=dialog` | `color-picker-popover` (OSS) | `color-picker__popover cell-color-picker__popover` | OSS `ColorPicker.Popover` (RAC Popover) |

Notes
- The variant modifier goes only on the trigger; the root never gets a `--secondary` class.
- No `aria-haspopup` (RAC dialog trigger); `aria-expanded` / `aria-controls` from DialogTrigger. While open the trigger
  has `data-pressed="true"` (DialogTrigger passes `isPressed`).
- Disabled demo: only the trigger is disabled (`disabled=""`, `data-disabled="true"`, no tabindex); the root has no
  state attributes. RAC ColorPicker has no `isDisabled`, so the demo passes `isDisabled` to `CellColorPicker.Trigger`.
- `ValueDisplay` text is `color.toString("hex")`: uppercase, 6 digits, alpha dropped.

---

## 3. API (from docs)

### `CellColorPicker` (root)
"The root component. Wraps HeroUI ColorPicker with cell-style layout."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'secondary'` | `'default'` | Visual style variant |

Also all RAC ColorPicker props except render-function children (`defaultValue`, `value`, `onChange`), plus `className`.

### `CellColorPicker.Trigger`
"The visible cell row button. Wraps RAC Button." All RAC Button props (`isDisabled`, `onPress`, render-prop className …).

### `CellColorPicker.Label`
"Leading text label rendered as a span." `children: ReactNode` + native span attributes.

### `CellColorPicker.ValueDisplay`
"Displays the current color as a hex value (e.g. #FF5733). Automatically reads from the color picker state." Native span
attributes. (Ours: explicit `children` override the computed hex.)

### `CellColorPicker.Swatch`
"Color swatch preview. Wraps HeroUI ColorSwatch." All OSS ColorSwatch props (`shape`, `size`, `color` …).

### `CellColorPicker.Popover`
"Dropdown color picker panel. Wraps HeroUI ColorPicker.Popover."

| Prop | Type | Default | Description |
|---|---|---|---|
| `placement` | `Placement` | `'bottom end'` | Popover placement relative to the trigger |

Also all OSS ColorPicker.Popover props.

### CSS classes (docs)
Base: `.cell-color-picker`, `.cell-color-picker__trigger`, `.cell-color-picker__label`, `.cell-color-picker__value-display`,
`.cell-color-picker__swatch`, `.cell-color-picker__popover`. Variants: `.cell-color-picker__trigger--default`,
`.cell-color-picker__trigger--secondary`.
CSS variable (not in docs, found in the CSSOM): `--cell-color-picker-swatch-size: 1.25rem` on the root.

---

## 4. Styling

All rules in `@layer components`, nested under `.cell-color-picker` (specificity ≥ 0,2,0), so they beat the OSS
`.color-picker*` / `.color-swatch*` rules regardless of order. Tailwind utilities from `className` still win.

### 4.1 Root `.cell-color-picker`
`--cell-color-picker-swatch-size: 1.25rem; display: flex` (overrides OSS `.color-picker { inline-flex }`). Measured 252×36.

### 4.2 Trigger
- `display:flex; width:100%; height:36px; align-items:center; gap:12px; padding-inline:12px` (`3 × --spacing`), then
  `padding-inline-end: 0.75rem` pinned: with `--spacing: 0.3rem` Pro measures `14.4px` start / `12px` end (verified)
- `border-radius: var(--field-radius)` (12px), `border: var(--border-width-field) solid var(--color-field-border)` (0px)
- `background: var(--field-background)`; `color: var(--field-foreground)`; `box-shadow: var(--field-shadow)`
- `outline:none; -webkit-tap-highlight-color:transparent; cursor: var(--cursor-interactive)` (pointer)
- `transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out)`, off for reduced motion
- Text is not set on the trigger (inherits 16px/24px, UA `text-align:center`); label and value set their own type.
- Hover (`@media (hover:hover)`, Pro matches `:hover` and `[data-hovered="true"]`): `bg: var(--field-hover)`, `border-color: var(--color-field-border-hover)`
- Focus (`:focus-visible:not([data-focused])`, `[data-focus-visible="true"]`): focus ring (2px `--background` offset + 2px `--focus`), `border-color: var(--color-field-border-focus)`, `bg: var(--color-field-focus)`
- Disabled (`:disabled`, `[aria-disabled="true"]`): `opacity: var(--disabled-opacity)` (.5), `cursor: var(--cursor-disabled)` (not-allowed), `pointer-events:none`
- `--secondary`: `bg: var(--color-default)`, `box-shadow:none`; hover `var(--color-default-hover)`; focus-visible back to `--color-default` (ring stays)

### 4.3 Label / value / swatch / popover
- Label: `flex:1 1 0; min-width:0; truncate; text-align:start; text-sm (14/20); font-medium; color: var(--foreground)`. x = 12px.
- ValueDisplay: `margin-inline-start:auto; flex-shrink:0; truncate; text-align:end; text-sm; color: var(--muted)` (weight 400).
- Swatch: `width/height: var(--cell-color-picker-swatch-size)` (20px), `border-radius: calc(infinity*1px)`, `flex-shrink:0`.
  Fill and inset ring come from OSS `.color-swatch` (colour layered over the checkerboard, `inset 0 0 0 1px rgb(0 0 0/.1)`).
  Right edge sits 12px from the trigger edge (x 317.5 in a 252px row starting at 97.5).
- Popover: `.cell-color-picker .cell-color-picker__popover { min-width: var(--trigger-width) }`. The popover is
  portaled, so in practice the rule does not match. Measured min-width is the OSS `min-w-62` (248px), not 252px.
  Everything else is OSS `.color-picker__popover`: `bg-overlay`, overlay shadow, radius `min(32px, radius*2.5)` (20px),
  padding `8px 8px 12px`, `flex-col gap-3`, enter animation 150ms (scale .95 + translate), exit 100ms.
- Placement: `bottom end` gives a popover whose right edge lines up with the trigger's right edge, `top` = trigger bottom + 8px
  (RAC offset), `data-placement="bottom"`, `--trigger-anchor-point: <popover width> 0px`. Flips to top when there is no room.

### 4.4 Tokens (light / dark, measured)
| Token | Light | Dark |
|---|---|---|
| `--field-background` | `lab(100 0 0)` | `lab(8.34 …)` |
| `--field-shadow` | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | `0 0 0 0 transparent inset` |
| `--field-hover` | `color-mix(field 90%, foreground 2%)` → `oklab(.983 … / .92)` | (theme) |
| `--default` (secondary) | `lab(93.03 …)` | `lab(15.73 …)` |
| `--muted` (value) | `lab(47.87 …)` | `lab(65.65 …)` |
| `--overlay` (popover) | white | `lab(8.34 …)` + `inset 0 0 1px rgb(255 255 255/.3)` |
All map to existing HeroUI theme tokens, so no new tokens are needed (our build serialises them as oklch).

---

## 5. Behaviour

- Click / Enter / Space on the row opens the popover; focus moves to the popover (`role=dialog`, tabindex -1). Tab moves into
  the content (ColorArea 2D slider, then hue slider …). Escape closes it and focus goes back to the trigger. Clicking outside closes it.
- Changing the colour updates the ValueDisplay, the swatch and any controlled state (`onChange(Color)`) right away.
- Tab focuses the trigger (`data-focus-visible`, ring). A disabled trigger is skipped and cannot be pressed.
- Motion: trigger 150ms bg/border/shadow. The popover enter and exit animations come from OSS. No keyframes of its own.

---

## 6. Demo variants (docs order)

| # | Docs section | Demo URL (`?theme=light\|dark`) | Structure | Our story |
|---|---|---|---|---|
| 1 | Usage | https://heroui.pro/docs/react/demos/cell-color-picker-settings-group | `flex w-[252px] flex-col gap-2`; 3 default cells, each popover = ColorArea (`max-w-full`, hsb, saturation/brightness) + hue ColorSlider (`gap-1 px-1`, Label + Output `text-muted` + Track/Thumb) | `SettingsGroup` |
| 2 | With Presets | …/cell-color-picker-with-presets | `w-[252px]`; one cell; popover = ColorSwatchPicker (`size="xs"`, `justify-center pt-2`, 9 presets) + area + hue slider + ColorField (Group `variant="secondary"`, Prefix ColorSwatch xs, Input) | `WithPresets` |
| 3 | Basic | …/cell-color-picker-default | `w-[252px]`; one cell; area + hue slider | `Basic` |
| 4 | Variants | …/cell-color-picker-variants | `flex w-[252px] flex-col gap-3`; per variant `flex flex-col gap-1` + `span.text-muted.text-xs` caption + cell | `Variants` |
| 5 | Disabled | …/cell-color-picker-disabled | `w-[252px]`; one cell, `Trigger isDisabled` | `Disabled` |
| 6 | Controlled | …/cell-color-picker-controlled | `flex w-[252px] flex-col gap-2`; `value`/`onChange` from `useState(parseColor(…))`; below: `p.text-muted.px-1.text-sm` "…: #HEX" | `Controlled` |

The docs embed adds `&placement=top` to the demo URLs (the iframe preview opens popovers upward). That is a demo-page
concern, not a component prop default.

---

## 7. Dependencies

- OSS `@heroui/react`: `ColorPicker` (Root, Popover), `ColorSwatch`. Stories also use `ColorArea`, `ColorSlider`, `Label`,
  `ColorSwatchPicker`, `ColorField`, `parseColor`.
- `react-aria-components`: `Button`, `ColorPickerStateContext` (the same instance as the OSS package).
- No Pro dependencies. Cell Switch shares only the "field row" recipe (no shared base class), so the recipe is repeated in
  this block. No heavy peers, so it can be exported from the package root.

## 8. Deviations

- Hover is matched only through `[data-hovered="true"]` inside `@media (hover:hover)` (repo convention). Pro also matches `:hover`.
  RAC sets `data-hovered` for mouse/pen, so the visible result is the same.
- Disabled also matches `[data-disabled="true"]` (the RAC Button attribute) besides `:disabled` / `[aria-disabled]`.
- Story texts, labels, colours and preset palette are our own.
- Environment only: in the With Presets story the popover is 288px wide in our Storybook against 279px on heroui.pro. The width comes from the
  intrinsic size of the OSS ColorField `<input>` (20ch), and that differs between the two Inter builds. The component CSS is the same.

---

## Appendix A — CSSOM (Pro `cell-color-picker` rules, reference only; reduced-motion duplicates omitted)

```css
@layer components :: .cell-color-picker { --cell-color-picker-swatch-size: 1.25rem; display: flex; }
@layer components :: .cell-color-picker .cell-color-picker__trigger { height: 9×sp; align-items:center; gap: 3×sp; border-radius: var(--field-radius,…); border-width:1px; background-color: var(--field-background,var(--default)); width:100%; padding-inline: 3×sp; color: var(--field-foreground,…); box-shadow: …var(--field-shadow); outline-style:none; -webkit-tap-highlight-color:transparent; cursor: var(--cursor-interactive); transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); display:flex; }
@layer components :: .cell-color-picker .cell-color-picker__trigger { border-width: var(--border-width-field); border-color: var(--color-field-border); padding-inline-end: .75rem; }
@media (hover:hover) :: .cell-color-picker .cell-color-picker__trigger:hover, …[data-hovered="true"] { background-color: var(--field-hover); border-color: var(--color-field-border-hover); }
@layer components :: …__trigger:focus-visible:not([data-focused]), …__trigger[data-focus-visible="true"] { [focus ring]; border-color: var(--color-field-border-focus); background-color: var(--color-field-focus); }
@layer components :: …__trigger:disabled, …__trigger[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events:none; }
@layer components :: .cell-color-picker .cell-color-picker__trigger--secondary { box-shadow: none; background-color: var(--color-default); }
@media (hover:hover) :: …__trigger--secondary:hover, …[data-hovered="true"] { background-color: var(--color-default-hover); }
@layer components :: …__trigger--secondary:focus-visible:not([data-focused]), …[data-focus-visible="true"] { background-color: var(--color-default); }
@layer components :: .cell-color-picker .cell-color-picker__label { truncate; text-align:start; min-width:0; text-sm; font-medium; color: var(--foreground); flex:1 1 0%; }
@layer components :: .cell-color-picker .cell-color-picker__value-display { truncate; text-align:end; text-sm; color: var(--muted); flex-shrink:0; margin-inline-start:auto; }
@layer components :: .cell-color-picker .cell-color-picker__swatch { width/height: var(--cell-color-picker-swatch-size); border-radius: infinity; flex-shrink:0; }
@layer components :: .cell-color-picker .cell-color-picker__popover { min-width: var(--trigger-width); }
```
