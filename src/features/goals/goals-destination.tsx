"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewGoalButton } from "@/features/goals/new-goal-button";
import { CalendarPageShell } from "@/features/planner/calendar-page-shell";
import { isDemoPathname } from "@/lib/navigation/demo-path";

export function GoalsDestination() {
  const prefix = isDemoPathname(usePathname()) ? "/demo" : "";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Choose what matters. Keep your next steps in view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewGoalButton />
          <Link href={`${prefix}/goals/library`} className="text-sm font-medium underline underline-offset-4">
            Goal library
          </Link>
        </div>
      </div>
      <CalendarPageShell destination="goals" />
    </div>
  );
}
