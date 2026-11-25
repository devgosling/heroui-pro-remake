# Chat Message: clean-room implementation spec

Slug: `chat-message` · Docs: https://heroui.pro/docs/react/components/chat-message · Category: AI
Storybook title: `Pro/AI/ChatMessage` (Pro's own Storybook: `Pro Components/AI/ChatMessage`, stories Default, With
Markdown, Loading, Card).
Import (Pro): `import {ChatMessage, ChatMessageActions} from "@heroui-pro/react";`. It is a **root export**: it only
composes OSS `Avatar` and `Card` plus Chat Message Actions (OSS `Button` + `Tooltip`). Markdown is not a dependency of
the component; the With Markdown demo only places `<Markdown>` inside `ChatMessage.Content`.

Sources used: the public docs page text, the rendered DOM of the four public demo pages (light and dark), their CSSOM
(walked recursively with `@layer` / `@media` context), computed styles, theme tokens and runtime probing (pointer hover,
keyboard Tab, opacity sampling during the transition, tooltip placement). The shared browser pane had no free tab, so
the pages were read with a headless Edge (Playwright). I did not open the paywalled example source and did not try to
get around it.

---

## 1. Purpose

Composable layouts for the two kinds of turn in an AI chat: the user's message (a bubble aligned to the end edge) and
the assistant's reply (an avatar + content column, or a whole turn on a Card surface). Parts are presentation only; the
message state stays in the app / AI SDK.

## 2. Anatomy

```tsx
import {ChatMessage, ChatMessageActions} from "@heroui/pro";

<ChatMessage.User>
  <ChatMessage.Bubble>
    <ChatMessage.Content>…</ChatMessage.Content>
  </ChatMessage.Bubble>
</ChatMessage.User>

<ChatMessage.Assistant>
  <ChatMessage.Avatar alt="Assistant" fallback="AI" />   {/* optional */}
  <ChatMessage.Body>
    <ChatMessage.Content>…</ChatMessage.Content>
    <ChatMessage.Media>…</ChatMessage.Media>              {/* optional */}
    <ChatMessageActions>                                  {/* optional */}
      <ChatMessageActions.Copy aria-label="Copy" tooltip="Copy" />
    </ChatMessageActions>
  </ChatMessage.Body>
</ChatMessage.Assistant>
```

There is no root component: `ChatMessage` is a namespace of parts.

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| User | `div` | `chat-message-user` | `chat-message--user` | no `data-variant` |
| Assistant (default) | `div` | `chat-message-assistant` | `chat-message--assistant` | `data-variant="default"` |
| Assistant (card) | OSS `Card` (`div`) | `chat-message-assistant` | `card card--default chat-message--assistant chat-message--card` (this order) | `data-variant="card"`; Card's own `data-slot="card"` is overridden |
| Avatar | `div` > OSS `Avatar size="sm"` | `chat-message-avatar` | `chat-message__avatar` | inner `<span class="avatar avatar--sm"><span class="avatar__fallback avatar__fallback--default" data-slot="avatar-fallback">AI</span></span>` |
| Avatar spacer (`show={false}`) | `div aria-hidden="true"` | `chat-message-avatar-spacer` (ours, not observed) | `chat-message__avatar-spacer` | same 32×32 footprint |
| Body | `div` | `chat-message-body` | `chat-message__body` | |
| Bubble | `div` | `chat-message-bubble` | `chat-message__bubble` | |
| Content | `div` | `chat-message-content` | `chat-message__content` | |
| Media | `div` | `chat-message-media` | `chat-message__media` | not in the demos |
| Actions | Chat Message Actions root | `chat-message-actions` | `chat-message__actions chat-message-actions` | owned by `chat-message-actions` |
| Action | OSS `Button` (icon-only, sm, ghost) | `chat-message-action` | `button button--icon-only button--sm button--ghost chat-message__action` | owned by `chat-message-actions` |

Rendered DOM, default demo (attributes in Pro's order):

```html
<div class="chat-message--user" data-slot="chat-message-user">
  <div class="chat-message__bubble" data-slot="chat-message-bubble">
    <div class="chat-message__content" data-slot="chat-message-content">…</div>
  </div>
</div>
<div class="chat-message--assistant" data-slot="chat-message-assistant" data-variant="default">
  <div class="chat-message__avatar" data-slot="chat-message-avatar">
    <span class="avatar avatar--sm"><span class="avatar__fallback avatar__fallback--default" data-slot="avatar-fallback">AI</span></span>
  </div>
  <div class="chat-message__body" data-slot="chat-message-body">
    <div class="chat-message__content" data-slot="chat-message-content">…</div>
    <div class="chat-message__actions chat-message-actions" data-slot="chat-message-actions">
      <div class="tooltip__trigger" data-slot="tooltip-trigger" role="button" tabindex="0">
        <button data-slot="chat-message-action" class="button button--icon-only button--sm button--ghost chat-message__action" aria-label="Copy" …>…</button>
      </div>
      … Good response, Bad response, Regenerate
    </div>
  </div>
</div>
```

Card demo (`variant="card"`, no avatar, no body):

```html
<div class="card card--default chat-message--assistant chat-message--card" data-slot="chat-message-assistant" data-variant="card">
  <div data-slot="reasoning" data-status="complete" class="disclosure reasoning">…"Thought for 6s"…</div>   <!-- Pro Reasoning -->
  <div class="chat-message__content" data-slot="chat-message-content">…</div>
  <hr class="separator separator--horizontal separator--default mt-1" data-slot="separator" role="separator">
  <div class="chat-sources__list" data-slot="chat-sources-list"><span class="chat-source">…</span>…</div>
</div>
```

## 3. API (docs)

| Part | Props |
|---|---|
| `ChatMessage.User` | native div props. "User and assistant messages fill their container, so set the width on the conversation column" (680–768px on desktop). |
| `ChatMessage.Assistant` | native div props + `variant?: "default" \| "card"` (default `"default"`): "card places the turn on a Card surface" |
| `ChatMessage.Avatar` | native div props + `alt?: string`, `src?: string`, `fallback?: string`, `show?: boolean` (default `true`, "When false, renders a same-size spacer for grouped messages"; the spacer is hidden from screen readers) |
| `ChatMessage.Body` | native div props ("The assistant's content column") |
| `ChatMessage.Bubble` | native div props ("The user's message bubble") |
| `ChatMessage.Content` | native div props ("Message text") |
| `ChatMessage.Media` | native div props ("A column for images, charts, or attachments") |
| `ChatMessage.Actions` | "The same component as ChatMessageActions, with its preset actions for copy, rating, or retry. Prefer ChatMessageActions." |
| `ChatMessage.Action` | "An icon-only ghost button, the same component as ChatMessageActions.Action. Extends HeroUI Button props." + `aria-label`, `tooltip?: ReactNode` |

Docs CSS classes: `.chat-message--user`, `.chat-message--assistant`, `.chat-message__avatar`,
`.chat-message__avatar-spacer`, `.chat-message__body`, `.chat-message__bubble`, `.chat-message__content`,
`.chat-message__media`, `.chat-message__actions` ("fully visible on hover and focus"), `.chat-message__action`; variant
class `.chat-message--card`; data attribute `[data-variant="default|card"]` on `.chat-message--assistant`.

Accessibility notes (docs): give each icon-only action an `aria-label`, set `tooltip` to show the same name on hover and
focus; place messages in a Chat Conversation (polite log region) and set `aria-busy` on it while a reply streams.

### Remake API

Same parts and props. Additions: `ChatMessage.Avatar` accepts `children` (a custom avatar replacing the built-in OSS
Avatar) and `fallback` is typed `ReactNode` (superset of `string`). With `src`, the Avatar renders `Avatar.Image`
(with `alt`) and `Avatar.Fallback` (shown until the image loads). Named exports for every part, `chatMessageVariants`,
and a `ChatMessage` type namespace (`UserProps`, `AssistantProps`, …, `ActionsProps`, `ActionProps`).

## 4. Styling (CSSOM, all in `@layer components`)

```
.chat-message--user        flex flex-col items-end w-full
.chat-message--assistant   flex flex-row items-start gap-3 w-full py-2
.chat-message--card        flex-col items-stretch gap-3 rounded-[radius*2] px-5 pt-4 pb-5
.chat-message--card .chat-message__content   leading-5.5 (22px)
.chat-message__body        flex flex-col flex-1 min-w-0 gap-2
.chat-message__bubble      rounded-[radius*2] bg-default px-4 py-2 text-foreground       (no max-width)
.chat-message__content     text-sm leading-relaxed text-foreground                       (14px / 22.75px)
.chat-message--assistant .chat-message__content   w-full max-w-none
.chat-message__media       flex flex-col gap-2
.chat-message__actions     flex items-start opacity-50 transition-opacity (150ms, cubic-bezier(.4,0,.2,1)); motion-reduce none
@media (hover:hover) .chat-message--assistant:hover .chat-message__actions,
                     .chat-message--user:hover .chat-message__actions      opacity 1
.chat-message__actions:focus-within                                       opacity 1
.chat-message__action      text-muted
.chat-message__avatar      shrink-0 self-start
.chat-message__avatar-spacer   size-8 shrink-0 self-start
```

The card variant relies on the OSS Card for the surface: `.card` (`relative flex flex-col gap-3 overflow-visible p-4
shadow-surface`, radius `min(32px, radius-3xl)`) and `.card--default` (`bg-surface`); `.chat-message--card` comes later
in the cascade and overrides padding and radius (16px with the default `--radius: .5rem`).

Tokens (light / dark): bubble and avatar `--default` (`lab(93.0 .1 -.4)` / `lab(15.7 .6 -2.2)`), text `--foreground`
(`lab(8.3 .6 -2.1)` / `lab(99 0 0)`), actions `--muted` (`lab(47.9 1.4 -5.0)` / `lab(65.6 1.5 -5.4)`), card `--surface`
(white / `lab(8.3 .6 -2.1)`) with `--surface-shadow` (three soft shadows / none), separator `--separator`. Dark mode only
swaps tokens; there is no dark-specific rule.

Measured (1000×900 viewport, 714px column, light):

| Demo | Element | Rect (x, y, w, h) |
|---|---|---|
| Default | user bubble | 286.58, 363.88, 570.42 × 38.75 (padding 8/16, radius 16) |
| Default | assistant row | 143, 434.63, 714 × 101.5 (padding-block 8, gap 12) |
| Default | avatar | 143, 442.63, 32 × 32 (radius 16) |
| Default | body | 187, 442.63, 670 × 85.5 (gap 8) |
| Default | actions row | 187, 496.13, 670 × 32, opacity .5; buttons 32 × 32 at x 187 / 219 / 251 / 283 |
| With Markdown | content / markdown | 187, 420.06, 670 × 130.63 (p 22.75 + code block 69.13 with 8px margins + p) |
| Card | card | 143, 396.88, 714 × 177, padding 16/20/20, gap 12, radius 16 |
| Card | reasoning trigger | 155, 412.88, 137.2 × 32 (−8px start margin, px 8, radius 10, 14px/500 muted) |
| Card | content | 163, 456.88, 674 × 44 (line-height 22px) |
| Card | separator | 163, 516.88, 674 × 1 (`mt-1`) |
| Card | sources list | 163, 529.88, 674 × 24 |
| Loading | text shimmer | 187, 417.38, × 24 (16px / 24px, inherits body text size) |
| Loading | loader (dots) | 187, 449.38, 670 × 20 (blockified to `flex` by the body column) |
| Loading | chat loader skeleton | 143, 509.38, 714 × 52 (avatar 32, lines 12px tall at 100 / 85 / 65%, radius radius*.75) |

## 5. Behaviour and timings

- Actions row: rests at opacity .5; hovering anywhere on the assistant (or user) turn transitions it to 1 in 150ms
  (sampled .5 → .85 @50ms → .997 @100ms → 1); leaving returns to .5. Tab focus into an action keeps it at 1
  (`:focus-within`). Tooltips open immediately on focus / hover, placement top (owned by Chat Message Actions).
- No keyboard handling of its own; every part is a static element. The card variant has no hover/press state.
- No animation besides the opacity transition; reduced motion removes it.

## 6. Demos

| Demo | URL | Content |
|---|---|---|
| Default | /docs/react/demos/chat-message-default?theme=light\|dark | user bubble; assistant with avatar "AI", one paragraph, actions Copy / Good response / Bad response / Regenerate (all with tooltips) |
| With Markdown | /docs/react/demos/chat-message-with-markdown?theme=… | assistant Content holds `<Markdown>`: paragraph with bold, fenced `ts` code (1 line), paragraph |
| Card | /docs/react/demos/chat-message-card?theme=… | `variant="card"`: Reasoning ("Thought for 6s", collapsed, 2 completed chain-of-thought steps), Content, `Separator className="mt-1"`, `ChatSources.List` with 2 URL `ChatSource`s (title, no favicon) |
| Loading | /docs/react/demos/chat-message-loading?theme=… | assistant Body holds `TextShimmer` + `Loader variant="dots" className="text-muted"` (aria-hidden); followed by a `ChatLoader.Skeleton` |

Each demo page: `[data-demo-page]` (padding 40px, 24px below 640px, centred) > `div.mx-auto.flex.w-full.max-w-[714px].flex-col.gap-8`.

## 7. Dependencies

OSS `Avatar`, `Card` (component); OSS `Separator` (stories). Pro: Chat Message Actions (component); Markdown, Chat
Source, Text Shimmer, Loader, Reasoning, Chain of Thought, Chat Loader (stories). The Card story renders the real
`Reasoning` (status `complete`, collapsed) with a `ChainOfThought` of two completed steps, and the Loading story the
real `ChatLoader.Skeleton label="Loading response"`, as in the Pro demos (the first draft used stand-ins while those
components were being built).

## 8. Deviations

- Avatar spacer `data-slot="chat-message-avatar-spacer"` is our choice (not observable in the demos).
- `ChatMessage.Avatar` also accepts `children` for a custom avatar; `fallback` is `ReactNode`.
- `.chat-message--assistant[data-hovered="true"]` / `.chat-message--user[data-hovered="true"]` also reveal the actions
  (HeroUI convention; nothing in the component sets it).
- `.chat-message__actions` / `.chat-message__action` are declared both here (Pro lists them under Chat Message) and in
  chat-message-actions.css; the rules are identical.
- `ChatMessage` is a plain object of parts (no root), so there is no `ChatMessage` element / displayName.

## 9. Verification (our Storybook vs Pro demos, 1000×900, headless Edge)

- Default: every rect above matches to the 1/100 px (bubble width differs only because the text differs); actions
  opacity .5, hover transition .5 → .848 @50ms → .985 @100ms → 1, Tab focus keeps 1, tooltip "Copy" at 180/462
  45.8 × 32 in both.
- With Markdown: assistant 143/412.06 714 × 146.63, content 670 × 130.63, code block 670 × 69.13 in both.
- Card: card 143/396.88 714 × 177, padding 16/20/20, radius 16, `--surface-shadow`, content 674 × 44 (line-height 22),
  separator at y 516.88, sources at y 529.88 in both; class order `card card--default chat-message--assistant
  chat-message--card`.
- Loading: assistant 714 × 68, shimmer at y 417.38, loader 670 × 20 at y 449.38, skeleton 714 × 52 at y 509.38 in both.
- Dark: bubble / avatar `--default`, text `--foreground`, actions `--muted`, card `--surface` without shadow, separator
  `--separator` (our Storybook tokens are oklch equivalents of Pro's lab values).
- Review pass (447 × 402 viewport, built-in browser pane, light + dark): every chat-message rect matches Pro (default
  assistant 399 wide, actions 36 × 36 touch-size buttons in both; Markdown code block 355 × 69.13; card 399 × 199,
  263 once the reasoning is expanded, reasoning trigger 137.2 × 32, chain-of-thought 359 × 56; loading assistant
  399 × 68 and skeleton 399 × 52 with lines 355 / 301.75 / 230.75). Pro's CSSOM for `chat-message--*` /
  `chat-message__*` has exactly the 17 rules in the appendix. Theme: `--radius: 1rem` gives bubble and card 32px,
  `--font-sans` reaches the content, and no rule uses `--accent`.

## Appendix: raw CSSOM (reference only, chat-message rules of the default demo)

```
@layer components .chat-message--user { flex-direction: column; align-items: flex-end; width: 100%; display: flex; }
@layer components .chat-message--assistant { align-items: flex-start; gap: calc(var(--spacing) * 3); width: 100%; padding-block: calc(var(--spacing) * 2); flex-direction: row; display: flex; }
@layer components .chat-message--card { align-items: stretch; gap: calc(var(--spacing) * 3); border-radius: calc(var(--radius) * 2); padding-inline: calc(var(--spacing) * 5); padding-top: calc(var(--spacing) * 4); padding-bottom: calc(var(--spacing) * 5); flex-direction: column; }
@layer components .chat-message--card .chat-message__content { --tw-leading: calc(var(--spacing) * 5.5); line-height: calc(var(--spacing) * 5.5); }
@layer components .chat-message__body { gap: calc(var(--spacing) * 2); flex-direction: column; flex: 1 1 0%; min-width: 0px; display: flex; }
@layer components .chat-message__bubble { border-radius: calc(var(--radius) * 2); background-color: var(--default); padding-inline: calc(var(--spacing) * 4); padding-block: calc(var(--spacing) * 2); color: var(--foreground); }
@layer components .chat-message__content { font-size: var(--text-sm); --tw-leading: var(--leading-relaxed); line-height: var(--leading-relaxed); color: var(--foreground); }
@layer components .chat-message--assistant .chat-message__content { width: 100%; max-width: none; }
@layer components .chat-message__media { gap: calc(var(--spacing) * 2); flex-direction: column; display: flex; }
@layer components .chat-message__actions { opacity: 0.5; transition-property: opacity; transition-timing-function: var(--tw-ease,var(--default-transition-timing-function)); transition-duration: var(--tw-duration,var(--default-transition-duration)); align-items: flex-start; display: flex; }
@layer components .chat-message__actions:is([data-reduce-motion="true"], [data-reduce-motion="true"] *) { transition-property: none; }
@layer components @media (prefers-reduced-motion: reduce) .chat-message__actions:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)) { transition-property: none; }
@layer components @media (hover: hover) .chat-message--assistant:hover .chat-message__actions, .chat-message--user:hover .chat-message__actions { opacity: 1; }
@layer components .chat-message__actions:focus-within { opacity: 1; }
@layer components .chat-message__action { color: var(--muted); }
@layer components .chat-message__avatar { flex-shrink: 0; align-self: flex-start; }
@layer components .chat-message__avatar-spacer { width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8); flex-shrink: 0; align-self: flex-start; }
```
