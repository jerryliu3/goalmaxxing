import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoalCreationActionContext, NewGoalButton } from "./new-goal-button";
vi.mock("next/navigation", () => ({ usePathname: () => "/goals", useSearchParams: () => new URLSearchParams("month=2026-10") }));
afterEach(cleanup);
describe("goal creation action", () => {
  it("returns to the Goals page and its selection after editing", () => {
    render(<NewGoalButton />);
    expect(screen.getByRole("link", { name: "New Goal +" })).toHaveAttribute("href", "/goals/new?returnTo=%2Fgoals%3Fmonth%3D2026-10");
  });
  it("opens the same creation action from a ghost card", () => {
    const open = vi.fn();
    render(<GoalCreationActionContext.Provider value={open}><NewGoalButton presentation="card" /></GoalCreationActionContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "New goal" }));
    expect(open).toHaveBeenCalledTimes(1);
  });
  it("uses the existing demo creation callback when supplied", () => {
    const open = vi.fn();
    render(<GoalCreationActionContext.Provider value={open}><NewGoalButton /></GoalCreationActionContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "New Goal +" }));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
