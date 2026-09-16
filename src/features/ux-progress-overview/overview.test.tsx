import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressOverview } from "./overview";

function link(label: string, href: string): ReactNode {
  return <a href={href}>{label}</a>;
}

describe("ProgressOverview", () => {
  afterEach(cleanup);

  it("keeps the overview scan short while making deeper sections expandable", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [weekOpen, setWeekOpen] = useState(false);
      const [achievementsOpen, setAchievementsOpen] = useState(false);
      return (
      <ProgressOverview
        weekOpen={weekOpen}
        achievementsOpen={achievementsOpen}
        onWeekToggle={() => setWeekOpen(open => !open)}
        onAchievementsToggle={() => setAchievementsOpen(open => !open)}
        historyLink={link("Open full history", "/ux/progress-overview?view=history")}
        patternsLink={link("Explore patterns", "/ux/progress-overview?view=patterns")}
        foliosLink={link("Open goal library", "/ux/progress-overview?view=folios")}
      />
      );
    }
    render(<Harness />);

    expect(screen.getByRole("heading", { name: "This week" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Completion history" })).toBeInTheDocument();
    expect(screen.queryByTestId("progress-week-rhythm")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open full history/ })).toHaveAttribute(
      "href",
      "/ux/progress-overview?view=history"
    );

    await user.click(screen.getByRole("button", { name: "Expand rhythm" }));
    expect(screen.getByTestId("progress-week-rhythm")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hide rhythm" }));
    expect(screen.queryByTestId("progress-week-rhythm")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand collection" }));
    expect(screen.getByRole("region", { name: "Personal records" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lv 8" }));
    expect(screen.getByRole("dialog", { name: "Level 8" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.queryByRole("region", { name: "Personal records" })).not.toBeInTheDocument();
  });
});
