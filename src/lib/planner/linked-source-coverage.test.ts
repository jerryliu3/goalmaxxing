import { describe, expect, it } from "vitest";
import type { Completion, Goal } from "@/lib/goals/types";
import { withLifetimeTargetBasisForTests } from "@/lib/goals/goal-test-fixtures";
import {
  buildLinkSuppressionInboundIndex,
  toLinkSuppressionSource,
} from "@/lib/planner/link-suppression";
import {
  buildParentCompletionDates,
  buildPlannedDatesByGoalIdFromAssignments,
  buildPlannedDatesByGoalIdFromPlannerItems,
  collectProjectedLinkedSourceCoverageDates,
  computeLinkedSourceCoverageByGoalId,
  computeProjectedLinkedSourceCoverageCount,
  extractOrdinalsFromUnitKeys,
  indexCompletionsByGoalId,
  mapProjectedCoverageOrdinals,
  mapProjectedCoverageToUnitKeys,
  resolveProjectedLinkedSourceCoverageForGoal,
} from "@/lib/planner/linked-source-coverage";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";

function buildGoal(overrides: Partial<Goal> = {}): Goal {
  const built = {
    id: "22222222-2222-4222-8222-222222222222",
    owner_id: OWNER_ID,
    title: "Goal",
    description: null,
    category: "Personal",
    color: null,
    frequency_type: "fixed_milestones",
    recurrence_interval: null,
    target_count: 4,
    milestone_names: ["1", "2", "3", "4"],
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    default_local_time: null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Goal;
  return withLifetimeTargetBasisForTests(built, overrides);
}

function completion(
  goalId: string,
  completedOn: string,
  source: Completion["source"] = "manual",
  id = `${goalId}-${completedOn}`
): Completion {
  return {
    id,
    goal_id: goalId,
    user_id: OWNER_ID,
    completed_on: completedOn,
    source,
    created_at: `${completedOn}T00:00:00.000Z`,
  };
}

function plannedMap(entries: Array<[string, string[]]>) {
  return new Map(entries);
}

function linkContext(goals: Goal[], links: Array<{ sourceGoalId: string; targetGoalId: string }>) {
  return {
    inboundSourceIdsByTargetId: buildLinkSuppressionInboundIndex(links),
    sourcesById: new Map(goals.map((goal) => [goal.id, toLinkSuppressionSource(goal)])),
  };
}

describe("buildParentCompletionDates", () => {
  it("returns unique parent completion dates", () => {
    const targetId = "target-a";
    const completionsByGoalId = indexCompletionsByGoalId([
      completion(targetId, "2026-08-03", "linked_cascade"),
      completion(targetId, "2026-08-04", "manual"),
      completion(targetId, "2026-08-04", "manual", "dup"),
    ]);
    expect(buildParentCompletionDates(targetId, completionsByGoalId)).toEqual(
      new Set(["2026-08-03", "2026-08-04"])
    );
  });
});

describe("collectProjectedLinkedSourceCoverageDates", () => {
  const target = buildGoal({
    id: "target-a",
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 52,
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  });

  it("returns empty for cadence targets", () => {
    const cadenceTarget = buildGoal({
      id: "cadence-target",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 4,
      target_basis: "period",
      milestone_names: null,
    });
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: cadenceTarget,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-18",
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-10"),
      ]),
      plannedDatesByGoalId: plannedMap([[source.id, ["2026-08-20"]]]),
    });
    expect(dates).toEqual(new Set());
  });

  it("returns empty when there are no linked sources", () => {
    expect(
      collectProjectedLinkedSourceCoverageDates({
        goal: target,
        effectiveEnd: "2026-12-31",
        asOfDate: "2026-08-18",
        linkSourceGoals: [],
        completionsByGoalId: new Map(),
        plannedDatesByGoalId: new Map(),
      })
    ).toEqual(new Set());
  });

  it("includes future source planned dates and past source completions within windows", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 3,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-18",
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-03"),
        completion(source.id, "2026-09-01"),
      ]),
      plannedDatesByGoalId: plannedMap([
        [source.id, ["2026-08-10", "2026-08-20", "2026-08-15"]],
      ]),
    });
    expect(dates).toEqual(new Set(["2026-08-03", "2026-08-20"]));
  });

  it("excludes source dates that already have a parent completion on the same day (rule A)", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 3,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-18",
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-03"),
        completion(source.id, "2026-08-04"),
        completion(target.id, "2026-08-03", "linked_cascade"),
        completion(target.id, "2026-08-04", "linked_cascade"),
      ]),
      plannedDatesByGoalId: plannedMap([[source.id, ["2026-08-20"]]]),
      parentCompletionDates: new Set(["2026-08-03", "2026-08-04"]),
    });
    expect(dates).toEqual(new Set(["2026-08-20"]));
  });

  it("drops elapsed uncompleted source plans before asOfDate", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-28",
      linkSourceGoals: [source],
      completionsByGoalId: new Map(),
      plannedDatesByGoalId: plannedMap([
        [source.id, ["2026-08-20", "2026-08-30"]],
      ]),
    });
    expect(dates).toEqual(new Set(["2026-08-30"]));
  });

  it("ignores archived or deleted linked sources", () => {
    const activeSource = buildGoal({
      id: "source-active",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 1,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const archivedSource = buildGoal({
      id: "source-archived",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 1,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
      archived_at: "2026-08-10T00:00:00.000Z",
    });
    const deletedSource = buildGoal({
      id: "source-deleted",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 1,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
      is_deleted: true,
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-18",
      linkSourceGoals: [activeSource, archivedSource, deletedSource],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(activeSource.id, "2026-08-10"),
        completion(archivedSource.id, "2026-08-11"),
        completion(deletedSource.id, "2026-08-12"),
      ]),
      plannedDatesByGoalId: new Map(),
    });
    expect(dates).toEqual(new Set(["2026-08-10"]));
  });

  it("deduplicates overlapping dates across multiple linked sources", () => {
    const sourceA = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const sourceB = buildGoal({
      id: "source-b",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-18",
      linkSourceGoals: [sourceA, sourceB],
      completionsByGoalId: new Map(),
      plannedDatesByGoalId: plannedMap([
        [sourceA.id, ["2026-08-20", "2026-08-21"]],
        [sourceB.id, ["2026-08-21", "2026-08-22"]],
      ]),
    });
    expect(dates).toEqual(new Set(["2026-08-20", "2026-08-21", "2026-08-22"]));
  });

  it("filters dates to the target effective end and source windows", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 4,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-09-15",
    });
    const septemberTarget = buildGoal({
      id: "target-sept",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 2,
      milestone_names: ["1", "2"],
      start_date: "2026-09-01",
      end_date: "2026-09-30",
    });
    const dates = collectProjectedLinkedSourceCoverageDates({
      goal: septemberTarget,
      effectiveEnd: "2026-09-30",
      asOfDate: "2026-09-20",
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-20"),
        completion(source.id, "2026-09-10"),
      ]),
      plannedDatesByGoalId: plannedMap([
        [source.id, ["2026-08-25", "2026-10-01"]],
      ]),
    });
    expect(dates).toEqual(new Set(["2026-09-10"]));
  });
});

describe("computeProjectedLinkedSourceCoverageCount", () => {
  it("caps projected coverage at the target requirement count", () => {
    const target = buildGoal({ target_count: 3 });
    expect(
      computeProjectedLinkedSourceCoverageCount({
        goal: target,
        projectedCoverageDates: new Set(["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"]),
      })
    ).toBe(3);
  });

  it("returns zero for cadence targets", () => {
    const cadenceTarget = buildGoal({
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 4,
      target_basis: "period",
      milestone_names: null,
    });
    expect(
      computeProjectedLinkedSourceCoverageCount({
        goal: cadenceTarget,
        projectedCoverageDates: new Set(["2026-08-01"]),
      })
    ).toBe(0);
  });
});

describe("resolveProjectedLinkedSourceCoverageForGoal", () => {
  it("returns zero projected coverage when the target is not suppressed on asOfDate (rule B)", () => {
    const source = buildGoal({
      id: "source-may",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 10,
      milestone_names: null,
      start_date: "2026-05-01",
      end_date: "2026-05-31",
    });
    const target = buildGoal({
      id: "target-exercise",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 52,
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const links = [{ sourceGoalId: source.id, targetGoalId: target.id }];
    const { inboundSourceIdsByTargetId, sourcesById } = linkContext(
      [source, target],
      links
    );
    const mayCompletions = [
      "2026-05-02",
      "2026-05-05",
      "2026-05-07",
      "2026-05-09",
      "2026-05-12",
      "2026-05-14",
      "2026-05-16",
      "2026-05-19",
      "2026-05-21",
      "2026-05-23",
      "2026-05-26",
      "2026-05-28",
      "2026-05-30",
      "2026-05-31",
      "2026-05-04",
    ].map((date) => completion(source.id, date));
    const parentCompletions = Array.from({ length: 46 }, (_, index) =>
      completion(target.id, `2026-0${index < 9 ? "1" : ""}${index + 1}-01`.replace("010-", "10-"))
    );

    const result = resolveProjectedLinkedSourceCoverageForGoal({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-09-03",
      ownerId: OWNER_ID,
      inboundSourceIdsByTargetId,
      sourcesById,
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        ...mayCompletions,
        ...parentCompletions,
      ]),
      plannedDatesByGoalId: new Map(),
    });

    expect(result.projectedCoverageDates).toEqual(new Set());
    expect(result.projectedCoverageCount).toBe(0);
  });

  it("projects coverage only while the target remains suppressed", () => {
    const source = buildGoal({
      id: "source-aug",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const target = buildGoal({
      id: "target-annual",
      frequency_type: "fixed_milestones",
      target_count: 4,
      milestone_names: ["1", "2", "3", "4"],
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const links = [{ sourceGoalId: source.id, targetGoalId: target.id }];
    const { inboundSourceIdsByTargetId, sourcesById } = linkContext(
      [source, target],
      links
    );
    const input = {
      goal: target,
      effectiveEnd: "2026-12-31",
      ownerId: OWNER_ID,
      inboundSourceIdsByTargetId,
      sourcesById,
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-03"),
      ]),
      plannedDatesByGoalId: plannedMap([[source.id, ["2026-08-20"]]]),
    };

    const suppressed = resolveProjectedLinkedSourceCoverageForGoal({
      ...input,
      asOfDate: "2026-08-18",
    });
    expect(suppressed.projectedCoverageCount).toBe(2);
    expect(suppressed.projectedCoverageDates).toEqual(
      new Set(["2026-08-03", "2026-08-20"])
    );

    const unsuppressed = resolveProjectedLinkedSourceCoverageForGoal({
      ...input,
      asOfDate: "2026-09-01",
    });
    expect(unsuppressed.projectedCoverageCount).toBe(0);
    expect(unsuppressed.projectedCoverageDates).toEqual(new Set());
  });

  it("dedupes cascaded parent completion dates while suppressed", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 3,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const target = buildGoal({
      id: "target-a",
      frequency_type: "fixed_milestones",
      target_count: 4,
      milestone_names: ["1", "2", "3", "4"],
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const links = [{ sourceGoalId: source.id, targetGoalId: target.id }];
    const { inboundSourceIdsByTargetId, sourcesById } = linkContext(
      [source, target],
      links
    );

    const result = resolveProjectedLinkedSourceCoverageForGoal({
      goal: target,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-08-18",
      ownerId: OWNER_ID,
      inboundSourceIdsByTargetId,
      sourcesById,
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-03"),
        completion(source.id, "2026-08-04"),
        completion(target.id, "2026-08-03", "linked_cascade"),
        completion(target.id, "2026-08-04", "linked_cascade"),
      ]),
      plannedDatesByGoalId: plannedMap([[source.id, ["2026-08-20"]]]),
    });

    expect(result.projectedCoverageCount).toBe(1);
    expect(result.projectedCoverageDates).toEqual(new Set(["2026-08-20"]));
  });

  it("returns zero after suppression ends even if source completions exist", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-09-15",
    });
    const target = buildGoal({
      id: "target-a",
      frequency_type: "fixed_milestones",
      target_count: 2,
      milestone_names: ["1", "2"],
      start_date: "2026-09-01",
      end_date: "2026-09-30",
    });
    const links = [{ sourceGoalId: source.id, targetGoalId: target.id }];
    const { inboundSourceIdsByTargetId, sourcesById } = linkContext(
      [source, target],
      links
    );

    const result = resolveProjectedLinkedSourceCoverageForGoal({
      goal: target,
      effectiveEnd: "2026-09-30",
      asOfDate: "2026-09-20",
      ownerId: OWNER_ID,
      inboundSourceIdsByTargetId,
      sourcesById,
      linkSourceGoals: [source],
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-09-10"),
      ]),
      plannedDatesByGoalId: new Map(),
    });

    expect(result.projectedCoverageCount).toBe(0);
  });
});

describe("computeLinkedSourceCoverageByGoalId", () => {
  it("returns per-goal projected counts using suppression and parent dedupe rules", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const suppressedTarget = buildGoal({
      id: "target-suppressed",
      frequency_type: "fixed_milestones",
      target_count: 4,
      milestone_names: ["1", "2", "3", "4"],
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const unsuppressedTarget = buildGoal({
      id: "target-open",
      frequency_type: "fixed_milestones",
      target_count: 4,
      milestone_names: ["1", "2", "3", "4"],
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const links = [
      { sourceGoalId: source.id, targetGoalId: suppressedTarget.id },
      { sourceGoalId: source.id, targetGoalId: unsuppressedTarget.id },
    ];
    const { projectedCoverageCountByGoalId } = computeLinkedSourceCoverageByGoalId({
      goals: [source, suppressedTarget, unsuppressedTarget],
      links,
      ownerId: OWNER_ID,
      asOfDate: "2026-09-01",
      preparationStart: "2026-09-01",
      preparationEnd: "2026-12-31",
      completionsByGoalId: indexCompletionsByGoalId([
        completion(source.id, "2026-08-10"),
      ]),
      plannedDatesByGoalId: new Map(),
    });

    expect(projectedCoverageCountByGoalId.get(suppressedTarget.id)).toBe(0);
    expect(projectedCoverageCountByGoalId.get(unsuppressedTarget.id)).toBe(0);
  });

  it("counts future source plans for suppressed targets before suppression ends", () => {
    const source = buildGoal({
      id: "source-a",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 2,
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const target = buildGoal({
      id: "target-a",
      frequency_type: "fixed_milestones",
      target_count: 5,
      milestone_names: ["1", "2", "3", "4", "5"],
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const { projectedCoverageCountByGoalId } = computeLinkedSourceCoverageByGoalId({
      goals: [source, target],
      links: [{ sourceGoalId: source.id, targetGoalId: target.id }],
      ownerId: OWNER_ID,
      asOfDate: "2026-08-18",
      preparationStart: "2026-08-18",
      preparationEnd: "2026-12-31",
      completionsByGoalId: new Map(),
      plannedDatesByGoalId: plannedMap([
        [source.id, ["2026-08-20", "2026-08-25"]],
      ]),
    });
    expect(projectedCoverageCountByGoalId.get(target.id)).toBe(2);
  });
});

describe("planner item and assignment planned-date helpers", () => {
  it("buildPlannedDatesByGoalIdFromPlannerItems groups scheduled dates", () => {
    const map = buildPlannedDatesByGoalIdFromPlannerItems([
      { goal_id: "g1", scheduled_date: "2026-08-01" },
      { goal_id: "g1", scheduled_date: "2026-08-02" },
      { goal_id: "g2", scheduled_date: "2026-08-03" },
    ]);
    expect(map.get("g1")).toEqual(["2026-08-01", "2026-08-02"]);
    expect(map.get("g2")).toEqual(["2026-08-03"]);
  });

  it("buildPlannedDatesByGoalIdFromAssignments skips null scheduled dates", () => {
    const map = buildPlannedDatesByGoalIdFromAssignments([
      { goalId: "g1", scheduledDate: "2026-08-01" },
      { goalId: "g1", scheduledDate: null },
      { goalId: "g2", scheduledDate: "2026-08-03" },
    ]);
    expect(map.get("g1")).toEqual(["2026-08-01"]);
    expect(map.get("g2")).toEqual(["2026-08-03"]);
  });
});

describe("projected coverage ordinal mapping", () => {
  it("mapProjectedCoverageToUnitKeys credits lowest unresolved ordinals first", () => {
    const required = new Set(["total:1", "total:2", "total:3", "total:10"]);
    const credited = new Set(["total:1", "total:2"]);
    expect(
      mapProjectedCoverageToUnitKeys({
        requiredUnitKeys: required,
        completionCreditedUnitKeys: credited,
        projectedCoverageCount: 2,
      })
    ).toEqual(new Set(["total:3", "total:10"]));
  });

  it("mapProjectedCoverageOrdinals credits lowest unresolved ordinals first", () => {
    expect(
      mapProjectedCoverageOrdinals({
        targetCount: 5,
        completionCreditedOrdinals: new Set([1, 2]),
        projectedCoverageCount: 2,
      })
    ).toEqual(new Set([3, 4]));
  });

  it("extractOrdinalsFromUnitKeys parses total and milestone keys", () => {
    expect(
      extractOrdinalsFromUnitKeys(
        new Set(["total:3", "milestone:7", "bad-key", "total:0"])
      )
    ).toEqual(new Set([3, 7]));
  });

  it("returns empty sets when projected coverage count is zero", () => {
    expect(
      mapProjectedCoverageToUnitKeys({
        requiredUnitKeys: new Set(["total:1"]),
        completionCreditedUnitKeys: new Set(),
        projectedCoverageCount: 0,
      })
    ).toEqual(new Set());
    expect(
      mapProjectedCoverageOrdinals({
        targetCount: 3,
        completionCreditedOrdinals: new Set(),
        projectedCoverageCount: 0,
      })
    ).toEqual(new Set());
  });
});

describe("exercise-style regression", () => {
  it("does not virtual-credit remaining ordinals from ended subgoals after suppression lifts", () => {
    const maySource = buildGoal({
      id: "may-source",
      title: "May subgoal",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 10,
      milestone_names: null,
      start_date: "2026-05-01",
      end_date: "2026-05-31",
    });
    const julySource = buildGoal({
      id: "july-source",
      title: "July subgoal",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 3,
      milestone_names: null,
      start_date: "2026-07-01",
      end_date: "2026-07-31",
    });
    const exerciseTarget = buildGoal({
      id: "exercise-target",
      title: "Exercise in the morning",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 52,
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
    });
    const links = [
      { sourceGoalId: maySource.id, targetGoalId: exerciseTarget.id },
      { sourceGoalId: julySource.id, targetGoalId: exerciseTarget.id },
    ];
    const { inboundSourceIdsByTargetId, sourcesById } = linkContext(
      [maySource, julySource, exerciseTarget],
      links
    );

    const mayDates = [
      "2026-05-02",
      "2026-05-04",
      "2026-05-07",
      "2026-05-09",
      "2026-05-12",
      "2026-05-14",
      "2026-05-16",
      "2026-05-19",
      "2026-05-21",
      "2026-05-23",
      "2026-05-26",
      "2026-05-28",
      "2026-05-30",
      "2026-05-31",
      "2026-05-05",
    ];
    const julyDates = ["2026-07-02", "2026-07-10", "2026-07-18"];
    const parentCascadeDates = [
      ...mayDates.slice(0, 14),
      "2026-07-02",
      "2026-07-10",
    ];
    const parentManualDates = Array.from({ length: 30 }, (_, index) => {
      const month = String(Math.floor(index / 28) + 1).padStart(2, "0");
      const day = String((index % 28) + 1).padStart(2, "0");
      return `2026-${month}-${day}`;
    }).filter((date) => !parentCascadeDates.includes(date));

    const completionsByGoalId = indexCompletionsByGoalId([
      ...mayDates.map((date) => completion(maySource.id, date)),
      ...julyDates.map((date) => completion(julySource.id, date)),
      ...parentCascadeDates.map((date) =>
        completion(exerciseTarget.id, date, "linked_cascade")
      ),
      ...parentManualDates.map((date) => completion(exerciseTarget.id, date, "manual")),
    ]);

    const result = resolveProjectedLinkedSourceCoverageForGoal({
      goal: exerciseTarget,
      effectiveEnd: "2026-12-31",
      asOfDate: "2026-09-03",
      ownerId: OWNER_ID,
      inboundSourceIdsByTargetId,
      sourcesById,
      linkSourceGoals: [maySource, julySource],
      completionsByGoalId,
      plannedDatesByGoalId: new Map(),
    });

    expect(result.projectedCoverageCount).toBe(0);
    expect(result.projectedCoverageDates.size).toBe(0);
  });
});
