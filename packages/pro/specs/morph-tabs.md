# MorphTabs — clean-room web port spec

Slug: `morph-tabs` · Origin: **HeroUI Pro Native** (React Native) · Docs: https://heroui.pro/docs/native/components/morph-tabs
Storybook: `Pro/Navigation/MorphTabs` · Import (this repo): `import {MorphTabs} from "@heroui/pro";`

Sources used: the public Native docs page (anatomy, usage snippets, API tables, read as text) and the public demo
videos `morph-tabs-docs-light.mp4` (9.5 s) and `morph-tabs-docs-dark.mp4` (11.1 s), measured frame by frame
(30 fps around every gesture). No Pro source code, bundles, prompts or MCP endpoints were used.

---

## 1. Purpose

A tab bar whose pills morph while you swipe between pages: the active pill shows icon + label and takes the
free row space, inactive pills collapse to an icon. The morph is driven continuously by the pager position,
so mid-swipe two neighbouring pills share the space and their labels clip in/out.

---

## 2. Anatomy

```tsx
<MorphTabs>                                // root: owns value, pager position, lazy-mount state
  <MorphTabs.List>                         // header row (role="tablist"), may hold other content (Avatar…)
    <MorphTabs.Trigger value="home">       // pill (role="tab")
      {/* auto: <MorphTabs.TriggerBackground/> (absolute fill) unless `background` is given */}
      <MorphTabs.Icon>…</MorphTabs.Icon>   // icon wrapper, opacity 0.5 → 1
      <MorphTabs.Label>Home</MorphTabs.Label> // clipping container (max-width 0 → text width) + text
    </MorphTabs.Trigger>
  </MorphTabs.List>
  <MorphTabs.Pager>                        // swipeable pager (pointer drag + spring)
    <MorphTabs.Content value="home">…</MorphTabs.Content> // one page (role="tabpanel")
  </MorphTabs.Pager>
</MorphTabs>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| `MorphTabs` | `div` | `morph-tabs` | `.morph-tabs` | flex column; carries `--morph-tabs-progress` |
| `MorphTabs.List` | `div role="tablist" aria-orientation="horizontal"` | `morph-tabs-list` | `.morph-tabs__list` | arrow-key navigation |
| `MorphTabs.Trigger` | `button type="button" role="tab"` | `morph-tabs-trigger` | `.morph-tabs__trigger` | `aria-selected`, `aria-controls`, roving `tabIndex` |
| `MorphTabs.TriggerBackground` | `span aria-hidden` | `morph-tabs-trigger-background` | `.morph-tabs__trigger-background` | absolute fill, empty by default |
| `MorphTabs.Icon` | `span aria-hidden` | `morph-tabs-icon` | `.morph-tabs__icon` | |
| `MorphTabs.Label` | `span` (container) › `span` (text) | `morph-tabs-label` / `morph-tabs-label-text` | `.morph-tabs__label` / `.morph-tabs__label-text` | text stays in the a11y tree → tab name |
| `MorphTabs.Pager` | `div` › `div` (track) | `morph-tabs-pager` / `morph-tabs-track` | `.morph-tabs__pager` / `.morph-tabs__track` | `touch-action: pan-y pinch-zoom` |
| `MorphTabs.Content` | `div role="tabpanel"` | `morph-tabs-content` | `.morph-tabs__content` | non-selected pages are `inert` |

Pages are matched to triggers by `value`; the order of the `MorphTabs.Content` children of the Pager is the
swipe order. Only direct `MorphTabs.Content` children of the Pager are rendered (as on Native).

---

## 3. API (Native names kept, RN-only props adapted)

### `MorphTabs` (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | – | controlled selected page |
| `defaultValue` | `string` | first page | uncontrolled |
| `onValueChange` | `(value: string) => void` | – | tap, swipe, keyboard or `goTo` |
| `lazy` | `boolean` | `false` | mount pages on first show (selected page, both neighbours at drag start, target of a tap / `goTo`); visited pages stay mounted |
| `renderLazyPlaceholder` | `(value: string) => ReactNode` | – | rendered in unmounted pages |
| `animation` | `"disable-all"` | – | pills snap to the selected state, pages switch without slide |
| `isHapticFeedbackEnabled` | `boolean` | nearest `HapticsProvider` (true) | web addition |
| `ref` | `Ref<MorphTabsRootRef>` | – | the root `div` with a merged `goTo(value, animated?)` |
| …`div` props | | | `className`, `style`, `id`, aria… |

`goTo(value, animated?)`: `animated` defaults to the pager's `isPageAnimationEnabled`.

### `MorphTabs.List`
`div` props (`className`, `aria-label`, …). Any non-trigger child keeps its natural size.

### `MorphTabs.Trigger`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | – | page it selects |
| `children` | `ReactNode \| (props: MorphTabsTriggerRenderProps) => ReactNode` | – | render props: `isSelected`, `value`, `index` (-1 without page), `isDisabled` (+ web: `isPressed`, `isHovered`, `isFocusVisible`) |
| `isDisabled` | `boolean` | `false` | not pressable / skipped by arrow keys; the page stays reachable by swiping |
| `background` | `ReactNode \| null` | – | `undefined` → `<TriggerBackground/>`, node → replacement, `null` → none |
| `animation` | `boolean \| "disabled" \| {flexGrow?: {value?: [number, number]}}` | follow | `[inactive, active]`, default `[0, 1]`; `false`/`"disabled"` snap |
| `isAnimatedStyleActive` | `boolean` | `true` | `false`: no morph flex-grow (style it yourself) |
| `onPress`, `onPressStart`, `onPressEnd`, `onPressChange`, `onPressUp` | React Aria press events | – | web equivalent of RN `Pressable` props |
| `className`, `style`, … | | | flex-grow is driven by the morph (override with a utility if needed) |

### `MorphTabs.TriggerBackground`
`span` props. Absolute-fill layer behind the pill content; empty by default (Native fills it only under its
glass theme). Use it to add e.g. a coloured active background that reads `--morph-tabs-trigger-progress`.

### `MorphTabs.Icon`
`span` props + `animation` (`{opacity?: {value?: [number, number]}}`, default `[0.5, 1]`, or `false` to snap)
+ `isAnimatedStyleActive`. Icons are never mirrored in RTL.

### `MorphTabs.Label`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | – | label text |
| `className` | `string` | – | classes for the **text** (as on Native) |
| `classNames` | `{container?: string; text?: string}` | – | slot classes |
| `styles` | `{container?: CSSProperties; text?: CSSProperties}` | – | slot styles |
| `numberOfLines` | `number` | `1` | > 1 uses `-webkit-line-clamp` |
| `ellipsizeMode` | `"head" \| "middle" \| "tail" \| "clip"` | `"clip"` | web: `head`/`middle` fall back to `tail` (CSS can only ellipsize the end) |
| `animation` | `{opacity?: {value?: [number, number]}}` \| boolean \| `"disabled"` | `[0, 1]` | |
| `isAnimatedStyleActive` | `boolean` | `true` | `false`: label always fully shown |

### `MorphTabs.Pager`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `swipeEnabled` | `boolean` | `true` | pointer drag / trackpad swipe |
| `isPageAnimationEnabled` | `boolean` | `true` | presses / value changes slide (else jump) |
| `overdrag` | `boolean` | `false` | rubber-band past the first/last page |
| `keyboardDismissMode` | `"none" \| "on-drag"` | `"on-drag"` | blur a focused field inside the pager when a drag starts |
| `onSwipeStart` | `() => void` | – | drag recognised |
| `onSwipeEnd` | `() => void` | – | pager settled after a drag |
| `ref` | `Ref<MorphTabsPagerRef>` | – | pager `div` + `setPage(index)` / `setPageWithoutAnimation(index)` |
`offscreenPageLimit` and other `react-native-pager-view` props have no web meaning and are not accepted.

### `MorphTabs.Content`
`value` + `div` props. Pages scroll vertically on their own (`overflow-y: auto`) — the web stand-in for the
`ScrollView` Native asks you to put inside.

### Hooks
- `useMorphTabs()` → `{value, values, selectedIndex, progress, goTo, getIndex, isMounted}` (throws outside a root).
  `progress` is a `MorphTabsProgress` (`.value`, `.get()`, `.subscribe(listener)`), the web analogue of the
  Native `SharedValue`: it changes every frame without re-rendering.
- `useMorphTabsProgress()` → the pager position as a reactive `number` (re-renders on every frame; web addition).
- `useMorphTabsTrigger()` → `{value, index, isSelected, isDisabled}` (throws outside a trigger).

---

## 4. Measurements (light video, iPhone 16 Pro 402 dp; zoomed segment scale 1.69 px/dp, calibrated with the
Dynamic Island 126 × 37 dp)

| What | Measured | Web value |
|---|---|---|
| List padding | 16 dp left/right, ~2 dp below pills before page padding | `px-4 py-0.5` |
| Gap between pills / avatar | 8 dp | `gap-2` |
| Pill height | 42.6 dp | `h-10.5` (42 px) |
| Collapsed pill width | 51–53 dp (icon centred) | `px-4.25` + 18 px icon = 52 px |
| Pill radius | fully rounded | `rounded-3xl` (3 × `--radius` = 24 px ≥ half the height at the default radius, so fully round; follows `--radius` like the OSS Button / Tabs) |
| Pill colour | 238 on 247 background (light), dark grey on black (dark) | `bg-default` on `bg-background` |
| Icon | house glyph 15.4 dp / calendar 16 dp tall = 18 dp box (the "Home" text measures identically in video and web, so the scale is exact), active foreground, inactive 50 % | `size-4.5` on the `svg` (a size utility on the icon overrides it), opacity `[0.5, 1]` |
| Icon ↔ label gap | ~6 dp | `ps-1.5` on the label text (collapses with the label) |
| Label | ~16 dp medium, foreground | `text-base font-medium` |
| Avatar in demo | 43 dp | story uses `Avatar` with `size-10.5` |

Colours: only theme tokens — `--default` (pill), `--foreground` (icon/label), `--background` (screen),
`--focus` (keyboard ring), `--default-hover` (desktop hover).

---

## 5. Motion

- **Morph = pager position.** For a trigger at page index `i` and pager position `p` (continuous):
  `t = max(0, 1 - |p - i|)` (`--morph-tabs-trigger-progress`, 0..1).
  - pill `flex-grow = lerp(grow[0], grow[1], t)` (default `[0, 1]`): the active pill takes the leftover row
    space, two neighbours split it mid-swipe (frame 2.00 s: "Hor" / "Tc");
  - label container `max-width = labelWidth · t` (text clipped at its end, `ellipsizeMode="clip"`); the text
    keeps its natural (`max-content`) width and a `ResizeObserver` re-measures it, so a web font load or a
    runtime `--font-sans` change updates the expanded width without a React render,
    label `opacity = lerp(0, 1, t)`;
  - icon `opacity = lerp(0.5, 1, t)`.
  Everything is computed in CSS from `--morph-tabs-progress` (root) and `--morph-tabs-index` (trigger), so a
  drag writes a single custom property per frame and React does not re-render. `.morph-tabs__content` resets
  the variable, so page content is not restyled every frame (measured: style recalc per frame drops from
  ~5 ms to ~1 ms with 400 nodes); read `useMorphTabsProgress()` inside pages instead.
- Pills keep their natural width (padding + icon); only the active label shrinks/clips when the row is too
  narrow.
- **Drag** follows the finger 1:1 (`p = p0 ∓ dx / pagerWidth`, sign flipped in RTL); edges clamp unless
  `overdrag` (rubber band ×0.35).
- **Release** (frames 2.12–2.42 s and 6.05–6.38 s): target = next/previous page when the release velocity is
  ≥ 0.5 page/s in that direction, else the nearest page (one page per swipe). Settles with a critically damped
  spring, stiffness 300 (ω ≈ 17 rad/s) starting at the release velocity — ≈ 300 ms, no overshoot, like the
  video. A slow drag past < 50 % snaps back (4.2–5.5 s).
- **Tap / `goTo` / controlled change** (7.30–7.53 s for one page, 8.13–8.45 s for two pages): a tween through
  the intermediate pages (the "Today" pill expands briefly on the way), `cubic-bezier(0.42, 0, 0.58, 1)`,
  280 ms + 40 ms per extra page (max 400 ms).
- `animation="disable-all"`, `isPageAnimationEnabled={false}`, `prefers-reduced-motion` or HeroUI's
  `data-reduce-motion="true"`: the pager jumps; with `disable-all` (or a part's `animation={false}`) the pills
  snap to the selected state instead of following the drag.
- Pressed pill: `scale(0.97)` (150 ms); desktop hover: `--default-hover`.

## 6. Haptics (web addition, user requirement)

`haptic("selection")` (via `useHaptics(isHapticFeedbackEnabled)`) is called synchronously inside the event
handler that decides a new selection:
1. pointer up of a swipe that settles on another page (not when it snaps back);
2. press of a trigger whose page is not selected yet (React Aria `onPress`, pointer up / Enter / Space);
3. arrow / Home / End key that selects another tab.
Programmatic changes (`goTo`, controlled `value`) and trackpad wheel swipes play no haptic.

## 7. Accessibility / gesture alternatives

- WAI-ARIA tabs pattern: `role="tablist"` row, `role="tab"` pills with `aria-selected`, `aria-controls`,
  roving `tabIndex` (selected = 0), `role="tabpanel"` pages with `aria-labelledby`. Selected page gets
  `tabIndex=0` only when it has no tabbable child.
- Keyboard: ←/→ (mirrored in RTL — the rendered `dir` is used for keys, drag and trackpad), Home/End move focus and select (automatic activation, like RAC Tabs),
  skipping disabled tabs; Enter/Space also select. This is the keyboard/screen-reader alternative to swiping.
- Non-selected pages are `inert` (no focus, hidden from AT) even while visible during a drag.
- The label text stays in the DOM when collapsed, so every tab keeps its accessible name ("Today", …);
  icons are `aria-hidden`.
- Extra header content (Avatar) lives inside the tablist like on Native — keep it non-interactive or label it.
- Mouse: drag with the primary button; a drag never turns into a click on page content; trackpad horizontal
  swipes change page once per gesture.
- Swipes may start anywhere on a page, including on buttons, checkboxes and other React Aria pressables (they
  stop `pointerdown` propagation, so the pager listens in the capture phase). Once the drag starts the pager
  captures the pointer: the pressed control is released outside its target, so React Aria cancels its press
  and the trailing click is swallowed, like a Native pager terminating the inner responder.
- Page content keeps pointers it claims: a control that prevents the default `pointerdown` (React Aria
  `useMove` sliders, colour areas, …), a native `input[type=range]`, and a mouse drag inside a text field (text
  selection). Touch drags on text fields still page, as on Native.

## 8. Demos (stories)

| Story | Docs section |
|---|---|
| `BasicUsage` | Basic usage (two pages) |
| `ExtraHeaderContent` | Extra header content (Avatar before the pills) |
| `Controlled` | Controlled (`value` + `onValueChange`, external buttons) |
| `ImperativeNavigation` | Imperative navigation (`ref.goTo(value, animated)`) |
| `LazyPages` | Lazy pages (`lazy` + `renderLazyPlaceholder` with a Spinner) |
| `ListBelowThePager` | List below the pager (bottom tab bar) |
| `PagerBehavior` | Pager behavior (`swipeEnabled={false}`, `isPageAnimationEnabled={false}`) |
| `RenderFunction` | Render function (outline ↔ filled icon) |
| `CustomMorph` | Custom morph (`flexGrow [0, 2]`, icon opacity `[0.35, 1]`, `animation="disable-all"`) |
| `Example` | Example (avatar + Home / Today / Upcoming / Notes, controlled + lazy, in a 402 px phone frame like the video device; lists, sections, notes grid) |

All stories render inside a phone-sized frame (402 × 520–720 px, `bg-background`, rounded, overflow hidden).

## 8a. Verification (headless Edge, Storybook)

- Touch (390 × 844, DPR 2, CDP touch events): half swipe shows "Hor" / "Tc" exactly like video frame 2.00 s;
  release commits + haptic in the same `pointerup`; slow drag < 50 % snaps back without haptic; short fling
  turns one page; vertical drag scrolls the page (`scrollTop` 0 → 218) without paging; diagonal drag pages;
  edge drag clamps; tap on a trigger slides through intermediate pages (pos 2 → 1.28 → 0).
- Mouse: drag pages, a drag that starts on a checkbox does not toggle it, a plain click still does; trackpad
  wheel (`deltaX`) turns one page per gesture.
- Keyboard: Tab focuses the selected tab, ←/→ wrap, Home/End, Tab moves on into the selected panel; RTL
  (`dir="rtl"`) mirrors drag and arrows.
- `prefers-reduced-motion`: taps and swipe releases jump to the end state.
- Pixel comparison (Upcoming selected, light + dark): collapsed pills 52 × 42, active "Upcoming" pill 138 px
  (video 139 dp), colours `--default` / `--foreground` / `--background` match both themes.

## 9. Deviations from Native

- Pager built from pointer events + rAF spring (no `react-native-pager-view`); pages always share one DOM row.
- `progress` is a subscribable object (`.value`/`.subscribe`) instead of a Reanimated `SharedValue`; a reactive
  `useMorphTabsProgress()` hook and CSS custom properties (`--morph-tabs-progress` on the root,
  `--morph-tabs-trigger-progress` on every trigger) are added.
- `Content` scrolls vertically by itself; `offscreenPageLimit` and other PagerView props are not supported.
- `--morph-tabs-progress` is not inherited into page content (performance), see §5.
- Extra header content sits inside the `role="tablist"` row (as on Native).
- `ellipsizeMode="head" | "middle"` render as `tail`.
- `TriggerBackground` has no glass default (HeroUI web has no glass theme); it is an empty layer.
- Trigger press props are React Aria press events instead of RN `Pressable` props.
- Haptics and the trackpad swipe are web additions.
