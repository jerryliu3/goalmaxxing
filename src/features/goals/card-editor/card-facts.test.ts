import { describe, expect, it } from "vitest";
import { defaultGoalFormState, type GoalFormState } from "@/features/today/goal-form-model";
import {
  cadenceBounds,
  cadenceCountEditable,
  cadenceSummary,
  changedCardFacts,
  endDatePassed,
  hasPlaqueTarget,
  PAST_END_EDITABLE_KEYS,
  summarizeBackFact,
  summarizeFaceFact,
} from "./card-facts";

const weekly: GoalFormState = {
  ...defaultGoalFormState,
  title: "Get stronger",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_basis: "period",
  target_count: "3",
  start_date: "2026-09-01",
  end_date: "2026-12-31",
  default_local_time: "18:00",
};

describe("card facts", () => {
  it("phrases the facts the card prints", () => {
    expect(summarizeFaceFact("cadence", weekly)).toBe("3 days a week");
    expect(summarizeFaceFact("deadline", weekly)).toBe("Dec 31, 2026");
    expect(summarizeFaceFact("deadline", { ...weekly, end_date: "" })).toBe("No deadline");
    expect(summarizeFaceFact("time", weekly)).toBe("6:00 pm");
    expect(summarizeFaceFact("visibility", { ...weekly, is_private: true })).toBe("Private");
  });

  it("keeps period targets within their limits and totals above completed work", () => {
    expect(cadenceBounds(weekly, 9)).toEqual({ min: 1, max: 7 });
    const milestones = { ...weekly, frequency_type: "fixed_milestones" as const, target_basis: "lifetime" as const, target_count: "6" };
    expect(cadenceBounds(milestones, 2)).toEqual({ min: 2, max: 999 });
    expect(cadenceSummary(milestones)).toBe("6 milestones");
  });

  it("leaves daily per-period goals without a tunable target", () => {
    const daily = { ...weekly, recurrence_interval: "daily" as const, target_count: "1" };
    expect(cadenceCountEditable(daily)).toBe(false);
    expect(summarizeFaceFact("cadence", daily)).toBe("every day");
  });

  it("offers an achievement target only where the goal saves one", () => {
    expect(hasPlaqueTarget(weekly)).toBe(true);
    expect(hasPlaqueTarget({ ...weekly, target_basis: "lifetime" })).toBe(false);
    expect(hasPlaqueTarget({ ...weekly, frequency_type: "fixed_milestones" })).toBe(false);
    expect(summarizeBackFact("plaque", { ...weekly, plaque_target: 12 }, null)).toBe("12 completions");
  });

  it("marks the facts that differ from the loaded goal", () => {
    expect([...changedCardFacts(weekly, weekly, false)]).toEqual([]);
    const draft = { ...weekly, title: "Get stronger still", end_date: "", reward_text: "New shoes" };
    expect([...changedCardFacts(weekly, draft, true)].sort()).toEqual(["deadline", "link", "name", "reward"]);
    expect(summarizeBackFact("link", weekly, null)).toBe("Just this goal");
  });
});

describe("endDatePassed", () => {
  it("is true only for a saved end date before today", () => {
    expect(endDatePassed("2026-10-05", "2026-10-06")).toBe(true);
    expect(endDatePassed("2026-10-06", "2026-10-06")).toBe(false);
    expect(endDatePassed("", "2026-10-06")).toBe(false);
  });
});

describe("PAST_END_EDITABLE_KEYS", () => {
  it("keeps the deadline and every back setting editable on an ended goal", () => {
    expect([...PAST_END_EDITABLE_KEYS].sort()).toEqual(
      ["color", "description", "end_date", "milestone_names", "plaque_target", "reward_text"].sort(),
    );
  });

  it("leaves the card face locked", () => {
    for (const key of ["title", "target_count", "difficulty", "is_private", "default_local_time"] as const) {
      expect(PAST_END_EDITABLE_KEYS.has(key)).toBe(false);
    }
  });
});
