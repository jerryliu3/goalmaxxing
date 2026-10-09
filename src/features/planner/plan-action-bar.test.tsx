import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanningActionBar } from "@/features/planner/plan-action-bar";

function renderBar(overrides?: Partial<ComponentProps<typeof PlanningActionBar>>) {
  const props: ComponentProps<typeof PlanningActionBar> = {
    canSave: true,
    saveLabel: "Save plan",
    saveDisabled: false,
    saveBlockedMessage: null,
    discardDisabled: false,
    onSave: vi.fn(),
    onDiscard: vi.fn(),
    ...overrides,
  };
  render(<PlanningActionBar {...props} />);
  return props;
}

describe("PlanningActionBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("names the draft and keeps Discard and Save together", () => {
    const props = renderBar();
    const bar = screen.getByRole("region", { name: "Planning" });
    expect(bar).toHaveTextContent("Planning");
    expect(bar).not.toHaveTextContent("Unsaved changes");

    fireEvent.click(within(bar).getByRole("button", { name: "Discard" }));
    fireEvent.click(within(bar).getByRole("button", { name: "Save plan" }));
    expect(props.onDiscard).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it("explains why Save is blocked", () => {
    renderBar({ saveDisabled: true, saveBlockedMessage: "Resolve the conflict first" });
    const bar = screen.getByRole("region", { name: "Planning" });
    expect(bar).toHaveTextContent("Resolve the conflict first");
    expect(within(bar).getByRole("button", { name: "Save plan" })).toBeDisabled();
  });

  it("offers only Discard when the draft cannot be saved", () => {
    renderBar({ canSave: false });
    expect(screen.queryByRole("button", { name: "Save plan" })).toBeNull();
    expect(screen.getByRole("button", { name: "Discard" })).toBeEnabled();
  });
});
