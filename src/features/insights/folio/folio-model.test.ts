import { describe, expect, it } from "vitest";
import { summary } from "./folio-test-fixtures";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { buildGoalFolios } from "./folio-model";



describe("past goal folios", () => {
  it("includes ended, archived, and achieved goals but excludes active, deleted, and other owners", () => {
    const goals = [
      buildGoal({ id: "ended", end_date: "2026-07-01" }),
      buildGoal({ id: "archived", archived_at: "2026-08-01T00:00:00Z", end_date: "2027-01-01" }),
      buildGoal({ id: "achieved", end_date: null, target_basis: "lifetime", target_count: 3 }),
      buildGoal({ id: "active" }),
      buildGoal({ id: "deleted", is_deleted: true, end_date: "2026-07-01" }),
      buildGoal({ id: "partner", owner_id: "another-user", end_date: "2026-07-01" }),
    ];
    const summaries = goals.map(goal => summary(goal.id, goal.id === "archived" ? { lifecycle: "archived", outcome: "in_progress" } : goal.id === "achieved" ? { outcome: "achieved", lifecycle: "active", achievementDate: "2026-09-01" } : goal.id === "active" ? { placementTerminal: false, lifecycle: "active" } : {}));
    const [folio] = buildGoalFolios(goals, summaries, "user-1");
    expect(folio.entries.map(entry => [entry.goal.id, entry.status])).toEqual([["ended", "Ended"], ["archived", "Archived"], ["achieved", "Completed"]]);
    expect(folio.completions).toBe(24);
    expect(folio.entries[1].closedOn).toBe("2026-08-01");
  });

  it("orders volumes newest first and chapters chronologically with deterministic ties", () => {
    const goals = [
      buildGoal({ id: "b", end_date: "2025-09-01", start_date: "2025-01-01" }),
      buildGoal({ id: "new", end_date: "2026-03-01" }),
      buildGoal({ id: "a", end_date: "2025-09-01", start_date: "2025-01-01" }),
    ];
    const folios = buildGoalFolios(goals, goals.map(goal => summary(goal.id)), "user-1");
    expect(folios.map(folio => folio.year)).toEqual(["2026", "2025"]);
    expect(folios[1].entries.map(entry => entry.goal.id)).toEqual(["a", "b"]);
  });

  it("preserves the goal's creation card fields and custom category", () => {
    const goal = buildGoal({ category: "Music", color: "#f49a70", difficulty: "hard", is_private: true, frequency_type: "fixed_milestones", target_count: 3, milestone_names: ["First", "Second", "Third"], end_date: "2026-08-20" });
    const [folio] = buildGoalFolios([goal], [summary(goal.id)], goal.owner_id);
    expect(folio.entries[0].fields).toMatchObject({ category_selection: "custom", custom_category: "Music", color: "#f49a70", difficulty: "hard", is_private: true, milestone_names: goal.milestone_names, target_count: "3" });
    expect(buildGoalFolios([goal], [], goal.owner_id)).toEqual([]);
  });
});
