"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { MoveSessionDialog } from "@/features/planner/move-session-dialog";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";
import {
  buildCreditMoveSourceOptions,
  defaultCreditMoveSourceEntryKey,
  filterOptionsForDraftMove,
  goalRequiresCreditMove,
  type CreditMoveSourceOption,
} from "@/features/planner/credit-move-source-options";
import { persistImmediatePlannerMove } from "@/lib/planner/persist-immediate-move";
import { getJson } from "@/lib/api/client";
import { monthFromDate } from "@/lib/planner/dates";
import type { PlannerContextPayload } from "@cadence/shared/planner/context";
import type { Goal } from "@/lib/goals/types";

interface CreditMoveDialogState {
  goal: Goal;
  targetDate: string;
  options: CreditMoveSourceOption[];
  selectedEntryKey: string;
}

export interface CreditMoveDraftArgs {
  goalId: string;
  unitKey: string;
  sourceDate: string;
  scheduledDate: string;
}

interface CompletionCreditMoveContextValue {
  saving: boolean;
  goalRequiresMove: (goalId: string, completionDate: string) => boolean;
  requestMoveBeforeComplete: (goal: Goal, completionDate: string) => Promise<boolean>;
}

const CompletionCreditMoveContext = createContext<CompletionCreditMoveContextValue | null>(
  null
);

async function resolvePlannerContext(
  provided: PlannerContextPayload | null,
  completionDate: string
) {
  if (provided?.preview) {
    return provided;
  }
  return getJson<PlannerContextPayload>("/api/planner/context", {
    query: { scopeMonth: monthFromDate(completionDate) },
  });
}

function usesImmediateCreditMovePersist(viewMode?: PlannerCalendarViewMode | null) {
  return viewMode == null || viewMode === "day";
}

function formatMoveDayLabel(date: string) {
  return format(parse(date, "yyyy-MM-dd", new Date()), "EEE, MMM d");
}

export function CompletionCreditMoveProvider({
  context,
  viewMode = null,
  onDraftMove,
  onMoved,
  children,
}: {
  context: PlannerContextPayload | null;
  viewMode?: PlannerCalendarViewMode | null;
  onDraftMove?: (move: CreditMoveDraftArgs) => boolean;
  onMoved?: () => void | Promise<void>;
  children: ReactNode;
}) {
  const [dialog, setDialog] = useState<CreditMoveDialogState | null>(null);
  const [saving, setSaving] = useState(false);
  const workUnits = context?.preview?.workUnits ?? [];

  const goalRequiresMove = useCallback(
    (goalId: string, completionDate: string) =>
      goalRequiresCreditMove({
        goalId,
        workUnits,
        completionDate,
      }),
    [workUnits]
  );

  const requestMoveBeforeComplete = useCallback(
    async (goal: Goal, completionDate: string) => {
      const plannerContext = await resolvePlannerContext(context, completionDate);
      const units = plannerContext.preview?.workUnits ?? [];
      if (
        !goalRequiresCreditMove({
          goalId: goal.id,
          workUnits: units,
          completionDate,
        })
      ) {
        return false;
      }
      const options = buildCreditMoveSourceOptions({
        goalId: goal.id,
        goalTitle: goal.title,
        workUnits: units,
        targetDate: completionDate,
      });
      const immediatePersist = usesImmediateCreditMovePersist(viewMode);
      const actionableOptions = immediatePersist
        ? options
        : filterOptionsForDraftMove({
            options,
            workUnits: units,
            targetDate: completionDate,
          });
      if (actionableOptions.length === 0) {
        toast.error("Move a planned session here before marking this done.");
        return true;
      }
      const selectedEntryKey = defaultCreditMoveSourceEntryKey({
        goalId: goal.id,
        workUnits: units,
        targetDate: completionDate,
        options: actionableOptions,
      });
      if (!immediatePersist && onDraftMove && actionableOptions.length === 1) {
        const selected = actionableOptions[0];
        if (!selected) {
          toast.error("Move a planned session here before marking this done.");
          return true;
        }
        const moved = onDraftMove({
          goalId: selected.goalId,
          unitKey: selected.unitKey,
          sourceDate: selected.sourceDay,
          scheduledDate: completionDate,
        });
        if (moved) {
          toast.success("Session moved into the plan draft. Save to keep it on this day.");
        }
        return true;
      }
      setDialog({
        goal,
        targetDate: completionDate,
        options: actionableOptions,
        selectedEntryKey,
      });
      return true;
    },
    [context, onDraftMove, viewMode]
  );

  const closeDialog = useCallback(() => {
    if (saving) {
      return;
    }
    setDialog(null);
  }, [saving]);

  const submitDialog = useCallback(async () => {
    if (!dialog) {
      return;
    }
    const selected = dialog.options.find(
      (option) => option.entryKey === dialog.selectedEntryKey
    );
    if (!selected) {
      toast.error("Select a scheduled date to move from.");
      return;
    }
    setSaving(true);
    try {
      if (!usesImmediateCreditMovePersist(viewMode) && onDraftMove) {
        const moved = onDraftMove({
          goalId: selected.goalId,
          unitKey: selected.unitKey,
          sourceDate: selected.sourceDay,
          scheduledDate: dialog.targetDate,
        });
        setDialog(null);
        if (moved) {
          toast.success("Session moved into the plan draft. Save to keep it on this day.");
        }
        return;
      }
      const plannerContext = await resolvePlannerContext(context, dialog.targetDate);
      await persistImmediatePlannerMove({
        context: plannerContext,
        goalId: selected.goalId,
        unitKey: selected.unitKey,
        sourceDate: selected.sourceDay,
        scheduledDate: dialog.targetDate,
      });
      setDialog(null);
      toast.success("Session moved. You can mark it done now.");
      await onMoved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The session could not be moved."
      );
    } finally {
      setSaving(false);
    }
  }, [context, dialog, onDraftMove, onMoved, viewMode]);

  const value = useMemo(
    () => ({
      saving,
      goalRequiresMove,
      requestMoveBeforeComplete,
    }),
    [goalRequiresMove, requestMoveBeforeComplete, saving]
  );

  const targetDateLabel = dialog ? formatMoveDayLabel(dialog.targetDate) : "";

  return (
    <CompletionCreditMoveContext.Provider value={value}>
      {children}
      <MoveSessionDialog
        open={Boolean(dialog)}
        targetDate={dialog?.targetDate ?? ""}
        selectedSourceEntryKey={dialog?.selectedEntryKey ?? ""}
        sourceOptions={dialog?.options ?? []}
        title={
          targetDateLabel
            ? `Schedule this goal for ${targetDateLabel}`
            : "Schedule this goal"
        }
        description="This schedules the goal on this day by moving it from another planned slot."
        appendTargetDate={false}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
        onSourceChange={(entryKey) => {
          setDialog((current) =>
            current ? { ...current, selectedEntryKey: entryKey } : current
          );
        }}
        onCancel={closeDialog}
        onSubmit={() => {
          void submitDialog();
        }}
        submitDisabled={!dialog?.selectedEntryKey || saving}
        submitLabel={saving ? "Saving..." : "Save"}
      />
    </CompletionCreditMoveContext.Provider>
  );
}

export function useCompletionCreditMove() {
  return useContext(CompletionCreditMoveContext);
}
