import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultGoalCreationFields } from "@/lib/goals/creation-model";
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
    reward?: string;
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
      disabled={false}
      prefilled={options.prefilled}
      reward={options.reward}
      linkTarget={linkTarget}
      action={<button type="submit">Create goal</button>}
    />,
  );
  return { onPatch };
}

const weekly = {
  category_selection: "career",
  color: "#6366f1",
  difficulty: "hard",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_basis: "period",
  target_count: "3",
  start_date: "2026-01-01",
  end_date: "",
} as const;

function previewScene() {
  const scene = document.querySelector(".tempo-preview .card-scene");
  if (!scene) throw new Error("No preview card scene");
  return scene;
}

describe("TempoGoalFields creation flow", () => {
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

  it("shows an adjustable plaque target on review above create", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /06Review/ }));

    expect(
      await screen.findByText(
        /Your target before earning this achievement plaque will be/i,
      ),
    ).toBeVisible();
    const input = screen.getByLabelText("Plaque completion target");
    expect(input).toHaveAttribute("type", "number");
    expect(Number((input as HTMLInputElement).value)).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Create goal" })).toBeVisible();

    fireEvent.change(input, { target: { value: "9" } });
    expect(input).toHaveValue(9);
  });

  it("turns the card over on the reward step, with the reward up front and advanced settings on the back", async () => {
    const { onPatch } = renderCreation({ prefilled: true, reward: "", fields: weekly });
    fireEvent.click(screen.getByRole("button", { name: /04Schedule/ }));
    expect(previewScene()).toHaveAttribute("data-back", "false");

    fireEvent.click(screen.getByRole("button", { name: /05Reward/ }));
    expect(await screen.findByRole("heading", { name: /What’s waiting at the finish line/ })).toBeInTheDocument();
    expect(previewScene()).toHaveAttribute("data-back", "true");
    expect(screen.getByText("Advanced settings")).toBeVisible();
    expect(screen.getByText(/Advanced settings are on the back of the card/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Why it matters/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Card colour/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Also counts toward/ })).toBeVisible();
    // The plaque target is set on review and milestone names in the rhythm step.
    expect(screen.queryByRole("button", { name: /Earn achievement after/ })).toBeNull();
    // Unset advanced settings read "Optional" instead of their defaults.
    // (The fixture's colour is custom, so that row names it.)
    for (const label of [/Why it matters/, /Also counts toward/]) {
      expect(screen.getByRole("button", { name: label })).toHaveTextContent("Optional");
    }

    fireEvent.change(screen.getByRole("textbox", { name: /^Your reward/ }), { target: { value: "New running shoes" } });
    expect(onPatch).toHaveBeenCalledWith({ reward_text: "New running shoes" });
    fireEvent.click(screen.getByRole("button", { name: "A weekend away" }));
    expect(onPatch).toHaveBeenCalledWith({ reward_text: "A weekend away" });
  });

  it("turns the card back to its face when leaving the reward step", async () => {
    renderCreation({ prefilled: true, reward: "", fields: weekly });
    fireEvent.click(screen.getByRole("button", { name: /05Reward/ }));
    expect(previewScene()).toHaveAttribute("data-back", "true");

    fireEvent.click(screen.getByRole("button", { name: /04Schedule/ }));
    expect(previewScene()).toHaveAttribute("data-back", "false");
  });

  it("keeps only the advanced settings when the caller can't save a reward", async () => {
    renderCreation({ prefilled: true, fields: weekly });
    fireEvent.click(screen.getByRole("button", { name: /05Reward/ }));

    expect(await screen.findByRole("heading", { name: "A few more settings." })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /^Your reward/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Why it matters/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Your reward/ })).toBeNull();
  });

  it("sets an optional finish date and time of day on the schedule step", async () => {
    const { onPatch } = renderCreation({ prefilled: true, fields: weekly });
    fireEvent.click(screen.getByRole("button", { name: /04Schedule/ }));

    const finish = await screen.findByRole("group", { name: "Finish by" });
    expect(within(finish).getByRole("button", { name: "Keep it open" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByLabelText("Finish date")).toBeNull();
    fireEvent.click(within(finish).getByRole("button", { name: "Pick a date" }));
    fireEvent.change(screen.getByLabelText("Finish date"), { target: { value: "2026-03-01" } });
    expect(onPatch).toHaveBeenCalledWith({ end_date: "2026-03-01" });
    fireEvent.click(within(finish).getByRole("button", { name: "Keep it open" }));
    expect(onPatch).toHaveBeenCalledWith({ end_date: "" });

    const time = screen.getByRole("group", { name: "Time of day" });
    fireEvent.click(within(time).getByRole("button", { name: "Set a time" }));
    fireEvent.change(screen.getByLabelText("Usual time"), { target: { value: "07:30" } });
    expect(onPatch).toHaveBeenCalledWith({ default_local_time: "07:30" });
  });

  it("chooses who can see the goal on the schedule step", async () => {
    const { onPatch } = renderCreation({ prefilled: true, fields: weekly });
    fireEvent.click(screen.getByRole("button", { name: /04Schedule/ }));
    const visibility = await screen.findByRole("group", { name: "Who can see this goal" });
    expect(within(visibility).getByRole("button", { name: "Visible to friends" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(visibility).getByRole("button", { name: "Private" }));
    expect(onPatch).toHaveBeenCalledWith({ is_private: true });
  });
});
