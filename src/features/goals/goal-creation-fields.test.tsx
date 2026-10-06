import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultGoalCreationFields,
  type GoalCreationFieldChange,
  type GoalCreationFields,
} from "@/lib/goals/creation-model";
import {
  GoalCreationFieldControls,
  type GoalCreationLinkTargetProps,
} from "@/features/goals/goal-creation-fields";

vi.mock("@/features/goals/goal-link-target-select", () => ({
  GoalLinkTargetSelect: ({
    onValueChange,
  }: {
    onValueChange: (value: string) => void;
  }) => (
    <button type="button" aria-label="Select link target" onClick={() => onValueChange("goal-main")}>
      Select link target
    </button>
  ),
}));

afterEach(() => {
  cleanup();
});

function baseFields(overrides: Partial<GoalCreationFields> = {}): GoalCreationFields {
  return {
    ...createDefaultGoalCreationFields(),
    title: "Run more",
    start_date: "2026-08-01",
    ...overrides,
  };
}

function baseLinkProps(
  overrides: Partial<GoalCreationLinkTargetProps> = {}
): GoalCreationLinkTargetProps {
  return {
    value: "none",
    onValueChange: vi.fn(),
    open: false,
    onOpenChange: vi.fn(),
    searchQuery: "",
    onSearchQueryChange: vi.fn(),
    filteredLinkTargets: [],
    selectedTargetGoal: null,
    ...overrides,
  };
}

function comboboxWithText(text: string) {
  return screen.getAllByRole("combobox").find((element) => element.textContent?.includes(text));
}

function renderControls(
  fields: GoalCreationFields,
  options: {
    onFieldChange?: (change: GoalCreationFieldChange) => void;
    onPatch?: (patch: Partial<GoalCreationFields>) => void;
    linkTarget?: Partial<GoalCreationLinkTargetProps>;
    createKind?: "recurring" | "fixed_milestones" | "planner_task";
    includePlannerTask?: boolean;
    teamId?: string | null;
  } = {}
) {
  const onFieldChange =
    options.onFieldChange ??
    vi.fn<(change: import("@/lib/goals/creation-model").GoalCreationFieldChange) => void>();
  const onPatch =
    options.onPatch ?? vi.fn<(patch: Partial<GoalCreationFields>) => void>();
  const onCreateKindChange = vi.fn();

  render(
    <GoalCreationFieldControls
      fields={fields}
      onFieldChange={onFieldChange}
      onPatch={onPatch}
      includePlannerTask={options.includePlannerTask ?? false}
      createKind={options.createKind ?? fields.frequency_type}
      onCreateKindChange={onCreateKindChange}
      isPlannerTask={options.createKind === "planner_task"}
      linkTarget={baseLinkProps(options.linkTarget)}
      teamId={options.teamId ?? null}
    />
  );

  return { onFieldChange, onPatch, onCreateKindChange };
}

describe("GoalCreationFieldControls create mode", () => {
  it("renders recurring and fixed-milestone goal type controls", async () => {
    const user = userEvent.setup();
    renderControls(baseFields());

    const goalTypeTrigger = comboboxWithText("Recurring");
    expect(goalTypeTrigger).toBeTruthy();

    await user.click(goalTypeTrigger!);
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Recurring" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Milestones" })).toBeInTheDocument();
  });

  it("lists daily, weekly, and monthly cadence labels", async () => {
    const user = userEvent.setup();
    renderControls(baseFields());

    const frequencyTrigger = comboboxWithText("Daily");
    expect(frequencyTrigger).toBeTruthy();
    await user.click(frequencyTrigger!);
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: "Daily" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Weekly" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Monthly" })).toBeInTheDocument();
  });

  it("shows period target labels for weekly and monthly cadence", () => {
    const { rerender } = render(
      <GoalCreationFieldControls
        fields={baseFields({
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: "2",
        })}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isPlannerTask={false}
        linkTarget={baseLinkProps()}
        teamId={null}
      />
    );

    expect(screen.getByText("Target per week")).toBeInTheDocument();

    rerender(
      <GoalCreationFieldControls
        fields={baseFields({
          recurrence_interval: "monthly",
          target_basis: "period",
          target_count: "2",
        })}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isPlannerTask={false}
        linkTarget={baseLinkProps()}
        teamId={null}
      />
    );

    expect(screen.getByText("Target per month")).toBeInTheDocument();
  });

  it("shows Total target completions for lifetime recurring goals", async () => {
    const user = userEvent.setup();
    renderControls(
      baseFields({
        recurrence_interval: "weekly",
        target_basis: "lifetime",
        target_count: "5",
      })
    );

    expect(screen.getByText("Total target completions")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /advanced settings/i }));
    const checkbox = screen.getByRole("checkbox", {
      name: /total completion target instead of per-period/i,
    });
    expect(checkbox).toBeChecked();
  });

  it("applies min=1, max=7, and max=31 on period target inputs", () => {
    const { rerender } = render(
      <GoalCreationFieldControls
        fields={baseFields({
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: "3",
        })}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isPlannerTask={false}
        linkTarget={baseLinkProps()}
        teamId={null}
      />
    );

    const weeklyInput = document.getElementById("recurring-target-count");
    expect(weeklyInput).toHaveAttribute("min", "1");
    expect(weeklyInput).toHaveAttribute("max", "7");

    rerender(
      <GoalCreationFieldControls
        fields={baseFields({
          recurrence_interval: "monthly",
          target_basis: "period",
          target_count: "3",
        })}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isPlannerTask={false}
        linkTarget={baseLinkProps()}
        teamId={null}
      />
    );

    const monthlyInput = document.getElementById("recurring-target-count");
    expect(monthlyInput).toHaveAttribute("min", "1");
    expect(monthlyInput).toHaveAttribute("max", "31");
  });

  it("uses the global target maximum for lifetime weekly and monthly targets", () => {
    const { rerender } = render(
      <GoalCreationFieldControls
        fields={baseFields({
          recurrence_interval: "weekly",
          target_basis: "lifetime",
          target_count: "20",
        })}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isPlannerTask={false}
        linkTarget={baseLinkProps()}
        teamId={null}
      />
    );

    expect(document.getElementById("recurring-target-count")).toHaveAttribute(
      "max",
      "1000"
    );

    rerender(
      <GoalCreationFieldControls
        fields={baseFields({
          recurrence_interval: "monthly",
          target_basis: "lifetime",
          target_count: "40",
        })}
        onFieldChange={vi.fn()}
        onPatch={vi.fn()}
        createKind="recurring"
        onCreateKindChange={vi.fn()}
        isPlannerTask={false}
        linkTarget={baseLinkProps()}
        teamId={null}
      />
    );

    expect(document.getElementById("recurring-target-count")).toHaveAttribute(
      "max",
      "1000"
    );
  });

  it("requires a positive lifetime target", () => {
    renderControls(
      baseFields({
        recurrence_interval: "weekly",
        target_basis: "lifetime",
        target_count: "",
      })
    );

    const lifetimeInput = document.getElementById("recurring-target-count");
    expect(lifetimeInput).toBeRequired();
    expect(lifetimeInput).toHaveAttribute("min", "1");
  });

  it("keeps definition controls enabled in create mode", () => {
    renderControls(baseFields());

    expect(comboboxWithText("Recurring")).not.toBeDisabled();
    expect(comboboxWithText("Daily")).not.toBeDisabled();
    expect(screen.getByLabelText("Start date")).not.toBeDisabled();
    expect(screen.getByLabelText("End date (optional)")).not.toBeDisabled();
  });

  it("calls update callbacks for custom category, default time, difficulty, privacy, links, and milestones", async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    const onPatch = vi.fn();
    const onLinkValueChange = vi.fn();

    renderControls(
      baseFields({
        category_selection: "custom",
        custom_category: "",
        frequency_type: "fixed_milestones",
        target_count: "2",
        milestone_names: ["", ""],
      }),
      {
        onFieldChange,
        onPatch,
        linkTarget: {
          value: "none",
          onValueChange: onLinkValueChange,
          open: false,
          onOpenChange: vi.fn(),
          searchQuery: "",
          onSearchQueryChange: vi.fn(),
          filteredLinkTargets: [],
          selectedTargetGoal: null,
        },
      }
    );

    await user.type(screen.getByLabelText("Custom category label"), "Wellness");
    expect(onPatch).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /advanced settings/i }));

    await user.click(
      screen.getByRole("checkbox", { name: /make this goal private/i })
    );
    expect(onPatch).toHaveBeenCalledWith({ is_private: true });

    await user.type(screen.getByLabelText("Default time of day"), "0900");
    expect(onPatch).toHaveBeenCalled();

    const difficultyTrigger = comboboxWithText("Medium");
    expect(difficultyTrigger).toBeTruthy();
    await user.click(difficultyTrigger!);
    await user.click(screen.getByRole("option", { name: "Hard" }));
    expect(onPatch).toHaveBeenCalledWith({ difficulty: "hard" });

    await user.click(screen.getByRole("button", { name: "Select link target" }));
    expect(onLinkValueChange).toHaveBeenCalledWith("goal-main");

    await user.click(screen.getByRole("button", { name: /milestone names/i }));
    fireEvent.change(screen.getByPlaceholderText("Milestone 1"), {
      target: { value: "Step one" },
    });
    expect(onFieldChange).toHaveBeenCalledWith({
      type: "milestone_name",
      index: 0,
      value: "Step one",
    });
  });

  it("does not render photo, reward-text, or obsolete bulk-only advanced controls", async () => {
    const user = userEvent.setup();
    renderControls(baseFields());

    await user.click(screen.getByRole("button", { name: /advanced settings/i }));

    expect(screen.queryByLabelText("Photo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Achievement reward text")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Color accent")).not.toBeInTheDocument();
  });
});
