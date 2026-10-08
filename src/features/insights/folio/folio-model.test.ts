import { describe, expect, it } from "vitest";
import { summary } from "./folio-test-fixtures";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { buildCurrentGoals, buildFolioEntries, buildGoalBooks, buildGoalFolios, folioLabel, splitPastGoals } from "./folio-model";
import { selectCurrentGoals } from "@/lib/goals/current-goals";



describe("past goal folios", () => {
  it("splits archived goals out of past goals", () => {
    const goals = [
      buildGoal({ id: "ended", end_date: "2026-07-01" }),
      buildGoal({ id: "archived", archived_at: "2026-08-01T00:00:00Z", end_date: "2027-01-01" }),
      buildGoal({ id: "achieved", end_date: null, target_basis: "lifetime", target_count: 3 }),
    ];
    const summaries = goals.map(goal => summary(goal.id, goal.id === "archived" ? { lifecycle: "archived", outcome: "in_progress" } : goal.id === "achieved" ? { outcome: "achieved", lifecycle: "active", achievementDate: "2026-09-01" } : {}));
    const { past, archived } = splitPastGoals(buildFolioEntries(goals, summaries, "user-1"));
    expect(past.map(entry => entry.goal.id)).toEqual(["ended", "achieved"]);
    expect(archived.map(entry => entry.goal.id)).toEqual(["archived"]);
  });

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

describe("past goal books", () => {
  const entries = (goals: ReturnType<typeof buildGoal>[]) => buildFolioEntries(goals, goals.map(goal => summary(goal.id)), "user-1");

  it("files this year's goals by start month and earlier goals by start year, newest first", () => {
    const books = buildGoalBooks(entries([
      buildGoal({ id: "aug-b", start_date: "2026-08-20", end_date: "2026-09-01" }),
      buildGoal({ id: "mar", start_date: "2026-03-02", end_date: "2026-04-01" }),
      buildGoal({ id: "aug-a", start_date: "2026-08-03", end_date: "2026-10-01" }),
      // Started last year, ended this year: still last year's book.
      buildGoal({ id: "carried", start_date: "2025-11-01", end_date: "2026-02-01" }),
      buildGoal({ id: "old", start_date: "2023-05-01", end_date: "2023-06-01" }),
    ]), "2026");
    expect(books.map(book => [folioLabel(book), book.entries.map(entry => entry.goal.id)])).toEqual([
      ["August 2026", ["aug-a", "aug-b"]],
      ["March 2026", ["mar"]],
      ["2025", ["carried"]],
      ["2023", ["old"]],
    ]);
    expect(books[0]).toMatchObject({ year: "2026", month: "2026-08", completions: 16 });
    expect(books[2].month).toBeUndefined();
  });

  it("turns this year's months into last year's book once the year rolls over", () => {
    const goals = entries([buildGoal({ id: "a", start_date: "2026-03-02", end_date: "2026-04-01" })]);
    expect(buildGoalBooks(goals, "2027").map(folioLabel)).toEqual(["2026"]);
  });
});

describe("current goal collection", () => {
  it("includes active and upcoming goals without requiring a planned session", () => {
    const goals = [buildGoal({ id: "active" }), buildGoal({ id: "upcoming", start_date: "2027-01-01" }), buildGoal({ id: "past", end_date: "2026-09-01" }), buildGoal({ id: "partner", owner_id: "other" }), buildGoal({ id: "deleted", is_deleted: true })];
    const summaries = goals.map(goal => summary(goal.id, { lifecycle: goal.id === "upcoming" ? "upcoming" : "active", placementTerminal: goal.id === "past", outcome: "in_progress" }));
    expect(buildCurrentGoals(goals, summaries, "user-1").map(entry => entry.goal.id)).toEqual(["active", "upcoming"]);
  });
  it("moves a newly accomplished goal out of Current and into Past", () => {
    const goal = buildGoal({ target_basis: "lifetime", target_count: 3 });
    const earned = summary(goal.id, { outcome: "achieved", achievementDate: "2026-09-17", lifecycle: "active", placementTerminal: true });
    expect(buildCurrentGoals([goal], [earned], "user-1")).toEqual([]);
    expect(buildGoalFolios([goal], [earned], "user-1")[0].entries[0].status).toBe("Completed");
  });
  it("can keep private goals out of a public collection", () => {
    const goals = [
      buildGoal({ id: "public" }),
      buildGoal({ id: "secret", is_private: true }),
    ];
    const summaries = goals.map((goal) => summary(goal.id, { lifecycle: "active", placementTerminal: false, outcome: "in_progress" }));
    expect(selectCurrentGoals(goals, summaries, "user-1", { publicOnly: true }).map((entry) => entry.goal.id)).toEqual(["public"]);
  });
});
