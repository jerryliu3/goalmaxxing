import { describe, expect, it } from "vitest";
import {
  resolveCreditedDisplayDate,
  resolveUncreditedDisplayDate,
  resolveWorkUnitDisplayDate,
} from "@/lib/planner/session-display-date";

describe("session display date", () => {
  it("pins uncredited sessions to the persisted scheduled date", () => {
    expect(resolveUncreditedDisplayDate("2026-10-01")).toBe("2026-10-01");
    expect(
      resolveWorkUnitDisplayDate({
        creditState: "uncredited",
        persistedScheduledDate: "2026-10-01",
        previewScheduledDate: "2026-09-04",
        creditedCompletionDate: "2026-09-04",
      })
    ).toBe("2026-10-01");
  });

  it("does not display unpublished uncredited preview dates", () => {
    expect(resolveUncreditedDisplayDate(null)).toBeNull();
    expect(
      resolveWorkUnitDisplayDate({
        creditState: "uncredited",
        persistedScheduledDate: null,
        previewScheduledDate: "2026-09-04",
      })
    ).toBeNull();
  });

  it("keeps credited history on the scheduled or credited date", () => {
    expect(
      resolveCreditedDisplayDate({
        scheduledDate: "2026-08-05",
        creditedCompletionDate: "2026-08-06",
      })
    ).toBe("2026-08-05");
    expect(
      resolveWorkUnitDisplayDate({
        creditState: "completed_elsewhere",
        persistedScheduledDate: "2026-10-01",
        previewScheduledDate: "2026-08-31",
        creditedCompletionDate: "2026-09-01",
      })
    ).toBe("2026-08-31");
  });
});
