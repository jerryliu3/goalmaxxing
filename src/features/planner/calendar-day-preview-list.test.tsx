import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
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
});
