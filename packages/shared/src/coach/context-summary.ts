import type { CoachContext } from "./contracts";

/** Display totals include one-off tasks without treating them as goal completions. */
export function coachContextSummary(context: CoachContext) {
  const todayTasks = context.tasks.filter(task => task.date === context.today.date);
  const weekTasks = context.tasks.filter(task => task.date >= context.week.start && task.date <= context.week.end);
  return {
    today: { scheduled: context.today.scheduled + todayTasks.length, completed: context.today.completed + todayTasks.filter(task => task.completed).length },
    week: { scheduled: context.week.scheduled + weekTasks.length, completed: context.week.completed + weekTasks.filter(task => task.completed).length },
    overdueTasks: context.tasks.filter(task => task.date < context.today.date && !task.completed).length,
    selected: context.selectedSessions.find(row => row.id === context.page.selectedItemId)
      ?? context.tasks.find(row => row.id === context.page.selectedTaskId)
      ?? context.goals.find(row => row.id === context.page.selectedGoalId),
  };
}
