import { describe, expect, it } from "vitest";
import {
  formatSittingDate,
  formatSittingTime,
  snapshotToCreationFields,
} from "@/features/planner/planner-folio-fields";
import type { PlannerActiveGoalSnapshot } from "@/features/planner/calendar-surface.types";

describe("planner folio fields", () => {
  it("maps cadence, horizon, and time from the active goal snapshot", () => {
    const snapshot: PlannerActiveGoalSnapshot = {
      id: "goal-a",
      goal_id: "goal-a",
      original_goal_id: "goal-a",
      requirement_fingerprint: "cadence",
      title: "Tempo run",
      category: "health",
      color: "#4a6740",
      start_date: "2026-06-01",
      end_date: "2026-12-31",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 3,
      target_basis: "period",
      default_local_time: "07:30",
    };

    expect(snapshotToCreationFields(snapshot, "Tempo run")).toMatchObject({
      title: "Tempo run",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: "3",
      end_date: "2026-12-31",
      default_local_time: "07:30",
    });
  });

  it("formats sitting date and time as readable facts", () => {
    expect(formatSittingDate("2026-08-31")).toBe("Mon, Aug 31");
    expect(formatSittingTime("07:30")).toBe("7:30 AM");
    expect(formatSittingTime(null)).toBe("Any time");
  });
});
