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

  it("keeps one in-progress checklist goal per category", () => {
    const activeAlexGoals = alexGoalsFromSnapshot(snapshot).filter(
      (goal) => goal.end_date === null || goal.end_date >= "2026-08-22"
    );
    expect(activeAlexGoals.map((goal) => goal.title).sort()).toEqual([
      "Conference proposal",
      "Neighborhood cleanup",
      "Read 20 pages",
      "Strength",
    ]);
    expect(new Set(activeAlexGoals.map((goal) => goal.category_key)).size).toBe(4);
  });

  it("keeps daily habits sparse and targeted below half the date span", () => {
    const dailyGoals = snapshot.goals.filter(
      (goal) => goal.frequency_type === "recurring" && goal.recurrence_interval === "daily"
    );
    expect(dailyGoals).toHaveLength(1);
    const reading = dailyGoals[0];
    expect(reading?.title).toBe("Read 20 pages");
    expect(reading?.end_date).toBeTruthy();
    const span =
      reading && reading.end_date
        ? Math.floor(
            (Date.parse(`${reading.end_date}T00:00:00Z`) -
              Date.parse(`${reading.start_date}T00:00:00Z`)) /
              86_400_000
          ) + 1
        : 0;
    expect(reading?.target_count).toBeGreaterThan(0);
    expect(reading?.target_count ?? 0).toBeLessThan(span / 2);
    expect(
      snapshot.plannerItems.filter(
        (item) =>
          item.goal_id === DEMO_GOAL_IDS.readPages && item.scheduled_date === "2026-08-22"
      )
    ).toHaveLength(1);
  });

  it("includes history, a duo, one challenge, and a leaderboard Alex does not lead", () => {
    const completionDates = snapshot.completions.map((completion) => completion.completed_on);
    expect(snapshot.completions.length).toBeGreaterThan(20);
    expect(completionDates.some((date) => date <= "2025-09-22")).toBe(true);
    expect(completionDates.some((date) => date >= "2026-07-01")).toBe(true);
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
