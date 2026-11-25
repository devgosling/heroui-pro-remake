# KPI (`kpi`) - implementation spec

Source of truth: public docs pages https://heroui.pro/docs/react/components/kpi (plus area-chart and chart-tooltip for
the tooltip contract), rendered DOM, CSSOM, computed styles and observed behaviour of the public demo pages (light +
dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

A metric card: title (+ optional status icon and action button), a large formatted value with a trend chip or progress
bar, an optional Recharts sparkline (bleeding to the card edges with faded left/right edges, optional hover tooltip),
and an optional separator + footer.

Subpath-only import because it needs the optional `recharts` peer: `import {KPI} from "@heroui/pro/kpi"` (not exported
from the package root).

## 2. Anatomy

```tsx
<KPI>
  <KPI.Header>
    <KPI.Icon status="success">{/* icon */}</KPI.Icon> {/* optional */}
    <KPI.Title>Revenue</KPI.Title>
  </KPI.Header>
  <KPI.Actions />                                     {/* optional */}
  <KPI.Content>
    <KPI.Value value={228451} />
    <KPI.Trend trend="up">+3.3%</KPI.Trend>          {/* optional */}
    <KPI.Progress value={38} />                       {/* optional */}
  </KPI.Content>
  <KPI.Chart data={data} />                           {/* optional */}
  <KPI.Separator />                                   {/* optional */}
  <KPI.Footer>{/* ... */}</KPI.Footer>               {/* optional */}
</KPI>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| Root `KPI` | `<div>` | `kpi` (overrides Card's `card`) | `.card .card--default .kpi` + user className | OSS `Card` (variant `default`) |
| `KPI.Header` | `<div>` | `kpi-header` | `.kpi__header` | plain DOM |
| `KPI.Icon` | `<div data-status="success\|warning\|danger">` | `kpi-icon` | `.kpi__icon` | plain DOM |
| `KPI.Title` | `<dt>` | `kpi-title` | `.kpi__title` | plain DOM |
| `KPI.Actions` | `<div>` wrapping `<button>` | `kpi-actions` (wrapper); button keeps `button` | `.kpi__actions`; button `.button .button--icon-only .button--sm .button--ghost` | OSS `Button` (`isIconOnly`, `size="sm"`, `variant="ghost"`) |
| `KPI.Content` | `<div>` | `kpi-content` | `.kpi__content` | plain DOM (CSS grid) |
| `KPI.Value` | `<dd>` | `kpi-value` | `.kpi__value` | NumberValue formatting, but renders NO `.number-value` markup (formatted text node directly in `<dd>`) |
| `KPI.Trend` | `<span>` | `chip` | TrendChip classes + `.kpi__trend` | Pro `TrendChip` |
| `KPI.Progress` | `<div>` wrapping progress bar | `kpi-progress` | `.kpi__progress` | OSS `ProgressBar` (+ Track + Fill) |
| `KPI.Chart` | `<div [data-has-tooltip="true"]>` | `kpi-chart` | `.kpi__chart` | Recharts `ResponsiveContainer` + `AreaChart` + `Area` inside a `.area-chart` root |
| `KPI.Separator` | `<div>` (OSS Separator) | not observed (suggest `kpi-separator`) | `.separator ... .kpi__separator` | OSS `Separator` |
| `KPI.Footer` | `<div>` | `kpi-footer` | `.kpi__footer` | plain DOM |

### Observed markup

Header + content with trend (kpi-default):

```html
<div class="card card--default kpi" data-slot="kpi">
  <div class="kpi__header" data-slot="kpi-header">
    <dt class="kpi__title" data-slot="kpi-title">Total Revenue</dt>
  </div>
  <div class="kpi__content" data-slot="kpi-content">
    <dd class="kpi__value" data-slot="kpi-value">$228,451</dd>
    <span data-slot="chip" data-trend="up" class="chip chip--success chip--sm chip--soft trend-chip trend-chip--sm kpi__trend">
      <svg ... class="trend-chip__indicator" data-slot="trend-chip-indicator"><path d="M12 19V5m-5 5 5-5 5 5"/></svg>
      <span class="chip__label" data-slot="chip-label"> <span class="trend-chip__value" data-slot="trend-chip-value">+33%</span> </span>
    </span>
  </div>
</div>
```

Icon + actions (kpi-with-actions):

```html
<div class="kpi__header" data-slot="kpi-header">
  <div class="kpi__icon" data-slot="kpi-icon" data-status="success"><svg width="16" height="16" viewBox="0 0 16 16">...</svg></div>
  <dt class="kpi__title" data-slot="kpi-title">Conversion Rate</dt>
</div>
<div class="kpi__actions" data-slot="kpi-actions">
  <button data-slot="button" class="button button--icon-only button--sm button--ghost" data-rac="" type="button"
          tabindex="0" data-react-aria-pressable="true" id="react-aria-...">
    <svg fill="currentColor" viewBox="0 0 16 16">
      <circle cx="8" cy="3" r="1.5"></circle><circle cx="8" cy="8" r="1.5"></circle><circle cx="8" cy="13" r="1.5"></circle>
    </svg>
  </button>
</div>
<div class="kpi__content" data-slot="kpi-content">...</div>
```

Progress (kpi-with-progress):

```html
<div class="kpi__progress" data-slot="kpi-progress">
  <div data-slot="progress-bar" class="progress-bar progress-bar--success progress-bar--sm" data-rac=""
       aria-label="Progress" id="react-aria-..." aria-valuenow="38" aria-valuemin="0" aria-valuemax="100"
       aria-valuetext="38%" role="progressbar">
    <div class="progress-bar__track" data-slot="progress-bar-track">
      <div class="progress-bar__fill" data-slot="progress-bar-fill" style="width:38%"></div>
    </div>
  </div>
</div>
```

Chart (kpi-with-chart-bottom, first card, 276px wide, default height 80):

```html
<div class="kpi__chart" data-slot="kpi-chart">
  <div class="area-chart" data-slot="area-chart">
    <div class="recharts-responsive-container" style="width:100%;height:80px;min-width:0">
      <div style="width:0;overflow-x:visible">
        <div width="276" height="80" class="recharts-wrapper" style="position: relative; cursor: default; width: 276px; height: 80px;">
          <svg role="application" tabindex="0" class="recharts-surface" width="276" height="80" viewBox="0 0 276 80"
               style="width: 100%; height: 100%; display: block;">
            <title></title><desc></desc>
            <g tabindex="-1" class="recharts-zIndex-layer_-100"></g> <g ... layer_-50></g>
            <defs><clipPath id="recharts1-clip"><rect x="0" y="4" height="76" width="276"></rect></clipPath></defs>
            <defs>
              <linearGradient id="kpi-chart-gradient-_R_3anpfiv5uivb_" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="var(--color-success)" stop-opacity="0.2"></stop>
                <stop offset="100%" stop-color="var(--color-success)" stop-opacity="0.02"></stop>
              </linearGradient>
            </defs>
            <g tabindex="-1" class="recharts-zIndex-layer_100">
              <g class="recharts-layer recharts-area"><g class="recharts-layer">
                <g class="recharts-layer" clip-path="url(#animationClipPath-recharts-area-_r_0_)"><g class="recharts-layer">
                  <path stroke-width="2" fill="url(#kpi-chart-gradient-...)" fill-opacity="0.6" stroke="none"
                        class="recharts-curve recharts-area-area" d="M0,51.5C8.364,49.125,...L276,80...Z"></path>
                  <path stroke-width="2" fill="none" fill-opacity="0.6" stroke="var(--color-success)"
                        class="recharts-curve recharts-area-curve" d="M0,51.5C8.364,49.125,..."></path>
                </g></g>
              </g></g>
            </g>
            <g class="recharts-zIndex-layer_200"></g> ... <g class="recharts-zIndex-layer_2000"></g>
          </svg>
        </div>
      </div>
    </div>
  </div>
</div>
```

With a `tooltip` prop the chart root gets `data-has-tooltip="true"` and Recharts adds
`<div tabindex="-1" class="recharts-tooltip-wrapper" style="visibility:hidden; pointer-events:none; position:absolute; top:0; left:0">`
before the `<svg>` (see section 5).

Structural notes:

- Root is OSS `Card` with `data-slot="kpi"` passed through props (Card spreads props after its own `data-slot`).
  It is a `<div>`; there is no `<dl>` around the `<dt>`/`<dd>` pairs (mirrors heroui.pro; HTML-validity caveat).
- `KPI.Actions` is a sibling of `KPI.Header` (between Header and Content in demos), absolutely positioned.
- `KPI.Value` text is the formatted number directly inside `<dd>` (no inner spans, no `tabular-nums`).
- `KPI.Trend` = `<TrendChip {...props} className={cx("kpi__trend", className)} />` (class appended last; demo passes
  extra `ml-auto` after it). The root `data-slot` stays `chip`.
- `KPI.Progress` = wrapper div + `ProgressBar` with `aria-label="Progress"`, `size="sm"`, `color={status}`,
  `value`, only Track + Fill children (no label/output).
- `KPI.Chart` gradient id = `kpi-chart-gradient-${React.useId()}`.

## 3. API (from docs)

### `KPI`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | KPI sub-components. |

Also supports all HeroUI `Card` props.

### `KPI.Header`, `KPI.Content`, `KPI.Footer`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Header: Icon, Title (and Actions if desired). Content: Value, Trend, Progress, etc. Footer: footer content. |

Also support all native `<div>` attributes.

### `KPI.Icon`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `'success' \| 'warning' \| 'danger'` | - | Background tint + icon colour. Rendered as `data-status`. |
| `children` | `ReactNode` | - | Icon element. |

Also supports all native `<div>` attributes.

### `KPI.Title`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Title text. |

Also supports all native `<dt>` attributes.

### `KPI.Value`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | - | Required. Number to format. |
| `children` | `(formatted: string) => ReactNode` | - | Optional render function receiving the formatted string. |

Also supports all `NumberValue` props except `children` (`style`, `currency`, `unit`, `notation`, `signDisplay`,
`minimumFractionDigits`, `maximumFractionDigits`, `locale`, `formatOptions`).

### `KPI.Trend`
Supports all `TrendChip` props (`trend`, `size`, `variant`, children...).

### `KPI.Progress`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | - | Required. 0-100. |
| `status` | `'success' \| 'warning' \| 'danger'` | `'success'` | Progress bar colour. |

Also supports all native `<div>` attributes (applied to the wrapper).

### `KPI.Actions`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Custom icon replacing the default three-dot icon. |

Also supports all HeroUI `Button` props (applied to the button; wrapper div is internal).

### `KPI.Chart`
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `Record<string, number \| string \| null>[]` | - | Required. `null` renders a gap. |
| `dataKey` | `string` | `'value'` | Y value key. |
| `color` | `string` | `'currentColor'` | Stroke colour (also gradient colour unless `fillColor`). |
| `connectNulls` | `boolean` | `false` | Bridge `null` gaps instead of breaking the path. |
| `fillColor` | `string` | - | Gradient colour; defaults to `color` (top stop at 20% opacity). |
| `height` | `number` | `80` | Chart height in px. |
| `strokeWidth` | `number` | `2` | Line width. |
| `tooltip` | `ReactNode` | - | Tooltip element rendered inside the chart, e.g. `<AreaChart.Tooltip content={...} />`. |
| `areaProps` | `Omit<AreaProps, 'dataKey'>` | - | Forwarded to the Recharts `Area`; overrides KPI.Chart's own props (e.g. `dot`, `activeDot`, `baseValue`). |

Also supports all native `<div>` attributes (on `.kpi__chart`).

### `KPI.Separator`
Supports all HeroUI `Separator` props.

## 4. Styling

All Pro rules live in `@layer components` (complete dump in Appendix A). Per class:

| Class | Declarations | Tokens |
| --- | --- | --- |
| `.kpi` | `display:flex; flex-direction:column; position:relative; padding: calc(var(--spacing)*4) /*16px*/; border-radius: calc(var(--radius)*2) /*16px*/` | `--spacing`, `--radius` |
| (inherited from `.card` / `.card--default`) | `gap: 12px` (gap-3), `box-shadow: var(--surface-shadow)`, `background-color: var(--surface)`, `overflow: visible` | `--surface`, `--surface-shadow` |
| `.kpi__header` | `display:flex; align-items:center; gap: 8px; margin-bottom: var(--spacing) /*4px*/` | |
| `.kpi__content` | `display:grid; grid-template-columns: 1fr auto; grid-template-rows: auto; align-items:center; column-gap: 8px; flex: 1 1 0%` | |
| `.kpi__icon` | `display:flex; align-items:center; justify-content:center; flex-shrink:0; width/height: 32px; border-radius: calc(var(--radius)*1) /*8px*/` | |
| `.kpi__icon svg` | `width/height: 16px` | |
| `.kpi__icon[data-status="success"]` | `background-color: var(--success)` then `@supports (color:color-mix(in lab, red, red)) { background-color: color-mix(in oklab, var(--success) 10%, transparent) }`; `color: var(--success)` | `--success` |
| `.kpi__icon[data-status="warning"]` | same with `--warning` | `--warning` |
| `.kpi__icon[data-status="danger"]` | same with `--danger` | `--danger` |
| `.kpi__actions` | `position:absolute; top: calc(var(--spacing)*4 - var(--spacing)*1.5) /*10px*/; inset-inline-end: 10px` | |
| `.kpi__title` | `font-size: var(--text-sm); line-height: var(--text-sm--line-height); font-weight: var(--font-weight-medium); color: var(--muted)` (14px/20px, 500) | `--muted` |
| `.kpi__value` | `font-size: var(--text-2xl); line-height: var(--text-2xl--line-height); font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-tight); color: var(--foreground)` (24px/32px, 600, -0.6px) | `--foreground` |
| `.kpi__trend` | `flex-shrink: 0` | |
| `.kpi__progress` | `grid-column: 1 / -1; margin-top: 4px` | |
| `.kpi__chart` | `--kpi-chart-fade: 10%; --kpi-chart-mask: linear-gradient(to right, transparent 0%, black var(--kpi-chart-fade), black calc(100% - var(--kpi-chart-fade)), transparent 100%); mask-image: var(--kpi-chart-mask); overflow: hidden` | `--kpi-chart-fade` |
| `.kpi__chart[data-has-tooltip]` | `overflow: visible; mask-image: none` | |
| `.kpi__chart[data-has-tooltip] .recharts-surface` | `mask-image: var(--kpi-chart-mask)` | |
| `.kpi > .kpi__chart` | `margin: 8px -16px -16px -16px; border-bottom-left-radius / border-bottom-right-radius: calc(var(--radius)*2)` (edge-to-edge at the card bottom) | |
| `.kpi > .kpi__chart:has(+ .kpi__separator, + .kpi__footer)` | `border-radius: 0; margin-bottom: 0` | |
| `.kpi__separator` | `margin-left/right: -16px; width: calc(100% + var(--spacing)*8)` | (OSS `.separator`: `h-px`, `bg-separator`, `rounded-sm`, `shrink-0`) |
| `.kpi__footer` | `margin-bottom: calc(var(--spacing) * -1) /*-4px*/` | |
| `.kpi__separator + .kpi__footer` | `margin-top: 0` | |

CSS custom properties:

| Property | Default | Where | Purpose |
| --- | --- | --- | --- |
| `--kpi-chart-fade` | `10%` | `.kpi__chart` | Width of the left/right transparent fade of the sparkline mask. |
| `--kpi-chart-mask` | gradient above | `.kpi__chart` | Internal; reused on `.recharts-surface` when a tooltip is present. |

Keyframes: none. Transitions: none of its own (OSS ProgressBar fill has `transition: width 300ms var(--ease-out)`;
Recharts tooltip wrapper has `transition: transform 400ms`).

Suggested Tailwind source (mirrors the compiled output; `bg-success/10` produces the solid fallback + `@supports`
pair seen in the CSSOM):

```css
.kpi { @apply relative flex flex-col rounded-2xl p-4; }
.kpi__header { @apply mb-1 flex items-center gap-2; }
.kpi__content { @apply grid flex-1 grid-cols-[1fr_auto] grid-rows-[auto] items-center gap-x-2; }
.kpi__icon { @apply flex size-8 shrink-0 items-center justify-center rounded-lg; }
.kpi__icon svg { @apply size-4; }
.kpi__icon[data-status="success"] { @apply bg-success/10 text-success; }
.kpi__icon[data-status="warning"] { @apply bg-warning/10 text-warning; }
.kpi__icon[data-status="danger"]  { @apply bg-danger/10 text-danger; }
.kpi__actions { @apply absolute top-[calc(--spacing(4)-(--spacing(1.5)))] end-[calc(--spacing(4)-(--spacing(1.5)))]; }
.kpi__title { @apply text-sm font-medium text-muted; }
.kpi__value { @apply text-2xl font-semibold tracking-tight text-foreground; }
.kpi__trend { @apply shrink-0; }
.kpi__progress { @apply col-span-full mt-1; }
.kpi__chart { /* --kpi-chart-fade / --kpi-chart-mask / mask-image / overflow-hidden as above */ }
.kpi > .kpi__chart { @apply mt-2 -mx-4 -mb-4 rounded-b-2xl; }
.kpi > .kpi__chart:has(+ .kpi__separator, + .kpi__footer) { @apply mb-0 rounded-none; }
.kpi__separator { @apply -mx-4 w-[calc(100%+--spacing(8))]; }
.kpi__footer { @apply -mb-1; }
.kpi__separator + .kpi__footer { @apply mt-0; }
```

Note: `.kpi` and `.card` are in the same layer; `.kpi`'s radius (16px) wins over `.card`'s `min(32px, var(--radius-3xl))`
because it comes later. Keep the Pro CSS imported after `@heroui/styles`.

### Measured layout (light, Inter, `--radius: .5rem`, `--spacing: .25rem`)

- Card: padding 16, flex gap 12, radius 16. Header (20px tall with title only, 32px with icon) + 4px margin, so header
  to content = 16px.
- Content grid: value column `1fr`, trend column `auto` (61px for `+3.3%`), trend vertically centred against the
  32px-tall value line.
- Progress: 8px tall block (OSS progress-bar grid keeps an empty label row + 4px gap), 4px track (`h-1`,
  `rounded-xs` 2px, `bg-default`), fill `--success`/`--warning`/`--danger`; spans the full content width at 4px below
  the value row.
- Actions: 32x32 ghost icon button at top 10px / inline-end 10px; 16x16 three-dot glyph; radius 24px (OSS button).
- Icon: 32x32, radius 8, 16x16 glyph, bg = status at 10% opacity, glyph = status colour.
- Bottom chart: full card width (margins -16px), flush with card bottom, top at content bottom + 12 (gap) + 8 = 20px.
  Bottom corners 16px (matches card) and `overflow:hidden` clips the area fill.
- Footer: OSS Link `text-sm` (14px/20px) in a 24px block; -4px bottom margin, so bottom padding is effectively 12px.
- Separator: 1px, `--separator`, spans the full card width.

## 5. Behaviour

### Chart rendering (Recharts 3)

Observed configuration (inferred from DOM geometry, defaults in parentheses are Recharts defaults):

- `<ResponsiveContainer width="100%" height={height} minWidth={0}>` inside `<div class="area-chart" data-slot="area-chart">`
  (the Pro AreaChart root element/CSS; if our AreaChart is not built yet, render the same `div.area-chart` and ship
  the `.area-chart` rules listed in Appendix B).
- `<AreaChart data={data} margin={{top: 4, right: 0, bottom: 0, left: 0}}>` (clip rect `x=0 y=4 w=W h=H-4`).
- No `XAxis`, `YAxis` or grid rendered. Implicit axes: x = point scale across the full width
  (points at `i * W/(n-1)`); y domain behaves like Recharts' default `[0, 'auto']` with nice ticks:
  verified: values 12,400-21,300 map to domain `[0, 22000]`; 15-26 to `[0, 28]`; 141-192 to `[0, 200]`.
  The area fills down to the plot bottom (y = H).
- `<defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">` with stops
  `0%: stop-color={fillColor ?? color}, stop-opacity 0.2` and `100%: same colour, stop-opacity 0.02`.
- `<Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={strokeWidth} fill={`url(#${gradientId})`}
  connectNulls={connectNulls} isAnimationActive={false} {...areaProps} />`
  - `fillOpacity` is NOT overridden (Recharts default 0.6 is present on both paths), so the effective top fill is
    0.2 x 0.6 = 0.12 alpha.
  - `dot` default (none). `activeDot` default: `r=4`, `fill=stroke colour`, `stroke="#fff"`, `stroke-width=2`;
    `.area-chart .recharts-active-dot circle` restyles the stroke to `var(--surface)`.
  - Animation: none observed. The final path is present at first paint (sampled every 15 ms from 186 ms after load in
    an iframe; no `animationClipPath` def ever existed, no Web Animations) -> use `isAnimationActive={false}`.
    The Area still carries Recharts' `clip-path="url(#animationClipPath-...)"` attribute, which is Recharts-internal.
  - `null` values: with `connectNulls` the path continues straight through the missing indices (demo: indices 5 and 6
    null, single `M` path). Without it, Recharts splits the path (break in line and fill) - docs behaviour, not
    observable in any demo.
- Recharts' default accessibility layer is on: `<svg role="application" tabindex="0">` even without a tooltip, so the
  chart is a tab stop. Focus ring from `.area-chart .recharts-surface:focus-visible { outline: 2px solid var(--focus);
  outline-offset: var(--ring-offset-width) }`.
- Hover without tooltip: the active dot (r=4) follows the nearest point; no cursor line, no tooltip.

### Tooltip (`tooltip` prop)

- `.kpi__chart` gets `data-has-tooltip="true"`: chart overflow becomes visible and the edge-fade mask moves from the
  chart container to `.recharts-surface`, so the tooltip can overflow the card and is not faded.
- The passed element (e.g. `<AreaChart.Tooltip content={<AreaChart.TooltipContent valueFormatter={...} />} />`,
  which is the Recharts `Tooltip` + Pro `ChartTooltip.Content`) is rendered as a child of the Recharts AreaChart.
- Observed positioning: wrapper `transform: translate(<activePointX>px, <pointerY>px)` with `transition: transform
  400ms` and classes `recharts-tooltip-wrapper-right recharts-tooltip-wrapper-bottom`; it never flips at the right or
  bottom edge (at the last point it is `translate(190px, 30px)` in a 190px chart). This implies `offset={0}` and
  `allowEscapeViewBox={{x: true, y: true}}`. Inside the wrapper the content is wrapped in
  `<div style="transform: translate(-50%, calc(-100% - 10px))">`, i.e. horizontally centred on the active point and
  floating 10px above the pointer. (The plain AreaChart demo does NOT have this wrapper and uses offset 10, so KPI.Chart
  adds it - most likely by cloning the tooltip element with `offset`, `allowEscapeViewBox`, and a wrapped `content`;
  see section 9.)
- Wrapper `z-index: 10` (`.area-chart .recharts-tooltip-wrapper`).
- Cursor: Recharts vertical line `M x,4 L x,H` restyled by `.area-chart .recharts-tooltip-cursor` to
  `stroke: var(--muted); stroke-dasharray: 4,4; stroke-width: 1px`.
- Tooltip content (ChartTooltip): `div.chart-tooltip[data-slot=chart-tooltip]` > `div.chart-tooltip__header` ("July")
  + `div.chart-tooltip__item` > `span.chart-tooltip__indicator.chart-tooltip__indicator--dot`
  (`style="background-color: var(--color-success)"`) + `span.chart-tooltip__label` ("Revenue") +
  `span.chart-tooltip__value` ("$17,400"). Measured 149x56px, padding 8px 12px, gap 6px, radius 8px, 1px
  `--separator` border, bg `--overlay`, `--overlay-shadow`, `min-width: 140px`, tabular nums.
- Hide: on pointer leave the wrapper returns to `visibility: hidden`.
- Keyboard: focus the svg, ArrowLeft/ArrowRight move the active point and show the tooltip (Recharts accessibility
  layer).

### Other

- Actions button: OSS Button behaviour (React Aria press, `data-hovered`, `data-focused`, `data-pressed`); clicking does
  nothing in demos (no menu attached). No `aria-label` was set in demos - our default should add
  `aria-label="More actions"` unless the consumer passes one (improvement; see section 9).
- Progress: OSS ProgressBar semantics (`role="progressbar"`, `aria-valuenow/min/max`, `aria-valuetext="38%"`,
  `aria-label="Progress"`). Fill width transitions 300ms on value change.
- Root, header, content, icon, title, value, footer: no state attributes, not focusable.

## 6. Demo variants

All demos: wrapper `<div class="grid w-[900px] grid-cols-1 gap-3 rounded-2xl p-6 sm:grid-cols-2 lg:grid-cols-{n}">`,
cards stretch to equal height per row. Icons are gravity-ui 16px icons (use any 16px icon set in stories).

| Demo | URL (append `?theme=light` / `?theme=dark`) | What it shows |
| --- | --- | --- |
| Default | https://heroui.pro/docs/react/demos/kpi-default | `lg:grid-cols-4`. Title + value + Trend only. "Total Revenue" `$228,451` up `+33%`; "Total Expenses" `$71,887` down `+13.0%`; "Total Profit" `$156,540` neutral `0.0%`; "New Customers" `1,234` up `+1.0%`. Values are currency USD with 0 fraction digits / plain decimal. |
| With Chart Bottom | https://heroui.pro/docs/react/demos/kpi-with-chart-bottom | `lg:grid-cols-3`. (1) "Total Revenue" `$228,451`, up `+3.3%`, chart `color="var(--color-success)"`, height 80; (2) "Baer Limited (BAL)" `$49.33`, down `-1.9%`, chart `var(--color-danger)` with a downward series; (3) Icon (success, people icon) + Title "Active Users" + Actions, value `98K` (compact), neutral `10.9%`, chart `var(--color-accent)` `height={60}`. 12 data points each. |
| With Icon | https://heroui.pro/docs/react/demos/kpi-with-icon | `lg:grid-cols-3`, Icon + Title. "Total Users" `5,400` up `+33%` (success, person icon); "Total Sales" `$15,400` neutral `0.0%` (warning, round icon); "Net Profit" `$10,400` down `-3.3%` (danger, tag-like icon). |
| With Progress | https://heroui.pro/docs/react/demos/kpi-with-progress | `lg:grid-cols-3`, Icon + Title, Value (percent) + Progress, no Trend. "Server Load" `38%` progress 38 success; "Server Load" `98%` progress 98 danger (icon danger); "Average Memory Used" `64%` progress 64 warning. |
| With Actions | https://heroui.pro/docs/react/demos/kpi-with-actions | `lg:grid-cols-3`, Icon + Title + Actions (default three-dot). "Conversion Rate" `3.8%` up `+1.7%` (success); "Bounce Rate" `42.3%` down `-5.9%` (danger); "Load Time" `856` + Progress 56 warning (warning icon, no trend). |
| With Footer | https://heroui.pro/docs/react/demos/kpi-with-footer | `sm:grid-cols-2` (2 cards). Header = Icon + Title + `KPI.Trend` with `className="ml-auto"` (trend lives in the header); Content = Value only; Footer = OSS `Link` `className="text-sm"` `href="#"`. "Total Subscribers" `71,897`, up `+122`, "View all" (success icon); "Monthly Revenue" `$45,231`, up `+20.1%`, "View report" (warning icon). No Separator. |
| With Chart Inline | https://heroui.pro/docs/react/demos/kpi-with-chart-inline | 2 cards. Header = plain muted svg (`text-muted size-4`) + Title. Content overridden with `className="grid-cols-[1fr_1fr] items-end"`; column 1 = `div.flex.flex-col.gap-1` with `KPI.Value className="text-3xl"` and `div.flex.items-center.gap-1.5` containing a plain `TrendChip variant="tertiary"` (no `kpi__trend`) with Suffix; column 2 = `KPI.Chart height={70}` (inside Content, so no edge bleed, mask still applies). "Total Clicks" `2,441`, up `3.5%` "last 30d", accent chart; "Bounce Rate" `42.3%`, down `5.9%` "vs last 7d", danger chart. |
| With Chart Tooltip | https://heroui.pro/docs/react/demos/kpi-with-chart-tooltip | 1 card, same inline layout. Icon (success) + "Monthly Revenue", `$21,300` (`text-3xl`), TrendChip tertiary up `11.5%` "last 30d", `KPI.Chart height={70} strokeWidth={1.5} color="var(--color-success)" tooltip={<AreaChart.Tooltip content={...}/>}`. Data (Jan-Dec): 12400, 13200, 12800, 15100, 14600, 16800, 17400, 16900, 18700, 19500, 19100, 21300; tooltip header = month name, label "Revenue", value USD currency 0 decimals. |
| Handling Gaps (connect nulls) | https://heroui.pro/docs/react/demos/kpi-with-chart-connect-nulls | 2 inline-layout cards, `connectNulls`, `strokeWidth={1.5}`, `height={70}`, 12 points with indices 5 and 6 `null`. "Time to First Response" `16 min` (`style="unit" unit="minute"`), TrendChip tertiary down `27%` "vs last week", success chart; data approx. 24, 21, 26, 19, 22, null, null, 18, 20, 17, 15, 16. "Time to Resolve" `141 min`, down `20%` "vs last week", accent chart; data approx. 186, 174, 192, 168, 177, null, null, 158, 163, 149, 152, 141. |

Suggested Storybook stories: Default, WithIcon, WithProgress, WithActions, WithFooter (+ a Separator variant, since no
public demo covers `KPI.Separator`), WithChartBottom, WithChartInline, WithChartTooltip, HandlingGaps (one card with
`connectNulls`, one without to show the break), CustomFade (`style={{"--kpi-chart-fade": "25%"}}` on `KPI.Chart`).

## 7. Theme / token dependencies, light vs dark

Tokens used directly: `--spacing`, `--radius`, `--text-sm`, `--text-2xl`, `--font-weight-medium`,
`--font-weight-semibold`, `--tracking-tight`, `--muted`, `--foreground`, `--success`, `--warning`, `--danger`;
via Card: `--surface`, `--surface-shadow`; via Separator: `--separator`; via ProgressBar: `--default` (track); via
chart CSS: `--muted`, `--surface`, `--focus`, `--ring-offset-width`, `--overlay`, `--overlay-shadow`; demo chart colours
use the Tailwind theme aliases `--color-success`, `--color-danger`, `--color-accent` (defined in
`packages/styles/themes/shared/theme.css`).

| Aspect | Light | Dark |
| --- | --- | --- |
| Card bg (`--surface`) | `lab(100% 0 0)` (white) | `lab(8.34% .61 -2.13)` |
| Card shadow (`--surface-shadow`) | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | none (`0 0 0 0 transparent inset`) |
| Title (`--muted`) | `lab(47.87% ...)` | `lab(65.65% ...)` |
| Value (`--foreground`) | `lab(8.34% ...)` | `lab(98.97% ...)` |
| Icon tint | status 10% over surface | same formula (status tokens differ slightly for danger/warning) |
| Tooltip | bg white, border `--separator` `lab(90.69% ...)`, 3-layer drop shadow | bg `lab(8.34% ...)`, border `lab(12.95% ...)`, shadow `0 0 1px 0 #ffffff4d inset` |
| Active dot stroke (`--surface`) | white | dark surface |

No selector differs between themes.

## 8. Dependencies

- OSS HeroUI (`@heroui/react`, `@heroui/styles`): `Card` (root), `Button` (Actions), `ProgressBar` + `ProgressBar.Track`
  + `ProgressBar.Fill` (Progress), `Separator` (Separator); demos also use `Link`.
- Pro: `NumberValue` formatting logic (share a `useNumberValueFormat`-style hook so `KPI.Value` can render a bare `<dd>`),
  `TrendChip` (Trend), the AreaChart root (`div.area-chart` + `.area-chart` Recharts theming CSS), and for the tooltip
  prop `AreaChart.Tooltip` / `AreaChart.TooltipContent` / `ChartTooltip` (+ `.chart-tooltip*` CSS).
- Third party: `recharts` >= 3 (optional peer; observed DOM is Recharts 3: `recharts-zIndex-layer_*`,
  `role="application"`), `react-aria` (via NumberValue / OSS components), React `useId`.
- Related (out of scope): `KPI Group` CSS targets `[data-slot="kpi"]` (keeps the slot name stable).

## 9. Open questions / uncertainties

1. Tooltip positioning wrapper (`translate(-50%, calc(-100% - 10px))`), `offset={0}` and `allowEscapeViewBox` are only
   seen in the KPI demo, not in the AreaChart demo; most likely injected by `KPI.Chart` (cloneElement on the tooltip
   prop, wrapping `content`), but could be demo code. Recommendation: implement inside KPI.Chart.
2. Tooltip header shows the month name although no XAxis is rendered; the demo probably supplies it via
   `labelFormatter` (index -> month) or KPI.Chart renders a hidden XAxis keyed on a category field. Series label
   "Revenue" is probably `areaProps={{name: "Revenue"}}` or a formatter. Not determinable.
3. Y domain: observed zero-anchored (`[0, 'auto']`), although the Handling Gaps text implies a data-fitted domain.
   Recommendation: match the observed default.
4. `isAnimationActive={false}` is inferred (no animation seen); Recharts' default would animate for 1500ms.
5. `KPI.Separator` was never rendered in any public demo (KPI or KPI Group); its `data-slot` and exact markup are
   unknown. Suggest `<Separator className="kpi__separator" data-slot="kpi-separator" />`.
6. `KPI.Actions` button has no accessible name in demos; adding a default `aria-label` is a deliberate improvement.
7. `KPI.Icon` without `status`: assumed no `data-status` attribute and therefore no tint.
8. `KPI.Value` render-function output not observable; recommended: `<dd ...>{children(formatted)}</dd>`.
9. `KPI.Progress` `aria-label="Progress"` is hard-coded in the DOM; allow override via props (`aria-label`) - whether
   heroui.pro forwards it is unknown.
10. `dt`/`dd` without a `dl` parent is invalid HTML; replicate for parity or switch the root to `<dl>` (Card supports a
    render/element override) - team decision.

## Appendix A - raw CSSOM dump (rules matching `kpi`)

Format: `context >> rule`, walked recursively over both stylesheets of the demo page.

```
@layer components >> .kpi { border-radius: calc(var(--radius) * 2); padding: calc(var(--spacing) * 4); flex-direction: column; display: flex; position: relative; }
@layer components >> .kpi__header { margin-bottom: var(--spacing); align-items: center; gap: calc(var(--spacing) * 2); display: flex; }
@layer components >> .kpi__content { align-items: center; column-gap: calc(var(--spacing) * 2); flex: 1 1 0%; grid-template-rows: auto; grid-template-columns: 1fr auto; display: grid; }
@layer components >> .kpi__icon { width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8); border-radius: calc(var(--radius) * 1); flex-shrink: 0; justify-content: center; align-items: center; display: flex; }
@layer components >> .kpi__icon svg { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); }
@layer components >> .kpi__icon[data-status="success"] { background-color: var(--success); }
@layer components > @supports (color:color-mix(in lab, red, red)) >> .kpi__icon[data-status="success"] { background-color: color-mix(in oklab, var(--success) 10%, transparent); }
@layer components >> .kpi__icon[data-status="success"] { color: var(--success); }
@layer components >> .kpi__icon[data-status="warning"] { background-color: var(--warning); }
@layer components > @supports (color:color-mix(in lab, red, red)) >> .kpi__icon[data-status="warning"] { background-color: color-mix(in oklab, var(--warning) 10%, transparent); }
@layer components >> .kpi__icon[data-status="warning"] { color: var(--warning); }
@layer components >> .kpi__icon[data-status="danger"] { background-color: var(--danger); }
@layer components > @supports (color:color-mix(in lab, red, red)) >> .kpi__icon[data-status="danger"] { background-color: color-mix(in oklab, var(--danger) 10%, transparent); }
@layer components >> .kpi__icon[data-status="danger"] { color: var(--danger); }
@layer components >> .kpi__actions { top: calc(var(--spacing) * 4 - var(--spacing) * 1.5); position: absolute; inset-inline-end: calc(var(--spacing) * 4 - var(--spacing) * 1.5); }
@layer components >> .kpi__title { font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); --tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); color: var(--muted); }
@layer components >> .kpi__value { font-size: var(--text-2xl); line-height: var(--tw-leading,var(--text-2xl--line-height)); --tw-font-weight: var(--font-weight-semibold); font-weight: var(--font-weight-semibold); --tw-tracking: var(--tracking-tight); letter-spacing: var(--tracking-tight); color: var(--foreground); }
@layer components >> .kpi__trend { flex-shrink: 0; }
@layer components >> .kpi__progress { margin-top: var(--spacing); grid-column: 1 / -1; }
@layer components >> .kpi__chart { --kpi-chart-fade: 10%; --kpi-chart-mask: linear-gradient(to right, transparent 0%, black var(--kpi-chart-fade), black calc(100% - var(--kpi-chart-fade)), transparent 100%); mask-image: var(--kpi-chart-mask); overflow: hidden; }
@layer components >> .kpi__chart[data-has-tooltip] { overflow: visible; mask-image: none; }
@layer components >> .kpi__chart[data-has-tooltip] .recharts-surface { mask-image: var(--kpi-chart-mask); }
@layer components >> .kpi > .kpi__chart { margin-top: calc(var(--spacing) * 2); margin-right: calc(var(--spacing) * -4); margin-bottom: calc(var(--spacing) * -4); margin-left: calc(var(--spacing) * -4); border-bottom-right-radius: calc(var(--radius) * 2); border-bottom-left-radius: calc(var(--radius) * 2); }
@layer components >> .kpi > .kpi__chart:has(+ .kpi__separator, + .kpi__footer) { border-radius: 0px; margin-bottom: 0px; }
@layer components >> .kpi__separator { margin-right: calc(var(--spacing) * -4); margin-left: calc(var(--spacing) * -4); width: calc(100% + var(--spacing) * 8); }
@layer components >> .kpi__footer { margin-bottom: calc(var(--spacing) * -1); }
@layer components >> .kpi__separator + .kpi__footer { margin-top: 0px; }
```

KPI Group rules served in the same sheet (out of scope, listed because they target `[data-slot="kpi"]`):

```
@layer components >> .kpi-group { background-color: var(--surface); --tw-shadow: var(--surface-shadow); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); overflow: hidden; }
@layer components >> .kpi-group--horizontal { border-radius: calc(var(--radius) * 2); flex-direction: row; display: flex; }
@layer components >> .kpi-group--horizontal > [data-slot="kpi"] { border-style: var(--tw-border-style); --tw-shadow: 0 0 #0000; box-shadow: ...; border-width: 0px; border-radius: 0px; flex: 1 1 0%; }
@layer components >> .kpi-group--vertical { border-radius: calc(var(--radius) * 2); flex-direction: column; display: flex; }
@layer components >> .kpi-group--vertical > [data-slot="kpi"] { border-style: var(--tw-border-style); --tw-shadow: 0 0 #0000; box-shadow: ...; border-width: 0px; border-radius: 0px; }
@layer components >> .kpi-group__separator { background-color: var(--separator); flex-shrink: 0; }
@layer components >> .kpi-group--horizontal > .kpi-group__separator { margin-block: calc(var(--spacing) * 4); align-self: stretch; width: 1px; }
@layer components >> .kpi-group--vertical > .kpi-group__separator { align-self: stretch; height: 1px; }
```

(`.aui-kpi*` rules on the same site belong to an unrelated AI-chat widget and are ignored.)

No `@keyframes` reference `kpi`.

## Appendix B - related Pro chart CSS (dependency of KPI.Chart)

```
@layer components >> .area-chart { width: 100%; }
@layer components >> .area-chart .recharts-cartesian-axis-tick-value { font-size: 10px; fill: var(--muted) !important; }
@layer components >> .area-chart .recharts-cartesian-axis-line, .area-chart .recharts-cartesian-axis-tick-line { stroke: none !important; }
@layer components >> .area-chart .recharts-cartesian-grid line { stroke: var(--muted); stroke-opacity: 0.15; }
@layer components >> .area-chart .recharts-tooltip-cursor { stroke: var(--muted); stroke-dasharray: 4, 4; stroke-width: 1px; }
@layer components >> .area-chart .recharts-tooltip-wrapper { z-index: 10; }
@layer components >> .area-chart .recharts-active-dot circle { stroke: var(--surface); stroke-width: 2px; }
@layer components >> .area-chart .recharts-surface, .area-chart .recharts-surface * { outline: none; }
@layer components >> .area-chart .recharts-surface:focus-visible, .area-chart .recharts-surface [tabindex="0"]:focus-visible { outline: 2px solid var(--focus); outline-offset: var(--ring-offset-width); }
@layer components >> .chart-tooltip { gap: calc(var(--spacing) * 1.5); border-radius: calc(var(--radius) * 1); border-style: var(--tw-border-style); background-color: var(--overlay); min-width: 140px; padding-inline: calc(var(--spacing) * 3); padding-block: calc(var(--spacing) * 2); border-width: 1px; border-color: var(--separator); box-shadow: var(--overlay-shadow); font-variant-numeric: tabular-nums; flex-direction: column; display: flex; }
@layer components >> .chart-tooltip__header { font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); --tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); color: var(--muted); }
@layer components >> .chart-tooltip__item { align-items: center; gap: calc(var(--spacing) * 2); display: flex; }
@layer components >> .chart-tooltip__indicator { flex-shrink: 0; }
@layer components >> .chart-tooltip__indicator--dot { width: calc(var(--spacing) * 2); height: calc(var(--spacing) * 2); border-radius: 2.14748e+09px; }
@layer components >> .chart-tooltip__indicator--line { height: calc(var(--spacing) * 3); width: var(--spacing); border-radius: 2.14748e+09px; }
@layer components >> .chart-tooltip__label { font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); color: var(--muted); flex: 1 1 0%; }
@layer components >> .chart-tooltip__value { font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); --tw-font-weight: var(--font-weight-semibold); font-weight: var(--font-weight-semibold); color: var(--foreground); }
```

AreaChart docs (public) for the tooltip contract: `AreaChart.Tooltip` = re-exported Recharts `Tooltip`;
`AreaChart.TooltipContent` = `ChartTooltip.Content` (props: `hideHeader`, `indicator: "dot" | "line"`,
`labelFormatter(label)`, `valueFormatter(value)`, plus Recharts-provided `active`/`label`/`payload`). The standalone
AreaChart root defaults to `height 300`, `margin {top: 8, right: 8, bottom: 0, left: 0}`; KPI.Chart overrides these.
