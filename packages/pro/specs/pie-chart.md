# Pie Chart (`pie-chart`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/pie-chart, plus the rendered DOM, CSSOM,
computed styles and observed runtime behaviour of the seven public demo pages (light + dark), observed on 2026-11-24.
No paywalled source was read.

## 1. Purpose

A pie / donut chart for proportional data: a thin `.pie-chart` root that wraps a Recharts `PieChart` (fixed size or
inside a `ResponsiveContainer`) and themes the Recharts internals with HeroUI tokens. Every other part is a plain
re-export of a Recharts component, plus the shared `ChartTooltip.Content` renderer for tooltips. Legends, centre
values and breakdown lists in the demos are ordinary app markup (Tailwind utilities), not component parts.

Subpath-only import because it needs the optional `recharts` peer: `import {PieChart} from "@heroui/pro/pie-chart"`
(Pro: `@heroui-pro/react/pie-chart`). Not exported from the package root.

## 2. Anatomy

```tsx
<PieChart>
  <PieChart.Pie data={data} dataKey="value">
    <PieChart.Cell />   {/* optional: per-slice fill */}
    <PieChart.Label />  {/* optional: donut centre label */}
  </PieChart.Pie>
  <PieChart.Tooltip content={<PieChart.TooltipContent />} /> {/* optional */}
</PieChart>
```

| Part | Element | `data-slot` | Class | Implementation |
| --- | --- | --- | --- | --- |
| `PieChart` (root) | `<div>` | `pie-chart` | `.pie-chart` + user className | own component |
| `PieChart.Pie` | Recharts `<g class="recharts-layer recharts-pie" tabindex="0">` | - | Recharts classes | re-export of Recharts `Pie` |
| `PieChart.Cell` | (no DOM, feeds sector fill) | - | - | re-export of Recharts `Cell` |
| `PieChart.Label` | `<text class="recharts-text recharts-label">` | - | - | re-export of Recharts `Label` |
| `PieChart.Tooltip` | `<div class="recharts-tooltip-wrapper">` | - | - | re-export of Recharts `Tooltip` |
| `PieChart.TooltipContent` | `.chart-tooltip` card | `chart-tooltip` (+ parts) | ChartTooltip classes | alias of `ChartTooltip.Content` |

### Observed markup

Responsive (percentage / default width), default demo, card 360px wide, `height={220}`:

```html
<div class="pie-chart" data-slot="pie-chart">
  <div class="recharts-responsive-container" style="width:100%;height:220px;min-width:0">
    <div style="width:0;overflow-x:visible">
      <div width="328" height="220" class="recharts-wrapper" style="position: relative; cursor: default; width: 328px; height: 220px;">
        <div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility: hidden; pointer-events: none; position: absolute; top: 0px; left: 0px;"></div>
        <svg cx="50%" cy="50%" role="application" tabindex="0" class="recharts-surface" width="328" height="220" viewBox="0 0 328 220">
          <title></title><desc></desc>
          <defs><clipPath id="recharts1-clip"><rect x="5" y="5" height="210" width="318"></rect></clipPath></defs>
          <g tabindex="-1" class="recharts-zIndex-layer_100">
            <g class="recharts-layer recharts-pie" tabindex="0">
              <g class="recharts-layer">
                <g class="recharts-layer recharts-pie-sector" tabindex="-1">
                  <g class="recharts-layer recharts-shape">   <!-- recharts-active-shape while hovered -->
                    <path cx="164" cy="110" fill="var(--chart-4)" stroke="#fff" name="Chrome" class="recharts-sector" d="..."/>
                  </g>
                </g>
                ...
```

Fixed size (numeric `width`): no `ResponsiveContainer`, the Recharts chart gets `width`/`height` directly:

```html
<div class="pie-chart" data-slot="pie-chart">
  <div width="220" height="220" class="recharts-wrapper" style="position:relative;cursor:default;width:220px;height:220px">
    ...
```

Tooltip (all demos; no header row for pies because Recharts passes no category label):

```html
<div class="recharts-tooltip-wrapper recharts-tooltip-wrapper-right recharts-tooltip-wrapper-bottom"
     style="visibility: visible; pointer-events: none; position: absolute; top: 0px; left: 0px; transition: transform 400ms; transform: translate(157.4px, 78.2px);">
  <div class="chart-tooltip" data-slot="chart-tooltip">
    <div class="chart-tooltip__item" data-slot="chart-tooltip-item">
      <span class="chart-tooltip__indicator chart-tooltip__indicator--dot" data-slot="chart-tooltip-indicator" style="background-color: var(--chart-4);"></span>
      <span class="chart-tooltip__label" data-slot="chart-tooltip-label">Chrome</span>
      <span class="chart-tooltip__value" data-slot="chart-tooltip-value">62</span>
    </div>
  </div>
</div>
```

## 3. API

### `PieChart` (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `height` | `number` | `300` | Chart height in px. |
| `width` | `number \| \`${number}%\`` | `"100%"` | Number: fixed-size Recharts chart. Percentage: `ResponsiveContainer` (`minWidth={0}`). |
| `children` | `ReactNode` | - | Recharts children (`PieChart.Pie`, `PieChart.Tooltip`, ...). |
| `chartProps` | Recharts `PieChart` props minus `children`/`width`/`height`/`ref` | - | **Remake addition** (same escape hatch as AreaChart): `margin`, `onClick`, `accessibilityLayer`, ... |
| ...rest | native `div` attributes (incl. `ref`, `className`, `style`) | - | Spread on the root div. |

### Re-exports

- `PieChart.Pie` = Recharts `Pie` (full Recharts API).
- `PieChart.Cell` = Recharts `Cell`.
- `PieChart.Label` = Recharts `Label`.
- `PieChart.Tooltip` = Recharts `Tooltip`.
- `PieChart.TooltipContent` = `ChartTooltip.Content` (`hideHeader`, `indicator`, `labelFormatter`, `valueFormatter`, ...;
  see the ChartTooltip spec).

Exports: `PieChart` (compound, also `PieChart.Root`), `PieChartRoot`, `PieChartPie`, `PieChartCell`, `PieChartLabel`,
`PieChartTooltip`, `PieChartTooltipContent`, `pieChartVariants`; types `PieChartProps`/`PieChartRootProps`,
`PieChartPieProps`, `PieChartCellProps`, `PieChartLabelProps`, `PieChartTooltipProps`, `PieChartTooltipContentProps`,
`PieChartVariants`, and the `PieChart` type namespace.

## 4. Styling

Docs "CSS classes": `.pie-chart` (root). Recharts theming rules (all scoped under `.pie-chart`, all observed in CSSOM,
`@layer components`):

| Selector | Observed declaration | Remake (`css/components/pie-chart.css`) |
| --- | --- | --- |
| `.pie-chart` | `width: 100%` | `@apply w-full` |
| `.recharts-pie-sector path` | `stroke: none` (Recharts default `stroke="#fff"` removed) | same |
| `.recharts-pie-label-text` | `font-size: 11px; fill: var(--muted) !important` | `@apply text-[11px] fill-muted!` |
| `.recharts-pie-label-line` | `stroke: var(--muted); stroke-opacity: .3` | `@apply stroke-muted; stroke-opacity: 0.3` |
| `.recharts-label` | `fill: var(--foreground)` | `@apply fill-foreground!` (see deviations) |
| `.recharts-tooltip-cursor` | `display: none` | `@apply hidden` |
| `.recharts-tooltip-wrapper` | `z-index: 10` (above HTML centre overlays) | `@apply z-10 motion-reduce:transition-none!` (see deviations) |
| `.recharts-surface, .recharts-surface *` | `outline: none` | `@apply outline-none` |
| `.recharts-surface:focus-visible, .recharts-surface [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` | `@apply outline-2 outline-offset-(--ring-offset-width) outline-focus outline-solid` |

### Tokens

- Slice colours: the shared Pro chart palette `--chart-1..5`, declared on `:root` and derived from `--accent`
  (`--chart-3` = accent; 1/2 darker by 0.24/0.12 oklch lightness, 4/5 lighter by 0.12/0.24). Demos colour slices
  4, 3, 2, 1 (lightest first). The remake declares the palette once in `css/components/chart-tooltip.css`.
  Observed (sky theme, light): chart-4 = `oklch(0.7404 0.195 253.8)`, chart-3 = accent, chart-2 = `oklch(0.5004 ...)`,
  chart-1 = `oklch(0.3804 ...)`; dark mode re-derives from the dark accent.
- Muted / foreground / focus / ring offset: `--muted`, `--foreground`, `--focus`, `--ring-offset-width` (2px).
- Tooltip card (ChartTooltip): 8px 12px padding, 6px gap, `rounded-lg` (8px), 1px `--separator` border, `--overlay`
  background, overlay shadow (light) / inset 1px highlight (dark), min-width 140px, text 12px (label muted 400,
  value foreground 600), 8px dot indicator.

## 5. Behaviour

All behaviour is Recharts' own (the remake uses the same Recharts components, so it matches by construction):

- Entry animation: Recharts Pie defaults (`isAnimationActive: "auto"`, begin 400ms, duration 1500ms, easing `ease`),
  sectors sweep from the start angle (measured on the Pro demo and the remake: first frame ~400ms after mount,
  last frame ~1.5s later). Recharts honours the OS `prefers-reduced-motion` itself (`usePrefersReducedMotion`) for
  both the entrance animation and the tooltip slide; the HeroUI `data-reduce-motion="true"` switch additionally
  removes the inline tooltip transition through `motion-reduce:transition-none!`.
- Recharts drives the entrance animation with `requestAnimationFrame`: in a hidden/background browser tab no frame
  fires and the sectors stay at their start angle (empty shapes) until the tab is shown. This is the same on Pro and
  is not a component bug, but it matters when measuring demos in background tabs.
- Tooltip: item-type tooltip; on sector hover it anchors at the sector's `tooltipPosition` (mid-angle at the middle
  radius) + 10px offset, `transition: transform 400ms`; the hovered sector's shape group becomes
  `recharts-active-shape` (no visual change). No header row (Recharts passes no category label for pies).
- Keyboard: the `<svg role="application" tabindex="0">` is focusable (2px focus outline, 2px offset); ArrowLeft/Right
  cycle the active sector and move the tooltip (Recharts accessibility layer). Each `.recharts-pie` group is also
  `tabindex="0"`.
- Default Pie geometry (Recharts): `cx/cy 50%`, `outerRadius "80%"` of `min(w,h)/2 - 5px` margin, start angle 0
  (3 o'clock) going counter-clockwise.

## 6. Demo variants (all inside an OSS `Card`, `rounded-2xl`, header title `text-base`)

| Demo | Card | Chart | Pie config (derived from geometry) | Extra markup |
| --- | --- | --- | --- | --- |
| `pie-chart-default` | `w-[360px]`, content `flex flex-col items-center gap-4` | responsive, `height={220}` (328x220) | `outerRadius={90}`, Cells chart-4..1 | inline legend (`flex flex-wrap justify-center gap-x-4 gap-y-1.5`; item `gap-1.5`; dot `size-2.5 rounded-full`; label `text-xs text-muted`) |
| `pie-chart-donut` | same | responsive 220 | `innerRadius="68%"`, `paddingAngle={-20}` (overlapping rounded ends), `cornerRadius` >= half ring (clamped to 6.3px), `strokeWidth={0}` | legend "Name (4,500)"; tooltip value `toLocaleString` |
| `pie-chart-donut-with-label` | same + `Card.Description` (`text-xs text-muted`) | fixed `220x220` inside `.relative` | donut config | HTML centre overlay `pointer-events-none absolute inset-0 flex flex-col items-center justify-center` (value `text-2xl font-bold`, unit `text-xs text-muted`); tooltip "42 GB" |
| `pie-chart-donut-with-content` | same | fixed `240x240` | donut config | overlay `text-3xl font-bold` + `text-sm text-muted`; vertical list `flex flex-col gap-2` rows `gap-3`: dot `size-3`, name `w-16 text-sm`, value `text-sm font-semibold`, pct `text-xs text-muted`; tooltip raw value |
| `pie-chart-nested-donut` | `w-[400px]`, header `flex-row items-center justify-between` | responsive `height={240}` (368x240) | two Pies: inner `outerRadius="46%" innerRadius="34%"`, outer `"68%"/"56%"`, donut config | category legend (`gap-6` > `gap-4`), series legend `text-muted flex items-center gap-3 text-xs` with `bg-muted/30` / `bg-muted` dots; tooltip "$3,200" |
| `pie-chart-with-breakdown` | `w-[460px]`, content `flex flex-row items-center gap-6` | fixed `180x180` in `.relative.shrink-0` | donut config (outer 68, inner 57.8, corner 5.1) | overlay `text-xl font-bold` + `text-[10px] text-muted`; list `flex flex-1 flex-col gap-3`, row value `text-sm font-semibold` + pct `text-xs text-muted` |
| `pie-chart-custom-tooltip` | `w-[360px]` | responsive 220 | `outerRadius={90}` | tooltip `valueFormatter` -> "62.0%" |

The donut geometry was confirmed exactly: rendering the remake with the Pro demo's legend values and
`innerRadius="68%" paddingAngle={-20}` reproduces the Pro sector path strings to 4 decimals.

Stories (`Pro/Charts/PieChart`): `Default`, `Donut`, `DonutWithLabel`, `DonutWithContent`, `NestedDonut`,
`WithBreakdown`, `CustomTooltip` - same structure, classes and chart config per demo, own data and texts. Element
metrics (card, header, chart wrapper, legend rows, dots, overlay text boxes) match the Pro demos 1:1 apart from text
widths caused by the different texts.

## 7. Dependencies

- `recharts` 3 (optional peer) -> subpath-only.
- `../chart-tooltip` (`ChartTooltipContent`, shared `--chart-*` palette).
- OSS `Card` only in stories.

## 8. Deviations

- `chartProps` on the root (additive escape hatch to the Recharts `PieChart`, consistent with AreaChart).
- `.recharts-label` fill is `!important`: Recharts 3.11 `Text` writes its legacy default grey as an inline
  `fill` style, so Pro's plain rule would not reach the centre label with the installed Recharts.
- Recharts 3.11 adds a `color` attribute to sector paths and `style="outline: none"` on z-index layers; Pro's (older)
  Recharts does not. Purely Recharts-version markup, no visual effect.
- Focus uses an outline (as Pro) instead of the `status-focused` box-shadow ring: SVG children cannot paint
  box-shadow.
- `.recharts-tooltip-wrapper` also gets `motion-reduce:transition-none!` (same as AreaChart): Recharts writes the
  400ms slide inline and only drops it for the OS setting, so the HeroUI `data-reduce-motion` switch needs the
  `!important` rule. No visual change with motion enabled; Pro has no such rule.

## Appendix: observed CSSOM (reference only)

```
[@layer components] .pie-chart { width: 100%; }
[@layer components] .pie-chart .recharts-pie-sector path { stroke: none; }
[@layer components] .pie-chart .recharts-pie-label-text { font-size: 11px; fill: var(--muted) !important; }
[@layer components] .pie-chart .recharts-pie-label-line { stroke: var(--muted); stroke-opacity: 0.3; }
[@layer components] .pie-chart .recharts-label { fill: var(--foreground); }
[@layer components] .pie-chart .recharts-tooltip-cursor { display: none; }
[@layer components] .pie-chart .recharts-tooltip-wrapper { z-index: 10; }
[@layer components] .pie-chart .recharts-surface, .pie-chart .recharts-surface * { outline: none; }
[@layer components] .pie-chart .recharts-surface:focus-visible, .pie-chart .recharts-surface [tabindex="0"]:focus-visible { outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width); }
[@layer theme] :root { --chart-1: oklch(from var(--accent) calc(l - .24) c h); --chart-2: oklch(from var(--accent) calc(l - .12) c h); --chart-3: var(--accent); --chart-4: oklch(from var(--accent) calc(l + .12) c h); --chart-5: oklch(from var(--accent) calc(l + .24) c h) }
```
