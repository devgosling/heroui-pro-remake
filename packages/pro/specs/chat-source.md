# Chat Source — clean-room implementation spec

Slug: `chat-source` · Docs: https://heroui.pro/docs/react/components/chat-source · Category: AI
Import (Pro): `import {ChatSource, ChatSources} from "@heroui-pro/react";`
Storybook title (remake): `Pro/AI/ChatSource`

Sources: public docs text, rendered DOM, CSSOM, computed styles and runtime probing (hover/focus/
keyboard, MutationObserver timings, `getAnimations()`) of the four public demo pages in light and
dark. The paywalled example source was neither opened nor worked around.

Tooling note: the shared built-in browser was at its tab cap, so the demo pages were inspected in an
isolated headless Edge instance driven over the DevTools protocol (same public pages, same checks).

---

## 1. Purpose

Citation chips and grouped source lists for AI responses.

- `ChatSource`: one inline chip that cites a link (favicon + title, opens in a new tab, hover
  preview with domain/title/description) or a document (file glyph + name, plain text).
- `ChatSources`: a HeroUI Disclosure that folds many sources behind a trigger (e.g. stacked
  favicons + "3 sources"); `ChatSources.List` is a wrapping row that can show the first N sources
  plus a "+N more" / "Show less" chip.

---

## 2. Anatomy

```tsx
<ChatSource href={href} title={title}>
  <ChatSource.Trigger>
    <ChatSource.Icon /> {/* optional */}
    <ChatSource.Title />
  </ChatSource.Trigger>
  <ChatSource.Preview /> {/* optional */}
</ChatSource>

<ChatSources>
  <ChatSources.Trigger>{/* label */}</ChatSources.Trigger>
  <ChatSources.Content>
    <ChatSources.List maxVisible={3}>{/* ChatSource… */}</ChatSources.List>
  </ChatSources.Content>
</ChatSources>
```

Rendered DOM (observed):

```html
<!-- URL source with preview (title or description present) -->
<span class="chat-source" data-slot="chat-source" data-source-type="url">
  <span class="hover-card__trigger" data-slot="hover-card-trigger" tabindex="-1"
        data-react-aria-pressable aria-haspopup="dialog" aria-expanded="false" style="-webkit-touch-callout:none;-webkit-user-drag:none">
    <a class="chat-source__trigger chat-source__trigger-link" data-slot="chat-source-trigger"
       href="…" rel="noopener noreferrer" target="_blank">
      <img alt="" class="chat-source__icon" data-slot="chat-source-icon" width="16" height="16" src="…">
      <span class="chat-source__title" data-slot="chat-source-title">HeroUI</span>
    </a>
  </span>
</span>

<!-- document source -->
<span class="chat-source" data-slot="chat-source" data-source-type="document">
  <span class="chat-source__trigger chat-source__trigger-link" data-slot="chat-source-trigger">
    <svg class="chat-source__document-icon" data-slot="chat-source-document-icon" width="16" height="16" viewBox="0 0 16 16">…file-text…</svg>
    <span class="chat-source__title" data-slot="chat-source-title">Q3-launch-brief.pdf</span>
  </span>
</span>

<!-- preview (portal, Pro HoverCard content, placement top, offset 8, no arrow) -->
<div class="hover-card__content chat-source__preview" data-slot="chat-source-preview" role="dialog"
     data-trigger="PreviewTrigger" data-placement="top" tabindex="-1">
  <a class="chat-source__preview-link" href="…" rel="noopener noreferrer" target="_blank">
    <div class="chat-source__preview-header">
      <img class="chat-source__icon" data-slot="chat-source-icon" …>
      <span class="chat-source__preview-domain">heroui.com</span>
    </div>
    <div class="chat-source__preview-title">HeroUI</div>
    <div class="chat-source__preview-description">…</div>
  </a>
</div>

<!-- grouped -->
<div class="disclosure chat-sources" data-slot="chat-sources" data-rac>
  <h3 class="disclosure__heading" data-slot="disclosure-heading">
    <button class="disclosure__trigger chat-sources__trigger" data-slot="chat-sources-trigger" slot="trigger" aria-expanded aria-controls>
      <span class="chat-sources__trigger-label">…user children…</span>
      <svg class="disclosure__indicator chat-sources__indicator" data-slot="disclosure-indicator">…chevron…</svg>
    </button>
  </h3>
  <div class="disclosure__content chat-sources__content" data-slot="chat-sources-content" role="group"
       hidden="until-found" style="--disclosure-panel-width;--disclosure-panel-height" [data-expanded="true"]>
    <div class="disclosure__body" data-slot="disclosure-body">
      <div class="disclosure__body-inner">
        <div class="chat-sources__content-body">
          <div class="chat-sources__list" data-slot="chat-sources-list">…chips…
            <button class="chat-sources__toggle" data-slot="chat-sources-toggle" data-rac aria-expanded="false">
              +2 more<span class="chat-sources__toggle-hidden-text"> sources</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

| Part | Element | `data-slot` | Class | Notes |
|---|---|---|---|---|
| `ChatSource` | `span` | `chat-source` | `chat-source` | `data-source-type="url\|document"` |
| (hover card) | Pro `HoverCard` root + `HoverCard.Trigger` `span` | `hover-card-trigger` | `hover-card__trigger` | only when the preview is mounted |
| `ChatSource.Trigger` | `a` (url) / `span` (document) | `chat-source-trigger` | `chat-source__trigger chat-source__trigger-link` | link: `target=_blank rel="noopener noreferrer"` |
| `ChatSource.Icon` | `img` (favicon) / custom element / `span` (letter) | `chat-source-icon` | `chat-source__icon` / `chat-source__icon-fallback` | decorative (`alt=""`) |
| document glyph | `svg` | `chat-source-document-icon` | `chat-source__document-icon` | Gravity UI `file-text` |
| `ChatSource.Title` | `span` | `chat-source-title` | `chat-source__title` | title → domain of href → "Source" |
| `ChatSource.Preview` | Pro `HoverCard.Content` | `chat-source-preview` | `hover-card__content chat-source__preview` | default link/header/domain/title/description |
| `ChatSources` | OSS `Disclosure` | `chat-sources` | `disclosure chat-sources` | |
| `ChatSources.Trigger` | OSS `Disclosure.Heading` > `Disclosure.Trigger` | `chat-sources-trigger` | `disclosure__trigger chat-sources__trigger` | label span + `Disclosure.Indicator` (`chat-sources__indicator`) |
| `ChatSources.Content` | OSS `Disclosure.Content` > `Disclosure.Body` > `div` | `chat-sources-content` | `disclosure__content chat-sources__content` | inner `chat-sources__content-body` |
| `ChatSources.List` | `div` | `chat-sources-list` | `chat-sources__list` | |
| toggle | RAC `Button` | `chat-sources-toggle` | `chat-sources__toggle` | `aria-expanded`; hidden text `chat-sources__toggle-hidden-text` |

Observed: no first-letter fallback swap on a failed favicon load (blocking the favicon requests left
the `<img>` in place). The letter fallback is only used when no `faviconUrl` is given.

---

## 3. API (docs)

### ChatSource (span, native span props)
| Prop | Type | Default | Description |
|---|---|---|---|
| `href` | `string` | – | URL the chip links to |
| `title` | `string` | domain of `href` | Label of the chip |
| `description` | `string` | – | Text shown in the hover preview |
| `faviconUrl` | `string` | – | Logo in chip and preview; falls back to the first letter |
| `sourceType` | `"url" \| "document"` | `"url"` when `href` is set | Link or file |
| `enablePreview` | `boolean` | `true` with a title or description | Mounts the hover preview for URL sources |
| `children` | `ReactNode` | trigger and preview | Custom composition |

- `ChatSource.Trigger`: native `a` props; children replace icon + title. Deprecated `label` (renders
  when the trigger has no children).
- `ChatSource.Icon`: `faviconUrl` (overrides source), `children` (custom logo; receives the icon class).
- `ChatSource.Title`: native span props; children override the text.
- `ChatSource.Preview`: HoverCard.Content props + `title`, `description` overrides; children replace
  the default content.

### ChatSources (Disclosure props), Trigger (Disclosure.Trigger props), Content (Disclosure.Content props)

### ChatSources.List (native div props)
| Prop | Type | Default |
|---|---|---|
| `maxVisible` | `number` | – (floored, < 0 → 0) |
| `defaultShowAll` | `boolean` | `false` |
| `showAll` | `boolean` | – (controlled) |
| `onShowAllChange` | `(showAll: boolean) => void` | – |
| `renderToggle` | `({hiddenCount, showAll}) => ReactNode` | "+N more" / "Show less" |

Localization: "+N more" (+ visually hidden " sources"), "Show less", "Source" (title fallback).
`renderToggle`'s label becomes the accessible name.

---

## 4. Styling (tokens)

All metrics identical in light and dark; colours via tokens.

| Element | Values |
|---|---|
| `.chat-source`, `.chat-source__trigger`, `.chat-source .hover-card__trigger` | `inline-flex h-6 (24px) max-w-full items-center` |
| chip `.chat-source__trigger-link` | 24px, `gap 4px`, `ps 4px pe 8px`, `rounded-full`, `1px border-border`, `bg-default`, `text-xs` (12/16), weight 400, `text-foreground/86`, nowrap, no underline, `transition-colors 150ms` (default ease); hover (`@media hover`) `bg-default-hover`; focus `status-focused` (2px focus ring + 2px background offset) |
| `.chat-source__icon`, `.chat-source__document-icon` | 16×16, `object-contain`, `shrink-0`; document glyph `text-muted` |
| `.chat-source__icon-fallback` | 16×16 round, `bg-default` (`bg-surface` inside the chip), 10px/1 medium, `text-muted`, uppercase |
| `.chat-source__title` | `min-w-0 truncate text-start font-normal` |
| `.chat-source__preview` | `w-80` (320px) on top of Hover Card content (`p-4 rounded-2xl bg-overlay shadow-overlay`) |
| preview link | `flex-col gap-1.5`, no underline; header `flex gap-1.5`; domain `text-sm text-foreground truncate`; title `text-sm font-medium line-clamp-2`; description `text-sm text-muted line-clamp-2` |
| `.chat-sources` (+ heading) | `w-full` |
| `.chat-sources__trigger` | `inline-flex min-h-8 h-auto w-fit gap-2 px-0 py-1 text-xs font-medium text-muted`, `transition: color 100ms var(--ease-out)`, hover `text-foreground` |
| `.chat-sources__trigger-label` | `inline-flex min-w-0 items-center gap-2` |
| `.chat-sources__indicator` | 14×14, `text-muted`; OSS rotate -180° when expanded, duration 150ms |
| `.chat-sources__content` | height/opacity transition 150ms (`--ease-out-quad` / `--ease-out`); `border-t 0 → 1px border-separator` when expanded; OSS body padding 8px |
| `.chat-sources__content-body` | `pt-2` |
| `.chat-sources__list` | `flex flex-wrap items-center gap-2` |
| `.chat-sources__toggle` | 24px, `px-2`, `rounded-full`, `1px border-border`, transparent, `text-xs text-muted`, nowrap, `transition-colors 150ms`; hover `bg-default-hover text-foreground`; focus `status-focused` |
| `.chat-sources__toggle-hidden-text` | `sr-only` |

Measured: "HeroUI" chip 73.59×24, "Q3-launch-brief.pdf" chip 147.66×24 (identical in the remake
with the same text); grouped trigger 134.5×32; preview 320×124 (16px padding, 6px gaps, header 20px).

---

## 5. Behaviour / timings

- Preview: Pro HoverCard (RAC `PreviewTrigger`), placement top, offset 8, no arrow.
  Open ≈150ms after pointer enter (measured 166–170ms pointer→mount, remake 163–169ms), close
  immediately when the pointer leaves the safe area (exiting ≈10ms after leaving, 100ms exit
  animation) → `openDelay=150`, `closeDelay=0`. Enter animation 150ms fade + zoom 0.97 + 4px slide.
- Keyboard: Tab focuses the link (hover-card trigger span has `tabindex=-1`), preview opens after the
  delay; Tab moves into the preview link; Escape closes it (focus stays on the chip).
- ChatSources trigger: RAC Button in an `h3`, toggles the panel (`aria-expanded`), chevron rotates.
- List toggle: RAC Button, `aria-expanded`, keeps focus; "Show less" has no hidden text. Visible chips
  stay mounted while toggling (only the extra chips mount/unmount).

---

## 6. Demos (all reproduced as stories)

| Demo | URL slug | Story |
|---|---|---|
| Default (link chip with preview + document chip) | `chat-source-default` | `Default` |
| Grouped (stacked favicons + count, disclosure list) | `chat-source-grouped` | `Grouped` |
| Show More (`maxVisible={3}` with 5 sources) | `chat-source-max-visible` | `MaxVisible` ("Show More") |
| Composable (custom trigger + custom preview, `enablePreview`) | `chat-source-composable` | `Composable` |

Demo frame: flex-centered, 40px padding, full height (story `DemoPage` mirrors it).

---

## 7. Dependencies

- Pro `HoverCard` (`../hover-card`), OSS `Disclosure` (`@heroui/react`), RAC `Button`.
- No heavy peers → root-exportable.

## 8. Deviations

- Extra `data-slot` attributes on parts Pro renders without one (`chat-sources-trigger-label`,
  `chat-sources-content-body`, `chat-source-preview-link|header|domain|title|description`,
  `chat-source-icon-fallback`).
- The document glyph carries `aria-hidden="true"`.
- Domain strips a leading `www.` (Pro demos never use `www.`, so not observable).

## 9. Independent review (parity check)

All four demos compared against the stories in light and dark (colours normalised to sRGB):
static metrics, chip hover (bg `default` -> `default-hover`, 150ms), preview box (320x124, 16px
padding, 6px gaps), grouped trigger hover/expand (150ms height/opacity, chevron), "+N more" toggle
rest/hover/pressed/expanded/focus, keyboard (Tab/Enter/Space/Escape) and focus rings all match;
the only residue is a 1-unit rounding in `--border` and text-width differences from story copy.
Preview timing: pointer -> mount 160-165ms (Pro) vs 167-168ms (Storybook dev build), leave -> exit
4-5ms vs ~11ms; the enter (150ms) and exit (100ms) keyframe animations are identical, so the
earlier "113ms exit" was React dev-build overhead, not a style difference. Theme check: `--radius`
(preview 16px -> 32px), `--accent` (focus ring) and `--font-sans` are all followed.

---

## Appendix: CSSOM (components layer, reference only)

```
.chat-source, .chat-source__trigger, .chat-source .hover-card__trigger { height: 24px; align-items: center; max-width: 100%; display: inline-flex; }
.chat-source__trigger-link { height: 24px; align-items: center; gap: 4px; border: 1px var(--border); background-color: var(--default); max-width: 100%; font-size: var(--text-xs); white-space: nowrap; transition-property: colors; duration .15s; border-radius: full; padding-inline: 4px 8px; text-decoration-line: none; display: inline-flex; color: foreground 86% }
@media (hover: hover) { .chat-source__trigger-link:hover { background-color: var(--default-hover); } }
.chat-source__trigger-link:is(:focus-visible:not([data-focused]), [data-focus-visible="true"]) { focus ring }
.chat-source__icon, .chat-source__document-icon { 16px; object-fit: contain; flex-shrink: 0; }
.chat-source__document-icon { color: var(--muted); }
.chat-source__icon-fallback { 16px; background-color: var(--default); 10px/1 medium; color: var(--muted); uppercase; rounded-full; inline-flex centered }
.chat-source__trigger-link .chat-source__icon-fallback { background-color: var(--surface); }
.chat-source__title { truncate; text-align: start; font-weight: normal; min-width: 0 }
.chat-source__preview { width: 320px; }
.chat-source__preview-link { gap: 6px; flex-direction: column; text-decoration-line: none; display: flex; }
.chat-source__preview-header { align-items: center; gap: 6px; display: flex; }
.chat-source__preview-domain { truncate; text-sm; color: var(--foreground) }
.chat-source__preview-title { line-clamp 2; text-sm; medium }
.chat-source__preview-description { line-clamp 2; text-sm; color: var(--muted) }
.chat-sources, .chat-sources [data-slot="disclosure-heading"] { width: 100%; }
.chat-sources__trigger { height: auto; min-height: 32px; inline-flex; gap 8px; width: fit-content; padding: 4px 0; text-start; text-xs; medium; color: var(--muted) }
@media (hover: hover) { .chat-sources__trigger:hover { color: var(--foreground); } }
.chat-sources__trigger { transition: color .1s var(--ease-out); }
.chat-sources .chat-sources__content { transition: height .15s var(--ease-out-quad), opacity .15s var(--ease-out); }
.chat-sources__indicator { 14px; color: var(--muted); flex-shrink: 0; }
.chat-sources [data-slot="disclosure-indicator"] { transition-duration: .15s; }
@media (prefers-reduced-motion: reduce) { .chat-sources .chat-sources__content, .chat-sources [data-slot="disclosure-indicator"] { transition: none; } }
.chat-sources__content { border-top: 0 var(--separator); } [data-expanded="true"] { border-top-width: 1px; }
.chat-sources__content-body { padding-top: 8px; }
.chat-sources__list { align-items: center; gap: 8px; flex-wrap: wrap; display: flex; }
.chat-sources__toggle { 24px; border 1px var(--border); padding-inline: 8px; text-xs; nowrap; color: var(--muted); transition colors .15s; cursor: var(--cursor-interactive); tap-highlight transparent; bg transparent; rounded-full; shrink-0; inline-flex }
.chat-sources__toggle-hidden-text { sr-only }
.chat-sources__toggle[data-hovered="true"] { background-color: var(--default-hover); color: var(--foreground); }
.chat-sources__toggle[data-focus-visible="true"] { focus ring }
.chat-sources__trigger-label { align-items: center; gap: 8px; min-width: 0; display: inline-flex; }
```
