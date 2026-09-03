import { useMemo, type ReactNode } from "react";
import { PlannerSettingsForm } from "@/features/planner/planner-settings-form";
import type { PlannerEventDetailDialogCallbacks } from "@/features/planner/planner-event-detail-dialog";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { OpenGoalInstance } from "@/features/planner/use-calendar-view-navigation";

export function buildPlannerSettingsForm({
  setupRestWeekdays,
  setSetupRestWeekdays,
  showTasksOnCalendar,
  onShowTasksOnCalendarChange,
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
  submitSetup,
  recoverPastSessions,
  resetPlan,
  rebuildSchedule,
  resetPlanFully,
}: {
  setupRestWeekdays: number[];
  setSetupRestWeekdays: (value: number[]) => void;
  showTasksOnCalendar: boolean;
  onShowTasksOnCalendarChange: (value: boolean) => void;
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
  submitSetup: () => Promise<void>;
  recoverPastSessions: () => Promise<void>;
  resetPlan: () => void;
  rebuildSchedule: () => Promise<void>;
  resetPlanFully: () => Promise<void>;
}): ReactNode {
  return (
    <PlannerSettingsForm
      setupRestWeekdays={setupRestWeekdays}
      onSetupRestWeekdaysChange={setSetupRestWeekdays}
      showTasksOnCalendar={showTasksOnCalendar}
      onShowTasksOnCalendarChange={onShowTasksOnCalendarChange}
      setupLoading={setupLoading}
      plannerReadOnly={plannerReadOnly}
      recoverLoading={recoverLoading}
      loading={loading}
      saveLoading={saveLoading}
      canRecoverPastSessions={canRecoverPastSessions}
      canResetPlan={canResetPlan}
      resetLoading={resetLoading}
      rebuildLoading={rebuildLoading}
      hasDraftSession={hasDraftSession}
      canShowSaveAction={canShowSaveAction}
      rebuildBlockedMessage={rebuildBlockedMessage}
      fullResetLoading={fullResetLoading}
      onSaveSettings={() => {
        void submitSetup();
      }}
      onRecover={() => {
        void recoverPastSessions();
      }}
      onUnlockAllGoals={resetPlan}
      onRefreshCalendar={() => {
        void rebuildSchedule();
      }}
      onFullReset={() => {
        void resetPlanFully();
      }}
    />
  );
}

export function usePlannerEventDetailCallbacks({
  setSelectedEventEntryKey,
  setLocalSelectedDay,
  updateDraftLabel,
  updateDraftScheduledDate,
  updateDraftScheduledTimeOverride,
  toggleItemLock,
  navigateToOpenInstance,
  selectedGoalOpenInstances,
  selectedGoalOpenInstanceIndex,
}: {
  setSelectedEventEntryKey: (value: string | null) => void;
  setLocalSelectedDay: (value: string | null) => void;
  updateDraftLabel: (entry: PlannerDayDetailEntry, label: string) => void;
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
          setSelectedEventEntryKey(null);
          setLocalSelectedDay(null);
        }
      },
      onUpdateDraftLabel: updateDraftLabel,
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
      setLocalSelectedDay,
      setSelectedEventEntryKey,
      toggleItemLock,
      updateDraftLabel,
      updateDraftScheduledDate,
      updateDraftScheduledTimeOverride,
    ]
  );
}
