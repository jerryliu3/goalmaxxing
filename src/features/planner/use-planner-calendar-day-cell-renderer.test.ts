import { describe, expect, it } from "vitest";
import { resolveWeekAgendaSelectionViewMode } from "@/features/planner/use-planner-calendar-day-cell-renderer";

describe("resolveWeekAgendaSelectionViewMode", () => {
  it("keeps week view so tapping a row only selects the day", () => {
    expect(resolveWeekAgendaSelectionViewMode()).toBe("week");
  });
});
