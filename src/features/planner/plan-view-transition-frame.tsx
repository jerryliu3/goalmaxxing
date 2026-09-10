"use client";

import { type ReactNode } from "react";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";
import { PLAN_VIEW_SWAP_CLASS } from "@/features/planner/plan-view-transition";

export function PlanViewTransitionFrame({
  viewMode,
  children,
}: {
  viewMode: PlannerCalendarViewMode;
  children: ReactNode;
}) {
  return (
    <div data-plan-view-frame="true">
      <div
        key={viewMode}
        data-plan-view={viewMode}
        className={PLAN_VIEW_SWAP_CLASS}
      >
        {children}
      </div>
    </div>
  );
}
