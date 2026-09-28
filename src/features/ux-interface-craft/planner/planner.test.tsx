import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { InterfaceCraftStudy } from "../study";

afterEach(cleanup);

async function choose(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(within(screen.getByRole("group", { name: "Planner interaction model" })).getByRole("button", { name: new RegExp(name) }));
}

describe("planner interaction models", () => {
  it("applies direct toolbar controls immediately and composes filters", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(screen.getByRole("button", { name: "Health" }));
    expect(screen.queryByRole("button", { name: /Edit the short film, September 25/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Day" }));
    await user.click(screen.getByRole("button", { name: "Complete Easy run, September 23" }));
    expect(screen.getByRole("button", { name: "Undo Easy run, September 23" })).toHaveAttribute("aria-pressed", "true");
    await user.type(screen.getByRole("searchbox", { name: "Search sample goals" }), "missing");
    expect(screen.getByRole("status")).toHaveTextContent("No sessions in this view");
    await user.click(screen.getByRole("button", { name: "Clear scope" }));
    expect(screen.getByRole("button", { name: "Undo Easy run, September 23" })).toBeInTheDocument();
  });

  it("zooms through calendar dates and selects work before exposing contextual actions", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await choose(user, "Canvas navigation");
    expect(screen.queryByRole("group", { name: "Planner view" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark complete" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open September 23" }));
    await user.click(screen.getByRole("button", { name: "Select Easy run, September 23" }));
    expect(screen.getByText("3 of 7 sample sessions complete")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark complete" }));
    expect(screen.getByText("4 of 7 sample sessions complete")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo completion" }));
    expect(screen.getByText("3 of 7 sample sessions complete")).toBeInTheDocument();
    await user.click(within(screen.getByRole("navigation", { name: "Calendar zoom" })).getByRole("button", { name: "September" }));
    expect(screen.queryByRole("button", { name: "Undo completion" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open September 1" }));
    expect(screen.getByRole("status")).toHaveTextContent("No sessions in this view");
    expect(screen.getByRole("heading", { name: "September 1" })).toBeInTheDocument();
  });

  it("scopes by goal in the navigator and preserves scope when it is collapsed", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await choose(user, "Goal navigator");
    await user.click(within(screen.getByRole("group", { name: "Navigate by goal" })).getByRole("button", { name: /Run a comfortable 10K/ }));
    expect(screen.queryByRole("button", { name: /Edit the short film, September 25/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete Easy run, September 26" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hide navigator" }));
    expect(screen.queryByRole("group", { name: "Navigate by goal" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete Easy run, September 26" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear scope" }));
    expect(screen.getByRole("button", { name: "Complete Edit the short film, September 25" })).toBeInTheDocument();
  });

  it("stages composer changes, cancels without applying, and commits only view fields", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await choose(user, "View composer");
    await user.click(screen.getByRole("button", { name: "Change view" }));
    let dialog = within(screen.getByRole("dialog", { name: "Compose your view" }));
    await user.click(dialog.getByRole("button", { name: "Day" }));
    await user.click(dialog.getByRole("button", { name: "Health" }));
    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Complete Edit the short film, September 25" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change view" }));
    dialog = within(screen.getByRole("dialog", { name: "Compose your view" }));
    expect(dialog.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
    expect(dialog.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await user.click(dialog.getByRole("button", { name: "Day" }));
    await user.click(dialog.getByRole("button", { name: "Health" }));
    await user.click(dialog.getByRole("button", { name: "Apply view" }));
    expect(screen.getByRole("button", { name: "Complete Easy run, September 23" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete Read for 30 minutes, September 23" })).not.toBeInTheDocument();
    expect(screen.getByText("3 of 7 sample sessions complete")).toBeInTheDocument();
  });

  it("shares applied state between all four models and resets contextual state", async () => {
    const user = userEvent.setup();
    render(<InterfaceCraftStudy />);
    await user.click(screen.getByRole("button", { name: "Compare" }));
    const canvas = within(screen.getByRole("region", { name: "Canvas navigation Planner controls" }));
    await user.click(canvas.getByRole("button", { name: "Select Easy run, September 23" }));
    await user.click(canvas.getByRole("button", { name: "Mark complete" }));
    for (const name of ["Direct toolbar", "Goal navigator", "View composer"]) {
      expect(within(screen.getByRole("region", { name: `${name} Planner controls` })).getByRole("button", { name: "Undo Easy run, September 23" })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "Reset sample" }));
    expect(canvas.queryByRole("button", { name: "Undo completion" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Direct toolbar Planner controls" })).getByRole("button", { name: "Complete Easy run, September 23" })).toBeInTheDocument();
  });
});
