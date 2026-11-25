/* -------------------------------------------------------------------------------------------------
 * Agenda date helpers
 * -------------------------------------------------------------------------------------------------
 * The public API speaks `CalendarDate` / `CalendarDateTime` from `@internationalized/date`. That
 * package is not resolvable from `@heroui/pro` yet, so the Agenda works on structural types that
 * those classes satisfy, and derives every value it hands back (visible days, moved/resized event
 * times) from the caller's own instances through their `set()` method. When the caller did not
 * provide an instance to derive from, a small Gregorian-only fallback class with the same shape is
 * used. All layout math runs on plain numbers (day numbers + minutes of the day).
 * -----------------------------------------------------------------------------------------------*/

/** Fields of a calendar date (structurally satisfied by `CalendarDate`). */
export interface AgendaDateFields {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** Fields of a calendar date + wall-clock time (structurally satisfied by `CalendarDateTime`). */
export interface AgendaDateTimeFields extends AgendaDateFields {
  readonly hour: number;
  readonly minute: number;
  readonly second?: number;
  readonly millisecond?: number;
}

type SetFields = Partial<{
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}>;

type DurationFields = Partial<{
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
}>;

/** A `CalendarDate`-compatible value. */
export interface CalendarDate extends AgendaDateFields {
  set(fields: SetFields): CalendarDate;
  add(duration: DurationFields): CalendarDate;
  subtract(duration: DurationFields): CalendarDate;
  toString(): string;
}

/** A `CalendarDateTime`-compatible value. */
export interface CalendarDateTime extends AgendaDateTimeFields {
  set(fields: SetFields): CalendarDateTime;
  add(duration: DurationFields): CalendarDateTime;
  subtract(duration: DurationFields): CalendarDateTime;
  toString(): string;
}

/* -------------------------------------------------------------------------------------------------
 * Plain number helpers
 * -----------------------------------------------------------------------------------------------*/
const MS_PER_DAY = 86_400_000;

const pad = (value: number, length = 2) => String(Math.abs(value)).padStart(length, "0");

/** Days since 1970-01-01 (proleptic Gregorian). */
export function toDayNumber(value: AgendaDateFields): number {
  return Math.round(Date.UTC(value.year, value.month - 1, value.day) / MS_PER_DAY);
}

/** Converts a day number back to `{year, month, day}`. */
export function fromDayNumber(dayNumber: number): {year: number; month: number; day: number} {
  const date = new Date(dayNumber * MS_PER_DAY);

  return {day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear()};
}

/** Day of the week for a day number: 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(dayNumber: number): number {
  // 1970-01-01 was a Thursday.
  return (((dayNumber + 4) % 7) + 7) % 7;
}

/** Minutes since the start of the day (seconds are dropped). */
export function toMinuteOfDay(value: AgendaDateTimeFields): number {
  return value.hour * 60 + value.minute;
}

/** Absolute minute stamp (day number * 1440 + minute of day). */
export function toMinuteStamp(value: AgendaDateTimeFields): number {
  return toDayNumber(value) * 1440 + toMinuteOfDay(value);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/* -------------------------------------------------------------------------------------------------
 * Fallback classes (Gregorian only, CalendarDate / CalendarDateTime shaped)
 * -----------------------------------------------------------------------------------------------*/
function balance(fields: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}): {year: number; month: number; day: number; hour: number; minute: number} {
  const totalMinutes =
    (Date.UTC(fields.year, fields.month - 1, fields.day) / MS_PER_DAY) * 1440 +
    (fields.hour ?? 0) * 60 +
    (fields.minute ?? 0);
  const dayNumber = Math.floor(totalMinutes / 1440);
  const minuteOfDay = totalMinutes - dayNumber * 1440;
  const {day, month, year} = fromDayNumber(dayNumber);

  return {day, hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60, month, year};
}

function addMonths(year: number, month: number, day: number, months: number) {
  const index = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12 + 1;

  return {
    day: Math.min(day, daysInMonth(nextYear, nextMonth)),
    month: nextMonth,
    year: nextYear,
  };
}

class AgendaCalendarDate implements CalendarDate {
  readonly calendar = {identifier: "gregory"};
  readonly era = "AD";
  readonly year: number;
  readonly month: number;
  readonly day: number;

  constructor(year: number, month: number, day: number) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  set(fields: SetFields): CalendarDate {
    const year = fields.year ?? this.year;
    const month = Math.min(Math.max(fields.month ?? this.month, 1), 12);
    const day = Math.min(Math.max(fields.day ?? this.day, 1), daysInMonth(year, month));

    return new AgendaCalendarDate(year, month, day);
  }

  add(duration: DurationFields): CalendarDate {
    const shifted = addMonths(
      this.year,
      this.month,
      this.day,
      (duration.years ?? 0) * 12 + (duration.months ?? 0),
    );
    const next = fromDayNumber(
      toDayNumber(shifted) + (duration.weeks ?? 0) * 7 + (duration.days ?? 0),
    );

    return new AgendaCalendarDate(next.year, next.month, next.day);
  }

  subtract(duration: DurationFields): CalendarDate {
    return this.add(negate(duration));
  }

  compare(other: AgendaDateFields): number {
    return toDayNumber(this) - toDayNumber(other);
  }

  copy(): CalendarDate {
    return new AgendaCalendarDate(this.year, this.month, this.day);
  }

  toString(): string {
    return `${pad(this.year, 4)}-${pad(this.month)}-${pad(this.day)}`;
  }
}

class AgendaCalendarDateTime implements CalendarDateTime {
  readonly calendar = {identifier: "gregory"};
  readonly era = "AD";
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second = 0;
  readonly millisecond = 0;

  constructor(year: number, month: number, day: number, hour = 0, minute = 0) {
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
  }

  set(fields: SetFields): CalendarDateTime {
    const year = fields.year ?? this.year;
    const month = Math.min(Math.max(fields.month ?? this.month, 1), 12);
    const day = Math.min(Math.max(fields.day ?? this.day, 1), daysInMonth(year, month));
    const hour = Math.min(Math.max(fields.hour ?? this.hour, 0), 23);
    const minute = Math.min(Math.max(fields.minute ?? this.minute, 0), 59);

    return new AgendaCalendarDateTime(year, month, day, hour, minute);
  }

  add(duration: DurationFields): CalendarDateTime {
    const shifted = addMonths(
      this.year,
      this.month,
      this.day,
      (duration.years ?? 0) * 12 + (duration.months ?? 0),
    );
    const next = balance({
      day: shifted.day + (duration.weeks ?? 0) * 7 + (duration.days ?? 0),
      hour: this.hour + (duration.hours ?? 0),
      minute: this.minute + (duration.minutes ?? 0),
      month: shifted.month,
      year: shifted.year,
    });

    return new AgendaCalendarDateTime(next.year, next.month, next.day, next.hour, next.minute);
  }

  subtract(duration: DurationFields): CalendarDateTime {
    return this.add(negate(duration));
  }

  compare(other: AgendaDateTimeFields): number {
    return toMinuteStamp(this) - toMinuteStamp(other);
  }

  copy(): CalendarDateTime {
    return new AgendaCalendarDateTime(this.year, this.month, this.day, this.hour, this.minute);
  }

  toString(): string {
    return `${pad(this.year, 4)}-${pad(this.month)}-${pad(this.day)}T${pad(this.hour)}:${pad(
      this.minute,
    )}:00`;
  }
}

function negate(duration: DurationFields): DurationFields {
  const result: DurationFields = {};

  for (const [key, value] of Object.entries(duration)) {
    result[key as keyof DurationFields] = -(value ?? 0);
  }

  return result;
}

/* -------------------------------------------------------------------------------------------------
 * Factories
 * -----------------------------------------------------------------------------------------------*/
interface Settable {
  set: (fields: SetFields) => Settable;
}

function hasSet(value: unknown): value is Settable {
  return typeof (value as {set?: unknown} | null)?.set === "function";
}

/** Creates a date, cloned from `template` (keeps the caller's class) when possible. */
export function createDate(
  year: number,
  month: number,
  day: number,
  template?: AgendaDateFields | null,
): CalendarDate {
  if (template && hasSet(template) && !("hour" in template)) {
    return template.set({day: 1, month, year}).set({day}) as CalendarDate;
  }

  return new AgendaCalendarDate(year, month, day);
}

/** Creates a date from a day number. */
export function dateFromDayNumber(
  dayNumber: number,
  template?: AgendaDateFields | null,
): CalendarDate {
  const {day, month, year} = fromDayNumber(dayNumber);

  return createDate(year, month, day, template);
}

/** Creates a date-time, cloned from `template` (keeps the caller's class) when possible. */
export function createDateTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  template?: AgendaDateFields | null,
): CalendarDateTime {
  if (template && hasSet(template) && "hour" in template) {
    return template
      .set({day: 1, month, year})
      .set({day, hour, millisecond: 0, minute, second: 0}) as CalendarDateTime;
  }

  return new AgendaCalendarDateTime(year, month, day, hour, minute);
}

/** Creates a date-time from an absolute minute stamp. */
export function dateTimeFromMinuteStamp(
  stamp: number,
  template?: AgendaDateFields | null,
): CalendarDateTime {
  const dayNumber = Math.floor(stamp / 1440);
  const minuteOfDay = stamp - dayNumber * 1440;
  const {day, month, year} = fromDayNumber(dayNumber);

  return createDateTime(year, month, day, Math.floor(minuteOfDay / 60), minuteOfDay % 60, template);
}

/** Parses `YYYY-MM-DD` into a date. */
export function parseDate(value: string): CalendarDate {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);

  return new AgendaCalendarDate(year, month, day);
}

/** Parses `YYYY-MM-DDTHH:mm` into a date-time. */
export function parseDateTime(value: string): CalendarDateTime {
  const [datePart = "", timePart = "00:00"] = value.split("T");
  const [year = 1970, month = 1, day = 1] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);

  return new AgendaCalendarDateTime(year, month, day, hour, minute);
}

/* -------------------------------------------------------------------------------------------------
 * Time zone helpers
 * -----------------------------------------------------------------------------------------------*/
const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

function getZoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zoneFormatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      hour: "numeric",
      hourCycle: "h23",
      minute: "numeric",
      month: "numeric",
      timeZone,
      year: "numeric",
    });
    zoneFormatters.set(timeZone, formatter);
  }

  return formatter;
}

export function getLocalTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Wall-clock fields of an instant in a time zone. */
export function getZonedNow(
  timeZone: string,
  now: Date = new Date(),
): {year: number; month: number; day: number; hour: number; minute: number} {
  const parts = getZoneFormatter(timeZone).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    month: read("month"),
    year: read("year"),
  };
}

/** Today's date in a time zone (fallback class). */
export function today(timeZone: string = getLocalTimeZone()): CalendarDate {
  const {day, month, year} = getZonedNow(timeZone);

  return new AgendaCalendarDate(year, month, day);
}

/** Converts wall-clock fields to a JS Date (local formatting only; the time zone is ignored). */
export function toJSDate(value: AgendaDateFields & Partial<AgendaDateTimeFields>): Date {
  return new Date(
    Date.UTC(value.year, value.month - 1, value.day, value.hour ?? 0, value.minute ?? 0),
  );
}
