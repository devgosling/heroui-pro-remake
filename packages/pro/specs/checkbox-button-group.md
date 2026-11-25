# Checkbox Button Group — clean-room implementation spec

Slug: `checkbox-button-group` · Docs: https://heroui.pro/docs/react/components/checkbox-button-group ·
Storybook title: `Pro/Forms/CheckboxButtonGroup`
Import (Pro): `import {CheckboxButtonGroup} from "@heroui-pro/react";` (root export, no heavy peer)

Sources used: public docs text, the rendered DOM (server-rendered HTML and live DOM) and CSSOM of the 10
public demo pages (light + dark), computed styles, runtime probing (hover, click, Tab, Space), and the OSS
HeroUI source in this repo (`packages/react/src/components/checkbox*`, `packages/styles/components/checkbox*.css`)
to tell which classes come from OSS. I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A multi-selection group of card-style checkboxes. Each item is a bordered card. A selected card gets a 2px
inset accent ring. An optional indicator sits in the top-end corner. It is either the OSS checkbox control
or a custom icon that fades in while selected. The component is a thin layer over the **OSS HeroUI**
`CheckboxGroup` and `Checkbox` (`Checkbox.Content`, `Checkbox.Control`, `Checkbox.Indicator`), so all
CheckboxGroup / Checkbox props (`variant`, `value`, `defaultValue`, `onChange`, `isDisabled`, `name`,
validation, ...) behave exactly as in OSS.

---

## 2. Anatomy

```tsx
<CheckboxButtonGroup>                         // OSS CheckboxGroup (RAC CheckboxGroup)
  <Label />  <Description />                  // optional OSS group label / description
  <CheckboxButtonGroup.Item value="a">        // OSS Checkbox (RAC CheckboxField) + Checkbox.Content (RAC CheckboxButton)
    <PressableFeedback.Ripple />              // optional (demo "With Ripple")
    <CheckboxButtonGroup.Indicator />         // optional; default = Checkbox.Control + Checkbox.Indicator
    <CheckboxButtonGroup.ItemContent>         // div
      <CheckboxButtonGroup.ItemIcon />        // optional div
      <Label />  <Description />
    </CheckboxButtonGroup.ItemContent>
  </CheckboxButtonGroup.Item>
</CheckboxButtonGroup>
```

| Part | Rendered element | `data-slot` | Classes | Primitive |
|---|---|---|---|---|
| Root | `<div role="group" data-rac aria-labelledby aria-describedby [aria-disabled data-disabled]>` | `checkbox-button-group` | `checkbox-group checkbox-group--{primary\|secondary} checkbox-button-group [checkbox-button-group--grid] {className}` | OSS `CheckboxGroup` (data-slot overridden) |
| Item (field) | `<div data-rac [data-selected data-disabled]>` with `style` / other Checkbox props | `checkbox-button-group-item` | `checkbox checkbox--{variant}` | OSS `Checkbox` root (RAC `CheckboxField`, data-slot overridden) |
| Item (card) | `<label data-rac data-react-aria-pressable [data-selected data-hovered data-pressed data-focused data-focus-visible data-disabled]>`, visually hidden `<input type="checkbox">` first | `checkbox-content` (OSS) | `checkbox__content checkbox-button-group__item {className}` | OSS `Checkbox.Content` (RAC `CheckboxButton`) |
| Indicator (default) | `<span>` > `<span aria-hidden class="checkbox__indicator" data-slot="checkbox-indicator">` (checkmark + indeterminate SVGs) | `checkbox-button-group-indicator` | `checkbox__control checkbox-button-group__indicator` | OSS `Checkbox.Control` + `Checkbox.Indicator` |
| Indicator (custom) | `<span data-custom="true">{children}</span>` | `checkbox-button-group-indicator` | `checkbox-button-group__indicator` | DOM |
| ItemContent | `<div>` | `checkbox-button-group-item-content` | `checkbox-button-group__item-content` | DOM |
| ItemIcon | `<div>` | `checkbox-button-group-item-icon` | `checkbox-button-group__item-icon` | DOM |

Notes
- The Item's `className` lands on the **card** (`Checkbox.Content`), not on the field wrapper. Observed:
  `className="bg-default"` (Icon Cards) and the subscription classes appear on the `<label>`. Its `style` lands on
  the field wrapper (`style="--sub-green:#89c75a"` on the `div.checkbox`). The wrapper is `display: contents`,
  so custom properties set there still inherit into the card.
- Item `children` may be a render function. It receives the RAC `CheckboxButton` render props (`isSelected`,
  `isHovered`, `isPressed`, `isFocusVisible`, `isDisabled`, ...). Demo "Render Prop Children" adds
  `text-accent` to the price while `isSelected`. Demo "Subscription Plans" colours the daily price while selected.
- Label / Description inside an item are the OSS `Label` (rendered as `<span class="label">` because
  `Checkbox.Content` provides `LabelContext {elementType: "span"}`) and `Description`
  (`<span class="description" slot="description">`, wired into the input's `aria-describedby`).
- `layout="flex"` emits **no** modifier class. Only `grid` adds `checkbox-button-group--grid`.
- The docs say ItemContent "wraps HeroUI Checkbox.Content". In the rendered DOM it is a plain `<div>` inside the
  `Checkbox.Content` label. The implementation follows the DOM.
- No class is shared with Radio Button Group. Pro ships a parallel `.radio-button-group*` block with identical
  rules, so the Radio Button Group owns its own CSS file.

---

## 3. API (from docs)

### `CheckboxButtonGroup` (root)
"Wraps HeroUI CheckboxGroup with a card-style layout. Accepts all HeroUI CheckboxGroup props."

| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `'flex' \| 'grid'` | `'flex'` | Layout mode for items |

Plus every OSS `CheckboxGroup` prop. The ones used in the demos are `variant` (`primary` | `secondary`, passed on to
items through the OSS `CheckboxGroupContext`), `defaultValue`, `value` + `onChange`, `isDisabled`, `name`,
`className` and `style`.

### `CheckboxButtonGroup.Item`
"A selectable card that wraps HeroUI Checkbox. Accepts all HeroUI Checkbox props. Supports render prop children
to access selection state." For example `value`, `isDisabled`, `isSelected`, `defaultSelected`, `onChange`,
`isInvalid`, `style` and `ref` (these go to the field wrapper), plus `className`, which goes to the card.

### `CheckboxButtonGroup.Indicator`
"Selection indicator at the top-right of the item."

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | - | Custom indicator icon, shown only when selected |

No children: the default HeroUI checkbox (Control + Indicator). With children: a custom icon, visible only while
selected. Accepts all native `span` attributes.

### `CheckboxButtonGroup.ItemContent`
"Content area for title and description." `children: ReactNode`. Accepts all native `div` attributes.

### `CheckboxButtonGroup.ItemIcon`
"Leading icon container." `children: ReactNode`. Accepts all native `div` attributes.

### CSS classes / variables / states (docs)
- `.checkbox-button-group`, `.checkbox-button-group--grid`, `.checkbox-button-group__item`,
  `.checkbox-button-group__indicator`, `.checkbox-button-group__item-content`, `.checkbox-button-group__item-icon`
- `--checkbox-button-group-item-radius` (default `var(--radius-2xl)`)
- States: Selected `[data-selected="true"]` → accent ring. Focus visible `:focus-visible` /
  `[data-focus-visible="true"]` → focus ring. Disabled `:disabled` / `[aria-disabled="true"]` → reduced opacity.
  In the CSSOM the disabled selector is actually `[data-disabled="true"]`. The remake matches both
  `[data-disabled]` and `[aria-disabled]`.

---

## 4. Styling (CSSOM, all in `@layer components`)

| Selector | Declarations (Tailwind equivalent) |
|---|---|
| `.checkbox-button-group` | `display:flex; gap:12px` [flex gap-3]; `--checkbox-button-group-item-radius: var(--radius-2xl)`. `flex-direction: column` comes from the OSS `.checkbox-group` |
| `.checkbox-button-group--grid` | `display:grid` (columns come from the user, for example `grid-cols-3`) |
| `.checkbox-button-group > [data-slot="checkbox-button-group-item"]` | `display: contents` |
| `.checkbox-button-group__item` | `position:relative; display:flex; flex-direction:column; align-items:stretch; gap:16px` [gap-4]; `padding: 16px 20px` [py-4 px-5]; `border:1px solid var(--border)`; `background: var(--surface)`; `border-radius: var(--checkbox-button-group-item-radius)`; `--tw-ring-color: transparent`; `outline:none`; tap-highlight transparent; `cursor: var(--cursor-interactive)`. Text inherits OSS `.checkbox__content`: 14px/20px, weight 500, `color: var(--foreground)` |
| `…__item[data-selected="true"]` | `border-color: transparent` + `ring-2 ring-inset ring-accent` (box-shadow `inset 0 0 0 2px var(--accent)`) |
| `…__item:focus-visible:not([data-focused]), …__item[data-focus-visible="true"]` | `status-focused` (2px `--focus` ring, `--ring-offset-width` offset in `--background`). Selected + focused gives inset `0 0 0 2px var(--background)` + inset `0 0 0 4px var(--focus)`, because `--tw-ring-inset` from the selected rule persists |
| `…__item[data-disabled="true"]` | `status-disabled` (opacity `var(--disabled-opacity)` = .5, `cursor: var(--cursor-disabled)`, `pointer-events:none`) |
| `.checkbox-button-group__indicator` | `position:absolute; top:12px; inset-inline-end:16px` [top-3 end-4] |
| `…__indicator[data-custom="true"]` | `color: var(--accent); opacity:0; transition: opacity .15s ease-out` (CSS keyword `ease-out`) |
| `…__indicator[data-custom="true"] svg` | `20×20` [size-5] |
| `[data-selected="true"] > …__indicator[data-custom="true"]` | `opacity:1` |
| `.checkbox-button-group__item-content` | `display:flex; flex-direction:column; min-width:0` (no gap) |
| `.checkbox-button-group__item-icon` | `flex-shrink:0`; `svg` 24×24 [size-6] |

There is no hover rule and no transition on the card. Selection, ring and border switch instantly
(`getAnimations()` is empty after a click). The default indicator is the OSS checkbox control: 16×16,
`rounded-md` (6px), and the OSS transitions (bg/border 200ms `--ease-out`, `::before` scale .7→1, checkmark
`stroke-dashoffset` 150ms linear 15ms delay). In the `secondary` variant the control uses `bg-default` with no border.

### Measured (viewport 407px, default theme, `--radius: .5rem`)
- Flex demo (Subscription Plans): card 344×126; content at x+21 / y+17 (1px border + padding); indicator 20×20 at
  (w−37, 13). Label `text-lg font-bold` 28px line, description 12px/16px `--muted`.
- Grid demo (3 cols): cards 111.7px wide (gap 12); default indicator 16×16 at (w−33, 13).
- With Icons: ItemContent `flex-row items-center gap-4`; icon 24×24; label + description column `gap-0.5`.
- Group label: OSS `.label` 14px/20px weight 500. In grid demos it gets `col-span-full`.
- Disabled group: cards opacity .5, group `Label` .5 (OSS), group `Description` 1.

### Tokens (light → dark, both themes resolve through the same tokens)
card bg `--surface`, border `--border`, ring `--accent`, focus `--focus` + `--background`, text `--foreground`,
description `--muted`, custom indicator `--accent`. Dark mode needs no extra rules.

---

## 5. Behaviour

- Multi-selection via RAC `CheckboxGroup`. Each card has its own tab stop (the hidden input). Space toggles.
  Clicking anywhere on the card toggles (it is a `<label>`).
- `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-selected` and `data-disabled` come from
  RAC on the card `<label>`. `data-selected` and `data-disabled` are also on the field wrapper.
- `isDisabled` on the root disables every item (inputs get `disabled`, the root gets `aria-disabled` + `data-disabled`).
- Ripple demo: `PressableFeedback.Ripple` is the first child of the item (after the hidden input). The card's
  `position: relative` plus the inherited border-radius clip it.

---

## 6. Demos → stories

| Pro demo URL (`https://heroui.pro/docs/react/demos/…`) | Story | Notes |
|---|---|---|
| `checkbox-button-group-default` (docs "Usage" preview) | `Default` | flex, secondary, `w-[360px]`, group Label + Description, default indicator, `Label capitalize` + Description, 2 of 3 preselected. Measured: label y0, description y32, cards 360×70 at y60/142/224, indicator 16×16 at (327, 13) |
| `checkbox-button-group-subscription-plans` | `SubscriptionPlans` | flex, primary, root `style --accent: <brand>`, custom check-circle indicator, `Label text-lg font-bold`, daily price coloured while selected (render prop), full-width pill button + links |
| `checkbox-button-group-icon-cards` | `IconCards` | flex, `w-[520px]`, items `className="bg-default"`, custom indicator, icon tile `size-8 rounded-lg bg-surface shadow-surface`, label `text-sm font-semibold` + success soft sm `Chip`, `Description mt-2` |
| `checkbox-button-group-grid-layout` | `GridLayout` | grid, secondary, `grid-cols-3 max-w-2xl`, default indicator, `NumberValue mt-2` price `/mo` |
| `checkbox-button-group-with-icons` | `WithIcons` | grid, secondary, `grid-cols-2`, no indicator, ItemContent `flex-row items-center gap-4` + ItemIcon |
| `checkbox-button-group-with-ripple` | `WithRipple` | grid, secondary, `grid-cols-3`, `PressableFeedback.Ripple` + default indicator |
| `checkbox-button-group-disabled-group` | `DisabledGroup` | flex, secondary, `isDisabled`, `w-[360px]`, group Label + Description, `Label capitalize` |
| `checkbox-button-group-controlled` | `Controlled` | `value`/`onChange`, "Selected: a, b" / "None" line below |
| `checkbox-button-group-custom-indicator` | `CustomIndicator` | grid, secondary, `grid-cols-3 max-w-3xl`, custom indicator, `NumberValue mt-3` count + muted suffix (with leading space) |
| `checkbox-button-group-no-indicator` | `NoIndicator` | flex, primary, `w-[360px]`, content only |
| `checkbox-button-group-render-prop-children` | `RenderPropChildren` | children function, price gets `text-accent` while selected |

---

## 7. Dependencies

- OSS `@heroui/react`: `CheckboxGroup`, `Checkbox` (+ `.Content`, `.Control`, `.Indicator`). Stories also use
  `Label`, `Description`, `Chip`, `Button` and `Link`.
- Pro: `NumberValue` and `PressableFeedback.Ripple`, both in stories only.
- No heavy peer, so the component is exported from the package root barrel.

## 8. Deviations

- The disabled rule also matches `[aria-disabled="true"]`, as the docs list it. The Pro CSSOM only has `[data-disabled="true"]`.
- The Subscription Plans demo passes `data-[selected=true]:border-[--sub-green] …bg-[--sub-green]/10`. That is
  v3 arbitrary-value syntax, so Tailwind v4 generates nothing for it and the selected card stays white. The story
  leaves these no-op classes out and gets the same look.
