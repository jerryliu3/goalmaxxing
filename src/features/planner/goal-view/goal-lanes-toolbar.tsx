"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
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

/**
 * The month in view, the one place Goal View names where you are. It is also
 * the date picker: the native field covers it, so a tap opens the picker on
 * every device.
 */
function MonthJump({ date, onJump }: { date: string; onJump: (date: string) => void }) {
  return (
    <label className="relative inline-flex h-9 cursor-pointer items-center gap-1 rounded-full px-3 hover:bg-muted focus-within:outline-2 focus-within:outline-ring">
      <span aria-hidden className="font-display text-lg leading-none tracking-tight">
        {dateLabel(date, "MMMM yyyy")}
      </span>
      <ChevronDown aria-hidden size={14} className="text-muted-foreground" />
      <DateField
        aria-label={`Jump to a date, showing ${dateLabel(date, "MMMM yyyy")}`}
        value={date}
        onValueChange={(next) => {
          if (next) onJump(next);
        }}
        className="absolute inset-0 h-full w-full min-w-0 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </label>
  );
}

export function GoalLanesToolbar({
  calendarSwitch,
  leadingDate,
  onStep,
  onToday,
  onJump,
}: {
  calendarSwitch: ReactNode;
  /** The date at the left edge (Calendar) or Cards' start date. */
  leadingDate: string;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  onJump: (date: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <MonthJump date={leadingDate} onJump={onJump} />
      <div className="flex items-center gap-1">
        <Button size="icon-round" variant="ghost" aria-label="Earlier dates" onClick={() => onStep(-1)}>
          <ArrowLeft />
        </Button>
        <Button size="sm" variant="outline" className="h-9 rounded-full px-3.5 text-[13px]" onClick={onToday}>
          Today
        </Button>
        <Button size="icon-round" variant="ghost" aria-label="Later dates" onClick={() => onStep(1)}>
          <ArrowRight />
        </Button>
        <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />
        {calendarSwitch}
      </div>
    </div>
  );
}
