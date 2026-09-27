import { describe, expect, it } from "vitest";
import { dayCount, initialState, monthDays, progressFacts, visibleSessions } from "./model";

describe("interface craft sample model", () => {
  it("keeps history and monthly progress on the same recorded total after a completion", () => {
    const state = { ...initialState(), period: "month" as const };
    for (const completed of [state.completed, [...state.completed, "run-wed"]]) {
      const history = monthDays(9).reduce<number>((sum, day) => sum + (day ? dayCount(9, day, completed) : 0), 0);
      expect(history).toBe(progressFacts({ ...state, completed }).done);
    }
  });
  it("lays out Monday-first months without losing end-of-month days", () => {
    expect(monthDays(9).slice(0, 3)).toEqual([null, 1, 2]);
    expect(monthDays(8).slice(0, 7)).toEqual([null, null, null, null, null, 1, 2]);
    expect(monthDays(8).filter(Boolean)).toHaveLength(31);
    expect(monthDays(9).filter(Boolean)).toHaveLength(30);
  });
  it("composes category, search and focused-day filters", () => {
    expect(visibleSessions({ ...initialState(), category: "Health", query: " EASY ", view: "Day" }).map(item => item.id)).toEqual(["run-wed"]);
  });
});
