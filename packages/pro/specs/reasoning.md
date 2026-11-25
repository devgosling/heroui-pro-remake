# Reasoning (`reasoning`) - implementation spec

Slug: `reasoning` - Docs: https://heroui.pro/docs/react/components/reasoning - Category: AI
Storybook title: `Pro/AI/Reasoning`
Import (Pro): `import {Reasoning} from "@heroui-pro/react";` (root export)
Import (remake): `import {Reasoning} from "@heroui/pro";` or `@heroui/pro/reasoning`

Sources: public docs page text, the rendered DOM / computed styles / CSSOM of the four public demo
pages (light + dark), MutationObserver / transition-event timelines and pointer / keyboard /
reduced-motion runs on those pages (headless Edge via Playwright, because the shared browser pane
was at its tab cap), observed on 2026-11-25. No paywalled source, JS chunk, source map, inline
flight data, prompt or MCP endpoint was read.

---

## 1. Purpose

A collapsible block that shows the model's thinking. While `status="streaming"` the trigger shows a
Loader and a shimmering "Thinking" label; the trace opens on the first streamed text and collapses
`collapseDelay` ms after the run completes, when the label swaps to "Thought for 3s". Stopped and
failed runs keep the trace as it was. Built entirely on the OSS HeroUI **Disclosure**.

---

## 2. Anatomy

```tsx
<Reasoning>
  <Reasoning.Trigger>
    <Reasoning.Loader /> {/* optional */}
    <Reasoning.Label />
    <Reasoning.Indicator />
  </Reasoning.Trigger>
  <Reasoning.Content>
    <Reasoning.Text>{text}</Reasoning.Text>
  </Reasoning.Content>
</Reasoning>
```

Observed DOM (default demo while streaming, grid loader, expanded):

```html
<div data-slot="reasoning" data-status="streaming" data-streaming="true" class="disclosure reasoning"
     data-rac="" data-expanded="true">
  <h3 data-slot="reasoning-heading" class="disclosure__heading reasoning__heading">
    <button id="…" data-slot="reasoning-trigger" class="disclosure__trigger reasoning__trigger" data-rac=""
            type="button" aria-expanded="true" aria-controls="…" slot="trigger">
      <span class="loader loader--accent loader--sm reasoning__loader" data-size="sm"
            data-slot="reasoning-loader" data-variant="grid" role="status" aria-hidden="true">
        <svg class="loader__indicator loader__indicator--grid" …/>
        <span class="loader__fallback" data-slot="loader-fallback">Loading</span>
      </span>
      <span class="reasoning__label" data-slot="reasoning-label" data-status="streaming" data-streaming="true">
        <span class="text-shimmer" data-slot="text-shimmer">…Thinking…</span>
      </span>
      <svg class="disclosure__indicator reasoning__indicator" data-slot="reasoning-indicator" data-expanded="true" …/>
    </button>
  </h3>
  <div data-slot="reasoning-content" class="disclosure__content reasoning__content" role="group"
       aria-labelledby="…" aria-hidden="false" style="--disclosure-panel-height:auto" data-expanded="true">
    <div class="disclosure__body" data-slot="disclosure-body">
      <div class="disclosure__body-inner">
        <div aria-busy="true" class="reasoning__body" data-slot="reasoning-body">
          <div class="reasoning__text" data-slot="reasoning-text">…</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Complete / stopped label: `<span class="reasoning__label" … data-status="complete" data-swapped="true">Thought for
<span class="reasoning__duration" data-slot="reasoning-duration">3s</span></span>`. Collapsed panel carries
`hidden="until-found"` (RAC DisclosurePanel).

| Part | Element / base | `data-slot` | Classes |
|---|---|---|---|
| Root | OSS `Disclosure` (RAC Disclosure div) | `reasoning` | `disclosure reasoning` |
| Heading | OSS `Disclosure.Heading` (`h3` by default) | `reasoning-heading` | `disclosure__heading reasoning__heading` |
| Trigger | OSS `Disclosure.Trigger` (RAC Button) | `reasoning-trigger` | `disclosure__trigger reasoning__trigger` |
| Loader | Pro `Loader` (`color=accent`, `size=sm`, `variant=grid`, `aria-hidden`) | `reasoning-loader` | `loader loader--accent loader--sm reasoning__loader` |
| Label | `span` | `reasoning-label` | `reasoning__label` |
| Duration | `span` | `reasoning-duration` | `reasoning__duration` |
| Indicator | OSS `Disclosure.Indicator` (chevron svg) | `reasoning-indicator` | `disclosure__indicator reasoning__indicator` |
| Content | OSS `Disclosure.Content` (RAC DisclosurePanel) | `reasoning-content` | `disclosure__content reasoning__content` |
| (body) | OSS `Disclosure.Body` (unchanged slot) | `disclosure-body` | `disclosure__body` > `disclosure__body-inner` |
| Body | `div`, `aria-busy="true"` while streaming | `reasoning-body` | `reasoning__body` |
| Text | `div` | `reasoning-text` | `reasoning__text` |

Data attributes: `data-status="streaming|complete|stopped|error"` and `data-streaming="true"` on root and label;
`data-exiting="true"` on the loader while it fades out; `data-swapped="true"` on every label mounted after the
first status (drives the `@starting-style` fade). RAC adds `data-expanded`, `data-hovered`, `data-pressed`,
`data-focused`, `data-focus-visible`.

---

## 3. API (docs)

### `Reasoning` - extends HeroUI Disclosure props ("fills its container and has no background")

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `"streaming" \| "complete" \| "stopped" \| "error"` | `"complete"` | Run status |
| `duration` | `string` | - | Formatted thinking time ("9s"), shown once complete or stopped |
| `autoExpand` | `boolean` | `true` | Opens the trace when the first content streams in |
| `collapseDelay` | `number` | `1000` | ms before the automatic collapse; `Infinity` never collapses |
| `defaultExpanded` | `boolean` | `false` | Uncontrolled initial state |
| `isExpanded` | `boolean` | - | Controlled state |
| `onExpandedChange` | `(isExpanded: boolean) => void` | - | Also called for the automatic open / collapse |
| `children` | `ReactNode` | - | `Reasoning.Trigger` and `Reasoning.Content` |

### `Reasoning.Trigger` - extends `Disclosure.Trigger`; renders Loader + Label + Indicator by default, children replace them
| `headingLevel` | `number` | `3` | Level of the heading around the trigger |

### `Reasoning.Loader` - extends Loader props; shown while streaming, then fades out
| `variant` | 14 Loader variants | `"grid"` |  |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | 16 / 20 / 24 px |
| `children` | `ReactNode` | - | `Loader.Indicator` or a custom indicator (e.g. a Spinner) |

### `Reasoning.Label` - native span props
`children?: ReactNode | ((p: ReasoningLabelRenderProps) => ReactNode)`; `ReasoningLabelRenderProps = {status, isStreaming, duration, defaultChildren}`.

### `Reasoning.Duration` - native span props; renders `duration`, or nothing when empty; children replace the text.
### `Reasoning.Indicator` - extends `Disclosure.Indicator`.
### `Reasoning.Content` - extends `Disclosure.Content`; collapsed panel uses `hidden="until-found"`; cap with `max-h-96 overflow-y-auto`.
### `Reasoning.Text` - native div props; keeps line breaks; renders nothing while empty; works outside a Reasoning.

### Default texts (Localization)
| Status | Text |
|---|---|
| streaming | `<TextShimmer>Thinking</TextShimmer>` |
| complete + duration | `Thought for <Reasoning.Duration/>` |
| complete, no duration | `Thought for a few seconds` |
| stopped + duration | `Stopped after <Reasoning.Duration/>` |
| stopped, no duration | `Stopped thinking` |
| error | `Couldn't finish thinking` (straight apostrophe in the DOM) |

### CSS variables
| Variable | Default | Use |
|---|---|---|
| `--reasoning-duration` | `150ms` | loader exit, label fade, trigger colours |
| `--reasoning-ease` | `var(--ease-out-quint)` | easing for those |
| `--reasoning-trigger-inset` | `calc(var(--spacing) * 2)` | trigger padding, pulled back with a negative start margin |
| `--reasoning-trigger-gap` | `calc(var(--spacing) * 2)` | gap between loader, label, chevron |

Accessibility: body `aria-busy` while streaming; no live region (the chat log announces the answer).

---

## 4. Styling (all rules in `@layer components`; identical light / dark, colours from tokens)

| Selector | Declarations (Tailwind equivalent) |
|---|---|
| `.reasoning` | CSS vars above; `flex w-full flex-col text-sm` |
| `.reasoning__heading` | `flex min-w-0` |
| `.reasoning__trigger` | `inline-flex min-h-8 min-w-0 items-center text-sm font-medium text-muted`; gap var; `padding-inline: inset`; `margin-inline-start: -inset`; `max-width: calc(100% + inset)`; `border-radius: calc(var(--radius) * 1.25)` (10px); `transition: background-color, color var(--reasoning-duration) var(--reasoning-ease)`; motion-reduce none |
| hover (`@media (hover:hover)`, `:hover` / `[data-hovered]`) | `bg-default/60 text-foreground` |
| `[data-pressed]` | `bg-default/60 text-foreground` |
| `[data-focus-visible]` | `text-foreground` (+ OSS `.disclosure__trigger` `status-focused` ring) |
| `.reasoning__loader` | `inline-flex size-(--loader-size) shrink-0 items-center justify-center overflow-clip`; transition `opacity, width, margin-inline-end` var duration / ease; motion-reduce none |
| `.reasoning__loader[data-exiting]` | `opacity 0; width 0; margin-inline-end: calc(gap * -1)` |
| `.reasoning__label` | `min-w-0 truncate`; `transition: opacity` var; motion-reduce none |
| `@starting-style .reasoning__label[data-swapped]` | `opacity: 0` |
| `.reasoning__duration` | `text-foreground tabular-nums` |
| `.reasoning__indicator` | `size-3.5 ms-0` (overrides OSS `ms-auto size-4`; rotation `-180deg` from OSS) |
| `.reasoning__content > .disclosure__body` | `p-0 pt-2` (physical `padding: 8px 0 0`, like Pro) |
| `… :has(> * > .reasoning__body:empty)` | `p-0` |
| `.reasoning__body` | `text-sm wrap-break-word text-muted` |
| `.reasoning__text` | `text-sm wrap-break-word whitespace-pre-wrap text-muted` |

Panel (`height var(--disclosure-panel-height)`, 200 ms ease-out-quad + opacity 200 ms ease-out) and chevron
(`transition duration-250`, `-rotate-180` when expanded) come from the OSS Disclosure CSS unchanged.

### Live measurements (Chromium, 1280 px viewport, Pro vs remake identical apart from container width)

| Item | Value |
|---|---|
| Root | width = container, flex column, 14px / 20px |
| Trigger (complete, "Stopped after 5s") | 149.44 x 32, padding 0 8px, margin-left -8px, radius 10px, gap 8 |
| Trigger (error, "Couldn't finish thinking") | 192.66 x 32 |
| Trigger (streaming, grid loader) | 119.97 x 32: loader 16 x 16 at +8, label 57.97 x 20 at +32, chevron 14 x 14 |
| Label | `display:block` (flex item), nowrap / ellipsis, 500 weight, `--muted` |
| Duration | `--foreground`, tabular-nums |
| Body gap | disclosure body padding-top 8px -> content 28px for one line |
| Colours light | trigger / body `--muted` (lab(47.87 1.41 -4.99) = our oklch(0.5517 0.0138 285.94)); hover / pressed bg `color-mix(--default 60%)` = oklab(0.94 … / 0.6), text `--foreground`; loader `--accent` |
| Colours dark | `--muted` lab(65.65 1.53 -5.42) = oklch(0.705 0.015 286.067); hover bg oklab(0.274 … / 0.6), text foreground |
| Focus visible | OSS ring: `0 0 0 2px --background, 0 0 0 4px --focus` + text foreground |

---

## 5. Behaviour (observed timelines)

Default demo (uncontrolled): t=0 streaming, no text, collapsed (`hidden=until-found`, body empty -> body
padding 0). First text at ~790 ms -> opened ~8 ms later (after the content is in the DOM). Status
`complete` at ~2.6 s: in the same commit the loader gets `data-exiting="true"`, `aria-busy` and
`data-streaming` are removed and a **new** label element with `data-swapped="true"` is mounted (fades in via
`@starting-style`). Loader removed ~150-165 ms later (end of its 150 ms transition). Auto collapse
~1000-1018 ms after complete; `hidden="until-found"` is applied ~200 ms later (end of panel transition).

- User toggles (open or close) during the run -> no automatic collapse after complete (verified both ways);
  reopening after complete stays open.
- Focus inside the trace when the delay elapses (trigger focused) -> collapse waits; it happens right when
  focus leaves the root (`focusout` without a related target inside).
- Stop (AI SDK demo): status `stopped` -> label "Stopped after Ns", loader exits, trace stays as it was
  (open stays open; a stop before any text keeps it collapsed with an empty body and padding 0).
- Reduced motion (`prefers-reduced-motion: reduce`): `data-exiting` and the loader removal happen in the same
  task (0 ms); label still swaps (no visible fade since transitions are none).
- Keyboard: Tab focuses the trigger (focus-visible ring), Enter / Space toggle (RAC Button).
- `hidden="until-found"`: find-in-page opens the panel (RAC `beforematch` -> expand, counted as a user toggle).

Remake implementation (all reproduced and re-measured in Storybook: open 12 ms after first text, loader
removal 162 ms, collapse 1006-1010 ms, focus wait, toggles, stop, reduced motion 0 ms):
- Root keeps its own expanded state (or the controlled prop) and passes it to the OSS Disclosure as
  controlled; user toggles from RAC mark the run as "user toggled".
- `Content` observes its body (layout effect + MutationObserver) and reports "visible content" (element
  child or non-blank text) to the root; the auto open runs once per run.
- Mount mid-stream with content (uncontrolled): opens in a layout effect without calling `onExpandedChange`.
- Auto collapse only on the transition `streaming -> complete`; `stopped` / `error` never collapse, and
  `complete` after them is not a `streaming -> complete` transition. A new `streaming` resets the run flags.
- When controlled, automatic open / collapse only call `onExpandedChange`.
- Loader: phase `visible -> exiting -> hidden`; exit waits for the loader's `opacity` `transitionend`
  (fallback timeout = computed transition time + 50 ms); unmounts at once when the computed transition is
  `none` / 0 (reduced motion or `[data-reduce-motion]`).
- Label: keyed by status; `data-swapped` once the status differs from the first one rendered.

---

## 6. Demo variants

| Demo | URL | Content | Story |
|---|---|---|---|
| default | `/docs/react/demos/reasoning-default` | one streaming block (grid loader), auto open, complete "Thought for 3s", auto collapse | `Default` |
| status | `/docs/react/demos/reasoning-status` | `div.flex.w-full.flex-col.gap-6`: stopped + `duration="5s"` (collapsed), error with `defaultExpanded` | `Status` |
| with-ai-sdk | `/docs/react/demos/reasoning-with-ai-sdk` | `div.flex.w-full.flex-col.gap-4`: Stop button (`sm secondary self-start`, disabled when done), user message `div.flex.flex-col.gap-2 > p.text-sm.font-medium`, assistant `div.flex.flex-col.gap-2` > Reasoning + `p.text-sm` answer | `WithAISDK` (mocked chat, no `ai` package) |
| custom-loader | `/docs/react/demos/reasoning-custom-loader` | `gap-6` column: `Reasoning.Loader variant="sparkle"`, and `Reasoning.Loader` with `<Spinner color="current" size="sm"/>` child (loader keeps `data-variant="grid"`) | `CustomLoader` |

Extra stories from docs snippets: `History` (complete, `duration="9s"`, never collapses), `CustomLabel`
(Localization function child "Reasoned for <Duration/>").

---

## 7. Dependencies

- `@heroui/react`: `Disclosure` (Root, Heading, Trigger, Content, Body, Indicator) and its CSS.
- Pro `Loader` (`../loader`) and Pro `TextShimmer` (`../text-shimmer`).
- No optional heavy peer -> root export allowed. (Markdown is not needed by the component; the docs' AI SDK
  demo renders plain `p` text.)

---

## 8. Deviations / notes

- `Loader` always writes `data-slot="loader"` after the spread props, so `Reasoning.Loader` renames it through
  the HeroUI `render` hook (`render={(props) => <span {...props} data-slot="reasoning-loader"/>}`); a user `render`
  still runs and receives the renamed props.
- `Reasoning.Duration` also renders when it has children but `duration` is empty (docs: "children replace the
  text"); Pro's behaviour for that combination could not be observed.
- Trigger focus colour also matches `:focus-visible:not([data-focused])` (OSS convention) besides
  `[data-focus-visible="true"]`.
- Colours serialize as oklch in the remake vs lab on heroui.pro (same tokens, different compilation).
- Collapse waits for focus anywhere inside the root (trigger or content), not only the trigger.

## 9. Independent review (2026-11-25)

Re-measured with headless Edge (playwright-core) against all four public demos, light and dark:
- Static metrics (status demo): every part identical apart from container width (1200 vs 1248) and
  lab vs oklch serialization (converted: `oklch(0.5517 0.0138 285.94)` = `lab(47.87 1.42 -4.99)`,
  accent `oklch(0.6204 0.195 253.83)` = `lab(54.53 3.32 -66.54)`).
- Streaming metrics (default, custom-loader incl. sparkle + Spinner child): identical; the Spinner's rotated
  bounding box only differs by rotation phase.
- Hover / pressed / focus-visible (Tab) / Enter / Space, light + dark: identical colours, fill, ring.
- Timelines: auto open ~6 ms after first text, panel 200 ms, label swap + loader exit 150 ms frame-by-frame
  identical (opacity / width / margin curves), loader removed ~165 ms, collapse ~1006 ms after complete,
  `hidden=until-found` ~200 ms later. Reduced motion: no transitions, loader removed at once.
- Focus on trigger blocks the collapse until blur (both); hover does not block it (both).
- User toggles during streaming: mouse and keyboard reopen/close work the same (an apparent "click does not
  reopen" on heroui.pro was the demo page re-centering its content after the collapse, not the component).
- Stop (AI SDK demo) mid-run and before the first text: same status / label / panel state.
- `beforematch` (find in page) opens a collapsed trace on both.
- Theme: `--radius: 1rem` -> trigger radius 20px; `--accent` drives the loader and focus ring; `--font-sans`
  drives trigger and text.

## Appendix A - raw CSSOM (reference only; `@layer components`, reduce-motion selectors omitted)

```
.reasoning { --reasoning-ease:var(--ease-out-quint); --reasoning-duration:.15s; --reasoning-trigger-inset:calc(var(--spacing)*2); --reasoning-trigger-gap:calc(var(--spacing)*2); width:100%; font-size:var(--text-sm); line-height:var(--tw-leading,var(--text-sm--line-height)); flex-direction:column; display:flex }
.reasoning__heading { min-width:0; display:flex }
.reasoning__trigger { min-height:calc(var(--spacing)*8); min-width:0; font-size:var(--text-sm); line-height:…; font-weight:var(--font-weight-medium); color:var(--muted); align-items:center; gap:var(--reasoning-trigger-gap); padding-inline:var(--reasoning-trigger-inset); max-width:calc(100% + var(--reasoning-trigger-inset)); border-radius:calc(var(--radius)*1.25); transition:background-color var(--reasoning-duration) var(--reasoning-ease), color var(--reasoning-duration) var(--reasoning-ease); margin-inline-start:calc(var(--reasoning-trigger-inset)*-1); display:inline-flex }
.reasoning__trigger:is([data-pressed=true],[data-focus-visible=true]) { color:var(--foreground) }
.reasoning__trigger[data-pressed=true] { background-color:color-mix(in oklab, var(--color-default) 60%, transparent) }
@media (hover:hover) { .reasoning__trigger:is(:hover,[data-hovered=true]) { color:var(--foreground); background-color:color-mix(in oklab, var(--color-default) 60%, transparent) } }
.reasoning__loader { width:var(--loader-size); height:var(--loader-size); transition-property:opacity,width,margin-inline-end; transition-duration:var(--reasoning-duration); transition-timing-function:var(--reasoning-ease); flex-shrink:0; justify-content:center; align-items:center; display:inline-flex; overflow:clip }
.reasoning__loader[data-exiting] { opacity:0; width:0; margin-inline-end:calc(var(--reasoning-trigger-gap)*-1) }
.reasoning__label { text-overflow:ellipsis; white-space:nowrap; min-width:0; transition:opacity var(--reasoning-duration) var(--reasoning-ease); overflow:hidden }
@starting-style { .reasoning__label[data-swapped] { opacity:0 } }
.reasoning__duration { color:var(--foreground); font-variant-numeric:tabular-nums }
.reasoning__indicator { width:calc(var(--spacing)*3.5); height:calc(var(--spacing)*3.5); margin-inline-start:0 }
.reasoning__content>.disclosure__body { padding:calc(var(--spacing)*2) 0 0 }
.reasoning__content>.disclosure__body:has(>*>.reasoning__body:empty) { padding:0 }
.reasoning__body { font-size:var(--text-sm); line-height:…; overflow-wrap:break-word; color:var(--muted) }
.reasoning__text { font-size:var(--text-sm); line-height:…; overflow-wrap:break-word; white-space:pre-wrap; color:var(--muted) }
/* motion-reduce: .reasoning__trigger, .reasoning__loader, .reasoning__label { transition-property:none } */
```
