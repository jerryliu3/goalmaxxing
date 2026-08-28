import { resolveSelectedDateState } from "@/lib/dates/day";
import {
  getCompletionsForCurrentPeriod,
  hasCompletionToday,
} from "@/lib/goals/schedule";
import { isPeriodCadenceGoal } from "@/lib/goals/target-basis";
import type { ChecklistTemporalContext } from "@/lib/goals/period-domain";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { WeeklyAnchorContext } from "@/lib/goals/periods";
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

export type CompletionTemporalContext = Pick<
  ChecklistTemporalContext,
  "selectedDate" | "asOfDate"
>;

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

export function resolveTargetedRecurring(goal: Goal): boolean {
  return isTargetedRecurringGoal(goal) || isPeriodCadenceGoal(goal);
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

function resolveLegacyPeriodMutation({
  completedForCurrentPeriod,
  completionToUnmark,
  viewDate,
}: {
  completedForCurrentPeriod: boolean;
  completionToUnmark?: CompletionDateFact;
  viewDate: string;
}): Pick<CompletionIntentMutation, "date" | "desiredFactState"> {
  const routeDesiredFactState = completedForCurrentPeriod ? "absent" : "present";
  const dispatchDate =
    routeDesiredFactState === "absent"
      ? completionToUnmark?.completed_on ?? viewDate
      : viewDate;
  return {
    date: dispatchDate,
    desiredFactState: routeDesiredFactState,
  };
}

export function resolveChecklistCompletionIntent({
  goal,
  completions,
  temporal,
  weeklyAnchor,
}: {
  goal: Goal;
  completions: CompletionDateFact[];
  temporal: CompletionTemporalContext;
  weeklyAnchor?: WeeklyAnchorContext | null;
}): CompletionIntent {
  const viewDate = temporal.selectedDate;
  const viewDateObj = new Date(`${viewDate}T12:00:00`);
  const completedOnViewDate = hasCompletionToday(completions, viewDateObj);
  const completionsInCurrentPeriod = getCompletionsForCurrentPeriod(
    goal,
    completions,
    viewDateObj,
    { weeklyAnchor: weeklyAnchor ?? null }
  );
  const completedForCurrentPeriod = completionsInCurrentPeriod.length > 0;
  const latestCompletionInCurrentPeriod = [...completionsInCurrentPeriod]
    .sort((left, right) => left.completed_on.localeCompare(right.completed_on))
    .at(-1);
  const completionToUnmark = completedOnViewDate
    ? completions.find((completion) => completion.completed_on === viewDate)
    : latestCompletionInCurrentPeriod;
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

  const mutation =
    decision.route === "legacy_period"
      ? resolveLegacyPeriodMutation({
          completedForCurrentPeriod,
          completionToUnmark,
          viewDate,
        })
      : {
          date: viewDate,
          desiredFactState,
        };

  return buildCompletionIntent({
    goalId: goal.id,
    decision,
    mutation,
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
