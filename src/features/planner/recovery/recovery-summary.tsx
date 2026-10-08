"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/planner/recovery/dates";
import type { Suggestion } from "@/lib/planner/recovery/model";
import { DecidedRow, ShiftedSessions } from "@/features/planner/recovery/recovery-goal-step";
import { summaryCounts, summaryGroups, summaryLine } from "@/features/planner/recovery/review-state";
import type { RecoveryReview } from "@/features/planner/recovery/use-recovery-review";

const actionClass = "h-9 rounded-full px-3.5";

/** A row still open, left for later with a way back to it. */
function OpenSummaryRow({ row, review }: { row: Suggestion; review: RecoveryReview }) {
  return (
    <li className="flex items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="type-item truncate text-sm">{row.label}</p>
        <p className="text-xs text-muted-foreground">
          Missed {formatDay(row.missedDate)} ·{" "}
          <span className={row.date ? undefined : "text-recover"}>
            {row.date ? `suggested ${formatDay(row.date)}` : "no day left"}
          </span>
        </p>
        <p className="mt-0.5 text-xs font-semibold text-recover">Left for later</p>
      </div>
      <Button
        variant="ghost"
        className={actionClass}
        onClick={() => review.goTo(row.goalId)}
        aria-label={`Review ${row.label} missed ${formatDay(row.missedDate)}`}
      >
        Review
      </Button>
    </li>
  );
}

/** Every change recovery mode staged, grouped by goal, old → new. */
export function RecoverySummary({ review }: { review: RecoveryReview }) {
  const { state, plan, changes, goals } = review;
  return (
    <div>
      <p className="text-sm text-muted-foreground" role="status">
        {summaryLine(summaryCounts(changes, plan))}
      </p>
      {summaryGroups(state, changes, plan, goals).map((group) => (
        <section
          key={group.goal.id}
          aria-label={`${group.goal.title} changes`}
          className="mt-4 border-t border-border pt-3"
        >
          <h3 className="type-heading text-base">{group.goal.title}</h3>
          {group.note ? <p className="mt-1 text-xs text-recover">{group.note}</p> : null}
          <ul className="divide-y divide-border">
            {group.items.map((item) =>
              item.type === "decided" ? (
                <DecidedRow key={item.row.sessionId} row={item.row} review={review} />
              ) : (
                <OpenSummaryRow key={item.row.sessionId} row={item.row} review={review} />
              )
            )}
          </ul>
          <ShiftedSessions
            goalId={group.goal.id}
            goalTitle={group.goal.title}
            shifts={group.shifts}
            review={review}
          />
        </section>
      ))}
    </div>
  );
}

export function RecoverySummaryActions({ review }: { review: RecoveryReview }) {
  const { state } = review;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button variant="ghost" className={actionClass} disabled={!state.steps.length} onClick={review.back}>
        <ChevronLeft aria-hidden />
        Back
      </Button>
      <Button className={actionClass} disabled={!review.hasChanges || review.saving} onClick={review.save}>
        {review.saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
