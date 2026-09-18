import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressWeekRhythm } from "@/features/insights/use-progress-week-rhythm";
import type { Goal } from "@/lib/goals/types";

const mocks = vi.hoisted(() => ({
  getJson: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getJson: (...args: unknown[]) => mocks.getJson(...args),
}));

vi.mock("@/lib/cache/tab-data-cache", () => ({
  readTabDataCache: () => null,
  writeTabDataCache: () => undefined,
}));

const goals = [{ id: "goal-a", title: "Tempo run", color: "#2563eb" } as Goal];

function renderWeekRhythm(overrides: { includePlannedSessions: boolean }) {
  return renderHook(() =>
    useProgressWeekRhythm({
      goals,
      completions: [
        { goal_id: "goal-a", completed_on: "2026-09-08", source: "manual" },
      ],
      asOfDate: "2026-09-09",
      weekStartsOn: 1,
      visibleGoalIds: null,
      enabled: true,
      ...overrides,
    })
  );
}

describe("useProgressWeekRhythm", () => {
  beforeEach(() => {
    mocks.getJson.mockReset();
    mocks.getJson.mockResolvedValue({
      preview: {
        workUnits: [
          {
            originalGoalId: "goal-a",
            scheduledDate: "2026-09-11",
            creditState: "uncredited",
          },
        ],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("adds planned sessions from the planner on the viewer lane", async () => {
    const { result } = renderWeekRhythm({ includePlannedSessions: true });

    await waitFor(() => {
      const states = Object.fromEntries(
        (result.current.rows[0]?.days ?? []).map((day) => [day.date, day.state])
      );
      expect(states["2026-09-11"]).toBe("planned");
    });
    expect(mocks.getJson).toHaveBeenCalledWith("/api/planner/context", {
      query: { scopeMonth: "2026-09" },
    });
  });

  it("builds a partner week from completions without fetching the viewer planner", () => {
    const { result } = renderWeekRhythm({ includePlannedSessions: false });

    expect(mocks.getJson).not.toHaveBeenCalled();
    const states = Object.fromEntries(
      (result.current.rows[0]?.days ?? []).map((day) => [day.date, day.state])
    );
    expect(states["2026-09-08"]).toBe("complete");
    expect(states["2026-09-11"]).toBe("empty");
  });
});
