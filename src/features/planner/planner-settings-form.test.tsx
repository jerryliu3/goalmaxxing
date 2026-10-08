import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerSettingsForm } from "@/features/planner/planner-settings-form";

function renderForm(overrides?: Partial<ComponentProps<typeof PlannerSettingsForm>>) {
  const props: ComponentProps<typeof PlannerSettingsForm> = {
    setupRestWeekdays: [0],
    onSetupRestWeekdaysChange: vi.fn(),
    setupLoading: false,
    plannerReadOnly: false,
    loading: false,
    canResetPlan: true,
    resetLoading: false,
    rebuildLoading: false,
    hasDraftSession: false,
    canShowSaveAction: true,
    rebuildBlockedMessage: undefined,
    fullResetLoading: false,
    goalResetLoading: false,
    openGoals: [],
    onSaveSettings: vi.fn(),
    onUnlockAllGoals: vi.fn(),
    onRefreshCalendar: vi.fn(),
    onFullReset: vi.fn(),
    onResetGoals: vi.fn(),
    ...overrides,
  };
  render(<PlannerSettingsForm {...props} />);
  return props;
}

describe("PlannerSettingsForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("toggles rest days as pressed chips", async () => {
    const user = userEvent.setup();
    const props = renderForm();
    const restDays = screen.getByRole("group", { name: "Rest weekdays" });
    const chips = within(restDays).getAllByRole("button");

    expect(chips).toHaveLength(7);
    expect(chips.filter((chip) => chip.getAttribute("aria-pressed") === "true")).toHaveLength(1);

    await user.click(chips.find((chip) => chip.getAttribute("aria-pressed") === "false")!);
    expect(props.onSetupRestWeekdaysChange).toHaveBeenCalledWith(
      expect.arrayContaining([0])
    );
    expect(vi.mocked(props.onSetupRestWeekdaysChange).mock.calls[0][0]).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Save rest days" }));
    expect(props.onSaveSettings).toHaveBeenCalled();
  });

  it("removes a rest day when its chip is pressed again", async () => {
    const user = userEvent.setup();
    const props = renderForm();
    const restDays = screen.getByRole("group", { name: "Rest weekdays" });
    const pressed = within(restDays)
      .getAllByRole("button")
      .find((chip) => chip.getAttribute("aria-pressed") === "true")!;

    await user.click(pressed);
    expect(props.onSetupRestWeekdaysChange).toHaveBeenCalledWith([]);
  });

  it("groups settings into labelled sections and hides calendar upkeep when read-only", () => {
    renderForm({ plannerReadOnly: true });

    expect(screen.getByRole("region", { name: "Rest days" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Reset" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Calendar" })).toBeNull();
    expect(screen.queryByText(/Timezone and first-day-of-week/)).toBeNull();
  });
});
