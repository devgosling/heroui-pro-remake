# FAB — clean-room web port spec

Slug: `fab` · Origin: **HeroUI Pro Native** (`heroui-native-pro`) · Docs: https://heroui.pro/docs/native/components/fab
Storybook: `Pro/Buttons/FAB` · Import (web): `import {FAB, useFAB, useFABAnimation} from "@heroui/pro/fab";`

Sources: the public docs page text (anatomy, usage snippets, API tables, hooks) and the public demo
videos `fab-docs-light.mp4` / `fab-docs-dark.mp4` (1920×1080, about 10.4 s, three demos: inbox compose,
map controls, blur backdrop). I measured frames with headless Edge: about 30 fps, 0.033 s steps around the
animations, and pixel sampling. Phone scale in the frame: screen 419 px wide = 393 dp, so **1 dp = 1.066 px**.
I read no paywalled code, bundles, source maps or prompt/MCP endpoints.

---

## 1. Purpose

A floating action button that expands into a column of actions (speed dial). The content placement
resolves automatically from where the trigger sits on screen. A shared, progress-driven animation
(0 = idle, 1 = open, 2 = close) orchestrates the overlay, the staggered items and the trigger rotation.

## 2. Anatomy

```tsx
<FAB className="absolute bottom-6 right-6">     // root <div>, owns state + progress
  <FAB.Trigger>…icon…</FAB.Trigger>              // RAC Button (aria-haspopup="menu")
  <FAB.Portal container={screenEl}>             // react-aria Overlay → portal layer <div>
    <FAB.Overlay />                              // dimming / blur backdrop, press closes
    <FAB.Content>                                // role="menu" column, positioned next to the trigger
      <FAB.Item onPress={…}>New message</FAB.Item>          // <button role="menuitem">
      <FAB.Item onPress={…}><Icon/><FAB.ItemLabel>Share</FAB.ItemLabel></FAB.Item>
    </FAB.Content>
  </FAB.Portal>
</FAB>
```

| Part | Element | `data-slot` | BEM | Primitive |
|---|---|---|---|---|
| `FAB` (root) | `div` (`data-open`, `data-disabled`, `data-placement`, `data-align`, inline `--fab-progress`) | `fab` | `fab` | — |
| `FAB.Trigger` | `button` (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls` while open, `data-open`, RAC `data-pressed/hovered/focus-visible/disabled`) | `fab-trigger` | `fab__trigger` | RAC `Button` |
| trigger content | `span` (rotates; `data-animated="false"` when static) | `fab-trigger-content` | `fab__trigger-content` | — |
| `FAB.Portal` | `div` layer (`fixed inset-0 z-50`, or `absolute` with `data-contained`), `data-open`, `data-exiting`, `inert` while idle | `fab-portal` | `fab__portal` | react-aria `Overlay` (portal + FocusScope) |
| `FAB.Overlay` | `div aria-hidden` (`data-variant`, `data-tint`, `data-animated`) | `fab-overlay` | `fab__overlay`, `fab__overlay--blur` | react-aria `usePress`, `usePreventScroll` |
| `FAB.Content` | `div role="menu" aria-orientation="vertical"` (`data-placement`, `data-align`) between two visually hidden `DismissButton`s | `fab-content` | `fab__content` | react-aria `useOverlay` (Escape), `ariaHideOutside` |
| `FAB.Item` | `button role="menuitem"` (`data-pressed/hovered/focus-visible/disabled/animated`, inline stagger vars) | `fab-item` | `fab__item` | react-aria `useButton`, `useHover`, `useFocusRing` |
| `FAB.ItemBackground` | `div aria-hidden` absolute fill behind the content | `fab-item-background` | `fab__item-background` | — |
| `FAB.ItemLabel` | `span` | `fab-item-label` | `fab__item-label` | — |

## 3. API

### `FAB` (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `placement` | `"auto" \| "top" \| "bottom" \| "left" \| "right"` | `"auto"` | auto: trigger centre in the bottom half of the screen → `top`, else `bottom` |
| `align` | `"auto" \| "start" \| "center" \| "end"` | `"auto"` | auto: perpendicular axis in thirds → start / center / end (inline axis follows RTL) |
| `itemsAppearance` | `"staggered" \| "normal"` | `"staggered"` | |
| `isOpen` / `isDefaultOpen` / `onOpenChange` | controlled / uncontrolled open state | | `isDefaultOpen` renders open without animating in |
| `isDisabled` | `boolean` | | disables the trigger; opening is refused |
| `animation` | `false \| "disabled" \| "disable-all" \| true \| {progress?, stagger?: {itemWindow?}}` | | `progress: {type: "spring", config: {mass, stiffness, damping, velocity, rest*}}` or `{type: "timing", config: {duration, easing}}`; `itemWindow` default 0.5, clamped to (0, 1] |
| `isHapticFeedbackEnabled` | `boolean` | from `HapticsProvider` (true) | web addition (user requirement) |
| `className`, `ref`, …div props | | | position it with utilities (`absolute bottom-6 right-6`, `fixed end-6 bottom-6`) |

### `FAB.Trigger`
`children`, `isDisabled`, `className`, `classNames: {container, contentContainer}`, `style`,
`styles: {container, contentContainer}`, `animation: {rotate: {value: [idle, open, close]}}` (default `[0, 45, 0]`) or `false`/`"disabled"`,
`isAnimatedStyleActive` (default true), all RAC Button props (`onPress`, `aria-label`, …). The default `aria-label` is `"Actions"`.
`ref` → `FABTriggerRef` = the `<button>` with imperative `open()` / `close()`.

### `FAB.Portal`
`children`, `className`, `forceMount?: true`, **`container?: Element | null`** (web replacement of `hostName`: the layer
covers this element (it needs `position: relative`) and auto placement resolves against it; default `document.body` / viewport).
The layer stays mounted while the close animation plays. The contexts reach portaled children through React context.

### `FAB.Overlay`
`closeOnPress` (true), `variant: "default" | "blur"`, `blurViewProps: {intensity?: 0-100 (50), tint?: "default"|"light"|"dark"|"none"}`,
`animation: {opacity: {value: [0, 1, 0]}}`, `isAnimatedStyleActive` (true for default, false for blur), press events, div props.

### `FAB.Content`
`offset` (12), `alignOffset` (0, inward for start/end, right/down for center), `insets` ({12,12,12,12}), `avoidCollisions` (true: shift inside the insets),
`disablePositioningStyle` (false), `className`, div props.

### `FAB.Item`
`children` (strings/numbers wrapped in `FAB.ItemLabel`), `closeOnPress` (true), `isDisabled`, `background` (`undefined` = theme default = none
in the default theme; node replaces; `null` removes), `animation: {translate: {value: 16}, scale: {value: [0.9, 1]}}`, `isAnimatedStyleActive`,
press events (`onPress`, `onPressStart`, …), button props.

### `FAB.ItemBackground` / `FAB.ItemLabel`
`children`, `className`, div / span props.

### Hooks
- `useFAB()` → `{isOpen, onOpenChange, triggerPosition, contentLayout, placement, align, id}`. Resolved placement and align.
  `triggerPosition` is in viewport coordinates and `contentLayout` is relative to the portal layer. `id` replaces Native `nativeID`.
- `useFABAnimation()` → `{progress, getProgress, subscribe}`. `progress` is a number that re-renders the caller on every frame while
  it changes. `getProgress` and `subscribe` let you write styles imperatively without re-rendering. Both hooks throw outside `<FAB>`.
- CSS: `--fab-progress` (0..2) on the root and on the portal layer, plus derived `--fab-open` (0..1) and `--fab-close` (0..1).

## 4. Measurements (video) → web tokens

| Thing | Native (video) | Web |
|---|---|---|
| Trigger | 50.5–51 px ≈ **48 dp** circle, accent (sRGB 3/134/244), white icon, very soft shadow, no press scale | `size-12 rounded-full bg-accent text-accent-foreground shadow-surface`, icon `size-5.5` (22 px, as in the Example), hover/pressed `--accent-hover` |
| Overlay | light: white 255 → 204, card 24 → 20 in dark ⇒ **black @ 20 %** over the whole screen, trigger included | `bg-black/20`, opacity mapped `[0, 1, 0]` |
| Items | rounded rectangle (not a full pill), **40 dp** high, 50 dp pitch ⇒ **10 dp gap**; corner radius fitted on the edge profile of three items (light and blur demos): **≈ 15 dp** with a straight vertical edge of about 15 px, so `rounded-2xl` (16 px at the default `--radius`); px ≈ 16 dp; text ≈ 14 dp medium; light: white with a very faint shadow (5–7 luminance units in the 10 dp gaps); dark: near-surface fill (luminance 23 on a 19–21 dimmed card), white text, **no border ring** | `h-10 rounded-2xl px-4 gap-2 text-sm font-medium bg-overlay text-overlay-foreground shadow-surface`, column `gap-2.5`. `shadow-surface` (soft in light, none in dark) is closer than `shadow-overlay`, which was about 3× darker in the gaps and drew an inset ring in dark mode |
| Item icon | 16 dp, 8 dp gap to label | `svg size-4`, `gap-2` |
| Trigger → nearest item | 13 px ≈ **12 dp** | `offset = 12` |
| Alignment | bottom-right FAB: items right-aligned to the trigger edge (end); bottom-left map FAB: left-aligned (start) | `items-end` / `items-start` via `data-align` |
| Blur demo | whole screen (trigger too) heavily blurred and lightened; danger item text + icon | `backdrop-filter: blur(intensity × 0.2 px)` (60 → 12 px) + background tint up to `intensity × 0.6 %`; item `className="text-danger"` |

### Timing / motion
- Progress driver. The docs list the default spring `{mass: 3, stiffness: 1200, damping: 90}` (ω₀ = 20 rad/s, ζ = 0.75: ≈ 70 % at
  100 ms, ≈ 95 % at 150 ms). The video does not follow it. The light video is 60 fps; decoding every frame with `requestVideoFrameCallback`
  and reading the overlay level (white 255 → 204) gives, for the open: 16 / 27 / 37 / 47 / 57 / 65 % at 33 / 50 / 67 / 83 / 100 / 117 ms,
  then 84 % at 200 ms, 92 % at 250 ms and 98 % at about 320 ms. The close (204 → 255) has the same shape. There are almost no duplicate
  frames, so this is not a recording artefact. A least-squares fit over open and close together gives ω₀ ≈ 20 rad/s (the documented
  natural frequency) with **ζ ≈ 1.1**. With mass 3 and stiffness 1200 the best damping is 135–138 (rms 0.02 open / 0.04 close, against
  0.10 for damping 90). **Default: `{mass: 3, stiffness: 1200, damping: 135}`**: no overshoot, ≈ 90 % after 230 ms. Pass the documented
  config explicitly to get the snappier curve. Close is the same spring from 1 → 2. After it, the progress resets to 0 and the portal unmounts.
- Custom spring configs replace the default. Fields they leave out fall back to the Reanimated 4 defaults (`mass 4, stiffness 900, damping 120`).
  Timing defaults: 300 ms, ease-in-out quad.
- The visible progress is clamped per phase (open 0..1, close 1..2), so a spring overshoot never leaks into the other phase.
- Stagger (video: nearest item at about 60 ms, farthest at 50 % after about 160 ms). With `n` items and window `w`, item order `k` (0 = nearest to
  the trigger) starts at `k·(1−w)/(n−1)` on open. Close is reversed (farthest item first, as in the video at 2.37–2.43 s).
  Nearest = the last DOM item for `top`, and for `left`/`right` with `align="end"`; otherwise the first.
- Item motion: opacity 0→1, translate from the trigger direction (16 px), scale 0.9→1 around the centre (measured: right edge 5 px in,
  left edge 4 px in, top 11 px lower at about 0.93 visibility).
- Trigger content rotation `[0, 45, 0]`: the pencil reads as a horizontal stroke when open, and a plus becomes an ×.
- All mapping is pure CSS `calc()` / `clamp()` on `--fab-progress`, written once per frame by a small rAF spring. React does not
  re-render per frame. With reduced motion (OS setting or `data-reduce-motion="true"`), or root `animation` false/`"disabled"`/`"disable-all"`,
  the progress jumps to its end state.

## 5. Gestures, keyboard, screen readers

| Input | Result |
|---|---|
| Tap / click trigger | toggles (opens with haptic `light`) |
| Tap / click overlay (also where the trigger sits, since the overlay covers it as on Native) | closes (`closeOnPress`) |
| Tap / click item | `onPress`, then closes unless `closeOnPress={false}` |
| Enter / Space on trigger | opens; focus moves to the first item |
| ArrowDown / ArrowUp | next / previous item (wraps); Home / End jump to first / last |
| Tab / Shift+Tab | cycle inside the menu (focus contained by the react-aria Overlay FocusScope) |
| Escape | closes; focus returns to the trigger immediately |
| Screen reader | trigger announces "menu button, collapsed/expanded"; the content is `role="menu"` labelled by the trigger; content outside the layer and the trigger gets `aria-hidden` while open; visually hidden Dismiss buttons give VoiceOver/TalkBack users a close action |

Haptic moments: **only** when the FAB opens through a trigger press (`haptic("light")`, called synchronously inside the RAC
`onPress` handler, so iOS counts it as a user gesture). Programmatic or controlled opening does not vibrate.
`isHapticFeedbackEnabled` on the root overrides the nearest `HapticsProvider`.

Pointer: plain presses only (no drag gesture). Page scroll is locked while an `FAB.Overlay` is open (`usePreventScroll`), like the
Native backdrop that swallows touches. While the close animation plays, nothing in the layer is interactive.

## 6. Demos (stories)

| Docs section | Story |
|---|---|
| Basic usage | `Default` (args: placement, align, itemsAppearance, isDisabled, isHapticFeedbackEnabled) |
| Manual placement | `ManualPlacement` (top-left trigger, `placement="bottom" align="start"`) |
| Items appearing mode | `ItemsAppearingMode` (left `itemsAppearance="normal"`, right `itemWindow: 0.4`) |
| Items with icons | `ItemsWithIcons` (map screen, bottom-left FAB, icon + `FAB.ItemLabel`) |
| Controlled | `Controlled` (external Open/Close buttons) |
| Blur backdrop | `BlurBackdrop` (`variant="blur"`, intensity 60, danger item) |
| Custom backdrop | `CustomBackdrop` (`useFAB` + `useFABAnimation`, frosted accent layer) |
| Custom animation configuration | `CustomAnimationConfiguration` (timing 400 ms, rotate `[0,135,0]`, overlay `[0,0.6,0]`, items translate 24 / scale `[0.8,1]`) |
| (web) real-app placement | `FixedToViewport` (`fixed end-6 bottom-20`, body portal) |
| Example | `Example` (inbox with compose FAB) |

Screen-oriented stories render inside a 390 × 720 phone screen. The portal renders into it, so the overlay and auto placement behave like the video.

## 7. Deviations from Native

- `FAB.Portal hostName` → `container` (DOM element); `disableFullWindowOverlay` and `unstable_accessibilityContainerViewIsModal` are dropped (iOS only).
  The layer is always modal for assistive tech (focus contained, outside `aria-hidden`).
- Blur works on every browser with `backdrop-filter` (Native: iOS only with expo-blur); there is no glass theme, so `variant` defaults to `"default"`
  and `FAB.ItemBackground` has no default content.
- `useFABAnimation().progress` is a number (plus `getProgress` / `subscribe`) instead of a Reanimated `SharedValue`; `useFAB().nativeID` → `id`.
- `FABTriggerRef` is the button element with `open()` / `close()` attached.
- Spring overshoot is clamped per phase (Native maps an overshoot past 1 into the close range, which shows as an invisible dip).
- The default progress spring uses `damping: 135` (measured from the demo video, section 4) instead of the documented `damping: 90`.
  Mass and stiffness are as documented.
- Item corners scale with the theme `--radius` (`rounded-2xl`). With a large `--radius` they become a full pill.
- Web additions: hover / pressed / focus-visible states, keyboard navigation, Dismiss buttons, `isHapticFeedbackEnabled`, RTL-aware `align`.
