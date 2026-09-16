import { GOAL_COUNTS, MONTH_FACTS, WEEKDAY_COUNTS } from "./model";
import { COMPLETIONS, FOLIOS, SHOWCASE } from "./seed";

export function ProgressPatterns() {
  const maximum = Math.max(...WEEKDAY_COUNTS.map(day => day.count), 1);
  const lifetime = COMPLETIONS.length + FOLIOS.reduce((sum, folio) => sum + folio.completions, 0);
  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-3 gap-4 border-y border-border py-5">
        {[['Lifetime activities', lifetime], ['Goals achieved', SHOWCASE.collection.achievedGoals], ['September activities', MONTH_FACTS.length]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 font-display text-3xl">{value}</dd></div>)}
      </dl>
      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="patterns-weekdays"><h2 id="patterns-weekdays" className="font-display text-2xl">When you showed up</h2><p className="mt-1 text-sm text-muted-foreground">September 1–16 · completion events, not completion rate</p><ul className="mt-5 space-y-4">{WEEKDAY_COUNTS.map(day => <li key={day.label} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-3 text-sm"><span>{day.label}</span><span className="h-2 overflow-hidden rounded bg-muted" aria-hidden><span className="block h-full rounded bg-primary/70" style={{ width: `${day.count / maximum * 100}%` }} /></span><span className="text-right font-mono text-xs">{day.count}</span></li>)}</ul></section>
        <section aria-labelledby="patterns-goals"><h2 id="patterns-goals" className="font-display text-2xl">Where the effort went</h2><p className="mt-1 text-sm text-muted-foreground">September 1–16 · all active goals</p><ul className="mt-4">{GOAL_COUNTS.map(goal => <li key={goal.id} className="flex items-center justify-between gap-3 border-b border-border py-4 text-sm"><span>{goal.title}</span><span className="font-mono text-xs">{goal.count}</span></li>)}</ul></section>
      </div>
    </div>
  );
}
