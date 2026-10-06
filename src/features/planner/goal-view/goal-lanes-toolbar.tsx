"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dateLabel } from "./goal-view-model";

/**
 * Goal View shows cards; this option spreads the same lanes over calendar
 * dates. An on/off switch rather than a choice of views.
 */
export function GoalCalendarSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-2.5 text-[13px] font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span
        aria-hidden
        className={cn(
          "relative h-[18px] w-8 rounded-full transition-colors duration-300 motion-reduce:transition-none",
          checked ? "bg-foreground" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-3.5 rounded-full bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            checked && "translate-x-3.5"
          )}
        />
      </span>
      Calendar
    </button>
  );
}

export function GoalLanesToolbar({
  calendarSwitch,
  leadingDate,
  onStep,
  onToday,
}: {
  calendarSwitch: ReactNode;
  /** The date at the left edge (Calendar) or Cards' start date. */
  leadingDate: string;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* The month in view, the one place Goal View names where you are. */}
      <h3 className="px-3 type-heading text-lg leading-none tracking-tight">
        {dateLabel(leadingDate, "MMMM yyyy")}
      </h3>
      <div className="flex items-center gap-1">
        <Button size="icon-round" variant="ghost" aria-label="Earlier dates" onClick={() => onStep(-1)}>
          <ChevronLeft />
        </Button>
        <Button size="sm" variant="outline" className="h-9 rounded-full px-3.5 text-[13px]" onClick={onToday}>
          Today
        </Button>
        <Button size="icon-round" variant="ghost" aria-label="Later dates" onClick={() => onStep(1)}>
          <ChevronRight />
        </Button>
        <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
        {calendarSwitch}
      </div>
    </div>
  );
}
