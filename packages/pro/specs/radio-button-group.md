# Radio Button Group — clean-room implementation spec

Slug: `radio-button-group` · Docs: https://heroui.pro/docs/react/components/radio-button-group ·
Storybook title: `Pro/Forms/RadioButtonGroup`
Import (Pro): `import {RadioButtonGroup} from "@heroui-pro/react";` (root export, no heavy peer)

Sources used: public docs text, the rendered DOM (live DOM, and the server-rendered markup for demos whose
client render stalled in a background tab) and CSSOM of the 12 public demo pages (light + dark), computed
styles, runtime probing (click, ArrowDown, focus ring, `getAnimations()`), and the OSS HeroUI source in this
repo (`packages/react/src/components/radio*`, `packages/styles/components/radio*.css`) to tell which classes
come from OSS. I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A single-selection group of card-style radios. Each item is a bordered card. The selected card gets a 2px
inset accent ring instead of its border. An optional indicator sits in the top-end corner. It is either the
OSS radio control (dot) or a custom icon that fades in while selected. The component is a thin layer over the
**OSS HeroUI** `RadioGroup` and `Radio` (`Radio.Content`, `Radio.Control`, `Radio.Indicator`), so every
RadioGroup / Radio prop (`variant`, `value`, `defaultValue`, `onChange`, `isDisabled`, `name`, `orientation`,
validation, ...) behaves exactly as in OSS.

It is the single-select twin of Checkbox Button Group. Pro ships it as its own parallel `.radio-button-group*`
block with the same rules; no class is shared with `.checkbox-button-group*`.

---

## 2. Anatomy

```tsx
<RadioButtonGroup>                          // OSS RadioGroup (RAC RadioGroup)
  <Label />  <Description />                // optional OSS group label / description
  <RadioButtonGroup.Item value="a">         // OSS Radio (RAC RadioField) + Radio.Content (RAC RadioButton)
    <PressableFeedback.Ripple />            // optional (demos "With Ripple", "Subscription Plans")
    <RadioButtonGroup.Indicator />          // optional; default = Radio.Control + Radio.Indicator
    <RadioButtonGroup.ItemContent>          // div
      <RadioButtonGroup.ItemIcon />         // optional div
      <Label />  <Description />
    </RadioButtonGroup.ItemContent>
  </RadioButtonGroup.Item>
</RadioButtonGroup>
```

| Part | Rendered element | `data-slot` | Classes | Primitive |
|---|---|---|---|---|
| Root | `<div role="radiogroup" aria-orientation data-orientation data-rac aria-labelledby aria-describedby [aria-disabled data-disabled]>` | `radio-button-group` | `radio-group radio-group--{primary\|secondary} radio-button-group [radio-button-group--grid] {className}` | OSS `RadioGroup` (data-slot overridden) |
| Item (field) | `<div data-rac [data-selected data-disabled]>` | `radio-button-group-item` | `radio` | OSS `Radio` root (RAC `RadioField`, data-slot overridden) |
| Item (card) | `<label data-rac data-react-aria-pressable [data-selected data-hovered data-pressed data-focused data-focus-visible data-disabled]>`, visually hidden `<input type="radio" name value>` first (roving `tabindex` 0 / -1) | `radio-content` (OSS) | `radio__content radio-button-group__item {className}` | OSS `Radio.Content` (RAC `RadioButton`) |
| Indicator (default) | `<span>` > `<span aria-hidden class="radio__indicator" data-slot="radio-indicator">` (empty, dot drawn by `::before`) | `radio-button-group-indicator` | `radio__control radio-button-group__indicator {className}` | OSS `Radio.Control` + `Radio.Indicator` |
| Indicator (custom) | `<span data-custom="true">{children}</span>` | `radio-button-group-indicator` | `radio-button-group__indicator {className}` | DOM |
| ItemContent | `<div>` | `radio-button-group-item-content` | `radio-button-group__item-content {className}` | DOM |
| ItemIcon | `<div>` | `radio-button-group-item-icon` | `radio-button-group__item-icon {className}` | DOM |

Notes
- Because the field wrapper has `data-slot="radio-button-group-item"` (not `radio`), the OSS rule
  `.radio-group[data-orientation="vertical"] [data-slot="radio"] { margin-top: 1rem }` does not hit the items.
- The Item's `className` lands on the **card** (`Radio.Content`), not on the field wrapper. Observed:
  `className="bg-default"` (Icon Cards) and `border-none ring-transparent transition-colors duration-150
  data-[selected=true]:bg-foreground` (Subscription Plans) on the `<label>`. Other props (`value`, `isDisabled`,
  `style`, `ref`, ...) go to the field wrapper, which is `display: contents`.
- Item `children` may be a render function. It receives the RAC `RadioButton` render props (`isSelected`,
  `isHovered`, `isPressed`, `isFocusVisible`, `isDisabled`, ...). "Render Prop Children" adds `text-accent` to the
  price while selected; "Subscription Plans" switches label/description to `text-background` while selected.
- Label / Description inside an item are the OSS `Label` (rendered as `<span class="label">` because
  `Radio.Content` provides `LabelContext {elementType: "span"}`) and `Description`
  (`<span class="description" slot="description">`, wired into the input's `aria-describedby`).
- `layout="flex"` emits **no** modifier class. Only `grid` adds `radio-button-group--grid`.
- The docs say ItemContent "wraps HeroUI Radio.Content". In the rendered DOM it is a plain `<div>` inside the
  `Radio.Content` label. The implementation follows the DOM.
- The docs anatomy lists ItemIcon as a direct child of Item. Every demo puts it inside ItemContent (with
  `ItemContent className="flex-row ..."`); both work because both are plain divs.

---

## 3. API (from docs)

### `RadioButtonGroup` (root)
"The root component. Wraps HeroUI RadioGroup with card-style layout." Also supports all HeroUI RadioGroup props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `'flex' \| 'grid'` | `'flex'` | Layout mode for items |

Plus every OSS `RadioGroup` prop: `variant` (`primary` | `secondary`, styles the default radio control through
`.radio-group--secondary .radio__control`), `defaultValue`, `value` + `onChange`, `isDisabled`, `isReadOnly`,
`isRequired`, `isInvalid`, `name`, `orientation` (default `vertical`; only sets aria/data attributes here, the
layout comes from `.radio-button-group`), `className`, `style`, `ref`.

### `RadioButtonGroup.Item`
"A selectable card wrapping HeroUI Radio. Supports render prop children for accessing selection state." Also
supports all HeroUI Radio props (`value`, `isDisabled`, `style`, `ref`, ... on the field wrapper) plus
`className`, which goes to the card.

### `RadioButtonGroup.Indicator`
"Selection indicator positioned at the top-right of the item."

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | - | Custom indicator icon (shown when selected) |

No children: the default HeroUI radio dot (Control + Indicator). With children: a custom icon that appears only
when selected. Also supports all native `span` attributes.

### `RadioButtonGroup.ItemContent`
"Content area for title and description text. Wraps HeroUI Radio.Content." `children: ReactNode`. Also supports
all native `div` attributes.

### `RadioButtonGroup.ItemIcon`
"Leading icon container." `children: ReactNode`. Also supports all native `div` attributes.

### CSS classes / variables / states (docs)
- Base: `.radio-button-group`, `.radio-button-group__item`, `.radio-button-group__indicator`,
  `.radio-button-group__item-content`, `.radio-button-group__item-icon`. Layout: `.radio-button-group--grid`.
- `--radio-button-group-item-radius` (default `var(--radius-2xl)`).
- States: Selected `[data-selected="true"]` → accent ring. Focus visible `:focus-visible` /
  `[data-focus-visible="true"]` → focus ring. Disabled `:disabled` / `[aria-disabled="true"]` → reduced opacity.
  In the CSSOM the disabled selector is `[data-disabled="true"]`; the remake matches all three.

---

## 4. Styling (CSSOM, all in `@layer components`)

| Selector | Declarations (Tailwind equivalent) |
|---|---|
| `.radio-button-group` | `display:flex; gap:12px` [flex gap-3]; `--radio-button-group-item-radius: var(--radius-2xl)`. `flex-direction: column` comes from the OSS `.radio-group` |
| `.radio-button-group--grid` | `display:grid` (columns come from the user, e.g. `grid-cols-1 sm:grid-cols-3`) |
| `.radio-button-group > [data-slot="radio-button-group-item"]` | `display: contents` |
| `.radio-button-group__item` | `position:relative; display:flex; flex-direction:column; align-items:stretch; gap:16px` [gap-4]; `padding: 16px 20px` [py-4 px-5]; `border:1px solid var(--border)`; `background: var(--surface)`; `border-radius: var(--radio-button-group-item-radius)`; `outline:none`; tap-highlight transparent; `cursor: var(--cursor-interactive)`. Text inherits OSS `.radio__content`: 14px/20px, weight 500, `color: var(--foreground)`. (Unlike the checkbox twin there is no `ring-transparent` here.) |
| `…__item[data-selected="true"]` | `border-color: transparent` + `ring-2 ring-inset ring-accent` (box-shadow `inset 0 0 0 2px var(--accent)`) |
| `…__item:focus-visible:not([data-focused]), …__item[data-focus-visible="true"]` | `status-focused`. Selected + keyboard focus gives inset `0 0 0 2px var(--background)` + inset `0 0 0 4px var(--focus)` because `--tw-ring-inset` from the selected rule persists |
| `…__item[data-disabled="true"]` | `status-disabled` (opacity `var(--disabled-opacity)` = .5, `cursor: var(--cursor-disabled)`, `pointer-events:none`) |
| `.radio-button-group__indicator` | `position:absolute; top:12px; inset-inline-end:16px` [top-3 end-4] |
| `…__indicator[data-custom="true"]` | `color: var(--accent); opacity:0; transition: opacity .15s ease-out` (CSS keyword `ease-out`) |
| `…__indicator[data-custom="true"] svg` | `20×20` [size-5] |
| `[data-selected="true"] > …__indicator[data-custom="true"]` | `opacity:1` |
| `.radio-button-group__item-content` | `display:flex; flex-direction:column; min-width:0` (no gap) |
| `.radio-button-group__item-icon` | `flex-shrink:0`; `svg` 24×24 [size-6] |

There is no hover rule and no transition on the card itself; ring and border switch instantly. After a click
`getAnimations()` only lists the OSS radio control transitions (border-color / background-color 200ms
`--ease-out`, dot `::before` scale 1 → .4286 and background-color 200ms, press `scale: 95%` 100ms). In the
`secondary` variant the control is `bg-default` with no shadow and no visible border (OSS
`.radio-group--secondary .radio__control`).

### Measured (viewport 447px, default theme, `--radius: .5rem`)
- Usage/Default demo (`w-[min(360px,…)]`): card 360×98; content at x+21 / y+17 (1px border + padding); default
  indicator 16×16 at (w−33, 13). Group label 20px line, 12px gap to the group description and to the first card.
- Delivery / Grid demos: card 102 tall (label + description `gap-1`, price `mt-2`). Payment / With Icons: card 72
  tall, ItemIcon 24×24, text column at x+61 (`gap-4`), label + description `gap-0.5`.
- Custom indicator: 20×20 at (w−37, 13). Subscription Plans overrides with `top-1/2 -translate-y-1/2`.
- Icon Cards: card 126 tall, tile `size-8 rounded-lg bg-surface shadow-surface` with a 16px icon, label
  `text-sm font-semibold` + success soft sm `Chip`, price `text-2xl font-bold` with `text-sm` muted suffix.
- With Ripple: card 94 tall; ripple `inset:0` inside the border (397×92 for a 399 card), clipped by the radius.
- Disabled group: cards .5, card label/description .5 × .5 (OSS `.radio[data-disabled] [data-slot=description]`),
  group `Label` .5, group `Description` 1.

### Tokens (light → dark, both themes resolve through the same tokens)
card bg `--surface`, border `--border`, ring `--accent`, focus `--focus` + `--background`, text `--foreground`,
description `--muted`, custom indicator `--accent`, radio dot `--accent` / `--accent-foreground`, secondary
control `--default`. Dark mode needs no extra rules (dark card bg = `--surface`, border = `--border`).

---

## 5. Behaviour

- Single selection via RAC `RadioGroup`: one tab stop (roving tabindex on the hidden inputs); Arrow keys move
  **and** select; clicking anywhere on a card selects it (it is a `<label>`).
- `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-selected` and `data-disabled` come
  from RAC on the card `<label>`; `data-selected` / `data-disabled` are also on the field wrapper.
- Verified on both sides: click card 1 → `data-hovered,data-selected,data-focused`; then ArrowDown → card 2 gets
  `data-selected,data-focused,data-focus-visible` and the double inset ring.
- `isDisabled` on the root disables every item (inputs get `disabled`, root gets `aria-disabled` +
  `data-disabled`).
- Ripple: `PressableFeedback.Ripple` is the first child of the item (after the hidden input); the card's
  `position: relative` plus the inherited border-radius clip it.

---

## 6. Demos → stories

| Pro demo URL (`https://heroui.pro/docs/react/demos/…`) | Story | Notes |
|---|---|---|
| `radio-button-group-default` (Usage) | `Default` | flex, secondary, `w-[min(360px,calc(100vw-2rem))]`, group Label + Description, default indicator, `Label capitalize`, Description, `NumberValue mt-2 text-sm font-semibold` + muted `/mo` |
| `radio-button-group-delivery-and-payment` | `DeliveryAndPayment` | `flex w-full max-w-lg flex-col items-center gap-10` with two `section.flex.w-full.flex-col.gap-4`: grid secondary `grid-cols-1 sm:grid-cols-3` (indicator, label/description `gap-1`, 2-decimal price) and grid secondary `grid-cols-1 sm:grid-cols-2` (no indicator, ItemContent `flex-row items-start gap-4` + ItemIcon with a 24px colour logo) |
| `radio-button-group-subscription-plans` | `SubscriptionPlans` | flex primary `w-[min(400px,…)]`; item `border-none ring-transparent transition-colors duration-150 data-[selected=true]:bg-foreground`; Ripple; custom check-circle indicator in a brand colour, `top-1/2 -translate-y-1/2`; render prop: `Label text-xl font-bold (+ text-background)`, `Description mt-1 (+ text-background/70)`; badge `Chip size=sm absolute -top-1.5 -left-1 w-fit` with brand bg |
| `radio-button-group-grid-layout` | `GridLayout` | first group of Delivery with `w-full max-w-2xl` |
| `radio-button-group-with-icons` | `WithIcons` | payment group with `w-full max-w-2xl` and `items-center` |
| `radio-button-group-icon-cards` | `IconCards` | flex primary `w-[min(520px,…)]`, 5 items `className="bg-default"`, custom indicator, icon tile + label + Chip, `mt-2 flex items-center justify-between` price row, `Description mt-1` |
| `radio-button-group-with-ripple` | `WithRipple` | grid secondary `grid-cols-1 sm:grid-cols-3 w-full max-w-2xl`, `Ripple className="text-muted/50"`, default indicator, mono `text-xs text-muted mt-2` code line |
| `radio-button-group-disabled-group` | `DisabledGroup` | Usage demo + `isDisabled` and another group description |
| `radio-button-group-controlled` | `Controlled` | wrapper `flex w-[min(360px,…)] flex-col gap-4`, `value`/`onChange`, `p.text-sm.text-muted` "Selected: <span.font-medium.text-foreground>" |
| `radio-button-group-custom-indicator` | `CustomIndicator` | grid secondary `grid-cols-1 sm:grid-cols-3 w-full max-w-2xl`, custom indicator, `NumberValue mt-3` count + muted suffix with a leading space |
| `radio-button-group-no-indicator` | `NoIndicator` | flex primary, group Label only, content only |
| `radio-button-group-render-prop-children` | `RenderPropChildren` | flex secondary, group Label only, default indicator, price gets `text-accent` while selected |

The stories use a decorator that reproduces the Pro demo frame (`min-h-screen`, centred, `p-6`) so `w-full`
demos fill the width like on heroui.pro. With that frame the measured card boxes match the Pro demos 1:1
(the only width difference is Pro's 15px native scrollbar).

The Subscription Plans demo has no visible group label, so React Aria logs an a11y warning on heroui.pro too. The
story adds `aria-label="Billing plan"` to the root, which removes the warning and changes nothing visible.

### Review pass (independent re-measurement, viewport 447px, light + dark)
- All 12 demos re-measured live against the stories, including With Icons and Icon Cards once the Pro tab was in
  the foreground. Card, indicator, content, icon and typography boxes, data attributes, resolved colours (light
  for all demos, dark for Default / Icon Cards / Subscription Plans), ring and focus box-shadows, disabled opacities and cursors, hover (control dot `--default-hover`, card
  unchanged), keyboard Tab + ArrowDown selection and the custom-indicator opacity cross-fade (0 → 1 in about 150ms,
  `ease-out`, sampled per frame) were identical.
- Theme check: `--radius: 1rem` gives a 32px card radius (`--radius-2xl`), `--accent` recolours the selected ring
  and the radio control, and `--font-sans` changes the card font. There are no hard-coded values.
- Ripple: on Pro `.pressable-feedback__ripple-surface` is `position: static` (0px tall), and its `::before`/`::after`
  waves are placed against the absolutely positioned `.pressable-feedback__ripple`. Ours is `absolute inset-0`.
  Both cover the same area, so the waves look the same. That code belongs to pressable-feedback, not to this component.

---

## 7. Dependencies

- OSS `@heroui/react`: `RadioGroup`, `Radio` (+ `.Content`, `.Control`, `.Indicator`). Stories also use `Label`,
  `Description` and `Chip`.
- Pro: `NumberValue` and `PressableFeedback.Ripple`, both in stories only.
- No heavy peer, so the component can be exported from the package root barrel.

## 8. Deviations

- The disabled rule also matches `:disabled` and `[aria-disabled="true"]`, as the docs list them. The Pro CSSOM
  only has `[data-disabled="true"]`.
- Story content (texts, prices, icons) is original. The payment demo uses three hand-drawn, brand-neutral 24px
  card/wallet marks instead of real payment-network logos.

## 9. Raw CSSOM reference (`@layer components`, Pro demo page)

```
.radio-button-group { gap: calc(var(--spacing) * 3); --radio-button-group-item-radius: var(--radius-2xl); display: flex; }
.radio-button-group--grid { display: grid; }
.radio-button-group > [data-slot="radio-button-group-item"] { display: contents; }
.radio-button-group__item { align-items: stretch; gap: calc(var(--spacing) * 4); padding-inline: calc(var(--spacing) * 5); padding-block: calc(var(--spacing) * 4); --tw-outline-style: none; -webkit-tap-highlight-color: transparent; border-style: var(--tw-border-style); border-width: 1px; border-color: var(--border); background-color: var(--surface); border-radius: var(--radio-button-group-item-radius); cursor: var(--cursor-interactive); outline-style: none; flex-direction: column; display: flex; position: relative; }
.radio-button-group__item[data-selected="true"] { ring 2px inset var(--accent); border-color: transparent; }
.radio-button-group__item:focus-visible:not([data-focused]), .radio-button-group__item[data-focus-visible="true"] { status-focused (ring --focus, offset --ring-offset-width in --background) }
.radio-button-group__item[data-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }
.radio-button-group__indicator { inset-inline-end: calc(var(--spacing) * 4); top: calc(var(--spacing) * 3); position: absolute; }
.radio-button-group__indicator[data-custom="true"] { color: var(--accent); opacity: 0; transition: opacity .15s ease-out; }
.radio-button-group__indicator[data-custom="true"] svg { width/height: calc(var(--spacing) * 5); }
[data-selected="true"] > .radio-button-group__indicator[data-custom="true"] { opacity: 1; }
.radio-button-group__item-content { flex-direction: column; min-width: 0; display: flex; }
.radio-button-group__item-icon { flex-shrink: 0; }
.radio-button-group__item-icon svg { width/height: calc(var(--spacing) * 6); }
```
