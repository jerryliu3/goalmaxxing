"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { restWeekdayOptions } from "@/features/planner/calendar-format";
import type { PlannerResetGoalOption } from "@/features/planner/planner-reset-goal-options";

interface PlannerSettingsFormProps {
  setupRestWeekdays: number[];
  onSetupRestWeekdaysChange: (next: number[]) => void;
  setupLoading: boolean;
  plannerReadOnly: boolean;
  recoverLoading: boolean;
  loading: boolean;
  saveLoading: boolean;
  canRecoverPastSessions: boolean;
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
  onRecover: () => void;
  onUnlockAllGoals: () => void;
  onRefreshCalendar: () => void;
  onFullReset: () => void;
  onResetGoal: (goalId: string, goalTitle: string) => void;
}

export function PlannerSettingsForm({
  setupRestWeekdays,
  onSetupRestWeekdaysChange,
  setupLoading,
  plannerReadOnly,
  recoverLoading,
  loading,
  saveLoading,
  canRecoverPastSessions,
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
  onRecover,
  onUnlockAllGoals,
  onRefreshCalendar,
  onFullReset,
  onResetGoal,
}: PlannerSettingsFormProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const selectedGoal =
    openGoals.find((goal) => goal.goalId === selectedGoalId) ?? null;

  useEffect(() => {
    if (openGoals.length === 0) {
      setSelectedGoalId("");
      return;
    }
    if (!openGoals.some((goal) => goal.goalId === selectedGoalId)) {
      setSelectedGoalId(openGoals[0]?.goalId ?? "");
    }
  }, [openGoals, selectedGoalId]);

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
            Use these tools to refresh the current calendar projection or clear lock-based
            blockers.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onRecover}
              title="Recover missed activities that were left behind in the past"
              disabled={recoverLoading || loading || saveLoading || !canRecoverPastSessions}
            >
              {recoverLoading ? "Recovering missed activities..." : "Recover missed activities"}
            </Button>
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
            Reset one open goal to clear its scheduled sessions across the same horizon.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={selectedGoalId || undefined}
              onValueChange={setSelectedGoalId}
              disabled={openGoals.length === 0 || goalResetLoading || loading}
            >
              <SelectTrigger className="w-full sm:flex-1" aria-label="Goal to reset">
                <SelectValue
                  placeholder={
                    openGoals.length === 0 ? "No open goals available" : "Select a goal"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {openGoals.map((goal) => (
                  <SelectItem key={goal.goalId} value={goal.goalId}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="destructive"
              className="sm:w-auto"
              disabled={
                !selectedGoal ||
                goalResetLoading ||
                loading ||
                resetLoading ||
                fullResetLoading
              }
              onClick={() => {
                if (!selectedGoal) {
                  return;
                }
                onResetGoal(selectedGoal.goalId, selectedGoal.title);
              }}
            >
              {goalResetLoading ? "Resetting goal..." : "Reset goal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
