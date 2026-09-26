/** Capture order stays fixed when a task is completed, reopened, or rescheduled. */
export function orderPlannerTasks<T extends { task_id: string; created_at: string }>(
  tasks: readonly T[]
): T[] {
  return [...tasks].sort((left, right) =>
    right.created_at.localeCompare(left.created_at) || left.task_id.localeCompare(right.task_id)
  );
}
