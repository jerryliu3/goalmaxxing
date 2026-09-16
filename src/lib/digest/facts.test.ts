import { describe, expect, it } from "vitest";
import { buildDigestFacts } from "./facts";
import { resolveDigestPeriod } from "./period";

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
});
