import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MedalDirectionPage } from "@/features/ux-medals/direction-page";
import { MedalsIndex } from "@/features/ux-medals/medals-index";
import { MEDAL_DIRECTIONS, RANK_NAMES } from "@/features/ux-medals/model";
import { guillochePath, scallopPath } from "@/features/ux-medals/svg-geometry";

afterEach(cleanup);

describe("medals study", () => {
  it("lists the four directions with links and the future families", () => {
    render(<MedalsIndex />);
    for (const direction of MEDAL_DIRECTIONS) {
      expect(screen.getByRole("link", { name: `Open ${direction.name}` })).toHaveAttribute(
        "href",
        `/ux/medals/${direction.slug}`
      );
    }
    const families = screen.getByRole("region", { name: "Future families" });
    for (const name of ["Challenges", "Leaderboards", "Streaks", "Goal finishes", "Team"]) {
      expect(within(families).getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it.each(MEDAL_DIRECTIONS.map((direction) => direction.slug))(
    "renders the %s ladder with every rank name",
    (slug) => {
      render(<MedalDirectionPage slug={slug} />);
      const ladder = screen.getByRole("region", { name: "Level ladder" });
      for (const name of RANK_NAMES[slug]) {
        expect(within(ladder).getByRole("button", { name: new RegExp(name, "i") })).toBeInTheDocument();
      }
      expect(screen.getByRole("heading", { level: 2, name: RANK_NAMES[slug][3] })).toBeInTheDocument();
    }
  );

  it("shows a locked rank honestly when selected", async () => {
    const user = userEvent.setup();
    render(<MedalDirectionPage slug="seal" />);

    await user.click(screen.getByRole("button", { name: /fellow, level 10, locked/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Fellow" })).toBeInTheDocument();
    expect(screen.getByText("Not yet earned")).toBeInTheDocument();
    expect(screen.getByText("What it takes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fellow, level 10, locked/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("plays the unlock moment for earned and locked ranks without crashing", async () => {
    const user = userEvent.setup();
    for (const direction of MEDAL_DIRECTIONS) {
      const { unmount } = render(<MedalDirectionPage slug={direction.slug} />);
      await user.click(screen.getByRole("button", { name: /play unlock/i }));
      expect(document.querySelector(".md-unlock")).not.toBeNull();

      const capstone = RANK_NAMES[direction.slug][4]!;
      await user.click(screen.getByRole("button", { name: new RegExp(`${capstone}, level 10`, "i") }));
      expect(document.querySelector(".md-unlock")).toBeNull();
      await user.click(screen.getByRole("button", { name: /play unlock/i }));
      expect(screen.getByText(/preview — not earned yet/i)).toBeInTheDocument();
      unmount();
    }
  });

  it("toggles dark paper on the stage", async () => {
    const user = userEvent.setup();
    const { container } = render(<MedalDirectionPage slug="postmark" />);
    const toggle = screen.getByRole("button", { name: "Dark paper" });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".md-root")).toHaveAttribute("data-theme", "dark");
  });

  it("builds closed SVG geometry", () => {
    expect(scallopPath(53, 30)).toMatch(/^M .* Z$/);
    expect(guillochePath(11, 5, 13.5, 120)).toBe(guillochePath(11, 5, 13.5, 120));
  });
});
