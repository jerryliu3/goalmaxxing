import { describe, expect, it } from "vitest";
import { buildDigestFacts } from "./facts";
import { resolveDigestPeriod } from "./period";
import { buildDigestPrompt } from "./prompt";

describe("buildDigestPrompt", () => {
  it("grounds the prompt in digest facts and forbids invented work", () => {
    const facts = buildDigestFacts({
      period: resolveDigestPeriod({ localDate: "2026-09-09", weekStartsOn: 1 }),
      items: [
        { goalId: "tempo", title: "Tempo run", scheduledDate: "2026-09-09" },
      ],
      completions: [],
    });
    const prompt = buildDigestPrompt({ kind: "daily", facts });
    expect(prompt).toContain("Tempo run");
    expect(prompt).not.toContain("goalId");
    expect(prompt).toContain("Do not invent sessions");
    expect(prompt).toContain("today");
  });

  it("points the monthly check-in at new goals and goals with nothing placed", () => {
    const facts = buildDigestFacts({
      period: resolveDigestPeriod({ localDate: "2026-09-01", weekStartsOn: 1 }),
      items: [],
      completions: [],
      goals: [{ goalId: "write", title: "Write every week" }],
    });
    const prompt = buildDigestPrompt({ kind: "monthly", facts });

    expect(prompt).toContain("this month");
    expect(prompt).toContain("goals worth adding");
    expect(prompt).toContain("goals with nothing placed");
    expect(prompt).toContain("Write every week");
  });

  it("restricts the goal-creation jump to the monthly check-in", () => {
    const facts = buildDigestFacts({
      period: resolveDigestPeriod({ localDate: "2026-09-09", weekStartsOn: 1 }),
      items: [],
      completions: [],
    });

    expect(buildDigestPrompt({ kind: "daily", facts })).toContain(
      "Use action=goals only on a monthly check-in"
    );
  });

  it("tells the model the time estimate is approximate", () => {
    const facts = buildDigestFacts({
      period: resolveDigestPeriod({ localDate: "2026-09-09", weekStartsOn: 1 }),
      items: [],
      completions: [],
    });

    expect(buildDigestPrompt({ kind: "daily", facts })).toContain(
      "flat per-session estimate"
    );
  });
});
