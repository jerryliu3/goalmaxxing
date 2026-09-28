import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { plannerConcepts } from "./planner/concepts";
import { InterfaceCraftStudy } from "./study";

afterEach(cleanup);

function surface(name: string) {
  return within(screen.getByRole("group", { name: "Study surface" })).getByRole(
    "button",
    { name: new RegExp(name) }
  );
}

describe("Everyday interface study", () => {
  it("synchronizes the same scenario across comparison panes and history", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(screen.getByRole("button", { name: "Compare" }));
    const toolbar = within(
      screen.getByRole("region", { name: "Direct toolbar Planner controls" })
    );
    await user.click(toolbar.getByRole("button", { name: "Complete Easy run, September 23" }));
    for (const { name, id } of plannerConcepts) {
      expect(
        within(screen.getByRole("region", { name: `${name} Planner controls` })).getByRole(
          "button",
          { name: id === "canvas" ? "Select Easy run, September 23" : "Undo Easy run, September 23" }
        )
      ).toBeInTheDocument();
    }
    await user.click(surface("Completion history"));
    for (const name of ["Contour", "Typeset", "Signal"]) {
      expect(
        within(screen.getByRole("region", { name: `${name} Completion history` })).getByRole(
          "button",
          { name: "September 23: 1 completions" }
        )
      ).toHaveAttribute("aria-pressed", "true");
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
    expect(stage.getByRole("button", { name: "September 23: 0 completions" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
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
    await user.click(screen.getByRole("button", { name: "This month" }));
    expect(screen.getByText("9 / 12")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(screen.getByRole("button", { name: "This week" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("9 / 12")).not.toBeInTheDocument();
  });

  it("keeps independent preferences when switching surfaces and resetting samples", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(screen.getByRole("button", { name: "Prefer this" }));
    await user.click(surface("Completion history"));
    expect(screen.getByRole("button", { name: "Prefer this" })).toHaveAttribute("aria-pressed", "false");
    await user.click(
      within(screen.getByRole("group", { name: "Design direction" })).getByRole("button", {
        name: /Typeset/,
      })
    );
    await user.click(screen.getByRole("button", { name: "Prefer this" }));
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(screen.getByRole("button", { name: "Preferred" })).toHaveAttribute("aria-pressed", "true");
    await user.click(surface("Planner controls"));
    await user.click(screen.getByRole("button", { name: "Compare" }));
    expect(
      within(screen.getByRole("region", { name: "Direct toolbar Planner controls" })).getByRole(
        "button",
        { name: "Preferred" }
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "View composer Planner controls" })).getByRole(
        "button",
        { name: "Prefer this" }
      )
    ).toBeInTheDocument();
  });
});
