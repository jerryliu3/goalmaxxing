"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { categoryChangePatch } from "@/lib/goals/card-colour";
import { CardWorkbench, CreateBar, RewardSeal } from "./card-workbench";
import { CreationChrome } from "./chrome";
import { CreatedGoal } from "./created-goal";
import { useRhythmChoices } from "./locked-rhythm";
import { getGoalCreationConcept, guessCategory, RHYTHM_UNCHOSEN } from "./model";
import { type Beat, BEATS, BeatQuestion } from "./stamp-questions";
import { useDraftGoal } from "./use-draft-goal";

/** How long the just-stamped region keeps its landing animation. */
const STAMP_MS = 900;

/** B: one question at a time, each answer stamped onto the card region it fills. */
export function StampConcept() {
  return (
    <CreationChrome concept={getGoalCreationConcept("stamp")}>
      {(restart) => <StampFlow onRestart={restart} />}
    </CreationChrome>
  );
}

function StampFlow({ onRestart }: { onRestart: () => void }) {
  const draft = useDraftGoal();
  const { fields } = draft;
  const [index, setIndex] = useState(0);
  const [stamped, setStamped] = useState<ReadonlySet<Beat>>(new Set());
  const [landing, setLanding] = useState<Beat | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [created, setCreated] = useState(false);
  const [chosen, choose] = useRhythmChoices(RHYTHM_UNCHOSEN);

  // "Why" lands on the back: show it written there, then turn the card face up again.
  useEffect(() => {
    if (!landing) return;
    const timer = setTimeout(() => {
      setLanding(null);
      if (landing === "why") setFlipped(false);
    }, landing === "why" ? STAMP_MS * 2 : STAMP_MS);
    return () => clearTimeout(timer);
  }, [landing]);

  if (created) {
    return <CreatedGoal fields={fields} onRestart={onRestart} rewardNote="The reward was the last beat: written, then sealed into the card." />;
  }

  const current = BEATS[index]?.beat ?? null;
  const stamp = (beat: Beat) => {
    const next = new Set(stamped).add(beat);
    // The name suggests a category; the category beat then confirms or changes it.
    if (beat === "name" && !stamped.has("category")) draft.setFields((draftFields) => ({ ...draftFields, ...categoryChangePatch(draftFields, guessCategory(draftFields.title)) }));
    setStamped(next);
    setLanding(beat);
    setFlipped(beat === "why" && Boolean(fields.description.trim()));
    const following = BEATS.findIndex((item, position) => position > index && !next.has(item.beat));
    const firstOpen = BEATS.findIndex((item) => !next.has(item.beat));
    setIndex(following >= 0 ? following : firstOpen >= 0 ? firstOpen : BEATS.length);
  };

  const pending = BEATS.filter((item) => !stamped.has(item.beat)).flatMap((item) => item.facts);
  const sealed = stamped.has("reward") && Boolean(fields.reward_text.trim());
  const seal = sealed ? <RewardSeal /> : current === "reward" ? <RewardSeal state="waiting" /> : null;

  return (
    <div className="gc-flow">
      <ol className="gc-rail" aria-label="Card regions">
        {BEATS.map((item, position) => {
          const done = stamped.has(item.beat);
          return (
            <li key={item.beat}>
              <button
                type="button"
                data-state={position === index ? "current" : done ? "stamped" : "pending"}
                aria-current={position === index ? "step" : undefined}
                disabled={!done && position !== index}
                onClick={() => setIndex(position)}
              >
                <span className="gc-rail-mark" aria-hidden="true">{done ? <Check size={11} /> : position + 1}</span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>
      <CardWorkbench
        session={draft.session}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        visibility={{
          category: stamped.has("category"),
          rhythm: stamped.has("rhythm"),
          count: stamped.has("rhythm"),
          schedule: stamped.has("when"),
          difficulty: stamped.has("difficulty"),
        }}
        pending={pending}
        stamp={landing}
        measureKey={[...stamped].join(",")}
        seal={seal}
      >
        {current ? (
          <BeatQuestion key={current} beat={current} draft={draft} chosen={chosen} onChosen={choose} onStamp={() => stamp(current)} />
        ) : (
          <div className="gc-question">
            <p className="gc-step">Every region is stamped</p>
            <p className="gc-hint">Anything stamped still changes in place — on the card, or on its back.</p>
            <CreateBar fields={fields} onCreate={() => setCreated(true)} />
          </div>
        )}
      </CardWorkbench>
    </div>
  );
}
