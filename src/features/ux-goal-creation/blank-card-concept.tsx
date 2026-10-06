"use client";

import { ArrowRight, Gift } from "lucide-react";
import { useState } from "react";
import { CARD_FACT_LABELS } from "@/features/goals/card-editor/card-facts";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { CardWorkbench, CreateBar, RewardSeal } from "./card-workbench";
import { CreationChrome } from "./chrome";
import { CreatedGoal } from "./created-goal";
import { LockedRhythm, LockedRhythmLine, useRhythmChoices } from "./locked-rhythm";
import { filledDefaults, getGoalCreationConcept, nextEmptyFact, type NudgeFact, RHYTHM_UNCHOSEN, rhythmComplete } from "./model";
import { TitleOnCard } from "./title-on-card";
import { useDraftGoal } from "./use-draft-goal";

type Phase = "name" | "rhythm" | "card" | "created";

const NUDGE_PROMPTS: Record<NudgeFact, string> = {
  deadline: "Next, if you like: a deadline.",
  time: "Next, if you like: a usual time of day.",
  description: "Turn it over: why does this matter to you?",
  reward: "Turn it over: what’s waiting for you at the end?",
};

/** A: creation is editing a blank card. */
export function BlankCardConcept() {
  return (
    <CreationChrome concept={getGoalCreationConcept("blank-card")}>
      {(restart) => <BlankCardFlow onRestart={restart} />}
    </CreationChrome>
  );
}

function BlankCardFlow({ onRestart }: { onRestart: () => void }) {
  const draft = useDraftGoal();
  const { fields } = draft;
  const [phase, setPhase] = useState<Phase>("name");
  const [chosen, choose] = useRhythmChoices(RHYTHM_UNCHOSEN);
  const [filled, setFilled] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [skipped, setSkipped] = useState<ReadonlySet<NudgeFact>>(new Set());

  if (phase === "created") {
    return <CreatedGoal fields={fields} onRestart={onRestart} rewardNote="The reward was written on the card’s back, during the turn-over." />;
  }

  if (phase === "name") {
    return (
      <div className="gc-moment" data-moment="name">
        <div className="gc-moment-card">
          <TitleOnCard fields={fields} onTitle={(title) => draft.patch({ title })} onSubmit={() => setPhase("rhythm")} />
        </div>
        <div className="gc-moment-copy">
          <p className="gc-step">1 of 3 · Name it</p>
          <h2>What are you going for?</h2>
          <p className="gc-hint">Write it on the card. Short and specific reads best: “Run a half marathon”, “Call Mom more”.</p>
          <button type="button" className="card-button card-button-primary" disabled={!fields.title.trim()} onClick={() => setPhase("rhythm")}>
            Next <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === "rhythm") {
    const ready = rhythmComplete(chosen, fields);
    return (
      <div className="gc-moment" data-moment="rhythm">
        <div className="gc-moment-card">
          <TempoGoalCard
            fields={fields}
            context="creation"
            rotatable={false}
            visibility={{ category: filled, rhythm: chosen.kind, count: chosen.count, schedule: filled, difficulty: filled }}
          />
        </div>
        <div className="gc-moment-copy">
          <p className="gc-step">2 of 3 · The one locked choice</p>
          <h2>How will you show up?</h2>
          <LockedRhythm draft={draft} chosen={chosen} onChosen={choose} />
          <div className="gc-row">
            <button type="button" className="card-button" onClick={() => setPhase(filled ? "card" : "name")}>
              Back
            </button>
            <button
              type="button"
              className="card-button card-button-primary"
              disabled={!ready}
              onClick={() => {
                // Defaults fill once; coming back to change the rhythm keeps everything else.
                if (!filled) draft.setFields((current) => filledDefaults(current));
                setFilled(true);
                setPhase("card");
              }}
            >
              {filled ? "Back to the card" : "Fill the card"} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nudge = nextEmptyFact(fields, skipped);
  const faceNudge = nudge === "deadline" || nudge === "time" ? nudge : null;
  const backNudge = nudge === "description" || nudge === "reward" ? nudge : null;
  return (
    <div className="gc-flow">
      <p className="gc-step">3 of 3 · Your card, filled with sensible defaults — change anything on it</p>
      <LockedRhythmLine fields={fields} onChange={() => setPhase("rhythm")} />
      <CardWorkbench
        session={draft.session}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        turnLabel="Turn over: why it matters + your reward"
        turnNudge={Boolean(backNudge)}
        nudge={flipped ? null : faceNudge}
        backNudge={flipped ? backNudge : null}
        seal={fields.reward_text.trim() ? <RewardSeal /> : null}
      >
        {nudge ? (
          <p className="gc-nudge" data-fact={nudge}>
            {nudge === "reward" ? <Gift size={14} aria-hidden="true" /> : null}
            <span>{flipped && backNudge ? `Tap “${CARD_FACT_LABELS[nudge]}” to write it.` : NUDGE_PROMPTS[nudge]}</span>
            <button type="button" className="gc-text-button" onClick={() => setSkipped((current) => new Set(current).add(nudge))}>
              Skip
            </button>
          </p>
        ) : null}
        <CreateBar fields={fields} onCreate={() => setPhase("created")} note={nudge ? "Everything else is optional" : "Looks complete"} />
      </CardWorkbench>
    </div>
  );
}
