"use client";

/**
 * Scroll physics and input handling for `WheelPicker` (one instance per wheel, framework agnostic).
 *
 * Positions are measured in rows: `offset` 0 centres the first row on the indicator, `offset` 2.5
 * sits half way between the third and fourth row. The engine writes the offset to the root as the
 * `--wheel-picker-offset` custom property every frame, so the per-row fade / scale / label colour
 * are pure CSS and React does not re-render the wheel while it moves.
 *
 * Motion model, measured frame by frame in the HeroUI Pro Native demo video:
 * - the content follows the finger 1:1 and rubber-bands past the first / last row;
 * - a release decelerates exponentially (time constant ~100 ms, iOS "fast" deceleration) and is
 *   retargeted so it lands exactly on a row (the velocity stays continuous);
 * - tap-to-focus, keyboard and imperative scrolls approach the target exponentially (~100 ms);
 * - a fling into the first / last row bounces with a critically damped spring; an overscroll
 *   released by the finger returns in ~130 ms.
 */

export type WheelPickerMotionSource =
  "drag" | "momentum" | "wheel" | "keyboard" | "tap" | "programmatic" | "external";

export interface WheelPickerEngineHandlers {
  /**
   * A new row became the selected row. Live sources (drag, momentum, wheel) report every row that
   * crosses the indicator; discrete sources (keyboard, tap, wheel notch, programmatic) report the
   * target once. External value syncs never report.
   */
  onCommit?: (index: number, source: WheelPickerMotionSource) => void;
  /** The wheel started moving (`true`) or came to rest (`false`). */
  onMotionChange?: (isMoving: boolean) => void;
}

export interface WheelPickerEngineConfig {
  count: number;
  itemHeight: number;
  visibleCount: number;
  isDisabled: boolean;
  /** `animation="disable-all"`: settle instantly instead of animating. */
  isMotionDisabled: boolean;
  /** Row labels used by keyboard type-ahead. */
  labels: readonly string[];
}

/** Exponential approach time constant for snaps, taps, keys and imperative scrolls (ms). */
const SETTLE_TAU = 100;
/** Deceleration time constant of a fling (ms); 1 - e^(-1/100) ~ iOS `decelerationRate="fast"`. */
const MOMENTUM_TAU = 100;
/** Return from an overscroll the finger released (ms). */
const OVERSCROLL_TAU = 130;
/** Bounds for the retargeted fling time constant (ms). */
const MIN_FLING_TAU = 40;
const MAX_FLING_TAU = 220;
/** Critically damped spring for edge bounces (1/ms). */
const SPRING_OMEGA = 0.028;
/** Velocity cap when a fling hits the first / last row (rows/ms): limits the bounce to ~1/4 row. */
const MAX_BOUNCE_VELOCITY = 0.02;
/** Release velocity cap (rows/ms). */
const MAX_VELOCITY = 0.25;
/** Velocity below which a free fling hands over to a snap (rows/ms). */
const MIN_FLING_VELOCITY = 0.0004;
/** Distance below which the wheel counts as settled (px; the exponential tail is invisible). */
const REST_DISTANCE = 0.25;
/** iOS rubber-band coefficient. */
const RUBBER_BAND = 0.55;
/** Movement (px) before a press becomes a drag. */
const TOUCH_SLOP = 6;
const MOUSE_SLOP = 3;
/** Velocity sampling window and staleness (ms). */
const VELOCITY_WINDOW = 100;
const VELOCITY_STALE = 60;
/** A wheel event this large (px) is a mouse-wheel notch and moves exactly one row. */
const WHEEL_STEP_THRESHOLD = 50;
/** Idle time after the last trackpad wheel event before the wheel snaps (ms). */
const WHEEL_IDLE = 140;
/** Window in which a click right after a drag is swallowed (ms). */
const CLICK_SUPPRESS_WINDOW = 400;
/** Type-ahead buffer reset (ms). */
const TYPEAHEAD_TIMEOUT = 600;

type Motion =
  | {kind: "approach"; target: number; tau: number; live: WheelPickerMotionSource | null}
  | {kind: "momentum"; velocity: number}
  | {kind: "spring"; target: number; velocity: number};

interface DragState {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  /** Un-rubber-banded offset when the drag started. */
  rawStart: number;
  isDragging: boolean;
  /** The press stopped a moving wheel (it never counts as a tap). */
  caughtMotion: boolean;
  samples: Array<{t: number; x: number}>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const rubberBand = (excess: number, limit: number) =>
  (1 - 1 / ((excess * RUBBER_BAND) / limit + 1)) * limit;

const unRubberBand = (distance: number, limit: number) =>
  distance >= limit ? limit * 10 : (limit / RUBBER_BAND) * (1 / (1 - distance / limit) - 1);

export class WheelPickerEngine {
  /** Current position in rows (fractional while moving). */
  offset: number;
  /** Row that is currently reported as selected. */
  committedIndex: number;

  private config: WheelPickerEngineConfig = {
    count: 0,
    isDisabled: false,
    isMotionDisabled: false,
    itemHeight: 44,
    labels: [],
    visibleCount: 5,
  };
  private handlers: WheelPickerEngineHandlers = {};
  private element: HTMLElement | null = null;
  private motion: Motion | null = null;
  private frame = 0;
  private lastFrameTime = 0;
  private isMoving = false;
  private drag: DragState | null = null;
  private wheelIdleTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressClickUntil = 0;
  private reducedMotion = false;
  private listeners = new Set<() => void>();
  private typeahead = {text: "", time: 0};

  constructor(initialIndex: number) {
    this.offset = initialIndex;
    this.committedIndex = initialIndex;
  }

  /* ---------------------------------------------------------------------------------------------
   * Store (per-frame subscribers: rows that expose `absDistance`, `scrollY.subscribe`)
   * -------------------------------------------------------------------------------------------*/
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  getOffset = () => this.offset;

  /* ---------------------------------------------------------------------------------------------
   * Configuration
   * -------------------------------------------------------------------------------------------*/
  setHandlers(handlers: WheelPickerEngineHandlers) {
    this.handlers = handlers;
  }

  configure(config: WheelPickerEngineConfig) {
    this.config = config;
    if (config.count === 0) return;

    const max = this.max;

    if (this.committedIndex > max) this.committedIndex = max;
    if (this.motion?.kind === "approach" && this.motion.target > max) this.motion.target = max;
    // The list shrank below the current row: clamp without animating.
    if (this.offset > max && !this.drag?.isDragging && this.motion?.kind !== "spring") {
      this.stop();
      this.write(max, null);
      this.settle();
    }
  }

  get isScrolling() {
    return this.isMoving;
  }

  private get max() {
    return Math.max(0, this.config.count - 1);
  }

  private get isInstant() {
    return this.config.isMotionDisabled || this.reducedMotion;
  }

  /** Settling threshold in rows. */
  private get restEpsilon() {
    return REST_DISTANCE / this.config.itemHeight;
  }

  private clampIndex(value: number) {
    return clamp(Math.round(value), 0, this.max);
  }

  /* ---------------------------------------------------------------------------------------------
   * DOM wiring
   * -------------------------------------------------------------------------------------------*/
  attach(element: HTMLElement) {
    this.element = element;

    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const onMediaChange = () => {
      this.reducedMotion = !!media?.matches;
    };

    onMediaChange();
    media?.addEventListener?.("change", onMediaChange);

    element.addEventListener("pointerdown", this.onPointerDown);
    element.addEventListener("pointermove", this.onPointerMove);
    element.addEventListener("pointerup", this.onPointerUp);
    element.addEventListener("pointercancel", this.onPointerCancel);
    element.addEventListener("lostpointercapture", this.onLostPointerCapture);
    element.addEventListener("wheel", this.onWheel, {passive: false});
    element.addEventListener("keydown", this.onKeyDown);
    element.addEventListener("click", this.onClickCapture, true);
    element.addEventListener("dragstart", this.onDragStart);

    // React rendered the mount position; sync anything that changed before the effect ran.
    this.write(this.offset, null);

    return () => {
      media?.removeEventListener?.("change", onMediaChange);
      element.removeEventListener("pointerdown", this.onPointerDown);
      element.removeEventListener("pointermove", this.onPointerMove);
      element.removeEventListener("pointerup", this.onPointerUp);
      element.removeEventListener("pointercancel", this.onPointerCancel);
      element.removeEventListener("lostpointercapture", this.onLostPointerCapture);
      element.removeEventListener("wheel", this.onWheel);
      element.removeEventListener("keydown", this.onKeyDown);
      element.removeEventListener("click", this.onClickCapture, true);
      element.removeEventListener("dragstart", this.onDragStart);

      this.stop();
      this.cancelWheelIdle();
      this.drag = null;
      element.removeAttribute("data-dragging");
      // Snap a half-way wheel so a remount starts on a row.
      if (this.offset !== this.committedIndex) this.offset = this.committedIndex;
      this.settle();
      this.element = null;
    };
  }

  /* ---------------------------------------------------------------------------------------------
   * Public motion API
   * -------------------------------------------------------------------------------------------*/
  /**
   * Selects `index` right away (reporting it once unless `source` is `"external"`) and moves the
   * wheel there: animated by default, instantly when `animated` is false, motion is disabled or
   * the user prefers reduced motion.
   */
  scrollToIndex(
    index: number,
    {animated = true, source}: {animated?: boolean; source: WheelPickerMotionSource},
  ) {
    if (this.config.count === 0) return;
    // Never fight the finger: an external value update during a drag is dropped.
    if (source === "external" && this.drag?.isDragging) return;

    const target = this.clampIndex(index);
    const changed = target !== this.committedIndex;

    this.cancelWheelIdle();
    this.committedIndex = target;
    if (changed && source !== "external") this.handlers.onCommit?.(target, source);

    if (!animated || this.isInstant || !this.element) {
      this.stop();
      this.write(target, null);
      this.settle();

      return;
    }

    if (Math.abs(this.offset - target) < this.restEpsilon && !this.motion) return;
    this.start({kind: "approach", live: null, target, tau: SETTLE_TAU});
  }

  /* ---------------------------------------------------------------------------------------------
   * Frame loop
   * -------------------------------------------------------------------------------------------*/
  private write(offset: number, live: WheelPickerMotionSource | null) {
    this.offset = offset;

    const element = this.element;

    if (element) {
      const max = this.max;

      element.style.setProperty("--wheel-picker-offset", String(Math.round(offset * 1e4) / 1e4));
      element.style.setProperty(
        "--wheel-picker-progress",
        String(max > 0 ? Math.round(clamp(offset / max, 0, 1) * 1e4) / 1e4 : 0),
      );
    }

    for (const listener of this.listeners) listener();

    if (live && this.config.count > 0) {
      const index = this.clampIndex(offset);

      if (index !== this.committedIndex) {
        this.committedIndex = index;
        this.handlers.onCommit?.(index, live);
      }
    }
  }

  private setMoving(isMoving: boolean) {
    if (this.isMoving === isMoving) return;
    this.isMoving = isMoving;
    if (isMoving) this.element?.setAttribute("data-scrolling", "true");
    else this.element?.removeAttribute("data-scrolling");
    this.handlers.onMotionChange?.(isMoving);
  }

  /** Marks the wheel as resting unless a finger or a trackpad still drives it. */
  private settle() {
    if (this.drag?.isDragging || this.motion || this.wheelIdleTimer !== undefined) return;
    this.setMoving(false);
  }

  private start(motion: Motion) {
    this.motion = motion;
    this.setMoving(true);
    if (this.frame || typeof requestAnimationFrame !== "function") return;
    this.lastFrameTime = performance.now();
    this.frame = requestAnimationFrame(this.step);
  }

  private stop() {
    this.motion = null;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private step = (now: number) => {
    this.frame = 0;

    const motion = this.motion;

    if (!motion) return;

    const dt = clamp(now - this.lastFrameTime, 0, 48);
    let x = this.offset;
    let done = false;
    let live: WheelPickerMotionSource | null = "momentum";

    this.lastFrameTime = now;

    if (motion.kind === "approach") {
      live = motion.live;
      x = motion.target + (x - motion.target) * Math.exp(-dt / motion.tau);
      if (Math.abs(x - motion.target) < this.restEpsilon) {
        x = motion.target;
        done = true;
      }
    } else if (motion.kind === "momentum") {
      const decay = Math.exp(-dt / MOMENTUM_TAU);
      const max = this.max;

      x += motion.velocity * MOMENTUM_TAU * (1 - decay);
      motion.velocity *= decay;

      if (x < 0 || x > max) {
        const bound = x < 0 ? 0 : max;

        // Hand over to a bounce at the first / last row.
        x = bound + clamp(x - bound, -0.05, 0.05);
        this.motion = {
          kind: "spring",
          target: bound,
          velocity: clamp(motion.velocity, -MAX_BOUNCE_VELOCITY, MAX_BOUNCE_VELOCITY),
        };
      } else if (Math.abs(motion.velocity) < MIN_FLING_VELOCITY) {
        this.motion = {
          kind: "approach",
          live: "momentum",
          target: this.clampIndex(x),
          tau: SETTLE_TAU,
        };
      }
    } else {
      let velocity = motion.velocity;
      let remaining = dt;

      // Semi-implicit Euler in 4 ms sub-steps keeps the stiff spring stable.
      while (remaining > 0) {
        const h = Math.min(4, remaining);
        const acceleration =
          -SPRING_OMEGA * SPRING_OMEGA * (x - motion.target) - 2 * SPRING_OMEGA * velocity;

        remaining -= h;
        velocity += acceleration * h;
        x += velocity * h;
      }
      motion.velocity = velocity;
      if (Math.abs(x - motion.target) < this.restEpsilon && Math.abs(velocity) < 0.0002) {
        x = motion.target;
        done = true;
      }
    }

    this.write(x, live);

    if (done) {
      this.motion = null;
      this.settle();

      return;
    }

    this.frame = requestAnimationFrame(this.step);
  };

  /** Snaps after a drag, a caught fling or a trackpad gesture, keeping the release velocity. */
  private release(velocity: number) {
    const max = this.max;
    const x = this.offset;

    if (x < 0 || x > max) {
      const bound = x < 0 ? 0 : max;

      if (this.isInstant) {
        this.write(bound, "momentum");
        this.settle();
      } else {
        this.start({kind: "approach", live: "momentum", target: bound, tau: OVERSCROLL_TAU});
      }

      return;
    }

    const v = clamp(velocity, -MAX_VELOCITY, MAX_VELOCITY);
    const projected = x + v * MOMENTUM_TAU;

    if (this.isInstant) {
      this.write(this.clampIndex(projected), "momentum");
      this.settle();

      return;
    }

    // The fling would leave the list: decelerate freely and bounce off the edge.
    if (projected < -0.5 || projected > max + 0.5) {
      this.start({kind: "momentum", velocity: v});

      return;
    }

    const target = this.clampIndex(projected);
    const distance = target - x;

    if (Math.abs(distance) < this.restEpsilon) {
      this.write(target, "momentum");
      this.settle();

      return;
    }

    // Retarget the deceleration so it lands on the row with a continuous velocity.
    const tau =
      v !== 0 && Math.sign(v) === Math.sign(distance)
        ? clamp(distance / v, MIN_FLING_TAU, MAX_FLING_TAU)
        : SETTLE_TAU;

    this.start({kind: "approach", live: "momentum", target, tau});
  }

  /* ---------------------------------------------------------------------------------------------
   * Pointer (touch, pen and mouse)
   * -------------------------------------------------------------------------------------------*/
  private get rubberLimit() {
    return this.config.visibleCount / 2;
  }

  private fromRaw(raw: number) {
    const max = this.max;

    if (raw < 0) return -rubberBand(-raw, this.rubberLimit);
    if (raw > max) return max + rubberBand(raw - max, this.rubberLimit);

    return raw;
  }

  private toRaw(offset: number) {
    const max = this.max;

    if (offset < 0) return -unRubberBand(-offset, this.rubberLimit);
    if (offset > max) return max + unRubberBand(offset - max, this.rubberLimit);

    return offset;
  }

  private onPointerDown = (event: PointerEvent) => {
    if (this.config.isDisabled || this.config.count === 0 || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const caughtMotion = this.motion !== null || this.wheelIdleTimer !== undefined;

    // Touching a moving wheel stops it where it is (like iOS).
    if (caughtMotion) {
      this.stop();
      this.cancelWheelIdle();
    }

    this.suppressClickUntil = 0;
    this.drag = {
      caughtMotion,
      isDragging: false,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      rawStart: this.toRaw(this.offset),
      samples: [],
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  private onPointerMove = (event: PointerEvent) => {
    const drag = this.drag;
    const element = this.element;

    if (!drag || !element || event.pointerId !== drag.pointerId) return;

    if (!drag.isDragging) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const slop = drag.pointerType === "mouse" ? MOUSE_SLOP : TOUCH_SLOP;

      if (Math.abs(dx) > slop && Math.abs(dx) > Math.abs(dy)) {
        // A horizontal gesture belongs to the page (pagers, carousels).
        if (!drag.caughtMotion) this.drag = null;

        return;
      }
      if (Math.abs(dy) < slop) return;

      // Start tracking from here so the content does not jump by the slop distance.
      drag.isDragging = true;
      drag.startY = event.clientY;
      drag.rawStart = this.toRaw(this.offset);
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // The pointer may already be gone (synthetic events); tracking still works without it.
      }
      element.setAttribute("data-dragging", "true");
      this.setMoving(true);
    }

    event.preventDefault();

    const raw = drag.rawStart - (event.clientY - drag.startY) / this.config.itemHeight;
    const offset = this.fromRaw(raw);
    const time = event.timeStamp;

    drag.samples.push({t: time, x: offset});
    while (drag.samples.length > 2 && time - drag.samples[0]!.t > VELOCITY_WINDOW) {
      drag.samples.shift();
    }

    this.write(offset, "drag");
  };

  private onPointerUp = (event: PointerEvent) => {
    const drag = this.drag;

    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag = null;

    if (drag.isDragging) {
      this.endDrag(event.pointerId);
      this.suppressClickUntil = event.timeStamp + CLICK_SUPPRESS_WINDOW;
      this.release(this.releaseVelocity(drag.samples, event.timeStamp));
    } else if (drag.caughtMotion) {
      this.suppressClickUntil = event.timeStamp + CLICK_SUPPRESS_WINDOW;
      this.release(0);
    }
    // Otherwise it is a tap: the click reaches the row and `WheelPicker.Item` focuses it.
  };

  private onPointerCancel = (event: PointerEvent) => {
    const drag = this.drag;

    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag = null;
    if (drag.isDragging) this.endDrag(event.pointerId);
    if (drag.isDragging || drag.caughtMotion) this.release(0);
  };

  private onLostPointerCapture = (event: PointerEvent) => {
    // Capture can be lost without a pointerup/cancel (element re-parented, devtools ...). Touch
    // pointers are implicitly captured by the pressed row: taking the capture over makes *that*
    // row fire lostpointercapture, which bubbles up here and must be ignored.
    if (event.target !== this.element) return;
    if (this.drag?.isDragging && event.pointerId === this.drag.pointerId) {
      this.onPointerCancel(event);
    }
  };

  private endDrag(pointerId: number) {
    const element = this.element;

    if (!element) return;
    element.removeAttribute("data-dragging");
    try {
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    } catch {
      // ignore
    }
  }

  private releaseVelocity(samples: DragState["samples"], now: number) {
    const last = samples[samples.length - 1];

    if (!last || samples.length < 2 || now - last.t > VELOCITY_STALE) return 0;

    const first = samples.find((sample) => last.t - sample.t <= VELOCITY_WINDOW) ?? samples[0]!;
    const dt = last.t - first.t;

    return dt > 0 ? (last.x - first.x) / dt : 0;
  }

  private onClickCapture = (event: MouseEvent) => {
    if (!this.suppressClickUntil) return;

    const suppress = event.timeStamp <= this.suppressClickUntil;

    this.suppressClickUntil = 0;
    if (!suppress) return;
    // The click that ends a drag or a caught fling must not tap-to-focus a row.
    event.stopPropagation();
    event.preventDefault();
  };

  private onDragStart = (event: DragEvent) => {
    event.preventDefault();
  };

  /* ---------------------------------------------------------------------------------------------
   * Mouse wheel / trackpad
   * -------------------------------------------------------------------------------------------*/
  private cancelWheelIdle() {
    if (this.wheelIdleTimer === undefined) return;
    clearTimeout(this.wheelIdleTimer);
    this.wheelIdleTimer = undefined;
  }

  private onWheel = (event: WheelEvent) => {
    if (this.config.isDisabled || this.config.count === 0 || event.ctrlKey) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    // The wheel consumes vertical scrolling while the pointer is over it (like the native list).
    event.preventDefault();
    if (this.drag?.isDragging) return;

    const {itemHeight, visibleCount} = this.config;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? itemHeight * visibleCount : 1;
    const delta = event.deltaY * unit;

    // A mouse-wheel notch moves exactly one row (animated), like a stepper.
    if (Math.abs(delta) >= WHEEL_STEP_THRESHOLD) {
      const base =
        this.motion?.kind === "approach" ? this.motion.target : this.clampIndex(this.offset);
      const target = this.clampIndex(base + Math.sign(delta));

      if (target !== base || target !== this.committedIndex) {
        this.scrollToIndex(target, {source: "wheel"});
      }

      return;
    }

    // Trackpads stream small deltas (including the OS inertia): follow them 1:1, snap when idle.
    this.stop();
    this.setMoving(true);
    this.write(clamp(this.offset + delta / itemHeight, 0, this.max), "wheel");
    this.cancelWheelIdle();
    this.wheelIdleTimer = setTimeout(() => {
      this.wheelIdleTimer = undefined;
      this.release(0);
      this.settle();
    }, WHEEL_IDLE);
  };

  /* ---------------------------------------------------------------------------------------------
   * Keyboard (listbox pattern)
   * -------------------------------------------------------------------------------------------*/
  private onKeyDown = (event: KeyboardEvent) => {
    if (this.config.isDisabled || this.config.count === 0) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const base = this.committedIndex;
    const page = Math.max(1, this.config.visibleCount);
    let target: number | null = null;

    switch (event.key) {
      case "ArrowDown":
        target = base + 1;
        break;
      case "ArrowUp":
        target = base - 1;
        break;
      case "PageDown":
        target = base + page;
        break;
      case "PageUp":
        target = base - page;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = this.max;
        break;
      default:
        if (event.key.length === 1 && event.key !== " ") {
          target = this.typeAhead(event.key, event.timeStamp);
        }
    }

    if (target === null) return;
    event.preventDefault();
    this.scrollToIndex(target, {source: "keyboard"});
  };

  private typeAhead(char: string, time: number) {
    const state = this.typeahead;
    const {labels} = this.config;

    state.text = time - state.time > TYPEAHEAD_TIMEOUT ? char : state.text + char;
    state.time = time;

    const search = state.text.toLocaleLowerCase();
    // A repeated single character cycles through the matches.
    const start = state.text.length === 1 ? this.committedIndex + 1 : this.committedIndex;

    for (let step = 0; step < labels.length; step++) {
      const index = (start + step) % labels.length;

      if (labels[index]?.toLocaleLowerCase().startsWith(search)) return index;
    }

    return null;
  }
}
