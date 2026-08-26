import { describe, expect, it } from "vitest";
import {
  createChecklistTemporalContext,
  getPlannerCalendarPeriodKey,
  getProgressDisplayPeriodKey,
  getXPCreditPeriodKey,
} from "./period-domain";

describe("explicit period domains", () => {
  it("keeps checklist temporal scope explicit", () => {
    expect(
      createChecklistTemporalContext({
        selectedDate: "2026-08-12",
        asOfDate: "2026-08-25",
      })
    ).toEqual({
      selectedDate: "2026-08-12",
      asOfDate: "2026-08-25",
      weeklyAnchor: null,
    });

    expect(
      createChecklistTemporalContext({
        selectedDate: "2026-08-12",
        asOfDate: "2026-08-25",
        weeklyAnchor: { weekStartsOn: 0 },
      }).weeklyAnchor
    ).toEqual({ weekStartsOn: 0 });
  });

  it.each([
    {
      id: "weekly-aligned",
      anchorDate: "2026-08-03",
      referenceDate: "2026-08-12",
      interval: "weekly" as const,
      weekStartsOn: 1,
      progress: "2026-08-10",
      planner: "2026-08-10",
      xp: "2026-08-10",
    },
    {
      id: "weekly-goal-anchored-drift",
      anchorDate: "2026-08-06",
      referenceDate: "2026-08-13",
      interval: "weekly" as const,
      weekStartsOn: 1,
      progress: "2026-08-10",
      planner: "2026-08-10",
      xp: "2026-08-13",
    },
    {
      id: "monthly-goal-anchored-drift",
      anchorDate: "2026-01-31",
      referenceDate: "2026-02-28",
      interval: "monthly" as const,
      weekStartsOn: 1,
      progress: "2026-02-01",
      planner: "2026-02-01",
      xp: "2026-02-28",
    },
    {
      id: "daily-aligned",
      anchorDate: "2026-08-01",
      referenceDate: "2026-08-12",
      interval: "daily" as const,
      weekStartsOn: 1,
      progress: "2026-08-12",
      planner: "2026-08-12",
      xp: "2026-08-12",
    },
  ])(
    "preserves the $id period identities",
    ({
      anchorDate,
      referenceDate,
      interval,
      weekStartsOn,
      progress,
      planner,
      xp,
    }) => {
      expect(
        getProgressDisplayPeriodKey(
          anchorDate,
          interval,
          referenceDate,
          { weekStartsOn }
        )
      ).toBe(progress);
      expect(
        getPlannerCalendarPeriodKey(interval, referenceDate, weekStartsOn)
      ).toBe(planner);
      expect(getXPCreditPeriodKey(anchorDate, interval, referenceDate)).toBe(xp);
    }
  );
});
