import { describe, expect, it } from "vitest";
import { coachActionPreviewLines } from "@cadence/shared/coach";

describe("reviewed coach changes", () => {
  it("shows lifetime targets, visibility, and milestones without command fields", () => {
    const lines = coachActionPreviewLines({ undoable: false, linkedTarget: null, goal: {
      id: "internal", title: "Write", description: null, frequency_type: "recurring", recurrence_interval: "monthly",
      target_basis: "lifetime", target_count: 12, start_date: "2026-10-01", end_date: "2026-12-31",
      milestone_names: null, difficulty: "medium", is_private: false,
    } }, "create_goal");
    expect(lines).toContain("Write · 12 total");
    expect(lines).toContain("Visible on your shared profile · medium difficulty");
    expect(lines.join(" ")).not.toContain("internal");
  });
  it("shows reviewed rest-day undo in the correct direction", () => {
    expect(coachActionPreviewLines({undo:true,undoable:false,before:{restWeekdays:[6]},after:{restWeekdays:[0]},note:"Future planning uses these defaults."},"preference")).toContain("Rest days: Sat → Sun");
  });
});
