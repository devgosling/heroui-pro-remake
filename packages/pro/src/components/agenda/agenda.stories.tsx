import type {CalendarDateTime} from "./agenda-date";
import type {AgendaEvent, UseAgendaOptions} from "./index";
import type {Meta, StoryObj} from "@storybook/react";

import React, {useCallback, useState, useSyncExternalStore} from "react";

import {createDateTime, getLocalTimeZone, toDayNumber, today} from "./agenda-date";

import {Agenda, useAgenda} from "./index";

/* -------------------------------------------------------------------------------------------------
 * Demo data (relative to today so the week always has past, current and upcoming events)
 * -----------------------------------------------------------------------------------------------*/
const COLORS = ["#0ea5e9", "#f97316", "#a855f7", "#22c55e", "#ec4899", "#eab308"];

function at(dayOffset: number, hour: number, minute = 0): CalendarDateTime {
  const base = today(getLocalTimeZone());
  const date = new Date(Date.UTC(base.year, base.month - 1, base.day + dayOffset));

  return createDateTime(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    hour,
    minute,
  );
}

function createDemoEvents(): AgendaEvent[] {
  return [
    // All-day
    {
      color: "#14b8a6",
      end: at(3, 0),
      id: "offsite",
      isAllDay: true,
      start: at(0, 0),
      title: "Design offsite",
    },
    {
      color: "#6366f1",
      end: at(1, 0),
      id: "summit",
      isAllDay: true,
      start: at(0, 0),
      title: "Product summit",
    },
    {
      color: "#14b8a6",
      end: at(14, 0),
      id: "freeze",
      isAllDay: true,
      start: at(13, 0),
      title: "Release freeze",
    },
    // Yesterday
    {
      color: "#f97316",
      end: at(-1, 11, 30),
      id: "kickoff",
      start: at(-1, 10),
      title: "Project kickoff",
    },
    // Today
    {end: at(0, 9, 30), id: "sync", start: at(0, 9), title: "Morning sync"},
    {color: "#ec4899", end: at(0, 13), id: "brunch", start: at(0, 12), title: "Team brunch"},
    {
      color: "#0ea5e9",
      end: at(0, 15, 30),
      id: "interview",
      start: at(0, 14),
      title: "Interview loop",
    },
    {color: "#22c55e", end: at(0, 16, 30), id: "mentoring", start: at(0, 16), title: "Mentoring"},
    {color: "#f97316", end: at(0, 10), id: "roadmap", start: at(0, 9), title: "Roadmap review"},
    {
      color: "#a855f7",
      end: at(0, 10, 15),
      id: "infra",
      start: at(0, 9, 15),
      title: "Infra check-in",
    },
    {
      color: "#e11d48",
      end: at(0, 15, 30),
      id: "vendor",
      start: at(0, 14, 30),
      title: "Vendor call",
    },
    {
      color: "#06b6d4",
      end: at(0, 14, 20),
      id: "question",
      start: at(0, 14),
      title: "Quick question",
    },
    {color: "#84cc16", end: at(0, 15), id: "notes", start: at(0, 14, 40), title: "Notes cleanup"},
    {
      color: "#0ea5e9",
      end: at(0, 11, 15),
      id: "triage",
      start: at(0, 10, 15),
      status: "unconfirmed",
      title: "Backlog triage",
    },
    // Upcoming
    {
      color: "#64748b",
      end: at(1, 10),
      id: "townhall",
      isReadOnly: true,
      start: at(1, 9),
      title: "Town hall",
    },
    {
      color: "#f97316",
      end: at(1, 14),
      id: "partner",
      start: at(1, 13),
      status: "declined",
      title: "Partner demo",
    },
    {color: "#22c55e", end: at(2, 12), id: "pairing", start: at(2, 11), title: "Pairing session"},
    {color: "#a855f7", end: at(3, 16), id: "retro", start: at(3, 15), title: "Sprint retro"},
    {
      color: "#0ea5e9",
      end: at(8, 10, 30),
      id: "quarterly",
      start: at(8, 9),
      title: "Quarterly planning",
    },
    {color: "#e11d48", end: at(9, 16, 30), id: "coffee", start: at(9, 16), title: "Coffee chat"},
  ];
}

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/
const MOBILE_QUERY = "(max-width: 639px)";

function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(MOBILE_QUERY);

      query.addEventListener("change", onChange);

      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

type DemoProps = Omit<UseAgendaOptions, "events">;

let createdCount = 0;

function AgendaDemo(props: DemoProps) {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState(createDemoEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const updateEvent = useCallback(
    (id: string, start: CalendarDateTime, end: CalendarDateTime) =>
      setEvents((current) =>
        current.map((event) => (event.id === id ? {...event, end, start} : event)),
      ),
    [],
  );

  const agenda = useAgenda({
    allowsSwipe: true,
    events,
    onEventCreate: isMobile
      ? undefined
      : ({end, start}) => {
          createdCount += 1;
          setEvents((current) => [
            ...current,
            {
              color: COLORS[createdCount % COLORS.length],
              end,
              id: `created-${createdCount}`,
              start,
              title: "Untitled event",
            },
          ]);
        },
    onEventDelete: (id) => setEvents((current) => current.filter((event) => event.id !== id)),
    onEventMove: isMobile ? undefined : updateEvent,
    onEventResize: isMobile ? undefined : updateEvent,
    onEventSelect: setSelectedEventId,
    selectedEventId,
    snapMinutes: 15,
    weekDays: isMobile ? 3 : 7,
    ...props,
  });

  return (
    <div style={{height: 600, width: "100%"}}>
      <Agenda {...agenda}>
        <Agenda.Header>
          <Agenda.Heading />
          <Agenda.ViewSelector />
          <Agenda.Navigation>
            <Agenda.NavButton slot="previous" />
            <Agenda.TodayButton />
            <Agenda.NavButton slot="next" />
          </Agenda.Navigation>
        </Agenda.Header>
        <Agenda.Body>
          {agenda.view === "month" ? (
            <Agenda.MonthGrid>
              {agenda.visibleWeeks.map((week) => {
                const layout = agenda.getMonthRowLayout(week);

                return (
                  <Agenda.MonthRow key={toDayNumber(week[0]!)} spanningRowCount={layout.rowCount}>
                    {layout.spanningEvents.map((item) => (
                      <Agenda.MonthSpanningEvent
                        key={item.event.id}
                        colSpan={item.colSpan}
                        colStart={item.colStart}
                        event={item.event}
                        row={item.row}
                      />
                    ))}
                    {week.map((day, index) => (
                      <Agenda.MonthCell
                        key={day.toString()}
                        date={day}
                        maxEvents={isMobile ? 1 : 2}
                        spanningRowCount={layout.cellRowCounts[index]}
                      >
                        {agenda.getPerCellEvents(day, week).map((event) => (
                          <Agenda.MonthEvent key={event.id} event={event} />
                        ))}
                      </Agenda.MonthCell>
                    ))}
                  </Agenda.MonthRow>
                );
              })}
            </Agenda.MonthGrid>
          ) : (
            <>
              <Agenda.WeekHeader />
              <Agenda.AllDaySection>
                <Agenda.AllDayLabel>all-day</Agenda.AllDayLabel>
                {agenda.allDayLayout.map((item) => (
                  <Agenda.AllDayEvent
                    key={item.event.id}
                    colSpan={item.colSpan}
                    colStart={item.colStart}
                    event={item.event}
                    row={item.row}
                  />
                ))}
              </Agenda.AllDaySection>
              <Agenda.TimeGrid>
                <Agenda.CurrentTimeIndicator />
                <Agenda.DayColumns>
                  {agenda.renderedDays.map((day) => (
                    <Agenda.DayColumn key={day.toString()} date={day}>
                      {agenda.getEventsForDay(day).map((event) => (
                        <Agenda.Event key={event.id} event={event} />
                      ))}
                    </Agenda.DayColumn>
                  ))}
                </Agenda.DayColumns>
              </Agenda.TimeGrid>
            </>
          )}
        </Agenda.Body>
      </Agenda>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Meta
 * -----------------------------------------------------------------------------------------------*/
const meta = {
  argTypes: {
    allowsSwipe: {control: "boolean"},
    defaultView: {control: {type: "select"}, options: ["day", "week", "month"]},
    endHour: {control: {max: 24, min: 1, type: "number"}},
    firstDayOfWeek: {
      control: {type: "select"},
      options: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
    },
    hourCycle: {control: {type: "select"}, options: [12, 24]},
    slotDuration: {control: {type: "select"}, options: [15, 30, 60]},
    snapMinutes: {control: {type: "select"}, options: [5, 10, 15, 30]},
    startHour: {control: {max: 23, min: 0, type: "number"}},
    weekDays: {control: {max: 7, min: 1, type: "number"}},
  },
  component: AgendaDemo,
  parameters: {layout: "padded"},
  title: "Pro/DataDisplay/Agenda",
} satisfies Meta<typeof AgendaDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {defaultView: "week"},
};
