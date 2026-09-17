import { describe, expect, it } from "vitest";
import { getRewardFields, getRewardFilter, getRewardProgress, REWARD_CONCEPTS, REWARD_SAMPLES } from "./reward-model";

describe("reward presentation", () => {
  it("earns only at the final credited unit and clamps preview counts", () => {
    expect(getRewardProgress(11, 12).earned).toBe(false);
    expect(getRewardProgress(12, 12)).toEqual({ required: 12, credited: 12, fraction: 1, earned: true });
    expect(getRewardProgress(99, 12).credited).toBe(12);
    expect(getRewardProgress(-1, 12).fraction).toBe(0);
    expect(getRewardProgress(Number.NaN, Number.NaN)).toEqual({ required: 1, credited: 0, fraction: 0, earned: false });
  });

  it("separates light from color and returns the exact selected finish at completion", () => {
    expect(getRewardFilter("illuminate", 0)).toBe("saturate(1) brightness(0.28)");
    expect(getRewardFilter("transmute", 0)).toBe("saturate(0) brightness(1)");
    expect(getRewardFilter("transmute", 0.5)).toBe("saturate(0.5) brightness(1)");
    expect(getRewardFilter("illuminate-transmute", 0)).toBe("saturate(0) brightness(0.28)");
    for (const concept of REWARD_CONCEPTS) {
      expect(getRewardFilter(concept.id, 1)).toBe("saturate(1) brightness(1)");
    }
  });

  it("keeps cadence separate from the reward milestone while sizing finite targets", () => {
    expect(getRewardFields(REWARD_SAMPLES[0], 24).target_count).toBe("24");
    expect(getRewardFields(REWARD_SAMPLES[1], 6).milestone_names).toHaveLength(6);
    const ongoing = getRewardFields(REWARD_SAMPLES[2], 24);
    expect(ongoing.target_count).toBe("3");
    expect(ongoing.target_basis).toBe("period");
    expect(ongoing.end_date).toBe("");
  });
});
