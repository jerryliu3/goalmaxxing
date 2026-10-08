import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";
import { useOwnProfilePresence } from "./use-own-profile-presence";
import { fetchPublicProfileBundle } from "./public-profile/data";
import { resetTabDataCacheForTests } from "@/lib/cache/tab-data-cache";
import {
  invalidatePlannerRelatedTabCaches,
  resetPlannerTabCacheInvalidationForTests,
} from "@/lib/cache/planner-tab-cache";

const mocks = vi.hoisted(() => ({ getJson: vi.fn() }));
vi.mock("@/lib/api/client", () => ({
  getJson: mocks.getJson,
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const bundle: PublicProfileBundle = {
  schemaVersion: "1",
  profile: { subjectUserId: "user-1", username: "alice", displayName: "Alice", avatarUrl: null, isPrivate: false, createdAt: null },
  xp: null, globalAchievements: [], awardCatalogCount: 0,
  overallStats: null, yearHeatmap: [], growSeries: [], growTopPercent: null, currentGoals: [],
  bio: null, showcase: [], showcaseCatalog: null,
};

describe("own Profile presence preload", () => {
  const year = new Date().getFullYear();
  beforeEach(() => {
    resetTabDataCacheForTests();
    resetPlannerTabCacheInvalidationForTests();
    mocks.getJson.mockReset().mockResolvedValue({ item: bundle });
  });
  afterEach(() => {
    resetTabDataCacheForTests();
    resetPlannerTabCacheInvalidationForTests();
  });

  it("shows warmed presence before paint without another network request", async () => {
    await fetchPublicProfileBundle({ subjectUserId: "user-1", year });
    const { result } = renderHook(() => useOwnProfilePresence("user-1", null));
    expect(result.current.bundle).toBe(bundle);
    expect(result.current.loading).toBe(false);
    await act(async () => { await Promise.resolve(); });
    expect(mocks.getJson).toHaveBeenCalledTimes(1);
  });

  it("joins an in-flight presence warmup when Profile opens", async () => {
    let finish!: (value: { item: PublicProfileBundle }) => void;
    mocks.getJson.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const warming = fetchPublicProfileBundle({ subjectUserId: "user-1", year });
    const { result } = renderHook(() => useOwnProfilePresence("user-1", null));
    await act(async () => {
      await Promise.resolve();
      finish({ item: bundle });
      await warming;
    });
    expect(result.current.bundle).toBe(bundle);
    expect(mocks.getJson).toHaveBeenCalledTimes(1);
  });

  it("retains visible stats when refreshing after a completion fails", async () => {
    await fetchPublicProfileBundle({ subjectUserId: "user-1", year });
    const { result } = renderHook(() => useOwnProfilePresence("user-1", null));
    mocks.getJson.mockRejectedValueOnce(new Error("offline"));
    await act(async () => { invalidatePlannerRelatedTabCaches(); });
    await waitFor(() => expect(mocks.getJson).toHaveBeenCalledTimes(2));
    expect(result.current.bundle).toBe(bundle);
    expect(result.current.loading).toBe(false);
  });

  it("discards an old user's in-flight response after the subject changes", async () => {
    let finishOld!: (value: { item: PublicProfileBundle }) => void;
    mocks.getJson.mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }));
    const { result, rerender } = renderHook(
      ({ userId }) => useOwnProfilePresence(userId, null),
      { initialProps: { userId: "user-1" } }
    );
    await act(async () => { await Promise.resolve(); });
    const other = { ...bundle, profile: { ...bundle.profile, subjectUserId: "user-2" } };
    mocks.getJson.mockResolvedValueOnce({ item: other });
    rerender({ userId: "user-2" });
    await waitFor(() => expect(result.current.bundle).toBe(other));
    await act(async () => { finishOld({ item: bundle }); });
    expect(result.current.bundle).toBe(other);
  });
});
