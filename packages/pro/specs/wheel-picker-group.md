# Wheel Picker Group — clean-room implementation spec (web port)

Slug: `wheel-picker-group` · Origin: **HeroUI Pro Native** (`heroui-native-pro`) · Docs:
https://heroui.pro/docs/native/components/wheel-picker-group · Storybook: `Pro/Forms/WheelPickerGroup`
Import (web): `import {WheelPicker, WheelPickerGroup} from "@heroui/pro";`

Sources used: the public docs page (description, anatomy, every usage snippet, the example, API tables
for every part, `WheelPickerGroupValues`, `WheelPickerGroupRootAnimation` and `useWheelPickerGroup`) and
the public demo videos `wheel-picker-group-docs-light.mp4` (8.5 s) / `-dark.mp4` (9.1 s), analysed at
2 fps plus full-resolution stills with pixel sampling. No paywalled code, bundles or source maps were
opened. The group is built on the finished web `WheelPicker` (`packages/pro/src/components/wheel-picker`):
its `WheelPickerGroupContext` contract, its scroll engine, haptics and accessibility.

---

## 1. Purpose

A row of `WheelPicker` columns that behave like one control (iOS `UIPickerView` with several
components): every column shares the row height and visible-row count, one selection band and one pair
of fade masks span the whole row, and the group owns a single values record keyed by each wheel's
`name`. It reports every change live (`onValuesChange`) and a single composite commit once every wheel
has come to rest (`onValuesCommit`).

---

## 2. Anatomy

```tsx
<WheelPickerGroup aria-label="Timer" values={values} onValuesChange={setValues}>
  <WheelPicker aria-label="Hours" name="hours" items={HOURS} />
  <WheelPicker aria-label="Minutes" name="minutes" items={MINUTES} />
  <WheelPickerGroup.Indicator />   // optional shared selection band (spans every column)
  <WheelPickerGroup.Mask />        // optional shared top / bottom fades
</WheelPickerGroup>
```

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `WheelPickerGroup` (root) | `<div role="group">` | `wheel-picker-group` | `.wheel-picker-group` | flex row, `isolate`; `data-disabled`, `data-scrolling` (any wheel moving), `data-animation="disabled"`; CSS vars below |
| nested `WheelPicker` | `<div role="listbox">` | `wheel-picker` | `.wheel-picker[data-in-group]` | `flex-1` (shares the row evenly), no own indicator |
| `WheelPickerGroup.Indicator` (wrapper) | `<div aria-hidden>` | `wheel-picker-group-indicator` | `.wheel-picker__indicator.wheel-picker-group__indicator` | `classNames.wrapper` |
| highlight | `<div>` | `wheel-picker-group-indicator-highlight` | `.wheel-picker__indicator-highlight.wheel-picker-group__indicator-highlight` | `classNames.highlight`; children render here |
| `WheelPickerGroup.IndicatorBackground` | `<div aria-hidden>` | `wheel-picker-group-indicator-background` | `.wheel-picker__indicator-background.wheel-picker-group__indicator-background` | first child of the highlight, behind its content |
| `WheelPickerGroup.Mask` | `<div aria-hidden>` | `wheel-picker-group-mask` | `.wheel-picker__mask.wheel-picker-group__mask` | wraps both halves |
| mask halves | `<div>` ×2 | `wheel-picker-group-mask-top` / `-bottom` | `.wheel-picker__mask-fade--top` / `--bottom` (+ `wheel-picker-group__mask-fade--*`) | `className` goes on both halves |

The overlay parts carry the WheelPicker BEM classes as well as their own, so the group band and masks
always look exactly like a single wheel's (a theme that restyles `.wheel-picker__indicator-highlight`
restyles both). Stacking inside the isolated root: indicator `-z-1` (behind the columns, so rows paint
over the band), columns `auto`, mask `z-2`. Overlays are `pointer-events: none` and `aria-hidden`.

---

## 3. API

### `WheelPickerGroup` (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | – | `WheelPicker`s with a `name`, plus optional `Indicator` / `Mask` |
| `values` | `WheelPickerGroupValues` (`Record<string, unknown>`) | – | controlled record keyed by wheel `name` |
| `defaultValues` | `WheelPickerGroupValues` | `{}` | uncontrolled initial record |
| `itemHeight` | `number` | `44` | px, shared by every nested wheel (overrides the wheels' own prop) |
| `visibleCount` | `number` | `5` | shared; must be odd (even values round up, like WheelPicker) |
| `isDisabled` | `boolean` | `false` | disables and dims the whole group; a wheel can still set its own `isDisabled` |
| `onValuesChange` | `(values) => void` | – | fires live while a wheel moves (every row crossing the band), on tap-to-focus, keyboard and imperative `scrollToIndex` / `scrollToValue` of a nested wheel; the record is merged (`{...values, [name]: value}`); never for external `values` updates |
| `onValuesCommit` | `(values) => void` | – | fires exactly once after every wheel of the group has come to rest, when at least one value changed since the last commit (instant changes — reduced motion, `animated: false`, `"disable-all"` — commit on the next microtask) |
| `animation` | `"disable-all" \| undefined` | – | `"disable-all"` cascades to every nested wheel: rows stop fading / scaling and every settle is instant |
| `isHapticFeedbackEnabled` | `boolean` | nearest `HapticsProvider` (on) | web addition: becomes the haptics default of every nested wheel (a wheel's own prop still wins) |
| `className`, `style` | | | root `<div>` |
| `ref` | `Ref<HTMLDivElement>` | – | |
| …div props | | | `aria-label` / `aria-labelledby` name the group |

The root is generic (`WheelPickerGroup<V extends WheelPickerGroupValues>`): `V` is inferred from
`values` / `defaultValues`, so a typed `useState({currency: "EUR", amount: 250})` setter can be passed
to `onValuesChange` directly. A named wheel whose key is missing from the record shows its first row and
joins the record with its first change.

### `WheelPickerGroup.Indicator`
`children` (decorative content inside the highlight), `className` (wrapper), `classNames` /
`styles` `{wrapper, highlight}`, `background` (`undefined` = themable empty `IndicatorBackground`, a node
= custom content inside it, `null` = none), …div props. Spans every column at the centre row.

### `WheelPickerGroup.IndicatorBackground`
div props; absolute fill of the highlight with `border-radius: inherit`, painted behind the highlight's
content (`-z-1` inside the highlight's own stacking context). Empty by default.

### `WheelPickerGroup.Mask`
`color` (any CSS colour, default `var(--background)`), `height` (number = px, `"NN%"` scales the default
`(visibleCount - 1) / 4 * itemHeight`, any other string = CSS length; default `"100%"`), `className`
(both halves), `classNames` / `styles` `{top, bottom}`, …div props (no children).

### `useWheelPickerGroup()`
Returns the group context (throws outside a group): `{itemHeight, visibleCount, isDisabled,
getValue(name), setValue(name, value), notifyScrollState(isScrolling, name?), isAnyWheelScrolling(),
isAnimationDisabled}`. `setValue` merges into the record exactly like a wheel commit (it fires
`onValuesChange` and schedules a commit). The context gets a new identity whenever the values record
changes, which is how nested wheels follow external updates.

### Types
`WheelPickerGroupValues`, `WheelPickerGroupRootAnimation`, `WheelPickerGroupRootProps`
(`WheelPickerGroupProps`), `WheelPickerGroupIndicatorProps`, `WheelPickerGroupIndicatorBackgroundProps`,
`WheelPickerGroupMaskProps`, `WheelPickerGroupIndicatorSlots`, `WheelPickerGroupMaskSlots`,
`WheelPickerGroupContextValue`; type namespace `WheelPickerGroup.Props / RootProps / IndicatorProps /
IndicatorBackgroundProps / MaskProps`.

---

## 4. Styling & tokens (measured)

Calibration: in the zoomed frames rows are 92 px apart (2.09 px/dp ⇒ 44 dp rows, 5 visible rows).

| Thing | Native (video) | Web |
|---|---|---|
| viewport | 5 × 44 = 220 dp | root `height: visibleCount × itemHeight` |
| columns | two equal halves of the 300 dp group (left column centre at exactly ¼ of the band) | nested wheels `flex: 1` (WheelPicker CSS) |
| band | one band across both columns: 300 × 44 dp, radius ≈ 17 dp (corner fit 35 px at 2.09 px/dp), `#ebebeb` on `#f6f6f6` (light), `#262629` on `#050505` (dark) | `.wheel-picker__indicator-highlight` → `bg-default rounded-2xl` (16 px at the default `--radius`, scales with it) |
| rows | label ≈ 18 dp regular, foreground; centre row accent; rows fade/scale with distance | the nested wheels (WheelPicker defaults) |
| custom row (video) | accent icon in a 28 dp tile, neutral grey dashed border (≈ `#bababa` on the light band) on the selected row only, 8 dp gap, label | story `CustomRender` (`border-dashed border-muted/40`) |
| mask | top / bottom fades from `background`, 1 row high | `.wheel-picker__mask-fade` |
| header (video) | `text-xs` uppercase `tracking-wider` muted caption, ≈ 24 dp semibold title, 24 dp gap to the wheels | stories |
| disabled | dimmed | root `status-disabled` (the nested wheels' own dimming is neutralised so it does not compound) |
| focus | – | the focused column rings its segment of the centre row (`status-focused ring-inset`, rounded like the band) instead of the whole column |

CSS custom properties on the root: `--wheel-picker-group-item-height` (px), `--wheel-picker-group-visible-count`
(they also feed `--wheel-picker-item-height` / `--wheel-picker-visible-count` to the overlay parts). Each
nested wheel still exposes its own continuous `--wheel-picker-offset` and `--wheel-picker-progress` (0..1).

---

## 5. Gestures & timings

The group adds no motion of its own: in both videos only the touched column moves (drag 1:1, fast
deceleration that lands on a row, τ ≈ 100 ms), the band and masks stay put, and the header text updates
live while the column is still moving (`onValuesChange` per crossed row). All physics come from the
WheelPicker engine (see `specs/wheel-picker.md` §5): pointer drag for touch and mouse with
`touch-action: pan-x pinch-zoom` per column, momentum, rubber band, tap-to-focus, mouse wheel / trackpad,
keyboard, reduced motion. The group tracks motion through `notifyScrollState` to toggle `data-scrolling`
and to time `onValuesCommit`.

Commit timing: a value change marks the record dirty; when the last moving wheel reports rest, the
group fires `onValuesCommit(values)` once. Changes that happen without motion are committed in a
microtask (so a keyboard step that is about to animate does not commit twice).

---

## 6. Haptics

`isHapticFeedbackEnabled` on the group becomes the default for its wheels (a `HapticsContext`
provider around the children). Each wheel plays `haptic("selection")` (throttled to one tick per 35 ms)
when a row crosses the band during a drag (inside `pointermove`), during momentum / trackpad scrolling,
on tap-to-focus (click handler) and on each keyboard step or wheel notch. The group itself plays no
extra haptic: the composite commit happens after the momentum ends, outside a user gesture, where
iOS would drop it anyway.

---

## 7. Accessibility

- Root: `role="group"`, named with `aria-label` / `aria-labelledby` (e.g. "Transfer amount"),
  `aria-disabled` when disabled.
- Every column keeps its own WheelPicker semantics: `role="listbox"` with `aria-activedescendant`, a
  tab stop per column, `role="option"` rows with `aria-selected`. Give each wheel an `aria-label`
  ("Currency", "Amount").
- Keyboard: Tab / Shift+Tab move between columns; **ArrowLeft / ArrowRight also move focus to the
  previous / next enabled column** (mirrored in RTL); inside a column ↑/↓, PageUp/PageDown, Home/End and
  type-ahead (WheelPicker). These are the alternatives for every drag / fling / tap gesture.
- Screen readers browse all options of a column; activating an option (double tap) selects it.
- Overlays are `aria-hidden`; forced-colors mode outlines the band (WheelPicker CSS).

---

## 8. Demos (stories)

| Story | Docs section | Content (own data) |
|---|---|---|
| `BasicUsage` | Basic usage | controlled timer (hours + minutes) with Indicator + Mask; argTypes `itemHeight`, `visibleCount`, `isDisabled`, `animation`, `isHapticFeedbackEnabled` |
| `Uncontrolled` | Uncontrolled | reminder day + time, `defaultValues`, last `onValuesChange` record shown |
| `ItemHeightAndVisibleCount` | Item height and visible count | distance km + tenths, `itemHeight={56}` `visibleCount={5}` |
| `CustomIndicator` | Custom indicator | accent-soft highlight with border, `overflow-hidden` and a stripe pattern spanning both columns |
| `CustomMaskColor` | Custom mask color | group on a `bg-overlay` card, `Mask color="var(--overlay)" height="75%"` |
| `CommitOnRest` | Commit on rest | live change counter vs. a log of `onValuesCommit` records |
| `DisableAnimations` | Disable animations | `animation="disable-all"` |
| `Disabled` | Disabled | `isDisabled` |
| `CustomRender` | (the demo video) | phone screen: "Invest" header, asset column with icon tiles (`renderItem` + `WheelPicker.Item`), amount column, shared band + mask |
| `Example` | Example | phone screen: "Convert" header with a currency + amount group (`w-[280px]`) |

---

## 9. Deviations

- `onValuesCommit` only fires when a value changed since the previous commit (a drag released on the
  same row does not commit); external `values` updates never commit.
- `isHapticFeedbackEnabled` (group-wide haptics default) and ArrowLeft / ArrowRight column navigation are
  web additions.
- `IndicatorBackground` is mounted empty by default (themable) instead of theme-registered content.
- The overlay parts reuse the WheelPicker BEM classes (plus their own) so both components share one look.
- A wheel without `name` inside the group still takes the group's layout, disabled state and animation
  cascade, but keeps its own value (it is not part of the record), as in Native.
- RN `ViewProps` / `ViewStyle` become div props / `CSSProperties`; `useThemeColor('overlay')` becomes
  `"var(--overlay)"`.
