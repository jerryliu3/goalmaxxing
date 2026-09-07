import { describe, expect, it } from "vitest";
import {
  getCompletionControlDisabledReason,
  planCompletionControlMode,
  planCompletionControlModeForDate,
  type DateFactDispatchForEntry,
} from "@/features/planner/completion-entry-dispatch";
import { buildPlannerDayEntry } from "@/features/planner/test-fixtures";

function buildDispatch(
  overrides: Partial<DateFactDispatchForEntry>
): DateFactDispatchForEntry {
  return {
    currentlyCredited: false,
    desiredFactState: "present",
    decision: {
      allowed: true,
      route: "item_date",
      exactDateOnly: true,
      reason: "allowed",
    },
    ...overrides,
  };
}

describe("getCompletionControlDisabledReason", () => {
  it("returns out_of_scope_route when item-date route cannot mutate plan items", () => {
    const entry = buildPlannerDayEntry({
      activeItem: {
        id: "item-1",
      } as never,
    });
    const disabledReason = getCompletionControlDisabledReason({
      entry,
      dispatch: buildDispatch({}),
      canMutatePlanItems: false,
    });
    expect(disabledReason).toBe("out_of_scope_route");
  });

  it("returns null for canonical exact-date route", () => {
    const entry = buildPlannerDayEntry();
    const disabledReason = getCompletionControlDisabledReason({
      entry,
      dispatch: buildDispatch({
        decision: {
          allowed: true,
          route: "canonical_exact_date",
          exactDateOnly: true,
          reason: "allowed",
        },
      }),
      canMutatePlanItems: false,
    });
    expect(disabledReason).toBeNull();
  });

  it("returns future_creation for disallowed future completion attempts", () => {
    const entry = buildPlannerDayEntry();
    const disabledReason = getCompletionControlDisabledReason({
      entry,
      dispatch: buildDispatch({
        decision: {
          allowed: false,
          route: "disabled",
          exactDateOnly: true,
          reason: "future_creation",
        },
      }),
      canMutatePlanItems: true,
    });
    expect(disabledReason).toBe("future_creation");
  });
});

describe("planCompletionControlMode", () => {
  it("hides the checkbox when completion would error, and keeps a static done mark", () => {
    expect(
      planCompletionControlMode({
        currentlyCredited: false,
        disabledReasonCopy: "You can only mark planner sessions done for today or past dates.",
      })
    ).toBe("hidden");
    expect(
      planCompletionControlMode({
        currentlyCredited: true,
        disabledReasonCopy: "View-only completion history.",
      })
    ).toBe("done");
    expect(
      planCompletionControlMode({
        currentlyCredited: false,
        disabledReasonCopy: null,
      })
    ).toBe("toggle");
  });
});

describe("planCompletionControlModeForDate", () => {
  it("hides the checkbox on future dates and keeps a static done mark", () => {
    expect(
      planCompletionControlModeForDate({
        currentlyCredited: false,
        selectedDate: "2026-09-10",
        asOfDate: "2026-09-06",
      })
    ).toBe("hidden");
    expect(
      planCompletionControlModeForDate({
        currentlyCredited: true,
        selectedDate: "2026-09-10",
        asOfDate: "2026-09-06",
      })
    ).toBe("done");
    expect(
      planCompletionControlModeForDate({
        currentlyCredited: false,
        selectedDate: "2026-09-06",
        asOfDate: "2026-09-06",
      })
    ).toBe("toggle");
  });
});
