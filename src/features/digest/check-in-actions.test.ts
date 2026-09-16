import { describe, expect, it } from "vitest";
import {
  buildCheckInRows,
  buildCoachCheckInRows,
  buildCheckInCoachQuestion,
  buildStructuredCheckInRows,
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

describe("check-in actions", () => {
  it("leads the monthly check-in with deciding what the month is for", () => {
    const actions = buildStructuredCheckInRows({
      kind: "monthly",
      facts: facts({
        recover: {
          count: 2,
          items: [
            {
              goalId: "run",
              title: "Long run",
              date: "2026-08-12",
              state: "open",
            },
          ],
        },
        unscheduled: { count: 3, titles: ["Reading", "Writing"] },
      }),
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
    const actions = buildStructuredCheckInRows({
      kind: "monthly",
      facts: facts({ ahead: { ...facts().ahead, placed: 2, completed: 2 } }),
    });

    expect(actions.map((entry) => entry.id)).toEqual(["new-goals"]);
  });

  it("keeps goal creation out of the weekly and daily check-ins", () => {
    for (const kind of ["weekly", "daily"] as const) {
      const actions = buildStructuredCheckInRows({ kind, facts: facts() });
      expect(actions.map((entry) => entry.id)).not.toContain("new-goals");
    }
  });

  it("leads the weekly check-in with what needs recovering", () => {
    const actions = buildStructuredCheckInRows({
      kind: "weekly",
      facts: facts({
        recover: { count: 1, items: [] },
        unscheduled: { count: 1, titles: ["Reading"] },
      }),
    });

    expect(actions.map((entry) => entry.id)).toEqual([
      "recover",
      "unscheduled",
      "workload",
    ]);
    expect(actions[0]?.title).toBe("Recover 1 missed session");
  });

  it("keeps daily workload as information without making it actionable", () => {
    const actions = buildStructuredCheckInRows({
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
    });

    expect(actions.map((entry) => entry.id)).toEqual(["recover", "workload"]);
    expect(actions[1]).toMatchObject({
      title: "3 sessions in today, about 1h 30m",
      action: null,
    });
  });

  it("returns no daily row when nothing is open or needs recovering", () => {
    const actions = buildStructuredCheckInRows({
      kind: "daily",
      facts: facts({
        ahead: { ...facts().ahead, placed: 3, completed: 3 },
      }),
    });

    expect(actions).toEqual([]);
  });

  it("maps the coach's suggestions into their own actions", () => {
    const actions = buildCoachCheckInRows({
      motivation: "Solid week.",
      suggestions: [
        {
          title: "Protect Thursday",
          body: "It is the only clear day.",
          action: "plan",
        },
        { title: "Look back", body: "Check the trend.", action: null },
      ],
    });

    expect(actions.map((entry) => entry.id)).toEqual([
      "coach:Protect Thursday",
    ]);
  });

  it("lists the coach's suggestions after the decisions the window implies", () => {
    const actions = buildCheckInRows({
      kind: "weekly",
      facts: facts({ recover: { count: 1, items: [] } }),
      suggestions: {
        motivation: "Solid week.",
        suggestions: [
          {
            title: "Protect Thursday",
            body: "It is the only clear day.",
            action: "plan",
          },
        ],
      },
    });

    expect(actions.map((entry) => entry.id)).toEqual([
      "recover",
      "workload",
      "coach:Protect Thursday",
    ]);
  });

  it("exposes structured decisions and coach suggestions separately", () => {
    const suggestions = {
      motivation: "Solid week.",
      suggestions: [
        {
          title: "Protect Thursday",
          body: "It is the only clear day.",
          action: "plan" as const,
        },
      ],
    };

    expect(
      buildStructuredCheckInRows({ kind: "weekly", facts: facts() }).map(
        (entry) => entry.id
      )
    ).toEqual(["workload"]);
    expect(
      buildCoachCheckInRows(suggestions).map((entry) => entry.id)
    ).toEqual(["coach:Protect Thursday"]);
  });
});

describe("buildCheckInCoachQuestion", () => {
  it("hands over the same decisions the sheet rendered", () => {
    const question = buildCheckInCoachQuestion({
      kind: "weekly",
      facts: facts({
        recover: { count: 1, items: [] },
        unscheduled: { count: 2, titles: ["Reading"] },
      }),
    });

    expect(question).toContain("Following up on my weekly check-in.");
    expect(question).toContain("How it went — last week: 5 of 8 done.");
    expect(question).toContain("- Recover 1 missed session");
    expect(question).toContain("- 2 goals have nothing in this week");
    expect(question).toContain("- 5 sessions in this week, about 2h 30m");
    expect(question).toContain("Help me decide how to tackle this week.");
  });

  it("still asks for help when the window has nothing to decide", () => {
    const question = buildCheckInCoachQuestion({
      kind: "daily",
      facts: facts({
        ahead: { ...facts().ahead, label: "Today", placed: 2, completed: 2 },
      }),
    });

    expect(question).not.toContain("What the check-in flagged");
    expect(question).toContain("Help me decide how to tackle today.");
  });
});
