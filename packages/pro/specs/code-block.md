# Code Block: clean-room implementation spec

Slug: `code-block` · Docs: https://heroui.pro/docs/react/components/code-block · Category: AI
Import (Pro): `import {CodeBlock} from "@heroui-pro/react/code-block";` (subpath only, needs the optional `shiki` peer)
Remake: `import {CodeBlock} from "@heroui/pro/code-block";` (subpath only, `rootExport = false`)

Sources: public docs text, the SSR markup and live DOM of the public demo page (light and dark),
CSSOM rules, computed styles, and runtime probing (copy click with a stubbed clipboard,
MutationObserver traces, `getAnimations()`). I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A syntax-highlighted code surface for AI markdown output, tool snippets and examples. It has an
optional header row (a language label plus a copy button). Chat Tool uses it to render its args and
result panes, and restyles it there.

---

## 2. Anatomy

```tsx
<CodeBlock>
  <CodeBlock.Header>                       {/* optional */}
    <span className="text-xs text-muted uppercase">typescript</span>   {/* user content */}
    <CodeBlock.CopyButton code={code} />    {/* optional */}
  </CodeBlock.Header>
  <CodeBlock.Code code={code} language="typescript" />
</CodeBlock>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| `CodeBlock` | `<div>` | `code-block` | `code-block` | Native div props. No other attributes. |
| `CodeBlock.Header` | `<div>` | `code-block-header` | `code-block__header` | Native div props. |
| `CodeBlock.Code` | `<div>` | `code-block-code` | `code-block__code` | Holds shiki's `<pre class="shiki shiki-themes github-dark github-light" tabindex="0" style="--shiki-dark:…;--shiki-light:…;--shiki-dark-bg:…;--shiki-light-bg:…"><code><span class="line"><span style="--shiki-dark:#…;--shiki-light:#…">…`. Before highlighting (SSR / first paint): `<pre><code>{code}</code></pre>` with no class. |
| `CodeBlock.CopyButton` | OSS `Button` → `<button>` | `code-block-copy-button` | `button button--icon-only button--sm button--ghost code-block__copy-button` | `aria-label="Copy code"`. RAC button attributes (`data-rac`, `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`). |
| icon wrapper | `<span>` | `code-block-copy-button-icon-motion` | `code-block__copy-button-icon-motion` | Wraps a 16×16 viewBox SVG (copy icon, or the check icon after copying). |

Shiki output: dual themes `{dark: "github-dark", light: <theme>}` with `defaultColor: false`. So there is no inline
`color`, only CSS variables, and the stylesheet picks `--shiki-light` or `--shiki-dark`. The class order
(`github-dark github-light`) shows the dark entry comes first in the themes object.

---

## 3. API (docs)

### `CodeBlock`
Root container. Native `div` props.

### `CodeBlock.Header`
Slot for language labels and actions. Native `div` props.

### `CodeBlock.Code` (native `div` props too)
| Prop | Type | Default | Description |
|---|---|---|---|
| `code` | `string` | – | Code to render |
| `language` | `string` | `'plaintext'` | Shiki language id |
| `theme` | `string` | `'github-light'` | Shiki theme |

### `CodeBlock.CopyButton`
| Prop | Type | Default | Description |
|---|---|---|---|
| `code` | `string` | – | Code copied to clipboard |
| `aria-label` | `string` | `'Copy code'` | Accessible label |
| `className` | `string` | – | Additional class |

### CSS classes (docs)
`.code-block` (root surface), `.code-block__header` (header row), `.code-block__code` (code scroll region),
`.code-block__copy-button` (copy/check icon button). Rendered as well: `.code-block__copy-button-icon-motion`.

---

## 4. Styling (observed, mapped to tokens)

| Element | Observed | Authored as |
|---|---|---|
| `.code-block` | `display:flex; flex-direction:column; width:100%; margin-block:8px; border-radius: calc(var(--radius)*2)` (16px); `background: var(--surface-secondary)`; `color: var(--surface-secondary-foreground)`; `overflow: clip` | `my-2 flex w-full flex-col overflow-clip rounded-2xl bg-surface-secondary text-surface-secondary-foreground` |
| `.code-block__header` | flex, `justify-content: space-between`, `align-items:center`, `gap:8px`, `padding: 8px 12px 0` → height 32px (24px button + 8px top) | `flex items-center justify-between gap-2 px-3 pt-2` |
| label (demo content) | 12px/16px, uppercase, `--muted` | user content: `text-xs text-muted uppercase` |
| `.code-block__code` | `width:100%; overflow-x:auto; font-size:13px; line-height: var(--leading-relaxed)` (21.125px); theme scrollbar vars | `scrollbar w-full overflow-x-auto text-[13px] leading-relaxed` |
| `pre` | `margin:0; padding: 8px 12px; background: none !important` (drops shiki's inline bg) | `m-0 px-3 py-2` + `background: none !important` |
| `code` | `font-family: var(--font-mono)` | `font-mono` |
| `.line` | `padding-inline: 0 !important` | same |
| `.shiki`, `.shiki span` | `color: var(--shiki-light, var(--color-surface-secondary-foreground))`; in dark (`.dark`, `[data-theme="dark"]`, `[data-theme$="-dark"]`, and named Pro themes) `var(--shiki-dark, …)` | same selectors (see §6 deviation note on the `dark:` variant) |
| `.code-block__copy-button` | `color: var(--muted)`, `flex-shrink:0`, `outline:none`, tap highlight off, `cursor: var(--cursor-interactive)`; `.button--icon-only.button--sm` → 24×24 (radius from OSS = 24px pill); svg 14×14, margin 0 | `shrink-0 text-muted outline-none no-highlight`, `size-6`, svg `m-0 size-3.5` |
| hover | `@media (hover:hover)` `:hover, [data-hovered="true"]` → `color: var(--foreground)` (background from OSS ghost hover) | same |
| focus | `:focus-visible:not([data-focused]), [data-focus-visible="true"]` → `status-focused` ring | same |
| disabled | `:disabled, [aria-disabled="true"]` → `status-disabled` | same |
| icon wrapper | `display:flex; align/justify center; 14×14` | `flex size-3.5 items-center justify-center` |

Measured (Pro light and remake, 5-line TS snippet): root 153.625px tall (header 32 + code 121.625), pre padding 8/12,
copy button 24×24 at header right edge minus 12px, icon 14×14 centred (5px inset). Light colours: bg `--surface-secondary`,
label/button `--muted`, tokens `#24292e / #d73a49 / #6f42c1 / #e36209 / #005cc5 / #032f62` (github-light). Dark:
bg `--surface-secondary` (dark), tokens `#e1e4e8 / #f97583 / #b392f0 / #ffab70 / #79b8ff / #9ecbff` (github-dark).

Chat Tool context (owned by chat-tool, documented for reference): `.chat-tool__args|result .code-block` → `margin-block: var(--spacing)`,
`border-radius: calc(var(--radius)*1.5)`; `.code-block__code` → 11px / 20px line-height; `pre` → `padding: 6px 10px`.

---

## 5. Behaviour and timings

- Highlighting is client-side and async. SSR and first paint show the plain `<pre><code>`, then shiki's markup replaces it.
- Copy: pressing the button (pointer, Enter, Space) calls `navigator.clipboard.writeText(code)`. On success the icon swaps to a
  check, and after **2000 ms** it swaps back. Nothing happens on failure (no error state). `aria-label` stays "Copy code" and no data attribute is added.
- Icon swap (Pro uses an animation library with popLayout presence): the new icon mounts with `opacity:0; filter:blur(4px); scale(.25)` and
  animates to `opacity:1; blur(0); scale(1)`. The old icon becomes `position:absolute` (popped out of the flow, so it stays centred) and
  animates to `opacity:0; blur(4px); scale(.25)`, then unmounts. Opacity and filter run as WAAPI animations of **300 ms** with a
  spring-derived `linear()` easing (critically damped, no bounce). Scale follows the same spring. The first render does not animate.
- No other keyboard behaviour. Shiki's `<pre tabindex="0">` makes the scroll region focusable for keyboard scrolling.

---

## 6. Remake: implementation notes and deviations

- `CodeBlock.Code` uses one lazily created shiki highlighter (`import("shiki")` on first use), loads languages and themes on demand,
  and keeps a bounded HTML cache. Unknown language ids fall back to `plaintext`, and unknown themes fall back to github-light / github-dark.
  While a new version of `code` is being highlighted (streaming), the previous highlighted markup stays on screen instead of flashing back to plain text.
- Extra optional props (additions): `CodeBlock.Code darkTheme` (default `github-dark`, the theme used in dark mode, which Pro hard-codes),
  `CodeBlock.CopyButton onCopy(code)` and all other OSS `Button` props.
- The icon swap is CSS only: `@starting-style` on `[data-entering]` and a `[data-exiting]` state (absolute, faded) kept mounted for 300 ms,
  with the transitions written as a self-computed critically-damped-spring `linear()` curve. The transient
  `data-entering` / `data-exiting` attributes replace the library's inline styles and `data-motion-pop-id`. `motion-reduce:transition-none` applies.
- Dark token colours use explicit `.dark` / `[data-theme="dark"]` / `[data-theme$="-dark"]` ancestor selectors (the same selectors that switch the
  theme tokens) instead of the OSS `dark:` custom variant. That variant's `prefers-color-scheme` fallback (`&:not(.dark…) &`) also matches token
  `<span>`s inside a light `.shiki` `<pre>` when the OS is dark.
- Token markup matches Pro's: `mergeWhitespaces: false` keeps whitespace in its own spans (`function`, ` `, `greet` ...), and a small
  shiki transformer moves each line break into the preceding `.line` span (`<span class="line">…\n</span>`, none after the last line),
  so there are no bare "\n" text nodes between lines, as in Pro's DOM.
- After the icon swap settles, the remaining icon span has no transient attributes (only `class` + `data-slot`), like Pro's idle DOM.
- Dark token selector list matches Pro's: `.dark`, `.glass-dark`, `.mouve-dark`, `.brutalism-dark`, `[data-theme="dark"]`, `[data-theme$="-dark"]` (`:is()`, same specificity).

### Review measurements (Pro demo vs `Default` story, foreground tab)

- Root 16px radius, 8px block margin, header 32px (pad 8/12/0, gap 8), code 13px / 21.125px, pre pad 8/12, button 24×24 pill, svg 14×14: identical.
- Colours (resolved to sRGB): surface 239,239,240 / dark 35,35,37; muted label + button 113,113,122 / dark 159,159,169; hover bg 235,235,236 / dark
  39,39,42 with fg 24,24,27 / dark 252,252,252; github-light / github-dark token colours identical. Focus ring 2px `--background` + 2px `--focus`; the
  `<pre tabindex=0>` uses the UA focus outline in both.
- Icon swap progress (entering opacity / scale) sampled every ~9ms: Pro 18ms .099/.323, 36ms .275/.469, 73ms .608/.708, 100ms .812/.862,
  153ms .944/.959, removed at ~300ms; remake 18ms .095/.321, 38ms .268/.451, 75ms .604/.703, 105ms .809/.856, 151ms .942/.956, removed at ~305ms.
  Reset to the copy icon after 2000ms in both.
- Theme: `--radius: 1rem` → root 32px / button 48px; `--font-sans` and `--font-mono` overrides apply to the label and code.

## 7. Demos

| Pro demo | Story |
|---|---|
| `code-block-default` (`?theme=light|dark`): `w-[480px]` wrapper, header with uppercase muted "typescript" label and copy button, 5-line TS function | `Default` (own snippet, same structure; argTypes for `code`, `language`, `theme`, `darkTheme`) |
| – | `WithoutHeader`, `Languages`, `Streaming` (extra coverage stories) |

## 8. Dependencies

- `shiki` (optional peer, installed 4.6.0), OSS `Button` from `@heroui/react`.
