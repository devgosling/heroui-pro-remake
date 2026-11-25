# Stepper (`stepper`) - clean-room implementation spec

Slug: `stepper` · Docs: https://heroui.pro/docs/react/components/stepper · Category: Navigation
Import (Pro): `import {Stepper} from "@heroui-pro/react";` (root export, no heavy peers)
Storybook (remake): `Pro/Navigation/Stepper`

Sources: the public docs page text, the server-rendered DOM of the 19 public demo pages, the public
stylesheet / CSSOM rules of those pages, computed styles, `getBoundingClientRect()` metrics, and runtime
probing (clicks, keyboard, hover/press, `document.getAnimations()`), in light and dark. Observed on
2026-11-24. I did not open or try to get around the paywalled example source ("Unlock the code"),
JS chunks, source maps or the Copy-prompt / MCP / llms endpoints.

---

## 1. Purpose

"A step-by-step progress indicator with numbered, icon, and bullet variants in horizontal or vertical
layouts." It shows an ordered list of steps. Each step has a status (`complete` / `active` / `inactive`)
derived from the current step index. Steps can be display-only, or clickable when `onStepChange` is provided.

---

## 2. Anatomy

```tsx
<Stepper>                                   // <ol aria-label="Progress">
  <Stepper.Step>                            // <li>; wraps its non-separator children in a step button
    <Stepper.Indicator>                     // circle badge
      <Stepper.Icon />                      // optional: replaces the step number
    </Stepper.Indicator>
    <Stepper.Content>
      <Stepper.Title />
      <Stepper.Description />               // optional
    </Stepper.Content>
    <Stepper.Separator />                   // rendered OUTSIDE the step button; auto-hidden on the last step
  </Stepper.Step>
</Stepper>
```

### Rendered DOM (interactive, horizontal, md; from SSR of `stepper-default`)

```html
<ol aria-label="Progress" class="stepper stepper--horizontal stepper--md" data-slot="stepper">
  <li class="stepper__step stepper__step--horizontal" data-index="0" data-slot="stepper-step" data-status="complete">
    <button class="stepper__step-button stepper__step-button--horizontal" data-clickable="true"
            data-slot="stepper-step-button" type="button">
      <span class="stepper__indicator stepper__indicator--md" data-slot="stepper-indicator" data-status="complete">
        <span class="stepper__icon" data-slot="stepper-icon">
          <svg aria-hidden="true" data-slot="stepper-default-checkmark" fill="none" role="presentation"
               stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
               viewBox="0 0 17 18"><polyline points="1 9 7 14 15 4"/></svg>
        </span>
      </span>
      <span class="stepper__content stepper__content--horizontal" data-slot="stepper-content">
        <span class="stepper__title stepper__title--md" data-slot="stepper-title">…</span>
      </span>
    </button>
    <div aria-hidden="true" class="stepper__separator stepper__separator--horizontal" data-slot="stepper-separator">
      <div class="stepper__separator-track stepper__separator-track--horizontal" data-complete="true"
           data-slot="stepper-separator-track">
        <div class="stepper__separator-fill stepper__separator-fill--horizontal" data-slot="stepper-separator-fill"
             style="--stepper-separator-progress:1"></div>
      </div>
    </div>
  </li>
  <li … data-index="1" data-status="active">
    <button aria-current="step" …>
      <span class="stepper__indicator …" data-status="active"><span>2</span></span> …
    </button> …
  </li>
  … last <li> has no separator …
</ol>
```

| Part | Element | `data-slot` | BEM classes | Notes |
|---|---|---|---|---|
| `Stepper` | `<ol aria-label="Progress">` | `stepper` | `stepper stepper--{horizontal\|vertical} stepper--{sm\|md\|lg}` (orientation first) | `aria-label` defaults to "Progress" in every demo |
| `Stepper.Step` | `<li data-index data-status>` | `stepper-step` | `stepper__step stepper__step--{o}` | index = position among the root's children |
| step button (automatic) | `<button type="button" data-clickable="true">` when interactive, `<div>` otherwise | `stepper-step-button` | `stepper__step-button stepper__step-button--{o}` | plain native button (no RAC attributes, no tabindex); `aria-current="step"` on the active step |
| `Stepper.Indicator` | `<span data-status>` | `stepper-indicator` | `stepper__indicator stepper__indicator--{size}` | default content: `<span>{index+1}</span>`, or the checkmark when complete |
| `Stepper.Icon` | `<span>` | `stepper-icon` | `stepper__icon` | |
| default checkmark | `<svg>` | `stepper-default-checkmark` | – | viewBox 0 0 17 18, polyline `1 9 7 14 15 4`, stroke 2.5, round caps/joins |
| `Stepper.Content` | `<span>` | `stepper-content` | `stepper__content stepper__content--{o}` | |
| `Stepper.Title` | `<span>` | `stepper-title` | `stepper__title stepper__title--{size}` | |
| `Stepper.Description` | `<span>` | `stepper-description` | `stepper__description stepper__description--{size}` | |
| `Stepper.Separator` | `<div aria-hidden="true">` > track `<div>` > fill `<div>` | `stepper-separator`, `stepper-separator-track`, `stepper-separator-fill` | `stepper__separator(--{o})`, `stepper__separator-track(--{o})`, `stepper__separator-fill(--{o})` | track gets `data-complete="true"` when progress ≥ 1; fill carries inline `--stepper-separator-progress` |

Observed child placement: everything except `Stepper.Separator` goes inside the step button, including
arbitrary extra elements (Package Tracking puts a timestamp `<span>` after `Stepper.Content`). The separator
is a sibling of the button inside the `<li>`.

No OSS HeroUI component is used inside the stepper itself. The demos use the OSS `Button` around it.

---

## 3. API (docs)

### `Stepper` (root): "Renders an ol element with step progress tracking."
| Prop | Type | Default | Description |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `currentStep` | `number` | – | Current active step index (controlled) |
| `defaultStep` | `number` | `0` | Initial step index (uncontrolled) |
| `onStepChange` | `(step: number) => void` | – | Called when a step is clicked; makes steps interactive when provided |
| `children` | `ReactNode` | – | Steps |
Plus all native `ol` attributes.

### `Stepper.Step`: an `li` that provides step context. `children: ReactNode` + native `li` attributes.

### `Stepper.Indicator`: circle badge. Inactive/active shows the 1-based number. Complete shows an animated checkmark.
`children` (custom content overriding number/checkmark), `className`.

### `Stepper.Content` / `Stepper.Title` / `Stepper.Description` / `Stepper.Icon`: `span`s, `children` + native span attributes.

### `Stepper.Separator`: "Connector line between steps. Automatically hidden on the last step."
| Prop | Type | Default | Description |
|---|---|---|---|
| `progress` | `number` | – | Explicit progress (0-1). Auto-computed from `currentStep` when omitted |
| `force` | `boolean` | `false` | Render even on the last step |
Plus native `div` attributes.

### `useStepperStep()`: returns `{index: number; status: 'inactive' \| 'active' \| 'complete'; isLast: boolean}`.

Derived behaviour (observed):
- `status = index < currentStep ? complete : index === currentStep ? active : inactive`.
- Auto progress = `1` for a complete step, else `0` (default demo: `1,0,0`). Package Tracking passes an explicit
  `progress` on the active step (`0.3999999999999999`, i.e. a computed value).
- Indicator children: in Package Tracking the complete steps render the default checkmark, the active step a
  custom `Stepper.Icon`, and the inactive steps an empty indicator. The remake treats `children === undefined`
  as "use the default" and renders anything else (including `null`) as given.
- Custom Completed Icon: custom icon only on complete steps, numbers elsewhere.
- Render Function / Dynamic Icon: icon chosen from the step status (circle-check vs dot; filled vs outline folder).

---

## 4. Styling (CSSOM, `@layer components`)

Root custom properties (public API):

| Variable | Default | Size overrides |
|---|---|---|
| `--stepper-indicator-size` | `28px` | sm `22px`, lg `36px` |
| `--stepper-separator-size` | `2px` | – |
| `--stepper-vertical-gap` | `16px` | sm `12px`, lg `24px` |
| `--stepper-active-color` | `var(--color-accent)` | |
| `--stepper-complete-color` | `var(--color-accent)` | |
| `--stepper-complete-fg` | `var(--color-accent-foreground)` | |
| `--stepper-inactive-border` | `var(--color-border)` | |
| `--stepper-inactive-fg` | `var(--color-muted)` | |
| `--stepper-separator-progress` | set inline on the fill (0-1) | |

| Selector | Declarations (Tailwind shorthand) |
|---|---|
| `.stepper` | vars above, `m-0 p-0 list-none` |
| `--horizontal` / `--vertical` | `flex items-start` / `flex flex-col` |
| `.stepper__step` | `relative` |
| `__step--horizontal` | `relative flex flex-1 flex-col items-center overflow-visible` |
| `__step--vertical` | `relative flex flex-col pb-(--stepper-vertical-gap)`, `:last-child pb-0` |
| `.stepper__step-button` | `flex items-center p-0 border-0 bg-transparent rounded-lg (radius×1) outline-none no-highlight transform-gpu transition-colors duration-100` + motion-reduce none |
| `[data-clickable=true]` | `cursor: var(--cursor-interactive)`; hover (`@media (hover:hover)`, `:hover`/`[data-hovered=true]`) → **indicator** `opacity .8`; `:active`/`[data-pressed=true]` → button `opacity .8`; `:focus-visible` → focus ring (`ring-2 ring-focus`, offset `var(--ring-offset-width)` in `var(--background)`, same as OSS `status-focused`) |
| `__step-button--horizontal` | `relative z-10 flex-col items-center gap-1.5` |
| `__step-button--vertical` | `relative z-10 flex-row items-start gap-2.5` |
| `.stepper__indicator` | `size-(--stepper-indicator-size) border-2 solid rounded-full shrink-0 flex items-center justify-center` |
| `[data-status=inactive]` | border `--stepper-inactive-border`, color `--stepper-inactive-fg`, transparent bg |
| `[data-status=active]` | border + color `--stepper-active-color`, transparent bg |
| `[data-status=complete]` | bg + border `--stepper-complete-color`, color `--stepper-complete-fg`, `shadow-sm`, `animation: stepper-indicator-complete .3s ease-out` (motion-reduce none) |
| `__indicator--sm/md/lg` | `text-[10px]` / `text-xs` / `text-sm`, all `font-semibold` |
| `.stepper__icon` | `flex items-center justify-center`; `svg` → `width/height: 55%`; default checkmark → `44%` |
| default checkmark | `transform-gpu`; `polyline { stroke-dasharray: 22; stroke-dashoffset: 0; animation: stepper-checkmark-draw .2s ease-out 50ms both }` (motion-reduce none) |
| `.stepper__separator` | `flex` |
| `__separator--horizontal` | `absolute; top: calc(size/2 - sep/2); inset-inline-start: calc(50% + size/2); inset-inline-end: calc(-50% + size/2)`. It spans from this indicator's edge to the next indicator's edge |
| `__separator--vertical` | `absolute; top: size; bottom: 0; inset-inline-start: calc(size/2 - sep/2)` |
| `.stepper__separator-track` | `relative overflow-hidden bg-separator`; `--horizontal w-full h-(sep)`; `--vertical h-full w-(sep)` |
| `.stepper__separator-fill` | `absolute inset-0 bg-(--stepper-complete-color)` |
| `__separator-fill--horizontal` | `transform: scaleX(var(--stepper-separator-progress, 0)); transform-origin: left (right in RTL); transition: transform .3s` |
| `__separator-fill--vertical` | `scaleY(…)`, `transform-origin: top`, `transition: transform .3s` |
| `.stepper__content` | `flex flex-col`; `--horizontal items-center text-center`; `--vertical items-start text-start min-h-(--stepper-indicator-size)` |
| `.stepper__title` | `leading-tight font-medium text-foreground; transition: color .3s`; inactive step → `text-muted` |
| `__title--sm/md/lg` | `text-[11px]` / `text-xs` / `text-sm` (line-height stays leading-tight) |
| `.stepper__description` | `leading-snug text-muted; transition: color .3s`; inactive step → `opacity .6` |
| `__description--sm` / `--md`,`--lg` | `mt-0.5 text-[10px]` / `mt-0.5 text-xs` |

Keyframes: `stepper-indicator-complete` scale 1 → 1.15 (50%) → 1; `stepper-checkmark-draw` dashoffset 22px → 0.

### Measured metrics (light, Inter)

| | sm | md | lg |
|---|---|---|---|
| indicator | 22×22, 10px/600 | 28×28, 12px/16px/600 | 36×36, 14px/20px/600 |
| title | 11px / 13.75px | 12px / 15px | 14px / 17.5px |
| description | 10px / 13.75px, mt 2px | 12px / 16.5px, mt 2px | 12px / 16.5px, mt 2px |
| horizontal root height (titles only) | 41.75 | 49 | 59.5 |
| vertical step height (title+desc, not last) | 41.5 | 49.5 | 60 |
| default checkmark | 7.91×8.36 | 10.55×11.16 | 14.08×14.91 |

The icon sizing is percentage based. The `.stepper__icon` span is sized by the svg's natural size (its
`width`/`height` attributes), and the svg then takes 55% of that span. As a result a 16px-attribute icon
renders at 8.8px and a 24px-attribute icon at 13.19px (in md, the 24px icon is capped by the 24px content box).
The size does not depend on the stepper size: the lg onboarding demo icons are 8.8px too. The attribute-less
checkmark stretches the span to the indicator content box and takes 44% of it. Stories must pass explicit
`width`/`height` to Iconify icons, which otherwise render at `1em`.

Colours resolve to the OSS theme tokens (`--accent`, `--accent-foreground`, `--border`, `--muted`,
`--separator`, `--foreground`). Dark mode needs no extra rules. Measured dark values: inactive border =
dark `--border`, track = dark `--separator`, title = dark `--foreground`.

---

## 5. Behaviour and timings

- Interactive only when `onStepChange` is given (`<button data-clickable="true">`); otherwise a `<div>` without
  `data-clickable`, no cursor/hover/focus.
- Clicking a step: uncontrolled → internal state changes and `onStepChange(index)` fires; controlled → only the callback.
- Keyboard: native buttons. Tab moves through the steps, Enter and Space activate. There is no arrow-key
  roving: probing ArrowRight did not move focus.
- Focus ring only on `:focus-visible` (2px `--focus` ring + `--ring-offset-width` offset).
- Hover: the indicator of the hovered clickable step drops to opacity .8. Press: the whole step button drops to .8.
- Animations on a status change (`getAnimations()` right after clicking step 4 of 4):
  - `CSSTransition transform` on each changed separator fill: 300ms, `ease`
  - `CSSTransition color` on each changed title: 300ms, `ease`
  - `CSSAnimation stepper-indicator-complete` on each newly complete indicator: 300ms, `ease-out`
  - `CSSAnimation stepper-checkmark-draw` on each new checkmark polyline: 200ms, delay 50ms, `ease-out`, fill `both`
  - Going backwards only runs the fill and title transitions.
  - Complete indicators and checkmarks also animate on mount, because the CSS animation starts when the element appears.
- Controlled demos: Previous/Back is disabled on step 0, Next/Continue is disabled on the last step, labels stay the same, and "Step n of 4" is shown.

---

## 6. Demo list (all reproduced as stories, own content)

| Pro demo | Story | Structure |
|---|---|---|
| default | `Default` | w-500, horizontal md, titles only, `defaultStep=1`, interactive |
| package-tracking | `PackageTracking` | surface card (w-420) with header pill, carrier row (OSS ghost icon Button), vertical md `px-1` stepper with timestamps, active dot icon + coloured title/time, empty inactive indicators, explicit active progress 0.4, two OSS Buttons |
| onboarding-timeline | `OnboardingTimeline` | w-340, heading, vertical lg, display-only, per-step 16px icons, `currentStep=1` |
| with-descriptions | `WithDescriptions` | w-600, horizontal, title + description, interactive |
| with-icons | `WithIcons` | w-600, horizontal, 24px filled icons, interactive |
| bullet-steps | `BulletSteps` | horizontal w-500 + vertical w-280, filled-circle icon in every indicator |
| vertical | `Vertical` | w-320, vertical, descriptions, interactive |
| vertical-with-icons | `VerticalWithIcons` | w-320, vertical, 24px icons, `defaultStep=2` |
| sizes | `Sizes` | sm/md/lg labelled, horizontal w-500, display-only |
| vertical-sizes | `VerticalSizes` | sm/md/lg side by side, vertical with descriptions |
| custom-color | `CustomColor` | Accent / Success / Danger / Warning / Inverted via the CSS variables, `currentStep=2` |
| custom-color-vertical | `CustomColorVertical` | Accent / Success / Danger / Inverted, vertical |
| free-trial-timeline | `FreeTrialTimeline` | vertical lg with `--stepper-active-color: foreground`, 24px icons, `currentStep=0` |
| display-only | `DisplayOnly` | horizontal + vertical without `onStepChange` |
| controlled | `Controlled` | w-600, controlled + Previous / "Step n of 4" / Next |
| controlled-vertical | `ControlledVertical` | w-full row: w-200 vertical + w-400 panel (card + Back/Continue); story uses `layout: "padded"` so it is left-aligned at full width like the demo page |
| custom-completed-icon | `CustomCompletedIcon` | custom icon only on complete steps (horizontal + vertical) |
| render-function | `RenderFunction` | vertical w-280, icon chosen from status via render-function children |
| dynamic-icon | `DynamicIcon` | horizontal w-500, 3 steps, filled vs outline icon via `useStepperStep` |

Verification: every story was compared with its Pro demo node by node (same DOM paths, classes, statuses,
rects within 0.6px apart from text-width-dependent x/width, and computed styles within a ±3 colour tolerance)
in light mode, and in dark mode for default, package-tracking, custom-color and free-trial-timeline. The only
remaining differences are the different texts and icons. Click, keyboard, hover/press and animation probes
give identical results.

---

## 7. Implementation notes (remake)

- `StepperRoot` flattens its children (arrays and fragments) and wraps each one in an index provider.
  Steps must therefore be direct children (or inside fragments/arrays), as in Pro, where the SSR output
  already carries correct `data-index` values.
- `StepperStep` resolves its children (a render function receiving `{index, status, isLast}` is also accepted),
  puts `Stepper.Separator` elements after the step button and everything else inside it.
- `StepperIndicator` accepts a render function as well. When the result is `undefined` it shows the default content.
- `useStepperStep` throws outside a `Stepper.Step`. The internal parts fall back to an inactive first step.
- Contexts exported: `StepperContext`, `StepperStepContext`.

## 8. Dependencies

None beyond React and tailwind-variants. Root export is fine (`rootExport = true`). No OSS component is used
inside the component (the stories use the OSS `Button`).

## 9. Deviations

- Added `motion-reduce:transition-none` to the separator fill and the title/description colour transitions
  (Pro only disables the step button transition and the two keyframe animations).
- Focus selector uses the HeroUI pattern `:focus-visible:not([data-focused]), [data-focus-visible="true"]`
  with `status-focused` (same visual ring as Pro's `:focus-visible` rule).
- RTL fill origin uses `:dir(rtl)`. Pro's compiled CSS uses an equivalent `:lang(...)` list.
- Render-function children on `Stepper.Step` / `Stepper.Indicator` are a superset of the documented
  `ReactNode` API. They are needed for the Render Function demo.

---

## Appendix A - raw CSSOM (reference only, `@layer components`)

```
.stepper {--stepper-indicator-size:28px;--stepper-separator-size:2px;--stepper-vertical-gap:16px;--stepper-active-color:var(--color-accent);--stepper-complete-color:var(--color-accent);--stepper-complete-fg:var(--color-accent-foreground);--stepper-inactive-border:var(--color-border);--stepper-inactive-fg:var(--color-muted);margin:0;padding:0;list-style-type:none}
.stepper--horizontal {align-items:flex-start;display:flex}
.stepper--vertical {flex-direction:column;display:flex}
.stepper__step {position:relative}
.stepper__step--horizontal {flex-direction:column;flex:1;align-items:center;display:flex;position:relative;overflow:visible}
.stepper__step--vertical {padding-bottom:var(--stepper-vertical-gap);flex-direction:column;display:flex;position:relative}
.stepper__step--vertical:last-child {padding-bottom:0}
.stepper__step-button {transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,…;--tw-duration:.1s;-webkit-tap-highlight-color:transparent;border-radius:calc(var(--radius) * 1);transform:translateZ(0);background-color:#0000;border-width:0;outline-style:none;align-items:center;padding:0;transition-duration:.1s;display:flex}
  + motion-reduce: transition-property:none
.stepper__step-button[data-clickable=true] {cursor:var(--cursor-interactive)}
@media (hover:hover) :is(.stepper__step-button[data-clickable=true]:hover,.stepper__step-button[data-clickable=true][data-hovered=true]) .stepper__indicator {opacity:.8}
.stepper__step-button[data-clickable=true]:active,.stepper__step-button[data-clickable=true][data-pressed=true] {opacity:.8}
.stepper__step-button[data-clickable=true]:focus-visible {ring 2px var(--focus), offset var(--ring-offset-width) var(--background); outline-style:none}
.stepper__step-button--horizontal {z-index:10;align-items:center;gap:calc(var(--spacing) * 1.5);flex-direction:column;position:relative}
.stepper__step-button--vertical {z-index:10;align-items:flex-start;gap:calc(var(--spacing) * 2.5);flex-direction:row;position:relative}
.stepper__indicator {width/height:var(--stepper-indicator-size);border:2px solid;border-radius:2147483647px;flex-shrink:0;justify-content:center;align-items:center;display:flex}
.stepper__indicator[data-status=inactive] {border-color:var(--stepper-inactive-border);color:var(--stepper-inactive-fg);background-color:#0000}
.stepper__indicator[data-status=active] {border-color:var(--stepper-active-color);color:var(--stepper-active-color);background-color:#0000}
.stepper__indicator[data-status=complete] {background-color:var(--stepper-complete-color);border-color:var(--stepper-complete-color);color:var(--stepper-complete-fg);box-shadow:shadow-sm;animation:.3s ease-out stepper-indicator-complete}
  + motion-reduce: animation:none
@keyframes stepper-indicator-complete {0%{transform:scale(1)}50%{transform:scale(1.15)}to{transform:scale(1)}}
.stepper__indicator--sm {font-size:10px;font-weight:var(--font-weight-semibold)}
.stepper__indicator--md {font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height));font-weight:var(--font-weight-semibold)}
.stepper__indicator--lg {font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height));font-weight:var(--font-weight-semibold)}
.stepper__separator {display:flex}
.stepper__separator--horizontal {top:calc(var(--stepper-indicator-size) / 2 - var(--stepper-separator-size) / 2);position:absolute;inset-inline-start:calc(50% + var(--stepper-indicator-size) / 2);inset-inline-end:calc(-50% + var(--stepper-indicator-size) / 2)}
.stepper__separator--vertical {top:var(--stepper-indicator-size);bottom:0;position:absolute;inset-inline-start:calc(var(--stepper-indicator-size) / 2 - var(--stepper-separator-size) / 2)}
.stepper__separator-track {background-color:var(--separator);position:relative;overflow:hidden}
.stepper__separator-track--horizontal {width:100%;height:var(--stepper-separator-size)}
.stepper__separator-track--vertical {height:100%;width:var(--stepper-separator-size)}
.stepper__separator-fill {background-color:var(--stepper-complete-color);position:absolute;inset:0}
.stepper__separator-fill--horizontal {transform:scaleX(var(--stepper-separator-progress,0));transform-origin:0;transition:transform .3s}
.stepper__separator-fill--horizontal:is(:lang(<rtl languages>)) {transform-origin:100%}
.stepper__separator-fill--vertical {transform:scaleY(var(--stepper-separator-progress,0));transform-origin:top;transition:transform .3s}
.stepper__content {flex-direction:column;display:flex}
.stepper__content--horizontal {text-align:center;align-items:center}
.stepper__content--vertical {text-align:start;min-height:var(--stepper-indicator-size);align-items:flex-start}
.stepper__title {line-height:var(--leading-tight);font-weight:var(--font-weight-medium);color:var(--foreground);transition:color .3s}
.stepper__step[data-status=inactive] .stepper__title {color:var(--muted)}
.stepper__title--sm {font-size:11px}
.stepper__title--md {font-size:var(--text-xs);line-height:var(--tw-leading,…)}
.stepper__title--lg {font-size:var(--text-sm);line-height:var(--tw-leading,…)}
.stepper__description {line-height:var(--leading-snug);color:var(--muted);transition:color .3s}
.stepper__step[data-status=inactive] .stepper__description {opacity:.6}
.stepper__description--sm {margin-top:calc(var(--spacing) * .5);font-size:10px}
.stepper__description--md,.stepper__description--lg {margin-top:calc(var(--spacing) * .5);font-size:var(--text-xs);line-height:var(--tw-leading,…)}
.stepper__icon {justify-content:center;align-items:center;display:flex}
.stepper__icon svg {width:55%;height:55%}
.stepper__icon [data-slot=stepper-default-checkmark] {width:44%;height:44%}
[data-slot=stepper-default-checkmark] {transform:translateZ(0)}
[data-slot=stepper-default-checkmark] polyline {stroke-dasharray:22;stroke-dashoffset:0;animation:.2s ease-out 50ms both stepper-checkmark-draw}
  + motion-reduce: animation:none
@keyframes stepper-checkmark-draw {0%{stroke-dashoffset:22px}to{stroke-dashoffset:0}}
.stepper--sm {--stepper-indicator-size:22px;--stepper-vertical-gap:12px}
.stepper--md {--stepper-indicator-size:28px;--stepper-vertical-gap:16px}
.stepper--lg {--stepper-indicator-size:36px;--stepper-vertical-gap:24px}
```
