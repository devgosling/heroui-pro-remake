# Chat Loader (`chat-loader`) - clean-room implementation spec

Slug: `chat-loader` · Docs: https://heroui.pro/docs/react/components/chat-loader · Storybook title: `Pro/AI/ChatLoader`
Import (remake): `import {ChatLoader} from "@heroui/pro"` or `"@heroui/pro/chat-loader"` (no optional peers; only
the OSS `Spinner` from `@heroui/react`).

Sources (observed 2026-11-25): the public docs page text; the server-rendered DOM, computed styles and CSSOM
(`@layer components`) of the one public demo page `/docs/react/demos/chat-loader-default?theme=light|dark`; the
public `chat-message-loading` demo (it renders a labelled `ChatLoader.Skeleton`); and the public release notes
(v1.0.0, beta-5). The built-in browser pane had no free tab, so the live checks ran in a local headless Edge
(playwright-core from the repo) against the same public pages and our Storybook. No paywalled example source, JS
chunk, source map, prompt or MCP endpoint was read.

---

## 1. Purpose

Placeholders shown while an assistant response or a thread loads. The current API is `ChatLoader.Skeleton`, a
chat-message-shaped skeleton (avatar + block of lines). `ChatLoader.Dots`, `.Pulse` and `.Spinner` are deprecated
(replaced by `Loader` `variant="dots" | "pulse" | "ring"`) but still render.

## 2. Anatomy

```tsx
<ChatLoader.Skeleton label="Loading response" size="md">
  <ChatLoader.SkeletonAvatar />           {/* optional */}
  <ChatLoader.SkeletonBlock>
    <ChatLoader.SkeletonLine />
  </ChatLoader.SkeletonBlock>
</ChatLoader.Skeleton>

{/* deprecated */}
<ChatLoader.Dots />  <ChatLoader.Pulse />  <ChatLoader.Spinner />
```

There is **no root element and no `.chat-loader` class**: `ChatLoader` is a namespace object of parts.

| Part | Element | `data-slot` | BEM | Notes |
|---|---|---|---|---|
| `Skeleton` | `<div aria-busy="true">` | `chat-loader-skeleton` | `chat-loader__skeleton` | with `label`: `role="status" aria-label={label}` (seen in `chat-message-loading`). Without children: avatar + block of 3 lines. |
| `SkeletonAvatar` | `<div>` | `chat-loader-skeleton-avatar` | `chat-loader__skeleton-avatar [--sm\|--lg]` | |
| `SkeletonBlock` | `<div>` | `chat-loader-skeleton-block` | `chat-loader__skeleton-block` | keeps its `className` outside a Skeleton (v1.0.0 note) |
| `SkeletonLine` | `<div>` | `chat-loader-skeleton-line` | `chat-loader__skeleton-line [--sm\|--lg]` | 2nd line 85%, 3rd 65% wide (`:nth-child`) |
| `Dots` (deprecated) | `<span aria-hidden="true">` + 3 `<span class="chat-loader__dot">` | `chat-loader-dots` | `chat-loader__dots [--sm\|--lg]` | Pro's dots carry no `data-slot` (remake adds `chat-loader-dot`) |
| `Pulse` (deprecated) | `<span aria-hidden="true">` | `chat-loader-pulse` | `chat-loader__pulse [--sm\|--lg]` | |
| `Spinner` (deprecated) | `<span aria-hidden="true">` wrapping OSS `<Spinner aria-hidden color="accent" size>` | `chat-loader-spinner` | `chat-loader__spinner` | inner DOM = OSS `.spinner spinner--accent spinner--md` with `aria-label="Loading" role="status" aria-hidden="true"` |
| label (automatic) | `<span>` | `chat-loader-label` | `chat-loader__label` | sr-only class present in Pro CSSOM; used for the `label` of Dots / Pulse / Spinner |

Observed DOM (default demo, md, no labels):

```html
<span aria-hidden="true" class="chat-loader__dots" data-slot="chat-loader-dots">
  <span class="chat-loader__dot"></span><span class="chat-loader__dot"></span><span class="chat-loader__dot"></span>
</span>
<span aria-hidden="true" class="chat-loader__pulse" data-slot="chat-loader-pulse"></span>
<span aria-hidden="true" class="chat-loader__spinner" data-slot="chat-loader-spinner">
  <span aria-label="Loading" data-slot="spinner" role="status" aria-hidden="true" class="spinner spinner--accent spinner--md">…</span>
</span>
<div aria-busy="true" class="chat-loader__skeleton" data-slot="chat-loader-skeleton">
  <div class="chat-loader__skeleton-avatar" data-slot="chat-loader-skeleton-avatar"></div>
  <div class="chat-loader__skeleton-block" data-slot="chat-loader-skeleton-block">
    <div class="chat-loader__skeleton-line" data-slot="chat-loader-skeleton-line"></div> ×3
  </div>
</div>
```

Labelled skeleton (chat-message-loading demo):
`<div aria-busy="true" aria-label="Loading response" class="chat-loader__skeleton" data-slot="chat-loader-skeleton" role="status">`.

md renders no modifier classes; docs: "Sized parts also get a `--sm` or `--lg` modifier, such as `.chat-loader__dot--sm`".
The CSSOM sizes dots through `.chat-loader__dots--sm .chat-loader__dot`, so the remake renders both
`chat-loader__dots--{size}` on the wrapper and `chat-loader__dot--{size}` on each dot.

## 3. API (docs)

### `ChatLoader.Skeleton` (native `div` props)
| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | - | Status text announced while the skeleton shows (`role="status"` + `aria-label`) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Avatar and line size (shared with the primitives through context) |
| `children` | `ReactNode` | avatar + block of 3 lines | Custom composition |

### `ChatLoader.SkeletonAvatar`, `SkeletonBlock`, `SkeletonLine`
Composable primitives (native `div` props). Remake extra: `size` on Avatar / Line overrides the skeleton's size.

### `ChatLoader.Dots`, `Pulse`, `Spinner` (deprecated, native `span` props)
| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | - | Screen-reader status text. Omit for a decorative loader (`aria-hidden`) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Loader size |

Migration (docs + v1.0.0): Dots -> `Loader variant="dots"` (+ `className="text-muted"`, Dots was muted), Pulse ->
`variant="pulse"`, Spinner -> `variant="ring"` (Spinner md 24px becomes Loader lg; Spinner lg 32px has no Loader
size). Pass `aria-label` for a hidden name since Loader's `label` is visible. "A labeled ChatLoader.Spinner is
announced once" -> the wrapper owns the status, the inner OSS spinner stays `aria-hidden`.

### CSS classes (docs)
`.chat-loader__dots`, `__dot`, `__pulse`, `__spinner`, `__skeleton`, `__skeleton-avatar`, `__skeleton-block`,
`__skeleton-line`; sized parts take `--sm` / `--lg`. No CSS variables or data attributes are documented.

## 4. Styling (CSSOM, `@layer components`, identical in light and dark)

| Selector | Declarations | Remake |
|---|---|---|
| `.chat-loader__skeleton` | `display:flex; align-items:flex-start; gap:calc(var(--spacing)*3); width:100%` | `flex w-full items-start gap-3` |
| `.chat-loader__skeleton-avatar` | `width/height:2rem; border-radius:full; background:var(--default); flex-shrink:0` | `size-[2rem] shrink-0 rounded-full bg-default` |
| `…-avatar--sm` / `--lg` | `1.5rem` / `2.25rem` | `size-[1.5rem]` / `size-[2.25rem]` |
| `.chat-loader__skeleton-block` | `display:flex; flex-direction:column; gap:calc(var(--spacing)*2); flex:1 1 0%; min-width:0` | `flex min-w-0 flex-1 flex-col gap-2` |
| `.chat-loader__skeleton-line` | `height:calc(var(--spacing)*3); border-radius:calc(var(--radius)*.75); background:var(--default); width:100%` | `h-3 w-full bg-default` + `border-radius: calc(var(--radius) * 0.75)` |
| `…-line--sm` / `--lg` | `height: calc(var(--spacing)*2.5)` / `*3.5` | `h-2.5` / `h-3.5` |
| `…-line:nth-child(2)` / `(3)` | `width:85%` / `65%` | `w-[85%]` / `w-[65%]` |
| `.chat-loader__dots` | `display:inline-flex; align-items:center; gap:var(--spacing)` | `inline-flex items-center gap-1` |
| `.chat-loader__dot` | `.375rem` square, `border-radius:full`, `background:var(--muted)`, `animation: chat-loader-bounce 1.2s ease-in-out infinite both`; `:first-child` delay `-.24s`, `:nth-child(2)` `-.12s` | same |
| `.chat-loader__dots--sm .chat-loader__dot` / `--lg` | `.3125rem` / `.5rem` | + `.chat-loader__dot--sm/--lg` |
| `.chat-loader__pulse` | `.5rem` square, `border-radius:full`, `background:var(--accent)`, `animation: chat-loader-pulse 1.4s ease-in-out infinite` | + `inline-block` (see deviations) |
| `.chat-loader__pulse--sm` / `--lg` | `.375rem` / `.625rem` | same |
| `.chat-loader__spinner` | `display:inline-flex` | same |
| `.chat-loader__label` | Tailwind `sr-only` | same |
| reduced motion | `@media (prefers-reduced-motion:reduce) { .chat-loader__dot, .chat-loader__pulse { opacity:.7; animation:none } }` | `motion-reduce:animate-none motion-reduce:opacity-70` |

Keyframes:
- `chat-loader-bounce`: `0%, 80%, 100% { opacity:.35; transform:scale(.85) }`, `40% { opacity:1; transform:scale(1) }`.
- `chat-loader-pulse`: `0%, 100% { opacity:.45; transform:scale(.92) }`, `50% { opacity:1; transform:scale(1) }`.
- The skeleton is **static** (no shimmer / pulse animation).
- Spinner: OSS `.spinner` (`spin` 0.75s linear infinite), size sm 16 / md 24 / lg 32px, accent.

Measured (md): dots 26×6px (3×6px + 2×4px gap); pulse 8px; spinner 24px; skeleton 420×52px in a 420px column
(avatar 32px, block 376px, lines 12px tall at 0/20/40px, widths 376 / 319.6 / 244.4px, radius 6px).
Colours: dot = `--muted` (light `lab(47.87 1.41 -4.99)`, dark `lab(65.65 1.53 -5.42)`), pulse/spinner = `--accent`
(`lab(54.53 3.32 -66.53)`), avatar/line = `--default` (light `lab(93.03 .10 -.36)`, dark `lab(15.73 .61 -2.17)`).
Our tokens `oklch(.5517 .0138 285.94)`, `oklch(.705 .015 286.067)`, `oklch(.6204 .195 253.83)`, `oklch(.94 .001 286.375)`,
`oklch(.274 .006 286.033)` convert to the same lab values (rounding only).

Theme note (v1.0.0): "Skeletons get a square avatar in the Brutalism theme" - that is theme CSS, not component CSS.

## 5. Behaviour / accessibility

- No keyboard interaction, no focusable parts.
- Skeleton: always `aria-busy="true"`; with `label` it is a `role="status"` region named by `aria-label`.
- Dots / Pulse / Spinner: decorative (`aria-hidden="true"`) without a label; with a label the wrapper gets
  `role="status"` and holds an sr-only `.chat-loader__label` text child (announced once; the inner OSS spinner keeps
  `aria-hidden`). Pro's labelled markup of these deprecated loaders is not shown in any public demo; the remake's
  markup follows the `.chat-loader__label` sr-only class and the "announced once" release note.

## 6. Demos (1 public variant) -> stories

| Pro demo | Content | Story |
|---|---|---|
| `chat-loader-default` | `flex w-[420px] flex-col gap-8`: three rows `flex items-center gap-3` with a `text-muted text-sm` caption + Dots / Pulse / Spinner, then `<ChatLoader.Skeleton />` | `pro-ai-chatloader--default` (own captions) |
| (extra) | every part in sm / md / lg | `pro-ai-chatloader--sizes` |
| (extra, as in `chat-message-loading`) | labelled skeleton (`role="status"`) | `pro-ai-chatloader--with-label` |
| (extra) | custom skeletons (no avatar / five lines) + labelled deprecated loaders | `pro-ai-chatloader--composition` |

## 7. Verification

- Default story vs Pro demo (light + dark), all animations paused at t = 300ms: every element's size, display,
  gap, alignment, radius, opacity, transform and animation (name, duration, easing, delay, iteration, fill) match;
  colours match after converting oklch -> lab.
- Reduced motion: dots / pulse at opacity .7, no animation, no transform - same as Pro.
- Sizes: dots 23×5 / 26×6 / 32×8, pulse 6 / 8 / 10, spinner 16 / 24 / 32, avatar 24 / 32 / 36, skeleton height
  46 / 52 / 58px.
- Independent review (2026-11-25, built-in browser): re-measured the `chat-loader-default` demo (light + dark,
  animations paused at 300ms) against `pro-ai-chatloader--default`: geometry, opacity, transforms, animation
  settings and DOM match; colours compared through canvas RGB are identical (muted 113,113,122 / 159,159,169;
  default 235,235,236 / 39,39,42; accent 4,133,247). Pro's CSSOM is unchanged from the appendix. The public
  storybook.heroui.pro only has a `Default` story (no args), and no public demo renders a labelled Dots / Pulse /
  Spinner, so their labelled markup remains inferred. Theme check: `--radius: 1rem` gives 12px line radius; `--accent`,
  `--default` and `--muted` overrides recolour pulse / spinner, avatar / lines and dots. `data-reduce-motion="true"`
  (HeroUI convention) and `prefers-reduced-motion` both give still dots / pulse at opacity .7.
- The Brutalism square-avatar rule is not part of the component stylesheet on the demo pages (no `brutalism`
  selector targets `.chat-loader__*`); it lives in Pro's theme CSS, which this repo does not ship.

## 8. Dependencies / deviations

- Dependencies: OSS `Spinner` (`@heroui/react`). No Pro component is needed; `Loader` is only the migration target.
- Deviation: each dot gets `data-slot="chat-loader-dot"` and `chat-loader__dot--{sm,lg}` (Pro: no data-slot; the docs
  name `.chat-loader__dot--sm`, the CSSOM sizes through `.chat-loader__dots--sm .chat-loader__dot` - both work).
- Deviation: `.chat-loader__pulse` is `inline-block` so it keeps its size outside a flex row (Pro sets no display; in a
  flex row both are blockified and identical).
- Extra: `size` prop on `SkeletonAvatar` / `SkeletonLine` overrides the skeleton's size.

## Appendix: CSSOM (reference only, Pro stylesheet, `@layer components`)

```css
@keyframes chat-loader-bounce { 0%,80%,100% {opacity:.35;transform:scale(.85)} 40% {opacity:1;transform:scale(1)} }
@keyframes chat-loader-pulse { 0%,100% {opacity:.45;transform:scale(.92)} 50% {opacity:1;transform:scale(1)} }
.chat-loader__dots {align-items:center;gap:var(--spacing);display:inline-flex}
.chat-loader__dot {background-color:var(--muted);border-radius:2.14748e9px;width:.375rem;height:.375rem;animation:1.2s ease-in-out infinite both chat-loader-bounce}
.chat-loader__dot:first-child {animation-delay:-.24s}
.chat-loader__dot:nth-child(2) {animation-delay:-.12s}
.chat-loader__dots--sm .chat-loader__dot {width:.3125rem;height:.3125rem}
.chat-loader__dots--lg .chat-loader__dot {width:.5rem;height:.5rem}
.chat-loader__label {clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}
.chat-loader__pulse {background-color:var(--accent);border-radius:2.14748e9px;width:.5rem;height:.5rem;animation:1.4s ease-in-out infinite chat-loader-pulse}
.chat-loader__pulse--sm {width:.375rem;height:.375rem}
.chat-loader__pulse--lg {width:.625rem;height:.625rem}
.chat-loader__skeleton {align-items:flex-start;gap:calc(var(--spacing) * 3);width:100%;display:flex}
.chat-loader__skeleton-avatar {background-color:var(--default);border-radius:2.14748e9px;flex-shrink:0;width:2rem;height:2rem}
.chat-loader__skeleton-avatar--sm {width:1.5rem;height:1.5rem}
.chat-loader__skeleton-avatar--lg {width:2.25rem;height:2.25rem}
.chat-loader__skeleton-block {gap:calc(var(--spacing) * 2);flex-direction:column;flex:1 1 0%;min-width:0;display:flex}
.chat-loader__skeleton-line {height:calc(var(--spacing) * 3);border-radius:calc(var(--radius) * .75);background-color:var(--default);width:100%}
.chat-loader__skeleton-line--sm {height:calc(var(--spacing) * 2.5)}
.chat-loader__skeleton-line--lg {height:calc(var(--spacing) * 3.5)}
.chat-loader__skeleton-line:nth-child(2) {width:85%}
.chat-loader__skeleton-line:nth-child(3) {width:65%}
.chat-loader__spinner {display:inline-flex}
@media (prefers-reduced-motion:reduce) { .chat-loader__dot,.chat-loader__pulse {opacity:.7;animation:none} }
```
