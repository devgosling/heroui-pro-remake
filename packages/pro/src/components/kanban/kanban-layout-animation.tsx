"use client";

import type {ReactNode, RefObject} from "react";

import {Component} from "react";

/* -------------------------------------------------------------------------------------------------
 * Spring
 * -------------------------------------------------------------------------------------------------
 * Cards glide to their new slot whenever the board re-renders them somewhere else (drop indicator
 * moving, a card leaving or joining a column, a column scrollbar appearing). The curve is a lightly
 * underdamped spring (about 0.6% overshoot, settled after ~380ms), fitted to the motion observed on
 * the original board.
 * -----------------------------------------------------------------------------------------------*/
const SPRING_STIFFNESS = 620;
const SPRING_DAMPING = 42;
const DURATION_MS = 380;
const FRAME_MS = 1000 / 60;

/** Remaining displacement (1 -> 0) of a spring released from rest at time `t` (seconds). */
function springDisplacement(t: number): number {
  const omega = Math.sqrt(SPRING_STIFFNESS);
  const zeta = SPRING_DAMPING / (2 * omega);
  const dampedOmega = omega * Math.sqrt(1 - zeta * zeta);
  const decay = zeta * omega;

  return (
    Math.exp(-decay * t) *
    (Math.cos(dampedOmega * t) + (decay / dampedOmega) * Math.sin(dampedOmega * t))
  );
}

const SPRING_SAMPLES: ReadonlyArray<{offset: number; value: number}> = (() => {
  const samples: Array<{offset: number; value: number}> = [];
  const steps = Math.ceil(DURATION_MS / FRAME_MS);

  for (let step = 0; step <= steps; step++) {
    const time = Math.min(step * FRAME_MS, DURATION_MS);

    samples.push({
      offset: time / DURATION_MS,
      value: step === steps ? 0 : springDisplacement(time / 1000),
    });
  }

  return samples;
})();

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const EPSILON_PX = 0.5;
const EPSILON_SCALE = 0.005;

function sameRect(a: DOMRect, b: DOMRect) {
  return (
    Math.abs(a.left - b.left) < EPSILON_PX &&
    Math.abs(a.top - b.top) < EPSILON_PX &&
    Math.abs(a.width - b.width) < EPSILON_PX &&
    Math.abs(a.height - b.height) < EPSILON_PX
  );
}

function prefersReducedMotion(element: Element) {
  if (element.closest('[data-reduce-motion="true"]')) return true;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* -------------------------------------------------------------------------------------------------
 * KanbanLayoutAnimation
 * -------------------------------------------------------------------------------------------------
 * A FLIP animator for a card's content box. It reads the content's on-screen box right before React
 * applies an update (getSnapshotBeforeUpdate, which has no hook equivalent) and the row's new layout
 * box right after it. When the two differ the content is animated from the old box to the new one
 * with transforms only, so the row (the drag source and drop target) never moves visually ahead
 * of its layout.
 * -----------------------------------------------------------------------------------------------*/
interface KanbanLayoutAnimationProps {
  children: ReactNode;
  /** The element whose box is the layout target (never transformed). */
  layoutRef: RefObject<HTMLElement | null>;
  /** The element that is visually animated. */
  targetRef: RefObject<HTMLElement | null>;
}

class KanbanLayoutAnimation extends Component<KanbanLayoutAnimationProps> {
  private animation: Animation | null = null;
  private layoutBox: DOMRect | null = null;

  override componentDidMount() {
    this.layoutBox = this.props.layoutRef.current?.getBoundingClientRect() ?? null;
  }

  override getSnapshotBeforeUpdate(): DOMRect | null {
    return this.props.targetRef.current?.getBoundingClientRect() ?? null;
  }

  override componentDidUpdate(
    _prevProps: KanbanLayoutAnimationProps,
    _prevState: unknown,
    visualBox: DOMRect | null,
  ) {
    const layoutElement = this.props.layoutRef.current;
    const target = this.props.targetRef.current;

    if (!visualBox || !layoutElement || !target) return;

    const nextBox = layoutElement.getBoundingClientRect();
    const previousBox = this.layoutBox;

    this.layoutBox = nextBox;

    // Re-render without a layout change: let a running animation finish its way.
    if (previousBox && sameRect(previousBox, nextBox) && this.animation?.playState === "running") {
      return;
    }

    if (nextBox.width === 0 || nextBox.height === 0) return;

    const deltaX = visualBox.left + visualBox.width / 2 - (nextBox.left + nextBox.width / 2);
    const deltaY = visualBox.top + visualBox.height / 2 - (nextBox.top + nextBox.height / 2);
    const scaleX = visualBox.width / nextBox.width;
    const scaleY = visualBox.height / nextBox.height;

    const isSettled =
      Math.abs(deltaX) < EPSILON_PX &&
      Math.abs(deltaY) < EPSILON_PX &&
      Math.abs(scaleX - 1) < EPSILON_SCALE &&
      Math.abs(scaleY - 1) < EPSILON_SCALE;

    if (isSettled || typeof target.animate !== "function" || prefersReducedMotion(target)) {
      this.stop();

      return;
    }

    this.stop();
    this.animation = target.animate(
      SPRING_SAMPLES.map(({offset, value}) => ({
        offset,
        transform: `translate3d(${deltaX * value}px, ${deltaY * value}px, 0px) scale(${
          1 + (scaleX - 1) * value
        }, ${1 + (scaleY - 1) * value})`,
      })),
      {duration: DURATION_MS, easing: "linear"},
    );
  }

  override componentWillUnmount() {
    this.stop();
  }

  private stop() {
    this.animation?.cancel();
    this.animation = null;
  }

  override render() {
    return this.props.children;
  }
}

export {KanbanLayoutAnimation};
