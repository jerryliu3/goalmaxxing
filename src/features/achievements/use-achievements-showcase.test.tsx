import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAchievementsShowcase } from "./use-achievements-showcase";
import { ACHIEVEMENTS_DATA_CACHE_PREFIX, invalidatePlannerRelatedTabCaches, resetPlannerTabCacheInvalidationForTests } from "@/lib/cache/planner-tab-cache";
import { resetTabDataCacheForTests, writeTabDataCache } from "@/lib/cache/tab-data-cache";
import { requestXpRefresh } from "@/lib/xp/events";
import { fetchAchievementsShowcase } from "./fetch-achievements-showcase";

const cached = { medals: ["saved"] };
afterEach(() => {
  cleanup();
  resetTabDataCacheForTests();
  resetPlannerTabCacheInvalidationForTests();
  vi.unstubAllGlobals();
});
describe("Achieved cache reuse", () => {
  it("shares an in-flight prefetch with a mounted viewer", async () => {
    let resolve!: (value: unknown) => void;
    const fetchMock = vi.fn(() => new Promise(done => { resolve = done; }));
    vi.stubGlobal("fetch", fetchMock);
    const warmup = fetchAchievementsShowcase();
    const { result } = renderHook(() => useAchievementsShowcase());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      resolve({ ok: true, json: async () => cached });
      await warmup;
    });
    await waitFor(() => expect(result.current.payload).toEqual(cached));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("reuses the warm session payload when revisiting", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    writeTabDataCache(`${ACHIEVEMENTS_DATA_CACHE_PREFIX}showcase:v3`, cached);
    const { result } = renderHook(() => useAchievementsShowcase());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.payload).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("refreshes after goal/completion invalidation and XP events", async () => {
    const updated = { medals: ["new"] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => updated });
    vi.stubGlobal("fetch", fetchMock);
    writeTabDataCache(`${ACHIEVEMENTS_DATA_CACHE_PREFIX}showcase:v3`, cached);
    const { result } = renderHook(() => useAchievementsShowcase());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => invalidatePlannerRelatedTabCaches());
    await waitFor(() => expect(result.current.payload).toEqual(updated));
    act(() => requestXpRefresh());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
  it("does not request viewer medals for a disabled partner lane", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderHook(() => useAchievementsShowcase({ enabled: false }));
    act(() => requestXpRefresh());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
