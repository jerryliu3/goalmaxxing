"use client";

import { useMemo, useState } from "react";
import { goalCardFields } from "@/features/goals/goal-card-fields";
import { SAMPLE_GOALS } from "@/features/ux-goal-view/sample";
import type { Goal } from "@/lib/goals/types";
import { changedFacts, draftError, type EditDraft, type EditFact, type LinkOption } from "./edit-model";

/** Three goal shapes cover the editable variants: per-week count, milestone journey, daily practice. */
export const EDIT_SAMPLES: { goal: Goal; completed: number; note: string }[] = [
  { goal: SAMPLE_GOALS.find((goal) => goal.id === "strength")!, completed: 7, note: "Weekly · 3 days" },
  { goal: SAMPLE_GOALS.find((goal) => goal.id === "half")!, completed: 2, note: "6 milestones" },
  { goal: SAMPLE_GOALS.find((goal) => goal.id === "japanese")!, completed: 23, note: "Daily · private" },
];

export type EditLifecycle = "active" | "archived" | "deleted";

export interface EditSession {
  goal: Goal;
  completed: number;
  base: EditDraft;
  fields: EditDraft;
  patch: (patch: Partial<EditDraft>) => void;
  setMilestoneName: (index: number, value: string) => void;
  changed: EditFact[];
  error: string | null;
  lifecycle: EditLifecycle;
  setLifecycle: (lifecycle: EditLifecycle) => void;
  linkOptions: LinkOption[];
  savedAt: number;
  save: () => void;
  discard: () => void;
}

interface SampleState {
  base: EditDraft;
  fields: EditDraft;
  lifecycle: EditLifecycle;
  savedAt: number;
}

function initialState(goal: Goal): SampleState {
  const fields: EditDraft = {
    ...goalCardFields(goal),
    reward_text: goal.reward_text ?? "",
    plaque_target: String(goal.plaque_target ?? 10),
  };
  return { base: fields, fields, lifecycle: "active", savedAt: 0 };
}

/**
 * One shared draft per sample goal, so switching concepts keeps edits. Saving
 * only moves the local baseline; nothing is written.
 */
export function useEditSessions() {
  const [states, setStates] = useState(() =>
    Object.fromEntries(EDIT_SAMPLES.map(({ goal }) => [goal.id, initialState(goal)])),
  );
  const [goalId, setGoalId] = useState(EDIT_SAMPLES[0].goal.id);
  const sample = EDIT_SAMPLES.find(({ goal }) => goal.id === goalId) ?? EDIT_SAMPLES[0];
  const state = states[goalId];
  const update = (next: (state: SampleState) => SampleState) =>
    setStates((previous) => ({ ...previous, [goalId]: next(previous[goalId]) }));

  const linkOptions = useMemo(
    () => SAMPLE_GOALS.filter((goal) => goal.id !== goalId).map(({ id, title }) => ({ id, title })),
    [goalId],
  );

  const session: EditSession = {
    goal: sample.goal,
    completed: sample.completed,
    base: state.base,
    fields: state.fields,
    patch: (patch) => update((current) => ({ ...current, fields: { ...current.fields, ...patch } })),
    setMilestoneName: (index, value) =>
      update((current) => {
        const names = [...current.fields.milestone_names];
        names[index] = value;
        return { ...current, fields: { ...current.fields, milestone_names: names } };
      }),
    changed: changedFacts(state.base, state.fields),
    error: draftError(state.fields, sample.completed),
    lifecycle: state.lifecycle,
    setLifecycle: (lifecycle) => update((current) => ({ ...current, lifecycle })),
    linkOptions,
    savedAt: state.savedAt,
    save: () => update((current) => ({ ...current, base: current.fields, savedAt: Date.now() })),
    discard: () => update((current) => ({ ...current, fields: current.base })),
  };

  return {
    session,
    goalId,
    setGoalId,
    reset: () => setStates(Object.fromEntries(EDIT_SAMPLES.map(({ goal }) => [goal.id, initialState(goal)]))),
  };
}
