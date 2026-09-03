"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GoalFilters,
  type GoalCategoryFilterOption,
} from "@/features/goals/goal-filters";
import type { GoalMonthOption } from "@/lib/goals/list-view";
import { cn } from "@/lib/utils";

interface PlannerFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTasksInsteadOfGoals: boolean;
  onShowTasksInsteadOfGoalsChange: (next: boolean) => void;
  tasksToggleDisabled?: boolean;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: GoalCategoryFilterOption[];
  endMonthFilter: string | null;
  onEndMonthFilterChange: (value: string | null) => void;
  endMonthOptions: GoalMonthOption[];
}

export function PlannerFiltersDialog({
  open,
  onOpenChange,
  showTasksInsteadOfGoals,
  onShowTasksInsteadOfGoalsChange,
  tasksToggleDisabled = false,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  endMonthFilter,
  onEndMonthFilterChange,
  endMonthOptions,
}: PlannerFiltersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calendar filters</DialogTitle>
          <DialogDescription>
            Choose whether the calendar shows planned goals or date-only tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Show tasks instead of goals</p>
              <p className="text-xs text-muted-foreground">
                Hide planned goals and show tasks on their scheduled date. Drag a
                task to change that date immediately.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showTasksInsteadOfGoals}
              aria-label="Show tasks instead of goals"
              disabled={tasksToggleDisabled}
              onClick={() =>
                onShowTasksInsteadOfGoalsChange(!showTasksInsteadOfGoals)
              }
              className={cn(
                "relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                showTasksInsteadOfGoals ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
                  showTasksInsteadOfGoals && "translate-x-4"
                )}
              />
            </button>
          </div>
          {showTasksInsteadOfGoals ? null : (
            <GoalFilters
              categoryFilterEnabled
              endMonthFilterEnabled
              categoryFilter={categoryFilter}
              onCategoryFilterChange={onCategoryFilterChange}
              categoryOptions={categoryOptions}
              endMonthFilter={endMonthFilter}
              onEndMonthFilterChange={onEndMonthFilterChange}
              endMonthOptions={endMonthOptions}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
