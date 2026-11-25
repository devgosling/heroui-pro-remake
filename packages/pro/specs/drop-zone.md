# Drop Zone — clean-room implementation spec

Slug: `drop-zone` · Docs: https://heroui.pro/docs/react/components/drop-zone · Category: Forms
Storybook title (remake): `Pro/Forms/DropZone`
Import (Pro): `import {DropZone} from "@heroui-pro/react";` (root export; no heavy peer in the remake)

Sources used: public docs text, the rendered DOM / CSSOM / computed styles of the 9 public demo
pages (light + dark), runtime probing (synthetic drag events with a fake `DataTransfer`, file input
`change` events, pointer presses, keyboard Tab, `getAnimations()` and per-frame sampling of styles),
and the OSS sources in this repo (`packages/react`, `packages/styles`, react-aria-components 1.22).
The paywalled example source was not opened.

---

## 1. Purpose

A drag-and-drop file upload area. It filters file types and size limits and shows a list of the
selected files. The area is a React Aria (RAC) `DropZone`. A hidden native `<input type="file">`
is opened by a browse trigger. An optional file list shows one row per file with a format badge,
name, meta text, an optional progress bar, and retry and remove buttons.

---

## 2. Anatomy (docs)

```tsx
<DropZone>
  <DropZone.Area>
    <DropZone.Icon />
    <DropZone.Label>Drag files here or click to browse</DropZone.Label>
    <DropZone.Description>PDF, DOCX, PNG, or JPG up to 10 MB.</DropZone.Description>
    <DropZone.Trigger>Select files</DropZone.Trigger>
  </DropZone.Area>
  <DropZone.Input />
  <DropZone.FileList>            {/* optional */}
    <DropZone.FileItem>
      <DropZone.FileFormatIcon />
      <DropZone.FileInfo>
        <DropZone.FileName>Proposal.pdf</DropZone.FileName>
        <DropZone.FileMeta>2.4 MB</DropZone.FileMeta>
      </DropZone.FileInfo>
      <DropZone.FileProgress>      {/* optional, while uploading */}
        <DropZone.FileProgressTrack><DropZone.FileProgressFill /></DropZone.FileProgressTrack>
      </DropZone.FileProgress>
      <DropZone.FileRetryTrigger />  {/* optional, failed uploads */}
      <DropZone.FileRemoveTrigger />
    </DropZone.FileItem>
  </DropZone.FileList>
</DropZone>
```

In every demo, `FileProgress` is rendered **inside** `FileInfo`, after the meta. The anatomy
snippet shows it as a sibling of `FileInfo`. The demos are the source of truth for layout.

### Rendered DOM (default demo, light)

```html
<div class="drop-zone w-[420px]" data-slot="drop-zone">
  <div data-slot="drop-zone-area" class="drop-zone__area" data-rac>
    <div style="(VisuallyHidden)"><button type="button" aria-label="DropZone" aria-labelledby="<self> <labelId>"/></div>
    <span class="drop-zone__icon" data-slot="drop-zone-icon"><svg 16x16 (cloud-arrow-up-in)/></span>
    <span class="drop-zone__label" id="<labelId>" slot="label" data-slot="drop-zone-label">…</span>
    <span class="drop-zone__description" data-slot="drop-zone-description">…</span>
    <button data-slot="drop-zone-trigger" class="drop-zone__trigger" data-rac type="button">Select File</button>
  </div>
  <input class="drop-zone__input" data-slot="drop-zone-input" tabindex="-1" type="file" [multiple] [accept]>
  <div class="drop-zone__file-list" data-slot="drop-zone-file-list">
    <div class="drop-zone__file-item" data-slot="drop-zone-file-item" data-status="complete" style="opacity:1;transform:none">
      <svg aria-hidden="true" class="drop-zone__file-format-icon" data-slot="drop-zone-file-format-icon" width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path d="(sheet)" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.5"/>
        <path d="(fold)" fill="none" stroke="var(--color-border)" stroke-width="1.5"/>
        <foreignObject x="0" y="0" width="32" height="40">
          <div class="drop-zone__file-format-icon-badge" data-color="red" data-slot="drop-zone-file-format-icon-badge">PDF</div>
        </foreignObject>
      </svg>
      <div class="drop-zone__file-info" data-slot="drop-zone-file-info">
        <span class="drop-zone__file-name" data-slot="drop-zone-file-name">Annual report 2025.pdf</span>
        <span class="drop-zone__file-meta" data-slot="drop-zone-file-meta">2.2 MB<div class="flex items-center gap-1"> | <svg class="text-success inline size-3"/> Complete</div></span>
        <div data-slot="drop-zone-file-progress" class="progress-bar progress-bar--accent progress-bar--sm drop-zone__file-progress"
             role="progressbar" aria-label="Upload progress" aria-valuenow="100" …>
          <div class="progress-bar__track" data-slot="drop-zone-file-progress-track">
            <div class="progress-bar__fill" data-slot="drop-zone-file-progress-fill" style="width:100%"></div>
          </div>
        </div>
      </div>
      <button data-slot="drop-zone-file-remove-trigger" class="drop-zone__file-remove-trigger" aria-label="Remove Annual report 2025.pdf"><svg 16x16 (trash-bin)/></button>
    </div>
  </div>
</div>
```

| Part | Element | `data-slot` | BEM class | Primitive / OSS reuse |
|---|---|---|---|---|
| `DropZone` | `div` (overridable with `render`) | `drop-zone` | `drop-zone` | plain DOM. Provides context with the input ref and `openFilePicker` |
| `DropZone.Area` | `div` + RAC visually hidden drop button | `drop-zone-area` | `drop-zone__area` | RAC `DropZone` (`data-hovered`, `data-focused`, `data-focus-visible`, `data-drop-target`, `data-disabled`) |
| `DropZone.Icon` | `span` | `drop-zone-icon` | `drop-zone__icon` | default glyph: Gravity UI `cloud-arrow-up-in` (16x16 viewBox, CSS sizes it to 32px) |
| `DropZone.Label` | `span slot="label"` | `drop-zone-label` | `drop-zone__label` | RAC `Text`. The RAC DropZone `TextContext` gives it the id that labels the hidden drop button |
| `DropZone.Description` | `span` | `drop-zone-description` | `drop-zone__description` | plain span (not RAC Text) |
| `DropZone.Input` | `input type=file tabindex=-1` | `drop-zone-input` | `drop-zone__input` | native input, visually hidden (`sr-only`) |
| `DropZone.Trigger` | `button` | `drop-zone-trigger` | `drop-zone__trigger` | RAC `Button`. Own BEM styles that copy the OSS outline button. **Not** the OSS `.button` class |
| `DropZone.FileList` | `div` | `drop-zone-file-list` | `drop-zone__file-list` | Pro: Motion `AnimatePresence` |
| `DropZone.FileItem` | `div` with `data-status` | `drop-zone-file-item` | `drop-zone__file-item` | Pro: `motion.div` (`initial`/`animate`/`exit`/`layout`) |
| `DropZone.FileFormatIcon` | `svg 32x40` + `foreignObject` badge | `drop-zone-file-format-icon`, badge `drop-zone-file-format-icon-badge` | `drop-zone__file-format-icon`, `drop-zone__file-format-icon-badge` | own SVG; `data-color` on the badge |
| `DropZone.FileInfo` | `div` | `drop-zone-file-info` | `drop-zone__file-info` | |
| `DropZone.FileName` | `span` | `drop-zone-file-name` | `drop-zone__file-name` | |
| `DropZone.FileMeta` | `span` | `drop-zone-file-meta` | `drop-zone__file-meta` | |
| `DropZone.FileProgress` | OSS ProgressBar root | `drop-zone-file-progress` | `progress-bar progress-bar--accent progress-bar--sm drop-zone__file-progress` | **OSS `ProgressBar`** (size `sm`, default `aria-label="Upload progress"`) |
| `DropZone.FileProgressTrack` | `div` | `drop-zone-file-progress-track` | `progress-bar__track` | OSS `ProgressBar.Track` |
| `DropZone.FileProgressFill` | `div style="width:N%"` | `drop-zone-file-progress-fill` | `progress-bar__fill` | OSS `ProgressBar.Fill` |
| `DropZone.FileRetryTrigger` | `button` | `drop-zone-file-retry-trigger` (remake) | `drop-zone__file-retry-trigger` | RAC `Button` (no demo uses it) |
| `DropZone.FileRemoveTrigger` | `button` | `drop-zone-file-remove-trigger` | `drop-zone__file-remove-trigger` | RAC `Button`; default glyph Gravity UI `trash-bin` |

---

## 3. API (docs)

| Part | Prop | Type | Default | Notes |
|---|---|---|---|---|
| `DropZone` | `children` | `ReactNode` | – | |
| | `className` | `string` | – | |
| | `render` | `DOMRenderFunction` | – | override the `div` (OSS `dom.div` helper) |
| | …native `div` attributes | | | |
| `DropZone.Area` | all RAC `DropZone` props | | | `onDrop`, `getDropOperation`, `isDisabled`, `onDropEnter`… |
| `DropZone.Icon` | `children` | `ReactNode` | cloud upload icon | |
| `DropZone.Label` | RAC `Text` props | | | `slot="label"` |
| `DropZone.Description` | span props | | | |
| `DropZone.Input` | `accept` | `string` | – | e.g. `"image/*,.pdf"` |
| | `multiple` | `boolean` | – | |
| | `onSelect` | `(files: FileList) => void` | – | called on input `change` |
| `DropZone.Trigger` | RAC `Button` props | | children `"Select files"` | opens the picker |
| `DropZone.FileList` | div props | | | animated container |
| `DropZone.FileItem` | `status` | `'uploading' \| 'complete' \| 'failed'` | – | → `data-status` |
| `DropZone.FileFormatIcon` | `format` | `string` | – | badge text (CSS uppercases it) |
| | `color` | `string` | `'gray'` | → badge `data-color` (`red`, `green`, `blue`, `orange`, `purple`, `gray` are styled) |
| `DropZone.FileInfo` / `FileName` / `FileMeta` | element props | | | |
| `DropZone.FileProgress` | `size` | `string` | `'sm'` | plus all OSS `ProgressBar` props (`value`, `color`, …) |
| `DropZone.FileProgressTrack` / `FileProgressFill` | | | | wrap `ProgressBar.Track` / `.Fill` |
| `DropZone.FileRetryTrigger` / `FileRemoveTrigger` | RAC `Button` props | | | |

Data attributes (docs): `[data-drop-target="true"]`, `[data-focus-visible="true"]`, `[data-disabled="true"]`
on `.drop-zone__area`; `[data-status]` on `.drop-zone__file-item`.
CSS variable (found in CSSOM, not in docs): `--drop-zone-border-style: dashed` on `.drop-zone`.

Remake decisions for behaviour the docs leave open:
- `Trigger` → `inputRef.current.value = ""; inputRef.current.click()`. The value reset copies RAC `FileTrigger`, so picking the same file again still fires `change`.
- Area `isDisabled` reaches `Trigger` through context. In the Pro disabled demo the trigger has `disabled` + `data-disabled="true"`, which gives 0.5 × 0.5 effective opacity. An explicit `isDisabled` on the trigger wins.
- `Input` merges a user `ref`. Custom triggers can call `ref.current.click()`. `DropZoneContext` (with `openFilePicker`) is exported too.
- Defaults: Trigger children `"Select files"`, FileProgress `aria-label="Upload progress"` (seen in every demo), FileRemoveTrigger `aria-label="Remove file"` (the demos pass `Remove <name>`), FileRetryTrigger children `"Retry"`.
- The Area does **not** filter by the input's `accept`. Image-only filtering in the Pro demo needs `getDropOperation`: a PDF drag gave no `data-drop-target` and `dropEffect: none`, while a PNG drag gave `copy`.
- Clicking the empty area does not open the picker. It only focuses the hidden drop button (RAC behaviour, same in Pro).

---

## 4. Styling (all in `@layer components`; tokens only, except the badge palette)

| Selector | Declarations (Tailwind shorthand) | Measured (light, Pro) |
|---|---|---|
| `.drop-zone` | `flex flex-col gap-3`; `--drop-zone-border-style: dashed` | |
| `.drop-zone__input` | `sr-only` (absolute, 1px, clip-path inset 50%) | |
| `.drop-zone__area` | `flex flex-col items-center justify-center gap-2 rounded-2xl` (`calc(var(--radius)*2)`) `border` with `border-style: var(--drop-zone-border-style)`, `border-border-secondary px-6 py-8 text-center outline-none forced-color-adjust-none`; `transition: background-color .15s, border-color .15s` + motion-reduce none | area 202px tall with a 40px trigger (<768px viewport), 198px with 36px |
| `.drop-zone__area[data-drop-target]` | `bg-accent-soft border-accent` (style stays dashed) | light bg = accent 15%, dark = accent 12% (token) |
| `.drop-zone__area[data-focus-visible]` | focus ring (`status-focused`: 2px focus ring + 2px background offset) | |
| `.drop-zone__area[data-disabled]` | `status-disabled` (opacity `--disabled-opacity` .5, cursor disabled, no pointer events) | |
| `.drop-zone__icon` | `flex items-center justify-center text-muted`; `svg { size-8 }` | 32×32 |
| `.drop-zone__label` | `text-sm font-medium text-foreground` | 14/20 500 |
| `.drop-zone__description` | `text-xs text-muted` | 12/16 400 |
| `.drop-zone__trigger` | `relative isolate mt-1 inline-flex h-10 md:h-9 items-center justify-center gap-2 rounded-3xl border border-border px-4 text-sm font-medium whitespace-nowrap select-none outline-none no-highlight`; cursor interactive; `--button-bg: transparent; --button-bg-hover: default 60% (color-mix srgb); --button-bg-pressed: default; --button-fg: default-foreground`; transition transform .25s ease-smooth, bg .1s ease-out, box-shadow .1s ease-out; `transform-gpu`; hover (media hover) bg hover; `:active/[data-pressed]` bg pressed + `scale(.97)`; focus ring; disabled; `[data-pending]` no pointer events; svg `size-5 -mx-0.5 my-0.5`, `sm:size-4 sm:my-1` | 103×40 "Select File" |
| `.drop-zone__file-list` | `flex flex-col gap-2` | |
| `.drop-zone__file-item` | `relative flex items-start gap-3 rounded-2xl border border-border p-3`; `transition: border-color .15s` + motion-reduce | 78px with progress, 66px without |
| `.drop-zone__file-item[data-status="failed"]` | `border-danger/30` | |
| `.drop-zone__file-format-icon` | `relative shrink-0 w-[32px] h-[40px]` | |
| `.drop-zone__file-format-icon-badge` | `absolute bottom-1 left-0 flex items-center h-3.5 max-w-[32px] overflow-hidden px-[3px] py-0.5 rounded-[.25rem] text-[8px] leading-none font-bold uppercase text-white whitespace-nowrap` | "PDF" 21.66×14, "DOCX" 29.66×14 |
| `…badge[data-color=red/green/blue/orange/purple/gray]` | `bg-{color}-500` (Tailwind palette, literal in Pro too) | |
| `.drop-zone__file-info` | `flex min-w-0 flex-1 flex-col gap-0.5` | |
| `.drop-zone__file-name` | `truncate text-sm font-medium text-foreground` | |
| `.drop-zone__file-meta` | `flex items-center gap-1 text-xs text-muted` | |
| `.drop-zone__file-progress` | `mt-1 w-full` (OSS sm progress: 4px track after an empty 4px grid row) | 8px tall |
| `.drop-zone__file-item[data-status=complete] .drop-zone__file-progress .progress-bar__fill` | `--progress-bar-fill: var(--success)` | green fill |
| `…[data-status=failed] … .progress-bar__fill` | `--progress-bar-fill: var(--danger)` | |
| `.drop-zone__file-retry-trigger` | `mt-0.5 bg-transparent p-0 text-xs font-medium text-danger outline-none no-highlight`; cursor interactive; hover underline; focus ring | |
| `.drop-zone__file-remove-trigger` | `flex shrink-0 items-center justify-center rounded-md p-1 text-muted outline-none no-highlight`; cursor; `transition: color .15s` + motion-reduce; `svg size-4`; hover / pressed `text-foreground`; focus ring; disabled | 24×24, radius 6px |

File sheet artwork: a 32×40 viewBox. The sheet runs from (2.75, .75) to (31.25, 39.25) with
about 5.25 rounded corners and a 45° dog-ear at the top-right (top edge to x≈17.5, right edge
from y≈14.5). The fold line runs from (19, 1) down to y=8 with a 4-unit rounded corner, then to
(31, 12). Fill `var(--color-surface)`, stroke `var(--color-border)`, 1.5px. The remake draws
its own path with arcs.

Dark mode: every colour comes from a token: `--border-secondary` (dashed area), `--border`,
`--surface` (sheet fill), `--muted`, `--foreground`, `--accent-soft` (12% in dark),
`--danger`, `--success`. The badge palette and white badge text are the same in both themes.

---

## 5. Behaviour and motion (measured)

- Drag over: RAC sets `data-drop-target="true"` only when `getDropOperation` (default `copy`)
  allows the drag. A synthetic drag of an `image/png` file over the image-only demo turned the
  area accent. An `application/pdf` drag did not.
- Drop: `onDrop` receives RAC `DropEvent`. The demos read `item.getFile()` for file items and
  add them to their list (max-size demo appends; multiple-files demo prepends).
- Keyboard: Tab focuses the hidden drop button, and the area gets `data-focus-visible`. Paste on that
  button calls `onDrop` (RAC). The trigger is the next tab stop.
- File list motion (Pro uses Motion; the remake reproduces it with WAAPI):
  - enter (items added after the list mounted): `opacity 0→1` (WAAPI 300ms `ease-out`) and
    `translateY(-8px)→none` (same duration and curve). Items present at mount are rendered static
    (`style="opacity:1;transform:none"`).
  - exit: `opacity 1→0`, 200ms `ease-out`. The item keeps its space until it is removed.
  - layout: items whose box changed (position **or size**) are animated from their old box with
    a spring. Pro writes `transform: translate3d(dx, dy, 0) scale(sx, sy)` (origin 50% 50%) and
    springs it back to identity; the content is scaled with the box. Examples:
    - multiple-files demo, an upload completes and its progress bar is removed (78px → 66px):
      the item starts at `translate(0, 6px) scale(1, 1.18182)`, the item below at
      `translate(0, 12px)`. Normalised samples every 33ms: 1, .9707, .7253, .4462, .2316, .1044,
      .0371, .0061, −.0044, −.0063.
    - max-size demo, error line removed + item added (page re-centres, 52.75px move): peak
      overshoot −0.33px at about 282ms.
    Both series fit damping ratio 0.85 with the oscillation envelope down to 0.1% after 400ms,
    i.e. ωn ≈ 21.7 rad/s (residual 4e-5 on the first series; the earlier guess ωn = 20.9 rad/s
    had a 10x larger residual). The remake samples this spring into 48 linear WAAPI keyframes
    over 400ms on the individual `translate` / `scale` properties.
  - The layout boxes are measured right before each commit of the list (class
    `getSnapshotBeforeUpdate`) and right after it, so layout changes that happen between list
    renders (resize, content above the list) do not cause stale glides.
- Upload simulation (demo-only): progress grows in random steps about every 400ms. In the multiple-files
  demo the progress bar is removed when the upload completes, and the meta shows `| 100%`.

---

## 6. Demos → stories

| Pro demo | URL | Remake story id |
|---|---|---|
| Default | `/docs/react/demos/drop-zone-default` | `pro-forms-dropzone--default` |
| With File List | `…/drop-zone-with-file-list` | `pro-forms-dropzone--with-file-list` |
| Compact File List | `…/drop-zone-compact-file-list` | `pro-forms-dropzone--compact-file-list` |
| Image Only | `…/drop-zone-image-only` | `pro-forms-dropzone--image-only` |
| Max Size Limit | `…/drop-zone-max-size-limit` | `pro-forms-dropzone--max-size-limit` |
| Multiple Files | `…/drop-zone-multiple-files` | `pro-forms-dropzone--multiple-files` |
| Disabled | `…/drop-zone-disabled` | `pro-forms-dropzone--disabled` |
| Custom Icon | `…/drop-zone-custom-icon` | `pro-forms-dropzone--custom-icon` |
| Custom Triggers | `…/drop-zone-custom-triggers` | `pro-forms-dropzone--custom-triggers` |

Demo structures:
- **Default**: `w-[420px]`; area + input (no list).
- **With File List**: `w-[480px]`; `multiple` input; 3 items: complete (100% progress, meta `size | ✓ Complete`),
  uploading (42%, meta `size | Uploading...`), failed (meta `size | ✕ Failed`, no progress, OSS
  `Button size="sm" variant="danger-soft" className="mt-2 -ml-1"` "Try again").
- **Compact File List**: list only; meta `size | <icon> N%` inline (`size-3 align-[-1px]`), failed
  item with a second meta line + "Try again" button; no progress bars.
- **Image Only**: custom picture icon, `accept="image/*"`, image-only `getDropOperation`.
- **Max Size Limit**: `multiple`; files over 5 MB are rejected into `<p class="text-danger m-0 text-[13px]">`
  rendered between the input and the list; accepted items show only their size.
- **Multiple Files**: list appears after the first add; newest first; uploading → complete.
- **Disabled**: `Area isDisabled`.
- **Custom Icon**: `DropZone.Icon` with a custom glyph, `accept="image/png,image/jpeg"`.
- **Custom Triggers**: `flex w-[480px] flex-col gap-8` with three zones: OSS `Button` (primary, md,
  icon + text, `mt-2`), OSS `Link` (`mt-1 cursor-pointer text-sm`, custom paperclip icon), OSS
  `Button size="sm" variant="secondary"` (`mt-2`, `accept=".csv,.xlsx"`). Each opens its own input.
  The OSS "Try again" button in the file list demo does **not** open the picker, so the root does not
  provide a `ButtonContext`.

Verification (remake vs Pro, same viewport): area heights 202/182/206 in custom triggers, compact
item heights 66/66/128, item 78px with progress, badge widths, meta offsets, progress geometry,
remove trigger 24×24, focus ring, drop-target colours, disabled opacity, enter/exit/spring
timings. All match. Colour values differ only where the Storybook theme tokens differ from the
heroui.pro theme (for example `--border` oklch vs lab).

---

## 7. Dependencies

- OSS: `ProgressBar` (+ `.Track`, `.Fill`), `dom` render helper (`@heroui/react`).
- RAC: `DropZone`, `Text`, `Button`.
- No new packages. Pro uses `motion` (`AnimatePresence`, `layout`). The remake does the same
  enter/exit/layout motion with its own Web Animations API code, because `motion` is not a
  dependency of `@heroui/pro`.
- Icons: Gravity UI `cloud-arrow-up-in` and `trash-bin` are inlined (MIT, attribution in
  `drop-zone-icons.tsx`).

## 8. Deviations

- Motion is replaced by an own presence + FLIP implementation with the same timings. Position and
  size changes are both animated (translate + scale from the centre, like Motion `layout`).
  Not reproduced: Motion's per-frame scale correction of `style.borderRadius` (Pro does not set an
  inline radius, so the corners scale with the box in Pro too).
- The remake honours `prefers-reduced-motion` / `[data-reduce-motion="true"]` for the list animations.
  Motion's default `reducedMotion: "never"` does not.
- The sheet outline path is redrawn (same geometry, arcs instead of the original curve data).
- The default icons carry `aria-hidden="true" focusable="false"`.

---

## Appendix A — CSSOM reference (condensed from the demo page, `@layer components`)

```
.drop-zone { gap: 3sp; --drop-zone-border-style: dashed; flex-direction: column; display: flex }
.drop-zone__area { center/center; gap: 2sp; radius: radius*2; px 6sp; py 8sp; text-align center;
  border: 1px var(--drop-zone-border-style) var(--color-border-secondary); forced-color-adjust none;
  outline none; transition: background-color .15s, border-color .15s } (+ motion-reduce none)
.drop-zone__area[data-drop-target] { background: var(--accent-soft); border-color: var(--color-accent) }
.drop-zone__area[data-focus-visible] { focus ring }   .drop-zone__area[data-disabled] { status-disabled }
.drop-zone__icon { color: muted; flex center }  .drop-zone__icon svg { 8sp × 8sp }
.drop-zone__label { text-sm, medium, foreground }   .drop-zone__description { text-xs, muted }
.drop-zone__trigger { isolate; mt 1sp; h 10sp (md: 9sp); inline-flex center; gap 2sp; radius radius*3;
  border 1px var(--border); px 4sp; text-sm medium; nowrap; select none; button-bg vars (transparent /
  default 60% srgb / default / default-foreground); transition transform .25s ease-smooth,
  bg .1s ease-out, box-shadow .1s ease-out; translateZ(0); hover/active(scale .97)/focus/disabled/pending;
  svg 5sp (sm: 4sp) -mx .5sp my .5sp (sm: my 1sp) }
.drop-zone__input { sr-only }
.drop-zone__file-list { gap 2sp; column }
.drop-zone__file-item { flex-start; gap 3sp; radius radius*2; border 1px var(--color-border); p 3sp;
  transition border-color .15s; relative }  [data-status=failed] { border: danger 30% (oklab) }
.drop-zone__file-format-icon { shrink 0; 32px × 40px; relative }
.drop-zone__file-format-icon-badge { bottom 1sp; h 3.5sp; px 3px; py .5sp; 8px/1 bold uppercase white;
  nowrap; radius .25rem; flex center-y; max-w 32px; absolute; left 0; overflow hidden }
  [data-color=red|green|blue|orange|purple|gray] { background: var(--color-<c>-500) }
.drop-zone__file-info { gap .5sp; column; flex 1 1 0%; min-w 0 }
.drop-zone__file-name { ellipsis; nowrap; text-sm medium foreground; overflow hidden }
.drop-zone__file-meta { center-y; gap 1sp; text-xs; muted; flex }
.drop-zone__file-progress { mt 1sp; w 100% }
.drop-zone__file-item[data-status=complete|failed] .drop-zone__file-progress .progress-bar__fill
  { --progress-bar-fill: var(--success|--danger) }
.drop-zone__file-retry-trigger { mt .5sp; text-xs medium danger; outline none; tap none; cursor
  interactive; bg transparent; p 0 } hover underline; focus ring
.drop-zone__file-remove-trigger { radius radius*.75; p 1sp; muted; outline none; cursor; shrink 0;
  flex center; transition color .15s } svg 4sp; hover/pressed foreground; focus ring; disabled
```
No `@keyframes` belong to the component. Its animations are inline Motion / WAAPI.
