/* -------------------------------------------------------------------------------------------------
 * Tiny spring helper (own implementation)
 *
 * Solves a damped harmonic oscillator analytically and turns its progress curve into a CSS
 * `linear()` easing, so spring motion runs on the compositor through the Web Animations API
 * without a runtime animation library.
 * -----------------------------------------------------------------------------------------------*/

export type SpringOptions = {
  /** Spring stiffness (k). */
  stiffness?: number;
  /** Damping coefficient (c). */
  damping?: number;
  /** Mass (m). */
  mass?: number;
  /** Progress delta (0..1) under which the spring counts as settled. */
  restDelta?: number;
};

export type SpringCurve = {
  /** Settling time in milliseconds. */
  duration: number;
  /** CSS `linear()` easing that reproduces the spring progress (may overshoot 1). */
  easing: string;
};

const SAMPLE_MS = 1000 / 60;
const MAX_DURATION_MS = 4000;

/** Progress (0 -> 1) of a spring released from rest at time `t` (seconds). */
function springProgress(t: number, stiffness: number, damping: number, mass: number) {
  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);

    return (
      1 - envelope * (Math.cos(omegaD * t) + ((zeta * omega0) / omegaD) * Math.sin(omegaD * t))
    );
  }

  if (zeta === 1) return 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);

  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -omega0 * (zeta - root);
  const r2 = -omega0 * (zeta + root);
  const c2 = r1 / (r2 - r1);
  const c1 = -1 - c2;

  return 1 + c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
}

const curveCache = new Map<string, SpringCurve>();

/** Samples a spring into a `linear()` easing plus the time it needs to settle. */
export function getSpringCurve({
  damping = 30,
  mass = 1,
  restDelta = 0.001,
  stiffness = 300,
}: SpringOptions = {}): SpringCurve {
  const key = `${stiffness}:${damping}:${mass}:${restDelta}`;
  const cached = curveCache.get(key);

  if (cached) return cached;

  const samples: number[] = [0];
  let elapsed = 0;
  let settledFor = 0;

  while (elapsed < MAX_DURATION_MS) {
    elapsed += SAMPLE_MS;
    const value = springProgress(elapsed / 1000, stiffness, damping, mass);

    samples.push(value);
    settledFor = Math.abs(1 - value) < restDelta ? settledFor + SAMPLE_MS : 0;
    // Require a few settled frames so an oscillation crossing 1 does not end the curve early.
    if (settledFor >= SAMPLE_MS * 3) break;
  }

  samples[samples.length - 1] = 1;

  const easing = `linear(${samples.map((value) => Math.round(value * 10000) / 10000).join(", ")})`;
  const curve = {duration: Math.round(elapsed), easing};

  curveCache.set(key, curve);

  return curve;
}

/** Whether the user (or an ancestor `data-reduce-motion`) asked for reduced motion. */
export function prefersReducedMotion(element: Element | null) {
  if (element?.closest('[data-reduce-motion="true"]')) return true;
  if (element?.closest('[data-reduce-motion="false"]')) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
