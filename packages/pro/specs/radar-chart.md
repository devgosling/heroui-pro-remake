# Radar Chart (`radar-chart`) - implementation spec

Source of truth: the public docs page https://heroui.pro/docs/react/components/radar-chart and the five public demo
pages (rendered DOM, CSSOM, computed styles, runtime behaviour), light and dark, observed on 2026-11-24. No paywalled
source was read. Note: the shared in-app browser had no free tab slot during this session, so the public pages were
inspected with a local headless Edge (Playwright) instead: same DOM / CSSOM / computed-style / pointer / keyboard
inspection, nothing else fetched.

## 1. Purpose

A themed wrapper around a Recharts `RadarChart` for comparing multivariate data (one polygon per series, optional
fill, vertex dots, radius scale and tooltip). All theming is CSS that targets the internal Recharts class names, so
the parts are plain Recharts re-exports and follow the Recharts API.

Subpath-only import because it needs the optional `recharts` peer: `import {RadarChart} from "@heroui/pro/radar-chart"`
(Pro: `@heroui-pro/react/radar-chart`). Not exported from the package root.

## 2. Anatomy

```tsx
<RadarChart data={data}>
  <RadarChart.Grid />                                         {/* optional */}
  <RadarChart.AngleAxis dataKey="category" />                 {/* optional */}
  <RadarChart.RadiusAxis />                                   {/* optional */}
  <RadarChart.Radar dataKey="value" />
  <RadarChart.Tooltip content={<RadarChart.TooltipContent />} /> {/* optional */}
</RadarChart>
```

| Part | What it is | DOM / class |
| --- | --- | --- |
| `RadarChart` (root) | `<div>` + Recharts `ResponsiveContainer` + Recharts `RadarChart` | `div.radar-chart[data-slot="radar-chart"]` > `div.recharts-responsive-container[style="width:100%;height:<h>px;min-width:0"]` > `div[style="width:0;overflow-x:visible"]` > `div.recharts-wrapper` > (`div.recharts-tooltip-wrapper` when a Tooltip exists) + `svg.recharts-surface[role="application"][tabindex="0"]` |
| `RadarChart.Radar` | Recharts `Radar` (re-export) | `g.recharts-radar > g.recharts-radar-polygon > path.recharts-polygon`, dots in `g.recharts-radar-dots > circle.recharts-dot.recharts-radar-dot` |
| `RadarChart.Grid` | Recharts `PolarGrid` (re-export) | `g.recharts-polar-grid > g.recharts-polar-grid-concentric > path.recharts-polar-grid-concentric-polygon` (x5) + `g.recharts-polar-grid-angle > line` |
| `RadarChart.AngleAxis` | Recharts `PolarAngleAxis` (re-export) | `g.recharts-polar-angle-axis` > `text.recharts-polar-angle-axis-tick-value` |
| `RadarChart.RadiusAxis` | Recharts `PolarRadiusAxis` (re-export) | `g.recharts-polar-radius-axis` > `line.recharts-polar-radius-axis-line` + `text.recharts-polar-radius-axis-tick-value` |
| `RadarChart.Tooltip` | Recharts `Tooltip` (re-export) | `div.recharts-tooltip-wrapper` (cursor `path.recharts-tooltip-cursor` is hidden) |
| `RadarChart.TooltipContent` | Pro `ChartTooltip.Content` card | `.chart-tooltip` > `.chart-tooltip__header` + `.chart-tooltip__item` (`__indicator--dot`, `__label`, `__value`) |

The root `div` carries only `class="radar-chart"` and `data-slot="radar-chart"` (no other data attributes). It also
receives any native div attributes (className is merged, ref is forwarded).

Recharts chart defaults are untouched: `margin` 5 on all sides (clip rect `x=5 y=5`), `cx`/`cy` 50%, `outerRadius`
80% (e.g. 388x280 surface -> radius 108; 428x300 -> 116), `startAngle` 90 / `endAngle` -270, accessibility layer on.

## 3. API (docs tables)

### RadarChart

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string>[]` | - | category key + numeric series fields |
| `height` | `number` | `300` | px, passed to `ResponsiveContainer` |
| `width` | `number \| \`${number}%\`` | `"100%"` | passed to `ResponsiveContainer` |
| `children` | `ReactNode` | - | Recharts parts |
| ...div attributes | | | spread on the root `div` |

### Parts

`Radar`, `Grid` (PolarGrid), `AngleAxis` (PolarAngleAxis), `RadiusAxis` (PolarRadiusAxis), `Tooltip`: re-exported
Recharts components, Recharts API. `TooltipContent`: pre-built renderer for `Tooltip content`, props of
`ChartTooltip.Content` (`hideHeader`, `indicator`, `labelFormatter`, `valueFormatter`, ...).

## 4. Styling (CSS classes + tokens)

Docs "Recharts theming" list and CSSOM (layer `components`):

| Selector | Declarations | Token mapping |
| --- | --- | --- |
| `.radar-chart` | `width: 100%` | `w-full` |
| `.radar-chart .recharts-polar-angle-axis-tick-value` | `font-size: 11px; fill: var(--muted) !important` | `text-[11px] fill-muted!` |
| `.radar-chart .recharts-polar-radius-axis-tick-value` | `font-size: 10px; fill: var(--muted) !important` | `text-[10px] fill-muted!` |
| `.radar-chart .recharts-polar-grid-concentric-polygon, ...-circle, .recharts-polar-grid-angle line` | `stroke: var(--muted); stroke-opacity: 0.2` | `stroke-muted` + `stroke-opacity: .2` |
| `.radar-chart .recharts-tooltip-cursor` | `display: none` | `hidden` |
| `.radar-chart .recharts-surface, .recharts-surface *` | `outline: none` | `outline-none` |
| `.radar-chart .recharts-surface:focus-visible, .recharts-surface [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` | `outline-2 outline-solid outline-focus outline-offset-(--ring-offset-width)` |

`!important` is needed because Recharts writes a literal tick `fill` (`#808080` angle, `#ccc` radius; Recharts 3.11
writes it as an inline style, still beaten by `!important`).

Not themed by Pro (Recharts literals kept on purpose, also in dark mode): radius axis line `stroke="#ccc"`, active dot
`stroke="#fff" stroke-width=2 r=4`. The angle axis outline / tick lines have no stroke (invisible).

Series colours come from the shared chart palette `--chart-1..5` (defined in `chart-tooltip.css`: shades of `--accent`,
`--chart-3` = accent). Demos use `fill`/`stroke="var(--chart-N)"`.

Computed (light): tick text 11px Inter, fill `--muted`; grid stroke `--muted` @ 0.2 / 1px; polygon stroke-width 2.
Dark: same rules, tokens switch (muted lighter); nothing radar-specific changes.

## 5. Behaviour / timings

- Mount animation: Recharts default, polygon grows from the centre over ~1500 ms (`ease`, measured progress 0.27 /
  0.63 / 0.84 / 0.95 at 267 / 535 / 801 / 1068 ms); the vertex dots start at the centre and travel with the polygon
  vertices (same timing). With `prefers-reduced-motion: reduce` the chart renders its final state at once and the
  tooltip has no transform transition (Pro demo and story identical).
- Hover: tooltip follows the hovered category (Recharts default `transition: transform 400ms`), header = category,
  one row per series (dot indicator in the series colour, name, value). Active dot per series: `r=4`, fill = series
  colour, `stroke #fff`, `stroke-width 2`. The radial cursor line is rendered but hidden by CSS.
- Keyboard: the SVG surface is focusable (`tabindex=0`, `role=application`); ArrowRight/ArrowLeft move the active
  category and the tooltip; focus-visible shows a 2px `--focus` outline with `--ring-offset-width` offset.
- No other states / data attributes.

## 6. Demos -> stories (`Pro/Charts/RadarChart`)

All demos: OSS `Card` (`rounded-2xl`, header `Card.Title.text-base`, content `flex flex-col items-center`), Grid +
AngleAxis + Tooltip with `RadarChart.TooltipContent`, radar `strokeWidth={2}`.

| Pro demo | Card | Chart | Story |
| --- | --- | --- | --- |
| `radar-chart-default` (Usage) | `w-[420px]` | `height={280}`, 1 series `--chart-3`, `fillOpacity .15`, dots `r 3 strokeWidth 0` (dots inherit 0.15 opacity) | `Default` (args: data, height, width) |
| `radar-chart-dots-only` | `w-[420px]` | `height={280}`, `fill="none"`, dots `fill --chart-3 r 4 strokeWidth 0` | `DotsOnly` |
| `radar-chart-with-radius-axis` | `w-[460px]`, header `flex-row items-center justify-between` + legend | default height 300, `RadiusAxis angle={90}` (ticks 0..100), 2 series `--chart-4` / `--chart-1`, `fillOpacity .15`, dots r 3 | `WithRadiusAxis` |
| `radar-chart-multi-series` | `w-[480px]` + legend | 300, 3 series `--chart-4` / `--chart-3` / `--chart-1`, `fillOpacity .1`, no dots, 6 months | `MultiSeries` |
| `radar-chart-comparison` | `w-[460px]` + legend | 300, 2 series `--chart-3` / `--chart-1`, `fillOpacity .15`, dots r 3 | `Comparison` |

Header legend markup (demo content, not part of the component): `div.flex.items-center.gap-3` >
`div.flex.items-center.gap-1.5` > `span.size-3.rounded-full[style=background-color:var(--chart-N)]` +
`span.text-muted.text-xs`.

Verified: card / chart / surface sizes identical (420x348, 460x368, 480x368; surfaces 388x280, 428x300, 448x300),
same grid geometry (5 concentric polygons, radius 108 / 116), same computed tick / grid / polygon styles, same tooltip
DOM and metrics (140 px wide card, 8px radius, 8/12 padding), same active dots, animation and keyboard behaviour, light
and dark.

## 7. Dependencies

`recharts` (optional peer; subpath-only export), Pro `ChartTooltip` (content card + `--chart-*` palette),
OSS `Card` (stories only).

## 8. Deviations / notes

- Recharts version: the demos run an older Recharts 3 in which radar dots inherit the polygon `fillOpacity`; Recharts
  3.11 (installed here) paints dots opaque. The stories pass `fillOpacity: 0.15` in the dot props to keep the demo
  look; users get whatever their Recharts version renders (the parts are plain re-exports, like Pro).
- Recharts 3.11 differences without visual impact: tick fill written as inline style instead of an attribute, an extra
  empty `recharts-zIndex-layer_1900` group, grid angle lines get `fill="none"` and an explicit `stroke-width="1"`, the
  hidden tooltip cursor gets `fill="#ccc"`.
- Recharts 3.11 tooltip differences (library internals, not themable): the keyboard-driven tooltip is positioned next
  to the active point instead of the demo's fixed column near the top edge; after the pointer leaves, Recharts 3.11
  keeps the wrapper's last `transform` (the demo's older Recharts clears it), so on the next hover the card slides from
  its last position instead of flying in from the chart's top-left corner. The first hover is identical.
- Pointer hit-testing (no tooltip at the centre or outside the outer radius, wrapper `-left/-right/-bottom` classes and
  transforms) and the tooltip card metrics were measured identical.
- Re-exported parts are the Recharts components themselves (no HeroUI displayName), exactly as documented.

## Appendix: observed CSSOM (radar-chart rules, layer `components`)

```
.radar-chart { width: 100%; }
.radar-chart .recharts-polar-angle-axis-tick-value { font-size: 11px; fill: var(--muted) !important; }
.radar-chart .recharts-polar-radius-axis-tick-value { font-size: 10px; fill: var(--muted) !important; }
.radar-chart .recharts-polar-grid-concentric-polygon, .radar-chart .recharts-polar-grid-concentric-circle,
.radar-chart .recharts-polar-grid-angle line { stroke: var(--muted); stroke-opacity: 0.2; }
.radar-chart .recharts-tooltip-cursor { display: none; }
.radar-chart .recharts-surface, .radar-chart .recharts-surface * { outline: none; }
.radar-chart .recharts-surface:focus-visible, .radar-chart .recharts-surface [tabindex="0"]:focus-visible {
  outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width); }
```
