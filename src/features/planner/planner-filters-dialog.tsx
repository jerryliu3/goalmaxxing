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

interface PlannerFiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideTasks: boolean;
  onHideTasksChange: (next: boolean) => void;
  tasksToggleDisabled?: boolean;
  showTasksToggle?: boolean;
  categoryFilters: string[];
  onCategoryFiltersChange: (value: string[]) => void;
  categoryOptions: GoalCategoryFilterOption[];
  endMonthFilters: string[];
  onEndMonthFiltersChange: (value: string[]) => void;
  endMonthOptions: GoalMonthOption[];
  showCompletedGoals?: boolean;
  onShowCompletedGoalsChange?: (value: boolean) => void;
  dayFilters?: ChecklistFiltersFormProps | null;
}

export function PlannerFiltersDialog({
  open,
  onOpenChange,
  hideTasks,
  onHideTasksChange,
  tasksToggleDisabled = false,
  showTasksToggle = true,
  categoryFilters,
  onCategoryFiltersChange,
  categoryOptions,
  endMonthFilters,
  onEndMonthFiltersChange,
  endMonthOptions,
  showCompletedGoals = false,
  onShowCompletedGoalsChange,
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
              : showTasksToggle
                ? "Filter scheduled goals and one time tasks."
                : "Choose which goals appear across the timeline."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(32rem,calc(85vh-8rem))] space-y-4 overflow-y-auto overflow-x-visible">
          {showTasksToggle ? <label className="flex items-start gap-2">
            <input type="checkbox" checked={hideTasks} disabled={tasksToggleDisabled}
              onChange={(event) => onHideTasksChange(event.target.checked)}
              aria-label="Hide tasks" className="mt-1 size-4 shrink-0 accent-primary" />
            <span className="space-y-1">
              <span className="block font-sans text-sm font-medium">Hide tasks</span>
              <span className="block text-xs text-muted-foreground">Hide one time tasks. Goal visibility stays the same.</span>
            </span>
          </label> : null}
          {usingDayFilters ? null : (
            <label className="flex min-w-0 items-start gap-2">
              <input
                type="checkbox"
                checked={showCompletedGoals}
                onChange={(event) =>
                  onShowCompletedGoalsChange?.(event.target.checked)
                }
                className="mt-1 size-4 shrink-0 accent-primary"
                aria-label="Show completed goals"
              />
              <span className="min-w-0 space-y-1">
                <span className="block font-sans text-sm font-medium">Show completed goals</span>
                <span className="block text-xs text-muted-foreground">
                  Show completed goals in the checklist and Goal View, including
                  milestones, and already-done sessions on future days. Past and today still
                  show completed work on the calendar.
                </span>
              </span>
            </label>
          )}
          {usingDayFilters && dayFilters ? (
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
