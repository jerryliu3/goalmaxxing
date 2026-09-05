import { selectViewerVisibleGoals } from "@cadence/shared/goals/visible-goals";
import {
  fetchProgressContext,
  type ProgressContextResponse,
} from "@/lib/goals/progress-context";
import type { CompletionDateFact, Goal, GoalLink } from "@/lib/goals/types";
import { assertQueriesOk } from "@/lib/supabase/query-error";
import { createClient } from "@/lib/supabase/client";

export interface TodayData {
  userId: string;
  goals: Goal[];
  completions: CompletionDateFact[];
  memberTeamIds: string[];
  links: GoalLink[];
  photoUrls: Record<string, string>;
  progress: ProgressContextResponse | null;
}

export const emptyTodayData: TodayData = {
  userId: "",
  goals: [],
  completions: [],
  memberTeamIds: [],
  links: [],
  photoUrls: {},
  progress: null,
};

export async function fetchChecklistTodayData({
  userId,
  subjectUserId,
  viewDate,
  todayLocalDate,
  partnerId,
  forceRefresh = false,
  signal,
}: {
  userId: string;
  subjectUserId?: string;
  viewDate: string;
  todayLocalDate: string;
  partnerId: string | null;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}): Promise<TodayData> {
  const supabase = createClient();
  const targetSubjectUserId = subjectUserId ?? userId;
  const targetIsViewer = targetSubjectUserId === userId;
  const goalsQuery = supabase
    .from("goals")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const [progress, goalsResponse, teamMembersResponse, linksResponse] = await Promise.all([
    fetchProgressContext({
      asOfDate: todayLocalDate,
      viewDate,
      subjectUserId: targetIsViewer ? undefined : targetSubjectUserId,
      forceRefresh,
    }),
    targetIsViewer
      ? goalsQuery
      : goalsQuery.eq("owner_id", targetSubjectUserId).is("team_id", null),
    targetIsViewer
      ? supabase.from("team_members").select("team_id").eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
    targetIsViewer
      ? supabase.from("goal_links").select("*").eq("owner_id", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  assertQueriesOk(
    [goalsResponse, teamMembersResponse, linksResponse],
    "Checklist goals could not be loaded."
  );

  const goals = (goalsResponse.data ?? []) as Goal[];
  const memberTeamIds = ((teamMembersResponse.data ?? []) as Array<{
    team_id: string;
  }>).map((row) => row.team_id);
  const visibleGoals = selectViewerVisibleGoals({
    goals,
    partnerId: targetIsViewer ? partnerId : null,
    memberTeamIds,
  });
  const links = (linksResponse.data ?? []) as GoalLink[];
  const photoUrls: Record<string, string> = {};
  await Promise.all(
    visibleGoals
      .filter((goal) => goal.photo_path)
      .map(async (goal) => {
        if (!goal.photo_path) {
          return;
        }
        const { data: signedData } = await supabase.storage
          .from("goal-photos")
          .createSignedUrl(goal.photo_path, 60 * 60);
        if (signedData?.signedUrl) {
          photoUrls[goal.id] = signedData.signedUrl;
        }
      })
  );

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  return {
    userId: targetSubjectUserId,
    goals: visibleGoals,
    completions: progress.facts,
    memberTeamIds,
    links,
    photoUrls,
    progress,
  };
}
