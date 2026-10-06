import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { XpWordmark } from "@/components/xp/xp-wordmark";
import { progressionForTotalXp } from "@/lib/xp/progression";

const useXpProfileMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/xp/xp-profile-provider", () => ({
  useXpProfile: () => useXpProfileMock(),
}));

describe("XpWordmark", () => {
  it("underlines the wordmark with the XP bar and reveals exact XP on tap", () => {
    const progression = progressionForTotalXp(320);
    useXpProfileMock.mockReturnValue({
      profile: { totalXp: 320, ...progression },
      rewardSequence: 0,
    });

    const { container } = render(<XpWordmark />);
    const trigger = screen.getByRole("button", { name: "Level 3 progress" });
    expect(trigger).toHaveTextContent("Goalmaxxing");
    expect(trigger).toHaveTextContent("Lv 3");
    expect(trigger).not.toHaveTextContent("320 XP");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Level 3, 320 XP");
    expect(container.querySelector("[data-xp-reward-target='true']")).toHaveClass("col-span-2");

    fireEvent.click(trigger);
    expect(screen.getByText("320 XP")).toBeInTheDocument();
    expect(
      screen.getByText(`${progression.nextLevelMinXp! - 320} XP to Level ${progression.nextLevel}`)
    ).toBeInTheDocument();
  });

  it("shows the plain wordmark until the XP profile loads", () => {
    useXpProfileMock.mockReturnValue({ profile: null, rewardSequence: 0 });

    render(<XpWordmark />);
    expect(screen.getByText("Goalmaxxing")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
