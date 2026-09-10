import { useState } from "react";
import {
  addMonths,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  startOfMonth,
} from "date-fns";
import { Check, ChevronLeft, ChevronRight, Layers, X } from "lucide-react";
import { COLORS, dateKey, dateLabel, datesWithEveryGoal, TODAY } from "./model";
import { LensComposer } from "./lens-planner";
import type { Lab } from "./use-lab";
export function Progress({ s }: { s: Lab }) {
  const [month, setMonth] = useState(TODAY.slice(0, 7) + "-01");
  const [mode, setMode] = useState("together");
  const [day, setDay] = useState<string | null>(null);
  const goals = s.goals;
  const days = eachDayOfInterval({
    start: startOfMonth(parseISO(month)),
    end: endOfMonth(parseISO(month)),
  }).map(dateKey);
  const scopedRecords = s.data.records.filter(
    (r) =>
      r.goalId &&
      goals.some((g) => g.id === r.goalId) &&
      r.date.startsWith(month.slice(0, 7)),
  );
  const sharedDates = datesWithEveryGoal(scopedRecords, s.goalIds);
  const records =
    s.concept === "lens" && s.lensMatch === "all" && s.goalIds.length > 1
      ? scopedRecords.filter((r) => sharedDates.has(r.date))
      : scopedRecords;
  const count = (date: string, id?: string) =>
    records.filter((r) => r.date === date && (!id || r.goalId === id)).length;
  const activeDays = new Set(records.map((r) => r.date)).size;
  return (
    <div
      className={`il-progress-layout ${s.concept === "lens" ? "il-progress-lens" : ""}`}
    >
      {s.concept === "lens" ? (
        <LensComposer s={s} />
      ) : (
        <aside className="il-lens-picker">
          <div className="il-section-heading">
            <h2>Make a lens</h2>
            <Layers size={19} />
          </div>
          <p>Choose any goals. The evidence changes as you choose.</p>
          <button className="il-text-button" onClick={s.clearFilters}>
            All goals
          </button>
          <div className="il-lens-goals">
            {s.data.goals.map((g) => (
              <button
                key={g.id}
                aria-pressed={s.goalIds.includes(g.id)}
                onClick={() => {
                  s.setQuery("");
                  s.setCategory("All");
                  s.toggleGoal(g.id);
                }}
              >
                <span className="il-lens-check">
                  {s.goalIds.includes(g.id) && <Check size={13} />}
                </span>
                <span
                  className="il-goal-dot"
                  style={{ background: COLORS[g.category] }}
                />
                {g.title}
              </button>
            ))}
          </div>
        </aside>
      )}
      <section className="il-evidence">
        <div className="il-section-heading">
          <div>
            <span className="il-eyebrow">
              {s.goalIds.length
                ? `${goals.length} selected goals`
                : "All goals"}{" "}
              · Completion history
            </span>
            <h2>
              {s.goalIds.length
                ? goals.map((g) => g.title).join(" + ")
                : "The shape of your effort"}
            </h2>
          </div>
          <div className="il-date-navigation">
            <button
              className="il-icon"
              aria-label="Previous analysis month"
              onClick={() => setMonth(dateKey(addMonths(parseISO(month), -1)))}
            >
              <ChevronLeft size={18} />
            </button>
            <span>{dateLabel(month, "MMM yyyy")}</span>
            <button
              className="il-icon"
              aria-label="Next analysis month"
              onClick={() => setMonth(dateKey(addMonths(parseISO(month), 1)))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="il-progress-numbers">
          <div>
            <strong>{records.length}</strong>
            <span>completions</span>
          </div>
          <div>
            <strong>{activeDays}</strong>
            <span>days with activity</span>
          </div>
          <div>
            <strong>{goals.length}</strong>
            <span>goals in this view</span>
          </div>
        </div>
        <div className="il-section-heading">
          <h3>{dateLabel(month, "MMMM")} at a glance</h3>
          <div className="il-view-switch">
            <button
              aria-pressed={mode === "together"}
              onClick={() => setMode("together")}
            >
              Together
            </button>
            <button
              aria-pressed={mode === "compare"}
              onClick={() => setMode("compare")}
            >
              Compare
            </button>
          </div>
        </div>
        <div className="il-history-grid">
          {days.map((d) => (
            <button
              key={d}
              className={day === d ? "is-selected" : ""}
              style={{
                background: count(d)
                  ? `color-mix(in srgb, var(--accent) ${Math.min(45, 22 + count(d) * 6)}%, white)`
                  : undefined,
              }}
              aria-label={`${dateLabel(d)}, ${count(d)} completions`}
              onClick={() => setDay(d)}
            >
              <span>{dateLabel(d, "d")}</span>
              <strong>{count(d) || "—"}</strong>
            </button>
          ))}
        </div>
        {mode === "compare" && (
          <div className="il-comparison-table">
            {s.concept === "lens" && (
              <div className="il-history-strips">
                {goals.map((g) => (
                  <div key={g.id}>
                    <span>{g.title}</span>
                    <div>
                      {days.map((d) => (
                        <button
                          key={d}
                          aria-label={`${g.title}, ${dateLabel(d)}, ${count(d, g.id)} completions`}
                          title={dateLabel(d)}
                          onClick={() => setDay(d)}
                          style={{
                            background: count(d, g.id)
                              ? COLORS[g.category]
                              : undefined,
                            height: `${12 + Math.min(3, count(d, g.id)) * 9}px`,
                          }}
                        />
                      ))}
                    </div>
                    <strong>
                      {records.filter((r) => r.goalId === g.id).length}
                    </strong>
                  </div>
                ))}
              </div>
            )}
            <table>
              <caption>
                Completions by goal and day; horizontally scrollable
              </caption>
              <thead>
                <tr>
                  <th>Goal</th>
                  {days.map((d) => (
                    <th key={d}>{dateLabel(d, "d")}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g.id}>
                    <th>{g.title}</th>
                    {days.map((d) => (
                      <td key={d}>{count(d, g.id) || "·"}</td>
                    ))}
                    <td>{records.filter((r) => r.goalId === g.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {day && (
          <section className="il-record-detail">
            <div className="il-section-heading">
              <h3>{dateLabel(day, "EEEE, d MMMM")}</h3>
              <button
                className="il-icon"
                aria-label="Close day records"
                onClick={() => setDay(null)}
              >
                <X size={17} />
              </button>
            </div>
            {records
              .filter((r) => r.date === day)
              .map((r) => (
                <div key={r.id}>
                  <Check size={15} />
                  <span>
                    {r.title}
                    <small>
                      {r.source === "linked_cascade"
                        ? "Linked completion"
                        : "Recorded completion"}
                    </small>
                  </span>
                </div>
              ))}
            {!count(day) && (
              <p>No recorded completions for these goals on this day.</p>
            )}
          </section>
        )}
        <p className="il-muted il-progress-note">
          Moving planned work does not move this history. August and September
          contain sample records; other months start empty.
        </p>
      </section>
    </div>
  );
}
