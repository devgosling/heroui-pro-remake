# Context Menu: clean-room implementation spec

Slug: `context-menu` · Docs: https://heroui.pro/docs/react/components/context-menu · Category: Navigation
Import (Pro): `import {ContextMenu} from "@heroui-pro/react";` (root export, no heavy peers)
Storybook title (remake): `Pro/Navigation/ContextMenu`

Sources: public docs text; the rendered DOM, CSSOM and computed styles of the 7 public demo pages
(light and dark); runtime probing with synthetic `contextmenu`, keyboard, pointer and mousedown events;
the OSS HeroUI source in this repo (Dropdown, MenuItem, Separator, Kbd, Header); and the installed
react-aria 3.53 / react-aria-components 1.22 / react-stately 3.51 packages. I did not open or try to
get around the paywalled example source.

---

## 1. Purpose

A right-click menu. It opens at the pointer position, supports sections, selection (checkbox/radio),
nested submenus, keyboard opening on a focusable trigger, and long press on iOS.

## 2. Anatomy

```tsx
<ContextMenu>                                   // provider, renders no DOM
  <ContextMenu.Trigger>{/* area */}</ContextMenu.Trigger>   // <div>
  <ContextMenu.Popover>                         // RAC Popover (role=dialog, modal, underlay)
    <ContextMenu.Menu>                          // RAC Menu
      <ContextMenu.Section>                     // = HeroUI DropdownSection (.menu-section)
        <Header>…</Header>                      // OSS Header (optional)
        <ContextMenu.Item>                      // = HeroUI DropdownItem (.menu-item)
          <ContextMenu.ItemIndicator />         // = DropdownItemIndicator (.menu-item__indicator)
          <Label>…</Label>                      // OSS Label
          <Kbd slot="keyboard" variant="light" className="ms-auto">…</Kbd>
        </ContextMenu.Item>
      </ContextMenu.Section>
      <ContextMenu.Separator />                 // RAC Separator (.context-menu__separator)
      <ContextMenu.SubmenuTrigger>              // = DropdownSubmenuTrigger
        <ContextMenu.Item>… <ContextMenu.SubmenuIndicator /></ContextMenu.Item>
        <ContextMenu.Popover><ContextMenu.Menu>…</ContextMenu.Menu></ContextMenu.Popover>
      </ContextMenu.SubmenuTrigger>
    </ContextMenu.Menu>
  </ContextMenu.Popover>
</ContextMenu>
```

| Part | Element | `data-slot` | BEM class | Notes |
|---|---|---|---|---|
| Root | none | none | none | Holds open state, pointer point, ids |
| Trigger | `<div id="react-aria-…">` | `context-menu-trigger` | `context-menu__trigger` | `id` only when enabled; no aria-haspopup/expanded; no state data-attrs |
| Popover (root) | `<div role="dialog" tabindex="-1" data-rac data-trigger="MenuTrigger" data-placement aria-labelledby={triggerId}>` | `context-menu-popover` | `context-menu__popover` | portal wrapper `<div style="display:contents">`, inert underlay `<div data-testid="underlay" style="position:fixed;inset:0">` |
| Popover (submenu) | same, `data-trigger="SubmenuTrigger"`, `aria-labelledby={itemId}`, `data-placement="right"` | `context-menu-popover` | `context-menu__popover` | non-modal |
| Menu (root) | `<div role="menu" id={menuId} aria-labelledby={triggerId} tabindex>` | `context-menu-menu` | `context-menu__menu` | no `data-selection-mode` attribute (unlike OSS DropdownMenu) |
| Item | OSS `.menu-item menu-item--{default\|danger}` | `menu-item` | from OSS | `role=menuitem / menuitemradio / menuitemcheckbox` |
| Separator | `<div role="separator">` | `context-menu-separator` | `context-menu__separator` | div because RAC Menu sets `SeparatorContext elementType="div"` |

Ids: trigger `react-aria-_R_x_` and menu `react-aria-_R_xH1_`, two `useId()` calls in one component
(the root). The popover and the menu are both labelled by the trigger id.

The demos also put the OSS `<Separator />` (`.separator separator--horizontal separator--default`, full
width, no margin) between sections, and the context-menu separator inside plain item lists and submenus.

## 3. API (docs)

### ContextMenu
| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | – | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `onOpenChange` | `(open: boolean) => void` | – | Open state callback |
| `isDisabled` | `boolean` | `false` | Disables the menu (native browser menu shows) |

### ContextMenu.Trigger
Renders a `<div>`. `children`, `className` (+ div props in the remake). Not focusable by default; with
`tabIndex={0}` Shift+F10 (Windows/Linux) and Control+Enter (macOS) open the menu.

### ContextMenu.Popover
| Prop | Type | Default |
|---|---|---|
| `offset` | `number` | `2` |
| `placement` | `Placement` | `"bottom start"` |
Plus every RAC Popover prop except `isOpen`, `triggerRef`, `children`.
Observed: the offset default 2 also applies to submenu popovers (item right edge + 2px); the
placement of a submenu stays RAC's `end top` (rendered `data-placement="right"`).

### ContextMenu.Menu
`onClose?: () => void` replaces the default close (closing the context menu). Closes on item
selection, receives focus on open. Plus every RAC Menu prop.

### Item / ItemIndicator / Section / SubmenuTrigger / SubmenuIndicator
Re-exports of HeroUI `DropdownItem`, `DropdownItemIndicator`, `DropdownSection`,
`DropdownSubmenuTrigger`, `DropdownSubmenuIndicator`.

### ContextMenu.Separator
RAC Separator props.

## 4. Styling (CSSOM, `@layer components`)

| Selector | Declarations (as observed) | Authored as |
|---|---|---|
| `.context-menu__trigger` | `display:inline-block; position:relative` (+ docs: `-webkit-touch-callout:none`, dropped from Chrome's CSSOM) | `@apply relative inline-block` |
| `.context-menu__popover` | `max-width:48svw; scroll-padding-block:var(--spacing); scrollbar-*:var(--scrollbar-*); overscroll-behavior:contain; border-radius:calc(var(--radius)*3); background:var(--overlay); font-size:var(--text-sm); outline:none; padding:0; overflow-y:auto; box-shadow:var(--shadow-overlay); transform-origin:var(--trigger-anchor-point,center)`; `@media (min-width:48rem){min-width:calc(var(--spacing)*55)}` | `scroll-py-1 scrollbar overflow-y-auto overscroll-contain rounded-3xl bg-overlay p-0 text-sm outline-none md:min-w-55` |
| `…[data-entering=true]` | tw-animate `enter` 150ms `ease`, opacity 0, scale .9; top: translateY(+0.25rem), bottom: −0.25rem, left: translateX(+0.25rem), right: −0.25rem; also `transition-duration:.15s; transition-timing-function:ease` (transition-property stays `all`, so a reposition while entering eases) | OSS keyframes `heroui-overlay-enter-90{,-y,-ny,-x,-nx}` (same values) 150ms ease + `transition-duration:150ms; transition-timing-function:ease` |
| `…[data-exiting=true]` | tw-animate `exit` 100ms `ease`, opacity 0, scale .95; `transition-duration:.1s; transition-timing-function:ease` | `heroui-overlay-exit` 100ms ease + `transition-duration:100ms; transition-timing-function:ease` |
| entering/exiting | `will-change: opacity, transform`; `motion-reduce:animate-none` (HeroUI variant: media query + `[data-reduce-motion]`) | same |
| `.context-menu__popover [data-slot=context-menu-menu]` | `padding: calc(var(--spacing)*1.5); outline:none` | `p-1.5 outline-none` |
| `.context-menu__popover [data-slot=context-menu-separator]` | `width:94%; margin-left:3%` | `ml-[3%] w-[94%]` |
| `.context-menu__menu` | `position:relative; display:flex; flex-direction:column; gap:calc(var(--spacing)*.5); width:100%; padding:var(--spacing); overflow:clip` | same utilities |
| `.context-menu__separator` | `margin-block:var(--spacing); background:var(--separator); width:100%; height:1px` | `my-1 h-px w-full bg-separator` |

Items keep the OSS menu-item padding `6px 8px` (the Dropdown-only `px-2.5` override does not apply).

### Measured (light, viewport 407×402, click at 143.5,165 in the default demo)
- Popover `left:143px; top:167px` (pointer + offset 2), width = content (149.67px), `rounded 24px`,
  `--trigger-anchor-point: 0px 0px`, `max-height` from RAC (viewport − top − 12px).
- Menu padding 6px, gap 2px; item 36px tall, radius 16px, gap 12px; label 14px/500; kbd 24px high,
  `ms-auto`, muted; disabled item opacity .5.
- Separator: 1px, margin 4px 0, 94% of the menu width, 3% left margin.
- Sections: header 26px (`6px 8px 4px`, 12px/500 muted), OSS separator between sections full width.
- Submenu: `top` = item top, `left` = item right + 2px.
- Dark: `--overlay` background, `--overlay-shadow` = `0 0 1px 0 rgba(255,255,255,.3) inset`,
  separator/kbd/label from tokens. Everything is token driven; no literal colours.

## 5. Behaviour

- `contextmenu` on the trigger (preventDefault + stopPropagation) sets the point to the pointer
  position and opens. The popover uses the point as a zero-size anchor rectangle.
- Opening focuses the menu itself (`tabindex=0`); with a selection the selected item gets focus.
  ArrowDown moves to the first item. Escape and item press close (exit animation 100ms).
- The popover is modal (RAC underlay, rest of the page inert). A right mousedown outside therefore
  lands on `<body>`; a document `mousedown` listener closes the menu when
  `(button === 2 || (button === 0 && ctrlKey)) && target === document.body`, then the browser's own
  menu appears. A synthetic right mousedown on the underlay itself does not close it.
- Long press: only iOS uses a long press (React Aria `useLongPress` inside `useContextMenu`); Android
  and desktop touch screens fire `contextmenu` natively. A synthetic touch long press on desktop
  Chrome does nothing in the Pro demo.
- Focusable trigger (`tabIndex={0}`): Shift+F10 / context-menu key (native `contextmenu` event) and
  Control+Enter on macOS (React Aria workaround) open the menu.
- Disabled: no handlers, no `id`; native menu not prevented; no visual change.
- Submenu: ArrowRight / hover opens, `aria-expanded`, `data-open` on the trigger item, focus moves to
  the first submenu item.

## 6. Demos (all reproduced as stories with my own content)

| Demo | Content structure | Story |
|---|---|---|
| default | 3 items with ⌘ shortcuts (2nd disabled), `ContextMenu.Separator`, 2 plain items | `Default` |
| with-sections | 2 `Section`s with `Header`, icon (`size-4 text-muted`) + label + kbd items; OSS `Separator` between; last item `variant="danger"` with `text-danger` icon | `WithSections` |
| with-selection | Menu `selectionMode="single"`, one section with header, 3 items with `ItemIndicator` (checkmark) | `WithSelection` |
| with-submenus | 3 shortcut items (2nd disabled), `SubmenuTrigger` item → submenu (items + `ContextMenu.Separator`), OSS `Separator`, section `selectionMode="multiple"` (checkmarks), OSS `Separator`, section with header `selectionMode="single"` (dot indicators) | `WithSubmenus` |
| long-press | 2 items, `ContextMenu.Separator`, 3 items | `LongPress` |
| disabled | `isDisabled` root | `Disabled` |
| controlled | status text "Menu is open/closed" above the trigger, `open`/`onOpenChange` | `Controlled` |

Trigger area in every demo: `flex h-48 w-80 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted select-none`.

## 7. Implementation notes (remake)

- No RAC `MenuTrigger`: it wraps its child in a `PressResponder`, and consuming that with `usePress`
  on an arbitrary trigger area would stop pointer/mouse-down propagation and block text selection in
  the area. Instead the root owns a `RootMenuTriggerState`-shaped object (open, `point`/`setPoint`,
  `focusStrategy`, `expandedKeysStack`, `openSubmenu`/`closeSubmenu`), written from scratch.
- The root popover provides `OverlayTriggerStateContext` and `RootMenuTriggerStateContext` (needed by
  RAC `SubmenuTrigger`) and passes `triggerRef` (the trigger div), `trigger="MenuTrigger"`,
  `aria-labelledby`, `scrollRef` and placement directly. These contexts are scoped to the popover so
  RAC components inside the trigger area never see them.
- A submenu popover is detected through `PopoverContext.trigger === "SubmenuTrigger"`; its menu takes
  focus/close wiring from RAC `SubmenuTrigger` (`MenuContext`).
- `ContextMenu.Menu` root: `id`, `aria-labelledby={triggerId}`, `autoFocus`, `onClose = onClose ?? close`.
- Trigger uses `useContextMenu` from `react-aria/useContextMenu` (right click, Shift+F10,
  macOS Ctrl+Enter, iOS long press).
- `SurfaceContext variant="default"` around the popover, like the OSS Dropdown popover.

## 8. Dependencies

`@heroui/react` (DropdownItem/ItemIndicator/Section/SubmenuTrigger/SubmenuIndicator, SurfaceContext;
stories: Label, Kbd, Header, Separator), `react-aria-components` (Popover, Menu, Separator, contexts,
Provider), `react-aria` (useContextMenu, mergeProps). No heavy peer, so it can be exported from the root.

## 9. Deviations

- Enter/exit use the OSS `heroui-overlay-*` keyframes instead of tw-animate-css `enter`/`exit`
  (same values: opacity, 0.9 / 0.95 scale, 0.25rem slide, 150/100ms, `ease`).
- `ContextMenu.Trigger` also accepts any `<div>` prop (`tabIndex`, `onKeyDown`, `ref`, …); docs list only
  `children` and `className`.
- Item/ItemIndicator/Section/SubmenuTrigger/SubmenuIndicator are thin wrappers (for displayNames)
  around the Dropdown parts instead of identical references.
