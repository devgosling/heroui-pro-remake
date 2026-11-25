# KPI Group (`kpi-group`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/kpi-group, plus the rendered DOM, CSSOM,
computed styles and geometry of the three public demo pages (light + dark), observed on 2026-11-24. No paywalled
source was read.

## 1. Purpose

A layout container that puts several `KPI` cards on one shared surface (one background, one shadow, one rounded
outline), in a row or a column, optionally split by 1px separators. The cards drop their own radius, border and
shadow inside the group.

`KPIGroup` does not import `KPI`: it styles its children through `[data-slot="kpi"]`. It therefore has no recharts
dependency and can be exported from the package root (`import {KPIGroup} from "@heroui/pro"`), while `KPI` stays
subpath-only (`import {KPI} from "@heroui/pro/kpi"`). This matches the docs anatomy, which imports `KPIGroup` from
the root and `KPI` from the `kpi` subpath.

## 2. Anatomy

```tsx
<KPIGroup>                     {/* orientation="horizontal" (default) | "vertical" */}
  <KPI>{/* ... */}</KPI>
  <KPIGroup.Separator />       {/* optional */}
  <KPI>{/* ... */}</KPI>
</KPIGroup>
```

| Part | Element | `data-slot` | BEM class | Other attributes |
| --- | --- | --- | --- | --- |
| Root `KPIGroup` | `<div>` | `kpi-group` | `.kpi-group .kpi-group--horizontal` / `.kpi-group--vertical` + user className | `role="group"` |
| `KPIGroup.Separator` | `<span>` | `kpi-group-separator` | `.kpi-group__separator` + user className | `aria-hidden="true"` |

Observed markup (horizontal demo, trimmed):

```html
<div class="kpi-group kpi-group--horizontal" data-slot="kpi-group" role="group">
  <div class="card card--default kpi" data-slot="kpi">...</div>
  <span aria-hidden="true" class="kpi-group__separator" data-slot="kpi-group-separator"></span>
  <div class="card card--default kpi" data-slot="kpi">...</div>
  <span aria-hidden="true" class="kpi-group__separator" data-slot="kpi-group-separator"></span>
  <div class="card card--default kpi" data-slot="kpi">...</div>
</div>
```

Structural notes:

- No `data-orientation`, no `aria-orientation` (not a valid attribute for `role="group"` anyway), no other state
  attributes on either part. The orientation is expressed only by the BEM modifier.
- The user className is appended after the BEM classes (`kpi-group kpi-group--horizontal max-sm:flex-col`).
- The separator has no orientation of its own: the group modifier decides whether it is a vertical or horizontal line.
- Nothing is focusable; there is no keyboard behaviour, no hover/press state, no animation and no transition.

## 3. API (from docs)

### `KPIGroup`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction. |
| `children` | `ReactNode` | - | KPI cards and separators. |

Also supports all native `<div>` attributes (spread after `role`, so `role` / `aria-*` can be overridden).

### `KPIGroup.Separator`

A visual 1px divider between KPI cards. Supports all native `<span>` attributes.

Exports (remake): `KPIGroup` (compound: `.Root`, `.Separator`), `KPIGroupRoot`, `KPIGroupSeparator`,
`KPIGroupContext`, `useKPIGroupContext`, `kpiGroupVariants`; types `KPIGroupProps`, `KPIGroupRootProps`,
`KPIGroupSeparatorProps`, `KPIGroupOrientation`, `KPIGroupVariants`, and the `KPIGroup` type namespace.

## 4. Styling

All rules live in `@layer components` (raw dump in the appendix).

| Selector | Declarations | Tailwind source used in the remake |
| --- | --- | --- |
| `.kpi-group` | `background-color: var(--surface); box-shadow: var(--surface-shadow); overflow: hidden` | `overflow-hidden bg-surface shadow-surface` |
| `.kpi-group--horizontal` | `display:flex; flex-direction:row; border-radius: calc(var(--radius)*2)` (16px) | `flex flex-row rounded-2xl` |
| `.kpi-group--vertical` | `display:flex; flex-direction:column; border-radius: calc(var(--radius)*2)` | `flex flex-col rounded-2xl` |
| `.kpi-group--horizontal > [data-slot="kpi"]` | `flex: 1 1 0%; border-width:0; border-radius:0; box-shadow: none` | `flex-1 rounded-none border-0 shadow-none` |
| `.kpi-group--vertical > [data-slot="kpi"]` | `border-width:0; border-radius:0; box-shadow: none` | `rounded-none border-0 shadow-none` |
| `.kpi-group__separator` | `background-color: var(--separator); flex-shrink: 0` | `shrink-0 bg-separator` |
| `.kpi-group--horizontal > .kpi-group__separator` | `width: 1px; align-self: stretch; margin-block: 16px` | `my-4 w-px self-stretch` |
| `.kpi-group--vertical > .kpi-group__separator` | `height: 1px; align-self: stretch` (no inline margin: full width) | `h-px self-stretch` |

Notes:

- The base class carries only the surface; the layout (flex, direction, radius) lives on the orientation modifiers.
  The remake keeps that split so CSS written against Pro keeps working. There is no orientation-free layout.
- The child rules use specificity (0,2,0), which beats `.card` / `.card--default` / `.kpi` (0,1,0) in the same layer,
  independent of import order.
- The KPI cards keep their own `bg-surface` (same colour as the group) and their own padding (16px), gap (12px), etc.
- No CSS custom properties, no `@keyframes`, no transitions, no `@media` rules of its own (the responsive behaviour in
  the "With From Suffix" demo is demo-level utility classes).

### Measured layout (light, Inter, `--radius: .5rem`, `--spacing: .25rem`)

Horizontal (group 852px wide, 3 cards, 2 separators): cards 283.33 / 283.34 / 283.33 px wide (equal `flex: 1 1 0%`
shares of 852 - 2), 100px tall (16 padding + 20 title + 4 header margin + 12 gap + 32 value row + 16 padding);
separators 1x68 at y = 16 (16px block margins). Group radius 16px, `overflow:hidden` clips the cards.

Vertical (wrapper `w-[400px]` flex-centred): group shrinks to the widest card's content (208.5px in the demo); cards
100px tall; separators full width x 1px at y = 100 and 201 (no margins); total 302px.

With From Suffix, >= 640px (wrapper 900px): identical to horizontal (cards 299.33 px, separators 1x68 at y 16).
< 640px: `max-sm:flex-col` stacks the cards (399 x 100 each in a 399px group), separators become
`max-sm:mx-4 max-sm:my-0 max-sm:h-px max-sm:w-auto` = 367 x 1 px inset 16px on both sides.
Suffix text `text-muted text-sm` (14/20, weight 400) is baseline aligned next to the value with an 8px gap
(`flex flex-wrap items-baseline gap-x-2`); the trend chip stays in the KPI content's `auto` column.

### Light vs dark

| Aspect | Light | Dark |
| --- | --- | --- |
| Group / card bg (`--surface`) | `lab(100% 0 0)` | `lab(8.34% .61 -2.13)` |
| Group shadow (`--surface-shadow`) | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | transparent inset (none) |
| Separator (`--separator`) | `lab(90.69% .4 -1.45)` | `lab(12.95% .62 -2.17)` |
| Card radius / shadow inside group | 0 / none | 0 / none |

No selector differs between themes; all differences come from tokens.

## 5. Behaviour

None beyond layout. Not focusable, no events, no state attributes, no animations. `role="group"` groups the cards
for assistive technology; separators are hidden from it (`aria-hidden="true"`). Consumers can add `aria-label` to the
group.

## 6. Demo variants

| Demo | URL (append `?theme=light` / `?theme=dark`) | What it shows | Story |
| --- | --- | --- | --- |
| Horizontal (usage) | https://heroui.pro/docs/react/demos/kpi-group-horizontal | Wrapper `w-[900px] rounded-2xl p-6`; default orientation; 3 KPIs (Title, Value, Trend; plain number and two 2-decimal percentages, up/up/down) with 2 separators. | `Horizontal` |
| Vertical | https://heroui.pro/docs/react/demos/kpi-group-vertical | Wrapper `flex w-[400px] items-center justify-center rounded-2xl p-6`; `orientation="vertical"`; 3 KPIs with USD values (0 fraction digits), trends up/down/up, 2 separators. | `Vertical` |
| With From Suffix | https://heroui.pro/docs/react/demos/kpi-group-with-from-suffix | Wrapper `w-full max-w-[900px] min-w-fit`; group `className="max-sm:flex-col"`; separators `className="max-sm:mx-4 max-sm:my-0 max-sm:h-px max-sm:w-auto"`; each KPI.Content wraps Value + `<span class="text-muted text-sm">from ...</span>` in `div.flex.flex-wrap.items-baseline.gap-x-2`, Trend as the second grid column. | `WithFromSuffix` |

Demo frame: `[data-demo-page]` = `display:flex; align-items:center; justify-content:center; padding:24px;
min-height:100vh` (stories use `flex min-h-screen w-full items-center justify-center p-6` with layout
`fullscreen`).

Story ids: `pro-datadisplay-kpigroup--horizontal`, `pro-datadisplay-kpigroup--vertical`,
`pro-datadisplay-kpigroup--with-from-suffix`. Story content (titles, values) is our own.

## 7. Verification (remake vs Pro)

Measured with `getBoundingClientRect` relative to the group, Storybook vs demo page, same viewport:

- Horizontal: group 852 x 100; card x/width 0/283.33, 284.33/283.34, 568.67/283.33; separators at x 283.33 and
  567.67, 1 x 68 at y 16; header 16,16 h20; content 16,52 h32; computed radius 16px, overflow hidden, shadow identical.
- Vertical: cards 100 tall at y 0/101/202, separators full width at y 100/201, total 302; dark tokens match.
- With From Suffix: narrow (447px viewport) 399 x 302 column with 367px inset separators; wide (1100px probe iframe)
  900 x 100 row with cards 299.33 and 1 x 68 separators. Suffix at x 95.5, y 61 (baseline aligned), identical.

Independent review (2026-11-25): re-measured all three demos against the stories at 447px and in a 1100px same-origin
probe iframe (light + dark). Group/card/separator geometry, radius, overflow, shadow (light: 3-layer surface shadow;
dark: transparent inset) and resolved sRGB colours (surface 255/255/255 and 24/24/27, separator 228/228/231 and
33/33/36) are identical; the compiled CSSOM has the same 8 rules in `@layer components`. Root/separator attributes
match (`role="group"`, `aria-hidden="true"`, no state attributes). Theme check: `--radius: 1rem` gives a 32px group
radius, `--spacing: .5rem` gives 32px separator insets, `--surface` / `--separator` / `--font-sans` overrides apply.
Pro's public Storybook lists the same three stories (Horizontal, Vertical, With From Suffix), so no variant is missing.

## 8. Dependencies

- None at runtime besides React and `tailwind-variants`. Visual dependency on the KPI card (`[data-slot="kpi"]`,
  OSS `Card`) and the OSS theme tokens `--surface`, `--surface-shadow`, `--separator`, `--radius`, `--spacing`.
- Stories use `KPI` from `../kpi` (subpath, recharts) - stories are not part of the barrel.

## 9. Deviations / open questions

1. The remake exposes `KPIGroupContext` / `useKPIGroupContext` (orientation + slot classes) so custom children can
   adapt; Pro's public API does not document this. Purely additive.
2. `KPIGroup.Separator` outside a group falls back to the default (horizontal) slot classes; its line direction still
   depends on the parent modifier, so it renders as an unsized span outside a group (same as Pro's CSS).
3. Wrapping children other than `KPI` (e.g. `ItemCard`) is not styled by the group (only `[data-slot="kpi"]`), as in
   Pro.

## Appendix - raw CSSOM (rules matching `kpi-group`)

```
@layer components >> .kpi-group { background-color: var(--surface); --tw-shadow: var(--surface-shadow); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); overflow: hidden; }
@layer components >> .kpi-group--horizontal { border-radius: calc(var(--radius) * 2); flex-direction: row; display: flex; }
@layer components >> .kpi-group--horizontal > [data-slot="kpi"] { border-style: var(--tw-border-style); --tw-shadow: 0 0 #0000; box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); border-width: 0px; border-radius: 0px; flex: 1 1 0%; }
@layer components >> .kpi-group--vertical { border-radius: calc(var(--radius) * 2); flex-direction: column; display: flex; }
@layer components >> .kpi-group--vertical > [data-slot="kpi"] { border-style: var(--tw-border-style); --tw-shadow: 0 0 #0000; box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); border-width: 0px; border-radius: 0px; }
@layer components >> .kpi-group__separator { background-color: var(--separator); flex-shrink: 0; }
@layer components >> .kpi-group--horizontal > .kpi-group__separator { margin-block: calc(var(--spacing) * 4); align-self: stretch; width: 1px; }
@layer components >> .kpi-group--vertical > .kpi-group__separator { align-self: stretch; height: 1px; }
```

No `@keyframes`, `@media` or `@supports` rules reference `kpi-group`.
