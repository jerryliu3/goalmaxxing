import { completionDisabledReasonCopy } from "@/features/planner/calendar-format";
import { resolvePlannerEntryCompletionIntent } from "@/lib/planner/completion-intent";
import {
  overlayCurrentlyCredited,
  plannerFactMutationKey,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";
import type { GoalViewSession } from "./goal-view-model";

export interface GoalSessionCompletion {
  credited: boolean;
  pending: boolean;
  /** Human-readable reason the control is disabled, or null when it works. */
  disabledReason: string | null;
}

/** Eligibility comes from the canonical planner completion intent. */
export function resolveGoalSessionCompletion({
  session,
  asOfDate,
  canMutatePlanItems,
  optimisticCompletionFacts,
  mutationLoadingKey,
}: {
  session: GoalViewSession;
  asOfDate: string;
  canMutatePlanItems: boolean;
  optimisticCompletionFacts: OptimisticCompletionFacts;
  mutationLoadingKey: string | null;
}): GoalSessionCompletion {
  const { controlState } = resolvePlannerEntryCompletionIntent({
    entry: session.entry,
    temporal: { selectedDate: session.date, asOfDate },
    canMutatePlanItems,
  });
  const reason = !canMutatePlanItems
    ? "unsupported"
    : controlState.disabledReason;
  return {
    credited: overlayCurrentlyCredited(
      controlState.currentlyCredited,
      optimisticCompletionFacts,
      session.goalId,
      session.date
    ),
    pending:
      mutationLoadingKey === session.key ||
      mutationLoadingKey === plannerFactMutationKey(session.key),
    disabledReason: reason ? completionDisabledReasonCopy(reason) : null,
  };
}
