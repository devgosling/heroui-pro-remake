# Action Bar — clean-room implementation spec

Slug: `action-bar` · Docs: https://heroui.pro/docs/react/components/action-bar · Storybook title: `Pro/DataDisplay/ActionBar`
Import (Pro): `import {ActionBar} from "@heroui-pro/react";` (root export; no heavy peer)

Sources used: the public docs text, the rendered DOM and CSSOM of the two public demo pages (light + dark),
computed styles, runtime probing (clicks, synthetic keyboard events, MutationObserver + rAF sampling of the
enter/exit animation, `getAnimations()`), and the OSS HeroUI source in this repo (Toolbar, Separator, Chip,
Button). Desktop metrics were taken by loading the same public demo page into a 1024px-wide same-origin
iframe (the shared browser pane is ~447px wide, which triggers the mobile rules). I did not open or try to get
around the paywalled example source.

---

## 1. Purpose

A floating toolbar for contextual actions (bulk selection, editing controls). It is pinned to the bottom
center of the viewport and animates in/out with `isOpen`.

---

## 2. Anatomy

```tsx
<ActionBar isOpen={hasSelection}>           // div.action-bar  >  OSS Toolbar (div.toolbar.action-bar__wrapper)
  <ActionBar.Prefix>                        // div.action-bar__prefix   (optional)
    <Chip size="sm">{count}</Chip>
  </ActionBar.Prefix>
  <Separator />                             // OSS Separator (vertical via the Toolbar's SeparatorContext)
  <ActionBar.Content>                       // div.action-bar__content  (optional)
    <Button size="sm" variant="ghost">…<span className="action-bar__label">Edit</span></Button>
  </ActionBar.Content>
  <Separator />
  <ActionBar.Suffix>                        // div.action-bar__suffix   (optional)
    <Button isIconOnly aria-label="Clear" size="sm" variant="ghost">…</Button>
  </ActionBar.Suffix>
</ActionBar>
```

Rendered DOM (default demo, desktop):

```html
<div class="action-bar" data-slot="action-bar" style="opacity: 1; transform: none;">   <!-- motion-driven inline style -->
  <div data-slot="toolbar" role="toolbar" aria-label="Actions" aria-orientation="horizontal"
       data-orientation="horizontal" data-rac
       class="toolbar toolbar--attached toolbar--horizontal action-bar__wrapper">
    <div class="action-bar__prefix" data-slot="action-bar-prefix">
      <span class="chip chip--default chip--sm chip--secondary shrink-0 tabular-nums" data-slot="chip">…</span>
    </div>
    <div class="separator separator--vertical separator--default" role="separator" aria-orientation="vertical" …/>
    <div class="action-bar__content" data-slot="action-bar-content">
      <button class="button button--sm button--ghost" aria-label="Edit"><svg/><span class="action-bar__label">Edit</span></button>
      …
    </div>
    <div class="separator separator--vertical …"/>
    <div class="action-bar__suffix" data-slot="action-bar-suffix">
      <button class="button button--icon-only button--sm button--ghost" aria-label="Clear selection"><svg/></button>
    </div>
  </div>
</div>
```

| Part | Element | `data-slot` | BEM class | Primitive |
|---|---|---|---|---|
| `ActionBar` (outer) | `div` | `action-bar` | `action-bar` | plain div (positioning + animation) |
| `ActionBar` (toolbar) | `div role="toolbar"` | `toolbar` (OSS) | `toolbar toolbar--attached toolbar--horizontal action-bar__wrapper` | OSS `Toolbar` (RAC Toolbar) |
| `ActionBar.Prefix` | `div` | `action-bar-prefix` | `action-bar__prefix` | plain div |
| `ActionBar.Content` | `div` | `action-bar-content` | `action-bar__content` | plain div |
| `ActionBar.Suffix` | `div` | `action-bar-suffix` | `action-bar__suffix` | plain div |
| label (class only) | any element | – | `action-bar__label` | – |

- When `isOpen` is false and the exit animation has finished, nothing is rendered (no placeholder).
- The bar is rendered inline (no portal). `position: fixed` places it relative to the viewport.
- The class order on the toolbar shows the OSS Toolbar merges `className` after its own classes. So Pro
  passes `action-bar__wrapper` (+ user `className`) as the Toolbar's `className`.
- No extra `data-*` state attributes in Pro (motion writes inline `opacity`/`transform` styles).

---

## 3. API (from docs)

### `ActionBar`
"The root component. Extends ToolbarProps from @heroui/react."

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | – | Controls visibility with animated enter/exit. Required. |
| `aria-label` | `string` | `"Actions"` | Accessible label for the toolbar. |
| `isAttached` | `boolean` | `true` | Whether the toolbar has a surface background with full rounding. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | The orientation of the toolbar. |
| `className` | `string` | – | Additional CSS classes applied to the toolbar wrapper. |
| `children` | `ReactNode` | – | Typically `Prefix`, `Content`, `Suffix` and `Separator`. |

### `ActionBar.Prefix` / `ActionBar.Content` / `ActionBar.Suffix`
| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Prefix: badges, counts, labels. Content: action buttons, dropdowns. Suffix: dismiss button, secondary actions. |
| `className` | `string` | Additional CSS classes. |

---

## 4. Styling (CSSOM, all in `@layer components`)

| Selector | Declarations | Tailwind equivalent |
|---|---|---|
| `.action-bar` | `position: fixed; inset-inline: 0; bottom: 6×spacing (24px); z-index: 50; display: flex; justify-content: center; pointer-events: none` | `pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center` |
| `.action-bar [data-slot="toolbar"]` | `border-radius: calc(var(--radius) * 3)` (24px at `--radius: .5rem`) | – (overrides `.toolbar--attached`'s `rounded-3xl`) |
| `.action-bar__wrapper` | `pointer-events: auto; box-shadow: var(--overlay-shadow) (via --tw-shadow); padding: 6px 12px` | `pointer-events-auto shadow-overlay px-3 py-1.5` |
| `.action-bar__prefix` | `display: flex; align-items: center; gap: 2.5×spacing (10px)` | `flex items-center gap-2.5` |
| `.action-bar__content` | `display: flex; align-items: center; gap: spacing (4px)` | `flex items-center gap-1` |
| `.action-bar__suffix` | `display: flex; align-items: center` | `flex items-center` |
| `.action-bar__label` | `font-size: var(--text-sm); line-height: var(--text-sm--line-height); font-weight: var(--font-weight-medium)` | `text-sm font-medium` |
| `@media (max-width: 639px)` `.action-bar__wrapper` | `padding: 4px 8px` | `max-sm:px-2 max-sm:py-1` |
| `@media (max-width: 639px)` `.action-bar__prefix` | `gap: 1.5×spacing (6px)` | `max-sm:gap-1.5` |
| `@media (max-width: 639px)` `.action-bar__label` | sr-only (`position:absolute; width/height:1px; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border-width:0; padding:0`) | `max-sm:sr-only` |

Inherited from OSS:
- `.toolbar` → `display: grid; grid-auto-flow: column; align-items: center; gap: 8px; width: fit-content`.
- `.toolbar--attached` → `bg-surface p-1 shadow-overlay rounded-3xl` (padding and radius are overridden as above).
- `.toolbar .separator--vertical` → `height: 50%; align-self: center`. Between sections the separator is 50% of
  the grid row (16px on desktop, 18px on mobile). A separator *inside* `.action-bar__content` (flex parent
  with auto height) falls back to `min-h-2` = 8px. This is emergent OSS behaviour, reproduced as-is.

### Tokens (light / dark)
| Use | Token | Light | Dark |
|---|---|---|---|
| Wrapper background | `--surface` (`bg-surface` from `.toolbar--attached`) | white | `lab(8.34 …)` |
| Wrapper shadow | `--overlay-shadow` | 3-layer drop shadow `0 2px 8px #0000000f, 0 -6px 12px #00000008, 0 14px 28px #00000014` | `0 0 1px 0 #ffffff4d inset` |
| Separator | `--separator` | `lab(90.69 …)` | `lab(12.95 …)` |
| Count chip | OSS Chip `size="sm"` (`chip--secondary` default) | `--default` bg | `--default` bg |
| Delete button (demo) | `text-danger bg-danger/10` on a ghost button | | |

### Measured metrics
| Element | Desktop (≥640px) | Mobile (<640px) |
|---|---|---|
| Outer `.action-bar` | full width, 44px high, `bottom: 24px` | same |
| Wrapper | 44px high (32px buttons + 2×6px), padding 6/12px, radius 24px, gap 8px | 44px high (36px buttons + 2×4px), padding 4/8px |
| Prefix gap | 10px | 6px |
| Content gap | 4px | 4px |
| Buttons (`size="sm"`) | 32px high (OSS `md:h-8`), px 12px, icon 16px | 36px high, labels sr-only so buttons are 36×36 |
| Chip (count) | 20px high, 12px text | same |
| Default demo bar width | 466px (count + 4 labelled actions + clear) | 267px |

---

## 5. Behaviour

### Enter / exit animation (motion spring, measured)
- Enter: `opacity 0 → 1` and `translateY(8px) → none`.
- Exit: `opacity 1 → 0` and `translateY(0) → 8px`. The node is removed right after the exit animation ends (~320ms after `isOpen` became false).
- Opacity runs as a WAAPI animation: 300ms, `fill: both`, easing is a `linear(…)` spring curve. The
  transform runs on the JS frame loop with the same spring.
- The curve fits a **critically damped spring** (bounce 0) exactly: `x(t) = 1 − (1 + ωt)·e^(−ωt)` with
  ω ≈ 30.8 rad/s. That is a motion `{type: "spring", duration: 0.3, bounce: 0}` (settling at Δ = 0.001 after 300ms).
  Sample check: 10.3% → 0.248, 51.7% → 0.951.
- Rest state: `opacity: 1; transform: none`.

### Keyboard / a11y
- `role="toolbar"`, `aria-label` defaults to `"Actions"` (the data-grid demo passes `"Bulk actions"`).
- RAC Toolbar arrow-key navigation: ArrowRight / ArrowLeft move focus between the focusable controls
  (across sections and separators). Home / End do nothing. Escape does nothing (no built-in dismiss).
- All buttons keep `tabIndex=0` (RAC Toolbar does not use a roving tabindex).
- Focus is not moved into the bar on open.
- Buttons whose text is wrapped in `.action-bar__label` keep `aria-label`, so they stay named when the
  label is visually hidden below 640px.

---

## 6. Demos

| Demo | URL | Structure |
|---|---|---|
| Usage (default) | `/docs/react/demos/action-bar-default` | `div.w-full.max-w-lg.p-4` holding a ListView (`aria-label="Files"`, 6 rows, multiple selection with checkboxes, `list-view--primary`) and the `ActionBar` (`isOpen={selected.size>0}`): Prefix = `Chip size="sm" className="shrink-0 tabular-nums"` with the count. Then a Separator. Content = Edit / Export / Archive ghost sm buttons (16px icon + `action-bar__label` span + `aria-label`), an inner Separator, and Delete (`text-danger bg-danger/10`). Then a Separator. Suffix = icon-only "Clear selection" (xmark) that clears the selection. |
| With Data Grid | `/docs/react/demos/action-bar-with-data-grid` | `div.w-full.max-w-4xl` with a Pro DataGrid (`aria-label="Employees"`, 8 rows, multiple selection with checkboxes, all 4 columns sortable: Employee (avatar sm + name + muted email, row header, sorted ascending), Department, Status (Chip sm soft success/warning/danger with a 6px dot icon), Joined (muted sm tabular date)). ActionBar `aria-label="Bulk actions"`: same as the default demo but without the inner separator before Delete. |
| Responsive labels | (docs section, no own demo) | `.action-bar__label` → sr-only below 640px. |

---

## 7. Implementation notes (remake)

- `ActionBarRoot` renders `div.action-bar[data-slot=action-bar]` with the OSS `Toolbar` inside
  (`isAttached` default true, `orientation` default horizontal, `aria-label` default "Actions"). `className`
  and every other Toolbar prop (including `ref`) go to the Toolbar.
- Animation: CSS transitions on `opacity` + `translate` with a self-computed `linear()` sample of the same
  critically damped spring (300ms). Enter uses `@starting-style`. Exit sets `data-exiting="true"` on the
  outer div. A small presence hook waits for `getAnimations()` to finish before it unmounts.
  Re-opening during the exit reverses smoothly from the current value, like motion does.
  `motion-reduce` turns the transitions off, so the bar mounts and unmounts at once.
- Deviations: inline motion styles are replaced by CSS (`translate` instead of `transform`, `data-exiting`
  attribute added during exit). Browsers without `@starting-style` (Firefox < 129) show the bar without the
  enter animation.
- Re-opening during the exit: Pro restarts a full spring from the current value. CSS reverses the running
  transition, which shortens it by the "reversing shortening factor", so the reverse can be a bit shorter.
  Motion also ignores `prefers-reduced-motion` by default, but the remake follows the HeroUI convention
  (`motion-reduce:transition-none`).
- Dependencies: `@heroui/react` (Toolbar; demos use Button, Chip, Separator, Avatar). The Usage story uses the
  Pro `ListView` (title-only rows, multiple selection, primary variant, like the demo) and the With Data Grid
  story uses the Pro `DataGrid`, both from this package.
- Stories use the same frame as the Pro demo pages (`layout: "fullscreen"` plus a decorator
  `flex min-h-screen w-full items-center justify-center p-6`), so the demo wrappers (`w-full max-w-lg p-4`,
  `w-full max-w-4xl`) get the same width as on heroui.pro.

## 8. Review check (independent reviewer)

Compared with the public demos (light + dark, 447px pane and a 1024px same-origin iframe):
- Usage demo at 447px: list frame (399px wrapper, 367px list, 45px rows), toolbar rect (x 90.1, y 334,
  266.8×44), padding 4/8px, gaps, separator heights (18/8/18px), 36px buttons with sr-only labels, chip
  20px: all identical.
- 1024px: padding 6/12px, prefix gap 10px, content gap 4px, 32px buttons, separators 16/8/16px. The width
  only differs because the story's button labels differ.
- Colours (converted to sRGB): wrapper, foreground, chip, separator, danger button bg/text match in light
  and dark. Shadow `--overlay-shadow` matches (3 layers in light, 1px white/30% inset in dark).
- Ghost button hover bg (`--default`) and keyboard focus ring (2px offset + 2px `--focus` ring) match.
- Arrow keys move focus across sections, no wrap, Home/End do nothing (same as Pro).
- Live rAF sampling (fronted tab): enter 0 → 1 in ~300ms, exit removes the node ~320ms after the
  transition starts (Pro ~322ms after the click). Curve values match the Pro samples.
- Theme: `--radius: 1rem` gives a 48px toolbar radius (same `calc(var(--radius) * 3)` as Pro); `--font-sans`
  reaches the labels and the chip.

---

## Appendix A — raw CSSOM (reference only)

```
@layer components
.action-bar { pointer-events: none; inset-inline: 0px; bottom: calc(var(--spacing) * 6); z-index: 50; justify-content: center; display: flex; position: fixed; }
.action-bar [data-slot="toolbar"] { border-radius: calc(var(--radius) * 3); }
.action-bar__wrapper { pointer-events: auto; --tw-shadow: var(--overlay-shadow); box-shadow: …; padding: 6px 12px; }
.action-bar__prefix { align-items: center; gap: calc(var(--spacing) * 2.5); display: flex; }
.action-bar__content { align-items: center; gap: var(--spacing); display: flex; }
.action-bar__suffix { align-items: center; display: flex; }
.action-bar__label { font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); font-weight: var(--font-weight-medium); }
@media (max-width: 639px) .action-bar__wrapper { padding: 4px 8px; }
@media (max-width: 639px) .action-bar__prefix { gap: calc(var(--spacing) * 1.5); }
@media (max-width: 639px) .action-bar__label { sr-only }
```
No `@keyframes` (the animation is JS/WAAPI driven).
