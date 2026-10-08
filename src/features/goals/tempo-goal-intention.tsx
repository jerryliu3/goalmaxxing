"use client";

import { Input } from "@/components/ui/input";
import {
  DEFAULT_GOAL_CATEGORIES,
  type CategorySelection,
} from "@/lib/goals/category";
import { categoryChangePatch } from "@/lib/goals/card-colour";
import type { GoalCreationFields } from "@/lib/goals/creation-model";
import type { CardEditorFields } from "./card-editor/card-editor-session";
import { DIFFICULTY_OPTIONS } from "./card-editor/card-facts";
import { TempoGoalChoices as Choices } from "./tempo-goal-choices";
import type { TempoChoicesMade } from "./tempo-creation-progress";

/** The intention step: the name, then category, then difficulty (tasks only need a name). */
export function TempoGoalIntention({
  id,
  fields,
  onPatch,
  isPlannerTask,
  chosen,
  onChosen,
}: {
  id: string;
  fields: GoalCreationFields;
  onPatch: (patch: Partial<CardEditorFields>) => void;
  isPlannerTask: boolean;
  chosen: TempoChoicesMade;
  onChosen: (patch: Partial<TempoChoicesMade>) => void;
}) {
  return (
    <>
      <label htmlFor={`${id}-title`}>
        Name your {isPlannerTask ? "task" : "goal"}
      </label>
      <Input
        id={`${id}-title`}
        aria-label="Name"
        className="tempo-title-input"
        placeholder="Read a little, every week"
        value={fields.title}
        onChange={(e) => onPatch({ title: e.target.value })}
      />
      {!isPlannerTask && (
        <>
          <p className="tempo-label">Category</p>
          <Choices
            label="Category"
            value={chosen.category ? fields.category_selection : null}
            options={[
              ...DEFAULT_GOAL_CATEGORIES.map((c) => ({
                value: c.key as CategorySelection,
                label: c.label,
                color: c.color,
              })),
            ]}
            onChange={(value) => {
              onChosen({ category: true });
              onPatch(categoryChangePatch(fields, value));
            }}
          />
          {chosen.category && (
            <>
              <p className="tempo-label">Difficulty</p>
              <Choices
                label="Difficulty"
                value={chosen.difficulty ? fields.difficulty : null}
                options={DIFFICULTY_OPTIONS}
                onChange={(difficulty) => {
                  onChosen({ difficulty: true });
                  onPatch({ difficulty });
                }}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
