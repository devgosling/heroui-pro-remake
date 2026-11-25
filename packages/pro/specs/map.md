# Map (`map`) - implementation spec

Source of truth: the public docs page https://heroui.pro/docs/react/components/map (anatomy, API tables, CSS
classes, CSS variables, localization) plus the rendered DOM, CSSOM, computed styles, MapLibre runtime state
(style layers/sources, marker/popup options, camera calls) and observed behaviour of the 10 public demo pages
(light + dark), observed 2026-11-24/25. No paywalled source, JS chunk, source map or "Copy prompt" endpoint was read.

## 1. Purpose

A MapLibre GL surface with HeroUI-styled markers (dot, label, tooltip, popup), standalone popups, a corner control
stack (zoom, compass, locate, fullscreen, custom buttons), and data layers (route, curved arcs, clusters). It ships no
tile provider: the demos pass OpenFreeMap styles through `styles` (no API key).

Subpath-only import because it needs the optional `maplibre-gl` peer: `import {Map, useMap} from "@heroui/pro/map"`.

## 2. Anatomy

```tsx
<Map center={[lng, lat]} styles={{light, dark}} zoom={13}>
  <Map.Route coordinates={route} />
  <Map.Arc data={arcs} />
  <Map.ClusterLayer data={points} />
  <Map.Marker latitude={..} longitude={..}>
    <Map.MarkerContent>
      <Map.MarkerDot />
      <Map.MarkerLabel>Start</Map.MarkerLabel>
    </Map.MarkerContent>
    <Map.MarkerTooltip>..</Map.MarkerTooltip>
    <Map.MarkerPopup>..</Map.MarkerPopup>
  </Map.Marker>
  <Map.Popup latitude={..} longitude={..}>..</Map.Popup>
  <Map.Controls>
    <Map.ZoomControl /> <Map.CompassControl /> <Map.LocateControl /> <Map.FullscreenControl />
  </Map.Controls>
</Map>
```

| Part | Element / primitive | `data-slot` | BEM class |
| --- | --- | --- | --- |
| Root | `<div>` = MapLibre container (gets `maplibregl-map`) | `map` | `.map` |
| Loader | `<div>` with OSS `Spinner` (`size="sm" color="current"`, `aria-label="Loading"`) | `map-loader` / `map-loader-spinner` | `.map__loader` / `.spinner .spinner--current .spinner--sm .map__loader-spinner` |
| Marker host | MapLibre marker element (`maplibregl-marker maplibregl-marker-anchor-center`) | `map-marker` | `.map__marker` |
| MarkerContent | `<div>` portalled into the host | `map-marker-content` | `.map__marker-content` |
| MarkerDot | `<span>` (style `--map-marker-color` / `--map-marker-ring-color`) | `map-default-marker` | `.map__default-marker` |
| MarkerLabel | `<div data-position="top\|bottom">` | `map-marker-label` | `.map__marker-label .map__marker-label--top\|--bottom` |
| MarkerTooltip | MapLibre `Popup` -> `<div>` container -> `<div>` | `map-marker-tooltip` | `.map__tooltip` |
| Popup / MarkerPopup | MapLibre `Popup` -> `<div>` container -> `<div data-close-button="true">` | `map-popup` | `.map__popup-content` |
| Popup close button | OSS `CloseButton` (`aria-label="Close popup"`) | `map-popup-close-button` | `.close-button .close-button--default .map__popup-close-button` |
| Controls | `<div data-position="bottom-right">` | `map-controls` | `.map__controls .map__controls--<position>` |
| ControlGroup | OSS `ButtonGroup` (vertical, RAC `Group`, `role="group"`) | `map-control-group` | `.button-group .button-group--vertical .map__control-group` |
| ControlButton | OSS `Button` (`isIconOnly size="sm" variant="tertiary"`) | `map-control-button` | `.button .button--icon-only .button--sm .button--tertiary .map__control-button` |
| ControlSeparator | OSS `ButtonGroup.Separator`, first child of the later button | `map-control-separator` | `.button-group__separator .map__control-separator` |
| Control icon | `<svg>` 16px | `map-control-icon` | `.map__control-icon` |
| Locate spinner | OSS `Spinner` while locating | `map-control-spinner` | `.map__control-spinner` |
| Compass needle | `<svg viewBox="0 0 24 24">` with 4 `path[data-needle=north-right\|north-left\|south-right\|south-left]`, inline `transform: rotateX(<pitch>deg) rotateZ(<-bearing>deg)` | `map-compass-icon` | `.map__compass-icon` |

DOM order inside `.map`: loader (React, only while loading) -> `.maplibregl-canvas-container` (canvas + marker hosts)
-> `.maplibregl-control-container` (attribution) -> `.map__controls` (React) -> `.maplibregl-popup` elements.
React children render only once the MapLibre instance exists (SSR output = `.map[data-loading]` + loader).

Popup DOM: `.maplibregl-popup.maplibregl-popup-anchor-<auto>` (style `max-width: none`) > `.maplibregl-popup-tip`
(hidden) + `.maplibregl-popup-content` > `<div>` (portal container, no attributes) > `.map__popup-content`.

## 3. API (docs + observed)

### Map
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `center` | `[number, number]` | - | initial `[lng, lat]` |
| `zoom` | `number` | - | initial |
| `mapStyle` | `string \| StyleSpecification` | - | overrides `styles` |
| `styles` | `{light?, dark?}` | - | theme-aware |
| `theme` | `"light" \| "dark"` | detected | `data-theme` (`dark`, `light`, `*-dark`, `*-light`) on `<html>` -> `dark`/`light` class -> `prefers-color-scheme` |
| `viewport` | `Partial<MapViewport>` | - | controlled (`jumpTo` when it differs) |
| `onViewportChange` | `(viewport) => void` | - | fired on every `move` |
| `isLoading` | `boolean` | `false` | shows the veil |
| `workerUrl` | `string` | - | `setWorkerUrl()` before creating the map |
| ...MapLibre `MapOptions` | | | except `container` / `style` (e.g. `pitch`, `bearing`, `interactive`) |

Observed MapLibre defaults set by Pro: `attributionControl: {compact: true}`, `renderWorldCopies: false`
(maxPitch 60, minZoom -2 etc. are MapLibre defaults). Root states: `data-loading="true"` + loader until the
first `load` (or while `isLoading`), `data-loaded="true"` once the current style is loaded; the loader is removed
instantly (no fade). Route / Arc / ClusterLayer (and the demos' own `useMap` layers) are only added once loaded:
in a background tab (no render, so no `load`) Pro's style already holds its 55 basemap layers but no route yet.
Theme switch (measured on Pro, fleet + coverage demos): `setStyle(url, {diff: false})` at ~6 ms, `data-loaded`
removed in the same tick, **no** loader / `data-loading`; `style.load` ~25-55 ms (custom layers still absent);
`data-loaded="true"` comes back on the first `idle` of the new style (~670 ms) and the custom layers are re-added
right after it. The remake mirrors this: `isLoaded` = first `load` happened and the requested style finished
loading (`load`, or the first `idle` after a swap).

### Map.Marker
`latitude`, `longitude`, `aria-label`, `draggable=false`, `onClick(MouseEvent)`, `onDragEnd({lat, lng})`
(+ remake extras `anchor="center"`, `offset`, `className`). MapLibre marker: anchor `center`, offset 0. With a
`Map.MarkerPopup`: `role="button"`, `tabindex="0"`, `aria-expanded`; Enter/Space toggle (docs). Without
`Map.MarkerContent` the default dot is rendered.

### Marker parts
- `Map.MarkerDot`: `color`, `ringColor` -> inline custom properties.
- `Map.MarkerLabel`: `position="top" | "bottom"` (default top).
- `Map.MarkerTooltip`: MapLibre popup `{offset: 16, closeButton: false, closeOnClick: true, maxWidth: "none"}`, shown on
  marker `mouseenter`, removed on `mouseleave` immediately (no delay, no animation).
- `Map.MarkerPopup`: `closeButton`, `closeButtonLabel` (+ MapLibre popup options).

### Map.Popup
`latitude`, `longitude`, `closeButton=false`, `closeButtonLabel="Close popup"`, `onClose`, plus MapLibre popup options.
Observed options: `{closeButton: false, closeOnClick: false, focusAfterOpen: false, maxWidth: "none", offset}`; demos
pass `offset` 16/18/22 (16 used as the default). Anchor is MapLibre auto.

### Map.Controls
`position` `"top-left" | "top-right" | "bottom-left" | "bottom-right"` (default bottom-right). Children:
`ZoomControl` (`zoomInLabel`/`zoomOutLabel`, `zoomIn/zoomOut({duration: 300})`), `CompassControl` (`label`,
`resetNorthPitch({duration: 300})`), `LocateControl` (`label`, geolocation -> `flyTo`), `FullscreenControl` (`label`,
container fullscreen), `ControlGroup`, `ControlButton`, `ControlSeparator`. Each built-in control is its own group.

### Map.Route
`coordinates`, `color`, `width`, `opacity`, `dashArray`. Source `route-<useId>-source` (geojson Feature LineString),
layer `route-<useId>-layer` type line, layout `{line-cap: round, line-join: round}`, paint
`{line-color, line-opacity, line-width[, line-dasharray]}`; defaults read from `--map-route-color` (#4285f4),
`--map-route-opacity` (.8), `--map-route-width` (3).

### Map.Arc
`data: {id, from, to, ...}[]`. Source `arc-<id>-source` (FeatureCollection, `promoteId: "id"`, properties = datum
fields + resolved `color` + `width`), line layer `arc-<id>-layer` with
`line-color ["get","color"]`, `line-opacity case(hover) 1 : 0.74`, `line-width case(hover) 5 : ["get","width"]`, and
`arc-<id>-hit-layer` (transparent, width 18). Geometry: 65 points (64 segments) of a quadratic Bezier in lng/lat
space whose control point is `midpoint + perpendicular(-dy, dx) * 0.34 * length` (measured on all 6 demo arcs).
Hover: feature-state `hover`, canvas `cursor: pointer`. Default width 2.5 (5 of 6 demo arcs), one arc 3.5.

### Map.ClusterLayer
`data` (FeatureCollection or URL). Source `cluster-<id>-source` `{cluster: true, clusterMaxZoom: 14, clusterRadius}`
(demo 42). Layers: `-clusters` (circle, `circle-color step(point_count) c0, t0, c1, t1, c2`, opacity .85,
`circle-radius step 20/30/40`, stroke #fff 1), `-cluster-count` (symbol `{point_count_abbreviated}`, size 12, #fff),
`-unclustered-point` (circle radius 6, stroke #fff 2, color from a `match` expression in the demo). Cluster click ->
`getClusterExpansionZoom` + `easeTo({center, zoom})` (500 ms default). Point click -> demo opens a `Map.Popup`.

## 4. Styling / tokens (observed, light + dark)

| Token | Value |
| --- | --- |
| `--map-control-size` | `calc(var(--spacing) * 8)` (32px) |
| `--map-control-offset` | `calc(var(--spacing) * 2)` (8px) |
| `--map-control-attribution-clearance` | `calc(var(--spacing) * 12)` (48px; bottom positions add it) |
| `--map-popup-max-width` | `248px` |
| `--map-marker-color` / `--map-marker-ring-color` | `var(--accent)` / `var(--surface)` |
| `--map-route-color` / `-opacity` / `-width` | `#4285f4` / `.8` / `3` |

- `.map`: relative, 100% x 100%, overflow hidden, `bg-default`. `.map.maplibregl-map` carries MapLibre's own font
  (`12px/20px "Helvetica Neue", Arial, Helvetica, sans-serif`), so labels/popups/tooltips inherit it (Pro behaviour).
- Pro does not load `maplibre-gl.css`; it re-declares the needed MapLibre rules scoped under `.map` (canvas,
  interactive cursors, touch-action, marker/popup positioning + anchor flex directions, popup chrome reset + hidden tip,
  control corners, compact attribution). The attribution stays light in dark mode (white 82 %, text `oklch(20% 0 0)`,
  info button `oklch(8% 0 0)` with a white "i" in a 20px circle); its computed radius is 0.
- Loader: absolute inset 0, z-10, `bg-overlay/50`, `backdrop-blur-xs`, spinner `text-muted`.
- Default marker: 16px circle, 2px ring border, `--overlay-shadow`. Label: 10px / medium / foreground, nowrap,
  centred, 4px above (top) or below (bottom).
- Popup surface: `bg-overlay`, `p-4` (`pr-10` with close button), `text-sm`, radius `min(32px, var(--radius-3xl))`,
  `--overlay-shadow`, max-width `--map-popup-max-width`, `overflow-wrap: anywhere`. Close button 20px at top/right 8px,
  icon 12px.
- Tooltip: `bg-foreground text-background`, `text-xs` (12/16), `px-2 py-1`, radius `calc(var(--radius) * .75)`,
  `--overlay-shadow`, `pointer-events: none`.
- Controls: absolute z-10 column, gap 6px; buttons 32px, `text-foreground` (OSS tertiary bg), vertical ButtonGroup
  radii (24px top / bottom), separator 16x1 at 8px with 15 % current colour. Icons 16px (the OSS `.button svg` rule
  also sizes the compass svg to 16px). Compass needle north `red-500`/`red-400`, south `muted` at 70 %/38 %,
  `transition: transform 200ms`, `transform-style: preserve-3d`.

## 5. Behaviour / timings
- Zoom buttons: +/-1 zoom over 300 ms; compass: `resetNorthPitch({duration: 300})` (bearing and pitch to 0).
- Compass transform follows `rotate` / `pitch` events.
- Tooltip shows on `mouseenter` (~2 ms), hides on `mouseleave`.
- Arc hover: feature-state + pointer cursor; no popup in the demo.
- Cluster click: ease to expansion zoom (~480 ms).
- Theme change: one `setStyle(..., {diff: false})`; `data-loaded` drops at once and returns on the first `idle` of the new
  style (~670 ms), custom layers are re-added then. No loader during a swap.
- Zoom buttons call `zoomTo(zoom ± 1, {duration: 300})` (same as `zoomIn/zoomOut({duration: 300})`).
- Clicking a marker also fires the map `click`; the demos select the clicked item (popup moves with `setLngLat`,
  same popup element). Map clicks outside markers do not close `Map.Popup` (`closeOnClick: false`). Closing via the
  close button leaves focus on `body`.

## 6. Demo list (all reproduced as stories, own data)
| Pro demo | Story | Structure |
| --- | --- | --- |
| map-default | `Default` | route + 3 labelled dots (green start); clicking a dot opens its closable popup (offset 18, second stop selected initially) + zoom/compass/fullscreen, pitch 26, overlay stats card |
| map-live-visitors | `LiveVisitors` | 500px tall, OSS `Avatar` markers (`ring-2 ring-white`) with tooltips, purple count bubbles, bottom "N online" pill |
| map-property-listings | `PropertyListings` | price-pill markers (selected inverted), list card, closable popup offset 22, zoom only |
| map-live-tracking | `LiveTracking` | dashed grey full route (opacity .6, dash 1.5/1.5) + blue travelled route (w4, .9), courier animated from 0 % on mount (~2 %/s), avatar card + progress, zoom/compass, pitch 30 |
| map-store-locator | `StoreLocator` | 4 coloured labelled dots, list card (3 rows), closable popup offset 18, zoom + locate, pitch 18 |
| map-fleet-dispatch | `FleetDispatch` | route (w4, .78) + 3 vehicles, popup, zoom/compass/fullscreen, pitch 32 |
| map-coverage-zones | `CoverageZones` | custom fill (.18) + line (.9, w2) layers through `useMap`, centre dots with % labels, zoom/compass |
| map-heatmap | `Heatmap` | custom heatmap layer through `useMap` (4-stop colour ramp, radius 18->40), gradient legend card, zoom only |
| map-flight-paths | `FlightPaths` | `Map.Arc` (6 arcs, one wider) + airport dots, stats + line legend card, zoom/compass, zoom 1.9 |
| map-incident-monitor | `IncidentMonitor` | `Map.ClusterLayer` (radius 42, thresholds 4/8, severity `match`), popup on point click, zoom + fullscreen |

## 7. Dependencies
- `maplibre-gl` (installed 6.19.0): `Map`, `Marker`, `Popup`, `setWorkerUrl`.
- OSS `@heroui/react`: `Spinner`, `CloseButton`, `Button`, `ButtonGroup` (+ `Separator`), `IconPlus`, `IconMinus`.
- Vite pre-bundling breaks MapLibre's `import.meta.url` worker lookup, so the stories pass
  `workerUrl` from `maplibre-gl/dist/maplibre-gl-worker.mjs?url` (Pro's demos load the worker from jsDelivr).

## 8. Remake decisions / deviations
- `useMap()` hook (`{map, isLoaded, theme}`) is exported for custom layers (the coverage/heatmap demos
  add layers with fixed ids, so Pro exposes an equivalent); `isLoaded` turns false during a style swap, exactly when
  Pro drops `data-loaded`.
- Defaults that the demos always overrode were picked as: `Map.Popup`/`MarkerPopup`/`MarkerTooltip` offset 16,
  `ClusterLayer` `clusterRadius` 50 and thresholds `[100, 750]`, `Arc` curvature .34 / width 2.5 / opacity .74.
- Locate / fullscreen / compass icons are own stroked SVGs drawn on the same geometry as the Pro glyphs (ring r 4.75 +
  1.5 px ticks + r 1.75 dot; corner brackets with 3.25 px diagonals); plus/minus are the OSS gravity-ui icons.
- Fullscreen swaps to an "exit" glyph while active; the locate button sets `aria-busy` while locating.
- `.map__marker:focus-visible` uses `status-focused` (Pro shows the UA outline).
- Style objects are compared by value (inline style objects do not reload the map every render).

## Appendix: raw CSSOM (Pro, `@layer components`, reference only)

```
.map { --map-control-size: calc(var(--spacing)*8); --map-control-offset: calc(var(--spacing)*2);
  --map-control-attribution-clearance: calc(var(--spacing)*12); --map-popup-max-width: 248px;
  --map-marker-color: var(--accent); --map-marker-ring-color: var(--surface); --map-route-color: #4285f4;
  --map-route-opacity: .8; --map-route-width: 3; background-color: var(--default); width:100%; height:100%;
  position:relative; overflow:hidden }
.map__loader { z-index:10; backdrop-filter: blur(var(--blur-xs)); background: color-mix(in oklab, var(--overlay) 50%, transparent);
  display:flex; align-items:center; justify-content:center; position:absolute; inset:0 }
.map__loader-spinner { color: var(--muted) }
.map__marker { display:flex; align-items:center; justify-content:center }
.map__marker-content { cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative }
.map__default-marker { 16px; border 2px var(--map-marker-ring-color); bg var(--map-marker-color); box-shadow var(--overlay-shadow); radius full }
.map__marker-label { pointer-events:none; left:50%; translate:-50%; font-size:10px; font-weight:500; nowrap; color foreground; absolute }
.map__marker-label--top { margin-bottom: var(--spacing); bottom:100% }  --bottom { margin-top: var(--spacing); top:100% }
.map__popup-content { min-width:0; padding:16px; text-sm; bg overlay; radius min(32px, var(--radius-3xl)); overlay-shadow;
  color foreground; max-width var(--map-popup-max-width); overflow-wrap:anywhere; relative } > * { min-width:0; max-width:100% }
  [data-close-button=true] { padding-right: 40px }
.map__popup-close-button { top:8px; right:8px; z-index:10; 20px; absolute } [data-slot=close-button-icon] { 12px }
.map__tooltip { pointer-events:none; radius calc(var(--radius)*.75); px 8px; py 4px; text-xs; bg foreground; overlay-shadow;
  color background; max-width var(--map-popup-max-width) }
.map__controls { z-index:10; gap:6px; flex column; absolute } --top-left/right { top/left|right: offset }
  --bottom-left/right { bottom: calc(offset + clearance) }
.map__control-button { color foreground } .map__control-button.button { size/min-width var(--map-control-size); padding 0 }
.map__control-icon, .map__control-spinner { 16px }  .map__compass-icon { 20px; transition transform .2s; preserve-3d }
  needles: north-right red-500, north-left red-400, south-right muted 70%, south-left muted 38%
.map.maplibregl-map { font: 12px/20px "Helvetica Neue", Arial, Helvetica, sans-serif }
.map .maplibregl-ctrl-attrib { px 8px; radius var(--radius-full) (undefined -> 0); color oklch(.2 0 0); bg white/.82; margin 0; line-height 20px }
  .maplibregl-compact { content-box; min-height 20px; padding 2px 28px 2px 8px; relative }
.map .maplibregl-ctrl-attrib-button { 24px; absolute top/right 0; color oklch(.08 0 0) } ::before { content "i"; 20px circle; bg oklch(.08 0 0); white bold 14px }
.map .maplibregl-ctrl-* corners { absolute z-10 pointer-events none } .maplibregl-ctrl { margins 10px, float }
.map .maplibregl-popup-content { bg transparent; radius 0; padding 0; shadow none; pointer-events auto } .maplibregl-popup-tip { display none }
```
