# Pressable Feedback (`pressable-feedback`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/pressable-feedback, rendered DOM, CSSOM,
computed styles and observed runtime behaviour (MutationObserver timestamps, `getAnimations()`, instrumented
`Element.prototype.animate` calls, dispatched/real pointer + keyboard events) of the 17 public demo pages (light + dark)
and the rendered DOM of the matching public Storybook story canvas, observed on 2026-11-24. No paywalled source, JS
bundle, source map, "Copy prompt"/MCP/llms endpoint or Storybook code panel was read.

## 1. Purpose

A press-interaction layer that adds four independent visual feedback effects to any pressable host: an opacity
**Highlight**, a Material-3-style **Ripple**, a **HoldConfirm** clip-path reveal (press-and-hold to confirm) and a
**ProgressFeedback** clip-path reveal (click once, sweeps automatically). Every part works standalone inside any host
element (OSS `Button`, `Card`, a plain `<button>`), the `PressableFeedback` root is optional.

## 2. Anatomy

```tsx
import {PressableFeedback} from "@heroui/pro";

<PressableFeedback>
  <PressableFeedback.Highlight />        {/* optional */}
  <PressableFeedback.Ripple />           {/* optional */}
  <PressableFeedback.HoldConfirm />      {/* optional */}
  <PressableFeedback.ProgressFeedback /> {/* optional */}
  {/* ... content */}
</PressableFeedback>

// The way every demo actually uses it: a part as FIRST child of another pressable host
<Button variant="primary"><PressableFeedback.Ripple />Primary</Button>
<Card className="relative overflow-hidden"><PressableFeedback.Ripple className="z-1" />...</Card>
<ItemCard className="relative w-full cursor-pointer overflow-hidden"><PressableFeedback.Highlight />...</ItemCard>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| Root `PressableFeedback` | `<button>` (default; `render` prop can swap it) | not observed (no demo renders the root); recommend `pressable-feedback` | `.pressable-feedback` | Plain DOM button, most likely the OSS `dom.button` helper with `DOMRenderProps` (`render?: DOMRenderFunction`, see `packages/react/src/utils/dom.tsx`). State attributes (`data-hovered`, `data-pressed`, `data-focus-visible`) are referenced by the CSS, so probably React Aria `usePress`/`useHover`/`useFocusRing` (inferred, unverified) |
| `PressableFeedback.Highlight` | `<div aria-hidden="true">` | `pressable-feedback-highlight` | `.pressable-feedback__highlight` | Plain DOM, pure CSS (no JS state) |
| `PressableFeedback.Ripple` | `<div aria-hidden="true">` wrapping `<div>` | **none** on both (observed) | `.pressable-feedback__ripple` > `.pressable-feedback__ripple-surface` | Plain DOM + JS: native listeners on `parentElement`, Web Animations API on the surface `::after`; port of Material Web `md-ripple` |
| `PressableFeedback.HoldConfirm` | `<div aria-hidden="true">` (children inside) | `pressable-feedback-hold-confirm` | `.pressable-feedback__hold-confirm` | Plain DOM + JS: native listeners on `parentElement`, timer, CSS transition on `clip-path` |
| `PressableFeedback.ProgressFeedback` | `<div aria-hidden="true">` (children inside) | `pressable-feedback-progress-feedback` | `.pressable-feedback__progress-feedback` | Plain DOM + JS: native listeners on `parentElement`, timers, CSS transition on `clip-path` |

Observed DOM (attribute order as rendered, inside an OSS `Button`, which itself is RAC: `data-rac`,
`data-react-aria-pressable`):

```html
<!-- Ripple: never has data-slot, never has style when props are default -->
<button data-slot="button" class="button button--md button--primary" data-rac="" type="button" tabindex="0"
        data-react-aria-pressable="true" id="react-aria-...">
  <div aria-hidden="true" class="pressable-feedback__ripple">
    <div class="pressable-feedback__ripple-surface"></div>   <!-- gets " --hover" / " --press" classes at runtime -->
  </div>Primary</button>

<!-- Highlight -->
<div aria-hidden="true" class="pressable-feedback__highlight" data-slot="pressable-feedback-highlight"></div>

<!-- HoldConfirm: user className after the BEM class; inline vars ALWAYS written, even for defaults -->
<div aria-hidden="true" class="pressable-feedback__hold-confirm bg-danger text-danger-foreground"
     data-slot="pressable-feedback-hold-confirm" data-sweep="right"
     style="--pressable-feedback-hold-confirm-duration:2000ms;--pressable-feedback-hold-confirm-release-duration:200ms">
  <svg .../>Hold to Delete</div>
<!-- runtime: + data-holding="true" | data-complete="true" -->

<!-- ProgressFeedback -->
<div aria-hidden="true" class="pressable-feedback__progress-feedback bg-accent text-accent-foreground"
     data-slot="pressable-feedback-progress-feedback" data-sweep="right"
     style="--pressable-feedback-progress-feedback-duration:2000ms;--pressable-feedback-progress-feedback-release-duration:300ms">
  Buying!</div>
<!-- runtime: + data-progressing="true" | data-complete="true" -->
```

Composition rules derived from the DOM:

- Each part is rendered **as the first child** of its host, before the host's own content. The host is the part's
  `parentElement`; all JS parts bind native DOM listeners to it (works for hosts that know nothing about the part:
  OSS `Button`, `Card`, Pro `ItemCard`, a plain div).
- `data-sweep` is always rendered (default `"right"`). `data-holding`/`data-progressing`/`data-complete` are only present
  when `"true"` (removed otherwise, never `"false"`).
- HoldConfirm/ProgressFeedback children are the "revealed" content; demos repeat the host's icon + label (or a new label
  like "Added!", "Buying!", "Account Deleted"). The overlay is `aria-hidden` so the duplicate label is not announced.
- Host requirements: a containing block (`position: relative`; OSS `.button` and `.card` already have it, demos add
  `relative` to ItemCard/Card), a border radius (all parts use `border-radius: inherit`). The Ripple clips itself
  (`overflow: hidden`), Highlight/HoldConfirm/ProgressFeedback rely on `inset: 0` + inherited radius; demos still add
  `overflow-hidden` on Cards/ItemCards.
- Paint order: parts are absolutely positioned, so they paint above the host's non-positioned content (label text).
  Ripple/Highlight are translucent; HoldConfirm/ProgressFeedback overlays are opaque (or soft-tinted) and replace the
  visible content while revealed. When the host has positioned content (Card with absolute image), demos add `z-1` to
  the Ripple and `z-10` to content.

## 3. API

### `PressableFeedback` (root)

Renders a `button` element by default. Also accepts all native button HTML attributes.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isDisabled` | `boolean` | `false` | Whether the pressable is disabled (expected: `disabled` attribute on a native button, `aria-disabled="true"` otherwise; CSS supports both) |
| `children` | `ReactNode` | - | Feedback layers and content |
| `className` | `string` | - | Additional CSS class |
| `render` | `DOMRenderFunction` | - | Custom render function to override the default button element (OSS `DOMRenderProps<"button", undefined>`) |

### `PressableFeedback.Highlight`

Opacity-based hover/press overlay. No props beyond standard `div` attributes (`className`, `style`, ...).

### `PressableFeedback.Ripple`

M3-style radial ripple effect.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `150` | Duration in ms of the ripple grow animation (observed: WAAPI `duration: 150`) |
| `hoverOpacity` | `number` | `0.08` | Opacity of the hover state (CSS var `--pressable-feedback-ripple-hover-opacity`) |
| `pressedOpacity` | `number` | `0.12` | Opacity of the pressed state (CSS var `--pressable-feedback-ripple-pressed-opacity`) |
| `minimumPressDuration` | `number` | `225` | Minimum press duration in ms (observed: `--press` removed ~225 ms after the end trigger) |
| `isDisabled` | `boolean` | - | Whether the ripple is disabled (CSS: `.pressable-feedback__ripple[aria-disabled="true"] { display: none }` -> render `aria-disabled="true"` on the ripple root and ignore events) |
| `className` | `string` | - | Additional CSS class (on `.pressable-feedback__ripple`; demos use it for color `text-rose-200` and stacking `z-1`) |
| `style` | `CSSProperties` | - | Additional inline styles |

With default props the ripple root has **no** `style` attribute, so opacity/duration vars should only be written when
the prop is passed (recommendation; non-default values were not observable).

### `PressableFeedback.HoldConfirm`

Clip-path hold-to-reveal overlay.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `2000` | Hold duration in ms before the action is confirmed -> inline `--pressable-feedback-hold-confirm-duration: {n}ms` |
| `releaseDuration` | `number` | `200` | Duration in ms of the snap-back on release -> inline `--pressable-feedback-hold-confirm-release-duration: {n}ms` |
| `sweep` | `'right' \| 'left' \| 'down' \| 'up'` | `'right'` | Edge the reveal sweeps toward -> `data-sweep` |
| `resetOnComplete` | `boolean` | `true` | Whether to reset the overlay after the hold completes |
| `isDisabled` | `boolean` | - | Whether the hold confirm is disabled |
| `onComplete` | `() => void` | - | Fired when the hold reaches the full duration |
| `children` | `ReactNode` | - | Overlay content shown during the reveal |
| `className` | `string` | - | Additional CSS class |

### `PressableFeedback.ProgressFeedback`

Clip-path click-to-progress overlay (auto, no hold required).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `2000` | Progress duration in ms -> inline `--pressable-feedback-progress-feedback-duration: {n}ms` |
| `releaseDuration` | `number` | `300` | Snap-back duration on reset -> inline `--pressable-feedback-progress-feedback-release-duration: {n}ms` |
| `sweep` | `'right' \| 'left' \| 'down' \| 'up'` | `'right'` | Edge the reveal sweeps toward -> `data-sweep` |
| `autoReset` | `boolean` | `true` | Whether to automatically reset after completing |
| `resetDelay` | `number` | `1500` | Delay in ms before resetting after completion |
| `isDisabled` | `boolean` | - | Whether the progress feedback is disabled |
| `onComplete` | `() => void` | - | Fired when the progress reaches the full duration |
| `onReset` | `() => void` | - | Fired when the overlay resets back to idle |
| `children` | `ReactNode` | - | Overlay content shown during the reveal |
| `className` | `string` | - | Additional CSS class |

Suggested display names (OSS convention): `HeroUI.PressableFeedback`, `HeroUI.PressableFeedback.Highlight`, ...

## 4. Styling

All rules live in `@layer components`. The CSS is identical in light and dark (32 matching rules, byte-identical).
There are **no** `@keyframes` for this component (ripple uses WAAPI) and **no** `prefers-reduced-motion` rule.

### `.pressable-feedback` (root)

```css
.pressable-feedback {
  display: inline-flex; position: relative; overflow: hidden;
  border-radius: inherit;                     /* inherits from its parent; consumers set rounded-* */
  cursor: var(--cursor-interactive);
  outline-style: none; --tw-outline-style: none;
  -webkit-tap-highlight-color: transparent;   /* OSS `no-highlight` utility */
}
/* focus ring = OSS `status-focused` (focus-ring): 2px ring var(--focus), offset var(--ring-offset-width) in var(--background) */
.pressable-feedback:focus-visible:not([data-focused]),
.pressable-feedback[data-focus-visible="true"] { @apply status-focused; }
/* disabled = OSS `status-disabled`: opacity var(--disabled-opacity); cursor var(--cursor-disabled); pointer-events none */
.pressable-feedback:disabled,
.pressable-feedback[aria-disabled="true"] { @apply status-disabled; }
```

### `.pressable-feedback__highlight`

```css
.pressable-feedback__highlight {
  --pressable-feedback-highlight-color: currentColor;
  --pressable-feedback-highlight-opacity: .08;
  --pressable-feedback-highlight-pressed-opacity: .12;
  --pressable-feedback-transition-duration: .15s;
  position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background-color: var(--pressable-feedback-highlight-color);
  opacity: 0;
  transition: opacity var(--pressable-feedback-transition-duration) ease;
}
@media (hover: hover) {
  :hover > .pressable-feedback__highlight,
  [data-hovered="true"] > .pressable-feedback__highlight { opacity: var(--pressable-feedback-highlight-opacity); }
}
:active > .pressable-feedback__highlight,
[data-pressed="true"] > .pressable-feedback__highlight { opacity: var(--pressable-feedback-highlight-pressed-opacity); }
:disabled > .pressable-feedback__highlight,
[aria-disabled="true"] > .pressable-feedback__highlight { display: none; }
```

Note the vars are declared on the highlight itself, so overriding them requires targeting the highlight (or using a
more specific selector), not the host.

### `.pressable-feedback__ripple` / `__ripple-surface`

```css
.pressable-feedback__ripple {
  position: absolute; inset: 0; display: block; width: 100%; height: 100%; margin: auto;
  overflow: hidden; pointer-events: none; border-radius: inherit;
}
.pressable-feedback__ripple[aria-disabled="true"] { display: none; }
@media (forced-colors: active) { .pressable-feedback__ripple { display: none; } }

.pressable-feedback__ripple-surface { pointer-events: none; border-radius: inherit; inset: 0; }
/* NOTE: surface has no `position`; it is static with 0 height. ::before/::after are positioned against .__ripple */
.pressable-feedback__ripple-surface::before,
.pressable-feedback__ripple-surface::after { content: ""; opacity: 0; position: absolute; }

.pressable-feedback__ripple-surface::before {            /* hover layer */
  inset: 0; width: 100%; height: 100%;
  background-color: var(--pressable-feedback-ripple-color, currentColor);
  transition: opacity var(--pressable-feedback-ripple-duration, .15s),
              background-color var(--pressable-feedback-ripple-duration, .15s);   /* easing: ease (default) */
}
.pressable-feedback__ripple-surface::after {             /* press layer, animated by WAAPI */
  inset: 0;
  background: radial-gradient(closest-side,
              var(--pressable-feedback-ripple-color, currentColor) max(100% - 70px, 65%), transparent 100%);
  transform-origin: 50% center;
  transition: opacity .375s;                               /* easing: ease */
}
.pressable-feedback__ripple-surface.--hover::before {
  background-color: var(--pressable-feedback-ripple-color, currentColor);
  opacity: var(--pressable-feedback-ripple-hover-opacity, .08);
}
.pressable-feedback__ripple-surface.--press::after {
  opacity: var(--pressable-feedback-ripple-pressed-opacity, .12);
  transition-duration: 75ms;
}
```

The state classes are literally `--hover` and `--press` (double dash, no block prefix), toggled on the surface.

### `.pressable-feedback__hold-confirm`

```css
.pressable-feedback__hold-confirm {
  --pressable-feedback-hold-confirm-duration: 2s;
  --pressable-feedback-hold-confirm-release-duration: .2s;
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  gap: inherit; pointer-events: none; border-radius: inherit;
  transition: clip-path var(--pressable-feedback-hold-confirm-release-duration) ease-out;
}
.pressable-feedback__hold-confirm[data-sweep="right"] { clip-path: inset(0 100% 0 0); }
.pressable-feedback__hold-confirm[data-sweep="left"]  { clip-path: inset(0 0 0 100%); }
.pressable-feedback__hold-confirm[data-sweep="down"]  { clip-path: inset(0 0 100%); }
.pressable-feedback__hold-confirm[data-sweep="up"]    { clip-path: inset(100% 0 0); }
.pressable-feedback__hold-confirm[data-holding="true"] {
  clip-path: inset(0);
  transition: clip-path var(--pressable-feedback-hold-confirm-duration) linear;
}
.pressable-feedback__hold-confirm[data-complete="true"] { clip-path: inset(0); transition: none; }
:disabled > .pressable-feedback__hold-confirm,
[aria-disabled="true"] > .pressable-feedback__hold-confirm { display: none; }
```

Background/foreground come from the consumer `className` (`bg-accent text-accent-foreground`, `bg-danger
text-danger-foreground`, `bg-accent-soft text-accent-soft-foreground`). Font/size/gap inherit from the host
(measured 14px, gap 8px inside `button--md`).

### `.pressable-feedback__progress-feedback`

Identical to hold-confirm with its own vars and state attribute:

```css
.pressable-feedback__progress-feedback {
  --pressable-feedback-progress-feedback-duration: 2s;
  --pressable-feedback-progress-feedback-release-duration: .3s;
  /* same layout block as hold-confirm */
  transition: clip-path var(--pressable-feedback-progress-feedback-release-duration) ease-out;
}
/* same four [data-sweep] start insets */
.pressable-feedback__progress-feedback[data-progressing="true"] {
  clip-path: inset(0);
  transition: clip-path var(--pressable-feedback-progress-feedback-duration) linear;
}
.pressable-feedback__progress-feedback[data-complete="true"] { clip-path: inset(0); transition: none; }
:disabled > .pressable-feedback__progress-feedback,
[aria-disabled="true"] > .pressable-feedback__progress-feedback { display: none; }
```

### CSS custom properties

| Variable | Declared on | Default | Used by |
| --- | --- | --- | --- |
| `--pressable-feedback-highlight-color` | `.__highlight` | `currentColor` | highlight background |
| `--pressable-feedback-highlight-opacity` | `.__highlight` | `.08` | hover opacity |
| `--pressable-feedback-highlight-pressed-opacity` | `.__highlight` | `.12` | pressed opacity |
| `--pressable-feedback-transition-duration` | `.__highlight` | `.15s` | highlight opacity transition (not in docs) |
| `--pressable-feedback-ripple-color` | not declared (fallback) | `currentColor` | ripple ::before/::after colour |
| `--pressable-feedback-ripple-hover-opacity` | not declared (fallback) | `.08` | `.--hover::before` |
| `--pressable-feedback-ripple-pressed-opacity` | not declared (fallback) | `.12` | `.--press::after` |
| `--pressable-feedback-ripple-duration` | not declared (fallback) | `.15s` | `::before` opacity/background transition (not in docs) |
| `--pressable-feedback-hold-confirm-duration` | `.__hold-confirm` + inline | `2s` / `2000ms` | holding transition |
| `--pressable-feedback-hold-confirm-release-duration` | `.__hold-confirm` + inline | `.2s` / `200ms` | release transition |
| `--pressable-feedback-progress-feedback-duration` | `.__progress-feedback` + inline | `2s` / `2000ms` | progressing transition |
| `--pressable-feedback-progress-feedback-release-duration` | `.__progress-feedback` + inline | `.3s` / `300ms` | reset transition |

Ripple colour = host `color` by default (e.g. accent-foreground on a primary button, accent-soft-foreground on
secondary). Demos recolour it with a text utility on the ripple element (`text-rose-200`, `text-sky-300`).

## 5. Behaviour

### 5.1 Event binding model

All JS parts attach **native** listeners to `parentElement` (the host) in an effect, not React props. Evidence: they
work inside OSS `Card` (no React handlers), they fire on synthetic `dispatchEvent` before React Aria, Ripple hover reacts
to native `pointerenter` but not `pointerover`, and HoldConfirm starts on right-button `pointerdown` that React Aria
ignores. Listeners must be removed on unmount / host change.

Observed listener sets:

| Part | Events |
| --- | --- |
| Ripple | `pointerenter`, `pointerleave`, `pointerdown`, `pointerup`, `pointercancel`, `click`, `contextmenu` |
| HoldConfirm | `pointerdown`, `pointerup`, `pointerleave`, `pointercancel`, `keydown` (Enter/Space), `keyup` (Enter/Space) |
| ProgressFeedback | `click`, `keydown` (Enter/Space) |
| Highlight | none (CSS `:hover`/`:active`/`[data-hovered]`/`[data-pressed]` on the parent) |

### 5.2 Ripple - state machine (md-ripple port)

States: `INACTIVE`, `TOUCH_DELAY`, `HOLDING`, `WAITING_FOR_CLICK` (md naming; all transitions below were observed).

- `shouldReactToEvent(e)`: ignore when disabled (host `disabled`/`aria-disabled`, or ripple `isDisabled`), when
  `!e.isPrimary`, when a press is in progress for another `pointerId`; for `pointerenter`/`pointerleave` react only to
  non-touch pointers; for other pointer events react only to touch or `e.buttons === 1` (primary mouse button).
  Observed: right-button `pointerdown` -> no ripple; `pointercancel` from a mouse with `buttons: 0` -> ignored;
  `pointercancel` with `buttons: 1` or touch -> ends the press.
- **Nested-interactive filter** (Pro addition, not in md): ignore pointer/click events whose `target.closest(...)`
  hits an interactive descendant other than the host. Observed blocked: `button`, `a` (with or without `href`),
  `input`, `select`, `textarea`, `[role="button"]`. Not blocked: `label`, `[tabindex]` div, `summary`, `[role=link]`,
  `[role=checkbox|switch|tab|menuitem|option]`, `[data-rac]`, `[data-react-aria-pressable]`, and a nested non-interactive
  element that contains another ripple. Effect: pressing the "Notify me" Button inside the ripple Card animates only the
  Button's ripple. Suggested selector: `button, a, input, select, textarea, [role="button"]` with
  `match !== host && host.contains(match)`.
- `pointerenter` (mouse/pen): add `--hover`. `pointerleave`: remove `--hover`; if state != INACTIVE, end press.
- `pointerdown`:
  - mouse/pen: state = `WAITING_FOR_CLICK`, start press animation immediately with the event position.
  - touch: state = `TOUCH_DELAY`, wait **150 ms** (observed 154 ms); if still in `TOUCH_DELAY`, state = `HOLDING` and
    start the press animation with the original pointerdown position. Touch never sets `--hover`.
- `pointerup`: if `HOLDING` -> `WAITING_FOR_CLICK`; if `TOUCH_DELAY` (quick tap) -> `WAITING_FOR_CLICK` and start the
  press animation now (observed: tap of 63 ms started the animation at pointerup).
- `click`: if `WAITING_FOR_CLICK` -> end press. If `INACTIVE` (click with no preceding pointerdown: keyboard-activated
  native click, `element.click()`): start + immediately end a press. **Pro bug**: it uses the click event's
  `clientX/clientY` (0,0 for keyboard/programmatic clicks), so the ripple starts at the viewport origin, i.e.
  `translate(-rect.left px, -rect.top px)` (observed on ItemCard with Enter). md-ripple starts centred in this case.
  Recommendation: start centred when the click has `detail === 0` / no pointer coordinates.
- `contextmenu`, `pointercancel` (accepted per filter), `pointerleave` while pressed: end press.
- **End press**: set state `INACTIVE`, then after `minimumPressDuration` remove `--press`, guarded so an older timer
  never clears a newer press (observed: re-press 100 ms after a click kept `--press` for the whole second hold).
  Observed delays, measured from the end trigger: click after 0/50/150/300 ms holds -> `--press` removed
  **~230 ms after the click** every time (233/241/233/233 ms); pointerleave -> +234 ms; contextmenu -> +240 ms;
  pointercancel -> +239 ms. This differs from md-ripple, which only waits for the *remaining* part of 225 ms counted
  from press start (see 9). Starting a new press cancels the previous grow animation (only one ripple animation ever
  exists on the surface).
- Keyboard on hosts built with React Aria (OSS `Button`): Enter/Space produce **no ripple** (RAC prevents the native
  click; ripple has no key listeners). On native `<button>` hosts without RAC (ItemCard), Enter/Space fire a native
  click -> ripple via the `INACTIVE` click path (see bug above).
- When the host is disabled: `pointerdown` is ignored (no animation). Disabled native buttons receive no trusted events
  anyway (`pointer-events: none`).

### 5.3 Ripple - press animation (formulae, all measured)

```ts
const rect = host.getBoundingClientRect();           // untransformed size at pointerdown
const maxDim = Math.max(rect.width, rect.height);
const initialSize = Math.floor(maxDim * 0.2);         // INITIAL_ORIGIN_SCALE = 0.2
const softEdgeSize = Math.max(0.35 * maxDim, 75);     // SOFT_EDGE_CONTAINER_RATIO, SOFT_EDGE_MINIMUM_SIZE
const maxRadius = Math.hypot(rect.width, rect.height) + 12;   // PADDING = 12 (md uses 10)
const scale = (maxRadius + softEdgeSize) / initialSize;

// start = raw pointer position inside the host (NOT shifted by -initialSize/2 as in md)
const start = {x: e.clientX - rect.left, y: e.clientY - rect.top};
// end = ripple square centred in the host
const end = {x: (rect.width - initialSize) / 2, y: (rect.height - initialSize) / 2};

surface.animate(
  {
    height: [`${initialSize}px`, `${initialSize}px`],
    width: [`${initialSize}px`, `${initialSize}px`],
    transform: [`translate(${start.x}px,${start.y}px) scale(1)`, `translate(${end.x}px,${end.y}px) scale(${scale})`],
  },
  {pseudoElement: "::after", duration /* 150 */, fill: "forwards"}, // no easing -> linear
);
surface.classList.add("--press"); // same tick, after animate()
```

Measured samples (every one matches the formula exactly; `hypot + 12 + softEdge`):

| Host | w x h (px) | pointer (x, y) in host | initialSize | scale | start translate | end translate |
| --- | --- | --- | --- | --- | --- | --- |
| Button md "Primary" | 84.11 x 36 | (11.30, 9) real click | 16 | 11.15561 | (11.297, 9) | (34.055, 10) |
| Button md "Secondary" | 104.52 x 36 | (10, 5) | 20 | 9.87710 | (10, 5) | (42.258, 8) |
| Button md "Add Member" | 138.59 x 36 | (30, 10) touch | 27 | 8.52567 | (30, 10) | (55.797, 4.5) |
| Button md "Delete" | 94.94 x 36 | (5, 5) | 18 | 10.47410 | (5, 5) | (38.469, 9) |
| Button md icon-only | 36 x 36 | (18, 18) | 7 | 19.70167 | (18, 18) | (14.5, 14.5) |
| Button sm "Notify me" | 89.09 x 32 | (10, 10) | 17 | 10.68625 | (10, 10) | (36.047, 7.5) |
| Card | 500 x 220 | (125, 165) | 100 | 7.33260 | (125, 165) | (200, 60) |
| Card | 242 x 160 | (60.5, 120) | 48 | 8.05855 | (60.5, 120) | (97, 56) |
| ItemCard (Enter key) | 500 x 62 | viewport (0, 0) | 100 | 6.90829 | (-262, -353) | (200, -19) |

Visual sequence for a mouse click: `::after` (radial gradient, opacity 0 -> `pressedOpacity` with a 75 ms `ease`
transition) grows from a `initialSize` square at the pointer to a circle covering the host in `duration` ms (linear),
stays full (fill forwards) until `--press` is removed (~225 ms after release), then fades out over 375 ms (`ease`).
`::before` (flat hover layer) fades in/out over 150 ms (`ease`) with `--hover`. Both use `currentColor`.

RTL caveat: `::after` has `inset: 0` plus animated `width/height` and no `top/left` keyframes (md animates
`top: [0,0], left: [0,0]`). In RTL the over-constrained box resolves against `right`, so the translate maths
(left-based) would be off. Recommendation: add `top/left: 0` keyframes or `inset: 0 auto auto 0` for `::after`.

### 5.4 Highlight

Pure CSS on the parent state: hover (only in `@media (hover: hover)`) -> opacity `.08`; `:active` / `data-pressed` ->
`.12`; 150 ms `ease` opacity transition; hidden when the parent is `:disabled` / `aria-disabled`. Works on RAC hosts
via `data-hovered` / `data-pressed` (OSS Button sets them) and on plain hosts via `:hover` / `:active`.

### 5.5 HoldConfirm

| Time | Event | DOM |
| --- | --- | --- |
| 0 | `pointerdown` on host (any pointer type, **any mouse button**, no touch delay) or `keydown` Enter/Space (`repeat` ignored) | `data-holding="true"` -> clip-path transitions to `inset(0)` over `duration` ms linear |
| < duration | `pointerup` on host, `pointerleave`, `pointercancel`, `keyup` Enter/Space | `data-holding` removed -> clip-path transitions back to the sweep start over `releaseDuration` ms `ease-out` (from wherever it is) |
| = duration (timer; observed 2012-2015 ms for 2000) | `onComplete()` | `resetOnComplete=true` (default): `data-holding` removed in the same commit as `onComplete` -> overlay snaps back with the release transition **even if the pointer/key is still down**; no restart until a fresh pointerdown/keydown. `data-complete` is never set in this mode. `resetOnComplete=false`: expected `data-complete="true"` (clip-path `inset(0)`, `transition: none`, overlay stays) - not observable in any demo |

Not cancelling: `blur` while a key hold is active (hold kept until keyup), `pointerup` on another element without a
preceding `pointerleave`. Other keys (`a`, `Escape`, `Tab`) do nothing. HoldConfirm does not `preventDefault`
pointerdown or contextmenu (keydown is prevented by RAC on Button hosts). Disabled host: pointerdown ignored, overlay
`display: none`. The overlay content is fully hidden at rest by the start inset (`inset(0 100% 0 0)` for `right`).

Sweep meaning (start inset -> `inset(0)`): `right` reveals left-to-right, `left` right-to-left, `down` top-to-bottom,
`up` bottom-to-top.

### 5.6 ProgressFeedback

| Time | Event | DOM |
| --- | --- | --- |
| 0 | native `click` on host (mouse, touch, keyboard-generated, programmatic) or `keydown` Enter/Space on host (fires on keydown, before RAC; `pointerdown` alone does nothing) | `data-progressing="true"` -> clip-path to `inset(0)` over `duration` ms linear |
| `duration` (observed 2009-2017 ms) | timer | `data-progressing` removed + `data-complete="true"` + `onComplete()` in the same commit (`transition: none`, stays full) |
| `duration + resetDelay` (observed 3514-3518 ms) | timer, only if `autoReset` | `data-complete` removed -> idle; clip-path snaps back over `releaseDuration` ms `ease-out`; `onReset()` (inferred timing) |

Clicks/keys while progressing or complete are ignored (no restart, no early reset). A click after the reset restarts
(observed 290 ms after reset, i.e. during the snap-back). With `autoReset=false` the overlay stays revealed forever and
further clicks are ignored (no documented way to reset other than remount). Disabled host: click ignored, overlay
`display: none`.

### 5.7 Root, focus, ARIA, disabled

- Root focus ring: `:focus-visible:not([data-focused])` or `[data-focus-visible="true"]` -> OSS focus ring (2px
  `--focus` ring + `--ring-offset-width` offset in `--background`). Same selector pattern as OSS `.button`.
- Root disabled: `:disabled` / `[aria-disabled="true"]` -> `opacity: var(--disabled-opacity)`, `cursor:
  var(--cursor-disabled)`, `pointer-events: none`; Highlight/HoldConfirm/ProgressFeedback children `display: none`
  (CSS child selectors). The Ripple stays `display: block` under a disabled parent (only its own `aria-disabled`
  hides it) but receives no events.
- Parts do not inherit `isDisabled` from the host as attributes (disabled demo: no attributes on the parts); they read
  the host's disabled state at event time.
- ARIA: all parts are `aria-hidden="true"` and `pointer-events: none`; no roles, no live regions. Semantics and
  accessible name come from the host/root.
- Reduced motion: no CSS or observed JS handling (`matchMedia` not called during a press). Recommendation for the
  remake: honour `prefers-reduced-motion` (skip WAAPI grow, shorten clip-path transitions), flagged as an addition.
- Forced colors: ripple hidden.

### 5.8 md-ripple comparison

| Aspect | md-ripple (Material Web, from memory of its source) | Pro (observed) |
| --- | --- | --- |
| Grow duration / easing | 450 ms, `cubic-bezier(0.2, 0, 0, 1)` | 150 ms (`duration` prop), linear (no easing passed) |
| Keyframes | `top/left [0,0]`, `height/width`, `transform` | `height/width`, `transform` (no top/left) |
| Start point | pointer - initialSize/2 | pointer (no centring offset) |
| PADDING | 10 | 12 |
| INITIAL_ORIGIN_SCALE / soft edge | 0.2 / max(0.35*maxDim, 75) | same |
| Touch delay | 150 ms | 150 ms |
| Minimum press | 225 ms counted from press start (remaining time only) | 225 ms (`minimumPressDuration`) counted from the end trigger |
| Click without pointerdown | centred ripple | ripple from click clientX/Y (0,0 -> off-element) |
| Hover/press classes | `.hovered` / `.pressed` | `.--hover` / `.--press` |
| Hover transition | 15 ms linear | 150 ms ease (`--pressable-feedback-ripple-duration`) |
| Press fade-in | 105 ms | 75 ms |
| Release fade-out | 375 ms linear | 375 ms ease |
| Gradient | `closest-side, color max(100% - 70px, 65%), transparent 100%` | same |
| Attachment | `for`/parent via `attach()` | always `parentElement` |
| Nested interactive filter | no | yes (button, a, input, select, textarea, [role=button]) |

## 6. Demo variants

All demo pages: `https://heroui.pro/docs/react/demos/pressable-feedback-<slug>?theme=light|dark`. Icons are 16px
gravity-ui style icons; the overlay usually repeats the host icon.

1. **Usage / default** (`pressable-feedback-default`) - `flex flex-col gap-6`, rows `flex flex-wrap gap-3` of OSS
   `Button` (md) each with `PressableFeedback.Ripple` as first child. Row 1 text buttons: Primary (primary), Secondary,
   Tertiary, Outline, Ghost, Danger. Row 2 icon + text: Search (primary, globe icon), Add Member (secondary, plus),
   Email (tertiary, envelope), Delete (danger, trash). Row 3 icon-only: tertiary (ellipsis), secondary (gear), danger
   (trash).
2. **Pressable Cards** (`pressable-cards`) - `grid w-[500px] grid-cols-12 gap-4`:
   - col-span-12 `Card` (`relative h-[220px] overflow-hidden`, 500x220, cursor auto): Ripple with `className="z-1"`;
     full-bleed image (`absolute inset-0 z-0 object-cover`, aria-hidden); header `z-10` with title "NEO" (`text-xs
     font-semibold tracking-wide text-black/70`) and description "Home Robot" (`text-sm font-medium text-black/50`);
     footer `z-10 mt-auto flex items-center justify-between`: "Available soon" / "Get notified" text + `Button size="sm"
     variant="tertiary" className="bg-white text-black"` "Notify me" that has its own Ripple (pressing it does not
     ripple the card).
   - two col-span-6 `Card`s (`cursor-pointer gap-2 overflow-hidden`, 242x160) with coloured Ripples (`text-rose-200`,
     `text-sky-300`): rounded-xl 56px avatar, "Indie Hackers" / "148 members" and "AI Builders" / "362 members"
     (`text-sm leading-4 font-medium` + `text-muted text-xs`), footer 16px avatar + "By John" / "By Martha".
   - two col-span-12 `Card variant="transparent"` rows (`flex flex-row gap-3 p-2 cursor-pointer overflow-hidden`,
     500x96) with `PressableFeedback.Highlight`: 80px rounded-xl image + title/description "Bridging the Future" /
     "Today, 6:30 PM" and "Avocado Hackathon" / "Wed, 4:30 PM".
3. **Comparison** (`comparison`) - four labelled sections (`text-muted mb-2 block text-xs font-medium` label: "Ripple",
   "Highlight", "Hold Confirm", "Progress Feedback"), each a row of Buttons Primary (primary), Secondary (secondary),
   Outline (outline). Hold/Progress overlay classes: primary -> `bg-accent text-accent-foreground`, secondary ->
   `bg-accent-soft text-accent-soft-foreground`, outline -> `bg-danger text-danger-foreground`; overlay text = label.
4. **With Highlight** (`with-highlight`) - same three rows as Usage, Highlight instead of Ripple.
5. **With Ripple** (`with-ripple`) - same as Usage plus "Danger Soft" (`danger-soft`) at the end of row 1.
6. **With Hold Confirm** (`with-hold-confirm`) - hint "Press and hold buttons to see the clip-path reveal."; row:
   "Hold to Delete" (danger-soft, trash; overlay `bg-danger text-danger-foreground`, trash + same label), "Hold to Apply"
   (secondary, gear; overlay `bg-accent-soft text-accent-soft-foreground`), "Hold to Add" (tertiary, plus; overlay
   `bg-accent text-accent-foreground`, plus + "Added!"); icon-only row: danger-soft trash (overlay bg-danger,
   `sweep="up"`), secondary gear (overlay bg-accent, right).
7. **With Progress Feedback** (`with-progress-feedback`) - hint "Click once - the overlay sweeps in automatically."
   (em dash in original); secondary "Buy Now" (cart icon; overlay `bg-accent text-accent-foreground` text only
   "Buying!"), secondary "Apply Settings" (gear; overlay gear + "Applied!"), tertiary "Add Item" (plus; overlay plus +
   "Added!"); icon-only: danger-soft trash (overlay `bg-danger`, `sweep="up"`), secondary gear (overlay bg-accent).
8. **Hold Confirm Durations** (`hold-confirm-durations`) - hint "Different hold durations: fast (800ms), default (2s),
   slow (4s)."; three danger-soft trash buttons "Fast (800ms)", "Default (2s)", "Slow (4s)", overlay `bg-danger
   text-danger-foreground` (icon + same label), `duration` 800 / 2000 / 4000.
9. **Hold Confirm Sweep** (`hold-confirm-sweep`) - hint "The clip-path reveal can sweep in four directions: right,
   left, down, up."; danger-soft trash buttons "Sweep Right/Left/Down/Up" with matching `sweep`, overlay bg-danger;
   icon-only row of three secondary gear buttons, overlay `bg-accent text-accent-foreground`, sweeps up / down / left.
10. **Progress Feedback Durations** (`progress-feedback-durations`) - hint "Different progress durations: fast (800ms),
    default (2s), slow (4s)."; three secondary icon buttons "Fast (800ms)", "Default (2s)", "Slow (4s)", overlay
    `bg-accent text-accent-foreground`, `duration` 800 / 2000 / 4000.
11. **Progress Feedback Sweep** (`progress-feedback-sweep`) - same hint as 9; four secondary icon buttons "Sweep
    Right/Left/Down/Up", overlay bg-accent; icon-only row of three secondary buttons, sweeps up / down / left.
12. **Progress Feedback No Reset** (`progress-feedback-no-reset`) - hint "With autoReset=false, the overlay stays
    revealed after progress completes."; danger-soft "Delete Account" (trash; overlay bg-danger + "Account Deleted"),
    secondary "Apply Settings" (gear; overlay bg-accent + "Settings Applied"); `autoReset={false}`.
13. **Standalone Highlight** (`standalone-highlight`) - `w-[500px]` wrapper; Pro `ItemCard` rendered as a native
    `<button type="button" class="item-card item-card--default relative w-full cursor-pointer overflow-hidden"
    data-slot="item-card">` (500x62, radius 16px, padding 12px 16px) with Highlight first; icon (person), title
    "Profile", description "Update your personal information", action chevron-right (`text-muted size-4
    rtl:-scale-x-100`).
14. **Standalone Ripple** (`standalone-ripple`) - same ItemCard with Ripple.
15. **Disabled** (`disabled`) - `flex flex-col gap-4`, four rows of `isDisabled` Buttons (`disabled`,
    `data-disabled="true"`, opacity .5): Ripple row "Disabled Ripple" (primary), "Secondary", icon-only tertiary gear;
    Highlight row "Disabled Highlight", "Secondary", icon-only; HoldConfirm row "Disabled Hold" (danger-soft trash,
    overlay bg-danger), "Secondary" (overlay bg-accent-soft); Progress row "Disabled Progress" (danger-soft trash,
    overlay bg-danger), "Secondary" (overlay bg-accent-soft).
16. **Hold Confirm Callback** (`hold-confirm-callback`) - centred `flex flex-col items-center gap-4`: danger-soft "Hold
    to Delete" (trash) with HoldConfirm (overlay bg-danger + same label) and `<p class="text-muted text-xs">Count:
    <strong>0</strong></p>` incremented by `onComplete` (only full holds count).
17. **Progress Feedback Callback** (`progress-feedback-callback`) - same layout; secondary "Send" (paper-plane icon) with
    ProgressFeedback (overlay `bg-accent text-accent-foreground`, icon + "Send"); Count incremented by `onComplete`.

The public Storybook (`storybook.heroui.pro`, "Pro Components/PressableFeedback") has the same 16 stories (no Usage);
rendered canvas DOM is identical. No demo or story renders the `PressableFeedback` root.

## 7. Theme / token dependencies

Component CSS uses: `--cursor-interactive`, `--cursor-disabled`, `--disabled-opacity`, `--focus`,
`--ring-offset-width`, `--background` (root only) and `currentColor` (highlight, ripple). Demo overlays use the
`bg-accent/-soft`, `bg-danger`, `text-*-foreground` utilities. There are no theme-specific selectors; light vs dark
differs only through token values:

| Token | Light | Dark |
| --- | --- | --- |
| `--accent` / `--focus` | `lab(54.53% 3.32 -66.53)` | same |
| `--accent-foreground`, `--danger-foreground` | `lab(98.97% 0 0)` | same |
| `--accent-soft` | `color-mix(in oklab, accent 15%, transparent)` | `... 12%, transparent` |
| `--accent-soft-foreground` | `color-mix(accent 70%, lab(8.34%) 30%)` | `color-mix(accent 80%, lab(98.97%) 30%)` |
| `--danger` | `lab(57.42% 73.56 48.01)` | `lab(50.91% 62.27 37.59)` |
| `--danger-soft` | `color-mix(danger 15%, transparent)` | same formula with dark danger |
| `--background` | `lab(96.54% 0 0)` | `lab(1.55% .18 -.65)` |
| `--foreground` / `--default-foreground` | `lab(8.34% .61 -2.13)` | `lab(98.97% 0 0)` |
| `--default` | `lab(93.03% .1 -.36)` | `lab(15.73% .61 -2.17)` |
| `--disabled-opacity`, `--ring-offset-width` | `.5`, `2px` | same |
| `--cursor-interactive` / `--cursor-disabled` | `pointer` / `not-allowed` | same |

Consequence: ripple/highlight follow the host text colour, e.g. white on a primary button, accent-ish on secondary,
dark-on-light / light-on-dark on tertiary/ghost.

## 8. Dependencies

- OSS HeroUI (`@heroui/react`, `@heroui/styles`): `dom` helper + `DOMRenderProps`/`DOMRenderFunction`
  (`packages/react/src/utils/dom.tsx`) for the root's `render` prop; `status-focused`, `status-disabled`,
  `no-highlight` utilities (`packages/styles/utilities/index.css`); demos use `Button` (`.button`, already `relative
  isolate`, `scale(0.97)` on press, RAC `data-hovered`/`data-pressed`), `Card` (`.card`, `relative`), `Avatar`.
- React Aria: not needed by the parts (native listeners). The root probably uses `@react-aria/interactions`
  (`usePress`/`useHover`) + `@react-aria/focus` (`useFocusRing`) to emit the data attributes its CSS expects
  (inferred). Note OSS Button's RAC `usePress` fires a fallback `click()` ~80 ms after a `pointerup` that got no
  native click; the ripple then ends ~225 ms later (observed +325 ms total).
- Pro: `ItemCard` (standalone demos only).
- Third-party: none at runtime (Web Animations API, CSS transitions). Demo icons: gravity-ui icons (`@gravity-ui/icons`
  is available in `packages/storybook`; `@iconify/react` in `packages/pro` devDependencies).

## 9. Open questions / uncertainties

1. **Root element** is never rendered publicly: its `data-slot`, whether it uses RAC hooks (data attributes) or plain
   `:hover/:active`, and how `isDisabled` maps (`disabled` vs `aria-disabled`) are inferred from CSS + docs only.
2. **Minimum press timing**: observed `--press` removal ~225-240 ms after the end trigger regardless of hold length
   (holds of 0-300 ms, document timeline confirmed ticking). The demo pane was intermittently hidden (frozen
   animation timeline), so a md-style "remaining time since press start" implementation cannot be excluded with
   certainty; re-verify in a visible tab. Recommendation: implement the observed rule (`setTimeout(minimumPressDuration)`
   after end, guarded per press).
3. `resetOnComplete={false}` (HoldConfirm) is in no demo: `data-complete="true"` per CSS/docs, but when it resets (next
   pointerdown? never?) is unknown. Recommendation: clear on the next press start.
4. `onReset` timing is inferred (same commit as `data-complete` removal); not observable in demos.
5. Whether `Ripple` writes `--pressable-feedback-ripple-*-opacity` / `--pressable-feedback-ripple-duration` inline
   when `hoverOpacity`/`pressedOpacity`/`duration` are passed (defaults render no `style`), and whether `duration` also
   drives the `::before` transition, is unknown.
6. HoldConfirm starts on any mouse button (right-click observed). Likely unintended; consider restricting to primary.
7. Ripple click-path bug (keyboard/programmatic click starts the ripple at viewport 0,0) and missing `-initialSize/2`
   start offset: decide whether to replicate or follow md (recommended: follow md for both; visually near-identical).
8. RTL behaviour of the ripple `::after` (see 5.3) was not tested.
9. No `prefers-reduced-motion` handling was found; JS-side checks at mount time could not be ruled out.
10. Visual curve of the clip-path transitions could not be sampled (frozen timeline while hidden); values come from the
    CSSOM (`linear` while holding/progressing, `ease-out` on release).

## Appendix A - raw CSSOM dump (all rules matching `pressable-feedback`, identical in light and dark)

```css
/* @layer components */
.pressable-feedback { --tw-outline-style: none; -webkit-tap-highlight-color: transparent; border-radius: inherit; cursor: var(--cursor-interactive); outline-style: none; display: inline-flex; position: relative; overflow: hidden; }

/* @layer components */
.pressable-feedback:focus-visible:not([data-focused]), .pressable-feedback[data-focus-visible="true"] { --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); --tw-ring-color: var(--focus); --tw-ring-offset-width: var(--ring-offset-width); --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-offset-color: var(--background); --tw-outline-style: none; outline-style: none; }

/* @layer components */
.pressable-feedback:disabled, .pressable-feedback[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }

/* @layer components */
.pressable-feedback__highlight { --pressable-feedback-highlight-color: currentColor; --pressable-feedback-highlight-opacity: .08; --pressable-feedback-highlight-pressed-opacity: .12; --pressable-feedback-transition-duration: .15s; pointer-events: none; border-radius: inherit; background-color: var(--pressable-feedback-highlight-color); opacity: 0; transition: opacity var(--pressable-feedback-transition-duration) ease; position: absolute; inset: 0px; }

/* @layer components > @media (hover: hover) */
:hover > .pressable-feedback__highlight, [data-hovered="true"] > .pressable-feedback__highlight { opacity: var(--pressable-feedback-highlight-opacity); }

/* @layer components */
:active > .pressable-feedback__highlight, [data-pressed="true"] > .pressable-feedback__highlight { opacity: var(--pressable-feedback-highlight-pressed-opacity); }

/* @layer components */
:disabled > .pressable-feedback__highlight, [aria-disabled="true"] > .pressable-feedback__highlight { display: none; }

/* @layer components */
.pressable-feedback__ripple { pointer-events: none; border-radius: inherit; width: 100%; height: 100%; margin: auto; display: block; position: absolute; inset: 0px; overflow: hidden; }

/* @layer components */
.pressable-feedback__ripple[aria-disabled="true"] { display: none; }

/* @layer components > @media (forced-colors: active) */
.pressable-feedback__ripple { display: none; }

/* @layer components */
.pressable-feedback__ripple-surface { pointer-events: none; border-radius: inherit; inset: 0px; }

/* @layer components */
.pressable-feedback__ripple-surface::before, .pressable-feedback__ripple-surface::after { content: ""; opacity: 0; position: absolute; }

/* @layer components */
.pressable-feedback__ripple-surface::before { background-color: var(--pressable-feedback-ripple-color,currentColor); width: 100%; height: 100%; transition: opacity var(--pressable-feedback-ripple-duration,.15s), background-color var(--pressable-feedback-ripple-duration,.15s); inset: 0px; }

/* @layer components */
.pressable-feedback__ripple-surface::after { background: radial-gradient(closest-side, var(--pressable-feedback-ripple-color,currentColor) max(100% - 70px, 65%), transparent 100%); transform-origin: 50% center; transition: opacity 0.375s; inset: 0px; }

/* @layer components */
.pressable-feedback__ripple-surface.--hover::before { background-color: var(--pressable-feedback-ripple-color,currentColor); opacity: var(--pressable-feedback-ripple-hover-opacity,.08); }

/* @layer components */
.pressable-feedback__ripple-surface.--press::after { opacity: var(--pressable-feedback-ripple-pressed-opacity,.12); transition-duration: 75ms; }

/* @layer components */
.pressable-feedback__hold-confirm { --pressable-feedback-hold-confirm-duration: 2s; --pressable-feedback-hold-confirm-release-duration: .2s; justify-content: center; align-items: center; gap: inherit; pointer-events: none; border-radius: inherit; transition: clip-path var(--pressable-feedback-hold-confirm-release-duration) ease-out; display: flex; position: absolute; inset: 0px; }

/* @layer components */
.pressable-feedback__hold-confirm[data-sweep="right"] { clip-path: inset(0px 100% 0px 0px); }

/* @layer components */
.pressable-feedback__hold-confirm[data-sweep="left"] { clip-path: inset(0px 0px 0px 100%); }

/* @layer components */
.pressable-feedback__hold-confirm[data-sweep="down"] { clip-path: inset(0px 0px 100%); }

/* @layer components */
.pressable-feedback__hold-confirm[data-sweep="up"] { clip-path: inset(100% 0px 0px); }

/* @layer components */
.pressable-feedback__hold-confirm[data-holding="true"] { clip-path: inset(0px); transition: clip-path var(--pressable-feedback-hold-confirm-duration) linear; }

/* @layer components */
.pressable-feedback__hold-confirm[data-complete="true"] { clip-path: inset(0px); transition: none; }

/* @layer components */
:disabled > .pressable-feedback__hold-confirm, [aria-disabled="true"] > .pressable-feedback__hold-confirm { display: none; }

/* @layer components */
.pressable-feedback__progress-feedback { --pressable-feedback-progress-feedback-duration: 2s; --pressable-feedback-progress-feedback-release-duration: .3s; justify-content: center; align-items: center; gap: inherit; pointer-events: none; border-radius: inherit; transition: clip-path var(--pressable-feedback-progress-feedback-release-duration) ease-out; display: flex; position: absolute; inset: 0px; }

/* @layer components */
.pressable-feedback__progress-feedback[data-sweep="right"] { clip-path: inset(0px 100% 0px 0px); }

/* @layer components */
.pressable-feedback__progress-feedback[data-sweep="left"] { clip-path: inset(0px 0px 0px 100%); }

/* @layer components */
.pressable-feedback__progress-feedback[data-sweep="down"] { clip-path: inset(0px 0px 100%); }

/* @layer components */
.pressable-feedback__progress-feedback[data-sweep="up"] { clip-path: inset(100% 0px 0px); }

/* @layer components */
.pressable-feedback__progress-feedback[data-progressing="true"] { clip-path: inset(0px); transition: clip-path var(--pressable-feedback-progress-feedback-duration) linear; }

/* @layer components */
.pressable-feedback__progress-feedback[data-complete="true"] { clip-path: inset(0px); transition: none; }

/* @layer components */
:disabled > .pressable-feedback__progress-feedback, [aria-disabled="true"] > .pressable-feedback__progress-feedback { display: none; }
```

## Appendix B - selected raw observations

`getAnimations({subtree: true})` on a Secondary button 50 ms after `pointerdown` (mouse) at (10, 5):

```text
button            transform  translateZ(0) -> scale(0.97)   250ms ease        (OSS .button press transition)
button            background-color                          100ms cubic-bezier(0,0,.2,1) (OSS)
surface::before   opacity 0 -> 0.08                          150ms ease  fill backwards (CSS transition, --hover)
surface::after    opacity 0 -> 0.12                          75ms  ease  fill backwards (CSS transition, --press)
surface::after    {height 20px, width 20px, transform translate(10px,5px) scale(1)}
               -> {height 20px, width 20px, transform translate(42.2578px,8px) scale(9.8771)}
                                                             150ms linear fill forwards (WAAPI)
```

Ripple class timeline, real mouse click on "Primary" (pointerdown t=0, pointerup t=5):
`t=0 animate()`, `t=1 class "--hover --press"`, `t=1 data-hovered/data-pressed on button`, `t=5 data-pressed removed`,
`t=231 class "--hover"`.

Touch hold 400 ms: `t=0 pointerdown`, `t=154 animate() + "--press"` (no `--hover`), `t=415 pointerup + click`,
`t=646 "--press" removed`. Touch tap 63 ms: animation + `--press` at pointerup (t=64), removed t=291.

HoldConfirm (2000 ms) full hold: `t=1 data-holding="true"`, `t=2015 data-holding removed + onComplete (Count 1)`,
pointer still down until t=2605. Partial hold 1000 ms: removed at release (t=1015), no onComplete.

ProgressFeedback (2000/1500): `t=1 data-progressing="true"`, `t=2011 data-complete="true" + data-progressing removed +
onComplete`, `t=3514 data-complete removed`; clicks at t=1000 and t=2500 ignored; click at t=3808 restarts.
