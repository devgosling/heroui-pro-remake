# Empty State (`empty-state`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/empty-state, plus rendered DOM, CSSOM and
computed styles of the public demo pages (light + dark), observed on 2026-11-24. No paywalled source was read.

## 1. Purpose

Centered placeholder for empty lists, search results and first-run screens: optional media (icon circle, avatar,
avatar stack), a title, a description and an optional action row. Pure layout component: no state, no keyboard
behaviour, no animations (interactive children are ordinary OSS Buttons).

Exported from the package root (`import {EmptyState} from "@heroui/pro"`): no optional peers.

## 2. Relation to the OSS EmptyState

`@heroui/react` already exports a single-part `EmptyState` (`<div class="empty-state" data-slot="empty-state">`, default
children "No results found") styled by `@heroui/styles` as `.empty-state { p-2 text-sm text-muted }`. It is used as the
placeholder of ListBox / Autocomplete / Table.

Pro is a **separate compound component that shares the same block class**. The Pro CSS bundle keeps the OSS rule and
only adds to it (both rules are in `@layer components`, Pro is loaded after OSS):

- `.empty-state` gains `display:flex; flex-direction:column; align-items:center; text-align:center` (no padding).
- padding + gap only come from the size modifiers, which the Pro root always renders (`empty-state--md` by default).

So the root inherits `font-size: text-sm` and `color: muted` from the OSS rule, and the OSS rule's `p-2` is overridden
by `.empty-state--{size}` (same specificity, later order). Side effect (same as real Pro): once the Pro CSS is loaded, a
bare OSS `.empty-state` is a centered flex column (still `p-2`).

Implementation therefore does NOT follow the usual "base carries md defaults" pattern: the md spacing lives on
`.empty-state--md` so the bare block keeps its OSS padding. Title/description/media size rules are descendant selectors
of the size modifier, exactly like Pro, so CSS written against Pro keeps working.

## 3. Anatomy

```tsx
<EmptyState size="md">
  <EmptyState.Header>
    <EmptyState.Media variant="icon">{/* svg */}</EmptyState.Media> {/* optional */}
    <EmptyState.Title>...</EmptyState.Title>
    <EmptyState.Description>...</EmptyState.Description>
  </EmptyState.Header>
  <EmptyState.Content>{/* buttons */}</EmptyState.Content>       {/* optional */}
</EmptyState>
```

| Part | Element | `data-slot` | BEM class | Notes |
| --- | --- | --- | --- | --- |
| Root `EmptyState` | `<div>` (or `render`) | `empty-state` | `.empty-state .empty-state--{sm\|md\|lg}` + className | no data-* state attributes |
| `EmptyState.Header` | `<div>` | `empty-state-header` | `.empty-state__header` | |
| `EmptyState.Media` | `<div data-variant="default\|icon">` | `empty-state-media` | `.empty-state__media` | `data-variant` always rendered (`default` when omitted) |
| `EmptyState.Title` | `<h3>` | `empty-state-title` | `.empty-state__title` | |
| `EmptyState.Description` | `<p>` | `empty-state-description` | `.empty-state__description` | |
| `EmptyState.Content` | `<div>` | `empty-state-content` | `.empty-state__content` | demos add `flex-row gap-2` for a horizontal button row |

Observed markup (default demo, ids stripped):

```html
<div class="empty-state empty-state--md" data-slot="empty-state">
  <div class="empty-state__header" data-slot="empty-state-header">
    <div class="empty-state__media" data-slot="empty-state-media" data-variant="icon"><svg width="16" height="16" viewBox="0 0 16 16">...</svg></div>
    <h3 class="empty-state__title" data-slot="empty-state-title">...</h3>
    <p class="empty-state__description" data-slot="empty-state-description">...</p>
  </div>
  <div class="empty-state__content flex-row gap-2" data-slot="empty-state-content">
    <button data-slot="button" class="button button--md button--primary" ...>...</button>
    <button data-slot="button" class="button button--md button--outline" ...>...</button>
  </div>
</div>
```

## 4. API (docs tables)

| Component | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| EmptyState | `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | padding + gap, media/title scale |
| EmptyState | `children`, `className` | | | |
| EmptyState | `render` | `DOMRenderFunction` | | replaces the default `div` (OSS `dom.div` helper from `@heroui/react`) |
| EmptyState | native `div` attributes | | | |
| EmptyState.Header | `children` + native `div` attributes | | | |
| EmptyState.Media | `variant` | `'default' \| 'icon'` | `'default'` | `icon` = circular `bg-default` background |
| EmptyState.Media | `children` + native `div` attributes | | | |
| EmptyState.Title | `children` + native `h3` attributes | | | |
| EmptyState.Description | `children` + native `p` attributes | | | |
| EmptyState.Content | `children` + native `div` attributes | | | |

Docs list no CSS variables.

## 5. Styling (observed values -> tokens)

| Selector | Observed | Authored as |
| --- | --- | --- |
| `.empty-state` (OSS, kept) | padding 8px, 14px/20px, color `--muted` | untouched |
| `.empty-state` (Pro) | flex column, items center, text-align center | `flex flex-col items-center text-center` |
| `.empty-state--sm` | gap 12px, padding 24px 16px | `gap-3 px-4 py-6` |
| `.empty-state--md` | gap 16px, padding 32px 24px | `gap-4 px-6 py-8` |
| `.empty-state--lg` | gap 20px, padding 48px 32px | `gap-5 px-8 py-12` |
| `.empty-state__header` | flex column, items center, gap 8px | `flex flex-col items-center gap-2` |
| `.empty-state__media` | flex, center, shrink-0, color `--muted` | `flex shrink-0 items-center justify-center text-muted` |
| `.empty-state__media[data-variant="icon"]` | bg `--default`, color `--foreground`, radius full | `rounded-full bg-default text-foreground` |
| icon media size sm / md / lg | 40 / 48 / 56 px; svg 16 / 20 / 24 px | `size-10/12/14`; `svg:not([data-slot="spinner"] svg)` `size-4/5/6` |
| `.empty-state__title` | 600, color `--foreground` | `font-semibold text-foreground` |
| title sm / md / lg | 14/20, 16/24, 18/28 | `text-sm` / `text-base` / `text-lg` (descendant of size modifier) |
| `.empty-state__description` | 14/20, `--muted` | `text-sm text-muted` |
| description sm | 12/16 | `text-xs` |
| `.empty-state__content` | flex column, items center, gap 8px | `flex flex-col items-center gap-2` |

Dark mode: everything is token based; verified the dark demo values equal `--muted`, `--foreground`, `--default`,
`--surface-secondary`, `--surface-tertiary`, `--border` of the dark theme. No hover/focus/disabled/motion styles on the
component itself (buttons bring their own).

Measured (md, 420px demo wrapper): root height 248 = 32 + header 128 (48 media + 8 + 24 title + 8 + 40 description) +
16 + 40 button row + 32. Sizes demo (300px dashed boxes): sm root 204, md 268, lg 320 - our stories measure the same.

## 6. Demos (all reproduced as stories, own texts)

| Demo | Story | Structure |
| --- | --- | --- |
| empty-state-default (Usage) | `Default` | `w-[420px]`; icon media; Content `flex-row gap-2` with primary + outline md buttons |
| empty-state-outline | `Outline` | root `rounded-2xl border border-dashed border-border`; single sm outline button |
| empty-state-sizes | `Sizes` | three 300px dashed boxes labelled sm/md/lg (`text-xs text-muted`), root + buttons use the same size |
| empty-state-minimal | `Minimal` | header with title + description only |
| empty-state-with-avatar | `WithAvatar` | default media with `Badge.Anchor` > `Avatar size-12` with an `Avatar.Image` photo + `Badge` danger, bottom-right, sm, `right-1 bottom-0.5 size-3 min-h-3 min-w-3`; secondary md button |
| empty-state-with-avatar-group | `WithAvatarGroup` | default media with `flex -space-x-2` of three `Avatar ring-2 ring-background` images; one-line description (root 216px tall at 399px); sm primary button with leading icon |
| empty-state-with-background | `WithBackground` | root `rounded-2xl bg-surface-secondary`; icon media `border bg-surface-tertiary`; description `max-w-xs text-pretty`; md outline button |
| empty-state-full-height | `FullHeight` | 500x400 dashed flex-centered wrapper; description `max-w-xs text-pretty`; sm outline button |

## 7. Dependencies

- `@heroui/react`: `dom` + `DOMRenderProps` (render prop); stories use `Button`, `Avatar`, `Badge`.
- `@iconify/react` gravity-ui icons in stories only. Avatar images in stories use the public HeroUI asset CDN already
  used by the OSS stories in this repo.

## 8. Deviations / notes

- Md spacing lives on `.empty-state--md` instead of the base class (see section 2), intentionally mirroring Pro so the
  OSS `.empty-state` padding stays intact.
- Name overlap with OSS: both packages export `EmptyState` / `EmptyStateRoot` / `emptyStateVariants`; import one of them
  under an alias when both are needed in a module (same as with the real Pro package).

## Appendix: raw CSSOM (reference only, `@layer components`)

```
.empty-state { padding: calc(var(--spacing) * 2); font-size: var(--text-sm); color: var(--muted); }          /* OSS */
.empty-state { text-align: center; flex-direction: column; align-items: center; display: flex; }            /* Pro */
.empty-state--sm { gap: calc(var(--spacing) * 3); padding-inline: calc(var(--spacing) * 4); padding-block: calc(var(--spacing) * 6); }
.empty-state--md { gap: calc(var(--spacing) * 4); padding-inline: calc(var(--spacing) * 6); padding-block: calc(var(--spacing) * 8); }
.empty-state--lg { gap: calc(var(--spacing) * 5); padding-inline: calc(var(--spacing) * 8); padding-block: calc(var(--spacing) * 12); }
.empty-state__header { align-items: center; gap: calc(var(--spacing) * 2); flex-direction: column; display: flex; }
.empty-state__media { color: var(--muted); flex-shrink: 0; justify-content: center; align-items: center; display: flex; }
.empty-state__media[data-variant="icon"] { background-color: var(--default); color: var(--foreground); border-radius: infinity; }
.empty-state--{sm|md|lg} .empty-state__media[data-variant="icon"] { width/height: spacing * 10 | 12 | 14 }
.empty-state--{sm|md|lg} .empty-state__media[data-variant="icon"] svg:not([data-slot="spinner"] svg) { width/height: spacing * 4 | 5 | 6 }
.empty-state__title { font-weight: var(--font-weight-semibold); color: var(--foreground); }
.empty-state--{sm|md|lg} .empty-state__title { font-size: text-sm | text-base | text-lg }
.empty-state__description { font-size: var(--text-sm); color: var(--muted); }
.empty-state--sm .empty-state__description { font-size: var(--text-xs); }
.empty-state__content { align-items: center; gap: calc(var(--spacing) * 2); flex-direction: column; display: flex; }
```

## Review log (2026-11-25)

Independent re-measurement of all 8 demos (light + dark) against the stories at the same container width: every
part's box, padding, gap, typography, colours, borders and radii match. CSSOM re-read and identical to the appendix.
Theme check: `--radius`, `--font-sans`, `--spacing`, `--muted`, `--default`, `--foreground` and
`--surface-secondary` overrides all propagate. Story fixes: `WithAvatar` now shows an avatar photo (Pro shows an image,
not initials) and the `WithAvatarGroup` description fits on one line like the demo.
