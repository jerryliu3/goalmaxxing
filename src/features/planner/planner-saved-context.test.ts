import { describe, expect, it } from "vitest";
import { buildPlannerContext, buildPlannerWorkUnit } from "@/features/planner/test-fixtures";
import { applySavedPlannerCommands } from "@/features/planner/planner-saved-context";

describe("saved planner baseline", () => {
  it("uses final chronological ordinals for both the moved milestone and its neighbour", () => {
    const context = buildPlannerContext({ workUnits: [
      buildPlannerWorkUnit({ unitKey: "milestone:1", label: "First", scheduledDate: "2026-09-10" }),
      buildPlannerWorkUnit({ unitKey: "milestone:2", label: "Second", scheduledDate: "2026-09-20", creditState: "completed_as_scheduled", creditedCompletionDate: "2026-09-20", classification: "fulfilled" }),
    ] });
    const saved = applySavedPlannerCommands(context, [{
      id: "move", sequence: 0, kind: "move_item", goalId: "goal-1",
      unitKey: "milestone:1", sourceDate: "2026-09-10", scheduledDate: "2026-09-29",
    }], "b".repeat(64), [
      { id: "first", goalId: "goal-1", unitKey: "milestone:1", scheduledDate: "2026-09-20", originalScheduledDate: "2026-09-20", scheduledTimeOverride: null, locked: false },
      { id: "second", goalId: "goal-1", unitKey: "milestone:2", scheduledDate: "2026-09-29", originalScheduledDate: "2026-09-10", scheduledTimeOverride: null, locked: false },
    ], { start: "2026-09-01", end: "2026-09-30" });
    expect(saved.preview?.workUnits.map(({ unitKey, label, scheduledDate }) => ({ unitKey, label, scheduledDate }))).toEqual([
      { unitKey: "milestone:1", label: "First", scheduledDate: "2026-09-20" },
      { unitKey: "milestone:2", label: "Second", scheduledDate: "2026-09-29" },
    ]);
    expect(saved.preview?.workUnits[0].creditState).toBe("completed_as_scheduled");
    expect(saved.preview?.workUnits[1].creditState).toBe("uncredited");
  });

  it("advances both the persisted source and displayed date without changing unrelated sessions", () => {
    const context = buildPlannerContext({
      workUnits: [buildPlannerWorkUnit({ unitKey: "milestone:1", scheduledDate: "2026-12-20" }), buildPlannerWorkUnit({ unitKey: "milestone:2" })],
      overrides: {
        activePlan: {
          plan: { id: "plan", version: 1, status: "active" },
          goals: [{ id: "snapshot-goal", goal_id: "goal-1", original_goal_id: "goal-1", requirement_fingerprint: "a".repeat(64), title: "5k", category: "Health", color: null }],
          items: [{ id: "item", plan_goal_id: "snapshot-goal", unit_key: "milestone:1", requirement_kind: "milestone_sequence", scheduled_date: "2026-12-20", original_scheduled_date: "2026-12-20", locked: false, revision: 0 }],
        },
      },
    });
    const saved = applySavedPlannerCommands(context, [{
      id: "move", sequence: 0, kind: "move_item", goalId: "goal-1",
      unitKey: "milestone:1", sourceDate: "2026-12-20", scheduledDate: "2026-09-29",
    }], "b".repeat(64), [{ id: "saved-item", goalId: "goal-1", unitKey: "milestone:1", scheduledDate: "2026-09-29", originalScheduledDate: "2026-12-20", scheduledTimeOverride: null, locked: false }], { start: "2026-09-01", end: "2026-12-31" });
    expect(saved.revisions.scheduleDigest).toBe("b".repeat(64));
    expect(saved.activePlan?.items[0].scheduled_date).toBe("2026-09-29");
    expect(saved.activePlan?.items[0].id).toBe("saved-item");
    expect(saved.preview?.workUnits[0].scheduledDate).toBe("2026-09-29");
    expect(saved.preview?.workUnits[1]).toBe(context.preview?.workUnits[1]);
    expect(context.activePlan?.items[0].scheduled_date).toBe("2026-12-20");
  });
});
