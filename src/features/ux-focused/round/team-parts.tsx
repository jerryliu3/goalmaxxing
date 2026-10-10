"use client";
import { useState } from "react";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { Action, Empty, PersonMark } from "../common";
import { TEAM_GOALS, dateLabel, type TeamSession } from "../model";
export function PartnerAcknowledgement() {
  const [read, setRead] = useState(false);
  return (
    <>
      <Action variant="outline" disabled={read} onClick={() => setRead(true)}>
        {read ? (
          <>
            <Check size={16} /> Alex knows you’ve read it
          </>
        ) : (
          "Let Alex know I’ve read this"
        )}
      </Action>
      <p className="rd-muted mt-3">
        Acknowledges the note. Does not book a session or promise attendance.
      </p>
    </>
  );
}
export function SharedGoals({
  sessions,
  noGoals,
  onGoal,
  onChoose,
}: {
  sessions: readonly TeamSession[];
  noGoals: boolean;
  onGoal: (id: string) => void;
  onChoose: () => void;
}) {
  const goals = noGoals
    ? []
    : TEAM_GOALS.filter((g) => sessions.some((s) => s.goal === g.id));
  return (
    <section className="rd-section">
      <div className="rd-between">
        <h3 className="type-heading">Shared goals</h3>
        <span className="rd-muted">{goals.length} together</span>
      </div>
      {goals.length ? (
        goals.map((g) => (
          <button
            className="rd-goal-link"
            key={g.id}
            onClick={() => onGoal(g.id)}
          >
            <span>
              <strong className="type-item">{g.title}</strong>
              <small>{g.detail}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))
      ) : (
        <Empty title="What will you work on together?">
          <p>Pick a shared intention. Your personal goals remain your own.</p>
          <Action onClick={onChoose}>Choose a team goal</Action>
        </Empty>
      )}
    </section>
  );
}
export function SessionReceipts({
  sessions,
  onGoal,
}: {
  sessions: readonly TeamSession[];
  onGoal?: (id: string) => void;
}) {
  return (
    <ul className="rd-session-receipts">
      {sessions.map((s) => (
        <li key={s.id}>
          <PersonMark partner={s.person === "partner"} />
          <div>
            <p className="type-item">{s.title}</p>
            <p className="rd-muted">
              {s.person === "you" ? "You" : "Alex"} · {dateLabel(s.date)} ·{" "}
              {s.done ? "Recorded" : s.time}
            </p>
          </div>
          {onGoal && (
            <Action
              variant="ghost"
              aria-label={`Inspect ${s.title}`}
              onClick={() => onGoal(s.goal)}
            >
              <ArrowUpRight size={16} />
            </Action>
          )}
        </li>
      ))}
    </ul>
  );
}
