import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoalCreationFieldControls } from "@/features/goals/goal-creation-fields";
import { createDefaultGoalCreationFields } from "@/features/goals/goal-creation-model";
import { resolveGoalDefinitionValidationFeedback } from "@/features/today/goal-form-validation";
import { validateGoalDefinition } from "@/lib/goals/definition-validation";

describe("goal form definition validation adapter", () => {
  afterEach(() => {
    cleanup();
  });

  it("blocks period-limit errors for daily, weekly, and monthly period goals", () => {
    const cases = [
      {
        recurrenceInterval: "daily" as const,
        targetCount: 2,
        message: "Target cannot exceed 1 completions for this period length.",
      },
      {
        recurrenceInterval: "weekly" as const,
        targetCount: 8,
        message: "Target cannot exceed 7 completions for this period length.",
      },
      {
        recurrenceInterval: "monthly" as const,
        targetCount: 32,
        message: "Target cannot exceed 31 completions for this period length.",
      },
    ];

    for (const testCase of cases) {
      const issues = validateGoalDefinition({
        frequencyType: "recurring",
        targetBasis: "period",
        recurrenceInterval: testCase.recurrenceInterval,
        targetCount: testCase.targetCount,
        startDate: "2026-08-01",
        endDate: null,
      });
      const feedback = resolveGoalDefinitionValidationFeedback(issues);

      expect(feedback.validationError, testCase.recurrenceInterval).toBe(
        testCase.message
      );
      expect(feedback.validationWarning, testCase.recurrenceInterval).toBeNull();
    }
  });

  it("allows profile-capacity warnings without blocking submission", () => {
    const issues = validateGoalDefinition({
      frequencyType: "fixed_milestones",
      targetCount: 6,
      startDate: "2026-08-01",
      endDate: "2026-08-07",
      asOfDate: "2026-08-01",
      capacity: {
        restWeekdays: [0, 6],
        blackoutRanges: [],
      },
    });
    const feedback = resolveGoalDefinitionValidationFeedback(issues);

    expect(feedback.validationError).toBeNull();
    expect(feedback.validationWarning).toContain("Only 5 available days");
  });

  it("keeps persisted single-goal definition fields disabled in edit mode", () => {
    const fields = {
      ...createDefaultGoalCreationFields(),
      title: "Existing goal",
      frequency_type: "recurring" as const,
      recurrence_interval: "weekly" as const,
      target_basis: "period" as const,
      target_count: "3",
      start_date: "2026-08-01",
      end_date: "2026-12-31",
    };

    render(
      <GoalCreationFieldControls
        fields={fields}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        definitionFieldsLocked
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isEditing
        isPlannerTask={false}
        linkTarget={{
          value: "none",
          onValueChange: vi.fn(),
          open: false,
          onOpenChange: vi.fn(),
          searchQuery: "",
          onSearchQueryChange: vi.fn(),
          filteredLinkTargets: [],
          selectedTargetGoal: null,
        }}
      />
    );

    expect(
      screen.getByText(
        "Goal type, frequency, target, and start date are fixed after creation. Archive this goal and create a new one to change them."
      )
    ).toBeInTheDocument();

    const comboboxes = screen.getAllByRole("combobox");
    const goalTypeCombobox = comboboxes.find((element) =>
      element.textContent?.includes("Recurring")
    );
    const frequencyCombobox = comboboxes.find((element) =>
      element.textContent?.includes("Weekly")
    );
    const targetField = document.querySelector<HTMLInputElement>(
      "#recurring-target-count"
    );

    expect(goalTypeCombobox).toBeDefined();
    expect(goalTypeCombobox).toBeDisabled();
    expect(frequencyCombobox).toBeDefined();
    expect(frequencyCombobox).toBeDisabled();
    expect(targetField).toBeTruthy();
    expect(targetField).toBeDisabled();
    expect(screen.getByLabelText("Start date")).toBeDisabled();
    expect(screen.getByLabelText("End date (optional)")).not.toBeDisabled();
  });
});
