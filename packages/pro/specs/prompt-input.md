# Prompt Input — clean-room implementation spec

Slug: `prompt-input` · Docs: https://heroui.pro/docs/react/components/prompt-input · Category: AI
Import (Pro): `import {PromptInput, TokenFieldValue, usePromptInputTokens} from "@heroui-pro/react";`
Storybook title (remake): `Pro/AI/PromptInput`

Sources: the public docs text, the rendered DOM / CSSOM / computed styles of the ten public demo
pages (light and dark), and runtime probing (typing, Enter / Shift+Enter, MutationObserver logs of the
run states, synthetic drag events, keyboard reordering, tooltip focus). The paywalled example source
was not opened. The shared built-in browser was at its tab cap, so the public demo pages were inspected
in a separate headless Edge instance over the DevTools protocol (same pages, same checks).

---

## 1. Purpose

A composable AI prompt composer: a surface ("shell") holding an autosizing textarea (or an inline
token field), an absolute toolbar (actions, model selector, send / stop), optional attachments, a
queue of follow-up prompts above the shell and a footer line. Three layouts (stacked, compact pill,
inline row), two surface variants and four run states.

---

## 2. Anatomy

```tsx
<PromptInput value={value} onSubmit={send} onValueChange={setValue}>
  <PromptInput.Queue>                                       {/* optional */}
    <PromptInput.Queue.List values={queue} onReorder={setQueue}>
      <PromptInput.Queue.Item value={item}>
        <PromptInput.Queue.Item.Handle />                   {/* optional: reorder */}
        <PromptInput.Queue.Item.Body>
          <PromptInput.Queue.Item.Icon />
          <PromptInput.Queue.Item.Content>…</PromptInput.Queue.Item.Content>
        </PromptInput.Queue.Item.Body>
        <PromptInput.Queue.Item.Actions>
          <PromptInput.Queue.Item.Remove />
          <PromptInput.Queue.Item.More />                   {/* usually a Dropdown trigger */}
        </PromptInput.Queue.Item.Actions>
      </PromptInput.Queue.Item>
    </PromptInput.Queue.List>
  </PromptInput.Queue>
  <PromptInput.Shell>
    <PromptInput.Content>
      <PromptInput.Attachments>…</PromptInput.Attachments>  {/* optional */}
      <PromptInput.TextArea placeholder="What do you want to know?" />
    </PromptInput.Content>
    <PromptInput.Toolbar>
      <PromptInput.ToolbarStart><PromptInput.Action aria-label="Attach file">…</PromptInput.Action></PromptInput.ToolbarStart>
      <PromptInput.ToolbarEnd><PromptInput.Send /></PromptInput.ToolbarEnd>
    </PromptInput.Toolbar>
  </PromptInput.Shell>
  <PromptInput.Footer>…</PromptInput.Footer>               {/* optional */}
</PromptInput>
```

### Rendered DOM (default demo, observed)

```html
<div class="prompt-input" data-layout="stacked" data-slot="prompt-input" data-status="ready"
     data-variant="primary" style="--prompt-input-max-height:240px"
     [data-pending="true" while submitted/streaming] [data-disabled="true"] [data-expanded="true"]>
  <input class="chat-attachment-input__file-input" type="file" multiple aria-hidden>   (ChatAttachmentInput)
  <div class="prompt-input__shell [prompt-input__shell--compact|--inline] prompt-input__shell--primary"
       data-slot="prompt-input-shell" [data-dragging="true"]>
    <div class="prompt-input__content" data-slot="prompt-input-content">
      [<div class="prompt-input__attachments" data-slot="prompt-input-attachments"> chat-attachment-group … </div>]
      <textarea class="textarea textarea--full-width textarea--primary prompt-input__textarea"
                data-slot="prompt-input-textarea" aria-label="Message input" placeholder="…" rows="1"
                data-rac style="height: 56px;">
    </div>
    <div class="prompt-input__toolbar" data-slot="prompt-input-toolbar">
      <div class="prompt-input__toolbar-start" data-slot="prompt-input-toolbar-start">
        <div class="tooltip__trigger" data-slot="tooltip-trigger" role="button" tabindex="0">   (only with `tooltip`)
          <button class="button button--icon-only button--md button--tertiary" data-slot="prompt-input-action" aria-label="Attach file">
      <div class="prompt-input__toolbar-end" data-slot="prompt-input-toolbar-end">
        (ModelSelector)
        <button class="button button--icon-only button--md button--primary prompt-input__send"
                data-slot="prompt-input-send" data-status="ready" aria-label="Send message" disabled>
          <svg class="prompt-input__send-icon" …arrow-up…>
  <p class="prompt-input__footer" data-slot="prompt-input-footer">…</p>
</div>
```

Token input (replaces the textarea): `div.react-aria-TokenField[data-rac]` (RAC TokenField default
class) > `div.prompt-input__token-input[data-slot=prompt-input-token-input][data-placeholder][data-empty?]
[contenteditable][role=textbox][aria-multiline][aria-placeholder][enterkeyhint=go][aria-autocomplete=list]
[style=white-space:pre-wrap]` > text + `span[data-react-aria-token] > ​ span.prompt-input__token[data-slot=prompt-input-token][contenteditable=false] ​`.
Suggestions: RAC Popover `div.prompt-input__token-suggestions[data-slot=prompt-input-token-suggestions]
[data-trigger=MenuTrigger][data-placement]` > OSS `Menu` (`.menu` / `.menu-item`).

Queue: `div.prompt-input__queue[data-actions-visibility=hover][data-slot=prompt-input-queue]` >
OSS ScrollShadow `div.scroll-shadow.scroll-shadow--vertical.scroll-shadow--fade.prompt-input__queue-list
[data-slot=prompt-input-queue-list][data-scroll-shadow-size=40]` > `ul.prompt-input__queue-list-items
[style=overflow-anchor:none]` > `li.prompt-input__queue-item[data-slot=prompt-input-queue-item]`:
- handle `button.button.button--sm.button--ghost.prompt-input__queue-item-handle[data-slot=prompt-input-queue-item-handle][data-reorder-enabled=true][aria-label="Reorder queued prompt"]` > `svg.prompt-input__queue-icon` (grip)
- `div.prompt-input__queue-item-body` > `span.prompt-input__queue-item-icon` > `svg.prompt-input__queue-icon` (file-text) + `p.prompt-input__queue-item-content`
- `div.prompt-input__queue-item-actions` > remove `button.button--icon-only.button--sm.button--ghost[data-slot=prompt-input-queue-item-remove][aria-label="Remove queued prompt"]` (trash-bin), more `…[data-slot=prompt-input-queue-item-more][aria-label="More queue actions"]` (ellipsis)

| Part | Element | `data-slot` | BEM class |
|---|---|---|---|
| `PromptInput` | `div` | `prompt-input` | `prompt-input` (+ `--sm` / `--lg`) |
| `Shell` | `div` | `prompt-input-shell` | `prompt-input__shell` + `--primary/--secondary` + `--compact/--inline` |
| `Content` | `div` | `prompt-input-content` | `prompt-input__content` |
| `Attachments` | `div` (null when empty) | `prompt-input-attachments` | `prompt-input__attachments` |
| `TextArea` | OSS `TextArea` | `prompt-input-textarea` | `textarea textarea--full-width textarea--primary prompt-input__textarea` |
| `TokenInput` | RAC `TokenField` > `TokenInput` | `prompt-input-token-input` | `prompt-input__token-input` |
| `Token` | RAC `Token` (`span`) | `prompt-input-token` | `prompt-input__token` |
| `TokenSuggestions` | RAC `Popover` | `prompt-input-token-suggestions` | `prompt-input__token-suggestions` |
| `Tokens` | RAC `Autocomplete` (no DOM) | – | – |
| `Toolbar` / `ToolbarStart` / `ToolbarEnd` | `div` | `prompt-input-toolbar(-start/-end)` | `prompt-input__toolbar(-start/-end)` |
| `Action` | OSS `Button` (+ OSS `Tooltip` with `tooltip`) | `prompt-input-action` | `button button--icon-only button--{size} button--{tertiary|outline}` |
| `Send` | OSS `Button` | `prompt-input-send` | `button button--icon-only button--{size} button--primary prompt-input__send` |
| `Footer` | `p` | `prompt-input-footer` | `prompt-input__footer` |
| `Queue` | `div` | `prompt-input-queue` | `prompt-input__queue` |
| `Queue.List` | OSS `ScrollShadow` > `ul` | `prompt-input-queue-list` | `prompt-input__queue-list` > `prompt-input__queue-list-items` |
| `Queue.Item` | `li` | `prompt-input-queue-item` | `prompt-input__queue-item` |
| `Queue.Item.Handle` | OSS `Button` ghost sm | `prompt-input-queue-item-handle` | `prompt-input__queue-item-handle` |
| `Queue.Item.Body` / `Icon` / `Content` / `Description` | `div` / `span` / `p` / `p` | `prompt-input-queue-item-…` | `prompt-input__queue-item-body/-icon/-content/-description` |
| `Queue.Item.Attachments` / `AttachmentsOverflow` | `div` / `span` | … | `prompt-input__queue-item-attachments(-overflow)` |
| `Queue.Item.Actions` | `div` | `prompt-input-queue-item-actions` | `prompt-input__queue-item-actions` |
| `Queue.Item.Remove` / `More` / `Action` | OSS `Button` ghost sm | `prompt-input-queue-item-remove/-more/-action` | – (`prompt-input__queue-steer-arrow` inside Action) |

---

## 3. API (docs)

### PromptInput
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | internal | controlled text |
| `onValueChange` | `(value: string) => void` | – | |
| `onSubmit` | `() => void` | – | Enter or Send |
| `onStop` | `() => void` | – | Send in `submitted` / `streaming` |
| `status` | `'ready' \| 'submitted' \| 'streaming' \| 'error'` | `'ready'` | |
| `isDisabled` | `boolean` | `false` | root `data-disabled`, opacity .6, input + buttons disabled |
| `lockInputOnRun` | `boolean` | `true` | input disabled while submitted / streaming |
| `maxHeight` | `number \| string` | `240` | autosize cap + `--prompt-input-max-height` (px for numbers) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | root `prompt-input--sm/--lg` (no `--md` class rendered) |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | shell modifier, queue background |
| `layout` | `'stacked' \| 'compact' \| 'inline'` | `'stacked'` | shell modifier |

Remake extra: `defaultValue` (uncontrolled; the internal value clears after a successful submit).

### Parts
- `TextArea` — HeroUI TextArea props + `disableAutosize` (default false). Remake extra:
  `allowSubmitWhileRunning` (the docs reference it for TextArea through TokenInput). Defaults:
  `aria-label="Message input"`, `placeholder="What do you want to know?"`, `rows=1`, `fullWidth`.
- `TokenInput` — RAC TokenInput props + `tokens` (required), `children(segment)` (default
  `PromptInput.Token`), `placeholder` ('What do you want to know?'), `allowsNewlines` (true),
  `isReadOnly` (false), `isDisabled` (composer disabled / run lock), `allowSubmitWhileRunning`.
- `Tokens` — RAC Autocomplete props; renders no DOM.
- `TokenSuggestions` — RAC Popover props minus `triggerRef` / `getTargetRect`; `tokens`, `isOpen`
  (default `tokens.isOpen`), `placement` (default `'bottom start'`). Hidden while its menu is empty.
- `Token` — RAC Token props (`[data-selected]`, `[data-disabled]`).
- `Action` — HeroUI Button props + `tooltip`.
- `Send` — HeroUI Button props; status-driven icon / label.
- `Shell`, `Content`, `Attachments`, `Toolbar`, `ToolbarStart`, `ToolbarEnd`, `Footer` — native props.
- `Queue` — `actionsVisibility: 'always' | 'hover'` (default `'hover'`).
- `Queue.List` — `values`, `onReorder`, `axis: 'x' | 'y'` (default `'y'`) (+ ScrollShadow props).
- `Queue.Item` — `value` (required when reordering).
- `Queue.Item.Handle` — HeroUI Button; default `aria-label` (observed DOM: "Reorder queued prompt";
  the docs text says "Reorder queue item") and grip icon.
- `Queue.Item.Body / Icon / Content / Description / Attachments / Actions` — presentational.
- `Queue.Item.AttachmentsOverflow` — `hiddenCount`, `noun` (default `'files'`).
- `Queue.Item.Remove / More / Action` — HeroUI Button props; Remove and More have default labels/icons.

### usePromptInputTokens
Options: `triggers` (`['@', '/']`), `allowsSpaces` (false), `defaultValue` (empty), `value`, `onChange`.
Returns `value`, `setValue`, `inputRef`, `anchor`, `query`, `trigger`, `isOpen`,
`insertToken(text, {appendSpace, value})`, `close()` (+ internal `dismiss`, `setFocused`).
`insertToken` and `close` are stable.

---

## 4. Styling (observed; `@layer components`, Inter, `--radius: .5rem`)

Root: `relative w-full`. Shell: `relative flex flex-col w-full overflow-hidden`, radius `radius*2` (16px),
border solid `var(--field-border, var(--border))` width `var(--border-width-field, var(--field-border-width, 1px))`
(0 in the default theme), transitions bg / border `.15s var(--ease-smooth)` + box-shadow `.15s var(--ease-out)`.
- primary: bg `var(--field-background, var(--default))`; hover border `--field-border-hover`;
  root `:focus-within` → bg `--field-focus`, border `--field-border-focus`.
- secondary: bg `default`, no shadow; hover bg `default-hover`; focus-within bg `default` + focus border.
- `[data-dragging=true]`: bg `accent-soft`, dotted `accent` border, `box-shadow: 0 0 0 1px accent`.
- cursor `text` on the shell, `default` on the toolbar, `not-allowed` when disabled; `[data-pending]` shell
  opacity .95; `[data-disabled]` root opacity .6.

Content: flex column, gap 4px, `flex-1 min-h-0`. Attachments: flex wrap, gap 8, `px-3 pt-3 pb-1`.
Input (textarea + token input): `px-3 pt-3` (textarea keeps the OSS `pb-2`), `min-h-14` (56), `mb-14`
(56, room for the toolbar); after attachments `pt-1`; sm: `min-h-12 mb-10`; lg: `min-h-18 mb-14`.
Textarea: `resize-none`, `transition: height .1s var(--ease-out)`, OSS field fill / border / shadow /
focus ring removed inside the shell. Text 14/20 (16/24 below `sm`), colour `--field-foreground`,
placeholder `--field-placeholder`.
Token input: same box, `relative overflow-y-auto`, `max-height: var(--prompt-input-max-height)`,
`overflow-wrap:anywhere`; placeholder via `[data-empty]::before { content: attr(data-placeholder) }`.
Token: `inline-flex`, `px-1`, radius `radius*.75` (6px), bg `accent-soft`, text `accent`; selected: bg
`accent` / text `accent-foreground`; disabled opacity .6. 20px tall.
Suggestions popover: `min-w-56` (224), `max-w: min(22rem, 80svw)`, radius `radius*2`, bg `overlay`,
`box-shadow: var(--shadow-overlay)` (plain variable, no Tailwind shadow stack), `p-0`, text-sm, overflow-y auto, overscroll contain; hidden while the menu is empty.

Toolbar: absolute `inset-x-3 bottom-3`, flex, space-between, gap 8; start/end flex gap 8; end `ms-auto`.
Send `shrink-0`, icon 16px; `[data-status=error]` send bg `danger` / text `danger-foreground`.
Footer: `mt-1 text-center text-xs text-muted`.

Buttons: Action / Send are OSS icon-only buttons sized from the composer (`stacked`: size, i.e. md 36px;
`compact` / `inline`: `sm`, forced to 32px by CSS). Action variant: `tertiary` (primary surface),
`outline` (secondary surface, observed in the secondary demo).

Compact / inline: shell radius `--radius-2xl` (16px) with transitions for radius / min-height (.2s ease-out);
single-row form = grid `auto minmax(0,1fr) auto` / rows `auto minmax(48px, auto)`, areas
`attachments` + `toolbar-start textarea toolbar-end`, `min-h-12`, radius `radius*3` (24px), content and
toolbar `display: contents`; input `min-h-12 px-2 py-3.5 mb-0`, `self-start`, overflow auto;
toolbar start/end 32px tall with 8px outer padding (inline: `mt-2 self-start`; compact: `self-center`).
Collapsed compact caps the input at one line (`max-h-12`, overflow hidden, `self-center`).
Inline `[data-expanded]` (or attachments) only switches the radius to 16px.
Expanded compact (`[data-expanded]` or attachments): flex column, `min-h-28` (112), radius 16px, input
`min-h-18 mb-12 px-3 pt-3`, absolute toolbar again (32px buttons).

Queue: root becomes `flex flex-col gap-2 overflow-x-hidden`; queue card radius 16, field border, bg
`--field-background` (primary) / `default` (secondary), hover / focus border like the shell. List
`max-h-40` (160) with a 40px scroll shadow. Row: flex, gap 8, `px-2 py-1`, 1px top border
`border/50` between rows; handle 28px muted (`cursor: grab` when enabled); icons 14px; content
`text-xs leading-tight text-muted`, 2-line clamp; actions gap 2px, `opacity 0` until row hover /
focus-within / open menu (`.15s` opacity transition) when `actionsVisibility="hover"`.

Colours map 1:1 to theme tokens; no literal colours. Dark mode only swaps tokens (verified).

---

## 5. Behaviour (measured)

- Enter submits (`preventDefault`), Shift+Enter inserts a newline, IME composition never submits.
  Enter / Send do nothing while `submitted` / `streaming` (unless `allowSubmitWhileRunning`), and the
  send button is disabled while the trimmed value is empty (observed with whitespace-only input).
- Autosize: style height = `min(scrollHeight, maxHeight)`; 1 line 56px, 2 lines 60px (12 + 2×20 + 8),
  capped at 240px with overflow scrolling. Height animates (`.1s`).
- Run states (run-state demo, MutationObserver): Enter → `data-status=submitted` + root
  `data-pending=true`, textarea `disabled` + `data-disabled`, focus lost; send `aria-label="Stop"`
  with OSS `Spinner` (`spinner--current spinner--sm`, aria-label "Loading"); ~400ms → `streaming`
  (stop-fill icon, 1em, CSS 16px); ~1.4s → `ready` (send disabled again, focus not restored).
  Pressing the stop button calls `onStop` (demo returns to `ready`).
- Compact: switches to `data-expanded` as soon as the text no longer fits on one line (or contains a
  newline) and stays expanded until the value is empty again (sticky; deleting back to one short line
  keeps it expanded). Attachments switch the layout through CSS `:has()`; the overflow check also runs
  in that state, so typing with an attachment keeps the composer expanded after the attachment is
  removed (observed). Inline uses the same sticky `data-expanded` only for the radius.
- Clicking the shell outside interactive elements / the toolbar focuses the input (toolbar gaps do not).
- Attachments row renders nothing when it has no children (observed: no element while empty).
- Tooltip (`Action tooltip`): OSS Tooltip, placement top, offset 3, plain text content. It opens on
  hover with no delay (pointerenter -> tooltip in the DOM after ~8ms, although the theme's
  `--tooltip-delay` is 1.5s), i.e. `delay={0}`; the close delay keeps the theme's 500ms.
- Token input: the menu opens at a trigger typed at a word boundary, anchored to the trigger
  character (`getTargetRect` = rect of the trigger glyph; `top start` puts the popover bottom 8px above
  it and keeps it fixed while the query grows). The first item gets virtual focus (Autocomplete);
  arrows move it with the caret staying in the field; Enter inserts the token followed by a space;
  Escape closes it for the current trigger until the caret leaves; with no matching items the popover is
  hidden and Enter submits; blur closes it. Synthetic (virtual-focus) blur events are ignored and
  clicks inside the popover keep focus in the field.
- Queue drag (rAF sampled): the row follows the pointer 1:1 from the first pixel. It swaps with the
  neighbour it moves towards once its leading edge passes that neighbour's centre (moving down: row
  bottom + offset > next centre, i.e. after ~21px for 40px rows; moving up: row top < previous centre).
  Neighbours glide on a spring fitted to the samples: stiffness 675, damping 45, mass 1 (zeta 0.87,
  ~0.7% overshoot, ~300ms). Releasing snaps the dragged row into its slot in one frame (no settle
  animation). Keyboard moves animate both rows with the same spring.
- Queue auto-scroll: while dragging with the pointer within 50px of the list's top / bottom edge the
  list scrolls every frame by `25 * (1 - distance/50)^2` px (measured 1, 4, 9, 16 px/frame at 40, 30, 20,
  10px), also while the pointer is held still, and stops at the natural end of the rows. The dragged
  row keeps following the pointer, so it keeps reordering while the list scrolls.
- Queue: actions fade in on row hover / focus-within / open menu. With `values` + `onReorder`,
  the handle drags rows (live reorder while dragging, neighbours animate) and ArrowUp / ArrowDown
  (Left / Right for `axis="x"`, flipped in RTL) moves the row one slot, keeping focus on the moved
  row's handle (observed).

---

## 6. Demos (https://heroui.pro/docs/react/demos/<name>) → stories

| Demo | Content | Story |
|---|---|---|
| `prompt-input-default` (`placement=bottom`) | max-w 640, file input, attach Action (tooltip), ModelSelector + Send (arrow-up child), footer | `Default` |
| `prompt-input-review-composer` | outline sm buttons row, compact composer (`group`), add-context Action, Select (custom trigger) moving between toolbar halves when expanded, voice Action that turns muted when text exists plus a Send, status row (branch, location, `ProgressCircle color="default"` sm) | `ReviewComposer` |
| `prompt-input-secondary` (`placement=bottom`) | `variant="secondary"`, outline Action | `Secondary` |
| `prompt-input-inline` | `layout="inline"`, attach + send, footer | `Inline` |
| `prompt-input-compact` | `layout="compact"`, attach + send, footer | `Compact` |
| `chat-attachment-composer` ("With Attachments") | Dropzone rendered as Shell, attachment cards with info, `aria-label="Send"` | `WithAttachments` |
| `prompt-input-with-suggestions` | hero heading with TextShimmer, shell `shadow-overlay`, textarea `min-h-19`, two actions, PromptSuggestion pills grid | `WithSuggestions` |
| `prompt-input-token-mentions` | `flex min-h-[340px] justify-end`, Tokens + TokenInput with two initial tokens, `placement="top start"` Menu (avatars / commands); with no matching item the popover is not rendered at all (the demo narrows `isOpen`; the story does the same) | `TokenInput` |
| `prompt-input-queue` | 4 queued rows (drag + keyboard reorder), Remove + More (Dropdown `w-44`: edit / duplicate / remove) | `Queue` |
| `prompt-input-run-state` | submit → submitted → streaming → ready, stop | `RunState` |

Prompt Input demos render attachments as Preview + Remove only (no Info); the chat-attachment demo
shows Info. Stories mirror that.

---

## 7. Dependencies

OSS: `Button`, `TextArea`, `Tooltip`, `Spinner`, `ScrollShadow` (and in stories `Dropdown`, `Menu`,
`Select`, `ListBox`, `Switch`, `Separator`, `ProgressCircle`, `Avatar`, `Label`).
React Aria Components 1.22: `TokenField` / `TokenInput` / `Token` / `TokenFieldValue` /
`tokenFieldPositionToDOMRange`, `Autocomplete`, `Popover`; `react-aria` `useLocale`.
Pro: `ChatAttachment`, `ChatAttachmentInput` (stories, Dropzone → Shell), `ModelSelector` (Default /
Secondary stories), `PromptSuggestion`, `TextShimmer` (WithSuggestions story).
Icons: Gravity UI (MIT) path data inlined with attribution (arrow-up, stop-fill, xmark, grip,
file-text, trash-bin, ellipsis). No heavy optional peers → root export allowed.

---

## 8. Verification (story vs demo, 1280×900, light + dark)

Element-by-element comparison (rect relative to the root + 30 computed properties, colours
normalised to sRGB) for every demo, also after interactions (long text in compact / inline, multi-line
stacked, submitted / streaming, file added in stacked / compact / inline, drag-over, hover, focus,
review composer with text): identical except content-driven widths (own model names, token texts,
select labels) and the queue list's native 10px scrollbar on the Pro page (our Storybook uses overlay
scrollbars). Token menu position (224×264 at the same coordinates), tooltip position, stop behaviour and
keyboard reordering match.

Review pass (independent): the same comparison repeated with pages brought to the front before each
dump (background tabs freeze CSS transitions, which made the drag-over shadow look different), plus
timing probes. Found and fixed: tooltip open delay (1.5s instead of 0), drag swap threshold (centre
instead of leading edge), settle animation on release (Pro snaps), missing edge auto-scroll, reorder
easing (200ms bezier instead of the spring), drag stalling once the dragged row moved in the DOM (lost
pointer capture), the suggestion popover's shadow declaration and two story details (narrowed
suggestion `isOpen`, default-coloured ProgressCircle). Theme overrides (`--radius: 1rem`, `--accent`,
`--font-sans`) produce identical values on the Pro pages and in the stories.

## 9. Deviations / unknowns

- Reordering: Pro uses Motion (`Reorder`, inline `z-index:unset; transform:none` on rows). Motion is
  not installed for `@heroui/pro`, so the remake implements pointer dragging (window listeners), the
  leading-edge swap rule, edge auto-scroll and FLIP animations itself; the FLIP plays the measured
  spring as a sampled linear Web Animation. It does not write Motion's idle inline styles, skips
  Motion's 1px height (scale) correction between 40px / 41px rows, and marks the dragged row with
  `data-dragging` + `position: relative; z-index: 1`.
- Error state icon / label not observable in any demo: the remake shows Gravity `xmark` and keeps
  `aria-label="Send message"` (Send submits in `error`).
- `Queue.Item.Action` default content ("↳ Steer", ghost sm button) and `Queue.Item.Description`
  element (`p`) are inferred from the CSS class list; no demo renders them.
- `AttachmentsOverflow` label format inferred as `+{hiddenCount} {noun}`.
- sm / lg sizes have no demo: buttons follow the size (sm 32px, lg 40px) — inferred from the textarea
  margins (40 / 56px).
- Action default variant `outline` on the secondary surface is inferred from the secondary demo.
- Uncontrolled `PromptInput` clears its own value after a submit (behaviour not observable in demos).
- The token suggestion popover is non-modal (`isNonModal`); Pro's popover rendered RAC focus-scope
  markers and a hidden dismiss button. Focus handling observed in Pro (caret stays in the field) is
  reproduced.

---

## Appendix A — Pro CSSOM (reference only, `@layer components`; not used as implementation text)

```css
  .prompt-input { width: 100%; position: relative; }
  .prompt-input__shell { border-radius: calc(var(--radius) * 2); border-style: solid; border-color: var(--field-border,var(--border)); border-width: var(--border-width-field,var(--field-border-width,1px)); width: 100%; transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); flex-direction: column; display: flex; position: relative; overflow: hidden; }
  .prompt-input__shell--primary { background-color: var(--field-background,var(--default)); border-color: var(--field-border,var(--border)); }
  @@media (hover: hover) :: .prompt-input__shell--primary:hover { border-color: var(--field-border-hover); }
  .prompt-input:focus-within .prompt-input__shell--primary { background-color: var(--field-focus,var(--field-background,var(--default))); border-color: var(--field-border-focus,var(--field-border,var(--border))); }
  .prompt-input__shell--secondary { --tw-shadow: 0 0 #0000; box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow); background-color: var(--default); border-color: var(--field-border,var(--border)); }
  @@media (hover: hover) :: .prompt-input__shell--secondary:hover { background-color: var(--default-hover); }
  .prompt-input:focus-within .prompt-input__shell--secondary { background-color: var(--default); border-color: var(--field-border-focus,var(--field-border,var(--border))); }
  .prompt-input__shell[data-dragging="true"] { background-color: var(--accent-soft); border-style: dotted; border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .prompt-input__content { gap: var(--spacing); flex-direction: column; flex: 1 1 0%; min-height: 0px; display: flex; }
  .prompt-input__attachments { gap: calc(var(--spacing) * 2); padding-inline: calc(var(--spacing) * 3); padding-top: calc(var(--spacing) * 3); padding-bottom: var(--spacing); flex-wrap: wrap; display: flex; }
  :is(.prompt-input__textarea, .prompt-input__token-input) { margin-bottom: calc(var(--spacing) * 14); min-height: calc(var(--spacing) * 14); scrollbar-width: var(--scrollbar-width); scrollbar-color: var(--scrollbar-color); scrollbar-gutter: var(--scrollbar-gutter); padding-inline: calc(var(--spacing) * 3); padding-top: calc(var(--spacing) * 3); }
  .prompt-input__attachments + :is(.prompt-input__textarea, .prompt-input__token-input) { padding-top: var(--spacing); }
  .prompt-input--sm :is(.prompt-input__textarea, .prompt-input__token-input) { margin-bottom: calc(var(--spacing) * 10); min-height: calc(var(--spacing) * 12); }
  .prompt-input--lg :is(.prompt-input__textarea, .prompt-input__token-input) { margin-bottom: calc(var(--spacing) * 14); min-height: calc(var(--spacing) * 18); }
  .prompt-input__textarea { resize: none; transition: height .1s var(--ease-out); }
  @@media (prefers-reduced-motion: reduce) :: .prompt-input__textarea { transition: none; }
  .prompt-input__token-input { font-size: var(--text-base); line-height: var(--tw-leading,var(--text-base--line-height)); --tw-outline-style: none; outline-style: none; position: relative; overflow-y: auto; }
  @@media (min-width: 40rem) :: .prompt-input__token-input { font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); }
  .prompt-input__token-input { color: var(--field-foreground,var(--foreground)); overflow-wrap: anywhere; max-height: var(--prompt-input-max-height); }
  .prompt-input__token-input[data-empty]::before { pointer-events: none; color: var(--field-placeholder,var(--muted)); content: attr(data-placeholder); position: absolute; }
  .prompt-input__token { border-radius: calc(var(--radius) * .75); background-color: var(--accent-soft); max-width: 100%; padding-inline: var(--spacing); vertical-align: baseline; color: var(--accent); align-items: center; display: inline-flex; }
  .prompt-input__token[data-selected] { background-color: var(--accent); color: var(--accent-foreground); }
  .prompt-input__token[data-disabled] { opacity: 0.6; }
  .prompt-input__token-suggestions { max-width: min(22rem, 80svw); min-width: calc(var(--spacing) * 56); scroll-padding-block: var(--spacing); scrollbar-width: var(--scrollbar-width); scrollbar-color: var(--scrollbar-color); scrollbar-gutter: var(--scrollbar-gutter); overscroll-behavior: contain; border-radius: calc(var(--radius) * 2); background-color: var(--overlay); font-size: var(--text-sm); line-height: var(--tw-leading,var(--text-sm--line-height)); --tw-outline-style: none; box-shadow: var(--shadow-overlay); outline-style: none; padding: 0px; overflow-y: auto; }
  .prompt-input__token-suggestions:has(:is([role="menu"], [role="listbox"]):empty) { visibility: hidden; }
  .prompt-input__shell .prompt-input__textarea.textarea { box-shadow: none; --tw-shadow: 0 0 #0000; --tw-inset-shadow: 0 0 #0000; --tw-ring-shadow: 0 0 #0000; --tw-inset-ring-shadow: 0 0 #0000; --tw-ring-offset-shadow: 0 0 #0000; background-color: rgba(0, 0, 0, 0); border-width: 0px; border-color: rgba(0, 0, 0, 0); }
  .prompt-input__shell .prompt-input__textarea.textarea:hover:not(:focus):not(:focus-visible), .prompt-input__shell .prompt-input__textarea.textarea[data-hovered="true"]:not([data-focused="true"]):not([data-focus-visible="true"]) { box-shadow: none; --tw-shadow: 0 0 #0000; --tw-inset-shadow: 0 0 #0000; --tw-ring-shadow: 0 0 #0000; --tw-inset-ring-shadow: 0 0 #0000; --tw-ring-offset-shadow: 0 0 #0000; background-color: rgba(0, 0, 0, 0); border-color: rgba(0, 0, 0, 0); }
  .prompt-input__shell .prompt-input__textarea.textarea:focus, .prompt-input__shell .prompt-input__textarea.textarea:focus-visible, .prompt-input__shell .prompt-input__textarea.textarea[data-focused="true"], .prompt-input__shell .prompt-input__textarea.textarea[data-focus-visible="true"] { box-shadow: none; --tw-shadow: 0 0 #0000; --tw-inset-shadow: 0 0 #0000; --tw-ring-shadow: 0 0 #0000; --tw-inset-ring-shadow: 0 0 #0000; --tw-ring-offset-shadow: 0 0 #0000; background-color: rgba(0, 0, 0, 0); border-color: rgba(0, 0, 0, 0); outline: none; }
  .prompt-input__toolbar { inset-inline: calc(var(--spacing) * 3); bottom: calc(var(--spacing) * 3); justify-content: space-between; align-items: center; gap: calc(var(--spacing) * 2); display: flex; position: absolute; }
  .prompt-input__toolbar-start, .prompt-input__toolbar-end { align-items: center; gap: calc(var(--spacing) * 2); display: flex; }
  .prompt-input__toolbar-end { margin-inline-start: auto; }
  .prompt-input__footer { margin-top: var(--spacing); text-align: center; font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); color: var(--muted); }
  .prompt-input__send { flex-shrink: 0; }
  .prompt-input .prompt-input__send .prompt-input__send-icon { width: calc(var(--spacing) * 4); height: calc(var(--spacing) * 4); }
  .prompt-input[data-disabled="true"] { opacity: 0.6; }
  .prompt-input[data-pending="true"] .prompt-input__shell { opacity: 0.95; }
  .prompt-input[data-status="error"] .prompt-input__send { background-color: var(--danger); color: var(--danger-foreground); }
  .prompt-input[data-disabled="true"] .prompt-input__shell { cursor: not-allowed; }
  .prompt-input:not([data-disabled="true"]) .prompt-input__shell { cursor: text; }
  .prompt-input:not([data-disabled="true"]) .prompt-input__toolbar { cursor: default; }
  .prompt-input[data-layout="compact"] .prompt-input__shell--compact, .prompt-input[data-layout="inline"] .prompt-input__shell--inline { background-color: var(--field-background,var(--default)); border-color: var(--field-border,var(--border)); border-radius: var(--radius-2xl,1rem); transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), border-radius .2s var(--ease-out), box-shadow .15s var(--ease-out), min-height .2s var(--ease-out); }
  @@media (prefers-reduced-motion: reduce) :: .prompt-input[data-layout="compact"] .prompt-input__shell--compact, .prompt-input[data-layout="inline"] .prompt-input__shell--inline { transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out); }
  @@media (hover: hover) :: .prompt-input[data-layout="compact"] .prompt-input__shell--compact:hover, .prompt-input[data-layout="inline"] .prompt-input__shell--inline:hover { border-color: var(--field-border-hover); }
  .prompt-input[data-layout="compact"]:focus-within .prompt-input__shell--compact, .prompt-input[data-layout="inline"]:focus-within .prompt-input__shell--inline { background-color: var(--field-focus,var(--field-background,var(--default))); border-color: var(--field-border-focus,var(--field-border,var(--border))); }
  .prompt-input[data-layout="compact"] .prompt-input__send, .prompt-input[data-layout="compact"] [data-slot="prompt-input-action"], .prompt-input[data-layout="inline"] .prompt-input__send, .prompt-input[data-layout="inline"] [data-slot="prompt-input-action"] { width: calc(var(--spacing) * 8); height: calc(var(--spacing) * 8); max-height: calc(var(--spacing) * 8); min-height: calc(var(--spacing) * 8); max-width: calc(var(--spacing) * 8); min-width: calc(var(--spacing) * 8); flex-shrink: 0; }
  .prompt-input[data-layout="inline"] .prompt-input__shell--inline { min-height: calc(var(--spacing) * 12); border-radius: calc(var(--radius) * 3); grid-template-columns: auto minmax(0px, 1fr) auto; grid-template-rows: auto minmax(calc(var(--spacing) * 12), auto); grid-template-areas: "attachments attachments attachments" "toolbar-start textarea toolbar-end"; padding-block: 0px; display: grid; overflow: hidden; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) { min-height: calc(var(--spacing) * 12); border-radius: calc(var(--radius) * 3); grid-template-columns: auto minmax(0px, 1fr) auto; grid-template-rows: auto minmax(calc(var(--spacing) * 12), auto); grid-template-areas: "attachments attachments attachments" "toolbar-start textarea toolbar-end"; padding-block: 0px; display: grid; overflow: hidden; }
  .prompt-input[data-layout="inline"][data-expanded] .prompt-input__shell--inline { border-radius: var(--radius-2xl,1rem); }
  .prompt-input[data-layout="inline"] .prompt-input__shell--inline:has(.prompt-input__attachments > *) { border-radius: var(--radius-2xl,1rem); }
  .prompt-input[data-layout="inline"] .prompt-input__content, .prompt-input[data-layout="inline"] .prompt-input__toolbar { display: contents; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) .prompt-input__content { display: contents; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) .prompt-input__toolbar { display: contents; }
  .prompt-input[data-layout="inline"] :is(.prompt-input__textarea, .prompt-input__token-input) { min-height: calc(var(--spacing) * 12); resize: none; padding-inline: calc(var(--spacing) * 2); padding-block: calc(var(--spacing) * 3.5); transition: height .1s var(--ease-out), min-height .2s var(--ease-out); grid-area: textarea; align-self: flex-start; margin-bottom: 0px; overflow-y: auto; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) :is(.prompt-input__textarea, .prompt-input__token-input) { min-height: calc(var(--spacing) * 12); resize: none; padding-inline: calc(var(--spacing) * 2); padding-block: calc(var(--spacing) * 3.5); transition: height .1s var(--ease-out), min-height .2s var(--ease-out); grid-area: textarea; align-self: flex-start; margin-bottom: 0px; overflow-y: auto; }
  .prompt-input[data-layout="inline"] .prompt-input__textarea { max-height: none; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) .prompt-input__textarea { max-height: none; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) :is(.prompt-input__textarea, .prompt-input__token-input) { max-height: calc(var(--spacing) * 12); align-self: center; overflow-y: hidden; }
  @@media (prefers-reduced-motion: reduce) :: .prompt-input[data-layout="inline"] :is(.prompt-input__textarea, .prompt-input__token-input) { transition: none; }
  @@media (prefers-reduced-motion: reduce) :: .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) :is(.prompt-input__textarea, .prompt-input__token-input) { transition: none; }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) .prompt-input__toolbar-start { height: calc(var(--spacing) * 8); grid-area: toolbar-start; align-self: center; padding-inline-start: calc(var(--spacing) * 2); }
  .prompt-input[data-layout="compact"]:not([data-expanded]) .prompt-input__shell--compact:not(:has(.prompt-input__attachments > *)) .prompt-input__toolbar-end { height: calc(var(--spacing) * 8); grid-area: toolbar-end; align-self: center; padding-inline-end: calc(var(--spacing) * 2); }
  .prompt-input[data-layout="inline"] .prompt-input__attachments { gap: calc(var(--spacing) * 2); padding-inline: calc(var(--spacing) * 3); padding-top: calc(var(--spacing) * 3); padding-bottom: var(--spacing); flex-wrap: wrap; grid-area: attachments; display: flex; }
  .prompt-input[data-layout="inline"] .prompt-input__attachments + :is(.prompt-input__textarea, .prompt-input__token-input) { padding-top: var(--spacing); }
  .prompt-input[data-layout="inline"] .prompt-input__toolbar-start { margin-top: calc(var(--spacing) * 2); height: calc(var(--spacing) * 8); grid-area: toolbar-start; align-self: flex-start; padding-inline-start: calc(var(--spacing) * 2); }
  .prompt-input[data-layout="inline"] .prompt-input__toolbar-end { margin-top: calc(var(--spacing) * 2); height: calc(var(--spacing) * 8); grid-area: toolbar-end; align-self: flex-start; padding-inline-end: calc(var(--spacing) * 2); }
  .prompt-input[data-layout="compact"][data-expanded] .prompt-input__shell--compact { border-radius: var(--radius-2xl,1rem); min-height: calc(var(--spacing) * 28); flex-direction: column; display: flex; }
  .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) { border-radius: var(--radius-2xl,1rem); min-height: calc(var(--spacing) * 28); flex-direction: column; display: flex; }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__content, .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__content) { gap: var(--spacing); flex-direction: column; flex: 1 1 0%; min-height: 0px; display: flex; }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__toolbar, .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__toolbar) { inset-inline: calc(var(--spacing) * 3); bottom: calc(var(--spacing) * 3); justify-content: space-between; align-items: center; gap: calc(var(--spacing) * 2); display: flex; position: absolute; }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__attachments, .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__attachments) { gap: calc(var(--spacing) * 2); padding-inline: calc(var(--spacing) * 3); padding-top: calc(var(--spacing) * 3); padding-bottom: var(--spacing); flex-wrap: wrap; display: flex; }
  :is(.prompt-input[data-layout="compact"][data-expanded] :is(.prompt-input__textarea, .prompt-input__token-input), .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) :is(.prompt-input__textarea, .prompt-input__token-input)) { margin-bottom: calc(var(--spacing) * 12); min-height: calc(var(--spacing) * 18); resize: none; padding-inline: calc(var(--spacing) * 3); padding-top: calc(var(--spacing) * 3); transition: height .1s var(--ease-out), min-height .2s var(--ease-out); }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__textarea, .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__textarea) { max-height: none; }
  @@media (prefers-reduced-motion: reduce) :: :is(.prompt-input[data-layout="compact"][data-expanded] :is(.prompt-input__textarea, .prompt-input__token-input), .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) :is(.prompt-input__textarea, .prompt-input__token-input)) { transition: none; }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__attachments + :is(.prompt-input__textarea, .prompt-input__token-input), .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__attachments + :is(.prompt-input__textarea, .prompt-input__token-input)) { padding-top: var(--spacing); }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__toolbar-start, .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__toolbar-start) { flex-shrink: 0; padding-inline-start: 0px; }
  :is(.prompt-input[data-layout="compact"][data-expanded] .prompt-input__toolbar-end, .prompt-input[data-layout="compact"] .prompt-input__shell--compact:has(.prompt-input__attachments > *) .prompt-input__toolbar-end) { flex-shrink: 0; padding-inline-end: 0px; }
  .prompt-input [data-slot="select-trigger"].prompt-input__select-trigger--outline { --field-border: var(--border); --field-border-hover: var(--border); --field-border-focus: var(--border); box-shadow: none; border-style: solid; border-width: var(--border-width,1px); border-color: var(--border); --button-bg-hover: var(--default); background-color: rgba(0, 0, 0, 0); }
  @@supports (color:color-mix(in lab, red, red)) :: .prompt-input [data-slot="select-trigger"].prompt-input__select-trigger--outline { --button-bg-hover: color-mix(in srgb, var(--default) 60%, transparent); }
  @@media (hover: hover) :: .prompt-input [data-slot="select-trigger"].prompt-input__select-trigger--outline:hover, .prompt-input [data-slot="select-trigger"].prompt-input__select-trigger--outline[data-hovered="true"] { border-color: var(--border); background-color: var(--button-bg-hover); }
  .prompt-input [data-slot="select-trigger"].prompt-input__select-trigger--outline:focus-visible, .prompt-input [data-slot="select-trigger"].prompt-input__select-trigger--outline[data-focus-visible="true"] { border-color: var(--border); background-color: rgba(0, 0, 0, 0); }
  .prompt-input:has(> .prompt-input__queue) { gap: calc(var(--spacing) * 2); flex-direction: column; width: 100%; display: flex; overflow-x: hidden; }
  .prompt-input:has(> .prompt-input__queue) > .prompt-input__shell { flex-shrink: 0; width: 100%; }
  .prompt-input__queue { border-radius: calc(var(--radius) * 2); border-style: solid; border-color: var(--field-border,var(--border)); border-width: var(--border-width-field,var(--field-border-width,1px)); width: 100%; transition: background-color .15s var(--ease-smooth), border-color .15s var(--ease-smooth); flex-shrink: 0; position: relative; overflow: hidden; }
  .prompt-input[data-variant="primary"] .prompt-input__queue, .prompt-input:not([data-variant]) .prompt-input__queue { background-color: var(--field-background,var(--default)); }
  .prompt-input[data-variant="secondary"] .prompt-input__queue { background-color: var(--default); }
  @@media (hover: hover) :: .prompt-input[data-variant="primary"] .prompt-input__queue:hover, .prompt-input:not([data-variant]) .prompt-input__queue:hover { border-color: var(--field-border-hover,var(--field-border,var(--border))); }
  .prompt-input:focus-within[data-variant="primary"] .prompt-input__queue, .prompt-input:focus-within:not([data-variant]) .prompt-input__queue, .prompt-input[data-layout="compact"]:focus-within .prompt-input__queue, .prompt-input[data-layout="inline"]:focus-within .prompt-input__queue { border-color: var(--field-border-focus,var(--field-border,var(--border))); }
  .prompt-input__queue-list { max-height: calc(var(--spacing) * 40); width: 100%; overflow-x: hidden; }
  .prompt-input__queue-list-items { margin: 0px; padding: 0px; list-style-type: none; }
  .prompt-input__queue-item { align-items: center; gap: calc(var(--spacing) * 2); min-width: 0px; padding-inline: calc(var(--spacing) * 2); padding-block: var(--spacing); display: flex; }
  .prompt-input__queue-item + .prompt-input__queue-item { border-top-style: var(--tw-border-style); border-top-width: 1px; border-color: var(--border); }
  @@supports (color:color-mix(in lab, red, red)) :: .prompt-input__queue-item + .prompt-input__queue-item { border-color: color-mix(in oklab, var(--border) 50%, transparent); }
  .prompt-input__queue-item-body { align-items: center; gap: calc(var(--spacing) * 2); flex: 1 1 0%; min-width: 0px; display: flex; }
  .prompt-input__queue-item-body:has(.prompt-input__queue-item-attachments) { align-items: stretch; gap: calc(var(--spacing) * 2); flex-direction: column; }
  .prompt-input__queue-item-body:has(.prompt-input__queue-item-attachments) .prompt-input__queue-item-icon { align-self: flex-start; }
  .prompt-input__queue-item > .prompt-input__queue-item-attachments { flex-basis: 100%; padding-inline-start: calc(var(--spacing) * 9); }
  .prompt-input__queue-item:has(> .prompt-input__queue-item-attachments) { flex-wrap: wrap; }
  .prompt-input__queue-item:has(> .prompt-input__queue-item-attachments) .prompt-input__queue-item-actions { align-self: center; }
  .prompt-input__queue-item-handle { width: calc(var(--spacing) * 7); height: calc(var(--spacing) * 7); min-height: calc(var(--spacing) * 7); min-width: calc(var(--spacing) * 7); color: var(--muted); opacity: 1; transition-property: opacity; transition-timing-function: var(--tw-ease,var(--default-transition-timing-function)); transition-duration: var(--tw-duration,var(--default-transition-duration)); flex-shrink: 0; }
  .prompt-input__queue-item-handle[data-reorder-enabled] { cursor: grab; }
  .prompt-input__queue-item-handle[data-reorder-enabled]:active { cursor: grabbing; }
  .prompt-input__queue-item-icon { color: var(--muted); flex-shrink: 0; justify-content: center; align-self: center; align-items: center; display: flex; }
  .prompt-input__queue .prompt-input__queue-item .prompt-input__queue-icon { width: calc(var(--spacing) * 3.5); height: calc(var(--spacing) * 3.5); }
  .prompt-input__queue-steer-arrow { font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); color: var(--muted); }
  .prompt-input__queue-item-content { min-width: 0px; font-size: var(--text-xs); --tw-leading: var(--leading-tight); line-height: var(--leading-tight); overflow-wrap: anywhere; color: var(--muted); -webkit-line-clamp: 2; -webkit-box-orient: vertical; flex: 1 1 0%; align-self: center; display: -webkit-box; overflow: hidden; }
  .prompt-input__queue-item-body .prompt-input__queue-item-content { flex: 1 1 0%; min-width: 0px; }
  .prompt-input__queue-item-description { font-size: var(--text-xs); --tw-leading: var(--leading-tight); line-height: var(--leading-tight); color: var(--muted); }
  .prompt-input__queue-item-actions { align-items: center; gap: calc(var(--spacing) * .5); transition-property: opacity; transition-timing-function: var(--tw-ease,var(--default-transition-timing-function)); transition-duration: var(--tw-duration,var(--default-transition-duration)); flex-shrink: 0; align-self: center; display: flex; }
  .prompt-input__queue[data-actions-visibility="hover"] .prompt-input__queue-item-actions { opacity: 0; }
  .prompt-input__queue[data-actions-visibility="hover"] .prompt-input__queue-item:hover .prompt-input__queue-item-actions, .prompt-input__queue[data-actions-visibility="hover"] .prompt-input__queue-item:focus-within .prompt-input__queue-item-actions, .prompt-input__queue[data-actions-visibility="always"] .prompt-input__queue-item-actions { opacity: 1; }
  .prompt-input__queue[data-actions-visibility="hover"] .prompt-input__queue-item:has([aria-expanded="true"]) .prompt-input__queue-item-actions { opacity: 1; }
  .prompt-input__queue[data-actions-visibility="hover"] .prompt-input__queue-item:has([data-open="true"]) .prompt-input__queue-item-actions { opacity: 1; }
  .prompt-input__queue-item-attachments { align-items: center; gap: calc(var(--spacing) * 2); flex-wrap: wrap; min-width: 0px; display: flex; }
  .prompt-input__queue-item-attachments-overflow { font-size: var(--text-xs); line-height: var(--tw-leading,var(--text-xs--line-height)); color: var(--muted); }
```
