# Stacked Meter — clean-room implementation spec

Slug: `stacked-meter` · Origin: **HeroUI Pro Native** (React Native) · Docs:
https://heroui.pro/docs/native/components/stacked-meter · Category: Charts · Storybook: `Pro/Charts/StackedMeter`
Import (web remake): `import {StackedMeter} from "@heroui/pro/stacked-meter";`

Sources used: the public Native docs page (text, anatomy, usage snippets, API tables) and the public
demo videos `stacked-meter-docs-light.mp4` / `stacked-meter-docs-dark.mp4` (6.1 s, 1920×1080, measured
frame by frame). No paywalled code, bundles, source maps or prompt/MCP endpoints were used.

---

## 1. Purpose

A single horizontal track split into proportional coloured segments that shows how a whole breaks
down into parts (languages of a repository, categories filling a storage quota, ticket states), plus a
wrapping legend with a dot, a name and a formatted value per segment.

---

## 2. Anatomy

```tsx
<StackedMeter segments={segments}>                 // root: owns data, computes shares + value texts
  <StackedMeter.Label>Languages</StackedMeter.Label>
  <StackedMeter.Track>                             // role="meter", one Segment per non-zero segment
    {(segment) => <StackedMeter.Segment />}        //   (+ empty remainder when maxValue > sum)
  </StackedMeter.Track>
  <StackedMeter.Legend>                            // role="list", one LegendItem per segment
    {(segment) => (
      <StackedMeter.LegendItem>                    // role="listitem"
        <StackedMeter.LegendIndicator />           // dot in the segment colour
        <StackedMeter.LegendLabel />               // segment label
        <StackedMeter.LegendValue />               // formatted value, tabular figures
      </StackedMeter.LegendItem>
    )}
  </StackedMeter.Legend>
</StackedMeter>
```

| Part | Element | `data-slot` | BEM class |
|---|---|---|---|
| `StackedMeter` (root) | `<div role="group">` | `stacked-meter` | `stacked-meter stacked-meter--{sm\|md\|lg}` |
| `StackedMeter.Label` | `<span id>` | `stacked-meter-label` | `stacked-meter__label` |
| `StackedMeter.Track` | `<div role="meter">` | `stacked-meter-track` | `stacked-meter__track stacked-meter__track--{size}` |
| `StackedMeter.Segment` | `<div>` | `stacked-meter-segment` | `stacked-meter__segment stacked-meter__segment--{color}` |
| (remainder, automatic) | `<div aria-hidden>` | `stacked-meter-remainder` | `stacked-meter__remainder` |
| `StackedMeter.TrackBackground` | `<div aria-hidden>` inside the remainder | `stacked-meter-track-background` | `stacked-meter__track-background` |
| `StackedMeter.Legend` | `<div role="list">` | `stacked-meter-legend` | `stacked-meter__legend` |
| `StackedMeter.LegendItem` | `<div role="listitem">` | `stacked-meter-legend-item` | `stacked-meter__legend-item` |
| `StackedMeter.LegendIndicator` | `<span aria-hidden>` | `stacked-meter-legend-indicator` | `stacked-meter__legend-indicator stacked-meter__legend-indicator--{color}` |
| `StackedMeter.LegendLabel` | `<span>` | `stacked-meter-legend-label` | `stacked-meter__legend-label` |
| `StackedMeter.LegendValue` | `<span>` | `stacked-meter-legend-value` | `stacked-meter__legend-value` |

Data attributes: root `data-size`, `data-disabled="true"`, `data-animation="disabled"` (with
`animation="disable-all"`); segment / legend item / indicator `data-color`, `data-index`; segment and
remainder `data-animation="disabled"` when their transition is off.

Children shortcuts of the root:
- no children → `Track` + `Legend`
- string children → `Label(string)` + `Track` + `Legend`
- render function → called with `{segments, total, summaryText}`
- any other node → rendered as is

---

## 3. API

### `StackedMeter` (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `segments` | `StackedMeterSegmentData[]` | – | In reading order (Native type name `StackedMeterSegment`, renamed on the web because the part component already has that name) |
| `maxValue` | `number` | – | Capacity; ignored when smaller than the sum |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Track height only |
| `isDisabled` | `boolean` | `false` | Lowers opacity (`status-disabled`), sets `aria-disabled` |
| `formatOptions` | `Intl.NumberFormatOptions` | `{style: 'percent', maximumFractionDigits: 1}` | `percent` formats the share, other styles the raw value; locale from the RAC `I18nProvider` |
| `aria-label` | `string` | – | Web name of Native `accessibilityLabel`: names the group and prefixes the track summary |
| `animation` | `'disable-all' \| undefined` | – | Turns every share transition off |
| `children` | `ReactNode \| (props: StackedMeterRenderProps) => ReactNode` | – | See shortcuts above |
| `className`, `style`, `ref`, other `div` props | | | forwarded to the root `<div>` |

`StackedMeterSegmentData`: `{id: string | number; label: string; value: number; color?: StackedMeterColor; colorClassName?: string}`.
Negative / non-finite values count as 0.

`StackedMeterSegmentState` (computed): the data + `index`, `percentage` (0–100 of the total),
`valueText` (formatted), `color` (resolved).

`StackedMeterColor`: `'default' | 'accent' | 'success' | 'warning' | 'danger' | 'chart-1' … 'chart-5'`.
Segments without `color` get `chart-1 … chart-5` in order (counting only segments without an explicit
`color`, cycling after five). `colorClassName` is added to both the segment and its legend dot; it is a
utility (`bg-[#3178c6]`) and therefore wins over the component-layer colour.

`StackedMeterRenderProps`: `{segments, total, summaryText}`.

### Computation
- `sum = Σ max(0, value)`; `total = max(sum, maxValue ?? 0)`
- `percentage = total > 0 ? value / total × 100 : 0`
- `remainderPercentage = total > 0 ? (total − sum) / total × 100 : 100`
- `valueText = format(style === 'percent' ? percentage / 100 : value)`
- `summaryText = segments.map(s => \`${label} ${valueText}\`).join(", ")`

### `StackedMeter.Label`
`<span>` props. Its id (own `id` or a generated one) is picked up through a callback ref and used as
`aria-labelledby` of the root group and of the track, unless an `aria-label` is given.

### `StackedMeter.Track`
| Prop | Type | Notes |
|---|---|---|
| `children` | `ReactNode \| (segment) => ReactNode` | omitted: one `Segment` per non-zero segment; function: called per non-zero segment inside its segment context; node: rendered instead of the segments |
| `background` | `ReactNode` | layer inside the empty remainder. `undefined` → default `TrackBackground` (empty CSS hook on the web); node → replaces it; `null` → removed |
| `aria-label` / `aria-labelledby` | | override the inherited name |

The remainder `<div>` is appended whenever `remainderPercentage > 0`.

### `StackedMeter.TrackBackground`
Absolute-fill `<div>` inside the remainder (`pointer-events: none`, clipped by the track). No content
by default; on Native the active theme can register content (e.g. glass). On the web a theme can style
`.stacked-meter__track-background` in CSS. Pass children for custom content.

### `StackedMeter.Segment`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `animation` | `boolean \| 'disabled' \| {growTimingConfig?: {duration?: number; easing?: string}}` | – | `false`/`'disabled'` turns the share transition off; `duration` in ms, `easing` is a CSS easing (Native: Reanimated `WithTimingConfig`) |
| `isAnimatedStyleActive` | `boolean` | `true` | `false` drops the inline `flex-grow` / `flex-basis`, so `style`/`className` fully control the size |
| `div` props | | | |

Reads its segment from `useStackedMeterSegment()` (throws outside a segment context).

### `StackedMeter.Legend`
`children`: omitted → one `LegendItem` per segment (zero-valued ones included); function → called per
segment inside its context; node → rendered instead.

### `StackedMeter.LegendItem` / `LegendIndicator` / `LegendLabel` / `LegendValue`
`LegendItem` children default to `Indicator + Label + Value`. `LegendLabel` defaults to `segment.label`,
`LegendValue` to `segment.valueText`. All accept their element's props.

### Hooks
- `useStackedMeter()` → `{segments, total, remainderPercentage, summaryText, accessibilityLabel, size, isDisabled}`; throws outside a `StackedMeter`.
- `useStackedMeterSegment()` → `{segment}`; throws outside a Track/Legend segment context.

Contexts `StackedMeterContext` and `StackedMeterSegmentContext` are exported too.

---

## 4. Measurements from the video

Calibration: the meter track spans 614 px of the 1920 px frame and the screen content is 680 px wide
with 32/33 px side margins → 402 dp screen with 20 dp padding, **1 dp ≈ 1.696 px**.

| What | Frame px | dp | Web |
|---|---|---|---|
| Track height sm / md / lg | 7 / 14 / 20 | 4 / 8 / 12 | `h-1` / `h-2` / `h-3` |
| Track ends | fully round at all sizes | – | `rounded-xs` / `rounded-sm` / `rounded-md` (pill at the default `--radius`, follows the theme radius like the OSS Meter) |
| Gap between segments | ~3.5 | 2 | `gap-0.5`, transparent (page background shows through in light and dark) |
| Inner segment corners | square | – | no radius on segments, the track clips the ends |
| Segment widths | 354/99/72/47/29 px for 60.2/16.4/11.8/7.3/4.3 %; 341/103/89/37.5/19.5/9.5 px for 58.4/17.2/14.9/5.8/2.6/1.1 %; 299.5/101.5/54/149.5 px for 18/6/3/9 | – | **not** purely proportional: a least-squares fit over all three scenes gives `width = 2dp + share × (track − gaps − n × 2dp)` (Yoga uses a segment's minimum size as its flex basis). Web: inline `flex: <percentage> 1 var(--stacked-meter-segment-basis)` with `--stacked-meter-segment-basis: 2px` (`--spacing × 0.5`) on the root; the remainder uses the same basis. Result at 1.694×: 354.2/98.9/72.2/45.9/28.5, 339.8/102.5/89.3/36.8/18.3/9.7 and 298.1/101.6/52.5/150.8 px |
| Label | cap height ≈ 19 px, L stem ≈ 3.5 px | 16 px, semibold | `text-base font-semibold text-foreground` (stem widths and text widths matched against an Inter render at the same scale) |
| Label → track, track → legend | 47 / 44 px centre to centre | 12 | root `flex-col gap-3` |
| Legend text | cap height ≈ 17 px | 14 px | `text-sm` (line 20) |
| Legend dot | ≈ 13.5 px | 8 | `size-2 rounded-full` |
| Dot → label, label → value | ≈ 11 / 14 px incl. side bearings | 6 | item `gap-1.5` |
| Legend item → next item | ≈ 32 px incl. side bearings | 16 | `gap-x-4` (verified: same 32 px in our render at 1.696×) |
| Legend rows | 44 px pitch | 20 + 6 | `gap-y-1.5` |
| Meters in the Sizes demo | 224 / 230 px between track centres | 32 between meters | story `gap-8` |
| Colors demo ("Sprint tasks") | track 20 px high | 12 | the video shows this variant with `size="lg"`, so the `Colors` story defaults to `lg` |

Typography: legend label semibold (`font-semibold`, T stem ≈ 3 px) in `foreground`; legend value regular in `muted` with tabular
figures. Values: default percent with one fraction digit ("60.2%"); the colour demo shows raw counts.

### Colours (light / dark)
| Video | Token |
|---|---|
| Default palette, darkest → lightest blue (#005c98, #0575c1, #0391f9, #3fa3f8, #7ac0ff) | `--chart-1 … --chart-5` (accent shades from `css/theme.css`) |
| `success` green, `warning` amber, `danger` red | `--success`, `--warning`, `--danger` |
| `default` black (light) / white (dark) | `--default-foreground` (same as the OSS Meter `default` colour) |
| Empty remainder | `--default` (`bg-default`, like the OSS Meter track) – not visible in the video, which has no capacity demo |
| Label / legend label / value | `--foreground` / `--foreground` / `--muted` |
| Gaps | transparent |

---

## 5. Motion

- **Value change:** each segment's `flex-grow` (= its percentage) and the remainder's transition over
  **300 ms, ease-in-out quad** (`--ease-in-out-quad`, the Reanimated `withTiming` default named in the
  docs: `growTimingConfig` default `{duration: 300}`). CSS variables `--stacked-meter-grow-duration`
  and `--stacked-meter-grow-easing` on the root (overridable per segment through `growTimingConfig`).
- **Mount:** no grow-in. In every scene change of the video (0.1 s and 0.034 s frame steps around
  1.9 s, 3.2–3.6 s and 4.6–4.8 s) the bar is complete and its proportions are final on the first
  visible frame, so the web version renders the final widths on the first paint (also SSR-safe).
- Segments that become 0 unmount and new non-zero segments mount at their share (Native renders only
  non-zero segments).
- `prefers-reduced-motion` / `[data-reduce-motion]` → `motion-reduce:transition-none`;
  `animation="disable-all"` on the root or `animation={false}` on a segment → `transition: none`.
- No gesture or press interaction exists, so there is **no haptic feedback** (the docs show no
  interaction; `isHapticFeedbackEnabled` is not part of this component).

---

## 6. Accessibility

- Root: `role="group"`, named by the Label (`aria-labelledby`) or by `aria-label`; `aria-disabled` when disabled.
- Track: `role="meter"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow` = used share
  (100 − remainder, so 100 without a capacity), `aria-valuetext` = `summaryText`
  (e.g. "TypeScript 58.7%, Rust 18.9%, …"); named by the Label or the root `aria-label`
  (Native: "accessibilityLabel prefixes the summary"). This is the single summarising element the
  Native docs describe; meter children are presentational.
- Unnamed track (no Label, no `aria-label`/`aria-labelledby`, e.g. the Colors/Sizes docs snippets or a
  custom root layout): the summary becomes the meter's `aria-label` and `aria-valuetext` is left out,
  so the meter always has a name (axe `aria-meter-name`) and the summary is read once, like the Native
  track that reads only the summary. A root `aria-labelledby` is forwarded to the track as well.
- Legend: `role="list"`; each LegendItem is a `listitem` read as one unit ("TypeScript 58.7%");
  dots are `aria-hidden`.
- No focusable parts (static data display), so there is nothing to operate by keyboard.
- Windows high contrast: segment/dot colours keep `forced-color-adjust: none`; the track gets a
  `CanvasText` outline.

---

## 7. Demos (Storybook `Pro/Charts/StackedMeter`)

| Story | Docs section | Content |
|---|---|---|
| `BasicUsage` | Basic usage | Label + Track + Legend, 5 languages on the chart palette (argTypes: size, isDisabled, maxValue, animation) |
| `StringChildren` | String children shortcut | `"Repository languages"` as children |
| `Sizes` | Sizes | sm / md / lg with "Small" / "Medium" / "Large" labels, 32 px apart (like the video) |
| `Colors` | Colors | success / warning / danger / default + a `colorClassName` segment, raw counts (`style: 'decimal'`) on the `lg` track, like the video's "Sprint tasks" scene |
| `Capacity` | Capacity | `maxValue={128}`, gigabyte unit format |
| `CustomLegend` | Custom legend | column legend, `justify-between`, "N files" values |
| `TrackOnly` | Track only | `aria-label="Languages"` + Track |
| `Disabled` | Disabled | `isDisabled` |
| `RenderFunctionChildren` | Render function children | header with count/total, Track, `summaryText` |
| `Example` | Example | phone-sized screen, centred `w-80` meter with custom `colorClassName` colours |
| `AnimatedValues` | (extra) | shuffle/reset buttons to show the 300 ms share transition |

---

## 8. Deviations from Native

- `accessibilityLabel` → `aria-label` on the root (returned as `accessibilityLabel` by `useStackedMeter`).
- Data type `StackedMeterSegment` is exported as `StackedMeterSegmentData` (name clash with the part).
- `growTimingConfig.easing` is a CSS easing string instead of a Reanimated easing function; no
  `SharedValue` support.
- `TrackBackground` has no theme-registered default content on the web; it is an empty, stylable
  layer inside the remainder.
- The track radius follows `--radius` (`rounded-xs/sm/md`) instead of being hard-coded round; at the
  default radius it is a pill like the video.
- Segment `id` also accepts numbers.
- Default chart palette: the shared `--chart-1 … --chart-5` tokens (accent ± 0.12 / 0.24 lightness) are
  kept so a theme override of the chart tokens reaches this component. The Native video palette has
  smaller lightness steps and less chroma at the ends (≈ accent −0.18 / −0.09 / 0 / +0.06 / +0.14 L;
  #055a9c, #0873cc, #058ff3, #40a6f6, #73c0f4), so `chart-1` looks darker and `chart-5` more cyan here.
  Matching it exactly needs a change to `css/theme.css`.

---

## 9. Verification

- Stories rendered at a 402 px phone viewport with `deviceScaleFactor` 1.696 and overlaid on the video
  crops (Default, Sizes, Colors; light and dark): track position, width, height, gaps, label/legend
  baselines (±1 px), text widths and the 32 px Sizes spacing match.
- Share transition measured in the browser (Shuffle in `AnimatedValues`, mouse click): the first
  segment eases from 207.8 px to its new width in ≈ 300 ms; with `reducedMotion: "reduce"` it jumps.
- ARIA snapshot: `group "Languages"` → `meter "Languages"` (value text = summary) → `list` of
  `listitem: TypeScript 58.7%` …; `aria-disabled` on the disabled root; no focusable parts.
- Review pass: segment widths re-measured in the Default, Colors and Custom colours scenes (see §4)
  and matched after adding the 2px segment basis; Colors scene matched on the `lg` track; label,
  legend label, value and dot ink extents equal the video within 1 px (light and dark); status
  colours (success / warning / danger / default) match in both themes. Share transition sampled per
  frame after Shuffle (touch tap at 390×844): it follows ease-in-out quad within 0.02 and ends at
  300 ms; with reduced motion it jumps in one frame. axe (wcag2a/aa, best practice) is clean apart
  from the theme's `--muted` on `--background` contrast (4.43:1 in light mode, shared with OSS
  components). Theme check: `--radius: 1rem` → track radius 4/8/12px, `--radius: 0` → square,
  `--accent` and `--font-sans` overrides and dark mode are followed.
