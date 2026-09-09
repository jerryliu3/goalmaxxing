"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toggleExclusiveSelection } from "@/lib/filters/toggle-exclusive-selection";
import { buildQuickEndDateChipOptions } from "@/lib/filters/quick-end-date-chips";

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
      {quickEndMonths.map((option) => (
        <Button
          key={option.key}
          type="button"
          variant={
            option.value === null
              ? endMonthFilters.length === 0
                ? "default"
                : "outline"
              : endMonthFilters.includes(option.value)
                ? "default"
                : "outline"
          }
          size="sm"
          className="h-8 shrink-0 rounded-full px-3 text-xs"
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
        </Button>
      ))}
    </div>
  );
}
