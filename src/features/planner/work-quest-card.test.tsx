import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkQuestCard } from "@/features/planner/work-quest-card";
import type { WorkQuestModel } from "@/features/planner/work-quest-model";

afterEach(() => {
  cleanup();
});

const quest: WorkQuestModel = {
  id: "tempo-run",
  title: "Tempo run",
  categoryLabel: "Health",
  color: "#22c55e",
  cadenceLabel: "3 days a week",
  deadlineLabel: "Dec 31, 2026",
  progress: {
    completed: 2,
    target: 3,
    label: "2 of 3 this week",
  },
  completed: false,
};

describe("WorkQuestCard", () => {
  it("heads the card with the goal name and the instance navigation", () => {
    render(
      <WorkQuestCard
        quest={quest}
        leadingNav={<button type="button">Previous instance</button>}
        trailingNav={<button type="button">Next instance</button>}
      >
        <p>This sitting is on Thu, Sep 22.</p>
      </WorkQuestCard>
    );

    expect(screen.getByRole("heading", { name: "Tempo run" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous instance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next instance" })).toBeInTheDocument();
    expect(screen.queryByText("Health")).not.toBeInTheDocument();
    expect(screen.getByText("Cadence")).toBeInTheDocument();
    expect(screen.getByText("3 days a week")).toBeInTheDocument();
    expect(screen.getByText("Deadline")).toBeInTheDocument();
    expect(screen.getByText("Dec 31, 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "2 of 3 this week" })
    ).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("This sitting is on Thu, Sep 22.")).toBeInTheDocument();
  });

  it("carries the goal color and owns no fold control of its own", () => {
    const { container } = render(
      <WorkQuestCard quest={quest}>
        <p>Body</p>
      </WorkQuestCard>
    );

    const card = container.querySelector("[data-plan-work-quest]");
    expect(card).toBeInstanceOf(HTMLElement);
    expect((card as HTMLElement).style.getPropertyValue("--goal-color")).toBe("#22c55e");
    expect(screen.queryByRole("button", { name: "Details" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fold away" })).not.toBeInTheDocument();
  });
});
