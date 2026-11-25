# Number Value (`number-value`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/number-value, rendered DOM and CSSOM
of the public demo pages (light + dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

Inline, locale-aware number display. Formats a `number` with `Intl.NumberFormat` (React Aria / `@internationalized/number`
`NumberFormatter`) for decimal, currency, percent, unit and compact output, with optional prefix/suffix slots.

## 2. Anatomy

```tsx
import {NumberValue} from "@heroui/pro";

<NumberValue value={1234}>
  <NumberValue.Prefix /> {/* optional */}
  <NumberValue.Suffix /> {/* optional */}
</NumberValue>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| Root | `<span>` | `number-value` | `.number-value` (+ user `className`) | plain DOM |
| Prefix | `<span>` | `number-value-prefix` (inferred, see section 9) | `.number-value__prefix` | plain DOM |
| Value | `<span>` | `number-value-value` | `.number-value__value` | plain DOM, always rendered |
| Suffix | `<span>` | `number-value-suffix` | `.number-value__suffix` | plain DOM |

Observed DOM (SSR output and hydrated DOM are identical):

```html
<span class="number-value text-foreground text-2xl font-semibold" data-slot="number-value">
  <span class="number-value__value" data-slot="number-value-value">$228,441.00</span>
</span>

<!-- with Suffix -->
<span class="number-value text-foreground text-2xl font-semibold" data-slot="number-value">
  <span class="number-value__value" data-slot="number-value-value">228,441</span>
  <span class="number-value__suffix" data-slot="number-value-suffix">
    <span class="text-muted ml-1 text-sm font-normal">revenue</span>   <!-- user content -->
  </span>
</span>
```

- Attribute order on the root: `class`, then `data-slot` (user className is appended after `number-value`).
- Order of children is always: Prefix, Value, Suffix, regardless of where `Prefix`/`Suffix` appear in JSX. There are
  NO whitespace text nodes between the parts (spacing is the consumer's job, e.g. `ml-1` in the demo).
- The formatted string is a single text node inside `.number-value__value`.
- No ARIA attributes, no role, not focusable.

## 3. API

### `NumberValue` (root)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | - | Required. Number to format. |
| `style` | `'decimal' \| 'currency' \| 'percent' \| 'unit'` | `'decimal'` | Intl format style (NOT the HTML style attribute). |
| `currency` | `string` | - | ISO currency code, required when `style="currency"`. |
| `unit` | `string` | - | Intl unit (e.g. `"degree"`, `"minute"`), required when `style="unit"`. |
| `notation` | `'standard' \| 'compact' \| 'scientific' \| 'engineering'` | `'standard'` | Intl notation. |
| `signDisplay` | `'auto' \| 'always' \| 'exceptZero' \| 'never'` | - | Intl sign display. |
| `minimumFractionDigits` | `number` | - | Intl option. |
| `maximumFractionDigits` | `number` | - | Intl option. |
| `locale` | `string` | - | Overrides the locale from the nearest React Aria `I18nProvider`. |
| `formatOptions` | `NumberFormatOptions` (from `@internationalized/number`) | - | Passed straight to `NumberFormatter`; overrides the individual convenience props. |
| `children` | `ReactNode \| ((formatted: string) => ReactNode)` | - | `Prefix` / `Suffix` sub-components, or a render function that receives the formatted string. |

Also accepts all native `<span>` attributes except `children` and `style`.

### `NumberValue.Prefix` / `NumberValue.Suffix`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Text/content before (Prefix) or after (Suffix) the number. |

Also accepts all native `<span>` attributes.

### Formatting resolution (implementation guidance)

```ts
const options: NumberFormatOptions = {
  style, currency, unit, notation, signDisplay,
  minimumFractionDigits, maximumFractionDigits,   // drop undefined keys
  ...formatOptions,                                // formatOptions wins
};
const {locale: ctxLocale} = useLocale();          // react-aria
const formatter = useMemo(() => new NumberFormatter(locale ?? ctxLocale, options), [...]);
const formatted = formatter.format(value);
```

`useNumberFormatter(options)` from `react-aria` covers the no-`locale` case; the explicit `locale` override needs
`NumberFormatter` from `@internationalized/number` (already a transitive dep of react-aria).

Observed outputs (locale `en-US`, `<html lang="en">`):

| Input | Options | Output |
| --- | --- | --- |
| 228441 | currency USD | `$228,441.00` |
| 228441 | currency EUR | `€228,441.00` |
| 228441 | currency JPY | `¥228,441` |
| 228441 | currency GBP | `£228,441.00` |
| 0.033 / 0.985 / -0.02 | percent (+ max 1 fraction digit, see section 9) | `3.3%` / `98.5%` / `-2%` |
| 1234 / 45678 / 1234567 / 9876543210 | `notation="compact"` | `1.2K` / `46K` / `1.2M` / `9.9B` |
| 42 / 0 / -42 | `signDisplay="auto"` | `42` / `0` / `-42` |
| 42 / 0 / -42 | `signDisplay="always"` | `+42` / `+0` / `-42` |
| 42 / 0 / -42 | `signDisplay="exceptZero"` | `+42` / `0` / `-42` |
| 42 / 0 / -42 | `signDisplay="never"` | `42` / `0` / `42` |
| ~1,234,567 | `formatOptions={{style:"currency",currency:"USD",notation:"compact"}}` | `$1.2M` |
| -1234.56 | `formatOptions={{style:"currency",currency:"USD",currencySign:"accounting"}}` | `($1,234.56)` |

## 4. Styling

Only one rule exists in the Pro stylesheet (inside `@layer components`):

```css
.number-value {
  font-variant-numeric: tabular-nums;   /* tailwind: tabular-nums */
}
```

- No rules for `.number-value__prefix`, `.number-value__value`, `.number-value__suffix`.
- No `display` rule: the root is an inline `<span>` (docs text calls it an "inline-flex wrapper"; the CSSOM does not
  confirm this, see section 9). In every demo the root sits in a flex parent, so it is blockified there.
- Typography/colour come from the consumer (`text-foreground text-2xl font-semibold` in demos): computed 24px/32px,
  weight 600, Inter.
- No CSS custom properties, no keyframes, no transitions.

Suggested source CSS (Tailwind v4 / BEM, matching the OSS style files):

```css
.number-value {
  @apply tabular-nums;
}
```

## 5. Behaviour

- Pure presentational, server-renderable (SSR markup identical to hydrated markup).
- No animation of any kind (no number-flow/rolling digits; no keyframes reference it; no transitions).
- Re-formats on `value`/option/locale change.
- No interactive states, no `data-*` state attributes, no ARIA.

## 6. Demo variants

All demos use the wrapper `<div class="flex flex-col gap-3 rounded-2xl p-6">`. Labelled rows are
`<div class="flex items-baseline gap-4">` with a label `<span class="text-muted w-{12|20|24|32} text-xs">`.
NumberValue instances carry `className="text-foreground text-2xl font-semibold"` unless noted.

| Demo | URL (append `?theme=light` / `?theme=dark`) | What it shows |
| --- | --- | --- |
| Default | https://heroui.pro/docs/react/demos/number-value-default | Same content as Currency (4 labelled rows). |
| Currency | https://heroui.pro/docs/react/demos/number-value-currency | Value 228441 with `style="currency"` and currency USD / EUR / JPY / GBP; label column shows the code (`w-12`). |
| Percent | https://heroui.pro/docs/react/demos/number-value-percent | Three stacked values (no labels): 0.033, 0.985, -0.02 as percent -> `3.3%`, `98.5%`, `-2%`. |
| Compact | https://heroui.pro/docs/react/demos/number-value-compact | Label column (`w-20`) shows the raw number (`1,234`, `45,678`, `1,234,567`, `9,876,543,210`), value uses `notation="compact"`. |
| Sign Display | https://heroui.pro/docs/react/demos/number-value-sign-display | One row per mode (`auto`, `always`, `exceptZero`, `never`; label `w-24`), each row is `<div class="flex gap-4">` with 42, 0, -42. These instances use `text-foreground font-semibold` (no size class). |
| Format Options | https://heroui.pro/docs/react/demos/number-value-format-options | "Compact currency" -> `$1.2M`; "Accounting" -> `($1,234.56)` (label `w-32`). |
| With Prefix Suffix | https://heroui.pro/docs/react/demos/number-value-with-prefix-suffix | `gap-4` column: `228,441` + Suffix "revenue"; `1.2M` (compact) + Suffix "users"; `$99.99` (currency) + Suffix "/month". Suffix child is `<span class="text-muted ml-1 text-sm font-normal">`. No Prefix is shown in any demo. |
| Tabular Nums | https://heroui.pro/docs/react/demos/number-value-tabular-nums | Right-aligned column (`flex flex-col items-end gap-1`), `text-xl`: `$228,441.00`, `$71,887.00`, `$156,540.00`, `$1,234.00`, `$98,234.00` - digits line up because of the default `tabular-nums`. |

Storybook stories to mirror: Default, Currency (multi-currency rows), Percent, Compact, SignDisplay (matrix), FormatOptions,
WithPrefixSuffix, TabularNums, plus a Locale story (e.g. `de-DE`) and a RenderFunction story.

## 7. Theme / token dependencies, light vs dark

The component itself uses no tokens. Demos use `text-foreground` (`--foreground`: light `lab(8.34% .61 -2.13)`, dark
`lab(98.97% 0 0)`) and `text-muted` (`--muted`: light `lab(47.87% 1.41 -4.99)`, dark `lab(65.65% 1.53 -5.42)`). There is
no structural or style difference between light and dark.

## 8. Dependencies

- OSS HeroUI: none.
- Pro: none (it is consumed by KPI: `KPI.Value` reuses its formatting, see `kpi.md`).
- Third party: `react-aria` (`useLocale`, optionally `useNumberFormatter`), `@internationalized/number` (`NumberFormatter`,
  `NumberFormatOptions` type; transitive via react-aria). `@number-flow/react` is NOT used by this component on
  heroui.pro (no animation observed).
- Export from the package root (`@heroui/pro`), unlike KPI.

## 9. Open questions / uncertainties

1. Docs say `.number-value` is an "inline-flex wrapper", but the CSSOM has only `font-variant-numeric: tabular-nums`.
   Recommendation: follow the CSSOM (no display rule). If inline-flex is wanted, note it changes whitespace handling.
2. Prefix markup was never rendered in a demo. Expected (by symmetry with Suffix):
   `<span class="number-value__prefix" data-slot="number-value-prefix">...</span>` placed before the value span.
3. Render-function children: output not observable. Recommended behaviour: `children(formatted)` result replaces the
   text inside `.number-value__value` (keep root + value span). Prefix/Suffix are not available in that mode.
4. Percent demo prints `3.3%` / `98.5%` but `-2%`; Intl percent defaults to 0 fraction digits, so the demo (or the
   component for `style="percent"`) must use `maximumFractionDigits: 1`. Not determinable which; recommend keeping Intl
   defaults in the component and passing `maximumFractionDigits={1}` in the story.
5. Exact values in the Format Options demo are inferred from output (`$1.2M` could be 1.15M-1.25M; accounting value
   -1234.56).
6. Precedence when both `formatOptions` and convenience props are given: docs say formatOptions "overrides" them; spec
   assumes a shallow merge with `formatOptions` last.

## Appendix A - raw CSSOM dump

All stylesheets of the demo page were walked recursively (`@layer`, `@media`, `@supports`, `@container`, nested rules);
rules whose selector contains `number-value` (format: `context >> rule`):

```
@layer components >> .number-value { font-variant-numeric: tabular-nums; }
```

No `@keyframes` contain `number-value`. For reference, the Tailwind utility used by the demos:

```
@layer utilities >> .tabular-nums { --tw-numeric-spacing: tabular-nums; font-variant-numeric: var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,); }
```
