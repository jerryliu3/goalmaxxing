import { describe, expect, it } from "vitest";
import {
  createDefaultGoalCreationFields,
  normalizeGoalCreationTarget,
  updateGoalCreationFields,
  validateGoalCreationFields,
  type GoalCreationFields,
} from "@/features/goals/goal-creation-model";

function baseFields(overrides: Partial<GoalCreationFields> = {}): GoalCreationFields {
  return {
    ...createDefaultGoalCreationFields(),
    ...overrides,
  };
}

describe("normalizeGoalCreationTarget", () => {
  const targetCases = [
    { interval: "daily", basis: "period", rawTarget: "", expected: "1" },
    { interval: "weekly", basis: "period", rawTarget: "", expected: "1" },
    { interval: "monthly", basis: "period", rawTarget: "", expected: "1" },
    { interval: "daily", basis: "lifetime", rawTarget: "", expected: "" },
  ] as const;

  for (const targetCase of targetCases) {
    it(`normalizes ${targetCase.interval} ${targetCase.basis} target "${targetCase.rawTarget}" to "${targetCase.expected}"`, () => {
      const normalized = normalizeGoalCreationTarget({
        frequency_type: "recurring",
        recurrence_interval: targetCase.interval,
        target_basis: targetCase.basis,
        target_count: targetCase.rawTarget,
      });
      expect(normalized).toBe(targetCase.expected);
    });
  }

  it("preserves a valid period target", () => {
    expect(
      normalizeGoalCreationTarget({
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_basis: "period",
        target_count: "4",
      })
    ).toBe("4");
  });

  it("requires a positive lifetime target during validation", () => {
    const errors = validateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        recurrence_interval: "daily",
        target_basis: "lifetime",
        target_count: "",
        start_date: "2026-08-17",
      })
    );

    expect(errors).toContain("Total target completions requires a positive target.");
  });
});

describe("updateGoalCreationFields", () => {
  it("switches recurring to fixed milestones with lifetime basis and default count", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "period",
        target_count: "",
        milestone_names: [],
      }),
      { type: "frequency_type", value: "fixed_milestones" }
    );

    expect(next).toMatchObject({
      frequency_type: "fixed_milestones",
      target_basis: "lifetime",
      target_count: "3",
      milestone_names: ["", "", ""],
    });
  });

  it("preserves a valid count when switching recurring to fixed milestones", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_count: "5",
        milestone_names: [],
      }),
      { type: "frequency_type", value: "fixed_milestones" }
    );

    expect(next.target_count).toBe("5");
    expect(next.milestone_names).toEqual(["", "", "", "", ""]);
  });

  it("switches fixed milestones to recurring and clears milestone-only values", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "fixed_milestones",
        target_basis: "lifetime",
        target_count: "3",
        milestone_names: ["Alpha", "Beta", "Gamma"],
      }),
      { type: "frequency_type", value: "recurring" }
    );

    expect(next).toMatchObject({
      frequency_type: "recurring",
      target_basis: "period",
      milestone_names: [],
    });
  });

  it("defaults an empty weekly period target when cadence changes", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        recurrence_interval: "daily",
        target_basis: "period",
        target_count: "",
      }),
      { type: "recurrence_interval", value: "weekly" }
    );

    expect(next.recurrence_interval).toBe("weekly");
    expect(next.target_count).toBe("1");
  });

  it("preserves a valid count when switching target basis", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "period",
        target_count: "4",
      }),
      { type: "target_basis", value: "lifetime" }
    );

    expect(next.target_basis).toBe("lifetime");
    expect(next.target_count).toBe("4");
  });

  it("defaults invalid counts when switching target basis", () => {
    const toLifetime = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "period",
        target_count: "0",
      }),
      { type: "target_basis", value: "lifetime" }
    );
    const toPeriod = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "lifetime",
        target_count: "abc",
      }),
      { type: "target_basis", value: "period" }
    );

    expect(toLifetime.target_count).toBe("3");
    expect(toPeriod.target_count).toBe("1");
  });

  it("defaults empty lifetime targets to 3 and empty period targets to 1", () => {
    const toLifetime = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "period",
        target_count: "",
      }),
      { type: "target_basis", value: "lifetime" }
    );
    const toPeriod = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "lifetime",
        target_count: "",
      }),
      { type: "target_basis", value: "period" }
    );

    expect(toLifetime.target_count).toBe("3");
    expect(toPeriod.target_count).toBe("1");
  });

  it("resizes milestone names when target count changes", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "fixed_milestones",
        target_count: "2",
        milestone_names: ["One", "Two"],
      }),
      { type: "target_count", value: "4" }
    );

    expect(next.milestone_names).toEqual(["One", "Two", "", ""]);
  });

  it("normalizes empty recurring period target counts on edit", () => {
    const next = updateGoalCreationFields(
      baseFields({
        frequency_type: "recurring",
        target_basis: "period",
        target_count: "2",
      }),
      { type: "target_count", value: "" }
    );

    expect(next.target_count).toBe("1");
  });

  it("applies simple field patches without transition side effects", () => {
    const next = updateGoalCreationFields(
      baseFields({ title: "Old title" }),
      { type: "patch", value: { title: "New title", description: "Notes" } }
    );

    expect(next.title).toBe("New title");
    expect(next.description).toBe("Notes");
  });
});

describe("createDefaultGoalCreationFields", () => {
  it("uses approved create-mode defaults", () => {
    expect(createDefaultGoalCreationFields()).toMatchObject({
      title: "",
      category_selection: "personal",
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_basis: "period",
      target_count: "",
      milestone_names: [],
      difficulty: "medium",
      is_private: false,
      linked_target_goal_id: "none",
    });
  });
});
