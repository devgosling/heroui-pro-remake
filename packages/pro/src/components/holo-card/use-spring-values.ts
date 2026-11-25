"use client";

import {useCallback, useEffect, useLayoutEffect, useRef} from "react";

export interface HoloCardSpring {
  /** Opposing force that slows the motion down. */
  damping?: number;
  /** Mass of the moving object; heavier values feel more sluggish. @default 1 */
  mass?: number;
  /** Strength of the pull toward the target. */
  stiffness?: number;
}

export type ResolvedSpring = Required<HoloCardSpring>;

/** Merges a partial spring over the defaults. */
export function resolveSpring(
  spring: HoloCardSpring | undefined,
  fallback: ResolvedSpring,
): ResolvedSpring {
  return {
    damping: spring?.damping ?? fallback.damping,
    mass: spring?.mass ?? fallback.mass,
    stiffness: spring?.stiffness ?? fallback.stiffness,
  };
}

type Values<K extends string> = Record<K, number>;

interface SpringState<K extends string> {
  current: Values<K>;
  target: Values<K>;
  velocity: Values<K>;
  restDelta: Values<K>;
  restSpeed: Values<K>;
  spring: ResolvedSpring;
}

// Rest thresholds, chosen per value whenever it is retargeted: a value that travels less than
// 5 units (opacity, scale, small moves) needs a much finer threshold than one crossing the card.
const GRANULAR_RANGE = 5;
const REST = {coarse: {delta: 0.5, speed: 2}, granular: {delta: 0.005, speed: 0.01}};

/**
 * Advances a damped harmonic oscillator by `dt` seconds using its closed-form solution, so any
 * frame length is exact and stable. `displacement` is measured from the target.
 */
function stepSpring(
  displacement: number,
  velocity: number,
  dt: number,
  {damping, mass, stiffness}: ResolvedSpring,
): [number, number] {
  if (!(stiffness > 0) || !(mass > 0)) return [0, 0];
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    // Under-damped: decaying oscillation.
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    const decay = Math.exp(-zeta * omega * dt);
    const b = (velocity + zeta * omega * displacement) / omegaD;
    const cos = Math.cos(omegaD * dt);
    const sin = Math.sin(omegaD * dt);
    const position = displacement * cos + b * sin;

    return [
      decay * position,
      decay * (-zeta * omega * position + omegaD * (b * cos - displacement * sin)),
    ];
  }

  if (zeta === 1) {
    // Critically damped.
    const decay = Math.exp(-omega * dt);
    const b = velocity + omega * displacement;

    return [decay * (displacement + b * dt), decay * (velocity - omega * b * dt)];
  }

  // Over-damped: sum of two decaying exponentials.
  const spread = omega * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * omega + spread;
  const r2 = -zeta * omega - spread;
  const c1 = (velocity - r2 * displacement) / (r1 - r2);
  const c2 = displacement - c1;
  const e1 = Math.exp(r1 * dt);
  const e2 = Math.exp(r2 * dt);

  return [c1 * e1 + c2 * e2, r1 * c1 * e1 + r2 * c2 * e2];
}

/**
 * A set of independent springs driven by requestAnimationFrame. Values never pass through React
 * state: every frame calls `onFrame` with the current numbers so the caller can write styles
 * directly on the DOM. Each value rests (snaps to its target) on its own thresholds. Retargeting
 * keeps the current velocity and restarts the clock at the moment of the call, so a pointer that
 * keeps moving produces one continuous motion.
 */
export function useSpringValues<K extends string>(
  initial: Values<K>,
  onFrame: (values: Values<K>) => void,
  onRest?: () => void,
) {
  const stateRef = useRef<SpringState<K> | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);
  const onRestRef = useRef(onRest);

  useLayoutEffect(() => {
    onFrameRef.current = onFrame;
    onRestRef.current = onRest;
  });

  if (stateRef.current === null) {
    const fill = (value: number) =>
      Object.fromEntries(Object.keys(initial).map((key) => [key, value])) as Values<K>;

    stateRef.current = {
      current: {...initial},
      restDelta: fill(REST.granular.delta),
      restSpeed: fill(REST.granular.speed),
      spring: {damping: 28, mass: 1, stiffness: 180},
      target: {...initial},
      velocity: fill(0),
    };
  }

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    lastTimeRef.current = null;
  }, []);

  // A named function expression so the frame loop can schedule itself (`tick` is not yet declared
  // inside its own initializer).
  const tick = useCallback(
    function step(time: number) {
      const state = stateRef.current!;
      const elapsed = Math.max(time - (lastTimeRef.current ?? time), 0) / 1000;

      lastTimeRef.current = time;

      let isResting = true;

      for (const key of Object.keys(state.current) as K[]) {
        if (state.current[key] === state.target[key] && state.velocity[key] === 0) continue;
        const [displacement, velocity] = stepSpring(
          state.current[key] - state.target[key],
          state.velocity[key],
          elapsed,
          state.spring,
        );

        if (
          Math.abs(velocity) <= state.restSpeed[key] &&
          Math.abs(displacement) <= state.restDelta[key]
        ) {
          state.current[key] = state.target[key];
          state.velocity[key] = 0;
        } else {
          state.current[key] = state.target[key] + displacement;
          state.velocity[key] = velocity;
          isResting = false;
        }
      }

      onFrameRef.current(state.current);

      if (isResting) {
        stop();
        onRestRef.current?.();
      } else {
        frameRef.current = requestAnimationFrame(step);
      }
    },
    [stop],
  );

  /** Animates toward `target` with the given spring, keeping the current velocity. */
  const animateTo = useCallback(
    (target: Partial<Values<K>>, spring: ResolvedSpring) => {
      const state = stateRef.current!;

      for (const key of Object.keys(target) as K[]) {
        const value = target[key]!;
        const range = Math.abs(value - state.current[key]);
        const rest = range < GRANULAR_RANGE ? REST.granular : REST.coarse;

        state.target[key] = value;
        state.restDelta[key] = rest.delta;
        state.restSpeed[key] = rest.speed;
      }
      state.spring = spring;
      // The motion starts now: the time since the last rendered frame is not replayed.
      lastTimeRef.current = performance.now();
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  /** Jumps to `values` immediately, without animating. */
  const set = useCallback(
    (values: Partial<Values<K>>) => {
      const state = stateRef.current!;

      stop();
      Object.assign(state.current, values);
      for (const key of Object.keys(state.velocity) as K[]) {
        state.velocity[key] = 0;
        state.target[key] = state.current[key];
      }
      onFrameRef.current(state.current);
    },
    [stop],
  );

  /** Current (animated) values. */
  const get = useCallback(() => stateRef.current!.current, []);

  useEffect(() => stop, [stop]);

  return {animateTo, get, set, stop};
}
