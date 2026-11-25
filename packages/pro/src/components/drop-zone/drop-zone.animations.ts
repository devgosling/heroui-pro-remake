/* -------------------------------------------------------------------------------------------------
 * File list motion (own implementation, Web Animations API)
 *
 * Measured on the Pro demos:
 * - enter:  opacity 0 -> 1 and translateY(-8px) -> none, 300ms ease-out
 * - exit:   opacity 1 -> 0, 200ms ease-out (the item keeps its space until it is removed)
 * - layout: items whose position or size changed glide from their old box to the new one with an
 *           under-damped spring (damping ratio 0.85, envelope settled to 0.1% after 400ms, which
 *           gives a natural frequency of ~21.7 rad/s). A size change is played as a scale from
 *           the item centre, like the Pro list does (the content is scaled with the box).
 * Items present on the list's first render do not play the enter animation.
 * -----------------------------------------------------------------------------------------------*/

export const ENTER_DURATION = 300;
export const EXIT_DURATION = 200;
export const ENTER_OFFSET_Y = -8;

const SPRING_DAMPING_RATIO = 0.85;
/** Time (s) after which the oscillation envelope has decayed to `SPRING_REST_AMPLITUDE`. */
const SPRING_SETTLE_TIME = 0.4;
const SPRING_REST_AMPLITUDE = 0.001;
const SPRING_NATURAL_FREQUENCY = (() => {
  const zeta = SPRING_DAMPING_RATIO;
  const amplitude = zeta / Math.sqrt(1 - zeta * zeta);

  return Math.log(amplitude / SPRING_REST_AMPLITUDE) / (zeta * SPRING_SETTLE_TIME);
})();
const SPRING_DURATION = SPRING_SETTLE_TIME * 1000;
const SPRING_STEPS = 48;

/** Normalised spring response (1 -> 0) sampled for `SPRING_STEPS` keyframes. */
const SPRING_CURVE: number[] = (() => {
  const zeta = SPRING_DAMPING_RATIO;
  const omega = SPRING_NATURAL_FREQUENCY;
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  const points: number[] = [];

  for (let step = 0; step <= SPRING_STEPS; step++) {
    const t = (step / SPRING_STEPS) * (SPRING_DURATION / 1000);
    const envelope = Math.exp(-zeta * omega * t);

    points.push(
      step === SPRING_STEPS
        ? 0
        : envelope * (Math.cos(omegaD * t) + ((zeta * omega) / omegaD) * Math.sin(omegaD * t)),
    );
  }

  return points;
})();

export function prefersReducedMotion(element: Element): boolean {
  if (element.closest('[data-reduce-motion="true"]')) return true;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canAnimate(element: Element): element is HTMLElement {
  return typeof (element as HTMLElement).animate === "function" && !prefersReducedMotion(element);
}

export function animateEnter(element: HTMLElement): Animation | undefined {
  if (!canAnimate(element)) return undefined;

  return element.animate(
    [
      {opacity: 0, transform: `translateY(${ENTER_OFFSET_Y}px)`},
      {opacity: 1, transform: "none"},
    ],
    {duration: ENTER_DURATION, easing: "ease-out"},
  );
}

export function animateExit(element: HTMLElement, onDone: () => void): Animation | undefined {
  if (!canAnimate(element)) {
    onDone();

    return undefined;
  }

  const animation = element.animate([{opacity: getComputedStyle(element).opacity}, {opacity: 0}], {
    duration: EXIT_DURATION,
    easing: "ease-out",
    fill: "forwards",
  });

  animation.onfinish = onDone;

  return animation;
}

/** Box of a list item: centre (page coordinates) and size, in CSS pixels. */
export type LayoutBox = {centerX: number; centerY: number; height: number; width: number};

const layoutAnimations = new WeakMap<Element, Animation>();

function parseValues(value: string): number[] {
  if (!value || value === "none") return [];

  return value
    .trim()
    .split(/\s+/)
    .map((part) => Number.parseFloat(part))
    .filter((part) => Number.isFinite(part));
}

/**
 * Where `element` is drawn right now: its layout box moved and scaled by the layout animation
 * that is still running on it (individual `translate` / `scale` properties, centre origin).
 */
export function getVisualBox(element: HTMLElement, layout: LayoutBox): LayoutBox {
  if (!layoutAnimations.has(element)) return layout;

  const style = getComputedStyle(element);
  const [translateX = 0, translateY = 0] = parseValues(style.translate);
  const [scaleX = 1, scaleY = scaleX] = parseValues(style.scale);

  return {
    centerX: layout.centerX + translateX,
    centerY: layout.centerY + translateY,
    height: layout.height * scaleY,
    width: layout.width * scaleX,
  };
}

/**
 * FLIP: the element already sits in its new box (`to`); play it from the box it was drawn in
 * (`from`) back to identity with the spring curve. Uses the individual `translate` and `scale`
 * properties so it composes with the enter `transform`.
 */
export function animateLayoutChange(element: HTMLElement, from: LayoutBox, to: LayoutBox) {
  layoutAnimations.get(element)?.cancel();
  layoutAnimations.delete(element);

  const deltaX = from.centerX - to.centerX;
  const deltaY = from.centerY - to.centerY;
  const isMoved = Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5;
  const isResized =
    Math.abs(from.width - to.width) >= 0.5 || Math.abs(from.height - to.height) >= 0.5;

  if ((!isMoved && !isResized) || !canAnimate(element)) return;

  const scaleX = isResized && to.width > 0 ? from.width / to.width : 1;
  const scaleY = isResized && to.height > 0 ? from.height / to.height : 1;

  const animation = element.animate(
    SPRING_CURVE.map((value, index) => {
      const keyframe: Keyframe = {
        offset: index / SPRING_STEPS,
        translate: `${deltaX * value}px ${deltaY * value}px`,
      };

      if (isResized) keyframe["scale"] = `${1 + (scaleX - 1) * value} ${1 + (scaleY - 1) * value}`;

      return keyframe;
    }),
    {duration: SPRING_DURATION, easing: "linear"},
  );

  layoutAnimations.set(element, animation);
  animation.onfinish = () => {
    if (layoutAnimations.get(element) === animation) layoutAnimations.delete(element);
  };
}
