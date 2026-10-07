import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AchievementsShowcase } from "@/features/achievements/showcase";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

afterEach(cleanup);

const payload: AchievementsShowcasePayload = {
  schemaVersion: "3",
  collection: {
    level: 8,
    totalXp: 2840,
    unlockedAwards: 2,
    totalAwards: 4,
    achievedGoals: 1,
    featuredAwardId: "reward-8",
  },
  personalRecords: [
    {
      id: "rec-streak",
      label: "Best streak",
      value: "21d",
      hint: "Current 9d · no shame reset",
      accent: "stamp",
    },
    {
      id: "rec-week",
      label: "Best active week",
      value: "94%",
      hint: "Week of Aug 11",
      accent: "gain",
    },
    {
      id: "rec-goals",
      label: "Goals finished",
      value: "1",
      hint: "First finish in 18 days",
      accent: "sage",
    },
    {
      id: "rec-level",
      label: "Highest level",
      value: "8",
      hint: "2,840 XP total",
      accent: "copper",
    },
  ],
  levelAwards: [
    {
      id: "reward-2",
      awardId: "award-2",
      level: 2,
      title: "Level 2 unlocked",
      description: "You reached Level 2.",
      unlockedAt: "2026-03-12T14:20:00.000Z",
      revokedAt: null,
      tier: "bronze",
    },
    {
      id: "reward-8",
      awardId: "award-8",
      level: 8,
      title: "Level 8 unlocked",
      description: "A summit mark. Keep the cairn.",
      unlockedAt: "2026-09-01T11:05:00.000Z",
      revokedAt: null,
      tier: "gold",
    },
    {
      id: "reward-10",
      awardId: null,
      level: 10,
      title: "Level 10 unlocked",
      description: "Double digits.",
      unlockedAt: null,
      revokedAt: null,
      tier: "gold",
    },
    {
      id: "reward-12",
      awardId: null,
      level: 12,
      title: "Level 12 unlocked",
      description: "A year of measured ascent.",
      unlockedAt: null,
      revokedAt: null,
      tier: "ink",
    },
  ],
  truncated: { goals: false, completions: false },
};

describe("AchievementsShowcase", () => {
  it("renders records and trophy showcase interactions", async () => {
    const user = userEvent.setup();
    render(<AchievementsShowcase payload={payload} />);

    expect(screen.getByLabelText("Personal records")).toBeInTheDocument();
    expect(screen.queryByLabelText("Goal-finish medals")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Finished goals" })).toBeNull();
    expect(screen.getByText("21d")).toBeInTheDocument();
    expect(screen.queryByText("Claimed")).toBeNull();
    expect(screen.getByLabelText("Trophy showcase")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Level 8 unlocked" })).toBeInTheDocument();
    expect(screen.queryByText(/plaque rail/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: /lv 2/i }));
    expect(screen.getAllByRole("heading", { name: "Level 2 unlocked" }).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /^locked award$/i })[0]!);
    expect(screen.getByRole("heading", { name: "Still ahead" })).toBeInTheDocument();
    expect(screen.queryByText(/level 10 unlocked/i)).not.toBeInTheDocument();
  });

  it("keeps a valid shelf selection across payload refresh", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AchievementsShowcase payload={payload} />);

    await user.click(screen.getByRole("button", { name: /lv 2/i }));
    expect(screen.getAllByRole("heading", { name: "Level 2 unlocked" }).length).toBeGreaterThan(0);

    rerender(
      <AchievementsShowcase
        payload={{
          ...payload,
          levelAwards: payload.levelAwards.map((award) => ({ ...award })),
        }}
      />
    );

    expect(screen.getAllByRole("heading", { name: "Level 2 unlocked" }).length).toBeGreaterThan(0);
  });
  it("keeps records visible when the level catalog is empty", () => {
    render(<AchievementsShowcase payload={{ ...payload, levelAwards: [], collection: { ...payload.collection, featuredAwardId: null, totalAwards: 0, unlockedAwards: 0 } }} />);
    expect(screen.getByLabelText("Personal records")).toBeInTheDocument();
    expect(screen.queryByLabelText("Trophy showcase")).toBeNull();
  });

});
