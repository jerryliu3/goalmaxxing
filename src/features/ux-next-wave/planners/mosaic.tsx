import { ArrowUpRight, Check } from "lucide-react";
import { DAYS, goalClass, minutesLabel } from "../model";
import type { Study } from "../use-study";
import { DayRail, EmptyDay, Unplanned } from "../primitives";

export function Mosaic({ s }: { s: Study }) {
  return (
    <div className="mosaic-layout">
      <section>
        <div className="section-label">
          <span>
            {DAYS[s.day]} · SEPTEMBER {s.day + 7}
          </span>
          <span>YOUR DAY, PIECE BY PIECE</span>
        </div>
        <h1>
          Good things
          <br />
          <em>add up.</em>
          <span className="mosaic-period">✳</span>
        </h1>
        <DayRail s={s} />
        <div className="mosaic-board">
          {s.today.map((x, i) => (
            <button
              key={x.id}
              onClick={() => s.setSelected(x.id)}
              className={`mosaic-tile ${goalClass(x.goal)} ${x.done ? "finished" : ""} ${x.minutes >= 60 ? "wide" : ""}`}
            >
              <div>
                <span>{x.time}</span>
                <span>
                  {x.done ? <Check size={24} /> : <ArrowUpRight size={22} />}
                </span>
              </div>
              <span className="mosaic-tile-number">0{i + 1}</span>
              <strong>{x.title}</strong>
              <div>
                <span>{x.goal}</span>
                <b>{x.minutes} min</b>
              </div>
            </button>
          ))}
          {!s.today.length && <EmptyDay s={s} />}
        </div>
      </section>
      <aside className="mosaic-aside">
        <div className="mosaic-receipt">
          <span className="eyebrow">A DAY WELL SPENT</span>
          <div className="receipt-number">
            {s.today.filter((x) => x.done).length}
            <span>/{s.today.length}</span>
          </div>
          <h2>One piece at a time.</h2>
          <p>Every completed session becomes part of your progress.</p>
          <div className="receipt-marks">
            {s.today.map((x) => (
              <span
                key={x.id}
                className={`${goalClass(x.goal)} ${x.done ? "filled" : ""}`}
              >
                {x.done ? <Check size={18} /> : null}
              </span>
            ))}
          </div>
          <div className="receipt-bottom">
            <span>TIME STILL YOURS</span>
            <strong>
              {minutesLabel(
                s.today
                  .filter((x) => !x.done)
                  .reduce((a, x) => a + x.minutes, 0),
              )}{" "}
              planned
            </strong>
          </div>
        </div>
        <Unplanned s={s} />
      </aside>
    </div>
  );
}
