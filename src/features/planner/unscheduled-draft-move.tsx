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
import type { PlannerWorkUnit } from "@/features/planner/calendar-surface.types";
import type { Goal } from "@/lib/goals/types";
import { dateIsInWindow } from "@/lib/planner/dates";

export interface UnscheduledDraftMove {
  goalId: string;
  unitKey: string;
  sourceDate: string;
  scheduledDate: string;
}

interface UnscheduledDraftMoveContextValue {
  movingGoalId: string | null;
  canMoveGoalToDate: (goalId: string, targetDate: string) => boolean;
  moveGoalToDate: (goal: Goal, targetDate: string) => Promise<boolean>;
}

export interface UnscheduledDraftMoveRequest {
  goalId: string;
  targetDate: string;
  goalStartDate: string;
  goalEndDate: string | null;
  localMove: UnscheduledDraftMove | null;
}

const UnscheduledDraftMoveContext =
  createContext<UnscheduledDraftMoveContextValue | null>(null);

function unitOrdinal(unit: PlannerWorkUnit) {
  const match = /:([1-9][0-9]*)$/.exec(unit.unitKey);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function selectCadenceUnit(
  candidates: PlannerWorkUnit[],
  targetDate: string
) {
  const scheduled = candidates.filter(
    (unit): unit is PlannerWorkUnit & { scheduledDate: string } =>
      unit.scheduledDate !== null
  );
  const pastOrSame = scheduled.filter(
    (unit) => unit.scheduledDate <= targetDate
  );
  const dateCandidates = pastOrSame.length > 0 ? pastOrSame : scheduled;
  return [...dateCandidates].sort((left, right) => {
    const byDate =
      pastOrSame.length > 0
        ? right.scheduledDate.localeCompare(left.scheduledDate)
        : left.scheduledDate.localeCompare(right.scheduledDate);
    return byDate !== 0
      ? byDate
      : unitOrdinal(left) - unitOrdinal(right) ||
          left.unitKey.localeCompare(right.unitKey);
  })[0] ?? null;
}

/**
 * Selects the earliest incomplete persisted session that can be explicitly
 * moved into an unscheduled current/future day, including overdue sessions. This is a planning
 * action only; it never creates a completion fact.
 */
export function selectUnscheduledDraftMove({
  goalId,
  targetDate,
  workUnits,
}: {
  goalId: string;
  targetDate: string;
  workUnits: PlannerWorkUnit[];
}): UnscheduledDraftMove | null {
  const candidates = workUnits.filter(
    (unit) =>
      unit.originalGoalId === goalId &&
      unit.creditState === "uncredited" &&
      unit.classification !== "satisfied_elsewhere" &&
      !unit.locked &&
      (!unit.creditWindow || dateIsInWindow(targetDate, unit.creditWindow))
  );
  const onDate = candidates.find((unit) => unit.scheduledDate === targetDate);
  const selected = onDate
    ? onDate
    : candidates[0]?.kind === "cadence"
      ? selectCadenceUnit(candidates, targetDate)
      : [...candidates].sort(
          (left, right) =>
            unitOrdinal(left) - unitOrdinal(right) ||
            left.unitKey.localeCompare(right.unitKey)
        )[0] ?? null;
  const moveWindow = selected?.draftMoveWindow ?? selected?.placementWindow;
  return selected?.scheduledDate &&
    selected.scheduledDate !== targetDate &&
    moveWindow &&
    dateIsInWindow(targetDate, moveWindow)
    ? {
        goalId,
        unitKey: selected.unitKey,
        sourceDate: selected.scheduledDate,
        scheduledDate: targetDate,
      }
    : null;
}

export function UnscheduledDraftMoveProvider({
  workUnits,
  asOfDate,
  onDraftMove,
  children,
}: {
  workUnits: PlannerWorkUnit[];
  asOfDate: string | null;
  onDraftMove: (request: UnscheduledDraftMoveRequest) => Promise<boolean>;
  children: ReactNode;
}) {
  const [movingGoalId, setMovingGoalId] = useState<string | null>(null);
  const selectMove = useCallback(
    (goalId: string, targetDate: string) => {
      if (!asOfDate || targetDate < asOfDate) {
        return null;
      }
      return selectUnscheduledDraftMove({ goalId, targetDate, workUnits });
    },
    [asOfDate, workUnits]
  );
  const canMoveGoalToDate = useCallback(
    (_goalId: string, targetDate: string) =>
      Boolean(asOfDate && targetDate >= asOfDate),
    [asOfDate]
  );
  const moveGoalToDate = useCallback(
    async (goal: Goal, targetDate: string) => {
      if (!asOfDate || targetDate < asOfDate || movingGoalId) {
        return false;
      }
      setMovingGoalId(goal.id);
      try {
        const moved = await onDraftMove({
          goalId: goal.id,
          targetDate,
          goalStartDate: goal.start_date,
          goalEndDate: goal.end_date,
          localMove: selectMove(goal.id, targetDate),
        });
        if (moved) {
          toast.success(
            "Session moved into the plan draft. Save the plan to confirm it."
          );
        }
        return moved;
      } finally {
        setMovingGoalId(null);
      }
    },
    [asOfDate, movingGoalId, onDraftMove, selectMove]
  );
  const value = useMemo(
    () => ({ movingGoalId, canMoveGoalToDate, moveGoalToDate }),
    [canMoveGoalToDate, moveGoalToDate, movingGoalId]
  );
  return (
    <UnscheduledDraftMoveContext.Provider value={value}>
      {children}
    </UnscheduledDraftMoveContext.Provider>
  );
}

export function useUnscheduledDraftMove() {
  return useContext(UnscheduledDraftMoveContext);
}
