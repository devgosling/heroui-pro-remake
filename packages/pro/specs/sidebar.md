# Sidebar — clean-room implementation spec

Slug: `sidebar` · Docs: https://heroui.pro/docs/react/components/sidebar · Category: Navigation
Storybook: `Pro/Navigation/Sidebar` · Import (Pro): `import {Sidebar, useSidebar, useSidebarPages} from "@heroui-pro/react";`

Sources: the public docs text (anatomy, API tables, CSS classes and variables), the rendered DOM and CSSOM of all
16 public demo pages (light and dark, desktop at 1280×800 inside a same-origin iframe, mobile at 400×800), computed
styles, runtime probing (clicks, keyboard, MutationObserver, `getAnimations()`), and the React Aria Components
1.22 sources in this repo. The paywalled example code was not opened.

---

## 1. Purpose

Application navigation panel. It sits next to the main content and supports three collapse modes (icon rail,
offcanvas, none), three looks (default, floating, inset), either side, tree menus with animated nested groups,
sliding "pages", tooltips on the icon rail, a `Cmd/Ctrl+B` shortcut, a `sidebar_state` cookie and a mobile sheet.

---

## 2. Anatomy and DOM

```tsx
<Sidebar.Provider>                       // div.sidebar__provider[data-sidebar=provider][data-state]
  <Sidebar>                              // aside.sidebar.sidebar--{left|right}.sidebar--{default|floating|inset}
                                         //   [data-collapsible][data-side][data-slot=sidebar][data-state][data-variant]
                                         //   (offcanvas: wrapped in div.sidebar__offcanvas-wrapper[data-side][data-state])
    <Sidebar.Header />                   // div.sidebar__header
    <Sidebar.Content>                    // HeroUI ScrollShadow hideScrollBar + .sidebar__content
      <Sidebar.Group>                    // div.sidebar__group
        <Sidebar.GroupLabel />           // div.sidebar__group-label
        <Sidebar.Menu aria-label="…">    // RAC Tree: div.sidebar__menu[role=treegrid][data-guide-lines][data-sidebar=menu]
          <Sidebar.MenuSection>          // RAC TreeSection: div.sidebar__menu-section[role=rowgroup]
            <Sidebar.MenuHeader />       // RAC TreeHeader: div.sidebar__menu-header[role=row] > div[role=rowheader display:contents]
            <Sidebar.MenuItem>           // RAC TreeItem: div.sidebar__menu-item[role=row] > div[role=gridcell display:contents]
              <Sidebar.MenuIcon />       //   > div.sidebar__menu-item-content > span.sidebar__menu-icon
              <Sidebar.MenuLabel>        //     span.sidebar__menu-label[data-sidebar=label] > span.sidebar__menu-label-text
                <Sidebar.MenuTrigger>    //     (moved after the label) button.sidebar__menu-trigger[slot=chevron]
                  <Sidebar.MenuIndicator/>//    svg.sidebar__menu-indicator (inside the label when used without a trigger)
              <Sidebar.MenuChip />       //     span.sidebar__menu-chip
              <Sidebar.MenuActions>      //     div.sidebar__menu-actions(.ml-auto)
                <Sidebar.MenuAction />   //       RAC Button .sidebar__menu-action
              <Sidebar.Submenu>…         //   nested rows (flattened tree rows, grouped in div[data-tree-motion-section])
      <Sidebar.Separator />              // HeroUI Separator <hr class="separator … sidebar__separator">
      <Sidebar.Pages><Sidebar.Page/>     // div.sidebar__pages > div.sidebar__page[data-active][inert][aria-hidden]
    <Sidebar.Footer />                   // div.sidebar__footer
    <Sidebar.Rail />                     // button.sidebar__rail[aria-label="Toggle sidebar"][tabindex=-1]
  <Sidebar.Mobile />                     // HeroUI Sheet (only below 48rem)
  <Sidebar.Main>                         // main.sidebar__main
    <Sidebar.Trigger />                  // HeroUI Button ghost/sm/icon-only, data-slot=sidebar-trigger
```

Observed details
- Every part has `data-slot="sidebar-…"` (`sidebar-provider`, `sidebar`, `sidebar-header`, `sidebar-content`,
  `sidebar-footer`, `sidebar-group`, `sidebar-group-label`, `sidebar-menu`, `sidebar-menu-section`,
  `sidebar-menu-header`, `sidebar-menu-item`, `sidebar-menu-item-content`, `sidebar-menu-icon`, `sidebar-menu-label`,
  `sidebar-menu-label-text`, `sidebar-menu-chip`, `sidebar-menu-actions`, `sidebar-menu-action`, `sidebar-menu-trigger`,
  `sidebar-menu-indicator`, `sidebar-separator`, `sidebar-rail`, `sidebar-main`, `sidebar-trigger`, `sidebar-pages`,
  `sidebar-page`, `sidebar-mobile`, `sidebar-mobile-overlay-container`).
- Row attributes come from RAC TreeItem: `role=row`, `aria-level`, `aria-posinset`, `aria-setsize`, `aria-expanded`
  (only with children), `data-level`, `data-expanded`, `data-has-child-items`, `data-hovered`, `data-focus-visible`,
  `style="--tree-item-level:N"`, `data-key`, `data-href` (items with `href`). Pro adds `data-current="true"` and
  `aria-current="page"` for `isCurrent`.
- Expanded children are wrapped in `<div data-tree-motion-section role="presentation" style="height:auto;opacity:1;overflow:visible">`
  placed after the parent row. Inside it rows stack without the menu gap. With `reduceMotion` the wrapper is absent
  and child rows are direct siblings in the treegrid (2px gap).
- The trigger rendered by `Sidebar.MenuTrigger` is RAC's `slot="chevron"` button:
  `data-react-aria-prevent-focus tabindex=-1 aria-label="Expand|Collapse"`.
- `Sidebar.MenuAction` inside a HeroUI Dropdown carries `aria-haspopup`/`aria-expanded` (`dropdown__trigger` class in the
  demos, which wrap a Dropdown trigger).
- `Sidebar.Separator` is collection-aware (RAC Separator), so it can sit between rows inside a `Sidebar.Menu`
  (Pages demo: Back, separator, items).
- Mobile sheet DOM: `.sheet__overlay > (.sheet__backdrop.sheet__backdrop--blur, scroll container > section.sheet__content.sheet__content--left.sidebar__mobile-sheet[data-placement] > (dismiss button, section.sheet__dialog.sidebar__mobile-dialog > div.sidebar__mobile, div.sidebar__mobile-overlay-container))`.
- Icon-only collapse removes submenus from the tree entirely (rows lose `aria-expanded`); expanding again restores
  them with the previous expansion state. Pro does both at once; here open submenus fold away while the panel
  narrows and leave the tree when the 200ms width transition ends, and unfold with the panel when it expands
  (see §5 "Icon rail animation").

---

## 3. API (docs)

### Sidebar.Provider
| Prop | Type | Default |
|---|---|---|
| open / defaultOpen / onOpenChange | boolean / boolean / (open) => void | – / true / – |
| side | "left" \| "right" | "left" |
| variant | "sidebar" \| "floating" \| "inset" | "sidebar" |
| collapsible | "icon" \| "offcanvas" \| "none" | "icon" |
| navigate | (href: string) => void | – |
| reduceMotion | boolean | false |
| toggleShortcut | string \| false \| null | "mod+b" |

### Parts
- `Sidebar` (aside), `Sidebar.Header`, `Sidebar.Footer` (div), `Sidebar.Content` (ScrollShadow, `hideScrollBar`; all
  ScrollShadow props), `Sidebar.GroupLabel` (div), `Sidebar.Main` (main), `Sidebar.Rail` (button).
- `Sidebar.Group` — `closeMobileOnAction` (default true, inherited by menus/items).
- `Sidebar.Menu` — RAC Tree props except selection; `closeMobileOnAction`, `reduceMotion`, `showGuideLines`
  (`true` = always, `false` = never, `"hover"`; default true).
- `Sidebar.MenuSection` (RAC TreeSection), `Sidebar.MenuHeader` (RAC TreeHeader).
- `Sidebar.MenuItem` — RAC TreeItem props + `closeMobileOnAction`, `forceReload`, `href`, `isCurrent`, `tooltip`
  (default: label text), `tooltipProps` (tooltip also while expanded; row is the trigger).
- `Sidebar.MenuItemContent`, `Sidebar.MenuIcon` (size-5 span), `Sidebar.MenuLabel` (separates trailing
  `Sidebar.MenuTrigger`), `Sidebar.MenuChip`, `Sidebar.MenuActions`, `Sidebar.MenuAction` (RAC Button),
  `Sidebar.MenuTrigger` (RAC Button), `Sidebar.MenuIndicator` (custom children replace the chevron), `Sidebar.Submenu`.
- `Sidebar.Separator` (HeroUI Separator props), `Sidebar.Trigger` (HeroUI Button, ghost, sm).
- `Sidebar.Pages` — `value`, `defaultValue` (first page), `onValueChange`, `reduceMotion`.
- `Sidebar.Page` — `value`; inactive pages are `inert` and `aria-hidden`.
- `Sidebar.Mobile` — `backdrop` "blur" | "opaque" | "transparent" (default "blur"); renders nothing on desktop.
- `Sidebar.Tooltip` — `content`, `placement` (default "right"), `delay`, `closeDelay`; only active while collapsed.
- `useSidebar()` → `{isOpen, setOpen, isMobile, isMobileOpen, setMobileOpen, toggleSidebar, side, variant, collapsible}`.
- `useSidebarPages()` → `{activeValue, setActiveValue, activeIndex, order}` (must be inside Sidebar.Pages).

Routing (docs): items navigate via RAC's router. Provider `navigate` wins, then a global RouterProvider, then
native navigation. External `http(s)://` links open in a new tab. `forceReload` uses `window.location.href` when
`navigate` is set; with only a global RouterProvider it is forwarded as a router option.

---

## 4. Styling (CSSOM, all in `@layer components`)

Component variables on `.sidebar`: `--sidebar-width: 240px`, `--sidebar-width-collapsed: 48px`,
`--sidebar-duration: .2s`, `--sidebar-ease: ease`, `--sidebar-edge-outline: #00000014` (dark: `#ffffff1a` via
`.dark .sidebar, [data-theme=dark] .sidebar`). On `.sidebar__menu`: `--sidebar-menu-indent: calc(var(--spacing)*4)`,
`--sidebar-menu-guide-color: color-mix(in srgb, currentColor 10%, transparent)`, `--sidebar-menu-row-gap:
calc(var(--spacing)*.5)`. On rows: `--sidebar-menu-item-offset` (0, indent × (level-1) for aria-level 2…5) and
`--sidebar-menu-guide-count` (level-1).

| Element | Rules (tokens) | Measured (default theme) |
|---|---|---|
| provider | flex, w-full, min-h-svh; `overflow-x: clip` when it contains an offcanvas wrapper | 1280×800 |
| .sidebar | sticky top-0, flex-col, shrink-0, h-svh, width var, min-width collapsed var, bg-background, border-color var(--border), transition width (duration/ease) + box-shadow .15s ease-out | 240×800, bg `--background` |
| collapsed (not offcanvas) | width 48px, overflow-x clip; content/footer padding-inline `(rail − 1rem − 5×spacing) / 2` (6px), header `rail / 2 − 4×spacing` (8px, centres a `px-1` logo row), header menus `margin-inline: 1.5×spacing − .5rem`; no re-alignment (Pro: header/footer/content px-1.5, header items-center, `> *` justify-center gap-0 w-auto p-0, header labels hidden) | 48px |
| icon labels | `[data-sidebar=label]`, `[data-slot=chip]` and `.sidebar__menu-chip` animate opacity/max-width/margin/visibility; trigger and actions animate opacity/visibility; collapsed → opacity 0, max-width 0, invisible (visibility delayed by duration) | |
| offcanvas | wrapper width var → 0 (floating: + 4×spacing); aside z-20, translate/visibility transition; collapsed `translate: -100%` (right: 100%), visibility hidden | |
| mobile | `@media (width < 48rem)` hides `.sidebar` and the wrapper | |
| --default | `box-shadow: inset -1px 0 0 var(--sidebar-edge-outline)` (right side: `1px`); rail hover/focus-visible → `var(--color-default-hover)` | |
| --floating | m-2, rounded `calc(var(--radius)*2)`, border, bg-surface, shadow-lg, h `calc(100svh - 1rem)` | 8,8,240×784, r16 |
| --inset | transparent, no border/shadow; main becomes card: m-2 ms-0, rounded radius×2, border, bg-surface, shadow-surface, min-h calc(100svh-1rem), margin transition; collapsed → ms-2 | main 240,8,1032×784 |
| --right | order 1 | |
| header | flex-col gap-2 px-4 pt-4 pb-2 | h 64 (brand row 40) |
| content | flex-col flex-1 min-h-0 gap-1 px-3 overflow-y-auto (gap-0.5 on the rail); header/content/footer padding and gap transition with the width (icon mode) | |
| footer | flex-col gap-1 px-3 pt-2 pb-4 | |
| separator | my-2 w-auto | |
| group | flex-col gap-1; `+ group` mt-2 (mt-0 on the rail, margin transition) | |
| group-label | px-2 py-1.5 text-xs font-medium tracking-normal muted, ellipsis, select-none; on the rail folds to height 0 / py-0 / opacity 0 with `margin-block-end: −1×spacing` (height auto ↔ 0 via `interpolate-size: allow-keywords` on `.sidebar`; Pro: `display: none`) | h 28 |
| menu | flex-col gap-0.5 outline-none forced-color-adjust-none; `[data-focus-visible]` focus ring | gap 2 |
| menu-section | flex-col gap-0.5; not first → mt-3 (mt-0 on the rail, margin transition) | |
| menu-header | px-2 py-1.5 text-xs font-medium tracking-wider uppercase muted; folds like the group label on the rail | h 28, 0.6px tracking |
| menu-item | relative flex w-full items-center text-foreground, cursor interactive, box-shadow transition .15s; disabled → status-disabled | |
| guide lines | `::before` absolute, top/bottom −row-gap/2, left indent/2, width count×indent, repeating 1px lines; `hover` mode fades in on menu hover (.15s) | x = row x + 8 |
| item-content | flex min-h-9 gap-3 py-1.5, **padding-inline .5rem**, rounded `calc(var(--radius)*2)`, width `100% - offset`, margin-inline-start offset; hover/current/actions-active → bg-default; focus-visible → ring | 216×36, r16; nested 200 wide at +16 |
| icon | size-5 muted (svg size-4); current → foreground | |
| label / label-text | text-sm foreground, flex-1, gap-2, pointer-events none; ellipsis | 14/20px; current → font-medium |
| chip | text-xs muted tabular-nums | |
| indicator | size-3.5 muted, rotate .15s; `[data-expanded]` → 90deg; RTL 180deg | 14px |
| trigger | size-5 flex center; hidden when row has no children | 20px |
| actions | hidden; flex on hover / current / hovered / action focus-visible / open menu, and always in `.sidebar__mobile` | |
| action | p-1 rounded radius, `--button-bg*` vars (default-hover), transitions; pressed scale .98 | |
| icon rail rows | row content keeps `justify-start` and `.5rem` padding (icon box at 6 + 8 = 14px, centred); label/chip/trigger/actions fade and are clipped by the row; guide lines off (Pro: content justify-center px-0, parts `display: none`) | 36×36 at x 6 |
| rail | absolute inset-y-0 w-4 z-10 transparent; left side right −2px (right side left −2px); cursor e-/w-resize by side/state | 226→242 |
| main | relative flex-col flex-1 min-w-0 min-h-svh | |
| mobile sheet | left/right sheet content: radius 0, width 80vw, max 500px; dialog full width, radius 0, overflow hidden; overlay container `display: contents`; `.sidebar__mobile` flex-col h-full | 320 wide at 400px |
| pages / page | pages: relative flex-col w-full overflow clip; page: flex-col gap-1 w-full, will-change transform; active relative, inactive absolute + pointer-events none | |

Dark mode only swaps tokens (`--background`, `--default`, `--foreground`, `--muted`, `--surface`) and the edge outline literal.
Compact demos set `--spacing: .2rem` (and Meeting Notes also `--radius: .2rem`, `--text-sm: .8rem`, `--text-xs: .7rem`)
inline on the aside: everything spacing-based scales (rows 29.6px; 28.8px in Meeting Notes) except the literal
`.5rem` item padding-inline and the 240px width. The mobile sheet does not inherit these overrides.

---

## 5. Behaviour and timings

- **Collapse**: trigger, rail click, or `mod+b`. `mod` matches Ctrl or Cmd (Meta also worked on Windows);
  other modifiers must match exactly (Ctrl+Shift+B did nothing); `preventDefault()` on match. Width transition 200ms ease.
- **Icon rail animation** (deliberate change from Pro, requested by the user): Pro hides labels, chips, group
  labels and submenus with `display: none` and centres the rows the moment the state flips, so the icons jump to
  the middle of the still-wide rows and then travel back with the shrinking panel. Here nothing changes alignment:
  every icon stays start-aligned and only drifts with the animated panel padding (20 → 14px for menu icons,
  20 → 12px for a logo row, measured per frame in Edge: ≤ 2.5px per frame, no jumps), labels/chips/chevrons/actions
  fade and get clipped by the narrowing rows, group labels and menu headers fold to 0, group / section margins and the
  content gap shrink, and open submenus fold away (WAAPI, 200ms ease-in-out) before they leave the tree at the end of
  the transition (`SidebarRailContext` phase, 200ms). Expanding plays it in reverse; restored submenus unfold over
  200ms `ease` with the panel.
- **Cookie**: uncontrolled toggles write `sidebar_state=<bool>` (path `/`).
- **Tooltips (icon rail)**: OSS `.tooltip` (no arrow), placement right (left for `side="right"`), offset 3px,
  opens after the OSS `--tooltip-delay` (measured ~1510ms after pointer enter), anchored to the row; the row gets
  `aria-describedby` = tooltip id while open. React Aria trigger semantics: moving to another row swaps the
  tooltip at once (old one exits, new one enters, warm-up), leaving closes after `--tooltip-close-delay`
  (~507ms), pointer down closes immediately, keyboard focus opens immediately, Escape closes. Rows without an
  action (e.g. a parent row on the rail) still show their tooltip.
- **Pressability**: rows with `href` or `onAction` are actionable (`data-react-aria-pressable`), parent rows
  toggle; plain rows without link/handler (and parent rows on the rail, whose submenus are removed) are not
  pressable.
- **Demo-level details**: Complex / Agent Hub take the header Segment and the wide "New chat" button off the rail
  (Pro unmounts them via `useSidebar`; the stories fold the Segment with a grid-rows wrapper and shrink "New chat"
  with a `data-sidebar="label"` wrapper so nothing jumps), footer user-menu texts and chevrons carry
  `data-sidebar="label"`, custom rows reach the rail position with the arbitrary variant
  `[.sidebar[data-collapsible=icon][data-state=collapsed]_&]:…` (With Avatar drops its row padding so the 32px avatar
  is centred; it no longer hides the name with `group-data-[state=collapsed]:hidden`, the label fade does that),
  Meeting Notes opens its Command palette with Cmd/Ctrl+K.
- **Submenu expand**: wrapper height 0 → auto and opacity 0 → 1, both 220ms `cubic-bezier(.16,1,.3,1)`.
  **Collapse**: height → 0 in ~200ms (ease-in-out curve), opacity 1 → 0 in 100ms `cubic-bezier(.23,1,.32,1)`;
  `aria-hidden` + `pointer-events:none` during exit, wrapper removed afterwards. Pressing a row with children
  toggles it (RAC default when the row has no link/action). Chevron rotation 150ms.
- **Pages**: switching sets `data-active`, `inert`, `aria-hidden` immediately; every page moves to
  `translateX((index − active) × 100%)` and opacity 0/1 over 300ms `cubic-bezier(.23,1,.32,1)`. Container height follows
  the active page instantly.
- **Mobile** (`width < 48rem`): desktop aside hidden; trigger toggles a left/right Sheet (blur backdrop); pressing an
  item closes it (`closeMobileOnAction`); menu actions always visible.
- **Keyboard** (RAC Tree): Tab enters the tree, arrows move between rows, ArrowRight/Left expand/collapse or move to
  parent, Enter/Space activate; focus-visible ring on `.sidebar__menu-item-content`.
- **Reduced motion**: `reduceMotion` drops the motion wrapper; CSS transitions use the motion-reduce variant.

---

## 6. Demo variants (stories)

| # | Demo | Story | Notes |
|---|---|---|---|
| 1 | sidebar-default (Usage) | Default | brand header, current item, expanded group with dropdown actions, chip, collapsed group, footer menu, rail, mobile body with chevron triggers |
| 2 | sidebar-complex | Complex | `--spacing:.2rem`, header action + Segment, labelled groups (chip, dropdown), teamspace with many children + actions, separators, utility footer + "New chat" |
| 3 | sidebar-compact-with-user-menu | CompactWithUserMenu | compact, ⌘K chip item, spaces group, avatar dropdown in footer |
| 4 | sidebar-inset-variant | InsetVariant | `variant="inset"`, offcanvas, two groups + separator, card main with placeholder grid |
| 5 | sidebar-floating-variant | FloatingVariant | `variant="floating"`, offcanvas, rail |
| 6 | sidebar-right-side | RightSide | `side="right"`, main rendered first |
| 7 | sidebar-collapsible | Collapsible | icon collapse, group label, chip, rail |
| 8 | sidebar-icon-only | IconOnly | `collapsible="none"`, `[--sidebar-width:56px]`, icon-only rows (`MenuItemContent className="justify-center gap-0 p-2.5"`), no mobile |
| 9 | sidebar-with-groups | WithGroups | two labelled groups separated |
| 10 | sidebar-collapsible-groups | CollapsibleGroups | offcanvas, `showGuideLines="hover"`, MenuSection + MenuHeader + MenuTrigger, nested items with actions |
| 11 | sidebar-with-avatar | WithAvatar | aside `group`, avatar header hiding text when collapsed, separators |
| 12 | sidebar-pages | Pages | Sidebar.Pages with back items and separators inside menus |
| 13 | sidebar-meeting-notes | MeetingNotes | offcanvas, compact radius/spacing/text, search button opening a command palette, time chips, footer icon buttons + user menu |
| 14 | sidebar-agent-hub | AgentHub | compact, recent chats with actions, agents (Beta chip), workspaces, apps, new chat + user menu |
| 15 | sidebar-agent-workspace | AgentWorkspace | compact, menu inside the header, repo groups with tooltip buttons, time chips, archive/delete actions |
| 16 | sidebar-reduced-motion | ReducedMotion | `reduceMotion` on the provider |

All demos except Icon Only render `Sidebar.Mobile`.

---

## 7. Dependencies

OSS: Button, ScrollShadow, Separator, Sheet, Tooltip, RouterProvider (`@heroui/react`); React Aria: Tree, TreeItem,
TreeItemContent, TreeSection, TreeHeader, Button, CollectionRendererContext, TooltipTriggerStateContext,
`UNSAFE_PortalProvider`, `TooltipContext`. Stories also use Avatar, Breadcrumbs, Chip, Dropdown, Kbd, Tooltip and the
Pro Segment and Command components.
No heavy optional peers → root export.

---

## 8. Implementation notes and deviations

- Submenu animation uses a custom RAC collection renderer that groups child rows in `[data-tree-motion-section]` and
  animates it with WAAPI (Pro appears to use a JS animation library; timings reproduced).
- Pages slide with CSS transitions on inline `transform`/`opacity` (same values and timing).
- Row tooltips: an OSS `Tooltip` root (RAC TooltipTrigger state, so global warm-up / cooldown / one-at-a-time
  behaviour is shared with every HeroUI tooltip) whose `Tooltip.Content` is anchored to the row with
  `triggerRef`. RAC TreeItem cannot consume TooltipTrigger props, so a small driver reads pointer
  enter/leave/down and keydown from the row element and keyboard focus from the row render props, and calls the
  RAC state's `open` / `close` with the same rules as `useTooltipTrigger`. (RAC only reports hover for actionable
  rows, hence the native pointer listeners.)
- `Sidebar.Pages` `reduceMotion` only removes the page slide (inline `transition: none`); it no longer sets
  `data-reduce-motion`, which would also have disabled every HeroUI transition inside the pages.
- Additions: `Sidebar.Trigger` gets `aria-label="Toggle sidebar"`; expandable rows without a `MenuTrigger` get a
  visually hidden RAC chevron button (screen readers, removes RAC's dev warning); the mobile dialog gets
  `aria-label="Sidebar"`; when the focused page slides away, focus moves to the new page's menu.
- `.sidebar__menu-actions` gets `margin-inline-start: auto` in CSS instead of the `ml-auto` class seen in the demos.
- Icon rail animation: see §5. Group labels / menu headers rely on `interpolate-size` to animate their height;
  browsers without it snap the height but keep the fade. Offcanvas collapse no longer hides group labels, menu
  headers and section spacing (Pro did, which shifted the content while the panel slid out).
- `showGuideLines={false}` renders `data-guide-lines="never"`.
- Icon Only story shows tooltips through `tooltipProps` (the docs describe tooltips; the live demo shows none).
- Meeting Notes' command palette uses the Pro `Command` component (opaque backdrop, md dialog, input group with
  clear button and Esc hint, Folders / Companies / People groups), like the Pro demo.
- Reduced motion: the CSS uses HeroUI's `motion-reduce:transition-none` everywhere. Pro only drops the panel /
  offcanvas / group-label transitions under `prefers-reduced-motion` and keeps the label fade, inset margin,
  guide-line fade and chevron rotation; this is an intentional accessibility difference.

---

## Appendix A — raw CSSOM excerpts (reference only)

```
.sidebar { border-color: var(--border); background-color: var(--background); --sidebar-width: 240px; --sidebar-width-collapsed: 48px; --sidebar-duration: .2s; --sidebar-ease: ease; --sidebar-edge-outline: #00000014; height: 100svh; width: var(--sidebar-width); min-width: var(--sidebar-width-collapsed); transition: width var(--sidebar-duration) var(--sidebar-ease), box-shadow .15s var(--ease-out); flex-direction: column; flex-shrink: 0; display: flex; position: sticky; top: 0px; }
.sidebar__menu-item-content { min-height: calc(var(--spacing) * 9); align-items: center; gap: calc(var(--spacing) * 3); border-radius: calc(var(--radius) * 2); min-width: 0px; padding-block: calc(var(--spacing) * 1.5); width: calc(100% - var(--sidebar-menu-item-offset)); margin-inline-start: var(--sidebar-menu-item-offset); padding-inline: 0.5rem; display: flex; overflow: hidden; }
.sidebar__menu:is([data-guide-lines="always"], [data-guide-lines="hover"]) .sidebar__menu-item::before { content: ""; top: calc(var(--sidebar-menu-row-gap) * -.5); bottom: calc(var(--sidebar-menu-row-gap) * -.5); left: calc(var(--sidebar-menu-indent) / 2); width: calc(var(--sidebar-menu-guide-count) * var(--sidebar-menu-indent)); pointer-events: none; background-image: repeating-linear-gradient(to right, var(--sidebar-menu-guide-color) 0 1px, transparent 1px var(--sidebar-menu-indent)); opacity: 1; position: absolute; }
.sidebar[data-state="collapsed"][data-collapsible="offcanvas"] { width: var(--sidebar-width); visibility: hidden; translate: -100%; }
.sidebar__provider:has(.sidebar--inset) .sidebar__main { margin: calc(var(--spacing) * 2); border-radius: calc(var(--radius) * 2); background-color: var(--surface); box-shadow: var(--surface-shadow); min-height: calc(-1rem + 100svh); transition: margin var(--sidebar-duration,.2s) var(--sidebar-ease,ease); border-width: 1px; margin-inline-start: 0px; }
.sidebar__mobile-sheet[data-placement="left"], .sidebar__mobile-sheet[data-placement="right"] { border-radius: 0px; width: 80vw; max-width: 500px; }
```

Measured motion: expand `[{height:0,opacity:0} → {height:auto,opacity:1}]` 220ms `cubic-bezier(0.16,1,0.3,1)`;
collapse opacity WAAPI `1 → 0` 100ms `cubic-bezier(0.23,1,0.32,1)`, height to 0 in ~195ms; pages opacity WAAPI 300ms
`cubic-bezier(0.23,1,0.32,1)` with transform moving in step.
