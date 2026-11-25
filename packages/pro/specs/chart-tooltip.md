# Chart Tooltip (`chart-tooltip`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/chart-tooltip, the server-rendered DOM,
CSSOM, computed styles and behaviour of the 7 public demo pages (light + dark), observed on 2026-11-24. No paywalled
source, JS chunk, source map or code panel was read.

## 1. Purpose

A small data card listing the series values of a hovered chart point: optional header (x-axis label) + one row per
series (colour indicator, series name, value). It can be composed by hand (`ChartTooltip` + parts) or rendered
automatically from a Recharts tooltip payload (`ChartTooltip.Content`, passed as `<Tooltip content={...} />`).
Every Pro chart (AreaChart, BarChart, LineChart, PieChart, ... and KPI.Chart) uses it as its tooltip content.

The component itself does not import `recharts` (types are structural), so it is exported from the package root as
well as from `@heroui/pro/chart-tooltip`.

## 2. Anatomy

```tsx
<ChartTooltip indicator="dot">           {/* active defaults to true */}
  <ChartTooltip.Header>January</ChartTooltip.Header>       {/* optional */}
  <ChartTooltip.Item>
    <ChartTooltip.Indicator color="var(--chart-3)" />
    <ChartTooltip.Label>Revenue</ChartTooltip.Label>
    <ChartTooltip.Value>$12,400</ChartTooltip.Value>
  </ChartTooltip.Item>
</ChartTooltip>

<Tooltip content={<ChartTooltip.Content valueFormatter={...} />} />   {/* Recharts */}
```

| Part | Element | `data-slot` | BEM class | Notes |
| --- | --- | --- | --- | --- |
| `ChartTooltip` (Root) | `<div>` | `chart-tooltip` | `.chart-tooltip` | Provides `indicator` via context. Renders nothing when `active={false}`. No `data-indicator`/modifier on the root. |
| `ChartTooltip.Header` | `<div>` | `chart-tooltip-header` | `.chart-tooltip__header` | |
| `ChartTooltip.Item` | `<div>` | `chart-tooltip-item` | `.chart-tooltip__item` | |
| `ChartTooltip.Indicator` | `<span>` (empty) | `chart-tooltip-indicator` | `.chart-tooltip__indicator .chart-tooltip__indicator--dot\|--line` | `style="background-color: <color>"`. No `aria-hidden` (empty span is not announced). |
| `ChartTooltip.Label` | `<span>` | `chart-tooltip-label` | `.chart-tooltip__label` | |
| `ChartTooltip.Value` | `<span>` | `chart-tooltip-value` | `.chart-tooltip__value` | |
| `ChartTooltip.Content` | (Root + parts) | same as above | same as above | Auto-renders the Recharts payload. |

No OSS HeroUI component is used (plain DOM). No interactive element, no ARIA role.

### Observed markup (demo "Usage", SSR + hydrated DOM identical)

```html
<div class="chart-tooltip" data-slot="chart-tooltip">
  <div class="chart-tooltip__header" data-slot="chart-tooltip-header">January</div>
  <div class="chart-tooltip__item" data-slot="chart-tooltip-item">
    <span class="chart-tooltip__indicator chart-tooltip__indicator--dot" data-slot="chart-tooltip-indicator"
          style="background-color:var(--chart-3)"></span>
    <span class="chart-tooltip__label" data-slot="chart-tooltip-label">Revenue</span>
    <span class="chart-tooltip__value" data-slot="chart-tooltip-value">$12,400</span>
  </div>
  <div class="chart-tooltip__item" data-slot="chart-tooltip-item"> ... var(--chart-1) ... Expenses ... $8,200 </div>
</div>
```

`ChartTooltip.Content` (demo "Auto Content") produces exactly the same markup; the indicator colour comes from the
payload entry, the value is printed raw (`18200`, no locale formatting) unless `valueFormatter` is given.

## 3. API

### `ChartTooltip` (Root) - also `ChartTooltip.Root`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `active` | `boolean` | `true` | When `false` nothing is rendered. |
| `indicator` | `"dot" \| "line"` | `"dot"` | Indicator shape for every `Indicator` inside (context). |
| `children` | `ReactNode` | - | Header / Item parts. |
| ...native `div` attributes (+ `ref`) | | | |

### `ChartTooltip.Content`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `active` | `boolean` | - | Injected by Recharts. Nothing renders unless `true`. |
| `label` | `number \| string` | - | Injected by Recharts (x-axis value). Used as header text. |
| `payload` | `RechartsPayloadEntry[]` | - | Injected by Recharts. Nothing renders when empty. |
| `hideHeader` | `boolean` | `false` | Hides the header row. |
| `indicator` | `"dot" \| "line"` | `"dot"` | Indicator shape. |
| `labelFormatter` | `(label) => ReactNode` | - | Header formatter. Ours also receives the payload as 2nd arg (used by KPI.Chart stories to read the hovered datum). |
| `valueFormatter` | `(value) => ReactNode` | - | Value formatter. Ours also receives the payload entry as 2nd arg. |

Ours additionally accepts `className` / `style` (forwarded to the root). It deliberately does NOT spread other props:
Recharts injects many non-DOM props (`coordinate`, `viewBox`, `accessibilityLayer`, ...).

Per entry: colour = first usable of `color`, `stroke`, `fill`, `payload.fill`, `payload.color` (skipping `url(#...)`
gradients); name = `name` or string/number `dataKey`; entries with `type: "none"` are skipped (Recharts convention).

### `ChartTooltip.Header` / `.Item`

`children` + native `div` attributes.

### `ChartTooltip.Indicator`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | - | Indicator background (`var(--chart-3)`, `#hex`, ...). Merged before a user `style`. |

Shape comes from the root `indicator` (context; `dot` outside a root). Native `span` attributes.

### `ChartTooltip.Label` / `.Value`

`children` + native `span` attributes.

### Exports

`ChartTooltip` (compound: Root, Content, Header, Item, Indicator, Label, Value), named `ChartTooltipRoot`,
`ChartTooltipContent`, `ChartTooltipHeader`, `ChartTooltipItem`, `ChartTooltipIndicator`, `ChartTooltipLabel`,
`ChartTooltipValue`, `ChartTooltipContext`, `chartTooltipVariants`; types `ChartTooltip` namespace,
`ChartTooltipProps`/`RootProps`, `ContentProps`, `HeaderProps`, `ItemProps`, `IndicatorProps`, `LabelProps`,
`ValueProps`, `ChartTooltipPayloadItem`, `ChartTooltipIndicatorShape`, `ChartTooltipValueType`, `ChartTooltipVariants`.

## 4. Styling

### CSS classes (docs + CSSOM, all in `@layer components`)

| Class | Declarations (observed) | Our authoring |
| --- | --- | --- |
| `.chart-tooltip` | flex column, gap 6px, radius `calc(var(--radius) * 1)`, 1px solid `--separator`, bg `--overlay`, `min-width: 140px`, padding 8px 12px, `box-shadow: var(--overlay-shadow)`, `tabular-nums` | `@apply flex min-w-[140px] flex-col gap-1.5 rounded-lg border border-separator bg-overlay px-3 py-2 tabular-nums; box-shadow: var(--overlay-shadow)` |
| `.chart-tooltip__header` | 12px/16px, weight 500, `--muted` | `text-xs font-medium text-muted` |
| `.chart-tooltip__item` | flex, center, gap 8px | `flex items-center gap-2` |
| `.chart-tooltip__indicator` | `flex-shrink: 0` | `shrink-0` |
| `.chart-tooltip__indicator--dot` | 8x8, fully rounded | `size-2 rounded-full` |
| `.chart-tooltip__indicator--line` | 4x12 (w x h), fully rounded | `h-3 w-1 rounded-full` |
| `.chart-tooltip__label` | 12px/16px, `--muted`, `flex: 1` | `flex-1 text-xs text-muted` |
| `.chart-tooltip__value` | 12px/16px, weight 600, `--foreground` | `text-xs font-semibold text-foreground` |

The root sets no font-size or colour; children carry their own. No sizes, no variants other than the indicator
modifier, no hover/focus/disabled states, no transitions or animations.

### Chart palette tokens

The demos colour indicators with `var(--chart-1..5)`. Pro defines them in its theme layer on `:root` (and repeats them
for every built-in design theme, light and dark, with the same formula):

| Token | Value | Light demo (accent `oklch(0.62 0.195 253.8)`) |
| --- | --- | --- |
| `--chart-1` | `oklch(from var(--accent) calc(l - .24) c h)` | `oklch(0.380 0.195 253.8)` (darkest) |
| `--chart-2` | `oklch(from var(--accent) calc(l - .12) c h)` | `oklch(0.500 0.195 253.8)` |
| `--chart-3` | `var(--accent)` | accent |
| `--chart-4` | `oklch(from var(--accent) calc(l + .12) c h)` | lighter |
| `--chart-5` | `oklch(from var(--accent) calc(l + .24) c h)` | lightest |

Our OSS theme has no chart tokens, so `css/components/chart-tooltip.css` declares them on `:root` (components layer,
so any unlayered user override wins). They follow `--accent` and therefore theme/dark-mode changes. (The Pro "Chart
Colors" demo labels chart-1 "Lightest" and chart-4 "Darkest", which is inverted with respect to the formula; the
rendered colours confirm chart-1 is the darkest.)

### Measured (Pro vs ours, Inter, 1000px viewport)

| Demo | Pro | Ours |
| --- | --- | --- |
| Usage (header + 2 rows) | 148.86 x 78, rows 16px, header 16px | 169.77 x 78 (longer label text) |
| Auto Content | 2 cards 140 x 100 (dot 8x8 / line 4x12), container 304 x 100 | identical |
| Line Indicator | 140 x 100 | 140 x 100 |
| No Header | 140 x 34 | 140 x 34 |
| Chart Colors | 141.72 x 122 + 140 x 122 | 143.17 x 122 + 140 x 122 |
| Custom Formatters | 166.05 x 78 | 191.14 x 78 (longer text) |

Colours (light / dark) compared as computed values - identical tokens: bg `--overlay` (white / `oklch(0.21 0.006 286)`),
border `--separator`, header + label `--muted`, value `--foreground`, shadow `--overlay-shadow` (3-layer drop shadow /
`0 0 1px 0 rgba(255,255,255,.3) inset`).

## 5. Behaviour

- `active={false}` (Root) or `active` falsy / empty payload (Content): renders `null` (demo "Inactive" shows only the
  placeholder box).
- Header in Content: `labelFormatter ? labelFormatter(label, payload) : label`, omitted when `hideHeader` or the result
  is `undefined` / `null` / `""`.
- In a Recharts chart, positioning, show/hide, the 400ms `transform` transition of `.recharts-tooltip-wrapper`, the
  cursor and keyboard support (focus the `role="application"` surface, Arrow keys move the active index) all come from
  Recharts `Tooltip`; the content re-renders with the new payload. Verified in the `WithRecharts` story (hover shows
  the card, pointer leave sets `visibility: hidden`, ArrowRight moves through points).
- No timings or animations belong to the component itself.

## 6. Demos -> stories

| Pro demo | URL | Story | Content |
| --- | --- | --- | --- |
| Usage | `/docs/react/demos/chart-tooltip-default` | `Default` (args: active, indicator) | manual: header + 2 rows (chart-3, chart-1) |
| Auto Content | `chart-tooltip-auto-content` | `AutoContent` | `flex gap-6`: Content dot (header + 2 rows, raw numbers) + Content line (header + 3 rows chart-3/2/1) |
| Line Indicator | `chart-tooltip-line-indicator` | `LineIndicator` | manual `indicator="line"`, header + 3 rows chart-3/2/1, grouped numbers |
| No Header | `chart-tooltip-no-header` | `NoHeader` | single row, chart-3 |
| Chart Colors | `chart-tooltip-chart-colors` | `ChartColors` | `flex gap-6`: dot + line card, rows chart-1..chart-4 |
| Inactive | `chart-tooltip-inactive` | `Inactive` | `flex flex-col gap-4`: `p.text-muted.text-sm` + `div.bg-default.flex.h-16.items-center.justify-center.rounded-lg` > `span.text-muted.text-xs`; tooltip `active={false}` renders nothing |
| Custom Formatters | `chart-tooltip-custom-formatters` | `CustomFormatters` | Content with date `labelFormatter` + currency `valueFormatter` (Pro's value formatter is locale dependent: `$24,801.32` in en, `$24.801,32` in de) |
| (extra) | - | `WithRecharts` | AreaChart + `Tooltip content={<ChartTooltip.Content />}` to exercise hover/keyboard |

Demo page frame: `[data-demo-page]` centred flex, padding 24px (40px from 40rem).

## 7. Dependencies

- None at runtime besides React and `tailwind-variants`. `recharts` only in stories / consumers.
- Consumers: KPI.Chart (`tooltip` prop with `<Tooltip content={<ChartTooltip.Content ... />} />`), and the chart
  components (`AreaChart.TooltipContent` etc. = `ChartTooltip.Content`).

## 8. Deviations

1. `labelFormatter` / `valueFormatter` get an extra 2nd argument (payload / entry). Backward compatible with the
   documented single-argument signatures; kept for KPI.Chart and the chart components.
2. `ChartTooltip.Content` accepts `className` / `style` (not documented by Pro).
3. Content skips payload entries with `type: "none"` and falls back through several colour sources (Pro behaviour for
   these edge cases is not observable in the demos).
4. `--chart-1..5` are declared in `chart-tooltip.css` (Pro ships them in its theme layer). Should move to a shared
   theme file if one is added to `@heroui/pro/css`.
5. `box-shadow: var(--overlay-shadow)` is written as a plain declaration (like OSS popover/tooltip) instead of the
   `shadow-overlay` utility so the computed shadow equals Pro's (no extra transparent ring layers).

## Appendix - raw CSSOM (reference only, not used as implementation)

```css
@layer components {
  .chart-tooltip{gap:calc(var(--spacing) * 1.5);border-radius:calc(var(--radius) * 1);border-style:var(--tw-border-style);background-color:var(--overlay);min-width:140px;padding-inline:calc(var(--spacing) * 3);padding-block:calc(var(--spacing) * 2);border-width:1px;border-color:var(--separator);box-shadow:var(--overlay-shadow);font-variant-numeric:tabular-nums;flex-direction:column;display:flex}
  .chart-tooltip__header{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height));--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium);color:var(--muted)}
  .chart-tooltip__item{align-items:center;gap:calc(var(--spacing) * 2);display:flex}
  .chart-tooltip__indicator{flex-shrink:0}
  .chart-tooltip__indicator--dot{width:calc(var(--spacing) * 2);height:calc(var(--spacing) * 2);border-radius:2147483647px}
  .chart-tooltip__indicator--line{height:calc(var(--spacing) * 3);width:var(--spacing);border-radius:2147483647px}
  .chart-tooltip__label{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height));color:var(--muted);flex:1}
  .chart-tooltip__value{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height));--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold);color:var(--foreground)}
}
@layer theme {
  :root{--chart-1:oklch(from var(--accent) calc(l - .24) c h);--chart-2:oklch(from var(--accent) calc(l - .12) c h);--chart-3:var(--accent);--chart-4:oklch(from var(--accent) calc(l + .12) c h);--chart-5:oklch(from var(--accent) calc(l + .24) c h)}
}
html:not([data-demo-fullscreen]) [data-demo-page]{min-height:100vh;padding:calc(var(--spacing) * 6);justify-content:center;align-items:center;display:flex}
@media (min-width:40rem){html:not([data-demo-fullscreen]) [data-demo-page]{padding:calc(var(--spacing) * 10)}}
```
