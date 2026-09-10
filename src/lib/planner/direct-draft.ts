import { getAnchoredPeriod } from "@/lib/goals/periods";
import { matchesCadenceUnitKey } from "@/lib/goals/target-basis";
import { getAdmissibleCompletions } from "@/lib/goals/admissible";
import type { Goal, RecurrenceInterval } from "@/lib/goals/types";
import type {
  PlannerCanonicalSnapshot,
  PlannerItemRow,
} from "@/lib/planner/context-loader";
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

/**
 * Cadence completions credit one session each, inside that period only.
 * This must stay aligned with `pickCadenceCreditUnit` / kernel reconciliation:
 * latest scheduled date on or before the completion, else earliest future slot.
 * A completion never freezes every other slot in the same week/month.
 */
function pickCadenceItemForCompletion({
  items,
  completionDate,
  goal,
  interval,
  weekStartsOn,
}: {
  items: PlannerItemRow[];
  completionDate: string;
  goal: Goal;
  interval: RecurrenceInterval;
  weekStartsOn: number | undefined;
}) {
  const candidates = items.filter((item) => {
    if (!item.scheduled_date) {
      return false;
    }
    const period = getAnchoredPeriod(
      goal.start_date,
      interval,
      item.scheduled_date,
      { weekStartsOn }
    );
    return (
      completionDate >= period.start && completionDate <= period.end
    );
  });
  if (candidates.length === 0) {
    return null;
  }
  const pastOrSame = candidates.filter(
    (item) => (item.scheduled_date ?? "") <= completionDate
  );
  const pool = pastOrSame.length > 0 ? pastOrSame : candidates;
  const preferLatest = pastOrSame.length > 0;
  return [...pool].sort((left, right) => {
    const leftDate = left.scheduled_date ?? "";
    const rightDate = right.scheduled_date ?? "";
    const byDate = preferLatest
      ? rightDate.localeCompare(leftDate)
      : leftDate.localeCompare(rightDate);
    if (byDate !== 0) {
      return byDate;
    }
    return left.unit_key.localeCompare(right.unit_key);
  })[0] ?? null;
}

function completedUnitKeysForGoal({
  snapshot,
  goalId,
  persistedItems,
  asOfDate,
}: {
  snapshot: PlannerCanonicalSnapshot;
  goalId: string;
  persistedItems: PlannerItemRow[];
  asOfDate: string;
}) {
  const goal = snapshot.goals.find((candidate) => candidate.id === goalId);
  if (!goal) {
    return new Set<string>();
  }
  const requirement = normalizeGoalRequirement(goal).requirement;
  const completions = getAdmissibleCompletions(
    goal,
    snapshot.completions.filter(
      (completion) => completion.goal_id === goal.id
    ),
    { asOfDate }
  );
  const completed = new Set<string>();
  if (requirement.kind === "milestone_sequence") {
    for (
      let ordinal = 1;
      ordinal <= Math.min(requirement.targetCount, completions.length);
      ordinal += 1
    ) {
      completed.add(`milestone:${ordinal}`);
    }
    return completed;
  }
  if (requirement.kind === "cadence") {
    const remaining = persistedItems.filter(
      (candidate) => candidate.goal_id === goal.id && candidate.scheduled_date
    );
    const weekStartsOn =
      snapshot.preferences?.default_policy.weekStartsOn;
    for (const completion of completions) {
      const picked = pickCadenceItemForCompletion({
        items: remaining,
        completionDate: completion.completed_on,
        goal,
        interval: requirement.interval,
        weekStartsOn,
      });
      if (!picked) {
        continue;
      }
      completed.add(picked.unit_key);
      const pickedIndex = remaining.findIndex(
        (item) => item.unit_key === picked.unit_key
      );
      if (pickedIndex >= 0) {
        remaining.splice(pickedIndex, 1);
      }
    }
    return completed;
  }

  const scheduledDateByUnitKey = new Map(
    persistedItems
      .filter((item) => item.goal_id === goal.id)
      .map((item) => [item.unit_key, item.scheduled_date])
  );
  const usedCompletionIds = new Set<string>();
  for (let ordinal = 1; ordinal <= requirement.targetCount; ordinal += 1) {
    const unitKey = `total:${ordinal}`;
    const scheduledDate = scheduledDateByUnitKey.get(unitKey);
    if (!scheduledDate) {
      continue;
    }
    const exact = completions.find(
      (completion) =>
        !usedCompletionIds.has(completion.id) &&
        completion.completed_on === scheduledDate
    );
    if (exact) {
      usedCompletionIds.add(exact.id);
      completed.add(unitKey);
    }
  }
  const remainingCompletions = completions.filter(
    (completion) => !usedCompletionIds.has(completion.id)
  );
  let completionIndex = 0;
  for (
    let ordinal = 1;
    ordinal <= requirement.targetCount &&
    completionIndex < remainingCompletions.length;
    ordinal += 1
  ) {
    const unitKey = `total:${ordinal}`;
    if (completed.has(unitKey)) {
      continue;
    }
    completed.add(unitKey);
    completionIndex += 1;
  }
  return completed;
}

export function buildDirectDraftPersistence({
  snapshot,
  commands,
  asOfDate,
  persistedItems,
}: {
  snapshot: PlannerCanonicalSnapshot;
  commands: PlannerDraftCommand[];
  asOfDate: string;
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
  const completedUnitKeys = new Set(
    Object.values(snapshot.activePlan?.basePlan.completionToUnit ?? {}).map(
      (unit) => assignmentKey(unit)
    )
  );
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
    for (const unitKey of completedUnitKeysForGoal({
      snapshot,
      goalId,
      persistedItems: allPersistedItems,
      asOfDate,
    })) {
      completedUnitKeys.add(
        assignmentKey({
          goalId,
          unitKey,
        })
      );
    }
  }

  const projectedDateByKey = new Map(
    Array.from(canonicalAssignmentByKey.values()).map((assignment) => [
      assignmentKey(assignment),
      assignment.scheduledDate,
    ])
  );
  const projectedTimeByKey = new Map(
    Array.from(canonicalAssignmentByKey.values()).map((assignment) => [
      assignmentKey(assignment),
      assignment.scheduledTimeOverride ?? null,
    ])
  );

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
    const itemIsUnscheduled = assignment.scheduledDate === null;
    const itemIsCredited = completedUnitKeys.has(key);
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
    if (
      assignment.scheduledDate !== command.sourceDate
    ) {
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
              assignment.scheduledDate ?? command.sourceDate,
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
      const conflictingAssignment = Array.from(
        canonicalAssignmentByKey.values()
      ).find(
        (candidate) =>
          candidate.goalId === command.goalId &&
          assignmentKey(candidate) !== key &&
          projectedDateByKey.get(assignmentKey(candidate)) ===
            command.scheduledDate
      );
      const completionConflict = snapshot.completions.some(
        (completion) =>
          completion.goal_id === command.goalId &&
          completion.completed_on === command.scheduledDate
      );
      if (conflictingAssignment || completionConflict) {
        throw new PlannerDirectDraftValidationError(
          "draft_destination_conflict",
          "That goal already has a session or completion on the selected date.",
          {
            goalId: command.goalId,
            unitKey: command.unitKey,
            scheduledDate: command.scheduledDate,
          }
        );
      }
    }
    projectedDateByKey.set(key, command.scheduledDate);
  }

  return Array.from(canonicalAssignmentByKey.values()).map((assignment) => {
    const key = assignmentKey(assignment);
    const goal = goalById.get(assignment.goalId)!;
    const scheduledDate = projectedDateByKey.get(key) ?? null;
    const scheduledTimeOverride = projectedTimeByKey.get(key) ?? null;
    const resolvedTime = resolvePlannerEffectiveScheduledTime({
      scheduledDate,
      goalDefaultLocalTime: goal.default_local_time ?? null,
      scheduledTimeOverride,
    });
    return {
      goal_id: assignment.goalId,
      unit_key: assignment.unitKey,
      original_scheduled_date:
        activeItemByKey.get(key)?.original_scheduled_date ??
        assignment.scheduledDate,
      scheduled_date: scheduledDate,
      scheduled_time_override: scheduledTimeOverride,
      effective_scheduled_local_time:
        resolvedTime.effectiveScheduledLocalTime,
      effective_scheduled_at_local: resolvedTime.effectiveScheduledAtLocal,
      locked: assignment.locked,
    };
  });
}
