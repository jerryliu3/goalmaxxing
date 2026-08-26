import { useCallback } from "react";
import {
  getCompletionControlDisabledReason,
  getDateFactDispatchForEntry as resolveDateFactDispatchForEntry,
} from "@/features/planner/completion-entry-dispatch";
import type {
  CompletionControlDisabledReason,
  PlannerContextPayload,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { DateFactDispatchForEntry } from "@/features/planner/completion-entry-dispatch";
import { usePlannerEntryMutations } from "@/features/planner/use-planner-entry-mutations";
import type { RunCompletionMutationInput } from "@/features/planner/use-completion-mutation";
import type { PlannerDraftCommand } from "@/lib/planner/draft-commands";
import type { PlannerPolicy } from "@/lib/planner/policy";

export function useCalendarCompletionControls({
  context,
  hasDraftSession,
  draftSaveCommands,
  effectiveDraftPolicy,
  effectiveDraftItemEdits,
  effectiveSelectedDay,
  setMutationLoadingKey,
  runCompletionMutation,
  handlePlannerMutation,
  loadContext,
  refreshDraftPreview,
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

  const { toggleItemLock, toggleDateFact } = usePlannerEntryMutations({
    context,
    hasDraftSession,
    draftSaveCommands,
    effectiveDraftPolicy,
    effectiveDraftItemEdits,
    effectiveSelectedDay,
    setMutationLoadingKey,
    getDateFactDispatchForEntry,
    completionControlDisabledReasonForEntry,
    runCompletionMutation,
    handlePlannerMutation,
    loadContext,
    refreshDraftPreview,
  });

  return {
    canMutatePlanItems,
    getDateFactDispatchForEntry,
    completionControlDisabledReasonForEntry,
    toggleItemLock,
    toggleDateFact,
  };
}
