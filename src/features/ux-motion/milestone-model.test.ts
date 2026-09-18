import { describe, expect, it } from "vitest";
import { completeSampleMilestone, INITIAL_MILESTONES, PORTFOLIO_GOAL, portfolioSummary, sampleFolios } from "./milestone-model";

describe("milestone-to-folio sample journey", () => {
  it("does not file an unfinished goal in the annual volume", () => {
    const next = completeSampleMilestone(INITIAL_MILESTONES, 1);
    expect(portfolioSummary(next).outcome).toBe("in_progress");
    expect(sampleFolios(next)[0].entries.map(entry => entry.goal.id)).not.toContain(PORTFOLIO_GOAL.id);
  });
  it("adds the achieved goal once to the existing year with its real sample count", () => {
    const completed = completeSampleMilestone(completeSampleMilestone(INITIAL_MILESTONES, 1), 2);
    const folios = sampleFolios(completed);
    expect(folios).toHaveLength(1);
    expect(folios[0]).toMatchObject({ year: "2026", completions: 33 });
    expect(folios[0].entries).toHaveLength(2);
    expect(folios[0].entries[1]).toMatchObject({ goal: { id: PORTFOLIO_GOAL.id }, status: "Completed", closedOn: "2026-09-18" });
    expect(completeSampleMilestone(completed, 2)).toBe(completed);
  });
  it("uses distinct completed milestones, not the selected position, to determine achievement", () => {
    const lastFirst = completeSampleMilestone(INITIAL_MILESTONES, 2);
    expect(portfolioSummary(lastFirst)).toMatchObject({ outcome: "in_progress", admissibleCompletionCount: 2 });
    expect(portfolioSummary(completeSampleMilestone(lastFirst, 1)).outcome).toBe("achieved");
  });
});
