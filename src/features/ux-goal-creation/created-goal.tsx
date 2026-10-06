"use client";

import Link from "next/link";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { cadenceSummary, lockedRhythmLabel } from "@/features/goals/card-editor/card-facts";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalFormState } from "@/features/today/goal-form-model";
import { RewardSeal } from "./card-workbench";

/** Where every concept ends: the finished card with its sealed reward, and what was locked. */
export function CreatedGoal({ fields, rewardNote, onRestart }: { fields: GoalFormState; rewardNote: string; onRestart: () => void }) {
  const [peek, setPeek] = useState(false);
  const reward = fields.reward_text.trim();
  const why = fields.description.trim();
  return (
    <section className="gc-created" aria-label="Goal created" style={{ "--goal-color": fields.color } as CSSProperties}>
      <div className="gc-created-stage">
        <TempoGoalCard fields={fields} context="creation" rotatable={false} />
        {reward ? <RewardSeal /> : null}
      </div>
      <div className="gc-created-copy">
        <p className="gc-eyebrow">
          <Check size={14} aria-hidden="true" /> Goal created · prototype, nothing saved
        </p>
        <h2>{fields.title.trim()}</h2>
        <dl className="gc-summary">
          <div>
            <dt>
              <Lock size={12} aria-hidden="true" /> Rhythm · locked
            </dt>
            <dd>
              {lockedRhythmLabel(fields)} · {cadenceSummary(fields)}
            </dd>
          </div>
          <div>
            <dt>Why it matters</dt>
            <dd>{why || "Not written — it waits on the card’s back."}</dd>
          </div>
          <div>
            <dt>Your reward</dt>
            <dd>
              {reward ? (
                <>
                  {peek ? reward : "Sealed until you finish."}{" "}
                  <button type="button" className="gc-text-button" aria-pressed={peek} onClick={() => setPeek((value) => !value)}>
                    {peek ? <EyeOff size={12} aria-hidden="true" /> : <Eye size={12} aria-hidden="true" />}
                    {peek ? "Hide" : "Peek"}
                  </button>
                </>
              ) : (
                "None yet — add one on the card’s back."
              )}
            </dd>
          </div>
        </dl>
        <p className="gc-hint">{rewardNote}</p>
        <div className="gc-actions">
          <button type="button" className="card-button card-button-primary" onClick={onRestart}>
            Make another
          </button>
          <Link href="/ux/goal-creation" className="card-button">
            Compare concepts
          </Link>
        </div>
      </div>
    </section>
  );
}
