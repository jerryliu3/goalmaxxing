"use client";

import { useEffect, useReducer, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { WorkQuestCard } from "@/features/planner/work-quest-card";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { CascadeFeedback } from "./cascade-feedback";
import { completionReducer, INITIAL_COMPLETION, PARENT_REVEAL_MS, SAMPLE_SAVE_MS } from "./completion-model";
import { RUN_FIELDS, runQuest, sampleReceipt, type Scenario } from "./seed";
import { WeeklyClasp } from "./weekly-clasp";

export function DailyWork({ scenario, still }: { scenario: Scenario; still: boolean }) {
  const [state, dispatch] = useReducer(completionReducer, INITIAL_COMPLETION);
  const [expanded, setExpanded] = useState(true);
  const completed = state.receipt !== null;
  const busy = state.phase === "saving" || state.phase === "cascade";

  useEffect(() => {
    if (state.phase !== "saving") return;
    const timer = window.setTimeout(() => {
      if (scenario === "failure") dispatch({ type: "failed" });
      else dispatch({ type: "recorded", receipt: sampleReceipt(scenario), still });
    }, SAMPLE_SAVE_MS);
    return () => window.clearTimeout(timer);
  }, [scenario, state.phase, still]);

  useEffect(() => {
    if (state.phase !== "cascade") return;
    const timer = window.setTimeout(() => dispatch({ type: still ? "finish" : "next" }), still ? 0 : PARENT_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.activeIndex, still]);

  return <section aria-labelledby="motion-daily-heading">
    <div className="mb-4 flex items-baseline justify-between gap-3"><h2 id="motion-daily-heading" className="font-display text-3xl">Friday, September 18</h2><span className="text-xs text-muted-foreground">Day plan</span></div>
    <div className="motion-study-source">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <CompletionToggle key={state.phase === "error" ? "failed" : "completion"} completed={completed} pending={busy} disabled={completed || busy} size="lg"
          aria-label="Complete Tempo run" title="Hold to complete Tempo run"
          onClick={() => dispatch({ type: "begin" })} />
        <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={expanded} aria-controls="motion-quest-details" onClick={() => setExpanded(value => !value)}>
          <span><span className="block font-display text-2xl">Tempo run</span><span className="text-xs text-muted-foreground">Health · {completed ? "Completed today" : "Hold the square to complete"}</span></span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      <CascadeFeedback state={state} still={still} onFinish={() => dispatch({ type: "finish" })} />
    </div>
    <p className="my-3 min-h-5 text-sm text-muted-foreground" role="status">
      {state.phase === "saving" ? "Recording sample completion…" : state.phase === "cascade" ? `Linked credit ${state.activeIndex + 1} of ${state.receipt?.linked.length}`
        : state.phase === "error" ? "The sample save failed. Nothing was credited; retry or choose another scenario."
          : state.phase === "settled" ? state.receipt?.linked.length ? "Completion and linked credit recorded." : "Completion recorded. No additional linked credit."
            : "The linked parents are outside this day's plan."}
    </p>
    <div id="motion-quest-details" hidden={!expanded}>
      <WorkQuestCard quest={runQuest(completed)} goalCard={
        <div data-goal-progress-card="motion-run"><TempoGoalCard fields={RUN_FIELDS} context="history" achieved={false} rotatable={!still} /></div>
      }>
        <WeeklyClasp completed={completed} still={still} />
      </WorkQuestCard>
    </div>
  </section>;
}
