import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { InteractionLab } from "./study";
vi.setConfig({ testTimeout: 30000 });
afterEach(cleanup);
describe("interaction lab journeys", () => {
  it("reviews a move, cancels without changes, saves and undoes", async () => {
    const user = userEvent.setup();
    render(<InteractionLab />);
    await user.click(screen.getByRole("button", { name: "Move Running" }));
    fireEvent.change(screen.getByLabelText("New date for Running"), {
      target: { value: "2026-10-03" },
    });
    await user.click(screen.getByRole("button", { name: "Review move" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("3 Oct");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Move Running" }));
    await user.click(screen.getByRole("button", { name: "Review move" }));
    await user.click(screen.getByRole("button", { name: "Save move" }));
    expect(screen.getByRole("status")).toHaveTextContent("3 Oct");
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("status")).toHaveTextContent("undone");
  });
  it("creates a goal through the whole flow and keeps it across concepts", async () => {
    const user = userEvent.setup();
    render(<InteractionLab />);
    await user.click(screen.getByRole("button", { name: "New goal" }));
    fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
      target: { value: "Learn ceramics" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Create in demo" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Learn ceramics created",
    );
    await user.click(screen.getByRole("button", { name: /Glide/ }));
    await user.click(screen.getByRole("button", { name: /Unplanned ·/ }));
    expect(
      screen.getByRole("button", { name: "Move Learn ceramics" }),
    ).toBeInTheDocument();
  });
  it("changes analysis for any goal combination and keeps membership when switching", async () => {
    const user = userEvent.setup();
    render(<InteractionLab />);
    await user.click(screen.getByRole("tab", { name: "Progress" }));
    const picker = screen.getByText("Make a lens").closest("aside")!;
    await user.click(within(picker).getByRole("button", { name: "Running" }));
    await user.click(within(picker).getByRole("button", { name: "Reading" }));
    expect(
      screen.getByRole("heading", { name: "Running + Reading" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Compare" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "People" }));
    await user.click(screen.getByRole("button", { name: "Challenges" }));
    await user.click(screen.getByRole("button", { name: "Join in demo" }));
    await user.click(screen.getByRole("button", { name: /Switchboard/ }));
    await user.click(screen.getByRole("tab", { name: "People" }));
    await user.click(screen.getByRole("button", { name: "Challenges" }));
    expect(
      screen.getByRole("button", { name: "Leave challenge" }),
    ).toBeInTheDocument();
  });
});

it("opens an indexed goal, changes its calendar view, and restores the whole plan", async () => {
  const user = userEvent.setup();
  render(<InteractionLab />);
  await user.click(screen.getByRole("button", { name: /^0.*Index/ }));
  const index = screen.getByRole("region", { name: "Goal index" });
  await user.type(
    within(index).getByRole("textbox", { name: "Search the goal index" }),
    "Spanish",
  );
  await user.click(within(index).getByRole("button", { name: /Spanish/ }));
  expect(screen.getByRole("heading", { name: "Spanish" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "month" }));
  expect(
    screen.getByRole("region", { name: "month calendar" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Whole plan" }));
  expect(
    screen.getByRole("heading", { name: "Everything, in its place." }),
  ).toBeInTheDocument();
  expect(within(index).getByRole("textbox")).toHaveValue("Spanish");
});

it("saves and restores a lens and carries its scope into history", async () => {
  const user = userEvent.setup();
  render(<InteractionLab />);
  await user.click(screen.getByRole("button", { name: /^0.*Lens/ }));
  await user.click(screen.getByRole("button", { name: "Choose goals" }));
  await user.click(
    within(screen.getByRole("region", { name: "Lens workspace" })).getByRole(
      "button",
      { name: "Running" },
    ),
  );
  await user.click(
    within(screen.getByRole("region", { name: "Lens workspace" })).getByRole(
      "button",
      { name: "Reading" },
    ),
  );
  await user.click(screen.getByRole("button", { name: "All chosen goals" }));
  await user.click(screen.getByRole("button", { name: "Save lens" }));
  await user.type(
    screen.getByRole("textbox", { name: "Lens name" }),
    "Morning rhythm",
  );
  await user.click(screen.getByRole("button", { name: "Save combination" }));
  await user.click(screen.getByRole("button", { name: "Everything" }));
  expect(
    screen.queryByRole("button", { name: "Remove Running from lens" }),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "Morning rhythm" }));
  expect(
    screen.getByRole("button", { name: "All chosen goals" }),
  ).toHaveAttribute("aria-pressed", "true");
  await user.click(
    screen.getByRole("button", { name: "Follow this lens into history" }),
  );
  expect(
    screen.getByRole("heading", { name: "Running + Reading" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Compare" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
});

it("creates a milestone goal through the blueprint with the live preview and review matching", async () => {
  const user = userEvent.setup();
  render(<InteractionLab />);
  await user.click(screen.getByRole("button", { name: /^0.*Index/ }));
  await user.click(screen.getByRole("button", { name: "New goal" }));
  await user.type(
    screen.getByLabelText("Name", { exact: true }),
    "Make a short film",
  );
  await user.click(screen.getByRole("button", { name: /A set of milestones/ }));
  fireEvent.change(screen.getByLabelText("Milestones · one per line"), {
    target: { value: "Script\nShoot\nEdit" },
  });
  await user.click(screen.getByRole("button", { name: "Move milestone 2 up" }));
  expect(screen.getByLabelText("Milestones · one per line")).toHaveValue(
    "Shoot\nScript\nEdit",
  );
  await user.click(screen.getByRole("button", { name: "Review goal" }));
  expect(
    screen.getByRole("heading", { name: "Make a short film" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Create in demo" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "Make a short film created",
  );
  const index = screen.getByRole("region", { name: "Goal index" });
  await user.click(
    within(index).getByRole("button", { name: /Make a short film/ }),
  );
  expect(
    screen.getByRole("button", { name: "Move Shoot" }),
  ).toBeInTheDocument();
});
