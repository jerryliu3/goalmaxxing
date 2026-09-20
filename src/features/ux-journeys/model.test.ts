import { describe, expect, it } from "vitest";
import { defaultGoalFormState } from "@/features/today/goal-form-model";
import { newDraft } from "./model";

describe("newDraft", () => {
  it("includes the canonical plaque_target default", () => {
    expect(newDraft().plaque_target).toBe(defaultGoalFormState.plaque_target);
  });
});
