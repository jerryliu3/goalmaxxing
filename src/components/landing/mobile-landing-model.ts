import type { GoalCreationFields } from "@/lib/goals/creation-model";
import { getCategorySwatchColor } from "@/lib/goals/category";

// A fixed, explicitly labelled illustration; never reads or writes account data.
export const LANDING_EXAMPLE_TODAY = "2026-10-08";
export const LANDING_EXAMPLE_MONTH = "2026-10";
export type LandingExampleTarget = 8 | 12;
export type LandingExampleMove = "original" | "draft" | "saved";
const regularDates = [1, 5, 8, 12, 15, 19, 22, 26];
const extraDates = [3, 10, 17, 24];
export const landingExampleDate = (day: number) =>
  `2026-10-${String(day).padStart(2, "0")}`;

export function landingExampleSessions(
  target: LandingExampleTarget,
  move: LandingExampleMove,
) {
  return [...regularDates, ...(target === 12 ? extraDates : [])]
    .sort((a, b) => a - b)
    .map((day) => ({
      id: `run-${day}`,
      date: landingExampleDate(day === 8 && move !== "original" ? 9 : day),
      title: "Make room for running",
      changed: day === 8 && move !== "original",
    }));
}

export function canRecordLandingSession(date: string, pendingMove: boolean) {
  return date <= LANDING_EXAMPLE_TODAY && !pendingMove;
}

export function landingExampleGoalFields(
  target: LandingExampleTarget,
): GoalCreationFields {
  return {
    title: "Make room for running",
    description: "A rhythm that fits around life.",
    category_selection: "health",
    custom_category: "",
    color: getCategorySwatchColor("health"),
    frequency_type: "recurring",
    recurrence_interval: "monthly",
    target_basis: "period",
    target_count: String(target),
    milestone_names: [],
    start_date: "2026-10-01",
    end_date: "",
    default_local_time: "",
    difficulty: "medium",
    is_private: true,
    linked_target_goal_id: "none",
  };
}
