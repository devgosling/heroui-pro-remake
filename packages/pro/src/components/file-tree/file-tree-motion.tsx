"use client";

import type {ComponentProps, ReactNode} from "react";
import type {CollectionRenderer} from "react-aria-components/CollectionBuilder";

import {Fragment, isValidElement, use, useEffect, useLayoutEffect, useRef, useState} from "react";
import {TreeStateContext} from "react-aria-components/Tree";

import {REDUCED_MOTION_QUERY} from "./use-prefers-reduced-motion";

/* -------------------------------------------------------------------------------------------------
 * Expand / collapse motion (timings measured on the HeroUI Pro demos)
 * Enter: height follows a critically damped spring that settles within 240ms, opacity a 220ms
 * expo-out tween. Exit: height 180ms ease-in, opacity 100ms quint-out.
 * -----------------------------------------------------------------------------------------------*/
const ENTER_HEIGHT_DURATION = 240;
const ENTER_OPACITY_DURATION = 220;
const ENTER_OPACITY_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const EXIT_HEIGHT_DURATION = 180;
const EXIT_HEIGHT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
const EXIT_OPACITY_DURATION = 100;
const EXIT_OPACITY_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * Critically damped spring (zero start velocity) whose remaining distance is 0.1% at the end of
 * the duration: `ωT` solves `(1 + x)·e^(-x) = 0.001`.
 */
const SPRING_OMEGA_T = 9.2334;
const SPRING_STEPS = 60;

function springProgress(x: number) {
  if (x >= 1) return 1;

  return 1 - (1 + SPRING_OMEGA_T * x) * Math.exp(-SPRING_OMEGA_T * x);
}

/** Height keyframes sampling the spring (linear segments of 4ms over 240ms). */
function springHeightKeyframes(from: number, to: number): Keyframe[] {
  return Array.from({length: SPRING_STEPS + 1}, (_, index) => {
    const offset = index / SPRING_STEPS;

    return {height: `${from + (to - from) * springProgress(offset)}px`, offset};
  });
}

/** Resting inline style of an open section (same as the Pro DOM). */
const OPEN_STYLE = {height: "auto", opacity: 1, overflow: "visible"} as const;

function shouldReduceMotion(element: Element) {
  if (element.closest('[data-reduce-motion="true"]')) return true;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/* -------------------------------------------------------------------------------------------------
 * Motion section - wraps the child rows of one expanded item (`[data-tree-motion-section]`)
 * -----------------------------------------------------------------------------------------------*/
interface FileTreeMotionSectionProps {
  children: ReactNode;
  isExpanded: boolean;
}

const FileTreeMotionSection = ({children, isExpanded}: FileTreeMotionSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const animationsRef = useRef<Animation[]>([]);
  const previousRef = useRef<boolean | null>(null);
  const mountedElementRef = useRef<HTMLDivElement | null>(null);
  const [isPresent, setIsPresent] = useState(isExpanded);
  const [isExiting, setIsExiting] = useState(false);

  // Re-opening while the exit animation is still running keeps the same element.
  if (isExpanded && !isPresent) setIsPresent(true);

  useLayoutEffect(() => {
    const element = ref.current;
    const previous = previousRef.current;
    const isFreshElement = element !== mountedElementRef.current;

    previousRef.current = isExpanded;
    mountedElementRef.current = element;

    if (!element) return;
    // Sections that are already open on mount (first render) appear without animation.
    if (previous === null || previous === isExpanded) return;

    const fromHeight = isFreshElement ? 0 : element.getBoundingClientRect().height;
    const fromOpacity = isFreshElement
      ? 0
      : Number.parseFloat(getComputedStyle(element).opacity) || 0;

    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];

    if (shouldReduceMotion(element) || typeof element.animate !== "function") {
      element.style.overflow = OPEN_STYLE.overflow;
      setIsExiting(false);
      // Presence follows the imperative animation; without one the section unmounts right away.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacts to DOM / matchMedia checks
      if (!isExpanded) setIsPresent(false);

      return;
    }

    element.style.overflow = "hidden";

    if (isExpanded) {
      setIsExiting(false);

      // Measured like Pro: `height: auto` with the overflow clipped. Inside a height-limited tree the
      // section may be flex-shrunk while it animates; it settles to its full height on finish.
      const toHeight = element.getBoundingClientRect().height;
      const height = element.animate(springHeightKeyframes(fromHeight, toHeight), {
        duration: ENTER_HEIGHT_DURATION,
        easing: "linear",
      });
      const opacity = element.animate([{opacity: fromOpacity}, {opacity: 1}], {
        duration: ENTER_OPACITY_DURATION,
        easing: ENTER_OPACITY_EASING,
      });

      height.onfinish = () => {
        element.style.overflow = OPEN_STYLE.overflow;
        animationsRef.current = [];
      };
      animationsRef.current = [height, opacity];
    } else {
      setIsExiting(true);

      const height = element.animate([{height: `${fromHeight}px`}, {height: "0px"}], {
        duration: EXIT_HEIGHT_DURATION,
        easing: EXIT_HEIGHT_EASING,
        fill: "forwards",
      });
      const opacity = element.animate([{opacity: fromOpacity}, {opacity: 0}], {
        duration: EXIT_OPACITY_DURATION,
        easing: EXIT_OPACITY_EASING,
        fill: "forwards",
      });

      height.onfinish = () => {
        animationsRef.current = [];
        setIsPresent(false);
        setIsExiting(false);
      };
      animationsRef.current = [height, opacity];
    }
  }, [isExpanded]);

  useEffect(() => () => animationsRef.current.forEach((animation) => animation.cancel()), []);

  if (!isPresent) return null;

  const isHidden = isExiting || !isExpanded;

  return (
    <div
      ref={ref}
      aria-hidden={isHidden || undefined}
      data-tree-motion-section=""
      inert={isHidden || undefined}
      role="presentation"
      // `overflow` is switched imperatively once the start height has been measured.
      style={isHidden ? {...OPEN_STYLE, pointerEvents: "none"} : OPEN_STYLE}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Collection renderer
 * React Aria renders a Tree as a flat list of rows. This renderer walks the collection level by
 * level and groups the rows of every expanded item into a motion section, so the group can be
 * animated as a whole. Drop indicators are placed exactly like React Aria's default renderer.
 * -----------------------------------------------------------------------------------------------*/
type RendererProps = ComponentProps<CollectionRenderer["CollectionRoot"]>;
type TreeCollection = RendererProps["collection"];
type TreeNode = NonNullable<ReturnType<TreeCollection["getItem"]>>;
type RenderDropIndicator = RendererProps["renderDropIndicator"];
type NodeKey = TreeNode["key"];

function getNode(collection: TreeCollection, key: NodeKey | null | undefined) {
  return key == null ? null : collection.getItem(key);
}

function hasChildRows(collection: TreeCollection, node: TreeNode) {
  let child = getNode(collection, node.firstChildKey);

  while (child) {
    if (child.type === "item" || child.type === "loader") return true;
    child = getNode(collection, child.nextKey);
  }

  return false;
}

/** "after" drop indicators, mirroring React Aria's default collection renderer. */
function renderAfterIndicators(
  collection: TreeCollection,
  node: TreeNode,
  renderDropIndicator: NonNullable<RenderDropIndicator>,
) {
  let keyAfter = collection.getKeyAfter(node.key);
  let nextFlat = getNode(collection, keyAfter);

  while (nextFlat && nextFlat.type !== "item") {
    keyAfter = collection.getKeyAfter(nextFlat.key);
    nextFlat = getNode(collection, keyAfter);
  }

  let nextSibling = getNode(collection, node.nextKey);

  while (nextSibling && nextSibling.type !== "item") {
    nextSibling = getNode(collection, nextSibling.nextKey);
  }

  const indicators: ReactNode[] = [];

  if (nextSibling) return indicators;

  let current: TreeNode | null = node;

  while (
    current?.type === "item" &&
    (!nextFlat || (current.parentKey !== nextFlat.parentKey && nextFlat.level < current.level))
  ) {
    const indicator = renderDropIndicator({
      dropPosition: "after",
      key: current.key,
      type: "item",
    });

    if (isValidElement(indicator)) {
      indicators.push(<Fragment key={`${String(current.key)}-after`}>{indicator}</Fragment>);
    }

    current = getNode(collection, current.parentKey);
  }

  return indicators;
}

interface FileTreeLevelProps {
  collection: TreeCollection;
  firstKey: NodeKey | null | undefined;
  renderDropIndicator?: RenderDropIndicator;
}

const FileTreeLevel = ({collection, firstKey, renderDropIndicator}: FileTreeLevelProps) => {
  const state = use(TreeStateContext);
  const rendered: ReactNode[] = [];
  let node = getNode(collection, firstKey);

  while (node) {
    // Content nodes are rendered by their TreeItem.
    if (node.type !== "content") {
      const key = String(node.key);
      const isItem = node.type === "item";

      rendered.push(
        <Fragment key={key}>
          {isItem && renderDropIndicator
            ? renderDropIndicator({dropPosition: "before", key: node.key, type: "item"})
            : null}
          {node.render?.(node)}
        </Fragment>,
      );

      if (isItem && hasChildRows(collection, node)) {
        rendered.push(
          <FileTreeMotionSection
            key={`${key}:children`}
            isExpanded={!!state?.expandedKeys.has(node.key)}
          >
            <FileTreeLevel
              collection={collection}
              firstKey={node.firstChildKey}
              renderDropIndicator={renderDropIndicator}
            />
          </FileTreeMotionSection>,
        );
      }

      if (isItem && renderDropIndicator) {
        rendered.push(...renderAfterIndicators(collection, node, renderDropIndicator));
      }
    }

    node = getNode(collection, node.nextKey);
  }

  return <>{rendered}</>;
};

export {FileTreeLevel};
