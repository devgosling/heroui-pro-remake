# Command (`command`) - clean-room implementation spec

Slug: `command` · Docs: https://heroui.pro/docs/react/components/command · Storybook title: `Pro/Navigation/Command`
Import (Pro): `import {Command} from "@heroui-pro/react";` · Remake: root export (`@heroui/pro`) and subpath
`@heroui/pro/command`. Only RAC + OSS HeroUI dependencies, no heavy optional peer.

Sources: the public docs page text (anatomy, CSS class list, interactive states, API tables), the rendered DOM,
CSSOM, computed styles and runtime behaviour of the 9 public demo pages (light + dark), observed 2026-11-24, plus
the react-aria-components 1.22 package in this repo (to tell which behaviour comes from React Aria). The paywalled
example source was not opened.

## 1. Purpose

A command palette (Cmd+K menu): a modal dialog holding a search field and a filterable list of actions with
optional groups, separators, icons and keyboard hints, plus optional header (breadcrumbs, scope chips) and footer
(key hints). Filtering is done by an internal RAC `Autocomplete`; the list is a RAC `Menu` driven by virtual focus
from the input.

## 2. Anatomy

```tsx
<Command>                                     // context provider only (renders no DOM)
  <Command.Backdrop isOpen onOpenChange>      // RAC ModalOverlay
    <Command.Container size="md">             // RAC Modal
      <Command.Dialog>                        // RAC Dialog > RAC Autocomplete
        <Command.Header />                    // optional, plain div
        <Command.InputGroup>                  // RAC SearchField
          <Command.InputGroup.Prefix />       // optional, plain div
          <Command.InputGroup.Input />        // RAC Input
          <Command.InputGroup.ClearButton />  // optional, OSS CloseButton (slot="clear")
          <Command.InputGroup.Suffix />       // optional, plain div
        </Command.InputGroup>
        <Command.List>                        // RAC Menu
          <Command.Group heading="Actions">   // RAC MenuSection (+ RAC Header)
            <Command.Item />                  // RAC MenuItem
          </Command.Group>
          <Command.Separator />               // RAC Separator
        </Command.List>
        <Command.Footer />                    // optional, plain div
      </Command.Dialog>
    </Command.Container>
  </Command.Backdrop>
</Command>
```

| Part | Element | `data-slot` | BEM class | Primitive |
| --- | --- | --- | --- | --- |
| `Command` | none | - | - | context provider |
| `Command.Backdrop` | `div[data-rac]` (portal, style vars `--visual-viewport-*`, `--page-*`) | `command-backdrop` | `command__backdrop command__backdrop--{opaque\|blur\|transparent}` | RAC `ModalOverlay` |
| `Command.Container` | `div[data-rac]` (first child: RAC hidden "Dismiss" button) | `command-container` | `command__container` (no size class here) | RAC `Modal` |
| `Command.Dialog` | `section role=dialog tabindex=-1 aria-label="Command palette"` | `command-dialog` | `command__dialog command__dialog--{sm\|md\|lg}` | RAC `Dialog` wrapping RAC `Autocomplete` |
| `Command.Header` | `div` | `command-header` | `command__header` | DOM |
| `Command.InputGroup` | `div[data-rac][data-empty]` | `command-input-group` | `command__input-group` | RAC `SearchField` |
| `.Prefix` | `div` | `command-input-group-prefix` | `command__input-group-prefix` | DOM |
| `.Input` | `input type=search aria-label="Search commands" aria-autocomplete=list autocomplete=off autocorrect=off spellcheck=false enterkeyhint=go aria-controls=<list id>` | `command-input-group-input` | **none** (RAC default `react-aria-Input`; a user className replaces it) | RAC `Input` |
| `.ClearButton` | `button type=button tabindex=-1 slot=clear aria-label="Clear search"` | `command-input-group-clear-button` | `close-button close-button--default command__input-group-clear-button` | OSS `CloseButton` |
| `.Suffix` | `div` | `command-input-group-suffix` | `command__input-group-suffix` | DOM |
| `Command.List` | `div role=menu aria-label="Suggestions" [data-empty]`, preceded by RAC `<template>` + FocusScope sentinels | `command-list` | `command__list` | RAC `Menu` |
| `Command.Group` | `section role=group aria-labelledby` | `command-group` | `command__group` | RAC `MenuSection` |
| group heading | `header role=presentation id` (only when `heading` is set) | `command-group-heading` | `command__group-heading` | RAC `Header` |
| `Command.Item` | `div role=menuitem data-key [data-focused][data-focus-visible][data-hovered][data-pressed][data-disabled]` | `command-item` | `command__item` | RAC `MenuItem` |
| `Command.Separator` | `div role=separator` | `command-separator` | `command__separator` | RAC `Separator` |
| empty state | `div` inside RAC's `div role=menuitem style="display:contents"` | `command-empty` | `command__empty` | DOM (only when `renderEmptyState` is given) |
| `Command.Footer` | `div` | `command-footer` | `command__footer` | DOM |

Observed DOM order inside the dialog: header, input group, `<template>`, focus-scope start, list, focus-scope end,
footer. A header can also be placed after the input group (Multiple Search Terms demo). Arbitrary markup can wrap
the list (Split View demo: `div.flex.min-h-[308px]` holding list, a vertical separator div and a preview pane).

Defaults seen identically in all demos (so they are component defaults): dialog `aria-label="Command palette"`,
input `aria-label="Search commands"`, list `aria-label="Suggestions"`, clear button `aria-label="Clear search"`
(this one comes from RAC SearchField). The docs give the input placeholder default `"Search commands..."`.

## 3. API (docs)

- `Command`: `children`. Remake extension (optional): `isOpen` / `defaultOpen` / `onOpenChange`, provided as RAC
  `OverlayTriggerStateContext` so a Backdrop without its own `isOpen` can be driven from the root. Not a RAC
  `DialogTrigger` (see section 6).
- `Command.Backdrop`: `isDismissable` (default `true`), `variant: "opaque" | "blur" | "transparent"` (default
  `"opaque"`), plus all RAC `ModalOverlay` props (`isOpen`, `defaultOpen`, `onOpenChange`,
  `isKeyboardDismissDisabled`, ...). Demos pass `isOpen` / `onOpenChange` here.
- `Command.Container`: `size: "sm" | "md" | "lg"` (default `"md"`; becomes the dialog modifier), plus RAC `Modal` props.
- `Command.Dialog`: `defaultInputValue`, `inputValue`, `onInputChange`, `filter(textValue, inputValue)` (default
  case-insensitive contains), plus RAC `Dialog` props. Remake also forwards `disableAutoFocusFirst`.
- `Command.Header`, `Command.Footer`, `.Prefix`, `.Suffix`: plain `<div>`.
- `Command.InputGroup`: `autoFocus` (default `true`), plus RAC `SearchField` props.
- `Command.InputGroup.Input`: `placeholder` (default `"Search commands..."`), plus RAC `Input` props.
- `Command.InputGroup.ClearButton`: HeroUI `CloseButton` props.
- `Command.List`: `renderEmptyState`, plus RAC `Menu` props (`items`, `onAction`, ...).
- `Command.Item`: RAC `MenuItem` props (`id`, `textValue`, `onAction`, `isDisabled`, `href`, ...).
- `Command.Group`: `heading: ReactNode`, plus RAC `MenuSection` props.
- `Command.Separator`: RAC `Separator` props.

## 4. Styling (all in `@layer components`)

Tailwind shorthand in brackets; token values in section 7.

- `.command__backdrop`: `fixed inset-0 z-(--z-index-overlay) flex h-(--visual-viewport-height) w-full items-start
  justify-center`. Entering: fade-in 150ms `var(--ease-out)`. Exiting: fade-out 100ms `var(--ease-out)`.
  `will-change: opacity` while animating; `motion-reduce:animate-none`.
  - `--transparent`: `bg-transparent`. `--opaque`: black/50, dark black/60. `--blur`: black/50 (dark /60) +
    `backdrop-blur-md` (12px). Pro writes `bg-black/50 dark:bg-black/60`; the remake uses the OSS `bg-backdrop`
    token, which is exactly `rgba(0,0,0,.5)` light / `.6` dark.
- `.command__container`: `pointer-events-none flex h-(--visual-viewport-height) w-full items-start justify-center
  px-4 pt-[15vh]`. Entering 200ms `cubic-bezier(.25,.46,.45,.94)` (= `--ease-out-quad`) from `opacity 0,
  scale .95, translateY(-0.5rem)`; exiting 100ms same easing to `opacity 0, scale .95`. `will-change: opacity,
  transform`; motion-reduce none. (Pro uses tw-animate `enter`/`exit` keyframes with
  `fade-in zoom-in-95 slide-in-from-top-2`; the remake has its own `command-container-enter` keyframes and reuses
  OSS `heroui-overlay-exit` / `heroui-overlay-fade-in` / `heroui-overlay-fade-out`.)
- `.command__dialog`: `pointer-events-auto relative flex flex-col overflow-hidden rounded-2xl bg-overlay
  shadow-overlay outline-none`, `interpolate-size: allow-keywords`, `transition: height .2s
  cubic-bezier(.16,1,.3,1)` (motion-reduce none). No JS writes a height, so the transition is effectively inert
  for content-driven changes (same in Pro).
  - `--sm`: `w-full max-w-sm max-h-[min(80vh,300px)]`; `--md`: `max-w-lg`, `min(80vh,356px)`; `--lg`: `max-w-xl`,
    `min(80vh,440px)`.
- `.command__header`: `flex w-full items-center gap-2 p-2 pb-0 text-sm` (measured padding 8 8 0 8).
- `.command__input-group`: `flex w-full items-center gap-2 border-b border-border/70`.
  - `[data-slot=command-input-group-input]`: `min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-foreground
    outline-none`, placeholder `text-muted`, WebKit search cancel/decoration `appearance: none`. `ps-0` when a
    prefix exists, `pe-0` when a suffix exists (`:has()`).
  - `[data-empty=true] [data-slot=command-input-group-clear-button]`: `pointer-events-none opacity-0` (keeps its
    space).
- `.command__input-group-prefix` / `-suffix`: `flex shrink-0 items-center text-muted`, `ps-4` / `pe-4`, `svg size-4`.
- `.command__input-group-clear-button`: `me-3 size-5 shrink-0`; icon `size-3`.
- `.command__list`: `scrollbar flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none`.
- `.command__item`: `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground outline-none
  select-none cursor-(--cursor-interactive)`; hover (`@media (hover:hover)`, `:hover` / `[data-hovered]`) and
  `[data-focused]` `bg-default`; `:active` / `[data-pressed]` `bg-default-hover`; `[data-disabled]` `opacity-50
  cursor-default`; `svg` `size-4 shrink-0 text-muted`; `kbd` `ms-auto text-xs text-muted`. No transitions.
- `.command__group + .command__group`: `mt-1`. `.command__group-heading`: `px-3 py-1.5 text-xs font-medium
  text-muted select-none`.
- `.command__separator`: `mx-3 my-1 h-px bg-separator`.
- `.command__footer`: `flex w-full items-center gap-2 border-t border-border/50 bg-default/50 px-3 py-1 text-xs
  text-muted`.
- `.command__empty`: `flex h-full items-center justify-center py-6 text-center text-sm text-muted`.

Measured (light, 447x402 viewport, md): header 28, input group 45 (input 44 + 1px border), prefix 32 (16 padding +
16 icon), clear 20x20 + 12 margin, suffix kbd 24, list padding 6, heading 28, item 36 (40 with a 24px OSS Kbd,
52 with a two-line label), footer 29, dialog capped at `min(80vh, 356px)` = 321.6. Filtered to one item the
dialog is 178 tall, with no match 114 (list keeps its 12px padding). The remake matches every value.

Flex note: header/input/footer can shrink like the list (`flex-shrink: 1`, `min-height: auto`). A footer with
`h-10` therefore shrinks to its content height when the list overflows unless its content wraps (the Pro demo text
wraps; the remake story text was lengthened so it wraps too). Same CSS as Pro, content-dependent.

## 5. Behaviour (observed)

- Open/close is controlled by the app (demos: `useState` + `Command.Backdrop isOpen/onOpenChange`). The trigger
  button (OSS `Button variant="outline"` + `Kbd`) lives outside and has no `aria-expanded`. No built-in Cmd+K.
- On open the input is focused (`autoFocus`). No item is focused until the user types or presses an arrow key.
- Typing filters with RAC Autocomplete; the filter is case- AND accent-insensitive contains (`"préf"` and `"PREF"`
  match "Preferences"), not fuzzy, untrimmed. Empty sections disappear. After each change the first match gets
  virtual focus (`data-focused` + `data-focus-visible`, input `aria-activedescendant`).
- ArrowUp/Down move virtual focus; Enter fires the item's `onAction` (palette stays open; demos close or navigate
  themselves); hover also focuses (RAC Menu).
- Escape with text clears the input (RAC SearchField); Escape on an empty input closes the palette; backdrop click
  closes (`isDismissable`).
- Clear button: hidden (opacity 0, no pointer events) while `data-empty="true"`; tabindex -1.
- Item press: `data-pressed` -> `bg-default-hover`.
- Animations: backdrop enter 150ms / exit 100ms; container enter 200ms / exit 100ms. `data-entering` /
  `data-exiting` set by RAC.
- Demo-level behaviours (not component features): nested pages with breadcrumbs (Clean: "Search Projects..." opens
  a projects page; Backspace on an empty input and Escape go back one page), Split View preview updates on item
  action, scope chips removable via CloseButton.

## 6. Implementation notes (remake)

- Root is a plain provider. A RAC `DialogTrigger` would also provide `RootMenuTriggerStateContext`, which makes RAC
  Menu close the overlay on every item action; Pro keeps the palette open on Enter, so it is not a DialogTrigger.
  The remake's optional root `isOpen/defaultOpen/onOpenChange` only provide `OverlayTriggerStateContext`; without
  them an enclosing DialogTrigger keeps working.
- `Command.Dialog` renders RAC `Dialog` and puts RAC `Autocomplete` inside it (filter default
  `useFilter({sensitivity: "base"}).contains`).
- `Command.Item`: when `textValue` is missing and children are not a string, the remake derives the text from the
  React children (ignoring `kbd` / HeroUI Kbd) so filtering still works. Pro demos most likely pass `textValue`.
- `Command.Group` renders `<Header>` (if `heading`) + `<Collection items>{children}</Collection>`, so both static
  children and `items` + render function work.
- `Command.List` wraps `renderEmptyState()` output in `div.command__empty[data-slot=command-empty]`.
- Size travels Container -> Dialog through context (the class lands on the dialog, as in Pro).

## 7. Tokens

`--overlay`, `--overlay-shadow` (`shadow-overlay`), `--default`, `--default-hover`, `--border`, `--separator`,
`--muted`, `--foreground`, `--backdrop`, `--radius` (`rounded-2xl` = radius*2 dialog, `rounded-lg` = radius*1 items),
`--z-index-overlay`, `--cursor-interactive`, `--ease-out` (`cubic-bezier(0,0,.2,1)`), `--ease-out-quad`,
`--blur-md` (12px), `--container-sm/lg/xl` (24/32/36rem), scrollbar tokens (OSS `scrollbar` utility).
Dark (Pro): overlay lab(8.3), default lab(15.7), border lab(16.4), muted lab(65.6), overlay shadow
`0 0 1px 0 #ffffff4d inset`; backdrop black/60. The remake inherits all of them from the theme.

## 8. Demos -> stories

| Pro demo | Story | Structure reproduced |
| --- | --- | --- |
| command-default (Usage) | `Default` | md, header chip (sm, secondary), prefix search icon, placeholder, clear, suffix `Esc` Kbd, 2 headed groups with icon items, footer with up/down + enter hints |
| command-launcher | `Launcher` | lg, input + clear only, items `!h-10` with colored icon tiles and a right-aligned type label, footer with action hints and custom kbd chips |
| command-dev-toolbar | `DevToolbar` | md, prefix + Esc suffix, first headless group with a status-dot two-line item (`bg-default`), groups with Kbd shortcut (`slot="keyboard"`), no footer |
| command-sizes | `Sizes` | three tertiary buttons opening the default palette at sm / md / lg |
| command-backdrop-variants | `BackdropVariants` | three tertiary buttons opening it with transparent / opaque / blur; same palette as Usage but **without a footer** |
| command-clean | `Clean` | lg, breadcrumb tags in the header, nested pages, Backspace / Escape go back (capture-phase key handler) |
| command-minimal | `Minimal` | lg, header tag (`px-4 pt-4 pb-0`), large input with custom caret, flat items with an accent bar on focus |
| command-split-view | `SplitView` | lg, list `!w-2/5 !flex-none` + vertical separator + preview pane updated on action |
| command-multiple-search-terms | `MultipleSearchTerms` | lg, Cmd+K suffix, header with removable soft chips after the input (wrapping to 2 rows, header 54px), heading with "View all" button, footer `h-10` with a help text that wraps to 2 lines so the footer keeps 40px (list 182.6px at 447x402, as on Pro) |
| (docs API) | `EmptyState` | `renderEmptyState`, `Command.Separator`, disabled item, `defaultInputValue` |

Every story opens with its button or Cmd/Ctrl+K.

## 9. Dependencies

`react-aria-components` (Autocomplete, Dialog, Modal, ModalOverlay, SearchField, Input, Menu, MenuItem,
MenuSection, Header, Separator, Collection), `@heroui/react` (CloseButton; stories: Button, Kbd, Chip, Input,
Switch, Avatar, Spinner), `@iconify/react` gravity-ui icons (stories only). No new packages.

## 10. Deviations

- `bg-backdrop` token instead of literal `bg-black/50 dark:bg-black/60` (identical values with the default theme).
- Own `command-container-enter` keyframes + OSS overlay keyframes instead of tw-animate `enter`/`exit` (same
  values: opacity 0, scale .95, translateY -0.5rem, 200ms / 100ms).
- Root accepts optional `isOpen` / `defaultOpen` / `onOpenChange` (additive).
- `Command.Item` derives `textValue` from children when it is not given (additive).
- `Command.Dialog` forwards `disableAutoFocusFirst` to Autocomplete (additive).

## Appendix: CSSOM excerpt (reference only, summarised)

```
.command__backdrop{z-index:var(--z-index-overlay);height:var(--visual-viewport-height);justify-content:center;align-items:flex-start;width:100%;display:flex;position:fixed;inset:0}
.command__backdrop[data-entering=true]{animation:enter .15s var(--ease-out);--tw-enter-opacity:0}
.command__backdrop[data-exiting=true]{animation:exit .1s var(--ease-out);--tw-exit-opacity:0}
.command__backdrop--opaque{background:black/50; dark: black/60}  .command__backdrop--blur{same + backdrop-filter:blur(var(--blur-md))}
.command__container{height:var(--visual-viewport-height);width:100%;padding-inline:16px;pointer-events:none;justify-content:center;align-items:flex-start;padding-top:15vh;display:flex}
.command__container[data-entering=true]{animation:enter .2s cubic-bezier(.25,.46,.45,.94);--tw-enter-opacity:0;--tw-enter-scale:.95;--tw-enter-translate-y:-.5rem}
.command__container[data-exiting=true]{animation:exit .1s cubic-bezier(.25,.46,.45,.94);--tw-exit-opacity:0;--tw-exit-scale:.95}
.command__dialog{border-radius:calc(var(--radius)*2);background:var(--overlay);box-shadow:var(--overlay-shadow);pointer-events:auto;interpolate-size:allow-keywords;outline:none;flex-direction:column;transition:height .2s cubic-bezier(.16,1,.3,1);display:flex;position:relative;overflow:hidden}
.command__dialog--sm{width:100%;max-width:var(--container-sm);max-height:min(80vh,300px)} --md{max-width:var(--container-lg);max-height:min(80vh,356px)} --lg{max-width:var(--container-xl);max-height:min(80vh,440px)}
.command__input-group{align-items:center;gap:8px;border-bottom:1px solid color-mix(var(--border) 70%);width:100%;display:flex}
.command__input-group [data-slot=command-input-group-input]{min-width:0;padding:12px 16px;font-size:var(--text-sm);color:var(--foreground);background:transparent;outline:none;flex:1 1 0%}
.command__input-group-clear-button{width:20px;height:20px;flex-shrink:0;margin-inline-end:12px} (icon 12px)
.command__input-group-prefix / -suffix{color:var(--muted);flex-shrink:0;align-items:center;padding-inline-start|end:16px;display:flex} svg 16px
.command__list{scrollbar tokens;overscroll-behavior:contain;padding:6px;outline:none;flex:1 1 0%;overflow-y:auto}
.command__item{align-items:center;gap:10px;border-radius:var(--radius);padding:8px 12px;font-size:var(--text-sm);color:var(--foreground);user-select:none;cursor:var(--cursor-interactive);outline:none;display:flex;position:relative}
  hover/[data-hovered]/[data-focused]{background:var(--default)}  :active/[data-pressed]{background:var(--default-hover)}  [data-disabled]{opacity:.5;cursor:default}
  svg{16px;color:var(--muted);flex-shrink:0}  kbd{font-size:var(--text-xs);color:var(--muted);margin-inline-start:auto}
.command__group+.command__group{margin-top:4px}  .command__group-heading{padding:6px 12px;font-size:var(--text-xs);font-weight:500;color:var(--muted);user-select:none}
.command__separator{margin:4px 12px;background:var(--separator);height:1px}
.command__header{align-items:center;gap:8px;width:100%;padding:8px 8px 0;font-size:var(--text-sm);display:flex}
.command__footer{align-items:center;gap:8px;border-top:1px solid color-mix(var(--border) 50%);background:color-mix(var(--default) 50%);padding:4px 12px;font-size:var(--text-xs);color:var(--muted);width:100%;display:flex}
.command__empty{height:100%;padding-block:24px;text-align:center;font-size:var(--text-sm);color:var(--muted);justify-content:center;align-items:center;display:flex}
```
