import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PlannerEventDetailDialog } from "@/features/planner/planner-event-detail-dialog"
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types"

function buildEntry(): PlannerDayDetailEntry {
  return {
    key: "goal-a:total:1",
    originalGoalId: "goal-a",
    goalTitle: "Goal A",
    unitKey: "total:1",
    label: "Goal A",
    classification: "scheduled",
    creditState: "uncredited",
    activeGoal: null,
    activeItem: null,
    draftDiffKind: null,
    draftDiffFromDate: null,
    draftDiffToDate: null,
    draftGhost: false,
  }
}

function buildCallbacks() {
  return {
    onOpenChange: vi.fn(),
    onUpdateDraftScheduledDate: vi.fn(),
    onUpdateDraftScheduledTimeOverride: vi.fn(),
    onToggleItemLock: vi.fn(),
    onNavigateToFirstOpenInstance: vi.fn(),
    onNavigateToPreviousOpenInstance: vi.fn(),
    onNavigateToNextOpenInstance: vi.fn(),
    onNavigateToLastOpenInstance: vi.fn(),
  }
}

describe("PlannerEventDetailDialog", () => {
  it("does not auto-focus date or time fields on open", async () => {
    render(
      <PlannerEventDetailDialog
        selectedEventEntry={buildEntry()}
        selectedEventLinkedTargets={[]}
        goalTitles={{}}
        scopeMonth="2026-08"
        selectedEventBaselineUnit={null}
        selectedEventDraftScheduledDate="2026-08-31"
        selectedEventDraftTimeInputValue=""
        mutationLoadingKey={null}
        canMutatePlanItems
        canNavigateToFirstOpenInstance={false}
        canNavigateToPreviousOpenInstance={false}
        canNavigateToNextOpenInstance={false}
        canNavigateToLastOpenInstance={false}
        getEntryGoalFirstTitleWithTime={() => "Goal A"}
        callbacks={buildCallbacks()}
      />
    )

    expect(await screen.findByLabelText("Date")).not.toHaveFocus()
    expect(screen.getByLabelText("Time")).not.toHaveFocus()
  })

  it("renders centered title and instance navigation controls", async () => {
    const callbacks = buildCallbacks()

    render(
      <PlannerEventDetailDialog
        selectedEventEntry={buildEntry()}
        selectedEventLinkedTargets={[]}
        goalTitles={{}}
        scopeMonth="2026-08"
        selectedEventBaselineUnit={null}
        selectedEventDraftScheduledDate="2026-08-31"
        selectedEventDraftTimeInputValue=""
        mutationLoadingKey={null}
        canMutatePlanItems
        canNavigateToFirstOpenInstance
        canNavigateToPreviousOpenInstance={false}
        canNavigateToNextOpenInstance
        canNavigateToLastOpenInstance
        getEntryGoalFirstTitleWithTime={() => "Goal A"}
        callbacks={callbacks}
      />
    )

    const activeDialog = (
      await screen.findAllByRole("region", { name: "Edit planned session" })
    ).at(-1)
    expect(activeDialog).toBeDefined()
    expect(within(activeDialog!).getByRole("heading", { name: "Goal A" })).toHaveClass(
      "text-center"
    )
    expect(within(activeDialog!).queryByLabelText("Title")).not.toBeInTheDocument()
    expect(within(activeDialog!).getByLabelText("Date")).toHaveValue("2026-08-31")
    expect(
      within(activeDialog!).getByRole("button", { name: "Go to previous open instance" })
    ).toBeDisabled()

    fireEvent.click(
      within(activeDialog!).getByRole("button", { name: "Go to first open instance" })
    )
    fireEvent.click(
      within(activeDialog!).getByRole("button", { name: "Go to next open instance" })
    )
    fireEvent.click(
      within(activeDialog!).getByRole("button", { name: "Go to last open instance" })
    )

    expect(callbacks.onNavigateToFirstOpenInstance).toHaveBeenCalledTimes(1)
    expect(callbacks.onNavigateToNextOpenInstance).toHaveBeenCalledTimes(1)
    expect(callbacks.onNavigateToLastOpenInstance).toHaveBeenCalledTimes(1)
  })

  it("does not scroll the checklist editor host into view on open", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
    const host = document.createElement("div")
    host.dataset.planChecklistEditorSlot = "goal-a:total:1"
    document.body.append(host)

    try {
      render(
        <PlannerEventDetailDialog
          selectedEventEntry={buildEntry()}
          selectedEventLinkedTargets={[]}
          goalTitles={{}}
          scopeMonth="2026-08"
          selectedEventBaselineUnit={null}
          selectedEventDraftScheduledDate="2026-08-31"
          selectedEventDraftTimeInputValue=""
          mutationLoadingKey={null}
          canMutatePlanItems
          canNavigateToFirstOpenInstance={false}
          canNavigateToPreviousOpenInstance={false}
          canNavigateToNextOpenInstance={false}
          canNavigateToLastOpenInstance={false}
          getEntryGoalFirstTitleWithTime={() => "Goal A"}
          callbacks={buildCallbacks()}
        />
      )

      await waitFor(() => {
        expect(host.querySelector("[data-plan-entry-editor]")).not.toBeNull()
      })
      expect(scrollIntoView).not.toHaveBeenCalled()
    } finally {
      host.remove()
      scrollIntoView.mockRestore()
    }
  })
})
