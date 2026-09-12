import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Field } from "./fields";
import { CONCEPTS, type Concept } from "./model";
import {
  DIFFICULTY_WEIGHT,
  simulateScore,
  scoreBand,
  type Difficulty,
} from "./score-model";

function line(values: number[], from: number, width: number) {
  return values
    .map(
      (v, i) => `${from + (i / (values.length - 1)) * width},${190 - v * 1.6}`,
    )
    .join(" ");
}
export function Score({ concept }: { concept: Concept }) {
  const [days, setDays] = useState(5);
  const [completions, setCompletions] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [breakDays, setBreakDays] = useState(0);
  const [halfLife, setHalfLife] = useState(28);
  const { history, forecast, current, projected, earnedCompletions } =
    simulateScore({
      daysPerWeek: days,
      completions,
      difficulty,
      halfLife,
      breakDays,
    });
  const currentConcept = CONCEPTS.find((c) => c.id === concept)!;
  const difference = projected - current;
  return (
    <>
      <div className="j-destination-heading">
        <div>
          <span className="j-kicker">03 / {currentConcept.score}</span>
          <h1>
            {concept === "tempo"
              ? "Progress has a pulse."
              : concept === "weave"
                ? "Consistency, taking shape."
                : "You’re finding your form."}
          </h1>
          <p>
            A current score that grows with effort and eases down when life gets
            quiet.
          </p>
        </div>
        <span className="j-study-pill">
          Formula experiment · not a product score
        </span>
      </div>
      <div className="j-score-layout">
        <section className={`j-score-main j-score-${concept}`}>
          <div className="j-between">
            <span className="j-kicker">
              Current {currentConcept.score.toLowerCase()}
            </span>
            <span className="j-small">Illustrative 12-week history</span>
          </div>
          {concept === "tempo" ? (
            <div className="j-meter">
              <div className="j-score-number">
                {current.toFixed(1)}
                <span>/100</span>
              </div>
              <div>
                <span className="j-score-band">{scoreBand(current)}</span>
                <p>
                  Five active days each week.
                  <br />
                  Two medium completions per active day.
                </p>
              </div>
              <div className="j-meter-track">
                <i style={{ width: `${current}%` }} />
              </div>
            </div>
          ) : concept === "weave" ? (
            <div className="j-rhythm-score">
              <div
                className="j-rhythm-disc"
                style={{
                  background: `conic-gradient(var(--j-accent) ${current}%, var(--j-soft) 0)`,
                }}
              >
                <div>
                  <strong>{current.toFixed(1)}</strong>
                  <span>{scoreBand(current)} / 100</span>
                </div>
              </div>
              <div>
                <h3>Your rhythm is holding.</h3>
                <p>The same small returns, becoming a stronger pattern.</p>
                <div
                  className="j-week-beats"
                  aria-label="Five of seven days active"
                >
                  {["M", "T", "W", "T", "F", "S", "S"].map((s, i) => (
                    <span key={i} className={i < 5 ? "filled" : ""}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="j-form-letter">
              <p>
                Your form is <em>{scoreBand(current).toLowerCase()}</em>.
              </p>
              <span className="j-score-number">
                {current.toFixed(1)}
                <small>/ 100</small>
              </span>
              <p>
                You’ve kept returning, five days a week.
                <br />
                That effort has become a foundation.
              </p>
            </div>
          )}
          <div className="j-chart-title">
            <strong>A little further from here</strong>
            <span>
              <i /> Recorded <i className="forecast" /> What if
            </span>
          </div>
          <svg
            viewBox="0 0 620 225"
            className="j-score-chart"
            role="img"
            aria-label={`Score history and 56-day projection: ${current.toFixed(1)} now to ${projected.toFixed(1)} projected.`}
          >
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1="30"
                  x2="600"
                  y1={190 - v * 1.6}
                  y2={190 - v * 1.6}
                  className="j-gridline"
                />
                <text x="0" y={194 - v * 1.6}>
                  {v}
                </text>
              </g>
            ))}
            <rect
              x="365"
              y="25"
              width="235"
              height="170"
              className="j-projection-area"
            />
            <polyline
              points={line(history, 30, 335)}
              className="j-history-line"
            />
            <polyline
              points={line(forecast, 365, 235)}
              className="j-forecast-line"
            />
            <line x1="365" x2="365" y1="25" y2="195" className="j-now-line" />
            <circle
              cx="365"
              cy={190 - current * 1.6}
              r="4"
              className="j-current-point"
            />
            <text x="30" y="219">
              12 weeks ago
            </text>
            <text x="354" y="219">
              Now
            </text>
            <text x="547" y="219">
              +8 weeks
            </text>
          </svg>
          <div className="j-score-outcome" aria-live="polite">
            <div>
              <span>In 8 weeks</span>
              <strong>
                {projected.toFixed(1)}{" "}
                <small>
                  {difference >= 0 ? "+" : ""}
                  {difference.toFixed(1)}
                </small>
              </strong>
            </div>
            <p>
              {breakDays
                ? `${breakDays} days away, then ${days} active days/week.`
                : `${days} active days/week, ${completions} ${difficulty} completions each day.`}
              <br />
              {scoreBand(projected)} ·{" "}
              {days === 0
                ? "All 56 forecast days have no completions."
                : "A scenario, not a prediction."}
            </p>
          </div>
          <div className="j-permanent">
            <span>YOUR RECORD STAYS</span>
            <strong>{earnedCompletions} completions · 2 goals achieved</strong>
            <p>Current form can change. These achievements don’t decay.</p>
          </div>
        </section>
        <aside className="j-simulator">
          <span className="j-kicker">Try a different next chapter</span>
          <h3>What happens if…</h3>
          <div className="j-scenarios">
            <button
              onClick={() => {
                setDays(5);
                setCompletions(2);
                setDifficulty("medium");
                setBreakDays(0);
              }}
            >
              Keep my rhythm
            </button>
            <button
              onClick={() => {
                setDays(0);
                setBreakDays(56);
              }}
            >
              Take a break
            </button>
            <button
              onClick={() => {
                setDays(3);
                setCompletions(2);
                setDifficulty("medium");
                setBreakDays(14);
              }}
            >
              Return gently
            </button>
          </div>
          <Field label={`Active days per week · ${days}`}>
            <input
              type="range"
              min="0"
              max="7"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </Field>
          <Field label={`Completions per active day · ${completions}`}>
            <input
              type="range"
              min="1"
              max="5"
              value={completions}
              onChange={(e) => setCompletions(Number(e.target.value))}
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {Object.entries(DIFFICULTY_WEIGHT).map(([key, weight]) => (
                <option key={key} value={key}>
                  {key} · {weight} credit{weight === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Days away before returning · ${breakDays}`}>
            <input
              type="range"
              min="0"
              max="56"
              value={breakDays}
              onChange={(e) => setBreakDays(Number(e.target.value))}
            />
          </Field>
          <Field
            label="Decay half-life · study control"
            hint="Changing this recalculates both the shared history and the forecast."
          >
            <select
              value={halfLife}
              onChange={(e) => setHalfLife(Number(e.target.value))}
            >
              <option value="14">14 days · more responsive</option>
              <option value="28">28 days · balanced starting point</option>
              <option value="42">42 days · more forgiving</option>
            </select>
          </Field>
          <p className="j-small">
            An entirely inactive day retains{" "}
            {(100 * 2 ** (-1 / halfLife)).toFixed(1)}% of yesterday’s score.
            After {halfLife} inactive days, half remains.
          </p>
        </aside>
      </div>
      <details className="j-formula">
        <summary>
          How the proposed score works <ArrowUpRight size={16} />
        </summary>
        <div className="j-formula-grid">
          <div>
            <h3>Effort remembered over time.</h3>
            <p>
              Daily credits = min(3, sum of difficulty weights). More completed
              work helps up to a daily cap; returning on more days helps more
              than cramming everything into one day.
            </p>
            <code>
              r = 2^(−1 / half-life)
              <br />
              score[t] = r × score[t−1]
              <br /> + (1−r) × 100 × credits[t] / 3
            </code>
            <p>
              The demo starts at zero. Bands: 0–19 Taking root, 20–39 Building,
              40–59 Steady, 60–79 Strong, 80–100 Flourishing. These thresholds
              need calibration.
            </p>
          </div>
          <div>
            <h3>What this measures.</h3>
            <p>
              Recent, recorded effort. Planned frequency earns nothing by
              itself. Meeting a monthly goal should still earn its achievement
              even if someone with a daily practice has a higher current score.
            </p>
            <p>
              Before shipping: count linked parent/child cascades once; use
              difficulty at completion; replay corrected records; settle task
              and milestone credit rules; test low-frequency goals and rest
              periods. A cap limits spam, but does not solve subjective
              difficulty or goal splitting.
            </p>
            <p>
              Borrowing the idea of a readable current state from{" "}
              <a
                href="https://www.garmin.com/en-GB/garmin-technology/running-science/physiological-measurements/endurance-score/"
                target="_blank"
                rel="noreferrer"
              >
                Garmin’s Endurance Score
              </a>
              , and transparent smoothing from{" "}
              <a
                href="https://forum.intervals.icu/t/change-fatigue-atl-and-fitness-ctl-factors/300"
                target="_blank"
                rel="noreferrer"
              >
                Intervals.icu
              </a>
              . This is an original goal-effort hypothesis, not a fitness
              measurement.
            </p>
          </div>
        </div>
      </details>
    </>
  );
}
