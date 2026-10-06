"use client";

import { RotateCcw } from "lucide-react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { EDIT_FACT_LABELS, formatDate, summarizeFact, type EditFact } from "./edit-model";
import { CardBack, type BackStyle } from "./card-back";
import { LifecycleNotice, SaveBar } from "./fact-editors";
import type { FaceFact, FaceRegion } from "./use-card-regions";
import type { EditSession } from "./use-edit-session";

export const FACE_LABELS: Record<EditFact | "start", string> = { ...EDIT_FACT_LABELS, start: "Started" };

export function faceValue(fact: FaceFact, session: EditSession) {
  return fact === "start" ? formatDate(session.fields.start_date) : summarizeFact(fact, session.fields, session.linkOptions);
}

export function isChanged(fact: FaceFact, session: EditSession) {
  return fact !== "start" && session.changed.includes(fact);
}

export function regionStyle(region: FaceRegion): CSSProperties {
  return { left: region.x, top: region.y, width: region.width, height: region.height };
}

export function goalColorStyle(session: EditSession) {
  return { "--goal-color": session.fields.color } as CSSProperties;
}

/**
 * The live card and its back share one flip. Editing chrome is passed in as `overlay`;
 * the card itself stays the production renderer. The back is card-sized, like a real card.
 */
export function CardStage({
  session,
  stageRef,
  overlay,
  back,
  backStyle,
  onFlipBack,
}: {
  session: EditSession;
  stageRef: RefObject<HTMLDivElement | null>;
  overlay: ReactNode;
  back: boolean;
  backStyle: BackStyle;
  onFlipBack: () => void;
}) {
  return (
    <div className="ie-card-scene" data-back={back} style={goalColorStyle(session)}>
      <div className="ie-card-side ie-card-front" aria-hidden={back} inert={back}>
        <div ref={stageRef} className="ie-face-stage" data-archived={session.lifecycle !== "active"}>
          <TempoGoalCard fields={session.fields} context="history" rotatable={false} />
          {overlay}
        </div>
      </div>
      <div className="ie-card-side ie-card-reverse" aria-hidden={!back} inert={!back}>
        <CardBack session={session} backStyle={backStyle} onDone={onFlipBack} />
      </div>
    </div>
  );
}

export function FaceControls({ session, back, onFlip, hint }: { session: EditSession; back: boolean; onFlip: () => void; hint?: ReactNode }) {
  return (
    <div className="ie-face-controls">
      {hint && !back ? <p className="ie-face-hint">{hint}</p> : null}
      <LifecycleNotice session={session} />
      <button type="button" className="ie-button" onClick={onFlip}>
        <RotateCcw size={14} aria-hidden="true" />
        {back ? "Back to the card" : "Turn over for more"}
      </button>
      <SaveBar session={session} />
    </div>
  );
}
