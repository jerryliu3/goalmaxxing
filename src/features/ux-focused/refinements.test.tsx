import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrackerStudy } from "./tracker";
import { ProfileStudy } from "./profile";
import { FocusedPicker } from "./picker";
import { CollectionStudy } from "./collection";
import { CreationNavigation } from "./creation-navigation";
import { PROFILE_PINS } from "./profile-sample";
import { FOCUSED_STUDIES } from "./catalog";
vi.mock("@/features/social/profile-membership-card", () => ({
  ProfileMembershipCard: () => <div>Membership card</div>,
}));
vi.mock("@/features/goals/goal-progress-card", () => ({
  GoalProgressCard: ({ goal }: { goal: { title: string } }) => (
    <div>{goal.title}</div>
  ),
}));
vi.mock("@/features/achievements/medals", () => ({
  MedalMark: () => <span />,
}));

describe("tracker inspection", () => {
  it("inspection reads a date without changing it; its separate control logs with the existing keyboard interaction", () => {
    render(<TrackerStudy variant={1} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Inspect", exact: true }),
    );
    fireEvent.click(screen.getByTitle("2026-10-06: 0 completions"));
    const detail = screen.getByRole("region", {
      name: "Inspected completion day",
    });
    expect(
      within(detail).getByText("No completion logged"),
    ).toBeInTheDocument();
    expect(screen.getByTitle("2026-10-06: 0 completions")).toBeInTheDocument();
    fireEvent.keyDown(
      within(detail).getByRole("button", { name: /Complete/ }),
      { key: "Enter" },
    );
    expect(screen.getByTitle("2026-10-06: 1 completion")).toBeInTheDocument();
  });
  it("makes aggregate history read only and future logging unavailable", () => {
    render(<TrackerStudy variant={1} />);
    fireEvent.change(screen.getByLabelText("Inspect date"), {
      target: { value: "2026-10-09" },
    });
    expect(
      within(
        screen.getByRole("region", { name: "Inspected completion day" }),
      ).getByRole("button", { name: /Complete/ }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Selected goals"), {
      target: { value: "all" },
    });
    expect(
      within(
        screen.getByRole("region", { name: "Inspected completion day" }),
      ).queryByRole("button", { name: /Complete/ }),
    ).not.toBeInTheDocument();
  });
});
describe("profile refinements", () => {
  it("reaches privacy directly and saves its local setting", () => {
    render(<ProfileStudy />);
    fireEvent.click(
      screen.getByRole("button", { name: "Settings", exact: true }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Privacy Activity/ }));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Social activity enabled/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Close", exact: true }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Privacy preference saved in the sample",
    );
  });
  it("keeps pin changes staged when Done closes the picker, and Undo restores the profile", () => {
    render(<ProfileStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Choose showcase" }));
    fireEvent.click(screen.getByRole("button", { name: "Pin Level 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByLabelText("Profile changes")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Undo profile changes" }),
    );
    expect(screen.queryByLabelText("Profile changes")).not.toBeInTheDocument();
  });
  it("keeps selected items removable during search and respects the separate record budget", () => {
    render(
      <FocusedPicker
        records={false}
        pins={[...PROFILE_PINS, { kind: "medal", ref: "level-6" }]}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Pin Level 4" })).toBeDisabled();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "unmatched" },
    });
    expect(
      screen.getByRole("button", { name: "Remove Level 8" }),
    ).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("3/3");
  });
});
describe("bounded collection changes", () => {
  it("retrieves a goal and clears an empty search", () => {
    render(<CollectionStudy />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Japanese" },
    });
    expect(screen.getAllByText(/Japanese/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Run 3 days a week")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "unmatched" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getAllByText("Run 3 days a week").length).toBeGreaterThan(0);
  });
  it("keeps the intention on Back and clears it on Cancel", () => {
    render(<CreationNavigation />);
    fireEvent.click(
      screen.getByRole("button", { name: "Try creation navigation" }),
    );
    fireEvent.change(screen.getByLabelText("Goal name"), {
      target: { value: "Run a 10K" },
    });
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Create one goal" }));
    expect(screen.getByLabelText("Goal name")).toHaveValue("Run a 10K");
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Try creation navigation" }),
    );
    expect(screen.getByLabelText("Goal name")).toHaveValue("");
  });
  it("excludes the rejected and already-resolved redesigns", () => {
    expect(FOCUSED_STUDIES.map((study) => study.slug)).toEqual([
      "team",
      "phone-agenda",
      "mobile-landing",
      "tracker",
      "profile",
      "goal-collection",
    ]);
  });
});
