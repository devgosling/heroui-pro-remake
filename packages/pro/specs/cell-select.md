# Cell Select — clean-room implementation spec

Slug: `cell-select` · Docs: https://heroui.pro/docs/react/components/cell-select · Category: Forms
Import (Pro): `import {CellSelect} from "@heroui-pro/react";` (root export; no heavy peers)
Storybook title (ours): `Pro/Forms/CellSelect`

Sources used: the public docs text, plus the rendered DOM, CSSOM, computed styles and runtime behaviour
(click, hover, Tab, Escape, option selection) of the 7 public demo pages in light and dark. I compared the
result with the OSS `Select` in this repo (`packages/react/src/components/select`, `packages/styles/components/select.css`)
and with Cell Switch (`specs/cell-switch.md`). I did not open or try to get around the paywalled example source.

> A compact select input styled as a settings cell, ideal for preference panels and configuration forms.

---

## 1. Anatomy

```tsx
import {CellSelect} from "@heroui-pro/react";
import {ListBox} from "@heroui/react";

<CellSelect>                    // OSS Select (RAC Select)
  <CellSelect.Trigger>          // OSS Select.Trigger (RAC Button) - the cell row
    <CellSelect.Label />        // <span>
    <CellSelect.Value />        // OSS Select.Value (RAC SelectValue)
    <CellSelect.Indicator />    // OSS Select.Indicator with a ChevronsExpandVertical child
  </CellSelect.Trigger>
  <CellSelect.Popover>          // OSS Select.Popover, placement "bottom end"
    <ListBox>                   // OSS ListBox (not part of CellSelect)
      <ListBox.Item>…<ListBox.ItemIndicator /></ListBox.Item>
    </ListBox>
  </CellSelect.Popover>
</CellSelect>
```

### Rendered DOM (Basic demo)

```html
<template></template>                                            <!-- RAC collection builder -->
<div data-slot="cell-select" class="select select--primary cell-select" data-rac>
  <button data-slot="cell-select-trigger" class="select__trigger cell-select__trigger cell-select__trigger--default"
          data-rac type="button" tabindex="0" data-react-aria-pressable="true"
          aria-label="<root aria-label>" aria-labelledby="<value id> <trigger id>" aria-haspopup="listbox" aria-expanded="false">
    <span class="cell-select__label" data-slot="cell-select-label">Theme</span>
    <span data-slot="cell-select-value" class="select__value cell-select__value" data-rac>
      Default<span class="list-box-item__indicator" data-slot="list-box-item-indicator">…</span>  <!-- copied item content, hidden by OSS -->
    </span>
    <svg width="16" height="16" viewBox="0 0 16 16" data-slot="select-indicator" class="select__indicator cell-select__indicator">…</svg>
  </button>
  <div data-testid="hidden-select-container" aria-hidden="true">…<select tabindex="-1">…</select></div>   <!-- RAC HiddenSelect -->
</div>
<!-- portal -->
<div data-slot="select-popover" class="select__popover cell-select__popover" data-rac role="dialog" data-trigger="Select"
     data-placement="bottom" style="--trigger-width: 252px; --trigger-anchor-point: 252px 0px; …">
  <div data-slot="list-box" class="list-box list-box--default" role="listbox">
    <div data-slot="list-box-item" class="list-box-item list-box-item--default" role="option" …>Default<span class="list-box-item__indicator">…</span></div>
  </div>
</div>
```

| Part | Element | `data-slot` | BEM classes | Built on |
|---|---|---|---|---|
| `CellSelect` (root) | `div` | `cell-select` (overrides OSS `select`) | `select select--primary cell-select` | OSS `Select` / RAC `Select` |
| `CellSelect.Trigger` | `button` | `cell-select-trigger` (overrides `select-trigger`) | `select__trigger cell-select__trigger cell-select__trigger--{default\|secondary}` | OSS `Select.Trigger` |
| `CellSelect.Label` | `span` | `cell-select-label` | `cell-select__label` | plain span |
| `CellSelect.Value` | `span` | `cell-select-value` (overrides `select-value`) | `select__value cell-select__value` | OSS `Select.Value` |
| `CellSelect.Indicator` | `svg` | `select-indicator` (stamped by OSS on the cloned child) | `select__indicator cell-select__indicator` | OSS `Select.Indicator` + Gravity `chevrons-expand-vertical` 16×16 |
| `CellSelect.Popover` | `div` (portal) | `select-popover` (OSS stamps it after the props, so it cannot be overridden) | `select__popover cell-select__popover` | OSS `Select.Popover` |

Notes
- The `variant` prop only changes the trigger modifier. The root always keeps `select--primary` (the OSS variant is not forwarded) and
  gets **no** `cell-select--secondary` class (unlike Cell Switch).
- State attributes are the RAC ones: root `data-focused`, `data-focus-visible`, `data-open`, `data-disabled`, `data-invalid`, `data-required`;
  trigger `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled` (+ native `disabled`), `aria-expanded`;
  indicator `data-open="true"` while open; popover `data-entering` / `data-exiting` / `data-placement`.
- Every demo passes `aria-label` on the root (forwarded to the trigger button).
- The Pro indicator SVG wraps its path in `<g clip-path="url(#a)">` with a `<defs><clipPath id="a">` (a 16×16 full-box clip from the icon
  package). It has no visual effect, and it repeats `id="a"` in every instance. We render the bare path.
- **There is no shared `.cell` base class** (see `cell-switch.md` §2/§4.5). `.cell-select` is its own block and repeats the Cell field-row recipe.

---

## 2. API (from docs)

### `CellSelect` (root)
"The root component. Wraps HeroUI Select with cell-style layout."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'secondary'` | `'default'` | Visual style variant |

Also supports all HeroUI Select props except `variant`: `value` / `defaultValue` / `onChange`, `selectionMode`, `isDisabled`, `isRequired`,
`isInvalid`, `disabledKeys`, `isOpen` / `defaultOpen` / `onOpenChange`, `name`, `placeholder`, `fullWidth`, `aria-label`, `className`, `children`, …

### `CellSelect.Trigger`
"The visible cell row containing label, value, and indicator." Also supports all HeroUI `Select.Trigger` props.

### `CellSelect.Label`
"Leading text label rendered as a span." `children: ReactNode` (label text). Also supports all native span HTML attributes.

### `CellSelect.Value`
"Display of the currently selected value." Also supports all HeroUI `Select.Value` props, including the render-prop children
(`({selectedText, selectedItem, isPlaceholder, defaultChildren}) => ReactNode`) used by the Font Family and Custom Value demos.

### `CellSelect.Indicator`
"Chevron icon. Defaults to a ChevronsExpandVertical icon when no children are provided."
`children: ReactNode` (custom indicator icon). Also supports all HeroUI `Select.Indicator` props.

### `CellSelect.Popover`
"Dropdown panel for selection options."
| `placement` | `Placement` | `'bottom end'` | Popover placement relative to the trigger |
Also supports all HeroUI `Select.Popover` props.

### CSS classes (docs)
Base: `.cell-select` (root wrapper), `.cell-select__trigger`, `.cell-select__label`, `.cell-select__value`, `.cell-select__indicator`, `.cell-select__popover`.
Variant: `.cell-select__trigger--default`, `.cell-select__trigger--secondary`.
CSS variables (not in the docs, found in the CSSOM): `--cell-select-indicator-size: .75rem` on `.cell-select`.

---

## 3. Styling

All rules are in `@layer components`, nested under `.cell-select` (specificity 0,2,0 and up). The Pro bundle comes after the OSS styles,
so equal-specificity rules win over the OSS `.select__*` rules by order. Our `css/index.css` imports `@heroui/pro/css` after `@heroui/styles`, so the same applies.

### 3.1 Root `.cell-select`
Only `--cell-select-indicator-size: .75rem`. Layout comes from OSS `.select`: `flex flex-col gap-1`. The trigger stretches to the root width.

### 3.2 Trigger `.cell-select .cell-select__trigger` (Cell field-row recipe)
- `display:flex` (overrides OSS `inline-flex`); `height: 9×spacing` (36px); `align-items:center`; `gap: 3×spacing` (12px); `padding-inline: 12px`.
  `padding-inline-end: .75rem` overrides the OSS `:has(.select__indicator) { pe-7 }`. The OSS `py-2`, `min-h-9`, `relative isolate` and `text-sm` stay.
  The trailing inset is a **literal** `.75rem`, so it does not scale with `--spacing`, while the leading `padding-inline-start` does
  (`calc(var(--spacing) * 3)`). Measured with `--spacing: .3rem`: Pro pads 14.4px at the start and 12px at the end. We match this.
- `border-radius: var(--field-radius)` (12px); `border: var(--border-width-field) solid var(--color-field-border)` (0px in the default theme)
- `background: var(--field-background)`; `color: var(--field-foreground)`; `box-shadow: var(--field-shadow)`; `outline:none`; tap highlight off; `cursor: var(--cursor-interactive)`
- `transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out)`, with motion-reduce off
- Hover (`@media (hover:hover)`, `:hover` and `[data-hovered="true"]`): `background: var(--field-hover)`, `border-color: var(--color-field-border-hover)`
- Focus (`:focus-visible:not([data-focused])` and `[data-focus-visible="true"]`): `status-focused` ring (2px `--background` offset + 2px `--focus`),
  `border-color: var(--color-field-border-focus)`, `background: var(--color-field-focus)`
- Disabled (`:disabled`, `[aria-disabled="true"]`; OSS also covers `[data-disabled]`): `status-disabled` → opacity .5, `cursor: var(--cursor-disabled)`, no pointer events.
  The root has no disabled opacity, so nothing compounds (measured: root 1, trigger .5).
- Measured (inside `w-[252px]`): trigger 252×36; label 96×20 at x+12; value 96×20 at x+120; indicator 12×12 at x+228 (12px right padding).
  Label and value **split the free space evenly**: the label is `flex:1 1 0%`, and the value keeps the OSS `flex:1 1 0%` with `flex-shrink:0`.

### 3.3 Secondary `.cell-select .cell-select__trigger--secondary`
`background: var(--color-default)`; `box-shadow: none`. Hover rule: `var(--color-default-hover)`. Focus-visible: back to `--color-default`.
**Cascade quirk (measured on Pro, reproduced):** the OSS hover rule `.select__trigger:hover:not(:has(.select__clear-button:hover))` has specificity
0,4,0. That beats the Pro secondary hover rule (0,3,0), so a hovered secondary cell actually shows `--field-hover`
(light: `oklab(.983 … / .92)`), not `--default-hover`. Our CSS uses the same selectors and specificities, so it behaves the same way.

### 3.4 Label / Value / Indicator / Popover
- `.cell-select__label`: `flex:1 1 0%; min-width:0; truncate; text-align:start; text-sm; font-medium; color: var(--foreground)`
- `.cell-select__value`: `margin-inline-start:auto; flex-shrink:0; truncate; text-align:end; text-sm; color: var(--muted)` (+ OSS `flex:1 1 0%`, list-box indicator hidden)
- `.cell-select__indicator`: `position:static; margin-block:0; size: var(--cell-select-indicator-size)` (12px); `flex-shrink:0; color: var(--muted)`;
  `[data-open="true"] { rotate: 0deg }` (no flip, since the chevrons point both ways). The OSS 150ms `transition` stays.
- `.cell-select .cell-select__popover { min-width: var(--trigger-width) }`: this is a dead rule, because the popover is portalled. The OSS `.select__popover` already sets
  the same minimum. Measured popover: 252 wide, right-aligned with the trigger (`--trigger-anchor-point: 252px 0`), 8px below it,
  radius 22px, `--overlay` bg + `--overlay-shadow`, list box padding 6px, items 240×36 (`px-2.5`, `pe-7`, radius 16px).

### 3.5 Tokens (light / dark, measured)
| Token | Light | Dark | Used by |
|---|---|---|---|
| `--field-background` | `lab(100 0 0)` | `lab(8.34 …)` | default trigger bg |
| `--field-shadow` | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | `0 0 0 0 transparent inset` | default trigger shadow |
| `--field-hover` | `color-mix(oklab, field 90%, foreground 2%)` (= `oklab(.983 … / .92)`) | (theme) | hover bg (both variants, see 3.3) |
| `--default` | `lab(93.03 …)` | `lab(15.73 …)` | secondary bg |
| `--muted` | `lab(47.87 …)` | `lab(65.65 …)` | value + indicator colour |
| `--foreground` | `lab(8.34 …)` | `lab(98.97 …)` | label |
| `--field-radius` | `calc(var(--radius) * 1.5)` = 12px | same | trigger radius |
| `--border-width-field` / `--disabled-opacity` | 0px / .5 | same | |
No new tokens are needed. Ours only differs in colour-space serialisation (oklch vs lab) of the same theme values.

---

## 4. Behaviour (RAC Select through the OSS Select; identical in our build)

- Press on the row opens the popover (on press start). The trigger gets `aria-expanded="true"` and `data-pressed`, the root `data-open`,
  and the indicator `data-open="true"` (no rotation). The popover enters with the OSS `heroui-overlay-enter-95(-ny)` 150ms `--ease-smooth`
  keyframes and exits in 100ms. The selected option gets focus.
- Selecting an option closes the popover, updates the value text and fires `onChange(key)`. Focus returns to the trigger.
- Hover: trigger `data-hovered` → field-hover bg (150ms). Focus: Tab focuses the trigger (`data-focus-visible` on trigger and root) → focus ring.
  Enter / Space / ArrowDown / ArrowUp open the list (RAC). Escape closes it. Type-ahead works.
- Disabled: native `disabled` on the button, no tabindex, `data-disabled` on root and trigger, hidden `<select disabled>`.
- Motion: trigger colours 150ms, indicator 150ms (OSS), popover keyframes (OSS). All of them are off under `motion-reduce` / `[data-reduce-motion]`.

---

## 5. Demo variants (docs order)

| # | Docs section | Demo URL (`?theme=light\|dark`) | Structure | Our story |
|---|---|---|---|---|
| 1 | Usage | https://heroui.pro/docs/react/demos/cell-select-settings-group | `flex w-[252px] flex-col gap-2`, 3 default cells (Label + Value + Indicator), 3 options each, `defaultValue` | `SettingsGroup` |
| 2 | Font Family | …/cell-select-font-family | `flex w-[252px] flex-col gap-2`; header `span.text-muted.text-sm`; cell 1 default, cell 2 `variant="secondary"`; **no Indicator**; Value render prop → `span.flex.items-center.justify-end.gap-1.5.text-end` [selectedText + `span.text-foreground.text-sm.font-medium` sample glyphs]; 4 options | `FontFamily` |
| 3 | Basic | …/cell-select-default | `w-[252px]`, one default cell, 3 options | `Basic` |
| 4 | Variants | …/cell-select-variants | `flex w-[252px] flex-col gap-3`; per variant `flex flex-col gap-1` + `span.text-muted.text-xs` caption ("default" / "secondary") + cell | `Variants` |
| 5 | Disabled | …/cell-select-disabled | `w-[252px]`, one `isDisabled` cell | `Disabled` |
| 6 | Controlled | …/cell-select-controlled | `flex w-[252px] flex-col gap-2`; `value`/`onChange` state; below: `p.text-muted.px-1.text-sm` "Selected: <label>" | `Controlled` |
| 7 | Custom Value | …/cell-select-custom-value | `w-[252px]`; no Indicator; Value render prop → `span.flex.items-center.justify-end.gap-1.5.text-end` [text + `span.text-muted` > 16px icon]; items: 16px icon + text + ItemIndicator (item `gap-3`) | `CustomValue` |

Story texts, data and icons are our own (gravity-ui icons through `@iconify/react`). Structure, classes and widths match the demos.

---

## 6. Dependencies

- OSS `@heroui/react`: `Select` (Root / Trigger / Value / Indicator / Popover), `ListBox` in the stories.
- React Aria Components through the OSS Select (`Select`, `Button`, `SelectValue`, `Popover`, `ListBox`).
- Third-party code: the Gravity UI `chevrons-expand-vertical` path (MIT, attribution comment in `cell-select.tsx`).
- No other Pro component, no heavy peers, so it can be exported from the package root.

## 7. Deviations

- The default indicator SVG has `aria-hidden="true"` and no `<g clip-path>` / `<defs>` wrapper (Pro repeats `id="a"` in every instance).
  This has no visual effect, and button children are presentational anyway.
- The hidden `<select>` shows the selected option as a property, not as the SSR `selected` attribute (client render vs SSR demo page).
- Everything else matches: DOM, classes, data attributes, metrics, computed styles (light and dark), hover, focus, disabled, popover
  position and size, and the secondary-hover cascade quirk.

### Review pass (independent re-measurement)
A headless probe ran on all 7 demos against the matching stories, in light and dark. Colours were normalised to sRGB, because Pro
serialises theme colours as `lab()` and our build uses `oklch()`. The probe covered static, hover (each trigger), keyboard
focus-visible, pressed/open, popover + list items, and after selection. No metric or colour differences were found beyond story
content (texts, icons). Other checks:
- CSSOM: the rule set is the same (selectors, specificity, declarations). One difference was fixed: the trailing padding had
  been `calc(var(--spacing) * 3)` instead of Pro's literal `.75rem`.
- Keyboard: Tab → focus-visible on trigger and root. ArrowDown / ArrowUp / Enter / Space open with the selected option focused,
  Escape closes and restores focus-visible, Enter on an option selects and closes, and type-ahead on the closed trigger changes the
  value. Outside click closes. This is the same sequence of states as Pro.
- Motion: popover `heroui-overlay-enter-95-ny` 150ms in and `heroui-overlay-exit` 100ms out (transform-origin = anchor point), indicator
  `rotate` transition 150ms `cubic-bezier(.4,0,.2,1)` (to 0deg, so nothing visibly turns). Same as Pro.
- Theme: `--radius: 1rem` → trigger 24px, popover 32px, items 32px. `--font-sans`, `--focus`/`--accent` and `--spacing` are
  followed exactly like on Pro.

---

## Appendix A — CSSOM (Pro `cell-select` rules, reference only; reduced-motion duplicates omitted)

```css
@layer components :: .cell-select { --cell-select-indicator-size: .75rem; }
@layer components :: .cell-select .cell-select__trigger { height: calc(var(--spacing) * 9); align-items:center; gap: calc(var(--spacing) * 3); border-radius: var(--field-radius,calc(var(--radius) * 1.5)); border-width:1px; background-color: var(--field-background,var(--default)); padding-inline: calc(var(--spacing) * 3); color: var(--field-foreground,var(--foreground)); box-shadow: …var(--field-shadow); outline-style:none; -webkit-tap-highlight-color: transparent; cursor: var(--cursor-interactive); transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); display:flex; }
@layer components :: .cell-select .cell-select__trigger { border-width: var(--border-width-field); border-color: var(--color-field-border); padding-inline-end: .75rem; }
@media (hover: hover) :: .cell-select .cell-select__trigger:hover, .cell-select .cell-select__trigger[data-hovered="true"] { background-color: var(--field-hover); border-color: var(--color-field-border-hover); }
@layer components :: .cell-select .cell-select__trigger:focus-visible:not([data-focused]), .cell-select .cell-select__trigger[data-focus-visible="true"] { [focus ring]; border-color: var(--color-field-border-focus); background-color: var(--color-field-focus); }
@layer components :: .cell-select .cell-select__trigger:disabled, .cell-select .cell-select__trigger[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events:none; }
@layer components :: .cell-select .cell-select__trigger--secondary { box-shadow: none; background-color: var(--color-default); }
@media (hover: hover) :: .cell-select .cell-select__trigger--secondary:hover, …[data-hovered="true"] { background-color: var(--color-default-hover); }
@layer components :: .cell-select .cell-select__trigger--secondary:focus-visible:not([data-focused]), …[data-focus-visible="true"] { background-color: var(--color-default); }
@layer components :: .cell-select .cell-select__label { text-overflow:ellipsis; white-space:nowrap; text-align:start; min-width:0; font-size: var(--text-sm); font-weight: var(--font-weight-medium); color: var(--foreground); flex:1 1 0%; overflow:hidden; }
@layer components :: .cell-select .cell-select__value { text-overflow:ellipsis; white-space:nowrap; text-align:end; font-size: var(--text-sm); color: var(--muted); flex-shrink:0; margin-inline-start:auto; overflow:hidden; }
@layer components :: .cell-select .cell-select__indicator { color: var(--muted); width/height: var(--cell-select-indicator-size); flex-shrink:0; margin-block:0; position:static; }
@layer components :: .cell-select .cell-select__indicator[data-open="true"] { rotate: 0deg; }
@layer components :: .cell-select .cell-select__popover { min-width: var(--trigger-width); }
```
