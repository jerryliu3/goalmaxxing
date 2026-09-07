import { describe, expect, it } from "vitest";
import { shouldShowPlanTodayShortcut } from "./calendar-today-shortcut";

describe("shouldShowPlanTodayShortcut", () => {
  it("shows Today whenever the checklist day is not today", () => {
    expect(shouldShowPlanTodayShortcut("2026-08-31", "2026-08-15")).toBe(true);
    expect(shouldShowPlanTodayShortcut("2026-08-15", "2026-08-15")).toBe(false);
  });
});
