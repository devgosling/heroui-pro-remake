# Native Select — clean-room implementation spec

Slug: `native-select` · Docs: https://heroui.pro/docs/react/components/native-select · Category: Forms
Import (Pro): `import {NativeSelect} from "@heroui-pro/react";` (root export; no heavy peers)
Storybook title (ours): `Pro/Forms/NativeSelect`

Sources: the public docs text, plus the rendered DOM, CSSOM, computed styles and runtime behaviour of the 12 public
demo pages (light and dark). The shared built-in browser was at its tab cap, so probing ran in a private headless Edge
over CDP, with real `Input.dispatch*` mouse and keyboard events. I compared the result with the OSS `Select`, `Input`,
`Label`, `Description` and `FieldError` in this repo. I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A styled wrapper around the **native HTML `<select>`**: field look (OSS field tokens), a label, a description, a field error
and a chevron indicator. There is no custom popover or listbox. The OS picker opens and native keyboard
behaviour applies. Use it where the OSS `Select` (RAC listbox in a popover) is too heavy, or where native mobile pickers are wanted.

---

## 2. Anatomy

```tsx
import {NativeSelect} from "@heroui-pro/react";
import {Description, FieldError, Label} from "@heroui/react";

<NativeSelect>
  <Label />                         {/* optional, OSS */}
  <NativeSelect.Trigger>
    <NativeSelect.OptGroup>         {/* optional */}
      <NativeSelect.Option />
    </NativeSelect.OptGroup>
    <NativeSelect.Indicator />
  </NativeSelect.Trigger>
  <Description />                   {/* optional, OSS */}
  <FieldError />                    {/* optional, OSS */}
</NativeSelect>
```

Rendered DOM (With Description demo, runtime):

```html
<div class="native-select native-select--full-width" data-slot="native-select">
  <label class="label" data-slot="label">Status</label>
  <div class="native-select__trigger native-select__trigger--full-width" data-slot="native-select-trigger">
    <select aria-describedby="react-aria-…" class="native-select__select" data-slot="native-select-select" name="status">
      <option value="">Select status</option>
      <option value="todo">Todo</option> …
    </select>
    <span aria-hidden="true" class="native-select__indicator" data-slot="native-select-indicator">
      <svg aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
           stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
    </span>
  </div>
  <span class="description" id="react-aria-…" data-slot="description" slot="description">…</span>
</div>
```

Invalid demo: the root gets `data-invalid="true"`, the select gets `aria-invalid="true"` and `aria-describedby` → the field
error. The error is OSS FieldError (RAC): `<span class="field-error" id=… slot="errorMessage" data-visible="true" data-slot="field-error" data-rac>`.

| Part | Element | `data-slot` | BEM classes | Built on |
|---|---|---|---|---|
| `NativeSelect` (root) | `div` | `native-select` | `native-select` (+ `--secondary`, `--full-width`) | plain div + RAC context providers |
| `NativeSelect.Trigger` (wrapper) | `div` | `native-select-trigger` | `native-select__trigger` (+ `--full-width`) | plain div |
| `NativeSelect.Trigger` (select) | `select` | `native-select-select` | `native-select__select` | native `<select>` |
| `NativeSelect.Indicator` | `span[aria-hidden]` | `native-select-indicator` | `native-select__indicator` | plain span, default chevron svg |
| `NativeSelect.Option` | `option` | – (Pro renders none) | – | native `<option>` |
| `NativeSelect.OptGroup` | `optgroup` | – (Pro renders none) | – | native `<optgroup>` |
| `Label` / `Description` / `FieldError` | OSS | `label` / `description` / `field-error` | `label` / `description` / `field-error` | `@heroui/react` |

Notes
- **The Trigger is one component that renders two elements.** The wrapper `div` holds the `<select>` and the Indicator. The
  `className` goes on the **select**, `wrapperClassName` goes on the wrapper, and all other props are native select attributes
  (`value`, `defaultValue`, `onChange`, `name`, `required`, `disabled`, …). The Option and OptGroup children go inside the select. The Indicator
  child is rendered after the select, as a sibling.
- The primary variant has **no modifier class**. Only `native-select--secondary` is emitted.
- `fullWidth` puts `native-select--full-width` on the root **and** `native-select__trigger--full-width` on the wrapper.
- Pro sets **no** `data-hovered`, `data-focus-visible` or `data-disabled` attributes at runtime, even though the CSS also matches them.
  States come from the native pseudo-classes. A disabled select does not mark the root (the label stays at full opacity).
- **Pro's Label is not associated with the select.** There is no `for`, no `id` and no `aria-labelledby`. Clicking the label does nothing.
  Description and FieldError ids are wired through RAC `TextContext` slots and show up in `aria-describedby` only while mounted.
- Native constraint validation only: with `required`, submit fires native `invalid` events and focuses the first invalid select.
  The browser shows its own bubble. Pro does not turn native validity into `data-invalid`. That only comes from `isInvalid`.

---

## 3. API (from docs)

### `NativeSelect` (root)
"The root component. Wraps the trigger, label, and description."

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Visual style variant |
| `fullWidth` | `boolean` | `false` | Full width of its container |
| `isInvalid` | `boolean` | `false` | Shows FieldError, hides Description, applies error styling |
| `validationErrors` | `string[]` | `[]` | Messages rendered by FieldError when it has no children |
| `validationDetails` | `ValidityState` | – | Native validity details passed to FieldError render props |
| `children` | `ReactNode` | – | Trigger, label, description, field error |

Also accepts all native `div` attributes.

### `NativeSelect.Trigger`
| `className` | `string` | – | Class on the **select** element |
| `wrapperClassName` | `string` | – | Class on the wrapper div |
| `children` | `ReactNode` | – | Option, OptGroup and Indicator elements |

Also accepts all native `select` attributes.

### `NativeSelect.Indicator`
`children?: ReactNode`: a custom icon. With no children it renders the default down chevron. Also accepts native `span` attributes.

### `NativeSelect.Option` / `NativeSelect.OptGroup`
Native `option` / `optgroup` with `children`. Also accepts their native attributes (`value`, `disabled`, `label`, …).

### CSS classes (docs)
Base: `.native-select`, `.native-select__trigger`, `.native-select__select`, `.native-select__indicator`.
Variant: `.native-select--secondary`. Modifiers: `.native-select--full-width`, `.native-select__trigger--full-width`.
States (docs): hover `:hover`/`[data-hovered]`, focus `:focus`, focus-visible `:focus-visible`/`[data-focus-visible]`,
invalid `[data-invalid]`/`[aria-invalid]` on the root, disabled `:disabled`/`[aria-disabled]` on the select.
The docs list no CSS variables. The CSS reads `--native-select-indicator-offset` and `--native-select-indicator-size` (see §4).

---

## 4. Styling (observed, `@layer components`)

### 4.1 Root `.native-select`
`inline-flex flex-col gap-1` (4px). `[data-slot="label"]` gets `w-fit`, and `[data-slot="description"]` gets `px-1`.
On an invalid root (`[data-invalid="true"]` or `[aria-invalid="true"]`) the description gets `display:none`.

### 4.2 Wrapper `.native-select__trigger`
`relative inline-flex items-center`. Inside the flex-column root it is blockified, so it stretches to the root's width.

### 4.3 Select `.native-select__select`
- `relative inline-flex w-full min-h-9 appearance-none`, `rounded-field` (radius × 1.5 = 12px), `border` with `border-width: var(--border-width-field)` (0px) and `border-color: var(--color-field-border)`
- `bg-field`, `text-field-foreground`, `shadow-field`, `text-sm` (14/20), `px-3 py-2`, `outline-none`, `no-highlight`, `cursor: var(--cursor-interactive)`
- `padding-inline-end: calc(var(--native-select-indicator-offset, .5rem) + var(--native-select-indicator-size, 1rem) + .5rem)`, which is 32px
- `transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out)`, with motion-reduce off
- Hover (`@media (hover:hover)`, `:hover` or `[data-hovered]`): `bg-field-hover`, `border-color: var(--color-field-border-hover)`
- Focus-visible (`:focus-visible:not([data-focused])` or `[data-focus-visible]`): `status-focused` (2px `--background` offset + 2px `--focus` ring), `--color-field-border-focus`, `--color-field-focus` background
- Focus (`:focus`, pointer): border and background as focus-visible, **no ring**
- Invalid (`.native-select[data-invalid|aria-invalid] .native-select__select`): `status-invalid-field` (1px danger outline; on focus a 2px danger ring with no offset). The background is `--color-field-focus`, so the hover background does not apply. This rule outranks the secondary background (0,3,0 against 0,2,0).
- Disabled (`:disabled` or `[aria-disabled]`): `status-disabled` (opacity `--disabled-opacity`, not-allowed cursor, no pointer events). **The indicator keeps full opacity.**
- Placeholder: `:has(option[value=""]:checked)` gives `color: var(--field-placeholder, var(--muted))`. Options have no styles, so the native popup inherits the select colour.

### 4.4 Indicator `.native-select__indicator`
`pointer-events-none absolute inset-y-0 end-2 my-auto flex shrink-0 items-center justify-center text-field-placeholder`.
`svg`: `size-4`. Pro also declares `--native-select-indicator-size: 1rem` on the svg, which has no effect there.

### 4.5 Secondary `.native-select--secondary .native-select__select`
`bg-default shadow-none`. Hover: `bg-default-hover`. Focus-visible and focus: `bg-default`. Because these rules come later at equal specificity,
secondary hover and focus also override the invalid background.

### 4.6 Measured (1280×900, 220px wrappers)
| Element | Size | Notes |
|---|---|---|
| select | 220×36 | padding 8/32/8/12; font 14/20 400 |
| indicator | 16×36, svg 16×16 | x = width − 8 − 16 |
| label | h 20 | 14/20 500 |
| description / field-error | h 16 | 12/16, `px-1` |
| root with label + description | 220×80 | label 20 + 4 + 36 + 4 + 16 |
| With Groups (no width class) | 195×36 | intrinsic select width (longest option + 44px padding) |
| Form Example | 300 wide, `gap-4` | submit result `<pre class="text-muted bg-surface rounded-lg p-3 text-xs">` 300×88 |

### 4.7 Tokens (Pro site, light / dark)
| Token | Light | Dark |
|---|---|---|
| `--field-background` / `--color-field-focus` | lab(100 0 0) | lab(8.34 .61 −2.13) |
| `--field-foreground` | lab(8.34 …) | lab(98.97 …) |
| `--field-placeholder` = `--muted` | lab(47.87 1.41 −4.99) | lab(65.65 1.53 −5.42) |
| `--field-hover` | field-bg 90% + fg 2% | same mix |
| `--field-shadow` | `0 2px 4px #0000000a, 0 1px 2px #0000000f, 0 0 1px #0000000f` | `0 0 0 0 transparent inset` |
| `--color-field-border` | transparent (width 0) | transparent |
| `--color-field-border-hover` / `-focus` | fg 10% / 22% | fg 10% / 22% |
| `--default` / `--default-hover` | lab(93.03 …) / +4% fg | lab(15.73 …) / +4% fg |
| `--focus` | lab(54.53 3.32 −66.53) | same |
| `--danger` | lab(57.42 73.56 48.01) | lab(50.91 62.27 37.59) |
| `--disabled-opacity` | .5 | .5 |

`color-scheme` follows the theme (`light` or `dark` on `html`), so the native picker popup matches the theme.

---

## 5. Behaviour

- Fully native: mouse opens the OS picker. Keyboard: Tab focuses (ring), Arrow keys change the value without opening (Windows Chromium), Alt+Down / Space / Enter open.
- No animations other than the 150ms colour and box-shadow transitions.
- `value` / `onChange` (controlled) and `defaultValue` (uncontrolled) are plain React select semantics. The Controlled demo shows
  `<p class="text-muted text-sm">Selected: …</p>` under a `space-y-2` stack.

---

## 6. Demos (12) → our stories

| Pro demo | Story export | Structure |
|---|---|---|
| default | `Default` | `w-full max-w-[220px]` wrapper (ours: `w-[220px] max-w-full`, because Storybook's centred layout shrink-wraps), root `className="w-full"`, no label |
| form-example | `FormExample` | `<form class="flex w-[300px] flex-col gap-4">`: 2 × fullWidth + Label + required select (the first with 3 optgroups, the second with a Description), `Button size="lg" type="submit"`, JSON `<pre>` after submit |
| with-label | `WithLabel` | `w-[220px]`, fullWidth, Label + Description (the Pro demo is identical to with-description) |
| with-description | `WithDescription` | same as above |
| variants | `Variants` | `flex flex-wrap items-start gap-6`. Two columns `flex w-[220px] flex-col gap-2`, each with a `text-xs text-muted` caption and a root with `w-full` |
| full-width | `FullWidth` | `w-[400px] space-y-4`, fullWidth + Label |
| with-groups | `WithGroups` | `w-[220px]`, root without a width class (intrinsic), 3 optgroups |
| with-disabled-options | `WithDisabledOptions` | `w-[220px]`, fullWidth + Label, 2 disabled options |
| disabled-select | `DisabledSelect` | `w-[220px]`, fullWidth + Label, `disabled` with a selected value |
| invalid-state | `InvalidState` | `w-[220px]`, root `w-full isInvalid`, Label + FieldError |
| controlled | `Controlled` | `w-[220px] space-y-2`, fullWidth + Label, `value`/`onChange`, "Selected: …" paragraph |
| custom-indicator | `CustomIndicator` | `w-[220px]`, fullWidth + Label, Indicator with an up/down chevrons icon |

---

## 7. Dependencies

- OSS `@heroui/react`: `Label`, `Description`, `FieldError` (stories also use `Button`)
- `react-aria-components`: `LabelContext`, `TextContext`, `FieldErrorContext`, `Provider`
- no heavy peers, so the component **may be exported from the package root**

---

## 8. Our implementation and deviations

- `NativeSelectRoot` provides RAC `TextContext` slots (`description` and `errorMessage` ids), `FieldErrorContext`
  (`isInvalid`, `validationErrors`, `validationDetails`; by default a ValidityState with `customError`/`valid` derived from `isInvalid`)
  and `LabelContext`. A small `useSlotId` puts an id into `aria-describedby` only while an element with that id is mounted, as React Aria does.
- **Deviation (a11y fix):** the Label gets `for` = the select's `id` (generated, or the `id` passed to the Trigger). Clicking the label
  focuses the select and the select gets an accessible name. Pro leaves the label unassociated.
- **Deviation:** Option and OptGroup carry `data-slot="native-select-option"` / `"native-select-optgroup"`, following the repo convention. Pro renders none. No CSS targets them.
- The Trigger splits its children by element type: `NativeSelect.Indicator` elements are rendered after the select, everything else
  inside it. An Indicator wrapped in another component would end up inside the select, so pass it as a direct child.
- `--native-select-indicator-offset` / `--native-select-indicator-size` drive both the select's end padding and the indicator's
  position and size. The defaults equal Pro's values (8px / 16px). In Pro the size variable is declared on the svg, where it has no effect.
- Stories use their own data (plans, regions, languages, time zones, delivery slots, shipping speeds, sizes, sort orders) and gravity-ui icons.

---

## Appendix A: raw CSSOM (Pro demo, reference only, not copied into the implementation)

```
[@layer components] .native-select { gap: var(--spacing); flex-direction: column; display: inline-flex; }
[@layer components] :is(.native-select[data-invalid="true"], .native-select[aria-invalid="true"]) [data-slot="description"] { display: none; }
[@layer components] .native-select [data-slot="label"] { width: fit-content; }
[@layer components] .native-select [data-slot="description"] { padding-inline: var(--spacing); }
[@layer components] .native-select__trigger { align-items: center; display: inline-flex; position: relative; }
[@layer components] .native-select__select { min-height: calc(var(--spacing) * 9); appearance: none; border-radius: var(--field-radius,calc(var(--radius) * 1.5)); border-style: var(--tw-border-style); background-color: var(--field-background,var(--default)); width: 100%; padding-inline: calc(var(--spacing) * 3); padding-block: calc(var(--spacing) * 2); font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); color: var(--field-foreground,var(--foreground)); --tw-shadow: var(--field-shadow); box-shadow: …; --tw-outline-style: none; -webkit-tap-highlight-color: transparent; transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); border-width: 1px; outline-style: none; display: inline-flex; position: relative; }
[@layer components] .native-select__select:is([data-reduce-motion="true"], [data-reduce-motion="true"] *) … { transition-property: none; }
[@layer components > @media (prefers-reduced-motion: reduce)] .native-select__select:not(…) … { transition-property: none; }
[@layer components] .native-select__select { cursor: var(--cursor-interactive); border-width: var(--border-width-field); border-color: var(--color-field-border); padding-inline-end: calc(var(--native-select-indicator-offset,.5rem) + var(--native-select-indicator-size,1rem) + .5rem); }
[@layer components > @media (hover: hover)] .native-select__select:hover, .native-select__select[data-hovered="true"] { background-color: var(--field-hover); border-color: var(--color-field-border-hover); }
[@layer components] .native-select__select:focus-visible:not([data-focused]), .native-select__select[data-focus-visible="true"] { (focus-ring: 2px --focus, offset --ring-offset-width --background) border-color: var(--color-field-border-focus); background-color: var(--color-field-focus); outline-style: none; }
[@layer components] .native-select__select:focus { border-color: var(--color-field-border-focus); background-color: var(--color-field-focus); }
[@layer components] .native-select[data-invalid="true"] .native-select__select, .native-select[aria-invalid="true"] .native-select__select { outline: 1px solid var(--danger); --tw-ring-offset-width: 3px; }
[@layer components] :is(…invalid select…):focus, :focus-visible, [data-focused], [data-focus-visible], :focus-within, [data-focus-within] { ring 2px var(--danger), offset 0 }
[@layer components] .native-select[data-invalid="true"] .native-select__select, .native-select[aria-invalid="true"] .native-select__select { background-color: var(--color-field-focus); }
[@layer components] .native-select__select:disabled, .native-select__select[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }
[@layer components] .native-select__select:has(option[value=""]:checked) { color: var(--field-placeholder,var(--muted)); }
[@layer components] .native-select__indicator { pointer-events: none; color: var(--field-placeholder,var(--muted)); flex-shrink: 0; justify-content: center; align-items: center; margin-block: auto; display: flex; position: absolute; inset-block: 0px; inset-inline-end: calc(var(--spacing) * 2); }
[@layer components] .native-select__indicator svg { --native-select-indicator-size: 1rem; width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); }
[@layer components] .native-select--secondary .native-select__select { --tw-shadow: 0 0 #0000; box-shadow: …; background-color: var(--color-default); }
[@layer components > @media (hover: hover)] .native-select--secondary .native-select__select:hover, …[data-hovered="true"] { background-color: var(--color-default-hover); }
[@layer components] .native-select--secondary .native-select__select:focus-visible:not([data-focused]), …[data-focus-visible="true"], …:focus { background-color: var(--color-default); }
[@layer components] .native-select--full-width, .native-select__trigger--full-width { width: 100%; }
```

---

## Appendix B: independent review (2026-11-25)

Method: headless Edge over CDP (the shared browser was at its tab cap), driven by Playwright mouse and keyboard input.
Each of the 12 Pro demos was compared with the matching story in light and dark. The comparison covered every element's
box (x/y/w/h relative to the demo wrapper), padding, margin, gap, radius, border, background, colour (resolved to sRGB),
font, box-shadow, outline, opacity, cursor, transition and color-scheme.

- Static: identical in all 24 runs. The only deltas are label widths and the With Groups intrinsic width, which come from our own option and label text.
- States: hover, Tab focus ring, pointer focus, ArrowDown value change, secondary hover and focus, invalid static, hover and focus, and disabled hover all match in both themes.
  A native `<select>` matches `:focus-visible` on mouse click in Chromium, so Pro shows the ring on pointer focus too.
- Form Example: an empty submit fires native `invalid` on both selects and focuses the first. The submit result `<pre>` is 300×88 at y = 228 in both.
- Controlled: the "Selected: …" paragraph sits at the same position and updates on keyboard changes. Selecting the empty option switches the select to the placeholder colour.
- CSSOM: our rules give the same selectors, specificity and cascade order as Pro's, including reduced motion, the invalid focus ring and secondary-over-invalid hover.
- Theme: `--radius: 1rem` gives a 24px field radius, `--font-sans` reaches the select and the label, and `--accent` reaches the focus ring through `--focus`.
- Remaining intentional deviations: clicking the Label focuses the select (`for`/`id`; in Pro the label is inert), plus `data-slot` on Option and OptGroup.
