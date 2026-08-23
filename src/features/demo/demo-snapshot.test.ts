import { describe, expect, it } from "vitest";
import { DEMO_ALEX_ID, DEMO_GOAL_IDS } from "@/features/demo/demo-ids";
import { alexGoalsFromSnapshot, buildDemoSnapshot } from "@/features/demo/demo-snapshot";

describe("buildDemoSnapshot", () => {
  const snapshot = buildDemoSnapshot("2026-08-22");

  it("builds Alex's eight-goal world relative to asOfDate", () => {
    const alexGoals = alexGoalsFromSnapshot(snapshot);
    expect(snapshot.asOfDate).toBe("2026-08-22");
    expect(snapshot.timezone).toBe("America/New_York");
    expect(alexGoals).toHaveLength(8);
    expect(alexGoals.map((goal) => goal.title)).toEqual([
      "Strength",
      "Tempo run",
      "Read 20 pages",
      "Launch copy",
      "Weekly review",
      "Conference proposal",
      "Monthly budget review",
      "Neighborhood cleanup",
    ]);
    expect(
      alexGoals.find((goal) => goal.id === DEMO_GOAL_IDS.strength)?.frequency_type
    ).toBe("recurring");
    expect(
      alexGoals.find((goal) => goal.id === DEMO_GOAL_IDS.conferenceProposal)
        ?.frequency_type
    ).toBe("fixed_milestones");
    expect(
      alexGoals.find((goal) => goal.id === DEMO_GOAL_IDS.neighborhoodCleanup)?.team_id
    ).toBeTruthy();
  });

  it("includes history, a duo, one challenge, and a leaderboard Alex does not lead", () => {
    expect(snapshot.completions.length).toBeGreaterThan(20);
    expect(
      snapshot.completions.some(
        (completion) =>
          completion.goal_id === DEMO_GOAL_IDS.readPages &&
          completion.completed_on === "2026-08-22"
      )
    ).toBe(false);
    expect(snapshot.duoState.activePartner?.partnerId).toBeTruthy();
    expect(snapshot.challenge.viewerJoined).toBe(true);
    expect(snapshot.standings[0]?.subjectId).not.toBe(DEMO_ALEX_ID);
    expect(
      snapshot.standings.find((standing) => standing.subjectId === DEMO_ALEX_ID)?.rank
    ).toBeGreaterThan(1);
  });
});
