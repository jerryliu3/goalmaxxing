import type { CoachContext } from "@cadence/shared/coach";

/** Bound model input while retaining the work the user is asking about. */
export function boundCoachFacts(facts: CoachContext, linkedGoalIds: string[]) {
  const relevantGoals = new Set([
    facts.page.selectedGoalId, ...linkedGoalIds,
    ...facts.selectedSessions.map(session => session.goalId),
  ]);
  const prioritizeSessions = (rows: CoachContext["sessions"]) => {
    const priority = (row: typeof rows[number]) =>
      row.id === facts.page.selectedItemId ? 2 : relevantGoals.has(row.goalId) ? 1 : 0;
    return [...rows].sort((a, b) => priority(b) - priority(a)).slice(0, 80);
  };
  const taskPriority = (task: CoachContext["tasks"][number]) => {
    if (task.id === facts.page.selectedTaskId) return 4;
    if (task.completed) return 0;
    if (task.date === facts.today.date) return 3;
    return task.date >= facts.week.start ? 2 : 1;
  };
  const goalPriority = (goal: CoachContext["goals"][number]) =>
    goal.id === facts.page.selectedGoalId ? 2 : relevantGoals.has(goal.id) ? 1 : 0;
  return {
    ...facts,
    sessions: prioritizeSessions(facts.sessions),
    selectedSessions: prioritizeSessions(facts.selectedSessions),
    tasks: [...facts.tasks].sort((a, b) => taskPriority(b) - taskPriority(a) || a.date.localeCompare(b.date)).slice(0, 80),
    goals: [...facts.goals].sort((a, b) => goalPriority(b) - goalPriority(a)).slice(0, 60),
    omitted: {
      sessions: Math.max(0, facts.sessions.length - 80),
      selectedSessions: Math.max(0, facts.selectedSessions.length - 80),
      tasks: Math.max(0, facts.tasks.length - 80),
      goals: Math.max(0, facts.goals.length - 60),
    },
  };
}
