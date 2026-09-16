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
    expect(prompt).toContain("Do not invent sessions");
    expect(prompt).toContain("today");
  });
});
