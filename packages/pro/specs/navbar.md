# Navbar — clean-room implementation spec

Slug: `navbar` · Docs: https://heroui.pro/docs/react/components/navbar · Category: Navigation
Import (Pro): `import {Navbar, useNavbar} from "@heroui-pro/react";` (root export)
Storybook title (remake): `Pro/Navigation/Navbar`

Sources used: the public docs page text, the server-rendered markup of the 7 public demo pages
(scripts stripped, never read), the public demo stylesheet (CSSOM rules for `.navbar*`), and
runtime observation of the demos where the shared browser was available (see section 8).
I did not open or try to get around the paywalled example source.

---

## 1. Purpose

"A composable top navigation bar with hide-on-scroll, responsive mobile menu, and client-side
routing support." AppLayout composes it (AppLayout sets `data-in-app-layout="true"`).

---

## 2. Anatomy

```tsx
<Navbar>                               // <nav>  .navbar .navbar--{position}
  <Navbar.Header>                      // <header> .navbar__header --max-{w} --{size}
    <Navbar.MenuToggle />              // RAC ToggleButton (optional)
    <Navbar.Brand />                   // <div> (polymorphic via render)
    <Navbar.Content>                   // <div>
      <Navbar.Item>                    // <a href> or <button type="button"> (polymorphic)
        <Navbar.Label />               // <span> truncated text (optional)
      </Navbar.Item>
      <Navbar.Separator />             // OSS Separator orientation="vertical"
    </Navbar.Content>
    <Navbar.Spacer />                  // <div aria-hidden> flex: 1
  </Navbar.Header>
  <Navbar.Menu>                        // <div> rendered only while open (animated)
    <Navbar.MenuItem />                // <a href> or <button>; closes the menu on press
  </Navbar.Menu>
</Navbar>
```

| Part | Element | `data-slot` | BEM class(es) | Notes |
|---|---|---|---|---|
| `Navbar` | `<nav style="--navbar-height:4rem">` | `navbar` | `navbar navbar--{sticky\|static\|floating}` | `data-hidden="true"`, `data-menu-open="true"` only while true. With `hideOnScroll` the inline style also carries `transform:none` (spring target). |
| `Navbar.Header` | `<header>` | `navbar-header` | `navbar__header navbar__header--max-{sm..full} navbar__header--{sm\|md\|lg}` | max class comes before the size class |
| `Navbar.Brand` | `<div>` | `navbar-brand` | `navbar__brand` | demos: logo `<svg>` + `<span class="sr-only">` |
| `Navbar.Content` | `<div>` | `navbar-content` | `navbar__content` | |
| `Navbar.Item` | `<a href>` / `<button type="button">` | `navbar-item` | `navbar__item navbar__item--{size}` | `data-current="true"` + `aria-current="page"` when `isCurrent`. No `data-rac`, no `data-react-aria-pressable` in the SSR markup. |
| `Navbar.Label` | `<span>` | `navbar-label` | `navbar__label` | |
| `Navbar.Separator` | `<div role="separator" aria-orientation="vertical" data-orientation="vertical">` | `navbar-separator` | `separator separator--vertical separator--default navbar__separator` | OSS Separator |
| `Navbar.Spacer` | `<div aria-hidden="true">` | `navbar-spacer` | `navbar__spacer` | |
| `Navbar.MenuToggle` | `<button data-rac aria-label="Toggle navigation menu" aria-pressed>` | `navbar-menu-toggle` | `navbar__menu-toggle navbar__menu-toggle--{size}` | RAC ToggleButton, `data-selected="true"` while open |
| toggle icon (auto) | `<span>` | `navbar-menu-toggle-icon` | `navbar__menu-toggle-icon` | lines drawn with `::before` / `::after` |
| `Navbar.Menu` | `<div style="height:0px;opacity:0">` (initial) | `navbar-menu` | `navbar__menu` | not in the DOM while closed |
| `Navbar.MenuItem` | `<a href>` / `<button>` | `navbar-menu-item` | `navbar__menu-item navbar__menu-item--{size}` | `data-current` / `aria-current` like Item |

Icons inside items are expected to carry `data-slot="icon"` (the CSS sizes `> [data-slot=icon]`).

---

## 3. API (docs)

### `Navbar` — root `<nav>` + context provider; accepts all `<nav>` props
| Prop | Type | Default | Description |
|---|---|---|---|
| `position` | `"sticky" \| "static" \| "floating"` | `"sticky"` | How the navbar is anchored |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variants for header, items, menu toggle (and menu items) |
| `maxWidth` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "full"` | `"lg"` | Caps the header width via `--navbar-max-width` |
| `height` | `string` | `"4rem"` | Sets `--navbar-height` inline on the root |
| `hideOnScroll` | `boolean` | `false` | Hide on scroll down, reveal on scroll up; spring transform, layout intact |
| `parentRef` | `RefObject<HTMLElement \| null>` | window | Scroll container for `hideOnScroll` |
| `isMenuOpen` | `boolean` | – | Controlled menu state |
| `defaultMenuOpen` | `boolean` | `false` | Uncontrolled initial menu state |
| `onMenuOpenChange` | `(isOpen: boolean) => void` | – | Menu state callback |
| `shouldBlockScroll` | `boolean` | `true` | Lock body scroll while the menu is open |
| `navigate` | `(href: string) => void` | – | Client-side navigation for Item / MenuItem |

### `Navbar.Header`, `Navbar.Content`, `Navbar.Label`, `Navbar.Spacer` — plain elements, all native props.
### `Navbar.Brand` — `<div>` by default, `render` prop for polymorphism.
### `Navbar.Item` / `Navbar.MenuItem`
| Prop | Type | Default | Description |
|---|---|---|---|
| `href` | `string` | – | Renders `<a>`; otherwise `<button>` |
| `isCurrent` | `boolean` | `false` | `aria-current="page"` + `data-current="true"` |
| `forceReload` | `boolean` | `false` | Skip `navigate`, use `window.location.href` |
| `render` | `(props) => ReactElement` | – | Override the rendered element (framework `<Link>`) |

Navigation order: `Navbar.navigate` → `navigate` from an enclosing AppLayout → React Aria
`RouterProvider` → native navigation. External `http(s)://` links open in a new tab.
`MenuItem` closes the menu when pressed.

### `Navbar.Separator` — wraps OSS `Separator` with `orientation="vertical"`.
### `Navbar.MenuToggle` — wraps RAC `ToggleButton`, selection bound to `isMenuOpen`.
| `srLabel` | `string` | `"Toggle navigation menu"` | Screen-reader label (aria-label) |
| `children` | `ReactNode` | – | Custom icon; default is the animated hamburger/close icon |

### `Navbar.Menu` — rendered only while open; fills the viewport below the bar
(`calc(100dvh - var(--navbar-height))`).

### `useNavbar()` → `{height, isHidden, isMenuOpen, setMenuOpen, navigate}`

---

## 4. Styling (CSSOM of the demo stylesheet, `@layer components`)

Root `.navbar`: `position: relative; z-index: 40; display: flex; flex-direction: column; width: 100%;
background: var(--background); --navbar-height: 4rem; --navbar-max-width: 1024px;
--navbar-transition-duration: .3s`.
- `.navbar--sticky`: `position: sticky; top: 0`. `.navbar--static`: `position: static`.
- `.navbar--floating`: `position: sticky; top: 2×spacing; margin-inline: 2×spacing;
  border-radius: calc(var(--radius) * 2); border: 1px solid var(--border); box-shadow: var(--surface-shadow)`.
- `[data-hidden=true]`: `pointer-events: none`. `[data-menu-open=true]`: `border-bottom-color: transparent`.
- `.navbar--static[data-menu-open=true]`: `position: relative` (containing block for the menu).
- `.navbar[data-in-app-layout=true]`: `z-index: auto; width/height: 100%; position: static`; with any
  position class also `box-shadow: none; border: none; border-radius: 0; margin: 0`.

Header `.navbar__header`: `display: flex; align-items: center; gap: 4×spacing; width: 100%;
padding-inline: 6×spacing; max-width: var(--navbar-max-width); height: var(--navbar-height); margin-inline: auto`.
- `--sm`: `gap: 3×spacing; padding-inline: 4×spacing; --navbar-height: 3rem`
- `--lg`: `gap: 5×spacing; padding-inline: 8×spacing; --navbar-height: 5rem`
- `--max-sm|md|lg|xl|2xl|full`: `--navbar-max-width: 640px|768px|1024px|1280px|1536px|100%`
- Quirk kept: the size classes re-declare `--navbar-height` on the header, so the header height
  follows the size class even when `height` is passed (the inline value lives on the root). The menu
  (a child of the root) uses the root value.

Parts:
- `.navbar__brand`: flex, items-center, gap 2×spacing, shrink-0.
- `.navbar__content`: flex, items-center, gap 1×spacing.
- `.navbar__spacer`: `flex: 1`.
- `.navbar__separator`: `height: 6×spacing; align-self: center; border-color: var(--separator)`.
- `.navbar__label`: truncate.

Item `.navbar__item`: `position: relative; display: flex; align-items: center; gap: 2×spacing;
padding: 6px 12px` (literal px, not spacing-based) `; border-radius: calc(var(--radius) * 1);
font: var(--text-sm) / normal weight; color: var(--muted); cursor: var(--cursor-interactive);
outline: none; tap-highlight transparent`. **No transition.**
- hover (`@media (hover:hover)`, `:hover` / `[data-hovered=true]`) → `color: var(--foreground)`
- `:active`, `[data-pressed=true]`, `[data-current=true]` → `color: var(--foreground)`
- focus-visible → OSS focus ring (2px `--focus`, offset `--ring-offset-width` in `--background`)
- `:disabled`, `[aria-disabled=true]` → disabled opacity/cursor, pointer-events none
- `> [data-slot=icon]` → 5×spacing square, shrink-0
- `--sm`: text-xs, `padding: 4px 8px`, icon 4×spacing. `--lg`: text-base, `padding: 8px 16px`, icon 6×spacing.

Menu toggle `.navbar__menu-toggle`: `relative flex center; size: 9×spacing; radius calc(var(--radius)*1)`.
hover → `bg: var(--default)`; active/pressed → `bg: var(--default-hover)`; focus ring; disabled.
`--sm` 7×spacing, `--lg` 11×spacing.
Icon `.navbar__menu-toggle-icon`: `pointer-events: none; flex column center; width 6×spacing; height 100%`.
`::before/::after`: `content:""; display:block; height:1px; width: 6×spacing; background: currentColor;
transition: transform .15s` (default ease). Closed: `translateY(-4px) rotate(0)` / `translateY(4px) rotate(0)`.
Selected (`[data-selected=true]`): `translateY(.5px) rotate(45deg)` / `translateY(-.5px) rotate(-45deg)`.
`[data-pressed=true] .icon { opacity: .7 }`. Reduced motion: `transition: none`.

Menu `.navbar__menu`: `position: absolute; top: 100%; inset-inline: 0; display: flex; flex-direction: column;
gap: 1×spacing; padding: 2×spacing 6×spacing 6×spacing; background: var(--background);
overflow: hidden auto` + OSS scrollbar tokens. Height/opacity are animated inline (no CSS height).

Menu item `.navbar__menu-item`: `flex items-center; gap 3×spacing; padding 10px 12px; radius
calc(var(--radius)*1); text-base; font-weight medium; color: var(--foreground)`.
hover → `bg: var(--default)`; active/pressed → `bg: var(--default-hover)`;
`[data-current=true]` → `bg: var(--default); color: var(--foreground)`; focus ring; disabled; icon 5×spacing.
`--sm`: text-sm, `8px 10px`, icon 4. `--lg`: text-lg, `12px 16px`, icon 6.

CSS variables: `--navbar-height` (4rem, sm 3rem, lg 5rem; `height` prop inline on the root),
`--navbar-max-width` (1024px default), `--navbar-transition-duration` (.3s, reserved, unused),
`--spacing` (override to scale gaps / icon sizes; item paddings are px and do not scale).

---

## 5. Demos (7) and remake stories

| Demo | URL slug | Remake story | Structure |
|---|---|---|---|
| Usage | `navbar-default` | `Default` | bordered rounded wrapper; `position="static"`; Brand, Spacer, Content (4 links, 2nd current), Spacer, Content (search + bell icon items, Separator, avatar item) |
| Docs Site | `navbar-docs-site` | `DocsSite` | MenuToggle `md:hidden`, Brand, Content `hidden gap-0 md:flex` (3 links `px-2`), Spacer, Content `hidden md:flex` (OSS SearchField secondary `w-[200px]`, group `h-8`, input `w-16`, Kbd ⌘K; Pro Segment `sm` icon-only theme switcher), Menu |
| With Dropdowns | `navbar-with-dropdowns` | `WithDropdowns` | MenuToggle `md:hidden`, ghost Button team switcher (Dropdown), Separator `hidden h-4 md:block`, Content (4 links), Spacer, Content (2 icon items), icon-only ghost Button avatar (Dropdown), Menu |
| Hide on Scroll | `navbar-hide-on-scroll` | `HideOnScroll` | `relative h-[400px] overflow-y-auto` wrapper as `parentRef`; sticky navbar with `border-b border-border`; 20 surface cards below |
| Dashboard | `navbar-dashboard` | `Dashboard` | header `gap-2`; Brand `mr-1` (mark `size-5`); slash dividers (`text-border size-4`); InlineSelect workspace (avatar) / project; Spacer; cost label; Separator `hidden h-4 md:block`; InlineSelect timezone; Content (bell item + avatar ghost icon Button) |
| With Menu | `navbar-with-menu` | `WithMenu` | wrapper `bg-background overflow-visible` (no border); Content `hidden sm:flex`; actions; MenuToggle always visible; Menu with 3 icon MenuItems; page content below |
| Compact | `navbar-compact` | `Compact` | wrapper `--spacing: 0.22rem`; `height="2.75rem" size="sm"`; header `text-xs`; 16px logo; Content `hidden gap-4 md:flex` with icon items `gap-1.5 text-xs` (icons `size-3.5`); time label; "create" item; Content `gap-1` with `size-7` icon items and avatar Button |

Extra remake stories: `Floating` (Positioning section, code-only in the docs) and
`ProgrammaticControl` (useNavbar section).

---

## 6. Dependencies

- OSS `@heroui/react`: `Separator` (part of the component). Stories: `Avatar`, `Button`, `Dropdown`,
  `SearchField`, `Kbd`, `Select`/`ListBox`, `Label`.
- Pro: `Segment`, `InlineSelect` (stories only; the Dashboard story uses InlineSelect like the demo:
  custom trigger content, popovers `w-[220px]` / `w-[200px]`, timezone rows with a muted detail).
- React Aria: `ToggleButton` (RAC), `usePreventScroll`, `useHover`, `useFocusRing`, `mergeProps`,
  router helpers from `react-aria/private/utils/openLink` (`useRouter`, `shouldClientNavigate`).
- Motion: Pro uses a spring library for the menu height and the hide transform (inline styles such as
  `transform:none`, `height:0px;opacity:0`). The remake has its own analytic spring
  (`spring.ts`) turned into a CSS `linear()` easing and played with the Web Animations API.

---

## 7. Remake notes / deviations

- `NavbarLayoutContext` (exported) is the hook-up point for AppLayout: `{isInAppLayout, navigate}`.
  It sets `data-in-app-layout="true"` and provides the inherited `navigate`.
- `isDisabled` on Item/MenuItem is an addition (button `disabled` / anchor `aria-disabled`);
  the Pro CSS already styles both.
- Items are plain elements like the original (no React Aria hooks), so states are pseudo-class driven;
  the CSS also accepts `data-hovered` / `data-pressed` / `data-focus-visible` for custom `render` elements.
- Motion runs on WAAPI with a CSS `linear()` spring easing instead of a JS animation library.

---

## 8. Runtime observations (live probing of the demos, light + dark)

Hydrated DOM / interaction
- `Navbar.Item` / `Navbar.MenuItem` stay plain `<a>` / `<button>` after hydration: hovering adds no
  `data-hovered`, there is no `data-rac` and no `data-react-aria-pressable`. All states come from
  `:hover`, `:active`, `:focus-visible` and `data-current`. The remake renders the same plain elements.
- `Navbar.MenuToggle` is a RAC ToggleButton: `aria-pressed`, `data-selected="true"` while open,
  `data-pressed` / `data-hovered` / `data-focus-visible` from RAC.
- Escape does not close the menu (real key press tested). There is no outside-click handling (the
  menu covers the page below the bar). Focus is not moved into the menu.
- In the With Menu demo the item click handler prevents the default (no hash change) and the menu
  stays open while `data-current` moves (desktop items too). The remake closes the menu after a press
  unless the item's own `onClick` called `preventDefault()`, which reproduces this; the WithMenu story
  does the same (local `current` state + `preventDefault`).
- With the menu open, none of the demos (With Menu, Docs Site, With Dropdowns) locks scrolling: no
  style/attribute mutation outside the navbar, `window.scrollTo` still scrolls, wheel/touchmove/keydown
  are not prevented. The remake follows the docs default (`true`, React Aria `usePreventScroll`).

Mobile menu motion
- Mount: inline `height: 0px; opacity: 0`. Final inline style:
  `height: calc(100dvh - var(--navbar-height)); opacity: 1;`.
- Enter: the library animates the dvh number inside `calc(Xdvh - var(--navbar-height))` from 0 to 100,
  with opacity on the same spring (it clamps at 1). Fitted spring: **stiffness 300, damping 30, mass 1**
  (error 5e-7 over 22 samples). Peak overshoot is about 0.4% at ~350 ms, and it settles at ~500 ms.
  Because the box is `border-box` with 32px vertical padding, its visible height stays at 32px until
  `X·1dvh > 32px + navbar height`.
- Exit: WAAPI-style tween of **200 ms `ease-out`** for both `height` (to `calc(0dvh - …)`) and
  `opacity` (to 0). The element is removed after that (~233 ms after the click).
- Height trails opacity by one frame (~16 ms) in both directions: opacity runs on WAAPI right away,
  the JS-driven height starts on the next frame. Re-checked by sampling height vs opacity per frame
  (Pro open: opacity .422 at x=.311 of the dvh range, .777 at x=.712; close: .752 at x=.871).
- Remake: own analytic spring → CSS `linear()` easing played with `element.animate()`, keyframes
  `calc(0dvh - var(--navbar-height))` → `calc(100dvh - var(--navbar-height))` (var() inside WAAPI
  keyframes verified in Chromium). Exit uses the same 200 ms ease-out. Opacity and height are two
  animations; height gets a one-frame `delay` with `fill: backwards`, which reproduces the lag above
  (remake open: .458 at x=.345, .796 at x=.731; close: .74 at x=.865; removed at ~233 ms).

Hide on scroll
- Inline `transform: none` while shown, and `transform: translateY(-100%)` + `data-hidden="true"` while hidden.
- Hide: any downward scroll (even 1px) once `scrollTop > navbar offsetHeight` (65px in the demo: 64px +
  1px border; 65 → stays, 66 → hides).
- Reveal: **any** upward scroll, even 1px (re-measured: 300 → 299 reveals; 1px steps upward keep
  revealing). A downward scroll at or below the threshold never hides.
- Spring fitted to the reveal curve: **stiffness 400, damping 40** (critically damped, no overshoot,
  ~476 ms to rest). The remake uses the same values. Its curve is ~7 ms later because of React's commit.

Measured metrics (default demo, md): header 64px, padding-inline 24px, gap 16px; items 32px tall
(6/12px padding, 14/20 text); icon items 44×32 with 20px icons; avatar item 52×40; separator 1×24.
Compact demo (`--spacing: .22rem`, `size="sm"`, `height="2.75rem"`): the bar is **48px** (header `--sm`
re-declares 3rem); gaps 10.56/14.08px; icon-only items 24.6px (`size-7`). The remake stories match these
numbers apart from text widths (own content).

Dark mode: every colour is a token (`--background` bar/menu, `--muted` items, `--foreground`
current/hover, `--default` current menu item / toggle hover, `--default-hover` pressed,
`--separator`). The values match the remake's theme in both modes.

---

## Appendix A — raw CSSOM (reference only, not used as implementation)

```css
.navbar[data-in-app-layout=true]{z-index:auto;width:100%;height:100%;position:static}
.navbar[data-in-app-layout=true].navbar--sticky,.navbar[data-in-app-layout=true].navbar--static,.navbar[data-in-app-layout=true].navbar--floating{box-shadow:none;border:none;border-radius:0;margin:0;position:static}
.navbar{z-index:40;background-color:var(--background);--navbar-height:4rem;--navbar-max-width:1024px;--navbar-transition-duration:.3s;flex-direction:column;width:100%;display:flex;position:relative}
.navbar--sticky{position:sticky;top:0}
.navbar--static{position:static}
.navbar--floating{top:calc(var(--spacing)*2);margin-inline:calc(var(--spacing)*2);border-radius:calc(var(--radius)*2);border-width:1px;border-color:var(--border);box-shadow:var(--surface-shadow);position:sticky}
.navbar[data-hidden=true]{pointer-events:none}
.navbar[data-menu-open=true]{border-bottom-color:#0000}
.navbar--static[data-menu-open=true]{position:relative}
.navbar__header{align-items:center;gap:calc(var(--spacing)*4);width:100%;padding-inline:calc(var(--spacing)*6);max-width:var(--navbar-max-width);height:var(--navbar-height);margin-inline:auto;display:flex}
.navbar__header--max-sm{--navbar-max-width:640px} … --max-full{--navbar-max-width:100%}
.navbar__header--sm{gap:calc(var(--spacing)*3);padding-inline:calc(var(--spacing)*4);--navbar-height:3rem}
.navbar__header--lg{gap:calc(var(--spacing)*5);padding-inline:calc(var(--spacing)*8);--navbar-height:5rem}
.navbar__item{…;padding:6px 12px;color:var(--muted);font-size:var(--text-sm);font-weight:var(--font-weight-normal);border-radius:calc(var(--radius)*1)}
.navbar__item--sm{font-size:var(--text-xs);padding:4px 8px} .navbar__item--lg{font-size:var(--text-base);padding:8px 16px}
.navbar__menu-toggle-icon:before,.navbar__menu-toggle-icon:after{height:1px;width:calc(var(--spacing)*6);background-color:currentColor;transition:transform .15s;display:block}
.navbar__menu{gap:var(--spacing);background-color:var(--background);padding-inline:calc(var(--spacing)*6);padding-top:calc(var(--spacing)*2);padding-bottom:calc(var(--spacing)*6);inset-inline:0;flex-direction:column;display:flex;position:absolute;top:100%;overflow:hidden auto}
.navbar__menu-item{gap:calc(var(--spacing)*3);padding:10px 12px;font-size:var(--text-base);font-weight:var(--font-weight-medium);color:var(--foreground)}
```
