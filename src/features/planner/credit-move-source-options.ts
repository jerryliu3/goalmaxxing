import {
  creditMoveEntryKey,
  pickCreditMoveTarget,
  type CreditMoveCandidateUnit,
} from "@/lib/planner/completion-credit-move-target";
import { dateIsInWindow } from "@/lib/planner/dates";

export interface CreditMoveSourceOption {
  entryKey: string;
  sourceDay: string;
  sourceLabel: string;
  goalId: string;
  unitKey: string;
}

function canMoveToDate(unit: CreditMoveCandidateUnit, targetDate: string) {
  const moveWindow = unit.draftMoveWindow ?? unit.placementWindow ?? unit.creditWindow;
  if (!moveWindow) {
    return true;
  }
  return dateIsInWindow(targetDate, moveWindow);
}

export function buildCreditMoveSourceOptions({
  goalId,
  goalTitle,
  workUnits,
  targetDate,
}: {
  goalId: string;
  goalTitle: string;
  workUnits: CreditMoveCandidateUnit[];
  targetDate: string;
}): CreditMoveSourceOption[] {
  const options: CreditMoveSourceOption[] = [];
  for (const unit of workUnits) {
    if (unit.originalGoalId !== goalId) {
      continue;
    }
    if (unit.creditState !== "uncredited" || unit.locked) {
      continue;
    }
    if (unit.classification === "satisfied_elsewhere") {
      continue;
    }
    if (!unit.scheduledDate || unit.scheduledDate === targetDate) {
      continue;
    }
    if (!canMoveToDate(unit, targetDate)) {
      continue;
    }
    options.push({
      entryKey: creditMoveEntryKey(goalId, unit.unitKey),
      sourceDay: unit.scheduledDate,
      sourceLabel: unit.unitKey.startsWith("milestone:")
        ? `${goalTitle} (${unit.unitKey})`
        : goalTitle,
      goalId,
      unitKey: unit.unitKey,
    });
  }
  return options.sort(
    (left, right) =>
      left.sourceDay.localeCompare(right.sourceDay) ||
      left.sourceLabel.localeCompare(right.sourceLabel)
  );
}

export function defaultCreditMoveSourceEntryKey({
  goalId,
  workUnits,
  targetDate,
  options,
}: {
  goalId: string;
  workUnits: CreditMoveCandidateUnit[];
  targetDate: string;
  options: CreditMoveSourceOption[];
}) {
  const target = pickCreditMoveTarget({
    goalId,
    workUnits,
    completionDate: targetDate,
  });
  if (target) {
    const key = creditMoveEntryKey(goalId, target.unitKey);
    if (options.some((option) => option.entryKey === key)) {
      return key;
    }
  }
  return options[0]?.entryKey ?? "";
}

export function goalRequiresCreditMove({
  goalId,
  workUnits,
  completionDate,
}: {
  goalId: string;
  workUnits: CreditMoveCandidateUnit[];
  completionDate: string;
}) {
  return pickCreditMoveTarget({
    goalId,
    workUnits,
    completionDate,
  }) !== null;
}
