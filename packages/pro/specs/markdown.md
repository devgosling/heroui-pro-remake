# Markdown — clean-room implementation spec

Slug: `markdown` · Docs: https://heroui.pro/docs/react/components/markdown · Category: AI
Storybook title: `Pro/AI/Markdown`
Import (Pro): `import {Markdown} from "@heroui-pro/react/markdown";` (**subpath only**, never the root barrel)
Import (remake): `import {Markdown, StreamMarkdown} from "@heroui/pro/markdown";`

Sources used: public docs page text, server-rendered HTML of the three public demo pages, the
rendered DOM / computed styles / CSSOM of those pages (light + dark, headless Edge because the
shared browser pane was saturated), MutationObserver timing of the two streaming demos, and the
installed `react-markdown@10`, `marked@18`, `remark-gfm@4`, `streamdown@2.8` packages. I did not
open or try to get around the paywalled example source.

---

## 1. Purpose

Renders AI responses (headings, lists, inline code, fenced code, blockquotes, GFM tables) with the
HeroUI Pro typography. The built-in renderer splits the markdown into top-level blocks and memoizes
each block, so a streamed token only re-renders the block(s) that changed. An optional
Streamdown-based path adds incomplete-markdown repair, word animation and a caret.

Used by Chat Message and Reasoning.

---

## 2. Anatomy

```tsx
import {Markdown} from "@heroui/pro/markdown";

<Markdown>{response}</Markdown>;
```

Rendered DOM (default demo, SSR and hydrated are identical apart from Shiki output):

```html
<div class="markdown" data-slot="markdown">
  <div class="markdown__block" data-slot="markdown-block"><h1>…</h1></div>
  <div class="markdown__block" data-slot="markdown-block"></div>          <!-- `space` token -->
  <div class="markdown__block" data-slot="markdown-block"><p>… <strong>…</strong></p></div>
  <div class="markdown__block" data-slot="markdown-block"><ul>
    <li>Inline <code class="markdown__inline-code" data-slot="markdown-inline-code">code</code></li>
  </ul></div>
  <div class="markdown__block" data-slot="markdown-block">
    <div class="code-block" data-slot="code-block">                       <!-- Pro CodeBlock -->
      <div class="code-block__header" data-slot="code-block-header">
        <span class="markdown__code-language">tsx</span>
        <button data-slot="code-block-copy-button" aria-label="Copy code"
          class="button button--icon-only button--sm button--ghost code-block__copy-button">
          <span class="code-block__copy-button-icon-motion" …><svg …/></span>
        </button>
      </div>
      <div class="code-block__code" data-slot="code-block-code">
        <pre class="shiki shiki-themes github-dark github-light" style="--shiki-dark:…;--shiki-light:…"><code>…</code></pre>
      </div>
    </div>
  </div>
  <div class="markdown__block" data-slot="markdown-block"><blockquote><p>…</p></blockquote></div>
</div>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| Root | `div` | `markdown` | `markdown` | Native div attributes spread on it. `id` prop is **not** written to the DOM (it only seeds block keys). |
| Block | `div` | `markdown-block` | `markdown__block` | One per `marked` lexer token, **including whitespace-only `space` tokens** (they render as empty divs, height 0). |
| Inline code | `code` | `markdown-inline-code` | `markdown__inline-code` | react-markdown `code` override. |
| Fenced code | Pro `CodeBlock` | `code-block`… | `code-block`… | react-markdown `pre` override unwraps the `<code class="language-x">` child. |
| Code language label | `span` | (none in Pro; remake adds `markdown-code-language`) | `markdown__code-language` | First child of `.code-block__header`, text = fence language (lower-case in DOM, upper-cased by CSS). |

Plain markdown elements (`h1`…`h6`, `p`, `ul`, `ol`, `li`, `a`, `blockquote`, `hr`, `table`, `th`,
`td`, `strong`, `em`, `del`) carry no class; they are styled through `.markdown <tag>` selectors.

The anatomy note on the docs says: "Markdown and StreamMarkdown are subpath-only imports …
because they depend on the optional streamdown, react-markdown, marked, and remark-* peers".

---

## 3. API (docs)

### `Markdown`
"The root component. Renders markdown content with HeroUI Pro typography and code block styling."

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `string` | – | Markdown content to render |
| `components` | `Partial<Components>` | – | Custom react-markdown component overrides |
| `id` | `string` | generated | Stable id seed used for memoized block keys |
| `className` | `string` | – | Additional CSS class |

"Also supports all native div HTML attributes."

Implementation mapping (derived):
- blocks = `marked.Lexer.lex(children, {gfm: true}).map(t => t.raw)`; key = `` `${id}-block_${index}` ``.
- each block = `memo(<div.markdown__block><ReactMarkdown remarkPlugins={[remarkGfm]} components={…}>{raw}</ReactMarkdown></div>)`,
  re-rendered only when its raw text (or the components map) changes.
- `components` is merged over the built-in `{code, pre}` renderers.

### `StreamMarkdown` (mentioned in the anatomy, not in the API tables)
Not documented beyond the anatomy sentence. Pro's CSS contains `.markdown [data-sd-animate]`
plus the `sd-fadeIn` / `sd-blurIn` / `sd-slideUp` keyframes, which shows that a Streamdown root
carrying the `markdown` class is expected. Remake: a thin wrapper over `<Streamdown>` that
- adds `class="markdown"` and `data-slot="markdown"` to the Streamdown root,
- accepts every Streamdown prop (`animated`, `caret`, `isAnimating`, `mode`, `components`, …),
- replaces Streamdown's Tailwind-classed renderers with plain elements (so the `.markdown`
  typography applies; Streamdown's utility classes would win over the components layer),
- renders fenced code through the same CodeBlock + `.markdown__code-language` header, inline code
  with `.markdown__inline-code`.

---

## 4. Styling (all rules in `@layer components`; Tailwind shorthand in brackets)

`.markdown` — `width:100%` [w-full]; `font-size: var(--text-sm)` with `line-height: var(--leading-relaxed)`
[text-sm leading-relaxed → 14px / 22.75px]; `color: var(--foreground)`.

| Selector | Declarations |
|---|---|
| `.markdown p` | `margin-bottom: spacing*3` [mb-3]; `:last-child` → `mb-0` |
| `.markdown h1,h2,h3,h4` | `mt-4 mb-2 font-semibold text-foreground`; `:first-child` → `mt-0` |
| `.markdown h1` | `text-xl` (20px/28px) |
| `.markdown h2` | `text-lg` (18px/28px) |
| `.markdown h3` | `text-sm` (14px/20px) |
| `.markdown h4` | (inherits 14px / 22.75px, weight 600) — h5/h6 have no rule (preflight: inherit) |
| `.markdown ul, ol` | `mb-3 list-inside space-y-1 ps-2`; `:last-child` → `mb-0` |
| `.markdown ul` | `list-disc`; `li::marker` → `color-mix(in oklab, var(--muted) 40%, transparent)` [text-muted/40] |
| `.markdown ol` | `list-decimal` |
| `.markdown li` | `leading-relaxed` |
| `.markdown a` | `text-link underline underline-offset-2` (`--link` is `var(--foreground)` in the default theme) |
| `.markdown blockquote` | `my-3 border-s-2 border-border ps-4 text-muted italic` |
| `.markdown hr` | `my-4 border-border` |
| `.markdown table` | `mb-3 w-full border-collapse text-sm` |
| `.markdown th, td` | `border border-border px-3 py-2 text-start` |
| `.markdown th` | `bg-surface-secondary font-medium` |
| `.markdown__block` | `w-full` |
| `.markdown__inline-code` | `rounded-sm (radius*.5) bg-default px-1.5 py-0.5 font-mono text-foreground; font-size: .875em` |
| `.markdown__code-language` | `text-xs text-muted uppercase` |
| `.markdown [data-sd-animate]` | `animation: var(--sd-animation, sd-fadeIn) var(--sd-duration, .15s) var(--sd-easing, ease) var(--sd-delay, 0s) both` |

Important consequence of the block wrappers: every block element is the only child of its
`.markdown__block`, so `p:last-child`, `ul/ol:last-child` (margin-bottom 0) and
`h1…h4:first-child` (margin-top 0) **always** match inside `Markdown`. Observed layout (default demo):
h1 (28) → 8px → p → **0px** → h2 → 8px → ul → 8px → code block (margin 8 collapses) → 12px → blockquote.
Margins collapse through the zero-padding block divs. The remake reproduces this exactly
(root height 453.66px for the same structure in Pro and in the story).

Code block styling (`.code-block*`) belongs to the CodeBlock component (code-block.css): surface
`bg-surface-secondary`, radius `radius*2`, `my-2`, header `px-3 pt-2`, code 13px / leading-relaxed,
pre `px-3 py-2`, copy button 24×24 ghost icon button with a 14px icon, Shiki dual themes
`github-light` / `github-dark` with `defaultColor: false` (`--shiki-light` / `--shiki-dark`).

Token mapping (light / dark, as resolved on the Pro demo page; remake resolves to the same oklch values):
foreground `lab(8.34…)` / `lab(98.97…)`; muted `lab(47.87…)` / `lab(65.65…)` = oklch(.5517 …) / oklch(.705 …);
default (inline code bg) `lab(93.03…)` / `lab(15.73…)` = oklch(.94 …) / oklch(.274 …);
surface-secondary (code block, th) `lab(94.47…)` / `lab(13.78…)`; border `lab(88.37…)` / `lab(16.43…)`.

Dark mode: no dedicated rules — everything is token driven.

---

## 5. Behaviour

- **Block memoization**: appending text only changes the trailing block(s); earlier blocks keep their
  index key and skip rendering (`memo` comparator on raw text + shallow components map).
- **Streaming demo** (`markdown-streaming`): starts empty (`<div class="markdown"></div>` in SSR),
  then appends **8 characters every ~120 ms** (setInterval; measured deltas 106–140 ms), stops at the
  end (no loop, no replay button). ~21 ticks for ~170 characters. Unclosed fences render as code
  immediately (react-markdown / marked treat an unclosed fence as code until EOF).
- **With Streamdown demo** (`markdown-with-streamdown`): uses `<Streamdown animated caret="block"
  isAnimating>` directly (docs snippet imports `streamdown` + `streamdown/styles.css`) with a `code`
  override that renders the Pro CodeBlock (label span `text-muted text-xs uppercase`). Same 8 chars /
  120 ms cadence. Words are wrapped in `span[data-sd-animate]` (fadeIn 150ms for new words, `--sd-duration: 0ms`
  for already-shown words). The root keeps Streamdown's own classes (`space-y-4 whitespace-normal …`)
  and the caret classes; on the Pro site the caret utilities are **not compiled**, so no caret is
  visible (`::after { content: none }`). Root font is the page default (16px/24px), h1 uses
  Streamdown's `mt-6 mb-2 font-semibold text-3xl`, ul `list-inside list-disc`, li `py-1`.
- **Copy button**: CodeBlock behaviour (copies the fence text, icon swaps to a check, resets).
- Keyboard: only the copy button is focusable (Tab), activated by Enter/Space (RAC Button).
- No animations on `Markdown` itself.

---

## 6. Demos (one story each)

| Pro demo | Content structure | Story |
|---|---|---|
| `markdown-default` | h1, p with strong, h2, ul ×3 (2nd with inline code), ```tsx (8 lines), blockquote | `Default` |
| `markdown-streaming` | h1, p, ol ×3, ```js (1 line), streamed 8 chars / 120 ms | `Streaming` |
| `markdown-with-streamdown` | h1, p (2 lines), ul ×3, ```tsx (3 lines), Streamdown + CodeBlock override | `WithStreamdown` |

Extra stories (not Pro demos): `StreamMarkdownTypography` (the `StreamMarkdown` wrapper) and
`AllElements` (every styled element incl. h3/h4, links, nested lists, hr, GFM table, a fence without language).

Demo wrapper: `div.w-[640px]` centred on the page; page body `bg-background text-foreground`.

---

## 7. Dependencies

- `react-markdown@10`, `remark-gfm@4`, `marked@18` (block splitting), `streamdown@2` (StreamMarkdown).
- Pro `CodeBlock` (`../code-block`: Root, Header, CopyButton, Code) → `shiki` (lazy).
- OSS: none directly (CodeBlock uses the OSS Button).
- Subpath-only export (`rootExport = false`).

---

## 8. Deviations / decisions

- Fence without a language: the label shows `text` (Pro behaviour not observable in the demos).
- The language label also gets `data-slot="markdown-code-language"` (Pro renders none).
- `StreamMarkdown` internals are not documented; the remake swaps Streamdown's classed renderers for
  plain elements so it matches `Markdown` typography. Streamdown's root utilities (`space-y-4`, caret
  classes) stay, so block spacing there is 16px when that utility is compiled.
- `.markdown [data-sd-animate]` additionally gets `motion-reduce:animate-none`.
- Reference-style link definitions in a different block than their usage do not resolve (each block is
  parsed separately), same as any block-memoized renderer.

---

## 9. Independent review (second pass)

Re-measured in the shared browser pane (demo wrapper forced to 640px on both sides):

- `markdown-default` / `Default`: every element's box, margins, paddings, font metrics and resolved
  colours match in light and dark (oklch tokens converted to lab are identical); root 453.66px.
  Copy button hover (`foreground` text, `default` background), keyboard focus ring (2px background +
  4px `--focus` box-shadow) and the copied text (fence text without the trailing newline) match.
- `markdown-streaming` / `Streaming`: same cadence (setInterval 120ms, 8 source characters per tick,
  root starts with zero blocks, no loop), same final layout (root 212.13px), fence label appears as
  soon as "```js" arrives.
- `markdown-with-streamdown` / `WithStreamdown`: same final layout (root 331.38px), same word
  animation (`sd-fadeIn` 150ms, 40ms stagger, 0ms for already shown words), caret utilities not
  compiled on either side (`::after` content stays `none`).
- Theme: `--radius` 1rem gives inline code 8px / code block 32px; `--font-sans`, `--font-mono` and
  `--link` follow.

Differences that come from outside the component (not changed):

- The installed `streamdown@2.8.1` also fades list markers in (`data-sd-animate-marker` +
  `sd-markerIn` in `streamdown/styles.css`); the Streamdown build on heroui.pro predates that, so
  its markers appear instantly. Visible only in the `WithStreamdown` story (150ms marker fade).
- The Pro demo never sets `isAnimating` back to `false`: after the stream ends its DOM keeps the
  word spans (0ms) and `--streamdown-caret`. The story follows the documented recipe
  (`isAnimating={isStreaming}`), so Streamdown unwraps the spans at the end. No visible change.
- Demo page wrapper: on heroui.pro the `w-[640px]` wrapper is a flex item (p-6, centred), so it
  shrinks to min-content and contains the h1/code-block margins in narrow viewports; Storybook's
  centred layout does not. Same rendering at widths of 688px and more.

---

## Appendix A — Pro CSSOM (reference only, `@layer components`)

```css
.markdown {width:100%;font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height));--tw-leading:var(--leading-relaxed);line-height:var(--leading-relaxed);color:var(--foreground)}
.markdown p {margin-bottom:calc(var(--spacing) * 3)}
.markdown p:last-child {margin-bottom:0}
.markdown h1,.markdown h2,.markdown h3,.markdown h4 {margin-top:calc(var(--spacing) * 4);margin-bottom:calc(var(--spacing) * 2);font-weight:var(--font-weight-semibold);color:var(--foreground)}
:is(.markdown h1,.markdown h2,.markdown h3,.markdown h4):first-child {margin-top:0}
.markdown h1 {font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}
.markdown h2 {font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}
.markdown h3 {font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}
.markdown ul,.markdown ol {margin-bottom:calc(var(--spacing) * 3);list-style-position:inside}
:where(:is(.markdown ul,.markdown ol)>:not(:last-child)) {margin-block-end:calc(var(--spacing) * 1)}
.markdown ul,.markdown ol {padding-inline-start:calc(var(--spacing) * 2)}
:is(.markdown ul,.markdown ol):last-child {margin-bottom:0}
.markdown ul {list-style-type:disc}
.markdown ul li::marker {color:color-mix(in oklab, var(--muted) 40%, transparent)}
.markdown ol {list-style-type:decimal}
.markdown li {line-height:var(--leading-relaxed)}
.markdown a {color:var(--link);text-underline-offset:2px;text-decoration-line:underline}
.markdown blockquote {margin-block:calc(var(--spacing) * 3);border-inline-start-width:2px;border-color:var(--border);color:var(--muted);padding-inline-start:calc(var(--spacing) * 4);font-style:italic}
.markdown hr {margin-block:calc(var(--spacing) * 4);border-color:var(--border)}
.markdown table {margin-bottom:calc(var(--spacing) * 3);border-collapse:collapse;width:100%;font-size:var(--text-sm)}
.markdown th,.markdown td {border-width:1px;border-color:var(--border);padding-inline:calc(var(--spacing) * 3);padding-block:calc(var(--spacing) * 2);text-align:start}
.markdown th {background-color:var(--surface-secondary);font-weight:var(--font-weight-medium)}
.markdown__block {width:100%}
.markdown__inline-code {border-radius:calc(var(--radius) * .5);background-color:var(--default);padding-inline:calc(var(--spacing) * 1.5);padding-block:calc(var(--spacing) * .5);font-family:var(--font-mono);color:var(--foreground);font-size:.875em}
.markdown__code-language {font-size:var(--text-xs);line-height:var(--text-xs--line-height);color:var(--muted);text-transform:uppercase}
.markdown [data-sd-animate] {animation:var(--sd-animation,sd-fadeIn) var(--sd-duration,.15s) var(--sd-easing,ease) var(--sd-delay,0s) both}
@keyframes sd-fadeIn {0%{opacity:0} to{opacity:1}}
@keyframes sd-blurIn {0%{opacity:0;filter:blur(4px)} to{opacity:1;filter:blur()}}
@keyframes sd-slideUp {0%{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)}}
```

## Appendix B — measured metrics (light, 640px wide, default demo)

```
h1            y=0      640×28    20px/28px 600  m=0,8
p             y=36     640×45.5  14px/22.75px
h2            y=81.5   640×28    18px/28px 600  m=0,8
ul            y=117.5  640×76.4  ps=8 list=disc/inside; li m-b 4 (last 0); marker muted/40
inline code   18px tall, 12.25px mono, p=2/6, r=4, bg default
code-block    y=201.9  640×217   m=8,8 r=16 bg surface-secondary; header 32 (pt 8, px 12);
              label 12px/16px muted uppercase; copy button 24×24 at x=604; code 13px/21.125px
blockquote    y=430.9  640×22.8  m=12,12 ps=16 border-s 2 border, muted, italic
root height   453.66
```
