import { describe, expect, it } from "vitest";
import { buildDigestFacts, type DigestSourceItem } from "./facts";
import { DIGEST_DEFAULT_SESSION_MINUTES } from "./hours";
import { extendDailyRecapToLastCheckIn, resolveDigestPeriod } from "./period";

function item(
  goalId: string,
  title: string,
  scheduledDate: string,
  credited = false
): DigestSourceItem {
  return { goalId, title, scheduledDate, credited, requirementKind: "cadence" };
}

describe("buildDigestFacts", () => {
  it("counts placed vs credited work in the recap and ahead windows", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-09",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: [
        item("tempo", "Tempo run", "2026-09-08", true),
        item("strength", "Strength", "2026-09-08"),
        item("deep-work", "Deep work", "2026-09-09"),
      ],
    });

    expect(facts.recap).toMatchObject({
      label: "Yesterday",
      placed: 2,
      completed: 1,
    });
    expect(facts.ahead).toMatchObject({
      label: "Today",
      placed: 1,
      completed: 0,
    });
    expect(facts.recap.items[0]).toMatchObject({
      goalId: "tempo",
      title: "Tempo run",
      state: "completed",
      requirementKind: "cadence",
    });
    expect(facts.recap.items[1]).toMatchObject({
      goalId: "strength",
      title: "Strength",
      state: "open",
    });
  });

  it("trusts planner credit, so a completion on another day of the window counts", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-09",
      weekStartsOn: 1,
    });
    // Placed yesterday, done the day before: the planner credits the session.
    const facts = buildDigestFacts({
      period,
      items: [item("tempo", "Tempo run", "2026-09-08", true)],
    });

    expect(facts.recap.completed).toBe(1);
    expect(facts.recap.items[0]?.state).toBe("completed");
  });

  it("labels windows for the monthly cadence", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-01",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({ period, items: [] });

    expect(facts.recap.label).toBe("Last month");
    expect(facts.ahead.label).toBe("This month");
  });

  it("summarizes every date since the last daily check-in", () => {
    const period = extendDailyRecapToLastCheckIn(
      resolveDigestPeriod({
        localDate: "2026-09-09",
        weekStartsOn: 1,
      }),
      "2026-09-06"
    );
    const facts = buildDigestFacts({
      period,
      items: [
        item("run", "Long run", "2026-09-06", true),
        item("read", "Read", "2026-09-08"),
      ],
    });

    expect(facts.recap).toMatchObject({
      label: "Since your last check-in",
      start: "2026-09-06",
      end: "2026-09-08",
      placed: 2,
      completed: 1,
    });
  });

  it("reports the recovery review's list, not every open recap session", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-07",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      // Last week's open session is a past-period miss: not recoverable.
      items: [item("french", "French", "2026-08-31")],
      recoverable: [
        {
          goalId: "portfolio",
          title: "Ship portfolio",
          date: "2026-09-03",
          state: "open",
          requirementKind: "milestone_sequence",
        },
      ],
    });

    expect(facts.recover).toEqual({
      count: 1,
      items: [
        {
          goalId: "portfolio",
          title: "Ship portfolio",
          date: "2026-09-03",
          state: "open",
          requirementKind: "milestone_sequence",
        },
      ],
    });
  });

  it("caps the recoverable list while keeping the honest count", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-01",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: [],
      recoverable: Array.from({ length: 9 }, (_, index) => ({
        goalId: `goal-${index}`,
        title: `Session ${index}`,
        date: "2026-08-14",
        state: "open" as const,
      })),
    });

    expect(facts.recover.count).toBe(9);
    expect(facts.recover.items).toHaveLength(5);
  });

  it("names live goals with nothing placed in the window ahead", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-01",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: [item("run", "Long run", "2026-09-04")],
      goals: [
        { goalId: "run", title: "Running" },
        { goalId: "read", title: "Reading" },
        { goalId: "write", title: "Writing" },
      ],
    });

    expect(facts.unscheduled.count).toBe(2);
    expect(facts.unscheduled.titles).toEqual(["Reading", "Writing"]);
  });

  it("estimates remaining time from the open sessions only", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-09",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: [
        item("a", "A", "2026-09-09", true),
        item("b", "B", "2026-09-09"),
        item("c", "C", "2026-09-09"),
      ],
    });

    expect(facts.ahead.estimatedMinutes).toBe(2 * DIGEST_DEFAULT_SESSION_MINUTES);
  });
});
