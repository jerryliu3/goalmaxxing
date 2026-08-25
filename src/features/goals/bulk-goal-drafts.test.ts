import { describe, expect, it, vi } from "vitest";
import { createDefaultGoalCreationFields } from "@/features/goals/goal-creation-model";
import { buildStarterPackRows } from "@/features/goals/starter-packs";
import {
  buildBulkGoalDraftFromRow,
  buildBulkGoalDraftsFromLlmGoals,
  prepareBulkGoalRows,
  summarizeBulkGoalDraftSchedule,
  validateBulkGoalDraft,
  withValidatedBulkGoalDraft,
  type BulkGoalDraft,
} from "@/features/goals/bulk-goal-drafts";

function bulkDraft(overrides: Partial<BulkGoalDraft> = {}): BulkGoalDraft {
  return withValidatedBulkGoalDraft({
    ...createDefaultGoalCreationFields(),
    id: "draft-1",
    sourceRowLabel: "Row 1",
    include: true,
    title: "Sample goal",
    start_date: "2026-08-17",
    link_target_search: "",
    link_target_open: false,
    advanced_open: false,
    photo_file: null,
    ...overrides,
  });
}

describe("bulk goal drafts", () => {
  it("normalizes parser goals through the canonical draft model", () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Easy run",
        category: "Health",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: 4,
        start_date: "2026-08-17",
        end_date: "2026-09-13",
        default_local_time: "07:30",
      },
    ]);

    expect(draft).toMatchObject({
      include: true,
      title: "Easy run",
      category_selection: "health",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: "4",
      start_date: "2026-08-17",
      end_date: "2026-09-13",
      default_local_time: "07:30",
      errors: [],
    });
  });

  it("supplies canonical milestone defaults for fixed goals", () => {
    const draft = buildBulkGoalDraftFromRow(
      {
        title: "Ship launch plan",
        frequency_type: "fixed",
        target_count: "2",
        start_date: "2026-08-17",
        end_date: "2026-09-13",
      },
      0
    );

    expect(draft.milestone_names).toEqual(["", ""]);
    expect(draft.errors).toEqual([]);
  });

  it("maps milestone arrays from parser output without delimiter loss", () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "5k training block",
        frequency_type: "fixed_milestones",
        target_count: 3,
        start_date: "2026-08-17",
        end_date: "2026-09-13",
        milestone_names: [
          "Easy run 3 mi",
          "Tempo 4x800 | controlled",
          "Long run 6 mi",
        ],
      },
    ]);

    expect(draft.milestone_names).toEqual([
      "Easy run 3 mi",
      "Tempo 4x800 | controlled",
      "Long run 6 mi",
    ]);
    expect(draft.errors).toEqual([]);
  });

  it("normalizes milestone arrays to target count by trimming or padding", () => {
    const [trimmedDraft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Trimmed milestones",
        frequency_type: "fixed_milestones",
        target_count: 2,
        start_date: "2026-08-17",
        end_date: "2026-09-13",
        milestone_names: ["One", "Two", "Three"],
      },
    ]);
    const [paddedDraft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Padded milestones",
        frequency_type: "fixed_milestones",
        target_count: 3,
        start_date: "2026-08-17",
        end_date: "2026-09-13",
        milestone_names: ["One", "Two"],
      },
    ]);

    expect(trimmedDraft.milestone_names).toEqual(["One", "Two"]);
    expect(paddedDraft.milestone_names).toEqual(["One", "Two", ""]);
  });

  it("derives fixed milestone target count from names when parser omits it", () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Progressive running block",
        frequency_type: "fixed_milestones",
        start_date: "2026-08-17",
        end_date: "2026-09-13",
        milestone_names: ["Easy run", "Tempo run", "Long run", "Recovery run"],
      },
    ]);

    expect(draft.target_count).toBe("4");
    expect(draft.milestone_names).toEqual([
      "Easy run",
      "Tempo run",
      "Long run",
      "Recovery run",
    ]);
  });

  it("formats the schedule summary used by both review surfaces", () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Easy run",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
        end_date: "2026-09-13",
      },
    ]);

    expect(summarizeBulkGoalDraftSchedule(draft)).toBe(
      "Weekly · Aug 17 – Sep 13"
    );
  });

  it("keeps schedule summaries renderable while dates are being edited", () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: "Easy run",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
      },
    ]);

    expect(
      summarizeBulkGoalDraftSchedule({ ...draft, start_date: "" })
    ).toBe("Weekly · Start date required");
  });

  it("rejects lifetime drafts with empty targets and over-max period targets", () => {
    const lifetimeEmpty = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "lifetime",
      target_count: "",
    });
    expect(lifetimeEmpty.errors).toContain(
      "Total target completions requires a positive target."
    );

    const weeklyOverMax = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "8",
    });
    expect(weeklyOverMax.errors).toContain(
      "Target cannot exceed 7 completions for this period length."
    );

    const monthlyOverMax = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "monthly",
      target_basis: "period",
      target_count: "32",
    });
    expect(monthlyOverMax.errors).toContain(
      "Target cannot exceed 31 completions for this period length."
    );

    const dailyOverMax = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_basis: "period",
      target_count: "2",
    });
    expect(dailyOverMax.errors).toContain(
      "Target cannot exceed 1 completions for this period length."
    );

    const invalidLifetime = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_basis: "lifetime",
      target_count: "0",
    });
    expect(invalidLifetime.errors).toContain(
      "Total target completions must be at least 1 when provided."
    );
  });

  it("accepts max period targets and rejects invalid fractional targets once", () => {
    const weeklyMax = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "7",
    });
    expect(weeklyMax.errors).toEqual([]);

    const monthlyMax = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "monthly",
      target_basis: "period",
      target_count: "31",
    });
    expect(monthlyMax.errors).toEqual([]);

    const fractional = bulkDraft({
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_basis: "period",
      target_count: "1.5",
    });
    expect(fractional.errors).toContain(
      "Per-period target must be a positive whole number."
    );
  });

  it("prepares normalized target basis and counts for every draft shape", () => {
    const createId = vi.fn(() => "11111111-1111-4111-8111-111111111111");
    const cases = [
      {
        name: "daily period empty target",
        draft: bulkDraft({
          frequency_type: "recurring",
          recurrence_interval: "daily",
          target_basis: "period",
          target_count: "",
        }),
        row: {
          target_count: 1,
          target_basis: "period",
          milestone_names: null,
        },
      },
      {
        name: "weekly period empty target",
        draft: bulkDraft({
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: "",
        }),
        row: {
          target_count: 1,
          target_basis: "period",
          milestone_names: null,
        },
      },
      {
        name: "weekly period explicit target",
        draft: bulkDraft({
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "period",
          target_count: "4",
        }),
        row: {
          target_count: 4,
          target_basis: "period",
          milestone_names: null,
        },
      },
      {
        name: "monthly period max target",
        draft: bulkDraft({
          frequency_type: "recurring",
          recurrence_interval: "monthly",
          target_basis: "period",
          target_count: "31",
        }),
        row: {
          target_count: 31,
          target_basis: "period",
          milestone_names: null,
        },
      },
      {
        name: "lifetime recurring target",
        draft: bulkDraft({
          frequency_type: "recurring",
          recurrence_interval: "weekly",
          target_basis: "lifetime",
          target_count: "12",
        }),
        row: {
          target_count: 12,
          target_basis: "lifetime",
          milestone_names: null,
        },
      },
      {
        name: "fixed milestones with normalized names",
        draft: bulkDraft({
          frequency_type: "fixed_milestones",
          target_basis: "lifetime",
          target_count: "2",
          milestone_names: ["Alpha", ""],
        }),
        row: {
          target_count: 2,
          target_basis: "lifetime",
          milestone_names: ["Alpha", "Milestone 2"],
        },
      },
    ] as const;

    for (const testCase of cases) {
      const [prepared] = prepareBulkGoalRows([testCase.draft], { createId });
      expect(prepared.row, testCase.name).toMatchObject(testCase.row);
    }
  });

  it("preserves explicit lifetime starter-pack rows through prepareBulkGoalRows", () => {
    const starterRow = buildStarterPackRows("relationships", "2026-08-01").find(
      (row) => row.title === "Weekly partner check-in"
    );
    expect(starterRow).toMatchObject({
      target_basis: "lifetime",
      target_count: "10",
    });

    const draft = buildBulkGoalDraftFromRow(starterRow!, 0);
    const [prepared] = prepareBulkGoalRows([draft], {
      createId: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
    });

    expect(prepared.row).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Weekly partner check-in",
      description:
        "Set intentional check-ins to align on goals and support.",
      category_key: "relationships",
      category: "Relationships",
      color: "#f43f5e",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 10,
      target_basis: "lifetime",
      milestone_names: null,
      start_date: "2026-08-01",
      end_date: "2026-10-30",
      default_local_time: null,
    });
  });

  it("normalizes omitted period targets to 1 through prepareBulkGoalRows", () => {
    const draft = buildBulkGoalDraftFromRow(
      {
        title: "Weekly planning reset",
        category: "Personal",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        start_date: "2026-08-17",
        end_date: "2026-10-26",
      },
      0
    );

    expect(draft).toMatchObject({
      target_basis: "period",
      target_count: "",
    });

    const [prepared] = prepareBulkGoalRows([draft], {
      createId: vi.fn(() => "22222222-2222-4222-8222-222222222222"),
    });

    expect(prepared.row).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      title: "Weekly planning reset",
      description: null,
      category_key: "personal",
      category: "Personal",
      color: "#6366f1",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 1,
      target_basis: "period",
      milestone_names: null,
      start_date: "2026-08-17",
      end_date: "2026-10-26",
      default_local_time: null,
    });
  });

  it("prepares the existing create_goals row shape", () => {
    const [draft] = buildBulkGoalDraftsFromLlmGoals([
      {
        title: " Easy run ",
        description: " Base building ",
        category: "Health",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: 4,
        start_date: "2026-08-17",
        end_date: "2026-09-13",
      },
    ]);

    const [prepared] = prepareBulkGoalRows([draft], {
      createId: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
    });

    expect(prepared).toEqual({
      draft,
      goalId: "11111111-1111-4111-8111-111111111111",
      row: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Easy run",
        description: "Base building",
        category_key: "health",
        category: "Health",
        color: "#10b981",
        frequency_type: "recurring",
        recurrence_interval: "weekly",
        target_count: 4,
        target_basis: "period",
        milestone_names: null,
        start_date: "2026-08-17",
        end_date: "2026-09-13",
        default_local_time: null,
      },
    });
  });
});
