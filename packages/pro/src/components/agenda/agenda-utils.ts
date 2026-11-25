import type {AgendaDateFields, CalendarDateTime} from "./agenda-date";

import {dayOfWeek, toDayNumber, toJSDate, toMinuteOfDay} from "./agenda-date";

/* -------------------------------------------------------------------------------------------------
 * Public types
 * -----------------------------------------------------------------------------------------------*/
export type AgendaView = "day" | "week" | "month";

export type AgendaEventStatus = "confirmed" | "unconfirmed" | "declined";

export type AgendaDayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface AgendaEvent {
  /** Unique id of the event. */
  id: string;
  /** Title shown in the event block. */
  title: string;
  /** Start (wall-clock, `CalendarDateTime`). */
  start: CalendarDateTime;
  /** End (wall-clock, `CalendarDateTime`). */
  end: CalendarDateTime;
  /** Any CSS color. Tints the event (15% fill + solid accent). Defaults to the accent color. */
  color?: string;
  /** Renders the event in the all-day section / as a month bar. */
  isAllDay?: boolean;
  /** Read-only events can be selected but not moved, resized or deleted. */
  isReadOnly?: boolean;
  /** `unconfirmed` draws a dashed outline, `declined` an outline with a struck-through title. */
  status?: AgendaEventStatus;
}

/** Placement of an all-day / multi-day event on a row of day columns. */
export interface AgendaSpanLayout {
  event: AgendaEvent;
  /** 0-based column of the first covered day. */
  colStart: number;
  /** Number of covered columns. */
  colSpan: number;
  /** 0-based packing row. */
  row: number;
}

export interface AgendaMonthRowLayout {
  /** Multi-day all-day events drawn as bars across the row. */
  spanningEvents: AgendaSpanLayout[];
  /** Number of packing rows used by the bars. */
  rowCount: number;
  /** Number of bar rows covering each of the 7 cells (pass to `MonthCell spanningRowCount`). */
  cellRowCounts: number[];
}

/** Side-by-side placement of overlapping timed events inside one day column. */
export interface AgendaTimedLayout {
  column: number;
  columns: number;
}

export const DAY_OF_WEEK_INDEX: Record<AgendaDayOfWeek, number> = {
  fri: 5,
  mon: 1,
  sat: 6,
  sun: 0,
  thu: 4,
  tue: 2,
  wed: 3,
};

/* -------------------------------------------------------------------------------------------------
 * Day ranges
 * -----------------------------------------------------------------------------------------------*/

/** Inclusive day-number range covered by an all-day event (a midnight end is exclusive). */
export function getAllDayRange(event: AgendaEvent): {first: number; last: number} {
  const first = toDayNumber(event.start);
  let last = toDayNumber(event.end);

  if (last > first && event.end.hour === 0 && event.end.minute === 0) last -= 1;

  return {first, last: Math.max(first, last)};
}

export function isMultiDayAllDay(event: AgendaEvent): boolean {
  if (!event.isAllDay) return false;
  const {first, last} = getAllDayRange(event);

  return last > first;
}

/** Start of the week containing `dayNumber`. */
export function startOfWeek(dayNumber: number, firstDayOfWeek: number): number {
  return dayNumber - ((dayOfWeek(dayNumber) - firstDayOfWeek + 7) % 7);
}

export function isWeekend(dayNumber: number): boolean {
  const weekday = dayOfWeek(dayNumber);

  return weekday === 0 || weekday === 6;
}

/* -------------------------------------------------------------------------------------------------
 * Packing (all-day section + month bars)
 * -----------------------------------------------------------------------------------------------*/

/**
 * Packs day ranges into rows over the columns `[rangeStart, rangeEnd]`: earliest first, then
 * longest first; each event takes the first row where it does not overlap another one.
 */
export function packDayRanges(
  events: AgendaEvent[],
  rangeStart: number,
  rangeEnd: number,
): AgendaSpanLayout[] {
  const items = events
    .map((event, index) => ({event, index, ...getAllDayRange(event)}))
    .filter((item) => item.last >= rangeStart && item.first <= rangeEnd)
    .sort(
      (a, b) => a.first - b.first || b.last - b.first - (a.last - a.first) || a.index - b.index,
    );

  const rows: Array<Array<[number, number]>> = [];
  const result: AgendaSpanLayout[] = [];

  for (const item of items) {
    const colStart = Math.max(item.first, rangeStart) - rangeStart;
    const colEnd = Math.min(item.last, rangeEnd) - rangeStart;
    let row = rows.findIndex((ranges) =>
      ranges.every(([start, end]) => colEnd < start || colStart > end),
    );

    if (row === -1) {
      row = rows.length;
      rows.push([]);
    }
    rows[row]!.push([colStart, colEnd]);
    result.push({colSpan: colEnd - colStart + 1, colStart, event: item.event, row});
  }

  return result;
}

/* -------------------------------------------------------------------------------------------------
 * Timed events
 * -----------------------------------------------------------------------------------------------*/

/** Minute range of a timed event inside its start day (an event ending on a later day stops at midnight). */
export function getTimedRange(event: AgendaEvent): {start: number; end: number} {
  const start = toMinuteOfDay(event.start);
  const end = toDayNumber(event.end) > toDayNumber(event.start) ? 1440 : toMinuteOfDay(event.end);

  return {end: Math.max(start, end), start};
}

/**
 * Places overlapping timed events side by side. Events are sorted by start (ties keep their input
 * order), grouped into clusters of transitively overlapping events, and every event takes the first
 * free column of its cluster. Events shorter than `minDuration` are laid out for the time they are
 * drawn.
 */
export function layoutTimedEvents(
  events: AgendaEvent[],
  minDuration: number,
): Map<string, AgendaTimedLayout> {
  const items = events
    .map((event, index) => {
      const {end, start} = getTimedRange(event);

      return {end: Math.max(end, start + minDuration), event, index, start};
    })
    .sort((a, b) => a.start - b.start || a.index - b.index);

  const result = new Map<string, AgendaTimedLayout>();
  let cluster: Array<{id: string; column: number}> = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const entry of cluster) {
      result.set(entry.id, {column: entry.column, columns: columnEnds.length});
    }
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.start >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }

    let column = columnEnds.findIndex((end) => end <= item.start);

    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[column] = item.end;
    }
    cluster.push({column, id: item.event.id});
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();

  return result;
}

/* -------------------------------------------------------------------------------------------------
 * Colors
 * -----------------------------------------------------------------------------------------------*/
type CSSVars = Record<`--${string}`, string>;

/** Timed event (day / week view): soft 15% fill + solid accent bar. */
export function getTimedEventColorVars(color?: string): CSSVars {
  if (!color) return {};

  return {
    "--agenda-event-accent": color,
    "--agenda-event-color": `color-mix(in srgb, ${color} 15%, var(--agenda-surface))`,
  };
}

/** All-day event / month bar: solid fill with white text. */
export function getSolidEventColorVars(color?: string): CSSVars {
  if (!color) return {};

  return {"--agenda-event-accent": color, "--agenda-event-foreground": "#fff"};
}

/** Month cell event: soft 15% fill + colored text. */
export function getMonthEventColorVars(color?: string): CSSVars {
  if (!color) return {};

  return {
    "--agenda-event-color": `color-mix(in srgb, ${color} 15%, var(--agenda-surface))`,
    "--agenda-event-text": color,
  };
}

/* -------------------------------------------------------------------------------------------------
 * Formatting
 * -----------------------------------------------------------------------------------------------*/
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {...options, timeZone: "UTC"});
    formatterCache.set(key, formatter);
  }

  return formatter;
}

const hourCycleOption = (hourCycle: 12 | 24) => (hourCycle === 24 ? "h23" : "h12");

/** `10:00 AM` / `10:00`. */
export function formatTime(
  value: {hour: number; minute: number},
  locale: string,
  hourCycle: 12 | 24,
): string {
  return getFormatter(locale, {
    hour: "numeric",
    hourCycle: hourCycleOption(hourCycle),
    minute: "2-digit",
  }).format(new Date(Date.UTC(2000, 0, 1, value.hour, value.minute)));
}

/** Time-grid label: `1 AM` / `13:00` (minutes shown when not on the hour). */
export function formatSlotLabel(minuteOfDay: number, locale: string, hourCycle: 12 | 24): string {
  const hour = Math.floor(minuteOfDay / 60) % 24;
  const minute = minuteOfDay % 60;

  if (hourCycle === 12 && minute === 0) {
    return getFormatter(locale, {hour: "numeric", hourCycle: "h12"}).format(
      new Date(Date.UTC(2000, 0, 1, hour, 0)),
    );
  }

  return formatTime({hour, minute}, locale, hourCycle);
}

export function formatEventTime(
  event: AgendaEvent,
  locale: string,
  hourCycle: 12 | 24,
  isShort: boolean,
): string {
  const start = formatTime(event.start, locale, hourCycle);

  if (isShort) return start;

  return `${start} – ${formatTime(event.end, locale, hourCycle)}`;
}

export function formatWeekday(value: AgendaDateFields, locale: string): string {
  return getFormatter(locale, {weekday: "short"}).format(toJSDate(value));
}

export function formatDayNumber(value: AgendaDateFields, locale: string): string {
  return getFormatter(locale, {day: "numeric"}).format(toJSDate(value));
}

export function formatMonthDay(value: AgendaDateFields, locale: string): string {
  return getFormatter(locale, {day: "numeric", month: "short"}).format(toJSDate(value));
}

export function formatMonthYear(value: AgendaDateFields, locale: string): string {
  return getFormatter(locale, {month: "long", year: "numeric"}).format(toJSDate(value));
}

export function formatFullDate(value: AgendaDateFields, locale: string): string {
  return getFormatter(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(toJSDate(value));
}

/* -------------------------------------------------------------------------------------------------
 * Locale defaults
 * -----------------------------------------------------------------------------------------------*/

// Regions whose week starts on Sunday (CLDR); everything else defaults to Monday.
const SUNDAY_REGIONS = new Set([
  "AG",
  "AS",
  "BD",
  "BR",
  "BS",
  "BT",
  "BW",
  "BZ",
  "CA",
  "CN",
  "CO",
  "DM",
  "DO",
  "ET",
  "GT",
  "GU",
  "HK",
  "HN",
  "ID",
  "IL",
  "IN",
  "JM",
  "JP",
  "KE",
  "KH",
  "KR",
  "LA",
  "MH",
  "MM",
  "MO",
  "MT",
  "MX",
  "MZ",
  "NI",
  "NP",
  "PA",
  "PE",
  "PH",
  "PK",
  "PR",
  "PT",
  "PY",
  "SA",
  "SG",
  "SV",
  "TH",
  "TT",
  "TW",
  "UM",
  "US",
  "VE",
  "VI",
  "WS",
  "YE",
  "ZA",
  "ZW",
]);

/** First day of the week for a locale (0 = Sunday). */
export function getLocaleFirstDayOfWeek(locale: string): number {
  try {
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => {firstDay: number};
      weekInfo?: {firstDay: number};
    };
    const info = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;

    if (info?.firstDay) return info.firstDay % 7;

    const region = intlLocale.maximize().region;

    return region && SUNDAY_REGIONS.has(region) ? 0 : 1;
  } catch {
    return 0;
  }
}

/** 12 or 24 hour clock for a locale. */
export function getLocaleHourCycle(locale: string): 12 | 24 {
  try {
    const {hourCycle} = new Intl.DateTimeFormat(locale, {hour: "numeric"}).resolvedOptions();

    return hourCycle === "h11" || hourCycle === "h12" ? 12 : 24;
  } catch {
    return 12;
  }
}
