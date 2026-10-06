import { format, isValid, parseISO } from "date-fns";
import { DEFAULT_GOAL_CATEGORIES, getCategoryLabel } from "@/lib/goals/category";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import { getGoalCreationPeriodTargetMax } from "@/lib/goals/creation-model";

/** Every goal fact the editor can change. Type, interval, basis and start date are immutable in `update_goal`. */
export type EditFact =
  | "name"
  | "category"
  | "stretch"
  | "cadence"
  | "deadline"
  | "time"
  | "visibility"
  | "link"
  | "milestones"
  | "color"
  | "description"
  | "reward"
  | "plaque";

/** Card fields plus the goal facts that live only on the card's back. */
export type EditDraft = GoalCreationFields & { reward_text: string; plaque_target: string };

export const EDIT_FACT_LABELS: Record<EditFact, string> = {
  name: "Name",
  category: "Category",
  stretch: "Stretch",
  cadence: "Target",
  deadline: "Deadline",
  time: "Time of day",
  visibility: "Visibility",
  link: "Also counts toward",
  milestones: "Milestone names",
  color: "Card colour",
  description: "Why it matters",
  reward: "Your reward",
  plaque: "Earn its plaque",
};

const FACT_KEYS: Record<EditFact, (keyof EditDraft)[]> = {
  name: ["title"],
  category: ["category_selection", "custom_category"],
  stretch: ["difficulty"],
  cadence: ["target_count"],
  deadline: ["end_date"],
  time: ["default_local_time"],
  visibility: ["is_private"],
  link: ["linked_target_goal_id"],
  milestones: ["milestone_names"],
  color: ["color"],
  description: ["description"],
  reward: ["reward_text"],
  plaque: ["plaque_target"],
};

export interface LinkOption {
  id: string;
  title: string;
}

export function isMilestoneGoal(fields: GoalCreationFields) {
  return fields.frequency_type === "fixed_milestones";
}

/** The part of the cadence fixed at creation, phrased for a locked chip. */
export function lockedRhythmLabel(fields: GoalCreationFields) {
  if (isMilestoneGoal(fields)) return "Milestone journey";
  const interval =
    fields.recurrence_interval === "daily"
      ? "Daily"
      : fields.recurrence_interval === "weekly"
        ? "Weekly"
        : "Monthly";
  return fields.target_basis === "lifetime" ? `${interval} · total target` : interval;
}

/** Whether the target number is editable at all (daily per-period goals are always one a day). */
export function cadenceCountEditable(fields: GoalCreationFields) {
  return !(
    fields.frequency_type === "recurring" &&
    fields.target_basis === "period" &&
    fields.recurrence_interval === "daily"
  );
}

export function cadenceBounds(fields: GoalCreationFields, completed: number) {
  if (fields.frequency_type === "recurring" && fields.target_basis === "period") {
    return { min: 1, max: getGoalCreationPeriodTargetMax(fields.recurrence_interval) };
  }
  // Totals and milestone journeys cannot drop below what is already done.
  return { min: Math.max(1, completed), max: 999 };
}

export function cadenceSummary(fields: GoalCreationFields) {
  const count = Number(fields.target_count) || 1;
  if (isMilestoneGoal(fields)) return count === 1 ? "1 milestone" : `${count} milestones`;
  if (fields.target_basis === "lifetime") return count === 1 ? "1 session in total" : `${count} sessions in total`;
  if (fields.recurrence_interval === "daily") return "every day";
  if (fields.recurrence_interval === "monthly") return count === 1 ? "1 day a month" : `${count} days a month`;
  return count === 1 ? "once a week" : `${count} days a week`;
}

export function formatDate(value: string) {
  const parsed = parseISO(value);
  return value && isValid(parsed) ? format(parsed, "MMM d, yyyy") : value;
}

export function formatTime(value: string) {
  if (!value) return "";
  const parsed = parseISO(`2000-01-01T${value}`);
  return isValid(parsed) ? format(parsed, "h:mm a").toLowerCase() : value;
}

const STRETCH: Record<GoalCreationFields["difficulty"], string> = {
  easy: "a little lift",
  medium: "a good push",
  hard: "a big stretch",
};

export function stretchSummary(fields: GoalCreationFields) {
  return STRETCH[fields.difficulty];
}

export function summarizeFact(
  fact: EditFact,
  fields: EditDraft,
  linkOptions: LinkOption[],
): string {
  switch (fact) {
    case "name":
      return fields.title.trim() || "Untitled goal";
    case "category":
      return getCategoryLabel(fields.category_selection, fields.custom_category);
    case "stretch":
      return stretchSummary(fields);
    case "cadence":
      return cadenceSummary(fields);
    case "deadline":
      return fields.end_date ? formatDate(fields.end_date) : "No deadline";
    case "time":
      return fields.default_local_time ? formatTime(fields.default_local_time) : "Any time";
    case "visibility":
      return fields.is_private ? "Private" : "Visible to friends";
    case "link":
      return linkOptions.find((option) => option.id === fields.linked_target_goal_id)?.title ?? "Just this goal";
    case "milestones": {
      const named = fields.milestone_names.filter((name) => name.trim()).length;
      return `${named} of ${Number(fields.target_count) || 0} named`;
    }
    case "description":
      return fields.description.trim() || "A line for future you";
    case "reward":
      return fields.reward_text.trim() || "Not set";
    case "plaque":
      return `After ${fields.plaque_target} completions`;
    case "color":
      return DEFAULT_GOAL_CATEGORIES.find((category) => category.color === fields.color.toLowerCase())?.label ?? "Custom";
  }
}

export function changedFacts(base: EditDraft, draft: EditDraft): EditFact[] {
  return (Object.keys(FACT_KEYS) as EditFact[]).filter((fact) =>
    FACT_KEYS[fact].some((key) => JSON.stringify(base[key]) !== JSON.stringify(draft[key])),
  );
}

export function draftError(fields: GoalCreationFields, completed: number): string | null {
  if (!fields.title.trim()) return "Give your goal a name.";
  if (fields.end_date && fields.end_date < fields.start_date) return "The deadline must come after the start date.";
  if (cadenceCountEditable(fields)) {
    const count = Number(fields.target_count);
    const { min, max } = cadenceBounds(fields, completed);
    if (!Number.isInteger(count) || count < min || count > max) {
      return min > 1
        ? `Keep the target at ${min} or more — you've already done ${completed}.`
        : `Choose a target between ${min} and ${max}.`;
    }
  }
  return null;
}
