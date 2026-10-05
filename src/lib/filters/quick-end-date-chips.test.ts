import { describe, expect, it } from "vitest";
import { buildQuickEndDateChipOptions } from "@/lib/filters/quick-end-date-chips";
import { NO_END_DATE_FILTER } from "@/lib/goals/list-view";

describe("buildQuickEndDateChipOptions", () => {
  it("orders end-date quick filters with No end date last", () => {
    expect(
      buildQuickEndDateChipOptions("2026-08").map((option) => option.label)
    ).toEqual([
      "All end dates",
      "This month",
      "Next month",
      "Year end",
      "No end date",
    ]);
    expect(
      buildQuickEndDateChipOptions("2026-08").find(
        (option) => option.key === "no-end-date"
      )?.value
    ).toBe(NO_END_DATE_FILTER);
  });
});
