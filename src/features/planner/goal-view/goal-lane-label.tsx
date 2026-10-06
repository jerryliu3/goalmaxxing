"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { getGoalVisual } from "@/features/planner/goal-visuals";
import { isDemoPathname } from "@/lib/navigation/demo-path";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";
import type { LaneGeometry } from "./goal-lanes-model";
import { GoalViewCard } from "./goal-view-card";
import { dateLabel } from "./goal-view-model";

/** Lane borders and paper fade in and out with Calendar. */
export const LANE_CHROME =
  "transition-[border-color,background-color] duration-300 motion-reduce:transition-none";

/**
 * The goal label: the goal card thumbnail (desktop), title and end date, all
 * one link that opens the goal to edit. In Calendar's
 * lane it takes the Time Weave's frame and the goal colour on its edge.
 */
export function GoalLaneLabel({
  goal,
  progress,
  geometry,
  lane,
}: {
  goal: Goal;
  progress: ProgressContextSummary | undefined;
  geometry: LaneGeometry;
  /** Calendar's lane: framed, with the goal colour on its edge. */
  lane: boolean;
}) {
  const prefix = isDemoPathname(usePathname()) ? "/demo" : "";
  const color = getGoalVisual({
    goalId: goal.id,
    color: goal.color,
    category: goal.category,
  }).color;
  return (
    <div
      className={cn(
        "sticky left-0 z-20 flex flex-none items-center gap-2.5 border-r border-l-[3px] px-2.5",
        LANE_CHROME,
        lane ? "border-border bg-card" : "border-transparent bg-background"
      )}
      style={{ width: geometry.label, borderLeftColor: lane ? color : undefined }}
    >
      <Link
        href={`${prefix}/goals/${goal.id}`}
        aria-label={`Edit goal ${goal.title}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {geometry.labelCard ? (
          <span className="block w-12 flex-none">
            <GoalViewCard goal={goal} progress={progress} compact />
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="line-clamp-2 type-item text-[15px] leading-tight [overflow-wrap:anywhere]">
            {goal.title}
          </strong>
          <small className="text-[10px] text-muted-foreground">
            {goal.end_date ? `Through ${dateLabel(goal.end_date, "MMM d, yyyy")}` : "Ongoing"}
          </small>
        </span>
      </Link>
    </div>
  );
}
