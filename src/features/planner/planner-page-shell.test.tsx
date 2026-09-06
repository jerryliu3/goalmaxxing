import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerPageShell } from "./planner-page-shell";

let mockSearch = "";

vi.mock("next/navigation", () => ({
  usePathname: () => "/calendar",
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

vi.mock("@/features/planner/calendar-page-shell", () => ({
  CalendarPageShell: () => <div>Calendar surface</div>,
}));

describe("PlannerPageShell", () => {
  afterEach(() => {
    cleanup();
    mockSearch = "";
  });

  it("renders Plan calendar without Calendar/Checklist/Tasks chips", async () => {
    render(<PlannerPageShell />);

    expect(await screen.findByText("Calendar surface")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Calendar" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Checklist" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Tasks" })).toBeNull();
  });

  it("still renders Plan when a legacy checklist surface query is present", async () => {
    mockSearch = "?surface=checklist";
    render(<PlannerPageShell />);

    expect(await screen.findByText("Calendar surface")).toBeInTheDocument();
    expect(screen.queryByText(/Checklist surface/)).toBeNull();
  });
});
