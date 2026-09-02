import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BulkGoalDraftReview,
  type BulkGoalDraftReviewProps,
} from "@/features/goals/bulk-goal-draft-review";
import {
  type BulkGoalDraft,
  buildBulkGoalDraftsFromLlmGoals,
  withValidatedBulkGoalDraft,
} from "@/features/goals/bulk-goal-drafts";
import type { Goal } from "@/lib/goals/types";

vi.mock("@/features/goals/goal-link-target-select", () => ({
  GoalLinkTargetSelect: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <button
      type="button"
      aria-label="Select link target"
      onClick={() => onValueChange("goal-main")}
    >
      {value}
    </button>
  ),
}));

afterEach(cleanup);

function ReviewHarness(
  props: Omit<BulkGoalDraftReviewProps, "drafts" | "setDrafts"> & {
    initialDrafts?: BulkGoalDraft[];
  }
) {
  const [drafts, setDrafts] = useState(
    props.initialDrafts ??
      buildBulkGoalDraftsFromLlmGoals([
        {
          title: "Easy run",
          category: "Health",
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          start_date: "2026-08-17",
          end_date: "2026-09-13",
        },
      ])
  );
  return (
    <BulkGoalDraftReview
      {...props}
      drafts={drafts}
      setDrafts={setDrafts}
    />
  );
}

function makeDraft(overrides: Partial<Omit<BulkGoalDraft, "errors">> = {}) {
  const [baseDraft] = buildBulkGoalDraftsFromLlmGoals([
    {
      title: "Easy run",
      category: "Health",
      frequency_type: "recurring",
      recurrence_interval: "daily",
      start_date: "2026-08-17",
      end_date: "2026-09-13",
    },
  ]);
  if (!baseDraft) {
    throw new Error("Could not build base bulk draft.");
  }

  return withValidatedBulkGoalDraft({
    ...baseDraft,
    ...overrides,
  });
}

function comboboxWithText(scope: HTMLElement, text: string) {
  return within(scope)
    .getAllByRole("combobox")
    .find((element) => element.textContent?.includes(text));
}

async function openFirstDraftEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole("button", { name: /tap to edit/i })[0]!);
  return await screen.findByRole("dialog");
}

async function selectComboboxOption(
  user: ReturnType<typeof userEvent.setup>,
  scope: HTMLElement,
  triggerText: string,
  optionName: string
) {
  const trigger = comboboxWithText(scope, triggerText);
  if (trigger) {
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: optionName }));
    return;
  }

  for (const fallbackTrigger of within(scope).getAllByRole("combobox")) {
    await user.click(fallbackTrigger);
    const option = screen.queryByRole("option", { name: optionName });
    if (option) {
      await user.click(option);
      return;
    }
    await user.keyboard("{Escape}");
  }

  throw new Error(`Could not find combobox option: ${optionName}`);
}

const availableGoals: Goal[] = [
  {
    id: "goal-main",
    owner_id: "owner-1",
    title: "Main Goal",
    category: "Health",
    category_key: "health",
    color: "#16a34a",
    description: null,
    frequency_type: "recurring",
    recurrence_interval: "weekly",
    target_count: 2,
    target_basis: "period",
    milestone_names: null,
    start_date: "2026-08-01",
    end_date: "2026-12-31",
    default_local_time: null,
    difficulty: "medium",
    is_private: false,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    photo_path: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  },
];

describe("BulkGoalDraftReview", () => {
  describe.each(["coach", "full"] as const)(
    "shared create-mode editor (%s)",
    (variant) => {
      it(
        "supports draft editing transitions and create-mode advanced fields",
        async () => {
        const user = userEvent.setup({ delay: null });
        render(
          <ReviewHarness
            variant={variant}
            saving={false}
            onCreate={vi.fn()}
            availableGoals={availableGoals}
          />
        );

        const dialog = await openFirstDraftEditor(user);
        const titleInput = within(dialog).getByLabelText("Name");
        await user.clear(titleInput);
        await user.type(titleInput, "Long run");

        await selectComboboxOption(user, dialog, "Health", "Custom");
        await user.type(
          within(dialog).getByLabelText("Custom category label"),
          "Wellness"
        );

        await selectComboboxOption(user, dialog, "Recurring", "Milestones");
        const milestoneTargetInput = dialog.querySelector<HTMLInputElement>(
          "#target-count"
        );
        expect(milestoneTargetInput).toBeTruthy();
        fireEvent.change(milestoneTargetInput!, { target: { value: "2" } });

        await user.click(
          within(dialog).getByRole("button", { name: /advanced settings/i })
        );
        await user.click(
          within(dialog).getByRole("button", { name: /milestone names/i })
        );
        fireEvent.change(within(dialog).getByPlaceholderText("Milestone 1"), {
          target: { value: "Step one" },
        });

        await selectComboboxOption(user, dialog, "Milestones", "Recurring");
        await selectComboboxOption(user, dialog, "Daily", "Weekly");
        expect(within(dialog).getByText("Target per week")).toBeInTheDocument();

        const recurringTargetInput = dialog.querySelector<HTMLInputElement>(
          "#recurring-target-count"
        );
        expect(recurringTargetInput).toBeTruthy();
        fireEvent.change(recurringTargetInput!, { target: { value: "4" } });
        await user.click(
          within(dialog).getByRole("checkbox", {
            name: /total completion target instead of per-period/i,
          })
        );
        expect(
          within(dialog).getByText("Total target completions")
        ).toBeInTheDocument();
        await user.click(
          within(dialog).getByRole("checkbox", {
            name: /total completion target instead of per-period/i,
          })
        );
        await selectComboboxOption(user, dialog, "Weekly", "Monthly");
        expect(within(dialog).getByText("Target per month")).toBeInTheDocument();

        fireEvent.change(within(dialog).getByLabelText("Start date"), {
          target: { value: "2026-09-01" },
        });
        fireEvent.change(within(dialog).getByLabelText("End date (optional)"), {
          target: { value: "2026-12-31" },
        });
        fireEvent.change(within(dialog).getByLabelText("Default time of day"), {
          target: { value: "09:00" },
        });

        const difficultyTrigger = comboboxWithText(dialog, "Medium");
        expect(difficultyTrigger).toBeTruthy();
        await user.click(difficultyTrigger!);
        await user.click(await screen.findByRole("option", { name: "Hard" }));

        const privacyCheckbox = within(dialog).getByRole("checkbox", {
          name: /make this goal private/i,
        });
        await user.click(privacyCheckbox);
        expect(privacyCheckbox).toBeChecked();

        const linkTargetButton = within(dialog).getByRole("button", {
          name: "Select link target",
        });
        expect(linkTargetButton).toHaveTextContent("none");
        await user.click(linkTargetButton);
        expect(linkTargetButton).toHaveTextContent("goal-main");

        expect(comboboxWithText(dialog, "Recurring")).not.toBeDisabled();
        expect(comboboxWithText(dialog, "Monthly")).not.toBeDisabled();
        expect(within(dialog).getByLabelText("Start date")).not.toBeDisabled();
        expect(
          within(dialog).getByLabelText("End date (optional)")
        ).not.toBeDisabled();

        expect(within(dialog).queryByLabelText("Photo")).not.toBeInTheDocument();
        expect(
          within(dialog).queryByLabelText("Description")
        ).not.toBeInTheDocument();
        expect(
          within(dialog).queryByLabelText("Color accent")
        ).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText("Long run")).toBeInTheDocument();
      },
      15_000
      );
    }
  );

  it("lets users switch recurring period goals to lifetime and set a total target", async () => {
    const user = userEvent.setup();
    const periodDraft = makeDraft({
      sourceRowLabel: "Row 1",
      title: "Strength sessions",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "3",
      include: true,
    });
    render(
      <ReviewHarness
        variant="full"
        saving={false}
        onCreate={vi.fn()}
        initialDrafts={[periodDraft]}
      />
    );

    const dialog = await openFirstDraftEditor(user);
    await user.click(
      within(dialog).getByRole("button", { name: /advanced settings/i })
    );
    await user.click(
      within(dialog).getByRole("checkbox", {
        name: /total completion target instead of per-period/i,
      })
    );
    expect(
      within(dialog).getByText("Total target completions")
    ).toBeInTheDocument();

    const lifetimeTargetInput = dialog.querySelector<HTMLInputElement>(
      "#recurring-target-count"
    );
    expect(lifetimeTargetInput).toBeTruthy();
    fireEvent.change(lifetimeTargetInput!, { target: { value: "9" } });
    expect(lifetimeTargetInput).toHaveValue(9);
  });

  it("resets lifetime recurring targets to period defaults when toggled back", async () => {
    const user = userEvent.setup();
    const lifetimeDraft = makeDraft({
      sourceRowLabel: "Row 1",
      title: "Practice talks",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "lifetime",
      target_count: "12",
      include: true,
    });
    render(
      <ReviewHarness
        variant="full"
        saving={false}
        onCreate={vi.fn()}
        initialDrafts={[lifetimeDraft]}
      />
    );

    const dialog = await openFirstDraftEditor(user);
    await user.click(
      within(dialog).getByRole("button", { name: /advanced settings/i })
    );
    await user.click(
      within(dialog).getByRole("checkbox", {
        name: /total completion target instead of per-period/i,
      })
    );
    expect(within(dialog).getByText("Target per week")).toBeInTheDocument();
    const periodTargetInput = dialog.querySelector<HTMLInputElement>(
      "#recurring-target-count"
    );
    expect(periodTargetInput).toBeTruthy();
    expect(periodTargetInput).toHaveValue(1);
  });

  it("disables create only when selected drafts are invalid", async () => {
    const user = userEvent.setup();
    const validDraft = makeDraft({
      sourceRowLabel: "Row 1",
      title: "Valid goal",
      include: true,
    });
    const invalidDraft = makeDraft({
      id: "invalid",
      sourceRowLabel: "Row 2",
      title: "",
      include: true,
    });

    render(
      <ReviewHarness
        variant="coach"
        saving={false}
        onCreate={vi.fn()}
        initialDrafts={[validDraft, invalidDraft]}
      />
    );

    const createButton = screen.getByRole("button", {
      name: "Create selected goals",
    });
    expect(createButton).toBeDisabled();
    expect(screen.getByText("1 selected with errors")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Row 2" }));

    expect(createButton).not.toBeDisabled();
    expect(screen.getByText("0 selected with errors")).toBeInTheDocument();
  });

  it("shows drafts but blocks creation for an external guard", () => {
    render(
      <ReviewHarness
        variant="coach"
        saving={false}
        onCreate={vi.fn()}
        createDisabledMessage="Save or discard calendar edits first."
      />
    );

    expect(screen.getByText("Easy run")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create selected goals" })
    ).toBeDisabled();
    expect(
      screen.getByText("Save or discard calendar edits first.")
    ).toBeInTheDocument();
  });

  it("supports inclusion toggles, removal, warnings, and empty state messaging", async () => {
    const user = userEvent.setup();
    render(
      <ReviewHarness
        variant="full"
        saving={false}
        onCreate={vi.fn()}
        warnings={["One draft uses an inferred cadence."]}
        emptyMessage="Nothing left to review."
        initialDrafts={[makeDraft({ sourceRowLabel: "Row 1", include: true })]}
      />
    );

    expect(
      screen.getByText("One draft uses an inferred cadence.")
    ).toBeInTheDocument();

    const createButton = screen.getByRole("button", {
      name: "Create selected goals",
    });
    expect(createButton).not.toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "Row 1" }));
    expect(createButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(screen.getByText("Nothing left to review.")).toBeInTheDocument();
  });

});
