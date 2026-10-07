import type { GoalFormState } from "@/features/today/goal-form-model";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { Goal } from "@/lib/goals/types";
import type { CardFact } from "./card-facts";

/** The goal facts the card prints and its back edits: creation fields plus reward and plaque target. */
export type CardEditorFields = GoalCreationFields & Pick<GoalFormState, "reward_text" | "plaque_target">;

/**
 * What the card editor reads and writes; built from the goal form state by `GoalCardEditor`,
 * and by creation (`TempoGoalFields`) for the card's back.
 */
export interface CardEditorSession {
  fields: CardEditorFields;
  patch: (patch: Partial<CardEditorFields>) => void;
  /** Completions already recorded; totals and milestones can't drop below them. */
  completed: number;
  changed: Set<CardFact>;
  /** Null for team goals, which can't link to a personal goal. */
  link: {
    value: string;
    selectedTitle: string | null;
    options: Goal[];
    search: string;
    onSearch: (query: string) => void;
    onChange: (goalId: string) => void;
  } | null;
  /**
   * The goal's end date has passed and is unchanged: only the deadline edits until it moves.
   */
  pastEnd: boolean;
  /** Team goals are visible to the team, so privacy is not theirs to change. */
  canChangeVisibility: boolean;
}
