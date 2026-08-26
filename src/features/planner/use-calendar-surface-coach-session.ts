"use client";

import { useCallback } from "react";
import { usePlannerCoach } from "@/features/planner/coach/use-planner-coach";
import type { UsePlannerCoachArgs } from "@/features/planner/coach/coach-types";
import {
  buildPlannerCoachBindings,
  refreshPlannerAfterCoachGoalsCreated,
} from "@/features/planner/planner-coach-surface-bindings";
import type { LoadPlannerContextOptions } from "@/features/planner/use-planner-context-loader";
import type { PlannerPolicy } from "@/lib/planner/policy";

type CoachSessionArgs = Pick<
  UsePlannerCoachArgs,
  | "activeTab"
  | "context"
  | "entriesByDate"
  | "effectivePreview"
  | "effectiveDraftPolicy"
  | "hasDraftSession"
  | "refreshDraftPreview"
  | "applyPolicyReplanMoves"
  | "queueDraftMoveCommand"
  | "clearDraftMoveCommands"
> & {
  handlePlannerMutation: () => void;
  loadContext: (options?: LoadPlannerContextOptions) => Promise<boolean>;
  setDraftPolicy: (policy: PlannerPolicy | null) => void;
  setSetupRestWeekdays: (value: number[]) => void;
  draftSaveWindow: UsePlannerCoachArgs["coachWindow"];
  nonPublishablePreviewMessage: UsePlannerCoachArgs["getNonPublishablePreviewMessage"];
};

export function useCalendarSurfaceCoachSession({
  activeTab,
  context,
  entriesByDate,
  effectivePreview,
  effectiveDraftPolicy,
  hasDraftSession,
  handlePlannerMutation,
  loadContext,
  refreshDraftPreview,
  applyPolicyReplanMoves,
  queueDraftMoveCommand,
  clearDraftMoveCommands,
  setDraftPolicy,
  setSetupRestWeekdays,
  draftSaveWindow,
  nonPublishablePreviewMessage,
}: CoachSessionArgs) {
  const handleCoachGoalsCreated = useCallback(async () => {
    await refreshPlannerAfterCoachGoalsCreated({
      handlePlannerMutation,
      loadContext,
    });
  }, [handlePlannerMutation, loadContext]);

  const coachBindings = buildPlannerCoachBindings({
    refreshDraftPreview,
    applyPolicyReplanMoves,
    queueDraftMoveCommand,
    clearDraftMoveCommands,
    setDraftPolicy: (policy) => {
      setDraftPolicy(policy);
    },
    setSetupRestWeekdays,
    draftSaveWindow,
    nonPublishablePreviewMessage,
  });

  return usePlannerCoach({
    activeTab,
    context,
    entriesByDate,
    effectivePreview,
    effectiveDraftPolicy,
    hasDraftSession,
    onGoalsCreated: handleCoachGoalsCreated,
    ...coachBindings,
  });
}
