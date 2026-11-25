# Cell Switch — clean-room implementation spec

Slug: `cell-switch` · Docs: https://heroui.pro/docs/react/components/cell-switch · Category: Forms
Import (Pro): `import {CellSwitch} from "@heroui-pro/react";` (root export; no heavy peers)
Storybook title (ours): `Pro/Forms/CellSwitch`

Sources used: the public docs text, the rendered DOM and CSSOM of the 7 public demo pages (light and dark),
computed styles, and runtime probing (hover, press, click, Tab, Space, Enter). Probing was done in a
headless browser because the shared built-in browser was at its tab cap. I compared the result with the OSS
`Switch` in this repo (`packages/react/src/components/switch`, `packages/styles/components/switch.css`).
I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A settings "cell": a full-width field-styled row with a leading label and a trailing switch. Clicking anywhere
in the row toggles the switch. It is the first of the Pro **Cell\*** family (Cell Select, Cell Slider,
Cell Color Picker).

---

## 2. Anatomy

```tsx
<CellSwitch>                 // OSS Switch (RAC SwitchField) -> <div>
  <CellSwitch.Trigger>       // OSS Switch.Content (RAC SwitchButton) -> <label> (wraps the hidden <input role="switch">)
    <CellSwitch.Label />     // <span>
    <CellSwitch.Control />   // OSS Switch.Control -> <span>, default child <Switch.Thumb/>
  </CellSwitch.Trigger>
</CellSwitch>
```

Rendered DOM (Basic demo, selected):

```html
<div data-slot="cell-switch" class="switch switch--md cell-switch" data-rac data-selected="true">
  <label data-slot="cell-switch-trigger" data-react-aria-pressable="true"
         class="switch__content cell-switch__trigger cell-switch__trigger--default" data-rac data-selected="true">
    <span style="(VisuallyHidden)"><input aria-label="…" type="checkbox" role="switch" tabindex="0" checked title=""></span>
    <span class="cell-switch__label" data-slot="cell-switch-label">…</span>
    <span class="switch__control cell-switch__control" data-slot="cell-switch-control">
      <span class="switch__thumb" data-slot="switch-thumb"></span>
    </span>
  </label>
</div>
```

| Part | Element | `data-slot` | BEM classes | Built on |
|---|---|---|---|---|
| `CellSwitch` (root) | `div` | `cell-switch` (overrides OSS `switch`) | `switch switch--md cell-switch` (+ `cell-switch--secondary`) | OSS `Switch` / RAC `SwitchField` |
| `CellSwitch.Trigger` | `label` | `cell-switch-trigger` (overrides OSS `switch-content`) | `switch__content cell-switch__trigger cell-switch__trigger--{default\|secondary}` | OSS `Switch.Content` / RAC `SwitchButton` |
| `CellSwitch.Label` | `span` | `cell-switch-label` | `cell-switch__label` | plain span |
| `CellSwitch.Control` | `span` | `cell-switch-control` (overrides OSS `switch-control`) | `switch__control cell-switch__control` (+ `cell-switch__control--secondary`) | OSS `Switch.Control` |
| thumb (default child) | `span` | `switch-thumb` | `switch__thumb` | OSS `Switch.Thumb` |

Notes
- The docs say the root "renders as a label via HeroUI Switch", but the rendered root is the RAC `SwitchField` `<div>`.
  The `<label>` is the Trigger. Our DOM matches the rendered DOM.
- `data-slot` is overridden on root, trigger and control. As a result, the OSS rules keyed on
  `[data-slot="switch-content"]` (the control focus ring and the `:has(...)` hover/press tints) do **not** apply.
  The focus ring is drawn on the trigger instead. The `.switch:hover` / `.switch[data-selected]:hover` rules still apply.
- State attributes come from RAC: root `data-selected`, `data-disabled`, `data-readonly`, `data-invalid`, `data-required`;
  trigger `data-selected`, `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled`, …
- Every demo passes `aria-label` on the root. It is forwarded to the input, for example `aria-label="Animations"`.
  In the feature demo it is only the title text. `title=""` on the input comes from the OSS Switch / RAC, not from Pro.
- **There is no shared `.cell` base class.** The Pro CSS bundle has separate blocks: `.cell-switch`, `.cell-select`,
  `.cell-slider`, `.cell-color-picker`. Each one repeats the same "field row" recipe on its own trigger or track
  (see §4.4). Cell Select, Cell Slider and Cell Color Picker should define their own blocks and reuse the recipe, not a shared class.

---

## 3. API (from docs)

### `CellSwitch` (root)
"The root component. Wraps HeroUI Switch with cell-style layout. Clicking anywhere in the cell toggles the switch."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'secondary'` | `'default'` | Visual style variant |

Also accepts all HeroUI Switch props except `variant`: `isSelected`, `defaultSelected`, `onChange`, `isDisabled`,
`isReadOnly`, `isRequired`, `isInvalid`, `name`, `value`, `size` (OSS, controls the track size), `aria-label`, `className`, `children` (node or render fn) …

### `CellSwitch.Trigger`
"The visible cell row … Renders HeroUI Switch.Content (a `<label>` element from React Aria's SwitchButton)."
| `children` | `ReactNode` | – | Label and control elements |
Also accepts all `Switch.Content` props.

### `CellSwitch.Label`
"Leading text label rendered as a span." `children: ReactNode`. Also accepts native span attributes.

### `CellSwitch.Control`
"Switch control. Renders the default HeroUI Switch.Thumb when no children are provided."
`children: ReactNode` (custom control content). Also accepts all `Switch.Control` props.

### CSS classes (docs)
Base: `.cell-switch`, `.cell-switch__trigger`, `.cell-switch__label`, `.cell-switch__control`.
Variant: `.cell-switch--secondary`, `.cell-switch__trigger--default`, `.cell-switch__trigger--secondary`,
`.cell-switch__control--secondary`. The docs list no CSS variables.

Variant to class mapping (observed): default gives `cell-switch__trigger--default` only. The root gets no modifier and the control
gets none either. Secondary gives `cell-switch--secondary` on the root, `cell-switch__trigger--secondary` and `cell-switch__control--secondary`.

---

## 4. Styling

All rules are in `@layer components`. Pro nests them under `.cell-switch` (specificity 0,2,0 or higher), so they beat the OSS
`.switch__content` / `.switch__control` rules in the same layer whatever the order. Tailwind utilities passed through `className`
(utilities layer) still override them, as in the feature demo (`h-auto bg-transparent py-2 shadow-none`).

### 4.1 Root `.cell-switch`
`gap: 0; outline: none; -webkit-tap-highlight-color: transparent`. Everything else comes from OSS `.switch`
(`flex flex-col items-start`, cursor interactive, `--switch-control-*` tokens, disabled → `status-disabled` on the root).

### 4.2 Trigger `.cell-switch .cell-switch__trigger`
- `display:flex; width:100%; height: 9×spacing (36px); align-items:center; gap: 3×spacing (12px); padding-inline: 3×spacing (12px)`,
  then a second rule pins `padding-inline-end: 0.75rem` (literal). With `--spacing: 0.3rem` Pro gives start 14.4px / end 12px; ours mirrors this.
- `border-radius: var(--field-radius, radius×1.5)` (12px), `border: var(--border-width-field) solid var(--color-field-border)` (0px in the default theme)
- `background: var(--field-background, var(--default))` (white in light, `--surface`-dark in dark); `color: var(--field-foreground)`; `box-shadow: var(--field-shadow)`
- `transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out)`, with motion-reduce off
- Text: inherits `.switch__content` (`text-sm`, `font-medium`, `select-none`)
- Hover (`@media (hover:hover)`, `[data-hovered="true"]` only, no `:hover`): `background: var(--field-hover)`, `border-color: var(--color-field-border-hover)`
- Focus (`[data-focus-visible="true"]`): `status-focused` ring (2px `--background` offset + 2px `--focus`), `border-color: var(--color-field-border-focus)`, `background: var(--color-field-focus)`
- Disabled: `.cell-switch[data-disabled="true"] .cell-switch__trigger` and `.cell-switch__trigger[data-disabled="true"]` get `status-disabled`.
  **The opacity compounds**: OSS also sets `.switch[data-disabled]` opacity .5, so the trigger renders at .5 × .5 = .25. Measured on the demo: root .5, trigger .5.
- Measured: 252×36 (inside a `w-[252px]` wrapper); label 176×20 at x=12; control 40×20 at x=200 (right padding 12).

### 4.3 Variants
- `.cell-switch__trigger--secondary`: `background: var(--color-default)`, `box-shadow: none`. Hover: `var(--color-default-hover)`. Focus-visible: back to `--color-default` (the ring still shows).
- `.cell-switch:not([data-selected="true"]) .cell-switch__control--secondary`: `bg-muted/20`. The same value applies on trigger hover, overriding the OSS
  hover tint (that is why it needs specificity 0,5,0, to beat `.switch:has(...) .switch__control`). On trigger `[data-pressed]` it becomes `bg-muted/30`.
  When selected, the OSS accent / accent-hover track applies.
- `.cell-switch--secondary`, `.cell-switch__trigger--default`: marker classes with no rules.

### 4.4 Label / control
- `.cell-switch__label`: `flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: start; text-sm; font-medium; color: var(--foreground)`
- `.cell-switch__control`: `flex-shrink: 0`. Track and thumb are the OSS md switch: 40×20 track, 22×16 thumb, thumb slides `inset-inline-start .3s var(--ease-out-fluid)`, track colour `.25s`.

### 4.5 Shared "Cell" row recipe (for Cell Select / Slider / Color Picker)
There is no shared CSS class. Each Cell\* block repeats this recipe on its trigger or track:
`flex h-9 w-full items-center gap-3 rounded-field border bg-field px-3 text-field-foreground shadow-field`,
`border-width: var(--border-width-field)`, `border-color: var(--color-field-border)`, a 150ms bg/border/shadow transition,
hover `bg-field-hover` + `--color-field-border-hover`, focus-visible `status-focused` + `--color-field-border-focus` + `--color-field-focus`,
`--secondary` → `bg-default shadow-none`, hover `bg-default-hover`, focus `bg-default`. Cell Select and Cell Color Picker also match
`:hover` / `:focus-visible:not([data-focused])` and disable via `:disabled` / `[aria-disabled]`. Cell Switch uses only the `data-*` forms.

### 4.6 Tokens (light / dark, measured)
| Token | Light | Dark | Used by |
|---|---|---|---|
| `--field-background` | white `lab(100 0 0)` | `lab(8.34 …)` (= dark surface) | default trigger bg |
| `--field-shadow` | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | `0 0 0 0 transparent inset` | default trigger shadow |
| `--field-hover` | `oklab(.983 … / .92)` | (theme) | default hover bg |
| `--default` / `--default-hover` | `lab(93.03 …)` / `oklab(.911 …)` | `lab(15.73 …)` / `oklab(.303 …)` | secondary bg / hover |
| `--muted` (20% / 30%) | `oklab(.552 … / .2)` | `oklab(.705 … / .2)` | secondary unselected track |
| `--accent` / `--accent-hover` | `lab(54.53 3.3 -66.5)` | same | selected track (OSS) |
| `--field-radius` | `calc(var(--radius) * 1.5)` = 12px | same | trigger radius |
| `--border-width-field` | 0px | 0px | trigger border |
| `--disabled-opacity` | .5 | .5 | disabled |
No new tokens are needed. Our theme defines all of them; the comparison only differs by colour-space serialisation (lab vs oklch).

---

## 5. Behaviour (measured; identical in our build)

- Clicking anywhere on the row (label text, padding, control) toggles. `onChange(isSelected)` fires. Root and trigger get `data-selected="true"`.
- Hover gives the trigger `data-hovered`: bg → field-hover (or default-hover). The control track also tints through the OSS `.switch:hover` rule
  (unselected default: `--default` at 80%; selected: `--accent-hover`). The secondary unselected track stays at muted/20.
- Press: `data-pressed` on the trigger. Only the secondary unselected track changes (muted/30). There is no scale effect.
- Keyboard: Tab focuses the hidden input (`tabindex=0`) and the trigger gets `data-focus-visible` and a focus ring. **Space** toggles. **Enter does nothing**
  (native checkbox). Tab moves to the next cell. A disabled cell's input is `disabled` with no `tabindex`, so it is skipped.
- Disabled: no pointer events, root and trigger each at .5 opacity. The OSS thumb rules apply: selected thumb opacity .4, unselected thumb bg `default-foreground/20`.
- Motion: thumb 300ms `--ease-out-fluid`, track colour 250ms, trigger bg/border/shadow 150ms. No keyframes. All of them are off under `motion-reduce`.

---

## 6. Demo variants (docs order)

| # | Docs section | Demo URL (`?theme=light\|dark`) | Structure | Our story |
|---|---|---|---|---|
| 1 | Usage | https://heroui.pro/docs/react/demos/cell-switch-settings-group | `flex w-[252px] flex-col gap-2`, 3 default cells (on / off / on) | `SettingsGroup` |
| 2 | Feature Announcement | …/cell-switch-feature-announcement | `w-[320px]`; root `className="relative h-auto rounded-xl border border-border"`; trigger `className="h-auto bg-transparent py-2 shadow-none"`; trigger children: `div.flex.min-w-0.flex-1.flex-col.gap-0.5` > [`span.flex.items-center.gap-1.text-sm.font-semibold` title + OSS `Chip color="accent" size="sm" variant="soft" className="h-4 px-0.5 text-[10px]"`] + `span.text-muted.text-xs.font-normal.text-wrap` description; then `CellSwitch.Control`. Unselected. 320×72. | `FeatureAnnouncement` |
| 3 | Secondary Group | …/cell-switch-secondary-group | `flex w-[252px] flex-col gap-2`, 2 secondary cells (on / off) | `SecondaryGroup` |
| 4 | Basic | …/cell-switch-default | `w-[252px]`, one default cell, selected | `Basic` |
| 5 | Variants | …/cell-switch-variants | `flex w-[252px] flex-col gap-3`; per variant `flex flex-col gap-1` + `span.text-muted.text-xs` caption ("default" / "secondary") + selected cell | `Variants` |
| 6 | Disabled | …/cell-switch-disabled | `flex w-[252px] flex-col gap-2`, 2 `isDisabled` cells (on / off) | `Disabled` |
| 7 | Controlled | …/cell-switch-controlled | `flex w-[252px] flex-col gap-2`; `isSelected`/`onChange` from `useState(true)`; below: `p.text-muted.px-1.text-sm` "Label: On/Off" | `Controlled` |

---

## 7. Dependencies

- OSS `@heroui/react`: `Switch` (Root / Content / Control / Thumb). The stories also use `Chip`.
- React Aria Components through the OSS Switch (`SwitchField`, `SwitchButton`).
- No third-party code, no other Pro component, no heavy peers, so it can be exported from the package root.

## 8. Deviations

None intended. Story texts and labels are our own. The DOM, classes, attributes, metrics, computed styles and interaction states match
the Pro demos in light and dark. The only differences are the lab/oklch serialisation of identical tokens and environment-only details
of the Storybook page: body colour and the react-scan overlay.

---

## Appendix A — CSSOM (Pro `cell-switch` rules, reference only; reduced-motion duplicates omitted)

```css
@layer components :: .cell-switch { outline-style: none; -webkit-tap-highlight-color: transparent; gap: 0px; }
@layer components :: .cell-switch .cell-switch__trigger { display:flex; width:100%; height: calc(var(--spacing) * 9); align-items:center; gap: calc(var(--spacing) * 3); padding-inline: calc(var(--spacing) * 3); border-radius: var(--field-radius,calc(var(--radius) * 1.5)); border-width:1px; background-color: var(--field-background,var(--default)); color: var(--field-foreground,var(--foreground)); box-shadow: …var(--field-shadow); transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); }
@layer components :: .cell-switch .cell-switch__trigger { border-width: var(--border-width-field); border-color: var(--color-field-border); padding-inline-end: .75rem; }
@layer components :: .cell-switch .cell-switch__trigger--secondary { box-shadow: none; background-color: var(--color-default); }
@layer components (+@supports color-mix) :: .cell-switch:not([data-selected="true"]) .cell-switch__control--secondary { background-color: color-mix(in oklab, var(--muted) 20%, transparent); }
@layer components :: .cell-switch .cell-switch__label { flex:1 1 0%; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:start; font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--foreground); }
@layer components :: .cell-switch .cell-switch__control { flex-shrink: 0; }
@media (hover: hover) :: .cell-switch .cell-switch__trigger[data-hovered="true"] { background-color: var(--field-hover); border-color: var(--color-field-border-hover); }
@media (hover: hover) :: .cell-switch .cell-switch__trigger--secondary[data-hovered="true"] { background-color: var(--color-default-hover); }
@media (hover: hover) :: .cell-switch:not([data-selected="true"]) .cell-switch__trigger[data-hovered="true"] .cell-switch__control--secondary { background-color: muted 20%; }
@layer components :: .cell-switch .cell-switch__trigger[data-focus-visible="true"] { [focus ring]; border-color: var(--color-field-border-focus); background-color: var(--color-field-focus); }
@layer components :: .cell-switch .cell-switch__trigger--secondary[data-focus-visible="true"] { background-color: var(--color-default); }
@layer components :: .cell-switch[data-disabled="true"] .cell-switch__trigger, .cell-switch .cell-switch__trigger[data-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }
@layer components :: .cell-switch:not([data-selected="true"]) .cell-switch__trigger[data-pressed="true"] .cell-switch__control--secondary { background-color: muted 30%; }
```
