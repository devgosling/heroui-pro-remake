# Bar Chart (`bar-chart`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/bar-chart (anatomy, API tables, CSS
classes), the Chart Tooltip docs page (tooltip contract), and the rendered DOM, CSSOM, computed styles and observed
behaviour of the eight public demo pages (light + dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

A thin HeroUI wrapper around a Recharts `BarChart`: a `div.bar-chart` root that renders a `ResponsiveContainer` + the
Recharts chart, plus CSS that themes Recharts' internal class names with HeroUI tokens (10px muted tick labels, hidden
axis/tick lines, 15% muted grid lines, a 5% `currentColor` cursor band, focus outline). Bars, axes, grid and tooltip are
the Recharts components themselves (re-exported), so every Recharts prop applies. Supports grouped, stacked, horizontal
(`layout="vertical"`) and horizontal stacked layouts.

Subpath-only import because it needs the optional `recharts` peer: `import {BarChart} from "@heroui/pro/bar-chart"`
(Pro: `@heroui-pro/react/bar-chart`). Not exported from the package root.

## 2. Anatomy

```tsx
<BarChart data={data}>
  <BarChart.Grid />                                    {/* optional - Recharts CartesianGrid */}
  <BarChart.XAxis />                                   {/* optional - Recharts XAxis */}
  <BarChart.YAxis />                                   {/* optional - Recharts YAxis */}
  <BarChart.Bar dataKey="value" />                     {/* Recharts Bar */}
  <BarChart.Tooltip content={<BarChart.TooltipContent />} /> {/* optional - Recharts Tooltip + ChartTooltip.Content */}
</BarChart>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| Root `BarChart` | `<div>` (+ native div attrs) | `bar-chart` | `.bar-chart` + user className | plain DOM wrapping Recharts `ResponsiveContainer` > `BarChart` |
| `BarChart.Bar` | `<g class="recharts-layer recharts-bar">` | - | Recharts classes | Recharts `Bar` (re-export) |
| `BarChart.XAxis` / `YAxis` | `<g class="recharts-cartesian-axis recharts-xAxis xAxis">` | - | Recharts classes | Recharts `XAxis` / `YAxis` (re-export) |
| `BarChart.Grid` | `<g class="recharts-cartesian-grid">` | - | Recharts classes | Recharts `CartesianGrid` (re-export) |
| `BarChart.Tooltip` | `<div class="recharts-tooltip-wrapper">` + cursor `<path class="recharts-tooltip-cursor">` | - | Recharts classes | Recharts `Tooltip` (re-export) |
| `BarChart.TooltipContent` | `<div class="chart-tooltip">` | `chart-tooltip` | `.chart-tooltip*` | Pro `ChartTooltip.Content` |

### Observed markup (bar-chart-default, 448px wide card content, height 200)

```html
<div class="bar-chart" data-slot="bar-chart">
  <div class="recharts-responsive-container" style="width:100%;height:200px;min-width:0">
    <div style="width:0;overflow-x:visible">
      <div width="448" height="200" class="recharts-wrapper" style="position: relative; cursor: default; width: 448px; height: 200px;">
        <div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility: hidden; pointer-events: none; position: absolute; top: 0px; left: 0px;"></div>
        <svg role="application" tabindex="0" class="recharts-surface" width="448" height="200" viewBox="0 0 448 200" style="width: 100%; height: 100%; display: block;">
          <title></title><desc></desc>
          <g tabindex="-1" class="recharts-zIndex-layer_-100">
            <g class="recharts-cartesian-grid"><g class="recharts-cartesian-grid-horizontal">
              <line stroke="#ccc" fill="none" x1="30" y1="170" x2="440" y2="170"></line> ... (5 lines)
            </g></g>
          </g>
          <defs><clipPath id="recharts1-clip"><rect x="30" y="8" height="162" width="410"></rect></clipPath></defs>
          <g tabindex="-1" class="recharts-zIndex-layer_300">
            <g class="recharts-layer recharts-bar"><g class="recharts-layer recharts-bar-rectangles"><g class="recharts-layer">
              <g class="recharts-layer recharts-bar-rectangle"><g class="recharts-layer recharts-inactive-bar">
                <path fill="var(--accent)" x="39" y="121.4" width="16" height="48.6" class="recharts-rectangle" d="M39,129.4A 8,8,0,0,1,47,121.4 ..."></path>
              </g></g> ... (12 bars)
            </g></g></g>
          </g>
          <g tabindex="-1" class="recharts-zIndex-layer_500">
            <g class="recharts-layer recharts-cartesian-axis recharts-xAxis xAxis">
              <line class="recharts-cartesian-axis-line" stroke="#666" .../>
              <g class="recharts-cartesian-axis-ticks recharts-xAxis-ticks"> ... tick-line ... </g>
            </g>
            <g class="recharts-layer recharts-cartesian-axis recharts-yAxis yAxis"> ... </g>
          </g>
          <g tabindex="-1" class="recharts-zIndex-layer_2000">
            <g class="recharts-cartesian-axis-tick-labels recharts-xAxis-tick-labels">
              <g class="recharts-layer recharts-cartesian-axis-tick-label">
                <text x="47.08" y="184" class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="middle" fill="#666"><tspan dy="0.71em">Jan</tspan></text>
              </g> ...
            </g>
            <g class="recharts-cartesian-axis-tick-labels recharts-yAxis-tick-labels"> ... </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</div>
```

Hovered (tooltip + cursor):

```html
<path stroke="none" pointer-events="none" width="34.17" height="161" fill="#ccc" x="132.5" y="8.5"
      class="recharts-rectangle recharts-tooltip-cursor" radius="0" d="M 132.5,8.5 h 34.17 v 161 h -34.17 Z"></path>
<div tabindex="-1" class="recharts-tooltip-wrapper recharts-tooltip-wrapper-right recharts-tooltip-wrapper-top"
     style="visibility: visible; pointer-events: none; position: absolute; top: 0px; left: 0px; transition: transform 400ms; transform: translate(159.583px, 45px);">
  <div class="chart-tooltip" data-slot="chart-tooltip">
    <div class="chart-tooltip__header" data-slot="chart-tooltip-header">Apr</div>
    <div class="chart-tooltip__item" data-slot="chart-tooltip-item">
      <span class="chart-tooltip__indicator chart-tooltip__indicator--dot" data-slot="chart-tooltip-indicator" style="background-color: var(--accent);"></span>
      <span class="chart-tooltip__label" data-slot="chart-tooltip-label">sales</span>
      <span class="chart-tooltip__value" data-slot="chart-tooltip-value">45 units</span>
    </div>
  </div>
</div>
```

Structural notes:

- The root is a plain `<div class="bar-chart" data-slot="bar-chart">`; there are no data-* state attributes on it.
- `ResponsiveContainer` gets `width` (default `"100%"`), `height` (default 300) and `min-width: 0`.
- Recharts' accessibility layer is on (svg `role="application" tabindex="0"`).
- Axis/tick lines and the `#ccc` / `#666` presentation attributes are left as Recharts renders them; the CSS overrides
  them (this is why the CSS uses `!important` for tick fill / axis stroke: Recharts 3.11 also writes an inline
  `style="fill: ..."` on tick text).
- Bars are never wrapped in extra HeroUI markup; `fill` is passed per bar (`var(--accent)`, `var(--chart-N)`).

## 3. API (docs tables)

### BarChart (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string>[]` | - | Chart data. Remake also allows `null`/`undefined` values and readonly arrays. |
| `height` | `number` | `300` | ResponsiveContainer height (px). |
| `width` | `number \| \`${number}%\`` | `"100%"` | ResponsiveContainer width. |
| `layout` | `"horizontal" \| "vertical"` | `"horizontal"` | `"vertical"` = horizontal bars. |
| `margin` | `{top?, right?, bottom?, left?}` | `{top: 8, right: 8, bottom: 0, left: 0}` | Passed as is (Recharts fills missing sides with 0). |
| `children` | `ReactNode` | - | Recharts children. |
| ...div attrs | | | `className`, `style`, `id`, `ref`, events, `data-*`, `aria-*` go to the root div. |

Remake extras (additive, not in the Pro table): `barCategoryGap`, `barGap`, `barSize`, `maxBarSize`, `stackOffset`,
`reverseStackOrder`, `syncId`, `syncMethod` - forwarded to the Recharts `BarChart` (none clash with div attributes).

### Parts

| Part | Source | Notes |
| --- | --- | --- |
| `BarChart.Bar` | Recharts `Bar` | Recharts API (dataKey, fill, radius, barSize, stackId, name, ...). |
| `BarChart.XAxis` | Recharts `XAxis` | |
| `BarChart.YAxis` | Recharts `YAxis` | |
| `BarChart.Grid` | Recharts `CartesianGrid` | |
| `BarChart.Tooltip` | Recharts `Tooltip` | Use `content={<BarChart.TooltipContent />}`. |
| `BarChart.TooltipContent` | Pro `ChartTooltip.Content` | `hideHeader`, `indicator` (`"dot" \| "line"`), `labelFormatter`, `valueFormatter` (+ Recharts-injected `active`, `label`, `payload`). |

## 4. Styling / tokens

| Selector | Observed | Remake (`css/components/bar-chart.css`) |
| --- | --- | --- |
| `.bar-chart` | `width: 100%` | `@apply w-full` |
| `.recharts-cartesian-axis-tick-value` | `font-size: 10px; fill: var(--muted) !important` | `@apply text-[10px] fill-muted!` |
| `.recharts-cartesian-axis-line`, `.recharts-cartesian-axis-tick-line` | `stroke: none !important` | `@apply stroke-none!` |
| `.recharts-cartesian-grid line` | `stroke: var(--muted); stroke-opacity: .15` | `@apply stroke-muted; stroke-opacity: 0.15` |
| `.recharts-tooltip-cursor` | `fill: currentcolor; opacity: .05` (Recharts attr `stroke="none"`) | `@apply fill-current opacity-5`; `&[stroke="#ccc"] { @apply stroke-none }` (3.11 default stroke) |
| `.recharts-surface, .recharts-surface *` | `outline: none` | `@apply outline-none` |
| `.recharts-surface:focus-visible, .recharts-surface [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` | same (outline, not the box-shadow ring: SVG content cannot paint box-shadow and the offset gap must stay transparent over the card) |

All rules live in `@layer components`, nested under `.bar-chart`. Unlike `.area-chart`, Pro's bar chart CSS has **no**
`.recharts-tooltip-wrapper { z-index: 10 }` and no active-dot rule.

Colours used by the demos: `var(--accent)` (single series) and the chart palette `--chart-1..5`
(`oklch(from var(--accent) calc(l -/+ 0.24|0.12) c h)`, `--chart-3 = var(--accent)`), defined on `:root` by the
chart-tooltip stylesheet. Light: `--muted` lab(47.87 1.41 -4.99) (grid/ticks), dark: lab(65.65 1.53 -5.42);
cursor uses `currentColor` = `--foreground` inherited from the body (near-black in light, white in dark).

Tooltip card (`.chart-tooltip`, owned by chart-tooltip): min-width 140px, padding 8px 12px, radius `--radius`
(8px), 1px `--separator` border, `--overlay` background, overlay shadow, gap 6px; rows 16px high; Custom Tooltip demo
card 140 x 133px.

## 5. Behaviour / timings (Recharts defaults; nothing Pro-specific observed)

- Bars animate in on mount: Recharts `Bar` defaults `animationBegin 0`, `animationDuration 400`, `animationEasing
  "ease"`, `isAnimationActive "auto"` (bars grow from the baseline; rAF-driven).
- Tooltip: shown on pointer move over a category; wrapper `transition: transform 400ms`, offset 10px from the pointer,
  flips left/bottom near the edges (`recharts-tooltip-wrapper-right|left|top|bottom`). Cursor is the default Recharts
  rectangle over the whole category band (y + 0.5, height - 1 in horizontal layout), themed to 5% currentColor.
- Keyboard (accessibility layer): the svg is focusable (Tab). Focusing it activates the first category (tooltip +
  cursor shown); ArrowLeft/ArrowRight move the active category (Tab, then ArrowRight x2, shows the 3rd category on
  both heroui.pro and the remake); focus-visible draws a 2px `--focus` outline with a 2px offset around the svg.
  Vertical layout cursor: x = left + 0.5, width = plot width - 1, height = band.
- No hover state on bars (`activeBar` false; bars stay in `.recharts-inactive-bar`).

## 6. Demos (one story each, own data/texts)

All demos are an OSS `Card` (`w-full max-w-[480px] rounded-2xl`, padding 16, gap 12) with `Card.Header` + `Card.Content`
unless noted. Series legends are plain markup (`flex items-center gap-3`, items `gap-1.5`, swatch `size-3 rounded-full`,
label `text-muted text-xs`).

| Demo | Chart props | Notes |
| --- | --- | --- |
| `bar-chart-default` | `height 200`; `Grid vertical={false}`; `XAxis dataKey tickMargin 8`; `YAxis width 30`; `Bar fill var(--accent) radius 8 barSize 16` | Header row: title (`text-base`) + description (`text-muted text-xs`) + success soft sm `Chip` with a 12px up-chevron svg. Tooltip `valueFormatter` -> "45 units". |
| `bar-chart-grouped` | `height 220`; `YAxis width 40 tickFormatter $Nk (toFixed(0))`; 3 bars `barSize 10 radius [4,4,0,0]` `--chart-3/2/1`, `name` set | Header row: title + 3-item legend. Tooltip `valueFormatter` -> "$5,800". Bars 4px apart (Recharts barGap). |
| `bar-chart-stacked` | `height 220`; `YAxis width 40 $Nk`; 3 bars `barSize 32 stackId`, bottom `--chart-1` / middle `--chart-3` square, top `--chart-4 radius [4,4,0,0]` | Legend top-down order (chart-4, chart-3, chart-1). Tooltip `indicator="line"`, $ formatter. |
| `bar-chart-horizontal` | `layout="vertical" height 220`; `XAxis type number tickMargin 4`; `YAxis type category dataKey width 60 tickMargin 4`; `Bar --chart-3 barSize 14 radius [0,7,7,0] name` | Card `max-w-[420px]`; header column (title + description); no grid; default tooltip. |
| `bar-chart-horizontal-stacked` | `layout="vertical" height 280 margin 0`; `XAxis hide type number`; `YAxis type category width 36 tickMargin 8`; 3 bars `barSize 18 stackId`: `--chart-1 radius [4,0,0,4]`, `--chart-2`, `--chart-4 radius [0,4,4,0]` | Header: title + `mt-1 text-2xl font-bold` figure with `text-muted text-sm font-normal` unit; content `flex flex-col gap-3` with a centred legend below (`gap-4`, swatch `size-2.5`). Tooltip `indicator="line"` + unit formatter. |
| `bar-chart-comparison` | `height 200`; `YAxis width 30`; 2 bars `barSize 12 radius [4,4,0,0]` `--chart-3` / `--chart-1` | Header row: title/description + 2-item legend; default tooltip. |
| `bar-chart-kpi-with-bar-chart` | `height 160`; `Grid vertical={false}`; `XAxis tickMargin 8`; no YAxis; `Bar --accent radius 8 barSize 16` | Inside Pro `KPI` (`w-full max-w-[400px]`), `KPI.Content className="flex flex-col gap-3"`, value `text-3xl`, `TrendChip variant="tertiary"` + `TrendChip.Suffix`. |
| `bar-chart-custom-tooltip` | same chart as grouped | Header column (title only). Tooltip `content` is a custom renderer: chart-tooltip card (header, items) + a total row `mt-1 flex items-center justify-between border-t border-separator pt-1.5` (`text-muted text-xs font-medium` / `text-foreground text-xs font-semibold`). |

Measured parity (story vs demo): card 480x288 (default/grouped/stacked/comparison), 420x308 (horizontal), 480x412
(horizontal stacked), KPI 400x276 with 368x208 content; identical clip rects, bar x/width/height offsets, tick label
coordinates, grid line positions, tooltip DOM and 140x133 custom tooltip.

## 7. Dependencies

- `recharts` (optional peer, 3.x): `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`,
  `Tooltip`.
- `../chart-tooltip` (`ChartTooltip.Content`, chart palette tokens).
- Stories only: OSS `Card`, `Chip` (`@heroui/react`), Pro `KPI`, `TrendChip`, `ChartTooltip` parts.

## 8. Deviations / notes

- Parts are pure re-exports of Recharts components, so they keep Recharts' own `displayName`s (no `HeroUI.BarChart.*`;
  renaming would mutate the shared Recharts components).
- Additive root props (`barCategoryGap`, `barGap`, `barSize`, `maxBarSize`, `stackOffset`, `reverseStackOrder`,
  `syncId`, `syncMethod`) - Pro documents only data/height/width/layout/margin/children.
- heroui.pro ships an older Recharts 3.x than the repo's 3.11.1, so some Recharts-internal DOM details differ while the
  geometry is identical: Pro bar paths carry `name="undefined"` and no `radius` attribute, 3.11 writes `radius="8"`,
  omits `name`, formats `d` with spaces, and adds an inline `style="fill: #666"` on tick text (covered by the
  `!important` fill).
- Cursor outline: older Recharts renders the bar cursor with `stroke="none"`, 3.11 with `stroke="#ccc"` (a faint 5%
  outline around the band). `bar-chart.css` resets only that default (`.recharts-tooltip-cursor[stroke="#ccc"]
  { stroke: none }`), so a stroke passed via the Tooltip `cursor` prop still applies.
- Grouped bars with a fixed `barSize`: 3.11 centres the group with `Math.round((bandSize - sum) / 2)`, the older
  release truncates, so when the half-gap has a fraction >= .5 every bar sits 1px further right than on heroui.pro
  (Comparison demo at 327px: x 37/53 vs 36/52; Grouped is unaffected). Not fixable without patching Recharts.
- Keyboard matches heroui.pro: Tab focuses the svg and activates the first category (tooltip + cursor shown),
  ArrowRight x2 lands on the third category.
- The last X tick is pulled inwards using a text width Recharts measures in a hidden span on `body`. If the web font
  has not loaded at first render, Recharts caches the fallback width (seen once in Storybook: "2000" at x 293.2 vs
  291.5); after the font loads, positions are identical to heroui.pro. This depends on how the app loads fonts, not
  on the component.

## Appendix: raw CSSOM (heroui.pro, reference only)

```
@layer components {
  .bar-chart { width: 100%; }
  .bar-chart .recharts-cartesian-axis-tick-value { font-size: 10px; fill: var(--muted) !important; }
  .bar-chart .recharts-cartesian-axis-line, .bar-chart .recharts-cartesian-axis-tick-line { stroke: none !important; }
  .bar-chart .recharts-cartesian-grid line { stroke: var(--muted); stroke-opacity: 0.15; }
  .bar-chart .recharts-tooltip-cursor { fill: currentcolor; opacity: 0.05; }
  .bar-chart .recharts-surface, .bar-chart .recharts-surface * { outline: none; }
  .bar-chart .recharts-surface:focus-visible, .bar-chart .recharts-surface [tabindex="0"]:focus-visible {
    outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width);
  }
}
```
