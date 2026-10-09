import { BASELINE_COMMIT } from "./catalog";
const COPY = [
  {
    where: "Growth · summary statistics",
    source: "src/features/insights/insights-overall-stats-card.tsx",
    before: "Active streak",
    after: "Active-week streak",
    reason: "Keep its unit in the name, distinct from the day-streak record.",
  },
  {
    where: "Growth · current-month activity tooltip",
    source: "src/features/insights/insights-overall-stats-card.tsx",
    before: "Numerator: completion events in the current month.",
    after: "Completions you logged this month.",
    reason:
      "Explain the count directly. Do not change which completion events count.",
  },
  {
    where: "Growth · detailed statistics, active days tooltip",
    source: "src/features/growth/growth-detailed-stats.tsx",
    before:
      "Numerator: days since account creation with one or more completions. Denominator: total days since account creation.",
    after: "The share of days since you joined with at least one completion.",
    reason: "Retain the same date window and definition in ordinary language.",
  },
  {
    where: "Agenda · Filters",
    source: "src/features/planner/use-plan-day-checklist-model.ts",
    before: "Show suppressed linked goals",
    after: "Show hidden linked goals",
    reason:
      "Keep the linked-goal distinction. Supporting copy should explain the existing hiding rule, rather than imply these goals are private or deleted.",
  },
  {
    where: "Community · Team · shared goals empty state",
    source: "src/features/social/team/team-panel.tsx",
    before: "Tap a goal to open it on Plan. No editor lives here.",
    after: "No shared goals yet. Goals you work on together will appear here.",
    reason:
      "Describe the actual empty state. Add a creation CTA only when its owning workflow is available.",
  },
] as const;
export function CopyRefinements() {
  return (
    <section className="fc-copy-review">
      <p className="type-eyebrow">
        Exact wording proposals · findings 15 and 18
      </p>
      <h3 className="type-title">Small changes, at named locations.</h3>
      {COPY.map((item) => (
        <article key={item.where}>
          <a
            className="type-item underline"
            href={`https://github.com/jerryliu3/goalmaxxing/blob/${BASELINE_COMMIT}/${item.source}`}
            target="_blank"
            rel="noreferrer"
          >
            {item.where} ↗
          </a>
          <dl>
            <div>
              <dt>Current</dt>
              <dd>{item.before}</dd>
            </div>
            <div>
              <dt>Proposed</dt>
              <dd>{item.after}</dd>
            </div>
          </dl>
          <p className="fc-muted">{item.reason}</p>
        </article>
      ))}
    </section>
  );
}
