import { compareDateStrings } from "@/lib/goals/periods";
import { compareCanonicalStrings } from "@/lib/planner/canonical";
import type { PlannerWorkUnit } from "@/lib/planner/work-units";

function compareOrdinalTieBreak(
  left: PlannerWorkUnit,
  right: PlannerWorkUnit
) {
  if (left.ordinal !== right.ordinal) {
    return left.ordinal - right.ordinal;
  }
  return compareCanonicalStrings(left.unitKey, right.unitKey);
}

function comparePastOrSamePreference(
  left: PlannerWorkUnit,
  right: PlannerWorkUnit
) {
  const byDate = compareDateStrings(right.scheduledDate!, left.scheduledDate!);
  if (byDate !== 0) {
    return byDate;
  }
  return compareOrdinalTieBreak(left, right);
}

function compareFuturePreference(
  left: PlannerWorkUnit,
  right: PlannerWorkUnit
) {
  const byDate = compareDateStrings(left.scheduledDate!, right.scheduledDate!);
  if (byDate !== 0) {
    return byDate;
  }
  return compareOrdinalTieBreak(left, right);
}

export function pickCadenceCreditUnit(
  candidates: PlannerWorkUnit[],
  completionDate: string
): PlannerWorkUnit | null {
  if (candidates.length === 0) {
    return null;
  }

  const scheduled = candidates.filter((unit) => unit.scheduledDate !== null);
  const pastOrSame = scheduled.filter(
    (unit) => compareDateStrings(unit.scheduledDate!, completionDate) <= 0
  );
  if (pastOrSame.length > 0) {
    return [...pastOrSame].sort(comparePastOrSamePreference)[0] ?? null;
  }

  const future = scheduled.filter(
    (unit) => compareDateStrings(unit.scheduledDate!, completionDate) > 0
  );
  if (future.length > 0) {
    return [...future].sort(compareFuturePreference)[0] ?? null;
  }

  return [...candidates].sort(compareOrdinalTieBreak)[0] ?? null;
}
