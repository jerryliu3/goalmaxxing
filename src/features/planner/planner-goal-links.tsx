"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

const PlannerGoalLinksContext = createContext<readonly PlannerGoalLinkSummary[]>([]);

export function PlannerGoalLinksProvider({
  links,
  children,
}: {
  links: readonly PlannerGoalLinkSummary[];
  children: ReactNode;
}) {
  return (
    <PlannerGoalLinksContext.Provider value={links}>
      {children}
    </PlannerGoalLinksContext.Provider>
  );
}

export function usePlannerGoalLinks() {
  return useContext(PlannerGoalLinksContext);
}
