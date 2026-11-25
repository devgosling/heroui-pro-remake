# Carousel — clean-room implementation spec

Slug: `carousel` · Docs: https://heroui.pro/docs/react/components/carousel · Category: Data display
Import (Pro): `import {Carousel} from "@heroui-pro/react/carousel";` (**subpath-only**: depends on the
optional `embla-carousel` / `embla-carousel-react` peers). Remake: `@heroui/pro/carousel`.

Sources used: public docs text, the rendered DOM / CSSOM / computed styles of the six public demo
pages (light + dark), runtime probing (clicks, key events, MutationObserver timings), the public
Storybook index (story list only) and the OSS HeroUI source in this repo. The paywalled example
source was not opened.

---

## 1. Purpose

Content browser for a collection of images or items: an Embla-driven slide viewport with optional
previous/next arrows, pagination dots and a thumbnail strip.

## 2. Anatomy

```tsx
<Carousel>                                 // div[role=region][aria-roledescription=carousel][tabindex=0]
  <Carousel.Content>                       // div.viewport-wrapper > div.viewport (Embla root) > div.content (Embla container)
    <Carousel.Item>{/* ... */}</Carousel.Item>   // div[role=group][aria-roledescription=slide]
  </Carousel.Content>
  <Carousel.Previous />                    // OSS Button (tertiary, sm, icon-only), rendered INSIDE the viewport wrapper
  <Carousel.Next />
  <Carousel.Dots />                        // div[role=tablist][aria-label="Slide indicators"] > RAC Button dots
  <Carousel.Thumbnails>                    // OSS ScrollShadow (horizontal, hideScrollBar) [role=tablist][aria-label="Slide thumbnails"]
    <Carousel.Thumbnail index={0} src={src} />  // RAC Button > img
  </Carousel.Thumbnails>
</Carousel>
```

Rendered DOM (default demo, trimmed):

```html
<div aria-roledescription="carousel" class="carousel carousel--in-place" data-slot="carousel" role="region" tabindex="0">
  <div class="carousel__viewport-wrapper" data-slot="carousel-viewport-wrapper">
    <div class="carousel__viewport" data-slot="carousel-viewport">
      <div class="carousel__content" data-slot="carousel-content" style="transform: translate3d(…)">
        <div aria-roledescription="slide" class="carousel__item" data-slot="carousel-item" role="group">…</div>
      </div>
    </div>
    <button data-slot="carousel-previous" class="button button--icon-only button--sm button--tertiary carousel__previous carousel__previous--in-place" aria-label="Previous slide" data-rac …><svg 16x16 chevron-left/></button>
    <button data-slot="carousel-next" class="… carousel__next carousel__next--in-place" aria-label="Next slide" …><svg chevron-right/></button>
  </div>
  <div aria-label="Slide indicators" class="carousel__dots" data-slot="carousel-dots" role="tablist">
    <button data-selected="true" data-slot="carousel-dot" class="carousel__dot" aria-label="Go to slide 1" data-rac …></button>
  </div>
  <div class="scroll-shadow scroll-shadow--hide-scrollbar scroll-shadow--horizontal scroll-shadow--fade carousel__thumbnails"
       data-orientation="horizontal" data-scroll-shadow-size="40" data-slot="carousel-thumbnails" aria-label="Slide thumbnails" role="tablist">
    <button data-selected="true" data-slot="carousel-thumbnail" class="carousel__thumbnail" aria-label="Go to slide 1" data-rac …>
      <img alt="…" draggable="false" src="…">
    </button>
  </div>
</div>
```

Key observations
- Previous/Next are written as siblings of `Carousel.Content` (docs anatomy) but render **inside**
  `.carousel__viewport-wrapper` after the viewport, so they are positioned against the slide area
  (not the dots/thumbnail rows). The server-rendered HTML of every demo contains **no** arrow
  buttons at all (wrapper holds only the viewport; dots are absent too because there are 0 snaps
  before Embla runs); they appear after hydration. The remake reproduces this with a portal: the
  viewport wrapper registers itself on mount and Previous/Next (wherever they sit in the tree)
  portal into it for the `in-place` / `modal` types, rendering nothing before that. In
  `miniatures` they stay where they are placed.
- `data-selected="true"` is present only on the selected dot / thumbnail (absent otherwise).
  No `aria-selected`, no `role="tab"`: dots and thumbnails are plain RAC buttons inside a tablist.
- Embla writes `transform: translate3d()` on `.carousel__content` and, when looping, on slides.
- No orientation modifier is rendered by default. Pro's CSS contains unused
  `.carousel__content--horizontal { margin-inline-start: calc(var(--carousel-gap) * -1) }` and
  `.carousel__item--horizontal { padding-inline-start: var(--carousel-gap) }`; the DOM never carries
  them, so slides are edge to edge (items 384px apart in a 384px viewport).
- The chevron SVGs are 16×16 `fill="currentColor"` paths identical to the OSS `IconChevronLeft/Right`.

## 3. API (from docs)

### `Carousel` (root)
| Prop | Type | Default | Notes |
|---|---|---|---|
| `opts` | `EmblaOptionsType` | – | Passed to `useEmblaCarousel` |
| `plugins` | `EmblaPluginType[]` | – | e.g. `embla-carousel-autoplay` |
| `type` | `"in-place" \| "modal" \| "miniatures"` | `"in-place"` | Layout / arrow positioning |
| `setApi` | `(api: EmblaCarouselType) => void` | – | Called once the Embla API exists |
+ all `div` props.

### `Carousel.Content` — viewport wrapper + viewport + flex content (`className` / div props go to the content div)
### `Carousel.Item` — slide; `className="basis-1/3"` shows several per view. div props.
### `Carousel.Previous` / `Carousel.Next`
| Prop | Type | Notes |
|---|---|---|
| `icon` | `ReactNode` | Replaces the default chevron |
+ button props. Disabled (`disabled` + `data-disabled`, OSS opacity .5) when Embla cannot scroll that way (never when looping).

### `Carousel.Dots`
| `renderDot` | `({index, isSelected}) => ReactNode` | custom dot (remake: replaces the whole default dot button) |
One dot per scroll snap; renders nothing when there is ≤ 1 snap. div props.

### `Carousel.Thumbnails` — tablist container (OSS ScrollShadow). div props.
### `Carousel.Thumbnail`
| `index` | `number` | required, 0-based slide index |
| `src` | `string` | image URL (or pass `children`) |
| `alt` | `string` | default `""` |
+ button props. Press → `scrollTo(index)`.

### `useCarousel()`
`{api, selectedIndex, scrollSnapCount, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo}`.

## 4. Styling (Pro CSSOM, `@layer components`)

| Selector | Declarations (Tailwind equivalent) |
|---|---|
| `.carousel` | `--carousel-gap: 4×spacing`; `outline-none`; focus-visible → `status-focused` ring |
| `.carousel--modal` | `flex flex-col items-center gap-4` |
| `.carousel--miniatures` | `flex flex-col items-center` |
| `.carousel__viewport-wrapper` | `relative` |
| `.carousel__viewport` | `overflow-hidden` |
| `.carousel__content` | `flex` |
| `.carousel__item` | `flex: 0 0 100%; min-width: 0; position: relative` |
| `.carousel__previous, .carousel__next` | `absolute z-10`; RTL: svg `-scale-x-100` (compiled from `:dir(rtl)`) |
| `--in-place` (both) | `top: 50%; translate: 0 -50%`; previous `inset-inline-start: 5×spacing (20px)`, next `inset-inline-end: 20px` |
| `--modal` (both) | same centring; previous `inset-inline-start: -15×spacing (-60px)`, next `inset-inline-end: -60px` |
| `--miniatures` (both) | `position: relative; top: auto; inset-inline: auto; transform: none; flex-shrink: 0` |
| `.carousel__dots` | `mt-4 flex items-center justify-center gap-2` |
| `.carousel__dot` | `size-2 bg-default; border-radius: calc(var(--radius) * 9999); cursor: var(--cursor-interactive); outline-none; tap-highlight transparent; transition: background-color .2s` ; hover (`@media (hover:hover)`, `:hover` / `[data-hovered]`) `bg-default-hover`; focus ring; `[data-selected]` `bg-accent` |
| `.carousel__thumbnails` | `-mx-1 mt-4 flex items-center gap-3 p-1; cursor: var(--cursor-interactive)` |
| `.carousel__thumbnails--miniatures` | `justify-center mt-0` |
| `.carousel__thumbnail` | `relative size-16 shrink-0 rounded-2xl (calc(var(--radius)*2)); outline-none; cursor; transition: box-shadow .15s, opacity .15s, transform .15s` |
| `.carousel__thumbnail img` | `pointer-events-none absolute inset-0 size-full rounded-2xl object-cover select-none` |
| thumbnail hover | `opacity: .85` |
| thumbnail `:active` / `[data-pressed]` | `transform: scale(.95)` |
| thumbnail focus-visible | focus ring |
| thumbnail `[data-selected]` | `box-shadow: 0 0 0 2px var(--color-accent)` (declared after the focus rule, so it wins) |
| `@media (prefers-reduced-motion: reduce)` | thumbnail `transition: none` |

Arrow buttons are the OSS Button (`button--tertiary` → `bg-default`, `button--sm` + `button--icon-only`
→ 36×36 below `md`, 32×32 from `md`; `rounded-3xl`).

Colours (light / dark) all resolve to theme tokens: dot `--default` / selected `--accent`, ring `--accent`,
arrows `--default` + `--default-foreground`. Dark demo: dot `lab(15.73…)` = dark `--default`, accent
`lab(54.53… -66.53)` = `--accent`. No literal colours.

## 5. Measured layout (447×402 demo viewport)

| Demo | Container | Root | Viewport | Arrows (rel. viewport) | Dots | Thumbnails |
|---|---|---|---|---|---|---|
| Default | `w-full max-w-sm` | 384×496 | 384×384 | 36×36 at x 20 / 328, y 174 | y 400, 8px dots, 16px pitch | y 424, x −4, 392×72; 64px thumbs, 76px pitch |
| Modal | `w-full max-w-sm px-16` | 256×296 (flex col, gap 16) | 256×192 (4:3) | x −60 / 280, y 78 | – | y 224, intrinsic 452 wide, centred (overflows root) |
| Multiple slides | `w-full max-w-sm` | 384×128 | items 128 (basis-1/3) | y 46 | – | – |
| Loop | `w-full max-w-xs` | 320×320 | – | – | – | – |
| Autoplay | `w-full max-w-xs` | 320×344 | – | – | 5 dots | – |
| API access | `flex w-full max-w-xs flex-col gap-2` | 320×320 + `p` text-sm muted | – | – | – | – |

## 6. Behaviour

- **Keyboard**: root `keydown` (bubble) — `ArrowLeft` → `scrollPrev`, `ArrowRight` → `scrollNext`, both
  `preventDefault()`. Other keys (Up/Down/Home/End) do nothing. Arrow keys pressed on a focused
  thumbnail/dot bubble to the root and move the slide while focus stays on the control.
  Remake additions: vertical axis (`opts.axis: "y"`) uses ArrowUp/ArrowDown, `opts.direction: "rtl"`
  swaps Left/Right, editable targets (input/textarea/select/contenteditable) are ignored.
- **Loop**: default, modal, loop and autoplay demos use `opts={{loop: true}}` (Previous enabled on
  slide 1; Previous from slide 1 jumps to the last slide). Multiple slides and API access do not loop
  (Previous disabled at start; Next disabled after 5 clicks with 8 × `basis-1/3` slides → 6 snaps).
- **Dots / thumbnails** press → `scrollTo(index)`. The thumbnail strip does **not** auto-scroll the
  selected thumbnail into view.
- **Autoplay demo**: `embla-carousel-autoplay` with a 2000 ms delay; dot presses do not stop it, a
  pointer-down on the viewport (Embla `pointerDown`, i.e. `stopOnInteraction: true`) stops it.
- **State sync**: selected index / canScroll / snap count follow Embla `select` + `reInit` events.
- Slide animation is Embla's own physics (`duration` option, default 25); no CSS keyframes involved.

## 7. Demos (public) → remake stories

| Pro demo | Story export |
|---|---|
| carousel-default (images, arrows, dots, thumbnails, loop) | `Default` |
| carousel-modal-type (type="modal", 4:3 images, arrows, thumbnails, loop) | `ModalType` |
| carousel-multiple-slides (8 cards, `basis-1/3`, arrows) | `MultipleSlides` |
| carousel-loop (5 cards, loop, arrows) | `InfiniteLoop` |
| carousel-autoplay (5 cards, loop, autoplay plugin, dots) | `Autoplay` |
| carousel-api-access (5 cards, arrows, "x of y" counter via `setApi`) | `APIAccess` |
| – (documented type, no demo) | `MiniaturesType` |

## 8. Dependencies

- `embla-carousel-react` 8 (+ `embla-carousel` types) — optional peer → subpath-only export.
- OSS `Button`, `ScrollShadow`, `IconChevronLeft/Right`, `Card` (stories); RAC `Button` for dots/thumbnails.
- `embla-carousel-autoplay` is **not installed**; the Autoplay story ships a tiny own Embla plugin
  (2000 ms delay, stops on pointer-down) instead.

## 9. Deviations / open points

- `miniatures` has no public demo. Its CSS only un-absolutes the arrows and centres the thumbnail
  row, so the remake leaves Previous/Next where the user places them (e.g. in a row with the
  thumbnails) instead of portalling them into the viewport wrapper.
- `renderDot` semantics are not documented in detail; the remake renders the returned node in
  place of the default dot button (consumers wire navigation through `useCarousel().scrollTo`).
- The unused `--horizontal` content/item rules are not reproduced (never rendered by Pro). A
  `carousel__content--vertical` modifier (flex column) is added for `opts.axis: "y"`.
- Dots also get `motion-reduce:transition-none` (Pro only disables thumbnail transitions).
- Arrow SVGs come from the OSS icons and therefore carry `aria-hidden="true" role="presentation"`
  (Pro's identical path has no such attributes; no visual or behavioural effect, the buttons are
  named by `aria-label`).

## 10. Review (second pass) results

Re-measured all six demos against the stories (light + dark): root / wrapper / viewport / item
boxes, arrow positions (in-place 20px inset, modal -60px), disabled state attributes
(`disabled` + `data-disabled`, opacity .5, `not-allowed`), dots (8px, 16px pitch, y 400),
thumbnails (64px, 76px pitch, x -4, 392x72; modal strip 452px intrinsic), API-access counter
text metrics, autoplay cadence (2000 ms; a dot press does not reset the timer in either). The
carousel CSSOM is rule-for-rule equivalent. Colours differ only in serialisation (`lab()` on
heroui.pro vs `oklch()` here) and resolve to the same sRGB values (e.g. accent 4,133,247). Theme
check: `--radius` (dot `calc(var(--radius)*9999)`, thumbnail `*2`, arrows OSS), `--accent`,
`--focus` and `--font-sans` all propagate.
