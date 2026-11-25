# Chain Of Thought (`chain-of-thought`) - implementation spec

Source of truth: public docs page https://heroui.pro/docs/react/components/chain-of-thought, the rendered DOM, computed
styles, CSSOM (public stylesheet rules) and runtime behaviour of the two public demo pages, observed on 2026-11-25 in
light and dark. No paywalled source, JS chunk, source map, prompt or MCP endpoint was read.

## 1. Purpose

An ordered list of agent steps (file reads, tool calls, edits) with status marks, normally rendered inside
`Reasoning.Content`. Each step shows a mark in a narrow lane (with a connector line to the next step), a title and an
optional description. The run status of the list (taken from the enclosing Reasoning) turns the active step into an
"interrupted" step and hides pending steps once the run stopped or failed.

## 2. Anatomy

```tsx
<Reasoning>
  <Reasoning.Trigger />
  <Reasoning.Content>
    <ChainOfThought>
      <ChainOfThought.Step status="complete">
        <ChainOfThought.StepTitle>Searched the web</ChainOfThought.StepTitle>
        <ChainOfThought.StepDescription>Found 4 sources</ChainOfThought.StepDescription>
      </ChainOfThought.Step>
    </ChainOfThought>
  </Reasoning.Content>
</Reasoning>
```

Observed DOM of one step (attribute order as rendered):

```html
<ol class="chain-of-thought" data-slot="chain-of-thought" data-status="streaming" role="list">
  <li aria-current="step" class="chain-of-thought__step" data-slot="chain-of-thought-step" data-status="active">
    <span aria-hidden="true" class="chain-of-thought__step-indicator" data-slot="chain-of-thought-step-indicator" data-status="active">
      <span class="chain-of-thought__step-mark" data-slot="chain-of-thought-step-mark">
        <span class="chain-of-thought__step-glyph chain-of-thought__step-glyph--none"></span>
        <span class="chain-of-thought__step-glyph chain-of-thought__step-glyph--complete">
          <svg aria-hidden="true" class="chain-of-thought__step-check" data-slot="chain-of-thought-check" fill="none" viewBox="0 0 10 10">(check stroke)</svg>
        </span>
        <span class="chain-of-thought__step-glyph chain-of-thought__step-glyph--active">
          <span class="loader loader--accent loader--sm" data-size="sm" data-slot="loader" data-variant="ring" role="status" aria-hidden="true">...</span>
        </span>
        <span class="chain-of-thought__step-glyph chain-of-thought__step-glyph--error">
          <svg aria-hidden="true" class="chain-of-thought__step-cross" data-slot="chain-of-thought-cross" fill="none" viewBox="0 0 10 10">(x stroke)</svg>
        </span>
        <span class="chain-of-thought__step-glyph chain-of-thought__step-glyph--interrupted"></span>
        <svg aria-hidden="true" class="chain-of-thought__step-glyph chain-of-thought__step-glyph--pending" data-slot="chain-of-thought-pending" fill="none" viewBox="0 0 18 18">
          <circle cx="9" cy="9" pathLength="20" r="6.25" stroke="currentColor"></circle>
        </svg>
      </span>
    </span>
    <div class="chain-of-thought__step-body" data-slot="chain-of-thought-step-body">
      <span class="chain-of-thought__step-status" data-slot="chain-of-thought-step-status">In progress</span>
      <div class="chain-of-thought__step-title" data-slot="chain-of-thought-step-title">Reading components/ui/input.tsx</div>
      <div class="chain-of-thought__step-description" data-slot="chain-of-thought-step-description">...</div>
    </div>
  </li>
</ol>
```

| Part | Element | `data-slot` | Class | Notes |
| --- | --- | --- | --- | --- |
| Root | `ol[role=list]` | `chain-of-thought` | `.chain-of-thought` | `data-status` = run status (always set, `complete` by default) |
| Step | `li` | `chain-of-thought-step` | `__step` | `data-status` = display status (absent without status); `aria-current="step"` while active |
| Indicator | `span[aria-hidden]` | `chain-of-thought-step-indicator` | `__step-indicator` | lane: mark + `::after` connector line; same `data-status` |
| Mark | `span` | `chain-of-thought-step-mark` | `__step-mark` (internal) | grid, all glyphs stacked and crossfaded |
| Glyphs | `span` / `svg` | - (svg children carry `chain-of-thought-check|cross|pending`) | `__step-glyph` + `--none|--complete|--active|--error|--interrupted|--pending` (internal) | every glyph always rendered; only the one matching the status has opacity 1 |
| Body | `div` | `chain-of-thought-step-body` | `__step-body` | column with the hidden status text and the children in order |
| Status text | `span` | `chain-of-thought-step-status` | `__step-status` | visually hidden; only when the step has a display status |
| Title | `div` | `chain-of-thought-step-title` | `__step-title` | |
| Description | `div` | `chain-of-thought-step-description` | `__step-description` | |

- The active glyph only contains the `Loader` (ring, accent, sm, `aria-hidden`) while the step is active; after the step
  leaves `active` the Loader stays mounted until the 150 ms opacity crossfade has finished (observed 170-190 ms between
  the `data-status` change and the Loader removal), then it is unmounted.
- A node `indicator` replaces the content of `--complete` (keeps the disc); the default demo uses a 16x16 file icon,
  rendered at 12x12 (`--complete > *`).
- With a stopped / error run, pending steps are not rendered at all (removed from the DOM), active steps render as
  `interrupted`. An `ol` without steps is hidden by `:empty`.

## 3. API

### `ChainOfThought` (root, `ol`, native `ol` props)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `"streaming" \| "complete" \| "stopped" \| "error"` | enclosing Reasoning status, else `"complete"` | Run status |
| `statusLabel` | `(renderProps: {status: ChainOfThoughtStepDisplayStatus; defaultLabel: string}) => ReactNode` | - | Hidden status text read before each step; an empty result keeps the built-in text |

### `ChainOfThought.Step` (`li`, native `li` props)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `"complete" \| "active" \| "pending" \| "error"` | - | Without it: neutral dot, no hidden status text, no `data-status` |
| `indicator` | `ReactNode \| ((renderProps: {status?: ChainOfThoughtStepDisplayStatus}) => ReactNode)` | - | Node: replaces the complete check (keeps the disc). Function: draws the whole mark for every status (receives `interrupted`) |

### `ChainOfThought.StepTitle`, `ChainOfThought.StepDescription` (`div`, native `div` props)

### Types
`ChainOfThoughtStepDisplayStatus = "complete" | "active" | "pending" | "error" | "interrupted"`,
`ChainOfThoughtStepStatusLabelRenderProps`, `ChainOfThoughtStepIndicatorRenderProps`, `ChainOfThoughtStepStatus`,
`ChainOfThoughtStatus` (run status).

### Localization (hidden status text)
`complete` "Completed", `active` "In progress", `pending` "Not started", `error` "Failed", `interrupted` "Didn't finish".

### Deprecated API (beta)
| API | Use instead |
| --- | --- |
| `isStreaming` | `status="streaming"` on Reasoning |
| `defaultExpanded`, `isDisabled`, `isExpanded`, `onExpandedChange` (+ `id`, function `className`) | the same props on Reasoning |
| `ChainOfThought.Trigger`, `ChainOfThought.Content` | `Reasoning.Trigger`, `Reasoning.Content` |
| `ChainOfThought.Steps` | `ChainOfThought` itself |
| `ChainOfThought.Step label` | a `ChainOfThought.StepTitle` child |

A deprecated prop or a direct `Trigger` / `Content` / `Steps` child renders the Pro `Reasoning` in place of the list
(`Trigger` = `Reasoning.Trigger`, `Content` = `Reasoning.Content`, `Steps` = the list). The other beta Disclosure props
(`defaultExpanded`, `isExpanded`, `onExpandedChange`, `isDisabled`, `id`, `style`, `slot`, function `className`) go to that
Reasoning; `isStreaming` becomes `status="streaming"`. Root `status` / `statusLabel` reach the lists inside unless a list
sets its own.

### Run status resolution
`status` prop of the list > `ChainOfThoughtContext.status` (deprecated root, or an app provider) > enclosing
`ReasoningContext.status` (`"complete"` outside a Reasoning). The list passes the resolved status and `statusLabel` to its
own steps through an internal context, so a list nested inside step content resolves its own status.

## 4. Styling (observed CSSOM, `@layer components`, identical rules in light and dark)

### CSS variables (on `.chain-of-thought`)
| Variable | Default |
| --- | --- |
| `--chain-of-thought-mark-size` | `calc(var(--spacing) * 5)` (20px) |
| `--chain-of-thought-active-ring-inset` | `var(--spacing)` (4px) |
| `--chain-of-thought-line` | muted at 26% (`color-mix(in oklab, var(--color-muted) 26%, transparent)`) |
| `--chain-of-thought-line-pending` | muted at 45% |
| `--chain-of-thought-duration` | `150ms` |
| `--chain-of-thought-ease` | `var(--ease-out-quint)` = `cubic-bezier(.23, 1, .32, 1)` |

### Layout
- Root: `display:flex; flex-direction:column; width:100%; margin:0; padding:0; list-style:none; text-sm` (14/20);
  `:empty { display:none }`. Colour is inherited (muted from `.reasoning__body`).
- Step: `flex; gap: 12px`.
- Indicator: `flex column; align-items:center; flex-shrink:0; width: mark-size`. `::after`: `content:""; flex-grow:1;
  width:0; border-inline-start: 1px solid var(--chain-of-thought-line); transition: border-color duration ease`.
  Active / pending: `dashed` + `--chain-of-thought-line-pending`. Last step: `::after { display:none }`.
- Body: `flex column; flex:1; min-width:0; gap: 4px; padding-bottom: 16px` (last step 0).
  `> :not(status) + :not(title, description) { margin-block-start: 4px }` (extra content such as a source list).
- Status: visually hidden (sr-only).
- Title: `text-sm`, `font-weight: normal`, `overflow-wrap: break-word`, colour `foreground / 86%`, `transition: color`.
  Active + error: `foreground`; active: `font-weight: medium`; pending: `muted / 80%`; interrupted: `muted`.
- Description: `text-xs` (12/16), `overflow-wrap: break-word`, `muted`.

### Mark and glyphs
- Mark: `display:grid; place-items:center; size = mark-size; flex-shrink:0`.
- Glyph: `grid-area: 1/1; opacity:0; transition: opacity duration ease`; the glyph matching the indicator status (or
  `--none` without status) gets `opacity:1`.
- `--none`: 6x6 dot, `rounded-full`, `bg muted`.
- `--complete | --error | --interrupted`: 18x18 disc, `rounded-full`, `bg foreground / 7%`, grid centred.
- `--complete`: `color: muted`; `> *` 12x12; default check `> .chain-of-thought__step-check` 10x10.
- check + cross: 10x10, `stroke-width:1.5; stroke-linecap/linejoin: round`.
- `--active`: mark-size disc, `rounded-full`, `bg accent-soft`; `> .loader { --loader-size: mark-size - 2 * ring-inset }`
  (12px ring).
- `--error`: `color: danger`.
- `--interrupted`: `bg muted / 12%`; `::before` 6x6 square, `border-radius: calc(var(--radius) * .25)`, `bg muted`.
- `--pending`: 18x18 svg, `color: muted`, `stroke-width:1.25; stroke-dasharray:1` (circle `r=6.25`,
  `pathLength=20` -> 10 dashes).
- No keyframes of its own; the ring is the Pro `Loader` (ring spins 800 ms linear), which follows reduced motion.
  There are no `prefers-reduced-motion` rules for the crossfades in Pro.

### Live measurements (status demo, Chromium, 384px wide list)
| Item | Value |
| --- | --- |
| Step without description | 36px tall (20 title + 16 padding), last step 20px |
| Step with description | 56px (20 + 4 gap + 16 + 16) |
| Mark | 20x20 at the step's top-left; complete / error disc 18x18 at +1/+1; active disc 20x20 |
| Body x | 32px from the step start (20 lane + 12 gap) |
| Line | 1px, solid `oklab(0.5517 ... / 0.26)` light, `oklab(0.705 ... / 0.26)` dark; dashed /0.45 below active & pending |
| Title colours (light) | complete `oklab(0.2103 .. / 0.86)`, error/active `lab(8.34 ...)` (foreground), pending `oklab(0.5517 .. / 0.8)`, interrupted `lab(47.87 ...)` (muted) |
| Active disc | light `accent / 15%`, dark `accent / 12%` (token `--accent-soft`) |
| Complete disc | `foreground / 7%` in both themes |
| Error glyph colour | `--danger` |

## 5. Behaviour

- Display status: `status` of the step, except when the run status is `stopped` or `error`: `active -> interrupted`,
  `pending -> not rendered`. `complete` / `streaming` runs keep the step statuses.
- Hidden status text: built-in label (section 3) or `statusLabel({status, defaultLabel})` if that returns a non-empty
  node.
- `aria-current="step"` on the active step only. No live region, no `aria-busy` (Reasoning sets it on its body).
- Crossfades: glyph opacity, line colour and title colour transition for 150 ms with `ease-out-quint`.
- Loader presence: mounted immediately when a step becomes active; unmounted after the opacity transition ends.
- No keyboard interaction (nothing focusable).

### Default demo timeline (simulated agent run, gap-3 column of four Reasonings)
- 0 ms: block 1 streaming "Thinking" (grid loader + shimmer); reasoning text streams in from 1.2 s to 3.3 s (~90 ms
  chunks).
- 4.1 s: block 1 -> "Thought for 2s"; block 2 streaming "Exploring files", step 1 active "Reading app/layout.tsx".
- every ~0.9 s: the active step completes (title "Reading x" -> "Read x", optional description) and the next active step
  is appended.
- 6.9 s: block 2 -> "Explored 3 files"; block 3 "Editing files" (2 steps); 8.7 s: block 3 -> "Edited 2 files"; block 4
  "Running checks" (2 steps); 10.5 s: everything complete. All steps use a file icon as `indicator`.

## 6. Demo variants

| Demo | URL | Content | Story |
| --- | --- | --- | --- |
| default | `/docs/react/demos/chain-of-thought-default` | simulated agent run (section 5) | `Default` |
| status | `/docs/react/demos/chain-of-thought-status` | `flex flex-col gap-6`: streaming Reasoning with complete / error (+description) / active / pending steps, then a stopped Reasoning ("Stopped after 5s") with the same steps -> complete / error / interrupted (pending hidden) | `Status` |

Both demos use the real Pro `Reasoning` (default: `defaultExpanded`, `collapseDelay={Infinity}`, thinking block with
`Reasoning.Text` + duration, tool blocks with `Reasoning.Loader` + a function `Reasoning.Label` that shimmers the running
label, e.g. "Exploring files" -> "Explored 3 files"; every step uses a 16px file icon as `indicator`).

Docs-only code snippets (no live demo): History (saved trace, all complete), Custom Label, Custom Step Indicator
(node and function), Localization (`statusLabel`). Extra stories: `History`, `CustomLabel` (function `Reasoning.Label`,
Reasoning status from the `status` control), `CustomIndicator`, `Localized`, `WithoutStatus`, `Playground` (no
Reasoning, run status from the `status` control), `DeprecatedBeta`.

Verification (Storybook vs Pro, Chromium): every step / indicator / mark / glyph / body / title rect of the Status
story equals the Pro demo (y offsets 64/100/156/192 and 276/312/368, 20px lane, 12px gap, 16px step padding), all
light and dark colours equal (tokens serialised as oklch instead of lab), the Default story ends with the same four
block rects (100 / 152 / 136 / 136 px tall, 12px gaps) and the Loader unmounts after the glyph crossfade.

Review pass (headless Edge, 900px viewport): with the real Reasoning, every element of the Status story (Reasoning
heading / trigger / loader / content / body and all list parts) has the same rects, font metrics, transitions and
resolved sRGB colours as the Pro demo in light and dark; the outerHTML of the lists matches except for texts; the check /
cross path geometry is identical (sampled points); the Default story follows the Pro timeline (Loader kept ~160 ms after
a step completes in both, finished blocks stay open). Theme check: `--radius: 1rem` turns the interrupted square radius
from 2px into 4px, and `--accent`, `--danger` and `--font-sans` reach the active disc / ring, the error cross and the text.

## 7. Dependencies

- Pro `Loader` (`../loader`): active ring (`variant="ring" color="accent" size="sm" aria-hidden`).
- Pro `Reasoning` (`../reasoning`): `ReasoningContext` (run status inheritance) and `ReasoningRoot` / `ReasoningTrigger` /
  `ReasoningContent` (deprecated beta API). Reasoning does not import ChainOfThought, so there is no import cycle.
- Pro `TextShimmer`: stories only (running labels).

## 8. Deviations / notes

- `ChainOfThoughtContext` (`{status, statusLabel}`) is exported as an extra provider; Pro documents no such export. The
  deprecated root uses it to pass `statusLabel` down.
- Pro's docs import `ChainOfThoughtStepStatus` and `ReasoningStatus`; the run-status union is also exported here as
  `ChainOfThoughtStatus` (same values as `ReasoningStatus`).
- The default beta trigger label is whatever `Reasoning.Trigger` renders ("Thinking" shimmer while streaming, "Thought
  for a few seconds" / "Thought for <duration>" after); the beta defaults themselves could not be observed.
- Crossfade transitions additionally get `motion-reduce:transition-none` (HeroUI convention); Pro only relies on the
  Loader for reduced motion.
- The Loader is unmounted after the glyph's opacity transition (`getAnimations().finished`), so a throttled /
  hidden tab may keep it a little longer, like Pro.

## Appendix: raw CSSOM (reference only, not used as implementation)

```
.chain-of-thought { --chain-of-thought-ease: var(--ease-out-quint); --chain-of-thought-duration: .15s; --chain-of-thought-mark-size: calc(var(--spacing) * 5); --chain-of-thought-active-ring-inset: var(--spacing); --chain-of-thought-line: color-mix(in oklab, var(--color-muted) 26%, transparent); --chain-of-thought-line-pending: color-mix(in oklab, var(--color-muted) 45%, transparent); width: 100%; font-size: var(--text-sm); line-height: var(--text-sm--line-height); flex-direction: column; margin: 0; padding: 0; list-style-type: none; display: flex }
.chain-of-thought:empty { display: none }
.chain-of-thought__step { gap: calc(var(--spacing) * 3); display: flex }
.chain-of-thought__step-indicator { width: var(--chain-of-thought-mark-size); flex-direction: column; flex-shrink: 0; align-items: center; display: flex }
.chain-of-thought__step-indicator::after { content: ""; border-inline-start: 1px solid var(--chain-of-thought-line); width: 0; transition: border-color var(--chain-of-thought-duration) var(--chain-of-thought-ease); flex-grow: 1 }
.chain-of-thought__step-indicator:is([data-status=active],[data-status=pending])::after { border-inline-start-style: dashed; border-inline-start-color: var(--chain-of-thought-line-pending) }
.chain-of-thought__step:last-child > .chain-of-thought__step-indicator::after { display: none }
.chain-of-thought__step-body { gap: var(--spacing); min-width: 0; padding-bottom: calc(var(--spacing) * 4); flex-direction: column; flex: 1 1 0%; display: flex }
.chain-of-thought__step-body > :not(.chain-of-thought__step-status) + :not(.chain-of-thought__step-title, .chain-of-thought__step-description) { margin-block-start: var(--spacing) }
.chain-of-thought__step:last-child > .chain-of-thought__step-body { padding-bottom: 0 }
.chain-of-thought__step-status { sr-only }
.chain-of-thought__step-title { text-sm; font-weight: normal; overflow-wrap: break-word; color: color-mix(in oklab, var(--foreground) 86%, transparent); transition: color var(--chain-of-thought-duration) var(--chain-of-thought-ease) }
.chain-of-thought__step:is([data-status=active],[data-status=error]) > .chain-of-thought__step-body > .chain-of-thought__step-title { color: var(--foreground) }
.chain-of-thought__step[data-status=active] > ... > .chain-of-thought__step-title { font-weight: medium }
.chain-of-thought__step[data-status=pending] > ... > .chain-of-thought__step-title { color: color-mix(in oklab, var(--muted) 80%, transparent) }
.chain-of-thought__step[data-status=interrupted] > ... > .chain-of-thought__step-title { color: var(--muted) }
.chain-of-thought__step-description { text-xs; overflow-wrap: break-word; color: var(--muted) }
.chain-of-thought__step-mark { width/height: mark-size; flex-shrink: 0; place-items: center; display: grid }
.chain-of-thought__step-glyph { opacity: 0; transition: opacity var(--chain-of-thought-duration) var(--chain-of-thought-ease); grid-area: 1 / 1 }
(indicator:not([data-status]) --none | [complete] --complete | [active] --active | [error] --error | [interrupted] --interrupted | [pending] --pending) { opacity: 1 }
.chain-of-thought__step-glyph--none { size 1.5; bg muted; rounded-full }
:is(--complete, --error, --interrupted) { size 4.5; bg foreground/7%; rounded-full; grid; place-items center }
--complete { color: muted }  --complete > * { size 3 }
--complete > .chain-of-thought__step-check, .chain-of-thought__step-cross { size 2.5; stroke-width 1.5px; stroke-linecap/linejoin round }
--active { bg accent-soft; size mark-size; rounded-full; grid; place-items center }
--active > .loader { --loader-size: calc(var(--chain-of-thought-mark-size) - var(--chain-of-thought-active-ring-inset) * 2) }
--error { color: danger }
--interrupted { bg muted/12% }  --interrupted::before { size 1.5; border-radius calc(var(--radius) * .25); bg muted; content "" }
--pending { size 4.5; color muted; stroke-width 1.25px; stroke-dasharray 1 }
```
