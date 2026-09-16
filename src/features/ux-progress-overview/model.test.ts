import { describe, expect, it } from "vitest";
import {
  GOAL_COUNTS,
  historyCounts,
  MONTH_COUNTS,
  MONTH_FACTS,
  parseOverviewView,
  selectedFacts,
  viewHref,
  WEEK_SUMMARY,
  WEEKDAY_COUNTS,
} from "./model";
import { ACTIVE_GOALS, COMPLETIONS } from "./seed";

describe("progress overview model", () => {
  it("keeps overview routing shallow and predictable", () => {
    expect(parseOverviewView(null)).toBe("overview");
    expect(parseOverviewView("unknown")).toBe("overview");
    expect(parseOverviewView("history")).toBe("history");
    expect(viewHref("overview")).toBe("/ux/progress-overview");
    expect(viewHref("folios")).toBe("/ux/progress-overview?view=folios");
  });

  it("derives month, week, and goal summaries from the same completion facts", () => {
    expect(selectedFacts(ACTIVE_GOALS.map((goal) => goal.id))).toHaveLength(
      COMPLETIONS.length
    );
    expect(MONTH_FACTS.every((fact) => fact.completed_on.startsWith("2026-09"))).toBe(
      true
    );
    expect(MONTH_COUNTS["2026-09-01"]).toBe(2);
    expect(WEEK_SUMMARY).toEqual({ done: 6, planned: 12 });
    expect(WEEKDAY_COUNTS.reduce((sum, day) => sum + day.count, 0)).toBe(
      MONTH_FACTS.length
    );
    expect(GOAL_COUNTS.find((goal) => goal.id === "read")?.count).toBe(11);
  });

  it("filters history without losing same-day completions", () => {
    expect(historyCounts(["run", "strength"])["2026-09-01"]).toBe(1);
    expect(historyCounts(["read"])["2026-09-01"]).toBe(1);
    expect(historyCounts([])).toEqual({});
  });
});
