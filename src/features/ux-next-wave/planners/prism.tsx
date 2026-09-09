import { ArrowUpRight, Layers3 } from "lucide-react";
import type { CSSProperties } from "react";
import { DAYS, goalClass } from "../model";
import type { Study } from "../use-study";
import {
  DayRail,
  DaySummary,
  EmptyDay,
  TaskRow,
  Unplanned,
} from "../primitives";

export function Prism({ s }: { s: Study }) {
  return (
    <div className="prism-layout">
      <section className="prism-time">
        <div className="section-label">
          <span>SEPTEMBER 2026</span>
          <Layers3 size={18} />
        </div>
        <h1>
          Your week,
          <br />
          <em>in a good light.</em>
        </h1>
        <p className="muted">A little structure. Space for everything else.</p>
        <div className="glass-week" aria-label="Your week in layers">
          {DAYS.slice(0, 5).map((d, i) => (
            <button
              style={{ "--layer": i } as CSSProperties}
              className={`glass-day ${i === s.day ? "selected" : ""}`}
              key={d}
              onClick={() => s.setDay(i)}
              aria-pressed={i === s.day}
            >
              <span className="glass-date">
                <b>{7 + i}</b>
                <span>{d}</span>
              </span>
              <span className="glass-lines">
                {s.items
                  .filter((x) => x.day === i)
                  .map((x) => (
                    <i
                      key={x.id}
                      className={goalClass(x.goal)}
                      style={{ width: `${30 + x.minutes / 2}%` }}
                    />
                  ))}
              </span>
              <span className="glass-count">
                {s.items.filter((x) => x.day === i).length} sessions
              </span>
              <ArrowUpRight size={19} />
            </button>
          ))}
        </div>
        <div className="prism-foot">
          <span className="tiny-dot" />
          Your next step is already here.
        </div>
      </section>
      <section className="glass-agenda">
        <div className="section-label">
          <span>
            {s.day === 1 ? "TODAY" : DAYS[s.day].toUpperCase()} · SEP{" "}
            {s.day + 7}
          </span>
          <span className="tag">Personal plan</span>
        </div>
        <h2>{s.day === 1 ? "Tuesday" : DAYS[s.day]} feels possible.</h2>
        <p className="muted">
          <DaySummary s={s} />
        </p>
        <DayRail s={s} />
        <div className="prism-tasks">
          {s.today.length ? (
            s.today.map((x) => <TaskRow key={x.id} item={x} s={s} />)
          ) : (
            <EmptyDay s={s} />
          )}
        </div>
        <Unplanned s={s} />
      </section>
    </div>
  );
}
