import type { PlannerCoachBindings } from "@/features/planner/coach/coach-types";
import type { PlannerPolicy } from "@/lib/planner/policy";

export function buildPlannerCoachBindings({
  refreshDraftPreview,
  applyPolicyReplanMoves,
  queueDraftMoveCommand,
  clearDraftMoveCommands,
  setDraftPolicy,
  setSetupRestWeekdays,
  draftSaveWindow,
  nonPublishablePreviewMessage,
}: {
  refreshDraftPreview: PlannerCoachBindings["refreshDraftPreview"];
  applyPolicyReplanMoves: PlannerCoachBindings["applyPolicyReplanMoves"];
  queueDraftMoveCommand: PlannerCoachBindings["queueDraftMoveCommand"];
  clearDraftMoveCommands: PlannerCoachBindings["clearDraftMoveCommands"];
  setDraftPolicy: (policy: PlannerPolicy) => void;
  setSetupRestWeekdays: (weekdays: number[]) => void;
  draftSaveWindow: PlannerCoachBindings["coachWindow"];
  nonPublishablePreviewMessage: PlannerCoachBindings["getNonPublishablePreviewMessage"];
}): PlannerCoachBindings {
  return {
    refreshDraftPreview,
    applyPolicyReplanMoves,
    queueDraftMoveCommand,
    clearDraftMoveCommands,
    applyDraftPolicy: (policy) => {
      setDraftPolicy(policy);
      setSetupRestWeekdays([...policy.restWeekdays].sort((left, right) => left - right));
    },
    coachWindow: draftSaveWindow,
    getNonPublishablePreviewMessage: nonPublishablePreviewMessage,
  };
}

export async function refreshPlannerAfterCoachGoalsCreated({
  handlePlannerMutation,
  loadContext,
}: {
  handlePlannerMutation: () => void;
  loadContext: (options: {
    showLoading: boolean;
    toastOnError: boolean;
    forcePrepare: boolean;
  }) => Promise<boolean>;
}) {
  handlePlannerMutation();
  const refreshed = await loadContext({
    showLoading: false,
    toastOnError: true,
    forcePrepare: true,
  });
  if (!refreshed) {
    throw new Error("Planner preparation did not complete.");
  }
}
