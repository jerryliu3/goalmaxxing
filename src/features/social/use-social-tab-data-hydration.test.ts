import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SETTINGS_DATA_CACHE_PREFIX } from "@/lib/cache/planner-tab-cache";
import { resetTabDataCacheForTests, writeTabDataCache } from "@/lib/cache/tab-data-cache";
import { useSocialTabData } from "@/features/social/use-social-tab-data";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/navigation/use-app-router", () => ({
  useAppRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/cache/use-planner-tab-cache-invalidation", () => ({
  usePlannerTabCacheInvalidation: () => undefined,
}));
vi.mock("@/lib/push/client", () => ({ unsubscribeCurrentBrowser: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  // A fresh cache short-circuits loadData before it reaches Supabase, so this
  // only has to exist. If it is ever called the test has stopped being about
  // the cache fast path.
  createClient: () => ({
    auth: { getUser: vi.fn().mockRejectedValue(new Error("must not be called")) },
  }),
}));

const SETTINGS_TAB_CACHE_KEY = `${SETTINGS_DATA_CACHE_PREFIX}v1`;

const cachedPayload = {
  state: {
    userId: "user-1",
    profile: null,
    ownGoals: [],
    sharedGoals: [],
    sharedEntries: [],
    outgoingShares: [],
    sharedOwners: {},
    completions: [],
    profileDirectory: {},
  },
  profileDraft: {
    username: "alice",
    display_name: "Alice Park",
    avatar_url: "",
    social_activity_visible: true,
  },
  plannerPreferencesPersisted: { timezone: "UTC", weekStartsOn: 1, restWeekdays: [] },
  plannerPreferencesDraft: { timezone: "UTC", weekStartsOn: 1 },
};

afterEach(() => {
  resetTabDataCacheForTests();
  vi.restoreAllMocks();
});

describe("useSocialTabData cache and hydration", () => {
  it("does not seed the first render from the cache", () => {
    writeTabDataCache(SETTINGS_TAB_CACHE_KEY, cachedPayload);

    // Effects have already flushed by the time renderHook returns, so the first
    // render has to be recorded while it happens.
    const renders: { loading: boolean; userId: string }[] = [];
    renderHook(() => {
      const value = useSocialTabData();
      renders.push({
        loading: value.loading,
        userId: value.state.userId,
      });
      return value;
    });

    // The cache is sessionStorage-backed and therefore absent on the server.
    // Seeding the first render from it would make the client tree disagree with
    // the server HTML and React would discard the whole settings subtree.
    expect(renders[0]).toEqual({ loading: true, userId: "" });
  });

  it("applies the cached settings once mounted, without refetching", async () => {
    writeTabDataCache(SETTINGS_TAB_CACHE_KEY, cachedPayload);

    const { result } = renderHook(() => useSocialTabData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.state.userId).toBe("user-1");
    expect(result.current.profileDraft.username).toBe("alice");
    expect(result.current.plannerPreferencesLoading).toBe(false);
  });

  it("keeps stale settings visible when background refresh fails", async () => {
    writeTabDataCache(SETTINGS_TAB_CACHE_KEY, cachedPayload, 0);
    const { result } = renderHook(() => useSocialTabData());
    expect(result.current.loading).toBe(false);
    expect(result.current.profileDraft.username).toBe("alice");
    await waitFor(() => expect(result.current.state.userId).toBe("user-1"));
  });
});
