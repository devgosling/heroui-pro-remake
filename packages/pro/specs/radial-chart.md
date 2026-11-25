# Radial Chart (`radial-chart`) - implementation spec

Source of truth: the public docs page https://heroui.pro/docs/react/components/radial-chart (plus the chart-tooltip docs
for the tooltip contract), and the rendered DOM, CSSOM, computed styles and observed behaviour of the five public demo
pages (light + dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

Concentric rings / gauges / progress rings built on Recharts `RadialBarChart`. Each data entry becomes one ring. The
component is a thin, themed wrapper: the root renders `ResponsiveContainer` + `RadialBarChart` inside a
`.radial-chart` div, and the parts are re-exported Recharts components. Centre labels, legends and cards in the demos
are plain markup composed around it.

Subpath-only import because it needs the optional `recharts` peer:
`import {RadialChart} from "@heroui/pro/radial-chart"` (not exported from the package root).

## 2. Anatomy

```tsx
<RadialChart data={data}>
  <RadialChart.AngleAxis />                       {/* optional: numeric domain turns rings into gauges */}
  <RadialChart.Bar dataKey="value">
    <RadialChart.Cell />                          {/* optional: per-ring fill */}
  </RadialChart.Bar>
  <RadialChart.Tooltip content={<RadialChart.TooltipContent />} /> {/* optional */}
</RadialChart>
```

| Part | Renders | `data-slot` | Class |
| --- | --- | --- | --- |
| `RadialChart` (root) | `<div>` > Recharts wrapper | `radial-chart` | `.radial-chart` + user className |
| `RadialChart.Bar` | Recharts `RadialBar` | - | Recharts classes |
| `RadialChart.Cell` | Recharts `Cell` | - | - |
| `RadialChart.AngleAxis` | Recharts `PolarAngleAxis` | - | `.recharts-polar-angle-axis` |
| `RadialChart.Tooltip` | Recharts `Tooltip` | - | `.recharts-tooltip-wrapper` |
| `RadialChart.TooltipContent` | Pro `ChartTooltip` card | `chart-tooltip` (+ item/indicator/label/value) | `.chart-tooltip*` |

### Observed markup (default demo, 200 x 200, three rings, tooltip)

```html
<div class="radial-chart" data-slot="radial-chart">
  <div width="200" height="200" class="recharts-wrapper" style="position:relative;cursor:default;width:200px;height:200px">
    <div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility:hidden;pointer-events:none;position:absolute;top:0;left:0"></div>
    <svg cx="50%" cy="50%" role="application" tabindex="0" class="recharts-surface" width="200" height="200" viewBox="0 0 200 200">
      <title></title><desc></desc>
      <g class="recharts-zIndex-layer_-50">            <!-- background tracks -->
        <g class="recharts-layer recharts-shape">
          <path fill="#eee" name="Calories" class="recharts-sector recharts-radial-bar-background-sector" d="..."/>
        </g> ...
      </g>
      <defs><clipPath id="recharts1-clip"><rect x="5" y="5" height="190" width="190"/></clipPath></defs>
      <g class="recharts-zIndex-layer_300">
        <g class="recharts-layer recharts-area">
          <g class="recharts-layer recharts-radial-bar-background"></g>
          <g class="recharts-layer recharts-radial-bar-sectors">
            <g class="recharts-layer recharts-shape">
              <path fill="var(--chart-4)" name="Calories" class="recharts-sector recharts-radial-bar-sector" d="..."/>
            </g> ...
          </g>
        </g>
      </g>
      <g class="recharts-zIndex-layer_500">           <!-- only with AngleAxis: invisible polygon + tick lines -->
        <g class="recharts-layer recharts-polar-angle-axis angleAxis">...</g>
      </g>
    </svg>
  </div>
</div>
<!-- sibling, in the demo markup (not part of the component): -->
<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">...</div>
```

Structural notes:

- With numeric `width` + `height` Recharts' `ResponsiveContainer` renders no `.recharts-responsive-container` div (it
  provides the fixed size through context), which is exactly what the demos show. With `width="100%"` (default) it
  renders the size-detector div.
- `cx="50%" cy="50%"` on the `<svg>` come from Recharts' chart defaults (not passed by Pro).
- The Pro bundle's Recharts adds a literal `undefined` class to sectors and has no `style="outline:none"` on z-index
  layers: version artefacts, not reproduced.
- Centre labels are absolutely positioned HTML siblings (`pointer-events-none absolute inset-0`) inside a `relative`
  wrapper; this is why the tooltip wrapper needs `z-index: 10`.

## 3. API

### RadialChart (root)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string>[]` | - | Each entry = one ring (inner ring first). |
| `height` | `number` | `300` | px |
| `width` | `number \| \`${number}%\`` | `"100%"` | px or percentage |
| `barSize` | `number` | `10` | ring thickness |
| `innerRadius` | `number \| string` | `"30%"` | |
| `outerRadius` | `number \| string` | `"80%"` | |
| `startAngle` | `number` | `90` | 12 o'clock |
| `endAngle` | `number` | `-270` | full clockwise circle |
| `children` | `ReactNode` | - | Recharts children |

Plus all native `div` attributes (and `ref`) on the root div.

### Re-exports

- `RadialChart.Bar` = Recharts `RadialBar`
- `RadialChart.Cell` = Recharts `Cell`
- `RadialChart.AngleAxis` = Recharts `PolarAngleAxis`
- `RadialChart.Tooltip` = Recharts `Tooltip`
- `RadialChart.TooltipContent` = ChartTooltip content renderer (same props as `ChartTooltip.Content`: `hideHeader`,
  `indicator`, `labelFormatter`, `valueFormatter`; `active`/`payload`/`label` injected by Recharts).

Observed tooltip contract (all demos): no header row; the item label is the ring's data-entry `name` (e.g.
"Exercise"), not the bar's `dataKey`; the indicator colour is the ring fill (`var(--chart-2)`); the value is raw
unless a `valueFormatter` is passed (with-legend demo shows "28 GB").
Recharts itself names radial-bar entries after `dataKey` ("value") and passes the ring index as label, so the remake's
`RadialChart.TooltipContent` maps `payload[i].name <- payload[i].payload.name` and defaults `hideHeader` to `true`
unless a `labelFormatter` is given.

## 4. Styling / tokens

Root and Recharts theming (`css/components/radial-chart.css`):

| Selector | Rule | Token |
| --- | --- | --- |
| `.radial-chart` | `width: 100%` | - |
| `.radial-chart .recharts-tooltip-cursor` | `display: none` | - |
| `.radial-chart .recharts-tooltip-wrapper` | `z-index: 10` | - |
| `.radial-chart .recharts-radial-bar-background-sector` | `fill: var(--separator)` (overrides `fill="#eee"`) | `--separator` |
| `.radial-chart .recharts-surface, .recharts-surface *` | `outline: none` | - |
| `.radial-chart .recharts-surface:focus-visible, ... [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` (authored as `outline-2 outline-offset-(--ring-offset-width) outline-focus outline-solid`) | `--focus`, `--ring-offset-width` |

Ring colours come from the demo props: `var(--chart-2..4)` and `var(--color-danger)`. The chart palette is
`--chart-1..5 = oklch(from var(--accent) calc(l -0.24 / -0.12 / 0 / +0.12 / +0.24) c h)` declared on `:root`
(already declared by `chart-tooltip.css` in this package; not redeclared here). Light computed values:
chart-4 `oklch(0.740 0.195 253.8)`, chart-3 = accent, chart-2 `oklch(0.500 0.195 253.8)`. Dark: identical (accent is
shared), separator switches to the dark token.

Tooltip card (ChartTooltip, observed): `min-width 140px`, `padding 8px 12px`, `radius 8px`, `gap 6px`,
`1px var(--separator)` border, `bg var(--overlay)`.

Demo typography (Tailwind utilities, story-level): centre value `text-sm/600` (default), `text-xl/700` (gauge,
with-legend), `text-3xl/700` (progress ring), `text-lg/700` (gauge grid); caption `text-[10px]` / `text-xs` muted.

## 5. Geometry per demo (observed)

Recharts margin is the default 5px, so `maxRadius = (size - 10) / 2`.

| Demo | Size | start / end | inner / outer | barSize | cornerRadius | Rings (px) | AngleAxis |
| --- | --- | --- | --- | --- | --- | --- | --- |
| default | 200 | 90 / -270 | 40% / 100% | 10 | 5 | 42-52, 61-71, 80-90 | none (domain = data max) |
| gauge | 200 | 225 / -45 | 70% / 90% | 10 | 5 | 70.5-80.5 | `type="number"`, domain `[0, max]`, `tick={false}`, radius 85.5 |
| progress-ring | 200 | 90 / -270 | 86% / 100% | 12 | 6 | 81.7-93.7 | domain `[0, goal]` (raw value 7452 of 10000), `tick={false}` |
| gauge-grid | 120 | 225 / -45 | 70% / 90% | 8 | 4 | 39.5-47.5 | domain `[0, max]` per card |
| with-legend | 180 | 90 / -270 | 40% / 100% | 10 | 5 | 37-47, 54-64, 71-81 | none |

All bars use `background` (track) and per-ring fills (`Cell` or `fill`). A full-circle ring (value = domain max) is
drawn without rounded caps (Recharts behaviour).

Data model per demo (from tooltip values, tick angles and arc sweeps): the ring always carries the raw value and the
angle-axis domain carries the maximum. Gauge: value 780, domain `[0, 1358]`, the centre shows the maximum ("1,358")
and the tooltip the raw value ("780"). Progress ring: value 7452, domain `[0, 10000]`, centre shows the percentage and
"7,452 / 10,000", tooltip value goes through a `valueFormatter` (`toLocaleString`, "7,452"). Gauge grid: e.g. value
750, domain `[0, 1000]`, centre "75%", tooltip "750" (one card uses a non-round max, ticks every 32.1 deg). With
legend: tooltip `valueFormatter` -> "18 GB".

Card layouts: default `w-[380px]` card, content `flex items-center gap-4` (text list `flex-1 flex-col gap-2 self-start`
+ chart `relative shrink-0`); gauge `w-[280px]`, content `flex-col items-center`; progress ring `w-[300px]`, content
`flex-col items-center gap-3`; gauge grid `grid w-[640px] grid-cols-2 gap-3 lg:grid-cols-4`, header `pb-0`, title
`text-xs font-medium text-muted`; with-legend `w-[400px]`, header title + `text-xs text-muted` description, content
`flex items-center gap-6`, legend rows `flex items-center gap-3` with a `size-3 rounded-full` swatch.
Measured: gauge card 280 x 268 (content 248 x 200), progress-ring card 300 x 268, gauge-grid cards 188 tall,
with-legend card 376 tall (header 44, content 288).

## 6. Behaviour / timings

- Hover a ring: Recharts item tooltip (no cursor), wrapper `transition: transform 400ms`, `z-index: 10` above the
  centre overlay.
- Keyboard (Recharts accessibility layer): the `<svg>` is focusable (`tabindex="0"`, `role="application"`), shows the
  HeroUI focus ring on `:focus-visible`; ArrowLeft/ArrowRight move the tooltip between rings. Same in the remake.
- Hovering the track (background sector) of a ring shows that ring's tooltip too; the centre and the area outside
  the rings show nothing. Cursor stays `default`.
- Mount animation: Recharts RadialBar defaults (sweep from the start angle, 1500 ms, `ease`, begin 0; `isAnimationActive
  = "auto"` respects reduced motion). Sampled per rAF frame on the progress-ring demo: Pro 1485 ms / 90 frames, remake
  1434 ms / 80 frames (same curve: fast start, long ease-out); with `prefers-reduced-motion: reduce` both render the
  final arc immediately (single frame).
- Keyboard: Tab focuses the surface (focus ring 2px `--focus`, offset 2px) and shows the first ring's tooltip;
  ArrowRight / ArrowLeft step through the rings (clamped at both ends), Enter toggles the tooltip, ArrowUp/Down do
  nothing. Same sequence in the remake.
- Dark mode: only token changes (`--separator`, `--surface`, text tokens). All resolved tokens (chart-1..5, accent,
  separator, surface, overlay, muted, focus, danger) are identical to Pro in light and dark.

Inspection note (review pass): the shared in-app browser had no free tab slot, so the public demo pages and our
stories were compared with a local headless Edge (Playwright): DOM, computed styles, CSSOM, pointer/keyboard
behaviour, rAF-sampled animation, screenshots. Nothing else was fetched.

## 7. Demos -> stories

| Pro demo | Story export | Story id |
| --- | --- | --- |
| radial-chart-default (Usage) | `Default` (args drive the root props) | `pro-charts-radialchart--default` |
| radial-chart-gauge | `Gauge` | `pro-charts-radialchart--gauge` |
| radial-chart-progress-ring | `ProgressRing` | `pro-charts-radialchart--progress-ring` |
| radial-chart-gauge-grid | `GaugeGrid` | `pro-charts-radialchart--gauge-grid` |
| radial-chart-with-legend | `WithLegend` | `pro-charts-radialchart--with-legend` |

Story content (titles, labels, data) is our own; structure, sizes and props mirror the demos.

## 8. Dependencies

- `recharts` (optional peer, >= 3) -> subpath-only export.
- `../chart-tooltip` (`ChartTooltipContent`) for the tooltip card and the `--chart-1..5` palette.
- OSS `Card` only in stories.

## 9. Deviations

- Ring offset rounding: the Recharts in this repo (3.11) centres a fixed-size bar in its band with `Math.round`, the
  Pro bundle's Recharts truncates. Same props therefore draw rings up to 1px further out (default 43-53 instead of
  42-52; progress ring 82.7-94.7 instead of 81.7-93.7). Purely a Recharts-version artefact.
  Not compensated on purpose: Recharts is a peer dependency, so Pro's own component draws exactly these radii on
  Recharts 3.11 too; shifting the radii would make the remake differ from Pro on the same Recharts.
- Tooltip keyboard position: Recharts versions place the keyboard-driven tooltip at different coordinates (Pro's
  bundle: bottom placement moving per ring, y 57/76/95 in the default demo; Recharts 3.11: top placement at a fixed
  y 151). Content and ring order are identical.
- `RadialChart.TooltipContent` defaults `hideHeader` to `true` (unless `labelFormatter` is passed) and labels items with
  the entry `name`; this reproduces what the demos show, the mechanism inside Pro is unknown.

## Appendix: CSSOM (reference only, layer `components`)

```
.radial-chart { width: 100%; }
.radial-chart .recharts-tooltip-cursor { display: none; }
.radial-chart .recharts-tooltip-wrapper { z-index: 10; }
.radial-chart .recharts-radial-bar-background-sector { fill: var(--separator); }
.radial-chart .recharts-surface, .radial-chart .recharts-surface * { outline: none; }
.radial-chart .recharts-surface:focus-visible, .radial-chart .recharts-surface [tabindex="0"]:focus-visible {
  outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width); }
:root { --chart-1: oklch(from var(--accent) calc(l - .24) c h); --chart-2: oklch(from var(--accent) calc(l - .12) c h);
        --chart-3: var(--accent); --chart-4: oklch(from var(--accent) calc(l + .12) c h);
        --chart-5: oklch(from var(--accent) calc(l + .24) c h) }   /* @theme */
```
