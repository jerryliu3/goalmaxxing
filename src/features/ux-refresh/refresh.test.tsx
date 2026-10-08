import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecoveryConcept } from "./agenda/recovery";
import { BooksConcept } from "./goals/books";
import { CreationConcept } from "./goals/creation";
import { EditorConcept } from "./goals/editor";
import { CollectionConcept } from "./goals/collection";
import { TrackerConcept } from "./growth/tracker";
import { ShowcaseConcept } from "./profile/showcase";
import { REFRESH_CONCEPTS, CONCEPT_COUNT } from "./catalog";
import { INITIAL_LOG, toggleSampleCompletion } from "./sample";

vi.mock("@/features/goals/tempo-goal-card", () => ({
  TempoGoalCard: ({ fields }: { fields: { title: string } }) => (
    <div>{fields.title}</div>
  ),
}));
vi.mock("@/features/achievements/medals", () => ({
  MedalMark: () => <span aria-hidden="true" />,
}));
vi.mock("@/features/social/profile-membership-card", () => ({
  ProfileMembershipCard: () => <div>Membership card</div>,
}));
afterEach(cleanup);

describe("refresh coverage", () => {
  it("covers every audit finding with the requested number of concepts", () => {
    expect(REFRESH_CONCEPTS).toHaveLength(24);
    expect(CONCEPT_COUNT).toBe(31);
    expect(new Set(REFRESH_CONCEPTS.map((item) => item.slug)).size).toBe(24);
    expect(
      REFRESH_CONCEPTS.filter((item) => item.priority === "High"),
    ).toHaveLength(7);
    for (const item of REFRESH_CONCEPTS) {
      expect(item.variants.length).toBe(item.priority === "High" ? 2 : 1);
    }
  });
  it("keeps future and invalid days out of the editable sample log", () => {
    expect(toggleSampleCompletion(INITIAL_LOG, "run", 9)).toBe(INITIAL_LOG);
    expect(toggleSampleCompletion(INITIAL_LOG, "run", 0)).toBe(INITIAL_LOG);
    expect(toggleSampleCompletion(INITIAL_LOG, "run", 2).run).toContain(2);
    expect(INITIAL_LOG.run).not.toContain(2);
  });
});

describe("interactive refresh journeys", () => {
  it("stages recovery decisions, supports undo, and commits only with Save review", async () => {
    const user = userEvent.setup();
    render(<RecoveryConcept variant={0} />);
    expect(screen.getByRole("button", { name: "Save review" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Accept date" }));
    expect(screen.getByText("1 unsaved change")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo choice" }));
    expect(screen.getByRole("button", { name: "Save review" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Accept date" }));
    await user.click(screen.getByRole("button", { name: "Save review" }));
    expect(screen.getByText(/Review saved in the sample/)).toBeInTheDocument();
    expect(screen.getByText(/Saved in sample/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save review" })).toBeDisabled();
  });
  it("keeps planner Undo beside Save and restores the saved date", async () => {
    const user = userEvent.setup();
    render(<RecoveryConcept variant={1} />);
    await user.click(
      screen.getByRole("button", { name: "Planner", exact: true }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Proposed day" }),
      "9",
    );
    expect(screen.getByRole("button", { name: "Save plan" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(screen.getByRole("combobox", { name: "Proposed day" })).toHaveValue(
      "8",
    );
    expect(screen.getByRole("button", { name: "Save plan" })).toBeDisabled();
  });
  it("changes tracker scope and exposes explicit logging only when focused", async () => {
    const user = userEvent.setup();
    render(<TrackerConcept variant={1} selectionStudy />);
    expect(
      screen.queryByRole("button", { name: "Log completion" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Change tracker scope/ }),
    );
    await user.click(
      screen.getByRole("button", { name: "Focus Run a comfortable 10K" }),
    );
    await user.click(screen.getByRole("button", { name: /Oct 6,/ }));
    await user.click(screen.getByRole("button", { name: "Log completion" }));
    expect(
      screen.getByRole("button", { name: "Remove", exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Oct 9,.*Future/ }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Remove", exact: true }),
    );
    expect(
      screen.getByRole("button", { name: "Log completion" }),
    ).toBeInTheDocument();
  });
  it("opens a book directly to an unfinished goal without sequential paging", async () => {
    const user = userEvent.setup();
    render(<BooksConcept />);
    await user.click(screen.getByRole("button", { name: /September/ }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByRole("searchbox", { name: "Search book contents" }),
      "Read",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /Read six books/ }),
    );
    expect(
      within(dialog).getByRole("heading", { name: "Read six books" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Ended · 4 of 6", { exact: true }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("caps the showcase and lets users replace a pin from a different category", async () => {
    const user = userEvent.setup();
    render(<ShowcaseConcept />);
    await user.click(screen.getByRole("button", { name: "Edit showcase" }));
    expect(
      screen.getByRole("button", { name: "Pin Best week · 12 completions" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Remove Level 8" }));
    await user.click(
      screen.getByRole("button", { name: "Records", exact: true }),
    );
    await user.click(
      screen.getByRole("button", { name: "Pin Best week · 12 completions" }),
    );
    expect(screen.getByText("3 / 3 pinned")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done", exact: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText("Best week · 12 completions", { exact: true }),
    ).toBeInTheDocument();
  });
  it("keeps a goal's completion count consistent when opening its details", async () => {
    const user = userEvent.setup();
    render(<CollectionConcept />);
    await user.click(
      screen.getByRole("button", { name: "Open Practice Japanese" }),
    );
    const progress = within(screen.getByRole("dialog")).getByRole(
      "progressbar",
      { name: "Practice Japanese progress" },
    );
    expect(progress).toHaveAttribute("value", "6");
    expect(progress).toHaveAttribute("max", "20");
  });
  it("separates reading from editing and discards an unsaved name", async () => {
    const user = userEvent.setup();
    render(<EditorConcept />);
    await user.click(screen.getByRole("button", { name: "Open goal details" }));
    expect(
      screen.getByRole("dialog", { name: "Goal details" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Edit goal", exact: true }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Goal name" }));
    await user.type(
      screen.getByRole("textbox", { name: "Goal name" }),
      "Unsaved title",
    );
    await user.click(screen.getByRole("button", { name: "Cancel edit" }));
    expect(
      screen.queryByRole("textbox", { name: "Goal name" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Unsaved title")).not.toBeInTheDocument();
  });
  it("preserves an intention on Back and explicitly creates only a sample", async () => {
    const user = userEvent.setup();
    render(<CreationConcept />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: "Goal name" }),
      "Run outdoors",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("textbox", { name: "Goal name" })).toHaveValue(
      "Run outdoors",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("button", { name: "Create sample goal" }),
    );
    expect(screen.getByText(/No real goal was created/)).toBeInTheDocument();
  });
});
