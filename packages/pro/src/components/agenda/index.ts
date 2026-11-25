import type {AgendaEvent as AgendaEventData} from "./agenda-utils";
import type {ComponentProps} from "react";

import {
  AgendaAllDayEvent,
  AgendaAllDayLabel,
  AgendaAllDaySection,
  AgendaBody,
  AgendaCurrentTimeIndicator,
  AgendaDayColumn,
  AgendaDayColumns,
  AgendaEvent as AgendaEventPart,
  AgendaHeader,
  AgendaHeading,
  AgendaMonthCell,
  AgendaMonthEvent,
  AgendaMonthGrid,
  AgendaMonthRow,
  AgendaMonthSpanningEvent,
  AgendaNavButton,
  AgendaNavigation,
  AgendaRoot,
  AgendaTimeGrid,
  AgendaTodayButton,
  AgendaViewSelector,
  AgendaWeekHeader,
} from "./agenda";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Agenda = Object.assign(AgendaRoot, {
  AllDayEvent: AgendaAllDayEvent,
  AllDayLabel: AgendaAllDayLabel,
  AllDaySection: AgendaAllDaySection,
  Body: AgendaBody,
  CurrentTimeIndicator: AgendaCurrentTimeIndicator,
  DayColumn: AgendaDayColumn,
  DayColumns: AgendaDayColumns,
  Event: AgendaEventPart,
  Header: AgendaHeader,
  Heading: AgendaHeading,
  MonthCell: AgendaMonthCell,
  MonthEvent: AgendaMonthEvent,
  MonthGrid: AgendaMonthGrid,
  MonthRow: AgendaMonthRow,
  MonthSpanningEvent: AgendaMonthSpanningEvent,
  NavButton: AgendaNavButton,
  Navigation: AgendaNavigation,
  Root: AgendaRoot,
  TimeGrid: AgendaTimeGrid,
  TodayButton: AgendaTodayButton,
  ViewSelector: AgendaViewSelector,
  WeekHeader: AgendaWeekHeader,
});

export type Agenda = {
  Props: ComponentProps<typeof AgendaRoot>;
  RootProps: ComponentProps<typeof AgendaRoot>;
  HeaderProps: ComponentProps<typeof AgendaHeader>;
  HeadingProps: ComponentProps<typeof AgendaHeading>;
  ViewSelectorProps: ComponentProps<typeof AgendaViewSelector>;
  NavigationProps: ComponentProps<typeof AgendaNavigation>;
  NavButtonProps: ComponentProps<typeof AgendaNavButton>;
  TodayButtonProps: ComponentProps<typeof AgendaTodayButton>;
  BodyProps: ComponentProps<typeof AgendaBody>;
  WeekHeaderProps: ComponentProps<typeof AgendaWeekHeader>;
  AllDaySectionProps: ComponentProps<typeof AgendaAllDaySection>;
  AllDayLabelProps: ComponentProps<typeof AgendaAllDayLabel>;
  AllDayEventProps: ComponentProps<typeof AgendaAllDayEvent>;
  TimeGridProps: ComponentProps<typeof AgendaTimeGrid>;
  CurrentTimeIndicatorProps: ComponentProps<typeof AgendaCurrentTimeIndicator>;
  DayColumnsProps: ComponentProps<typeof AgendaDayColumns>;
  DayColumnProps: ComponentProps<typeof AgendaDayColumn>;
  EventProps: ComponentProps<typeof AgendaEventPart>;
  MonthGridProps: ComponentProps<typeof AgendaMonthGrid>;
  MonthRowProps: ComponentProps<typeof AgendaMonthRow>;
  MonthCellProps: ComponentProps<typeof AgendaMonthCell>;
  MonthSpanningEventProps: ComponentProps<typeof AgendaMonthSpanningEvent>;
  MonthEventProps: ComponentProps<typeof AgendaMonthEvent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Components
 * -----------------------------------------------------------------------------------------------*/
export {
  AgendaRoot,
  AgendaHeader,
  AgendaHeading,
  AgendaViewSelector,
  AgendaNavigation,
  AgendaNavButton,
  AgendaTodayButton,
  AgendaBody,
  AgendaWeekHeader,
  AgendaAllDaySection,
  AgendaAllDayLabel,
  AgendaAllDayEvent,
  AgendaTimeGrid,
  AgendaCurrentTimeIndicator,
  AgendaDayColumns,
  AgendaDayColumn,
  AgendaMonthGrid,
  AgendaMonthRow,
  AgendaMonthCell,
  AgendaMonthSpanningEvent,
  AgendaMonthEvent,
} from "./agenda";

/**
 * `AgendaEvent` is both the timed event part (value, same as `Agenda.Event`) and the event data
 * type (`{id, title, start, end, ...}`), as in the documented API.
 */
export const AgendaEvent = AgendaEventPart;
export type AgendaEvent = AgendaEventData;

export type {
  AgendaRootProps,
  AgendaRootProps as AgendaProps,
  AgendaHeaderProps,
  AgendaHeadingProps,
  AgendaViewSelectorProps,
  AgendaNavigationProps,
  AgendaNavButtonProps,
  AgendaTodayButtonProps,
  AgendaBodyProps,
  AgendaWeekHeaderProps,
  AgendaAllDaySectionProps,
  AgendaAllDayLabelProps,
  AgendaAllDayEventProps,
  AgendaTimeGridProps,
  AgendaCurrentTimeIndicatorProps,
  AgendaDayColumnsProps,
  AgendaDayColumnProps,
  AgendaEventProps,
  AgendaMonthGridProps,
  AgendaMonthRowProps,
  AgendaMonthCellProps,
  AgendaMonthSpanningEventProps,
  AgendaMonthEventProps,
} from "./agenda";

/* -------------------------------------------------------------------------------------------------
 * Hook, types & date helpers
 * -----------------------------------------------------------------------------------------------*/
export {useAgenda} from "./use-agenda";
export type {AgendaState, UseAgendaOptions} from "./use-agenda";

export type {AgendaEventData};

export type {
  AgendaDayOfWeek,
  AgendaEventStatus,
  AgendaMonthRowLayout,
  AgendaSpanLayout,
  AgendaSpanLayout as AgendaAllDayLayoutItem,
  AgendaTimedLayout,
  AgendaView,
} from "./agenda-utils";

export type {CalendarDate, CalendarDateTime} from "./agenda-date";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {agendaVariants, type AgendaVariants} from "./agenda.styles";
