import { describe, expect, it } from "vitest";
import { getAnchoredPeriod } from "@/lib/goals/periods";
import { cadenceUnitKey } from "@/lib/goals/target-basis";
import type { Goal } from "@/lib/goals/types";
import type { PlannerCanonicalSnapshot } from "@/lib/planner/context-loader";
import {
  buildDirectDraftPersistence,
  PlannerDirectDraftValidationError,
} from "@/lib/planner/direct-draft";
import { computeRequirementFingerprint } from "@/lib/planner/requirements";

const goal: Goal = {
  id: "22222222-2222-4222-8222-222222222222",
  owner_id: "11111111-1111-4111-8111-111111111111",
  title: "Launch",
  description: null,
  category: "Personal",
  color: null,
  frequency_type: "fixed_milestones",
  recurrence_interval: null,
  target_count: 2,
  target_basis: "lifetime",
  milestone_names: ["Draft", "Ship"],
  start_date: "2026-08-01",
  end_date: "2026-09-30",
  photo_path: null,
  team_id: null,
  is_deleted: false,
  archived_at: null,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

const assignments = [
  {
    goalId: goal.id,
    requirementFingerprint: computeRequirementFingerprint(goal),
    unitKey: "milestone:1",
    scheduledDate: "2026-08-10",
    locked: false,
  },
  {
    goalId: goal.id,
    requirementFingerprint: computeRequirementFingerprint(goal),
    unitKey: "milestone:2",
    scheduledDate: "2026-09-10",
    locked: false,
  },
] as const;

const writeWindow = { start: "2026-08-01", end: "2026-09-30" };

const snapshot = {
  goals: [goal],
  completions: [],
  links: [],
  revisions: { canonicalRevision: 0, executionRevision: 0 },
  preferences: null,
  activePlan: {
    goals: [
      {
        id: goal.id,
        original_goal_id: goal.id,
      },
    ],
    items: assignments.map((assignment, index) => ({
      id: `item-${index}`,
      plan_goal_id: goal.id,
      unit_key: assignment.unitKey,
      scheduled_date: assignment.scheduledDate,
      original_scheduled_date: assignment.scheduledDate,
      locked: assignment.locked,
    })),
    basePlan: {
      assignments,
      completionToUnit: {},
    },
  },
} as unknown as PlannerCanonicalSnapshot;

describe("buildDirectDraftPersistence", () => {
  it("moves one milestone across months without changing another item", () => {
    const result = buildDirectDraftPersistence({
      snapshot,
      commands: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          sequence: 1,
          kind: "move_item",
          goalId: goal.id,
          unitKey: "milestone:1",
          sourceDate: "2026-08-10",
          scheduledDate: "2026-09-20",
        },
      ],
      asOfDate: "2026-08-05",
      writeWindow,
    });

    expect(
      result.map((item) => [item.unit_key, item.scheduled_date])
    ).toEqual([
      ["milestone:1", "2026-09-20"],
      ["milestone:2", "2026-09-10"],
    ]);
  });

  it("uses the persisted session date for stale-write validation", () => {
    const driftedSnapshot = {
      ...snapshot,
      activePlan: {
        ...snapshot.activePlan,
        basePlan: {
          ...snapshot.activePlan!.basePlan,
          assignments: snapshot.activePlan!.basePlan.assignments.map((assignment) =>
            assignment.unitKey === "milestone:1"
              ? { ...assignment, scheduledDate: "2026-08-11" }
              : assignment
          ),
        },
      },
    } as unknown as PlannerCanonicalSnapshot;

    const result = buildDirectDraftPersistence({
      snapshot: driftedSnapshot,
      commands: [
        {
          id: "33333333-3333-4333-8333-333333333339",
          sequence: 1,
          kind: "move_item",
          goalId: goal.id,
          unitKey: "milestone:1",
          sourceDate: "2026-08-10",
          scheduledDate: "2026-08-20",
        },
      ],
      asOfDate: "2026-08-05",
      writeWindow,
    });

    expect(result.find((item) => item.unit_key === "milestone:1")).toMatchObject({
      scheduled_date: "2026-08-20",
    });
  });

  it("allows manually moving an uncredited past session into a future date", () => {
    const result = buildDirectDraftPersistence({
      snapshot,
      commands: [
        {
          id: "33333333-3333-4333-8333-333333333334",
          sequence: 1,
          kind: "move_item",
          goalId: goal.id,
          unitKey: "milestone:1",
          sourceDate: "2026-08-10",
          scheduledDate: "2026-09-05",
        },
      ],
      asOfDate: "2026-08-20",
      writeWindow,
    });

    expect(
      result.map((item) => [item.unit_key, item.scheduled_date])
    ).toEqual([
      ["milestone:1", "2026-09-05"],
      ["milestone:2", "2026-09-10"],
    ]);
  });

  it("validates swaps against the final batch in either command order", () => {
    const moves = assignments.map((assignment, index) => ({
      id: `33333333-3333-4333-8333-33333333333${index}`,
      sequence: index + 1,
      kind: "move_item" as const,
      goalId: goal.id,
      unitKey: assignment.unitKey,
      sourceDate: assignment.scheduledDate,
      scheduledDate: assignments[1 - index]!.scheduledDate,
    }));
    for (const commands of [moves, moves.map((move) => ({ ...move, sequence: 3 - move.sequence }))]) {
      const result = buildDirectDraftPersistence({ snapshot, commands, asOfDate: "2026-08-05", writeWindow: { start: "2026-08-01", end: "2026-09-30" } });
      expect(result.map((item) => item.scheduled_date)).toEqual(["2026-09-10", "2026-08-10"]);
    }
  });

  it("rejects a duplicate date without moving either item", () => {
    expect(() =>
      buildDirectDraftPersistence({
        snapshot,
        commands: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            sequence: 1,
            kind: "move_item",
            goalId: goal.id,
            unitKey: "milestone:1",
            sourceDate: "2026-08-10",
            scheduledDate: "2026-09-10",
          },
        ],
        asOfDate: "2026-08-05",
        writeWindow,
      })
    ).toThrowError(
      expect.objectContaining<Partial<PlannerDirectDraftValidationError>>({
        code: "draft_destination_conflict",
      })
    );
  });

  it("rejects moving an ordinal credited by an off-schedule completion", () => {
    expect(() =>
      buildDirectDraftPersistence({
        snapshot: {
          ...snapshot,
          completions: [
            {
              id: "55555555-5555-4555-8555-555555555555",
              goal_id: goal.id,
              user_id: goal.owner_id,
              completed_on: "2026-08-04",
              source: "manual",
              created_at: "2026-08-08T12:00:00Z",
            },
          ],
        },
        commands: [
          {
            id: "66666666-6666-4666-8666-666666666666",
            sequence: 1,
            kind: "move_item",
            goalId: goal.id,
            unitKey: "milestone:1",
            sourceDate: "2026-08-10",
            scheduledDate: "2026-08-20",
          },
        ],
        asOfDate: "2026-08-05",
        writeWindow,
      })
    ).toThrowError(
      expect.objectContaining<Partial<PlannerDirectDraftValidationError>>({
        code: "draft_item_unmovable",
      })
    );
  });

  it("honors durable ordinal allocation instead of re-crediting the first milestone", () => {
    const result = buildDirectDraftPersistence({
      snapshot: {
        ...snapshot,
        completions: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            goal_id: goal.id,
            user_id: goal.owner_id,
            completed_on: "2026-08-04",
            planner_unit_key: "milestone:2",
            source: "manual",
            created_at: "2026-08-04T12:00:00Z",
          },
        ],
      },
      commands: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          sequence: 1,
          kind: "move_item",
          goalId: goal.id,
          unitKey: "milestone:1",
          sourceDate: "2026-08-10",
          scheduledDate: "2026-08-20",
        },
      ],
      asOfDate: "2026-08-05",
      writeWindow,
    });

    expect(result.find((item) => item.unit_key === "milestone:1")).toMatchObject({
      scheduled_date: "2026-08-20",
    });
    expect(result.find((item) => item.unit_key === "milestone:2")).toMatchObject({
      scheduled_date: "2026-08-04",
    });
  });

  // The direct path is selected whenever a draft carries any command and no
  // policy override, so non-move commands have to survive it on their own.
  it("projects a time override onto a draft with no move commands", () => {
    const result = buildDirectDraftPersistence({
      snapshot,
      commands: [
        {
          id: "88888888-8888-4888-8888-888888888888",
          sequence: 1,
          kind: "set_item_time_override",
          goalId: goal.id,
          unitKey: "milestone:1",
          localTime: "07:15",
        },
      ],
      asOfDate: "2026-08-05",
      writeWindow,
    });

    expect(result.find((item) => item.unit_key === "milestone:1")).toMatchObject({
      scheduled_time_override: "07:15",
      scheduled_date: "2026-08-10",
    });
  });

  it("clears a time override without disturbing the scheduled date", () => {
    const result = buildDirectDraftPersistence({
      snapshot,
      commands: [
        {
          id: "99999999-9999-4999-8999-999999999999",
          sequence: 1,
          kind: "set_item_time_override",
          goalId: goal.id,
          unitKey: "milestone:1",
          localTime: "07:15",
        },
        {
          id: "aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          sequence: 2,
          kind: "clear_item_time_override",
          goalId: goal.id,
          unitKey: "milestone:1",
        },
      ],
      asOfDate: "2026-08-05",
      writeWindow,
    });

    expect(result.find((item) => item.unit_key === "milestone:1")).toMatchObject({
      scheduled_time_override: null,
      scheduled_date: "2026-08-10",
    });
  });

  it("keeps every persisted identity when the draft only retimes", () => {
    const result = buildDirectDraftPersistence({
      snapshot,
      commands: [
        {
          id: "bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          sequence: 1,
          kind: "set_item_time_override",
          goalId: goal.id,
          unitKey: "milestone:1",
          localTime: "06:30",
        },
        {
          id: "ccccccc1-cccc-4ccc-8ccc-cccccccccccc",
          sequence: 2,
          kind: "set_item_time_override",
          goalId: goal.id,
          unitKey: "milestone:2",
          localTime: "18:00",
        },
      ],
      asOfDate: "2026-08-05",
      writeWindow,
    });

    expect(
      result.map((item) => [item.unit_key, item.scheduled_date])
    ).toEqual([
      ["milestone:1", "2026-08-10"],
      ["milestone:2", "2026-09-10"],
    ]);
    expect(result.find((item) => item.unit_key === "milestone:2")).toMatchObject({
      scheduled_time_override: "18:00",
    });
  });

  it("lets an uncredited monthly cadence session move when another September session is already credited", () => {
    const cadenceGoal: Goal = {
      ...goal,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Gym",
      frequency_type: "recurring",
      recurrence_interval: "monthly",
      target_count: 4,
      target_basis: "period",
      milestone_names: null,
      start_date: "2026-09-01",
      end_date: "2026-09-30",
    };
    const period = getAnchoredPeriod(
      cadenceGoal.start_date,
      "monthly",
      "2026-09-03",
      { weekStartsOn: 1 }
    );
    const cadenceAssignments = [
      {
        goalId: cadenceGoal.id,
        requirementFingerprint: computeRequirementFingerprint(cadenceGoal),
        unitKey: cadenceUnitKey(period.periodKey, 1),
        scheduledDate: "2026-09-01",
        locked: false,
      },
      {
        goalId: cadenceGoal.id,
        requirementFingerprint: computeRequirementFingerprint(cadenceGoal),
        unitKey: cadenceUnitKey(period.periodKey, 2),
        scheduledDate: "2026-09-03",
        locked: false,
      },
      {
        goalId: cadenceGoal.id,
        requirementFingerprint: computeRequirementFingerprint(cadenceGoal),
        unitKey: cadenceUnitKey(period.periodKey, 3),
        scheduledDate: "2026-09-10",
        locked: false,
      },
      {
        goalId: cadenceGoal.id,
        requirementFingerprint: computeRequirementFingerprint(cadenceGoal),
        unitKey: cadenceUnitKey(period.periodKey, 4),
        scheduledDate: "2026-09-17",
        locked: false,
      },
    ] as const;
    const cadenceSnapshot = {
      goals: [cadenceGoal],
      completions: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          goal_id: cadenceGoal.id,
          user_id: cadenceGoal.owner_id,
          completed_on: "2026-09-01",
          source: "manual",
          created_at: "2026-09-01T12:00:00Z",
        },
      ],
      links: [],
      revisions: { canonicalRevision: 0, executionRevision: 0 },
      preferences: null,
      activePlan: {
        goals: [{ id: cadenceGoal.id, original_goal_id: cadenceGoal.id }],
        items: cadenceAssignments.map((assignment, index) => ({
          id: `cadence-item-${index}`,
          plan_goal_id: cadenceGoal.id,
          unit_key: assignment.unitKey,
          scheduled_date: assignment.scheduledDate,
          original_scheduled_date: assignment.scheduledDate,
          locked: assignment.locked,
        })),
        basePlan: {
          assignments: cadenceAssignments,
          completionToUnit: {},
        },
      },
    } as unknown as PlannerCanonicalSnapshot;
    const thursdayKey = cadenceUnitKey(period.periodKey, 2);

    const result = buildDirectDraftPersistence({
      snapshot: cadenceSnapshot,
      commands: [
        {
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          sequence: 1,
          kind: "move_item",
          goalId: cadenceGoal.id,
          unitKey: thursdayKey,
          sourceDate: "2026-09-03",
          scheduledDate: "2026-09-09",
        },
      ],
      asOfDate: "2026-09-09",
      writeWindow,
    });

    expect(result.find((item) => item.unit_key === thursdayKey)).toMatchObject({
      scheduled_date: "2026-09-09",
    });
  });

  it("still blocks moving the cadence session that actually received the completion", () => {
    const cadenceGoal: Goal = {
      ...goal,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      title: "Gym",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 4,
      target_basis: "period",
      milestone_names: null,
      start_date: "2026-08-31",
      end_date: "2026-09-30",
    };
    const period = getAnchoredPeriod(
      cadenceGoal.start_date,
      "weekly",
      "2026-09-03",
      { weekStartsOn: 1 }
    );
    const tuesdayKey = cadenceUnitKey(period.periodKey, 2);
    const cadenceAssignments = [
      {
        goalId: cadenceGoal.id,
        requirementFingerprint: computeRequirementFingerprint(cadenceGoal),
        unitKey: cadenceUnitKey(period.periodKey, 1),
        scheduledDate: "2026-08-31",
        locked: false,
      },
      {
        goalId: cadenceGoal.id,
        requirementFingerprint: computeRequirementFingerprint(cadenceGoal),
        unitKey: tuesdayKey,
        scheduledDate: "2026-09-01",
        locked: false,
      },
    ] as const;
    const cadenceSnapshot = {
      goals: [cadenceGoal],
      completions: [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          goal_id: cadenceGoal.id,
          user_id: cadenceGoal.owner_id,
          completed_on: "2026-09-01",
          source: "manual",
          created_at: "2026-09-01T12:00:00Z",
        },
      ],
      links: [],
      revisions: { canonicalRevision: 0, executionRevision: 0 },
      preferences: null,
      activePlan: {
        goals: [{ id: cadenceGoal.id, original_goal_id: cadenceGoal.id }],
        items: cadenceAssignments.map((assignment, index) => ({
          id: `cadence-item-${index}`,
          plan_goal_id: cadenceGoal.id,
          unit_key: assignment.unitKey,
          scheduled_date: assignment.scheduledDate,
          original_scheduled_date: assignment.scheduledDate,
          locked: assignment.locked,
        })),
        basePlan: {
          assignments: cadenceAssignments,
          completionToUnit: {},
        },
      },
    } as unknown as PlannerCanonicalSnapshot;

    expect(() =>
      buildDirectDraftPersistence({
        snapshot: cadenceSnapshot,
        commands: [
          {
            id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            sequence: 1,
            kind: "move_item",
            goalId: cadenceGoal.id,
            unitKey: tuesdayKey,
            sourceDate: "2026-09-01",
            scheduledDate: "2026-09-09",
          },
        ],
        asOfDate: "2026-09-09",
        writeWindow,
      })
    ).toThrowError(
      expect.objectContaining<Partial<PlannerDirectDraftValidationError>>({
        code: "draft_item_unmovable",
        message:
          "This session is already credited by a completion, so it cannot be moved.",
      })
    );
  });
});
