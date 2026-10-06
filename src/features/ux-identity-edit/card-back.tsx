"use client";

import { Award, ChevronDown, ChevronLeft, Gift, Link2, ListOrdered, Minus, Palette, Plus, Quote } from "lucide-react";
import { type ComponentType, useRef, useState } from "react";
import { EDIT_FACT_LABELS, isMilestoneGoal, summarizeFact, type EditFact } from "./edit-model";
import { ColourPicker } from "./colour-picker";
import { FactEditor, GoalLifecycleActions, Reveal } from "./fact-editors";
import { InlineFact, useDismiss, WIDE_FACTS } from "./inline-fact";
import type { EditSession } from "./use-edit-session";

export type BackStyle = "list" | "note" | "tiles";

export const BACK_STYLES: { id: BackStyle; name: string }[] = [
  { id: "list", name: "List" },
  { id: "note", name: "Note" },
  { id: "tiles", name: "Tiles" },
];

const ICONS: Partial<Record<EditFact, ComponentType<{ size?: number; className?: string }>>> = {
  description: Quote,
  reward: Gift,
  plaque: Award,
  milestones: ListOrdered,
  link: Link2,
  color: Palette,
};

function backFacts(session: EditSession): EditFact[] {
  return ["description", "reward", "plaque", ...(isMilestoneGoal(session.fields) ? (["milestones"] as const) : []), "link", "color"];
}

export function CardBack({ session, backStyle }: { session: EditSession; backStyle: BackStyle }) {
  const Back = { list: ListBack, note: NoteBack, tiles: TilesBack }[backStyle];
  return (
    <div className="ie-back" data-style={backStyle}>
      <header className="ie-back-head">
        <span className="ie-overline">More about this goal</span>
      </header>
      <div className="ie-back-body">
        <Back session={session} />
      </div>
      <footer className="ie-back-foot">
        <GoalLifecycleActions session={session} />
      </footer>
    </div>
  );
}

/* ── List: grouped rows, each expanding in place ── */

function ListBack({ session }: { session: EditSession }) {
  const [open, setOpen] = useState<EditFact | null>(null);
  const groups: { title: string; facts: EditFact[] }[] = [
    { title: "For you", facts: ["description", "reward"] },
    { title: "Progress", facts: ["plaque", ...(isMilestoneGoal(session.fields) ? (["milestones"] as const) : [])] },
    { title: "Connections & look", facts: ["link", "color"] },
  ];
  return (
    <>
      {groups.map((group) => (
        <section key={group.title} className="ie-back-group">
          <h4>{group.title}</h4>
          {group.facts.map((fact) => (
            <ListRow key={fact} fact={fact} session={session} open={open === fact} onOpen={() => setOpen(fact)} onDone={() => setOpen((current) => (current === fact ? null : current))} />
          ))}
        </section>
      ))}
    </>
  );
}

/** A row edits where it stands: short facts swap their value for the control; wide ones open under the label. */
function ListRow({ fact, session, open, onOpen, onDone }: { fact: EditFact; session: EditSession; open: boolean; onOpen: () => void; onDone: () => void }) {
  const row = useRef<HTMLDivElement>(null);
  useDismiss(row, open, onDone);
  const Icon = ICONS[fact]!;
  const wide = WIDE_FACTS.includes(fact);
  // The back is card-sized, so a wide editor scrolls its row to the top to make room.
  // It waits for the editor's grow animation, since there is nothing to scroll until then.
  const grown = () => {
    const body = row.current?.closest(".ie-back-body");
    if (wide && row.current && body) body.scrollTo({ top: row.current.offsetTop - 6, behavior: "smooth" });
  };
  const head = (
    <>
      <Icon size={15} className="ie-back-icon" />
      <span className="ie-back-label">{EDIT_FACT_LABELS[fact]}</span>
    </>
  );
  return (
    <div ref={row} className="ie-back-row" data-open={open} data-wide={wide} data-changed={session.changed.includes(fact)}>
      {open ? (
        <>
          <div className="ie-back-row-head">
            {head}
            {!wide && <span className="ie-back-control"><InlineFact fact={fact} session={session} onDone={onDone} /></span>}
          </div>
          {wide && <div className="ie-back-wide" onAnimationEnd={(event) => event.target === event.currentTarget && grown()}><InlineFact fact={fact} session={session} onDone={onDone} /></div>}
        </>
      ) : (
        <button type="button" className="ie-back-row-head" onClick={onOpen}>
          {head}
          <span className="ie-back-value">
            {fact === "color" && <i className="ie-dot" style={{ background: session.fields.color }} />}
            {summarizeFact(fact, session.fields, session.linkOptions)}
          </span>
          <ChevronDown size={14} className="ie-back-chevron" />
        </button>
      )}
    </div>
  );
}

/* ── Note: write on the back of the card; the rest are fill-in sentences ── */

function NoteBack({ session }: { session: EditSession }) {
  const { fields, patch } = session;
  const [linkOpen, setLinkOpen] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const plaque = Number(fields.plaque_target) || 1;
  const link = summarizeFact("link", fields, session.linkOptions);
  return (
    <div className="ie-note">
      <textarea
        className="ie-note-why"
        aria-label="Why it matters"
        placeholder="Why this matters to me…"
        rows={3}
        value={fields.description}
        onChange={(event) => patch({ description: event.target.value })}
      />
      <p className="ie-note-line">
        When I finish, I’ll treat myself to{" "}
        <input
          className="ie-note-blank"
          aria-label="Your reward"
          placeholder="something good"
          value={fields.reward_text}
          size={Math.max(15, fields.reward_text.length + 1)}
          onChange={(event) => patch({ reward_text: event.target.value })}
        />
        .
      </p>
      <p className="ie-note-line">
        I earn its achievement after{" "}
        <span className="ie-note-stepper">
          <button type="button" aria-label="Fewer" disabled={plaque <= 1} onClick={() => patch({ plaque_target: String(plaque - 1) })}><Minus size={12} /></button>
          <strong>{plaque}</strong>
          <button type="button" aria-label="More" disabled={plaque >= 20} onClick={() => patch({ plaque_target: String(plaque + 1) })}><Plus size={12} /></button>
        </span>{" "}
        completions.
      </p>
      <div className="ie-note-line">
        Each session also counts toward{" "}
        <button type="button" className="ie-note-pick" aria-expanded={linkOpen} onClick={() => setLinkOpen(!linkOpen)}>
          {link} <ChevronDown size={12} />
        </button>
        {linkOpen && (
          <Reveal>
            <div className="ie-note-options" role="listbox" aria-label="Also counts toward">
              {[{ id: "none", title: "Just this goal" }, ...session.linkOptions].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={fields.linked_target_goal_id === option.id}
                  onClick={() => {
                    patch({ linked_target_goal_id: option.id });
                    setLinkOpen(false);
                  }}
                >
                  {option.title}
                </button>
              ))}
            </div>
          </Reveal>
        )}
      </div>
      <div className="ie-note-line">
        Card colour
        <ColourPicker session={session} />
      </div>
      {isMilestoneGoal(fields) && (
        <div className="ie-note-line">
          <button type="button" className="ie-note-pick" aria-expanded={milestonesOpen} onClick={() => setMilestonesOpen(!milestonesOpen)}>
            Name the milestones · {summarizeFact("milestones", fields, session.linkOptions)} <ChevronDown size={12} />
          </button>
          {milestonesOpen && (
            <Reveal>
              <div className="ie-back-editor"><FactEditor fact="milestones" session={session} /></div>
            </Reveal>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Tiles: compartments; one opens to fill the back ── */

function TilesBack({ session }: { session: EditSession }) {
  const [active, setActive] = useState<EditFact | null>(null);
  if (active) {
    const Icon = ICONS[active]!;
    return (
      <div className="ie-tile-detail" key={active}>
        <button type="button" className="ie-tile-back" onClick={() => setActive(null)}>
          <ChevronLeft size={15} /> All settings
        </button>
        <h4><Icon size={16} /> {EDIT_FACT_LABELS[active]}</h4>
        <FactEditor fact={active} session={session} />
      </div>
    );
  }
  return (
    <div className="ie-tiles">
      {backFacts(session).map((fact) => {
        const Icon = ICONS[fact]!;
        return (
          <button key={fact} type="button" className="ie-tile" data-fact={fact} data-changed={session.changed.includes(fact)} onClick={() => setActive(fact)}>
            <Icon size={16} className="ie-back-icon" />
            <span className="ie-tile-label">{EDIT_FACT_LABELS[fact]}</span>
            <span className="ie-tile-value">
              {fact === "color" && <i className="ie-dot" style={{ background: session.fields.color }} />}
              {fact === "plaque" ? <strong>{session.fields.plaque_target}</strong> : null}
              {fact === "plaque" ? " completions" : summarizeFact(fact, session.fields, session.linkOptions)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
