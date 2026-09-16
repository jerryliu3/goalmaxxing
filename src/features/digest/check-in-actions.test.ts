import { describe, expect, it } from "vitest";
import {
  buildCheckInActions,
  checkInHeading,
  checkInRecapSummary,
  primaryCheckInAction,
} from "@/features/digest/check-in-actions";
import type { DigestFacts } from "@/lib/digest/contract";

function facts(overrides: Partial<DigestFacts> = {}): DigestFacts {
  return {
    recap: {
      label: "Last week",
      start: "2026-08-31",
      end: "2026-09-06",
      placed: 8,
      completed: 5,
      estimatedMinutes: 90,
      items: [],
    },
    ahead: {
      label: "This week",
      start: "2026-09-07",
      end: "2026-09-13",
      placed: 6,
      completed: 1,
      estimatedMinutes: 150,
      items: [],
    },
    recover: { count: 0, items: [] },
    unscheduled: { count: 0, titles: [] },
    ...overrides,
  };
}

describe("checkInHeading and primaryCheckInAction", () => {
  it("names the cadence and sends the day at today, the rest at the plan", () => {
    expect(checkInHeading("daily")).toBe("Daily check-in");
    expect(checkInHeading("weekly")).toBe("Weekly check-in");
    expect(checkInHeading("monthly")).toBe("Monthly check-in");
    expect(primaryCheckInAction("daily")).toBe("today");
    expect(primaryCheckInAction("weekly")).toBe("plan");
    expect(primaryCheckInAction("monthly")).toBe("plan");
  });
});

describe("checkInRecapSummary", () => {
  it("reads as a score", () => {
    expect(checkInRecapSummary(facts())).toBe("last week: 5 of 8 done");
  });

  it("does not report a score when nothing was placed", () => {
    expect(
      checkInRecapSummary(
        facts({
          recap: { ...facts().recap, placed: 0, completed: 0 },
        })
      )
    ).toBe("last week: nothing was placed");
  });
});

describe("buildCheckInActions", () => {
  it("leads the monthly check-in with deciding what the month is for", () => {
    const actions = buildCheckInActions({
      kind: "monthly",
      facts: facts({
        recover: {
          count: 2,
          items: [{ title: "Long run", date: "2026-08-12", state: "open" }],
        },
        unscheduled: { count: 3, titles: ["Reading", "Writing"] },
      }),
      suggestions: null,
    });

    expect(actions.map((entry) => entry.id)).toEqual([
      "new-goals",
      "unscheduled",
      "recover",
      "workload",
    ]);
    expect(actions[0]?.action).toBe("goals");
    expect(actions[1]?.title).toBe("3 goals have nothing in this week");
    expect(actions[1]?.detail).toBe("Reading, Writing, and more.");
  });

  it("still offers the monthly goal decision when the month is otherwise clear", () => {
    const actions = buildCheckInActions({
      kind: "monthly",
      facts: facts({ ahead: { ...facts().ahead, placed: 2, completed: 2 } }),
      suggestions: null,
    });

    expect(actions.map((entry) => entry.id)).toEqual(["new-goals"]);
  });

  it("keeps goal creation out of the weekly and daily check-ins", () => {
    for (const kind of ["weekly", "daily"] as const) {
      const actions = buildCheckInActions({ kind, facts: facts(), suggestions: null });
      expect(actions.map((entry) => entry.id)).not.toContain("new-goals");
    }
  });

  it("leads the weekly check-in with what needs recovering", () => {
    const actions = buildCheckInActions({
      kind: "weekly",
      facts: facts({
        recover: { count: 1, items: [] },
        unscheduled: { count: 1, titles: ["Reading"] },
      }),
      suggestions: null,
    });

    expect(actions.map((entry) => entry.id)).toEqual([
      "recover",
      "unscheduled",
      "workload",
    ]);
    expect(actions[0]?.title).toBe("Recover 1 missed session");
  });

  it("leads the daily check-in with the day and leaves unplaced goals out", () => {
    const actions = buildCheckInActions({
      kind: "daily",
      facts: facts({
        ahead: {
          ...facts().ahead,
          label: "Today",
          placed: 4,
          completed: 1,
          estimatedMinutes: 90,
        },
        recover: { count: 2, items: [] },
        unscheduled: { count: 9, titles: ["Reading"] },
      }),
      suggestions: null,
    });

    expect(actions.map((entry) => entry.id)).toEqual(["workload", "recover"]);
    expect(actions[0]?.title).toBe("3 sessions in today, about 1h 30m");
    expect(actions[0]?.detail).toContain("30 minutes a session");
  });

  it("drops the workload row when nothing is left open ahead", () => {
    const actions = buildCheckInActions({
      kind: "daily",
      facts: facts({
        ahead: { ...facts().ahead, placed: 3, completed: 3 },
      }),
      suggestions: null,
    });

    expect(actions).toEqual([]);
  });

  it("appends the coach's own suggestions after the structured rows", () => {
    const actions = buildCheckInActions({
      kind: "weekly",
      facts: facts(),
      suggestions: {
        motivation: "Solid week.",
        suggestions: [
          { title: "Protect Thursday", body: "It is the only clear day.", action: "plan" },
          { title: "Look back", body: "Check the trend.", action: null },
        ],
      },
    });

    expect(actions.map((entry) => entry.id)).toEqual([
      "workload",
      "coach:Protect Thursday",
      "coach:Look back",
    ]);
    expect(actions[2]?.action).toBeNull();
  });
});
