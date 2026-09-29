import { describe, expect, it } from "vitest";
import { planDraftMove } from "@/features/planner/plan-draft-move";
import {
  buildPlannerDayEntry,
  buildPlannerWorkUnit,
} from "@/features/planner/test-fixtures";

const validMove = {
  nextDate: "2026-08-02",
  scopeMonth: "2026-08",
  conflictKeys: undefined,
  completionFactConflict: undefined,
};

describe("planDraftMove", () => {
  it("returns detailed guidance when a session is missing from the current preview", () => {
    const result = planDraftMove({
      ...validMove,
      entry: buildPlannerDayEntry(),
      previewUnit: undefined,
    });

    expect(result).toEqual({
      ok: false,
      message:
        "This session is missing from the current preview. Refresh the calendar and try again.",
    });
  });

  it("allows manually moving historical sessions when a draft move window exists", () => {
    const result = planDraftMove({
      ...validMove,
      source: "drag_drop",
      entry: buildPlannerDayEntry({
        classification: "historical_shortfall",
        creditState: "uncredited",
      }),
      previewUnit: buildPlannerWorkUnit({
        draftMoveWindow: {
          start: "2026-08-01",
          end: "2026-08-31",
        },
        placementWindow: null,
      }),
    });

    expect(result).toEqual({
      ok: true,
      scheduledDate: "2026-08-02",
    });
  });

  it("blocks coach-driven moves for historical sessions", () => {
    const result = planDraftMove({
      ...validMove,
      source: "coach",
      entry: buildPlannerDayEntry({
        classification: "historical_miss",
        creditState: "uncredited",
      }),
      previewUnit: buildPlannerWorkUnit({
        draftMoveWindow: {
          start: "2026-08-01",
          end: "2026-08-31",
        },
      }),
    });

    expect(result).toEqual({
      ok: false,
      message:
        "Past sessions can only be moved manually. Use drag and drop or edit the date directly.",
    });
  });

  it("rejects moves into a linked suppression date", () => {
    const result = planDraftMove({
      ...validMove,
      entry: buildPlannerDayEntry(),
      previewUnit: buildPlannerWorkUnit({
        placementWindow: {
          start: "2026-08-01",
          end: "2026-08-31",
        },
      }),
      destinationSuppressedByLink: true,
    });

    expect(result).toEqual({
      ok: false,
      message:
        "This linked target is suppressed on that date. Move it to a date on or after the linked resume date.",
    });
  });

  it("rejects moves for an active item locked by the planner", () => {
    const result = planDraftMove({
      ...validMove,
      entry: buildPlannerDayEntry({
        activeItem: {
          id: "item-1",
          plan_goal_id: "plan-goal-1",
          unit_key: "unit-1",
          requirement_kind: "deadline_total",
          scheduled_date: "2026-08-01",
          revision: 0,
          locked: true,
        },
      }),
      previewUnit: buildPlannerWorkUnit({
        placementWindow: {
          start: "2026-08-01",
          end: "2026-08-31",
        },
      }),
    });

    expect(result).toEqual({
      ok: false,
      message: "Unlock this session before moving it.",
    });
  });

  it("rejects moves for a locked planner work unit", () => {
    const result = planDraftMove({
      ...validMove,
      entry: buildPlannerDayEntry(),
      previewUnit: buildPlannerWorkUnit({
        locked: true,
        placementWindow: {
          start: "2026-08-01",
          end: "2026-08-31",
        },
      }),
    });

    expect(result).toEqual({
      ok: false,
      message: "Unlock this session before moving it.",
    });
  });
});
