"use client";

/**
 * Gesture + spring engine for `SwipeableRow`.
 *
 * It lives outside React so that a drag never re-renders the row: every frame it writes the
 * translation and progress as CSS custom properties on the root (and the per-action reveal progress
 * on each action), and only notifies `useSyncExternalStore` subscribers (render-function rails and
 * `useSwipeableRow` consumers). React owns the requested open side; the engine animates toward it.
 *
 * Translation is logical: positive values reveal the start rail, negative values the end rail, in
 * every layout direction. CSS flips it for RTL with `--swipeable-row-direction`.
 */
import type {HapticFeedbackType} from "../../utils/haptics";

export type SwipeableRowSide = "start" | "end";
export type SwipeableRowOpenSide = SwipeableRowSide | null;

export interface SwipeableRowSpringConfig {
  /** @default 1 */
  mass?: number;
  /** @default 240 */
  stiffness?: number;
  /** @default 31 (critically damped with the default stiffness) */
  damping?: number;
}

export interface SwipeableRowTransitionOptions {
  /** Animate with the settle spring. `false` jumps to the end state. @default true */
  animated?: boolean;
}

export interface SwipeableRowSnapshot {
  /** Logical translation in px: positive reveals start, negative reveals end. */
  translation: number;
  /** Start rail reveal progress, clamped 0..1. */
  startProgress: number;
  /** End rail reveal progress, clamped 0..1. */
  endProgress: number;
}

export interface SwipeableRowRailsState {
  start: boolean;
  end: boolean;
}

export interface SwipeEngineOptions {
  activationThreshold: number;
  /** Vertical range [min, max] in px that the pointer may travel before the drag activates. */
  failOffsetY: [number, number];
  friction: number;
  overshoot: boolean;
  overshootFriction: number;
  openThreshold: number;
  isDisabled: boolean;
  isAnimationDisabled: boolean;
  spring: Required<SwipeableRowSpringConfig>;
  /** Travel in px over which the inline corners round. */
  cornerDistance: number;
  enableTrackpad: boolean;
  closeOnContentPress: boolean;
  closeOnOutsidePress: boolean;
  haptic: (type: HapticFeedbackType) => void;
  /** Called whenever the engine decides which side should be open (release, taps, outside press). */
  onRequestSide: (side: SwipeableRowOpenSide) => void;
  /** Called when a rail becomes empty or non-empty. */
  onRailsChange: (rails: SwipeableRowRailsState) => void;
}

export interface SwipeRailOptions {
  allowsFullSwipe: boolean;
  fullSwipeThreshold: number;
}

export interface SwipeActionHandlers {
  /** Runs the action for a full swipe. Returns whether the row should close afterwards. */
  trigger: (pointerType: "mouse" | "pen" | "touch") => boolean;
}

interface RailEntry extends SwipeRailOptions {
  el: HTMLElement;
  /** Measured width including the gap to the card, 0 while the rail has no actions. */
  width: number;
  /** Width the primary action grows by to cover its siblings during a full swipe. */
  cover: number;
}

interface ActionEntry extends SwipeActionHandlers {
  el: HTMLElement;
  side: SwipeableRowSide;
  /** Distance from the rail's outer edge to the action's outer / inner edge (layout px). */
  from: number;
  to: number;
}

interface DragState {
  pointerId: number;
  pointerType: "mouse" | "pen" | "touch";
  startX: number;
  startY: number;
  isActive: boolean;
  /** Translation when the drag activated. */
  base: number;
  /** Physical → logical direction (-1 in RTL). */
  dir: number;
  samples: Array<{time: number; position: number}>;
}

/** Fraction of the release velocity added to the position before choosing a side (toss). */
const VELOCITY_TOSS = 0.05;
/** Spring rests when it is closer than this (px) and slower than REST_SPEED (px/s). */
const REST_DISTANCE = 0.25;
const REST_SPEED = 6;
const VELOCITY_WINDOW = 100;
const WHEEL_SETTLE_DELAY = 140;
const RAIL_SELECTOR = "[data-slot='swipeable-row-actions']";
const A11Y_SELECTOR = "[data-swipeable-row-a11y]";

const DEFAULT_OPTIONS: SwipeEngineOptions = {
  activationThreshold: 10,
  closeOnContentPress: true,
  closeOnOutsidePress: true,
  cornerDistance: 32,
  enableTrackpad: false,
  failOffsetY: [-10, 10],
  friction: 1,
  haptic: () => {},
  isAnimationDisabled: false,
  isDisabled: false,
  onRailsChange: () => {},
  onRequestSide: () => {},
  openThreshold: 0.5,
  overshoot: true,
  overshootFriction: 8,
  spring: {damping: 31, mass: 1, stiffness: 240},
};

const clamp01 = (value: number) => (value <= 0 ? 0 : value >= 1 ? 1 : value);

const isRtl = (element: Element) => getComputedStyle(element).direction === "rtl";

const prefersReducedMotion = (element: Element | null) =>
  !!element?.closest("[data-reduce-motion='true']") ||
  (typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const setFlag = (element: HTMLElement, name: string, on: boolean) => {
  if (on) element.setAttribute(name, "true");
  else element.removeAttribute(name);
};

const toPointerType = (type: string): DragState["pointerType"] =>
  type === "mouse" || type === "pen" ? type : "touch";

export type SwipeEngine = ReturnType<typeof createSwipeEngine>;

export function createSwipeEngine() {
  let opts: SwipeEngineOptions = DEFAULT_OPTIONS;
  let root: HTMLElement | null = null;
  let content: HTMLElement | null = null;
  const rails: Partial<Record<SwipeableRowSide, RailEntry>> = {};
  const actions = new Map<HTMLElement, ActionEntry>();
  let railsState: SwipeableRowRailsState = {end: false, start: false};

  let translation = 0;
  let velocity = 0;
  let desired: SwipeableRowOpenSide = null;
  let springTarget: number | null = null;
  let frame = 0;
  let lastFrameTime = 0;
  let hasSettledOnce = false;

  let drag: DragState | null = null;
  let suppressClick = false;
  let openCrossed: SwipeableRowOpenSide = null;
  let fullSwipeArmed: SwipeableRowOpenSide = null;

  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  let wheelRaw: number | null = null;
  let wheelAttached = false;

  let snapshot: SwipeableRowSnapshot = {endProgress: 0, startProgress: 0, translation: 0};
  const listeners = new Set<() => void>();
  let resizeObserver: ResizeObserver | null = null;

  /* ------------------------------------------------------------------------------------------- *
   * Geometry
   * ------------------------------------------------------------------------------------------- */
  const widthOf = (side: SwipeableRowSide) => rails[side]?.width ?? 0;

  const targetFor = (side: SwipeableRowOpenSide) => {
    if (!side) return 0;
    const width = widthOf(side);

    return side === "start" ? width : -width;
  };

  const rowWidth = () => root?.offsetWidth ?? content?.offsetWidth ?? 0;

  const actionsOf = (side: SwipeableRowSide) =>
    [...actions.values()]
      .filter((entry) => entry.side === side && entry.el.isConnected)
      .sort((a, b) =>
        a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );

  const primaryOf = (side: SwipeableRowSide) => {
    const list = actionsOf(side);

    // The outermost action: the first one of a start rail, the last one of an end rail.
    return side === "start" ? list[0] : list[list.length - 1];
  };

  const measureRail = (side: SwipeableRowSide) => {
    const rail = rails[side];

    if (!rail) return;
    // While a full swipe stretches the rail its natural width is unknown; keep the last value.
    if (rail.el.style.minWidth) return;

    const list = actionsOf(side);
    const width = rail.el.offsetWidth;
    const outerIsRight = (side === "end") !== isRtl(rail.el);

    for (const entry of list) {
      const left = entry.el.offsetLeft;
      const size = entry.el.offsetWidth;

      entry.from = outerIsRight ? width - (left + size) : left;
      entry.to = entry.from + size;
    }

    const primary = side === "start" ? list[0] : list[list.length - 1];

    for (const entry of list)
      setFlag(entry.el, "data-primary", rail.allowsFullSwipe && entry === primary);

    if (primary) {
      const style = getComputedStyle(rail.el);
      const inner =
        side === "end"
          ? parseFloat(style.paddingInlineStart) || 0
          : parseFloat(style.paddingInlineEnd) || 0;

      rail.cover = Math.max(0, width - inner - primary.el.offsetWidth);
      rail.el.style.setProperty("--swipeable-row-full-swipe-cover", `${rail.cover}px`);
    }

    rail.width = list.length ? width : 0;
  };

  const syncRailsState = () => {
    const next = {end: widthOf("end") > 0, start: widthOf("start") > 0};

    if (next.start !== railsState.start || next.end !== railsState.end) {
      railsState = next;
      opts.onRailsChange(next);
    }
  };

  const measureAll = () => {
    measureRail("start");
    measureRail("end");
    syncRailsState();
  };

  /** Re-applies the current target after a layout change (no animation while idle). */
  const relayout = () => {
    measureAll();
    if (drag?.isActive || wheelRaw !== null) return;
    if (springTarget !== null) {
      springTarget = targetFor(desired);

      return;
    }
    translation = targetFor(desired);
    write();
  };

  /* ------------------------------------------------------------------------------------------- *
   * Rendering
   * ------------------------------------------------------------------------------------------- */
  const write = () => {
    const startWidth = widthOf("start");
    const endWidth = widthOf("end");
    const startProgress = startWidth > 0 ? clamp01(translation / startWidth) : 0;
    const endProgress = endWidth > 0 ? clamp01(-translation / endWidth) : 0;

    if (root) {
      const style = root.style;
      const distance = opts.cornerDistance;
      const corner = distance > 0 ? clamp01(Math.abs(translation) / distance) : translation ? 1 : 0;

      style.setProperty("--swipeable-row-translation", `${translation.toFixed(2)}px`);
      style.setProperty("--swipeable-row-offset", `${Math.abs(translation).toFixed(2)}px`);
      style.setProperty("--swipeable-row-start-progress", startProgress.toFixed(4));
      style.setProperty("--swipeable-row-end-progress", endProgress.toFixed(4));
      style.setProperty(
        "--swipeable-row-progress",
        Math.max(startProgress, endProgress).toFixed(4),
      );
      style.setProperty("--swipeable-row-corner-progress", corner.toFixed(4));
    }

    for (const side of ["start", "end"] as const) {
      const rail = rails[side];

      if (!rail) continue;
      const distance = side === "start" ? Math.max(0, translation) : Math.max(0, -translation);

      setFlag(rail.el, "data-revealed", distance > 0.5);

      // A full-swipe rail always spans from its outer edge to the card so the primary action grows.
      const stretch = rail.allowsFullSwipe && rail.width > 0 && distance > rail.width;
      const minWidth = stretch ? `${distance.toFixed(2)}px` : "";

      if (rail.el.style.minWidth !== minWidth) rail.el.style.minWidth = minWidth;
    }

    for (const entry of actions.values()) {
      const distance =
        entry.side === "start" ? Math.max(0, translation) : Math.max(0, -translation);
      const span = entry.to - entry.from;
      const progress = span > 0 ? clamp01((distance - entry.from) / span) : 1;

      entry.el.style.setProperty("--swipeable-row-action-progress", progress.toFixed(4));
    }

    if (
      snapshot.translation !== translation ||
      snapshot.startProgress !== startProgress ||
      snapshot.endProgress !== endProgress
    ) {
      snapshot = {endProgress, startProgress, translation};
      listeners.forEach((listener) => listener());
    }
  };

  const setFullSwipeArmed = (side: SwipeableRowOpenSide) => {
    if (fullSwipeArmed === side) return;
    fullSwipeArmed = side;
    if (root) setFlag(root, "data-full-swipe", side !== null);
    for (const key of ["start", "end"] as const) {
      const rail = rails[key];

      if (rail) setFlag(rail.el, "data-full-swipe", key === side);
    }
  };

  /* ------------------------------------------------------------------------------------------- *
   * Spring
   * ------------------------------------------------------------------------------------------- */
  const stopAnimation = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    springTarget = null;
  };

  const step = (now: number) => {
    frame = 0;
    if (springTarget === null) return;

    const target = springTarget;
    const {damping, mass, stiffness} = opts.spring;
    let remaining = Math.min(0.064, Math.max(0, (now - lastFrameTime) / 1000));

    lastFrameTime = now;

    // Semi-implicit Euler in small sub-steps keeps stiff springs stable at any frame rate.
    while (remaining > 0) {
      const dt = Math.min(1 / 240, remaining);
      const acceleration = (-stiffness * (translation - target) - damping * velocity) / mass;

      velocity += acceleration * dt;
      translation += velocity * dt;
      remaining -= dt;
    }

    if (Math.abs(translation - target) < REST_DISTANCE && Math.abs(velocity) < REST_SPEED) {
      translation = target;
      velocity = 0;
      springTarget = null;
      write();

      return;
    }

    write();
    frame = requestAnimationFrame(step);
  };

  const jumpTo = (value: number) => {
    stopAnimation();
    translation = value;
    velocity = 0;
    write();
  };

  /** Moves toward `side`. Idempotent while already heading there. */
  const animateToSide = (side: SwipeableRowOpenSide, options?: SwipeableRowTransitionOptions) => {
    desired = side;
    if (drag?.isActive || wheelRaw !== null) return;

    const target = targetFor(side);
    const animated =
      options?.animated !== false &&
      hasSettledOnce &&
      !opts.isAnimationDisabled &&
      !prefersReducedMotion(root);

    hasSettledOnce = true;

    if (!animated) {
      jumpTo(target);

      return;
    }
    if (springTarget === target) return;
    if (springTarget === null && Math.abs(translation - target) < REST_DISTANCE) {
      jumpTo(target);

      return;
    }

    springTarget = target;
    if (!frame) {
      lastFrameTime = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  /** Engine-initiated decision: tell React and start moving right away. */
  const settle = (side: SwipeableRowOpenSide) => {
    animateToSide(side);
    opts.onRequestSide(side);
  };

  /* ------------------------------------------------------------------------------------------- *
   * Drag math
   * ------------------------------------------------------------------------------------------- */
  const limitSide = (distance: number, side: SwipeableRowSide) => {
    const rail = rails[side];
    const width = widthOf(side);
    const overshootFriction = Math.max(1, opts.overshootFriction);

    // Rubber band toward a side without actions.
    if (width <= 0) return opts.overshoot ? distance / overshootFriction : 0;
    if (distance <= width) return distance;
    // A full-swipe rail lets the card follow the finger across the row.
    if (rail?.allowsFullSwipe) return Math.min(distance, Math.max(width, rowWidth()));

    return opts.overshoot ? width + (distance - width) / overshootFriction : width;
  };

  const limit = (raw: number) => (raw >= 0 ? limitSide(raw, "start") : -limitSide(-raw, "end"));

  const fullSwipeDistance = (side: SwipeableRowSide) => {
    const rail = rails[side];

    if (!rail?.allowsFullSwipe || rail.width <= 0) return Infinity;

    return Math.max(rail.width + 24, rowWidth() * clamp01(rail.fullSwipeThreshold));
  };

  /** Plays the threshold haptics once per crossing. */
  const checkThresholds = () => {
    const side: SwipeableRowOpenSide = translation > 0 ? "start" : translation < 0 ? "end" : null;
    const distance = Math.abs(translation);
    const width = side ? widthOf(side) : 0;
    const crossed =
      side && width > 0 && distance >= Math.max(1, width * clamp01(opts.openThreshold))
        ? side
        : null;
    const armed = side && distance >= fullSwipeDistance(side) ? side : null;

    if (armed !== fullSwipeArmed) {
      setFullSwipeArmed(armed);
      opts.haptic("light");
    } else if (crossed !== openCrossed) {
      opts.haptic("light");
    }
    openCrossed = crossed;
  };

  const syncThresholdState = () => {
    const side: SwipeableRowOpenSide = translation > 0 ? "start" : translation < 0 ? "end" : null;
    const width = side ? widthOf(side) : 0;

    openCrossed =
      side && width > 0 && Math.abs(translation) >= width * clamp01(opts.openThreshold)
        ? side
        : null;
  };

  /** Decides where the row goes after a drag or a trackpad swipe ends. */
  const release = (cardVelocity: number, pointerType: DragState["pointerType"]) => {
    const armed = fullSwipeArmed;

    setFullSwipeArmed(null);
    velocity = cardVelocity;

    if (armed) {
      const primary = primaryOf(armed);

      opts.haptic("medium");
      const shouldClose = primary ? primary.trigger(pointerType) : true;

      settle(shouldClose ? null : armed);

      return;
    }

    const projected = translation + VELOCITY_TOSS * cardVelocity;
    const threshold = clamp01(opts.openThreshold);
    let side: SwipeableRowOpenSide = null;

    if (projected > 0 && widthOf("start") > 0 && projected >= widthOf("start") * threshold) {
      side = "start";
    } else if (projected < 0 && widthOf("end") > 0 && -projected >= widthOf("end") * threshold) {
      side = "end";
    }

    settle(side);
  };

  const releaseVelocity = (state: DragState) => {
    const now = performance.now();
    const samples = state.samples.filter((sample) => now - sample.time <= VELOCITY_WINDOW);

    if (samples.length < 2) return 0;
    const first = samples[0]!;
    const last = samples[samples.length - 1]!;
    const elapsed = last.time - first.time;

    // The finger rested before lifting: no fling.
    if (elapsed < 8 || now - last.time > 60) return 0;

    return ((last.position - first.position) / elapsed) * 1000;
  };

  /* ------------------------------------------------------------------------------------------- *
   * Pointer handlers
   * ------------------------------------------------------------------------------------------- */
  const removeWindowListeners = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
  };

  const endDrag = () => {
    removeWindowListeners();
    if (drag && root) {
      try {
        if (root.hasPointerCapture(drag.pointerId)) root.releasePointerCapture(drag.pointerId);
      } catch {
        // The pointer may already be gone.
      }
      root.removeAttribute("data-dragging");
    }
    drag = null;
  };

  const onPointerDown = (event: PointerEvent) => {
    // A new press never inherits the click guard of a previous drag.
    suppressClick = false;
    if (!root || drag || opts.isDisabled || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const target = event.target instanceof Element ? event.target : null;

    // Actions keep their own press handling; nested rows handle their own gestures.
    if (target?.closest(RAIL_SELECTOR) && root.contains(target.closest(RAIL_SELECTOR))) return;
    if (target && target.closest("[data-slot='swipeable-row']") !== root) return;
    if (target?.closest(A11Y_SELECTOR)) return;

    drag = {
      base: translation,
      dir: 1,
      isActive: false,
      pointerId: event.pointerId,
      pointerType: toPointerType(event.pointerType),
      samples: [],
      startX: event.clientX,
      startY: event.clientY,
    };
    window.addEventListener("pointermove", onPointerMove, {passive: false});
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  };

  const activate = (event: PointerEvent) => {
    if (!drag || !root) return;
    stopAnimation();
    measureAll();
    drag.isActive = true;
    drag.base = translation;
    drag.dir = isRtl(root) ? -1 : 1;
    // Start from the activation point so the card does not jump by the activation distance.
    drag.startX = event.clientX;
    syncThresholdState();
    try {
      root.setPointerCapture(event.pointerId);
    } catch {
      // Capture is an optimisation; window listeners keep tracking without it.
    }
    root.setAttribute("data-dragging", "true");
    window.getSelection()?.removeAllRanges();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.isActive) {
      const [minY, maxY] = opts.failOffsetY;

      if (dy < minY || dy > maxY) {
        // Vertical intent: leave the pointer to the page (scrolling, text selection).
        endDrag();

        return;
      }
      if (Math.abs(dx) < opts.activationThreshold) return;
      activate(event);
    }

    if (event.cancelable) event.preventDefault();

    const position = (event.clientX - drag.startX) * drag.dir;
    const now = performance.now();

    drag.samples.push({position, time: now});
    if (drag.samples.length > 12) drag.samples.shift();

    translation = limit(drag.base + position / Math.max(1, opts.friction));
    velocity = 0;
    write();
    checkThresholds();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const state = drag;

    endDrag();
    if (!state.isActive) return;

    // The click that follows a mouse drag (dispatched in this same task) must not reach the
    // content or an action. Touch drags produce no click, so the guard expires right after.
    suppressClick = true;
    setTimeout(() => {
      suppressClick = false;
    }, 0);
    release(releaseVelocity(state) / Math.max(1, opts.friction), state.pointerType);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const wasActive = drag.isActive;

    endDrag();
    if (!wasActive) return;
    setFullSwipeArmed(null);
    settle(desired);
  };

  const onClickCapture = (event: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();

      return;
    }

    const target = event.target instanceof Element ? event.target : null;

    if (
      desired !== null &&
      opts.closeOnContentPress &&
      content &&
      target &&
      content.contains(target) &&
      !target.closest(A11Y_SELECTOR)
    ) {
      // Pressing the uncovered card closes it instead of activating what is inside.
      event.preventDefault();
      event.stopPropagation();
      settle(null);
    }
  };

  const onDragStart = (event: DragEvent) => {
    if (drag) event.preventDefault();
  };

  const onSelectStart = (event: Event) => {
    if (drag?.isActive) event.preventDefault();
  };

  const onOutsideInteraction = (event: Event) => {
    if (desired === null || !opts.closeOnOutsidePress || !root || drag) return;
    const target = event.target;

    if (target instanceof Node && root.contains(target)) return;
    settle(null);
  };

  /* ------------------------------------------------------------------------------------------- *
   * Trackpad (horizontal wheel) swipes
   * ------------------------------------------------------------------------------------------- */
  const onWheel = (event: WheelEvent) => {
    if (!root || opts.isDisabled || drag) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rowWidth() : 1;
    const delta = -event.deltaX * unit * (isRtl(root) ? -1 : 1);

    if (wheelRaw === null) {
      stopAnimation();
      measureAll();
      wheelRaw = translation;
      syncThresholdState();
    }
    wheelRaw += delta / Math.max(1, opts.friction);
    translation = limit(wheelRaw);
    write();
    checkThresholds();

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelRaw = null;
      release(0, "mouse");
    }, WHEEL_SETTLE_DELAY);
  };

  const syncWheelListener = () => {
    if (!root) return;
    if (opts.enableTrackpad && !wheelAttached) {
      root.addEventListener("wheel", onWheel, {passive: false});
      wheelAttached = true;
    } else if (!opts.enableTrackpad && wheelAttached) {
      root.removeEventListener("wheel", onWheel);
      wheelAttached = false;
    }
  };

  /* ------------------------------------------------------------------------------------------- *
   * Public API
   * ------------------------------------------------------------------------------------------- */
  const getResizeObserver = () => {
    if (!resizeObserver && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => relayout());
    }

    return resizeObserver;
  };

  return {
    /** Wires the root element. Returns the cleanup. */
    attach(element: HTMLElement) {
      root = element;
      element.addEventListener("pointerdown", onPointerDown);
      element.addEventListener("click", onClickCapture, true);
      element.addEventListener("dragstart", onDragStart);
      document.addEventListener("selectstart", onSelectStart);
      document.addEventListener("pointerdown", onOutsideInteraction, true);
      document.addEventListener("focusin", onOutsideInteraction);
      getResizeObserver()?.observe(element);
      syncWheelListener();
      measureAll();
      write();

      return () => {
        endDrag();
        stopAnimation();
        clearTimeout(wheelTimer);
        wheelRaw = null;
        element.removeEventListener("pointerdown", onPointerDown);
        element.removeEventListener("click", onClickCapture, true);
        element.removeEventListener("dragstart", onDragStart);
        document.removeEventListener("selectstart", onSelectStart);
        document.removeEventListener("pointerdown", onOutsideInteraction, true);
        document.removeEventListener("focusin", onOutsideInteraction);
        if (wheelAttached) element.removeEventListener("wheel", onWheel);
        wheelAttached = false;
        resizeObserver?.unobserve(element);
        root = null;
      };
    },

    setOptions(next: SwipeEngineOptions) {
      const wasDisabled = opts.isDisabled;
      const railsListenerChanged = opts.onRailsChange !== next.onRailsChange;

      opts = next;
      syncWheelListener();
      // Rails register before the root's first options push: report what they measured.
      if (railsListenerChanged) next.onRailsChange(railsState);
      if (next.isDisabled && !wasDisabled) {
        endDrag();
        setFullSwipeArmed(null);
        // Disabling an open row closes it.
        if (desired !== null) next.onRequestSide(null);
      }
    },

    registerRail(side: SwipeableRowSide, element: HTMLElement, options: SwipeRailOptions) {
      const entry: RailEntry = {...options, cover: 0, el: element, width: 0};

      rails[side] = entry;
      getResizeObserver()?.observe(element);
      relayout();

      return () => {
        resizeObserver?.unobserve(element);
        element.style.minWidth = "";
        if (rails[side] === entry) delete rails[side];
        relayout();
      };
    },

    updateRail(side: SwipeableRowSide, options: SwipeRailOptions) {
      const rail = rails[side];

      if (!rail) return;
      if (
        rail.allowsFullSwipe === options.allowsFullSwipe &&
        rail.fullSwipeThreshold === options.fullSwipeThreshold
      ) {
        return;
      }
      rail.allowsFullSwipe = options.allowsFullSwipe;
      rail.fullSwipeThreshold = options.fullSwipeThreshold;
      relayout();
    },

    registerAction(side: SwipeableRowSide, element: HTMLElement, handlers: SwipeActionHandlers) {
      actions.set(element, {...handlers, el: element, from: 0, side, to: 0});
      relayout();

      return () => {
        actions.delete(element);
        element.removeAttribute("data-primary");
        relayout();
      };
    },

    updateAction(element: HTMLElement, handlers: SwipeActionHandlers) {
      const entry = actions.get(element);

      if (entry) entry.trigger = handlers.trigger;
    },

    registerContent(element: HTMLElement) {
      content = element;

      return () => {
        if (content === element) content = null;
      };
    },

    /** Syncs the side React considers open. The first call jumps without animating. */
    setDesired(side: SwipeableRowOpenSide) {
      animateToSide(side);
    },

    animateToSide,

    hasRail(side: SwipeableRowSide) {
      return widthOf(side) > 0;
    },

    /** Cancels any gesture or animation and jumps closed. */
    reset() {
      endDrag();
      clearTimeout(wheelTimer);
      wheelRaw = null;
      setFullSwipeArmed(null);
      desired = null;
      jumpTo(0);
    },

    focusContent() {
      content?.focus({preventScroll: true});
    },

    focusRail(side: SwipeableRowSide) {
      const first = actionsOf(side).find((entry) => !entry.el.matches(":disabled"));

      first?.el.focus({preventScroll: true});
    },

    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot() {
      return snapshot;
    },
  };
}
