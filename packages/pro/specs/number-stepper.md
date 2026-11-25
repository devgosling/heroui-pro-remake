# Number Stepper — clean-room implementation spec

Slug: `number-stepper` · Docs: https://heroui.pro/docs/react/components/number-stepper · Category: Forms
Import (Pro): `import {NumberStepper} from "@heroui-pro/react/number-stepper";`. This is a **subpath-only** export.
It is not in the package root because it depends on the optional peer `@number-flow/react`, and SSR apps that do not
use it should not need that peer installed.

Sources used: public docs text, rendered DOM and CSSOM of the public demo pages (light + dark),
computed styles, runtime probing (clicks, synthetic pointer hold, keyboard), the live `<number-flow-react>`
element's public properties, and the OSS `react-aria` 1.22 / `react-aria-components` 1.22.1 packages in this repo
(to attribute behaviour to React Aria). I did not open or try to get around the paywalled example source.

---

## 1. Purpose

A compact numeric stepper: a pill holding a minus button, an animated number (Number Flow) and a plus button.
It has bounds, step, formatting and press-and-hold auto-repeat. It is built on React Aria `NumberField`.

---

## 2. Anatomy

```tsx
<NumberStepper>                         // RAC NumberField
  <Label/> {/* optional, OSS HeroUI */}
  <NumberStepper.Group>                 // RAC Group (+ auto-rendered hidden RAC Input as last child)
    <NumberStepper.DecrementButton />   // RAC Button slot="decrement"
    <NumberStepper.Value />             // <NumberFlow/> from @number-flow/react
    <NumberStepper.IncrementButton />   // RAC Button slot="increment"
  </NumberStepper.Group>
  <Description/> {/* optional, OSS HeroUI */}
</NumberStepper>
```

| Part | Rendered element | `data-slot` | BEM class(es) | Primitive |
|---|---|---|---|---|
| `NumberStepper` (root) | `<div data-rac>` (+ `data-disabled="true"`) | `number-stepper` | `number-stepper` (**no size modifier on the root**) | RAC `NumberField` |
| `NumberStepper.Group` | `<div role="group" data-rac>` | `number-stepper-group` | `number-stepper__group number-stepper__group--{sm\|md\|lg}` | RAC `Group` (NumberField's GroupContext) |
| `NumberStepper.DecrementButton` | `<button type="button" slot="decrement" tabindex="-1" aria-label="Decrease …" aria-controls={inputId} data-rac>` | `number-stepper-decrement-button` | `number-stepper__decrement-button number-stepper__decrement-button--{size}` | RAC `Button` (consumes NumberField ButtonContext slot `decrement`) |
| `NumberStepper.Value` | `<number-flow-react>` custom element (open shadow DOM) | `number-stepper-value` | `number-stepper__value number-stepper__value--{size}` | `NumberFlow` from `@number-flow/react` |
| `NumberStepper.Value` with `children` | `<span>` | `number-stepper-value` | same classes | plain DOM |
| `NumberStepper.IncrementButton` | `<button … slot="increment" aria-label="Increase …">` | `number-stepper-increment-button` | `number-stepper__increment-button number-stepper__increment-button--{size}` | RAC `Button` slot `increment` |
| hidden input (automatic) | `<input type="text" inputmode="numeric" tabindex="-1" aria-roledescription="Number field" autocomplete="off" autocorrect="off" spellcheck="false">` | `number-stepper-input` | `number-stepper__input` | RAC `Input`. Rendered by `NumberStepper.Group` **after** its children (last child of the group) |

DOM example (default demo):

```html
<div data-slot="number-stepper" class="number-stepper" data-rac>
  <div role="group" class="number-stepper__group number-stepper__group--md" data-slot="number-stepper-group" data-rac>
    <button data-slot="number-stepper-decrement-button" class="number-stepper__decrement-button number-stepper__decrement-button--md"
            type="button" tabindex="-1" aria-label="Decrease Quantity" aria-controls="{inputId}" slot="decrement"><svg 16×16 …/></button>
    <number-flow-react class="number-stepper__value number-stepper__value--md" data-slot="number-stepper-value">
      <style>…SSR fallback css…</style><span>1</span>            <!-- SSR fallback; the real digits live in shadow DOM -->
    </number-flow-react>
    <button data-slot="number-stepper-increment-button" class="number-stepper__increment-button number-stepper__increment-button--md"
            type="button" tabindex="-1" aria-label="Increase Quantity" aria-controls="{inputId}" slot="increment"><svg …/></button>
    <input aria-label="Quantity" id="{inputId}" type="text" inputmode="numeric" tabindex="-1"
           aria-roledescription="Number field" class="number-stepper__input" data-slot="number-stepper-input" value="1">
  </div>
</div>
```

Notes
- `size` sits on the root but the size classes go on the group, buttons and value. It reaches them through a Pro context.
- The default buttons contain a 16×16 SVG (`viewBox="0 0 16 16"`, `fill="none"`) with a minus or plus glyph. CSS sizes it.
- Custom buttons can be used instead. The demo puts OSS `<Button isIconOnly size="sm" variant="…" slot="decrement|increment">`
  inside `NumberStepper.Group`. Because RAC `ButtonContext` is slotted, the OSS Button picks up the stepper behaviour
  (`tabindex=-1`, aria-label, press-and-hold).
- Label and Description in the "With Label" demo are OSS `Label` (`<label class="label" data-slot="label">`) and
  `Description` (`<span class="description" data-slot="description" slot="description">`). They are direct children of the root,
  and the root gets `className="flex-col items-start gap-1.5"`.

---

## 3. API (from docs)

### `NumberStepper` (root): "Wraps RAC NumberField."
| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `formatOptions` | `Format` (from `@number-flow/react`, a subset of `Intl.NumberFormatOptions`) | – | Number formatting options **passed to Number Flow** |

Also accepts all RAC `NumberField` props: `value`, `defaultValue`, `onChange`, `minValue`, `maxValue`, `step`,
`isDisabled`, `isReadOnly`, `isRequired`, `isInvalid`, `name`, `aria-label`, `className`, `isWheelDisabled`, …

Observed: `formatOptions` is **not** forwarded to the RAC NumberField. The hidden input keeps the raw value
("10", "60") while Number Flow shows "$10.00" and "60%". Keep `formatOptions` in Pro context for `Value` and do not
spread it into `NumberField`.

### `NumberStepper.Group`: "Container grouping value and buttons. Wraps RAC Group. Automatically renders a hidden input for accessibility."
Accepts all RAC `Group` props. Group `className` is merged; demos pass `gap-3` and `bg-transparent`.

### `NumberStepper.Value`: "Animated number display using Number Flow."
| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | – | Override value (defaults to the root's current value, i.e. RAC `NumberFieldStateContext.numberValue`) |
| `format` | `Format` | – | Override format options (defaults to root `formatOptions`) |
| `children` | `ReactNode \| ((props: { value: number, formatOptions?: Format }) => ReactNode)` | – | Custom content or render function. When present, a plain `<span>` with the same classes is rendered instead of `<number-flow-react>` |

Also accepts all Number Flow props except `value` and `children`: `prefix`, `suffix`, `locales`, `trend`,
`animated`, `respectMotionPreference`, `transformTiming`, `spinTiming`, `opacityTiming`, `willChange`,
`plugins`, `digits`, `isolate`, `onAnimationsStart`, `onAnimationsFinish`, `className`, …

### `NumberStepper.DecrementButton` / `NumberStepper.IncrementButton`
"Wraps RAC Button with slot="decrement" / slot="increment". Renders a default minus / plus icon when no children are provided."
Accept all RAC `Button` props. Children replace the icon (custom-icons demo).

---

## 4. Styling

All rules are in `@layer components`. `@media (min-width: 48rem)` is Tailwind `md:`. The component is
**mobile-first**: larger touch targets below 768px, smaller at `md:` and up. `border-radius: 2.14748e+09px`
in the dump is Tailwind `rounded-full` (`calc(infinity * 1px)`).

### `.number-stepper` (root)
`display: inline-flex; flex-shrink: 0;` [inline-flex shrink-0]

### `.number-stepper__group`
- `display: inline-flex; align-items: center; gap: 0; padding: 0; border-width: 0; border-radius: 9999px` (rounded-full)
- `background-color: var(--default)`; `box-shadow: none` (`--tw-shadow: 0 0 #0000`, i.e. shadow-none)
- No hover, focus-within or disabled styles. RAC still sets `data-focus-within`, `data-focus-visible`, `data-disabled` and `aria-disabled` on it.

### `.number-stepper__input`
Tailwind `sr-only`: `position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden;
clip-path: inset(50%); white-space:nowrap; border-width:0`.

### `.number-stepper__decrement-button, .number-stepper__increment-button`
- `position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0;`
- `width/height: calc(var(--spacing) * 9)` (36px) → `md:` `calc(var(--spacing) * 8)` (32px). Size modifiers override this (below).
- `border-width: 0; border-radius: 9999px; outline: none; -webkit-tap-highlight-color: transparent;`
- `background-color: var(--surface)`; `box-shadow: var(--surface-shadow)` (`--tw-shadow: var(--surface-shadow)`)
- `cursor: var(--cursor-interactive)`
- `transform: translateZ(0)` (transform-gpu)
- `transition: background-color .1s var(--ease-out), box-shadow .1s var(--ease-out), transform .25s var(--ease-smooth)`; `motion-reduce` → `transition-property: none`
- `svg`: `width/height: calc(var(--spacing) * 4)` (16px); `color: var(--muted)`; `flex-shrink: 0`; `transition: color .15s` (default ease); motion-reduce none
- `@media (hover: hover)`: `:hover svg`, `[data-hovered="true"] svg` → `color: var(--foreground)`. **Only the icon colour changes.** The docs say "background change", but the CSS has no background hover.
- `:active`, `[data-pressed="true"]` → `transform: scale(.97)` (overridden per size: sm/md `.98`, lg `.96`)
- `:focus-visible:not([data-focused])`, `[data-focus-visible="true"]` → ring: 2px `var(--focus)` ring + 2px `var(--background)` offset (box-shadow), outline none. In practice it never shows: the buttons are `excludeFromTabOrder` and `preventFocusOnPress`.
- `:disabled`, `[aria-disabled="true"]` → `opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none`

### `.number-stepper__value`
- `display: flex; align-items: center; justify-content: center;`
- `font-weight: var(--font-weight-semibold)` (600); `color: var(--foreground)`; `font-variant-numeric: tabular-nums`
- `line-height: .85`, then the size class sets `line-height: var(--text-*--line-height)`. **However**, `<number-flow-react>` injects
  an **unlayered** `:where(number-flow-react){line-height:1}`. Unlayered beats `@layer components`, so the effective line-height
  of the Number Flow element is `1` (computed 14px at md). For the custom `<span>` value the size class line-height applies.

### Sizes (base → `md:` breakpoint)
| Size | Group | Buttons (w = h) | Button icon | Pressed scale | Value min-width | Value height | Value font |
|---|---|---|---|---|---|---|---|
| `sm` | `p-0.5` (2px), `gap-0`, rounded-full | 32px → **28px** | 14px (`size-3.5`) | .98 | 24px → **20px** | 32px → **28px** | `text-xs` (12px) |
| `md` | `p-0.5`, `gap-0` | 36px → **32px** | 16px | .98 | 28px → **24px** | 36px → **32px** | `text-sm` (14px) |
| `lg` | `p-0.5`, **`gap-0.5` (2px)** | 40px → **36px** | 20px → **16px** | .96 | 32px → **28px** | 40px → **36px** | `text-base` (16px) |

Measured at a 1024px viewport, md: group 92×36 (2 + 32 + 24 + 32 + 2). sm and lg follow from the table:
sm ≈ 80×32, lg ≈ 108×40. The value grows past min-width as digits are added (for example "-10" is 27.19px at md).
(The `md:` padding rules repeat `p-0.5`, so the group padding is unchanged.)

### CSS custom properties
No `--number-stepper-*` variables. Theme tokens used: `--default`, `--surface`, `--surface-shadow`, `--muted`,
`--foreground`, `--focus`, `--background`, `--ring-offset-width`, `--disabled-opacity`, `--cursor-interactive`,
`--cursor-disabled`, `--spacing`, `--text-xs|sm|base`, `--font-weight-semibold`, `--ease-out`, `--ease-smooth`.

Number Flow variables (library, optional to expose): `--number-flow-mask-height` (default `.25em`) and
`--number-flow-mask-width` (default `.5em`). They control the vertical fade mask on rolling digits.

### Keyframes
None in the Pro CSS. Digit motion is Web Animations API inside Number Flow's shadow DOM.

---

## 5. Behaviour

### Value, bounds and step (RAC NumberField)
- `defaultValue`/`value`/`onChange`, `minValue`, `maxValue` and `step` behave as in RAC. A button becomes **disabled**
  (native `disabled` + `data-disabled="true"`) when the next step would pass the bound. For example, min 0 disables minus at 0
  and max 5 disables plus at 5.
- Negative values show a sign part (`-10`). With formatOptions, prefix and suffix parts come from Intl (`$`, `%`).
- Controlled demo: each click updates the external state (`Value: 5` → `Value: 6`).

### Press and press-and-hold (RAC `useSpinButton`, measured)
- Mouse or pen: one step **immediately on press start**, then after **400ms** it repeats every **60ms** while held.
  Observed log: t=6ms → 1, 414ms → 2, then about every 62ms (3, 4, 5…), stopping on release. It also stops at a bound.
- Touch: no step on press start. A short tap steps on release. Holding starts repeating after **600ms**, then every 60ms.
  The context menu is suppressed while held.
- Pressing a button with the **mouse moves focus to the hidden input** (RAC `onButtonPressStart`). On touch the button itself is
  focused. Buttons have `preventFocusOnPress` and `excludeFromTabOrder`.
- Pressed visual: `scale(.98)` (sm/md) or `.96` (lg), 250ms ease. Icon goes from `--muted` to `--foreground` on hover.

### Keyboard / focus
- **Nothing in the component is in the tab order.** The hidden input has `tabindex="-1"`. This is not RAC's default, so Pro
  sets it on purpose. The buttons are `tabindex="-1"` by RAC design. Pressing Tab from `<body>` did not focus anything.
- Once the input has focus (after a mouse press on a button, or programmatically), RAC NumberField keys work:
  ArrowUp/ArrowDown ±step (measured), Home → min (measured), End → max, PageUp/PageDown. Typing digits commits on blur or Enter.
  Wheel stepping works while focus is inside unless `isWheelDisabled`.
- With keyboard focus the group gets `data-focus-within="true" data-focus-visible="true"`, but **no CSS reacts to it**: there is no visible focus indicator.

### ARIA
- Group `role="group"`. When disabled: `aria-disabled="true"` + `data-disabled="true"`, and the root gets `data-disabled="true"`.
- Input: `aria-roledescription="Number field"`, `inputmode="numeric"`, labelled by `aria-label` or by `<Label>` (`aria-labelledby`).
  `aria-describedby` points at the Description and error-message ids.
- Buttons: `aria-controls={inputId}`. Their aria-label comes from RAC i18n: with an `aria-label` it is "Increase {label}" /
  "Decrease {label}" (e.g. "Decrease Adults"). With a visible `<Label>` it is "Increase"/"Decrease" plus
  `aria-labelledby="{btnId} {labelId}"`.

### Disabled / read-only
- `isDisabled`: both buttons are disabled (opacity .5, `cursor: not-allowed`, no pointer events) and the input is `disabled` + `aria-disabled`.
  **The value text and the group background are not dimmed** (opacity 1, measured).
- `isReadOnly` (RAC): `canIncrement`/`canDecrement` become false, so both buttons are disabled. There is no read-only demo; this is derived from RAC.

### Number animation (`@number-flow/react`)
- Element: `<number-flow-react>` (class name minified, `customElements.get('number-flow-react')` is defined). It uses open shadow DOM.
  The SSR fallback is light DOM: `<style>` + `<span>{formatted}</span>`.
- Effective props on the live element are all **library defaults**:
  - `transformTiming = { duration: 900, easing: "linear(0, .005, .019, .039, .066, .096, .129, .165, .202, .24, .278, .316, .354, .39, .426, .461, .494, .526, .557, .586, .614, .64, .665, .689, .711, .731, .751, .769, .786, .802, .817, .831, .844, .856, .867, .877, .887, .896, .904, .912, .919, .925, .931, .937, .942, .947, .951, .955, .959, .962, .965, .968, .971, .973, .976, .978, .98, .981, .983, .984, .986, .987, .988, .989, .99, .991, .992, .992, .993, .994, .994, .995, .995, .996, .996, .9963, .9967, .9969, .9972, .9975, .9977, .9979, .9981, .9982, .9984, .9985, .9987, .9988, .9989, 1)" }`
  - `spinTiming = undefined` (falls back to transformTiming); `opacityTiming = { duration: 450, easing: "ease-out" }`
  - `trend = (old, new) => Math.sign(new - old)` (default: digits roll up when increasing and down when decreasing)
  - `respectMotionPreference = true`, `animated = true`, `willChange` off (no `data-will-change` attr), no `plugins`, no `digits`
- On change, Number Flow runs about 68 WAAPI animations in its shadow root (composite `accumulate`, 900ms) and animates width
  (`--_number-flow-d-width`, `--_number-flow-dx`), so the pill grows or shrinks smoothly when digit count changes.
- Implementation: `<NumberFlow value={value ?? state.numberValue} format={format ?? formatOptions} className=… data-slot="number-stepper-value" {...numberFlowProps}/>`.
  Pro passing `locales` (for example from RAC `useLocale()`) could not be observed. See open questions.

---

## 6. Demo variants

| # | Demo (docs heading) | URL | What it shows / structure |
|---|---|---|---|
| 1 | Default (docs "Usage") | https://heroui.pro/docs/react/demos/number-stepper-default?theme=light | md; `aria-label="Quantity"`, `defaultValue={1}`, `minValue={0}`, no max (stepped past 27). |
| 2 | Guest Picker | …/number-stepper-guest-picker?theme=light | A booking-style list `w-[380px] flex flex-col divide-y divide-separator`. Four rows `flex items-center justify-between py-5`, each with a text block (`text-foreground text-sm font-semibold` title + `text-muted text-xs` subtitle) and a `size="sm"` stepper with `aria-label` = title, `defaultValue={0}`, min 0 (minus disabled). Rows: Adults "Ages 13 or above", Children "Ages 2–12", Infants "Under 2", Pets "Bringing a service animal?". (Max values unknown: this demo is streamed and did not hydrate in my session. The DOM came from the React streaming placeholder `#S:0`.) |
| 3 | With Label | …/number-stepper-with-label?theme=light | Root `className="flex-col items-start gap-1.5"`; `<Label>Guests</Label>`, Group, `<Description>Maximum 10 guests per reservation</Description>`; `defaultValue={1}`, `minValue={1}`, `maxValue={10}` (verified: plus disables at 10). |
| 4 | Sizes | …/number-stepper-sizes?theme=light | sm / md / lg side by side (`flex items-center gap-6`), each column `flex flex-col items-center gap-2` with a `text-muted text-xs` caption; `aria-label="Quantity {size}"`, `defaultValue={1}`. |
| 5 | With Step | …/number-stepper-with-step?theme=light | Two steppers stacked: captions "Step: 5" and "Step: 10"; `step={5}` / `step={10}`, `defaultValue={0}`, `minValue={0}`. |
| 6 | Min Max Values | …/number-stepper-min-max-values?theme=light | "Min: 0, Max: 5": Rating, `defaultValue={3}`. "Min: -10, Max: 10": Temperature, `defaultValue={0}` (shows negative sign animation). |
| 7 | With Format Options | …/number-stepper-with-format-options?theme=light | "Currency (USD)": Price, `defaultValue={10}`, `formatOptions={{style:"currency", currency:"USD"}}`, shows "$10.00", step 1. "Percentage": Opacity, `defaultValue={50}`, `step={10}`, `formatOptions={{style:"unit", unit:"percent"}}`, shows "50%" (Intl part type `unit`; `style:"percent"` would show 5,000%). |
| 8 | Reversed Layout | …/number-stepper-reversed-layout?theme=light | Child order swapped: `IncrementButton`, `Value`, `DecrementButton`. No special CSS; layout follows DOM order. |
| 9 | With Custom Buttons | …/number-stepper-with-custom-buttons?theme=light | Two columns × 4 OSS Button variants (primary, secondary, tertiary, outline). Group `className="gap-3"` (column 2 adds `bg-transparent`). Buttons: `<Button isIconOnly size="sm" variant={v} slot="decrement">` with a minus icon, and `slot="increment"` with a plus icon. Labels "Quantity {variant}" / "… no bg". |
| 10 | Disabled | …/number-stepper-disabled?theme=light | `isDisabled`, `defaultValue={3}`. |
| 11 | Controlled | …/number-stepper-controlled?theme=light | `useState(5)` + `value`/`onChange`; caption `<span class="text-muted text-sm">Value: {n}</span>` below (`flex flex-col items-center gap-4`). |
| 12 | Custom Icons | …/number-stepper-custom-icons?theme=light | "Zoom level": `defaultValue={100}`, `step={10}`, `minValue={50}`, `maxValue={200}` (verified). Buttons' children are zoom-out and zoom-in magnifier SVGs (24 viewBox, stroke 2, rendered 16px). |
| 13 | Custom Value | …/number-stepper-custom-value?theme=light | `<NumberStepper.Value>{({value}) => <span className="mx-2">{value} {value === 1 ? "item" : "items"}</span>}</NumberStepper.Value>`. It renders as a plain span (no animation). `defaultValue={3}`, min 0 (verified "1 item", "0 items" with minus disabled). |

Every demo also has a `?theme=dark` URL.

---

## 7. Theme tokens and light vs dark

| Token | Light | Dark | Used by |
|---|---|---|---|
| `--default` | `lab(93.03% .10 -.36)` | `lab(15.73% .61 -2.17)` | group pill bg |
| `--surface` | `lab(100% 0 0)` (white) | `lab(8.34% .61 -2.13)` (near-black) | button bg |
| `--surface-shadow` | `0 2px 4px 0 #0000000a, 0 1px 2px 0 #0000000f, 0 0 1px 0 #0000000f` | `0 0 0 0 transparent inset` (none) | button shadow |
| `--muted` | `lab(47.87% 1.41 -4.99)` | `lab(65.65% 1.53 -5.42)` | icon colour |
| `--foreground` | `lab(8.34% .61 -2.13)` | `lab(98.97% 0 0)` | value text, icon hover |
| `--focus` | `lab(54.53% 3.32 -66.53)` | same | (unused in practice) ring |
| `--background` | `lab(96.54% 0 0)` | `lab(1.55% .18 -.65)` | ring offset |
| `--disabled-opacity` | `.5` | `.5` | disabled buttons |
| `--font-weight-semibold` | `600` | `600` | value |

Light: white raised circles with a soft shadow inside a light-grey pill, dark icons on hover.
Dark: near-black flat circles (darker than the pill) inside a dark-grey pill, no shadow.
The OSS theme defines all tokens. **No new tokens.**

---

## 8. Dependencies

- **react-aria-components** (peer): `NumberField`, `Group`, `Input`, `Button`, `NumberFieldStateContext` (to read
  `numberValue` for Value), and `ButtonContext` slots (`increment`/`decrement`), which RAC NumberField provides.
- **react-aria**: `useLocale` (optional, for Number Flow `locales`). Spin behaviour comes from RAC internally.
- **@number-flow/react** (optional peer; already in `packages/pro/package.json` as a dev dependency at 0.6.2 and a peer at `>=0.6.0`):
  `NumberFlow` component and the `Format` type. Keep the component on a subpath export (`@heroui/pro/number-stepper`) so
  the root entry does not import it. `packages/pro` `exports["./*"]` already supports `./src/components/*/index.ts`.
- **OSS HeroUI** (optional composition in demos only): `Label`, `Description`, `Button` (`isIconOnly`, `size="sm"`, variants).
  The component does **not** reuse OSS `NumberField` styles (`.number-field*` classes are not used).
- **Other Pro components**: none.
- Suggested files: `css/components/number-stepper.css` (import into `css/index.css` under "Forms"),
  `src/components/number-stepper/{number-stepper.tsx, number-stepper.styles.ts, index.ts}`.

---

## 9. Open questions / uncertainties

1. **Keyboard accessibility**: Pro makes the hidden input `tabindex="-1"`, so the stepper cannot be reached with Tab and shows no
   focus style. Decide whether to copy this exactly or improve it (e.g. keep the input tabbable and add a
   `[data-focus-visible=true]` ring on the group). Copying it exactly matches Pro but is weaker for a11y.
2. `locales` passed to Number Flow: not observable. Recommend passing `useLocale().locale` unless the consumer overrides it.
3. Whether `formatOptions` should also reach the RAC NumberField (for `aria-valuetext`/input formatting). Observed: it does not, since the input shows raw values.
4. Guest Picker max values (and whether the rows are linked, e.g. infants ≤ adults) are unknown. The demo never hydrated in the background tab.
5. `isReadOnly` and `isInvalid` styling: there are no Pro rules. RAC disables the buttons for read-only. There is no invalid visual.
6. Docs list `[data-disabled="true"]` as a disabled hook for buttons, but the CSS selector is `:disabled, [aria-disabled="true"]`. RAC also sets the native `disabled` attribute, so both paths work.
7. Docs say hover is a "background change". The CSS only changes the icon colour. Follow the CSS.
8. The Sizes demo did not show whether a `minValue` was set (minus enabled at 1). Unimportant.

---

## Appendix A — raw CSSOM dump (rules matching `/number-stepper|number-flow/`)

Captured from `https://heroui.pro/docs/react/demos/number-stepper-default?theme=light`. Format: `<context> :: <cssText>`.

```css
@layer components :: .number-stepper { flex-shrink: 0; display: inline-flex; }
@layer components :: .number-stepper__group { border-style: var(--tw-border-style); background-color: var(--default); --tw-shadow: 0 0 #0000; box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); border-width: 0px; border-radius: 2.14748e+09px; align-items: center; gap: 0px; padding: 0px; display: inline-flex; }
@layer components :: .number-stepper__input { clip-path: inset(50%); white-space: nowrap; border-width: 0px; width: 1px; height: 1px; margin: -1px; padding: 0px; position: absolute; overflow: hidden; }
@layer components :: .number-stepper__decrement-button, .number-stepper__increment-button { height: calc(var(--spacing) * 9); width: calc(var(--spacing) * 9); border-style: var(--tw-border-style); background-color: var(--surface); --tw-shadow: var(--surface-shadow); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); --tw-outline-style: none; -webkit-tap-highlight-color: transparent; border-width: 0px; border-radius: 2.14748e+09px; outline-style: none; flex-shrink: 0; justify-content: center; align-items: center; display: flex; position: relative; }
@layer components > @media (min-width: 48rem) :: .number-stepper__decrement-button, .number-stepper__increment-button { height: calc(var(--spacing) * 8); width: calc(var(--spacing) * 8); }
@layer components :: .number-stepper__decrement-button, .number-stepper__increment-button { cursor: var(--cursor-interactive); transition: background-color .1s var(--ease-out), box-shadow .1s var(--ease-out), transform .25s var(--ease-smooth); transform: translateZ(0) var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,); }
@layer components :: :is(.number-stepper__decrement-button, .number-stepper__increment-button):is([data-reduce-motion="true"], [data-reduce-motion="true"] *), :is(.number-stepper__decrement-button, .number-stepper__increment-button):is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::before, :is(.number-stepper__decrement-button, .number-stepper__increment-button):is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::after { transition-property: none; }
@layer components > @media (prefers-reduced-motion: reduce) :: :is(.number-stepper__decrement-button, .number-stepper__increment-button):not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)), :is(.number-stepper__decrement-button, .number-stepper__increment-button):not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::before, :is(.number-stepper__decrement-button, .number-stepper__increment-button):not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::after { transition-property: none; }
@layer components :: :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); color: var(--muted); flex-shrink: 0; transition: color 0.15s; }
@layer components :: :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg:is([data-reduce-motion="true"], [data-reduce-motion="true"] *), :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::before, :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)::after { transition-property: none; }
@layer components > @media (prefers-reduced-motion: reduce) :: :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *)), :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::before, :is(.number-stepper__decrement-button, .number-stepper__increment-button) svg:not(:is([data-reduce-motion="true"], [data-reduce-motion="true"] *))::after { transition-property: none; }
@layer components > @media (hover: hover) :: :is(:is(.number-stepper__decrement-button, .number-stepper__increment-button):hover, :is(.number-stepper__decrement-button, .number-stepper__increment-button)[data-hovered="true"]) svg { color: var(--foreground); }
@layer components :: :is(.number-stepper__decrement-button, .number-stepper__increment-button):active, :is(.number-stepper__decrement-button, .number-stepper__increment-button)[data-pressed="true"] { transform: scale(0.97); }
@layer components :: :is(.number-stepper__decrement-button, .number-stepper__increment-button):focus-visible:not([data-focused]), :is(.number-stepper__decrement-button, .number-stepper__increment-button)[data-focus-visible="true"] { --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor); box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); --tw-ring-color: var(--focus); --tw-ring-offset-width: var(--ring-offset-width); --tw-ring-offset-shadow: var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-offset-color: var(--background); --tw-outline-style: none; outline-style: none; }
@layer components :: :is(.number-stepper__decrement-button, .number-stepper__increment-button):disabled, :is(.number-stepper__decrement-button, .number-stepper__increment-button)[aria-disabled="true"] { opacity: var(--disabled-opacity); cursor: var(--cursor-disabled); pointer-events: none; }
@layer components :: .number-stepper__value { --tw-font-weight: var(--font-weight-semibold); font-weight: var(--font-weight-semibold); color: var(--foreground); font-variant-numeric: tabular-nums; justify-content: center; align-items: center; line-height: 0.85; display: flex; }
@layer components :: .number-stepper__group--sm { padding: calc(var(--spacing) * .5); border-radius: 2.14748e+09px; gap: 0px; }
@layer components > @media (min-width: 48rem) :: .number-stepper__group--sm { padding: calc(var(--spacing) * .5); }
@layer components :: .number-stepper__decrement-button--sm, .number-stepper__increment-button--sm { height: calc(var(--spacing) * 8); width: calc(var(--spacing) * 8); }
@layer components > @media (min-width: 48rem) :: .number-stepper__decrement-button--sm, .number-stepper__increment-button--sm { height: calc(var(--spacing) * 7); width: calc(var(--spacing) * 7); }
@layer components :: :is(.number-stepper__decrement-button--sm, .number-stepper__increment-button--sm) svg { width: calc(var(--spacing) * 3.5); height: calc(var(--spacing) * 3.5); }
@layer components :: :is(.number-stepper__decrement-button--sm, .number-stepper__increment-button--sm):active, :is(.number-stepper__decrement-button--sm, .number-stepper__increment-button--sm)[data-pressed="true"] { transform: scale(0.98); }
@layer components :: .number-stepper__value--sm { min-width: calc(var(--spacing) * 6); font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); }
@layer components > @media (min-width: 48rem) :: .number-stepper__value--sm { min-width: calc(var(--spacing) * 5); }
@layer components :: .number-stepper__value--sm { height: calc(var(--spacing) * 8); }
@layer components > @media (min-width: 48rem) :: .number-stepper__value--sm { height: calc(var(--spacing) * 7); }
@layer components :: .number-stepper__group--md { padding: calc(var(--spacing) * .5); border-radius: 2.14748e+09px; gap: 0px; }
@layer components > @media (min-width: 48rem) :: .number-stepper__group--md { padding: calc(var(--spacing) * .5); }
@layer components :: .number-stepper__decrement-button--md, .number-stepper__increment-button--md { height: calc(var(--spacing) * 9); width: calc(var(--spacing) * 9); }
@layer components > @media (min-width: 48rem) :: .number-stepper__decrement-button--md, .number-stepper__increment-button--md { height: calc(var(--spacing) * 8); width: calc(var(--spacing) * 8); }
@layer components :: :is(.number-stepper__decrement-button--md, .number-stepper__increment-button--md) svg { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); }
@layer components :: :is(.number-stepper__decrement-button--md, .number-stepper__increment-button--md):active, :is(.number-stepper__decrement-button--md, .number-stepper__increment-button--md)[data-pressed="true"] { transform: scale(0.98); }
@layer components :: .number-stepper__value--md { min-width: calc(var(--spacing) * 7); font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); }
@layer components > @media (min-width: 48rem) :: .number-stepper__value--md { min-width: calc(var(--spacing) * 6); }
@layer components :: .number-stepper__value--md { height: calc(var(--spacing) * 9); }
@layer components > @media (min-width: 48rem) :: .number-stepper__value--md { height: calc(var(--spacing) * 8); }
@layer components :: .number-stepper__group--lg { gap: calc(var(--spacing) * .5); padding: calc(var(--spacing) * .5); border-radius: 2.14748e+09px; }
@layer components > @media (min-width: 48rem) :: .number-stepper__group--lg { padding: calc(var(--spacing) * .5); }
@layer components :: .number-stepper__decrement-button--lg, .number-stepper__increment-button--lg { height: calc(var(--spacing) * 10); width: calc(var(--spacing) * 10); }
@layer components > @media (min-width: 48rem) :: .number-stepper__decrement-button--lg, .number-stepper__increment-button--lg { height: calc(var(--spacing) * 9); width: calc(var(--spacing) * 9); }
@layer components :: :is(.number-stepper__decrement-button--lg, .number-stepper__increment-button--lg) svg { width: calc(var(--spacing) * 5); height: calc(var(--spacing) * 5); }
@layer components > @media (min-width: 48rem) :: :is(.number-stepper__decrement-button--lg, .number-stepper__increment-button--lg) svg { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); }
@layer components :: :is(.number-stepper__decrement-button--lg, .number-stepper__increment-button--lg):active, :is(.number-stepper__decrement-button--lg, .number-stepper__increment-button--lg)[data-pressed="true"] { transform: scale(0.96); }
@layer components :: .number-stepper__value--lg { min-width: calc(var(--spacing) * 8); font-size: var(--text-base); line-height: var(--tw-leading,var(--text-base--line-height)); }
@layer components > @media (min-width: 48rem) :: .number-stepper__value--lg { min-width: calc(var(--spacing) * 7); }
@layer components :: .number-stepper__value--lg { height: calc(var(--spacing) * 10); }
@layer components > @media (min-width: 48rem) :: .number-stepper__value--lg { height: calc(var(--spacing) * 9); }
/* unlayered, injected by @number-flow/react SSR fallback <style> */
:where(number-flow-react) { line-height: 1; }
number-flow-react > span { font-kerning: none; display: inline-block; padding: calc(round(nearest, calc(var(--number-flow-mask-height, 0.25em) / 2), 1px) * 2) 0; }
```

No `@keyframes` are used by these rules.

## Appendix B — measured computed values (light, md, viewport 1024px)

```
.number-stepper            display flex (in flex parent), 92×36
.number-stepper__group     bg lab(93.03 .099 -.364) · padding 2px · gap 0 · radius full · shadow none
.number-stepper__*-button  32×32 · bg lab(100 0 0) · shadow rgba(0,0,0,.04) 0 2px 4px, rgba(0,0,0,.06) 0 1px 2px, rgba(0,0,0,.06) 0 0 1px
                           transition "background-color .1s cubic-bezier(0,0,.2,1), box-shadow .1s cubic-bezier(0,0,.2,1), transform .25s"
  svg                      16×16 · color lab(47.87 …) (muted)
.number-stepper__value     24×32 · 14px / line-height 14px (=1) · 600 · tabular-nums · color lab(8.34 …)
hold-to-repeat log (mouse) 6ms:1 → 414ms:2 → 476:3 → 539:4 → 601:5 … (≈62ms interval)
```
