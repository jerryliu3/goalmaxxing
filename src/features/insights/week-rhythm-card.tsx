"use client";

import { Check } from "lucide-react";
import { getGoalVisual } from "@/features/planner/goal-visuals";
import type { WeekRhythmGoalRow } from "@/features/insights/week-rhythm-model";
import { cn } from "@/lib/utils";

export function WeekRhythmCard({
  rows,
  loading,
}: {
  rows: WeekRhythmGoalRow[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
        data-testid="progress-week-rhythm"
      >
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Week rhythm
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Loading planned sessions…</p>
      </section>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      data-testid="progress-week-rhythm"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Week rhythm
        </p>
        <p className="font-sans text-xs text-muted-foreground">
          Solid is done · outline is planned · empty is allowed
        </p>
      </div>
      <div className="mt-4 space-y-5">
        {rows.map((row) => {
          const visual = getGoalVisual({
            goalId: row.goalId,
            color: row.color,
            category: null,
          });
          return (
            <div key={row.goalId}>
              <p className="font-display text-sm font-semibold tracking-tight">{row.title}</p>
              <div className="relative mt-2 flex gap-1.5">
                <span
                  className="pointer-events-none absolute top-[13px] right-[5%] left-[5%] h-0.5 bg-border"
                  aria-hidden
                />
                {row.days.map((day) => (
                  <div
                    key={day.date}
                    className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "relative z-[1] grid size-7 place-items-center rounded-full border bg-background",
                        day.state === "planned" && "border-2 bg-background",
                        day.state === "complete" && "border-transparent text-background"
                      )}
                      style={
                        day.state === "complete"
                          ? { backgroundColor: visual.color }
                          : day.state === "planned"
                            ? { borderColor: visual.color }
                            : undefined
                      }
                      aria-label={`${row.title}, ${day.weekdayLabel}: ${day.state}`}
                    >
                      {day.state === "complete" ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : null}
                    </span>
                    <span className="font-sans text-[10px] text-muted-foreground">
                      {day.weekdayLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
