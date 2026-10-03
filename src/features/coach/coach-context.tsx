import { coachContextSummary } from "@cadence/shared/coach/context-summary";
import { Button } from "@/components/ui/button";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachContext() {
  const coach = useCoach()!;
  const facts = coach.facts;
  const totals = facts ? coachContextSummary(facts) : null;
  const selected = coach.freshness === "fresh" ? totals?.selected : undefined;
  return <details className={s.context}>
    <summary><span><i className={s.contextDot} data-fresh={coach.freshness === "fresh"} />{coach.page.surface === "plan" ? "Plan" : coach.page.surface === "you" ? "You" : coach.page.surface === "goal" ? "Goal editor" : coach.page.surface.charAt(0).toUpperCase() + coach.page.surface.slice(1)}{coach.page.view ? ` · ${coach.page.view === "goals" ? "Goal View" : coach.page.view.replace("_", " ")}` : ""}{coach.page.selectedDate ? ` · ${coach.page.selectedDate}` : ""}</span><span>{totals ? `${totals.today.completed}/${totals.today.scheduled} today · ${totals.week.completed}/${totals.week.scheduled} week` : "Reading your data…"}</span></summary>
    <div className={s.contextDetail}>
      <p>{facts?.pagePurpose ?? "Your coach is reading the current page and your own app data."}</p>
      {selected && <p>Looking at <strong>{selected.title}</strong></p>}
      <p>{coach.freshness === "fresh" ? "Up to date" : coach.freshness === "refreshing" ? "Refreshing current facts…" : "Couldn’t refresh. The facts below may be outdated."}{facts ? ` · ${facts.timezone}` : ""}</p>
      {facts && <><p>Today: {facts.today.date}. Week: {facts.week.start} — {facts.week.end}.</p><p>{totals!.overdueTasks ? `${totals!.overdueTasks} open earlier tasks. ` : ""}{facts.scopeNote}</p><p>Counts include scheduled goal work and one-off tasks. Saved preferences are separate from current facts.</p></>}
      {coach.page.hasDraft && <p>Unsaved planner work is preserved. Save or discard it before applying coach changes.</p>}
      <Button variant="ghost" size="sm" onClick={coach.refresh}>Refresh context</Button>
    </div>
  </details>;
}
