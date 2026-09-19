import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS } from "@cadence/shared/brand";
import {
  buildInsightsLedgerGoals,
  countFilteredInsightsFactsByDay,
  insightsLedgerDayLabel,
  insightsLedgerRateLabel,
} from "./insights-ledger-model";
import type { MobileGoal } from "../checklist/checklist-lane-data";

const goal = {
  id: "g1",
  owner_id: "u1",
  title: "Lift",
  description: null,
  category: "Health",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 3,
  start_date: "2026-09-01",
  end_date: null,
  team_id: null,
  photo_path: null,
  archived_at: null,
  is_deleted: false,
  color: null,
} satisfies MobileGoal;

describe("insights ledger model", () => {
  it("filters heatmap counts to the selected goals", () => {
    expect(
      countFilteredInsightsFactsByDay(
        [
          { goal_id: "g1", completed_on: "2026-09-01", source: "manual" },
          { goal_id: "g2", completed_on: "2026-09-01", source: "manual" },
          { goal_id: "g1", completed_on: "2026-09-02", source: "manual" },
        ],
        ["g1"]
      )
    ).toEqual({
      "2026-09-01": 1,
      "2026-09-02": 1,
    });
  });

  it("uses category fill and period rate labels", () => {
    const rows = buildInsightsLedgerGoals({
      goals: [goal],
      facts: [{ goal_id: "g1", completed_on: "2026-09-01", source: "manual" }],
      summaries: [
        {
          goalId: "g1",
          admissibleCompletionCount: 1,
          creditedUnitCount: 1,
          expectedUnitCount: 3,
          percent: 33,
          lifecycle: "active",
          outcome: "in_progress",
          placementTerminal: false,
          periodSatisfied: false,
          currentPeriodCompletionCount: 1,
          currentPeriodTarget: 3,
          closedPeriodHitRatePercent: null,
          currentStreak: 1,
          longestStreak: 1,
          milestoneDates: [],
        },
      ],
    });
    expect(rows).toEqual([
      {
        id: "g1",
        title: "Lift",
        color: CATEGORY_COLORS.health,
        rateLabel: "1/3 this period · 1 total",
      },
    ]);
    expect(
      insightsLedgerRateLabel({ completionCount: 2, summary: undefined })
    ).toBe("2 completions");
    expect(insightsLedgerDayLabel("2026-09-01", 1)).toBe(
      "2026-09-01: 1 completion"
    );
    expect(insightsLedgerDayLabel("2026-09-02", 0)).toBe(
      "2026-09-02: 0 completions"
    );
  });
});
