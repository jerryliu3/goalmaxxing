"use client";

import { useCallback, useEffect, useRef, type Dispatch } from "react";
import { toast } from "sonner";
import {
  draftCommandReducer,
  selectDraftCommands,
  type DraftCommandAction,
  type DraftCommandState,
} from "@/features/planner/draft-command-reducer";
import type {
  PlannerContextPayload,
  PlannerPreviewResponsePayload,
  PlannerWorkUnit,
} from "@/features/planner/calendar-surface.types";
import { shouldBlockAutomatedReplanMoveForEntry } from "@/features/planner/replan-move-guard";
import { getApiErrorMessage, postJson } from "@/lib/api/client";
import {
  draftCommandEntryKey,
  sortPlannerDraftCommands,
  type PlannerDraftCommand,
} from "@/lib/planner/draft-commands";
import {
  PLANNER_DRAFT_WINDOW_TOO_WIDE_MESSAGE,
  plannerDraftWindowUnavailableMessage,
  type PlannerDraftWindowResult,
  tryBuildPlannerDraftSaveWindow,
} from "@/lib/planner/draft-window";
import type { PlannerPolicy } from "@/lib/planner/policy";

interface UsePlannerPreviewSessionArgs {
  context: PlannerContextPayload | null;
  effectivePreview: PlannerContextPayload["preview"] | null;
  draftSaveWindow: { start: string; end: string } | null;
  draftSaveWindowResult: PlannerDraftWindowResult;
  draftWindowWorkUnits: PlannerWorkUnit[];
  draftCommandState: DraftCommandState;
  draftSaveCommands: PlannerDraftCommand[];
  dispatchDraftCommand: Dispatch<DraftCommandAction>;
  setDraftPreview: (
    preview: NonNullable<PlannerContextPayload["preview"]> | null
  ) => void;
  setDraftPreviewWindow: (window: { start: string; end: string } | null) => void;
}

export function usePlannerPreviewSession({
  context,
  effectivePreview,
  draftSaveWindow,
  draftSaveWindowResult,
  draftWindowWorkUnits,
  draftCommandState,
  draftSaveCommands,
  dispatchDraftCommand,
  setDraftPreview,
  setDraftPreviewWindow,
}: UsePlannerPreviewSessionArgs) {
  const draftSaveCommandsRef = useRef(draftSaveCommands);

  useEffect(() => {
    draftSaveCommandsRef.current = draftSaveCommands;
  }, [draftSaveCommands]);

  const requestPreviewForWindow = useCallback(
    async ({
      startDate,
      endDate,
      nextPolicy,
      solveIntent,
      draftCommands,
    }: {
      startDate: string;
      endDate: string;
      nextPolicy: PlannerPolicy;
      solveIntent: "stable" | "replan";
      draftCommands: PlannerDraftCommand[];
    }) => {
      if (!context?.timezone) {
        throw new Error("Planner context is unavailable.");
      }
      try {
        const previewPayload = await postJson<PlannerPreviewResponsePayload>(
          "/api/planner/context",
          {
            startDate,
            endDate,
            timezone: context.timezone,
            policy: nextPolicy,
            source: context.activePlan ? "update" : "manual",
            solveIntent,
            draftCommands,
          }
        );
        return previewPayload.preview;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Preview refresh failed."));
      }
    },
    [context]
  );

  const requestPreview = useCallback(
    async (
      nextPolicy: PlannerPolicy,
      solveIntent: "stable" | "replan",
      draftCommands: PlannerDraftCommand[]
    ) => {
      if (!draftSaveWindow) {
        throw new Error(
          plannerDraftWindowUnavailableMessage(draftSaveWindowResult)
        );
      }
      return requestPreviewForWindow({
        startDate: draftSaveWindow.start,
        endDate: draftSaveWindow.end,
        nextPolicy,
        solveIntent,
        draftCommands,
      });
    },
    [draftSaveWindow, draftSaveWindowResult, requestPreviewForWindow]
  );

  const cacheDraftPreviewForWindow = useCallback(
    ({
      preview,
      window,
    }: {
      preview: NonNullable<PlannerContextPayload["preview"]>;
      window: { start: string; end: string };
    }) => {
      setDraftPreview(preview);
      setDraftPreviewWindow({
        start: window.start,
        end: window.end,
      });
    },
    [setDraftPreview, setDraftPreviewWindow]
  );

  const refreshDraftPreview = useCallback(
    async (nextPolicy: PlannerPolicy) => {
      const preview = await requestPreview(
        nextPolicy,
        "stable",
        draftSaveCommandsRef.current
      );
      if (preview && draftSaveWindow) {
        cacheDraftPreviewForWindow({
          preview,
          window: draftSaveWindow,
        });
      }
      return preview;
    },
    [cacheDraftPreviewForWindow, draftSaveWindow, requestPreview]
  );

  const applyPolicyReplanMoves = useCallback(
    async (nextPolicy: PlannerPolicy) => {
      if (!context?.scopeMonth || !effectivePreview) {
        return { moveCount: 0, movedEntryKeys: [] as string[] };
      }
      const priorCommands = draftSaveCommandsRef.current;
      const proposal = await requestPreview(nextPolicy, "replan", priorCommands);
      if (!proposal) {
        return { moveCount: 0, movedEntryKeys: [] as string[] };
      }

      const baselineDateByEntryKey = new Map(
        effectivePreview.workUnits.map((unit) => [
          draftCommandEntryKey({
            goalId: unit.originalGoalId,
            unitKey: unit.unitKey,
          }),
          unit.scheduledDate,
        ])
      );
      const baselineUnitByEntryKey = new Map(
        effectivePreview.workUnits.map((unit) => [
          draftCommandEntryKey({
            goalId: unit.originalGoalId,
            unitKey: unit.unitKey,
          }),
          unit,
        ])
      );

      let nextState = draftCommandState;
      const pendingActions: Array<{
        type: "upsert_move";
        goalId: string;
        unitKey: string;
        scheduledDate: string;
        sourceDate: string;
      }> = [];
      const movedEntryKeys: string[] = [];
      for (const unit of proposal.workUnits) {
        const entryKey = draftCommandEntryKey({
          goalId: unit.originalGoalId,
          unitKey: unit.unitKey,
        });
        const nextDate = unit.scheduledDate;
        if (nextDate === null || baselineDateByEntryKey.get(entryKey) === nextDate) {
          continue;
        }
        const baselineUnit = baselineUnitByEntryKey.get(entryKey);
        if (
          shouldBlockAutomatedReplanMoveForEntry({
            baselineClassification: baselineUnit?.classification,
            baselineScheduledDate: baselineUnit?.scheduledDate,
            asOfDate: context.asOfDate,
          })
        ) {
          continue;
        }
        const action = {
          type: "upsert_move" as const,
          goalId: unit.originalGoalId,
          unitKey: unit.unitKey,
          scheduledDate: nextDate,
          sourceDate: baselineDateByEntryKey.get(entryKey) ?? nextDate,
        };
        nextState = draftCommandReducer(nextState, action);
        pendingActions.push(action);
        movedEntryKeys.push(entryKey);
      }

      if (pendingActions.length > 0) {
        const prospectiveWindow = tryBuildPlannerDraftSaveWindow({
          currentMonth: context.scopeMonth,
          commands: selectDraftCommands(nextState),
          workUnits: draftWindowWorkUnits,
        });
        if (!prospectiveWindow.ok) {
          if (prospectiveWindow.code === "too_wide") {
            toast.error(PLANNER_DRAFT_WINDOW_TOO_WIDE_MESSAGE);
          } else {
            toast.error("Those session moves cannot fit in the current draft window.");
          }
          return { moveCount: 0, movedEntryKeys: [] as string[] };
        }
        for (const action of pendingActions) {
          dispatchDraftCommand(action);
        }
      }

      draftSaveCommandsRef.current = sortPlannerDraftCommands(
        selectDraftCommands(nextState)
      );
      return { moveCount: movedEntryKeys.length, movedEntryKeys };
    },
    [
      context,
      dispatchDraftCommand,
      draftCommandState,
      draftWindowWorkUnits,
      effectivePreview,
      requestPreview,
    ]
  );

  const clearDraftMoveCommands = useCallback(
    (entryKeys: string[]) => {
      if (!context?.scopeMonth || entryKeys.length === 0) {
        return;
      }
      let nextState = draftCommandState;
      for (const entryKey of entryKeys) {
        const separatorIndex = entryKey.indexOf(":");
        const action = {
          type: "remove_kind",
          kind: "move_item",
          goalId: entryKey.slice(0, separatorIndex),
          unitKey: entryKey.slice(separatorIndex + 1),
        } as const;
        dispatchDraftCommand(action);
        nextState = draftCommandReducer(nextState, action);
      }
      draftSaveCommandsRef.current = sortPlannerDraftCommands(
        selectDraftCommands(nextState)
      );
    },
    [context?.scopeMonth, dispatchDraftCommand, draftCommandState]
  );

  return {
    requestPreviewForWindow,
    refreshDraftPreview,
    applyPolicyReplanMoves,
    clearDraftMoveCommands,
    cacheDraftPreviewForWindow,
  };
}
