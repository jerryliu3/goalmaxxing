"use client";

import { type ReactNode } from "react";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";

export function PlanViewTransitionFrame({
  viewMode,
  children,
}: {
  viewMode: PlannerCalendarViewMode;
  children: ReactNode;
}) {
  return (
    <div data-plan-view-frame="true">
      <div data-plan-view={viewMode}>{children}</div>
    </div>
  );
}
