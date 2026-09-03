import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlannerSettingsForm } from "@/features/planner/planner-settings-form";

function renderForm(
  overrides?: Partial<Parameters<typeof PlannerSettingsForm>[0]>
) {
  const props = {
    setupRestWeekdays: [] as number[],
    onSetupRestWeekdaysChange: vi.fn(),
    showTasksOnCalendar: false,
    onShowTasksOnCalendarChange: vi.fn(),
    setupLoading: false,
    plannerReadOnly: false,
    recoverLoading: false,
    loading: false,
    saveLoading: false,
    canRecoverPastSessions: false,
    canResetPlan: false,
    resetLoading: false,
    rebuildLoading: false,
    hasDraftSession: false,
    canShowSaveAction: false,
    rebuildBlockedMessage: undefined,
    fullResetLoading: false,
    onSaveSettings: vi.fn(),
    onRecover: vi.fn(),
    onUnlockAllGoals: vi.fn(),
    onRefreshCalendar: vi.fn(),
    onFullReset: vi.fn(),
    ...overrides,
  };
  render(<PlannerSettingsForm {...props} />);
  return props;
}

describe("PlannerSettingsForm", () => {
  it("defaults the calendar tasks checkbox off and reports toggles immediately", () => {
    const props = renderForm();

    const checkbox = screen.getByRole("checkbox", {
      name: /show tasks on calendar/i,
    });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(props.onShowTasksOnCalendarChange).toHaveBeenCalledWith(true);
  });
});
