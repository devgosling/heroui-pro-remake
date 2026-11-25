# Segment — clean-room implementation spec

Slug: `segment` · Docs: https://heroui.pro/docs/react/components/segment · Category: Navigation
Import (Pro): `import {Segment} from "@heroui-pro/react";` (root export)

Sources used: public docs text, rendered DOM and CSSOM of the public demo pages (light + dark),
computed styles, runtime probing (clicks, keyboard), and the OSS react-aria-components 1.22.1
package in this repo (to identify which primitive behaviour comes from React Aria Components (RAC)).
I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A segmented control: a single-selection pill group for switching between a small set of mutually
exclusive options. It has a sliding "thumb" (selection indicator) that animates from the old item to
the new one.

---

## 2. Anatomy

```tsx
<Segment>                          // RAC ToggleButtonGroup (selectionMode="single")
  <Segment.Item id="monthly">      // RAC ToggleButton
    {/* auto: <SelectionIndicator/> rendered first, only while selected */}
    <Segment.Separator />          // optional, must be the FIRST child of an item
    Monthly
  </Segment.Item>
</Segment>
```

| Part | Rendered element | `data-slot` | BEM class(es) | Primitive |
|---|---|---|---|---|
| `Segment` (root) | `<div role="radiogroup" aria-orientation="horizontal" data-orientation="horizontal" data-rac>` | `segment` | `segment segment--{sm\|md\|lg}` + `segment--ghost` | RAC `ToggleButtonGroup` with `selectionMode="single"` (RAC sets `role="radiogroup"` in single mode; it also wraps children in RAC `SharedElementTransition`) |
| `Segment.Item` | `<button type="button" role="radio" aria-checked tabindex="0" data-rac data-react-aria-pressable>` | `segment-item` | `segment__item segment__item--{size}` + `segment__item--ghost` | RAC `ToggleButton` (provides `SelectionIndicatorContext`) |
| indicator (automatic) | `<div data-rac>` (first child of the selected item only) | `segment-indicator` | `segment__indicator` + `segment__indicator--ghost` | RAC `SelectionIndicator` (a `SharedElement` named `"SelectionIndicator"`) |
| `Segment.Separator` | `<span aria-hidden="true">` | `segment-separator` | `segment__separator` | plain DOM span |

Notes
- The root carries the size class for every size (`segment--md` is emitted) but CSS only has rules for
  `.segment--sm` (padding) and `.segment--ghost`. `.segment--md` and `.segment--lg` have no rules.
- Items carry `segment__item--{size}`. Each size has a rule.
- In the ghost variant the item gets `segment__item--ghost` and the indicator gets `segment__indicator--ghost`.
  Size and variant therefore reach the items through context.
- DOM order inside a selected item is: indicator `<div>`, then (optional) separator `<span>`, then the user content.
  Example: `<button …><div class="segment__indicator"/><span class="segment__separator"/>Dashboard</button>`.
- Icon-only items use `aria-label` on `Segment.Item`, for example `aria-label="Light"`.

---

## 3. API (from docs)

### `Segment` (root)
"The root component. Wraps RAC ToggleButtonGroup with a single-selection API."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'ghost'` | `'default'` | Visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `selectedKey` | `Key \| null` | – | Selected key (controlled) |
| `defaultSelectedKey` | `Key` | – | Initially selected key (uncontrolled) |
| `onSelectionChange` | `(key: Key) => void` | – | Called when the selected item changes |
| `isDisabled` | `boolean` | – | Disables all items |
| `children` | `ReactNode` | – | Segment items |

Also accepts all RAC `ToggleButtonGroup` props **except** `selectionMode`, `selectedKeys`,
`defaultSelectedKeys` and `onSelectionChange`. For example `orientation`, `className`, `style`, `id` and aria props.

Implementation mapping (derived):
- `selectedKeys = selectedKey == null ? new Set() : new Set([selectedKey])` and `defaultSelectedKeys = new Set([defaultSelectedKey])`.
- RAC `onSelectionChange(keys: Set<Key>)` maps to `onSelectionChange([...keys][0])`. It is only called when a key exists.
- `disallowEmptySelection` must be `true`. Observed: pressing the selected item (Space or click) keeps it selected.

### `Segment.Item`
"An individual option wrapping RAC ToggleButton. Automatically renders a SelectionIndicator inside."

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `Key` | – | Unique key for this item |
| `children` | `ReactNode \| ((renderProps) => ReactNode)` | – | Label, or a render function that receives RAC ToggleButton render props (`isSelected`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`, …) |

Also accepts all RAC `ToggleButton` props (`isDisabled`, `aria-label`, `className`, `style`, …).
`className` is merged after the BEM classes. The icon-expand demo passes `className="w-auto"` and `style={{gap: 0}}`.

### `Segment.Separator`
"Decorative divider between items. Render it as a child of Segment.Item, before the item label or
content. It is automatically hidden adjacent to the selected item." Accepts all native `<span>` attributes.
Docs guidance: separators are optional. Do not render them directly under `Segment` or between items.

---

## 4. Styling

All rules are in `@layer components`. Token values are listed in section 7.
Tailwind-like shorthand is given in brackets.

### `.segment`
- `position: relative; display: inline-flex; align-items: center;`
- `padding: var(--spacing)` [p-1 = 4px]
- `border-radius: calc(var(--radius-2xl) + .25rem)` [= 20px with the default `--radius: .5rem`]
- `background-color: var(--default)` [bg-default]
- Note: the demo container is a flex parent, so the computed `display` there is `flex`. Authored value is `inline-flex`.

### `.segment__item`
- `position: relative; z-index: 1; display: flex; align-items: center; justify-content: center;`
- `gap: calc(var(--spacing) * 1.5)` [gap-1.5 = 6px]
- `width: 100%` (so equal-width items when the root is stretched; see "full width" in section 5)
- `height: calc(var(--spacing) * 8)` [h-8 = 32px]; `padding-inline: calc(var(--spacing) * 4)` [px-4]
- `border-radius: calc(var(--radius) * 3)` [= 24px, rounded-3xl]
- `font-size: var(--text-sm); line-height: var(--text-sm--line-height); font-weight: var(--font-weight-medium)` (14px/20px/500)
- `white-space: nowrap; text-align: center; color: var(--muted);`
- `cursor: var(--cursor-interactive); outline: none; -webkit-tap-highlight-color: transparent;`
- `transition: color .15s var(--ease-smooth), background-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out), opacity .15s var(--ease-smooth)`
- `motion-reduce: transition-property: none`. This is the OSS `motion-reduce` custom variant: `[data-reduce-motion="true"]` on self or an ancestor, else `@media (prefers-reduced-motion: reduce)`.
- `[data-selected="true"]` → `color: var(--segment-foreground)`
- `@media (hover: hover)`: `:hover` / `[data-hovered="true"]`, when not `[data-selected="true"]` and not `[data-disabled="true"]` → `opacity: .7`
- `:focus-visible:not([data-focused])`, `[data-focus-visible="true"]` → Tailwind ring: `ring-2 ring-focus ring-offset-[var(--ring-offset-width)] ring-offset-background outline-none`. That is a 2px `var(--focus)` ring outside a 2px `var(--background)` offset, drawn as `box-shadow`.
- `:disabled`, `[data-disabled="true"]`, `[aria-disabled="true"]` → `opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none`
- `svg` children → `width/height: calc(var(--spacing) * 4)` [size-4 = 16px]; `flex-shrink: 0`

### `.segment__indicator` (RAC SelectionIndicator)
- `position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;`. Physical `left`, not `inset-inline-start`.
  The item is `position: relative; z-index: 1`, which makes it a stacking context, so the `-1` keeps the indicator above the item background and below its text.
- `border-radius: var(--radius-3xl)` [24px]
- `background-color: var(--segment)`
- `box-shadow: var(--shadow-surface)` (the OSS `shadow-surface` utility maps to `--surface-shadow`)
- `transition-property: translate, width, height; transition-duration: .25s; transition-timing-function: var(--ease-out-fluid)` (= `cubic-bezier(.32,.72,0,1)`)
- `motion-reduce: transition-property: none`
- This matches the OSS `.tabs__indicator` (packages/styles/components/tabs.css), apart from `start-0` vs `left: 0`.
  The OSS one also has `&[data-animation-ready="false"] { transition: none }`. The Pro segment CSS has no such rule.

### `.segment__separator`
- `position: absolute; top: 25%; inset-inline-start: 0; width: 1px; height: 50%; border-radius: 4px; pointer-events: none;`
- `background-color: var(--muted)`, and inside `@supports (color: color-mix(in lab, red, red))`: `color-mix(in oklab, var(--muted) 25%, transparent)` [bg-muted/25]
- `transition: opacity .15s var(--ease-smooth)` + motion-reduce none
- `.segment__item:first-child > .segment__separator { display: none }`
- `.segment__item[data-selected="true"] .segment__separator, .segment__item[data-selected="true"] + .segment__item .segment__separator { opacity: 0 }`.
  This hides the dividers on both edges of the selected item.

### Sizes
| Class | Declarations | Rendered (measured) |
|---|---|---|
| `.segment--sm` | `padding: calc(var(--spacing) * .5)` (2px) | root height 32px |
| `.segment__item--sm` | `height: 7×spacing (28px); padding-inline: 2.5×spacing (10px); font-size: var(--text-xs); line-height: var(--text-xs--line-height)` (12px/16px) | item 28px; icon-only item 36×28 |
| (`.segment--md` has no rule; root keeps 4px padding) | – | root height 40px |
| `.segment__item--md` | `height: 8×spacing (32px); padding-inline: 4×spacing (16px); text-sm` | item 32px |
| (`.segment--lg` has no rule; root keeps 4px padding) | – | root height 48px |
| `.segment__item--lg` | `height: 10×spacing (40px); padding-inline: 5×spacing (20px); text-sm` | item 40px |

The root radius stays at 20px for every size. The indicator and item radius stays at 24px, which is at least half the height, so the thumb is always a full pill.

### Ghost variant
- `.segment--ghost { background-color: transparent; padding: 0 }`. It comes later in the cascade than `.segment--sm`, so ghost + sm has padding 0.
- `.segment__item--ghost[data-selected="true"] { color: var(--accent-foreground) }`
- `.segment__indicator--ghost { background-color: var(--accent); box-shadow: none }`

### Utility rules seen in the CSS bundle (customisation examples, not used by any segment demo)
- `.[&_.segment__indicator]:bg-default .segment__indicator { background-color: var(--default) }`
- `.[&_.segment__indicator]:shadow-none .segment__indicator { box-shadow: none (tw) }`

These show that consumers restyle the indicator from the root with arbitrary descendant variants.
The class names are stable, so no extra API is needed.

### CSS custom properties
The segment defines no `--segment-*` component variables of its own. It only uses theme tokens:
`--default`, `--segment`, `--segment-foreground`, `--muted`, `--accent`, `--accent-foreground`,
`--focus`, `--background`, `--shadow-surface` (= `--surface-shadow`), `--radius`, `--radius-2xl`,
`--radius-3xl`, `--spacing`, `--text-xs`, `--text-sm`, `--font-weight-medium`, `--ease-smooth`, `--ease-out`,
`--ease-out-fluid`, `--disabled-opacity`, `--cursor-interactive`, `--cursor-disabled`, `--ring-offset-width`.

### Keyframes
None. All motion uses CSS transitions plus RAC's FLIP for the indicator.

---

## 5. Behaviour

### Selection model (RAC ToggleButtonGroup, single mode)
- Exactly one item is selected. Pressing the selected item again does nothing (empty selection is not allowed).
- Controlled (`selectedKey`) and uncontrolled (`defaultSelectedKey`) both work. In the controlled demo, clicking "Reports"
  updates the caption to `reports` right away.
- Root attributes: `role="radiogroup"`, `aria-orientation="horizontal"`, `data-orientation="horizontal"`; with
  `isDisabled`: `aria-disabled="true"` and `data-disabled="true"`. The root has no tabindex.
- Item attributes: `role="radio"`, `aria-checked="true|false"`, `data-selected="true"` (only when selected),
  `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled`. Disabled items get the native
  `disabled` attribute and lose `tabindex`. Enabled items all have `tabindex="0"`.

### Keyboard (measured; this is RAC Toolbar behaviour inside ToggleButtonGroup)
| Key | Result |
|---|---|
| ArrowRight / ArrowLeft | Moves **focus only** to the next or previous item. Selection does not change. No wrap at the ends: focus stays on the last item. Arrows are flipped in RTL (RAC). |
| ArrowUp / ArrowDown | No effect while horizontal |
| Home / End | No effect (focus did not move) |
| Space / Enter | Selects the focused item |
| Tab | Leaves the group. RAC Toolbar redirects Tab out even though every item is `tabindex=0` |

Focus ring only shows on keyboard focus (`data-focus-visible="true"`).

### Indicator animation (measured + RAC source)
- `SelectionIndicator` is a RAC `SharedElement name="SelectionIndicator"` that renders only inside the selected
  `ToggleButton`. `ToggleButtonGroup` provides the `SharedElementTransition` scope. **No View Transitions API.**
- When selection changes:
  1. The old indicator unmounts. In its layout-effect cleanup it stores `getBoundingClientRect()` and, for every
     property in its computed `transition-property` (translate, width, height), the current computed value.
  2. The new indicator mounts in the new item. It sets inline styles to the old values, with `translate` set to the
     rect delta. Observed going from item 0 to item 2: `style="translate: -199.125px; width: 105.016px; height: 32px;"`.
     It cancels any transitions those inline styles started.
  3. On the next `requestAnimationFrame` it restores the original inline values (empty). The CSS transition
     (`250ms cubic-bezier(.32,.72,0,1)` on translate/width/height) then slides and resizes the thumb into place.
- On first mount the indicator has `data-entering="true"` for about one frame. There is no CSS for
  `[data-entering]`/`[data-exiting]`, so there is no enter animation and the thumb is simply there.
- Reduced motion: `transition-property: none`. RAC only snapshots when `transitionProperty !== 'none'`, so with
  reduced motion the thumb jumps to the new item.
- Text colour changes run separately on `.segment__item` (`color .15s ease`).

### Hover, press and disabled
- Hover on an unselected, enabled item: `opacity .7` (hover-capable devices only), 150ms transition.
- There is no press or scale style.
- `isDisabled` on the root: every item has `disabled` and `data-disabled`, opacity .5, `cursor: not-allowed`, and no pointer events.
- `isDisabled` on one item: only that item is dimmed and skipped.

### Separators
Absolutely positioned 1px lines at each item's inline-start edge, at 50% of the item height and vertically centred.
They are hidden on the first item, on the selected item, and on the item right after the selected one, with a 150ms opacity fade.

### Full width / item sizing (derived from CSS)
There is no `fullWidth` prop. `.segment__item` has `width: 100%`. If the root is stretched (for example
`className="w-full"` or `flex`), each item's flex basis is 100% and they shrink equally, which gives equal-width segments.
When the root keeps its intrinsic size, the items take their content width. The icon-expand demo overrides this with
`className="w-auto"` on items so they size to content while the labels animate.

### Orientation
RAC passes `orientation` through (`aria-orientation`/`data-orientation`), and the docs do not exclude it. However, **no CSS
reacts to `data-orientation="vertical"`** (`.segment` has no `flex-direction` rule). Vertical is therefore not visually supported.
Only horizontal appears in the docs and demos.

---

## 6. Demo variants

All demos use lowercase string ids (for example `id="dashboard"`). Indices below are 0-based.

| # | Demo (docs heading) | URL | What it shows / structure |
|---|---|---|---|
| 1 | Theme switcher (docs "Usage") | https://heroui.pro/docs/react/demos/segment-theme-switcher?theme=light | `size="sm"`. Three **icon-only** items with `aria-label` "Light", "Dark", "System" and 16px icons: filled sun, filled moon, stroked monitor. Default selected: `system`. Items measure 36×28 and the group 112×32. A good "icon-only" story. |
| 2 | Icon Expand | …/segment-icon-expand?theme=light | `variant="ghost"`, `size="md"`. Items Home / Chat / Meetings / Inbox, each with a 16px icon and a label that expands only when selected. Each item has `className="w-auto"` and `style={{gap:0}}` and uses the render-prop child `({isSelected}) => …`. Label wrapper: `<span class="inline-grid transition-all duration-200 ease-out motion-reduce:transition-none" style="grid-template-columns: {isSelected ? '1fr' : '0fr'}; min-width:0; opacity: {isSelected ? 1 : 0}">`, containing `<span class="overflow-hidden whitespace-nowrap transition-[padding] duration-200 ease-out motion-reduce:transition-none" style="min-width:0; padding-inline-start: {isSelected ? '0.375rem' : 0}">Label</span>`. Default selected: `meetings`. The ghost indicator (accent pill) slides and resizes while the labels collapse and expand over 200ms. |
| 3 | Basic | …/segment-default?theme=light | `size md`, four text items Dashboard / Analytics / Reports / Settings, `defaultSelectedKey="dashboard"`. Group 378×40, items 105/94/84/87 px wide. |
| 4 | Two Items | …/segment-two-items?theme=light | `size="sm"`, Monthly / Yearly (billing toggle), default `monthly`. |
| 5 | Ghost | …/segment-ghost?theme=light | `variant="ghost" size="sm"`, seven compact items 1W, 4W, 1Y, MTD, QTD, YTD, ALL (chart range picker), default `mtd`. Transparent container and accent indicator with accent-foreground text. |
| 6 | Sizes | …/segment-sizes?theme=light | Three groups stacked (`flex flex-col items-start gap-6`), each with a `text-muted text-xs` caption "sm" / "md" / "lg", same four items as Basic, default dashboard. |
| 7 | With Icons | …/segment-with-icons?theme=light | md, 16px icon + text: Dashboard, Analytics, Team, Settings. Default: dashboard. |
| 8 | With Separators | …/segment-with-separators?theme=light | md, Basic's items with `<Segment.Separator />` as the first child of every item. The first separator is display:none. The separators on the selected item and the one after it have opacity 0. |
| 9 | Disabled | …/segment-disabled?theme=light | Basic with `isDisabled` on the root. All items are at .5 opacity. |
| 10 | Disabled Item | …/segment-disabled-item?theme=light | Dashboard / Analytics (`isDisabled`) / Reports, default dashboard. |
| 11 | Controlled | …/segment-controlled?theme=light | `useState("analytics")` + `selectedKey`/`onSelectionChange`. Below it: `<span class="text-muted text-sm">Selected: <strong class="text-foreground">{key}</strong></span>`, in a wrapper `flex flex-col items-start gap-4`. |

Every demo also has a `?theme=dark` URL.

---

## 7. Theme tokens and light vs dark

Measured on the demo pages. The OSS theme defines all of these: `packages/styles/themes/default/variables.css`
has `--segment` and `--segment-foreground`, and `themes/shared/theme.css` has `--shadow-surface: var(--surface-shadow)` and
`--ease-out-fluid`. **No new tokens are needed.**

| Token | Light | Dark | Used by |
|---|---|---|---|
| `--default` | `lab(93.03% .10 -.36)` (light grey) | `lab(15.73% .61 -2.17)` | root track bg |
| `--segment` | `lab(100% 0 0)` (white) | `lab(29.89% 1.02 -3.61)` (lighter grey) | thumb bg |
| `--segment-foreground` | `lab(8.34% .61 -2.13)` (= foreground) | `lab(98.97% 0 0)` | selected text |
| `--muted` | `lab(47.87% 1.41 -4.99)` | `lab(65.65% 1.53 -5.42)` | unselected text; separator at 25% |
| `--accent` / `--focus` | `lab(54.53% 3.32 -66.53)` (blue) | same | ghost thumb; focus ring |
| `--accent-foreground` | `lab(98.97% 0 0)` | same | ghost selected text |
| `--background` | `lab(96.54% 0 0)` | `lab(1.55% .18 -.65)` | ring offset colour |
| `--surface-shadow` / `--shadow-surface` | `0 2px 4px 0 #0000000a, 0 1px 2px 0 #0000000f, 0 0 1px 0 #0000000f` | `0 0 0 0 transparent inset` (**no shadow in dark**) | thumb shadow |
| `--disabled-opacity` | `.5` | `.5` | disabled |
| `--radius` | `.5rem` (2xl = 1rem, 3xl = 1.5rem) | same | radii |
| `--ease-out-fluid` | `cubic-bezier(.32,.72,0,1)` | same | thumb transition |
| `--ease-smooth` / `--ease-out` | `ease` / `cubic-bezier(0,0,.2,1)` | same | colour/opacity/shadow transitions |

Light: white thumb with a soft shadow on a light-grey track. Dark: a lighter-grey thumb with no shadow on a dark-grey track.
Separator in light is `oklab(.5517 .0038 -.0133 / .25)`, in dark `oklab(.7050 .0041 -.0144 / .25)`. The theme is selected with
`html.light|.dark` plus `data-theme`.

---

## 8. Dependencies

- **react-aria-components** (already a peer): `ToggleButtonGroup`, `ToggleButton`, `SelectionIndicator`
  (`react-aria-components/SelectionIndicator`, the same import the OSS `Tabs` uses). `SharedElementTransition` comes from
  ToggleButtonGroup automatically. This was verified in `node_modules/.pnpm/react-aria-components@1.22.*/…/dist/private/ToggleButtonGroup.js`
  (it imports `SharedElementTransition`) and `ToggleButton.js` (it provides `SelectionIndicatorContext`).
- **OSS HeroUI**: none composed at runtime. It reuses theme tokens and the `motion-reduce` custom variant from `@heroui/styles`.
  The visual language matches OSS `Tabs` (`.tabs__indicator` uses the same tokens and transition).
  The OSS `ToggleButtonGroup`/`ToggleButton` are **not** used: Pro classes are `segment__*`, not `toggle-button*`.
- **Other Pro components**: none.
- **Third-party**: none.
- Suggested files (following `packages/pro`): `css/components/segment.css` (imported into `css/index.css` under
  "Navigation" with `layer(components)`), `src/components/segment/{segment.tsx, segment.styles.ts, index.ts}`.

---

## 9. Open questions / uncertainties

1. **Vertical orientation**: not styled in CSS. Decide whether to block `orientation` (omit it from props) or add vertical styles ourselves.
2. **`isDisabled` root styling**: there is no root-level disabled rule; only the items dim. Confirmed in the demo.
3. **Home/End keys** do nothing (RAC Toolbar default in 1.22). Matching that is the simplest option. Adding Home/End would differ from Pro.
4. Whether Pro passes `disallowEmptySelection` explicitly or forces it some other way is unknown. The observed behaviour is "cannot deselect".
5. `onSelectionChange` signature in the docs is `(key: Key) => void`. Behaviour when the controlled `selectedKey` is `null` (nothing selected) was not shown in any demo.
6. Whether the indicator in Pro sets `data-animation-ready` like OSS Tabs is unknown. Not seen in the DOM, so probably not.
7. The `[&_.segment__indicator]:bg-default` / `shadow-none` utilities in the CSS bundle come from some other docs usage (not the segment demos). They are listed only as customisation hints.
8. The CSS bundle on the demo pages also contains an unrelated `.aui-segment*` rule set (a different library, with an extra `text` variant) and `.date-input-group__segment` (OSS date input). Neither is part of Pro Segment and both are ignored here.

---

## Appendix A — raw CSSOM dump (rules matching `/segment/`, Pro Segment only)

Context prefix format: `<@layer/@media/@supports chain> :: <rule cssText>`. Captured from
`https://heroui.pro/docs/react/demos/segment-default?theme=light`.

```css
@layer components :: .segment { background-color: var(--default); padding: var(--spacing); border-radius: calc(var(--radius-2xl) + .25rem); align-items: center; display: inline-flex; position: relative; }
@layer components :: .segment__item { z-index: 1; cursor: var(--cursor-interactive); height: calc(var(--spacing) * 8); justify-content: center; align-items: center; gap: calc(var(--spacing) * 1.5); border-radius: calc(var(--radius) * 3); width: 100%; padding-inline: calc(var(--spacing) * 4); text-align: center; font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); --tw-font-weight: var(--font-weight-medium); font-weight: var(--font-weight-medium); white-space: nowrap; color: var(--muted); --tw-outline-style: none; -webkit-tap-highlight-color: transparent; transition: color .15s var(--ease-smooth), background-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out), opacity .15s var(--ease-smooth); outline-style: none; display: flex; position: relative; }
@layer components :: .segment__item:is([data-reduce-motion="true"], [data-reduce-motion="true"] *), .segment__item:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::before, .segment__item:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::after { transition-property: none; }
@layer components > @media (prefers-reduced-motion: reduce) :: .segment__item:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)), .segment__item:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::before, .segment__item:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::after { transition-property: none; }
@layer components :: .segment__item[data-selected="true"] { color: var(--segment-foreground); }
@layer components :: .segment__item[data-selected="true"] .segment__separator, .segment__item[data-selected="true"] + .segment__item .segment__separator { opacity: 0; }
@layer components :: .segment__item:disabled, .segment__item[data-disabled="true"], .segment__item[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }
@layer components > @media (hover: hover) :: .segment__item:not([data-selected="true"]):not([data-disabled="true"]):hover, .segment__item[data-hovered="true"]:not([data-selected="true"]):not([data-disabled="true"]) { opacity: 0.7; }
@layer components :: .segment__item:focus-visible:not([data-focused]), .segment__item[data-focus-visible="true"] { --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); --tw-ring-color: var(--focus); --tw-ring-offset-width: var(--ring-offset-width); --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-offset-color: var(--background); --tw-outline-style: none; outline-style: none; }
@layer components :: .segment__item svg { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); flex-shrink: 0; }
@layer components :: .segment__separator { background-color: var(--muted); }
@layer components > @supports (color:color-mix(in lab, red, red)) :: .segment__separator { background-color: color-mix(in oklab, var(--muted) 25%, transparent); }
@layer components :: .segment__separator { pointer-events: none; width: 1px; height: 50%; transition: opacity .15s var(--ease-smooth); inset-inline-start: 0px; border-radius: 4px; position: absolute; top: 25%; }
@layer components :: .segment__separator:is([data-reduce-motion="true"], [data-reduce-motion="true"] *), .segment__separator:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::before, .segment__separator:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::after { transition-property: none; }
@layer components > @media (prefers-reduced-motion: reduce) :: .segment__separator:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)), .segment__separator:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::before, .segment__separator:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::after { transition-property: none; }
@layer components :: .segment__item:first-child > .segment__separator { display: none; }
@layer components :: .segment__indicator { z-index: -1; border-radius: var(--radius-3xl); background-color: var(--segment); width: 100%; height: 100%; box-shadow: var(--shadow-surface); transition-property: translate, width, height; transition-duration: 0.25s; transition-timing-function: var(--ease-out-fluid); position: absolute; top: 0px; left: 0px; }
@layer components :: .segment__indicator:is([data-reduce-motion="true"], [data-reduce-motion="true"] *), .segment__indicator:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::before, .segment__indicator:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::after { transition-property: none; }
@layer components > @media (prefers-reduced-motion: reduce) :: .segment__indicator:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)), .segment__indicator:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::before, .segment__indicator:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::after { transition-property: none; }
@layer components :: .segment--sm { padding: calc(var(--spacing) * .5); }
@layer components :: .segment__item--sm { height: calc(var(--spacing) * 7); padding-inline: calc(var(--spacing) * 2.5); font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); }
@layer components :: .segment__item--md { height: calc(var(--spacing) * 8); padding-inline: calc(var(--spacing) * 4); font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); }
@layer components :: .segment__item--lg { height: calc(var(--spacing) * 10); padding-inline: calc(var(--spacing) * 5); font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); }
@layer components :: .segment--ghost { background-color: rgba(0, 0, 0, 0); padding: 0px; }
@layer components :: .segment__item--ghost[data-selected="true"] { color: var(--accent-foreground); }
@layer components :: .segment__indicator--ghost { background-color: var(--accent); box-shadow: none; }
@layer utilities :: .\[\&_\.segment\\_\\_indicator\]\:bg-default .segment__indicator { background-color: var(--default); }
@layer utilities :: .\[\&_\.segment\\_\\_indicator\]\:shadow-none .segment__indicator { --tw-shadow: 0 0 #0000; box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); }
```

No `@keyframes` are used by these rules.

## Appendix B — measured computed values (light, `segment-default`)

```
.segment            bg lab(93.03 .099 -.364) · padding 4px · radius 20px · 378.09×40
.segment__item[sel] color lab(8.34 …) · 105.02×32 · pl 16px · 14px/20px/500 · radius 24px · z 1
.segment__item      color lab(47.87 …) (muted) · transition "color .15s, background-color .15s, box-shadow .15s cubic-bezier(0,0,.2,1), opacity .15s"
.segment__indicator bg lab(100 0 0) · radius 24px · shadow rgba(0,0,0,.04) 0 2px 4px, rgba(0,0,0,.06) 0 1px 2px, rgba(0,0,0,.06) 0 0 1px
                    transition "translate .25s cubic-bezier(.32,.72,0,1), width .25s …, height .25s …" · z -1 · inset 0
FLIP inline style on new indicator (item0 → item2): "translate: -199.125px; width: 105.016px; height: 32px;" → removed next frame
```
