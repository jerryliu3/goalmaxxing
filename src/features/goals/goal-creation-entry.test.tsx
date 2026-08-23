import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalCreationEntry } from "@/features/goals/goal-creation-entry";

let mockSearch = "mode=multi";

vi.mock("next/navigation", () => ({
  usePathname: () => "/goals/new",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/features/today/goal-form", () => ({
  GoalForm: () => <div>Single form</div>,
}));

vi.mock("@/features/today/bulk-goal-form", () => ({
  BulkGoalForm: () => <div>Bulk form</div>,
}));

vi.mock("@/features/goals/training-plan-import-entry", () => ({
  TrainingPlanImportEntry: () => <div>Training form</div>,
}));

describe("GoalCreationEntry starter packs", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearch = "mode=multi";
  });

  afterEach(() => {
    cleanup();
  });

  it("shows starter packs once on the first multi-goal visit and hides the clear action", async () => {
    render(<GoalCreationEntry />);

    expect(
      await screen.findByText("Starter packs (optional)")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Health starter pack" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear starter pack" })).toBeNull();

    cleanup();
    render(<GoalCreationEntry />);

    expect(screen.queryByText("Starter packs (optional)")).toBeNull();
    expect(screen.getByText("Bulk form")).toBeInTheDocument();
  });
});
