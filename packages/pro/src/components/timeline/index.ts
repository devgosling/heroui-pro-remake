import type {ComponentProps} from "react";

import {
  TimelineConnector,
  TimelineContent,
  TimelineItem,
  TimelineMarker,
  TimelineRail,
  TimelineRoot,
} from "./timeline";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Timeline = Object.assign(TimelineRoot, {
  Connector: TimelineConnector,
  Content: TimelineContent,
  Item: TimelineItem,
  Marker: TimelineMarker,
  Rail: TimelineRail,
  Root: TimelineRoot,
});

export type Timeline = {
  Props: ComponentProps<typeof TimelineRoot>;
  RootProps: ComponentProps<typeof TimelineRoot>;
  ItemProps: ComponentProps<typeof TimelineItem>;
  RailProps: ComponentProps<typeof TimelineRail>;
  MarkerProps: ComponentProps<typeof TimelineMarker>;
  ConnectorProps: ComponentProps<typeof TimelineConnector>;
  ContentProps: ComponentProps<typeof TimelineContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  TimelineRoot,
  TimelineItem,
  TimelineRail,
  TimelineMarker,
  TimelineConnector,
  TimelineContent,
} from "./timeline";

export {TimelineContext, TimelineItemContext, useTimelineItem} from "./timeline-context";

export type {
  TimelineRootProps,
  TimelineRootProps as TimelineProps,
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
} from "./timeline";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {
  timelineVariants,
  timelineItemVariants,
  type TimelineVariants,
  type TimelineItemVariants,
} from "./timeline.styles";
