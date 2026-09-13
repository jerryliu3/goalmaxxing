"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  DEFAULT_ACCEL_GAIN,
  DEFAULT_CAPS,
  DEFAULT_HALF_LIFE,
  DEFAULT_RECOVERY_BIAS,
  DEFAULT_SHOCK_GAIN,
  DIFFICULTY_WEIGHT,
  FORMULAS,
  REFERENCE_DAILY_CREDITS,
  equivalentLabel,
  scoreBand,
  simulateScore,
  type Difficulty,
  type FormulaId,
} from "./formulas";
import "./study.css";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="gs-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function chartGeometry(values: number[]) {
  const max = Math.max(100, ...values, 1);
  const niceMax = Math.ceil(max / 50) * 50;
  const ticks = Array.from({ length: 5 }, (_, i) => (niceMax / 4) * i);
  const y = (value: number) => 190 - (value / niceMax) * 160;
  return { niceMax, ticks, y };
}

function rateGeometry(values: number[]) {
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  const niceMax = Math.ceil(max * 2) / 2;
  const mid = 48;
  const y = (value: number) => mid - (value / niceMax) * 36;
  return { niceMax, mid, y };
}

function line(
  values: number[],
  from: number,
  width: number,
  y: (value: number) => number,
) {
  return values
    .map(
      (value, index) =>
        `${from + (index / Math.max(1, values.length - 1)) * width},${y(value)}`,
    )
    .join(" ");
}

export function GrowScoreStudy() {
  const [formula, setFormula] = useState<FormulaId>("lagged-slope");
  const [days, setDays] = useState(5);
  const [completions, setCompletions] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [breakDays, setBreakDays] = useState(0);
  const [halfLife, setHalfLife] = useState(DEFAULT_HALF_LIFE);
  const [graceDays, setGraceDays] = useState(2);
  const [paceHalfLife, setPaceHalfLife] = useState(14);
  const [accelGain, setAccelGain] = useState(DEFAULT_ACCEL_GAIN);
  const [shockGain, setShockGain] = useState(DEFAULT_SHOCK_GAIN);
  const [recoveryBias, setRecoveryBias] = useState(DEFAULT_RECOVERY_BIAS);
  const [dayCap, setDayCap] = useState(DEFAULT_CAPS.day);
  const [weekCap, setWeekCap] = useState(DEFAULT_CAPS.week);
  const [monthCap, setMonthCap] = useState(DEFAULT_CAPS.month);

  const currentFormula = FORMULAS.find((item) => item.id === formula)!;
  const caps = { day: dayCap, week: weekCap, month: monthCap };
  const simOpts = {
    daysPerWeek: days,
    completions,
    difficulty,
    halfLife,
    breakDays,
    caps,
    graceDays,
    paceHalfLife,
    accelGain,
    shockGain,
    recoveryBias,
  };

  const result = simulateScore({ formula, ...simOpts });
  const compare = FORMULAS.map((item) => ({
    id: item.id,
    name: item.name,
    ...simulateScore({ formula: item.id, ...simOpts }),
  }));

  const series = [...result.history, ...result.forecast.slice(1)];
  const { niceMax, ticks, y } = chartGeometry(series);
  const rateSeries = [...result.rateHistory, ...result.rateForecast.slice(1)];
  const rateChart = rateGeometry(rateSeries);
  const difference = result.projected - result.current;
  const unbounded = formula !== "baseline";
  const showDynamics = formula === "lagged-slope";

  return (
    <main className={`gs-study gs-${formula}`}>
      <header className="gs-toolbar">
        <a href="/ux" className="gs-brand">
          <span>g↗</span>
          <div>
            GOALMAXXING<small>GROW SCORE / UNBOUNDED REVISIONS</small>
          </div>
        </a>
        <span className="gs-small">Study only · does not edit /ux/journeys</span>
        <a href="/ux/journeys" className="gs-back-link">
          Journeys Grow <ArrowUpRight size={14} />
        </a>
      </header>

      <section className="gs-intro">
        <div>
          <span className="gs-kicker">Revision of journeys / Grow</span>
          <h1>Progress that can keep climbing.</h1>
          <p>
            Leading take is Lagged Slope: activity pushes acceleration, not the
            score directly. Hold your average and growth stays linear. Rest
            softens the slope. Enough quiet lets the growth rate go negative —
            score decays exponentially while that rate settles back toward zero.
          </p>
        </div>
        <aside className="gs-cap-card">
          <span className="gs-kicker">Proposed earn ceiling</span>
          <strong>{REFERENCE_DAILY_CREDITS} medium / day</strong>
          <p>{equivalentLabel(REFERENCE_DAILY_CREDITS)}</p>
          <p>
            Caps default to {DEFAULT_CAPS.day} / day · {DEFAULT_CAPS.week} /
            week · {DEFAULT_CAPS.month} / month. They bound the activity EMA,
            so asymptotic linear rate cannot exceed the ceiling.
          </p>
        </aside>
      </section>

      <nav className="gs-formula-nav" aria-label="Score formulas">
        {FORMULAS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={formula === item.id}
            onClick={() => setFormula(item.id)}
          >
            <span>{item.number}</span>
            <strong>{item.name}</strong>
            <small>{item.headline}</small>
          </button>
        ))}
      </nav>

      <div className="gs-layout">
        <section className="gs-main">
          <div className="gs-between">
            <div>
              <span className="gs-kicker">{currentFormula.name}</span>
              <h2>{currentFormula.headline}</h2>
              <p>{currentFormula.summary}</p>
            </div>
            <span className="gs-pill">Formula experiment · not product XP</span>
          </div>

          <div className="gs-meter">
            <div className="gs-score-number">
              {result.current.toFixed(1)}
              {unbounded ? <span>open</span> : <span>/100</span>}
            </div>
            <div>
              <span className="gs-band">
                {scoreBand(result.current, formula)}
              </span>
              <p>
                Shared history: 5 days/week · 2 medium completions.
                <br />
                {showDynamics
                  ? `v ≈ ${result.dailyRateNow.toFixed(2)} pts/day · a ≈ ${result.accelNow.toFixed(3)} · EMA ${result.emaNow.toFixed(2)}`
                  : unbounded
                    ? `Recent rate ≈ ${result.dailyRateNow.toFixed(2)} pts/day`
                    : "Approaches 100 under sustained effort"}
              </p>
            </div>
          </div>

          <div className="gs-chart-title">
            <strong>History and 8-week what-if</strong>
            <span>
              <i /> Recorded <i className="forecast" /> Forecast
            </span>
          </div>
          <svg
            viewBox="0 0 620 225"
            className="gs-chart"
            role="img"
            aria-label={`Score from ${result.current.toFixed(1)} to ${result.projected.toFixed(1)}`}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1="40"
                  x2="600"
                  y1={y(tick)}
                  y2={y(tick)}
                  className="gs-gridline"
                />
                <text x="0" y={y(tick) + 4}>
                  {tick}
                </text>
              </g>
            ))}
            <rect
              x="365"
              y="25"
              width="235"
              height="170"
              className="gs-projection"
            />
            <polyline
              points={line(result.history, 40, 325, y)}
              className="gs-history-line"
            />
            <polyline
              points={line(result.forecast, 365, 235, y)}
              className="gs-forecast-line"
            />
            <line x1="365" x2="365" y1="25" y2="195" className="gs-now-line" />
            <circle
              cx="365"
              cy={y(result.current)}
              r="4"
              className="gs-current-point"
            />
            <text x="40" y="219">
              12 weeks ago
            </text>
            <text x="354" y="219">
              Now
            </text>
            <text x="547" y="219">
              +8 weeks
            </text>
            <text x="520" y="18">
              scale 0–{niceMax}
            </text>
          </svg>

          {showDynamics ? (
            <>
              <div className="gs-chart-title gs-rate-title">
                <strong>Growth rate v (1st derivative)</strong>
                <span>acceleration a nudges this toward the activity EMA</span>
              </div>
              <svg
                viewBox="0 0 620 96"
                className="gs-chart gs-rate-chart"
                role="img"
                aria-label={`Growth rate from ${result.dailyRateNow.toFixed(2)} to ${result.dailyRateProjected.toFixed(2)}`}
              >
                <line
                  x1="40"
                  x2="600"
                  y1={rateChart.mid}
                  y2={rateChart.mid}
                  className="gs-gridline"
                />
                <text x="0" y={rateChart.y(rateChart.niceMax) + 4}>
                  +{rateChart.niceMax}
                </text>
                <text x="0" y={rateChart.mid + 4}>
                  0
                </text>
                <rect
                  x="365"
                  y="8"
                  width="235"
                  height="80"
                  className="gs-projection"
                />
                <polyline
                  points={line(result.rateHistory, 40, 325, rateChart.y)}
                  className="gs-history-line"
                />
                <polyline
                  points={line(result.rateForecast, 365, 235, rateChart.y)}
                  className="gs-forecast-line"
                />
                <line
                  x1="365"
                  x2="365"
                  y1="8"
                  y2="88"
                  className="gs-now-line"
                />
              </svg>
            </>
          ) : null}

          <div className="gs-outcome" aria-live="polite">
            <div>
              <span>In 8 weeks</span>
              <strong>
                {result.projected.toFixed(1)}{" "}
                <small>
                  {difference >= 0 ? "+" : ""}
                  {difference.toFixed(1)}
                </small>
              </strong>
            </div>
            <p>
              {breakDays
                ? `${breakDays} days away, then ${days} active days/week.`
                : `${days} active days/week · ${completions} ${difficulty} each active day.`}
              <br />
              {scoreBand(result.projected, formula)}
              {showDynamics
                ? ` · v ${result.dailyRateProjected.toFixed(2)} · a ${result.accelProjected.toFixed(3)}`
                : unbounded
                  ? ` · ~${result.dailyRateProjected.toFixed(2)} pts/day at end`
                  : null}
            </p>
          </div>

          <p className="gs-behavior">{currentFormula.behavior}</p>
        </section>

        <aside className="gs-simulator">
          <span className="gs-kicker">Scenario</span>
          <h3>What happens if…</h3>
          <div className="gs-scenarios">
            <button
              type="button"
              onClick={() => {
                setDays(7);
                setCompletions(5);
                setDifficulty("medium");
                setBreakDays(0);
              }}
            >
              Max pace
            </button>
            <button
              type="button"
              onClick={() => {
                setDays(5);
                setCompletions(2);
                setDifficulty("medium");
                setBreakDays(0);
              }}
            >
              Keep rhythm
            </button>
            <button
              type="button"
              onClick={() => {
                setDays(3);
                setCompletions(1);
                setDifficulty("medium");
                setBreakDays(0);
              }}
            >
              Slow down
            </button>
            <button
              type="button"
              onClick={() => {
                setDays(0);
                setBreakDays(56);
              }}
            >
              Full stop
            </button>
            <button
              type="button"
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

          <Field label={`Active days / week · ${days}`}>
            <input
              type="range"
              min={0}
              max={7}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </Field>
          <Field label={`Completions / active day · ${completions}`}>
            <input
              type="range"
              min={1}
              max={8}
              value={completions}
              onChange={(event) => setCompletions(Number(event.target.value))}
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
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
              min={0}
              max={56}
              value={breakDays}
              onChange={(event) => setBreakDays(Number(event.target.value))}
            />
          </Field>
          <Field label="Idle decay half-life">
            <select
              value={halfLife}
              onChange={(event) => setHalfLife(Number(event.target.value))}
            >
              <option value={14}>14 days · sharper fade</option>
              <option value={28}>28 days · balanced</option>
              <option value={42}>42 days · forgiving</option>
            </select>
          </Field>

          {formula === "grace-decay" ? (
            <Field
              label={`Grace days before decay · ${graceDays}`}
              hint="Zero-credit days inside grace hold the score flat."
            >
              <input
                type="range"
                min={0}
                max={7}
                value={graceDays}
                onChange={(event) => setGraceDays(Number(event.target.value))}
              />
            </Field>
          ) : null}

          {showDynamics ? (
            <>
              <Field
                label="Activity memory half-life"
                hint="How far back the “recent average” looks."
              >
                <select
                  value={paceHalfLife}
                  onChange={(event) =>
                    setPaceHalfLife(Number(event.target.value))
                  }
                >
                  <option value={7}>7 days · snappy</option>
                  <option value={14}>14 days · default</option>
                  <option value={28}>28 days · long memory</option>
                </select>
              </Field>
              <div className="gs-knob-legend">
                <span className="gs-kicker">What the knobs mean</span>
                <p>
                  <strong>Today vs average</strong> — if today is above your
                  recent average, acceleration rises; if below (a rest day), it
                  falls. This is what mainly moves the growth rate.
                </p>
                <p>
                  <strong>Settle to average</strong> — gently pulls the growth
                  rate toward your recent average so a steady habit becomes
                  linear (acceleration ≈ 0).
                </p>
                <p>
                  <strong>Comeback boost</strong> — when the growth rate is
                  already negative, positive acceleration is amplified so
                  returning from a slump climbs faster.
                </p>
              </div>
              <Field
                label={`Today vs average · ${shockGain.toFixed(2)}`}
                hint="Stronger = rest days and surges move the growth rate faster."
              >
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={shockGain}
                  onChange={(event) =>
                    setShockGain(Number(event.target.value))
                  }
                />
              </Field>
              <Field
                label={`Settle to average · ${accelGain.toFixed(2)}`}
                hint="Stronger = rate snaps to your average sooner (less curve)."
              >
                <input
                  type="range"
                  min={0.02}
                  max={0.4}
                  step={0.01}
                  value={accelGain}
                  onChange={(event) =>
                    setAccelGain(Number(event.target.value))
                  }
                />
              </Field>
              <Field
                label={`Comeback boost · ${recoveryBias.toFixed(2)}`}
                hint="Only applies while growth rate is negative."
              >
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={recoveryBias}
                  onChange={(event) =>
                    setRecoveryBias(Number(event.target.value))
                  }
                />
              </Field>
            </>
          ) : null}

          {unbounded ? (
            <>
              <div className="gs-cap-controls">
                <span className="gs-kicker">Absolute earn caps</span>
                <Field label={`Day · ${dayCap}`}>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={dayCap}
                    onChange={(event) => setDayCap(Number(event.target.value))}
                  />
                </Field>
                <Field label={`Week · ${weekCap}`}>
                  <input
                    type="range"
                    min={15}
                    max={70}
                    step={5}
                    value={weekCap}
                    onChange={(event) => setWeekCap(Number(event.target.value))}
                  />
                </Field>
                <Field label={`Month · ${monthCap}`}>
                  <input
                    type="range"
                    min={60}
                    max={300}
                    step={10}
                    value={monthCap}
                    onChange={(event) =>
                      setMonthCap(Number(event.target.value))
                    }
                  />
                </Field>
              </div>
              <p className="gs-small">
                Credits clipped this run: {result.cappedAway.toFixed(1)}. Caps
                bound the EMA, so linear climb cannot exceed the ceiling rate.
              </p>
            </>
          ) : (
            <p className="gs-small">
              Baseline still uses the journeys daily credit cap of 3 and a hard
              score ceiling of 100.
            </p>
          )}
        </aside>
      </div>

      <section className="gs-compare">
        <div className="gs-between">
          <div>
            <span className="gs-kicker">Side-by-side</span>
            <h2>Same scenario, four formulas</h2>
          </div>
        </div>
        <div className="gs-compare-grid">
          {compare.map((item) => {
            const delta = item.projected - item.current;
            return (
              <button
                key={item.id}
                type="button"
                className={formula === item.id ? "active" : undefined}
                onClick={() => setFormula(item.id)}
              >
                <span>{item.name}</span>
                <strong>{item.projected.toFixed(1)}</strong>
                <small>
                  now {item.current.toFixed(1)} · {delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)} in 8 weeks
                </small>
              </button>
            );
          })}
        </div>
      </section>

      <details className="gs-formula">
        <summary>
          Formula notes and open questions <ArrowUpRight size={16} />
        </summary>
        <div className="gs-formula-grid">
          <div>
            <h3>Lagged Slope dynamics</h3>
            <p>
              Credits = completions × difficulty (easy 0.75, medium 1, hard
              1.5), then day/week/month caps. Activity writes acceleration — not
              the score.
            </p>
            <code>
              avg = recent average of earned credits
              <br />
              a = (today vs avg) + (settle rate toward avg)
              <br />
              growth rate v = v + a // can go negative
              <br />
              <br />
              if v &gt; 0: score += v // linear growth
              <br />
              if v &lt; 0: score and v both × retention
              <br />
              {"    "}// exponential decay; v eases back to 0
            </code>
            <p>
              <strong>Today vs average</strong> (default 0.20): rest and surges.
              <br />
              <strong>Settle to average</strong> (default 0.15): turns a steady
              habit into a straight climb.
              <br />
              <strong>Comeback boost</strong> (default 1.50): faster climb out of
              a negative rate.
            </p>
          </div>
          <div>
            <h3>Cap calibration</h3>
            <p>
              Ceiling proposal stays 5 medium/day → day 5 / week 35 / month
              150. That caps the average and |v|, so max steady climb is +5
              pts/day (~1,825/year).
            </p>
            <p>
              A single rest day usually keeps v positive (slower climb). A real
              stop drives v below zero — then the score decays and v itself
              settles back toward zero with the same half-life.
            </p>
            <p>
              Still open: linked cascades counted once; difficulty at completion;
              band labels for an unbounded scale.
            </p>
          </div>
        </div>
      </details>
    </main>
  );
}
