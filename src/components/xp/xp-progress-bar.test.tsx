import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { XpProgressBar } from "@/components/xp/xp-progress-bar";
import { progressionForTotalXp } from "@/lib/xp/progression";

const useXpProfileMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/xp/xp-profile-provider", () => ({
  useXpProfile: () => useXpProfileMock(),
}));

describe("XpProgressBar", () => {
  it("renders a level progress summary and target", () => {
    useXpProfileMock.mockReturnValue({
      profile: {
        totalXp: 320,
        ...progressionForTotalXp(320),
      },
      rewardSequence: 0,
    });

    const { container } = render(<XpProgressBar />);
    expect(screen.getByText("Lv 3 · 320 XP")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Level 3, 320 XP");
    expect(container.querySelector("[data-xp-reward-target='true']")).not.toBeNull();
  });
});
