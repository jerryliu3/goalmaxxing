import type { GoalCategoryFilterOption } from "@/features/goals/goal-filters";
import type {
  PlannerCompletionFactMarker,
  PlannerDayDetailEntry,
} from "@/features/planner/calendar-surface.types";
import { mergeCompletionFactMarkers } from "@cadence/shared/planner/partner-completion";

interface CalendarFilterGoalSnapshot {
  category: string;
  end_date?: string | null;
}

type CalendarFilterGoalOverride = CalendarFilterGoalSnapshot | undefined;

const MILESTONE_UNIT_KEY_PATTERN = /^milestone:\d+$/i;

export function normalizeCalendarSearchQuery(searchQuery: string | null | undefined) {
  return (searchQuery ?? "").trim().toLocaleLowerCase();
}

function normalizeSearchCandidate(candidate: string | null | undefined) {
  return candidate?.trim().toLocaleLowerCase() ?? "";
}

function matchesNormalizedCalendarSearchQuery(candidate: string, normalizedQuery: string) {
  return candidate.length > 0 && candidate.includes(normalizedQuery);
}

export function buildCalendarCategoryFilterOptions(
  goalsByOriginalId: Map<string, CalendarFilterGoalSnapshot>
): GoalCategoryFilterOption[] {
  const labels = new Set<string>();
  for (const goal of goalsByOriginalId.values()) {
    const normalized = goal.category.trim();
    if (normalized.length > 0) {
      labels.add(normalized);
    }
  }
  return Array.from(labels)
    .sort((left, right) => left.localeCompare(right))
    .map((label) => ({ value: label, label }));
}

export function goalPassesCalendarFilters({
  goalId,
  goalsByOriginalId,
  categoryFilters,
  endMonthFilters,
  goalOverride,
}: {
  goalId: string;
  goalsByOriginalId: Map<string, CalendarFilterGoalSnapshot>;
  categoryFilters: string[];
  endMonthFilters: string[];
  goalOverride?: CalendarFilterGoalOverride;
}) {
  const hasActiveFilters = categoryFilters.length > 0 || endMonthFilters.length > 0;
  const goal = goalOverride ?? goalsByOriginalId.get(goalId) ?? null;
  if (!goal) {
    return !hasActiveFilters;
  }
  if (categoryFilters.length > 0) {
    const allowedCategories = new Set(
      categoryFilters.map((category) => category.trim())
    );
    if (!allowedCategories.has(goal.category.trim())) {
      return false;
    }
  }
  if (endMonthFilters.length > 0) {
    const endMonth = goal.end_date?.slice(0, 7) ?? null;
    return endMonth !== null && endMonthFilters.includes(endMonth);
  }
  return true;
}

export function entryMatchesCalendarSearchQuery(
  entry: Pick<PlannerDayDetailEntry, "goalTitle" | "label" | "unitKey">,
  searchQuery: string
) {
  const normalizedQuery = normalizeCalendarSearchQuery(searchQuery);
  if (normalizedQuery.length === 0) {
    return true;
  }

  const normalizedGoalTitle = normalizeSearchCandidate(entry.goalTitle);
  if (matchesNormalizedCalendarSearchQuery(normalizedGoalTitle, normalizedQuery)) {
    return true;
  }

  const canMatchLabel =
    MILESTONE_UNIT_KEY_PATTERN.test(entry.unitKey) || normalizedGoalTitle.length === 0;
  if (!canMatchLabel) {
    return false;
  }

  return matchesNormalizedCalendarSearchQuery(
    normalizeSearchCandidate(entry.label),
    normalizedQuery
  );
}

function completionMarkerMatchesCalendarSearchQuery(
  marker: Pick<PlannerCompletionFactMarker, "goalTitle">,
  normalizedQuery: string
) {
  if (normalizedQuery.length === 0) {
    return true;
  }
  return matchesNormalizedCalendarSearchQuery(
    normalizeSearchCandidate(marker.goalTitle),
    normalizedQuery
  );
}

export function applyCalendarCompletionMarkerFilters({
  viewerMarkers,
  partnerMarkers,
  goalPassesFilters,
  searchQuery = "",
}: {
  viewerMarkers: PlannerCompletionFactMarker[];
  partnerMarkers: PlannerCompletionFactMarker[];
  goalPassesFilters: (
    goalId: string,
    goalOverride?: CalendarFilterGoalOverride
  ) => boolean;
  searchQuery?: string;
}) {
  const normalizedSearchQuery = normalizeCalendarSearchQuery(searchQuery);
  const filteredViewerMarkers = viewerMarkers.filter(
    (marker) =>
      goalPassesFilters(marker.originalGoalId) &&
      completionMarkerMatchesCalendarSearchQuery(marker, normalizedSearchQuery)
  );
  const filteredPartnerMarkers = partnerMarkers.filter(
    (marker) =>
      goalPassesFilters(marker.originalGoalId, {
        category: marker.goalCategory ?? "",
        end_date: marker.goalEndDate,
      }) && completionMarkerMatchesCalendarSearchQuery(marker, normalizedSearchQuery)
  );
  return mergeCompletionFactMarkers(filteredViewerMarkers, filteredPartnerMarkers);
}
