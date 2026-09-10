import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerDndProvider } from "@/features/planner/calendar-dnd";
import { PlannerFocusedDayPane } from "@/features/planner/planner-focused-day-pane";
import type { PlanDayChecklistModel } from "@/features/planner/use-plan-day-checklist-model";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

function renderWithDnd(ui: ReactNode) {
  return render(
    <PlannerDndProvider
      getEntryLabel={(entryKey) => entryKey}
      getDayLabel={(day) => day}
      onEntryDragStart={() => {}}
      onEntryDragEnd={() => {}}
      onEntryDragCancel={() => {}}
    >
      {ui}
    </PlannerDndProvider>
  );
}

const sampleEntry = {
  key: "goal-1:cadence:0",
  originalGoalId: "goal-1",
  goalTitle: "Run",
  unitKey: "cadence:0",
  label: "Easy run",
  classification: "open",
  creditState: "uncredited",
  activeGoal: { color: "#22c55e" },
  activeItem: { id: "item-1" },
  draftDiffKind: null,
  draftDiffFromDate: null,
  draftDiffToDate: null,
  draftGhost: false,
} as const;

describe("PlannerFocusedDayPane", () => {
  afterEach(() => {
    cleanup();
  });

  it("splits Duo day checklists on large screens while keeping partner chips on small", () => {
    renderWithDnd(
      <PlannerFocusedDayPane
        day="2026-08-06"
        entries={[sampleEntry as never]}
        completionFactMarkers={[
          {
            key: "partner-marker",
            originalGoalId: "partner-goal",
            unitKey: "partner-fact",
            goalTitle: "Partner stretch",
            scheduledDate: "2026-08-06",
            owner: "partner",
          },
        ]}
        mutationLoading={false}
        asOfDate="2026-08-06"
        canMutatePlanItems
        canMutateEntryOnDay={() => true}
        onEntryOpen={() => {}}
        onToggleCompletion={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
        showTasksInsteadOfGoals
        partnerLabel="Alex"
        viewerSubject={{
          id: "viewer",
          label: "Alice",
          userId: "viewer-1",
          readOnly: false,
        }}
        partnerSubject={{
          id: "partner",
          label: "Alex",
          userId: "partner-1",
          readOnly: true,
        }}
        splitPartnerChecklist
      />
    );

    expect(screen.getByTestId("plan-day-viewer-checklist")).toBeInTheDocument();
    expect(screen.getByTestId("plan-day-partner-checklist")).toHaveClass("hidden");
    expect(screen.getByTestId("plan-day-partner-checklist")).toHaveClass("md:block");
    expect(screen.getAllByText("Partner stretch")).toHaveLength(2);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Alice profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Alex profile" })).toBeInTheDocument();
    expect(screen.getByText("View only")).toBeInTheDocument();
  });

  it("keeps scheduled sessions visible when checklist filters hide the goal", () => {
    const dayChecklist = {
      ready: true,
      loading: false,
      visibleGoalIds: new Set<string>(),
      listModel: {
        presentationByGoalId: new Map(),
        upcoming: [],
        pastGoals: [],
        archivedGoals: [],
      },
      filters: {
        showUpcomingGoals: false,
        showEndedGoals: false,
        showArchivedGoals: false,
        upcomingOpen: false,
        pastPanelOpen: false,
        archiveOpen: false,
        setUpcomingOpen: () => {},
        setPastPanelOpen: () => {},
        setArchiveOpen: () => {},
      },
      savingGoalId: null,
      toggleCompletion: async () => {},
    } as unknown as PlanDayChecklistModel;

    renderWithDnd(
      <PlannerFocusedDayPane
        day="2026-08-06"
        entries={[sampleEntry as never]}
        completionFactMarkers={[]}
        mutationLoading={false}
        asOfDate="2026-08-06"
        canMutatePlanItems
        canMutateEntryOnDay={() => true}
        onEntryOpen={() => {}}
        onToggleCompletion={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
        dayChecklist={dayChecklist}
      />
    );

    expect(screen.getByText("Run")).toBeInTheDocument();
  });

  it("shows unscheduled and scheduled section counts while those sections stay collapsed", () => {
    const walk = {
      id: "goal-walk",
      title: "Walk",
      owner_id: "user-1",
      description: null,
      category: "Health",
      category_key: "health",
      color: null,
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_count: null,
      target_basis: "period",
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const dayChecklist = {
      ready: true,
      loading: false,
      visibleGoalIds: null,
      data: { goals: [walk] },
      listModel: {
        completableGoals: [walk],
        presentationByGoalId: new Map(),
        upcoming: [],
        pastGoals: [],
        archivedGoals: [],
      },
      filters: {
        showUpcomingGoals: false,
        showEndedGoals: false,
        showArchivedGoals: false,
        upcomingOpen: false,
        pastPanelOpen: false,
        archiveOpen: false,
        setUpcomingOpen: () => {},
        setPastPanelOpen: () => {},
        setArchiveOpen: () => {},
      },
      savingGoalId: null,
      toggleCompletion: async () => {},
    } as unknown as PlanDayChecklistModel;

    renderWithDnd(
      <PlannerFocusedDayPane
        day="2026-08-06"
        entries={[sampleEntry as never]}
        completionFactMarkers={[]}
        mutationLoading={false}
        asOfDate="2026-08-06"
        canMutatePlanItems
        canMutateEntryOnDay={() => true}
        onEntryOpen={() => {}}
        onToggleCompletion={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
        dayChecklist={dayChecklist}
      />
    );

    expect(screen.getByRole("button", { name: /Scheduled goals 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Unscheduled goals 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("hides the redundant day heading when the date picker already names the day", () => {
    renderWithDnd(
      <PlannerFocusedDayPane
        day="2026-08-06"
        entries={[sampleEntry as never]}
        completionFactMarkers={[]}
        mutationLoading={false}
        asOfDate="2026-08-06"
        canMutatePlanItems
        canMutateEntryOnDay={() => true}
        onEntryOpen={() => {}}
        onToggleCompletion={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
        showDayHeading={false}
      />
    );

    expect(screen.queryByText("Day", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Thursday, Aug 6")).not.toBeInTheDocument();
    expect(screen.getByText("Run")).toBeInTheDocument();
  });

  it("keeps the day heading on week and month side panes", () => {
    renderWithDnd(
      <PlannerFocusedDayPane
        day="2026-08-06"
        entries={[sampleEntry as never]}
        completionFactMarkers={[]}
        mutationLoading={false}
        asOfDate="2026-08-06"
        canMutatePlanItems
        canMutateEntryOnDay={() => true}
        onEntryOpen={() => {}}
        onToggleCompletion={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
      />
    );

    expect(screen.getByText("Day")).toBeInTheDocument();
    expect(screen.getByText("Thursday, Aug 6")).toBeInTheDocument();
  });
});
