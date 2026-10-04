import { describe, expect, it } from "vitest";
import { coachContextSummary } from "./context-summary";
import type { CoachContext } from "./contracts";
const context: CoachContext = {
  schemaVersion: 1, asOf: "2026-10-02T12:00:00Z", revision: "1", timezone: "UTC", timezoneConfirmed: true,
  today: { date: "2026-10-02", scheduled: 2, completed: 1, allCompletions: 7 },
  week: { start: "2026-09-28", end: "2026-10-04", weekStartsOn: 1, scheduled: 8, completed: 3, allCompletions: 12 },
  page: { surface: "plan", scope: "self", hasDraft: false, selectedTaskId: "task" }, pagePurpose: "Plan", scopeNote: "Your own work",
  sessions: [], selectedSessions: [], goals: [], goalsCount: 0,
  tasks: [
    { id: "task", title: "One-off", date: "2026-10-02", completed: true, updatedAt: "now" },
    { id: "later", title: "Tomorrow", date: "2026-10-03", completed: false, updatedAt: "now" },
    { id: "overdue", title: "Carryover", date: "2026-09-20", completed: false, updatedAt: "now" },
    { id: "selected-future", title: "Next month", date: "2026-11-01", completed: false, updatedAt: "now" },
  ],
};
describe("current coach display facts", () => {
  it("counts one-off tasks within each period and keeps off-plan completions separate", () => {
    const summary = coachContextSummary(context);
    expect(summary.today).toEqual({ scheduled: 3, completed: 2 });
    expect(summary.week).toEqual({ scheduled: 10, completed: 4 });
    expect(summary.overdueTasks).toBe(1);
    expect(summary.selected?.title).toBe("One-off");
  });
  it("retains selected work outside today and this week without inflating the totals", () => {
    const summary = coachContextSummary({ ...context, page: { ...context.page, selectedTaskId: "selected-future" } });
    expect(summary.selected?.title).toBe("Next month");
    expect(summary.week.scheduled).toBe(10);
  });
});
