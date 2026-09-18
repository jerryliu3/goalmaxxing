"use client";

import { useEffect, useState } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { GoalProgressCard } from "@/features/goals/goal-progress-card";
import { WorkQuestCard } from "@/features/planner/work-quest-card";
import { GoalBinding, type BindingPhase } from "./goal-binding";
import { MilestoneFlags } from "./milestone-flags";
import { completeSampleMilestone, INITIAL_MILESTONES, MILESTONE_NAMES, PORTFOLIO_GOAL, portfolioSummary, sampleFolios } from "./milestone-model";

export function MilestoneJourney({ still }: { still: boolean }) {
  const [completed, setCompleted] = useState(INITIAL_MILESTONES);
  const [selected, setSelected] = useState(1);
  const [newest, setNewest] = useState<number | null>(null);
  const [phase, setPhase] = useState<BindingPhase>("idle");
  const summary = portfolioSummary(completed);
  const achieved = summary.outcome === "achieved";
  const folios = sampleFolios(completed);

  useEffect(() => {
    if (phase !== "gather" && phase !== "bind") return;
    const timer = window.setTimeout(() => setPhase(still || phase === "bind" ? "shelved" : "bind"), still ? 0 : phase === "gather" ? 800 : 1100);
    return () => window.clearTimeout(timer);
  }, [phase, still]);

  function complete() {
    const next = completeSampleMilestone(completed, selected);
    if (next === completed) return;
    setCompleted(next);
    setNewest(selected);
    if (portfolioSummary(next).outcome === "achieved") setPhase(still ? "shelved" : "gather");
  }

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
    <section aria-labelledby="motion-portfolio-heading">
      <h2 id="motion-portfolio-heading" className="font-display text-3xl">Launch my portfolio</h2>
      <p className="mt-2 text-sm text-muted-foreground">Select a milestone, then hold its completion control. The last one binds the goal into your yearly volume.</p>
      <MilestoneFlags completed={completed} selected={selected} newest={newest} still={still} onSelect={setSelected} />
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <CompletionToggle key={selected} completed={completed[selected]} disabled={completed[selected]} size="lg"
          aria-label={`Complete ${MILESTONE_NAMES[selected]}`} onClick={complete} />
        <div><h3 className="font-display text-xl">{MILESTONE_NAMES[selected]}</h3><p className="text-xs text-muted-foreground">{completed[selected] ? "Milestone recorded" : "Hold to record this milestone"}</p></div>
      </div>
      <WorkQuestCard quest={{
        id: PORTFOLIO_GOAL.id, title: PORTFOLIO_GOAL.title, categoryLabel: "Career", color: PORTFOLIO_GOAL.color!,
        cadenceLabel: "3 named milestones", deadlineLabel: "Sep 30, 2026", completed: achieved,
        progress: { completed: summary.admissibleCompletionCount, target: 3, label: `${summary.admissibleCompletionCount} / 3 milestones` },
      }} goalCard={<GoalProgressCard goal={PORTFOLIO_GOAL} progress={summary} />}>
        <p className="text-sm" role="status">{achieved ? "Goal achieved. Your portfolio is now part of your past-goal history." : `${summary.admissibleCompletionCount} of 3 milestones complete. The goal is still in progress.`}</p>
      </WorkQuestCard>
    </section>
    <GoalBinding folios={folios} phase={phase} onSkip={() => setPhase("shelved")} />
  </div>;
}
