import { describe, expect, it } from "vitest";
import type { Completion, Goal } from "@/lib/goals/types";
import type { PlannerCanonicalSnapshot, PlannerItemRow } from "@/lib/planner/context-loader";
import { runPlannerKernel } from "@/lib/planner/kernel";
import { reconcilePersistedGoalCompletions } from "@/lib/planner/persisted-completion-reconciliation";
import { buildDirectDraftPersistence } from "@/lib/planner/direct-draft";
import { createDefaultPlannerPolicy } from "@/lib/planner/policy";
import { computeRequirementFingerprint } from "@/lib/planner/requirements";
import { buildEntriesByDateProjection } from "@/features/planner/calendar-entries";
import { planDraftMove } from "@/features/planner/plan-draft-move";

const goal: Goal = {
  id: "goal-a", owner_id: "owner-a", title: "Yearly hobby", description: null,
  category: "Personal", color: null, frequency_type: "recurring",
  recurrence_interval: "weekly", target_count: 5, target_basis: "lifetime",
  milestone_names: null, start_date: "2026-01-01", end_date: "2026-12-31",
  photo_path: null, team_id: null, is_deleted: false, archived_at: null,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};
const asOfDate = "2026-09-29";
const october = { start: "2026-10-01", end: "2026-10-31" };
const policy = createDefaultPlannerPolicy("UTC", "2026-01-01T00:00:00Z");
const item = (unitKey: string, date: string, itemGoal = goal) => ({
  id: `${itemGoal.id}:${unitKey}`, goal_id: itemGoal.id, owner_id: itemGoal.owner_id,
  unit_key: unitKey, scheduled_date: date, original_scheduled_date: date,
  scheduled_time: null, locked: false,
} as PlannerItemRow);
const fact = (id: string, date: string, unitKey?: string, factGoal = goal): Completion => ({
  id, goal_id: factGoal.id, user_id: factGoal.owner_id, completed_on: date,
  planner_unit_key: unitKey ?? null, source: "manual", created_at: `${date}T00:00:00Z`,
});

function preview(items: PlannerItemRow[], completions: Completion[]) {
  const reconciled = reconcilePersistedGoalCompletions({ goal, persistedItems: items, completions, asOfDate });
  const visibleItems = items.filter((row) => row.scheduled_date.startsWith("2026-10"));
  const assignments = visibleItems.map((row) => ({
    goalId: goal.id, requirementFingerprint: computeRequirementFingerprint(goal),
    unitKey: row.unit_key, scheduledDate: row.scheduled_date, locked: row.locked,
  }));
  const basePlan = { planId: "plan-a", version: 1, assignments, completionToUnit: reconciled.completionToUnit };
  const source = { ...goal, id: "source", end_date: "2026-09-30" };
  const result = runPlannerKernel({
    schemaVersion: "1", eligibilityMode: "overlap_v1", ownerId: goal.owner_id,
    startDate: "2026-10-01", endDate: "2026-10-31", asOfDate, timezone: "UTC",
    goals: [goal], completions, policy, basePlan, preserveExistingAssignments: true,
    links: [{ sourceGoalId: source.id, targetGoalId: goal.id }],
  });
  const activeItems = visibleItems.map((row) => ({
    id: row.id, plan_goal_id: row.goal_id, unit_key: row.unit_key,
    scheduled_date: row.scheduled_date, original_scheduled_date: row.scheduled_date,
    locked: row.locked, revision: 0, requirement_kind: "deadline_total" as const,
  }));
  const projection = buildEntriesByDateProjection({
    workUnits: result.workUnits, activeItems, activeGoalsByPlanGoalId: new Map(),
    activeGoalsByOriginalGoalId: new Map(), goalTitles: { [goal.id]: goal.title }, draftItemEdits: {},
  });
  const snapshot = {
    goals: [goal], completions, links: [], preferences: null,
    activePlan: { goals: [{ id: goal.id, original_goal_id: goal.id }], items: activeItems, basePlan },
  } as unknown as PlannerCanonicalSnapshot;
  return { result, projection, snapshot };
}

describe("persisted preview / move / save consistency", () => {
  it("keeps an October 1 saved target movable after its source ends in September", () => {
    const items = [item("total:1", "2026-10-01"), item("total:2", "2026-10-18")];
    const { result, projection, snapshot } = preview(items, []);
    const entry = projection.entryByKey.get("goal-a:total:1")!;
    const previewUnit = result.workUnits.find((unit) => unit.unitKey === "total:1");
    expect(previewUnit).toMatchObject({ creditState: "uncredited", scheduledDate: "2026-10-01" });
    expect(planDraftMove({
      entry, previewUnit, scopeMonth: "2026-10", nextDate: "2026-10-03",
      conflictKeys: undefined, completionFactConflict: undefined,
    })).toEqual({ ok: true, scheduledDate: "2026-10-03" });
    expect(buildDirectDraftPersistence({ snapshot, persistedItems: items, asOfDate, writeWindow: october, commands: [{
      id: "move", sequence: 1, kind: "move_item", goalId: goal.id, unitKey: "total:1",
      sourceDate: "2026-10-01", scheduledDate: "2026-10-03",
    }] })).toEqual(expect.arrayContaining([expect.objectContaining({ unit_key: "total:1", scheduled_date: "2026-10-03" })]));
  });

  it("matches a legacy completion against all saved dates before narrowing to October", () => {
    const items = [item("total:1", "2026-10-01"), item("total:2", "2026-09-10"), item("total:3", "2026-10-18")];
    const { result, snapshot } = preview(items, [fact("legacy", "2026-09-10")]);
    expect(result.workUnits.find((unit) => unit.unitKey === "total:1")).toMatchObject({ creditState: "uncredited" });
    expect(buildDirectDraftPersistence({ snapshot, persistedItems: items, asOfDate, writeWindow: october, commands: [{
      id: "move", sequence: 1, kind: "move_item", goalId: goal.id, unitKey: "total:1",
      sourceDate: "2026-10-01", scheduledDate: "2026-10-03",
    }] })).toHaveLength(2); // No September row leaks into the write window.
  });

  it("does not resurrect an October saved row credited on a September date as a movable session", () => {
    const items = [item("total:1", "2026-10-01"), item("total:2", "2026-10-18")];
    const { result, projection, snapshot } = preview(items, [fact("credited", "2026-09-26", "total:1")]);
    expect(result.workUnits.find((unit) => unit.unitKey === "total:1")).toMatchObject({ creditState: "completed_elsewhere" });
    expect(projection.entriesByDate.has("2026-10-01")).toBe(false);
    expect(projection.entriesByDate.get("2026-09-26")?.[0]).toMatchObject({ creditState: "completed_elsewhere" });
    expect(() => buildDirectDraftPersistence({ snapshot, persistedItems: items, asOfDate, writeWindow: october, commands: [{
      id: "move", sequence: 1, kind: "move_item", goalId: goal.id, unitKey: "total:1",
      sourceDate: "2026-10-01", scheduledDate: "2026-10-03",
    }] })).toThrow("already credited");
  });

  it("keeps a credited row on its saved date when its completion is outside the write window", () => {
    const items = [item("total:1", "2026-10-01"), item("total:2", "2026-10-18")];
    const { snapshot } = preview(items, [fact("credited", "2026-09-26", "total:1")]);
    const moveTotal2 = (scheduledDate: string) => buildDirectDraftPersistence({
      snapshot, persistedItems: items, asOfDate, writeWindow: october, commands: [{
        id: "move", sequence: 1, kind: "move_item", goalId: goal.id, unitKey: "total:2",
        sourceDate: "2026-10-18", scheduledDate,
      }],
    });
    expect(moveTotal2("2026-10-03").map((row) => [row.unit_key, row.scheduled_date])).toEqual([
      ["total:1", "2026-10-01"], ["total:2", "2026-10-03"],
    ]);
    expect(() => moveTotal2("2026-10-01")).toThrow("already has a session");
  });

  it("leaves another goal's credited row untouched when saving a move", () => {
    const other = { ...goal, id: "goal-b", title: "Other hobby" };
    const rows = [item("total:1", "2026-10-01"), item("total:1", "2026-10-05", other)];
    const completions = [fact("other-credit", "2026-09-20", "total:1", other)];
    const goalFor = (goalId: string) => (goalId === other.id ? other : goal);
    const snapshot = {
      goals: [goal, other], completions, links: [], preferences: null,
      activePlan: {
        goals: [goal, other].map((row) => ({ id: row.id, original_goal_id: row.id })),
        items: rows.map((row) => ({
          id: row.id, plan_goal_id: row.goal_id, unit_key: row.unit_key,
          scheduled_date: row.scheduled_date, original_scheduled_date: row.scheduled_date, locked: false,
        })),
        basePlan: {
          assignments: rows.map((row) => ({
            goalId: row.goal_id, requirementFingerprint: computeRequirementFingerprint(goalFor(row.goal_id)),
            unitKey: row.unit_key, scheduledDate: row.scheduled_date, locked: false,
          })),
          // Mirrors the context loader, which reconciles every goal for preview.
          completionToUnit: reconcilePersistedGoalCompletions({ goal: other, completions, persistedItems: rows, asOfDate }).completionToUnit,
        },
      },
    } as unknown as PlannerCanonicalSnapshot;
    const saved = buildDirectDraftPersistence({ snapshot, persistedItems: rows, asOfDate, writeWindow: october, commands: [{
      id: "move", sequence: 1, kind: "move_item", goalId: goal.id, unitKey: "total:1",
      sourceDate: "2026-10-01", scheduledDate: "2026-10-03",
    }] });
    expect(saved.map((row) => [row.goal_id, row.scheduled_date])).toEqual([
      [goal.id, "2026-10-03"], [other.id, "2026-10-05"],
    ]);
  });

  it("reserves durable cadence credits before matching legacy facts", () => {
    const monthly = { ...goal, target_basis: "period" as const, target_count: 3, recurrence_interval: "monthly" as const };
    const items = [1, 2, 3].map((n) => item(`cadence:2026-09-01:${n}`, `2026-09-0${n}`, monthly));
    const reconciled = reconcilePersistedGoalCompletions({
      goal: monthly, persistedItems: items, asOfDate,
      completions: [fact("legacy", "2026-09-02", undefined, monthly), fact("durable", "2026-09-03", "cadence:2026-09-01:2", monthly)],
    });
    expect(reconciled.completionToUnit.legacy?.unitKey).toBe("cadence:2026-09-01:1");
    expect(reconciled.completionToUnit.durable?.unitKey).toBe("cadence:2026-09-01:2");
    expect(reconciled.units.find((unit) => unit.unitKey === "cadence:2026-09-01:3")?.creditState).toBe("uncredited");
  });

  it("keeps a cross-month week's credits when every saved date is before month end", () => {
    const weekly = { ...goal, target_basis: "period" as const, target_count: 2 };
    const reconciled = reconcilePersistedGoalCompletions({
      goal: weekly, asOfDate, weekStartsOn: 1,
      persistedItems: [item("cadence:2026-09-28:1", "2026-09-29", weekly)],
      completions: [fact("boundary", "2026-09-29", "cadence:2026-09-28:1", weekly)],
    });
    expect(reconciled.completionToUnit.boundary?.unitKey).toBe("cadence:2026-09-28:1");
  });
});
