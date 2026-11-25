# Composed Chart (`composed-chart`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/composed-chart and the rendered DOM, CSSOM,
computed styles and observed behaviour of its five public demo pages (light + dark), observed on 2026-11-24. No
paywalled source ("Unlock the code"), JS bundle, source map, prompt/MCP endpoint or Storybook code panel was read.

## 1. Purpose

A cartesian chart that mixes bar, line and area series (e.g. revenue bars + an orders line on a second axis) for
multi-metric dashboards. The component is a thin themed shell around Recharts: the root renders a
`ResponsiveContainer` + Recharts `ComposedChart` inside a `.composed-chart` div whose CSS restyles the Recharts
internals with HeroUI tokens; every other part is the Recharts component itself, re-exported.

Subpath-only import because it needs the optional `recharts` peer:
`import {ComposedChart} from "@heroui/pro/composed-chart"` (Pro: `@heroui-pro/react/composed-chart`). It is not
exported from the package root, so apps that do not use it never need `recharts`.

## 2. Anatomy

```tsx
<ComposedChart data={data}>
  <ComposedChart.Grid />                                              {/* optional */}
  <ComposedChart.XAxis />                                             {/* optional */}
  <ComposedChart.YAxis />                                             {/* optional */}
  <ComposedChart.Bar dataKey="revenue" />
  <ComposedChart.Line dataKey="target" />
  <ComposedChart.Area dataKey="forecast" />
  <ComposedChart.Tooltip content={<ComposedChart.TooltipContent />} /> {/* optional */}
</ComposedChart>
```

| Part | Renders | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| `ComposedChart` (Root) | `<div>` > `ResponsiveContainer` > Recharts `ComposedChart` | `composed-chart` | `.composed-chart` | Recharts `ResponsiveContainer`, `ComposedChart` |
| `ComposedChart.Bar` | Recharts `Bar` | - | Recharts classes (`.recharts-bar`, `.recharts-rectangle`) | re-export |
| `ComposedChart.Line` | Recharts `Line` | - | `.recharts-line`, `.recharts-line-curve`, `.recharts-line-dots` | re-export |
| `ComposedChart.Area` | Recharts `Area` | - | `.recharts-area`, `.recharts-area-area`, `.recharts-area-curve` | re-export |
| `ComposedChart.XAxis` | Recharts `XAxis` | - | `.recharts-xAxis`, `.recharts-cartesian-axis-*` | re-export |
| `ComposedChart.YAxis` | Recharts `YAxis` | - | `.recharts-yAxis`, `.recharts-cartesian-axis-*` | re-export |
| `ComposedChart.Grid` | Recharts `CartesianGrid` | - | `.recharts-cartesian-grid` | re-export |
| `ComposedChart.Tooltip` | Recharts `Tooltip` | - | `.recharts-tooltip-wrapper`, `.recharts-tooltip-cursor` | re-export |
| `ComposedChart.TooltipContent` | Pro `ChartTooltip.Content` | `chart-tooltip` (+ `-header`, `-item`, `-indicator`, `-label`, `-value`) | `.chart-tooltip*` | Pro ChartTooltip |

No OSS HeroUI component is part of the chart itself. The demos wrap it in an OSS `Card` (`card card--default`,
`Card.Header`, `Card.Title`, `Card.Content`) with a hand-made legend (`span.size-3.rounded-full` + `span.text-muted.text-xs`);
that chrome belongs to the demo, not to the component.

### Observed markup (default demo, 460px wide, height 260)

```html
<div class="composed-chart" data-slot="composed-chart">
  <div class="recharts-responsive-container" style="width:100%;height:260px;min-width:0">
    <div style="width:0;overflow-x:visible">
      <div class="recharts-wrapper" style="position:relative;cursor:default;width:460px;height:260px">
        <div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility:hidden;pointer-events:none;position:absolute;top:0;left:0"></div>
        <svg role="application" tabindex="0" class="recharts-surface" width="460" height="260" viewBox="0 0 460 260">
          <title></title><desc></desc>
          <g class="recharts-zIndex-layer_-100"><g class="recharts-cartesian-grid"><g class="recharts-cartesian-grid-horizontal">
            <line stroke="#ccc" fill="none" x1="40" y1="8" x2="412" y2="8"/> ... </g></g></g>
          <defs><clipPath id="recharts1-clip"><rect x="40" y="8" height="222" width="372"/></clipPath></defs>
          <g class="recharts-zIndex-layer_300"><g class="recharts-layer recharts-bar"> ... 
              <path fill="var(--chart-3)" name="Revenue" x="47" y="152.3" width="16" height="77.7" class="recharts-rectangle"
                    d="M47,156.3A 4,4,0,0,1,51,152.3L 59,152.3A 4,4,0,0,1,63,156.3L 63,230L 47,230Z"/> ...</g></g>
          <g class="recharts-zIndex-layer_400"><g class="recharts-layer recharts-line">
              <path name="Orders" stroke="var(--chart-1)" stroke-width="2" fill="none" class="recharts-curve recharts-line-curve" d="M55.5,158.96C..."/></g></g>
          <g class="recharts-zIndex-layer_500"> x axis, left y axis, right y axis (axis lines + tick lines, stroke="#666") </g>
          <g class="recharts-zIndex-layer_2000"> tick labels:
              <text ... class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="middle" fill="#666" x="55.5" y="244"><tspan dy="0.71em">Jan</tspan></text> ...</g>
        </svg>
      </div>
    </div>
  </div>
</div>
```

On hover / keyboard focus Recharts fills the tooltip wrapper (`transition: transform 400ms`, `translate(x, y)`), draws
`<path class="recharts-curve recharts-tooltip-cursor" stroke="#ccc" d="M179.5,8L179.5,230">` (a vertical line: the
ComposedChart cursor is a curve, not the BarChart rectangle) and an active dot per line/area series
(`<g class="recharts-active-dot"><circle r="4" fill="<series colour>" stroke-width="2" stroke="#fff">`).

## 3. API (from docs)

### `ComposedChart`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string>[]` | - | Chart data, one object per category with a field per series. |
| `height` | `number` | `300` | Chart height in px. |
| `width` | `number \| `${number}%`` | `"100%"` | Chart width in px or percent. |
| `margin` | `{top?, right?, bottom?, left?}` | `{top: 8, right: 8, bottom: 0, left: 0}` | Recharts margin around the plot area. |
| `children` | `ReactNode` | - | Recharts children (`Bar`, `Line`, `Area`, axes, grid, tooltip...). |

Also supports all native `<div>` attributes (spread on the `.composed-chart` root).

Remake additions (documented deviations): `ref` (React 19 prop, on the root div), `chartProps` (extra props for the
Recharts `ComposedChart`, e.g. `barGap`, `barCategoryGap`, `stackOffset`, `syncId`, `layout`, `accessibilityLayer`),
`null`/`undefined` allowed in data (gaps). Partial `margin` objects are merged with the default.

### Re-exported Recharts parts

`ComposedChart.Bar` (Recharts `Bar`), `.Line` (`Line`), `.Area` (`Area`), `.XAxis` (`XAxis`), `.YAxis` (`YAxis`),
`.Grid` (`CartesianGrid`), `.Tooltip` (`Tooltip`). They follow the Recharts API unchanged (no default props are
injected: the demos pass `tickMargin`, `width`, `barSize`, `radius`, ... themselves, see section 6).

### `ComposedChart.TooltipContent`

Pre-built tooltip renderer: `ChartTooltip.Content` (see `chart-tooltip` spec): `indicator` (`"dot"` | `"line"`),
`hideHeader`, `labelFormatter`, `valueFormatter`; Recharts injects `active`, `payload`, `label`.

## 4. Styling

Pro CSS (all in `@layer components`), reproduced with HeroUI utilities in `css/components/composed-chart.css`:

| Selector | Declarations | Tokens |
| --- | --- | --- |
| `.composed-chart` | `width: 100%` | |
| `.composed-chart .recharts-cartesian-axis-tick-value` | `font-size: 10px; fill: var(--muted) !important` (beats Recharts' `fill="#666"` attribute and the inline `style="fill:#666"` newer Recharts adds) | `--muted` |
| `.composed-chart .recharts-cartesian-axis-line, .composed-chart .recharts-cartesian-axis-tick-line` | `stroke: none !important` (axis + tick lines are rendered but hidden) | |
| `.composed-chart .recharts-cartesian-grid line` | `stroke: var(--muted); stroke-opacity: .15` | `--muted` |
| `.composed-chart .recharts-tooltip-cursor` | `stroke: var(--muted); stroke-dasharray: 4 4; stroke-width: 1px` | `--muted` |
| `.composed-chart .recharts-active-dot circle` | `stroke: var(--surface); stroke-width: 2px` | `--surface` |
| `.composed-chart .recharts-surface, .composed-chart .recharts-surface *` | `outline: none` | |
| `.composed-chart .recharts-surface:focus-visible, .composed-chart .recharts-surface [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` | `--focus`, `--ring-offset-width` |

Typography: tick labels inherit the page font (`--font-sans`, Inter on heroui.pro), 10px / 400, line-height 15px.

Series colours are props on each series; all demos use the accent-derived palette tokens (defined by the remake in
`chart-tooltip.css`, Pro defines them in its theme):

| Token | Value |
| --- | --- |
| `--chart-1` | `oklch(from var(--accent) calc(l - .24) c h)` |
| `--chart-2` | `oklch(from var(--accent) calc(l - .12) c h)` |
| `--chart-3` | `var(--accent)` |
| `--chart-4` | `oklch(from var(--accent) calc(l + .12) c h)` |
| `--chart-5` | `oklch(from var(--accent) calc(l + .24) c h)` |

Dark mode: nothing chart-specific; `--muted`, `--surface`, `--focus`, `--accent` switch with the theme (dark: tick fill
`lab(65.6 1.5 -5.4)`, active-dot stroke = card surface `lab(8.3 .6 -2.1)`, tooltip `--overlay` background).

Tooltip card (`.chart-tooltip`, from ChartTooltip): `min-width 140px; padding 8px 12px; gap 6px; radius var(--radius);
border 1px var(--separator); background var(--overlay); box-shadow var(--overlay-shadow); tabular-nums`; header 12px/500
muted, label 12px muted, value 12px/600 foreground; indicator dot 8x8 or line 4x12 (rounded-full).

## 5. Behaviour

- Responsive: `ResponsiveContainer` (ResizeObserver) sizes the SVG to the root width; height fixed (`height` prop).
- Keyboard: Recharts accessibility layer (default in Recharts 3): the `<svg>` is `role="application" tabindex="0"`;
  Tab focuses it (focus-visible outline 2px `--focus`, offset `--ring-offset-width`), Left/Right arrows move the
  active category and show the tooltip.
- Pointer: hovering a category shows the tooltip (position transition `transform 400ms`), the dashed muted cursor
  line and active dots (r=4, 2px surface stroke) for Line/Area series; bars have no active shape.
- Animations: Recharts defaults (Bar 400ms ease, Line/Area 1500ms ease; Line draws through `stroke-dasharray`).
  No CSS animation/transition of its own. Recharts animations follow `isAnimationActive` (Recharts 3 default `"auto"`
  respects `prefers-reduced-motion`).
- Multiple Y axes: series bind with `yAxisId`; when every YAxis has a custom id the grid (which follows yAxisId `0`)
  falls back to two lines (top and bottom of the plot), exactly as in the Pro demos.

## 6. Demos (all wrapped in `Card.w-full.rounded-2xl`, title `text-base`, page padding 24px)

| Demo | Card | Height | Series | Axes | Tooltip |
| --- | --- | --- | --- | --- | --- |
| `composed-chart-default` | no max-width; header stacked (title, legend below); legend dots `size-3` | 260 | Bar `fill var(--chart-3)`, `barSize 16`, `radius [4,4,0,0]`, left axis; Line `monotone`, `stroke var(--chart-1)`, `strokeWidth 2`, `dot false`, right axis | XAxis `tickMargin 8`; YAxis left `width 40` ($ k formatter), YAxis right `width 40`; Grid `vertical={false}` (2 lines) | dot indicator, `valueFormatter` currency for the bar series |
| `composed-chart-stacked-bar-with-line` | `max-w-[700px]`, header `flex-row items-center justify-between`, dots `size-2.5` | 300 | 4 Bars `stackId`, `barSize 20`, colours chart-4, chart-2, chart-3, chart-1, lower three `radius 0`, top `radius [4,4,0,0]`; Line `stroke var(--muted)`, `strokeWidth 1.5`, `dot false`, right axis | XAxis `tickMargin 8` (15 dates, every other label); YAxis left `width 35` (compact `7K`), right `width 40` 0-100 `%` | line indicator |
| `composed-chart-area-with-line` | `max-w-[560px]`, row header, dots `size-3` | 260 | Area `monotone`, `stroke var(--chart-3)`, `strokeWidth 2`, `fill url(#gradient)` (chart-3 0.2 -> 0.02); Line `stroke var(--chart-1)`, `strokeWidth 2`, `strokeDasharray "6 3"`, `dot false` | single YAxis `width 30` (`9k` formatter), point x scale (no bars) | dot indicator |
| `composed-chart-bar-with-area` | `max-w-[560px]`, row header, dots `size-3` | 260 | Area `stroke none`, `fill url(#gradient)` (chart-4 0.15 -> 0.02), right axis; Bar chart-3 `barSize 16` `radius [4,4,0,0]` left; Line (no `name`) chart-4 `strokeWidth 2` `dot false` right | YAxis left `width 35` (`25k`), right `width 35` (`2%`) | dot indicator; payload shows area (no colour, gradient fill), bar, and the unnamed line by dataKey |
| `composed-chart-multi-type` | `max-w-[620px]`, row header, dots `size-2.5` | 280 | Area chart-3 `strokeWidth 2` gradient 0.15 -> 0.02 left; Bar chart-4 `barSize 14` `radius [4,4,0,0]` left; Line chart-1 `strokeWidth 2` `dot {r: 3, fill: chart-1, strokeWidth: 0}` right | YAxis left `width 30` (`6k`), right `width 35` (`15%`) | line indicator |

Storybook (`Pro/Charts/ComposedChart`): `Default`, `StackedBarWithLine`, `AreaWithLine`, `BarWithArea`, `MultiType`,
same structure / props as the demos with our own titles and data.

## 7. Dependencies

- `recharts` >= 3 (optional peer): `ResponsiveContainer`, `ComposedChart`, `Bar`, `Line`, `Area`, `XAxis`, `YAxis`,
  `CartesianGrid`, `Tooltip`.
- Pro `ChartTooltip` (`../chart-tooltip`) for `TooltipContent` and the `--chart-1..5` palette tokens.
- Stories: OSS `Card` from `@heroui/react`.

## 8. Deviations / notes

- Additive API: `chartProps`, `ref`, nullable data values, partial margin merge.
- Recharts version differences visible in the DOM (not styling): newer Recharts adds `style="fill:#666"` to tick texts
  (neutralised by the `!important` muted fill, as in Pro) and `fill="#ccc"` on the cursor path; bar x offsets can
  round half a pixel differently (Pro 47 vs 48 for a 16px bar in a 31px band). Cause: Recharts 3.11.1
  (`combineAllBarPositions`) centres bars with `Math.round((bandSize - sum) / 2)`, while the Pro build truncates the
  offset. It shifts each bar by at most 1px and only when the fractional offset is >= .5; sizes, radii and colours are
  unaffected. It cannot be changed from the component without patching Recharts.
- Other Recharts 3.11 DOM-only differences: an extra empty `recharts-zIndex-layer_1900` group, `fill-opacity="1"` on
  custom line dots, and `stroke-dasharray` removed (instead of kept at full length) after the line draw animation.
- Review 2026-11-24 (independent check, light + dark, all five demos at the same viewport): card/header/content
  boxes, plot clip rects, grid lines, tick positions/anchors/font (10px/400, line-height 15px), bar sizes, radii and
  stacking, area/line attributes, gradients, dot props, tooltip DOM/size/placement/series order, cursor geometry and
  dash, active dots (r 4, 2px surface stroke), focus outline (2px `--focus`, 2px offset), Tab + arrow-key navigation,
  animation timings (bars 400ms, lines 1500ms, Recharts ease) and all resolved colours (`--chart-1..5`, `--muted`,
  `--surface`, `--overlay`, `--separator`) match. Pro demo pages add a 15px page scrollbar when the card is taller than
  the viewport, which is the only cause of the narrower Pro cards in those demos.
- Parts are bare Recharts components, so they carry Recharts' displayName rather than `HeroUI.ComposedChart.*` and no
  `data-slot` (same as Pro). Only the root has `data-slot="composed-chart"`.
- Focus uses an outline on the SVG (as Pro) instead of the `status-focused` ring utility: box-shadow rings do not
  render on SVG children such as Recharts' focusable `<g>` layers.

## Appendix A - Pro CSSOM (reference only)

```css
@layer components {
  .composed-chart { width: 100%; }
  .composed-chart .recharts-cartesian-axis-tick-value { font-size: 10px; fill: var(--muted) !important; }
  .composed-chart .recharts-cartesian-axis-line, .composed-chart .recharts-cartesian-axis-tick-line { stroke: none !important; }
  .composed-chart .recharts-cartesian-grid line { stroke: var(--muted); stroke-opacity: .15; }
  .composed-chart .recharts-tooltip-cursor { stroke: var(--muted); stroke-dasharray: 4, 4; stroke-width: 1px; }
  .composed-chart .recharts-active-dot circle { stroke: var(--surface); stroke-width: 2px; }
  .composed-chart .recharts-surface, .composed-chart .recharts-surface * { outline: none; }
  .composed-chart .recharts-surface:focus-visible,
  .composed-chart .recharts-surface [tabindex="0"]:focus-visible { outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width); }
}
```
