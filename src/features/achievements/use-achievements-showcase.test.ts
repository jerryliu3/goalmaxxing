import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";

describe("useAchievementsShowcase", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          schemaVersion: "2",
          collection: {
            level: 2,
            totalXp: 400,
            unlockedAwards: 1,
            totalAwards: 2,
            achievedGoals: 0,
            featuredAwardId: "reward-2",
          },
          personalRecords: [],
          levelAwards: [],
          achievedGoals: [],
          truncated: { goals: false, completions: false },
          correlationId: "corr-1",
        }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the showcase payload", async () => {
    const { result } = renderHook(() => useAchievementsShowcase());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.payload?.schemaVersion).toBe("2");
    expect(result.current.error).toBeNull();
  });

  it("sets loading while reloading after an error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schemaVersion: "2",
          collection: {
            level: 2,
            totalXp: 400,
            unlockedAwards: 1,
            totalAwards: 2,
            achievedGoals: 0,
            featuredAwardId: "reward-2",
          },
          personalRecords: [],
          levelAwards: [],
          achievedGoals: [],
          truncated: { goals: false, completions: false },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAchievementsShowcase());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.reload();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
    expect(result.current.payload?.schemaVersion).toBe("2");
  });
});
