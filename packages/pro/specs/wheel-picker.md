# Wheel Picker — clean-room implementation spec (web port)

Slug: `wheel-picker` · Origin: **HeroUI Pro Native** (`heroui-native-pro`) · Docs:
https://heroui.pro/docs/native/components/wheel-picker · Storybook: `Pro/Forms/WheelPicker`
Import (web): `import {WheelPicker} from "@heroui/pro";` or `"@heroui/pro/wheel-picker"`.

Sources used: the public docs page (anatomy, usage snippets, example, API tables for every part and
hook), the public demo videos `wheel-picker-docs-light.mp4` / `-dark.mp4` (6.9 s / 7.2 s, analysed frame by
frame at 20 fps, rows tracked with an ink-profile script), and the WheelPickerGroup docs page (for
the group contract). No paywalled code, bundles or source maps were opened.

---

## 1. Purpose

An iOS-style vertical wheel: a list of `{value, label}` rows that snaps one row onto a centred
selection band. Rows fade, shrink and change label colour with their distance from the centre;
optional top/bottom masks fade the wheel into the surface. Selection is controllable and is reported
live while the wheel moves. Several wheels can be composed by `WheelPickerGroup` (separate component,
built on the contexts exported here).

---

## 2. Anatomy

```tsx
<WheelPicker items={[...]}>        // root: viewport, role="listbox", owns value + scroll physics
  <WheelPicker.Indicator />        // optional selection band (auto-rendered when no children)
  <WheelPicker.Mask />             // optional top / bottom fades
</WheelPicker>

// custom rows
renderItem={({item, isSelected, absDistance}) => (
  <WheelPicker.Item>               // row container, role="option", tap-to-focus
    <Icon />
    <WheelPicker.ItemLabel>{item.label}</WheelPicker.ItemLabel>
  </WheelPicker.Item>
)}
```

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `WheelPicker` (root, = `classNames.container`) | `<div role="listbox" tabindex="0" aria-activedescendant>` | `wheel-picker` | `.wheel-picker` | CSS vars, `data-disabled`, `data-focus-visible`, `data-dragging`, `data-scrolling`, `data-in-group`, `data-item-animation="disabled"` |
| content (`classNames.contentContainer`) | `<div role="presentation">` | `wheel-picker-content` | `.wheel-picker__content` | translated track |
| `WheelPicker.Item` | `<div role="option" aria-selected id>` | `wheel-picker-item` | `.wheel-picker__item` | `data-selected`, `data-index`, `--wheel-picker-index` |
| `WheelPicker.ItemLabel` | `<span>` | `wheel-picker-item-label` | `.wheel-picker__item-label` | animated colour |
| `WheelPicker.Indicator` (wrapper) | `<div aria-hidden>` | `wheel-picker-indicator` | `.wheel-picker__indicator` | `classNames.wrapper` |
| highlight | `<div>` | `wheel-picker-indicator-highlight` | `.wheel-picker__indicator-highlight` | `classNames.highlight`, children render here |
| `WheelPicker.IndicatorBackground` | `<div aria-hidden>` | `wheel-picker-indicator-background` | `.wheel-picker__indicator-background` | first child of the highlight, `-z-1` |
| `WheelPicker.Mask` | `<div aria-hidden>` | `wheel-picker-mask` | `.wheel-picker__mask` | wraps both halves |
| mask halves | `<div>` ×2 | `wheel-picker-mask-top` / `-bottom` | `.wheel-picker__mask-fade--top` / `--bottom` | `className` goes on both halves |

Stacking: root `isolate`; indicator `z-0`, content `z-1` (rows paint over the band), mask `z-2`.
All overlays are `pointer-events: none` and `aria-hidden`.

---

## 3. API

### `WheelPicker` (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `ReadonlyArray<{value: T; label: string}>` | – | rows |
| `value` / `defaultValue` | `T` | – | controlled / uncontrolled; matched with `Object.is` |
| `onValueChange` | `(value: T) => void` | – | fires live as rows cross the band (drag, momentum, trackpad), once per tap / key / wheel notch / `scrollToIndex` / `scrollToValue`; never for external value updates |
| `itemHeight` | `number` | `44` | px; inherited from a group |
| `visibleCount` | `number` | `5` | odd; even values round up; inherited from a group |
| `name` | `string` | – | key in the `WheelPickerGroup` values record |
| `isDisabled` | `boolean` | `false` | wheel still shows the selection, dimmed |
| `className`, `classNames` | `string`, `{container, contentContainer, item, itemLabel}` | – | |
| `style`, `styles` | `CSSProperties`, same slots | – | |
| `renderItem` | `(info) => ReactNode` | – | `info = {item, index, isSelected, itemHeight, absDistance: number, scrollY: LiveValue}` |
| `keyExtractor` | `(item, index) => string` | `${value}:${index}` for primitives, else `String(index)` | |
| `animation` | `boolean \| "disabled" \| "disable-all" \| {opacity?, scale?, labelColor?: {value: [edge, center]}}` | `[0.5,1]`, `[0.85,1]`, `[var(--foreground), var(--accent-soft-foreground)]` | `false`/`"disabled"`: rows static, selected row coloured; `"disable-all"`: also settles every scroll instantly |
| `isHapticFeedbackEnabled` | `boolean` | nearest `HapticsProvider` (on) | web addition (user requirement) |
| `ref` | `Ref<HTMLDivElement & {scrollToIndex, scrollToValue}>` | – | |
| …div props | | | `aria-label` / `aria-labelledby` name the listbox |

Imperative: `scrollToIndex({index, animated = true})`, `scrollToValue(value, {animated = true})`
(no-op when the value is not in `items`). Both select immediately and report `onValueChange` once.

### `WheelPicker.Item`
div props; `children` default `<WheelPicker.ItemLabel>{item.label}</WheelPicker.ItemLabel>`.
Native `onPress` maps to `onClick`: the consumer handler runs first, `event.preventDefault()` cancels
the tap-to-focus. Opacity and scale are driven by CSS from the distance and applied inline
(`opacity: var(--wheel-picker-item-opacity)`, `scale: var(--wheel-picker-item-scale)`), so — like
Native — `className` utilities cannot override them; `style` (merged last) and `animation` can.

### `WheelPicker.ItemLabel`
span props. Colour is `var(--wheel-picker-label-color)`, applied inline while the row animation is on,
so `text-*` colour classes (also via `classNames.itemLabel`) are overridden by the animated value like
in Native; `style` / `styles.itemLabel` still win. With `animation={false}` / `"disabled"` the colour is
not animated (the selected row switches to the centre colour) and a `text-*` class applies.

### `WheelPicker.Indicator`
`children` (inside the highlight), `className` (wrapper), `classNames`/`styles` `{wrapper, highlight}`,
`background` (`undefined` = themable empty `IndicatorBackground`, node = custom, `null` = none).

### `WheelPicker.IndicatorBackground`
div props; absolute fill of the highlight with `border-radius: inherit`, behind the highlight's content.

### `WheelPicker.Mask`
`color` (any CSS colour, default `var(--background)`), `height` (number px, `"NN%"` of the default
`(visibleCount - 1) / 4 * itemHeight`, or any CSS length; default `"100%"`), `className` (both halves),
`classNames`/`styles` `{top, bottom}`.

### Hooks
- `useWheelPicker()` → `{itemHeight, visibleCount, isDisabled, scrollY, isInsideGroup,
  resolvedAnimation, isItemAnimationDisabled, scrollToIndex}`. `scrollY` is a live value
  (`get()` in px, `subscribe(listener)`) — the web stand-in for the Reanimated `SharedValue`.
- `useWheelPickerItem()` → `{item, index, isSelected, absDistance}`. `absDistance` is a **number**
  that re-renders the row while it is within `(visibleCount + 1) / 2` rows of the centre; farther rows
  read the clamped limit and do not re-render.

### Contexts for `WheelPickerGroup`
`WheelPickerGroupContext` (exported) with `{itemHeight, visibleCount, isDisabled, getValue(name),
setValue(name, value), notifyScrollState(isScrolling, name?), isAnyWheelScrolling(),
isAnimationDisabled?}`. Nested wheels: take layout from the group, read/write their value through it
when `name` is set, OR `isDisabled`, skip the default indicator, get `flex: 1` (`data-in-group`), report
motion start/stop exactly once each. `Indicator` and `Mask` also work directly inside a group (they
read the layout from the group context when no wheel context exists). The group must give its
context a new identity when its values change.

---

## 4. Styling & tokens (measured)

Calibration: rows are 92 px apart in the zoomed frames (2.09 px/dp ⇒ 44 dp rows); the caption
(`text-xs`) and title (`text-2xl`) of the demo header confirm the scale.

| Thing | Native (video) | Web |
|---|---|---|
| viewport | `visibleCount × itemHeight` = 220 | same, `overflow: hidden` |
| band | 44 dp high, full wheel width, radius ≈ 16–18 dp, `#ebebeb` light / `#262626` dark | `bg-default rounded-2xl` |
| page | `#f6f6f6` / `#050505` | `bg-background` |
| label | ≈ 18 dp, regular | `text-lg`, `truncate` |
| label colour | edge foreground, centre accent-soft-foreground (interpolated inside ±0.5 row) | `color-mix(in oklab, center p%, edge)` |
| row falloff | linear: dist 1 ≈ 0.75–0.8 opacity / ≈ 0.88 scale, dist 2 ≈ 0.5 opacity (under the mask) / ≈ 0.76 scale (ink widths and peak luminance measured against the same words rendered in Inter 18 px medium) | `t = clamp(d / ((visibleCount-1)/2), 0, 1)`, value = `center + (edge - center) * t` with the documented default ranges (see deviations) |
| mask | linear fade from `background`, 1 row high for 5 rows | `linear-gradient(var(--wheel-picker-mask-color), transparent)` |
| focus | – | `status-focused ring-inset` on the highlight (on the root when there is no indicator) |
| disabled | dimmed | `status-disabled` |

CSS custom properties on the root: `--wheel-picker-offset` (rows, written every frame),
`--wheel-picker-progress` (0..1 through the list), `--wheel-picker-item-height`,
`--wheel-picker-visible-count`, `--wheel-picker-{opacity,scale,label-color}-{edge,center}`; per row:
`--wheel-picker-index`, `--wheel-picker-distance` (= `absDistance`), `--wheel-picker-label-color`.
Rows never re-render for animation; everything is derived in CSS from `--wheel-picker-offset`.

---

## 5. Gestures & timings (measured → implemented)

Native uses a snapping list with fast deceleration. Measured in the video:
- drag follows the finger 1:1;
- after a flick the remaining distance to the row decays by ≈ 0.55–0.6 per 50 ms (τ ≈ 90–100 ms);
- tap-to-focus two rows away: 167 → 99 → 59 → 35 → 20 → 12 → 6 → 3 → 1 px per 50 ms (τ ≈ 96 ms,
  abrupt start, ≈ 450 ms to rest);
- overscroll at the first row ≈ 10 dp, returns with τ ≈ 130 ms.

Web engine (`wheel-picker-engine.ts`, own pointer drag + momentum, rAF):
- Pointer Events for touch, pen and mouse; drag starts after 6 px (touch) / 3 px (mouse) of vertical
  movement, then `setPointerCapture` on the root; `touch-action: pan-x pinch-zoom` (vertical drags
  belong to the wheel like the native list; horizontal pans reach pagers/carousels).
- Past the first/last row the finger is rubber-banded (iOS `(1 - 1/(x·0.55/d + 1))·d`, d = half the
  viewport); release returns with τ = 130 ms.
- Release: velocity from the last 100 ms (0 if the finger rested > 60 ms), projected with τ = 100 ms,
  rounded to a row, then an exponential approach whose τ (40–220 ms) keeps the velocity continuous.
  Flings beyond the ends decelerate freely and bounce with a critically damped spring
  (ω = 0.028/ms, entry velocity capped so the bounce stays ≈ ¼ row).
- Touching a moving wheel stops it; releasing without moving snaps to the nearest row and does not
  count as a tap. The click that ends a drag is swallowed.
- Tap (click) on a row: τ = 100 ms approach to it.
- Mouse wheel: a notch (≥ 50 px) moves exactly one row (animated, accumulates); trackpad deltas are
  followed 1:1 and snap 140 ms after the last event. The wheel consumes vertical wheel events.
- Keyboard: ↑/↓ one row, PageUp/PageDown `visibleCount` rows, Home/End, printable keys type-ahead on
  labels (600 ms buffer). All τ = 100 ms approaches; repeated keys accumulate from the selected row.
- Settled when within 0.25 px; `data-scrolling` and the group's `notifyScrollState` follow motion.
- `prefers-reduced-motion` and `animation="disable-all"`: every settle/scroll is instant (finger
  tracking stays direct manipulation).

---

## 6. Haptics

`useHaptics(isHapticFeedbackEnabled)` → `haptic("selection")`, throttled to one tick per 35 ms:
- every row that crosses the band during a drag (fired inside `pointermove`);
- every row crossed by momentum / trackpad scrolling (rAF / wheel handler; plays on Android via
  sticky activation, silently skipped by iOS outside a gesture);
- tap-to-focus (inside the click handler) and each keyboard step / wheel notch that changes the row.
No haptic for imperative scrolls or external value updates.

---

## 7. Accessibility

- Root: `role="listbox"`, focusable (`tabIndex=0`, `-1` when disabled), `aria-activedescendant` →
  selected option, `aria-disabled`; name via `aria-label` / `aria-labelledby`.
- Rows: `role="option"`, `aria-selected`, stable ids; all rows stay in the DOM so screen-reader users
  can browse every option. Activating an option (VoiceOver/TalkBack double tap = click) selects it.
- Keyboard alternative for every gesture (see §5). Focus ring (React Aria `useFocusRing`) on the band.
- Overlays are `aria-hidden`; forced-colors mode outlines the band.

---

## 8. Demos (stories)

| Story | Docs section | Content (own data) |
|---|---|---|
| `BasicUsage` | Basic usage | controlled years, default indicator; argTypes `isDisabled`, `itemHeight`, `visibleCount`, `animation`, `isHapticFeedbackEnabled` |
| `WithMask` | With mask | Indicator + Mask |
| `Uncontrolled` | Uncontrolled | `defaultValue` + last `onValueChange` |
| `ItemHeightAndVisibleCount` | Item height and visible count | 15-min delivery slots, `itemHeight={56}` `visibleCount={5}` |
| `CustomItemRender` | Custom item render | phone screen like the video: categories with `accent-soft-foreground` icons, `font-medium` labels, dashed icon frame on the selected row (`useWheelPickerItem().isSelected`) |
| `CustomIndicator` | Custom indicator | durations, `wrapper: px-2`, accent-soft highlight with a dot pattern |
| `CustomMaskColor` | Custom mask color | wheel on a `bg-overlay` card, `Mask color="var(--overlay)" height="75%"` |
| `CustomAnimation` | Custom animation | `[0.4, 1]` opacity, `[0.75, 1]` scale, muted → foreground labels |
| `Disabled` | Disabled | `isDisabled` |
| `ProgrammaticScroll` | Programmatic scroll | `scrollToValue`, `scrollToIndex({animated: false})`, random |
| `Example` | Example | phone screen, "Graduation year" header + tabular years |

---

## 9. Deviations

- Defaults follow the docs table (`opacity [0.5, 1]`, `scale [0.85, 1]`), interpolated linearly up to
  the farthest visible row. The demo video matches the default opacity, but its rows shrink to ≈ 0.76
  at the outermost row, i.e. it was recorded with a scale of about `[0.75, 1]` (the "Custom animation"
  value); we keep the documented default.
- Dark theme: the selected label in the dark video is close to `--accent`; the web theme's dark
  `--accent-soft-foreground` (the documented default centre colour) is lighter. This is a theme token
  difference, not a component one.
- `scrollY` / `absDistance` are not Reanimated shared values: `scrollY` is a `{get, subscribe}` live
  value, `absDistance` a number (plus the `--wheel-picker-distance` CSS variable).
- `WheelPicker.Item`'s `PressableProps` become div props (`onClick` instead of `onPress`).
- `IndicatorBackground` is always mounted empty by default (themes can style it) instead of being
  theme-registered content.
- The root element is also the `container` slot; there is no separate RN `View` wrapper.
- No list virtualisation (all rows are in the DOM for screen readers); fine for hundreds of rows.
- Added: `isHapticFeedbackEnabled`, keyboard + type-ahead, mouse-wheel/trackpad support,
  `--wheel-picker-progress`.
