/* -------------------------------------------------------------------------------------------------
 * FAB helpers: a tiny value store, the progress driver (spring / timing) and the placement math.
 * Pure TypeScript, no React - shared by the FAB parts and hooks.
 * -----------------------------------------------------------------------------------------------*/

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
/** Side of the trigger on which the content opens. */
export type FABPlacement = "top" | "bottom" | "left" | "right";
/** Alignment of the content along the axis perpendicular to the placement. */
export type FABAlign = "start" | "center" | "end";
/** `"auto"` resolves from the trigger position inside the portal layer (the "screen"). */
export type FABAutoPlacement = "auto" | FABPlacement;
/** `"auto"` splits the perpendicular axis into thirds: start / center / end. */
export type FABAutoAlign = "auto" | FABAlign;
/** `"staggered"`: nearest item first (reversed on close). `"normal"`: all items together. */
export type FABItemsAppearance = "staggered" | "normal";

export interface FABInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/** A measured box in CSS pixels. */
export interface FABLayoutRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Physics spring (Reanimated `withSpring` compatible fields). */
export interface FABSpringConfig {
  mass?: number;
  stiffness?: number;
  damping?: number;
  /** Initial velocity in progress units per second. @default 0 */
  velocity?: number;
  /** Distance to the target below which the spring may rest. @default 0.001 */
  restDisplacementThreshold?: number;
  /** Speed below which the spring may rest. @default 0.01 */
  restSpeedThreshold?: number;
}

/** Duration based animation (Reanimated `withTiming` compatible fields). */
export interface FABTimingConfig {
  /** @default 300 */
  duration?: number;
  /** Easing function `t (0..1) -> 0..1`. @default ease-in-out quad (Reanimated default) */
  easing?: (t: number) => number;
}

export type FABProgressAnimation =
  {type?: "spring"; config?: FABSpringConfig} | {type: "timing"; config?: FABTimingConfig};

/* -------------------------------------------------------------------------------------------------
 * Value store (useSyncExternalStore compatible)
 * -----------------------------------------------------------------------------------------------*/
export interface FABValueStore<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
}

export const createValueStore = <T>(
  initial: T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): FABValueStore<T> => {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next) => {
      if (isEqual(value, next)) return;
      value = next;
      listeners.forEach((listener) => listener());
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
 * Progress driver
 * -----------------------------------------------------------------------------------------------*/
/**
 * Default progress spring. The Native docs list `{mass: 3, stiffness: 1200, damping: 90}`
 * (ω0 = 20 rad/s, ζ = 0.75: ~95% after 150 ms). The Native demo video, measured frame by frame at
 * 60 fps, keeps ω0 = 20 rad/s but settles without overshoot and with a longer tail (open and close:
 * ~90% after 230 ms, ~98% after 320 ms), which fits ζ ≈ 1.1, i.e. `damping: 135`. The default
 * follows the video; pass the documented config explicitly to get the snappier curve.
 */
export const FAB_DEFAULT_SPRING: Required<Pick<FABSpringConfig, "mass" | "stiffness" | "damping">> =
  {damping: 135, mass: 3, stiffness: 1200};

/** Fields a custom spring config leaves out fall back to the Reanimated 4 spring defaults. */
const SPRING_FALLBACK = {damping: 120, mass: 4, stiffness: 900};

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const MAX_FRAME_DT = 1 / 15;
const SPRING_SUBSTEP = 1 / 480;
const MAX_ANIMATION_TIME = 4;

/**
 * Animates a number from `from` to `to` on requestAnimationFrame. Returns a cancel function.
 * `onComplete` runs in a later animation frame (never synchronously).
 */
export const animateProgress = (
  from: number,
  to: number,
  animation: FABProgressAnimation | undefined,
  onUpdate: (value: number) => void,
  onComplete?: () => void,
): (() => void) => {
  if (typeof requestAnimationFrame === "undefined") {
    onUpdate(to);
    onComplete?.();

    return () => {};
  }

  let frame = 0;
  let elapsed = 0;
  let last: number | null = null;

  if (animation?.type === "timing") {
    const duration = Math.max(0, animation.config?.duration ?? 300);
    const easing = animation.config?.easing ?? easeInOutQuad;

    const tick = () => {
      const time = now();

      if (last === null) last = time;
      elapsed += time - last;
      last = time;

      const t = duration === 0 ? 1 : Math.min(elapsed / duration, 1);

      onUpdate(from + (to - from) * easing(t));

      if (t < 1) frame = requestAnimationFrame(tick);
      else onComplete?.();
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }

  const custom = animation?.config;
  const spring = custom ? {...SPRING_FALLBACK, ...custom} : {...FAB_DEFAULT_SPRING};
  const restDisplacement = custom?.restDisplacementThreshold ?? 0.001;
  const restSpeed = custom?.restSpeedThreshold ?? 0.01;
  let position = from;
  let velocity = custom?.velocity ?? 0;

  const tick = () => {
    const time = now();
    const dt = last === null ? 1 / 60 : Math.min((time - last) / 1000, MAX_FRAME_DT);

    last = time;
    elapsed += dt;

    // Semi-implicit Euler in small fixed sub-steps: stable for stiff springs at any frame rate.
    for (let step = 0; step < dt; step += SPRING_SUBSTEP) {
      const h = Math.min(SPRING_SUBSTEP, dt - step);
      const force = -spring.stiffness * (position - to) - spring.damping * velocity;

      velocity += (force / spring.mass) * h;
      position += velocity * h;
    }

    const isResting = Math.abs(position - to) < restDisplacement && Math.abs(velocity) < restSpeed;

    if (isResting || elapsed > MAX_ANIMATION_TIME) {
      onUpdate(to);
      onComplete?.();

      return;
    }

    onUpdate(position);
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(frame);
};

/** True when motion should be skipped (OS setting or a `data-reduce-motion="true"` ancestor). */
export const prefersReducedMotion = (element?: Element | null): boolean => {
  if (element?.closest('[data-reduce-motion="true"]')) return true;
  if (element?.closest('[data-reduce-motion="false"]')) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/* -------------------------------------------------------------------------------------------------
 * Placement
 * -----------------------------------------------------------------------------------------------*/
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const toLayoutRectangle = (rect: DOMRectReadOnly): FABLayoutRectangle => ({
  height: rect.height,
  width: rect.width,
  x: rect.left,
  y: rect.top,
});

/** The visual viewport as the default "screen". */
export const getViewportRectangle = (): FABLayoutRectangle => ({
  height: typeof window === "undefined" ? 0 : window.innerHeight,
  width: typeof window === "undefined" ? 0 : window.innerWidth,
  x: 0,
  y: 0,
});

/** A trigger in the bottom half opens upwards, a trigger in the top half opens downwards. */
export const resolvePlacement = (
  placement: FABAutoPlacement,
  trigger: FABLayoutRectangle,
  bounds: FABLayoutRectangle,
): FABPlacement => {
  if (placement !== "auto") return placement;

  const centerY = trigger.y + trigger.height / 2 - bounds.y;

  return centerY > bounds.height / 2 ? "top" : "bottom";
};

/** The perpendicular axis is split into thirds that map to start / center / end. */
export const resolveAlign = (
  align: FABAutoAlign,
  placement: FABPlacement,
  trigger: FABLayoutRectangle,
  bounds: FABLayoutRectangle,
  isRTL = false,
): FABAlign => {
  if (align !== "auto") return align;

  const isVertical = placement === "top" || placement === "bottom";
  const ratio = isVertical
    ? (trigger.x + trigger.width / 2 - bounds.x) / Math.max(bounds.width, 1)
    : (trigger.y + trigger.height / 2 - bounds.y) / Math.max(bounds.height, 1);
  const third = ratio < 1 / 3 ? "start" : ratio > 2 / 3 ? "end" : "center";

  // Inline axis follows the writing direction (start = right in RTL).
  if (isVertical && isRTL && third !== "center") return third === "start" ? "end" : "start";

  return third;
};

export interface FABContentPositionOptions {
  placement: FABPlacement;
  align: FABAlign;
  trigger: FABLayoutRectangle;
  bounds: FABLayoutRectangle;
  size: {width: number; height: number};
  offset: number;
  alignOffset: number;
  insets: Required<FABInsets>;
  avoidCollisions: boolean;
  isRTL?: boolean;
}

/** Content position relative to the bounds (portal layer) origin. */
export const computeContentPosition = ({
  align,
  alignOffset,
  avoidCollisions,
  bounds,
  insets,
  isRTL = false,
  offset,
  placement,
  size,
  trigger,
}: FABContentPositionOptions): {left: number; top: number} => {
  const triggerX = trigger.x - bounds.x;
  const triggerY = trigger.y - bounds.y;
  let left: number;
  let top: number;

  if (placement === "top" || placement === "bottom") {
    top =
      placement === "top" ? triggerY - offset - size.height : triggerY + trigger.height + offset;

    const side = align === "center" ? "center" : (align === "start") !== isRTL ? "left" : "right";

    if (side === "left") left = triggerX + alignOffset;
    else if (side === "right") left = triggerX + trigger.width - size.width - alignOffset;
    else left = triggerX + trigger.width / 2 - size.width / 2 + alignOffset;
  } else {
    left =
      placement === "left" ? triggerX - offset - size.width : triggerX + trigger.width + offset;

    if (align === "start") top = triggerY + alignOffset;
    else if (align === "end") top = triggerY + trigger.height - size.height - alignOffset;
    else top = triggerY + trigger.height / 2 - size.height / 2 + alignOffset;
  }

  if (avoidCollisions) {
    const maxLeft = bounds.width - insets.right - size.width;
    const maxTop = bounds.height - insets.bottom - size.height;

    left = clamp(left, insets.left, Math.max(insets.left, maxLeft));
    top = clamp(top, insets.top, Math.max(insets.top, maxTop));
  }

  return {left: Math.round(left), top: Math.round(top)};
};

/* -------------------------------------------------------------------------------------------------
 * Stagger
 * -----------------------------------------------------------------------------------------------*/
/** Whether the last item (in DOM order) is the one nearest to the trigger. */
export const isLastItemNearest = (placement: FABPlacement, align: FABAlign) =>
  placement === "top" || ((placement === "left" || placement === "right") && align === "end");

export interface FABItemStagger {
  /** Progress (0..1) at which the item starts appearing. */
  openStart: number;
  /** Close progress (0..1, i.e. progress - 1) at which the item starts disappearing. */
  closeStart: number;
  /** Fraction of the progress range the item animation occupies. */
  window: number;
}

export const getItemStagger = ({
  appearance,
  count,
  index,
  itemWindow,
  lastIsNearest,
}: {
  appearance: FABItemsAppearance;
  count: number;
  index: number;
  itemWindow: number;
  lastIsNearest: boolean;
}): FABItemStagger => {
  if (appearance === "normal" || count <= 1) return {closeStart: 0, openStart: 0, window: 1};

  const window = clamp(Number.isFinite(itemWindow) ? itemWindow : 0.5, 0.01, 1);
  const order = lastIsNearest ? count - 1 - index : index; // 0 = nearest to the trigger
  const step = (1 - window) / (count - 1);

  return {
    closeStart: (count - 1 - order) * step,
    openStart: order * step,
    window,
  };
};

/** Piecewise linear interpolation over the `[idle, open, close]` = `[0, 1, 2]` progress states. */
export const interpolateProgress = (
  progress: number,
  [idle, open, close]: readonly [number, number, number],
): number => {
  if (progress <= 1) return idle + (open - idle) * Math.max(progress, 0);

  return open + (close - open) * Math.min(progress - 1, 1);
};
