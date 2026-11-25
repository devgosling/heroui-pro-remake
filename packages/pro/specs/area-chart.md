# Area Chart (`area-chart`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/area-chart, the six public demo pages (light +
dark) and their rendered DOM, CSSOM, computed styles and runtime behaviour, observed on 2026-11-24. The chart-tooltip
docs page was read for the tooltip part API. No paywalled source, JS bundle, source map or code panel was read.

## 1. Purpose

A thin HeroUI wrapper around Recharts' `AreaChart`: a `.area-chart` root containing a `ResponsiveContainer` + Recharts
`AreaChart`, with HeroUI token theming for everything Recharts draws on its own (axis ticks, grid, tooltip cursor,
active dot, keyboard focus ring). Series (`Area`), axes, grid and tooltip are the Recharts components themselves,
re-exported as compound parts. Gradient fills, stacking and sparklines are all composed by the consumer (demos).

Subpath-only import because it needs the optional `recharts` peer: `import {AreaChart} from "@heroui/pro/area-chart"`
(Pro: `@heroui-pro/react/area-chart`). Not exported from the package root.

## 2. Anatomy

```tsx
<AreaChart data={data}>
  <AreaChart.Grid />      {/* optional */}
  <AreaChart.XAxis />     {/* optional */}
  <AreaChart.YAxis />     {/* optional */}
  <AreaChart.Area dataKey="value" />
  <AreaChart.Tooltip content={<AreaChart.TooltipContent />} /> {/* optional */}
</AreaChart>
```

| Part | Renders | `data-slot` / class | Notes |
| --- | --- | --- | --- |
| `AreaChart` (root) | `<div>` > Recharts `ResponsiveContainer` > `AreaChart` | `data-slot="area-chart"`, `.area-chart` + className | rest props on the div |
| `AreaChart.Area` | Recharts `Area` | Recharts classes (`.recharts-area`, `.recharts-area-area`, `.recharts-area-curve`) | re-export, not a wrapper |
| `AreaChart.XAxis` / `.YAxis` | Recharts `XAxis` / `YAxis` | `.recharts-cartesian-axis ...` | re-export |
| `AreaChart.Grid` | Recharts `CartesianGrid` | `.recharts-cartesian-grid` | re-export |
| `AreaChart.Tooltip` | Recharts `Tooltip` | `.recharts-tooltip-wrapper` (+ `-right/-left/-top/-bottom`) | re-export |
| `AreaChart.TooltipContent` | `ChartTooltip.Content` | `.chart-tooltip` ... | see chart-tooltip |

Observed root markup (default demo, 327px wide):

```html
<div class="area-chart" data-slot="area-chart">
  <div class="recharts-responsive-container" style="width:100%;height:200px;min-width:0">
    <div style="width:0;overflow-x:visible">
      <div width="327" height="200" class="recharts-wrapper" style="position: relative; cursor: default; width: 327px; height: 200px;">
        <div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility: hidden; pointer-events: none; position: absolute; top: 0px; left: 0px;"></div>
        <svg role="application" tabindex="0" class="recharts-surface" width="327" height="200" viewBox="0 0 327 200" ...>
          <title></title><desc></desc>
          <g class="recharts-zIndex-layer_-100"><g class="recharts-cartesian-grid"><g class="recharts-cartesian-grid-horizontal"><line stroke="#ccc" .../>...</g></g></g>
          <defs><clipPath id="recharts1-clip"><rect x="40" y="8" height="162" width="279"/></clipPath></defs>
          <defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--chart-3)" stop-opacity="0.2"/><stop offset="100%" stop-color="var(--chart-3)" stop-opacity="0.02"/>
          </linearGradient></defs>
          <g class="recharts-zIndex-layer_100"><g class="recharts-layer recharts-area">...
            <path name="Revenue" stroke-width="2" fill="url(#revenue-fill)" fill-opacity="0.6" stroke="none" class="recharts-curve recharts-area-area" d="..."/>
            <path name="Revenue" stroke-width="2" fill="none" fill-opacity="0.6" stroke="var(--chart-3)" class="recharts-curve recharts-area-curve" d="..."/>
          </g></g>
          <g class="recharts-zIndex-layer_500"> x/y axis lines + tick lines (stroke="#666") </g>
          <g class="recharts-zIndex-layer_2000"> tick labels: <text class="recharts-text recharts-cartesian-axis-tick-value" fill="#666">...</text> </g>
        </svg>
      </div>
    </div>
  </div>
</div>
```

Structural notes:

- The root renders no wrapper besides `.area-chart`; demos that need one add their own (`<div>`, `.min-w-0`).
- `ResponsiveContainer` gets `width`, `height` and `minWidth={0}` (inline `min-width:0`).
- The `<defs>` gradient is a direct child passed by the consumer (Recharts 3 renders arbitrary SVG children).
- Recharts writes its default colours as presentation attributes (`stroke="#ccc"` grid, `stroke="#666"` axes, `fill="#666"`
  ticks, active dot `stroke="#fff"`); the CSS overrides them.
- The same `.area-chart` root (and CSS) is used by `KPI.Chart` (sparkline inside KPI cards).

## 3. API (from docs)

### `AreaChart`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string>[]` | - | Chart data. |
| `height` | `number` | `300` | Chart height in px. |
| `width` | `number \| \`${number}%\`` | `"100%"` | Chart width. |
| `margin` | `{top?, right?, bottom?, left?}` | `{top: 8, right: 8, bottom: 0, left: 0}` | Recharts margin. |
| `children` | `ReactNode` | - | Recharts children. |

Also supports all native `div` attributes.

`AreaChart.Area`, `.XAxis`, `.YAxis`, `.Grid` (CartesianGrid), `.Tooltip`: re-exported Recharts components (full Recharts
API). `AreaChart.TooltipContent`: the `ChartTooltip.Content` renderer (props `active`, `payload`, `label`, `hideHeader`,
`indicator: "dot" | "line"`, `labelFormatter`, `valueFormatter`).

## 4. Styling (CSS classes / tokens)

Docs "Recharts Theming" list, all scoped under `.area-chart`:

| Selector | Observed computed value (light) | Token |
| --- | --- | --- |
| `.area-chart` | `width: 100%` | - |
| `.recharts-cartesian-axis-tick-value` | `font-size: 10px; fill: var(--muted) !important` | `--muted` |
| `.recharts-cartesian-axis-line`, `.recharts-cartesian-axis-tick-line` | `stroke: none !important` | - |
| `.recharts-cartesian-grid line` | `stroke: var(--muted); stroke-opacity: .15` | `--muted` |
| `.recharts-tooltip-cursor` | `stroke: var(--muted); stroke-dasharray: 4 4; stroke-width: 1px` | `--muted` |
| `.recharts-tooltip-wrapper` | `z-index: 10` | - |
| `.recharts-active-dot circle` | `stroke: var(--surface); stroke-width: 2px` (fill = series colour) | `--surface` |
| `.recharts-surface`, `.recharts-surface *` | `outline: none` | - |
| `.recharts-surface:focus-visible`, `.recharts-surface [tabindex="0"]:focus-visible` | `outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width)` (2px) | `--focus`, `--ring-offset-width` |

Dark mode (`?theme=dark`): no dedicated rules; tick/grid/cursor resolve to the dark `--muted`, active dot stroke to the dark
`--surface` (same as the card), focus ring `--focus`. Verified computed values follow the tokens.

Chart palette (declared globally by Pro's theme, used by demos): `--chart-1..5` = accent shifted in OKLCH lightness
(`-0.24, -0.12, 0, +0.12, +0.24`), `--chart-3` = `--accent`. In this repo it lives in `css/components/chart-tooltip.css`.
Demos also use `--color-success` / `--color-danger`.

Tick label typography inherits the page font (Inter on heroui.pro, theme `--font-sans` here).

## 5. Behaviour / timings (all Recharts defaults, nothing custom)

- Area entrance: Recharts clip-path reveal left to right, 1500 ms, `ease` (sampled: 7.8px@123ms, 124px@456ms,
  232px@857ms, 279px@1524ms of 279px). `isAnimationActive: "auto"` already disables it under
  `prefers-reduced-motion`.
- Hover: dashed cursor at the hovered category, active dot r=4 with 2px surface stroke, tooltip wrapper moved with
  `transform: translate(x+10, y+10)` and `transition: transform 400ms` (inline, Recharts); flips left/up near edges.
- Keyboard: the `<svg role="application" tabindex="0">` is a tab stop; ArrowLeft/ArrowRight move the active index and
  show the tooltip (Recharts accessibility layer); focus ring only on `:focus-visible`.
- No data-* state attributes on the root.

## 6. Demos (6) and observed structure

Demo page frame (`[data-demo-page]`): `flex min-h-screen items-center justify-center`, padding 24px below 640px and
40px from `sm` (640px) up (`p-6 sm:p-10`); the stories' `DemoFrame` reproduces it. Measurements below at viewport 407px
unless noted.

1. `area-chart-default` - OSS `Card` (`w-full max-w-[520px] rounded-2xl`), `Card.Header` > `Card.Title.text-base`, `Card.Content` >
   AreaChart `height={200}`, `Grid vertical={false}`, `XAxis dataKey tickMargin={8}`, `YAxis width={40}` with `$Nk`
   formatter, gradient (`--chart-3`, 0.2 -> 0.02), `Area type="monotone" strokeWidth={2} name`, tooltip
   `TooltipContent` with currency `valueFormatter`. Card 359x268, plot clip `x40 y8 w279 h162`.
2. `area-chart-multi-area` - header `flex-row items-center justify-between` with an inline legend (`size-3 rounded-full`
   swatch + `text-muted text-xs` label, `gap-1.5`, items `gap-3`); content `flex flex-col gap-4` with a stat
   (`text-foreground text-lg font-semibold` + `text-muted text-xs`); chart 200px, `YAxis width={30}` (`0`, `4k`...),
   two overlapping areas `--chart-3`, `--chart-1`, gradients 0.2 -> 0.02, default tooltip (dot indicator).
3. `area-chart-stacked` - card `max-w-[600px]`, 4-item legend, chart 240px, `YAxis width={30}`, four areas with one
   `stackId` (`--chart-4`, `--chart-3`, `--chart-2`, `--chart-1`), gradients 0.4 -> 0.1, tooltip `indicator="line"`.
4. `area-chart-sparkline` - `flex w-full items-center gap-6` row of three `flex min-w-0 flex-1 flex-col gap-1` cells:
   `text-muted text-xs` label + `<div>` > AreaChart `height={48}`, `margin={{top: 2, right: 0, bottom: 0, left: 0}}`,
   no axes/grid/tooltip, `strokeWidth={1.5}`, colours `--color-success`, `--color-danger`, `--chart-3`.
5. `area-chart-kpi-with-area-chart` - `grid w-full max-w-[900px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3` of
   Pro `KPI` cards; `KPI.Content.grid-cols-[1fr_1fr].items-end` with left `flex flex-col gap-1` (`KPI.Value.text-3xl` +
   `TrendChip size="sm" variant="tertiary"` with `TrendChip.Suffix`) and right `.min-w-0` > AreaChart `height={70}`,
   `margin={{top: 4, right: 0, bottom: 0, left: 0}}`, `strokeWidth={1.5}`.
6. `area-chart-custom-tooltip` - like multi-area without the stat; `AreaChart.Tooltip content={fn}` rendering
   `ChartTooltip indicator="line"` + Header + Items (`toLocaleString` values) + a footer row
   `mt-1 flex items-center justify-between border-t border-separator pt-1.5` (`text-muted text-xs font-medium` label,
   `text-foreground text-xs font-semibold` total). Tooltip 140x111.

## 7. Dependencies

- `recharts` 3 (optional peer, subpath-only export).
- `../chart-tooltip` (`ChartTooltipContent`; stories also use the `ChartTooltip` parts).
- Stories: OSS `Card`, Pro `KPI`, Pro `TrendChip`.

## 8. Implementation notes / deviations

- `AreaChart.Area/XAxis/YAxis/Grid/Tooltip` are the Recharts components themselves (no wrapper, no displayName mutation).
- `margin` is passed through like Recharts does: a side omitted from a custom margin is 0 (Recharts' own behaviour);
  the default object applies only when `margin` is not given.
- Extra (additive) prop `chartProps` forwards other Recharts `AreaChart` props (`stackOffset`, `syncId`, `layout`,
  `baseValue`, `accessibilityLayer`, `onClick`...), which the documented API has no way to set.
- `data` also accepts `null`/`undefined` values (Recharts gaps / `connectNulls`).
- CSS authored with `@apply` + theme utilities (`fill-muted!`, `stroke-muted`, `stroke-surface`, `outline-focus`), same
  selectors and computed values as Pro; adds `motion-reduce:transition-none!` on the tooltip wrapper (Recharts inline
  400 ms transform transition).

## Appendix A - Pro CSSOM (reference only, `layer(components)`)

```
.area-chart { width: 100%; }
.area-chart .recharts-cartesian-axis-tick-value { font-size: 10px; fill: var(--muted) !important; }
.area-chart .recharts-cartesian-axis-line, .area-chart .recharts-cartesian-axis-tick-line { stroke: none !important; }
.area-chart .recharts-cartesian-grid line { stroke: var(--muted); stroke-opacity: 0.15; }
.area-chart .recharts-tooltip-cursor { stroke: var(--muted); stroke-dasharray: 4, 4; stroke-width: 1px; }
.area-chart .recharts-tooltip-wrapper { z-index: 10; }
.area-chart .recharts-active-dot circle { stroke: var(--surface); stroke-width: 2px; }
.area-chart .recharts-surface, .area-chart .recharts-surface * { outline: none; }
.area-chart .recharts-surface:focus-visible, .area-chart .recharts-surface [tabindex="0"]:focus-visible { outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width); }
:root (theme layer) { --chart-1: oklch(from var(--accent) calc(l - .24) c h); ... --chart-3: var(--accent); ... --chart-5: oklch(from var(--accent) calc(l + .24) c h); }
```

## Appendix B - story vs demo comparison (viewport 407px, light)

| Story | Element | Pro | Remake |
| --- | --- | --- | --- |
| Default | card / content / plot clip | 24,67,359x268 / 40,119,327x200 / 40,8,279,162 | identical |
| Default | Y ticks | `$0k..$12k` @ x=32, y=170..8 | identical |
| MultiArea | card / content / chart | 359x328 / 40,89,327x260 / 40,149 | identical |
| Stacked | card / chart / clip | 359x332 / 327x240 / 30,8,289,202 | identical |
| Sparkline | cells / charts | 103.7x68 / 104x48, clip 0,2,104,46 | identical |
| KPI | card / chart | 138 tall / clip 0,4,w,66 | identical (with the same viewport and no page scrollbar, also the grid width) |
| CustomTooltip | tooltip | 140x111, translate(171.4, 8) | identical |
| all | tick font / grid / cursor / dot / focus ring | 10px muted / muted .15 / 4 4 dashed / surface 2px / 2px focus + 2px offset | identical |

## Appendix C - independent review (2026-11-24)

Compared every demo with its story in light and dark at 407 / 700 / 1024 / 1280px (element rects + computed styles of the
whole subtree), hover (tooltip, cursor, active dot), keyboard (Tab focus ring, ArrowRight stepping), reduced motion and the
1500 ms area entrance (clip width sampled per frame). Theme overrides (`--radius`, `--accent`, `--muted`, `--font-sans`)
propagate to ticks, grid, cursor, curve, gradient, active dot and the tooltip the same way they do for the OSS `Card`.

Fixed in review:

- `DemoFrame` padding is `p-6 sm:p-10` (Pro demo pages switch to 40px at 640px); at >= 640px the sparkline row and the
  KPI grid were 32px wider than in Pro.
- KPI story trend-chip suffixes shortened to Pro-like widths: the longer texts wrapped the chip to two lines in the
  2-column layout (cards 148px instead of 138px) and kept the 3-column cards on one line (138px instead of Pro's 148px).

Remaining (not component differences):

- Recharts patch version: Pro's DOM has no `g.recharts-shape` wrapper around the area paths, no empty
  `recharts-zIndex-layer_1900` group and no `fill="#ccc"` on the cursor path (zero-area path, invisible). The repo ships
  recharts 3.11.
- The last X tick label is shifted by Recharts' `preserveEnd` text measurement, which runs before Inter has loaded; Pro has
  a metric-matched `Inter Fallback` face, Storybook does not, so the "Dec" label sits ~1px further right (318.6 vs 317.6).
- KPI story first card: Pro's 30px `$228,451` is 130px wide (left grid column 130 / chart 122) while the local Inter build
  renders the comparable value at 124px (126 / 126 columns); font build, not layout.
