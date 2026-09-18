import { describe, expect, it } from "vitest";
import { addDaysToDateString } from "@/lib/goals/periods";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import {
  artificialCadenceAssemblyTarget,
  CADENCE_ASSEMBLY_SOFT_HORIZON_DAYS,
  countFullCadencePeriodsInWindow,
} from "./cadence-assembly-target";

describe("cadence assembly target", () => {
  it("ignores milestones and lifetime totals", () => {
    expect(
      artificialCadenceAssemblyTarget(
        buildGoal({ frequency_type: "fixed_milestones", target_count: 3 })
      )
    ).toBeNull();
    expect(
      artificialCadenceAssemblyTarget(
        buildGoal({ target_basis: "lifetime", target_count: 12 })
      )
    ).toBeNull();
  });

  it("counts full days through an inclusive end date", () => {
    expect(
      countFullCadencePeriodsInWindow(
        { start_date: "2026-01-01", recurrence_interval: "daily" },
        "2026-01-10"
      )
    ).toBe(10);
  });

  it("excludes a trailing week that would extend past the end date", () => {
    // Week starts Sunday (0). Goal Mon 2026-01-05 → first week ends Sat 2026-01-10.
    expect(
      countFullCadencePeriodsInWindow(
        { start_date: "2026-01-05", recurrence_interval: "weekly" },
        "2026-01-08",
        { weekStartsOn: 0 }
      )
    ).toBe(0);
    expect(
      countFullCadencePeriodsInWindow(
        { start_date: "2026-01-05", recurrence_interval: "weekly" },
        "2026-01-10",
        { weekStartsOn: 0 }
      )
    ).toBe(1);
  });

  it("uses 90% of full periods, rounded, clamped to 1..20 when an end date exists", () => {
    const goal = buildGoal({
      target_basis: "period",
      recurrence_interval: "daily",
      start_date: "2026-01-01",
      end_date: "2026-01-20",
      target_count: 1,
    });
    // 20 full days → round(18) = 18
    expect(artificialCadenceAssemblyTarget(goal)).toBe(18);
  });

  it("clamps long horizons to 20", () => {
    const goal = buildGoal({
      target_basis: "period",
      recurrence_interval: "daily",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      target_count: 1,
    });
    expect(artificialCadenceAssemblyTarget(goal)).toBe(20);
  });

  it("never asks for fewer than one successful period", () => {
    const goal = buildGoal({
      target_basis: "period",
      recurrence_interval: "daily",
      start_date: "2026-01-01",
      end_date: "2026-01-01",
      target_count: 1,
    });
    expect(artificialCadenceAssemblyTarget(goal)).toBe(1);
  });

  it("assumes about two months when there is no end date", () => {
    const goal = buildGoal({
      target_basis: "period",
      recurrence_interval: "daily",
      start_date: "2026-01-01",
      end_date: null,
      target_count: 1,
    });
    const softEnd = addDaysToDateString(
      goal.start_date,
      CADENCE_ASSEMBLY_SOFT_HORIZON_DAYS
    );
    const full = countFullCadencePeriodsInWindow(goal, softEnd);
    expect(artificialCadenceAssemblyTarget(goal)).toBe(
      Math.min(20, Math.max(1, Math.round(full * 0.9)))
    );
  });

  it("uses fewer shards for a short weekly soft horizon than the daily clamp", () => {
    const weekly = buildGoal({
      target_basis: "period",
      recurrence_interval: "weekly",
      start_date: "2026-01-05",
      end_date: null,
      target_count: 3,
    });
    const target = artificialCadenceAssemblyTarget(weekly, { weekStartsOn: 1 });
    expect(target).toBeGreaterThanOrEqual(1);
    expect(target).toBeLessThan(20);
  });
});
