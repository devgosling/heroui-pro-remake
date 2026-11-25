"use client";

import type {
  TimelineAlign,
  TimelineAxis,
  TimelineDensity,
  TimelineItemState,
  TimelinePlacement,
  TimelineSide,
  TimelineSize,
  TimelineStatus,
} from "./timeline-context";
import type {ComponentPropsWithRef, ReactElement, ReactNode} from "react";

import {Children, Fragment, isValidElement, use, useMemo} from "react";

import {TimelineContext, TimelineItemContext, TimelinePositionContext} from "./timeline-context";
import {timelineItemVariants, timelineVariants} from "./timeline.styles";

/* -------------------------------------------------------------------------------------------------
 * Timeline Root
 * -----------------------------------------------------------------------------------------------*/
interface TimelineRootProps extends ComponentPropsWithRef<"ol"> {
  /** Position of the timeline rail. */
  axis?: TimelineAxis;
  /** Default side for item content; `alternate` alternates by item index. */
  placement?: TimelinePlacement;
  /** Marker and text size. */
  size?: TimelineSize;
  /** Vertical rhythm between events. */
  density?: TimelineDensity;
  /** Default vertical alignment for item content. */
  itemAlign?: TimelineAlign;
  /** Timeline items. */
  children?: ReactNode;
}

/**
 * Element children of the list, with fragments flattened so items rendered as
 * `<>{events.map(...)}</>` still get their own index. Keys are prefixed with the fragment key to stay
 * unique across fragments.
 */
const collectItems = (children: ReactNode, prefix = ""): Array<{key: string; node: ReactElement}> =>
  Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];

    const key = `${prefix}${String(child.key)}`;

    if (child.type === Fragment) {
      return collectItems((child.props as {children?: ReactNode}).children, `${key}/`);
    }

    return [{key, node: child}];
  });

const TimelineRoot = ({
  axis = "start",
  children,
  className,
  density = "comfortable",
  itemAlign = "start",
  placement = "end",
  size = "md",
  ...rest
}: TimelineRootProps) => {
  const slots = useMemo(() => timelineVariants({axis, density, size}), [axis, density, size]);
  const contextValue = useMemo<TimelineContext>(
    () => ({axis, itemAlign, placement, size, slots}),
    [axis, itemAlign, placement, size, slots],
  );

  // Every element child is an event row; each one learns its index and whether it is the last.
  const items = collectItems(children);

  return (
    <TimelineContext value={contextValue}>
      <ol
        className={slots.base({className})}
        data-axis={axis}
        data-placement={placement}
        data-slot="timeline"
        {...rest}
      >
        {items.map(({key, node}, index) => (
          <TimelinePositionContext key={key} value={{index, isLast: index === items.length - 1}}>
            {node}
          </TimelinePositionContext>
        ))}
      </ol>
    </TimelineContext>
  );
};

TimelineRoot.displayName = "HeroUI.Timeline";

/* -------------------------------------------------------------------------------------------------
 * Timeline Marker
 * -----------------------------------------------------------------------------------------------*/
interface TimelineMarkerProps extends ComponentPropsWithRef<"span"> {
  /** Marker tone override (defaults to the item status). */
  status?: TimelineStatus;
  /** Custom marker content (icon, avatar, number...). */
  children?: ReactNode;
}

/** Markers are decorative unless they carry their own text (e.g. a step number). */
const hasTextContent = (children: ReactNode) =>
  Children.toArray(children).some(
    (child) => typeof child === "string" || typeof child === "number",
  );

const TimelineMarker = ({children, className, status, ...rest}: TimelineMarkerProps) => {
  const {slots} = use(TimelineContext);
  const item = use(TimelineItemContext);
  const resolvedStatus = status ?? item?.status ?? "default";

  return (
    <span
      aria-hidden={hasTextContent(children) ? undefined : "true"}
      className={slots.marker({className})}
      data-slot="timeline-marker"
      data-status={resolvedStatus}
      {...rest}
    >
      {children}
    </span>
  );
};

TimelineMarker.displayName = "HeroUI.Timeline.Marker";

/* -------------------------------------------------------------------------------------------------
 * Timeline Connector
 * -----------------------------------------------------------------------------------------------*/
interface TimelineConnectorProps extends ComponentPropsWithRef<"span"> {
  /** Force rendering even on the last item. */
  force?: boolean;
}

const TimelineConnector = ({className, force = false, ...rest}: TimelineConnectorProps) => {
  const {slots} = use(TimelineContext);
  const item = use(TimelineItemContext);

  if (item?.isLast && !force) return null;

  return (
    <span
      aria-hidden="true"
      className={slots.connector({className})}
      data-force={force ? "true" : undefined}
      data-slot="timeline-connector"
      {...rest}
    />
  );
};

TimelineConnector.displayName = "HeroUI.Timeline.Connector";

/* -------------------------------------------------------------------------------------------------
 * Timeline Rail
 * -----------------------------------------------------------------------------------------------*/
interface TimelineRailProps extends ComponentPropsWithRef<"span"> {
  /** Marker and connector content. Defaults to a marker followed by a connector. */
  children?: ReactNode;
}

const TimelineRail = ({children, className, ...rest}: TimelineRailProps) => {
  const {slots} = use(TimelineContext);

  return (
    <span className={slots.rail({className})} data-slot="timeline-rail" {...rest}>
      {children ?? (
        <>
          <TimelineMarker />
          <TimelineConnector />
        </>
      )}
    </span>
  );
};

TimelineRail.displayName = "HeroUI.Timeline.Rail";

/* -------------------------------------------------------------------------------------------------
 * Timeline Item
 * -----------------------------------------------------------------------------------------------*/
interface TimelineItemProps extends ComponentPropsWithRef<"li"> {
  /** Marker tone. `current` also sets `aria-current="true"`. */
  status?: TimelineStatus;
  /** Vertical alignment for item content (defaults to the root `itemAlign`). */
  align?: TimelineAlign;
  /** Content side for centered timelines (defaults to the root `placement`). */
  side?: TimelineSide;
  /** Item parts. */
  children?: ReactNode;
}

const isRailElement = (node: ReactNode): node is ReactElement =>
  isValidElement(node) && node.type === TimelineRail;

const TimelineItem = ({
  align,
  children,
  className,
  side,
  status = "default",
  ...rest
}: TimelineItemProps) => {
  const {itemAlign, placement} = use(TimelineContext);
  const {index, isLast} = use(TimelinePositionContext);

  const resolvedAlign = align ?? itemAlign;
  const resolvedSide: TimelineSide =
    side ?? (placement === "alternate" ? (index % 2 === 0 ? "end" : "start") : placement);

  const itemState = useMemo<TimelineItemState>(
    () => ({align: resolvedAlign, index, isLast, side: resolvedSide, status}),
    [resolvedAlign, index, isLast, resolvedSide, status],
  );

  // The rail is rendered after the content so assistive technology reads the event first; an item
  // without an explicit rail gets the default one (marker + connector).
  const nodes = Children.toArray(children);
  const rails = nodes.filter(isRailElement);
  const content = nodes.filter((node) => !isRailElement(node));

  return (
    <TimelineItemContext value={itemState}>
      <li
        aria-current={status === "current" ? "true" : undefined}
        className={timelineItemVariants({align: resolvedAlign, className})}
        data-align={resolvedAlign}
        data-index={index}
        data-last={isLast ? "true" : undefined}
        data-side={resolvedSide}
        data-slot="timeline-item"
        data-status={status}
        {...rest}
      >
        {content}
        {rails.length > 0 ? rails : <TimelineRail />}
      </li>
    </TimelineItemContext>
  );
};

TimelineItem.displayName = "HeroUI.Timeline.Item";

/* -------------------------------------------------------------------------------------------------
 * Timeline Content
 * -----------------------------------------------------------------------------------------------*/
interface TimelineContentProps extends ComponentPropsWithRef<"div"> {
  /** Content side in centered timelines (defaults to the item side). */
  side?: TimelineSide;
  /** Content parts. */
  children?: ReactNode;
}

const TimelineContent = ({className, side, ...rest}: TimelineContentProps) => {
  const {slots} = use(TimelineContext);
  const item = use(TimelineItemContext);

  return (
    <div
      className={slots.content({className})}
      data-side={side ?? item?.side ?? "end"}
      data-slot="timeline-content"
      {...rest}
    />
  );
};

TimelineContent.displayName = "HeroUI.Timeline.Content";

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  TimelineRoot,
  TimelineItem,
  TimelineRail,
  TimelineMarker,
  TimelineConnector,
  TimelineContent,
};

export type {
  TimelineRootProps,
  TimelineItemProps,
  TimelineRailProps,
  TimelineMarkerProps,
  TimelineConnectorProps,
  TimelineContentProps,
  TimelineItemState,
  TimelineAxis,
  TimelinePlacement,
  TimelineSize,
  TimelineDensity,
  TimelineAlign,
  TimelineSide,
  TimelineStatus,
};
