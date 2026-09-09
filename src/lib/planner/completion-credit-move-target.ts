import { pickCadenceCreditUnit } from "@/lib/planner/cadence-credit-matching";
import { dateIsInWindow, type DateWindow } from "@/lib/planner/dates";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

export type CreditMoveRequirementKind =
  | "milestone_sequence"
  | "cadence"
  | "deadline_total";

export interface CreditMoveCandidateUnit {
  originalGoalId: string;
  unitKey: string;
  kind?: CreditMoveRequirementKind;
  ordinal?: number;
  scheduledDate: string | null;
  creditState: string;
  classification?: string;
  locked?: boolean;
  creditWindow?: DateWindow;
  draftMoveWindow?: DateWindow | null;
  placementWindow?: DateWindow | null;
}

export interface CreditMoveTarget {
  unitKey: string;
  scheduledDate: string;
}

function inferKind(unit: CreditMoveCandidateUnit): CreditMoveRequirementKind {
  if (unit.kind) {
    return unit.kind;
  }
  if (unit.unitKey.startsWith("milestone:")) {
    return "milestone_sequence";
  }
  if (unit.unitKey.startsWith("cadence:")) {
    return "cadence";
  }
  return "deadline_total";
}

function inferOrdinal(unit: CreditMoveCandidateUnit) {
  if (typeof unit.ordinal === "number") {
    return unit.ordinal;
  }
  const match = /(\d+)$/.exec(unit.unitKey);
  return match ? Number(match[1]) : 0;
}

function canCreditDate(unit: CreditMoveCandidateUnit, date: string) {
  if (!unit.creditWindow) {
    return true;
  }
  return dateIsInWindow(date, unit.creditWindow);
}

function isMovableCandidate(unit: CreditMoveCandidateUnit) {
  return (
    unit.creditState === "uncredited" &&
    unit.classification !== "satisfied_elsewhere" &&
    !unit.locked
  );
}

function toCadenceUnit(unit: CreditMoveCandidateUnit): PlannerWorkUnit {
  const creditWindow = unit.creditWindow ?? {
    start: "0001-01-01",
    end: "9999-12-31",
  };
  return {
    originalGoalId: unit.originalGoalId,
    requirementSchemaVersion: "1",
    requirementFingerprint: "",
    unitKey: unit.unitKey,
    kind: "cadence",
    ordinal: inferOrdinal(unit),
    periodKey: null,
    label: null,
    creditWindow,
    placementWindow: unit.placementWindow ?? null,
    draftMoveWindow: unit.draftMoveWindow ?? null,
    classification: "open",
    missPolicy: "remain_missed",
    restEligible: true,
    maxPerDay: 1,
    creditedCompletionId: null,
    creditedCompletionDate: null,
    creditState: "uncredited",
    scheduledDate: unit.scheduledDate,
    locked: unit.locked ?? false,
  };
}

function sortByOrdinal(left: CreditMoveCandidateUnit, right: CreditMoveCandidateUnit) {
  const byOrdinal = inferOrdinal(left) - inferOrdinal(right);
  if (byOrdinal !== 0) {
    return byOrdinal;
  }
  return left.unitKey.localeCompare(right.unitKey);
}

/**
 * Which placed session a new completion on `completionDate` would credit.
 * Unplaced remainder and already-on-date sessions return null (complete in place).
 */
export function pickCreditMoveTarget({
  goalId,
  workUnits,
  completionDate,
}: {
  goalId: string;
  workUnits: CreditMoveCandidateUnit[];
  completionDate: string;
}): CreditMoveTarget | null {
  const candidates = workUnits.filter(
    (unit) =>
      unit.originalGoalId === goalId &&
      isMovableCandidate(unit) &&
      canCreditDate(unit, completionDate)
  );
  if (candidates.length === 0) {
    return null;
  }

  const kind = inferKind(candidates[0]!);
  let picked: CreditMoveCandidateUnit | null = null;

  if (kind === "cadence") {
    picked = pickCadenceCreditUnit(
      candidates.map(toCadenceUnit),
      completionDate
    );
  } else {
    const onDate = candidates.find(
      (unit) => unit.scheduledDate === completionDate
    );
    picked =
      onDate ??
      [...candidates].sort(sortByOrdinal)[0] ??
      null;
  }

  if (!picked?.scheduledDate || picked.scheduledDate === completionDate) {
    return null;
  }

  return {
    unitKey: picked.unitKey,
    scheduledDate: picked.scheduledDate,
  };
}

export function creditMoveEntryKey(goalId: string, unitKey: string) {
  return `${goalId}:${unitKey}`;
}
