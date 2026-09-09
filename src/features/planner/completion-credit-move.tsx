"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { MoveSessionDialog } from "@/features/planner/move-session-dialog";
import {
  buildCreditMoveSourceOptions,
  defaultCreditMoveSourceEntryKey,
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

export function CompletionCreditMoveProvider({
  context,
  onMoved,
  children,
}: {
  context: PlannerContextPayload | null;
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
      if (options.length === 0) {
        return false;
      }
      setDialog({
        goal,
        targetDate: completionDate,
        options,
        selectedEntryKey: defaultCreditMoveSourceEntryKey({
          goalId: goal.id,
          workUnits: units,
          targetDate: completionDate,
          options,
        }),
      });
      return true;
    },
    [context]
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
  }, [context, dialog, onMoved]);

  const value = useMemo(
    () => ({
      saving,
      goalRequiresMove,
      requestMoveBeforeComplete,
    }),
    [goalRequiresMove, requestMoveBeforeComplete, saving]
  );

  return (
    <CompletionCreditMoveContext.Provider value={value}>
      {children}
      <MoveSessionDialog
        open={Boolean(dialog)}
        targetDate={dialog?.targetDate ?? ""}
        selectedSourceEntryKey={dialog?.selectedEntryKey ?? ""}
        sourceOptions={dialog?.options ?? []}
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
