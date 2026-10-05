import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { XpProgressBar } from "@/components/xp/xp-progress-bar";
import { progressionForTotalXp } from "@/lib/xp/progression";

const useXpProfileMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/xp/xp-profile-provider", () => ({
  useXpProfile: () => useXpProfileMock(),
}));

describe("XpProgressBar", () => {
  it("shows only the level in the header and reveals exact XP on tap", () => {
    const progression = progressionForTotalXp(320);
    useXpProfileMock.mockReturnValue({
      profile: { totalXp: 320, ...progression },
      rewardSequence: 0,
    });

    const { container } = render(<XpProgressBar />);
    const trigger = screen.getByRole("button", { name: "Level 3 progress" });
    expect(trigger).toHaveTextContent("Lv 3");
    expect(trigger).not.toHaveTextContent("320 XP");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Level 3, 320 XP");
    expect(container.querySelector("[data-xp-reward-target='true']")).toHaveClass("h-2.5");

    fireEvent.click(trigger);
    expect(screen.getByText("320 XP")).toBeInTheDocument();
    expect(
      screen.getByText(`${progression.nextLevelMinXp! - 320} XP to Level ${progression.nextLevel}`)
    ).toBeInTheDocument();
  });
});
