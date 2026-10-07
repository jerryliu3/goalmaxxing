"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxDropdown } from "@/components/ui/checkbox-dropdown";
import { restWeekdayOptions } from "@/features/planner/calendar-format";
import type { PlannerResetGoalOption } from "@/features/planner/planner-reset-goal-options";

interface PlannerSettingsFormProps {
  setupRestWeekdays: number[];
  onSetupRestWeekdaysChange: (next: number[]) => void;
  setupLoading: boolean;
  plannerReadOnly: boolean;
  loading: boolean;
  canResetPlan: boolean;
  resetLoading: boolean;
  rebuildLoading: boolean;
  hasDraftSession: boolean;
  canShowSaveAction: boolean;
  rebuildBlockedMessage: string | undefined;
  fullResetLoading: boolean;
  goalResetLoading: boolean;
  openGoals: PlannerResetGoalOption[];
  onSaveSettings: () => void;
  onUnlockAllGoals: () => void;
  onRefreshCalendar: () => void;
  onFullReset: () => void;
  onResetGoals: (goals: PlannerResetGoalOption[]) => void;
}

export function PlannerSettingsForm({
  setupRestWeekdays,
  onSetupRestWeekdaysChange,
  setupLoading,
  plannerReadOnly,
  loading,
  canResetPlan,
  resetLoading,
  rebuildLoading,
  hasDraftSession,
  canShowSaveAction,
  rebuildBlockedMessage,
  fullResetLoading,
  goalResetLoading,
  openGoals,
  onSaveSettings,
  onUnlockAllGoals,
  onRefreshCalendar,
  onFullReset,
  onResetGoals,
}: PlannerSettingsFormProps) {
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const goalOptions = useMemo(
    () =>
      openGoals.map((goal) => ({
        value: goal.goalId,
        label: goal.title,
      })),
    [openGoals]
  );
  const openGoalIds = useMemo(
    () => new Set(openGoals.map((goal) => goal.goalId)),
    [openGoals]
  );
  const visibleSelectedGoalIds = useMemo(
    () => selectedGoalIds.filter((goalId) => openGoalIds.has(goalId)),
    [openGoalIds, selectedGoalIds]
  );
  const selectedGoals = useMemo(
    () => openGoals.filter((goal) => visibleSelectedGoalIds.includes(goal.goalId)),
    [openGoals, visibleSelectedGoalIds]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Timezone and first-day-of-week preferences now live in Profile settings.
      </p>
      <div className="space-y-2 text-sm">
        <p>Rest weekdays</p>
        <div className="flex flex-wrap gap-2">
          {restWeekdayOptions.map((option) => (
            <label
              key={option.label}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={setupRestWeekdays.includes(option.value)}
                onChange={(event) =>
                  onSetupRestWeekdaysChange(
                    event.target.checked
                      ? Array.from(new Set([...setupRestWeekdays, option.value])).sort(
                          (left, right) => left - right
                        )
                      : setupRestWeekdays.filter((weekday) => weekday !== option.value)
                  )
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <Button type="button" onClick={onSaveSettings} disabled={setupLoading}>
        {setupLoading ? "Saving settings..." : "Save settings"}
      </Button>
      {!plannerReadOnly ? (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-xs text-muted-foreground">
            Refresh the calendar to rebalance unlocked sessions onto open days.
            Slipped sessions are reviewed from Agenda.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onUnlockAllGoals}
              title={!canResetPlan ? "No locked goals to unlock." : undefined}
              disabled={loading || resetLoading || !canResetPlan}
            >
              {resetLoading ? "Unlocking..." : "Unlock all goals"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onRefreshCalendar}
              title={rebuildBlockedMessage}
              disabled={rebuildLoading || loading || hasDraftSession || !canShowSaveAction}
            >
              {rebuildLoading ? "Refreshing..." : "Refresh calendar"}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-xs text-muted-foreground">
          Full reset clears planner schedule snapshots across the active 24-month horizon.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={onFullReset}
          disabled={fullResetLoading || loading || resetLoading || goalResetLoading}
        >
          {fullResetLoading ? "Running full reset..." : "Full reset planner"}
        </Button>
        <div className="space-y-2 border-t border-destructive/20 pt-3">
          <p className="text-xs text-muted-foreground">
            Reset selected open goals to clear their scheduled sessions across the same
            horizon.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <CheckboxDropdown
              options={goalOptions}
              selectedValues={visibleSelectedGoalIds}
              onSelectedValuesChange={setSelectedGoalIds}
              placeholder={
                openGoals.length === 0 ? "No open goals available" : "Select goals to reset"
              }
              allLabel="No goals selected"
              enableSearch
              searchPlaceholder="Search goals"
              className="w-full sm:flex-1"
              triggerClassName="h-9 rounded-md text-sm"
              menuClassName="z-[220]"
            />
            <Button
              type="button"
              variant="destructive"
              className="sm:w-auto"
              disabled={
                selectedGoals.length === 0 ||
                goalResetLoading ||
                loading ||
                resetLoading ||
                fullResetLoading
              }
              onClick={() => {
                if (selectedGoals.length === 0) {
                  return;
                }
                onResetGoals(selectedGoals);
              }}
            >
              {goalResetLoading
                ? "Resetting goals..."
                : selectedGoals.length > 1
                  ? `Reset ${selectedGoals.length} goals`
                  : "Reset goal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
