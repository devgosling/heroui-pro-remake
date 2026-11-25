# Inline Select — clean-room implementation spec

Slug: `inline-select` · Docs: https://heroui.pro/docs/react/components/inline-select · Category: Forms
Storybook: `Pro/Forms/InlineSelect` · Import (Pro): `import {InlineSelect} from "@heroui-pro/react";`

Sources: the public docs text, plus the rendered DOM, CSSOM, computed styles and runtime behaviour of the
five public demo pages (light + dark). I did not open or try to get around the paywalled example source.

> A minimal inline dropdown that blends into surrounding text for contextual selections without a
> full form field.

## Demos (one Storybook story each)

| Demo | URL | What it shows | Story |
|---|---|---|---|
| Default (docs "Usage") | `/docs/react/demos/inline-select-default` | `aria-label="Language"`, 4 items, default `en`, popover `w-[140px]` | `Default` |
| Team Switcher | `/docs/react/demos/inline-select-team-switcher` | logo `size-6` + `/` (`text-border text-lg font-light`) + InlineSelect; the trigger (`gap-2`) holds a custom avatar square (`size-5 rounded`, literal `bg-*-600/700`, `text-[10px] font-bold text-white` initial), a `text-sm font-medium` name span (no `InlineSelect.Value`) and the Indicator; items repeat the avatar; popover `w-[200px]`; controlled selection | `TeamSwitcher` |
| Placements | `/docs/react/demos/inline-select-placements` | wrapper `flex items-center justify-center px-10`; the 12 RAC placements are the items and the selected one is passed to `InlineSelect.Popover placement`; default `bottom end (default)`; no popover width class | `Placements` |
| Multi Select | `/docs/react/demos/inline-select-multi-select` | `selectionMode="multiple"`, 1st + 3rd of 3 preselected; value "A and B" (RAC list format) truncated at 12rem → trigger exactly 220px wide; popover `w-48 max-w-48 min-w-48` (192×128, every label fits one 36px row) | `MultiSelect` |
| Custom Indicator | `/docs/react/demos/inline-select-custom-indicator` | `<InlineSelect.Indicator>` with a chevron-right SVG (no rotation while open); popover `w-[124px]` | `CustomIndicator` |

Story content (labels/data/logo) is our own; structure, classes and widths match the demos.

---

## 1. Anatomy

```tsx
<InlineSelect>                  // OSS Select (RAC Select) — all Select props
  <InlineSelect.Trigger>        // OSS Select.Trigger, ghost styled
    <InlineSelect.Value />      // OSS Select.Value, truncated
    <InlineSelect.Indicator />  // OSS Select.Indicator, default icon = ChevronsExpandVertical
  </InlineSelect.Trigger>
  <InlineSelect.Popover>        // OSS Select.Popover, placement "bottom end"
    <ListBox>                   // OSS ListBox from @heroui/react (not part of InlineSelect)
      <ListBox.Item>…<ListBox.ItemIndicator /></ListBox.Item>
    </ListBox>
  </InlineSelect.Popover>
</InlineSelect>
```

### Rendered DOM (default demo)

```
<template/>                                                     (RAC collection builder)
div.select.select--primary.inline-select[data-slot=inline-select][data-rac]
  button.select__trigger.inline-select__trigger[data-slot=inline-select-trigger]
         aria-label=<root aria-label> aria-labelledby="<value id> <trigger id>" aria-haspopup=listbox aria-expanded
         (+ data-pressed / data-hovered / data-focus-visible from RAC)
    span.select__value.inline-select__value[data-slot=inline-select-value]
      "English" + span.list-box-item__indicator (copied item content; hidden by OSS .select__value rule)
    svg.select__indicator.inline-select__indicator[data-slot=select-indicator][data-open=true while open]
        16×16 viewBox, gravity "chevrons-expand-vertical" path
  div[data-testid=hidden-select-container] > label > select   (RAC hidden select)
(portal)
div.select__popover.inline-select__popover[data-slot=select-popover][data-placement][data-trigger=Select] role=dialog
  div.list-box.list-box--default[data-slot=list-box] role=listbox (aria-multiselectable in multi mode)
    div.list-box-item.list-box-item--default[data-slot=list-box-item] role=option … span.list-box-item__indicator
```

Notes on `data-slot`:
- Root / Trigger / Value carry `inline-select`, `inline-select-trigger`, `inline-select-value`
  (the OSS parts spread props after their own `data-slot`).
- The Popover keeps `data-slot="select-popover"` and the Indicator `data-slot="select-indicator"`: the
  OSS parts stamp those after the props (the indicator through `cloneElement`). Ours behaves the same,
  since we pass through the same OSS parts.
- The default indicator goes through the same "custom child" path as a custom icon (hence
  `select-indicator`, not `select-default-indicator`).

## 2. API

| Part | Props | Notes |
|---|---|---|
| `InlineSelect` | `children` + all OSS `Select` props (generic `T`, `M = "single" \| "multiple"`) | root, class `inline-select` |
| `InlineSelect.Trigger` | all `Select.Trigger` props | class `inline-select__trigger` |
| `InlineSelect.Value` | all `Select.Value` props | class `inline-select__value` |
| `InlineSelect.Indicator` | `children?: ReactNode` (custom icon) + all `Select.Indicator` props | default icon ChevronsExpandVertical |
| `InlineSelect.Popover` | `placement` (default `"bottom end"`) + all `Select.Popover` props | class `inline-select__popover` |

Exports: `InlineSelect` compound (`Root`, `Trigger`, `Value`, `Indicator`, `Popover`), named parts,
`InlineSelectContext`, `inlineSelectVariants`, prop types and the `InlineSelect` type namespace.
No heavy peer → root-barrel safe.

## 3. Styling (BEM, all under `@layer components`)

CSS variables on `.inline-select`: `--inline-select-value-max-width: 12rem`, `--inline-select-indicator-size: .75rem`.

| Selector | Observed values → authored as |
|---|---|
| `.inline-select` | vars + `flex-shrink: 0` (+ OSS `.select` = `flex flex-col gap-1`) |
| `.inline-select .inline-select__trigger` | `min-h-0 items-center gap-2 rounded-[calc(var(--radius)*.75)]` (6px) `border-0 bg-transparent px-1 py-0.5 text-sm text-muted shadow-none outline-none no-highlight`, `cursor: var(--cursor-interactive)`, `padding-inline-end: .25rem` (beats the OSS `:has(.select__indicator)` `pe-7`), `transition-colors duration-100` (default ease `cubic-bezier(.4,0,.2,1)`), motion-reduce none |
| hover (`@media (hover:hover)`, `:hover` / `[data-hovered=true]`) | `color: var(--foreground)`, bg/border transparent |
| focus-visible (`:focus-visible:not([data-focused])`, `[data-focus-visible=true]`) | `status-focused` (2px `--background` offset + 4px `--focus` ring), bg/border transparent |
| disabled (`:disabled`, `[aria-disabled=true]`) | `status-disabled` (opacity `--disabled-opacity`, `--cursor-disabled`, no pointer events) |
| `.inline-select .inline-select__value` | `truncate`, `max-width: var(--inline-select-value-max-width)` (inherits OSS `flex-1 text-base sm:text-sm text-current`) |
| `.inline-select .inline-select__indicator` | `position: static; margin-block: 0; size: var(--inline-select-indicator-size); color: var(--muted)` (stays muted on hover) |
| `… __indicator[data-open=true]` | `rotate: 0deg` (cancels the OSS 180° flip) |
| `.inline-select .inline-select__popover` | `min-width: 12rem` |

Measured (light, 447px viewport so `.select__value` is `text-base`/24px): trigger 28px tall (2px
padding + 24px line), padding `2px 4px`, gap 8px, indicator 12×12, value max 192px. At ≥ 640px the
value is `text-sm` → trigger 24px. Dark mode only swaps tokens (`--muted`, `--foreground`, `--focus`,
`--background`); nothing component-specific.

Popover: plain OSS `select__popover` (bg `--overlay`, radius `min(32px, radius-2xl + 6px)` = 22px,
`--overlay-shadow`, enter `heroui-overlay-enter-95(-ny)` 150ms smooth, exit 100ms); RAC offset 8px; with
`bottom end` its inline-end edge aligns with the trigger's. Items are the OSS list-box items
(`px-2.5 pe-7`, 36px min height, radius 16px).

### Faithfully reproduced quirks
- **Hover background.** The OSS hover rule
  `.select__trigger[data-hovered=true]:not(:has(.select__clear-button:hover))` has specificity (0,4,0)
  and beats the Pro rule (0,3,0) for `background-color` / `border-color`, so a hovered trigger in Pro
  actually shows `var(--field-hover)` (verified with transitions disabled: light
  `oklab(.98 … / .92)`, dark `oklab(.23 … / .92)`); the border stays invisible (width 0). Our CSS keeps the
  same selector weights, so it renders identically.
- **Popover min-width.** The popover is portalled out of `.inline-select`, so the nested
  `min-width: 12rem` rule never matches in the demos; the effective minimum is the OSS
  `min-w-(--trigger-width)`. We keep the same nested selector (applies only to a non-portalled popover).

## 4. Behaviour

All behaviour is the OSS/RAC Select: click/Enter/Space/ArrowUp/ArrowDown open, typeahead, Escape
closes and returns focus, single selection closes the popover, multiple selection keeps it open and
the value is `Intl.ListFormat` joined ("A and B", "A, B, and C"). `data-open="true"` on the indicator
while open. Changing the popover `placement` while closed affects the next open (Placements demo);
RAC flips `top*` to `bottom` when there is no room.

## 5. Dependencies

`@heroui/react` (`Select`, plus `ListBox` in user code), `react-aria-components` through OSS,
`tailwind-variants`. Default icon: Gravity UI `chevrons-expand-vertical` path (MIT, attributed inline).
Stories: `@iconify/react` `gravity-ui:chevron-right` for the custom indicator.

## 6. Deviations

- Default indicator SVG gets `aria-hidden="true"` and drops Gravity's redundant `<clipPath id="a">`
  wrapper (which would duplicate the id `a` per instance); same pixels.
- The Placements story wrapper adds `min-h-[calc(100vh-2rem)]` so the trigger sits centred like on the Pro
  demo page (our Storybook root does not centre vertically); without it `top*` placements flip.

## Appendix — raw CSSOM (reference only, not the implementation)

```
.inline-select { --inline-select-value-max-width: 12rem; --inline-select-indicator-size: .75rem; flex-shrink: 0 }
.inline-select .inline-select__trigger { align-items:center; gap:calc(var(--spacing)*2); border-radius:calc(var(--radius)*.75); border-width:0; min-height:0; padding-inline:var(--spacing); padding-block:calc(var(--spacing)*.5); font-size:var(--text-sm); color:var(--muted); box-shadow:none; transition: colors .1s; -webkit-tap-highlight-color:transparent; background-color:transparent; outline-style:none; cursor:var(--cursor-interactive); padding-inline-end:.25rem }
@media (hover:hover) .inline-select .inline-select__trigger:hover, …[data-hovered=true] { color:var(--foreground); background-color:transparent; border-color:transparent }
.inline-select .inline-select__trigger:focus-visible:not([data-focused]), …[data-focus-visible=true] { focus ring; background-color:transparent; border-color:transparent; outline-style:none }
.inline-select .inline-select__trigger:disabled, …[aria-disabled=true] { opacity:var(--disabled-opacity); cursor:var(--cursor-disabled); pointer-events:none }
.inline-select .inline-select__value { text-overflow:ellipsis; white-space:nowrap; max-width:var(--inline-select-value-max-width); overflow:hidden }
.inline-select .inline-select__indicator { color:var(--muted); width/height:var(--inline-select-indicator-size); margin-block:0; position:static }
.inline-select .inline-select__indicator[data-open=true] { rotate:0deg }
.inline-select .inline-select__popover { min-width:calc(var(--spacing)*48) }
```
