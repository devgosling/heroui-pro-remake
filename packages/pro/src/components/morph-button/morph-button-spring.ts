/* -------------------------------------------------------------------------------------------------
 * Morph spring (own implementation)
 *
 * A tiny 2D damped-spring integrator driven by requestAnimationFrame. It mirrors the physics-based
 * spring the Native MorphButton uses for the surface width / height (damping, stiffness, mass,
 * overshoot clamping and rest thresholds), keeps velocity when the target changes mid-flight, and
 * reports every frame so the root can write the size to CSS custom properties.
 * -----------------------------------------------------------------------------------------------*/

export interface MorphButtonSpringConfig {
  /** Damping coefficient (c). @default 25 */
  damping?: number;
  /** Spring stiffness (k). @default 300 */
  stiffness?: number;
  /** Mass of the animated object (m). @default 0.8 */
  mass?: number;
  /** Stops the spring as soon as it reaches the target instead of overshooting. @default false */
  overshootClamping?: boolean;
  /** Distance (px) to the target under which the spring may come to rest. @default 0.01 */
  restDisplacementThreshold?: number;
  /** Speed (px/s) under which the spring may come to rest. @default 0.01 */
  restSpeedThreshold?: number;
}

export const DEFAULT_MORPH_SPRING_CONFIG: Required<MorphButtonSpringConfig> = {
  damping: 25,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
  stiffness: 300,
};

export interface MorphSize {
  width: number;
  height: number;
}

/** A read-only value that always returns the latest animated number (web stand-in for a SharedValue). */
export interface MorphButtonAnimatedValue {
  readonly value: number;
}

export interface MorphSpringTarget {
  target: MorphSize;
  /** Collapsed / expanded sizes, used to derive the progress value. */
  collapsed: MorphSize | null;
  expanded: MorphSize | null;
  isOpen: boolean;
}

interface Axis {
  position: number;
  velocity: number;
  target: number;
}

/** Fixed integration step (s). Small enough to stay stable for stiff springs. */
const STEP = 1 / 1000;
/**
 * Longest frame delta we integrate (s). Long enough that a janky frame (a long task during the
 * open render) does not slow the spring down, so the surface stays in sync with the CSS content
 * cross-fade that runs on wall-clock time. Only bounds the work after a long background pause.
 */
const MAX_FRAME = 1;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Whether the user (or an ancestor `data-reduce-motion`) asked for reduced motion. */
export function prefersReducedMotion(element: Element | null) {
  if (element?.closest('[data-reduce-motion="true"]')) return true;
  if (element?.closest('[data-reduce-motion="false"]')) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Creates the surface spring. Every frame it writes the animated size to the element as
 * `--morph-button-surface-width` / `--morph-button-surface-height`, the morph progress as
 * `--morph-button-progress` (0 collapsed .. 1 expanded) and `data-morphing` while it moves.
 */
export function createMorphSpring() {
  const x: Axis = {position: Number.NaN, target: 0, velocity: 0};
  const y: Axis = {position: Number.NaN, target: 0, velocity: 0};
  let config = DEFAULT_MORPH_SPRING_CONFIG;
  let meta: Omit<MorphSpringTarget, "target"> = {collapsed: null, expanded: null, isOpen: false};
  let element: HTMLElement | null = null;
  let frameId = 0;
  let lastTime = 0;

  const surfaceWidth: MorphButtonAnimatedValue = {
    get value() {
      return Number.isNaN(x.position) ? 0 : x.position;
    },
  };
  const surfaceHeight: MorphButtonAnimatedValue = {
    get value() {
      return Number.isNaN(y.position) ? 0 : y.position;
    },
  };

  const progressOf = () => {
    const {collapsed, expanded, isOpen} = meta;

    if (!collapsed || !expanded) return isOpen ? 1 : 0;
    const dw = expanded.width - collapsed.width;
    const dh = expanded.height - collapsed.height;

    // Follow the dimension that changes most so the value is meaningful for any panel shape.
    if (Math.abs(dw) >= Math.abs(dh)) {
      return Math.abs(dw) < 0.5 ? (isOpen ? 1 : 0) : clamp01((x.position - collapsed.width) / dw);
    }

    return clamp01((y.position - collapsed.height) / dh);
  };

  const emit = (isMoving: boolean) => {
    if (!element) return;
    element.style.setProperty("--morph-button-surface-width", `${x.position}px`);
    element.style.setProperty("--morph-button-surface-height", `${y.position}px`);
    element.style.setProperty("--morph-button-progress", `${progressOf()}`);
    if (isMoving) element.setAttribute("data-morphing", "true");
    else element.removeAttribute("data-morphing");
  };

  const isAtRest = (axis: Axis) =>
    Math.abs(axis.position - axis.target) < config.restDisplacementThreshold &&
    Math.abs(axis.velocity) < config.restSpeedThreshold;

  const integrate = (axis: Axis, dt: number) => {
    const {damping, mass, overshootClamping, stiffness} = config;
    const before = axis.target - axis.position;
    const acceleration =
      (-stiffness * (axis.position - axis.target) - damping * axis.velocity) / mass;

    // Semi-implicit Euler: stable and cheap for the step size used here.
    axis.velocity += acceleration * dt;
    axis.position += axis.velocity * dt;

    if (overshootClamping) {
      const after = axis.target - axis.position;

      if (before !== 0 && Math.sign(after) !== Math.sign(before)) {
        axis.position = axis.target;
        axis.velocity = 0;
      }
    }
  };

  const tick = (now: number) => {
    // The clock starts on the first animation frame, like the CSS content transitions (their start
    // time is the frame they become ready in), so a slow commit does not put the two out of step.
    if (lastTime < 0) lastTime = now;
    const elapsed = Math.min(Math.max(0, (now - lastTime) / 1000), MAX_FRAME);

    lastTime = now;
    let remaining = elapsed;

    while (remaining > 1e-9) {
      const dt = Math.min(STEP, remaining);

      integrate(x, dt);
      integrate(y, dt);
      remaining -= dt;
    }

    const settled = isAtRest(x) && isAtRest(y);

    if (settled) {
      x.position = x.target;
      y.position = y.target;
      x.velocity = 0;
      y.velocity = 0;
      frameId = 0;
      emit(false);

      return;
    }

    emit(true);
    frameId = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  };

  return {
    /** Live animated surface width / height (read `.value`). */
    surfaceHeight,
    surfaceWidth,
    /**
     * Moves toward `next.target` and renders into `target`. Snaps when `animate` is false or when
     * nothing was rendered yet.
     */
    set(
      next: MorphSpringTarget,
      animate: boolean,
      nextConfig: Required<MorphButtonSpringConfig>,
      target: HTMLElement | null,
    ) {
      element = target;
      config = nextConfig;
      meta = {collapsed: next.collapsed, expanded: next.expanded, isOpen: next.isOpen};
      x.target = next.target.width;
      y.target = next.target.height;

      const isFirst = Number.isNaN(x.position) || Number.isNaN(y.position);
      // Measured while hidden (display: none ancestor) or hidden now: there is nothing on screen to
      // morph from / to, so snap instead of growing the surface out of a 0x0 box.
      const isHiddenSize =
        (x.position === 0 && y.position === 0) || (x.target === 0 && y.target === 0);
      const canAnimate = animate && typeof requestAnimationFrame === "function";

      if (isFirst || isHiddenSize || !canAnimate) {
        stop();
        x.position = x.target;
        y.position = y.target;
        x.velocity = 0;
        y.velocity = 0;
        emit(false);

        return;
      }

      if (isAtRest(x) && isAtRest(y)) {
        // Already there (e.g. a re-render with the same target): just refresh the frame.
        if (!frameId) emit(false);

        return;
      }

      if (!frameId) {
        lastTime = -1;
        frameId = requestAnimationFrame(tick);
      }
    },
    stop,
  };
}

export type MorphSpring = ReturnType<typeof createMorphSpring>;
