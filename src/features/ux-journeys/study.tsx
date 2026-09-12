"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { Creation } from "./creation";
import { History } from "./history";
import { Score } from "./score";
import { CONCEPTS, type Concept, type Draft, rhythm } from "./model";
import { DraftReceipt } from "./fields";
import "./study.css";

export function JourneysStudy() {
  const [concept, setConcept] = useState<Concept>("tempo");
  const [journey, setJourney] = useState<"Create" | "Remember" | "Grow">(
    "Create",
  );
  const createButton = useRef<HTMLButtonElement>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Draft[]>([]);
  const current = CONCEPTS.find((c) => c.id === concept)!;
  return (
    <main className={`j-study j-${concept}`}>
      <header className="j-toolbar">
        <a href="https://goalmaxxing.xyz/ux" className="j-brand">
          <span>g↗</span>
          <div>
            GOALMAXXING<small>JOURNEYS / A DEEPER STUDY</small>
          </div>
        </a>
        <span className="j-small">
          03 families · 09 explorations · local demo
        </span>
        <a href="https://goalmaxxing.xyz/ux/next-wave" className="j-back-link">
          Next Wave <ArrowUpRight size={14} />
        </a>
      </header>
      <nav className="j-concept-nav" aria-label="Concept families">
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            aria-pressed={concept === c.id}
            onClick={() => setConcept(c.id)}
          >
            <span>{c.number}</span>
            <strong>{c.name}</strong>
            <small>
              {c.id === "tempo"
                ? "The commitment"
                : c.id === "weave"
                  ? "The continuity"
                  : "The chapter"}
            </small>
            <i className={`j-swatch j-swatch-${c.id}`} />
          </button>
        ))}
      </nav>
      <div className="j-app">
        <div className="j-app-bar">
          <span className="j-wordmark">
            goalmaxxing<span>↗</span>
          </span>
          <nav aria-label="UX journeys">
            {(["Create", "Remember", "Grow"] as const).map((j, i) => (
              <button
                aria-pressed={journey === j}
                key={j}
                onClick={() => setJourney(j)}
              >
                <span>0{i + 1}</span>
                {j}
              </button>
            ))}
          </nav>
          <span className="j-avatar">JL</span>
        </div>
        <div className="j-content">
          {journey === "Create" ? (
            <>
              <div className="j-hero">
                <div>
                  <span className="j-kicker">01 / {current.creation}</span>
                  <h1>{current.title}</h1>
                  <p>{current.idea}</p>
                  <button
                    className="j-primary"
                    ref={createButton}
                    onClick={() => setCreating(true)}
                  >
                    Create a goal <Plus size={18} />
                  </button>
                  <span className="j-hero-footnote">
                    Five small steps. All the depth, when you need it.
                  </span>
                </div>
                <div
                  className={`j-cover j-cover-${concept}`}
                  aria-hidden="true"
                >
                  {concept === "tempo" ? (
                    <>
                      <div className="j-cover-top">
                        A COMMITMENT TO YOURSELF <span>↗</span>
                      </div>
                      <div className="j-cover-number">
                        03<small>days a week</small>
                      </div>
                      <div className="j-cover-line" />
                      <h2>
                        Run a first
                        <br />
                        half marathon.
                      </h2>
                      <div className="j-cover-bottom">
                        <span>HEALTH / AUTUMN ’26</span>
                        <span>BEGIN AGAIN, ANY DAY.</span>
                      </div>
                    </>
                  ) : concept === "weave" ? (
                    <>
                      <span className="j-kicker">A SMALL RETURN, REPEATED</span>
                      <h2>
                        A stronger thread
                        <br />
                        through your week.
                      </h2>
                      <div className="j-cover-weave">
                        {Array.from({ length: 6 }, (_, r) => (
                          <div key={r}>
                            {Array.from({ length: 7 }, (_, c) => (
                              <span
                                key={c}
                                className={(c + r) % 3 === 0 ? "filled" : ""}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                      <span className="j-cover-caption">
                        Every return becomes part of the pattern.
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="j-kicker">
                        A NOTE FOR THE SEASON AHEAD
                      </span>
                      <div className="j-cover-script">
                        I want to feel
                        <br />
                        <em>a little stronger.</em>
                        <br />
                        So I’ll start with
                        <br />
                        <span>three small returns</span>
                        <br />
                        each week.
                      </div>
                      <span className="j-signature">
                        One intention. Room to unfold.
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="j-journey-strip">
                {[
                  [
                    "01",
                    "Choose your approach",
                    "Single goal or an assisted draft.",
                  ],
                  ["02", "Give it a purpose", "Name, category, and your why."],
                  ["03", "Find its shape", "Recurring, milestones, or a task."],
                  ["04", "Make it fit", "Dates, optional time, all settings."],
                  ["05", "Make it yours", "Review, refine, and begin."],
                ].map(([n, title, body]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
              {created.length > 0 && (
                <section className="j-created">
                  <div className="j-between">
                    <h2>Your study plan</h2>
                    <span className="j-small">
                      {created.length} added · shared across concepts
                    </span>
                  </div>
                  {created.map((d) => (
                    <details key={d.id}>
                      <summary>
                        <span>
                          <strong>{d.title}</strong>
                          <small>{rhythm(d)}</small>
                        </span>
                        <ArrowUpRight size={16} />
                      </summary>
                      <DraftReceipt draft={d} />
                    </details>
                  ))}
                </section>
              )}
              <div className="j-next-journeys">
                <button onClick={() => setJourney("Remember")}>
                  <span className="j-kicker">02 / {current.history}</span>
                  <h3>What happens after the finish?</h3>
                  <span>
                    Explore the history <ArrowRight size={16} />
                  </span>
                </button>
                <button onClick={() => setJourney("Grow")}>
                  <span className="j-kicker">03 / {current.score}</span>
                  <h3>See effort become momentum.</h3>
                  <span>
                    Try the score simulator <ArrowRight size={16} />
                  </span>
                </button>
              </div>
            </>
          ) : journey === "Remember" ? (
            <History concept={concept} />
          ) : (
            <Score concept={concept} />
          )}
          <details className="j-study-notes">
            <summary>
              <Sparkles size={15} />
              Compare the three families
            </summary>
            <div className="j-comparison">
              <div>
                <strong>Tempo</strong>
                <p>
                  Commitment studio → Victory ledger → Momentum. Bold numbers,
                  tangible receipts, an instrument-like score.
                </p>
              </div>
              <div>
                <strong>Weave</strong>
                <p>
                  Rhythm loom → Woven history → Rhythm. Goal lanes, persistent
                  completion knots, a pattern that gains density.
                </p>
              </div>
              <div>
                <strong>Script</strong>
                <p>
                  Living brief → Chapters → Form. A guided statement,
                  chronological chapters, a narrative backed by a precise score.
                </p>
              </div>
            </div>
            <p>
              <strong>This family’s tradeoff:</strong> {current.tradeoff}
            </p>
            <p>
              Compare using the same tasks: create a weekly goal with a lifetime
              target, review two assisted drafts, inspect an ended goal, then
              simulate two weeks away. All concepts keep the same field
              capabilities and score formula. The existing product locks remain
              unchanged.
            </p>
          </details>
        </div>
        <footer className="j-page-footer">
          <span>DESIGNED AROUND THE RETURN.</span>
          <span>Exploratory study / September 2026</span>
        </footer>
      </div>
      <Creation
        returnFocusRef={createButton}
        concept={concept}
        open={creating}
        onOpenChange={setCreating}
        onCreated={(drafts) =>
          setCreated((previous) => [...previous, ...drafts])
        }
      />
    </main>
  );
}
