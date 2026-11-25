# Timeline (`timeline`) - clean-room implementation spec

Slug: `timeline` · Docs: https://heroui.pro/docs/react/components/timeline · Category: Data Display
Import (Pro): `import {Timeline} from "@heroui-pro/react";` (root export, no heavy peers)
Storybook (remake): `Pro/DataDisplay/Timeline`

Sources: the public docs page text, the server-rendered DOM of the 8 public demo pages, the public
stylesheet rules of those pages (the `.timeline*` rules inside `@layer components`), and live checks of
computed styles and `getBoundingClientRect()` metrics in light and dark. Observed on 2026-11-24/25. I did
not open or try to get around the paywalled example source ("Unlock the code"), JS chunks, source maps or
the Copy-prompt / MCP / llms endpoints.

---

## 1. Purpose

"A composable React timeline for web activity feeds, event histories, and milestones." Read-only
chronology: activity feeds, audit trails, incident history, release logs, milestone roadmaps. There is no
interaction, no keyboard model, no hover/press state and no animation: it is a styled `<ol>`. (The docs
point to Stepper for "current / complete / upcoming" step flows.)

---

## 2. Anatomy

```tsx
<Timeline>                       // <ol class="timeline ...">
  <Timeline.Item>                // <li class="timeline__item ...">
    <Timeline.Rail>              // optional: Item renders a default rail when omitted
      <Timeline.Marker />        // optional: Rail renders a default marker (+ connector) when it has no children
      <Timeline.Connector />     // optional: not rendered on the last item unless `force`
    </Timeline.Rail>
    <Timeline.Content>           // <div class="timeline__content">; may appear twice (side="start" + side="end")
      <article>...</article>     // free-form content: Card, Chip, Avatar, Link, Input, Button...
    </Timeline.Content>
  </Timeline.Item>
</Timeline>
```

### DOM order

In every demo the SSR output puts **all content first and the rail last** inside the `<li>`, although the
docs anatomy writes the Rail first. The item therefore reorders its children: non-rail children are
rendered in order, then the rail(s), or a default rail when none was passed. Benefits: reading order is
"event first", the decorative rail last. My implementation does the same (detects `Timeline.Rail` by
element type).

### Rendered DOM (from SSR of `timeline-default`)

```html
<ol class="timeline timeline--axis-start timeline--compact timeline--sm"
    data-axis="start" data-placement="end" data-slot="timeline">
  <li class="timeline__item timeline__item--align-center" data-align="center" data-index="0"
      data-side="end" data-slot="timeline-item" data-status="default">
    <div class="timeline__content" data-side="end" data-slot="timeline-content">…</div>
    <span class="timeline__rail" data-slot="timeline-rail">
      <span class="timeline__marker timeline__marker--sm" data-slot="timeline-marker"
            data-status="default" aria-hidden="true"><svg …/></span>
      <span aria-hidden="true" class="timeline__connector" data-slot="timeline-connector"></span>
    </span>
  </li>
  <li aria-current="true" … data-status="current">…</li>
  …
  <li … data-index="5" data-last="true" … data-status="success">
    <div class="timeline__content" …>…</div>
    <span class="timeline__rail"><span class="timeline__marker …"></span></span>  <!-- no connector -->
  </li>
</ol>
```

Attributes:

| Element | Classes | data-* / aria |
| --- | --- | --- |
| root `ol` | `timeline timeline--axis-{start,center} timeline--{compact,comfortable} timeline--{sm,md,lg}` (this order) | `data-axis`, `data-placement`, `data-slot="timeline"` (no data-size / data-density) |
| item `li` | `timeline__item timeline__item--align-{start,center}` | `data-align`, `data-index` (0-based), `data-last="true"` only on the last item, `data-side` (resolved), `data-status`, `data-slot="timeline-item"`, `aria-current="true"` when `status="current"` |
| rail `span` | `timeline__rail` | `data-slot="timeline-rail"` |
| marker `span` | `timeline__marker timeline__marker--{size}` | `data-status` (resolved), `data-slot="timeline-marker"`, `aria-hidden="true"` (seen on empty, icon and avatar markers) |
| connector `span` | `timeline__connector` | `aria-hidden="true"`, `data-slot="timeline-connector"`, `data-force` when forced (CSS hook) |
| content `div` | `timeline__content` | `data-side` (prop or item side), `data-slot="timeline-content"` |

Side resolution: `item.side ?? (placement === "alternate" ? (index even ? "end" : "start") : placement)`.
Seen: centered-milestones (`placement="alternate"`) gives index 0 `end`, index 1 `start`, ... Content
`side` overrides per content (split-content: item `data-side="end"`, contents `start` and `end`).

---

## 3. API (docs tables)

### Timeline (root, `ol`)

| Prop | Type | Default |
| --- | --- | --- |
| axis | `'start' \| 'center'` | `'start'` |
| placement | `'start' \| 'end' \| 'alternate'` | `'end'` |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` |
| density | `'compact' \| 'comfortable'` | `'comfortable'` |
| itemAlign | `'start' \| 'center'` | `'start'` |
| children | ReactNode | - |

Plus native `ol` attributes.

### Timeline.Item (`li`)

| Prop | Type | Default |
| --- | --- | --- |
| status | `'default' \| 'current' \| 'success' \| 'warning' \| 'danger' \| 'muted'` | `'default'` |
| align | `'start' \| 'center'` | inherited (`itemAlign`) |
| side | `'start' \| 'end'` | inherited (placement) |
| children | ReactNode | - |

### Timeline.Rail (`span`) - children default to marker + connector.

### Timeline.Marker (`span`)

| Prop | Type | Default |
| --- | --- | --- |
| status | status union | item status |
| children | ReactNode | - |

"Empty markers are decorative and hidden from assistive technology." Pro also hides icon and avatar
markers. Remake: `aria-hidden="true"` unless the marker has direct text children (e.g. a number);
overridable through props.

### Timeline.Connector (`span`)

| Prop | Type | Default |
| --- | --- | --- |
| force | boolean | `false` (render even on the last item) |

### Timeline.Content (`div`)

| Prop | Type | Default |
| --- | --- | --- |
| side | `'start' \| 'end'` | item side |

### useTimelineItem()

Returns `{align, index, isLast, side, status}` from the nearest `Timeline.Item`.

---

## 4. Styling

### CSS variables (on `.timeline`)

| Variable | Value |
| --- | --- |
| `--timeline-spacing` | `var(--spacing, .25rem)` |
| `--timeline-marker-size` | sm `5.5`, md `7`, lg `9` × spacing (22 / 28 / 36 px) |
| `--timeline-rail-width` | same as marker size |
| `--timeline-gap` (column gap) | sm `2.5`, md `3.5`, lg `4.5` × spacing (10 / 14 / 18 px) |
| `--timeline-item-gap` (row padding) | comfortable `4` (16 px), compact `3` (12 px) |
| `--timeline-connector-size` | `.5` × spacing (2 px) |
| `--timeline-marker-border-width` | `.25` × spacing (1 px); lg uses `--timeline-marker-border-width-lg` `.5` × (2 px) |
| `--timeline-current-color` | `var(--color-accent)` |
| `--timeline-marker-border` | `var(--color-border)` |
| `--timeline-marker-fg` | `var(--color-muted)` |
| `--timeline-connector-color` | `var(--color-separator)` |

### Layout

- Root: `margin:0; padding:0; list-style:none`; both axes `display:flex; flex-direction:column`.
- Item: `display:grid; position:relative; padding-bottom: var(--timeline-item-gap)`, last item `0`.
  - axis start: `grid-template-columns: var(--timeline-rail-width) minmax(0,1fr) auto; column-gap: var(--timeline-gap)`.
  - axis center: `grid-template-columns: minmax(0,1fr) var(--timeline-rail-width) minmax(0,1fr)`.
- Rail: `display:flex; justify-content:center; position:relative; min-height: marker size; grid-row: 1 / span 20`;
  column 1 (start) or 2 (center). Demos override with `items-center` to centre an avatar marker vertically.
- Marker: `position:relative; z-index:10; flex-shrink:0; flex centre; size = marker size; border-radius: full;
  border: <width> solid var(--timeline-marker-border); color: var(--timeline-marker-fg); background: transparent`.
  `svg` children are `55%` of the marker (12.1 px at sm). Font: sm `10px` semibold (inherits line-height),
  md `text-xs` semibold, lg `text-sm` semibold + 2 px border.
- Connector: `position:absolute; top: marker size; bottom: -item-gap; left: calc(50% - 1px); width: 2px;
  background: var(--timeline-connector-color)`. Hidden on `[data-last=true]` unless `[data-force]`.
- Content: `display:flex; flex-direction:column; min-width:0; min-height: marker size`; align-start →
  `justify-content:flex-start`, align-center → `center` (single-line content is vertically centred on the
  marker). axis start: column 2. axis center: `side=start` → column 1, `justify-self:end; align-items:flex-end;
  text-align:right`; `side=end` → column 3, `justify-self:start; align-items:flex-start; text-align:left`.

### Status tones (marker)

| status | background | border | colour |
| --- | --- | --- | --- |
| default | transparent | `--timeline-marker-border` | `--timeline-marker-fg` (muted) |
| muted | as default + `opacity: .7` | | |
| current | `var(--accent-soft)` | `--timeline-current-color` (accent) | `var(--accent)` |
| success / warning / danger | `color-mix(in srgb, <tone> 12%, transparent)` | `color-mix(in srgb, <tone> 55%, var(--timeline-marker-border))` | `<tone>` |

All tokens are HeroUI theme tokens, so dark mode only changes token values (`--accent-soft` is 15% accent in
light, 12% in dark).

### States / behaviour / motion

None: no transitions, no keyframes, no hover/focus styles, no keyboard handling. Interactive elements live
inside the content (links, buttons, inputs) and keep their own OSS styling.

---

## 5. Demos (all `size="sm"`)

| Demo | Root | Notes |
| --- | --- | --- |
| `timeline-default` | axis start, compact, `itemAlign="center"` | 6 icon markers (default, current, warning, default, muted, success); h3 + soft Chip + paragraph, right-aligned `time`; a Link in one row |
| `timeline-incident-response` | axis start, compact, `itemAlign="center"` | first item: Input (secondary) + Button sm primary composer; marker `size-7 overflow-hidden border-0 p-0 shadow-none` with an Avatar lg `size-full`; rail `items-center`, connector `top-[calc(50%+var(--spacing)*3.5)]`. Item 2 `align="start"`, status current, header + bordered transparent Card with secondary Chip (icon) and Link with icon. Then one-line rows with inline Avatar sm `size-4` |
| `timeline-repository-activity` | axis start, comfortable, align start | month heading with separator line; repository rows (grid of truncated Links + counts); default Card with header/footer, chips and a 5-square diff bar |
| `timeline-centered-milestones` | phone: axis start compact; `sm:` axis center, `placement="alternate"`, `itemAlign="center"` | content `max-w-[260px] gap-1.5`; chip/time order reversed on start-side items; all markers default status |
| `timeline-split-content` | axis center, comfortable, align start, placement end | two contents per item: `side="start"` (`max-w-[180px]`, time + chip, owner) and `side="end"` (`max-w-[320px]`, title + bordered transparent Card with a 2-col stat grid) |
| `timeline-compact-log` | axis start, compact | first item `align="start"` with description (`leading-tight` / `leading-snug`), others align center |
| `timeline-studio-review` | axis start, compact, `itemAlign="center"` | avatar markers `size-6 overflow-hidden border-0 p-0 shadow-none` + Avatar sm `size-full`; first item a bordered transparent Card with an image column (`sm:grid-cols-[140px_minmax(0,1fr)]`) |
| `timeline-document-revisions` ("Version History") | axis start, compact, align start | inside a default Card (`max-w-[420px] p-0`) with a bordered header + CloseButton; **empty** dot markers (default rail) |

OSS components seen inside content: `.chip` (soft / secondary, sm), `.card` (default, transparent with
`!border`), `.avatar` (sm / lg; SSR shows the fallback, after hydration an `avatar__image` photo), `.link`
(+ `link__icon`), `.input` (secondary), `.button` (sm primary), `.close-button`.

### Measured (447 px wide pane, light + dark)

- sm marker 22×22 at rail x=0; svg 11×11 at (5.5, 5.5) (55% of the 20 px content box); content x=32
  (22 rail + 10 gap); connector x=10, w=2, from y=22 to the next item (compact: item gap 12 px).
- Avatar marker override (`size-7` + rail `items-center`): marker (-3, 6, 28×28) in a 40 px row, connector
  `top-[calc(50%+14px)]` → y=34, h=18. `size-6` avatar marker: (-1, 0, 24×24), connector still starts at 22.
- Centered (384 px list): columns 171 / 22 / 171, rail x=181; start-side content right-aligned and
  `justify-self:end`, end-side content at x=213.
- Colours (light): default border `--border`, fg `--muted`; current bg `--accent-soft` (15%), border/fg
  accent; warning bg 12% warning, border `color(srgb .919 .747 .474)`; success border
  `color(srgb .440 .824 .612)`; connector `--separator`. Dark: accent-soft 12%, border/separator dark tokens.
- The remake reproduces every value above (story-vs-demo diffs only come from the page container width
  and different copy).

---

## 6. Remake notes

- Files: `src/components/timeline/{timeline.tsx,timeline.styles.ts,index.ts,timeline.stories.tsx}`,
  `css/components/timeline.css`.
- No dependencies beyond React; root-export safe (no heavy peers).
- The root wraps every element child in a position context (`index`, `isLast`) so items work through
  `.map()` and custom wrapper components; fragments are flattened (items rendered as
  `<>{events.map(...)}</>` keep their own index / last flag); non-element children of the `ol` are dropped.
- Status backgrounds use the same `color-mix(in srgb, <tone> 12%, transparent)` as Pro, so computed
  colours are identical (`color(srgb ... / 0.12)`).
- Extra story `Sizes` (not a Pro demo): sm / md / lg side by side with numbered markers in every status,
  to cover the md/lg marker text, the lg 2px border and the `danger` tone that no Pro demo shows.
- Deviations: content `text-align` uses logical `start`/`end` (identical in LTR, correct in RTL); marker
  `aria-hidden` is removed when the marker has its own text (empty, icon and avatar markers stay hidden).
- Review (2026-11-25): stylesheet rules re-compared rule by rule with the public `.timeline*` CSSOM (no
  differences besides the documented ones); all 8 demos measured against the stories at 447px (light and
  dark for split-content / studio-review), including repository-activity; centered-milestones checked in
  both layouts by forcing the `sm:` display classes. Marker / connector / content geometry and token colours
  match; only the page container width differs (Pro demo page 384px list vs Storybook 415px).
