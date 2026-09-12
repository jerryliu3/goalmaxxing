"use client";

import { CheckboxDropdown } from "@/components/ui/checkbox-dropdown";
import { Label } from "@/components/ui/label";
import type { GoalMonthOption } from "@/lib/goals/list-view";
import { cn } from "@/lib/utils";

export interface GoalCategoryFilterOption {
  value: string;
  label: string;
}

interface GoalFiltersProps {
  categoryFilterEnabled?: boolean;
  endMonthFilterEnabled?: boolean;
  goalFilterEnabled?: boolean;
  categoryFilters: string[];
  onCategoryFiltersChange: (nextCategories: string[]) => void;
  categoryOptions: GoalCategoryFilterOption[];
  goalIdFilters?: string[];
  onGoalIdFiltersChange?: (nextGoalIds: string[]) => void;
  goalFilterOptions?: GoalCategoryFilterOption[];
  endMonthFilters: string[];
  onEndMonthFiltersChange: (nextEndMonths: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  className?: string;
}

export function GoalFilters({
  categoryFilterEnabled = true,
  endMonthFilterEnabled = true,
  goalFilterEnabled = false,
  categoryFilters,
  onCategoryFiltersChange,
  categoryOptions,
  goalIdFilters = [],
  onGoalIdFiltersChange,
  goalFilterOptions = [],
  endMonthFilters,
  onEndMonthFiltersChange,
  endMonthOptions,
  className,
}: GoalFiltersProps) {
  if (!categoryFilterEnabled && !endMonthFilterEnabled && !goalFilterEnabled) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {categoryFilterEnabled ? (
        <label className="block min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <CheckboxDropdown
            options={categoryOptions}
            selectedValues={categoryFilters}
            onSelectedValuesChange={onCategoryFiltersChange}
            placeholder="All categories"
            allLabel="All categories"
            triggerClassName="h-8 rounded-full bg-background/90 text-xs"
          />
        </label>
      ) : null}

      {goalFilterEnabled && onGoalIdFiltersChange ? (
        <label className="block min-w-0 space-y-1 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Goals</Label>
          <CheckboxDropdown
            options={goalFilterOptions}
            selectedValues={goalIdFilters}
            onSelectedValuesChange={onGoalIdFiltersChange}
            placeholder="All goals"
            allLabel="All goals"
            triggerClassName="h-8 rounded-full bg-background/90 text-xs"
          />
        </label>
      ) : null}

      {endMonthFilterEnabled ? (
        <label className="block min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">Ending in</Label>
          <CheckboxDropdown
            options={endMonthOptions}
            selectedValues={endMonthFilters}
            onSelectedValuesChange={onEndMonthFiltersChange}
            placeholder="All end months"
            allLabel="All end months"
            triggerClassName="h-8 rounded-full bg-background/90 text-xs"
          />
        </label>
      ) : null}
    </div>
  );
}
