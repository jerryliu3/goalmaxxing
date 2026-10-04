import {
  DEMO_ALEX_ID,
  DEMO_CHALLENGE_ID,
  DEMO_CORRELATION_ID,
  DEMO_SEASON_ID,
  DEMO_UNSUPPORTED_CODE,
  DEMO_UNSUPPORTED_MESSAGE,
} from "@/features/demo/demo-ids";
import { monthKey } from "@/features/demo/demo-dates";
import {
  buildDemoAchievements,
  buildDemoInsightsStats,
  buildDemoNotificationPreferences,
  buildDemoPlannerContext,
  buildDemoProgressContext,
  buildDemoXpProfile,
} from "@/features/demo/demo-projections";
import { getDemoStore, hasDemoStore, applyDemoDraftCommands, setCompletionFact } from "@/features/demo/demo-store";
import { plannerDraftCommandSchema } from "@/lib/planner/draft-commands";
import { mapTeamStateRpcRow, type TeamStateRpcRow } from "@cadence/shared/social/team";

const DEMO_ORIGIN = "http://demo.local";

export function resolveDemoRequestUrl(input: RequestInfo | URL) {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return new URL(raw, DEMO_ORIGIN);
}

export function isDemoApiPath(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function isBlockedDemoNetworkUrl(url: URL) {
  return (
    url.pathname.startsWith("/rest/v1") ||
    url.pathname.startsWith("/auth/v1") ||
    url.hostname.includes("supabase")
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function demoUnsupportedResponse() {
  return jsonResponse(
    {
      code: DEMO_UNSUPPORTED_CODE,
      message: DEMO_UNSUPPORTED_MESSAGE,
      correlationId: DEMO_CORRELATION_ID,
    },
    403
  );
}

async function readJsonBody(init?: RequestInit) {
  if (!init?.body) {
    return {};
  }
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function requireStore() {
  if (!hasDemoStore()) {
    throw new Error("Demo store is not initialized.");
  }
  return getDemoStore();
}

function socialTeamPayload() {
  const snapshot = requireStore();
  const partner = snapshot.duoState.activePartner;
  if (!partner) {
    return { schemaVersion: "1" as const, correlationId: DEMO_CORRELATION_ID, items: [] };
  }
  const row: TeamStateRpcRow = {
    team_id: partner.teamId,
    status: "active",
    partner_id: partner.partnerId,
    partner_username: partner.partnerUsername,
    partner_display_name: partner.partnerDisplayName,
    partner_avatar_url: partner.partnerAvatarUrl,
    invite_message: null,
    invited_at: snapshot.profiles[0]?.created_at ?? snapshot.asOfDate,
    accepted_at: snapshot.profiles[0]?.created_at ?? snapshot.asOfDate,
    closed_at: null,
    is_incoming: false,
  };
  const item = mapTeamStateRpcRow(row);
  item.teamXp = partner.teamXp;
  return {
    schemaVersion: "1" as const,
    correlationId: DEMO_CORRELATION_ID,
    items: [item],
  };
}

export async function handleDemoFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  originalFetch: typeof fetch
): Promise<Response> {
  const url = resolveDemoRequestUrl(input);
  if (isBlockedDemoNetworkUrl(url)) {
    return demoUnsupportedResponse();
  }
  if (!isDemoApiPath(url.pathname)) {
    return originalFetch(input as RequestInfo, init);
  }

  const method = (init?.method ?? "GET").toUpperCase();
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/api/config" && method === "GET") {
    return jsonResponse({
      schemaVersion: "1",
      flags: {
        crossMonthMovesEnabled: true,
        xpEnabled: true,
        socialEnabled: true,
        integrationsEnabled: false,
        journeyEnabled: false,
        digestEnabled: false,
    coachEnabled: false,
      },
      minSupportedAppVersion: null,
      integrationsRolloutStage: "off",
    });
  }

  if (pathname === "/api/digest" && method === "GET") {
    return jsonResponse({
      schemaVersion: "1",
      kind: "daily",
      periodKey: requireStore().asOfDate,
      localDate: requireStore().asOfDate,
      digestAutoShow: false,
      acknowledged: true,
      shouldAutoShow: false,
      facts: {
        recap: {
          label: "Yesterday",
          start: requireStore().asOfDate,
          end: requireStore().asOfDate,
          placed: 0,
          completed: 0,
          items: [],
        },
        ahead: {
          label: "Today",
          start: requireStore().asOfDate,
          end: requireStore().asOfDate,
          placed: 0,
          completed: 0,
          items: [],
        },
      },
      suggestions: null,
      correlationId: DEMO_CORRELATION_ID,
    });
  }
  if (pathname === "/api/digest/generate" && method === "POST") {
    return jsonResponse({
      schemaVersion: "1",
      kind: "daily",
      periodKey: requireStore().asOfDate,
      reused: true,
      suggestions: {
        motivation: "Demo stays on the calendar.",
        suggestions: [],
      },
      correlationId: DEMO_CORRELATION_ID,
    });
  }
  if (pathname === "/api/digest/ack" && method === "POST") {
    return jsonResponse({
      schemaVersion: "1",
      kind: "daily",
      periodKey: requireStore().asOfDate,
      acknowledged: true,
      correlationId: DEMO_CORRELATION_ID,
    });
  }
  if (pathname === "/api/digest/settings" && method === "POST") {
    return jsonResponse({
      schemaVersion: "1",
      digestAutoShow: false,
      correlationId: DEMO_CORRELATION_ID,
    });
  }

  if (pathname === "/api/xp/profile" && method === "GET") {
    return jsonResponse(buildDemoXpProfile());
  }
  if (pathname === "/api/xp/awards/acknowledge" && method === "POST") {
    return jsonResponse({
      schemaVersion: "1",
      acknowledged: true,
      correlationId: DEMO_CORRELATION_ID,
    });
  }
  if (pathname === "/api/xp/achievements" && method === "GET") {
    return jsonResponse(buildDemoAchievements());
  }

  if (pathname === "/api/notifications/preferences" && method === "GET") {
    return jsonResponse(buildDemoNotificationPreferences());
  }

  if (pathname === "/api/planner/prepare" && method === "POST") {
    const body = await readJsonBody(init);
    const scopeMonth =
      typeof body.scopeMonth === "string" ? body.scopeMonth : monthKey(requireStore().asOfDate);
    return jsonResponse(buildDemoPlannerContext(scopeMonth));
  }
  if (pathname === "/api/planner/context" && method === "GET") {
    const scopeMonth = url.searchParams.get("scopeMonth") ?? monthKey(requireStore().asOfDate);
    return jsonResponse(buildDemoPlannerContext(scopeMonth));
  }
  if (pathname === "/api/planner/context" && method === "POST") {
    const snapshot = requireStore();
    return jsonResponse({
      preview: buildDemoPlannerContext(monthKey(snapshot.asOfDate)).preview,
    });
  }

  if (pathname === "/api/xp/rewards/acknowledge" && method === "POST") {
    return jsonResponse({
      schemaVersion: "1",
      acknowledged: true,
      correlationId: DEMO_CORRELATION_ID,
    });
  }

  if (pathname === "/api/progress/context" && method === "GET") {
    const asOfDate = url.searchParams.get("asOfDate") ?? requireStore().asOfDate;
    return jsonResponse(
      buildDemoProgressContext({
        asOfDate,
        viewDate: url.searchParams.get("viewDate") ?? undefined,
        factsFrom: url.searchParams.get("factsFrom") ?? undefined,
        factsTo: url.searchParams.get("factsTo") ?? undefined,
        subjectUserId: url.searchParams.get("subjectUserId") ?? undefined,
      })
    );
  }

  if (pathname === "/api/insights/stats" && method === "GET") {
    return jsonResponse(
      buildDemoInsightsStats(url.searchParams.get("subjectUserId") ?? undefined)
    );
  }

  if (pathname === "/api/social/freshness" && method === "GET") {
    const snapshot = requireStore();
    const serverNow = isoNow(snapshot.asOfDate);
    return jsonResponse({
      schemaVersion: "1",
      correlationId: DEMO_CORRELATION_ID,
      freshness: {
        serverNow,
        nextExpectedRefreshAt: `${snapshot.asOfDate}T23:59:59.000Z`,
        leaderboardRefreshedAt: serverNow,
        challengesRefreshedAt: serverNow,
      },
    });
  }
  if (pathname === "/api/social/feed" && method === "GET") {
    return jsonResponse({
      schemaVersion: "1",
      correlationId: DEMO_CORRELATION_ID,
      items: requireStore().feed,
      nextCursor: null,
    });
  }
  if (pathname === "/api/social/challenges" && method === "GET") {
    return jsonResponse({
      schemaVersion: "1",
      correlationId: DEMO_CORRELATION_ID,
      items: [requireStore().challenge],
    });
  }
  if (pathname === `/api/social/challenges/${DEMO_CHALLENGE_ID}` && method === "GET") {
    return jsonResponse({
      schemaVersion: "1",
      correlationId: DEMO_CORRELATION_ID,
      item: requireStore().challenge,
    });
  }
  if (pathname === "/api/social/leaderboards" && method === "GET") {
    return jsonResponse({
      schemaVersion: "1",
      correlationId: DEMO_CORRELATION_ID,
      items: [requireStore().season],
    });
  }
  if (pathname === `/api/social/leaderboards/${DEMO_SEASON_ID}` && method === "GET") {
    const snapshot = requireStore();
    return jsonResponse({
      schemaVersion: "1",
      correlationId: DEMO_CORRELATION_ID,
      season: snapshot.season,
      standings: snapshot.standings,
      viewerRank: 3,
    });
  }
  if (pathname === "/api/social/team" && method === "GET") {
    return jsonResponse(socialTeamPayload());
  }

  if (pathname === "/api/completions" && method === "POST") {
    const snapshot = requireStore();
    const body = await readJsonBody(init);
    const goalId = typeof body.goalId === "string" ? body.goalId : "";
    const date = typeof body.date === "string" ? body.date : "";
    const desiredFactState =
      body.desiredFactState === "present" || body.desiredFactState === "absent"
        ? body.desiredFactState
        : null;
    if (!goalId || !date || !desiredFactState) {
      return jsonResponse(
        {
          code: "validation_failed",
          message: "Provide a goal, date, and completion state.",
          correlationId: DEMO_CORRELATION_ID,
        },
        400
      );
    }
    if (desiredFactState === "present" && date > snapshot.asOfDate) {
      return jsonResponse(
        {
          code: "future_completion_not_allowed",
          message: "Completions can only be added for today or a past date.",
          correlationId: DEMO_CORRELATION_ID,
        },
        422
      );
    }
    setCompletionFact({
      goalId,
      date,
      userId: DEMO_ALEX_ID,
      desiredFactState,
    });
    return jsonResponse({
      schemaVersion: "1",
      goalId,
      date,
      factState: desiredFactState,
      correlationId: DEMO_CORRELATION_ID,
    });
  }

  if (pathname === "/api/planner/save" && method === "POST") {
    const body = await readJsonBody(init);
    const parsedCommands = plannerDraftCommandSchema.array().safeParse(
      body.draftCommands ?? []
    );
    if (parsedCommands.success) {
      applyDemoDraftCommands(parsedCommands.data);
    }
    return jsonResponse({
      schemaVersion: "1",
      replayed: false,
      correlationId: DEMO_CORRELATION_ID,
    });
  }

  return demoUnsupportedResponse();
}

function isoNow(asOfDate: string) {
  return `${asOfDate}T15:00:00.000Z`;
}
