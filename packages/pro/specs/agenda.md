# Agenda — clean-room implementation spec

Slug: `agenda` · Docs: https://heroui.pro/docs/react/components/agenda · Category: Data display
Import (Pro): `import {Agenda, useAgenda} from "@heroui-pro/react";`
Remake: `import {Agenda, useAgenda} from "@heroui/pro/agenda";` (root export allowed, no heavy peer)

Sources: public docs text (API tables, CSS classes, CSS variables, data attributes, keyboard notes), the
rendered DOM of the single public demo `https://heroui.pro/docs/react/demos/agenda-default` (light + dark,
at 447 px and inside a same-origin 1280 px iframe for the desktop layout), the demo page stylesheet
(CSSOM, appendix A), computed styles and runtime probing with synthetic pointer / mouse / keyboard
events. The paywalled example source was not opened.

---

## 1. Purpose

A calendar with day, week and month views. It shows timed events in a time grid, all-day events in a
collapsible strip, and multi-day events as bars in the month grid. Events can be created, moved,
resized, selected and deleted with the pointer and the keyboard. Day and week views can be swiped
(touch / trackpad).

State lives in a hook: `const agenda = useAgenda({...})`. The result is spread on the root:
`<Agenda {...agenda}>`. The demo renders either the day/week parts or the month parts, based on
`agenda.view`.

---

## 2. Anatomy

```tsx
const agenda = useAgenda({events, defaultView: "week"});

<Agenda {...agenda}>
  <Agenda.Header>
    <Agenda.Heading />                         {/* "November 2026" */}
    <Agenda.ViewSelector />                    {/* Pro Segment size="sm": Day / Week / Month */}
    <Agenda.Navigation>
      <Agenda.NavButton slot="previous" />     {/* OSS Button icon-only sm ghost */}
      <Agenda.TodayButton />                   {/* OSS Button sm outline */}
      <Agenda.NavButton slot="next" />
    </Agenda.Navigation>
  </Agenda.Header>
  <Agenda.Body>
    {agenda.view === "month" ? (
      <Agenda.MonthGrid>                       {/* renders the weekday header itself */}
        {agenda.visibleWeeks.map((week) => {
          const layout = agenda.getMonthRowLayout(week);
          return (
            <Agenda.MonthRow spanningRowCount={layout.rowCount}>
              {layout.spanningEvents.map((s) => <Agenda.MonthSpanningEvent event={s.event} colStart={s.colStart} colSpan={s.colSpan} row={s.row} />)}
              {week.map((day, i) => (
                <Agenda.MonthCell date={day} spanningRowCount={layout.cellRowCounts[i]}>
                  {agenda.getPerCellEvents(day, week).map((e) => <Agenda.MonthEvent event={e} />)}
                </Agenda.MonthCell>
              ))}
            </Agenda.MonthRow>
          );
        })}
      </Agenda.MonthGrid>
    ) : (
      <>
        <Agenda.WeekHeader />                  {/* one header per rendered day */}
        <Agenda.AllDaySection>
          <Agenda.AllDayLabel>all-day</Agenda.AllDayLabel>
          {agenda.allDayLayout.map((s) => <Agenda.AllDayEvent event={s.event} colStart={s.colStart} colSpan={s.colSpan} row={s.row} />)}
        </Agenda.AllDaySection>
        <Agenda.TimeGrid>                      {/* renders the hour labels itself */}
          <Agenda.CurrentTimeIndicator />
          <Agenda.DayColumns>
            {agenda.renderedDays.map((day) => (
              <Agenda.DayColumn date={day}>
                {agenda.getEventsForDay(day).map((e) => <Agenda.Event event={e} />)}
              </Agenda.DayColumn>
            ))}
          </Agenda.DayColumns>
        </Agenda.TimeGrid>
      </>
    )}
  </Agenda.Body>
</Agenda>
```

### Rendered DOM (week view, desktop, `allowsSwipe`)

```
div.agenda.agenda--week [data-slot=agenda][data-view=week][tabindex=-1] style="--agenda-visible-start: 7"
  header.agenda__header [data-slot=agenda-header]
    h1.agenda__heading [data-slot=agenda-heading]                     "November 2026"
    div.segment.segment--sm.agenda__view-selector [role=radiogroup]   (Pro Segment, 3 items)
    div.agenda__navigation [data-slot=agenda-navigation]
      button.button.button--icon-only.button--sm.button--ghost.agenda__nav-button [aria-label=Previous]  svg 16px chevron
      button.button.button--sm.button--outline.agenda__today-button  "Today"
      button.button.button--icon-only.button--sm.button--ghost.agenda__nav-button [aria-label=Next]
  div.agenda__body [data-slot=agenda-body]
    div.agenda__week-header [data-slot=agenda-week-header]
      div.agenda__days [data-slot=agenda-days]
        div.agenda__days-track [data-slot=agenda-days-track] style="touch-action: pan-y pinch-zoom; transform: translate3d(-33.3333%, 0px, 0px); width: 300%"
          div.agenda__day-header [data-weekend][data-today]
            span.agenda__day-header-name [data-today]   "Tue"
            span.agenda__day-header-date [data-today]   "24"
    div.agenda__all-day-section [data-expanded] [data-slot=agenda-all-day-section]
      div.agenda__all-day-gutter
        button.agenda__all-day-toggle [aria-label="Collapse all-day events"][data-expanded] (svg 10px chevron + label)
          span.agenda__all-day-label "all-day"
      div.agenda__days
        div.agenda__days-track.agenda__all-day-grid style="grid-template-columns: repeat(21, minmax(0px, 1fr)); …track style"
          div.agenda__all-day-dividers > div.agenda__all-day-divider[data-weekend] × rendered days
          div.agenda__all-day-event [role=button][tabindex=0][data-event-id][data-status][data-past][data-selected]
              style="grid-area: 1 / 10 / auto / span 3; --agenda-event-accent: #10b981; --agenda-event-foreground: #fff; --agenda-event-start: 9; --agenda-event-span: 3"
          (collapsed:) span.agenda__all-day-summary style="grid-column: N" "2 events" × rendered days
    div.agenda__time-grid.agenda__time-grid--week [tabindex=0][data-slot=agenda-time-grid]
      div.agenda__time-labels > div.agenda__time-label style="height: 60px" > span style="opacity: 1" "1 AM"   (first label has no span)
      div.agenda__current-time-indicator style="top: 1430px"
        div.agenda__current-time-label-wrap > span.agenda__current-time-label "11:50 PM"
        div.agenda__current-time-track [data-slot=agenda-current-time-line]
          div.agenda__current-time-line--faded
          div.agenda__days > div.agenda__days-track > div.agenda__current-time-line--active style="left: 42.8571%; width: 4.7619%"
      div.agenda__day-columns [data-slot=agenda-day-columns]
        div.agenda__days-track
          div.agenda__day-column [data-date=2026-11-24][data-weekend][aria-hidden][inert (overscan days)]
            div.agenda__time-slot [data-slot-index=0..23][data-last on the last]
            div.agenda__event [role=button][tabindex=0][data-event-id][data-status][data-past][data-short][data-readonly][data-selected][data-dragging][data-resizing]
                style="top: 600px; left: calc(33.3333% + 2px); right: auto; width: calc(33.3333% - 4px); --agenda-event-accent: #f59e0b; --agenda-event-color: color-mix(in srgb, #f59e0b 15%, var(--agenda-surface)); height: calc(90px - var(--agenda-event-gap, 0px)); transform: none"
              span.agenda__event-title  span.agenda__event-time "10:00 AM – 11:30 AM"   div.agenda__resize-handle
            div.agenda__create-preview  (while creating)
            div.agenda__drop-preview style="border-color: …; height; top" (while dragging, in the target column)
```

Month view (`agenda--month`, body gets `agenda__body--month`; the week parts are **not rendered** by the demo):

```
div.agenda__month-grid
  div.agenda__month-weekday-header > div.agenda__month-weekday[data-today] "Sun" × 7
  div.agenda__month-row × 6 (always 6 weeks)
    div.agenda__month-spanning-event [role=button] style="height: var(--agenda-month-event-height); left: calc(28.5714% + 2px); position: absolute; top: calc(var(--agenda-month-date-offset) + 0 * (var(--agenda-month-event-height) + var(--agenda-month-event-gap)) + 2px); width: calc(42.8571% - 4px); --agenda-event-accent; --agenda-event-foreground"
    div.agenda__month-cell [data-date][data-weekend][data-today][data-outside-month][data-drop-target] style="--agenda-month-spanning-zone: calc(1 * var(--agenda-month-event-height) + 0 * var(--agenda-month-event-gap) + 6px)" (or 0px)
      button.agenda__month-cell-date [data-today] "Nov 1" on the 1st, else "2"
      div.agenda__month-event [role=button] style="--agenda-event-color: color-mix(in srgb, C 15%, var(--agenda-surface)); --agenda-event-text: C; transform: none"
      button.agenda__month-cell-more "9 more"
```

---

## 3. API (docs + observed)

### `useAgenda(options)`

| Option | Type | Default |
|---|---|---|
| `events` | `AgendaEvent[]` | – |
| `defaultView` / `view` / `onViewChange` | `"day" \| "week" \| "month"` | `"week"` |
| `defaultDate` / `date` / `onDateChange` | `CalendarDate` | today |
| `startHour` / `endHour` | `number` | `0` / `24` |
| `slotDuration` | `number` (minutes per row) | `60` |
| `onEventCreate` | `({start, end}) => void` | – |
| `onEventDelete` | `(id) => void` | – |
| `onEventMove` / `onEventResize` | `(id, start, end) => void` | – |
| `onEventSelect` / `selectedEventId` | `(id \| null) => void` / `string \| null` | – |
| `weekDays` | `number` | `7` |
| `allowsSwipe` | `boolean` | `false` |
| `timeZone` | `string` | local |
| `firstDayOfWeek` | `"sun" … "sat"` | locale |
| `hourCycle` | `12 \| 24` | locale |
| `snapMinutes` | `number` | `5` (demo passes 15) |
| `defaultEventDuration` | `number` | `60` |

Returned (documented): `visibleDays`, `renderedDays`, `setVisibleStart(day)`, `setView`, `getEventsForDay(day)`,
`allDayLayout`, `visibleWeeks`, `getMonthRowLayout(week)`, `getPerCellEvents(day, week)`. The remake also
returns `view`, `date`, `setDate`, `today`, `goToPrevious/Next/Today`, `selectedEventId`, `selectEvent`, and
internal fields read by the parts (all of them are stripped from the root's DOM props).

`AgendaEvent`: `{id, title, start: CalendarDateTime, end: CalendarDateTime, color?, isAllDay?, isReadOnly?, status?: "confirmed" | "unconfirmed" | "declined"}`.

### Parts

| Part | Props (beyond the HTML element props) |
|---|---|
| `Agenda` | the `useAgenda` result (div) |
| `Agenda.Header` | header |
| `Agenda.Heading` | h1; children default to the long month + year of `date` |
| `Agenda.ViewSelector` | `size` `"sm" \| "md" \| "lg"` = `"sm"`; remake extras: `views`, `labels` |
| `Agenda.Navigation` | div |
| `Agenda.NavButton` | `slot` `"previous" \| "next"`, `aria-label` = `"Previous"` / `"Next"` |
| `Agenda.TodayButton` | OSS Button props; children = `"Today"` |
| `Agenda.Body` | div |
| `Agenda.WeekHeader` | div |
| `Agenda.AllDaySection` | `collapsedLabel(count)` = `"N events"`, `expandLabel` = `"Expand all-day events"`, `collapseLabel` = `"Collapse all-day events"` (remake extra: `defaultExpanded`) |
| `Agenda.AllDayLabel` | span (placed inside the toggle) |
| `Agenda.AllDayEvent` | `event`, `colStart`, `colSpan`, `row` |
| `Agenda.TimeGrid` | div |
| `Agenda.CurrentTimeIndicator` | div |
| `Agenda.DayColumns` | div; without children it renders a `DayColumn` (with its `Event`s) for each of `renderedDays` |
| `Agenda.DayColumn` | `date` |
| `Agenda.Event` | `event` (+ div props, ref) |
| `Agenda.MonthGrid` | div |
| `Agenda.MonthRow` | `spanningRowCount` |
| `Agenda.MonthCell` | `date`, `maxEvents` = 2, `moreLabel(count)` = `"N more"`, `spanningRowCount` = 0 |
| `Agenda.MonthSpanningEvent` | `event`, `colStart`, `colSpan`, `row` |
| `Agenda.MonthEvent` | `event` (+ div props, ref) |

---

## 4. Styling

### CSS variables (root)

| Variable | Default | Mobile (< 640 px) |
|---|---|---|
| `--agenda-slot-height` | 60px | 48px |
| `--agenda-time-column-width` | 58px | 58px |
| `--agenda-current-time-color` | `var(--color-danger)` | |
| `--agenda-day-header-height` | `calc(var(--spacing) * 10)` | |
| `--agenda-all-day-min-height` | `calc(var(--spacing) * 8)` | |
| `--agenda-event-radius` | `var(--radius-md)` | |
| `--agenda-event-gap` | 2px | |
| `--agenda-event-foreground` | `var(--color-accent-foreground)` | |
| `--agenda-surface` | `var(--color-background)` | |
| `--agenda-past-fade` | 40% | |
| `--agenda-month-event-height` / `-gap` / `--agenda-month-date-offset` | 20px / 2px / 20px | 16px / 1px / 16px |

Inline variables set by the parts: `--agenda-visible-start` (root), `--agenda-event-accent`,
`--agenda-event-color`, `--agenda-event-text`, `--agenda-event-foreground` (events), `--agenda-event-start` /
`--agenda-event-span` (all-day), `--agenda-month-spanning-zone`, `--agenda-drop-color` (month cell).

### Event colours

| Part | `color` set | No `color` |
|---|---|---|
| timed event | `--agenda-event-accent: C` (3 px inline-start bar) + `--agenda-event-color: color-mix(in srgb, C 15%, var(--agenda-surface))` | accent bar + `color-mix(in oklab, accent 15%, surface)` |
| all-day event / month bar | `--agenda-event-accent: C`, `--agenda-event-foreground: #fff` (solid) | solid accent + accent-foreground |
| month cell event | `--agenda-event-color: …15%…`, `--agenda-event-text: C` | 15% accent + `accent-soft-foreground` text |

Status: `unconfirmed` → surface fill + 1 px dashed accent border + accent text; `declined` → surface fill +
1 px solid border, title muted + line-through. Past (`data-past`, not selected) → `::after` surface overlay at
`--agenda-past-fade` and the border mixed toward the surface. Hover → `linear-gradient(color-mix(in srgb, hover 12%, transparent))`
background-image (hover = accent for timed events, currentColor otherwise). Selected / resizing → 2 px ring in the
event accent. Dragging → overlay shadow + `cursor: grabbing`.

### Measured metrics (desktop, 1200 px demo)

| Element | Value |
|---|---|
| header | flex, gap 12, padding 16 16 4; height 52 |
| heading | 20/28 medium, tabular-nums, flex 1 |
| view selector | Segment sm (155×32) |
| nav buttons | 32×32 ghost icon; Today 61×32 outline, text-xs |
| week header | border-bottom separator, padding-inline-start 58; day header 40 high, gap 6 |
| day header name / date | 12px medium, leading 1, muted; today: foreground / danger pill (radius `2 * --radius`, padding 2×4) |
| all-day section | min-height 32, border-bottom; gutter 58 wide, pe 6; toggle 20 high, radius `0.5 * --radius`; label 11px |
| all-day event | 12px medium, line-height 22, padding 2 8, margin 0 2, radius `0.75 * --radius`, 26 high, row gap 2, grid padding 4 0 |
| time label | 11px, muted, label span centred on the hour line (`translateY(-50%)`), end 8 |
| time slot | 60 high, border-bottom separator, last has none |
| day column | border-inline-start separator (none for the first in week); weekend `bg-default/40` |
| timed event | absolute, inset-x 2, padding 4 8, radius 6, min-height 20, z 20; title 12/15 medium; time 10/12.5 muted; time hidden below 4.5 rem container width |
| short event | flex baseline, gap 4, padding 2 8 |
| resize handle | 8 high; `::after` 24×2 pill, bottom 2, opacity 0 → .6 on hover |
| current time | label 10px, padding 2, radius 6, danger fill; faded line 2 px at 20%; active segment over today + 2×8 tick |
| month weekday | 11px medium muted, padding 6 0; today semibold foreground; sticky, background fill |
| month row | min-height 100 (72 mobile), border-bottom |
| month cell | padding 4, padding-top `zone + date-offset + 2px`; date button absolute top 4 / end 4, 11px medium, radius `2 * --radius`; today danger |
| month event | 10/12.5, padding 1 4, radius `0.5 * --radius`, 1 px gap; more button same size, muted |
| spanning bar | 20 high, 10px medium, padding-inline 6, radius `0.75 * --radius` |
| outside-month cell | opacity .4 |

Mobile (< 640 px): header becomes a 2-column grid (heading + navigation on row 1, view selector on row 2),
padding 12 12 4, heading text-sm; time labels 9px; event padding 2 4, title 10px, event time and resize handle
hidden; day header name 10px; all-day event 18 px / 10px; month texts 9px; create preview hidden.

Dark mode: every colour comes from theme tokens (background, foreground, muted, separator, default, danger,
accent); event colours are the caller's literals mixed with `--agenda-surface`.

---

## 5. Behaviour

- **Visible range**: day = `date`; week with 7 days = the week of `date` (locale first day, en-US Sunday);
  other `weekDays` counts are centred on `date` (the demo uses 3 on phones: yesterday, today, tomorrow).
  Month = 6 weeks starting at the week of the 1st.
- **Swipe** (`allowsSwipe`): week renders `weekDays` extra days on each side, day renders 3. Overscan columns are
  `aria-hidden` + `inert`. All tracks share `width: N%` and `translate3d(-overscan/rendered %)`.
  Touch pans (horizontal) and trackpad wheel (deltaX) move every track, release snaps to the nearest day and
  commits it with `setVisibleStart`. Wheel swipes settle ~130-145 ms after the last wheel event. A touch flick
  (release speed >= ~0.3 px/ms; 40 px in 32 ms moved a day in Pro, 48 px at 0.1 px/ms snapped back) carries on and
  moves at least one day. The snap animates the tracks in ~200 ms with an ease-out-quart curve (sampled with a
  timer-driven rAF shim).
- **Navigation**: previous/next move by 1 day / `weekDays` days / 1 month; Today returns to today. With swipe the
  tracks slide in from the previous position: JS-driven, sampled with a timer-driven rAF shim, best fit
  ease-out quart (`1 - (1 - t)^4`, CSS `cubic-bezier(0.25, 1, 0.5, 1)`) over ~280 ms. View switches and month
  navigation do not animate. The heading follows `date` (week after Nov 24 → "December 2026").
- **Scroll**: when the time grid mounts (first render, or Month → Week / Day), the hour before the current one goes to
  the top: `scrollTop = (hour(now) - 1) * slotHeight` (14:01 and 14:46 → 780 px at 60 px slots, 624 px at 48 px).
  Previous / next / Today and Day ↔ Week keep the scroll position (verified with a faked clock in the demo iframe).
- **Current time**: updates every minute; label `h:mm a`; an hour label less than 20 minutes from it hides
  (`opacity: 0`): 18 and 19 min hidden, 20 min shown, the same at 60 px and 48 px slots (so it is time based, not px).
  The line (track, faded line, active segment) is only rendered while today is among `renderedDays`; otherwise the
  indicator holds just the label.
- **Layout of timed events**: sorted by start (input order breaks ties), clustered by transitive overlap, first free
  column; inline `left/width` only when the cluster has more than one column. Touching events do not overlap.
  Events shorter than `snapMinutes` are drawn `snapMinutes` long. Events crossing midnight stop at the end of their start day.
- **data-short**: committed height below 40 px (30 min at 60 px slots is short, 45 min is not).
- **Selection**: pointer press without drag, Enter, Space → `onEventSelect(id)`. Escape does nothing.
- **Delete / Backspace**: only on the **selected** event (a focused but unselected event is not deleted), read-only
  events included; `onEventDelete(id)`, then focus moves to the time grid.
- **Move (pointer)**: 4 px threshold; the event follows the raw pointer (`translateX/Y`, `will-change`), a drop preview
  (`border-color` = event colour) shows the snapped target in the column under the pointer; start snaps with
  `round(minute / snap)`. Pointerdown is cancelled so no create starts underneath.
- **Resize**: bottom handle, live height while dragging (`data-resizing`), end `round` to snap, minimum one snap.
- **Create (mouse)**: mousedown on an empty column shows `agenda__create-preview` at `[floor(p), floor(p)+snap]` with an
  enter animation (opacity 0 → 1 via WAAPI, scale .96 → 1 via JS, both 150 ms on a spring curve that Pro exports as
  `linear(0, .1419 7.14%, .3799 14.29%, .5882 21.43%, .7399 28.57%, .8411 35.71%, .9052 42.86%, .9445 50%, …, 1)`; the
  final inline opacity is 1, overriding the stylesheet's .6); dragging down extends the end to `ceil(p)`, dragging up moves
  the start to `floor(p)` keeping the anchor slot; mouseup → `onEventCreate`. A click without movement creates
  `defaultEventDuration` minutes. Touch taps never create.
- **Keyboard (timed event)**: ↑/↓ move by `snapMinutes`; ←/→ move to the previous / next visible day (mirrored in RTL);
  Shift+↑/↓ resize the end by `snapMinutes`. Focus stays on the moved event.
- **Keyboard (time grid)**: Enter clears the selection and creates `defaultEventDuration` minutes at the first slot in view
  (`ceil(scrollTop / slot)`: 130 px → 3:00, 400 px → 7:00) on the agenda's `date` (after Next: today + 7 days), and
  focuses the new event when it appears. Arrow / Page / Home / End scroll natively (focusable scroller). Mouse create
  also clears the selection on mousedown; navigation keeps it.
- **All-day**: packed earliest first, then longest first; selectable, not draggable; toggle collapses to per-day counts.
- **Month**: maxEvents per cell (+ "N more"), single-day all-day events first then timed by start; multi-day all-day events
  are bars (not draggable); cell events drag to another cell (`data-drop-target`, `--agenda-drop-color`); ↑/↓ move a week,
  ←/→ a day; date button and "more" open the day view for that date.
- Read-only events: selectable and deletable (when selected), no move / resize, no resize handle.

---

## 6. Demo variants

| # | Demo | URL | Story |
|---|---|---|---|
| 1 | Default (week view, swipe, 15 min snap, 600 px tall; on phones: drag callbacks disabled, 3 days, month cells list 1 event before "N more" even when 2 would fit, i.e. `maxEvents` 1) | `https://heroui.pro/docs/react/demos/agenda-default?theme=light` / `?theme=dark` | `Default` (`pro-datadisplay-agenda--default`) |

Demo data shape (re-authored with own titles in the story): multi-day all-day event from today for 3 days,
single-day all-day event today, a later all-day event, an event yesterday (past), ten events today incl. two
overlap clusters (3 columns each), one unconfirmed, tomorrow one read-only and one declined, events on the next days
and next week.

---

## 7. Dependencies

- OSS: `Button` (`@heroui/react`).
- Pro: `Segment` (view selector).
- React Aria: `useFocusRing` (`react-aria/useFocusRing`), `useLocale` (`react-aria-components/I18nProvider`).
- `@internationalized/date` is **not resolvable** from `packages/pro` (only `@internationalized/number` is installed),
  so the remake ships `agenda-date.ts`: structural `CalendarDate` / `CalendarDateTime` types (satisfied by the real
  classes), Gregorian day-number math, and factories that clone the caller's own instances through `set()` so values
  handed back keep the caller's class. A small fallback class is used when no instance is available.

---

## 8. Deviations / notes

1. Dates: see §7. Public types `CalendarDate` / `CalendarDateTime` are structural; non-Gregorian calendars and
   `ZonedDateTime` are not supported.
2. The view selector gets `aria-label="Calendar view"` (Pro renders none); the all-day toggle gets `aria-expanded`.
3. The slide / settle animations use WAAPI with `cubic-bezier(0.25, 1, 0.5, 1)` (280 / 200 ms) and the create preview
   uses CSS keyframes with the sampled `linear()` spring curve (150 ms), instead of Pro's JS animation loop.
4. The resize handle and the all-day dividers get `aria-hidden="true"` (Pro renders no attributes on them).
5. `data-focus-visible` is added to events and the time grid through `useFocusRing` (Pro CSS already targets it).
6. `AgendaEvent` is exported both as the timed-event part (value) and the event data type, as the docs name it.
7. Pro's `MonthRow spanningRowCount` is used as a fallback for cells that do not pass their own count.

---

## Appendix A — CSSOM of the demo page (reference only, not used as implementation)

See `agenda.css` for the authored implementation. Key Pro rules were transcribed into the tables above.

```css
@layer components {
.agenda {
  --agenda-slot-height:60px;
  --agenda-time-column-width:58px;
  --agenda-current-time-color:var(--color-danger);
  --agenda-day-header-height:calc(var(--spacing) * 10);
  --agenda-all-day-min-height:calc(var(--spacing) * 8);
  --agenda-event-radius:var(--radius-md);
  --agenda-event-gap:2px;
  --agenda-event-foreground:var(--color-accent-foreground);
  --agenda-surface:var(--color-background);
  --agenda-past-fade:40%;
  --agenda-month-event-height:20px;
  --agenda-month-event-gap:2px;
  --agenda-month-date-offset:20px;
  -webkit-user-select:none;
  user-select:none;
  flex-direction:column;
  height:100%;
  display:flex;
  overflow:hidden;
}
.agenda__header {
  align-items:center;
  gap:calc(var(--spacing) * 3);
  padding-inline:calc(var(--spacing) * 4);
  padding-top:calc(var(--spacing) * 4);
  padding-bottom:var(--spacing);
  display:flex;
}
.agenda__heading {
  font-size:var(--text-xl);
  line-height:var(--tw-leading,var(--text-xl--line-height));
  --tw-font-weight:var(--font-weight-medium);
  font-weight:var(--font-weight-medium);
  color:var(--foreground);
  --tw-numeric-spacing:tabular-nums;
  font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,);
  flex:1;
}
.agenda__navigation {
  align-items:center;
  gap:var(--spacing);
  display:flex;
}
.agenda__nav-button:is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi)) svg {
  --tw-scale-x:calc(100% * -1);
  scale:var(--tw-scale-x) var(--tw-scale-y);
}
.agenda__today-button {
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
}
.agenda__view-selector {
  width:fit-content;
}
.agenda__body {
  flex-direction:column;
  flex:1;
  display:flex;
  position:relative;
  overflow:hidden;
}
.agenda__body--month {
  scrollbar-width:var(--scrollbar-width);
  scrollbar-color:var(--scrollbar-color);
  scrollbar-gutter:var(--scrollbar-gutter);
  overflow:auto;
}
.agenda__days,.agenda__day-columns {
  flex:1;
  min-width:0;
  display:flex;
  overflow-x:clip;
}
.agenda__days-track {
  flex-shrink:0;
  width:100%;
  transition-property:none;
  display:flex;
  position:relative;
}
.agenda__week-header {
  border-bottom-style:var(--tw-border-style);
  border-bottom-width:1px;
  border-color:var(--separator);
  padding-inline-start:var(--agenda-time-column-width);
  display:flex;
}
.agenda__day-header {
  justify-content:center;
  align-items:center;
  gap:calc(var(--spacing) * 1.5);
  min-width:0;
  padding-block:calc(var(--spacing) * 1.5);
  height:var(--agenda-day-header-height);
  flex-direction:row;
  flex:1;
  display:flex;
}
.agenda__day-header-name {
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
  --tw-leading:1;
  --tw-font-weight:var(--font-weight-medium);
  line-height:1;
  font-weight:var(--font-weight-medium);
  color:var(--muted);
  text-transform:capitalize;
}
.agenda__day-header-name[data-today=true] {
  color:var(--foreground);
}
.agenda__day-header-date {
  border-radius:calc(var(--radius) * 2);
  padding-inline:var(--spacing);
  padding-block:calc(var(--spacing) * .5);
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
  --tw-leading:1;
  --tw-font-weight:var(--font-weight-medium);
  line-height:1;
  font-weight:var(--font-weight-medium);
  color:var(--muted);
  justify-content:center;
  align-items:center;
  display:flex;
}
.agenda__day-header-date[data-today=true] {
  background-color:var(--danger);
  color:var(--danger-foreground);
}
.agenda__all-day-section {
  border-bottom-style:var(--tw-border-style);
  border-bottom-width:1px;
  border-color:var(--separator);
  min-height:var(--agenda-all-day-min-height);
  display:flex;
  position:relative;
}
.agenda__all-day-gutter {
  width:var(--agenda-time-column-width);
  flex-shrink:0;
  justify-content:flex-end;
  align-items:center;
  padding-inline-end:6px;
  display:flex;
}
.agenda__all-day-grid {
  grid-auto-rows:min-content;
  align-items:start;
  gap:2px 0;
  padding-top:4px;
  padding-bottom:4px;
  display:grid;
}
.agenda__all-day-toggle {
  height:calc(var(--spacing) * 5);
  max-width:100%;
  min-width:calc(var(--spacing) * 5);
  border-radius:calc(var(--radius) * .5);
  padding-inline:calc(var(--spacing) * .5);
  color:var(--muted);
  --tw-outline-style:none;
  cursor:var(--cursor-interactive);
  outline-style:none;
  justify-content:center;
  align-items:center;
  display:flex;
}
.agenda__all-day-toggle svg {
  flex-shrink:0;
  transition:rotate .15s;
}
.agenda__all-day-toggle svg:is([data-reduce-motion=true],[data-reduce-motion=true] *),.agenda__all-day-toggle svg:is([data-reduce-motion=true],[data-reduce-motion=true] *):before,.agenda__all-day-toggle svg:is([data-reduce-motion=true],[data-reduce-motion=true] *):after {
  transition-property:none;
}
@media (prefers-reduced-motion:reduce) {
.agenda__all-day-toggle svg:not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)),.agenda__all-day-toggle svg:not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)):before,.agenda__all-day-toggle svg:not(:is([data-reduce-motion=true],[data-reduce-motion=true] *)):after {
  transition-property:none;
}
}
.agenda__all-day-toggle[data-expanded] svg {
  rotate:0deg;
}
.agenda__all-day-toggle:not([data-expanded]) svg {
  rotate:-90deg;
}
.agenda__all-day-toggle:not([data-expanded]):is(:lang(ae),:lang(ar),:lang(arc),:lang(bcc),:lang(bqi),:lang(ckb),:lang(dv),:lang(fa),:lang(glk),:lang(he),:lang(ku),:lang(mzn),:lang(nqo),:lang(pnb),:lang(ps),:lang(sd),:lang(ug),:lang(ur),:lang(yi)) svg {
  rotate:90deg;
}
@media (hover:hover) {
.agenda__all-day-toggle:hover {
  background-color:var(--default);
}
}
.agenda__all-day-toggle:focus-visible {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__all-day-label {
  text-overflow:ellipsis;
  white-space:nowrap;
  text-align:end;
  min-width:0;
  font-size:11px;
  overflow:hidden;
}
.agenda__all-day-summary {
  color:var(--muted);
  justify-content:center;
  align-items:center;
  min-height:22px;
  font-size:11px;
  display:flex;
}
.agenda__all-day-event {
  text-overflow:ellipsis;
  white-space:nowrap;
  border-radius:calc(var(--radius) * .75);
  padding-inline:calc(var(--spacing) * 2);
  padding-block:calc(var(--spacing) * .5);
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
  --tw-font-weight:var(--font-weight-medium);
  font-weight:var(--font-weight-medium);
  background-color:var(--agenda-event-accent,var(--color-accent));
  color:var(--agenda-event-foreground);
  z-index:1;
  min-height:22px;
  cursor:var(--cursor-interactive);
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  outline-style:none;
  margin:0 2px;
  padding-inline-start:calc(var(--spacing) * 2 + clamp(0px, (var(--agenda-visible-start,0) - var(--agenda-event-start,0)) * 100% / var(--agenda-event-span,1), 100% - var(--spacing) * 4));
  line-height:22px;
  display:block;
  position:relative;
  overflow:hidden;
}
.agenda__all-day-event:focus-visible:not([data-focused]),.agenda__all-day-event[data-focus-visible=true] {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__all-day-event[data-status=unconfirmed] {
  background-color:var(--agenda-surface);
  border:1px dashed var(--agenda-event-accent,var(--color-accent));
  color:var(--agenda-event-accent,var(--color-accent));
}
.agenda__all-day-event[data-status=declined] {
  color:var(--muted);
  background-color:var(--agenda-surface);
  border:1px solid var(--agenda-event-accent,var(--color-accent));
  text-decoration-line:line-through;
}
.agenda__all-day-event[data-past]:not([data-selected=true]) {
  border-color:var(--agenda-event-accent,var(--color-accent));
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__all-day-event[data-past]:not([data-selected=true]) {
  border-color:color-mix(in srgb, var(--agenda-event-accent,var(--color-accent)), var(--agenda-surface) var(--agenda-past-fade));
}
}
.agenda__all-day-dividers {
  pointer-events:none;
  display:flex;
  position:absolute;
  inset:0;
}
.agenda__all-day-divider {
  border-inline-start-style:var(--tw-border-style);
  border-inline-start-width:1px;
  border-color:var(--separator);
  flex:1;
  min-width:0;
}
.agenda__all-day-divider[data-weekend] {
  background-color:var(--default);
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__all-day-divider[data-weekend] {
  background-color:color-mix(in oklab, var(--default) 40%, transparent);
}
}
.agenda__time-grid {
  scrollbar-color:auto;
  scrollbar-gutter:auto;
  -ms-overflow-style:none;
  scrollbar-width:none;
  --tw-outline-style:none;
  outline-style:none;
  flex:1;
  align-items:flex-start;
  display:flex;
  position:relative;
  overflow-y:auto;
}
.agenda__time-grid[data-focus-visible=true] {
  outline-style:var(--tw-outline-style);
  outline-offset:calc(2px * -1);
  outline-width:2px;
  outline-color:var(--focus);
}
.agenda__time-grid--day .agenda__day-column,.agenda__time-grid--week .agenda__day-column {
  border-inline-start-style:var(--tw-border-style);
  border-inline-start-width:1px;
  border-color:var(--separator);
  flex:1;
  min-width:0;
}
.agenda__time-grid--week .agenda__day-column:first-child {
  border-inline-start:none;
}
.agenda__time-labels {
  z-index:10;
  width:var(--agenda-time-column-width);
  height:fit-content;
  flex-direction:column;
  flex-shrink:0;
  display:flex;
  position:sticky;
  inset-inline-start:calc(var(--spacing) * 0);
}
.agenda__time-label {
  text-align:end;
  --tw-leading:1;
  color:var(--muted);
  height:var(--agenda-slot-height);
  padding-inline-end:calc(var(--spacing) * 2);
  font-size:11px;
  line-height:1;
  position:relative;
}
.agenda__time-label span {
  inset-inline-end:calc(var(--spacing) * 2);
  position:absolute;
  top:0;
  transform:translateY(-50%);
}
.agenda__day-column {
  position:relative;
}
.agenda__day-column[data-weekend] {
  background-color:var(--default);
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__day-column[data-weekend] {
  background-color:color-mix(in oklab, var(--default) 40%, transparent);
}
}
.agenda__time-slot {
  border-bottom-style:var(--tw-border-style);
  border-bottom-width:1px;
  border-color:var(--separator);
  height:var(--agenda-slot-height);
  cursor:var(--cursor-interactive);
}
.agenda__time-slot[data-last] {
  border-bottom:none;
}
.agenda__event {
  right:calc(var(--spacing) * .5);
  left:calc(var(--spacing) * .5);
  z-index:20;
  padding-inline:calc(var(--spacing) * 2);
  padding-block:var(--spacing);
  border-radius:var(--agenda-event-radius);
  cursor:var(--cursor-interactive);
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  background-color:var(--agenda-event-color,var(--color-accent));
  outline-style:none;
  position:absolute;
  overflow:hidden;
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__event {
  background-color:var(--agenda-event-color,color-mix(in oklab, var(--color-accent) 15%, var(--agenda-surface)));
}
}
.agenda__event {
  border-inline-start:3px solid var(--agenda-event-accent,var(--color-accent));
  min-height:20px;
  container-type:inline-size;
}
.agenda__event[data-selected=true] {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--agenda-event-accent,var(--color-accent));
}
.agenda__event:focus-visible:not([data-focused]),.agenda__event[data-focus-visible=true] {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__event[data-dragging=true] {
  --tw-shadow:var(--overlay-shadow);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  cursor:grabbing;
}
.agenda__event[data-resizing=true] {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--agenda-event-accent,var(--color-accent));
}
.agenda__event[data-status=unconfirmed] {
  background-color:var(--agenda-surface);
  border:1px dashed var(--agenda-event-accent,var(--color-accent));
  color:var(--agenda-event-accent,var(--color-accent));
}
.agenda__event[data-status=declined] {
  background-color:var(--agenda-surface);
  border:1px solid var(--agenda-event-accent,var(--color-accent));
}
.agenda__event[data-status=declined] .agenda__event-title {
  color:var(--muted);
  text-decoration-line:line-through;
}
.agenda__event[data-status=unconfirmed],.agenda__event[data-status=declined] {
  padding-inline-start:calc(var(--spacing) * 2 + 2px);
}
.agenda__event[data-past]:not([data-selected=true]) {
  border-color:var(--agenda-event-accent,var(--color-accent));
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__event[data-past]:not([data-selected=true]) {
  border-color:color-mix(in srgb, var(--agenda-event-accent,var(--color-accent)), var(--agenda-surface) var(--agenda-past-fade));
}
}
.agenda__event[data-short] {
  align-items:baseline;
  gap:var(--spacing);
  padding-block:calc(var(--spacing) * .5);
  display:flex;
}
.agenda__event[data-short] .agenda__event-title {
  min-width:0;
}
.agenda__event[data-short] .agenda__event-time {
  flex-shrink:0;
}
.agenda__event-title {
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
  --tw-leading:var(--leading-tight);
  line-height:var(--leading-tight);
  --tw-font-weight:var(--font-weight-medium);
  font-weight:var(--font-weight-medium);
  color:var(--foreground);
  display:block;
  overflow:hidden;
}
.agenda__event-time {
  text-overflow:ellipsis;
  white-space:nowrap;
  --tw-leading:var(--leading-tight);
  font-size:10px;
  line-height:var(--leading-tight);
  color:var(--muted);
  display:block;
  overflow:hidden;
}
@container not (min-width:4.5rem) {
.agenda__event-time {
  display:none;
}
}
.agenda__resize-handle {
  cursor:row-resize;
  height:8px;
  position:absolute;
  bottom:0;
  left:0;
  right:0;
}
.agenda__resize-handle:after {
  content:"";
  bottom:calc(var(--spacing) * .5);
  height:calc(var(--spacing) * .5);
  background-color:var(--agenda-event-accent,var(--color-accent));
  opacity:0;
  border-radius:2147483647px;
  width:24px;
  transition:opacity .15s;
  display:block;
  position:absolute;
  left:50%;
  transform:translate(-50%);
}
.agenda__resize-handle:after:is() {
  transition-property:none;
}
@media (prefers-reduced-motion:reduce) {
.agenda__resize-handle:after:not(:is()) {
  transition-property:none;
}
}
.agenda__resize-handle:hover:after,.agenda__resize-handle:active:after {
  opacity:.6;
}
.agenda__create-preview {
  pointer-events:none;
  right:calc(var(--spacing) * .5);
  left:calc(var(--spacing) * .5);
  z-index:10;
  border-radius:var(--agenda-event-radius);
  background-color:var(--color-accent-soft);
  border:1px dashed var(--color-accent);
  opacity:.6;
  position:absolute;
}
.agenda__drop-preview {
  pointer-events:none;
  right:calc(var(--spacing) * .5);
  left:calc(var(--spacing) * .5);
  z-index:10;
  border-radius:var(--agenda-event-radius);
  opacity:.5;
  border:2px solid;
  position:absolute;
}
.agenda__current-time-indicator {
  pointer-events:none;
  z-index:30;
  align-items:center;
  height:0;
  display:flex;
  position:absolute;
  left:0;
  right:0;
}
.agenda__current-time-label {
  padding-inline:calc(var(--spacing) * .5);
  padding-block:calc(var(--spacing) * .5);
  --tw-leading:1;
  white-space:nowrap;
  background-color:var(--agenda-current-time-color);
  color:var(--color-danger-foreground);
  border-radius:var(--radius-md);
  font-size:10px;
  line-height:1;
}
.agenda__current-time-label-wrap {
  width:var(--agenda-time-column-width);
  flex-shrink:0;
  justify-content:flex-end;
  align-items:center;
  padding-inline-end:1px;
  display:flex;
}
.agenda__current-time-track {
  flex:1;
  height:2px;
  position:relative;
}
.agenda__current-time-track>.agenda__days {
  position:absolute;
  inset:0;
}
.agenda__current-time-line--faded {
  background-color:var(--agenda-current-time-color);
  opacity:.2;
  position:absolute;
  inset:0;
}
.agenda__current-time-line--active {
  background-color:var(--agenda-current-time-color);
  position:absolute;
  top:0;
  bottom:0;
}
.agenda__current-time-line--active:before {
  content:"";
  background-color:var(--agenda-current-time-color);
  inset-inline-start:0;
  border-radius:2px;
  width:2px;
  height:8px;
  display:block;
  position:absolute;
  top:50%;
  transform:translateY(-50%);
}
.agenda__month-grid {
  flex-direction:column;
  flex:1;
  display:flex;
}
.agenda__month-weekday-header {
  z-index:20;
  border-bottom-style:var(--tw-border-style);
  border-bottom-width:1px;
  border-color:var(--separator);
  background-color:var(--background);
  display:flex;
  position:sticky;
  top:0;
}
.agenda__month-weekday {
  padding-block:calc(var(--spacing) * 1.5);
  --tw-font-weight:var(--font-weight-medium);
  font-size:11px;
  font-weight:var(--font-weight-medium);
  color:var(--muted);
  flex:1;
  justify-content:center;
  align-items:center;
  display:flex;
}
.agenda__month-weekday[data-today=true] {
  --tw-font-weight:var(--font-weight-semibold);
  font-weight:var(--font-weight-semibold);
  color:var(--foreground);
}
.agenda__month-row {
  border-bottom-style:var(--tw-border-style);
  border-bottom-width:1px;
  border-color:var(--separator);
  flex:1;
  min-height:100px;
  display:flex;
  position:relative;
}
.agenda__month-row:has([data-dragging]) {
  z-index:40;
  overflow:visible;
}
.agenda__month-row:last-child {
  border-bottom:none;
}
.agenda__month-cell {
  padding:var(--spacing);
  padding-top:calc(var(--agenda-month-spanning-zone,0px) + var(--agenda-month-date-offset) + 2px);
  flex-direction:column;
  flex:1;
  display:flex;
  position:relative;
  overflow:hidden;
}
.agenda__month-cell:has([data-dragging]) {
  z-index:40;
  overflow:visible;
}
.agenda__month-cell+.agenda__month-cell {
  border-inline-start-style:var(--tw-border-style);
  border-inline-start-width:1px;
  border-color:var(--separator);
}
.agenda__month-cell[data-weekend] {
  background-color:var(--default);
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__month-cell[data-weekend] {
  background-color:color-mix(in oklab, var(--default) 40%, transparent);
}
}
.agenda__month-cell[data-drop-target] {
  box-shadow:inset 0 0 0 2px var(--agenda-drop-color,var(--color-accent));
  border-radius:var(--radius-md);
}
.agenda__month-cell[data-outside-month=true] {
  opacity:.4;
}
.agenda__month-spanning-event {
  text-overflow:ellipsis;
  white-space:nowrap;
  border-radius:calc(var(--radius) * .75);
  padding-inline:calc(var(--spacing) * 1.5);
  --tw-leading:1;
  --tw-font-weight:var(--font-weight-medium);
  font-size:10px;
  line-height:1;
  font-weight:var(--font-weight-medium);
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  background-color:var(--agenda-event-accent,var(--color-accent));
  color:var(--agenda-event-foreground);
  cursor:var(--cursor-interactive);
  z-index:1;
  outline-style:none;
  align-items:center;
  display:flex;
  overflow:hidden;
}
.agenda__month-spanning-event:focus-visible:not([data-focused]),.agenda__month-spanning-event[data-focus-visible=true] {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__month-spanning-event[data-status=unconfirmed] {
  background-color:var(--agenda-surface);
  border:1px dashed var(--agenda-event-accent,var(--color-accent));
  color:var(--agenda-event-accent,var(--color-accent));
}
.agenda__month-spanning-event[data-status=declined] {
  color:var(--muted);
  background-color:var(--agenda-surface);
  border:1px solid var(--agenda-event-accent,var(--color-accent));
  text-decoration-line:line-through;
}
.agenda__month-spanning-event[data-past]:not([data-selected=true]) {
  border-color:var(--agenda-event-accent,var(--color-accent));
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__month-spanning-event[data-past]:not([data-selected=true]) {
  border-color:color-mix(in srgb, var(--agenda-event-accent,var(--color-accent)), var(--agenda-surface) var(--agenda-past-fade));
}
}
.agenda__month-cell-date {
  inset-inline-end:calc(var(--spacing) * 1);
  top:var(--spacing);
  z-index:10;
  border-radius:calc(var(--radius) * 2);
  padding-inline:var(--spacing);
  padding-block:calc(var(--spacing) * .5);
  --tw-leading:1;
  --tw-font-weight:var(--font-weight-medium);
  font-size:11px;
  line-height:1;
  font-weight:var(--font-weight-medium);
  color:var(--muted);
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  cursor:var(--cursor-interactive);
  outline-style:none;
  justify-content:center;
  align-items:center;
  display:flex;
  position:absolute;
}
@media (hover:hover) {
.agenda__month-cell-date:hover {
  background-color:var(--default);
}
}
.agenda__month-cell-date:focus-visible {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__month-cell-date[data-today=true] {
  background-color:var(--danger);
  color:var(--danger-foreground);
}
@media (hover:hover) {
.agenda__month-cell-date[data-today=true]:hover {
  background-color:var(--danger);
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__month-cell-date[data-today=true]:hover {
  background-color:color-mix(in oklab, var(--danger) 80%, transparent);
}
}
}
.agenda__month-cell-more {
  text-overflow:ellipsis;
  white-space:nowrap;
  border-radius:calc(var(--radius) * .5);
  width:100%;
  padding-inline:var(--spacing);
  text-align:start;
  --tw-leading:var(--leading-tight);
  font-size:10px;
  line-height:var(--leading-tight);
  color:var(--muted);
  --tw-outline-style:none;
  cursor:var(--cursor-interactive);
  -webkit-tap-highlight-color:transparent;
  outline-style:none;
  margin-top:1px;
  padding-block:1px;
  overflow:hidden;
}
@media (hover:hover) {
.agenda__month-cell-more:hover {
  background-color:var(--default);
}
}
.agenda__month-cell-more:focus-visible {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__month-event {
  text-overflow:ellipsis;
  white-space:nowrap;
  border-radius:calc(var(--radius) * .5);
  padding-inline:var(--spacing);
  --tw-leading:var(--leading-tight);
  font-size:10px;
  line-height:var(--leading-tight);
  cursor:var(--cursor-interactive);
  --tw-outline-style:none;
  -webkit-tap-highlight-color:transparent;
  background-color:var(--agenda-event-color,var(--color-accent));
  outline-style:none;
  padding-block:1px;
  position:relative;
  overflow:hidden;
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__month-event {
  background-color:var(--agenda-event-color,color-mix(in oklab, var(--color-accent) 15%, var(--agenda-surface)));
}
}
.agenda__month-event {
  color:var(--agenda-event-text,var(--color-accent-soft-foreground));
}
.agenda__month-event+.agenda__month-event {
  margin-top:1px;
}
.agenda__month-event:focus-visible:not([data-focused]),.agenda__month-event[data-focus-visible=true] {
  --tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);
  box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);
  --tw-ring-color:var(--focus);
  --tw-ring-offset-width:var(--ring-offset-width);
  --tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-offset-color:var(--background);
  --tw-outline-style:none;
  outline-style:none;
}
.agenda__month-event[data-dragging] {
  z-index:50;
  cursor:grabbing;
}
.agenda__month-event[data-status=unconfirmed] {
  background-color:var(--agenda-surface);
  border:1px dashed var(--agenda-event-text,var(--color-accent));
  color:var(--agenda-event-text,var(--color-accent));
}
.agenda__month-event[data-status=declined] {
  color:var(--muted);
  background-color:var(--agenda-surface);
  border:1px solid var(--agenda-event-text,var(--color-accent));
  text-decoration-line:line-through;
}
.agenda__month-event[data-past]:not([data-selected=true]) {
  border-color:var(--agenda-event-text,var(--color-accent));
}
@supports (color:color-mix(in lab, red, red)) {
.agenda__month-event[data-past]:not([data-selected=true]) {
  border-color:color-mix(in srgb, var(--agenda-event-text,var(--color-accent)), var(--agenda-surface) var(--agenda-past-fade));
}
}
@media (hover:hover) {
:is(.agenda__event,.agenda__all-day-event,.agenda__month-spanning-event,.agenda__month-event):hover,:is(.agenda__event,.agenda__all-day-event,.agenda__month-spanning-event,.agenda__month-event)[data-hovered=true] {
  background-image:linear-gradient(var(--agenda-event-hover,currentColor) 0 0);
}
@supports (color:color-mix(in lab, red, red)) {
:is(.agenda__event,.agenda__all-day-event,.agenda__month-spanning-event,.agenda__month-event):hover,:is(.agenda__event,.agenda__all-day-event,.agenda__month-spanning-event,.agenda__month-event)[data-hovered=true] {
  background-image:linear-gradient(color-mix(in srgb, var(--agenda-event-hover,currentColor) 12%, transparent) 0 0);
}
}
}
:is(.agenda__event,.agenda__all-day-event,.agenda__month-spanning-event,.agenda__month-event)[data-past]:not([data-selected=true]):after {
  content:"";
  pointer-events:none;
  border-radius:inherit;
  background-color:var(--agenda-surface);
  opacity:var(--agenda-past-fade);
  position:absolute;
  inset:0;
}
.agenda__event {
  --agenda-event-hover:var(--agenda-event-accent,var(--color-accent));
}
.agenda--month .agenda__time-grid,.agenda--month .agenda__all-day-section,.agenda--month .agenda__week-header {
  display:none;
}
@media (max-width:639px) {
.agenda {
  --agenda-slot-height:48px;
  --agenda-time-column-width:58px;
  --agenda-month-event-height:16px;
  --agenda-month-event-gap:1px;
  --agenda-month-date-offset:16px;
}
.agenda__header {
  padding-inline:calc(var(--spacing) * 3);
  padding-top:calc(var(--spacing) * 3);
  padding-bottom:var(--spacing);
  grid-template-rows:auto auto;
  grid-template-columns:1fr auto;
  gap:8px;
  display:grid;
}
.agenda__heading {
  font-size:var(--text-sm);
  line-height:var(--tw-leading,var(--text-sm--line-height));
  grid-area:1/1;
}
.agenda__navigation {
  grid-area:1/2;
}
.agenda__view-selector {
  grid-area:2/1;
}
.agenda__time-label {
  font-size:9px;
}
.agenda__event {
  padding-inline:var(--spacing);
  padding-block:calc(var(--spacing) * .5);
}
.agenda__event[data-status=unconfirmed],.agenda__event[data-status=declined] {
  padding-inline-start:calc(var(--spacing) + 2px);
}
.agenda__event-title {
  font-size:10px;
}
.agenda__event-time,.agenda__resize-handle {
  display:none;
}
.agenda__day-header-name {
  font-size:10px;
}
.agenda__day-header-date {
  font-size:var(--text-xs);
  line-height:var(--tw-leading,var(--text-xs--line-height));
}
.agenda__all-day-event {
  min-height:18px;
  font-size:10px;
  line-height:18px;
}
.agenda__month-row {
  min-height:72px;
}
.agenda__month-cell-date,.agenda__month-event,.agenda__month-spanning-event {
  font-size:9px;
}
.agenda__current-time-label {
  padding-inline:var(--spacing);
  padding-block:calc(var(--spacing) * .5);
  font-size:9px;
}
.agenda__create-preview {
  display:none;
}
}
}
```
