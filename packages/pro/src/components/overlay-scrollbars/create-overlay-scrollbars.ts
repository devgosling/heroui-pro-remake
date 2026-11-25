/**
 * Overlay scrollbars for every scroll container of a document.
 *
 * Native scrollbars are hidden (see css/components/overlay-scrollbars.css, active while
 * `html[data-overlay-scrollbars]` is set), so they never take layout space. Thin themed thumbs are
 * drawn in a fixed layer on top of the content instead: they appear while a container scrolls or
 * when the pointer comes near its scroll edge, widen on hover and can be dragged.
 *
 * Opt-outs (HeroUI scrollbar system): `data-scrollbar="none"` hides scrollbars entirely,
 * `data-scrollbar="default"` keeps the native OS scrollbar for that subtree.
 */

export interface OverlayScrollbarsOptions {
  /** Time in ms after the last activity before the thumbs fade out. @default 1000 */
  hideDelay?: number;
  /** Minimum thumb length in px. @default 28 */
  minThumbSize?: number;
  /** Distance from the container edge in px. @default 2 */
  inset?: number;
  /** Pointer distance from the scroll edge (px) that reveals the thumbs. @default 16 */
  revealDistance?: number;
}

type Axis = "vertical" | "horizontal";

interface Bars {
  target: Element;
  vertical: HTMLDivElement;
  horizontal: HTMLDivElement;
  hideTimer?: ReturnType<typeof setTimeout>;
  removeTimer?: ReturnType<typeof setTimeout>;
  hovered: boolean;
  dragging: boolean;
}

const HIT_AREA = 12;

export function createOverlayScrollbars(
  doc: Document = document,
  {
    hideDelay = 1000,
    inset = 2,
    minThumbSize = 28,
    revealDistance = 16,
  }: OverlayScrollbarsOptions = {},
): () => void {
  const win = doc.defaultView;

  if (!win || !doc.body) return () => {};

  const html = doc.documentElement;

  html.setAttribute("data-overlay-scrollbars", "");

  const layer = doc.createElement("div");

  layer.className = "overlay-scrollbars";
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("data-slot", "overlay-scrollbars");
  doc.body.appendChild(layer);

  const active = new Map<Element, Bars>();
  const resizeObserver =
    typeof win.ResizeObserver === "function"
      ? new win.ResizeObserver((entries) => entries.forEach((e) => update(e.target)))
      : null;

  /* ---------------------------------------------------------------------------------------------
   * Geometry helpers
   * -------------------------------------------------------------------------------------------*/
  const scrollingRoot = () => doc.scrollingElement ?? html;

  const isRoot = (el: Element) => el === scrollingRoot() || el === html || el === doc.body;

  /**
   * Whether the element's own CSS hides its scrollbar (e.g. HeroUI's `scrollbar-none` utility on tab
   * lists, scroll shadows, picker popovers). Read with the global hiding rule lifted for one
   * synchronous measurement (no paint in between), cached per element and class list.
   */
  const authorHidden = new WeakMap<Element, {className: string; hidden: boolean}>();

  const hidesOwnScrollbar = (el: Element) => {
    const probeTarget = isRoot(el) ? html : el;
    const className = probeTarget.getAttribute("class") ?? "";
    const cached = authorHidden.get(probeTarget);

    if (cached && cached.className === className) return cached.hidden;

    probeTarget.setAttribute("data-overlay-scrollbars-probe", "");
    const hidden = win.getComputedStyle(probeTarget).scrollbarWidth === "none";

    probeTarget.removeAttribute("data-overlay-scrollbars-probe");
    authorHidden.set(probeTarget, {className, hidden});

    return hidden;
  };

  // `data-scrollbar="default"` keeps the OS scrollbar for a subtree; everything else is decided by
  // the element's own computed scrollbar-width (covers `scrollbar-none`, `data-scrollbar="none"`).
  const isOptedOut = (el: Element) =>
    !!el.closest("[data-scrollbar='default']") || hidesOwnScrollbar(el);

  const overflowOf = (el: Element): {x: boolean; y: boolean} => {
    if (isRoot(el)) {
      const style = win.getComputedStyle(html);
      const bodyStyle = win.getComputedStyle(doc.body);
      const root = scrollingRoot();
      const lockedY = style.overflowY === "hidden" || bodyStyle.overflowY === "hidden";
      const lockedX = style.overflowX === "hidden" || bodyStyle.overflowX === "hidden";

      return {
        x: !lockedX && root.scrollWidth > root.clientWidth + 1,
        y: !lockedY && root.scrollHeight > root.clientHeight + 1,
      };
    }

    const style = win.getComputedStyle(el);
    const scrollsY = style.overflowY === "auto" || style.overflowY === "scroll";
    const scrollsX = style.overflowX === "auto" || style.overflowX === "scroll";

    return {
      x: scrollsX && el.scrollWidth > el.clientWidth + 1,
      y: scrollsY && el.scrollHeight > el.clientHeight + 1,
    };
  };

  /** Visible padding box of the container in viewport coordinates. */
  const boxOf = (el: Element) => {
    if (isRoot(el)) return {height: win.innerHeight, left: 0, top: 0, width: win.innerWidth};
    const rect = el.getBoundingClientRect();

    return {
      height: el.clientHeight,
      left: rect.left + el.clientLeft,
      top: rect.top + el.clientTop,
      width: el.clientWidth,
    };
  };

  /**
   * The part of the container's padding box that is actually visible: clipped by every ancestor
   * that clips (overflow / paint containment) and by the viewport. Thumbs live in a fixed layer,
   * so without this they would stick out of containers that are wider than their clipping parent.
   */
  const visibleBoxOf = (el: Element) => {
    const box = boxOf(el);

    if (isRoot(el)) return box;

    let left = box.left;
    let top = box.top;
    let right = box.left + box.width;
    let bottom = box.top + box.height;

    for (let a = el.parentElement; a && a !== doc.body && a !== html; a = a.parentElement) {
      const style = win.getComputedStyle(a);
      const clips =
        style.overflowX !== "visible" ||
        style.overflowY !== "visible" ||
        /paint|strict|content/.test(style.contain);

      if (!clips) continue;
      const rect = a.getBoundingClientRect();
      const aLeft = rect.left + a.clientLeft;
      const aTop = rect.top + a.clientTop;

      left = Math.max(left, aLeft);
      top = Math.max(top, aTop);
      right = Math.min(right, aLeft + a.clientWidth);
      bottom = Math.min(bottom, aTop + a.clientHeight);
    }

    left = Math.max(left, 0);
    top = Math.max(top, 0);
    right = Math.min(right, win.innerWidth);
    bottom = Math.min(bottom, win.innerHeight);

    return {height: Math.max(0, bottom - top), left, top, width: Math.max(0, right - left)};
  };

  /** Padding at the track ends: a little air, more inside rounded corners. */
  const endPaddingOf = (el: Element, axis: Axis) => {
    const base = inset + 2;

    if (isRoot(el)) return base;
    const style = win.getComputedStyle(el);
    const radius =
      axis === "vertical"
        ? Math.max(
            parseFloat(style.borderTopRightRadius),
            parseFloat(style.borderBottomRightRadius),
          )
        : Math.max(
            parseFloat(style.borderBottomLeftRadius),
            parseFloat(style.borderBottomRightRadius),
          );

    return Math.max(base, Math.min((radius || 0) * 0.5, 16));
  };

  /** Track geometry shared by rendering and dragging. */
  const geometryOf = (el: Element) => {
    const overflow = overflowOf(el);
    const box = visibleBoxOf(el);
    const padV = endPaddingOf(el, "vertical");
    const padH = endPaddingOf(el, "horizontal");

    return {
      box,
      overflow,
      padH,
      padV,
      trackH: box.width - padH * 2 - (overflow.y ? HIT_AREA : 0),
      trackV: box.height - padV * 2 - (overflow.x ? HIT_AREA : 0),
    };
  };

  const scrollMetrics = (el: Element) => {
    const source = isRoot(el) ? scrollingRoot() : el;

    return {
      clientHeight: isRoot(el) ? win.innerHeight : source.clientHeight,
      clientWidth: isRoot(el) ? win.innerWidth : source.clientWidth,
      scrollHeight: source.scrollHeight,
      scrollLeft: source.scrollLeft,
      scrollTop: source.scrollTop,
      scrollWidth: source.scrollWidth,
      source,
    };
  };

  const isRtl = (el: Element) => win.getComputedStyle(isRoot(el) ? html : el).direction === "rtl";

  /** Nearest scrollable container (with overflow) of a node, including the page. */
  const scrollableFrom = (node: EventTarget | null): Element | null => {
    let el = node instanceof win.Element ? node : null;

    while (el && el !== html && el !== doc.body) {
      if (el.closest(".overlay-scrollbars")) return null;
      const overflow = overflowOf(el);

      if ((overflow.x || overflow.y) && !isOptedOut(el)) return el;
      el = el.parentElement;
    }
    const root = scrollingRoot();
    const overflow = overflowOf(root);

    return overflow.x || overflow.y ? root : null;
  };

  /* ---------------------------------------------------------------------------------------------
   * Thumbs
   * -------------------------------------------------------------------------------------------*/
  const createThumb = (bars: () => Bars | undefined, axis: Axis) => {
    const thumb = doc.createElement("div");

    thumb.className = "overlay-scrollbars__thumb";
    thumb.setAttribute("data-orientation", axis);

    thumb.addEventListener("pointerenter", () => {
      const current = bars();

      if (!current) return;
      current.hovered = true;
      thumb.setAttribute("data-hovered", "true");
      show(current.target);
    });
    thumb.addEventListener("pointerleave", () => {
      const current = bars();

      if (!current) return;
      current.hovered = false;
      thumb.removeAttribute("data-hovered");
      scheduleHide(current);
    });
    thumb.addEventListener("pointerdown", (event) => {
      const current = bars();

      if (!current || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      thumb.setPointerCapture(event.pointerId);
      current.dragging = true;
      thumb.setAttribute("data-dragging", "true");

      const metrics = scrollMetrics(current.target);
      const geometry = geometryOf(current.target);
      const startPointer = axis === "vertical" ? event.clientY : event.clientX;
      const startScroll = axis === "vertical" ? metrics.scrollTop : metrics.scrollLeft;
      const track = axis === "vertical" ? geometry.trackV : geometry.trackH;
      const thumbLength = axis === "vertical" ? thumb.offsetHeight : thumb.offsetWidth;
      const scrollRange =
        axis === "vertical"
          ? metrics.scrollHeight - metrics.clientHeight
          : metrics.scrollWidth - metrics.clientWidth;
      const ratio = scrollRange / Math.max(1, track - thumbLength);
      const rtlFactor = axis === "horizontal" && isRtl(current.target) ? -1 : 1;

      const onMove = (moveEvent: PointerEvent) => {
        const delta = (axis === "vertical" ? moveEvent.clientY : moveEvent.clientX) - startPointer;

        if (axis === "vertical") metrics.source.scrollTop = startScroll + delta * ratio;
        else metrics.source.scrollLeft = startScroll + delta * ratio * rtlFactor;
      };
      const onUp = () => {
        thumb.removeEventListener("pointermove", onMove);
        thumb.removeEventListener("pointerup", onUp);
        thumb.removeEventListener("pointercancel", onUp);
        current.dragging = false;
        thumb.removeAttribute("data-dragging");
        scheduleHide(current);
      };

      thumb.addEventListener("pointermove", onMove);
      thumb.addEventListener("pointerup", onUp);
      thumb.addEventListener("pointercancel", onUp);
    });

    layer.appendChild(thumb);

    return thumb;
  };

  const ensureBars = (target: Element): Bars => {
    let bars = active.get(target);

    if (bars) return bars;
    const getBars = () => active.get(target);

    bars = {
      dragging: false,
      horizontal: createThumb(getBars, "horizontal"),
      hovered: false,
      target,
      vertical: createThumb(getBars, "vertical"),
    };
    active.set(target, bars);
    if (!isRoot(target)) resizeObserver?.observe(target);

    return bars;
  };

  const removeBars = (bars: Bars) => {
    clearTimeout(bars.hideTimer);
    clearTimeout(bars.removeTimer);
    bars.vertical.remove();
    bars.horizontal.remove();
    if (!isRoot(bars.target)) resizeObserver?.unobserve(bars.target);
    active.delete(bars.target);
  };

  const place = (thumb: HTMLDivElement, visible: boolean, rect?: Partial<CSSStyleDeclaration>) => {
    thumb.toggleAttribute("data-visible", visible);
    if (rect) Object.assign(thumb.style, rect);
  };

  function update(target: Element) {
    const bars = active.get(target);

    if (!bars) return;
    if (!target.isConnected) {
      removeBars(bars);

      return;
    }

    const {box, overflow, padH, padV, trackH, trackV} = geometryOf(target);
    const metrics = scrollMetrics(target);
    const rtl = isRtl(target);
    const visible = bars.vertical.hasAttribute("data-shown");

    // Vertical thumb (hidden when the visible part is too small for a usable track)
    if (overflow.y && trackV >= minThumbSize) {
      const track = trackV;
      const length = Math.max(minThumbSize, (track * metrics.clientHeight) / metrics.scrollHeight);
      const range = metrics.scrollHeight - metrics.clientHeight;
      const offset = range > 0 ? (metrics.scrollTop / range) * (track - length) : 0;

      bars.vertical.toggleAttribute("data-rtl", rtl);
      place(bars.vertical, visible, {
        height: `${length}px`,
        left: `${rtl ? box.left + inset : box.left + box.width - inset - HIT_AREA}px`,
        top: `${box.top + padV + offset}px`,
        width: `${HIT_AREA}px`,
      });
    } else {
      place(bars.vertical, false);
    }

    // Horizontal thumb
    if (overflow.x && trackH >= minThumbSize) {
      const track = trackH;
      const length = Math.max(minThumbSize, (track * metrics.clientWidth) / metrics.scrollWidth);
      const range = metrics.scrollWidth - metrics.clientWidth;
      // RTL scrollLeft runs from 0 to -range.
      const progress = range > 0 ? Math.abs(metrics.scrollLeft) / range : 0;
      const offset = rtl ? (1 - progress) * (track - length) : progress * (track - length);
      const start = rtl && overflow.y ? box.left + padH + HIT_AREA : box.left + padH;

      place(bars.horizontal, visible, {
        height: `${HIT_AREA}px`,
        left: `${start + offset}px`,
        top: `${box.top + box.height - inset - HIT_AREA}px`,
        width: `${length}px`,
      });
    } else {
      place(bars.horizontal, false);
    }
  }

  function scheduleHide(bars: Bars) {
    clearTimeout(bars.hideTimer);
    bars.hideTimer = setTimeout(() => {
      if (bars.hovered || bars.dragging) return;
      bars.vertical.removeAttribute("data-shown");
      bars.vertical.removeAttribute("data-visible");
      bars.horizontal.removeAttribute("data-visible");
      clearTimeout(bars.removeTimer);
      bars.removeTimer = setTimeout(() => {
        if (!bars.vertical.hasAttribute("data-shown")) removeBars(bars);
      }, 400);
    }, hideDelay);
  }

  function show(target: Element) {
    if (isOptedOut(target)) return;
    const bars = ensureBars(target);

    clearTimeout(bars.removeTimer);
    bars.vertical.setAttribute("data-shown", "");
    update(target);
    scheduleHide(bars);
  }

  /* ---------------------------------------------------------------------------------------------
   * Global listeners
   * -------------------------------------------------------------------------------------------*/
  let frame = 0;
  const pendingScroll = new Set<Element>();

  const onScroll = (event: Event) => {
    const target =
      event.target === doc || event.target === html ? scrollingRoot() : (event.target as Element);

    if (!(target instanceof win.Element)) return;
    pendingScroll.add(target);
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      pendingScroll.forEach((el) => {
        const overflow = overflowOf(el);

        if (overflow.x || overflow.y) show(el);
      });
      pendingScroll.clear();
      // Other visible thumbs may have moved with the scrolled content.
      active.forEach((bars) => update(bars.target));
    });
  };

  let moveFrame = 0;
  let lastMove: PointerEvent | null = null;

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    lastMove = event;
    if (moveFrame) return;
    moveFrame = win.requestAnimationFrame(() => {
      moveFrame = 0;
      const move = lastMove;

      if (!move) return;
      const target = scrollableFrom(move.target);

      if (!target) return;
      const overflow = overflowOf(target);
      const box = boxOf(target);
      const rtl = isRtl(target);
      const nearVertical =
        overflow.y &&
        (rtl
          ? move.clientX - box.left <= revealDistance
          : box.left + box.width - move.clientX <= revealDistance);
      const nearHorizontal = overflow.x && box.top + box.height - move.clientY <= revealDistance;

      if (nearVertical || nearHorizontal) show(target);
    });
  };

  const onResize = () => active.forEach((bars) => update(bars.target));

  doc.addEventListener("scroll", onScroll, {capture: true, passive: true});
  doc.addEventListener("pointermove", onPointerMove, {passive: true});
  win.addEventListener("resize", onResize, {passive: true});

  return () => {
    doc.removeEventListener("scroll", onScroll, {capture: true});
    doc.removeEventListener("pointermove", onPointerMove);
    win.removeEventListener("resize", onResize);
    win.cancelAnimationFrame(frame);
    win.cancelAnimationFrame(moveFrame);
    active.forEach(removeBars);
    resizeObserver?.disconnect();
    layer.remove();
    html.removeAttribute("data-overlay-scrollbars");
  };
}
