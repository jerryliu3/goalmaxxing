"use client";

import { useMemo } from "react";
import {
  addDays,
  dateRange,
  dayOfMonth,
  earliest,
  monthShort,
  startOfWeek,
  type IsoDate,
} from "@/features/ux-recovery/dates";
import type { RecoveryPlan, RecoverySeed } from "@/features/ux-recovery/model";
import { onlyGoal, projectDays } from "@/features/ux-recovery/projection";
import { GoalSwatch, Legend, SessionChip } from "@/features/ux-recovery/primitives";
import { goalById } from "@/features/ux-recovery/seed";
import type { RecoveryReview } from "@/features/ux-recovery/use-recovery-review";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Compact month grid. With focus goals, other goals' sessions are hidden,
 * or dimmed when `showAll` is on. Chips collapse to dots on phones, and
 * `phoneWeeks` hides later weeks below the desktop breakpoint.
 */
export function MonthGrid({
  seed,
  preview,
  marks = preview !== null,
  today,
  from,
  weeks,
  phoneWeeks,
  focusGoalIds = null,
  showAll = true,
  highlightId = null,
}: {
  seed: RecoverySeed;
  preview: RecoveryPlan | null;
  marks?: boolean;
  today: IsoDate;
  from: IsoDate;
  weeks: number;
  phoneWeeks?: number;
  focusGoalIds?: readonly string[] | null;
  showAll?: boolean;
  highlightId?: string | null;
}) {
  const dates = useMemo(() => dateRange(from, addDays(from, weeks * 7 - 1)), [from, weeks]);
  const days = useMemo(() => projectDays(seed, preview, dates, marks), [seed, preview, dates, marks]);
  const focus = useMemo(() => (focusGoalIds ? new Set(focusGoalIds) : null), [focusGoalIds]);

  return (
    <div className="rc-card overflow-hidden" aria-label="Calendar">
      <div className="grid grid-cols-7 border-b border-[color:var(--rc-rule)] text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dates.map((date, index) => {
          const entries = (days.get(date) ?? []).filter(
            (entry) => !focus || showAll || focus.has(entry.goal.id)
          );
          const isToday = date === today;
          return (
            <div
              key={date}
              className={`min-h-14 border-b border-r border-[color:var(--rc-rule)]/60 p-1 sm:min-h-28 sm:p-1.5 ${
                date < today ? "bg-black/[0.025]" : ""
              } ${phoneWeeks !== undefined && index >= phoneWeeks * 7 ? "hidden lg:block" : ""}`}
            >
              <p
                className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${
                  isToday ? "text-[color:var(--rc-stamp)]" : "text-[color:var(--rc-muted)]"
                }`}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full ${
                    isToday ? "bg-[color:var(--rc-stamp)] text-[color:var(--rc-paper)]" : ""
                  }`}
                >
                  {dayOfMonth(date)}
                </span>
                {dayOfMonth(date) === 1 ? <span>{monthShort(date)}</span> : null}
              </p>
              <ul className="flex flex-wrap gap-0.5 sm:flex-col sm:flex-nowrap sm:gap-1">
                {entries.map((entry) => (
                  <li key={entry.key} className="sm:w-full">
                    <SessionChip
                      entry={entry}
                      today={today}
                      selected={entry.sessionId === highlightId}
                      dimmed={focus !== null && !focus.has(entry.goal.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The Agenda month as the concepts use it. Before review it is the plain
 * calendar. On a goal step it previews only that goal — its slips, suggested
 * days and saved moves — from the week of its earliest miss; the panel owns
 * the "Show full calendar" switch. On the recap it shows only the goals that
 * slipped — the Auto-rebalance proposal, or what this review saved — and the
 * same switch brings the rest back, dimmed. Phones keep three weeks
 * so the calendar stays visible above the review sheet.
 */
export function RecoveryCalendar({
  review,
  highlightId = null,
}: {
  review: RecoveryReview;
  highlightId?: string | null;
}) {
  const { state, plan, goalId, focusGoalIds, showAll } = review;
  const preview = !state.reviewing ? null : goalId ? onlyGoal(plan, goalId) : state.rebalance ? plan : null;
  const goal = goalId ? goalById(state.seed, goalId) : undefined;
  const settledFrom = state.decisions
    .filter((decision) => !goalId || decision.goalId === goalId)
    .flatMap((decision) => decision.rows.map((row) => row.from));
  const from = startOfWeek(
    earliest([state.today, ...(preview?.rows.map((row) => row.missedDate) ?? []), ...settledFrom])
  );
  const caption = !state.reviewing
    ? "Next four weeks"
    : `${showAll ? "All goals · slipped highlighted" : "Slipped goals"} · ${
        state.rebalance ? "proposed dates, not saved yet" : "as saved"
      }`;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
        {goal ? (
          <p className="flex items-center gap-2 text-sm">
            <GoalSwatch color={goal.color} />
            <span>
              {showAll ? "All goals · " : "Only "}
              <span className="font-semibold">{goal.short}</span>
              {showAll ? " highlighted" : " sessions"}
            </span>
          </p>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--rc-muted)]">{caption}</p>
        )}
        {state.reviewing ? <Legend /> : null}
      </div>
      <MonthGrid
        seed={state.seed}
        preview={preview}
        marks={state.reviewing}
        today={state.today}
        from={from}
        weeks={state.reviewing ? 5 : 4}
        phoneWeeks={state.reviewing ? 3 : undefined}
        focusGoalIds={focusGoalIds}
        showAll={showAll}
        highlightId={highlightId}
      />
    </div>
  );
}
