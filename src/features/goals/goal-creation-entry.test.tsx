import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalCreationEntry } from "@/features/goals/goal-creation-entry";
import { isStarterPacksSeen } from "@/features/goals/starter-packs";

const VIEWER_USER_ID = "user-1";
let mockSearch = "mode=multi";

vi.mock("next/navigation", () => ({
  usePathname: () => "/goals/new",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/features/social/duo/duo-context", () => ({
  useDuo: () => ({ viewerUserId: "user-1" }),
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
    render(
      <StrictMode>
        <GoalCreationEntry />
      </StrictMode>
    );

    expect(
      await screen.findByText("Starter packs (optional)")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Health starter pack" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear starter pack" })).toBeNull();
    await waitFor(() => {
      expect(isStarterPacksSeen(VIEWER_USER_ID)).toBe(true);
    });

    cleanup();
    render(
      <StrictMode>
        <GoalCreationEntry />
      </StrictMode>
    );

    expect(screen.queryByText("Starter packs (optional)")).toBeNull();
    expect(screen.getByText("Bulk form")).toBeInTheDocument();
  });
});
