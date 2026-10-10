"use client";

import { format, parseISO } from "date-fns";
import { buildMonthCells } from "@cadence/shared/planner/month-cells";
import { groupMonthGridWeeks } from "@/features/planner/calendar-month-week-visibility";
import {
  LANDING_EXAMPLE_MONTH,
  LANDING_EXAMPLE_TODAY,
  type landingExampleSessions,
} from "./mobile-landing-model";
import styles from "./mobile-landing.module.css";

type ExampleSession = ReturnType<typeof landingExampleSessions>[number];
const cells = groupMonthGridWeeks(buildMonthCells(LANDING_EXAMPLE_MONTH, 1))
  .filter((week) => week.some((cell) => cell.inMonth))
  .flat();

export function MobileLandingMonth({
  sessions,
  selectedDay,
  completed,
  onSelect,
}: {
  sessions: ExampleSession[];
  selectedDay: string;
  completed: ReadonlySet<string>;
  onSelect: (day: string) => void;
}) {
  const selected = sessions.filter((session) => session.date === selectedDay);
  const selectedRecorded =
    selectedDay.startsWith(`${LANDING_EXAMPLE_MONTH}-`) &&
    completed.has(`run-${Number(selectedDay.slice(-2))}`);
  return (
    <div className={styles.monthProof}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="type-heading text-lg">October 2026</h3>
        <span className="text-sm text-muted-foreground">Example month</span>
      </div>
      <div className={styles.monthWeekdays} aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {cells.map((cell) => {
          const placed = sessions.filter(
            (session) => session.date === cell.date,
          );
          const done =
            placed.some((session) => completed.has(session.id)) ||
            (cell.inMonth &&
              completed.has(`run-${Number(cell.date.slice(-2))}`));
          return (
            <button
              key={cell.date}
              type="button"
              aria-label={`${format(parseISO(cell.date), "EEEE, MMMM d")}. ${placed.length} placed session${placed.length === 1 ? "" : "s"}${done ? ", recorded" : ""}.`}
              aria-pressed={cell.date === selectedDay}
              aria-current={
                cell.date === LANDING_EXAMPLE_TODAY ? "date" : undefined
              }
              data-in-month={cell.inMonth}
              data-has-work={placed.length > 0}
              data-done={done}
              className={styles.monthDate}
              onClick={() => onSelect(cell.date)}
            >
              <span>{Number(cell.date.slice(-2))}</span>
              <small aria-hidden="true">
                {done ? "✓" : placed.length > 0 ? "—" : ""}
              </small>
            </button>
          );
        })}
      </div>
      <div className={styles.dayDetail} aria-live="polite" aria-atomic="true">
        <h4 className="type-heading text-base">
          {format(parseISO(selectedDay), "EEEE, MMM d")}
        </h4>
        {selected.length ? (
          selected.map((session) => (
            <div key={session.id} className="mt-3">
              <p className="type-item text-base">{session.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {completed.has(session.id)
                  ? "Recorded"
                  : session.changed
                    ? "Moved from Thursday 8"
                    : "Placed session"}
              </p>
            </div>
          ))
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {selectedRecorded
              ? "Recorded running session. No session currently placed here."
              : "Room in the plan. No session placed here."}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Tap any date. The month stays in view while the full title appears
        below.
      </p>
    </div>
  );
}
