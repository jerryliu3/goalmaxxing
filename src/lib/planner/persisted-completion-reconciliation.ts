import { getAdmissibleCompletions } from "@/lib/goals/admissible";
import type { Completion, Goal } from "@/lib/goals/types";
import { getAnchoredPeriod } from "@/lib/goals/periods";
import type { PlannerItemRow } from "@/lib/planner/context-loader";
import { reconcilePlannerCompletions } from "@/lib/planner/reconciliation";
import { normalizeGoalRequirement } from "@/lib/planner/requirements";
import { materializeWorkUnits } from "@/lib/planner/work-units";

/** Resolve credits before narrowing saved placements to the visible month.
 * Preview and direct save must use the same facts, dates, and matching rules.
 */
export function reconcilePersistedGoalCompletions({
  goal,
  completions,
  persistedItems,
  asOfDate,
  weekStartsOn,
}: {
  goal: Goal;
  completions: Completion[];
  persistedItems: Pick<PlannerItemRow, "goal_id" | "unit_key" | "scheduled_date">[];
  asOfDate: string;
  weekStartsOn?: number;
}) {
  const normalizedRequirement = normalizeGoalRequirement(goal);
  const { requirement, requirementFingerprint } = normalizedRequirement;
  const facts = getAdmissibleCompletions(
    goal,
    completions.filter((fact) => fact.goal_id === goal.id),
    { asOfDate }
  );
  const items = persistedItems.filter((item) => item.goal_id === goal.id);
  const dates = [
    ...items.map((item) => item.scheduled_date),
    ...facts.map((fact) => fact.completed_on),
  ].sort();
  const window = { start: dates[0] ?? asOfDate, end: dates.at(-1) ?? asOfDate };
  if (requirement.kind === "cadence") {
    // A week can belong to the next month even when the saved session and its
    // completion both fall in this month. Include the whole owning period.
    window.start = getAnchoredPeriod(goal.start_date, requirement.interval, window.start, { weekStartsOn }).start;
    window.end = getAnchoredPeriod(goal.start_date, requirement.interval, window.end, { weekStartsOn }).end;
  }
  const units = materializeWorkUnits({
    goal,
    normalizedRequirement,
    window,
    asOfDate,
    weeklyAnchor: { weekStartsOn },
    ordinalsForScopeMonth: requirement.kind === "cadence"
      ? undefined
      : new Set(Array.from({ length: requirement.targetCount }, (_, index) => index + 1)),
    baseAssignments: items.map((item) => ({
      goalId: goal.id,
      requirementFingerprint,
      unitKey: item.unit_key,
      scheduledDate: item.scheduled_date,
      locked: false,
    })),
  });
  return reconcilePlannerCompletions({
    goal,
    workUnits: units,
    completions: facts,
    asOfDate,
    previousCompletionToUnit: Object.fromEntries(
      facts.filter((fact) => fact.planner_unit_key).map((fact) => [fact.id, {
        goalId: goal.id,
        requirementFingerprint,
        unitKey: fact.planner_unit_key!,
        completedOn: fact.completed_on,
      }])
    ),
  });
}
