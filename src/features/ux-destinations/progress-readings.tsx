import { useState } from "react";
import {
  CategoryRows,
  Sparkline,
  WeekdayBars,
} from "@/features/ux-destinations/charts";
import {
  CATEGORY_RATES,
  COUNT_SERIES,
  OVERALL_STATS,
  PROGRESS_GOALS,
  RATE_SERIES,
  WEEKDAY_RATES,
} from "@/features/ux-destinations/seed";

export function ReadingsBand() {
  const [fullReading, setFullReading] = useState(false);
  const [scope, setScope] = useState<"you" | "team">("you");
  return (
    <section className="rounded-[12px] border border-border p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold tracking-tight">
          Readings
        </h2>
        <div
          role="group"
          aria-label="Reading scope"
          className="inline-flex rounded-[10px] bg-muted p-0.5 text-xs font-medium"
        >
          {(["you", "team"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={scope === item}
              onClick={() => setScope(item)}
              className={
                scope === item
                  ? "min-h-8 rounded-[8px] bg-background px-3 capitalize"
                  : "min-h-8 rounded-[8px] px-3 capitalize text-muted-foreground"
              }
            >
              {item === "you" ? "Your goals" : "Team goals"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Completion by weekday
          </p>
          <WeekdayBars data={WEEKDAY_RATES} />
        </div>
        <Sparkline values={RATE_SERIES} label="Completion rate · 30 days" />
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Completion by category
          </p>
          <CategoryRows data={CATEGORY_RATES} />
        </div>
      </div>
      <button
        type="button"
        className="mt-5 text-sm font-semibold"
        aria-expanded={fullReading}
        onClick={() => setFullReading((open) => !open)}
      >
        {fullReading ? "Hide full reading" : "Show full reading"}
      </button>
      {fullReading ? (
        <div className="mt-5 grid gap-6 border-t border-border pt-5 lg:grid-cols-2">
          <Sparkline values={COUNT_SERIES} label="Completions per day · 30 days" />
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Active days</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">
                {OVERALL_STATS.activeDaysPercent}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Days in product</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">
                {OVERALL_STATS.totalDays}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Goals completed</dt>
              <dd className="mt-1 font-display text-2xl font-semibold">
                {OVERALL_STATS.goalsCompleted}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Week · month · today</dt>
              <dd className="mt-1 text-sm">
                {OVERALL_STATS.weekActivities} · {OVERALL_STATS.monthActivities} ·{" "}
                {OVERALL_STATS.todayActivities}
              </dd>
            </div>
          </dl>
          <div className="lg:col-span-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Per-goal streaks
            </p>
            <ul className="divide-y divide-border text-sm">
              {PROGRESS_GOALS.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span>{goal.title}</span>
                  <span className="text-muted-foreground">
                    {goal.percent}% · {goal.currentStreak}d / {goal.longestStreak}d
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
