# Chat Attachment — clean-room implementation spec

Slug: `chat-attachment` · Docs: https://heroui.pro/docs/react/components/chat-attachment · Category: AI
Import (Pro): `import {ChatAttachment, ChatAttachmentGroup, ChatAttachmentInput} from "@heroui-pro/react";`
Storybook title (remake): `Pro/AI/ChatAttachment`

Sources: public docs text, rendered DOM and CSSOM of the three public demo pages (light and dark),
computed styles and runtime probing (file picking with real files, synthetic drag-and-drop,
input click interception). The paywalled example source was neither opened nor worked around.

Note on tooling: the shared built-in browser was at its tab cap for the whole session, so the demo
pages were inspected in an isolated headless Edge instance driven over the DevTools protocol
(same public pages, same checks: DOM, CSSOM, computed styles, events).

---

## 1. Purpose

Attachment previews and composer file-input helpers for AI chat surfaces.

- `ChatAttachment`: compact preview of one file. Image and video attachments with a `src` render as
  a 64×64 square thumbnail with the name revealed on hover. Every other file renders as a
  horizontal card: format icon, name and size.
- `ChatAttachmentGroup`: wrapping flex row of attachments.
- `ChatAttachmentInput`: headless file-picker plus drag-and-drop helper for prompt composers
  (`Trigger` opens a hidden `<input type="file">`, `Dropzone` adds drop handling to any element via `render`).

---

## 2. Anatomy

```tsx
<ChatAttachmentGroup>
  <ChatAttachment name="brief.pdf" size={824120}>
    <ChatAttachment.Preview>
      <ChatAttachment.Icon />
    </ChatAttachment.Preview>
    <ChatAttachment.Info>
      <ChatAttachment.Name />
      <ChatAttachment.Size />
    </ChatAttachment.Info>
    <ChatAttachment.Remove /> {/* optional */}
  </ChatAttachment>
</ChatAttachmentGroup>

<ChatAttachmentInput onFilesSelected={addFiles}>
  <ChatAttachmentInput.Trigger /> {/* optional */}
  <ChatAttachmentInput.Dropzone render={(props) => <PromptInput.Shell {...props}>…</PromptInput.Shell>} />
</ChatAttachmentInput>
```

Rendered DOM (observed):

```html
<div class="chat-attachment-group" data-slot="chat-attachment-group">
  <!-- media -->
  <div class="chat-attachment" data-media-type="image" data-slot="chat-attachment" data-variant="media" title="sunset.png">
    <div class="chat-attachment__preview" data-slot="chat-attachment-preview">
      <img alt="sunset.png" class="chat-attachment__preview-image" data-slot="chat-attachment-preview-image" src="…">
    </div>
    <div class="chat-attachment__info" data-slot="chat-attachment-info">
      <span class="chat-attachment__name" data-slot="chat-attachment-name">sunset.png</span>
      <span class="chat-attachment__size" data-slot="chat-attachment-size">20 KB</span>
    </div>
    <button data-slot="chat-attachment-remove" class="close-button close-button--default chat-attachment__remove"
            type="button" aria-label="Remove attachment" data-rac …><svg …xmark…/></button>
  </div>
  <!-- file -->
  <div class="chat-attachment" data-media-type="document" data-slot="chat-attachment" data-variant="file" title="brief.pdf">
    <div class="chat-attachment__preview" data-slot="chat-attachment-preview">
      <span class="chat-attachment__icon" data-slot="chat-attachment-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none">…</svg></span>
    </div>
    <div class="chat-attachment__info" …><span class="chat-attachment__name" …/><span class="chat-attachment__size" …/></div>
    <button data-slot="chat-attachment-remove" class="close-button close-button--default chat-attachment__remove" …/>
  </div>
</div>

<!-- ChatAttachmentInput renders NO wrapper: just the hidden input followed by its children -->
<input aria-hidden="true" class="chat-attachment-input__file-input" multiple type="file">
<div class="prompt-input__shell …" data-slot="prompt-input-shell" [data-dragging="true" while dragging files]>…</div>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| `ChatAttachment` | `div` | `chat-attachment` | `chat-attachment` | `data-variant="media\|file"`, `data-media-type`, `title={name}` |
| `ChatAttachment.Preview` | `div` | `chat-attachment-preview` | `chat-attachment__preview` | default content: `img` / `video` / `Icon` |
| image | `img` | `chat-attachment-preview-image` | `chat-attachment__preview-image` | `alt={name}` |
| video | `video` | `chat-attachment-preview-video` | `chat-attachment__preview-video` | (not seen live; muted, playsInline, preload=metadata in the remake) |
| `ChatAttachment.Icon` | `span` | `chat-attachment-icon` | `chat-attachment__icon` | 16×16 Gravity UI glyph, CSS sizes it to 20px |
| `ChatAttachment.Info` | `div` | `chat-attachment-info` | `chat-attachment__info` | default children Name + Size |
| `ChatAttachment.Name` | `span` | `chat-attachment-name` | `chat-attachment__name` | defaults to `name` |
| `ChatAttachment.Size` | `span` | `chat-attachment-size` | `chat-attachment__size` | `null` when no size |
| `ChatAttachment.Remove` | OSS `CloseButton` (`button`) | `chat-attachment-remove` (overrides `close-button`) | `close-button close-button--default chat-attachment__remove` | `aria-label="Remove attachment"` |
| `ChatAttachmentGroup` | `div` | `chat-attachment-group` | `chat-attachment-group` | |
| `ChatAttachmentInput` | fragment + `input[type=file]` | – | `chat-attachment-input__file-input` | `aria-hidden`, `multiple`, `accept`, `disabled` |
| `ChatAttachmentInput.Trigger` | OSS `Button` by default, or `render(props)` | – | – | demo renders `PromptInput.Action` (tertiary icon button, aria-label "Attach file") |
| `ChatAttachmentInput.Dropzone` | `div` by default, or `render(props)` | – | – | sets `data-dragging="true"` on the rendered element while files are dragged over it |

Default content when `ChatAttachment` has no children: `Preview` + `Info` (no Remove).

---

## 3. API (docs)

### ChatAttachment
| Prop | Type | Default | Description |
|---|---|---|---|
| `mediaType` | `'audio' \| 'document' \| 'image' \| 'unknown' \| 'video'` | inferred | Attachment media type |
| `mimeType` | `string` | – | MIME type used to infer media type and icon |
| `name` | `string` | – | File name (also used to infer the icon by extension) |
| `size` | `number` | – | File size in bytes, formatted for display |
| `src` | `string` | – | Preview URL for image or video attachments |
| `children` | `ReactNode` | default content | Custom attachment content |

Sub-parts: `Preview` (children replace the preview), `Icon` (children override the icon), `Info`
(defaults to Name + Size; hover overlay in media), `Name` (defaults to `name`), `Size` (formatted
`size`, renders nothing when unavailable), `Remove` (extends HeroUI `CloseButton` props).

### ChatAttachmentInput
| Prop | Type | Default | Description |
|---|---|---|---|
| `accept` | `string` | – | Native file input accept filter |
| `multiple` | `boolean` | `true` | Allow multiple files |
| `disabled` | `boolean` | `false` | Disable picker and drop behaviour |
| `onFilesSelected` | `(files: File[]) => void` | – | Called when files are selected or dropped |

`ChatAttachmentInput.Trigger`: opens the hidden file input; `render` wires it to another button.
`ChatAttachmentInput.Dropzone`: adds drag-and-drop; `render` attaches it to e.g. `PromptInput.Shell`
(`render={(props) => <PromptInput.Shell {...props}>…</PromptInput.Shell>}`).

### Helpers
- `inferChatAttachmentFileKind(mimeType?, name?)` → file kind for the icon.
- `formatChatAttachmentSize(bytes?)` → `"B" | "KB" | "MB" | "GB"` string.

---

## 4. Inference rules (measured with 60+ real files through the composer demo)

### `data-media-type`
MIME decides when present: `image/*` → image, `video/*` → video, `audio/*` → audio, any other MIME
(`application/pdf`, `application/octet-stream`, `text/plain`, …) → `document`. Without MIME only the
extension of image (and, by symmetry, video/audio) files is recognised: `pic.heic` (no MIME) → image,
while `.psd`, `.go`, `.tsv`, `.key`, `.xlsx`, `.docx`, `.tsx` without MIME → `unknown`.

### File kind / icon (Gravity UI glyph)
Checked in this order, each against MIME **or** extension:
1. `pdf` (application/pdf, .pdf) → file-letter-p
2. `image` (image/*, image ext) → picture
3. `video` (video/*, video ext) → video. Note: `.ts` files that the OS types as `video/vnd.dlna.mpeg-tts` get the video icon.
4. `audio` (audio/*, audio ext) → music-note
5. `archive` (zip / x-compressed / x-tar / gzip MIME; 7z, rar, gz, tar, zip, epub) → file-zipper
6. `spreadsheet` (spreadsheet / ms-excel / text/csv; csv, tsv, xls(x), ods, numbers) → file-letter-x
7. `code` (json, javascript, text/html, text/css, text/xml, x-sh, x-python; c, css, go, html, java, js(x), py, rs, sh, ts(x), xml, yaml …) → file-code. `x.c` typed `text/plain` still gets code (extension beats generic text).
8. `document` (msword, wordprocessing, presentation, opendocument.text, any other `text/*`; doc(x), txt, md, rtf, odt, pptx, key, pages) → file-letter-w
9. generic (`application/octet-stream`, no extension, .psd) → file-text

### Size format
`0 → "0 B"`, `1023 → "1023 B"`, `1024 → "1 KB"`, `1536 → "2 KB"`, `10752 → "11 KB"`,
`1048064 → "1024 KB"` (KB rounds, never promotes), `1048576 → "1.0 MB"`, `1100000 → "1.0 MB"`,
`1572864 → "1.5 MB"`, `824120 → "805 KB"`, MB/GB always one decimal (`14.5 MB`, `2.3 MB`).

### Variant
`media` when the media type is image/video **and** a `src` exists; otherwise `file`. Evidence:
`clip.mp4` and `pic.heic` picked in the composer (no object URL created by the demo) render as file
cards with the video / picture icons; `.png`, `.tiff`, `.svg` (object URL) render as media.

---

## 5. Styling (observed CSSOM, `@layer components`, default `--radius: .5rem`)

`.chat-attachment` — `relative shrink-0 rounded-xl (calc(var(--radius)*1.5) = 12px) border border-border bg-transparent`.

`[data-variant="media"]` — `size-16 (64px) overflow-hidden`; preview fills (`size-full`), image/video `object-cover size-full`
(62×62 inside the 1px border).

`[data-variant="file"]` — `flex h-16 max-w-64 (256px) items-center gap-2.5 px-3`; preview `size-auto shrink-0 text-muted`;
icon `inline-flex center`, `svg size-5 (20px)`; info `flex flex-col justify-center gap-0.5 flex-1 min-w-0`.

`.chat-attachment__name` — `block min-w-0 truncate text-sm` (14/20); file: `font-medium text-foreground`;
media: `text-xs (12/16) font-medium text-white`.

`.chat-attachment__size` — `block text-xs text-muted tabular-nums`; hidden (`display:none`) in media.

Media info overlay (`> .chat-attachment__info`): `pointer-events-none absolute inset-x-0 bottom-0
bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-5 pb-1 opacity-0 transition-opacity` (150ms,
cubic-bezier(.4,0,.2,1)); `:hover` / `:focus-within` on the root → `opacity: 1`.

`.chat-attachment__remove` (on top of OSS `close-button--default`): `bg-default text-muted transition-colors`;
`@media (hover:hover) :hover` → `bg-default-hover text-foreground`.
- file: `bg-transparent shrink-0`, box `size-5` (20px), `svg size-3` (12px).
- media: `absolute top-1.5 end-1.5 opacity-70 shadow-overlay backdrop-blur-sm (8px) transition-opacity`,
  box `size-3` (12px) — the close-button `p-1` stays, so the 8px (`size-2`) glyph overflows the
  padding box, exactly like Pro — and `@media (hover:hover)` `opacity: 0` until root `:hover` / `:focus-within` → 1.
- The selectors for the remove size use `[data-slot="chat-attachment-remove"]`.

`.chat-attachment-group` — `flex flex-wrap items-start gap-2`.

`.chat-attachment-input__file-input` — `display: none` (hidden input, still `.click()`-able).

Measured (light, Inter): file card `brief.pdf` 143.33×64, icon at x+13 (12px padding + 1px border),
info 38px tall (20 name + 2 gap + 16 size), remove 20×20 with 12×12 glyph; media tile 64×64,
info overlay 62×40 (`pt-5 pb-1` + 16px name line), remove 12×12 at top/end 6px.

Colours: border `--border`, name `--foreground`, size/icon `--muted`; dark mode only changes tokens.
The only literal colours are the overlay gradient (`black/75`) and the white media name, as in Pro.

Drag highlight is **not** part of this component: the Prompt Input owns
`.prompt-input__shell[data-dragging="true"] { bg accent-soft; border dotted accent; box-shadow 0 0 0 1px accent }`.

---

## 6. Behaviour

- `ChatAttachmentInput` renders the hidden input first, then its children (no wrapper element).
  Input attributes: `type="file"`, `aria-hidden="true"`, `multiple` (default true), `accept`, `disabled`.
- After a pick, `onFilesSelected(Array.from(files))` fires and the input value is reset to `""`
  (observed `files.length === 0` afterwards), so the same file can be picked again.
- `Trigger` press calls `input.click()` (observed one programmatic click on the hidden input).
- `Dropzone` handlers: `dragenter` / `dragover` call `preventDefault()` and set `data-dragging="true"`
  **only when the drag carries files** (`dataTransfer.types` includes `"Files"`; a text drag is ignored
  and not prevented). `dragleave` always calls `preventDefault()` and clears the flag when the
  pointer leaves the element (related target outside it). `drop` always calls `preventDefault()`
  (also for text drags), clears the flag and forwards the dropped files. No `stopPropagation()`:
  every event still reaches `document`. `disabled` turns everything off. (Verified side by side with
  synthetic DragEvents: identical `defaultPrevented` results for enter/over/leave/drop and text drags.)
- The remake additionally filters dropped files against `accept` (the native picker already does).
- Media tiles reveal name overlay and remove button on hover and keyboard focus (`:focus-within`);
  touch devices (no hover) always show the remove button at 70% opacity.
- Composer guidance (docs): revoke `blob:` URLs on remove, on clear and on unmount.

---

## 7. Demos (https://heroui.pro/docs/react/demos/chat-attachment-<name>)

| Demo | Content | Story |
|---|---|---|
| `default` | Pro `ChatMessage.User` (`.chat-message--user`): right-aligned group (`mb-2`) with one image tile, then `ChatMessage.Bubble` > `ChatMessage.Content` | `Default` (uses our `ChatMessage`) |
| `composer` | PromptInput (max-w-xl, stacked) + ChatAttachmentInput: hidden input, Dropzone rendered as the shell, attach button (Trigger render → tertiary icon button in a tooltip), attachment group with Remove inside the shell above the textarea | `Composer` |
| `grouped` | ChatAttachmentGroup with 6 file cards (pdf, zip, xlsx, docx, tsx, long pdf name truncated at 256px) and 2 image tiles | `Grouped` |

---

## 8. Dependencies

OSS `CloseButton` (Remove), OSS `Button` (default Trigger). No heavy peers → root export allowed.
Icons: Gravity UI (MIT) path data inlined with attribution.
Stories use OSS `Button`, `Tooltip`, `TextArea`, our `ChatMessage` and @iconify gravity-ui icons. The
composer story uses a story-local stand-in for the Prompt Input (stacked, primary) because `PromptInput`
is built later. It mirrors the observed layout with Tailwind utilities: shell `relative flex flex-col
overflow-hidden`, radius `calc(var(--radius)*2)`, `bg-field`, `border-field-border` at
`--border-width-field`, focus-within `bg-field-focus`; attachments row `flex flex-wrap gap-2 px-3 pt-3 pb-1`
inside a `flex flex-col gap-1` content column; OSS `TextArea` (`mb-14 min-h-14 px-3 pt-3`, `pt-1` after
attachments, transparent, no border or shadow); toolbar `absolute inset-x-3 bottom-3`.
Demo canvas (`[data-demo-page]`): `p-6`, `sm:p-10`, centred.

---

## 9. Verification (story vs demo, same files, 1280×900, light + dark)

- Composer with `sunset.png` + `brief.pdf`: every attachment part has identical rects
  (tile 64×64 at the same position, card 143.33×64, icon 20×20, info 57.33×38, remove 20×20 / 12×12),
  identical computed fonts, radii, paddings, transitions, backdrop blur and opacity.
- Hover over the media tile: overlay and remove reach opacity 1 in both; zoomed screenshots are
  pixel-identical. Hovering the file remove turns its colour to `--foreground` in both.
- Drag probes and trigger probe: identical (see section 6).
- Grouped: long name truncates at 256px; icons per kind match. Default: same message layout.
- Review pass (447×402 pane): Grouped light computed styles identical for all 49 nodes; Composer light
  and dark (sunset.png + brief.pdf) identical for all 18 attachment nodes once lab/oklch colours are
  normalised to sRGB; composer shell rects now identical too (empty 399×112, with files 399×196, same
  textarea and toolbar positions); Default message rects identical. Hover (media tile, media remove,
  file remove), keyboard focus-visible ring, `:focus-within` reveal, Enter-to-remove (focus falls back to
  `body` in both) and a 15-step synthetic drag probe (files and text; enter, over, leave via a child, drop)
  give the same results. Theme check: `--radius: 1rem` gives 24px radii; `--font-sans`, `--border` and
  `--muted` overrides are all followed.

## 10. Deviations / unknowns

- Default `Trigger` rendering (no `render`) was not observable (demo always uses `render`); the remake
  renders an OSS tertiary icon-only `Button` with a paperclip glyph and `aria-label="Attach file"`.
- `render` signatures: Trigger gets `{onPress, isDisabled, "aria-label"}` (HeroUI/RAC button props);
  Dropzone gets DOM drag handlers plus `data-dragging`.
- Video preview element attributes not observed (no demo has a video `src`).
- Extension → mediaType fallback for video/audio is inferred by symmetry with the observed image case.
