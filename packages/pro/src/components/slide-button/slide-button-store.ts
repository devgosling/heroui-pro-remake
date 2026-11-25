"use client";

/* -------------------------------------------------------------------------------------------------
 * Progress + metrics store
 *
 * The thumb position changes on every pointer move / animation frame. Keeping it outside React
 * state means the root only writes a CSS custom property per frame; components that really need
 * the number (useSlideButton, render-function children) subscribe with useSyncExternalStore.
 * -----------------------------------------------------------------------------------------------*/
export interface SlideButtonMetrics {
  /** Width of the content container (the area the thumb travels in), in px. */
  trackWidth: number;
  /** Height of the content container, in px. */
  trackHeight: number;
  /** Width of the thumb, in px. */
  thumbWidth: number;
  /** Height of the thumb, in px. */
  thumbHeight: number;
}

export interface SlideButtonStore {
  getProgress: () => number;
  setProgress: (value: number) => void;
  getMetrics: () => SlideButtonMetrics;
  setMetrics: (metrics: Partial<SlideButtonMetrics>) => void;
  subscribe: (listener: () => void) => () => void;
}

const EMPTY_METRICS: SlideButtonMetrics = {
  thumbHeight: 0,
  thumbWidth: 0,
  trackHeight: 0,
  trackWidth: 0,
};

export const createSlideButtonStore = (initialProgress: number): SlideButtonStore => {
  let progress = initialProgress;
  let metrics = EMPTY_METRICS;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  return {
    getMetrics: () => metrics,
    getProgress: () => progress,
    setMetrics: (partial) => {
      const next = {...metrics, ...partial};

      if (
        next.trackWidth === metrics.trackWidth &&
        next.trackHeight === metrics.trackHeight &&
        next.thumbWidth === metrics.thumbWidth &&
        next.thumbHeight === metrics.thumbHeight
      ) {
        return;
      }
      metrics = next;
      emit();
    },
    setProgress: (value) => {
      if (value === progress) return;
      progress = value;
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/* -------------------------------------------------------------------------------------------------
 * Spring animation
 *
 * A small damped harmonic oscillator integrated on requestAnimationFrame. The defaults mirror the
 * Native component ({damping: 120, stiffness: 900, mass: 4}: critically damped, omega = 15 rad/s,
 * no overshoot, settles in ~0.5 s), which matches the reset curve measured in the demo video.
 * -----------------------------------------------------------------------------------------------*/
export interface SlideButtonSpringConfig {
  /** Friction of the spring. @default 120 */
  damping?: number;
  /** Stiffness of the spring. @default 900 */
  stiffness?: number;
  /** Mass of the animated object. @default 4 */
  mass?: number;
}

export const DEFAULT_SPRING_CONFIG: Required<SlideButtonSpringConfig> = {
  damping: 120,
  mass: 4,
  stiffness: 900,
};

interface AnimateSpringOptions {
  from: number;
  to: number;
  /** Initial velocity in units (progress) per second. */
  velocity?: number;
  config?: SlideButtonSpringConfig;
  /**
   * Stops the spring at `to` instead of letting it swing past it. A fling released with momentum
   * would otherwise carry the thumb beyond the end (or start) of the track before settling.
   */
  overshootClamping?: boolean;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

/** Fixed integration step (s); small enough to stay stable for stiff springs. */
const STEP = 1 / 1000;
/** Longest frame gap that is simulated (avoids huge catch-up loops after a background tab). */
const MAX_FRAME = 1 / 15;
const REST_DISTANCE = 0.0004;
const REST_VELOCITY = 0.004;

/** Runs a spring from `from` to `to` and returns a function that cancels it. */
export const animateSpring = ({
  config,
  from,
  onComplete,
  onUpdate,
  overshootClamping = false,
  to,
  velocity = 0,
}: AnimateSpringOptions): (() => void) => {
  const {damping, mass, stiffness} = {...DEFAULT_SPRING_CONFIG, ...config};

  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    onUpdate(to);
    onComplete?.();

    return () => {};
  }

  let position = from;
  let speed = velocity;
  let lastTime: number | null = null;
  let frame = 0;
  let cancelled = false;

  const tick = (time: number) => {
    if (cancelled) return;

    const elapsed = lastTime === null ? 1 / 60 : Math.min((time - lastTime) / 1000, MAX_FRAME);

    lastTime = time;

    for (let t = 0; t < elapsed; t += STEP) {
      const dt = Math.min(STEP, elapsed - t);
      const acceleration = (-stiffness * (position - to) - damping * speed) / mass;

      speed += acceleration * dt;
      position += speed * dt;
    }

    const hasOvershot = overshootClamping && (from < to ? position >= to : position <= to);

    if (
      hasOvershot ||
      (Math.abs(position - to) < REST_DISTANCE && Math.abs(speed) < REST_VELOCITY)
    ) {
      onUpdate(to);
      onComplete?.();

      return;
    }

    onUpdate(position);
    frame = window.requestAnimationFrame(tick);
  };

  frame = window.requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frame);
  };
};

/** True when the user asked the OS to reduce motion. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
