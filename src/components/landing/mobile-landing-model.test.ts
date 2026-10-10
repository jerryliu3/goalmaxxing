import { describe, expect, it } from "vitest";
import {
  canRecordLandingSession,
  landingExampleGoalFields,
  landingExampleSessions,
} from "./mobile-landing-model";

describe("mobile marketing example", () => {
  it.each([8, 12] as const)(
    "keeps the %i day card and month consistent",
    (target) => {
      const sessions = landingExampleSessions(target, "original");
      expect(sessions).toHaveLength(target);
      expect(new Set(sessions.map((session) => session.date)).size).toBe(
        target,
      );
      expect(landingExampleGoalFields(target)).toMatchObject({
        target_count: String(target),
        target_basis: "period",
        recurrence_interval: "monthly",
      });
    },
  );
  it("moves one stable session without increasing placed work", () => {
    const original = landingExampleSessions(8, "original");
    const draft = landingExampleSessions(8, "draft");
    expect(draft).toHaveLength(original.length);
    expect(draft.filter((session) => session.changed)).toEqual([
      {
        id: "run-8",
        date: "2026-10-09",
        title: "Make room for running",
        changed: true,
      },
    ]);
    expect(landingExampleSessions(8, "saved")).toEqual(draft);
    expect(draft.filter((session) => !session.changed)).toEqual(
      original.filter((session) => session.id !== "run-8"),
    );
  });
  it("records only past/present dates with no pending move", () => {
    expect(canRecordLandingSession("2026-10-05", false)).toBe(true);
    expect(canRecordLandingSession("2026-10-08", false)).toBe(true);
    expect(canRecordLandingSession("2026-10-09", false)).toBe(false);
    expect(canRecordLandingSession("2026-10-08", true)).toBe(false);
  });
});
