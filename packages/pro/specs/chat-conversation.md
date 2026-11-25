# Chat Conversation: clean-room implementation spec

Slug: `chat-conversation` · Docs: https://heroui.pro/docs/react/components/chat-conversation · Category: AI
Storybook title: `Pro/AI/ChatConversation` (stories Default, Full Chat, Scroll Button, plus Scroll To Bottom On Send
for the docs recipe that has no demo).
Import (Pro): `import {ChatConversation, useChatConversation} from "@heroui-pro/react";`. It is a **root export**: the
component only uses the OSS `Button` and `Tooltip` (scroll button) and its own stick-to-bottom hook.

Sources used: the public docs page text, the v1.0.0 release notes (migration notes for `ScrollAnchor`, `onPress`,
`useChatConversation`, `ChatConversationVariants`), the rendered DOM of the three public demo pages (light and dark),
their CSSOM (walked recursively with `@layer` / `@media` context), computed styles, theme tokens and runtime probing
(rAF sampling of `scrollTop` / `scrollHeight` / `data-state`, wheel and keyboard input, appending blocks into the
content column to simulate streaming, tooltip timing, reduced motion). The shared browser pane had no free tab, so the
pages were read with a headless Edge (Playwright). I did not open the paywalled example source and did not try to get
around it.

---

## 1. Purpose

A scroll viewport for a chat thread that sticks to the bottom: the view follows new content (streamed replies, new
turns) until the reader scrolls up, and follows again once they come back to the bottom. An optional jump-to-bottom
button appears while the view is away from the bottom.

## 2. Anatomy

```tsx
import {ChatConversation, useChatConversation} from "@heroui/pro";

<ChatConversation aria-label="Conversation" className="h-[520px]">
  <ChatConversation.Content className="max-w-[714px] gap-8 px-4 py-8">{/* messages */}</ChatConversation.Content>
  <ChatConversation.ScrollButton tooltip="Scroll to bottom" />   {/* optional */}
</ChatConversation>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| Root | `div role="log"` | `chat-conversation` | `chat-conversation` | the scroller; `aria-label` / `aria-busy` from the app; `tabindex="-1"` only while focus was moved to it |
| Content | `div` | `chat-conversation-content` | `chat-conversation__content` | message column, centred |
| Scroll button container | `div` | `chat-conversation-scroll-button-container` | `chat-conversation__scroll-button-container` | `data-state="visible\|hidden"`, `aria-hidden="true"` while hidden (attribute absent while visible) |
| Scroll button | OSS `Button` (icon-only, sm, secondary) | `chat-conversation-scroll-button` | `button button--icon-only button--sm button--secondary chat-conversation__scroll-button` | `aria-label="Scroll to bottom"`, `disabled` while hidden; wrapped in an OSS `Tooltip.Trigger` (`div.tooltip__trigger`) when `tooltip` is set |
| Scroll anchor (deprecated) | `div` | `chat-conversation-scroll-anchor` (ours) | `chat-conversation__scroll-anchor` | "an empty, hidden div"; we render `aria-hidden="true"` |

Rendered DOM, Scroll Button demo at rest (attributes in Pro's order):

```html
<div class="chat-conversation h-[520px]" data-slot="chat-conversation" role="log" aria-label="Conversation">
  <div class="chat-conversation__content max-w-[714px] gap-8 px-4 py-8" data-slot="chat-conversation-content">
    <div class="chat-message--user" …>…</div>
    <div class="chat-message--assistant" data-variant="default" …>…<div class="markdown">…</div>…</div>
    …
  </div>
  <div aria-hidden="true" class="chat-conversation__scroll-button-container"
       data-slot="chat-conversation-scroll-button-container" data-state="hidden">
    <div class="tooltip__trigger" data-slot="tooltip-trigger" role="button" tabindex="0">
      <button data-slot="chat-conversation-scroll-button"
              class="button button--icon-only button--sm button--secondary chat-conversation__scroll-button"
              data-rac type="button" disabled aria-label="Scroll to bottom" data-disabled="true">
        <svg fill="none" height="16" viewBox="0 0 16 16" width="16">…chevron-down…</svg>
      </button>
    </div>
  </div>
</div>
```

Visible state: container `data-state="visible"` without `aria-hidden`; the button loses `disabled` / `data-disabled`
and gets `tabindex="0"`. The root carries no `data-*` state of its own.

## 3. API (docs)

| Part | Props |
|---|---|
| `ChatConversation` | native div props + `initial?: "instant" \| "smooth"` (default `"smooth"`, scroll behaviour on mount), `resize?: "instant" \| "smooth"` (default `"smooth"`, scroll behaviour when content grows at the bottom). "The scroll container, with role="log", a polite live region." |
| `ChatConversation.Content` | native div props. "It centers itself, so set its width with a class such as max-w-[714px]." |
| `ChatConversation.ScrollButton` | HeroUI `Button` props + `aria-label?: string` (default `"Scroll to bottom"`), `tooltip?: ReactNode`. "Your onPress runs as well as the scroll. While hidden, it's disabled and hidden from screen readers." |
| `useChatConversation()` | returns `{hasOverflow: boolean, isAtBottom: boolean, scrollToBottom(behavior?: "instant" \| "smooth"): void}` (`behavior` defaults to smooth; scrolling to the bottom also follows new content again). Throws outside a ChatConversation. |
| `ChatConversation.ScrollAnchor` | deprecated: "Remove it; call scrollToBottom from useChatConversation to scroll. If left in, ScrollAnchor renders an empty, hidden div with the .chat-conversation__scroll-anchor class." |

Docs CSS classes: `.chat-conversation`, `.chat-conversation__content`, `.chat-conversation__scroll-button-container`,
`.chat-conversation__scroll-button`, `.chat-conversation__scroll-anchor`. Data attribute: `[data-state="visible|hidden"]`
on the container. CSS variables: `--chat-conversation-shadow-size` (top / bottom fade height, 32px),
`--chat-conversation-scrollbar-mask-size` (width kept clear of the fade for the scrollbar, 10px).

Accessibility (docs): give the root an `aria-label`; set `aria-busy={status === "streaming"}` while a reply streams;
"When the scroll button hides after a keyboard press, focus moves to the conversation, which shows no outline, like a
Modal dialog."

v1.0.0 notes: `ChatConversationVariants` is `VariantProps<typeof chatConversationVariants>`.

### Remake API

Same parts, props and hook. Named exports `ChatConversationRoot`, `ChatConversationContent`,
`ChatConversationScrollButton`, `ChatConversationScrollAnchor`, `ChatConversationContext`, `useChatConversation`,
`chatConversationVariants` (slots only), a `ChatConversation` type namespace (`Props`, `RootProps`, `ContentProps`,
`ScrollButtonProps`, `ScrollAnchorProps`) and the `ChatConversationScrollBehavior` type. `ScrollButton` children replace
the default chevron icon; `className` goes to the button.

## 4. Styling (CSSOM, all in `@layer components`)

```
.chat-conversation        relative flex flex-1 flex-col min-h-0 overflow-y-auto text-sm (14px / 20px)
                          scrollbar-width/color/gutter from the OSS scrollbar vars (= OSS `scrollbar` utility)
                          --chat-conversation-shadow-size: 32px; --chat-conversation-scrollbar-mask-size: 10px
                          mask-image: linear-gradient(to bottom, transparent, black S, black calc(100% - S), transparent),
                                      linear-gradient(black, black)
                          mask-position: 0 0, 100% 0; mask-repeat: no-repeat; mask-size: 100% 100%, M 100%
.chat-conversation[tabindex="-1"]                outline: none
.chat-conversation__content                      flex flex-col w-full mx-auto           (no gap / padding of its own)
.chat-conversation__scroll-button-container      sticky bottom-4 z-10 w-max mx-auto
  [data-state="hidden"]                          pointer-events-none invisible           (no fade, instant)
.chat-conversation__scroll-button                border border-transparent bg-surface text-foreground shadow-surface
                                                 dark: border-border
                                                 --button-bg: surface; --button-bg-hover / -pressed: surface-hover;
                                                 --button-fg: foreground
.chat-conversation__scroll-anchor                w-full h-px shrink-0 scroll-mt-4
```

The fade is static (it does not depend on the scroll position); the content padding (`py-8` in the demos) keeps the
first and last turn clear of it at the ends. The second mask layer is a full-height strip at the end edge so the
scrollbar is never faded.

The container sits in the flow after the content (it adds its 32px to `scrollHeight`) and sticks 16px above the
viewport bottom; hidden it keeps its place, invisible and inert.

The button is the OSS secondary icon-only `sm` button (32 × 32, radius 24px with the default radius, transitions
`transform .25s, background-color .1s ease-out, box-shadow .1s ease-out`, press scale ≈ .98, disabled opacity .5) on a
surface: white fill + `--surface-shadow` (three soft shadows) in light; in dark the surface shadow is an empty inset
shadow and a 1px `--border` outline appears instead.

Tokens (light / dark): button fill `--surface` (`lab(100 0 0)` / `lab(8.3 .6 -2.1)`), hover / pressed
`--surface-hover` (`oklab(.937 …)` / `oklab(.273 …)`), icon `--foreground`, dark border `--border` (`lab(16.4 .6 -2.2)`).
Root text colour inherits `--foreground`. Dark mode only swaps tokens plus the `dark:` border.

Tooltip: OSS Tooltip, placement top, offset 3px, opens with no delay (12ms after hover in the probe).

Measured (1000×900 viewport, light; our stories give the same numbers):

| Demo | Element | Rect (x, y, w, h) |
|---|---|---|
| Default | root | 40, 190, 920 × 520 (scrollHeight 601, scrolled to 81) |
| Default | content | 143, 109, 714 × 601 (turn heights 38.75 / 84.25 / 38.75 / 61.5 / 38.75 / 115, gap 32) |
| Scroll Button | content | 714 × 601; scrollHeight 633 (content + 32px button row) |
| Scroll Button | container / button | 484, 662, 32 × 32 (16px above the viewport bottom, centred) |
| Scroll Button | tooltip | 447, 627, 105.6 × 32 (top, 3px gap) |
| Full Chat | wrapper | `flex h-[640px] w-full flex-col`: root 40, 130, 920 × 480; footer 143, 610, 714 × 160 |
| Full Chat | content | 714 × 660.75 (turns 38.75 / 299 / 38.75 / 124.25), reasoning 638 × 136, action rows 32 high |

## 5. Behaviour and timings

Stick-to-bottom model (reproduced from probes, own implementation):

- **At the bottom** means `scrollHeight − clientHeight − scrollTop < 5` (4px from the end keeps the button hidden, 5px
  shows it; same for wheel and scripted scrolls).
- **Mount**: `isAtBottom` starts `true` (button hidden from the first paint). `initial="smooth"` runs a native
  `scrollTo({behavior: "smooth"})` to the end once mounted (0 → 113px in ≈150ms in the demo); `instant` jumps.
- **Growth while stuck** (content resize: appended child, style height change or text node change all count): native
  smooth scroll to the new end (232px in ≈270ms, Chrome's distance-based programmatic smooth scroll). The button stays
  hidden during the catch-up: scroll events caused by the component's own scroll are ignored until the end is reached.
- **Leaving the bottom**: any scroll that ends ≥ 5px from the end and is not the component's own (wheel up, keyboard
  PageUp / ArrowUp, scripted `scrollTop`) releases the view: `data-state="visible"` in the next frame (≈15ms), no
  animation. Growth no longer moves the view.
- **Back at the bottom** by any means (wheel down, script, scrollbar): stuck again, the next growth is followed.
- **ScrollButton press** → `scrollToBottom("smooth")`: the button stays visible during the scroll (≈170ms for 100px)
  and hides when the view is within 5px of the end; the settle scroll then takes it to the exact end. With a mouse the disabled button drops focus to `body`. With the keyboard
  (Enter / Space), focus moves to the root at that moment: `tabindex="-1"` is added, the root is focused without an
  outline, and the attribute is removed again on blur.
- `prefers-reduced-motion` does not change the scroll behaviour in Pro (still smooth); the remake matches.
- Full Chat demo flow: submit → user turn appended (followed smoothly), composer `submitted`; +300ms `streaming` and
  `aria-busy="true"` (nothing rendered for the reply); +≈900ms the whole reply is appended, `ready`, `aria-busy="false"`,
  followed smoothly. The demo does not scroll to the bottom on send when the reader scrolled up (that is the docs
  recipe `ScrollOnSend`, shown in our extra story).

Review probes (headless Edge, 1000 × 900, scroll API calls observed by wrapping `Element.prototype.scrollTo` and the
`scrollTop` setter on the demo page; event listeners read with CDP `DOMDebugger.getEventListeners`):

- Pro's root listens to `scroll`, `wheel` (passive), `touchstart` (passive) and `touchmove` (passive) only: no
  `keydown` or `pointerdown`. Follow scrolls are `scrollTo({behavior: "smooth", top: scrollHeight})`.
- **Wheel-up during a follow**: Chrome does not stop a native smooth scroll for a wheel (it drops the wheel's own
  scroll instead), so Pro calls `scrollTo({behavior: "auto", top: scrollTop + deltaY})` in the wheel handler. The view
  stops where the wheel leads (e.g. 100px above the animation's current frame) and escapes. Not called for an idle
  wheel, a wheel down or a horizontal wheel.
- **Keyboard / scrollbar during a follow**: no extra call; the native scroll stops the animation and the upward move
  escapes the view (PageUp / ArrowUp / End probes match).
- **Settle**: when the view becomes "at the bottom" again (escaped → within 5px: reader scroll, scripted scroll, or the
  last frames of the scroll button's scroll, which React Aria interrupts when it restores the scroll position of the
  disabled, focused button), Pro calls `scrollTo({behavior: "smooth", top: scrollHeight})` twice (one frame apart), so
  the view ends exactly at the end (4px → 0 over two frames). Not called when the view moves within the threshold
  while already at the bottom (0 → 4px stays at 4px).
- **Viewport resize while stuck** (root height 520 → 400): a smooth scroll back to the end (native curve, ≈200ms,
  button stays hidden). Growing the viewport just clamps.
- Edge case reproduced identically: content growing while a follow animation sits 1px short of the end makes the next
  animation frame read as a reader scroll, and the view escapes (button shows, no follow).

Remake specifics: a `ResizeObserver` watches the root and each direct child (re-observed by a `MutationObserver` when
children change); any resize while stuck (taller content or a shorter viewport) scrolls to the end with the `resize`
behaviour. Scroll events from our own (downward) scroll are ignored; a scroll that moves the view up, a wheel-up and a
finger pulling down cancel the catch-up so the reader's scroll decides the state. Wheel-up during a follow stops the
native smooth scroll at `scrollTop + deltaY` (`deltaMode` lines / pages converted to px); if the browser already
applied the wheel (the view sits above its last scroll position) it stops where it is, so the result is the same in
both cases. Re-entering the bottom from an escaped state settles on the end with a smooth scroll, checked again on the
next frame.

## 6. Demos

| Demo | URL | Content |
|---|---|---|
| Default | /docs/react/demos/chat-conversation-default?theme=light\|dark | `h-[520px]` root, `aria-label="Conversation"`, Content `max-w-[714px] gap-8 px-4 py-8`; 3 user / assistant pairs (avatar "AI", Markdown replies: 2 paragraphs; 1 paragraph; paragraph + 3-item list) |
| Full Chat | /docs/react/demos/chat-conversation-full-chat?theme=… | `flex h-[640px] w-full flex-col` wrapper; ChatConversation with `aria-busy`; turn 2 has an expanded Reasoning ("Thought for 3s") with 2 completed Chain Of Thought steps (title + description), Markdown (bold + list) and actions Copy / Regenerate (tooltips); turn 4 paragraph + actions; footer `mx-auto w-full max-w-[714px] shrink-0 px-4 pt-3 pb-4` with PromptInput (textarea, Send, footer note); mocked reply flow |
| Scroll Button | /docs/react/demos/chat-conversation-scroll-button?theme=… | Default + `<ChatConversation.ScrollButton tooltip="Scroll to bottom" />` |

Each demo page: `[data-demo-page]` (min-height 100vh, flex centred, padding 24px / 40px from 640px).

## 7. Dependencies

OSS `Button`, `Tooltip` (component). Pro (stories only): Chat Message, Chat Message Actions, Markdown, Reasoning, Chain
Of Thought, Prompt Input. No third-party scroll library: the stick-to-bottom hook is our own code.

## 8. Deviations

- `ChatConversation.ScrollAnchor` renders `aria-hidden="true"` with `data-slot="chat-conversation-scroll-anchor"`
  (Pro's exact markup for the deprecated part is not observable in the demos).
- The default chevron svg carries `aria-hidden="true" focusable="false"` (Pro's svg has neither; the button is named by
  `aria-label` either way).
- Story texts are our own with the same structure and line counts, so every measured height matches.
- The settle-on-return scroll always uses `"smooth"` and the viewport-resize scroll uses `resize`; the demos only run
  with the defaults (`smooth` / `smooth`), so how Pro behaves with `"instant"` there is not observable.
- Touch: Pro listens to `touchstart` / `touchmove`; synthesized touch gestures in headless Edge did not scroll either
  implementation, so the touch escape could not be compared (ours cancels the catch-up on a finger pulling down).

---

## Appendix: raw CSSOM (reference only, not used as implementation)

```
@layer components .chat-conversation { scrollbar-width: var(--scrollbar-width); scrollbar-color: var(--scrollbar-color); scrollbar-gutter: var(--scrollbar-gutter); min-height: 0px; font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); --chat-conversation-shadow-size: 32px; --chat-conversation-scrollbar-mask-size: 10px; mask-image: linear-gradient(to bottom, transparent, black var(--chat-conversation-shadow-size), black calc(100% - var(--chat-conversation-shadow-size)), transparent), linear-gradient(black, black); mask-position: 0px 0px, 100% 0px; mask-repeat: no-repeat; mask-size: 100% 100%, var(--chat-conversation-scrollbar-mask-size) 100%; flex-direction: column; flex: 1 1 0%; display: flex; position: relative; overflow-y: auto; }
@layer components .chat-conversation[tabindex="-1"] { --tw-outline-style: none; outline-style: none; }
@layer components .chat-conversation__content { flex-direction: column; width: 100%; margin-inline: auto; display: flex; }
@layer components .chat-conversation__scroll-anchor { width: 100%; height: 1px; scroll-margin-top: calc(var(--spacing) * 4); flex-shrink: 0; }
@layer components .chat-conversation__scroll-button-container { bottom: calc(var(--spacing) * 4); z-index: 10; width: max-content; margin-inline: auto; position: sticky; }
@layer components .chat-conversation__scroll-button-container[data-state="hidden"] { pointer-events: none; visibility: hidden; }
@layer components .chat-conversation__scroll-button { border-style: var(--tw-border-style); background-color: var(--surface); color: var(--foreground); --tw-shadow: var(--surface-shadow); box-shadow: …; border-width: 1px; border-color: rgba(0, 0, 0, 0); }
@layer components .chat-conversation__scroll-button:is(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) { border-color: var(--border); }   (+ ::before / ::after, + the prefers-color-scheme fallback of the HeroUI `dark` variant)
@layer components .chat-conversation__scroll-button { --button-bg: var(--surface); --button-bg-hover: var(--surface-hover); --button-bg-pressed: var(--surface-hover); --button-fg: var(--foreground); }
```
