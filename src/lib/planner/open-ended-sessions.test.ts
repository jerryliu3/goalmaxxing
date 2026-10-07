import { describe, expect, it } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { PLANNER_CONTRACT_VERSION, PLANNER_ELIGIBILITY_MODES } from "@/lib/planner/contracts/bounds";
import { runPlannerKernel } from "@/lib/planner/kernel";
import { createDefaultPlannerPolicy } from "@/lib/planner/policy";

const asOfDate = "2026-10-07";

function scheduledDates({
  interval,
  targetBasis,
  endDate,
}: {
  interval: "weekly" | "monthly";
  targetBasis: "period" | "lifetime";
  endDate: string | null;
}) {
  const goal = buildGoal({
    frequency_type: "recurring",
    recurrence_interval: interval,
    target_basis: targetBasis,
    target_count: targetBasis === "period" ? 1 : 3,
    start_date: asOfDate,
    end_date: endDate,
  });
  const output = runPlannerKernel({
    schemaVersion: PLANNER_CONTRACT_VERSION,
    eligibilityMode: PLANNER_ELIGIBILITY_MODES[0],
    ownerId: goal.owner_id,
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    asOfDate,
    timezone: "America/New_York",
    goals: [goal],
    completions: [],
    links: [],
    policy: createDefaultPlannerPolicy("America/New_York", `${asOfDate}T00:00:00Z`),
    basePlan: null,
    preserveExistingAssignments: true,
  });
  return output.workUnits
    .map((unit) => unit.scheduledDate)
    .filter((date): date is string => date !== null);
}

describe("open-ended weekly and monthly sessions", () => {
  it("places period sessions in the month the goal starts", () => {
    expect(scheduledDates({ interval: "weekly", targetBasis: "period", endDate: null }).some((date) => date.startsWith("2026-10"))).toBe(true);
    expect(scheduledDates({ interval: "monthly", targetBasis: "period", endDate: null }).some((date) => date.startsWith("2026-10"))).toBe(true);
  });

  it("places lifetime totals without a deadline in the next two months", () => {
    for (const interval of ["weekly", "monthly"] as const) {
      const dates = scheduledDates({ interval, targetBasis: "lifetime", endDate: null });
      expect(dates.length).toBeGreaterThan(0);
      expect(dates.every((date) => date >= "2026-10-01" && date <= "2026-11-30")).toBe(true);
    }
  });
});
