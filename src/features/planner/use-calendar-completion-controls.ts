import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  getCompletionControlDisabledReason,
  getDateFactDispatchForEntry as resolveDateFactDispatchForEntry,
} from "@/features/planner/completion-entry-dispatch";
import type {
  CompletionControlDisabledReason,
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import {
  isPlannerTaskCalendarEntry,
  plannerTaskIdFromEntry,
} from "@/features/planner/calendar-task-entries";
import { isEntryCredited } from "@/features/planner/calendar-format";
import { getApiErrorMessage } from "@/lib/api/client";
import type { DateFactDispatchForEntry } from "@/features/planner/completion-entry-dispatch";
import { usePlannerEntryMutations } from "@/features/planner/use-planner-entry-mutations";
import type { RunCompletionMutationInput } from "@/features/planner/use-completion-mutation";
import type { PlannerDraftCommand } from "@/lib/planner/draft-commands";
import type { PlannerPolicy } from "@/lib/planner/policy";
import {
  withOptimisticCompletionFact,
  withoutOptimisticCompletionFact,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";

export function useCalendarCompletionControls({
  context,
  hasDraftSession,
  draftSaveCommands,
  effectiveDraftPolicy,
  effectiveDraftItemEdits,
  effectiveSelectedDay,
  setMutationLoadingKey,
  setOptimisticCompletionFacts,
  runCompletionMutation,
  handlePlannerMutation,
  loadContext,
  refreshDraftPreview,
  completePlannerTask,
}: {
  context: PlannerContextPayload | null;
  hasDraftSession: boolean;
  draftSaveCommands: PlannerDraftCommand[];
  effectiveDraftPolicy: PlannerPolicy | null;
  effectiveDraftItemEdits: Record<
    string,
    { scheduledDate?: string | null } | undefined
  >;
  effectiveSelectedDay: string | null;
  setMutationLoadingKey: (value: string | null) => void;
  setOptimisticCompletionFacts: Dispatch<SetStateAction<OptimisticCompletionFacts>>;
  runCompletionMutation: (
    input: RunCompletionMutationInput
  ) => Promise<{ ok: boolean; message: string | null }>;
  handlePlannerMutation: () => void;
  loadContext: (options?: {
    showLoading?: boolean;
    toastOnError?: boolean;
    forcePrepare?: boolean;
  }) => Promise<boolean>;
  refreshDraftPreview: (
    nextPolicy: PlannerPolicy
  ) => Promise<PlannerContextPayload["preview"]>;
  completePlannerTask?: (taskId: string, completed: boolean) => Promise<unknown>;
}) {
  const canMutatePlanItems = Boolean(
    context?.activePlan?.plan.status === "active"
  );

  const getDateFactDispatchForEntry = useCallback(
    (
      entry: PlannerDayDetailEntry,
      selectedDate: string | null = effectiveSelectedDay
    ): DateFactDispatchForEntry | null =>
      resolveDateFactDispatchForEntry({
        entry,
        selectedDate,
        asOfDate: context?.asOfDate ?? null,
      }),
    [context?.asOfDate, effectiveSelectedDay]
  );

  const completionControlDisabledReasonForEntry = useCallback(
    (
      entry: PlannerDayDetailEntry,
      dispatch: DateFactDispatchForEntry | null
    ): CompletionControlDisabledReason | null =>
      getCompletionControlDisabledReason({
        entry,
        dispatch,
        canMutatePlanItems,
      }),
    [canMutatePlanItems]
  );

  const { toggleItemLock, toggleDateFact: toggleGoalDateFact } = usePlannerEntryMutations({
    context,
    hasDraftSession,
    draftSaveCommands,
    effectiveDraftPolicy,
    effectiveDraftItemEdits,
    effectiveSelectedDay,
    setMutationLoadingKey,
    setOptimisticCompletionFacts,
    getDateFactDispatchForEntry,
    completionControlDisabledReasonForEntry,
    runCompletionMutation,
    handlePlannerMutation,
    loadContext,
    refreshDraftPreview,
  });

  const toggleDateFact = useCallback(
    async (
      entry: PlannerDayDetailEntry,
      selectedDateOverride?: string,
      sourceElement?: HTMLElement
    ) => {
      if (isPlannerTaskCalendarEntry(entry)) {
        const taskId = plannerTaskIdFromEntry(entry);
        if (!taskId || !completePlannerTask) {
          return;
        }
        const selectedDate = selectedDateOverride ?? effectiveSelectedDay;
        const nextPresent = !isEntryCredited(entry);
        const mutationKey = `fact:${entry.key}`;
        setMutationLoadingKey(mutationKey);
        if (selectedDate) {
          setOptimisticCompletionFacts((overlay) =>
            withOptimisticCompletionFact(
              overlay,
              entry.originalGoalId,
              selectedDate,
              nextPresent
            )
          );
        }
        try {
          await completePlannerTask(taskId, nextPresent);
          handlePlannerMutation();
        } catch (error) {
          if (selectedDate) {
            setOptimisticCompletionFacts((overlay) =>
              withoutOptimisticCompletionFact(overlay, entry.originalGoalId, selectedDate)
            );
          }
          toast.error(getApiErrorMessage(error, "Could not update the task."));
        } finally {
          setMutationLoadingKey(null);
        }
        return;
      }
      await toggleGoalDateFact(entry, selectedDateOverride, sourceElement);
    },
    [
      completePlannerTask,
      effectiveSelectedDay,
      handlePlannerMutation,
      setMutationLoadingKey,
      setOptimisticCompletionFacts,
      toggleGoalDateFact,
    ]
  );

  return {
    canMutatePlanItems,
    getDateFactDispatchForEntry,
    completionControlDisabledReasonForEntry,
    toggleItemLock,
    toggleDateFact,
  };
}
