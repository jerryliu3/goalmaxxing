import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { PlannerEventDetailDialog } from "@/features/planner/planner-event-detail-dialog"
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types"
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation"
import type { Goal } from "@/lib/goals/types"

const goal: Goal = {
  id: "goal-a",
  owner_id: "user-1",
  title: "Goal A",
  description: null,
  category: "Career",
  category_key: "career",
  color: "#8b5cf6",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: 3,
  target_basis: "period",
  milestone_names: null,
  start_date: "2026-08-01",
  end_date: "2026-12-31",
  photo_path: null,
  team_id: null,
  is_deleted: false,
  archived_at: null,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
}

const presentation: ChecklistGoalPresentation = {
  exactDateCompleted: false,
  completionSourceForSelectedDate: null,
  periodCompletionCount: 2,
  periodTarget: 3,
  periodSatisfied: false,
  lifetimeCompletionCount: 8,
  lifetimeAchieved: false,
  isGreen: false,
  displayCompletionCount: 2,
  shouldHideWhenCompletedFilterOff: false,
}

function buildEntry(
  overrides: Partial<PlannerDayDetailEntry> = {}
): PlannerDayDetailEntry {
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
    ...overrides,
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

function renderDialog(props: Partial<Parameters<typeof PlannerEventDetailDialog>[0]> = {}) {
  const callbacks = props.callbacks ?? buildCallbacks()
  render(
    <PlannerEventDetailDialog
      selectedEventEntry={buildEntry()}
      selectedEventLinkedTargets={[]}
      selectedEventGoal={goal}
      selectedEventPresentation={presentation}
      goalTitles={{}}
      selectedEventBaselineUnit={null}
      selectedEventDraftScheduledDate="2026-08-31"
      selectedEventDraftTimeInputValue=""
      mutationLoadingKey={null}
      canMutatePlanItems
      canNavigateToFirstOpenInstance={false}
      canNavigateToPreviousOpenInstance={false}
      canNavigateToNextOpenInstance={false}
      canNavigateToLastOpenInstance={false}
      {...props}
      callbacks={callbacks}
    />
  )
  return { callbacks }
}

describe("PlannerEventDetailDialog", () => {
  it("reads as one sentence before any field is opened", async () => {
    renderDialog()

    expect(screen.getByRole("heading", { name: "Goal A" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mon, Aug 31" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "any time" })).toBeInTheDocument()
    expect(screen.queryByText("Career")).not.toBeInTheDocument()
    expect(screen.getByText("Dec 31, 2026")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "2 of 3 this week" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Edit goal" })).toHaveAttribute(
      "href",
      "/goals/goal-a"
    )
    expect(screen.getByRole("region", { name: "Edit planned session" })).toHaveTextContent(
      "Session scheduled for Mon, Aug 31 at any time. Edit goal"
    )
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument()
  })

  it("opens a single fact editor on demand without auto-focusing it", async () => {
    renderDialog()

    fireEvent.click(await screen.findByRole("button", { name: "Mon, Aug 31" }))
    const dateInput = screen.getByLabelText("Date")
    expect(dateInput).not.toHaveFocus()
    expect(dateInput).toHaveValue("2026-08-31")
    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "any time" }))
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Time")).toBeInTheDocument()
  })

  it("keeps instance navigation in the card header", async () => {
    const callbacks = buildCallbacks()
    renderDialog({
      callbacks,
      canNavigateToFirstOpenInstance: true,
      canNavigateToPreviousOpenInstance: false,
      canNavigateToNextOpenInstance: true,
      canNavigateToLastOpenInstance: true,
    })

    const activeDialog = (
      await screen.findAllByRole("region", { name: "Edit planned session" })
    ).at(-1)
    expect(activeDialog).toBeDefined()
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

  it("toggles the lock straight from the sentence", () => {
    const callbacks = buildCallbacks()
    const entry = buildEntry({
      activeItem: {
        id: "item-1",
        plan_goal_id: "plan-goal-1",
        unit_key: "total:1",
        requirement_kind: "deadline_total",
        scheduled_date: "2026-08-31",
        locked: false,
        revision: 1,
      },
    })
    renderDialog({ callbacks, selectedEventEntry: entry })

    const lockControl = screen.getByRole("button", { name: "not locked to today" })
    expect(lockControl).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(lockControl)
    expect(callbacks.onToggleItemLock).toHaveBeenCalledWith(entry)
  })

  it("shows the effective time in the editor when no override exists", () => {
    renderDialog({
      selectedEventEntry: buildEntry({ effectiveScheduledLocalTime: "07:30" }),
      selectedEventBaselineUnit: { effectiveScheduledLocalTime: "07:30" },
    })

    fireEvent.click(screen.getByRole("button", { name: "7:30 AM" }))
    expect(screen.getByLabelText("Time")).toHaveValue("07:30")
  })

  it("renders mutation facts as static or disabled when the plan is read-only", () => {
    const entry = buildEntry({
      activeItem: {
        id: "item-1",
        plan_goal_id: "plan-goal-1",
        unit_key: "total:1",
        requirement_kind: "deadline_total",
        scheduled_date: "2026-08-31",
        locked: true,
        revision: 1,
      },
    })
    renderDialog({ selectedEventEntry: entry, canMutatePlanItems: false })

    expect(screen.queryByRole("button", { name: "Mon, Aug 31" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "any time" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "locked to today" })).toBeDisabled()
  })

  it("disables lock changes while another planner mutation is pending", () => {
    renderDialog({
      selectedEventEntry: buildEntry({
        activeItem: {
          id: "item-1",
          plan_goal_id: "plan-goal-1",
          unit_key: "total:1",
          requirement_kind: "deadline_total",
          scheduled_date: "2026-08-31",
          locked: false,
          revision: 1,
        },
      }),
      mutationLoadingKey: "completion:goal-a",
    })

    expect(screen.getByRole("button", { name: "not locked to today" })).toBeDisabled()
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

  it("pops the same editor up in a modal when asked", () => {
    const { callbacks } = renderDialog({ presentation: "popup" })
    const dialog = screen.getByRole("dialog", { name: "Goal A" })
    expect(dialog).toHaveAttribute("data-plan-entry-editor", "true")
    expect(within(dialog).getByRole("region", { name: "Edit planned session" })).toBeInTheDocument()
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(callbacks.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes only the time field on Escape inside the popup", () => {
    const { callbacks } = renderDialog({
      presentation: "popup",
      selectedEventEntry: buildEntry({ effectiveScheduledLocalTime: "07:30" }),
      selectedEventBaselineUnit: { effectiveScheduledLocalTime: "07:30" },
    })
    fireEvent.click(screen.getByRole("button", { name: "7:30 AM" }))
    fireEvent.keyDown(screen.getByLabelText("Time"), { key: "Escape" })
    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument()
    expect(callbacks.onOpenChange).not.toHaveBeenCalled()
  })
})
