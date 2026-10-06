import { describe, expect, it } from "vitest";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { SAMPLE_GOALS } from "@/features/ux-goal-view/sample";
import {
  cadenceBounds,
  cadenceCountEditable,
  cadenceSummary,
  changedFacts,
  draftError,
  summarizeFact,
} from "./edit-model";

const fieldsFor = (id: string) => ({ ...goalCardFields(SAMPLE_GOALS.find((goal) => goal.id === id)!), reward_text: "", plaque_target: "10" });

describe("goal edit study model", () => {
  it("keeps per-period targets within the creation limits and totals above completed work", () => {
    const weekly = fieldsFor("strength");
    expect(cadenceBounds(weekly, 7)).toEqual({ min: 1, max: 6 });
    const milestones = fieldsFor("half");
    expect(cadenceBounds(milestones, 2)).toEqual({ min: 2, max: 999 });
    expect(draftError({ ...milestones, target_count: "1" }, 2)).toMatch(/already done 2/);
    expect(draftError({ ...weekly, target_count: "7" }, 0)).toMatch(/between 1 and 6/);
  });

  it("treats daily per-period goals as having no editable target", () => {
    const daily = fieldsFor("japanese");
    expect(cadenceCountEditable(daily)).toBe(false);
    expect(cadenceSummary(daily)).toBe("every day");
    expect(draftError(daily, 23)).toBeNull();
  });

  it("reports changed facts by the field each one owns", () => {
    const base = fieldsFor("strength");
    expect(changedFacts(base, base)).toEqual([]);
    expect(changedFacts(base, { ...base, target_count: "4", end_date: "" })).toEqual(["cadence", "deadline"]);
  });

  it("phrases facts for the sentence and rows", () => {
    const base = fieldsFor("strength");
    expect(summarizeFact("cadence", base, [])).toBe("3 days a week");
    expect(summarizeFact("deadline", { ...base, end_date: "" }, [])).toBe("No deadline");
    expect(summarizeFact("time", base, [])).toBe("6:00 pm");
    expect(summarizeFact("link", { ...base, linked_target_goal_id: "half" }, [{ id: "half", title: "Run a half marathon" }])).toBe("Run a half marathon");
    expect(draftError({ ...base, title: "  " }, 0)).toBe("Give your goal a name.");
  });
});
