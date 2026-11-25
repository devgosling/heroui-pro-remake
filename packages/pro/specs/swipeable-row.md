# SwipeableRow — clean-room web port spec

Slug: `swipeable-row` · Origin: **HeroUI Pro Native** (React Native) · Docs:
https://heroui.pro/docs/native/components/swipeable-row · Storybook: `Pro/DataDisplay/SwipeableRow`
Import (web): `import {SwipeableRow, useSwipeableRow} from "@heroui/pro";`

Sources used: the public docs page text (anatomy, usage sections, API tables), the public demo
recordings `swipeable-row-docs-light.mp4` (9.9 s) and `swipeable-row-docs-dark.mp4` (11.2 s), read
frame by frame (0.5 s overview, 1/30 s around every swipe, 1920 px crops, pixel colour sampling and
edge tracking of the card), and the OSS HeroUI web theme in this repo. No paywalled source, bundles,
"Copy prompt" or MCP endpoints were used.

---

## 1. Purpose

A list row whose foreground card is dragged toward its logical start or end edge to uncover action
buttons resting behind it. The card travels as a whole; the actions never move, they are uncovered
(and their content zooms in). Rails are logical (`start` / `end`) and mirror in RTL.

---

## 2. Anatomy

```tsx
<SwipeableRow>                                   // root: gesture owner, open state, imperative API
  <SwipeableRow.Actions side="start">            // rail anchored at the start edge (behind the card)
    <SwipeableRow.Action variant="success">Read</SwipeableRow.Action>
  </SwipeableRow.Actions>
  <SwipeableRow.Content>                         // the card translated by the gesture
    {/* SwipeableRow.ContentBackground is rendered automatically (background prop) */}
    <MessageRow />
  </SwipeableRow.Content>
  <SwipeableRow.Actions side="end">
    <SwipeableRow.Action>
      <Icon icon="gravity-ui:bell" />
      <SwipeableRow.ActionLabel>Mute</SwipeableRow.ActionLabel>
    </SwipeableRow.Action>
    <SwipeableRow.Action variant="danger">Delete</SwipeableRow.Action>
  </SwipeableRow.Actions>
</SwipeableRow>
```

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `SwipeableRow` (root) | `<div>` | `swipeable-row` | `swipeable-row swipeable-row--{standalone\|inline}` | `position:relative; isolation:isolate; touch-action:pan-y pinch-zoom`. Never clips. Data: `data-variant`, `data-open`, `data-open-side`, `data-disabled`, `data-dragging` (engine), `data-full-swipe` (engine). Live CSS vars (below). |
| `SwipeableRow.Actions` | `<div>` | `swipeable-row-actions` | `swipeable-row__actions swipeable-row__actions--{start\|end}` | absolutely positioned at its logical edge, full height. `inert` + `visibility:hidden` unless revealed / open. Data: `data-side`, `data-open`, `data-revealed`, `data-full-swipe`. |
| `SwipeableRow.Content` | `<div tabindex=0>` | `swipeable-row-content` | `swipeable-row__content swipeable-row__content--{variant}` | `transform: translate3d(var(--swipeable-row-translation) * dir, 0, 0)`. Focus host for the keyboard alternative. Contains the hidden screen-reader controls. |
| `SwipeableRow.ContentBackground` | `<div aria-hidden>` | `swipeable-row-content-background` | `swipeable-row__content-background` | absolute fill, `-z-1` inside the card, `border-radius: inherit`, clipped. Empty in the default theme. |
| `SwipeableRow.Action` | RAC `Button` (`<button>`) | `swipeable-row-action` | `swipeable-row__action swipeable-row__action--{variant}` (+ `--static`) | wraps children in `<span data-slot="swipeable-row-action-content" class="swipeable-row__action-content">`. String / number children become an `ActionLabel`. Data: `data-variant`, RAC states (`data-pressed`, `data-hovered`, `data-focus-visible`, `data-disabled`), `data-primary` (full-swipe rails). Live var `--swipeable-row-action-progress`. |
| `SwipeableRow.ActionLabel` | `<span>` | `swipeable-row-action-label` | `swipeable-row__action-label swipeable-row__action-label--{variant}` | variant read from the enclosing action. |
| (internal) a11y controls | `<span class="sr-only">` with `<button tabindex=-1>` | `data-swipeable-row-a11y` | `swipeable-row__a11y-actions` | "Open start actions" / "Open end actions" / "Close actions". |

DOM order is the JSX order (the docs put the end rail before the content; stacking is handled with
z-index, so order does not matter visually).

---

## 3. API

### `SwipeableRow` (root)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | – | rails + content |
| `openSide` | `'start' \| 'end' \| null` | – | controlled. A side without a non-empty rail stays closed. A rejected change (parent keeps the old value) springs back. |
| `defaultOpenSide` | `'start' \| 'end' \| null` | `null` | uncontrolled initial value; applied without animation on mount |
| `onOpenSideChange` | `(side) => void` | – | called when the requested side changes (release decision, content press, outside press, `open`/`close`/`reset`, disabling an open row) |
| `variant` | `'standalone' \| 'inline'` | `'standalone'` | |
| `isDisabled` | `boolean` | `false` | disables dragging, keyboard and all actions; disabling an open row closes it (and reports `null`) |
| `openThreshold` | `number` | `0.5` | fraction of the rail width that must be crossed (plus 0.05 s of release velocity) to settle open; clamped 0..1 |
| `activationThreshold` | `number` | `10` | px of horizontal travel before the drag starts (the card then follows from that point, no jump) |
| `failOffsetY` | `number \| [number, number]` | `[-10, 10]` | vertical travel that abandons the drag before it activates (page scroll / selection win). A number `n` means `[-n, n]` |
| `friction` | `number` | `1` | pointer px per card px, min 1 |
| `overshoot` | `boolean` | `true` | past the rail with `overshootFriction`; rubber band toward a side without actions; springs back |
| `overshootFriction` | `number` | `8` | min 1 |
| `closeOnContentPress` | `boolean` | `true` | a click on the uncovered card closes it and is swallowed |
| `accessibilityOpenStartActionsLabel` | `string` | `'Open start actions'` | label of the hidden SR control |
| `accessibilityOpenEndActionsLabel` | `string` | `'Open end actions'` | |
| `accessibilityCloseActionsLabel` | `string` | `'Close actions'` | |
| `enableTrackpadTwoFingerGesture` | `boolean` | `false` | web: horizontal wheel deltas (two-finger trackpad swipes) move the card; settles 140 ms after the last event |
| `animation` | `SwipeableRowRootAnimation` | – | `{springConfig?, borderRadius?: {value?: [rest, dragged], distance?}, state?}` or `false` / `'disabled'` / `'disable-all'` (also turns off the action zoom) |
| `className`, `style`, DOM props | | | root `<div>` |
| **Web additions** | | | |
| `closeOnOutsidePress` | `boolean` | `true` | pointer-down or focus outside the row closes it (gives the iOS "one open row" feel) |
| `isHapticFeedbackEnabled` | `boolean` | from `HapticsProvider` (true) | see §6 |
| `ref` | `Ref<SwipeableRowRootRef>` | – | `HTMLDivElement & {open(side, options?), close(options?), reset()}` |

`SwipeableRowTransitionOptions = {animated?: boolean}` (default `true`). `reset()` cancels any drag,
wheel or spring, jumps closed and reports `null`.

`springConfig` default (fitted to the recording, see §5): `{mass: 1, stiffness: 240, damping: 31}`
(critically damped, ω ≈ 15.5 rad/s). `borderRadius` applies to the inline variant only; default
`value` `[0, card radius]`, `distance` 32 px.

Dropped (React Native gesture-handler specific): `simultaneousWithExternalGesture`,
`requireExternalGestureToFail`, `blocksExternalGesture`.

### `SwipeableRow.Actions`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `side` | `'start' \| 'end'` | – | required |
| `children` | `ReactNode \| (props: SwipeableRowActionsRenderProps) => ReactNode` | – | render function gets live numbers and re-renders every frame while the row moves |
| `className`, DOM props | | | |
| **Web addition** `allowsFullSwipe` | `boolean` | `false` | dragging far past the rail arms a full swipe that runs the outermost action on release |
| **Web addition** `fullSwipeThreshold` | `number` | `0.6` | fraction of the row width; the arming distance is `max(railWidth + 24, rowWidth * threshold)` |

`SwipeableRowActionsRenderProps`: `{side, progress (0..1), translation (logical px), isOpen, close}`.

The rail width is measured automatically (ResizeObserver) and includes the gap to the card.

### `SwipeableRow.Content`

`background?: ReactNode` – `undefined` renders `<SwipeableRow.ContentBackground />`, a node replaces
it, `null` removes it. Plus `className` / DOM props. Do not set `transform` (the gesture owns it).

### `SwipeableRow.ContentBackground`

`children`, `className`, DOM props. Absolute fill clipped to the card radius.

### `SwipeableRow.Action`

| Prop | Type | Default |
|---|---|---|
| `variant` | `'default' \| 'accent' \| 'success' \| 'danger'` | `'default'` |
| `closeOnPress` | `boolean` | `true` (closes the row after `onPress`) |
| `animation` | `{translateX?: {value: [hidden, revealed]}, scale?: {value}, opacity?: {value}, pressScale?: {value?, timingConfig?: {duration?, easing?}}, state?}` or `false` / `'disabled'` | `translateX [15, 0]`, `scale [0.5, 1]`, `opacity [0, 1]`, `pressScale 0.95 / 150 ms` |
| `onPress`, `isDisabled`, all RAC `Button` props | | |

### `SwipeableRow.ActionLabel`

`<span>` props.

### `useSwipeableRow()`

Returns `{openSide, variant, isDisabled, translation, startProgress, endProgress, open, close, reset}`.
Numbers are live (the calling component re-renders while the row moves). Throws outside a row.

### Live CSS custom properties (on the root)

`--swipeable-row-translation` (logical px), `--swipeable-row-offset` (|translation| px),
`--swipeable-row-progress` (max of both, 0..1), `--swipeable-row-start-progress`,
`--swipeable-row-end-progress`, `--swipeable-row-corner-progress` (0..1 over `borderRadius.distance`),
`--swipeable-row-direction` (1 / -1 in RTL). Per action: `--swipeable-row-action-progress`.

---

## 4. Styling (measured; 1 dp = 1 CSS px; recording scale ≈ 1.69 px/dp after the zoom-in)

Scale calibration (review pass): the 16 px title ("Design Team") and the 14 px preview measure
1.68–1.69 frame px per Inter px, the 48 dp avatar 82 px, i.e. a 402 dp wide phone at 1.69 px/dp.

| What | Measured in the video | Web |
|---|---|---|
| Rail gap to card / between actions | settled start rail: Read → card 17.5–18 px ≈ 10 dp; Mute → Delete 14.3 px ≈ 8.5 dp (static in every frame) | `gap-2` (8 px) between actions, inner padding `ps-2.5` (end) / `pe-2.5` (start) → 10 px to the card |
| Rail vertical inset | 11–12 px ≈ 6.5 dp | `py-1.5` |
| Action size | 121.5 px ≈ 72 dp wide for "Mute", "Delete" and "Read" alike, 109.5 px ≈ 64 dp high in a 76 dp row | `min-w-18` (72 px), `px-3`, stretched to the row height minus the `py-1.5` inset |
| Action radius | corner cut 23/15/9/5 px at 4/9/16/24 px in → r ≈ 40 px ≈ 23 dp | `min(32px, var(--radius-3xl))` (= web Card radius, 24 px) |
| Action content | bell / trash glyphs 25 × 27 px ≈ 18 dp icons; "Mute" 46 px and "Delete" 58 px wide = Inter 11 px medium (27.3 / 34.3 px); icon centre → label centre 36.5 px ≈ 21.5 dp | `flex-col gap-1`, `svg size-4.5` (18 px), label `text-[11px] leading-4 font-medium` |
| Open rail width | end (Mute + Delete): card edge moved 272.5 px ≈ 161 dp; start (Read): avatar moved 139.5 px ≈ 82 dp after settling | end 10 + 72 + 8 + 72 = **162 px**, start 72 + 10 = **82 px** (verified in the browser) |
| Card | white `rgb(254)` on page `rgb(247)` (light); `rgb(24,24,27)` on black (dark) | `bg-surface` on `bg-background`; standalone adds `shadow-surface` |
| Action colours | Mute `rgb(239)` / dark `rgb(43,43,45)`; Delete `rgb(245,63,70)` / dark `rgb(220,67,76)` with white label; Read green with dark label | `default`, `danger`, `success` + matching `*-foreground`; `accent` for the docs' Archive |
| Area behind the card | page background (the inline list container has no fill) | rails have no background |
| Inline corners | square at rest, ~24 dp once dragged | radius `rest + (dragged − rest) * corner-progress`, `corner-progress = |t| / 32` |

Tokens only: `bg-surface`, `text-surface-foreground`, `shadow-surface`, `bg-default / -accent /
-success / -danger` with `*-foreground` and `*-hover` (hover only in `@media (hover: hover)`),
`--radius-3xl`, `status-focused`, `status-disabled`, `ring-focus`. Focus: standalone card uses
`status-focused`; inline rows (in a clipped list) use an inset `ring-2 ring-focus ring-inset`.
Actions: `status-focused`, press `scale: 0.95` (150 ms, `--ease-out`), `motion-reduce:transition-none`.

Demo content (stories only): 48 px avatar, 16 px medium title, 14 px muted preview, 12 px time
(accent when unread), 20 px accent count badge, row padding `px-4 py-3.5` → 76 px rows like the video;
inline list `overflow-hidden rounded-3xl`, separators inset 64 px.

---

## 5. Gestures and motion

* **Pointer Events** on the root (touch, pen, mouse). Pointer-downs inside a rail are left to the
  action buttons; nested rows handle their own gestures. Move/up/cancel are tracked on `window`;
  the root captures the pointer once the drag activates.
* **Axis locking:** `touch-action: pan-y pinch-zoom` lets the browser own vertical pans and pinch zoom (it sends
  `pointercancel`, the row snaps back to its state). For mouse/pen, vertical travel outside
  `failOffsetY` before `activationThreshold` abandons the drag (text selection keeps working).
  Activated drags clear the selection and block `selectstart` / native image drag.
* **Travel:** `t = limit(base + Δx·dir / friction)`. Within a rail: 1:1. Past it: `w + (d − w) /
  overshootFriction` (or a hard stop). Toward a side without actions: `d / overshootFriction` (or 0).
  A full-swipe rail follows the pointer up to the row width.
* **Release:** projected = `t + 0.05 s × velocity` (velocity from the last 100 ms of samples, 0 if
  the pointer rested > 60 ms). Opens the side whose `openThreshold × width` is crossed, else closes.
* **Settle spring:** own rAF integrator (semi-implicit Euler, 1/240 s sub-steps) keeping the release
  velocity. Default `{mass 1, stiffness 240, damping 31}`. Video fit (tap-to-close, light 5.00 s):
  progress 8 / 24 / 44 / 56 / 65 / 78 / 94 / 97 / 98 % at 33…333 ms; the web build measures
  10 / 28 / 47 / 62 / 73 / 81 / 91 / 94 / 96 %. Rest when < 0.25 px and < 6 px/s.
* **Rails never move.** Each action's content animates with its own reveal progress
  `clamp((|t| − from) / (to − from))`, where `from/to` are its distances from the rail's outer
  edge — so the outermost action animates first (seen in the video at 1.93–2.90 s: Delete zooms in,
  then Mute). Content `translate` = `lerp(15, 0) px` toward the card (`-x` for end rails in LTR,
  mirrored for start rails and RTL), `scale 0.5→1`, `opacity 0→1`.
* **Inline corners** round from 0 to the card radius over the first 32 px and flatten while settling.
* **Content press** (tap/click without drag) on an open row closes it and swallows the click; the
  click generated by a mouse drag is swallowed too (guard expires after the task).
* **Outside press / focus** (web) closes an open row.
* **Trackpad** (opt-in): horizontal-dominant wheel events move the card, release after 140 ms idle.
* **Reduced motion** (`prefers-reduced-motion` or `[data-reduce-motion="true"]` ancestor) and
  `animation={false}`: settles jump to the end state; gesture tracking stays 1:1.
* **Full swipe (web extension, opt-in `allowsFullSwipe`)**: past the rail the outermost ("primary")
  action stretches (`flex-grow`, rail `min-width = |t|`); when armed its siblings fade and it grows
  over them (negative margin, 200 ms); release runs its `onPress` and closes (or stays open when the
  action has `closeOnPress={false}`).

---

## 6. Haptics (`isHapticFeedbackEnabled`, default from `HapticsProvider`)

Called synchronously in the pointer / wheel handler that detects the moment:

| Moment | Type |
|---|---|
| The drag crosses the open threshold (`openThreshold × rail width`) in either direction, once per crossing | `light` |
| A full-swipe rail becomes armed / disarmed (once per crossing) | `light` |
| A full swipe runs the primary action on release | `medium` |

Verified in the browser with a stubbed `navigator.vibrate`: open → `[10]`, drag closed → `[10]`,
full swipe → `[10, 10]` while dragging and `[18]` on release; nothing with the prop set to `false`.

---

## 7. Accessibility (keyboard and screen-reader alternatives to the swipe)

* Closed rails are `inert` (out of the tab order and the accessibility tree), like the Native rails
  that only become reachable once revealed.
* **Keyboard:** `SwipeableRow.Content` is a tab stop (`tabIndex=0`, `aria-keyshortcuts`) while the row
  has a rail and is enabled. `ArrowLeft` / `ArrowRight` move the card in that direction (LTR: Left
  reveals the end rail, Right the start rail; mirrored in RTL) and move focus to the first action of
  the revealed rail; the opposite arrow closes an open rail. `Escape` (on the content or inside a
  rail) closes and returns focus to the content. `Shift+Tab` from the first action of a rail also
  returns to the content, whatever the DOM order of rails and content (the docs put rails first).
  Tabbing out of the row closes it.
* **Screen readers:** inside the content, visually hidden `<button tabindex="-1">`s mirror the Native
  custom accessibility actions — "Open start actions", "Open end actions" (while that rail is closed)
  and "Close actions" (while open), localised with the three `accessibility*Label` props. Activating
  one opens the rail and focuses its first action, or closes and focuses the content. They are not
  in the Tab order, so sighted keyboard users never land on an invisible control.
* Actions are RAC Buttons (press, focus-visible ring, disabled state).

---

## 8. Demo list (stories)

`BasicUsage` (main, argTypes incl. `isHapticFeedbackEnabled`), `StartEndAndMultipleActions`,
`StandaloneAndInlineVariants` (spaced cards, gapless list, custom/disabled corner animation),
`ControlledState`, `ImperativeControls` (plus a `useSwipeableRow` readout inside the card), `ActionBehavior` (`closeOnPress={false}`, `isDisabled`),
`ScreenReaders` (custom labels), `ActionZoom` (default, custom ranges, static), `RubberBand`
(`overshoot` vs `overshoot={false}`), `AnimatedActionContent` (rail render function), `Example`
(the recorded "Gapless rows for lists" inbox: Read / Mute / Delete) and `FullSwipe` (web extension).
All render inside a 390 × 760 phone frame.

The Native docs page has no separate "Example" section; the `Example` story reproduces the demo
screen from the recordings.

---

## 9. Deviations from Native

* Glass theme (frosted `ContentBackground`, fading action rows) does not exist on the web; the
  default `ContentBackground` is an empty clipped layer.
* `progress` / `translation` are plain numbers (re-render per frame) instead of Reanimated
  SharedValues, plus CSS custom properties for styling without re-renders.
* RN gesture relation props are dropped; `enableTrackpadTwoFingerGesture` maps to wheel events.
* `failOffsetY` as a single number means `[-n, n]`.
* Added: `closeOnOutsidePress` (default `true`), `allowsFullSwipe` / `fullSwipeThreshold` (rails,
  default off), `isHapticFeedbackEnabled`, keyboard arrows/Escape and hidden SR buttons for the
  Native accessibility actions.
* The settle spring default is fitted to the recording; the docs only show
  `{mass: 2, damping: 1000, ...}` without the remaining values.
