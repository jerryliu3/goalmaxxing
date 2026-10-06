"use client";

import type { ReactNode } from "react";
import { CheckboxDropdown } from "@/components/ui/checkbox-dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GoalListControls } from "@/features/goals/goal-list-controls";
import type { RecurrenceGroup } from "@/features/today/checklist-selectors";
import type { GoalDateSort } from "@/lib/goals/list-view";
import type { Goal } from "@/lib/goals/types";

export interface ChecklistVisibilityOption {
  label: string;
  count: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface ChecklistFiltersFormProps {
  categoryFilterOptions: Array<{ value: string; label: string }>;
  categoryFilters: string[];
  onCategoryFiltersChange: (values: string[]) => void;
  recurrenceQuickFilters: Array<{ value: RecurrenceGroup; label: string }>;
  recurrenceFilters: RecurrenceGroup[];
  onRecurrenceFiltersChange: (values: RecurrenceGroup[]) => void;
  completableGoals: Goal[];
  checklistFilterStartMonth: string;
  effectiveTodayEndMonths: string[];
  onTodayEndMonthsChange: (months: string[]) => void;
  todaySort: GoalDateSort;
  onTodaySortChange: (sort: GoalDateSort) => void;
  visibilityOptions: ChecklistVisibilityOption[];
}

export function ChecklistFiltersForm({
  categoryFilterOptions,
  categoryFilters,
  onCategoryFiltersChange,
  recurrenceQuickFilters,
  recurrenceFilters,
  onRecurrenceFiltersChange,
  completableGoals,
  checklistFilterStartMonth,
  effectiveTodayEndMonths,
  onTodayEndMonthsChange,
  todaySort,
  onTodaySortChange,
  visibilityOptions,
}: ChecklistFiltersFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <CheckboxDropdown
            options={categoryFilterOptions}
            selectedValues={categoryFilters}
            onSelectedValuesChange={onCategoryFiltersChange}
            placeholder="All categories"
            allLabel="All categories"
            triggerClassName="h-8 rounded-full bg-background/90 text-xs"
          />
        </label>
        <label className="block min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">Recurrence</Label>
          <CheckboxDropdown
            options={recurrenceQuickFilters}
            selectedValues={recurrenceFilters}
            onSelectedValuesChange={(values) =>
              onRecurrenceFiltersChange(values as RecurrenceGroup[])
            }
            placeholder="All types"
            allLabel="All types"
            triggerClassName="h-8 rounded-full bg-background/90 text-xs"
          />
        </label>
      </div>
      <GoalListControls
        goals={completableGoals}
        referenceMonth={checklistFilterStartMonth}
        endMonths={effectiveTodayEndMonths}
        onEndMonthsChange={onTodayEndMonthsChange}
        sort={todaySort}
        onSortChange={onTodaySortChange}
        className="grid grid-cols-2 gap-3 [&>div]:min-w-0 [&>div]:w-full [&_[role=combobox]]:w-full"
      />
      <div className="grid grid-cols-2 gap-2">
        {visibilityOptions.map((option) => (
          <label
            key={option.label}
            className="flex min-h-10 min-w-0 items-center gap-2 px-1.5 py-2 text-xs"
          >
            <input
              type="checkbox"
              checked={option.checked}
              onChange={(event) => option.onChange(event.target.checked)}
              className="size-4 shrink-0 accent-highlight"
            />
            <span className="min-w-0">
              {option.label}
              <span className="ml-1 text-muted-foreground">({option.count})</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function ChecklistFiltersDialog({
  open,
  onOpenChange,
  title = "Checklist filters",
  extraContent = null,
  ...formProps
}: ChecklistFiltersFormProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  extraContent?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className="top-auto bottom-0 left-1/2 max-h-[85vh] max-w-[calc(100%-1rem)] -translate-x-1/2 translate-y-0 rounded-b-none rounded-t-xl pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:top-1/2 sm:bottom-auto sm:max-w-lg sm:-translate-y-1/2 sm:rounded-b-xl"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {extraContent}
        <ChecklistFiltersForm {...formProps} />
      </DialogContent>
    </Dialog>
  );
}
