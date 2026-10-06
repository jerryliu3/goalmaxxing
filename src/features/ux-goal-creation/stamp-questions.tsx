"use client";

import { Gift, Stamp } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { DIFFICULTY_OPTIONS, type FaceFact } from "@/features/goals/card-editor/card-facts";
import type { TempoChoicesMade } from "@/features/goals/tempo-creation-progress";
import { TempoGoalChoices } from "@/features/goals/tempo-goal-choices";
import { categoryChangePatch } from "@/lib/goals/card-colour";
import { DEFAULT_GOAL_CATEGORIES, type CategorySelection } from "@/lib/goals/category";
import type { GoalDifficulty } from "@/lib/goals/types";
import { LockedRhythm } from "./locked-rhythm";
import { REWARD_SUGGESTIONS, rhythmComplete } from "./model";
import type { DraftGoal } from "./use-draft-goal";

export type Beat = "name" | "rhythm" | "category" | "difficulty" | "when" | "why" | "reward";

/** Each beat and the card regions its answer stamps (why and reward live on the back). */
export const BEATS: readonly { beat: Beat; label: string; question: string; facts: FaceFact[] }[] = [
  { beat: "name", label: "Name", question: "What are you going for?", facts: ["name"] },
  { beat: "rhythm", label: "Rhythm", question: "How will you show up?", facts: ["cadence"] },
  { beat: "category", label: "Category", question: "Which part of life is it?", facts: ["category"] },
  { beat: "difficulty", label: "Effort", question: "How big a push is it?", facts: ["difficulty"] },
  { beat: "when", label: "When", question: "Any deadline, or a usual time?", facts: ["start", "deadline", "time", "visibility"] },
  { beat: "why", label: "Why", question: "Why does it matter to you?", facts: [] },
  { beat: "reward", label: "Reward", question: "What’s waiting for you at the end?", facts: [] },
];

interface QuestionProps {
  beat: Beat;
  draft: DraftGoal;
  chosen: TempoChoicesMade;
  onChosen: (patch: Partial<TempoChoicesMade>) => void;
  onStamp: () => void;
}

/** The question for one beat; its answer previews live on the card and lands when stamped. */
export function BeatQuestion({ beat, draft, chosen, onChosen, onStamp }: QuestionProps) {
  const { fields, patch } = draft;
  const index = BEATS.findIndex((item) => item.beat === beat);
  const frame = (control: ReactNode, { ready = true, skip }: { ready?: boolean; skip?: () => void } = {}) => (
    <div className="gc-question" style={{ "--goal-color": fields.color } as CSSProperties}>
      <p className="gc-step">
        {index + 1} of {BEATS.length} · {BEATS[index].label}
      </p>
      <h2>{BEATS[index].question}</h2>
      {control}
      <div className="gc-row">
        {skip ? (
          <button type="button" className="card-button" onClick={skip}>
            Skip
          </button>
        ) : null}
        <button type="button" className="card-button card-button-primary" disabled={!ready} onClick={onStamp}>
          <Stamp size={14} aria-hidden="true" /> Stamp it
        </button>
      </div>
    </div>
  );

  switch (beat) {
    case "name":
      return frame(
        <input
          autoFocus
          className="gc-text-input"
          aria-label="Goal name"
          placeholder="Run a half marathon"
          value={fields.title}
          onChange={(event) => patch({ title: event.target.value })}
          onKeyDown={(event) => event.key === "Enter" && fields.title.trim() && onStamp()}
        />,
        { ready: Boolean(fields.title.trim()) },
      );
    case "rhythm":
      return frame(<LockedRhythm draft={draft} chosen={chosen} onChosen={onChosen} />, { ready: rhythmComplete(chosen, fields) });
    case "category":
      return frame(
        <>
          <p className="gc-hint">We guessed from the name — change it if it’s wrong.</p>
          <TempoGoalChoices<CategorySelection>
            label="Category"
            value={fields.category_selection}
            options={DEFAULT_GOAL_CATEGORIES.map((option) => ({ value: option.key as CategorySelection, label: option.label, color: option.color }))}
            onChange={(value) => patch(categoryChangePatch(fields, value))}
          />
        </>,
      );
    case "difficulty":
      return frame(
        <TempoGoalChoices<GoalDifficulty>
          label="Difficulty"
          value={fields.difficulty}
          options={DIFFICULTY_OPTIONS.map(({ value, label }) => ({ value, label }))}
          onChange={(difficulty) => patch({ difficulty })}
        />,
      );
    case "when":
      return frame(
        <div className="gc-when">
          <div className="gc-when-row">
            <span>Deadline</span>
            <input type="date" aria-label="Deadline" min={fields.start_date} value={fields.end_date} onChange={(event) => patch({ end_date: event.target.value })} />
            <button type="button" className="gc-text-button" aria-pressed={!fields.end_date} onClick={() => patch({ end_date: "" })}>
              No deadline
            </button>
          </div>
          <div className="gc-when-row">
            <span>Usual time</span>
            <input type="time" aria-label="Usual time" step={300} value={fields.default_local_time} onChange={(event) => patch({ default_local_time: event.target.value })} />
            <button type="button" className="gc-text-button" aria-pressed={!fields.default_local_time} onClick={() => patch({ default_local_time: "" })}>
              Any time
            </button>
          </div>
          <TempoGoalChoices
            label="Who can see it"
            value={fields.is_private ? "private" : "friends"}
            options={[
              { value: "friends", label: "Visible to friends" },
              { value: "private", label: "Private" },
            ]}
            onChange={(value) => patch({ is_private: value === "private" })}
          />
        </div>,
      );
    case "why":
      return frame(
        <textarea
          autoFocus
          rows={3}
          className="gc-text-input gc-text-area"
          aria-label="Why it matters"
          placeholder="Why this matters to you — a line for future you."
          value={fields.description}
          onChange={(event) => patch({ description: event.target.value })}
        />,
        { ready: Boolean(fields.description.trim()), skip: onStamp },
      );
    case "reward":
      return <SealedEnvelope draft={draft} step={`${index + 1} of ${BEATS.length} · Reward`} onSeal={onStamp} />;
  }
}

/** The final beat: write the reward, then watch it sealed into an envelope on the card. */
function SealedEnvelope({ draft, step, onSeal }: { draft: DraftGoal; step: string; onSeal: () => void }) {
  const [sealing, setSealing] = useState(false);
  const reward = draft.fields.reward_text;
  const seal = () => {
    if (!reward.trim() || sealing) return;
    setSealing(true);
    setTimeout(onSeal, 750);
  };
  return (
    <div className="gc-question" style={{ "--goal-color": draft.fields.color } as CSSProperties}>
      <p className="gc-step">{step}</p>
      <div className="gc-envelope" data-sealing={sealing}>
        <span className="gc-envelope-flap" aria-hidden="true" />
        <div className="gc-envelope-letter">
          <label htmlFor="gc-reward">What’s waiting for you at the end?</label>
          <input
            id="gc-reward"
            autoFocus
            maxLength={500}
            className="gc-text-input"
            placeholder="Something to look forward to"
            value={reward}
            disabled={sealing}
            onChange={(event) => draft.patch({ reward_text: event.target.value })}
            onKeyDown={(event) => event.key === "Enter" && seal()}
          />
          <div className="gc-chips" role="group" aria-label="Reward ideas">
            {REWARD_SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} type="button" aria-pressed={reward === suggestion} disabled={sealing} onClick={() => draft.patch({ reward_text: suggestion })}>
                {suggestion}
              </button>
            ))}
            <button
              type="button"
              disabled={sealing}
              onClick={() => {
                draft.patch({ reward_text: "" });
                onSeal();
              }}
            >
              Skip it
            </button>
          </div>
        </div>
        <span className="gc-wax" aria-hidden="true">
          <Gift size={18} />
        </span>
      </div>
      <p className="gc-hint">It stays sealed on your card until you finish the goal.</p>
      <div className="gc-row">
        <button type="button" className="card-button card-button-primary" disabled={!reward.trim() || sealing} onClick={seal}>
          {sealing ? "Sealing…" : "Seal it"}
        </button>
      </div>
    </div>
  );
}
