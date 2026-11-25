# Trend Chip (`trend-chip`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/trend-chip, rendered DOM, CSSOM and computed
styles of the public demo pages (light + dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

A small metric badge showing a change value (e.g. `+3.3%`) with a direction arrow, trend-aware colour, and optional
prefix/suffix text. It is a thin layer over the OSS HeroUI `Chip`.

## 2. Anatomy

```tsx
import {TrendChip} from "@heroui/pro";

<TrendChip trend="up">
  <TrendChip.Indicator /> {/* optional: custom icon */}
  <TrendChip.Prefix />    {/* optional */}
  +3.3%
  <TrendChip.Suffix />    {/* optional */}
</TrendChip>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| Root | `<span>` | `chip` (Chip forces it, see note) | `.chip .chip--{color} .chip--{size} .chip--{variant}` + `.trend-chip .trend-chip--{size}` + user `className` | OSS `Chip` (`@heroui/react`) |
| Indicator | `<svg>` | `trend-chip-indicator` | `.trend-chip__indicator` | plain SVG (default arrow) or the consumer's SVG element with class/slot merged in |
| Label | `<span>` | `chip-label` | `.chip__label` | OSS `Chip.Label` |
| Prefix | `<span>` | `trend-chip-prefix` | `.trend-chip__prefix` | plain DOM |
| Value | `<span>` | `trend-chip-value` | `.trend-chip__value` | plain DOM, always rendered |
| Suffix | `<span>` | `trend-chip-suffix` | `.trend-chip__suffix` | plain DOM |

Root data attribute: `data-trend="up" | "down" | "neutral"`.

Observed DOM (attribute order as rendered):

```html
<span data-slot="chip" data-trend="up"
      class="chip chip--success chip--sm chip--soft trend-chip trend-chip--sm">
  <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
       viewBox="0 0 24 24" class="trend-chip__indicator" data-slot="trend-chip-indicator">
    <path d="M12 19V5m-5 5 5-5 5 5"></path>
  </svg>
  <span class="chip__label" data-slot="chip-label"> <span class="trend-chip__value" data-slot="trend-chip-value">+3.3%</span> </span>
</span>

<!-- prefix + suffix -->
<span class="chip__label" data-slot="chip-label"><span class="trend-chip__prefix" data-slot="trend-chip-prefix">+</span> <span class="trend-chip__value" data-slot="trend-chip-value">3.3%</span> <span class="trend-chip__suffix" data-slot="trend-chip-suffix">MoM</span></span>
```

Composition rules derived from the DOM:

- The Indicator is always the first child of the root, outside `.chip__label`, regardless of where it sits in JSX.
- Label content is exactly: `{prefix}{" "}<span value>{remaining children}</span>{" "}{suffix}`. The two literal space
  text nodes are always emitted (so with no prefix the label starts with a space, with no suffix it ends with one).
  Visually they produce single spaces between prefix/value/suffix; leading/trailing spaces collapse.
- Children that are not `Indicator`/`Prefix`/`Suffix` (the value text) go inside `.trend-chip__value`.
- Trend -> Chip `color`: `up` -> `success`, `down` -> `danger`, `neutral` -> `default` (observed; docs text says
  warning, see section 9).
- Default indicator: `up` -> arrow-up, `down` -> arrow-down, `neutral` -> **no indicator rendered**.
- A custom `TrendChip.Indicator` is rendered for every trend, including `neutral`. It renders no wrapper: the child
  `<svg>` receives `class="trend-chip__indicator"` and `data-slot="trend-chip-indicator"` (cloneElement/Slot merge;
  the child's own attributes such as `width="16" height="16" viewBox="0 0 16 16"` are kept).
- Chip renders `data-slot="chip"` after spreading props, so the root slot stays `chip` (also inside KPI).
- No `aria-hidden` on the indicator, no role or label on the root (see section 9).

Default icons (lucide-style, 24px viewBox, stroke 2, round caps/joins, `fill="none"`, `stroke="currentColor"`):

| Trend | `<path d>` |
| --- | --- |
| up | `M12 19V5m-5 5 5-5 5 5` |
| down | `M12 5v14m5-5-5 5-5-5` |

## 3. API

### `TrendChip` (root)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `trend` | `'up' \| 'down' \| 'neutral'` | `'up'` | Direction; controls arrow and colour. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Passed to Chip `size` and adds `.trend-chip--{size}`. |
| `variant` | `'primary' \| 'secondary' \| 'soft' \| 'tertiary'` | `'soft'` | Passed to Chip `variant`. |
| `children` | `ReactNode` | - | Value text plus optional `Indicator`, `Prefix`, `Suffix`. |

Also supports all HeroUI `Chip` props except `children`, `color` and `size`.

### `TrendChip.Indicator`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Custom SVG icon element. |

Also supports all native `<svg>` attributes (merged onto the icon).

### `TrendChip.Prefix` / `TrendChip.Suffix`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Text before / after the value. |

Also supports all native `<span>` attributes.

## 4. Styling

Pro rules (all in `@layer components`); there is no rule for `.trend-chip` itself:

| Selector | Declarations |
| --- | --- |
| `.trend-chip__indicator` | `flex-shrink: 0` |
| `.trend-chip__value` | `font-variant-numeric: tabular-nums` |
| `.trend-chip__suffix` | `color: var(--muted)` |
| `.trend-chip--sm .trend-chip__indicator` | `width/height: calc(var(--spacing) * 3)` (12px) |
| `.trend-chip--md .trend-chip__indicator` | `width/height: calc(var(--spacing) * 3.5)` (14px) |
| `.trend-chip--lg .trend-chip__indicator` | `width/height: calc(var(--spacing) * 4)` (16px) |

`.trend-chip__prefix` has no rule (inherits chip colour). Suggested source:

```css
.trend-chip__indicator { @apply shrink-0; }
.trend-chip__value     { @apply tabular-nums; }
.trend-chip__suffix    { @apply text-muted; }
.trend-chip--sm .trend-chip__indicator { @apply size-3; }
.trend-chip--md .trend-chip__indicator { @apply size-3.5; }
.trend-chip--lg .trend-chip__indicator { @apply size-4; }
```

Everything else comes from the OSS chip CSS (`packages/styles/components/chip.css`, identical on heroui.pro): root is
`inline-flex`, `items-center`, `gap-0.5` (2px), `rounded-2xl` (16px), `text-xs`, `font-medium`,
`background-color: var(--chip-bg)`, `color: var(--chip-fg)`; `.chip__label` has `padding-inline: 2px`.

Measured sizes (Inter, light and dark identical):

| Size | Height | Padding | Font | Indicator |
| --- | --- | --- | --- | --- |
| sm (default) | 20px | `0 4px` | 12px / 20px, 500 | 12x12 |
| md | 24px | `2px 8px` | 12px / 20px, 500 | 14x14 |
| lg | 28px | `4px 12px` | 14px / 20px, 500 | 16x16 |

Colour resolution (Chip tokens; `fg` also colours the indicator via `currentColor`):

| Variant \ trend | up (`chip--success`) | down (`chip--danger`) | neutral (`chip--default`) |
| --- | --- | --- | --- |
| soft (default) | bg `--success-soft`, fg `--success-soft-foreground` | bg `--danger-soft`, fg `--danger-soft-foreground` | bg `--default-soft`, fg `--default-soft-foreground` |
| primary | bg `--success`, fg `--success-foreground` | bg `--danger`, fg `--danger-foreground` | bg `--default`, fg `--default-foreground` (no primary+default compound) |
| secondary | bg `--default`, fg `--success-soft-foreground` | bg `--default`, fg `--danger-soft-foreground` | bg `--default`, fg `--default-foreground` |
| tertiary | bg transparent, fg `--success-soft-foreground` | bg transparent, fg `--danger-soft-foreground` | bg transparent, fg `--default-foreground` |

Measured (light): soft-up bg `oklab(0.733 -0.169 0.094 / 0.15)`, fg `oklab(0.509 -0.096 0.052)`; soft-down bg
`oklab(0.653 0.210 0.101 / 0.15)`, fg `oklab(0.492 0.134 0.062)`; soft-neutral bg `oklab(0.940 0 0 / 0.5)`, fg
`lab(8.34 0.61 -2.13)`; primary-up bg `lab(71.44 -59.41 38.03)` with dark text `lab(8.34 ...)`; primary-down bg
`lab(57.42 73.56 48.01)` with white text. Dark: soft-up bg `oklab(0.733 -0.169 0.094 / 0.12)`, fg
`oklab(0.803 -0.123 0.069)`.

No CSS custom properties of its own, no keyframes, no transitions.

## 5. Behaviour

- Static, non-interactive, not focusable, SSR-safe (SSR markup equals hydrated markup).
- `data-trend` reflects the `trend` prop; there are no other state attributes.
- No ARIA: the arrow conveys direction only visually; value text is read as-is. Recommended improvement (optional):
  `aria-hidden="true"` on the default indicator.

## 6. Demo variants

| Demo | URL (append `?theme=light` / `?theme=dark`) | What it shows |
| --- | --- | --- |
| Default | https://heroui.pro/docs/react/demos/trend-chip-default | Row (`flex items-center gap-3 rounded-2xl p-6`): up `+3.3%`, down `-2.1%`, neutral `0.0%` (neutral has no arrow). |
| Variants | https://heroui.pro/docs/react/demos/trend-chip-variants | Column of rows (`flex flex-col gap-3`), each row a label (`text-muted w-20 text-xs`: primary / secondary / tertiary / soft) followed by the same up/down/neutral trio. |
| Sizes | https://heroui.pro/docs/react/demos/trend-chip-sizes | `+3.3%` up in `sm`, `md`, `lg`. |
| Prefix And Suffix | https://heroui.pro/docs/react/demos/trend-chip-prefix-and-suffix | Column (`items-start gap-3`): up with Prefix `+$` and value `1,234`; down `-5.9%` with Suffix `vs last month`; up with Prefix `+`, value `3.3%`, Suffix `MoM`. |
| Tabular Nums | https://heroui.pro/docs/react/demos/trend-chip-tabular-nums | Column (`items-start gap-2`): `+1.1%`, `+22.2%` (up), `-333.3%` (down), `0.0%` (neutral) - shows equal-width digits. |
| Custom Indicator | https://heroui.pro/docs/react/demos/trend-chip-custom-indicator | Row: up `+3.3%` with gravity-ui ArrowUp (16px viewBox, filled), down `-2.1%` with ArrowDown, up `+12.5%` with a flame icon, neutral `0.0%` with a lightning-bolt icon (custom indicator renders even for neutral). |

Gravity-ui paths seen in Custom Indicator (for picking equivalent icons): ArrowUp starts `M8 14.75a.75.75 0 0 1-.75-.75V3.81L4.53 6.53...`,
ArrowDown starts `M8 1.25a.75.75 0 0 1 .75.75v10.19l2.72-2.72...`, flame starts `m6.452 6.864 1.13-2.173a32 32 0 0 1 1.872-3.095...`,
bolt starts `m7.836 6 .76-2.027L9.336 2H5.5...`.

## 7. Theme / token dependencies, light vs dark

Tokens: `--success`, `--success-foreground`, `--success-soft`, `--success-soft-foreground`, `--danger*` (same four),
`--default`, `--default-foreground`, `--default-soft`, `--default-soft-foreground`, `--muted` (suffix), `--spacing`,
`--text-xs`, `--text-sm`, `--font-weight-medium`, `--radius` (via chip).

Light/dark differences are purely token values (no selector differences):

| Token | Light | Dark |
| --- | --- | --- |
| `--success-soft` | `color-mix(in oklab, var(--success) 15%, transparent)` | 12% |
| `--success-soft-foreground` | success 80% + foreground-dark 60% | success 80% + white 30% (lighter) |
| `--danger` | `lab(57.42% 73.56 48.01)` | `lab(50.91% 62.27 37.59)` |
| `--danger-soft-foreground` | danger 70% + dark 40% | danger 80% + white 30% |
| `--default` | `lab(93.03% ...)` (light grey) | `lab(15.73% ...)` (dark grey) |
| `--default-foreground` | near black | near white |
| `--muted` | `lab(47.87% ...)` | `lab(65.65% ...)` |

## 8. Dependencies

- OSS HeroUI: `Chip` (root + `Chip.Label`), chip CSS / `chipVariants`.
- Pro: none. Consumed by `KPI.Trend` (see `kpi.md`).
- Third party: none (default arrows are inline SVG; do not add an icon dependency).
- Export from the package root (`@heroui/pro`).

## 9. Open questions / uncertainties

1. Docs say trend controls colour "(success/danger/warning)", but every demo renders `neutral` as `chip--default`.
   Recommendation: follow the DOM (`default`).
2. Whether the Indicator merge is `cloneElement` or a Slot; observable result is identical (class + data-slot on the
   child svg). If a non-element child is passed, behaviour is unknown - suggest wrapping it in a `<span>` with the same
   class/slot as a fallback.
3. Whether `className` on `TrendChip.Indicator` is merged with `trend-chip__indicator` (assumed yes).
4. The literal space text nodes are an implementation artefact; keep them for visual parity (they create the spaces
   between prefix, value and suffix).
5. No accessible name/role; replicate as-is unless the team wants the optional `aria-hidden` improvement.

## Appendix A - raw CSSOM dump

Rules whose selector contains `trend-chip` (format: `context >> rule`):

```
@layer components >> .trend-chip__indicator { flex-shrink: 0; }
@layer components >> .trend-chip__value { font-variant-numeric: tabular-nums; }
@layer components >> .trend-chip__suffix { color: var(--muted); }
@layer components >> .trend-chip--sm .trend-chip__indicator { width: calc(var(--spacing) * 3); height: calc(var(--spacing) * 3); }
@layer components >> .trend-chip--md .trend-chip__indicator { width: calc(var(--spacing) * 3.5); height: calc(var(--spacing) * 3.5); }
@layer components >> .trend-chip--lg .trend-chip__indicator { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); }
```

OSS chip rules as served on heroui.pro (match `packages/styles/components/chip.css` in the fork):

```
@layer components >> .chip { align-items: center; gap: calc(var(--spacing) * .5); border-radius: calc(var(--radius) * 2); width: fit-content; padding-inline: calc(var(--spacing) * 2); padding-block: calc(var(--spacing) * .5); font-size: var(--text-xs); --tw-leading: calc(var(--spacing) * 5); line-height: calc(var(--spacing) * 5); --tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); --chip-bg: var(--default); --chip-fg: currentColor; background-color: var(--chip-bg); color: var(--chip-fg); flex-shrink: 0; display: inline-flex; }
@layer components >> .chip__label { padding-inline: calc(var(--spacing) * .5); }
@layer components >> .chip--accent { --chip-fg: var(--accent-soft-foreground); }
@layer components >> .chip--danger { --chip-fg: var(--danger-soft-foreground); }
@layer components >> .chip--default { --chip-fg: var(--default-foreground); }
@layer components >> .chip--success { --chip-fg: var(--success-soft-foreground); }
@layer components >> .chip--warning { --chip-fg: var(--warning-soft-foreground); }
@layer components >> .chip--tertiary { --chip-bg: transparent; }
@layer components >> .chip--sm { padding-inline: var(--spacing); font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); padding-block: 0px; }
@layer components >> .chip--lg { padding-inline: calc(var(--spacing) * 3); padding-block: var(--spacing); font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); --tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); }
@layer components >> .chip--primary.chip--accent { --chip-bg: var(--accent); --chip-fg: var(--accent-foreground); }
@layer components >> .chip--primary.chip--success { --chip-bg: var(--success); --chip-fg: var(--success-foreground); }
@layer components >> .chip--primary.chip--warning { --chip-bg: var(--warning); --chip-fg: var(--warning-foreground); }
@layer components >> .chip--primary.chip--danger { --chip-bg: var(--danger); --chip-fg: var(--danger-foreground); }
@layer components >> .chip--accent.chip--soft { --chip-bg: var(--accent-soft); --chip-fg: var(--accent-soft-foreground); }
@layer components >> .chip--success.chip--soft { --chip-bg: var(--success-soft); --chip-fg: var(--success-soft-foreground); }
@layer components >> .chip--warning.chip--soft { --chip-bg: var(--warning-soft); --chip-fg: var(--warning-soft-foreground); }
@layer components >> .chip--danger.chip--soft { --chip-bg: var(--danger-soft); --chip-fg: var(--danger-soft-foreground); }
@layer components >> .chip--default.chip--soft { --chip-bg: var(--default-soft); --chip-fg: var(--default-soft-foreground); }
```

No `@keyframes` reference `trend-chip`.
