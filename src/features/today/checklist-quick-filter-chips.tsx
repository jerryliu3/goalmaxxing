"use client";

import { Button } from "@/components/ui/button";
import type { RecurrenceGroup } from "@/features/today/checklist-selectors";

export function ChecklistQuickFilterChips({
  recurrenceFilters,
  recurrenceQuickFilters,
  onClearRecurrenceFilters,
  onToggleRecurrenceFilter,
  categoryFilters,
  quickCategories,
  onClearCategoryFilters,
  onToggleCategoryFilter,
  testId,
}: {
  recurrenceFilters: RecurrenceGroup[];
  recurrenceQuickFilters: Array<{ value: RecurrenceGroup; label: string }>;
  onClearRecurrenceFilters: () => void;
  onToggleRecurrenceFilter: (value: RecurrenceGroup) => void;
  categoryFilters: string[];
  quickCategories: Array<{ key: string; label: string }>;
  onClearCategoryFilters: () => void;
  onToggleCategoryFilter: (key: string) => void;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1"
    >
      <Button
        type="button"
        aria-pressed={recurrenceFilters.length === 0}
        variant={recurrenceFilters.length === 0 ? "secondary" : "outline"}
        size="sm"
        className="h-8 shrink-0 rounded-full px-3 text-xs"
        onClick={onClearRecurrenceFilters}
      >
        All types
      </Button>
      {recurrenceQuickFilters.map((option) => (
        <Button
          key={`recurrence-quick-${option.value}`}
          aria-pressed={recurrenceFilters.includes(option.value)}
          type="button"
          variant={
            recurrenceFilters.includes(option.value) ? "secondary" : "outline"
          }
          size="sm"
          className="h-8 shrink-0 rounded-full px-3 text-xs"
          onClick={() => onToggleRecurrenceFilter(option.value)}
        >
          {option.label}
        </Button>
      ))}
      <Button
        type="button"
        aria-pressed={categoryFilters.length === 0}
        variant={categoryFilters.length === 0 ? "secondary" : "outline"}
        size="sm"
        className="h-8 shrink-0 rounded-full px-3 text-xs"
        onClick={onClearCategoryFilters}
      >
        All categories
      </Button>
      {quickCategories.map((category) => (
        <Button
          key={`category-quick-${category.key}`}
          aria-pressed={categoryFilters.includes(category.key)}
          type="button"
          variant={
            categoryFilters.includes(category.key) ? "secondary" : "outline"
          }
          size="sm"
          className="h-8 shrink-0 rounded-full px-3 text-xs"
          onClick={() => onToggleCategoryFilter(category.key)}
        >
          {category.label}
        </Button>
      ))}
    </div>
  );
}
