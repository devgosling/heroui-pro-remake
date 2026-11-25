# Model Selector — clean-room implementation spec

Slug: `model-selector` · Docs: https://heroui.pro/docs/react/components/model-selector · Category: AI
Storybook: `Pro/AI/ModelSelector` · Import (Pro): `import {ModelSelector} from "@heroui-pro/react";`

Sources: the public docs text, the rendered DOM / CSSOM / computed styles of the four public demo
pages (light + dark), and runtime probing (pointer, keyboard, MutationObserver timings). The demo
pages were also loaded in a same-origin 1000×800 iframe so that the detail card had room to open
(the browser pane is only 407×402). I did not open or try to get around the paywalled example source.

Demos (one Storybook story each):

| Demo | URL | What it shows |
|---|---|---|
| Default | `/docs/react/demos/model-selector-default` | Inside a Prompt Input composer toolbar; selected model has 5 levels (Low…Ultra), starts on Ultra |
| Effort levels | `/docs/react/demos/model-selector-effort-levels` | Standalone; per-model levels: 5 (max+ultra), 5, 4 (max), 3 (no tone), none (slider hidden) |
| Composition | `/docs/react/demos/model-selector-composition` | `Search`, item children (price), a pricing note between list and effort, `[--model-selector-popover-width:288px]`, 5 providers |
| Controlled | `/docs/react/demos/model-selector-controlled` | `value`/`onChange` + `effort`/`onEffortChange`, a status line "Claude Opus 5.5 · High" under the trigger |

---

## 1. Anatomy

```tsx
<ModelSelector models={models}>                 // OSS Select (RAC Select), class "select select--primary model-selector"
  <ModelSelector.Trigger />                      // OSS Button ghost md
  <ModelSelector.Popover>                        // OSS Select.Popover, placement "top end"
    <ModelSelector.Search />                     // optional; OSS SearchField secondary fullWidth (+ RAC Autocomplete)
    <ModelSelector.List>                         // title <div> + OSS ListBox rendered as OSS ScrollShadow
      <ModelSelector.Group title="Anthropic">    // OSS ListBox.Section + OSS Header (sticky)
        <ModelSelector.Item model={opus} />      // OSS ListBox.Item
      </ModelSelector.Group>
    </ModelSelector.List>
    <ModelSelector.Effort />                     // optional; OSS Slider
    <ModelSelector.Detail />                     // optional; plain div beside the popover
  </ModelSelector.Popover>
</ModelSelector>
```

With no children the root renders Trigger + Popover; an empty Popover renders List + Effort + Detail
(no Search); an empty List groups the models by `provider`.

### Rendered DOM (default demo, popover open, Ultra level)

```
div.select.select--primary.model-selector[data-slot=model-selector][data-rac]
  button.button.button--md.button--ghost.model-selector__trigger[data-slot=model-selector-trigger]
        aria-label="Model, Claude Opus 5.5" aria-haspopup=listbox aria-expanded (+ data-pressed=true while open)
    span.model-selector__trigger-icon[aria-hidden]{svg logo}
    span.model-selector__trigger-name  "Opus 5.5"            (shortName)
    svg.model-selector__trigger-indicator[aria-hidden] viewBox 0 0 16 16, stroked chevron
  (RAC hidden <select>)
div.select__popover.model-selector__popover[data-slot=select-popover][data-placement=top] (portal)
  span(dismiss)
  [div.search-field.search-field--full-width.search-field--secondary.model-selector__search[data-slot=model-selector-search]
     div.search-field__group > svg.search-field__search-icon, input.search-field__input (placeholder/aria-label "Search models"), button.close-button.search-field__clear-button
   span.model-selector__search-status[role=status]  (sr-only; "No models match “q”" when empty)]
  div.model-selector__title[data-slot=model-selector-title] "Models"
  div.scroll-shadow.scroll-shadow--vertical.scroll-shadow--fade.list-box.list-box--default.model-selector__list
      [data-slot=model-selector-list][role=listbox][data-scroll-shadow-size=16][style=--scroll-shadow-size:16px]
      [data-searchable=true when Search]  [aria-label="Suggestions" when Search: RAC Autocomplete]
    section.list-box-section.model-selector__group[data-slot=model-selector-group][role=group]
      header.header.model-selector__group-title[data-slot=model-selector-group-title][role=presentation] "Anthropic"
      div.list-box-item.list-box-item--default.model-selector__item[data-slot=model-selector-item][role=option][data-key]
        span.model-selector__item-icon[aria-hidden]{svg}
        span.model-selector__item-name[slot=label]            (RAC Text slot label)
        span.chip.chip--accent.chip--sm.chip--soft[aria-hidden] > span.chip__label "New"   (only with badge)
        span.model-selector__item-description[slot=description] (sr-only)          — without item children
        | span.model-selector__item-meta[slot=description] > span.model-selector__item-description(sr-only, trailing space) + children
        span.list-box-item__indicator (OSS ListBox.ItemIndicator, checkmark)
    (empty search) div[role=option][style=display:contents] > div.model-selector__empty > p.model-selector__empty-title + p.model-selector__empty-hint
  (other popover children, e.g. <p class="text-muted px-2 pt-1 pb-2 text-xs">Price per 1M tokens…</p>)
  div.slider.model-selector__effort[data-slot=model-selector-effort][data-effort=ultra][data-tone=ultra][data-orientation=horizontal][role=group]
    div.model-selector__effort-header
      label.label.model-selector__effort-label[data-slot=model-selector-effort-label] "Effort"
      output.slider__output.model-selector__effort-value[aria-live=off] "Ultra"
    div.model-selector__effort-body
      div.slider__track.model-selector__effort-track[data-fill-start][data-fill-end]
        span.model-selector__effort-glow[aria-hidden]                         (only when a level has tone ultra)
        div.model-selector__effort-rail
          div.slider__fill.model-selector__effort-fill[style=left:0%;width:…]
            span.model-selector__effort-sheen[aria-hidden]
            span.model-selector__effort-sparks[data-layer=inner] > 10 × span.model-selector__effort-spark[data-star?][style=--_v --_delay --_life --_x]  (ultra models only)
          div.slider__steps.model-selector__effort-ticks[aria-hidden] > span.slider__step[data-filled][data-value][style=left:%]
          div.slider__thumb.model-selector__effort-thumb > (hidden input type=range aria-valuetext=<level reading> aria-describedby=<ends id>)
        span.model-selector__effort-sparks[data-layer=outer] > 16 × spark[style=--_side --_v --_delay --_life --_x]  (ultra models, showOuterSparks)
      div.model-selector__effort-ends[aria-hidden][id] > span[data-slot=model-selector-effort-end] "Faster" + "Smarter"
    div.model-selector__effort-hint[data-empty?][aria-hidden when empty]
      div.model-selector__effort-hint-content
        p.model-selector__effort-hint-body > svg.model-selector__effort-hint-icon (info) + span.model-selector__effort-hint-stack
          span.model-selector__effort-hint-text[data-active?][aria-hidden when inactive]   (one per level that has a description)
  div.model-selector__detail[aria-hidden][data-visible?][data-glide?][data-side=end|start|none]
      [style=--model-selector-detail-y; --model-selector-detail-min-y; --model-selector-detail-max-y]
    div.model-selector__detail-body[inert]                    (re-created per model → crossfade animation)
      div.model-selector__detail-header
        div.model-selector__detail-title > span.model-selector__detail-icon{svg} + span.model-selector__detail-name
        p.model-selector__detail-description
      div.model-selector__detail-ratings
        div.model-selector__detail-rating > span[data-slot=model-selector-detail-rating-label] "Intelligence" + span.model-selector__detail-dots > 5 × span.model-selector__detail-dot[data-filled?]
        div.model-selector__detail-rating … "Speed"
        p.model-selector__detail-context > strong "1M" + " context window"
```

OSS classes reused: `select`, `select__popover`, `button` (ghost/md), `search-field` (+group/input/icon/clear),
`scroll-shadow`, `list-box`, `list-box-section`, `header`, `list-box-item` (+indicator), `chip` (accent/sm/soft),
`slider` (+track/fill/steps/step/thumb/output), `label`.

---

## 2. API (docs)

### ModelSelector (root)
Extends HeroUI Select props except selection (`value/defaultValue/onChange/selectedKey/…`), `placeholder`,
and field styling props (`variant`, `fullWidth`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `models` | `ModelSelectorModel[]` | – | display order |
| `value` / `defaultValue` / `onChange` | `string` / `string` / `(value: string) => void` | first enabled model | model id |
| `effort` / `defaultEffort` / `onEffortChange` | `string` / `string` / `(effort: string) => void` | model's `defaultEffort` | `onEffortChange` fires on each slider step and when the level falls back |
| `labels` | `Partial<ModelSelectorLabels>` | – | localisation |
| `aria-label` | `string` | `labels.trigger` | first part of the trigger's spoken name ("Model, Claude Opus 5.5") |
| `isDisabled` | `boolean` | `false` | disables the trigger |
| `children` | `ReactNode` | Trigger + Popover | |

`ModelSelectorLabels = {trigger:"Model", title:"Models", searchPlaceholder:"Search models",
emptyTitle:(q)=>"No models match “q”", emptyHint:"Try a model or provider name.", effort:"Effort",
faster:"Faster", smarter:"Smarter", intelligence:"Intelligence", speed:"Speed",
rating:(v,max)=>"v of max", contextWindow:"context window"}` (defaults observed in the DOM).

### Parts
- `Trigger` — HeroUI Button, `variant="ghost" size="md"` defaults; children replace logo + name + chevron.
- `Popover` — HeroUI Select.Popover, `placement="top end"`; keeps the side it opened on (no flip while open).
- `Search` — HeroUI SearchField minus value/defaultValue/onChange; `autoFocus=true`, `variant="secondary"`,
  `fullWidth=true`, children replace the field group. Filters by model + provider name; clears on close;
  announces an empty result through a `role=status` span.
- `List` — HeroUI ListBox props + `title` (default labels.title, `null` removes). Children default to provider groups.
- `Group` — HeroUI ListBox.Section props + `title` (sticky header).
- `Item` — HeroUI ListBox.Item props + `model`; children render after the name in `.model-selector__item-meta`.
  Screen-reader description: `badge. description. Intelligence n of 5. Speed n of 5. <long compact> context window.` + item children.
- `Effort` — HeroUI Slider props minus value/defaultValue/min/max/step/orientation/formatOptions/onChange/onChangeEnd;
  `showOuterSparks=true`; `children` replaces the Faster/Smarter row (`null` removes it). Hidden for < 2 levels.
- `Detail` — native div props; `children: ({model, defaultChildren}) => ReactNode` (return null to hide).

### Model types
`ModelSelectorModel {id, name, shortName?, provider?, icon?, badge?, description?, intelligence? (1-5), speed? (1-5),
contextWindow? (tokens), efforts?: ModelSelectorEffortLevel[], defaultEffort?, isDisabled?}`;
`ModelSelectorEffortLevel {id, label, description?, tone?: "max" | "ultra"}`.

Context window formatting: `Intl.NumberFormat(locale, {notation:"compact", maximumFractionDigits:2})`
→ "1M", "1.05M", "256K" (detail) and `compactDisplay:"long"` → "1.05 million" (screen-reader text).

---

## 3. Styling (observed computed values; tokens)

Root: `inline-flex`, row, gap 0, min-w 0; `--model-selector-name-max-width:160px`.
Motion tokens on root + popover: duration 150ms, exit 100ms, crossfade 120ms, ease `cubic-bezier(.23,1,.32,1)` (= `--ease-out-quint`).

Trigger (ghost md Button): h 40 (<768px) / 36 (md+), gap 6px, padding-inline 8px start / 6px end, font-medium,
radius from `.button` (24px). Logo 16×16, name truncates at 160px, chevron 16×16 `text-muted` stroke 1.5,
`rotate .15s ease` → 180deg when `aria-expanded=true`. While open RAC sets `data-pressed` → `--button-bg-pressed`
(default) fill; Pro removes the press scale (`transform:none`). The OSS `.button svg` size/margin is overridden.

Popover: width `--model-selector-popover-width` (240px = spacing*60), max-width `100vw - spacing*4`,
padding 6px, radius `radius*2` (16px), flex column, `overflow: visible`, `min-width:0`; OSS bg-overlay +
`--overlay-shadow` + Select enter/exit animations (fade only under reduced motion).

Title: px 8, pt 6 (10 after Search), pb 2, text-xs/16 medium muted.
List: flex column, `overflow-x:hidden`, overscroll contain, padding `0 0 4px`, `max-height` 334px
(`spacing*(9*7.5+7.5*2+1)`), fixed `height` = max with Search (+ margin-top 4px unless after the title),
scroll-padding-block `30px var(--scroll-shadow-size)`, scroll shadow 16px, list-box `> * + *` margin removed.
Group title: sticky top 0, z-10, bg overlay, px 8, pt 10, pb 4, text-xs/16 normal muted → 30px tall.
Item: h 36, gap 10, px 8 (pe 28 from OSS indicator rule), text-sm, radius `--model-selector-row-radius`
(= max(0, 16-6) = 10px), hover bg default (OSS), pressed scale .98 (OSS), focus-visible: bg default +
`inset 0 0 0 2px var(--focus)`. Name flex-1 truncate foreground; medium when selected. Meta text-xs muted.
Chip accent soft sm (12px/20px, px 4, radius 16). Checkmark/indicator transitions off.
Search: `--field-radius: row radius` (10px), h 36, secondary field bg (`default`).
Empty: column, gap 4, px 16, pt 24, pb 20, centered; title sm medium foreground; hint xs muted.

Detail card: absolute, top 0, `inset-inline-start: calc(100% + gap)` (gap 8px), width 192px (spacing*48),
padding 12px, radius = popover radius, bg overlay, `--overlay-shadow`, max-height `100dvh - 2*margin` (margin 8px),
`transform: translateY(clamp(min-y + margin, y - nudge(5px), max-y - margin))`.
Hidden: opacity 0 + visibility hidden + pointer-events none, transition `opacity 100ms` + `visibility 0s 100ms`.
`[data-visible]`: opacity 1, `opacity 150ms`; `[data-glide]` adds `transform 150ms`; body plays
`heroui-overlay-fade-in 120ms` per model. `::before` bridges the gap (gap + 8px) so the pointer can travel.
`[data-side=start]` mirrors, `[data-side=none]` → display none.
Body: column gap 12, overflow-y auto. Header column gap 4; title row gap 8; name sm semibold; description xs muted
(text-wrap pretty). Ratings: border-top separator, pt 12, column gap 8; rating row xs muted space-between;
dots 6×6 gap 3 full radius: filled foreground, empty foreground 15% (18% dark). Context xs muted, mt 4, strong medium foreground tabular.

Effort (`.slider` turned into a flex column): border-top separator, padding `12px 8px 8px`.
Header: baseline, gap 4, text-xs; label normal muted; value medium foreground.
Body: margin-top 10, column, gap 6. Track 16px tall, radius `radius*.75` (6px), bg `--model-selector-effort-track`
(default → default-hover on hover), `inset 0 0 0 1px` ring (foreground 5%, 6% dark, 7% hover),
`container-type: inline-size`, OSS transparent borders removed, `::before` hit area 24px.
Rail: absolute, inset-inline `edge = inset(2px) + thumb/2(5px) = 7px`.
Fill: content-box with padding-inline edge and margin-inline-start -edge (reaches both track ends), radius 6,
bg foreground 22% (26% hover) or accent on Max/Ultra (+ inset 1px black 6%), `width .2s ease-out-quint`,
`::after` light/shade gradients on Max/Ultra.
Thumb: width 14 (2*edge), transparent; `::after` 10×12 radius 4 (6-2) bg `--model-selector-effort-thumb`
(surface; foreground in dark; accent-foreground on Max/Ultra) with a 0.5px ring + 0 1px 2px shadow;
`left .2s` transition; `surface-hover` while dragging without tone.
Ticks: 2×4, radius 1, empty foreground 20% (30% on Max light), filled surface 85% (accent-foreground 80% on tones).
Ends: text-xs muted, space-between. Hint: grid rows 1fr ↔ 0fr (`data-empty`), body pt 12, gap 6, xs muted,
icon 14px; stacked texts crossfade (opacity + visibility, 200ms).
Max: sheen band animation (8s loop, pass in the first 60%). Ultra: sheen at 25%, glow (radial halo at thumb end
+ breathing box-shadow 10s), inner sparks (fill colour) and outer sparks/stars (accent-derived colours,
`plus-lighter` in dark). Reduced motion: no sheen/sparks, glow static, slider/hint jump, fill colour crossfades;
the track's hover colour fade stays (Pro keeps it, it is not motion).

All Pro CSS variables listed in the docs are supported with the same names and defaults.

---

## 4. Behaviour / timings

- Open: Enter/Space/ArrowDown/click on the trigger (RAC Select). Focus goes to the selected row, or the search field.
- Detail: pointer hover shows the card after ~300ms (measured 309ms / 325ms); entering another row restarts
  the intent, and while visible switches immediately with `data-glide`. Hover is list-level: leaving a row
  for a group title or a gap keeps the card (and a pending intent) on the last hovered row; only leaving
  the list (its `pointerleave`) cancels the intent and hides after ~150ms (measured 152ms, re-verified with a
  real pointer); hovering the card keeps it.
  Keyboard focus-visible (incl. Autocomplete virtual focus) shows the card immediately. Pointer-open does not show it.
  Side: `end` when there is room after the popover, else `start`, else `none`.
  Vars: `y = row.top - popover.top`, `min-y = -popover.top`, `max-y = innerHeight - popover.top - card height`.
- Search: RAC Autocomplete; first Escape clears the query (SearchField), second closes; query reset on close.
  Filter: model name or provider contains query (base sensitivity). Empty groups disappear.
- Effort: every step applies immediately; `aria-valuetext` = description when it names the level, else
  "Label, description", else label. Ends row id is the input's `aria-describedby`.
  Switching to a model without the current level uses its `defaultEffort` (and calls `onEffortChange`);
  switching back restores the user's level (also when `effort` is controlled).
- Popover keeps the side it opened on (no flip while open), so the hint row shrinks the list.

---

## 5. Dependencies
`@heroui/react` (Select, Button, ListBox, Header, ScrollShadow, Chip, SearchField, Slider, Label),
`react-aria-components` (Autocomplete, Text), `react-aria` (useFilter, useLocale). No heavy optional peers →
safe for the root barrel.

## 6. Implementation notes
- RAC Select renders the popover children once more in a hidden `<template>` to build its collection
  (Pro's DOM shows the title and the empty detail card there). `ModelSelector.Item`'s own body therefore
  only runs in that hidden pass, so hover / focus are reported from the row's render props
  (`isHovered`, `isFocusVisible`) by a child that runs in the visible popover. Only a row's hover start is
  reported; the list's own `onPointerLeave` (added in the ListBox `render` function) ends the hover. Effort and the search
  field skip the hidden pass (`useIsHidden`), like Pro's template.
- `aria-valuetext` is patched onto the slider's range input in a layout effect (RAC formats numbers only).
- The popover locks the side RAC picked on open (`shouldFlip=false` until it closes).
- Verified against the Pro demos (same 1000×800 iframe method): popover / list / item / effort / detail
  metrics, computed colours (light + dark, Max + Ultra), detail vars (`y`, `min-y`, `max-y` identical
  for the same geometry), show/hide/glide timings, search filtering + empty state, controlled fallback/restore.

## 7. Deviations
- Spark positions/lifetimes are generated by my own low-discrepancy sequence (golden-ratio based), not Pro's values.
- Provider logos in stories are my own simple marks; demo copy and data are my own.
- Default demo's Prompt Input is mocked in the story with OSS TextArea/Button (Prompt Input is built later).
