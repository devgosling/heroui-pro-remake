# SwipeableTabs — clean-room implementation spec

Slug: `swipeable-tabs` · Origin: **HeroUI Pro Native** (React Native) · Docs: https://heroui.pro/docs/native/components/swipeable-tabs
Native import: `import { SwipeableTabs } from 'heroui-native-pro';` · Web import (this package): `import {SwipeableTabs} from "@heroui/pro";`
Storybook: `Pro/Navigation/SwipeableTabs`

Sources used: the public docs page text (anatomy, usage snippets, API tables), the public docs page of the
open-source heroui-native `Tabs` (SwipeableTabs re-uses its List/ScrollView/Trigger/Label/Separator parts),
and the public demo recordings `swipeable-tabs-docs-light.mp4` / `-dark.mp4` (8.2 s, 1920×1080) plus the
heroui-native `tabs-docs-light.mp4` (secondary variant), analysed frame by frame (1/60 s pixel tracking of
the indicator). No paywalled code, bundles, source maps or prompt endpoints were used.

---

## 1. Purpose

Tabs whose pages sit side by side in a horizontal pager. You can press a trigger or swipe the page. While
you swipe, the indicator follows your finger: it slides and resizes continuously between the two triggers
around the current pager position.

---

## 2. Anatomy

```tsx
<SwipeableTabs>                     // root: value, pager position, lazy-mount state
  <SwipeableTabs.List>              // role="tablist" (pill surface / underline row)
    <SwipeableTabs.ScrollView>      // optional horizontal scroller for many triggers
      <SwipeableTabs.Indicator />   // pill (primary) or underline (secondary)
      <SwipeableTabs.Trigger value="a">   // role="tab"
        <SwipeableTabs.Label>…</SwipeableTabs.Label>
      </SwipeableTabs.Trigger>
      <SwipeableTabs.Separator betweenValues={["a", "b"]} />
    </SwipeableTabs.ScrollView>
  </SwipeableTabs.List>
  <SwipeableTabs.Pager>             // swipeable pager; direct Content children only
    <SwipeableTabs.Content value="a">…</SwipeableTabs.Content>   // role="tabpanel", one page
  </SwipeableTabs.Pager>
</SwipeableTabs>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| Root | `div` | `swipeable-tabs` | `swipeable-tabs` (+ `swipeable-tabs--secondary`) | `data-variant`, `data-animation`, `data-reduce-motion="true"` with `animation="disable-all"`, `data-dragging` while a swipe is active; CSS vars `--swipeable-tabs-progress`, `--swipeable-tabs-page-count` |
| List | `div role="tablist" aria-orientation="horizontal"` | `swipeable-tabs-list` | `swipeable-tabs__list` (+ `--secondary`) | renders the `background` node first |
| ListBackground | `div aria-hidden` | `swipeable-tabs-list-background` | `swipeable-tabs__list-background` | absolute fill behind the list surface |
| ScrollView | `div` (scroller) > `div` (content) | `swipeable-tabs-scroll-view`, `swipeable-tabs-scroll-view-content` | `swipeable-tabs__scroll-view`, `swipeable-tabs__scroll-view-content` (+ `--secondary`) | scrollbar hidden, selected trigger scrolled into view |
| Trigger | `button role="tab"` | `swipeable-tabs-trigger` | `swipeable-tabs__trigger` (+ `--secondary`) | `aria-selected`, `aria-controls`, roving `tabIndex`; `data-selected/-disabled/-hovered/-pressed/-focused/-focus-visible`, `data-value` |
| Label | `span` | `swipeable-tabs-label` | `swipeable-tabs__label` | |
| Separator | `div aria-hidden` | `swipeable-tabs-separator` | `swipeable-tabs__separator` | `data-visible`; inline `opacity` + `transition-duration` |
| Indicator | `div aria-hidden` | `swipeable-tabs-indicator` | `swipeable-tabs__indicator` (+ `--secondary`) | `data-ready`; CSS vars `--swipeable-tabs-indicator-x/-y/-width/-height` written every frame |
| Pager | `div` (viewport) > `div` (track) | `swipeable-tabs-pager`, `swipeable-tabs-pager-track` | `swipeable-tabs__pager`, `swipeable-tabs__pager-track` | `data-swipe-enabled`, `data-dragging`; track `transform: translate3d(-position*100%,0,0)` |
| Content | `div role="tabpanel"` | `swipeable-tabs-content` | `swipeable-tabs__content` | `aria-labelledby` = trigger id, `inert` unless selected, `data-selected`, `data-mounted`, `data-value` |
| lazy placeholder | `div` | `swipeable-tabs-lazy-placeholder` | `swipeable-tabs__lazy-placeholder` | wraps `renderLazyPlaceholder(value)` and centres it |

---

## 3. API (Native docs → web)

### `SwipeableTabs` (root)

| Prop | Type | Default | Web notes |
|---|---|---|---|
| `children` | `ReactNode` | – | List + Pager |
| `value` | `string` | – | controlled |
| `defaultValue` | `string` | – | uncontrolled; falls back to the first page |
| `onValueChange` | `(value: string) => void` | – | fires for press, swipe, keyboard, wheel and `goTo` |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | |
| `lazy` | `boolean` | `false` | pages mount when first shown |
| `renderLazyPlaceholder` | `(value: string) => ReactNode` | – | shown in unmounted pages |
| `animation` | `'disable-all'` | – | indicator snaps, pages jump, CSS transitions off (`data-reduce-motion`) |
| `isHapticFeedbackEnabled` | `boolean` | nearest `HapticsProvider` (true) | **web addition** (user requirement) |
| `className`, `style`, DOM props | | | `...ViewProps` → `div` props |
| `ref` | `Ref<SwipeableTabsRootRef>` | | root `div` with a merged `goTo(value, animated?)` |

`SwipeableTabsRootRef = HTMLDivElement & {goTo(value: string, animated?: boolean): void}`;
`animated` defaults to the Pager's `isPageAnimationEnabled`.

### `List`, `ListBackground`, `ScrollView`, `Trigger`, `Label`, `Separator` (heroui-native Tabs parts)

- **List**: `background?: ReactNode` (rendered behind the surface; web themes register no default, so
  `undefined` renders nothing), `className`, div props.
- **ListBackground**: absolute-fill, clipped to the list radius; `children`, `className`.
- **ScrollView**: `scrollAlign?: 'start' | 'center' | 'end' | 'none'` (default `'center'`),
  `className`, `contentContainerClassName`, div props.
- **Trigger**: `value: string`, `isDisabled?: boolean`, `children?: ReactNode | ((p: {isSelected, value, isDisabled}) => ReactNode)`,
  `className`, press events (`onPress`, `onPressStart`, `onPressEnd`, `onPressChange`, `onPressUp`) instead of RN `PressableProps`, button props.
- **Label**: span props.
- **Separator**: `betweenValues?: string[]` (hidden while the selected value is in it), `isAlwaysVisible?: boolean`,
  `animation?: boolean | 'disabled' | {state?: 'disabled' | boolean; opacity?: {value?: [hidden, visible]; timingConfig?: {duration?: number}}}`
  (default `[0, 1]`, 200 ms), `isAnimatedStyleActive?: boolean` (default true; false = no inline opacity).

### `SwipeableTabs.Indicator`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `animation` | `'disabled' \| false` | – | snap to the selected trigger instead of following the swipe |
| `isAnimatedStyleActive` | `boolean` | `true` | false = position/size vars are not written |
| `children`, `className`, div props | | | |

### `SwipeableTabs.Pager`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | – | only direct `SwipeableTabs.Content` children render; their order is the swipe order |
| `swipeEnabled` | `boolean` | `true` | touch, mouse drag and trackpad/shift-wheel |
| `isPageAnimationEnabled` | `boolean` | `true` | press / value change / `goTo` slide vs jump |
| `onSwipeStart` | `() => void` | – | a horizontal drag started |
| `onSwipeEnd` | `() => void` | – | the pager settled after a drag |
| `overdrag` | `boolean` | `false` | PagerView prop: rubber-band past the first/last page |
| `keyboardDismissMode` | `'none' \| 'on-drag'` | `'none'` | PagerView prop: `on-drag` blurs a focused field in the pager when a swipe starts |
| `className`, div props | | | |
| `ref` | `Ref<SwipeableTabsPagerRef>` | | viewport `div` with the PagerView methods merged in: `setPage(index)` (slides) and `setPageWithoutAnimation(index)` (jumps); both select the page, so `value`/`onValueChange` stay in sync |

### `SwipeableTabs.Content`

`value: string`, `children`, `className`, div props.

### Hooks

`useSwipeableTabs()` → `{value, values, selectedIndex, progress, goTo, getIndex, isMounted, subscribeProgress, onValueChange, nativeID}`.
`progress` is the continuous pager position as a **number** (fractional page index, `1.5` = halfway between
the 2nd and 3rd page); the calling component re-renders on every frame of a swipe/slide.
`subscribeProgress(listener)` is a web addition for per-frame work without re-rendering.
`onValueChange` / `nativeID` cover the heroui-native `useTabs()` return (`onValueChange(v)` = `goTo(v)`,
`nativeID` = the instance id).

Web counterparts of the heroui-native Tabs hooks: `useSwipeableTabsMeasurements()` → `{measurements, setMeasurements, variant}`
(`measurements[value] = {x, y, width, height}` offset box of each trigger; `setMeasurements(key, box)` overrides one
box until the next automatic ResizeObserver measurement) and `useSwipeableTabsTrigger()` →
`{value, isSelected, isDisabled, nativeID}` inside a Trigger.

---

## 4. Styling (measured from the video; 1 dp = 1 CSS px)

Calibration: the phone screen is 681 px wide in the zoomed 1920×1080 frames → 393 dp → 1.733 px/dp.
The list of the demo ("Home Today Upcoming Notes") measures 316–323 dp × 40–41.5 dp; the web port renders
317 × 40 px with the values below.

| Element | Value | Token / utility |
|---|---|---|
| List (primary) | padding 4, radius `--radius × 2.5`, background light `#f0f0f0` / dark `#2a2a2a` | `p-1 bg-default`, `self-start` (hugs its triggers; `self-stretch` for the scrollable list) |
| Trigger | height 32, padding-inline 12, label 16 px medium | `h-8 px-3 text-base font-medium`, radius `--radius × 3` |
| Label colour | unselected grey, selected near-black / white; switches within one video frame (≤ 33 ms), no fade | `text-muted` → `text-segment-foreground`, no colour transition |
| Indicator (primary) | white pill with a soft shadow (dark: `#4e4e54`) | `bg-segment shadow-surface`, radius `--radius × 3` |
| Indicator (secondary) | 2 dp accent underline spanning the trigger, no list background or border | `h-0.5 bg-accent`, list `bg-transparent p-0` |
| Separator | 1 × 16 dp hairline | `w-px h-4 bg-muted/25` |
| Pages | full pager width, content inset by the page itself (demo pages use `p-4`) | pager `flex-1 overflow-hidden`; pages `basis-full h-full overflow-y-auto` |

Hover (`@media (hover: hover)` + `[data-hovered]`): unselected triggers `opacity-70`. Focus: `status-focused`
ring on triggers, inset `ring-focus` on the focused tabpanel. Disabled: `status-disabled`.
`motion-reduce:transition-none` after every transition.

CSS custom properties: root `--swipeable-tabs-progress` (fractional page index, same number as the hook's
`progress`), `--swipeable-tabs-page-count`; indicator `--swipeable-tabs-indicator-x/-y/-width/-height`.
Example: `calc(var(--swipeable-tabs-progress) / (var(--swipeable-tabs-page-count) - 1))` = 0..1 ratio.

---

## 5. Behaviour, gestures and timing

### Swipe (measured)
- Pages follow the finger 1:1; the indicator **interpolates linearly** between the two triggers around the
  position (x and width: at 48 % of the Today→Upcoming swipe the pill was at 48 % of the x distance and 46 % of
  the width change).
- The selection follows the page nearest to the finger **during** the drag: in the video (held drag between
  Upcoming and Notes, 3.2–4.0 s) the label colour flips exactly when the pill passes the halfway point
  (44 % → old label, 52 % → new label) and flips back when the finger drags back below it. Web: every
  pointermove rounds the position (at most one page from the drag start); a change selects that page
  (`onValueChange`, label colour, separators, `animation="disabled"` indicator) with a selection haptic.
- Release: the pager settles on the next page on a flick, else on the nearest page. Video (slow release at
  ~53 %): 80 % after 50 ms, 91 % after 100 ms, 97 % after 150 ms, at rest after ~200 ms.
- Web: drag starts after 8 px when |dx| > |dy| (else the gesture is left to vertical scrolling);
  flick threshold 0.4 pages/s over the last 100 ms; at most one page per swipe; settle = critically damped
  spring (stiffness 900, damping 60, mass 1, ω = 30 rad/s) seeded with the release velocity (measured in
  headless Edge: 87 % after 100 ms, 96 % after 150 ms, 99 % after 200 ms).
- A flick that settles on a page the drag did not reach halfway selects it at release.
- A pointer landing while the pager slides catches it; releasing without moving settles on the nearest page.
- Edges: clamped (`overdrag={false}`) or rubber band `1 - 1/(0.55·d + 1)` (`overdrag`).

### Press / programmatic (measured)
- Tap Upcoming → Today: the label colours switch on the press release (same frame), then the indicator and
  page slide in ~0.30 s with a symmetric ease-in-out curve (pill edge, 30 fps: 6 / 18 / 33 / 50 / 67 / 81 /
  93 / 98 / 100 %). Web: 300 ms `easeInOutSine`, +40 ms per extra page crossed (max 420 ms).
- `isPageAnimationEnabled={false}` / `goTo(v, false)` / `animation="disable-all"` / reduced motion → jump.
- `Indicator animation="disabled"`: the pill snaps to the selected trigger (no swipe tracking).

### Scrollable list
`ScrollView` keeps the selected trigger in view (`scrollAlign`, smooth scroll after the first alignment).
In a ScrollView the list padding moves to the content container so the scrolled triggers clip at the pill edge.

### Lazy pages
With `lazy`, the selected page mounts on render; both neighbours mount when a drag starts; a pressed target
mounts when selected; visited pages stay mounted. Pages crossed by a long slide show `renderLazyPlaceholder`.

### Web input adaptations
- Touch and mouse: Pointer Events with `setPointerCapture`; `touch-action: pan-y pinch-zoom` on the pager and
  on every page (pages are scroll containers), so vertical scrolling and pinch-zoom stay native.
- A click that ends a mouse drag is swallowed (buttons inside a page do not fire); native image/link dragging
  is prevented during a swipe; drags never start on inputs, sliders or `[data-swipeable-tabs-ignore]`.
- Trackpad / shift+wheel: one page per horizontal wheel gesture (50 px threshold, 180 ms idle), ignored when a
  horizontally scrollable child can still scroll.
- RTL: geometry follows the DOM `dir` (drag right = next page, track translates positive, ScrollView scrollLeft
  counted from the right, ArrowLeft = next).

### Haptic moments
`haptic("selection")` (via `useHaptics(isHapticFeedbackEnabled)`) is called synchronously inside the event
handler that decides the outcome:
1. During a swipe, when the nearest page changes and the selection flips (pointermove handler), like a detent.
2. Swipe release whose flick settles on a page the drag had not selected yet (pointerup handler).
3. Trigger press by touch/mouse/pen that changes the selection (RAC `usePress` handler, fires on click).
Keyboard, wheel and programmatic changes (`goTo`, `value`, Pager `setPage*`) are silent.

---

## 6. Accessibility

- WAI-ARIA tabs pattern: List `role="tablist"` (`aria-orientation="horizontal"`, give it an `aria-label`),
  Triggers `role="tab"` with `aria-selected`, `aria-controls`, roving `tabIndex` (selected = 0),
  disabled triggers `aria-disabled` and skipped; pages `role="tabpanel"` with `aria-labelledby`, `tabIndex=0`
  on the selected page; inactive pages are `inert` (not focusable, hidden from AT, still visible mid-swipe).
- Keyboard (automatic activation, like RAC Tabs): ArrowRight/ArrowLeft (RTL-aware, wrapping), Home, End move
  focus and select; the pager slides. Enter/Space press a trigger. Tab moves into the selected tabpanel.
- Press/hover/focus-visible come from React Aria `usePress`, `useHover`, `useFocusRing`.
- Every gesture has an alternative: swipe ⇄ press a trigger or use the arrow keys.
- Indicator, separators and list background are `aria-hidden`.

---

## 7. Demo list (stories)

| Story | Docs section |
|---|---|
| `BasicUsage` (main, argTypes: `variant`, `lazy`, `animation`, `isHapticFeedbackEnabled`) | Basic usage |
| `Variants` (primary + secondary screens) | Variants |
| `ScrollableList` (9 genres, `List className="self-stretch"`, `scrollAlign="center"`) | Scrollable list |
| `Separators` | Separators |
| `Controlled` (external Previous/Next) | Controlled |
| `ImperativeNavigation` (`goTo("inbox")`, `goTo("settings", false)`, Pager ref `setPage(1)`) | Imperative navigation |
| `LazyPages` (`lazy`, Spinner placeholder, mount log) | Lazy pages |
| `PagerBehavior` (switches for `swipeEnabled`, `isPageAnimationEnabled`) | Pager behavior |
| `IndicatorWithoutSwipeTracking` (+ root `animation="disable-all"` switch) | Indicator without swipe tracking |
| `ProgressHook` (`useSwipeableTabs` page dots driven by `progress`) | Hooks |
| `Example` (controlled + lazy account screen, three pages) | Example |
| `Planner` (the demo recording: Home / Today / Upcoming / Notes skeleton screens, variant toggle) | video |

All stories render inside a 390 px phone frame (`bg-background`, rounded, overflow hidden).

---

## 8. Deviations from Native

- The pager is a custom pointer-driven track (no `react-native-pager-view`); PagerView-only props
  (`offscreenPageLimit`, `orientation`, `scrollEnabled`) are not implemented. All pages stay in the DOM (unless
  `lazy`). The Pager ref is the viewport `div` with `setPage` / `setPageWithoutAnimation` merged in.
- `progress` is a plain number (re-render per frame) instead of a Reanimated `SharedValue`;
  `subscribeProgress` exists for imperative use.
- During a swipe, `onValueChange` fires each time the nearest page changes (halfway crossings), which is what
  the Native label colour shows in the video; a drag that crosses back and forth reports each crossing.
- `ListBackground` has no theme default (web themes register none); `background` only renders what is passed.
- `useTabs` / `useTabsMeasurements` / `useTabsTrigger` are exposed as `useSwipeableTabs`,
  `useSwipeableTabsMeasurements`, `useSwipeableTabsTrigger`.
- Web additions: `isHapticFeedbackEnabled`, mouse drag, trackpad wheel paging, `keyboardDismissMode` blur,
  `--swipeable-tabs-progress` CSS variable, keyboard tab navigation.
- SSR: without `defaultValue`/`value` the first page is only known after the pager registers on the client,
  so the server HTML has no selected trigger.
