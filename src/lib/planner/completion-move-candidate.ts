import { getAdmissibleCompletions } from "@/lib/goals/admissible";
import { getAnchoredPeriod } from "@/lib/goals/periods";
import type { Completion, Goal } from "@/lib/goals/types";
import type { PlannerItemRow } from "@/lib/planner/context-loader";
import { normalizeGoalRequirement } from "@/lib/planner/requirements";

export interface PlannerCompletionMoveCandidate {
  itemId: string;
  unitKey: string;
  sourceDate: string;
}

function numericOrdinal(unitKey: string, prefix: "milestone" | "total") {
  const match = new RegExp(`^${prefix}:([1-9][0-9]*)$`).exec(unitKey);
  return match ? Number(match[1]) : null;
}

function earliestIncompleteOrdinal({
  completions,
  prefix,
  targetCount,
}: {
  completions: Completion[];
  prefix: "milestone" | "total";
  targetCount: number;
}) {
  const allocatedOrdinals = new Set<number>();
  let legacyCompletionCount = 0;
  for (const completion of completions) {
    const ordinal = completion.planner_unit_key
      ? numericOrdinal(completion.planner_unit_key, prefix)
      : null;
    if (ordinal && ordinal <= targetCount) {
      allocatedOrdinals.add(ordinal);
    } else {
      legacyCompletionCount += 1;
    }
  }

  for (let ordinal = 1; ordinal <= targetCount; ordinal += 1) {
    if (allocatedOrdinals.has(ordinal)) {
      continue;
    }
    if (legacyCompletionCount > 0) {
      legacyCompletionCount -= 1;
      continue;
    }
    return ordinal;
  }
  return null;
}

function pickCadenceItem(
  items: PlannerItemRow[],
  completionDate: string
) {
  const pastOrSame = items.filter(
    (item) => item.scheduled_date <= completionDate
  );
  const candidates = pastOrSame.length > 0 ? pastOrSame : items;
  const newestFirst = pastOrSame.length > 0;
  return [...candidates].sort((left, right) => {
    const byDate = newestFirst
      ? right.scheduled_date.localeCompare(left.scheduled_date)
      : left.scheduled_date.localeCompare(right.scheduled_date);
    return byDate !== 0 ? byDate : left.unit_key.localeCompare(right.unit_key);
  })[0] ?? null;
}

/**
 * Selects the session a manual completion should move. Ordinal requirements
 * always choose the lowest incomplete ordinal, regardless of whether that
 * session is currently scheduled in the past or future. Cadence requirements
 * stay within the completion's anchored period.
 */
export function selectPlannerCompletionMoveCandidate({
  goal,
  plannerItems,
  completions,
  completionDate,
  asOfDate,
  weekStartsOn,
  allowLocked = false,
}: {
  goal: Goal;
  plannerItems: PlannerItemRow[];
  completions: Completion[];
  completionDate: string;
  asOfDate: string;
  weekStartsOn?: number;
  allowLocked?: boolean;
}): PlannerCompletionMoveCandidate | null {
  const requirement = normalizeGoalRequirement(goal).requirement;
  const admissible = getAdmissibleCompletions(goal, completions, { asOfDate });
  const availableItems = plannerItems.filter(
    (item) =>
      item.goal_id === goal.id &&
      (item.scheduled_date === completionDate || allowLocked || !item.locked)
  );

  let picked: PlannerItemRow | null = null;
  if (requirement.kind === "cadence") {
    const onDate = plannerItems.find(
      (item) => item.goal_id === goal.id && item.scheduled_date === completionDate
    );
    if (onDate) {
      return {
        itemId: onDate.id,
        unitKey: onDate.unit_key,
        sourceDate: onDate.scheduled_date,
      };
    }
    const period = getAnchoredPeriod(
      goal.start_date,
      requirement.interval,
      completionDate,
      { weekStartsOn }
    );
    const remaining = availableItems.filter(
      (item) =>
        item.scheduled_date >= period.start && item.scheduled_date <= period.end
    );
    const periodCompletions = admissible.filter(
      (completion) =>
        completion.completed_on >= period.start &&
        completion.completed_on <= period.end
    );
    for (const completion of periodCompletions) {
      const allocated = pickCadenceItem(remaining, completion.completed_on);
      if (!allocated) {
        break;
      }
      const index = remaining.findIndex((item) => item.id === allocated.id);
      if (index >= 0) {
        remaining.splice(index, 1);
      }
    }
    picked = pickCadenceItem(remaining, completionDate);
  } else {
    const prefix =
      requirement.kind === "milestone_sequence" ? "milestone" : "total";
    const nextOrdinal = earliestIncompleteOrdinal({
      completions: admissible,
      prefix,
      targetCount: requirement.targetCount,
    });
    if (nextOrdinal !== null) {
      picked =
        availableItems.find(
          (item) => numericOrdinal(item.unit_key, prefix) === nextOrdinal
        ) ?? null;
    }
  }

  return picked
    ? {
        itemId: picked.id,
        unitKey: picked.unit_key,
        sourceDate: picked.scheduled_date,
      }
    : null;
}
