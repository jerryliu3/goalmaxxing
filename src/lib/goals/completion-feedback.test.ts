import { describe, expect, it } from "vitest";
import { buildCompletionFeedback, linkedFeedbackOrder } from "./completion-feedback";
import type { Goal, Completion, GoalLink } from "./types";

const goal = (id: string): Goal => ({ id, owner_id: "me", title: id, description: null,
  category: "health", color: null, frequency_type: "fixed_milestones", recurrence_interval: null,
  target_count: 2, target_basis: "lifetime", milestone_names: null, start_date: "2026-09-01",
  end_date: null, photo_path: null, team_id: null, is_deleted: false, archived_at: null, created_at: "", updated_at: "" });
const link = (source: string, target: string): GoalLink => ({ id: source + target, owner_id: "me", source_goal_id: source, target_goal_id: target, created_at: "" });
const fact = (id: string, date: string, linked = false): Completion => ({ id: id + date, goal_id: id, user_id: "me", completed_on: date, source: linked ? "linked_cascade" : "manual", created_at: "" });
const date = "2026-09-23";
const input = { sourceId: "run", date, asOfDate: date, goals: [goal("run"), goal("race"), goal("base")], links: [link("run", "race"), link("race", "base")], weekStartsOn: 1 as const };

describe("completion feedback", () => {
  it("orders ancestors once even for converging paths or cycles", () => {
    expect([...linkedFeedbackOrder("run", [...input.links, link("run", "base"), link("base", "run")]).keys()]).toEqual(["run", "race", "base"]);
  });
  it("only celebrates newly inserted facts and distinguishes partial parents from achievement", () => {
    const before = [fact("race", "2026-09-22", true)];
    const after = [...before, fact("run", date), fact("race", date, true), fact("base", date, true)];
    const result = buildCompletionFeedback({ ...input, before, after });
    expect(result.goals.map(item => [item.goalId, item.before, item.after, item.newlyAchieved])).toEqual([
      ["run", 0, 1, false], ["race", 1, 2, true], ["base", 0, 1, false],
    ]);
    expect(buildCompletionFeedback({ ...input, before: after, after }).goals).toEqual([]);
  });
  it("does not attribute an independently completed ancestor to the cascade", () => {
    expect(buildCompletionFeedback({ ...input, before: [], after: [fact("run", date), fact("race", date)] }).goals.map(item => item.goalId)).toEqual(["run"]);
  });
  it("does not file a recurring goal for merely hitting this week's target", () => {
    const recurring: Goal = { ...goal("run"), frequency_type: "recurring", recurrence_interval: "weekly", target_basis: "period", target_count: 1 };
    const result = buildCompletionFeedback({ ...input, goals: [recurring], before: [], after: [fact("run", date)] });
    expect(result.goals[0]).toMatchObject({ before: 0, after: 1, target: 1, achieved: false, newlyAchieved: false });
  });
});
