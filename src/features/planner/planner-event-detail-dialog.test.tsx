import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { PlannerEventDetailDialog } from "@/features/planner/planner-event-detail-dialog"
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types"

const callbacks = {
  onOpenChange: vi.fn(),
  onUpdateDraftLabel: vi.fn(),
  onUpdateDraftScheduledDate: vi.fn(),
  onUpdateDraftScheduledTimeOverride: vi.fn(),
  onToggleItemLock: vi.fn(),
  onNavigateToFirstOpenInstance: vi.fn(),
  onNavigateToPreviousOpenInstance: vi.fn(),
  onNavigateToNextOpenInstance: vi.fn(),
  onNavigateToLastOpenInstance: vi.fn(),
}

function buildEntry(): PlannerDayDetailEntry {
  return {
    key: "goal-a:total:1",
    originalGoalId: "goal-a",
    goalTitle: "Goal A",
    unitKey: "total:1",
    label: "Goal A",
    classification: "scheduled",
    creditState: "uncredited",
    activeGoal: {
      id: "goal-a",
      goal_id: "goal-a",
      original_goal_id: "goal-a",
      requirement_fingerprint: "cadence:weekly:3",
      title: "Goal A",
      category: "health",
      color: "#4a6740",
      start_date: "2026-06-01",
      end_date: "2026-12-31",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 3,
      target_basis: "period",
      default_local_time: "07:30",
    },
    activeItem: {
      id: "item-a",
      plan_goal_id: "goal-a",
      unit_key: "total:1",
      requirement_kind: "cadence",
      scheduled_date: "2026-08-31",
      locked: false,
      revision: 1,
    },
    draftDiffKind: null,
    draftDiffFromDate: null,
    draftDiffToDate: null,
    draftGhost: false,
    effectiveScheduledLocalTime: "07:30",
  }
}

function renderDialog(entry: PlannerDayDetailEntry = buildEntry()) {
  return render(
    <PlannerEventDetailDialog
      selectedEventEntry={entry}
      selectedEventLinkedTargets={[]}
      goalTitles={{}}
      scopeMonth="2026-08"
      selectedEventDraftEdit={undefined}
      selectedEventBaselineUnit={null}
      selectedEventDraftScheduledDate="2026-08-31"
      selectedEventDraftTimeInputValue="07:30"
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
}

describe("PlannerEventDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("opens as a readable card without form fields", async () => {
    renderDialog()

    const activeDialog = (
      await screen.findAllByRole("region", { name: "Edit planned session" })
    ).at(-1)
    expect(activeDialog).toBeDefined()
    expect(within(activeDialog!).queryByPlaceholderText("Goal title")).toBeNull()
    expect(within(activeDialog!).queryByLabelText("Date")).toBeNull()
    expect(within(activeDialog!).getByRole("heading", { name: "Goal A" })).toBeTruthy()
    expect(within(activeDialog!).getByText("03")).toBeTruthy()
    expect(within(activeDialog!).getByText(/days/)).toBeTruthy()
    expect(within(activeDialog!).getByText(/Until 2026-12-31/)).toBeTruthy()
    expect(within(activeDialog!).getByText("Mon, Aug 31")).toBeTruthy()
    expect(within(activeDialog!).getByText("7:30 AM")).toBeTruthy()
  })

  it("turns a sitting fact into an editor on tap", async () => {
    renderDialog()

    const activeDialog = (
      await screen.findAllByRole("region", { name: "Edit planned session" })
    ).at(-1)!
    fireEvent.click(within(activeDialog).getByText("Mon, Aug 31"))
    expect(within(activeDialog).getByLabelText("Date")).toHaveValue("2026-08-31")
    expect(within(activeDialog).getByLabelText("Date")).toHaveFocus()
  })

  it("keeps instance navigation on the card", async () => {
    renderDialog()

    const activeDialog = (
      await screen.findAllByRole("region", { name: "Edit planned session" })
    ).at(-1)!
    expect(
      within(activeDialog).getByRole("button", { name: "Go to previous open instance" })
    ).toBeDisabled()

    fireEvent.click(
      within(activeDialog).getByRole("button", { name: "Go to first open instance" })
    )
    fireEvent.click(
      within(activeDialog).getByRole("button", { name: "Go to next open instance" })
    )
    fireEvent.click(
      within(activeDialog).getByRole("button", { name: "Go to last open instance" })
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
      renderDialog()

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
