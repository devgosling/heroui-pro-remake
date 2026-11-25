# AppLayout — clean-room implementation spec

Slug: `app-layout` · Docs: https://heroui.pro/docs/react/components/app-layout · Category: Navigation
Storybook: `Pro/Navigation/AppLayout` · Import (Pro): `import {AppLayout, useAppLayout} from "@heroui-pro/react";`
Remake import: `import {AppLayout, useAppLayout} from "@heroui/pro/app-layout";` (subpath only, see §7)

Sources: the public docs text (anatomy, API tables, CSS classes, data attributes, CSS variables), the rendered
DOM, CSSOM and computed styles of all 14 public demo pages (light and dark, 1280×800 fullscreen, plus 400, 900 and
1100px widths), runtime probing (trigger clicks, keyboard shortcuts, Tab order, handle drags, reloads with persisted
sizes, `requestAnimationFrame` sampling of the aside transition, tooltip timing) and the
`react-resizable-panels` 4.24.1 package installed in this repo. The paywalled example code was not opened.

Tooling note: the shared built-in browser pane was at its tab cap, so the live analysis ran in an isolated headless
Microsoft Edge (Playwright from `packages/testing`, fresh profile, no sign-in) on the same public pages; the remake
stories were measured the same way against the running Storybook.

---

## 1. Purpose

An application shell: a full-height `Sidebar`, a sticky header row that hosts a `Navbar`, the main column, an
optional second sticky row (`toolbar`), an optional bottom row (`footer`) and an optional right-side `aside`
panel. It owns the `Sidebar.Provider`, so every Sidebar part works inside without extra setup, adapts an embedded
`Navbar` (`data-in-app-layout`), can switch scrolling into the main column (`scrollMode="content"`) and can make the
sidebar and aside user-resizable through `Resizable` (react-resizable-panels).

---

## 2. Anatomy and DOM

```tsx
<AppLayout navbar={…} sidebar={…} aside={…} toolbar={…} footer={…}>
  <AppLayout.MobileAside>…</AppLayout.MobileAside>   // marker, only for asideMobile="sheet"
  {children}
</AppLayout>
```

Static layout (default):

```
div.sidebar__provider[data-sidebar=provider][data-slot=sidebar-provider][data-state]
   [data-app-layout=""][data-aside-mobile=hidden|sheet][data-resizable?][data-scroll-mode=page|content]
  {sidebar}                                   // <Sidebar> (aside.sidebar or offcanvas wrapper) + <Sidebar.Mobile>
  div.app-layout__body[data-slot=app-layout-body]
    header.app-layout__header[data-slot=app-layout-header]       // only with `navbar`
      nav.navbar.navbar--sticky[data-in-app-layout=true]         // the user's <Navbar maxWidth="full">
    div.app-layout__toolbar[data-slot=app-layout-toolbar]        // only with `toolbar`
    main.app-layout__main[data-slot=app-layout-main][data-scroll-mode]
         (+ aria-label="Scrollable main content" tabindex=0 when scrollMode="content")
    div.app-layout__footer[data-slot=app-layout-footer]          // only with `footer`
  aside.app-layout__aside[data-slot=app-layout-aside][data-state=open|closed]   // only with `aside`
    {aside}                                                      // direct children (`> *` is styled)
```

Resizable layout (`sidebarResizable` with collapsible offcanvas/none from `md` up, or `asideResizable` from `lg` up):

```
div.sidebar__provider[data-app-layout][data-resizable=""]…
  {sidebar}                                   // only when the sidebar is not in the group
  div.resizable.resizable--horizontal.app-layout__resizable[data-slot=resizable][data-group]
    div[data-slot=resizable-panel][data-panel]#app-layout-sidebar > div.resizable__panel.app-layout__sidebar-panel > {sidebar}
    div.resizable__handle…--line--primary[role=separator][aria-label="Resize handle"]
    div[data-panel]#app-layout-main  > div.resizable__panel.app-layout__main-panel  > div.app-layout__body …
    div.resizable__handle…                                       // only with the aside in the group
    div[data-panel]#app-layout-aside > div.resizable__panel.app-layout__aside-panel > {aside}  // no .app-layout__aside
  aside.app-layout__aside…                    // static aside when it is not in the group (below lg)
```

Observed responsive switching (resizable-aside demo): 400px → no group at all (static layout, sidebar and aside
hidden by CSS); 900px → group with sidebar + main, static aside (hidden); 1100px → group with all three panels.

Header controls:
- `AppLayout.MenuToggle` → OSS Button `button--icon-only button--sm button--ghost app-layout__menu-toggle`,
  `data-slot=app-layout-menu-toggle`, `aria-label="Open navigation"`, Gravity `bars` icon (16px). No aria-expanded.
- `AppLayout.AsideTrigger` → OSS Button `… app-layout__aside-trigger`, `data-slot=app-layout-aside-trigger`,
  `data-state=open|closed`, `aria-expanded`, `aria-label="Toggle aside panel"`, Gravity
  `layout-side-content-right` icon. With tooltips it is wrapped in the OSS `Tooltip.Trigger`
  (`div.tooltip__trigger[role=button][tabindex=0]`, a separate Tab stop that also opens the tooltip on focus).
- Mobile aside sheet: OSS Sheet `placement="right"`: `Sheet.Content.app-layout__mobile-aside-sheet` >
  `Sheet.Dialog.app-layout__mobile-aside-dialog` > `div.app-layout__mobile-aside`.

---

## 3. API (docs)

### AppLayout (root, all `<div>` props forwarded to the internal `Sidebar.Provider`)
| Prop | Type | Default |
|---|---|---|
| sidebar / navbar / aside / children | ReactNode | – |
| toolbar / footer | ReactNode | – |
| sidebarOpen / defaultSidebarOpen / onSidebarOpenChange | boolean / boolean / (open) => void | – / true / – |
| sidebarSide | "left" \| "right" | "left" |
| sidebarVariant | "sidebar" \| "floating" \| "inset" | "sidebar" |
| sidebarCollapsible | "icon" \| "offcanvas" \| "none" | "icon" |
| asideOpen / defaultAsideOpen / onAsideOpenChange | boolean / boolean / (open) => void | – / true / – |
| navigate | (href: string) => void | – (Sidebar.Provider + NavbarLayoutContext) |
| reduceMotion | boolean | false |
| toggleShortcut | string \| false \| null | "mod+b" |
| asideToggleShortcut | string \| false \| null | – (disabled) |
| asideMobile | "hidden" \| "sheet" | "hidden" |
| sidebarResizable | boolean | false (needs collapsible offcanvas/none) |
| sidebarDefaultSize / sidebarMinSize / sidebarMaxSize | number \| string | 18 / 12 / 30 (numbers = %) |
| sidebarResizeBehavior | "preserve-relative-size" \| "preserve-pixel-size" | "preserve-relative-size" |
| asideResizable | boolean | false |
| asideDefaultSize / asideMinSize / asideMaxSize | number \| string | 20 / 15 / 40 |
| asideResizeBehavior | same as sidebar | "preserve-relative-size" |
| resizableAutoSaveId | string | – |
| scrollMode | "page" \| "content" | "page" |

### AppLayout.MenuToggle — HeroUI Button props + `children` (icon, default bars), `tooltip`, `tooltipProps`.
### AppLayout.AsideTrigger — HeroUI Button props + `children` (default layout-side-content-right),
`closedTooltip`, `openTooltip`, `tooltipProps` (both states).
### AppLayout.MobileAside — marker, `children` replace `aside` inside the mobile sheet.
### AppLayoutTooltipProps — `placement` ("bottom"), `delay`, `closeDelay`, `offset`, `showArrow` (false),
`isDisabled` (false), `className` (on `Tooltip.Content`).
### useAppLayout() → `{isAsideOpen, setAsideOpen, toggleAside} | null` (null outside AppLayout).
Sidebar state comes from `useSidebar()` (same provider).

Persisted state: while uncontrolled, toggles write `sidebar_state` (Sidebar.Provider) and `aside_state` cookies
(`path=/`). Read them on the server and pass `defaultSidebarOpen` / `defaultAsideOpen`.

---

## 4. Styling (CSSOM, all in `@layer components`)

| Element | Rules (tokens) | Measured |
|---|---|---|
| provider | Sidebar's `flex min-h-svh w-full` | 1280×800 |
| `.app-layout__body` | flex-col, flex 1 1 0%, min-w-0, min-h-0 | 1040 wide next to a 240px sidebar |
| `.app-layout__header` | sticky top-0, z-40, shrink-0 | 64px (navbar md) |
| `.app-layout__toolbar` | `--navbar-height: 56px`, sticky, `top: var(--navbar-height)`, z-39, shrink-0 | top 56px (quirk kept) |
| `.app-layout__main` | flex 1 1 0%, min-w-0 | |
| `.app-layout__footer` | shrink-0 | 33px demo row |
| `.app-layout__menu-toggle` | `display:none`, `margin-inline-start: -0.5rem` (literal); `inline-flex` below 48rem | 36×36 on phones (OSS button) |
| `[data-app-layout] [data-slot=sidebar-trigger]` | `margin-inline-start: -0.5rem` | x 256 |
| `.app-layout__aside-trigger` | `margin-inline-end: -0.5rem` | |
| content mode | `[data-app-layout][data-scroll-mode=content]`: h-dvh, min-h-0, overflow hidden; main: min-h-0, overflow-y auto, overscroll-y contain, OSS scrollbar vars; main `:focus-visible` outline none | |
| `.app-layout__aside` | `--app-layout-aside-width: 320px`, `--app-layout-aside-duration: .2s`; sticky top-0, h-dvh, shrink-0, overflow hidden, `border-inline-start: 1px var(--border)`, bg `--background`, width var; transition width + border-color (duration, `ease`) | 320×800, border `--border` |
| `.app-layout__aside > *` | width var, h-full, overflow-y auto + scrollbar vars, transition translate | |
| closed | aside width 0 (stays 1px = border box), border transparent; children `translate: 100%` (RTL −100%) | |
| below 64rem | aside `display:none`; trigger hidden unless `[data-aside-mobile=sheet]` | |
| below 48rem | `[data-app-layout] > [data-slot=sidebar]` and `[data-app-layout] [data-slot=sidebar-trigger]` hidden | |
| reduced motion | aside + children `transition: none` | |
| `.navbar[data-in-app-layout=true]` | owned by Navbar: static, z-auto, 100% size, no chrome | |
| resizable root | `[data-app-layout][data-resizable]`: flex-row, h-dvh, min-h-0 | |
| `.app-layout__resizable` | flex, flex-1, h-full, min-w-0, min-h-0 | |
| panels | sidebar/aside panel: relative, min 0, overflow hidden (aside panel border-0); main panel: flex-col too | |
| sidebar in group | `[data-slot=sidebar]` + offcanvas wrapper width 100%, `transition: none`; `.sidebar--default` box-shadow none (the handle is the edge) | |
| aside in group | border colours transparent; `> aside`, `> [data-slot=aside]`, `> div` fill the panel and scroll | |
| mobile aside sheet | `[data-placement=right]`: width 100%, max `min(360px, 88vw)`, radius 0; dialog h-dvh, radius 0, padding 0; inner flex-col h-full | |

Dark mode only swaps tokens (`--background`, `--border`); measured colours of the remake equal Pro's after
lab/oklch conversion (e.g. border light lab(88.37) = oklch(.9 .004 286), dark lab(16.43) = oklch(.28 .006 286)).

---

## 5. Behaviour and timings

- **Aside toggle**: width 320 → 0 and content translate 0 → 100% over 200ms `ease` (rAF samples at 87/120/153/186ms:
  249.5/135.6/63.1/23.9px, remake 297/189/63/24px at 74/109/157/190ms, same curve). The aside keeps no `inert` /
  `aria-hidden` while closed (as Pro). `aside_state=<bool>` cookie written while uncontrolled.
- **Tooltips**: OSS Tooltip, placement bottom, offset 3px, no arrow, ~1.5s delay (`--tooltip-delay`), centred on the
  `Tooltip.Trigger` wrapper (24px wide because of the button's negative margin). Pro and remake both open at
  x 886.65 / y 47 for "Hide details".
- **Tab order** (with-aside): account button → tooltip wrapper div (opens the tooltip) → aside trigger → aside content.
- **Shortcuts**: `toggleShortcut` (Sidebar, default `mod+b`); `asideToggleShortcut` uses the same combo syntax
  (`mod` = Cmd or Ctrl, exact other modifiers, `preventDefault` on match). Ctrl+. did nothing on the demo without it.
- **MenuToggle**: below 48rem opens `Sidebar.Mobile` (left sheet, blur backdrop); the desktop Sidebar.Trigger is hidden.
- **asideMobile="sheet"**: below 64rem the trigger stays visible and toggles a right Sheet (separate state, closed
  automatically when the viewport grows to lg); `AppLayout.MobileAside` content replaces `aside` in the sheet.
- **Resizable**:
  - Sidebar panel `collapsible` (offcanvas) with `collapsedSize 0`; aside panel always collapsible. Trigger / shortcut
    collapse or expand the panel instantly (no animation); dragging below the threshold collapses it and flips the
    sidebar / aside state (sidebar `data-state=collapsed`, trigger `data-state=closed`).
  - Expanding restores the previous size; after a reload with persisted `0` sizes the open panels expand to their
    `minSize` (rrp behaviour, identical in Pro: 220 / 260px).
  - Reload (review pass, headless Edge): the SSR-rendered Pro demos always paint the default sizes after a reload
    although `localStorage` holds the dragged layout, and the next drag then jumps (DOM and stored layout disagree:
    a hydration glitch of the demo page). The remake (client-rendered) restores the stored layout, as the docs describe.
  - Live viewport changes: the aside joins the group when the viewport grows past `lg` (the sidebar past `md`).
    A panel that joins an existing group is only registered after the group's effects ran, so `usePanelSync`
    retries the collapse/expand sync for up to 10 frames (calling `isCollapsed()` earlier throws
    "Panel constraints not found" and crashed the tree before the review fix).
  - When the aside re-joins the group, Pro sizes the three panels from the layout read when the group mounted
    (1100px: 223 / 600 / 275), the remake's `Resizable` reads the current stored (two-panel) layout, which does not
    match, so the panels fall back to their default sizes (260 / 518 / 320). Pro also re-shows a closed aside
    open (trigger still `data-state=closed`) after a `lg → md → lg` round trip; the remake keeps it collapsed.
  - Demo constraints: resizable-sidebar 280px (220–420), resizable-aside sidebar 260px (220–380) and aside 320px
    (260–420), all `preserve-pixel-size`, autosave keys `react-resizable-panels:<id>` = `{"app-layout-sidebar":…}`.
  - Handles are plain `Resizable.Handle` (line, primary, 1px, 8px hit area).
- **Scroll modes**: page (window scrolls, header sticky, aside / sidebar sticky full height) and content (shell fixed to
  the viewport, `<main>` scrolls and is focusable with an accessible name).

---

## 6. Demo variants (stories)

| # | Pro demo | Story | Notes |
|---|---|---|---|
| 1 | app-layout-default (Usage) | Default | icon collapse, rail, brand, current item, expanded group, chip, collapsed group, footer menu; navbar: toggles, breadcrumb, search/bell items, separator, avatar dropdown |
| 2 | app-layout-inset-dashboard | InsetDashboard | inset + offcanvas, workspace dropdown header, shortcut group with count chip, separator, nav, label-only group; navbar user dropdown; 3 KPIs with charts + list card of PressableFeedback rows |
| 3 | app-layout-docs-site | DocsSite | offcanvas, rail, version header, icon group labels, components menu (`showGuideLines="hover"`, MenuTriggers, Beta chip), footer menu; navbar: spacer / SearchField + ⌘K / spacer / icon Segment |
| 4 | app-layout-collapsible | Collapsible | icon collapse, rail |
| 5 | app-layout-offcanvas | Offcanvas | offcanvas, no rail |
| 6 | app-layout-with-inset-sidebar | InsetSidebar | `sidebarVariant="inset"` (main stays flush, no card) |
| 7 | app-layout-floating-sidebar | FloatingSidebar | `sidebarVariant="floating"` |
| 8 | app-layout-content-scroll | ContentScroll | `scrollMode="content"`, sticky jump bar, 5 sections × 8 cards, footer row |
| 9 | app-layout-with-aside | WithAside | aside with properties, DisclosureGroup, footer buttons; AsideTrigger with open/closed tooltips |
| 10 | app-layout-with-breadcrumbs | WithBreadcrumbs | 4-level breadcrumbs (middle levels `hidden md:flex`), separator + labelled group |
| 11 | app-layout-with-toolbar | ToolbarAndFooter | `scrollMode="content"`, toolbar with Segment, footer row |
| 12 | app-layout-complex | Complex | compact agent-hub sidebar (`--spacing: .2rem` on the Sidebar), navbar with breadcrumbs and actions |
| 13 | app-layout-resizable-sidebar | ResizableSidebar | `sidebarResizable`, offcanvas, 280/220/420px, preserve-pixel-size, autosave |
| 14 | app-layout-resizable-aside | ResizableAside | sidebar + aside resizable, `asideToggleShortcut="mod+."`, autosave |
| + | (docs section "Mobile Aside Sheet") | MobileAsideSheet | extra story: `asideMobile="sheet"` + `AppLayout.MobileAside` |

Measured parity (1280×800, light + dark): every layout element in all 14 stories has the same rect and computed
styles as the Pro demo (body, header, nav, main, toolbar, footer, aside, aside child, triggers, sidebar, panels,
handles); the app-layout DOM signature (tags, classes, data attributes, roles) is identical for default, with-aside,
toolbar, content-scroll and resizable-aside.

---

## 7. Dependencies

- Pro: `Sidebar` (provider, `useSidebar`), `Navbar` (`NavbarLayoutContext`), `Resizable` (Group / Panel / Handle,
  imperative panel handles).
- OSS `@heroui/react`: Button, Tooltip, Sheet. Stories also use Avatar, Breadcrumbs, Chip, Disclosure(Group),
  Dropdown, Kbd, SearchField and Pro KPI, PressableFeedback, Segment.
- `react-resizable-panels` (through Resizable) → subpath-only export (`@heroui/pro/app-layout`), like Resizable.
  Pro lists it as a required peer; this package keeps it optional, so AppLayout is not in the root barrel.
- Icons: Gravity UI `bars` and `layout-side-content-right` path data (MIT, attribution in `app-layout-icons.tsx`).

---

## 8. Implementation notes and deviations

- The root is the internal `Sidebar.Provider` (Pro renders no `.app-layout` block class); `data-app-layout`,
  `data-aside-mobile`, `data-resizable`, `data-scroll-mode` are passed through its props.
- Panel ↔ state sync: a layout effect collapses / expands the panel when the open state changes (so a panel that
  starts closed collapses before the first paint and later expands to its default size); `onCollapse` / `onExpand`
  from dragging update the sidebar / aside state (guarded so `onOpenChange` fires once).
- `sidebar_state` cookie: written by Sidebar.Provider while uncontrolled, as the docs describe. The live demos did
  not write it (they probably control the provider internally); `aside_state` matches.
- The aria values of the second handle (controls the main panel) differ from Pro's (Pro shows min > max, likely a
  different rrp build); sizes, constraints and drag behaviour are identical.
- Mobile aside sheet: no public demo, so its backdrop (OSS default `opaque`) and `aria-label="Aside panel"` are
  choices; classes and sizes follow the documented CSS.
- With `sidebarSide="right"` in the resizable shell the sidebar panel is placed last (after the aside), matching the
  static layout where `.sidebar--right` has `order: 1`.
- The sidebar trigger icon comes from `Sidebar.Trigger` (owned by the Sidebar component), which draws its own
  panel icon; Pro uses Gravity `layout-side-content-left` there.

---

## Appendix A — raw CSSOM excerpts (reference only)

```
.app-layout__body { flex-direction: column; flex: 1 1 0%; min-width: 0px; min-height: 0px; display: flex; }
.app-layout__header { z-index: 40; flex-shrink: 0; position: sticky; top: 0px; }
.app-layout__toolbar { --navbar-height: 56px; top: var(--navbar-height); z-index: 39; flex-shrink: 0; position: sticky; }
.app-layout__menu-toggle { margin-inline-start: -0.5rem; display: none; }
@media not all and (min-width: 48rem) { .app-layout__menu-toggle { display: inline-flex; } }
[data-app-layout] [data-slot="sidebar-trigger"] { margin-inline-start: -0.5rem; }
[data-app-layout][data-scroll-mode="content"] { height: 100dvh; min-height: 0px; overflow: hidden; }
[data-app-layout][data-scroll-mode="content"] .app-layout__main { scrollbar-*: var(--scrollbar-*); overscroll-behavior-y: contain; min-height: 0px; overflow-y: auto; }
.app-layout__aside { border-inline-start-width: 1px; border-color: var(--border); background-color: var(--background); --app-layout-aside-width: 320px; --app-layout-aside-duration: .2s; height: 100dvh; width: var(--app-layout-aside-width); transition: width var(--app-layout-aside-duration) ease, border-color var(--app-layout-aside-duration) ease; flex-shrink: 0; position: sticky; top: 0px; overflow: hidden; }
.app-layout__aside > * { scrollbar-*; width: var(--app-layout-aside-width); height: 100%; transition: translate var(--app-layout-aside-duration) ease; overflow-y: auto; }
.app-layout__aside[data-state="closed"] { border-inline-start-color: transparent; width: 0px; }
.app-layout__aside[data-state="closed"] > * { translate: 100% (RTL -100%); }
@media not all and (min-width: 64rem) { .app-layout__aside { display: none; } [data-app-layout]:not([data-aside-mobile="sheet"]) .app-layout__aside-trigger { display: none; } }
@media not all and (min-width: 48rem) { [data-app-layout] > [data-slot="sidebar"], [data-app-layout] [data-slot="sidebar-trigger"] { display: none; } }
[data-app-layout][data-resizable] { flex-direction: row; height: 100dvh; min-height: 0px; display: flex; }
.app-layout__resizable { flex: 1 1 0%; min-width: 0px; height: 100%; min-height: 0px; display: flex; }
[data-app-layout][data-resizable] [data-slot="sidebar"], … .sidebar__offcanvas-wrapper { width: 100%; transition: none; }
.app-layout__mobile-aside-sheet[data-placement="right"] { border-radius: 0px; width: 100%; max-width: min(360px, 88vw); }
```
