import { describe, expect, it } from "vitest";
import { shouldReplaceGoalSourceLink } from "@/features/today/goal-form-model";

describe("shouldReplaceGoalSourceLink", () => {
  it("records the chosen link when a goal is created", () => {
    expect(
      shouldReplaceGoalSourceLink({
        isEditing: false,
        savedLinkTarget: "none",
        selectedLinkTarget: "none",
      }),
    ).toBe(true);
    expect(
      shouldReplaceGoalSourceLink({
        isEditing: false,
        savedLinkTarget: "none",
        selectedLinkTarget: "target-a",
      }),
    ).toBe(true);
  });

  it("leaves outgoing links alone when an edit does not change the selected target", () => {
    expect(
      shouldReplaceGoalSourceLink({
        isEditing: true,
        savedLinkTarget: "target-a",
        selectedLinkTarget: "target-a",
      }),
    ).toBe(false);
    expect(
      shouldReplaceGoalSourceLink({
        isEditing: true,
        savedLinkTarget: "none",
        selectedLinkTarget: "none",
      }),
    ).toBe(false);
  });

  it("rewrites the outgoing link when the selected target changes", () => {
    expect(
      shouldReplaceGoalSourceLink({
        isEditing: true,
        savedLinkTarget: "target-a",
        selectedLinkTarget: "target-b",
      }),
    ).toBe(true);
    expect(
      shouldReplaceGoalSourceLink({
        isEditing: true,
        savedLinkTarget: "target-a",
        selectedLinkTarget: "none",
      }),
    ).toBe(true);
  });
});
