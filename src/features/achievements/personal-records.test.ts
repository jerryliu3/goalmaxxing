import { describe, expect, it } from "vitest";
import { buildPersonalRecords } from "@/features/achievements/personal-records";
import type { Completion } from "@/lib/goals/types";

function makeCompletion(overrides: Partial<Completion> = {}): Completion {
  return {
    id: "completion-1",
    goal_id: "goal-1",
    user_id: "user-1",
    completed_on: "2026-03-01",
    source: "manual",
    created_at: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

const baseInput = {
  achievedGoalsCount: 0,
  achievedGoalDates: [] as string[],
  asOfDate: "2026-09-01",
  goalSnapshots: [{ currentStreak: 0, longestStreak: 0 }],
  completions: [] as Completion[],
  level: 4,
  totalXp: 800,
  weekStartsOn: 1,
  truncated: { goals: false, completions: false },
};

describe("buildPersonalRecords", () => {
  it("builds the four showcase records", () => {
    const records = buildPersonalRecords(baseInput);
    expect(records.map((record) => record.id)).toEqual([
      "rec-streak",
      "rec-week",
      "rec-goals",
      "rec-level",
    ]);
    expect(records[3]).toMatchObject({
      label: "Highest level",
      value: "4",
      hint: "800 XP total",
    });
  });

  it("anchors goals-finished hints to asOfDate", () => {
    const records = buildPersonalRecords({
      ...baseInput,
      achievedGoalsCount: 1,
      achievedGoalDates: ["2026-08-22"],
      asOfDate: "2026-09-01",
    });

    expect(records[2]?.hint).toBe("First finish 10 days ago");
  });

  it("reports first finish today when asOfDate matches", () => {
    const records = buildPersonalRecords({
      ...baseInput,
      achievedGoalsCount: 1,
      achievedGoalDates: ["2026-09-01"],
      asOfDate: "2026-09-01",
    });

    expect(records[2]?.hint).toBe("First finish today");
  });

  it("prefers the later week when active-day counts tie", () => {
    const records = buildPersonalRecords({
      ...baseInput,
      completions: [
        makeCompletion({ id: "c1", completed_on: "2026-08-04" }),
        makeCompletion({ id: "c2", completed_on: "2026-08-05" }),
        makeCompletion({ id: "c3", completed_on: "2026-08-18" }),
        makeCompletion({ id: "c4", completed_on: "2026-08-19" }),
      ],
    });

    expect(records[1]?.hint).toContain("week of Aug 17");
  });

  it("qualifies streak and week records when completions are truncated", () => {
    const records = buildPersonalRecords({
      ...baseInput,
      completions: [makeCompletion()],
      truncated: { goals: false, completions: true },
    });

    expect(records[0]?.hint).toBe("Based on a bounded snapshot");
    expect(records[1]?.hint).toBe("Based on a bounded snapshot");
    expect(records[2]?.hint).not.toBe("Based on a bounded snapshot");
  });

  it("qualifies streak and goals records when goals are truncated", () => {
    const records = buildPersonalRecords({
      ...baseInput,
      achievedGoalsCount: 2,
      achievedGoalDates: ["2026-08-01"],
      goalSnapshots: [{ currentStreak: 3, longestStreak: 9 }],
      truncated: { goals: true, completions: false },
    });

    expect(records[0]?.hint).toBe("Based on a bounded snapshot");
    expect(records[2]?.hint).toBe("Based on a bounded snapshot");
    expect(records[1]?.hint).not.toBe("Based on a bounded snapshot");
  });

  it("uses the profile week start when bucketing active weeks", () => {
    const mondayWeek = buildPersonalRecords({
      ...baseInput,
      weekStartsOn: 1,
      completions: [makeCompletion({ completed_on: "2026-08-03" })],
    });
    const sundayWeek = buildPersonalRecords({
      ...baseInput,
      weekStartsOn: 0,
      completions: [makeCompletion({ completed_on: "2026-08-03" })],
    });

    expect(mondayWeek[1]?.hint).toContain("week of Aug 3");
    expect(sundayWeek[1]?.hint).toContain("week of Aug 2");
  });
});
