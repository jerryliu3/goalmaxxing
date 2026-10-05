import { describe, expect, it } from "vitest";
import {
  parseProgressView,
  progressSectionElementId,
  progressSectionsForView,
  progressViewForSection,
  resolveProgressDeepLink,
} from "@/features/insights/progress-overview/progress-view-model";

describe("progress view model", () => {
  it("defaults to the current view for unknown values", () => {
    expect(parseProgressView(null)).toBe("current");
    expect(parseProgressView("nope")).toBe("current");
    expect(parseProgressView("past")).toBe("past");
  });

  it("orders current sections history, week", () => {
    expect(progressSectionsForView("current").map((section) => section.id)).toEqual([
      "history",
      "week",
    ]);
    expect(progressSectionsForView("current")[0].label).toBe("Progress tracker");
  });

  it("keeps past goals and achievements in the past view", () => {
    expect(progressSectionsForView("past").map((section) => section.id)).toEqual([
      "achievements",
      "past-goals",
    ]);
    expect(progressViewForSection("past-goals")).toBe("past");
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
