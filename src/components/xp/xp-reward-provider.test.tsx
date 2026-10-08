import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  useXpReward,
  XpRewardProvider,
} from "@/components/xp/xp-reward-provider";

afterEach(() => {
  cleanup();
});

function RewardHarness() {
  const { celebrate } = useXpReward();
  return (
    <button
      type="button"
      onClick={() =>
        celebrate({
          sourceRect: { top: 100, left: 40, width: 40, height: 40 },
          targetRect: { top: 10, left: 280, width: 90, height: 32 },
        })
      }
    >
      Celebrate
    </button>
  );
}

describe("XpRewardProvider", () => {
  it("renders one pointer-transparent flight at the supplied source", () => {
    const { container } = render(
      <XpRewardProvider>
        <RewardHarness />
      </XpRewardProvider>
    );

    expect(
      document.querySelector("[data-motion='xp-reward-overlay']")
    ).toHaveClass("pointer-events-none");

    fireEvent.click(screen.getByRole("button", { name: "Celebrate" }));

    expect(document.querySelectorAll("[data-reward-burst]")).toHaveLength(1);
  });

  it("server-renders without the browser-only overlay", () => {
    const html = renderToString(
      <XpRewardProvider>
        <p>Page</p>
      </XpRewardProvider>
    );

    expect(html).toContain("Page");
    expect(html).not.toContain("xp-reward-overlay");
  });
});
