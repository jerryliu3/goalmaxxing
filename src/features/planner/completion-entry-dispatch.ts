import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import {
  completionDisabledReasonCopy,
  isEntryCredited,
} from "@/features/planner/calendar-format";
import { READ_ONLY_MONTH_HINT } from "@/features/planner/planner-save-availability";
import type {
  CompletionControlDisabledReason,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import {
  getPlannerCompletionControlDisabledReason,
  resolvePlannerEntryCompletionIntent,
} from "@/lib/planner/completion-intent";
import { resolveSelectedDateState } from "@/lib/dates/day";
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

export function isCompletionClosedForDate(
  selectedDate: string,
  asOfDate: string | null
) {
  if (!asOfDate) {
    return false;
  }
  return resolveSelectedDateState(selectedDate, asOfDate) === "future";
}

export function planCompletionControlMode(state: {
  currentlyCredited: boolean;
  disabledReasonCopy: string | null;
}): "toggle" | "done" | "hidden" {
  if (state.disabledReasonCopy) {
    return state.currentlyCredited ? "done" : "hidden";
  }
  return "toggle";
}

export function planCompletionControlModeForDate({
  currentlyCredited,
  selectedDate,
  asOfDate,
  extraDisabledReason = null,
}: {
  currentlyCredited: boolean;
  selectedDate: string;
  asOfDate: string | null;
  extraDisabledReason?: string | null;
}): "toggle" | "done" | "hidden" {
  const disabledReasonCopy =
    extraDisabledReason ??
    (isCompletionClosedForDate(selectedDate, asOfDate)
      ? "You can only mark this done for today or past dates."
      : null);
  return planCompletionControlMode({
    currentlyCredited,
    disabledReasonCopy,
  });
}

export function getPlannerCompletionTogglePresentation({
  entry,
  selectedDay,
  asOfDate,
  canMutatePlanItems,
  canMutateEntryOnDay,
}: {
  entry: PlannerDayDetailEntry;
  selectedDay: string;
  asOfDate: string | null;
  canMutatePlanItems: boolean;
  canMutateEntryOnDay: (entry: PlannerDayDetailEntry, day: string) => boolean;
}): {
  currentlyCredited: boolean;
  disabledReasonCopy: string | null;
} {
  const currentlyCredited = isEntryCredited(entry);
  if (!canMutateEntryOnDay(entry, selectedDay)) {
    return {
      currentlyCredited,
      disabledReasonCopy: READ_ONLY_MONTH_HINT,
    };
  }
  if (isPlannerTaskCalendarEntry(entry)) {
    return {
      currentlyCredited,
      disabledReasonCopy: isCompletionClosedForDate(selectedDay, asOfDate)
        ? "You can only mark this done for today or past dates."
        : null,
    };
  }
  const completionState = getCompletionControlState({
    entry,
    selectedDate: selectedDay,
    asOfDate,
    canMutatePlanItems,
  });
  return {
    currentlyCredited: completionState.currentlyCredited,
    disabledReasonCopy: completionState.disabledReason
      ? completionDisabledReasonCopy(completionState.disabledReason)
      : null,
  };
}
