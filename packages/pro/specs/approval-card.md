# Approval Card (`approval-card`) - implementation spec

Source of truth: the public docs page https://heroui.pro/docs/react/components/approval-card (anatomy, API tables,
CSS classes, data attributes, CSS variables, localization and accessibility tables) plus the rendered DOM, CSSOM,
computed styles and runtime behaviour (MutationObserver logs, pointer and keyboard probing) of the three public demo
pages in light and dark, observed on 2026-11-25. No paywalled source, bundle, source map or prompt endpoint was read.

Tooling note: the shared built-in browser was at its tab cap for a long time, so after one session in the built-in
browser (docs text, all three demos, DOM/CSSOM/behaviour probes) the remaining probes and all pixel comparisons were run
in an isolated headless Edge instance (Playwright, 800x600 and 1280x900, same public pages).

Storybook: `Pro/AI/ApprovalCard`. Root-barrel export is fine (no heavy optional peer; only `@heroui/react`,
`react-aria` and `react-aria-components`).

## 1. Purpose

A card in which an agent asks the user one or more questions, one at a time, before it acts. Each question is a single
choice (radio), a multiple choice (checkbox), an optional typed answer, or - with no options and no typed answer - a
plain confirmation (Continue approves, Skip declines). The footer shows step dots (a tab list), a `2/3` count, an
`N skipped` hint on the last question, and Skip / Continue (Send on the last question).

## 2. Anatomy

```tsx
<ApprovalCard questions={questions}>
  <ApprovalCard.Header>
    <ApprovalCard.Title />
    <ApprovalCard.Dismiss /> {/* optional */}
  </ApprovalCard.Header>
  <ApprovalCard.Content>
    <ApprovalCard.Options>{(option) => <ApprovalCard.Option value={option.id} />}</ApprovalCard.Options>
    <ApprovalCard.CustomInput /> {/* optional, renders only when question.allowCustom */}
  </ApprovalCard.Content>
  <ApprovalCard.Footer>
    <ApprovalCard.Steps>{({question}) => <ApprovalCard.Step id={question.id} />}</ApprovalCard.Steps>
    <ApprovalCard.StepCount />
    <ApprovalCard.SkippedCount />
    <ApprovalCard.Actions>
      <ApprovalCard.Skip />
      <ApprovalCard.Continue />
    </ApprovalCard.Actions>
  </ApprovalCard.Footer>
</ApprovalCard>
```

Without children the card renders this layout itself: Dismiss only when `onDismiss` is set, Steps and StepCount only for
more than one question (SkippedCount is always mounted, CSS hides it). With children only the placed parts render.

| Part | Element / primitive | `data-slot` | classes (observed order) |
| --- | --- | --- | --- |
| Root | OSS `Card` (`<div role="group">`) | `approval-card` | `card card--{variant} approval-card` + user |
| Header | `<div>` | `approval-card-header` | `approval-card__header` |
| Title | `<div id>` (not a heading) | `approval-card-title` | `approval-card__title` |
| Dismiss | OSS `CloseButton` (`aria-label="Dismiss"`) | `approval-card-dismiss` | `close-button close-button--default approval-card__dismiss` |
| Content | `<div>`; `role="tabpanel"` + ids while Steps is placed, else `tabindex="-1"` | `approval-card-content` | `approval-card__content` |
| Options | OSS `RadioGroup` / `CheckboxGroup`, `variant="secondary"` | `approval-card-options` | `radio-group radio-group--secondary approval-card__options` / `checkbox-group checkbox-group--secondary approval-card__options` |
| (option list) | OSS `ScrollShadow` (vertical, fade, size 40, `style="--scroll-shadow-size: var(--approval-card-fade-size); --scroll-shadow-offset: 0px"`) | `approval-card-option-list` | `scroll-shadow scroll-shadow--vertical scroll-shadow--fade approval-card__option-list` |
| Option | OSS `Radio` / `Checkbox` root | `approval-card-option` | `radio approval-card__option` / `checkbox checkbox--secondary approval-card__option` |
| (option content) | `Radio.Content` / `Checkbox.Content` (`<label>` with visually hidden input) | `radio-content` / `checkbox-content` | `radio__content approval-card__option-content` |
| (option control) | `Radio.Control` + `Radio.Indicator` / `Checkbox.Control` + `Checkbox.Indicator` | `radio-control` / `checkbox-control` | `radio__control approval-card__option-control` |
| (option label) | `<span>` | `approval-card-option-label` | `approval-card__option-label` |
| (option description) | OSS `Description` (RAC `Text slot="description"`), only when the item has one | `description` | `description approval-card__option-description` |
| CustomInput | OSS `Input` `variant="secondary"` | `approval-card-custom-input` | `input input--secondary approval-card__custom-input` |
| Footer | `<div>` | `approval-card-footer` | `approval-card__footer` |
| Steps | `<div role="tablist" aria-orientation="horizontal" aria-label="Questions">` | `approval-card-steps` | `approval-card__steps` |
| Step | `<div role="tab">` (empty; the dot is `::before`) | `approval-card-step` | `approval-card__step` |
| StepCount | `<div>` > `<span aria-hidden>` (`<span current>1</span>/3`) + visually hidden `aria-live="polite" aria-atomic` div | `approval-card-step-count` | `approval-card__step-count` |
| (current number) | `<span>` | `approval-card-step-count-current` | `approval-card__step-count-current` |
| SkippedCount | `<div>` with text `N skipped` | `approval-card-skipped-count` | `approval-card__skipped-count` |
| Actions | `<div>` | `approval-card-actions` | `approval-card__actions` |
| Skip | OSS `Button` `variant="ghost" size="sm"` | `approval-card-skip` | `button button--sm button--ghost approval-card__skip` |
| Continue | OSS `Button` `variant="primary" size="sm"` | `approval-card-continue` | `button button--sm button--primary approval-card__continue` |
| (continue label) | `<span data-reserve="Send">Continue</span>` | `approval-card-continue-label` | `approval-card__continue-label` |

Structural notes:

- The `data-slot` of every OSS part is overridden (OSS components spread props after their own `data-slot`). This also
  keeps the OSS `.radio-group[data-orientation=vertical] [data-slot=radio] { margin-top }` rule from applying.
- Root: `role="group"`, `aria-labelledby={titleId}` while a Title is placed, else `aria-label={question.title}`. User
  `aria-describedby` is passed through (custom-approval demo points it at the subtitle and the total row).
- Options: `aria-labelledby={titleId}` (radiogroup also `aria-orientation="vertical"`, `data-orientation`).
- Steps use React Aria tab semantics (Pro clearly uses `useTabList`/`useTab`/`useTabPanel`: `data-collection`,
  `data-key`, `data-react-aria-pressable`, no `data-rac`, no `data-selected`). Ids: tablist `id`, tab
  `${tablistId}-tab-${key without whitespace}`, panel `${tablistId}-tabpanel-${key without whitespace}`; the current tab
  has `aria-selected="true"`, `aria-controls`, `tabindex="0"`, `data-current="true"`; the others `tabindex="-1"`.
  Step `aria-label`: `Question 2, answered` / `Question 2, not answered`.
- Tab panel `tabindex`: `0` only while it has no tabbable child (useTabPanel behaviour); without Steps the content is a
  plain container with `tabindex="-1"` (focus fallback).
- Continue label: `data-reserve` holds the other label (`Send` on non-last questions, `Continue` on the last), rendered
  by `::after { content: attr(data-reserve) / ""; visibility: hidden; height: 0 }` so the button keeps the wider width.
  When Continue gets plain ReactNode children (custom-approval demo: `Book` + `Kbd`) no label span is rendered.

### Observed markup (default demo, first question, light)

```html
<div class="card card--default approval-card w-full max-w-100" data-slot="approval-card" role="group" aria-labelledby="T">
  <div class="approval-card__header" data-slot="approval-card-header">
    <div class="approval-card__title" data-slot="approval-card-title" id="T">How should users sign in?</div>
    <button data-slot="approval-card-dismiss" class="close-button close-button--default approval-card__dismiss" aria-label="Dismiss" ...><svg data-slot="close-button-icon" .../></button>
  </div>
  <div class="approval-card__content" data-slot="approval-card-content" id="L-tabpanel-method" aria-labelledby="L-tab-method" role="tabpanel">
    <div data-slot="approval-card-options" class="radio-group radio-group--secondary approval-card__options" role="radiogroup" aria-orientation="vertical" data-orientation="vertical" aria-labelledby="T">
      <div class="scroll-shadow scroll-shadow--vertical scroll-shadow--fade approval-card__option-list" data-orientation="vertical" data-scroll-shadow-mode="auto" data-scroll-shadow-size="40" data-slot="approval-card-option-list" style="--scroll-shadow-size:var(--approval-card-fade-size);--scroll-shadow-offset:0px">
        <div data-slot="approval-card-option" class="radio approval-card__option">
          <label data-slot="radio-content" class="radio__content approval-card__option-content">
            <span style="(visually hidden)"><input type="radio" value="passkeys" aria-describedby="D" ...></span>
            <span class="radio__control approval-card__option-control" data-slot="radio-control"><span aria-hidden="true" class="radio__indicator" data-slot="radio-indicator"></span></span>
            <span class="approval-card__option-label" data-slot="approval-card-option-label">Passkeys</span>
          </label>
          <span class="description approval-card__option-description" id="D" data-slot="description" slot="description">Face ID or Touch ID, no passwords</span>
        </div>
        ...
      </div>
    </div>
  </div>
  <div class="approval-card__footer" data-slot="approval-card-footer">
    <div id="L" aria-label="Questions" role="tablist" aria-orientation="horizontal" class="approval-card__steps" data-slot="approval-card-steps">
      <div aria-label="Question 1, not answered" tabindex="0" data-key="method" id="L-tab-method" aria-selected="true" aria-controls="L-tabpanel-method" role="tab" class="approval-card__step" data-current="true" data-slot="approval-card-step"></div>
      <div aria-label="Question 2, not answered" tabindex="-1" data-key="pages" id="L-tab-pages" aria-selected="false" role="tab" class="approval-card__step" data-slot="approval-card-step"></div>
      ...
    </div>
    <div class="approval-card__step-count" data-slot="approval-card-step-count"><span aria-hidden="true"><span class="approval-card__step-count-current" data-slot="approval-card-step-count-current">1</span>/3</span><div aria-atomic="true" aria-live="polite" style="(visually hidden)">Question 1 of 3</div></div>
    <div class="approval-card__skipped-count" data-slot="approval-card-skipped-count">2 skipped</div>
    <div class="approval-card__actions" data-slot="approval-card-actions">
      <button data-slot="approval-card-skip" class="button button--sm button--ghost approval-card__skip">Skip</button>
      <button data-slot="approval-card-continue" class="button button--sm button--primary approval-card__continue" disabled data-disabled="true"><span class="approval-card__continue-label" data-reserve="Send" data-slot="approval-card-continue-label">Continue</span></button>
    </div>
  </div>
</div>
```

## 3. API

### ApprovalCard (root, wraps OSS `Card`, native div props)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `questions` | `ApprovalCardQuestion[]` | - | asked one at a time |
| `value` / `defaultValue` / `onChange` | `ApprovalCardValue` | `{}` | answers, controlled or not; `onChange` on every answer change |
| `currentStep` / `defaultStep` / `onStepChange` | `number` | `0` | index of the shown question |
| `onSubmit` | `(result: ApprovalCardSubmitResult) => void` | - | Send, or Skip on the last question |
| `onSkip` | `(questionId: string) => void` | - | every Skip |
| `onDismiss` | `() => void` | - | dismiss button; the default layout renders Dismiss only when set |
| `variant` | `"transparent" \| "default" \| "secondary" \| "tertiary"` | `"default"` | Card variant |
| `children` | `ReactNode` | - | replaces the default layout |
| `render` | `DOMRenderFunction` | - | Card's render override |

Parts: `Header`, `Content`, `Footer`, `Actions` (plain divs); `Title` (div, children override the question title);
`Dismiss` (CloseButton props); `Options` (RadioGroup / CheckboxGroup props minus value/defaultValue/onChange/validate/
render, plain className/style; `children: ReactNode | (option) => ReactNode`); `Option` (Radio / Checkbox props minus
render, plain className/style; `value: string`, `children` replaces the label only); `CustomInput` (Input props minus
value/defaultValue; defaults `variant="secondary"`, `placeholder="Something else…"`, `aria-label="Other answer"`);
`SkippedCount` (`children: ReactNode | ({count}) => ReactNode`); `Steps` (`maxVisible = 7`,
`children: ReactNode | ({index, isAnswered, question}) => ReactNode`); `Step` (`id` = question id, `aria-label`
override); `StepCount` (`children: ReactNode | ({current, total}) => ReactNode`, replaces the announced text only);
`Skip` (Button props, `variant="ghost" size="sm"`, hidden when `allowSkip: false`); `Continue` (Button props,
`variant="primary" size="sm"`, `children: ReactNode | ({isLastStep}) => ReactNode`).

Data shapes:

```ts
interface ApprovalCardOptionItem { id: string; label: string; description?: string }
interface ApprovalCardQuestion {
  id: string; title: string; options?: ApprovalCardOptionItem[];
  selectionMode?: "single" | "multiple"; // default "single"
  allowCustom?: boolean;                   // default false
  allowSkip?: boolean;                     // default true
}
type ApprovalCardValue = Record<string, {selected: string[]; custom?: string}>;
interface ApprovalCardSubmitResult { answers: ApprovalCardValue; skipped: string[] }
```

Localization defaults: `Continue` / `Send`, `Skip`, `Something else…`, `N skipped`, `Dismiss`, `Other answer`,
`Questions`, `Question N, answered|not answered`, `Question N of M`.

## 4. Behaviour (observed)

- Answered = confirmation question with an entry in `value`, or `selected.length > 0`, or a non-blank typed answer
  (whitespace-only typed text is NOT answered: Continue disabled again, dot loses `data-answered`).
- Continue: disabled (`disabled` + `data-disabled="true"`) until answered; a confirmation is always enabled and answers
  `{selected: []}`. On a non-last question it moves to `step + 1`; on the last it sends (`onSubmit`).
- Skip: removes the question's answer, calls `onSkip(id)`, moves to `step + 1`, or sends on the last question.
- Submit result: `answers` = answered questions only (typed answer trimmed), `skipped` = ids of the rest, in order.
  The demo then replaces the card with "Sent 2 answers, 1 skipped." / "Dismissed. The agent stops here.".
- Single mode: picking a radio clears the typed answer; typing clears the radio. Multiple mode: typed answer is sent
  along with the ticked options. Typed text is kept when leaving and returning to the question.
- Keys (root `onKeyDown`): `1`-`9` pick the Nth rendered, enabled option (toggle in multiple mode, focus does not move),
  ignored in text fields and with Alt/Ctrl/Cmd held; `Enter` on an option input or the custom input acts as
  Continue/Send (no-op while disabled), also with Shift or Alt held (Shift+Enter / Alt+Enter send too - verified on
  the default and with-ai-sdk demos);
  `Cmd/Ctrl+Enter` anywhere in the card acts as Continue while enabled (ignored during IME composition and when a
  root `onKeyDownCapture` called `preventDefault`). No built-in Escape (the custom-approval demo declines on Escape
  through its own root `onKeyDown`).
- Steps: click a dot (press) jumps to that question and focuses the dot. ArrowLeft/ArrowRight (flipped in RTL),
  Home/End move focus and selection together (automatic activation) and wrap around. Dots get `data-hovered`,
  `data-focus-visible` from React Aria. The card never takes focus when it appears; after Continue/Skip focus moves to
  the next question's picked (first checked) or first option input.
- Swap: on the first question change `data-swapped="true"` is added to title, content, skipped count and continue
  label and stays. Title and content are remounted (keyed by the question), the continue label is remounted when
  `isLastStep` flips, the skipped count is not remounted (it animates when it turns from `display:none` to visible).
  The enter transition is pure CSS (`@starting-style`): opacity 0 -> 1, `blur(2px)` -> none, title/content also
  `translate: 0 4px` -> 0, 200ms `--ease-out-quint`. No exit animation.
- `SkippedCount` = number of other questions without an answer; `data-last-step` on the last question, `data-empty` when
  the count is 0; visible only with `data-last-step` and without `data-empty`.
- Steps window (`maxVisible`, default 7): not observable in any demo (max 3 questions). Implemented as a window centred
  on the current dot, clamped to the ends; dots outside get `data-hidden`, the window's first/last dot gets `data-edge`
  when more dots exist beyond it.

## 5. Styling and tokens

Measured (default demo, 800x600 viewport, card 400px wide via `w-full max-w-100`): card padding 8px, gap 4px, radius
`min(32px, --radius-3xl)` = 24px (OSS card), surface shadow (light) / none (dark). Header `px-2 pt-2 pb-1`, gap 12px;
title 16px/24px semibold foreground, `me-9` while a Dismiss sits in the header; Dismiss absolute `top-2 end-2`
(24x24 OSS close button). Option rows `px-2 py-1.5`, `rounded-lg` (8px), 52px tall with a description (20px label line +
4px gap + 16px description), control 16px vertically centred on the first label line via
`margin-block: calc((1lh - var(--approval-card-control-size)) / 2)`, label 14px/20px normal, description 12px/16px muted
indented 28px (OSS rule). Hover row fill `color-mix(in oklab, var(--color-default) 60%, transparent)`. Custom input
`mx-2 mt-1`, 40px tall (OSS secondary input). Footer `p-2`, gap 10px; steps gap 6px; dots 6px, current pill 20px x 6px
(`--muted`), others `--default`, answered `color-mix(muted 45%)`; hit area 24px tall; step count 12px tabular
`muted/60` with the current number `muted`; skipped count 12px muted truncate; actions `ms-auto` gap 8px; buttons
OSS sm (32px >= md, 36px below).

CSS variables (all on `.approval-card`): `--approval-card-color-duration: 150ms`, `--approval-card-color-ease:
var(--ease-smooth)`, `--approval-card-swap-duration: 200ms`, `--approval-card-swap-ease: var(--ease-out-quint)`,
`--approval-card-swap-offset: calc(var(--spacing) * 1)`, `--approval-card-swap-blur: 2px`,
`--approval-card-step-duration: var(--approval-card-swap-duration)`, `--approval-card-step-ease:
var(--ease-in-out-quart)`, `--approval-card-reduced-duration: 120ms`, `--approval-card-options-max-height:
calc(var(--spacing) * 48)`, `--approval-card-fade-size: calc(var(--spacing) * 6)`, `--approval-card-control-size:
calc(var(--spacing) * 4)`, `--approval-card-dot-answered: color-mix(in oklab, var(--color-muted) 45%, transparent)`,
`--approval-card-dot-size: calc(var(--spacing) * 1.5)`, `--approval-card-pill-width: calc(var(--spacing) * 5)`,
`--approval-card-edge-size: calc(var(--spacing) * 1)`, `--approval-card-step-hit-size: calc(var(--spacing) * 6)`,
`--approval-card-step-gap: calc(var(--spacing) * 1.5)`.

Transitions: step width `--approval-card-step-duration --approval-card-step-ease`; dot colour
`--approval-card-color-duration --approval-card-color-ease` + dot height; swap as above. Reduced motion: swap = opacity
only, `--approval-card-reduced-duration linear`; step width switches at once, dot colour still fades. Forced colours:
dots `GrayText`, answered `CanvasText`, current/hovered `Highlight`, focus = 2px `Highlight` outline.

Dark mode: every colour is a token (card `--surface`, text `--foreground`, dots `--default` / `--muted`, control
`--default`), so the same rules apply; verified against `?theme=dark`.

## 6. Demos (https://heroui.pro/docs/react/demos/approval-card-<name>)

| Demo | Content | Story |
| --- | --- | --- |
| `default` | Centered card `w-full max-w-100`, `onDismiss`, 3 questions: single with 3 described options; multiple with 3 described options; single with 3 described options + `allowCustom`. After Send/Dismiss the card is replaced by a muted `text-sm` line. | `Default` (own questions about a project setup) |
| `custom-approval` | Card `@container w-full max-w-120`, one confirmation question, custom children: header `items-center` with a 56px Avatar (image) + Title + muted subtitle (`aria-describedby`), content `gap-6 px-2 pt-4 pb-3` with a 2/4-column `dl` of facts, price rows, a success soft Chip; footer `flex-wrap` with a secondary Checkbox (`text-muted text-xs`) and Actions: Skip as `variant="tertiary"` "Decline" + `Kbd` (Esc), Continue "Book" + `Kbd` (Cmd Enter), both `h-8 not-pointer-coarse:pe-1.5`; root `onKeyDown` declines on Escape. | `CustomApproval` (own content: a production deploy approval) |
| `with-ai-sdk` | Chat column `w-full max-w-100 flex-col gap-4`: user message, assistant text, then (after the simulated tool input streams in) the card with 2 questions: single (3 described options, ids = labels) and multiple + `allowCustom`; `onDismiss`. After Send the card becomes "Answered 1 of 2 questions" (muted) and the assistant continues. | `WithAISDK` (own flow, simulated stream; no AI SDK dependency) |

## 7. Dependencies

OSS `@heroui/react`: Card, CloseButton, RadioGroup, Radio, CheckboxGroup, Checkbox, Description, ScrollShadow, Input,
Button (stories also Avatar, Chip, Kbd). `react-aria`: usePress, useHover, useFocusRing, useLocale, useId,
mergeProps, VisuallyHidden. No Pro dependencies.

## 8. Implementation notes

- The card's own keys (1-9, Enter, Cmd/Ctrl+Enter) are handled in the root's capture phase
  (`onKeyDownCapture`): React Aria's radio group stops the propagation of Enter on a focused radio, so a bubble
  handler never sees it (Pro does send on Enter from a radio). A user `onKeyDownCapture` runs first and can
  `preventDefault` to skip them; Cmd/Ctrl+Enter also stops propagation so a focused Skip button is not pressed too.
  `onKeyDown` (bubble) is passed through for the app's own keys, e.g. Escape.
- Title / Steps register themselves (layout effect) so a custom layout gets `aria-labelledby` and tab-panel roles; the
  default layout knows both up front, so its first render is already complete.
- Focus after Continue/Skip: checked option input, else first enabled option input, else the custom input, else the
  content element.

## 9. Verification (story vs demo, headless Edge 800x600 / 800x900, light + dark)

- Default: every part's rect (relative to the card), padding, margin, gap, font size/weight/line height, radius,
  shadow, transition, cursor and pseudo-element (`::before` dots, `::after` row cover and reserve label) identical;
  only colour serialisation differs (Pro's build emits `lab()`, ours `oklch()` for the same tokens) and text widths
  (own copy). Same in dark (`?theme=dark` vs `globals=heroui-theme:dark`).
- A 17-step interaction script (click option, Continue, keys 1/3, Ctrl+Enter to the last question, key 2, typing in
  the custom input, whitespace-only answer, click / ArrowRight / End+ArrowRight / ArrowLeft on the dots, Skip, Enter
  on a checkbox and on a radio) produces identical DOM state on both after every step (selection, step attributes and
  labels, counts, data-swapped / data-empty / data-last-step, Continue disabled state and label, focused element and
  its focus-visible state), ending in the submit with the same counts.
- Swap transition sampled per frame: same `@starting-style` start (opacity 0, blur 2px, translate 0 4px), same 200ms
  `cubic-bezier(0.23, 1, 0.32, 1)`; reduced motion: opacity only, 120ms linear, step width at once.
- Hover: option row `color-mix(default 60%)`, dot hover `muted 45%`, pointer cursor - identical.
- Custom approval: header / content / footer / actions / buttons / Kbd metrics identical (Cmd glyph 3px narrower in
  Storybook only because the page lacks Pro's `Inter Fallback` font face); Escape, Ctrl+Enter, Continue, Skip and Enter
  on the footer checkbox behave the same.
- With AI SDK: chat column and card geometry identical (400x332 column, card at y=68, 264px tall).

## 10. Deviations / open points

- Tabs are implemented with React Aria interaction hooks and an own roving-tabindex keyboard handler instead of
  `useTabList` (that hook needs `react-stately`'s `useTabListState`, which `@heroui/pro` cannot import). Same roles,
  ids, keys (arrows with RTL flip, Home/End, wrap) and data attributes; `data-collection` is not emitted.
- `maxVisible` window strategy (centred) is an assumption - no public demo has more than 3 questions.
- The AI SDK story simulates the stream; it does not depend on `ai` / `@ai-sdk/react`.

## Appendix A - CSSOM (default demo, light), `context >> rule`

See `cssom` probe output; all 49 rules mention `.approval-card`:

```
@layer components >> .approval-card { --approval-card-*: (defaults above); gap: var(--spacing); padding: calc(var(--spacing) * 2) }
@layer components >> .approval-card__header { align-items:flex-start; gap:calc(var(--spacing)*3); padding-inline:calc(var(--spacing)*2); padding-top:calc(var(--spacing)*2); padding-bottom:var(--spacing); display:flex }
@layer components >> .approval-card__title { min-width:0; font-size:var(--text-base); font-weight:var(--font-weight-semibold); color:var(--foreground); flex:1 1 0% }
@layer components >> .approval-card .approval-card__dismiss { inset-inline-end:calc(var(--spacing)*2); top:calc(var(--spacing)*2); position:absolute }
@layer components >> .approval-card__header:has(> .approval-card__dismiss) > .approval-card__title { margin-inline-end:calc(var(--spacing)*9) }
@layer components >> .approval-card__content { gap:var(--spacing); outline:none; flex-direction:column; display:flex } (+ :focus-visible focus ring)
@layer components >> .approval-card__option-list { max-height:var(--approval-card-options-max-height); flex-direction:column; display:flex }
@layer components >> .approval-card__option { border-radius:calc(var(--radius)*1); padding-inline:calc(var(--spacing)*2); padding-block:calc(var(--spacing)*1.5); position:relative }
@media (hover:hover) >> .approval-card__option:has(> [data-hovered="true"]) { background-color: color-mix(in oklab, var(--color-default) 60%, transparent) }
@layer components >> .approval-card__option > .approval-card__option-content { align-items:flex-start; position:static } ; ::after { content:""; position:absolute; inset:0; border-radius:inherit }
@layer components >> .approval-card__option-content > .approval-card__option-control { margin-block: calc((1lh - var(--approval-card-control-size)) / 2) }
@layer components >> .approval-card__option-label { min-width:0; font-size:var(--text-sm); font-weight:var(--font-weight-normal); color:var(--foreground) }
@layer components >> .approval-card__custom-input { margin-inline:calc(var(--spacing)*2); margin-top:var(--spacing) }
@layer components >> .approval-card__footer { align-items:center; gap:calc(var(--spacing)*2.5); padding:calc(var(--spacing)*2); display:flex }
@layer components >> .approval-card__steps { align-items:center; gap:var(--approval-card-step-gap); display:flex }
@layer components >> .approval-card__step { width:var(--approval-card-dot-size); height:var(--approval-card-step-hit-size); cursor:var(--cursor-interactive); transition:width var(--approval-card-step-duration) var(--approval-card-step-ease); outline:none; flex-shrink:0; display:flex; align-items:center; justify-content:center }
@layer components >> .approval-card__step::before { content:""; width:100%; height:var(--approval-card-dot-size); background-color:var(--default); border-radius:infinity; transition: background-color var(--approval-card-color-duration) var(--approval-card-color-ease), height var(--approval-card-step-duration) var(--approval-card-step-ease) }
[data-answered]::before answered colour; [data-current] pill width; [data-current]::before var(--muted);
@media (hover:hover) [data-hovered]:not([data-current])::before answered colour; [data-answered][data-hovered]::before var(--muted)
[data-edge] edge size (width + ::before height); [data-hidden] display:none; [data-focus-visible]::before focus ring
.approval-card__step-count { text-xs; tabular-nums; color: muted 60% } ; -current { color: var(--muted) }
.approval-card__skipped-count { truncate; min-width:0; text-xs; color:var(--muted); tabular-nums } ; :not([data-last-step]), [data-empty] { display:none }
.approval-card__actions { align-items:center; gap:calc(var(--spacing)*2); margin-inline-start:auto; display:flex }
.approval-card__continue-label { display:inline-flex; flex-direction:column; align-items:center } ; ::after { visibility:hidden; content:attr(data-reserve) / ""; height:0; overflow:hidden }
[data-swapped] (title, content, skipped-count, continue-label) transition opacity/translate/filter swap-duration swap-ease; @starting-style opacity:0, blur(swap-blur), title+content translate:0 swap-offset
@media (prefers-reduced-motion: reduce): swap -> opacity reduced-duration linear; step transition none; step::before transition-property background-color
@media (forced-colors: active): dots graytext / canvastext / highlight; focus outline 2px highlight offset 2px
```

## Review (2026-11-25, independent pass)

Re-measured in headless Edge (Playwright) against the public demos, light / dark / forced-colors / reduced-motion,
800x600 and 375x760: full computed-style dumps of every node in the card (colours normalised to sRGB) in 10
interaction states, pressed states, a theme override (`--radius: 1rem`, `--accent`, `--font-sans`, `--spacing` applied
identically to both pages), ARIA relationships (ids resolved to parts) on all three questions, frame-sampled swap /
step transitions, and ~60 keyboard / pointer probes. Only difference found and fixed: Shift+Enter and Alt+Enter on an
option or in the custom input act as Continue in Pro (ours ignored them). Remaining deltas are environment-only
(Storybook font stack without `Inter Fallback`, the `react-scan-root` focus stop after the card, `lab()` vs `oklch()`
serialisation of the same tokens).
