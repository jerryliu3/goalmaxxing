import { afterEach, describe, expect, it } from "vitest";
import { buildDemoAchievements } from "@/features/demo/demo-projections";
import { buildDemoSnapshot } from "@/features/demo/demo-snapshot";
import { clearDemoStore, initDemoStore } from "@/features/demo/demo-store";

describe("buildDemoAchievements", () => {
  afterEach(() => {
    clearDemoStore();
  });

  it("builds a showcase payload aligned with the demo XP profile", () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const payload = buildDemoAchievements();

    expect(payload.schemaVersion).toBe("2");
    expect(payload.collection.totalXp).toBe(2460);
    expect(payload.collection.unlockedAwards).toBe(3);
    expect(payload.levelAwards).toHaveLength(5);
    expect(payload.levelAwards.filter((award) => award.unlockedAt)).toHaveLength(3);
    expect(payload.levelAwards.filter((award) => !award.unlockedAt)).toHaveLength(2);
    expect(payload.personalRecords.map((record) => record.label)).toEqual([
      "Best streak",
      "Best active week",
      "Goals finished",
      "Highest level",
    ]);
    expect(payload).not.toHaveProperty("globalAchievements");
  });
});
