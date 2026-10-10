import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonthRound } from "./month";
describe("mobile Month journeys", () => {
  it("reads a busy date, stages a move, and keeps the draft visible behind filters", () => {
    render(<MonthRound variant={0} />);
    fireEvent.click(
      screen.getByRole("button", { name: /^Build the rough cut and refine/ }),
    );
    fireEvent.change(screen.getByLabelText("Move to date"), {
      target: { value: "2026-10-09" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stage this move" }));
    expect(screen.getByLabelText("Unsaved planner changes")).toHaveTextContent(
      "1 unsaved move",
    );
    fireEvent.click(screen.getByRole("button", { name: /^Filters/ }));
    fireEvent.change(screen.getByLabelText("Goal"), {
      target: { value: "run" },
    });
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Done" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save plan" }));
    expect(
      screen.queryByLabelText("Unsaved planner changes"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Plan saved");
  });
  it("undoes only the draft and makes Partner sessions read only", () => {
    render(<MonthRound variant={1} />);
    fireEvent.click(
      screen.getByRole("button", { name: /^Build the rough cut and refine/ }),
    );
    fireEvent.change(screen.getByLabelText("Move to date"), {
      target: { value: "2026-10-09" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Stage this move" }));
    fireEvent.click(screen.getByRole("button", { name: "Undo changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(
      screen.getByRole("button", { name: /^Build the rough cut and refine/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Partner" }));
    expect(
      screen.getByRole("button", { name: /Complete Alex’s easy run/ }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: /^Alex’s easy run 18:30/ }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "cannot move or complete it",
    );
  });
  it("Month chapters keep all weeks reachable, without changing Week", () => {
    render(<MonthRound variant={2} />);
    expect(
      screen.getAllByRole("button", { expanded: false }).length,
    ).toBeGreaterThanOrEqual(4);
    fireEvent.click(screen.getByRole("button", { name: "Sat, Oct 31" }));
    expect(
      screen.getByRole("heading", { name: "Sat, Oct 31" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Edit the short film/ }),
    ).toBeInTheDocument();
  });
});
