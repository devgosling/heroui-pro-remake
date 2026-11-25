# Widget (`widget`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/widget plus the rendered DOM, CSSOM,
computed styles and element metrics of the eight public demo pages (light + dark), observed on 2026-11-25. No
paywalled example source was read.

## 1. Purpose

A dashboard container: a `surface-secondary` outer shell holding a header row (title, optional description, optional
legend or actions) and an elevated `bg-surface` content card that wraps charts, tables, KPIs or any custom layout.
Optional footer row below the content.

Widget is pure layout (no state, no keyboard behaviour, no animation) and imports no chart library, so it is
**root-exportable** (`import {Widget} from "@heroui/pro"`). The charts used in the stories come from the subpath-only
chart components.

## 2. Anatomy

```tsx
<Widget>
  <Widget.Header>
    <Widget.Title />
    <Widget.Description />            {/* optional */}
    <Widget.Legend>                    {/* optional */}
      <Widget.LegendItem color="var(--chart-1)">Organic</Widget.LegendItem>
    </Widget.Legend>
  </Widget.Header>
  <Widget.Content>{/* chart, table, KPIGroup, ... */}</Widget.Content>
  <Widget.Footer />                    {/* optional */}
</Widget>
```

| Part | Element | `data-slot` | BEM class |
| --- | --- | --- | --- |
| `Widget` (Root) | `<div>` (or `render`) | `widget` | `.widget` |
| `Widget.Header` | `<div>` | `widget-header` | `.widget__header` |
| `Widget.Title` | `<span>` | `widget-title` | `.widget__title` |
| `Widget.Description` | `<span>` | `widget-description` | `.widget__description` |
| `Widget.Content` | `<div>` | `widget-content` | `.widget__content` |
| `Widget.Footer` | `<div>` | `widget-footer` | `.widget__footer` |
| `Widget.Legend` | `<div>` | `widget-legend` | `.widget__legend` |
| `Widget.LegendItem` | `<div>` | `widget-legend-item` | `.widget__legend-item` |
| LegendItem dot | `<span style="background-color:<color>">` | `widget-legend-item-dot` | `.widget__legend-item-dot` |
| LegendItem label | `<span>` | `widget-legend-item-label` | `.widget__legend-item-label` |

Observed markup (default demo):

```html
<div class="widget w-full max-w-[520px]" data-slot="widget">
  <div class="widget__header" data-slot="widget-header">
    <span class="widget__title" data-slot="widget-title">...</span>
    <div class="widget__legend" data-slot="widget-legend">
      <div class="widget__legend-item" data-slot="widget-legend-item">
        <span class="widget__legend-item-dot" data-slot="widget-legend-item-dot" style="background-color:var(--chart-4)"></span>
        <span class="widget__legend-item-label" data-slot="widget-legend-item-label">...</span>
      </div>
      ...
    </div>
  </div>
  <div class="widget__content" data-slot="widget-content">
    <div class="line-chart" data-slot="line-chart">...</div>
  </div>
</div>
```

No modifiers, no `data-*` state attributes, no role/ARIA on any part. The remake adds `aria-hidden="true"` on the
decorative (empty) legend dot only.

## 3. API (docs API tables)

| Part | Props |
| --- | --- |
| `Widget` | `className`, `children`, `render` ((props) => ReactElement, polymorphic) + all native `div` attributes |
| `Widget.Header` | `className`, `children` |
| `Widget.Title` | `className`, `children` |
| `Widget.Description` | `className`, `children` |
| `Widget.Content` | `className` (docs: use `p-0` for edge-to-edge tables), `children` |
| `Widget.Footer` | `className`, `children` |
| `Widget.Legend` | `className`, `children` |
| `Widget.LegendItem` | `color` (required CSS colour, e.g. `var(--chart-3)`), `className`, `children` |

No defaults. Remake: every part also accepts its native element attributes and `ref` (React 19 ref-as-prop); the
root's `render` comes from the OSS `dom.div` helper (`DOMRenderProps`), same as OSS `Card`.

## 4. Styling (CSSOM, `@layer components`)

| Class | Observed | Remake (`@apply`) |
| --- | --- | --- |
| `.widget` | `display:flex; flex-direction:column; overflow:hidden; border-radius:calc(var(--radius)*2); background: var(--surface-secondary)` | `flex flex-col overflow-hidden rounded-2xl bg-surface-secondary` |
| `.widget__header` | `display:flex; justify-content:space-between; align-items:center; gap:12px; padding-inline:16px; min-height:32px; margin-top:2px` | `mt-0.5 flex min-h-8 items-center justify-between gap-3 px-4` |
| `.widget__title` | `text-sm` (14/20), `font-semibold`, `color: var(--foreground)` | `text-sm font-semibold text-foreground` |
| `.widget__description` | `text-xs` (12/16), `color: var(--muted)` | `text-xs text-muted` |
| `.widget__content` | `flex:1 1 0%; overflow:hidden; margin: 0 6px 6px; padding:16px; border-radius: calc(var(--radius)*1.5); background: var(--surface)`; `box-shadow: 0 0 0 1px black/3%, 0 1px 2px black/4%` (literal, same in dark) | `mx-1.5 mb-1.5 flex-1 overflow-hidden rounded-xl bg-surface p-4` + literal shadow |
| `.widget__content:first-child` | `margin-top: 6px` (no header) | `mt-1.5` |
| `.widget__footer` | `display:flex; align-items:center; gap:12px; padding: 12px 16px 16px` | `flex items-center gap-3 px-4 pt-3 pb-4` |
| `.widget__legend` | `display:flex; align-items:center; gap:12px` | `flex items-center gap-3` |
| `.widget__legend-item` | `display:flex; align-items:center; gap:6px` | `flex items-center gap-1.5` |
| `.widget__legend-item-dot` | `10x10`, `border-radius: 9999px`, `flex-shrink:0` | `size-2.5 shrink-0 rounded-full` |
| `.widget__legend-item-label` | `text-xs`, `color: var(--muted)` | `text-xs text-muted` |

Resulting rhythm: header row 32px + 2px top margin; content inset 6px left/right/bottom; e.g. default demo at 399px
width: widget 399x292, header 399x32, content 387x252, chart 355x220.

Tokens: light `--surface-secondary` lab(94.47) shell, `--surface` white content, title `--foreground`, labels
`--muted`. Dark: shell lab(13.78), content lab(8.34), same shadow literal. No dark-specific rules exist; everything
switches through the theme tokens. `--radius` scales both radii (shell 2x, content 1.5x).

No hover / focus / disabled states, no transitions, no keyframes.

(`.aui-card[data-variant="widget"]`, `.aui-widget-*` rules in the same CSSOM belong to an unrelated AI-chat widget on
the site and are ignored.)

## 5. Demos (one story each)

| Pro demo | Structure | Story |
| --- | --- | --- |
| `widget-default` | `max-w-[520px]`; Header: Title + Legend (chart-4, chart-1); LineChart h=220, YAxis w=40 `k` formatter, XAxis keyed by ISO date (`2025-09-01`) with an `MM/DD` tickFormatter (30 days, 8 ticks at 447px) `tickMargin 8`, horizontal grid, 2 `type="monotone"` lines w=2, no dots; ChartTooltip header = full ISO date, values `toLocaleString()` (viewer locale) | `Default` |
| `widget-dashboard-grid` | `grid max-w-[960px] grid-cols-1 gap-3 sm:grid-cols-2`; (1) `sm:col-span-2` Overview: Content `grid grid-cols-2 gap-4 sm:grid-cols-4`, 4 stats (label `text-xs text-muted`, value `text-xl font-semibold` + TrendChip sm soft); (2) Revenue: Header Title + TrendChip `tertiary`; AreaChart h=180, gradient chart-3 0.2 -> 0.02, YAxis w=40 `$Nk`; (3) Traffic: Legend (chart-3, chart-1), LineChart h=180 6 months, 2 monotone lines, YAxis w=30; (4) `sm:col-span-2` Monthly Sales: Title + Description, BarChart h=180, fill `--accent`, `barSize 20` (fixed 20px; Recharts falls back to 90% of the band below 20px, e.g. 14.25px at a 320px viewport), radius 10 (pill), YAxis w=30. Tooltips on all three charts: area without `name` (label = raw data key) and raw values; line raw values; bar value + unit suffix. | `DashboardGrid` |
| `widget-with-kpis` | `max-w-[900px]`; Header Title + Description; Content: `KPIGroup` (`bg-transparent shadow-none`) with 3 KPIs: `KPI.Content grid-cols-[1fr_1fr] items-end` > (`flex flex-col gap-1` > `KPI.Value text-3xl` + plain `TrendChip variant="tertiary"` (no `kpi__trend` class, so not `KPI.Trend`) with `TrendChip.Suffix`) + inline `KPI.Chart` h=60, strokeWidth 1.5, 12 points, colour accent / danger / success | `WithKPIs` |
| `widget-with-line-chart` | `max-w-[520px]`; Title + Legend (chart-3, chart-1); LineChart h=200, 12 months, 2 monotone lines, YAxis w=30, values `toLocaleString()` | `WithLineChart` |
| `widget-with-bar-chart` | `max-w-[520px]`; Title + Legend (single chart-3); BarChart h=220, 30 days, YAxis w=40, XAxis ISO date + `MM/DD` tickFormatter, bars `radius [2,2,0,0]` fill chart-3 (8px bars at 355px), tooltip header = ISO date, values `toLocaleString()` | `WithBarChart` |
| `widget-with-pie-chart` | `max-w-[360px]`; Header Title only; Content `flex flex-col items-center gap-4`: PieChart h=200, `outerRadius 80`, cells chart-4..chart-1, tooltip; `Widget.Legend className="flex-wrap justify-center"` inside the content | `WithPieChart` |
| `widget-with-table` | `max-w-[640px]`; Title + Description; `Widget.Content className="p-0"` > OSS `Table variant="secondary"`, `Table.Header className="sr-only"`, 4 columns, last row `[&_td]:border-b-0` | `WithTable` |
| `widget-usage-summary` | `max-w-[520px]`; custom header `div.grid.grid-cols-[5fr_2fr].items-center.px-5.py-2` with two `text-xs font-medium text-muted` labels instead of `Widget.Header`; `Widget.Content className="flex flex-col gap-0 p-0"` > secondary Table (sr-only header, columns `bg-transparent`), rows: `ProgressCircle size="sm"` (first `default`, rest `accent`) + `text-sm font-medium` label, amount `text-sm font-semibold` | `UsageSummary` |

Demo frame: `[data-demo-page]` = flex, centred, `padding: 24px` (stories use the same `DemoFrame`).

## 6. Dependencies

- OSS `dom` / `DOMRenderProps` (`@heroui/react`) for the polymorphic root.
- Stories only: Pro `LineChart`, `AreaChart`, `BarChart`, `PieChart` (recharts, subpath), `KPI`, `KPIGroup`,
  `TrendChip`; OSS `Table`, `ProgressCircle`.

## 7. Verification (remake vs Pro, same viewport widths)

- Default @447px: widget 399x292, header 399x32, content 387x252, chart 355x220, grid x 40..347 - identical.
- DashboardGrid @1100px: grid 960x648, widgets 960x120 / 474x252 / 474x252 / 960x252, stat cells 217x48 - identical.
- WithKPIs @1100px: widget 900x220, content 888x180, KPIGroup 856x148, cards 284.7x148, separators 1x116 - identical.
- WithLineChart @1100px: 520x272, chart 476x200, grid 30..468 - identical.
- WithBarChart @447px: 399x292, bars 8px wide with 2px top radius - identical.
- WithPieChart @447px: 360x304, chart 316x200, radius 80, legend row at the same y - identical.
- WithTable / UsageSummary @1100px: 640x219 / 520x217, rows 45/45/45/44, custom header grid 342.8/137.1 - identical
  (column widths differ only through the different cell texts).
- Dark mode: shell/content/title/label colours resolve through the same tokens; content shadow literal unchanged.

## 8. Deviations

- `aria-hidden="true"` on the empty legend dot (Pro renders no ARIA there).
- Tick spacing in charts depends on label text width (Recharts auto interval). Recharts measures labels once and caches
  the widths; Storybook loads Inter asynchronously (no metric-matched fallback like Pro's `Inter Fallback`), so the
  stories' meta `loaders` wait for `document.fonts.load()` before rendering. Without it the axes measured Segoe UI
  widths and showed 10 instead of 8 date ticks, with the last label clipped.
- DashboardGrid bars sit 1px further right than Pro (offset 27 vs 26 inside a 73px band): Recharts version rounding,
  not the Widget.
- `WithFooter` story is extra (no Pro demo): covers `Widget.Footer` and the root `render` prop (`<section>`).
