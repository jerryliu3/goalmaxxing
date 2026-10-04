import { describe, expect, it } from "vitest";
import type { CoachContext } from "@cadence/shared/coach";
import { boundCoachFacts } from "./prompt-context";

describe("bounded coach facts", () => {
  it("keeps selected work and today's tasks ahead of a large overdue backlog", () => {
    const facts = {
      page: { selectedGoalId: "selected-goal", selectedItemId: "selected-session" },
      today: { date: "2026-10-02" }, week: { start: "2026-09-28" },
      sessions: [], selectedSessions: [{ id: "selected-session", goalId: "selected-goal" }],
      goals: [...Array.from({ length: 80 }, (_, i) => ({ id: `goal-${i}` })), { id: "selected-goal" }],
      tasks: [...Array.from({ length: 100 }, (_, i) => ({ id: `old-${i}`, date: "2026-09-01", completed: false })), { id: "today", date: "2026-10-02", completed: false }],
    } as unknown as CoachContext;
    const result = boundCoachFacts(facts, facts.goals.map(goal => goal.id));
    expect(result.goals[0].id).toBe("selected-goal");
    expect(result.tasks[0].id).toBe("today");
    expect(result.selectedSessions[0].id).toBe("selected-session");
    expect(result.omitted).toMatchObject({ goals: 21, tasks: 21 });
    expect(facts.tasks[0].id).toBe("old-0");
  });
});
