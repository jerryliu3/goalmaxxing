import type {
  CompletionControlDisabledReason,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import type { CompletionTemporalContext } from "@/lib/planner/completion-intent";
import {
  getPlannerCompletionControlDisabledReason,
  resolvePlannerEntryCompletionIntent,
} from "@/lib/planner/completion-intent";
import type { CompletionDispatchDecision } from "@/lib/planner/completion-dispatch";

export interface DateFactDispatchForEntry {
  currentlyCredited: boolean;
  desiredFactState: "present" | "absent";
  decision: CompletionDispatchDecision;
}

export interface CompletionControlState {
  currentlyCredited: boolean;
  dispatch: DateFactDispatchForEntry | null;
  disabledReason: CompletionControlDisabledReason | null;
}

export function getDateFactDispatchForEntry({
  entry,
  selectedDate,
  asOfDate,
}: {
  entry: PlannerDayDetailEntry;
  selectedDate: string | null;
  asOfDate: string | null;
}): DateFactDispatchForEntry | null {
  if (!asOfDate || !selectedDate) {
    return null;
  }

  const { controlState } = resolvePlannerEntryCompletionIntent({
    entry,
    temporal: { selectedDate, asOfDate },
    canMutatePlanItems: true,
  });
  return controlState.dispatch;
}

export function getCompletionControlDisabledReason({
  entry,
  dispatch,
  canMutatePlanItems,
}: {
  entry: PlannerDayDetailEntry;
  dispatch: DateFactDispatchForEntry | null;
  canMutatePlanItems: boolean;
}): CompletionControlDisabledReason | null {
  if (!dispatch) {
    return "unsupported";
  }
  return getPlannerCompletionControlDisabledReason({
    entry,
    intent: {
      allowed: dispatch.decision.allowed,
      disabledReason:
        dispatch.decision.allowed
          ? null
          : dispatch.decision.reason === "future_creation"
            ? "future_creation"
            : "satisfied_elsewhere",
      decision: dispatch.decision,
      mutation: {
        goalId: entry.originalGoalId,
        date: "",
        desiredFactState: dispatch.desiredFactState,
      },
    },
    canMutatePlanItems,
  });
}

export function getCompletionControlState({
  entry,
  selectedDate,
  asOfDate,
  canMutatePlanItems,
}: {
  entry: PlannerDayDetailEntry;
  selectedDate: string | null;
  asOfDate: string | null;
  canMutatePlanItems: boolean;
}): CompletionControlState {
  if (!asOfDate || !selectedDate) {
    return {
      currentlyCredited: entry.creditState !== "uncredited",
      dispatch: null,
      disabledReason: "unsupported",
    };
  }

  const { controlState } = resolvePlannerEntryCompletionIntent({
    entry,
    temporal: { selectedDate, asOfDate },
    canMutatePlanItems,
  });
  return controlState;
}
