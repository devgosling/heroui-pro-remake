import {isIOS} from "@react-aria/utils";

import {SHEET_ENTER_MS, animateSheetValue} from "./sheet.utils";

/* React Aria opens a sheet with `scrollTo({behavior: "smooth"})` on its scroll container. The
 * browser decides that duration and curve (~420ms), and the scroll always covers a whole viewport,
 * so a short sheet first travels unseen below the edge. While a sheet enters from fully hidden, this
 * swaps that smooth scroll for a 250ms glide on the sheet curve, cubic-bezier(0.32, 0.72, 0, 1),
 * that starts right at the visible edge.
 *
 * The glide still scrolls the container, so the backdrop keeps following it through its scroll
 * timeline, and handle drags, swipe-to-close and the exit stay native. Scroll snapping is off while
 * gliding (`data-enter-gliding`), otherwise mandatory snapping would pull each step to a snap point.
 * React Aria's enter waits for `scrollend`; it gets exactly one, when the glide arrives. */

export const SHEET_ENTER_GLIDING_ATTRIBUTE = "data-enter-gliding";

type Axis = "x" | "y";

interface Glide {
  axis: Axis;
  cancel: () => void;
  target: number;
}

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** iOS shows content behind its toolbar, below `innerHeight` (same allowance as React Aria). */
function iosToolbarAllowance() {
  const probe = document.createElement("div");

  probe.style.cssText =
    "position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;height:calc(100lvh - 100svh + 58px)";
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;

  probe.remove();

  return height;
}

/**
 * Where an entrance glide should start: the scroll position at which the hidden sheet's leading
 * edge touches the viewport edge it enters through. `null` when the sheet is (partly) visible, so
 * detent changes and exits keep React Aria's own smooth scroll.
 */
function enterGlideStart(scroller: HTMLElement, axis: Axis, target: number): number | null {
  const content = scroller.querySelector<HTMLElement>("[data-sheet-content]");

  if (!content) return null;

  const rect = content.getBoundingClientRect();

  // No layout (jsdom, display: none): nothing to glide.
  if (rect.width <= 0 || rect.height <= 0) return null;

  const current = axis === "y" ? scroller.scrollTop : scroller.scrollLeft;
  const delta = target - current;

  if (Math.abs(delta) < 1) return null;

  // Scrolling forward moves the sheet up/left: it enters through the bottom/right edge.
  const entersThroughEnd = delta > 0;
  const viewport =
    (axis === "y" ? window.innerHeight : window.innerWidth) +
    (axis === "y" && entersThroughEnd && isIOS() ? iosToolbarAllowance() : 0);
  const leading = axis === "y" ? rect.top : rect.left;
  const trailing = axis === "y" ? rect.bottom : rect.right;

  if (leading < viewport && trailing > 0) return null;

  const hidden = entersThroughEnd ? leading - viewport : -trailing;
  const skip = Math.min(Math.abs(delta), Math.max(0, hidden));

  return current + Math.sign(delta) * skip;
}

/**
 * Takes over React Aria's smooth entrance scroll on a sheet's scroll container. Returns the cleanup.
 * `isOpen` is read when React Aria scrolls (during commit), so it must not lag behind the DOM.
 */
export function installSheetEnterGlide(scroller: HTMLElement, isOpen: () => boolean) {
  // Environments without element scrolling (jsdom) keep React Aria's behaviour.
  if (typeof scroller.scrollTo !== "function") return () => {};

  const nativeScrollTo = scroller.scrollTo.bind(scroller) as (options: ScrollToOptions) => void;
  let glide: Glide | null = null;

  const setScroll = (axis: Axis, value: number) => {
    if (axis === "y") scroller.scrollTop = value;
    else scroller.scrollLeft = value;
  };

  const stop = () => {
    glide?.cancel();
    glide = null;
    scroller.removeAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
  };

  // A touch, click or wheel during the glide hands the rest back to the browser, exactly as React
  // Aria would have scrolled, so the gesture interrupts it natively and `scrollend` still arrives.
  const interrupt = () => {
    if (!glide) return;

    const {axis, target} = glide;

    stop();
    nativeScrollTo({[axis === "y" ? "top" : "left"]: target, behavior: "smooth"});
  };

  // Scrolling the container fires `scrollend` too; React Aria must only see the final one.
  const holdScrollEnd = (event: Event) => {
    if (glide) event.stopImmediatePropagation();
  };

  function scrollTo(options?: ScrollToOptions | number, y?: number) {
    stop();

    if (typeof options === "object" && options.behavior === "smooth" && !prefersReducedMotion()) {
      // Callers may pass both coordinates (the retained-overlay restore does); glide the one that moves.
      const movesY = options.top != null && Math.abs(options.top - scroller.scrollTop) >= 1;
      const movesX = options.left != null && Math.abs(options.left - scroller.scrollLeft) >= 1;
      const axis: Axis | null = movesY === movesX ? null : movesY ? "y" : "x";
      const target = axis === "y" ? options.top : options.left;
      const start =
        axis && target != null && isOpen() ? enterGlideStart(scroller, axis, target) : null;

      if (axis && target != null && start != null) {
        scroller.setAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE, "");
        // The sheet is still hidden at the start position, so this jump is not visible.
        setScroll(axis, start);
        glide = {
          axis,
          cancel: animateSheetValue(
            start,
            target,
            (value) => setScroll(axis, value),
            () => {
              glide = null;
              scroller.removeAttribute(SHEET_ENTER_GLIDING_ATTRIBUTE);
              scroller.dispatchEvent(new Event("scrollend"));
            },
            false,
            SHEET_ENTER_MS,
          ),
          target,
        };

        return;
      }
    }

    if (typeof options === "number") {
      (Element.prototype.scrollTo as (x: number, y: number) => void).call(scroller, options, y!);
    } else {
      nativeScrollTo(options ?? {});
    }
  }

  // An own property, defined rather than assigned so a non-writable prototype method can't block it.
  Object.defineProperty(scroller, "scrollTo", {
    configurable: true,
    value: scrollTo,
    writable: true,
  });
  scroller.addEventListener("scrollend", holdScrollEnd, {capture: true});
  scroller.addEventListener("pointerdown", interrupt, {capture: true, passive: true});
  scroller.addEventListener("wheel", interrupt, {capture: true, passive: true});

  return () => {
    stop();
    // Remove the instance override so the prototype method applies again.
    delete (scroller as Partial<Pick<HTMLElement, "scrollTo">>).scrollTo;
    scroller.removeEventListener("scrollend", holdScrollEnd, {capture: true});
    scroller.removeEventListener("pointerdown", interrupt, {capture: true});
    scroller.removeEventListener("wheel", interrupt, {capture: true});
  };
}
