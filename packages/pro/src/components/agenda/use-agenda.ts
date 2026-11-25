"use client";

import type {CalendarDate, CalendarDateTime} from "./agenda-date";
import type {
  AgendaDayOfWeek,
  AgendaEvent,
  AgendaMonthRowLayout,
  AgendaSpanLayout,
  AgendaTimedLayout,
  AgendaView,
} from "./agenda-utils";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useLocale} from "react-aria-components/I18nProvider";

import {
  createDate,
  dateFromDayNumber,
  daysInMonth,
  getLocalTimeZone,
  getZonedNow,
  toDayNumber,
  toMinuteStamp,
} from "./agenda-date";
import {
  DAY_OF_WEEK_INDEX,
  getAllDayRange,
  getLocaleFirstDayOfWeek,
  getLocaleHourCycle,
  getTimedRange,
  isMultiDayAllDay,
  layoutTimedEvents,
  packDayRanges,
  startOfWeek,
} from "./agenda-utils";

/* -------------------------------------------------------------------------------------------------
 * Options
 * -----------------------------------------------------------------------------------------------*/
export interface UseAgendaOptions {
  /** The events to display. */
  events: AgendaEvent[];
  /** The initial view (uncontrolled). @default "week" */
  defaultView?: AgendaView;
  /** The current view (controlled). */
  view?: AgendaView;
  /** Called when the view changes. */
  onViewChange?: (view: AgendaView) => void;
  /** The initially focused date (uncontrolled). @default today */
  defaultDate?: CalendarDate;
  /** The focused date (controlled). */
  date?: CalendarDate;
  /** Called when the focused date changes. */
  onDateChange?: (date: CalendarDate) => void;
  /** First hour of the time grid. @default 0 */
  startHour?: number;
  /** Last hour (exclusive) of the time grid. @default 24 */
  endHour?: number;
  /** Minutes per time slot (one grid row). @default 60 */
  slotDuration?: number;
  /** Enables click / drag / Enter to create an event. */
  onEventCreate?: (event: {start: CalendarDateTime; end: CalendarDateTime}) => void;
  /** Enables Delete / Backspace on the selected event. */
  onEventDelete?: (id: string) => void;
  /** Enables moving events (drag, arrow keys). */
  onEventMove?: (id: string, start: CalendarDateTime, end: CalendarDateTime) => void;
  /** Enables resizing timed events (bottom handle, Shift + arrow keys). */
  onEventResize?: (id: string, start: CalendarDateTime, end: CalendarDateTime) => void;
  /** Called when the selected event changes. */
  onEventSelect?: (id: string | null) => void;
  /** The selected event (controlled). */
  selectedEventId?: string | null;
  /** Number of days shown by the week view. @default 7 */
  weekDays?: number;
  /** Enables horizontal swipe (touch / trackpad) in the day and week views. @default false */
  allowsSwipe?: boolean;
  /** Time zone used for today, the current time and past events. @default local */
  timeZone?: string;
  /** First day of the week views and month grid. @default locale */
  firstDayOfWeek?: AgendaDayOfWeek;
  /** 12 or 24 hour clock. @default locale */
  hourCycle?: 12 | 24;
  /** Snap interval in minutes for drag, resize and arrow keys. @default 5 */
  snapMinutes?: number;
  /** Duration in minutes of an event created by click or Enter. @default 60 */
  defaultEventDuration?: number;
}

/* -------------------------------------------------------------------------------------------------
 * State
 * -----------------------------------------------------------------------------------------------*/
export interface AgendaState {
  /** All events. */
  events: AgendaEvent[];
  /** Current view. */
  view: AgendaView;
  /** Changes the view. */
  setView: (view: AgendaView) => void;
  /** Focused date. */
  date: CalendarDate;
  /** Changes the focused date. */
  setDate: (date: CalendarDate) => void;
  /** Today in `timeZone`. */
  today: CalendarDate;
  /** Days on screen (day / week views) or every cell of the month grid. */
  visibleDays: CalendarDate[];
  /** `visibleDays` plus the extra days rendered on each side for swiping. */
  renderedDays: CalendarDate[];
  /** Moves the first visible day (used by swipe snapping). */
  setVisibleStart: (day: CalendarDate) => void;
  /** The 6 weeks (7 days each) of the month grid. */
  visibleWeeks: CalendarDate[][];
  /** Timed events that start on `day`. */
  getEventsForDay: (day: CalendarDate) => AgendaEvent[];
  /** All-day events packed over `renderedDays`. */
  allDayLayout: AgendaSpanLayout[];
  /** Multi-day bars of a month row. */
  getMonthRowLayout: (week: CalendarDate[]) => AgendaMonthRowLayout;
  /** Events listed inside a month cell (single-day all-day events first, then timed events). */
  getPerCellEvents: (day: CalendarDate, week?: CalendarDate[]) => AgendaEvent[];
  /** Previous day / week / month. */
  goToPrevious: () => void;
  /** Next day / week / month. */
  goToNext: () => void;
  /** Back to today. */
  goToToday: () => void;
  /** Selected event id. */
  selectedEventId: string | null;
  /** Selects an event (or clears the selection with `null`). */
  selectEvent: (id: string | null) => void;

  /* Configuration read by the parts ------------------------------------------------------------ */
  startHour: number;
  endHour: number;
  slotDuration: number;
  snapMinutes: number;
  defaultEventDuration: number;
  weekDays: number;
  allowsSwipe: boolean;
  timeZone: string;
  hourCycle: 12 | 24;
  firstDayOfWeek: number;
  locale: string;
  onEventCreate?: UseAgendaOptions["onEventCreate"];
  onEventDelete?: UseAgendaOptions["onEventDelete"];
  onEventMove?: UseAgendaOptions["onEventMove"];
  onEventResize?: UseAgendaOptions["onEventResize"];

  /* Internal ----------------------------------------------------------------------------------- */
  /** Current wall-clock time in `timeZone` as a minute stamp (day number * 1440 + minutes). */
  nowStamp: number;
  /** Index of the first visible day inside `renderedDays`. */
  visibleStartIndex: number;
  /** Side-by-side placement of a timed event inside its day column. */
  getTimedLayout: (event: AgendaEvent) => AgendaTimedLayout | undefined;
  /** Last navigation (drives the slide animation of the day tracks). */
  navigation: {count: number; delta: number};
  /** A template date-time used to create values of the caller's class. */
  dateTimeTemplate: CalendarDateTime | null;
}

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
function useControllableState<T>(
  value: T | undefined,
  defaultValue: () => T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue];
}

/** Ticks once per minute (aligned to the minute boundary). */
function useNowStamp(timeZone: string): number {
  const read = useCallback(() => {
    return toMinuteStamp(getZonedNow(timeZone));
  }, [timeZone]);
  const [stamp, setStamp] = useState(read);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-syncs with the wall clock (external) after hydration and when the time zone changes; the timers below keep it ticking.
    setStamp(read());
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        setStamp(read());
        interval = setInterval(() => setStamp(read()), 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [read]);

  return stamp;
}

const SWIPE_OVERSCAN_DAY_VIEW = 3;
const MONTH_GRID_WEEKS = 6;

/* -------------------------------------------------------------------------------------------------
 * useAgenda
 * -----------------------------------------------------------------------------------------------*/
export function useAgenda(options: UseAgendaOptions): AgendaState {
  const {
    allowsSwipe = false,
    date: dateProp,
    defaultDate,
    defaultEventDuration = 60,
    defaultView = "week",
    endHour = 24,
    events,
    firstDayOfWeek: firstDayOfWeekProp,
    hourCycle: hourCycleProp,
    onDateChange,
    onEventCreate,
    onEventDelete,
    onEventMove,
    onEventResize,
    onEventSelect,
    onViewChange,
    selectedEventId: selectedEventIdProp,
    slotDuration = 60,
    snapMinutes = 5,
    startHour = 0,
    timeZone = getLocalTimeZone(),
    view: viewProp,
    weekDays = 7,
  } = options;

  const {locale} = useLocale();
  const firstDayOfWeek = useMemo(
    () =>
      firstDayOfWeekProp === undefined
        ? getLocaleFirstDayOfWeek(locale)
        : DAY_OF_WEEK_INDEX[firstDayOfWeekProp],
    [firstDayOfWeekProp, locale],
  );
  const hourCycle = hourCycleProp ?? getLocaleHourCycle(locale);

  const nowStamp = useNowStamp(timeZone);
  const todayNumber = Math.floor(nowStamp / 1440);

  const [view, setViewState] = useControllableState(viewProp, () => defaultView, onViewChange);
  const [date, setDateState] = useControllableState<CalendarDate>(
    dateProp,
    () => defaultDate ?? dateFromDayNumber(todayNumber),
    onDateChange,
  );
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selectedEventId =
    selectedEventIdProp === undefined ? internalSelected : selectedEventIdProp;

  /** First visible day chosen by swipe snapping (overrides the computed start). */
  const [customStart, setCustomStart] = useState<number | null>(null);
  const [navigation, setNavigation] = useState({count: 0, delta: 0});

  const dateNumber = toDayNumber(date);
  const dayCount = view === "day" ? 1 : Math.max(1, Math.round(weekDays));

  /* Visible range ------------------------------------------------------------------------------ */
  const getDefaultStart = (dayNumber: number) =>
    view === "day"
      ? dayNumber
      : dayCount === 7
        ? startOfWeek(dayNumber, firstDayOfWeek)
        : dayNumber - Math.floor((dayCount - 1) / 2);
  const defaultStart = getDefaultStart(dateNumber);
  const visibleStart =
    view !== "month" &&
    customStart !== null &&
    dateNumber >= customStart &&
    dateNumber < customStart + dayCount
      ? customStart
      : defaultStart;
  const overscan =
    allowsSwipe && view !== "month" ? (view === "day" ? SWIPE_OVERSCAN_DAY_VIEW : dayCount) : 0;

  const visibleWeekStarts = useMemo(() => {
    const first = toDayNumber({day: 1, month: date.month, year: date.year});
    const gridStart = startOfWeek(first, firstDayOfWeek);

    return Array.from({length: MONTH_GRID_WEEKS}, (_, week) => gridStart + week * 7);
  }, [date.month, date.year, firstDayOfWeek]);

  const visibleWeeks = useMemo(
    () =>
      visibleWeekStarts.map((weekStart) =>
        Array.from({length: 7}, (_, index) => dateFromDayNumber(weekStart + index, date)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `date` is only the class/calendar template of the new days; depending on it would rebuild the grid (new identity) on every focused-date change.
    [visibleWeekStarts],
  );

  const visibleDays = useMemo(() => {
    if (view === "month") return visibleWeeks.flat();

    return Array.from({length: dayCount}, (_, index) =>
      dateFromDayNumber(visibleStart + index, date),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `date` is only the class/calendar template of the new days (same as `visibleWeeks`); the visible range keys the memo.
  }, [view, visibleWeeks, dayCount, visibleStart]);

  const renderedDays = useMemo(() => {
    if (view === "month" || overscan === 0) return visibleDays;

    return Array.from({length: dayCount + overscan * 2}, (_, index) =>
      dateFromDayNumber(visibleStart - overscan + index, date),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `date` is only the class/calendar template of the new days (same as `visibleWeeks`); the rendered range keys the memo.
  }, [view, overscan, visibleDays, dayCount, visibleStart]);

  /* Events ------------------------------------------------------------------------------------- */
  const timedByDay = useMemo(() => {
    const map = new Map<number, AgendaEvent[]>();

    for (const event of events) {
      if (event.isAllDay) continue;
      const day = toDayNumber(event.start);
      const list = map.get(day);

      if (list) list.push(event);
      else map.set(day, [event]);
    }

    return map;
  }, [events]);

  const timedLayout = useMemo(() => {
    const result = new Map<string, AgendaTimedLayout>();

    for (const dayEvents of timedByDay.values()) {
      for (const [id, layout] of layoutTimedEvents(dayEvents, snapMinutes)) {
        result.set(id, layout);
      }
    }

    return result;
  }, [timedByDay, snapMinutes]);

  const getEventsForDay = useCallback(
    (day: CalendarDate) => timedByDay.get(toDayNumber(day)) ?? [],
    [timedByDay],
  );

  const getTimedLayout = useCallback(
    (event: AgendaEvent) => timedLayout.get(event.id),
    [timedLayout],
  );

  const allDayEvents = useMemo(() => events.filter((event) => event.isAllDay), [events]);
  const renderedStart = renderedDays.length ? toDayNumber(renderedDays[0]!) : visibleStart;
  const renderedEnd = renderedStart + renderedDays.length - 1;

  const allDayLayout = useMemo(
    () => packDayRanges(allDayEvents, renderedStart, renderedEnd),
    [allDayEvents, renderedStart, renderedEnd],
  );

  const spanningEvents = useMemo(() => allDayEvents.filter(isMultiDayAllDay), [allDayEvents]);

  const getMonthRowLayout = useCallback(
    (week: CalendarDate[]): AgendaMonthRowLayout => {
      const weekStart = toDayNumber(week[0]!);
      const layout = packDayRanges(spanningEvents, weekStart, weekStart + 6);
      const cellRowCounts = Array.from({length: 7}, () => 0);

      for (const item of layout) {
        for (let col = item.colStart; col < item.colStart + item.colSpan; col++) {
          cellRowCounts[col] = Math.max(cellRowCounts[col]!, item.row + 1);
        }
      }

      return {
        cellRowCounts,
        rowCount: layout.reduce((max, item) => Math.max(max, item.row + 1), 0),
        spanningEvents: layout,
      };
    },
    [spanningEvents],
  );

  const getPerCellEvents = useCallback(
    (day: CalendarDate) => {
      const dayNumber = toDayNumber(day);
      const allDay = allDayEvents.filter((event) => {
        if (isMultiDayAllDay(event)) return false;

        return getAllDayRange(event).first === dayNumber;
      });
      const timed = [...(timedByDay.get(dayNumber) ?? [])]
        .map((event, index) => ({event, index, start: getTimedRange(event).start}))
        .sort((a, b) => a.start - b.start || a.index - b.index)
        .map((item) => item.event);

      return [...allDay, ...timed];
    },
    [allDayEvents, timedByDay],
  );

  /* Actions ------------------------------------------------------------------------------------ */
  const setView = useCallback(
    (next: AgendaView) => {
      setCustomStart(null);
      setViewState(next);
    },
    [setViewState],
  );

  const setDate = useCallback(
    (next: CalendarDate) => {
      setCustomStart(null);
      setDateState(next);
    },
    [setDateState],
  );

  const navigate = useCallback(
    (direction: 1 | -1) => {
      if (view === "month") {
        const index = date.year * 12 + (date.month - 1) + direction;
        const year = Math.floor(index / 12);
        const month = index - year * 12 + 1;

        setCustomStart(null);
        setDateState(createDate(year, month, Math.min(date.day, daysInMonth(year, month)), date));

        return;
      }
      const step = dayCount * direction;

      if (customStart !== null && visibleStart === customStart) setCustomStart(customStart + step);
      setNavigation((current) => ({count: current.count + 1, delta: step}));
      setDateState(dateFromDayNumber(dateNumber + step, date));
    },
    [view, date, dateNumber, dayCount, customStart, visibleStart, setDateState],
  );

  const goToPrevious = useCallback(() => navigate(-1), [navigate]);
  const goToNext = useCallback(() => navigate(1), [navigate]);

  const todayStart = getDefaultStart(todayNumber);
  const goToToday = useCallback(() => {
    const delta = todayStart - visibleStart;

    setCustomStart(null);
    if (view !== "month" && delta !== 0) {
      setNavigation((current) => ({
        count: current.count + 1,
        delta: Math.abs(delta) <= dayCount ? delta : Math.sign(delta) * dayCount,
      }));
    }
    setDateState(dateFromDayNumber(todayNumber, date));
  }, [todayStart, todayNumber, visibleStart, view, dayCount, date, setDateState]);

  const setVisibleStart = useCallback(
    (day: CalendarDate) => {
      const start = toDayNumber(day);
      const offset = Math.min(Math.max(dateNumber - visibleStart, 0), dayCount - 1);

      setCustomStart(start);
      setDateState(dateFromDayNumber(start + offset, date));
    },
    [dateNumber, visibleStart, dayCount, date, setDateState],
  );

  const selectEvent = useCallback(
    (id: string | null) => {
      if (selectedEventIdProp === undefined) setInternalSelected(id);
      onEventSelect?.(id);
    },
    [selectedEventIdProp, onEventSelect],
  );

  /* Template for created date-times ----------------------------------------------------------- */
  const dateTimeTemplate = useMemo(
    () => events.find((event) => !event.isAllDay)?.start ?? events[0]?.start ?? null,
    [events],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `date` is only the class/calendar template; `today` must keep its identity until the day changes.
  const today = useMemo(() => dateFromDayNumber(todayNumber, date), [todayNumber]);

  return {
    allDayLayout,
    allowsSwipe,
    date,
    dateTimeTemplate,
    defaultEventDuration,
    endHour,
    events,
    firstDayOfWeek,
    getEventsForDay,
    getMonthRowLayout,
    getPerCellEvents,
    getTimedLayout,
    goToNext,
    goToPrevious,
    goToToday,
    hourCycle,
    locale,
    navigation,
    nowStamp,
    onEventCreate,
    onEventDelete,
    onEventMove,
    onEventResize,
    renderedDays,
    selectEvent,
    selectedEventId,
    setDate,
    setView,
    setVisibleStart,
    slotDuration,
    snapMinutes,
    startHour,
    timeZone,
    today,
    view,
    visibleDays,
    visibleStartIndex: view === "month" ? 0 : overscan,
    visibleWeeks,
    weekDays: dayCount,
  };
}

/** Every key of `AgendaState`, used by the root to split state from DOM props. */
export const AGENDA_STATE_KEYS = [
  "allDayLayout",
  "allowsSwipe",
  "date",
  "dateTimeTemplate",
  "defaultEventDuration",
  "endHour",
  "events",
  "firstDayOfWeek",
  "getEventsForDay",
  "getMonthRowLayout",
  "getPerCellEvents",
  "getTimedLayout",
  "goToNext",
  "goToPrevious",
  "goToToday",
  "hourCycle",
  "locale",
  "navigation",
  "nowStamp",
  "onEventCreate",
  "onEventDelete",
  "onEventMove",
  "onEventResize",
  "renderedDays",
  "selectEvent",
  "selectedEventId",
  "setDate",
  "setView",
  "setVisibleStart",
  "slotDuration",
  "snapMinutes",
  "startHour",
  "timeZone",
  "today",
  "view",
  "visibleDays",
  "visibleStartIndex",
  "visibleWeeks",
  "weekDays",
] as const satisfies ReadonlyArray<keyof AgendaState>;

// Compile-time check that the list above covers every key of AgendaState.
type MissingStateKeys = Exclude<keyof AgendaState, (typeof AGENDA_STATE_KEYS)[number]>;
const _exhaustive: MissingStateKeys extends never ? true : MissingStateKeys = true;

void _exhaustive;
