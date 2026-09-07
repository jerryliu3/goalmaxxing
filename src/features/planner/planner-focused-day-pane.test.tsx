import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PlannerDndProvider } from "@/features/planner/calendar-dnd";
import { PlannerFocusedDayPane } from "@/features/planner/planner-focused-day-pane";

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
        splitPartnerChecklist
      />
    );

    expect(screen.getByTestId("plan-day-viewer-checklist")).toBeInTheDocument();
    expect(screen.getByTestId("plan-day-partner-checklist")).toHaveClass("hidden");
    expect(screen.getByTestId("plan-day-partner-checklist")).toHaveClass("md:block");
    expect(screen.getAllByText("Partner stretch")).toHaveLength(2);
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("View only")).toBeInTheDocument();
  });
});
