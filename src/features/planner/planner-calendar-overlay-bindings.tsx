import { useMemo, type ReactNode } from "react";
import { PlannerSettingsForm } from "@/features/planner/planner-settings-form";
import type { PlannerEventDetailDialogCallbacks } from "@/features/planner/planner-event-detail-dialog";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { OpenGoalInstance } from "@/features/planner/use-calendar-view-navigation";
import type { PlannerResetGoalOption } from "@/features/planner/planner-reset-goal-options";

export function buildPlannerSettingsForm({
  setupRestWeekdays,
  setSetupRestWeekdays,
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
  submitSetup,
  resetPlan,
  rebuildSchedule,
  resetPlanFully,
  resetPlanForGoals,
}: {
  setupRestWeekdays: number[];
  setSetupRestWeekdays: (value: number[]) => void;
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
  submitSetup: () => Promise<void>;
  resetPlan: () => void;
  rebuildSchedule: () => Promise<void>;
  resetPlanFully: () => Promise<void>;
  resetPlanForGoals: (goals: PlannerResetGoalOption[]) => Promise<void>;
}): ReactNode {
  return (
    <PlannerSettingsForm
      setupRestWeekdays={setupRestWeekdays}
      onSetupRestWeekdaysChange={setSetupRestWeekdays}
      setupLoading={setupLoading}
      plannerReadOnly={plannerReadOnly}
      loading={loading}
      canResetPlan={canResetPlan}
      resetLoading={resetLoading}
      rebuildLoading={rebuildLoading}
      hasDraftSession={hasDraftSession}
      canShowSaveAction={canShowSaveAction}
      rebuildBlockedMessage={rebuildBlockedMessage}
      fullResetLoading={fullResetLoading}
      goalResetLoading={goalResetLoading}
      openGoals={openGoals}
      onSaveSettings={() => {
        void submitSetup();
      }}
      onUnlockAllGoals={resetPlan}
      onRefreshCalendar={() => {
        void rebuildSchedule();
      }}
      onFullReset={() => {
        void resetPlanFully();
      }}
      onResetGoals={(goals) => {
        void resetPlanForGoals(goals);
      }}
    />
  );
}

export function usePlannerEventDetailCallbacks({
  resetPlannerEntrySelection,
  setLocalSelectedDay,
  updateDraftScheduledDate,
  updateDraftScheduledTimeOverride,
  toggleItemLock,
  navigateToOpenInstance,
  selectedGoalOpenInstances,
  selectedGoalOpenInstanceIndex,
}: {
  resetPlannerEntrySelection: (options?: { clearGoalFocus?: boolean }) => void;
  setLocalSelectedDay: (value: string | null) => void;
  updateDraftScheduledDate: (entry: PlannerDayDetailEntry, date: string) => void;
  updateDraftScheduledTimeOverride: (
    entry: PlannerDayDetailEntry,
    localTime: string
  ) => void;
  toggleItemLock: (entry: PlannerDayDetailEntry) => Promise<void>;
  navigateToOpenInstance: (target: OpenGoalInstance | undefined) => void;
  selectedGoalOpenInstances: OpenGoalInstance[];
  selectedGoalOpenInstanceIndex: number;
}) {
  return useMemo<PlannerEventDetailDialogCallbacks>(
    () => ({
      onOpenChange: (open) => {
        if (!open) {
          resetPlannerEntrySelection();
          setLocalSelectedDay(null);
        }
      },
      onUpdateDraftScheduledDate: updateDraftScheduledDate,
      onUpdateDraftScheduledTimeOverride: updateDraftScheduledTimeOverride,
      onToggleItemLock: (entry) => {
        void toggleItemLock(entry);
      },
      onNavigateToFirstOpenInstance: () => {
        navigateToOpenInstance(selectedGoalOpenInstances[0]);
      },
      onNavigateToPreviousOpenInstance: () => {
        if (selectedGoalOpenInstanceIndex <= 0) {
          return;
        }
        navigateToOpenInstance(
          selectedGoalOpenInstances[selectedGoalOpenInstanceIndex - 1]
        );
      },
      onNavigateToNextOpenInstance: () => {
        if (
          selectedGoalOpenInstanceIndex < 0 ||
          selectedGoalOpenInstanceIndex >= selectedGoalOpenInstances.length - 1
        ) {
          return;
        }
        navigateToOpenInstance(
          selectedGoalOpenInstances[selectedGoalOpenInstanceIndex + 1]
        );
      },
      onNavigateToLastOpenInstance: () => {
        navigateToOpenInstance(
          selectedGoalOpenInstances[selectedGoalOpenInstances.length - 1]
        );
      },
    }),
    [
      navigateToOpenInstance,
      selectedGoalOpenInstanceIndex,
      selectedGoalOpenInstances,
      resetPlannerEntrySelection,
      setLocalSelectedDay,
      toggleItemLock,
      updateDraftScheduledDate,
      updateDraftScheduledTimeOverride,
    ]
  );
}
