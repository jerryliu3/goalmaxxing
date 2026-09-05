import { selectViewerVisibleGoals } from "@cadence/shared/goals/visible-goals";
import { toLocalDateString } from "@/lib/dates/day";
import {
  fetchProgressContext,
  type ProgressContextResponse,
} from "@/lib/goals/progress-context";
import type { CompletionDateFact, Goal } from "@/lib/goals/types";
import {
  fetchInsightsStats,
  InsightsStatsAuthenticationError,
} from "@/lib/insights/stats";
import type { InsightsStatsResponse } from "@/lib/insights/types";
import { assertQueriesOk } from "@/lib/supabase/query-error";
import { createClient } from "@/lib/supabase/client";

export interface InsightsData {
  userId: string;
  goals: Goal[];
  completions: CompletionDateFact[];
  memberTeamIds: string[];
  progress: ProgressContextResponse | null;
  insightsStats: InsightsStatsResponse | null;
}

export const emptyInsights: InsightsData = {
  userId: "",
  goals: [],
  completions: [],
  memberTeamIds: [],
  progress: null,
  insightsStats: null,
};

export { InsightsStatsAuthenticationError };

export async function fetchInsightsData({
  userId,
  subjectUserId,
  selectedYear,
  partnerId,
  forceRefresh = false,
  signal,
}: {
  userId: string;
  subjectUserId?: string;
  selectedYear: string;
  partnerId: string | null;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}): Promise<InsightsData> {
  const supabase = createClient();
  const yearStart = `${selectedYear}-01-01`;
  const yearEnd = `${selectedYear}-12-31`;
  const targetSubjectUserId = subjectUserId ?? userId;
  const targetIsViewer = targetSubjectUserId === userId;
  const asOfDate = toLocalDateString();
  const goalsQuery = supabase
    .from("goals")
    .select("*")
    .eq("is_deleted", false)
    .order("title");

  const [goalsResponse, teamMembersResponse, progress, insightsStats] = await Promise.all([
    targetIsViewer
      ? goalsQuery
      : goalsQuery.eq("owner_id", targetSubjectUserId).is("team_id", null),
    targetIsViewer
      ? supabase.from("team_members").select("team_id").eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
    fetchProgressContext({
      asOfDate,
      factsFrom: yearStart,
      factsTo: yearEnd,
      subjectUserId: targetIsViewer ? undefined : targetSubjectUserId,
      forceRefresh,
    }),
    fetchInsightsStats({
      forceRefresh,
      subjectUserId: targetIsViewer ? undefined : targetSubjectUserId,
    }),
  ]);

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  assertQueriesOk(
    [goalsResponse, teamMembersResponse],
    "Insights goals could not be loaded."
  );

  const memberTeamIds = ((teamMembersResponse.data ?? []) as Array<{
    team_id: string;
  }>).map((row) => row.team_id);
  const goals = (goalsResponse.data ?? []) as Goal[];
  const visibleGoals = targetIsViewer
    ? selectViewerVisibleGoals({
        goals,
        partnerId,
        memberTeamIds,
      })
    : goals;

  return {
    userId: targetSubjectUserId,
    goals: visibleGoals,
    completions: progress.facts,
    memberTeamIds,
    progress,
    insightsStats,
  };
}
