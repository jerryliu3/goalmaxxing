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
import {
  ChecklistFiltersForm,
  type ChecklistFiltersFormProps,
} from "@/features/today/checklist-filters-dialog";
import type { GoalMonthOption } from "@/lib/goals/list-view";
import { cn } from "@/lib/utils";

interface PlannerFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTasksInsteadOfGoals: boolean;
  onShowTasksInsteadOfGoalsChange: (next: boolean) => void;
  tasksToggleDisabled?: boolean;
  categoryFilters: string[];
  onCategoryFiltersChange: (value: string[]) => void;
  categoryOptions: GoalCategoryFilterOption[];
  endMonthFilters: string[];
  onEndMonthFiltersChange: (value: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  dayFilters?: ChecklistFiltersFormProps | null;
}

export function PlannerFiltersDialog({
  open,
  onOpenChange,
  showTasksInsteadOfGoals,
  onShowTasksInsteadOfGoalsChange,
  tasksToggleDisabled = false,
  categoryFilters,
  onCategoryFiltersChange,
  categoryOptions,
  endMonthFilters,
  onEndMonthFiltersChange,
  endMonthOptions,
  dayFilters = null,
}: PlannerFiltersDialogProps) {
  const usingDayFilters = dayFilters !== null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className={
          usingDayFilters
            ? "top-auto bottom-0 left-1/2 max-h-[85vh] max-w-[calc(100%-1rem)] -translate-x-1/2 translate-y-0 rounded-b-none rounded-t-xl pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:top-1/2 sm:bottom-auto sm:max-w-lg sm:-translate-y-1/2 sm:rounded-b-xl"
            : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{usingDayFilters ? "Day filters" : "Planner filters"}</DialogTitle>
          <DialogDescription>
            {usingDayFilters
              ? "Filter this day's scheduled work, unscheduled goals, and tasks."
              : "Choose whether the planner shows scheduled goals or date-only tasks."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(32rem,calc(85vh-8rem))] space-y-4 overflow-y-auto overflow-x-visible">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Show tasks instead of goals</p>
              <p className="text-xs text-muted-foreground">
                Hide scheduled goals and show tasks on their scheduled date. Drag a
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
          {showTasksInsteadOfGoals ? null : usingDayFilters && dayFilters ? (
            <ChecklistFiltersForm {...dayFilters} />
          ) : (
            <GoalFilters
              categoryFilterEnabled
              endMonthFilterEnabled
              categoryFilters={categoryFilters}
              onCategoryFiltersChange={onCategoryFiltersChange}
              categoryOptions={categoryOptions}
              endMonthFilters={endMonthFilters}
              onEndMonthFiltersChange={onEndMonthFiltersChange}
              endMonthOptions={endMonthOptions}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
