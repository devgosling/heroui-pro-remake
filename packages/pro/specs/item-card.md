# Item Card — clean-room implementation spec

Slug: `item-card` · Docs: https://heroui.pro/docs/react/components/item-card · Category: Data Display
Storybook title: `Pro/DataDisplay/ItemCard` · Import (Pro): `import {ItemCard} from "@heroui-pro/react";` (root export)

Sources: public docs text, server-rendered DOM of the 12 public demo pages (light + dark), the
stylesheet rules that apply to them (CSSOM), computed styles and runtime probing (keyboard focus,
tooltip, select popover). The paywalled example source was not opened.

---

## 1. Purpose

"A versatile list card with icon, title, description, and optional trailing actions like switches or
selects." It is a plain layout component: no state, no React Aria, no context needed by consumers.
It is the base row of **Item Card Group** (the group restyles `[data-slot=item-card]` children; those
rules live in `item-card-group.css`, not here) and is also used by the Pressable Feedback
"standalone" demos.

---

## 2. Anatomy

```tsx
<ItemCard variant="default">            // div.item-card.item-card--{variant} (or `render` element)
  <ItemCard.Icon>…</ItemCard.Icon>      // optional  div.item-card__icon
  <ItemCard.Content>                    //           div.item-card__content
    <ItemCard.Title />                  //           span.item-card__title
    <ItemCard.Description />            // optional  span.item-card__description
  </ItemCard.Content>
  <ItemCard.Action>…</ItemCard.Action>  // optional  div.item-card__action
</ItemCard>
```

| Part | Element | `data-slot` | BEM class |
|---|---|---|---|
| `ItemCard` (root) | `div` (or whatever `render` returns) | `item-card` | `item-card item-card--{variant}` |
| `ItemCard.Icon` | `div` | `item-card-icon` | `item-card__icon` |
| `ItemCard.Content` | `div` | `item-card-content` | `item-card__content` |
| `ItemCard.Title` | `span` | `item-card-title` | `item-card__title` |
| `ItemCard.Description` | `span` | `item-card-description` | `item-card__description` |
| `ItemCard.Action` | `div` | `item-card-action` | `item-card__action` |

- The variant modifier is always emitted, including `item-card--default`.
- No `data-*` state attributes, no ids, no ARIA on any part (observed on every demo).
- User `className` is appended after the BEM classes (e.g. `item-card item-card--default relative w-full …`).

### Which demos render what host
| Host | Demos |
|---|---|
| `<div>` (default) | all demos except Pressable |
| native `<button type="button">` via `render` | Pressable (both rows); also Pressable Feedback `standalone-highlight` / `standalone-ripple` |
| link | none in the docs (works through `render`, e.g. a router link) |

The button host has no `data-rac` / `data-react-aria-pressable`: it is a plain native button, so
`:hover` / `:active` drive the Pressable Feedback layers.

---

## 3. API (docs)

### `ItemCard`
"The root component. Renders a horizontal row container."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'secondary' \| 'tertiary' \| 'outline' \| 'transparent'` | `'default'` | Visual style variant |
| `children` | `ReactNode` | – | Card content |
| `className` | `string` | – | Additional CSS class |
| `render` | `DOMRenderFunction` | – | Custom render function to override the default div element |

Also supports all native `div` attributes.

### `ItemCard.Icon` / `ItemCard.Content` / `ItemCard.Action`
`children: ReactNode` (icon element / title + description / action content). Native `div` attributes.

### `ItemCard.Title` / `ItemCard.Description`
`children: ReactNode`. Rendered as `span`. Native `span` attributes.

### Implementation mapping
- Root = OSS `dom.div` (exported by `@heroui/react`, same helper the OSS `Card` / `Surface` use), so
  `render(props)` receives every prop including `ref`, `className` and `data-slot`. Typed like OSS
  `Card`: `ItemCard<E extends keyof JSX.IntrinsicElements = "div">`, so `<ItemCard<"button"> render={…}>`
  types the extra props as button attributes.
- Parts read their `tv()` slots from `ItemCardContext`; outside a root they fall back to default slots.
- Compound: `ItemCard.Root/Icon/Content/Title/Description/Action`, named exports `ItemCardRoot…`,
  `ItemCardContext`, `itemCardVariants`, type namespace `ItemCard["Props" | "IconProps" | …]`.

---

## 4. Styling (measured; tokens → Tailwind)

All values are theme tokens, so light/dark, `--radius` and fonts follow the HeroUI theme. Light and dark
were compared element by element on all 12 demos.

### `.item-card`
| Property | Value | Utility |
|---|---|---|
| layout | `display:flex; align-items:center; gap:12px` | `flex items-center gap-3` |
| padding | `12px 16px` | `px-4 py-3` |
| radius | `calc(var(--radius) * 2)` = 16px | spelled out (a scoped `--radius` must apply) |
| height | 62px with icon + title + description; 64px for outline (1px border) | – |

No hover, focus, active or disabled styles in Pro, and none in the remake either (a `render`ed
button keeps the browser's native `outline: auto` focus ring, exactly like the Pro page).

### Variants
| Class | Light | Dark | Utility |
|---|---|---|---|
| `--default` | `bg var(--surface)` + `var(--surface-shadow)` (`0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f`) | surface, shadow is transparent inset in dark | `bg-surface shadow-surface` |
| `--secondary` | `var(--surface-secondary)` | same token | `bg-surface-secondary` |
| `--tertiary` | `var(--surface-tertiary)` | same token | `bg-surface-tertiary` |
| `--outline` | `1px solid var(--border)`, transparent bg | same | `border border-border bg-transparent` |
| `--transparent` | transparent bg, shadow none | same | `bg-transparent shadow-none` |
| secondary / tertiary icon | `> [data-slot=item-card-icon]` gets `color-mix(var(--surface) 50%, transparent)` | same | `bg-surface/50` |

### Parts
| Part | Declarations | Utility |
|---|---|---|
| `__icon` | 36×36, `border-radius: var(--radius)` (8px), `bg var(--default)`, `color var(--foreground)`, flex centre, `flex-shrink:0` | `flex size-9 shrink-0 items-center justify-center bg-default text-foreground` |
| `__icon svg` | 16×16 | `size-4` |
| `__content` | `display:flex; flex-direction:column; flex:1; min-width:0` | `flex min-w-0 flex-1 flex-col` |
| `__title` | 14px/20px, weight 500, `var(--foreground)`, `overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:fit-content` | `w-fit max-w-full truncate text-sm font-medium text-foreground` (`max-w-full` is ours, see below) |
| `__description` | 12px/16px, `var(--muted)`, `margin-top:2px`, truncate, `width:fit-content` | `mt-0.5 w-fit max-w-full truncate text-xs text-muted` (`max-w-full` is ours, see below) |
| `__action` | `flex-shrink:0; margin-inline-start:auto; padding-inline-start:8px` | `ms-auto shrink-0 ps-2` |

Measured offsets inside a default card (light & dark identical): icon at (16, 13); title at (64, 12);
description at (64, 34); a 16px chevron action ends 16px from the right edge; an `sm` button action is
36px tall at y=13. Demo frames are `w-[500px]` (email setting `w-[600px]`), `p-6`, stacks `space-y-2` /
`space-y-3` / `space-y-4`.

**Truncation (deliberate deviation from Pro):** in Pro, `width: fit-content` + `nowrap` resolves to the
full text width, so long titles/descriptions do not ellipsize; they overflow `__content` and run under
`__action`. Verified on the Pro page by replacing the text (title 440px inside a 336px content box). The
remake adds `max-width: 100%` to both, so the text keeps its fit-content width while it fits and
ellipsizes at the content box once it doesn't (seen in a 375px consumer row: a 181px description under
a segment action in a 131px content box). Short texts render exactly as in Pro. Story: `NarrowRow`.

### Pressable host (native button)
Classes added by the demo: `relative w-full cursor-pointer overflow-hidden`. Inherited button styles from
Tailwind preflight: transparent bg replaced by the variant bg, `text-align:center` (no visible effect,
spans are fit-content), `font: inherit`. Pro keyboard focus shows only the browser's native
`outline: auto 1px`.

---

## 5. Behaviour

- Static layout; no events, no state, no animation, no timings.
- Pressable demo: hover/press feedback comes entirely from `PressableFeedback.Highlight` / `.Ripple`
  placed as the first child of the button (they use `border-radius: inherit` → 16px and the host's
  `overflow-hidden`).
- Email Setting: OSS `Tooltip` ("Actions", placement top) around an OSS `Dropdown` trigger. Keyboard
  order: first Tab focuses the `div.tooltip__trigger` (role=button, tabindex 0) and opens the tooltip,
  second Tab the icon button.
- With Select / With Multi Select: Pro **Inline Select** (`div.select.select--primary.inline-select` →
  `button.select__trigger.inline-select__trigger` 24px tall, `padding 2px 4px`, gap 8px, radius
  `calc(var(--radius) * .75)`, muted 14px text, 12px expand-chevrons indicator, value max-width
  `--inline-select-value-max-width` 12rem default / 8rem in the multi demo, set as an inline style on the
  root). The popover (`select__popover inline-select__popover`, placement bottom end) is content-sized with
  `min-width: var(--trigger-width)` (measured 124px for the single demo, 161px for the multi demo). Multi
  value is RAC's list format ("A and B"). The stories use the package's own `InlineSelect`.

---

## 6. Demos (12) → stories

| # | Demo (`/docs/react/demos/item-card-…`) | Pro structure | Story export |
|---|---|---|---|
| 1 | `default` (Usage) | icon (globe) · title + description · outline `sm` Button with text + `size-3.5 rtl:-scale-x-100` arrow icon | `Default` |
| 2 | `wallet-card` | icon `size-10 rounded-full bg-green-500 text-lg` with an emoji · name + short address · action `flex items-center gap-2`: right-aligned amount (`text-sm font-semibold text-foreground`) + sub amount (`text-xs text-muted`), ghost icon-only `sm` Dropdown trigger | `WalletCard` |
| 3 | `device-list` | `space-y-2`, 3 cards: device icon · name + "last active"; first action success soft `sm` Chip, others outline `sm` Button | `DeviceList` |
| 4 | `variants` | `space-y-3 p-6`, one card per variant with chevron-right (`text-muted size-4 rtl:-scale-x-100`) | `Variants` |
| 5 | `without-icon` | no Icon part · danger-soft `sm` Button | `WithoutIcon` |
| 6 | `title-only` | icon · Title only · chevron | `TitleOnly` |
| 7 | `with-switch` | icon · title + description · OSS Switch (`aria-label`) | `WithSwitch` |
| 8 | `with-select` | icon · title + description · Inline Select (single) | `WithSelect` |
| 9 | `with-multi-select` | same with `selectionMode="multiple"`, value max-width 8rem | `WithMultiSelect` |
| 10 | `vertical-stack` | `space-y-2`, three chevron rows | `VerticalStack` |
| 11 | `email-setting` | `w-[600px]`, no icon · Title = address + default soft `sm` Chip `ml-2 align-middle` · description · Tooltip › Dropdown › outline icon-only `sm` Button | `EmailSetting` |
| 12 | `pressable` | `space-y-4`; two `render`ed `<button type="button">` cards with `relative w-full cursor-pointer overflow-hidden`; first holds `PressableFeedback.Highlight`, second `PressableFeedback.Ripple` and `Content className="w-full flex-1"` | `Pressable` |

Story ids: `pro-datadisplay-itemcard--{default|wallet-card|device-list|variants|without-icon|title-only|with-switch|with-select|with-multi-select|vertical-stack|email-setting|pressable}`.
All stories use their own texts/icons/data. `variant` is an arg (select control) on every story except
`Variants`.

---

## 7. Dependencies

- OSS (`@heroui/react`): `dom` render helper (component); Button, Chip, Dropdown, Label, ListBox, Select,
  Switch, Tooltip (stories only).
- Pro: Pressable Feedback and Inline Select (stories only).
- No heavy peers → root export is fine.

---

## 8. Deviations / notes

1. **No focus / disabled styling (parity).** Pro has no focus or disabled style; a `render`ed button shows
   the browser's native outline. The remake does the same (an earlier draft added `status-focused` /
   `status-disabled`, removed during review because the Pressable demo's keyboard focus then looked
   different).
2. **Wallet Card icon on the docs site.** The Pro docs stylesheet ships an extra *unlayered* copy of the
   Item Card rules, so on the demo page `.item-card__icon` beats the demo's utilities
   (`size-10 rounded-full bg-green-500`): the icon renders as the default 36px, 8px-radius, `bg-default`
   tile and only `text-lg` (no conflict) applies. Our CSS is in `@layer components`, so utilities win as
   in every OSS component. The story therefore passes only `text-lg` to reproduce what the Pro page
   shows; passing the size/shape/colour utilities gives the intended coloured circle.
3. Story frames add `text-foreground` (Pro demo pages set it on `<body>`; Storybook's body is black),
   so inherited text in custom action content matches.

---

## Appendix A — CSSOM reference (Pro demo pages, `@layer components`, item-card only)

```
.item-card { align-items:center; gap:calc(var(--spacing)*3); border-radius:calc(var(--radius)*2);
  padding-inline:calc(var(--spacing)*4); padding-block:calc(var(--spacing)*3); display:flex }
.item-card--default { background-color:var(--surface); --tw-shadow:var(--surface-shadow); box-shadow:… }
.item-card--secondary { background-color:var(--surface-secondary) }
.item-card--tertiary { background-color:var(--surface-tertiary) }
:is(.item-card--secondary,.item-card--tertiary)>[data-slot=item-card-icon] { background-color:var(--surface) }
@supports (color:color-mix(in lab,red,red)) { … { background-color:color-mix(in oklab,var(--surface) 50%,transparent) } }
.item-card--outline { border-style:var(--tw-border-style); border-width:1px; border-color:var(--border); background-color:#0000 }
.item-card--transparent { --tw-shadow:0 0 #0000; box-shadow:…; background-color:#0000 }
.item-card__icon { width/height:calc(var(--spacing)*9); border-radius:calc(var(--radius)*1);
  background-color:var(--default); color:var(--foreground); flex-shrink:0; justify-content:center; align-items:center; display:flex }
.item-card__icon svg { width/height:calc(var(--spacing)*4) }
.item-card__content { flex-direction:column; flex:1; min-width:0; display:flex }
.item-card__title { text-overflow:ellipsis; white-space:nowrap; width:fit-content; font-size:var(--text-sm);
  line-height:var(--text-sm--line-height); font-weight:var(--font-weight-medium); color:var(--foreground); overflow:hidden }
.item-card__description { margin-top:calc(var(--spacing)*.5); text-overflow:ellipsis; white-space:nowrap; width:fit-content;
  font-size:var(--text-xs); line-height:var(--text-xs--line-height); color:var(--muted); overflow:hidden }
.item-card__action { flex-shrink:0; margin-inline-start:auto; padding-inline-start:calc(var(--spacing)*2) }
```

Group-owned rules seen in the same sheet (implemented by `item-card-group`, not here):
`.item-card-group>[data-slot=item-card]` (flat, no radius/border/shadow), secondary/tertiary group icon
tint, `.item-card-group--grid>[data-slot=item-card]` (radius ×2, surface + surface shadow).
