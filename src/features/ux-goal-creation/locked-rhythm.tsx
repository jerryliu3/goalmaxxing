"use client";

import { Lock } from "lucide-react";
import { type CSSProperties, useCallback, useState } from "react";
import { cadenceSummary, lockedRhythmLabel } from "@/features/goals/card-editor/card-facts";
import type { TempoChoicesMade } from "@/features/goals/tempo-creation-progress";
import { TempoGoalRhythm } from "@/features/goals/tempo-goal-rhythm";
import type { GoalFormState } from "@/features/today/goal-form-model";
import type { DraftGoal } from "./use-draft-goal";

/** Which rhythm questions have been answered; the picker reveals the next one as each is. */
export function useRhythmChoices(initial: TempoChoicesMade) {
  const [chosen, setChosen] = useState(initial);
  const choose = useCallback((patch: Partial<TempoChoicesMade>) => setChosen((previous) => ({ ...previous, ...patch })), []);
  return [chosen, choose] as const;
}

/**
 * The one irreversible choice, asked with the creation flow's own rhythm controls and
 * said plainly: `update_goal` rejects changes to type, interval and basis.
 */
export function LockedRhythm({ draft, chosen, onChosen }: { draft: DraftGoal; chosen: TempoChoicesMade; onChosen: (patch: Partial<TempoChoicesMade>) => void }) {
  return (
    <div className="gc-rhythm" style={{ "--goal-color": draft.fields.color } as CSSProperties}>
      <p className="gc-lock-note">
        <Lock size={13} aria-hidden="true" />
        <span>
          <strong>You can’t change this later.</strong> The number can move; daily, weekly, monthly or a milestone journey is fixed once
          the goal exists. Everything else on the card stays editable.
        </span>
      </p>
      <TempoGoalRhythm
        fields={draft.fields}
        onFieldChange={draft.change}
        createKind={draft.fields.frequency_type}
        onCreateKindChange={draft.changeKind}
        isPlannerTask={false}
        chosen={chosen}
        onChosen={onChosen}
      />
    </div>
  );
}

/** The chosen rhythm as a locked line above the card, with a way back while it is still a draft (hidden while that is open). */
export function LockedRhythmLine({ fields, onChange, open = false }: { fields: GoalFormState; onChange: () => void; open?: boolean }) {
  return (
    <p className="gc-lock-line">
      <Lock size={13} aria-hidden="true" />
      <span>
        <strong>{lockedRhythmLabel(fields)}</strong> · {cadenceSummary(fields)}
      </span>
      <span className="gc-lock-line-note">locked once created</span>
      {open ? null : (
        <button type="button" onClick={onChange}>
          Change
        </button>
      )}
    </p>
  );
}
