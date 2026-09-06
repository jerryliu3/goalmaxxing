import { describe, expect, it } from "vitest";
import { resolveWeekAgendaSelectionViewMode } from "@/features/planner/use-planner-calendar-day-cell-renderer";

describe("resolveWeekAgendaSelectionViewMode", () => {
  it("keeps week view on desktop so the day pane can follow the selected row", () => {
    expect(resolveWeekAgendaSelectionViewMode(true)).toBe("week");
  });

  it("opens Day on mobile where the two-pane is hidden", () => {
    expect(resolveWeekAgendaSelectionViewMode(false)).toBe("day");
  });
});
