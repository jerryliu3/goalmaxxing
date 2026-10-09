"use client";

import Link from "next/link";
import { Link2 } from "lucide-react";
import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

export function LinkedTargetsNote({ linkedTargets, goalTitles }: {
  linkedTargets: PlannerGoalLinkSummary[];
  goalTitles: Record<string, string>;
}) {
  if (linkedTargets.length === 0) return null;
  const targets = Array.from(new Set(linkedTargets.map((link) => link.targetGoalId)))
    .map((id) => ({ id, title: goalTitles[id] ?? id }))
    .sort((left, right) => left.title.localeCompare(right.title));
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-dashed p-2 text-xs">
      <div className="flex min-w-0 items-center gap-1.5 font-medium">
        <Link2 className="size-3.5" />
        <span>Also counts toward</span>
      </div>
      <ul className="mt-2 min-w-0 space-y-1 text-muted-foreground">
        {targets.map((target) => (
          <li key={target.id} className="break-words">
            <Link href={`/goals/${target.id}`} className="underline underline-offset-2">{target.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
