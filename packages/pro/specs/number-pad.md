# Number Pad — clean-room implementation spec

Slug: `number-pad` · Origin: **HeroUI Pro Native** (React Native) · Docs: https://heroui.pro/docs/native/components/number-pad · Category: Forms
Native import: `import { NumberPad } from 'heroui-native-pro';` → web: `import {NumberPad} from "@heroui/pro/number-pad";`
(root re-export from `src/index.ts` is owned by the orchestrator).

Sources used: the public Native docs page (anatomy, usage snippets, Example, API tables) and the public demo
videos `number-pad-docs-light.mp4` (6.75 s) and `number-pad-docs-dark.mp4` (6.83 s), analysed frame by frame
(0.033 s steps around every press, 1920 px wide frames, pixel scans of key edges and colours). No JS bundles, source
maps, npm/GitHub sources, "Copy prompt"/MCP endpoints or sign-in were used.

---

## 1. Purpose

A numeric keypad for PINs, one-time codes and amounts. A column of rows of equal-width keys; keys append their value to
a string value, Backspace deletes one character (long press clears), an optional Spacer cell keeps the grid aligned or
becomes an action key (e.g. biometrics). Keys have a subtle press animation (scale 0.97 + pressed surface colour).

---

## 2. Anatomy

```tsx
<NumberPad>                       // <div role="group"> column, owns the value state
  <NumberPad.Row>                 // <div> flex row, equal-width cells
    <NumberPad.Key value="1" />   // RAC Button; default child <NumberPad.KeyLabel/>
    <NumberPad.Key value="2" />
    <NumberPad.Key value="3" />
  </NumberPad.Row>
  <NumberPad.Row>
    <NumberPad.Spacer />          // inert <div aria-hidden> (a RAC Button when it has children)
    <NumberPad.Key value="0" />
    <NumberPad.Backspace />       // RAC Button; default child = arrow icon
  </NumberPad.Row>
</NumberPad>
```

Without children the root renders the default 3 × 4 layout above (1-2-3 / 4-5-6 / 7-8-9 / Spacer-0-Backspace).

| Part                               | Element                                             | `data-slot`                 | BEM class                    | Primitive                |
| ---------------------------------- | --------------------------------------------------- | --------------------------- | ---------------------------- | ------------------------ |
| `NumberPad` (root)                 | `<div role="group" aria-label="Number pad">`        | `number-pad`                | `number-pad`                 | DOM + context            |
| `NumberPad.Row`                    | `<div>`                                             | `number-pad-row`            | `number-pad__row`            | DOM                      |
| `NumberPad.Key`                    | `<button data-value="…">`                           | `number-pad-key`            | `number-pad__key`            | RAC `Button`             |
| `NumberPad.KeyBackground`          | `<span aria-hidden>` absolute fill                  | `number-pad-key-background` | `number-pad__key-background` | DOM                      |
| `NumberPad.KeyLabel`               | `<span>`                                            | `number-pad-key-label`      | `number-pad__key-label`      | DOM                      |
| `NumberPad.Backspace`              | `<button aria-label="Delete">` + hidden description | `number-pad-backspace`      | `number-pad__backspace`      | RAC `Button`             |
| backspace icon                     | `<svg aria-hidden>`                                 | `number-pad-backspace-icon` | `number-pad__backspace-icon` | inline SVG (own drawing) |
| `NumberPad.Spacer` (inert)         | `<div aria-hidden>`                                 | `number-pad-spacer`         | `number-pad__spacer`         | DOM                      |
| `NumberPad.Spacer` (with children) | `<button data-action="true">`                       | `number-pad-spacer`         | `number-pad__spacer`         | RAC `Button`             |

State attributes: root `data-disabled`, `data-complete` (value length ≥ maxLength), `data-animation="disable-all"`;
cells (from RAC) `data-pressed`, `data-hovered`, `data-focused`, `data-focus-visible`, `data-disabled`, plus our
`data-animation="disabled"` when the press animation is off.

---

## 3. API (Native docs → web)

### NumberPad (root)

| prop                    | type                         | default                | web notes                                                                                       |
| ----------------------- | ---------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| children                | ReactNode                    | –                      | omitted → default grid                                                                          |
| value / defaultValue    | string                       | – / `""`               | controlled / uncontrolled                                                                       |
| maxLength               | number                       | –                      | extra key presses ignored once reached; a multi-character key is truncated to fit               |
| isDisabled              | boolean                      | false                  | disables every cell (RAC `isDisabled`)                                                          |
| className               | string                       | –                      |                                                                                                 |
| onValueChange           | (value) => void              | –                      |                                                                                                 |
| onKeyPress              | (key, nextValue) => void     | –                      | only when the key appended something (the DOM `onKeyPress` is omitted from the div props)       |
| onBackspacePress        | (value) => void              | –                      | value after deletion; fired on every Backspace press (also when empty)                          |
| onSpacerPress           | () => void                   | –                      | used by a Spacer with children and no own `onPress`                                             |
| onClear                 | () => void                   | –                      | Backspace long press (or Ctrl/Cmd + Backspace on a keyboard); only when the value was not empty |
| onComplete              | (value) => void              | –                      | when an append makes `value.length === maxLength`                                               |
| animation               | `"disable-all"` \| undefined | –                      | disables every key's press animation                                                            |
| isHapticFeedbackEnabled | boolean                      | HapticsProvider (true) | **web addition** (user requirement)                                                             |
| ...div props            |                              |                        | `ref` (React 19), aria-label (default "Number pad"), aria-labelledby, …                         |

Callback order for an appending press: `onValueChange` → `onKeyPress` → `onComplete`.

### NumberPad.Row

`children`, `className`, all div props.

### NumberPad.Key

| prop                  | type                                                       | default  | web notes                                                                                                    |
| --------------------- | ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| value                 | string                                                     | –        | required; appended on press; also the default label and the `data-value` used for keyboard input             |
| children              | ReactNode \| (props: NumberPadKeyRenderProps) => ReactNode | KeyLabel | render props = RAC ButtonRenderProps (`isPressed`, `isDisabled`, `isHovered`, `isFocusVisible`, …) + `value` |
| isDisabled            | boolean                                                    | false    | independent of the root                                                                                      |
| className             | string \| (renderProps) => string                          | –        |                                                                                                              |
| animation             | NumberPadKeyAnimation                                      | –        | see below                                                                                                    |
| isAnimatedStyleActive | boolean                                                    | true     | false → the built-in scale style is not applied                                                              |
| background            | ReactNode                                                  | –        | `undefined` → theme default (none on the web), node → rendered behind the content, `null` → nothing          |
| ...RAC ButtonProps    |                                                            |          | `onPress`/`onPressStart` are called after the pad's own handlers                                             |

`NumberPadKeyAnimation = boolean | "disabled" | { state?: "disabled" | boolean; scale?: { value?: number /*0.97*/; timingConfig?: { duration?: number /*150*/; easing?: string } } }`.
On the web `timingConfig.easing` is a CSS easing string (Reanimated easing functions do not exist); the values are written
to `--number-pad-key-scale`, `--number-pad-key-duration`, `--number-pad-key-easing` on the cell.

### NumberPad.KeyBackground

Absolute-fill `<span>` behind the key content (`inset-0`, `-z-1`, `border-radius: inherit`, clipped by the cell).
Children are custom content (gradient, image, blur…). Pass it through a cell's `background` prop.

### NumberPad.KeyLabel

`<span>`; children default to the parent key's value (from `NumberPadKeyContext`).

### NumberPad.Backspace

| prop                                                    | type                                                      | default    | web notes             |
| ------------------------------------------------------- | --------------------------------------------------------- | ---------- | --------------------- |
| children                                                | ReactNode \| render fn                                    | arrow icon |                       |
| isDisabled, className, animation, isAnimatedStyleActive |                                                           |            | as Key                |
| iconProps                                               | `{ size?: number /*24*/; color?: string /*foreground*/ }` |            | ignored with children |
| background                                              | ReactNode                                                 | `null`     | transparent surface   |
| aria-label                                              | string                                                    | "Delete"   |                       |

### NumberPad.Spacer

| prop                                                                                         | type                   | default | web notes                                                                                 |
| -------------------------------------------------------------------------------------------- | ---------------------- | ------- | ----------------------------------------------------------------------------------------- |
| children                                                                                     | ReactNode \| render fn | –       | none → inert aligned cell; children → action button (needs `aria-label` for icon content) |
| isDisabled, className, animation, isAnimatedStyleActive, background (`null`), ...ButtonProps |                        |         | own `onPress` wins over the root `onSpacerPress`                                          |

Also exported: `NumberPadContext`, `NumberPadKeyContext`, `numberPadVariants`, all prop types and the `NumberPad.*Props`
type namespace.

---

## 4. Styling (measured in the video → web)

Calibration: the phone screen is 757 px wide in the 1920 px frames; the 20 dp side padding (`px-5` in the docs
Example) is 38 px, giving 1.88 px/dp (a 402 dp wide device). All values below are dp = CSS px.

| Element              | Measured                                                              | Web                                                                     |
| -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Root                 | column, full width (20 px screen padding comes from the Example)      | `flex w-full flex-col gap-2`                                            |
| Row gap / column gap | 8 / 8                                                                 | `gap-2`                                                                 |
| Key size             | flex-1 (≈115 wide on a 402 screen) × 64                               | `h-16 flex-1 basis-0`                                                   |
| Key radius           | continuous corner ≈16 (curve spans ≈23)                               | `calc(var(--radius) * 2.5)` = 20 px circular (follows the theme radius) |
| Key surface          | light rgb(235) / dark rgb(38,38,41)                                   | `bg-default`                                                            |
| Pressed surface      | light rgb(227) / dark rgb(48) — same on keys and Backspace            | `bg-default-hover`                                                      |
| Screen background    | light rgb(246) / dark ≈rgb(5–11)                                      | `bg-background` (stories)                                               |
| Key label            | cap height ≈21.8 → 30 px, semibold weight, foreground                 | `text-3xl font-semibold leading-none tabular-nums text-foreground`      |
| Backspace icon       | left arrow ≈19 × 14 in a 24 box, ≈1.75 stroke, foreground, no surface | own 24 px SVG, `strokeWidth 2`, mirrored in RTL                         |
| Spacer               | empty, transparent                                                    | `div.number-pad__spacer`                                                |

Hover (web only, `@media (hover: hover)` + `[data-hovered]`): keys → `bg-default-hover` (OSS tertiary button
convention); Backspace / Spacer action → `bg-default`. Focus: `status-focused` on `data-focus-visible`. Disabled:
`status-disabled` on every cell. Root and cells use `touch-action: manipulation` (no double-tap zoom on fast taps),
`select-none`, `no-highlight`, `-webkit-touch-callout: none`.

---

## 5. Behaviour, timings and gestures

Press feedback (from 30 fps frame scans of keys 6, 9 and Backspace, light + dark):

- The surface switches to the pressed colour **instantly** on touch-down and back instantly on release (no colour
  transition) → no background transition in CSS.
- The cell scales to **0.97** (220 px → 213–214 px wide) over ≈130–150 ms with an ease-in-out shape, and returns in
  ≈130 ms → `transform: scale(var(--number-pad-key-scale, .97))`, `150ms cubic-bezier(0.455, 0.03, 0.515, 0.955)`
  (Reanimated's default `withTiming` easing, matching the docs' `{ duration: 150 }`).
- The label scales with the cell.
- The value changes on **release** (the display updates one frame before the pressed colour clears), like an RN
  Pressable `onPress` → RAC `onPress` (pointer up inside the cell; dragging out cancels).
- Backspace has a transparent surface but shows the same pressed colour + scale.
- Video sequence: 4 → 8 → 6 → 9 ("PIN complete" appears on the 4th digit, `onComplete`), then four single Backspace
  presses back to the empty placeholder `••••`. No long press is shown in the video.

Long press: holding Backspace for **500 ms** (React Native's default `delayLongPress`) clears the value (`onClear`);
the release then does not delete again. Re-pressing resets the long-press state.

`prefers-reduced-motion`: the scale transition is removed (`motion-reduce:transition-none`), the pressed state still
appears instantly.

### Haptics (user requirement, `isHapticFeedbackEnabled`, default from `HapticsProvider`)

All calls happen synchronously inside RAC's `onPressStart` (pointerdown / keydown) or the root keydown handler:

| moment                                                           | type                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Key press start (pointer or Enter/Space) and a typed digit       | `light`                                                                                                                  |
| Backspace press start / physical Backspace                       | `rigid`                                                                                                                  |
| Backspace long press fires (500 ms timer) / Ctrl/Cmd + Backspace | `heavy` (timer: plays on Android via sticky activation, best effort on iOS)                                              |
| Spacer action press start                                        | `light`                                                                                                                  |
| none                                                             | disabled pad or key (RAC sends no press events), a key press while `maxLength` blocks input, Backspace on an empty value |

---

## 6. Accessibility and keyboard

- Root: `role="group"` with `aria-label` (default "Number pad") / `aria-labelledby`; `aria-disabled` when disabled.
- Keys are real buttons (RAC `Button`): Tab order, Enter/Space press, focus ring only for keyboard focus. The
  accessible name is the label text (custom content → pass `aria-label`).
- Backspace: `aria-label="Delete"` and `aria-describedby` → hidden "Long press to clear".
- Physical keyboard while focus is inside the pad: typing a character that matches a `Key` value presses it (pressed
  state shown while the key is held, digit auto-repeat ignored for PIN safety); `Backspace` deletes (auto-repeat
  deletes like a text field); `Ctrl/Cmd + Backspace` clears; arrow keys move focus to the nearest enabled cell in that
  row / column (geometry based, works in RTL).
- Gesture alternatives: long press → hold Enter/Space on Delete for 500 ms, or Ctrl/Cmd + Backspace, or VoiceOver /
  TalkBack double-tap-and-hold.
- The pad never announces the value (PINs); the consumer's display decides (stories use `aria-live` on non-secret
  readouts and a "n of 4" count for PINs).

---

## 7. Demo list (stories, `Pro/Forms/NumberPad`)

| Story             | Docs section       | Content                                                                                                   |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| BasicUsage        | Basic Usage        | default grid, controlled; argTypes `isDisabled`, `maxLength`, `animation`, `isHapticFeedbackEnabled`      |
| ManualComposition | Manual Composition | explicit rows; a "." key instead of the spacer, amount sanitised in `onValueChange`                       |
| MaxLength         | Max Length         | 6-digit code, `onComplete` → simulated verification                                                       |
| CustomKeyContent  | Custom Key Content | render function: accent surface + `text-accent-foreground` label while pressed                            |
| SpacerAction      | Spacer Action      | fingerprint icon in the Spacer, `onSpacerPress`                                                           |
| Disabled          | Disabled           | `defaultValue="5678" isDisabled`                                                                          |
| Example           | Example            | phone frame (390 × 780), `value.padEnd(4, "•")` in `text-2xl font-semibold tracking-[0.4em]`, status line |

---

## 8. Deviations from Native

- No glass/theme-registered `KeyBackground` default on the web: `background={undefined}` renders nothing; pass a
  `NumberPad.KeyBackground` (or any node) explicitly.
- `animation.scale.timingConfig` takes CSS `duration` (ms) + `easing` (string) instead of Reanimated config;
  `isAnimatedStyleActive={false}` simply removes the built-in scale.
- `iconProps.color` is any CSS colour (default `currentColor` = foreground).
- Web additions: hover styles, keyboard input / arrow navigation, `isHapticFeedbackEnabled`, `data-complete`,
  root `aria-label`.
- iOS continuous ("squircle") 16 dp corners are approximated with a 20 px circular radius (`--radius` × 2.5), which matches the visible curve.

---

## 9. Verification (web port, Storybook, headless Edge)

- Phone emulation (390–422 px, DPR 2, touch): mid-press `transform: scale(0.97)` + `bg-default-hover`, value appended on
  touch end, drag-out cancels, 5th digit blocked at `maxLength=4` (no haptic), Backspace tap deletes (`rigid`), 700 ms
  hold clears (`rigid` then `heavy` at 500 ms) without an extra deletion, Backspace on empty → no haptic.
- Sampled scale curve (mouse press): 1.000 → 0.971 at ≈150 ms, back to 1.000 ≈150 ms after release; with
  `prefers-reduced-motion: reduce` it jumps.
- Desktop: hover (`data-hovered`) colours, focus ring via Tab, digits / Backspace / Ctrl+Backspace typed while a key is
  focused, arrow navigation (0 → ↑ 8 → ← 7, edges stop), Enter on Delete deletes, holding Space on Delete clears.
- Light and dark screenshots of all stories compared with the video frames (sizes, colours, label size, arrow).
