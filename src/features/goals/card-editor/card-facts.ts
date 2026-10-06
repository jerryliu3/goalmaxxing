import { format, isValid, parseISO } from "date-fns";
import { cardColourName } from "@/lib/goals/card-colour";
import { getCategoryLabel } from "@/lib/goals/category";
import { applyGoalCreationFieldChange, type GoalCreationFields } from "@/lib/goals/creation-model";
import { formatGoalDateLabel } from "@/lib/goals/linked-goal-labels";
import { getGoalPeriodTargetMax } from "@/lib/goals/target-basis";
import type { GoalDifficulty } from "@/lib/goals/types";
import type { GoalFormState } from "@/features/today/goal-form-model";
import { creationPlaqueTarget } from "../card-material/creation-plaque-target";
import type { CardEditorFields } from "./card-editor-session";

/** Facts the card face prints, in reading order. */
export type FaceFact = "visibility" | "cadence" | "name" | "category" | "difficulty" | "start" | "deadline" | "time";
/** Facts that live on the card's back. */
export type BackFact = "description" | "reward" | "plaque" | "milestones" | "link" | "color";
export type CardFact = FaceFact | BackFact;

export const CARD_FACT_LABELS: Record<CardFact, string> = {
  visibility: "Visibility",
  cadence: "Target",
  name: "Name",
  category: "Category",
  difficulty: "Difficulty",
  start: "Started",
  deadline: "Deadline",
  time: "Time of day",
  description: "Why it matters",
  reward: "Your reward",
  plaque: "Earn achievement after",
  milestones: "Milestone names",
  link: "Also counts toward",
  color: "Card colour",
};

export const DIFFICULTY_OPTIONS: ReadonlyArray<{ value: GoalDifficulty; name: string; label: string; short: string }> = [
  { value: "easy", name: "Easy", label: "Easy · a little lift", short: "a little lift" },
  { value: "medium", name: "Medium", label: "Medium · a good push", short: "a good push" },
  { value: "hard", name: "Hard", label: "Hard · a big stretch", short: "a big stretch" },
];

/** A new target count, through the creation model so milestone names grow and shrink with it. */
export function targetCountPatch(fields: GoalCreationFields, next: number): Pick<GoalCreationFields, "target_count" | "milestone_names"> {
  const { target_count, milestone_names } = applyGoalCreationFieldChange(fields, { type: "target_count", value: String(next) });
  return { target_count, milestone_names };
}

export function isMilestoneGoal(fields: Pick<GoalCreationFields, "frequency_type">) {
  return fields.frequency_type === "fixed_milestones";
}

/** Only recurring per-period goals carry their own achievement target; others earn it at the target. */
export function hasPlaqueTarget(fields: Pick<GoalCreationFields, "frequency_type" | "target_basis">) {
  return fields.frequency_type === "recurring" && fields.target_basis === "period";
}

/** Daily per-period goals are always one a day, so there is no target to tune. */
export function cadenceCountEditable(fields: GoalCreationFields) {
  return !(fields.frequency_type === "recurring" && fields.target_basis === "period" && fields.recurrence_interval === "daily");
}

/** Edit bounds: periods keep their supported limits; totals never drop below completed work. */
export function cadenceBounds(fields: GoalCreationFields, completed: number) {
  if (fields.frequency_type === "recurring" && fields.target_basis === "period") {
    return { min: 1, max: getGoalPeriodTargetMax(fields.recurrence_interval) };
  }
  return { min: Math.max(1, completed), max: 999 };
}

export function cadenceUnit(fields: GoalCreationFields) {
  if (isMilestoneGoal(fields)) return "milestones";
  if (fields.target_basis === "lifetime") return "sessions in total";
  return fields.recurrence_interval === "monthly" ? "days a month" : "days a week";
}

/** The part of the rhythm fixed at creation (`update_goal` rejects changes to it). */
export function lockedRhythmLabel(fields: GoalCreationFields) {
  if (isMilestoneGoal(fields)) return "Milestone journey";
  const interval = fields.recurrence_interval === "daily" ? "Daily" : fields.recurrence_interval === "weekly" ? "Weekly" : "Monthly";
  return fields.target_basis === "lifetime" ? `${interval} · total target` : interval;
}

export function cadenceSummary(fields: GoalCreationFields) {
  const count = Number(fields.target_count) || 1;
  if (isMilestoneGoal(fields)) return count === 1 ? "1 milestone" : `${count} milestones`;
  if (fields.target_basis === "lifetime") return count === 1 ? "1 session in total" : `${count} sessions in total`;
  if (fields.recurrence_interval === "daily") return "every day";
  if (fields.recurrence_interval === "monthly") return count === 1 ? "1 day a month" : `${count} days a month`;
  return count === 1 ? "once a week" : `${count} days a week`;
}

export function formatCardTime(value: string) {
  if (!value) return "";
  const parsed = parseISO(`2000-01-01T${value}`);
  return isValid(parsed) ? format(parsed, "h:mm a").toLowerCase() : value;
}

export function summarizeFaceFact(fact: FaceFact, fields: GoalCreationFields): string {
  switch (fact) {
    case "visibility":
      return fields.is_private ? "Private" : "Visible to friends";
    case "cadence":
      return cadenceSummary(fields);
    case "name":
      return fields.title.trim() || "Untitled goal";
    case "category":
      return getCategoryLabel(fields.category_selection, fields.custom_category);
    case "difficulty":
      return DIFFICULTY_OPTIONS.find((option) => option.value === fields.difficulty)?.short ?? "";
    case "start":
      return formatGoalDateLabel(fields.start_date);
    case "deadline":
      return fields.end_date ? formatGoalDateLabel(fields.end_date) : "No deadline";
    case "time":
      return fields.default_local_time ? formatCardTime(fields.default_local_time) : "Any time";
  }
}

export function summarizeBackFact(fact: BackFact, fields: CardEditorFields, linkTitle: string | null): string {
  switch (fact) {
    case "description":
      return fields.description.trim() || "A line for future you";
    case "reward":
      return fields.reward_text.trim() || "Not set";
    case "plaque":
      return `${fields.plaque_target ?? creationPlaqueTarget(fields)} completions`;
    case "milestones": {
      const named = fields.milestone_names.filter((name) => name.trim()).length;
      return `${named} of ${Number(fields.target_count) || 0} named`;
    }
    case "link":
      return linkTitle ?? "Just this goal";
    case "color":
      return cardColourName(fields.color, fields.category_selection);
  }
}

const FACT_KEYS: Record<CardFact, (keyof GoalFormState)[]> = {
  visibility: ["is_private"],
  cadence: ["target_count"],
  name: ["title"],
  category: ["category_selection", "custom_category"],
  difficulty: ["difficulty"],
  start: [],
  deadline: ["end_date"],
  time: ["default_local_time"],
  description: ["description"],
  reward: ["reward_text"],
  plaque: ["plaque_target"],
  milestones: ["milestone_names"],
  link: [],
  color: ["color"],
};

/** A saved end date before today; until it changes, only the deadline is editable. */
export function endDatePassed(endDate: string, today: string) {
  return Boolean(endDate) && endDate < today;
}

/** Which facts differ from the loaded goal, so the face and back can mark them. */
export function changedCardFacts(base: GoalFormState, draft: GoalFormState, linkChanged: boolean): Set<CardFact> {
  const changed = new Set<CardFact>();
  for (const [fact, keys] of Object.entries(FACT_KEYS) as [CardFact, (keyof GoalFormState)[]][]) {
    if (keys.some((key) => JSON.stringify(base[key]) !== JSON.stringify(draft[key]))) changed.add(fact);
  }
  if (linkChanged) changed.add("link");
  return changed;
}
