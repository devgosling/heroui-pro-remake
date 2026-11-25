# Rating — clean-room implementation spec

Slug: `rating` · Docs: https://heroui.pro/docs/react/components/rating · Storybook title: `Pro/Feedback/Rating`
Import (Pro): `import {Rating} from "@heroui-pro/react";` (root export, no heavy peer)

Sources used: public docs text, rendered DOM and CSSOM of the 12 public demo pages (light + dark),
computed styles, runtime probing (hover, click, keyboard, Tab), and the OSS `react-aria` 3.53 /
`react-aria-components` 1.22.1 packages in this repo (to tell which behaviour comes from React Aria).
I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A star rating input. It is a React Aria `RadioGroup` (horizontal) with one `Radio` per star. It supports a hover
preview, read-only fractional display (a clipped overlay on the partially filled star), three sizes, custom
icons (one for all items, or per item) and a render function per item.

---

## 2. Anatomy

```tsx
<Rating>                    // RAC RadioGroup, orientation="horizontal"
  <Rating.Item value={1} /> // RAC Radio (label + visually hidden <input type="radio">)
  …
</Rating>
```

| Part | Rendered element | `data-slot` | BEM class(es) | Primitive |
|---|---|---|---|---|
| `Rating` (root) | `<div role="radiogroup" aria-orientation="horizontal" data-orientation="horizontal" data-rac>` (+ `aria-readonly`, `aria-disabled`) | `rating` | `rating rating--{sm\|md\|lg}` | RAC `RadioGroup` |
| `Rating.Item` | `<label data-rac data-react-aria-pressable>` with `<span style="visually hidden"><input type="radio" aria-label="N star(s)" value="N"></span>` as first child | `rating-item` | `rating__item rating__item--{size}` | RAC `Radio` |
| icon (automatic) | `<span>` wrapping the icon (default: filled star SVG, 16×16 viewBox, `fill="currentColor"`, `aria-hidden`) | `rating-icon` | `rating__icon` | DOM |
| partial overlay (automatic, read-only fractional only) | `<span style="--rating-partial:50%">` wrapping a second copy of the icon, after `.rating__icon` | `rating-icon-partial` | `rating__icon-partial` | DOM |

DOM (default demo, value 3):

```html
<div data-slot="rating" class="rating rating--md" role="radiogroup" aria-label="…" aria-orientation="horizontal" data-orientation="horizontal">
  <label data-active="true" data-slot="rating-item" class="rating__item rating__item--md">
    <span style="…visually hidden…"><input aria-label="1 star" tabindex="-1" type="radio" name="…" value="1"></span>
    <span class="rating__icon" data-slot="rating-icon"><svg aria-hidden="true" fill="currentColor" viewBox="0 0 16 16">…</svg></span>
  </label>
  … (item 3 also has data-selected="true" and its input is checked, tabindex="0")
  <label data-slot="rating-item" class="rating__item rating__item--md">… value="4" …</label>
</div>
```

Read-only fractional item (value 4.5, item 5):

```html
<label data-readonly="true" data-slot="rating-item" class="rating__item rating__item--sm">
  <span …><input aria-label="5 stars" tabindex="-1" type="radio" value="5"></span>
  <span class="rating__icon" data-slot="rating-icon"><svg/></span>
  <span class="rating__icon-partial" data-slot="rating-icon-partial" style="--rating-partial:50%"><svg/></span>
</label>
```

Notes
- Radio `aria-label` is generated: `"1 star"`, `"2 stars"`, … (always "star", also with a heart icon).
- `children` as a ReactNode replaces the icon **inside** `.rating__icon` (DOM identical to the `icon` prop case).
- `children` as a function replaces the whole content: no `.rating__icon` wrapper is rendered (render-function demo
  returns its own `<span style="display:flex;width:20px;height:20px;color:…">`).
- The partial overlay renders the same icon content as `.rating__icon`.

---

## 3. API (from docs)

### `Rating` (root) — "Wraps RAC RadioGroup in horizontal orientation."

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `value` | `number` | – | Current rating (controlled) |
| `defaultValue` | `number` | – | Initial rating (uncontrolled) |
| `onValueChange` | `(value: number) => void` | – | Called when the rating changes |
| `icon` | `ReactNode` | – | Custom icon element for all items |

Also all RAC `RadioGroup` props **except** `defaultValue`, `onChange`, `orientation`, `value`
(`isReadOnly`, `isDisabled`, `isRequired`, `name`, `aria-label`, `className`, `style`, …).

### `Rating.Item` — "An individual rating option. Wraps RAC Radio."

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | – | **Required.** Numeric value of this item |
| `children` | `ReactNode \| ((props: RatingItemRenderProps) => ReactNode)` | – | Custom content or render function |

Also all RAC `Radio` props except `children` and `value`.

### `RatingItemRenderProps`

| Property | Type | Description |
|---|---|---|
| `isActive` | `boolean` | Item is at or below the current (displayed) rating |
| `isPartial` | `boolean` | Item shows a partial fill (read-only fractional) |
| `partialPercent` | `number` | Fill percentage for partial display (0–100) |

(Our implementation also passes the RAC Radio render props — `isSelected`, `isHovered`, `isPressed`, … — as a superset.)

---

## 4. Behaviour (observed)

- **Value mapping**: the RAC RadioGroup value is `String(Math.floor(value))`. 4.5 → radio "4" selected; 3.7 → "3".
- **Active**: `data-active="true"` on every item with `itemValue <= displayValue`. Attribute is absent otherwise.
- **Hover preview**: hovering item N (RAC Radio `useHover`, so mouse/pen only, disabled when read-only / disabled)
  sets displayValue = N: items 1..N get `data-active`, the hovered one also `data-hovered`. Hovering the gap between
  items (the root) clears the preview (hover end per item), as does leaving the group. Works both below and above the
  current value.
- **Partial (read-only only)**: for a fractional value, the item `ceil(value)` is not active and gets the overlay
  with `--rating-partial: round((value - floor(value)) * 100)%` (2.3 → `30%`, 4.8 → `80%`).
- **Selection**: click selects (RAC moves focus to the input). Clicking the current value does not clear it.
  Arrow keys move and select (RAC, wraps around). `onValueChange(Number(value))`.
- **Read-only**: RAC sets `data-readonly="true"` / `aria-readonly` on the root and `data-readonly` on items.
  CSS hides the inputs (`display: none`) so read-only ratings are not focusable at all; pointer events are off.
- **Disabled**: RAC sets `data-disabled` + `aria-disabled` on the root and `data-disabled` on items; inputs disabled.
  Root gets the disabled opacity (0.5); items keep opacity 1 (their disabled rule targets `:disabled`/`aria-disabled`).
- **Focus**: keyboard focus shows a ring on the item (`data-focus-visible`), radius `calc(var(--radius) * .5)`.
  The root never gets `data-focus-visible` from RAC (rule exists in CSS only).
- **Press**: `:active` / `[data-pressed]` (not read-only) → `transform: scale(.8)`, transition `transform .15s` (ease).
- **Empty value**: Pro passes `"0"` to RadioGroup when the value is 0 / undefined, so no radio matches and every
  input has `tabindex="-1"` → an empty rating cannot be reached with Tab (checked on the with-label demo).
  **Deviation**: we pass `null`, so RAC makes the group tabbable (see section 9).

---

## 5. Styling (CSSOM, all inside `@layer components`)

| Selector | Declarations |
|---|---|
| `.rating` | `display:flex; align-items:center; outline:none; --rating-active-color: var(--color-warning); --rating-inactive-color: var(--color-surface-tertiary)` |
| `.rating[data-focus-visible="true"]` | focus ring (2px `--focus`, offset `--ring-offset-width` in `--background`) |
| `.rating[data-disabled="true"]` | `opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none` (= `status-disabled`) |
| `.rating[data-readonly="true"]` | `pointer-events: none`; `input { display: none }`; focus → no shadow/outline |
| `.rating__item` | `position:relative; display:flex; align-items/justify-content:center; outline:none; tap-highlight transparent; cursor: var(--cursor-interactive); transition: transform .15s` + motion-reduce none |
| `.rating__item:focus-visible:not([data-focused]), [data-focus-visible="true"]` | focus ring + `border-radius: calc(var(--radius) * .5)` |
| `.rating__item:disabled, [aria-disabled="true"]` | status-disabled |
| `.rating__item:active:not([data-readonly="true"]), [data-pressed="true"]:not([data-readonly="true"])` | `transform: scale(.8)` |
| `.rating__item[data-readonly="true"]` | `pointer-events:none; cursor:default`; focus → no shadow/outline |
| `.rating__icon` | `position:relative; display:flex; align-items/justify-content:center; color: var(--rating-inactive-color); transition: color .1s ease-out` + motion-reduce none |
| `.rating__icon svg` | `width:100%; height:100%` |
| `.rating__item[data-active="true"] .rating__icon` | `color: var(--rating-active-color)` |
| `.rating__icon-partial` | `position:absolute; left:0; inset-block:0; display:flex; align-items:center; overflow:hidden; width: var(--rating-partial); color: var(--rating-active-color)` |
| `.rating__icon-partial svg` | `flex-shrink:0` |
| `.rating--sm / --md / --lg` | `gap: 4px / 5px / 8px` (docs text says 0/1px/2px; the CSSOM is authoritative) |
| `.rating__item--{sm,md,lg} .rating__icon`, `… .rating__icon-partial svg` | size 16px / 20px / 28px (`spacing * 4 / 5 / 7`) |

Measured (light): sm group 96×16 (items 16×16, step 20px); md 120×20 (items 20×20, step 25px);
lg 172×28 (items 28×28, step 36px). Partial overlay at 50% on sm: 8×16 box, svg 16×16 (clipped).

Tokens (light → dark): active `--warning` lab(74.4 23.7 71.6) → lab(79.1 16.7 59.9);
inactive `--surface-tertiary` lab(92.7 …) → lab(15.6 …). Custom colours via
`style={{"--rating-active-color": "var(--color-accent|danger|success)"}}` on the root.

Our CSS: base classes carry the md defaults (`gap-[5px]`, `size-5`), `--md` modifiers are empty,
`--sm` = `gap-[4px]`/`size-4`, `--lg` = `gap-[8px]`/`size-7`. The gaps are literal pixels like Pro's
(they do not follow `--spacing`), while icon sizes use the spacing scale (`calc(var(--spacing) * N)`) as in Pro.
Focus → `status-focused`, disabled → `status-disabled`.

---

## 6. Demos (12) → stories

| # | Pro demo | Content / structure | Story |
|---|---|---|---|
| 1 | `rating-product-review` | `w-[300px] flex-col gap-4`; rows `justify-between`: label `text-sm text-foreground`, then `flex gap-2` with read-only `sm` rating (aria-label "X: N stars") + value `w-7 text-right text-xs text-muted` | `ProductReview` |
| 2 | `rating-read-only-fractional` | `flex-col gap-4`; rows `flex items-center gap-3`: read-only md rating (1.5, 2.3, 3.7, 4.2, 4.8) + `text-sm text-muted` value | `ReadOnlyFractional` |
| 3 | `rating-default` | 5 items, `defaultValue={3}` | `Default` |
| 4 | `rating-with-label` | `flex-col gap-1.5`: OSS `Label` + rating (no value) | `WithLabel` |
| 5 | `rating-sizes` | `flex items-center gap-8`, columns `flex-col items-center gap-2`: `text-xs text-muted` caption + rating (value 3) per size | `Sizes` |
| 6 | `rating-custom-color` | `flex-col gap-4`, each `flex-col gap-1`: caption + rating value 4 with `--rating-active-color` accent / danger / success | `CustomColor` |
| 7 | `rating-read-only` | same structure as #2 | `ReadOnly` |
| 8 | `rating-disabled` | `isDisabled`, value 3 | `Disabled` |
| 9 | `rating-controlled` | `flex-col items-center gap-3`: controlled rating + `text-sm text-muted` "N star(s)" | `Controlled` |
| 10 | `rating-custom-icon-heart` | `icon={<HeartFill/>}`, value 3 | `CustomIconHeart` |
| 11 | `rating-custom-icon-per-item` | heart as each item's `children`, `--rating-active-color: var(--color-danger)` | `CustomIconPerItem` |
| 12 | `rating-render-function` | controlled (starts empty, "No rating"); render fn returns a 20px span: `isActive` → filled star in `--color-warning`, else outline star in `--color-muted` | `RenderFunction` |

---

## 7. Dependencies

- `react-aria-components` `RadioGroup`, `Radio` (+ `RadioRenderProps` type).
- Default star icon: Gravity UI `star-fill` path (MIT, © YANDEX LLC) inlined with attribution.
- Stories: `Label` from `@heroui/react`; icons via `@iconify/react` (`gravity-ui:heart-fill`, `star`, `star-fill`).

---

## 8. Root-barrel

No optional peer → exported from the package root (`rootExport = true`).

---

## 9. Deviations

- Empty / zero value is passed to RAC as `null` (Pro: `"0"`), so an empty rating stays reachable with Tab.
  Visuals and attributes are otherwise identical (no item `data-selected` in both cases).
- Render props are a superset of the documented ones (RAC Radio render props are included).
