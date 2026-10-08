"use client";

import { useState } from "react";
import { Action, GoalArtifact, StudyDialog } from "../primitives";
import { SAMPLE_GOALS, type SampleGoalId } from "../sample";

export function GoalDetails({
  goalId,
  name,
  onClose,
  onRename,
}: {
  goalId: SampleGoalId;
  name: string;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const goal = SAMPLE_GOALS.find((item) => item.id === goalId)!;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [rotating, setRotating] = useState(false);
  return (
    <StudyDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editing ? "Edit goal" : "Goal details"}
      description="The card is the object. Reading and editing are explicit choices."
      footer={
        editing ? (
          <>
            <Action
              variant="outline"
              onClick={() => {
                setDraft(name);
                setEditing(false);
              }}
            >
              Cancel edit
            </Action>
            <Action
              form="sample-goal-name"
              type="submit"
              disabled={!draft.trim()}
            >
              Save sample changes
            </Action>
          </>
        ) : (
          <>
            <Action variant="outline" onClick={onClose}>
              Close
            </Action>
            <Action onClick={() => setEditing(true)}>Edit goal</Action>
          </>
        )
      }
    >
      <div className="mt-6">
        <GoalArtifact
          id={goalId}
          nameOverride={name}
          completed={goalId === "run" ? 4 : 2}
          rotatable={rotating}
        />
        <Action
          variant="ghost"
          aria-pressed={rotating}
          onClick={() => setRotating(!rotating)}
        >
          {rotating ? "Keep artwork still" : "Rotate artwork"}
        </Action>
        {editing && (
          <form
            id="sample-goal-name"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) {
                onRename(draft.trim());
                setEditing(false);
              }
            }}
          >
            <label className="rf-field">
              Goal name
              <input
                autoFocus
                required
                maxLength={120}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
          </form>
        )}
        <dl className="mt-6 rf-stack">
          <div>
            <dt className="type-eyebrow rf-muted">Why it matters</dt>
            <dd className="mt-2">
              Make steady room for{" "}
              {goalId === "run"
                ? "movement and time outside"
                : goalId === "language"
                  ? "a language and a different perspective"
                  : "creative work worth sharing"}
              .
            </dd>
          </div>
          <div>
            <dt className="type-eyebrow rf-muted">Reward</dt>
            <dd className="mt-2">
              {goalId === "run"
                ? "New trail shoes"
                : "An afternoon to celebrate"}
            </dd>
          </div>
          <div>
            <dt className="type-eyebrow rf-muted">Schedule</dt>
            <dd className="mt-2">
              October 1–31, 2026 · {goal.target} completions
            </dd>
          </div>
        </dl>
      </div>
    </StudyDialog>
  );
}
