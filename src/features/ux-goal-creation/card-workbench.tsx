"use client";

import { Gift, RotateCcw } from "lucide-react";
import { type CSSProperties, type ReactNode, useRef } from "react";
import { AnnotatedCard } from "@/features/goals/card-editor/annotated-card";
import { CardBack } from "@/features/goals/card-editor/card-back";
import type { CardEditorSession } from "@/features/goals/card-editor/card-editor-session";
import type { FaceFact } from "@/features/goals/card-editor/card-facts";
import { DirectCard } from "@/features/goals/card-editor/direct-card";
import { useElementWidth } from "@/features/goals/card-editor/use-card-regions";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { TempoCardVisibility } from "@/features/goals/tempo-creation-progress";
import type { GoalFormState } from "@/features/today/goal-form-model";
import { getGoalCreationValidationFeedback } from "@/lib/goals/creation-model";
import "@/features/goals/card-editor/card-editor.css";

/** Same breakpoint as the production `GoalCardEditor`: below it the card itself is the control. */
const ANNOTATED_MIN_WIDTH = 860;

/**
 * The production card editor, composed for a draft: annotated callouts where there is
 * room, the direct card otherwise, and the same card back. Creation-only touches are
 * styling hooks on the wrapper: `pending` facts have no control yet, `nudge` softly marks
 * the next empty fact, and `stamp` animates the region just filled.
 */
export function CardWorkbench({
  session,
  flipped,
  onFlip,
  turnLabel = "Turn over for more",
  turnNudge = false,
  visibility,
  pending = [],
  nudge = null,
  backNudge = null,
  stamp = null,
  measureKey = "",
  seal = null,
  children,
}: {
  session: CardEditorSession;
  flipped: boolean;
  onFlip: () => void;
  turnLabel?: string;
  turnNudge?: boolean;
  visibility?: TempoCardVisibility;
  pending?: FaceFact[];
  nudge?: FaceFact | null;
  backNudge?: "description" | "reward" | null;
  stamp?: string | null;
  /** Changes when the card's printed facts change without the fields changing (a stamp), so regions re-measure. */
  measureKey?: string;
  seal?: ReactNode;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref, typeof window === "undefined" ? ANNOTATED_MIN_WIDTH : window.innerWidth);
  const direct = width < ANNOTATED_MIN_WIDTH;
  const { fields } = session;
  const card = (
    <>
      <TempoGoalCard fields={fields} context="creation" rotatable={false} visibility={visibility} />
      {seal}
    </>
  );
  const back = <CardBack session={session} />;
  return (
    <div
      ref={ref}
      className="card-editor gc-workbench"
      data-layout={direct ? "direct" : "annotated"}
      data-pending={pending.join(" ")}
      data-nudge={nudge ?? undefined}
      data-back-nudge={backNudge ?? undefined}
      data-stamp={stamp ?? undefined}
      // Controls below the card (turn-over, nudges) pick up the card's colour too.
      style={{ "--goal-color": fields.color } as CSSProperties}
    >
      {direct ? (
        <DirectCard key={measureKey} session={session} card={card} back={back} flipped={flipped} />
      ) : (
        <AnnotatedCard key={measureKey} fields={fields} card={card} session={session} back={back} flipped={flipped} hidden={pending} />
      )}
      <div className="card-editor-controls">
        {direct && !flipped ? <p className="card-editor-hint">Tap anything on the card to change it.</p> : null}
        <button type="button" className="card-button gc-turn" data-nudge={turnNudge && !flipped} onClick={onFlip}>
          <RotateCcw size={14} aria-hidden="true" />
          {flipped ? "Back to the card" : turnLabel}
        </button>
        {children}
      </div>
    </div>
  );
}

/** The edit card's save bar, saying Create. */
export function CreateBar({ fields, onCreate, note }: { fields: GoalFormState; onCreate: () => void; note?: string }) {
  const error = creationError(fields);
  return (
    <div className="card-savebar" data-dirty={!error}>
      <p role="status" aria-live="polite">{error ?? note ?? "Ready when you are"}</p>
      <button type="button" className="card-button card-button-primary" disabled={Boolean(error)} onClick={onCreate}>
        Create goal
      </button>
    </div>
  );
}

export function creationError(fields: GoalFormState): string | null {
  if (!fields.title.trim()) return "Give it a name first";
  return getGoalCreationValidationFeedback(fields).validationError;
}

/**
 * Prototype-only mark over the card face: the reward exists but stays sealed until the
 * goal is finished. `TempoGoalCard` is unchanged; this sits in the card's stage.
 */
export function RewardSeal({ state = "sealed", color }: { state?: "sealed" | "waiting"; color?: string }) {
  return (
    <span className="gc-seal" data-state={state} style={color ? ({ "--goal-color": color } as CSSProperties) : undefined} aria-label={state === "sealed" ? "Reward sealed until you finish" : "Reward slot, empty"}>
      <Gift size={13} aria-hidden="true" />
      <span>{state === "sealed" ? "Reward · sealed" : "Reward · waiting"}</span>
    </span>
  );
}
