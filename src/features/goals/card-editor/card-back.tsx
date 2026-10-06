"use client";

import { Archive, Award, ChevronDown, Gift, Link2, ListOrdered, Palette, Quote, Trash2, Undo2 } from "lucide-react";
import { type ComponentType, useRef, useState } from "react";
import type { CardEditorSession } from "./card-editor-session";
import { type BackFact, CARD_FACT_LABELS, hasPlaqueTarget, isMilestoneGoal, summarizeBackFact } from "./card-facts";
import { InlineFact, useDismiss, useEscapeLayer, WIDE_FACTS } from "./inline-fact";
import "./card-editor.css";

export interface CardLifecycle {
  archived: boolean;
  busy: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

const ICONS: Record<BackFact, ComponentType<{ size?: number; className?: string }>> = {
  description: Quote,
  reward: Gift,
  plaque: Award,
  milestones: ListOrdered,
  link: Link2,
  color: Palette,
};

/**
 * The card's back: the goal's quieter settings as grouped rows that edit in place.
 * Without `lifecycle` (a goal not created yet) there is nothing to archive or delete.
 * `hidden` leaves out rows another surface already owns (creation sets those in its steps).
 */
export function CardBack({
  session,
  lifecycle,
  hidden = [],
  heading = "More about this goal",
}: {
  session: CardEditorSession;
  lifecycle?: CardLifecycle;
  hidden?: BackFact[];
  /** The back's overline; creation names it "Advanced settings". */
  heading?: string;
}) {
  const [open, setOpen] = useState<BackFact | null>(null);
  const { fields } = session;
  const groups: { title: string; facts: BackFact[] }[] = [
    { title: "For you", facts: ["description", "reward"] },
    { title: "Progress", facts: [...(hasPlaqueTarget(fields) ? (["plaque"] as const) : []), ...(isMilestoneGoal(fields) ? (["milestones"] as const) : [])] },
    { title: "Connections & look", facts: [...(session.link ? (["link"] as const) : []), "color"] },
  ];
  const shown = groups
    .map((group) => ({ ...group, facts: group.facts.filter((fact) => !hidden.includes(fact)) }))
    .filter((group) => group.facts.length > 0);
  return (
    <div className="card-back">
      <header className="card-back-head">
        <span className="card-overline">{heading}</span>
      </header>
      <div className="card-back-body">
        {shown.map((group) => (
          <section key={group.title} className="card-back-group">
            <h4>{group.title}</h4>
            {group.facts.map((fact) => (
              <BackRow
                key={fact}
                fact={fact}
                session={session}
                open={open === fact}
                onOpen={() => setOpen(fact)}
                onDone={() => setOpen((current) => (current === fact ? null : current))}
              />
            ))}
          </section>
        ))}
      </div>
      {lifecycle ? (
        <footer className="card-back-foot">
          <LifecycleActions lifecycle={lifecycle} title={fields.title} />
        </footer>
      ) : null}
    </div>
  );
}

/** A row edits where it stands: short facts swap their value for the control; wide ones open under the label. */
function BackRow({ fact, session, open, onOpen, onDone }: { fact: BackFact; session: CardEditorSession; open: boolean; onOpen: () => void; onDone: () => void }) {
  const row = useRef<HTMLDivElement>(null);
  useDismiss(row, open, onDone);
  useEscapeLayer(open, onDone);
  const Icon = ICONS[fact];
  const wide = WIDE_FACTS.includes(fact);
  // The back is card-sized: once a wide editor has grown, scroll its row up to make room.
  const grown = () => {
    const body = row.current?.closest(".card-back-body");
    if (row.current && body) body.scrollTo({ top: row.current.offsetTop - 6, behavior: "smooth" });
  };
  const head = (
    <>
      <Icon size={15} className="card-back-icon" />
      <span className="card-back-label">{CARD_FACT_LABELS[fact]}</span>
    </>
  );
  return (
    <div ref={row} className="card-back-row" data-open={open} data-changed={session.changed.has(fact)}>
      {open ? (
        <>
          <div className="card-back-row-head">
            {head}
            {!wide && <span className="card-back-control"><InlineFact fact={fact} session={session} onDone={onDone} /></span>}
          </div>
          {wide && (
            <div className="card-back-wide" onAnimationEnd={(event) => event.target === event.currentTarget && grown()}>
              <InlineFact fact={fact} session={session} onDone={onDone} />
            </div>
          )}
        </>
      ) : (
        <button type="button" className="card-back-row-head" disabled={session.pastEnd} onClick={onOpen}>
          {head}
          <span className="card-back-value">
            {fact === "color" && <i className="card-dot" style={{ background: session.fields.color }} />}
            {summarizeBackFact(fact, session.fields, session.link?.selectedTitle ?? null)}
          </span>
          <ChevronDown size={14} className="card-back-chevron" />
        </button>
      )}
    </div>
  );
}

/** Archive or restore, and a delete that confirms in place: the only irreversible action. */
function LifecycleActions({ lifecycle, title }: { lifecycle: CardLifecycle; title: string }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="card-confirm" role="alertdialog" aria-label="Delete goal">
        <p>
          <strong>Delete “{title.trim() || "this goal"}”?</strong> Its history and plan go with it.
        </p>
        <div>
          <button type="button" className="card-button" onClick={() => setConfirming(false)}>Keep it</button>
          <button type="button" className="card-button card-button-danger" disabled={lifecycle.busy} onClick={lifecycle.onDelete}>Delete goal</button>
        </div>
      </div>
    );
  }
  return (
    <div className="card-lifecycle">
      <button type="button" disabled={lifecycle.busy} onClick={lifecycle.archived ? lifecycle.onRestore : lifecycle.onArchive}>
        {lifecycle.archived ? <Undo2 size={15} /> : <Archive size={15} />}
        {lifecycle.archived ? "Restore goal" : "Archive goal"}
      </button>
      <button type="button" className="card-delete" disabled={lifecycle.busy} onClick={() => setConfirming(true)}>
        <Trash2 size={15} /> Delete goal
      </button>
    </div>
  );
}
