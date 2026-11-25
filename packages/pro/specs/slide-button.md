# Slide Button (`slide-button`) — clean-room implementation spec

Origin: **HeroUI Pro Native** (`heroui-native-pro`), ported to the web as part of `@heroui/pro`.

Sources (public only, observed 2026-11-25): the docs page https://heroui.pro/docs/native/components/slide-button
(anatomy, usage snippets, example, API tables, hook) and the two docs demo videos
`slide-button-docs-light.mp4` (4.5 s) and `slide-button-docs-dark.mp4` (5.3 s), analysed frame by frame (0.033 s steps
around the gestures) with pixel probes. The sibling ProgressButton docs video was looked at once to confirm what the
`default` variant looks like in that component family. No paywalled source, JS bundle, source map, npm/GitHub source,
"Copy prompt"/MCP/llms endpoint was read.

## 1. Purpose

A slide-to-confirm button: the user drags a thumb across a pill-shaped track; releasing it past a completion threshold
confirms the action (purchase, unlock, delete ...). Below the threshold the thumb springs back. A soft progress fill
follows the thumb and reveals an "overlay" label ("Unlocked!") while the "underlay" label ("Slide to unlock") stays
visible to the right of the thumb. Optional auto reset, controlled completion and progress-driven custom content.

## 2. Anatomy

```tsx
import {SlideButton, useSlideButton} from "@heroui/pro";

<SlideButton>
  <SlideButton.UnderlayContent>
    <SlideButton.Label>...</SlideButton.Label>
  </SlideButton.UnderlayContent>
  <SlideButton.OverlayContent>
    <SlideButton.Label>...</SlideButton.Label>
  </SlideButton.OverlayContent>
  <SlideButton.Thumb />
</SlideButton>
```

| Part | Element | `data-slot` | BEM class | Notes |
| --- | --- | --- | --- | --- |
| `SlideButton` (Root) | `div` (slot `container`) | `slide-button` | `.slide-button`, `.slide-button--{variant}` | Padded track. State: `data-completed`, `data-disabled`, `data-dragging`, `data-variant`. Inline `--slide-button-progress`. |
| ↳ content container | `div` (slot `contentContainer`) | `slide-button-content-container` | `.slide-button__content` | Area the thumb travels in; `container-type: inline-size`. |
| ↳ live region | `span[role=status]` | — | `.slide-button__live` | Visually hidden; announces the overlay text on completion. |
| `SlideButton.ContainerBackground` | `div[aria-hidden]` | `slide-button-container-background` | `.slide-button__background` | Absolute fill behind the content; passed through the root `background` prop. |
| `SlideButton.UnderlayContent` | `div[aria-hidden]` > `div#id` | `slide-button-underlay-content` > `…-content-container` | `.slide-button__underlay` > `.slide-button__underlay-content` | End-anchored clip wrapper; inner content is track-wide. |
| `SlideButton.OverlayContent` | `div[aria-hidden]` > `div` | `slide-button-overlay-content` > `…-content-container` | `.slide-button__overlay` > `.slide-button__overlay-content` | Start-anchored clip wrapper (the fill); inner content is track-wide and carries the fill color. |
| `SlideButton.Thumb` | `button[type=button]` | `slide-button-thumb` | `.slide-button__thumb` | Draggable handle; default chevron `svg[data-slot=slide-button-thumb-icon]` (`.slide-button__thumb-icon`). State: `data-dragging`, `data-completed`, `data-disabled`, `data-focus-visible`, `data-animated-style="false"`. |
| `SlideButton.Label` | `span` | `slide-button-label` | `.slide-button__label` | Text colored by the variant. |

Paint order inside the content container: underlay (z 0) < overlay fill (z 1) < thumb (z 2).

## 3. API

### `SlideButton` (root)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode \| (props: SlideButtonRenderProps) => ReactNode` | — | Parts, or a render function receiving the slide state |
| `variant` | `"default" \| "accent" \| "success" \| "danger"` | `"default"` | Color scheme |
| `isCompleted` | `boolean` | — | Completed state (controlled) |
| `isDefaultCompleted` | `boolean` | `false` | Initial completed state (uncontrolled); the thumb starts at the end |
| `isDisabled` | `boolean` | `false` | Disables the interaction (`status-disabled`, thumb `disabled`) |
| `completionThreshold` | `number` | `0.85` | Progress (0–1) at/after which releasing completes |
| `autoReset` | `boolean` | `false` | Reset automatically after completion |
| `autoResetDelay` | `number` | `1000` | Delay (ms) before the auto reset |
| `background` | `ReactNode` | — | Layer behind the content (usually `<SlideButton.ContainerBackground>`). Web has no theme-registered default, so `undefined`/`null` render nothing |
| `className` / `style` | `string` / `CSSProperties` | — | Applied to the `container` slot |
| `classNames` | `{container?, contentContainer?}` | — | Per-slot classes |
| `styles` | `{container?, contentContainer?}` (`CSSProperties`) | — | Per-slot inline styles (RN `ViewStyle` → web `CSSProperties`) |
| `onCompleteChange` | `(isCompleted: boolean) => void` | — | Completed state changed (true on completion, false on reset) |
| `onComplete` | `() => void` | — | The slide action completed |
| `onReset` | `() => void` | — | The slider reset to the start (fires when the completed state flips back to false: auto reset, `reset()`, controlled change) |
| `animation` | `boolean \| "disabled" \| "disable-all" \| {resetSpringConfig?}` | — | `false`/`"disabled"`: no reset animation; `"disable-all"`: no animation at all; object: custom reset spring |
| `isHapticFeedbackEnabled` | `boolean` | nearest `HapticsProvider` (true) | Web addition, see §6 |
| `...div props` | | | Forwarded to the container (`onReset` DOM event is replaced by the callback above) |

`SlideButtonRenderProps`: `progress` (number 0–1, updates per frame), `isCompleted`, `trackWidth`, `trackHeight`,
`thumbWidth`, `thumbHeight` (px numbers instead of RN SharedValues), `isDisabled`, `variant`.

### `SlideButton.ContainerBackground`

`children`, `className`, all `div` props. Absolute fill (`inset: 0`, inherited radius, clipped), `pointer-events: none`.

### `SlideButton.UnderlayContent` / `SlideButton.OverlayContent`

`children`, `className` (→ `container`), `classNames {container?, contentContainer?}`, `styles {container?, contentContainer?}`,
all `div` props.

### `SlideButton.Thumb`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | chevron-right icon | Custom thumb content (`null`/`undefined` → chevron) |
| `className` | `string` | — | Additional classes |
| `isAnimatedStyleActive` | `boolean` | `true` | `false` drops the position transform (`translate: none`) so the consumer can position the thumb, e.g. from `--slide-button-progress` |
| `iconProps` | `{size?: number (20), color?: string}` | — | Default chevron props; ignored with `children` |
| `animation` | `boolean \| "disabled" \| {springConfig?}` | — | Snap-back / snap-to-end spring; `false`/`"disabled"` snaps instantly |
| `...button props` | | | `aria-label`/`aria-labelledby` override the automatic name; event handlers are chained |

### `SlideButton.Label`

`children`, `className`, all `span` props.

### `useSlideButton()`

Must be used inside `SlideButton` (throws otherwise). Returns `progress` (number, re-renders the caller per frame),
`isCompleted`, `trackWidth`, `trackHeight`, `thumbWidth`, `thumbHeight`, `completionThreshold`, `isDisabled`, `variant`,
`reset()`.

Spring config (`SlideButtonSpringConfig`): `{damping?: 120, stiffness?: 900, mass?: 4}` (same defaults as Native).

## 4. Styling and tokens

Measured on the light video at 2.135 px/dp (phone screen 839 px = 393 dp; the track spans the screen minus the demo's
20 dp side padding → 353 dp, ratio 0.898 confirmed):

| Element | Measured (dp) | Web |
| --- | --- | --- |
| Track height | 54–55 | `h-14` (56 px) |
| Track inset | ~6.4 | `--slide-button-padding: 0.375rem` |
| Thumb | 77.5 × 42.4 (ratio 1.82) | `w-20` × 44 px (ratio 1.82) |
| Track / thumb radius | fully rounded | `--slide-button-radius: calc(var(--radius) * 3.5)` (28 px = pill at the default radius), thumb `radius - padding` (22 px), so `--radius` changes apply concentrically |
| Chevron | ~7.3 × 12.3 glyph in a 20 dp box, ~1.75 dp stroke, round caps | inline SVG 20 × 20, `M7.75 4.5 13.25 10l-5.5 5.5`, stroke 1.75 |
| Label | cap height ≈ 0.242 × thumb height → ~14.6 px Inter, medium | `text-sm font-medium` |

Colors (pixel probes, light / dark) mapped to tokens:

| Element | Light rgb | Dark rgb | Token |
| --- | --- | --- | --- |
| Screen | 246 | 2–5 | `--background` |
| Track | 235,235,235 | 37,37,39 | `--default` (`bg-default`) |
| Fill | 201,221,236 (= 15 % accent over the track) | 35,52,72 (same mix in dark) | `--accent-soft` |
| Thumb | 255 + soft drop shadow below (2–4 dp) | 23,23,25, no shadow | `--surface` + `shadow-surface` (transparent in dark) |
| Chevron | ~100,100,105 | 158,158,160 | `--muted` |
| Label | ~52,140,234 | accent blue | `--accent` |

Variant table (`--slide-button-label-color`, `--slide-button-fill`, `--slide-button-thumb-background`,
`--slide-button-thumb-foreground` on the root; parts read them, so a Label inherits the variant color):

| Variant | Label | Fill | Thumb | Icon |
| --- | --- | --- | --- | --- |
| `default` (video) | `accent` | `accent-soft` | `surface` | `muted` |
| `accent` | `accent` | `accent-soft` | `surface` | `accent` |
| `success` | `success` | `success-soft` | `surface` | `success` |
| `danger` | `danger` | `danger-soft` | `surface` | `danger` |

Only the default variant is visible in the videos; the other three are inferred (see §9). The track stays `bg-default`
and the thumb stays `surface` for every variant: the docs Example renders `<Spinner color="success" />` inside the
Thumb of a `variant="success"` SlideButton, which is only visible on a neutral thumb, and that spinner takes the place
(and color) of the chevron, so the icon carries the variant color.

Geometry in CSS (no per-frame React render):
- thumb: `translate: calc(progress * (100cqw - 100%) * direction) 0` (`100cqw` = content width, `100%` = thumb width,
  direction −1 in RTL)
- overlay clip width: `thumbWidth + progress * (100cqw - thumbWidth)` (fill ends at the thumb's trailing edge, so its
  rounded end is always hidden under the thumb; at rest only an anti-aliased fringe shows, as in the video)
- underlay clip width: `100cqw - thumbWidth/2 - progress * (100cqw - thumbWidth)` (edge under the thumb's centre)
- inner content containers are `100cqw` wide and anchored to their side, so labels never move; they are only revealed.

## 5. Gestures and motion (measured)

- **Drag**: pointer down on the thumb only. The thumb follows the finger 1:1 (no rubber band; clamped to 0..1). In the
  video the finger reaches the end in ~0.25 s, rests there ~0.45 s, and lifts at ~2.17 s.
- **Completion happens on release**, not when crossing the threshold: the overlay label is revealed purely by the clip
  while dragging. Released at ≥ `completionThreshold` → snap to the end + complete; below → spring back.
- **Auto reset**: the thumb starts returning 0.93 s after the release (video demo uses the default 1000 ms delay).
- **Spring** (reset and snap): positions measured every frame (30 fps) during the reset fit the critically damped
  spring `x(t) = (1 + ωt)·e^(−ωt)` with ω = √(900/4) = 15 rad/s, ζ = 120 / (2·√(900·4)) = 1.0 almost exactly
  (t = 0.09 s: 0.571 measured vs 0.609; 0.19 s: 0.203 vs 0.223; 0.29 s: 0.062 vs 0.069; 0.39 s: 0.021 vs 0.017).
  Duration to rest ≈ 0.55 s, no overshoot. Implemented as a small rAF integrator (1 ms steps) with the Native defaults;
  release velocity (smoothed pointer velocity, dropped if the pointer rested > 80 ms) is the initial velocity. The
  springs use overshoot clamping: a fling released before the end stops at the track end (or start) instead of
  carrying the thumb past it (without clamping a fast fling released at 0.9 reached progress 1.14, ~37 px outside the
  track).
- No thumb scale / color change while pressed (thumb size identical at rest, dragging and at the end).
- **Reduced motion** (`prefers-reduced-motion: reduce`) and `animation="disable-all"`: positions jump to their end state.
- **Touch scrolling**: the thumb has `touch-action: pan-y`, so vertical swipes still scroll the page (they cancel the
  drag → spring back, no completion); horizontal drags belong to the thumb. Pointer capture keeps the drag alive outside
  the thumb. Works with touch, pen and mouse (primary button).
- Grabbing the thumb during the reset animation stops the spring and continues from the current position.
- While completed the thumb is inert (`aria-disabled`); it becomes draggable again after a reset.

## 6. Haptics (web addition — user requirement)

`isHapticFeedbackEnabled` (default: nearest `HapticsProvider`, which defaults to `true`) → `useHaptics()`.

| Moment | Haptic | Where it is called |
| --- | --- | --- |
| Thumb released at/after the threshold (completion by gesture) | `haptic("medium")`, exactly once | synchronously in the `pointerup` handler that decides completion |
| Completion via keyboard / screen reader (Enter, Space, End, ArrowRight/ArrowLeft in RTL, virtual click) | `haptic("medium")` | synchronously in the `keydown` / `click` handler |
| Cancelled drag, reset, controlled change, auto reset | none | — |

## 7. Accessibility

- The thumb is a native `<button type="button">`, named by the underlay content (`aria-labelledby` → "Slide to …")
  unless the consumer passes `aria-label`/`aria-labelledby`. Underlay and overlay content are `aria-hidden` (they are
  visual duplicates).
- **Keyboard alternative**: Tab focuses the thumb (focus ring via `status-focused` on `data-focus-visible`);
  Enter / Space (button click with `detail === 0`), End, or ArrowRight (ArrowLeft in RTL) complete the action with the
  same snap animation and haptic.
- **Screen readers**: activating the button (VoiceOver/TalkBack double tap → virtual click, detected like React Aria's
  virtual-pointer heuristic) completes the action; a real mouse/touch click without a drag does not (a deliberate slide
  is required, as on Native).
- On a user completion (gesture, keyboard or screen reader) the overlay text ("Confirmed!") is written into a visually
  hidden `role="status"` live region once the completed render has committed (so render-function content that switches
  on `isCompleted` is announced in its final form), and the thumb gets `aria-disabled="true"`; the region is cleared on
  reset.
- Disabled: thumb `disabled` (not focusable), root `data-disabled` + `status-disabled`.
- RTL: the thumb travels right → left, the fill grows from the inline start (logical properties + `--slide-button-direction`).

## 8. Demos (stories, `Pro/Buttons/SlideButton`)

Native demos are phone screens, so every story renders inside a 390 × 640 phone frame (`bg-background`, rounded,
centered column `max-w-sm`, 20 px side padding) like the video.

| Story | Docs section | Content (own texts) |
| --- | --- | --- |
| `Default` | Basic usage | "Slide to send", empty overlay; argTypes `variant`, `isDisabled`, `autoReset`, `autoResetDelay`, `completionThreshold`, `isHapticFeedbackEnabled` |
| `Variants` | Variants | accent "Slide to start/Started!", success "Slide to accept/Accepted!", danger "Slide to remove/Removed!" |
| `AutoReset` | Auto reset | `autoReset autoResetDelay={2000}`, "Slide to check in/Checked in!" + counter |
| `Disabled` | Disabled | `isDisabled`, "Checkout unavailable" |
| `Controlled` | Controlled | `isCompleted` + `onCompleteChange`, `autoReset autoResetDelay={1500}`, "Slide to sign/Signed!", external toggle |
| `RenderFunctionChildren` | Render function children | success + autoReset; underlay label fades with `progress`, overlay shows the percentage / "Paid!" |
| `PurchaseExample` | Example | success, autoReset 2500, `onCompleteChange` + `onReset`, overlay label fades in over progress 0.5→1 via `useSlideButton()`, success spinner in the thumb while ordered |

## 9. Deviations from Native / open questions

- `progress`, `trackWidth`, … are plain numbers instead of Reanimated SharedValues; `useSlideButton()` and render-function
  children re-render per frame. Styling should prefer the `--slide-button-progress` custom property (no re-render).
- RN-only props dropped/mapped: `styles` uses `CSSProperties`; `isAnimatedStyleActive` maps to the CSS transform;
  springs are reimplemented (same parameters).
- `background`: there is no theme-registered default background on the web (Native mounts a glass layer for glass
  themes), so nothing is rendered unless a node is passed.
- Variant colors other than `default` are not shown in any public video; the mapping in §4 is inferred (variant colors
  the label, the fill and the chevron; the thumb stays `surface`, as required by the docs Example's success spinner in
  the success thumb). The docs call the default icon color "the variant foreground color"; for `default` that measures
  as `muted`.
- Thumb width: the zoomed video frames give a thumb/inner-height ratio of ≈ 1.79 (≈ 78 × 44); `w-20` (80 × 44) is kept
  on the theme scale.
- Label size: the video label is ~0.30 × the track width (≈ 106 dp for "Slide to unlock"), between Inter 500 at
  14 px (98 px) and 16 px (111 px); `text-sm` is used to stay on the theme scale (same as the OSS Button text).
- `onReset` timing: fired when the completed state returns to false (start of the reset animation).
- A controlled parent that ignores `onCompleteChange(true)` leaves the thumb at the end but not completed; `reset()`
  returns it.
- Keyboard/screen-reader activation and the live-region announcement are web additions; so are haptics on the web
  (`navigator.vibrate` on Android, the iOS 18 switch tick, no-op on desktop).
