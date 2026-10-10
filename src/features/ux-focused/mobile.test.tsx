import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingStudy } from "./landing";
import { storyPlan } from "./mobile-model";

describe("mobile marketing proof", () => {
  it("changes the example rhythm and only the moved session's date", () => {
    expect(storyPlan(true, false)).toHaveLength(2);
    expect(storyPlan(false, true).find((s) => s.id === "thu")?.date).toBe(
      "2026-10-09",
    );
    expect(storyPlan(false, true).find((s) => s.id === "mon")?.date).toBe(
      "2026-10-05",
    );
  });
  it("shows proposal, undo and explicit save before the example is saved", () => {
    render(<LandingStudy variant={1} />);
    fireEvent.click(screen.getByRole("button", { name: /See example plan/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Move Thursday's run/ }),
    );
    expect(
      screen.getByRole("button", { name: "Save example plan" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo move" }));
    expect(
      screen.queryByRole("button", { name: "Save example plan" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Move Thursday's run/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save example plan" }));
    expect(screen.getByRole("status")).toHaveTextContent("Example saved");
    expect(
      within(screen.getByLabelText("Example running plan")).getByText("Saved"),
    ).toBeInTheDocument();
  });
});
