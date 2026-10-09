"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { GoalArtifact, Notice } from "@/features/ux-refresh/primitives";
import { Action } from "./common";
import { dateLabel } from "./model";
import { storyPlan } from "./mobile-model";

function LandingActions() {
  return (
    <div className="rf-actions mt-6">
      <Action asChild>
        <Link href="/calendar">
          Go to app <ArrowRight size={16} />
        </Link>
      </Action>
      <Action variant="outline" asChild>
        <Link href="/demo">Try demo</Link>
      </Action>
    </div>
  );
}
export function LandingBaseline() {
  return (
    <div className="fc-product fc-marketing">
      <p className="type-wordmark">Goalmaxxing</p>
      <h2 className="type-hero mt-8">
        Achieve your goals using one focused system
      </h2>
      <p className="my-5">
        Deeply customizable goals beyond basic habits. Fully adjustable sessions
        for when plans and priorities change.
      </p>
      <LandingActions />
      <div className="fc-mini-browser mt-8">
        <div className="fc-between">
          <strong className="type-item">Your plan</strong>
          <span className="fc-muted">Month · Solo</span>
        </div>
        <div className="fc-dense-proof">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i}>
              <small>{i < 31 ? i + 1 : ""}</small>
              {[4, 6, 7].includes(i) && (
                <span>{i === 6 ? "Tempo run" : "Easy run"}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="fc-muted mt-4">
        Reconstruction of the hero's overview-first proof, using the same
        running goal as the proposal.
      </p>
    </div>
  );
}
function PlanProof({
  two,
  moved,
  draft,
}: {
  two: boolean;
  moved: boolean;
  draft: boolean;
}) {
  return (
    <div className="fc-plan-proof" aria-label="Example running plan">
      <div className="fc-between">
        <h4 className="type-heading">A week you can work with</h4>
        <span className="fc-muted">Oct 5–11</span>
      </div>
      {storyPlan(two, moved).map((session) => (
        <div
          key={session.id}
          className="fc-line"
          data-moved={session.id === "thu" && moved}
        >
          <div className="fc-date-stamp">
            <small>{dateLabel(session.date).slice(0, 3)}</small>
            <strong className="type-figure">
              {Number(session.date.slice(-2))}
            </strong>
          </div>
          <div className="fc-grow">
            <strong className="type-item">{session.title}</strong>
            <p className="fc-muted">
              {session.duration} · Run a comfortable 10K
            </p>
          </div>
          {session.id === "thu" && moved && (
            <span className="fc-status">{draft ? "Moved" : "Saved"}</span>
          )}
        </div>
      ))}
    </div>
  );
}
export function LandingStudy({ variant }: { variant: number }) {
  const [two, setTwo] = useState(false);
  const [created, setCreated] = useState(variant === 0);
  const [moved, setMoved] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="fc-product fc-marketing">
      <p className="type-wordmark">Goalmaxxing</p>
      <div className="fc-marketing-hero">
        <p className="type-eyebrow">Make room for what matters</p>
        <h2 className="type-hero">
          A goal.
          <br />A workable plan.
          <br />
          Room for real life.
        </h2>
        <p>
          Turn a goal into sessions you can actually do. Adjust the plan when
          your week changes.
        </p>
        <LandingActions />
      </div>
      {variant === 0 ? (
        <>
          <section className="fc-story-chapter">
            <div className="fc-chapter-copy">
              <span className="type-eyebrow">01 / Give it a shape</span>
              <h3 className="type-title">Start with your intention.</h3>
              <p>
                A comfortable 10K. Three runs a week. A goal with a rhythm,
                rather than another item on a list.
              </p>
            </div>
            <div className="fc-story-art">
              <GoalArtifact id="run" completed={0} />
            </div>
          </section>
          <section className="fc-story-chapter">
            <div className="fc-chapter-copy">
              <span className="type-eyebrow">02 / See the next steps</span>
              <h3 className="type-title">Know what to do this week.</h3>
              <p>
                See each session at a readable size. The calendar is there when
                you need the bigger picture.
              </p>
            </div>
            <PlanProof two={false} moved={false} draft={false} />
          </section>
          <section className="fc-story-chapter">
            <div className="fc-chapter-copy">
              <span className="type-eyebrow">03 / Keep it workable</span>
              <h3 className="type-title">
                Thursday changed. Your goal didn't.
              </h3>
              <p>
                Move Thursday's easy run to Friday, review the change, and save
                when you are ready.
              </p>
            </div>
            <div>
              <PlanProof two={false} moved={moved} draft={!saved} />
              <MoveActions
                moved={moved}
                saved={saved}
                onMove={() => setMoved(true)}
                onUndo={() => {
                  setMoved(false);
                  setSaved(false);
                }}
                onSave={() => setSaved(true)}
              />
            </div>
          </section>
        </>
      ) : (
        <section className="fc-interactive-proof">
          <div className="fc-proof-card">
            <GoalArtifact
              id="run"
              completed={0}
              targetOverride={two ? 8 : 12}
            />
          </div>
          <div className="fc-proof-controls">
            <p className="type-eyebrow">Try a small example</p>
            <h3 className="type-title">How often can you run?</h3>
            <p className="fc-muted my-4">
              Choose a rhythm, see the sessions, then make one change.
            </p>
            <div
              className="rf-segments"
              role="group"
              aria-label="Example running rhythm"
            >
              {[false, true].map((value) => (
                <button
                  key={String(value)}
                  aria-pressed={two === value}
                  onClick={() => {
                    setTwo(value);
                    setCreated(false);
                    setMoved(false);
                    setSaved(false);
                  }}
                >
                  {value ? "Twice a week" : "Three times a week"}
                </button>
              ))}
            </div>
            {!created ? (
              <Action className="mt-5" onClick={() => setCreated(true)}>
                See example plan <ArrowRight size={16} />
              </Action>
            ) : (
              <>
                <PlanProof two={two} moved={moved} draft={!saved} />
                <MoveActions
                  moved={moved}
                  saved={saved}
                  onMove={() => setMoved(true)}
                  onUndo={() => {
                    setMoved(false);
                    setSaved(false);
                  }}
                  onSave={() => setSaved(true)}
                />
              </>
            )}
          </div>
        </section>
      )}
      <div className="fc-marketing-end">
        <h3 className="type-title">
          Keep the goal.
          <br />
          Make the plan fit.
        </h3>
        <LandingActions />
      </div>
    </div>
  );
}
function MoveActions({
  moved,
  saved,
  onMove,
  onUndo,
  onSave,
}: {
  moved: boolean;
  saved: boolean;
  onMove: () => void;
  onUndo: () => void;
  onSave: () => void;
}) {
  return (
    <div className="mt-5">
      {saved ? (
        <Notice>
          <Check aria-hidden size={14} className="inline" /> Example saved. Your
          run is now on Friday.
        </Notice>
      ) : moved ? (
        <>
          <p className="fc-muted mb-3">One change · Thursday → Friday</p>
          <div className="rf-actions">
            <Action variant="outline" onClick={onUndo}>
              Undo move
            </Action>
            <Action onClick={onSave}>Save example plan</Action>
          </div>
        </>
      ) : (
        <Action variant="outline" onClick={onMove}>
          Move Thursday's run to Friday <ArrowRight size={16} />
        </Action>
      )}
      {saved && (
        <Action variant="ghost" onClick={onUndo}>
          Reset example
        </Action>
      )}
    </div>
  );
}
