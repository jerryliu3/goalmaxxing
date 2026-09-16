import { describe, expect, it } from "vitest";
import { buildDigestFacts } from "./facts";
import { DIGEST_DEFAULT_SESSION_MINUTES } from "./hours";
import { extendDailyRecapToLastCheckIn, resolveDigestPeriod } from "./period";

describe("buildDigestFacts", () => {
  it("counts placed vs completed work in the recap and ahead windows", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-09",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: [
        {
          goalId: "tempo",
          title: "Tempo run",
          scheduledDate: "2026-09-08",
        },
        {
          goalId: "strength",
          title: "Strength",
          scheduledDate: "2026-09-08",
        },
        {
          goalId: "deep-work",
          title: "Deep work",
          scheduledDate: "2026-09-09",
        },
      ],
      completions: [
        { goalId: "tempo", completedOn: "2026-09-08" },
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
      title: "Tempo run",
      state: "completed",
    });
    expect(facts.recap.items[1]).toMatchObject({
      title: "Strength",
      state: "open",
    });
  });

  it("labels windows for the monthly cadence", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-01",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({ period, items: [], completions: [] });

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
        { goalId: "run", title: "Long run", scheduledDate: "2026-09-06" },
        { goalId: "read", title: "Read", scheduledDate: "2026-09-08" },
      ],
      completions: [{ goalId: "run", completedOn: "2026-09-06" }],
    });

    expect(facts.recap).toMatchObject({
      label: "Since your last check-in",
      start: "2026-09-06",
      end: "2026-09-08",
      placed: 2,
      completed: 1,
    });
  });

  it("lists recap work that was never credited as recoverable", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-07",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: [
        { goalId: "run", title: "Long run", scheduledDate: "2026-08-31" },
        { goalId: "read", title: "Read", scheduledDate: "2026-09-01" },
        { goalId: "run", title: "Long run", scheduledDate: "2026-09-08" },
      ],
      completions: [{ goalId: "read", completedOn: "2026-09-01" }],
    });

    expect(facts.recover.count).toBe(1);
    expect(facts.recover.items).toEqual([
      { title: "Long run", date: "2026-08-31", state: "open" },
    ]);
  });

  it("caps the recoverable list while keeping the honest count", () => {
    const period = resolveDigestPeriod({
      localDate: "2026-09-01",
      weekStartsOn: 1,
    });
    const facts = buildDigestFacts({
      period,
      items: Array.from({ length: 9 }, (_, index) => ({
        goalId: `goal-${index}`,
        title: `Session ${index}`,
        scheduledDate: "2026-08-14",
      })),
      completions: [],
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
      items: [{ goalId: "run", title: "Long run", scheduledDate: "2026-09-04" }],
      completions: [],
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
        { goalId: "a", title: "A", scheduledDate: "2026-09-09" },
        { goalId: "b", title: "B", scheduledDate: "2026-09-09" },
        { goalId: "c", title: "C", scheduledDate: "2026-09-09" },
      ],
      completions: [{ goalId: "a", completedOn: "2026-09-09" }],
    });

    expect(facts.ahead.estimatedMinutes).toBe(2 * DIGEST_DEFAULT_SESSION_MINUTES);
  });
});
