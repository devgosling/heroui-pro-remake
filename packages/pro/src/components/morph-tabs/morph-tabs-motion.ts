/**
 * Small rAF animator for the MorphTabs pager position (in page units).
 *
 * - `spring`: critically damped spring that starts at the release velocity of a swipe. Measured in the
 *   HeroUI Pro Native demo video: a released swipe settles in ~300 ms without overshoot.
 * - `tween`: fixed-duration ease-in-out used for trigger presses, `goTo` and controlled value changes
 *   (the video shows a ~280 ms ease-in-out slide that passes through intermediate pages).
 */

/** Cubic-bezier timing function (same maths as CSS `cubic-bezier()`), solved with Newton-Raphson. */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t = x;

    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;

      if (Math.abs(error) < 1e-5) break;
      const derivative = sampleDerivativeX(t);

      if (Math.abs(derivative) < 1e-6) break;
      t -= error / derivative;
    }

    return sampleY(Math.min(1, Math.max(0, t)));
  };
};

/** CSS `ease-in-out`. */
export const easeInOut = cubicBezier(0.42, 0, 0.58, 1);

/** Duration of a programmatic slide: 280 ms for one page, +40 ms per extra page, at most 400 ms. */
export const getSlideDuration = (distance: number) =>
  Math.min(400, 280 + 40 * Math.max(0, Math.ceil(distance) - 1));

export interface SpringOptions {
  /** Spring stiffness (mass 1). @default 300 */
  stiffness?: number;
  /** Damping; defaults to critical damping `2 * sqrt(stiffness)`. */
  damping?: number;
  /** Lower bound the animated value never goes below. */
  min?: number;
  /** Upper bound the animated value never goes above. */
  max?: number;
}

const SPRING_STEP = 1 / 240;

export class PagerAnimator {
  private frame = 0;
  private readonly read: () => number;
  private readonly write: (value: number) => void;

  constructor(read: () => number, write: (value: number) => void) {
    this.read = read;
    this.write = write;
  }

  get isAnimating() {
    return this.frame !== 0;
  }

  stop() {
    if (this.frame !== 0 && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(this.frame);
    }
    this.frame = 0;
  }

  /** Eases from the current value to `to` in `duration` ms. */
  tween(to: number, duration: number, onComplete?: () => void, easing = easeInOut) {
    this.stop();
    const from = this.read();

    if (typeof requestAnimationFrame !== "function" || duration <= 0 || from === to) {
      this.write(to);
      onComplete?.();

      return;
    }

    let start: number | undefined;

    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);

      this.write(from + (to - from) * easing(t));

      if (t < 1) {
        this.frame = requestAnimationFrame(tick);
      } else {
        this.frame = 0;
        onComplete?.();
      }
    };

    this.frame = requestAnimationFrame(tick);
  }

  /** Springs from the current value to `to`, starting with `velocity` (units per second). */
  spring(to: number, velocity: number, onComplete?: () => void, options: SpringOptions = {}) {
    this.stop();
    const stiffness = options.stiffness ?? 300;
    const damping = options.damping ?? 2 * Math.sqrt(stiffness);
    const min = options.min ?? -Infinity;
    const max = options.max ?? Infinity;
    let position = this.read();
    let speed = velocity;

    if (typeof requestAnimationFrame !== "function") {
      this.write(to);
      onComplete?.();

      return;
    }

    let last: number | undefined;

    const tick = (now: number) => {
      const elapsed = last === undefined ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);

      last = now;

      // Fixed sub-steps keep the semi-implicit Euler integration stable on slow frames.
      for (let time = 0; time < elapsed; time += SPRING_STEP) {
        const step = Math.min(SPRING_STEP, elapsed - time);
        const acceleration = -stiffness * (position - to) - damping * speed;

        speed += acceleration * step;
        position += speed * step;
      }

      // Never overshoot past the first / last page: stop at the bound instead.
      if (position > max) {
        position = max;
        speed = Math.min(0, speed);
      } else if (position < min) {
        position = min;
        speed = Math.max(0, speed);
      }

      if (Math.abs(position - to) < 0.0005 && Math.abs(speed) < 0.02) {
        this.frame = 0;
        this.write(to);
        onComplete?.();

        return;
      }

      this.write(position);
      this.frame = requestAnimationFrame(tick);
    };

    this.frame = requestAnimationFrame(tick);
  }
}
