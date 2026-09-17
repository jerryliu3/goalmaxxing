"use client";

import { Check } from "lucide-react";
import type { ProgressWeekStripDay } from "@/features/insights/progress-overview/progress-summary-model";
import { cn } from "@/lib/utils";

export function ProgressWeekSummary({ days }: { days: readonly ProgressWeekStripDay[] }) {
  return (
    <ul
      className="flex items-start justify-between gap-1"
      data-testid="progress-week-summary"
    >
      {days.map((day) => (
        <li
          key={day.date}
          className="flex min-w-0 flex-1 flex-col items-center gap-2"
        >
          <span className="font-sans text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {day.weekdayLabel}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 place-items-center rounded-full border",
              day.state === "complete" && "border-primary bg-primary text-primary-foreground",
              day.state === "planned" && "border-2 border-primary/60 bg-background",
              day.state === "empty" && "border-border bg-background",
              day.isToday && day.state === "empty" && "border-foreground/40"
            )}
          >
            {day.state === "complete" ? <Check className="size-4" /> : null}
          </span>
          <span className="sr-only">{`${day.date}: ${day.state}`}</span>
        </li>
      ))}
    </ul>
  );
}
