import { ArrowDown, ArrowUpRight, Check, Clock3 } from "lucide-react";
import { DAYS } from "../model";
import type { Study } from "../use-study";
import { DayRail, EmptyDay, Unplanned } from "../primitives";

export function Tempo({ s }: { s: Study }) {
  const remaining = s.today
    .filter((x) => !x.done)
    .reduce((a, x) => a + x.minutes, 0);
  return (
    <div className="tempo-layout">
      <section className="tempo-main">
        <div className="section-label">
          <span>
            {DAYS[s.day].toUpperCase()}, SEPTEMBER {s.day + 7}
          </span>
          <span>YOUR DAILY PACE</span>
        </div>
        <h1>
          Life happens.
          <br />
          <em>Find your tempo.</em>
        </h1>
        <div className="tempo-number">
          <strong>{remaining}</strong>
          <div>
            <span>minutes left</span>
            <span>
              {s.today.filter((x) => !x.done).length} meaningful things
            </span>
          </div>
          <ArrowDown size={40} />
        </div>
        <div className="tempo-timeline">
          {s.today.map((x, i) => (
            <button
              key={x.id}
              className={`tempo-session ${x.done ? "finished" : ""}`}
              onClick={() => s.setSelected(x.id)}
            >
              <span className="tempo-index">0{i + 1}</span>
              <span className="tempo-session-body">
                <small>
                  {x.time} / {x.goal}
                </small>
                <strong>{x.title}</strong>
              </span>
              <span>
                {x.done ? (
                  <Check size={23} />
                ) : (
                  <>
                    {x.minutes}
                    <small>MIN</small>
                  </>
                )}
              </span>
            </button>
          ))}
          {!s.today.length && <EmptyDay s={s} />}
        </div>
      </section>
      <aside className="tempo-aside">
        <DayRail s={s} />
        <div className="budget-card">
          <span className="eyebrow">TODAY HAS CHANGED?</span>
          <h2>Make it fit.</h2>
          <p>Choose how much time you have left.</p>
          <div className="budget-value">
            <strong>{s.budget}</strong>
            <span>minutes</span>
            <Clock3 size={25} />
          </div>
          <input
            aria-label="Available minutes"
            type="range"
            min="30"
            max="120"
            step="5"
            value={s.budget}
            onChange={(e) => s.setBudget(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>Just the essentials</span>
            <span>More room</span>
          </div>
          <button className="primary" onClick={s.lighten}>
            Preview a lighter day <ArrowUpRight size={18} />
          </button>
          <span className="budget-note">You choose what changes.</span>
        </div>
        <Unplanned s={s} />
      </aside>
    </div>
  );
}
