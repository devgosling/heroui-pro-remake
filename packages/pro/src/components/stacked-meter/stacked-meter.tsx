"use client";

import type {
  StackedMeterColor,
  StackedMeterContextValue,
  StackedMeterRenderProps,
  StackedMeterRootAnimation,
  StackedMeterSegmentAnimation,
  StackedMeterSegment as StackedMeterSegmentData,
  StackedMeterSegmentState,
  StackedMeterSize,
} from "./stacked-meter-context";
import type {CSSProperties, ComponentPropsWithRef, ReactNode} from "react";

import {use, useCallback, useId, useMemo, useState} from "react";
import {cx} from "tailwind-variants";

import {useMergedRef} from "../../utils";

import {
  StackedMeterContext,
  StackedMeterInternalContext,
  StackedMeterSegmentContext,
  useStackedMeterSegment,
} from "./stacked-meter-context";
import {stackedMeterVariants} from "./stacked-meter.styles";
import {useStackedMeterState} from "./use-stacked-meter-state";

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const useInternalContext = () => use(StackedMeterInternalContext);

/**
 * Every part of the track starts from a small fixed basis and shares the rest by its percentage.
 * This mirrors the Native layout (Yoga treats the segment's minimum size as its flex basis), where
 * small segments come out ~2dp wider and large ones narrower than a purely proportional split.
 */
const SEGMENT_BASIS = "var(--stacked-meter-segment-basis)";

/** Wraps `node` in the context of one segment. */
const renderInSegmentContext = (segment: StackedMeterSegmentState, node: ReactNode) => (
  <StackedMeterSegmentContext key={segment.id} value={{segment}}>
    {node}
  </StackedMeterSegmentContext>
);

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterRootProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /** Segments to display, in order along the reading direction. */
  segments: StackedMeterSegmentData[];
  /** Capacity the values are measured against. Ignored when smaller than the sum of the values. */
  maxValue?: number;
  /** Height of the track. @default "md" */
  size?: StackedMeterSize;
  /** Whether the component is disabled (lowers the opacity, sets `aria-disabled`). */
  isDisabled?: boolean;
  /**
   * Number format options for each segment's value text. `percent` formats the share; any other
   * style formats the raw value.
   * @default {style: "percent", maximumFractionDigits: 1}
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** `"disable-all"` turns off every animation, including the children's. */
  animation?: StackedMeterRootAnimation;
  /**
   * Content or render function. Omitted children render Track + Legend; string children add a
   * Label before them.
   */
  children?: ReactNode | ((props: StackedMeterRenderProps) => ReactNode);
}

const StackedMeterRoot = ({
  animation,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  formatOptions,
  isDisabled = false,
  maxValue,
  segments,
  size = "md",
  ...rest
}: StackedMeterRootProps) => {
  const slots = useMemo(() => stackedMeterVariants({size}), [size]);
  const state = useStackedMeterState(segments, maxValue, formatOptions);

  const labelId = useId();
  const [mountedLabelId, setMountedLabelId] = useState<string | null>(null);
  const labelRef = useCallback((element: HTMLElement | null) => {
    setMountedLabelId(element?.id || null);
  }, []);

  const isAnimationDisabled = animation === "disable-all";
  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : (mountedLabelId ?? undefined));

  const contextValue = useMemo<StackedMeterContextValue>(
    () => ({...state, accessibilityLabel: ariaLabel, isDisabled, size}),
    [ariaLabel, isDisabled, size, state],
  );

  const internalValue = useMemo(
    () => ({isAnimationDisabled, labelId, labelRef, labelledBy, slots}),
    [isAnimationDisabled, labelId, labelRef, labelledBy, slots],
  );

  let content: ReactNode;

  if (typeof children === "function") {
    content = children({
      segments: state.segments,
      summaryText: state.summaryText,
      total: state.total,
    });
  } else if (children === undefined) {
    content = (
      <>
        <StackedMeterTrack />
        <StackedMeterLegend />
      </>
    );
  } else if (typeof children === "string") {
    content = (
      <>
        <StackedMeterLabel>{children}</StackedMeterLabel>
        <StackedMeterTrack />
        <StackedMeterLegend />
      </>
    );
  } else {
    content = children;
  }

  return (
    <StackedMeterContext value={contextValue}>
      <StackedMeterInternalContext value={internalValue}>
        <div
          aria-disabled={isDisabled || undefined}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          className={slots.base({className})}
          data-animation={isAnimationDisabled ? "disabled" : undefined}
          data-disabled={isDisabled ? "true" : undefined}
          data-size={size}
          data-slot="stacked-meter"
          role="group"
          {...rest}
        >
          {content}
        </div>
      </StackedMeterInternalContext>
    </StackedMeterContext>
  );
};

StackedMeterRoot.displayName = "HeroUI.StackedMeter";

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterLabelProps extends ComponentPropsWithRef<"span"> {}

const StackedMeterLabel = ({className, id, ref, ...rest}: StackedMeterLabelProps) => {
  const internal = useInternalContext();
  const fallbackRef = useCallback(() => {}, []);
  const mergedRef = useMergedRef(ref, internal?.labelRef ?? fallbackRef);

  return (
    <span
      ref={mergedRef}
      className={internal?.slots?.label({className}) ?? className}
      data-slot="stacked-meter-label"
      id={id ?? internal?.labelId}
      {...rest}
    />
  );
};

StackedMeterLabel.displayName = "HeroUI.StackedMeter.Label";

/* -------------------------------------------------------------------------------------------------
 * Track
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterTrackProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /**
   * Omitted: one Segment per non-zero segment. Function: called per non-zero segment inside its
   * context. Node: rendered verbatim instead of the segments.
   */
  children?: ReactNode | ((segment: StackedMeterSegmentState) => ReactNode);
  /**
   * Layer behind the empty remainder of the track. `undefined` renders the default
   * `StackedMeter.TrackBackground` (a CSS hook for themes); a node replaces it; `null` removes it.
   */
  background?: ReactNode;
}

const StackedMeterTrack = ({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  background,
  children,
  className,
  ...rest
}: StackedMeterTrackProps) => {
  const meter = use(StackedMeterContext);
  const internal = useInternalContext();

  if (!meter) {
    throw new Error("StackedMeter.Track must be used within a <StackedMeter> component.");
  }

  const {accessibilityLabel, remainderPercentage, segments, summaryText} = meter;
  const visibleSegments = segments.filter((segment) => segment.percentage > 0);
  const usedPercentage = Math.round((100 - remainderPercentage) * 10) / 10;

  let content: ReactNode;

  if (typeof children === "function") {
    content = visibleSegments.map((segment) => renderInSegmentContext(segment, children(segment)));
  } else if (children === undefined) {
    content = visibleSegments.map((segment) =>
      renderInSegmentContext(segment, <StackedMeterSegment />),
    );
  } else {
    content = children;
  }

  const resolvedLabel = ariaLabel ?? accessibilityLabel;
  const labelledBy = ariaLabelledBy ?? (resolvedLabel ? undefined : internal?.labelledBy);
  // Without a Label or aria-label the summary itself names the meter (Native exposes the track as
  // one element that reads the summary); the value text is then left out so it is not read twice.
  const isNamed = Boolean(resolvedLabel || labelledBy);

  return (
    <div
      aria-label={isNamed ? resolvedLabel : summaryText || undefined}
      aria-labelledby={labelledBy}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={usedPercentage}
      aria-valuetext={isNamed ? summaryText || undefined : undefined}
      className={internal?.slots?.track({className}) ?? className}
      data-slot="stacked-meter-track"
      role="meter"
      {...rest}
    >
      {content}
      {remainderPercentage > 0 ? (
        <div
          aria-hidden="true"
          className={internal?.slots?.remainder()}
          data-animation={internal?.isAnimationDisabled ? "disabled" : undefined}
          data-slot="stacked-meter-remainder"
          style={{flexBasis: SEGMENT_BASIS, flexGrow: remainderPercentage}}
        >
          {background === undefined ? <StackedMeterTrackBackground /> : background}
        </div>
      ) : null}
    </div>
  );
};

StackedMeterTrack.displayName = "HeroUI.StackedMeter.Track";

/* -------------------------------------------------------------------------------------------------
 * TrackBackground
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterTrackBackgroundProps extends ComponentPropsWithRef<"div"> {}

const StackedMeterTrackBackground = ({className, ...rest}: StackedMeterTrackBackgroundProps) => {
  const internal = useInternalContext();

  return (
    <div
      aria-hidden="true"
      className={internal?.slots?.trackBackground({className}) ?? className}
      data-slot="stacked-meter-track-background"
      {...rest}
    />
  );
};

StackedMeterTrackBackground.displayName = "HeroUI.StackedMeter.TrackBackground";

/* -------------------------------------------------------------------------------------------------
 * Segment
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterSegmentProps extends ComponentPropsWithRef<"div"> {
  /**
   * Share transition: `false` / `"disabled"` turns it off, an object customises it
   * (`{growTimingConfig: {duration, easing}}`).
   */
  animation?: StackedMeterSegmentAnimation;
  /**
   * When false, the share-based `flex-grow` is not applied, so `style` / `className` fully control
   * the segment's size.
   * @default true
   */
  isAnimatedStyleActive?: boolean;
}

const StackedMeterSegment = ({
  animation,
  className,
  isAnimatedStyleActive = true,
  style,
  ...rest
}: StackedMeterSegmentProps) => {
  const internal = useInternalContext();
  const {segment} = useStackedMeterSegment();

  const isDisabled =
    internal?.isAnimationDisabled || animation === false || animation === "disabled";
  const timing = typeof animation === "object" ? animation.growTimingConfig : undefined;

  const timingVars: Record<string, string> = {};

  if (timing?.duration !== undefined) {
    timingVars["--stacked-meter-grow-duration"] = `${timing.duration}ms`;
  }
  if (timing?.easing) timingVars["--stacked-meter-grow-easing"] = timing.easing;

  const resolvedStyle: CSSProperties = {
    ...(isAnimatedStyleActive ? {flexBasis: SEGMENT_BASIS, flexGrow: segment.percentage} : null),
    ...timingVars,
    ...style,
  };

  return (
    <div
      data-animation={isDisabled ? "disabled" : undefined}
      data-color={segment.color}
      data-index={segment.index}
      data-slot="stacked-meter-segment"
      style={resolvedStyle}
      className={
        internal?.slots?.segment({
          className: cx(segment.colorClassName, className),
          color: segment.color,
        }) ?? className
      }
      {...rest}
    />
  );
};

StackedMeterSegment.displayName = "HeroUI.StackedMeter.Segment";

/* -------------------------------------------------------------------------------------------------
 * Legend
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterLegendProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  /**
   * Omitted: one LegendItem per segment. Function: called per segment inside its context. Node:
   * rendered verbatim instead.
   */
  children?: ReactNode | ((segment: StackedMeterSegmentState) => ReactNode);
}

const StackedMeterLegend = ({children, className, ...rest}: StackedMeterLegendProps) => {
  const meter = use(StackedMeterContext);
  const internal = useInternalContext();

  if (!meter) {
    throw new Error("StackedMeter.Legend must be used within a <StackedMeter> component.");
  }

  let content: ReactNode;

  if (typeof children === "function") {
    content = meter.segments.map((segment) => renderInSegmentContext(segment, children(segment)));
  } else if (children === undefined) {
    content = meter.segments.map((segment) =>
      renderInSegmentContext(segment, <StackedMeterLegendItem />),
    );
  } else {
    content = children;
  }

  return (
    <div
      className={internal?.slots?.legend({className}) ?? className}
      data-slot="stacked-meter-legend"
      role="list"
      {...rest}
    >
      {content}
    </div>
  );
};

StackedMeterLegend.displayName = "HeroUI.StackedMeter.Legend";

/* -------------------------------------------------------------------------------------------------
 * LegendItem
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterLegendItemProps extends ComponentPropsWithRef<"div"> {}

const StackedMeterLegendItem = ({children, className, ...rest}: StackedMeterLegendItemProps) => {
  const internal = useInternalContext();
  const {segment} = useStackedMeterSegment();

  return (
    <div
      className={internal?.slots?.legendItem({className}) ?? className}
      data-color={segment.color}
      data-index={segment.index}
      data-slot="stacked-meter-legend-item"
      role="listitem"
      {...rest}
    >
      {children ?? (
        <>
          <StackedMeterLegendIndicator />
          <StackedMeterLegendLabel />
          <StackedMeterLegendValue />
        </>
      )}
    </div>
  );
};

StackedMeterLegendItem.displayName = "HeroUI.StackedMeter.LegendItem";

/* -------------------------------------------------------------------------------------------------
 * LegendIndicator
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterLegendIndicatorProps extends ComponentPropsWithRef<"span"> {}

const StackedMeterLegendIndicator = ({className, ...rest}: StackedMeterLegendIndicatorProps) => {
  const internal = useInternalContext();
  const {segment} = useStackedMeterSegment();

  return (
    <span
      aria-hidden="true"
      data-color={segment.color}
      data-slot="stacked-meter-legend-indicator"
      className={
        internal?.slots?.legendIndicator({
          className: cx(segment.colorClassName, className),
          color: segment.color,
        }) ?? className
      }
      {...rest}
    />
  );
};

StackedMeterLegendIndicator.displayName = "HeroUI.StackedMeter.LegendIndicator";

/* -------------------------------------------------------------------------------------------------
 * LegendLabel
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterLegendLabelProps extends ComponentPropsWithRef<"span"> {}

const StackedMeterLegendLabel = ({children, className, ...rest}: StackedMeterLegendLabelProps) => {
  const internal = useInternalContext();
  const {segment} = useStackedMeterSegment();

  return (
    <span
      className={internal?.slots?.legendLabel({className}) ?? className}
      data-slot="stacked-meter-legend-label"
      {...rest}
    >
      {children ?? segment.label}
    </span>
  );
};

StackedMeterLegendLabel.displayName = "HeroUI.StackedMeter.LegendLabel";

/* -------------------------------------------------------------------------------------------------
 * LegendValue
 * -----------------------------------------------------------------------------------------------*/
interface StackedMeterLegendValueProps extends ComponentPropsWithRef<"span"> {}

const StackedMeterLegendValue = ({children, className, ...rest}: StackedMeterLegendValueProps) => {
  const internal = useInternalContext();
  const {segment} = useStackedMeterSegment();

  return (
    <span
      className={internal?.slots?.legendValue({className}) ?? className}
      data-slot="stacked-meter-legend-value"
      {...rest}
    >
      {children ?? segment.valueText}
    </span>
  );
};

StackedMeterLegendValue.displayName = "HeroUI.StackedMeter.LegendValue";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  StackedMeterRoot,
  StackedMeterLabel,
  StackedMeterTrack,
  StackedMeterTrackBackground,
  StackedMeterSegment,
  StackedMeterLegend,
  StackedMeterLegendItem,
  StackedMeterLegendIndicator,
  StackedMeterLegendLabel,
  StackedMeterLegendValue,
};

export type {
  StackedMeterRootProps,
  StackedMeterLabelProps,
  StackedMeterTrackProps,
  StackedMeterTrackBackgroundProps,
  StackedMeterSegmentProps,
  StackedMeterLegendProps,
  StackedMeterLegendItemProps,
  StackedMeterLegendIndicatorProps,
  StackedMeterLegendLabelProps,
  StackedMeterLegendValueProps,
  StackedMeterColor,
};
