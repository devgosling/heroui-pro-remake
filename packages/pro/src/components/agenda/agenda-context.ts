"use client";

import type {CalendarDateTime} from "./agenda-date";
import type {agendaVariants} from "./agenda.styles";
import type {AgendaState} from "./use-agenda";
import type {CSSProperties, RefObject} from "react";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * Interaction state (drag / resize / create)
 * -----------------------------------------------------------------------------------------------*/
export type AgendaDragState =
  | {
      kind: "move";
      eventId: string;
      dx: number;
      dy: number;
      /** Day number of the column under the pointer. */
      targetDay: number;
      /** Snapped start minute inside the target day. */
      targetStart: number;
      /** Drawn duration in minutes. */
      duration: number;
      color?: string;
    }
  | {
      kind: "resize";
      eventId: string;
      /** Snapped end minute inside the event's day. */
      endMinute: number;
    }
  | {
      kind: "month-move";
      eventId: string;
      dx: number;
      dy: number;
      /** Day number of the cell under the pointer. */
      targetDay: number | null;
      color?: string;
    };

export interface AgendaCreateState {
  day: number;
  start: number;
  end: number;
}

export interface AgendaInteractionContextValue {
  drag: AgendaDragState | null;
  setDrag: (drag: AgendaDragState | null) => void;
  create: AgendaCreateState | null;
  setCreate: (create: AgendaCreateState | null) => void;
}

export const AgendaInteractionContext = createContext<AgendaInteractionContextValue>({
  create: null,
  drag: null,
  setCreate: () => {},
  setDrag: () => {},
});

/* -------------------------------------------------------------------------------------------------
 * Agenda context
 * -----------------------------------------------------------------------------------------------*/
export interface AgendaContextValue {
  state: AgendaState;
  slots: ReturnType<typeof agendaVariants>;
  /** Height of one time slot in px (read from `--agenda-slot-height`). */
  slotHeight: number;
  pxPerMinute: number;
  direction: "ltr" | "rtl";
  rootRef: RefObject<HTMLDivElement | null>;
  timeGridRef: RefObject<HTMLDivElement | null>;
  /** Inline style shared by every days track (width + translate). */
  trackStyle: CSSProperties;
  registerTrack: (element: HTMLDivElement) => () => void;
  registerColumn: (day: number, element: HTMLElement) => () => void;
  registerCell: (day: number, element: HTMLElement) => () => void;
  /** Day number of the day column under `clientX` (nearest column when outside). */
  getColumnAt: (clientX: number) => number | null;
  /** Day number of the month cell under the point. */
  getCellAt: (clientX: number, clientY: number) => number | null;
  /** Asks the event with `id` to take focus after the next render. */
  requestFocus: (id: string) => void;
  /** Asks the event created with these stamps to take focus once it appears. */
  requestCreateFocus: (start: number, end: number) => void;
  /** Returns true (once) when the event should take focus now. */
  consumeFocus: (id: string, start: number, end: number) => boolean;
  /** Moves focus to the time grid (day / week) or the root (month). */
  focusFallback: () => void;
  /** Builds a date-time of the caller's class from a minute stamp. */
  createDateTime: (stamp: number) => CalendarDateTime;
}

export const AgendaContext = createContext<AgendaContextValue | null>(null);

export function useAgendaContext(part: string): AgendaContextValue {
  const context = use(AgendaContext);

  if (!context) throw new Error(`<Agenda.${part}> must be rendered inside <Agenda>.`);

  return context;
}
