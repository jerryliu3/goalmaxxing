import { describe, expect, it } from "vitest";
import { validateGoalDefinition } from "@/lib/goals/definition-validation";
import { resolveGoalDefinitionValidationFeedback } from "@/features/today/goal-form-validation";

describe("goal form definition validation adapter", () => {
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
});
