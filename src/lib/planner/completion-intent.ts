import type { CompletionControlDisabledReason } from "@/features/planner/calendar-surface.types";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { resolveSelectedDateState } from "@/lib/dates/day";
import {
  getCompletionsForCurrentPeriod,
  hasCompletionToday,
} from "@/lib/goals/schedule";
import { isPeriodCadenceGoal } from "@/lib/goals/target-basis";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import type { WeeklyAnchorContext } from "@/lib/goals/periods";
import {
  resolveCompletionDispatch,
  type CompletionDispatchDecision,
  type PlannerGoalDateFactExpectation,
  type PlannerItemDateFactExpectation,
} from "@/lib/planner/completion-dispatch";
import {
  getCompletionControlDisabledReason,
  getDateFactDispatchForEntry,
} from "@/features/planner/completion-entry-dispatch";
import {
  getGoalRequirement,
  isTargetedRecurringGoal,
} from "@/lib/planner/requirements";

export interface CompletionTemporalContext {
  selectedDate: string;
  asOfDate: string;
}

export interface CompletionIntentMutation {
  goalId: string;
  date: string;
  desiredFactState: "present" | "absent";
}

export interface CompletionIntent {
  allowed: boolean;
  disabledReason: CompletionControlDisabledReason | null;
  decision: CompletionDispatchDecision;
  mutation: CompletionIntentMutation;
  plannerItemExpectation?: PlannerItemDateFactExpectation;
  plannerGoalExpectation?: PlannerGoalDateFactExpectation;
}

export function resolveTargetedRecurring(goal: Goal): boolean {
  return isTargetedRecurringGoal(goal) || isPeriodCadenceGoal(goal);
}

function resolveLegacyPeriodMutation({
  completedForCurrentPeriod,
  completionToUnmark,
  viewDate,
  desiredFactState,
}: {
  completedForCurrentPeriod: boolean;
  completionToUnmark?: CompletionDateFact;
  viewDate: string;
  desiredFactState: "present" | "absent";
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
  const desiredFactState = completedOnViewDate ? "absent" : "present";
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
      ? {
          goalId: goal.id,
          ...resolveLegacyPeriodMutation({
            completedForCurrentPeriod,
            completionToUnmark,
            viewDate,
            desiredFactState,
          }),
        }
      : {
          goalId: goal.id,
          date: viewDate,
          desiredFactState,
        };

  return {
    allowed: decision.allowed,
    disabledReason: decision.allowed
      ? null
      : decision.reason === "future_creation"
        ? "future_creation"
        : "satisfied_elsewhere",
    decision,
    mutation,
  };
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
  const desiredFactState = hasCompletionOnDate ? "absent" : "present";
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

  return {
    allowed: decision.allowed,
    disabledReason: decision.allowed
      ? null
      : decision.reason === "future_creation"
        ? "future_creation"
        : "satisfied_elsewhere",
    decision,
    mutation: {
      goalId: goal.id,
      date: completionDate,
      desiredFactState,
    },
  };
}

export function resolvePlannerEntryCompletionIntent({
  entry,
  temporal,
  canMutatePlanItems,
}: {
  entry: PlannerDayDetailEntry;
  temporal: CompletionTemporalContext;
  canMutatePlanItems: boolean;
}): CompletionIntent {
  const dispatch = getDateFactDispatchForEntry({
    entry,
    selectedDate: temporal.selectedDate,
    asOfDate: temporal.asOfDate,
  });
  const disabledReason = getCompletionControlDisabledReason({
    entry,
    dispatch,
    canMutatePlanItems,
  });
  const goalId = entry.activeGoal?.original_goal_id ?? entry.originalGoalId;
  const desiredFactState = dispatch?.desiredFactState ?? "present";

  return {
    allowed: disabledReason === null && Boolean(dispatch?.decision.allowed),
    disabledReason,
    decision:
      dispatch?.decision ??
      ({
        route: "disabled",
        exactDateOnly: false,
        allowed: false,
        reason: "future_creation",
      } as CompletionDispatchDecision),
    mutation: {
      goalId,
      date: temporal.selectedDate,
      desiredFactState,
    },
  };
}
