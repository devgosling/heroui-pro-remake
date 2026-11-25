# Rich Text Editor — clean-room implementation spec

Slug: `rich-text-editor` · Docs: https://heroui.pro/docs/react/components/rich-text-editor · Category: Forms
Import (Pro): `import {RichTextEditor} from "@heroui-pro/react/rich-text-editor";` (subpath only, depends on `@tiptap/*`)
Remake: `import {RichTextEditor} from "@heroui/pro/rich-text-editor";` (subpath only, `rootExport = false`)

Sources used: public docs text, rendered DOM / CSSOM / computed styles of the 8 public demo pages (light +
dark), runtime probing (clicks, keyboard, hover, typing, `editor.extensionManager` options, plugin keys,
history state), and the OSS HeroUI + Tiptap 3.35 + React Aria sources in this repo. The paywalled example
source was not opened.

---

## 1. Purpose

A composable Tiptap (ProseMirror) editor: toolbar with formatting toggles and actions, optional selection
bubble menu, empty-line floating menu, trigger-based suggestion (slash) menu, link popover, JSON-first
value updates and a character / word counter.

---

## 2. Anatomy

```tsx
<RichTextEditor>                                  // provider + div.rich-text-editor
  <RichTextEditor.Shell>                          // div.rich-text-editor__shell(--primary|--secondary)
    <RichTextEditor.Toolbar>                      // OSS Toolbar (RAC) + .rich-text-editor__toolbar
      <RichTextEditor.ToolbarGroup>               // div[role=group].rich-text-editor__toolbar-group
        <RichTextEditor.ToggleButton command="bold" />          // OSS ToggleButton ghost sm icon-only
        <RichTextEditor.ActionButton action="undo" />           // OSS Button tertiary|outline sm icon-only
        <RichTextEditor.CommandButton onCommand={...} />        // OSS Button tertiary|outline sm icon-only
        <RichTextEditor.LinkPopover>                            // OSS Popover (RAC DialogTrigger)
          <RichTextEditor.LinkPopover.Trigger />                // OSS Button ghost sm icon-only
          <RichTextEditor.LinkPopover.Content>                  // Popover.Content + Arrow + Dialog
            <RichTextEditor.LinkPopover.Input />                // OSS Input secondary fullWidth
            <RichTextEditor.LinkPopover.Actions>
              <RichTextEditor.LinkPopover.UnsetButton />        // OSS Button sm tertiary "Remove"
              <RichTextEditor.LinkPopover.ApplyButton />        // OSS Button sm primary "Apply"
            </RichTextEditor.LinkPopover.Actions>
          </RichTextEditor.LinkPopover.Content>
        </RichTextEditor.LinkPopover>
      </RichTextEditor.ToolbarGroup>
      {/* a separator is rendered automatically between two adjacent groups */}
    </RichTextEditor.Toolbar>
    <RichTextEditor.Content />                    // Tiptap EditorContent (.rich-text-editor__content)
    <RichTextEditor.BubbleMenu>…</RichTextEditor.BubbleMenu>        // Tiptap BubbleMenu + OSS Toolbar
    <RichTextEditor.FloatingMenu>…</RichTextEditor.FloatingMenu>    // Tiptap FloatingMenu + OSS Toolbar
    <RichTextEditor.SuggestionMenu items={getItems} />              // Tiptap Suggestion + OSS ListBox
    <RichTextEditor.Footer>
      <RichTextEditor.CharacterCount />
    </RichTextEditor.Footer>
  </RichTextEditor.Shell>
</RichTextEditor>
```

### Rendered DOM (default demo, light)

| Part | Element / attributes | `data-slot` | Classes |
|---|---|---|---|
| Root | `div` + `data-variant`, `data-disabled="true"`, `data-readonly="true"` | `rich-text-editor` | `rich-text-editor` (+ user class) |
| Shell | `div` | `rich-text-editor-shell` | `rich-text-editor__shell rich-text-editor__shell--{primary\|secondary}` |
| Toolbar | RAC Toolbar `div[role=toolbar][aria-orientation=horizontal]`, `aria-label="Editor toolbar"` | `rich-text-editor-toolbar` | `toolbar toolbar--horizontal rich-text-editor__toolbar` |
| ToolbarGroup | `div[role=group]` + user `aria-label` | `rich-text-editor-toolbar-group` | `rich-text-editor__toolbar-group` |
| separator | OSS Separator vertical (`role=separator`, `data-orientation=vertical`) | `rich-text-editor-toolbar-separator` | `separator separator--vertical separator--default rich-text-editor__toolbar-separator` |
| ToggleButton | RAC ToggleButton `button[aria-pressed]`, `data-command`, `data-active="true"` + `data-selected` when active, `aria-label` = command label | `rich-text-editor-toggle-button` | `toggle-button toggle-button--icon-only toggle-button--sm toggle-button--ghost rich-text-editor__toolbar-button` |
| ActionButton | RAC Button, `data-action`, `aria-label` | `rich-text-editor-action-button` | `button button--icon-only button--sm button--tertiary` (primary) / `button--outline` (secondary) `rich-text-editor__toolbar-button` |
| CommandButton | RAC Button, `aria-pressed` + `data-active` only when `isActive` is given | `rich-text-editor-command-button` | same as ActionButton |
| LinkPopover.Trigger | RAC Button `aria-expanded`, `aria-label="Link"`, `data-active` when caret in link | `rich-text-editor-link-popover-trigger` | `button button--icon-only button--sm button--ghost rich-text-editor__toolbar-button rich-text-editor__link-popover-trigger` |
| LinkPopover.Content | RAC Popover (`data-placement="bottom"`) + OverlayArrow + `section[role=dialog]` (labelled by trigger) | `rich-text-editor-link-popover` / dialog `rich-text-editor-link-popover-content` | `popover rich-text-editor__link-popover` / `popover__dialog rich-text-editor__link-popover-content` |
| LinkPopover.Input | `input[aria-label="Link URL"][placeholder="https://example.com"]` | `rich-text-editor-link-input` | `input input--full-width input--secondary rich-text-editor__link-input` |
| LinkPopover.Actions | `div` | `rich-text-editor-link-popover-actions` | `rich-text-editor__link-popover-actions` |
| UnsetButton / ApplyButton | OSS Button sm tertiary "Remove" / primary "Apply" | `rich-text-editor-link-unset-button` / `-link-apply-button` | `button button--sm button--tertiary` / `button--primary` |
| Content | EditorContent `div` | `rich-text-editor-content` | `rich-text-editor__content` |
| ProseMirror | `div[contenteditable][role=textbox][aria-multiline=true][aria-label="Rich text editor"][translate=no][tabindex=0]` (+ `aria-disabled` / `aria-readonly`) | `rich-text-editor-prosemirror` | `tiptap ProseMirror rich-text-editor__prosemirror` |
| loading (before mount) | `div` rendered as a direct Shell child instead of Content | (remake: `rich-text-editor-loading`) | `rich-text-editor__loading` |
| Footer | `div` | `rich-text-editor-footer` | `rich-text-editor__footer` |
| CharacterCount | `span` + `data-over-limit="true"` | `rich-text-editor-character-count` | `rich-text-editor__character-count` |
| BubbleMenu | Tiptap menu `div[tabindex=0]` appended to `.rich-text-editor__content`, inline `position:absolute` | (Pro: none; remake adds `rich-text-editor-bubble-menu`) | `rich-text-editor__bubble-menu` |
| BubbleMenu toolbar | OSS Toolbar `aria-label="Selection formatting toolbar"` | `rich-text-editor-bubble-menu-toolbar` | `toolbar toolbar--horizontal rich-text-editor__bubble-menu-toolbar` |
| FloatingMenu | same, toolbar `aria-label="Insertion toolbar"` | `…-floating-menu-toolbar` | `rich-text-editor__floating-menu(-toolbar)` |
| SuggestionMenu | portal to `body`, `div[data-react-aria-top-layer]` with inline `left/top/position:fixed/max-height/z-index:var(--z-index-overlay)` | `rich-text-editor-suggestion-menu` | `rich-text-editor__suggestion-menu` |
| list | OSS ListBox `div[role=listbox][aria-label="Suggestions"][tabindex=0]`, `data-empty` | `rich-text-editor-suggestion-menu-list` | `list-box list-box--default rich-text-editor__suggestion-menu-list` |
| item | OSS ListBoxItem `div[role=option][tabindex=-1]`, key `"<title>-<index>"`, `data-highlighted="true"` + `aria-selected="true"` on the highlighted row | `rich-text-editor-suggestion-menu-item` | `list-box-item list-box-item--default rich-text-editor__suggestion-menu-item` |
| icon / content / title / description | `span`s | `…-suggestion-menu-icon` etc. | `rich-text-editor__suggestion-menu-icon`, `-item-content`, `-title`, `-description` |
| empty | inside RAC empty-state `div[role=option][style=display:contents]` | `rich-text-editor-suggestion-menu-empty` | `rich-text-editor__suggestion-menu-empty` |
| decoration | `span[data-decoration-id][data-decoration-content=""]` (+ `is-empty` while the query is empty) | – | `rich-text-editor__suggestion-decoration` |

Toolbar group labels in the demos: "History", "Text style", "Blocks", "Lists and links", "Clear",
"Custom commands". Command labels (aria-label / tooltip): Undo, Redo, Bold, Italic, Underline,
Strikethrough, Inline code, Heading 1-3, Blockquote, Code block, Bulleted list, Numbered list, Link,
Clear formatting, Clear content.

Icons (identified by path data, Gravity UI): arrow-rotate-left/right, bold, italic, underline,
strikethrough, code, heading-1/2/3, quote-open, curly-brackets, list-ul, list-ol, link, broom-motion,
trash-bin. All 16×16 with class `size-4`.

---

## 3. API (docs)

### RichTextEditor (root provider)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `JSONContent` | – | controlled document |
| `defaultValue` | `JSONContent` | – | uncontrolled initial document |
| `onValueChange` | `(value, details) => void` | – | details = HTML, text, empty state, character + word count (remake: `{html, text, isEmpty, characters, words, editor}`) |
| `placeholder` | `string` | `"Start writing..."` | |
| `maxLength` | `number` | – | CharacterCount `limit` (blocks input beyond it) |
| `isDisabled` | `boolean` | `false` | |
| `isReadOnly` | `boolean` | `false` | |
| `extensions` | `Extensions` | – | appended after defaults |
| `editorOptions` | `Partial<EditorOptions>` | – | |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | |
| `aria-label` | `string` | `"Rich text editor"` | applied to the editable, only when `aria-labelledby` is unset |
| `aria-labelledby`, `aria-describedby` | `string` | – | applied to the editable |

### Parts
- `ToggleButton`: `command` (`bold | italic | underline | strike | code | blockquote | bulletList | orderedList | codeBlock | heading-1..3`), `tooltip?: ReactNode`.
- `ActionButton`: `action` (`undo | redo | clearFormatting | clearContent`), `tooltip`.
- `CommandButton`: `onCommand(editor)`, `isActive: boolean | (editor) => boolean`, `isDisabled: boolean | (editor) => boolean`, `tooltip`.
- `LinkPopover` + `Trigger`, `Content`, `Input`, `Actions`, `ApplyButton`, `UnsetButton`.
- `Content`: renders EditorContent.
- `BubbleMenu` / `FloatingMenu`: `toolbarProps` forwarded to the internal OSS Toolbar.
- `SuggestionMenu`: `char="/"`, `items({query, editor})`, `children(props)`, `onSelect(props)`, `pluginKey`, `allowSpaces=false`, `allowedPrefixes=[" "]`, `startOfLine=false`, `maxHeight=384`, `aria-label="Suggestions"`, `emptyContent="No results"`.
- `CharacterCount`: `showWords=false`, `children: ReactNode | (stats) => ReactNode`.
- Hooks: `useRichTextEditor()` → `{editor, isDisabled, isReadOnly, maxLength}`; `useRichTextEditorState(selector, equalityFn)`.
- Helper (from the public Extensible snippet): `filterRichTextEditorSuggestionItems(items, query)`; items `{title, description?, icon?, keywords?, command({editor, range})}`.

---

## 4. Runtime configuration observed (`editor.extensionManager`)

- `StarterKit.configure({heading: {levels: [1, 2, 3]}, link: false, underline: false})` plus separate
  Link (`openOnClick:false, enableClickSelection:false, autolink:true, linkOnPaste:true, defaultProtocol:"http"`,
  `HTMLAttributes {target:_blank, rel:"noopener noreferrer nofollow"}`) and Underline. Remake configures the
  same Link options through StarterKit (identical behaviour).
- `Placeholder` (defaults: `showOnlyCurrent`, `showOnlyWhenEditable`, classes `is-empty` / `is-editor-empty`).
- `CharacterCount` with `limit = maxLength` (input beyond the limit is rejected).
- Editor: `immediatelyRender:false`, `shouldRerenderOnTransaction:false`, `editorProps.attributes =
  {aria-multiline, aria-label, (aria-disabled|aria-readonly), data-slot, class}`.
- Plugin keys: `rich-text-editor-suggestion-<useId>` (prepended to the plugin list so Enter / arrows reach
  it first), `rich-text-editor-floating-menu`, bubble menu equivalent.
- After mount the document is set again with `setContent(value ?? defaultValue)`: the caret ends at the end
  of the content (e.g. the code block / last list item is active in the toolbar), Undo is enabled from the
  start (undoing restores the same content with the caret at the start) and `onValueChange` reports the
  initial counts (controlled demo shows "403 chars, 64 words" before any edit). Replicated.
- External `value` changes (Load buttons) call `setContent` without emitting `onValueChange`.

---

## 5. Styling (CSSOM, `@layer components`)

| Selector | Values |
|---|---|
| `.rich-text-editor` | `relative w-full` |
| `__shell` | `relative flex flex-col w-full min-h-0 overflow-hidden`, radius `calc(var(--radius)*2)` (16px), border `var(--border-width-field,1px)` solid `var(--field-border,var(--border))`, transition bg/border 150ms `--ease-smooth`, shadow 150ms `--ease-out` |
| `__shell--primary` | bg `var(--field-background, var(--default))` |
| `__shell--secondary` | bg `--default`, no shadow |
| hover (hover:hover, not disabled) | border `--field-border-hover` |
| `:has(.prosemirror:focus)` | primary bg `--field-focus`, border `--field-border-focus`; secondary keeps `--default` |
| `__toolbar.toolbar` | `flex flex-wrap items-center gap-1 p-2 min-h-12 w-full` |
| `__toolbar-group` | `flex items-center gap-1` |
| `__toolbar-separator.separator` | `mx-1 h-6 w-px shrink-0 self-center bg-separator` |
| `__toolbar-button` | `shrink-0`; `[data-active],[data-selected]` → bg `--accent-soft`, color `--accent` |
| `__content` | `flex-1 min-h-0 overflow-y-auto` |
| `__loading` | `min-height:180px` |
| `__prosemirror` | `min-h-[180px] px-4 py-3 text-sm leading-6 text-foreground outline-none` |
| prose | `> * + *` mt-3; h1/h2/h3 semibold tracking-normal 2xl/8, xl/7, lg/7; p min-h-6; ul/ol ps-6 disc/decimal; `li+li` mt-1; blockquote 2px start border `--border`, ps-4, muted; code `--default-hover` bg, radius `radius*.75`, px-1.5 py-0.5 mono 0.9em; pre bg `--default-hover` radius `radius*1.5` p-3 mono text-sm; `pre code` transparent; a `--link` underline offset 2px; placeholder `::before` float-left h-0 muted `attr(data-placeholder)` |
| `.ProseMirror-selectednode` | outline 2px `--accent` offset 2px, radius .25rem |
| `__suggestion-decoration` | bg `--accent-soft`, color `--accent`, radius `radius*.5` |
| `__footer` | `flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-xs text-muted` |
| `__character-count` | muted, tabular-nums; `[data-over-limit]` → `--danger` |
| `__bubble-menu`, `__floating-menu` | radius `radius*3` (24px), bg `--overlay`, p-1, shadow `--overlay-shadow`; inner toolbars `flex w-fit items-center gap-1` |
| `__suggestion-menu` | w-80, bg overlay, p-1, text-sm, overlay shadow, radius `min(32px, var(--radius-3xl))`, flex-col, overflow hidden |
| `__suggestion-menu-list` | flex-col gap-1 p-0 overflow-y-auto min-h-0 |
| `__suggestion-menu-item` | min-h-12 flex items-center gap-3 p-2 radius `radius*3`, transform 250ms `--ease-out-quart` + bg/shadow 150ms, `:active` scale .98, hover / `[data-highlighted]` bg `--default`, focus-visible ring |
| `__suggestion-menu-icon` | 36px round, bg `--default`, muted; highlighted row → bg `--overlay`, foreground, `shadow-sm` |
| title / description / empty | 14/20 medium foreground truncate · 12/16 muted truncate · px-3 py-2 text-sm muted |
| `__link-popover` | w-320px, radius `radius*2`, bg overlay, overlay shadow; `__link-popover-content` flex-col gap-3 p-3; actions `flex justify-end gap-2` |
| states | `[data-disabled]` root opacity .6 + shell `cursor:not-allowed`; otherwise shell `cursor:text`, toolbar/footer `cursor:default` |

Tooltips are the OSS Tooltip (12px, p-2, radius-xl, placement top, offset 3) with `delay={0}`: on hover
they open immediately (measured ~10 ms after pointer enter on the demo, vs the 1500 ms global
`--tooltip-delay`); keyboard focus opens them immediately as usual. Popover offset 8, placement bottom.

Dark mode: identical rules, tokens switch (shell `--field-background` dark, accent-soft 12% alpha, etc.).

---

## 6. Behaviour

- Toolbar buttons read state through `useEditorState`: active = `editor.isActive(...)`, disabled =
  editor disabled/read-only or `!editor.can()...`. Clear formatting is disabled on an empty document, clear
  content when empty. Pressing a button runs `chain().focus()…` so focus returns to the editor.
- Disabled / read-only: every toolbar control disabled; ProseMirror `contenteditable=false`, no tabindex,
  `aria-disabled` / `aria-readonly`.
- Link popover: opening seeds the input with the current link href (empty otherwise) and focuses the
  dialog; Apply (enabled when the input is non-empty) normalizes bare hosts to `https://` and runs
  `extendMarkRange('link').setLink`; Remove (enabled when the caret is in a link) runs `unsetLink`; both
  close the popover and return focus to the editor with the selection kept. Enter inside the input does
  not apply (observed). With a collapsed caret outside a link, Apply inserts no text: the document size
  stays the same and the link becomes a stored mark, so the next typed text is linked (observed).
  Escape closes the popover and returns focus to the trigger (React Aria default).
- Bubble menu: Tiptap defaults (placement top, offset 8, 250ms update delay, shown for non-empty text
  selections while focused and editable).
- Floating menu: Tiptap defaults (placement right of the caret, offset 8, empty text block, focused).
- Suggestion menu: opens on `char` (default `/`) after an allowed prefix; positioned `fixed` at
  `left = decoration.left`, `top = decoration.bottom + 8` (no flip), `max-height = maxHeight`. Focus stays
  in the editor; ArrowDown / ArrowUp move the highlight (clamped, no wrap) and keep the highlighted row
  visible by scrolling the list to the nearest edge (9 demo items: last row → `scrollTop` 120, back to 0 at
  the first row), the highlight resets to 0 when the query changes, Enter selects, Escape closes (Tiptap
  dismiss), hover highlights, click selects. While
  open the editor gets `aria-autocomplete="list"`, `aria-controls=<listbox id>`,
  `aria-activedescendant=<listbox id>-option-<key without spaces>`; they are removed on close.
- CharacterCount label: `"N characters"`, `"N / max characters"`, `+ ", W words"` with `showWords` (always
  plural, observed "1 characters, 1 words").

---

## 7. Demos → stories (`Pro/Forms/RichTextEditor`)

| Pro demo | Story | Structure |
|---|---|---|
| `rich-text-editor-default` | `Default` | 760px, full toolbar (5 groups, tooltips), Content, BubbleMenu (B/I/U/S + link), footer label + count with words |
| `rich-text-editor-secondary` | `Secondary` | same inside OSS `Surface` (`w-[760px] rounded-3xl p-4`), `variant="secondary"` |
| `rich-text-editor-placeholder` | `Placeholder` | 680px, empty document, long custom placeholder |
| `rich-text-editor-character-count` | `CharacterCount` | 680px, `maxLength=240` |
| `rich-text-editor-custom-composition` | `CustomComposition` | 600px, Content first, footer holds a compact toolbar (`min-h-0 border-0 p-0`) + count without words |
| `rich-text-editor-disabled` | `Disabled` | grid of a disabled and a read-only editor |
| `rich-text-editor-controlled` | `Controlled` | two "Load" buttons, external count from `details`, JSON `<pre>` preview |
| `rich-text-editor-extensible` | `Extensible` | toolbar with two CommandButtons (calendar / sparkles), FloatingMenu with a CommandButton, slash SuggestionMenu (9 items incl. a custom one), placeholder on the trailing empty line |

All story texts / documents are original (same structure as the demos).

---

## 8. Dependencies

`@tiptap/react` (+ `/menus`), `@tiptap/starter-kit`, `@tiptap/extensions` (Placeholder, CharacterCount),
`@tiptap/suggestion`, `@tiptap/pm/state`; OSS `Toolbar`, `ToggleButton`, `Button`, `Separator`, `Tooltip`,
`Popover`, `Input`, `ListBox`; React Aria `useId`. Icons are inlined from Gravity UI Icons (MIT).

---

## 9. Deviations / unknowns

- Separators between groups: Pro renders them between adjacent `ToolbarGroup`s without a documented part;
  the remake inserts them automatically between adjacent groups and also exports
  `RichTextEditor.ToolbarSeparator` for manual placement.
- BubbleMenu / FloatingMenu containers also carry a `data-slot` (Pro's had none).
- Names of the `onValueChange` details fields and `CharacterCount` render-prop stats are not documented;
  the remake uses `{html, text, isEmpty, characters, words, editor}` and `{characters, words, maxLength, isOverLimit}`.
- `useRichTextEditorState` selector receives `{editor, transactionNumber}` (Tiptap snapshot shape) and the
  hook returns `null` before mount.
- `maxLength` and `extensions` are read when the editor is created (Tiptap cannot swap extensions on a live
  editor without recreating it).
- `tooltip` is opt-in on every button. Observed in the demos: every toolbar and bubble-menu button has a
  tooltip in the default-style demos; the custom composition demo has tooltips on Bold / Italic / Bulleted
  list but none on the Link trigger; the extensible demo has tooltips on both toolbar CommandButtons (text
  can differ from the `aria-label`, e.g. a shorter label) and on the floating-menu CommandButton.
- Suggestion-menu hover: in rare cases right after the list scrolled by keyboard, the original ignores the
  first hover on a row (the highlight stays on the keyboard row until the pointer moves again); the remake
  highlights on every hover start. Not reproducible reliably enough to replicate.
- Extension order: the original adds Link and Underline after StarterKit (`@tiptap/extension-link` /
  `-underline` are not direct dependencies here), so `extensionManager` lists them in a different order.
  Same options and behaviour; plugin order only differs for these two marks.
