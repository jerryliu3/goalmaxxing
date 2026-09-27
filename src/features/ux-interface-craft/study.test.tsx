import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { InterfaceCraftStudy } from "./study";
import { concepts } from "./model";

afterEach(cleanup);

function surface(name: string) {
  return within(screen.getByRole("group", { name: "Study surface" })).getByRole("button", { name: new RegExp(name) });
}

describe("Everyday interface study", () => {
  it.each(concepts)("supports filtering, view switching and completion in $name", async ({ name }) => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(within(screen.getByRole("group", { name: "Design direction" })).getByRole("button", { name: new RegExp(name) }));
    const stage = within(screen.getByRole("region", { name: `${name} Planner controls` }));
    await user.click(stage.getByRole("button", { name: "Health", exact: true }));
    expect(stage.queryByRole("button", { name: /Edit the short film, September 25/ })).not.toBeInTheDocument();
    await user.click(stage.getByRole("button", { name: "Complete Easy run, September 23" }));
    expect(stage.getByRole("button", { name: "Undo Easy run, September 23" })).toHaveAttribute("aria-pressed", "true");
    await user.click(stage.getByRole("button", { name: "Day", exact: true }));
    expect(stage.queryByRole("button", { name: "Undo Easy run, September 21" })).not.toBeInTheDocument();
    await user.type(stage.getByRole("searchbox", { name: "Search sample goals" }), "no-match");
    expect(stage.getByRole("status")).toHaveTextContent("No sessions match");
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(stage.getByRole("button", { name: "Week", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(stage.getByRole("button", { name: "Complete Easy run, September 23" })).toBeInTheDocument();
  });

  it("synchronizes the same scenario across comparison panes and history", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(screen.getByRole("button", { name: "Compare", exact: true }));
    const contour = within(screen.getByRole("region", { name: "Contour Planner controls" }));
    await user.click(contour.getByRole("button", { name: "Complete Easy run, September 23" }));
    for (const { name } of concepts) {
      expect(within(screen.getByRole("region", { name: `${name} Planner controls` })).getByRole("button", { name: "Undo Easy run, September 23" })).toBeInTheDocument();
    }
    await user.click(surface("Completion history"));
    for (const { name } of concepts) {
      expect(within(screen.getByRole("region", { name: `${name} Completion history` })).getByRole("button", { name: "September 23: 1 completions" })).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("inspects empty and future days and bounds the two sample months", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(surface("Completion history"));
    const stage = within(screen.getByRole("region", { name: "Contour Completion history" }));
    expect(stage.getByRole("button", { name: "Next month" })).toBeDisabled();
    await user.click(stage.getByRole("button", { name: "September 30: future day" }));
    expect(stage.getByText("Still ahead")).toBeInTheDocument();
    await user.click(stage.getByRole("button", { name: "Previous month" }));
    expect(stage.getByRole("button", { name: "Previous month" })).toBeDisabled();
    await user.click(stage.getByRole("button", { name: "August 5: 0 completions" }));
    expect(stage.getByText(/No completions recorded/)).toBeInTheDocument();
    await user.click(stage.getByRole("button", { name: "Next month" }));
    expect(stage.getByRole("button", { name: "September 23: 0 completions" })).toHaveAttribute("aria-pressed", "true");
  });

  it("connects goal details to summary totals and resets sample edits", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(surface("Goal details"));
    await user.click(screen.getByRole("button", { name: "Open goal details" }));
    await user.click(screen.getByRole("button", { name: "Mark sample session complete" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "9");
    await user.click(surface("Progress summaries"));
    await user.click(screen.getByRole("button", { name: "See goal breakdown" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "This month", exact: true }));
    expect(screen.getByText("9 / 12")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(screen.getByRole("button", { name: "This week", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("9 / 12")).not.toBeInTheDocument();
  });

  it("keeps independent preferences when switching surfaces and resetting samples", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(screen.getByRole("button", { name: "Prefer this" }));
    await user.click(surface("Completion history"));
    expect(screen.getByRole("button", { name: "Prefer this" })).toHaveAttribute("aria-pressed", "false");
    await user.click(within(screen.getByRole("group", { name: "Design direction" })).getByRole("button", { name: /Typeset/ }));
    await user.click(screen.getByRole("button", { name: "Prefer this" }));
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(screen.getByRole("button", { name: "Preferred" })).toHaveAttribute("aria-pressed", "true");
    await user.click(surface("Planner controls"));
    await user.click(screen.getByRole("button", { name: "Compare", exact: true }));
    expect(within(screen.getByRole("region", { name: "Contour Planner controls" })).getByRole("button", { name: "Preferred" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Typeset Planner controls" })).getByRole("button", { name: "Prefer this" })).toBeInTheDocument();
  });
});
