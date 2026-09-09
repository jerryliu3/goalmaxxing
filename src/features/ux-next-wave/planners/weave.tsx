import { Check, CircleDashed, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { DAYS, GOALS, goalClass } from "../model";
import type { Study } from "../use-study";
import {
  DaySummary,
  EmptyDay,
  GoalMark,
  TaskRow,
  Unplanned,
} from "../primitives";

export function Weave({ s }: { s: Study }) {
  const [goal, setGoal] = useState("All goals");
  const goals = goal === "All goals" ? GOALS : GOALS.filter((g) => g === goal);
  return (
    <div className="weave-layout">
      <div className="weave-heading">
        <div>
          <div className="eyebrow">07 — 13 SEPTEMBER</div>
          <h1>
            A week with
            <br />
            <em>a little rhythm.</em>
          </h1>
        </div>
        <div className="weave-legend">
          <span>
            <i />
            Planned
          </span>
          <span>
            <Check size={14} />
            Complete
          </span>
          <span>
            <Plus size={14} />
            Place a session
          </span>
        </div>
      </div>
      <div className="weave-filters">
        {["All goals", ...GOALS].map((g) => (
          <button key={g} aria-pressed={goal === g} onClick={() => setGoal(g)}>
            {g}
          </button>
        ))}
      </div>
      <div className="weave-scroll">
        <div className="weave-board">
          <div className="weave-header">
            <span>Your goals</span>
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => s.setDay(i)}
                className={s.day === i ? "chosen" : ""}
              >
                {d}
                <b>{7 + i}</b>
              </button>
            ))}
          </div>
          {goals.map((g) => (
            <div className={`weave-lane ${goalClass(g)}`} key={g}>
              <div className="lane-name">
                <GoalMark goal={g} />
                <strong>{g}</strong>
                <span>
                  {s.items.filter((x) => x.goal === g && x.done).length}{" "}
                  complete
                </span>
              </div>
              {DAYS.map((d, i) => {
                const items = s.items.filter(
                  (x) => x.goal === g && x.day === i,
                );
                const waiting = s.unplanned.find((x) => x.goal === g);
                return (
                  <div
                    className={`lane-cell ${s.day === i ? "chosen" : ""}`}
                    key={d}
                  >
                    {items.length ? (
                      items.map((x) => (
                        <button
                          key={x.id}
                          className={`weave-knot ${x.done ? "finished" : ""}`}
                          onClick={() => s.setSelected(x.id)}
                        >
                          <span>
                            {x.done ? (
                              <Check size={14} />
                            ) : (
                              <CircleDashed size={14} />
                            )}{" "}
                            {x.time}
                          </span>
                          <strong>{x.title}</strong>
                          <small>{x.minutes}m</small>
                        </button>
                      ))
                    ) : (
                      <button
                        className="weave-empty"
                        aria-label={
                          waiting
                            ? `Place ${waiting.title} on ${d}`
                            : `Inspect ${d}, ${g}`
                        }
                        onClick={() =>
                          waiting ? s.move(waiting.id, i) : s.setDay(i)
                        }
                      >
                        {waiting ? <Plus size={18} /> : <span />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="weave-bottom">
        <section>
          <div className="section-label">
            <span>
              {DAYS[s.day]} {s.day + 7} · SELECTED DAY
            </span>
            <DaySummary s={s} />
          </div>
          {s.today.length ? (
            s.today.map((x) => <TaskRow key={x.id} item={x} s={s} />)
          ) : (
            <EmptyDay s={s} />
          )}
        </section>
        <aside>
          <div className="weave-callout">
            <Sparkles size={20} />
            <p>
              <strong>Consistency has a shape.</strong>
              <br />
              See the space between sessions, then give your next one a place.
            </p>
          </div>
          <Unplanned s={s} />
        </aside>
      </div>
    </div>
  );
}
