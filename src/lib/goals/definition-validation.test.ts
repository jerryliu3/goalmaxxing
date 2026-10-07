import { describe, expect, it } from "vitest";
import {
  MAX_GOAL_TARGET_COUNT,
  MAX_HORIZON_MONTHS,
} from "@/lib/planner/contracts/bounds";
import {
  getGoalDeadlineMonthSpan,
  getGoalHorizonEndDate,
  isOrdinalGoalDefinition,
  resolveGoalPlanningEndDate,
  validateGoalDefinition,
} from "@/lib/goals/definition-validation";

describe("goal definition validation", () => {
  it("classifies milestone and targeted recurring goals as ordinal", () => {
    expect(
      isOrdinalGoalDefinition({
        frequencyType: "fixed_milestones",
        targetCount: null,
      })
    ).toBe(true);
    expect(
      isOrdinalGoalDefinition({
        frequencyType: "recurring",
        targetCount: 10,
      })
    ).toBe(true);
    expect(
      isOrdinalGoalDefinition({
        frequencyType: "recurring",
        targetCount: 10,
        targetBasis: "period",
      })
    ).toBe(false);
    expect(
      isOrdinalGoalDefinition({
        frequencyType: "recurring",
        targetCount: null,
      })
    ).toBe(false);
  });

  it("allows open-ended cadence goals", () => {
    expect(
      validateGoalDefinition({
        frequencyType: "recurring",
        targetCount: null,
        startDate: "2026-08-01",
        endDate: null,
      })
    ).toEqual([]);
    expect(
      validateGoalDefinition({
        frequencyType: "recurring",
        targetCount: 0,
        startDate: "2026-08-01",
        endDate: null,
      })
    ).toEqual([]);
  });

  it("allows missing deadlines for ordinal goals via the soft horizon", () => {
    expect(
      validateGoalDefinition({
        frequencyType: "fixed_milestones",
        targetCount: 3,
        startDate: "2026-08-01",
        endDate: null,
      })
    ).toEqual([]);
    expect(
      validateGoalDefinition({
        frequencyType: "recurring",
        targetCount: 12,
        startDate: "2026-08-01",
        endDate: null,
      })
    ).toEqual([]);
  });

  it("enforces the deadline month-span cap", () => {
    expect(
      getGoalDeadlineMonthSpan({
        startDate: "2026-01-01",
        endDate: "2027-12-31",
      })
    ).toBe(MAX_HORIZON_MONTHS);
    expect(
      validateGoalDefinition({
        frequencyType: "recurring",
        targetCount: 12,
        targetBasis: "lifetime",
        startDate: "2026-01-01",
        endDate: "2028-01-01",
      })[0]
    ).toMatchObject({ code: "horizon_too_long" });
    expect(getGoalHorizonEndDate("2026-01-01")).toBe("2027-12-31");
    expect(
      getGoalDeadlineMonthSpan({
        startDate: "2026-01-01",
        endDate: getGoalHorizonEndDate("2026-01-01") ?? "",
      })
    ).toBe(MAX_HORIZON_MONTHS);
  });

  it("uses strict civil-date parsing for month-span checks", () => {
    expect(
      getGoalDeadlineMonthSpan({
        startDate: "2026-02-30",
        endDate: "2026-03-01",
      })
    ).toBeNull();
    expect(
      getGoalDeadlineMonthSpan({
        startDate: "2026-01-01",
        endDate: "2026-13-45",
      })
    ).toBeNull();
  });

  it("computes rolling soft-horizon end dates from max(start, asOf)", () => {
    expect(
      resolveGoalPlanningEndDate({
        frequencyType: "fixed_milestones",
        targetCount: 3,
        startDate: "2026-01-01",
        endDate: null,
        asOfDate: "2026-08-15",
      })
    ).toBe("2028-07-31");
    expect(
      resolveGoalPlanningEndDate({
        frequencyType: "fixed_milestones",
        targetCount: 3,
        startDate: "2026-10-01",
        endDate: null,
        asOfDate: "2026-08-15",
      })
    ).toBe("2028-09-30");
  });

  it("plans open-ended weekly and monthly totals across their cadence, not the two-year horizon", () => {
    expect(
      resolveGoalPlanningEndDate({
        frequencyType: "recurring",
        recurrenceInterval: "weekly",
        targetCount: 3,
        targetBasis: "lifetime",
        startDate: "2026-10-07",
        endDate: null,
        asOfDate: "2026-10-07",
      })
    ).toBe("2026-10-27");
    expect(
      resolveGoalPlanningEndDate({
        frequencyType: "recurring",
        recurrenceInterval: "monthly",
        targetCount: 3,
        targetBasis: "lifetime",
        startDate: "2026-10-07",
        endDate: null,
        asOfDate: "2026-10-07",
      })
    ).toBe("2027-01-06");
    expect(
      resolveGoalPlanningEndDate({
        frequencyType: "recurring",
        recurrenceInterval: "weekly",
        targetCount: 3,
        targetBasis: "period",
        startDate: "2026-10-07",
        endDate: null,
        asOfDate: "2026-10-07",
      })
    ).toBeNull();
  });

  it("skips the days-left warning without a schedule context", () => {
    const issues = validateGoalDefinition({
      frequencyType: "fixed_milestones",
      targetCount: 6,
      startDate: "2026-08-01",
      endDate: "2026-08-07",
    });
    expect(
      issues.some((issue) => issue.code === "target_exceeds_capacity")
    ).toBe(false);
  });

  it("rejects ordinal targets above the supported planner target limit", () => {
    const issues = validateGoalDefinition({
      frequencyType: "fixed_milestones",
      targetCount: MAX_GOAL_TARGET_COUNT + 1,
      startDate: "2026-08-01",
      endDate: "2026-09-30",
    });
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "target_exceeds_limit",
      })
    );
    expect(issues.find((issue) => issue.code === "target_exceeds_limit")?.message).toContain(
      String(MAX_GOAL_TARGET_COUNT)
    );
  });

  it("reports target-limit issues even when date ranges are invalid", () => {
    const issues = validateGoalDefinition({
      frequencyType: "fixed_milestones",
      targetCount: MAX_GOAL_TARGET_COUNT + 1,
      startDate: "2026-08-15",
      endDate: "2026-08-01",
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "target_exceeds_limit" }),
        expect.objectContaining({ code: "invalid_date_range" }),
      ])
    );
  });

  it("enforces recurring period upper bounds without capacity context", () => {
    const baseInput = {
      frequencyType: "recurring" as const,
      targetBasis: "period" as const,
      startDate: "2026-08-01",
      endDate: null,
    };

    expect(
      validateGoalDefinition({
        ...baseInput,
        recurrenceInterval: "weekly",
        targetCount: 7,
      })
    ).toEqual([]);

    expect(
      validateGoalDefinition({
        ...baseInput,
        recurrenceInterval: "monthly",
        targetCount: 31,
      })
    ).toEqual([]);

    expect(
      validateGoalDefinition({
        ...baseInput,
        recurrenceInterval: "daily",
        targetCount: 1,
      })
    ).toEqual([]);

    const weeklyOverMax = validateGoalDefinition({
      ...baseInput,
      recurrenceInterval: "weekly",
      targetCount: 8,
    });
    expect(weeklyOverMax).toContainEqual(
      expect.objectContaining({
        code: "target_exceeds_period_limit",
        message: "Target cannot exceed 7 completions for this period length.",
      })
    );

    const monthlyOverMax = validateGoalDefinition({
      ...baseInput,
      recurrenceInterval: "monthly",
      targetCount: 32,
    });
    expect(monthlyOverMax).toContainEqual(
      expect.objectContaining({
        code: "target_exceeds_period_limit",
        message: "Target cannot exceed 31 completions for this period length.",
      })
    );

    const dailyOverMax = validateGoalDefinition({
      ...baseInput,
      recurrenceInterval: "daily",
      targetCount: 2,
    });
    expect(dailyOverMax).toContainEqual(
      expect.objectContaining({
        code: "target_exceeds_period_limit",
        message: "Target cannot exceed 1 completions for this period length.",
      })
    );
  });

  describe("days-left warning", () => {
    const schedule = { weekStartsOn: 1 };
    const warning = (input: Parameters<typeof validateGoalDefinition>[0]) =>
      validateGoalDefinition(input).find((issue) => issue.code === "target_exceeds_capacity")
        ?.message;

    it("warns when more sessions remain than days left before the deadline", () => {
      expect(
        warning({
          frequencyType: "fixed_milestones",
          targetCount: 10,
          startDate: "2026-09-01",
          endDate: "2026-09-30",
          asOfDate: "2026-09-28",
          schedule,
        })
      ).toBe(
        "Only 3 days left before Sep 30, 2026, so 10 remaining sessions might not all fit."
      );
    });

    it("counts rest days and blackouts as available days", () => {
      expect(
        warning({
          frequencyType: "fixed_milestones",
          targetCount: 7,
          startDate: "2026-08-03",
          endDate: "2026-08-09",
          asOfDate: "2026-08-03",
          schedule,
        })
      ).toBeUndefined();
    });

    it("credits existing completions against the remaining target", () => {
      const base = {
        frequencyType: "fixed_milestones" as const,
        targetCount: 6,
        startDate: "2026-08-01",
        endDate: "2026-08-07",
        asOfDate: "2026-08-05",
        schedule,
      };
      expect(warning(base)).toContain("6 remaining sessions");
      expect(warning({ ...base, completedCount: 3 })).toBeUndefined();
    });

    it("raises no warning once the goal window has elapsed", () => {
      expect(
        warning({
          frequencyType: "fixed_milestones",
          targetCount: 3,
          startDate: "2026-09-01",
          endDate: "2026-09-30",
          asOfDate: "2026-10-07",
          schedule,
        })
      ).toBeUndefined();
    });

    it("checks a period target against the days left in the current period", () => {
      const base = {
        frequencyType: "recurring" as const,
        targetBasis: "period" as const,
        recurrenceInterval: "weekly" as const,
        targetCount: 3,
        startDate: "2026-08-03",
        endDate: "2026-12-31",
        // Saturday: Sat and Sun are left in a Monday-start week.
        asOfDate: "2026-08-08",
        schedule,
      };
      expect(warning(base)).toBe("Only 2 days left this week, so 3 sessions might not all fit.");
      expect(warning({ ...base, currentPeriodCompletedCount: 1 })).toBeUndefined();
    });

    it("groups weekly periods by the profile week start", () => {
      const base = {
        frequencyType: "recurring" as const,
        targetBasis: "period" as const,
        recurrenceInterval: "weekly" as const,
        targetCount: 3,
        startDate: "2026-08-03",
        endDate: "2026-12-31",
        // Sunday: the last day of a Monday-start week, the first of a Sunday-start one.
        asOfDate: "2026-08-09",
      };
      expect(warning({ ...base, schedule: { weekStartsOn: 1 } })).toContain("Only 1 day left");
      expect(warning({ ...base, schedule: { weekStartsOn: 0 } })).toBeUndefined();
    });

    it("never flags a full future period", () => {
      expect(
        warning({
          frequencyType: "recurring",
          targetBasis: "period",
          recurrenceInterval: "monthly",
          targetCount: 28,
          startDate: "2026-09-01",
          endDate: "2026-12-31",
          asOfDate: "2026-08-20",
          schedule,
        })
      ).toBeUndefined();
    });
  });
});
