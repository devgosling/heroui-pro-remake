/**
 * Continuous pager position for SwipeableTabs.
 *
 * The position is a fractional page index (`1.5` = halfway between the 2nd and 3rd page). It is the
 * web stand-in for the Native `progress` SharedValue: a tiny observable that the pager, the
 * indicator and the root CSS variable read every frame without re-rendering React.
 *
 * Motion (measured on the Native demo video):
 * - Trigger press / value change / `goTo`: the pager slides with an ease-in-out curve in ~300ms
 *   (iOS `setPage` feel), a little longer when it crosses several pages.
 * - Swipe release: a critically damped spring that starts with the finger's velocity and settles in
 *   ~200ms (iOS paging deceleration).
 */

export type PositionListener = (position: number) => void;

export interface SpringConfig {
  damping: number;
  mass: number;
  stiffness: number;
}

/**
 * Settle spring after a swipe: critically damped with ω = 30 rad/s. Fitted to the demo video, where
 * a slow release has ~55 % of the distance left after 50 ms, ~20 % after 100 ms, ~6 % after 150 ms
 * and rests at ~200 ms.
 */
export const RELEASE_SPRING: SpringConfig = {damping: 60, mass: 1, stiffness: 900};

/** Base slide duration for presses and programmatic changes (ms). */
export const SLIDE_DURATION = 300;
/** Extra slide duration per additional page crossed (ms) and the upper bound. */
export const SLIDE_DURATION_PER_PAGE = 40;
export const SLIDE_DURATION_MAX = 420;

export interface AnimateOptions {
  /** `tween` = ease-in-out slide (press / programmatic); `spring` = release settle. */
  type: "spring" | "tween";
  /** Initial velocity in pages per second (spring only). */
  velocity?: number;
  /** Called once the position rests at the target (not when the animation is interrupted). */
  onComplete?: () => void;
}

export interface PositionController {
  /** Current position (fractional page index). */
  get: () => number;
  /** Where the position is heading: the running animation's target, else the current position. */
  getTarget: () => number;
  isAnimating: () => boolean;
  /** Jumps to `position`, stopping any running animation. */
  set: (position: number) => void;
  /** Animates from the current position to `target`. */
  animateTo: (target: number, options: AnimateOptions) => void;
  /** Stops a running animation where it is. */
  stop: () => void;
  subscribe: (listener: PositionListener) => () => void;
}

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export const getSlideDuration = (distance: number) =>
  Math.min(
    SLIDE_DURATION_MAX,
    SLIDE_DURATION + Math.max(0, Math.abs(distance) - 1) * SLIDE_DURATION_PER_PAGE,
  );

export function createPositionController(initial = 0): PositionController {
  let position = initial;
  let target: number | null = null;
  let frame = 0;
  const listeners = new Set<PositionListener>();

  const emit = () => {
    for (const listener of listeners) listener(position);
  };

  const cancelFrame = () => {
    if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    frame = 0;
  };

  const stop = () => {
    cancelFrame();
    target = null;
  };

  const set = (next: number) => {
    stop();
    if (next === position) return;
    position = next;
    emit();
  };

  const animateTo = (to: number, {onComplete, type, velocity = 0}: AnimateOptions) => {
    stop();

    if (typeof requestAnimationFrame !== "function" || (to === position && velocity === 0)) {
      position = to;
      emit();
      onComplete?.();

      return;
    }

    target = to;

    if (type === "tween") {
      const from = position;
      const duration = getSlideDuration(to - from);
      let start: number | null = null;

      const tick = (now: number) => {
        start ??= now;
        const t = Math.min(1, (now - start) / duration);

        position = t < 1 ? from + (to - from) * easeInOutSine(t) : to;
        emit();

        if (t < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          frame = 0;
          target = null;
          onComplete?.();
        }
      };

      frame = requestAnimationFrame(tick);

      return;
    }

    // Spring: semi-implicit Euler with 1ms sub-steps (stable for the stiffness used here).
    const {damping, mass, stiffness} = RELEASE_SPRING;
    let v = velocity;
    let last: number | null = null;

    const tick = (now: number) => {
      const elapsed = last === null ? 16 : Math.min(64, now - last);

      last = now;
      for (let step = 0; step < elapsed; step++) {
        const acceleration = (-stiffness * (position - to) - damping * v) / mass;

        v += acceleration * 0.001;
        position += v * 0.001;
      }

      if (Math.abs(position - to) < 0.0005 && Math.abs(v) < 0.01) {
        position = to;
        emit();
        frame = 0;
        target = null;
        onComplete?.();

        return;
      }

      emit();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
  };

  return {
    animateTo,
    get: () => position,
    getTarget: () => target ?? position,
    isAnimating: () => target !== null,
    set,
    stop,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/* -------------------------------------------------------------------------------------------------
 * Trigger measurements
 * -----------------------------------------------------------------------------------------------*/
export interface SwipeableTabsMeasurement {
  /** Height of the trigger in px. */
  height: number;
  /** Width of the trigger in px. */
  width: number;
  /** Left offset inside the trigger container (List or ScrollView content) in px. */
  x: number;
  /** Top offset inside the trigger container in px. */
  y: number;
}

export type SwipeableTabsMeasurements = Readonly<Record<string, SwipeableTabsMeasurement>>;

export interface TriggerMeasurer {
  getElement: (value: string) => HTMLElement | undefined;
  getServerSnapshot: () => SwipeableTabsMeasurements;
  getSnapshot: () => SwipeableTabsMeasurements;
  /** Re-measures every registered trigger now. */
  measure: () => void;
  /** Registers a trigger element; returns the cleanup. */
  register: (value: string, element: HTMLElement) => () => void;
  /** Overrides the box of one trigger until the next automatic measurement. */
  set: (value: string, box: SwipeableTabsMeasurement) => void;
  subscribe: (listener: () => void) => () => void;
}

const EMPTY_MEASUREMENTS: SwipeableTabsMeasurements = Object.freeze({});

/**
 * Tracks the offset box of every trigger with one ResizeObserver (triggers and their container),
 * exposing an immutable snapshot for `useSyncExternalStore`. Layout reads use offset* values so
 * CSS transforms on ancestors (zoomed previews, scaled frames) do not distort them.
 */
export function createTriggerMeasurer(): TriggerMeasurer {
  const elements = new Map<string, HTMLElement>();
  const listeners = new Set<() => void>();
  let snapshot: SwipeableTabsMeasurements = EMPTY_MEASUREMENTS;
  let observer: ResizeObserver | null = null;
  let scheduled = false;

  const measure = () => {
    scheduled = false;
    const next: Record<string, SwipeableTabsMeasurement> = {};
    let changed = Object.keys(snapshot).length !== elements.size;

    for (const [value, element] of elements) {
      const box = {
        height: element.offsetHeight,
        width: element.offsetWidth,
        x: element.offsetLeft,
        y: element.offsetTop,
      };
      const previous = snapshot[value];

      next[value] = box;
      if (
        !previous ||
        previous.x !== box.x ||
        previous.y !== box.y ||
        previous.width !== box.width ||
        previous.height !== box.height
      ) {
        changed = true;
      }
    }

    if (!changed) return;
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(measure);
  };

  const getObserver = () => {
    if (!observer && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => measure());
    }

    return observer;
  };

  return {
    getElement: (value) => elements.get(value),
    getServerSnapshot: () => EMPTY_MEASUREMENTS,
    getSnapshot: () => snapshot,
    measure,
    register: (value, element) => {
      elements.set(value, element);
      const ro = getObserver();

      ro?.observe(element);
      if (element.parentElement) ro?.observe(element.parentElement);
      schedule();

      return () => {
        if (elements.get(value) === element) elements.delete(value);
        ro?.unobserve(element);
        schedule();
      };
    },
    set: (value, box) => {
      const previous = snapshot[value];

      if (
        previous &&
        previous.x === box.x &&
        previous.y === box.y &&
        previous.width === box.width &&
        previous.height === box.height
      ) {
        return;
      }
      snapshot = {...snapshot, [value]: {...box}};
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Linear interpolation between the boxes of the two triggers around `position`. */
export function interpolateMeasurement(
  measurements: SwipeableTabsMeasurements,
  values: readonly string[],
  position: number,
): SwipeableTabsMeasurement | undefined {
  if (values.length === 0) return undefined;

  const clamped = Math.min(Math.max(position, 0), values.length - 1);
  const lower = Math.floor(clamped);
  const upper = Math.min(lower + 1, values.length - 1);
  const fraction = clamped - lower;
  const a = measurements[values[lower]!];
  const b = measurements[values[upper]!];

  if (!a || !b) return a ?? b;
  if (fraction === 0) return a;

  const mix = (from: number, to: number) => from + (to - from) * fraction;

  return {
    height: mix(a.height, b.height),
    width: mix(a.width, b.width),
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
  };
}

/** True when the user (or an ancestor `data-reduce-motion`) asks for reduced motion. */
export const prefersReducedMotion = (element?: Element | null): boolean => {
  if (element?.closest("[data-reduce-motion='true']")) return true;

  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

/**
 * Whether an element is laid out right-to-left. Layout follows the DOM `dir`, which usually matches
 * the React Aria locale but can be set independently, so geometry code asks the DOM.
 */
export const isRTLElement = (element: Element | null | undefined): boolean =>
  !!element &&
  typeof getComputedStyle === "function" &&
  getComputedStyle(element).direction === "rtl";
