import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultGoalCreationFields } from "./goal-creation-model";
import { TempoGoalFields } from "./tempo-goal-fields";

afterEach(cleanup);

const linkTarget = {
  value: "none",
  onValueChange: vi.fn(),
  open: false,
  onOpenChange: vi.fn(),
  searchQuery: "",
  onSearchQueryChange: vi.fn(),
  filteredLinkTargets: [],
  selectedTargetGoal: null,
  disabled: false,
};

function renderCreation(
  options: {
    fields?: Partial<ReturnType<typeof createDefaultGoalCreationFields>>;
    prefilled?: boolean;
  } = {},
) {
  const fields = {
    ...createDefaultGoalCreationFields(),
    title: "Read a little",
    ...options.fields,
  };
  const onPatch = vi.fn();
  render(
    <TempoGoalFields
      fields={fields}
      onFieldChange={vi.fn()}
      onPatch={onPatch}
      createKind={fields.frequency_type}
      onCreateKindChange={vi.fn()}
      includePlannerTask={false}
      isPlannerTask={false}
      definitionFieldsLocked={false}
      isEditing={false}
      disabled={false}
      prefilled={options.prefilled}
      linkTarget={linkTarget}
      action={<button type="submit">Create goal</button>}
    />,
  );
  return { onPatch };
}

describe("TempoGoalFields creation flow", () => {
  it("keeps the current step action outside the scrollable creation body", () => {
    renderCreation();

    const continueButton = screen.getByRole("button", { name: /Continue/ });
    expect(continueButton.closest("[data-tempo-creation-actions]")).not.toBeNull();
    expect(continueButton.closest("[data-tempo-creation-body]")).toBeNull();
  });

  it("keeps difficulty on the intention step under category", () => {
    const { onPatch } = renderCreation();
    expect(screen.queryByRole("group", { name: "Difficulty" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Career" }));
    expect(screen.getByRole("group", { name: "Difficulty" })).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: /Hard · a big stretch/ }),
    );
    expect(onPatch).toHaveBeenCalledWith({ difficulty: "hard" });
  });

  it("shows an adjustable plaque target on review above create", () => {
    renderCreation({
      prefilled: true,
      fields: {
        category_selection: "career",
        color: "#6366f1",
        difficulty: "hard",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_basis: "period",
        target_count: "3",
        start_date: "2026-01-01",
        end_date: "",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(
      screen.getByText(
        /Your target before earning this achievement plaque will be/i,
      ),
    ).toBeVisible();
    const input = screen.getByLabelText("Plaque completion target");
    expect(input).toHaveAttribute("type", "number");
    expect(Number((input as HTMLInputElement).value)).toBeGreaterThanOrEqual(1);
    const createGoal = screen.getByRole("button", { name: "Create goal" });
    expect(createGoal).toBeVisible();
    expect(createGoal.closest("[data-tempo-creation-actions]")).not.toBeNull();

    fireEvent.change(input, { target: { value: "9" } });
    expect(input).toHaveValue(9);
  });
});
