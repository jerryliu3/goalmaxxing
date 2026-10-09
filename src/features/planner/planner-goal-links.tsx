"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PlannerGoalLinkSummary } from "@cadence/shared/planner/context";

const PlannerGoalLinksContext = createContext<{
  links: readonly PlannerGoalLinkSummary[];
  goalTitles: Record<string, string>;
}>({ links: [], goalTitles: {} });

export function PlannerGoalLinksProvider({
  links,
  goalTitles,
  children,
}: {
  links: readonly PlannerGoalLinkSummary[];
  goalTitles: Record<string, string>;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ links, goalTitles }), [links, goalTitles]);
  return (
    <PlannerGoalLinksContext.Provider value={value}>
      {children}
    </PlannerGoalLinksContext.Provider>
  );
}

export function usePlannerGoalLinks() {
  return useContext(PlannerGoalLinksContext).links;
}

export function usePlannerGoalTitles() {
  return useContext(PlannerGoalLinksContext).goalTitles;
}
