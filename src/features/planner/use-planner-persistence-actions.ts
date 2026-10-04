"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  PlannerContextPayload,
  PlannerErrorPayload,
} from "@/features/planner/calendar-surface.types";
import { buildPlannerSaveRequestBody } from "@/lib/planner/save-request";
import { getNonPublishablePreviewMessage } from "@/features/planner/planner-save-availability";
import {
  getApiErrorMessage,
  isApiClientError,
  postJson,
} from "@/lib/api/client";
import { getScopeDateRange, getWindowState } from "@/lib/planner/dates";
import {
  plannerDraftWindowUnavailableMessage,
  type PlannerDraftWindowResult,
} from "@/lib/planner/draft-window";
import type { PlannerDraftCommand } from "@/lib/planner/draft-commands";
import type { PlannerPolicy } from "@/lib/planner/policy";
import { buildPlannerHorizonScopeMonths } from "@/lib/planner/reset-scope";
import type { PlannerResetGoalOption } from "@/features/planner/planner-reset-goal-options";
import { formatPlannerResetGoalSelectionLabel } from "@/features/planner/planner-reset-goal-options";
import { withPlannerRefreshTimeout } from "@/lib/planner/refresh-timeout";
import { shouldUseDirectDraftPersistence } from "@/lib/planner/save-persistence";
import type { SavedPlannerItem } from "@cadence/shared/planner/context";

interface UsePlannerPersistenceActionsArgs {
  context: PlannerContextPayload | null;
  month: string | null;
  hasDraftSession: boolean;
  draftSaveWindow: { start: string; end: string } | null;
  draftSaveWindowResult: PlannerDraftWindowResult;
  draftSaveCommands: PlannerDraftCommand[];
  effectiveDraftPolicy: PlannerPolicy | null;
  draftPreview: NonNullable<PlannerContextPayload["preview"]> | null;
  draftPreviewWindow: { start: string; end: string } | null;
  clearDraftSession: () => void;
  onScheduleDigestChange: (scheduleDigest: string | null, savedItems: SavedPlannerItem[] | null) => void;
  handlePlannerMutation: () => void;
  loadContext: (options?: {
    showLoading?: boolean;
    toastOnError?: boolean;
    forcePrepare?: boolean;
    rebalanceExistingAssignments?: boolean;
  }) => Promise<boolean>;
  cacheDraftPreviewForWindow: (args: {
    preview: NonNullable<PlannerContextPayload["preview"]>;
    window: { start: string; end: string };
  }) => void;
  requestPreviewForWindow: (args: {
    startDate: string;
    endDate: string;
    nextPolicy: PlannerPolicy;
    solveIntent: "stable" | "replan";
    draftCommands: PlannerDraftCommand[];
    recoverPastPlacements?: boolean;
  }) => Promise<NonNullable<PlannerContextPayload["preview"]> | null>;
}

export function usePlannerPersistenceActions({
  context,
  month,
  hasDraftSession,
  draftSaveWindow,
  draftSaveWindowResult,
  draftSaveCommands,
  effectiveDraftPolicy,
  draftPreview,
  draftPreviewWindow,
  clearDraftSession,
  onScheduleDigestChange,
  handlePlannerMutation,
  loadContext,
  cacheDraftPreviewForWindow,
  requestPreviewForWindow,
}: UsePlannerPersistenceActionsArgs) {
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [fullResetLoading, setFullResetLoading] = useState(false);
  const [goalResetLoading, setGoalResetLoading] = useState(false);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const nonPublishablePreviewMessage = useCallback(
    (preview: NonNullable<PlannerContextPayload["preview"]>) =>
      getNonPublishablePreviewMessage({
        preview,
        context,
        draftSaveWindow,
      }),
    [context, draftSaveWindow]
  );

  const savePlan = useCallback(async () => {
    if (!context) {
      return;
    }
    if (!draftSaveWindow) {
      toast.error(plannerDraftWindowUnavailableMessage(draftSaveWindowResult));
      return;
    }
    const expectedDigest = context.revisions.scheduleDigest;
    if (!expectedDigest) {
      toast.error("Planner state is stale. Refresh and regenerate the preview.");
      return;
    }

    setSaveLoading(true);
    let payload: PlannerErrorPayload & {
      replayed?: boolean;
      scheduleDigest?: string | null;
      savedItems?: SavedPlannerItem[] | null;
    };
    try {
      const refreshPolicy = effectiveDraftPolicy ?? context.preferences?.defaultPolicy ?? null;
      const useDirectDraftPersistence = shouldUseDirectDraftPersistence({
        draftCommands: draftSaveCommands,
        requestedPolicy: effectiveDraftPolicy,
      });
      if (useDirectDraftPersistence) {
        try {
          payload = await postJson<
            PlannerErrorPayload & {
              replayed?: boolean;
              scheduleDigest?: string | null;
            }
          >("/api/planner/save", {
            expectedDigest,
            startDate: draftSaveWindow.start,
            endDate: draftSaveWindow.end,
            previewHash: context.preview?.generationInputHash ?? "0".repeat(64),
            eligibilityMode: context.preview?.eligibilityMode,
            confirmationHash: null,
            policy: effectiveDraftPolicy ?? undefined,
            draftCommands: draftSaveCommands,
          });
        } catch (error) {
          toast.error(getApiErrorMessage(error, "Planner save failed."));
          return;
        }
      } else {
        const monthWindow = getScopeDateRange(context.scopeMonth);
        const previewMatchesWriteWindow = (
          preview: NonNullable<PlannerContextPayload["preview"]> | null
        ) => {
          if (!preview) {
            return false;
          }
          if (preview === draftPreview) {
            return (
              draftPreviewWindow?.start === draftSaveWindow.start &&
              draftPreviewWindow?.end === draftSaveWindow.end
            );
          }
          if (
            preview === context.preview &&
            draftSaveCommands.length === 0 &&
            !effectiveDraftPolicy
          ) {
            return (
              draftSaveWindow.start === monthWindow.start &&
              draftSaveWindow.end === monthWindow.end
            );
          }
          return false;
        };
        let savePreview =
          draftPreview ??
          (draftSaveCommands.length === 0 && !effectiveDraftPolicy
            ? context.preview
            : null);
        if (!previewMatchesWriteWindow(savePreview)) {
          savePreview = null;
        }
        if (!savePreview) {
          if (!refreshPolicy) {
            toast.error("Preview is unavailable. Regenerate before saving.");
            return;
          }
          savePreview = await requestPreviewForWindow({
            startDate: draftSaveWindow.start,
            endDate: draftSaveWindow.end,
            nextPolicy: refreshPolicy,
            solveIntent: "stable",
            draftCommands: draftSaveCommands,
          });
          if (savePreview) {
            cacheDraftPreviewForWindow({
              preview: savePreview,
              window: {
                start: draftSaveWindow.start,
                end: draftSaveWindow.end,
              },
            });
          }
        }
        if (!savePreview) {
          toast.error("Preview is unavailable. Regenerate before saving.");
          return;
        }
        const publishBlockedByElapsedWindow =
          getWindowState(draftSaveWindow, context.asOfDate) === "historical";
        if (publishBlockedByElapsedWindow || !savePreview.solver.publishable) {
          toast.error(nonPublishablePreviewMessage(savePreview));
          return;
        }
        const saveRequestBody = buildPlannerSaveRequestBody({
          expectedDigest,
          saveWindow: draftSaveWindow,
          preview: savePreview,
          policy: effectiveDraftPolicy,
          draftCommands: draftSaveCommands,
        });
        try {
          payload = await postJson<
            PlannerErrorPayload & {
              replayed?: boolean;
              scheduleDigest?: string | null;
            }
          >("/api/planner/save", saveRequestBody);
        } catch (error) {
          if (isApiClientError(error) && error.code === "planner_not_publishable") {
            const issueCodes = Array.isArray(error.details?.issueCodes)
              ? error.details.issueCodes.filter(
                  (value): value is string => typeof value === "string"
                )
              : [];
            const detailSuffix = issueCodes.length > 0 ? ` (${issueCodes.join(", ")})` : "";
            toast.error(
              `${error.message ?? "Planner save is currently blocked."}${detailSuffix}`
            );
            return;
          }
          toast.error(getApiErrorMessage(error, "Planner save failed."));
          return;
        }
      }
      onScheduleDigestChange(payload.scheduleDigest ?? null, payload.savedItems ?? null);
      clearDraftSession();
      handlePlannerMutation();
      try {
        const refreshed = await withPlannerRefreshTimeout({
          operation: loadContext({
            showLoading: false,
            toastOnError: false,
          }),
          timeoutMessage:
            "Plan saved, but calendar refresh timed out. Please refresh the page.",
        });
        if (!refreshed) {
          toast.warning(
            "Plan saved. Calendar reload is temporarily unavailable, but the draft is no longer pending."
          );
          return;
        }
        toast.success(payload.replayed ? "Save replayed." : "Plan saved.");
      } catch (error) {
        toast.warning(
          error instanceof Error
            ? `Plan saved. ${error.message}`
            : "Plan saved. Calendar reload is temporarily unavailable."
        );
      }
    } finally {
      setSaveLoading(false);
    }
  }, [
    clearDraftSession,
      context,
    draftPreview,
    draftPreviewWindow?.end,
    draftPreviewWindow?.start,
    draftSaveCommands,
    draftSaveWindow,
    draftSaveWindowResult,
    effectiveDraftPolicy,
    handlePlannerMutation,
    loadContext,
    nonPublishablePreviewMessage,
    onScheduleDigestChange,
    requestPreviewForWindow,
    cacheDraftPreviewForWindow,
  ]);

  const resetPlan = useCallback(async () => {
    if (!context?.scopeMonth) {
      return;
    }
    const expectedDigest = context.revisions.scheduleDigest;
    if (!expectedDigest) {
      toast.error("Planner state is stale. Refresh and try again.");
      return;
    }
    setResetLoading(true);
    try {
      try {
        await postJson("/api/planner/reset", {
          scopeMonth: context.scopeMonth,
          expectedDigest,
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Planner month could not be reset."));
        return;
      }
      try {
        clearDraftSession();
        handlePlannerMutation();
        const refreshed = await withPlannerRefreshTimeout({
          operation: loadContext({
            showLoading: false,
            toastOnError: false,
          }),
          timeoutMessage: "Plan reset, but calendar refresh timed out. Please refresh the page.",
        });
        if (!refreshed) {
          toast.error("Plan reset, but calendar refresh failed. Please refresh the page.");
          return;
        }
        toast.success("Plan reset.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Plan reset, but calendar refresh failed. Please refresh the page."
        );
      }
    } finally {
      setResetLoading(false);
    }
  }, [
    clearDraftSession,
      context,
    handlePlannerMutation,
    loadContext,
  ]);

  const resetPlanFully = useCallback(async () => {
    if (!context) {
      return;
    }
    const expectedDigest = context.revisions.scheduleDigest;
    if (!expectedDigest) {
      toast.error("Planner state is stale. Refresh and try again.");
      return;
    }
    const confirmed = window.confirm(
      "Full reset will replace planner schedules across the planning horizon with a fresh default plan. Continue?"
    );
    if (!confirmed) {
      return;
    }

    setFullResetLoading(true);
    const scopeMonths = buildPlannerHorizonScopeMonths({
      asOfDate: context.asOfDate,
      scopeMonth: context.scopeMonth,
      viewedMonth: month,
    });

    try {
      const payload = await postJson<{ scopeCount: number }>("/api/planner/reset-all", {
        expectedDigest,
        scopeMonths,
      });

      clearDraftSession();
      handlePlannerMutation();
      const refreshed = await withPlannerRefreshTimeout({
        operation: loadContext({
          showLoading: false,
          toastOnError: false,
          forcePrepare: true,
        }),
        timeoutMessage:
          "Full reset ran, but calendar refresh timed out. Please refresh the page.",
      });
      if (!refreshed) {
        toast.error("Full reset ran, but calendar refresh failed. Please refresh the page.");
        return;
      }
      const appliedScopeCount =
        typeof payload.scopeCount === "number" && payload.scopeCount > 0
          ? payload.scopeCount
          : scopeMonths.length;
      toast.success(
        `Full reset complete for ${appliedScopeCount} month${appliedScopeCount === 1 ? "" : "s"}.`
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Full planner reset failed."));
    } finally {
      setFullResetLoading(false);
    }
  }, [
    clearDraftSession,
      context,
    handlePlannerMutation,
    loadContext,
    month,
  ]);

  const resetPlanForGoals = useCallback(
    async (goals: PlannerResetGoalOption[]) => {
      if (!context || goals.length === 0) {
        return;
      }
      const expectedDigest = context.revisions.scheduleDigest;
      if (!expectedDigest) {
        toast.error("Planner state is stale. Refresh and try again.");
        return;
      }
      const selectionLabel = formatPlannerResetGoalSelectionLabel(goals);
      const confirmed = window.confirm(
        `Reset will clear scheduled planner sessions for ${selectionLabel} across the planning horizon. Continue?`
      );
      if (!confirmed) {
        return;
      }

      setGoalResetLoading(true);
      const scopeMonths = buildPlannerHorizonScopeMonths({
        asOfDate: context.asOfDate,
        scopeMonth: context.scopeMonth,
        viewedMonth: month,
      });

      try {
        const payload = await postJson<{
          scopeCount: number;
          deletedCount: number;
          goalCount: number;
        }>("/api/planner/reset-goal", {
          goalIds: goals.map((goal) => goal.goalId),
          expectedDigest,
          scopeMonths,
        });

        clearDraftSession();
        handlePlannerMutation();
        const refreshed = await withPlannerRefreshTimeout({
          operation: loadContext({
            showLoading: false,
            toastOnError: false,
            forcePrepare: true,
          }),
          timeoutMessage:
            "Goal reset ran, but calendar refresh timed out. Please refresh the page.",
        });
        if (!refreshed) {
          toast.error("Goal reset ran, but calendar refresh failed. Please refresh the page.");
          return;
        }
        const appliedScopeCount =
          typeof payload.scopeCount === "number" && payload.scopeCount > 0
            ? payload.scopeCount
            : scopeMonths.length;
        const deletedCount =
          typeof payload.deletedCount === "number" ? payload.deletedCount : 0;
        const goalCount =
          typeof payload.goalCount === "number" ? payload.goalCount : goals.length;
        toast.success(
          deletedCount > 0
            ? `Reset ${goalCount} goal${goalCount === 1 ? "" : "s"} across ${appliedScopeCount} month${appliedScopeCount === 1 ? "" : "s"} (${deletedCount} session${deletedCount === 1 ? "" : "s"} cleared).`
            : `No scheduled sessions to clear for the selected goal${goalCount === 1 ? "" : "s"}.`
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Goal planner reset failed."));
      } finally {
        setGoalResetLoading(false);
      }
    },
    [
      clearDraftSession,
          context,
      handlePlannerMutation,
      loadContext,
      month,
    ]
  );

  const rebuildSchedule = useCallback(async () => {
    if (rebuildLoading) {
      return;
    }
    if (hasDraftSession) {
      toast.error("Save or undo preview changes before rebuilding schedule.");
      return;
    }
    setRebuildLoading(true);
    try {
      handlePlannerMutation();
      const refreshed = await withPlannerRefreshTimeout({
        operation: loadContext({
          showLoading: false,
          toastOnError: false,
          forcePrepare: true,
          rebalanceExistingAssignments: true,
        }),
        timeoutMessage:
          "Schedule rebuild ran, but calendar refresh timed out. Please refresh the page.",
      });
      if (!refreshed) {
        toast.error("Schedule rebuild ran, but calendar refresh failed. Please refresh the page.");
        return;
      }
      toast.success("Schedule rebuilt.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Schedule rebuild failed."));
    } finally {
      setRebuildLoading(false);
    }
  }, [handlePlannerMutation, hasDraftSession, loadContext, rebuildLoading]);

  const discardDraftChanges = useCallback(() => {
    if (!hasDraftSession) {
      return;
    }
    clearDraftSession();
    toast.success("Preview changes reverted to the saved baseline.");
  }, [clearDraftSession, hasDraftSession]);

  return {
    saveLoading,
    resetLoading,
    fullResetLoading,
    goalResetLoading,
    rebuildLoading,
    savePlan,
    resetPlan,
    resetPlanFully,
    resetPlanForGoals,
    rebuildSchedule,
    discardDraftChanges,
  };
}
