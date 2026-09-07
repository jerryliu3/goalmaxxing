import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePartnerCompletionOverlay } from "@/features/planner/use-partner-completion-overlay";

const mocks = vi.hoisted(() => ({
  fetchProgressContext: vi.fn(),
  goalsQuery: vi.fn(),
  reportFailure: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => mocks.goalsQuery(),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/goals/progress-context", () => ({
  fetchProgressContext: (...args: unknown[]) => mocks.fetchProgressContext(...args),
  isProgressContextAuthenticationError: () => false,
  isProgressContextRequestError: () => false,
}));

vi.mock("@/lib/dates/day", () => ({
  toLocalDateString: () => "2026-08-15",
}));

vi.mock("@/lib/social/duo/telemetry", () => ({
  reportDuoPartnerFetchFailure: (...args: unknown[]) => mocks.reportFailure(...args),
}));

describe("usePartnerCompletionOverlay", () => {
  beforeEach(() => {
    mocks.fetchProgressContext.mockReset();
    mocks.goalsQuery.mockReset();
    mocks.reportFailure.mockReset();
    mocks.fetchProgressContext.mockResolvedValue({
      facts: [
        {
          goal_id: "partner-goal",
          completed_on: "2026-08-13",
          source: "manual",
        },
      ],
    });
    mocks.goalsQuery.mockResolvedValue({
      data: [
        {
          id: "partner-goal",
          title: "Partner run",
          category: "Health",
          end_date: "2026-08-31",
        },
      ],
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads month-grid facts and filter metadata for the active partner", async () => {
    const { result } = renderHook(() =>
      usePartnerCompletionOverlay({
        enabled: true,
        partnerId: "partner-1",
        month: "2026-08",
      })
    );

    await waitFor(() => {
      expect(result.current.markersByDate.get("2026-08-13")).toEqual([
        expect.objectContaining({
          key: "partner:partner-goal:2026-08-13:manual",
          goalTitle: "Partner run",
          goalCategory: "Health",
          goalEndDate: "2026-08-31",
          owner: "partner",
        }),
      ]);
    });
    expect(mocks.fetchProgressContext).toHaveBeenCalledWith({
      asOfDate: "2026-08-15",
      factsFrom: "2026-07-26",
      factsTo: "2026-09-11",
      subjectUserId: "partner-1",
    });
  });

  it("does not fetch or expose markers when the partner overlay is inactive", () => {
    const { result } = renderHook(() =>
      usePartnerCompletionOverlay({
        enabled: false,
        partnerId: "partner-1",
        month: "2026-08",
      })
    );

    expect(mocks.fetchProgressContext).not.toHaveBeenCalled();
    expect(result.current.markersByDate.size).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("contains a partner fetch failure within the overlay", async () => {
    mocks.fetchProgressContext.mockRejectedValueOnce(new Error("network failed"));
    const { result } = renderHook(() =>
      usePartnerCompletionOverlay({
        enabled: true,
        partnerId: "partner-1",
        month: "2026-08",
      })
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Partner completions are unavailable.");
    });
    expect(result.current.markersByDate.size).toBe(0);
    expect(mocks.reportFailure).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ surface: "calendar" })
    );
  });
});
