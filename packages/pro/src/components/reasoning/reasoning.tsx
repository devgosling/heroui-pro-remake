"use client";

import type {LoaderRootProps} from "../loader";
import type {
  DisclosureContentProps,
  DisclosureRootProps,
  DisclosureTriggerProps,
} from "@heroui/react";
import type {ComponentProps, ComponentPropsWithRef, ReactNode} from "react";

import {Disclosure} from "@heroui/react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {composeTwRenderProps, useMergedRef} from "../../utils";
import {Loader} from "../loader";
import {TextShimmer} from "../text-shimmer";

import {reasoningVariants} from "./reasoning.styles";

// Parts are fixed, so the slot functions can be shared by every instance.
const slots = reasoningVariants();

/* -------------------------------------------------------------------------------------------------
 * Types & helpers
 * -----------------------------------------------------------------------------------------------*/
/** Run status of a reasoning block. */
type ReasoningStatus = "streaming" | "complete" | "stopped" | "error";

type DataAttr = "true" | undefined;

const dataAttr = (condition: boolean): DataAttr => (condition ? "true" : undefined);

/** True for `null`, `undefined`, booleans, empty strings and arrays made only of those. */
function isEmptyNode(node: ReactNode): boolean {
  if (node == null || typeof node === "boolean" || node === "") return true;
  if (Array.isArray(node)) return node.every(isEmptyNode);

  return false;
}

/** True when the element holds an element child or non-whitespace text. */
function hasVisibleContent(element: HTMLElement): boolean {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) return true;
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
  }

  return false;
}

/** Longest running transition (duration + delay) of an element in ms; 0 when transitions are off. */
function getTransitionTime(element: Element): number {
  const style = getComputedStyle(element);

  if (style.transitionProperty === "none") return 0;

  const toMs = (value: string) => {
    const number = Number.parseFloat(value);

    if (Number.isNaN(number)) return 0;

    return value.trim().endsWith("ms") ? number : number * 1000;
  };
  const durations = style.transitionDuration.split(",").map(toMs);
  const delays = style.transitionDelay.split(",").map(toMs);

  return Math.max(0, ...durations.map((duration, index) => duration + (delays[index] ?? 0)));
}

/** Keeps the latest value in a ref without writing to it during render. */
function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  });

  return ref;
}

/* -------------------------------------------------------------------------------------------------
 * Reasoning Context
 * -----------------------------------------------------------------------------------------------*/
type ReasoningContext = {
  status: ReasoningStatus;
  isStreaming: boolean;
  duration?: string;
  /** Lets `Reasoning.Content` report whether it holds visible content (drives the auto open). */
  reportContent?: (hasContent: boolean) => void;
};

const ReasoningContext = createContext<ReasoningContext>({
  isStreaming: false,
  status: "complete",
});

/* -------------------------------------------------------------------------------------------------
 * Reasoning Root
 *
 * A HeroUI Disclosure whose expanded state is driven by the run status:
 *  - opens when the first visible content streams into `Reasoning.Content` (`autoExpand`);
 *  - collapses `collapseDelay` ms after `streaming -> complete`, unless the user toggled it, and
 *    waits for focus to leave the trace first;
 *  - `stopped` / `error` keep the trace as it was, even when `complete` follows.
 * Automatic changes only call `onExpandedChange` when controlled.
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningRootProps extends Omit<
  DisclosureRootProps,
  "isExpanded" | "defaultExpanded" | "onExpandedChange"
> {
  /** Run status of this block. @default "complete" */
  status?: ReasoningStatus;
  /** Formatted thinking time, such as "9s", shown once complete or stopped. */
  duration?: string;
  /** Opens the trace when the first content streams in. @default true */
  autoExpand?: boolean;
  /** Milliseconds before the automatic collapse. `Infinity` never collapses. @default 1000 */
  collapseDelay?: number;
  /** Initial state when uncontrolled. @default false */
  defaultExpanded?: boolean;
  /** Controlled expanded state. */
  isExpanded?: boolean;
  /** Called when the expanded state changes, including the automatic open and collapse. */
  onExpandedChange?: (isExpanded: boolean) => void;
}

const ReasoningRoot = ({
  autoExpand = true,
  className,
  collapseDelay = 1000,
  defaultExpanded = false,
  duration,
  isExpanded: isExpandedProp,
  onExpandedChange,
  ref,
  status = "complete",
  ...rest
}: ReasoningRootProps) => {
  const isControlled = isExpandedProp !== undefined;
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const isExpanded = isControlled ? isExpandedProp : uncontrolledExpanded;
  const isStreaming = status === "streaming";

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);

  const isControlledRef = useLatestRef(isControlled);
  const isExpandedRef = useLatestRef(isExpanded);
  const onExpandedChangeRef = useLatestRef(onExpandedChange);
  const collapseDelayRef = useLatestRef(collapseDelay);

  // Per-run bookkeeping: a user toggle disables the automatic open and collapse of the run.
  const userToggledRef = useRef(false);
  const autoOpenedRef = useRef(false);

  const hasContentRef = useRef(false);
  const [hasContent, setHasContent] = useState(false);
  const reportContent = useCallback((value: boolean) => {
    hasContentRef.current = value;
    setHasContent(value);
  }, []);

  const applyExpanded = useCallback(
    (next: boolean) => {
      if (!isControlledRef.current) setUncontrolledExpanded(next);
      onExpandedChangeRef.current?.(next);
    },
    [isControlledRef, onExpandedChangeRef],
  );

  const handleExpandedChange = useCallback(
    (next: boolean) => {
      userToggledRef.current = true;
      applyExpanded(next);
    },
    [applyExpanded],
  );

  // An uncontrolled root that mounts mid-stream with content starts open, silently. `Content`
  // reports its content in its own layout effect, which runs before this one.
  useLayoutEffect(() => {
    if (status !== "streaming" || !autoExpand || !hasContentRef.current) return;

    autoOpenedRef.current = true;
    if (isExpandedRef.current) return;
    if (isControlledRef.current) onExpandedChangeRef.current?.(true);
    else setUncontrolledExpanded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only by design: later `status` / `autoExpand` changes go through the effects below, and the *Ref values are stable refs
  }, []); // Mount only: later changes go through the effects below.

  // Automatic open on the first visible content of a run.
  useEffect(() => {
    if (!isStreaming || !autoExpand || !hasContent) return;
    if (userToggledRef.current || autoOpenedRef.current) return;

    autoOpenedRef.current = true;
    if (!isExpandedRef.current) applyExpanded(true);
  }, [applyExpanded, autoExpand, hasContent, isExpandedRef, isStreaming]);

  // Automatic collapse after `streaming -> complete`.
  const previousStatusRef = useRef(status);

  useEffect(() => {
    const previous = previousStatusRef.current;

    previousStatusRef.current = status;
    if (previous === status) return;

    if (status === "streaming") {
      // A new run starts: forget the toggles of the previous one.
      userToggledRef.current = false;
      autoOpenedRef.current = false;

      return;
    }

    if (previous !== "streaming" || status !== "complete") return;

    const delay = collapseDelayRef.current;

    if (!Number.isFinite(delay)) return;

    let removeFocusListener: (() => void) | undefined;

    const collapse = () => {
      if (userToggledRef.current || !isExpandedRef.current) return;
      applyExpanded(false);
    };

    const timer = setTimeout(
      () => {
        const root = rootRef.current;

        if (!root || !root.contains(document.activeElement)) {
          collapse();

          return;
        }

        // Wait until focus leaves the trace.
        const onFocusOut = (event: FocusEvent) => {
          if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
          removeFocusListener?.();
          removeFocusListener = undefined;
          collapse();
        };

        root.addEventListener("focusout", onFocusOut);
        removeFocusListener = () => root.removeEventListener("focusout", onFocusOut);
      },
      Math.max(0, delay),
    );

    return () => {
      clearTimeout(timer);
      removeFocusListener?.();
    };
  }, [applyExpanded, collapseDelayRef, isExpandedRef, status]);

  const contextValue = useMemo<ReasoningContext>(
    () => ({duration, isStreaming, reportContent, status}),
    [duration, isStreaming, reportContent, status],
  );

  return (
    <ReasoningContext value={contextValue}>
      <Disclosure
        {...rest}
        ref={mergedRef}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="reasoning"
        data-status={status}
        data-streaming={dataAttr(isStreaming)}
        isExpanded={isExpanded}
        onExpandedChange={handleExpandedChange}
      />
    </ReasoningContext>
  );
};

ReasoningRoot.displayName = "HeroUI.Reasoning";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Loader (shown while streaming, then fades out)
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningLoaderProps extends LoaderRootProps {}

type LoaderPhase = "visible" | "exiting" | "hidden";

const ReasoningLoader = ({
  children,
  className,
  ref,
  render,
  size = "sm",
  variant = "grid",
  ...rest
}: ReasoningLoaderProps) => {
  const {isStreaming} = use(ReasoningContext);
  const [phase, setPhase] = useState<LoaderPhase>(isStreaming ? "visible" : "hidden");

  // Adjust the phase during render so `data-exiting` lands in the same commit as the status.
  if (isStreaming && phase !== "visible") setPhase("visible");
  else if (!isStreaming && phase === "visible") setPhase("exiting");

  const loaderRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRef(ref, loaderRef);

  useLayoutEffect(() => {
    if (phase !== "exiting") return;

    const element = loaderRef.current;
    const time = element ? getTransitionTime(element) : 0;

    // Reduced motion (or no transition at all): unmount right away.
    if (!element || time === 0) {
      setPhase("hidden");

      return;
    }

    const finish = () => setPhase("hidden");
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === "opacity") finish();
    };
    const fallback = setTimeout(finish, time + 50);

    element.addEventListener("transitionend", onTransitionEnd);

    return () => {
      clearTimeout(fallback);
      element.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <Loader
      {...rest}
      ref={mergedRef}
      aria-hidden="true"
      className={slots.loader({className})}
      data-exiting={dataAttr(phase === "exiting")}
      size={size}
      variant={variant}
      // The Loader writes its own `data-slot`; the render hook renames it for this part.
      render={(props, renderProps) =>
        render ? (
          render({...props, "data-slot": "reasoning-loader"} as typeof props, renderProps)
        ) : (
          <span {...props} data-slot="reasoning-loader" />
        )
      }
    >
      {children}
    </Loader>
  );
};

ReasoningLoader.displayName = "HeroUI.Reasoning.Loader";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Duration
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningDurationProps extends ComponentPropsWithRef<"span"> {}

const ReasoningDuration = ({children, className, ...rest}: ReasoningDurationProps) => {
  const {duration} = use(ReasoningContext);
  const content = isEmptyNode(children) ? duration : children;

  if (isEmptyNode(content)) return null;

  return (
    <span className={slots.duration({className})} data-slot="reasoning-duration" {...rest}>
      {content}
    </span>
  );
};

ReasoningDuration.displayName = "HeroUI.Reasoning.Duration";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Label
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningLabelRenderProps {
  /** Run status of the block. */
  status: ReasoningStatus;
  /** `true` while thinking is in progress. */
  isStreaming: boolean;
  /** Formatted thinking time passed to the root. */
  duration?: string;
  /** The default text for the current status. */
  defaultChildren: ReactNode;
}

interface ReasoningLabelProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /** Replaces the default text. A function can return `defaultChildren`. */
  children?: ReactNode | ((renderProps: ReasoningLabelRenderProps) => ReactNode);
}

function getDefaultLabel(status: ReasoningStatus, duration: string | undefined): ReactNode {
  const hasDuration = !isEmptyNode(duration);

  switch (status) {
    case "streaming":
      return <TextShimmer>Thinking</TextShimmer>;
    case "stopped":
      return hasDuration ? (
        <>
          Stopped after <ReasoningDuration />
        </>
      ) : (
        "Stopped thinking"
      );
    case "error":
      return "Couldn't finish thinking";
    default:
      return hasDuration ? (
        <>
          Thought for <ReasoningDuration />
        </>
      ) : (
        "Thought for a few seconds"
      );
  }
}

const ReasoningLabel = ({children, className, ...rest}: ReasoningLabelProps) => {
  const {duration, isStreaming, status} = use(ReasoningContext);

  // The label is keyed by status, so a status change mounts a fresh label. Every label after the
  // first one carries `data-swapped`, which fades it in through `@starting-style`.
  const [initialStatus] = useState(status);
  const [isSwapped, setIsSwapped] = useState(false);

  if (!isSwapped && status !== initialStatus) setIsSwapped(true);

  const defaultChildren = getDefaultLabel(status, duration);
  const content =
    typeof children === "function"
      ? children({defaultChildren, duration, isStreaming, status})
      : (children ?? defaultChildren);

  return (
    <span
      key={status}
      className={slots.label({className})}
      data-slot="reasoning-label"
      data-status={status}
      data-streaming={dataAttr(isStreaming)}
      data-swapped={dataAttr(isSwapped)}
      {...rest}
    >
      {content}
    </span>
  );
};

ReasoningLabel.displayName = "HeroUI.Reasoning.Label";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Indicator (chevron)
 * -----------------------------------------------------------------------------------------------*/
type ReasoningIndicatorProps = ComponentProps<typeof Disclosure.Indicator>;

const ReasoningIndicator = ({className, ...rest}: ReasoningIndicatorProps) => (
  <Disclosure.Indicator
    {...rest}
    className={slots.indicator({className})}
    data-slot="reasoning-indicator"
  />
);

ReasoningIndicator.displayName = "HeroUI.Reasoning.Indicator";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Trigger (a button inside a heading)
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningTriggerProps extends DisclosureTriggerProps {
  /** Level of the heading around the trigger. @default 3 */
  headingLevel?: number;
}

const ReasoningTrigger = ({
  children,
  className,
  headingLevel = 3,
  ...rest
}: ReasoningTriggerProps) => (
  <Disclosure.Heading
    className={slots.heading()}
    data-slot="reasoning-heading"
    level={headingLevel}
  >
    <Disclosure.Trigger
      {...rest}
      className={composeTwRenderProps(className, slots.trigger())}
      data-slot="reasoning-trigger"
    >
      {children ?? (
        <>
          <ReasoningLoader />
          <ReasoningLabel />
          <ReasoningIndicator />
        </>
      )}
    </Disclosure.Trigger>
  </Disclosure.Heading>
);

ReasoningTrigger.displayName = "HeroUI.Reasoning.Trigger";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Content (collapsible panel)
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningContentProps extends DisclosureContentProps {}

const ReasoningContent = ({children, className, ...rest}: ReasoningContentProps) => {
  const {isStreaming, reportContent} = use(ReasoningContext);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Report visible content (also content rendered later by nested components) to the root.
  useLayoutEffect(() => {
    const body = bodyRef.current;

    if (!body || !reportContent) return;

    const check = () => reportContent(hasVisibleContent(body));
    const observer = new MutationObserver(check);

    check();
    observer.observe(body, {characterData: true, childList: true, subtree: true});

    return () => {
      observer.disconnect();
      reportContent(false);
    };
  }, [reportContent]);

  return (
    <Disclosure.Content
      {...rest}
      className={composeTwRenderProps(className, slots.content())}
      data-slot="reasoning-content"
    >
      <Disclosure.Body>
        <div
          ref={bodyRef}
          aria-busy={isStreaming || undefined}
          className={slots.body()}
          data-slot="reasoning-body"
        >
          {children}
        </div>
      </Disclosure.Body>
    </Disclosure.Content>
  );
};

ReasoningContent.displayName = "HeroUI.Reasoning.Content";

/* -------------------------------------------------------------------------------------------------
 * Reasoning Text (thinking text that keeps its line breaks; works outside a Reasoning)
 * -----------------------------------------------------------------------------------------------*/
interface ReasoningTextProps extends ComponentPropsWithRef<"div"> {}

const ReasoningText = ({children, className, ...rest}: ReasoningTextProps) => {
  if (isEmptyNode(children)) return null;

  return (
    <div className={slots.text({className})} data-slot="reasoning-text" {...rest}>
      {children}
    </div>
  );
};

ReasoningText.displayName = "HeroUI.Reasoning.Text";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ReasoningRoot,
  ReasoningTrigger,
  ReasoningLoader,
  ReasoningLabel,
  ReasoningDuration,
  ReasoningIndicator,
  ReasoningContent,
  ReasoningText,
  ReasoningContext,
};

export type {
  ReasoningStatus,
  ReasoningRootProps,
  ReasoningTriggerProps,
  ReasoningLoaderProps,
  ReasoningLabelProps,
  ReasoningLabelRenderProps,
  ReasoningDurationProps,
  ReasoningIndicatorProps,
  ReasoningContentProps,
  ReasoningTextProps,
};
