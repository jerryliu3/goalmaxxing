import type {
  ProgressContextFact,
  ProgressContextResponse,
  ProgressContextSummary,
} from "@cadence/shared/goals/progress-context";
import type { DuoLaneSubject } from "@cadence/shared/social/duo";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { sanitizeMobileSupabaseError } from "../../lib/supabase-error";
import { supabase } from "../../lib/supabase";
import { triggerLightPressFeedback } from "../../lib/haptics";
import { useSession } from "../../lib/session";
import {
  buildMobileGoalsQueryKey,
  buildMobileTeamMembershipQueryKey,
  duoQueryKeys,
} from "../duo/query-keys";
import {
  extractMobileDuoPartnerFailureContext,
  reportMobileDuoPartnerFetchFailure,
} from "../duo/telemetry";
import {
  MOBILE_CHECKLIST_GOALS_SELECT,
  resolveTeamMembershipIds,
  selectChecklistGoalsForSubject,
  type MobileGoal,
} from "../checklist/checklist-lane-data";
import {
  buildInsightsLaneQueryKey,
  buildInsightsProgressQuery,
  countInsightsFactsByDay,
  summarizeInsightsMonth,
  type InsightsMonthSummary,
} from "./insights-lane-data";

function timezoneName() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export interface InsightsLaneData {
  subject: DuoLaneSubject;
  loading: boolean;
  error: unknown;
  facts: ProgressContextFact[];
  summaries: ProgressContextSummary[];
  goals: MobileGoal[];
  factsByDay: Record<string, number>;
  monthSummary: InsightsMonthSummary;
  days: string[];
  offset: number;
  toggleCompletion: ((input: {
    goalId: string;
    date: string;
    desiredFactState: "present" | "absent";
  }) => void) | null;
  refresh: () => void;
}

function buildMonthCells(month: string) {
  const monthDate = new Date(`${month}-01T00:00:00`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(format(cursor, "yyyy-MM-dd"));
  }
  const offset = (start.getDay() + 6) % 7;
  return { days, offset };
}

export function useInsightsLaneData({
  subject,
  month,
  partnerId,
  enabled,
}: {
  subject: DuoLaneSubject;
  month: string;
  partnerId: string | null;
  enabled: boolean;
}): InsightsLaneData {
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const asOfDate = format(new Date(), "yyyy-MM-dd");
  const timezone = timezoneName();
  const interactive = subject.id === "viewer" && !subject.readOnly;
  const subjectReady = subject.id === "viewer" ? Boolean(userId) : Boolean(subject.userId);
  const laneEnabled = Boolean(userId) && enabled && subjectReady;
  const reportedPartnerErrorAt = useRef(0);

  const query = useQuery({
    queryKey: buildInsightsLaneQueryKey({
      viewerUserId: userId,
      subject,
      month,
    }),
    enabled: laneEnabled,
    queryFn: () => {
      const params = buildInsightsProgressQuery({
        asOfDate,
        timezone,
        subject,
        month,
      });
      return api.getJson<ProgressContextResponse>("/api/progress/context", {
        query: Object.fromEntries(params.entries()),
      });
    },
  });
  const goalsQuery = useQuery({
    queryKey: buildMobileGoalsQueryKey({
      viewerUserId: userId,
      subjectUserId: subject.userId,
    }),
    enabled: laneEnabled,
    queryFn: async () => {
      let goalsLoadQuery = supabase.from("goals").select(MOBILE_CHECKLIST_GOALS_SELECT);
      if (subject.id === "partner" && partnerId) {
        goalsLoadQuery = goalsLoadQuery.eq("owner_id", partnerId);
      }
      const { data, error } = await goalsLoadQuery
        .eq("is_deleted", false)
        .order("title", { ascending: true });
      if (error) {
        throw sanitizeMobileSupabaseError({
          error,
          userMessage: "Progress goals could not be loaded.",
        });
      }
      return (data ?? []) as MobileGoal[];
    },
  });
  const teamMembershipQuery = useQuery({
    queryKey: buildMobileTeamMembershipQueryKey({
      viewerUserId: userId,
      subjectUserId: subject.userId,
    }),
    enabled: laneEnabled && subject.id === "viewer",
    queryFn: async () => {
      if (!userId) {
        return [] as string[];
      }
      const { data, error } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId);
      return resolveTeamMembershipIds({
        rows: (data ?? null) as Array<{ team_id: string }> | null,
        hasError: Boolean(error),
      });
    },
  });

  useEffect(() => {
    if (
      subject.id !== "partner" ||
      !query.error ||
      query.errorUpdatedAt === 0 ||
      query.errorUpdatedAt === reportedPartnerErrorAt.current
    ) {
      return;
    }
    reportedPartnerErrorAt.current = query.errorUpdatedAt;
    const details = extractMobileDuoPartnerFailureContext(query.error);
    reportMobileDuoPartnerFetchFailure(query.error, {
      surface: "insights",
      ...details,
    });
  }, [query.error, query.errorUpdatedAt, subject.id]);

  const facts = query.data?.facts ?? [];
  const factsByDay = useMemo(() => countInsightsFactsByDay(facts), [facts]);
  const monthSummary = useMemo(
    () => summarizeInsightsMonth(factsByDay),
    [factsByDay]
  );
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const goals = selectChecklistGoalsForSubject({
    goals: goalsQuery.data ?? [],
    subject,
    partnerId,
    memberTeamIds: teamMembershipQuery.data ?? [],
  });

  const toggleMutation = useMutation({
    mutationFn: async (input: {
      goalId: string;
      date: string;
      desiredFactState: "present" | "absent";
    }) => {
      if (!interactive) {
        throw new Error("Progress ledger is read-only.");
      }
      triggerLightPressFeedback();
      return api.postJson("/api/completions", {
        goalId: input.goalId,
        date: input.date,
        desiredFactState: input.desiredFactState,
        timezone,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: duoQueryKeys.insightsPrefix(userId),
      });
      await queryClient.invalidateQueries({
        queryKey: duoQueryKeys.progressPrefix(userId),
      });
    },
  });

  return {
    subject,
    loading:
      query.isLoading ||
      goalsQuery.isLoading ||
      (interactive && teamMembershipQuery.isLoading),
    error: query.error ?? goalsQuery.error ?? teamMembershipQuery.error,
    facts,
    summaries: query.data?.summaries ?? [],
    goals,
    factsByDay,
    monthSummary,
    days: cells.days,
    offset: cells.offset,
    toggleCompletion: interactive
      ? (input) => toggleMutation.mutate(input)
      : null,
    refresh: () => {
      void queryClient.invalidateQueries({
        queryKey: duoQueryKeys.insightsPrefix(userId),
      });
    },
  };
}
