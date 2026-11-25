# Hover Card — clean-room implementation spec

Slug: `hover-card` · Docs: https://heroui.pro/docs/react/components/hover-card · Category: DataDisplay
Storybook title (remake): `Pro/DataDisplay/HoverCard`
Import (Pro): `import {HoverCard} from "@heroui-pro/react";` (root export, no heavy peers)

Sources used: the public docs text, the rendered DOM and CSSOM of the six public demo pages (light and
dark), computed styles, runtime probing (pointer hover, Tab, Escape, MutationObserver timings) and
the OSS `react-aria-components` 1.22.1 / `react-aria` 3.53 packages installed in this repo (to see
which behaviour comes from React Aria). I did not open or try to get around the paywalled example
source.

---

## 1. Purpose

A popover card that opens while its trigger is hovered (or keyboard-focused, or long-pressed on
touch) and previews content such as a profile or an article without navigating away. Unlike a
tooltip, the card may hold interactive content and can be reached with Tab.

---

## 2. Anatomy

```tsx
<HoverCard>                                   // RAC PreviewTrigger (no DOM)
  <HoverCard.Trigger>                         // <span class="hover-card__trigger">
    <Link href="…">@handle</Link>             // any focusable child (OSS Link / Button)
  </HoverCard.Trigger>
  <HoverCard.Content aria-label="Profile preview">  // RAC Popover, role="dialog"
    <HoverCard.Arrow />                       // optional RAC OverlayArrow
    {/* … */}
  </HoverCard.Content>
</HoverCard>
```

| Part | Rendered element | `data-slot` | BEM class | Primitive |
|---|---|---|---|---|
| `HoverCard` (root) | none | — | — | RAC `PreviewTrigger` (`useTooltipTriggerState` + `usePreviewTrigger`, provides `FocusableContext`, `PopoverContext`, `OverlayTriggerStateContext`) |
| `HoverCard.Trigger` | `<span tabindex="-1" data-react-aria-pressable aria-haspopup="dialog" aria-expanded style="-webkit-touch-callout:none;-webkit-user-drag:none">` | `hover-card-trigger` | `hover-card__trigger` | `useFocusable({excludeFromTabOrder: true})` consuming the `FocusableContext` of `PreviewTrigger` |
| `HoverCard.Content` | portal → `<div style="display:contents">` → `<div role="dialog" tabindex="-1" dir data-rac data-trigger="PreviewTrigger" data-placement data-entering/data-exiting style="position:absolute; z-index:100000; max-height; --trigger-anchor-point; --trigger-width; left/top">` | `hover-card-content` | `hover-card__content` | RAC `Popover` (non-modal, gets `role="dialog"` because there is no `Dialog` child; RAC adds a visually hidden "Dismiss" button at the end and focus-scope sentinels around it) |
| `HoverCard.Arrow` | `<div data-rac data-placement style="position:absolute; transform:translateX(-50%); bottom/top:100%; left:…">` + `<svg width=12 height=12 viewBox="0 0 12 12" fill="none"><path d="M0 0C5.48483 8 6.5 8 12 0Z"/></svg>` | `hover-card-arrow` | `hover-card__arrow` | RAC `OverlayArrow` |

Observed details
- The trigger span is NOT in the tab order (`tabindex="-1"`). Because React Aria's focusable context is
  not cleared for descendants, the focusable child (RAC Link/Button inside the OSS components) ALSO
  receives the trigger props: the child shows `aria-haspopup="dialog"`, `aria-expanded`,
  `data-react-aria-pressable` and the same touch-callout style. Positioning uses the span (the parent's
  layout effect runs last, so the span wins the shared trigger ref).
- While open both span and child get `aria-controls` / `aria-describedby` = the content id.
- No other state attributes on the trigger (no `data-hovered`, `data-open`, `data-focused` on the span).
- The arrow is rendered as the first child of the content (wherever the user puts it).
- The root renders nothing.

---

## 3. API (from docs)

### `HoverCard` (root) — wraps RAC `PreviewTrigger`
| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | `boolean` | – | controlled → `isOpen` |
| `defaultOpen` | `boolean` | – | uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | – | |
| `openDelay` | `number` | `700` | → `delay` (RAC default would be 600) |
| `closeDelay` | `number` | `300` | → `closeDelay` (RAC default would be 200) |
| `isDisabled` | `boolean` | `false` | prevents opening |
| `children` | `ReactNode` | – | Trigger + Content |

Docs: hovering opens after `openDelay`; a safe area between trigger and card keeps it open while the
pointer travels to the card (even diagonally); delays are coordinated globally with other hover cards
AND tooltips (shared warm-up: once one has opened, the next opens immediately, without animation).

### `HoverCard.Trigger`
Inline wrapper that tracks hover, focus and long press on its children. On touch, a long press opens
the card and moves the screen-reader cursor into it. Supports all native `span` attributes.

### `HoverCard.Content` — wraps RAC `Popover`, `role="dialog"`
| Prop | Type | Default |
|---|---|---|
| `placement` | `Placement` | `'top'` |
| `offset` | `number` | `8` |
Plus every RAC Popover prop except `isOpen`, `defaultOpen`, `onOpenChange`, `triggerRef` (owned by
the root). Pass `aria-label` for an accessible name.

### `HoverCard.Arrow` — wraps RAC `OverlayArrow`
| Prop | Type | Default |
|---|---|---|
| `children` | `ReactNode` | default 12×12 SVG arrow |
Plus every RAC OverlayArrow prop.

### Accessibility (docs)
| Key | Action |
|---|---|
| Tab onto the trigger | opens the card (after the open delay, only for keyboard focus-visible) |
| Tab from the trigger | moves focus into the card (first tabbable element) |
| Escape | closes the card |

---

## 4. Styling (CSS classes / tokens)

Documented classes: `.hover-card__trigger`, `.hover-card__content`, `.hover-card__arrow`.
States: `[data-entering="true"]`, `[data-exiting="true"]`, `[data-placement="top|bottom|left|right"]`
on content and arrow.

| Selector | Observed | Remake (tokens) |
|---|---|---|
| `.hover-card__trigger` | `display: inline-flex` | `inline-flex` |
| `.hover-card__content` | radius `calc(var(--radius) * 2)` (16px), `background: var(--overlay)`, `box-shadow: var(--overlay-shadow)`, `max-width: var(--container-sm)` (384px), `padding: 16px`, `outline: none`; text colour/font inherited (body: foreground, 16px/24px) | `max-w-sm rounded-2xl bg-overlay p-4 shadow-overlay outline-none` |
| `[data-entering]` | tw-animate `enter` keyframes, 150ms, `--ease-out` (cubic-bezier(0,0,.2,1)), `--tw-enter-opacity: 0`, `--tw-enter-scale: .97` | `animate-in fade-in zoom-in-[0.97] duration-150 ease-out` |
| `[data-exiting]` | tw-animate `exit`, 100ms, ease-out, `--tw-exit-opacity: 0`, `--tw-exit-scale: .97` | `animate-out fade-out zoom-out-[0.97] duration-100 ease-out` |
| `[data-placement=bottom][data-entering]` | `--tw-enter-translate-y: -1 * spacing` (slides down from the trigger) | `slide-in-from-top-1` |
| `[data-placement=top][data-entering]` | `--tw-enter-translate-y: +1 * spacing` | `slide-in-from-bottom-1` |
| `[data-placement=left][data-entering]` | `--tw-enter-translate-x: +1 * spacing` | `slide-in-from-right-1` |
| `[data-placement=right][data-entering]` | `--tw-enter-translate-x: -1 * spacing` | `slide-in-from-left-1` |
| entering/exiting | `will-change: opacity, transform`; animation removed under motion-reduce (`[data-reduce-motion=true]` or `prefers-reduced-motion`) | `will-change-[opacity,transform]`, `motion-reduce:animate-none` |
| `.hover-card__arrow` | `display: block` | `block` |
| `.hover-card__arrow svg` | `fill: var(--overlay)` | same |
| `[data-placement=bottom/left/right] svg` | `rotate: 180deg / -90deg / 90deg` (the SVG points down = `top`) | same |

Notes
- No `overflow` rule on the content: RAC sets `max-height`, content taller than that overflows (seen
  in the image demo inside a short viewport). Kept as-is.
- Pro also ships a `.chat-source .hover-card__trigger { height: 1.5rem; align-items: center; max-width: 100% }`
  rule; that belongs to the Chat Source component (its owner), not here.
- Dark mode: only tokens change (`--overlay` → dark surface, `--overlay-shadow` → `0 0 1px 0 #ffffff4d inset`).
  Verified: content bg `lab(8.34…)`, inset shadow, arrow fill = overlay, text = foreground.

---

## 5. Behaviour / timings (measured)

| Measurement | Pro | Remake |
|---|---|---|
| hover → card mounted | ~744 ms (700 delay) | ~750 ms |
| `data-entering` duration | ~150 ms | ~150 ms |
| pointer leave → `data-exiting` | ~310 ms (300 delay) | ~300 ms |
| `data-exiting` → unmount | ~113 ms (100 ms animation) | ~160 ms (same 100 ms animation, measurement noise) |
| custom delays demo | `Instant` opens at ~9 ms; `Slow` opens at ~1010 ms and closes ~500 ms after leave | same (RAC) |
| offset | content edge 8px from trigger (also with an arrow) | 8px |
| viewport padding / flip | `left: 12px` (RAC `containerPadding` 12), flips `top`→`bottom`, `left`→`right` when there is no room | same |
| click outside while controlled-open | stays open (non-modal, not dismissable by outside click) | same |
| keyboard | Tab onto link → `data-focus-visible`, opens after ~742 ms; Escape closes; focus stays on trigger | same |
| warm-up | moving to another hover card / tooltip within the cooldown opens instantly, `shouldSkipAnimation` suppresses enter/exit animation | same (RAC global tooltip state) |

---

## 6. Demo list (docs) → stories

| Demo | Structure | Story |
|---|---|---|
| `hover-card-default` | `div.px-10.py-24 > p.text-sm.leading-8` with text + Trigger(Link.underline) + Content (profile: `avatar--sm` + name `text-sm leading-4 font-semibold` / handle `text-muted text-sm tracking-tight`; bio `p.mt-3.pl-px.text-sm.font-medium` with `<br>` + emoji; stats `mt-3 flex gap-2` of `flex gap-1` pairs) | `Default` (with argTypes) |
| `hover-card-with-arrow` | same + `<HoverCard.Arrow/>` | `WithArrow` |
| `hover-card-placements` | `div.grid.gap-4` > muted label `my-2 text-sm` + 4 triggers with `Button variant=outline className=w-full` (Top / Left / Right / Bottom), arrow, profile content | `Placements` |
| `hover-card-with-image` | text + Link trigger, Content `className="w-72 p-0"` + arrow + `img.h-36.w-full.rounded-t-2xl.object-cover` + `div.p-4` (title `text-sm font-semibold`, text `text-muted mt-1 text-sm leading-relaxed`) | `WithImage` |
| `hover-card-custom-delays` | `div.flex.items-center.gap-6.px-10.py-24` with 3 outline Buttons (0/0, 700/300, 1000/500) and the image card | `CustomDelays` |
| `hover-card-controlled` | `div.mb-4.flex.items-center.gap-2` (Button sm outline toggling, `span.text-[13px].opacity-60` "State: <strong>open/closed</strong>") + paragraph trigger with arrow + profile | `Controlled` |

Story content is my own (names, texts, images from the OSS HeroUI asset bucket).

---

## 7. Dependencies

- `react-aria-components` 1.22: `PreviewTrigger`, `Popover`, `OverlayArrow`.
- `react-aria`: `useFocusable`, `mergeProps`.
- OSS `@heroui/react`: `Link`, `Button`, `Avatar` (stories only).
- CSS: `tw-animate-css` utilities (already imported by `@heroui/styles`).

---

## 8. Deviations / notes

- None intended. The trigger merges a user `style` on top of React Aria's touch-callout style instead
  of replacing it.
- WebKit: the OSS popover holds `isExiting` (`useOverlayExitHold`) so its exit animation starts on
  Safari. That helper is internal to `@heroui/react`. Pro's hover card uses plain RAC Popover with
  tw-animate keyframes, and so does this remake.

### Review check (side by side with the Pro demos, 447×402 viewport, light and dark)

- Trigger, content, arrow and the image card: identical boxes (content 16px radius, 16px padding,
  384px max width, 8px offset, 12×12 arrow centred on the trigger, same rotation per placement),
  identical resolved colours (light: white / overlay shadow, dark: `rgb(24 24 27)` with the inset
  `#ffffff4d` shadow, muted `rgb(159 159 169)`), the same CSSOM including the motion-reduce variant.
- Theme: `--radius: 1rem` gives a 32px radius, `--overlay` recolours content and arrow, `--font-sans`
  and `--spacing` apply.
- Behaviour: open after ~740 ms, close starts ~310 ms after leave, enter 150 ms / exit 100 ms
  `cubic-bezier(0,0,.2,1)`, Escape closes and keeps focus on the link, controlled demo stays open on
  an outside click and closes when the pointer leaves the trigger.
- Placements demo: with a left/right trigger centred in a narrow viewport the available space on
  both sides is equal, and React Aria only flips when the other side is strictly larger. Pro's
  "Left" card flips to the right because of a sub-pixel difference from its label width; the
  story's card stays left. That is layout, not component behaviour.
- In the Storybook iframe, Tab from the trigger goes to the next tabbable element on the page
  (Storybook's own overlay) because the demo cards contain no tabbable content; on the Pro demo
  page focus wraps back to the link for the same reason.

---

## Appendix A — raw CSSOM (reference only, `@layer components`)

```
.hover-card__trigger { display: inline-flex; }
.hover-card__content { border-radius: calc(var(--radius) * 2); background-color: var(--overlay); --tw-shadow: var(--overlay-shadow); box-shadow: …var(--tw-shadow); --tw-outline-style: none; max-width: var(--container-sm); padding: calc(var(--spacing) * 4); outline-style: none; }
.hover-card__content[data-entering="true"] { animation: enter var(--tw-animation-duration,var(--tw-duration,.15s)) var(--tw-ease,ease) …; --tw-duration: .15s; --tw-ease: var(--ease-out); transition-duration: .15s; transition-timing-function: var(--ease-out); --tw-enter-opacity: 0; --tw-enter-scale: .97; }
.hover-card__content[data-exiting="true"] { animation: exit …; --tw-duration: .1s; --tw-ease: var(--ease-out); transition-duration: .1s; transition-timing-function: var(--ease-out); --tw-exit-opacity: 0; --tw-exit-scale: .97; }
.hover-card__content[data-placement="bottom"][data-entering="true"] { --tw-enter-translate-y: calc(1*var(--spacing)*-1); }
.hover-card__content[data-placement="top"][data-entering="true"] { --tw-enter-translate-y: calc(1*var(--spacing)); }
.hover-card__content[data-placement="left"][data-entering="true"] { --tw-enter-translate-x: calc(1*var(--spacing)); }
.hover-card__content[data-placement="right"][data-entering="true"] { --tw-enter-translate-x: calc(1*var(--spacing)*-1); }
.hover-card__content[data-exiting="true"], .hover-card__content[data-entering="true"] { will-change: opacity, transform; }
(motion-reduce variant) { animation: none }
.hover-card__arrow { display: block; }
.hover-card__arrow svg { fill: var(--overlay); }
.hover-card__arrow[data-placement="bottom"] svg { rotate: 180deg; }
.hover-card__arrow[data-placement="left"] svg { rotate: -90deg; }
.hover-card__arrow[data-placement="right"] svg { rotate: 90deg; }
@keyframes enter { 0% { opacity: var(--tw-enter-opacity,1); transform: translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0) scale3d(var(--tw-enter-scale,1),…) rotate(var(--tw-enter-rotate,0)); filter: blur(var(--tw-enter-blur,0)); } }
@keyframes exit { 100% { opacity: var(--tw-exit-opacity,1); transform: …; filter: blur(var(--tw-exit-blur,0)); } }
```
