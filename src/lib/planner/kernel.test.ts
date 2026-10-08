import { describe, expect, it } from "vitest";
import type { Completion, Goal } from "@/lib/goals/types";
import { withLifetimeTargetBasisForTests } from "@/lib/goals/goal-test-fixtures";
import {
  runPlannerKernel,
  PlannerError,
  type PlannerKernelInput,
} from "@/lib/planner/kernel";
import { createDefaultPlannerPolicy } from "@/lib/planner/policy";
import { computeRequirementFingerprint } from "@/lib/planner/requirements";
import { toKernelWindow } from "@/lib/planner/dates";

function goal(overrides: Partial<Goal> = {}): Goal {
  const built = {
    id: "goal-a",
    owner_id: "owner-a",
    title: "Practice",
    description: null,
    category: "Personal",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 3,
    milestone_names: null,
    start_date: "2026-08-01",
    end_date: "2026-08-31",
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
  return withLifetimeTargetBasisForTests(built as Goal, overrides);
}

function input(overrides: Partial<PlannerKernelInput> = {}): PlannerKernelInput {
  return {
    schemaVersion: "1",
    eligibilityMode: "overlap_v1",
    ownerId: "owner-a",
    ...toKernelWindow("2026-08"),
    asOfDate: "2026-08-05",
    timezone: "UTC",
    goals: [goal()],
    completions: [],
    links: [],
    policy: createDefaultPlannerPolicy(
      "UTC",
      "2026-08-01T00:00:00Z"
    ),
    basePlan: null,
    ...overrides,
  };
}

describe("pure planner kernel", () => {
  it("runs the overlap pipeline deterministically", () => {
    const first = runPlannerKernel(input());
    const second = runPlannerKernel(input({ goals: [...input().goals] }));

    expect(first.generationInputHash).toBe(second.generationInputHash);
    expect(first.solver).toMatchObject({
      placementStatus: "complete",
      searchStatus: "all_units_placed",
      publishable: true,
    });
    expect(first.workUnits.map((unit) => unit.unitKey)).toEqual([
      "total:1",
      "total:2",
      "total:3",
    ]);
    expect(first.validation.valid).toBe(true);
  });

  it("solves a multi-month window in one kernel call", () => {
    const cadenceGoal = goal({
      target_count: null,
      start_date: "2026-08-01",
      end_date: "2026-09-30",
    });
    const august = runPlannerKernel(
      input({
        ...toKernelWindow("2026-08"),
        goals: [cadenceGoal],
      })
    );
    const window = runPlannerKernel(
      input({
        startDate: "2026-08-01",
        endDate: "2026-09-30",
        goals: [cadenceGoal],
      })
    );

    expect(window.workUnits.length).toBeGreaterThan(august.workUnits.length);
    expect(
      window.workUnits.some((unit) => unit.unitKey.includes("2026-09"))
    ).toBe(true);
  });

  it("places six milestones proportionally across a two-month lifetime", () => {
    const milestoneGoal = goal({
      id: "goal-milestone",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 6,
      milestone_names: ["One", "Two", "Three", "Four", "Five", "Six"],
      start_date: "2026-08-01",
      end_date: "2026-09-30",
    });
    const output = runPlannerKernel(
      input({
        startDate: "2026-08-01",
        endDate: "2026-09-30",
        asOfDate: "2026-08-01",
        goals: [milestoneGoal],
      })
    );

    expect(
      output.workUnits.map((unit) => unit.scheduledDate?.slice(0, 7))
    ).toEqual([
      "2026-08",
      "2026-08",
      "2026-08",
      "2026-09",
      "2026-09",
      "2026-09",
    ]);
  });

  it("keeps partial-month ordinal ownership identical across monthly and combined runs", () => {
    const partialLifetimeGoal = goal({
      id: "goal-partial-lifetime",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 4,
      milestone_names: ["One", "Two", "Three", "Four"],
      start_date: "2026-08-25",
      end_date: "2026-10-05",
    });
    const combined = runPlannerKernel(
      input({
        startDate: "2026-08-01",
        endDate: "2026-10-31",
        asOfDate: "2026-08-25",
        goals: [partialLifetimeGoal],
      })
    );
    const monthlyUnion = ["2026-08", "2026-09", "2026-10"]
      .flatMap((scopeMonth) =>
        runPlannerKernel(
          input({
            ...toKernelWindow(scopeMonth),
            asOfDate: "2026-08-25",
            goals: [partialLifetimeGoal],
          })
        ).workUnits
      )
      .sort((left, right) => left.ordinal - right.ordinal);

    expect(
      monthlyUnion.map((unit) => [unit.unitKey, unit.scheduledDate])
    ).toEqual(
      combined.workUnits.map((unit) => [unit.unitKey, unit.scheduledDate])
    );
  });

  it("produces identical assignments for identical fresh runs", () => {
    const runA = runPlannerKernel(input());
    const runB = runPlannerKernel(input());

    expect(runA.solver.assignments).toEqual(runB.solver.assignments);
  });

  it("does not move one goal when another goal is added", () => {
    const firstGoal = goal({ id: "goal-a", target_count: 5 });
    const secondGoal = goal({ id: "goal-b", target_count: 5 });
    const before = runPlannerKernel(input({ goals: [firstGoal] }));
    const after = runPlannerKernel(
      input({ goals: [firstGoal, secondGoal] })
    );
    const firstGoalDatesBefore = before.workUnits
      .filter((unit) => unit.originalGoalId === firstGoal.id)
      .map((unit) => unit.scheduledDate);
    const firstGoalDatesAfterAddingSecondGoal = after.workUnits
      .filter((unit) => unit.originalGoalId === firstGoal.id)
      .map((unit) => unit.scheduledDate);

    expect(firstGoalDatesAfterAddingSecondGoal).toEqual(
      firstGoalDatesBefore
    );
  });

  it("does not inflate planned ordinal totals when toggling months", () => {
    const longGoal = goal({
      target_count: 9,
      start_date: "2026-08-01",
      end_date: "2026-10-31",
    });
    const monthOutputs = ["2026-08", "2026-09", "2026-10"].map((scopeMonth) =>
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow(scopeMonth),
          asOfDate: "2026-08-05",
          goals: [longGoal],
        })
      )
    );
    const allUnitKeys = monthOutputs.flatMap((output) =>
      output.workUnits.map((unit) => unit.unitKey)
    );
    const uniqueUnitKeys = new Set(allUnitKeys);

    expect(allUnitKeys).toHaveLength(longGoal.target_count ?? 0);
    expect(uniqueUnitKeys.size).toBe(longGoal.target_count);
    expect(
      Math.max(...monthOutputs.map((output) => output.workUnits.length))
    ).toBeLessThan(longGoal.target_count ?? 0);
  });

  it("emits horizon summary using the same ordinal partition source", () => {
    const longGoal = goal({
      target_count: 9,
      start_date: "2026-08-01",
      end_date: "2026-10-31",
    });
    const output = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-09"),
        asOfDate: "2026-08-05",
        goals: [longGoal],
      })
    );

    expect(output.horizonSummary).toHaveLength(1);
    const summary = output.horizonSummary[0];
    expect(summary.goalId).toBe(longGoal.id);
    expect(summary.totalCount).toBe(longGoal.target_count);
    expect(
      summary.months.reduce((count, month) => count + month.plannedCount, 0)
    ).toBe(longGoal.target_count);
    expect(summary.windowPlannedCount).toBe(output.workUnits.length);
  });

  it("redistributes elapsed ordinal obligations across remaining lifetime", () => {
    const longGoal = goal({
      target_count: 60,
      start_date: "2026-08-01",
      end_date: "2027-01-31",
    });
    const monthOutputs = ["2026-10", "2026-11", "2026-12", "2027-01"].map(
      (scopeMonth) =>
        runPlannerKernel(
          input({
            eligibilityMode: "overlap_v1",
            ...toKernelWindow(scopeMonth),
            asOfDate: "2026-10-15",
            goals: [longGoal],
          })
        )
    );
    const allUnitKeys = monthOutputs.flatMap((output) =>
      output.workUnits.map((unit) => unit.unitKey)
    );

    expect(allUnitKeys).toHaveLength(longGoal.target_count ?? 0);
    expect(new Set(allUnitKeys).size).toBe(longGoal.target_count);
    expect(monthOutputs[0].workUnits.length).toBeGreaterThan(0);
  });

  it("keeps ordinal partitions stable when one month is regenerated from a published base plan", () => {
    const longGoal = goal({
      target_count: 12,
      start_date: "2026-08-01",
      end_date: "2026-10-31",
    });
    const augustPublished = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-08"),
        asOfDate: "2026-08-05",
        goals: [longGoal],
      })
    );
    const completionDates = augustPublished.workUnits
      .map((unit) => unit.scheduledDate)
      .filter((date): date is string => date !== null)
      .slice(0, 2);
    expect(completionDates).toHaveLength(2);
    const completions: Completion[] = completionDates.map((date, index) => ({
      id: `published-c${index + 1}`,
      goal_id: longGoal.id,
      user_id: longGoal.owner_id,
      completed_on: date,
      source: "manual",
      created_at: `${date}T12:00:00Z`,
    }));
    const augustBasePlan = {
      planId: "plan-aug-1",
      version: 1,
      assignments: augustPublished.workUnits.map((unit) => ({
        goalId: unit.originalGoalId,
        requirementFingerprint: unit.requirementFingerprint,
        unitKey: unit.unitKey,
        scheduledDate: unit.scheduledDate,
        locked: unit.locked,
      })),
      completionToUnit: augustPublished.completionToUnit,
      issueCodes: augustPublished.solver.issueCodes,
    };
    const monthOutputs = [
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-09-10",
          goals: [longGoal],
          completions,
          basePlan: augustBasePlan,
        })
      ),
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow("2026-09"),
          asOfDate: "2026-09-10",
          goals: [longGoal],
          completions,
          basePlan: augustBasePlan,
        })
      ),
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow("2026-10"),
          asOfDate: "2026-09-10",
          goals: [longGoal],
          completions,
          basePlan: augustBasePlan,
        })
      ),
    ];
    const allUnitKeys = monthOutputs.flatMap((output) =>
      output.workUnits.map((unit) => unit.unitKey)
    );
    const expectedUnitKeys = Array.from(
      { length: longGoal.target_count ?? 0 },
      (_, index) => `total:${index + 1}`
    );

    expect(allUnitKeys).toHaveLength(longGoal.target_count ?? 0);
    expect(new Set(allUnitKeys).size).toBe(longGoal.target_count);
    expect(new Set(allUnitKeys)).toEqual(new Set(expectedUnitKeys));
  });

  it("allocates a persisted uncredited ordinal only to its scheduled month", () => {
    const milestoneGoal = goal({
      id: "goal-milestone",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 6,
      milestone_names: ["One", "Two", "Three", "Four", "Five", "Six"],
      start_date: "2026-08-01",
      end_date: "2026-09-30",
    });
    const output = runPlannerKernel(
      input({
        ...toKernelWindow("2026-08"),
        asOfDate: "2026-08-01",
        goals: [milestoneGoal],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: milestoneGoal.id,
              requirementFingerprint:
                computeRequirementFingerprint(milestoneGoal),
              unitKey: "milestone:1",
              scheduledDate: "2026-09-15",
              locked: false,
            },
          ],
        },
      })
    );

    expect(output.workUnits.map((unit) => unit.unitKey)).not.toContain(
      "milestone:1"
    );
    expect(output.horizonSummary[0]?.months).toEqual([
      { month: "2026-08", plannedCount: 2 },
      { month: "2026-09", plannedCount: 4 },
    ]);
  });

  it("uses proportional ownership within a constrained partial first month", () => {
    const constrainedStartGoal = goal({
      target_count: 60,
      start_date: "2026-08-20",
      end_date: "2026-10-31",
    });
    const monthOutputs = ["2026-08", "2026-09", "2026-10"].map((scopeMonth) =>
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow(scopeMonth),
          asOfDate: "2026-08-20",
          goals: [constrainedStartGoal],
        })
      )
    );
    const allUnitKeys = monthOutputs.flatMap((output) =>
      output.workUnits.map((unit) => unit.unitKey)
    );

    expect(allUnitKeys).toHaveLength(constrainedStartGoal.target_count ?? 0);
    expect(new Set(allUnitKeys).size).toBe(constrainedStartGoal.target_count);
    expect(monthOutputs.map((output) => output.workUnits.length)).toEqual([
      10, 25, 25,
    ]);
  });

  it("marks ordinal goals with oversized horizons as ineligible", () => {
    const oversizedHorizonGoal = goal({
      target_count: 48,
      start_date: "2026-01-01",
      end_date: "2028-12-31",
    });
    const output = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-08"),
        asOfDate: "2026-08-05",
        goals: [oversizedHorizonGoal],
      })
    );

    expect(output.eligibility).toContainEqual({
      goalId: oversizedHorizonGoal.id,
      eligible: false,
      reason: "horizon_too_long",
    });
    expect(output.workUnits).toHaveLength(0);
  });

  it("marks cadence goals with oversized bounded horizons as ineligible", () => {
    const oversizedCadenceGoal = goal({
      id: "goal-cadence-overlong",
      recurrence_interval: "weekly",
      target_count: null,
      start_date: "2026-01-01",
      end_date: "2028-12-31",
    });
    const output = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-08"),
        asOfDate: "2026-08-05",
        goals: [oversizedCadenceGoal],
      })
    );

    expect(output.eligibility).toContainEqual({
      goalId: oversizedCadenceGoal.id,
      eligible: false,
      reason: "horizon_too_long",
    });
    expect(output.workUnits).toHaveLength(0);
  });

  it("supports open-ended cadence goals without synthetic horizons", () => {
    const openCadenceGoal = goal({
      id: "goal-cadence-open-ended",
      recurrence_interval: "weekly",
      target_count: null,
      start_date: "2026-07-15",
      end_date: null,
    });
    const output = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-08"),
        asOfDate: "2026-08-05",
        goals: [openCadenceGoal],
      })
    );

    expect(output.eligibility).toContainEqual({
      goalId: openCadenceGoal.id,
      eligible: true,
      reason: "eligible",
    });
    expect(output.workUnits.length).toBeGreaterThan(0);
    expect(output.workUnits.every((unit) => unit.kind === "cadence")).toBe(true);
    expect(output.horizonSummary).toEqual([]);
  });

  it("ignores legacy monthly distribution hints and partitions ordinals deterministically", () => {
    const distributedGoal = goal({
      target_count: 12,
      start_date: "2026-08-01",
      end_date: "2026-10-31",
    });
    const policy = createDefaultPlannerPolicy("UTC", "2026-08-01T00:00:00Z");
    const monthOutputs = ["2026-08", "2026-09", "2026-10"].map((scopeMonth) =>
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow(scopeMonth),
          asOfDate: "2026-08-05",
          goals: [distributedGoal],
          policy,
        })
      )
    );

    expect(monthOutputs.map((output) => output.workUnits.length)).toEqual([4, 4, 4]);
    const unitKeys = monthOutputs.flatMap((output) =>
      output.workUnits.map((unit) => unit.unitKey)
    );
    expect(new Set(unitKeys).size).toBe(distributedGoal.target_count);
  });

  it("carries and spills deterministically when an early month is elapsed", () => {
    const distributedGoal = goal({
      target_count: 12,
      start_date: "2026-08-01",
      end_date: "2026-10-31",
    });
    const policy = createDefaultPlannerPolicy("UTC", "2026-08-01T00:00:00Z");
    const september = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-09"),
        asOfDate: "2026-09-10",
        goals: [distributedGoal],
        policy,
      })
    );
    const october = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-10"),
        asOfDate: "2026-09-10",
        goals: [distributedGoal],
        policy,
      })
    );

    expect(september.workUnits.length).toBe(8);
    expect(october.workUnits.length).toBe(4);
    const unitKeys = [...september.workUnits, ...october.workUnits].map(
      (unit) => unit.unitKey
    );
    expect(new Set(unitKeys).size).toBe(distributedGoal.target_count);
  });

  it("keeps distributed ordinal ownership unique with credited completions", () => {
    const distributedGoal = goal({
      target_count: 12,
      start_date: "2026-08-01",
      end_date: "2026-10-31",
    });
    const completions: Completion[] = Array.from({ length: 6 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return {
        id: `completion-${index + 1}`,
        goal_id: distributedGoal.id,
        user_id: distributedGoal.owner_id,
        completed_on: `2026-08-${day}`,
        source: "manual",
        created_at: `2026-08-${day}T00:00:00Z`,
      };
    });
    const policy = createDefaultPlannerPolicy("UTC", "2026-08-01T00:00:00Z");
    const monthOutputs = ["2026-08", "2026-09", "2026-10"].map((scopeMonth) =>
      runPlannerKernel(
        input({
          eligibilityMode: "overlap_v1",
          ...toKernelWindow(scopeMonth),
          asOfDate: "2026-09-10",
          goals: [distributedGoal],
          completions,
          policy,
        })
      )
    );
    const allUnitKeys = monthOutputs.flatMap((output) =>
      output.workUnits.map((unit) => unit.unitKey)
    );

    expect(allUnitKeys).toHaveLength(distributedGoal.target_count ?? 0);
    expect(new Set(allUnitKeys).size).toBe(distributedGoal.target_count);
    expect(new Set(allUnitKeys)).toEqual(
      new Set(
        Array.from({ length: distributedGoal.target_count ?? 0 }, (_, index) =>
          `total:${index + 1}`
        )
      )
    );
  });

  it("does not credit early milestone completions into a later-month slice", () => {
    const milestoneGoal = goal({
      id: "goal-milestone",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 6,
      milestone_names: ["One", "Two", "Three", "Four", "Five", "Six"],
      start_date: "2026-08-01",
      end_date: "2026-09-30",
    });
    const completions: Completion[] = [
      {
        id: "c1",
        goal_id: milestoneGoal.id,
        user_id: milestoneGoal.owner_id,
        completed_on: "2026-08-03",
        source: "manual",
        created_at: "2026-08-03T12:00:00Z",
      },
      {
        id: "c2",
        goal_id: milestoneGoal.id,
        user_id: milestoneGoal.owner_id,
        completed_on: "2026-08-05",
        source: "manual",
        created_at: "2026-08-05T12:00:00Z",
      },
      {
        id: "c3",
        goal_id: milestoneGoal.id,
        user_id: milestoneGoal.owner_id,
        completed_on: "2026-08-07",
        source: "manual",
        created_at: "2026-08-07T12:00:00Z",
      },
    ];
    const output = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-09"),
        asOfDate: "2026-09-10",
        goals: [milestoneGoal],
        completions,
      })
    );

    expect(output.workUnits.map((unit) => unit.unitKey)).toEqual([
      "milestone:4",
      "milestone:5",
      "milestone:6",
    ]);
    expect(output.workUnits.every((unit) => unit.creditedCompletionId === null)).toBe(
      true
    );
  });

  it("does not credit early deadline completions into a later-month slice", () => {
    const deadlineGoal = goal({
      id: "goal-deadline",
      target_count: 20,
      recurrence_interval: "daily",
      start_date: "2026-08-01",
      end_date: "2026-09-30",
    });
    const completions: Completion[] = Array.from({ length: 10 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return {
        id: `c${index + 1}`,
        goal_id: deadlineGoal.id,
        user_id: deadlineGoal.owner_id,
        completed_on: `2026-08-${day}`,
        source: "manual",
        created_at: `2026-08-${day}T12:00:00Z`,
      };
    });
    const output = runPlannerKernel(
      input({
        eligibilityMode: "overlap_v1",
        ...toKernelWindow("2026-09"),
        asOfDate: "2026-09-10",
        goals: [deadlineGoal],
        completions,
      })
    );

    expect(output.workUnits.map((unit) => unit.unitKey)).toEqual([
      "total:11",
      "total:12",
      "total:13",
      "total:14",
      "total:15",
      "total:16",
      "total:17",
      "total:18",
      "total:19",
      "total:20",
    ]);
    expect(output.workUnits.every((unit) => unit.creditedCompletionId === null)).toBe(
      true
    );
  });

  it.each(["2026-07-31", "2026-08-31", "2026-12-31", null])(
    "keeps linked target placement independent of source end %s",
    (endDate) => {
      const target = goal({ id: "target", target_count: 3 });
      const source = goal({ id: "source", start_date: "2026-07-01", end_date: endDate });
      const unlinked = runPlannerKernel(input({ goals: [target, source] }));
      const linked = runPlannerKernel(input({ goals: [target, source], links: [{ sourceGoalId: source.id, targetGoalId: target.id }] }));
      expect(linked.eligibility).toEqual(unlinked.eligibility);
      expect(linked.workUnits).toEqual(unlinked.workUnits);
      expect(linked.solver.assignments).toEqual(unlinked.solver.assignments);
      expect(linked.workUnits.filter((unit) => unit.originalGoalId === target.id)).toHaveLength(3);
    }
  );

  it("keeps every target in a transitive link chain independently eligible", () => {
    const goals = ["a", "b", "c"].map((id) => goal({ id, target_count: 2 }));
    const output = runPlannerKernel(input({ goals, links: [
      { sourceGoalId: "a", targetGoalId: "b" },
      { sourceGoalId: "b", targetGoalId: "c" },
    ] }));
    expect(output.eligibility.every((entry) => entry.eligible)).toBe(true);
    for (const id of ["a", "b", "c"]) {
      expect(output.workUnits.filter((unit) => unit.originalGoalId === id)).toHaveLength(2);
    }
  });

  it("credits actual cascaded completions without treating source facts as target facts", () => {
    const target = goal({ id: "target", target_count: 3 });
    const source = goal({ id: "source", target_count: 3 });
    const sourceFact: Completion = { id: "source-fact", goal_id: source.id, user_id: "owner-a", completed_on: "2026-08-04", source: "manual", created_at: "2026-08-04T00:00:00Z" };
    const config = input({ goals: [source, target], links: [{ sourceGoalId: source.id, targetGoalId: target.id }] });
    const sourceOnly = runPlannerKernel({ ...config, completions: [sourceFact] });
    expect(sourceOnly.workUnits.filter((unit) => unit.originalGoalId === target.id && unit.creditState !== "uncredited")).toHaveLength(0);
    const cascaded = runPlannerKernel({ ...config, completions: [sourceFact, { ...sourceFact, id: "target-fact", goal_id: target.id, source: "linked_cascade", planner_unit_key: "total:1" }] });
    expect(cascaded.workUnits.find((unit) => unit.originalGoalId === target.id && unit.unitKey === "total:1")).toMatchObject({ creditedCompletionId: "target-fact" });
  });

  it("honors locks that invert ordinal order", () => {
    const output = runPlannerKernel(
      input({
        goals: [goal({ target_count: 2 })],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: "goal-a",
              requirementFingerprint: computeRequirementFingerprint(
                goal({ target_count: 2 })
              ),
              unitKey: "total:1",
              scheduledDate: "2026-08-10",
              locked: true,
            },
            {
              goalId: "goal-a",
              requirementFingerprint: computeRequirementFingerprint(
                goal({ target_count: 2 })
              ),
              unitKey: "total:2",
              scheduledDate: "2026-08-05",
              locked: true,
            },
          ],
        },
      })
    );

    // Ordinal is identity, not sequence: total:1 may legitimately sit after
    // total:2.
    expect(output.solver.issueCodes).toEqual([]);
    expect(output.solver.publishable).toBe(true);
    expect(output.validation.valid).toBe(true);
    expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
      "2026-08-10",
      "2026-08-05",
    ]);
    expect(output.diff.some((entry) => entry.kind === "moved")).toBe(false);
  });

  describe("preserve-mode past placements when asOfDate advances", () => {
    it("keeps a preserved assignment before the placement window without invalid_lock", () => {
      const currentGoal = goal({
        target_count: 1,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: true,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: "2026-08-05",
                locked: false,
              },
            ],
          },
        })
      );

      expect(output.solver.issueCodes).not.toContain("invalid_lock");
      expect(output.solver.publishable).toBe(true);
      expect(output.validation.valid).toBe(true);
      expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
        "2026-08-05",
      ]);
    });

    it("re-places that past assignment when preserve mode is off", () => {
      const currentGoal = goal({
        target_count: 1,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: false,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: "2026-08-05",
                locked: false,
              },
            ],
          },
        })
      );

      expect(output.solver.issueCodes).not.toContain("invalid_lock");
      expect(output.validation.valid).toBe(true);
      expect(output.workUnits[0]?.scheduledDate).not.toBe("2026-08-05");
      expect(output.workUnits[0]?.scheduledDate).not.toBeNull();
      expect(output.workUnits[0]!.scheduledDate! >= "2026-08-20").toBe(true);
    });

    it("keeps a past preserved unit while still placing a later sibling", () => {
      const currentGoal = goal({
        target_count: 2,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const fingerprint = computeRequirementFingerprint(currentGoal);
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: true,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint: fingerprint,
                unitKey: "total:1",
                scheduledDate: "2026-08-05",
                locked: false,
              },
              {
                goalId: currentGoal.id,
                requirementFingerprint: fingerprint,
                unitKey: "total:2",
                scheduledDate: "2026-08-25",
                locked: false,
              },
            ],
          },
        })
      );

      expect(output.solver.issueCodes).toEqual([]);
      expect(output.validation.valid).toBe(true);
      expect(
        output.workUnits.map((unit) => [unit.unitKey, unit.scheduledDate])
      ).toEqual([
        ["total:1", "2026-08-05"],
        ["total:2", "2026-08-25"],
      ]);
    });

    it("still soft-locks preserved dates that remain inside the window", () => {
      const currentGoal = goal({
        target_count: 1,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: true,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: "2026-08-25",
                locked: false,
              },
            ],
          },
        })
      );

      expect(output.solver.issueCodes).toEqual([]);
      expect(output.validation.valid).toBe(true);
      expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
        "2026-08-25",
      ]);
      expect(output.diff.some((entry) => entry.kind === "moved")).toBe(false);
    });

    it("still reports invalid_lock for a hard lock before the placement window", () => {
      const currentGoal = goal({
        target_count: 1,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: true,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: "2026-08-05",
                locked: true,
              },
            ],
          },
        })
      );

      expect(output.solver.searchStatus).toBe("blocked_invalid_lock");
      expect(output.solver.issueCodes).toContain("invalid_lock");
      expect(output.solver.invalidGoalIds).toEqual([currentGoal.id]);
      expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
        "2026-08-05",
      ]);
    });

    it("still reports invalid_lock when a draft pin targets a pre-window date", () => {
      const currentGoal = goal({
        target_count: 1,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: true,
          draftPinnedDates: { "goal-a:total:1": "2026-08-05" },
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: "2026-08-05",
                locked: false,
              },
            ],
          },
        })
      );

      expect(output.solver.searchStatus).toBe("blocked_invalid_lock");
      expect(output.solver.issueCodes).toContain("invalid_lock");
    });

    it("honors a draft pin that moves a past preserved unit into the window", () => {
      const currentGoal = goal({
        target_count: 1,
        start_date: "2026-08-01",
        end_date: "2026-08-31",
      });
      const output = runPlannerKernel(
        input({
          ...toKernelWindow("2026-08"),
          asOfDate: "2026-08-20",
          goals: [currentGoal],
          preserveExistingAssignments: true,
          draftPinnedDates: { "goal-a:total:1": "2026-08-22" },
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: "2026-08-05",
                locked: false,
              },
            ],
          },
        })
      );

      expect(output.solver.issueCodes).toEqual([]);
      expect(output.validation.valid).toBe(true);
      expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
        "2026-08-22",
      ]);
    });
  });

  it("emits a usable unaffected-goal diff beside a colliding lock", () => {
    const invalidGoal = goal({ target_count: 2 });
    const unaffectedGoal = goal({ id: "goal-b", target_count: 1 });
    const invalidFingerprint =
      computeRequirementFingerprint(invalidGoal);
    const output = runPlannerKernel(
      input({
        goals: [invalidGoal, unaffectedGoal],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: invalidGoal.id,
              requirementFingerprint: invalidFingerprint,
              unitKey: "total:1",
              scheduledDate: "2026-08-10",
              locked: true,
            },
            {
              goalId: invalidGoal.id,
              requirementFingerprint: invalidFingerprint,
              unitKey: "total:2",
              scheduledDate: "2026-08-10",
              locked: true,
            },
          ],
        },
      })
    );

    expect(output.solver.searchStatus).toBe("blocked_invalid_lock");
    expect(output.solver.invalidGoalIds).toEqual(["goal-a"]);
    expect(
      output.workUnits.find(
        (unit) => unit.originalGoalId === "goal-b"
      )?.scheduledDate
    ).not.toBeNull();
    expect(
      output.diff.some(
        (entry) => entry.kind === "added" && entry.goalId === "goal-b"
      )
    ).toBe(true);
  });

  it("reserves fulfilled scheduled dates during open-unit placement", () => {
    const shortGoal = goal({ target_count: 2, end_date: "2026-08-06" });
    const fingerprint = computeRequirementFingerprint(shortGoal);
    const fact: Completion = {
      id: "completion-a",
      goal_id: shortGoal.id,
      user_id: shortGoal.owner_id,
      completed_on: "2026-08-05",
      source: "manual",
      created_at: "2026-08-05T12:00:00Z",
    };
    const output = runPlannerKernel(
      input({
        goals: [shortGoal],
        completions: [fact],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: shortGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "total:1",
              scheduledDate: "2026-08-05",
              locked: false,
            },
            {
              goalId: shortGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "total:2",
              scheduledDate: null,
              locked: false,
            },
          ],
          completionToUnit: {
            [fact.id]: {
              goalId: shortGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "total:1",
              completedOn: fact.completed_on,
            },
          },
        },
      })
    );

    expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
      "2026-08-05",
      "2026-08-06",
    ]);
    expect(output.validation.valid).toBe(true);
  });

  it("reserves canonical completion dates without a prior schedule", () => {
    const shortGoal = goal({ target_count: 2, end_date: "2026-08-06" });
    const fact: Completion = {
      id: "completion-a",
      goal_id: shortGoal.id,
      user_id: shortGoal.owner_id,
      completed_on: "2026-08-05",
      source: "manual",
      created_at: "2026-08-05T12:00:00Z",
    };
    const output = runPlannerKernel(
      input({
        goals: [shortGoal],
        completions: [fact],
      })
    );

    expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
      null,
      "2026-08-06",
    ]);
    expect(output.validation.valid).toBe(true);
  });

  it("recomputes effective local timestamps after solver date changes", () => {
    const shortGoal = goal({ target_count: 1, end_date: "2026-08-06" });
    const fingerprint = computeRequirementFingerprint(shortGoal);
    const output = runPlannerKernel(
      input({
        goals: [shortGoal],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: shortGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "total:1",
              scheduledDate: "2026-08-10",
              locked: false,
              scheduledTimeOverride: "19:30",
            },
          ],
        },
      })
    );

    expect(output.workUnits).toHaveLength(1);
    const unit = output.workUnits[0];
    expect(unit.scheduledDate).not.toBe("2026-08-10");
    expect(unit.scheduledTimeOverride).toBe("19:30");
    expect(unit.effectiveScheduledAtLocal).toBe(
      unit.scheduledDate ? `${unit.scheduledDate}T19:30:00` : null
    );
  });

  it("does not let an inadmissible future fact create false shortfall", () => {
    const shortGoal = goal({ target_count: 2, end_date: "2026-08-06" });
    const futureFact: Completion = {
      id: "future-completion",
      goal_id: shortGoal.id,
      user_id: shortGoal.owner_id,
      completed_on: "2026-08-06",
      source: "manual",
      created_at: "2026-08-05T12:00:00Z",
    };
    const output = runPlannerKernel(
      input({
        goals: [shortGoal],
        completions: [futureFact],
      })
    );

    expect(output.solver.placementStatus).toBe("complete");
    expect(output.workUnits.map((unit) => unit.scheduledDate)).toEqual([
      "2026-08-05",
      "2026-08-06",
    ]);
    expect(output.driftFacts).toContainEqual({
      completionId: futureFact.id,
      completedOn: futureFact.completed_on,
      driftType: "inadmissible",
    });
  });

  it("keeps daily cadence on a configured rest weekday", () => {
    const policy = createDefaultPlannerPolicy(
      "UTC",
      "2026-08-01T00:00:00Z"
    );
    policy.restWeekdays = [0];
    const dailyGoal = goal({
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_count: null,
      start_date: "2026-08-02",
      end_date: "2026-08-02",
    });
    const output = runPlannerKernel(
      input({
        asOfDate: "2026-08-02",
        goals: [dailyGoal],
        policy,
      })
    );

    expect(output.workUnits).toHaveLength(1);
    expect(output.workUnits[0]).toMatchObject({
      restEligible: false,
      scheduledDate: "2026-08-02",
    });
  });

  it("reports historical obligation classifications as informational issues", () => {
    const historicalTotal = runPlannerKernel(
      input({
        asOfDate: "2026-09-01",
        goals: [goal({ target_count: 1 })],
      })
    );
    expect(historicalTotal.solver.issueCodes).toContain(
      "historical_shortfall"
    );

    const cadenceGoal = goal({
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: null,
      start_date: "2026-08-01",
    });
    const cadence = runPlannerKernel(
      input({
        asOfDate: "2026-08-12",
        goals: [cadenceGoal],
      })
    );
    expect(cadence.solver.issueCodes).toContain("historical_miss");
  });

  it("keeps an uncredited one-day milestone on its past date after the deadline", () => {
    const overdueMilestone = goal({
      id: "goal-one-day",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 1,
      milestone_names: ["Only"],
      start_date: "2026-08-30",
      end_date: "2026-08-30",
    });
    const fingerprint = computeRequirementFingerprint(overdueMilestone);
    const output = runPlannerKernel(
      input({
        startDate: "2026-08-01",
        endDate: "2026-09-30",
        asOfDate: "2026-08-31",
        goals: [overdueMilestone],
        preserveExistingAssignments: true,
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: overdueMilestone.id,
              requirementFingerprint: fingerprint,
              unitKey: "milestone:1",
              scheduledDate: "2026-08-30",
              locked: false,
            },
          ],
        },
      })
    );

    expect(output.validation.valid).toBe(true);
    expect(output.workUnits[0]).toMatchObject({
      classification: "historical_shortfall",
      scheduledDate: "2026-08-30",
      creditState: "uncredited",
    });
    expect(output.solver.issueCodes).toContain("historical_shortfall");
  });

  it("credits cadence completions to the latest open past session before a future slot", () => {
    const cadenceGoal = goal({
      id: "goal-monthly-cadence",
      recurrence_interval: "monthly",
      target_count: 4,
      target_basis: "period",
      start_date: "2026-08-01",
      end_date: "2026-08-31",
    });
    const fingerprint = computeRequirementFingerprint(cadenceGoal);
    const completions: Completion[] = [
      {
        id: "completion-1",
        goal_id: cadenceGoal.id,
        user_id: cadenceGoal.owner_id,
        completed_on: "2026-08-07",
        source: "manual",
        created_at: "2026-08-07T12:00:00Z",
      },
      {
        id: "completion-2",
        goal_id: cadenceGoal.id,
        user_id: cadenceGoal.owner_id,
        completed_on: "2026-08-14",
        source: "manual",
        created_at: "2026-08-14T12:00:00Z",
      },
      {
        id: "completion-3",
        goal_id: cadenceGoal.id,
        user_id: cadenceGoal.owner_id,
        completed_on: "2026-08-27",
        source: "manual",
        created_at: "2026-08-27T12:00:00Z",
      },
    ];
    const output = runPlannerKernel(
      input({
        asOfDate: "2026-08-27",
        goals: [cadenceGoal],
        completions,
        preserveExistingAssignments: true,
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: cadenceGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "cadence:2026-08-01:1",
              scheduledDate: "2026-08-07",
              locked: false,
            },
            {
              goalId: cadenceGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "cadence:2026-08-01:2",
              scheduledDate: "2026-08-14",
              locked: false,
            },
            {
              goalId: cadenceGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "cadence:2026-08-01:3",
              scheduledDate: "2026-08-28",
              locked: false,
            },
            {
              goalId: cadenceGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "cadence:2026-08-01:4",
              scheduledDate: "2026-08-20",
              locked: false,
            },
          ],
          completionToUnit: {},
        },
      })
    );

    const slot3 = output.workUnits.find(
      (unit) => unit.unitKey === "cadence:2026-08-01:3"
    );
    const slot4 = output.workUnits.find(
      (unit) => unit.unitKey === "cadence:2026-08-01:4"
    );
    expect(slot4?.creditedCompletionId).toBe("completion-3");
    expect(slot3?.creditedCompletionId).toBeNull();
  });

  it("lets an earlier open total roll after a later fulfilled ordinal", () => {
    const rollingGoal = goal({ target_count: 2, end_date: "2026-08-06" });
    const fingerprint = computeRequirementFingerprint(rollingGoal);
    const fact: Completion = {
      id: "completion-a",
      goal_id: rollingGoal.id,
      user_id: rollingGoal.owner_id,
      completed_on: "2026-08-05",
      source: "manual",
      created_at: "2026-08-05T12:00:00Z",
    };
    const output = runPlannerKernel(
      input({
        goals: [rollingGoal],
        completions: [fact],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: rollingGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "total:2",
              scheduledDate: "2026-08-05",
              locked: false,
            },
          ],
          completionToUnit: {},
        },
      })
    );

    expect(
      output.workUnits.map((unit) => [
        unit.unitKey,
        unit.classification,
        unit.scheduledDate,
      ])
    ).toEqual([
      ["total:1", "open", "2026-08-06"],
      ["total:2", "fulfilled", "2026-08-05"],
    ]);
    expect(output.validation.valid).toBe(true);
  });

  it("marks oversized targeted goals ineligible before allocating work units", () => {
    const oversizedGoal = goal({ target_count: 1_001 });
    const output = runPlannerKernel(input({ goals: [oversizedGoal] }));

    expect(
      output.eligibility.find((entry) => entry.goalId === oversizedGoal.id)
    ).toMatchObject({
      eligible: false,
      reason: "target_exceeds_limit",
    });
    expect(output.workUnits).toHaveLength(0);
  });

  it("marks oversized fixed milestone goals ineligible before label materialization", () => {
    const oversizedGoal = goal({
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 1_001,
    });
    const output = runPlannerKernel(input({ goals: [oversizedGoal] }));

    expect(
      output.eligibility.find((entry) => entry.goalId === oversizedGoal.id)
    ).toMatchObject({
      eligible: false,
      reason: "target_exceeds_limit",
    });
    expect(output.workUnits).toHaveLength(0);
  });

  it("rejects a locked base assignment without a date at the contract", () => {
    const currentGoal = goal({ target_count: 1 });
    expect(() =>
      runPlannerKernel(
        input({
          goals: [currentGoal],
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: currentGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(currentGoal),
                unitKey: "total:1",
                scheduledDate: null,
                locked: true,
              },
            ],
          },
        })
      )
    ).toThrow(PlannerError);
  });

  it("does not reuse assignments across a material requirement lineage", () => {
    const previousGoal = goal({ target_count: 2 });
    const currentGoal = goal({ target_count: 3 });
    const output = runPlannerKernel(
      input({
        goals: [currentGoal],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [
            {
              goalId: previousGoal.id,
              requirementFingerprint:
                computeRequirementFingerprint(previousGoal),
              unitKey: "total:1",
              scheduledDate: "2026-08-10",
              locked: true,
            },
          ],
          completionToUnit: {},
        },
      })
    );

    expect(
      output.diff.some(
        (entry) =>
          entry.kind === "removed" &&
          entry.requirementFingerprint ===
            computeRequirementFingerprint(previousGoal)
      )
    ).toBe(true);
    expect(
      output.diff.some(
        (entry) =>
          entry.kind === "added" &&
          entry.requirementFingerprint ===
            computeRequirementFingerprint(currentGoal)
      )
    ).toBe(true);
  });

  it("preserves an existing completion allocation when an earlier fact appears", () => {
    const milestoneGoal = goal({
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 2,
      milestone_names: ["First", "Second"],
    });
    const fingerprint = computeRequirementFingerprint(milestoneGoal);
    const later: Completion = {
      id: "later",
      goal_id: milestoneGoal.id,
      user_id: milestoneGoal.owner_id,
      completed_on: "2026-08-10",
      source: "manual",
      created_at: "2026-08-10T12:00:00Z",
    };
    const earlier: Completion = {
      ...later,
      id: "earlier",
      completed_on: "2026-08-05",
      created_at: "2026-08-05T12:00:00Z",
    };
    const output = runPlannerKernel(
      input({
        asOfDate: "2026-08-20",
        goals: [milestoneGoal],
        completions: [later, earlier],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [],
          completionToUnit: {
            later: {
              goalId: milestoneGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "milestone:1",
              completedOn: later.completed_on,
            },
          },
        },
      })
    );

    expect(output.completionToUnit.later?.unitKey).toBe("milestone:1");
    expect(output.completionToUnit.earlier?.unitKey).toBe("milestone:2");
    expect(output.driftFacts).not.toContainEqual(
      expect.objectContaining({
        completionId: "later",
        driftType: "credited_work_reassigned",
      })
    );
  });

  it("surfaces removal of a previously credited completion", () => {
    const currentGoal = goal({ target_count: 1 });
    const fingerprint = computeRequirementFingerprint(currentGoal);
    const output = runPlannerKernel(
      input({
        goals: [currentGoal],
        completions: [],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [],
          completionToUnit: {
            removed: {
              goalId: currentGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "total:1",
              completedOn: "2026-08-04",
            },
          },
        },
      })
    );

    expect(output.driftFacts).toContainEqual({
      completionId: "removed",
      completedOn: "2026-08-04",
      driftType: "credited_work_removed",
    });
  });

  it("prefers a durable completion allocation over stale preview allocation state", () => {
    const milestoneGoal = goal({
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 2,
      milestone_names: ["First", "Second"],
    });
    const fingerprint = computeRequirementFingerprint(milestoneGoal);
    const fact: Completion = {
      id: "completion-a",
      goal_id: milestoneGoal.id,
      user_id: milestoneGoal.owner_id,
      completed_on: "2026-08-10",
      source: "manual",
      planner_unit_key: "milestone:2",
      created_at: "2026-08-10T12:00:00Z",
    };
    const output = runPlannerKernel(
      input({
        asOfDate: "2026-08-20",
        goals: [milestoneGoal],
        completions: [fact],
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [],
          completionToUnit: {
            [fact.id]: {
              goalId: milestoneGoal.id,
              requirementFingerprint: fingerprint,
              unitKey: "milestone:1",
              completedOn: fact.completed_on,
            },
          },
        },
      })
    );

    expect(output.completionToUnit[fact.id]?.unitKey).toBe("milestone:2");
  });
});

describe("solve intent and draft pins", () => {
  it("keeps stable solves anchored to existing placement", () => {
    const stable = runPlannerKernel(input());

    expect(stable.solver.placementStatus).toBe("complete");
    expect(stable.workUnits.map((unit) => unit.scheduledDate)).toEqual([
      "2026-08-08",
      "2026-08-18",
      "2026-08-27",
    ]);
  });

  it("moves only the pinned unit and leaves the rest alone", () => {
    const before = runPlannerKernel(input());
    const pinned = runPlannerKernel(
      input({ draftPinnedDates: { "goal-a:total:1": "2026-08-20" } })
    );
    const beforeByKey = new Map(
      before.workUnits.map((unit) => [unit.unitKey, unit.scheduledDate])
    );
    const moved = pinned.workUnits.filter(
      (unit) => beforeByKey.get(unit.unitKey) !== unit.scheduledDate
    );

    expect(pinned.solver.placementStatus).toBe("complete");
    expect(moved.map((unit) => unit.unitKey)).toEqual(["total:1"]);
    expect(moved[0].scheduledDate).toBe("2026-08-20");
  });

  describe("recoverPastPlacements", () => {
    const milestoneGoal = goal({
      id: "goal-milestone",
      frequency_type: "fixed_milestones",
      recurrence_interval: null,
      target_count: 3,
      milestone_names: ["One", "Two", "Three"],
      start_date: "2026-08-01",
      end_date: "2026-09-30",
    });
    const strandedMilestone = (scheduledDate: string) => ({
      goalId: milestoneGoal.id,
      requirementFingerprint: computeRequirementFingerprint(milestoneGoal),
      unitKey: "milestone:1",
      scheduledDate,
      locked: false,
    });
    const milestoneInput = (
      overrides: Partial<PlannerKernelInput> = {}
    ): PlannerKernelInput =>
      input({
        startDate: "2026-08-01",
        endDate: "2026-09-30",
        asOfDate: "2026-08-20",
        goals: [milestoneGoal],
        preserveExistingAssignments: true,
        basePlan: {
          planId: "plan-a",
          version: 1,
          assignments: [strandedMilestone("2026-08-04")],
        },
        ...overrides,
      });

    const readMilestoneDate = (output: ReturnType<typeof runPlannerKernel>) =>
      output.workUnits.find((unit) => unit.unitKey === "milestone:1")
        ?.scheduledDate ?? null;

    it("holds an elapsed placement in place by default", () => {
      expect(readMilestoneDate(runPlannerKernel(milestoneInput()))).toBe(
        "2026-08-04"
      );
    });

    it("re-places an elapsed placement on or after today when recovering", () => {
      const recovered = readMilestoneDate(
        runPlannerKernel(milestoneInput({ recoverPastPlacements: true }))
      );
      expect(recovered).not.toBeNull();
      expect(recovered! >= "2026-08-20").toBe(true);
      expect(recovered! <= "2026-09-30").toBe(true);
    });

    it("is deterministic across runs", () => {
      expect(
        readMilestoneDate(
          runPlannerKernel(milestoneInput({ recoverPastPlacements: true }))
        )
      ).toBe(
        readMilestoneDate(
          runPlannerKernel(milestoneInput({ recoverPastPlacements: true }))
        )
      );
    });

    it("keeps every milestone on a distinct date after recovery", () => {
      const output = runPlannerKernel(
        milestoneInput({ recoverPastPlacements: true })
      );
      const dates = output.workUnits
        .map((unit) => unit.scheduledDate)
        .filter((date): date is string => date !== null);
      expect(dates).toHaveLength(3);
      expect(new Set(dates).size).toBe(3);
      expect(output.validation.valid).toBe(true);
    });

    it("leaves a credited elapsed placement where it was completed", () => {
      const output = runPlannerKernel(
        milestoneInput({
          recoverPastPlacements: true,
          completions: [
            {
              id: "completion-1",
              goal_id: milestoneGoal.id,
              user_id: "owner-a",
              completed_on: "2026-08-04",
              source: "manual",
              created_at: "2026-08-04T00:00:00Z",
            },
          ] satisfies Completion[],
        })
      );
      expect(readMilestoneDate(output)).toBe("2026-08-04");
    });

    it("leaves a lapsed cadence period missed instead of rolling it forward", () => {
      const cadenceGoal = goal({
        id: "goal-cadence",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: null,
        start_date: "2026-08-01",
        end_date: "2026-09-30",
      });
      const output = runPlannerKernel(
        input({
          startDate: "2026-08-01",
          endDate: "2026-09-30",
          asOfDate: "2026-08-20",
          goals: [cadenceGoal],
          preserveExistingAssignments: true,
          recoverPastPlacements: true,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              {
                goalId: cadenceGoal.id,
                requirementFingerprint:
                  computeRequirementFingerprint(cadenceGoal),
                unitKey: "cadence:2026-08-03:1",
                scheduledDate: "2026-08-05",
                locked: false,
              },
            ],
          },
        })
      );
      const lapsed = output.workUnits.find(
        (unit) => unit.unitKey === "cadence:2026-08-03:1"
      );
      expect(lapsed?.classification).toBe("historical_miss");
      expect(lapsed?.scheduledDate).toBe("2026-08-05");
    });

    it("keeps a locked elapsed placement pinned", () => {
      const output = runPlannerKernel(
        milestoneInput({
          recoverPastPlacements: true,
          basePlan: {
            planId: "plan-a",
            version: 1,
            assignments: [
              { ...strandedMilestone("2026-08-04"), locked: true },
            ],
          },
        })
      );
      expect(readMilestoneDate(output)).toBe("2026-08-04");
    });
  });

  it("hashes pins, intent, and preserve mode as solver inputs", () => {
    const base = runPlannerKernel(input()).generationInputHash;

    expect(
      runPlannerKernel(input({ solveIntent: "replan" })).generationInputHash
    ).not.toBe(base);
    expect(
      runPlannerKernel(input({ preserveExistingAssignments: true }))
        .generationInputHash
    ).not.toBe(base);
    expect(
      runPlannerKernel(
        input({ draftPinnedDates: { "goal-a:total:1": "2026-08-20" } })
      ).generationInputHash
    ).not.toBe(base);
  });

  it("keeps credited work units for archived goals without scheduling new ones", () => {
    const archivedGoal = goal({
      archived_at: "2026-08-10T00:00:00.000Z",
    });
    const completions: Completion[] = [
      {
        id: "completion-1",
        goal_id: archivedGoal.id,
        user_id: archivedGoal.owner_id,
        completed_on: "2026-08-05",
        source: "manual",
        created_at: "2026-08-05T00:00:00.000Z",
      },
    ];

    const output = runPlannerKernel(
      input({
        goals: [archivedGoal],
        completions,
        asOfDate: "2026-08-10",
      })
    );

    expect(output.eligibility).toEqual([
      {
        goalId: archivedGoal.id,
        eligible: false,
        reason: "archived",
      },
    ]);
    expect(output.workUnits).toHaveLength(1);
    expect(output.workUnits[0]).toMatchObject({
      originalGoalId: archivedGoal.id,
      creditedCompletionId: "completion-1",
      creditedCompletionDate: "2026-08-05",
    });
  });

  it("scopes remaining deadline-total ordinals into the current month after heavy early-year completion", () => {
    const showerGoal = withLifetimeTargetBasisForTests({
      id: "92893edf-6497-4587-bbcd-ad2ff6b47415",
      owner_id: "owner-a",
      title: "Shower early",
      description: null,
      category: "Personal",
      color: null,
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_count: 91,
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    } as Goal);
    const completionDates = [
      "2026-01-01", "2026-01-02", "2026-01-08", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16", "2026-01-31",
      "2026-02-04", "2026-02-10", "2026-02-13", "2026-02-15", "2026-02-16", "2026-02-19", "2026-02-28",
      "2026-03-05", "2026-03-07", "2026-03-21", "2026-03-24", "2026-03-25", "2026-03-26", "2026-03-30",
      "2026-04-03", "2026-04-08", "2026-04-10", "2026-04-11", "2026-04-14", "2026-04-20", "2026-04-21", "2026-04-29",
      "2026-05-02", "2026-05-12", "2026-05-16", "2026-05-25", "2026-05-29",
      "2026-06-16", "2026-06-18", "2026-06-21", "2026-06-23",
      "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-07", "2026-07-11", "2026-07-18", "2026-07-21", "2026-07-23", "2026-07-26", "2026-07-29",
      "2026-08-01", "2026-08-05", "2026-08-06", "2026-08-10", "2026-08-12", "2026-08-20", "2026-08-31",
    ];
    const completions: Completion[] = completionDates.map((completedOn, index) => ({
      id: `completion-${index}`,
      goal_id: showerGoal.id,
      user_id: showerGoal.owner_id,
      completed_on: completedOn,
      source: "manual",
      created_at: `${completedOn}T00:00:00Z`,
    }));
    const policy = createDefaultPlannerPolicy("America/New_York", "2026-09-03T00:00:00Z");
    const september = runPlannerKernel({
      schemaVersion: "1",
      eligibilityMode: "overlap_v1",
      ownerId: showerGoal.owner_id,
      ...toKernelWindow("2026-09"),
      asOfDate: "2026-09-03",
      timezone: "America/New_York",
      goals: [showerGoal],
      completions,
      links: [],
      policy,
      basePlan: null,
    });
    const dates = september.workUnits
      .map((unit) => unit.scheduledDate)
      .filter((date): date is string => date !== null);

    expect(dates.length).toBeGreaterThan(0);
    expect(dates.every((date) => date >= "2026-09-03" && date <= "2026-09-30")).toBe(
      true
    );
  });

  it("places remaining deadline-total sessions from the current month during full-horizon prepare", () => {
    const showerGoal = withLifetimeTargetBasisForTests({
      id: "92893edf-6497-4587-bbcd-ad2ff6b47415",
      owner_id: "owner-a",
      title: "Shower early",
      description: null,
      category: "Personal",
      color: null,
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_count: 91,
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    } as Goal);
    const completionDates = [
      "2026-01-01", "2026-01-02", "2026-01-08", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16", "2026-01-31",
      "2026-02-04", "2026-02-10", "2026-02-13", "2026-02-15", "2026-02-16", "2026-02-19", "2026-02-28",
      "2026-03-05", "2026-03-07", "2026-03-21", "2026-03-24", "2026-03-25", "2026-03-26", "2026-03-30",
      "2026-04-03", "2026-04-08", "2026-04-10", "2026-04-11", "2026-04-14", "2026-04-20", "2026-04-21", "2026-04-29",
      "2026-05-02", "2026-05-12", "2026-05-16", "2026-05-25", "2026-05-29",
      "2026-06-16", "2026-06-18", "2026-06-21", "2026-06-23",
      "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-07", "2026-07-11", "2026-07-18", "2026-07-21", "2026-07-23", "2026-07-26", "2026-07-29",
      "2026-08-01", "2026-08-05", "2026-08-06", "2026-08-10", "2026-08-12", "2026-08-20", "2026-08-31",
    ];
    const completions: Completion[] = completionDates.map((completedOn, index) => ({
      id: `completion-${index}`,
      goal_id: showerGoal.id,
      user_id: showerGoal.owner_id,
      completed_on: completedOn,
      source: "manual",
      created_at: `${completedOn}T00:00:00Z`,
    }));
    const policy = createDefaultPlannerPolicy("America/New_York", "2026-09-03T00:00:00Z");
    const full = runPlannerKernel({
      schemaVersion: "1",
      eligibilityMode: "overlap_v1",
      ownerId: showerGoal.owner_id,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      asOfDate: "2026-09-03",
      timezone: "America/New_York",
      goals: [showerGoal],
      completions,
      links: [],
      policy,
      basePlan: null,
    });
    const first = full.workUnits.find((unit) => unit.scheduledDate)?.scheduledDate;

    expect(first && first < "2026-11-01").toBe(true);
    expect(full.solver.issueCodes).not.toContain("placement_shortfall");
  });

  it("avoids false capacity shortfall for heavily completed deadline-total goals", () => {
    const stretchGoal = withLifetimeTargetBasisForTests({
      id: "15edcd0d-b4a9-49e5-8d6c-ec2946a8f74f",
      owner_id: "owner-a",
      title: "Night stretching",
      description: null,
      category: "Personal",
      color: null,
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_count: 250,
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    } as Goal);
    const completions: Completion[] = Array.from({ length: 147 }, (_, index) => {
      const month = String(Math.floor(index / 20) + 1).padStart(2, "0");
      const day = String((index % 20) + 1).padStart(2, "0");
      return {
        id: `completion-${index}`,
        goal_id: stretchGoal.id,
        user_id: stretchGoal.owner_id,
        completed_on: `2026-${month}-${day}`,
        source: "manual",
        created_at: `2026-${month}-${day}T00:00:00Z`,
      };
    });
    const policy = createDefaultPlannerPolicy("America/New_York", "2026-09-03T00:00:00Z");
    const full = runPlannerKernel({
      schemaVersion: "1",
      eligibilityMode: "overlap_v1",
      ownerId: stretchGoal.owner_id,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      asOfDate: "2026-09-03",
      timezone: "America/New_York",
      goals: [stretchGoal],
      completions,
      links: [],
      policy,
      basePlan: null,
    });
    const scheduled = full.workUnits.filter((unit) => unit.scheduledDate !== null).length;

    expect(scheduled).toBeGreaterThanOrEqual(103);
    expect(full.solver.issueCodes).not.toContain("placement_shortfall");
  });
});
