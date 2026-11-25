"use client";

import type {
  AgendaContextValue,
  AgendaCreateState,
  AgendaDragState,
  AgendaInteractionContextValue,
} from "./agenda-context";
import type {CalendarDate} from "./agenda-date";
import type {AgendaEvent as AgendaEventData, AgendaView} from "./agenda-utils";
import type {AgendaState} from "./use-agenda";
import type {Key} from "@heroui/react";
import type {
  CSSProperties,
  ComponentPropsWithRef,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";

import {Button} from "@heroui/react";
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useFocusRing} from "react-aria/useFocusRing";
import {useLocale} from "react-aria-components/I18nProvider";
import {flushSync} from "react-dom";
import {cx} from "tailwind-variants";

import {composeTwRenderProps, useMergedRef} from "../../utils";
import {Segment} from "../segment";

import {AgendaContext, AgendaInteractionContext, useAgendaContext} from "./agenda-context";
import {dateTimeFromMinuteStamp, toDayNumber, toMinuteStamp} from "./agenda-date";
import {
  formatDayNumber,
  formatEventTime,
  formatMonthDay,
  formatMonthYear,
  formatSlotLabel,
  formatTime,
  formatWeekday,
  getAllDayRange,
  getMonthEventColorVars,
  getSolidEventColorVars,
  getTimedEventColorVars,
  getTimedRange,
  isWeekend,
} from "./agenda-utils";
import {agendaVariants} from "./agenda.styles";
import {AGENDA_STATE_KEYS} from "./use-agenda";

/* -------------------------------------------------------------------------------------------------
 * Constants & helpers
 * -----------------------------------------------------------------------------------------------*/
/** Pointer travel (px) before a press on an event becomes a drag. */
const DRAG_THRESHOLD = 4;
/** Events drawn shorter than this (px) render title + start time on one line. */
const SHORT_EVENT_HEIGHT = 40;
/** Minutes from the current time under which an hour label hides behind the current-time label. */
const TIME_LABEL_COLLISION = 20;
/** Release speed (px/ms) above which a touch swipe counts as a flick. */
const FLICK_VELOCITY = 0.3;
/** Time window (ms) of the pointer samples used for the release speed. */
const FLICK_WINDOW = 100;
/** How far (ms of travel at the release speed) a flick carries on. */
const FLICK_PROJECTION = 150;
/** Slide of the day tracks after previous / next / Today (ms, measured on Pro). */
const SLIDE_DURATION = 280;
/** Snap of the day tracks when a swipe ends (ms, measured on Pro). */
const SETTLE_DURATION = 200;
/** Ease-out quart, the curve both track animations follow. */
const SLIDE_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";
const STATE_KEY_SET = new Set<string>(AGENDA_STATE_KEYS);

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const pct = (value: number) => `${Number(value.toFixed(4))}%`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const snapRound = (value: number, step: number) => Math.round(value / step) * step;
const snapFloor = (value: number, step: number) => Math.floor(value / step) * step;
const snapCeil = (value: number, step: number) => Math.ceil(value / step) * step;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function dragTransform(dx: number, dy: number): string {
  const parts: string[] = [];

  if (dx) parts.push(`translateX(${Number(dx.toFixed(3))}px)`);
  if (dy) parts.push(`translateY(${Number(dy.toFixed(3))}px)`);

  return parts.length ? parts.join(" ") : "none";
}

function splitAgendaProps<P extends AgendaState>(
  props: P,
): [AgendaState, Omit<P, keyof AgendaState>] {
  const state: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};

  for (const key of Object.keys(props)) {
    if (STATE_KEY_SET.has(key)) state[key] = props[key as keyof P];
    else rest[key] = props[key as keyof P];
  }

  return [state as unknown as AgendaState, rest as Omit<P, keyof AgendaState>];
}

/** Reads `--agenda-slot-height` (px or rem) from the root; follows viewport changes. */
function useSlotHeight(rootRef: RefObject<HTMLDivElement | null>): number {
  const [height, setHeight] = useState(60);

  useLayoutEffect(() => {
    const element = rootRef.current;

    if (!element) return;
    const read = () => {
      const raw = getComputedStyle(element).getPropertyValue("--agenda-slot-height").trim();
      let value = Number.parseFloat(raw);

      if (raw.endsWith("rem")) {
        value *= Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      }
      if (value > 0) setHeight(value);
    };

    read();
    window.addEventListener("resize", read);

    return () => window.removeEventListener("resize", read);
  }, [rootRef]);

  return height;
}

/** Ignores the compatibility mouse events a touch screen fires after a tap. */
let lastTouchTime = 0;

if (typeof window !== "undefined") {
  window.addEventListener(
    "touchstart",
    () => {
      lastTouchTime = Date.now();
    },
    {capture: true, passive: true},
  );
}

/* -------------------------------------------------------------------------------------------------
 * Agenda Root
 * -----------------------------------------------------------------------------------------------*/
type AgendaRootProps = AgendaState & Omit<ComponentPropsWithRef<"div">, keyof AgendaState>;

const AgendaRoot = ({children, className, ref, style, ...props}: AgendaRootProps) => {
  const [state, rest] = splitAgendaProps(props);
  const {direction} = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, rootRef);
  const slotHeight = useSlotHeight(rootRef);
  const pxPerMinute = slotHeight / state.slotDuration;
  const slots = useMemo(() => agendaVariants({view: state.view}), [state.view]);

  /* Registries ---------------------------------------------------------------------------------- */
  const tracksRef = useRef(new Set<HTMLDivElement>());
  const columnsRef = useRef(new Map<number, HTMLElement>());
  const cellsRef = useRef(new Map<number, HTMLElement>());

  const registerTrack = useCallback((element: HTMLDivElement) => {
    tracksRef.current.add(element);

    return () => {
      tracksRef.current.delete(element);
    };
  }, []);

  const registerColumn = useCallback((day: number, element: HTMLElement) => {
    columnsRef.current.set(day, element);

    return () => {
      if (columnsRef.current.get(day) === element) columnsRef.current.delete(day);
    };
  }, []);

  const registerCell = useCallback((day: number, element: HTMLElement) => {
    cellsRef.current.set(day, element);

    return () => {
      if (cellsRef.current.get(day) === element) cellsRef.current.delete(day);
    };
  }, []);

  const getColumnAt = useCallback((clientX: number) => {
    let nearest: {day: number; distance: number} | null = null;

    for (const [day, element] of columnsRef.current) {
      const rect = element.getBoundingClientRect();

      if (clientX >= rect.left && clientX < rect.right) return day;
      const distance = Math.min(Math.abs(clientX - rect.left), Math.abs(clientX - rect.right));

      if (!nearest || distance < nearest.distance) nearest = {day, distance};
    }

    return nearest?.day ?? null;
  }, []);

  const getCellAt = useCallback((clientX: number, clientY: number) => {
    for (const [day, element] of cellsRef.current) {
      const rect = element.getBoundingClientRect();

      if (
        clientX >= rect.left &&
        clientX < rect.right &&
        clientY >= rect.top &&
        clientY < rect.bottom
      ) {
        return day;
      }
    }

    return null;
  }, []);

  /* Focus management ---------------------------------------------------------------------------- */
  const pendingFocusRef = useRef<string | null>(null);
  const pendingCreateRef = useRef<{start: number; end: number} | null>(null);

  const requestFocus = useCallback((id: string) => {
    pendingFocusRef.current = id;
  }, []);

  const requestCreateFocus = useCallback((start: number, end: number) => {
    pendingCreateRef.current = {end, start};
  }, []);

  const consumeFocus = useCallback((id: string, start: number, end: number) => {
    if (pendingFocusRef.current === id) {
      pendingFocusRef.current = null;

      return true;
    }
    const pending = pendingCreateRef.current;

    if (pending && pending.start === start && pending.end === end) {
      pendingCreateRef.current = null;

      return true;
    }

    return false;
  }, []);

  const focusFallback = useCallback(() => {
    const target = timeGridRef.current ?? rootRef.current;

    target?.focus({preventScroll: true});
  }, []);

  const {dateTimeTemplate} = state;
  const createDateTime = useCallback(
    (stamp: number) => dateTimeFromMinuteStamp(stamp, dateTimeTemplate),
    [dateTimeTemplate],
  );

  /* Tracks: base transform + slide animation ---------------------------------------------------- */
  const renderedCount = Math.max(state.renderedDays.length, 1);
  const visibleCount = Math.max(state.view === "month" ? 1 : state.weekDays, 1);
  const basePercent = -(state.visibleStartIndex / renderedCount) * 100;
  const baseTransform = `translate3d(${pct(basePercent)}, 0px, 0px)`;

  const trackStyle = useMemo<CSSProperties>(
    () => ({
      touchAction: "pan-y pinch-zoom",
      transform: baseTransform,
      width: pct((renderedCount / visibleCount) * 100),
    }),
    [baseTransform, renderedCount, visibleCount],
  );

  const firstRenderedDay = state.renderedDays[0] ? toDayNumber(state.renderedDays[0]) : 0;
  const lastNavigationRef = useRef(state.navigation.count);

  useLayoutEffect(() => {
    // Swipe gestures write the transform directly; restore the base one for the new window.
    // eslint-disable-next-line react-hooks/immutability -- imperative style write on registered DOM tracks inside a layout effect (the compiler mistakes the ref-held nodes for a frozen hook value).
    for (const track of tracksRef.current) track.style.transform = baseTransform;

    const {count, delta} = state.navigation;

    if (count === lastNavigationRef.current) return;
    lastNavigationRef.current = count;

    const overscan = state.visibleStartIndex;

    if (!state.allowsSwipe || !overscan || Math.abs(delta) > overscan || prefersReducedMotion()) {
      return;
    }
    const from = `translate3d(${pct(-((overscan - delta) / renderedCount) * 100)}, 0px, 0px)`;

    for (const track of tracksRef.current) {
      track.animate?.([{transform: from}, {transform: baseTransform}], {
        duration: SLIDE_DURATION,
        easing: SLIDE_EASING,
      });
    }
  }, [
    firstRenderedDay,
    baseTransform,
    renderedCount,
    state.navigation,
    state.visibleStartIndex,
    state.allowsSwipe,
  ]);

  /* Interaction state --------------------------------------------------------------------------- */
  const [drag, setDrag] = useState<AgendaDragState | null>(null);
  const [create, setCreate] = useState<AgendaCreateState | null>(null);
  const interaction = useMemo<AgendaInteractionContextValue>(
    () => ({create, drag, setCreate, setDrag}),
    [create, drag],
  );

  const contextValue = useMemo<AgendaContextValue>(
    () => ({
      consumeFocus,
      createDateTime,
      direction,
      focusFallback,
      getCellAt,
      getColumnAt,
      pxPerMinute,
      registerCell,
      registerColumn,
      registerTrack,
      requestCreateFocus,
      requestFocus,
      rootRef,
      slotHeight,
      slots,
      state,
      timeGridRef,
      trackStyle,
    }),
    [
      consumeFocus,
      createDateTime,
      direction,
      focusFallback,
      getCellAt,
      getColumnAt,
      pxPerMinute,
      registerCell,
      registerColumn,
      registerTrack,
      requestCreateFocus,
      requestFocus,
      slotHeight,
      slots,
      state,
      trackStyle,
    ],
  );

  return (
    <AgendaContext value={contextValue}>
      <AgendaInteractionContext value={interaction}>
        <div
          ref={mergedRef}
          className={slots.base({className})}
          data-slot="agenda"
          data-view={state.view}
          style={{"--agenda-visible-start": state.visibleStartIndex, ...style} as CSSVars}
          tabIndex={-1}
          {...rest}
        >
          {children}
        </div>
      </AgendaInteractionContext>
    </AgendaContext>
  );
};

AgendaRoot.displayName = "HeroUI.Agenda";

/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/
interface AgendaHeaderProps extends ComponentPropsWithRef<"header"> {}

const AgendaHeader = ({className, ...rest}: AgendaHeaderProps) => {
  const {slots} = useAgendaContext("Header");

  return <header className={slots.header({className})} data-slot="agenda-header" {...rest} />;
};

AgendaHeader.displayName = "HeroUI.Agenda.Header";

interface AgendaHeadingProps extends ComponentPropsWithRef<"h1"> {}

const AgendaHeading = ({children, className, ...rest}: AgendaHeadingProps) => {
  const {slots, state} = useAgendaContext("Heading");

  return (
    <h1 className={slots.heading({className})} data-slot="agenda-heading" {...rest}>
      {children ?? formatMonthYear(state.date, state.locale)}
    </h1>
  );
};

AgendaHeading.displayName = "HeroUI.Agenda.Heading";

const VIEW_LABELS: Record<AgendaView, string> = {day: "Day", month: "Month", week: "Week"};

interface AgendaViewSelectorProps extends Omit<
  ComponentPropsWithRef<typeof Segment>,
  "selectedKey" | "defaultSelectedKey" | "onSelectionChange" | "children"
> {
  /** Size of the segmented control. @default "sm" */
  size?: "sm" | "md" | "lg";
  /** Views offered, in order. @default ["day", "week", "month"] */
  views?: AgendaView[];
  /** Custom labels per view. */
  labels?: Partial<Record<AgendaView, ReactNode>>;
}

const AgendaViewSelector = ({
  className,
  labels,
  size = "sm",
  views = ["day", "week", "month"],
  ...rest
}: AgendaViewSelectorProps) => {
  const {slots, state} = useAgendaContext("ViewSelector");
  const {setView} = state;
  const handleChange = useCallback((key: Key) => setView(key as AgendaView), [setView]);

  return (
    <Segment
      aria-label="Calendar view"
      className={composeTwRenderProps(className, slots.viewSelector())}
      selectedKey={state.view}
      size={size}
      onSelectionChange={handleChange}
      {...rest}
    >
      {views.map((view) => (
        <Segment.Item key={view} id={view}>
          {labels?.[view] ?? VIEW_LABELS[view]}
        </Segment.Item>
      ))}
    </Segment>
  );
};

AgendaViewSelector.displayName = "HeroUI.Agenda.ViewSelector";

interface AgendaNavigationProps extends ComponentPropsWithRef<"div"> {}

const AgendaNavigation = ({className, ...rest}: AgendaNavigationProps) => {
  const {slots} = useAgendaContext("Navigation");

  return <div className={slots.navigation({className})} data-slot="agenda-navigation" {...rest} />;
};

AgendaNavigation.displayName = "HeroUI.Agenda.Navigation";

const ChevronIcon = ({direction}: {direction: "previous" | "next"}) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <polyline points={direction === "previous" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
  </svg>
);

interface AgendaNavButtonProps extends Omit<
  ComponentPropsWithRef<typeof Button>,
  "slot" | "isIconOnly"
> {
  /** Which way the button navigates. */
  slot: "previous" | "next";
}

const AgendaNavButton = ({
  "aria-label": ariaLabel,
  children,
  className,
  onPress,
  slot,
  ...rest
}: AgendaNavButtonProps) => {
  const {slots, state} = useAgendaContext("NavButton");

  return (
    <Button
      isIconOnly
      aria-label={ariaLabel ?? (slot === "previous" ? "Previous" : "Next")}
      className={composeTwRenderProps(className, slots.navButton())}
      size="sm"
      variant="ghost"
      onPress={(event) => {
        if (slot === "previous") state.goToPrevious();
        else state.goToNext();
        onPress?.(event);
      }}
      {...rest}
    >
      {children ?? <ChevronIcon direction={slot} />}
    </Button>
  );
};

AgendaNavButton.displayName = "HeroUI.Agenda.NavButton";

interface AgendaTodayButtonProps extends ComponentPropsWithRef<typeof Button> {}

const AgendaTodayButton = ({children, className, onPress, ...rest}: AgendaTodayButtonProps) => {
  const {slots, state} = useAgendaContext("TodayButton");

  return (
    <Button
      className={composeTwRenderProps(className, slots.todayButton())}
      size="sm"
      variant="outline"
      onPress={(event) => {
        state.goToToday();
        onPress?.(event);
      }}
      {...rest}
    >
      {children ?? "Today"}
    </Button>
  );
};

AgendaTodayButton.displayName = "HeroUI.Agenda.TodayButton";

/* -------------------------------------------------------------------------------------------------
 * Body (+ swipe navigation)
 * -----------------------------------------------------------------------------------------------*/
interface AgendaBodyProps extends ComponentPropsWithRef<"div"> {}

const AgendaBody = ({className, onPointerDown, ref, ...rest}: AgendaBodyProps) => {
  const context = useAgendaContext("Body");
  const {slots, state} = context;
  const bodyRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, bodyRef);
  const swipeEnabled = state.allowsSwipe && state.view !== "month" && state.visibleStartIndex > 0;

  const latest = useRef({context, swipeEnabled});

  useLayoutEffect(() => {
    latest.current = {context, swipeEnabled};
  });

  /** Writes a pixel offset on every days track. */
  const applyOffset = useCallback((offset: number, animate: boolean) => {
    const {context: ctx} = latest.current;
    const base = ctx.trackStyle.transform as string;
    const value = offset
      ? base.replace(/translate3d\(([^,]+),/, `translate3d(calc($1 + ${offset}px),`)
      : base;
    const tracks = ctx.rootRef.current?.querySelectorAll<HTMLElement>(".agenda__days-track") ?? [];
    const animations: Animation[] = [];

    for (const track of tracks) {
      if (animate && track.animate && !prefersReducedMotion()) {
        const from = track.style.transform || base;

        animations.push(
          track.animate([{transform: from}, {transform: value}], {
            duration: SETTLE_DURATION,
            easing: SLIDE_EASING,
          }),
        );
      }
      track.style.transform = value;
    }

    return Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  }, []);

  /**
   * Snaps a swipe offset to the nearest day and commits the new visible start. A flick
   * (`velocity` in px/ms) carries on in its direction and moves at least one day.
   */
  const settle = useCallback(
    (offset: number, dayWidth: number, velocity = 0) => {
      const {context: ctx} = latest.current;
      const overscan = ctx.state.visibleStartIndex;
      const sign = ctx.direction === "rtl" ? -1 : 1;
      const isFlick =
        Math.abs(velocity) >= FLICK_VELOCITY && Math.sign(velocity) === Math.sign(offset);
      let days = Math.round(
        (-(isFlick ? offset + velocity * FLICK_PROJECTION : offset) * sign) / dayWidth,
      );

      if (isFlick && days === 0) days = -Math.sign(velocity) * sign;
      const shift = clamp(days, -overscan, overscan);

      void applyOffset(-shift * dayWidth * sign, true).then(() => {
        const {context: current} = latest.current;
        const firstVisible = current.state.visibleDays[0];

        if (shift !== 0 && firstVisible) {
          const target = current.state.renderedDays[current.state.visibleStartIndex + shift];

          if (target) flushSync(() => current.state.setVisibleStart(target));
        }
        applyOffset(0, false);
      });
    },
    [applyOffset],
  );

  const getDayWidth = useCallback(() => {
    const {context: ctx} = latest.current;
    const track = ctx.rootRef.current?.querySelector<HTMLElement>(".agenda__days-track");

    return track ? track.offsetWidth / Math.max(ctx.state.renderedDays.length, 1) : 0;
  }, []);

  // Touch swipe (horizontal pans; vertical pans keep scrolling the time grid).
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (!swipeEnabled || event.pointerType !== "touch" || !event.isPrimary) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const dayWidth = getDayWidth();
    const maxOffset = dayWidth * state.visibleStartIndex;
    let mode: "pending" | "swipe" | "cancel" = "pending";
    let offset = 0;
    /** Recent pointer positions, used for the release velocity. */
    let samples: {time: number; x: number}[] = [{time: event.timeStamp, x: startX}];

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      samples = [...samples, {time: moveEvent.timeStamp, x: moveEvent.clientX}].filter(
        (sample) => moveEvent.timeStamp - sample.time <= FLICK_WINDOW,
      );
      if (mode === "pending") {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) mode = "swipe";
        else if (Math.abs(dy) > 8) mode = "cancel";
      }
      if (mode === "swipe") {
        offset = clamp(dx, -maxOffset, maxOffset);
        applyOffset(offset, false);
      }
    };
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== event.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (mode !== "swipe") return;
      const recent = samples.filter((sample) => upEvent.timeStamp - sample.time <= FLICK_WINDOW);
      const first = recent[0];
      const elapsed = first ? upEvent.timeStamp - first.time : 0;
      const velocity =
        upEvent.type === "pointerup" && first && elapsed > 0
          ? (upEvent.clientX - first.x) / elapsed
          : 0;

      settle(offset, dayWidth, velocity);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Trackpad swipe (horizontal wheel).
  useEffect(() => {
    const element = bodyRef.current;

    if (!element) return;
    let offset = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onWheel = (event: WheelEvent) => {
      if (!latest.current.swipeEnabled) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const dayWidth = getDayWidth();
      const maxOffset = dayWidth * latest.current.context.state.visibleStartIndex;

      offset = clamp(offset - event.deltaX, -maxOffset, maxOffset);
      applyOffset(offset, false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const settled = offset;

        offset = 0;
        settle(settled, dayWidth);
      }, 140);
    };

    element.addEventListener("wheel", onWheel, {passive: false});

    return () => {
      element.removeEventListener("wheel", onWheel);
      clearTimeout(timer);
    };
  }, [applyOffset, getDayWidth, settle]);

  return (
    <div
      ref={mergedRef}
      className={slots.body({className})}
      data-slot="agenda-body"
      onPointerDown={handlePointerDown}
      {...rest}
    />
  );
};

AgendaBody.displayName = "HeroUI.Agenda.Body";

/* -------------------------------------------------------------------------------------------------
 * Days track (shared by the week header, all-day grid, current-time line and day columns)
 * -----------------------------------------------------------------------------------------------*/
interface DaysTrackProps {
  children?: ReactNode;
  className?: string;
  outerClassName?: string;
  outerProps?: ComponentPropsWithRef<"div">;
  outerSlot?: string;
  style?: CSSProperties;
}

const DaysTrack = ({
  children,
  className,
  outerClassName,
  outerProps,
  outerSlot,
  style,
}: DaysTrackProps) => {
  const {registerTrack, slots, trackStyle} = useAgendaContext("DayColumns");

  return (
    <div
      {...outerProps}
      className={outerClassName ?? slots.days()}
      data-slot={outerSlot ?? "agenda-days"}
    >
      <div
        ref={registerTrack}
        className={cx(slots.daysTrack(), className)}
        data-slot="agenda-days-track"
        style={{...style, ...trackStyle}}
      >
        {children}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Week header
 * -----------------------------------------------------------------------------------------------*/
interface AgendaWeekHeaderProps extends ComponentPropsWithRef<"div"> {}

const AgendaWeekHeader = ({className, ...rest}: AgendaWeekHeaderProps) => {
  const {slots, state} = useAgendaContext("WeekHeader");
  const todayNumber = toDayNumber(state.today);

  return (
    <div className={slots.weekHeader({className})} data-slot="agenda-week-header" {...rest}>
      <DaysTrack>
        {state.renderedDays.map((day) => {
          const dayNumber = toDayNumber(day);
          const isToday = dayNumber === todayNumber || undefined;

          return (
            <div
              key={dayNumber}
              className={slots.dayHeader()}
              data-slot="agenda-day-header"
              data-today={isToday}
              data-weekend={isWeekend(dayNumber) || undefined}
            >
              <span
                className={slots.dayHeaderName()}
                data-slot="agenda-day-header-name"
                data-today={isToday}
              >
                {formatWeekday(day, state.locale)}
              </span>
              <span
                className={slots.dayHeaderDate()}
                data-slot="agenda-day-header-date"
                data-today={isToday}
              >
                {formatDayNumber(day, state.locale)}
              </span>
            </div>
          );
        })}
      </DaysTrack>
    </div>
  );
};

AgendaWeekHeader.displayName = "HeroUI.Agenda.WeekHeader";

/* -------------------------------------------------------------------------------------------------
 * Event interactions (shared by every event part)
 * -----------------------------------------------------------------------------------------------*/
function isEventPast(event: AgendaEventData, nowStamp: number): boolean {
  if (event.isAllDay) return getAllDayRange(event).last < Math.floor(nowStamp / 1440);

  return toMinuteStamp(event.end) <= nowStamp;
}

/** Keyboard handling shared by all event parts: select, delete, then a part specific move. */
function useEventKeyboard(
  event: AgendaEventData,
  onArrow?: (key: string, shiftKey: boolean) => boolean,
) {
  const {focusFallback, state} = useAgendaContext("Event");

  return (keyEvent: ReactKeyboardEvent<HTMLElement>) => {
    if (keyEvent.target !== keyEvent.currentTarget) return;
    switch (keyEvent.key) {
      case "Enter":
      case " ":
        keyEvent.preventDefault();
        state.selectEvent(event.id);
        break;
      case "Delete":
      case "Backspace":
        // Only the selected event is deleted (read-only events included, as in Pro).
        if (!state.onEventDelete || state.selectedEventId !== event.id) return;
        keyEvent.preventDefault();
        state.selectEvent(null);
        state.onEventDelete(event.id);
        focusFallback();
        break;
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        if (onArrow?.(keyEvent.key, keyEvent.shiftKey)) keyEvent.preventDefault();
        break;
    }
  };
}

/** Takes focus when the agenda asked for it (after a move or a keyboard create). */
function usePendingFocus(event: AgendaEventData, elementRef: RefObject<HTMLElement | null>) {
  const {consumeFocus} = useAgendaContext("Event");
  const start = toMinuteStamp(event.start);
  const end = toMinuteStamp(event.end);

  useLayoutEffect(() => {
    if (consumeFocus(event.id, start, end)) elementRef.current?.focus({preventScroll: true});
  });
}

/* -------------------------------------------------------------------------------------------------
 * All-day section
 * -----------------------------------------------------------------------------------------------*/
interface AgendaAllDayLabelProps extends ComponentPropsWithRef<"span"> {}

const AgendaAllDayLabel = ({className, ...rest}: AgendaAllDayLabelProps) => {
  const {slots} = useAgendaContext("AllDayLabel");

  return (
    <span className={slots.allDayLabel({className})} data-slot="agenda-all-day-label" {...rest} />
  );
};

AgendaAllDayLabel.displayName = "HeroUI.Agenda.AllDayLabel";

const ToggleChevron = () => (
  <svg aria-hidden="true" fill="none" height="10" viewBox="0 0 10 10" width="10">
    <polyline
      points="3 4 5 6 7 4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

interface AgendaAllDaySectionProps extends ComponentPropsWithRef<"div"> {
  /** Text of the per-day count shown while collapsed. @default "N events" */
  collapsedLabel?: (count: number) => string;
  /** Accessible label of the toggle while collapsed. @default "Expand all-day events" */
  expandLabel?: string;
  /** Accessible label of the toggle while expanded. @default "Collapse all-day events" */
  collapseLabel?: string;
  /** Initial expanded state. @default true */
  defaultExpanded?: boolean;
}

const defaultCollapsedLabel = (count: number) => `${count} ${count === 1 ? "event" : "events"}`;

const AgendaAllDaySection = ({
  children,
  className,
  collapseLabel = "Collapse all-day events",
  collapsedLabel = defaultCollapsedLabel,
  defaultExpanded = true,
  expandLabel = "Expand all-day events",
  ...rest
}: AgendaAllDaySectionProps) => {
  const {slots, state} = useAgendaContext("AllDaySection");
  const [isExpanded, setExpanded] = useState(defaultExpanded);

  const labels: ReactNode[] = [];
  const items: ReactNode[] = [];

  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === AgendaAllDayLabel) labels.push(child);
    else items.push(child);
  }

  const counts = useMemo(() => {
    const first = state.renderedDays[0] ? toDayNumber(state.renderedDays[0]) : 0;
    const result = state.renderedDays.map(() => 0);

    for (const event of state.events) {
      if (!event.isAllDay) continue;
      const range = getAllDayRange(event);

      for (let day = range.first; day <= range.last; day++) {
        const index = day - first;

        if (index >= 0 && index < result.length) result[index]! += 1;
      }
    }

    return result;
  }, [state.events, state.renderedDays]);

  return (
    <div
      className={slots.allDaySection({className})}
      data-expanded={isExpanded || undefined}
      data-slot="agenda-all-day-section"
      {...rest}
    >
      <div className={slots.allDayGutter()} data-slot="agenda-all-day-gutter">
        <button
          aria-expanded={isExpanded}
          aria-label={isExpanded ? collapseLabel : expandLabel}
          className={slots.allDayToggle()}
          data-expanded={isExpanded || undefined}
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          <ToggleChevron />
          {labels.length ? labels : <AgendaAllDayLabel>all-day</AgendaAllDayLabel>}
        </button>
      </div>
      <DaysTrack
        className={slots.allDayGrid()}
        style={{gridTemplateColumns: `repeat(${state.renderedDays.length}, minmax(0px, 1fr))`}}
      >
        <div aria-hidden="true" className={slots.allDayDividers()}>
          {state.renderedDays.map((day) => {
            const dayNumber = toDayNumber(day);

            return (
              <div
                key={dayNumber}
                className={slots.allDayDivider()}
                data-weekend={isWeekend(dayNumber) || undefined}
              />
            );
          })}
        </div>
        {isExpanded
          ? items
          : counts.map((count, index) => (
              <span key={index} className={slots.allDaySummary()} style={{gridColumn: index + 1}}>
                {count > 0 ? collapsedLabel(count) : null}
              </span>
            ))}
      </DaysTrack>
    </div>
  );
};

AgendaAllDaySection.displayName = "HeroUI.Agenda.AllDaySection";

interface AgendaAllDayEventProps extends ComponentPropsWithRef<"div"> {
  event: AgendaEventData;
  /** 0-based column (inside `renderedDays`) of the first covered day. */
  colStart: number;
  /** Number of covered columns. */
  colSpan: number;
  /** 0-based packing row. */
  row: number;
}

const AgendaAllDayEvent = ({
  children,
  className,
  colSpan,
  colStart,
  event,
  onClick,
  onKeyDown,
  ref,
  row,
  style,
  ...rest
}: AgendaAllDayEventProps) => {
  const {slots, state} = useAgendaContext("AllDayEvent");
  const elementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const {focusProps, isFocusVisible} = useFocusRing();
  const handleKeyDown = useEventKeyboard(event);

  usePendingFocus(event, elementRef);

  return (
    <div
      ref={mergedRef}
      className={slots.allDayEvent({className})}
      data-event-id={event.id}
      data-focus-visible={isFocusVisible || undefined}
      data-past={isEventPast(event, state.nowStamp) || undefined}
      data-readonly={event.isReadOnly || undefined}
      data-selected={state.selectedEventId === event.id || undefined}
      data-slot="agenda-all-day-event"
      data-status={event.status ?? "confirmed"}
      role="button"
      tabIndex={0}
      style={
        {
          gridArea: `${row + 1} / ${colStart + 1} / auto / span ${colSpan}`,
          ...getSolidEventColorVars(event.color),
          "--agenda-event-span": colSpan,
          "--agenda-event-start": colStart,
          ...style,
        } as CSSVars
      }
      onBlur={focusProps.onBlur}
      onFocus={focusProps.onFocus}
      onClick={(clickEvent) => {
        state.selectEvent(event.id);
        onClick?.(clickEvent);
      }}
      onKeyDown={(keyEvent) => {
        handleKeyDown(keyEvent);
        onKeyDown?.(keyEvent);
      }}
      {...rest}
    >
      {children ?? event.title}
    </div>
  );
};

AgendaAllDayEvent.displayName = "HeroUI.Agenda.AllDayEvent";

/* -------------------------------------------------------------------------------------------------
 * Time grid
 * -----------------------------------------------------------------------------------------------*/
interface AgendaTimeGridProps extends ComponentPropsWithRef<"div"> {}

const AgendaTimeGrid = ({children, className, onKeyDown, ref, ...rest}: AgendaTimeGridProps) => {
  const {createDateTime, pxPerMinute, requestCreateFocus, slotHeight, slots, state, timeGridRef} =
    useAgendaContext("TimeGrid");
  const mergedRef = useMergedRef(ref, timeGridRef);
  const {focusProps, isFocusVisible} = useFocusRing();
  const gridStart = state.startHour * 60;
  const gridEnd = state.endHour * 60;
  const nowMinute = state.nowStamp % 1440;
  const showsNow = nowMinute >= gridStart && nowMinute < gridEnd;

  const slotStarts = useMemo(() => {
    const result: number[] = [];

    for (let minute = gridStart; minute < gridEnd; minute += state.slotDuration) {
      result.push(minute);
    }

    return result;
  }, [gridStart, gridEnd, state.slotDuration]);

  // When the grid mounts, the hour before the current one goes to the top (navigating and
  // switching between day and week keep the scroll position).
  const nowRef = useRef(nowMinute);

  useLayoutEffect(() => {
    nowRef.current = nowMinute;
  });
  useLayoutEffect(() => {
    const element = timeGridRef.current;

    if (!element) return;
    const target = clamp((Math.floor(nowRef.current / 60) - 1) * 60, gridStart, gridEnd);

    element.scrollTop = (target - gridStart) * pxPerMinute;
  }, [gridStart, gridEnd, pxPerMinute, timeGridRef]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) return;
    if (event.key !== "Enter" || !state.onEventCreate) return;
    event.preventDefault();
    const element = event.currentTarget;
    const firstVisible = gridStart + element.scrollTop / pxPerMinute;
    const start = clamp(
      snapCeil(firstVisible - gridStart, state.slotDuration) + gridStart,
      gridStart,
      gridEnd - state.snapMinutes,
    );
    const end = Math.min(start + state.defaultEventDuration, gridEnd);
    const dateNumber = toDayNumber(state.date);
    const visible = state.visibleDays.map(toDayNumber);
    const day = visible.includes(dateNumber) ? dateNumber : visible[0];

    if (day === undefined) return;
    const startStamp = day * 1440 + start;
    const endStamp = day * 1440 + end;

    if (state.selectedEventId !== null) state.selectEvent(null);
    requestCreateFocus(startStamp, endStamp);
    state.onEventCreate({end: createDateTime(endStamp), start: createDateTime(startStamp)});
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- focusable scroll region (Enter creates an event); mirrors the original DOM, which has no role.
    <div
      ref={mergedRef}
      className={slots.timeGrid({className})}
      data-focus-visible={isFocusVisible || undefined}
      data-slot="agenda-time-grid"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the scroll region must be keyboard focusable (scrolling + Enter to create), as in the original.
      tabIndex={0}
      onBlur={focusProps.onBlur}
      onFocus={focusProps.onFocus}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <div className={slots.timeLabels()} data-slot="agenda-time-labels">
        {slotStarts.map((minute, index) => {
          const distance = Math.abs(minute - nowMinute);

          return (
            <div
              key={minute}
              className={slots.timeLabel()}
              data-slot="agenda-time-label"
              style={{height: `${slotHeight}px`}}
            >
              {index > 0 ? (
                <span style={{opacity: showsNow && distance < TIME_LABEL_COLLISION ? 0 : 1}}>
                  {formatSlotLabel(minute, state.locale, state.hourCycle)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
};

AgendaTimeGrid.displayName = "HeroUI.Agenda.TimeGrid";

/* -------------------------------------------------------------------------------------------------
 * Current time indicator
 * -----------------------------------------------------------------------------------------------*/
interface AgendaCurrentTimeIndicatorProps extends ComponentPropsWithRef<"div"> {}

const AgendaCurrentTimeIndicator = ({
  className,
  style,
  ...rest
}: AgendaCurrentTimeIndicatorProps) => {
  const {pxPerMinute, slots, state} = useAgendaContext("CurrentTimeIndicator");
  const gridStart = state.startHour * 60;
  const nowMinute = state.nowStamp % 1440;

  if (nowMinute < gridStart || nowMinute >= state.endHour * 60) return null;
  const todayIndex = state.renderedDays.findIndex(
    (day) => toDayNumber(day) === Math.floor(state.nowStamp / 1440),
  );
  const count = Math.max(state.renderedDays.length, 1);

  return (
    <div
      className={slots.currentTimeIndicator({className})}
      data-slot="agenda-current-time-indicator"
      style={{top: `${(nowMinute - gridStart) * pxPerMinute}px`, ...style}}
      {...rest}
    >
      <div className={slots.currentTimeLabelWrap()}>
        <span className={slots.currentTimeLabel()} data-slot="agenda-current-time-label">
          {formatTime(
            {hour: Math.floor(nowMinute / 60), minute: nowMinute % 60},
            state.locale,
            state.hourCycle,
          )}
        </span>
      </div>
      {/* The line is only drawn while today is among the rendered days; the label always shows. */}
      {todayIndex >= 0 ? (
        <div className={slots.currentTimeTrack()} data-slot="agenda-current-time-line">
          <div className={slots.currentTimeLineFaded()} />
          <DaysTrack>
            <div
              className={slots.currentTimeLineActive()}
              style={{left: pct((todayIndex / count) * 100), width: pct(100 / count)}}
            />
          </DaysTrack>
        </div>
      ) : null}
    </div>
  );
};

AgendaCurrentTimeIndicator.displayName = "HeroUI.Agenda.CurrentTimeIndicator";

/* -------------------------------------------------------------------------------------------------
 * Day columns
 * -----------------------------------------------------------------------------------------------*/
interface AgendaDayColumnsProps extends ComponentPropsWithRef<"div"> {}

const AgendaDayColumns = ({children, className, ...rest}: AgendaDayColumnsProps) => {
  const {slots, state} = useAgendaContext("DayColumns");

  return (
    <DaysTrack
      outerClassName={slots.dayColumns({className})}
      outerProps={rest}
      outerSlot="agenda-day-columns"
    >
      {children ??
        // Without children: one column (with its events) per rendered day.
        state.renderedDays.map((day) => (
          <AgendaDayColumn key={day.toString()} date={day}>
            {state.getEventsForDay(day).map((event) => (
              <AgendaEvent key={event.id} event={event} />
            ))}
          </AgendaDayColumn>
        ))}
    </DaysTrack>
  );
};

AgendaDayColumns.displayName = "HeroUI.Agenda.DayColumns";

interface AgendaDayColumnProps extends ComponentPropsWithRef<"div"> {
  /** The day rendered by this column. */
  date: CalendarDate;
}

const AgendaDayColumn = ({
  children,
  className,
  date,
  onMouseDown,
  ref,
  ...rest
}: AgendaDayColumnProps) => {
  const {createDateTime, pxPerMinute, registerColumn, slots, state} = useAgendaContext("DayColumn");
  const {create, drag, setCreate} = use(AgendaInteractionContext);
  const dayNumber = toDayNumber(date);
  const gridStart = state.startHour * 60;
  const gridEnd = state.endHour * 60;
  const isVisible = state.visibleDays.some((day) => toDayNumber(day) === dayNumber);

  const columnRef = useCallback(
    (element: HTMLDivElement | null) => (element ? registerColumn(dayNumber, element) : undefined),
    [registerColumn, dayNumber],
  );
  const mergedRef = useMergedRef(ref, columnRef);

  const slotCount = Math.max(Math.ceil((gridEnd - gridStart) / state.slotDuration), 0);

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    onMouseDown?.(event);
    const {onEventCreate, snapMinutes} = state;

    if (event.defaultPrevented || event.button !== 0 || !onEventCreate) return;
    if ((event.target as Element).closest(".agenda__event")) return;
    if (Date.now() - lastTouchTime < 800) return;
    const column = event.currentTarget;
    const minuteAt = (clientY: number) =>
      clamp(
        gridStart + (clientY - column.getBoundingClientRect().top) / pxPerMinute,
        gridStart,
        gridEnd,
      );
    const anchor = clamp(
      snapFloor(minuteAt(event.clientY), snapMinutes),
      gridStart,
      gridEnd - snapMinutes,
    );
    const startY = event.clientY;
    let range = {end: anchor + snapMinutes, start: anchor};
    let moved = false;

    if (state.selectedEventId !== null) state.selectEvent(null);
    setCreate({day: dayNumber, ...range});

    const move = (moveEvent: MouseEvent) => {
      if (!moved && Math.abs(moveEvent.clientY - startY) < 3) return;
      moved = true;
      const minute = minuteAt(moveEvent.clientY);

      range =
        minute >= anchor
          ? {
              end: Math.min(Math.max(anchor + snapMinutes, snapCeil(minute, snapMinutes)), gridEnd),
              start: anchor,
            }
          : {end: anchor + snapMinutes, start: Math.max(snapFloor(minute, snapMinutes), gridStart)};
      setCreate({day: dayNumber, ...range});
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      setCreate(null);
      const end = moved ? range.end : Math.min(anchor + state.defaultEventDuration, gridEnd);
      const start = moved ? range.start : anchor;

      onEventCreate({
        end: createDateTime(dayNumber * 1440 + end),
        start: createDateTime(dayNumber * 1440 + start),
      });
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  const createPreview = create && create.day === dayNumber ? create : null;
  const dropPreview = drag && drag.kind === "move" && drag.targetDay === dayNumber ? drag : null;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mouse-only drag-to-create surface; keyboard creation is the time grid's Enter handler. Mirrors the original DOM (no role).
    <div
      ref={mergedRef}
      aria-hidden={isVisible ? undefined : true}
      className={slots.dayColumn({className})}
      data-date={date.toString()}
      data-slot="agenda-day-column"
      data-weekend={isWeekend(dayNumber) || undefined}
      inert={!isVisible}
      onMouseDown={handleMouseDown}
      {...rest}
    >
      {Array.from({length: slotCount}, (_, index) => (
        <div
          key={index}
          className={slots.timeSlot()}
          data-last={index === slotCount - 1 || undefined}
          data-slot="agenda-time-slot"
          data-slot-index={index}
        />
      ))}
      {children}
      {createPreview ? (
        <div
          className={slots.createPreview()}
          style={{
            height: `calc(${(createPreview.end - createPreview.start) * pxPerMinute}px - var(--agenda-event-gap, 0px))`,
            top: `${(createPreview.start - gridStart) * pxPerMinute}px`,
          }}
        />
      ) : null}
      {dropPreview ? (
        <div
          className={slots.dropPreview()}
          style={{
            borderColor: dropPreview.color ?? "var(--color-accent)",
            height: `calc(${dropPreview.duration * pxPerMinute}px - var(--agenda-event-gap, 0px))`,
            top: `${(dropPreview.targetStart - gridStart) * pxPerMinute}px`,
          }}
        />
      ) : null}
    </div>
  );
};

AgendaDayColumn.displayName = "HeroUI.Agenda.DayColumn";

/* -------------------------------------------------------------------------------------------------
 * Event (timed, day / week views)
 * -----------------------------------------------------------------------------------------------*/
interface AgendaEventProps extends ComponentPropsWithRef<"div"> {
  event: AgendaEventData;
}

const AgendaEvent = ({
  children,
  className,
  event,
  onKeyDown,
  onPointerDown,
  ref,
  style,
  ...rest
}: AgendaEventProps) => {
  const {createDateTime, direction, getColumnAt, pxPerMinute, requestFocus, slots, state} =
    useAgendaContext("Event");
  const {drag, setDrag} = use(AgendaInteractionContext);
  const elementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const {focusProps, isFocusVisible} = useFocusRing();

  usePendingFocus(event, elementRef);

  const gridStart = state.startHour * 60;
  const gridEnd = state.endHour * 60;
  const range = getTimedRange(event);
  const startDay = toDayNumber(event.start);
  const startStamp = toMinuteStamp(event.start);
  const endStamp = toMinuteStamp(event.end);
  const drawnEnd = Math.max(range.end, range.start + state.snapMinutes);
  const canMove = Boolean(state.onEventMove) && !event.isReadOnly;
  const canResize = Boolean(state.onEventResize) && !event.isReadOnly;

  const activeDrag = drag && drag.eventId === event.id ? drag : null;
  const isDragging = activeDrag?.kind === "move";
  const isResizing = activeDrag?.kind === "resize";
  const top = clamp(range.start, gridStart, gridEnd);
  const bottom = clamp(isResizing ? activeDrag.endMinute : drawnEnd, gridStart, gridEnd);
  const isShort = (clamp(drawnEnd, gridStart, gridEnd) - top) * pxPerMinute < SHORT_EVENT_HEIGHT;
  const layout = state.getTimedLayout(event);
  const isOutsideGrid = range.start >= gridEnd || drawnEnd <= gridStart;

  /* Move (pointer) ---------------------------------------------------------------------------- */
  const handlePointerDown = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(pointerEvent);
    if (pointerEvent.defaultPrevented || pointerEvent.button !== 0) return;
    if (pointerEvent.pointerType === "touch") return;
    if ((pointerEvent.target as Element).closest(".agenda__resize-handle")) return;
    // Cancelling the pointerdown also suppresses the compatibility mousedown (create).
    pointerEvent.preventDefault();
    const element = pointerEvent.currentTarget;
    const startX = pointerEvent.clientX;
    const startY = pointerEvent.clientY;
    const duration = drawnEnd - range.start;
    let dragging = false;
    let target = {day: startDay, start: range.start};

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerEvent.pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragging) {
        if (!canMove || Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragging = true;
      }
      const day = getColumnAt(moveEvent.clientX) ?? startDay;
      const start = clamp(
        snapRound(range.start + dy / pxPerMinute, state.snapMinutes),
        gridStart,
        Math.max(gridStart, gridEnd - duration),
      );

      target = {day, start};
      setDrag({
        color: event.color,
        duration,
        dx,
        dy,
        eventId: event.id,
        kind: "move",
        targetDay: day,
        targetStart: start,
      });
    };
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!dragging) {
        if (upEvent.type === "pointerup") {
          state.selectEvent(event.id);
          element.focus({preventScroll: true});
        }

        return;
      }
      setDrag(null);
      if (upEvent.type !== "pointerup") return;
      const nextStart = target.day * 1440 + target.start;

      if (nextStart !== startStamp) {
        requestFocus(event.id);
        state.onEventMove?.(
          event.id,
          createDateTime(nextStart),
          createDateTime(nextStart + (endStamp - startStamp)),
        );
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* Resize (bottom handle) -------------------------------------------------------------------- */
  const handleResizeDown = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerEvent.button !== 0 || pointerEvent.pointerType === "touch") return;
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    const startY = pointerEvent.clientY;
    let endMinute = drawnEnd;

    setDrag({endMinute, eventId: event.id, kind: "resize"});
    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerEvent.pointerId) return;
      endMinute = clamp(
        snapRound(range.end + (moveEvent.clientY - startY) / pxPerMinute, state.snapMinutes),
        range.start + state.snapMinutes,
        gridEnd,
      );
      setDrag({endMinute, eventId: event.id, kind: "resize"});
    };
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDrag(null);
      if (upEvent.type !== "pointerup" || endMinute === range.end) return;
      state.onEventResize?.(event.id, event.start, createDateTime(startDay * 1440 + endMinute));
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* Keyboard ---------------------------------------------------------------------------------- */
  const handleArrow = (key: string, shiftKey: boolean) => {
    const step = state.snapMinutes;

    if (shiftKey && (key === "ArrowUp" || key === "ArrowDown")) {
      if (!canResize) return false;
      const nextEnd = clamp(
        range.end + (key === "ArrowDown" ? step : -step),
        range.start + step,
        gridEnd,
      );

      if (nextEnd !== range.end) {
        requestFocus(event.id);
        state.onEventResize?.(event.id, event.start, createDateTime(startDay * 1440 + nextEnd));
      }

      return true;
    }
    if (!canMove) return false;
    let delta = 0;

    if (key === "ArrowUp" || key === "ArrowDown") {
      const duration = drawnEnd - range.start;
      const nextStart = clamp(
        range.start + (key === "ArrowDown" ? step : -step),
        gridStart,
        gridEnd - duration,
      );

      delta = nextStart - range.start;
    } else {
      const forward = (key === "ArrowRight") !== (direction === "rtl");
      const visible = state.visibleDays.map(toDayNumber);
      const nextDay = startDay + (forward ? 1 : -1);

      if (!visible.includes(nextDay)) return true;
      delta = (forward ? 1 : -1) * 1440;
    }
    if (delta !== 0) {
      requestFocus(event.id);
      state.onEventMove?.(
        event.id,
        createDateTime(startStamp + delta),
        createDateTime(endStamp + delta),
      );
    }

    return true;
  };
  const handleKeyDown = useEventKeyboard(event, handleArrow);

  if (isOutsideGrid) return null;

  const placement: CSSProperties =
    layout && layout.columns > 1
      ? {
          left: `calc(${pct((layout.column / layout.columns) * 100)} + 2px)`,
          right: "auto",
          width: `calc(${pct(100 / layout.columns)} - 4px)`,
        }
      : {};

  return (
    <div
      ref={mergedRef}
      className={slots.event({className})}
      data-dragging={isDragging || undefined}
      data-event-id={event.id}
      data-focus-visible={isFocusVisible || undefined}
      data-past={isEventPast(event, state.nowStamp) || undefined}
      data-readonly={event.isReadOnly || undefined}
      data-resizing={isResizing || undefined}
      data-selected={state.selectedEventId === event.id || undefined}
      data-short={isShort || undefined}
      data-slot="agenda-event"
      data-status={event.status ?? "confirmed"}
      role="button"
      tabIndex={0}
      style={
        {
          top: `${(top - gridStart) * pxPerMinute}px`,
          ...placement,
          ...getTimedEventColorVars(event.color),
          height: `calc(${(bottom - top) * pxPerMinute}px - var(--agenda-event-gap, 0px))`,
          transform: isDragging ? dragTransform(activeDrag.dx, activeDrag.dy) : "none",
          willChange: isDragging ? "transform" : undefined,
          ...style,
        } as CSSVars
      }
      onBlur={focusProps.onBlur}
      onFocus={focusProps.onFocus}
      onPointerDown={handlePointerDown}
      onKeyDown={(keyEvent) => {
        handleKeyDown(keyEvent);
        onKeyDown?.(keyEvent);
      }}
      {...rest}
    >
      {children ?? (
        <>
          <span className={slots.eventTitle()} data-slot="agenda-event-title">
            {event.title}
          </span>
          <span className={slots.eventTime()} data-slot="agenda-event-time">
            {formatEventTime(event, state.locale, state.hourCycle, isShort)}
          </span>
        </>
      )}
      {canResize ? (
        <div aria-hidden="true" className={slots.resizeHandle()} onPointerDown={handleResizeDown} />
      ) : null}
    </div>
  );
};

AgendaEvent.displayName = "HeroUI.Agenda.Event";

/* -------------------------------------------------------------------------------------------------
 * Month grid
 * -----------------------------------------------------------------------------------------------*/
interface AgendaMonthGridProps extends ComponentPropsWithRef<"div"> {}

const AgendaMonthGrid = ({children, className, ...rest}: AgendaMonthGridProps) => {
  const {slots, state} = useAgendaContext("MonthGrid");
  const todayNumber = toDayNumber(state.today);
  const firstWeek = state.visibleWeeks[0] ?? [];
  const showsToday = state.visibleWeeks.some((week) =>
    week.some((day) => toDayNumber(day) === todayNumber),
  );

  return (
    <div className={slots.monthGrid({className})} data-slot="agenda-month-grid" {...rest}>
      <div className={slots.monthWeekdayHeader()} data-slot="agenda-month-weekday-header">
        {firstWeek.map((day) => {
          const dayNumber = toDayNumber(day);
          const isToday = showsToday && (dayNumber - todayNumber) % 7 === 0;

          return (
            <div
              key={dayNumber}
              className={slots.monthWeekday()}
              data-slot="agenda-month-weekday"
              data-today={isToday || undefined}
            >
              {formatWeekday(day, state.locale)}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
};

AgendaMonthGrid.displayName = "HeroUI.Agenda.MonthGrid";

interface AgendaMonthRowProps extends ComponentPropsWithRef<"div"> {
  /** Bar rows used by the multi-day events of this week (fallback for cells without their own count). */
  spanningRowCount?: number;
}

const MonthRowContext = createContext(0);

const AgendaMonthRow = ({
  children,
  className,
  spanningRowCount = 0,
  ...rest
}: AgendaMonthRowProps) => {
  const {slots} = useAgendaContext("MonthRow");

  return (
    <MonthRowContext value={spanningRowCount}>
      <div className={slots.monthRow({className})} data-slot="agenda-month-row" {...rest}>
        {children}
      </div>
    </MonthRowContext>
  );
};

AgendaMonthRow.displayName = "HeroUI.Agenda.MonthRow";

interface AgendaMonthCellProps extends ComponentPropsWithRef<"div"> {
  /** The day of the cell. */
  date: CalendarDate;
  /** Events listed before the overflow button. @default 2 */
  maxEvents?: number;
  /** Text of the overflow button. @default "N more" */
  moreLabel?: (count: number) => string;
  /** Bar rows (multi-day events) drawn over this cell. @default 0 */
  spanningRowCount?: number;
}

const defaultMoreLabel = (count: number) => `${count} more`;

const AgendaMonthCell = ({
  children,
  className,
  date,
  maxEvents = 2,
  moreLabel = defaultMoreLabel,
  ref,
  spanningRowCount: spanningRowCountProp,
  style,
  ...rest
}: AgendaMonthCellProps) => {
  const {registerCell, slots, state} = useAgendaContext("MonthCell");
  const {drag} = use(AgendaInteractionContext);
  const spanningRowCount = spanningRowCountProp ?? use(MonthRowContext);
  const dayNumber = toDayNumber(date);
  const isToday = dayNumber === toDayNumber(state.today) || undefined;
  const isOutside = date.month !== state.date.month || date.year !== state.date.year;
  const isDropTarget = drag?.kind === "month-move" && drag.targetDay === dayNumber;
  const cellRef = useCallback(
    (element: HTMLDivElement | null) => (element ? registerCell(dayNumber, element) : undefined),
    [registerCell, dayNumber],
  );
  const mergedRef = useMergedRef(ref, cellRef);
  const items = Children.toArray(children);
  const hidden = Math.max(items.length - maxEvents, 0);

  const openDay = () => {
    state.setDate(date);
    state.setView("day");
  };

  return (
    <div
      ref={mergedRef}
      className={slots.monthCell({className})}
      data-date={date.toString()}
      data-drop-target={isDropTarget || undefined}
      data-outside-month={isOutside || undefined}
      data-slot="agenda-month-cell"
      data-today={isToday}
      data-weekend={isWeekend(dayNumber) || undefined}
      style={
        {
          "--agenda-month-spanning-zone":
            spanningRowCount > 0
              ? `calc(${spanningRowCount} * var(--agenda-month-event-height) + ${spanningRowCount - 1} * var(--agenda-month-event-gap) + 6px)`
              : "0px",
          ...(isDropTarget && drag.color ? {"--agenda-drop-color": drag.color} : null),
          ...style,
        } as CSSVars
      }
      {...rest}
    >
      <button
        className={slots.monthCellDate()}
        data-slot="agenda-month-cell-date"
        data-today={isToday}
        type="button"
        onClick={openDay}
      >
        {date.day === 1 ? formatMonthDay(date, state.locale) : formatDayNumber(date, state.locale)}
      </button>
      {hidden > 0 ? items.slice(0, maxEvents) : items}
      {hidden > 0 ? (
        <button
          className={slots.monthCellMore()}
          data-slot="agenda-month-cell-more"
          type="button"
          onClick={openDay}
        >
          {moreLabel(hidden)}
        </button>
      ) : null}
    </div>
  );
};

AgendaMonthCell.displayName = "HeroUI.Agenda.MonthCell";

interface AgendaMonthSpanningEventProps extends ComponentPropsWithRef<"div"> {
  event: AgendaEventData;
  /** 0-based column (inside the week) of the first covered day. */
  colStart: number;
  /** Number of covered days. */
  colSpan: number;
  /** 0-based bar row. */
  row: number;
}

const AgendaMonthSpanningEvent = ({
  children,
  className,
  colSpan,
  colStart,
  event,
  onClick,
  onKeyDown,
  ref,
  row,
  style,
  ...rest
}: AgendaMonthSpanningEventProps) => {
  const {slots, state} = useAgendaContext("MonthSpanningEvent");
  const elementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const {focusProps, isFocusVisible} = useFocusRing();
  const handleKeyDown = useEventKeyboard(event);

  usePendingFocus(event, elementRef);

  return (
    <div
      ref={mergedRef}
      className={slots.monthSpanningEvent({className})}
      data-event-id={event.id}
      data-focus-visible={isFocusVisible || undefined}
      data-past={isEventPast(event, state.nowStamp) || undefined}
      data-readonly={event.isReadOnly || undefined}
      data-selected={state.selectedEventId === event.id || undefined}
      data-slot="agenda-month-spanning-event"
      data-status={event.status ?? "confirmed"}
      role="button"
      tabIndex={0}
      style={
        {
          height: "var(--agenda-month-event-height)",
          left: `calc(${pct((colStart / 7) * 100)} + 2px)`,
          position: "absolute",
          top: `calc(var(--agenda-month-date-offset) + ${row} * (var(--agenda-month-event-height) + var(--agenda-month-event-gap)) + 2px)`,
          width: `calc(${pct((colSpan / 7) * 100)} - 4px)`,
          ...getSolidEventColorVars(event.color),
          ...style,
        } as CSSVars
      }
      onBlur={focusProps.onBlur}
      onFocus={focusProps.onFocus}
      onClick={(clickEvent) => {
        state.selectEvent(event.id);
        onClick?.(clickEvent);
      }}
      onKeyDown={(keyEvent) => {
        handleKeyDown(keyEvent);
        onKeyDown?.(keyEvent);
      }}
      {...rest}
    >
      {children ?? event.title}
    </div>
  );
};

AgendaMonthSpanningEvent.displayName = "HeroUI.Agenda.MonthSpanningEvent";

interface AgendaMonthEventProps extends ComponentPropsWithRef<"div"> {
  event: AgendaEventData;
}

const AgendaMonthEvent = ({
  children,
  className,
  event,
  onKeyDown,
  onPointerDown,
  ref,
  style,
  ...rest
}: AgendaMonthEventProps) => {
  const {createDateTime, direction, getCellAt, requestFocus, slots, state} =
    useAgendaContext("MonthEvent");
  const {drag, setDrag} = use(AgendaInteractionContext);
  const elementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRef(ref, elementRef);
  const {focusProps, isFocusVisible} = useFocusRing();
  const canMove = Boolean(state.onEventMove) && !event.isReadOnly;
  const startStamp = toMinuteStamp(event.start);
  const endStamp = toMinuteStamp(event.end);
  const startDay = toDayNumber(event.start);
  const activeDrag = drag?.kind === "month-move" && drag.eventId === event.id ? drag : null;

  usePendingFocus(event, elementRef);

  const moveBy = (days: number) => {
    if (!days) return;
    requestFocus(event.id);
    state.onEventMove?.(
      event.id,
      createDateTime(startStamp + days * 1440),
      createDateTime(endStamp + days * 1440),
    );
  };

  const handlePointerDown = (pointerEvent: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(pointerEvent);
    if (pointerEvent.defaultPrevented || pointerEvent.button !== 0) return;
    if (pointerEvent.pointerType === "touch") return;
    pointerEvent.preventDefault();
    const element = pointerEvent.currentTarget;
    const startX = pointerEvent.clientX;
    const startY = pointerEvent.clientY;
    let dragging = false;
    let targetDay: number | null = null;

    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerEvent.pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragging) {
        if (!canMove || Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragging = true;
      }
      targetDay = getCellAt(moveEvent.clientX, moveEvent.clientY);
      setDrag({color: event.color, dx, dy, eventId: event.id, kind: "month-move", targetDay});
    };
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerEvent.pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!dragging) {
        if (upEvent.type === "pointerup") {
          state.selectEvent(event.id);
          element.focus({preventScroll: true});
        }

        return;
      }
      setDrag(null);
      if (upEvent.type === "pointerup" && targetDay !== null) moveBy(targetDay - startDay);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const handleArrow = (key: string, shiftKey: boolean) => {
    if (shiftKey || !canMove) return false;
    if (key === "ArrowUp") moveBy(-7);
    else if (key === "ArrowDown") moveBy(7);
    else moveBy((key === "ArrowRight") !== (direction === "rtl") ? 1 : -1);

    return true;
  };
  const handleKeyDown = useEventKeyboard(event, handleArrow);

  return (
    <div
      ref={mergedRef}
      className={slots.monthEvent({className})}
      data-dragging={activeDrag ? true : undefined}
      data-event-id={event.id}
      data-focus-visible={isFocusVisible || undefined}
      data-past={isEventPast(event, state.nowStamp) || undefined}
      data-readonly={event.isReadOnly || undefined}
      data-selected={state.selectedEventId === event.id || undefined}
      data-slot="agenda-month-event"
      data-status={event.status ?? "confirmed"}
      role="button"
      tabIndex={0}
      style={
        {
          ...getMonthEventColorVars(event.color),
          transform: activeDrag ? dragTransform(activeDrag.dx, activeDrag.dy) : "none",
          ...style,
        } as CSSVars
      }
      onBlur={focusProps.onBlur}
      onFocus={focusProps.onFocus}
      onPointerDown={handlePointerDown}
      onKeyDown={(keyEvent) => {
        handleKeyDown(keyEvent);
        onKeyDown?.(keyEvent);
      }}
      {...rest}
    >
      {children ?? event.title}
    </div>
  );
};

AgendaMonthEvent.displayName = "HeroUI.Agenda.MonthEvent";

/* -------------------------------------------------------------------------------------------------
 * Exports
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
  AgendaEvent,
  AgendaMonthGrid,
  AgendaMonthRow,
  AgendaMonthCell,
  AgendaMonthSpanningEvent,
  AgendaMonthEvent,
};

export type {
  AgendaRootProps,
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
};
