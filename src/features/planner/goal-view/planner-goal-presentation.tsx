"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlannerGoalView, type PlannerGoalViewProps } from "./planner-goal-view";
import { PlannerTimeWeave } from "@/features/planner/time-weave/planner-time-weave";

/** Both presentations share the same loaded sessions and canonical planner actions. */
export function PlannerGoalPresentation({ loading, onVisibleDate, onInspectDate, ...cards }: PlannerGoalViewProps & {
  loading: boolean;
  onVisibleDate: (date: string) => void;
  onInspectDate: (date: string) => void;
}) {
  const [calendar, setCalendar] = useState(false);
  return <div className="space-y-3">
    <div className="flex justify-end"><Button size="sm" variant="outline" aria-pressed={calendar} onClick={() => setCalendar(current => !current)}>
      {calendar ? "Back to goal cards" : "See in calendar"}
    </Button></div>
    {calendar ? <PlannerTimeWeave
      goals={cards.goals} sessions={cards.sessions} today={cards.today} weekStartsOn={cards.weekStartsOn}
      loading={loading} showCompletedGoals={cards.showCompletedGoals} completedGoalIds={cards.completedGoalIds}
      onVisibleDate={onVisibleDate} onInspectDate={onInspectDate}
    /> : <PlannerGoalView {...cards} />}
  </div>;
}
