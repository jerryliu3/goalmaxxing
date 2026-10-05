"use client";

import Link from "next/link";
import { CalendarPageShell } from "@/features/planner/calendar-page-shell";
import { usePathname } from "next/navigation";
import { isDemoPathname } from "@/lib/navigation/demo-path";

export function GoalsDestination() {
  const prefix = isDemoPathname(usePathname() ?? "") ? "/demo" : "";
  return <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-3xl font-semibold">Goals</h1><p className="text-sm text-muted-foreground">Choose what matters. Keep your next steps in view.</p></div>
      <Link href={`${prefix}/goals/library`} className="text-sm font-medium underline underline-offset-4">Goal library</Link>
    </div>
    <CalendarPageShell destination="goals" />
  </div>;
}
