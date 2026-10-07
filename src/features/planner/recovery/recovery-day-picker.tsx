"use client";

import { dayLabel, formatDay, formatShort } from "@/lib/planner/recovery/dates";
import type { DayOption, Suggestion } from "@/lib/planner/recovery/model";
import { cn } from "@/lib/utils";

/** The suggested day, dashed until saved; "No day left" when nothing fits. */
export function SuggestedDayPill({ row, today }: { row: Suggestion; today: string }) {
  if (!row.date) {
    return (
      <span className="inline-flex min-h-8 flex-none items-center rounded-full border border-dashed border-warning px-3 text-xs font-semibold text-recover">
        No day left
      </span>
    );
  }
  return (
    <span
      className="inline-flex min-h-8 flex-none items-center rounded-full border-[1.5px] border-dashed border-foreground px-3 text-xs font-semibold"
      title={`Suggested ${formatDay(row.date)}`}
    >
      {dayLabel(row.date, today)}
    </span>
  );
}

function optionNote(option: DayOption) {
  if (option.sameGoal) return "taken";
  if (option.rest) return "rest";
  return null;
}

/** Day picker limited to the row's credit window; taken days stay visible but disabled. */
export function RecoveryDayStrip({
  options,
  today,
  label,
  selected,
  suggested,
  onPick,
}: {
  options: readonly DayOption[];
  today: string;
  label: string;
  selected: string | null;
  suggested: string | null;
  onPick: (date: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label={label}>
      {options.map((option) => {
        const isSelected = option.date === selected;
        const note = optionNote(option);
        return (
          <button
            key={option.date}
            type="button"
            disabled={!option.available}
            aria-pressed={isSelected}
            aria-label={`${formatDay(option.date)}${note ? ` (${note})` : ""}${option.date === suggested ? ", suggested" : ""}`}
            onClick={() => onPick(option.date)}
            className={cn(
              "flex min-h-14 min-w-12 flex-none flex-col items-center justify-center rounded-xl border px-2 text-xs transition-colors disabled:cursor-not-allowed",
              isSelected
                ? "border-foreground bg-foreground text-background"
                : option.available
                  ? cn(
                      "bg-card hover:border-foreground",
                      option.date === suggested ? "border-dashed border-foreground" : "border-border"
                    )
                  : "border-transparent text-muted-foreground opacity-50"
            )}
          >
            <span className="font-semibold">{dayLabel(option.date, today)}</span>
            <span className="text-[10px] tabular-nums opacity-75">{note ?? formatShort(option.date)}</span>
          </button>
        );
      })}
    </div>
  );
}
