"use client";
import { ArrowRight, Check, Undo2 } from "lucide-react";
import { GoalArtifact, Notice } from "@/features/ux-refresh/primitives";
import { Action, HoldCompletion } from "../common";
import { TODAY, dateLabel } from "../model";
import {
  LANDING_STORIES,
  lessonSessions,
  type LessonAction,
  type LessonState,
} from "./landing-model";
export function LessonGoal({ state }: { state: LessonState }) {
  const story = LANDING_STORIES.find((s) => s.id === state.story)!;
  const target = state.story === "rhythm" ? state.target : story.target;
  return (
    <div className="rd-landing-art">
      <GoalArtifact
        id={story.artifact}
        nameOverride={story.title}
        targetOverride={target}
        completed={lessonSessions(state).filter((s) => s.done).length}
      />
    </div>
  );
}
export function TargetChoice({
  state,
  onAction,
}: {
  state: LessonState;
  onAction: (a: LessonAction) => void;
}) {
  return state.story === "rhythm" ? (
    <fieldset className="rd-target-choice">
      <legend className="type-item">An October target that fits</legend>
      <div className="rd-scopes">
        {([8, 12] as const).map((n) => (
          <button
            key={n}
            aria-pressed={state.target === n}
            onClick={() => onAction({ type: "target", target: n })}
          >
            {n} runs this month
            <small>{n === 8 ? "About two a week" : "About three a week"}</small>
          </button>
        ))}
      </div>
      <p className="rd-muted">
        Change the target to see a lighter or fuller example week.
      </p>
    </fieldset>
  ) : (
    <p className="rd-contract">
      Six sessions in October · Choose concrete work for a finished result.
    </p>
  );
}
export function LessonPlan({
  state,
  onAction,
  canRecord = false,
}: {
  state: LessonState;
  onAction: (a: LessonAction) => void;
  canRecord?: boolean;
}) {
  const sessions = lessonSessions(state);
  return (
    <section className="rd-lesson-plan" aria-label="Interactive example plan">
      <header className="rd-between">
        <h4 className="type-heading">Your placed work</h4>
        <span className="rd-muted">Oct 5–11</span>
      </header>
      <ul>
        {sessions.map((s) => (
          <li key={s.id} data-changed={s.id === "change" && state.moved}>
            <div className="rd-lesson-date">
              <small>{dateLabel(s.date).slice(0, 3)}</small>
              <strong className="type-figure">
                {Number(s.date.slice(-2))}
              </strong>
            </div>
            <div className="rd-lesson-title">
              <strong className="type-item">{s.title}</strong>
              <small>
                {s.person === "partner" ? "Alex · " : ""}
                {s.minutes} min
                {s.id === "change" && state.moved
                  ? ` · ${state.saved ? "Saved move" : "Unsaved move"}`
                  : ""}
              </small>
            </div>
            {canRecord ? (
              <HoldCompletion
                done={s.done}
                disabled={
                  s.person !== "you" ||
                  s.date > TODAY ||
                  (s.id === "change" && state.moved && !state.saved)
                }
                title={`${s.title}, ${dateLabel(s.date)}`}
                onCommit={() => onAction({ type: "toggle", id: s.id })}
              />
            ) : (
              <span className="rd-lesson-status">
                {s.done ? (
                  <>
                    <Check size={14} /> Done
                  </>
                ) : (
                  "Planned"
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
export function LessonMove({
  state,
  onAction,
}: {
  state: LessonState;
  onAction: (a: LessonAction) => void;
}) {
  const change = lessonSessions(state).find((s) => s.id === "change")!;
  return (
    <div className="rd-lesson-move">
      {state.saved ? (
        <>
          <Notice>Example plan saved. {change.title} is now on Friday.</Notice>
          <Action variant="ghost" onClick={() => onAction({ type: "reset" })}>
            Reset example
          </Action>
        </>
      ) : state.moved ? (
        <div className="rd-lesson-review">
          <p className="type-item">One change to review</p>
          <p>Thursday 8 → Friday 9 · {change.title}</p>
          <div className="rf-actions">
            <Action
              variant="outline"
              onClick={() => onAction({ type: "undo" })}
            >
              <Undo2 size={15} /> Undo move
            </Action>
            <Action onClick={() => onAction({ type: "save" })}>
              Save example plan
            </Action>
          </div>
        </div>
      ) : (
        <>
          <Action
            variant="outline"
            disabled={change.done}
            onClick={() => onAction({ type: "move" })}
          >
            Move Thursday’s session to Friday <ArrowRight size={16} />
          </Action>
          {change.done && (
            <p className="rd-muted">
              This session is recorded. Undo its completion before moving it.
            </p>
          )}
        </>
      )}
    </div>
  );
}
export function CoachProof({
  state,
  onAction,
}: {
  state: LessonState;
  onAction: (a: LessonAction) => void;
}) {
  const change = lessonSessions(state).find((s) => s.id === "change")!;
  return (
    <div className="rd-coach-proof">
      <p className="type-eyebrow">Coach example · A suggestion you review</p>
      <blockquote>
        “Thursday is busy. Could I do {change.title.toLowerCase()} on Friday?”
      </blockquote>
      <div className="rd-coach-answer">
        <p>
          One option is to move that session to Friday. Keep the rest of the
          week where it is.
        </p>
        {!state.moved && (
          <Action
            variant="outline"
            disabled={change.done}
            onClick={() => onAction({ type: "move" })}
          >
            Review this suggestion
          </Action>
        )}
      </div>
      <p className="rd-muted">
        Review a proposal, then save only if it works for you.
      </p>
    </div>
  );
}
