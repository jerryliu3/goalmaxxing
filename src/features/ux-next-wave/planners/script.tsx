import { ArrowRight, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DAYS } from "../model";
import type { Study } from "../use-study";
import { DayRail, EmptyDay, Unplanned } from "../primitives";

export function Script({ s }: { s: Study }) {
  const [command, setCommand] = useState("");
  const [error, setError] = useState("");
  const run = (value: string) => {
    const normalized = value.toLowerCase().trim().replace(/[.!]$/g, "");
    setCommand(value);
    setError("");
    if (normalized === "move tempo run to friday") {
      s.move("run", 4);
    } else if (normalized === "plan strength on wednesday") {
      s.move("strength", 2);
    } else if (normalized === "leave launch notes unplanned") {
      s.move("notes", null);
    } else {
      setError(
        "This demo understands the three suggestions below. Choose one to preview an exact plan change.",
      );
    }
  };
  return (
    <div className="script-layout">
      <section className="script-intent">
        <div className="eyebrow">
          <span className="script-asterisk">✳</span> A LITTLE INTENTION GOES A
          LONG WAY
        </div>
        <h1>
          What would make
          <br />
          today feel <em>good?</em>
        </h1>
        <div className="script-sentence">
          On{" "}
          <button onClick={() => s.setDay((s.day + 1) % 7)}>
            {DAYS[s.day]}, Sep {s.day + 7}
            <ChevronRight size={16} />
          </button>
          ,<br />
          I’m making room for{" "}
          <strong>{s.today.filter((x) => !x.done).length} things.</strong>
        </div>
        <form
          className="command-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(command);
          }}
        >
          <label htmlFor="plan-command">Change your plan</label>
          <div>
            <input
              id="plan-command"
              placeholder="Move Tempo run to Friday"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              autoComplete="off"
            />
            <button aria-label="Preview plan command" type="submit">
              <ArrowRight size={20} />
            </button>
          </div>
        </form>
        {error && (
          <p className="command-error" role="alert">
            {error}
          </p>
        )}
        <div className="command-suggestions">
          <span>Try one</span>
          {[
            "Move Tempo run to Friday",
            "Plan strength on Wednesday",
            "Leave launch notes unplanned",
          ].map((c) => (
            <button key={c} onClick={() => run(c)}>
              {c}
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        <p className="script-footnote">
          Three supported demo commands. Every change is yours to review.
        </p>
      </section>
      <section className="script-plan">
        <div className="section-label">
          <span>THE PLAN</span>
          <span>SEP {s.day + 7}</span>
        </div>
        <DayRail s={s} />
        {s.today.map((x, i) => (
          <div key={x.id} className={`script-line ${x.done ? "finished" : ""}`}>
            <span className="script-line-index">{i + 1}</span>
            <div>
              <span>
                {x.time}{" "}
                <span className="script-line-duration">· {x.minutes} min</span>
              </span>
              <button onClick={() => s.setSelected(x.id)}>
                {x.title}
                <ArrowUpRight size={17} />
              </button>
              <small>
                {x.goal}
                {x.done ? " · Complete" : ""}
              </small>
            </div>
            <button
              className="completion"
              aria-label={`${x.done ? "Reopen" : "Complete"} ${x.title}`}
              onClick={() => s.toggle(x.id)}
            >
              {x.done ? <Check size={16} /> : <span />}
            </button>
          </div>
        ))}
        {!s.today.length && <EmptyDay s={s} />}
        <Unplanned s={s} />
      </section>
    </div>
  );
}
