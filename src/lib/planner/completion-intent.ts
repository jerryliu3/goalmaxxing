import { resolveSelectedDateState } from "@/lib/dates/day";
import { hasCompletionToday } from "@/lib/goals/schedule";
import { isPeriodCadenceGoal } from "@/lib/goals/target-basis";
import type { ChecklistTemporalContext } from "@/lib/goals/period-domain";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import {
  resolveCompletionDispatch,
  type CompletionDispatchDecision,
} from "@/lib/planner/completion-dispatch";
import {
  getGoalRequirement,
  isTargetedRecurringGoal,
} from "@/lib/planner/requirements";

export type CompletionDisabledReason =
  | "future_creation"
  | "satisfied_elsewhere";

export type CompletionControlDisabledReason =
  | "future_creation"
  | "satisfied_elsewhere"
  | "unsupported"
  | "out_of_scope_route";

export type CompletionTemporalContext = Pick<
  ChecklistTemporalContext,
  "selectedDate" | "asOfDate"
>;

export interface PlannerEntryCompletionInput {
  originalGoalId: string;
  unitKey: string;
  classification: string;
  creditState: string;
  activeGoal: unknown | null;
  activeItem: {
    requirement_kind: "milestone_sequence" | "cadence" | "deadline_total";
  } | null;
  draftGhost: boolean;
}

export interface CompletionIntentMutation {
  goalId: string;
  date: string;
  desiredFactState: "present" | "absent";
}

export interface CompletionIntent {
  allowed: boolean;
  disabledReason: CompletionDisabledReason | null;
  decision: CompletionDispatchDecision;
  mutation: CompletionIntentMutation;
}

export interface CompletionControlState {
  currentlyCredited: boolean;
  dispatch: {
    currentlyCredited: boolean;
    desiredFactState: "present" | "absent";
    decision: CompletionDispatchDecision;
  } | null;
  disabledReason: CompletionControlDisabledReason | null;
}

export function resolveTargetedRecurring(goal: Goal): boolean {
  return isTargetedRecurringGoal(goal) || isPeriodCadenceGoal(goal);
}

type PlannerRequirementKind =
  | "milestone_sequence"
  | "cadence"
  | "deadline_total";

function resolvePlannerRequirementKind(
  entry: PlannerEntryCompletionInput
): PlannerRequirementKind {
  if (entry.activeItem?.requirement_kind) {
    return entry.activeItem.requirement_kind;
  }
  if (entry.unitKey.startsWith("milestone:")) {
    return "milestone_sequence";
  }
  if (entry.unitKey.startsWith("cadence:")) {
    return "cadence";
  }
  return "deadline_total";
}

function resolvePlannerEntryTargetedRecurring(
  requirementKind: PlannerRequirementKind,
  entry: PlannerEntryCompletionInput
): boolean {
  if (requirementKind === "deadline_total") {
    return true;
  }
  if (requirementKind === "milestone_sequence") {
    return false;
  }
  if (entry.activeGoal) {
    return true;
  }
  return true;
}

function resolvePlannerMatchingItemState(
  entry: PlannerEntryCompletionInput
): "none" | "actionable" | "satisfied_elsewhere" | "historical" {
  if (entry.classification === "satisfied_elsewhere") {
    return "satisfied_elsewhere";
  }
  if (entry.classification.startsWith("historical")) {
    return "historical";
  }
  if (entry.activeItem) {
    return "actionable";
  }
  return "none";
}

function toCompletionDisabledReason(
  decision: CompletionDispatchDecision
): CompletionDisabledReason | null {
  if (decision.allowed) {
    return null;
  }
  return decision.reason === "future_creation"
    ? "future_creation"
    : "satisfied_elsewhere";
}

function buildCompletionIntent({
  goalId,
  decision,
  mutation,
}: {
  goalId: string;
  decision: CompletionDispatchDecision;
  mutation: Pick<CompletionIntentMutation, "date" | "desiredFactState">;
}): CompletionIntent {
  return {
    allowed: decision.allowed,
    disabledReason: toCompletionDisabledReason(decision),
    decision,
    mutation: {
      goalId,
      ...mutation,
    },
  };
}

export function resolvePlannerEntryCompletionIntent({
  entry,
  temporal,
  canMutatePlanItems,
}: {
  entry: PlannerEntryCompletionInput;
  temporal: CompletionTemporalContext;
  canMutatePlanItems: boolean;
}): CompletionIntent & { controlState: CompletionControlState } {
  void canMutatePlanItems;
  const selectedDate = temporal.selectedDate;
  const requirementKind = resolvePlannerRequirementKind(entry);
  const targetedRecurring = resolvePlannerEntryTargetedRecurring(
    requirementKind,
    entry
  );
  const currentlyCredited = entry.creditState !== "uncredited";
  const desiredFactState: CompletionIntentMutation["desiredFactState"] =
    currentlyCredited ? "absent" : "present";
  const decision = resolveCompletionDispatch({
    requirementKind,
    targetedRecurring,
    activePlanMembership: Boolean(entry.activeGoal),
    matchingItemState: resolvePlannerMatchingItemState(entry),
    selectedDateState: resolveSelectedDateState(
      selectedDate,
      temporal.asOfDate
    ),
    existingExactFact: currentlyCredited,
    desiredFactState,
  });
  const intent = buildCompletionIntent({
    goalId: entry.originalGoalId,
    decision,
    mutation: {
      date: selectedDate,
      desiredFactState,
    },
  });
  const dispatch = {
    currentlyCredited,
    desiredFactState,
    decision,
  };
  return {
    ...intent,
    controlState: {
      currentlyCredited,
      dispatch,
      disabledReason: getPlannerCompletionControlDisabledReason({
        entry,
        intent,
        canMutatePlanItems,
      }),
    },
  };
}

export function getPlannerCompletionControlDisabledReason({
  entry,
  intent,
  canMutatePlanItems,
}: {
  entry: PlannerEntryCompletionInput;
  intent: CompletionIntent;
  canMutatePlanItems: boolean;
}): CompletionControlDisabledReason | null {
  if (entry.draftGhost) {
    return "unsupported";
  }
  if (!intent.allowed) {
    if (intent.disabledReason === "future_creation") {
      return "future_creation";
    }
    if (intent.disabledReason === "satisfied_elsewhere") {
      return "satisfied_elsewhere";
    }
    return "unsupported";
  }
  if (intent.decision.route === "canonical_exact_date") {
    return null;
  }
  if (intent.decision.route === "item_date") {
    if (!canMutatePlanItems || !entry.activeItem) {
      return "out_of_scope_route";
    }
    return null;
  }
  if (intent.decision.route === "plan_goal_date") {
    if (!canMutatePlanItems || !entry.activeGoal) {
      return "out_of_scope_route";
    }
    return null;
  }
  return "out_of_scope_route";
}

export function resolveChecklistCompletionIntent({
  goal,
  completions,
  temporal,
}: {
  goal: Goal;
  completions: CompletionDateFact[];
  temporal: CompletionTemporalContext;
}): CompletionIntent {
  const viewDate = temporal.selectedDate;
  const viewDateObj = new Date(`${viewDate}T12:00:00`);
  const completedOnViewDate = hasCompletionToday(completions, viewDateObj);
  const requirement = getGoalRequirement(goal);
  const desiredFactState: CompletionIntentMutation["desiredFactState"] =
    completedOnViewDate ? "absent" : "present";
  const decision = resolveCompletionDispatch({
    requirementKind: requirement.kind,
    targetedRecurring: resolveTargetedRecurring(goal),
    activePlanMembership: false,
    matchingItemState: "none",
    selectedDateState: resolveSelectedDateState(
      viewDate,
      temporal.asOfDate
    ),
    existingExactFact: completedOnViewDate,
    desiredFactState,
  });

  return buildCompletionIntent({
    goalId: goal.id,
    decision,
    mutation: {
      date: viewDate,
      desiredFactState,
    },
  });
}

export function resolveInsightsCompletionIntent({
  goal,
  completionDate,
  hasCompletionOnDate,
  temporal,
}: {
  goal: Goal;
  completionDate: string;
  hasCompletionOnDate: boolean;
  temporal: CompletionTemporalContext;
}): CompletionIntent {
  const desiredFactState: CompletionIntentMutation["desiredFactState"] =
    hasCompletionOnDate ? "absent" : "present";
  const requirement = getGoalRequirement(goal);
  const decision = resolveCompletionDispatch({
    requirementKind: requirement.kind,
    targetedRecurring: resolveTargetedRecurring(goal),
    activePlanMembership: false,
    matchingItemState: "none",
    selectedDateState: resolveSelectedDateState(
      completionDate,
      temporal.asOfDate
    ),
    existingExactFact: hasCompletionOnDate,
    desiredFactState,
  });

  return buildCompletionIntent({
    goalId: goal.id,
    decision,
    mutation: {
      date: completionDate,
      desiredFactState,
    },
  });
}
