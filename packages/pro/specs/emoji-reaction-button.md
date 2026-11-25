# Emoji Reaction Button: clean-room implementation spec

Slug: `emoji-reaction-button` · Docs: https://heroui.pro/docs/react/components/emoji-reaction-button · Category: Feedback
Storybook title: `Pro/Feedback/EmojiReactionButton`
Import (Pro): `import {EmojiReactionButton} from "@heroui-pro/react";`. It is a **root export**: it only depends on
React Aria Components, so it has no heavy optional peer.

Sources used: the public docs text, the rendered DOM and CSSOM of the 4 public demo pages (light and dark), computed
styles, theme tokens, runtime probing (synthetic pointer and keyboard events, a MutationObserver, `getAnimations()`),
and the OSS `react-aria-components` 1.22.1 / `react-stately` packages in this repo. I did not open the paywalled example
source and did not try to get around it.

---

## 1. Purpose

A pill-shaped toggle that shows an emoji and a reaction count, as used for message and post reactions. Selected
means "I reacted": the pill gets an accent tint, an accent border and an accent count.

## 2. Anatomy

```tsx
<EmojiReactionButton>            // RAC ToggleButton (<button aria-pressed>)
  <EmojiReactionButton.Emoji />  // <span>
  <EmojiReactionButton.Count />  // <span>
</EmojiReactionButton>
```

| Part | Element | `data-slot` | BEM class(es) | Primitive |
|---|---|---|---|---|
| Root | `<button type="button" data-rac aria-pressed>` | `emoji-reaction-button` | `emoji-reaction-button emoji-reaction-button--{sm,md,lg}` | RAC `ToggleButton` |
| Emoji | `<span>` | `emoji-reaction-button-emoji` | `emoji-reaction-button__emoji` | none |
| Count | `<span>` | `emoji-reaction-button-count` | `emoji-reaction-button__count` | none |

- The size modifier is **always** rendered on the root, `--md` included. The parts have no size modifiers: they inherit
  the font size from the root.
- No OSS HeroUI component is used: there is no `.button` class. This is a bare RAC `ToggleButton`.
- **No Number Flow.** The count is a plain text node, and a toggle changes it in place (MutationObserver:
  `characterData`). No animation library, no keyframes, no WAAPI animations.
- There is no `aria-label`. The accessible name comes from the content, for example "🎉 1".

### Rendered DOM (default demo, first item, attributes in Pro's order)

```html
<button data-slot="emoji-reaction-button" class="emoji-reaction-button emoji-reaction-button--md" data-rac=""
        type="button" tabindex="0" data-react-aria-pressable="true" aria-pressed="true" data-selected="true">
  <span class="emoji-reaction-button__emoji" data-slot="emoji-reaction-button-emoji">…</span>
  <span class="emoji-reaction-button__count" data-slot="emoji-reaction-button-count">12</span>
</button>
```

Read-only: `data-readonly="true"` comes **first** (before `data-slot`) and `tabindex="-1"`. There is no `aria-readonly`
and no `aria-disabled`.
Disabled: the native `disabled=""` attribute plus `data-disabled="true"`, set by RAC.

## 3. API (from the docs tables)

### `EmojiReactionButton` (root, "Wraps RAC ToggleButton")

| Prop | Type | Default | Notes |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `isSelected` | `boolean` | | controlled |
| `defaultSelected` | `boolean` | | uncontrolled |
| `onChange` | `(isSelected: boolean) => void` | | |
| `isReadOnly` | `boolean` | | not part of RAC `ToggleButtonProps` |
| `isDisabled` | `boolean` | | |
| `children` | `ReactNode \| (renderProps) => ReactNode` | | RAC render props (`isSelected`, `isPressed`, `isHovered`, ...) |

Plus all RAC ToggleButton props (`className` / `style` render props, `excludeFromTabOrder`, `autoFocus`, press, hover
and focus events, `aria-*`, ...).

### `EmojiReactionButton.Emoji` / `EmojiReactionButton.Count`

Native `span` attributes only.

## 4. Styling (CSSOM, `@layer components`)

Theme tokens, observed in light and dark: `--default` (rest background), `--accent` (selected tint, border and count),
`--muted` (count), `--focus` + `--background` (ring), `--disabled-opacity` (.5), `--cursor-interactive` (pointer),
`--cursor-disabled` (not-allowed), `--ease-smooth` (`ease`) and `--ease-out` (`cubic-bezier(0,0,.2,1)`).
Dark mode is token-only: no `.dark` rules exist. Our OSS theme resolves every one of these tokens to the same values.

| Selector | Tailwind equivalent / value |
|---|---|
| `.emoji-reaction-button` | `inline-flex items-center gap-1.5 rounded-full border border-transparent bg-default outline-none select-none no-highlight transform-gpu`, `cursor: var(--cursor-interactive)` |
| transition | `transform 200ms var(--ease-smooth), background-color 100ms var(--ease-out), border-color 100ms var(--ease-out), box-shadow 100ms var(--ease-out)` + `motion-reduce:transition-none` |
| `[data-selected="true"]` | `border-accent/30 bg-accent/10` (Tailwind color-mix with an `@supports` fallback) |
| `@media (hover:hover)` `:hover, [data-hovered="true"]` | `bg-default` (the **same** as the rest state, so an unselected pill does not change visibly) |
| `@media (hover:hover)` selected + hover | `bg-accent/15` |
| `:focus-visible:not([data-focused]), [data-focus-visible="true"]` | `status-focused` (2px ring `--focus`, 2px offset `--background`) |
| `:active, [data-pressed="true"]` | `transform: scale(0.95)` |
| `[data-readonly="true"]` | `pointer-events-none cursor-default`; with `:active` / `[data-pressed]`: `transform: none` |
| `:disabled, [aria-disabled="true"]` | `status-disabled` |
| `--sm` | `px-1.5 py-1 text-xs` |
| `--md` | `px-1.5 py-1 text-sm` |
| `--lg` | `px-2.5 py-1.5 text-base` |
| `__emoji` | `leading-none` |
| `__count` | `leading-none font-medium text-muted tabular-nums` |
| `[data-selected="true"] > .emoji-reaction-button__count` | `text-accent` |

The root does not set `color`: it inherits from the page. Emoji glyphs are colour fonts, and the count has its own
colour.

### Measured metrics (Inter, both themes)

| Size | Height | Padding | Font / line-height | Gap | Emoji box | Count box ("5") | Pill width (2-digit count / 1 digit) |
|---|---|---|---|---|---|---|---|
| sm | 22px | 4px 6px | 12px / 16px | 6px | 16.48×12 | 7.78×12 | 44.27 |
| md | 24px | 4px 6px | 14px / 20px | 6px | 19.23×14 | 9.08×14 | 57.39 / 48.31 |
| lg | 30px | 6px 10px | 16px / 24px | 6px | 21.97×16 | 10.38×16 | 60.34 |

Height = 1em of content (`leading-none` items) + vertical padding + a 1px transparent border on each side.

## 5. Behaviour and timings

- Toggle with a click, Enter or Space (RAC `useToggleButton`). `aria-pressed` and `data-selected` follow the state.
- Press: `data-pressed="true"` on pointerdown or keydown, which runs the `transform` transition `translateZ(0) →
  scale(0.95)`, 200ms, `ease`. Release goes back the same way. On toggle, the background and border colours move over
  100ms `ease-out`. The focus ring (box-shadow) also uses 100ms `ease-out`.
- There is **no burst or pop animation** on the emoji: no `@keyframes` and no WAAPI animation at any time during or
  after a toggle (sampled every 5ms for 800ms).
- Read-only: presses still set `data-pressed` (with no visual scale), but the selection never changes, from the pointer
  or the keyboard. The pill is out of the tab order (`tabindex=-1`), and `pointer-events: none` blocks the mouse.
  This is how React Stately `useToggleState({isReadOnly})` behaves, plus `excludeFromTabOrder`.
- Disabled: native `disabled`, `data-disabled`, opacity .5, `not-allowed` cursor, no pointer events.
- Hover: RAC `data-hovered` (mouse only).

## 6. Demo pages (4)

| Demo | Structure | Behaviour |
|---|---|---|
| `emoji-reaction-button-default` (Usage) | `div.flex.flex-wrap.items-center.gap-2` with 5 md pills, the first selected | controlled: a toggle adds or removes 1 from that pill's count |
| `emoji-reaction-button-sizes` | `div.flex.flex-col.items-start.gap-4`; 3 rows `div.flex.items-center.gap-3` holding a label `span.text-muted.w-8.text-xs.font-medium` ("sm"/"md"/"lg") and `div.flex.items-center.gap-2` with 3 pills | the first pill is `isSelected` (fixed), the other two are uncontrolled and toggle without changing the count |
| `emoji-reaction-button-disabled` | `div.flex.items-center.gap-2` with 2 disabled pills (selected + unselected) | none |
| `emoji-reaction-button-read-only` | `div.flex.items-center.gap-2` with 2 read-only pills (selected + unselected) | none |

## 7. Implementation notes (this repo)

- `src/components/emoji-reaction-button/emoji-reaction-button.tsx`: the Root is RAC `ToggleButton` with `data-slot`
  and `data-readonly`. `isReadOnly` goes to React Stately at runtime (RAC passes its props to `useToggleState`, which
  honours `isReadOnly`, although the type does not declare it). `excludeFromTabOrder` defaults to `isReadOnly`.
  Emoji and Count are spans that read the slots from context, with a size-independent default when used outside a root.
- `emoji-reaction-button.styles.ts`: `tv()` slots `base`, `emoji` and `count`, with a `size` variant on `base` only.
- `css/components/emoji-reaction-button.css`: the base class carries the md defaults and `--md` is empty. `--sm` only
  changes the type. The hover rules sit inside `@media (hover: hover)`, with motion-reduce after the transition.
- Root export: yes (no heavy peer).
- Stories: `Default`, `Sizes`, `Disabled`, `ReadOnly`, with the same structure as the Pro demos and different
  emojis and counts. As in Pro, the selected pill of `Default`, `Disabled` and `ReadOnly` shows a two-digit count (so
  it is the wider 57.39px pill) and every other pill a one-digit count. Pro's own Storybook
  (`pro-components-emojireactionbutton--*`) has the same four stories and nothing more.

## 8. Verification (Storybook vs Pro demos)

- Sizes: the pill, emoji and count boxes match to 0.02px (sm 44.27×22, md 48.31×24, lg 60.33×30). Padding, gap,
  font size, line-height, weight and `tabular-nums` are identical.
- Colours: selected `oklab(accent / .1)` background and `oklab(accent / .3)` border; unselected `--default`; the count
  is `--muted` or `--accent`. The same holds in dark mode.
- Transitions: the same properties, durations and easings (`getAnimations()`), and the same `translateZ(0) →
  scale(0.95)` keyframes.
- Read-only: the same MutationObserver log as Pro for Enter and a click (only `data-pressed` flips; no selection
  change), plus `tabindex=-1`, `pointer-events:none` and `cursor:default`.
- Disabled: `disabled`, `data-disabled`, opacity .5, `not-allowed`.
- Focus ring: a 2px `--background` offset plus a 2px `--focus` ring.

## 9. Deviations

- None intended. The only difference is the Storybook environment: its body does not set `text-foreground`, so the
  inherited root `color` is black there and the foreground colour on heroui.pro. The component inherits colour in both
  places, and nothing visible depends on it (emoji glyphs and the count have their own colours).
