import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingRound } from "./landing";
describe("mobile landing journeys", () => {
  it("carries a draft between lesson steps, then explicitly saves it", () => {
    render(<LandingRound variant={1} />);
    fireEvent.click(screen.getByRole("button", { name: "2. Adapt" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Review this suggestion" }),
    );
    expect(
      screen.getByRole("button", { name: "Save example plan" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "1. Shape" }));
    expect(screen.getByLabelText("Interactive example plan")).toHaveTextContent(
      "Unsaved move",
    );
    fireEvent.click(screen.getByRole("button", { name: "2. Adapt" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo move" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Move Thursday’s session to Friday" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save example plan" }));
    expect(screen.getByRole("status")).toHaveTextContent("Example plan saved");
  });
  it("offers a distinct shared-goal story and protects partner work", () => {
    render(<LandingRound variant={2} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Grow together Make a film/ }),
    );
    const story = screen.getByLabelText("Selected goal story");
    expect(
      within(story).getAllByRole("heading", {
        name: "Finish our short film",
      })[0],
    ).toBeInTheDocument();
    expect(
      within(story).getByRole("button", {
        name: "Remove completion for Select the opening shots, Wed, Oct 7",
      }),
    ).toBeDisabled();
    expect(
      within(story).getByRole("button", {
        name: "Complete Review the rough cut, Fri, Oct 9",
      }),
    ).toBeDisabled();
    expect(
      screen
        .getAllByRole("link", { name: /Create account/ })
        .every((a) => a.getAttribute("href") === "/signup"),
    ).toBe(true);
  });
});
