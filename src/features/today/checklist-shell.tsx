"use client";

import { useMemo, useState } from "react";
import { ChecklistSurface } from "@/features/today/checklist-surface";
import { DuoLanes } from "@/features/social/duo/duo-lanes";
import { useDuoSurface } from "@/features/social/duo/use-duo-surface";
import {
  type ChecklistSharedFilters,
} from "@/features/today/use-checklist-filters";
import { toLocalDateString } from "@/lib/dates/day";
import type { RecurrenceGroup } from "@/features/today/checklist-selectors";
import type { GoalDateSort } from "@/lib/goals/list-view";

export function ChecklistShell({ isActive = true }: { isActive?: boolean }) {
  const { scope, activePartner, viewer, partner } = useDuoSurface("checklist");
  const [viewDate, setViewDate] = useState(toLocalDateString());
  const [showEndedGoals, setShowEndedGoals] = useState(false);
  const [showUpcomingGoals, setShowUpcomingGoals] = useState(false);
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const [showTargetAchievedGoals, setShowTargetAchievedGoals] = useState(false);
  const [showSuppressedLinkedTargets, setShowSuppressedLinkedTargets] =
    useState(false);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [recurrenceFilters, setRecurrenceFilters] = useState<RecurrenceGroup[]>([]);
  const [todayGoalSearchQuery, setTodayGoalSearchQuery] = useState("");
  const [todayEndMonths, setTodayEndMonths] = useState<string[]>([]);
  const [todaySort, setTodaySort] = useState<GoalDateSort>("earliest_end");
  const shareFilters = scope === "both" && Boolean(activePartner);
  const sharedFilters = useMemo<ChecklistSharedFilters | undefined>(
    () =>
      shareFilters
        ? {
            viewDate,
            setViewDate,
            showEndedGoals,
            setShowEndedGoals,
            showUpcomingGoals,
            setShowUpcomingGoals,
            showArchivedGoals,
            setShowArchivedGoals,
            showTargetAchievedGoals,
            setShowTargetAchievedGoals,
            showSuppressedLinkedTargets,
            setShowSuppressedLinkedTargets,
            categoryFilters,
            setCategoryFilters,
            recurrenceFilters,
            setRecurrenceFilters,
            todayGoalSearchQuery,
            setTodayGoalSearchQuery,
            todayEndMonths,
            setTodayEndMonths,
            todaySort,
            setTodaySort,
          }
        : undefined,
    [
      categoryFilters,
      recurrenceFilters,
      shareFilters,
      showArchivedGoals,
      showSuppressedLinkedTargets,
      showTargetAchievedGoals,
      showEndedGoals,
      showUpcomingGoals,
      todayEndMonths,
      todayGoalSearchQuery,
      todaySort,
      viewDate,
    ]
  );

  return (
    <div className="space-y-5">
      {shareFilters ? (
        <>
          <div className="mx-auto w-full md:max-w-3xl">
            <ChecklistSurface
              isActive={isActive}
              sharedFilters={sharedFilters}
              contentMode="filters-only"
            />
          </div>
          <DuoLanes
            scope={scope}
            viewer={viewer}
            partner={partner}
            renderLane={(subject) => (
              <ChecklistSurface
                isActive={isActive}
                subjectUserId={subject.userId}
                readOnly={subject.readOnly}
                sharedFilters={sharedFilters}
                showFiltersSection={false}
                contentMode="goals-only"
              />
            )}
          />
        </>
      ) : (
        <DuoLanes
          scope={scope}
          viewer={viewer}
          partner={partner}
          renderLane={(subject) => (
            <ChecklistSurface
              isActive={isActive}
              subjectUserId={subject.userId}
              readOnly={subject.readOnly}
              sharedFilters={sharedFilters}
            />
          )}
        />
      )}
    </div>
  );
}
