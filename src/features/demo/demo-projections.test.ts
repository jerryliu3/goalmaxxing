import { afterEach, describe, expect, it, vi } from "vitest";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { buildDemoAchievements, buildDemoPublicProfile } from "@/features/demo/demo-projections";
import { buildDemoSnapshot } from "@/features/demo/demo-snapshot";
import { clearDemoStore, initDemoStore } from "@/features/demo/demo-store";

afterEach(() => {
  clearDemoStore();
  vi.useRealTimers();
});

describe("buildDemoAchievements", () => {

  it("builds a showcase payload aligned with the demo XP profile", () => {
    initDemoStore(buildDemoSnapshot("2026-08-22"));
    const payload = buildDemoAchievements();

    expect(payload.schemaVersion).toBe("3");
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

it("projects demo Growth through the canonical public profile model", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-22T12:00:00Z"));
  const snapshot = buildDemoSnapshot("2026-08-22");
  initDemoStore(snapshot);
  const bundle = buildDemoPublicProfile(snapshot.profiles[0].id, 2026);
  expect(bundle?.xp?.totalXp).toBe(2460);
  expect(bundle?.globalAchievements).toHaveLength(3);
  expect(bundle?.growSeries[0]?.date).toBe(snapshot.profiles[0].created_at.slice(0, 10));
  expect(bundle?.growSeries.at(-1)?.date).toBe("2026-08-22");
  expect(bundle?.growSeries).toHaveLength(
    differenceInCalendarDays(parseISO("2026-08-22"), parseISO(snapshot.profiles[0].created_at.slice(0, 10))) + 1,
  );
  expect(bundle?.yearHeatmap).toHaveLength(365);
  expect(bundle?.overallStats?.totalActivities).toBeGreaterThan(0);
  expect(buildDemoPublicProfile("unknown", 2026)).toBeNull();
  clearDemoStore();
});
