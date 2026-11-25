# Item Card Group — clean-room implementation spec

Slug: `item-card-group` · Docs: https://heroui.pro/docs/react/components/item-card-group · Category: Data Display
Storybook title: `Pro/DataDisplay/ItemCardGroup` · Import (Pro): `import {ItemCard, ItemCardGroup} from "@heroui-pro/react";`

Sources: public docs text, server-rendered and live DOM of the 12 public demo pages (light + dark), the
stylesheet rules that apply to them (CSSOM), computed styles, geometry and runtime probing (hover on
pressable rows, tooltip, dropdown and inline-select popovers). The paywalled example source was not opened.

---

## 1. Purpose

"A layout component for grouping item cards in list or grid arrangements, with optional section headers
and dividers." Two layouts:

- **list**: the group is one surface (bg / shadow / border / radius from the variant); the item cards
  inside drop their own chrome and stack flush. Dividers are plain OSS `Separator`s placed between rows by
  the consumer (the "automatic dividers" of the docs are not CSS: rows without a Separator touch, see the
  With Header / Permission Levels demos).
- **grid**: the group itself is clear; every item card gets its own raised surface (radius ×2, surface bg,
  surface shadow) and the cards sit in an N-column CSS grid with a 12px gap.

Static layout component: no state, no keyboard handling, no animation. The group never imports or renders
`ItemCard`; it restyles `[data-slot="item-card"]` children, so it has no dependency beyond React.

---

## 2. Anatomy

```tsx
<ItemCardGroup layout="list" variant="default" columns={2}>   // div.item-card-group[role=group]
  <ItemCardGroup.Header>                                       // optional div.item-card-group__header
    <ItemCardGroup.Title />                                    // h3.item-card-group__title
    <ItemCardGroup.Description />                              // optional p.item-card-group__description
  </ItemCardGroup.Header>
  <ItemCard>…</ItemCard>
  <Separator />                                                // OSS, optional
  <ItemCard>…</ItemCard>
</ItemCardGroup>
```

| Part | Element | `data-slot` | BEM class | Other |
|---|---|---|---|---|
| `ItemCardGroup` | `div` | `item-card-group` | `item-card-group item-card-group--{layout} item-card-group--{variant}` + className | `role="group"`; `style="--item-card-group-columns:N"` when `columns` is passed on a grid |
| `.Header` | `div` | `item-card-group-header` | `item-card-group__header` | – |
| `.Title` | `h3` | `item-card-group-title` | `item-card-group__title` | – |
| `.Description` | `p` | `item-card-group-description` | `item-card-group__description` | – |

Observed markup (list demo, trimmed):

```html
<div class="item-card-group item-card-group--list item-card-group--default w-[500px]" data-slot="item-card-group" role="group">
  <div class="item-card item-card--default" data-slot="item-card">…</div>
  <hr data-orientation="horizontal" data-slot="separator" role="separator" class="separator separator--horizontal separator--default">
  <div class="item-card item-card--default" data-slot="item-card">…</div>
</div>
```

- Modifier order is always layout first, then variant (`--list --default`, `--grid --default`).
- The modifiers are always emitted, including the defaults.
- The grid demo without `columns` has **no** style attribute; `columns={3}` renders
  `style="--item-card-group-columns:3"`.
- No `aria-labelledby`, no `data-*` state attributes on any part. Nested groups (Usage demo) each carry
  `role="group"`.
- Item cards inside groups are always rendered with their own default variant (`item-card--default`);
  the group does not pass a variant down.

---

## 3. API (docs)

### `ItemCardGroup`
| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `'list' \| 'grid'` | `'list'` | Layout mode |
| `variant` | `'default' \| 'secondary' \| 'tertiary' \| 'outline' \| 'transparent'` | `'default'` | Visual style |
| `columns` | `2 \| 3` | `2` | Grid column count, used when `layout` is `"grid"` |
| `children` | `ReactNode` | – | Item cards, separators, and headers |

Accepts all native `div` attributes.

### `ItemCardGroup.Header` — `children` (title and description elements); native `div` attributes.
### `ItemCardGroup.Title` — rendered as `h3`; `children`; native `h3` attributes.
### `ItemCardGroup.Description` — rendered as `p`; `children`; native `p` attributes.

### CSS classes / variables (docs "Styling Reference")
Base `.item-card-group`, `__header`, `__title`, `__description`; variants `--default`, `--secondary`,
`--tertiary`, `--outline`, `--transparent`; layouts `--list`, `--grid`. Variable
`--item-card-group-columns` (default `2`, set through `columns`).

### Implementation mapping
- `ItemCardGroupRoot` (plain `div`, React 19 `ref` prop), parts read slots from `ItemCardGroupContext`
  (`{layout, variant, slots}`; defaults when used outside a root). `useItemCardGroupContext()` exported.
- `columns` writes `--item-card-group-columns` only when `layout === "grid"` and `columns` is defined; the
  user `style` is spread after it, so an explicit style still wins.
- `role="group"` is set before `...rest`, so it can be overridden.
- Compound: `ItemCardGroup.Root/Header/Title/Description`; named exports `ItemCardGroupRoot`,
  `ItemCardGroupHeader`, `ItemCardGroupTitle`, `ItemCardGroupDescription`, `ItemCardGroupContext`,
  `useItemCardGroupContext`, `itemCardGroupVariants`; types `ItemCardGroupProps`, `ItemCardGroupRootProps`,
  `…HeaderProps`, `…TitleProps`, `…DescriptionProps`, `ItemCardGroupLayout`, `ItemCardGroupVariant`,
  `ItemCardGroupColumns`, `ItemCardGroupVariants`, type namespace `ItemCardGroup["Props" | …]`.
- No heavy peers → root export is fine (like `ItemCard`).

---

## 4. Styling (measured; tokens → Tailwind)

All values are theme tokens (light/dark, `--radius`, fonts follow the theme). Light and dark compared on
Variants, Grid Three Columns, Permission Levels; rules are layered `@layer components`.

### Root and children
| Selector | Declarations | Utility |
|---|---|---|
| `.item-card-group` | `border-radius: calc(var(--radius) * 2)` (16px) | spelled out (scoped `--radius`) |
| `.item-card-group > [data-slot=item-card]` | border 0, transparent bg, no shadow, radius 0 | `rounded-none border-0 bg-transparent shadow-none` |

### Variants (source order matters: the grid layout below resets bg / shadow)
| Class | Declarations | Utility |
|---|---|---|
| `--default` | `bg var(--surface)` + `var(--surface-shadow)` | `bg-surface shadow-surface` |
| `--secondary` | `bg var(--surface-secondary)` | `bg-surface-secondary` |
| `--tertiary` | `bg var(--surface-tertiary)` | `bg-surface-tertiary` |
| `:is(--secondary,--tertiary) [data-slot=separator]` | `color-mix(var(--muted) 10%, transparent)` | `bg-muted/10` |
| `:is(--secondary,--tertiary) > item-card > item-card-icon` | `color-mix(var(--surface) 50%, transparent)` | `bg-surface/50` |
| `--outline` | 1px solid `var(--border)`, transparent bg, no shadow | `border border-border bg-transparent shadow-none` |
| `--transparent` | transparent bg, no shadow, radius 0 | `rounded-none bg-transparent shadow-none` |

### Header
| Selector | Declarations | Utility |
|---|---|---|
| `__header` | `padding: 16px 16px 8px` | `px-4 pt-4 pb-2` |
| `__title` | 14px/20px, weight 600, `var(--foreground)` | `text-sm font-semibold text-foreground` |
| `__description` | `margin-top: 2px`, 12px/16px, `var(--muted)` | `mt-0.5 text-xs text-muted` |

Header heights: title + description 62px; title only 44px; in grid 38px (padding 0).

### Layouts
| Selector | Declarations | Utility |
|---|---|---|
| `--list` | `display:flex; flex-direction:column` | `flex flex-col` |
| `--grid` | `--item-card-group-columns: 2; display:grid; gap:12px; grid-template-columns: repeat(var(--item-card-group-columns), minmax(0,1fr)); bg transparent; no shadow` | `grid gap-3 bg-transparent shadow-none` + spelled-out template |
| `--grid .item-card-group__header` | `padding: 0` | `p-0` |
| `--grid > [data-slot=item-card-group-header]` | `grid-column: 1 / -1` | `col-span-full` |
| `--grid > [data-slot=item-card]` | radius `calc(var(--radius)*2)`, `bg var(--surface)`, surface shadow | `bg-surface shadow-surface` + spelled-out radius |

Consequences kept from the source order: on a grid the variant's surface is always cleared (grid wins over
`--default/--secondary/--tertiary`); `--outline` + grid keeps the 1px group border; the secondary/tertiary
icon tint still applies to grid cards.

### Measured geometry (identical in the remake)
| Demo | Measurement |
|---|---|
| List (3 rows + 2 separators) | group 188px tall; rows 62px; separators full width, 1px, `bg-separator`, radius 4px; icon at (16,13) |
| Variants | each group 187px (header 62 + 62 + 1 + 62), outline 189px (border); frame gap 24px |
| Usage (Developer Settings) | outer transparent group 315px: header 60px (+4px `mb-1`) with an `sm` outline button right-aligned at 16px inset; inner default group 251px; second section header 44px; inner group 125px |
| Notification Preferences | title-only rows 60px; Inline Select trigger 28px tall, value max-width 192px; group 244px |
| Permission Levels | transparent group, header 62 + 3 × 62 = 248px, no separators |
| Grid Three Columns | header spans all columns, cards start at y = 38 + 12; 3 equal columns, 12px gaps |

---

## 5. Behaviour

- No own behaviour. Interactive content comes from the parts placed inside:
  - **Pressable rows** (Usage, Variants, Pressable): `ItemCard` rendered as a native `<button type="button">`
    with `relative w-full cursor-pointer overflow-hidden transition-colors` (+ `hover:bg-default/20
    active:bg-default-hover/50`, see deviations) and a `PressableFeedback.Ripple` as first child. The group
    usually gets `overflow-hidden` so the ripple stays inside the rounded surface.
  - OSS `Dropdown` (Usage header button: popover `min-w-[180px]`, two icon + `Label` items; Wallet List:
    ghost icon-only `sm` button, popover `min-w-[200px]`, `placement="bottom end"`, 8 items with an OSS
    `Separator` before a danger-coloured item, one label with a trailing `size-3 text-muted` icon).
  - OSS `Tooltip` around a secondary icon-only `sm` `Button` (Linked Accounts, placement top, text "Link X").
  - OSS `Switch` (With Header, Multiple Sections), Pro `InlineSelect` single / multiple (Permission Levels,
    Notification Preferences; popover as wide as the trigger, `ListBox` items with `ListBox.ItemIndicator`).
- Keyboard: Tab walks the interactive content in DOM order; the group itself is not focusable.

---

## 6. Demos (12) → stories

| # | Demo (`/docs/react/demos/item-card-group-…`) | Pro structure | Story export |
|---|---|---|---|
| 1 | `developer-settings` (Usage) | frame `flex w-[600px] flex-col gap-6 p-6`; 2 transparent groups, header `mb-1 flex items-center justify-between px-1.5` with Dropdown button (`size-3` trailing icon), nested default group `overflow-hidden`: 2 rows with `max-w-xs` description + outline `sm` button with `size-3` icon, 2 pressable ripple rows with chevron; second section header `mb-1 px-1.5`, title only, 2 rows with Connect buttons; Separators between rows | `DeveloperSettings` |
| 2 | `linked-accounts` | grid `columns=3`, no frame; 5 cards, icon `bg-default text-foreground` wrapping `span.text-sm.font-bold` + brand logo; action: `size-5 text-success` check or Tooltip › secondary icon-only `sm` Button (`size-4` link icon) | `LinkedAccounts` |
| 3 | `wallet-list` | list `w-[500px]`; 4 rows, icon `size-10 rounded-full bg-* text-lg` emoji; action `flex items-center gap-2`: right-aligned amount + sub amount, ghost icon-only Dropdown; Separators | `WalletList` |
| 4 | `variants` | frame `flex w-full max-w-[500px] flex-col gap-6 p-6`; one `overflow-hidden` list group per variant with header (title + description) and 2 pressable ripple rows + Separator | `Variants` |
| 5 | `list` | list `w-[500px]`, 3 rows with outline `sm` buttons, Separators | `List` |
| 6 | `grid` | frame `w-[600px] rounded-2xl p-6`; grid (2 columns), 4 cards icon + title + description | `Grid` |
| 7 | `grid-three-columns` | frame `w-[720px] rounded-2xl p-6`; grid `columns=3` with header (title + description), 3 cards | `GridThreeColumns` |
| 8 | `with-header` | frame `w-[500px] rounded-2xl p-6`; list + header; 2 outline-button rows + 1 Switch row, no Separators | `WithHeader` |
| 9 | `multiple-sections` | frame `flex w-[500px] flex-col gap-6 rounded-2xl p-6`; 2 groups, title-only headers; chevron rows / button + switch rows, Separators | `MultipleSections` |
| 10 | `pressable` | frame `w-[500px] rounded-2xl p-6`; `overflow-hidden` group + header; 3 pressable ripple rows + Separators | `Pressable` |
| 11 | `notification-preferences` | frame `w-[550px] rounded-2xl p-6`; list + header; 3 title-only rows with multi-select Inline Select; Separators | `NotificationPreferences` |
| 12 | `permission-levels` | frame `w-[500px] rounded-2xl p-6`; transparent list + header; 3 rows with single Inline Select; no Separators | `PermissionLevels` |

Story ids: `pro-datadisplay-itemcardgroup--{developer-settings|linked-accounts|wallet-list|variants|list|grid|grid-three-columns|with-header|multiple-sections|pressable|notification-preferences|permission-levels}`.
All texts, icons and data are our own. `layout` / `variant` / `columns` are args (controls) on every story;
Usage hides them (fixed nested structure) and Variants hides `variant` / `columns`.

---

## 7. Dependencies

- Pro: **Item Card** (stories; the group CSS targets its `data-slot`s), Pressable Feedback (stories),
  Inline Select (stories).
- OSS (`@heroui/react`, stories only): Button, Dropdown, Label, ListBox, Separator, Switch, Tooltip.
- Component itself: React + tailwind-variants only → root export.

---

## 8. Deviations / notes

1. **Docs-site unlayered CSS copy.** As with Item Card, the Pro docs stylesheet ships an extra unlayered copy
   of the Item Card Group rules, so on the demo pages these rules beat the demos' utility classes:
   - `.item-card-group__header` padding beats `px-1.5` (Usage demo headers keep the 16px inset; verified:
     computed padding `16px 16px 8px`).
   - `.item-card-group > [data-slot=item-card] { background: transparent }` beats `hover:bg-default/20` /
     `active:bg-default-hover/50` on pressable rows (verified: hovered row stays transparent; only the
     ripple shows).
   - `.item-card__icon` beats `size-10 rounded-full bg-*` in Wallet List (icon stays the 36px, 8px-radius
     `bg-default` tile; only `text-lg` applies).
   Our CSS lives in `@layer components`, so utilities win as for every OSS component. The stories therefore
   leave those conflicting utilities out to reproduce what the Pro pages show (comments in the stories).
2. Story frames add `text-foreground` (Pro demo pages set it on `<body>`).
3. `columns` writes the CSS variable only for `layout="grid"`; Pro's behaviour for `columns` on a list could
   not be observed (no demo) and has no visual effect either way.
4. Story frames: Pro demo pages put the demo in a padded (24px) flex container that centers it. Fixed-width
   frames (`w-[500px]`, `w-[600px]` …) shrink in that container on narrow viewports and are identical on
   wide ones. The Variants frame is `w-full max-w-[500px]`; Storybook's centered layout would size it to its
   content (~340px), so that story uses the fullscreen layout plus a `flex justify-center p-6` wrapper
   to reach the same 500px width as Pro.
5. Review notes (not differences): the Wallet List menu has the same content height (317px: 6px padding,
   8 × 36px items, 2px gaps, separator) on both; Pro's 258px was a viewport clamp (`max-height`) in the
   small test pane. The Linked Accounts tooltip doesn't open on an automated pointer hover on Pro either.
   It opens on keyboard focus of the `tooltip__trigger` on both, with the same 3px offset.

---

## Appendix A — CSSOM reference (Pro demo pages, `@layer components`, item-card-group only)

```
.item-card-group { border-radius: calc(var(--radius)*2) }
.item-card-group>[data-slot=item-card] { border-width:0; box-shadow:none(0 0 #0000); background-color:#0000; border-radius:0 }
.item-card-group--default { background-color:var(--surface); --tw-shadow:var(--surface-shadow) }
.item-card-group--secondary { background-color:var(--surface-secondary) }
.item-card-group--tertiary { background-color:var(--surface-tertiary) }
:is(.item-card-group--secondary,.item-card-group--tertiary) [data-slot=separator] { color-mix(in oklab, var(--muted) 10%, transparent) }
:is(.item-card-group--secondary,.item-card-group--tertiary)>[data-slot=item-card]>[data-slot=item-card-icon] { color-mix(in oklab, var(--surface) 50%, transparent) }
.item-card-group--outline { border:1px var(--border); shadow none; background-color:#0000 }
.item-card-group--transparent { shadow none; background-color:#0000; border-radius:0 }
.item-card-group__header { padding-inline:calc(var(--spacing)*4); padding-top:calc(var(--spacing)*4); padding-bottom:calc(var(--spacing)*2) }
.item-card-group__title { font-size:var(--text-sm); line-height:var(--text-sm--line-height); font-weight:var(--font-weight-semibold); color:var(--foreground) }
.item-card-group__description { margin-top:calc(var(--spacing)*.5); font-size:var(--text-xs); line-height:var(--text-xs--line-height); color:var(--muted) }
.item-card-group--list { display:flex; flex-direction:column }
.item-card-group--grid { --item-card-group-columns:2 }
.item-card-group--grid .item-card-group__header { padding:0 }
.item-card-group--grid { display:grid; gap:calc(var(--spacing)*3); grid-template-columns:repeat(var(--item-card-group-columns),minmax(0,1fr)); shadow none; background-color:#0000 }
.item-card-group--grid>[data-slot=item-card-group-header] { grid-column:1/-1 }
.item-card-group--grid>[data-slot=item-card] { border-radius:calc(var(--radius)*2); background-color:var(--surface); --tw-shadow:var(--surface-shadow) }
```
(The same rules appear again unlayered on the docs site, see deviation 1.)
