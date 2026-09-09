import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { type CSSProperties } from "react";
import { DAYS, GOALS, type Concept, goalClass, minutesLabel } from "./model";
import type { Study } from "./use-study";
import { GoalMark } from "./primitives";

export function Progress({ concept, s }: { concept: Concept; s: Study }) {
  const items = s.items.filter(
    (x) => s.filter === "All goals" || x.goal === s.filter,
  );
  const completed = items.filter((x) => x.done),
    planned = items.filter((x) => x.day !== null);
  const percent = planned.length
    ? Math.round((completed.length / planned.length) * 100)
    : 0;
  const total = completed.reduce((a, x) => a + x.minutes, 0);
  const headlines: Record<Concept, [string, string]> = {
    prism: ["Look what", "you’re building."],
    tempo: ["Effort in.", "Momentum out."],
    weave: ["A rhythm", "worth keeping."],
    mosaic: ["Your effort,", "taking shape."],
    script: ["Here’s what", "you made happen."],
  };
  return (
    <div className={`progress-layout progress-${concept}`}>
      <div className="progress-heading">
        <div>
          <span className="eyebrow">PROGRESS · SEPTEMBER 7–13</span>
          <h1>
            {headlines[concept][0]}
            <br />
            <em>{headlines[concept][1]}</em>
          </h1>
        </div>
        <p className="muted">
          Small actions. Visible evidence.
          <br />
          Every mark is a session you completed.
        </p>
      </div>
      <div className="goal-filters">
        {["All goals", ...GOALS].map((g) => (
          <button
            key={g}
            aria-pressed={s.filter === g}
            onClick={() => s.setFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="progress-columns">
        <section className="progress-visual">
          {concept === "prism" && (
            <>
              <div className="section-label">
                <span>YOUR WEEK, LAYER BY LAYER</span>
                <span>{completed.length} completed</span>
              </div>
              <div className="progress-stack">
                {completed.length ? (
                  completed.map((x, i) => (
                    <button
                      key={x.id}
                      className={`evidence-slab ${goalClass(x.goal)}`}
                      style={{ "--i": i } as CSSProperties}
                      onClick={() => s.setSelected(x.id)}
                    >
                      <span>
                        <Check size={18} />
                        {x.title}
                      </span>
                      <b>{x.minutes}m</b>
                      <span>SEP {x.day! + 7}</span>
                    </button>
                  ))
                ) : (
                  <p>Your first layer begins with one completed session.</p>
                )}
              </div>
              <p className="visual-caption">
                A layer for every session. Tap to inspect the record.
              </p>
            </>
          )}
          {concept === "tempo" && (
            <>
              <div className="section-label">
                <span>TIME YOU SHOWED UP FOR</span>
                <ArrowUpRight size={22} />
              </div>
              <div className="tempo-progress-number">
                {total}
                <span>MINUTES</span>
              </div>
              <div className="tempo-bars">
                {DAYS.map((d, i) => {
                  const minutes = completed
                    .filter((x) => x.day === i)
                    .reduce((a, x) => a + x.minutes, 0);
                  return (
                    <button
                      key={d}
                      aria-label={`${d}: ${minutes} completed minutes`}
                      onClick={() => s.setDay(i)}
                      aria-pressed={s.day === i}
                    >
                      <b>{minutes || "—"}</b>
                      <span
                        style={{ height: `${Math.max(4, minutes / 1.2)}px` }}
                      />
                      <small>{d}</small>
                    </button>
                  );
                })}
              </div>
              <p className="visual-caption">
                Completed minutes per day · Select a day to inspect below
              </p>
            </>
          )}
          {concept === "weave" && (
            <>
              <div className="section-label">
                <span>THE THREADS YOU’RE KEEPING</span>
                <span>THIS WEEK</span>
              </div>
              <div className="progress-weave">
                {GOALS.filter(
                  (g) => s.filter === "All goals" || s.filter === g,
                ).map((g) => (
                  <div key={g} className={goalClass(g)}>
                    <strong>{g}</strong>
                    <div>
                      {DAYS.map((d, i) => {
                        const sessions = items.filter(
                          (x) => x.goal === g && x.day === i,
                        );
                        return (
                          <button
                            key={d}
                            aria-label={`${g}, ${d}: ${sessions.filter((x) => x.done).length} complete of ${sessions.length}`}
                            onClick={() => s.setDay(i)}
                          >
                            <span
                              className={
                                sessions.some((x) => x.done)
                                  ? "solid"
                                  : sessions.length
                                    ? "planned"
                                    : ""
                              }
                            >
                              {sessions.some((x) => x.done) ? (
                                <Check size={13} />
                              ) : null}
                            </span>
                            <small>{d}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="visual-caption">
                Solid knots are completed. Outlines are planned. Empty space is
                allowed.
              </p>
            </>
          )}
          {concept === "mosaic" && (
            <>
              <div className="section-label">
                <span>THIS WEEK’S COLLECTION</span>
                <span>{completed.length} PIECES</span>
              </div>
              <div className="evidence-mosaic">
                {completed.map((x, i) => (
                  <button
                    key={x.id}
                    className={goalClass(x.goal)}
                    onClick={() => s.setSelected(x.id)}
                  >
                    <span>
                      SEP {x.day! + 7}
                      <ArrowUpRight size={18} />
                    </span>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <strong>{x.title}</strong>
                    <span>
                      {x.minutes} minutes
                      <Check size={16} />
                    </span>
                  </button>
                ))}
                {Array.from(
                  { length: Math.max(0, 6 - completed.length) },
                  (_, i) => (
                    <div key={i} className="empty-piece">
                      <span>Room to grow</span>
                      <span>+</span>
                    </div>
                  ),
                )}
              </div>
              <p className="visual-caption">
                A piece is a completed session. No points for moving things
                around.
              </p>
            </>
          )}
          {concept === "script" && (
            <div className="script-progress-statement">
              <span className="script-asterisk">✳</span>
              <p>
                You showed up
                <br />
                <strong>{completed.length} times.</strong>
              </p>
              <p>
                You made <strong>{minutesLabel(total)}</strong> for what
                matters.
              </p>
              <div className="script-underline" />
              <span>THIS WEEK IS STILL BEING WRITTEN.</span>
            </div>
          )}
        </section>
        <aside className="progress-evidence">
          <div className="progress-stat">
            <span>THIS WEEK’S PLAN</span>
            <div>
              <strong>
                {completed.length}
                <small> / {planned.length}</small>
              </strong>
              <span>
                {percent}%<br />
                <small>complete</small>
              </span>
            </div>
            <div className="linear-meter">
              <i style={{ width: `${percent}%` }} />
            </div>
            <p>Scheduled sessions completed. Unplanned items are excluded.</p>
          </div>
          <div className="section-label">
            <span>BY GOAL</span>
            <span>COMPLETE / PLANNED</span>
          </div>
          {GOALS.filter((g) => s.filter === "All goals" || s.filter === g).map(
            (g) => (
              <button
                className="goal-evidence"
                key={g}
                onClick={() => s.setFilter(s.filter === g ? "All goals" : g)}
              >
                <GoalMark goal={g} />
                <span>{g}</span>
                <strong>
                  {s.items.filter((x) => x.goal === g && x.done).length}
                  <small>
                    {" "}
                    /{" "}
                    {
                      s.items.filter((x) => x.goal === g && x.day !== null)
                        .length
                    }
                  </small>
                </strong>
                <ChevronRight size={15} />
              </button>
            ),
          )}
          <div className="progress-insight">
            <span className="eyebrow">A USEFUL REFLECTION</span>
            <h3>
              {completed.length > 3
                ? "You made another step count."
                : "Your mornings have momentum."}
            </h3>
            <p>
              {completed.length > 3
                ? "Your latest completion is recorded here and in your plan. Keep choosing the next achievable step."
                : "Your completed sessions so far were in the morning. That may be a useful place for your next session."}
            </p>
            <span className="muted">
              A reflection on this demo’s records, not a prediction.
            </span>
          </div>
        </aside>
      </div>
      <section className="evidence-log">
        <div className="section-label">
          <span>
            SESSION RECORDS · {DAYS[s.day]} {s.day + 7} SEPTEMBER
          </span>
          <div className="log-days">
            {DAYS.map((d, i) => (
              <button
                key={d}
                aria-label={`Inspect ${d} records`}
                aria-pressed={s.day === i}
                onClick={() => s.setDay(i)}
              >
                {d[0]}
              </button>
            ))}
          </div>
        </div>
        {items
          .filter((x) => x.day === s.day && x.done)
          .map((x) => (
            <button
              className="record-row"
              key={x.id}
              onClick={() => s.setSelected(x.id)}
            >
              <Check size={16} />
              <strong>{x.title}</strong>
              <span>
                {x.goal} · {x.minutes} min
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        {!items.some((x) => x.day === s.day && x.done) && (
          <p className="muted">
            No completed sessions on this day. Your plan is still here when
            you’re ready.
          </p>
        )}
      </section>
    </div>
  );
}
