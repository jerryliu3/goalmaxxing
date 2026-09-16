import { describe, expect, it } from "vitest";

import { buildCheckInCoachQuestion } from "@/features/digest/check-in-coach-handoff";
import type { DigestFacts } from "@/lib/digest/contract";

const facts: DigestFacts = {
  recap: {
    label: "Yesterday",
    start: "2026-09-14",
    end: "2026-09-14",
    placed: 4,
    completed: 3,
    estimatedMinutes: 30,
    items: [],
  },
  ahead: {
    label: "Today",
    start: "2026-09-15",
    end: "2026-09-15",
    placed: 5,
    completed: 1,
    estimatedMinutes: 120,
    items: [],
  },
  recover: {
    count: 1,
    items: [{ title: "Run", date: "2026-09-14", state: "open" }],
  },
  unscheduled: { count: 2, titles: ["Read", "Stretch"] },
};

describe("buildCheckInCoachQuestion", () => {
  it("carries the numbers the sheet just showed", () => {
    const question = buildCheckInCoachQuestion({ kind: "daily", facts });

    expect(question).toContain("Following up on my daily check-in.");
    expect(question).toContain("Yesterday: 3 of 4 placed sessions done.");
    expect(question).toContain("Today: 4 open sessions.");
    expect(question).toContain("1 missed session still needs a new day.");
    expect(question).toContain("2 goals have nothing placed in today.");
    expect(question).toContain("Help me decide how to tackle today.");
  });

  it("leaves out the lines that have nothing to report", () => {
    const question = buildCheckInCoachQuestion({
      kind: "monthly",
      facts: {
        ...facts,
        recover: { count: 0, items: [] },
        unscheduled: { count: 0, titles: [] },
      },
    });

    expect(question).toContain("Following up on my monthly check-in.");
    expect(question).not.toContain("need a new day");
    expect(question).not.toContain("nothing placed");
  });

  it("keeps a single open session singular", () => {
    const question = buildCheckInCoachQuestion({
      kind: "weekly",
      facts: { ...facts, ahead: { ...facts.ahead, placed: 2, completed: 1 } },
    });

    expect(question).toContain("1 open session.");
  });
});
