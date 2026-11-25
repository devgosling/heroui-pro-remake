"use client";

import {createContext, use} from "react";

import {timelineVariants} from "./timeline.styles";

/* -------------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/
type TimelineAxis = "start" | "center";
type TimelinePlacement = "start" | "end" | "alternate";
type TimelineSize = "sm" | "md" | "lg";
type TimelineDensity = "compact" | "comfortable";
type TimelineAlign = "start" | "center";
type TimelineSide = "start" | "end";
type TimelineStatus = "default" | "current" | "success" | "warning" | "danger" | "muted";

/** Per-item state exposed by `useTimelineItem`. */
interface TimelineItemState {
  /** Resolved item content alignment. */
  align: TimelineAlign;
  /** Zero-based item index. */
  index: number;
  /** Whether this is the final timeline item. */
  isLast: boolean;
  /** Resolved item side. */
  side: TimelineSide;
  /** Item marker status. */
  status: TimelineStatus;
}

/* -------------------------------------------------------------------------------------------------
 * Contexts
 * -----------------------------------------------------------------------------------------------*/
type TimelineContext = {
  axis: TimelineAxis;
  itemAlign: TimelineAlign;
  placement: TimelinePlacement;
  size: TimelineSize;
  slots: ReturnType<typeof timelineVariants>;
};

const TimelineContext = createContext<TimelineContext>({
  axis: "start",
  itemAlign: "start",
  placement: "end",
  size: "md",
  slots: timelineVariants(),
});

/** Position of an item inside the root list (provided by the root for every child). */
type TimelinePositionContext = {index: number; isLast: boolean};

const TimelinePositionContext = createContext<TimelinePositionContext>({index: 0, isLast: false});

const TimelineItemContext = createContext<TimelineItemState | null>(null);

/* -------------------------------------------------------------------------------------------------
 * useTimelineItem
 * -----------------------------------------------------------------------------------------------*/
function useTimelineItem(): TimelineItemState {
  const context = use(TimelineItemContext);

  if (!context) {
    throw new Error("useTimelineItem must be used within a <Timeline.Item> component.");
  }

  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TimelineContext, TimelinePositionContext, TimelineItemContext, useTimelineItem};

export type {
  TimelineItemState,
  TimelineAxis,
  TimelinePlacement,
  TimelineSize,
  TimelineDensity,
  TimelineAlign,
  TimelineSide,
  TimelineStatus,
};
