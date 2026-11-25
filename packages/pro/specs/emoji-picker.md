# Emoji Picker - clean-room implementation spec

Slug: `emoji-picker` · Docs: https://heroui.pro/docs/react/components/emoji-picker · Category: Overlays
Storybook title (ours): `Pro/Overlays/EmojiPicker`

Sources used: the public docs page text, the rendered DOM of the four public demo pages (light and
dark), their CSSOM (the public stylesheet), computed styles, and runtime probing (clicks, keyboard,
scroll positions, virtualizer layout, search results). I also observed the public network activity:
no data request is made, the emoji data ships inside the JS bundle. I did not open the paywalled
example code, JS chunks or source maps.

---

## 1. Purpose

A searchable emoji picker. It is a RAC `Select` whose popover holds a RAC `Autocomplete`
(OSS `SearchField` + virtualized RAC `ListBox` laid out with `GridLayout`), with category
navigation in a footer, a skin tone selector inside the search field, and recent emoji tracking.

---

## 2. Anatomy (from docs)

```tsx
<EmojiPicker>                         // RAC Select  (div.react-aria-Select[data-slot=emoji-picker])
  <EmojiPicker.Trigger>               // RAC Button  (.emoji-picker__trigger)
    <EmojiPicker.Value />             // RAC SelectValue (.emoji-picker__value)
  </EmojiPicker.Trigger>
  <EmojiPicker.Popover>               // RAC Popover (.emoji-picker__popover --sm|--md|--lg)
    <EmojiPicker.Content>             // div.emoji-picker__content + RAC Autocomplete + OSS SearchField
      <EmojiPicker.SkinTonePicker>    // optional; rendered INSIDE the search field group
        <EmojiPicker.SkinToneTrigger />   // RAC Button .emoji-picker__skin-tone-picker
        <EmojiPicker.SkinToneContent>     // OSS Popover.Content (.popover) + Popover.Dialog
          <EmojiPicker.SkinToneOption id="default" />  // plain <button>
        </EmojiPicker.SkinToneContent>
      </EmojiPicker.SkinTonePicker>
      <EmojiPicker.Grid>              // RAC Virtualizer(GridLayout) + RAC ListBox layout="grid"
        <EmojiPicker.Item />          // RAC ListBoxItem
      </EmojiPicker.Grid>
      <EmojiPicker.Footer />          // optional div, absolutely positioned at the bottom
    </EmojiPicker.Content>
  </EmojiPicker.Popover>
</EmojiPicker>
```

### Rendered DOM (default demo, popover open)

```html
<div data-slot="emoji-picker" class="react-aria-Select" data-rac>           <!-- no BEM class -->
  <button data-slot="emoji-picker-trigger" class="emoji-picker__trigger text-xl" aria-haspopup="listbox" ...>
    <span data-slot="emoji-picker-value" class="emoji-picker__value">😀</span>
  </button>
</div>
<!-- portal -->
<div data-slot="emoji-picker-popover" class="emoji-picker__popover emoji-picker__popover--md"
     role="dialog" data-trigger="Select" data-placement="bottom" style="position:absolute; max-height:…">
  <div class="emoji-picker__content" data-slot="emoji-picker-content">
    <div data-slot="search-field" class="search-field search-field--secondary">
      <div class="search-field__group" role="group">
        <svg class="search-field__search-icon" .../>
        <input aria-label="Search emoji" placeholder="Search emoji..." type="search"
               aria-controls="<grid id>" aria-activedescendant="<grid id>-option-😀" class="search-field__input"/>
        <button data-slot="emoji-picker-skin-tone-picker" class="emoji-picker__skin-tone-picker mr-1"
                aria-expanded="false" aria-label="Select skin tone">✋</button>
      </div>
    </div>
    <span data-focus-scope-start hidden></span>                <!-- RAC ListBox FocusScope -->
    <div data-slot="emoji-picker-grid" class="emoji-picker__grid" role="listbox" aria-label="Emoji grid"
         data-layout="grid" data-orientation="vertical">
      <div role="presentation" style="width:254px;height:12200px;position:relative">
        <div role="presentation" style="position:absolute;top:2px;left:6px;width:36px;height:36px;contain:size layout style">
          <div data-slot="emoji-picker-item" class="emoji-picker__item emoji-picker__item--md" role="option"
               data-key="😀" aria-setsize="1923" data-selected data-focused>😀</div>
        </div> …
      </div>
    </div>
    <span data-focus-scope-end hidden></span>
    <div class="emoji-picker__footer" data-slot="emoji-picker-footer"> … demo content … </div>
  </div>
</div>
```

* Keys of the items are the emoji themselves (`data-key="😀"`); with a skin tone the keys become the
  toned emoji (`data-key="👋🏽"`).
* The `data-slot` of the root is `emoji-picker`; the root keeps RAC's default class `react-aria-Select`.
* The empty state: `<div role="option" style="display:contents"><div class="emoji-picker__empty"
  data-slot="emoji-picker-empty"><div class="empty-state flex h-full min-h-20 flex-1 flex-col items-center
  justify-center gap-2" data-slot="empty-state"><svg class="text-muted size-5">(magnifier)</svg>No emoji
  found.</div></div></div>` (OSS EmptyState).
* Skin tone popover: `<div class="popover" data-trigger="DialogTrigger" data-placement="bottom">` >
  `<section class="popover__dialog emoji-picker__skin-tone-options" data-slot="emoji-picker-skin-tone-options"
  aria-label="Skin tone" role="dialog">` > six `<button type="button" aria-label="Default|Light|Medium-Light|
  Medium|Medium-Dark|Dark" aria-pressed class="emoji-picker__skin-tone-option" data-selected
  data-slot="emoji-picker-skin-tone-option">✋…✋🏿</button>` (plain buttons, no `data-rac`).

---

## 3. API (docs)

| Part | Props (docs) | Notes |
|---|---|---|
| `EmojiPicker` | `size: "sm" \| "md" \| "lg"` (default `"md"`) + all RAC `Select` props | root provider |
| `EmojiPicker.Trigger` | all RAC `Button` props | |
| `EmojiPicker.Value` | all RAC `SelectValue` props | |
| `EmojiPicker.Popover` | `offset` (4), `placement` (`"bottom"`) + RAC `Popover` props | |
| `EmojiPicker.Content` | `filter: (textValue, inputValue) => boolean` (case-insensitive contains) | wraps an internal Autocomplete |
| `EmojiPicker.Grid` | `layoutOptions` (`{minItemSize?, maxItemSize?, minSpace?, preserveAspectRatio?}`, default 36×36 cells, 2×2 spacing), `renderEmptyState: () => ReactNode` + RAC `ListBox` props except `layout` | RAC Virtualizer + GridLayout |
| `EmojiPicker.Item` | all RAC `ListBoxItem` props | |
| `EmojiPicker.Footer` | native `div` | |
| `EmojiPicker.SkinTonePicker` | `value`, `defaultValue` (`"default"`), `onChange(value: string)` | manages a Popover internally |
| `EmojiPicker.SkinToneTrigger` | `tones: EmojiSkinToneItem[]` (`EMOJI_SKIN_TONES`), `aria-label` (`"Select skin tone"`) | |
| `EmojiPicker.SkinToneContent` | `offset` (4), `placement` (`"bottom end"`) | |
| `EmojiPicker.SkinToneOption` | `id: string` (required) | |

Exports named by the docs: `EMOJI_SKIN_TONES`, type `EmojiSkinToneItem`.

### Our additions (documented in the component)
* Grid without `items`/children renders the built-in dataset (9 categories, skin tone applied).
  Grid items are `EmojiPickerGridItem` (`id`, `emoji`, `textValue`, `category`, `data`).
* `Grid showRecent` (default `false`): prepends a "Frequently Used" row (keys `frequent:<emoji>`)
  with the recently picked emoji to the built-in dataset. Off by default because Pro's grid never
  shows one (verified live: after picking 😄 and 😉 and reopening, Pro still lists 1923 items
  starting with 😀, and its "Frequently Used" nav button does not scroll).
* `useEmojiPicker()` → `{scrollToCategory(id), scrollToKey(key), skinTone, setSkinTone, recent, clearRecent, size}`
  for custom parts such as the footer category navigation of the demos.
* `Content`: `searchLabel` ("Search emoji") and `searchPlaceholder` ("Search emoji...") for i18n.
* `SkinTonePicker` also accepts `DialogTrigger` props (`isOpen`, `defaultOpen`, `onOpenChange`).
* Data exports: `EMOJIS`, `EMOJI_CATEGORIES`, `EMOJI_RECENT_CATEGORY`, `EMOJI_RECENT_LIMIT`,
  `EMOJI_SKIN_TONES`, `EMOJI_DATA_VERSION`, `applySkinTone`, `stripSkinTone`, `getEmoji`, `getEmojiTextValue`.

---

## 4. Data (observed)

* No network request: the dataset is bundled (Performance resource entries only show JS/CSS).
* 1923 items = Unicode **Emoji 17.0** fully-qualified emoji (1914) + the 9 `Component` entries
  (5 skin tone swatches 🏻…🏿 and 4 hair components 🦰🦱🦳🦲) listed at the end of People & Body.
  Order is exactly `emoji-test.txt` order (verified with a hash over all 1923 keys, FE0F ignored).
  Pro's keys carry an extra U+FE0F on 517 entries (emojibase style, e.g. `😐️`, `👍️`); ours use the
  RGI fully-qualified sequences.
* Search text = CLDR name + CLDR English annotation keywords. Verified counts with the default
  contains filter: `happy` 27 (identical list), `cat` 51, `love` 40, `man` 245 - identical with
  CLDR 48 annotations + annotationsDerived.
* Category order in the grid: Smileys & Emotion, People & Body, Animals & Nature, Food & Drink,
  Travel & Places, Activities, Objects, Symbols, Flags. The demo footer lists Activities before
  Travel & Places (nav order only).
* Skin tones: `EMOJI_SKIN_TONES` ids `default, light, medium-light, medium, medium-dark, dark`,
  swatches ✋ ✋🏻 ✋🏼 ✋🏽 ✋🏾 ✋🏿, labels "Default", "Light", "Medium-Light", "Medium", "Medium-Dark", "Dark".
  Applying a tone replaces every item key/glyph with the toned sequence (`👋` → `👋🏽`).
* Recents: after picking 😄 and reopening, Pro's demo grid still has 1923 items and the
  "Frequently Used" nav button does nothing (no recent row, nothing in local/session storage).

Our dataset: `emoji-picker.data.ts` generated from Unicode `emoji-test.txt` 17.0 and CLDR 48
`annotations/en.xml` + `annotationsDerived/en.xml` (Unicode License v3). ~89 KB source.
Skin tone sequences are derived at runtime (`applySkinTone`): the modifier is inserted after every
`Emoji_Modifier_Base` code point (dropping a following VS16), except the handshake inside a
multi-person sequence; verified against all 1650 uniform-tone RGI sequences of emoji-test 17.0.

---

## 5. Styling (CSSOM, all in `@layer components`)

| Class | Rules | Ours |
|---|---|---|
| `.emoji-picker__trigger` | `outline:none; tap-highlight transparent; transform: translateZ(0); transition: transform .25s var(--ease-out-quart), background-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out)`; motion-reduce none; `cursor: var(--cursor-interactive)`; focus ring (`status-focused`); disabled (`status-disabled`); `:active,[data-pressed=true] → scale(.97)` | same |
| `.emoji-picker__value` | `line-height: 1` | `leading-none` |
| `.emoji-picker__popover` | `rounded-2xl` (calc(var(--radius)*2) = 16px), `bg-overlay`, `shadow-overlay`, `outline-none`, `box-sizing:border-box`, `flex flex-col overflow-hidden`; `[data-entering]`: tw-animate `enter` fade-in + zoom-in-95, 150ms `--ease-out`; `[data-exiting]`: fade-out + zoom-out-95, 100ms; `will-change: opacity, transform`; motion-reduce `animation:none` | OSS `heroui-overlay-enter-95` / `heroui-overlay-exit` keyframes (same opacity/scale, no filter) |
| `--sm/--md/--lg` | 240×280 / 280×350 / 320×420 px | same |
| `.emoji-picker__content` | `flex flex-1 flex-col gap-1.5 overflow-hidden p-2` | same + `min-w-0` on the search input, `me-1` on the skin tone trigger |
| `.emoji-picker__grid` | `scrollbar` utility, `flex-1 overflow-auto pt-1 outline-none`, `scroll-padding:4px`, `-webkit-overflow-scrolling:touch`; `:has(~[data-slot=emoji-picker-footer]) → pb-10` | same |
| `.emoji-picker__item` | `flex size-full items-center justify-center rounded-lg (8px) outline-none`, cursor interactive; hover (media hover) and `[data-focused]` → `bg-default`; `[data-pressed]`, `[data-selected]` → `bg-default-hover`; focus-visible ring; disabled | same |
| `.emoji-picker__item--sm/md/lg` | font-size 20 / 24 / 28 px | same |
| `.emoji-picker__footer` | `absolute inset-x-0 bottom-0 flex w-full items-center gap-2 border-t border-border/50 bg-surface px-1 py-1.5 text-xs text-muted` | same |
| `.emoji-picker__empty` | `flex h-full flex-1 items-center justify-center py-6 text-center text-sm text-muted` | same (+ inner empty-state layout classes moved to CSS) |
| `.emoji-picker__skin-tone-options` | `flex items-center gap-0.5 p-1` (wins over `.popover__dialog` p-4) | same |
| `.emoji-picker__skin-tone-picker` | `size-6 rounded-md (6px) text-base leading-none flex shrink-0 items-center justify-center`, hover `bg-default`, focus ring, disabled | same |
| `.emoji-picker__skin-tone-option` | `rounded-2xl p-1 text-xl leading-none flex items-center justify-center`, hover `bg-default`, `[data-selected]` → `bg-default-hover`, focus ring, disabled | same |

Measured (md, light): popover 280×350 r16; content padding 8, gap 6; search group 264×36 r12
(`--default` bg, secondary SearchField); input `py-2 pe-3 ps-2`; grid 264 wide, `pt 4 / pb 40`;
items 36×36 r8 (focus-visible = 2px background offset + 2px `--focus` ring); footer 280×41,
`1px border-t color-mix(--border 50%)`, `--surface` bg; footer scroll shadow 272×28; nav buttons
24×24 r6 (OSS ghost icon-only Button + `size-6 rounded-md hover:bg-muted/20`), icon span `text-base`,
SVG icons 20×20. Skin tone popover 230.8×36 (r24 OSS popover), options 35.5×28 r16, 2px gap.
Dark mode only swaps tokens (`--overlay`, `--surface`, `--default`, `--border`, `--muted`).

Virtualizer (GridLayout, 36/36/2 options): `numColumns = floor(width / 38)`, horizontal spacing
`floor((width - cols*36) / (cols + 1))`, rows 38px apart starting at y=2. md grid width 254 (with a 10px
native scrollbar) → 6 columns at x = 6, 47, 88 …; content height `2 + ceil(n/6)*38` = 12200.
sm: 214 → 5 columns (x 7, 48 …), lg: 294 → 7 columns. Item height stays 36 whatever the
font-size (no measuring → `preserveAspectRatio: true`).

---

## 6. Behaviour

* Opening: popover at `offset` 4 below the trigger (flips when there is no room), RAC sets
  `max-height` from the viewport. Search input gets focus (`autoFocus`), the selected item is the
  virtual focus (`aria-activedescendant`), and the grid scrolls it into view. The inline demo does not
  steal focus on load.
* Picking an item (click / Enter): selects, closes, focus returns to the trigger; the trigger shows the
  new emoji. The trigger is `data-pressed` (scale .97) while the popover is open (RAC Select).
* Keyboard in the search input: arrows move virtual focus in 2D (rows of `numColumns`), Enter selects,
  Escape first clears a non-empty query, the next Escape closes; from an empty field the first
  Escape closes (re-checked with trusted key events in both: identical).
* Opening from the keyboard (Enter on the focused trigger): Pro leaves focus on the popover element
  (arrow keys do nothing until Tab moves into the search input); ours focuses the search input as
  on pointer open, so arrows/typing work at once. Kept on purpose (accessibility).
* Skin tone swatch picked with the pointer: focus goes to the search input (both). Picked with the
  keyboard (Enter on a focused swatch): focus returns to the skin tone trigger (both, RAC restore).
* Search: RAC Autocomplete `contains` (sensitivity base) over the item `textValue`; empty result renders
  the empty state.
* Footer category buttons: `excludeFromTabOrder` ghost buttons; pressing scrolls the grid smoothly to
  `row(firstItemOfCategory) * 38` (= layout rect y - 2): Animals → 3572, People → 1064, Travel → 5434.
* Skin tone: Tab from the input reaches the skin tone trigger; Enter/click opens the swatch popover
  (`bottom end`, offset 4, focus on the dialog); picking a swatch closes it, updates the trigger glyph
  (✋🏽) and the grid, and focus returns to the search input.

---

## 7. Demos → stories

| Pro demo | Story | Notes |
|---|---|---|
| `emoji-picker-default` | `Default` | trigger `text-xl`, popover with skin tone picker, grid, footer nav (🕐 Frequently Used + 9 categories with emoji icons) |
| `emoji-picker-sizes` | `Sizes` | sm / md / lg pickers with a small muted label above each (`flex items-end gap-4`) |
| `emoji-picker-inline` | `Inline` | `EmojiPicker` with a plain `div` using the popover classes + `relative` instead of Trigger/Popover |
| `emoji-picker-custom-categories` | `CustomCategories` | footer nav uses SVG icons (ours: gravity-ui) and no Frequently Used button |

Story ids: `pro-overlays-emojipicker--default`, `--sizes`, `--inline`, `--custom-categories`.

---

## 8. Dependencies

* `react-aria-components` (Select, SelectValue, Button, Popover, Autocomplete, ListBox, ListBoxItem,
  Virtualizer, GridLayout, Size), `react-aria/useFilter`, `react-aria/private/collections/Hidden`
  (`useIsHidden`, as used by OSS ComboBox/Autocomplete).
* `@heroui/react`: `SearchField` (secondary), `Popover` (skin tones), `EmptyState`, `IconSearch`;
  stories also use `Button`, `ScrollShadow`. No new library; the dataset is our own generated file.
* Root export: yes (no heavy optional peer).

---

## 9. Deviations

1. Keys/glyphs are RGI fully-qualified sequences (Pro adds U+FE0F to 517 keys, emojibase style).
2. Multi-person sequences get a uniform tone (`🧑🏽‍🤝‍🧑🏽`); Pro produces a mixed one (`🧑🏻‍🤝‍🧑🏽`).
3. Recent emoji are tracked in context (`useEmojiPicker().recent`); the built-in grid shows them only
   with the opt-in `showRecent` prop (default off, like Pro). With it, the row is refreshed when the
   picker opens and hidden while searching. `onChange`/`onSelectionChange` always receive the plain
   emoji.
4. The content clears the Button/Label/Text contexts of the Select, so in the inline layout the footer
   buttons do not inherit the Select trigger props (Pro's inline nav buttons get `aria-haspopup="listbox"`
   and the trigger id).
5. The search input may shrink (`min-w-0`) so the skin tone trigger stays visible on narrow
   viewports (Pro pushes it out of the field below the `sm` breakpoint).
6. Keyboard open focuses the search input (Pro leaves focus on the popover element; see §6).
7. `Value` falls back to the selected key when the selected emoji is not in the collection (for example
   after a skin tone change) instead of RAC's placeholder (Pro's trigger then reads "Select an item").

---

## Appendix A - Pro CSSOM (reference only; our CSS is authored separately)

```css
.emoji-picker__trigger{
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  transition:transform .25s var(--ease-out-quart), background-color .15s var(--ease-smooth), box-shadow .15s var(--ease-out);
  transform:translateZ(0) var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,);
  outline-style:none}
.emoji-picker__trigger:is([data-reduce-motion=true],[data-reduce-motion=true] *),.emoji-picker__trigger:is([data-reduce-motion=true],[data-reduce-motion=true] *):before,.emoji-picker__trigger:is([data-reduce-motion=true],[data-reduce-motion=true] *):after{
  transition-property:none}
@media (prefers-reduced-motion:reduce){
  .emoji-picker__trigger:not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)),.emoji-picker__trigger:not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)):before,.emoji-picker__trigger:not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)):after{
  transition-property:none}
}
.emoji-picker__trigger{
  cursor:var(--cursor-interactive)}
.emoji-picker__trigger:focus-visible:not([data-focused]),.emoji-picker__trigger[data-focus-visible=true]{
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none}
.emoji-picker__trigger:disabled,.emoji-picker__trigger[aria-disabled=true]{
  opacity:var(--disabled-opacity);
  cursor:var(--cursor-disabled);
  pointer-events:none}
.emoji-picker__trigger:active,.emoji-picker__trigger[data-pressed=true]{
  transform:scale(.97)}
.emoji-picker__value{
  --tw-leading:1;
  line-height:1}
.emoji-picker__popover{
  border-radius:calc(var(--radius) * 2);
  background-color:var(--overlay);
  --tw-shadow:var(--overlay-shadow);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-outline-style:none;
  box-sizing:border-box;
  outline-style:none;
  flex-direction:column;
  display:flex;
  overflow:hidden}
.emoji-picker__popover[data-entering=true]{
  animation:enter var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  --tw-duration:.15s;
  --tw-ease:var(--ease-out);
  transition-duration:.15s;
  transition-timing-function:var(--ease-out);
  --tw-enter-opacity:0;
  --tw-enter-scale:.95}
.emoji-picker__popover[data-exiting=true]{
  animation:exit var(--tw-animation-duration,var(--tw-duration,.15s))var(--tw-ease,ease)var(--tw-animation-delay,0s)var(--tw-animation-iteration-count,1)var(--tw-animation-direction,normal)var(--tw-animation-fill-mode,none);
  --tw-duration:.1s;
  --tw-ease:var(--ease-out);
  transition-duration:.1s;
  transition-timing-function:var(--ease-out);
  --tw-exit-opacity:0;
  --tw-exit-scale:.95}
.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]{
  will-change:opacity,transform}
:is(.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]):is([data-reduce-motion=true],[data-reduce-motion=true] *),:is(.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]):is([data-reduce-motion=true],[data-reduce-motion=true] *):before,:is(.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]):is([data-reduce-motion=true],[data-reduce-motion=true] *):after{
  animation:none}
@media (prefers-reduced-motion:reduce){
  :is(.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]):not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)),:is(.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]):not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)):before,:is(.emoji-picker__popover[data-entering=true],.emoji-picker__popover[data-exiting=true]):not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)):after{
  animation:none}
}
.emoji-picker__popover--sm{
  width:240px;
  height:280px}
.emoji-picker__popover--md{
  width:280px;
  height:350px}
.emoji-picker__popover--lg{
  width:320px;
  height:420px}
.emoji-picker__content{
  gap:calc(var(--spacing) * 1.5);
  padding:calc(var(--spacing) * 2);
  flex-direction:column;
  flex:1;
  display:flex;
  overflow:hidden}
.emoji-picker__grid{
  scrollbar-width:var(--scrollbar-width);
  scrollbar-color:var(--scrollbar-color);
  scrollbar-gutter:var(--scrollbar-gutter);
  padding-top:var(--spacing);
  --tw-outline-style:none;
  -webkit-overflow-scrolling:touch;
  outline-style:none;
  flex:1;
  scroll-padding:4px;
  overflow:auto}
.emoji-picker__grid:has(~[data-slot=emoji-picker-footer]){
  padding-bottom:calc(var(--spacing) * 10)}
.emoji-picker__item{
  border-radius:calc(var(--radius) * 1);
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  width:100%;
  height:100%;
  cursor:var(--cursor-interactive);
  outline-style:none;
  justify-content:center;
  align-items:center;
  display:flex}
@media (hover:hover){
  .emoji-picker__item:hover,.emoji-picker__item[data-hovered=true]{
  background-color:var(--default)}
}
.emoji-picker__item[data-focused=true]{
  background-color:var(--default)}
.emoji-picker__item[data-pressed=true]{
  background-color:var(--default-hover)}
.emoji-picker__item:focus-visible:not([data-focused]),.emoji-picker__item[data-focus-visible=true]{
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none}
.emoji-picker__item[data-selected=true]{
  background-color:var(--default-hover)}
.emoji-picker__item:disabled,.emoji-picker__item[aria-disabled=true]{
  opacity:var(--disabled-opacity);
  cursor:var(--cursor-disabled);
  pointer-events:none}
.emoji-picker__item--sm{
  font-size:20px}
.emoji-picker__item--md{
  font-size:24px}
.emoji-picker__item--lg{
  font-size:28px}
.emoji-picker__footer{
  align-items:center;
  gap:calc(var(--spacing) * 2);
  border-top-style:var(--tw-border-style);
  border-top-width:1px;
  border-color:var(--border);
  inset-inline:0;
  width:100%;
  display:flex;
  position:absolute;
  bottom:0}
@supports (color:color-mix(in lab, red, red)){
  .emoji-picker__footer{
  border-color:color-mix(in oklab, var(--border) 50%, transparent)}
}
.emoji-picker__footer{
  background-color:var(--surface);
  padding-inline:var(--spacing);
  padding-block:calc(var(--spacing) * 1.5);
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
  color:var(--muted)}
.emoji-picker__empty{
  height:100%;
  padding-block:calc(var(--spacing) * 6);
  text-align:center;
  font-size:var(--text-sm);
  line-height:var(--tw-leading,var(--text-sm--line-height));
  color:var(--muted);
  flex:1;
  justify-content:center;
  align-items:center;
  display:flex}
.emoji-picker__skin-tone-options{
  align-items:center;
  gap:calc(var(--spacing) * .5);
  padding:var(--spacing);
  display:flex}
.emoji-picker__skin-tone-picker{
  width:calc(var(--spacing) * 6);
  height:calc(var(--spacing) * 6);
  border-radius:calc(var(--radius) * .75);
  font-size:var(--text-base);
  line-height:var(--tw-leading,var(--text-base--line-height));
  --tw-leading:1;
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  cursor:var(--cursor-interactive);
  outline-style:none;
  flex-shrink:0;
  justify-content:center;
  align-items:center;
  line-height:1;
  display:flex}
@media (hover:hover){
  .emoji-picker__skin-tone-picker:hover,.emoji-picker__skin-tone-picker[data-hovered=true]{
  background-color:var(--default)}
}
.emoji-picker__skin-tone-picker:focus-visible:not([data-focused]),.emoji-picker__skin-tone-picker[data-focus-visible=true]{
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none}
.emoji-picker__skin-tone-picker:disabled,.emoji-picker__skin-tone-picker[aria-disabled=true]{
  opacity:var(--disabled-opacity);
  cursor:var(--cursor-disabled);
  pointer-events:none}
.emoji-picker__skin-tone-option{
  border-radius:calc(var(--radius) * 2);
  padding:var(--spacing);
  font-size:var(--text-xl);
  line-height:var(--tw-leading,var(--text-xl--line-height));
  --tw-leading:1;
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  cursor:var(--cursor-interactive);
  outline-style:none;
  justify-content:center;
  align-items:center;
  line-height:1;
  display:flex}
@media (hover:hover){
  .emoji-picker__skin-tone-option:hover,.emoji-picker__skin-tone-option[data-hovered=true]{
  background-color:var(--default)}
}
.emoji-picker__skin-tone-option:focus-visible:not([data-focused]),.emoji-picker__skin-tone-option[data-focus-visible=true]{
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none}
.emoji-picker__skin-tone-option[data-selected=true]{
  background-color:var(--default-hover)}
.emoji-picker__skin-tone-option:disabled,.emoji-picker__skin-tone-option[aria-disabled=true]{
  opacity:var(--disabled-opacity);
  cursor:var(--cursor-disabled);
  pointer-events:none}

```
