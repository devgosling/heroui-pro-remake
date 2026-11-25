# Chat Message Actions: clean-room implementation spec

Slug: `chat-message-actions` · Docs: https://heroui.pro/docs/react/components/chat-message-actions · Category: AI
Storybook title: `Pro/AI/ChatMessageActions` (Pro's own Storybook: `Pro Components/AI/ChatMessageActions`, stories
Default, Minimal, Custom Icons).
Import (Pro): `import {ChatMessageActions} from "@heroui-pro/react";`. It is a **root export**: it only composes OSS
`Button` and `Tooltip` from `@heroui/react`, so it has no heavy optional peer.

Sources used: the public docs text of this page and of the Chat Message page (its anatomy block and API table), the
server-rendered DOM of the three public demo pages plus the Chat Message / Chat Conversation demos that embed the row,
the CSSOM of the demo page, computed styles, theme tokens, and runtime probing (synthetic pointer / keyboard events, a
MutationObserver, `getAnimations()`, rAF sampling of inline styles). I did not open the paywalled example source and
did not try to get around it.

---

## 1. Purpose

An inline row of icon-only actions under an assistant (or user) message: copy, rating (thumbs up / down), regenerate,
an overflow trigger, or custom actions. Inside a Chat Message the row rests at half opacity and becomes fully visible
while the message is hovered or an action has keyboard focus.

## 2. Anatomy

Docs anatomy:

```tsx
<ChatMessageActions>
  <ChatMessageActions.Action aria-label="Copy">{/* ... */}</ChatMessageActions.Action>
</ChatMessageActions>
```

Chat Message docs anatomy uses a preset: `<ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" />` and says
`ChatMessage.Actions` is "the same component as ChatMessageActions, with its preset actions for copy, rating, or
retry". The custom-icons demo says "Swap preset icons via the Icon subcomponents".

| Part | Element | `data-slot` | BEM class(es) | Primitive |
|---|---|---|---|---|
| Root | `<div>` | `chat-message-actions` | `chat-message__actions chat-message-actions` (in this order) | none |
| Tooltip wrapper (only with `tooltip`) | `<div role="button" tabindex="0">` | `tooltip-trigger` | `tooltip__trigger` | OSS `Tooltip` + `Tooltip.Trigger` |
| Action | `<button type="button" data-rac>` | `chat-message-action` | `button button--icon-only button--sm button--ghost chat-message__action` | OSS `Button` (`isIconOnly size="sm" variant="ghost"`) |
| Tooltip content | `<div role="tooltip" data-placement="top">` (portal) | none | `tooltip` | OSS `Tooltip.Content` (no arrow, offset 3) |
| Copy icon motion wrapper | `<span>` | `chat-message-actions-copy-icon-motion` | `chat-message-actions__copy-icon-motion` | motion (Pro) / CSS keyframes (ours) |
| Preset icon | `<svg width=16 height=16 viewBox="0 0 16 16" fill="none">` | `chat-message-actions-{copy,copied,thumbs-up,thumbs-down,regenerate,menu}-icon` | `chat-message-actions__icon` | none |

### Rendered DOM (default demo, one action, attributes in Pro's order)

```html
<div class="chat-message__actions chat-message-actions" data-slot="chat-message-actions">
  <div class="tooltip__trigger" data-slot="tooltip-trigger" role="button" tabindex="0">
    <button data-slot="chat-message-action" class="button button--icon-only button--sm button--ghost chat-message__action"
            data-rac="" type="button" tabindex="0" data-react-aria-pressable="true" aria-label="Copy" id="react-aria-…">
      <span class="chat-message-actions__copy-icon-motion" data-slot="chat-message-actions-copy-icon-motion"
            style="filter:blur(0px);opacity:1;transform:none">
        <svg … class="chat-message-actions__icon" data-slot="chat-message-actions-copy-icon">…</svg>
      </span>
    </button>
  </div>
  …
</div>
```

- Only the Copy preset has the motion wrapper. The other presets render the `<svg>` directly in the button.
- With a tooltip, both the wrapper `<div>` and the `<button>` are tab stops (OSS Tooltip.Trigger behaviour), and both
  get `aria-describedby` while the tooltip is open.
- Preset icons are Gravity UI glyphs: copy, check (copied), thumbs-up, thumbs-down, arrows-rotate-left (regenerate),
  ellipsis (menu). The SVGs have no `aria-hidden`.
- Custom icons (custom-icons demo): the user's `<svg>` keeps its own attributes and receives
  `class="chat-message-actions__icon {className}"` (e.g. `text-accent size-4`, `text-success size-4`) and the preset's
  `data-slot`, so the Icon subcomponents clone a custom child element.
- Pressing Copy adds a second wrapper (`copied` icon) next to the first; the outgoing wrapper gets
  `data-motion-pop-id` and `position: absolute` (motion `AnimatePresence mode="popLayout"`) until its exit ends. No
  attribute changes on the `<button>`; `aria-label` stays "Copy".
- Thumbs up / down, Regenerate and More are plain buttons (no `aria-pressed`, no state change, no menu) in the demos.

## 3. API

Docs tables (this page): `ChatMessageActions` "Root action group … Supports native div props";
`ChatMessageActions.Action` "Individual action button. Extends HeroUI Button props". Chat Message page adds for the
action:

| Prop | Type | Default | Description |
|---|---|---|---|
| `aria-label` | `string` | - | Accessible name of the icon button |
| `tooltip` | `ReactNode` | - | Tooltip shown on hover and focus |

Accessibility note (Chat Message page): give each icon-only action an `aria-label`; set `tooltip` to show the same
name on hover and focus.

### Our API (names of the presets are not published; chosen from the icon slots)

| Part | Props |
|---|---|
| `ChatMessageActions` / `.Root` | native `div` props |
| `.Action` | HeroUI `Button` props (defaults `isIconOnly`, `size="sm"`, `variant="ghost"`) + `tooltip?: ReactNode` |
| `.Copy` | Action props + `value?: string \| () => string` (written with `navigator.clipboard.writeText`), `onCopy?(value)`, `copiedDuration?` (2000), `copiedIcon?`, `children?` (rest icon). Default `aria-label="Copy"` |
| `.ThumbsUp` / `.ThumbsDown` / `.Regenerate` / `.More` | Action props; default icon as children, default `aria-label` "Good response" / "Bad response" / "Regenerate" / "More actions" |
| `.CopyIcon` / `.CopiedIcon` / `.ThumbsUpIcon` / `.ThumbsDownIcon` / `.RegenerateIcon` / `.MenuIcon` | `svg` props + `children?: ReactElement` (custom icon, cloned with the icon class and `data-slot`) |

## 4. Styling (CSSOM, `@layer components`)

```
.chat-message-actions            display:flex; align-items:flex-start            (no gap: buttons touch)
.chat-message-actions__icon      size-4
.chat-message-actions__copy-icon-motion   size-4; display:flex; center/center
.chat-message__actions           display:flex; align-items:flex-start; opacity:.5;
                                 transition: opacity 150ms (Tailwind default ease cubic-bezier(.4,0,.2,1));
                                 motion-reduce (media + [data-reduce-motion]) -> transition none
@media (hover:hover) .chat-message--assistant:hover .chat-message__actions,
                     .chat-message--user:hover .chat-message__actions   opacity:1
.chat-message__actions:focus-within   opacity:1
.chat-message__action            color: var(--muted)
```

In Pro the `.chat-message__actions` / `.chat-message__action` rules sit among the Chat Message rules. Our
`chat-message-actions.css` declares them too (identical values) so the component looks right without Chat Message;
duplicates in `chat-message.css` are harmless.

Everything else comes from the OSS classes: `.button--sm` (h-9 / md:h-8), `.button--icon-only` (w-9 / md:w-8, p-0),
`.button--ghost` (`--button-bg-hover: var(--default)`), `rounded-3xl` (24px), press scale 0.98, focus ring
(`status-focused`: 2px background + 4px focus ring), icon margin `-mx-0.5 my-1` from `.button svg`.

Measured (light, 1000px wide demo): each action 32×32 (36×36 below 768px), icon 16×16, root height 32, color muted
(`lab(47.9 1.4 -5.0)` light), transparent background; tooltip: 12px text, padding 8px, radius 12px, `--overlay`
background, `--overlay-shadow`, placement top, offset ≈3px, no arrow. Dark mode only swaps tokens (muted, default,
overlay).

Demo page: `[data-demo-page]` padding 24px (40px from 640px up), flex centred; the Chat Message assistant row is `flex gap-3 py-2 w-full`,
avatar `avatar--sm` with fallback "AI", body `flex-col gap-2`, content `text-sm leading-relaxed text-foreground`.

## 5. Behaviour and timings

- Tooltip: opens on hover after **0ms** (measured ~25ms, first poll, without warm-up), on keyboard focus immediately;
  closes 500ms after leave (OSS `--tooltip-close-delay`), then the OSS 100ms exit animation. So `delay={0}`, default
  close delay.
- Copy: on press the icon swaps to a check; it swaps back after **2000ms** (measured 2019ms).
  Enter: `{opacity:0, filter:blur(4px), scale:.25}` -> `{opacity:1, filter:blur(0), transform:none}`; exit is the
  reverse (to the same hidden values); both run at the same time, 300ms. motion drives opacity and filter through WAAPI
  (duration 300, easing `linear(…)` = a critically damped spring: 0.041 @3.4%, 0.248 @10.3%, 0.652 @24.1%, 0.951 @51.7%)
  and scale through rAF with the same curve. The first render does not animate (`initial={false}`).
- The stops sit at i/29 of the run (motion samples a spring every ~10ms: 30 stops for 300ms), which puts them at
  t = 10.3, 31, 72.4 and 155ms; a critically damped spring `1-(1+ωt)e^(-ωt)` with ω = 30.8 s⁻¹ hits all four values to
  the third decimal (0.041, 0.248, 0.653, 0.951).
- A second press while the check is shown restarts the 2000ms timer (Pro: second press at 1013ms, swap back at 3025ms).
- Our version: CSS keyframes `chat-message-actions-icon-in` / `-out`, 300ms, easing = our own `linear()` with 30 evenly
  spaced stops of that spring (ω = 30.8 s⁻¹). The outgoing wrapper gets
  `data-exiting="true"` (absolute, pointer-events none) and is removed after 300ms; the incoming one has
  `data-entering="true"` until then. Reduced motion: no animation, outgoing icon hidden at once.
- Clipboard: the demos pass no text; a stubbed `navigator.clipboard.writeText` was not called. Ours writes only when
  `value` is set.

## 6. Demos

| Demo | URL | Content |
|---|---|---|
| Default | /docs/react/demos/chat-message-actions-default?theme=light\|dark | Chat Message assistant row, 5 actions with tooltips: Copy, Good response, Bad response, Regenerate, More actions |
| Minimal | /docs/react/demos/chat-message-actions-minimal?theme=… | Copy + More actions |
| Custom Icons | /docs/react/demos/chat-message-actions-custom-icons?theme=… | Copy (custom svg, `text-accent size-4`) + Good response (custom svg, `text-success size-4`); after a press the copied state shows the **default** check icon (muted) |

## 7. Dependencies

OSS `Button`, `Tooltip` (and `Avatar` in stories). Icons: Gravity UI Icons path data (MIT, attribution comment in
`chat-message-actions-icons.tsx`). No motion library: the swap is CSS.

## 8. Deviations

- Preset part names (`Copy`, `ThumbsUp`, `ThumbsDown`, `Regenerate`, `More`, `*Icon`) are inferred; Pro's exact names
  for everything except `Copy` are not public.
- Copy swap uses CSS keyframes instead of motion: no inline `style` on the wrapper and no `data-motion-pop-id`; the
  outgoing wrapper carries `data-exiting` instead.
- Preset SVGs add `aria-hidden="true"` and `focusable="false"`.
- `value` / `onCopy` / `copiedDuration` / `copiedIcon` are our API for the copy behaviour (Pro's is not documented).

## 9. Verification (our Storybook vs Pro demos, 407px wide tab)

- Minimal, light: message rect 24/159.6/359×82.75 and action row 68/198.4/315×36 in both; buttons 36×36 at x 68 and 104.
- Default, light: five 36×36 buttons touching (no gap), muted colour, transparent rest background, `--default` hover
  background, 24px radius, row opacity .5 with 150ms opacity transition; hovering the message sets opacity 1.
- Tooltip "Good response": 102.69×32, 12px, padding 8px, radius 12px, top placement; opens after ~27ms (Pro ~25ms),
  `data-exiting` at 504ms (Pro 521ms).
- Copy swap: 300ms enter / exit with matching keyframe values; back to the copy icon 2000ms after the press.
- Dark (custom icons): muted `oklch(70.5% .015 286)` = Pro `lab(65.6 1.5 -5.4)`, accent / success icons match.
- Custom Icons, dark (447px tab): with a one-line message the row sits at 68/198.4 in both; accent icon
  `oklch(.6204 .195 253.83)` = Pro `lab(54.53 3.32 -66.53)`, success `oklch(.7329 .1935 150.81)` = Pro
  `lab(71.44 -59.41 38.03)`; after a press the default check renders in muted.
- Tooltip text resolves to `--foreground` in both (our Storybook body now sets the text colour).
- Focus: first Tab lands on the `tooltip__trigger` div (square ring), second Tab on the button (2px background + 4px
  `--focus` ring), the row goes to opacity 1 through `:focus-within`; identical in both.
- Theme: `--radius: 1rem` -> button radius 48px, `--accent` and `--font-sans` overrides apply to the custom accent
  icon, the focus ring and the button font.
