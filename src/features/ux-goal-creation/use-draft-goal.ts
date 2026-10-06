"use client";

import { useCallback, useMemo, useState } from "react";
import type { CardEditorSession } from "@/features/goals/card-editor/card-editor-session";
import { changedCardFacts } from "@/features/goals/card-editor/card-facts";
import {
  applyGoalFormCreateKindChange,
  applyGoalFormFieldChange,
  defaultGoalFormState,
  type GoalFormState,
} from "@/features/today/goal-form-model";
import type { GoalCreationFieldChange } from "@/lib/goals/creation-model";
import type { GoalCreateKind } from "@/lib/goals/form-options";

/**
 * The card editor's session over a local, unsaved draft. "Changed" is measured against a
 * blank goal, so the card marks what this person has filled in. No link picker (there is
 * nothing to link to in the lab) and nothing completed yet.
 */
export function buildDraftSession(fields: GoalFormState, patch: (next: Partial<GoalFormState>) => void): CardEditorSession {
  return {
    fields,
    patch,
    completed: 0,
    changed: changedCardFacts(defaultGoalFormState, fields, false),
    link: null,
    pastEnd: false,
    canChangeVisibility: true,
  };
}

export type DraftGoal = ReturnType<typeof useDraftGoal>;

/** A creation draft held in local state; nothing here writes to the database. */
export function useDraftGoal(seed: GoalFormState = defaultGoalFormState) {
  const [fields, setFields] = useState(seed);
  const patch = useCallback((next: Partial<GoalFormState>) => setFields((previous) => ({ ...previous, ...next })), []);
  // Rhythm controls fire several changes in one click, so each applies to the latest draft.
  const change = useCallback((next: GoalCreationFieldChange) => setFields((previous) => applyGoalFormFieldChange(previous, next)), []);
  const changeKind = useCallback((kind: GoalCreateKind) => setFields((previous) => applyGoalFormCreateKindChange(previous, kind)), []);
  const session = useMemo(() => buildDraftSession(fields, patch), [fields, patch]);
  return { fields, setFields, patch, change, changeKind, session };
}
