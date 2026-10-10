"use client";
import { useEffect, useRef } from "react";
import type { MonthCell } from "@cadence/shared/planner/month-cells";
import { TODAY, dateLabel } from "../model";
import { MONTH_GOALS, monthWeeks, type MonthWork } from "./month-model";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function MonthCalendar({
  month,
  day,
  sessions,
  readable = false,
  onDay,
}: {
  month: string;
  day: string;
  sessions: readonly MonthWork[];
  readable?: boolean;
  onDay: (date: string) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const weeks = monthWeeks(month);
  useEffect(() => {
    if (!readable || !viewport.current) return;
    const col =
      monthWeeks(month)
        .flat()
        .findIndex((d) => d.date === day) % 7;
    if (col < 0) return;
    viewport.current.scrollLeft = Math.max(
      0,
      col * (viewport.current.scrollWidth / 7) -
        (viewport.current.clientWidth - viewport.current.scrollWidth / 7) / 2,
    );
  }, [readable, month, day]);
  return (
    <>
      {readable && (
        <p className="rd-scroll-cue">
          ← Swipe sideways for the rest of each week →
        </p>
      )}
      <div
        className="rd-calendar-viewport"
        data-readable={readable}
        ref={viewport}
        tabIndex={readable ? 0 : undefined}
        role={readable ? "region" : undefined}
        aria-label={readable ? "Scrollable month calendar" : undefined}
      >
        <div className="rd-calendar" data-readable={readable}>
          {WEEKDAYS.map((d) => (
            <div className="rd-weekday" key={d}>
              {d}
            </div>
          ))}
          {weeks.flat().map((cell) => (
            <MonthDate
              key={cell.date}
              cell={cell}
              selected={day === cell.date}
              sessions={sessions.filter((s) => s.date === cell.date)}
              readable={readable}
              onDay={onDay}
            />
          ))}
        </div>
      </div>
      {!readable && (
        <p className="rd-calendar-key">
          <span>
            <b>R</b> Run
          </span>
          <span>
            <b>F</b> Film
          </span>
          <span>
            <b>J</b> Japanese
          </span>
          <span>
            <b>S</b> Storyboard
          </span>
          <span>
            <b>T</b> Task
          </span>{" "}
          · Numbers: recorded / placed. Select a date for full titles
        </p>
      )}
    </>
  );
}
function MonthDate({
  cell,
  selected,
  sessions,
  readable,
  onDay,
}: {
  cell: MonthCell;
  selected: boolean;
  sessions: readonly MonthWork[];
  readable: boolean;
  onDay: (date: string) => void;
}) {
  const letters = MONTH_GOALS.filter((g) =>
    sessions.some((s) => s.goal === g.id),
  ).map((g) => g.letter);
  return (
    <button
      type="button"
      className="rd-month-date"
      data-selected={selected}
      data-today={cell.date === TODAY}
      data-outside={!cell.inMonth}
      aria-pressed={selected}
      aria-current={cell.date === TODAY ? "date" : undefined}
      aria-label={`${dateLabel(cell.date)}${cell.date === TODAY ? ", today" : ""}, ${sessions.length} sessions${sessions.some((s) => s.person === "partner") ? ", includes Alex’s work" : ""}`}
      onClick={() => onDay(cell.date)}
    >
      <span className="rd-date-number">{Number(cell.date.slice(-2))}</span>
      {readable ? (
        <span className="rd-cell-titles">
          {sessions.slice(0, 3).map((s) => (
            <span key={s.id} data-done={s.done}>
              {s.person === "partner" ? "Alex · " : ""}
              {s.title}
            </span>
          ))}
          {sessions.length > 3 && (
            <small>+{sessions.length - 3} more · open day</small>
          )}
        </span>
      ) : (
        <>
          <span className="rd-date-letters" aria-hidden>
            {letters.slice(0, 2).join(" ")}
            {letters.length > 2 ? " +" : ""}
          </span>
          <span className="rd-date-count" aria-hidden>
            {sessions.length
              ? `${sessions.filter((s) => s.done).length}/${sessions.length}`
              : "·"}
          </span>
        </>
      )}
    </button>
  );
}
