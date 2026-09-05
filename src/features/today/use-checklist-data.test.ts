import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHECKLIST_DATA_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import {
  readTabDataCache,
  resetTabDataCacheForTests,
  writeTabDataCache,
} from "@/lib/cache/tab-data-cache";
import type { TodayData } from "@/features/today/use-checklist-data";
import type { Goal } from "@/lib/goals/types";

const fetchProgressContext = vi.fn();
const getUser = vi.fn();
const goalsSelect = vi.fn();
const teamMembersSelect = vi.fn();
const goalLinksSelect = vi.fn();
const routerReplace = vi.fn();

vi.mock("@/lib/dates/day", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dates/day")>(
    "@/lib/dates/day"
  );
  return {
    ...actual,
    toLocalDateString: () => "2026-08-25",
  };
});

vi.mock("@/lib/goals/progress-context", () => ({
  fetchProgressContext: (...args: unknown[]) => fetchProgressContext(...args),
}));

vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => ({ replace: routerReplace }),
}));

vi.mock("@/features/social/duo/duo-context", () => ({
  useDuo: () => ({
    viewerUserId: "viewer-1",
    state: { activePartner: null },
  }),
}));

vi.mock("@/lib/cache/use-planner-tab-cache-invalidation", () => ({
  usePlannerTabCacheInvalidation: () => undefined,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => getUser(),
    },
    from: (table: string) => {
      if (table === "goals") {
        return goalsSelect();
      }
      if (table === "team_members") {
        return teamMembersSelect();
      }
      if (table === "goal_links") {
        return goalLinksSelect();
      }
      throw new Error(`unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: null }),
      }),
    },
  }),
}));

import { useChecklistData } from "@/features/today/use-checklist-data";

const baseGoal = {
  id: "goal-1",
  owner_id: "viewer-1",
  title: "Run",
  category: "health",
  frequency_type: "recurring",
  recurrence_interval: "daily",
  target_count: null,
  start_date: "2026-08-01",
  is_deleted: false,
  created_at: "2026-08-01T00:00:00Z",
} as Goal;

function buildGoalsQuery(result: { data: unknown[]; error: null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    is: () => chain,
    order: () => chain,
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return chain;
}

function buildSimpleQuery(result: { data: unknown[]; error: null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    then: (
      onFulfilled: (value: typeof result) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return chain;
}

describe("useChecklistData cache behavior", () => {
  beforeEach(() => {
    resetTabDataCacheForTests();
    fetchProgressContext.mockReset();
    getUser.mockReset();
    goalsSelect.mockReset();
    teamMembersSelect.mockReset();
    goalLinksSelect.mockReset();
    routerReplace.mockReset();

    getUser.mockResolvedValue({ data: { user: { id: "viewer-1" } } });
    goalsSelect.mockReturnValue(buildGoalsQuery({ data: [baseGoal], error: null }));
    teamMembersSelect.mockReturnValue(
      buildSimpleQuery({ data: [], error: null })
    );
    goalLinksSelect.mockReturnValue(
      buildSimpleQuery({ data: [], error: null })
    );
    fetchProgressContext.mockResolvedValue({
      facts: [{ goal_id: "goal-1", completed_on: "2026-08-12", source: "manual" }],
      summaries: [],
      weekStartsOn: 1,
    });
  });

  it("returns cached checklist data without refetching goals on cache hit", async () => {
    const cacheKey = `${CHECKLIST_DATA_CACHE_PREFIX}viewer-1:2026-08-12:2026-08-25:partner:none`;
    const cached: TodayData = {
      userId: "viewer-1",
      goals: [{ ...baseGoal }],
      completions: [],
      memberTeamIds: [],
      links: [],
      photoUrls: {},
      progress: null,
    };
    writeTabDataCache(cacheKey, cached);

    const { result } = renderHook(() =>
      useChecklistData({
        isActive: true,
        viewDate: "2026-08-12",
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data.goals).toEqual([{ ...baseGoal }]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.goals).toEqual([{ ...baseGoal }]);
    expect(fetchProgressContext).not.toHaveBeenCalled();
  });

  it("writes view-date progress refreshes to the checklist cache", async () => {
    const initialProgress = {
      facts: [],
      summaries: [],
      weekStartsOn: 1,
    };
    fetchProgressContext.mockResolvedValue(initialProgress);

    const { result, rerender } = renderHook(
      ({ viewDate }) =>
        useChecklistData({
          isActive: true,
          viewDate,
        }),
      { initialProps: { viewDate: "2026-08-12" } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    fetchProgressContext.mockResolvedValue({
      facts: [{ goal_id: "goal-1", completed_on: "2026-08-11", source: "manual" }],
      summaries: [],
      weekStartsOn: 1,
    });

    rerender({ viewDate: "2026-08-11" });

    await waitFor(() => {
      expect(result.current.data.completions).toEqual([
        { goal_id: "goal-1", completed_on: "2026-08-11", source: "manual" },
      ]);
    });

    const cacheKey = `${CHECKLIST_DATA_CACHE_PREFIX}viewer-1:2026-08-11:2026-08-25:partner:none`;
    expect(readTabDataCache<TodayData>(cacheKey)?.completions).toEqual([
      { goal_id: "goal-1", completed_on: "2026-08-11", source: "manual" },
    ]);
  });

  it("preserves goals during completion-only refresh", async () => {
    const { result } = renderHook(() =>
      useChecklistData({
        isActive: true,
        viewDate: "2026-08-12",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data.goals).toEqual([{ ...baseGoal }]);
    });

    fetchProgressContext.mockResolvedValue({
      facts: [{ goal_id: "goal-1", completed_on: "2026-08-12", source: "manual" }],
      summaries: [],
      weekStartsOn: 1,
    });

    await act(async () => {
      await result.current.loadData({
        showLoading: false,
        forceRefresh: true,
        completionOnly: true,
      });
    });

    expect(result.current.data.goals).toEqual([{ ...baseGoal }]);
    expect(result.current.data.completions).toEqual([
      { goal_id: "goal-1", completed_on: "2026-08-12", source: "manual" },
    ]);
  });
});
