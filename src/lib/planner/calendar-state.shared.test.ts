import { describe, expect, it } from "vitest";
import { normalizeCalendarState } from "@cadence/shared/planner/calendar-state";
import {
  normalizeCalendarRoute,
  normalizeChecklistShellRoute,
} from "@/lib/planner/calendar-route";

describe("normalizeChecklistShellRoute", () => {
  it("falls back to today for an invalid tab", () => {
    const result = normalizeChecklistShellRoute({
      searchParams: new URLSearchParams("tab=nope"),
      defaultCalendarViewMode: "month",
    });
    expect(result.tab).toBe("today");
    expect(result.changed).toBe(true);
    expect(result.nextParams.get("tab")).toBe("today");
  });

  it("promotes a valid day into calendar day view", () => {
    const result = normalizeChecklistShellRoute({
      searchParams: new URLSearchParams("day=2026-08-13"),
      defaultCalendarViewMode: "month",
    });
    expect(result).toMatchObject({
      tab: "calendar",
      month: "2026-08",
      day: "2026-08-13",
      viewMode: "day",
      changed: true,
    });
  });

  it("does not promote a valid day when the today tab is explicit", () => {
    const result = normalizeChecklistShellRoute({
      searchParams: new URLSearchParams("tab=today&day=2026-08-13"),
      defaultCalendarViewMode: "month",
    });
    expect(result.tab).toBe("today");
    expect(result.day).toBe("2026-08-13");
    expect(result.changed).toBe(false);
  });

  it("drops an invalid day instead of keeping it", () => {
    const result = normalizeChecklistShellRoute({
      searchParams: new URLSearchParams("tab=today&day=2026-13-40"),
      defaultCalendarViewMode: "month",
    });
    expect(result.day).toBeNull();
    expect(result.nextParams.has("day")).toBe(false);
  });

  it("keeps an explicit day in month view on the calendar tab", () => {
    const result = normalizeChecklistShellRoute({
      searchParams: new URLSearchParams(
        "tab=calendar&view=month&month=2026-08&day=2026-08-13"
      ),
      defaultCalendarViewMode: "month",
    });
    expect(result.viewMode).toBe("month");
    expect(result.day).toBe("2026-08-13");
    expect(result.month).toBe("2026-08");
  });
});

describe("normalizeCalendarState", () => {
  it("fills a day for week view on the calendar surface", () => {
    const result = normalizeCalendarState({
      month: "2026-08",
      viewMode: "week",
      defaultCalendarViewMode: "month",
      surface: "calendar",
    });
    expect(result.day).toBe("2026-08-01");
    expect(result.viewMode).toBe("week");
    expect(result.month).toBe("2026-08");
  });

  it("keeps an explicit today tab with a valid day", () => {
    const result = normalizeCalendarState({
      tab: "today",
      day: "2026-08-13",
      defaultCalendarViewMode: "month",
      surface: "checklist-shell",
    });
    expect(result.tab).toBe("today");
    expect(result.day).toBe("2026-08-13");
    expect(result.viewMode).toBe("month");
  });
});

describe("normalizeCalendarRoute", () => {
  it("maps checklist and tasks surfaces into Plan day", () => {
    const checklist = normalizeCalendarRoute({
      searchParams: new URLSearchParams("surface=checklist"),
      defaultCalendarViewMode: "week",
    });
    expect(checklist.viewMode).toBe("day");
    expect(checklist.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(checklist.nextParams.get("view")).toBe("day");
    expect(checklist.nextParams.get("surface")).toBeNull();
    expect(checklist.changed).toBe(true);

    const tasks = normalizeCalendarRoute({
      searchParams: new URLSearchParams("surface=tasks&day=2026-08-13"),
      defaultCalendarViewMode: "week",
    });
    expect(tasks.viewMode).toBe("day");
    expect(tasks.day).toBe("2026-08-13");
    expect(tasks.nextParams.get("surface")).toBeNull();
  });

  it("drops the legacy calendar surface query without changing the view", () => {
    const result = normalizeCalendarRoute({
      searchParams: new URLSearchParams("surface=calendar&view=week&day=2026-08-13"),
      defaultCalendarViewMode: "week",
    });
    expect(result.viewMode).toBe("week");
    expect(result.nextParams.get("surface")).toBeNull();
    expect(result.nextParams.get("view")).toBe("week");
  });

  it("maps three_day URLs to week", () => {
    const result = normalizeCalendarRoute({
      searchParams: new URLSearchParams("view=three_day&day=2026-08-13"),
      defaultCalendarViewMode: "month",
    });
    expect(result.viewMode).toBe("week");
    expect(result.nextParams.get("view")).toBe("week");
    expect(result.day).toBe("2026-08-13");
  });

  it("keeps the selected day in month view", () => {
    const result = normalizeCalendarRoute({
      searchParams: new URLSearchParams("view=month&month=2026-08&day=2026-08-13"),
      defaultCalendarViewMode: "month",
    });
    expect(result.viewMode).toBe("month");
    expect(result.day).toBe("2026-08-13");
    expect(result.nextParams.get("day")).toBe("2026-08-13");
  });
});
