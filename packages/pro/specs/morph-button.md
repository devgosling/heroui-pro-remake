# Morph Button — clean-room implementation spec

Slug: `morph-button` · Origin: **HeroUI Pro Native** (React Native) · Docs:
https://heroui.pro/docs/native/components/morph-button · Category: Buttons
Native import: `import {MorphButton} from "heroui-native-pro";` → web: `import {MorphButton} from "@heroui/pro";`
Storybook: `Pro/Buttons/MorphButton`.

Sources used: the public Native docs page (anatomy, usage sections, example, API tables) and the public
demo videos `morph-button-docs-light.mp4` / `morph-button-docs-dark.mp4`. I extracted frames every 33ms
around the animations and measured the surface with a dark-pixel flood fill. I did not open or try to get
around paywalled code, bundles or prompts.

---

## 1. Purpose

A pressable surface that morphs between an auto-measured **collapsed** content (a pill) and an
auto-measured **expanded** content (a panel). The surface grows toward one of eight logical directions.
The root's layout footprint always stays at the collapsed size, so the expanding surface overflows
without moving siblings. The typical use is a floating "bag" pill that grows into an order summary.

---

## 2. Anatomy

```tsx
<MorphButton>                                   // root container (collapsed-size footprint)
  {/* auto: <span data-slot="morph-button-surface"/> morphing background */}
  <MorphButton.CollapsedContent>…</MorphButton.CollapsedContent>   // in-flow trigger
  <MorphButton.ExpandedContent>…</MorphButton.ExpandedContent>     // panel (non-modal dialog)
</MorphButton>
```

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `MorphButton` (root) | `<div>` | `morph-button` | `morph-button morph-button--{direction} morph-button--{variant}` | `data-open`, `data-direction`, `data-variant`, `data-disabled`, `data-morphing` (while the spring moves). Holds the CSS variables below. |
| surface (auto) | `<span aria-hidden>` | `morph-button-surface` | `morph-button__surface` | Absolutely positioned background. Animated width / height, anchored by direction. Slot `surface` in `classNames` / `styles`. |
| `MorphButton.CollapsedContent` | RAC `Button` → `<button>` | `morph-button-collapsed-content` | `morph-button__collapsed-content` | In flow, so its natural size is the root footprint and the collapsed morph target. `aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`. `inert` while open. |
| expanded viewport (auto) | `<div>` | `morph-button-expanded` | `morph-button__expanded` | Same animated geometry as the surface, with `overflow: hidden` and the same radius. It clips the panel during the morph. Flex alignment anchors the panel to the pinned edge. |
| `MorphButton.ExpandedContent` | `<div role="dialog" tabindex="-1">` | `morph-button-expanded-content` | `morph-button__expanded-content` | Always mounted. Measured at its natural size while hidden (`visibility: hidden` after the fade, `inert`). |

Stacking inside the root (`isolation: isolate`): surface z-0 < collapsed content z-1 < expanded viewport z-2.
While the root is open or morphing it gets `z-index: 50` so the panel covers following siblings.

---

## 3. API

### `MorphButton` (root)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | – | Usually `CollapsedContent` + `ExpandedContent` |
| `direction` | `'top' \| 'top-end' \| 'end' \| 'bottom-end' \| 'bottom' \| 'bottom-start' \| 'start' \| 'top-start'` | `"top"` | Logical, so it mirrors in RTL |
| `variant` | `'primary' \| 'secondary'` | `"primary"` | Surface color scheme |
| `isOpen` | `boolean` | – | Controlled |
| `defaultOpen` | `boolean` | `false` | Uncontrolled |
| `isDisabled` | `boolean` | `false` | Disables the toggle interaction. The root dims with `status-disabled`. |
| `onOpenChange` | `(isOpen: boolean) => void` | – | Presses still request a toggle through it in controlled mode |
| `animation` | `boolean \| "disabled" \| "disable-all" \| {morphSpringConfig?: MorphButtonSpringConfig}` | – | `false`/`"disabled"`: the surface snaps. `"disable-all"`: the content fades snap too. |
| `className` | `string` | – | Root container |
| `classNames` | `{container?: string; surface?: string}` | – | Per-slot classes |
| `styles` | `{container?: CSSProperties; surface?: CSSProperties}` | – | Per-slot inline styles |
| `style` | `CSSProperties` | – | Root container (wins over `styles.container`) |
| `isHapticFeedbackEnabled` | `boolean` | nearest `HapticsProvider` (true) | Web addition (user requirement) |
| `...div props` | – | – | Replaces Native `PressableProps` (see deviations) |

`MorphButtonSpringConfig` (Reanimated `WithSpringConfig` subset), default
`{damping: 25, stiffness: 300, mass: 0.8, overshootClamping: false, restDisplacementThreshold: 0.01, restSpeedThreshold: 0.01}`.

### `MorphButton.CollapsedContent` / `MorphButton.ExpandedContent`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | – | |
| `className` | `string` (CollapsedContent also accepts the RAC render function) | – | Opacity and scale are animated inline, so they cannot be set with className (same as Native) |
| `animation` | `boolean \| "disabled" \| {opacity?: {value?: [closed, open]; timingConfig?: {duration?: number; easing?: string}}; scale?: {…}}` | – | Defaults: Collapsed opacity `[1, 0]`, scale `[1, 0.96]`. Expanded opacity `[0, 1]`, scale `[0.97, 1]`. Both 200ms `var(--ease-in-out-quad)` (Reanimated's default timing curve). |
| `isAnimatedStyleActive` | `boolean` | `true` | `false`: no opacity / scale / visibility styles are applied |
| CollapsedContent `...ButtonProps` | RAC `ButtonProps` minus `slot`, `isDisabled` | – | `onPress` is chained before the toggle |
| ExpandedContent `...div props` | – | – | `aria-label` / `aria-labelledby` name the dialog (default: labelled by the trigger) |

### `useMorphButton()`

Throws outside a `MorphButton`. Returns:
`isOpen`, `direction`, `variant`, `isDisabled`, `collapsedWidth`, `collapsedHeight`, `expandedWidth`,
`expandedHeight` (measured numbers, 0 until measured), `surfaceWidth`, `surfaceHeight`
(`{readonly value: number}`, live per frame, the web counterpart of a SharedValue), `open()`, `close()`, `toggle()`.
`isOpenValue` (a SharedValue) is dropped on the web.

Other exports: `MorphButtonRoot`, `MorphButtonCollapsedContent`, `MorphButtonExpandedContent`,
`MorphButtonContext`, `DEFAULT_MORPH_SPRING_CONFIG`, `morphButtonVariants`, and the types.

### CSS custom properties (on the root)

| Variable | Set by | Meaning |
|---|---|---|
| `--morph-button-surface-width` / `-height` | spring (inline, every frame) | Current surface size. CSS default `100%` (SSR / before measuring). |
| `--morph-button-progress` | spring | 0 = collapsed size, 1 = expanded size (clamped). Follows the dimension that changes most. |
| `--morph-button-radius` | CSS | `calc(var(--radius) * 3)` = 24px (same as `rounded-3xl`, the OSS Button radius) |
| `--morph-button-bg`, `--morph-button-bg-hover`, `--morph-button-fg` | variant | Surface colors (content inherits `color`) |
| `--morph-button-anchor-x/-y`, `--morph-button-justify/-align` | direction | Anchoring factors (see §5) |

---

## 4. Styling (measured)

Calibration: the expanded panel uses `w-80` = 320dp and measures 333px in the 1916px frame, so 1dp ≈ 1.04px.
The phone screen is about 402dp wide.

| Element | Measured | Web |
|---|---|---|
| Collapsed pill | 40dp tall; padding 16dp; gap 8dp; 16dp icon; `text-sm font-medium` | `.morph-button__collapsed-content`: `h-10 px-4 gap-2 text-sm font-medium`, `svg size-4` |
| Expanded panel | padding 20dp on all sides; 12dp between blocks; content defines the size | `.morph-button__expanded-content`: `flex flex-col gap-3 p-5 w-max` (+ `max-w: 100vw - 2rem`) |
| Corner radius | constant. A circle fit of the expanded top corners (light video, 4.00s) gives R = 24px in the frame, about 23-24dp; R = 20dp does not fit the profile. Collapsed pill fully round at 40dp tall | constant `calc(var(--radius) * 3)` = 24px = `rounded-3xl`, so it follows `--radius` like the OSS Button. CSS clamps it to a full pill at 40px. |
| Surface color, light | near-black `--foreground`, content `--background` | `primary`: `--morph-button-bg: var(--foreground)`, `--morph-button-fg: var(--background)` |
| Surface color, dark | white surface, dark text (inverted) | same tokens (they invert in dark mode) |
| `secondary` | not shown in the video; docs: "reads clearly on a surface card" | `--default` / `--default-foreground`, hover `--default-hover` |
| Shadow | none visible (light or dark) | none |
| Press feedback | none (the surface does not scale or dim while pressed) | none. Web addition: hover tint `color-mix(foreground 88%, background)` only under `@media (hover: hover)` |
| Focus | – | `status-focused` ring on the trigger, radius = surface radius |

Example content (docs + video): the "View" chip is `rounded-2xl bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-foreground`.
Panel secondary text is `text-background/70`, the separator `bg-background/15`, "Keep shopping" is `bg-background/10`,
and "Buy now" is `bg-background text-foreground`. In the video the panel buttons are 40dp tall.

---

## 5. Geometry, directions and animation

**Anchoring.** The root has the collapsed size. The surface and the expanded viewport are absolutely positioned with

```
inset-inline-start: (100% - surfaceWidth)  * anchorX
top:                (100% - surfaceHeight) * anchorY
```

| direction | anchorX | anchorY | pinned edge / corner |
|---|---|---|---|
| top (default) | .5 | 1 | bottom, centered |
| top-end | 0 | 1 | bottom-start |
| end | 0 | .5 | start, centered |
| bottom-end | 0 | 0 | top-start |
| bottom | .5 | 0 | top, centered |
| bottom-start | 1 | 0 | top-end |
| start | 1 | .5 | end, centered |
| top-start | 1 | 1 | bottom-end |

The panel sits inside the viewport at its natural size. Flex `justify-content` / `align-items` (`flex-start | center | flex-end`)
pin it to the same edge, and centered overflow spills to both sides. During the morph the content therefore stays still on screen
and the surface reveals it. The video shows this: the "Subtotal" text is clipped by the growing surface while it fades in.
Because the anchoring uses `inset-inline-start` and flex, every direction mirrors in RTL. Verified: `top-end` in RTL keeps the right edge and grows to the left.

**Surface spring** (video, 30fps, normalized height 0→1 when opening): +33ms 0.13, +67ms 0.40, +100ms 0.75,
+133ms 0.88, +167ms 0.97, +200ms 1.00, +233ms 1.014 (peak overshoot ≈1.4%), settled by about 400ms. Closing is just as fast.
This matches the documented default spring `damping 25, stiffness 300, mass 0.8` (ζ ≈ 0.81, ω0 ≈ 19.4 rad/s,
theoretical overshoot 1.37%). Review re-measure: the close (4.77s in the light video) follows the analytic step response of this spring
frame by frame (0.41 / 0.65 / 0.82 / 0.93 / 0.986 / 1.005 / 1.014 at +67…+267ms, undershoot 3px ≈ 1.4%); the open matches as well once a
dropped recording frame (~15ms between 3.567s and 3.60s) is accounted for. Web: an own rAF integrator (`morph-button-spring.ts`, semi-implicit
Euler, 1ms steps) animates width and height together. It keeps velocity when the target changes mid-flight (re-open while closing, content
re-measure) and honours `overshootClamping` and the rest thresholds. Its clock starts on the first animation frame (like the CSS content
transitions) and integrates the real frame time (up to 1s), so a long task during the open render does not let the surface fall behind the
content fade. A surface measured at 0x0 (mounted under `display: none`) or a target of 0x0 (hidden now) snaps instead of animating.
Measured on the web: 15% at 36ms, 42% at 67ms, 83% at 128ms, 98.5% at 189ms, peak 101.4% at 280ms.

**Re-measure.** When the collapsed content changes ("1 product" → "2 products"), the video shows the pill width springing
from 215px to 225px over about 150ms. ResizeObserver feeds the new size into the same spring. The same applies to the expanded panel height (PanelWidth story).

**Content cross-fade.** Both parts run 200ms timing: collapsed fades out and scales to 0.96, expanded fades in from 0.97.
In the frames both are partly visible at +60ms. Review re-measure: the brightness of the white "Buy now" button on the dark surface gives the
expanded opacity 0.77 / 0.51 / 0.235 / 0.07 at +67 / +100 / +133 / +167ms of the close, which is exactly `ease-in-out-quad` over 200ms. CSS transitions on `opacity` and `scale` take their duration and easing from inline variables. The expanded
content switches to `visibility: hidden` only after its fade-out (`transition-delay` = fade duration).

**Reduced motion.** `prefers-reduced-motion` or `[data-reduce-motion="true"]`: the spring snaps (JS check), and the
content transitions get `transition-property: none` (`motion-reduce:transition-none`).

---

## 6. Interaction, haptics and accessibility

| Input | Result |
|---|---|
| Tap / click / Enter / Space on the collapsed content | Toggle → open. **Haptic `light`**, played synchronously inside RAC's press handler so iOS still counts it as part of the user gesture. |
| Tap / click on the open panel outside interactive elements | Toggle → close (Native: the root Pressable wraps the panel). The press must start on the open panel, so the click that ends the opening tap (which mobile browsers can retarget) is ignored. Text selection and interactive descendants (`button`, `a`, inputs, ARIA widget roles, `[data-morph-button-ignore-press]`) are ignored. |
| Escape inside the panel | Close; focus returns to the trigger |
| Screen reader | `DismissButton` (visually hidden, `tabindex=-1`) at the end of the open panel. The trigger exposes `aria-expanded` / `aria-controls` / `aria-haspopup="dialog"`. The panel is `role="dialog"` (non-modal). |
| Programmatic `open/close/toggle`, controlled `isOpen` | No haptic |
| Outside click | Nothing (Native has no backdrop; non-modal) |

Focus: on open, focus moves to the first tabbable element in the panel, or to the panel itself (`preventScroll`).
On close, if focus was inside the panel, it moves back to the trigger. The trigger is `inert` + `pointer-events: none` while open.
The panel is `inert` while closed. Tab can leave the open panel (non-modal).

Disabled: the trigger gets RAC `isDisabled`. Panel taps, Escape and the dismiss button do nothing, and the root dims.

Haptic moments: **expand by press only** (`light`). Collapse has no haptic.

---

## 7. Demos (stories)

| Story | Docs section | Content |
|---|---|---|
| `BasicUsage` | Basic usage | Mini player: "Now playing" pill → `w-72` panel (cover, title, progress, prev / play-pause / next, close via `useMorphButton().close`). Main story with controls for direction, variant, isDisabled, defaultOpen, isHapticFeedbackEnabled. |
| `Variants` | Variants | Filters pill → chip panel; `primary` on the app background and `secondary` on a surface card |
| `Directions` | Directions | 3×3 grid with all eight directions, each button placed so its panel grows away from the center |
| `Positioning` | Positioning | Phone frame (390×720) with an inbox list; `absolute inset-x-0 bottom-6 flex justify-center`, direction top, "Compose" → create menu |
| `PanelWidth` | Panel width | `w-80` activity panel whose "Show all" grows the content, so the surface springs to the re-measured height |
| `Controlled` | Controlled | `isOpen` / `onOpenChange` with external Open / Close / Toggle buttons and a state readout |
| `Disabled` | Disabled | `isDisabled` pill |
| `CustomMorphSpring` | Custom morph spring | Default, `{damping 30, stiffness 400}`, `{damping 10, stiffness 180}` and `"disable-all"` side by side |
| `Example` | Example | Phone frame: sneaker list (own data and drawing) with favorites and "Add to bag". Controlled MorphButton at `bottom-6`: "N products in bag" + "View" chip → `w-80` order summary with line items, separator, subtotal, Keep shopping (closes) / Buy now. |

---

## 8. Deviations from Native

- `PressableProps` → HTML `div` props on the root. Press handling (and `onPress`) lives on `CollapsedContent`, which is a real `<button>` (RAC Button), because a button cannot wrap the interactive panel on the web.
- `isOpenValue` (UI-thread SharedValue) is dropped. `surfaceWidth` / `surfaceHeight` are `{value}` getters instead of SharedValues. Measured sizes are plain numbers.
- `timingConfig.easing` is a CSS easing string instead of a Reanimated easing function.
- `styles` takes `CSSProperties`. The Pressable function form of `style` does not exist on the web.
- Web additions: keyboard, focus management, Escape, the screen-reader dismiss button, the hover tint, the `--morph-button-progress` variable and haptics (`isHapticFeedbackEnabled`).
- The expanded content defaults to `width: max-content` with a `100vw - 2rem` cap. Set an explicit width (`w-72`, `w-80`) for panels, as the docs recommend.
