"use client";

import { startOfWeekDateString } from "@/lib/goals/periods";
import { cn } from "@/lib/utils";
import { dateAtColumn, type LanePlan } from "./goal-lanes-model";
import { dateLabel } from "./goal-view-model";

function columnsBetween(first: number, last: number) {
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index);
}

/**
 * Calendar's sticky date header: weekday and day, with the month on the 1st,
 * a firmer rule where each week starts, and today highlighted. Selecting a
 * date opens the day preview. The corner above the goal labels is left empty;
 * the toolbar names the month in view. Only the columns in view are mounted.
 */
export function GoalLaneHeader({
  plan,
  first,
  last,
  today,
  weekStartsOn,
  loading,
  onInspectDate,
  heldAt,
}: {
  plan: LanePlan;
  first: number;
  last: number;
  today: string;
  weekStartsOn: number;
  loading: boolean;
  onInspectDate: (date: string) => void;
  /**
   * A fading copy left behind when Calendar turns off: drawn at the scroll
   * position it had rather than sticky, and no longer interactive.
   */
  heldAt?: { left: number; top: number };
}) {
  const { pitch, label, header } = plan.geometry;
  return (
    <div
      data-lane-header=""
      className={cn(
        "z-30 flex border-b border-border bg-card",
        heldAt ? "pointer-events-none absolute left-0" : "sticky top-0"
      )}
      style={{ height: header, top: heldAt?.top }}
    >
      <div
        aria-hidden
        className={cn(
          "left-0 z-[35] flex-none border-r border-border bg-card",
          heldAt ? "absolute inset-y-0" : "sticky"
        )}
        style={{ width: label, left: heldAt?.left }}
      />
      <div
        className="relative flex-none"
        style={{ width: plan.columns * pitch, marginLeft: heldAt ? label : undefined }}
      >
        {columnsBetween(first, last).map((column) => {
          const date = dateAtColumn(plan, column);
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              data-today={isToday}
              disabled={loading || Boolean(heldAt)}
              aria-label={`Inspect ${dateLabel(date, "EEEE, MMMM d, yyyy")}`}
              onClick={() => onInspectDate(date)}
              className={cn(
                "absolute inset-y-0 flex flex-col items-center justify-center gap-0.5 border-r border-border hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                startOfWeekDateString(date, weekStartsOn) === date && "border-l border-l-foreground/20",
                isToday && "bg-muted text-primary"
              )}
              style={{ left: column * pitch, width: pitch }}
            >
              <small className={cn("text-[10px]", !isToday && "text-muted-foreground")}>
                {dateLabel(date, date.endsWith("-01") ? "EEE · MMM" : "EEE")}
              </small>
              <strong className="font-display text-[20px] font-normal leading-none">
                {dateLabel(date, "d")}
              </strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Calendar's day rules behind the lanes, with today's edge in the primary colour. */
export function GoalLaneGridlines({
  plan,
  first,
  last,
  today,
  height,
}: {
  plan: LanePlan;
  first: number;
  last: number;
  today: string;
  height: number;
}) {
  const { pitch, label } = plan.geometry;
  return (
    <div
      aria-hidden
      data-lane-grid=""
      className="pointer-events-none absolute top-0"
      style={{ left: label, width: plan.columns * pitch, height }}
    >
      {columnsBetween(first, last).map((column) => (
        <div
          key={column}
          className={cn(
            "absolute inset-y-0 border-r border-border",
            dateAtColumn(plan, column) === today && "border-l border-l-primary"
          )}
          style={{ left: column * pitch, width: pitch }}
        />
      ))}
    </div>
  );
}
