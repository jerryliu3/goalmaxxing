import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";
import AchievementsPage from "@/app/(app)/achievements/page";

const hookState = vi.hoisted(() => ({
  loading: false,
  error: null as string | null,
  payload: null as AchievementsShowcasePayload | null,
  reload: vi.fn(),
}));

vi.mock("@/features/achievements/use-achievements-showcase", () => ({
  useAchievementsShowcase: () => hookState,
}));

describe("AchievementsPage", () => {
  beforeEach(() => {
    hookState.loading = false;
    hookState.error = "Achievements could not be loaded.";
    hookState.payload = null;
    hookState.reload = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("offers retry when loading fails", async () => {
    const user = userEvent.setup();
    render(<AchievementsPage />);

    expect(screen.getByText("Achievements could not be loaded.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(hookState.reload).toHaveBeenCalledTimes(1);
  });

  it("renders the showcase when payload is available", async () => {
    hookState.error = null;
    hookState.payload = {
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
      levelAwards: [
        {
          id: "reward-2",
          awardId: "award-2",
          level: 2,
          title: "Level 2 unlocked",
          description: "You reached Level 2.",
          unlockedAt: "2026-03-01T00:00:00.000Z",
          revokedAt: null,
          tier: "bronze",
        },
      ],
      achievedGoals: [],
      truncated: { goals: false, completions: false },
    };

    render(<AchievementsPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Level 2 unlocked" })).toBeInTheDocument();
    });
  });
});
