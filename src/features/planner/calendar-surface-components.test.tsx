import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { PlannerDndProvider } from "./calendar-dnd";
import { CalendarDayPreviewList } from "./calendar-day-preview-list";
import { CalendarMonthDayCell } from "./calendar-month-day-cell";
import { CalendarPartnerChip } from "./calendar-partner-chip";
import { mixOpaqueHex, WORK_PILL_HUE_AMOUNT } from "./goal-visuals";

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
  activeGoal: {
    color: "#22c55e",
  },
  activeItem: {
    id: "item-1",
  },
  draftDiffKind: null,
  draftDiffFromDate: null,
  draftDiffToDate: null,
  draftGhost: false,
};

const sampleMarker = {
  key: "marker-1",
  goalTitle: "Stretch",
  scheduledDate: "2026-08-05",
};

describe("calendar surface extracted components", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  it("renders month day cell and delegates click behavior", async () => {
    const onCellClick = vi.fn();
    const onCellPointerDown = vi.fn();
    const onEntryPointerStart = vi.fn();
    const onEntryClick = vi.fn();
    const user = userEvent.setup();

    renderWithDnd(
      <CalendarMonthDayCell
        day="2026-08-06"
        inMonth
        isToday={false}
        isPastInMonth={false}
        ariaLabel="Thursday, August 6, 2026. 1 planned item."
        entriesForDay={[sampleEntry]}
        completionFactMarkersForDay={[sampleMarker]}
        isAnyEntryDragging={false}
        getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        onEntryClick={onEntryClick}
        onCellClick={onCellClick}
        onCellDoubleClick={() => {}}
        onCellMouseEnter={() => {}}
        onCellMouseLeave={() => {}}
        onCellPointerDown={onCellPointerDown}
        onCellPointerUp={() => {}}
        onCellPointerCancel={() => {}}
        onCellPointerLeave={() => {}}
        onEntryPointerStart={onEntryPointerStart}
        onEntryPointerEnd={() => {}}
      />
    );

    expect(screen.getByText("Easy run")).toBeInTheDocument();
    expect(screen.getByText("Easy run").closest("[data-calendar-day-entry]")).toHaveStyle({
      backgroundColor: mixOpaqueHex("#22c55e", "#ffffff", WORK_PILL_HUE_AMOUNT),
    });
    expect(screen.getByText("Stretch")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /thursday, august 6/i })
    ).toHaveStyle({ viewTransitionName: "plan-day-2026-08-06" });
    expect(
      screen.queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /thursday, august 6/i })).not.toHaveAttribute(
      "data-onboarding"
    );

    await user.click(screen.getByRole("button", { name: /thursday, august 6/i }));
    expect(onCellClick).toHaveBeenCalledTimes(1);
    onCellPointerDown.mockClear();

    await user.pointer({
      target: screen.getByText("Easy run"),
      keys: "[MouseLeft>]",
    });
    expect(onEntryPointerStart).toHaveBeenCalledWith(false);
    expect(onCellPointerDown).not.toHaveBeenCalled();
    await user.click(screen.getByText("Easy run"));
    expect(onEntryClick).toHaveBeenCalledWith(
      "2026-08-06",
      sampleEntry,
      expect.any(HTMLElement)
    );
  });

  it("contrasts adjacent months, today, and the selected day", () => {
    const cellProps = {
      entriesForDay: [] as typeof sampleEntry[],
      completionFactMarkersForDay: [] as typeof sampleMarker[],
      isAnyEntryDragging: false,
      getEntryDisplayTitle: (entry: typeof sampleEntry) => entry.label ?? "Untitled",
      isEntryCredited: () => false,
      isEntryImmovableForDraft: () => false,
      onEntryClick: () => {},
      onCellClick: () => {},
      onCellDoubleClick: () => {},
      onCellMouseEnter: () => {},
      onCellMouseLeave: () => {},
      onCellPointerDown: () => {},
      onCellPointerUp: () => {},
      onCellPointerCancel: () => {},
      onCellPointerLeave: () => {},
      onEntryPointerStart: () => {},
      onEntryPointerEnd: () => {},
    };

    renderWithDnd(
      <>
        <CalendarMonthDayCell
          day="2026-07-30"
          inMonth={false}
          isToday={false}
          isPastInMonth={false}
          ariaLabel="Thursday, July 30, 2026."
          {...cellProps}
        />
        <CalendarMonthDayCell
          day="2026-08-06"
          inMonth
          isToday
          isPastInMonth={false}
          ariaLabel="Thursday, August 6, 2026."
          {...cellProps}
        />
        <CalendarMonthDayCell
          day="2026-08-07"
          inMonth
          isToday={false}
          isPastInMonth={false}
          isSelected
          ariaLabel="Friday, August 7, 2026."
          {...cellProps}
        />
        <CalendarMonthDayCell
          day="2026-09-06"
          inMonth={false}
          isToday
          isPastInMonth={false}
          ariaLabel="Sunday, September 6, 2026."
          {...cellProps}
        />
      </>
    );

    expect(screen.getByRole("button", { name: /july 30/i })).toHaveClass("bg-adjacent");
    const todayCell = screen.getByRole("button", { name: /august 6/i });
    expect(todayCell).toHaveClass("bg-today");
    expect(todayCell).toHaveClass("text-today-foreground");
    const selectedCell = screen.getByRole("button", { name: /august 7/i });
    expect(selectedCell.className).toMatch(/ring-selection/);
    expect(selectedCell).not.toHaveClass("bg-day-selected");
    expect(selectedCell).not.toHaveClass("bg-today");
    expect(selectedCell).not.toHaveClass("bg-adjacent");
    const adjacentToday = screen.getByRole("button", { name: /september 6/i });
    expect(adjacentToday).toHaveClass("bg-today");
    expect(adjacentToday).not.toHaveClass("bg-adjacent");
  });

  it("renders preview list and supports opening and completion toggle", async () => {
    const onEntryOpen = vi.fn();
    const onToggleCompletion = vi.fn();
    const user = userEvent.setup();

    const view = renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-06"
        entries={[sampleEntry]}
        completionFactMarkers={[]}
        mutationLoadingKey={null}
        getEntryDisplayTitle={(entry) => entry.goalTitle ?? "Untitled"}
        getEntrySubtitle={(entry) => entry.label}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: null,
        })}
        onEntryOpen={onEntryOpen}
        onToggleCompletion={onToggleCompletion}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
      />
    );

    const toggle = within(view.container).getByRole("button", {
      name: "Mark session done",
    });
    expect(toggle.parentElement?.firstElementChild).toBe(toggle);
    expect(toggle).toHaveClass("size-6");
    expect(toggle.querySelector("[data-completion-mark]")).toHaveClass("size-6");
    expect(toggle.closest("[data-plan-drag-handle]")).toBeNull();
    expect(screen.getByText("Run").closest("[data-plan-drag-handle]")).not.toBeNull();

    vi.useFakeTimers();
    fireEvent.pointerDown(toggle);
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onToggleCompletion).toHaveBeenCalledTimes(1);
    expect(onEntryOpen).not.toHaveBeenCalled();
    vi.useRealTimers();

    fireEvent.click(toggle, { detail: 1 });
    expect(onEntryOpen).not.toHaveBeenCalled();
    expect(onToggleCompletion).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText("Run"));
    expect(onEntryOpen).toHaveBeenCalledWith(sampleEntry.key);
  });

  it("renders expanded day rows as a hairline ledger instead of filled pills", () => {
    const onEntryPointerStart = vi.fn();
    const onEntryOpen = vi.fn();
    renderWithDnd(
      <CalendarDayPreviewList
        day="2026-08-06"
        entries={[sampleEntry]}
        completionFactMarkers={[]}
        mutationLoadingKey={null}
        getEntryDisplayTitle={(entry) => entry.goalTitle ?? "Untitled"}
        getEntrySubtitle={(entry) => entry.label}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        getCompletionToggleState={() => ({
          currentlyCredited: false,
          disabledReasonCopy: null,
        })}
        onEntryOpen={onEntryOpen}
        onToggleCompletion={() => {}}
        onEntryPointerStart={onEntryPointerStart}
        onEntryPointerEnd={() => {}}
        density="expanded"
        selectedEntryKey={sampleEntry.key}
      />
    );

    const row = document.querySelector('[data-plan-work-row="ledger"]');
    expect(row).toBeInstanceOf(HTMLElement);
    expect(row).toHaveAttribute("aria-current", "true");
    expect(row).toHaveClass("bg-day-selected");
    expect(row).not.toHaveClass("text-day-selected-foreground");
    expect(row).not.toHaveClass("rounded-[10px]");
    expect(screen.getByText("Run").closest("[data-plan-drag-handle]")).toHaveClass("py-3");
    expect(screen.getByText("Run").closest("p")).toHaveClass("font-display");
    expect(screen.getByText("Easy run")).toHaveClass("text-sm");
    expect(screen.getByText("Easy run")).toHaveClass("font-sans");
    expect(screen.getByText("Easy run")).not.toHaveClass("uppercase");
    const toggle = screen.getByRole("button", { name: "Mark session done" });
    expect(toggle).toHaveClass("size-6");
    expect(toggle.querySelector("[data-completion-mark]")).toHaveClass("size-6");
    expect(toggle.closest("[data-plan-drag-handle]")).toBeNull();
    expect(screen.getByText("Run").closest("[data-plan-drag-handle]")).not.toBeNull();

    fireEvent.pointerDown(toggle);
    expect(onEntryPointerStart).not.toHaveBeenCalled();
    fireEvent.click(toggle, { detail: 1 });
    expect(onEntryOpen).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText("Run"));
    expect(onEntryPointerStart).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByText("Run"));
    expect(onEntryOpen).toHaveBeenCalledWith(sampleEntry.key);
  });

  it("exposes partner completion markers without relying on title tooltips", () => {
    renderWithDnd(
      <CalendarMonthDayCell
        day="2026-08-06"
        inMonth
        isToday={false}
        isPastInMonth={false}
        ariaLabel="Thursday, August 6, 2026."
        entriesForDay={[]}
        completionFactMarkersForDay={[
          {
            key: "partner-marker",
            goalTitle: "Partner stretch",
            scheduledDate: "2026-08-06",
            owner: "partner",
          },
        ]}
        isAnyEntryDragging={false}
        getEntryDisplayTitle={() => ""}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        onEntryClick={() => {}}
        onCellClick={() => {}}
        onCellDoubleClick={() => {}}
        onCellMouseEnter={() => {}}
        onCellMouseLeave={() => {}}
        onCellPointerDown={() => {}}
        onCellPointerUp={() => {}}
        onCellPointerCancel={() => {}}
        onCellPointerLeave={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
      />
    );

    const partnerChip = screen.getByLabelText(
      "Partner stretch. Partner marked this done."
    );
    expect(partnerChip).toBeInTheDocument();
    expect(partnerChip).toHaveClass("bg-background");
    expect(partnerChip).not.toHaveClass("bg-transparent");
    expect(partnerChip.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Partner marked this done.")).toBeInTheDocument();
    expect(screen.getByText("Partner stretch")).not.toHaveClass("line-through");
  });

  it("shows overflow as +N and a quiet completion check on month cells", () => {
    const view = renderWithDnd(
      <CalendarMonthDayCell
        day="2026-08-06"
        inMonth
        isToday={false}
        isPastInMonth={false}
        ariaLabel="Thursday, August 6, 2026."
        entriesForDay={[
          sampleEntry,
          { ...sampleEntry, key: "goal-2:cadence:0", originalGoalId: "goal-2", label: "Lift" },
          { ...sampleEntry, key: "goal-3:cadence:0", originalGoalId: "goal-3", label: "Yoga" },
        ]}
        completionFactMarkersForDay={[]}
        maxVisibleItems={2}
        isAnyEntryDragging={false}
        getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
        isEntryCredited={(entry) => entry.key === sampleEntry.key}
        isEntryImmovableForDraft={() => false}
        onEntryClick={() => {}}
        onCellClick={() => {}}
        onCellDoubleClick={() => {}}
        onCellMouseEnter={() => {}}
        onCellMouseLeave={() => {}}
        onCellPointerDown={() => {}}
        onCellPointerUp={() => {}}
        onCellPointerCancel={() => {}}
        onCellPointerLeave={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
      />
    );

    expect(within(view.container).getByText("+1 more")).toBeInTheDocument();
    expect(within(view.container).getByText("Easy run").closest("[data-testid='completion-title']")).toHaveAttribute(
      "data-completed",
      "true"
    );
    expect(within(view.container).getByLabelText("Completed")).toBeInTheDocument();
    expect(within(view.container).getByText("Easy run")).toHaveAttribute("data-completion-treatment", "quiet");
    expect(
      within(view.container).queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
  });

  it("reserves invisible +0 more space on month tiles without overflow", () => {
    const view = renderWithDnd(
      <CalendarMonthDayCell
        day="2026-08-06"
        inMonth
        isToday={false}
        isPastInMonth={false}
        ariaLabel="Thursday, August 6, 2026."
        entriesForDay={[sampleEntry]}
        completionFactMarkersForDay={[]}
        maxVisibleItems={2}
        isAnyEntryDragging={false}
        getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
        isEntryCredited={() => false}
        isEntryImmovableForDraft={() => false}
        onEntryClick={() => {}}
        onCellClick={() => {}}
        onCellDoubleClick={() => {}}
        onCellMouseEnter={() => {}}
        onCellMouseLeave={() => {}}
        onCellPointerDown={() => {}}
        onCellPointerUp={() => {}}
        onCellPointerCancel={() => {}}
        onCellPointerLeave={() => {}}
        onEntryPointerStart={() => {}}
        onEntryPointerEnd={() => {}}
      />
    );

    const reserved = within(view.container).getByText("+0 more");
    expect(reserved).toHaveClass("invisible");
    expect(reserved).toHaveAttribute("aria-hidden", "true");
    expect(within(view.container).queryByText("+1 more")).not.toBeInTheDocument();
  });

  it("renders week days as a vertical agenda with weekday labels", async () => {
    const onCellClick = vi.fn();
    const user = userEvent.setup();

    renderWithDnd(
      <ol>
        <CalendarMonthDayCell
          day="2026-08-06"
          inMonth
          isToday
          isPastInMonth={false}
          isSelected
          layout="agenda"
          ariaLabel="Thursday, August 6, 2026. 1 planned item."
          entriesForDay={[sampleEntry]}
          completionFactMarkersForDay={[]}
          isAnyEntryDragging={false}
          getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
          isEntryCredited={() => true}
          isEntryImmovableForDraft={() => false}
          onEntryClick={() => {}}
          onCellClick={onCellClick}
          onCellDoubleClick={() => {}}
          onCellMouseEnter={() => {}}
          onCellMouseLeave={() => {}}
          onCellPointerDown={() => {}}
          onCellPointerUp={() => {}}
          onCellPointerCancel={() => {}}
          onCellPointerLeave={() => {}}
          onEntryPointerStart={() => {}}
          onEntryPointerEnd={() => {}}
          onToggleCompletion={vi.fn()}
          getCompletionToggleState={() => ({
            currentlyCredited: true,
            disabledReasonCopy: null,
          })}
        />
      </ol>
    );

    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Easy run").closest("[data-testid='completion-title']")).toHaveAttribute(
      "data-completed",
      "true"
    );
    expect(document.querySelector('[data-calendar-week-row="true"]')).toHaveStyle({
      viewTransitionName: "plan-day-2026-08-06",
    });
    expect(document.querySelector('[data-calendar-week-row="true"]')).toHaveClass(
      "bg-today"
    );
    const toggle = screen.getByRole("button", { name: "Mark session not done" });
    expect(
      toggle.compareDocumentPosition(screen.getByText("Easy run")) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(toggle).toHaveClass("bg-transparent");

    await user.click(screen.getByRole("button", { name: /thursday, august 6/i }));
    expect(onCellClick).toHaveBeenCalledTimes(1);
  });

  it("hides the week agenda checkbox while a session is in the plan draft", () => {
    renderWithDnd(
      <ol>
        <CalendarMonthDayCell
          day="2026-08-12"
          inMonth
          isToday
          isPastInMonth={false}
          isSelected
          layout="agenda"
          ariaLabel="Wednesday, August 12, 2026. 1 planned item."
          entriesForDay={[
            {
              ...sampleEntry,
              draftDiffKind: "moved_to",
              draftDiffFromDate: "2026-08-20",
              draftDiffToDate: "2026-08-12",
            },
          ]}
          completionFactMarkersForDay={[]}
          isAnyEntryDragging={false}
          getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
          isEntryCredited={() => false}
          isEntryImmovableForDraft={() => false}
          onEntryClick={() => {}}
          onCellClick={() => {}}
          onCellDoubleClick={() => {}}
          onCellMouseEnter={() => {}}
          onCellMouseLeave={() => {}}
          onCellPointerDown={() => {}}
          onCellPointerUp={() => {}}
          onCellPointerCancel={() => {}}
          onCellPointerLeave={() => {}}
          onEntryPointerStart={() => {}}
          onEntryPointerEnd={() => {}}
          onToggleCompletion={vi.fn()}
          getCompletionToggleState={() => ({
            currentlyCredited: false,
            disabledReasonCopy: null,
          })}
        />
      </ol>
    );

    expect(screen.getByText("Easy run")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark session done" })
    ).not.toBeInTheDocument();
  });

  it("selects a week day from empty agenda space but not from a work item", async () => {
    const onCellClick = vi.fn();
    const onEntryClick = vi.fn();
    const user = userEvent.setup();

    renderWithDnd(
      <ol>
        <CalendarMonthDayCell
          day="2026-08-06"
          inMonth
          isToday={false}
          isPastInMonth={false}
          isSelected={false}
          layout="agenda"
          ariaLabel="Thursday, August 6, 2026. 1 planned item."
          entriesForDay={[sampleEntry]}
          completionFactMarkersForDay={[]}
          isAnyEntryDragging={false}
          getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
          isEntryCredited={() => false}
          isEntryImmovableForDraft={() => false}
          onEntryClick={onEntryClick}
          onCellClick={onCellClick}
          onCellDoubleClick={() => {}}
          onCellMouseEnter={() => {}}
          onCellMouseLeave={() => {}}
          onCellPointerDown={() => {}}
          onCellPointerUp={() => {}}
          onCellPointerCancel={() => {}}
          onCellPointerLeave={() => {}}
          onEntryPointerStart={() => {}}
          onEntryPointerEnd={() => {}}
        />
      </ol>
    );

    fireEvent.click(document.querySelector("[data-calendar-week-work='true']")!);
    expect(onCellClick).toHaveBeenCalledTimes(1);
    expect(onEntryClick).not.toHaveBeenCalled();

    await user.click(screen.getByText("Easy run"));
    expect(onEntryClick).toHaveBeenCalledTimes(1);
    expect(onCellClick).toHaveBeenCalledTimes(1);
  });

  it("toggles week completion from the checkbox without selecting the item", () => {
    const onEntryClick = vi.fn();
    const onToggleCompletion = vi.fn();
    const onEntryPointerStart = vi.fn();

    renderWithDnd(
      <ol>
        <CalendarMonthDayCell
          day="2026-08-06"
          inMonth
          isToday={false}
          isPastInMonth={false}
          layout="agenda"
          ariaLabel="Thursday, August 6, 2026. 1 planned item."
          entriesForDay={[sampleEntry]}
          completionFactMarkersForDay={[]}
          isAnyEntryDragging={false}
          getEntryDisplayTitle={(entry) => entry.label ?? "Untitled"}
          isEntryCredited={() => false}
          isEntryImmovableForDraft={() => false}
          onEntryClick={onEntryClick}
          onCellClick={() => {}}
          onCellDoubleClick={() => {}}
          onCellMouseEnter={() => {}}
          onCellMouseLeave={() => {}}
          onCellPointerDown={() => {}}
          onCellPointerUp={() => {}}
          onCellPointerCancel={() => {}}
          onCellPointerLeave={() => {}}
          onEntryPointerStart={onEntryPointerStart}
          onEntryPointerEnd={() => {}}
          onToggleCompletion={onToggleCompletion}
          getCompletionToggleState={() => ({
            currentlyCredited: false,
            disabledReasonCopy: null,
          })}
        />
      </ol>
    );

    const toggle = screen.getByRole("button", { name: "Mark session done" });
    vi.useFakeTimers();
    fireEvent.pointerDown(toggle);
    expect(onEntryPointerStart).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onToggleCompletion).toHaveBeenCalledTimes(1);
    expect(onEntryClick).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("CalendarPartnerChip", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses a person icon for partner goals whether or not they are completed", () => {
    const { rerender } = render(
      <CalendarPartnerChip title="Partner run" />
    );
    const openChip = screen.getByLabelText("Partner run. Partner goal.");
    expect(openChip.querySelector("svg")).not.toBeNull();
    expect(openChip).toHaveClass("bg-background");
    expect(screen.getByText("Partner run")).not.toHaveClass("line-through");

    rerender(<CalendarPartnerChip title="Partner run" completed />);
    const doneChip = screen.getByLabelText(
      "Partner run. Partner marked this done."
    );
    expect(doneChip.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Partner run")).not.toHaveClass("line-through");
  });
});

