# Prompt Suggestion - analysis spec

Source: public docs page `https://heroui.pro/docs/react/components/prompt-suggestion` and its two live demos
(`prompt-suggestion-default`, `prompt-suggestion-cards`), inspected in light and dark theme (rendered DOM,
CSSOM, computed styles, pointer behaviour). Pro Storybook index lists the same two stories
(`Default`, `Cards`). No source code was accessed.

Storybook title here: `Pro/AI/PromptSuggestion` (Pro: `Pro Components/AI/PromptSuggestion`).

> Suggested prompts and starter actions for AI chat empty states.

## Anatomy

```tsx
<PromptSuggestion variant="pill | card">
  <PromptSuggestion.Header>                 {/* optional */}
    <PromptSuggestion.Title />               {/* h2 */}
    <PromptSuggestion.Description />         {/* p, optional */}
  </PromptSuggestion.Header>
  <PromptSuggestion.Group label description> {/* optional, section + h3 */}
    <PromptSuggestion.Items>
      <PromptSuggestion.Item href? showEndIcon?>
        {/* pill: plain text (wrapped in __item-label) + hover arrow */}
        {/* card: */}
        <PromptSuggestion.ItemHeader>
          <PromptSuggestion.ItemTitle />
          <PromptSuggestion.ItemDescription />
        </PromptSuggestion.ItemHeader>
        <PromptSuggestion.ItemFooter>
          <PromptSuggestion.ItemTags>{/* Chips */}</PromptSuggestion.ItemTags>
          <PromptSuggestion.ItemMeta />
        </PromptSuggestion.ItemFooter>
      </PromptSuggestion.Item>
    </PromptSuggestion.Items>
  </PromptSuggestion.Group>
</PromptSuggestion>
```

### Rendered DOM (observed)

Pill (default):

```html
<div class="prompt-suggestion prompt-suggestion--pill" data-slot="prompt-suggestion">
  <div class="prompt-suggestion__header" data-slot="prompt-suggestion-header">
    <h2 class="prompt-suggestion__title" data-slot="prompt-suggestion-title">...</h2>
    <p class="prompt-suggestion__description" data-slot="prompt-suggestion-description">...</p>
  </div>
  <div class="prompt-suggestion__items prompt-suggestion__items--pill" data-slot="prompt-suggestion-items">
    <!-- RAC Button: data-rac, type=button, data-react-aria-pressable, data-hovered/pressed/focused/focus-visible -->
    <button class="prompt-suggestion__item prompt-suggestion__item--pill" data-slot="prompt-suggestion-item">
      <span class="prompt-suggestion__item-label">Text</span>
      <svg class="prompt-suggestion__item-end-icon" width=16 height=16 viewBox="0 0 16 16"><!-- chevron right --></svg>
    </button>
  </div>
</div>
```

Card:

```html
<div class="prompt-suggestion prompt-suggestion--card" data-slot="prompt-suggestion">
  <div class="prompt-suggestion__header">...</div>
  <section class="prompt-suggestion__group" data-slot="prompt-suggestion-group">
    <div class="prompt-suggestion__group-header">
      <h3 class="prompt-suggestion__group-label">At work</h3>
      <p class="prompt-suggestion__group-description">...</p>
    </div>
    <div class="prompt-suggestion__items prompt-suggestion__items--card" data-slot="prompt-suggestion-items">
      <button class="card card--default prompt-suggestion__item prompt-suggestion__item--card"
              data-slot="prompt-suggestion-item" aria-labelledby="{titleId}" aria-describedby="{descId}">
        <span class="card__header" data-slot="prompt-suggestion-item-header">
          <span class="card__title" data-slot="prompt-suggestion-item-title" id="{titleId}">...</span>
          <span class="card__description prompt-suggestion__item-description" data-slot="card-description" id="{descId}">...</span>
        </span>
      </button>
    </div>
  </section>
</div>
```

Notes:
- The item is a React Aria `Button` (or `Link` when `href` is set). It does NOT carry the OSS `.button` class.
- Card items reuse the OSS Card BEM classes (`card card--default`, `card__header`, `card__title`,
  `card__description`). The title/description ids come from two `useId` calls inside the item and are wired
  to `aria-labelledby` / `aria-describedby` on the button.
- ItemDescription keeps the OSS `data-slot="card-description"`; header/title use `prompt-suggestion-item-*`.
- Group header / label / description, item label and end icon have no `data-slot` in Pro (we add them - harmless).
- The end icon is a 16px chevron-right (same glyph as OSS `IconChevronRight`).

## API

| Part | Element | Props |
| --- | --- | --- |
| `PromptSuggestion` (Root) | `div` | `variant?: "pill" \| "card"` (default `"pill"`), native div props |
| `Header` / `Title` / `Description` | `div` / `h2` / `p` | native props |
| `Group` | `section` | `label?: ReactNode` (rendered as `h3`), `description?: ReactNode`, native section props |
| `Items` | `div` | native div props |
| `Item` | RAC `Button` / RAC `Link` | RAC Button props, or Link props when `href` set; `showEndIcon?: boolean` (default `true`, pill only) |
| `ItemHeader`, `ItemTitle`, `ItemDescription`, `ItemMeta`, `ItemTags`, `ItemFooter` | `span` | native span props |

"Card items render as a button or link, so don't put buttons or links inside them." -> all item parts are spans.

## Styling (CSSOM, mapped to tokens)

| Class | Styles |
| --- | --- |
| `.prompt-suggestion` | `flex flex-col w-full gap-8` |
| `--pill` / `--card` | no own rules (hooks only) |
| `__header` | `flex flex-col gap-2` |
| `__title` | `text-2xl font-semibold tracking-tight text-foreground` (24/32, -0.6px) |
| `__description` | `max-w-[640px] text-sm text-muted` |
| `__group` | `flex flex-col gap-3` |
| `__group-header` | `flex flex-col gap-1` |
| `__group-label` | `text-lg font-semibold text-foreground` |
| `__group-description` | `text-sm text-muted` |
| `__items--pill` | `grid w-full grid-cols-1 auto-rows-auto gap-2`, `sm:grid-cols-2` |
| `__items--card` | `grid grid-cols-1 auto-rows-auto gap-3`, `sm:grid-cols-2`, `lg:grid-cols-3`; `> * { height: 100% }` |
| `__item--pill` | `flex items-start justify-between gap-3 w-full h-auto min-h-0 rounded-2xl border border-border bg-transparent px-4 py-3 text-start text-sm leading-snug whitespace-normal text-foreground outline-none no-highlight`; hover (media hover) `bg-default/40` |
| `__item--card` | `rounded-2xl w-full h-full text-start outline-none no-highlight` on top of `.card.card--default` (`p-4 gap-3 bg-surface shadow-surface`); hover `bg-surface-secondary` |
| both items | `transition: transform 250ms ease-smooth, background-color 100ms ease-out, box-shadow 100ms ease-out; transform-gpu; cursor: var(--cursor-interactive)`; focus-visible -> focus ring (`status-focused`); `:active/[data-pressed]` -> `scale(0.97)` + will-change transform; `:disabled/[aria-disabled]` -> `status-disabled`; `motion-reduce:transition-none` |
| `__item-label` | `flex min-w-0 items-center text-pretty` |
| `__item-end-icon` | `mt-0.5 size-4 shrink-0 text-muted opacity-0 transition-opacity` (150ms), visible on item hover (`:hover` / `[data-hovered]`, inside `@media (hover: hover)`), mirrored in RTL |
| `__item-description` | `text-sm` (on top of `card__description`: muted, leading-5) |
| `__item-footer` | `flex items-center justify-between mt-auto pt-0` |
| `__item-tags` | `flex flex-wrap gap-1.5` |
| `__item-meta` | `text-xs text-muted` |

Measured (light, 384px wide container):
- Pill item: 1px border `--border`, radius 16px (`--radius * 2`), padding 12px 16px, text 14px / 19.25px (snug),
  single line height 45.25px, two lines 64.5px; end icon 16x16 at top + 2px, right aligned; label `text-wrap: pretty`.
- Card item: padding 16px, radius 16px, bg `--surface`, `shadow-surface` (transparent in dark), title 14px/24px 500,
  description 14px/20px muted; single-line card height 76px.
- Root gap 32px, header gap 8px, group gap 12px, group header gap 4px.

Dark mode: all colours come from tokens (`--border`, `--default`, `--surface`, `--surface-secondary`, `--muted`,
`--foreground`); nothing component specific.

## Behaviour

- RAC Button press: `data-pressed` toggles on pointer down/up -> scale 0.97 (250ms ease). `data-hovered` on hover
  (pill bg `default/40` + arrow fades in over 150ms; card bg `surface-secondary`). `data-focused`,
  `data-focus-visible` -> 2px focus ring with ring offset `--ring-offset-width` on `--background`.
- Keyboard: every item is a tab stop (native button / link), Enter/Space activate (`onPress`).
- No roving focus, no selection state, no animations besides transitions.

## Demos

1. **Default** (pill): container `max-w-[714px]`, header title + description, 6 pill items (1 column below 640px,
   2 columns from `sm`).
2. **Cards** (`variant="card"`): container `max-w-[960px]`, header, one group with label + description and three card
   items (title + description); 1 / 2 / 3 columns at base / `sm` / `lg`.

Demo page wrapper: full width, `flex min-h-screen items-center justify-center p-6 sm:p-10` (24px padding, 40px from
640px), background `--background`.

Breakpoint layouts were measured by loading the demos in 630 / 650 / 800 / 1100px wide iframes: pills go to 2 columns
of 353px at 800px; cards go to 2 columns at 800px and 3 x 312px at 1100px, and every item in a row gets the same
height (cards via `h-full`, pills via grid stretch).

## Dependencies

- `react-aria-components` Button / Link.
- `@heroui/react`: `cardVariants` (OSS Card BEM classes), `SurfaceContext` (card items act as a default surface like
  the OSS Card), `IconChevronRight`.
- Stories: OSS `Chip` for item tags, `@iconify/react` gravity-ui icons.

## Implementation notes / deviations

- `ItemHeader`/`ItemTitle`/`ItemDescription` render the same `card__*` classes in both variants (Pro anatomy shows them
  inside the default pill; only the card variant could be observed).
- `ItemFooter` renders `card__footer prompt-suggestion__item-footer` (Pro documents only the latter; the OSS
  `card__footer` rules are compatible: `flex flex-row items-center`).
- `aria-labelledby` / `aria-describedby` are only set when an `ItemTitle` / `ItemDescription` is actually mounted.
- The end icon adds `aria-hidden` (OSS icon) - Pro's svg has no aria attributes.

## Appendix - raw CSSOM (reference only, `@layer components`)

```
.prompt-suggestion { gap: calc(var(--spacing) * 8); flex-direction: column; width: 100%; display: flex; }
.prompt-suggestion__header { gap: calc(var(--spacing) * 2); flex-direction: column; display: flex; }
.prompt-suggestion__title { font-size: var(--text-2xl); line-height: var(--tw-leading,var(--text-2xl--line-height)); font-weight: var(--font-weight-semibold); letter-spacing: var(--tracking-tight); color: var(--foreground); }
.prompt-suggestion__description { max-width: 640px; font-size: var(--text-sm); color: var(--muted); }
.prompt-suggestion__group { gap: calc(var(--spacing) * 3); flex-direction: column; display: flex; }
.prompt-suggestion__group-header { gap: var(--spacing); flex-direction: column; display: flex; }
.prompt-suggestion__group-label { font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--foreground); }
.prompt-suggestion__group-description { font-size: var(--text-sm); color: var(--muted); }
.prompt-suggestion__items--pill { gap: calc(var(--spacing) * 2); grid-template-columns: repeat(1, minmax(0px, 1fr)); grid-auto-rows: auto; width: 100%; display: grid; }
@media (min-width: 40rem) { .prompt-suggestion__items--pill { grid-template-columns: repeat(2, minmax(0px, 1fr)); } }
.prompt-suggestion__items--card { gap: calc(var(--spacing) * 3); grid-template-columns: repeat(1, minmax(0px, 1fr)); grid-auto-rows: auto; display: grid; }
@media (min-width: 40rem) { .prompt-suggestion__items--card { grid-template-columns: repeat(2, minmax(0px, 1fr)); } }
@media (min-width: 64rem) { .prompt-suggestion__items--card { grid-template-columns: repeat(3, minmax(0px, 1fr)); } }
.prompt-suggestion__items--card > * { height: 100%; }
.prompt-suggestion__item--pill { justify-content: space-between; align-items: flex-start; gap: calc(var(--spacing) * 3); border-radius: calc(var(--radius) * 2); border: 1px solid var(--border); width: 100%; height: auto; min-height: 0px; padding: calc(var(--spacing) * 3) calc(var(--spacing) * 4); text-align: start; font-size: var(--text-sm); line-height: var(--leading-snug); white-space: normal; color: var(--foreground); outline-style: none; -webkit-tap-highlight-color: transparent; background-color: transparent; display: flex; }
@media (hover: hover) { .prompt-suggestion__item--pill:hover { background-color: color-mix(in oklab, var(--default) 40%, transparent); } }
.prompt-suggestion__item--pill { transition: transform .25s var(--ease-smooth), background-color .1s var(--ease-out), box-shadow .1s var(--ease-out); transform: translateZ(0); cursor: var(--cursor-interactive); }
.prompt-suggestion__item--pill:focus-visible:not([data-focused]), .prompt-suggestion__item--pill[data-focus-visible="true"] { focus ring }
.prompt-suggestion__item--pill:active, .prompt-suggestion__item--pill[data-pressed="true"] { will-change: transform; transform: scale(0.97); }
.prompt-suggestion__item--pill:disabled, .prompt-suggestion__item--pill[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }
.prompt-suggestion__item-label { text-wrap: pretty; align-items: center; min-width: 0px; display: flex; }
.prompt-suggestion__item-end-icon { margin-top: calc(var(--spacing) * .5); width/height: calc(var(--spacing) * 4); color: var(--muted); opacity: 0; transition: opacity 150ms default-ease; flex-shrink: 0; }
@media (hover: hover) { .prompt-suggestion__item--pill:hover .prompt-suggestion__item-end-icon, .prompt-suggestion__item--pill[data-hovered="true"] .prompt-suggestion__item-end-icon { opacity: 1; } }
.prompt-suggestion__item-end-icon:is(rtl langs) { scale: -1 1; }
.prompt-suggestion__item--card { border-radius: calc(var(--radius) * 2); text-align: start; outline-style: none; -webkit-tap-highlight-color: transparent; width: 100%; height: 100%; transition: (as pill); transform: translateZ(0); cursor: var(--cursor-interactive); }
@media (hover: hover) { .prompt-suggestion__item--card:hover, .prompt-suggestion__item--card[data-hovered="true"] { background-color: var(--surface-secondary); } }
.prompt-suggestion__item--card focus / pressed / disabled: as pill
.prompt-suggestion__item-description { font-size: var(--text-sm); }
.prompt-suggestion__item-footer { justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0px; display: flex; }
.prompt-suggestion__item-tags { gap: calc(var(--spacing) * 1.5); flex-wrap: wrap; display: flex; }
.prompt-suggestion__item-meta { font-size: var(--text-xs); color: var(--muted); }
```
