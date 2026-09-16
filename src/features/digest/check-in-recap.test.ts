import { describe, expect, it } from "vitest";
import { applyRecapCompletion } from "@/features/digest/check-in-recap";
import type { DigestFacts } from "@/lib/digest/contract";

const facts: DigestFacts = {
  recap: {
    label: "Yesterday",
    start: "2026-09-08",
    end: "2026-09-08",
    placed: 2,
    completed: 0,
    estimatedMinutes: 60,
    items: [
      {
        goalId: "strength",
        title: "Strength",
        date: "2026-09-08",
        state: "open",
      },
      {
        goalId: "read",
        title: "Read",
        date: "2026-09-08",
        state: "open",
      },
    ],
  },
  ahead: {
    label: "Today",
    start: "2026-09-09",
    end: "2026-09-09",
    placed: 0,
    completed: 0,
    estimatedMinutes: 0,
    items: [],
  },
  recover: {
    count: 2,
    items: [
      {
        goalId: "strength",
        title: "Strength",
        date: "2026-09-08",
        state: "open",
      },
      {
        goalId: "read",
        title: "Read",
        date: "2026-09-08",
        state: "open",
      },
    ],
  },
  unscheduled: { count: 0, titles: [] },
};

describe("applyRecapCompletion", () => {
  it("credits the recap and removes the item from recovery", () => {
    const next = applyRecapCompletion(facts, {
      goalId: "strength",
      date: "2026-09-08",
    });

    expect(next.recap.completed).toBe(1);
    expect(next.recap.items[0]?.state).toBe("completed");
    expect(next.recover.count).toBe(1);
    expect(next.recover.items.map((item) => item.goalId)).toEqual(["read"]);
  });

  it("is idempotent for an already completed item", () => {
    const completed = applyRecapCompletion(facts, {
      goalId: "strength",
      date: "2026-09-08",
    });

    expect(
      applyRecapCompletion(completed, {
        goalId: "strength",
        date: "2026-09-08",
      })
    ).toBe(completed);
  });
});
