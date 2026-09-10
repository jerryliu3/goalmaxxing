import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerDndProvider } from "./calendar-dnd";
import { CalendarDayPreviewList } from "./calendar-day-preview-list";

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

describe("CalendarDayPreviewList", () => {
  afterEach(() => {
    cleanup();
  });
  it("keeps same-day completion markers to one line", () => {
    renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-15"
        entries={[]}
        completionFactMarkers={[
          {
            key: "completion-1",
            goalTitle: "Read",
            scheduledDate: "2026-08-15",
          },
        ]}
        mutationLoading={false}
        getEntryDisplayTitle={() => ""}
        getEntrySubtitle={() => null}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => true}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: null,
        })}
        onEntryOpen={vi.fn()}
        onToggleCompletion={vi.fn()}
        onEntryPointerStart={vi.fn()}
        onEntryPointerEnd={vi.fn()}
      />
    );

    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.queryByText("Marked done.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Read")).toBeInTheDocument();
  });

  it("hides the completion checkbox when the session cannot be marked done", () => {
    renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-20"
        entries={[
          {
            key: "goal-1:unit-1",
            originalGoalId: "goal-1",
            goalTitle: "Run",
            unitKey: "unit-1",
            label: null,
            classification: "future",
            creditState: "uncredited",
            activeGoal: { color: "#10b981", category: "health" },
            activeItem: { id: "item-1" },
            draftDiffKind: null,
            draftDiffFromDate: null,
            draftDiffToDate: null,
            draftGhost: false,
          },
        ]}
        completionFactMarkers={[]}
        mutationLoading={false}
        getEntryDisplayTitle={(entry) => entry.goalTitle ?? "Untitled"}
        getEntrySubtitle={() => null}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: "You can only mark planner sessions done for today or past dates.",
        })}
        onEntryOpen={vi.fn()}
        onToggleCompletion={vi.fn()}
        onEntryPointerStart={vi.fn()}
        onEntryPointerEnd={vi.fn()}
      />
    );

    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
  });

  it("hides the completion checkbox while a session is in the plan draft", () => {
    renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-12"
        entries={[
          {
            key: "goal-1:unit-1",
            originalGoalId: "goal-1",
            goalTitle: "Run",
            unitKey: "unit-1",
            label: null,
            classification: "open",
            creditState: "uncredited",
            activeGoal: { color: "#10b981", category: "health" },
            activeItem: { id: "item-1" },
            draftDiffKind: "moved_to",
            draftDiffFromDate: "2026-08-20",
            draftDiffToDate: "2026-08-12",
            draftGhost: false,
          },
        ]}
        completionFactMarkers={[]}
        mutationLoading={false}
        getEntryDisplayTitle={(entry) => entry.goalTitle ?? "Untitled"}
        getEntrySubtitle={() => null}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: null,
        })}
        onEntryOpen={vi.fn()}
        onToggleCompletion={vi.fn()}
        onEntryPointerStart={vi.fn()}
        onEntryPointerEnd={vi.fn()}
      />
    );

    expect(screen.getByText("Run")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
  });

  it("lets a checklist row confirm or cancel a staged draft move", () => {
    const onConfirmDraftMove = vi.fn();
    const onCancelDraftMove = vi.fn();
    renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-12"
        entries={[
          {
            key: "goal-1:unit-1",
            originalGoalId: "goal-1",
            goalTitle: "Run",
            unitKey: "unit-1",
            label: null,
            classification: "open",
            creditState: "uncredited",
            activeGoal: { color: "#10b981", category: "health" },
            activeItem: { id: "item-1" },
            draftDiffKind: "moved_to",
            draftDiffFromDate: "2026-08-20",
            draftDiffToDate: "2026-08-12",
            draftGhost: false,
          },
        ]}
        completionFactMarkers={[]}
        mutationLoading={false}
        getEntryDisplayTitle={(entry) => entry.goalTitle ?? "Untitled"}
        getEntrySubtitle={() => null}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: null,
        })}
        onEntryOpen={vi.fn()}
        onToggleCompletion={vi.fn()}
        onEntryPointerStart={vi.fn()}
        onEntryPointerEnd={vi.fn()}
        density="expanded"
        onConfirmDraftMove={onConfirmDraftMove}
        onCancelDraftMove={onCancelDraftMove}
      />
    );

    const movedFrom = screen.getByText("Moved from 2026-08-20.");
    expect(movedFrom).not.toHaveClass("uppercase");
    expect(movedFrom.closest("[data-plan-work-row]")).toHaveClass("rounded-[10px]");

    const confirm = screen.getByRole("button", {
      name: "Confirm moving Run to this day",
    });
    const cancel = screen.getByRole("button", {
      name: "Cancel moving Run to this day",
    });
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    cancel.click();
    expect(onCancelDraftMove).toHaveBeenCalledWith(
      expect.objectContaining({ key: "goal-1:unit-1" }),
      "2026-08-12"
    );
    confirm.click();
    expect(onConfirmDraftMove).toHaveBeenCalledWith(
      expect.objectContaining({ key: "goal-1:unit-1" }),
      "2026-08-12"
    );
  });

  it("lets a source checklist row confirm or cancel a staged draft move", () => {
    const onConfirmDraftMove = vi.fn();
    const onCancelDraftMove = vi.fn();
    renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-20"
        entries={[
          {
            key: "goal-1:unit-1:ghost:2026-08-20",
            originalGoalId: "goal-1",
            goalTitle: "Run",
            unitKey: "unit-1",
            label: null,
            classification: "open",
            creditState: "uncredited",
            activeGoal: { color: "#10b981", category: "health" },
            activeItem: { id: "item-1" },
            draftDiffKind: "moved_from",
            draftDiffFromDate: "2026-08-20",
            draftDiffToDate: "2026-08-12",
            draftGhost: true,
          },
        ]}
        completionFactMarkers={[]}
        mutationLoading={false}
        getEntryDisplayTitle={(entry) => entry.goalTitle ?? "Untitled"}
        getEntrySubtitle={() => null}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => true}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: null,
        })}
        onEntryOpen={vi.fn()}
        onToggleCompletion={vi.fn()}
        onEntryPointerStart={vi.fn()}
        onEntryPointerEnd={vi.fn()}
        density="expanded"
        onConfirmDraftMove={onConfirmDraftMove}
        onCancelDraftMove={onCancelDraftMove}
      />
    );

    const movedTo = screen.getByText("Moved to 2026-08-12.");
    expect(movedTo).not.toHaveClass("uppercase");
    expect(movedTo.closest("[data-plan-work-row]")).toHaveClass("rounded-[10px]");

    screen.getByRole("button", {
      name: "Cancel moving Run from this day",
    }).click();
    expect(onCancelDraftMove).toHaveBeenCalledWith(
      expect.objectContaining({ key: "goal-1:unit-1:ghost:2026-08-20" }),
      "2026-08-20"
    );
    screen.getByRole("button", {
      name: "Confirm moving Run from this day",
    }).click();
    expect(onConfirmDraftMove).toHaveBeenCalledWith(
      expect.objectContaining({ key: "goal-1:unit-1:ghost:2026-08-20" }),
      "2026-08-20"
    );
  });
});
