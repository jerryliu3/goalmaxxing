"use client";

import { addMonths, format, parseISO } from "date-fns";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toggleExclusiveSelection } from "@/lib/filters/toggle-exclusive-selection";

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
    () => {
      const referenceDate = parseISO(`${referenceMonth}-01`);
      return [
        { key: "all-end-months", label: "All", value: null },
        { key: "this-month", label: "This month", value: referenceMonth },
        {
          key: "next-month",
          label: "Next month",
          value: format(addMonths(referenceDate, 1), "yyyy-MM"),
        },
        {
          key: "year-end",
          label: "Year end",
          value: `${referenceMonth.slice(0, 4)}-12`,
        },
      ];
    },
    [referenceMonth]
  );

  return (
    <div
      data-testid={testId}
      className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1"
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
