import type { Goal } from "@/lib/goals/types";

export function withLifetimeTargetBasisForTests(
  goal: Goal,
  overrides: Partial<Goal> = {}
): Goal {
  const merged: Goal = {
    ...goal,
    ...overrides,
  };
  if (overrides.target_basis !== undefined) {
    return { ...merged, target_basis: overrides.target_basis };
  }
  if (merged.target_basis !== undefined) {
    return merged;
  }
  if (merged.frequency_type === "fixed_milestones") {
    return { ...merged, target_basis: "lifetime" };
  }
  if (
    merged.frequency_type === "recurring" &&
    typeof merged.target_count === "number" &&
    merged.target_count > 0
  ) {
    return { ...merged, target_basis: "lifetime" };
  }
  return { ...merged, target_basis: "period" };
}

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  const built: Goal = {
    id: "goal-1",
    owner_id: "user-1",
    title: "Run 5k",
    description: null,
    category: "health",
    color: "#10b981",
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    milestone_names: null,
    start_date: "2026-08-01",
    end_date: null,
    default_local_time: null,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
  return withLifetimeTargetBasisForTests(built, overrides);
}
