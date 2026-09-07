"use client";

import { type ReactNode, ViewTransition } from "react";
import type { PlannerCalendarViewMode } from "@/features/planner/calendar-surface.types";

function canUseViewTransition() {
  return (
    typeof ViewTransition === "function" &&
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function"
  );
}

export function PlanViewTransitionFrame({
  viewMode,
  children,
}: {
  viewMode: PlannerCalendarViewMode;
  children: ReactNode;
}) {
  if (canUseViewTransition()) {
    return (
      <ViewTransition default="plan-view-zoom">
        <div key={viewMode} data-plan-view={viewMode}>
          {children}
        </div>
      </ViewTransition>
    );
  }

  return <div data-plan-view={viewMode}>{children}</div>;
}
