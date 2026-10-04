import { getAnchoredPeriod } from "@/lib/goals/periods";
import { matchesCadenceUnitKey } from "@/lib/goals/target-basis";
import { reconcilePersistedGoalCompletions } from "@/lib/planner/persisted-completion-reconciliation";
import type {
  PlannerCanonicalSnapshot,
  PlannerItemRow,
} from "@/lib/planner/context-loader";
import { dateIsInWindow, type DateWindow } from "@/lib/planner/dates";
import {
  draftCommandEntryKey,
  sortPlannerDraftCommands,
  type PlannerDraftCommand,
} from "@/lib/planner/draft-commands";
import { normalizeGoalRequirement } from "@/lib/planner/requirements";
import { resolvePlannerEffectiveScheduledTime } from "@/lib/planner/schedule-time";

export class PlannerDirectDraftValidationError extends Error {
  constructor(
    readonly code:
      | "draft_item_unknown"
      | "draft_item_stale"
      | "draft_item_unmovable"
      | "draft_destination_invalid"
      | "draft_destination_conflict",
    message: string,
    readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "PlannerDirectDraftValidationError";
  }
}

function assignmentKey(assignment: { goalId: string; unitKey: string }) {
  return draftCommandEntryKey(assignment);
}


export function buildDirectDraftPersistence({
  snapshot,
  commands,
  asOfDate,
  writeWindow,
  persistedItems,
}: {
  snapshot: PlannerCanonicalSnapshot;
  commands: PlannerDraftCommand[];
  asOfDate: string;
  writeWindow: DateWindow;
  persistedItems?: PlannerItemRow[];
}) {
  const goalById = new Map(snapshot.goals.map((goal) => [goal.id, goal]));
  const canonicalAssignmentByKey = new Map(
    (snapshot.activePlan?.basePlan.assignments ?? []).map((assignment) => [
      assignmentKey(assignment),
      assignment,
    ])
  );
  const activeItemByKey = new Map(
    (snapshot.activePlan?.items ?? []).map((item) => {
      const activeGoal = snapshot.activePlan?.goals.find(
        (goal) => goal.id === item.plan_goal_id
      );
      return [
        draftCommandEntryKey({
          goalId: activeGoal?.original_goal_id ?? item.plan_goal_id,
          unitKey: item.unit_key,
        }),
        item,
      ];
    })
  );
  // Only goals this draft touches are reconciled. The snapshot's credits cover
  // every goal for preview; applying them here would rewrite unrelated rows.
  const completedUnitDateByKey = new Map<string, string>();
  const allPersistedItems =
    persistedItems ??
    (snapshot.activePlan?.items ?? []).flatMap((item) => {
      const activeGoal = snapshot.activePlan?.goals.find(
        (goal) => goal.id === item.plan_goal_id
      );
      return item.scheduled_date
        ? [
            {
              goal_id: activeGoal?.original_goal_id ?? item.plan_goal_id,
              unit_key: item.unit_key,
              scheduled_date: item.scheduled_date,
            } as PlannerItemRow,
          ]
        : [];
    });
  for (const goalId of new Set(commands.map((command) => command.goalId))) {
    const goal = goalById.get(goalId);
    if (!goal) continue;
    const reconciled = reconcilePersistedGoalCompletions({
      goal,
      completions: snapshot.completions,
      persistedItems: allPersistedItems,
      asOfDate,
      weekStartsOn: snapshot.preferences?.default_policy.weekStartsOn,
    });
    for (const { unitKey, completedOn } of Object.values(reconciled.completionToUnit)) {
      completedUnitDateByKey.set(
        assignmentKey({
          goalId,
          unitKey,
        }),
        completedOn
      );
    }
  }

  const projectedDateByKey = new Map(
    Array.from(canonicalAssignmentByKey.values()).map((assignment) => [
      assignmentKey(assignment),
      activeItemByKey.get(assignmentKey(assignment))?.scheduled_date ??
        assignment.scheduledDate,
    ])
  );
  const projectedTimeByKey = new Map(
    Array.from(canonicalAssignmentByKey.values()).map((assignment) => [
      assignmentKey(assignment),
      assignment.scheduledTimeOverride ?? null,
    ])
  );
  // A credited row lands on its completion date only when this write window
  // can hold that date; otherwise it keeps its saved placement.
  const creditedDateByKey = new Map(
    Array.from(completedUnitDateByKey, ([key, completedOn]) => [
      key,
      dateIsInWindow(completedOn, writeWindow)
        ? completedOn
        : (projectedDateByKey.get(key) ?? null),
    ])
  );
  const persistedDateFor = (key: string) =>
    creditedDateByKey.has(key)
      ? (creditedDateByKey.get(key) ?? null)
      : (projectedDateByKey.get(key) ?? null);

  const movedAssignments = new Map<string, { goalId: string; unitKey: string }>();
  for (const command of sortPlannerDraftCommands(commands)) {
    const key = assignmentKey(command);
    const assignment = canonicalAssignmentByKey.get(key);
    const activeItem = activeItemByKey.get(key);
    const goal = goalById.get(command.goalId);
    if (!assignment || !activeItem || !goal) {
      throw new PlannerDirectDraftValidationError(
        "draft_item_unknown",
        "That planner session is no longer available. Refresh and try again.",
        { goalId: command.goalId, unitKey: command.unitKey }
      );
    }
    const requirement = normalizeGoalRequirement(goal).requirement;
    const ordinalMatch =
      requirement.kind === "milestone_sequence"
        ? /^milestone:([1-9][0-9]*)$/.exec(command.unitKey)
        : requirement.kind === "deadline_total"
          ? /^total:([1-9][0-9]*)$/.exec(command.unitKey)
          : null;
    const identityIsCurrent =
      requirement.kind === "cadence"
        ? matchesCadenceUnitKey(
            command.unitKey,
            getAnchoredPeriod(
              goal.start_date,
              requirement.interval,
              assignment.scheduledDate ?? goal.start_date,
              {
                weekStartsOn:
                  snapshot.preferences?.default_policy.weekStartsOn,
              }
            ).periodKey,
            requirement.targetCount
          )
        : Boolean(
            ordinalMatch &&
              Number(ordinalMatch[1]) <= requirement.targetCount
          );
    if (!identityIsCurrent) {
      throw new PlannerDirectDraftValidationError(
        "draft_item_stale",
        "A goal changed after this draft was created. Refresh and try again.",
        { goalId: command.goalId, unitKey: command.unitKey }
      );
    }
    const itemIsLocked = assignment.locked;
    const itemIsUnscheduled = activeItem.scheduled_date === null;
    const itemIsCredited = completedUnitDateByKey.has(key);
    const throwIfImmovable = (action: "moved" | "changed") => {
      if (itemIsLocked) {
        throw new PlannerDirectDraftValidationError(
          "draft_item_unmovable",
          "Unlock this session first.",
          { goalId: command.goalId, unitKey: command.unitKey }
        );
      }
      if (itemIsUnscheduled) {
        throw new PlannerDirectDraftValidationError(
          "draft_item_unmovable",
          "Unscheduled sessions cannot be moved from this draft.",
          { goalId: command.goalId, unitKey: command.unitKey }
        );
      }
      if (itemIsCredited) {
        throw new PlannerDirectDraftValidationError(
          "draft_item_unmovable",
          action === "moved"
            ? "This session is already credited by a completion, so it cannot be moved."
            : "This session is already credited by a completion, so it cannot be changed.",
          { goalId: command.goalId, unitKey: command.unitKey }
        );
      }
    };
    if (command.kind === "set_item_time_override") {
      throwIfImmovable("changed");
      projectedTimeByKey.set(key, command.localTime);
      continue;
    }
    if (command.kind === "clear_item_time_override") {
      throwIfImmovable("changed");
      projectedTimeByKey.set(key, null);
      continue;
    }
    if (command.kind !== "move_item") {
      continue;
    }
    if (activeItem.scheduled_date !== command.sourceDate) {
      throw new PlannerDirectDraftValidationError(
        "draft_item_stale",
        "That session moved after this draft was created. Refresh and try again.",
        { goalId: command.goalId, unitKey: command.unitKey }
      );
    }
    throwIfImmovable("moved");
    if (command.scheduledDate !== null) {
      const creditWindow =
        requirement.kind === "cadence"
          ? getAnchoredPeriod(
              goal.start_date,
              requirement.interval,
              activeItem.scheduled_date ?? command.sourceDate,
              {
                weekStartsOn:
                  snapshot.preferences?.default_policy.weekStartsOn,
              }
            )
          : {
              start: goal.start_date,
              end: goal.end_date ?? goal.start_date,
            };
      const moveWindow = {
        start: creditWindow.start > asOfDate ? creditWindow.start : asOfDate,
        end: creditWindow.end,
      };
      if (
        command.scheduledDate < moveWindow.start ||
        command.scheduledDate > moveWindow.end
      ) {
        throw new PlannerDirectDraftValidationError(
          "draft_destination_invalid",
          "That date is outside this session's allowed move range.",
          {
            goalId: command.goalId,
            unitKey: command.unitKey,
            scheduledDate: command.scheduledDate,
            moveWindow,
          }
        );
      }
    }
    movedAssignments.set(key, command);
    projectedDateByKey.set(key, command.scheduledDate);
  }

  // Validate the final batch, so swaps and chains do not depend on command order.
  for (const [key, command] of movedAssignments) {
    const destination = projectedDateByKey.get(key);
    if (!destination) continue;
    const conflictingAssignment = Array.from(canonicalAssignmentByKey.values()).some(
      (candidate) => candidate.goalId === command.goalId && assignmentKey(candidate) !== key &&
        persistedDateFor(assignmentKey(candidate)) === destination
    );
    const completionConflict = snapshot.completions.some(
      (completion) => completion.goal_id === command.goalId && completion.completed_on === destination
    );
    if (conflictingAssignment || completionConflict) {
      throw new PlannerDirectDraftValidationError(
        "draft_destination_conflict",
        "That goal already has a session or completion on the selected date.",
        { goalId: command.goalId, unitKey: command.unitKey, scheduledDate: destination }
      );
    }
  }

  return Array.from(canonicalAssignmentByKey.values()).map((assignment) => {
    const key = assignmentKey(assignment);
    const goal = goalById.get(assignment.goalId)!;
    const persistedScheduledDate = persistedDateFor(key);
    const scheduledTimeOverride = projectedTimeByKey.get(key) ?? null;
    const resolvedTime = resolvePlannerEffectiveScheduledTime({
      scheduledDate: persistedScheduledDate,
      goalDefaultLocalTime: goal.default_local_time ?? null,
      scheduledTimeOverride,
    });
    return {
      goal_id: assignment.goalId,
      unit_key: assignment.unitKey,
      original_scheduled_date:
        activeItemByKey.get(key)?.original_scheduled_date ??
        assignment.scheduledDate,
      scheduled_date: persistedScheduledDate,
      scheduled_time_override: scheduledTimeOverride,
      effective_scheduled_local_time:
        resolvedTime.effectiveScheduledLocalTime,
      effective_scheduled_at_local: resolvedTime.effectiveScheduledAtLocal,
      locked: assignment.locked,
    };
  });
}
