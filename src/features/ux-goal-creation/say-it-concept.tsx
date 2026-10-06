"use client";

import { ArrowLeft, ArrowRight, Gift, Sparkles } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { CARD_FACT_LABELS, summarizeFaceFact } from "@/features/goals/card-editor/card-facts";
import { InlineFact } from "@/features/goals/card-editor/inline-fact";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { defaultGoalFormState, type GoalFormState } from "@/features/today/goal-form-model";
import { CardWorkbench, CreateBar, RewardSeal } from "./card-workbench";
import { CreationChrome } from "./chrome";
import { CreatedGoal } from "./created-goal";
import { LockedRhythm, LockedRhythmLine, useRhythmChoices } from "./locked-rhythm";
import { EXAMPLE_SENTENCES, getGoalCreationConcept, parseGoalSentence, type ParsedGoal, RHYTHM_CHOSEN, RHYTHM_UNCHOSEN, rhythmComplete } from "./model";
import { type DraftGoal, useDraftGoal } from "./use-draft-goal";

type Phase = "say" | "card" | "created";

/** C: say it in a sentence; the card fills from it, reward included, and you tweak it there. */
export function SayItConcept() {
  return (
    <CreationChrome concept={getGoalCreationConcept("say-it")}>
      {(restart) => <SayItFlow onRestart={restart} />}
    </CreationChrome>
  );
}

function SayItFlow({ onRestart }: { onRestart: () => void }) {
  const draft = useDraftGoal();
  const { fields } = draft;
  const [phase, setPhase] = useState<Phase>("say");
  const [sentence, setSentence] = useState("");
  const [parsed, setParsed] = useState<ParsedGoal>({ fields: defaultGoalFormState, read: [], rhythmRead: false });
  const [rhythmOpen, setRhythmOpen] = useState(false);
  const [chosen, choose] = useRhythmChoices(RHYTHM_UNCHOSEN);
  const [flipped, setFlipped] = useState(false);

  // The stand-in parse runs on every keystroke; going back to the sentence re-reads it from scratch.
  const say = (next: string) => {
    const result = parseGoalSentence(next);
    setSentence(next);
    setParsed(result);
    draft.setFields(result.fields);
  };

  if (phase === "created") {
    return <CreatedGoal fields={fields} onRestart={onRestart} rewardNote="The reward came from your sentence and was confirmed on the card." />;
  }

  if (phase === "say") {
    return (
      <div className="gc-moment" data-moment="say">
        <div className="gc-moment-card" style={{ "--goal-color": fields.color } as CSSProperties}>
          <div className="gc-created-stage">
            <TempoGoalCard fields={fields} context="creation" rotatable={false} />
            {fields.reward_text.trim() ? <RewardSeal /> : null}
          </div>
        </div>
        <div className="gc-moment-copy">
          <p className="gc-step">Say it</p>
          <h2>What do you want to do?</h2>
          <textarea
            autoFocus
            rows={3}
            className="gc-say-input"
            aria-label="Your goal in one sentence"
            placeholder="Run a half marathon by March, 3 runs a week, then buy a new bike"
            value={sentence}
            onChange={(event) => say(event.target.value)}
          />
          <div className="gc-chips" role="group" aria-label="Example sentences">
            {EXAMPLE_SENTENCES.map((example) => (
              <button key={example} type="button" aria-pressed={sentence === example} onClick={() => say(example)}>
                {example}
              </button>
            ))}
          </div>
          <ReadBack parsed={parsed} fields={fields} />
          <div className="gc-row">
            <button
              type="button"
              className="card-button card-button-primary"
              disabled={!fields.title.trim()}
              onClick={() => {
                // A parsed rhythm starts confirmed; a missing one is asked, since it can't change later.
                choose(parsed.rhythmRead ? RHYTHM_CHOSEN : RHYTHM_UNCHOSEN);
                setRhythmOpen(!parsed.rhythmRead);
                setPhase("card");
              }}
            >
              Make the card <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rhythmReady = rhythmComplete(chosen, fields);
  return (
    <div className="gc-flow">
      <button type="button" className="gc-text-button gc-back" onClick={() => setPhase("say")}>
        <ArrowLeft size={13} aria-hidden="true" /> Edit the sentence
      </button>
      <LockedRhythmLine fields={fields} open={rhythmOpen} onChange={() => setRhythmOpen(true)} />
      {rhythmOpen ? (
        <div className="gc-inline-panel">
          {!parsed.rhythmRead ? <p className="gc-hint">We couldn’t tell how often from your sentence. Pick it here.</p> : null}
          <LockedRhythm draft={draft} chosen={chosen} onChosen={choose} />
          <button type="button" className="card-button" disabled={!rhythmReady} onClick={() => setRhythmOpen(false)}>
            Confirm rhythm
          </button>
        </div>
      ) : null}
      <RewardChip draft={draft} />
      <CardWorkbench
        session={draft.session}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        seal={fields.reward_text.trim() ? <RewardSeal /> : null}
      >
        {rhythmOpen ? (
          <p className="gc-hint">Confirm the rhythm above to create.</p>
        ) : (
          <CreateBar fields={fields} onCreate={() => setPhase("created")} note="Filled from your sentence" />
        )}
      </CardWorkbench>
    </div>
  );
}

/** What the sentence supplied, as the card will print it. */
function ReadBack({ parsed, fields }: { parsed: ParsedGoal; fields: GoalFormState }) {
  if (parsed.read.length === 0) return <p className="gc-hint">Mention how often, a deadline, a time, or what you’ll treat yourself to.</p>;
  return (
    <ul className="gc-read" aria-label="What we read">
      <li className="gc-read-head">
        <Sparkles size={13} aria-hidden="true" /> We read
      </li>
      {parsed.read.map((fact) => (
        <li key={fact} data-fact={fact}>
          <span>{CARD_FACT_LABELS[fact]}</span> {fact === "reward" ? `${fields.reward_text} · sealed` : summarizeFaceFact(fact, fields)}
        </li>
      ))}
    </ul>
  );
}

/** The parsed reward, confirmed in place — or added — with the card back's own reward field. */
function RewardChip({ draft }: { draft: DraftGoal }) {
  const [editing, setEditing] = useState(false);
  const reward = draft.fields.reward_text.trim();
  return (
    <div className="gc-reward-chip" data-editing={editing} style={{ "--goal-color": draft.fields.color } as CSSProperties}>
      <Gift size={14} aria-hidden="true" />
      {editing ? (
        <>
          <span className="gc-reward-field">
            <InlineFact fact="reward" session={draft.session} onDone={() => setEditing(false)} />
          </span>
          <button type="button" className="gc-text-button" onClick={() => setEditing(false)}>
            Done
          </button>
        </>
      ) : reward ? (
        <>
          <span>
            <strong>{reward}</strong> · We’ll keep this sealed until you finish.
          </span>
          <button type="button" className="gc-text-button" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="gc-text-button" onClick={() => draft.patch({ reward_text: "" })}>
            Remove
          </button>
        </>
      ) : (
        <button type="button" className="gc-text-button" onClick={() => setEditing(true)}>
          Add a reward for the finish line
        </button>
      )}
    </div>
  );
}
