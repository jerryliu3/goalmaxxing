import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalCreationEntry } from "@/features/goals/goal-creation-entry";

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

  it("offers starter packs from the method chooser and routes their selection to the bulk form", () => {
    mockSearch = "";
    render(<StrictMode><GoalCreationEntry /></StrictMode>);
    fireEvent.click(screen.getByText("Start from a pack or import"));
    const health = screen.getByRole("link", { name: "Health starter pack" });
    expect(health).toHaveAttribute("href", "?mode=multi&starterPack=health");
    expect(screen.queryByRole("link", { name: "Clear starter pack" })).toBeNull();
    fireEvent.click(health);
    expect(screen.getByText("Bulk form")).toBeVisible();
    expect(screen.queryByRole("group", { name: "Creation method" })).toBeNull();
  });

  it("opens a direct multi-goal link without the method chooser", () => {
    render(<GoalCreationEntry />);
    expect(screen.getByText("Bulk form")).toBeVisible();
    expect(screen.queryByRole("group", { name: "Creation method" })).toBeNull();
  });
});
