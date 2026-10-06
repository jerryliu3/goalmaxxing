"use client";

import { useMemo } from "react";
import { toggleExclusiveSelection } from "@/lib/filters/toggle-exclusive-selection";
import { buildQuickEndDateChipOptions } from "@/lib/filters/quick-end-date-chips";
import { cn } from "@/lib/utils";

export function PlannerEndMonthQuickFilterChips({
  referenceMonth,
  endMonthFilters,
  onEndMonthFiltersChange,
  testId = "planner-end-month-quick-filters",
}: {
  referenceMonth: string;
  endMonthFilters: string[];
  onEndMonthFiltersChange: (months: string[]) => void;
  testId?: string;
}) {
  const quickEndMonths = useMemo(
    () => buildQuickEndDateChipOptions(referenceMonth),
    [referenceMonth]
  );

  return (
    <div
      data-testid={testId}
      className="contents"
    >
      {quickEndMonths.map((option) => {
        const selected =
          option.value === null
            ? endMonthFilters.length === 0
            : endMonthFilters.includes(option.value);
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            // Hairline chips; the selected one is a solid ink pill.
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]",
              selected
                ? "border-foreground bg-foreground font-medium text-background"
                : "border-border bg-background text-foreground/80 hover:border-foreground/40 hover:text-foreground"
            )}
            onClick={() => {
              if (option.value === null) {
                onEndMonthFiltersChange([]);
                return;
              }
              onEndMonthFiltersChange(
                toggleExclusiveSelection(endMonthFilters, option.value)
              );
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
