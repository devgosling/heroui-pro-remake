# Line Chart (`line-chart`) - implementation spec

Source of truth: the public docs page https://heroui.pro/docs/react/components/line-chart (anatomy, API tables, CSS
classes), the public ChartTooltip docs page (tooltip contract), and the rendered DOM, CSSOM, computed styles and
runtime behaviour of the 10 public demo pages (light + dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

A thin HeroUI wrapper around Recharts' `LineChart`: a `.line-chart` root that renders `ResponsiveContainer` +
Recharts `LineChart` with HeroUI defaults (height 300, margin `{top: 8, right: 8, bottom: 0, left: 0}`) and themes the
Recharts internals (tick labels, axis lines, grid, tooltip cursor, active dot, focus ring) with theme tokens. Series,
axes, grid and tooltip are the Recharts components themselves, re-exported as compound parts.

Subpath-only import because it needs the optional `recharts` peer: `import {LineChart} from "@heroui/pro/line-chart"`
(not exported from the package root).

## 2. Anatomy

```tsx
<LineChart data={data}>
  <LineChart.Grid />                                       {/* optional, Recharts CartesianGrid */}
  <LineChart.XAxis />                                      {/* optional, Recharts XAxis */}
  <LineChart.YAxis />                                      {/* optional, Recharts YAxis */}
  <LineChart.Line dataKey="value" />                       {/* Recharts Line */}
  <LineChart.Tooltip content={<LineChart.TooltipContent />} /> {/* optional, Recharts Tooltip */}
</LineChart>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| Root `LineChart` | `<div>` | `line-chart` | `.line-chart` (+ user className) | plain DOM wrapping Recharts `ResponsiveContainer` (`width`, `height`, `minWidth=0`) + `LineChart` |
| `LineChart.Line` | SVG `g.recharts-line > path.recharts-line-curve` | - | Recharts classes | Recharts `Line` (identity re-export) |
| `LineChart.XAxis` | `g.recharts-xAxis` | - | Recharts classes | Recharts `XAxis` |
| `LineChart.YAxis` | `g.recharts-yAxis` | - | Recharts classes | Recharts `YAxis` |
| `LineChart.Grid` | `g.recharts-cartesian-grid` | - | Recharts classes | Recharts `CartesianGrid` |
| `LineChart.Tooltip` | `div.recharts-tooltip-wrapper` | - | Recharts classes | Recharts `Tooltip` |
| `LineChart.TooltipContent` | `div.chart-tooltip` | `chart-tooltip` | ChartTooltip classes | Pro `ChartTooltip.Content` |

Observed markup (default demo, 460px wide, `height={180}`):

```html
<div class="line-chart" data-slot="line-chart">
  <div class="recharts-responsive-container" style="width:100%;height:180px;min-width:0">
    <div style="width:0;overflow-x:visible">
      <div class="recharts-wrapper" style="position: relative; cursor: default; width: 460px; height: 180px;">
        <div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility: hidden; pointer-events: none; position: absolute; top: 0px; left: 0px;"></div>
        <svg role="application" tabindex="0" class="recharts-surface" width="460" height="180" viewBox="0 0 460 180">
          <g class="recharts-zIndex-layer_-100"><g class="recharts-cartesian-grid">...horizontal lines (stroke="#ccc")...</g></g>
          <defs><clipPath id="recharts1-clip"><rect x="30" y="8" height="142" width="422"/></clipPath></defs>
          <g class="recharts-zIndex-layer_400">
            <g class="recharts-layer recharts-line"><g class="recharts-layer recharts-shape">
              <path name="Organic" stroke="var(--chart-3)" stroke-width="2" fill="none" class="recharts-curve recharts-line-curve" d="M30,137.091L68.364,53.182..."/>
            </g></g>
          </g>
          <g class="recharts-zIndex-layer_500">...x/y axis lines + tick lines (stroke="#666")...</g>
          <g class="recharts-zIndex-layer_2000">...tick labels <text class="recharts-text recharts-cartesian-axis-tick-value" fill="#666">...</g>
        </svg>
      </div>
    </div>
  </div>
</div>
```

On hover Recharts adds `path.recharts-tooltip-cursor` (vertical, stroke `#ccc`) and one
`g.recharts-active-dot > circle.recharts-dot` per series (`r=4`, `fill=<series colour>`, `stroke="#fff"`,
`stroke-width=2`); the CSS below re-themes both.

## 3. API

### LineChart (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string>[]` | - | Rows (also accepts `null`/`undefined` values for gaps). |
| `height` | `number` | `300` | Chart height in px (ResponsiveContainer `height`). |
| `width` | `number \| \`${number}%\`` | `"100%"` | ResponsiveContainer `width`. |
| `margin` | `{top?, right?, bottom?, left?}` | `{top: 8, right: 8, bottom: 0, left: 0}` | Recharts margin. Missing sides fall back to these defaults (remake detail). |
| `children` | `ReactNode` | - | Recharts children. |
| `chartProps` | Recharts `LineChart` props minus `data`/`margin`/`children` | - | **Remake addition** (same as AreaChart) for `syncId`, `layout`, `onClick`, ... |
| ...rest | native `div` attributes (incl. `ref`, `className`) | - | Spread on the root `div`. |

Root DOM: `<div class={cx("line-chart", className)} data-slot="line-chart" {...rest}>`. ResponsiveContainer always gets
`minWidth={0}` (rendered style `width:100%;height:<h>px;min-width:0`).

### Parts

`LineChart.Line`, `.XAxis`, `.YAxis`, `.Grid` (CartesianGrid), `.Tooltip` are the Recharts components themselves (pure
re-exports, Recharts defaults untouched: Line is `type="linear"`, `dot` on, `strokeWidth` 1, active dot `r=4`,
animation 1500 ms `ease` that honours `prefers-reduced-motion` via Recharts' `isAnimationActive: "auto"`).
Demos therefore always pass `dot={false}` and `strokeWidth={2}` (or `1.5` for sparklines) explicitly.

`LineChart.TooltipContent` = `ChartTooltip.Content` (`hideHeader`, `indicator: "dot" | "line"`, `labelFormatter`,
`valueFormatter`, injected `active`/`label`/`payload`).

Compound object: `LineChart = Object.assign(LineChartRoot, {Root, Line, XAxis, YAxis, Grid, Tooltip, TooltipContent})`
plus named exports, `LineChart.*Props` type namespace and `lineChartVariants` (tv, `base: "line-chart"`).

## 4. Styling (CSS classes and tokens)

All rules live in `@layer components`, scoped under `.line-chart`:

| Selector | Observed declaration | Remake (tokens) |
| --- | --- | --- |
| `.line-chart` | `width: 100%` | `@apply w-full` |
| `.recharts-cartesian-axis-tick-value` | `font-size: 10px; fill: var(--muted) !important` | `text-[10px] fill-muted!` |
| `.recharts-cartesian-axis-line`, `.recharts-cartesian-axis-tick-line` | `stroke: none !important` | `stroke-none!` |
| `.recharts-cartesian-grid line` | `stroke: var(--muted); stroke-opacity: .15` | `stroke-muted` + `stroke-opacity: .15` |
| `.recharts-tooltip-cursor` | `stroke: var(--muted); stroke-dasharray: 4, 4; stroke-width: 1px` | `stroke-muted stroke-1` + dasharray |
| `.recharts-active-dot circle` | `stroke: var(--surface); stroke-width: 2px` | `stroke-surface stroke-2` |
| `.recharts-surface`, `.recharts-surface *` | `outline: none` | `outline-none` |
| `.recharts-surface:focus-visible`, `.recharts-surface [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` | `outline-2 outline-focus outline-solid outline-offset-(--ring-offset-width)` |

Notes:

- Unlike `.area-chart`, `.line-chart` has **no** `.recharts-tooltip-wrapper { z-index }` rule (not present in Pro CSSOM).
- Series colours come from the Pro palette `--chart-1..5` (`:root`, accent derived:
  `oklch(from var(--accent) calc(l -/+ .12/.24) c h)`, `--chart-3: var(--accent)`); in the remake the palette lives in
  `chart-tooltip.css` (shared by every chart). Status colours use `var(--color-success)` / `var(--color-danger)`.
- Dark mode only changes tokens (`--muted`, `--surface`, `--focus`, tooltip `--overlay`); no dark-specific rules.

## 5. Behaviour / timings

- Line draw-in: Recharts stroke-dasharray animation, 1500 ms, `ease`, starts on mount and animates between datasets
  when `data` changes (Portfolio range switch).
- Tooltip: Recharts default positioning (10 px offset right/below the pointer, flips inside the plot area, clamps to
  `viewBox.y`), `transition: transform 400ms` inline; cursor is a vertical line across the plot height.
- Keyboard: Recharts accessibility layer (`svg role="application" tabindex="0"`): Tab focuses the chart (focus ring
  2 px `--focus`, offset `--ring-offset-width`), Arrow Left/Right move the active index and tooltip.
- No `data-*` state attributes on the root.

## 6. Demo variants (all verified light + dark)

| Demo | Story | Structure |
| --- | --- | --- |
| line-chart-default | `Default` | Card `w-[520px] rounded-2xl`; header `flex-row items-center justify-between` (title `text-base` + legend dots `size-3 rounded-full` / `text-muted text-xs`, `gap-3` / `gap-1.5`); content `flex flex-col gap-4` with value block (`text-lg font-semibold` + `text-xs text-muted`); chart `height=180`, Grid `vertical={false}`, XAxis `tickMargin=8`, YAxis `width=30` with `k` formatter, two `linear` lines (`--chart-3`, `--chart-1`, width 2, no dots), Tooltip with thousands `valueFormatter`. |
| line-chart-portfolio | `Portfolio` | Card header `items-start pb-0`: title + balance block (`gap-0.5`, `text-2xl font-semibold`, change `text-xs font-medium text-green-500`, a literal Tailwind colour in Pro) and Pro `Segment size="sm"` (6 ranges, 1M selected) that swaps the dataset (15 points per range, 10 for the week range); chart `height=182`, margin `{top:4,right:0,bottom:0,left:0}`, hidden YAxis with symmetric head/foot room (19.1 px at 1M, 15.3 px at 1Y, so Pro pads by a fixed data amount; the remake pads by 13.7 % of the data range), one `monotone` line `--chart-3`. On a range switch Recharts replaces the line path and replays the 1500 ms draw-in (same in both). |
| line-chart-traffic-source | `TrafficSource` | Identical structure to default (Pro ships the same demo twice). |
| line-chart-multi-line-chart-colors | `MultiLineChartColors` | Card `w-[600px]`, 4-entry legend, chart `height=240`, four `monotone` lines `--chart-4..1`, tooltip `indicator="line"`, raw values. |
| line-chart-with-dots | `WithDots` | Plain card header; chart `height=200`, YAxis `width=40` `$Nk`; `monotone` line with `dot={{r:3, fill, strokeWidth:0}}`, `activeDot={{r:5}}`. |
| line-chart-dashed-comparison | `DashedComparison` | Legend with a dashed swatch (`h-0 w-3 border-t-2 border-dashed`); dashed target line (`strokeDasharray="5 5"`, `--chart-2`) rendered before the solid actual line (`--chart-3`). |
| line-chart-sparkline | `Sparkline` | No card: `flex items-center gap-6` of `flex-col gap-1` items (label `text-xs text-muted`, `w-[120px]` wrapper); chart `height=40`, margin top 2 / others 0, `monotone`, `strokeWidth=1.5`, success / danger / `--chart-3`, 12 data points each (no YAxis, so the domain starts at 0). |
| line-chart-kpi-with-chart | `KPIWithChart` | `grid w-[900px] gap-3 sm:grid-cols-2 lg:grid-cols-3` of Pro `KPI` cards; `KPI.Content` `grid-cols-[1fr_1fr] items-end` with value (`text-3xl`) + `TrendChip variant="tertiary"` with suffix, and a `height=70` sparkline (margin top 4, 12 data points). |
| line-chart-stats-with-chart | `StatsWithChart` | `w-[700px] flex-col gap-3`: 3 stat Cards (`gap-1`, description `text-sm font-medium`, value `text-2xl font-semibold flex-1`, OSS `Chip` soft sm with arrow icon `size-3`) above a chart card (height 200, YAxis width 40). |
| line-chart-custom-tooltip | `WithCustomTooltip` | Two `monotone` lines (`--chart-3`, `--chart-2`), height 200; Tooltip `content` composes `ChartTooltip` (`indicator="line"`) + Header/Item/Indicator/Label/Value and appends a summary row `mt-1 flex justify-between border-t border-separator pt-1.5` (`text-xs font-medium text-muted` / `text-xs font-semibold text-foreground`). |

Note: the Pro default and traffic-source demos render only four YAxis ticks (0, 5k, 10k, 20k) and their grid lines,
with the domain topping out at 22k. That comes from the demo's own data or axis configuration (no tick at 15k), not
from the component. The remake stories use Recharts' automatic ticks.

Story ids: `pro-charts-linechart--default`, `--portfolio`, `--traffic-source`, `--multi-line-chart-colors`,
`--with-dots`, `--dashed-comparison`, `--sparkline`, `--kpi-with-chart`, `--stats-with-chart`,
`--with-custom-tooltip`.

## 7. Verification (remake vs Pro)

- Plot geometry identical for the same width: clip rect `x=30 y=8 h=142` (default), tick labels at `y=164`
  (`tickMargin` 8) / `x=22`, YAxis width 40 -> labels at `x=32`; sparkline clip `0,2,120,38`; KPI chart clip `0,4,w,66`;
  portfolio line extremes at `y≈23.1 / 162.9` of 182.
- Computed: tick text 10px `--muted`; grid `--muted` @ 0.15; axis lines `none`; cursor `--muted` 1px `4,4`; active dot
  stroke `--surface` 2px (white in light, `#18181b`-ish surface in dark); tooltip 140x78, radius 8, padding 8/12, same
  shadow; focus ring 2px solid `--focus`, offset 2px.
- Curve types checked from the Pro path data (zero overshoot -> `monotone`, `L` commands -> `linear`).
- Review pass (2026-11-24): the Pro CSSOM `.line-chart` rules match the compiled remake rules one to one (all in
  `@layer components`). Theme tokens (`--accent`, `--muted`, `--surface`, `--separator`, `--overlay`, `--focus`,
  `--chart-1..5`, success/danger) resolve to the same RGB values in light and dark. Tooltip (140 px wide, 8/12 padding,
  radius 8, `--overlay-shadow`, dot 8x8 / line 4x12 indicators), cursor (`--muted` 1 px, `4 4`), active dot (r 4, or
  r 5 with `activeDot`, `--surface` 2 px ring), Tab focus (2 px `--focus` outline, 2 px offset, tooltip on the first
  point) and ArrowRight stepping all match. Overriding `--radius`, `--accent` and `--font-sans` restyles the chart.
- Recharts output differs slightly between Pro's bundled version and ours (Pro dots have no `fill-opacity="1"`, Pro's
  cursor path has no `fill`, Pro keeps the final `stroke-dasharray` after the draw-in). None of this is visible.

## 8. Dependencies

`recharts` (optional peer, subpath-only), `../chart-tooltip` (TooltipContent). Stories also use OSS `Card`/`Chip`,
Pro `Segment`, `KPI`, `TrendChip`, `ChartTooltip`, and `@iconify/react` (gravity-ui arrows).

## 9. Deviations

- `chartProps` pass-through to the Recharts `LineChart` (additive, mirrors AreaChart).
- Partial `margin` objects are merged with the documented defaults.
- `data` rows also accept `null`/`undefined` values (Recharts gaps / `connectNulls`).
- Story copy/data are original (same point counts as Pro). Like Pro, the portfolio balance change uses the literal
  `text-green-500`.
- Portfolio head/foot room: ±13.7 % of the data range instead of Pro's (apparently fixed) data padding. This matches the
  1M view exactly and stays close on the other ranges.
