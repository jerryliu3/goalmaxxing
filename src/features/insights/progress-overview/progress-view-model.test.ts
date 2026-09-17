import { describe, expect, it } from "vitest";
import {
  parseProgressView,
  progressSectionElementId,
  progressSectionsForView,
  progressViewForSection,
  progressViewTitle,
  resolveProgressDeepLink,
} from "@/features/insights/progress-overview/progress-view-model";

describe("progress view model", () => {
  it("defaults to the current view for unknown values", () => {
    expect(parseProgressView(null)).toBe("current");
    expect(parseProgressView("nope")).toBe("current");
    expect(parseProgressView("past")).toBe("past");
  });

  it("orders current sections score, week, history", () => {
    expect(progressSectionsForView("current").map((section) => section.id)).toEqual([
      "score",
      "week",
      "history",
    ]);
    expect(progressSectionsForView("current")[0].label).toBe("Goalmaxxing score");
  });

  it("keeps achievements and past goals in the past view", () => {
    expect(progressSectionsForView("past").map((section) => section.id)).toEqual([
      "achievements",
      "past-goals",
    ]);
    expect(progressViewForSection("past-goals")).toBe("past");
    expect(progressViewTitle("past")).toBe("Past progress");
  });

  it("resolves section hashes, including the legacy achievements link", () => {
    expect(resolveProgressDeepLink("#progress-achievements")).toEqual({
      view: "past",
      sectionId: "achievements",
    });
    expect(resolveProgressDeepLink(progressSectionElementId("history"))).toEqual({
      view: "current",
      sectionId: "history",
    });
    expect(resolveProgressDeepLink("")).toBeNull();
    expect(resolveProgressDeepLink("#something-else")).toBeNull();
  });
});
