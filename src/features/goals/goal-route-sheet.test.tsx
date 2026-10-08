import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoalRouteSheet } from "@/features/goals/goal-route-sheet";
import { useReportUnsavedChanges } from "@/features/goals/unsaved-changes";

function DirtyForm() {
  useReportUnsavedChanges(true);
  return <div>Edited form</div>;
}

describe("GoalRouteSheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders sheet content", () => {
    render(
      <GoalRouteSheet onClose={vi.fn()} title="Create goal">
        <div>Goal sheet body</div>
      </GoalRouteSheet>
    );

    expect(screen.getByText("Goal sheet body")).toBeVisible();
    expect(screen.getByTestId("goal-route-sheet")).toHaveClass("rounded-t-3xl");
    expect(screen.getByText("Create goal", { selector: "p" })).toBeVisible();
  });

  it("closes when the close button is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <GoalRouteSheet onClose={onClose} title="Edit goal">
        <div>Goal sheet body</div>
      </GoalRouteSheet>
    );

    await user.click(screen.getByRole("button", { name: "Close goal editor" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before discarding unsaved changes", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <GoalRouteSheet onClose={onClose} title="Create goal">
        <DirtyForm />
      </GoalRouteSheet>
    );

    await user.click(screen.getByRole("button", { name: "Close goal editor" }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Discard your changes?")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByText("Discard your changes?")).not.toBeInTheDocument();
    expect(screen.getByText("Edited form")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Close goal editor" }));
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
