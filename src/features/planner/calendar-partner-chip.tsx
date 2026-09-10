"use client";

import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { planLedgerTitleClass, planLedgerSubtitleClass } from "@/features/planner/calendar-day-chrome";

export function CalendarPartnerChip({
  title,
  completed = false,
  density = "compact",
  description = null,
  className,
}: {
  title: string;
  completed?: boolean;
  density?: "compact" | "expanded";
  description?: string | null;
  className?: string;
}) {
  const statusCopy = completed ? "Partner marked this done." : "Partner goal.";
  const expanded = density === "expanded";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center text-primary",
        expanded
          ? "gap-3 rounded-[10px] bg-muted px-2 py-3"
          : "gap-1.5 rounded-[10px] border-2 border-primary bg-background px-1.5 py-1 text-[11px]",
        className
      )}
      data-calendar-partner-chip=""
      aria-label={`${title}. ${statusCopy}`}
    >
      <UserRound
        className={cn("shrink-0", expanded ? "size-4" : "size-3")}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "min-w-0 font-medium",
            expanded
              ? planLedgerTitleClass
              : "truncate",
            completed && "line-through"
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={
              expanded
                ? planLedgerSubtitleClass
                : "truncate text-[11px] text-muted-foreground"
            }
          >
            {description}
          </p>
        ) : null}
      </div>
      <span className="sr-only">{statusCopy}</span>
    </div>
  );
}
